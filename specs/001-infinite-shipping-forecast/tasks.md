# Tasks: The Infinite Shipping Forecast

**Input**: Design documents from `/specs/001-infinite-shipping-forecast/`
**Prerequisites**: plan.md (complete), spec.md (complete), research.md (complete), data-model.md (complete), contracts/ (complete)

**Tests**: Tests are NOT explicitly required by the specification, so test tasks are optional and can be added later if desired.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Single-page web application structure (browser-native JavaScript):
- `src/` - Source modules (core, audio, visuals, state, utils)
- `public/` - Static assets (HTML, CSS)
- `tests/` - Test suites (optional)

---

## Phase 1: Setup (Shared Infrastructure) ✅

**Purpose**: Project initialization and basic structure

- [x] T001 Create project directory structure (src/, public/, tests/, specs/)
- [x] T002 Initialize package.json with Jest and Playwright dependencies
- [x] T003 [P] Create public/index.html with base HTML structure and Begin Transmission button
- [x] T004 [P] Create public/styles.css with base styling and CSS animation keyframes
- [x] T005 [P] Configure ESLint for ES2020+ JavaScript
- [x] T006 [P] Configure Prettier for code formatting
- [x] T007 [P] Create .gitignore with node_modules, coverage, .DS_Store

---

## Phase 2: Foundational (Blocking Prerequisites) ✅

**Purpose**: Core vocabulary data and shared utilities that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create src/core/areas.js with STANDARD_AREAS (31 items) and PHANTOM_AREAS (7 items) arrays
- [x] T009 [P] Create src/core/vocabulary.js with WIND_DIRECTIONS, WIND_BEHAVIORS, SEA_STATES, WEATHER, VISIBILITY arrays
- [x] T010 [P] Create src/core/vocabulary.js UNSETTLING_MESSAGES array (12 messages)
- [x] T011 [P] Create src/utils/browser-detect.js with checkBrowserSupport() function
- [x] T012 [P] Create src/utils/timing.js with delay/pause utility functions
- [x] T013 Create src/state/events.js with EventBus class (on, emit, off methods)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Experience Continuous Audio Transmission (Priority: P1) 🎯 MVP

**Goal**: Users can click "Begin Transmission" and hear continuous procedurally-generated weather reports with proper pauses and radio effects

**Independent Test**: Load page, click button, verify audio plays with area names spoken, 500ms pause after area name, 1-second pause between reports, continues for 10+ minutes

### Implementation for User Story 1

#### Core Generation (can parallelize these tasks)

- [x] T014 [P] [US1] Create src/core/generator.js with generateWeatherReport() function
- [x] T015 [P] [US1] Implement area selection logic in generator.js (2% phantom probability)
- [x] T016 [P] [US1] Implement wind generation in generator.js (direction, behavior, force 4-12)
- [x] T017 [P] [US1] Implement report text formatting in generator.js per template
- [x] T018 [P] [US1] Implement Fisher-Yates shuffle in generator.js for area cycling
- [x] T019 [P] [US1] Add getCurrentAreaIndex() and resetCycle() methods to generator.js

#### Buffer Management

- [x] T020 [US1] Create src/core/buffer.js with ReportBuffer class
- [x] T021 [US1] Implement enqueue(), dequeue(), needsRefill(), size() methods in buffer.js
- [x] T022 [US1] Add buffer refill trigger logic (when size <= minSize) in buffer.js

#### Audio Synthesis

- [x] T023 [P] [US1] Create src/audio/synthesizer.js with speakReport() function
- [x] T024 [US1] Implement Web Speech API integration in synthesizer.js
- [x] T025 [US1] Add 500ms pause after area name in synthesizer.js
- [x] T026 [US1] Add 1000ms pause between complete reports in synthesizer.js
- [x] T027 [US1] Implement stopSpeaking() and getAvailableVoices() in synthesizer.js
- [x] T028 [US1] Add UK English voice preference logic in synthesizer.js

#### Audio Filtering

