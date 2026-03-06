/**
 * Enhanced SVG chart generator with interactive metrics visualization
 * Creates beautiful, informative charts for benchmark results
 */

import { BenchmarkData, BenchmarkResult } from "../../core/types.ts";
import { calculatePerceptualScore, getPerceptualEmoji } from "../../engines/perceptual.ts";
import { calculateWeightedScore } from "../../engines/weighted.ts";

export interface ChartOptions {
  width?: number;
  height?: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  colors?: string[];
  showInteractive?: boolean;
  showPerceptual?: boolean;
  showLegend?: boolean;
  theme?: 'light' | 'dark';
  animation?: boolean;
}

export interface ChartData {
  title: string;
  subtitle?: string;
  svg: string;
  metadata: {
    timestamp: Date;
    dataPoints: number;
    managers: string[];
  };
}

const DEFAULT_OPTIONS: ChartOptions = {
  width: 800,
  height: 500,
  margin: { top: 40, right: 60, bottom: 60, left: 80 },
  colors: [
    '#e41a1c', '#377eb8', '#4daf4a', '#984ea3',
    '#ff7f00', '#ffff33', '#a65628', '#f781bf',
    '#999999', '#66c2a5', '#fc8d62', '#8da0cb',
  ],
  showInteractive: true,
  showPerceptual: true,
  showLegend: true,
  theme: 'light',
  animation: true,
};

/**
 * Generate load time comparison chart
 */
