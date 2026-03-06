/**
 * Perceptual scoring based on human perception thresholds
 * Inspired by romkatv/zsh-bench research
 */

import { BenchmarkResult } from "../core/types.ts";

export type PerceptualRating = 'imperceptible' | 'good' | 'acceptable' | 'slow' | 'unusable';

export interface PerceptualScore {
  overall: PerceptualRating;
  breakdown: {
    firstPrompt?: PerceptualRating;
    firstCommand?: PerceptualRating;
    command?: PerceptualRating;
    input?: PerceptualRating;
    load?: PerceptualRating;
    install?: PerceptualRating;
  };
  details: {
    [key: string]: {
      value: number;
      rating: PerceptualRating;
      threshold: number;
      percentOfThreshold: number;
    };
  };
  humanReadable: string;
}

/**
 * Human perception thresholds based on research
 */
export const PERCEPTION_THRESHOLDS = {
  // Interactive latencies (milliseconds)
  firstPromptLag: {
    imperceptible: 50,
    good: 150,
    acceptable: 300,
    slow: 1000,
    unusable: Infinity,
  },
  firstCommandLag: {
    imperceptible: 50,
    good: 200,
    acceptable: 500,
    slow: 2000,
    unusable: Infinity,
  },
  commandLag: {
    imperceptible: 10,
    good: 30,
    acceptable: 100,
    slow: 300,
    unusable: Infinity,
  },
  inputLag: {
    imperceptible: 20,
    good: 50,
    acceptable: 100,
    slow: 200,
    unusable: Infinity,
  },
  // Traditional metrics
  loadTime: {
    imperceptible: 100,
    good: 200,
    acceptable: 500,
    slow: 1000,
    unusable: Infinity,
  },
  installTime: {
    imperceptible: 2000,
    good: 5000,
    acceptable: 15000,
    slow: 30000,
    unusable: Infinity,
  },
} as const;

/**
 * Calculate perceptual rating for a value
 */
export function getPerceptualRating(
  value: number,
  thresholds: typeof PERCEPTION_THRESHOLDS[keyof typeof PERCEPTION_THRESHOLDS]
): PerceptualRating {
  if (value <= thresholds.imperceptible) return 'imperceptible';
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.acceptable) return 'acceptable';
  if (value <= thresholds.slow) return 'slow';
  return 'unusable';
}

/**
 * Calculate perceptual score for benchmark results
 */
