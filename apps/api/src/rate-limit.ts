// Fixed-window limiter kept in memory. One instance per process: behind several instances,
// move it to a shared store (documented in docs/ARCHITECTURE.md section 5).

export class RateLimiter {
  readonly #limit: number;
  readonly #windowMs: number;
  readonly #hits = new Map<string, { count: number; resetAt: number }>();

  constructor(limit: number, windowMs: number) {
    this.#limit = limit;
    this.#windowMs = windowMs;
  }

  /** Records one attempt; returns false when the key is over its limit for the current window. */
  allow(key: string, now = Date.now()): boolean {
    const entry = this.#hits.get(key);
    if (entry === undefined || entry.resetAt <= now) {
      if (this.#hits.size > 10_000) this.#sweep(now);
      this.#hits.set(key, { count: 1, resetAt: now + this.#windowMs });
      return true;
    }
    entry.count += 1;
    return entry.count <= this.#limit;
  }

  #sweep(now: number): void {
    for (const [key, entry] of this.#hits) if (entry.resetAt <= now) this.#hits.delete(key);
  }
}
