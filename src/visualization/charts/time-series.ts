/**
 * Time series visualization for tracking performance trends
 * Shows how metrics change over time across versions
 */

import { HistoryEntry } from "../../storage/history/schema.ts";
import { BenchmarkResult } from "../../core/types.ts";
import { calculatePerceptualScore } from "../../engines/perceptual.ts";
import { calculateWeightedScore } from "../../engines/weighted.ts";

export interface TimeSeriesOptions {
  width?: number;
  height?: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
  managers?: string[];
  metrics?: string[];
  pluginCount?: number;
  showRegression?: boolean;
  showConfidenceBands?: boolean;
  showAnnotations?: boolean;
  theme?: 'light' | 'dark';
  aggregation?: 'daily' | 'weekly' | 'monthly';
}

export interface TimeSeriesData {
  title: string;
  svg: string;
  trends: TrendAnalysis[];
  annotations: Annotation[];
}

export interface TrendAnalysis {
  manager: string;
  metric: string;
  trend: 'improving' | 'stable' | 'degrading';
  changePercent: number;
  regressionLine?: {
    slope: number;
    intercept: number;
    r2: number;
  };
}

export interface Annotation {
  date: Date;
  type: 'regression' | 'improvement' | 'version' | 'event';
  message: string;
  managers: string[];
}

const DEFAULT_OPTIONS: TimeSeriesOptions = {
  width: 1000,
  height: 600,
  margin: { top: 50, right: 150, bottom: 80, left: 80 },
  showRegression: true,
  showConfidenceBands: true,
  showAnnotations: true,
  theme: 'light',
  aggregation: 'daily',
  pluginCount: 25,
};

/**
 * Generate time series chart for a specific metric
 */
