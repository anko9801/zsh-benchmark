/**
 * Enhanced README generator with advanced visualizations and insights
 * Generates comprehensive benchmark reports with multiple sections
 */

import { BenchmarkData, BenchmarkResult } from "../../core/types.ts";
import { HistoryEntry } from "../../storage/history/schema.ts";
import { HistoryStorage } from "../../storage/history/storage.ts";
import { calculatePerceptualScore, formatPerceptualScore } from "../../engines/perceptual.ts";
import { calculateWeightedScore, formatWeightedScore, recommendWeights } from "../../engines/weighted.ts";
import { getBestForPattern, formatPatternScore, UsagePattern } from "../../engines/patterns.ts";
import { generatePerformanceTable, generatePatternTable, generateRankingsTable } from "../tables/ascii-tables.ts";
import { generatePerformanceDashboard } from "../tables/unicode-tables.ts";
import { generateLoadTimeChart, generateInteractiveMetricsChart, generatePerceptualScoreChart } from "../charts/svg-generator.ts";
import { generatePerformanceHeatmap, generatePerceptualHeatmap, generatePatternHeatmap } from "../charts/heatmap.ts";
import { generateMetricTimeSeries, generateScoreEvolution } from "../charts/time-series.ts";
import { PLUGIN_MANAGERS } from "../plugin-managers.ts";

export interface EnhancedReadmeOptions {
  inputFile: string;
  outputFile: string;
  historyDir?: string;
  language: 'en' | 'ja';
  theme: 'default' | 'minimal' | 'comprehensive';
  format: 'markdown' | 'html';
  sections?: string[];
  includeCharts: boolean;
  includeHistory: boolean;
  includeRecommendations: boolean;
  includeInteractive: boolean;
  debug: boolean;
}

export interface ReadmeSection {
  id: string;
  title: string;
  content: string;
  priority: number;
}

const DEFAULT_OPTIONS: EnhancedReadmeOptions = {
  inputFile: 'results/benchmark-results-latest.json',
  outputFile: 'README.md',
  historyDir: 'results/history',
  language: 'en',
  theme: 'default',
  format: 'markdown',
  includeCharts: true,
  includeHistory: true,
  includeRecommendations: true,
  includeInteractive: true,
  debug: false,
};

/**
 * Generate enhanced README
 */
export async function generateEnhancedReadme(
  options: Partial<EnhancedReadmeOptions> = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Load benchmark data
  const data = await loadBenchmarkData(opts.inputFile);
  
  // Load history if requested
  let history: HistoryEntry[] = [];
  if (opts.includeHistory && opts.historyDir) {
    const storage = new HistoryStorage(opts.historyDir);
    history = await storage.list();
  }
  
  // Generate sections
  const sections = await generateSections(data, history, opts);
  
  // Filter sections if specific ones requested
  const finalSections = opts.sections
    ? sections.filter(s => opts.sections!.includes(s.id))
    : sections;
  
  // Sort by priority
  finalSections.sort((a, b) => a.priority - b.priority);
  
  // Build README
  return buildReadme(finalSections, opts);
}

/**
 * Load benchmark data
 */
async function loadBenchmarkData(inputFile: string): Promise<BenchmarkData> {
  const content = await Deno.readTextFile(inputFile);
  return JSON.parse(content);
}

/**
 * Generate all sections
 */
