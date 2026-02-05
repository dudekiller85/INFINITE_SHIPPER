# Implementation Plan: Inactivity Warning Messages

**Branch**: `005-inactivity-warnings` | **Date**: 2026-02-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-inactivity-warnings/spec.md`

## Summary

Add inactivity detection that monitors browser tab focus state and injects haunting warning messages into the broadcast when the listener has been absent for more than 60 seconds. Warning messages are randomly selected from a predefined pool of 10 messages and repeat every 60 seconds until focus is restored. Messages are injected at natural boundaries between broadcast segments to avoid interrupting audio playback.

## Technical Context

**Language/Version**: JavaScript ES6+ (browser-based), Node.js 18+ for tooling
**Primary Dependencies**: Google Cloud TTS API (en-GB-Neural2-B voice), SSML template builder, Page Visibility API
**Storage**: Browser localStorage for motion preference persistence (client-side only)
**Testing**: Manual browser testing with test HTML pages (per constitution: no automated testing required)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge) with Page Visibility API support
**Project Type**: Single-page web application (browser-based audio generation)
**Performance Goals**: Warning detection within 1 second of threshold, injection within 5 seconds of message boundary
**Constraints**: No audio interruptions during playback, graceful degradation if Page Visibility API unavailable
**Scale/Scope**: Single-user interactive experience, lightweight state tracking (< 1KB memory overhead)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Manual Testing Required ✓
- **Status**: PASS
- **Rationale**: This feature will be validated through manual browser testing using test HTML pages. Focus loss/gain scenarios can be easily tested by switching tabs and verifying warning messages play at the correct intervals.

### Natural Speech Quality ✓
- **Status**: PASS
- **Rationale**: Warning messages will use the same Google Cloud TTS en-GB-Neural2-B voice and SSML synthesis pipeline as the existing broadcast content, ensuring consistent voice characteristics and natural cadence.

### Real-Time Generation ✓
- **Status**: PASS
- **Rationale**: Warning messages will be synthesized in real-time via the existing SSMLSynthesizer using Google Cloud TTS, maintaining the same quality standard as area forecasts.

**Overall**: All constitution principles satisfied. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/005-inactivity-warnings/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── focus-monitor-interface.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── audio/
│   ├── player.js                    # MODIFY: Inject warning messages into playback flow
│   ├── ssml-synthesizer.js          # EXISTING: Used for warning message synthesis
│   └── tts-service-adapter.js       # EXISTING: Google Cloud TTS integration
├── core/
│   ├── generator.js                 # EXISTING: Weather report generator
│   ├── broadcast-generator.js       # EXISTING: EBNF broadcast generator
│   └── buffer.js                    # EXISTING: Report buffer
├── focus/                           # NEW: Focus monitoring and warning system
│   ├── focus-monitor.js             # NEW: Page Visibility API integration and timer logic
│   ├── warning-message-pool.js      # NEW: 10 predefined warning messages
│   └── warning-injector.js          # NEW: Coordinates warning injection with player
└── state/
    └── events.js                    # EXISTING: EventBus for cross-module communication

tests/
├── integration/                     # EXISTING: Integration test structure
│   └── focus-warning-flow.test.js   # NEW (OPTIONAL): Manual test script for validation
└── manual/                          # NEW: Manual testing HTML pages
    └── test-inactivity-warnings.html # NEW: Interactive test page for focus scenarios
```

**Structure Decision**: Single-project structure with new `focus/` module for encapsulation. The warning system integrates with the existing player via the event bus and direct player method calls. Manual testing infrastructure added per constitution guidelines.

## Complexity Tracking

> No constitution violations - this section intentionally empty.

## Phase 0: Research & Discovery

### Research Tasks

1. **Page Visibility API Best Practices**
   - Research cross-browser compatibility and fallback strategies
   - Document event lifecycle (visibilitychange, document.hidden)
   - Investigate mobile browser behavior (screen lock, app switching)
   - Determine polyfill requirements for older browsers

2. **Audio Injection Patterns**
   - Research how to inject audio at message boundaries without interruption
   - Investigate the existing player's event system and hooks
   - Determine how to queue warning messages in the playback flow
   - Analyze the `_playFullBroadcast()` and `_speakText()` methods for injection points

3. **Timer Management Strategies**
   - Research accurate interval timing in background tabs (requestAnimationFrame vs setInterval)
   - Investigate browser throttling of background timers
   - Determine how to maintain timer accuracy across focus changes
   - Research Date.now() vs performance.now() for timestamp tracking

4. **Google Cloud TTS Integration**
   - Verify existing SSMLSynthesizer can synthesize arbitrary text
   - Research SSML prosody tags for maintaining haunting aesthetic
   - Investigate caching strategy for warning messages (10 messages, pre-synthesize vs on-demand)
   - Determine TTS API rate limits and error handling

### Expected Outcomes

- **Decision**: Use Page Visibility API with graceful degradation (no polyfill, feature detection only)
- **Decision**: Inject warnings via a new event `warning:ready` that the player listens for
- **Decision**: Use setInterval for timer management (acceptable accuracy for 60-second threshold)
- **Decision**: Pre-synthesize all 10 warning messages on first inactivity trigger and cache indefinitely

## Phase 1: Design Artifacts

### Data Model

See [data-model.md](data-model.md) for complete entity definitions. Key entities:

- **FocusState**: Tracks current visibility state and focus loss timestamp
- **WarningMessage**: Represents one of 10 predefined warning text strings
- **WarningInjectionRequest**: Event payload for coordinating warning playback