export function generateMetricTimeSeries(
  history: HistoryEntry[],
  metric: keyof BenchmarkResult,
  options: TimeSeriesOptions = {}
): TimeSeriesData {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { width, height, margin } = opts;
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Process data
  const seriesData = processTimeSeriesData(history, metric, opts);
  const { series, dateExtent, valueExtent } = seriesData;

  // Perform trend analysis
  const trends = analyzeTrends(series, metric);
  
  // Detect anomalies and create annotations
  const annotations = detectAnomalies(series, metric, opts);

  // Create scales
  const xScale = createTimeScale(dateExtent[0], dateExtent[1], 0, chartWidth);
  const yScale = createLinearScale(0, valueExtent[1] * 1.1, chartHeight, 0);

  // Create SVG
  const svg: string[] = [];
  svg.push(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`);
  
  // Background
  svg.push(`<rect width="${width}" height="${height}" fill="${opts.theme === 'dark' ? '#1a1a1a' : '#ffffff'}"/>`);

  // Title
  svg.push(`<text x="${width / 2}" y="30" text-anchor="middle" font-size="20" font-weight="bold" fill="${opts.theme === 'dark' ? '#ffffff' : '#000000'}">${formatMetricName(metric)} Over Time</text>`);

  // Chart area
  svg.push(`<g transform="translate(${margin.left},${margin.top})">`);

  // Grid
  svg.push(createTimeSeriesGrid(chartWidth, chartHeight, xScale, yScale, opts.theme));

  // Annotations
  if (opts.showAnnotations) {
    svg.push(createAnnotations(annotations, xScale, chartHeight, opts.theme));
  }

  // Plot series
  const colors = getManagerColors();
  series.forEach((managerSeries, idx) => {
    const color = colors[managerSeries.manager] || `hsl(${idx * 60}, 70%, 50%)`;
    
    // Confidence bands
    if (opts.showConfidenceBands && managerSeries.confidence) {
      svg.push(createConfidenceBand(
        managerSeries.confidence,
        xScale,
        yScale,
        color,
        0.2
      ));
    }

    // Main line
    svg.push(createTimeSeriesLine(
      managerSeries.points,
      xScale,
      yScale,
      color,
      managerSeries.manager
    ));

    // Regression line
    if (opts.showRegression && trends.length > 0) {
      const trend = trends.find(t => t.manager === managerSeries.manager);
      if (trend?.regressionLine) {
        svg.push(createRegressionLine(
          trend.regressionLine,
          xScale,
          yScale,
          dateExtent,
          color,
          'dashed'
        ));
      }
    }

    // Data points
    managerSeries.points.forEach(point => {
      svg.push(createDataPoint(xScale(point.date), yScale(point.value), color, 3));
    });
  });

  // Axes
  svg.push(createTimeAxis(chartWidth, chartHeight, xScale, opts.theme));
  svg.push(createValueAxis(chartHeight, yScale, formatMetricName(metric), opts.theme));

  svg.push('</g>');

  // Legend
  svg.push(createTimeSeriesLegend(
    series.map(s => ({
      label: s.manager,
      color: colors[s.manager] || `hsl(${series.indexOf(s) * 60}, 70%, 50%)`,
      trend: trends.find(t => t.manager === s.manager),
    })),
    width - margin.right - 120,
    margin.top + 20,
    opts.theme
  ));

  svg.push('</svg>');

  return {
    title: `${formatMetricName(metric)} Performance Trends`,
    svg: svg.join('\n'),
    trends,
    annotations,
  };
}

/**
 * Generate comparative time series for multiple metrics
 */
export function generateMultiMetricTimeSeries(
  history: HistoryEntry[],
  manager: string,
  metrics: Array<keyof BenchmarkResult>,
  options: TimeSeriesOptions = {}
): TimeSeriesData {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { width, height, margin } = opts;
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Process data for each metric
  const allSeries: any[] = [];
  let dateExtent: [Date, Date] = [new Date(), new Date(0)];

  metrics.forEach(metric => {
    const data = processTimeSeriesData(history, metric, { ...opts, managers: [manager] });
    if (data.series.length > 0) {
      // Normalize values to 0-100 scale
      const normalizedSeries = normalizeTimeSeries(data.series[0], metric);
      allSeries.push({ metric, series: normalizedSeries });
      
      // Update date extent
      if (data.dateExtent[0] < dateExtent[0]) dateExtent[0] = data.dateExtent[0];
      if (data.dateExtent[1] > dateExtent[1]) dateExtent[1] = data.dateExtent[1];
    }
  });

  // Create scales
  const xScale = createTimeScale(dateExtent[0], dateExtent[1], 0, chartWidth);
  const yScale = createLinearScale(0, 100, chartHeight, 0);

  // Create SVG
  const svg: string[] = [];
  svg.push(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`);
  
  // Background
  svg.push(`<rect width="${width}" height="${height}" fill="${opts.theme === 'dark' ? '#1a1a1a' : '#ffffff'}"/>`);

  // Title
  svg.push(`<text x="${width / 2}" y="30" text-anchor="middle" font-size="20" font-weight="bold" fill="${opts.theme === 'dark' ? '#ffffff' : '#000000'}">${manager} - Multi-Metric Trends</text>`);

  // Chart area
  svg.push(`<g transform="translate(${margin.left},${margin.top})">`);

  // Grid
  svg.push(createTimeSeriesGrid(chartWidth, chartHeight, xScale, yScale, opts.theme));

  // Plot series
  const metricColors = getMetricColors();
  allSeries.forEach((item, idx) => {
    const color = metricColors[item.metric] || `hsl(${idx * 45}, 70%, 50%)`;
    
    // Line
    svg.push(createTimeSeriesLine(
      item.series.points,
      xScale,
      yScale,
      color,
      formatMetricName(item.metric)
    ));

    // Data points
    item.series.points.forEach((point: any) => {
      svg.push(createDataPoint(xScale(point.date), yScale(point.value), color, 3));
    });
  });

  // Axes
  svg.push(createTimeAxis(chartWidth, chartHeight, xScale, opts.theme));
  svg.push(createValueAxis(chartHeight, yScale, 'Normalized Performance (0-100)', opts.theme));

  svg.push('</g>');

  // Legend
  svg.push(createTimeSeriesLegend(
    allSeries.map(item => ({
      label: formatMetricName(item.metric),
      color: metricColors[item.metric] || `hsl(${allSeries.indexOf(item) * 45}, 70%, 50%)`,
    })),
    width - margin.right - 120,
    margin.top + 20,
    opts.theme
  ));

  svg.push('</svg>');

  return {
    title: `${manager} Performance Trends`,
    svg: svg.join('\n'),
    trends: [],
    annotations: [],
  };
}

