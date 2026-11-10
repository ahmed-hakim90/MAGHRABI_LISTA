/**
 * Per-instance fixed-window limiter. On Vercel each function instance keeps
 * its own map, so this slows abuse but is not a global guarantee.
 */
export function createMemoryRateLimiter(options: {
  windowMs: number;
  max: number;
}) {
  const buckets = new Map<string, { count: number; windowStart: number }>();

  return function allow(key: string): boolean {
    const now = Date.now();
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) {
        if (now - b.windowStart > options.windowMs) buckets.delete(k);
      }
    }
    const bucket = buckets.get(key);
    if (!bucket || now - bucket.windowStart > options.windowMs) {
      buckets.set(key, { count: 1, windowStart: now });
      return true;
    }
    if (bucket.count >= options.max) return false;
    bucket.count += 1;
    return true;
  };
}

export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
