/**
 * ASCII/Unicode table generators for terminal and markdown output
 * Creates beautiful comparison tables for benchmark results
 */

import { BenchmarkData, BenchmarkResult } from "../../core/types.ts";
import { calculatePerceptualScore, getPerceptualEmoji } from "../../engines/perceptual.ts";
import { calculateWeightedScore } from "../../engines/weighted.ts";
import { calculatePatternScore, UsagePattern, PATTERN_CONFIGS } from "../../engines/patterns.ts";

export interface TableOptions {
  format: 'ascii' | 'unicode' | 'markdown' | 'html';
  maxWidth?: number;
  showColors?: boolean;
  showPerceptual?: boolean;
  showTrends?: boolean;
  showRankings?: boolean;
  sortBy?: 'name' | 'performance' | 'score';
  theme?: 'light' | 'dark';
}

export interface TableData {
  title: string;
  table: string;
  summary?: string;
}

const DEFAULT_OPTIONS: TableOptions = {
  format: 'unicode',
  maxWidth: 120,
  showColors: true,
  showPerceptual: true,
  showTrends: false,
  showRankings: true,
  sortBy: 'performance',
  theme: 'light',
};

// Box drawing characters
const BOX_CHARS = {
  ascii: {
    horizontal: '-',
    vertical: '|',
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    cross: '+',
    topJoin: '+',
    bottomJoin: '+',
    leftJoin: '+',
    rightJoin: '+',
  },
  unicode: {
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
};

/**
 * Generate performance comparison table
 */
export function generatePerformanceTable(
  data: BenchmarkData,
  pluginCount: number,
  options: TableOptions = {}
): TableData {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Filter results
  let results = data.results.filter(r => r.pluginCount === pluginCount);
  
  // Sort results
  results = sortResults(results, opts.sortBy!);
  
  // Prepare columns
  const columns: Column[] = [
    { key: 'rank', label: '#', width: 3, align: 'center' },
    { key: 'manager', label: 'Plugin Manager', width: 15, align: 'left' },
    { key: 'loadTime', label: 'Load Time', width: 10, align: 'right' },
    { key: 'installTime', label: 'Install Time', width: 12, align: 'right' },
  ];
  
  // Add interactive metrics if available
  const hasInteractive = results.some(r => 
    r.firstPromptLag !== null || r.commandLag !== null
  );
  
  if (hasInteractive) {
    columns.push(
      { key: 'firstPromptLag', label: 'First Prompt', width: 12, align: 'right' },
      { key: 'commandLag', label: 'Command Lag', width: 12, align: 'right' }
    );
  }
  
  if (opts.showPerceptual) {
    columns.push({ key: 'perceptual', label: 'Rating', width: 10, align: 'center' });
  }
  
  if (opts.showRankings) {
    columns.push({ key: 'score', label: 'Score', width: 8, align: 'right' });
  }
  
  // Prepare rows
  const rows: Row[] = results.map((result, idx) => {
    const perceptual = calculatePerceptualScore(result);
    const weighted = calculateWeightedScore(result, 'balanced');
    
    const row: Row = {
      rank: String(idx + 1),
      manager: result.manager,
      loadTime: formatTime(result.loadTime),
      installTime: formatTime(result.installTime),
      firstPromptLag: formatTime(result.firstPromptLag),
      commandLag: formatTime(result.commandLag),
      perceptual: opts.format === 'ascii' ? perceptual.overall : getPerceptualEmoji(perceptual.overall),
      score: weighted.normalized.toFixed(0),
      _highlight: idx === 0 ? 'best' : idx === results.length - 1 ? 'worst' : undefined,
    };
    
    return row;
  });
  
  // Generate table
  const table = formatTable(columns, rows, opts);
  
  // Generate summary
  const summary = generateTableSummary(results, opts);
  
  return {
    title: `Performance Comparison (${pluginCount} plugins)`,
    table,
    summary,
  };
}

/**
 * Generate pattern suitability table
 */
export function generatePatternTable(
  data: BenchmarkData,
  pluginCount: number,
  options: TableOptions = {}
): TableData {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Filter results
  const results = data.results.filter(r => r.pluginCount === pluginCount);
  
  // Patterns to evaluate
  const patterns: UsagePattern[] = ['minimal', 'developer', 'power-user', 'server', 'container', 'ci-cd'];
  
  // Prepare columns
  const columns: Column[] = [
    { key: 'manager', label: 'Plugin Manager', width: 15, align: 'left' },
    ...patterns.map(pattern => ({
      key: pattern,
      label: formatPatternName(pattern),
      width: 10,
      align: 'center' as const,
    })),
  ];
  
  // Calculate scores for each manager and pattern
  const rows: Row[] = results.map(result => {
    const row: Row = {
      manager: result.manager,
    };
    
    patterns.forEach(pattern => {
      const score = calculatePatternScore(result, pattern);
      row[pattern] = formatSuitability(score.suitability, opts.format);
    });
    
    return row;
  });
  
  // Sort by overall suitability
  rows.sort((a, b) => {
    const scoreA = patterns.reduce((sum, p) => sum + suitabilityToNumber(a[p] as string), 0);
    const scoreB = patterns.reduce((sum, p) => sum + suitabilityToNumber(b[p] as string), 0);
    return scoreB - scoreA;
  });
  
  // Generate table
  const table = formatTable(columns, rows, opts);
  
  return {
    title: `Usage Pattern Suitability (${pluginCount} plugins)`,
    table,
  };
}

/**
 * Generate detailed metrics table
 */
export function generateDetailedMetricsTable(
  data: BenchmarkData,
  manager: string,
  options: TableOptions = {}
): TableData {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Filter results for specific manager
  const results = data.results.filter(r => r.manager === manager);
  
  // Prepare columns
  const columns: Column[] = [
    { key: 'plugins', label: 'Plugins', width: 8, align: 'right' },
    { key: 'loadTime', label: 'Load Time', width: 10, align: 'right' },
    { key: 'loadStddev', label: '±σ', width: 8, align: 'right' },
    { key: 'installTime', label: 'Install Time', width: 12, align: 'right' },
    { key: 'firstPromptLag', label: 'First Prompt', width: 12, align: 'right' },
    { key: 'commandLag', label: 'Command Lag', width: 12, align: 'right' },
    { key: 'inputLag', label: 'Input Lag', width: 10, align: 'right' },
  ];
  
  // Prepare rows
  const rows: Row[] = results
    .sort((a, b) => a.pluginCount - b.pluginCount)
    .map(result => ({
      plugins: String(result.pluginCount),
      loadTime: formatTime(result.loadTime),
      loadStddev: result.loadStddev ? `±${result.loadStddev.toFixed(1)}` : '-',
      installTime: formatTime(result.installTime),
      firstPromptLag: formatTime(result.firstPromptLag),
      commandLag: formatTime(result.commandLag),
      inputLag: formatTime(result.inputLag),
    }));
  
  // Generate table
  const table = formatTable(columns, rows, opts);
  
  return {
    title: `${manager} - Detailed Metrics`,
    table,
  };
}

/**
 * Generate rankings table
 */
export function generateRankingsTable(
  data: BenchmarkData,
  metric: keyof BenchmarkResult,
  options: TableOptions = {}
): TableData {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Group by plugin count
  const pluginCounts = [...new Set(data.results.map(r => r.pluginCount))].sort((a, b) => a - b);
  
  // Calculate rankings for each plugin count
  const rankings: Map<string, number[]> = new Map();
  
  pluginCounts.forEach(count => {
    const results = data.results
      .filter(r => r.pluginCount === count && r[metric] !== null)
      .sort((a, b) => (a[metric] as number) - (b[metric] as number));
    
    results.forEach((result, idx) => {
      const ranks = rankings.get(result.manager) || [];
      ranks[pluginCounts.indexOf(count)] = idx + 1;
      rankings.set(result.manager, ranks);
    });
  });
  
  // Prepare columns
  const columns: Column[] = [
    { key: 'manager', label: 'Plugin Manager', width: 15, align: 'left' },
    ...pluginCounts.map(count => ({
      key: `p${count}`,
      label: `${count}p`,
      width: 6,
      align: 'center' as const,
    })),
    { key: 'avg', label: 'Avg', width: 6, align: 'center' },
  ];
  
  // Prepare rows
  const rows: Row[] = Array.from(rankings.entries())
    .map(([manager, ranks]) => {
      const row: Row = { manager };
      
      pluginCounts.forEach((count, idx) => {
        const rank = ranks[idx];
        row[`p${count}`] = rank ? formatRank(rank) : '-';
      });
      
      // Calculate average rank
      const validRanks = ranks.filter(r => r !== undefined);
      const avgRank = validRanks.length > 0
        ? validRanks.reduce((a, b) => a + b) / validRanks.length
        : null;
      
      row.avg = avgRank ? avgRank.toFixed(1) : '-';
      row._avgRank = avgRank || 999;
      
      return row;
    })
    .sort((a, b) => (a._avgRank as number) - (b._avgRank as number));
  
  // Generate table
  const table = formatTable(columns, rows, opts);
  
  return {
    title: `${formatMetricName(metric)} Rankings`,
    table,
  };
}

// Helper types

interface Column {
  key: string;
  label: string;
  width: number;
  align: 'left' | 'center' | 'right';
}

interface Row {
  [key: string]: string | number | undefined;
  _highlight?: 'best' | 'worst';
  _avgRank?: number;
}

// Formatting functions

function formatTable(columns: Column[], rows: Row[], options: TableOptions): string {
  const { format, maxWidth } = options;
  const chars = format === 'ascii' ? BOX_CHARS.ascii : BOX_CHARS.unicode;
  
  // Adjust column widths if needed
  const totalWidth = columns.reduce((sum, col) => sum + col.width + 3, 1);
  if (totalWidth > maxWidth!) {
    const scale = (maxWidth! - 1) / totalWidth;
    columns.forEach(col => {
      col.width = Math.max(3, Math.floor(col.width * scale));
    });
  }
  
  const lines: string[] = [];
  
  switch (format) {
    case 'ascii':
    case 'unicode':
      lines.push(createTableBorder(columns, chars, 'top'));
      lines.push(createTableRow(columns, columns.map(c => c.label), chars));
      lines.push(createTableBorder(columns, chars, 'middle'));
      
      rows.forEach((row, idx) => {
        lines.push(createTableRow(columns, row, chars));
        if (idx < rows.length - 1 && row._highlight) {
          lines.push(createTableBorder(columns, chars, 'middle'));
        }
      });
      
      lines.push(createTableBorder(columns, chars, 'bottom'));
      break;
      
    case 'markdown':
      lines.push(createMarkdownRow(columns, columns.map(c => c.label)));
      lines.push(createMarkdownSeparator(columns));
      rows.forEach(row => {
        lines.push(createMarkdownRow(columns, row));
      });
      break;
      
    case 'html':
      lines.push(createHTMLTable(columns, rows, options));
      break;
  }
  
  return lines.join('\n');
}

function createTableBorder(columns: Column[], chars: any, position: 'top' | 'middle' | 'bottom'): string {
  const parts: string[] = [];
  
  parts.push(chars[`${position}Left`] || chars.leftJoin);
  
  columns.forEach((col, idx) => {
    parts.push(chars.horizontal.repeat(col.width + 2));
    if (idx < columns.length - 1) {
      parts.push(chars[`${position}Join`] || chars.cross);
    }
  });
  
  parts.push(chars[`${position}Right`] || chars.rightJoin);
  
  return parts.join('');
}

function createTableRow(columns: Column[], data: any, chars: any): string {
  const parts: string[] = [];
  
  parts.push(chars.vertical);
  
  columns.forEach((col, idx) => {
    const value = data[col.key] || data[idx] || '';
    const formatted = formatCell(String(value), col.width, col.align);
    parts.push(` ${formatted} `);
    parts.push(chars.vertical);
  });
  
  return parts.join('');
}

function createMarkdownRow(columns: Column[], data: any): string {
  const parts: string[] = [];
  
  columns.forEach((col, idx) => {
    const value = data[col.key] || data[idx] || '';
    const formatted = formatCell(String(value), col.width, col.align);
    parts.push(formatted);
  });
  
  return '| ' + parts.join(' | ') + ' |';
}

function createMarkdownSeparator(columns: Column[]): string {
  const parts: string[] = [];
  
  columns.forEach(col => {
    let sep = '-'.repeat(col.width);
    if (col.align === 'center') sep = ':' + sep.slice(1, -1) + ':';
    else if (col.align === 'right') sep = sep.slice(0, -1) + ':';
    else sep = ':' + sep.slice(1);
    parts.push(sep);
  });
  
  return '| ' + parts.join(' | ') + ' |';
}

function createHTMLTable(columns: Column[], rows: Row[], options: TableOptions): string {
  const html: string[] = [];
  
  html.push('<table class="benchmark-table">');
  html.push('<thead>');
  html.push('<tr>');
  columns.forEach(col => {
    html.push(`<th align="${col.align}">${col.label}</th>`);
  });
  html.push('</tr>');
  html.push('</thead>');
  html.push('<tbody>');
  
  rows.forEach(row => {
    const className = row._highlight ? `highlight-${row._highlight}` : '';
    html.push(`<tr class="${className}">`);
    columns.forEach(col => {
      const value = row[col.key] || '';
      html.push(`<td align="${col.align}">${value}</td>`);
    });
    html.push('</tr>');
  });
  
  html.push('</tbody>');
  html.push('</table>');
  
  return html.join('\n');
}

function formatCell(value: string, width: number, align: 'left' | 'center' | 'right'): string {
  if (value.length > width) {
    return value.slice(0, width - 1) + '…';
  }
  
  const padding = width - value.length;
  
  switch (align) {
    case 'left':
      return value + ' '.repeat(padding);
    case 'right':
      return ' '.repeat(padding) + value;
    case 'center':
      const leftPad = Math.floor(padding / 2);
      const rightPad = padding - leftPad;
      return ' '.repeat(leftPad) + value + ' '.repeat(rightPad);
  }
}

// Utility functions

function sortResults(results: BenchmarkResult[], sortBy: string): BenchmarkResult[] {
  const sorted = [...results];
  
  switch (sortBy) {
    case 'name':
      sorted.sort((a, b) => a.manager.localeCompare(b.manager));
      break;
      
    case 'performance':
      sorted.sort((a, b) => {
        const scoreA = calculateWeightedScore(a).normalized;
        const scoreB = calculateWeightedScore(b).normalized;
        return scoreB - scoreA;
      });
      break;
      
    case 'score':
      sorted.sort((a, b) => {
        const perceptualA = calculatePerceptualScore(a);
        const perceptualB = calculatePerceptualScore(b);
        const valueA = perceptualRatingToNumber(perceptualA.overall);
        const valueB = perceptualRatingToNumber(perceptualB.overall);
        return valueB - valueA;
      });
      break;
  }
  
  return sorted;
}

function formatTime(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  
  if (value < 1000) {
    return `${value.toFixed(0)}ms`;
  } else {
    return `${(value / 1000).toFixed(1)}s`;
  }
}

function formatRank(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return String(rank);
}

function formatSuitability(suitability: string, format: string): string {
  const emoji: Record<string, string> = {
    'excellent': '⭐⭐⭐',
    'good': '⭐⭐',
    'acceptable': '⭐',
    'poor': '✗',
  };
  
  if (format === 'ascii') {
    return suitability.slice(0, 3).toUpperCase();
  }
  
  return emoji[suitability] || suitability;
}

function formatPatternName(pattern: UsagePattern): string {
  const names: Record<UsagePattern, string> = {
    'minimal': 'Minimal',
    'developer': 'Developer',
    'power-user': 'Power User',
    'server': 'Server',
    'container': 'Container',
    'ci-cd': 'CI/CD',
  };
  return names[pattern];
}

function formatMetricName(metric: string): string {
  const names: Record<string, string> = {
    loadTime: 'Load Time',
    installTime: 'Install Time',
    firstPromptLag: 'First Prompt Lag',
    firstCommandLag: 'First Command Lag',
    commandLag: 'Command Lag',
    inputLag: 'Input Lag',
  };
  return names[metric] || metric;
}

function suitabilityToNumber(suitability: string): number {
  const values: Record<string, number> = {
    '⭐⭐⭐': 3,
    '⭐⭐': 2,
    '⭐': 1,
    '✗': 0,
    'EXC': 3,
    'GOO': 2,
    'ACC': 1,
    'POO': 0,
  };
  return values[suitability] || 0;
}

function perceptualRatingToNumber(rating: string): number {
  const values: Record<string, number> = {
    'imperceptible': 5,
    'good': 4,
    'acceptable': 3,
    'slow': 2,
    'unusable': 1,
  };
  return values[rating] || 0;
}

function generateTableSummary(results: BenchmarkResult[], options: TableOptions): string {
  const lines: string[] = [];
  
  // Find best performers
  const byLoadTime = [...results].sort((a, b) => (a.loadTime || Infinity) - (b.loadTime || Infinity));
  const byCommandLag = [...results].sort((a, b) => (a.commandLag || Infinity) - (b.commandLag || Infinity));
  
  if (byLoadTime[0].loadTime !== null) {
    lines.push(`Fastest load time: ${byLoadTime[0].manager} (${byLoadTime[0].loadTime}ms)`);
  }
  
  if (byCommandLag[0].commandLag !== null) {
    lines.push(`Best interactivity: ${byCommandLag[0].manager} (${byCommandLag[0].commandLag}ms command lag)`);
  }
  
  // Performance spread
  const loadTimes = results.map(r => r.loadTime).filter(t => t !== null) as number[];
  if (loadTimes.length > 1) {
    const min = Math.min(...loadTimes);
    const max = Math.max(...loadTimes);
    const ratio = max / min;
    lines.push(`Performance spread: ${ratio.toFixed(1)}x (${min}ms - ${max}ms)`);
  }
  
  return lines.join('\n');
}

/**
 * Generate comparison matrix table
 */
export function generateComparisonMatrix(
  data: BenchmarkData,
  metrics: Array<keyof BenchmarkResult>,
  pluginCount: number,
  options: TableOptions = {}
): TableData {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Filter results
  const results = data.results.filter(r => r.pluginCount === pluginCount);
  const managers = results.map(r => r.manager).sort();
  
  // Prepare data matrix
  const matrix: string[][] = [];
  
  // Header row
  matrix.push(['', ...metrics.map(m => formatMetricName(m))]);
  
  // Data rows
  managers.forEach(manager => {
    const result = results.find(r => r.manager === manager);
    if (result) {
      const row = [manager];
      
      metrics.forEach(metric => {
        const value = result[metric] as number | null;
        if (value !== null && value !== undefined) {
          // Find rank for this metric
          const sorted = results
            .filter(r => r[metric] !== null)
            .sort((a, b) => (a[metric] as number) - (b[metric] as number));
          const rank = sorted.findIndex(r => r.manager === manager) + 1;
          
          // Format with rank indicator
          const rankEmoji = rank <= 3 ? formatRank(rank) : '';
          row.push(`${formatTime(value)} ${rankEmoji}`);
        } else {
          row.push('-');
        }
      });
      
      matrix.push(row);
    }
  });
  
  // Create table based on format
  if (opts.format === 'markdown') {
    const lines: string[] = [];
    lines.push('| ' + matrix[0].join(' | ') + ' |');
    lines.push('|' + matrix[0].map(() => ' --- ').join('|') + '|');
    matrix.slice(1).forEach(row => {
      lines.push('| ' + row.join(' | ') + ' |');
    });
    return {
      title: `Performance Matrix (${pluginCount} plugins)`,
      table: lines.join('\n'),
    };
  }
  
  // For other formats, convert to column format
  const columns: Column[] = [
    { key: 'manager', label: 'Manager', width: 15, align: 'left' },
    ...metrics.map((metric, idx) => ({
      key: `m${idx}`,
      label: formatMetricName(metric),
      width: 15,
      align: 'right' as const,
    })),
  ];
  
  const rows: Row[] = matrix.slice(1).map(row => {
    const rowData: Row = { manager: row[0] };
    metrics.forEach((_, idx) => {
      rowData[`m${idx}`] = row[idx + 1];
    });
    return rowData;
  });
  
  return {
    title: `Performance Matrix (${pluginCount} plugins)`,
    table: formatTable(columns, rows, opts),
  };
}

/**
 * Export table collection as text file
 */
export async function exportTableCollection(
  tables: TableData[],
  outputPath: string,
  format: 'text' | 'markdown' | 'html' = 'text'
): Promise<void> {
  const content: string[] = [];
  
  switch (format) {
    case 'text':
      tables.forEach(table => {
        content.push('=' .repeat(80));
        content.push(table.title);
        content.push('=' .repeat(80));
        content.push('');
        content.push(table.table);
        if (table.summary) {
          content.push('');
          content.push(table.summary);
        }
        content.push('');
        content.push('');
      });
      break;
      
    case 'markdown':
      content.push('# Benchmark Results');
      content.push('');
      tables.forEach(table => {
        content.push(`## ${table.title}`);
        content.push('');
        content.push(table.table);
        if (table.summary) {
          content.push('');
          content.push('### Summary');
          content.push(table.summary);
        }
        content.push('');
      });
      break;
      
    case 'html':
      content.push('<!DOCTYPE html>');
      content.push('<html>');
      content.push('<head>');
      content.push('<title>Benchmark Results</title>');
      content.push('<style>');
      content.push(`
        body { font-family: monospace; margin: 20px; }
        h1, h2 { font-family: Arial, sans-serif; }
        table { border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background: #f5f5f5; }
        .highlight-best { background: #e8f5e9; }
        .highlight-worst { background: #ffebee; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
      `);
      content.push('</style>');
      content.push('</head>');
      content.push('<body>');
      content.push('<h1>Benchmark Results</h1>');
      
      tables.forEach(table => {
        content.push(`<h2>${table.title}</h2>`);
        if (table.table.startsWith('<table')) {
          content.push(table.table);
        } else {
          content.push('<pre>');
          content.push(table.table);
          content.push('</pre>');
        }
        if (table.summary) {
          content.push('<h3>Summary</h3>');
          content.push(`<p>${table.summary.replace(/\n/g, '<br>')}</p>`);
        }
      });
      
      content.push('</body>');
      content.push('</html>');
      break;
  }
  
  await Deno.writeTextFile(outputPath, content.join('\n'));
}