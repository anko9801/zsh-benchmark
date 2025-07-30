#!/usr/bin/env -S deno run --allow-read --allow-write
import { BenchmarkData, ChartOptions } from "./types.ts";
import { exists } from "./utils.ts";

const DEFAULT_OPTS: ChartOptions = {
  width: 1400,
  height: 600,
  margin: { top: 40, right: 100, bottom: 60, left: 100 },
};

function getColor(idx: number): string {
  const colors = [
    "#3498db",
    "#e74c3c",
    "#2ecc71",
    "#f39c12",
    "#9b59b6",
    "#1abc9c",
    "#34495e",
    "#e67e22",
    "#16a085",
    "#c0392b",
    "#8e44ad",
    "#d35400",
    "#27ae60",
    "#2c3e50",
    "#f1c40f",
    "#bdc3c7",
    "#7f8c8d",
  ];
  return colors[idx % colors.length];
}

function createSvg(
  data: BenchmarkData,
  metric: "loadTime" | "installTime",
  opts = DEFAULT_OPTS,
): string {
  const { width, height, margin } = opts;
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

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

  // Scales
  const xScale = (value: number) =>
    (Math.log(value + 1) / Math.log(Math.max(...sortedCounts) + 1)) *
    chartWidth;
  const maxY = Math.max(
    ...Array.from(managers.values()).flatMap((managerValues) =>
      Array.from(managerValues.values())
    ),
  );
  const yScale = (value: number) => chartHeight - (value / maxY) * chartHeight;

  // Build SVG
  const lines: string[] = [
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`,
  ];

  // Background
  lines.push(`<rect width="${width}" height="${height}" fill="#f8f9fa"/>`);
  lines.push(`<g transform="translate(${margin.left}, ${margin.top})">`);

  // Grid
  lines.push('<g stroke="#e0e0e0" stroke-width="0.5">');
  sortedCounts.forEach((count) => {
    const x = xScale(count);
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${chartHeight}"/>`);
  });
  for (let i = 0; i <= 5; i++) {
    const y = (chartHeight / 5) * i;
    lines.push(`<line x1="0" y1="${y}" x2="${chartWidth}" y2="${y}"/>`);
  }
  lines.push("</g>");

  // Data lines
  sortedManagers.forEach(([name, values], idx) => {
    const color = getColor(idx);
    const points = sortedCounts.filter((count) => values.has(count))
      .map((count) => ({ x: xScale(count), y: yScale(values.get(count)!) }));

    if (points.length > 0) {
      // Line
      const path = `M ${
        points.map((point) => `${point.x},${point.y}`).join(" L ")
      }`;
      lines.push(
        `<path d="${path}" fill="none" stroke="${color}" stroke-width="2.5"/>`,
      );

      // Points
      points.forEach((point) => {
        lines.push(
          `<circle cx="${point.x}" cy="${point.y}" r="5" fill="${color}"/>`,
        );
      });

      // Label
      const lastPoint = points[points.length - 1];
      lines.push(
        `<text x="${lastPoint.x + 10}" y="${
          lastPoint.y + 5
        }" fill="${color}" font-size="12" font-family="Arial">${name}</text>`,
      );
    }
  });

  // Axes
  lines.push('<g stroke="#333" stroke-width="2">');
  lines.push(
    `<line x1="0" y1="${chartHeight}" x2="${chartWidth}" y2="${chartHeight}"/>`,
  );
  lines.push(`<line x1="0" y1="0" x2="0" y2="${chartHeight}"/>`);
  lines.push("</g>");

  // X-axis labels
  lines.push('<g font-size="12" font-family="Arial" text-anchor="middle">');
  sortedCounts.forEach((count) => {
    lines.push(
      `<text x="${xScale(count)}" y="${chartHeight + 20}">${count}</text>`,
    );
  });
  lines.push(
    `<text x="${chartWidth / 2}" y="${
      chartHeight + 50
    }" font-size="14" font-weight="bold">Number of Plugins</text>`,
  );
  lines.push("</g>");

  // Y-axis labels
  lines.push('<g font-size="12" font-family="Arial" text-anchor="end">');
  for (let i = 0; i <= 5; i++) {
    const y = (chartHeight / 5) * i;
    const value = Math.round(maxY * (1 - i / 5));
    lines.push(`<text x="-10" y="${y + 5}">${value}ms</text>`);
  }
  lines.push(
    `<text x="${
      -chartHeight / 2
    }" y="-60" font-size="14" font-weight="bold" transform="rotate(-90)" text-anchor="middle">${
      metric === "loadTime" ? "Load Time (ms)" : "Install Time (ms)"
    }</text>`,
  );
  lines.push("</g>");

  // Title
  const title = metric === "loadTime"
    ? "Zsh Plugin Manager Load Time Comparison"
    : "Zsh Plugin Manager Install Time Comparison";
  lines.push(
    `<text x="${
      chartWidth / 2
    }" y="-10" font-size="18" font-weight="bold" text-anchor="middle" font-family="Arial">${title}</text>`,
  );

  lines.push("</g></svg>");
  return lines.join("\n");
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
  await Deno.writeTextFile(
    `${outputDir}/load-time-comparison-chart.svg`,
    createSvg(data, "loadTime"),
  );
  await Deno.writeTextFile(
    `${outputDir}/install-time-comparison-chart.svg`,
    createSvg(data, "installTime"),
  );

  console.log(`✅ Charts generated in ${outputDir}`);
}

if (import.meta.main) {
  const [input, output] = Deno.args;
  await generateCharts(input, output);
}
