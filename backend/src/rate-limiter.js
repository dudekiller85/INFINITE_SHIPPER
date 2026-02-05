/**
 * Rate Limiter Module
 *
 * Implements IP-based rate limiting using Cloudflare Workers KV
 * Limit: 30 requests per minute per IP address
 */

import { rateLimitError } from './error-handler.js';

/**
 * Check and enforce rate limit for IP address
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings (contains RATE_LIMIT_KV)
 * @returns {Object} { allowed: boolean, response: Response|null }
 */
export async function checkRateLimit(request, env) {
  // 1. Extract IP address from Cloudflare header
  const ip = extractIP(request);

  if (!ip) {
    // If we can't get IP, allow request (fail open for availability)
    console.warn('Rate limiter: Could not extract IP, allowing request');
    return { allowed: true, response: null };
  }

  // 2. Check if KV namespace is configured
  if (!env.RATE_LIMIT_KV) {
    console.warn('Rate limiter: KV namespace not configured, allowing request');
    return { allowed: true, response: null };
  }

  // 3. Get rate limit threshold from env (default: 30)
  const threshold = parseInt(env.RATE_LIMIT_THRESHOLD) || 30;

  // 4. Generate rate limit key for current minute
  const rateLimitKey = generateRateLimitKey(ip);

  // 5. Get current request count from KV
  const currentCount = await getRateLimitCount(env.RATE_LIMIT_KV, rateLimitKey);

  // 6. Check if limit exceeded
  if (currentCount >= threshold) {
    const retryAfter = calculateRetryAfter();
    return {
      allowed: false,
      response: rateLimitError(retryAfter)
    };
  }

  // 7. Increment counter with 60-second TTL
  await incrementRateLimitCount(env.RATE_LIMIT_KV, rateLimitKey, currentCount);

  return { allowed: true, response: null };
}

/**
 * Extract client IP from request headers
 * @param {Request} request - Incoming request
 * @returns {string|null} IP address or null
 */
function extractIP(request) {
  // Cloudflare provides the real client IP in CF-Connecting-IP header
  const cfIP = request.headers.get('CF-Connecting-IP');
  if (cfIP) {
    return cfIP;
  }

  // Fallback for local development
  const xForwardedFor = request.headers.get('X-Forwarded-For');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  // Last resort: return a placeholder (local dev)
  return 'localhost';
}

/**
 * Generate rate limit key for current minute
 * Format: ratelimit:{ip}:{minute}
 * @param {string} ip - Client IP address
 * @returns {string} Rate limit key
 */
function generateRateLimitKey(ip) {
  // Get current minute timestamp (Unix timestamp / 60)
  const minute = Math.floor(Date.now() / 60000);

  return `ratelimit:${ip}:${minute}`;
}

/**
 * Get current request count from KV
 * @param {KVNamespace} kv - Workers KV namespace
 * @param {string} key - Rate limit key
 * @returns {Promise<number>} Current request count
 */
async function getRateLimitCount(kv, key) {
  try {
    const value = await kv.get(key);

    if (value === null) {
      return 0; // No entry means no requests yet this minute
    }

    return parseInt(value) || 0;
  } catch (error) {
    console.error('Rate limiter: Error reading from KV', error);
    return 0; // Fail open on KV errors
  }
}

/**
 * Increment rate limit counter with 60-second TTL
 * @param {KVNamespace} kv - Workers KV namespace
 * @param {string} key - Rate limit key
 * @param {number} currentCount - Current request count
 * @returns {Promise<void>}
 */
async function incrementRateLimitCount(kv, key, currentCount) {
  try {
    const newCount = currentCount + 1;

    // Store with 60-second expiration (TTL)
    await kv.put(key, newCount.toString(), {
      expirationTtl: 60
    });
  } catch (error) {
    console.error('Rate limiter: Error writing to KV', error);
    // Don't throw - fail open to maintain availability
  }
}

/**
 * Calculate seconds until next minute (for Retry-After header)
 * @returns {number} Seconds until rate limit resets
 */
function calculateRetryAfter() {
  const now = Date.now();
  const currentMinute = Math.floor(now / 60000) * 60000;
  const nextMinute = currentMinute + 60000;
  const secondsUntilReset = Math.ceil((nextMinute - now) / 1000);

  return secondsUntilReset;
}
