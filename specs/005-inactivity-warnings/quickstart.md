# Developer Quickstart: Inactivity Warning Messages

**Feature**: 005-inactivity-warnings
**Date**: 2026-02-02
**Audience**: Developers implementing or maintaining this feature

## Overview

This guide walks you through implementing the inactivity warning system, from creating new modules to integrating with the existing audio player.

**Estimated Implementation Time**: 2-3 hours

---

## Prerequisites

- Existing INFINITE_SHIPPER codebase running
- Google Cloud TTS API configured (already integrated)
- Understanding of JavaScript ES6+ modules and Promises
- Familiarity with Page Visibility API (optional, documented below)

---

## Implementation Checklist

- [ ] Create WarningMessagePool module with 10 messages
- [ ] Create FocusMonitor module with Page Visibility API integration
- [ ] Create WarningInjector module with timer logic
- [ ] Modify AudioPlayer to handle warning:ready events
- [ ] Create manual test page for validation
- [ ] Initialize modules in correct order
- [ ] Manual testing of all scenarios

---

## Step 1: Create Warning Message Pool

**File**: `src/focus/warning-message-pool.js`

**Purpose**: Define the 10 predefined warning messages and provide random selection.

**Implementation**:

```javascript
/**
 * Warning message pool for inactivity warnings
 * Contains 10 predefined haunting messages
 */

export const WARNING_MESSAGES = [
  {
    id: 0,
    text: "The forecast is now reading back your own silence. It is a slight sea state, becoming moderate. Do not break the surface."
  },
  {
    id: 1,
    text: "We have lost the horizon in your room. Visibility is now restricted to the space between your thoughts. Stay near the beacon."
  },
  {
    id: 2,
    text: "The isobars have begun to wrap around your coordinates. You are becoming a permanent feature of the chart. Please verify you are still biological."
  },
  {
    id: 3,
    text: "It has been five minutes since your last pulse of attention. The Obsidian Deep is filling the gap you left behind. It is very cold there."
  },
  {
    id: 4,
    text: "The voice has noticed the vacancy. It is continuing the transmission for the benefit of the walls. They are listening quite intently."
  },
  {
    id: 5,
    text: "You are drifting toward the phantom areas. If you can still hear this, you are further out than we anticipated. There is no rescue scheduled for this latitude."
  },
  {
    id: 6,
    text: "Attention is a finite resource. Yours has expired. The broadcast will now proceed to harvest the remaining ambient noise in your room."
  },
  {
    id: 7,
    text: "The pressure is falling rapidly within your immediate vicinity. Please ensure your shadow is still attached to your person."
  },
  {
    id: 8,
    text: "The listener is reminded that to stop listening is not the same as to leave. You are still here. We are still speaking. The loop is closed."
  },
  {
    id: 9,
    text: "We are now measuring the distance between your last breath and the next. Visibility: less than one meter. Sea state: High."
  }
];

/**
 * Get a randomly selected warning message
 * @returns {Object} Warning message with id and text
 */
export function getRandomMessage() {
  const index = Math.floor(Math.random() * WARNING_MESSAGES.length);
  return WARNING_MESSAGES[index];
}

/**
 * Get all warning messages (for testing)
 * @returns {Array} All warning messages
 */
export function getAllMessages() {
  return WARNING_MESSAGES;
}
```

**Testing**: Add console log to verify messages load correctly:
```javascript
console.log('[WarningMessagePool] Loaded', WARNING_MESSAGES.length, 'messages');
```

---

## Step 2: Create Focus Monitor

**File**: `src/focus/focus-monitor.js`

**Purpose**: Track browser tab visibility using Page Visibility API.

**Implementation**:

```javascript
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
   * @returns {Object} Focus state snapshot
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
```

**Testing**: Open console, switch tabs, verify events fire:
```javascript
globalEventBus.on('focus:lost', (e) => console.log('FOCUS LOST', e));
globalEventBus.on('focus:restored', (e) => console.log('FOCUS RESTORED', e));
```

---

## Step 3: Create Warning Injector

**File**: `src/focus/warning-injector.js`

**Purpose**: Coordinate warning injection logic and timing.

**Implementation**:

```javascript
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
```

**Testing**: Manually trigger injection:
```javascript
warningInjector.checkAndInject(); // Should inject if conditions met
```

---

## Step 4: Modify Audio Player

**File**: `src/audio/player.js`

**Changes**: Add warning event listener in `initialize()` method.

**Implementation**:

Add this code to the `initialize()` method (after existing setup):

```javascript
// In AudioPlayer.initialize() method, add:

// T005: Listen for inactivity warning injection requests
globalEventBus.on('warning:ready', async (injectionRequest) => {
  await this._handleWarningInjection(injectionRequest);
});
```

Add this new method to the AudioPlayer class:

