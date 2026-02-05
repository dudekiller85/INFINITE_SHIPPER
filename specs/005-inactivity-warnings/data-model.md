# Data Model: Inactivity Warning Messages

**Feature**: 005-inactivity-warnings
**Date**: 2026-02-02
**Status**: Complete

## Overview

This document defines the data structures and state management for the inactivity warning system. All entities are held in memory (no persistence across page reloads per spec).

## Core Entities

### FocusState

Tracks the current visibility state of the browser tab and timing information for warning triggers.

**Attributes**:

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `isVisible` | boolean | Current tab visibility state | Required, default: true |
| `focusLostTimestamp` | number \| null | Timestamp (ms) when focus was first lost | null when focused, Date.now() when lost |
| `lastWarningTimestamp` | number \| null | Timestamp (ms) when last warning was played | null initially, Date.now() after warning |
| `warningCount` | number | Number of warnings played in current unfocused session | Required, default: 0, resets on focus restore |

**State Transitions**:

```
[Focused] → visibilitychange(hidden) → [Unfocused]
  - Set focusLostTimestamp = Date.now()
  - Reset lastWarningTimestamp = null
  - Reset warningCount = 0

[Unfocused] → timer elapsed 60s → [Warning Pending]
  - No state change (handled by WarningInjector)

[Warning Pending] → report:complete event → [Warning Playing]
  - Emit warning:ready event (state change handled by AudioPlayer)

[Warning Playing] → warning:complete event → [Unfocused]
  - Set lastWarningTimestamp = Date.now()
  - Increment warningCount++

[Unfocused] → visibilitychange(visible) → [Focused]
  - Set focusLostTimestamp = null
  - Set lastWarningTimestamp = null
  - Set warningCount = 0
```

**Validation Rules**:
- `focusLostTimestamp` MUST be null when `isVisible === true`
- `warningCount` MUST be >= 0
- `lastWarningTimestamp` MUST be >= `focusLostTimestamp` if both are non-null

---

### WarningMessage

Represents a single warning message from the predefined pool of 10 messages.

**Attributes**:

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | number | Unique identifier (0-9) | Required, 0 <= id <= 9 |
| `text` | string | Warning message text for TTS synthesis | Required, 50-300 characters |

**Predefined Messages** (from spec):

```javascript
const WARNING_MESSAGES = [
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
```

**Validation Rules**:
- Text MUST NOT be empty
- Text MUST NOT exceed 500 characters (TTS API limit)
- No duplicate IDs in pool

**Random Selection**:
```javascript
function getRandomMessage() {
  const index = Math.floor(Math.random() * WARNING_MESSAGES.length);
  return WARNING_MESSAGES[index];
}
```

---

### WarningInjectionRequest

Event payload for coordinating warning message injection between WarningInjector and AudioPlayer.

**Attributes**:

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `messageId` | number | ID of warning message to play | Required, 0 <= id <= 9 |
| `messageText` | string | Warning message text | Required, matches WarningMessage.text |
| `timestamp` | number | Time when injection was requested (ms) | Required, Date.now() |
| `warningCount` | number | Sequential number of this warning in session | Required, >= 1 |

**Usage**:
- Emitted as event payload for `warning:ready` event
- Consumed by AudioPlayer to synthesize and play warning
- Logged for debugging and manual testing validation

**Example**:
```javascript
const injectionRequest = {
  messageId: 3,
  messageText: "It has been five minutes since your last pulse of attention...",
  timestamp: 1709395200000,
  warningCount: 2  // Second warning in this unfocused session
};

globalEventBus.emit('warning:ready', injectionRequest);
```

---

### TimerConfig

Configuration for the inactivity timer and warning intervals.

**Attributes**:

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `inactivityThresholdMs` | number | Milliseconds before first warning triggers | Required, default: 60000 (60s) |
| `warningIntervalMs` | number | Milliseconds between repeated warnings | Required, default: 60000 (60s) |
| `timerCheckIntervalMs` | number | Milliseconds between timer checks | Required, default: 1000 (1s) |
| `focusRestoreDebounceMs` | number | Milliseconds to wait before clearing focus timer | Required, default: 1000 (1s) |

**Validation Rules**:
- All values MUST be > 0
- `inactivityThresholdMs` MUST be >= 1000 (minimum 1 second)
- `warningIntervalMs` MUST be >= 1000 (minimum 1 second)
- `timerCheckIntervalMs` SHOULD be <= 1000 (faster checks = better accuracy)

**Rationale for Defaults**:
- **60000ms threshold**: From spec requirement (60 seconds)
- **60000ms interval**: From spec requirement (repeat every minute)
- **1000ms check interval**: Balances accuracy (±1s) with performance (1 timer per second acceptable)
- **1000ms debounce**: Prevents flicker from rapid tab switching (spec edge case)

---

## Event Payloads

### focus:lost

Emitted when browser tab loses focus (user switches away).

**Payload**:
```javascript
{
  timestamp: number,  // Date.now() when focus lost
  previousState: {    // State before focus loss
    isVisible: boolean,
    focusLostTimestamp: number | null
  }
}
```

---

### focus:restored

Emitted when browser tab regains focus (user returns).

