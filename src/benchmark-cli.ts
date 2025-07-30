import { parse } from "https://deno.land/std@0.220.0/flags/mod.ts";
import { ensureDir } from "https://deno.land/std@0.220.0/fs/mod.ts";
import { dirname, join } from "https://deno.land/std@0.220.0/path/mod.ts";
import { blue, bold } from "https://deno.land/std@0.220.0/fmt/colors.ts";

import { BenchmarkResult, PluginManager } from "./types.ts";
import { PLUGIN_MANAGERS } from "./plugin-managers.ts";
import { ALL_PLUGINS } from "./plugins.ts";
import {
  createTimestamp,
  exists,
  expandPath,
  formatDuration,
  runCommand,
} from "./utils.ts";
import { logger, LogLevel } from "./logger.ts";
import { DEFAULT_CONFIG, parseOptions } from "./config.ts";

async function loadTemplate(templateName: string): Promise<string> {
  const templatePath = join(
    dirname(new URL(import.meta.url).pathname),
    "templates",
    templateName,
  );
  return await Deno.readTextFile(templatePath);
}

async function prepareConfig(
  manager: PluginManager,
  pluginCount: number,
): Promise<void> {
  const plugins = ALL_PLUGINS.slice(0, pluginCount);

  for (const config of manager.configFiles) {
    const configPath = expandPath(config.path);
    
    // Create backup of existing config if it exists
    if (await exists(configPath)) {
      const backupPath = `${configPath}.bak`;
      logger.debug(`Creating backup: ${backupPath}`);
      await Deno.copyFile(configPath, backupPath);
    }
    let template: string;
    try {
      template = await loadTemplate(config.template);
    } catch (_error) {
      logger.warn(
        `Template ${config.template} not found, creating minimal config`,
      );
      // Create minimal configs for missing templates
      if (config.isPluginList) {
        template = "{{PLUGIN_LIST}}";
      } else {
        template = "# Minimal config\n{{PLUGIN_LOADS}}";
      }
    }
    let content = template;

    if (config.isPluginList) {
      // For plugin list files (like .zimrc)
      const pluginList = plugins.map((p) => manager.generatePluginLoad(p)).join(
        "\n",
      );
      content = content.replace("{{PLUGIN_LOADS}}", pluginList);
      content = content.replace("{{PLUGIN_LIST}}", plugins.join("\n"));
    } else if (config.template === "sheldon.plugins.toml") {
      // Special handling for sheldon TOML
      const pluginConfigs = plugins.map((p) => manager.generatePluginLoad(p))
        .join("\n\n");
      content = content.replace("{{PLUGIN_CONFIGS}}", pluginConfigs);
    } else {
      // For regular zshrc files
      const pluginLoads = plugins.map((p) => manager.generatePluginLoad(p))
        .join("\n");
      content = content.replace("{{PLUGIN_LOADS}}", pluginLoads);
    }

    await ensureDir(dirname(configPath));
    await Deno.writeTextFile(configPath, content);
  }
}

async function restoreConfigs() {
  const configPaths = [
    "~/.zshrc",
    "~/.zimrc",
    "~/.zplugrc",
    "~/.config/sheldon/plugins.toml",
  ];
  
  for (const path of configPaths) {
    const expandedPath = expandPath(path);
    const backupPath = `${expandedPath}.bak`;
    
    if (await exists(backupPath)) {
      logger.debug(`Restoring ${expandedPath} from backup`);
      await Deno.copyFile(backupPath, expandedPath);
      await Deno.remove(backupPath);
    }
  }
}

async function getManagerVersion(managerName: string): Promise<string> {
  const versionCommands: Record<string, string> = {
    "oh-my-zsh":
      "cd ~/.oh-my-zsh && (git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
    "prezto":
      "cd ~/.zprezto && (git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
    "zim":
      "zsh -c 'source ~/.zim/zimfw.zsh && zimfw version' 2>/dev/null || echo 'unknown'",
    "znap":
      "cd ~/Git/zsh-snap && (git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
    "zinit":
      "cd ~/.local/share/zinit/zinit.git && (git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
    "zplug":
      "zsh -c 'source ~/.zplug/init.zsh && echo $ZPLUG_VERSION' 2>/dev/null || cd ~/.zplug && git rev-parse --short HEAD 2>/dev/null || echo 'unknown'",
    "antigen":
      "grep 'ANTIGEN_VERSION=' ~/.antigen/antigen.zsh 2>/dev/null | cut -d'=' -f2 | tr -d '\"' || cd ~/.antigen && git rev-parse --short HEAD 2>/dev/null || echo 'unknown'",
    "antibody": "antibody -v 2>/dev/null | awk '{print $3}' || echo 'unknown'",
    "antidote": "zsh -c 'source /usr/local/share/antidote/antidote.zsh && antidote -v' 2>/dev/null | awk 'NR==1 {print $3}' || cd /usr/local/share/antidote && git rev-parse --short HEAD 2>/dev/null || echo 'unknown'",
    "sheldon":
      "sheldon --version 2>/dev/null | awk 'NR==1 {print $2}' || echo 'unknown'",
    "zgenom":
      "cd ~/.zgenom && (git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
    "zpm":
      "cd ~/.zpm && (git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
    "zr": "echo 'custom implementation'",
    "antigen-hs": "echo 'custom implementation'",
    "zcomet":
      "cd ~/.zcomet && (git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
    "alf": "echo 'custom implementation'",
  };
  
  const cmd = versionCommands[managerName];
  if (cmd) {
    const { output } = await runCommand(cmd, { silent: true });
    return output.trim();
  }
  return "unknown";
}

