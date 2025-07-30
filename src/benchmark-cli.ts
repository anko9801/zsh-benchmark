#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env
import { parse } from "https://deno.land/std@0.220.0/flags/mod.ts";
import { ensureDir } from "https://deno.land/std@0.220.0/fs/mod.ts";
import { dirname, join } from "https://deno.land/std@0.220.0/path/mod.ts";
import { blue, bold } from "https://deno.land/std@0.220.0/fmt/colors.ts";
import { BenchmarkResult, PluginManager } from "./types.ts";
import {
  getPluginLoadSeparator,
  getSlowManagerSettings,
  getSpecialInstallCommand,
  hasNoInstallSupport,
  MANAGER_NAMES,
  type ManagerName,
  PLUGIN_MANAGERS,
  usesPluginConfigs,
} from "./plugin-managers.ts";
import {
  ALL_PLUGINS,
  createTimestamp,
  DEFAULT_CONFIG,
  exists,
  expandPath,
  formatDuration,
  logError,
  logger,
  logHeader,
  logProgress,
  logResult,
  logSubheader,
  logSuccess,
  parseOptions,
  runCommand,
  setupLogging,
} from "./utils.ts";

const loadTemplate = async (name: string) =>
  await Deno.readTextFile(
    join(dirname(new URL(import.meta.url).pathname), "templates", name),
  );

// Type guard for ManagerName
const isManagerName = (name: string): name is ManagerName =>
  MANAGER_NAMES.includes(name as ManagerName);

async function prepareConfig(manager: PluginManager, pluginCount: number) {
  const plugins = ALL_PLUGINS.slice(0, pluginCount);
  for (const cfg of manager.configFiles) {
    const path = expandPath(cfg.path);
    if (await exists(path)) await Deno.copyFile(path, `${path}.bak`);

    let tpl = cfg.isPluginList
      ? "{{PLUGIN_LIST}}"
      : "# Minimal config\n{{PLUGIN_LOADS}}";
    try {
      tpl = await loadTemplate(cfg.template);
    } catch {
      // Ignore cleanup errors
    }

    const loads = plugins.map((plugin) => manager.generatePluginLoad(plugin))
      .join(getPluginLoadSeparator(cfg.template));
    let content = tpl.replace("{{PLUGIN_LOADS}}", loads).replace(
      "{{PLUGIN_LIST}}",
      plugins.join("\n"),
    );
    if (usesPluginConfigs(cfg.template)) {
      content = tpl.replace("{{PLUGIN_CONFIGS}}", loads);
    }

    await ensureDir(dirname(path));
    await Deno.writeTextFile(path, content);
  }
}

async function restoreConfigs() {
  for (
    const configPath of [
      "~/.zshrc",
      "~/.zimrc",
      "~/.zplugrc",
      "~/.config/sheldon/plugins.toml",
    ]
  ) {
    const path = expandPath(configPath), bak = `${path}.bak`;
    if (await exists(bak)) {
      await Deno.copyFile(bak, path);
      await Deno.remove(bak);
    }
  }
}

