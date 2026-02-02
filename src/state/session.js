/**
 * Session state management
 * Tracks playback state and tab visibility for unsettling messages
 */

import { globalEventBus } from './events.js';
import { UNSETTLING_MESSAGES, getRandomElement } from '../core/vocabulary.js';

export class SessionState {
  constructor() {
    this.isPlaying = false;
    this.currentReport = null;
    this.backgroundedAt = null;
    this.unsettlingMessagesActive = false;
    this.tabVisibilityThreshold = 60000; // 60 seconds in milliseconds
    this.visibilityCheckInterval = null;

    // Listen to visibility changes
    this._initVisibilityTracking();

    // Listen to playback events
    this._initEventListeners();
  }

  /**
   * Initialize Page Visibility API tracking
   * @private
   */
  _initVisibilityTracking() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.onTabBlurred();
      } else {
        this.onTabFocused();
      }
    });
  }

  /**
   * Initialize event listeners for playback state
   * @private
   */
  _initEventListeners() {
    globalEventBus.on('playback:started', () => {
      this.isPlaying = true;
    });

    globalEventBus.on('playback:stopped', () => {
      this.isPlaying = false;
      this.currentReport = null;
      this._stopUnsettlingMessages();
    });

    globalEventBus.on('report:playing', (report) => {
      this.currentReport = report;
    });

    globalEventBus.on('report:complete', () => {
      this.currentReport = null;
    });
  }

  /**
   * Handle tab becoming hidden
   */
  onTabBlurred() {
    if (!this.isPlaying) {
      return;
    }

    this.backgroundedAt = Date.now();

    // Start checking for unsettling message threshold
    this.visibilityCheckInterval = setInterval(() => {
      this._checkUnsettlingMessageThreshold();
    }, 1000);

    globalEventBus.emit('tab:blurred', {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle tab becoming visible again
   */
  onTabFocused() {
    this.backgroundedAt = null;
    this._stopUnsettlingMessages();

    if (this.visibilityCheckInterval) {
      clearInterval(this.visibilityCheckInterval);
      this.visibilityCheckInterval = null;
    }

    globalEventBus.emit('tab:focused', {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Check if unsettling message threshold has been reached
   * @private
   */
  _checkUnsettlingMessageThreshold() {
    if (!this.backgroundedAt || !this.isPlaying) {
      return;
    }

    const timeBackgrounded = Date.now() - this.backgroundedAt;

    if (timeBackgrounded >= this.tabVisibilityThreshold && !this.unsettlingMessagesActive) {
      this._startUnsettlingMessages();
    }
  }

  /**
   * Start injecting unsettling messages into reports
   * @private
   */
  _startUnsettlingMessages() {
    this.unsettlingMessagesActive = true;

    globalEventBus.emit('unsettling:started', {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Stop unsettling messages
   * @private
   */
  _stopUnsettlingMessages() {
    if (this.unsettlingMessagesActive) {
      this.unsettlingMessagesActive = false;

      globalEventBus.emit('unsettling:stopped', {
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Check if an unsettling message should be shown
   * @returns {boolean}
   */
  shouldShowUnsettlingMessage() {
    return this.unsettlingMessagesActive && Math.random() < 0.3; // 30% chance when active
  }

  /**
   * Get a random unsettling message
   * @returns {string}
   */
  getUnsettlingMessage() {
    return getRandomElement(UNSETTLING_MESSAGES);
  }

  /**
   * Toggle playback state
   * @returns {boolean} New playback state
   */
  togglePlayback() {
    this.isPlaying = !this.isPlaying;
    return this.isPlaying;
  }

  /**
   * Get current report
   * @returns {Object|null}
   */
  getCurrentReport() {
    return this.currentReport;
  }

  /**
   * Set current report
   * @param {Object} report - Weather report
   */
  setCurrentReport(report) {
    this.currentReport = report;
  }

  /**
   * Get full state snapshot
   * @returns {{
   *   isPlaying: boolean,
   *   currentReport: Object|null,
   *   backgroundedAt: number|null,
   *   unsettlingMessagesActive: boolean,
   *   timeBackgrounded: number|null
   * }}
   */
  getState() {
    return {
      isPlaying: this.isPlaying,
      currentReport: this.currentReport,
      backgroundedAt: this.backgroundedAt,
      unsettlingMessagesActive: this.unsettlingMessagesActive,
      timeBackgrounded: this.backgroundedAt ? Date.now() - this.backgroundedAt : null,
    };
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.visibilityCheckInterval) {
      clearInterval(this.visibilityCheckInterval);
    }
  }
}

// Singleton instance
export const sessionState = new SessionState();
