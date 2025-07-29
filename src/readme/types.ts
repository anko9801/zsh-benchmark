// Type definitions for README generator

import { BenchmarkResult } from "../types.ts";

// CLI Options
export interface GenerateReadmeOptions {
  inputFile?: string; // Default: results/benchmark-results-latest.json
  outputFile?: string; // Default: README.md
  template?: string; // Custom template path
  language?: "ja" | "en"; // Language setting
  backup?: boolean; // Create backup
  debug?: boolean; // Debug mode
  sections?: string[]; // Sections to display
}

// Data structures
export interface BenchmarkData {
  results: BenchmarkResult[];
  metadata?: {
    executedAt?: string;
    environment?: EnvironmentInfo;
  };
}

export interface EnvironmentInfo {
  os?: string;
  osVersion?: string;
  shell?: string;
  shellVersion?: string;
  denoVersion?: string;
  hyperfineVersion?: string;
}

export interface ParsedData {
  managers: ManagerData[];
  pluginCounts: number[];
  timestamp: Date;
  environment: EnvironmentInfo;
}

export interface ManagerData {
  name: string;
  results: Map<number, BenchmarkResult>;
}

// Ranking
export interface RankingResult {
  manager: string;
  score: number;
  rank: number;
  medal?: "🥇" | "🥈" | "🥉";
}

export interface Rankings {
  loadTime: Map<number, RankingResult[]>; // pluginCount -> rankings
  installTime: Map<number, RankingResult[]>; // pluginCount -> rankings
  overall: RankingResult[];
}


// Table generation
export interface TableOptions {
  highlightBest?: boolean;
  includeStdDev?: boolean;
}

// Template data
export interface TemplateData {
  executiveSummary: ExecutiveSummary;
  rankings: Rankings;
  comparisonTable: string;
  graphs: GraphInfo[];
  versionInfo: VersionInfo;
  badges: BadgeInfo[];
}

export interface ExecutiveSummary {
  executedAt: string;
  environment: string;
  keyFindings: string[];
}

export interface GraphInfo {
  title: string;
  path: string;
  caption: string;
}

export interface VersionInfo {
  managers: Map<string, string>;
  tools: Map<string, string>;
  environment: EnvironmentInfo;
}

export interface BadgeInfo {
  name: string;
  url: string;
}

// Plugin for extensibility
export interface ReadmePlugin {
  name: string;
  process(data: ParsedData): Promise<PluginResult>;
}

export interface PluginResult {
  section: string;
  content: string;
}
