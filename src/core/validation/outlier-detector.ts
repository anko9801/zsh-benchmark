/**
 * Advanced outlier detection algorithms
 * Implements multiple methods for robust outlier identification
 */

export interface OutlierInfo {
  value: number;
  index: number;
  score: number; // How "outlier-ish" the value is
  reason: string;
}

export interface RobustStats {
  median: number;
  mad: number; // Median Absolute Deviation
  trimmedMean: number;
  winsorizedMean: number;
}

/**
 * Calculate robust statistics that are less affected by outliers
 */
export function calculateRobustStats(data: number[], trimPercent = 0.1): RobustStats {
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  
  // Median
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];
  
  // MAD (Median Absolute Deviation)
  const deviations = data.map(x => Math.abs(x - median));
  const sortedDeviations = deviations.sort((a, b) => a - b);
  const mad = n % 2 === 0
    ? (sortedDeviations[n / 2 - 1] + sortedDeviations[n / 2]) / 2
    : sortedDeviations[Math.floor(n / 2)];
  
  // Trimmed mean (remove top and bottom x%)
  const trimCount = Math.floor(n * trimPercent);
  const trimmedData = sorted.slice(trimCount, n - trimCount);
  const trimmedMean = trimmedData.reduce((sum, x) => sum + x, 0) / trimmedData.length;
  
  // Winsorized mean (replace outliers with boundary values)
  const winsorizedData = sorted.map((x, i) => {
    if (i < trimCount) return sorted[trimCount];
    if (i >= n - trimCount) return sorted[n - trimCount - 1];
    return x;
  });
  const winsorizedMean = winsorizedData.reduce((sum, x) => sum + x, 0) / n;
  
  return { median, mad, trimmedMean, winsorizedMean };
}

/**
 * Grubbs' test for outliers
 * Tests the hypothesis that there are no outliers
 */
export function grubbsTest(data: number[], alpha = 0.05): OutlierInfo[] {
  const n = data.length;
  if (n < 3) return [];
  
  const mean = data.reduce((sum, x) => sum + x, 0) / n;
  const stddev = Math.sqrt(
    data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (n - 1)
  );
  
  // Critical value approximation for Grubbs' test
  const tCrit = getTCritical(n - 2, alpha / (2 * n));
  const gCrit = ((n - 1) / Math.sqrt(n)) * Math.sqrt(tCrit ** 2 / (n - 2 + tCrit ** 2));
  
  const outliers: OutlierInfo[] = [];
  
  data.forEach((value, index) => {
    const g = Math.abs(value - mean) / stddev;
    if (g > gCrit) {
      outliers.push({
        value,
        index,
        score: g / gCrit,
        reason: `Grubbs' test (G=${g.toFixed(2)} > ${gCrit.toFixed(2)})`,
      });
    }
  });
  
  return outliers;
}

/**
 * Dixon's Q test for small samples (n < 30)
 */
export function dixonQTest(data: number[], alpha = 0.05): OutlierInfo[] {
  const n = data.length;
  if (n < 3 || n > 30) return [];
  
  const sorted = [...data].sort((a, b) => a - b);
  const outliers: OutlierInfo[] = [];
  
  // Critical values for Dixon's Q test (simplified)
  const qCritical: Record<number, number> = {
    3: 0.970, 4: 0.829, 5: 0.710, 6: 0.628, 7: 0.569,
    8: 0.608, 9: 0.564, 10: 0.530, 15: 0.472, 20: 0.450,
    25: 0.406, 30: 0.376,
  };
  
  const qCrit = qCritical[n] || 0.3;
  
  // Test for lower outlier
  const q1 = (sorted[1] - sorted[0]) / (sorted[n - 1] - sorted[0]);
  if (q1 > qCrit) {
    const originalIndex = data.indexOf(sorted[0]);
    outliers.push({
      value: sorted[0],
      index: originalIndex,
      score: q1 / qCrit,
      reason: `Dixon's Q test (lower, Q=${q1.toFixed(3)} > ${qCrit})`,
    });
  }
  
  // Test for upper outlier
  const qn = (sorted[n - 1] - sorted[n - 2]) / (sorted[n - 1] - sorted[0]);
  if (qn > qCrit) {
    const originalIndex = data.indexOf(sorted[n - 1]);
    outliers.push({
      value: sorted[n - 1],
      index: originalIndex,
      score: qn / qCrit,
      reason: `Dixon's Q test (upper, Q=${qn.toFixed(3)} > ${qCrit})`,
    });
  }
  
  return outliers;
}