async function runBenchmark(
  manager: PluginManager,
  pluginCount: number,
): Promise<BenchmarkResult> {
  const result: BenchmarkResult = {
    manager: manager.name,
    pluginCount,
    installTime: null,
    loadTime: null,
  };

  try {
    logger.debug(
      `Starting benchmark for ${manager.name} with ${pluginCount} plugins`,
    );
    
    // Get version information
    result.version = await getManagerVersion(manager.name);
    logger.debug(`${manager.name} version: ${result.version}`);

    // Prepare configuration
    logger.debug(`Preparing configuration files...`);
    await prepareConfig(manager, pluginCount);

    // Special initialization if needed
    if (manager.specialInit) {
      await manager.specialInit();
    }

    // Pre-install command if needed
    let preInstallCmd = "";
    if (manager.preInstallCommand) {
      if (typeof manager.preInstallCommand === "string") {
        preInstallCmd = manager.preInstallCommand;
      } else {
        // It's a function, call it with the plugins
        const plugins = ALL_PLUGINS.slice(0, pluginCount);
        await manager.preInstallCommand(plugins);
      }
    }

    // Install benchmark
    // Skip install benchmark for prezto and oh-my-zsh with 25 plugins
    // because they pre-install all plugins
    const skipInstall = (manager.name === "prezto" || manager.name === "oh-my-zsh") && pluginCount === 25;
    
    let hyperfineCmd: string; // Declare here so it's available for load benchmark
    
    if (skipInstall) {
      logger.info("Skipping install benchmark (plugins pre-installed)");
      result.installTime = null;
      result.installStddev = null;
    } else {
      logger.progress("Running install benchmark");
      // Create prepare command that cleans cache and runs pre-install if needed
      let prepareCmd = manager.cacheCleanCommand;
      if (preInstallCmd) {
        prepareCmd = `${manager.cacheCleanCommand} && ${preInstallCmd}`;
      }
      
      // Measure actual plugin installation time
      const installCommand = manager.postInstallCommand || 'echo "No install command"';
      // Escape the install command properly for shell
      const escapedInstallCmd = installCommand.replace(/"/g, '\\"').replace(/'/g, "'\\''");
      hyperfineCmd =
        `hyperfine --ignore-failure --warmup ${DEFAULT_CONFIG.hyperfine.warmupRuns} --runs ${DEFAULT_CONFIG.hyperfine.installRuns} --prepare "${prepareCmd.replace(/"/g, '\\"')}" --export-json /tmp/${manager.name}-install.json --command-name '${manager.name}-install' "${escapedInstallCmd}"`;

      const { success, output, error } = await runCommand(hyperfineCmd, {
        silent: true,
      });
      if (success && await exists("/tmp/" + manager.name + "-install.json")) {
        const data = JSON.parse(
          await Deno.readTextFile("/tmp/" + manager.name + "-install.json"),
        );
        result.installTime = data.results[0].mean * 1000;
        result.installStddev = data.results[0].stddev * 1000;
      } else {
        logger.warn(`Install benchmark failed for ${manager.name}: ${error}`);
        logger.debug(`Hyperfine output: ${output}`);

        // Retry once with longer timeout
        logger.info("  Retrying with longer timeout...");
        // For retry, we don't need to change the command since it no longer has timeout
        const retryCmd = hyperfineCmd;
        const retry = await runCommand(retryCmd, { silent: true });
        if (
          retry.success &&
          await exists("/tmp/" + manager.name + "-install.json")
        ) {
          const data = JSON.parse(
            await Deno.readTextFile("/tmp/" + manager.name + "-install.json"),
          );
          result.installTime = data.results[0].mean * 1000;
          result.installStddev = data.results[0].stddev * 1000;
          logger.success("  Retry successful!");
        }
      }
    }

    // Post-install command if needed (only if we skipped install benchmark)
    if (skipInstall && manager.postInstallCommand) {
      await runCommand(manager.postInstallCommand);
    }

    // Load benchmark (warm cache)
    logger.progress("Running load benchmark");
    hyperfineCmd =
      `hyperfine --ignore-failure --warmup ${DEFAULT_CONFIG.hyperfine.warmupRuns} --runs ${DEFAULT_CONFIG.hyperfine.loadRuns} --export-json /tmp/${manager.name}-load.json --command-name '${manager.name}-load' 'timeout 10 zsh -ic exit'`;

    const loadResult = await runCommand(hyperfineCmd, {
      silent: true,
    });
    if (loadResult.success && await exists("/tmp/" + manager.name + "-load.json")) {
      const data = JSON.parse(
        await Deno.readTextFile("/tmp/" + manager.name + "-load.json"),
      );
      result.loadTime = data.results[0].mean * 1000;
      result.loadStddev = data.results[0].stddev * 1000;
    } else {
      logger.warn(`Load benchmark failed for ${manager.name}: ${loadResult.error}`);
      logger.debug(`Hyperfine output: ${loadResult.output}`);

      // Retry once with longer timeout
      logger.info("  Retrying with longer timeout...");
      const retryCmd = hyperfineCmd.replace("timeout 10", "timeout 20");
      const retry = await runCommand(retryCmd, { silent: true });
      if (
        retry.success && await exists("/tmp/" + manager.name + "-load.json")
      ) {
        const data = JSON.parse(
          await Deno.readTextFile("/tmp/" + manager.name + "-load.json"),
        );
        result.loadTime = data.results[0].mean * 1000;
        result.loadStddev = data.results[0].stddev * 1000;
        logger.success("  Retry successful!");
      }
    }

    // Clean up temp files
    await runCommand(`rm -f /tmp/${manager.name}-*.json`);
  } catch (error) {
    logger.error(`Benchmark failed for ${manager.name}`, error);
    result.error = error.message;
  }

  return result;
}

