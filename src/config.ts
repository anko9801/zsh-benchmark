// Configuration management and validation

import { BenchmarkOptions } from "./types.ts";
import { PLUGIN_MANAGERS } from "./plugin-managers.ts";

export interface Config {
  hyperfine: {
    warmupRuns: number;
    installRuns: number;
    loadRuns: number;
    timeout: number;
  };
  paths: {
    results: string;
    templates: string;
  };
  defaults: {
    pluginCounts: number[];
    managers: string[];
  };
}

export const DEFAULT_CONFIG: Config = {
  hyperfine: {
    warmupRuns: 1,
    installRuns: 10,
    loadRuns: 20,
    timeout: 120000, // 2 minutes in ms
  },
  paths: {
    results: "./results",
    templates: "./src/templates",
  },
  defaults: {
    pluginCounts: [0, 25],
    managers: Object.keys(PLUGIN_MANAGERS),
  },
};

export function validateManagers(managers: string[]): string[] {
  const validManagers = Object.keys(PLUGIN_MANAGERS);
  const invalidManagers = managers.filter((m) => !validManagers.includes(m));

  if (invalidManagers.length > 0) {
    throw new Error(
      `Unknown managers: ${invalidManagers.join(", ")}\nValid managers: ${
        validManagers.join(", ")
      }`,
    );
  }

  return managers;
}

export function validatePluginCounts(counts: number[]): number[] {
  const invalidCounts = counts.filter((c) => c < 0 || !Number.isInteger(c));

  if (invalidCounts.length > 0) {
    throw new Error(
      `Invalid plugin counts: ${
        invalidCounts.join(", ")
      }\nPlugin counts must be non-negative integers`,
    );
  }

  return counts;
}

export function parseOptions(args: Record<string, unknown>): BenchmarkOptions {
  // Parse managers
  let managers = DEFAULT_CONFIG.defaults.managers;
  if (args.managers) {
    managers = args.managers.split(/[\s,]+/).filter(Boolean);
    managers = validateManagers(managers);
  }

  // Parse plugin counts
  let pluginCounts = DEFAULT_CONFIG.defaults.pluginCounts;
  if (args.counts) {
    pluginCounts = args.counts.split(/[\s,]+/).map(Number).filter((n) =>
      !isNaN(n)
    );
    pluginCounts = validatePluginCounts(pluginCounts);
  }

  return { managers, pluginCounts };
}
