// Main README generator class that orchestrates all modules

import {
  BadgeInfo,
  ExecutiveSummary,
  GenerateReadmeOptions,
  ParsedData,
  Rankings,
  TemplateData,
  VersionInfo,
  GitHubInfo,
  GraphInfo,
} from "./types.ts";
import { DataParser } from "./data-parser.ts";
import { RankingEngine } from "./ranking-engine.ts";
import { TableBuilder } from "./table-builder.ts";
import { GitHubAPI } from "./github-api.ts";
import { GraphHandler } from "./graph-handler.ts";
import { TemplateEngine } from "./template-engine.ts";
// Removed unused imports: createError, ErrorCode
import { PerformanceMonitor } from "./performance.ts";
import { BadgeGenerator } from "./badge-generator.ts";

export class ReadmeGenerator {
  private options: GenerateReadmeOptions;
  private dataParser: DataParser;
  private rankingEngine: RankingEngine;
  private tableBuilder: TableBuilder;
  private githubAPI: GitHubAPI;
  private graphHandler: GraphHandler;
  private templateEngine: TemplateEngine;
  private performanceMonitor: PerformanceMonitor;
  private badgeGenerator: BadgeGenerator;

  constructor(options: GenerateReadmeOptions) {
    this.options = options;
    this.dataParser = new DataParser();
    this.rankingEngine = new RankingEngine();
    this.tableBuilder = new TableBuilder();
    this.githubAPI = new GitHubAPI();
    this.graphHandler = new GraphHandler();
    this.templateEngine = new TemplateEngine();
    this.performanceMonitor = new PerformanceMonitor();
    this.badgeGenerator = new BadgeGenerator(this.githubAPI.getRepoMapping());
  }

  async generate(): Promise<void> {
    try {
      if (this.options.debug) {
        this.performanceMonitor.mark("start");
      }

      // Step 1: Parse benchmark data
      if (this.options.debug) {
        console.log("Parsing benchmark data...");
        this.performanceMonitor.mark("parse-start");
      }
      const parsedData = await this.dataParser.parse(this.options.inputFile!);
      if (this.options.debug) {
        this.performanceMonitor.measure("Data parsing", "parse-start");
      }

      // Step 2: Calculate rankings
      if (this.options.debug) {
        console.log("Calculating rankings...");
        this.performanceMonitor.mark("rankings-start");
      }
      const rankings = this.rankingEngine.generateRankings(parsedData);
      if (this.options.debug) {
        this.performanceMonitor.measure(
          "Rankings calculation",
          "rankings-start",
        );
      }

      // Step 3: Fetch GitHub information (parallel)
      if (this.options.debug) {
        console.log("Fetching GitHub information...");
        this.performanceMonitor.mark("github-start");
      }
      const managerNames = parsedData.managers.map((m) => m.name);
      const githubInfo = await this.githubAPI.fetchMultipleManagers(
        managerNames,
      );
      if (this.options.debug) {
        this.performanceMonitor.measure("GitHub API calls", "github-start");
      }

      // Step 4: Detect graphs
      if (this.options.debug) {
        console.log("Detecting graphs...");
      }
      const graphs = await this.graphHandler.detectGraphs();

      // Step 6: Build comparison table
      if (this.options.debug) {
        console.log("Building comparison table...");
      }
      const comparisonTable = this.tableBuilder.buildComparisonTable(
        parsedData,
        githubInfo,
        { highlightBest: true, includeStars: true },
      );

      // Step 7: Prepare template data
      if (this.options.debug) {
        console.log("Preparing template data...");
      }
      const templateData = await this.prepareTemplateData(
        parsedData,
        rankings,
        githubInfo,
        graphs,
        comparisonTable,
      );

      // Step 8: Create backup if needed
      if (this.options.backup) {
        await this.createBackup();
      }

      // Step 9: Render and write README
      if (this.options.debug) {
        console.log("Rendering README...");
      }
      const readme = await this.templateEngine.render(
        templateData,
        this.options.template,
      );

      // Step 10: Write to file
      await Deno.writeTextFile(this.options.outputFile!, readme);

      if (this.options.debug) {
        this.performanceMonitor.measure("Total time", "start");
        console.log("README generation complete!");
        console.log(this.performanceMonitor.getReport());
      }
    } catch (error) {
      throw error; // Re-throw to be handled by CLI
    }
  }

