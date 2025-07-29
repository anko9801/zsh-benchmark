// Main README generator class that orchestrates all modules

import {
  GenerateReadmeOptions,
  ParsedData,
  Rankings,
  TemplateData,
  GraphInfo,
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
    
    log("Building comparison table...");
    const comparisonTable = this.tableBuilder.buildComparisonTable(parsedData, { highlightBest: true });
    
    log("Preparing template data...");
    const templateData = this.prepareTemplateData(parsedData, rankings, graphs, comparisonTable);
    
    if (this.options.backup) await this.createBackup();
    
    log("Rendering README...");
    const readme = await this.templateEngine.render(templateData, this.options.template);
    
    await Deno.writeTextFile(this.options.outputFile!, readme);
    log("README generation complete!");
  }

  private prepareTemplateData(
    parsedData: ParsedData,
    rankings: Rankings,
    graphs: GraphInfo[],
    comparisonTable: string,
  ): TemplateData {
    return {
      executiveSummary: {
        executedAt: parsedData.timestamp.toISOString().split("T")[0],
        environment: this.formatEnvironment(parsedData.environment),
        keyFindings: this.generateKeyFindings(parsedData, rankings),
      },
      rankings,
      comparisonTable,
      graphs,
      versionInfo: {
        managers: new Map(),
        tools: new Map(Object.entries(Deno.version).filter(([k]) => ['deno', 'typescript', 'v8'].includes(k))),
        environment: parsedData.environment,
      },
      badges: [{ name: "License", url: "https://img.shields.io/badge/license-MIT-blue" }],
    };
  }

  private formatEnvironment(env: ParsedData["environment"]): string {
    const parts = [
      env.os && `${env.os} ${env.osVersion || ""}`.trim(),
      env.shell && `${env.shell} ${env.shellVersion || ""}`.trim(),
      env.denoVersion && `Deno ${env.denoVersion}`,
    ].filter(Boolean);
    return parts.join(", ") || "Unknown environment";
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
      findings.push(`${overall[0].manager} が総合パフォーマンスで最高評価${overall[0].medal || ""}`);
    }

    const loadTime25 = rankings.loadTime.get(25)?.[0];
    if (loadTime25) {
      findings.push(`25プラグイン環境では ${loadTime25.manager} が最速 (${Math.round(loadTime25.score)}ms)`);
    }

    if (overall.length >= 3) {
      const ratio = (overall.at(-1)!.score / overall[0].score).toFixed(1);
      findings.push(`パフォーマンス差は最大 ${ratio}倍`);
    }

    const zimResult = data.managers.find(m => m.name === "zim")?.results.get(0);
    if (zimResult?.loadTime && zimResult.loadTime < 40) {
      findings.push(`zim は最小構成で驚異的な速度 (${Math.round(zimResult.loadTime)}ms)`);
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
