/**
 * Simple in-memory rate limiting using token bucket
 * Note: Resets on server restart (acceptable for MVP)
 */

interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if a request should be rate limited
 * @param key - Unique identifier (email or IP)
 * @param limit - Maximum number of requests
 * @param windowMs - Time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    rateLimitStore.set(key, { timestamps: [now] });
    return true;
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter(ts => now - ts < windowMs);

  // Check if limit exceeded
  if (entry.timestamps.length >= limit) {
    return false;
  }

  // Add current timestamp
  entry.timestamps.push(now);
  return true;
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

