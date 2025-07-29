// Utility functions shared across the benchmark project

import { CommandResult } from "./types.ts";

/**
 * Expands tilde (~) in file paths to the user's home directory
 */
export function expandPath(path: string): string {
  if (path.startsWith("~/")) {
    const home = Deno.env.get("HOME") || "";
    return path.replace("~/", home + "/");
  }
  return path;
}

/**
 * Checks if a file or directory exists at the given path
 */
export async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(expandPath(path));
    return true;
  } catch {
    return false;
  }
}

/**
 * Executes a shell command and returns the result
 */
export async function runCommand(
  command: string,
  options?: { silent?: boolean }
): Promise<CommandResult> {
  const cmd = new Deno.Command("bash", {
    args: ["-c", command],
    stdout: "piped",
    stderr: "piped",
  });

  const process = cmd.spawn();
  const { stdout, stderr } = await process.output();
  const { success } = await process.status;

  const output = new TextDecoder().decode(stdout);
  const error = new TextDecoder().decode(stderr);

  if (!options?.silent && !success) {
    console.error(`Command failed: ${command}`);
    console.error(`Error: ${error}`);
  }

  return { success, output, error };
}

/**
 * Formats a duration in milliseconds to a readable string
 */
export function formatDuration(ms: number, precision: number = 2): string {
  return `${ms.toFixed(precision)}ms`;
}

/**
 * Formats a percentage with the specified precision
 */
export function formatPercentage(value: number, precision: number = 1): string {
  return `${value.toFixed(precision)}%`;
}

/**
 * Calculates the percentage increase between two values
 */
export function calculatePercentageIncrease(oldValue: number, newValue: number): number {
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Creates a timestamp string for backup files
 */
export function createTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

/**
 * Formats a number with thousand separators
 */
export function formatNumber(value: number, precision: number = 0): string {
  if (Number.isInteger(value) && precision === 0) {
    return value.toString();
  }
  return value.toFixed(precision);
}

/**
 * Formats stars count with K suffix for thousands
 */
export function formatStars(stars: number): string {
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(1)}k`;
  }
  return stars.toString();
}