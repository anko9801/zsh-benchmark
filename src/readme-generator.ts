#!/usr/bin/env -S deno run --allow-read --allow-write
import { BenchmarkData, BenchmarkResult } from "./types.ts";
import {
  calculatePercentageIncrease,
  exists,
  formatDuration,
  formatPercentage,
  logger,
} from "./utils.ts";
import { PLUGIN_MANAGERS } from "./plugin-managers.ts";

type RankingResult = {
  manager: string;
  score: number;
  rank: number;
  medal?: "🥇" | "🥈" | "🥉";
};

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
      overallScores.set(
        manager.name,
        (overallScores.get(manager.name) || 0) +
          ((result.loadTime || 0) * 0.8 + (result.installTime || 0) * 0.2) /
            100,
      );
    }
    const assignRanks = (results: RankingResult[]) => {
      results.sort((a, b) => a.score - b.score);
      results.forEach((result, index) => {
        result.rank = index + 1;
        if (index < 3) result.medal = ["🥇", "🥈", "🥉"][index] as any;
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
  })).sort((a, b) => a.score - b.score);
  overallResults.forEach((result, index) => {
    result.rank = index + 1;
    if (index < 3) result.medal = ["🥇", "🥈", "🥉"][index] as any;
  });
  rankings.overall = overallResults;
  return rankings;
};

const buildRankingTable = (
  results: RankingResult[],
  metric: string,
  bestValue?: number,
) => [
  `| Rank | Plugin Manager | ${metric} | vs Best |`,
  "| --- | --- | ---: | ---: |",
  ...results.map((result) =>
    `| ${result.medal || `#${result.rank}`} | ${result.manager} | ${
      formatDuration(result.score)
    } | ${
      bestValue && result.score !== bestValue
        ? `+${
          formatPercentage(calculatePercentageIncrease(bestValue, result.score))
        }`
        : "-"
    } |`
  ),
];

const buildOverallTable = (results: RankingResult[]) => [
  "| Rank | Plugin Manager | Score |",
  "| --- | --- | ---: |",
  ...results.map((result) =>
    `| ${result.medal || `#${result.rank}`} | ${result.manager} | ${
      result.score.toFixed(2)
    } |`
  ),
];

export async function generateReadme(
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
    "- **Test Environment:** Ubuntu 24.04 (Docker on macOS 15.5), MacBook Pro (2020), Intel Core i5 2GHz (4 cores), 16GB RAM",
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
    ),
    "",
    "### Overall Performance",
    "",
    "**Score Calculation**: `(Load Time × 0.8) + (Install Time × 0.2)` - Lower is better",
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

if (import.meta.main) await generateReadme(Deno.args[0], Deno.args[1]);
