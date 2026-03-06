/**
 * Heatmap visualization for multi-dimensional benchmark comparisons
 * Shows performance across managers and metrics with color coding
 */

import { BenchmarkData, BenchmarkResult } from "../../core/types.ts";
import { calculatePerceptualScore, PerceptualRating } from "../../engines/perceptual.ts";
import { calculateWeightedScore } from "../../engines/weighted.ts";
import { calculatePatternScore, UsagePattern } from "../../engines/patterns.ts";

export interface HeatmapOptions {
  width?: number;
  height?: number;
  cellSize?: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  colorScheme?: 'green-red' | 'blue-red' | 'viridis' | 'plasma';
  showValues?: boolean;
  showTooltips?: boolean;
  normalize?: boolean;
  theme?: 'light' | 'dark';
}

export interface HeatmapData {
  title: string;
  svg: string;
  legend: string;
  insights: string[];
}

const DEFAULT_OPTIONS: HeatmapOptions = {
  width: 900,
  height: 600,
  cellSize: 60,
  margin: { top: 100, right: 100, bottom: 50, left: 150 },
  colorScheme: 'green-red',
  showValues: true,
  showTooltips: true,
  normalize: true,
  theme: 'light',
};

/**
 * Color schemes for heatmaps
 */
const COLOR_SCHEMES = {
  'green-red': {
    colors: ['#00ff00', '#90ee90', '#ffffe0', '#ffb6c1', '#ff0000'],
    midpoint: 0.5,
  },
  'blue-red': {
    colors: ['#0000ff', '#6495ed', '#ffffff', '#ff6347', '#ff0000'],
    midpoint: 0.5,
  },
  'viridis': {
    colors: ['#440154', '#3e4989', '#31688e', '#35b779', '#fde725'],
    midpoint: 0.5,
  },
  'plasma': {
    colors: ['#0d0887', '#6a00a8', '#b12a90', '#e16462', '#fca636'],
    midpoint: 0.5,
  },
};

/**
 * Generate performance heatmap
 */
export function generatePerformanceHeatmap(
  data: BenchmarkData,
  pluginCount: number,
  options: HeatmapOptions = {}
): HeatmapData {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Filter results
  const results = data.results.filter(r => r.pluginCount === pluginCount);
  const managers = [...new Set(results.map(r => r.manager))].sort();
  
  // Metrics to display
  const metrics = [
    { key: 'loadTime', label: 'Load Time' },
    { key: 'installTime', label: 'Install Time' },
    { key: 'firstPromptLag', label: 'First Prompt' },
    { key: 'firstCommandLag', label: 'First Command' },
    { key: 'commandLag', label: 'Command Lag' },
    { key: 'inputLag', label: 'Input Lag' },
  ];

  // Create matrix
  const matrix: Array<Array<{ value: number | null; normalized: number }>> = [];
  const insights: string[] = [];

  managers.forEach((manager, i) => {
    matrix[i] = [];
    const result = results.find(r => r.manager === manager);
    
    if (result) {
      metrics.forEach((metric, j) => {
        const value = result[metric.key as keyof BenchmarkResult] as number | null;
        let normalized = 0;
        
        if (value !== null && value !== undefined) {
          // Normalize based on all values for this metric
          const allValues = results
            .map(r => r[metric.key as keyof BenchmarkResult] as number)
            .filter(v => v !== null && v !== undefined);
          
          if (allValues.length > 0) {
            const min = Math.min(...allValues);
            const max = Math.max(...allValues);
            
            if (opts.normalize && max > min) {
              // Invert normalization so lower values (better) have higher scores
              normalized = 1 - (value - min) / (max - min);
            } else {
              normalized = value;
            }
          }
        }
        
        matrix[i][j] = { value, normalized };
      });
    }
  });

  // Generate insights
  insights.push(...generateHeatmapInsights(matrix, managers, metrics));

  // Create SVG
  const svg = createHeatmapSVG(matrix, managers, metrics, opts);
  const legend = createHeatmapLegend(opts);

  return {
    title: `Performance Heatmap (${pluginCount} plugins)`,
    svg,
    legend,
    insights,
  };
}

/**
 * Generate perceptual rating heatmap
 */
