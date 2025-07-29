// Shared type definitions for the benchmark project

export interface PluginManager {
  name: string;
  cacheCleanCommand: string;
  configFiles: ConfigFile[];
  specialInit?: () => Promise<void>;
  generatePluginLoad: (plugin: string) => string;
  preInstallCommand?: string | ((plugins: string[]) => Promise<void>);
  postInstallCommand?: string;
}

export interface ConfigFile {
  path: string;
  template: string;
  isPluginList?: boolean;
}

export interface BenchmarkResult {
  manager: string;
  pluginCount: number;
  installTime: number | null;
  loadTime: number | null;
  installStddev?: number;
  loadStddev?: number;
  error?: string;
}

export interface BenchmarkData {
  results: BenchmarkResult[];
}

export interface CommandResult {
  success: boolean;
  output: string;
  error: string;
}

export interface BenchmarkOptions {
  managers: string[];
  pluginCounts: number[];
}

export interface ChartOptions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}