  private prepareTemplateData(
    parsedData: ParsedData,
    rankings: Rankings,
    githubInfo: Map<string, GitHubInfo>,
    graphs: GraphInfo[],
    comparisonTable: string,
  ): TemplateData {
    // Generate executive summary
    const executiveSummary: ExecutiveSummary = {
      executedAt: parsedData.timestamp.toISOString().split("T")[0],
      environment: this.formatEnvironment(parsedData.environment),
      keyFindings: this.generateKeyFindings(parsedData, rankings),
    };

    // Generate badges (pre-generated, not dependent on API calls)
    const badges = this.badgeGenerator.generateBadges();

    // Prepare version info
    const versionInfo: VersionInfo = {
      managers: new Map(),
      tools: new Map([
        ["Deno", Deno.version.deno],
        ["TypeScript", Deno.version.typescript],
        ["V8", Deno.version.v8],
      ]),
      environment: parsedData.environment,
    };

    // Add manager versions from GitHub
    for (const [manager, info] of githubInfo) {
      versionInfo.managers.set(manager, info.version || "N/A");
    }

    return {
      executiveSummary,
      rankings,
      comparisonTable,
      graphs,
      versionInfo,
      badges,
      githubInfo,
    };
  }

  private formatEnvironment(env: ParsedData["environment"]): string {
    const parts: string[] = [];

    if (env.os) {
      parts.push(`${env.os} ${env.osVersion || ""}`);
    }

    if (env.shell) {
      parts.push(`${env.shell} ${env.shellVersion || ""}`);
    }

    if (env.denoVersion) {
      parts.push(`Deno ${env.denoVersion}`);
    }

    return parts.join(", ").trim() || "Unknown environment";
  }

  private async createBackup(): Promise<void> {
    try {
      const stat = await Deno.stat(this.options.outputFile!);
      if (stat.isFile) {
        await Deno.copyFile(
          this.options.outputFile!,
          this.options.outputFile! + ".bak",
        );
      }
    } catch {
      // File doesn't exist, no need to backup
    }
  }

  private generateKeyFindings(data: ParsedData, rankings: Rankings): string[] {
    const findings: string[] = [];

    // Finding 1: Fastest overall
    if (rankings.overall.length > 0) {
      const fastest = rankings.overall[0];
      findings.push(
        `${fastest.manager} が総合パフォーマンスで最高評価${
          fastest.medal || ""
        }`,
      );
    }

    // Finding 2: Best for large configs
    const loadTime25 = rankings.loadTime.get(25);
    if (loadTime25 && loadTime25.length > 0) {
      const best25 = loadTime25[0];
      findings.push(
        `25プラグイン環境では ${best25.manager} が最速 (${
          Math.round(best25.score)
        }ms)`,
      );
    }

    // Finding 3: Performance range
    if (rankings.overall.length >= 3) {
      const fastest = rankings.overall[0].score;
      const slowest = rankings.overall[rankings.overall.length - 1].score;
      const ratio = (slowest / fastest).toFixed(1);
      findings.push(`パフォーマンス差は最大 ${ratio}倍`);
    }

    // Finding 4: Notable mention
    const zim = data.managers.find((m) => m.name === "zim");
    if (zim) {
      const result0 = zim.results.get(0);
      if (result0 && result0.loadTime && result0.loadTime < 40) {
        findings.push(
          `zim は最小構成で驚異的な速度 (${Math.round(result0.loadTime)}ms)`,
        );
      }
    }

    return findings;
  }
}

// Run if called directly
if (import.meta.main) {
  // Parse command line arguments
  const args = Deno.args;
  const options: GenerateReadmeOptions = {
    inputFile: "results/benchmark-results-latest.json",
    outputFile: "README.md",
    language: "ja" as const,
    backup: true,
    debug: false,
  };

  // Simple argument parsing
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--input":
      case "-i":
        options.inputFile = args[++i];
        break;
      case "--output":
      case "-o":
        options.outputFile = args[++i];
        break;
      case "--language":
      case "-l":
        options.language = args[++i] as "ja" | "en";
        break;
      case "--template":
      case "-t":
        options.template = args[++i];
        break;
      case "--no-backup":
        options.backup = false;
        break;
      case "--debug":
      case "-d":
        options.debug = true;
        break;
    }
  }

  const generator = new ReadmeGenerator(options);
  try {
    await generator.generate();
  } catch (error) {
    console.error("Error generating README:", error);
    Deno.exit(1);
  }
}
