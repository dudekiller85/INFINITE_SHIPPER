# API Contracts: Inactivity Warning System

**Feature**: 005-inactivity-warnings
**Date**: 2026-02-02
**Status**: Complete

## Overview

This document defines the public API contracts for the inactivity warning system. All modules communicate via the EventBus and expose minimal public APIs for initialization and state queries.

---

## FocusMonitor API

**Module**: `src/focus/focus-monitor.js`
**Purpose**: Monitors browser tab visibility and emits focus state change events

### Public Methods

#### `initialize()`

Initialize the focus monitor and begin tracking tab visibility.

**Signature**:
```javascript
initialize(): void
```

**Behavior**:
- Checks for Page Visibility API support (`typeof document.hidden !== 'undefined'`)
- Registers `visibilitychange` event listener
- Starts timer check interval (1000ms)
- Initializes focus state based on current `document.hidden` value

**Side Effects**:
- Emits `focus:lost` event if tab is already hidden on init
- Starts setInterval timer (stored in internal state)

**Error Handling**:
- If Page Visibility API unsupported: logs warning, feature disabled (no events emitted)
- If already initialized: logs warning, no-op (idempotent)

**Example**:
```javascript
import { focusMonitor } from './focus/focus-monitor.js';

// Called on app initialization (e.g., in main.js)
focusMonitor.initialize();
```

---

#### `getFocusState()`

Get the current focus state snapshot.

**Signature**:
```javascript
getFocusState(): FocusState
```

**Returns**:
```javascript
{
  isVisible: boolean,
  focusLostTimestamp: number | null,
  lastWarningTimestamp: number | null,
  warningCount: number
}
```

**Behavior**:
- Returns copy of internal state (not a reference)
- Always returns current values (no async)

**Example**:
```javascript
const state = focusMonitor.getFocusState();
if (!state.isVisible) {
  const elapsedMs = Date.now() - state.focusLostTimestamp;
  console.log(`Tab unfocused for ${elapsedMs}ms`);
}
```

---

#### `cleanup()`

Stop monitoring and clean up resources.

**Signature**:
```javascript
cleanup(): void
```

**Behavior**:
- Removes `visibilitychange` event listener
- Clears timer interval
- Resets internal state

**Side Effects**:
- Stops emitting focus events
- Clears timers (prevents memory leaks)

**Use Case**: Called on page unload or when feature should be disabled

**Example**:
```javascript
window.addEventListener('beforeunload', () => {
  focusMonitor.cleanup();
});
```

---

### Events Emitted

#### `focus:lost`

Emitted when browser tab becomes hidden (user switches away).

**Event Name**: `'focus:lost'`

**Payload**:
```javascript
{
  timestamp: number,           // Date.now() when focus lost
  previousState: {
    isVisible: boolean,        // Always false (for consistency)
    focusLostTimestamp: number | null  // Previous timestamp (null if first loss)
  }
}
```

**Timing**: Emitted synchronously when `visibilitychange` event fires with `document.hidden === true`

**Example**:
```javascript
globalEventBus.on('focus:lost', (event) => {
  console.log(`Focus lost at ${new Date(event.timestamp).toISOString()}`);
});
```

---

#### `focus:restored`

Emitted when browser tab becomes visible (user returns).

**Event Name**: `'focus:restored'`

**Payload**:
```javascript
{
  timestamp: number,         // Date.now() when focus restored
  unfocusedDurationMs: number, // Total time unfocused (ms)
  warningsPlayed: number       // Number of warnings played during absence
}
```

**Timing**: Emitted after 1-second debounce delay (prevents flicker from rapid tab switches)

**Example**:
```javascript
globalEventBus.on('focus:restored', (event) => {
  console.log(`Focus restored after ${event.unfocusedDurationMs}ms, ${event.warningsPlayed} warnings played`);
});
```

---

## WarningMessagePool API

**Module**: `src/focus/warning-message-pool.js`
**Purpose**: Stores predefined warning messages and provides random selection

### Public Methods

#### `getRandomMessage()`

Get a randomly selected warning message from the pool.

**Signature**:
```javascript
getRandomMessage(): WarningMessage
```

**Returns**:
```javascript
{
  id: number,      // 0-9
  text: string     // Warning message text
}
```

**Behavior**:
- Uses `Math.random()` for selection (true random, no history)
- Always returns one of 10 predefined messages
- Pure function (no side effects, no state)

**Example**:
```javascript
import { getRandomMessage } from './focus/warning-message-pool.js';

const message = getRandomMessage();
console.log(`Selected warning ${message.id}: ${message.text}`);
```

---

#### `getAllMessages()`

