// Template engine for README generation

import { TemplateData, VersionInfo } from "./types.ts";
import {
  calculatePercentageIncrease,
  formatNumber,
  formatPercentage,
} from "../utils.ts";
import { BadgeGenerator } from "./badge-generator.ts";

export class TemplateEngine {
  private badgeGenerator: BadgeGenerator;
  
  constructor() {
    // Initialize with empty repo mapping - we'll use predefined data
    this.badgeGenerator = new BadgeGenerator(new Map());
  }
  
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

    // Remove comparison table placeholder if still present
    result = result.replace("{{comparisonTable}}", "");

    // Replace individual graphs
    const loadTimeGraph = data.graphs.find(g => g.path.includes("load-time"));
    const installTimeGraph = data.graphs.find(g => g.path.includes("install-time"));
    
    if (loadTimeGraph) {
      result = result.replace(
        "{{loadTimeGraph}}",
        `![${loadTimeGraph.title}](${loadTimeGraph.path})\n_${loadTimeGraph.caption}_`
      );
    } else {
      result = result.replace("{{loadTimeGraph}}", "");
    }
    
    if (installTimeGraph) {
      result = result.replace(
        "{{installTimeGraph}}",
        `![${installTimeGraph.title}](${installTimeGraph.path})\n_${installTimeGraph.caption}_`
      );
    } else {
      result = result.replace("{{installTimeGraph}}", "");
    }

    // Replace manager badges
    result = result.replace(
      "{{managerBadges}}",
      this.formatManagerBadges(data),
    );
    
    // Replace environment badges
    result = result.replace(
      "{{environmentBadges}}",
      this.formatEnvironmentBadges(data.versionInfo),
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

    sections.push("| Rank | Plugin Manager | Score |");
    sections.push("|------|----------------|-------|");

    for (const ranking of rankings) {
      const rank = `#${ranking.rank}`;
      const medal = ranking.medal || "-";
      const displayRank = ranking.medal || rank;
      sections.push(
        `| ${displayRank} | ${ranking.manager} | ${
          formatNumber(ranking.score, 2)
        } |`,
      );
    }

    return sections.join("\n");
  }

  private formatVersionInfo(versionInfo: VersionInfo): string {
    const badges: string[] = [];

    // Tools badges
    for (const [tool, version] of versionInfo.tools) {
      const color = tool === "Deno" ? "black" : tool === "TypeScript" ? "blue" : "green";
      const logo = tool === "Deno" ? "deno" : tool === "TypeScript" ? "typescript" : "v8";
      badges.push(
        `![${tool}](https://img.shields.io/badge/${tool.replace(" ", "%20")}-v${version.replace("-", "--")}-${color}?logo=${logo}&logoColor=white)`
      );
    }

    // Environment badges
    if (versionInfo.environment.os) {
      const osName = versionInfo.environment.os === "darwin" ? "macOS" : versionInfo.environment.os;
      const osVersion = versionInfo.environment.osVersion || "";
      badges.push(
        `![OS](https://img.shields.io/badge/OS-${osName}%20${osVersion}-lightgray?logo=apple&logoColor=white)`
      );
    }

    if (versionInfo.environment.shell) {
      const shellVersion = versionInfo.environment.shellVersion || "";
      badges.push(
        `![Shell](https://img.shields.io/badge/Shell-${versionInfo.environment.shell}%20${shellVersion}-orange?logo=gnu-bash&logoColor=white)`
      );
    }

    // Plugin managers table with version badges
    const sections: string[] = [];
    sections.push(badges.join(" "));
    sections.push("");
    sections.push("### Plugin Manager Versions");
    sections.push("");
    
    const managerBadges: string[] = [];
    for (const [manager, version] of versionInfo.managers) {
      if (version !== "N/A") {
        managerBadges.push(
          `![${manager}](https://img.shields.io/badge/${manager}-${version}-blue)`
        );
      }
    }
    
    // Split manager badges into groups of 4 for readability
    for (let i = 0; i < managerBadges.length; i += 4) {
      sections.push(managerBadges.slice(i, i + 4).join(" "));
    }

    return sections.join("\n");
  }

