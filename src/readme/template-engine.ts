// Template engine for README generation

import { TemplateData } from "./types.ts";
import {
  calculatePercentageIncrease,
  formatNumber,
  formatPercentage,
} from "../utils.ts";

export class TemplateEngine {
  constructor() {
    // No initialization needed - badges are generated via shields.io
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
    } catch (error) {
      throw new Error(`Failed to load template: ${error}`);
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
      data.executiveSummary.keyFindings.join("\n  - "),
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
    const loadTimeGraph = data.graphs.find((g) => g.path.includes("load-time"));
    const installTimeGraph = data.graphs.find((g) =>
      g.path.includes("install-time")
    );

    if (loadTimeGraph) {
      result = result.replace(
        "{{loadTimeGraph}}",
        `![${loadTimeGraph.title}](${loadTimeGraph.path})\n_${loadTimeGraph.caption}_`,
      );
    } else {
      result = result.replace("{{loadTimeGraph}}", "");
    }

    if (installTimeGraph) {
      result = result.replace(
        "{{installTimeGraph}}",
        `![${installTimeGraph.title}](${installTimeGraph.path})\n_${installTimeGraph.caption}_`,
      );
    } else {
      result = result.replace("{{installTimeGraph}}", "");
    }

    // Replace manager badges
    result = result.replace(
      "{{managerBadges}}",
      this.formatManagerBadges(data),
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
    const rankings = data.rankings[type].get(25);
    if (!rankings?.length) return "No ranking data available";

    const best = rankings[0].score;
    return [
      "| Rank | Plugin Manager | Time (ms) | vs Best |",
      "|------|----------------|-----------|---------|",
      ...rankings.map((r) =>
        `| ${r.medal || `#${r.rank}`} | ${r.manager} | ${
          formatNumber(r.score, 2)
        } | ${
          r.rank === 1
            ? "-"
            : `+${formatPercentage(calculatePercentageIncrease(best, r.score))}`
        } |`
      ),
    ].join("\n");
  }

  private formatOverallRankings(data: TemplateData): string {
    const rankings = data.rankings.overall;
    const sections: string[] = [];

    sections.push("| Rank | Plugin Manager | Score |");
    sections.push("|------|----------------|-------|");

    for (const ranking of rankings) {
      const rank = `#${ranking.rank}`;
      const displayRank = ranking.medal || rank;
      sections.push(
        `| ${displayRank} | ${ranking.manager} | ${
          formatNumber(ranking.score, 2)
        } |`,
      );
    }

    return sections.join("\n");
  }

  private formatManagerBadges(data: TemplateData): string {
    const sections: string[] = [];

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

    // Sort by overall ranking (already sorted)
    const managersWithStars = data.rankings.overall.map((ranking) => {
      const manager = ranking.manager;
      return { manager };
    });

    // Calculate max name length for alignment
    const maxNameLength = Math.max(
      ...managersWithStars.map((m) => m.manager.length),
    );

    for (const { manager } of managersWithStars) {
      const repo = repoMapping.get(manager);
      if (!repo) continue;

      // Pad manager name for alignment
      const paddedManager = manager.padEnd(maxNameLength);

      // Create a line for each manager with aligned formatting
      let managerLine = `| ${paddedManager} | `;

      // Stars badge - use GitHub social style (first)
      managerLine +=
        `![stars](https://img.shields.io/github/stars/${repo}?style=social) | `;

      // Version badge (second) - show release/tag or indicate commit-based version
      // This shows the latest tag/release, or "commit" if none exists
      managerLine +=
        `![Version](https://img.shields.io/github/v/tag/${repo}?include_prereleases&sort=semver&label=version&fallback=commit) | `;

      // Last commit badge (third) - show shortened commit SHA
      const [owner, repoName] = repo.split('/');
      managerLine +=
        `![Commit](https://img.shields.io/badge/dynamic/json?url=https://api.github.com/repos/${owner}/${repoName}/commits/HEAD&query=$.sha&label=commit&color=blue&style=flat) |`;

      sections.push(managerLine);
    }

    // Add table header
    sections.unshift("| Plugin Manager | Stars | Version | Last Commit |");
    sections.splice(
      1,
      0,
      "|" + "-".repeat(maxNameLength + 2) +
        "|-------|---------|-------------|",
    );

    return sections.join("\n");
  }
}
