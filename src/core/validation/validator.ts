/**
 * Statistical validation engine for benchmark results
 * Provides outlier detection, confidence intervals, and significance testing
 */

import { BenchmarkResult } from "../types.ts";

export interface OutlierResult {
  outliers: number[];
  cleaned: number[];
  method: 'iqr' | 'zscore' | 'modified-zscore';
  threshold: number;
}

export interface ConfidenceInterval {
  mean: number;
  lower: number;
  upper: number;
  confidence: number;
  standardError: number;
}

export interface SignificanceTest {
  pValue: number;
  significant: boolean;
  effectSize: number;
  interpretation: 'no-difference' | 'small' | 'medium' | 'large';
}

export interface EnvironmentFactors {
  cpuLoad?: number;
  memoryPressure?: number;
  networkLatency?: number;
  dockerOverhead?: number;
}

export type OutlierMethod = 'iqr' | 'zscore' | 'modified-zscore';

/**
 * Calculate basic statistics
 */
export function calculateStats(data: number[]) {
  const n = data.length;
  if (n === 0) return { mean: 0, stddev: 0, median: 0, min: 0, max: 0 };

  const sorted = [...data].sort((a, b) => a - b);
  const mean = data.reduce((sum, x) => sum + x, 0) / n;
  
  const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (n - 1);
  const stddev = Math.sqrt(variance);
  
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];

  return {
    mean,
    stddev,
    median,
    min: sorted[0],
    max: sorted[n - 1],
    q1: sorted[Math.floor(n * 0.25)],
    q3: sorted[Math.floor(n * 0.75)],
  };
}

/**
 * Detect outliers using Interquartile Range (IQR) method
 */
export function detectOutliersIQR(data: number[], factor = 1.5): OutlierResult {
  const stats = calculateStats(data);
  const iqr = stats.q3 - stats.q1;
  const lowerBound = stats.q1 - factor * iqr;
  const upperBound = stats.q3 + factor * iqr;

  const outliers: number[] = [];
  const cleaned: number[] = [];

  data.forEach(value => {
    if (value < lowerBound || value > upperBound) {
      outliers.push(value);
    } else {
      cleaned.push(value);
    }
  });

  return {
    outliers,
    cleaned,
    method: 'iqr',
    threshold: factor,
  };
}

/**
 * Detect outliers using Z-score method
 */
export function detectOutliersZScore(data: number[], threshold = 3): OutlierResult {
  const stats = calculateStats(data);
  const outliers: number[] = [];
  const cleaned: number[] = [];

  data.forEach(value => {
    const zScore = Math.abs((value - stats.mean) / stats.stddev);
    if (zScore > threshold) {
      outliers.push(value);
    } else {
      cleaned.push(value);
    }
  });

  return {
    outliers,
    cleaned,
    method: 'zscore',
    threshold,
  };
}

/**
 * Detect outliers using Modified Z-score (MAD) method
 * More robust for datasets with extreme outliers
 */
export function detectOutliersModifiedZScore(data: number[], threshold = 3.5): OutlierResult {
  const stats = calculateStats(data);
  const mad = calculateMAD(data, stats.median);
  
  const outliers: number[] = [];
  const cleaned: number[] = [];

  data.forEach(value => {
    const modifiedZScore = 0.6745 * Math.abs(value - stats.median) / mad;
    if (modifiedZScore > threshold) {
      outliers.push(value);
    } else {
      cleaned.push(value);
    }
  });

  return {
    outliers,
    cleaned,
    method: 'modified-zscore',
    threshold,
  };
}

/**
 * Calculate Median Absolute Deviation (MAD)
 */
function calculateMAD(data: number[], median: number): number {
  const deviations = data.map(x => Math.abs(x - median));
  const sortedDeviations = deviations.sort((a, b) => a - b);
  const n = sortedDeviations.length;
  
  return n % 2 === 0
    ? (sortedDeviations[n / 2 - 1] + sortedDeviations[n / 2]) / 2
    : sortedDeviations[Math.floor(n / 2)];
}

/**
 * Main outlier detection function
 */
export function detectOutliers(data: number[], method: OutlierMethod = 'iqr'): OutlierResult {
  switch (method) {
    case 'iqr':
      return detectOutliersIQR(data);
    case 'zscore':
      return detectOutliersZScore(data);
    case 'modified-zscore':
      return detectOutliersModifiedZScore(data);
    default:
      throw new Error(`Unknown outlier detection method: ${method}`);
  }
}

/**
 * Calculate confidence interval using t-distribution
 */
export function calculateConfidenceInterval(
  data: number[],
  confidence = 0.95
): ConfidenceInterval {
  const stats = calculateStats(data);
  const n = data.length;
  const standardError = stats.stddev / Math.sqrt(n);
  
  // T-distribution critical values for common confidence levels
  const tValues: Record<number, Record<number, number>> = {
    0.90: { 5: 2.015, 10: 1.812, 20: 1.725, 30: 1.697, Infinity: 1.645 },
    0.95: { 5: 2.571, 10: 2.228, 20: 2.086, 30: 2.042, Infinity: 1.96 },
    0.99: { 5: 4.032, 10: 3.169, 20: 2.845, 30: 2.750, Infinity: 2.576 },
  };

  // Find appropriate t-value
  const df = n - 1;
  const confidenceRow = tValues[confidence] || tValues[0.95];
  let tValue = confidenceRow.Infinity;
  
  for (const [dfKey, value] of Object.entries(confidenceRow)) {
    if (dfKey !== 'Infinity' && df <= parseInt(dfKey)) {
      tValue = value;
      break;
    }
  }

  const marginOfError = tValue * standardError;

  return {
    mean: stats.mean,
    lower: stats.mean - marginOfError,
    upper: stats.mean + marginOfError,
    confidence,
    standardError,
  };
}