export function generateLoadTimeChart(
  data: BenchmarkData,
  options: ChartOptions = {}
): ChartData {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { width, height, margin } = opts;
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Group data by plugin count
  const grouped = new Map<number, BenchmarkResult[]>();
  data.results.forEach(result => {
    if (result.loadTime !== null) {
      const group = grouped.get(result.pluginCount) || [];
      group.push(result);
      grouped.set(result.pluginCount, group);
    }
  });

  // Sort plugin counts
  const pluginCounts = Array.from(grouped.keys()).sort((a, b) => a - b);
  const managers = [...new Set(data.results.map(r => r.manager))];

  // Create scales
  const xScale = createLinearScale(0, Math.max(...pluginCounts), 0, chartWidth);
  const yMax = Math.max(...data.results.map(r => r.loadTime || 0));
  const yScale = createLinearScale(0, yMax * 1.1, chartHeight, 0);

  // Create SVG
  const svg: string[] = [];
  svg.push(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`);
  
  // Background
  svg.push(`<rect width="${width}" height="${height}" fill="${opts.theme === 'dark' ? '#1a1a1a' : '#ffffff'}"/>`);

  // Title
  if (data.title) {
    svg.push(`<text x="${width / 2}" y="25" text-anchor="middle" font-size="20" font-weight="bold" fill="${opts.theme === 'dark' ? '#ffffff' : '#000000'}">${escapeXml(data.title)}</text>`);
  }

  // Chart area
  svg.push(`<g transform="translate(${margin.left},${margin.top})">`);

  // Grid lines
  svg.push(createGridLines(chartWidth, chartHeight, xScale, yScale, opts.theme));

  // Lines
  managers.forEach((manager, idx) => {
    const color = opts.colors![idx % opts.colors!.length];
    const points: Array<{ x: number; y: number }> = [];

    pluginCounts.forEach(count => {
      const results = grouped.get(count)!.filter(r => r.manager === manager);
      if (results.length > 0) {
        const avgLoadTime = results.reduce((sum, r) => sum + (r.loadTime || 0), 0) / results.length;
        points.push({ x: xScale(count), y: yScale(avgLoadTime) });
      }
    });

    if (points.length > 0) {
      svg.push(createLine(points, color, manager, opts.animation));
      
      // Data points
      points.forEach(point => {
        svg.push(createDataPoint(point.x, point.y, color, 4));
      });
    }
  });

  // Axes
  svg.push(createXAxis(chartWidth, chartHeight, xScale, 'Plugin Count', opts.theme));
  svg.push(createYAxis(chartHeight, yScale, 'Load Time (ms)', opts.theme));

  svg.push('</g>');

  // Legend
  if (opts.showLegend) {
    svg.push(createLegend(managers, opts.colors!, width - margin.right - 150, margin.top + 20, opts.theme));
  }

  svg.push('</svg>');

  return {
    title: 'Load Time Comparison',
    subtitle: 'Average load time by plugin count',
    svg: svg.join('\n'),
    metadata: {
      timestamp: new Date(data.timestamp),
      dataPoints: data.results.length,
      managers,
    },
  };
}

/**
 * Generate interactive metrics chart
 */
export function generateInteractiveMetricsChart(
  data: BenchmarkData,
  pluginCount: number,
  options: ChartOptions = {}
): ChartData {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { width, height, margin } = opts;
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Filter results
  const results = data.results.filter(r => r.pluginCount === pluginCount);
  const managers = results.map(r => r.manager);
  
  // Metrics to display
  const metrics = [
    { key: 'firstPromptLag', label: 'First Prompt' },
    { key: 'firstCommandLag', label: 'First Command' },
    { key: 'commandLag', label: 'Command Lag' },
    { key: 'inputLag', label: 'Input Lag' },
  ];

  // Create scales
  const xScale = createBandScale(managers, 0, chartWidth, 0.1);
  const yMax = Math.max(...results.flatMap(r => 
    metrics.map(m => r[m.key as keyof BenchmarkResult] as number || 0)
  ));
  const yScale = createLinearScale(0, yMax * 1.1, chartHeight, 0);

  // Create SVG
  const svg: string[] = [];
  svg.push(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`);
  
  // Background
  svg.push(`<rect width="${width}" height="${height}" fill="${opts.theme === 'dark' ? '#1a1a1a' : '#ffffff'}"/>`);

  // Title
  svg.push(`<text x="${width / 2}" y="25" text-anchor="middle" font-size="20" font-weight="bold" fill="${opts.theme === 'dark' ? '#ffffff' : '#000000'}">Interactive Metrics (${pluginCount} plugins)</text>`);

  // Chart area
  svg.push(`<g transform="translate(${margin.left},${margin.top})">`);

  // Grid lines
  svg.push(createGridLines(chartWidth, chartHeight, null, yScale, opts.theme));

  // Grouped bars
  const groupWidth = xScale.bandwidth();
  const barWidth = groupWidth / metrics.length;

  results.forEach((result, idx) => {
    const x = xScale(result.manager)!;
    
    metrics.forEach((metric, metricIdx) => {
      const value = result[metric.key as keyof BenchmarkResult] as number;
      if (value !== null && value !== undefined) {
        const barX = x + metricIdx * barWidth;
        const barHeight = chartHeight - yScale(value);
        const color = opts.colors![metricIdx % opts.colors!.length];
        
        svg.push(createBar(barX, yScale(value), barWidth - 2, barHeight, color, opts.animation));
        
        // Value label
        if (barHeight > 20) {
          svg.push(`<text x="${barX + barWidth / 2}" y="${yScale(value) + 15}" text-anchor="middle" font-size="12" fill="#ffffff">${value.toFixed(0)}</text>`);
        }
      }
    });

    // Perceptual rating
    if (opts.showPerceptual) {
      const perceptualScore = calculatePerceptualScore(result);
      const emoji = getPerceptualEmoji(perceptualScore.overall);
      svg.push(`<text x="${x + groupWidth / 2}" y="${chartHeight + 30}" text-anchor="middle" font-size="16">${emoji}</text>`);
    }
  });

  // Axes
  svg.push(createXAxisCategories(chartWidth, chartHeight, managers, xScale, opts.theme));
  svg.push(createYAxis(chartHeight, yScale, 'Latency (ms)', opts.theme));

  svg.push('</g>');

  // Legend
  if (opts.showLegend) {
    svg.push(createLegend(metrics.map(m => m.label), opts.colors!, width - margin.right - 150, margin.top + 20, opts.theme));
  }

  svg.push('</svg>');

  return {
    title: 'Interactive Metrics Comparison',
    subtitle: `Latency measurements for ${pluginCount} plugins`,
    svg: svg.join('\n'),
    metadata: {
      timestamp: new Date(data.timestamp),
      dataPoints: results.length * metrics.length,
      managers,
    },
  };
}

/**
 * Generate perceptual score visualization
 */
