#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net

// Main entry point for README generator

import { parse } from "https://deno.land/std@0.220.0/flags/mod.ts";
import { bold, yellow } from "https://deno.land/std@0.220.0/fmt/colors.ts";
import { BenchmarkData, BenchmarkResult } from "./types.ts";
import {
  calculatePercentageIncrease,
  exists,
  formatDuration,
  formatPercentage,
  logger,
  setupLogging,
} from "./utils.ts";
import {
  PLUGIN_MANAGERS,
  requiresSpecialTableHandling,
} from "./plugin-managers.ts";

// Options type
interface GenerateReadmeOptions {
  inputFile: string;
  outputFile: string;
  template?: string;
  language: "ja" | "en";
  backup: boolean;
  debug: boolean;
  sections?: string[];
}

// Ranking result type
type RankingResult = {
  manager: string;
  score: number;
  rank: number;
  medal?: "🥇" | "🥈" | "🥉";
};

// Data parsing functions
const parseData = (data: BenchmarkData) => {
  const managers = new Map<
    string,
    { name: string; results: Map<number, BenchmarkResult> }
  >();
  const pluginCounts = new Set<number>();
  for (const result of data.results) {
    pluginCounts.add(result.pluginCount);
    if (!managers.has(result.manager)) {
      managers.set(result.manager, {
        name: result.manager,
        results: new Map(),
      });
    }
    managers.get(result.manager)!.results.set(result.pluginCount, result);
  }
  return {
    managers: Array.from(managers.values()),
    pluginCounts: Array.from(pluginCounts).sort((a, b) => a - b),
  };
};

const calculateRankings = (parsedData: ReturnType<typeof parseData>) => {
  const rankings = {
    loadTime: new Map<number, RankingResult[]>(),
    installTime: new Map<number, RankingResult[]>(),
    overall: [] as RankingResult[],
  };
  const overallScores = new Map<string, number>();

  // 25プラグインの平均値を計算する
  let loadTimeSum = 0;
  let loadTimeCount = 0;
  let installTimeSum = 0;
  let installTimeCount = 0;

  // まず平均値を計算
  for (const manager of parsedData.managers) {
    const result = manager.results.get(25);
    if (result && result.loadTime !== null) {
      loadTimeSum += result.loadTime;
      loadTimeCount++;
    }
    if (result && result.installTime !== null) {
      installTimeSum += result.installTime;
      installTimeCount++;
    }
  }

  const loadTimeAvg = loadTimeCount > 0 ? loadTimeSum / loadTimeCount : 100;
  const installTimeAvg = installTimeCount > 0 ? installTimeSum / installTimeCount : 5000;

  for (const pluginCount of parsedData.pluginCounts) {
    const loadResults: RankingResult[] = [],
      installResults: RankingResult[] = [];
    for (const manager of parsedData.managers) {
      const result = manager.results.get(pluginCount);
      if (!result) continue;
      if (result.loadTime !== null) {
        loadResults.push({
          manager: manager.name,
          score: result.loadTime,
          rank: 0,
        });
      }
      if (result.installTime !== null && pluginCount > 0) {
        installResults.push({
          manager: manager.name,
          score: result.installTime,
          rank: 0,
        });
      }
      
      // 25プラグインの結果のみを使用してスコア計算
      if (pluginCount === 25) {
        const loadScore = (result.loadTime || 0) / loadTimeAvg;
        const installScore = (result.installTime || 0) / installTimeAvg;
        const totalScore = loadScore * 0.8 + installScore * 0.2;
        overallScores.set(manager.name, totalScore);
      }
    }
    const assignRanks = (results: RankingResult[]) => {
      results.sort((a, b) => a.score - b.score);
      results.forEach((result, index) => {
        result.rank = index + 1;
        if (index < 3) {
          result.medal = ["🥇", "🥈", "🥉"][index] as "🥇" | "🥈" | "🥉";
        }
      });
    };
    assignRanks(loadResults);
    assignRanks(installResults);
    rankings.loadTime.set(pluginCount, loadResults);
    rankings.installTime.set(pluginCount, installResults);
  }

  const overallResults = Array.from(overallScores.entries()).map((
    [manager, score],
  ) => ({
    manager,
    score,
    rank: 0,
  } as RankingResult)).sort((a, b) => a.score - b.score);
  overallResults.forEach((result, index) => {
    result.rank = index + 1;
    if (index < 3) {
      result.medal = ["🥇", "🥈", "🥉"][index] as "🥇" | "🥈" | "🥉";
    }
  });
  rankings.overall = overallResults;
  return rankings;
};