export function generatePerceptualHeatmap(
  data: BenchmarkData,
  pluginCount: number,
  options: HeatmapOptions = {}
): HeatmapData {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Filter results
  const results = data.results.filter(r => r.pluginCount === pluginCount);
  const managers = [...new Set(results.map(r => r.manager))].sort();
  
  // Perceptual categories
  const categories = [
    { key: 'firstPrompt', label: 'First Prompt' },
    { key: 'firstCommand', label: 'First Command' },
    { key: 'command', label: 'Command Lag' },
    { key: 'input', label: 'Input Lag' },
    { key: 'load', label: 'Load Time' },
    { key: 'overall', label: 'Overall' },
  ];

  // Create matrix
  const matrix: Array<Array<{ rating: PerceptualRating | undefined; value: number }>> = [];
  const insights: string[] = [];

  managers.forEach((manager, i) => {
    matrix[i] = [];
    const result = results.find(r => r.manager === manager);
    
    if (result) {
      const score = calculatePerceptualScore(result);
      
      categories.forEach((category, j) => {
        let rating: PerceptualRating | undefined;
        
        if (category.key === 'overall') {
          rating = score.overall;
        } else {
          rating = score.breakdown[category.key as keyof typeof score.breakdown];
        }
        
        const value = ratingToNumericValue(rating);
        matrix[i][j] = { rating, value };
      });
    }
  });

  // Generate insights
  const excellentManagers = managers.filter((m, i) => 
    matrix[i][categories.length - 1]?.value >= 4
  );
  
  if (excellentManagers.length > 0) {
    insights.push(`Excellent perceptual performance: ${excellentManagers.join(', ')}`);
  }

  const poorManagers = managers.filter((m, i) => 
    matrix[i][categories.length - 1]?.value <= 2
  );
  
  if (poorManagers.length > 0) {
    insights.push(`Poor perceptual performance: ${poorManagers.join(', ')}`);
  }

  // Create SVG
  const svg = createPerceptualHeatmapSVG(matrix, managers, categories, opts);
  const legend = createPerceptualLegend(opts);

  return {
    title: `Perceptual Performance Heatmap (${pluginCount} plugins)`,
    svg,
    legend,
    insights,
  };
}

/**
 * Generate usage pattern comparison heatmap
 */
export function generatePatternHeatmap(
  data: BenchmarkData,
  pluginCount: number,
  options: HeatmapOptions = {}
): HeatmapData {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Filter results
  const results = data.results.filter(r => r.pluginCount === pluginCount);
  const managers = [...new Set(results.map(r => r.manager))].sort();
  
  // Usage patterns
  const patterns: Array<{ key: UsagePattern; label: string }> = [
    { key: 'minimal', label: 'Minimal' },
    { key: 'developer', label: 'Developer' },
    { key: 'power-user', label: 'Power User' },
    { key: 'server', label: 'Server' },
    { key: 'container', label: 'Container' },
    { key: 'ci-cd', label: 'CI/CD' },
  ];

  // Create matrix
  const matrix: Array<Array<{ score: number; suitability: string }>> = [];
  const insights: string[] = [];

  managers.forEach((manager, i) => {
    matrix[i] = [];
    const result = results.find(r => r.manager === manager);
    
    if (result) {
      patterns.forEach((pattern, j) => {
        const score = calculatePatternScore(result, pattern.key);
        matrix[i][j] = {
          score: score.totalScore,
          suitability: score.suitability,
        };
      });
    }
  });

  // Generate insights
  patterns.forEach((pattern, j) => {
    const bestIdx = matrix.reduce((best, row, i) => 
      row[j]?.score > matrix[best][j]?.score ? i : best, 0
    );
    
    if (matrix[bestIdx][j]?.suitability === 'excellent') {
      insights.push(`Best for ${pattern.label}: ${managers[bestIdx]}`);
    }
  });

  // Create SVG
  const svg = createPatternHeatmapSVG(matrix, managers, patterns, opts);
  const legend = createPatternLegend(opts);

  return {
    title: `Usage Pattern Suitability (${pluginCount} plugins)`,
    svg,
    legend,
    insights,
  };
}

// Helper functions

