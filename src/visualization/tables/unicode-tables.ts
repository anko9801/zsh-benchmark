/**
 * Advanced Unicode table visualizations with colors and effects
 * Creates visually appealing terminal output with ANSI colors
 */

import { BenchmarkData, BenchmarkResult } from "../../core/types.ts";
import { calculatePerceptualScore, PerceptualRating } from "../../engines/perceptual.ts";
import { calculateWeightedScore } from "../../engines/weighted.ts";
import { HistoryEntry } from "../../storage/history/schema.ts";
import { VersionComparison } from "../../storage/history/storage.ts";

export interface UnicodeTableOptions {
  useColors: boolean;
  useEmoji: boolean;
  showSparklines: boolean;
  showProgressBars: boolean;
  showHeatmap: boolean;
  theme: 'default' | 'minimal' | 'fancy' | 'neon';
  width?: number;
}

const DEFAULT_OPTIONS: UnicodeTableOptions = {
  useColors: true,
  useEmoji: true,
  showSparklines: true,
  showProgressBars: true,
  showHeatmap: true,
  theme: 'default',
  width: 120,
};

// ANSI color codes
const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  
  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  
  // Bright colors
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
  
  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
  bgGray: '\x1b[100m',
};

// Unicode box drawing with different styles
const BOX_STYLES = {
  default: {
    horizontal: '─',
    vertical: '│',
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    cross: '┼',
    topJoin: '┬',
    bottomJoin: '┴',
    leftJoin: '├',
    rightJoin: '┤',
  },
  minimal: {
    horizontal: '─',
    vertical: ' ',
    topLeft: ' ',
    topRight: ' ',
    bottomLeft: ' ',
    bottomRight: ' ',
    cross: '─',
    topJoin: '─',
    bottomJoin: '─',
    leftJoin: ' ',
    rightJoin: ' ',
  },
  fancy: {
    horizontal: '═',
    vertical: '║',
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    cross: '╬',
    topJoin: '╦',
    bottomJoin: '╩',
    leftJoin: '╠',
    rightJoin: '╣',
  },
  neon: {
    horizontal: '━',
    vertical: '┃',
    topLeft: '┏',
    topRight: '┓',
    bottomLeft: '┗',
    bottomRight: '┛',
    cross: '╋',
    topJoin: '┳',
    bottomJoin: '┻',
    leftJoin: '┣',
    rightJoin: '┫',
  },
};

/**
 * Generate a beautiful performance dashboard
 */
