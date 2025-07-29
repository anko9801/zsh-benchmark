// Performance monitoring utilities

export class PerformanceMonitor {
  private marks = new Map<string, number>();
  private measures: Array<{ name: string; duration: number }> = [];

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    if (!start) {
      throw new Error(`Mark "${startMark}" not found`);
    }

    const end = endMark ? this.marks.get(endMark) : performance.now();
    if (!end) {
      throw new Error(`Mark "${endMark}" not found`);
    }

    const duration = end - start;
    this.measures.push({ name, duration });
    return duration;
  }

  getReport(): string {
    const lines: string[] = ["Performance Report:"];

    for (const measure of this.measures) {
      lines.push(`  ${measure.name}: ${measure.duration.toFixed(2)}ms`);
    }

    const total = this.measures.reduce((sum, m) => sum + m.duration, 0);
    lines.push(`  Total: ${total.toFixed(2)}ms`);

    return lines.join("\n");
  }

  clear(): void {
    this.marks.clear();
    this.measures = [];
  }
}