/**
 * Isolation Forest inspired outlier detection
 * Simplified version for 1D data
 */
export function isolationScore(data: number[]): OutlierInfo[] {
  const n = data.length;
  const scores: number[] = new Array(n).fill(0);
  const iterations = 100;
  
  // Build multiple isolation trees
  for (let i = 0; i < iterations; i++) {
    const tree = buildIsolationTree([...data]);
    data.forEach((value, index) => {
      scores[index] += getIsolationDepth(tree, value);
    });
  }
  
  // Normalize scores
  const avgScores = scores.map(s => s / iterations);
  const expectedDepth = 2 * (Math.log(n - 1) + 0.5772) - 2 * (n - 1) / n;
  
  const outliers: OutlierInfo[] = [];
  avgScores.forEach((score, index) => {
    const anomalyScore = Math.pow(2, -score / expectedDepth);
    if (anomalyScore > 0.6) { // Threshold for anomaly
      outliers.push({
        value: data[index],
        index,
        score: anomalyScore,
        reason: `Isolation Forest (score=${anomalyScore.toFixed(3)})`,
      });
    }
  });
  
  return outliers;
}

interface IsolationNode {
  splitValue?: number;
  left?: IsolationNode;
  right?: IsolationNode;
  size?: number;
}

function buildIsolationTree(data: number[], maxDepth = 10): IsolationNode {
  if (data.length <= 1 || maxDepth <= 0) {
    return { size: data.length };
  }
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  
  if (min === max) {
    return { size: data.length };
  }
  
  const splitValue = min + Math.random() * (max - min);
  const leftData = data.filter(x => x < splitValue);
  const rightData = data.filter(x => x >= splitValue);
  
  return {
    splitValue,
    left: buildIsolationTree(leftData, maxDepth - 1),
    right: buildIsolationTree(rightData, maxDepth - 1),
  };
}

function getIsolationDepth(node: IsolationNode, value: number, depth = 0): number {
  if (!node.splitValue || (!node.left && !node.right)) {
    return depth + (node.size ? Math.log2(node.size) : 0);
  }
  
  if (value < node.splitValue) {
    return getIsolationDepth(node.left!, value, depth + 1);
  } else {
    return getIsolationDepth(node.right!, value, depth + 1);
  }
}

/**
 * Local Outlier Factor (LOF) - density-based outlier detection
 */
export function localOutlierFactor(data: number[], k = 5): OutlierInfo[] {
  const n = data.length;
  if (n <= k) return [];
  
  // Calculate k-nearest neighbors distances
  const distances: number[][] = [];
  for (let i = 0; i < n; i++) {
    const dists = data
      .map((x, j) => ({ dist: Math.abs(x - data[i]), index: j }))
      .filter(d => d.index !== i)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, k);
    distances[i] = dists.map(d => d.dist);
  }
  
  // Calculate reachability distances and LOF scores
  const lofScores: number[] = [];
  for (let i = 0; i < n; i++) {
    const neighbors = data
      .map((x, j) => ({ dist: Math.abs(x - data[i]), index: j }))
      .filter(d => d.index !== i)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, k)
      .map(d => d.index);
    
    // Local reachability density
    const lrd = k / neighbors.reduce((sum, j) => {
      return sum + Math.max(distances[j][k - 1], Math.abs(data[i] - data[j]));
    }, 0);
    
    // LOF score
    const lof = neighbors.reduce((sum, j) => {
      const neighborLrd = k / data
        .map((x, idx) => ({ dist: Math.abs(x - data[j]), index: idx }))
        .filter(d => d.index !== j)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, k)
        .reduce((s, d) => s + d.dist, 0);
      return sum + neighborLrd;
    }, 0) / (k * lrd);
    
    lofScores.push(lof);
  }
  
  // Identify outliers (LOF > 1.5 typically indicates outlier)
  const outliers: OutlierInfo[] = [];
  lofScores.forEach((score, index) => {
    if (score > 1.5) {
      outliers.push({
        value: data[index],
        index,
        score,
        reason: `Local Outlier Factor (LOF=${score.toFixed(2)})`,
      });
    }
  });
  
  return outliers;
}

