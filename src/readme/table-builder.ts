// Generic markdown table builder

import { ParsedData, RankingResult } from "./types.ts";
import {
  calculatePercentageIncrease,
  formatDuration,
  formatNumber,
  formatPercentage,
} from "../utils.ts";

interface TableColumn<T> {
  header: string;
  accessor: (item: T) => string | number | null;
  formatter?: (value: any) => string;
  align?: "left" | "center" | "right";
}

export class TableBuilder {
  buildTable<T>(
    data: T[],
    columns: TableColumn<T>[],
  ): string {
    const headers = columns.map(col => col.header);
    const alignments = columns.map(col => 
      col.align === "right" ? "---:" : 
      col.align === "center" ? ":---:" : 
      "---"
    );
    
    const rows = data.map(item => 
      columns.map(col => {
        const value = col.accessor(item);
        return col.formatter ? col.formatter(value) : String(value ?? "N/A");
      })
    );
    
    return [
      "| " + headers.join(" | ") + " |",
      "|" + alignments.join("|") + "|",
      ...rows.map(row => "| " + row.join(" | ") + " |")
    ].join("\n");
  }
  
  buildComparisonTable(data: ParsedData, options: { highlightBest?: boolean } = {}): string {
    const { highlightBest = true } = options;
    
    // Sort by 25 plugin load time
    const sorted = [...data.managers].sort((a, b) => {
      const resultA = a.results.get(25);
      const resultB = b.results.get(25);
      if (!resultA?.loadTime) return 1;
      if (!resultB?.loadTime) return -1;
      return resultA.loadTime - resultB.loadTime;
    }).filter(m => m.results.get(25));
    
    // Collect best values
    const getBestValues = (pluginCount: number, metric: "installTime" | "loadTime") => {
      const values = sorted
        .map(m => m.results.get(pluginCount)?.[metric])
        .filter((v): v is number => v !== null && v !== undefined);
      return values.length ? Math.min(...values) : null;
    };
    
    const best = {
      install25: getBestValues(25, "installTime"),
      load25: getBestValues(25, "loadTime"),
      install0: getBestValues(0, "installTime"),
      load0: getBestValues(0, "loadTime"),
    };
    
    const formatTime = (value: number | null | undefined, decimals: number, bestValue: number | null) => {
      if (value === null || value === undefined) return "N/A";
      const formatted = formatDuration(value, decimals).replace("ms", "");
      return highlightBest && value === bestValue ? `**${formatted}**` : formatted;
    };
    
    const columns: TableColumn<typeof sorted[0]>[] = [
      { header: "Plugin Manager", accessor: m => m.name },
      { 
        header: "Install (25)", 
        accessor: m => m.results.get(25)?.installTime ?? null,
        formatter: v => formatTime(v, 0, best.install25),
        align: "right"
      },
      { 
        header: "Load (25)", 
        accessor: m => m.results.get(25)?.loadTime ?? null,
        formatter: v => formatTime(v, 2, best.load25),
        align: "right"
      },
      { 
        header: "Install (0)", 
        accessor: m => m.results.get(0)?.installTime ?? null,
        formatter: v => formatTime(v, 0, best.install0),
        align: "right"
      },
      { 
        header: "Load (0)", 
        accessor: m => m.results.get(0)?.loadTime ?? null,
        formatter: v => formatTime(v, 2, best.load0),
        align: "right"
      },
    ];
    
    return this.buildTable(sorted, columns);
  }
  
  buildRankingTable(
    rankings: RankingResult[],
    metric: string,
    pluginCount?: number,
  ): string {
    if (!rankings.length) return "";
    
    const best = rankings[0].score;
    const title = metric;
    
    const columns: TableColumn<RankingResult>[] = [
      { header: "Rank", accessor: r => r.medal || `#${r.rank}` },
      { header: "Plugin Manager", accessor: r => r.manager },
      { 
        header: `${title} (ms)`, 
        accessor: r => r.score,
        formatter: v => formatNumber(v as number, 2),
        align: "right"
      },
      { 
        header: "vs Best", 
        accessor: r => r.rank === 1 ? "-" : calculatePercentageIncrease(best, r.score),
        formatter: v => v === "-" ? v : `+${formatPercentage(v as number)}`,
        align: "right"
      },
    ];
    
    return this.buildTable(rankings, columns);
  }
  
  buildOverallRankingTable(rankings: RankingResult[]): string {
    if (!rankings.length) return "";
    
    const columns: TableColumn<RankingResult>[] = [
      { header: "Rank", accessor: r => r.medal || `#${r.rank}` },
      { header: "Plugin Manager", accessor: r => r.manager },
      { 
        header: "Score", 
        accessor: r => r.score,
        formatter: v => formatNumber(v as number, 2),
        align: "right"
      },
    ];
    
    return this.buildTable(rankings, columns);
  }
  
  buildBadgeTable(rankings: RankingResult[], repoMapping: Map<string, string>): string {
    interface BadgeRow {
      manager: string;
      repo: string;
    }
    
    const rows: BadgeRow[] = rankings
      .map(r => ({ manager: r.manager, repo: repoMapping.get(r.manager) || "" }))
      .filter(r => r.repo);
    
    const columns: TableColumn<BadgeRow>[] = [
      { header: "Plugin Manager", accessor: r => r.manager },
      { 
        header: "Stars", 
        accessor: r => r.repo,
        formatter: repo => `![stars](https://img.shields.io/github/stars/${repo}?style=social)`
      },
      { 
        header: "Version", 
        accessor: r => r.repo,
        formatter: repo => `![Version](https://img.shields.io/github/v/tag/${repo}?include_prereleases&sort=semver&label=version&fallback=commit)`
      },
      { 
        header: "Last Updated", 
        accessor: r => r.repo,
        formatter: repo => `![Last Update](https://img.shields.io/github/last-commit/${repo}?style=flat&label=updated)`
      },
    ];
    
    return this.buildTable(rows, columns);
  }
}