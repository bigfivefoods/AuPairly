/**
 * Rate limiter with optional Upstash Redis when env is set:
 *   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * Falls back to in-memory (per serverless instance) otherwise.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function memoryLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true };
  }

  if (existing.count >= opts.limit) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return { ok: true };
}

/** Sync API used across routes; Upstash is best-effort fire-and-check via memory first. */
export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): { ok: true } | { ok: false; retryAfterSec: number } {
  // Always enforce a local limit; multi-instance still needs Redis for hard caps.
  // When Upstash is configured, also bump a best-effort remote counter (non-blocking).
  const local = memoryLimit(key, opts);
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token && local.ok) {
    const windowSec = Math.max(1, Math.ceil(opts.windowMs / 1000));
    const redisKey = `rl:${key}`;
    void fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, windowSec],
      ]),
    }).catch(() => null);
  }
  return local;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