export function generatePerceptualScoreChart(
  data: BenchmarkData,
  pluginCount: number,
  options: ChartOptions = {}
): ChartData {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { width, height, margin } = opts;
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Filter and calculate scores
  const results = data.results
    .filter(r => r.pluginCount === pluginCount)
    .map(r => ({
      manager: r.manager,
      score: calculatePerceptualScore(r),
      weighted: calculateWeightedScore(r, 'interactive'),
    }))
    .sort((a, b) => b.weighted.normalized - a.weighted.normalized);

  // Create radar chart data
  const categories = ['First Prompt', 'First Command', 'Command Lag', 'Input Lag', 'Load Time'];
  const centerX = chartWidth / 2;
  const centerY = chartHeight / 2;
  const radius = Math.min(centerX, centerY) * 0.8;

  // Create SVG
  const svg: string[] = [];
  svg.push(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`);
  
  // Background
  svg.push(`<rect width="${width}" height="${height}" fill="${opts.theme === 'dark' ? '#1a1a1a' : '#ffffff'}"/>`);

  // Title
  svg.push(`<text x="${width / 2}" y="25" text-anchor="middle" font-size="20" font-weight="bold" fill="${opts.theme === 'dark' ? '#ffffff' : '#000000'}">Perceptual Performance (${pluginCount} plugins)</text>`);

  // Chart area
  svg.push(`<g transform="translate(${margin.left},${margin.top})">`);

  // Radar grid
  svg.push(createRadarGrid(centerX, centerY, radius, categories.length, opts.theme));

  // Category labels
  categories.forEach((category, idx) => {
    const angle = (idx * 2 * Math.PI) / categories.length - Math.PI / 2;
    const x = centerX + Math.cos(angle) * (radius + 20);
    const y = centerY + Math.sin(angle) * (radius + 20);
    svg.push(`<text x="${x}" y="${y}" text-anchor="middle" font-size="12" fill="${opts.theme === 'dark' ? '#ffffff' : '#000000'}">${category}</text>`);
  });

  // Plot data
  results.forEach((result, idx) => {
    const color = opts.colors![idx % opts.colors!.length];
    const points: Array<{ x: number; y: number }> = [];
    
    // Calculate points based on perceptual ratings
    const ratings = [
      result.score.breakdown.firstPrompt,
      result.score.breakdown.firstCommand,
      result.score.breakdown.command,
      result.score.breakdown.input,
      result.score.breakdown.load,
    ];

    ratings.forEach((rating, idx) => {
      const value = ratingToValue(rating);
      const angle = (idx * 2 * Math.PI) / categories.length - Math.PI / 2;
      const r = (value / 5) * radius;
      points.push({
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r,
      });
    });

    // Close the polygon
    points.push(points[0]);

    svg.push(createPolygon(points, color, 0.3));
    svg.push(createLine(points, color, result.manager, false, 2));
  });

  svg.push('</g>');

  // Legend
  if (opts.showLegend) {
    const legendItems = results.map(r => `${r.manager} (${r.weighted.normalized.toFixed(0)})`);
    svg.push(createLegend(legendItems, opts.colors!, width - margin.right - 150, margin.top + 20, opts.theme));
  }

  svg.push('</svg>');

  return {
    title: 'Perceptual Performance Radar',
    subtitle: `Multi-dimensional performance view for ${pluginCount} plugins`,
    svg: svg.join('\n'),
    metadata: {
      timestamp: new Date(data.timestamp),
      dataPoints: results.length * categories.length,
      managers: results.map(r => r.manager),
    },
  };
}

// Helper functions

function createLinearScale(domainMin: number, domainMax: number, rangeMin: number, rangeMax: number) {
  const scale = (value: number) => {
    return rangeMin + ((value - domainMin) / (domainMax - domainMin)) * (rangeMax - rangeMin);
  };
  scale.ticks = (count: number = 5) => {
    const step = (domainMax - domainMin) / (count - 1);
    return Array.from({ length: count }, (_, i) => domainMin + i * step);
  };
  return scale;
}

function createBandScale(domain: string[], rangeMin: number, rangeMax: number, padding: number = 0) {
  const step = (rangeMax - rangeMin) / domain.length;
  const bandwidth = step * (1 - padding);
  const scale = (value: string) => {
    const idx = domain.indexOf(value);
    return idx < 0 ? undefined : rangeMin + idx * step + (step * padding) / 2;
  };
  scale.bandwidth = () => bandwidth;
  return scale;
}

function createGridLines(width: number, height: number, xScale: any | null, yScale: any, theme: 'light' | 'dark'): string {
  const lines: string[] = [];
  const strokeColor = theme === 'dark' ? '#333333' : '#e0e0e0';
  
  // Horizontal lines
  if (yScale && yScale.ticks) {
    yScale.ticks(6).forEach((tick: number) => {
      const y = yScale(tick);
      lines.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${strokeColor}" stroke-dasharray="2,2"/>`);
    });
  }
  
  // Vertical lines
  if (xScale && xScale.ticks) {
    xScale.ticks(6).forEach((tick: number) => {
      const x = xScale(tick);
      lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${strokeColor}" stroke-dasharray="2,2"/>`);
    });
  }
  
  return lines.join('\n');
}

