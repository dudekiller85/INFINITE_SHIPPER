# Research Document: Inactivity Warning Messages

**Feature**: 005-inactivity-warnings
**Date**: 2026-02-02
**Status**: Complete

## Purpose

This document captures research findings and technical decisions for implementing inactivity warning messages in the INFINITE_SHIPPER broadcast system. All "NEEDS CLARIFICATION" items from the technical context have been resolved through research and documented below.

## Research Findings

### 1. Page Visibility API Best Practices

**Research Question**: How should we reliably detect browser tab focus across different browsers?

**Findings**:

The Page Visibility API is a W3C standard supported by all modern browsers:
- **Chrome**: 13+ (2011)
- **Firefox**: 10+ (2012)
- **Safari**: 7+ (2013)
- **Edge**: All versions

**API Surface**:
```javascript
// Detection
if (typeof document.hidden !== 'undefined') {
  // Page Visibility API is supported
}

// Event listener
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Tab is hidden (user switched away)
  } else {
    // Tab is visible (user returned)
  }
});

// State query
const isHidden = document.hidden;
const visibilityState = document.visibilityState; // 'visible', 'hidden', 'prerender'
```

**Mobile Behavior**:
- iOS Safari: Fires visibilitychange on app backgrounding and screen lock
- Android Chrome: Fires visibilitychange on app switching
- Both platforms treat backgrounded tabs as "hidden"

**Decision**: Use Page Visibility API with feature detection
- **Rationale**: 100% coverage of target browsers (Chrome, Firefox, Safari, Edge), no polyfill needed
- **Fallback**: If unsupported (extremely rare), feature gracefully degrades (no warnings, broadcast continues)
- **Implementation**: Check `typeof document.hidden !== 'undefined'` before registering listeners

**Alternatives Considered**:
- `window.onblur/onfocus`: Rejected (fires for dialog boxes, dev tools, not just tab switches)
- `requestIdleCallback`: Rejected (detects idle time, not visibility)
- Third-party libraries: Rejected (unnecessary dependency for well-supported API)

---

### 2. Audio Injection Patterns

**Research Question**: How do we inject warning messages at natural boundaries without interrupting playback?

**Findings**:

The existing player architecture provides clean injection points:

1. **Event System** (`src/state/events.js`):
   - GlobalEventBus already exists for cross-module communication
   - Player emits `report:complete` after each area forecast
   - Player emits `playback:started`, `playback:stopped`, `playback:error`

2. **Broadcast Flow** (`src/audio/player.js`):
   - `_playFullBroadcast()` iterates through area forecasts sequentially
   - Each forecast calls `_speakText()` or `_playSSMLReport()`
   - Natural boundaries exist between forecasts (no mid-message interruption)

3. **Injection Strategy**:
   - Listen for `report:complete` events
   - Check if warning should be injected (timer elapsed, player is playing)
   - Emit `warning:ready` event with message text
   - Player listens for `warning:ready`, calls `_speakText()` to synthesize/play
   - Player emits `warning:complete` when done

**Decision**: Event-based injection via `warning:ready` event
- **Rationale**: Leverages existing event infrastructure, maintains separation of concerns
- **Flow**: FocusMonitor → WarningInjector → (emits warning:ready) → AudioPlayer → (synthesizes and plays)
- **Boundary Detection**: Use `report:complete` event as trigger point to check if warning needed

**Alternatives Considered**:
- Direct player method calls: Rejected (tight coupling, hard to test)
- Queue-based injection: Rejected (over-engineered for simple use case)
- Modifying broadcast generator: Rejected (warnings are orthogonal to broadcast content)

---

### 3. Timer Management Strategies

**Research Question**: How do we accurately track 60-second intervals, especially in background tabs?

**Findings**:

Browser timer behavior in background tabs:
- **setInterval/setTimeout**: Throttled to 1000ms minimum in background (Chrome, Firefox)
- **requestAnimationFrame**: Paused entirely in background tabs
- **Date.now()**: Not throttled (wall-clock time, always accurate)

**Timer Accuracy Requirements** (from spec):
- Threshold: 60 seconds (must exceed, 59 seconds = no warning)
- Interval: 60 seconds ±10 seconds between warnings
- Throttling acceptable given tolerance

**Timer Strategy Options**:

1. **setInterval + Date.now()**:
   ```javascript
   let focusLostTimestamp = null;
   const checkTimer = setInterval(() => {
     if (focusLostTimestamp && Date.now() - focusLostTimestamp > 60000) {
       // Trigger warning
     }
   }, 1000);
   ```
   - Pros: Simple, wall-clock accurate, auto-recovers from throttling
   - Cons: Background throttling adds latency (acceptable per spec)

