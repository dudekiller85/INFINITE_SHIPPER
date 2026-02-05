# Implementation Tasks: Inactivity Warning Messages

**Feature**: 005-inactivity-warnings
**Branch**: `005-inactivity-warnings`
**Status**: Ready for implementation
**Created**: 2026-02-02

## Overview

This document provides a dependency-ordered task breakdown for implementing the inactivity warning feature. Tasks are organized by user story to enable independent, incremental delivery.

**Key Principle**: Each user story phase represents a complete, independently testable feature increment that delivers user value.

## Task Summary

| Phase | User Story | Task Count | Parallel Opportunities |
|-------|------------|------------|------------------------|
| Phase 1 | Setup | 2 | 1 (T002) |
| Phase 2 | Foundational | 3 | 2 (T004, T005) |
| Phase 3 | US1 - Basic Inactivity (P1) | 5 | 3 (T008, T009, T010) |
| Phase 4 | US2 - Repeated Warnings (P2) | 2 | 0 |
| Phase 5 | US3 - Mid-Warning Focus (P3) | 1 | 0 |
| Phase 6 | Polish & Manual Testing | 2 | 1 (T015) |
| **Total** | | **15** | **7 parallel tasks** |

---

## Phase 1: Setup

**Goal**: Initialize project structure for focus monitoring modules.

**Tasks**:

- [X] T001 Create src/focus/ directory for focus monitoring modules
- [X] T002 [P] Verify .gitignore contains node_modules/, dist/, *.log, .env* patterns

**Completion Criteria**: Focus module directory exists and git ignore patterns are configured.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Goal**: Implement shared components required by all user stories.

**Why Foundational**: These modules provide the infrastructure that all user stories depend on. Must complete before any user story implementation.

**Tasks**:

- [X] T003 Implement WarningMessagePool module in src/focus/warning-message-pool.js with 10 predefined messages and getRandomMessage() function
- [X] T004 [P] Implement FocusMonitor class in src/focus/focus-monitor.js with Page Visibility API integration, state tracking, and event emission
- [X] T005 [P] Implement WarningInjector class in src/focus/warning-injector.js with timer logic and warning:ready event emission

**Completion Criteria**:
- WarningMessagePool exports 10 messages and random selection function
- FocusMonitor detects visibility changes and maintains focus state
- WarningInjector coordinates timing and injection logic
- All three modules are ES6 modules with proper imports/exports

**Dependencies**: Must complete before Phase 3+ (user stories).

---

## Phase 3: User Story 1 - Listener Returns After Brief Absence (P1)

**Story Goal**: Detect when listener switches away for 61+ seconds and play one warning message at next message boundary.

**Why P1**: Core functionality - minimum viable feature that delivers immediate value.

**Independent Test Criteria**:
1. Open broadcast, switch to another tab for 61 seconds
2. Return to broadcast tab
3. Verify one warning message plays at next message boundary
4. Verify normal broadcast resumes after warning

**Acceptance Scenarios** (from spec):
- 61-second threshold triggers warning after message completes
- Warning waits for current message to complete (no interruption)
- Normal broadcast resumes after warning without additional warnings

**Tasks**:

- [X] T006 Add warning:ready event listener to AudioPlayer.initialize() in src/audio/player.js
- [X] T007 Implement AudioPlayer._handleWarningInjection() method in src/audio/player.js to synthesize and play warning via _speakText()
- [X] T008 [P] [US1] Initialize FocusMonitor from application entry point (index.html or main initialization)
- [X] T009 [P] [US1] Initialize WarningInjector with FocusMonitor and AudioPlayer dependencies
- [X] T010 [P] [US1] Register WarningInjector listener for report:complete events to trigger checkAndInject()

**Completion Criteria** (US1 Complete):
- [x] Focus loss detected after 60+ seconds
- [x] Warning injects at message boundary (listens to report:complete)
- [x] Warning synthesizes via Google Cloud TTS
- [x] Warning plays without interrupting current message
- [x] Normal broadcast resumes after warning
- [x] Manual test: Switch tabs for 61s, verify 1 warning plays

**MVP Scope**: This phase represents the minimum viable product. Stop here for initial release.