function createLine(points: Array<{ x: number; y: number }>, color: string, label: string, animate: boolean = true, strokeWidth: number = 3): string {
  const path = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const id = `line-${label.replace(/\s+/g, '-')}`;
  
  let line = `<path d="${path}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" id="${id}"`;
  
  if (animate) {
    line += ` stroke-dasharray="1000" stroke-dashoffset="1000">`;
    line += `<animate attributeName="stroke-dashoffset" from="1000" to="0" dur="1s" fill="freeze"/>`;
    line += `</path>`;
  } else {
    line += `/>`;
  }
  
  return line;
}

function createBar(x: number, y: number, width: number, height: number, color: string, animate: boolean = true): string {
  let bar = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${color}"`;
  
  if (animate) {
    bar += ` height="0" y="${y + height}">`;
    bar += `<animate attributeName="height" from="0" to="${height}" dur="0.5s" fill="freeze"/>`;
    bar += `<animate attributeName="y" from="${y + height}" to="${y}" dur="0.5s" fill="freeze"/>`;
    bar += `</rect>`;
  } else {
    bar += `/>`;
  }
  
  return bar;
}

function createDataPoint(x: number, y: number, color: string, radius: number): string {
  return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}"/>`;
}

function createXAxis(width: number, height: number, scale: any, label: string, theme: 'light' | 'dark'): string {
  const textColor = theme === 'dark' ? '#ffffff' : '#000000';
  const lines: string[] = [];
  
  // Axis line
  lines.push(`<line x1="0" y1="${height}" x2="${width}" y2="${height}" stroke="${textColor}"/>`);
  
  // Ticks and labels
  if (scale.ticks) {
    scale.ticks(6).forEach((tick: number) => {
      const x = scale(tick);
      lines.push(`<line x1="${x}" y1="${height}" x2="${x}" y2="${height + 5}" stroke="${textColor}"/>`);
      lines.push(`<text x="${x}" y="${height + 20}" text-anchor="middle" font-size="12" fill="${textColor}">${tick}</text>`);
    });
  }
  
  // Axis label
  lines.push(`<text x="${width / 2}" y="${height + 45}" text-anchor="middle" font-size="14" fill="${textColor}">${label}</text>`);
  
  return lines.join('\n');
}

function createXAxisCategories(width: number, height: number, categories: string[], scale: any, theme: 'light' | 'dark'): string {
  const textColor = theme === 'dark' ? '#ffffff' : '#000000';
  const lines: string[] = [];
  
  // Axis line
  lines.push(`<line x1="0" y1="${height}" x2="${width}" y2="${height}" stroke="${textColor}"/>`);
  
  // Category labels
  categories.forEach(category => {
    const x = scale(category) + scale.bandwidth() / 2;
    lines.push(`<text x="${x}" y="${height + 20}" text-anchor="middle" font-size="12" fill="${textColor}">${category}</text>`);
  });
  
  return lines.join('\n');
}

function createYAxis(height: number, scale: any, label: string, theme: 'light' | 'dark'): string {
  const textColor = theme === 'dark' ? '#ffffff' : '#000000';
  const lines: string[] = [];
  
  // Axis line
  lines.push(`<line x1="0" y1="0" x2="0" y2="${height}" stroke="${textColor}"/>`);
  
  // Ticks and labels
  if (scale.ticks) {
    scale.ticks(6).forEach((tick: number) => {
      const y = scale(tick);
      lines.push(`<line x1="-5" y1="${y}" x2="0" y2="${y}" stroke="${textColor}"/>`);
      lines.push(`<text x="-10" y="${y + 5}" text-anchor="end" font-size="12" fill="${textColor}">${tick}</text>`);
    });
  }
  
  // Axis label (rotated)
  lines.push(`<text x="-50" y="${height / 2}" text-anchor="middle" font-size="14" fill="${textColor}" transform="rotate(-90, -50, ${height / 2})">${label}</text>`);
  
  return lines.join('\n');
}

