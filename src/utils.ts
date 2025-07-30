// All utilities and helpers for the benchmark project
import * as log from "https://deno.land/std@0.220.0/log/mod.ts";
import {
  blue,
  bold,
  green,
  red,
  yellow,
} from "https://deno.land/std@0.220.0/fmt/colors.ts";
import { BenchmarkOptions, CommandResult } from "./types.ts";

// Logging setup
export async function setupLogging(level: log.LevelName = "INFO") {
  await log.setup({
    handlers: {
      console: new log.ConsoleHandler("DEBUG", {
        formatter: (r) => {
          switch (r.levelName) {
            case "DEBUG":
              return blue(`[DEBUG] ${r.msg}`);
            case "WARN":
              return yellow(`⚠️  ${r.msg}`);
            case "ERROR":
              return red(`❌ ${r.msg}`);
            default:
              return r.msg;
          }
        },
      }),
    },
    loggers: { default: { level, handlers: ["console"] } },
  });
}

export const logger = log.getLogger();

// Path utilities
export const expandPath = (path: string): string =>
  path.startsWith("~/")
    ? path.replace("~/", (Deno.env.get("HOME") || "") + "/")
    : path;

export const exists = async (path: string): Promise<boolean> => {
  try {
    await Deno.stat(expandPath(path));
    return true;
  } catch {
    return false;
  }
};

// Command execution
export async function runCommand(
  cmd: string,
  opts?: { silent?: boolean },
): Promise<CommandResult> {
  const process = new Deno.Command("bash", {
    args: ["-c", cmd],
    stdout: "piped",
    stderr: "piped",
  }).spawn();
  const [{ stdout, stderr }, { success }] = await Promise.all([
    process.output(),
    process.status,
  ]);
  const output = new TextDecoder().decode(stdout);
  const error = new TextDecoder().decode(stderr);
  if (!opts?.silent && !success) {
    logger.error(`Command failed: ${cmd}\n${error}`);
  }
  return { success, output, error };
}

// Formatting utilities
export const formatDuration = (ms: number, precision = 2): string =>
  `${ms.toFixed(precision)}ms`;
export const formatPercentage = (value: number, precision = 1): string =>
  `${value.toFixed(precision)}%`;
export const formatNumber = (value: number, precision = 0): string =>
  Number.isInteger(value) && precision === 0
    ? value.toString()
    : value.toFixed(precision);
export const formatStars = (stars: number): string =>
  stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : stars.toString();
export const calculatePercentageIncrease = (
  oldValue: number,
  newValue: number,
): number => ((newValue - oldValue) / oldValue) * 100;
export const createTimestamp = (): string =>
  new Date().toISOString().replace(/[:.]/g, "-");

// Console output helpers
export const logHeader = (msg: string) =>
  logger.info(bold(`\n${"=".repeat(40)}\n${msg}\n${"=".repeat(40)}`));
export const logSubheader = (msg: string) => logger.info(green(`\n📦 ${msg}`));
export const logResult = (label: string, value: string | number, unit = "") =>
  logger.info(`  ✅ ${label}: ${value}${unit}`);
export const logProgress = (msg: string) => logger.info(`  ${msg}...`);
export const logSuccess = (msg: string) => logger.info(green(msg));
export const logError = (msg: string, err?: Error) => {
  logger.error(msg);
  if (err) {
    logger.error(`   ${err.message}`);
    if (err.stack && logger.levelName === "DEBUG") logger.error(err.stack);
  }
};

// Configuration
export const DEFAULT_CONFIG = {
  hyperfine: { warmupRuns: 1, installRuns: 10, loadRuns: 20, timeout: 120000 },
  paths: { results: "./results", templates: "./src/templates" },
  defaults: { pluginCounts: [0, 25], managers: [] as string[] },
};

export const validateManagers = (
  managers: string[],
  valid: string[],
): string[] => {
  const invalid = managers.filter((manager) => !valid.includes(manager));
  if (invalid.length) {
    throw new Error(
      `Unknown managers: ${invalid.join(", ")}\nValid: ${valid.join(", ")}`,
    );
  }
  return managers;
};

export const parseOptions = (
  args: Record<string, unknown>,
  validManagers: string[],
): BenchmarkOptions => {
  const managers = args.managers && typeof args.managers === "string"
    ? validateManagers(
      args.managers.split(/[\s,]+/).filter(Boolean),
      validManagers,
    )
    : ["vanilla", ...validManagers.filter((manager) => manager !== "vanilla")];

  const pluginCounts = args.counts && typeof args.counts === "string"
    ? args.counts.split(/[\s,]+/).map(Number).filter((num) =>
      !isNaN(num) && num >= 0
    )
    : DEFAULT_CONFIG.defaults.pluginCounts;

  return { managers, pluginCounts };
};

// Plugin definitions
export const ALL_PLUGINS = [
  "zsh-users/zsh-autosuggestions",
  "zsh-users/zsh-syntax-highlighting",
  "zsh-users/zsh-completions",
  "zsh-users/zsh-history-substring-search",
  "supercrabtree/k",
  "chriskempson/base16-shell",
  "zdharma-continuum/fast-syntax-highlighting",
  "MichaelAquilina/zsh-you-should-use",
  "iam4x/zsh-iterm-touchbar",
  "unixorn/git-extra-commands",
  "romkatv/powerlevel10k",
  "mfaerevaag/wd",
  "agkozak/zsh-z",
  "Tarrasch/zsh-autoenv",
  "zsh-users/zaw",
  "djui/alias-tips",
  "changyuheng/fz",
  "rupa/z",
  "olivierverdier/zsh-git-prompt",
  "willghatch/zsh-saneopt",
  "zdharma-continuum/history-search-multi-word",
  "StackExchange/blackbox",
  "b4b4r07/enhancd",
  "fcambus/ansiweather",
  "wting/autojump",
] as const;
