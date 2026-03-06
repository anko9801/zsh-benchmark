/**
 * Asynchronous process completion detection
 * Provides multiple strategies for detecting when async operations complete
 */

import { exists } from "./utils.ts";

export interface CompletionEvent {
  type: 'filesystem' | 'process' | 'network' | 'composite';
  timestamp: number;
  confidence: number;
  details: string;
}

export interface DetectionStrategy {
  name: string;
  detect: () => Promise<CompletionEvent | null>;
  cleanup?: () => Promise<void>;
}

export interface AsyncDetectorOptions {
  timeout: number; // seconds
  checkInterval: number; // milliseconds
  stabilityThreshold: number; // seconds to consider stable
  verbose: boolean;
}

const DEFAULT_OPTIONS: AsyncDetectorOptions = {
  timeout: 180,
  checkInterval: 1000,
  stabilityThreshold: 3,
  verbose: false,
};

/**
 * File system based detection - monitors for expected files
 */
export class FileSystemDetector implements DetectionStrategy {
  name = 'filesystem';
  private patterns: string[];
  private expectedCount: number;
  private options: AsyncDetectorOptions;
  private lastCount = 0;
  private stableTime = 0;

  constructor(
    patterns: string[],
    expectedCount: number,
    options: Partial<AsyncDetectorOptions> = {}
  ) {
    this.patterns = patterns;
    this.expectedCount = expectedCount;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async detect(): Promise<CompletionEvent | null> {
    const start = Date.now();
    
    while ((Date.now() - start) / 1000 < this.options.timeout) {
      const currentCount = await this.countMatchingFiles();
      
      if (this.options.verbose) {
        console.log(`FileSystem: ${currentCount}/${this.expectedCount} files found`);
      }

      // Check if count is stable
      if (currentCount === this.lastCount && currentCount >= this.expectedCount) {
        this.stableTime += this.options.checkInterval / 1000;
        
        if (this.stableTime >= this.options.stabilityThreshold) {
          return {
            type: 'filesystem',
            timestamp: Date.now(),
            confidence: 1.0,
            details: `All ${currentCount} expected files found and stable`,
          };
        }
      } else {
        this.stableTime = 0;
      }

      this.lastCount = currentCount;
      await new Promise(resolve => setTimeout(resolve, this.options.checkInterval));
    }

    // Timeout reached
    return {
      type: 'filesystem',
      timestamp: Date.now(),
      confidence: this.lastCount / this.expectedCount,
      details: `Timeout: ${this.lastCount}/${this.expectedCount} files found`,
    };
  }

  private async countMatchingFiles(): Promise<number> {
    let count = 0;
    
    for (const pattern of this.patterns) {
      try {
        // Use find command for pattern matching
        const proc = new Deno.Command("bash", {
          args: ["-c", `find ${pattern} -type f 2>/dev/null | wc -l`],
          stdout: "piped",
        });
        
        const { stdout } = await proc.output();
        const result = parseInt(new TextDecoder().decode(stdout).trim()) || 0;
        count += result;
      } catch {
        // Ignore errors
      }
    }
    
    return count;
  }
}

/**
 * Process-based detection - monitors running processes
 */
export class ProcessDetector implements DetectionStrategy {
  name = 'process';
  private processName: string;
  private expectedBehavior: 'exit' | 'idle';
  private options: AsyncDetectorOptions;
  private idleThreshold = 5; // CPU % to consider idle

  constructor(
    processName: string,
    expectedBehavior: 'exit' | 'idle' = 'idle',
    options: Partial<AsyncDetectorOptions> = {}
  ) {
    this.processName = processName;
    this.expectedBehavior = expectedBehavior;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async detect(): Promise<CompletionEvent | null> {
    const start = Date.now();
    let stableTime = 0;
    let lastState = '';

    while ((Date.now() - start) / 1000 < this.options.timeout) {
      const processInfo = await this.getProcessInfo();
      
      if (this.options.verbose) {
        console.log(`Process: ${this.processName} - ${processInfo.state}`);
      }

      if (this.expectedBehavior === 'exit' && !processInfo.running) {
        return {
          type: 'process',
          timestamp: Date.now(),
          confidence: 1.0,
          details: `Process ${this.processName} has exited`,
        };
      }

      if (this.expectedBehavior === 'idle' && processInfo.running && processInfo.cpuPercent < this.idleThreshold) {
        if (processInfo.state === lastState) {
          stableTime += this.options.checkInterval / 1000;
          
          if (stableTime >= this.options.stabilityThreshold) {
            return {
              type: 'process',
              timestamp: Date.now(),
              confidence: 0.9,
              details: `Process ${this.processName} is idle (CPU: ${processInfo.cpuPercent}%)`,
            };
          }
        } else {
          stableTime = 0;
        }
      }

      lastState = processInfo.state;
      await new Promise(resolve => setTimeout(resolve, this.options.checkInterval));
    }

    return null;
  }

  private async getProcessInfo(): Promise<{
    running: boolean;
    cpuPercent: number;
    state: string;
  }> {
    try {
      // Get process info using ps
      const proc = new Deno.Command("bash", {
        args: ["-c", `ps aux | grep -E "${this.processName}" | grep -v grep | head -1`],
        stdout: "piped",
      });
      
      const { stdout } = await proc.output();
      const output = new TextDecoder().decode(stdout).trim();
      
      if (!output) {
        return { running: false, cpuPercent: 0, state: 'not-found' };
      }

      // Parse ps output (USER PID %CPU %MEM VSZ RSS TTY STAT START TIME COMMAND)
      const parts = output.split(/\s+/);
      const cpuPercent = parseFloat(parts[2]) || 0;
      const stat = parts[7] || '';

      return {
        running: true,
        cpuPercent,
        state: `cpu:${cpuPercent}%,stat:${stat}`,
      };
    } catch {
      return { running: false, cpuPercent: 0, state: 'error' };
    }
  }
}

/**
 * Network activity detector - monitors network connections
 */
export class NetworkDetector implements DetectionStrategy {
  name = 'network';
  private threshold: number; // bytes/sec to consider inactive
  private options: AsyncDetectorOptions;
  private lastBytes = 0;
  private stableTime = 0;

