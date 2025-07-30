// Template engine for README generation

import { TemplateData } from "./types.ts";
import { TableBuilder } from "./table-builder.ts";
import { PLUGIN_MANAGERS } from "../plugin-managers.ts";

export class TemplateEngine {
  private tableBuilder: TableBuilder;
  
  constructor() {
    this.tableBuilder = new TableBuilder();
  }

  async render(data: TemplateData, templatePath?: string): Promise<string> {
    // Load template
    let template: string;
    if (templatePath) {
      try {
        template = await Deno.readTextFile(templatePath);
      } catch (error) {
        console.warn(`Failed to load custom template: ${error}`);
        template = await Deno.readTextFile(new URL("./templates/default.md", import.meta.url).pathname);
      }
    } else {
      template = await Deno.readTextFile(new URL("./templates/default.md", import.meta.url).pathname);
    }
    
    // Replace placeholders
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
    const loadTimeRankings = data.rankings.loadTime.get(25);
    result = result.replace(
      "{{loadTimeRankings}}",
      loadTimeRankings?.length ? this.tableBuilder.buildRankingTable(loadTimeRankings, "Time", 25) : "No ranking data available",
    );
    
    const installTimeRankings = data.rankings.installTime.get(25);
    result = result.replace(
      "{{installTimeRankings}}",
      installTimeRankings?.length ? this.tableBuilder.buildRankingTable(installTimeRankings, "Time", 25) : "No ranking data available",
    );
    
    result = result.replace(
      "{{overallRankings}}",
      this.tableBuilder.buildOverallRankingTable(data.rankings.overall),
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
      this.tableBuilder.buildBadgeTable(data.rankings.overall, PLUGIN_MANAGERS),
    );

    // Replace any remaining executedAt placeholders
    result = result.replace(
      /\{\{executedAt\}\}/g,
      data.executiveSummary.executedAt,
    );

    return result;
  }
}
