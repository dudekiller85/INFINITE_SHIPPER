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
    this.masterGain = null; // Master gain node for analysis tap
    this.playbackPromise = null;
    this.ssmlSynthesizer = null; // T030: SSML synthesizer for natural speech
    this.useSSML = true; // T030: Flag to enable SSML synthesis
    this.fallbackToLegacy = true; // T031: Fallback to old synthesizer on error
    this.useFullBroadcast = true; // NEW: Play full EBNF broadcasts instead of individual reports
    this.currentBroadcast = null; // NEW: Current broadcast being played
    this.currentAreaIndex = 0; // NEW: Index within current broadcast's area forecasts
    this.pendingWarning = null; // T005: Pending warning for injection
    this.warningListenerRegistered = false; // T005: Track if listener already registered
    this.audioLookAhead = new Map(); // NEW: Look-ahead synthesis cache
    this.lookAheadPromise = null; // NEW: Track ongoing look-ahead synthesis
  }

  /**
   * Initialize audio context and filters
   * T030: Initialize SSML synthesizer
   */
  async initialize() {
    if (!this.audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();

      // Create master gain node for analysis tap point
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 1.0;
      this.masterGain.connect(this.audioContext.destination);

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

    // T005: Listen for inactivity warning injection requests
    if (!this.warningListenerRegistered) {
      const handleWarning = (injectionRequest) => {
        console.log('[AudioPlayer] Received warning:ready event, queuing warning:', injectionRequest.messageId);
        // Queue the warning instead of playing immediately
        this.pendingWarning = injectionRequest;
      };
      globalEventBus.on('warning:ready', handleWarning.bind(this));
      this.warningListenerRegistered = true;
      console.log('[AudioPlayer] Warning listener registered');
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

    // Build ordered segment list for look-ahead
    const segments = [];
    segments.push({ text: broadcast.introduction.text, label: 'Introduction' });
    if (broadcast.galeWarnings) {
      segments.push({ text: broadcast.galeWarnings.text, label: 'Gale Warnings' });
    }
    if (broadcast.generalSynopsis) {
      segments.push({ text: broadcast.generalSynopsis.text, label: 'General Synopsis' });
    }
    segments.push({ text: broadcast.timePeriod.text, label: 'Time Period' });

    // Pre-synthesize first segment
    if (segments.length > 0 && segments[0]) {
      this._preSynthesizeText(segments[0].text, segments[0].label);
    }

    // Play introduction segments with look-ahead
    for (let i = 0; i < segments.length; i++) {
      if (!this.isPlaying) break;

      const segment = segments[i];
      const nextSegment = segments[i + 1];

      // Start pre-synthesizing next segment while current plays
      if (nextSegment) {
        this.lookAheadPromise = this._preSynthesizeText(nextSegment.text, nextSegment.label);
      }

      await this._speakText(segment.text, segment.label);

      // Wait for look-ahead to complete before moving on
      if (this.lookAheadPromise) {
        await this.lookAheadPromise;
        this.lookAheadPromise = null;
      }
    }

    // Play all area forecasts with look-ahead
    for (let i = 0; i < broadcast.areaForecasts.length; i++) {
      if (!this.isPlaying) break;

      const forecast = broadcast.areaForecasts[i];
      const nextForecast = broadcast.areaForecasts[i + 1];

      this.currentReport = forecast;
      globalEventBus.emit('report:playing', forecast);

      // Pre-synthesize next forecast while current plays
      if (nextForecast && this.useSSML && this.ssmlSynthesizer) {
        const nextText = nextForecast.text;
        const nextLabel = nextForecast.area.name;
        this.lookAheadPromise = this._preSynthesizeText(nextText, nextLabel);
      }

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

      // Wait for look-ahead to complete
      if (this.lookAheadPromise) {
        await this.lookAheadPromise;
        this.lookAheadPromise = null;
      }

      globalEventBus.emit('report:complete', forecast);

      // T005: Check for pending warning and play it BETWEEN forecasts
      if (this.pendingWarning) {
        const warning = this.pendingWarning;
        this.pendingWarning = null; // Clear pending warning

        console.log('[AudioPlayer] Playing pending warning:', warning.messageId);
        await this._handleWarningInjection(warning);
      }
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

    // T005: Check for pending warning and play it after report
    if (this.pendingWarning) {
      const warning = this.pendingWarning;
      this.pendingWarning = null; // Clear pending warning

      console.log('[AudioPlayer] Playing pending warning:', warning.messageId);
      await this._handleWarningInjection(warning);
    }
  }

  /**
   * Pre-synthesize text for look-ahead (non-blocking)
   * @private
   */
  async _preSynthesizeText(text, label) {
    const cacheKey = `${label}:${text.substring(0, 50)}`;

    // Check if already cached
    if (this.audioLookAhead.has(cacheKey)) {
      return;
    }

    console.log(`[AudioPlayer] Pre-synthesizing ${label} (look-ahead)`);

    if (this.ssmlSynthesizer) {
      try {
        const generatedAudio = await this.ssmlSynthesizer.synthesizeText(text, label);
        if (generatedAudio && generatedAudio.audioBlob) {
          this.audioLookAhead.set(cacheKey, generatedAudio);
          console.log(`[AudioPlayer] Look-ahead cached: ${label}`);
        }
      } catch (error) {
        console.warn(`[AudioPlayer] Look-ahead synthesis failed for ${label}:`, error);
        // Non-critical - will synthesize on-demand if needed
      }
    }
  }

  /**
   * Speak text using Google Cloud TTS (for broadcast segments)
   * @private
   */
  async _speakText(text, label) {
    console.log(`[AudioPlayer] Speaking ${label}:`, text.substring(0, 100) + '...');

    const cacheKey = `${label}:${text.substring(0, 50)}`;

    // Use SSML synthesizer for Google Cloud TTS (consistent voice quality)
    if (this.ssmlSynthesizer) {
      try {
        // Check look-ahead cache first
        let generatedAudio = this.audioLookAhead.get(cacheKey);

        if (generatedAudio) {
          console.log(`[AudioPlayer] Using pre-synthesized audio for ${label}`);
          this.audioLookAhead.delete(cacheKey); // Remove from cache after use
        } else {
          // Cache miss - synthesize now
          console.log(`[AudioPlayer] Cache miss - synthesizing ${label} now`);
          generatedAudio = await this.ssmlSynthesizer.synthesizeText(text, label);
        }

        if (!generatedAudio || !generatedAudio.audioBlob) {
          throw new Error('SSML synthesis returned no audio');
        }

        // Create audio element for playback
        const audioUrl = URL.createObjectURL(generatedAudio.audioBlob);
        const audio = new Audio(audioUrl);

        // Connect audio element to Web Audio API for visualization
        if (this.masterGain) {
          const source = this.audioContext.createMediaElementSource(audio);
          source.connect(this.masterGain);
        }

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
   * Handle warning injection
   * T005: Inactivity warning system
   * @private
   */
  async _handleWarningInjection(injectionRequest) {
    console.log('[AudioPlayer] Handling warning injection:', injectionRequest.messageId);

    // Emit warning playing event
    globalEventBus.emit('warning:playing', {
      messageId: injectionRequest.messageId,
      timestamp: Date.now(),
      warningCount: injectionRequest.warningCount
    });

    try {
      // Synthesize and play warning message
      await this._speakText(injectionRequest.messageText, 'InactivityWarning');

      // Emit warning complete event
      globalEventBus.emit('warning:complete', {
        messageId: injectionRequest.messageId,
        timestamp: Date.now(),
        synthesisSource: 'google-tts' // Assume TTS unless cached
      });

      console.log('[AudioPlayer] Warning injection complete:', injectionRequest.messageId);
    } catch (error) {
      console.error('[AudioPlayer] Warning injection failed:', error);

      // Still emit complete event (for state consistency)
      globalEventBus.emit('warning:complete', {
        messageId: injectionRequest.messageId,
        timestamp: Date.now(),
        error: error.message
      });
    }
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

    // Connect audio element to Web Audio API for visualization and filtering
    if (this.masterGain && this.audioContext) {
      const source = this.audioContext.createMediaElementSource(audio);
      source.connect(this.masterGain);
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
   * Get master gain node (for audio analysis)
   * @returns {GainNode}
   */
  getMasterGain() {
    return this.masterGain;
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
