// Tests for table builder

import {
  assertStringIncludes,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { TableBuilder } from "../table-builder.ts";
import { GitHubInfo, ParsedData, RankingResult } from "../types.ts";

const mockData: ParsedData = {
  managers: [
    {
      name: "zinit",
      results: new Map([
        [0, {
          manager: "zinit",
          pluginCount: 0,
          loadTime: 50.5,
          installTime: 80,
          installStddev: 5,
          loadStddev: 2,
        }],
        [25, {
          manager: "zinit",
          pluginCount: 25,
          loadTime: 485.3,
          installTime: 541,
          installStddev: 10,
          loadStddev: 5,
        }],
      ]),
    },
    {
      name: "zim",
      results: new Map([
        [0, {
          manager: "zim",
          pluginCount: 0,
          loadTime: 34,
          installTime: 38,
          installStddev: 1,
          loadStddev: 1,
        }],
        [25, {
          manager: "zim",
          pluginCount: 25,
          loadTime: 121.8,
          installTime: 35,
          installStddev: 2,
          loadStddev: 2,
        }],
      ]),
    },
  ],
  pluginCounts: [0, 25],
  timestamp: new Date(),
  environment: {},
};

const mockGitHubInfo: Map<string, GitHubInfo> = new Map([
  ["zinit", {
    stars: 2534,
    version: "v3.7.0",
    lastRelease: "2023-01-15",
    badge: {
      stars: "https://img.shields.io/github/stars/zdharma-continuum/zinit",
      version:
        "https://img.shields.io/github/v/release/zdharma-continuum/zinit",
    },
  }],
  ["zim", {
    stars: 3200,
    version: "v1.9.1",
    lastRelease: "2023-03-20",
    badge: {
      stars: "https://img.shields.io/github/stars/zimfw/zimfw",
      version: "https://img.shields.io/github/v/release/zimfw/zimfw",
    },
  }],
]);

Deno.test("TableBuilder formats numbers correctly", () => {
  const builder = new TableBuilder();
  const table = builder.buildComparisonTable(mockData);

  // Check that the table contains formatted numbers for 25 plugins (main focus)
  assertStringIncludes(table, "121.80"); // Load time for zim 25
  assertStringIncludes(table, "485.30"); // Load time for zinit 25
  assertStringIncludes(table, "541"); // Install time for zinit 25

  // Check 0 plugin values are also present
  assertStringIncludes(table, "50.50"); // Load time for zinit 0
  assertStringIncludes(table, "34.00"); // Load time for zim 0
});

Deno.test("TableBuilder highlights best values", () => {
  const builder = new TableBuilder();
  const table = builder.buildComparisonTable(mockData, undefined, {
    highlightBest: true,
  });

  // zim has the best 25 plugin load time (121.8) and install time (35)
  assertStringIncludes(table, "**121.80**");
  assertStringIncludes(table, "**35**");

  // zim also has best 0 plugin values
  assertStringIncludes(table, "**34.00**");
  assertStringIncludes(table, "**38**");
});

Deno.test("TableBuilder includes GitHub stars", () => {
  const builder = new TableBuilder();
  const table = builder.buildComparisonTable(mockData, mockGitHubInfo, {
    includeStars: true,
  });

  // Check headers - new format with combined columns
  assertStringIncludes(
    table,
    "| Plugin Manager | Stars | Install (25) | Load (25) |",
  );

  // Check star formatting
  assertStringIncludes(table, "2.5k"); // zinit stars
  assertStringIncludes(table, "3.2k"); // zim stars
});

Deno.test("TableBuilder ranking table", () => {
  const builder = new TableBuilder();
  const rankings: RankingResult[] = [
    { manager: "zim", score: 34, rank: 1, medal: "🥇" },
    { manager: "zinit", score: 50.5, rank: 2, medal: "🥈" },
    { manager: "oh-my-zsh", score: 193, rank: 3, medal: "🥉" },
  ];

  const table = builder.buildRankingTable(rankings, "Load Time");

  // Check structure
  assertStringIncludes(
    table,
    "| Rank | Plugin Manager | Load Time (ms) | vs Best |",
  );

  // Check medals
  assertStringIncludes(table, "| 🥇 | zim | 34.00 | - |");
  assertStringIncludes(table, "| 🥈 | zinit | 50.50 | +48.5% |");
  assertStringIncludes(table, "| 🥉 | oh-my-zsh | 193.00 | +467.6% |");
});

Deno.test("TableBuilder manager details table", () => {
  const builder = new TableBuilder();
  const managers = ["zinit", "zim", "unknown"];

  const table = builder.buildManagerDetailsTable(managers, mockGitHubInfo);

  // Check headers
  assertStringIncludes(
    table,
    "| Plugin Manager | Version | Stars | Last Release |",
  );

  // Check data
  assertStringIncludes(table, "| zinit | v3.7.0 | 2.5k | 2023-01-15 |");
  assertStringIncludes(table, "| zim | v1.9.1 | 3.2k | 2023-03-20 |");
  assertStringIncludes(table, "| unknown | N/A | N/A | N/A |");
});

Deno.test("TableBuilder handles missing data", () => {
  const builder = new TableBuilder();
  const dataWithNulls: ParsedData = {
    managers: [
      {
        name: "test",
        results: new Map([
          [0, {
            manager: "test",
            pluginCount: 0,
            loadTime: null,
            installTime: null,
          }],
          [25, {
            manager: "test",
            pluginCount: 25,
            loadTime: null,
            installTime: null,
          }],
        ]),
      },
    ],
    pluginCounts: [0, 25],
    timestamp: new Date(),
    environment: {},
  };

  const table = builder.buildComparisonTable(dataWithNulls);

  // Should show N/A for null values
  assertStringIncludes(table, "| test | N/A | N/A | N/A | N/A |");
});
