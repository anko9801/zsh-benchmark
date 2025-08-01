#!/usr/bin/env -S deno run --allow-read --allow-write
import { renderChart } from "https://deno.land/x/fresh_charts@0.3.1/mod.ts";
import { ChartColors } from "https://deno.land/x/fresh_charts@0.3.1/utils.ts";
import { BenchmarkData } from "./types.ts";
import { exists } from "./utils.ts";

// Unused color constants - keeping for reference
const _CHART_COLORS = [
  ChartColors.Blue,
  ChartColors.Red,
  ChartColors.Green,
  ChartColors.Orange,
  ChartColors.Purple,
  ChartColors.Yellow,
  ChartColors.Grey,
];

async function createBarChart(
  data: BenchmarkData,
  metric: "loadTime" | "installTime",
): Promise<string> {
  // Prepare data with error bars
  const managers = new Map<string, Map<number, {value: number, stddev: number}>>();
  const counts = new Set<number>();

  for (const result of data.results) {
    const value = result[metric];
    const stddev = metric === "loadTime" ? result.loadStddev : result.installStddev;
    if (
      value === null || (metric === "installTime" && result.pluginCount === 0)
    ) {
      continue;
    }

    counts.add(result.pluginCount);
    if (!managers.has(result.manager)) managers.set(result.manager, new Map());
    managers.get(result.manager)!.set(result.pluginCount, {
      value,
      stddev: stddev || 0
    });
  }

  const _sortedCounts = Array.from(counts).sort((first, second) =>
    first - second
  );
  const sortedManagers = Array.from(managers.entries()).sort(
    (firstEntry, secondEntry) => {
      const aSum = Array.from(firstEntry[1].values()).reduce(
        (sum, data) => sum + data.value,
        0,
      );
      const bSum = Array.from(secondEntry[1].values()).reduce(
        (sum, data) => sum + data.value,
        0,
      );
      return aSum - bSum;
    },
  );

  const title = metric === "loadTime"
    ? "Zsh Plugin Manager Load Time Comparison"
    : "Zsh Plugin Manager Install Time Comparison";

  // 棒グラフ用にデータを準備（エラーバー付き）
  const managers0: number[] = [];
  const managers25: number[] = [];
  const managers0Error: number[] = [];
  const managers25Error: number[] = [];
  const managerNames: string[] = [];

  sortedManagers.forEach(([name, values]) => {
    const data0 = values.get(0) || {value: 0, stddev: 0};
    const data25 = values.get(25) || {value: 0, stddev: 0};

    // 25プラグインのデータがある場合のみ表示
    if (data25.value > 0) {
      managerNames.push(name);
      managers0.push(data0.value);
      managers25.push(data25.value);
      managers0Error.push(data0.stddev);
      managers25Error.push(data25.stddev);
    }
  });

  // 25プラグインの値でソート
  const sortedIndices = managers25
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value)
    .map((item) => item.index);

  const sortedNames = sortedIndices.map((i) => managerNames[i]);
  const sorted0 = sortedIndices.map((i) => managers0[i]);
  const sorted25 = sortedIndices.map((i) => managers25[i]);
  const sorted0Error = sortedIndices.map((i) => managers0Error[i]);
  const sorted25Error = sortedIndices.map((i) => managers25Error[i]);

  // Install timeの場合は0プラグインのデータは表示しない
  const datasets = metric === "installTime"
    ? [
      {
        label: "25 plugins",
        data: sorted25,
        backgroundColor: ChartColors.Red,
        borderColor: ChartColors.Red,
        borderWidth: 1,
      },
    ]
    : [
      {
        label: "25 plugins",
        data: sorted25,
        backgroundColor: "rgba(255, 99, 132, 0.8)", // 赤色、少し透明
        borderColor: ChartColors.Red,
        borderWidth: 2,
        order: 1, // 後ろに表示
      },
      {
        label: "0 plugins (baseline)",
        data: sorted0,
        backgroundColor: "rgba(54, 162, 235, 0.9)", // 青色、より不透明
        borderColor: ChartColors.Blue,
        borderWidth: 2,
        order: 2, // 前に表示
      },
    ];

  const response = await renderChart({
    type: "bar",
    data: {
      labels: sortedNames,
      datasets: datasets,
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
          font: {
            size: 16,
            weight: "bold",
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          },
          padding: {
            top: 10,
            bottom: 20,
          },
        },
        legend: {
          display: true,
          position: "top",
          labels: {
            boxWidth: 20,
            padding: 15,
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const datasetIndex = context.datasetIndex;
              const dataIndex = context.dataIndex;
              const value = context.parsed.y;
              let errorData;
              
              if (metric === "installTime") {
                errorData = sorted25Error;
              } else {
                // Load timeの場合: dataset 0 = 25 plugins, dataset 1 = 0 plugins
                errorData = datasetIndex === 0 ? sorted25Error : sorted0Error;
              }
              
              const stddev = errorData[dataIndex] || 0;
              
              return `${context.dataset.label}: ${value.toFixed(1)}ms ± ${stddev.toFixed(1)}ms`;
            }
          }
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: "Plugin Manager",
            font: {
              size: 14,
              weight: "bold",
            },
          },
          grid: {
            display: false,
          },
          ticks: {
            font: {
              size: 12,
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
          grid: {
            color: "#e0e0e0",
            lineWidth: 0.5,
          },
          ticks: {
            font: {
              size: 12,
            },
          },
        },
      },
      layout: {
        padding: {
          left: 20,
          right: 20,
          top: 20,
          bottom: 40,
        },
      },
    },
    width: 1400,
    height: 600,
  });

  // SVGを取得してtextLength属性を削除
  let svg = await response.text();
  svg = svg.replace(/\s*textLength="[^"]*"/g, "");

  return svg;
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
  const loadTimeChart = await createBarChart(data, "loadTime");
  await Deno.writeTextFile(
    `${outputDir}/load-time-comparison-chart.svg`,
    loadTimeChart,
  );

  // Generate install time chart
  const installTimeChart = await createBarChart(data, "installTime");
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
