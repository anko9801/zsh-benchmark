// Main README generator class that orchestrates all modules

import {
  GenerateReadmeOptions,
  GraphInfo,
  ParsedData,
  Rankings,
  TemplateData,
} from "./types.ts";
import { DataParser } from "./data-parser.ts";
import { RankingEngine } from "./ranking-engine.ts";
import { TableBuilder } from "./table-builder.ts";
import { GraphHandler } from "./graph-handler.ts";
import { TemplateEngine } from "./template-engine.ts";

export class ReadmeGenerator {
  private options: GenerateReadmeOptions;
  private dataParser: DataParser;
  private rankingEngine: RankingEngine;
  private tableBuilder: TableBuilder;
  private graphHandler: GraphHandler;
  private templateEngine: TemplateEngine;

  constructor(options: GenerateReadmeOptions) {
    this.options = options;
    this.dataParser = new DataParser();
    this.rankingEngine = new RankingEngine();
    this.tableBuilder = new TableBuilder();
    this.graphHandler = new GraphHandler();
    this.templateEngine = new TemplateEngine();
  }

  async generate(): Promise<void> {
    const log = (msg: string) => this.options.debug && console.log(msg);

    log("Parsing benchmark data...");
    const parsedData = await this.dataParser.parse(this.options.inputFile!);

    log("Calculating rankings...");
    const rankings = this.rankingEngine.generateRankings(parsedData);

    log("Detecting graphs...");
    const graphs = await this.graphHandler.detectGraphs();

    // Comparison table removed per user request

    log("Preparing template data...");
    const templateData = this.prepareTemplateData(
      parsedData,
      rankings,
      graphs,
    );

    if (this.options.backup) await this.createBackup();

    log("Rendering README...");
    const readme = await this.templateEngine.render(
      templateData,
      this.options.template,
    );

    await Deno.writeTextFile(this.options.outputFile!, readme);
    log("README generation complete!");
  }

  private prepareTemplateData(
    parsedData: ParsedData,
    rankings: Rankings,
    graphs: GraphInfo[],
  ): TemplateData {
    return {
      executiveSummary: {
        executedAt: parsedData.timestamp.toISOString().split("T")[0],
        environment: this.formatEnvironment(parsedData.environment),
        keyFindings: this.generateKeyFindings(parsedData, rankings),
      },
      rankings,
      graphs,
      versionInfo: {
        managers: new Map(),
        environment: parsedData.environment,
      },
      badges: [{
        name: "License",
        url: "https://img.shields.io/badge/license-MIT-blue",
      }],
    };
  }

  private formatEnvironment(env: ParsedData["environment"]): string {
    // Check if running in GitHub Actions
    if (Deno.env.get("GITHUB_ACTIONS") === "true") {
      const runnerOs = Deno.env.get("RUNNER_OS") || "Linux";
      const runnerArch = Deno.env.get("RUNNER_ARCH") || "X64";
      return `Ubuntu 24.04 (Docker), GitHub Actions ${runnerOs}-${runnerArch} runner`;
    }
    // Default for local development
    return "Ubuntu 24.04 (Docker on macOS 15.5), MacBook Pro (2020), Intel Core i5 2GHz (4 cores), 16GB RAM";
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

    const overall = rankings.overall;
    if (overall.length > 0) {
      findings.push(
        `${overall[0].manager} が総合パフォーマンスで最高評価${
          overall[0].medal || ""
        }`,
      );
    }

    const loadTime25 = rankings.loadTime.get(25)?.[0];
    if (loadTime25) {
      findings.push(
        `25プラグイン環境では ${loadTime25.manager} が最速 (${
          Math.round(loadTime25.score)
        }ms)`,
      );
    }

    if (overall.length >= 3) {
      const ratio = (overall.at(-1)!.score / overall[0].score).toFixed(1);
      findings.push(`パフォーマンス差は最大 ${ratio}倍`);
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