/**
 * Combine multiple outlier detection methods
 */
export interface EnsembleOutlierResult {
  outliers: OutlierInfo[];
  consensusOutliers: OutlierInfo[]; // Detected by multiple methods
  byMethod: Record<string, OutlierInfo[]>;
}

export function ensembleOutlierDetection(
  data: number[],
  methods: Array<'grubbs' | 'dixon' | 'isolation' | 'lof'> = ['grubbs', 'isolation']
): EnsembleOutlierResult {
  const byMethod: Record<string, OutlierInfo[]> = {};
  const allOutliers: OutlierInfo[] = [];
  const outlierCounts = new Map<number, number>();
  
  // Apply each method
  if (methods.includes('grubbs') && data.length >= 3) {
    byMethod.grubbs = grubbsTest(data);
    byMethod.grubbs.forEach(o => {
      outlierCounts.set(o.index, (outlierCounts.get(o.index) || 0) + 1);
      allOutliers.push(o);
    });
  }
  
  if (methods.includes('dixon') && data.length >= 3 && data.length <= 30) {
    byMethod.dixon = dixonQTest(data);
    byMethod.dixon.forEach(o => {
      outlierCounts.set(o.index, (outlierCounts.get(o.index) || 0) + 1);
      allOutliers.push(o);
    });
  }
  
  if (methods.includes('isolation') && data.length >= 10) {
    byMethod.isolation = isolationScore(data);
    byMethod.isolation.forEach(o => {
      outlierCounts.set(o.index, (outlierCounts.get(o.index) || 0) + 1);
      allOutliers.push(o);
    });
  }
  
  if (methods.includes('lof') && data.length >= 10) {
    byMethod.lof = localOutlierFactor(data);
    byMethod.lof.forEach(o => {
      outlierCounts.set(o.index, (outlierCounts.get(o.index) || 0) + 1);
      allOutliers.push(o);
    });
  }
  
  // Find consensus outliers (detected by at least 2 methods)
  const consensusOutliers: OutlierInfo[] = [];
  outlierCounts.forEach((count, index) => {
    if (count >= 2) {
      const outlierInfo = allOutliers.find(o => o.index === index)!;
      consensusOutliers.push({
        ...outlierInfo,
        score: count / methods.length,
        reason: `Consensus (${count}/${methods.length} methods)`,
      });
    }
  });
  
  // Remove duplicates from allOutliers
  const uniqueOutliers = Array.from(
    new Map(allOutliers.map(o => [o.index, o])).values()
  );
  
  return {
    outliers: uniqueOutliers,
    consensusOutliers,
    byMethod,
  };
}

/**
 * Helper function to get t-critical value (simplified)
 */
function getTCritical(df: number, alpha: number): number {
  // Simplified t-table for common values
  if (alpha === 0.05) {
    if (df >= 30) return 1.96;
    if (df >= 20) return 2.086;
    if (df >= 10) return 2.228;
    if (df >= 5) return 2.571;
    return 3.182;
  }
  // Default to normal approximation
  return 1.96;
}