/**
 * Generate score evolution chart
 */
export function generateScoreEvolution(
  history: HistoryEntry[],
  scoreType: 'perceptual' | 'weighted' | 'pattern',
  options: TimeSeriesOptions = {}
): TimeSeriesData {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { width, height, margin } = opts;
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Process score data
  const scoreData = processScoreData(history, scoreType, opts);
  const { series, dateExtent } = scoreData;

  // Create scales
  const xScale = createTimeScale(dateExtent[0], dateExtent[1], 0, chartWidth);
  const yScale = createLinearScale(0, 100, chartHeight, 0);

  // Create SVG
  const svg: string[] = [];
  svg.push(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`);
  
  // Background
  svg.push(`<rect width="${width}" height="${height}" fill="${opts.theme === 'dark' ? '#1a1a1a' : '#ffffff'}"/>`);

  // Title
  const titleMap = {
    perceptual: 'Perceptual Score Evolution',
    weighted: 'Weighted Performance Score',
    pattern: 'Usage Pattern Score',
  };
  svg.push(`<text x="${width / 2}" y="30" text-anchor="middle" font-size="20" font-weight="bold" fill="${opts.theme === 'dark' ? '#ffffff' : '#000000'}">${titleMap[scoreType]}</text>`);

  // Chart area
  svg.push(`<g transform="translate(${margin.left},${margin.top})">`);

  // Grid
  svg.push(createTimeSeriesGrid(chartWidth, chartHeight, xScale, yScale, opts.theme));

  // Reference lines
  svg.push(createReferenceLines(chartWidth, yScale, [
    { value: 80, label: 'Excellent', color: '#00ff00' },
    { value: 60, label: 'Good', color: '#90ee90' },
    { value: 40, label: 'Acceptable', color: '#ffffe0' },
    { value: 20, label: 'Poor', color: '#ff6347' },
  ], opts.theme));

  // Plot series
  const colors = getManagerColors();
  series.forEach((managerSeries, idx) => {
    const color = colors[managerSeries.manager] || `hsl(${idx * 60}, 70%, 50%)`;
    
    // Area fill
    svg.push(createAreaFill(
      managerSeries.points,
      xScale,
      yScale,
      color,
      0.2
    ));

    // Line
    svg.push(createTimeSeriesLine(
      managerSeries.points,
      xScale,
      yScale,
      color,
      managerSeries.manager,
      2
    ));

    // Data points with score badges
    managerSeries.points.forEach((point: any) => {
      const x = xScale(point.date);
      const y = yScale(point.value);
      
      svg.push(createDataPoint(x, y, color, 4));
      
      // Score badge on hover
      svg.push(`<g class="score-badge" opacity="0">`);
      svg.push(`<rect x="${x - 20}" y="${y - 25}" width="40" height="20" fill="${color}" rx="3"/>`);
      svg.push(`<text x="${x}" y="${y - 12}" text-anchor="middle" font-size="11" fill="#fff">${point.value.toFixed(0)}</text>`);
      svg.push(`<animate attributeName="opacity" from="0" to="1" dur="0.2s" begin="mouseover" fill="freeze"/>`);
      svg.push(`<animate attributeName="opacity" from="1" to="0" dur="0.2s" begin="mouseout" fill="freeze"/>`);
      svg.push('</g>');
    });
  });

  // Axes
  svg.push(createTimeAxis(chartWidth, chartHeight, xScale, opts.theme));
  svg.push(createValueAxis(chartHeight, yScale, 'Score (0-100)', opts.theme));

  svg.push('</g>');

  // Legend
  svg.push(createTimeSeriesLegend(
    series.map(s => ({
      label: s.manager,
      color: colors[s.manager] || `hsl(${series.indexOf(s) * 60}, 70%, 50%)`,
      currentScore: s.points[s.points.length - 1]?.value,
    })),
    width - margin.right - 120,
    margin.top + 20,
    opts.theme
  ));

  svg.push('</svg>');

  return {
    title: titleMap[scoreType],
    svg: svg.join('\n'),
    trends: [],
    annotations: [],
  };
}

// Helper functions

function processTimeSeriesData(
  history: HistoryEntry[],
  metric: keyof BenchmarkResult,
  options: TimeSeriesOptions
): {
  series: Array<{
    manager: string;
    points: Array<{ date: Date; value: number }>;
    confidence?: Array<{ date: Date; lower: number; upper: number }>;
  }>;
  dateExtent: [Date, Date];
  valueExtent: [number, number];
} {
  const { dateRange, managers, pluginCount, aggregation } = options;
  
  // Filter history
  let filteredHistory = history;
  if (dateRange) {
    filteredHistory = history.filter(entry => {
      const date = new Date(entry.timestamp);
      return date >= dateRange.start && date <= dateRange.end;
    });
  }

  // Group by manager
  const managerData = new Map<string, Array<{ date: Date; value: number }>>();
  
  filteredHistory.forEach(entry => {
    entry.results.forEach(result => {
      if (result.pluginCount === pluginCount) {
        if (!managers || managers.includes(result.manager)) {
          const value = result[metric] as number;
          if (value !== null && value !== undefined) {
            const points = managerData.get(result.manager) || [];
            points.push({ date: new Date(entry.timestamp), value });
            managerData.set(result.manager, points);
          }
        }
      }
    });
  });

  // Aggregate data
  const series: any[] = [];
  let minDate = new Date();
  let maxDate = new Date(0);
  let minValue = Infinity;
  let maxValue = -Infinity;

  managerData.forEach((points, manager) => {
    // Sort by date
    points.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Aggregate if needed
    const aggregatedPoints = aggregatePoints(points, aggregation!);
    
    // Calculate confidence bands
    const confidence = calculateConfidenceBands(aggregatedPoints);
    
    // Update extents
    aggregatedPoints.forEach(point => {
      if (point.date < minDate) minDate = point.date;
      if (point.date > maxDate) maxDate = point.date;
      if (point.value < minValue) minValue = point.value;
      if (point.value > maxValue) maxValue = point.value;
    });
    
    series.push({ manager, points: aggregatedPoints, confidence });
  });

  return {
    series,
    dateExtent: [minDate, maxDate],
    valueExtent: [Math.max(0, minValue), maxValue],
  };
}

function processScoreData(
  history: HistoryEntry[],
  scoreType: 'perceptual' | 'weighted' | 'pattern',
  options: TimeSeriesOptions
): {
  series: Array<{
    manager: string;
    points: Array<{ date: Date; value: number; details?: any }>;
  }>;
  dateExtent: [Date, Date];
} {
  const { dateRange, managers, pluginCount } = options;
  
  // Filter history
  let filteredHistory = history;
  if (dateRange) {
    filteredHistory = history.filter(entry => {
      const date = new Date(entry.timestamp);
      return date >= dateRange.start && date <= dateRange.end;
    });
  }

  // Calculate scores
  const managerScores = new Map<string, Array<{ date: Date; value: number; details?: any }>>();
  
  filteredHistory.forEach(entry => {
    entry.results.forEach(result => {
      if (result.pluginCount === pluginCount) {
        if (!managers || managers.includes(result.manager)) {
          let score = 0;
          let details: any;
          
          switch (scoreType) {
            case 'perceptual':
              const perceptual = calculatePerceptualScore(result);
              // Convert to 0-100 scale
              const ratingValues: Record<string, number> = {
                'imperceptible': 100,
                'good': 80,
                'acceptable': 60,
                'slow': 40,
                'unusable': 20,
              };
              score = ratingValues[perceptual.overall] || 0;
              details = perceptual;
              break;
              
            case 'weighted':
              const weighted = calculateWeightedScore(result, 'balanced');
              score = weighted.normalized;
              details = weighted;
              break;
              
            case 'pattern':
              // For pattern, we'd need to specify which pattern
              // Using 'developer' as default
              const pattern = calculatePatternScore(result, 'developer');
              score = pattern.totalScore * 100;
              details = pattern;
              break;
          }
          
          const points = managerScores.get(result.manager) || [];
          points.push({ date: new Date(entry.timestamp), value: score, details });
          managerScores.set(result.manager, points);
        }
      }
    });
  });

  // Convert to series format
  const series: any[] = [];
  let minDate = new Date();
  let maxDate = new Date(0);
  
  managerScores.forEach((points, manager) => {
    // Sort by date
    points.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Update date extent
    points.forEach(point => {
      if (point.date < minDate) minDate = point.date;
      if (point.date > maxDate) maxDate = point.date;
    });
    
    series.push({ manager, points });
  });

  return {
    series,
    dateExtent: [minDate, maxDate],
  };
}

function aggregatePoints(
  points: Array<{ date: Date; value: number }>,
  aggregation: 'daily' | 'weekly' | 'monthly'
): Array<{ date: Date; value: number }> {
  if (aggregation === 'daily') return points;
  
  const grouped = new Map<string, number[]>();
  
  points.forEach(point => {
    let key: string;
    const date = point.date;
    
    switch (aggregation) {
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
        
      case 'monthly':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
        
      default:
        key = date.toISOString().split('T')[0];
    }
    
    const values = grouped.get(key) || [];
    values.push(point.value);
    grouped.set(key, values);
  });
  
  // Calculate averages
  const aggregated: Array<{ date: Date; value: number }> = [];
  
  grouped.forEach((values, key) => {
    const avg = values.reduce((a, b) => a + b) / values.length;
    aggregated.push({
      date: new Date(key),
      value: avg,
    });
  });
  
  return aggregated.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function calculateConfidenceBands(
  points: Array<{ date: Date; value: number }>
): Array<{ date: Date; lower: number; upper: number }> {
  // Simple confidence bands based on moving standard deviation
  const window = 5;
  const bands: Array<{ date: Date; lower: number; upper: number }> = [];
  
  points.forEach((point, idx) => {
    const start = Math.max(0, idx - Math.floor(window / 2));
    const end = Math.min(points.length, idx + Math.floor(window / 2) + 1);
    const windowPoints = points.slice(start, end);
    
    const values = windowPoints.map(p => p.value);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    );
    
    bands.push({
      date: point.date,
      lower: Math.max(0, mean - 1.96 * stdDev),
      upper: mean + 1.96 * stdDev,
    });
  });
  
  return bands;
}

function analyzeTrends(
  series: Array<any>,
  metric: string
): TrendAnalysis[] {
  const trends: TrendAnalysis[] = [];
  
  series.forEach(managerSeries => {
    if (managerSeries.points.length < 3) return;
    
    // Simple linear regression
    const regression = calculateLinearRegression(managerSeries.points);
    
    // Determine trend
    let trend: 'improving' | 'stable' | 'degrading';
    const changePercent = (regression.slope / managerSeries.points[0].value) * 100;
    
    if (Math.abs(changePercent) < 5) {
      trend = 'stable';
    } else if (changePercent < 0) {
      trend = 'improving'; // Lower values are better
    } else {
      trend = 'degrading';
    }
    
    trends.push({
      manager: managerSeries.manager,
      metric,
      trend,
      changePercent: Math.abs(changePercent),
      regressionLine: regression,
    });
  });
  
  return trends;
}

function calculateLinearRegression(
  points: Array<{ date: Date; value: number }>
): { slope: number; intercept: number; r2: number } {
  const n = points.length;
  const x = points.map((_, i) => i);
  const y = points.map(p => p.value);
  
  const sumX = x.reduce((a, b) => a + b);
  const sumY = y.reduce((a, b) => a + b);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R²
  const yMean = sumY / n;
  const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const ssResidual = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  const r2 = 1 - (ssResidual / ssTotal);
  
  return { slope, intercept, r2 };
}

function detectAnomalies(
  series: Array<any>,
  metric: string,
  options: TimeSeriesOptions
): Annotation[] {
  const annotations: Annotation[] = [];
  
  series.forEach(managerSeries => {
    if (managerSeries.points.length < 5) return;
    
    // Simple anomaly detection using z-score
    const values = managerSeries.points.map((p: any) => p.value);
    const mean = values.reduce((a: number, b: number) => a + b) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum: number, v: number) => sum + Math.pow(v - mean, 2), 0) / values.length
    );
    
    managerSeries.points.forEach((point: any, idx: number) => {
      const zScore = Math.abs((point.value - mean) / stdDev);
      
      if (zScore > 2.5) {
        const changePercent = ((point.value - mean) / mean) * 100;
        const type = changePercent > 0 ? 'regression' : 'improvement';
        
        annotations.push({
          date: point.date,
          type,
          message: `${managerSeries.manager}: ${Math.abs(changePercent).toFixed(1)}% ${type === 'regression' ? 'slower' : 'faster'} than average`,
          managers: [managerSeries.manager],
        });
      }
    });
  });
  
  return annotations;
}

function normalizeTimeSeries(
  series: any,
  metric: keyof BenchmarkResult
): any {
  const values = series.points.map((p: any) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  return {
    ...series,
    points: series.points.map((p: any) => ({
      ...p,
      value: max > min ? ((max - p.value) / (max - min)) * 100 : 50,
    })),
  };
}

// Visualization helpers

function createTimeScale(startDate: Date, endDate: Date, rangeMin: number, rangeMax: number) {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  
  const scale = (date: Date) => {
    const time = date.getTime();
    return rangeMin + ((time - startTime) / (endTime - startTime)) * (rangeMax - rangeMin);
  };
  
  scale.ticks = (count: number = 6) => {
    const step = (endTime - startTime) / (count - 1);
    return Array.from({ length: count }, (_, i) => new Date(startTime + i * step));
  };
  
  return scale;
}

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

function createTimeSeriesGrid(width: number, height: number, xScale: any, yScale: any, theme: 'light' | 'dark'): string {
  const lines: string[] = [];
  const strokeColor = theme === 'dark' ? '#333333' : '#e0e0e0';
  
  // Horizontal lines
  yScale.ticks(6).forEach((tick: number) => {
    const y = yScale(tick);
    lines.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${strokeColor}" stroke-dasharray="2,2" opacity="0.5"/>`);
  });
  
  // Vertical lines
  xScale.ticks(6).forEach((date: Date) => {
    const x = xScale(date);
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${strokeColor}" stroke-dasharray="2,2" opacity="0.5"/>`);
  });
  
  return lines.join('\n');
}