export function calculatePerceptualScore(result: BenchmarkResult): PerceptualScore {
  const score: PerceptualScore = {
    overall: 'imperceptible',
    breakdown: {},
    details: {},
    humanReadable: '',
  };

  const ratings: PerceptualRating[] = [];

  // First prompt lag
  if (result.firstPromptLag !== null && result.firstPromptLag !== undefined) {
    const rating = getPerceptualRating(result.firstPromptLag, PERCEPTION_THRESHOLDS.firstPromptLag);
    score.breakdown.firstPrompt = rating;
    ratings.push(rating);
    
    score.details.firstPromptLag = {
      value: result.firstPromptLag,
      rating,
      threshold: PERCEPTION_THRESHOLDS.firstPromptLag[rating],
      percentOfThreshold: (result.firstPromptLag / PERCEPTION_THRESHOLDS.firstPromptLag[rating]) * 100,
    };
  }

  // First command lag
  if (result.firstCommandLag !== null && result.firstCommandLag !== undefined) {
    const rating = getPerceptualRating(result.firstCommandLag, PERCEPTION_THRESHOLDS.firstCommandLag);
    score.breakdown.firstCommand = rating;
    ratings.push(rating);
    
    score.details.firstCommandLag = {
      value: result.firstCommandLag,
      rating,
      threshold: PERCEPTION_THRESHOLDS.firstCommandLag[rating],
      percentOfThreshold: (result.firstCommandLag / PERCEPTION_THRESHOLDS.firstCommandLag[rating]) * 100,
    };
  }

  // Command lag
  if (result.commandLag !== null && result.commandLag !== undefined) {
    const rating = getPerceptualRating(result.commandLag, PERCEPTION_THRESHOLDS.commandLag);
    score.breakdown.command = rating;
    ratings.push(rating);
    
    score.details.commandLag = {
      value: result.commandLag,
      rating,
      threshold: PERCEPTION_THRESHOLDS.commandLag[rating],
      percentOfThreshold: (result.commandLag / PERCEPTION_THRESHOLDS.commandLag[rating]) * 100,
    };
  }

  // Input lag
  if (result.inputLag !== null && result.inputLag !== undefined) {
    const rating = getPerceptualRating(result.inputLag, PERCEPTION_THRESHOLDS.inputLag);
    score.breakdown.input = rating;
    ratings.push(rating);
    
    score.details.inputLag = {
      value: result.inputLag,
      rating,
      threshold: PERCEPTION_THRESHOLDS.inputLag[rating],
      percentOfThreshold: (result.inputLag / PERCEPTION_THRESHOLDS.inputLag[rating]) * 100,
    };
  }

  // Load time
  if (result.loadTime !== null) {
    const rating = getPerceptualRating(result.loadTime, PERCEPTION_THRESHOLDS.loadTime);
    score.breakdown.load = rating;
    ratings.push(rating);
    
    score.details.loadTime = {
      value: result.loadTime,
      rating,
      threshold: PERCEPTION_THRESHOLDS.loadTime[rating],
      percentOfThreshold: (result.loadTime / PERCEPTION_THRESHOLDS.loadTime[rating]) * 100,
    };
  }

  // Install time
  if (result.installTime !== null) {
    const rating = getPerceptualRating(result.installTime, PERCEPTION_THRESHOLDS.installTime);
    score.breakdown.install = rating;
    // Install time has lower weight for overall rating
    if (ratings.length === 0) ratings.push(rating);
    
    score.details.installTime = {
      value: result.installTime,
      rating,
      threshold: PERCEPTION_THRESHOLDS.installTime[rating],
      percentOfThreshold: (result.installTime / PERCEPTION_THRESHOLDS.installTime[rating]) * 100,
    };
  }

  // Calculate overall rating (worst of all ratings)
  if (ratings.length > 0) {
    const ratingPriority: PerceptualRating[] = ['unusable', 'slow', 'acceptable', 'good', 'imperceptible'];
    for (const priorityRating of ratingPriority) {
      if (ratings.includes(priorityRating)) {
        score.overall = priorityRating;
        break;
      }
    }
  }

  // Generate human-readable summary
  score.humanReadable = generateHumanReadableSummary(score, result);

  return score;
}

/**
 * Generate human-readable summary
 */
function generateHumanReadableSummary(score: PerceptualScore, result: BenchmarkResult): string {
  const parts: string[] = [];

  // Overall assessment
  switch (score.overall) {
    case 'imperceptible':
      parts.push(`${result.manager} provides an exceptional experience with imperceptible delays.`);
      break;
    case 'good':
      parts.push(`${result.manager} offers a smooth experience with minimal noticeable delays.`);
      break;
    case 'acceptable':
      parts.push(`${result.manager} provides an acceptable experience, though some delays are noticeable.`);
      break;
    case 'slow':
      parts.push(`${result.manager} has noticeable performance issues that impact user experience.`);
      break;
    case 'unusable':
      parts.push(`${result.manager} has severe performance issues that make it difficult to use.`);
      break;
  }

  // Specific issues
  const issues: string[] = [];
  
  if (score.breakdown.firstPrompt && ['slow', 'unusable'].includes(score.breakdown.firstPrompt)) {
    issues.push(`Shell startup is slow (${result.firstPromptLag}ms)`);
  }
  
  if (score.breakdown.command && ['slow', 'unusable'].includes(score.breakdown.command)) {
    issues.push(`Command execution has high latency (${result.commandLag}ms)`);
  }
  
  if (score.breakdown.input && ['slow', 'unusable'].includes(score.breakdown.input)) {
    issues.push(`Typing feels sluggish (${result.inputLag}ms input lag)`);
  }

  // Strengths
  const strengths: string[] = [];
  
  if (score.breakdown.command === 'imperceptible') {
    strengths.push(`Command execution feels instant`);
  }
  
  if (score.breakdown.input === 'imperceptible') {
    strengths.push(`Typing is perfectly responsive`);
  }
  
  if (score.breakdown.load === 'imperceptible') {
    strengths.push(`Shell loads very quickly`);
  }

  // Combine parts
  if (issues.length > 0) {
    parts.push(`Issues: ${issues.join(', ')}.`);
  }
  
  if (strengths.length > 0) {
    parts.push(`Strengths: ${strengths.join(', ')}.`);
  }

  return parts.join(' ');
}