async function generateSections(
  data: BenchmarkData,
  history: HistoryEntry[],
  opts: EnhancedReadmeOptions
): Promise<ReadmeSection[]> {
  const sections: ReadmeSection[] = [];
  
  // Header section
  sections.push(await generateHeaderSection(data, opts));
  
  // Executive summary
  sections.push(await generateSummarySection(data, opts));
  
  // Performance rankings
  sections.push(await generateRankingsSection(data, opts));
  
  // Interactive metrics
  if (opts.includeInteractive) {
    sections.push(await generateInteractiveSection(data, opts));
  }
  
  // Usage pattern analysis
  sections.push(await generatePatternAnalysisSection(data, opts));
  
  // Visual charts
  if (opts.includeCharts) {
    sections.push(await generateChartsSection(data, opts));
  }
  
  // Historical trends
  if (opts.includeHistory && history.length > 0) {
    sections.push(await generateHistorySection(data, history, opts));
  }
  
  // Recommendations
  if (opts.includeRecommendations) {
    sections.push(await generateRecommendationsSection(data, opts));
  }
  
  // Technical details
  sections.push(await generateTechnicalSection(data, opts));
  
  // Methodology
  sections.push(await generateMethodologySection(opts));
  
  // Contributing
  sections.push(await generateContributingSection(opts));
  
  // Footer
  sections.push(await generateFooterSection(data, opts));
  
  return sections;
}

// Section generators

async function generateHeaderSection(data: BenchmarkData, opts: EnhancedReadmeOptions): Promise<ReadmeSection> {
  const title = opts.language === 'ja' 
    ? '# Zsh プラグインマネージャー ベンチマーク結果'
    : '# Zsh Plugin Manager Benchmark Results';
  
  const badges = [
    '![License](https://img.shields.io/badge/license-MIT-blue)',
    '![Benchmark Status](https://img.shields.io/badge/benchmark%20status-automated-brightgreen)',
    `![Last Updated](https://img.shields.io/badge/last%20updated-${new Date().toISOString().split('T')[0]}-blue)`,
    '![Zsh Version](https://img.shields.io/badge/zsh-5.9-orange)',
  ];
  
  return {
    id: 'header',
    title: 'Header',
    content: [title, '', ...badges].join('\n'),
    priority: 0,
  };
}

async function generateSummarySection(data: BenchmarkData, opts: EnhancedReadmeOptions): Promise<ReadmeSection> {
  const results25 = data.results.filter(r => r.pluginCount === 25);
  const loadTimes = results25.map(r => r.loadTime).filter(t => t !== null) as number[];
  const bestLoadTime = Math.min(...loadTimes);
  const worstLoadTime = Math.max(...loadTimes);
  const bestManager = results25.find(r => r.loadTime === bestLoadTime)?.manager;
  const ratio = worstLoadTime / bestLoadTime;
  
  // Calculate overall winner
  const overallScores = results25.map(r => ({
    manager: r.manager,
    score: calculateWeightedScore(r).normalized,
  })).sort((a, b) => b.score - a.score);
  
  const content = opts.language === 'ja' ? `
## 📊 エグゼクティブサマリー

- **ベンチマーク日:** ${new Date(data.timestamp).toLocaleDateString()}
- **テスト環境:** ${data.environment.os} ${data.environment.version}
- **主な発見:**
  - ${overallScores[0].manager} が総合パフォーマンスで最高評価 🏆
  - 25プラグイン環境では ${bestManager} が最速 (${bestLoadTime.toFixed(0)}ms)
  - パフォーマンス差は最大 ${ratio.toFixed(1)}倍
  - ${results25.filter(r => r.commandLag !== null).length} 個のマネージャーでインタラクティブメトリクスを測定
` : `
## 📊 Executive Summary

- **Benchmark Date:** ${new Date(data.timestamp).toLocaleDateString()}
- **Test Environment:** ${data.environment.os} ${data.environment.version}
- **Key Findings:**
  - ${overallScores[0].manager} achieves best overall performance 🏆
  - ${bestManager} is fastest with 25 plugins (${bestLoadTime.toFixed(0)}ms)
  - Performance varies by up to ${ratio.toFixed(1)}x between managers
  - Interactive metrics measured for ${results25.filter(r => r.commandLag !== null).length} managers
`;
  
  return {
    id: 'summary',
    title: 'Executive Summary',
    content,
    priority: 1,
  };
}