async function runBenchmark(
  manager: PluginManager,
  pluginCount: number,
): Promise<BenchmarkResult> {
  const result: BenchmarkResult = {
    manager: manager.name,
    pluginCount: pluginCount,
    installTime: null,
    loadTime: null,
  };

  try {
    // Get version
    result.version = manager.versionCommand
      ? (await runCommand(manager.versionCommand, { silent: true })).output
        .trim()
      : "unknown";

    // Prepare config
    await prepareConfig(manager, pluginCount);
    if (manager.specialInit) await manager.specialInit();

    // Pre-install
    if (manager.preInstallCommand) {
      if (typeof manager.preInstallCommand === "string") {
        await runCommand(manager.preInstallCommand, { silent: true });
      } else await manager.preInstallCommand(ALL_PLUGINS.slice(0, pluginCount));
    }

    // Install benchmark
    const skipInstall =
      (hasNoInstallSupport(manager.name) && pluginCount === 25) ||
      (manager.skipInstall && pluginCount > 0);

    if (!skipInstall) {
      logProgress("Running install benchmark");
      const slowSettings = getSlowManagerSettings(manager.name, pluginCount);
      const runs = slowSettings?.runs ||
        DEFAULT_CONFIG.hyperfine.installRuns;
      const timeout = slowSettings?.timeout ||
        (pluginCount >= 25 ? 120 : 60);
      const specialInstallCmd = getSpecialInstallCommand(manager.name);
      const installCmd = manager.customInstallCommand || specialInstallCmd ||
        `timeout ${timeout} zsh -ic exit`;

      const cmd =
        `hyperfine --ignore-failure --warmup ${DEFAULT_CONFIG.hyperfine.warmupRuns} --runs ${runs} ` +
        `--prepare "${
          manager.cacheCleanCommand.replace(/"/g, '"')
        }" --export-json /tmp/${manager.name}-install.json ` +
        `--command-name '${manager.name}-install' '${installCmd}'`;

      const res = await runCommand(cmd, { silent: true });
      if (res.success && await exists(`/tmp/${manager.name}-install.json`)) {
        const data = JSON.parse(
          await Deno.readTextFile(`/tmp/${manager.name}-install.json`),
        );
        result.installTime = data.results[0].mean * 1000;
        result.installStddev = data.results[0].stddev * 1000;
      } else {
        logger.warn(`Install benchmark failed for ${manager.name}`);
        // Retry once
        const retry = await runCommand(cmd, { silent: true });
        if (
          retry.success && await exists(`/tmp/${manager.name}-install.json`)
        ) {
          const data = JSON.parse(
            await Deno.readTextFile(`/tmp/${manager.name}-install.json`),
          );
          result.installTime = data.results[0].mean * 1000;
          result.installStddev = data.results[0].stddev * 1000;
        }
      }
    }

    // Post-install
    if (skipInstall && manager.postInstallCommand) {
      await runCommand(manager.postInstallCommand);
    }

    // Load benchmark
    logProgress("Running load benchmark");
    const loadCmd =
      `hyperfine --ignore-failure --warmup ${DEFAULT_CONFIG.hyperfine.warmupRuns} ` +
      `--runs ${DEFAULT_CONFIG.hyperfine.loadRuns} --export-json /tmp/${manager.name}-load.json ` +
      `--command-name '${manager.name}-load' 'timeout 10 zsh -ic exit'`;

    const loadRes = await runCommand(loadCmd, { silent: true });
    if (loadRes.success && await exists(`/tmp/${manager.name}-load.json`)) {
      const data = JSON.parse(
        await Deno.readTextFile(`/tmp/${manager.name}-load.json`),
      );
      result.loadTime = data.results[0].mean * 1000;
      result.loadStddev = data.results[0].stddev * 1000;
    } else {
      // Retry with longer timeout
      const retry = await runCommand(
        loadCmd.replace("timeout 10", "timeout 20"),
        { silent: true },
      );
      if (retry.success && await exists(`/tmp/${manager.name}-load.json`)) {
        const data = JSON.parse(
          await Deno.readTextFile(`/tmp/${manager.name}-load.json`),
        );
        result.loadTime = data.results[0].mean * 1000;
        result.loadStddev = data.results[0].stddev * 1000;
      }
    }

    await runCommand(`rm -f /tmp/${manager.name}-*.json`);
  } catch (error) {
    logError(`Benchmark failed for ${manager.name}`, error as Error);
    result.error = error instanceof Error ? error.message : String(error);
  }

  return result;
}

async function benchmark(managers: string[], pluginCounts: number[]) {
  logger.info(blue(bold("🚀 Zsh Plugin Manager Scalability Benchmark")));
  logger.info(
    blue(`📊 Testing with plugin counts: ${pluginCounts.join(", ")}`),
  );

  const results: BenchmarkResult[] = [];

  for (const name of managers) {
    if (!isManagerName(name)) {
      logger.warn(`Unknown manager: ${name}`);
      continue;
    }
    const manager = PLUGIN_MANAGERS[name];
    if (!manager) {
      logger.error(`Unknown manager: ${name}`);
      continue;
    }

    logHeader(`Testing: ${name}`);

    for (const count of pluginCounts) {
      if (name === "vanilla" && count > 0) continue;

      logSubheader(`Testing with ${count} plugins`);
      const result = await runBenchmark(manager, count);
      results.push(result);

      logger.info(`Version: ${result.version || "unknown"}`);

      if (result.installTime !== null) {
        logResult(
          "Install time",
          formatDuration(result.installTime),
          ` ± ${formatDuration(result.installStddev || 0)}`,
        );
      } else if (hasNoInstallSupport(name) && count === 25) {
        logger.info("Install benchmark skipped (plugins pre-installed)");
      } else {
        logger.error("Install benchmark failed");
      }

      if (result.loadTime !== null) {
        logResult(
          "Load time",
          formatDuration(result.loadTime),
          ` ± ${formatDuration(result.loadStddev || 0)}`,
        );
      } else {
        logger.error("Load benchmark failed");
      }
    }
  }

  // Save results
  const timestamp = createTimestamp();
  const resultsPath =
    `${DEFAULT_CONFIG.paths.results}/benchmark-results-latest.json`;
  await ensureDir(DEFAULT_CONFIG.paths.results);

  if (await exists(resultsPath)) {
    await Deno.writeTextFile(
      `${DEFAULT_CONFIG.paths.results}/benchmark-results-${timestamp}.json`,
      await Deno.readTextFile(resultsPath),
    );
  }

  await Deno.writeTextFile(resultsPath, JSON.stringify({ results }, null, 2));
  logSuccess(`\n✅ Results saved to: ${resultsPath}`);

  await restoreConfigs();
  logSuccess("✅ Original configurations restored");
}

