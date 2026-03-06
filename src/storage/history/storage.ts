/**
 * History storage implementation
 * Manages versioned benchmark results with compression and indexing
 */

import { ensureDir, exists } from "https://deno.land/std@0.220.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.220.0/path/mod.ts";
import { compress, decompress } from "https://deno.land/x/compress@v0.4.5/gzip/mod.ts";
import { 
  HistoryEntry, 
  HistoryIndex, 
  HistoryIndexEntry,
  validateHistoryEntry,
  createHistoryEntry,
  calculateStatistics,
} from "./schema.ts";
import { BenchmarkData } from "../../core/types.ts";

export interface StorageOptions {
  baseDir: string;
  compressAfterDays: number;
  maxEntries: number;
  indexFile: string;
}

const DEFAULT_OPTIONS: StorageOptions = {
  baseDir: "./results/history",
  compressAfterDays: 7,
  maxEntries: 1000,
  indexFile: "index.json",
};

export class BenchmarkHistoryStorage {
  private options: StorageOptions;
  private index: HistoryIndex;

  constructor(options: Partial<StorageOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.index = { version: 1, entries: [], lastUpdated: "" };
  }

  /**
   * Initialize storage and load index
   */
  async init(): Promise<void> {
    await ensureDir(this.options.baseDir);
    await this.loadIndex();
  }

  /**
   * Save benchmark results to history
   */
  async save(data: BenchmarkData): Promise<string> {
    const entry = createHistoryEntry(data.results, {
      git: await this.getGitInfo(),
    });

    // Calculate statistics
    entry.statistics = calculateStatistics(data.results);

    // Generate filename
    const date = new Date();
    const filename = `benchmark-${date.toISOString().slice(0, 10)}-${entry.id.slice(0, 8)}.json`;
    const filepath = join(this.options.baseDir, filename);

    // Save entry
    await Deno.writeTextFile(filepath, JSON.stringify(entry, null, 2));

    // Update index
    await this.addToIndex({
      id: entry.id,
      timestamp: entry.timestamp,
      filename,
      metadata: {
        managers: entry.metadata.runInfo.managers,
        pluginCounts: entry.metadata.runInfo.pluginCounts,
        commit: entry.metadata.git?.commit,
        branch: entry.metadata.git?.branch,
      },
      size: new TextEncoder().encode(JSON.stringify(entry)).length,
      compressed: false,
    });

    // Compress old entries
    await this.compressOldEntries();

    // Cleanup if needed
    await this.cleanup();

    return filename;
  }

  /**
   * Get history entries for a time range
   */
  async getHistory(days: number): Promise<HistoryEntry[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const entries: HistoryEntry[] = [];
    
    for (const indexEntry of this.index.entries) {
      const entryDate = new Date(indexEntry.timestamp);
      if (entryDate >= cutoffDate) {
        const entry = await this.loadEntry(indexEntry);
        if (entry) {
          entries.push(entry);
        }
      }
    }
    
    return entries.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get a specific entry by ID
   */
  async getEntry(id: string): Promise<HistoryEntry | null> {
    const indexEntry = this.index.entries.find(e => e.id === id);
    if (!indexEntry) return null;
    
    return await this.loadEntry(indexEntry);
  }

  /**
   * Get the latest entry
   */
  async getLatest(): Promise<HistoryEntry | null> {
    if (this.index.entries.length === 0) return null;
    
    const latest = this.index.entries
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    return await this.loadEntry(latest);
  }

  /**
   * Compare two versions
   */
  async compareVersions(id1: string, id2: string): Promise<VersionComparison> {
    const [entry1, entry2] = await Promise.all([
      this.getEntry(id1),
      this.getEntry(id2),
    ]);

    if (!entry1 || !entry2) {
      throw new Error("One or both entries not found");
    }

    const comparison: VersionComparison = {
      id1,
      id2,
      timestamp1: entry1.timestamp,
      timestamp2: entry2.timestamp,
      changes: [],
      summary: {
        regressions: 0,
        improvements: 0,
        unchanged: 0,
      },
    };

    // Compare each manager and plugin count combination
    for (const result1 of entry1.results) {
      const result2 = entry2.results.find(
        r => r.manager === result1.manager && r.pluginCount === result1.pluginCount
      );

      if (!result2) continue;

      // Compare load times
      if (result1.loadTime !== null && result2.loadTime !== null) {
        const change = this.calculateChange(
          result1.loadTime,
          result2.loadTime,
          result1.loadStddev,
          result2.loadStddev
        );
        
        if (change.significant) {
          comparison.changes.push({
            manager: result1.manager,
            pluginCount: result1.pluginCount,
            metric: "loadTime",
            ...change,
          });

          if (change.percentChange > 0) {
            comparison.summary.regressions++;
          } else {
            comparison.summary.improvements++;
          }
        } else {
          comparison.summary.unchanged++;
        }
      }

      // Compare install times
      if (result1.installTime !== null && result2.installTime !== null) {
        const change = this.calculateChange(
          result1.installTime,
          result2.installTime,
          result1.installStddev,
          result2.installStddev
        );
        
        if (change.significant) {
          comparison.changes.push({
            manager: result1.manager,
            pluginCount: result1.pluginCount,
            metric: "installTime",
            ...change,
          });

          if (change.percentChange > 0) {
            comparison.summary.regressions++;
          } else {
            comparison.summary.improvements++;
          }
        } else {
          comparison.summary.unchanged++;
        }
      }
    }

    return comparison;
  }

  /**
   * Archive old results
   */
  async archiveOldResults(olderThan: Date): Promise<void> {
    const archiveDir = join(this.options.baseDir, "archive");
    await ensureDir(archiveDir);

    const entriesToArchive = this.index.entries.filter(
      entry => new Date(entry.timestamp) < olderThan
    );

    for (const entry of entriesToArchive) {
      const sourcePath = join(this.options.baseDir, entry.filename);
      const destPath = join(archiveDir, entry.filename);

      if (await exists(sourcePath)) {
        await Deno.rename(sourcePath, destPath);
      }

      // Remove from index
      const index = this.index.entries.indexOf(entry);
      if (index > -1) {
        this.index.entries.splice(index, 1);
      }
    }

    await this.saveIndex();
  }

  // Private methods

  private async loadIndex(): Promise<void> {
    const indexPath = join(this.options.baseDir, this.options.indexFile);
    
    if (await exists(indexPath)) {
      try {
        const content = await Deno.readTextFile(indexPath);
        this.index = JSON.parse(content);
      } catch (error) {
        console.error("Failed to load index, creating new one:", error);
        this.index = { version: 1, entries: [], lastUpdated: "" };
      }
    }
  }

  private async saveIndex(): Promise<void> {
    this.index.lastUpdated = new Date().toISOString();
    const indexPath = join(this.options.baseDir, this.options.indexFile);
    await Deno.writeTextFile(indexPath, JSON.stringify(this.index, null, 2));
  }

  private async addToIndex(entry: HistoryIndexEntry): Promise<void> {
    this.index.entries.push(entry);
    await this.saveIndex();
  }

  private async loadEntry(indexEntry: HistoryIndexEntry): Promise<HistoryEntry | null> {
    const filepath = join(this.options.baseDir, indexEntry.filename);
    
    try {
      let content: string;
      
      if (indexEntry.compressed) {
        const compressed = await Deno.readFile(filepath);
        const decompressed = decompress(compressed);
        content = new TextDecoder().decode(decompressed);
      } else {
        content = await Deno.readTextFile(filepath);
      }
      
      const entry = JSON.parse(content);
      
      if (validateHistoryEntry(entry)) {
        return entry;
      } else {
        console.error(`Invalid history entry: ${indexEntry.filename}`);
        return null;
      }
    } catch (error) {
      console.error(`Failed to load entry ${indexEntry.filename}:`, error);
      return null;
    }
  }

  private async compressOldEntries(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.options.compressAfterDays);

    for (const entry of this.index.entries) {
      if (entry.compressed) continue;
      
      const entryDate = new Date(entry.timestamp);
      if (entryDate < cutoffDate) {
        const filepath = join(this.options.baseDir, entry.filename);
        
        try {
          const content = await Deno.readTextFile(filepath);
          const compressed = compress(new TextEncoder().encode(content));
          
          const compressedFilename = entry.filename.replace('.json', '.json.gz');
          const compressedPath = join(this.options.baseDir, compressedFilename);
          
          await Deno.writeFile(compressedPath, compressed);
          await Deno.remove(filepath);
          
          entry.filename = compressedFilename;
          entry.compressed = true;
          entry.size = compressed.length;
        } catch (error) {
          console.error(`Failed to compress ${entry.filename}:`, error);
        }
      }
    }

    await this.saveIndex();
  }

