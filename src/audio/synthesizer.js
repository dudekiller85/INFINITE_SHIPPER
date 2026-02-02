/**
 * Speech synthesizer for converting weather report text to speech
 * Uses Web Speech API with UK English voice preference
 */

import { shortPause, longPause } from '../utils/timing.js';

export class SpeechSynthesizer {
  constructor() {
    this.synth = window.speechSynthesis;
    this.currentUtterance = null;
    this.isPaused = false;
  }

  /**
   * Get available voices, preferring UK English
   * @returns {SpeechSynthesisVoice[]}
   */
  getAvailableVoices() {
    return this.synth.getVoices();
  }

  /**
   * Select the best voice for shipping forecast
   * Prefers UK English male voices for authenticity
   * @returns {SpeechSynthesisVoice|null}
   */
  _selectVoice() {
    const voices = this.getAvailableVoices();

    // Priority 1: UK English voices (en-GB)
    const ukVoice = voices.find(
      (voice) => voice.lang === 'en-GB' && voice.name.toLowerCase().includes('male')
    );
    if (ukVoice) return ukVoice;

    // Priority 2: Any UK English voice
    const anyUkVoice = voices.find((voice) => voice.lang === 'en-GB');
    if (anyUkVoice) return anyUkVoice;

    // Priority 3: Any English voice
    const englishVoice = voices.find((voice) => voice.lang.startsWith('en'));
    if (englishVoice) return englishVoice;

    // Fallback: Default voice
    return voices[0] || null;
  }

  /**
   * Speak a weather report with proper pauses
   * @param {Object} report - Weather report object
   * @param {Object} options - Speech options
   * @param {number} options.rate - Speech rate (default 1.0)
   * @param {number} options.pitch - Speech pitch (default 1.0)
   * @param {number} options.volume - Speech volume (default 1.0)
   * @returns {Promise<void>} Resolves when speech completes
   */
  async speakReport(report, options = {}) {
    const { rate = 1.0, pitch = 1.0, volume = 1.0 } = options;

    // Stop any current speech
    this.stopSpeaking();

    // Split report into parts for pausing after area name
    const parts = report.text.split('. ');
    const areaName = parts[0]; // First part is area name
    const restOfReport = parts.slice(1).join('. ') + '.'; // Rejoin remaining parts

    // Speak area name
    await this._speakText(areaName + '.', { rate, pitch, volume });

    // 500ms pause after area name
    await shortPause();

    // Speak rest of report
    if (restOfReport.trim() !== '.') {
      await this._speakText(restOfReport, { rate, pitch, volume });
    }

    // 1-second pause after complete report
    await longPause();
  }

  /**
   * Speak a single text string
   * @private
   * @param {string} text - Text to speak
   * @param {Object} options - Speech options
   * @returns {Promise<void>}
   */
  _speakText(text, options) {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);

      // Configure utterance
      utterance.voice = this._selectVoice();
      utterance.rate = options.rate;
      utterance.pitch = options.pitch;
      utterance.volume = options.volume;
      utterance.lang = 'en-GB';

      // Set up event handlers
      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      // Store current utterance
      this.currentUtterance = utterance;

      // Speak
      this.synth.speak(utterance);
    });
  }

  /**
   * Stop current speech
   */
  stopSpeaking() {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }

  /**
   * Pause current speech
   */
  pause() {
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      this.isPaused = true;
    }
  }

  /**
   * Resume paused speech
   */
  resume() {
    if (this.synth.paused) {
      this.synth.resume();
      this.isPaused = false;
    }
  }
}

// Singleton instance
export const speechSynthesizer = new SpeechSynthesizer();