function createHeatmapSVG(
  matrix: Array<Array<{ value: number | null; normalized: number }>>,
  rowLabels: string[],
  colLabels: Array<{ key: string; label: string }>,
  options: HeatmapOptions
): string {
  const { width, height, margin, cellSize, theme } = options;
  const colorScheme = COLOR_SCHEMES[options.colorScheme!];
  
  const svg: string[] = [];
  svg.push(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`);
  
  // Background
  svg.push(`<rect width="${width}" height="${height}" fill="${theme === 'dark' ? '#1a1a1a' : '#ffffff'}"/>`);
  
  // Title area
  svg.push(`<g transform="translate(${margin.left},${margin.top})">`);
  
  // Draw cells
  matrix.forEach((row, i) => {
    row.forEach((cell, j) => {
      const x = j * cellSize;
      const y = i * cellSize;
      const color = getColorForValue(cell.normalized, colorScheme);
      
      // Cell rectangle
      svg.push(`<rect x="${x}" y="${y}" width="${cellSize - 2}" height="${cellSize - 2}" fill="${color}" stroke="${theme === 'dark' ? '#333' : '#ccc'}"/>`);
      
      // Value text
      if (options.showValues && cell.value !== null) {
        const textColor = cell.normalized > 0.5 ? '#000' : '#fff';
        svg.push(`<text x="${x + cellSize / 2}" y="${y + cellSize / 2}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="${textColor}">${cell.value.toFixed(0)}</text>`);
      }
      
      // Tooltip
      if (options.showTooltips) {
        svg.push(`<title>${rowLabels[i]} - ${colLabels[j].label}: ${cell.value?.toFixed(2) || 'N/A'}</title>`);
      }
    });
  });
  
  // Row labels
  rowLabels.forEach((label, i) => {
    const y = i * cellSize + cellSize / 2;
    svg.push(`<text x="${-10}" y="${y}" text-anchor="end" dominant-baseline="middle" font-size="12" fill="${theme === 'dark' ? '#fff' : '#000'}">${label}</text>`);
  });
  
  // Column labels
  colLabels.forEach((col, j) => {
    const x = j * cellSize + cellSize / 2;
    svg.push(`<text x="${x}" y="${-10}" text-anchor="middle" font-size="12" fill="${theme === 'dark' ? '#fff' : '#000'}" transform="rotate(-45, ${x}, -10)">${col.label}</text>`);
  });
  
  svg.push('</g>');
  svg.push('</svg>');
  
  return svg.join('\n');
}

function createPerceptualHeatmapSVG(
  matrix: Array<Array<{ rating: PerceptualRating | undefined; value: number }>>,
  rowLabels: string[],
  colLabels: Array<{ key: string; label: string }>,
  options: HeatmapOptions
): string {
  const { width, height, margin, cellSize, theme } = options;
  
  const svg: string[] = [];
  svg.push(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`);
  
  // Background
  svg.push(`<rect width="${width}" height="${height}" fill="${theme === 'dark' ? '#1a1a1a' : '#ffffff'}"/>`);
  
  // Title area
  svg.push(`<g transform="translate(${margin.left},${margin.top})">`);
  
  // Draw cells
  matrix.forEach((row, i) => {
    row.forEach((cell, j) => {
      const x = j * cellSize;
      const y = i * cellSize;
      const color = getPerceptualColor(cell.rating);
      
      // Cell rectangle
      svg.push(`<rect x="${x}" y="${y}" width="${cellSize - 2}" height="${cellSize - 2}" fill="${color}" stroke="${theme === 'dark' ? '#333' : '#ccc'}"/>`);
      
      // Rating emoji
      if (cell.rating) {
        const emoji = getPerceptualEmoji(cell.rating);
        svg.push(`<text x="${x + cellSize / 2}" y="${y + cellSize / 2}" text-anchor="middle" dominant-baseline="middle" font-size="20">${emoji}</text>`);
      }
      
      // Tooltip
      if (options.showTooltips) {
        svg.push(`<title>${rowLabels[i]} - ${colLabels[j].label}: ${cell.rating || 'N/A'}</title>`);
      }
    });
  });
  
  // Row labels
  rowLabels.forEach((label, i) => {
    const y = i * cellSize + cellSize / 2;
    svg.push(`<text x="${-10}" y="${y}" text-anchor="end" dominant-baseline="middle" font-size="12" fill="${theme === 'dark' ? '#fff' : '#000'}">${label}</text>`);
  });
  
  // Column labels
  colLabels.forEach((col, j) => {
    const x = j * cellSize + cellSize / 2;
    svg.push(`<text x="${x}" y="${-10}" text-anchor="middle" font-size="12" fill="${theme === 'dark' ? '#fff' : '#000'}" transform="rotate(-45, ${x}, -10)">${col.label}</text>`);
  });
  
  svg.push('</g>');
  svg.push('</svg>');
  
  return svg.join('\n');
}

function createPatternHeatmapSVG(
  matrix: Array<Array<{ score: number; suitability: string }>>,
  rowLabels: string[],
  colLabels: Array<{ key: string; label: string }>,
  options: HeatmapOptions
): string {
  const { width, height, margin, cellSize, theme } = options;
  
  const svg: string[] = [];
  svg.push(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`);
  
  // Background
  svg.push(`<rect width="${width}" height="${height}" fill="${theme === 'dark' ? '#1a1a1a' : '#ffffff'}"/>`);
  
  // Title area
  svg.push(`<g transform="translate(${margin.left},${margin.top})">`);
  
  // Draw cells
  matrix.forEach((row, i) => {
    row.forEach((cell, j) => {
      const x = j * cellSize;
      const y = i * cellSize;
      const color = getSuitabilityColor(cell.suitability);
      
      // Cell rectangle
      svg.push(`<rect x="${x}" y="${y}" width="${cellSize - 2}" height="${cellSize - 2}" fill="${color}" stroke="${theme === 'dark' ? '#333' : '#ccc'}"/>`);
      
      // Score text
      if (options.showValues) {
        const textColor = ['excellent', 'good'].includes(cell.suitability) ? '#000' : '#fff';
        svg.push(`<text x="${x + cellSize / 2}" y="${y + cellSize / 2}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="${textColor}">${(cell.score * 100).toFixed(0)}%</text>`);
      }
      
      // Tooltip
      if (options.showTooltips) {
        svg.push(`<title>${rowLabels[i]} - ${colLabels[j].label}: ${cell.suitability} (${(cell.score * 100).toFixed(1)}%)</title>`);
      }
    });
  });
  
  // Row labels
  rowLabels.forEach((label, i) => {
    const y = i * cellSize + cellSize / 2;
    svg.push(`<text x="${-10}" y="${y}" text-anchor="end" dominant-baseline="middle" font-size="12" fill="${theme === 'dark' ? '#fff' : '#000'}">${label}</text>`);
  });
  
  // Column labels
  colLabels.forEach((col, j) => {
    const x = j * cellSize + cellSize / 2;
    svg.push(`<text x="${x}" y="${-10}" text-anchor="middle" font-size="12" fill="${theme === 'dark' ? '#fff' : '#000'}" transform="rotate(-45, ${x}, -10)">${col.label}</text>`);
  });
  
  svg.push('</g>');
  svg.push('</svg>');
  
  return svg.join('\n');
}

