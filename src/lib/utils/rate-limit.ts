/**
 * Lightweight in-memory rate limiter for Next.js API routes.
 * Uses a sliding window counter per identifier (IP or user ID).
 *
 * NOTE: In a multi-instance deployment, use Redis (e.g. Upstash) instead of
 * this in-process Map. For single-instance / Vercel Edge this is sufficient.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // unix ms
}

const store = new Map<string, RateLimitEntry>();

// Purge expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  /** How many requests are allowed within the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Epoch ms when the window resets */
  resetAt: number;
}

/**
 * Check whether `identifier` has exceeded the rate limit.
 *
 * @example
 * const ip = req.headers.get("x-forwarded-for") ?? "unknown";
 * const { success } = checkRateLimit(ip, { limit: 10, windowMs: 60_000 });
 * if (!success) return NextResponse.json({ ... }, { status: 429 });
 */
export function checkRateLimit(
  identifier: string,
  { limit, windowMs }: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetAt < now) {
    // First request or window expired — start a fresh window
    const resetAt = now + windowMs;
    store.set(identifier, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }

  entry.count += 1;

  if (entry.count > limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  return {
    success: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}
