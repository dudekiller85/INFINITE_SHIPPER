/**
 * Warning injector - coordinates warning message injection
 */

import { globalEventBus } from '../state/events.js';
import { getRandomMessage } from './warning-message-pool.js';

export class WarningInjector {
  constructor() {
    this.focusMonitor = null;
    this.audioPlayer = null;
    this.initialized = false;
  }

  /**
   * Initialize with dependencies
   * @param {FocusMonitor} focusMonitor - Focus monitor instance
   * @param {AudioPlayer} audioPlayer - Audio player instance
   */
  initialize(focusMonitor, audioPlayer) {
    if (this.initialized) {
      console.warn('[WarningInjector] Already initialized');
      return;
    }

    if (!focusMonitor) {
      throw new Error('[WarningInjector] focusMonitor required');
    }
    if (!audioPlayer) {
      throw new Error('[WarningInjector] audioPlayer required');
    }

    this.focusMonitor = focusMonitor;
    this.audioPlayer = audioPlayer;

    // Listen for report completion (injection opportunity)
    globalEventBus.on('report:complete', this._onReportComplete.bind(this));

    // Listen for focus restored (clear pending warnings)
    globalEventBus.on('focus:restored', this._onFocusRestored.bind(this));

    this.initialized = true;
    console.log('[WarningInjector] Initialized');
  }

  /**
   * Handle report completion event
   * @private
   */
  _onReportComplete(report) {
    this.checkAndInject();
  }

  /**
   * Handle focus restored event
   * @private
   */
  _onFocusRestored(event) {
    // No pending warnings after focus restored
    console.log('[WarningInjector] Focus restored, clearing pending warnings');
  }

  /**
   * Check conditions and inject warning if needed
   */
  checkAndInject() {
    const focusState = this.focusMonitor.getFocusState();

    // Condition 1: Focus must be lost
    if (focusState.isVisible) {
      return;
    }

    // Condition 2: Player must be playing
    if (!this.audioPlayer.isPlaying) {
      return;
    }

    // Condition 3: Check if 60 seconds elapsed
    const now = Date.now();
    const referenceTimestamp = focusState.lastWarningTimestamp || focusState.focusLostTimestamp;

    if (!referenceTimestamp) {
      return;
    }

    const elapsedMs = now - referenceTimestamp;
    const thresholdMs = 60000; // 60 seconds

    if (elapsedMs <= thresholdMs) {
      return; // Not enough time elapsed
    }

    // All conditions met - inject warning
    this._injectWarning();
  }

  /**
   * Inject warning message
   * @private
   */
  _injectWarning() {
    const message = getRandomMessage();
    const focusState = this.focusMonitor.getFocusState();

    const injectionRequest = {
      messageId: message.id,
      messageText: message.text,
      timestamp: Date.now(),
      warningCount: focusState.warningCount + 1
    };

    console.log(`[WarningInjector] Injecting warning ${injectionRequest.warningCount}:`, message.id);

    // Emit warning ready event
    globalEventBus.emit('warning:ready', injectionRequest);

    // Update focus monitor state
    this.focusMonitor.incrementWarningCount();
  }
}

// Singleton instance
export const warningInjector = new WarningInjector();