function createHeatmapLegend(options: HeatmapOptions): string {
  const colorScheme = COLOR_SCHEMES[options.colorScheme!];
  const svg: string[] = [];
  
  svg.push('<svg width="300" height="50" xmlns="http://www.w3.org/2000/svg">');
  
  // Gradient
  svg.push('<defs>');
  svg.push('<linearGradient id="legend-gradient">');
  colorScheme.colors.forEach((color, i) => {
    const offset = (i / (colorScheme.colors.length - 1)) * 100;
    svg.push(`<stop offset="${offset}%" stop-color="${color}"/>`);
  });
  svg.push('</linearGradient>');
  svg.push('</defs>');
  
  // Gradient bar
  svg.push('<rect x="10" y="10" width="200" height="20" fill="url(#legend-gradient)"/>');
  
  // Labels
  svg.push('<text x="10" y="45" font-size="12">Better</text>');
  svg.push('<text x="210" y="45" text-anchor="end" font-size="12">Worse</text>');
  
  svg.push('</svg>');
  
  return svg.join('\n');
}

function createPerceptualLegend(options: HeatmapOptions): string {
  const ratings: Array<{ rating: PerceptualRating; label: string }> = [
    { rating: 'imperceptible', label: 'Imperceptible' },
    { rating: 'good', label: 'Good' },
    { rating: 'acceptable', label: 'Acceptable' },
    { rating: 'slow', label: 'Slow' },
    { rating: 'unusable', label: 'Unusable' },
  ];
  
  const svg: string[] = [];
  svg.push('<svg width="400" height="50" xmlns="http://www.w3.org/2000/svg">');
  
  ratings.forEach((item, i) => {
    const x = i * 80;
    svg.push(`<rect x="${x}" y="10" width="70" height="20" fill="${getPerceptualColor(item.rating)}"/>`);
    svg.push(`<text x="${x + 35}" y="25" text-anchor="middle" font-size="10" fill="#fff">${item.label}</text>`);
  });
  
  svg.push('</svg>');
  
  return svg.join('\n');
}

function createPatternLegend(options: HeatmapOptions): string {
  const suitabilities = [
    { key: 'excellent', color: '#00ff00', label: 'Excellent' },
    { key: 'good', color: '#90ee90', label: 'Good' },
    { key: 'acceptable', color: '#ffffe0', label: 'Acceptable' },
    { key: 'poor', color: '#ff6347', label: 'Poor' },
  ];
  
  const svg: string[] = [];
  svg.push('<svg width="400" height="50" xmlns="http://www.w3.org/2000/svg">');
  
  suitabilities.forEach((item, i) => {
    const x = i * 100;
    svg.push(`<rect x="${x}" y="10" width="90" height="20" fill="${item.color}"/>`);
    svg.push(`<text x="${x + 45}" y="25" text-anchor="middle" font-size="12">${item.label}</text>`);
  });
  
  svg.push('</svg>');
  
  return svg.join('\n');
}