- [x] T029 [P] [US1] Create src/audio/filters.js with RadioFilter class
- [x] T030 [US1] Implement BiquadFilterNode bandpass (300-3000Hz) in filters.js
- [x] T031 [US1] Implement white noise generation (0.02 gain) in filters.js
- [x] T032 [US1] Add connect(), disconnect() methods in filters.js
- [x] T033 [US1] Add setFilterFrequency() and setNoiseGain() methods in filters.js

#### Playback Controller

- [x] T034 [US1] Create src/audio/player.js with audio playback orchestration
- [x] T035 [US1] Implement continuous playback loop in player.js
- [x] T036 [US1] Integrate buffer dequeue → speak → next cycle in player.js
- [x] T037 [US1] Connect audio filter chain to Web Audio context in player.js

#### State Management for US1

- [x] T038 [US1] Create src/state/session.js with SessionState class
- [x] T039 [US1] Implement isPlaying(), togglePlayback() in session.js
- [x] T040 [US1] Implement getCurrentReport(), setCurrentReport() in session.js
- [x] T041 [US1] Add button toggle behavior (Begin ↔ Stop) in session.js

#### Main Application Integration for US1

- [x] T042 [US1] Create src/app.js with initialization logic
- [x] T043 [US1] Wire button click handler to togglePlayback() in app.js
- [x] T044 [US1] Implement browser support check with error display in app.js
- [x] T045 [US1] Initialize buffer with 3-5 reports on start in app.js
- [x] T046 [US1] Connect all event listeners (stateChange, reportChange) in app.js
- [x] T047 [US1] Update button text based on transmission state in app.js
- [x] T048 [US1] Add ES module imports to public/index.html

**Checkpoint**: User Story 1 complete - Users can start/stop continuous audio transmission with radio effects

---

## Phase 4: User Story 2 - See Visual Accompaniment (Priority: P2) ✅

**Goal**: Users see distorted, shifting visual interface that responds to audio (isobar map, blur/hue animations, oscilloscope)

**Independent Test**: With audio playing, verify background shifts gradually, blur oscillates 0-3px over 10 seconds, hue rotates 360° over 60 seconds, green oscilloscope line appears and reacts to audio

### Implementation for User Story 2

#### Background Canvas

- [x] T049 [P] [US2] Create src/visuals/background.js with initBackground() function
- [x] T050 [US2] Implement isobar map pattern generation on canvas in background.js
- [x] T051 [US2] Add requestAnimationFrame loop for gradual shifting in background.js
- [x] T052 [US2] Implement updateBlur() function to modify CSS filter in background.js
- [x] T053 [US2] Implement updateHueRotation() function to modify CSS filter in background.js

#### Oscilloscope Visualization

- [x] T054 [P] [US2] Create src/visuals/oscilloscope.js with Oscilloscope class
- [x] T055 [US2] Connect AnalyserNode to audio context in oscilloscope.js
- [x] T056 [US2] Implement start() method with requestAnimationFrame loop in oscilloscope.js
- [x] T057 [US2] Implement frequency data drawing (green line) in oscilloscope.js
- [x] T058 [US2] Add stop() and setColor() methods in oscilloscope.js

#### Visual Effects Controller

- [x] T059 [P] [US2] Create src/visuals/effects.js with effect orchestration
- [x] T060 [US2] Implement blur oscillation (0-3px, 10-second period) in effects.js
- [x] T061 [US2] Implement hue rotation animation (0-360°, 60-second period) in effects.js
- [x] T062 [US2] Add CSS keyframe animations to public/styles.css for blur and hue

#### Visual State Management

- [x] T063 [US2] Add VisualState properties to src/state/session.js
- [x] T064 [US2] Track blurIntensity, hueRotation, frequencyData in session.js

#### Integration for US2

- [x] T065 [US2] Add background canvas element to public/index.html
- [x] T066 [US2] Add oscilloscope canvas element to public/index.html
- [x] T067 [US2] Initialize background and oscilloscope in src/app.js
- [x] T068 [US2] Connect visual updates to audio playback events in app.js
- [ ] T069 [US2] Update public/styles.css with canvas positioning and filters

