// Ranking engine for benchmark results

import { ParsedData, RankingResult, Rankings } from "./types.ts";
import { calculatePercentageIncrease } from "../utils.ts";

export class RankingEngine {
  calculateLoadTimeRanking(
    data: ParsedData,
    pluginCount: number,
  ): RankingResult[] {
    const rankings: RankingResult[] = [];

    // Collect results for specific plugin count
    for (const manager of data.managers) {
      const result = manager.results.get(pluginCount);
      if (result && result.loadTime !== null) {
        rankings.push({
          manager: manager.name,
          score: result.loadTime,
          rank: 0, // Will be assigned later
        });
      }
    }

    // Sort by load time (ascending - faster is better)
    rankings.sort((a, b) => a.score - b.score);

    // Assign ranks and medals
    this.assignRanks(rankings);
    this.assignMedals(rankings);

    return rankings;
  }

  calculateInstallTimeRanking(
    data: ParsedData,
    pluginCount: number,
  ): RankingResult[] {
    const rankings: RankingResult[] = [];

    // Collect results for specific plugin count
    for (const manager of data.managers) {
      const result = manager.results.get(pluginCount);
      if (result && result.installTime !== null) {
        rankings.push({
          manager: manager.name,
          score: result.installTime,
          rank: 0,
        });
      }
    }

    // Sort by install time (ascending - faster is better)
    rankings.sort((a, b) => a.score - b.score);

    // Assign ranks and medals
    this.assignRanks(rankings);
    this.assignMedals(rankings);

    return rankings;
  }

  calculateOverallRanking(data: ParsedData): RankingResult[] {
    const overallScores = new Map<string, { total: number; count: number }>();

    // Calculate average performance across all plugin counts
    for (const manager of data.managers) {
      let totalScore = 0;
      let count = 0;

      for (const [_, result] of manager.results) {
        // Weight calculation: 70% load time, 30% install time
        const loadWeight = 0.7;
        const installWeight = 0.3;

        if (result.loadTime !== null) {
          totalScore += result.loadTime * loadWeight;
          count += loadWeight;
        }

        if (result.installTime !== null) {
          totalScore += result.installTime * installWeight;
          count += installWeight;
        }
      }

      if (count > 0) {
        overallScores.set(manager.name, { total: totalScore, count });
      }
    }

    // Convert to rankings
    const rankings: RankingResult[] = [];
    for (const [manager, scores] of overallScores) {
      rankings.push({
        manager,
        score: scores.total / scores.count, // Average weighted score
        rank: 0,
      });
    }

    // Sort by score (ascending - lower is better)
    rankings.sort((a, b) => a.score - b.score);

    // Assign ranks and medals
    this.assignRanks(rankings);
    this.assignMedals(rankings);

    return rankings;
  }

  generateRankings(data: ParsedData): Rankings {
    const rankings: Rankings = {
      loadTime: new Map(),
      installTime: new Map(),
      overall: [],
    };

    // Calculate rankings for each plugin count
    for (const count of data.pluginCounts) {
      rankings.loadTime.set(count, this.calculateLoadTimeRanking(data, count));
      rankings.installTime.set(
        count,
        this.calculateInstallTimeRanking(data, count),
      );
    }

    // Calculate overall ranking
    rankings.overall = this.calculateOverallRanking(data);

    return rankings;
  }

  private assignRanks(rankings: RankingResult[]): void {
    let currentRank = 1;

    for (let i = 0; i < rankings.length; i++) {
      if (i > 0 && rankings[i].score !== rankings[i - 1].score) {
        currentRank = i + 1;
      }
      rankings[i].rank = currentRank;
    }
  }

  private assignMedals(rankings: RankingResult[]): void {
    // Only assign medals to top 3
    if (rankings.length >= 1 && rankings[0].rank === 1) {
      rankings[0].medal = "🥇";
    }
    if (rankings.length >= 2 && rankings[1].rank <= 2) {
      rankings[1].medal = "🥈";
    }
    if (rankings.length >= 3 && rankings[2].rank <= 3) {
      rankings[2].medal = "🥉";
    }
  }

  // Helper method to get the best performer for a metric
  getBestPerformer(rankings: RankingResult[]): RankingResult | undefined {
    return rankings.find((r) => r.rank === 1);
  }

  // Helper method to calculate percentage difference from best
  getPercentageDifference(value: number, bestValue: number): number {
    if (bestValue === 0) return 0;
    return calculatePercentageIncrease(bestValue, value);
  }
}