function getColorForValue(value: number, colorScheme: typeof COLOR_SCHEMES['green-red']): string {
  const idx = Math.floor(value * (colorScheme.colors.length - 1));
  return colorScheme.colors[Math.max(0, Math.min(colorScheme.colors.length - 1, idx))];
}

function getPerceptualColor(rating: PerceptualRating | undefined): string {
  const colors: Record<PerceptualRating, string> = {
    'imperceptible': '#00ff00',
    'good': '#90ee90',
    'acceptable': '#ffffe0',
    'slow': '#ffb6c1',
    'unusable': '#ff0000',
  };
  return colors[rating || 'unusable'] || '#cccccc';
}

function getPerceptualEmoji(rating: PerceptualRating): string {
  const emojis: Record<PerceptualRating, string> = {
    'imperceptible': '🟢',
    'good': '🟡',
    'acceptable': '🟠',
    'slow': '🔴',
    'unusable': '⚫',
  };
  return emojis[rating];
}

function getSuitabilityColor(suitability: string): string {
  const colors: Record<string, string> = {
    'excellent': '#00ff00',
    'good': '#90ee90',
    'acceptable': '#ffffe0',
    'poor': '#ff6347',
  };
  return colors[suitability] || '#cccccc';
}

function ratingToNumericValue(rating: PerceptualRating | undefined): number {
  const values: Record<PerceptualRating, number> = {
    'imperceptible': 5,
    'good': 4,
    'acceptable': 3,
    'slow': 2,
    'unusable': 1,
  };
  return values[rating || 'unusable'] || 0;
}

function generateHeatmapInsights(
  matrix: Array<Array<{ value: number | null; normalized: number }>>,
  managers: string[],
  metrics: Array<{ key: string; label: string }>
): string[] {
  const insights: string[] = [];
  
  // Find best/worst for each metric
  metrics.forEach((metric, j) => {
    let best = { manager: '', value: Infinity };
    let worst = { manager: '', value: -Infinity };
    
    managers.forEach((manager, i) => {
      const value = matrix[i][j]?.value;
      if (value !== null && value !== undefined) {
        if (value < best.value) {
          best = { manager, value };
        }
        if (value > worst.value) {
          worst = { manager, value };
        }
      }
    });
    
    if (best.manager && worst.manager && best.manager !== worst.manager) {
      const ratio = worst.value / best.value;
      if (ratio > 2) {
        insights.push(`${metric.label}: ${best.manager} is ${ratio.toFixed(1)}x faster than ${worst.manager}`);
      }
    }
  });
  
  // Find overall best/worst
  const overallScores = managers.map((manager, i) => {
    const scores = matrix[i].map(cell => cell.normalized).filter(v => !isNaN(v));
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;
    return { manager, score: avg };
  }).sort((a, b) => b.score - a.score);
  
  if (overallScores.length > 0) {
    insights.push(`Overall best: ${overallScores[0].manager}`);
    if (overallScores.length > 1) {
      insights.push(`Overall worst: ${overallScores[overallScores.length - 1].manager}`);
    }
  }
  
  return insights;
}

/**
 * Export heatmap as interactive HTML
 */
export function exportHeatmapAsHTML(
  heatmap: HeatmapData,
  outputPath: string
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${heatmap.title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      margin-top: 0;
      color: #333;
    }
    .heatmap {
      margin: 20px 0;
    }
    .legend {
      margin: 20px 0;
    }
    .insights {
      background: #f0f0f0;
      padding: 15px;
      border-radius: 4px;
      margin-top: 20px;
    }
    .insights h3 {
      margin-top: 0;
      color: #666;
    }
    .insights ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .insights li {
      margin: 5px 0;
      color: #555;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${heatmap.title}</h1>
    
    <div class="heatmap">
      ${heatmap.svg}
    </div>
    
    <div class="legend">
      <h3>Legend</h3>
      ${heatmap.legend}
    </div>
    
    ${heatmap.insights.length > 0 ? `
    <div class="insights">
      <h3>Key Insights</h3>
      <ul>
        ${heatmap.insights.map(insight => `<li>${insight}</li>`).join('\n')}
      </ul>
    </div>
    ` : ''}
  </div>
</body>
</html>
  `;
  
  return Deno.writeTextFile(outputPath, html);
}