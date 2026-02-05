/**
 * SSML Synthesizer
 *
 * Coordinates the complete synthesis pipeline from weather reports to audio playback.
 * Integrates SSMLTemplateBuilder, GoogleCloudTTSAdapter, and AudioCache to provide
 * a unified interface for natural speech generation.
 *
 * Phase 3: T029 - Implementation
 */

import { SSMLTemplateBuilder } from './ssml-template-builder.js';
import { GoogleCloudTTSAdapter } from './tts-service-adapter.js';
import { AudioCache } from './audio-cache.js';

/**
 * SSMLSynthesizer
 *
 * Main orchestrator for the natural speech generation system.
 * Converts weather reports into synthesized speech using SSML templates
 * and Google Cloud TTS, with integrated caching for cost optimization.
 *
 * @class
 */
export class SSMLSynthesizer {
  /**
   * Constructor
   *
   * Initializes the synthesizer with template builder, TTS adapter, and cache.
   *
   * @param {Object} config - Configuration object
   * @param {Object} config.ttsConfig - TTS adapter configuration
   * @param {number} config.cacheSize - Cache size (default: 50 entries)
   * @param {boolean} config.enableCache - Enable caching (default: true)
   * @param {AudioContext} config.audioContext - Web Audio API context
   */
  constructor(config = {}) {
    this.templateBuilder = new SSMLTemplateBuilder();
    this.ttsAdapter = new GoogleCloudTTSAdapter(config.ttsConfig || {});
    this.enableCache = config.enableCache !== false;
    this.cache = this.enableCache ? new AudioCache(config.cacheSize || 50) : null;
    this.audioContext = config.audioContext || null;

    this.stats = {
      totalReports: 0,
      cacheHits: 0,
      cacheMisses: 0,
      synthesisErrors: 0,
      averageSynthesisTime: 0
    };

    console.log('[SSMLSynthesizer] Initialized with cache:', this.enableCache);
  }

  /**
   * Synthesize weather report to audio
   *
   * Main entry point that converts a weather report object into synthesized audio.
   * Handles the complete pipeline: template generation → TTS synthesis → caching.
   *
   * @async
   * @param {Object} report - Weather report object
   * @param {string} report.area - Sea area name
   * @param {boolean} report.isPhantom - Phantom area flag
   * @param {Object} report.wind - Wind information
   * @param {Object} report.seaState - Sea state information
   * @param {Object} report.weather - Weather information
   * @param {Object} report.visibility - Visibility information
   *
   * @returns {Promise<Object>} GeneratedAudio object with audioBlob and metadata
   * @throws {Error} On validation, synthesis, or network errors
   */
  async synthesizeReport(report) {
    const startTime = Date.now();

    try {
      // Step 1: Generate SSML template
      const template = this.templateBuilder.build(report);

      if (!template || !template.ssml) {
        throw new Error('Failed to generate SSML template');
      }

      console.log(
        `[SSMLSynthesizer] Generated SSML for ${template.areaName} (${template.characterCount} chars)`
      );

      // Step 2: Check cache
      if (this.enableCache && this.cache) {
        const cached = this.cache.get(template.reportId);
        if (cached) {
          this.stats.totalReports++;
          this.stats.cacheHits++;
          console.log(`[SSMLSynthesizer] Cache HIT for ${template.areaName}`);

          return {
            ...cached,
            cachedAt: cached.synthesizedAt,
            fromCache: true
          };
        }

        this.stats.cacheMisses++;
        console.log(`[SSMLSynthesizer] Cache MISS for ${template.areaName}`);
      }

      // Step 3: Synthesize via TTS adapter
      const generatedAudio = await this.ttsAdapter.synthesize(template);

      if (!generatedAudio || !generatedAudio.audioBlob) {
        throw new Error('TTS synthesis returned no audio');
      }

      // Step 4: Store in cache
      if (this.enableCache && this.cache) {
        this.cache.set(template.reportId, generatedAudio);
      }

      // Step 5: Update stats
      this.stats.totalReports++;
      const synthesisTime = Date.now() - startTime;
      this.stats.averageSynthesisTime =
        (this.stats.averageSynthesisTime * (this.stats.totalReports - 1) + synthesisTime) /
        this.stats.totalReports;

      console.log(`[SSMLSynthesizer] Synthesized ${template.areaName} in ${synthesisTime}ms`);

      return {
        ...generatedAudio,
        fromCache: false
      };
    } catch (error) {
      this.stats.synthesisErrors++;
      console.error(`[SSMLSynthesizer] Synthesis failed for ${report.area}:`, error);
      throw error;
    }
  }