**Checkpoint**: User Story 2 complete - Visuals are synchronized with audio transmission

---

## Phase 5: User Story 3 - Encounter Phantom Areas (Priority: P2)

**Goal**: Users occasionally hear phantom sea area names with visual/audio distortions (blur spike to 10px, voice slowdown 10%)

**Independent Test**: Generate 100 reports, verify ~2 are phantom areas, when phantom plays verify blur spikes to 10px and voice rate drops to 0.9x

### Implementation for User Story 3

#### Phantom Detection & Effects

- [ ] T070 [P] [US3] Add isPhantom property to WeatherReport in src/core/generator.js
- [ ] T071 [US3] Emit 'phantomArea' event when phantom selected in generator.js
- [ ] T072 [US3] Emit 'normalArea' event when returning to normal in generator.js

#### Audio Phantom Effects

- [ ] T073 [US3] Add rate adjustment (0.9x) for phantom reports in src/audio/synthesizer.js
- [ ] T074 [US3] Detect isPhantom flag and adjust playbackRate in synthesizer.js

#### Visual Phantom Effects

- [ ] T075 [P] [US3] Add blur spike logic (10px) in src/visuals/effects.js
- [ ] T076 [US3] Subscribe to 'phantomArea' event in effects.js
- [ ] T077 [US3] Implement blur spike → gradual return to 0-3px in effects.js
- [ ] T078 [US3] Update isPhantomActive flag in visual state

#### Integration for US3

- [ ] T079 [US3] Wire phantom event handlers in src/app.js
- [ ] T080 [US3] Test phantom probability over 100 iterations in console

**Checkpoint**: User Story 3 complete - Phantom areas create unsettling audio/visual distortions

---

## Phase 6: User Story 4 - See Current Area Information (Priority: P3)

**Goal**: Users see the name of the currently broadcast area in a faded serif font

**Independent Test**: With audio playing, verify area name text appears on screen, updates with each new report, shows only area name (not full weather details)

### Implementation for User Story 4

#### Text Overlay Component

- [ ] T081 [P] [US4] Create src/visuals/text-overlay.js with area name display
- [ ] T082 [US4] Implement updateAreaName(areaName) function in text-overlay.js
- [ ] T083 [US4] Add fade-in/fade-out transitions in text-overlay.js

#### Integration for US4

- [ ] T084 [US4] Add area name div element to public/index.html
- [ ] T085 [US4] Add faded serif font styling to public/styles.css
- [ ] T086 [US4] Subscribe to 'reportChange' event in src/app.js
- [ ] T087 [US4] Update area name text on each new report in app.js

**Checkpoint**: User Story 4 complete - Current area name is visible to users

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final enhancements, error handling, and production readiness

### Enhanced Tab Behavior (from clarifications)

- [ ] T088 Add onTabBlurred() method to src/state/session.js
- [ ] T089 Add onTabFocused() method to src/state/session.js
- [ ] T090 Implement 60-second timer for unsettling messages in session.js
- [ ] T091 Add shouldShowUnsettlingMessage() logic in session.js
- [ ] T092 Subscribe to Page Visibility API events in src/app.js
- [ ] T093 Insert unsettling messages between reports after 60s background in player.js

### Error Handling & Resilience

- [ ] T094 [P] Add comprehensive error handling to synthesizer.js (API unavailable, speech failure)
- [ ] T095 [P] Add error recovery for buffer underruns in player.js
- [ ] T096 [P] Add memory leak prevention (dereference completed reports) in buffer.js
- [ ] T097 [P] Add performance monitoring (generation time, frame rate) in app.js

### Browser Compatibility

- [ ] T098 Display user-friendly error message when APIs unavailable in app.js
- [ ] T099 [P] Test in Chrome, Firefox, Safari, Edge and document quirks
- [ ] T100 [P] Add polyfill checks and warnings for older browsers

### Production Polish