async function generateRankingsSection(data: BenchmarkData, opts: EnhancedReadmeOptions): Promise<ReadmeSection> {
  const title = opts.language === 'ja' ? '## 🏆 パフォーマンスランキング' : '## 🏆 Performance Rankings';
  
  // Generate tables for different plugin counts
  const pluginCounts = [...new Set(data.results.map(r => r.pluginCount))].sort((a, b) => a - b);
  const mainCount = 25;
  
  // Load time table
  const loadTimeTable = generatePerformanceTable(data, mainCount, {
    format: 'markdown',
    showPerceptual: true,
    showRankings: true,
    sortBy: 'performance',
  });
  
  // Pattern suitability table
  const patternTable = generatePatternTable(data, mainCount, {
    format: 'markdown',
  });
  
  const content = [
    title,
    '',
    opts.language === 'ja' ? '### ⚡ ロード時間 (25 プラグイン)' : '### ⚡ Load Time Rankings (25 plugins)',
    '',
    loadTimeTable.table,
    '',
    opts.language === 'ja' ? '### 🎯 使用パターン適合性' : '### 🎯 Usage Pattern Suitability',
    '',
    patternTable.table,
  ].join('\n');
  
  return {
    id: 'rankings',
    title: 'Performance Rankings',
    content,
    priority: 2,
  };
}

async function generateInteractiveSection(data: BenchmarkData, opts: EnhancedReadmeOptions): Promise<ReadmeSection> {
  const title = opts.language === 'ja' 
    ? '## ⚡ インタラクティブレイテンシー'
    : '## ⚡ Interactive Latencies';
  
  const results = data.results.filter(r => 
    r.pluginCount === 25 && 
    (r.firstPromptLag !== null || r.commandLag !== null)
  );
  
  if (results.length === 0) {
    return {
      id: 'interactive',
      title: 'Interactive Metrics',
      content: `${title}\n\n_No interactive metrics available in this benchmark run._`,
      priority: 3,
    };
  }
  
  // Build interactive metrics table
  const headers = opts.language === 'ja'
    ? ['プラグインマネージャー', '初回プロンプト', '初回コマンド', 'コマンド遅延', '入力遅延', '評価']
    : ['Plugin Manager', 'First Prompt', 'First Command', 'Command Lag', 'Input Lag', 'Rating'];
  
  const rows = results.map(r => {
    const perceptual = calculatePerceptualScore(r);
    return [
      r.manager,
      formatMetric(r.firstPromptLag),
      formatMetric(r.firstCommandLag),
      formatMetric(r.commandLag),
      formatMetric(r.inputLag),
      perceptual.overall,
    ];
  });
  
  const table = [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(row => `| ${row.join(' | ')} |`),
  ].join('\n');
  
  const explanation = opts.language === 'ja' ? `
_評価基準:_
- **imperceptible**: 人間が知覚できないレベル（優秀）
- **good**: 良好なパフォーマンス
- **acceptable**: 許容範囲内
- **slow**: 遅延を感じる
- **unusable**: 使用に支障があるレベル

_測定方法は [romkatv/zsh-bench](https://github.com/romkatv/zsh-bench) に基づく_
` : `
_Rating Scale:_
- **imperceptible**: Below human perception threshold (excellent)
- **good**: Good performance
- **acceptable**: Within acceptable range
- **slow**: Noticeable delays
- **unusable**: Significantly impacts usability

_Methodology based on [romkatv/zsh-bench](https://github.com/romkatv/zsh-bench)_
`;
  
  return {
    id: 'interactive',
    title: 'Interactive Metrics',
    content: [title, '', table, '', explanation].join('\n'),
    priority: 3,
  };
}