function createLegend(items: string[], colors: string[], x: number, y: number, theme: 'light' | 'dark'): string {
  const textColor = theme === 'dark' ? '#ffffff' : '#000000';
  const lines: string[] = [];
  
  lines.push(`<g transform="translate(${x}, ${y})">`);
  
  items.forEach((item, idx) => {
    const yOffset = idx * 20;
    lines.push(`<rect x="0" y="${yOffset}" width="15" height="15" fill="${colors[idx % colors.length]}"/>`);
    lines.push(`<text x="20" y="${yOffset + 12}" font-size="12" fill="${textColor}">${item}</text>`);
  });
  
  lines.push('</g>');
  
  return lines.join('\n');
}

function createRadarGrid(cx: number, cy: number, radius: number, sides: number, theme: 'light' | 'dark'): string {
  const strokeColor = theme === 'dark' ? '#333333' : '#e0e0e0';
  const lines: string[] = [];
  
  // Concentric polygons
  for (let i = 1; i <= 5; i++) {
    const r = (radius * i) / 5;
    const points: string[] = [];
    
    for (let j = 0; j < sides; j++) {
      const angle = (j * 2 * Math.PI) / sides - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      points.push(`${x},${y}`);
    }
    
    lines.push(`<polygon points="${points.join(' ')}" fill="none" stroke="${strokeColor}" stroke-dasharray="2,2"/>`);
  }
  
  // Spokes
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    lines.push(`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${strokeColor}"/>`);
  }
  
  return lines.join('\n');
}

function createPolygon(points: Array<{ x: number; y: number }>, color: string, opacity: number = 1): string {
  const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
  return `<polygon points="${pointsStr}" fill="${color}" opacity="${opacity}"/>`;
}

function ratingToValue(rating: string | undefined): number {
  const values: Record<string, number> = {
    'imperceptible': 5,
    'good': 4,
    'acceptable': 3,
    'slow': 2,
    'unusable': 1,
  };
  return values[rating || ''] || 0;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Export chart as PNG (requires external converter)
 */
export async function exportChartAsPng(
  svg: string,
  outputPath: string,
  width: number,
  height: number
): Promise<void> {
  // This would require an external tool like svg2png or Puppeteer
  // For now, we just save the SVG
  const svgPath = outputPath.replace(/\.png$/, '.svg');
  await Deno.writeTextFile(svgPath, svg);
  
  console.log(`SVG saved to: ${svgPath}`);
  console.log('Note: PNG conversion requires external tools');
}

/**
 * Generate chart collection HTML
 */
export function generateChartCollection(
  charts: ChartData[],
  title: string = 'Benchmark Charts'
): string {
  const html: string[] = [];
  
  html.push('<!DOCTYPE html>');
  html.push('<html>');
  html.push('<head>');
  html.push(`<title>${escapeXml(title)}</title>`);
  html.push('<style>');
  html.push('body { font-family: Arial, sans-serif; margin: 20px; }');
  html.push('.chart { margin: 30px 0; border: 1px solid #ddd; padding: 20px; }');
  html.push('.chart-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }');
  html.push('.chart-subtitle { font-size: 16px; color: #666; margin-bottom: 20px; }');
  html.push('.metadata { font-size: 12px; color: #999; margin-top: 10px; }');
  html.push('</style>');
  html.push('</head>');
  html.push('<body>');
  html.push(`<h1>${escapeXml(title)}</h1>`);
  
  charts.forEach(chart => {
    html.push('<div class="chart">');
    html.push(`<div class="chart-title">${escapeXml(chart.title)}</div>`);
    if (chart.subtitle) {
      html.push(`<div class="chart-subtitle">${escapeXml(chart.subtitle)}</div>`);
    }
    html.push(chart.svg);
    html.push('<div class="metadata">');
    html.push(`Generated: ${chart.metadata.timestamp.toLocaleString()} | `);
    html.push(`Data points: ${chart.metadata.dataPoints} | `);
    html.push(`Managers: ${chart.metadata.managers.join(', ')}`);
    html.push('</div>');
    html.push('</div>');
  });
  
  html.push('</body>');
  html.push('</html>');
  
  return html.join('\n');
}