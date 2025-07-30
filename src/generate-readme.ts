#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net

// Main entry point for README generator

import { parse } from "https://deno.land/std@0.220.0/flags/mod.ts";
import { bold, yellow } from "https://deno.land/std@0.220.0/fmt/colors.ts";
import { generateReadme } from "./readme-generator.ts";
import { BenchmarkData } from "./types.ts";
import { logger, setupLogging, exists } from "./utils.ts";

// Options type
interface GenerateReadmeOptions {
  inputFile: string;
  outputFile: string;
  template?: string;
  language: "ja" | "en";
  backup: boolean;
  debug: boolean;
  sections?: string[];
}

// Default options
const DEFAULT_OPTIONS: GenerateReadmeOptions = {
  inputFile: "results/benchmark-results-latest.json",
  outputFile: "README.md",
  language: "ja",
  backup: true,
  debug: false,
};

// Parse command line arguments
function parseArgs(args: string[]): GenerateReadmeOptions {
  const flags = parse(args, {
    string: ["input", "output", "template", "language", "sections"],
    boolean: ["help", "backup", "debug", "no-backup"],
    alias: {
      i: "input",
      o: "output",
      t: "template",
      l: "language",
      h: "help",
      d: "debug",
    },
    default: DEFAULT_OPTIONS,
  });

  if (flags.help) {
    printHelp();
    Deno.exit(0);
  }

  return {
    inputFile: (flags.input as string) || DEFAULT_OPTIONS.inputFile,
    outputFile: (flags.output as string) || DEFAULT_OPTIONS.outputFile,
    template: flags.template as string | undefined,
    language: (flags.language as "ja" | "en") || DEFAULT_OPTIONS.language,
    backup: flags["no-backup"]
      ? false
      : (flags.backup as boolean ?? DEFAULT_OPTIONS.backup),
    debug: flags.debug as boolean ?? DEFAULT_OPTIONS.debug,
    sections: flags.sections
      ? (flags.sections as string).split(",")
      : undefined,
  };
}

// Print help message
function printHelp(): void {
  console.log(`
${bold("Zsh Benchmark README Generator")}

${yellow("Usage:")}
  deno task generate-readme [options]

${yellow("Options:")}
  -i, --input <file>      Input JSON file (default: results/benchmark-results-latest.json)
  -o, --output <file>     Output markdown file (default: README.md)
  -t, --template <file>   Custom template file
  -l, --language <lang>   Language: ja or en (default: ja)
  --sections <list>       Comma-separated list of sections to include
  --backup               Create backup of existing README (default: true)
  --no-backup            Don't create backup
  -d, --debug            Enable debug output
  -h, --help             Show this help

${yellow("Examples:")}
  # Generate with default settings
  deno task generate-readme

  # Use custom input and output files
  deno task generate-readme -i results/custom.json -o BENCHMARK.md

  # Use English language
  deno task generate-readme -l en

  # Include only specific sections
  deno task generate-readme --sections rankings,comparison,recommendations
`);
}

// Main function
async function main(): Promise<void> {
  const options = parseArgs(Deno.args);

  if (options.debug) {
    await setupLogging("DEBUG");
    logger.debug("Debug mode enabled");
    logger.debug(`Options: ${JSON.stringify(options)}`);
  }

  logger.info(bold("🚀 Generating README from benchmark results..."));

  try {
    // Create backup if requested
    if (options.backup && await exists(options.outputFile)) {
      await Deno.copyFile(options.outputFile, `${options.outputFile}.bak`);
      logger.info(yellow(`📁 Backup saved as ${options.outputFile}.bak`));
    }

    // Generate README
    await generateReadme(options.inputFile, options.outputFile);

    logger.info(`✅ README successfully generated at ${options.outputFile}`);
  } catch (error) {
    logger.error(`❌ Error: ${error.message}`);
    if (options.debug) {
      console.error(error.stack);
    }
    Deno.exit(1);
  }
}

// Helper function to check if file exists
async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

// Run main function
if (import.meta.main) {
  main();
}
