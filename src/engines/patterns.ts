/**
 * Usage pattern-based scoring
 * Evaluates plugin managers based on specific use cases
 */

import { BenchmarkResult } from "../core/types.ts";
import { calculateWeightedScore, ScoreWeights } from "./weighted.ts";
import { calculatePerceptualScore, PerceptualRating } from "./perceptual.ts";

export type UsagePattern = 
  | 'minimal'      // Few plugins, basic usage
  | 'developer'    // Active development, moderate plugins
  | 'power-user'   // Many plugins, heavy customization
  | 'server'       // Remote/SSH usage
  | 'container'    // Docker/containerized environments
  | 'ci-cd';       // Continuous integration

export interface PatternScore {
  pattern: UsagePattern;
  totalScore: number;
  suitability: 'excellent' | 'good' | 'acceptable' | 'poor';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  metrics: {
    performance: number;
    reliability: number;
    features: number;
    maintainability: number;
  };
}

/**
 * Pattern-specific requirements and weights
 */
export const PATTERN_CONFIGS: Record<UsagePattern, {
  weights: ScoreWeights;
  requirements: {
    maxLoadTime: number;
    maxInstallTime: number;
    maxCommandLag: number;
    criticalMetrics: Array<keyof ScoreWeights>;
  };
  description: string;
}> = {
  minimal: {
    weights: {
      loadTime: 0.40,
      installTime: 0.20,
      firstPromptLag: 0.20,
      firstCommandLag: 0.10,
      commandLag: 0.05,
      inputLag: 0.05,
    },
    requirements: {
      maxLoadTime: 200,
      maxInstallTime: 20000,
      maxCommandLag: 50,
      criticalMetrics: ['loadTime', 'firstPromptLag'],
    },
    description: 'Minimal setup with few plugins, prioritizing fast startup',
  },
  developer: {
    weights: {
      loadTime: 0.20,
      installTime: 0.10,
      firstPromptLag: 0.20,
      firstCommandLag: 0.15,
      commandLag: 0.25,
      inputLag: 0.10,
    },
    requirements: {
      maxLoadTime: 300,
      maxInstallTime: 30000,
      maxCommandLag: 20,
      criticalMetrics: ['commandLag', 'firstPromptLag'],
    },
    description: 'Active development with frequent command execution',
  },
  'power-user': {
    weights: {
      loadTime: 0.15,
      installTime: 0.10,
      firstPromptLag: 0.15,
      firstCommandLag: 0.20,
      commandLag: 0.20,
      inputLag: 0.20,
    },
    requirements: {
      maxLoadTime: 500,
      maxInstallTime: 60000,
      maxCommandLag: 30,
      criticalMetrics: ['commandLag', 'inputLag', 'firstCommandLag'],
    },
    description: 'Heavy customization with many plugins and features',
  },
  server: {
    weights: {
      loadTime: 0.30,
      installTime: 0.05,
      firstPromptLag: 0.25,
      firstCommandLag: 0.20,
      commandLag: 0.15,
      inputLag: 0.05,
    },
    requirements: {
      maxLoadTime: 200,
      maxInstallTime: 100000,
      maxCommandLag: 100,
      criticalMetrics: ['loadTime', 'firstPromptLag'],
    },
    description: 'Remote server usage where startup time is critical',
  },
  container: {
    weights: {
      loadTime: 0.35,
      installTime: 0.25,
      firstPromptLag: 0.20,
      firstCommandLag: 0.10,
      commandLag: 0.05,
      inputLag: 0.05,
    },
    requirements: {
      maxLoadTime: 150,
      maxInstallTime: 15000,
      maxCommandLag: 50,
      criticalMetrics: ['loadTime', 'installTime'],
    },
    description: 'Containerized environments with frequent rebuilds',
  },
  'ci-cd': {
    weights: {
      loadTime: 0.30,
      installTime: 0.40,
      firstPromptLag: 0.20,
      firstCommandLag: 0.05,
      commandLag: 0.03,
      inputLag: 0.02,
    },
    requirements: {
      maxLoadTime: 100,
      maxInstallTime: 10000,
      maxCommandLag: 200,
      criticalMetrics: ['installTime', 'loadTime'],
    },
    description: 'CI/CD pipelines where speed and reliability are key',
  },
};

/**
 * Calculate pattern-based score
 */