Get all warning messages (for testing/debugging).

**Signature**:
```javascript
getAllMessages(): WarningMessage[]
```

**Returns**: Array of all 10 WarningMessage objects

**Use Case**: Manual testing, validation, debugging

**Example**:
```javascript
import { getAllMessages } from './focus/warning-message-pool.js';

const messages = getAllMessages();
console.log(`Pool contains ${messages.length} messages`);
```

---

## WarningInjector API

**Module**: `src/focus/warning-injector.js`
**Purpose**: Coordinates warning injection logic and timing

### Public Methods

#### `initialize(focusMonitor, audioPlayer)`

Initialize the warning injector with dependencies.

**Signature**:
```javascript
initialize(focusMonitor: FocusMonitor, audioPlayer: AudioPlayer): void
```

**Parameters**:
- `focusMonitor`: FocusMonitor instance for state queries
- `audioPlayer`: AudioPlayer instance for playback state checks

**Behavior**:
- Registers event listener for `report:complete` events
- Registers event listener for `focus:restored` events (to clear pending warnings)
- Stores references to dependencies

**Side Effects**:
- Begins listening for broadcast completion events
- May emit `warning:ready` events after initialization

**Example**:
```javascript
import { warningInjector } from './focus/warning-injector.js';
import { focusMonitor } from './focus/focus-monitor.js';
import { audioPlayer } from './audio/player.js';

warningInjector.initialize(focusMonitor, audioPlayer);
```

---

#### `checkAndInject()`

Check if a warning should be injected and emit event if conditions met.

**Signature**:
```javascript
checkAndInject(): void
```

**Behavior**:
1. Get focus state from FocusMonitor
2. Check if focus is lost and player is playing
3. Calculate elapsed time since focus loss (or last warning)
4. If elapsed > 60000ms, select random message and emit `warning:ready`
5. Update internal last warning timestamp

**Conditions** (all must be true to inject):
- Focus is lost (`focusState.isVisible === false`)
- Player is playing (`audioPlayer.isPlaying === true`)
- Time elapsed > 60000ms since focus loss or last warning

**Side Effects**:
- May emit `warning:ready` event
- Updates internal timing state

**Called By**: Event listener on `report:complete` (automatic, not manual)

---

### Events Emitted

#### `warning:ready`

Emitted when a warning message should be injected into playback.

**Event Name**: `'warning:ready'`

**Payload**: WarningInjectionRequest
```javascript
{
  messageId: number,     // 0-9
  messageText: string,   // Full warning text for TTS
  timestamp: number,     // Date.now() when injection requested
  warningCount: number   // Sequential warning number (1, 2, 3, ...)
}
```

**Timing**: Emitted synchronously when `report:complete` fires and conditions met

**Example**:
```javascript
globalEventBus.on('warning:ready', (request) => {
  console.log(`Warning ${request.warningCount} ready: ${request.messageText.substring(0, 50)}...`);
});
```

---

## AudioPlayer API (Modifications)

**Module**: `src/audio/player.js`
**Purpose**: Existing audio player with new warning injection support

### New Event Listeners (Added)

#### `warning:ready` Listener

Listens for warning injection requests and synthesizes/plays warning audio.

**Handler Signature**:
```javascript
async _handleWarningInjection(injectionRequest: WarningInjectionRequest): Promise<void>
```

**Behavior**:
1. Emit `warning:playing` event (for logging/debugging)
2. Call `_speakText(injectionRequest.messageText, 'InactivityWarning')`
3. Wait for audio playback to complete
4. Emit `warning:complete` event

**Integration Point**: Registered in `AudioPlayer.initialize()`

**Implementation** (pseudocode):
```javascript
// In AudioPlayer.initialize()
globalEventBus.on('warning:ready', async (request) => {
  globalEventBus.emit('warning:playing', {
    messageId: request.messageId,
    timestamp: Date.now(),
    warningCount: request.warningCount
  });

  await this._speakText(request.messageText, 'InactivityWarning');

  globalEventBus.emit('warning:complete', {
    messageId: request.messageId,
    timestamp: Date.now(),
    synthesisSource: 'google-tts' // or 'cache'
  });
});
```

---

### New Events Emitted

#### `warning:playing`

Emitted when warning audio begins playing.

**Event Name**: `'warning:playing'`

**Payload**:
```javascript
{
  messageId: number,
  timestamp: number,
  warningCount: number
}
```

---

#### `warning:complete`

Emitted when warning audio finishes playing.

**Event Name**: `'warning:complete'`

**Payload**:
```javascript
{
  messageId: number,
  timestamp: number,
  synthesisSource: string  // 'google-tts' | 'cache'
}
```

