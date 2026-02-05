/**
 * Focus monitor - tracks browser tab visibility state
 */

import { globalEventBus } from '../state/events.js';

export class FocusMonitor {
  constructor() {
    this.focusState = {
      isVisible: !document.hidden,
      focusLostTimestamp: null,
      lastWarningTimestamp: null,
      warningCount: 0
    };
    this.timerInterval = null;
    this.debounceTimer = null;
    this.initialized = false;
  }

  /**
   * Initialize focus monitoring
   */
  initialize() {
    if (this.initialized) {
      console.warn('[FocusMonitor] Already initialized');
      return;
    }

    // Check for Page Visibility API support
    if (typeof document.hidden === 'undefined') {
      console.warn('[FocusMonitor] Page Visibility API not supported, feature disabled');
      return;
    }

    // Register visibility change listener
    document.addEventListener('visibilitychange', this._handleVisibilityChange.bind(this));

    // Start timer check interval (1 second)
    this.timerInterval = setInterval(this._checkTimer.bind(this), 1000);

    this.initialized = true;
    console.log('[FocusMonitor] Initialized');

    // Emit initial state if already hidden
    if (document.hidden) {
      this._handleFocusLost();
    }
  }

  /**
   * Handle visibility change events
   * @private
   */
  _handleVisibilityChange() {
    if (document.hidden) {
      this._handleFocusLost();
    } else {
      this._handleFocusRestored();
    }
  }

  /**
   * Handle focus lost (tab hidden)
   * @private
   */
  _handleFocusLost() {
    const previousTimestamp = this.focusState.focusLostTimestamp;

    // Only set timestamp if not already set (first focus loss)
    if (this.focusState.focusLostTimestamp === null) {
      this.focusState.focusLostTimestamp = Date.now();
      this.focusState.lastWarningTimestamp = null;
      this.focusState.warningCount = 0;
    }

    this.focusState.isVisible = false;

    // Clear debounce timer if exists
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    globalEventBus.emit('focus:lost', {
      timestamp: Date.now(),
      previousState: {
        isVisible: false,
        focusLostTimestamp: previousTimestamp
      }
    });

    console.log('[FocusMonitor] Focus lost at', new Date().toISOString());
  }

  /**
   * Handle focus restored (tab visible)
   * @private
   */
  _handleFocusRestored() {
    // Debounce focus restoration (1 second delay)
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      const unfocusedDuration = this.focusState.focusLostTimestamp
        ? Date.now() - this.focusState.focusLostTimestamp
        : 0;

      this.focusState.isVisible = true;
      const warningsPlayed = this.focusState.warningCount;

      // Reset focus state
      this.focusState.focusLostTimestamp = null;
      this.focusState.lastWarningTimestamp = null;
      this.focusState.warningCount = 0;

      globalEventBus.emit('focus:restored', {
        timestamp: Date.now(),
        unfocusedDurationMs: unfocusedDuration,
        warningsPlayed: warningsPlayed
      });

      console.log('[FocusMonitor] Focus restored after', unfocusedDuration, 'ms');
    }, 1000);
  }

  /**
   * Timer check (runs every second)
   * @private
   */
  _checkTimer() {
    // Timer checking is passive - WarningInjector queries state
    // This method exists for future enhancements (e.g., metrics)
  }

  /**
   * Get current focus state
   * @returns {{isVisible: boolean, focusLostTimestamp: number|null, lastWarningTimestamp: number|null, warningCount: number}} Focus state snapshot
   */
  getFocusState() {
    return { ...this.focusState };
  }

  /**
   * Increment warning count
   */
  incrementWarningCount() {
    this.focusState.warningCount++;
    this.focusState.lastWarningTimestamp = Date.now();
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    document.removeEventListener('visibilitychange', this._handleVisibilityChange);
    this.initialized = false;
    console.log('[FocusMonitor] Cleaned up');
  }
}

// Singleton instance
export const focusMonitor = new FocusMonitor();