2. **performance.now() + RAF**:
   - Pros: High precision timing
   - Cons: RAF pauses in background (defeats purpose)

3. **Web Workers**:
   - Pros: Not throttled in background
   - Cons: Over-engineered, adds complexity, no significant benefit

**Decision**: setInterval (1000ms) + Date.now() timestamps
- **Rationale**: Simple, reliable, meets ±10 second tolerance requirement
- **Accuracy**: Wall-clock time (Date.now()) ensures threshold always exceeded correctly
- **Throttling Impact**: Background tabs may delay warning by 1-2 seconds (acceptable per SC-001: "within 5 seconds")

**Alternatives Considered**:
- Web Workers: Rejected (unnecessary complexity for 60-second tolerance)
- performance.now(): Rejected (not needed, Date.now() sufficient for 1-second granularity)

---

### 4. Google Cloud TTS Integration

**Research Question**: Can we synthesize warning messages with the same voice and quality as broadcasts?

**Findings**:

**Existing Integration** (from codebase analysis):
- `SSMLSynthesizer` class in `src/audio/ssml-synthesizer.js`
- Uses Google Cloud TTS API with en-GB-Neural2-B voice
- Already synthesizes arbitrary text via `synthesizeText(text, label)` method
- Built-in caching layer via `audio-cache.js`

**Warning Message Synthesis**:
```javascript
const ssmlSynthesizer = new SSMLSynthesizer({ enableCache: true });
const audioBlob = await ssmlSynthesizer.synthesizeText(warningMessage, 'InactivityWarning');
// Returns: { audioBlob, cached: boolean }
```

**Caching Strategy**:
- Cache key: Text content (consistent for 10 predefined messages)
- Cache lifetime: Indefinite (messages never change)
- Storage: In-memory cache (audio-cache.js manages eviction)

**TTS API Limits** (Google Cloud TTS):
- Rate limit: 1000 requests/min (more than sufficient)
- Character limit: 5000 per request (warning messages ~200 chars)
- Cost: $4 per 1M characters (~$0.0008 per warning message)

**SSML Enhancement**:
The existing system uses SSML for prosody control. Warning messages can use:
```xml
<speak>
  <prosody rate="slow" pitch="-2st">
    The forecast is now reading back your own silence...
  </prosody>
</speak>
```

**Decision**: Use existing SSMLSynthesizer with lazy caching
- **Rationale**: Already proven reliable, same voice quality as broadcasts, built-in caching
- **Strategy**: Synthesize on first inactivity trigger, cache indefinitely for repeat use
- **Prosody**: Use slightly slower rate and lower pitch for haunting effect (optional enhancement)

**Alternatives Considered**:
- Pre-synthesis on app load: Rejected (wastes 10 TTS API calls if user never goes inactive)
- Browser Speech Synthesis API: Rejected (inconsistent quality, no guarantee of BBC Radio 4 voice)
- Pre-recorded MP3 files: Rejected (violates constitution principle IV: Real-Time Generation)

---

## Open Questions Resolved

### Q1: Should warning messages be pre-synthesized on app load or on first inactivity trigger?

**Answer**: First inactivity trigger

**Reasoning**:
- Avoids unnecessary TTS API calls if user never leaves tab
- Caching layer ensures subsequent warnings use cached audio
- First warning may have 1-2 second synthesis delay (acceptable, happens during unfocused time)
- Total cost: 10 TTS calls on first inactivity vs 10 calls on every page load

**Implementation**: WarningInjector synthesizes warning message when first emitting `warning:ready` event, SSMLSynthesizer caches result for future use.

---

### Q2: Should the 60-second timer use wall-clock time or adjust for browser tab throttling?

**Answer**: Wall-clock time (Date.now())

**Reasoning**:
- Matches user expectation (real seconds, not "perceived" time)
- Automatically handles throttling (timestamp comparison always accurate)
- Simpler implementation (no throttling compensation logic needed)
- Spec requires ±10 second tolerance (wall-clock time easily meets this)

**Implementation**: Store `focusLostTimestamp = Date.now()` on focus loss, check `Date.now() - focusLostTimestamp > 60000` every second.

---

### Q3: Should warnings play if the broadcast is paused/stopped?

**Answer**: No, only during active playback

**Reasoning**:
- Spec states "injected at the next opportunity after a message completes"
- If broadcast is stopped, no messages are completing
- Warning makes no sense without active broadcast context
- Prevents confusing edge case (user stops broadcast, switches tabs, returns to paused warning)

