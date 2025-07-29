// Data parser for benchmark results

import {
  BenchmarkData,
  EnvironmentInfo,
  ManagerData,
  ParsedData,
} from "./types.ts";
import { createError, ErrorCode } from "./errors.ts";
import { BenchmarkResult } from "../types.ts";

export class DataParser {
  async parse(filePath: string): Promise<ParsedData> {
    try {
      // Read JSON file
      const jsonContent = await Deno.readTextFile(filePath);
      const rawData = JSON.parse(jsonContent);

      // Validate and convert
      const benchmarkData = this.validate(rawData);

      // Extract metadata
      const metadata = this.extractMetadata(benchmarkData);

      // Parse results
      const managers = this.parseManagers(benchmarkData.results);
      const pluginCounts = this.extractPluginCounts(benchmarkData.results);

      return {
        managers,
        pluginCounts,
        timestamp: metadata.timestamp,
        environment: metadata.environment,
      };
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw createError(ErrorCode.FILE_NOT_FOUND, { filePath });
      }
      if (error instanceof SyntaxError) {
        throw createError(ErrorCode.INVALID_JSON, { error: error.message });
      }
      throw error;
    }
  }

  validate(data: unknown): BenchmarkData {
    if (!data || typeof data !== "object") {
      throw createError(ErrorCode.VALIDATION_ERROR, {
        reason: "Data must be an object",
      });
    }

    const obj = data as Record<string, unknown>;

    if (!Array.isArray(obj.results)) {
      throw createError(ErrorCode.VALIDATION_ERROR, {
        reason: "Missing or invalid results array",
      });
    }

    // Validate each result
    for (const result of obj.results) {
      this.validateBenchmarkResult(result);
    }

    return {
      results: obj.results as BenchmarkResult[],
      metadata: obj.metadata as BenchmarkData["metadata"],
    };
  }

  private validateBenchmarkResult(result: unknown): void {
    if (!result || typeof result !== "object") {
      throw createError(ErrorCode.VALIDATION_ERROR, {
        reason: "Invalid benchmark result",
      });
    }

    const r = result as Record<string, unknown>;

    if (typeof r.manager !== "string") {
      throw createError(ErrorCode.VALIDATION_ERROR, {
        reason: "Missing or invalid manager name",
      });
    }

    if (typeof r.pluginCount !== "number") {
      throw createError(ErrorCode.VALIDATION_ERROR, {
        reason: "Missing or invalid plugin count",
      });
    }

    // loadTime and installTime can be null or number
    if (r.loadTime !== null && typeof r.loadTime !== "number") {
      throw createError(ErrorCode.VALIDATION_ERROR, {
        reason: "Invalid load time",
      });
    }

    if (r.installTime !== null && typeof r.installTime !== "number") {
      throw createError(ErrorCode.VALIDATION_ERROR, {
        reason: "Invalid install time",
      });
    }
  }

  extractMetadata(data: BenchmarkData): {
    timestamp: Date;
    environment: EnvironmentInfo;
  } {
    const now = new Date();

    // Extract timestamp from metadata or use current time
    const timestamp = data.metadata?.executedAt
      ? new Date(data.metadata.executedAt)
      : now;

    // Extract environment info
    const environment: EnvironmentInfo = data.metadata?.environment || {};

    // Try to get current environment if not provided
    if (!environment.os) {
      environment.os = Deno.build.os;
    }

    if (!environment.denoVersion) {
      environment.denoVersion = Deno.version.deno;
    }

    return { timestamp, environment };
  }

  private parseManagers(results: BenchmarkResult[]): ManagerData[] {
    const managerMap = new Map<string, Map<number, BenchmarkResult>>();

    // Group results by manager
    for (const result of results) {
      if (!managerMap.has(result.manager)) {
        managerMap.set(result.manager, new Map());
      }

      const managerResults = managerMap.get(result.manager)!;
      managerResults.set(result.pluginCount, result);
    }

    // Convert to array
    const managers: ManagerData[] = [];
    for (const [name, results] of managerMap) {
      managers.push({ name, results });
    }

    // Sort by name for consistency
    managers.sort((a, b) => a.name.localeCompare(b.name));

    return managers;
  }

  private extractPluginCounts(results: BenchmarkResult[]): number[] {
    const counts = new Set<number>();

    for (const result of results) {
      counts.add(result.pluginCount);
    }

    return Array.from(counts).sort((a, b) => a - b);
  }
}