export function calculatePatternScore(
  result: BenchmarkResult,
  pattern: UsagePattern
): PatternScore {
  const config = PATTERN_CONFIGS[pattern];
  const weightedScore = calculateWeightedScore(result, config.weights);
  const perceptualScore = calculatePerceptualScore(result);
  
  // Calculate metrics
  const metrics = calculatePatternMetrics(result, pattern);
  
  // Determine suitability
  let suitability: PatternScore['suitability'] = 'excellent';
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  // Check critical metrics
  for (const metric of config.requirements.criticalMetrics) {
    const value = result[metric as keyof BenchmarkResult] as number | null;
    if (value !== null && value !== undefined) {
      const threshold = config.requirements[`max${metric.charAt(0).toUpperCase() + metric.slice(1)}` as keyof typeof config.requirements] as number;
      
      if (value <= threshold * 0.5) {
        strengths.push(`Excellent ${formatMetricName(metric)} (${value.toFixed(0)}ms)`);
      } else if (value <= threshold) {
        strengths.push(`Good ${formatMetricName(metric)} (${value.toFixed(0)}ms)`);
      } else if (value <= threshold * 1.5) {
        weaknesses.push(`${formatMetricName(metric)} slightly above target (${value.toFixed(0)}ms > ${threshold}ms)`);
        suitability = suitability === 'excellent' ? 'good' : suitability;
      } else {
        weaknesses.push(`Poor ${formatMetricName(metric)} (${value.toFixed(0)}ms >> ${threshold}ms)`);
        suitability = 'poor';
      }
    }
  }

  // Pattern-specific analysis
  switch (pattern) {
    case 'minimal':
      if (result.loadTime && result.loadTime < 100) {
        strengths.push('Lightning-fast startup perfect for minimal setups');
      }
      if (!result.installTime || result.installTime > 30000) {
        recommendations.push('Consider caching plugins to improve install time');
      }
      break;

    case 'developer':
      if (perceptualScore.breakdown.command === 'imperceptible') {
        strengths.push('Command execution feels instant - ideal for development');
      }
      if (perceptualScore.breakdown.input && ['slow', 'unusable'].includes(perceptualScore.breakdown.input)) {
        weaknesses.push('Input lag may impact coding experience');
        recommendations.push('Check for plugins that hook into key bindings');
      }
      break;

    case 'power-user':
      if (result.pluginCount >= 25 && result.loadTime && result.loadTime < 200) {
        strengths.push('Handles many plugins efficiently');
      }
      if (metrics.reliability < 0.8) {
        recommendations.push('Consider using a more stable plugin manager');
      }
      break;

    case 'server':
      if (result.firstPromptLag && result.firstPromptLag < 50) {
        strengths.push('Minimal connection overhead for SSH sessions');
      }
      if (metrics.maintainability < 0.7) {
        recommendations.push('Choose a plugin manager with better remote management');
      }
      break;

    case 'container':
      if (result.installTime && result.installTime < 5000) {
        strengths.push('Fast installation suitable for container builds');
      }
      if (result.manager === 'zcomet') {
        weaknesses.push('Async installation may complicate container builds');
        recommendations.push('Ensure proper completion detection in Dockerfiles');
      }
      break;

    case 'ci-cd':
      if (metrics.reliability >= 0.9) {
        strengths.push('High reliability for automated pipelines');
      }
      if (result.installTime && result.installTime > 15000) {
        weaknesses.push('Long install times will slow down CI/CD pipelines');
        recommendations.push('Cache plugin installations between builds');
      }
      break;
  }

  // Overall score calculation
  const totalScore = (
    metrics.performance * 0.4 +
    metrics.reliability * 0.3 +
    metrics.features * 0.1 +
    metrics.maintainability * 0.2
  );

  // Adjust suitability based on total score
  if (suitability !== 'poor') {
    if (totalScore >= 0.8) suitability = 'excellent';
    else if (totalScore >= 0.6) suitability = 'good';
    else if (totalScore >= 0.4) suitability = 'acceptable';
    else suitability = 'poor';
  }

  return {
    pattern,
    totalScore,
    suitability,
    strengths,
    weaknesses,
    recommendations,
    metrics,
  };
}

/**
 * Calculate pattern-specific metrics
 */
function calculatePatternMetrics(
  result: BenchmarkResult,
  pattern: UsagePattern
): PatternScore['metrics'] {
  const config = PATTERN_CONFIGS[pattern];
  
  // Performance metric
  let performance = 1.0;
  for (const metric of config.requirements.criticalMetrics) {
    const value = result[metric as keyof BenchmarkResult] as number | null;
    if (value !== null && value !== undefined) {
      const threshold = config.requirements[`max${metric.charAt(0).toUpperCase() + metric.slice(1)}` as keyof typeof config.requirements] as number;
      performance *= Math.max(0, Math.min(1, threshold / value));
    }
  }

  // Reliability metric (based on error presence and stddev)
  let reliability = 1.0;
  if (result.error) reliability *= 0.5;
  if (result.loadStddev && result.loadTime) {
    const cv = result.loadStddev / result.loadTime;
    reliability *= Math.max(0.5, 1 - cv);
  }

  // Features metric (based on manager capabilities)
  const features = getManagerFeatureScore(result.manager);

  // Maintainability metric
  const maintainability = getManagerMaintainabilityScore(result.manager, pattern);

  return {
    performance,
    reliability,
    features,
    maintainability,
  };
}

/**
 * Get feature score for a plugin manager
 */