**Implementation**: Check `audioPlayer.isPlaying === true` before emitting `warning:ready` event. If false, hold warning until playback resumes.

---

### Q4: Should the system track total unfocused time across page reloads?

**Answer**: No, state resets on reload

**Reasoning**:
- Spec explicitly states "Warning message persistence across page reloads (state resets on reload)" in Out of Scope section
- Page reload is an intentional user action (returning focus to the site)
- Simpler implementation (no localStorage persistence needed)
- Matches user expectation (reload = fresh start)

**Implementation**: All state (focusLostTimestamp, warningCount, cache) is held in memory only. Page reload clears everything.

---

### Q5: How should rapid focus changes (on/off within seconds) be handled?

**Answer**: Use first focus loss timestamp, debounce focus restoration

**Reasoning**:
- Prevents timer reset abuse (user could delay warning by rapidly clicking in/out)
- Matches spec edge case: "Use the first loss-of-focus timestamp; timer doesn't reset until focus is fully regained"
- Debounce prevents flicker (user hovers over tab, returns immediately)

**Implementation**:
- Store `focusLostTimestamp` on first `visibilitychange` to hidden
- Don't reset timestamp on subsequent hidden events
- On `visibilitychange` to visible, wait 1 second before clearing timestamp (debounce)
- If focus lost again within 1 second, don't clear timestamp

---

## Technical Decisions Summary

| Decision Area | Choice | Key Rationale |
|---------------|--------|---------------|
| **Focus Detection** | Page Visibility API | 100% browser support, no polyfill needed |
| **Injection Method** | Event-based (`warning:ready`) | Leverages existing event bus, loose coupling |
| **Timer Strategy** | setInterval + Date.now() | Simple, accurate, meets ±10s tolerance |
| **TTS Integration** | Existing SSMLSynthesizer | Same voice quality, proven reliable |
| **Caching Strategy** | Lazy (first use) + indefinite | Avoids unnecessary API calls, fast repeat |
| **Message Synthesis** | On first inactivity | Balances performance and API cost |
| **Timer Basis** | Wall-clock time | Matches user expectation, handles throttling |
| **Playback Requirement** | Active playback only | Spec-compliant, prevents edge cases |
| **State Persistence** | In-memory only | Per spec, reload = reset |
| **Focus Debouncing** | 1-second delay | Prevents rapid flicker, per spec edge case |

---

## Implementation Guidelines

### Module Responsibilities

**FocusMonitor** (`src/focus/focus-monitor.js`):
- Registers Page Visibility API listeners
- Tracks focus state (visible/hidden) and timestamps
- Emits `focus:lost` and `focus:restored` events
- Manages debounce logic for focus restoration

**WarningMessagePool** (`src/focus/warning-message-pool.js`):
- Stores 10 predefined warning message strings
- Provides `getRandomMessage()` method for selection
- No state (pure data structure)

**WarningInjector** (`src/focus/warning-injector.js`):
- Listens for `report:complete` events
- Checks timer: `Date.now() - focusLostTimestamp > 60000`
- Checks player state: `audioPlayer.isPlaying === true`
- Emits `warning:ready` event with selected message
- Tracks last warning timestamp for 60-second interval

**AudioPlayer** (`src/audio/player.js` - modifications):
- Listens for `warning:ready` events
- Calls `_speakText(message, 'InactivityWarning')` to synthesize/play
- Emits `warning:complete` when playback finishes
- No changes to existing broadcast flow

---

## Risk Mitigation

### Identified Risks from Plan

1. **Audio interruption during injection**
   - Mitigation: Only inject at `report:complete` boundaries
   - Status: Resolved by event-based design

2. **Timer drift in background tabs**
   - Mitigation: Use wall-clock time (Date.now()), ±10s tolerance
   - Status: Resolved by timer strategy

3. **Page Visibility API unsupported**
   - Mitigation: Feature detection, graceful degradation
   - Status: Resolved by `typeof document.hidden` check

4. **TTS synthesis failure**
   - Mitigation: Use same pipeline as broadcasts, error logging
   - Status: Resolved by SSMLSynthesizer reuse

---

## Next Steps

Phase 0 research is complete. Proceed to Phase 1:

1. Generate data-model.md (entity definitions)
2. Generate contracts/focus-monitor-interface.md (API contracts)
3. Generate quickstart.md (developer guide)
4. Update agent context (CLAUDE.md)

All technical unknowns have been resolved. Implementation can proceed with confidence.