- [ ] T101 [P] Add disclaimer footer to public/index.html ("Not for navigation. Procedural art piece.")
- [ ] T102 [P] Optimize canvas rendering performance (reduce resolution if needed)
- [ ] T103 [P] Add favicon and meta tags to public/index.html
- [ ] T104 [P] Create README.md with project description and setup instructions
- [ ] T105 [P] Add deployment configuration for Netlify/Vercel (netlify.toml or vercel.json)

**Checkpoint**: Production-ready deployment complete

---

## Dependencies & Execution Strategy

### User Story Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundation)
                     ↓
    ┌───────────────┴────────────────┐
    ↓                ↓                ↓
Phase 3 (US1)   Phase 4 (US2)   Phase 5 (US3)
    ↓                ↓                ↓
    └────────────────┬────────────────┘
                     ↓
                Phase 6 (US4)
                     ↓
                Phase 7 (Polish)
```

**Critical Path**: Setup → Foundation → US1 (MVP)

**Parallel Opportunities**:
- After Foundation: US2, US3, US4 can begin in parallel (US1 must complete first for full integration)
- Within each phase: Tasks marked [P] can run simultaneously

### MVP Scope (Minimum Viable Product)

**Recommended MVP**: Phase 1 + Phase 2 + Phase 3 (User Story 1 only)

This delivers:
- ✅ Continuous audio generation
- ✅ Weather report procedural generation
- ✅ Radio effects (bandpass, white noise)
- ✅ Buffer management
- ✅ Start/stop transmission button

**What MVP demonstrates**: Core artistic concept of infinite forecast with unsettling radio quality

**After MVP**: Add User Stories 2-4 incrementally for visual enhancements

### Parallel Execution Examples

**Within Foundation Phase** (all can run in parallel):
- T008 (areas.js) || T009 (vocabulary.js) || T010 (messages) || T011 (browser-detect.js) || T012 (timing.js) || T013 (events.js)

**Within User Story 1 Phase**:
- Batch 1: T014-T019 (generator), T023 (synthesizer stub), T029 (filters stub) - all parallel
- Batch 2: T020-T022 (buffer), T024-T028 (synthesizer impl), T030-T033 (filters impl) - depends on Batch 1
- Batch 3: T034-T037 (player), T038-T041 (session) - depends on Batch 2
- Final: T042-T048 (app integration) - sequential, depends on all above

**Cross-Story Parallelization** (after US1 complete):
- US2 tasks (T049-T069) || US3 tasks (T070-T080) || US4 tasks (T081-T087) - all independent

### Implementation Strategy

1. **Start with MVP** (Phases 1-3): Establish core audio experience
2. **Add visuals** (Phase 4): Layer in background and oscilloscope
3. **Add distortions** (Phase 5): Implement phantom area effects
4. **Add text overlay** (Phase 6): Polish with area name display
5. **Production ready** (Phase 7): Error handling, browser compat, deployment

---

## Task Summary

**Total Tasks**: 105

**Breakdown by Phase**:
- Phase 1 (Setup): 7 tasks
- Phase 2 (Foundation): 6 tasks
- Phase 3 (User Story 1 - MVP): 35 tasks
- Phase 4 (User Story 2): 21 tasks
- Phase 5 (User Story 3): 11 tasks
- Phase 6 (User Story 4): 7 tasks
- Phase 7 (Polish): 18 tasks

**Parallel Opportunities**: 47 tasks marked [P] can run in parallel with others

**Independent Test Criteria**: Each user story phase includes specific acceptance tests from spec.md

**Estimated Timeline** (solo developer):
- MVP (Phases 1-3): 5-7 days
- Full Feature (all phases): 10-15 days

---

## Format Validation ✅

All tasks follow required checklist format:
- ✅ Checkbox `- [ ]` at start
- ✅ Sequential Task IDs (T001-T105)
- ✅ [P] markers for parallelizable tasks
- ✅ [US1]-[US4] story labels for user story tasks
- ✅ Exact file paths in descriptions
- ✅ Organized by user story for independent delivery

**Next Step**: Begin implementation with `/speckit.implement` or start with MVP (Phase 1-3 tasks)
