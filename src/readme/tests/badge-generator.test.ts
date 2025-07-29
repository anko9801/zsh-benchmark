// Tests for badge generator

import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { BadgeGenerator } from "../badge-generator.ts";

Deno.test("BadgeGenerator generates basic badges", () => {
  const repoMapping = new Map([
    ["zinit", "zdharma-continuum/zinit"],
    ["oh-my-zsh", "ohmyzsh/ohmyzsh"],
  ]);

  const generator = new BadgeGenerator(repoMapping);
  const badges = generator.generateBadges();

  // Should have Deno and License badges
  const denoBadge = badges.find((b) => b.name === "Deno");
  assertEquals(denoBadge?.url, "https://img.shields.io/badge/deno-1.46.0-black?logo=deno");

  const licenseBadge = badges.find((b) => b.name === "License");
  assertEquals(licenseBadge?.url, "https://img.shields.io/badge/license-MIT-blue");

  // Should have manager badges in alphabetical order
  const ohMyZshBadge = badges.find((b) => b.name === "oh-my-zsh stars");
  assertStringIncludes(ohMyZshBadge?.url || "", "ohmyzsh/ohmyzsh");
  assertStringIncludes(ohMyZshBadge?.url || "", "style=social");

  const zinitBadge = badges.find((b) => b.name === "zinit stars");
  assertStringIncludes(zinitBadge?.url || "", "zdharma-continuum/zinit");
});

Deno.test("BadgeGenerator generates manager-specific badges", () => {
  const repoMapping = new Map([["test", "org/repo"]]);
  const generator = new BadgeGenerator(repoMapping);

  const badges = generator.generateManagerBadges("test", "org/repo");

  assertEquals(
    badges.stars,
    "https://img.shields.io/github/stars/org/repo?style=social",
  );
  assertEquals(
    badges.version,
    "https://img.shields.io/github/v/release/org/repo?label=version",
  );
  assertEquals(
    badges.lastCommit,
    "https://img.shields.io/github/last-commit/org/repo?label=last%20commit",
  );
});

Deno.test("BadgeGenerator generates status badges", () => {
  const generator = new BadgeGenerator(new Map());

  assertEquals(
    generator.generateStatusBadge("passing"),
    "https://img.shields.io/badge/benchmark-passing-green",
  );
  assertEquals(
    generator.generateStatusBadge("failing"),
    "https://img.shields.io/badge/benchmark-failing-red",
  );
  assertEquals(
    generator.generateStatusBadge("unknown"),
    "https://img.shields.io/badge/benchmark-unknown-gray",
  );
});

Deno.test("BadgeGenerator generates time badges", () => {
  const generator = new BadgeGenerator(new Map());

  // Fast time (green)
  const fastBadge = generator.generateTimeBadge("load time", 30);
  assertStringIncludes(fastBadge, "load%20time");
  assertStringIncludes(fastBadge, "30ms");
  assertStringIncludes(fastBadge, "green");

  // Medium time (yellow)
  const mediumBadge = generator.generateTimeBadge("startup", 75);
  assertStringIncludes(mediumBadge, "75ms");
  assertStringIncludes(mediumBadge, "yellow");

  // Slow time (red)
  const slowBadge = generator.generateTimeBadge("install", 150);
  assertStringIncludes(slowBadge, "150ms");
  assertStringIncludes(slowBadge, "red");

  // Seconds unit
  const secondsBadge = generator.generateTimeBadge("total", 2500, "s");
  assertStringIncludes(secondsBadge, "2.50s");
});