---

## Phase 4: User Story 2 - Extended Absence with Repeated Warnings (P2)

**Story Goal**: Play additional warnings every 60 seconds while listener remains away.

**Why P2**: Enhances immersion for extended absences. Builds on US1 foundation.

**Independent Test Criteria**:
1. Leave tab unfocused for 5+ minutes
2. Return to tab
3. Verify 5+ warning messages played at ~60-second intervals
4. Verify random message selection (messages vary)

**Acceptance Scenarios** (from spec):
- Multiple warnings play at 60-second intervals during extended absence
- Random selection ensures variety (10 message pool)
- Warning cycle stops when focus restored

**Tasks**:

- [X] T011 [US2] Update WarningInjector.checkAndInject() to use lastWarningTimestamp for interval calculation
- [X] T012 [US2] Update FocusMonitor.incrementWarningCount() to set lastWarningTimestamp after each warning

**Completion Criteria** (US2 Complete):
- [x] Multiple warnings play during extended absence
- [x] 60-second interval between warnings (±10s tolerance)
- [x] Random message selection from full pool
- [x] Warning count increments correctly
- [x] Manual test: 5 minutes unfocused = 5 warnings played

**Dependencies**: Requires Phase 3 (US1) complete.

---

## Phase 5: User Story 3 - Focus Regained Mid-Warning (P3)

**Story Goal**: Handle focus restoration gracefully while warning is playing.

**Why P3**: Edge case polish. Ensures smooth UX when user returns during playback.

**Independent Test Criteria**:
1. Trigger warning (lose focus for 61s)
2. Return to tab while warning is actively playing
3. Verify warning completes without cutoff
4. Verify next content is normal broadcast (not another warning)

**Acceptance Scenarios** (from spec):
- Warning completes if focus restored mid-playback (no abrupt cutoff)
- Next content after warning is normal broadcast

**Tasks**:

- [X] T013 [US3] Add focus:restored event listener to WarningInjector to clear pending warnings

**Completion Criteria** (US3 Complete):
- [x] Warning completes if focus restored during playback
- [x] No abrupt audio cutoff
- [x] Normal broadcast resumes after warning
- [x] No duplicate warnings after focus restored
- [x] Manual test: Return during warning playback, verify smooth completion

**Dependencies**: Requires Phase 4 (US2) complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Goal**: Add manual testing infrastructure and finalize integration.

**Tasks**:

- [X] T014 Create tests/manual/ directory for manual testing pages
- [X] T015 [P] Create test-inactivity-warnings.html manual test page in tests/manual/ with start/stop controls, timer display, event log, and testing instructions

**Completion Criteria**:
- Manual test page provides interactive testing interface
- Test page displays focus state, elapsed time, warning count
- Test page logs all inactivity-related events
- Test page includes instructions for 5 manual test scenarios

---

## Execution Strategy

### Recommended Approach

**Incremental Delivery**: Implement and validate each user story phase before proceeding to the next.

1. **Phase 1-2**: Setup and foundational modules (blocking for all stories)
2. **Phase 3**: US1 - Basic inactivity detection (MVP - stop here for initial release)
3. **Phase 4**: US2 - Repeated warnings (enhancement)
4. **Phase 5**: US3 - Mid-warning focus handling (polish)
5. **Phase 6**: Manual testing infrastructure

### Parallel Execution Opportunities

Tasks marked with `[P]` can run in parallel if different developers are available:

**Phase 1**:
- T002 can run independently (gitignore verification)

**Phase 2**:
- T004 (FocusMonitor) and T005 (WarningInjector) can run in parallel after T003 (WarningMessagePool) completes

**Phase 3 (US1)**:
- T008, T009, T010 can run in parallel (all initialization tasks)

**Phase 6**:
- T015 (test page) can run in parallel with other polish tasks

---

## Dependencies Graph

### Story Completion Order

```
Phase 1: Setup
  ↓
Phase 2: Foundational (blocking)
  ↓
Phase 3: US1 (P1) - Basic Inactivity ← MVP stops here
  ↓
Phase 4: US2 (P2) - Repeated Warnings
  ↓
Phase 5: US3 (P3) - Mid-Warning Focus
  ↓
Phase 6: Polish & Testing
```