async function generatePatternAnalysisSection(data: BenchmarkData, opts: EnhancedReadmeOptions): Promise<ReadmeSection> {
  const title = opts.language === 'ja' 
    ? '## 💡 使用パターン別推奨'
    : '## 💡 Recommendations by Use Case';
  
  const patterns: Array<{ pattern: UsagePattern; name: string; description: string }> = [
    { 
      pattern: 'minimal', 
      name: opts.language === 'ja' ? 'ミニマリスト' : 'Minimalist',
      description: opts.language === 'ja' 
        ? '最小限のプラグインで高速起動を重視'
        : 'Few plugins, fast startup priority'
    },
    {
      pattern: 'developer',
      name: opts.language === 'ja' ? '開発者' : 'Developer',
      description: opts.language === 'ja'
        ? 'アクティブな開発作業、コマンド実行頻度が高い'
        : 'Active development, frequent command execution'
    },
    {
      pattern: 'power-user',
      name: opts.language === 'ja' ? 'パワーユーザー' : 'Power User',
      description: opts.language === 'ja'
        ? '多数のプラグイン、高度なカスタマイズ'
        : 'Many plugins, heavy customization'
    },
    {
      pattern: 'server',
      name: opts.language === 'ja' ? 'サーバー/SSH' : 'Server/SSH',
      description: opts.language === 'ja'
        ? 'リモート接続での使用'
        : 'Remote/SSH usage'
    },
  ];
  
  const recommendations = patterns.map(({ pattern, name, description }) => {
    const best = getBestForPattern(data.results, pattern);
    if (!best) return '';
    
    const score = formatPatternScore(best.score);
    const alternatives = best.alternatives
      .slice(0, 2)
      .map(alt => `${alt.result.manager} (${alt.score.suitability})`)
      .join(', ');
    
    return `
### ${name}
_${description}_

**${opts.language === 'ja' ? '推奨' : 'Recommended'}:** ${best.best.manager} (${best.score.suitability})
${alternatives ? `**${opts.language === 'ja' ? '代替案' : 'Alternatives'}:** ${alternatives}` : ''}

<details>
<summary>${opts.language === 'ja' ? '詳細分析' : 'Detailed Analysis'}</summary>

${score}

</details>
`;
  }).filter(r => r !== '');
  
  return {
    id: 'patterns',
    title: 'Pattern Analysis',
    content: [title, '', ...recommendations].join('\n'),
    priority: 4,
  };
}

async function generateChartsSection(data: BenchmarkData, opts: EnhancedReadmeOptions): Promise<ReadmeSection> {
  const title = opts.language === 'ja' ? '## 📈 ビジュアル分析' : '## 📈 Visual Analysis';
  
  // Generate charts
  const loadTimeChart = generateLoadTimeChart(data);
  const interactiveChart = generateInteractiveMetricsChart(data, 25);
  const perceptualChart = generatePerceptualScoreChart(data, 25);
  const heatmap = generatePerformanceHeatmap(data, 25);
  
  // Save charts
  const chartsDir = 'results/charts';
  await Deno.mkdir(chartsDir, { recursive: true });
  
  await Deno.writeTextFile(`${chartsDir}/load-time.svg`, loadTimeChart.svg);
  await Deno.writeTextFile(`${chartsDir}/interactive.svg`, interactiveChart.svg);
  await Deno.writeTextFile(`${chartsDir}/perceptual.svg`, perceptualChart.svg);
  await Deno.writeTextFile(`${chartsDir}/heatmap.svg`, heatmap.svg);
  
  const content = `
${title}

### ${opts.language === 'ja' ? 'ロード時間の推移' : 'Load Time Progression'}
![Load Time Chart](results/charts/load-time.svg)

### ${opts.language === 'ja' ? 'インタラクティブメトリクス' : 'Interactive Metrics'}
![Interactive Metrics](results/charts/interactive.svg)

### ${opts.language === 'ja' ? '知覚パフォーマンス' : 'Perceptual Performance'}
![Perceptual Score](results/charts/perceptual.svg)

### ${opts.language === 'ja' ? 'パフォーマンスヒートマップ' : 'Performance Heatmap'}
![Performance Heatmap](results/charts/heatmap.svg)
`;
  
  return {
    id: 'charts',
    title: 'Visual Analysis',
    content,
    priority: 5,
  };
}

