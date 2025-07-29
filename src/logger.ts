// Logging utilities with consistent formatting

import { green, red, yellow, blue, bold } from "https://deno.land/std@0.220.0/fmt/colors.ts";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  public level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  debug(message: string): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(blue(`[DEBUG] ${message}`));
    }
  }

  info(message: string): void {
    if (this.level <= LogLevel.INFO) {
      console.log(message);
    }
  }

  success(message: string): void {
    if (this.level <= LogLevel.INFO) {
      console.log(green(message));
    }
  }

  warn(message: string): void {
    if (this.level <= LogLevel.WARN) {
      console.log(yellow(`⚠️  ${message}`));
    }
  }

  error(message: string, error?: Error): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(red(`❌ ${message}`));
      if (error) {
        console.error(red(`   ${error.message}`));
        if (error.stack && this.level === LogLevel.DEBUG) {
          console.error(red(error.stack));
        }
      }
    }
  }

  header(message: string): void {
    console.log(bold(`\n${"=".repeat(40)}`));
    console.log(bold(message));
    console.log(bold(`${"=".repeat(40)}`));
  }

  subheader(message: string): void {
    console.log(green(`\n📦 ${message}`));
  }

  result(label: string, value: string | number, unit: string = ""): void {
    console.log(`  ✅ ${label}: ${value}${unit}`);
  }

  progress(message: string): void {
    console.log(`  ${message}...`);
  }
}

// Default logger instance
export const logger = new Logger();