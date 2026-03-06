/**
 * Template engine for customizable README generation
 * Supports Handlebars-like syntax with helpers and partials
 */

import { BenchmarkData, BenchmarkResult } from "../../core/types.ts";
import { HistoryEntry } from "../../storage/history/schema.ts";
import { calculatePerceptualScore } from "../../engines/perceptual.ts";
import { calculateWeightedScore } from "../../engines/weighted.ts";
import { calculatePatternScore, UsagePattern } from "../../engines/patterns.ts";

export interface TemplateContext {
  data: BenchmarkData;
  history?: HistoryEntry[];
  metadata: {
    date: string;
    timestamp: string;
    environment: string;
  };
  rankings: {
    loadTime: Array<{ manager: string; value: number; rank: number }>;
    installTime: Array<{ manager: string; value: number; rank: number }>;
    overall: Array<{ manager: string; score: number; rank: number }>;
  };
  analysis: {
    best: string;
    worst: string;
    ratio: number;
    improvements: number;
    regressions: number;
  };
  helpers: TemplateHelpers;
}

export interface TemplateHelpers {
  [key: string]: (...args: any[]) => string;
}

export interface TemplateOptions {
  template: string;
  partials?: Record<string, string>;
  helpers?: TemplateHelpers;
  strict?: boolean;
}

/**
 * Default template helpers
 */
export const DEFAULT_HELPERS: TemplateHelpers = {
  // Formatting helpers
  formatTime: (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return value < 1000 ? `${value.toFixed(0)}ms` : `${(value / 1000).toFixed(1)}s`;
  },
  
  formatPercent: (value: number) => `${value.toFixed(1)}%`,
  
  formatNumber: (value: number, decimals = 0) => value.toFixed(decimals),
  
  formatDate: (date: string | Date) => new Date(date).toLocaleDateString(),
  
  // Comparison helpers
  compare: (a: any, operator: string, b: any) => {
    switch (operator) {
      case '===': return a === b;
      case '!==': return a !== b;
      case '>': return a > b;
      case '<': return a < b;
      case '>=': return a >= b;
      case '<=': return a <= b;
      default: return false;
    }
  },
  
  // Math helpers
  add: (a: number, b: number) => String(a + b),
  subtract: (a: number, b: number) => String(a - b),
  multiply: (a: number, b: number) => String(a * b),
  divide: (a: number, b: number) => String(b !== 0 ? a / b : 0),
  
  // String helpers
  uppercase: (str: string) => str.toUpperCase(),
  lowercase: (str: string) => str.toLowerCase(),
  capitalize: (str: string) => str.charAt(0).toUpperCase() + str.slice(1),
  truncate: (str: string, length: number) => str.length > length ? str.slice(0, length - 3) + '...' : str,
  
  // Ranking helpers
  medal: (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  },
  
  // Score helpers
  perceptualRating: (result: BenchmarkResult) => {
    const score = calculatePerceptualScore(result);
    return score.overall;
  },
  
  weightedScore: (result: BenchmarkResult) => {
    const score = calculateWeightedScore(result);
    return score.normalized.toFixed(0);
  },
  
  patternSuitability: (result: BenchmarkResult, pattern: UsagePattern) => {
    const score = calculatePatternScore(result, pattern);
    return score.suitability;
  },
  
  // Table helpers
  table: (headers: string[], rows: any[][]) => {
    const headerRow = `| ${headers.join(' | ')} |`;
    const separator = `| ${headers.map(() => '---').join(' | ')} |`;
    const dataRows = rows.map(row => `| ${row.join(' | ')} |`);
    return [headerRow, separator, ...dataRows].join('\n');
  },
  
  // Conditional helpers
  if: (condition: any, truthy: string, falsy: string = '') => condition ? truthy : falsy,
  unless: (condition: any, truthy: string, falsy: string = '') => !condition ? truthy : falsy,
  
  // List helpers
  each: (items: any[], template: string) => {
    return items.map((item, index) => {
      return template
        .replace(/\{\{@index\}\}/g, String(index))
        .replace(/\{\{@first\}\}/g, String(index === 0))
        .replace(/\{\{@last\}\}/g, String(index === items.length - 1))
        .replace(/\{\{this\}\}/g, String(item));
    }).join('');
  },
  
  // Badge helpers
  badge: (label: string, message: string, color: string = 'blue') => {
    const encodedLabel = encodeURIComponent(label);
    const encodedMessage = encodeURIComponent(message);
    return `![${label}](https://img.shields.io/badge/${encodedLabel}-${encodedMessage}-${color})`;
  },
  
  gitHubBadge: (type: string, repo: string, label?: string) => {
    switch (type) {
      case 'stars':
        return `![Stars](https://img.shields.io/github/stars/${repo}?style=social)`;
      case 'version':
        return `![Version](https://img.shields.io/github/v/tag/${repo}?include_prereleases&sort=semver&label=${label || 'version'})`;
      case 'updated':
        return `![Updated](https://img.shields.io/github/last-commit/${repo}?label=${label || 'updated'})`;
      default:
        return '';
    }
  },
};

