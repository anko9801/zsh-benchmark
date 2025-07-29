// Badge generator for plugin managers

import { BadgeInfo } from "./types.ts";

export class BadgeGenerator {
  private repoMapping: Map<string, string>;

  constructor(repoMapping: Map<string, string>) {
    this.repoMapping = repoMapping;
  }

  generateBadges(): BadgeInfo[] {
    const badges: BadgeInfo[] = [];

    // GitHub stats badge
    badges.push({
      name: "Deno",
      url: "https://img.shields.io/badge/deno-1.46.0-black?logo=deno",
    });

    badges.push({
      name: "License",
      url: "https://img.shields.io/badge/license-MIT-blue",
    });

    // Generate badges for each plugin manager
    const sortedManagers = Array.from(this.repoMapping.entries()).sort(
      ([a], [b]) => a.localeCompare(b),
    );

    for (const [manager, repo] of sortedManagers) {
      // Stars badge
      badges.push({
        name: `${manager} stars`,
        url: `https://img.shields.io/github/stars/${repo}?style=social&label=${encodeURIComponent(manager)}`,
      });
    }

    return badges;
  }

  generateManagerBadges(manager: string, repo: string): {
    stars: string;
    version: string;
    lastCommit: string;
  } {
    return {
      stars: `https://img.shields.io/github/stars/${repo}?style=social`,
      version: `https://img.shields.io/github/v/release/${repo}?label=version`,
      lastCommit: `https://img.shields.io/github/last-commit/${repo}?label=last%20commit`,
    };
  }

  generateStatusBadge(status: "passing" | "failing" | "unknown"): string {
    const color = status === "passing" ? "green" : status === "failing" ? "red" : "gray";
    return `https://img.shields.io/badge/benchmark-${status}-${color}`;
  }

  generateTimeBadge(label: string, time: number, unit: "ms" | "s" = "ms"): string {
    const color = time < 50 ? "green" : time < 100 ? "yellow" : "red";
    const formattedTime = unit === "s" ? (time / 1000).toFixed(2) : time.toFixed(0);
    return `https://img.shields.io/badge/${encodeURIComponent(label)}-${formattedTime}${unit}-${color}`;
  }
}