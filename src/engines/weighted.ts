/**
 * Weighted score calculation with customizable priorities
 * Allows users to emphasize different performance aspects
 */

import { BenchmarkResult } from "../core/types.ts";

export interface ScoreWeights {
  loadTime: number;
  installTime: number;
  firstPromptLag: number;
  firstCommandLag: number;
  commandLag: number;
  inputLag: number;
}

export interface WeightedScore {
  total: number;
  normalized: number; // 0-100 scale
  components: {
    [metric: string]: {
      value: number;
      weight: number;
      contribution: number;
      normalizedValue: number;
    };
  };
  weights: ScoreWeights;
}

/**
 * Default weight profiles
 */
export const DEFAULT_WEIGHTS: Record<string, ScoreWeights> = {
  balanced: {
    loadTime: 0.25,
    installTime: 0.10,
    firstPromptLag: 0.20,
    firstCommandLag: 0.15,
    commandLag: 0.20,
    inputLag: 0.10,
  },
  interactive: {
    loadTime: 0.10,
    installTime: 0.05,
    firstPromptLag: 0.15,
    firstCommandLag: 0.20,
    commandLag: 0.30,
    inputLag: 0.20,
  },
  startup: {
    loadTime: 0.40,
    installTime: 0.20,
    firstPromptLag: 0.30,
    firstCommandLag: 0.10,
    commandLag: 0.00,
    inputLag: 0.00,
  },
  developer: {
    loadTime: 0.20,
    installTime: 0.05,
    firstPromptLag: 0.20,
    firstCommandLag: 0.15,
    commandLag: 0.25,
    inputLag: 0.15,
  },
};

/**
 * Normalization bases for each metric (median expected values)
 */
export const NORMALIZATION_BASES = {
  loadTime: 150,        // ms
  installTime: 10000,   // ms
  firstPromptLag: 100,  // ms
  firstCommandLag: 150, // ms
  commandLag: 20,       // ms
  inputLag: 30,         // ms
};

/**
 * Calculate weighted score
 */
export function calculateWeightedScore(
  result: BenchmarkResult,
  weights: ScoreWeights | keyof typeof DEFAULT_WEIGHTS = 'balanced'
): WeightedScore {
  // Get weights
  const scoreWeights = typeof weights === 'string' ? DEFAULT_WEIGHTS[weights] : weights;
  
  // Validate weights sum to 1
  const weightSum = Object.values(scoreWeights).reduce((sum, w) => sum + w, 0);
  if (Math.abs(weightSum - 1.0) > 0.01) {
    throw new Error(`Weights must sum to 1.0, got ${weightSum}`);
  }

  const score: WeightedScore = {
    total: 0,
    normalized: 0,
    components: {},
    weights: scoreWeights,
  };

  // Calculate component scores
  const metrics: Array<{
    key: keyof ScoreWeights;
    value: number | null | undefined;
  }> = [
    { key: 'loadTime', value: result.loadTime },
    { key: 'installTime', value: result.installTime },
    { key: 'firstPromptLag', value: result.firstPromptLag },
    { key: 'firstCommandLag', value: result.firstCommandLag },
    { key: 'commandLag', value: result.commandLag },
    { key: 'inputLag', value: result.inputLag },
  ];

  let totalWeight = 0;
  let weightedSum = 0;

  for (const { key, value } of metrics) {
    if (value !== null && value !== undefined) {
      const weight = scoreWeights[key];
      const normalizedValue = value / NORMALIZATION_BASES[key];
      const contribution = normalizedValue * weight;

      score.components[key] = {
        value,
        weight,
        contribution,
        normalizedValue,
      };

      weightedSum += contribution;
      totalWeight += weight;
    }
  }

  // Adjust for missing metrics
  if (totalWeight > 0) {
    score.total = weightedSum / totalWeight;
    // Convert to 0-100 scale where lower is better
    // Use exponential decay for better differentiation
    score.normalized = Math.max(0, Math.min(100, 100 * Math.exp(-score.total)));
  }

  return score;
}

/**
 * Compare weighted scores
 */
export function compareWeightedScores(
  score1: WeightedScore,
  score2: WeightedScore
): {
  difference: number;
  percentChange: number;
  better: 'first' | 'second' | 'equal';
  significantComponents: Array<{
    metric: string;
    change: number;
    percentChange: number;
  }>;
} {
  const difference = score2.total - score1.total;
  const percentChange = (difference / score1.total) * 100;
  
  let better: 'first' | 'second' | 'equal' = 'equal';
  if (Math.abs(difference) > 0.05) { // 5% threshold
    better = difference < 0 ? 'second' : 'first';
  }

  // Find significant component changes
  const significantComponents: Array<{
    metric: string;
    change: number;
    percentChange: number;
  }> = [];

  for (const metric in score1.components) {
    if (score2.components[metric]) {
      const change = score2.components[metric].contribution - score1.components[metric].contribution;
      const pctChange = (change / score1.components[metric].contribution) * 100;
      
      if (Math.abs(pctChange) > 10) { // 10% threshold for components
        significantComponents.push({
          metric,
          change,
          percentChange: pctChange,
        });
      }
    }
  }

  significantComponents.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));

  return {
    difference,
    percentChange,
    better,
    significantComponents,
  };
}