function createTimeSeriesLine(
  points: Array<{ date: Date; value: number }>,
  xScale: any,
  yScale: any,
  color: string,
  label: string,
  strokeWidth: number = 3
): string {
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.date)},${yScale(p.value)}`)
    .join(' ');
    
  return `<path d="${path}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" class="line-${label.replace(/\s+/g, '-')}"/>`;
}

function createConfidenceBand(
  confidence: Array<{ date: Date; lower: number; upper: number }>,
  xScale: any,
  yScale: any,
  color: string,
  opacity: number
): string {
  const upperPath = confidence
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${xScale(c.date)},${yScale(c.upper)}`)
    .join(' ');
    
  const lowerPath = confidence
    .slice()
    .reverse()
    .map((c, i) => `${i === 0 ? 'L' : 'L'} ${xScale(c.date)},${yScale(c.lower)}`)
    .join(' ');
    
  return `<path d="${upperPath} ${lowerPath} Z" fill="${color}" opacity="${opacity}"/>`;
}

function createAreaFill(
  points: Array<{ date: Date; value: number }>,
  xScale: any,
  yScale: any,
  color: string,
  opacity: number
): string {
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.date)},${yScale(p.value)}`)
    .join(' ');
    
  const bottomPath = `L ${xScale(points[points.length - 1].date)},${yScale(0)} L ${xScale(points[0].date)},${yScale(0)} Z`;
    
  return `<path d="${path} ${bottomPath}" fill="${color}" opacity="${opacity}"/>`;
}

function createRegressionLine(
  regression: { slope: number; intercept: number; r2: number },
  xScale: any,
  yScale: any,
  dateExtent: [Date, Date],
  color: string,
  style: 'solid' | 'dashed'
): string {
  const x1 = xScale(dateExtent[0]);
  const x2 = xScale(dateExtent[1]);
  const y1 = yScale(regression.intercept);
  const y2 = yScale(regression.intercept + regression.slope * ((dateExtent[1].getTime() - dateExtent[0].getTime()) / (1000 * 60 * 60 * 24)));
  
  const dashArray = style === 'dashed' ? 'stroke-dasharray="5,5"' : '';
  
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2" opacity="0.6" ${dashArray}/>`;
}