/**
 * Default template partials
 */
export const DEFAULT_PARTIALS = {
  header: `# {{title}}

{{#each badges}}
{{this}}
{{/each}}`,

  summary: `## 📊 Executive Summary

- **Benchmark Date:** {{metadata.date}}
- **Test Environment:** {{metadata.environment}}
- **Key Findings:**
  - {{analysis.best}} achieves best overall performance 🏆
  - Performance varies by up to {{formatNumber analysis.ratio 1}}x between managers
  - {{analysis.improvements}} improvements and {{analysis.regressions}} regressions detected`,

  rankings: `## 🏆 Performance Rankings

### Load Time (25 plugins)
{{#with rankings.loadTime}}
| Rank | Plugin Manager | Time | vs Best |
| ---- | -------------- | ---- | ------- |
{{#each this}}
| {{medal rank}} | {{manager}} | {{formatTime value}} | {{#if @first}}-{{else}}+{{formatPercent (subtract value ../0.value)}}{{/if}} |
{{/each}}
{{/with}}`,

  methodology: `## 📝 Methodology

- **Tool:** hyperfine (statistical benchmarking tool)
- **Iterations:** 10 runs per test
- **Plugin Sets:** 0 and 25 plugins
- **Metrics:** Installation time, startup time, interactive latencies
- **Environment:** Clean installation for each test`,
};

/**
 * Template engine class
 */
export class TemplateEngine {
  private helpers: TemplateHelpers;
  private partials: Record<string, string>;
  private strict: boolean;

  constructor(options: Partial<TemplateOptions> = {}) {
    this.helpers = { ...DEFAULT_HELPERS, ...options.helpers };
    this.partials = { ...DEFAULT_PARTIALS, ...options.partials };
    this.strict = options.strict ?? false;
  }

  /**
   * Render template with context
   */
  render(template: string, context: TemplateContext): string {
    // Process includes first
    template = this.processIncludes(template);
    
    // Process conditionals
    template = this.processConditionals(template, context);
    
    // Process loops
    template = this.processLoops(template, context);
    
    // Process variables and helpers
    template = this.processExpressions(template, context);
    
    return template;
  }

  /**
   * Process include directives
   */
  private processIncludes(template: string): string {
    const includeRegex = /\{\{>\s*(\w+)\s*\}\}/g;
    
    return template.replace(includeRegex, (match, partialName) => {
      const partial = this.partials[partialName];
      if (!partial && this.strict) {
        throw new Error(`Partial not found: ${partialName}`);
      }
      return partial || match;
    });
  }

