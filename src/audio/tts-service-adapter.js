/**
 * TTS Service Adapter
 *
 * Adapters for Text-to-Speech services (Google Cloud, AWS Polly, etc.)
 * providing a unified interface for SSML synthesis with error handling,
 * retry logic, and usage statistics tracking.
 *
 * Phase 2: T008 - Skeleton Implementation
 */

// API key now securely managed by backend Worker proxy
// import { TTS_API_KEY } from '../config.js';  // REMOVED - No longer needed

/**
 * GoogleCloudTTSAdapter
 *
 * Adapter for Google Cloud Text-to-Speech API.
 * Handles SSML synthesis, API calls, audio decoding, and error handling
 * with automatic retry on transient failures.
 *
 * @class
 */
export class GoogleCloudTTSAdapter {
  /**
   * Constructor
   *
   * Initializes the Google Cloud TTS adapter with configuration.
   * Sets up API client, retry settings, and metrics tracking.
   *
   * @param {Object} config - Configuration object
   * @param {string} config.apiKey - Google Cloud API key (defaults to TTS_API_KEY from config)
   * @param {number} config.timeout - API timeout in milliseconds (default: 5000)
   * @param {number} config.retryAttempts - Number of retry attempts (default: 3)
   * @param {number} config.retryDelay - Base delay between retries in ms (default: 100)
   * @param {Object} config.voice - Voice configuration
   * @param {string} config.voice.languageCode - Language code (default: "en-GB")
   * @param {string} config.voice.name - Voice name (default: "en-GB-Neural2-B")
   * @param {Object} config.audioConfig - Audio configuration
   * @param {string} config.audioConfig.encoding - Audio encoding (default: "MP3")
   * @param {number} config.audioConfig.sampleRate - Sample rate Hz (default: 24000)
   * @param {boolean} config.enableMetrics - Enable usage metrics (default: true)
   * @param {boolean} config.logRequests - Log API requests (default: false)
   *
   * TODO: Implement configuration validation in Phase 3
   * TODO: Initialize HTTP client with proper headers
   * TODO: Set up metrics collection
   */
  constructor(config = {}) {
    // TODO: Validate config structure
    // TODO: Store configuration with defaults
    // TODO: Initialize stats tracking object
    // TODO: Setup retry policy with exponential backoff

    // API key removed - now handled by backend Worker proxy
    this.apiKey = null;  // No longer needed in frontend
    this.timeout = config.timeout || 5000;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 100;
    this.voice = config.voice || {
      languageCode: 'en-GB',
      name: 'en-GB-Neural2-D'
    };
    this.audioConfig = config.audioConfig || {
      encoding: 'MP3',
      sampleRate: 24000
    };
    this.stats = {
      requestCount: 0,
      successCount: 0,
      failureCount: 0,
      characterCount: 0,
      estimatedCost: 0,
      lastRequestAt: null,
      averageLatency: 0
    };
    this.enableMetrics = config.enableMetrics !== false;
    this.logRequests = config.logRequests || false;

    // Initialize persistent AudioContext for decoding (browser only)
    this.audioContext = null;
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  /**
   * Synthesize SSML template into audio
   *
   * Main entry point for converting an SSML template into audio bytes.
   * Handles the full synthesis workflow including validation, API calls,
   * error handling, retries, and metrics tracking.
   *
   * @async
   * @param {Object} ssmlTemplate - SSML template object
   * @param {string} ssmlTemplate.ssml - SSML markup
   * @param {string} ssmlTemplate.reportId - Unique report identifier
   * @param {string} ssmlTemplate.areaName - Area name for logging
   * @param {boolean} ssmlTemplate.isPhantom - Phantom area flag
   * @param {number} ssmlTemplate.characterCount - Character count for billing
   *
   * @returns {Promise<Object>} GeneratedAudio object with structure:
   *   {
   *     audioBuffer: AudioBuffer - Decoded audio buffer
   *     audioBlob: Blob - Audio data as Blob
   *     base64Audio: string - Base64-encoded audio
   *     reportId: string - From template
   *     areaName: string - From template
   *     isPhantom: boolean - From template
   *     duration: number - Audio duration in seconds
   *     sampleRate: number - Sample rate in Hz
   *     fileSize: number - File size in bytes
   *     synthesizedAt: Date - Timestamp
   *     cachedAt: Date|null - Cache timestamp if cached
   *   }
   *
   * @throws {ValidationError} Invalid SSML structure
   * @throws {AuthenticationError} Invalid API key (401/403)
   * @throws {RateLimitError} Rate limit exceeded (429)
   * @throws {ServiceError} Service error (500/503)
   * @throws {NetworkError} Network timeout or connection error
   *
   * Performance SLA:
   * - Latency: <2000ms (95th percentile)
   * - Timeout: 5000ms
   * - Retry: 3 attempts with exponential backoff
   *
   * T025: Implementation with API call
   */
  async synthesize(ssmlTemplate) {
    // Validate input structure
    if (!ssmlTemplate || !ssmlTemplate.ssml) {
      throw new Error('Invalid SSML template: ssml field is required');
    }

    // API key check removed - handled by backend Worker

    const startTime = Date.now();

    try {
      // Call Google Cloud TTS API with retry logic
      const response = await this._callAPI(ssmlTemplate.ssml);

      // Extract audio content
      const base64Audio = response.audioContent;

      if (!base64Audio) {
        throw new Error('No audio content in API response');
      }

      // Convert base64 to Blob and decode to AudioBuffer
      let audioBlob, audioBuffer, duration, sampleRate;

      if (this.audioContext) {
        // Browser context - use persistent AudioContext for decoding
        try {
          const decoded = await this._decodeAudio(base64Audio, this.audioContext);
          audioBlob = decoded.audioBlob;
          audioBuffer = decoded.audioBuffer;
          duration = decoded.duration;
          sampleRate = decoded.sampleRate;

          if (this.logRequests) {
            console.log(`[TTS] Decoded audio: duration=${duration}s, sampleRate=${sampleRate}Hz, buffer=${audioBuffer ? 'OK' : 'NULL'}`);
          }
        } catch (decodeError) {
          console.error('[TTS] Audio decoding failed:', decodeError);
          // Fallback to blob-only
          audioBlob = await this._base64ToBlob(base64Audio, 'audio/mpeg');
          audioBuffer = null;
          duration = 0;
          sampleRate = this.audioConfig.sampleRate;
        }
      } else {
        // Node.js context - Blob only
        audioBlob = await this._base64ToBlob(base64Audio, 'audio/mpeg');
        audioBuffer = null;
        duration = 0;
        sampleRate = this.audioConfig.sampleRate;
      }

      // Update usage statistics
      if (this.enableMetrics) {
        this.stats.requestCount++;
        this.stats.successCount++;
        this.stats.characterCount += ssmlTemplate.characterCount || 0;
        this.stats.estimatedCost += (ssmlTemplate.characterCount || 0) / 1000000 * 16; // $16 per 1M chars
        this.stats.lastRequestAt = new Date();

        const latency = Date.now() - startTime;
        this.stats.averageLatency =
          (this.stats.averageLatency * (this.stats.requestCount - 1) + latency) /
          this.stats.requestCount;
      }

      if (this.logRequests) {
        console.log(
          `[TTS] Synthesized ${ssmlTemplate.areaName} (${ssmlTemplate.reportId}) in ${Date.now() - startTime}ms`
        );
      }

      return {
        audioBuffer,
        audioBlob,
        base64Audio,
        reportId: ssmlTemplate.reportId || '',
        areaName: ssmlTemplate.areaName || '',
        isPhantom: ssmlTemplate.isPhantom || false,
        duration,
        sampleRate,
        fileSize: audioBlob.size,
        synthesizedAt: new Date(),
        cachedAt: null
      };
    } catch (error) {
      if (this.enableMetrics) {
        this.stats.failureCount++;
      }
      throw error;
    }
  }

  /**
   * Call Google Cloud TTS API
   *
   * Makes HTTP request to Google Cloud Text-to-Speech API with the given SSML.
   * Handles retries on transient failures (429, 503) with exponential backoff.
   *
   * @private
   * @async
   * @param {string} ssml - SSML markup to synthesize
   * @param {number} attempt - Current attempt number (default: 1)
   *
   * @returns {Promise<Object>} API response:
   *   {
   *     audioContent: string - Base64-encoded audio
   *     timepoints: Array - Optional timing marks
   *     audioConfig: Object - Echo of audio configuration
   *   }
   *
   * @throws {ValidationError} Invalid SSML (400)
   * @throws {AuthenticationError} Invalid credentials (401/403)
   * @throws {RateLimitError} Rate limit exceeded (429)
   * @throws {ServiceError} Server error (500/503)
   * @throws {NetworkError} Network failure or timeout
   *
   * Retry Strategy:
   * - Retryable: 429, 503, timeout, connection errors
   * - Not retryable: 400, 401, 403
   * - Backoff: 100ms × 2^(attempt-1)
   *
   * T026: Implementation with retry logic
   */
  async _callAPI(ssml, attempt = 1) {
    // Route through backend Worker proxy for secure API key management
    const endpoint = 'https://infinite-shipper-tts-proxy.dudekiller.workers.dev/synthesize';

    // Build request payload per Google Cloud TTS API spec
    const payload = {
      input: {
        ssml: ssml
      },
      voice: {
        languageCode: this.voice.languageCode,
        name: this.voice.name
      },
      audioConfig: {
        audioEncoding: this.audioConfig.encoding,
        sampleRateHertz: this.audioConfig.sampleRate
      }
    };

    // Set up timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Make HTTP POST request
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;

        // Check if retryable
        if (this._isRetryable(response.status) && attempt < this.retryAttempts) {
          const backoffDelay = this.retryDelay * Math.pow(2, attempt - 1);
          console.warn(
            `[TTS] API error ${response.status}, retrying in ${backoffDelay}ms (attempt ${attempt}/${this.retryAttempts})`
          );
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          return this._callAPI(ssml, attempt + 1);
        }

        // Not retryable or out of retries
        throw new Error(`TTS API error ${response.status}: ${errorMessage}`);
      }

      // Parse successful response
      const data = await response.json();

      return {
        audioContent: data.audioContent || '',
        timepoints: data.timepoints || [],
        audioConfig: data.audioConfig || {}
      };
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle network/timeout errors
      if (error.name === 'AbortError') {
        if (attempt < this.retryAttempts) {
          const backoffDelay = this.retryDelay * Math.pow(2, attempt - 1);
          console.warn(`[TTS] Timeout, retrying in ${backoffDelay}ms (attempt ${attempt}/${this.retryAttempts})`);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          return this._callAPI(ssml, attempt + 1);
        }
        throw new Error(`TTS API timeout after ${this.retryAttempts} attempts`);
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Check if HTTP status code is retryable
   *
   * T026: Helper method for retry logic
   */
  _isRetryable(statusCode) {
    return statusCode === 429 || statusCode === 503 || statusCode === 504;
  }

  // Placeholder return for old skeleton structure
  _oldReturn() {
    return {
      audioContent: '',
      timepoints: [],
      audioConfig: {}
    };
  }

  /**
   * Decode base64 audio to audio buffer and blob
   *
   * Converts base64-encoded audio data from the API response into usable
   * formats (Blob for storage/transmission, AudioBuffer for playback).
   *
   * @private
   * @async
   * @param {string} base64Audio - Base64-encoded audio data
   * @param {AudioContext} audioContext - Optional AudioContext for decoding
   *
   * @returns {Promise<Object>} Decoded audio with structure:
   *   {
   *     audioBlob: Blob - Audio data as Blob
   *     audioBuffer: AudioBuffer - Decoded audio buffer
   *     duration: number - Duration in seconds
   *     sampleRate: number - Sample rate in Hz
   *   }
   *
   * T027: Implementation for MP3 to AudioBuffer
   */
  async _decodeAudio(base64Audio, audioContext) {
    // Convert base64 to Blob
    const audioBlob = await this._base64ToBlob(base64Audio, 'audio/mpeg');

    // If AudioContext is provided, decode to AudioBuffer
    let audioBuffer = null;
    let duration = 0;
    let sampleRate = this.audioConfig.sampleRate;

    if (audioContext) {
      try {
        // Convert Blob to ArrayBuffer
        const arrayBuffer = await audioBlob.arrayBuffer();

        // Decode using Web Audio API
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        duration = audioBuffer.duration;
        sampleRate = audioBuffer.sampleRate;
      } catch (error) {
        console.warn('[TTS] Failed to decode audio buffer:', error);
        // Continue with Blob only - decoder failure is not critical
      }
    }

    return {
      audioBlob,
      audioBuffer,
      duration,
      sampleRate
    };
  }

  /**
   * Convert base64 string to Blob
   *
   * Helper to convert base64-encoded audio to a Blob object
   * suitable for storage and transmission.
   *
   * @private
   * @param {string} base64 - Base64-encoded data
   * @param {string} mimeType - MIME type for the Blob (default: audio/mpeg)
   *
   * @returns {Blob} Blob object with audio data
   *
   * T028: Implementation for blob conversion
   */
  _base64ToBlob(base64, mimeType = 'audio/mpeg') {
    // Decode base64 string to binary
    const binaryString = atob(base64);

    // Convert binary string to Uint8Array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create and return Blob with proper MIME type
    return new Blob([bytes], { type: mimeType });
  }


  /**
   * Get usage statistics
   *
   * Returns aggregated API usage statistics for monitoring and cost tracking.
   * Used for billing purposes and to monitor quota consumption.
   *
   * @returns {Object} UsageStats object:
   *   {
   *     requestCount: number - Total API calls
   *     successCount: number - Successful syntheses
   *     failureCount: number - Failed syntheses
   *     characterCount: number - Total characters synthesized
   *     estimatedCost: number - Estimated cost in USD
   *     lastRequestAt: Date|null - Timestamp of last request
   *     averageLatency: number - Average latency in ms
   *   }
   *
   * TODO: Implement in Phase 3
   * TODO: Return current stats object
   * TODO: Calculate averageLatency from tracked latencies
   * TODO: Calculate estimatedCost from character count
   */
  getUsageStats() {
    // TODO: Return aggregated stats
    // TODO: Calculate averages
    // TODO: Calculate costs

    return this.stats;
  }
}

/**
 * MockTTSAdapter
 *
 * Test adapter that returns mock audio without making API calls.
 * Used for unit testing and integration testing without consuming API quota.
 *
 * @class
 */
export class MockTTSAdapter {
  /**
   * Constructor
   *
   * Initialize mock adapter with optional delay simulation.
   *
   * @param {Object} config - Optional configuration
   *
   * TODO: Implement in Phase 3
   */
  constructor(config = {}) {
    // TODO: Initialize mock state
    this.stats = {
      requestCount: 0,
      successCount: 0,
      failureCount: 0,
      characterCount: 0,
      estimatedCost: 0,
      lastRequestAt: null,
      averageLatency: 0
    };
    this.shouldFail = false;
    this.delay = 0;
    this.lastRequest = null;
  }

  /**
   * Synthesize (mock implementation)
   *
   * @async
   * @param {Object} ssmlTemplate - SSML template
   * @returns {Promise<Object>} Mock audio
   */
  async synthesize(ssmlTemplate) {
    // Update stats
    this.stats.requestCount++;
    this.lastRequest = ssmlTemplate;

    // Simulate delay if set
    if (this.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delay));
    }

    // Throw error if shouldFail is true
    if (this.shouldFail) {
      this.stats.failureCount++;
      throw new Error('Mock synthesis failure');
    }

    // Generate mock audio blob (empty audio data)
    const mockAudioData = new Uint8Array(90000); // 90KB of mock audio
    const audioBlob = new Blob([mockAudioData], { type: 'audio/mpeg' });

    this.stats.successCount++;
    this.stats.characterCount += ssmlTemplate.characterCount || 0;
    this.stats.lastRequestAt = new Date();

    return {
      audioBuffer: null,
      audioBlob,
      base64Audio: btoa(String.fromCharCode(...mockAudioData.slice(0, 100))),
      reportId: ssmlTemplate.reportId || '',
      areaName: ssmlTemplate.areaName || '',
      isPhantom: ssmlTemplate.isPhantom || false,
      duration: 15,
      sampleRate: 24000,
      fileSize: audioBlob.size,
      synthesizedAt: new Date(),
      cachedAt: null
    };
  }

  /**
   * Validate SSML (mock implementation)
   *
   * @async
   * @param {string} ssml - SSML markup
   * @returns {Promise<boolean>} Always true in mock
   *
   * TODO: Implement in Phase 3
   */
  async validateSSML(ssml) {
    // TODO: Return true for testing

    return true;
  }

  /**
   * Get usage stats
   *
   * @returns {Object} Stats object
   *
   * TODO: Implement in Phase 3
   */
  getUsageStats() {
    return this.stats;
  }

  /**
   * Set simulated delay
   *
   * @param {number} ms - Delay in milliseconds
   *
   * TODO: Implement in Phase 3
   */
  setDelay(ms) {
    // TODO: Store delay for synthesis simulation

    this.delay = ms;
  }

  /**
   * Set failure mode
   *
   * @param {boolean} fail - Whether to simulate failure
   *
   * TODO: Implement in Phase 3
   */
  setShouldFail(fail) {
    // TODO: Set failure flag

    this.shouldFail = fail;
  }

  /**
   * Get last request
   *
   * @returns {Object|null} Last SSML template request
   *
   * TODO: Implement in Phase 3
   */
  getLastRequest() {
    // TODO: Return stored last request

    return this.lastRequest;
  }
}