### Module Dependencies

```
WarningMessagePool (T003)
  ↓
FocusMonitor (T004) ←──┐
  ↓                     │
WarningInjector (T005) ─┘
  ↓
AudioPlayer modifications (T006, T007)
  ↓
Initialization (T008, T009, T010)
```

---

## Manual Testing Requirements

**Per Constitution**: No automated tests required. All validation via manual browser testing.

### Test Scenarios (to execute manually)

After completing each phase, execute the corresponding test scenario:

**US1 Test (after Phase 3)**:
1. Open test page, start broadcast
2. Switch to another tab for 61 seconds
3. Return to test page
4. Verify: 1 warning played at message boundary
5. Verify: Normal broadcast resumed

**US2 Test (after Phase 4)**:
1. Open test page, start broadcast
2. Leave tab unfocused for 5+ minutes
3. Return to test page
4. Verify: 5+ warnings played at ~60-second intervals
5. Verify: Random message selection (messages vary)

**US3 Test (after Phase 5)**:
1. Open test page, start broadcast
2. Lose focus for 61 seconds
3. Wait for warning to start playing
4. Return to tab during warning playback
5. Verify: Warning completes without cutoff
6. Verify: Next content is normal broadcast

**Edge Cases** (after Phase 6):
1. Focus restored at 59 seconds (no warning should play)
2. Rapid tab switching (timer doesn't reset)
3. Broadcast stopped while unfocused (no warning plays)
4. Page Visibility API unsupported (graceful degradation)

### Test Page Features

The manual test page (T015) provides:
- Start/stop broadcast controls
- Real-time focus state display (Visible/Hidden)
- Unfocused time counter (seconds)
- Warning count display
- Event log (all focus/warning events)
- Instructions for each test scenario

---

## Success Criteria (from spec)

Each phase contributes to these measurable outcomes:

- **SC-001**: Warning plays within 5 seconds of next message boundary after 60+ seconds unfocused (US1)
- **SC-002**: Warning messages distributed randomly across 10 messages, no message plays more than twice in 5-warning sequence (US2)
- **SC-003**: Repeated warnings occur at 60-second intervals ±10 seconds (US2)
- **SC-004**: Normal broadcast resumes within 2 seconds of warning completion (US1, US3)
- **SC-005**: No audio interruptions during transitions (US1, US3)
- **SC-006**: 100% accuracy on 60-second threshold - no warnings at 59 seconds (US1)

---

## Implementation Notes

### Constitution Compliance

- **No Automated Tests**: Per constitution, this feature uses manual browser testing only
- **Natural Speech Quality**: Warnings use same Google Cloud TTS pipeline as broadcasts
- **Real-Time Generation**: Warnings synthesized on-demand, not pre-recorded

### Technical Decisions (from research.md)

- **Focus Detection**: Page Visibility API with feature detection
- **Timer Strategy**: setInterval + Date.now() (±10s tolerance acceptable)
- **TTS Integration**: Existing SSMLSynthesizer with lazy caching
- **Injection Method**: Event-based via warning:ready event
- **State Persistence**: In-memory only (resets on page reload)

### File Paths Reference

**New Files**:
- `src/focus/focus-monitor.js` - Focus state tracking
- `src/focus/warning-message-pool.js` - 10 warning messages
- `src/focus/warning-injector.js` - Timing and injection logic
- `tests/manual/test-inactivity-warnings.html` - Manual test page

**Modified Files**:
- `src/audio/player.js` - Add warning:ready listener and _handleWarningInjection() method

---

## Progress Tracking

**Phase 1 (Setup)**: 2/2 tasks complete ✓
**Phase 2 (Foundational)**: 3/3 tasks complete ✓
**Phase 3 (US1 - MVP)**: 5/5 tasks complete ✓
**Phase 4 (US2)**: 2/2 tasks complete ✓
**Phase 5 (US3)**: 1/1 tasks complete ✓
**Phase 6 (Polish)**: 2/2 tasks complete ✓

**Overall**: 15/15 tasks complete (100%) ✓

---

**Status**: Implementation COMPLETE! All tasks finished successfully.
