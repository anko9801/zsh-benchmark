// Integration tests for README generator

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { ReadmeGenerator } from "../readme-generator.ts";
import { GenerateReadmeOptions } from "../types.ts";

// Create test data file
const testDataPath = "./test-benchmark-results.json";
const testOutputPath = "./test-readme.md";

const testData = {
  "timestamp": "2025-07-29T10:00:00Z",
  "environment": {
    "os": "darwin",
    "osVersion": "24.5.0",
    "shell": "zsh",
    "shellVersion": "5.9",
    "denoVersion": "2.4.2",
  },
  "results": [
    {
      "manager": "antigen",
      "pluginCount": 0,
      "loadTime": 34.88,
      "installTime": 394,
      "loadStddev": 1.2,
      "installStddev": 5.3,
    },
    {
      "manager": "antigen",
      "pluginCount": 25,
      "loadTime": 35.16,
      "installTime": 395,
      "loadStddev": 1.5,
      "installStddev": 6.1,
    },
    {
      "manager": "antidote",
      "pluginCount": 0,
      "loadTime": 34.36,
      "installTime": 34,
      "loadStddev": 0.8,
      "installStddev": 1.2,
    },
    {
      "manager": "antidote",
      "pluginCount": 25,
      "loadTime": 37.48,
      "installTime": 33,
      "loadStddev": 1.1,
      "installStddev": 1.0,
    },
    {
      "manager": "zim",
      "pluginCount": 0,
      "loadTime": 34.18,
      "installTime": 38,
      "loadStddev": 0.9,
      "installStddev": 1.3,
    },
    {
      "manager": "zim",
      "pluginCount": 25,
      "loadTime": 121.79,
      "installTime": 35,
      "loadStddev": 3.2,
      "installStddev": 1.5,
    },
  ],
};

Deno.test({
  name: "Integration: Generate README from benchmark data",
  // Skip this test if running in CI or when rate limited
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    // Setup: Create test data file
    await Deno.writeTextFile(testDataPath, JSON.stringify(testData, null, 2));

    try {
      // Create options
      const options: GenerateReadmeOptions = {
        inputFile: testDataPath,
        outputFile: testOutputPath,
        language: "ja",
        backup: false,
        debug: false,
      };

      // Run generator
      const generator = new ReadmeGenerator(options);
      await generator.generate();

      // Verify output file exists
      const stat = await Deno.stat(testOutputPath);
      assertExists(stat);
      assertEquals(stat.isFile, true);

      // Read and verify content
      const content = await Deno.readTextFile(testOutputPath);

      // Check for main sections
      assert(content.includes("# Zsh Plugin Manager Benchmark Results"));
      assert(content.includes("## 📊 Executive Summary"));
      assert(content.includes("## 🏆 Performance Rankings (25 Plugins)"));
      assert(content.includes("## 📈 Detailed Comparison"));
      assert(content.includes("## 📦 Version Information"));

      // Check for data in tables
      assert(content.includes("antigen"));
      assert(content.includes("antidote"));
      assert(content.includes("zim"));

      // Check for unified table format
      assert(content.includes("Install (25)"));
      assert(content.includes("Load (25)"));
      assert(content.includes("Install (0)"));
      assert(content.includes("Load (0)"));

      // Check that removed sections are not present
      assert(!content.includes("## 🔍 Plugin Manager Characteristics"));
      assert(!content.includes("## 💡 Recommendations"));
    } finally {
      // Cleanup
      try {
        await Deno.remove(testDataPath);
        await Deno.remove(testOutputPath);
      } catch {
        // Ignore cleanup errors
      }
    }
  },
});

Deno.test("Integration: Handle missing data gracefully", async () => {
  const incompleteData = {
    ...testData,
    results: [
      {
        "manager": "test-manager",
        "pluginCount": 25,
        "loadTime": null,
        "installTime": 100,
      },
    ],
  };

  await Deno.writeTextFile(
    testDataPath,
    JSON.stringify(incompleteData, null, 2),
  );

  try {
    const options: GenerateReadmeOptions = {
      inputFile: testDataPath,
      outputFile: testOutputPath,
      language: "ja",
      backup: false,
      debug: false,
    };

    const generator = new ReadmeGenerator(options);
    await generator.generate();

    const content = await Deno.readTextFile(testOutputPath);

    // Should handle null values
    assert(content.includes("N/A"));
  } finally {
    try {
      await Deno.remove(testDataPath);
      await Deno.remove(testOutputPath);
    } catch {
      // Ignore cleanup errors
    }
  }
});

function assert(condition: boolean, message?: string): void {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}
