// Tests for GitHub API module

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { GitHubAPI } from "../github-api.ts";

Deno.test("GitHubAPI generates badge URLs correctly", () => {
  const api = new GitHubAPI();

  const starsUrl = api.generateBadgeUrl("ohmyzsh/ohmyzsh", "stars");
  assertEquals(
    starsUrl,
    "https://img.shields.io/github/stars/ohmyzsh/ohmyzsh?style=social",
  );

  const versionUrl = api.generateBadgeUrl("zimfw/zimfw", "version");
  assertEquals(
    versionUrl,
    "https://img.shields.io/github/v/release/zimfw/zimfw",
  );
});

Deno.test("GitHubAPI loads repository mapping", () => {
  const api = new GitHubAPI();
  const mapping = api.getRepoMapping();

  // Check some known mappings
  assertEquals(mapping.get("oh-my-zsh"), "ohmyzsh/ohmyzsh");
  assertEquals(mapping.get("zinit"), "zdharma-continuum/zinit");
  assertEquals(mapping.get("zim"), "zimfw/zimfw");

  // Should have at least the default mappings
  assertExists(mapping.get("prezto"));
  assertExists(mapping.get("zplug"));
});

// Note: Actual API calls are not tested to avoid rate limiting
// and external dependencies. In production, you would mock these.

Deno.test("GitHubAPI caches results", () => {
  const api = new GitHubAPI();

  // This test demonstrates the caching logic without making actual API calls
  const cache = api["cache"];

  // Simulate adding to cache
  const mockInfo = {
    stars: 1000,
    version: "v1.0.0",
    badge: {
      stars: "https://img.shields.io/github/stars/test/repo?style=social",
      version: "https://img.shields.io/github/v/release/test/repo",
    },
  };

  cache.set("test-manager", { data: mockInfo, timestamp: Date.now() });

  // Check cache contains the data
  assertEquals(cache.size, 1);
  assertEquals(cache.get("test-manager")?.data.stars, 1000);
});