/**
 * Perform Welch's t-test for unequal variances
 */
export function testSignificance(
  dataA: number[],
  dataB: number[]
): SignificanceTest {
  const statsA = calculateStats(dataA);
  const statsB = calculateStats(dataB);
  
  const nA = dataA.length;
  const nB = dataB.length;
  
  // Welch's t-test
  const seDiff = Math.sqrt(
    (statsA.stddev ** 2 / nA) + (statsB.stddev ** 2 / nB)
  );
  
  const tStatistic = Math.abs(statsA.mean - statsB.mean) / seDiff;
  
  // Degrees of freedom for Welch's t-test
  const df = Math.pow(seDiff, 4) / (
    Math.pow(statsA.stddev ** 2 / nA, 2) / (nA - 1) +
    Math.pow(statsB.stddev ** 2 / nB, 2) / (nB - 1)
  );
  
  // Approximate p-value using normal distribution
  // For more accuracy, use a proper t-distribution
  const pValue = 2 * (1 - normalCDF(tStatistic));
  
  // Cohen's d effect size
  const pooledStdDev = Math.sqrt(
    ((nA - 1) * statsA.stddev ** 2 + (nB - 1) * statsB.stddev ** 2) /
    (nA + nB - 2)
  );
  const effectSize = Math.abs(statsA.mean - statsB.mean) / pooledStdDev;
  
  // Interpret effect size
  let interpretation: SignificanceTest['interpretation'];
  if (effectSize < 0.2) interpretation = 'no-difference';
  else if (effectSize < 0.5) interpretation = 'small';
  else if (effectSize < 0.8) interpretation = 'medium';
  else interpretation = 'large';

  return {
    pValue,
    significant: pValue < 0.05,
    effectSize,
    interpretation,
  };
}

/**
 * Normal cumulative distribution function approximation
 */
function normalCDF(z: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Normalize benchmark results based on environmental factors
 */
export function normalizeEnvironmentalFactors(
  results: BenchmarkResult[],
  factors: EnvironmentFactors
): BenchmarkResult[] {
  return results.map(result => {
    const normalized = { ...result };
    
    // Adjust for CPU load (higher load = slower performance)
    if (factors.cpuLoad && result.loadTime) {
      const cpuFactor = 1 + (factors.cpuLoad - 0.5) * 0.2; // ±10% for 0-100% load
      normalized.loadTime = result.loadTime / cpuFactor;
    }
    
    // Adjust for memory pressure
    if (factors.memoryPressure && result.loadTime) {
      const memFactor = 1 + (factors.memoryPressure - 0.5) * 0.1; // ±5% for memory
      normalized.loadTime = result.loadTime / memFactor;
    }
    
    // Adjust for Docker overhead (if applicable)
    if (factors.dockerOverhead) {
      if (normalized.loadTime) {
        normalized.loadTime -= factors.dockerOverhead;
      }
      if (normalized.installTime) {
        normalized.installTime -= factors.dockerOverhead;
      }
    }
    
    return normalized;
  });
}

/**
 * Validate a set of measurements and provide quality metrics
 */
export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  issues: string[];
  recommendations: string[];
}

export function validateMeasurements(
  data: number[],
  expectedRange?: { min: number; max: number }
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    confidence: 1.0,
    issues: [],
    recommendations: [],
  };

  // Check sample size
  if (data.length < 3) {
    result.isValid = false;
    result.issues.push("Insufficient sample size (< 3)");
    result.recommendations.push("Increase number of measurements to at least 10");
    result.confidence *= 0.5;
  } else if (data.length < 10) {
    result.issues.push("Small sample size (< 10)");
    result.recommendations.push("Consider increasing measurements for better accuracy");
    result.confidence *= 0.8;
  }

  // Check for high variance
  const stats = calculateStats(data);
  const cv = stats.stddev / stats.mean; // Coefficient of variation
  
  if (cv > 0.5) {
    result.issues.push("Very high variance (CV > 50%)");
    result.recommendations.push("Check for environmental interference");
    result.confidence *= 0.6;
  } else if (cv > 0.2) {
    result.issues.push("High variance (CV > 20%)");
    result.recommendations.push("Consider increasing warmup runs");
    result.confidence *= 0.9;
  }

  // Check for outliers
  const outlierResult = detectOutliers(data, 'modified-zscore');
  const outlierRatio = outlierResult.outliers.length / data.length;
  
  if (outlierRatio > 0.2) {
    result.isValid = false;
    result.issues.push("Too many outliers (> 20%)");
    result.recommendations.push("Investigate measurement stability");
    result.confidence *= 0.5;
  } else if (outlierRatio > 0.1) {
    result.issues.push("Significant outliers detected");
    result.recommendations.push("Consider using outlier-resistant statistics");
    result.confidence *= 0.8;
  }

  // Check expected range
  if (expectedRange) {
    const outOfRange = data.filter(x => x < expectedRange.min || x > expectedRange.max);
    if (outOfRange.length > 0) {
      result.issues.push(`${outOfRange.length} measurements outside expected range`);
      result.recommendations.push("Verify measurement methodology");
      result.confidence *= 0.7;
    }
  }

  return result;
}