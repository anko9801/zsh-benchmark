// All type definitions for the benchmark project

// Plugin Manager Types
export interface PluginManager {
  name: string;
  repo: string;
  cacheCleanCommand: string;
  configFiles: { path: string; template: string; isPluginList?: boolean }[];
  generatePluginLoad: (plugin: string) => string;
  specialInit?: () => Promise<void>;
  preInstallCommand?: string | ((plugins: string[]) => Promise<void>);
  postInstallCommand?: string;
  versionCommand?: string;
  specialInstallMeasure?: boolean;
  skipInstall?: boolean;
  customInstallCommand?: string;
}

// Benchmark Types
export interface BenchmarkResult {
  manager: string;
  pluginCount: number;
  installTime: number | null;
  loadTime: number | null;
  installStddev?: number;
  loadStddev?: number;
  error?: string;
  version?: string;
}

export interface BenchmarkData {
  results: BenchmarkResult[];
  metadata?: { executedAt?: string; environment?: any };
}

// Common Types
export interface CommandResult {
  success: boolean;
  output: string;
  error: string;
}

export interface BenchmarkOptions {
  managers: string[];
  pluginCounts: number[];
}

// Chart Types
export interface ChartOptions {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
}

// README Types
export interface GenerateReadmeOptions {
  inputFile?: string;
  outputFile?: string;
  template?: string;
  language?: "ja" | "en";
  backup?: boolean;
  debug?: boolean;
  sections?: string[];
}

export interface ParsedData {
  managers: { name: string; results: Map<number, BenchmarkResult> }[];
  pluginCounts: number[];
  timestamp: Date;
  environment: any;
}

export interface RankingResult {
  manager: string;
  score: number;
  rank: number;
  medal?: "🥇" | "🥈" | "🥉";
}

export interface Rankings {
  loadTime: Map<number, RankingResult[]>;
  installTime: Map<number, RankingResult[]>;
  overall: RankingResult[];
}

export interface TemplateData {
  executiveSummary: {
    executedAt: string;
    environment: string;
    keyFindings: string[];
  };
  rankings: Rankings;
  graphs: { title: string; path: string; caption: string }[];
  versionInfo: { managers: Map<string, string>; environment: any };
  badges: { name: string; url: string }[];
}
