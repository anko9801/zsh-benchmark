// Template engine for README generation

import { TemplateData, VersionInfo } from "./types.ts";
import {
  calculatePercentageIncrease,
  formatNumber,
  formatPercentage,
} from "../utils.ts";

export class TemplateEngine {
  async render(data: TemplateData, templatePath?: string): Promise<string> {
    const template = await this.loadTemplate(templatePath);
    return this.replacePlaceholders(template, data);
  }

  private async loadTemplate(path?: string): Promise<string> {
    if (path) {
      try {
        return await Deno.readTextFile(path);
      } catch (error) {
        console.warn(`Failed to load custom template: ${error}`);
      }
    }

    // Load default template
    try {
      const defaultPath =
        new URL("./templates/default.md", import.meta.url).pathname;
      return await Deno.readTextFile(defaultPath);
    } catch {
      // Fallback to embedded template
      return this.getDefaultTemplate();
    }
  }

  private replacePlaceholders(template: string, data: TemplateData): string {
    let result = template;

    // Replace badges - split into multiple lines for readability
    const badgesPerLine = 6;
    const badgeGroups: string[] = [];
    
    for (let i = 0; i < data.badges.length; i += badgesPerLine) {
      const group = data.badges
        .slice(i, i + badgesPerLine)
        .map((badge) => `![${badge.name}](${badge.url})`)
        .join(" ");
      badgeGroups.push(group);
    }
    
    const badgesMarkdown = badgeGroups.join("\n");
    result = result.replace("{{badges}}", badgesMarkdown);

    // Replace executive summary
    result = result.replace("{{executedAt}}", data.executiveSummary.executedAt);
    result = result.replace(
      "{{environment}}",
      data.executiveSummary.environment,
    );
    result = result.replace(
      "{{keyFindings}}",
      data.executiveSummary.keyFindings.join("\n- "),
    );

    // Replace rankings
    result = result.replace(
      "{{loadTimeRankings}}",
      this.formatRankings(data, "loadTime"),
    );
    result = result.replace(
      "{{installTimeRankings}}",
      this.formatRankings(data, "installTime"),
    );
    result = result.replace(
      "{{overallRankings}}",
      this.formatOverallRankings(data),
    );

    // Replace comparison table
    result = result.replace("{{comparisonTable}}", data.comparisonTable);

    // Replace graphs
    const graphsMarkdown = data.graphs
      .map((g) => `### ${g.title}\n![${g.title}](${g.path})\n_${g.caption}_`)
      .join("\n\n");
    result = result.replace("{{graphs}}", graphsMarkdown);

    // Replace version info
    result = result.replace(
      "{{versionInfo}}",
      this.formatVersionInfo(data.versionInfo),
    );

    // Replace any remaining executedAt placeholders
    result = result.replace(
      /\{\{executedAt\}\}/g,
      data.executiveSummary.executedAt,
    );

    return result;
  }

  private formatRankings(
    data: TemplateData,
    type: "loadTime" | "installTime",
  ): string {
    const sections: string[] = [];
    const rankingsMap = data.rankings[type];

    // Focus on 25 plugins only
    const rankings25 = rankingsMap.get(25);
    if (!rankings25 || rankings25.length === 0) {
      return "No ranking data available";
    }

    sections.push("| Rank | Plugin Manager | Time (ms) | vs Best |");
    sections.push("|------|----------------|-----------|---------|");

    const best = rankings25[0]?.score || 0;
    for (const ranking of rankings25) {
      const rank = ranking.medal || `#${ranking.rank}`;
      const vsBest = ranking.rank === 1
        ? "-"
        : `+${
          formatPercentage(calculatePercentageIncrease(best, ranking.score))
        }`;
      sections.push(
        `| ${rank} | ${ranking.manager} | ${
          formatNumber(ranking.score, 2)
        } | ${vsBest} |`,
      );
    }

    return sections.join("\n");
  }

  private formatOverallRankings(data: TemplateData): string {
    const rankings = data.rankings.overall;
    const sections: string[] = [];

    sections.push("| Rank | Plugin Manager | Score | Medal |");
    sections.push("|------|----------------|-------|-------|");

    for (const ranking of rankings) {
      const rank = `#${ranking.rank}`;
      const medal = ranking.medal || "-";
      sections.push(
        `| ${rank} | ${ranking.manager} | ${
          formatNumber(ranking.score, 2)
        } | ${medal} |`,
      );
    }

    return sections.join("\n");
  }

  private formatVersionInfo(versionInfo: VersionInfo): string {
    const sections: string[] = [];

    sections.push("### Plugin Managers");
    sections.push("| Manager | Version |");
    sections.push("|---------|---------|");

    for (const [manager, version] of versionInfo.managers) {
      sections.push(`| ${manager} | ${version} |`);
    }

    sections.push("\n### Tools");
    sections.push("| Tool | Version |");
    sections.push("|------|---------|");

    for (const [tool, version] of versionInfo.tools) {
      sections.push(`| ${tool} | ${version} |`);
    }

    if (versionInfo.environment.os) {
      sections.push(
        `\n**OS:** ${versionInfo.environment.os} ${
          versionInfo.environment.osVersion || ""
        }`,
      );
    }
    if (versionInfo.environment.shell) {
      sections.push(
        `**Shell:** ${versionInfo.environment.shell} ${
          versionInfo.environment.shellVersion || ""
        }`,
      );
    }

    return sections.join("\n");
  }

  private getDefaultTemplate(): string {
    return `# Zsh Plugin Manager Benchmark Results

{{badges}}

## 📊 Executive Summary

- **Benchmark Date:** {{executedAt}}
- **Test Environment:** {{environment}}
- **Key Findings:**
  - {{keyFindings}}

## 🏆 Performance Rankings

### Load Time Rankings

{{loadTimeRankings}}

### Installation Time Rankings

{{installTimeRankings}}

### Overall Performance

{{overallRankings}}

## 📈 Detailed Comparison

### Performance Metrics

{{comparisonTable}}

### Visual Analysis

{{graphs}}

## 💡 Recommendations

### For Speed-Focused Users
{{speedRecommendation}}

### For Feature-Rich Setup
{{featureRecommendation}}

### Balanced Approach
{{balancedRecommendation}}

## 🔍 Plugin Manager Characteristics


## 📦 Version Information

{{versionInfo}}

---
_Generated by [zsh-benchmark](https://github.com/your-repo/zsh-benchmark)_
`;
  }
}
