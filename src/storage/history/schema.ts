/**
 * JSON schema definitions for benchmark history
 * Provides versioned schema for backwards compatibility
 */

import { BenchmarkResult } from "../../core/types.ts";

export interface HistoryMetadata {
  version: string;
  schemaVersion: number;
  createdAt: string;
  environment: {
    os: string;
    arch: string;
    cpuModel?: string;
    cpuCount?: number;
    memoryGB?: number;
    dockerVersion?: string;
    zshVersion?: string;
    denoVersion?: string;
  };
  git?: {
    commit: string;
    branch: string;
    dirty: boolean;
    author?: string;
  };
  runInfo: {
    duration: number; // milliseconds
    errors: number;
    warnings: number;
    pluginCounts: number[];
    managers: string[];
  };
}

export interface HistoryEntry {
  id: string; // UUID
  timestamp: string; // ISO 8601
  metadata: HistoryMetadata;
  results: BenchmarkResult[];
  statistics?: {
    summary: {
      [manager: string]: {
        [pluginCount: number]: {
          loadTime: StatisticsSummary;
          installTime?: StatisticsSummary;
          interactiveMetrics?: {
            firstPromptLag?: StatisticsSummary;
            firstCommandLag?: StatisticsSummary;
            commandLag?: StatisticsSummary;
            inputLag?: StatisticsSummary;
          };
        };
      };
    };
    outliers: {
      [manager: string]: {
        [metric: string]: number[]; // outlier values
      };
    };
  };
  comparisons?: {
    baseline?: string; // ID of baseline entry
    regressions: RegressionInfo[];
    improvements: ImprovementInfo[];
  };
}

export interface StatisticsSummary {
  mean: number;
  median: number;
  stddev: number;
  min: number;
  max: number;
  confidence95: {
    lower: number;
    upper: number;
  };
  sampleSize: number;
}

export interface RegressionInfo {
  manager: string;
  metric: string;
  pluginCount: number;
  oldValue: number;
  newValue: number;
  percentChange: number;
  significant: boolean;
  pValue?: number;
}

export interface ImprovementInfo extends RegressionInfo {}

export interface HistoryIndex {
  version: number;
  entries: HistoryIndexEntry[];
  lastUpdated: string;
}

export interface HistoryIndexEntry {
  id: string;
  timestamp: string;
  filename: string;
  metadata: {
    managers: string[];
    pluginCounts: number[];
    commit?: string;
    branch?: string;
  };
  size: number; // bytes
  compressed: boolean;
}

/**
 * Schema versions for migration
 */
export const SCHEMA_VERSIONS = {
  v1: 1, // Initial version
  v2: 2, // Added interactive metrics
  v3: 3, // Added resource monitoring
  CURRENT: 3,
} as const;

/**
 * Validate a history entry against the schema
 */
export function validateHistoryEntry(entry: unknown): entry is HistoryEntry {
  if (!entry || typeof entry !== 'object') return false;
  
  const e = entry as any;
  
  // Check required fields
  if (!e.id || typeof e.id !== 'string') return false;
  if (!e.timestamp || typeof e.timestamp !== 'string') return false;
  if (!e.metadata || typeof e.metadata !== 'object') return false;
  if (!Array.isArray(e.results)) return false;
  
  // Validate metadata
  const meta = e.metadata;
  if (typeof meta.version !== 'string') return false;
  if (typeof meta.schemaVersion !== 'number') return false;
  if (typeof meta.createdAt !== 'string') return false;
  
  // Validate results
  for (const result of e.results) {
    if (!result.manager || typeof result.manager !== 'string') return false;
    if (typeof result.pluginCount !== 'number') return false;
  }
  
  return true;
}

/**
 * Create a new history entry
 */
