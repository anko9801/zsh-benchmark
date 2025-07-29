// Tests for ranking engine

import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { RankingEngine } from "../ranking-engine.ts";
import { ParsedData } from "../types.ts";

const mockData: ParsedData = {
  managers: [
    {
      name: "zinit",
      results: new Map([
        [0, {
          manager: "zinit",
          pluginCount: 0,
          loadTime: 50,
          installTime: 80,
          installStddev: 5,
          loadStddev: 2,
        }],
        [25, {
          manager: "zinit",
          pluginCount: 25,
          loadTime: 485,
          installTime: 540,
          installStddev: 10,
          loadStddev: 15,
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
          loadTime: 122,
          installTime: 35,
          installStddev: 0,
          loadStddev: 5,
        }],
      ]),
    },
    {
      name: "oh-my-zsh",
      results: new Map([
        [0, {
          manager: "oh-my-zsh",
          pluginCount: 0,
          loadTime: 193,
          installTime: 152,
          installStddev: 20,
          loadStddev: 25,
        }],
        [25, {
          manager: "oh-my-zsh",
          pluginCount: 25,
          loadTime: 236,
          installTime: 352,
          installStddev: 30,
          loadStddev: 20,
        }],
      ]),
    },
  ],
  pluginCounts: [0, 25],
  timestamp: new Date(),
  environment: {},
};

Deno.test("RankingEngine assigns medals correctly", () => {
  const engine = new RankingEngine();
  const rankings = engine.calculateLoadTimeRanking(mockData, 25);

  assertEquals(rankings.length, 3);
  assertEquals(rankings[0].medal, "🥇");
  assertEquals(rankings[1].medal, "🥈");
  assertEquals(rankings[2].medal, "🥉");

  // Check correct order
  assertEquals(rankings[0].manager, "zim");
  assertEquals(rankings[1].manager, "oh-my-zsh");
  assertEquals(rankings[2].manager, "zinit");
});

Deno.test("RankingEngine handles ties correctly", () => {
  const engine = new RankingEngine();
  const tieData: ParsedData = {
    ...mockData,
    managers: [
      {
        name: "manager1",
        results: new Map([[0, {
          manager: "manager1",
          pluginCount: 0,
          loadTime: 100,
          installTime: 100,
        }]]),
      },
      {
        name: "manager2",
        results: new Map([[0, {
          manager: "manager2",
          pluginCount: 0,
          loadTime: 100,
          installTime: 100,
        }]]),
      },
      {
        name: "manager3",
        results: new Map([[0, {
          manager: "manager3",
          pluginCount: 0,
          loadTime: 200,
          installTime: 200,
        }]]),
      },
    ],
    pluginCounts: [0],
  };

  const rankings = engine.calculateLoadTimeRanking(tieData, 0);

  // Both manager1 and manager2 should have rank 1
  assertEquals(rankings[0].rank, 1);
  assertEquals(rankings[1].rank, 1);
  assertEquals(rankings[2].rank, 3); // Next rank should skip to 3
});

Deno.test("RankingEngine calculates overall ranking correctly", () => {
  const engine = new RankingEngine();
  const overallRankings = engine.calculateOverallRanking(mockData);

  assertEquals(overallRankings.length, 3);
  // zim should be first (best overall performance)
  assertEquals(overallRankings[0].manager, "zim");
  assertEquals(overallRankings[0].medal, "🥇");
});

Deno.test("RankingEngine generates complete rankings", () => {
  const engine = new RankingEngine();
  const rankings = engine.generateRankings(mockData);

  // Check structure
  assertEquals(rankings.loadTime.size, 2); // 2 plugin counts
  assertEquals(rankings.installTime.size, 2);
  assertEquals(rankings.overall.length, 3); // 3 managers

  // Check specific rankings
  const loadTime0 = rankings.loadTime.get(0);
  assertEquals(loadTime0?.length, 3);
  assertEquals(loadTime0?.[0].manager, "zim"); // zim is fastest at 0 plugins
});

Deno.test("RankingEngine percentage difference calculation", () => {
  const engine = new RankingEngine();

  assertEquals(engine.getPercentageDifference(150, 100), 50);
  assertEquals(engine.getPercentageDifference(100, 100), 0);
  assertEquals(engine.getPercentageDifference(50, 100), -50);
  assertEquals(engine.getPercentageDifference(100, 0), 0); // Handle division by zero
});