async function generateHistorySection(
  data: BenchmarkData,
  history: HistoryEntry[],
  opts: EnhancedReadmeOptions
): Promise<ReadmeSection> {
  const title = opts.language === 'ja' ? '## 📊 履歴トレンド' : '## 📊 Historical Trends';
  
  if (history.length < 3) {
    return {
      id: 'history',
      title: 'Historical Trends',
      content: `${title}\n\n_Not enough historical data for trend analysis (need at least 3 data points)._`,
      priority: 6,
    };
  }
  
  // Generate time series charts
  const loadTimeSeries = generateMetricTimeSeries(history, 'loadTime');
  const scoreEvolution = generateScoreEvolution(history, 'weighted');
  
  // Save charts
  const chartsDir = 'results/charts';
  await Deno.writeTextFile(`${chartsDir}/load-time-series.svg`, loadTimeSeries.svg);
  await Deno.writeTextFile(`${chartsDir}/score-evolution.svg`, scoreEvolution.svg);
  
  // Analyze trends
  const trendSummary = loadTimeSeries.trends
    .filter(t => t.trend !== 'stable')
    .map(t => `- ${t.manager}: ${t.trend === 'improving' ? '📈' : '📉'} ${t.changePercent.toFixed(1)}% ${t.trend}`)
    .join('\n');
  
  const content = `
${title}

### ${opts.language === 'ja' ? 'ロード時間の変化' : 'Load Time Evolution'}
![Load Time Series](results/charts/load-time-series.svg)

### ${opts.language === 'ja' ? 'スコアの推移' : 'Score Evolution'}
![Score Evolution](results/charts/score-evolution.svg)

${trendSummary ? `### ${opts.language === 'ja' ? 'トレンド' : 'Trends'}\n${trendSummary}` : ''}
`;
  
  return {
    id: 'history',
    title: 'Historical Trends',
    content,
    priority: 6,
  };
}

async function generateRecommendationsSection(data: BenchmarkData, opts: EnhancedReadmeOptions): Promise<ReadmeSection> {
  const title = opts.language === 'ja' ? '## 🎯 推奨事項' : '## 🎯 Recommendations';
  
  // Analyze user scenarios
  const scenarios = [
    {
      condition: 'shellRestarts === "frequent"',
      title: opts.language === 'ja' ? '頻繁にシェルを再起動する場合' : 'Frequent Shell Restarts',
      recommendation: recommendForFrequentRestarts(data, opts),
    },
    {
      condition: 'interactiveUse === "heavy"',
      title: opts.language === 'ja' ? 'インタラクティブな使用が多い場合' : 'Heavy Interactive Use',
      recommendation: recommendForInteractive(data, opts),
    },
    {
      condition: 'pluginCount === "many"',
      title: opts.language === 'ja' ? '多数のプラグインを使用する場合' : 'Many Plugins',
      recommendation: recommendForManyPlugins(data, opts),
    },
  ];
  
  const content = [
    title,
    '',
    ...scenarios.map(s => `### ${s.title}\n\n${s.recommendation}`),
  ].join('\n\n');
  
  return {
    id: 'recommendations',
    title: 'Recommendations',
    content,
    priority: 7,
  };
}

async function generateTechnicalSection(data: BenchmarkData, opts: EnhancedReadmeOptions): Promise<ReadmeSection> {
  const title = opts.language === 'ja' ? '## 🔧 技術詳細' : '## 🔧 Technical Details';
  
  // Plugin manager details
  const managerDetails = Object.entries(PLUGIN_MANAGERS).map(([name, pm]) => 
    `| ${name} | ![Stars](https://img.shields.io/github/stars/${pm.repo}) | ![Version](https://img.shields.io/github/v/tag/${pm.repo}?include_prereleases&sort=semver) | ![Updated](https://img.shields.io/github/last-commit/${pm.repo}) |`
  );
  
  const content = `
${title}

### ${opts.language === 'ja' ? 'プラグインマネージャー' : 'Plugin Managers'}

| Manager | Stars | Version | Last Updated |
| ------- | ----- | ------- | ------------ |
${managerDetails.join('\n')}

### ${opts.language === 'ja' ? 'テスト環境' : 'Test Environment'}

- **OS:** ${data.environment.os} ${data.environment.version}
- **Shell:** ${data.environment.shell || 'zsh 5.9'}
- **CPU:** ${data.environment.cpuModel || 'GitHub Actions Runner'}
- **Test Date:** ${new Date(data.timestamp).toISOString()}
`;
  
  return {
    id: 'technical',
    title: 'Technical Details',
    content,
    priority: 8,
  };
}

