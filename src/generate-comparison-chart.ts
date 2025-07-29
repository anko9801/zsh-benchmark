#!/usr/bin/env -S deno run --allow-all

// Comparison chart generation script

import { BenchmarkData, ChartOptions } from "./types.ts";
import { ChartGenerator } from "./chart-generator.ts";
import { logger } from "./logger.ts";
import { DEFAULT_CONFIG } from "./config.ts";

async function main() {
  try {
    const dataPath = `${DEFAULT_CONFIG.paths.results}/benchmark-results-latest.json`;
    const data: BenchmarkData = JSON.parse(await Deno.readTextFile(dataPath));
    
    const chartOptions: ChartOptions = {
      width: 1200,
      height: 600,
      margin: { top: 50, right: 120, bottom: 120, left: 80 }
    };
    
    const generator = new ChartGenerator(chartOptions);
    
    // Generate both install and load charts
    const installChart = generator.generateComparisonChart(data, 'install');
    const loadChart = generator.generateComparisonChart(data, 'load');
    
    // Save charts
    const installPath = `${DEFAULT_CONFIG.paths.results}/install-time-comparison-chart.svg`;
    const loadPath = `${DEFAULT_CONFIG.paths.results}/load-time-comparison-chart.svg`;
    
    await Deno.writeTextFile(installPath, installChart);
    logger.success(`Generated chart: ${installPath}`);
    
    await Deno.writeTextFile(loadPath, loadChart);
    logger.success(`Generated chart: ${loadPath}`);
    
    logger.success("\nComparison charts generated successfully!");
  } catch (error) {
    logger.error("Failed to generate comparison charts", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}