function createAnnotations(
  annotations: Annotation[],
  xScale: any,
  height: number,
  theme: 'light' | 'dark'
): string {
  const lines: string[] = [];
  
  annotations.forEach(annotation => {
    const x = xScale(annotation.date);
    const color = annotation.type === 'regression' ? '#ff0000' : '#00ff00';
    
    // Vertical line
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${color}" stroke-width="1" opacity="0.3"/>`);
    
    // Marker
    lines.push(`<circle cx="${x}" cy="10" r="5" fill="${color}"/>`);
    
    // Tooltip
    lines.push(`<title>${annotation.date.toLocaleDateString()}: ${annotation.message}</title>`);
  });
  
  return lines.join('\n');
}

function createReferenceLines(
  width: number,
  yScale: any,
  references: Array<{ value: number; label: string; color: string }>,
  theme: 'light' | 'dark'
): string {
  const lines: string[] = [];
  
  references.forEach(ref => {
    const y = yScale(ref.value);
    
    lines.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${ref.color}" stroke-width="1" opacity="0.3"/>`);
    lines.push(`<text x="${width - 5}" y="${y - 5}" text-anchor="end" font-size="10" fill="${ref.color}">${ref.label}</text>`);
  });
  
  return lines.join('\n');
}

function createDataPoint(x: number, y: number, color: string, radius: number): string {
  return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}"/>`;
}

