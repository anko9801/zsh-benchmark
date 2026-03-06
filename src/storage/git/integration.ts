/**
 * Git integration for benchmark results
 * Handles auto-commits, PR creation, and regression detection
 */

import { BenchmarkData } from "../../core/types.ts";
import { VersionComparison } from "../history/storage.ts";

export interface GitConfig {
  autoCommit: boolean;
  commitPrefix: string;
  branch: string;
  remote: string;
  prLabels: string[];
  regressionThreshold: number; // percentage
}

export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: Date;
  files: string[];
}

export interface PRInfo {
  number: number;
  url: string;
  title: string;
  body: string;
  labels: string[];
}

const DEFAULT_CONFIG: GitConfig = {
  autoCommit: true,
  commitPrefix: "benchmark:",
  branch: "benchmark-results",
  remote: "origin",
  prLabels: ["benchmark", "automated"],
  regressionThreshold: 5, // 5% regression triggers alert
};

export class GitIntegration {
  private config: GitConfig;

  constructor(config: Partial<GitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Commit benchmark results
   */
  async commitResults(
    data: BenchmarkData,
    files: string[],
    customMessage?: string
  ): Promise<CommitInfo> {
    // Check if we're in a git repository
    if (!await this.isGitRepo()) {
      throw new Error("Not in a git repository");
    }

    // Create branch if needed
    const currentBranch = await this.getCurrentBranch();
    if (currentBranch !== this.config.branch) {
      await this.createBranch(this.config.branch);
    }

    // Stage files
    for (const file of files) {
      await this.runGitCommand(["add", file]);
    }

    // Generate commit message
    const message = customMessage || this.generateCommitMessage(data);

    // Commit
    await this.runGitCommand(["commit", "-m", message]);

    // Get commit info
    const hash = await this.runGitCommand(["rev-parse", "HEAD"]);
    const author = await this.runGitCommand(["log", "-1", "--pretty=%an"]);
    const date = new Date(await this.runGitCommand(["log", "-1", "--pretty=%aI"]));

    return {
      hash: hash.trim(),
      message,
      author: author.trim(),
      date,
      files,
    };
  }

  /**
   * Create pull request for benchmark results
   */
  async createPR(
    comparison: VersionComparison,
    regressions: RegressionInfo[]
  ): Promise<PRInfo> {
    // Check if gh CLI is available
    if (!await this.hasGitHubCLI()) {
      throw new Error("GitHub CLI (gh) is required for PR creation");
    }

    // Push branch
    await this.pushBranch();

    // Generate PR content
    const title = this.generatePRTitle(regressions);
    const body = this.generatePRBody(comparison, regressions);

    // Create PR using gh CLI
    const prOutput = await this.runCommand("gh", [
      "pr", "create",
      "--title", title,
      "--body", body,
      "--label", ...this.config.prLabels,
    ]);

    // Parse PR info from output
    const prUrl = prOutput.trim();
    const prNumber = parseInt(prUrl.match(/\/(\d+)$/)?.[1] || "0");

    return {
      number: prNumber,
      url: prUrl,
      title,
      body,
      labels: this.config.prLabels,
    };
  }

  /**
   * Generate commit message
   */
  private generateCommitMessage(data: BenchmarkData): string {
    const managers = [...new Set(data.results.map(r => r.manager))];
    const pluginCounts = [...new Set(data.results.map(r => r.pluginCount))];
    
    let message = `${this.config.commitPrefix} Update benchmark results\n\n`;
    message += `Managers: ${managers.join(", ")}\n`;
    message += `Plugin counts: ${pluginCounts.join(", ")}\n`;
    
    // Add summary statistics
    const loadTimes = data.results
      .filter(r => r.pluginCount === 25 && r.loadTime !== null)
      .map(r => ({ manager: r.manager, time: r.loadTime! }))
      .sort((a, b) => a.time - b.time);
    
    if (loadTimes.length > 0) {
      message += `\nFastest (25 plugins): ${loadTimes[0].manager} (${loadTimes[0].time.toFixed(0)}ms)\n`;
      message += `Slowest (25 plugins): ${loadTimes[loadTimes.length - 1].manager} (${loadTimes[loadTimes.length - 1].time.toFixed(0)}ms)\n`;
    }
    
    return message;
  }

  /**
   * Generate PR title
   */
  private generatePRTitle(regressions: RegressionInfo[]): string {
    if (regressions.length === 0) {
      return "📊 Benchmark Results Update - No Regressions";
    }
    
    const significantRegressions = regressions.filter(r => r.significant);
    if (significantRegressions.length > 0) {
      return `⚠️ Benchmark Results - ${significantRegressions.length} Performance Regression${significantRegressions.length > 1 ? 's' : ''} Detected`;
    }
    
    return `📊 Benchmark Results Update - ${regressions.length} Minor Changes`;
  }

  /**
   * Generate PR body
   */
  private generatePRBody(
    comparison: VersionComparison,
    regressions: RegressionInfo[]
  ): string {
    let body = "## Benchmark Results Update\n\n";
    
    // Summary
    body += `### Summary\n`;
    body += `- **Regressions**: ${comparison.summary.regressions}\n`;
    body += `- **Improvements**: ${comparison.summary.improvements}\n`;
    body += `- **Unchanged**: ${comparison.summary.unchanged}\n\n`;
    
    // Regressions
    if (regressions.length > 0) {
      body += `### ⚠️ Performance Regressions\n\n`;
      body += `| Manager | Metric | Plugin Count | Old | New | Change |\n`;
      body += `|---------|--------|--------------|-----|-----|--------|\n`;
      
      for (const reg of regressions) {
        const emoji = reg.significant ? "🔴" : "🟡";
        body += `| ${reg.manager} | ${reg.metric} | ${reg.pluginCount} | ${reg.oldValue.toFixed(0)}ms | ${reg.newValue.toFixed(0)}ms | ${emoji} +${reg.percentChange.toFixed(1)}% |\n`;
      }
      body += "\n";
    }
    
    // Improvements
    const improvements = comparison.changes.filter(c => c.percentChange < -this.config.regressionThreshold);
    if (improvements.length > 0) {
      body += `### ✅ Performance Improvements\n\n`;
      body += `| Manager | Metric | Plugin Count | Old | New | Change |\n`;
      body += `|---------|--------|--------------|-----|-----|--------|\n`;
      
      for (const imp of improvements) {
        body += `| ${imp.manager} | ${imp.metric} | ${imp.pluginCount} | ${imp.oldValue.toFixed(0)}ms | ${imp.newValue.toFixed(0)}ms | 🟢 ${imp.percentChange.toFixed(1)}% |\n`;
      }
      body += "\n";
    }
    
    // Details
    body += `### Details\n\n`;
    body += `- Comparison: \`${comparison.id1.slice(0, 8)}\` → \`${comparison.id2.slice(0, 8)}\`\n`;
    body += `- Timestamps: ${new Date(comparison.timestamp1).toLocaleDateString()} → ${new Date(comparison.timestamp2).toLocaleDateString()}\n`;
    body += `- Threshold: ${this.config.regressionThreshold}%\n\n`;
    
    // Action items
    if (regressions.some(r => r.significant)) {
      body += `### Action Required\n\n`;
      body += `Significant performance regressions detected. Please:\n`;
      body += `1. Review the changes that may have caused these regressions\n`;
      body += `2. Run benchmarks locally to verify\n`;
      body += `3. Consider reverting or optimizing the problematic changes\n\n`;
    }
    
    // Footer
    body += `---\n`;
    body += `*Generated by zsh-benchmark automated testing*\n`;
    
    return body;
  }

  /**
   * Check if in git repository
   */
  private async isGitRepo(): Promise<boolean> {
    try {
      await this.runGitCommand(["rev-parse", "--git-dir"]);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current branch
   */
  private async getCurrentBranch(): Promise<string> {
    const branch = await this.runGitCommand(["rev-parse", "--abbrev-ref", "HEAD"]);
    return branch.trim();
  }

  /**
   * Create and checkout branch
   */
  private async createBranch(branch: string): Promise<void> {
    try {
      // Try to checkout existing branch
      await this.runGitCommand(["checkout", branch]);
    } catch {
      // Create new branch
      await this.runGitCommand(["checkout", "-b", branch]);
    }
  }

  /**
   * Push branch to remote
   */
  private async pushBranch(): Promise<void> {
    const branch = await this.getCurrentBranch();
    await this.runGitCommand(["push", "-u", this.config.remote, branch]);
  }

  /**
   * Check if GitHub CLI is available
   */
  private async hasGitHubCLI(): Promise<boolean> {
    try {
      await this.runCommand("gh", ["--version"]);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Run git command
   */
  private async runGitCommand(args: string[]): Promise<string> {
    return await this.runCommand("git", args);
  }

  /**
   * Run shell command
   */
  private async runCommand(command: string, args: string[]): Promise<string> {
    const proc = new Deno.Command(command, {
      args,
      stdout: "piped",
      stderr: "piped",
    });
    
    const { success, stdout, stderr } = await proc.output();
    
    if (!success) {
      const error = new TextDecoder().decode(stderr);
      throw new Error(`Command failed: ${command} ${args.join(" ")}\n${error}`);
    }
    
    return new TextDecoder().decode(stdout);
  }
}

export interface RegressionInfo {
  manager: string;
  metric: string;
  pluginCount: number;
  oldValue: number;
  newValue: number;
  percentChange: number;
  significant: boolean;
  pValue?: number;
}