export function createHistoryEntry(
  results: BenchmarkResult[],
  metadata: Partial<HistoryMetadata> = {}
): HistoryEntry {
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  // Get environment info
  const environment = {
    os: Deno.build.os,
    arch: Deno.build.arch,
    denoVersion: Deno.version.deno,
    ...metadata.environment,
  };
  
  // Get unique managers and plugin counts
  const managers = [...new Set(results.map(r => r.manager))];
  const pluginCounts = [...new Set(results.map(r => r.pluginCount))].sort((a, b) => a - b);
  
  const entry: HistoryEntry = {
    id,
    timestamp,
    metadata: {
      version: "1.0.0",
      schemaVersion: SCHEMA_VERSIONS.CURRENT,
      createdAt: timestamp,
      environment,
      runInfo: {
        duration: 0, // Will be updated later
        errors: results.filter(r => r.error).length,
        warnings: 0,
        pluginCounts,
        managers,
      },
      ...metadata,
    },
    results,
  };
  
  return entry;
}

/**
 * Calculate statistics for a history entry
 */
export function calculateStatistics(results: BenchmarkResult[]): HistoryEntry['statistics'] {
  const summary: any = {};
  const outliers: any = {};
  
  // Group by manager and plugin count
  for (const result of results) {
    if (!summary[result.manager]) {
      summary[result.manager] = {};
    }
    
    if (!summary[result.manager][result.pluginCount]) {
      summary[result.manager][result.pluginCount] = {};
    }
    
    // Add load time stats
    if (result.loadTime !== null) {
      summary[result.manager][result.pluginCount].loadTime = {
        mean: result.loadTime,
        median: result.loadTime,
        stddev: result.loadStddev || 0,
        min: result.loadTime,
        max: result.loadTime,
        confidence95: {
          lower: result.loadTime - (result.loadStddev || 0) * 1.96,
          upper: result.loadTime + (result.loadStddev || 0) * 1.96,
        },
        sampleSize: 1,
      };
    }
    
    // Add install time stats
    if (result.installTime !== null) {
      summary[result.manager][result.pluginCount].installTime = {
        mean: result.installTime,
        median: result.installTime,
        stddev: result.installStddev || 0,
        min: result.installTime,
        max: result.installTime,
        confidence95: {
          lower: result.installTime - (result.installStddev || 0) * 1.96,
          upper: result.installTime + (result.installStddev || 0) * 1.96,
        },
        sampleSize: 1,
      };
    }
    
    // Add interactive metrics if available
    if (result.firstPromptLag !== undefined || result.commandLag !== undefined) {
      const interactive: any = {};
      
      if (result.firstPromptLag !== null && result.firstPromptLag !== undefined) {
        interactive.firstPromptLag = {
          mean: result.firstPromptLag,
          median: result.firstPromptLag,
          stddev: 0,
          min: result.firstPromptLag,
          max: result.firstPromptLag,
          confidence95: {
            lower: result.firstPromptLag,
            upper: result.firstPromptLag,
          },
          sampleSize: 1,
        };
      }
      
      if (result.firstCommandLag !== null && result.firstCommandLag !== undefined) {
        interactive.firstCommandLag = {
          mean: result.firstCommandLag,
          median: result.firstCommandLag,
          stddev: 0,
          min: result.firstCommandLag,
          max: result.firstCommandLag,
          confidence95: {
            lower: result.firstCommandLag,
            upper: result.firstCommandLag,
          },
          sampleSize: 1,
        };
      }
      
      if (result.commandLag !== null && result.commandLag !== undefined) {
        interactive.commandLag = {
          mean: result.commandLag,
          median: result.commandLag,
          stddev: 0,
          min: result.commandLag,
          max: result.commandLag,
          confidence95: {
            lower: result.commandLag,
            upper: result.commandLag,
          },
          sampleSize: 1,
        };
      }
      
      if (result.inputLag !== null && result.inputLag !== undefined) {
        interactive.inputLag = {
          mean: result.inputLag,
          median: result.inputLag,
          stddev: 0,
          min: result.inputLag,
          max: result.inputLag,
          confidence95: {
            lower: result.inputLag,
            upper: result.inputLag,
          },
          sampleSize: 1,
        };
      }
      
      summary[result.manager][result.pluginCount].interactiveMetrics = interactive;
    }
  }
  
  return { summary, outliers };
}