function createTimeAxis(width: number, height: number, scale: any, theme: 'light' | 'dark'): string {
  const textColor = theme === 'dark' ? '#ffffff' : '#000000';
  const lines: string[] = [];
  
  // Axis line
  lines.push(`<line x1="0" y1="${height}" x2="${width}" y2="${height}" stroke="${textColor}"/>`);
  
  // Ticks and labels
  scale.ticks(6).forEach((date: Date) => {
    const x = scale(date);
    lines.push(`<line x1="${x}" y1="${height}" x2="${x}" y2="${height + 5}" stroke="${textColor}"/>`);
    lines.push(`<text x="${x}" y="${height + 20}" text-anchor="middle" font-size="11" fill="${textColor}">${formatDate(date)}</text>`);
  });
  
  return lines.join('\n');
}

function createValueAxis(height: number, scale: any, label: string, theme: 'light' | 'dark'): string {
  const textColor = theme === 'dark' ? '#ffffff' : '#000000';
  const lines: string[] = [];
  
  // Axis line
  lines.push(`<line x1="0" y1="0" x2="0" y2="${height}" stroke="${textColor}"/>`);
  
  // Ticks and labels
  scale.ticks(6).forEach((tick: number) => {
    const y = scale(tick);
    lines.push(`<line x1="-5" y1="${y}" x2="0" y2="${y}" stroke="${textColor}"/>`);
    lines.push(`<text x="-10" y="${y + 5}" text-anchor="end" font-size="11" fill="${textColor}">${tick.toFixed(0)}</text>`);
  });
  
  // Axis label (rotated)
  lines.push(`<text x="-50" y="${height / 2}" text-anchor="middle" font-size="14" fill="${textColor}" transform="rotate(-90, -50, ${height / 2})">${label}</text>`);
  
  return lines.join('\n');
}