  private formatManagerBadges(data: TemplateData): string {
    const sections: string[] = [];
    const badges: string[] = [];
    
    const repoMapping = new Map([
      ["alf", "psyrendust/alf"],
      ["antibody", "getantibody/antibody"],
      ["antidote", "mattmc3/antidote"],
      ["antigen", "zsh-users/antigen"],
      ["antigen-hs", "Tarrasch/antigen-hs"],
      ["oh-my-zsh", "ohmyzsh/ohmyzsh"],
      ["prezto", "sorin-ionescu/prezto"],
      ["sheldon", "rossmacarthur/sheldon"],
      ["zcomet", "agkozak/zcomet"],
      ["zgen", "tarjoilija/zgen"],
      ["zgenom", "jandamm/zgenom"],
      ["zim", "zimfw/zimfw"],
      ["zinit", "zdharma-continuum/zinit"],
      ["znap", "marlonrichert/zsh-snap"],
      ["zplug", "zplug/zplug"],
      ["zpm", "zpm-zsh/zpm"],
      ["zr", "jedahan/zr"],
    ]);
    
    // Get star counts and sort by stars
    const managersWithStars = data.rankings.overall.map(ranking => {
      const manager = ranking.manager;
      const stars = this.badgeGenerator.getStarCount(manager) || 0;
      return { manager, stars };
    }).sort((a, b) => b.stars - a.stars);
    
    // Calculate max name length for alignment
    const maxNameLength = Math.max(...managersWithStars.map(m => m.manager.length));
    
    for (const { manager, stars } of managersWithStars) {
      const repo = repoMapping.get(manager);
      if (!repo) continue;
      
      // Get version from predefined data
      const version = this.badgeGenerator.getVersion(manager) || "N/A";
      
      // Pad manager name for alignment
      const paddedManager = manager.padEnd(maxNameLength);
      
      // Get last release from predefined data
      const lastRelease = this.badgeGenerator.getLastRelease(manager) || "N/A";
      
      // Create a line for each manager with aligned formatting
      let managerLine = `| ${paddedManager} | `;
      
      // Stars badge - use GitHub social style (first)
      managerLine += `![stars](https://img.shields.io/github/stars/${repo}?style=social) | `;
      
      // Version badge (second)
      if (version !== "N/A") {
        // Clean version string (remove 'v' prefix for consistency)
        const cleanVersion = version.startsWith('v') ? version.substring(1) : version;
        managerLine += `![version](https://img.shields.io/badge/v-${cleanVersion}-blue) | `;
      } else {
        managerLine += `![version](https://img.shields.io/badge/v-N/A-gray) | `;
      }
      
      // Last release badge (third) - use GitHub last-commit API
      managerLine += `![GitHub last commit](https://img.shields.io/github/last-commit/${repo}) |`;
      
      sections.push(managerLine);
    }
    
    // Add table header
    sections.unshift("| Plugin Manager | Stars | Version | Last Release |");
    sections.splice(1, 0, "|" + "-".repeat(maxNameLength + 2) + "|-------|---------|--------------|");
    
    return sections.join("\n");
  }
  
  private formatEnvironmentBadges(versionInfo: VersionInfo): string {
    const badges: string[] = [];

    // Tools badges
    for (const [tool, version] of versionInfo.tools) {
      const color = tool === "Deno" ? "black" : tool === "TypeScript" ? "blue" : "green";
      const logo = tool === "Deno" ? "deno" : tool === "TypeScript" ? "typescript" : "v8";
      badges.push(
        `![${tool}](https://img.shields.io/badge/${tool.replace(" ", "%20")}-v${version.replace("-", "--")}-${color}?logo=${logo}&logoColor=white)`
      );
    }

    // Environment badges
    if (versionInfo.environment.os) {
      const osName = versionInfo.environment.os === "darwin" ? "macOS" : versionInfo.environment.os;
      const osVersion = versionInfo.environment.osVersion || "";
      badges.push(
        `![OS](https://img.shields.io/badge/OS-${osName}%20${osVersion}-lightgray?logo=apple&logoColor=white)`
      );
    }

    if (versionInfo.environment.shell) {
      const shellVersion = versionInfo.environment.shellVersion || "";
      badges.push(
        `![Shell](https://img.shields.io/badge/Shell-${versionInfo.environment.shell}%20${shellVersion}-orange?logo=gnu-bash&logoColor=white)`
      );
    }

    return badges.join(" ");
  }
  
  private formatStars(stars: number): string {
    if (stars >= 1000) {
      return `${(stars / 1000).toFixed(1)}k`;
    }
    return stars.toString();
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