---

## Event Bus Contract

**Module**: `src/state/events.js` (existing)
**No changes required** - EventBus API already supports all needed operations

### Usage Pattern

```javascript
import { globalEventBus } from './state/events.js';

// Emit event
globalEventBus.emit('focus:lost', { timestamp: Date.now() });

// Listen for event
globalEventBus.on('focus:lost', (event) => {
  console.log('Focus lost:', event);
});

// Remove listener (cleanup)
globalEventBus.off('focus:lost', handlerFunction);
```

---

## Module Dependencies Graph

```
FocusMonitor
  ├─ depends on: Page Visibility API (browser), EventBus
  └─ emits: focus:lost, focus:restored

WarningMessagePool
  ├─ depends on: (none, pure data)
  └─ provides: getRandomMessage()

WarningInjector
  ├─ depends on: FocusMonitor, AudioPlayer, EventBus, WarningMessagePool
  ├─ listens: report:complete, focus:restored
  └─ emits: warning:ready

AudioPlayer
  ├─ depends on: EventBus, SSMLSynthesizer (existing)
  ├─ listens: warning:ready (NEW)
  └─ emits: warning:playing (NEW), warning:complete (NEW)
```

**No Circular Dependencies**: Dependency flow is unidirectional (top to bottom)

---

## Initialization Sequence

Correct initialization order to avoid race conditions:

```javascript
// 1. Initialize existing systems
await audioPlayer.initialize();

// 2. Initialize focus monitor (starts emitting events)
focusMonitor.initialize();

// 3. Initialize warning injector (starts listening for events)
warningInjector.initialize(focusMonitor, audioPlayer);

// Now system is fully operational:
// - focusMonitor tracks visibility
// - warningInjector checks conditions on report:complete
// - audioPlayer plays warnings on warning:ready
```

**Order Matters**: AudioPlayer must be initialized before WarningInjector to ensure event listeners are registered.

---

## Error Handling Contracts

### FocusMonitor Error Cases

| Error Condition | Behavior |
|-----------------|----------|
| Page Visibility API unsupported | Log warning, disable feature, broadcast continues normally |
| Multiple initialize() calls | Log warning, ignore subsequent calls (idempotent) |
| Timer failure | Log error, attempt to restart timer |

### WarningInjector Error Cases

| Error Condition | Behavior |
|-----------------|----------|
| FocusMonitor not initialized | Throw error on initialize() |
| AudioPlayer not initialized | Throw error on initialize() |
| No warning messages in pool | Throw error (critical failure, should never happen) |

### AudioPlayer Error Cases

| Error Condition | Behavior |
|-----------------|----------|
| TTS synthesis fails | Log error, skip warning, continue broadcast (no retry) |
| Audio playback fails | Log error, emit warning:complete anyway (for state consistency) |
| warning:ready during stopped playback | Ignore event (warningInjector checks isPlaying) |

---

## Testing Contracts

### Manual Testing Interface

For manual testing, expose state inspection methods:

```javascript
// Debug interface (not used in production)
window.__DEBUG_INACTIVITY__ = {
  getFocusState: () => focusMonitor.getFocusState(),
  forceWarning: () => warningInjector.checkAndInject(),
  getMessagePool: () => getAllMessages(),
  eventLog: []  // Populated by event listeners during testing
};

// Log all inactivity events (manual test page only)
['focus:lost', 'focus:restored', 'warning:ready', 'warning:playing', 'warning:complete'].forEach(event => {
  globalEventBus.on(event, (payload) => {
    window.__DEBUG_INACTIVITY__.eventLog.push({ event, payload, timestamp: Date.now() });
  });
});
```

### Manual Test Scenarios

Each contract should be validated by manual testing:

1. **FocusMonitor.initialize()**: Verify focus:lost/focus:restored events fire correctly
2. **WarningMessagePool.getRandomMessage()**: Verify all 10 messages appear over 50 calls
3. **WarningInjector.checkAndInject()**: Verify warnings only trigger after 60+ seconds unfocused
4. **AudioPlayer warning playback**: Verify audio plays without interrupting broadcast
5. **Error handling**: Verify graceful degradation if Page Visibility API unavailable

---

## Versioning & Compatibility

**API Version**: 1.0.0
**Breaking Changes**: None (new feature, no existing APIs modified)
**Browser Compatibility**: Requires Page Visibility API (Chrome 13+, Firefox 10+, Safari 7+, Edge all)

---

## Next Steps

Contracts are complete. Proceed to:

1. Generate quickstart.md (developer guide)
2. Update agent context (CLAUDE.md)