export function generatePerformanceDashboard(
  data: BenchmarkData,
  options: UnicodeTableOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines: string[] = [];
  
  // Header
  lines.push(createDashboardHeader(data, opts));
  lines.push('');
  
  // Summary stats
  lines.push(createSummaryStats(data, opts));
  lines.push('');
  
  // Main performance table
  lines.push(createPerformanceTable(data, 25, opts));
  lines.push('');
  
  // Interactive metrics sparklines
  if (opts.showSparklines) {
    lines.push(createSparklineSection(data, opts));
    lines.push('');
  }
  
  // Pattern suitability heatmap
  if (opts.showHeatmap) {
    lines.push(createPatternHeatmap(data, 25, opts));
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Generate comparison dashboard between versions
 */
export function generateComparisonDashboard(
  comparison: VersionComparison,
  history: HistoryEntry[],
  options: UnicodeTableOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines: string[] = [];
  
  // Header
  lines.push(createComparisonHeader(comparison, opts));
  lines.push('');
  
  // Change summary
  lines.push(createChangeSummary(comparison, opts));
  lines.push('');
  
  // Detailed changes table
  lines.push(createChangesTable(comparison, opts));
  lines.push('');
  
  // Trend indicators
  if (history.length > 2) {
    lines.push(createTrendIndicators(history, opts));
    lines.push('');
  }
  
  return lines.join('\n');
}

// Component functions

function createDashboardHeader(data: BenchmarkData, opts: UnicodeTableOptions): string {
  const lines: string[] = [];
  const boxChars = BOX_STYLES[opts.theme];
  const width = opts.width || 120;
  
  const title = ' ZSH PLUGIN MANAGER BENCHMARK DASHBOARD ';
  const timestamp = ` ${new Date(data.timestamp).toLocaleString()} `;
  
  // Top border
  lines.push(
    colorize(boxChars.topLeft, 'cyan', opts) +
    colorize(boxChars.horizontal.repeat(width - 2), 'cyan', opts) +
    colorize(boxChars.topRight, 'cyan', opts)
  );
  
  // Title line
  const titlePadding = Math.floor((width - title.length - 2) / 2);
  lines.push(
    colorize(boxChars.vertical, 'cyan', opts) +
    ' '.repeat(titlePadding) +
    colorize(title, 'brightCyan', opts, true) +
    ' '.repeat(width - titlePadding - title.length - 2) +
    colorize(boxChars.vertical, 'cyan', opts)
  );
  
  // Timestamp line
  const timestampPadding = Math.floor((width - timestamp.length - 2) / 2);
  lines.push(
    colorize(boxChars.vertical, 'cyan', opts) +
    ' '.repeat(timestampPadding) +
    colorize(timestamp, 'gray', opts) +
    ' '.repeat(width - timestampPadding - timestamp.length - 2) +
    colorize(boxChars.vertical, 'cyan', opts)
  );
  
  // Bottom border
  lines.push(
    colorize(boxChars.bottomLeft, 'cyan', opts) +
    colorize(boxChars.horizontal.repeat(width - 2), 'cyan', opts) +
    colorize(boxChars.bottomRight, 'cyan', opts)
  );
  
  return lines.join('\n');
}

function createSummaryStats(data: BenchmarkData, opts: UnicodeTableOptions): string {
  const lines: string[] = [];
  const results25 = data.results.filter(r => r.pluginCount === 25);
  
  // Calculate stats
  const loadTimes = results25.map(r => r.loadTime).filter(t => t !== null) as number[];
  const commandLags = results25.map(r => r.commandLag).filter(t => t !== null) as number[];
  
  const stats = [
    {
      label: 'Plugin Managers',
      value: new Set(data.results.map(r => r.manager)).size,
      icon: '📊',
    },
    {
      label: 'Total Tests',
      value: data.results.length,
      icon: '🧪',
    },
    {
      label: 'Fastest Load',
      value: loadTimes.length > 0 ? `${Math.min(...loadTimes)}ms` : 'N/A',
      icon: '⚡',
    },
    {
      label: 'Best Interactivity',
      value: commandLags.length > 0 ? `${Math.min(...commandLags)}ms` : 'N/A',
      icon: '🎯',
    },
  ];
  
  // Create stat boxes
  const boxWidth = Math.floor((opts.width! - stats.length + 1) / stats.length);
  const statBoxes = stats.map(stat => createStatBox(stat, boxWidth, opts));
  
  // Join boxes horizontally
  const boxLines = statBoxes[0].split('\n').length;
  for (let i = 0; i < boxLines; i++) {
    lines.push(statBoxes.map(box => box.split('\n')[i]).join(' '));
  }
  
  return lines.join('\n');
}

function createStatBox(stat: { label: string; value: any; icon: string }, width: number, opts: UnicodeTableOptions): string {
  const lines: string[] = [];
  const boxChars = BOX_STYLES[opts.theme];
  
  // Top border
  lines.push(
    colorize(boxChars.topLeft, 'gray', opts) +
    colorize(boxChars.horizontal.repeat(width - 2), 'gray', opts) +
    colorize(boxChars.topRight, 'gray', opts)
  );
  
  // Icon and label
  const iconLine = opts.useEmoji ? stat.icon : '';
  const labelPadding = Math.floor((width - stat.label.length - iconLine.length - 3) / 2);
  lines.push(
    colorize(boxChars.vertical, 'gray', opts) +
    ' '.repeat(labelPadding) +
    iconLine + ' ' +
    colorize(stat.label, 'white', opts) +
    ' '.repeat(width - labelPadding - stat.label.length - iconLine.length - 3) +
    colorize(boxChars.vertical, 'gray', opts)
  );
  
  // Value
  const valueStr = String(stat.value);
  const valuePadding = Math.floor((width - valueStr.length - 2) / 2);
  lines.push(
    colorize(boxChars.vertical, 'gray', opts) +
    ' '.repeat(valuePadding) +
    colorize(valueStr, 'brightYellow', opts, true) +
    ' '.repeat(width - valuePadding - valueStr.length - 2) +
    colorize(boxChars.vertical, 'gray', opts)
  );
  
  // Bottom border
  lines.push(
    colorize(boxChars.bottomLeft, 'gray', opts) +
    colorize(boxChars.horizontal.repeat(width - 2), 'gray', opts) +
    colorize(boxChars.bottomRight, 'gray', opts)
  );
  
  return lines.join('\n');
}

function createPerformanceTable(data: BenchmarkData, pluginCount: number, opts: UnicodeTableOptions): string {
  const lines: string[] = [];
  const boxChars = BOX_STYLES[opts.theme];
  
  // Filter and sort results
  let results = data.results.filter(r => r.pluginCount === pluginCount);
  results = results.sort((a, b) => {
    const scoreA = calculateWeightedScore(a).normalized;
    const scoreB = calculateWeightedScore(b).normalized;
    return scoreB - scoreA;
  });
  
  // Table header
  lines.push(colorize(`📊 Performance Rankings (${pluginCount} plugins)`, 'brightWhite', opts, true));
  lines.push('');
  
  // Column definitions
  const cols = [
    { key: 'rank', label: 'Rank', width: 6 },
    { key: 'manager', label: 'Plugin Manager', width: 18 },
    { key: 'loadTime', label: 'Load Time', width: 12 },
    { key: 'commandLag', label: 'Cmd Lag', width: 10 },
    { key: 'score', label: 'Score', width: 8 },
    { key: 'rating', label: 'Rating', width: 12 },
    { key: 'bar', label: 'Performance', width: 25 },
  ];
  
  // Header row
  const headerCells = cols.map(col => {
    const padding = col.width - col.label.length;
    const leftPad = Math.floor(padding / 2);
    return ' '.repeat(leftPad) + colorize(col.label, 'brightCyan', opts, true) + ' '.repeat(padding - leftPad);
  });
  
  lines.push(boxChars.vertical + headerCells.join(boxChars.vertical) + boxChars.vertical);
  lines.push(createTableSeparator(cols, boxChars));
  
  // Data rows
  results.forEach((result, idx) => {
    const perceptual = calculatePerceptualScore(result);
    const weighted = calculateWeightedScore(result);
    
    const cells = [
      formatRankCell(idx + 1, cols[0].width, opts),
      formatManagerCell(result.manager, cols[1].width, opts),
      formatTimeCell(result.loadTime, cols[2].width, opts),
      formatTimeCell(result.commandLag, cols[3].width, opts),
      formatScoreCell(weighted.normalized, cols[4].width, opts),
      formatRatingCell(perceptual.overall, cols[5].width, opts),
      formatProgressBar(weighted.normalized, cols[6].width, opts),
    ];
    
    lines.push(boxChars.vertical + cells.join(boxChars.vertical) + boxChars.vertical);
  });
  
  return lines.join('\n');
}

function createSparklineSection(data: BenchmarkData, opts: UnicodeTableOptions): string {
  const lines: string[] = [];
  const managers = [...new Set(data.results.map(r => r.manager))].sort();
  
  lines.push(colorize('📈 Performance Trends', 'brightWhite', opts, true));
  lines.push('');
  
  managers.forEach(manager => {
    const results = data.results
      .filter(r => r.manager === manager)
      .sort((a, b) => a.pluginCount - b.pluginCount);
    
    if (results.length > 1) {
      const loadTimes = results.map(r => r.loadTime || 0);
      const sparkline = createSparkline(loadTimes);
      
      lines.push(
        colorize(manager.padEnd(15), 'white', opts) +
        colorize(' Load: ', 'gray', opts) +
        sparkline +
        colorize(` (${Math.min(...loadTimes)}-${Math.max(...loadTimes)}ms)`, 'gray', opts)
      );
      
      // Command lag sparkline if available
      const commandLags = results.map(r => r.commandLag).filter(c => c !== null) as number[];
      if (commandLags.length > 1) {
        const cmdSparkline = createSparkline(commandLags);
        lines.push(
          ' '.repeat(15) +
          colorize(' Cmd:  ', 'gray', opts) +
          cmdSparkline +
          colorize(` (${Math.min(...commandLags)}-${Math.max(...commandLags)}ms)`, 'gray', opts)
        );
      }
    }
  });
  
  return lines.join('\n');
}

function createPatternHeatmap(data: BenchmarkData, pluginCount: number, opts: UnicodeTableOptions): string {
  const lines: string[] = [];
  const results = data.results.filter(r => r.pluginCount === pluginCount);
  
  lines.push(colorize('🔥 Usage Pattern Suitability Heatmap', 'brightWhite', opts, true));
  lines.push('');
  
  // Pattern headers
  const patterns = ['Min', 'Dev', 'Pwr', 'Srv', 'Con', 'CI'];
  const headerLine = ''.padEnd(15) + patterns.map(p => p.padStart(5)).join('');
  lines.push(colorize(headerLine, 'gray', opts));
  
  // Manager rows
  results.forEach(result => {
    const cells = [result.manager.padEnd(15)];
    
    // Calculate pattern scores (simplified)
    const scores = [
      result.loadTime! < 200 ? 3 : result.loadTime! < 300 ? 2 : 1, // Minimal
      result.commandLag !== null && result.commandLag < 20 ? 3 : 2, // Developer
      result.loadTime! < 500 ? 2 : 1, // Power user
      result.firstPromptLag !== null && result.firstPromptLag < 100 ? 3 : 2, // Server
      result.installTime! < 15000 ? 3 : 1, // Container
      result.installTime! < 10000 && result.loadTime! < 100 ? 3 : 1, // CI/CD
    ];
    
    scores.forEach(score => {
      const cell = createHeatmapCell(score, 3, opts);
      cells.push(cell.padStart(5));
    });
    
    lines.push(cells.join(''));
  });
  
  // Legend
  lines.push('');
  lines.push(
    colorize('Legend: ', 'gray', opts) +
    createHeatmapCell(3, 3, opts) + ' Excellent  ' +
    createHeatmapCell(2, 3, opts) + ' Good  ' +
    createHeatmapCell(1, 3, opts) + ' Poor'
  );
  
  return lines.join('\n');
}

// Helper functions

function createTableSeparator(cols: Array<{ width: number }>, boxChars: any): string {
  const parts: string[] = [boxChars.leftJoin];
  
  cols.forEach((col, idx) => {
    parts.push(boxChars.horizontal.repeat(col.width));
    if (idx < cols.length - 1) {
      parts.push(boxChars.cross);
    }
  });
  
  parts.push(boxChars.rightJoin);
  return parts.join('');
}

function formatRankCell(rank: number, width: number, opts: UnicodeTableOptions): string {
  let content = '';
  
  if (opts.useEmoji) {
    if (rank === 1) content = '🥇';
    else if (rank === 2) content = '🥈';
    else if (rank === 3) content = '🥉';
    else content = String(rank);
  } else {
    content = String(rank);
  }
  
  const color = rank <= 3 ? 'brightYellow' : 'white';
  const padding = width - content.length - 2;
  const leftPad = Math.floor(padding / 2);
  
  return ' '.repeat(leftPad + 1) + colorize(content, color, opts, rank <= 3) + ' '.repeat(padding - leftPad + 1);
}

function formatManagerCell(manager: string, width: number, opts: UnicodeTableOptions): string {
  const truncated = manager.length > width - 2 ? manager.slice(0, width - 3) + '…' : manager;
  return ' ' + colorize(truncated, 'white', opts).padEnd(width - 1);
}

function formatTimeCell(time: number | null | undefined, width: number, opts: UnicodeTableOptions): string {
  if (time === null || time === undefined) {
    return ' '.repeat(width);
  }
  
  const formatted = time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(1)}s`;
  const color = time < 100 ? 'brightGreen' : time < 300 ? 'yellow' : 'red';
  
  return formatted.padStart(width - 1) + ' ';
}

function formatScoreCell(score: number, width: number, opts: UnicodeTableOptions): string {
  const formatted = score.toFixed(0);
  const color = score >= 80 ? 'brightGreen' : score >= 60 ? 'yellow' : 'red';
  
  return colorize(formatted, color, opts).padStart(width - 1) + ' ';
}

function formatRatingCell(rating: PerceptualRating, width: number, opts: UnicodeTableOptions): string {
  const emoji = {
    'imperceptible': '⚡',
    'good': '✓',
    'acceptable': '~',
    'slow': '!',
    'unusable': '✗',
  };
  
  const color = {
    'imperceptible': 'brightGreen',
    'good': 'green',
    'acceptable': 'yellow',
    'slow': 'red',
    'unusable': 'brightRed',
  };
  
  const icon = opts.useEmoji ? emoji[rating] : rating.slice(0, 3).toUpperCase();
  const content = `${icon} ${rating}`;
  
  return ' ' + colorize(content, color[rating] as keyof typeof COLORS, opts).padEnd(width - 1);
}

function formatProgressBar(value: number, width: number, opts: UnicodeTableOptions): string {
  const barWidth = width - 4;
  const filledWidth = Math.round((value / 100) * barWidth);
  
  const filled = opts.theme === 'neon' ? '█' : '■';
  const empty = opts.theme === 'neon' ? '░' : '□';
  
  const color = value >= 80 ? 'brightGreen' : value >= 60 ? 'yellow' : 'red';
  
  const bar = colorize(filled.repeat(filledWidth), color, opts) +
              colorize(empty.repeat(barWidth - filledWidth), 'gray', opts);
  
  return ` ${bar} `;
}

function createSparkline(values: number[]): string {
  if (values.length === 0) return '';
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  
  const sparkChars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  
  return values.map(v => {
    const normalized = (v - min) / range;
    const idx = Math.min(Math.floor(normalized * sparkChars.length), sparkChars.length - 1);
    return sparkChars[idx];
  }).join('');
}

function createHeatmapCell(value: number, maxValue: number, opts: UnicodeTableOptions): string {
  const blocks = ['░', '▒', '▓', '█'];
  const colors = ['red', 'yellow', 'green', 'brightGreen'];
  
  const idx = Math.min(Math.floor((value / maxValue) * blocks.length), blocks.length - 1);
  const block = blocks[idx];
  const color = colors[idx] as keyof typeof COLORS;
  
  return colorize(block.repeat(3), color, opts);
}

// Comparison dashboard functions

function createComparisonHeader(comparison: VersionComparison, opts: UnicodeTableOptions): string {
  const lines: string[] = [];
  const boxChars = BOX_STYLES[opts.theme];
  const width = opts.width || 120;
  
  const title = ' VERSION COMPARISON ';
  const versions = ` ${comparison.id1.slice(0, 8)} → ${comparison.id2.slice(0, 8)} `;
  
  // Top border
  lines.push(
    colorize(boxChars.topLeft, 'magenta', opts) +
    colorize(boxChars.horizontal.repeat(width - 2), 'magenta', opts) +
    colorize(boxChars.topRight, 'magenta', opts)
  );
  
  // Title
  const titlePadding = Math.floor((width - title.length - 2) / 2);
  lines.push(
    colorize(boxChars.vertical, 'magenta', opts) +
    ' '.repeat(titlePadding) +
    colorize(title, 'brightMagenta', opts, true) +
    ' '.repeat(width - titlePadding - title.length - 2) +
    colorize(boxChars.vertical, 'magenta', opts)
  );
  
  // Versions
  const versionsPadding = Math.floor((width - versions.length - 2) / 2);
  lines.push(
    colorize(boxChars.vertical, 'magenta', opts) +
    ' '.repeat(versionsPadding) +
    colorize(versions, 'gray', opts) +
    ' '.repeat(width - versionsPadding - versions.length - 2) +
    colorize(boxChars.vertical, 'magenta', opts)
  );
  
  // Bottom border
  lines.push(
    colorize(boxChars.bottomLeft, 'magenta', opts) +
    colorize(boxChars.horizontal.repeat(width - 2), 'magenta', opts) +
    colorize(boxChars.bottomRight, 'magenta', opts)
  );
  
  return lines.join('\n');
}

function createChangeSummary(comparison: VersionComparison, opts: UnicodeTableOptions): string {
  const lines: string[] = [];
  const { summary } = comparison;
  
  // Summary boxes
  const boxes = [
    {
      label: 'Improvements',
      value: summary.improvements,
      icon: '📈',
      color: 'brightGreen' as keyof typeof COLORS,
    },
    {
      label: 'Regressions',
      value: summary.regressions,
      icon: '📉',
      color: 'brightRed' as keyof typeof COLORS,
    },
    {
      label: 'Unchanged',
      value: summary.unchanged,
      icon: '➖',
      color: 'gray' as keyof typeof COLORS,
    },
  ];
  
  const boxWidth = Math.floor((opts.width! - boxes.length + 1) / boxes.length);
  
  // Create and join boxes
  const boxLines = boxes.map(box => {
    const lines: string[] = [];
    const icon = opts.useEmoji ? box.icon + ' ' : '';
    
    lines.push(colorize(`${icon}${box.label}`, 'white', opts, true));
    lines.push(colorize(String(box.value), box.color, opts, true));
    
    return lines;
  });
  
  // Join horizontally
  for (let i = 0; i < 2; i++) {
    const parts = boxLines.map(box => {
      const content = box[i];
      const padding = boxWidth - content.length;
      const leftPad = Math.floor(padding / 2);
      return ' '.repeat(leftPad) + content + ' '.repeat(padding - leftPad);
    });
    lines.push(parts.join(''));
  }
  
  return lines.join('\n');
}

function createChangesTable(comparison: VersionComparison, opts: UnicodeTableOptions): string {
  const lines: string[] = [];
  const significantChanges = comparison.changes.filter(c => Math.abs(c.percentChange) > 5);
  
  if (significantChanges.length === 0) {
    return colorize('No significant changes detected', 'gray', opts);
  }
  
  // Sort by absolute change
  significantChanges.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));
  
  lines.push(colorize('Significant Changes:', 'white', opts, true));
  lines.push('');
  
  significantChanges.forEach(change => {
    const isImprovement = change.percentChange < 0;
    const icon = opts.useEmoji ? (isImprovement ? '✅' : '❌') : (isImprovement ? '+' : '-');
    const color = isImprovement ? 'green' : 'red';
    
    const changeStr = `${Math.abs(change.percentChange).toFixed(1)}%`;
    const direction = isImprovement ? 'faster' : 'slower';
    
    lines.push(
      `${icon} ` +
      colorize(change.manager.padEnd(15), 'white', opts) +
      colorize(formatMetricName(change.metric).padEnd(20), 'gray', opts) +
      colorize(`${changeStr} ${direction}`, color, opts, true) +
      colorize(` (${change.oldValue}ms → ${change.newValue}ms)`, 'gray', opts)
    );
  });
  
  return lines.join('\n');
}

function createTrendIndicators(history: HistoryEntry[], opts: UnicodeTableOptions): string {
  const lines: string[] = [];
  
  lines.push(colorize('Historical Trends:', 'white', opts, true));
  lines.push('');
  
  // Get unique managers
  const managers = [...new Set(history.flatMap(h => h.results.map(r => r.manager)))];
  
  managers.forEach(manager => {
    // Get load times over history
    const loadTimes = history.map(h => {
      const result = h.results.find(r => r.manager === manager && r.pluginCount === 25);
      return result?.loadTime || null;
    }).filter(t => t !== null) as number[];
    
    if (loadTimes.length >= 3) {
      const trend = calculateTrend(loadTimes);
      const trendIcon = trend < -5 ? '📈' : trend > 5 ? '📉' : '➡️';
      const trendColor = trend < -5 ? 'green' : trend > 5 ? 'red' : 'gray';
      
      const sparkline = createSparkline(loadTimes);
      
      lines.push(
        colorize(manager.padEnd(15), 'white', opts) +
        sparkline + ' ' +
        (opts.useEmoji ? trendIcon : '') + ' ' +
        colorize(`${Math.abs(trend).toFixed(1)}% ${trend < 0 ? 'improvement' : 'regression'}`, trendColor, opts)
      );
    }
  });
  
  return lines.join('\n');
}

// Utility functions

function colorize(text: string, color: keyof typeof COLORS, opts: UnicodeTableOptions, bold: boolean = false): string {
  if (!opts.useColors) return text;
  
  let code = COLORS[color];
  if (bold) code = COLORS.bold + code;
  
  return code + text + COLORS.reset;
}

function formatMetricName(metric: string): string {
  const names: Record<string, string> = {
    loadTime: 'Load Time',
    installTime: 'Install Time',
    firstPromptLag: 'First Prompt',
    firstCommandLag: 'First Command',
    commandLag: 'Command Lag',
    inputLag: 'Input Lag',
  };
  return names[metric] || metric;
}

function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;
  
  const first = values.slice(0, Math.floor(values.length / 2));
  const second = values.slice(Math.floor(values.length / 2));
  
  const avgFirst = first.reduce((a, b) => a + b) / first.length;
  const avgSecond = second.reduce((a, b) => a + b) / second.length;
  
  return ((avgSecond - avgFirst) / avgFirst) * 100;
}

/**
 * Generate a live updating dashboard (for terminal UI)
 */
export function generateLiveDashboard(
  data: BenchmarkData,
  updateInterval: number = 1000,
  options: UnicodeTableOptions = {}
): AsyncGenerator<string, void, unknown> {
  return (async function* () {
    let frameCount = 0;
    const spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    
    while (true) {
      // Clear screen
      const clearScreen = '\x1b[2J\x1b[H';
      
      // Generate dashboard with current frame
      const spinner = spinners[frameCount % spinners.length];
      const dashboard = generatePerformanceDashboard(data, {
        ...options,
        useEmoji: true,
      });
      
      // Add live indicator
      const liveIndicator = colorize(`${spinner} Live Update`, 'brightRed', options, true);
      
      yield clearScreen + dashboard + '\n\n' + liveIndicator;
      
      frameCount++;
      await new Promise(resolve => setTimeout(resolve, updateInterval));
    }
  })();
}

/**
 * Export dashboard as ANSI art file
 */
export async function exportDashboardAsANSI(
  dashboard: string,
  outputPath: string
): Promise<void> {
  await Deno.writeTextFile(outputPath, dashboard);
}