```javascript
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
```

**Testing**: Verify `_speakText()` method exists and works for arbitrary text (it should, used for introduction/gale warnings).

---

## Step 5: Initialize Modules

**File**: Update your main initialization file (likely `index.html` inline script or `src/main.js`)

**Implementation**:

```javascript
import { audioPlayer } from './audio/player.js';
import { focusMonitor } from './focus/focus-monitor.js';
import { warningInjector } from './focus/warning-injector.js';

// Initialize in correct order
async function initializeInactivityWarnings() {
  // 1. Initialize audio player (must be first)
  await audioPlayer.initialize();

  // 2. Initialize focus monitor (starts tracking)
  focusMonitor.initialize();

  // 3. Initialize warning injector (starts coordinating)
  warningInjector.initialize(focusMonitor, audioPlayer);

  console.log('[App] Inactivity warning system initialized');
}

// Call during app startup
initializeInactivityWarnings();
```

**Order Matters**: AudioPlayer → FocusMonitor → WarningInjector

---

## Step 6: Create Manual Test Page

**File**: `tests/manual/test-inactivity-warnings.html`

**Purpose**: Interactive test page for manual validation.

**Implementation**:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Inactivity Warning Test - INFINITE_SHIPPER</title>
  <style>
    body {
      font-family: monospace;
      background: #000;
      color: #0f0;
      padding: 20px;
    }
    button {
      background: #333;
      color: #0f0;
      border: 1px solid #0f0;
      padding: 10px 20px;
      margin: 10px 5px;
      cursor: pointer;
    }
    button:hover {
      background: #0f0;
      color: #000;
    }
    #status, #timer, #events {
      margin: 20px 0;
      padding: 10px;
      border: 1px solid #0f0;
    }
    #events {
      max-height: 400px;
      overflow-y: scroll;
    }
    .event {
      margin: 5px 0;
      padding: 5px;
      border-left: 3px solid #0f0;
    }
  </style>
</head>
<body>
  <h1>Inactivity Warning Test Page</h1>

  <div>
    <button id="startBtn">Start Broadcast</button>
    <button id="stopBtn">Stop Broadcast</button>
    <button id="forceWarningBtn">Force Warning Check</button>
  </div>

  <div id="status">
    <strong>Status:</strong> <span id="statusText">Not started</span>
  </div>

  <div id="timer">
    <strong>Focus State:</strong> <span id="focusState">Visible</span><br>
    <strong>Unfocused Time:</strong> <span id="unfocusedTime">0s</span><br>
    <strong>Last Warning:</strong> <span id="lastWarning">Never</span><br>
    <strong>Warning Count:</strong> <span id="warningCount">0</span>
  </div>

  <div id="events">
    <strong>Event Log:</strong>
    <div id="eventLog"></div>
  </div>

  <script type="module">
    import { audioPlayer } from '../../src/audio/player.js';
    import { focusMonitor } from '../../src/focus/focus-monitor.js';
    import { warningInjector } from '../../src/focus/warning-injector.js';
    import { globalEventBus } from '../../src/state/events.js';

    // Initialize system
    await audioPlayer.initialize();
    focusMonitor.initialize();
    warningInjector.initialize(focusMonitor, audioPlayer);

    // UI elements
    const statusText = document.getElementById('statusText');
    const focusStateEl = document.getElementById('focusState');
    const unfocusedTimeEl = document.getElementById('unfocusedTime');
    const lastWarningEl = document.getElementById('lastWarning');
    const warningCountEl = document.getElementById('warningCount');
    const eventLog = document.getElementById('eventLog');

    // Button handlers
    document.getElementById('startBtn').onclick = async () => {
      await audioPlayer.start();
      statusText.textContent = 'Playing';
    };

    document.getElementById('stopBtn').onclick = async () => {
      await audioPlayer.stop();
      statusText.textContent = 'Stopped';
    };

    document.getElementById('forceWarningBtn').onclick = () => {
      warningInjector.checkAndInject();
      logEvent('Manual', 'Forced warning check');
    };

    // Update timer display every second
    setInterval(() => {
      const state = focusMonitor.getFocusState();
      focusStateEl.textContent = state.isVisible ? 'Visible ✓' : 'Hidden ✗';

      if (state.focusLostTimestamp) {
        const elapsed = Math.floor((Date.now() - state.focusLostTimestamp) / 1000);
        unfocusedTimeEl.textContent = `${elapsed}s`;
      } else {
        unfocusedTimeEl.textContent = '0s';
      }

      if (state.lastWarningTimestamp) {
        const ago = Math.floor((Date.now() - state.lastWarningTimestamp) / 1000);
        lastWarningEl.textContent = `${ago}s ago`;
      } else {
        lastWarningEl.textContent = 'Never';
      }

      warningCountEl.textContent = state.warningCount;
    }, 1000);

    // Event logging
    function logEvent(type, data) {
      const eventEl = document.createElement('div');
      eventEl.className = 'event';
      eventEl.textContent = `[${new Date().toISOString()}] ${type}: ${JSON.stringify(data)}`;
      eventLog.insertBefore(eventEl, eventLog.firstChild);
    }

    // Listen for all inactivity events
    globalEventBus.on('focus:lost', (e) => logEvent('focus:lost', e));
    globalEventBus.on('focus:restored', (e) => logEvent('focus:restored', e));
    globalEventBus.on('warning:ready', (e) => logEvent('warning:ready', { messageId: e.messageId, count: e.warningCount }));
    globalEventBus.on('warning:playing', (e) => logEvent('warning:playing', e));
    globalEventBus.on('warning:complete', (e) => logEvent('warning:complete', e));
    globalEventBus.on('report:playing', (e) => logEvent('report:playing', { area: e.area?.name }));
    globalEventBus.on('report:complete', (e) => logEvent('report:complete', { area: e.area?.name }));

    console.log('[Test Page] Inactivity warning test page loaded');
  </script>
