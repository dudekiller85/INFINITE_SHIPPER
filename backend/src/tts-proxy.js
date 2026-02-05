/**
 * TTS Proxy Module
 *
 * Handles proxying TTS synthesis requests to Google Cloud TTS API
 * with secure API key management and error handling
 */

import {
  badRequestError,
  internalServerError,
  logError
} from './error-handler.js';

/**
 * Proxy TTS synthesis request to Google Cloud TTS API
 * @param {Request} request - Incoming request from frontend
 * @param {Object} env - Environment bindings (contains GOOGLE_TTS_API_KEY)
 * @returns {Response} Response with synthesized audio or error
 */
export async function proxyTTSRequest(request, env) {
  try {
    // 1. Validate API key is configured
    if (!env.GOOGLE_TTS_API_KEY) {
      logError('TTS Proxy', new Error('API key not configured'));
      return internalServerError('Internal configuration error');
    }

    // 2. Parse and validate request payload
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return badRequestError('Invalid JSON payload');
    }

    const validation = validateTTSRequest(requestBody);
    if (!validation.valid) {
      return badRequestError(validation.error);
    }

    // 3. Forward request to Google Cloud TTS API
    const ttsResponse = await callGoogleTTS(requestBody, env.GOOGLE_TTS_API_KEY);

    // 4. Handle TTS API response
    if (!ttsResponse.ok) {
      const errorData = await ttsResponse.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || 'TTS synthesis failed';

      logError('Google TTS API', new Error(`Status ${ttsResponse.status}: ${errorMessage}`));

      return internalServerError('TTS synthesis failed', sanitizeErrorDetails(errorMessage));
    }

    // 5. Forward successful response to frontend with CORS headers
    const ttsData = await ttsResponse.json();
    const origin = request.headers.get('Origin') || '*';

    return new Response(JSON.stringify(ttsData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      }
    });

  } catch (error) {
    logError('TTS Proxy', error);
    return internalServerError('An unexpected error occurred');
  }
}

/**
 * Validate TTS request payload
 * @param {Object} body - Request body to validate
 * @returns {Object} { valid: boolean, error: string }
 */
function validateTTSRequest(body) {
  // Check for required top-level fields
  if (!body.input || !body.voice || !body.audioConfig) {
    return {
      valid: false,
      error: 'Missing required fields: input, voice, audioConfig'
    };
  }

  // Validate input.ssml
  if (!body.input.ssml || typeof body.input.ssml !== 'string') {
    return {
      valid: false,
      error: 'input.ssml must be a non-empty string'
    };
  }

  // Validate SSML format (basic check)
  if (!body.input.ssml.includes('<speak>')) {
    return {
      valid: false,
      error: 'SSML must be wrapped in <speak> tags'
    };
  }

  // Validate voice
  if (!body.voice.languageCode || !body.voice.name) {
    return {
      valid: false,
      error: 'voice must include languageCode and name'
    };
  }

  // Validate audioConfig
  if (!body.audioConfig.audioEncoding || !body.audioConfig.sampleRateHertz) {
    return {
      valid: false,
      error: 'audioConfig must include audioEncoding and sampleRateHertz'
    };
  }

  return { valid: true };
}

/**
 * Call Google Cloud TTS API
 * @param {Object} requestBody - TTS request payload
 * @param {string} apiKey - Google Cloud API key (from env.GOOGLE_TTS_API_KEY)
 * @returns {Promise<Response>} Fetch response from Google TTS API
 */
async function callGoogleTTS(requestBody, apiKey) {
  const endpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
}

/**
 * Sanitize error details to avoid exposing sensitive information
 * @param {string} errorMessage - Raw error message from TTS API
 * @returns {string} Sanitized error message
 */
function sanitizeErrorDetails(errorMessage) {
  // Remove any potential API key fragments
  let sanitized = errorMessage.replace(/AIza[a-zA-Z0-9_-]{35}/g, '[REDACTED]');

  // Remove sensitive paths or identifiers
  sanitized = sanitized.replace(/\/[a-z0-9_-]{20,}/gi, '[PATH]');

  return sanitized;
}