async function generateMethodologySection(opts: EnhancedReadmeOptions): Promise<ReadmeSection> {
  const title = opts.language === 'ja' ? '## 📝 測定方法' : '## 📝 Methodology';
  
  const content = opts.language === 'ja' ? `
${title}

### ベンチマーク手法

1. **ツール:** hyperfine (統計的ベンチマークツール)
2. **反復回数:** 各テスト10回実行
3. **プラグインセット:** 0個（ベースライン）と25個（一般的な設定）
4. **測定項目:**
   - インストール時間
   - シェル起動時間
   - インタラクティブレイテンシー（実験的）
5. **環境:** 各テストでクリーンインストール

### インタラクティブメトリクス

[romkatv/zsh-bench](https://github.com/romkatv/zsh-bench)の手法に基づく:

- **First Prompt Lag:** シェル起動から最初のプロンプト表示まで
- **First Command Lag:** シェル起動から最初のコマンド実行可能まで
- **Command Lag:** Enterキー押下から次のプロンプト表示まで
- **Input Lag:** キー入力から画面表示まで
` : `
${title}

### Benchmarking Approach

1. **Tool:** hyperfine (statistical benchmarking tool)
2. **Iterations:** 10 runs per test
3. **Plugin Sets:** 0 plugins (baseline) and 25 plugins (typical setup)
4. **Metrics:**
   - Installation time
   - Shell startup time
   - Interactive latencies (experimental)
5. **Environment:** Clean installation for each test

### Interactive Metrics

Based on [romkatv/zsh-bench](https://github.com/romkatv/zsh-bench) methodology:

- **First Prompt Lag:** Time from shell start to first prompt display
- **First Command Lag:** Time from shell start to first command readiness
- **Command Lag:** Time from Enter key to next prompt
- **Input Lag:** Time from key press to screen update
`;
  
  return {
    id: 'methodology',
    title: 'Methodology',
    content,
    priority: 9,
  };
}

async function generateContributingSection(opts: EnhancedReadmeOptions): Promise<ReadmeSection> {
  const title = opts.language === 'ja' ? '## 🤝 貢献' : '## 🤝 Contributing';
  
  const content = opts.language === 'ja' ? `
${title}

問題を見つけた場合や、新しいプラグインマネージャーを追加したい場合は、Issueまたはプルリクエストを作成してください！

### 貢献方法

1. このリポジトリをフォーク
2. 新しいブランチを作成 (\`git checkout -b feature/amazing-feature\`)
3. 変更をコミット (\`git commit -m 'Add amazing feature'\`)
4. ブランチにプッシュ (\`git push origin feature/amazing-feature\`)
5. プルリクエストを作成

### プラグインマネージャーの追加

新しいプラグインマネージャーを追加するには:

1. \`src/plugin-managers.ts\` に設定を追加
2. 必要に応じてDockerfileを更新
3. テストを実行して動作確認
` : `
${title}

Found an issue or want to add your plugin manager? Please open an issue or PR!

### How to Contribute

1. Fork this repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

### Adding a Plugin Manager

To add a new plugin manager:

1. Add configuration to \`src/plugin-managers.ts\`
2. Update Dockerfile if needed
3. Run tests to verify functionality
`;
  
  return {
    id: 'contributing',
    title: 'Contributing',
    content,
    priority: 10,
  };
}

async function generateFooterSection(data: BenchmarkData, opts: EnhancedReadmeOptions): Promise<ReadmeSection> {
  const content = `
---

_Generated by [zsh-benchmark](https://github.com/amaiya/zsh-benchmark) on ${new Date(data.timestamp).toISOString()}_
`;
  
  return {
    id: 'footer',
    title: 'Footer',
    content,
    priority: 99,
  };
}