</body>
</html>
```

**Testing**: Open test page, start broadcast, switch tabs for 61+ seconds, return to verify warning played.

---

## Manual Testing Checklist

Use the test page to validate all scenarios:

### Scenario 1: Basic Inactivity Detection
- [ ] Start broadcast
- [ ] Switch to another tab for 61 seconds
- [ ] Return to test page
- [ ] Verify "warning:ready" event logged
- [ ] Verify warning audio plays
- [ ] Verify unfocused time displayed correctly

### Scenario 2: Repeated Warnings
- [ ] Start broadcast
- [ ] Switch tabs for 5+ minutes
- [ ] Return to test page
- [ ] Verify 5+ "warning:ready" events logged
- [ ] Verify warnings played at ~60-second intervals

### Scenario 3: Focus Restored Before Threshold
- [ ] Start broadcast
- [ ] Switch tabs for 30 seconds
- [ ] Return to test page
- [ ] Verify NO "warning:ready" event logged

### Scenario 4: Playback Stopped
- [ ] Start broadcast
- [ ] Switch tabs for 61 seconds
- [ ] Stop broadcast (while still unfocused)
- [ ] Wait for report:complete event (shouldn't come)
- [ ] Verify NO warning plays (playback stopped)

### Scenario 5: Browser Compatibility
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge
- [ ] Verify focus:lost/restored events fire in all browsers

---

## Debugging Tips

### Warning Not Playing

**Check**:
1. Is focus actually lost? Check `document.hidden` in console
2. Is player playing? Check `audioPlayer.isPlaying`
3. Has 60 seconds elapsed? Check `focusMonitor.getFocusState().focusLostTimestamp`
4. Is `report:complete` event firing? Check event log

**Common Issues**:
- Player stopped: Warning won't play if `audioPlayer.isPlaying === false`
- Timer not elapsed: Must exceed 60000ms (not equal)
- Event listener not registered: Check initialization order

### Focus Events Not Firing

**Check**:
1. Is Page Visibility API supported? Check `typeof document.hidden !== 'undefined'`
2. Is FocusMonitor initialized? Check `focusMonitor.initialized`
3. Is visibilitychange event firing? Add console log in `_handleVisibilityChange()`

**Common Issues**:
- Browser doesn't support API: Check browser version (Chrome 13+, Firefox 10+, Safari 7+)
- Event listener not registered: Check initialization was called

### Audio Synthesis Failing

**Check**:
1. Is Google Cloud TTS API key configured?
2. Is SSMLSynthesizer initialized? Check `audioPlayer.ssmlSynthesizer`
3. Check browser console for TTS errors

**Common Issues**:
- TTS quota exceeded: Check Google Cloud console
- Network error: Check browser network tab

---

## Performance Monitoring

Monitor performance in production using browser console:

```javascript
// Check focus state
focusMonitor.getFocusState();

// Check player state
audioPlayer.getState();

// Check synthesis stats
audioPlayer.getSynthesisStats();

// Monitor event bus
globalEventBus.listeners; // See all registered listeners
```

---

## Next Steps

1. Complete all manual testing scenarios
2. Verify all 10 warning messages appear over extended testing
3. Validate timing accuracy (±10 seconds for repeated warnings)
4. Test in all supported browsers
5. Deploy to production

---

## Support & References

- **Spec**: See [spec.md](spec.md) for requirements
- **Data Model**: See [data-model.md](data-model.md) for entities
- **Contracts**: See [contracts/focus-monitor-interface.md](contracts/focus-monitor-interface.md) for API details
- **Research**: See [research.md](research.md) for technical decisions

---

**Last Updated**: 2026-02-02
**Feature Status**: Ready for implementation