/**
 * Find optimal weights for a given set of requirements
 */
export function optimizeWeights(
  results: BenchmarkResult[],
  requirements: {
    maxLoadTime?: number;
    maxInstallTime?: number;
    maxCommandLag?: number;
    maxInputLag?: number;
    emphasize?: Array<keyof ScoreWeights>;
  }
): ScoreWeights {
  // Start with balanced weights
  let weights = { ...DEFAULT_WEIGHTS.balanced };

  // Adjust based on requirements
  if (requirements.maxLoadTime) {
    weights.loadTime *= 1.5;
  }
  if (requirements.maxCommandLag) {
    weights.commandLag *= 1.5;
  }
  if (requirements.maxInputLag) {
    weights.inputLag *= 1.5;
  }

  // Emphasize specific metrics
  if (requirements.emphasize) {
    for (const metric of requirements.emphasize) {
      weights[metric] *= 2;
    }
  }

  // Normalize to sum to 1
  const sum = Object.values(weights).reduce((s, w) => s + w, 0);
  for (const key in weights) {
    weights[key as keyof ScoreWeights] /= sum;
  }

  return weights;
}

/**
 * Generate weight recommendation based on usage
 */
export function recommendWeights(usage: {
  shellRestarts: 'frequent' | 'occasional' | 'rare';
  interactiveUse: 'heavy' | 'moderate' | 'light';
  pluginCount: 'many' | 'moderate' | 'few';
  priority: 'speed' | 'features' | 'balanced';
}): { weights: ScoreWeights; profile: string; reasoning: string[] } {
  let profile = 'balanced';
  const reasoning: string[] = [];

  // Determine profile based on usage
  if (usage.interactiveUse === 'heavy' && usage.priority === 'speed') {
    profile = 'interactive';
    reasoning.push('Heavy interactive use requires responsive command execution');
  } else if (usage.shellRestarts === 'frequent') {
    profile = 'startup';
    reasoning.push('Frequent restarts make startup time critical');
  } else if (usage.interactiveUse === 'heavy') {
    profile = 'developer';
    reasoning.push('Developer workflow benefits from balanced performance');
  }

  let weights = { ...DEFAULT_WEIGHTS[profile] };

  // Fine-tune based on specific factors
  if (usage.pluginCount === 'many') {
    weights.installTime *= 0.5; // Install time less important with many plugins
    weights.loadTime *= 1.2;
    reasoning.push('Many plugins make load time more important than install time');
  }

  if (usage.priority === 'features') {
    weights.installTime *= 1.5; // More tolerant of install time
    reasoning.push('Feature priority allows for longer installation times');
  }

  // Normalize
  const sum = Object.values(weights).reduce((s, w) => s + w, 0);
  for (const key in weights) {
    weights[key as keyof ScoreWeights] /= sum;
  }

  return { weights, profile, reasoning };
}

/**
 * Format weighted score for display
 */
export function formatWeightedScore(score: WeightedScore): string {
  const lines: string[] = [];
  
  lines.push(`Total Score: ${score.total.toFixed(3)} (normalized: ${score.normalized.toFixed(1)}/100)`);
  lines.push('');
  lines.push('Component Breakdown:');
  
  // Sort by contribution
  const sortedComponents = Object.entries(score.components)
    .sort(([, a], [, b]) => b.contribution - a.contribution);
  
  for (const [metric, component] of sortedComponents) {
    const percentage = (component.contribution / score.total * 100).toFixed(1);
    lines.push(`  ${metric}: ${component.value.toFixed(1)}ms × ${(component.weight * 100).toFixed(0)}% = ${percentage}% of total`);
  }

  return lines.join('\n');
}

/**
 * Calculate relative score compared to baseline
 */
export function calculateRelativeScore(
  result: BenchmarkResult,
  baseline: BenchmarkResult,
  weights: ScoreWeights | keyof typeof DEFAULT_WEIGHTS = 'balanced'
): {
  score: number;
  percentBetter: number;
  componentComparison: {
    [metric: string]: {
      value: number;
      baseline: number;
      percentDiff: number;
      better: boolean;
    };
  };
} {
  const targetScore = calculateWeightedScore(result, weights);
  const baselineScore = calculateWeightedScore(baseline, weights);
  
  const score = targetScore.total / baselineScore.total;
  const percentBetter = (1 - score) * 100;
  
  const componentComparison: any = {};
  
  for (const metric in targetScore.components) {
    if (baselineScore.components[metric]) {
      const value = targetScore.components[metric].value;
      const baselineValue = baselineScore.components[metric].value;
      const percentDiff = ((value - baselineValue) / baselineValue) * 100;
      
      componentComparison[metric] = {
        value,
        baseline: baselineValue,
        percentDiff,
        better: percentDiff < 0,
      };
    }
  }
  
  return {
    score,
    percentBetter,
    componentComparison,
  };
}