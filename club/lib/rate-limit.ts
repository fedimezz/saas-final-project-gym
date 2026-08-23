// src/lib/rate-limit.ts
//
// Distributed rate limiter backed by Upstash Redis (@upstash/ratelimit).
// Replaces the previous in-memory sliding window — this now works
// correctly across multiple serverless instances since the counters
// live in Redis, not in a single Node process.
//
// Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in env.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// One Ratelimit instance per distinct (limit, windowMs) pair, cached so we
// don't recreate the sliding-window algorithm object on every call. Call
// sites pass whatever (limit, windowMs) they already used with the old
// in-memory version — nothing else changes for them except `await`.
const limiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}:${windowMs}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      // Keys are already namespaced by the caller (e.g. `login:${ip}`);
      // this prefix just avoids collisions with any other Redis usage.
      prefix: "ratelimit",
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

/**
 * @param key unique identifier for the caller, e.g. `login:${ip}` or `login:${email}`
 * @param limit max requests allowed within the window
 * @param windowMs window size in milliseconds
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const limiter = getLimiter(limit, windowMs);
  const result = await limiter.limit(key);
  return {
    allowed: result.success,
    remaining: result.remaining,
    resetAt: result.reset,
  };
}

/** Best-effort client IP extraction behind common proxies (Vercel, nginx). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