// Helper functions

function formatMetric(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(1)}ms`;
}

function recommendForFrequentRestarts(data: BenchmarkData, opts: EnhancedReadmeOptions): string {
  const results = data.results.filter(r => r.pluginCount === 25);
  const sorted = results.sort((a, b) => (a.loadTime || Infinity) - (b.loadTime || Infinity));
  const top3 = sorted.slice(0, 3);
  
  return opts.language === 'ja' 
    ? `高速起動が重要な場合:\n\n${top3.map((r, i) => `${i + 1}. **${r.manager}** - ${r.loadTime}ms`).join('\n')}`
    : `For fast startup times:\n\n${top3.map((r, i) => `${i + 1}. **${r.manager}** - ${r.loadTime}ms`).join('\n')}`;
}

function recommendForInteractive(data: BenchmarkData, opts: EnhancedReadmeOptions): string {
  const results = data.results.filter(r => r.pluginCount === 25 && r.commandLag !== null);
  const sorted = results.sort((a, b) => (a.commandLag || Infinity) - (b.commandLag || Infinity));
  const top3 = sorted.slice(0, 3);
  
  return opts.language === 'ja'
    ? `レスポンシブな操作感を求める場合:\n\n${top3.map((r, i) => `${i + 1}. **${r.manager}** - コマンド遅延 ${r.commandLag}ms`).join('\n')}`
    : `For responsive interaction:\n\n${top3.map((r, i) => `${i + 1}. **${r.manager}** - command lag ${r.commandLag}ms`).join('\n')}`;
}

function recommendForManyPlugins(data: BenchmarkData, opts: EnhancedReadmeOptions): string {
  // Find managers that scale well
  const scalability = new Map<string, number>();
  
  data.results.forEach(r => {
    if (r.loadTime !== null) {
      const existing = scalability.get(r.manager) || 0;
      scalability.set(r.manager, existing + r.loadTime / r.pluginCount);
    }
  });
  
  const sorted = Array.from(scalability.entries())
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3);
  
  return opts.language === 'ja'
    ? `多数のプラグインでも良好なスケーラビリティ:\n\n${sorted.map((r, i) => `${i + 1}. **${r[0]}**`).join('\n')}`
    : `Good scalability with many plugins:\n\n${sorted.map((r, i) => `${i + 1}. **${r[0]}**`).join('\n')}`;
}

function buildReadme(sections: ReadmeSection[], opts: EnhancedReadmeOptions): string {
  if (opts.format === 'html') {
    return buildHTMLReadme(sections, opts);
  }
  
  return sections.map(s => s.content).join('\n\n');
}

function buildHTMLReadme(sections: ReadmeSection[], opts: EnhancedReadmeOptions): string {
  const html = `
<!DOCTYPE html>
<html lang="${opts.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zsh Plugin Manager Benchmark Results</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      margin-top: 2em;
      margin-bottom: 0.5em;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    code {
      background-color: #f5f5f5;
      padding: 2px 4px;
      border-radius: 3px;
    }
    pre {
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 5px;
      overflow-x: auto;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    details {
      margin: 1em 0;
      padding: 10px;
      background-color: #f9f9f9;
      border-radius: 5px;
    }
    summary {
      cursor: pointer;
      font-weight: bold;
    }
  </style>
</head>
<body>
  ${sections.map(s => markdownToHTML(s.content)).join('\n')}
</body>
</html>
  `;
  
  return html;
}

function markdownToHTML(markdown: string): string {
  // Simple markdown to HTML conversion
  return markdown
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

/**
 * Export enhanced README generator
 */
export async function exportEnhancedReadme(
  outputPath: string,
  options: Partial<EnhancedReadmeOptions> = {}
): Promise<void> {
  const readme = await generateEnhancedReadme(options);
  await Deno.writeTextFile(outputPath, readme);
}