/**
 * Compare perceptual scores
 */
export function comparePerceptualScores(
  score1: PerceptualScore,
  score2: PerceptualScore
): {
  better: 'first' | 'second' | 'equal';
  improvements: string[];
  regressions: string[];
} {
  const ratingValue = (rating: PerceptualRating): number => {
    const values: Record<PerceptualRating, number> = {
      imperceptible: 5,
      good: 4,
      acceptable: 3,
      slow: 2,
      unusable: 1,
    };
    return values[rating];
  };

  const improvements: string[] = [];
  const regressions: string[] = [];

  // Compare each metric
  const metrics: Array<keyof typeof score1.breakdown> = [
    'firstPrompt', 'firstCommand', 'command', 'input', 'load', 'install'
  ];

  for (const metric of metrics) {
    const rating1 = score1.breakdown[metric];
    const rating2 = score2.breakdown[metric];

    if (rating1 && rating2) {
      const value1 = ratingValue(rating1);
      const value2 = ratingValue(rating2);

      if (value2 > value1) {
        improvements.push(`${metric}: ${rating1} → ${rating2}`);
      } else if (value2 < value1) {
        regressions.push(`${metric}: ${rating1} → ${rating2}`);
      }
    }
  }

  // Determine overall comparison
  let better: 'first' | 'second' | 'equal' = 'equal';
  
  const overall1 = ratingValue(score1.overall);
  const overall2 = ratingValue(score2.overall);
  
  if (overall2 > overall1) {
    better = 'second';
  } else if (overall1 > overall2) {
    better = 'first';
  }

  return { better, improvements, regressions };
}

/**
 * Get emoji for perceptual rating
 */
export function getPerceptualEmoji(rating: PerceptualRating): string {
  const emojis: Record<PerceptualRating, string> = {
    imperceptible: '🟢',
    good: '🟡',
    acceptable: '🟠',
    slow: '🔴',
    unusable: '⚫',
  };
  return emojis[rating];
}

/**
 * Format perceptual score for display
 */
export function formatPerceptualScore(score: PerceptualScore): string {
  const lines: string[] = [];
  
  lines.push(`Overall: ${getPerceptualEmoji(score.overall)} ${score.overall}`);
  lines.push('');
  
  // Interactive metrics
  if (Object.keys(score.breakdown).some(k => ['firstPrompt', 'firstCommand', 'command', 'input'].includes(k))) {
    lines.push('Interactive Performance:');
    
    if (score.breakdown.firstPrompt) {
      lines.push(`  First Prompt: ${getPerceptualEmoji(score.breakdown.firstPrompt)} ${score.breakdown.firstPrompt}`);
    }
    if (score.breakdown.firstCommand) {
      lines.push(`  First Command: ${getPerceptualEmoji(score.breakdown.firstCommand)} ${score.breakdown.firstCommand}`);
    }
    if (score.breakdown.command) {
      lines.push(`  Command Lag: ${getPerceptualEmoji(score.breakdown.command)} ${score.breakdown.command}`);
    }
    if (score.breakdown.input) {
      lines.push(`  Input Lag: ${getPerceptualEmoji(score.breakdown.input)} ${score.breakdown.input}`);
    }
  }
  
  // Traditional metrics
  if (score.breakdown.load || score.breakdown.install) {
    lines.push('');
    lines.push('Traditional Metrics:');
    
    if (score.breakdown.load) {
      lines.push(`  Load Time: ${getPerceptualEmoji(score.breakdown.load)} ${score.breakdown.load}`);
    }
    if (score.breakdown.install) {
      lines.push(`  Install Time: ${getPerceptualEmoji(score.breakdown.install)} ${score.breakdown.install}`);
    }
  }

  return lines.join('\n');
}