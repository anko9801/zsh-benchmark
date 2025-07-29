#!/usr/bin/env -S deno run --allow-all

// Scalability chart generation script

import { BenchmarkData, ChartOptions } from "./types.ts";
import { ChartGenerator } from "./chart-generator.ts";
import { logger } from "./logger.ts";
import { DEFAULT_CONFIG } from "./config.ts";
import { formatDuration, formatPercentage, calculatePercentageIncrease } from "./utils.ts";

async function main() {
  try {
    const dataPath = `${DEFAULT_CONFIG.paths.results}/benchmark-results-latest.json`;
    const data: BenchmarkData = JSON.parse(await Deno.readTextFile(dataPath));
    
    // Group data by manager
    const managerData = new Map<string, typeof data.results>();
    data.results.forEach(result => {
      if (!managerData.has(result.manager)) {
        managerData.set(result.manager, []);
      }
      managerData.get(result.manager)!.push(result);
    });
    
    // Sort managers by 25-plugin load time
    const sortedManagers = Array.from(managerData.keys()).sort((a, b) => {
      const aData = managerData.get(a)!.find(d => d.pluginCount === 25);
      const bData = managerData.get(b)!.find(d => d.pluginCount === 25);
      return (aData?.loadTime || 0) - (bData?.loadTime || 0);
    });
    
    // Display increase statistics
    console.log("Load Time Increase (0 → 25 plugins):");
    console.log("=====================================");
    
    sortedManagers.forEach(manager => {
      const data0 = managerData.get(manager)!.find(d => d.pluginCount === 0);
      const data25 = managerData.get(manager)!.find(d => d.pluginCount === 25);
      
      if (data0?.loadTime && data25?.loadTime) {
        const increase = data25.loadTime - data0.loadTime;
        const percentIncrease = calculatePercentageIncrease(data0.loadTime, data25.loadTime);
        console.log(
          `${manager.padEnd(15)} ${formatDuration(data0.loadTime, 1)} → ${formatDuration(data25.loadTime, 1)} (+${formatDuration(increase, 1)}, +${formatPercentage(percentIncrease)})`
        );
      }
    });
    
    const chartOptions: ChartOptions = {
      width: 1200,
      height: 800,
      margin: { top: 60, right: 200, bottom: 80, left: 80 }
    };
    
    const generator = new ChartGenerator(chartOptions);
    const svg = generator.generateScalabilityChart(data);
    
    // Save chart
    const outputPath = `${DEFAULT_CONFIG.paths.results}/load-time-scalability-chart.svg`;
    await Deno.writeTextFile(outputPath, svg);
    
    logger.success(`\nScalability chart saved to: ${outputPath}`);
  } catch (error) {
    logger.error("Failed to generate scalability chart", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}