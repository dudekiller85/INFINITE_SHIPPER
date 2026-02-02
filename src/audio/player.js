/**
 * Audio player - orchestrates continuous playback of weather reports
 * Coordinates generator, buffer, synthesizer, and filters
 *
 * T030-T032: Updated to use SSMLSynthesizer for natural speech generation
 */

import { weatherGenerator } from '../core/generator.js';
import { broadcastGenerator } from '../core/broadcast-generator.js';
import { ReportBuffer } from '../core/buffer.js';
import { speechSynthesizer } from './synthesizer.js';
import { SSMLSynthesizer } from './ssml-synthesizer.js';
import { RadioFilter } from './filters.js';
import { globalEventBus } from '../state/events.js';

export class AudioPlayer {
  constructor() {
    this.buffer = new ReportBuffer(3, 5);
    this.isPlaying = false;
    this.currentReport = null;
    this.audioContext = null;
    this.radioFilter = null;
    this.playbackPromise = null;
    this.ssmlSynthesizer = null; // T030: SSML synthesizer for natural speech
    this.useSSML = true; // T030: Flag to enable SSML synthesis
    this.fallbackToLegacy = true; // T031: Fallback to old synthesizer on error
    this.useFullBroadcast = true; // NEW: Play full EBNF broadcasts instead of individual reports
    this.currentBroadcast = null; // NEW: Current broadcast being played
    this.currentAreaIndex = 0; // NEW: Index within current broadcast's area forecasts
  }

  /**
   * Initialize audio context and filters
   * T030: Initialize SSML synthesizer
   */
  async initialize() {
    if (!this.audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      // Radio filter disabled for clean audio
      // this.radioFilter = new RadioFilter(this.audioContext);
      // this.radioFilter.connectTo(this.audioContext.destination);
    }

    // Resume audio context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // T030: Initialize SSML synthesizer if enabled
    if (this.useSSML && !this.ssmlSynthesizer) {
      try {
        this.ssmlSynthesizer = new SSMLSynthesizer({
          audioContext: this.audioContext,
          enableCache: true,
          cacheSize: 50,
          ttsConfig: {
            enableMetrics: true,
            logRequests: true
          }
        });
        console.log('[AudioPlayer] SSML synthesizer initialized');
      } catch (error) {
        console.error('[AudioPlayer] Failed to initialize SSML synthesizer:', error);
        this.useSSML = false; // T031: Disable SSML on initialization failure
      }
    }
  }

  /**
   * Start continuous playback
   */
  async start() {
    if (this.isPlaying) {
      return;
    }

    await this.initialize();
    this.isPlaying = true;

    // Pre-fill buffer
    await this._fillBuffer();

    // Emit playback started event
    globalEventBus.emit('playback:started', {
      timestamp: new Date().toISOString(),
    });

    // Start playback loop
    this.playbackPromise = this._playbackLoop();
  }

