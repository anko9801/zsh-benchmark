// Generic markdown table builder

import { ParsedData, RankingResult } from "./types.ts";
import {
  calculatePercentageIncrease,
  formatDuration,
  formatNumber,
  formatPercentage,
} from "../utils.ts";
import { PluginManager } from "../types.ts";

interface TableColumn<T> {
  header: string;
  accessor: (item: T) => string | number | null;
  formatter?: (value: any, item?: T) => string;
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
        return col.formatter ? col.formatter(value, item) : String(value ?? "N/A");
      })
    );
    
    return [
      "| " + headers.join(" | ") + " |",
      "|" + alignments.join("|") + "|",
      ...rows.map(row => "| " + row.join(" | ") + " |")
    ].join("\n");
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
        formatter: v => formatNumber(v as number, 1),
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
        formatter: v => Math.round(v as number).toString(),
        align: "right"
      },
    ];
    
    return this.buildTable(rankings, columns);
  }
  
  buildBadgeTable(rankings: RankingResult[], pluginManagers: Record<string, PluginManager>): string {
    interface BadgeRow {
      manager: string;
      repo: string;
    }
    
    const rows: BadgeRow[] = rankings
      .map(r => ({
        manager: r.manager,
        repo: pluginManagers[r.manager]?.repo || ""
      }))
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