const buildRankingTable = (
  results: RankingResult[],
  metric: string,
  bestValue?: number,
  includeNAEntries = false,
  includeVanilla = false,
  vanillaTime?: number,
) => {
  const tableRows: string[] = [];

  // Add vanilla at the top if requested
  if (includeVanilla && vanillaTime !== undefined) {
    tableRows.push(
      `| - | vanilla (no plugins) | ${formatDuration(vanillaTime)} | - |`,
    );
  }

  // Add regular results
  tableRows.push(
    ...results.map((result) =>
      `| ${result.medal || `#${result.rank}`} | ${result.manager} | ${
        formatDuration(result.score)
      } | ${
        bestValue && result.score !== bestValue
          ? `+${
            formatPercentage(
              calculatePercentageIncrease(bestValue, result.score),
            )
          }`
          : "-"
      } |`
    ),
  );

  // Add N/A entries for special managers if requested
  if (includeNAEntries) {
    // Filter out special managers from regular results first
    const filteredResults = results.filter((result) =>
      !requiresSpecialTableHandling(result.manager)
    );

    // Re-rank filtered results
    filteredResults.forEach((result, index) => {
      result.rank = index + 1;
      // Re-assign medals to top 3
      if (index < 3) {
        result.medal = ["🥇", "🥈", "🥉"][index] as "🥇" | "🥈" | "🥉";
      } else {
        result.medal = undefined;
      }
    });

    // Replace regular results with filtered results
    const filteredTableRows = filteredResults.map((result) =>
      `| ${result.medal || `#${result.rank}`} | ${result.manager} | ${
        formatDuration(result.score)
      } | ${
        bestValue && result.score !== bestValue
          ? `+${
            formatPercentage(
              calculatePercentageIncrease(bestValue, result.score),
            )
          }`
          : "-"
      } |`
    );

    // Replace the regular result rows with filtered ones
    tableRows.splice(
      includeVanilla ? 1 : 0,
      results.length,
      ...filteredTableRows,
    );

    // Add N/A entries for managers that require special handling
    for (const manager of ["oh-my-zsh", "prezto", "zcomet"]) {
      if (requiresSpecialTableHandling(manager)) {
        tableRows.push(`| - | ${manager} | N/A | - |`);
      }
    }
  }

  return [
    `| Rank | Plugin Manager | ${metric} | vs Best |`,
    "| --- | --- | ---: | ---: |",
    ...tableRows,
  ];
};

const buildOverallTable = (results: RankingResult[]) => {
  // Filter out special managers from rankings first
  const filteredResults = results.filter((result) =>
    !requiresSpecialTableHandling(result.manager)
  );

  // Re-rank and re-assign medals after filtering
  filteredResults.forEach((result, index) => {
    result.rank = index + 1;
    if (index < 3) {
      result.medal = ["🥇", "🥈", "🥉"][index] as "🥇" | "🥈" | "🥉";
    } else {
      result.medal = undefined;
    }
  });

  const tableRows = filteredResults.map((result) =>
    `| ${result.medal || `#${result.rank}`} | ${result.manager} | ${
      result.score.toFixed(2)
    } |`
  );

  // Add N/A entries for managers that require special handling
  for (const manager of ["oh-my-zsh", "prezto", "zcomet"]) {
    if (requiresSpecialTableHandling(manager)) {
      tableRows.push(`| - | ${manager} | N/A |`);
    }
  }

  return [
    "| Rank | Plugin Manager | Score |",
    "| --- | --- | ---: |",
    ...tableRows,
  ];
};

// Core README generation function
async function generateReadme(
  input = "./results/benchmark-results-latest.json",
  output = "./README.md",
) {
  if (!await exists(input)) throw new Error(`File not found: ${input}`);

  const data: BenchmarkData = JSON.parse(await Deno.readTextFile(input));
  const parsedData = parseData(data);
  const rankings = calculateRankings(parsedData);
  const date = new Date().toISOString().split("T")[0];
  const best = rankings.loadTime.get(25)?.[0];
  const worst = rankings.loadTime.get(25)?.slice(-1)[0];
  const diff = best && worst ? (worst.score / best.score).toFixed(1) : "N/A";

  // Get vanilla (0 plugins) load time
  const vanillaTime = rankings.loadTime.get(0)?.[0]?.score;

  const content = [
    "# Zsh Plugin Manager Benchmark Results",
    "",
    "![License](https://img.shields.io/badge/license-MIT-blue)",
    "![Benchmark Status](https://img.shields.io/badge/benchmark%20status-automated-brightgreen)",
    `![Last Updated](https://img.shields.io/badge/last%20updated-${date}-blue)`,
    "",
    "## 📊 Executive Summary",
    "",
    `- **Benchmark Date:** ${date}`,
    "- **Test Environment:** Ubuntu 24.04 (Docker on GitHub Actions), 4 vCPUs, 16GB RAM",
    "- **Key Findings:**",
    `  - ${rankings.overall[0].manager} が総合パフォーマンスで最高評価🥇`,
    `  - 25プラグイン環境では ${best?.manager} が最速 (${
      best ? Math.round(best.score) : 0
    }ms)`,
    `  - パフォーマンス差は最大 ${diff}倍`,
    "",
    "## 🏆 Performance Rankings (25 Plugins)",
    "",
    "### Load Time Rankings",
    "",
    "![Load Time Comparison](results/load-time-comparison-chart.svg)",
    "_Shell startup time comparison across different plugin managers_",
    "",
    ...buildRankingTable(
      rankings.loadTime.get(25) || [],
      "Time (ms)",
      best?.score,
      false, // Don't include N/A entries for load time table
      true, // Include vanilla at the top
      vanillaTime, // Pass the actual vanilla load time
    ),
    "",
    "### Installation Time Rankings",
    "",
    "![Installation Time Comparison](results/install-time-comparison-chart.svg)",
    "_Plugin installation time comparison across different plugin managers_",
    "",
    ...buildRankingTable(
      rankings.installTime.get(25) || [],
      "Time (ms)",
      rankings.installTime.get(25)?.[0]?.score,
      true, // Include N/A entries for oh-my-zsh and prezto
    ),
    "",
    "### Overall Performance",
    "",
    "**Score Calculation**: `(Load Time / Load Time Average × 0.8) + (Install Time / Install Time Average × 0.2)` - Lower is better",
    "",
    ...buildOverallTable(rankings.overall),
    "",
    "## 📦 Plugin Managers",
    "",
    "| Plugin Manager | Stars | Version | Last Updated |",
    "| --- | --- | --- | --- |",
    ...Object.entries(PLUGIN_MANAGERS).map(([name, pluginManager]) =>
      `| ${name} | ![stars](https://img.shields.io/github/stars/${pluginManager.repo}?style=social) | ![Version](https://img.shields.io/github/v/tag/${pluginManager.repo}?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/${pluginManager.repo}?style=flat&label=updated) |`
    ),
    "",
    "## 📝 Methodology",
    "",
    "Benchmarks were performed using:",
    "",
    "- **Tool:** hyperfine (statistical benchmarking tool)",
    "- **Iterations:** 10 runs per test",
    "- **Plugin Sets:** 0 plugins (baseline) and 25 plugins (typical setup)",
    "- **Metrics:** Installation time and shell startup time",
    "- **Environment:** Clean installation for each test",
    "",
    "## 🤝 Contributing",
    "",
    "Found an issue or want to add your plugin manager? Please open an issue or PR!",
    "",
    "---",
    "",
    `_Generated by [zsh-benchmark](https://github.com/your-repo/zsh-benchmark) on ${date}_`,
  ].join("\n");

  await Deno.writeTextFile(output, content);
  logger.info(`✅ README generated: ${output}`);
}

// Default options
const DEFAULT_OPTIONS: GenerateReadmeOptions = {
  inputFile: "results/benchmark-results-latest.json",
  outputFile: "README.md",
  language: "ja",
  backup: true,
  debug: false,
};

// Parse command line arguments
function parseArgs(args: string[]): GenerateReadmeOptions {
  const flags = parse(args, {
    string: ["input", "output", "template", "language", "sections"],
    boolean: ["help", "backup", "debug", "no-backup"],
    alias: {
      i: "input",
      o: "output",
      t: "template",
      l: "language",
      h: "help",
      d: "debug",
    },
    default: {
      input: DEFAULT_OPTIONS.inputFile,
      output: DEFAULT_OPTIONS.outputFile,
      language: DEFAULT_OPTIONS.language,
      backup: DEFAULT_OPTIONS.backup,
      debug: DEFAULT_OPTIONS.debug,
    },
  });

  if (flags.help) {
    printHelp();
    Deno.exit(0);
  }

  return {
    inputFile: (flags.input as string) || DEFAULT_OPTIONS.inputFile,
    outputFile: (flags.output as string) || DEFAULT_OPTIONS.outputFile,
    template: flags.template as string | undefined,
    language: (flags.language as "ja" | "en") || DEFAULT_OPTIONS.language,
    backup: flags["no-backup"]
      ? false
      : (flags.backup as boolean ?? DEFAULT_OPTIONS.backup),
    debug: flags.debug as boolean ?? DEFAULT_OPTIONS.debug,
    sections: flags.sections
      ? (flags.sections as string).split(",")
      : undefined,
  };
}

// Print help message
function printHelp(): void {
  console.log(`
${bold("Zsh Benchmark README Generator")}

${yellow("Usage:")}
  deno task generate-readme [options]

${yellow("Options:")}
  -i, --input <file>      Input JSON file (default: results/benchmark-results-latest.json)
  -o, --output <file>     Output markdown file (default: README.md)
  -t, --template <file>   Custom template file
  -l, --language <lang>   Language: ja or en (default: ja)
  --sections <list>       Comma-separated list of sections to include
  --backup               Create backup of existing README (default: true)
  --no-backup            Don't create backup
  -d, --debug            Enable debug output
  -h, --help             Show this help

${yellow("Examples:")}
  # Generate with default settings
  deno task generate-readme

  # Use custom input and output files
  deno task generate-readme -i results/custom.json -o BENCHMARK.md

  # Use English language
  deno task generate-readme -l en

  # Include only specific sections
  deno task generate-readme --sections rankings,comparison,recommendations
`);
}

// Main function
async function main(): Promise<void> {
  const options = parseArgs(Deno.args);

  if (options.debug) {
    await setupLogging("DEBUG");
    logger.debug("Debug mode enabled");
    logger.debug(`Options: ${JSON.stringify(options)}`);
  }

  logger.info(bold("🚀 Generating README from benchmark results..."));

  try {
    // Create backup if requested
    if (options.backup && await exists(options.outputFile)) {
      await Deno.copyFile(options.outputFile, `${options.outputFile}.bak`);
      logger.info(yellow(`📁 Backup saved as ${options.outputFile}.bak`));
    }

    // Generate README
    await generateReadme(options.inputFile, options.outputFile);

    logger.info(`✅ README successfully generated at ${options.outputFile}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Error: ${errorMessage}`);
    if (options.debug && error instanceof Error) {
      console.error(error.stack);
    }
    Deno.exit(1);
  }
}

// Helper function to check if file exists
async function _fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

// Run main function
if (import.meta.main) {
  main();
}
