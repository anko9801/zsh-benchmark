#!/usr/bin/env -S deno run --allow-read --allow-run

// Quality check script for README generator

import { logger } from "../logger.ts";

interface QualityCheckResult {
  passed: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    message?: string;
  }>;
}

async function runCommand(
  cmd: string[],
): Promise<{ success: boolean; output: string }> {
  try {
    const process = new Deno.Command(cmd[0], { args: cmd.slice(1) });
    const { code, stdout, stderr } = await process.output();
    const output = new TextDecoder().decode(stdout) +
      new TextDecoder().decode(stderr);
    return { success: code === 0, output };
  } catch (error) {
    return { success: false, output: (error as Error).toString() };
  }
}

async function checkQuality(): Promise<QualityCheckResult> {
  const checks: QualityCheckResult["checks"] = [];

  logger.info("Running quality checks...");

  // 1. Type checking
  logger.debug("Checking TypeScript types...");
  const typeCheck = await runCommand([
    "deno",
    "check",
    "--no-lock",
    "src/readme/readme-generator.ts",
  ]);
  checks.push({
    name: "TypeScript type checking",
    passed: typeCheck.success,
    message: typeCheck.success ? "All types are valid" : "Type errors found",
  });

  // 2. Test coverage
  logger.debug("Running tests...");
  const tests = await runCommand([
    "deno",
    "test",
    "--allow-read",
    "--allow-write",
    "--allow-net",
    "--no-check",
    "src/readme/tests/",
  ]);
  checks.push({
    name: "Unit tests",
    passed: tests.success,
    message: tests.success ? "All tests passed" : "Some tests failed",
  });

  // 3. Code formatting
  logger.debug("Checking code formatting...");
  const format = await runCommand([
    "deno",
    "fmt",
    "--check",
    "src/readme/",
  ]);
  checks.push({
    name: "Code formatting",
    passed: format.success,
    message: format.success
      ? "Code is properly formatted"
      : "Code needs formatting",
  });

  // 4. Linting (basic checks)
  logger.debug("Running lint checks...");
  const lint = await runCommand([
    "deno",
    "lint",
    "src/readme/",
  ]);
  checks.push({
    name: "Linting",
    passed: lint.success,
    message: lint.success ? "No lint errors" : "Lint errors found",
  });

  // 5. Import check
  logger.debug("Checking imports...");
  let importCheckPassed = true;
  try {
    // Check for circular dependencies
    await import("./readme-generator.ts");
  } catch (_error) {
    importCheckPassed = false;
  }
  checks.push({
    name: "Import validation",
    passed: importCheckPassed,
    message: importCheckPassed
      ? "All imports are valid"
      : "Import errors found",
  });

  // 6. Documentation check
  logger.debug("Checking documentation...");
  const hasReadme = await Deno.stat("README.md").then(() => true)
    .catch(() => false);
  checks.push({
    name: "Documentation",
    passed: hasReadme,
    message: hasReadme ? "README.md exists" : "README.md is missing",
  });

  const allPassed = checks.every((check) => check.passed);

  return { passed: allPassed, checks };
}

// Run if called directly
if (import.meta.main) {
  const result = await checkQuality();

  logger.info("\n=== Quality Check Results ===");

  for (const check of result.checks) {
    const status = check.passed ? "✅" : "❌";
    logger.info(`${status} ${check.name}: ${check.message}`);
  }

  logger.info(
    "\n" + (result.passed ? "✅ All checks passed!" : "❌ Some checks failed"),
  );

  if (!result.passed) {
    Deno.exit(1);
  }
}