function createTimeSeriesLegend(
  items: Array<{ label: string; color: string; trend?: TrendAnalysis; currentScore?: number }>,
  x: number,
  y: number,
  theme: 'light' | 'dark'
): string {
  const textColor = theme === 'dark' ? '#ffffff' : '#000000';
  const lines: string[] = [];
  
  lines.push(`<g transform="translate(${x}, ${y})">`);
  
  items.forEach((item, idx) => {
    const yOffset = idx * 25;
    
    // Color swatch
    lines.push(`<rect x="0" y="${yOffset}" width="20" height="3" fill="${item.color}"/>`);
    
    // Label
    lines.push(`<text x="25" y="${yOffset + 3}" font-size="12" fill="${textColor}">${item.label}</text>`);
    
    // Trend indicator
    if (item.trend) {
      const trendSymbol = item.trend.trend === 'improving' ? '↓' : item.trend.trend === 'degrading' ? '↑' : '→';
      const trendColor = item.trend.trend === 'improving' ? '#00ff00' : item.trend.trend === 'degrading' ? '#ff0000' : '#999999';
      lines.push(`<text x="100" y="${yOffset + 3}" font-size="12" fill="${trendColor}">${trendSymbol} ${item.trend.changePercent.toFixed(1)}%</text>`);
    }
    
    // Current score
    if (item.currentScore !== undefined) {
      lines.push(`<text x="100" y="${yOffset + 3}" font-size="11" fill="${textColor}">${item.currentScore.toFixed(0)}</text>`);
    }
  });
  
  lines.push('</g>');
  
  return lines.join('\n');
}

