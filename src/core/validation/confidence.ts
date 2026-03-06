/**
 * Confidence interval calculations and bootstrap methods
 * Provides robust confidence estimates for benchmark measurements
 */

export interface BootstrapResult {
  mean: number;
  median: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    level: number;
  };
  standardError: number;
  bias: number;
}

export interface PercentileInterval {
  p5: number;
  p10: number;
  p25: number;
  p50: number; // median
  p75: number;
  p90: number;
  p95: number;
}

/**
 * Calculate percentile using linear interpolation
 */
export function percentile(data: number[], p: number): number {
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  const index = (n - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (lower === upper) {
    return sorted[lower];
  }
  
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calculate multiple percentiles at once
 */
export function calculatePercentiles(data: number[]): PercentileInterval {
  return {
    p5: percentile(data, 0.05),
    p10: percentile(data, 0.10),
    p25: percentile(data, 0.25),
    p50: percentile(data, 0.50),
    p75: percentile(data, 0.75),
    p90: percentile(data, 0.90),
    p95: percentile(data, 0.95),
  };
}

/**
 * Bootstrap resampling for robust confidence intervals
 */
export function bootstrap(
  data: number[],
  iterations = 10000,
  confidenceLevel = 0.95,
  statistic: (sample: number[]) => number = mean
): BootstrapResult {
  const n = data.length;
  const bootstrapStats: number[] = [];
  const originalStat = statistic(data);
  
  // Generate bootstrap samples
  for (let i = 0; i < iterations; i++) {
    const sample: number[] = [];
    for (let j = 0; j < n; j++) {
      sample.push(data[Math.floor(Math.random() * n)]);
    }
    bootstrapStats.push(statistic(sample));
  }
  
  // Sort bootstrap statistics
  bootstrapStats.sort((a, b) => a - b);
  
  // Calculate confidence interval using percentile method
  const alpha = 1 - confidenceLevel;
  const lowerIndex = Math.floor(iterations * (alpha / 2));
  const upperIndex = Math.floor(iterations * (1 - alpha / 2));
  
  const bootstrapMean = mean(bootstrapStats);
  const bootstrapMedian = percentile(bootstrapStats, 0.5);
  
  // Calculate bias
  const bias = bootstrapMean - originalStat;
  
  // Calculate standard error
  const standardError = Math.sqrt(
    bootstrapStats.reduce((sum, x) => sum + Math.pow(x - bootstrapMean, 2), 0) / (iterations - 1)
  );
  
  return {
    mean: bootstrapMean,
    median: bootstrapMedian,
    confidenceInterval: {
      lower: bootstrapStats[lowerIndex],
      upper: bootstrapStats[upperIndex],
      level: confidenceLevel,
    },
    standardError,
    bias,
  };
}

/**
 * BCa (Bias-Corrected and Accelerated) bootstrap
 * More accurate for skewed distributions
 */
export function bcaBootstrap(
  data: number[],
  iterations = 10000,
  confidenceLevel = 0.95,
  statistic: (sample: number[]) => number = mean
): BootstrapResult {
  const n = data.length;
  const bootstrapStats: number[] = [];
  const originalStat = statistic(data);
  
  // Generate bootstrap samples
  for (let i = 0; i < iterations; i++) {
    const sample: number[] = [];
    for (let j = 0; j < n; j++) {
      sample.push(data[Math.floor(Math.random() * n)]);
    }
    bootstrapStats.push(statistic(sample));
  }
  
  bootstrapStats.sort((a, b) => a - b);
  
  // Calculate bias correction factor (z0)
  const numLess = bootstrapStats.filter(x => x < originalStat).length;
  const z0 = normalQuantile(numLess / iterations);
  
  // Calculate acceleration factor (a) using jackknife
  const jackknifeSamples: number[] = [];
  for (let i = 0; i < n; i++) {
    const jackknifeSample = data.filter((_, index) => index !== i);
    jackknifeSamples.push(statistic(jackknifeSample));
  }
  
  const jackknifeMean = mean(jackknifeSamples);
  const sumCubed = jackknifeSamples.reduce(
    (sum, x) => sum + Math.pow(x - jackknifeMean, 3), 0
  );
  const sumSquared = jackknifeSamples.reduce(
    (sum, x) => sum + Math.pow(x - jackknifeMean, 2), 0
  );
  const a = sumCubed / (6 * Math.pow(sumSquared, 1.5));
  
  // Calculate adjusted percentiles
  const alpha = 1 - confidenceLevel;
  const z_alpha = normalQuantile(alpha / 2);
  
  const a1 = normalCDF(z0 + (z0 + z_alpha) / (1 - a * (z0 + z_alpha)));
  const a2 = normalCDF(z0 + (z0 - z_alpha) / (1 - a * (z0 - z_alpha)));
  
  const lowerIndex = Math.floor(iterations * a1);
  const upperIndex = Math.floor(iterations * a2);
  
  const bootstrapMean = mean(bootstrapStats);
  const bootstrapMedian = percentile(bootstrapStats, 0.5);
  const bias = bootstrapMean - originalStat;
  const standardError = Math.sqrt(
    bootstrapStats.reduce((sum, x) => sum + Math.pow(x - bootstrapMean, 2), 0) / (iterations - 1)
  );
  
  return {
    mean: bootstrapMean,
    median: bootstrapMedian,
    confidenceInterval: {
      lower: bootstrapStats[Math.max(0, Math.min(lowerIndex, iterations - 1))],
      upper: bootstrapStats[Math.max(0, Math.min(upperIndex, iterations - 1))],
      level: confidenceLevel,
    },
    standardError,
    bias,
  };
}

/**
 * Moving block bootstrap for time series data
 * Preserves temporal dependencies
 */
export function movingBlockBootstrap(
  data: number[],
  blockSize: number,
  iterations = 10000,
  confidenceLevel = 0.95,
  statistic: (sample: number[]) => number = mean
): BootstrapResult {
  const n = data.length;
  const numBlocks = Math.ceil(n / blockSize);
  const bootstrapStats: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const sample: number[] = [];
    
    // Sample blocks
    for (let j = 0; j < numBlocks; j++) {
      const startIndex = Math.floor(Math.random() * (n - blockSize + 1));
      for (let k = 0; k < blockSize && sample.length < n; k++) {
        sample.push(data[startIndex + k]);
      }
    }
    
    // Trim to exact size
    sample.length = n;
    bootstrapStats.push(statistic(sample));
  }
  
  return bootstrap(data, iterations, confidenceLevel, statistic);
}

/**
 * Calculate confidence interval for the difference between two groups
 */
export function differenceConfidenceInterval(
  dataA: number[],
  dataB: number[],
  confidenceLevel = 0.95,
  method: 'parametric' | 'bootstrap' = 'bootstrap'
): {
  difference: number;
  confidenceInterval: { lower: number; upper: number; level: number };
  significant: boolean;
} {
  const meanA = mean(dataA);
  const meanB = mean(dataB);
  const difference = meanA - meanB;
  
  if (method === 'parametric') {
    // Welch's t-interval for unequal variances
    const nA = dataA.length;
    const nB = dataB.length;
    const varA = variance(dataA);
    const varB = variance(dataB);
    
    const se = Math.sqrt(varA / nA + varB / nB);
    const df = Math.pow(se, 4) / (
      Math.pow(varA / nA, 2) / (nA - 1) +
      Math.pow(varB / nB, 2) / (nB - 1)
    );
    
    const tValue = tQuantile(1 - (1 - confidenceLevel) / 2, df);
    const margin = tValue * se;
    
    return {
      difference,
      confidenceInterval: {
        lower: difference - margin,
        upper: difference + margin,
        level: confidenceLevel,
      },
      significant: Math.abs(difference) > margin,
    };
  } else {
    // Bootstrap method
    const bootstrapDiffs: number[] = [];
    const iterations = 10000;
    
    for (let i = 0; i < iterations; i++) {
      const sampleA = resample(dataA);
      const sampleB = resample(dataB);
      bootstrapDiffs.push(mean(sampleA) - mean(sampleB));
    }
    
    bootstrapDiffs.sort((a, b) => a - b);
    
    const alpha = 1 - confidenceLevel;
    const lowerIndex = Math.floor(iterations * (alpha / 2));
    const upperIndex = Math.floor(iterations * (1 - alpha / 2));
    
    const ci = {
      lower: bootstrapDiffs[lowerIndex],
      upper: bootstrapDiffs[upperIndex],
      level: confidenceLevel,
    };
    
    return {
      difference,
      confidenceInterval: ci,
      significant: ci.lower > 0 || ci.upper < 0,
    };
  }
}

/**
 * Calculate prediction interval for future observations
 */
export function predictionInterval(
  data: number[],
  confidenceLevel = 0.95
): {
  mean: number;
  predictionInterval: { lower: number; upper: number; level: number };
} {
  const n = data.length;
  const m = mean(data);
  const s = Math.sqrt(variance(data));
  
  // T-distribution for prediction interval
  const df = n - 1;
  const tValue = tQuantile(1 - (1 - confidenceLevel) / 2, df);
  
  // Prediction interval includes both sampling and observation variance
  const margin = tValue * s * Math.sqrt(1 + 1 / n);
  
  return {
    mean: m,
    predictionInterval: {
      lower: m - margin,
      upper: m + margin,
      level: confidenceLevel,
    },
  };
}

// Helper functions

function mean(data: number[]): number {
  return data.reduce((sum, x) => sum + x, 0) / data.length;
}

function variance(data: number[]): number {
  const m = mean(data);
  return data.reduce((sum, x) => sum + Math.pow(x - m, 2), 0) / (data.length - 1);
}

function resample(data: number[]): number[] {
  const n = data.length;
  const sample: number[] = [];
  for (let i = 0; i < n; i++) {
    sample.push(data[Math.floor(Math.random() * n)]);
  }
  return sample;
}

function normalQuantile(p: number): number {
  // Approximation using inverse error function
  const a = 0.147;
  const two_p_minus_one = 2 * p - 1;
  const inv_erf = Math.sign(two_p_minus_one) * Math.sqrt(
    Math.sqrt(Math.pow(2 / (Math.PI * a) + Math.log(1 - Math.pow(two_p_minus_one, 2)) / 2, 2) -
      Math.log(1 - Math.pow(two_p_minus_one, 2)) / a) -
      (2 / (Math.PI * a) + Math.log(1 - Math.pow(two_p_minus_one, 2)) / 2)
  );
  return Math.sqrt(2) * inv_erf;
}

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

function tQuantile(p: number, df: number): number {
  // Simplified t-quantile approximation
  if (df >= 30) return normalQuantile(p);
  
  // Use table for common values
  const tTable: Record<number, Record<string, number>> = {
    0.975: { 5: 2.571, 10: 2.228, 20: 2.086 },
    0.995: { 5: 4.032, 10: 3.169, 20: 2.845 },
  };
  
  const pKey = p.toFixed(3);
  if (tTable[pKey] && tTable[pKey][df]) {
    return tTable[pKey][df];
  }
  
  // Fallback to normal approximation
  return normalQuantile(p) * Math.sqrt((df + 1) / df);
}