// Logging utilities with consistent formatting

import {
  blue,
  bold,
  green,
  red,
  yellow,
} from "https://deno.land/std@0.220.0/fmt/colors.ts";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  constructor(public level: LogLevel = LogLevel.INFO) {}

  private log(
    level: LogLevel,
    message: string,
    color?: (str: string) => string,
  ): void {
    if (this.level <= level) {
      console.log(color ? color(message) : message);
    }
  }

  debug = (message: string) =>
    this.log(LogLevel.DEBUG, `[DEBUG] ${message}`, blue);
  info = (message: string) => this.log(LogLevel.INFO, message);
  success = (message: string) => this.log(LogLevel.INFO, message, green);
  warn = (message: string) => this.log(LogLevel.WARN, `⚠️  ${message}`, yellow);

  error(message: string, error?: Error): void {
    if (this.level > LogLevel.ERROR) return;
    console.error(red(`❌ ${message}`));
    if (error) {
      console.error(red(`   ${error.message}`));
      if (error.stack && this.level === LogLevel.DEBUG) {
        console.error(red(error.stack));
      }
    }
  }

  header(message: string): void {
    const separator = "=".repeat(40);
    console.log(bold(`\n${separator}\n${message}\n${separator}`));
  }

  subheader = (message: string) => console.log(green(`\n📦 ${message}`));
  result = (label: string, value: string | number, unit = "") =>
    console.log(`  ✅ ${label}: ${value}${unit}`);
  progress = (message: string) => console.log(`  ${message}...`);
}

// Default logger instance
export const logger = new Logger();