async function test(managers: string[]) {
  logger.info(blue(bold("🧪 Testing Zsh Plugin Managers")));

  for (const name of managers) {
    if (!isManagerName(name)) {
      logger.warn(`Unknown manager: ${name}`);
      continue;
    }
    const manager = PLUGIN_MANAGERS[name];
    if (!manager) {
      logger.error(`Unknown manager: ${name}`);
      continue;
    }

    logger.info(`\nTesting ${name}...`);
    await prepareConfig(manager, 3);

    const { success, output } = await runCommand(
      "timeout 10 zsh -ic 'echo TEST_OK'",
    );
    if (success && output.includes("TEST_OK")) {
      logSuccess(`  ✅ ${name} works correctly`);
    } else {
      logger.error(`  ${name} failed`);
    }
  }

  await restoreConfigs();
  logSuccess("✅ Original configurations restored");
}

async function versions(managers: string[]) {
  logger.info(blue(bold("📋 Plugin Manager Versions")));
  for (const name of managers) {
    if (!isManagerName(name)) {
      logger.warn(`Unknown manager: ${name}`);
      continue;
    }
    const manager = PLUGIN_MANAGERS[name];
    if (manager) {
      const version = manager.versionCommand
        ? (await runCommand(manager.versionCommand, { silent: true })).output
          .trim()
        : "unknown";
      logger.info(`${name}: ${version}`);
    }
  }
}

// Main CLI
if (import.meta.main) {
  await setupLogging("INFO");

  const args = parse(Deno.args, {
    string: ["managers", "counts", "runs", "warmup"],
    boolean: ["help", "version", "debug"],
    alias: { h: "help", v: "version", d: "debug", r: "runs", w: "warmup" },
  });

  const command = args._[0]?.toString() || "benchmark";

  if (args.help || command === "help") {
    console.log(`
${bold("Zsh Plugin Manager Benchmark")}

${bold("USAGE:")}
    deno run --allow-all benchmark-cli.ts [COMMAND] [OPTIONS]

${bold("COMMANDS:")}
    benchmark    Run scalability benchmark (default)
    test         Test all plugin managers
    versions     Show version information
    help         Show this help message

${bold("OPTIONS:")}
    --managers     Space-separated list of managers to test
    --counts       Space-separated list of plugin counts (default: 0 25)
    --runs, -r     Number of runs for hyperfine (default: install=10, load=20)
    --warmup, -w   Number of warmup runs for hyperfine (default: 1)
    --debug, -d    Enable debug logging

${bold("EXAMPLES:")}
    deno run --allow-all benchmark-cli.ts
    deno run --allow-all benchmark-cli.ts test
    deno run --allow-all benchmark-cli.ts versions
    deno run --allow-all benchmark-cli.ts benchmark --managers "zinit zplug"
    deno run --allow-all benchmark-cli.ts benchmark --counts "0 10 25"
  `);
    Deno.exit(0);
  }

  try {
    if (args.debug) await setupLogging("DEBUG");
    if (args.runs) {
      const runs = parseInt(args.runs, 10);
      if (!isNaN(runs)) {
        DEFAULT_CONFIG.hyperfine.installRuns =
          DEFAULT_CONFIG.hyperfine
            .loadRuns =
            runs;
      }
    }
    if (args.warmup) {
      const warmup = parseInt(args.warmup, 10);
      if (!isNaN(warmup)) DEFAULT_CONFIG.hyperfine.warmupRuns = warmup;
    }

    const opts = parseOptions(args, Object.keys(PLUGIN_MANAGERS));

    switch (command) {
      case "test":
        await test(opts.managers);
        break;
      case "versions":
        await versions(opts.managers);
        break;
      default:
        await benchmark(opts.managers, opts.pluginCounts);
    }
  } catch (error) {
    logError("Command failed", error as Error);
    Deno.exit(1);
  }
}
