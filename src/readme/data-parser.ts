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
    const obj = data as Record<string, unknown>;
    if (!data || typeof data !== "object" || !Array.isArray(obj.results)) {
      throw createError(ErrorCode.VALIDATION_ERROR, {
        reason: !data
          ? "Data must be an object"
          : "Missing or invalid results array",
      });
    }

    obj.results.forEach((r) => this.validateBenchmarkResult(r));
    return {
      results: obj.results as BenchmarkResult[],
      metadata: obj.metadata as BenchmarkData["metadata"],
    };
  }

  private validateBenchmarkResult(result: unknown): void {
    const r = result as Record<string, unknown>;
    const checks = [
      [!result || typeof result !== "object", "Invalid benchmark result"],
      [typeof r.manager !== "string", "Missing or invalid manager name"],
      [typeof r.pluginCount !== "number", "Missing or invalid plugin count"],
      [
        r.loadTime !== null && typeof r.loadTime !== "number",
        "Invalid load time",
      ],
      [
        r.installTime !== null && typeof r.installTime !== "number",
        "Invalid install time",
      ],
    ] as const;

    const error = checks.find(([condition]) => condition);
    if (error) {
      throw createError(ErrorCode.VALIDATION_ERROR, { reason: error[1] });
    }
  }

  extractMetadata(
    data: BenchmarkData,
  ): { timestamp: Date; environment: EnvironmentInfo } {
    return {
      timestamp: data.metadata?.executedAt
        ? new Date(data.metadata.executedAt)
        : new Date(),
      environment: {},
    };
  }

  private parseManagers(results: BenchmarkResult[]): ManagerData[] {
    return Array.from(
      results.reduce((map, result) => {
        const manager = map.get(result.manager) ||
          map.set(result.manager, new Map()).get(result.manager)!;
        manager.set(result.pluginCount, result);
        return map;
      }, new Map<string, Map<number, BenchmarkResult>>()),
      ([name, results]) => ({ name, results }),
    ).sort((a, b) => a.name.localeCompare(b.name));
  }

  private extractPluginCounts(results: BenchmarkResult[]): number[] {
    return [...new Set(results.map((r) => r.pluginCount))].sort((a, b) =>
      a - b
    );
  }
}
