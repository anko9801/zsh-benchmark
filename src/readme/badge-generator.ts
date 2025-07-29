// Badge generator for plugin managers

import { BadgeInfo } from "./types.ts";

export class BadgeGenerator {
  private repoMapping: Map<string, string>;
  
  // Predefined star counts (approximate values)
  private starCounts: Map<string, number> = new Map([
    ["oh-my-zsh", 180000],
    ["prezto", 14300],
    ["antigen", 8200],
    ["zplug", 5900],
    ["zim", 4200],
    ["zinit", 3800],
    ["antibody", 1700],
    ["znap", 1400],
    ["antidote", 1200],
    ["sheldon", 1200],
    ["zpm", 374],
    ["zgenom", 391],
    ["zcomet", 221],
    ["antigen-hs", 206],
    ["zr", 187],
    ["alf", 116],
  ]);
  
  // Predefined versions (latest known versions)
  private versions: Map<string, string> = new Map([
    ["oh-my-zsh", "master"],
    ["prezto", "master"],
    ["antigen", "v2.2.3"],
    ["zplug", "2.4.2"],
    ["zim", "v1.14.0"],
    ["zinit", "v3.13.1"],
    ["antibody", "v6.1.1"],
    ["znap", "v1.2.0"],
    ["antidote", "v1.9.7"],
    ["sheldon", "0.8.0"],
    ["zpm", "v1.4.0"],
    ["zgenom", "master"],
    ["zcomet", "v1.5.0"],
    ["antigen-hs", "v1.1.0.0"],
    ["zr", "1.0.0"],
    ["alf", "v0.2.0"],
  ]);
  

  constructor(repoMapping: Map<string, string>) {
    this.repoMapping = repoMapping;
  }

  generateBadges(): BadgeInfo[] {
    const badges: BadgeInfo[] = [];

    // Only License badge
    badges.push({
      name: "License",
      url: "https://img.shields.io/badge/license-MIT-blue",
    });

    return badges;
  }

  
  getStarCount(manager: string): number | undefined {
    return this.starCounts.get(manager);
  }
  
  getVersion(manager: string): string | undefined {
    return this.versions.get(manager);
  }
  
}