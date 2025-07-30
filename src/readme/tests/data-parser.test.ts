// Tests for data parser

import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { DataParser } from "../data-parser.ts";
import { ReadmeGeneratorError } from "../errors.ts";

Deno.test("DataParser validates JSON schema", () => {
  const parser = new DataParser();
  const invalidData = { invalid: "structure" };

  assertThrows(
    () => parser.validate(invalidData),
    ReadmeGeneratorError,
    "データ検証エラーが発生しました",
  );
});

Deno.test("DataParser validates benchmark results", () => {
  const parser = new DataParser();
  const invalidResult = {
    results: [
      { manager: "test", pluginCount: "invalid" },
    ],
  };

  assertThrows(
    () => parser.validate(invalidResult),
    ReadmeGeneratorError,
    "データ検証エラーが発生しました",
  );
});

Deno.test("DataParser extracts managers correctly", () => {
  const parser = new DataParser();
  const validData = {
    results: [
      { manager: "zinit", pluginCount: 0, loadTime: 50, installTime: 80 },
      { manager: "zinit", pluginCount: 25, loadTime: 485, installTime: 540 },
      { manager: "oh-my-zsh", pluginCount: 0, loadTime: 193, installTime: 152 },
    ],
  };

  const parsed = parser.extractMetadata(parser.validate(validData));
  assertEquals(parsed.environment, {});
});

Deno.test("DataParser parses managers into grouped data", () => {
  const parser = new DataParser();
  const validData = {
    results: [
      { manager: "zinit", pluginCount: 0, loadTime: 50, installTime: 80 },
      { manager: "zinit", pluginCount: 25, loadTime: 485, installTime: 540 },
      { manager: "oh-my-zsh", pluginCount: 0, loadTime: 193, installTime: 152 },
      {
        manager: "oh-my-zsh",
        pluginCount: 25,
        loadTime: 235,
        installTime: 351,
      },
    ],
  };

  const benchmarkData = parser.validate(validData);
  const managers = parser["parseManagers"](benchmarkData.results);

  assertEquals(managers.length, 2);
  assertEquals(managers[0].name, "oh-my-zsh");
  assertEquals(managers[1].name, "zinit");

  // Check grouped results
  assertEquals(managers[0].results.get(0)?.loadTime, 193);
  assertEquals(managers[0].results.get(25)?.loadTime, 235);
  assertEquals(managers[1].results.get(0)?.loadTime, 50);
  assertEquals(managers[1].results.get(25)?.loadTime, 485);
});

Deno.test("DataParser extracts plugin counts", () => {
  const parser = new DataParser();
  const validData = {
    results: [
      { manager: "zinit", pluginCount: 0, loadTime: 50, installTime: 80 },
      { manager: "zinit", pluginCount: 25, loadTime: 485, installTime: 540 },
      {
        manager: "oh-my-zsh",
        pluginCount: 10,
        loadTime: 200,
        installTime: 250,
      },
    ],
  };

  const benchmarkData = parser.validate(validData);
  const counts = parser["extractPluginCounts"](benchmarkData.results);

  assertEquals(counts, [0, 10, 25]);
});
