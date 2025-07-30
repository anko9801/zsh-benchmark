// Chart generation utilities

import { BenchmarkData, ChartOptions } from "./types.ts";
// Removed unused imports from utils.ts

export class ChartGenerator {
  private options: ChartOptions;

  constructor(options: ChartOptions) {
    this.options = options;
  }

  generateComparisonChart(
    data: BenchmarkData,
    metric: "install" | "load",
  ): string {
    // Filter for 0 and max plugin counts
    const pluginCounts = [...new Set(data.results.map((r) => r.pluginCount))]
      .sort((a, b) => a - b);
    const minPlugins = Math.min(...pluginCounts);
    const maxPlugins = Math.max(...pluginCounts);

    // Get unique managers and sort by load/install time
    const timeKey = metric === "install" ? "installTime" : "loadTime";
    const managers = [...new Set(data.results.map((r) => r.manager))];

    // Sort managers by their 25-plugin performance
    const managerAvgs = managers.map((m) => {
      const dataFull = data.results.find((r) =>
        r.manager === m && r.pluginCount === maxPlugins
      );
      const value = dataFull?.[timeKey] || Infinity;
      return { manager: m, value };
    }).sort((a, b) => a.value - b.value);

    const sortedManagers = managerAvgs.map((m) => m.manager);

    // SVG parameters
    const { width, height, margin } = this.options;
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const barWidth = 20;
    const barGap = 5;
    const groupGap = 15;
    const groupWidth = barWidth * 2 + barGap;

    // Calculate x positions
    const totalWidth = sortedManagers.length * groupWidth +
      (sortedManagers.length - 1) * groupGap;
    const startX = margin.left + (chartWidth - totalWidth) / 2;

    // Find max value for scaling
    const stddevKey = metric === "install" ? "installStddev" : "loadStddev";
    const maxValue = Math.max(
      ...data.results.map((r) => (r[timeKey] || 0) + (r[stddevKey] || 0)),
    );

    // Colors
    const colors = {
      plugins0: metric === "install" ? "#FF6B6B" : "#4ECDC4",
      pluginsFull: metric === "install" ? "#45B7D1" : "#98D8C8",
    };

    let svg =
      `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="background: white;">
  <text x="${
        width / 2
      }" y="30" text-anchor="middle" font-size="20" font-weight="bold" font-family="Arial, sans-serif">Zsh Plugin Manager ${
        metric === "install" ? "Install" : "Load"
      } Time Comparison</text>
  
  <!-- Grid lines -->`;

    // Y-axis grid lines
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const y = margin.top + chartHeight - (chartHeight * i / yTicks);
      const value = Math.round(maxValue * i / yTicks);
      svg += `
  <line x1="${margin.left}" y1="${y}" x2="${
        width - margin.right
      }" y2="${y}" stroke="#e0e0e0" stroke-width="1"/>
  <text x="${margin.left - 10}" y="${
        y + 5
      }" text-anchor="end" font-size="12" font-family="Arial, sans-serif">${value}</text>`;
    }

    svg += `
  
  <!-- Axes -->
  <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${
      height - margin.bottom
    }" stroke="black" stroke-width="2"/>
  <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${
      width - margin.right
    }" y2="${height - margin.bottom}" stroke="black" stroke-width="2"/>
  
  <!-- Y-axis label -->
  <text x="20" y="${
      height / 2
    }" text-anchor="middle" font-size="14" font-family="Arial, sans-serif" transform="rotate(-90 20 ${
      height / 2
    })">Time (ms)</text>`;

    // Draw bars
    sortedManagers.forEach((manager, idx) => {
      const x = startX + idx * (groupWidth + groupGap);

      // Get data
      const data0 = data.results.find((r) =>
        r.manager === manager && r.pluginCount === minPlugins
      );
      const dataFull = data.results.find((r) =>
        r.manager === manager && r.pluginCount === maxPlugins
      );

      // Draw bars for 0 plugins
      if (data0 && data0[timeKey] !== null) {
        const value = data0[timeKey];
        const barHeight = (value / maxValue) * chartHeight;
        const y = height - margin.bottom - barHeight;

        svg += `
  <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${colors.plugins0}" opacity="0.8"/>
  <text x="${x + barWidth / 2}" y="${
          y - 5
        }" text-anchor="middle" font-size="10" font-family="Arial, sans-serif">${
          value.toFixed(1)
        }</text>`;

        // Error bar
        const stddev = data0[stddevKey];
        if (stddev && stddev > 0) {
          const errorBarHeight = (stddev / maxValue) * chartHeight;
          const errorX = x + barWidth / 2;
          svg += `
  <line x1="${errorX}" y1="${y - errorBarHeight}" x2="${errorX}" y2="${
            y + errorBarHeight
          }" stroke="black" stroke-width="1"/>
  <line x1="${errorX - 3}" y1="${y - errorBarHeight}" x2="${errorX + 3}" y2="${
            y - errorBarHeight
          }" stroke="black" stroke-width="1"/>
  <line x1="${errorX - 3}" y1="${y + errorBarHeight}" x2="${errorX + 3}" y2="${
            y + errorBarHeight
          }" stroke="black" stroke-width="1"/>`;
        }
      }

      // Draw bars for full plugins
      if (dataFull && dataFull[timeKey] !== null) {
        const value = dataFull[timeKey];
        const barHeight = (value / maxValue) * chartHeight;
        const y = height - margin.bottom - barHeight;
        const barX = x + barWidth + barGap;

        svg += `
  <rect x="${barX}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${colors.pluginsFull}" opacity="0.8"/>
  <text x="${barX + barWidth / 2}" y="${
          y - 5
        }" text-anchor="middle" font-size="10" font-family="Arial, sans-serif">${
          value.toFixed(1)
        }</text>`;

        // Error bar
        const stddev = dataFull[stddevKey];
        if (stddev && stddev > 0) {
          const errorBarHeight = (stddev / maxValue) * chartHeight;
          const errorX = barX + barWidth / 2;
          svg += `
  <line x1="${errorX}" y1="${y - errorBarHeight}" x2="${errorX}" y2="${
            y + errorBarHeight
          }" stroke="black" stroke-width="1"/>
  <line x1="${errorX - 3}" y1="${y - errorBarHeight}" x2="${errorX + 3}" y2="${
            y - errorBarHeight
          }" stroke="black" stroke-width="1"/>
  <line x1="${errorX - 3}" y1="${y + errorBarHeight}" x2="${errorX + 3}" y2="${
            y + errorBarHeight
          }" stroke="black" stroke-width="1"/>`;
        }
      }

      // Manager name (rotated)
      svg += `
  <text x="${x + groupWidth / 2}" y="${
        height - margin.bottom + 20
      }" text-anchor="middle" font-size="12" font-family="Arial, sans-serif" transform="rotate(-45 ${
        x + groupWidth / 2
      } ${height - margin.bottom + 20})">${manager}</text>`;
    });

    // Legend
    svg += `
  <!-- Legend -->
  <rect x="${width - 110}" y="${
      margin.top + 10
    }" width="15" height="15" fill="${colors.plugins0}" opacity="0.8"/>
  <text x="${width - 90}" y="${
      margin.top + 22
    }" font-size="12" font-family="Arial, sans-serif">0 plugins</text>
  <rect x="${width - 110}" y="${
      margin.top + 30
    }" width="15" height="15" fill="${colors.pluginsFull}" opacity="0.8"/>
  <text x="${width - 90}" y="${
      margin.top + 42
    }" font-size="12" font-family="Arial, sans-serif">${maxPlugins} plugins</text>`;

    svg += `
</svg>`;

    return svg;
  }}