  /**
   * Process conditional blocks
   */
  private processConditionals(template: string, context: TemplateContext): string {
    // Process if blocks
    const ifRegex = /\{\{#if\s+(.+?)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g;
    
    template = template.replace(ifRegex, (match, condition, truthyBlock, falsyBlock = '') => {
      const result = this.evaluateExpression(condition, context);
      return result ? this.render(truthyBlock, context) : this.render(falsyBlock, context);
    });
    
    // Process unless blocks
    const unlessRegex = /\{\{#unless\s+(.+?)\}\}([\s\S]*?)\{\{\/unless\}\}/g;
    
    template = template.replace(unlessRegex, (match, condition, block) => {
      const result = this.evaluateExpression(condition, context);
      return !result ? this.render(block, context) : '';
    });
    
    return template;
  }

  /**
   * Process loop blocks
   */
  private processLoops(template: string, context: TemplateContext): string {
    const eachRegex = /\{\{#each\s+(.+?)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    
    return template.replace(eachRegex, (match, collection, block) => {
      const items = this.evaluateExpression(collection, context);
      
      if (!Array.isArray(items)) {
        if (this.strict) {
          throw new Error(`Expected array for #each, got ${typeof items}`);
        }
        return '';
      }
      
      return items.map((item, index) => {
        const itemContext = {
          ...context,
          this: item,
          '@index': index,
          '@first': index === 0,
          '@last': index === items.length - 1,
        };
        
        return this.render(block, itemContext);
      }).join('');
    });
  }

  /**
   * Process expressions (variables and helpers)
   */
  private processExpressions(template: string, context: TemplateContext): string {
    const expressionRegex = /\{\{(.+?)\}\}/g;
    
    return template.replace(expressionRegex, (match, expression) => {
      const trimmed = expression.trim();
      
      // Skip already processed directives
      if (trimmed.startsWith('#') || trimmed.startsWith('/') || trimmed.startsWith('>')) {
        return match;
      }
      
      // Handle triple braces for unescaped content
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const innerExpression = trimmed.slice(1, -1).trim();
        return String(this.evaluateExpression(innerExpression, context));
      }
      
      // Regular expression
      const result = this.evaluateExpression(trimmed, context);
      return this.escapeHtml(String(result));
    });
  }

  /**
   * Evaluate an expression in context
   */
  private evaluateExpression(expression: string, context: any): any {
    const parts = expression.split(/\s+/);
    const first = parts[0];
    
    // Check if it's a helper call
    if (this.helpers[first] && parts.length > 1) {
      const args = parts.slice(1).map(arg => this.resolveValue(arg, context));
      return this.helpers[first](...args);
    }
    
    // Otherwise resolve as a value
    return this.resolveValue(expression, context);
  }

  /**
   * Resolve a value from context
   */
  private resolveValue(path: string, context: any): any {
    // Handle literals
    if (path.startsWith('"') && path.endsWith('"')) {
      return path.slice(1, -1);
    }
    if (path.startsWith("'") && path.endsWith("'")) {
      return path.slice(1, -1);
    }
    if (!isNaN(Number(path))) {
      return Number(path);
    }
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    
    // Handle context paths
    const parts = path.split('.');
    let value = context;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else if (this.strict) {
        throw new Error(`Property not found: ${path}`);
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Escape HTML characters
   */
  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Add a helper function
   */
  addHelper(name: string, fn: (...args: any[]) => string): void {
    this.helpers[name] = fn;
  }

  /**
   * Add a partial template
   */
  addPartial(name: string, template: string): void {
    this.partials[name] = template;
  }
}

/**
 * Create context from benchmark data
 */
export function createTemplateContext(
  data: BenchmarkData,
  history?: HistoryEntry[]
): TemplateContext {
  // Calculate rankings
  const results25 = data.results.filter(r => r.pluginCount === 25);
  
  const loadTimeRanking = results25
    .filter(r => r.loadTime !== null)
    .map(r => ({ manager: r.manager, value: r.loadTime! }))
    .sort((a, b) => a.value - b.value)
    .map((r, i) => ({ ...r, rank: i + 1 }));
  
  const installTimeRanking = results25
    .filter(r => r.installTime !== null)
    .map(r => ({ manager: r.manager, value: r.installTime! }))
    .sort((a, b) => a.value - b.value)
    .map((r, i) => ({ ...r, rank: i + 1 }));
  
  const overallScores = results25.map(r => ({
    manager: r.manager,
    score: calculateWeightedScore(r).normalized,
  }))
  .sort((a, b) => b.score - a.score)
  .map((r, i) => ({ ...r, rank: i + 1 }));
  
  // Analysis
  const best = loadTimeRanking[0]?.manager || 'N/A';
  const worst = loadTimeRanking[loadTimeRanking.length - 1]?.manager || 'N/A';
  const ratio = loadTimeRanking.length > 1
    ? loadTimeRanking[loadTimeRanking.length - 1].value / loadTimeRanking[0].value
    : 1;
  
  // Count improvements/regressions if history available
  let improvements = 0;
  let regressions = 0;
  
  if (history && history.length > 0) {
    const previousEntry = history[history.length - 1];
    data.results.forEach(current => {
      const previous = previousEntry.results.find(r => 
        r.manager === current.manager && r.pluginCount === current.pluginCount
      );
      
      if (previous && current.loadTime !== null && previous.loadTime !== null) {
        const change = (current.loadTime - previous.loadTime) / previous.loadTime;
        if (change < -0.05) improvements++;
        else if (change > 0.05) regressions++;
      }
    });
  }
  
  return {
    data,
    history,
    metadata: {
      date: new Date(data.timestamp).toLocaleDateString(),
      timestamp: data.timestamp,
      environment: `${data.environment.os} ${data.environment.version}`,
    },
    rankings: {
      loadTime: loadTimeRanking,
      installTime: installTimeRanking,
      overall: overallScores,
    },
    analysis: {
      best,
      worst,
      ratio,
      improvements,
      regressions,
    },
    helpers: DEFAULT_HELPERS,
  };
}

/**
 * Load template from file
 */
export async function loadTemplate(path: string): Promise<string> {
  return await Deno.readTextFile(path);
}

/**
 * Render template file
 */
export async function renderTemplateFile(
  templatePath: string,
  context: TemplateContext,
  options?: Partial<TemplateOptions>
): Promise<string> {
  const template = await loadTemplate(templatePath);
  const engine = new TemplateEngine(options);
  return engine.render(template, context);
}