function getManagerFeatureScore(manager: string): number {
  const featureScores: Record<string, number> = {
    'oh-my-zsh': 0.9,    // Huge ecosystem
    'prezto': 0.8,        // Good module system
    'zim': 0.85,          // Fast and feature-rich
    'zinit': 0.95,        // Most features
    'zplug': 0.8,         // Good features but slow
    'antigen': 0.7,       // Basic but reliable
    'antibody': 0.6,      // Minimal features
    'antidote': 0.75,     // Good balance
    'sheldon': 0.7,       // Config-based
    'zgenom': 0.75,       // Static loading
    'zpm': 0.8,           // Good features
    'znap': 0.85,         // Modern features
    'zcomet': 0.9,        // Advanced async
    'vanilla': 0.3,       // No plugin management
    'zr': 0.6,            // Minimal
    'antigen-hs': 0.65,   // Haskell-based
    'alf': 0.6,           // Basic
  };
  
  return featureScores[manager] || 0.5;
}

/**
 * Get maintainability score
 */
function getManagerMaintainabilityScore(manager: string, pattern: UsagePattern): number {
  const baseScores: Record<string, number> = {
    'oh-my-zsh': 0.9,     // Very active
    'prezto': 0.7,         // Less active
    'zim': 0.8,           // Active
    'zinit': 0.6,         // Complex
    'zplug': 0.5,         // Less maintained
    'antigen': 0.6,       // Stable but old
    'antibody': 0.4,      // Deprecated
    'antidote': 0.8,      // Active fork
    'sheldon': 0.8,       // Well maintained
    'zgenom': 0.7,        // Maintained
    'zpm': 0.6,           // Less known
    'znap': 0.8,          // Active
    'zcomet': 0.7,        // Newer
    'vanilla': 1.0,       // No dependencies
    'zr': 0.5,            // Minimal
    'antigen-hs': 0.4,    // Niche
    'alf': 0.4,           // Old
  };
  
  let score = baseScores[manager] || 0.5;
  
  // Adjust for pattern
  if (pattern === 'ci-cd' || pattern === 'container') {
    // Prefer simpler, more stable managers
    if (['vanilla', 'antibody', 'sheldon'].includes(manager)) score *= 1.2;
    if (['zinit', 'zplug'].includes(manager)) score *= 0.8;
  }
  
  return Math.min(1.0, score);
}

/**
 * Format metric name for display
 */
function formatMetricName(metric: string): string {
  const names: Record<string, string> = {
    loadTime: 'load time',
    installTime: 'install time',
    firstPromptLag: 'first prompt lag',
    firstCommandLag: 'first command lag',
    commandLag: 'command lag',
    inputLag: 'input lag',
  };
  return names[metric] || metric;
}

/**
 * Get best plugin manager for pattern
 */
export function getBestForPattern(
  results: BenchmarkResult[],
  pattern: UsagePattern
): {
  best: BenchmarkResult;
  score: PatternScore;
  alternatives: Array<{ result: BenchmarkResult; score: PatternScore }>;
} | null {
  const scored = results
    .filter(r => r.pluginCount === 25) // Use 25 plugin results for comparison
    .map(result => ({
      result,
      score: calculatePatternScore(result, pattern),
    }))
    .filter(({ score }) => score.suitability !== 'poor')
    .sort((a, b) => b.score.totalScore - a.score.totalScore);

  if (scored.length === 0) return null;

  return {
    best: scored[0].result,
    score: scored[0].score,
    alternatives: scored.slice(1, 4),
  };
}

/**
 * Format pattern score for display
 */
export function formatPatternScore(score: PatternScore): string {
  const lines: string[] = [];
  
  lines.push(`Pattern: ${score.pattern} - ${PATTERN_CONFIGS[score.pattern].description}`);
  lines.push(`Suitability: ${score.suitability.toUpperCase()} (score: ${(score.totalScore * 100).toFixed(0)}%)`);
  lines.push('');
  
  if (score.strengths.length > 0) {
    lines.push('Strengths:');
    score.strengths.forEach(s => lines.push(`  ✓ ${s}`));
  }
  
  if (score.weaknesses.length > 0) {
    lines.push('');
    lines.push('Weaknesses:');
    score.weaknesses.forEach(w => lines.push(`  ✗ ${w}`));
  }
  
  if (score.recommendations.length > 0) {
    lines.push('');
    lines.push('Recommendations:');
    score.recommendations.forEach(r => lines.push(`  → ${r}`));
  }
  
  lines.push('');
  lines.push('Metrics:');
  lines.push(`  Performance: ${(score.metrics.performance * 100).toFixed(0)}%`);
  lines.push(`  Reliability: ${(score.metrics.reliability * 100).toFixed(0)}%`);
  lines.push(`  Features: ${(score.metrics.features * 100).toFixed(0)}%`);
  lines.push(`  Maintainability: ${(score.metrics.maintainability * 100).toFixed(0)}%`);
  
  return lines.join('\n');
}