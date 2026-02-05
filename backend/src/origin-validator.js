/**
 * Origin Validator Module
 *
 * Validates request origins against an allowed list to prevent
 * unauthorized domains from accessing the TTS proxy
 */

import { forbiddenError } from './error-handler.js';

/**
 * Validate request origin against allowed origins list
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings (contains ALLOWED_ORIGINS)
 * @returns {Object} { valid: boolean, origin: string|null, response: Response|null }
 */
export function validateOrigin(request, env) {
  // 1. Extract origin from request headers
  const origin = extractOrigin(request);

  if (!origin) {
    // No origin header - reject in production, allow in local dev
    if (isLocalDevelopment(request)) {
      console.log('Origin validator: No origin header (local dev - allowing)');
      return { valid: true, origin: null, response: null };
    }

    return {
      valid: false,
      origin: null,
      response: forbiddenError('Missing origin header')
    };
  }

  // 2. Parse allowed origins from environment
  const allowedOrigins = parseAllowedOrigins(env);

  if (allowedOrigins.length === 0) {
    // No origins configured - allow all (dev mode)
    console.log('Origin validator: No ALLOWED_ORIGINS configured (allowing all)');
    return { valid: true, origin, response: null };
  }

  // 3. Check if origin is in allowed list (exact match)
  if (isOriginAllowed(origin, allowedOrigins)) {
    return { valid: true, origin, response: null };
  }

  // 4. Origin not allowed - reject with 403
  console.log(`Origin validator: Rejected origin: ${origin}`);
  return {
    valid: false,
    origin,
    response: forbiddenError('Invalid origin')
  };
}

/**
 * Extract origin from request headers
 * @param {Request} request - Incoming request
 * @returns {string|null} Origin URL or null
 */
function extractOrigin(request) {
  // Primary: Check Origin header (used by CORS requests)
  const origin = request.headers.get('Origin');
  if (origin) {
    return origin;
  }

  // Fallback: Check Referer header
  const referer = request.headers.get('Referer');
  if (referer) {
    try {
      const url = new URL(referer);
      return `${url.protocol}//${url.host}`;
    } catch (error) {
      console.error('Origin validator: Invalid Referer header', error);
      return null;
    }
  }

  return null;
}

/**
 * Parse ALLOWED_ORIGINS environment variable
 * @param {Object} env - Environment bindings
 * @returns {string[]} Array of allowed origin URLs
 */
function parseAllowedOrigins(env) {
  const allowedOriginsStr = env.ALLOWED_ORIGINS;

  if (!allowedOriginsStr || typeof allowedOriginsStr !== 'string') {
    return [];
  }

  // Split by comma and trim whitespace
  return allowedOriginsStr
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);
}

/**
 * Check if origin is in allowed list (exact match)
 * @param {string} origin - Request origin URL
 * @param {string[]} allowedOrigins - List of allowed origins
 * @returns {boolean} True if origin is allowed
 */
function isOriginAllowed(origin, allowedOrigins) {
  // Exact match only - no wildcards or pattern matching for security
  return allowedOrigins.includes(origin);
}

/**
 * Detect if running in local development mode
 * @param {Request} request - Incoming request
 * @returns {boolean} True if local development
 */
function isLocalDevelopment(request) {
  const url = new URL(request.url);

  // Check if hostname is localhost or 127.0.0.1
  return url.hostname === 'localhost' ||
         url.hostname === '127.0.0.1' ||
         url.hostname === '0.0.0.0';
}
