// GitHub API integration for fetching repository information

import { GitHubInfo } from "./types.ts";
import { createError, ErrorCode } from "./errors.ts";

// GitHub API types
interface GitHubRepoInfo {
  stargazers_count: number;
  // Add other fields as needed
}

interface GitHubRelease {
  tag_name: string;
  published_at: string;
  // Add other fields as needed
}

export class GitHubAPI {
  private repoMapping: Map<string, string>;
  private cache: Map<string, { data: GitHubInfo; timestamp: number }> =
    new Map();
  private cacheTimeout = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.repoMapping = this.loadRepoMapping();
  }

  async fetchManagerInfo(managerName: string): Promise<GitHubInfo> {
    // Check cache first
    const cached = this.cache.get(managerName);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const repo = this.repoMapping.get(managerName);
    if (!repo) {
      throw createError(ErrorCode.GITHUB_API_ERROR, {
        reason: `No repository mapping found for ${managerName}`,
      });
    }

    try {
      // Fetch repository info
      const repoInfo = await this.fetchRepoInfo(repo);

      // Fetch latest release
      const latestRelease = await this.fetchLatestRelease(repo);

      const info: GitHubInfo = {
        stars: repoInfo.stargazers_count,
        version: latestRelease?.tag_name || "N/A",
        lastRelease: latestRelease?.published_at
          ? new Date(latestRelease.published_at).toISOString().split("T")[0]
          : undefined,
        badge: {
          stars: this.generateBadgeUrl(repo, "stars"),
          version: this.generateBadgeUrl(repo, "version"),
        },
      };

      // Cache the result
      this.cache.set(managerName, { data: info, timestamp: Date.now() });

      return info;
    } catch (error) {
      throw createError(ErrorCode.GITHUB_API_ERROR, {
        manager: managerName,
        repo: repo,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async fetchMultipleManagers(
    managers: string[],
  ): Promise<Map<string, GitHubInfo>> {
    const results = new Map<string, GitHubInfo>();

    // Fetch in parallel with error handling for each
    const promises = managers.map(async (manager) => {
      try {
        const info = await this.fetchManagerInfo(manager);
        results.set(manager, info);
      } catch (error) {
        console.warn(`Failed to fetch GitHub info for ${manager}:`, error);
        // Add placeholder data
        results.set(manager, {
          stars: 0,
          version: "N/A",
          badge: {
            stars: this.generateBadgeUrl("unknown/unknown", "stars"),
            version: this.generateBadgeUrl("unknown/unknown", "version"),
          },
        });
      }
    });

    await Promise.all(promises);
    return results;
  }

  generateBadgeUrl(repo: string, type: "stars" | "version"): string {
    switch (type) {
      case "stars":
        return `https://img.shields.io/github/stars/${repo}?style=social`;
      case "version":
        return `https://img.shields.io/github/v/release/${repo}`;
      default:
        return "";
    }
  }

  private async fetchRepoInfo(repo: string): Promise<GitHubRepoInfo> {
    const url = `https://api.github.com/repos/${repo}`;
    const response = await fetch(url, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "zsh-benchmark-readme-generator",
      },
    });

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  }

  private async fetchLatestRelease(
    repo: string,
  ): Promise<GitHubRelease | null> {
    const url = `https://api.github.com/repos/${repo}/releases/latest`;
    const response = await fetch(url, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "zsh-benchmark-readme-generator",
      },
    });

    if (response.status === 404) {
      // No releases found
      return null;
    }

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  }

  private loadRepoMapping(): Map<string, string> {
    try {
      const configPath =
        new URL("./config/repos.json", import.meta.url).pathname;
      const configContent = Deno.readTextFileSync(configPath);
      const config = JSON.parse(configContent);
      return new Map(Object.entries(config));
    } catch (error) {
      console.error("Failed to load repository mapping:", error);
      // Return default mapping
      return new Map([
        ["oh-my-zsh", "ohmyzsh/ohmyzsh"],
        ["prezto", "sorin-ionescu/prezto"],
        ["zinit", "zdharma-continuum/zinit"],
        ["zplug", "zplug/zplug"],
        ["antigen", "zsh-users/antigen"],
        ["zim", "zimfw/zimfw"],
        ["znap", "marlonrichert/zsh-snap"],
        ["sheldon", "rossmacarthur/sheldon"],
      ]);
    }
  }

  getRepoMapping(): Map<string, string> {
    return new Map(this.repoMapping);
  }
}