  constructor(
    threshold = 1000, // 1KB/s
    options: Partial<AsyncDetectorOptions> = {}
  ) {
    this.threshold = threshold;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async detect(): Promise<CompletionEvent | null> {
    const start = Date.now();
    
    // Get initial network stats
    this.lastBytes = await this.getNetworkBytes();
    await new Promise(resolve => setTimeout(resolve, this.options.checkInterval));

    while ((Date.now() - start) / 1000 < this.options.timeout) {
      const currentBytes = await this.getNetworkBytes();
      const bytesPerSecond = (currentBytes - this.lastBytes) * 1000 / this.options.checkInterval;
      
      if (this.options.verbose) {
        console.log(`Network: ${bytesPerSecond.toFixed(0)} bytes/sec`);
      }

      if (bytesPerSecond < this.threshold) {
        this.stableTime += this.options.checkInterval / 1000;
        
        if (this.stableTime >= this.options.stabilityThreshold) {
          return {
            type: 'network',
            timestamp: Date.now(),
            confidence: 0.8,
            details: `Network activity below threshold (${bytesPerSecond.toFixed(0)} < ${this.threshold} bytes/sec)`,
          };
        }
      } else {
        this.stableTime = 0;
      }

      this.lastBytes = currentBytes;
      await new Promise(resolve => setTimeout(resolve, this.options.checkInterval));
    }

    return null;
  }

  private async getNetworkBytes(): Promise<number> {
    try {
      // Read network statistics from /proc/net/dev or netstat
      const proc = new Deno.Command("bash", {
        args: ["-c", `cat /proc/net/dev 2>/dev/null | grep -E 'eth0|en0|docker0' | awk '{print $2 + $10}' | paste -sd+ | bc`],
        stdout: "piped",
      });
      
      const { stdout } = await proc.output();
      const result = parseInt(new TextDecoder().decode(stdout).trim()) || 0;
      return result;
    } catch {
      // Fallback for macOS
      try {
        const proc = new Deno.Command("bash", {
          args: ["-c", `netstat -ib | grep -E 'en0|lo0' | awk '{print $7 + $10}' | paste -sd+ | bc`],
          stdout: "piped",
        });
        
        const { stdout } = await proc.output();
        const result = parseInt(new TextDecoder().decode(stdout).trim()) || 0;
        return result;
      } catch {
        return 0;
      }
    }
  }
}

/**
 * Composite detector - combines multiple strategies
 */
export class CompositeDetector implements DetectionStrategy {
  name = 'composite';
  private strategies: DetectionStrategy[];
  private requiredStrategies: number;
  private options: AsyncDetectorOptions;