  /**
   * Synthesize multiple reports in batch
   *
   * Synthesizes multiple weather reports concurrently with controlled parallelism.
   * Useful for pre-buffering reports before playback.
   *
   * @async
   * @param {Array<Object>} reports - Array of weather report objects
   * @param {number} concurrency - Max concurrent synthesis operations (default: 3)
   *
   * @returns {Promise<Array<Object>>} Array of GeneratedAudio objects
   */
  async synthesizeBatch(reports, concurrency = 3) {
    if (!Array.isArray(reports) || reports.length === 0) {
      return [];
    }

    console.log(`[SSMLSynthesizer] Batch synthesizing ${reports.length} reports`);

    const results = [];
    const queue = [...reports];

    // Process reports with concurrency limit
    while (queue.length > 0) {
      const batch = queue.splice(0, concurrency);
      const batchPromises = batch.map((report) => this.synthesizeReport(report));

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        console.error('[SSMLSynthesizer] Batch synthesis error:', error);
        // Continue with remaining reports
      }
    }

    return results;
  }

  /**
   * Get synthesizer statistics
   *
   * Returns usage statistics including cache hit rate, synthesis times, and errors.
   *
   * @returns {Object} Statistics object
   */
  getStats() {
    const cacheHitRate =
      this.stats.totalReports > 0 ? (this.stats.cacheHits / this.stats.totalReports) * 100 : 0;

    return {
      ...this.stats,
      cacheHitRate: cacheHitRate.toFixed(1),
      cacheEnabled: this.enableCache,
      ttsStats: this.ttsAdapter.getUsageStats()
    };
  }

  /**
   * Synthesize plain text to audio (for broadcast segments)
   *
   * Converts plain text into synthesized speech using Google Cloud TTS.
   * Used for introduction, gale warnings, general synopsis, and time period segments.
   *
   * @async
   * @param {string} text - Plain text to synthesize
   * @param {string} label - Label for logging (e.g., "Introduction", "General Synopsis")
   * @returns {Promise<Object>} GeneratedAudio object with audioBlob and metadata
   * @throws {Error} On synthesis or network errors
   */
  async synthesizeText(text, label = 'Text') {
    const startTime = Date.now();

    try {
      // Create simple SSML template
      const template = {
        ssml: `<speak><prosody rate="100%">${this._escapeXML(text)}</prosody></speak>`,
        reportId: `text-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        areaName: label,
        characterCount: text.length,
        createdAt: Date.now()
      };

      console.log(`[SSMLSynthesizer] Synthesizing ${label} (${template.characterCount} chars)`);

      // Synthesize via TTS adapter (no caching for broadcast segments)
      const generatedAudio = await this.ttsAdapter.synthesize(template);

      if (!generatedAudio || !generatedAudio.audioBlob) {
        throw new Error('TTS synthesis returned no audio');
      }

      const synthesisTime = Date.now() - startTime;
      console.log(`[SSMLSynthesizer] Synthesized ${label} in ${synthesisTime}ms`);

      return {
        ...generatedAudio,
        fromCache: false
      };
    } catch (error) {
      console.error(`[SSMLSynthesizer] Text synthesis failed for ${label}:`, error);
      throw error;
    }
  }

  /**
   * Escape XML special characters for SSML
   * @private
   */
  _escapeXML(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Clear synthesis cache
   *
   * Clears all cached audio to free memory or force regeneration.
   */
  clearCache() {
    if (this.cache) {
      this.cache.clear();
      console.log('[SSMLSynthesizer] Cache cleared');
    }
  }
}
