/**
 * Error Handler Module
 * Formats error responses and provides logging utilities
 */

/**
 * Format error response with consistent structure
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} additionalFields - Additional fields (e.g., retryAfter)
 * @returns {Response} Formatted error response
 */
export function formatErrorResponse(message, statusCode, additionalFields = {}) {
  const errorBody = {
    error: message,
    code: statusCode,
    ...additionalFields
  };

  return new Response(JSON.stringify(errorBody), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Create 429 Rate Limit error response
 * @param {number} retryAfter - Seconds until retry allowed
 * @returns {Response} 429 error response
 */
export function rateLimitError(retryAfter) {
  return formatErrorResponse('Rate limit exceeded', 429, { retryAfter });
}

/**
 * Create 403 Forbidden error response
 * @param {string} reason - Reason for rejection (e.g., "Invalid origin")
 * @returns {Response} 403 error response
 */
export function forbiddenError(reason = 'Forbidden') {
  return formatErrorResponse(`Forbidden: ${reason}`, 403);
}

/**
 * Create 400 Bad Request error response
 * @param {string} reason - Reason for bad request
 * @returns {Response} 400 error response
 */
export function badRequestError(reason) {
  return formatErrorResponse(`Bad request: ${reason}`, 400);
}

/**
 * Create 500 Internal Server Error response
 * @param {string} message - Error message
 * @param {string} details - Additional error details (sanitized)
 * @returns {Response} 500 error response
 */
export function internalServerError(message, details = null) {
  const additionalFields = details ? { details } : {};
  return formatErrorResponse(message, 500, additionalFields);
}

/**
 * Log request information for monitoring
 * @param {Request} request - Incoming request
 * @param {string} ip - Client IP address
 * @param {number} statusCode - Response status code
 * @param {number} latencyMs - Request latency in milliseconds
 */
export function logRequest(request, ip, statusCode, latencyMs) {
  const timestamp = new Date().toISOString();
  const method = request.method;
  const url = new URL(request.url);
  const pathname = url.pathname;

  console.log(JSON.stringify({
    timestamp,
    ip,
    method,
    pathname,
    statusCode,
    latencyMs,
    origin: request.headers.get('Origin') || 'none'
  }));
}

/**
 * Log error without exposing sensitive information
 * @param {string} context - Error context (e.g., "TTS API call")
 * @param {Error} error - Error object
 */
export function logError(context, error) {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    context,
    error: error.message,
    // Never log stack traces or sensitive data in production
  }));
}