  /**
   * Stop playback
   */
  async stop() {
    this.isPlaying = false;
    speechSynthesizer.stopSpeaking();
    this.buffer.clear();
    this.currentReport = null;

    // Emit playback stopped event
    globalEventBus.emit('playback:stopped', {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Main playback loop (UPDATED for EBNF broadcasts)
   * @private
   */
  async _playbackLoop() {
    while (this.isPlaying) {
      try {
        // NEW: Play full EBNF broadcasts if enabled
        if (this.useFullBroadcast) {
          await this._playFullBroadcast();
        } else {
          // Legacy: Play individual area reports
          await this._playIndividualReport();
        }
      } catch (error) {
        console.error('Playback error:', error);
        globalEventBus.emit('playback:error', {
          error: error.message,
          timestamp: new Date().toISOString(),
        });

        // Continue playback despite errors
        if (this.isPlaying) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
  }

  /**
   * Play full EBNF-compliant broadcast (NEW)
   * @private
   */
  async _playFullBroadcast() {
    // Generate a complete EBNF broadcast
    const broadcast = broadcastGenerator.generateBroadcast(31); // All 31 standard areas
    this.currentBroadcast = broadcast;

    console.log('[AudioPlayer] Playing EBNF broadcast:', broadcast.broadcastId);

    // Play introduction
    await this._speakText(broadcast.introduction.text, 'Introduction');

    // Play gale warnings if present
    if (broadcast.galeWarnings) {
      await this._speakText(broadcast.galeWarnings.text, 'Gale Warnings');
    }

    // Play general synopsis (NEW EBNF feature)
    if (broadcast.generalSynopsis) {
      await this._speakText(broadcast.generalSynopsis.text, 'General Synopsis');
    }

    // Play time period
    await this._speakText(broadcast.timePeriod.text, 'Time Period');

    // Play all area forecasts
    for (const forecast of broadcast.areaForecasts) {
      if (!this.isPlaying) break;

      this.currentReport = forecast;
      globalEventBus.emit('report:playing', forecast);

      // Use SSML synthesizer for area forecasts
      if (this.useSSML && this.ssmlSynthesizer) {
        try {
          await this._playSSMLReport(forecast);
        } catch (error) {
          console.error(`[AudioPlayer] SSML synthesis failed for ${forecast.area.name}:`, error);
          if (this.fallbackToLegacy) {
            await speechSynthesizer.speakReport(forecast);
          }
        }
      } else {
        await speechSynthesizer.speakReport(forecast);
      }

      globalEventBus.emit('report:complete', forecast);
    }

    console.log('[AudioPlayer] EBNF broadcast complete:', broadcast.broadcastId);
  }

  /**
   * Play individual report (legacy mode)
   * @private
   */
  async _playIndividualReport() {
    // Refill buffer if needed
    if (this.buffer.needsRefill()) {
      await this._fillBuffer();
    }

    // Get next report from buffer
    const report = this.buffer.dequeue();

    if (!report) {
      console.warn('Buffer empty, generating report on demand');
      const freshReport = weatherGenerator.generateWeatherReport();
      this.currentReport = freshReport;

      globalEventBus.emit('report:playing', freshReport);
      await speechSynthesizer.speakReport(freshReport);
      globalEventBus.emit('report:complete', freshReport);
      return;
    }

    // Set as current report
    this.currentReport = report;

    // Emit report playing event
    globalEventBus.emit('report:playing', report);

    // Use SSML synthesizer for standard areas, fallback for phantom/errors
    if (this.useSSML && this.ssmlSynthesizer && !report.isPhantom) {
      try {
        console.log(`[AudioPlayer] Using SSML synthesis for ${report.area}`);
        await this._playSSMLReport(report);
      } catch (error) {
        console.error(`[AudioPlayer] SSML synthesis failed for ${report.area}:`, error);

        if (this.fallbackToLegacy) {
          console.log(`[AudioPlayer] Falling back to legacy synthesizer for ${report.area}`);
          await speechSynthesizer.speakReport(report);
        } else {
          throw error;
        }
      }
    } else {
      // Use legacy synthesizer for phantom areas or when SSML disabled
      console.log(`[AudioPlayer] Using legacy synthesizer for ${report.area} (phantom: ${report.isPhantom})`);
      await speechSynthesizer.speakReport(report);
    }

    // Emit report complete event
    globalEventBus.emit('report:complete', report);
  }

  /**
   * Speak text using Google Cloud TTS (for broadcast segments)
   * @private
   */
  async _speakText(text, label) {
    console.log(`[AudioPlayer] Speaking ${label}:`, text.substring(0, 100) + '...');

    // Use SSML synthesizer for Google Cloud TTS (consistent voice quality)
    if (this.ssmlSynthesizer) {
      try {
        const generatedAudio = await this.ssmlSynthesizer.synthesizeText(text, label);

        if (!generatedAudio || !generatedAudio.audioBlob) {
          throw new Error('SSML synthesis returned no audio');
        }

        // Create audio element for playback
        const audioUrl = URL.createObjectURL(generatedAudio.audioBlob);
        const audio = new Audio(audioUrl);

        // Play audio and wait for completion
        await new Promise((resolve, reject) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            console.log(`[AudioPlayer] Completed ${label}`);
            resolve();
          };

          audio.onerror = (error) => {
            URL.revokeObjectURL(audioUrl);
            console.error(`[AudioPlayer] Audio playback error for ${label}:`, error);
            reject(new Error('Audio playback failed'));
          };

          audio.play().catch((error) => {
            URL.revokeObjectURL(audioUrl);
            console.error(`[AudioPlayer] Failed to start playback for ${label}:`, error);
            reject(error);
          });
        });
      } catch (error) {
        console.error(`[AudioPlayer] Google TTS failed for ${label}, falling back to browser TTS:`, error);
        // Fallback to browser speech synthesis
        await this._speakTextFallback(text, label);
      }
    } else {
      // No SSML synthesizer, use browser speech synthesis
      await this._speakTextFallback(text, label);
    }
  }

  /**
   * Fallback speech synthesis using browser SpeechSynthesis API
   * @private
   */
  async _speakTextFallback(text, label) {
    const fakeReport = {
      text: text,
      area: { name: label }
    };

    await speechSynthesizer.speakReport(fakeReport, {
      rate: 0.85,
      pitch: 1.0,
      volume: 1.0
    });
  }

  /**
   * Play report using SSML synthesis
   * T030: Implementation for SSML-based playback
   * @private
   */
  async _playSSMLReport(report) {
    // Synthesize to audio blob
    const generatedAudio = await this.ssmlSynthesizer.synthesizeReport(report);

    if (!generatedAudio || !generatedAudio.audioBlob) {
      throw new Error('SSML synthesis returned no audio');
    }

    // Create audio element for playback
    const audioUrl = URL.createObjectURL(generatedAudio.audioBlob);
    const audio = new Audio(audioUrl);

    // Apply radio filter if available
    if (this.radioFilter && this.audioContext) {
      // TODO: Connect audio element to Web Audio API for filtering
      // For now, play directly
    }

    // Play audio and wait for completion
    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        console.log(`[AudioPlayer] Completed playback of ${report.area}`); // T032: Logging
        resolve();
      };

      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        console.error(`[AudioPlayer] Audio playback error for ${report.area}:`, error); // T031: Error handling
        reject(new Error('Audio playback failed'));
      };

      audio.play().catch((error) => {
        URL.revokeObjectURL(audioUrl);
        console.error(`[AudioPlayer] Failed to start playback for ${report.area}:`, error); // T031: Error handling
        reject(error);
      });
    });
  }

  /**
   * Fill buffer to maximum capacity
   * @private
   */
  async _fillBuffer() {
    const capacity = this.buffer.capacity();

    for (let i = 0; i < capacity; i++) {
      const report = weatherGenerator.generateWeatherReport();
      this.buffer.enqueue(report);
    }

    globalEventBus.emit('buffer:filled', {
      size: this.buffer.size(),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get current playback state
   * @returns {{isPlaying: boolean, currentReport: Object|null, bufferSize: number}}
   */
  getState() {
    return {
      isPlaying: this.isPlaying,
      currentReport: this.currentReport,
      bufferSize: this.buffer.size(),
    };
  }

  /**
   * Get radio filter instance
   * @returns {RadioFilter}
   */
  getRadioFilter() {
    return this.radioFilter;
  }

  /**
   * Get audio context
   * @returns {AudioContext}
   */
  getAudioContext() {
    return this.audioContext;
  }

  /**
   * Get synthesis statistics
   * T032: Expose synthesis stats for monitoring
   * @returns {Object} Synthesis statistics
   */
  getSynthesisStats() {
    if (this.ssmlSynthesizer) {
      return this.ssmlSynthesizer.getStats();
    }
    return null;
  }

  /**
   * Toggle SSML synthesis
   * T031: Allow runtime switching between SSML and legacy
   * @param {boolean} enabled - Enable or disable SSML synthesis
   */
  setSSMLEnabled(enabled) {
    this.useSSML = enabled;
    console.log(`[AudioPlayer] SSML synthesis ${enabled ? 'enabled' : 'disabled'}`); // T032: Logging
  }
}

// Singleton instance
export const audioPlayer = new AudioPlayer();