  private async cleanup(): Promise<void> {
    if (this.index.entries.length <= this.options.maxEntries) return;

    // Sort by timestamp, oldest first
    const sorted = [...this.index.entries].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const toRemove = sorted.slice(0, sorted.length - this.options.maxEntries);

    for (const entry of toRemove) {
      const filepath = join(this.options.baseDir, entry.filename);
      
      try {
        await Deno.remove(filepath);
      } catch {
        // File might already be deleted
      }
      
      const index = this.index.entries.indexOf(entry);
      if (index > -1) {
        this.index.entries.splice(index, 1);
      }
    }

    await this.saveIndex();
  }

  private async getGitInfo(): Promise<any> {
    try {
      const commit = await this.runGitCommand("rev-parse HEAD");
      const branch = await this.runGitCommand("rev-parse --abbrev-ref HEAD");
      const status = await this.runGitCommand("status --porcelain");
      const author = await this.runGitCommand("log -1 --pretty=%an");

      return {
        commit: commit.trim(),
        branch: branch.trim(),
        dirty: status.length > 0,
        author: author.trim(),
      };
    } catch {
      return undefined;
    }
  }

  private async runGitCommand(args: string): Promise<string> {
    const proc = new Deno.Command("git", {
      args: args.split(" "),
      stdout: "piped",
    });
    
    const { stdout } = await proc.output();
    return new TextDecoder().decode(stdout);
  }

  private calculateChange(
    oldValue: number,
    newValue: number,
    oldStddev?: number,
    newStddev?: number
  ): {
    oldValue: number;
    newValue: number;
    difference: number;
    percentChange: number;
    significant: boolean;
  } {
    const difference = newValue - oldValue;
    const percentChange = (difference / oldValue) * 100;
    
    // Simple significance test based on standard deviations
    let significant = Math.abs(percentChange) > 5; // Default threshold
    
    if (oldStddev && newStddev) {
      const combinedStddev = Math.sqrt(oldStddev ** 2 + newStddev ** 2);
      significant = Math.abs(difference) > 2 * combinedStddev;
    }

    return {
      oldValue,
      newValue,
      difference,
      percentChange,
      significant,
    };
  }
}

export interface VersionComparison {
  id1: string;
  id2: string;
  timestamp1: string;
  timestamp2: string;
  changes: Array<{
    manager: string;
    pluginCount: number;
    metric: string;
    oldValue: number;
    newValue: number;
    difference: number;
    percentChange: number;
    significant: boolean;
  }>;
  summary: {
    regressions: number;
    improvements: number;
    unchanged: number;
  };
}