// Table builder for markdown tables

import {
  ParsedData,
  RankingResult,
  TableOptions,
} from "./types.ts";
import {
  calculatePercentageIncrease,
  formatDuration,
  formatNumber,
  formatPercentage,
} from "../utils.ts";

export class TableBuilder {
  buildComparisonTable(
    data: ParsedData,
    options: TableOptions = {},
  ): string {
    const {
      highlightBest = true,
      includeStdDev = false,
    } = options;

    const lines: string[] = [];

    // Build header - combine 0 and 25 plugins in same table
    const headers = ["Plugin Manager"];
    // 25 plugins columns (main focus)
    headers.push("Install (25)", "Load (25)");
    // 0 plugins columns (secondary)
    headers.push("Install (0)", "Load (0)");
    if (includeStdDev) {
      headers.push("Install StdDev (25)", "Load StdDev (25)");
    }

    lines.push("| " + headers.join(" | ") + " |");
    lines.push("|" + headers.map(() => "---").join("|") + "|");

    // Collect all values for finding best
    const allInstallTimes25: number[] = [];
    const allLoadTimes25: number[] = [];
    const allInstallTimes0: number[] = [];
    const allLoadTimes0: number[] = [];

    for (const manager of data.managers) {
      const result25 = manager.results.get(25);
      const result0 = manager.results.get(0);

      if (result25) {
        if (result25.installTime !== null) {
          allInstallTimes25.push(result25.installTime);
        }
        if (result25.loadTime !== null) allLoadTimes25.push(result25.loadTime);
      }
      if (result0) {
        if (result0.installTime !== null) {
          allInstallTimes0.push(result0.installTime);
        }
        if (result0.loadTime !== null) allLoadTimes0.push(result0.loadTime);
      }
    }

    // Build rows - sort by 25 plugin load time (main metric)
    const sortedManagers = [...data.managers].sort((a, b) => {
      const resultA = a.results.get(25);
      const resultB = b.results.get(25);
      if (!resultA || resultA.loadTime === null) return 1;
      if (!resultB || resultB.loadTime === null) return -1;
      return resultA.loadTime - resultB.loadTime;
    });

    for (const manager of sortedManagers) {
      const result25 = manager.results.get(25);
      const result0 = manager.results.get(0);

      // Skip if no 25 plugin data (since that's our main focus)
      if (!result25) continue;

      const row: string[] = [manager.name];


      // 25 plugins - Install time
      if (result25.installTime !== null) {
        const installTimeStr = formatDuration(result25.installTime, 0).replace(
          "ms",
          "",
        );
        if (
          highlightBest &&
          this.isBestValue(result25.installTime, allInstallTimes25)
        ) {
          row.push(`**${installTimeStr}**`);
        } else {
          row.push(installTimeStr);
        }
      } else {
        row.push("N/A");
      }

      // 25 plugins - Load time
      if (result25.loadTime !== null) {
        const loadTimeStr = formatDuration(result25.loadTime, 2).replace(
          "ms",
          "",
        );
        if (
          highlightBest && this.isBestValue(result25.loadTime, allLoadTimes25)
        ) {
          row.push(`**${loadTimeStr}**`);
        } else {
          row.push(loadTimeStr);
        }
      } else {
        row.push("N/A");
      }

      // 0 plugins - Install time
      if (result0 && result0.installTime !== null) {
        const installTimeStr = formatDuration(result0.installTime, 0).replace(
          "ms",
          "",
        );
        if (
          highlightBest &&
          this.isBestValue(result0.installTime, allInstallTimes0)
        ) {
          row.push(`**${installTimeStr}**`);
        } else {
          row.push(installTimeStr);
        }
      } else {
        row.push("N/A");
      }

      // 0 plugins - Load time
      if (result0 && result0.loadTime !== null) {
        const loadTimeStr = formatDuration(result0.loadTime, 2).replace(
          "ms",
          "",
        );
        if (
          highlightBest && this.isBestValue(result0.loadTime, allLoadTimes0)
        ) {
          row.push(`**${loadTimeStr}**`);
        } else {
          row.push(loadTimeStr);
        }
      } else {
        row.push("N/A");
      }

      // Add standard deviations if requested (25 plugins only)
      if (includeStdDev) {
        row.push(
          result25.installStddev
            ? formatNumber(result25.installStddev, 2)
            : "N/A",
        );
        row.push(
          result25.loadStddev ? formatNumber(result25.loadStddev, 2) : "N/A",
        );
      }

      lines.push("| " + row.join(" | ") + " |");
    }

    return lines.join("\n");
  }

  buildRankingTable(
    rankings: RankingResult[],
    metric: string,
    pluginCount?: number,
  ): string {
    const lines: string[] = [];
    const title = pluginCount !== undefined
      ? `${metric} (${pluginCount} plugins)`
      : metric;

    lines.push(`| Rank | Plugin Manager | ${title} (ms) | vs Best |`);
    lines.push("|------|----------------|-----------:|--------:|");

    if (rankings.length === 0) return lines.join("\n");

    const best = rankings[0].score;

    for (const ranking of rankings) {
      const rank = ranking.medal || `#${ranking.rank}`;
      const scoreStr = formatNumber(ranking.score, 2);
      const vsBest = ranking.rank === 1
        ? "-"
        : `+${
          formatPercentage(calculatePercentageIncrease(best, ranking.score))
        }`;

      lines.push(`| ${rank} | ${ranking.manager} | ${scoreStr} | ${vsBest} |`);
    }

    return lines.join("\n");
  }


  private isBestValue(value: number, allValues: number[]): boolean {
    if (allValues.length === 0) return false;
    const min = Math.min(...allValues);
    return value === min;
  }

  private highlightBest(value: number, allValues: number[]): string {
    const formatted = formatNumber(value, 2);
    if (this.isBestValue(value, allValues)) {
      return `**${formatted}**`;
    }
    return formatted;
  }
}
