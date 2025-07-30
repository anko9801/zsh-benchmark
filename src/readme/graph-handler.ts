// SVG graph detection

import { GraphInfo } from "./types.ts";

export class GraphHandler {
  async detectGraphs(resultsDir = "results"): Promise<GraphInfo[]> {
    const graphs: GraphInfo[] = [];
    
    try {
      for await (const entry of Deno.readDir(resultsDir)) {
        if (entry.isFile && entry.name.endsWith(".svg")) {
          const path = `${resultsDir}/${entry.name}`;
          const title = this.getTitle(entry.name);
          const caption = this.getCaption(entry.name);
          graphs.push({ title, path, caption });
        }
      }
    } catch {
      // Ignore errors
    }
    
    return graphs.sort((a, b) => a.path.localeCompare(b.path));
  }
  
  private getTitle(filename: string): string {
    if (filename.includes("load-time")) return "Load Time Comparison";
    if (filename.includes("install-time")) return "Installation Time Comparison";
    return "Benchmark Chart";
  }
  
  private getCaption(filename: string): string {
    if (filename.includes("load-time")) return "Shell startup time comparison across different plugin managers";
    if (filename.includes("install-time")) return "Plugin installation time comparison across different plugin managers";
    return "";
  }
}