  constructor(
    strategies: DetectionStrategy[],
    requiredStrategies = 1, // How many strategies must complete
    options: Partial<AsyncDetectorOptions> = {}
  ) {
    this.strategies = strategies;
    this.requiredStrategies = Math.min(requiredStrategies, strategies.length);
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async detect(): Promise<CompletionEvent | null> {
    const start = Date.now();
    const completedStrategies = new Set<string>();
    const events: CompletionEvent[] = [];

    while ((Date.now() - start) / 1000 < this.options.timeout) {
      // Check all strategies in parallel
      const promises = this.strategies
        .filter(s => !completedStrategies.has(s.name))
        .map(s => s.detect());

      const results = await Promise.all(promises);

      results.forEach((event, index) => {
        if (event && event.confidence > 0.5) {
          const strategy = this.strategies.filter(s => !completedStrategies.has(s.name))[index];
          completedStrategies.add(strategy.name);
          events.push(event);
          
          if (this.options.verbose) {
            console.log(`Composite: ${strategy.name} completed with confidence ${event.confidence}`);
          }
        }
      });

      if (completedStrategies.size >= this.requiredStrategies) {
        const avgConfidence = events.reduce((sum, e) => sum + e.confidence, 0) / events.length;
        return {
          type: 'composite',
          timestamp: Date.now(),
          confidence: avgConfidence,
          details: `${completedStrategies.size}/${this.strategies.length} strategies completed: ${[...completedStrategies].join(', ')}`,
        };
      }

      await new Promise(resolve => setTimeout(resolve, this.options.checkInterval));
    }

    // Partial completion
    if (events.length > 0) {
      const avgConfidence = events.reduce((sum, e) => sum + e.confidence, 0) / events.length;
      return {
        type: 'composite',
        timestamp: Date.now(),
        confidence: avgConfidence * (completedStrategies.size / this.requiredStrategies),
        details: `Timeout: ${completedStrategies.size}/${this.requiredStrategies} required strategies completed`,
      };
    }

    return null;
  }

  async cleanup(): Promise<void> {
    for (const strategy of this.strategies) {
      if (strategy.cleanup) {
        await strategy.cleanup();
      }
    }
  }
}

/**
 * Progress indicator for long-running operations
 */
export class ProgressIndicator {
  private startTime: number;
  private lastUpdate: number;
  private message: string;
  private showSpinner: boolean;
  private spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private spinnerIndex = 0;

  constructor(message: string, showSpinner = true) {
    this.startTime = Date.now();
    this.lastUpdate = Date.now();
    this.message = message;
    this.showSpinner = showSpinner;
  }

  update(progress?: { current: number; total: number; details?: string }): void {
    const now = Date.now();
    if (now - this.lastUpdate < 100) return; // Throttle updates

    const elapsed = Math.floor((now - this.startTime) / 1000);
    const spinner = this.showSpinner ? this.spinnerFrames[this.spinnerIndex++ % this.spinnerFrames.length] : '';

    let line = `\r${spinner} ${this.message} [${elapsed}s]`;

    if (progress) {
      const percent = Math.round((progress.current / progress.total) * 100);
      const barLength = 20;
      const filled = Math.round(barLength * (progress.current / progress.total));
      const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
      
      line += ` ${bar} ${percent}% (${progress.current}/${progress.total})`;
      
      if (progress.details) {
        line += ` - ${progress.details}`;
      }
    }

    // Clear line and write new content
    Deno.stdout.writeSync(new TextEncoder().encode('\r' + ' '.repeat(80) + '\r'));
    Deno.stdout.writeSync(new TextEncoder().encode(line));
    
    this.lastUpdate = now;
  }

  complete(message?: string): void {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const finalMessage = message || `${this.message} completed`;
    
    Deno.stdout.writeSync(new TextEncoder().encode('\r' + ' '.repeat(80) + '\r'));
    Deno.stdout.writeSync(new TextEncoder().encode(`✅ ${finalMessage} [${elapsed}s]\n`));
  }

  error(message: string): void {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    
    Deno.stdout.writeSync(new TextEncoder().encode('\r' + ' '.repeat(80) + '\r'));
    Deno.stdout.writeSync(new TextEncoder().encode(`❌ ${message} [${elapsed}s]\n`));
  }
}

/**
 * Enhanced async detection for zcomet
 */
export async function detectZcometCompletion(
  pluginCount: number,
  options: Partial<AsyncDetectorOptions> = {}
): Promise<CompletionEvent> {
  const progress = new ProgressIndicator('Waiting for zcomet async downloads', true);
  
  try {
    // Strategy 1: File system monitoring for .git/HEAD files
    const fsDetector = new FileSystemDetector(
      ['~/.zcomet/repos/*/HEAD', '~/.zcomet/repos/*/.git/HEAD'],
      pluginCount,
      options
    );

    // Strategy 2: Process monitoring for git processes
    const processDetector = new ProcessDetector('git', 'exit', options);

    // Strategy 3: Network activity monitoring
    const networkDetector = new NetworkDetector(1000, options); // 1KB/s threshold

    // Combine strategies
    const composite = new CompositeDetector(
      [fsDetector, processDetector, networkDetector],
      2, // Require at least 2 strategies to agree
      { ...options, verbose: true }
    );

    // Update progress periodically
    const progressInterval = setInterval(async () => {
      const count = await fsDetector['countMatchingFiles']();
      progress.update({
        current: count,
        total: pluginCount,
        details: 'Monitoring file system, processes, and network',
      });
    }, 1000);

    const result = await composite.detect();
    clearInterval(progressInterval);

    if (result && result.confidence > 0.7) {
      progress.complete(`zcomet downloads completed (confidence: ${(result.confidence * 100).toFixed(0)}%)`);
    } else {
      progress.error(`zcomet detection uncertain (confidence: ${((result?.confidence || 0) * 100).toFixed(0)}%)`);
    }

    return result || {
      type: 'composite',
      timestamp: Date.now(),
      confidence: 0,
      details: 'Detection failed',
    };
  } catch (error) {
    progress.error(`Error: ${error.message}`);
    throw error;
  }
}