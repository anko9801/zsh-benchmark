// Ranking engine for benchmark results

import { ParsedData, RankingResult, Rankings } from "./types.ts";
import { calculatePercentageIncrease } from "../utils.ts";

export class RankingEngine {
  private calculateRanking(
    data: ParsedData,
    pluginCount: number,
    metric: "loadTime" | "installTime",
  ): RankingResult[] {
    const rankings = data.managers
      .map((manager) => {
        // Skip oh-my-zsh and prezto for install time rankings
        if (metric === "installTime" && pluginCount === 25 && 
            (manager.name === "oh-my-zsh" || manager.name === "prezto")) {
          return null;
        }
        const result = manager.results.get(pluginCount);
        const score = result?.[metric];
        return score !== null && score !== undefined
          ? { manager: manager.name, score, rank: 0 }
          : null;
      })
      .filter((r): r is RankingResult => r !== null)
      .sort((a, b) => a.score - b.score);

    this.assignRanks(rankings);
    this.assignMedals(rankings);
    return rankings;
  }

  calculateLoadTimeRanking(
    data: ParsedData,
    pluginCount: number,
  ): RankingResult[] {
    return this.calculateRanking(data, pluginCount, "loadTime");
  }

  calculateInstallTimeRanking(
    data: ParsedData,
    pluginCount: number,
  ): RankingResult[] {
    return this.calculateRanking(data, pluginCount, "installTime");
  }

  calculateOverallRanking(data: ParsedData): RankingResult[] {
    const rankings = data.managers
      .map((manager) => {
        // Skip oh-my-zsh and prezto for overall ranking
        if (manager.name === "oh-my-zsh" || manager.name === "prezto") {
          return null;
        }
        
        const scores = Array.from(manager.results.values())
          .flatMap((r) => [
            r.loadTime !== null ? { score: r.loadTime, weight: 0.8 } : null,
            r.installTime !== null
              ? { score: r.installTime, weight: 0.2 }
              : null,
          ])
          .filter((s): s is { score: number; weight: number } => s !== null);

        const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
        const weightedSum = scores.reduce(
          (sum, s) => sum + s.score * s.weight,
          0,
        );

        return totalWeight > 0
          ? { manager: manager.name, score: weightedSum / totalWeight, rank: 0 }
          : null;
      })
      .filter((r): r is RankingResult => r !== null)
      .sort((a, b) => a.score - b.score);

    this.assignRanks(rankings);
    this.assignMedals(rankings);
    return rankings;
  }

  generateRankings(data: ParsedData): Rankings {
    return {
      loadTime: new Map(
        data.pluginCounts.map(
          (count) => [count, this.calculateLoadTimeRanking(data, count)],
        ),
      ),
      installTime: new Map(
        data.pluginCounts.map(
          (count) => [count, this.calculateInstallTimeRanking(data, count)],
        ),
      ),
      overall: this.calculateOverallRanking(data),
    };
  }

  private assignRanks(rankings: RankingResult[]): void {
    rankings.forEach((r, i) => {
      r.rank = i > 0 && r.score === rankings[i - 1].score
        ? rankings[i - 1].rank
        : i + 1;
    });
  }

  private assignMedals(rankings: RankingResult[]): void {
    const medals: ("🥇" | "🥈" | "🥉")[] = ["🥇", "🥈", "🥉"];
    rankings.slice(0, 3).forEach((r, i) => {
      if (r.rank <= i + 1) r.medal = medals[i];
    });
  }

  getBestPerformer = (rankings: RankingResult[]) =>
    rankings.find((r) => r.rank === 1);

  getPercentageDifference = (value: number, bestValue: number) =>
    bestValue === 0 ? 0 : calculatePercentageIncrease(bestValue, value);
}
