#!/usr/bin/env -S deno run --allow-read --allow-write
import { renderChart } from "https://deno.land/x/fresh_charts@0.3.1/mod.ts";
import {
  ChartColors,
  transparentize,
} from "https://deno.land/x/fresh_charts@0.3.1/utils.ts";
import { BenchmarkData } from "./types.ts";
import { exists } from "./utils.ts";

const CHART_COLORS = [
  ChartColors.Blue,
  ChartColors.Red,
  ChartColors.Green,
  ChartColors.Orange,
  ChartColors.Purple,
  ChartColors.Yellow,
  ChartColors.Grey,
  ChartColors.Pink,
  ChartColors.Cyan,
  ChartColors.Lime,
  ChartColors.Indigo,
  ChartColors.Teal,
  ChartColors.Brown,
  ChartColors.DeepOrange,
  ChartColors.LightBlue,
  ChartColors.Amber,
  ChartColors.DeepPurple,
];

async function createLineChart(
  data: BenchmarkData,
  metric: "loadTime" | "installTime",
): Promise<string> {
  // Prepare data
  const managers = new Map<string, Map<number, number>>();
  const counts = new Set<number>();

  for (const result of data.results) {
    const value = result[metric];
    if (
      value === null || (metric === "installTime" && result.pluginCount === 0)
    ) {
      continue;
    }

    counts.add(result.pluginCount);
    if (!managers.has(result.manager)) managers.set(result.manager, new Map());
    managers.get(result.manager)!.set(result.pluginCount, value);
  }

  const sortedCounts = Array.from(counts).sort((first, second) =>
    first - second
  );
  const sortedManagers = Array.from(managers.entries()).sort(
    (firstEntry, secondEntry) => {
      const aSum = Array.from(firstEntry[1].values()).reduce(
        (sum, value) => sum + value,
        0,
      );
      const bSum = Array.from(secondEntry[1].values()).reduce(
        (sum, value) => sum + value,
        0,
      );
      return aSum - bSum;
    },
  );

  // Create datasets for Chart.js
  const datasets = sortedManagers.map(([name, values], index) => {
    const data = sortedCounts.map((count) => values.get(count) || null);
    const color = CHART_COLORS[index % CHART_COLORS.length];

    return {
      label: name,
      data: data,
      borderColor: color,
      backgroundColor: transparentize(color, 0.5),
      borderWidth: 2.5,
      tension: 0.1,
      pointRadius: 5,
      pointHoverRadius: 7,
    };
  });

  const title = metric === "loadTime"
    ? "Zsh Plugin Manager Load Time Comparison"
    : "Zsh Plugin Manager Install Time Comparison";

  const response = await renderChart({
    type: "line",
    data: {
      labels: sortedCounts.map(String),
      datasets: datasets,
    },
    options: {
      responsive: false,
      plugins: {
        title: {
          display: true,
          text: title,
          font: {
            size: 18,
            weight: "bold",
          },
        },
        legend: {
          display: true,
          position: "right",
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: "Number of Plugins",
            font: {
              size: 14,
              weight: "bold",
            },
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: metric === "loadTime"
              ? "Load Time (ms)"
              : "Install Time (ms)",
            font: {
              size: 14,
              weight: "bold",
            },
          },
          beginAtZero: true,
        },
      },
    },
    width: 1400,
    height: 600,
  });

  return await response.text();
}

export async function generateCharts(
  inputFile = "./results/benchmark-results-latest.json",
  outputDir = "./results",
) {
  if (!await exists(inputFile)) {
    throw new Error(`Input file not found: ${inputFile}`);
  }

  const data: BenchmarkData = JSON.parse(await Deno.readTextFile(inputFile));

  await Deno.mkdir(outputDir, { recursive: true });

  // Generate load time chart
  const loadTimeChart = await createLineChart(data, "loadTime");
  await Deno.writeTextFile(
    `${outputDir}/load-time-comparison-chart.svg`,
    loadTimeChart,
  );

  // Generate install time chart
  const installTimeChart = await createLineChart(data, "installTime");
  await Deno.writeTextFile(
    `${outputDir}/install-time-comparison-chart.svg`,
    installTimeChart,
  );

  console.log(`✅ Charts generated in ${outputDir}`);
}

if (import.meta.main) {
  const [input, output] = Deno.args;
  await generateCharts(input, output);
}
