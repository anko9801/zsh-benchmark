// Tests for badge generator

import {
  assertEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { BadgeGenerator } from "../badge-generator.ts";

Deno.test("BadgeGenerator generates basic badges", () => {
  const repoMapping = new Map([
    ["zinit", "zdharma-continuum/zinit"],
    ["oh-my-zsh", "ohmyzsh/ohmyzsh"],
  ]);

  const generator = new BadgeGenerator(repoMapping);
  const badges = generator.generateBadges();

  // Should have License badge
  assertEquals(badges.length, 1);
  const licenseBadge = badges.find((b) => b.name === "License");
  assertEquals(licenseBadge?.url, "https://img.shields.io/badge/license-MIT-blue");
});

Deno.test("BadgeGenerator getStarCount returns predefined values", () => {
  const generator = new BadgeGenerator(new Map());
  
  assertEquals(generator.getStarCount("oh-my-zsh"), 180000);
  assertEquals(generator.getStarCount("prezto"), 14300);
  assertEquals(generator.getStarCount("unknown-manager"), undefined);
});

Deno.test("BadgeGenerator getVersion returns predefined values", () => {
  const generator = new BadgeGenerator(new Map());
  
  assertEquals(generator.getVersion("antigen"), "v2.2.3");
  assertEquals(generator.getVersion("zplug"), "2.4.2");
  assertEquals(generator.getVersion("unknown-manager"), undefined);
});