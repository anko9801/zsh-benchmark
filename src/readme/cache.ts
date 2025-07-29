// Simple in-memory cache with TTL

export class Cache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private ttl: number;

  constructor(ttlMs: number = 15 * 60 * 1000) { // Default 15 minutes
    this.ttl = ttlMs;
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    // Clean up expired entries first
    for (const [key, entry] of this.cache.entries()) {
      if (Date.now() - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }
}