### API Contracts

See [contracts/focus-monitor-interface.md](contracts/focus-monitor-interface.md) for complete interface definitions. Key contracts:

- **FocusMonitor**: Public API for initializing monitoring, getting focus state
- **EventBus Events**: `focus:lost`, `focus:restored`, `warning:ready`, `warning:playing`, `warning:complete`

### Integration Points

1. **AudioPlayer._playFullBroadcast()**
   - Add event listener for `warning:ready` events
   - When received, check if it's a good time to inject (between area forecasts)
   - Call `_speakText()` with warning message text
   - Emit `warning:complete` when finished

2. **FocusMonitor.initialize()**
   - Called from main application initialization (likely in index.html or main.js)
   - Registers Page Visibility API listeners
   - Starts monitoring immediately (no user action required)

3. **WarningInjector.checkAndInject()**
   - Called when broadcast message completes (listen for `report:complete` event)
   - Checks if 60+ seconds have elapsed since focus loss
   - If yes, emits `warning:ready` event with randomly selected message
   - Updates timer for next warning interval

## Phase 2: Implementation Tasks

*Tasks will be generated by the `/speckit.tasks` command - not included in this plan.*

## Testing Strategy (Manual)

Per constitution, this feature will be validated through manual browser testing only.

### Test Scenarios (to be executed manually)

1. **Basic Inactivity Detection**
   - Open broadcast, switch to another tab for 61 seconds
   - Return to broadcast tab
   - Verify warning message plays before next area forecast

2. **Repeated Warnings**
   - Leave tab unfocused for 5+ minutes
   - Return to tab
   - Verify warnings played at ~60-second intervals (count them)

3. **Focus Restored Before Threshold**
   - Switch tabs for 30 seconds, return
   - Verify no warning plays

4. **Mid-Warning Focus Restore**
   - Trigger warning, return to tab while warning is playing
   - Verify warning completes without interruption
   - Verify next content is normal broadcast (not another warning)

5. **Browser Compatibility**
   - Test in Chrome, Firefox, Safari, Edge
   - Verify warnings work in all browsers
   - Verify graceful degradation if Page Visibility API missing

### Test Page

Create `tests/manual/test-inactivity-warnings.html` with:
- Start/stop broadcast controls
- Timer display showing focus state and elapsed time
- Log of warning events and timestamps
- Instructions for manual testing scenarios

## Risk Assessment

### High Risk

- **Audio interruption during injection**: Mitigated by only injecting at message boundaries, listening for `report:complete` events
- **Timer drift in background tabs**: Accepted risk (browsers throttle background timers, ±10 second tolerance acceptable per success criteria)

### Medium Risk

- **Page Visibility API unsupported**: Mitigated with feature detection and graceful degradation (no warnings, broadcast continues)
- **TTS synthesis failure for warnings**: Mitigated by using same synthesis pipeline as main broadcast (already proven reliable)

### Low Risk

- **Random message distribution not feeling varied**: Accepted risk (true random selection may repeat, but 10 messages provide sufficient variety)
- **Warning message length variability**: All 10 messages are similar length (~15-30 seconds), no special handling needed

## Dependencies

### External Dependencies

- Page Visibility API (browser standard, IE10+)
- Google Cloud TTS API (already integrated)
- Existing SSMLSynthesizer and AudioPlayer modules

### Internal Dependencies

- Event bus system (existing)
- Player playback lifecycle events (existing)
- SSML synthesis infrastructure (existing)

### Dependency Flow

```
User switches tab
  ↓
Page Visibility API fires visibilitychange event
  ↓
FocusMonitor records timestamp, starts timer
  ↓
Timer checks every second: elapsed > 60?
  ↓
report:complete event fires (between area forecasts)
  ↓
WarningInjector checks timer, emits warning:ready
  ↓
AudioPlayer receives warning:ready, synthesizes warning
  ↓
Warning plays, AudioPlayer emits warning:complete
  ↓
WarningInjector resets timer for next 60-second interval
  ↓
User returns to tab
  ↓
FocusMonitor clears timer, emits focus:restored
```

## Success Metrics (from spec)

- **SC-001**: Warning plays within 5 seconds of next message boundary after 60+ seconds unfocused
- **SC-002**: No message plays more than twice in any 5-warning sequence
- **SC-003**: Repeated warnings occur at 60-second intervals ±10 seconds
- **SC-004**: Normal broadcast resumes within 2 seconds of warning completion
- **SC-005**: No audio interruptions during transitions
- **SC-006**: 100% accuracy on 60-second threshold (no warnings at 59 seconds)

All metrics will be validated through manual testing using the test HTML page with timer displays and event logging.

## Open Questions (To be resolved in Phase 0)

1. Should warning messages be pre-synthesized on app load or on first inactivity trigger?
   - **Recommendation**: First inactivity trigger (avoids unnecessary TTS API calls if user never leaves)

2. Should the 60-second timer use wall-clock time or adjust for browser tab throttling?
   - **Recommendation**: Wall-clock time (Date.now()), simpler and matches user expectation

3. Should warnings play if the broadcast is paused/stopped?
   - **Recommendation**: No, only inject warnings during active playback (check `audioPlayer.isPlaying`)

4. Should the system track total unfocused time across page reloads?
   - **Recommendation**: No, state resets on reload per scope boundary in spec

5. How should rapid focus changes (on/off within seconds) be handled?
   - **Recommendation**: Use first focus loss timestamp, don't reset timer until focus fully restored for >1 second

These questions will be formally answered in research.md during Phase 0.
