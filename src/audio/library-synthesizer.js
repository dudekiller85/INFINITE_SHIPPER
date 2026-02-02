/**
 * Library-based Speech Synthesizer
 * Plays pre-generated TTS audio by concatenating audio files
 * Replaces Web Speech API for higher quality output
 */

import { audioLibrary } from './audio-library.js';

export class LibrarySynthesizer {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.currentSources = [];
    this.isPlaying = false;
    this.stopRequested = false;
  }

  /**
   * Speak a weather report by playing concatenated audio files
   * @param {Object} report - Weather report object
   * @param {Object} options - Playback options
   * @param {GainNode} options.destination - Audio destination node
   * @returns {Promise<void>} Resolves when all audio completes
   */
  async speakReport(report, options = {}) {
    const { destination } = options;

    if (!destination) {
      throw new Error('Destination node is required');
    }

    // Build sequence of audio files for this report
    const audioSequence = audioLibrary.buildReportSequence(report);

    // Stop any currently playing audio
    this.stopSpeaking();

    // Preload all audio buffers
    const audioBuffers = await audioLibrary.preloadMultiple(
      this.audioContext,
      audioSequence
    );

    // Play the sequence
    await this._playSequence(audioBuffers, destination);
  }

  /**
   * Speak an unsettling message
   * @param {number} messageIndex - Index of message (1-12)
   * @param {GainNode} destination - Audio destination node
   * @returns {Promise<void>}
   */
  async speakUnsettlingMessage(messageIndex, destination) {
    if (!destination) {
      throw new Error('Destination node is required');
    }

    const audioSequence = audioLibrary.buildUnsettlingSequence(messageIndex);

    // Stop any currently playing audio
    this.stopSpeaking();

    // Preload audio
    const audioBuffers = await audioLibrary.preloadMultiple(
      this.audioContext,
      audioSequence
    );

    // Play the sequence
    await this._playSequence(audioBuffers, destination);
  }

  /**
   * Play a sequence of audio buffers
   * @private
   * @param {AudioBuffer[]} buffers - Array of audio buffers to play
   * @param {GainNode} destination - Destination node
   * @returns {Promise<void>}
   */
  _playSequence(buffers, destination) {
    return new Promise((resolve, reject) => {
      this.isPlaying = true;
      this.stopRequested = false;

      let currentTime = this.audioContext.currentTime;
      const sources = [];

      // Schedule all audio buffers to play in sequence
      for (const buffer of buffers) {
        if (this.stopRequested) {
          resolve();
          return;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(destination);

        // Schedule playback
        source.start(currentTime);

        // Update time for next buffer
        currentTime += buffer.duration;

        sources.push(source);
      }

      // Store sources for potential stopping
      this.currentSources = sources;

      // Set up completion handler on last source
      const lastSource = sources[sources.length - 1];
      if (lastSource) {
        lastSource.onended = () => {
          this.isPlaying = false;
          this.currentSources = [];
          resolve();
        };
      } else {
        this.isPlaying = false;
        resolve();
      }
    });
  }

  /**
   * Stop current speech playback
   */
  stopSpeaking() {
    this.stopRequested = true;

    for (const source of this.currentSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (error) {
        // Source may already be stopped
      }
    }

    this.currentSources = [];
    this.isPlaying = false;
  }

  /**
   * Check if currently playing
   * @returns {boolean}
   */
  isSpeaking() {
    return this.isPlaying;
  }

  /**
   * Preload audio for upcoming reports
   * @param {Object[]} reports - Array of report objects
   * @returns {Promise<void>}
   */
  async preloadReports(reports) {
    const allPaths = [];

    for (const report of reports) {
      const sequence = audioLibrary.buildReportSequence(report);
      allPaths.push(...sequence);
    }

    // Remove duplicates
    const uniquePaths = [...new Set(allPaths)];

    // Preload all unique audio files
    await audioLibrary.preloadMultiple(this.audioContext, uniquePaths);
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache info
   */
  getCacheInfo() {
    return {
      size: audioLibrary.getCacheSize()
    };
  }

  /**
   * Clear audio cache
   */
  clearCache() {
    audioLibrary.clearCache();
  }
}
