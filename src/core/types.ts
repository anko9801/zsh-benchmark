/**
 * Core type definitions for the zsh-benchmark project
 * Centralized type definitions used across all modules
 */

export interface BenchmarkData {
  timestamp: string;
  environment: {
    os: string;
    version: string;
    shell?: string;
    cpuModel?: string;
    cpuCount?: number;
    memoryGB?: number;
  };
  results: BenchmarkResult[];
  metadata?: {
    schemaVersion: number;
    benchmarkVersion: string;
    gitCommit?: string;
  };
}

export interface BenchmarkResult {
  manager: string;
  pluginCount: number;
  loadTime: number | null;
  loadStddev?: number;
  installTime: number | null;
  installStddev?: number;
  error?: string;
  
  // Interactive metrics (experimental)
  firstPromptLag?: number | null;
  firstCommandLag?: number | null;
  commandLag?: number | null;
  inputLag?: number | null;
  
  // Resource usage (experimental)
  resourceUsage?: {
    cpuPercent?: number;
    memoryMB?: number;
    diskIO?: number;
  };
}

export interface PluginManager {
  name: string;
  repo: string;
  installCommand: string;
  setupCommand?: string;
  configFile: string;
  pluginFile?: string;
  cacheDir?: string;
  supportsAsyncDetection?: boolean;
  specialInstallMeasure?: boolean;
  slowInstallManager?: boolean;
  noInstallSupport?: boolean;
}

export interface BenchmarkOptions {
  managers: string[];
  pluginCounts: number[];
  iterations: number;
  warmup: boolean;
  outputDir: string;
  debug: boolean;
  interactive: boolean;
}

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  duration: number;
}

// Chart and visualization types
export interface ChartOptions {
  width?: number;
  height?: number;
  showLegend?: boolean;
  theme?: 'light' | 'dark';
}

export interface RankingResult {
  manager: string;
  score: number;
  rank: number;
  medal?: '🥇' | '🥈' | '🥉';
}

export interface Rankings {
  loadTime: Map<number, RankingResult[]>;
  installTime: Map<number, RankingResult[]>;
  overall: RankingResult[];
}

export interface ParsedData {
  managers: Array<{
    name: string;
    results: Map<number, BenchmarkResult>;
  }>;
  pluginCounts: number[];
}

// Template and generation types
export interface TemplateData {
  title: string;
  data: BenchmarkData;
  rankings: Rankings;
  timestamp: string;
}

export interface GenerateReadmeOptions {
  inputFile: string;
  outputFile: string;
  template?: string;
  language: 'ja' | 'en';
  backup: boolean;
  debug: boolean;
  sections?: string[];
}