// Command implementations
async function benchmark(managers: string[], pluginCounts: number[]) {
  console.log(blue(bold("🚀 Zsh Plugin Manager Scalability Benchmark")));
  console.log(
    blue(`📊 Testing with plugin counts: ${pluginCounts.join(", ")}`),
  );

  const results: BenchmarkResult[] = [];

  for (const managerName of managers) {
    const manager = PLUGIN_MANAGERS[managerName];
    if (!manager) {
      logger.error(`Unknown manager: ${managerName}`);
      continue;
    }

    logger.header(`Testing: ${managerName}`);

    for (const count of pluginCounts) {
      logger.subheader(`Testing with ${count} plugins`);
      const result = await runBenchmark(manager, count);
      results.push(result);

      // Display results
      // Display version
      logger.info(`Version: ${result.version || 'unknown'}`);
      
      if (result.installTime !== null) {
        logger.result(
          "Install time",
          formatDuration(result.installTime),
          ` ± ${formatDuration(result.installStddev || 0)}`,
        );
      } else {
        // Check if it was skipped for oh-my-zsh/prezto with 25 plugins
        const wasSkipped = (managerName === "oh-my-zsh" || managerName === "prezto") && count === 25;
        if (wasSkipped) {
          logger.info("Install benchmark skipped (plugins pre-installed)");
        } else {
          logger.error("Install benchmark failed");
        }
      }

      if (result.loadTime !== null) {
        logger.result(
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
  const backupPath =
    `${DEFAULT_CONFIG.paths.results}/benchmark-results-${timestamp}.json`;

  await ensureDir(DEFAULT_CONFIG.paths.results);

  // Backup existing results if they exist
  if (await exists(resultsPath)) {
    const existingData = await Deno.readTextFile(resultsPath);
    await Deno.writeTextFile(backupPath, existingData);
  }

  await Deno.writeTextFile(resultsPath, JSON.stringify({ results }, null, 2));
  logger.success(`\n✅ Results saved to: ${resultsPath}`);
  
  // Restore original config files from backups
  logger.info("\nRestoring original configuration files...");
  await restoreConfigs();
  logger.success("✅ Original configurations restored");
}

async function test(managers: string[]) {
  console.log(blue(bold("🧪 Testing Zsh Plugin Managers")));

  for (const managerName of managers) {
    const manager = PLUGIN_MANAGERS[managerName];
    if (!manager) {
      logger.error(`Unknown manager: ${managerName}`);
      continue;
    }

    logger.info(`\nTesting ${managerName}...`);
    await prepareConfig(manager, 3); // Test with 3 plugins

    const { success, output, error } = await runCommand(
      "timeout 10 zsh -ic 'echo TEST_OK'",
    );
    if (success && output.includes("TEST_OK")) {
      logger.success(`  ✅ ${managerName} works correctly`);
    } else {
      logger.error(`  ${managerName} failed`);
      if (error) logger.error(`     Error: ${error}`);
    }
  }
  
  // Restore original config files after testing
  logger.info("\nRestoring original configuration files...");
  await restoreConfigs();
  logger.success("✅ Original configurations restored");
}

async function versions(managers: string[]) {
  console.log(blue(bold("📋 Plugin Manager Versions")));

  const versionCommands: Record<string, string> = {
    "oh-my-zsh":
      "cd ~/.oh-my-zsh && (git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
    "prezto":
      "cd ~/.zprezto && (git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
    "zim":
      "zsh -c 'source ~/.zim/zimfw.zsh && zimfw version' 2>/dev/null || echo 'unknown'",
    "znap":
      "cd ~/Git/zsh-snap && (git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
    "zinit":
      "cd ~/.local/share/zinit/zinit.git && (git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
    "zplug":
      "zsh -c 'source ~/.zplug/init.zsh && echo $ZPLUG_VERSION' 2>/dev/null || cd ~/.zplug && git rev-parse --short HEAD 2>/dev/null || echo 'unknown'",
    "antigen":
      "grep 'ANTIGEN_VERSION=' ~/.antigen/antigen.zsh 2>/dev/null | cut -d'=' -f2 | tr -d '\"' || cd ~/.antigen && git rev-parse --short HEAD 2>/dev/null || echo 'unknown'",
    "antibody": "antibody -v 2>/dev/null | awk '{print $3}' || echo 'unknown'",
    "antidote": "zsh -c 'source /usr/local/share/antidote/antidote.zsh && antidote -v' 2>/dev/null | awk 'NR==1 {print $3}' || cd /usr/local/share/antidote && git rev-parse --short HEAD 2>/dev/null || echo 'unknown'",
    "sheldon":
      "sheldon --version 2>/dev/null | awk 'NR==1 {print $2}' || echo 'unknown'",
    "zgenom":
      "cd ~/.zgenom && (git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
    "zpm":
      "cd ~/.zpm && (git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
    "zr": "echo 'custom implementation'",
    "antigen-hs": "echo 'custom implementation'",
    "zcomet":
      "cd ~/.zcomet && (git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
    "alf": "echo 'custom implementation'",
  };

  for (const managerName of managers) {
    const cmd = versionCommands[managerName];
    if (cmd) {
      const { output } = await runCommand(cmd, { silent: true });
      console.log(`${managerName}: ${output.trim()}`);
    }
  }
}

function showHelp() {
  console.log(`
${bold("Zsh Plugin Manager Benchmark")}

${bold("USAGE:")}
    deno run --allow-read --allow-write --allow-run=bash --allow-env=HOME benchmark-cli.ts [COMMAND] [OPTIONS]

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
    deno run --allow-read --allow-write --allow-run=bash --allow-env=HOME benchmark-cli.ts
    deno run --allow-read --allow-write --allow-run=bash --allow-env=HOME benchmark-cli.ts test
    deno run --allow-read --allow-write --allow-run=bash --allow-env=HOME benchmark-cli.ts versions
    deno run --allow-read --allow-write --allow-run=bash --allow-env=HOME benchmark-cli.ts benchmark --managers "zinit zplug"
    deno run --allow-read --allow-write --allow-run=bash --allow-env=HOME benchmark-cli.ts benchmark --counts "0 10 25"
  `);
}

// Main CLI
async function main() {
  const args = parse(Deno.args, {
    string: ["managers", "counts"],
    number: ["runs", "warmup"],
    boolean: ["help", "version", "debug"],
    alias: { h: "help", v: "version", d: "debug", r: "runs", w: "warmup" },
  });

  const command = args._[0]?.toString() || "benchmark";

  if (args.help || command === "help") {
    showHelp();
    return;
  }

  try {
    // Set debug mode if requested
    if (args.debug) {
      logger.level = LogLevel.DEBUG;
    }

    // Override hyperfine runs if specified
    if (args.runs) {
      DEFAULT_CONFIG.hyperfine.installRuns = args.runs;
      DEFAULT_CONFIG.hyperfine.loadRuns = args.runs;
    }
    if (args.warmup) {
      DEFAULT_CONFIG.hyperfine.warmupRuns = args.warmup;
    }

    const options = parseOptions(args);

    switch (command) {
      case "test":
        await test(options.managers);
        break;

      case "versions":
        await versions(options.managers);
        break;

      case "benchmark":
      default:
        await benchmark(options.managers, options.pluginCounts);
        break;
    }
  } catch (error) {
    logger.error("Command failed", error);
    Deno.exit(1);
  }
}

// Run the CLI
if (import.meta.main) {
  await main();
}