// Utility functions

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

function formatDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getManagerColors(): Record<string, string> {
  return {
    'oh-my-zsh': '#e41a1c',
    'prezto': '#377eb8',
    'zim': '#4daf4a',
    'zinit': '#984ea3',
    'zplug': '#ff7f00',
    'antigen': '#ffff33',
    'antibody': '#a65628',
    'antidote': '#f781bf',
    'sheldon': '#999999',
    'zgenom': '#66c2a5',
    'zpm': '#fc8d62',
    'znap': '#8da0cb',
    'zcomet': '#e78ac3',
    'vanilla': '#a6d854',
  };
}

function getMetricColors(): Record<string, string> {
  return {
    loadTime: '#1f77b4',
    installTime: '#ff7f0e',
    firstPromptLag: '#2ca02c',
    firstCommandLag: '#d62728',
    commandLag: '#9467bd',
    inputLag: '#8c564b',
  };
}

/**
 * Export time series as interactive dashboard
 */
export function exportTimeSeriesDashboard(
  charts: TimeSeriesData[],
  outputPath: string
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Performance Trends Dashboard</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .dashboard {
      max-width: 1400px;
      margin: 0 auto;
    }
    .header {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    h1 {
      margin: 0;
      color: #333;
    }
    .chart-container {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .chart-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
      color: #555;
    }
    .trends {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    .trend-card {
      background: #f8f8f8;
      padding: 15px;
      border-radius: 4px;
      border-left: 4px solid #ddd;
    }
    .trend-card.improving { border-left-color: #4caf50; }
    .trend-card.stable { border-left-color: #999; }
    .trend-card.degrading { border-left-color: #f44336; }
    .trend-manager {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .trend-metric {
      font-size: 14px;
      color: #666;
    }
    .trend-change {
      font-size: 16px;
      margin-top: 5px;
    }
    .annotations {
      margin-top: 20px;
      padding: 15px;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 4px;
    }
    .annotation {
      margin: 5px 0;
      font-size: 14px;
    }
    .annotation.regression { color: #d32f2f; }
    .annotation.improvement { color: #388e3c; }
  </style>
</head>
<body>
  <div class="dashboard">
    <div class="header">
      <h1>Performance Trends Dashboard</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    
    ${charts.map(chart => `
    <div class="chart-container">
      <div class="chart-title">${chart.title}</div>
      ${chart.svg}
      
      ${chart.trends.length > 0 ? `
      <div class="trends">
        ${chart.trends.map(trend => `
        <div class="trend-card ${trend.trend}">
          <div class="trend-manager">${trend.manager}</div>
          <div class="trend-metric">${formatMetricName(trend.metric)}</div>
          <div class="trend-change">
            ${trend.trend === 'improving' ? '↓' : trend.trend === 'degrading' ? '↑' : '→'}
            ${trend.changePercent.toFixed(1)}%
            ${trend.trend === 'improving' ? 'improvement' : trend.trend === 'degrading' ? 'regression' : 'stable'}
          </div>
        </div>
        `).join('')}
      </div>
      ` : ''}
      
      ${chart.annotations.length > 0 ? `
      <div class="annotations">
        <strong>Notable Events:</strong>
        ${chart.annotations.map(ann => `
        <div class="annotation ${ann.type}">
          ${ann.date.toLocaleDateString()}: ${ann.message}
        </div>
        `).join('')}
      </div>
      ` : ''}
    </div>
    `).join('')}
  </div>
</body>
</html>
  `;
  
  return Deno.writeTextFile(outputPath, html);
}

// Import for pattern score  
import { calculatePatternScore } from "../../engines/patterns.ts";