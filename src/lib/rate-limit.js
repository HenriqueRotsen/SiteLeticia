const buckets = new Map();

export function checkRateLimit(key, { limit = 10, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const entry = buckets.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }

  entry.count += 1;
  buckets.set(key, entry);

  if (entry.count > limit) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  return { allowed: true, remaining: limit - entry.count };
}

export function rateLimitResponse(retryAfterMs) {
  return new Response(
    JSON.stringify({ message: "Muitas tentativas. Tente novamente em instantes." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil(retryAfterMs / 1000))
      }
    }
  );
}
