/**
 * INFINITE_SHIPPER TTS Proxy - Main Worker Entry Point
 *
 * Cloudflare Worker that securely proxies TTS requests to Google Cloud TTS API
 * Features:
 * - API key security (server-side only, never exposed to client)
 * - Rate limiting (30 requests/minute per IP)
 * - Origin validation (authorized domains only)
 * - CORS support
 *
 * Constitution: Meets v1.1.0 Principle II security testing exception
 */

import { proxyTTSRequest } from './tts-proxy.js';
import { logRequest, logError } from './error-handler.js';
import { checkRateLimit } from './rate-limiter.js';
import { validateOrigin } from './origin-validator.js';

/**
 * Main Worker fetch handler
 * @param {Request} request - Incoming HTTP request
 * @param {Object} env - Environment bindings (secrets, KV, etc.)
 * @param {Object} ctx - Execution context
 * @returns {Response} HTTP response
 */
export default {
  async fetch(request, env, ctx) {
    const startTime = Date.now();
    const url = new URL(request.url);

    try {
      // Handle CORS preflight (OPTIONS)
      if (request.method === 'OPTIONS') {
        return handleCORSPreflight(request, env);
      }

      // Health check endpoint
      if (request.method === 'GET' && url.pathname === '/') {
        return new Response(JSON.stringify({
          service: 'INFINITE_SHIPPER TTS Proxy',
          status: 'operational',
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // Main TTS synthesis endpoint
      if (request.method === 'POST' && url.pathname === '/synthesize') {
        // 1. Validate origin first
        const originResult = validateOrigin(request, env);
        if (!originResult.valid) {
          const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
          logRequest(request, ip, 403, Date.now() - startTime);
          return originResult.response;
        }

        // 2. Check rate limit before processing request
        const rateLimitResult = await checkRateLimit(request, env);
        if (!rateLimitResult.allowed) {
          const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
          logRequest(request, ip, 429, Date.now() - startTime);
          return rateLimitResult.response;
        }

        // 3. Proxy the TTS request
        const response = await proxyTTSRequest(request, env);

        // Log request
        const latencyMs = Date.now() - startTime;
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        logRequest(request, ip, response.status, latencyMs);

        return response;
      }

      // 404 for unknown routes
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: 'Unknown endpoint. POST to /synthesize for TTS synthesis.'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      logError('Worker fetch', error);

      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * Handle CORS preflight OPTIONS request
 * @param {Request} request - Incoming OPTIONS request
 * @param {Object} env - Environment bindings
 * @returns {Response} CORS preflight response
 */
function handleCORSPreflight(request, env) {
  // Validate origin for CORS preflight
  const originResult = validateOrigin(request, env);

  if (!originResult.valid) {
    // Reject CORS preflight from unauthorized origin
    return originResult.response;
  }

  // Allow CORS preflight for validated origin
  const origin = originResult.origin || request.headers.get('Origin') || '*';

  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // 24 hours
    }
  });
}
