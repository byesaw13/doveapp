/**
 * Rate limiting utilities
 * In-memory implementation for development
 * For production, use Redis or a proper rate limiting service
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (will be lost on server restart)
// For production, use Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  maxRequests: number; // Maximum number of requests
  windowMs: number; // Time window in milliseconds
}

// Default rate limits
export const RATE_LIMITS = {
  API_DEFAULT: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 req/min
  API_STRICT: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 req/min
  AUTH: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 req/min
  EXPORTS: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 req/min
};

/**
 * Check if a request should be rate limited
 * @returns true if request should be allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.API_DEFAULT
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);

  // If no entry or window has expired, create new entry
  if (!entry || now >= entry.resetAt) {
    entry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count += 1;
  rateLimitStore.set(key, entry);

  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Create rate limit response headers
 */
export function getRateLimitHeaders(
  remaining: number,
  resetAt: number
): Record<string, string> {
  return {
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(resetAt).toISOString(),
    'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString(),
  };
}

/**
 * Clean up expired entries periodically
 * Call this from a background task or cron job
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
