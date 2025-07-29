// SVG graph detection and integration

import { GraphInfo } from "./types.ts";
import { basename, join } from "https://deno.land/std@0.220.0/path/mod.ts";

export class GraphHandler {
  async detectGraphs(resultsDir = "results"): Promise<GraphInfo[]> {
    const graphs: GraphInfo[] = [];

    try {
      // Read directory contents
      const entries = [];
      for await (const entry of Deno.readDir(resultsDir)) {
        if (entry.isFile && entry.name.endsWith(".svg")) {
          entries.push(entry.name);
        }
      }

      // Sort files for consistent ordering
      entries.sort();

      // Process each SVG file
      for (const filename of entries) {
        const path = join(resultsDir, filename);
        const info = this.createGraphInfo(path, filename);
        graphs.push(info);
      }
    } catch (error) {
      console.warn(`Failed to read graphs from ${resultsDir}:`, error);
    }

    return graphs;
  }

  private createGraphInfo(path: string, filename: string): GraphInfo {
    const name = basename(filename, ".svg");

    // Determine title and caption based on filename patterns
    let title = "Benchmark Chart";
    let caption = "";

    if (name.includes("load-time")) {
      title = "Load Time Comparison";
      caption =
        "Shell startup time comparison across different plugin managers";
    } else if (name.includes("install-time")) {
      title = "Installation Time Comparison";
      caption =
        "Plugin installation time comparison across different plugin managers";
    } else if (name.includes("scalability")) {
      title = "Scalability Analysis";
      caption = "Performance scaling with increasing plugin counts";
    } else if (name.includes("comparison")) {
      title = "Overall Comparison";
      caption = "Comprehensive performance comparison";
    }

    return {
      title,
      path,
      caption,
    };
  }

  generateMarkdown(graphs: GraphInfo[]): string {
    if (graphs.length === 0) {
      return "_No performance graphs available. Run benchmarks to generate visualizations._";
    }

    const sections: string[] = [];

    for (const graph of graphs) {
      sections.push(`#### ${graph.title}\n`);
      sections.push(`![${graph.title}](${graph.path})\n`);
      if (graph.caption) {
        sections.push(`_${graph.caption}_\n`);
      }
    }

    return sections.join("\n");
  }

  // Helper to check if a specific graph exists
  async graphExists(graphPath: string): Promise<boolean> {
    try {
      const stat = await Deno.stat(graphPath);
      return stat.isFile;
    } catch {
      return false;
    }
  }
}