**Payload**:
```javascript
{
  timestamp: number,         // Date.now() when focus restored
  unfocusedDurationMs: number, // Time spent unfocused (ms)
  warningsPlayed: number       // Number of warnings during absence
}
```

---

### warning:ready

Emitted when a warning message should be injected into playback.

**Payload**: WarningInjectionRequest (see above)

---

### warning:playing

Emitted when warning message audio begins playing.

**Payload**:
```javascript
{
  messageId: number,     // ID of warning message
  timestamp: number,     // Date.now() when playback started
  warningCount: number   // Sequential warning number
}
```

---

### warning:complete

Emitted when warning message audio finishes playing.

**Payload**:
```javascript
{
  messageId: number,         // ID of warning message
  timestamp: number,         // Date.now() when playback completed
  durationMs: number,        // Audio duration (for timing validation)
  synthesisSource: string    // 'google-tts' | 'cache'
}
```

---

## State Management

### In-Memory State

All state is held in JavaScript module scope (no localStorage, no IndexedDB).

**FocusMonitor State**:
```javascript
// src/focus/focus-monitor.js
class FocusMonitor {
  constructor() {
    this.focusState = {
      isVisible: !document.hidden,
      focusLostTimestamp: null,
      lastWarningTimestamp: null,
      warningCount: 0
    };
    this.timerInterval = null;
    this.debounceTimer = null;
  }
}
```

**WarningMessagePool State**:
```javascript
// src/focus/warning-message-pool.js
const WARNING_MESSAGES = [...]; // Constant, never mutates
```

**WarningInjector State**:
```javascript
// src/focus/warning-injector.js
class WarningInjector {
  constructor(focusMonitor, audioPlayer) {
    this.focusMonitor = focusMonitor;
    this.audioPlayer = audioPlayer;
    this.pendingWarning = null; // WarningInjectionRequest | null
  }
}
```

### State Lifecycle

```
Page Load
  ↓
Initialize FocusMonitor (isVisible: true, timestamps: null)
  ↓
User Switches Tab
  ↓
FocusMonitor updates state (focusLostTimestamp: Date.now())
  ↓
Timer checks every 1s: elapsed > 60s?
  ↓
WarningInjector emits warning:ready
  ↓
AudioPlayer plays warning, updates warningCount
  ↓
User Returns to Tab
  ↓
FocusMonitor resets state (timestamps: null, warningCount: 0)
  ↓
Page Reload → All state cleared (fresh initialization)
```

---

## Validation & Constraints

### Timer Accuracy

| Requirement | Implementation | Validation |
|-------------|----------------|------------|
| Threshold ≥ 60s | Check: `elapsed > 60000` (strict inequality) | Manual test: 59s = no warning, 61s = warning |
| Interval ±10s | Wall-clock time (Date.now()), accept throttling | Manual test: 5 warnings in 5min ±50s total |
| Boundary injection | Check at `report:complete` events only | Manual test: No mid-message interruptions |

### Message Distribution

| Requirement | Implementation | Validation |
|-------------|----------------|------------|
| Random selection | `Math.random()` × 10, floor | Manual test: Record 20 warnings, check distribution |
| No bias | No history tracking (true random) | Manual test: All 10 messages appear over 50 warnings |

### State Consistency

| Invariant | Enforcement |
|-----------|-------------|
| `focusLostTimestamp` null when visible | Clear on focus restore |
| `warningCount` resets on focus restore | Set to 0 on visibilitychange(visible) |
| `lastWarningTimestamp` >= `focusLostTimestamp` | Only set after focus lost |

---

## Memory & Performance

### Memory Footprint

| Entity | Size | Quantity | Total |
|--------|------|----------|-------|
| FocusState | ~64 bytes | 1 | 64 bytes |
| WarningMessage pool | ~3 KB | 1 | 3 KB |
| Audio cache (10 warnings) | ~5 MB | 1 (lazy) | 5 MB |
| Event listeners | ~100 bytes | 5 | 500 bytes |

**Total**: ~5 MB (dominated by cached audio, allocated lazily)

### Performance Impact

- **Timer overhead**: 1 function call per second (negligible)
- **Event emission**: 2-4 events per warning cycle (negligible)
- **TTS synthesis**: First warning only (~500ms), cached thereafter (0ms)

### Cleanup

- Timers cleared on page unload (automatic)
- Event listeners removed on cleanup (manual, optional)
- Audio cache cleared on page reload (automatic)

---

## Integration with Existing Systems

### AudioPlayer Integration

**Existing State**:
```javascript
class AudioPlayer {
  constructor() {
    this.isPlaying = false;
    this.currentReport = null;
    this.ssmlSynthesizer = SSMLSynthesizer;
  }
}
```

**New Listeners** (added):
```javascript
// In AudioPlayer.initialize()
globalEventBus.on('warning:ready', (injectionRequest) => {
  this._handleWarningInjection(injectionRequest);
});
```

**No State Conflicts**: Warning injection is event-driven and stateless (no shared mutable state with broadcast playback).

---

## Next Steps

Data model is complete. Proceed to:

1. Generate contracts/focus-monitor-interface.md (API contracts)
2. Generate quickstart.md (developer guide)
3. Update agent context (CLAUDE.md)
