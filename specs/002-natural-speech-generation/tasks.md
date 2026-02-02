# Tasks: Natural Speech Generation for Shipping Forecast

**Input**: Design documents from `/specs/002-natural-speech-generation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Test tasks are included as this is a quality-critical feature requiring validation of speech naturalness and timing precision.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths assume browser-based JavaScript application as specified in plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Verify Node.js 18+ and npm installed per quickstart.md prerequisites
- [X] T002 Create Google Cloud API key with Text-to-Speech API enabled and restrictions configured
- [X] T003 Create src/config.js with TTS_API_KEY (add to .gitignore)
- [X] T004 [P] Update .gitignore to exclude src/config.js
- [X] T005 [P] Create test-natural-speech.html test page per quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core audio synthesis infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Create src/audio/prosody-config.js with PROSODY_CONFIG constants (FR-014, FR-019-030)
- [X] T007 [P] Create src/audio/ssml-template-builder.js class skeleton
- [X] T008 [P] Create src/audio/tts-service-adapter.js with GoogleCloudTTSAdapter class skeleton
- [X] T009 [P] Create src/audio/audio-cache.js with AudioCache class skeleton (optional for now)
- [X] T010 [P] Create tests/unit/ssml-template-builder.test.js skeleton
- [X] T011 [P] Create tests/unit/prosody-config.test.js skeleton
- [X] T012 [P] Create tests/unit/tts-service-adapter.test.js skeleton
- [X] T013 [P] Create tests/integration/natural-speech-generation.test.js skeleton
- [X] T014 [P] Create tests/integration/timing-validation.test.js skeleton

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Experience Natural Speech (Priority: P1) 🎯 MVP

**Goal**: Replace MP3 concatenation with SSML-based synthesis to achieve natural, humanlike speech quality for standard areas

**Independent Test**: Generate and play a standard area report (e.g., Viking). Speech should flow naturally with no perceivable gaps or robotic artifacts. Listeners should not be able to distinguish it from recorded human speech in blind tests.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T015 [P] [US1] Write unit test: SSMLTemplateBuilder generates valid SSML for standard area in tests/unit/ssml-template-builder.test.js
- [X] T016 [P] [US1] Write unit test: SSMLTemplateBuilder includes all required break tags in tests/unit/ssml-template-builder.test.js
- [X] T017 [P] [US1] Write unit test: SSMLTemplateBuilder escapes XML special characters in tests/unit/ssml-template-builder.test.js
- [X] T018 [P] [US1] Write integration test: Synthesize and play standard area report in tests/integration/natural-speech-generation.test.js
- [X] T019 [P] [US1] Write integration test: Generated audio has no perceivable gaps in tests/integration/natural-speech-generation.test.js

### Implementation for User Story 1

- [X] T020 [P] [US1] Implement SSMLTemplateBuilder.build() for standard areas with basic SSML structure in src/audio/ssml-template-builder.js
- [X] T021 [P] [US1] Implement SSMLTemplateBuilder._buildWindSSML() for wind components in src/audio/ssml-template-builder.js
- [X] T022 [P] [US1] Implement SSMLTemplateBuilder._buildSeaSSML() for sea state in src/audio/ssml-template-builder.js
- [X] T023 [P] [US1] Implement SSMLTemplateBuilder._buildWeatherSSML() for weather in src/audio/ssml-template-builder.js
- [X] T024 [P] [US1] Implement SSMLTemplateBuilder._escape() for XML character escaping in src/audio/ssml-template-builder.js
- [X] T025 [US1] Implement GoogleCloudTTSAdapter.synthesize() with API call in src/audio/tts-service-adapter.js (depends on T020-T024)
- [X] T026 [US1] Implement GoogleCloudTTSAdapter._callAPI() with retry logic in src/audio/tts-service-adapter.js
- [X] T027 [US1] Implement GoogleCloudTTSAdapter._decodeAudio() for MP3 to AudioBuffer in src/audio/tts-service-adapter.js
- [X] T028 [US1] Implement GoogleCloudTTSAdapter._base64ToBlob() for blob conversion in src/audio/tts-service-adapter.js
- [X] T029 [US1] Create SSMLSynthesizer class in src/audio/ssml-synthesizer.js to coordinate synthesis
- [X] T030 [US1] Update src/audio/player.js to use SSMLSynthesizer for standard areas
- [X] T031 [US1] Add error handling for synthesis failures in src/audio/player.js
- [X] T032 [US1] Add console logging for synthesis operations in src/audio/ssml-synthesizer.js
- [X] T033 [US1] Verify all tests pass: Run npm test -- ssml-template-builder.test.js
- [X] T034 [US1] Verify all tests pass: Run npm test -- natural-speech-generation.test.js
- [X] T035 [US1] Manual test: Generate and play standard area report using test-natural-speech.html

**Checkpoint**: At this point, User Story 1 should be fully functional - standard area reports should sound natural and humanlike

---

## Phase 4: User Story 4 - Experience BBC Radio 4 Rhythm (Priority: P1)

**Goal**: Apply authentic BBC Radio 4 cadence with precise pause timings (800ms after area names, 600ms between components, 1500ms at end) and 85-90% speaking rate

**Independent Test**: Measure pause durations in generated audio using audio analysis tools (e.g., Audacity). Verify pauses match specification within ±50ms tolerance. Speaking rate should be 85-90% of normal speed.

**Dependencies**: Requires US1 (basic synthesis) to be complete

### Tests for User Story 4

- [X] T036 [P] [US4] Write unit test: PROSODY_CONFIG has correct pause timings in tests/unit/prosody-config.test.js
- [X] T037 [P] [US4] Write unit test: PROSODY_CONFIG has correct speaking rates in tests/unit/prosody-config.test.js
- [X] T038 [P] [US4] Write integration test: Area name pause is 800ms ±50ms in tests/integration/timing-validation.test.js
- [X] T039 [P] [US4] Write integration test: Component pauses are 600ms ±50ms in tests/integration/timing-validation.test.js
- [X] T040 [P] [US4] Write integration test: End-of-report pause is 1500ms ±100ms in tests/integration/timing-validation.test.js
- [X] T041 [P] [US4] Write integration test: Speaking rate is 85-90% of normal in tests/integration/timing-validation.test.js

### Implementation for User Story 4

- [X] T042 [US4] Update SSMLTemplateBuilder.build() to wrap content in <prosody rate="0.85"> in src/audio/ssml-template-builder.js
- [X] T043 [US4] Update SSMLTemplateBuilder to insert 800ms break after area names (FR-020) in src/audio/ssml-template-builder.js
- [X] T044 [US4] Update SSMLTemplateBuilder to insert 200ms break after wind direction (FR-021) in src/audio/ssml-template-builder.js
- [X] T045 [US4] Update SSMLTemplateBuilder to insert 600ms breaks after force/sea/weather (FR-022-024) in src/audio/ssml-template-builder.js
- [X] T046 [US4] Update SSMLTemplateBuilder to insert 1500ms break at report end (FR-025) in src/audio/ssml-template-builder.js
- [X] T047 [US4] Update SSMLTemplateBuilder to add strong emphasis to area names (FR-019) in src/audio/ssml-template-builder.js
- [X] T048 [US4] Update SSMLTemplateBuilder to add reduced emphasis to visibility (FR-026) in src/audio/ssml-template-builder.js
- [X] T049 [US4] Verify all tests pass: Run npm test -- prosody-config.test.js
- [X] T050 [US4] Verify all tests pass: Run npm test -- timing-validation.test.js
- [X] T051 [US4] Manual test: Measure pause durations with audio analysis tool (Audacity)
- [X] T052 [US4] Manual test: Verify speaking rate sounds slow and deliberate like BBC Radio 4

**Checkpoint**: Reports should now have authentic BBC Radio 4 rhythm with precise timing

---

## Phase 5: User Story 2 - Maintain Phantom Area Effects (Priority: P2)

**Goal**: Apply 10% slowdown and pitch distortion (-10 to -15% with contour) to phantom area reports for unsettling vocal effects

**Independent Test**: Generate phantom area report (e.g., The Void) and compare to standard report for same conditions. Phantom should be 10% slower and have noticeable pitch drop mid-report that partially recovers. 90%+ listeners should identify phantom by vocal quality alone.

**Dependencies**: Requires US1 (basic synthesis) and US4 (timing) to be complete

### Tests for User Story 2

- [ ] T053 [P] [US2] Write unit test: SSMLTemplateBuilder applies phantom prosody for phantom areas in tests/unit/ssml-template-builder.test.js
- [ ] T054 [P] [US2] Write unit test: Phantom SSML includes pitch contour (0%, -12%, -6%) in tests/unit/ssml-template-builder.test.js
- [ ] T055 [P] [US2] Write integration test: Phantom report is 10% slower than standard in tests/integration/natural-speech-generation.test.js
- [ ] T056 [P] [US2] Write integration test: Pitch reduction is perceivable in tests/integration/natural-speech-generation.test.js

### Implementation for User Story 2

- [ ] T057 [US2] Update SSMLTemplateBuilder.build() to detect phantom areas (report.area.type === 'phantom') in src/audio/ssml-template-builder.js
- [ ] T058 [US2] Update SSMLTemplateBuilder.build() to wrap phantom reports in <prosody rate="0.9" pitch="-12%"> in src/audio/ssml-template-builder.js
- [ ] T059 [US2] Implement pitch contour: Area name at +0% in src/audio/ssml-template-builder.js
- [ ] T060 [US2] Implement pitch contour: Wind/sea at -12% (maximum drop) in src/audio/ssml-template-builder.js
- [ ] T061 [US2] Implement pitch contour: Visibility/pressure at -6% (partial recovery) in src/audio/ssml-template-builder.js
- [ ] T062 [US2] Verify all tests pass: Run npm test -- ssml-template-builder.test.js (phantom tests)
- [ ] T063 [US2] Verify all tests pass: Run npm test -- natural-speech-generation.test.js (phantom tests)
- [ ] T064 [US2] Manual test: Generate phantom report and verify unsettling vocal effect
- [ ] T065 [US2] A/B test: Play standard vs phantom report, verify 90%+ can identify phantom by voice

**Checkpoint**: Phantom areas should now have distinctive unsettling vocal effects

---

## Phase 6: User Story 3 - Support Realistic BBC Variations (Priority: P2)

**Goal**: Handle compound forces ("5 or 6"), timing phrases ("later"), pressure conditions, and wave states smoothly as natural sentences

**Independent Test**: Generate report with compound force ("Southwesterly 5 to 7, increasing later"), pressure ("Pressure falling slowly"), and waves ("Moderate swell"). All elements should flow naturally without artificial pauses or word-by-word synthesis.

**Dependencies**: Requires US1 (basic synthesis) to be complete

### Tests for User Story 3

- [ ] T066 [P] [US3] Write unit test: SSMLTemplateBuilder handles compound forces [5, 7] with connector in tests/unit/ssml-template-builder.test.js
- [ ] T067 [P] [US3] Write unit test: SSMLTemplateBuilder includes timing phrases in tests/unit/ssml-template-builder.test.js
- [ ] T068 [P] [US3] Write unit test: SSMLTemplateBuilder includes pressure conditions in tests/unit/ssml-template-builder.test.js
- [ ] T069 [P] [US3] Write unit test: SSMLTemplateBuilder includes wave conditions in tests/unit/ssml-template-builder.test.js
- [ ] T070 [P] [US3] Write integration test: Compound forces sound natural (no pauses between numbers) in tests/integration/natural-speech-generation.test.js

### Implementation for User Story 3

- [ ] T071 [US3] Update SSMLTemplateBuilder._buildWindSSML() to handle compound forces [5, 7] in src/audio/ssml-template-builder.js
- [ ] T072 [US3] Update SSMLTemplateBuilder._buildWindSSML() to include connector ("or", "to") in src/audio/ssml-template-builder.js
- [ ] T073 [US3] Update SSMLTemplateBuilder._buildWindSSML() to add wind behavior if present in src/audio/ssml-template-builder.js
- [ ] T074 [US3] Update SSMLTemplateBuilder._buildWindSSML() to add wind modifier if present in src/audio/ssml-template-builder.js
- [ ] T075 [US3] Update SSMLTemplateBuilder._buildWindSSML() to add wind timing if present in src/audio/ssml-template-builder.js
- [ ] T076 [US3] Update SSMLTemplateBuilder._buildSeaSSML() to add sea timing if present in src/audio/ssml-template-builder.js
- [ ] T077 [US3] Update SSMLTemplateBuilder._buildSeaSSML() to add wave conditions if present in src/audio/ssml-template-builder.js
- [ ] T078 [US3] Update SSMLTemplateBuilder._buildWeatherSSML() to add weather timing if present in src/audio/ssml-template-builder.js
- [ ] T079 [US3] Update SSMLTemplateBuilder.build() to add pressure conditions if present in src/audio/ssml-template-builder.js
- [ ] T080 [US3] Verify all tests pass: Run npm test -- ssml-template-builder.test.js (BBC variations)
- [ ] T081 [US3] Verify all tests pass: Run npm test -- natural-speech-generation.test.js (BBC variations)
- [ ] T082 [US3] Manual test: Generate report with all realistic elements, verify natural flow

**Checkpoint**: Reports with realistic BBC variations should sound natural and conversational

---

## Phase 7: Error Handling & Fallback

**Purpose**: Graceful degradation when TTS API fails (FR-016)

- [ ] T083 Implement failure detection: Track failureCount in src/audio/ssml-synthesizer.js
- [ ] T084 Implement fallback trigger: Switch to LibrarySynthesizer after 3 failures in src/audio/player.js
- [ ] T085 Implement fallback logic: Revert to MP3 concatenation in src/audio/player.js
- [ ] T086 Add console warnings for fallback activation in src/audio/player.js
- [ ] T087 [P] Write integration test: Fallback activates after 3 failures in tests/integration/natural-speech-generation.test.js
- [ ] T088 Manual test: Simulate API failure (invalid API key), verify fallback works

---

## Phase 8: Caching & Performance Optimization

**Purpose**: Reduce API costs and improve response time (FR-015)

- [ ] T089 Implement AudioCache.get() with LRU timestamp update in src/audio/audio-cache.js
- [ ] T090 Implement AudioCache.set() with LRU eviction (max 50 entries) in src/audio/audio-cache.js
- [ ] T091 Implement cache key generation: generateCacheKey(report) in src/audio/audio-cache.js
- [ ] T092 Integrate AudioCache into SSMLSynthesizer: Check cache before synthesis in src/audio/ssml-synthesizer.js
- [ ] T093 Integrate AudioCache into SSMLSynthesizer: Store after synthesis in src/audio/ssml-synthesizer.js
- [ ] T094 Implement GoogleCloudTTSAdapter.getUsageStats() for monitoring in src/audio/tts-service-adapter.js
- [ ] T095 [P] Write unit test: AudioCache evicts oldest entry when full in tests/unit/audio-cache.test.js (create file)
- [ ] T096 [P] Write unit test: AudioCache updates LRU on get() in tests/unit/audio-cache.test.js
- [ ] T097 Manual test: Generate 60 reports, verify cache eviction after 50
- [ ] T098 Manual test: Check cache hit rate in console (expect 10-20%)

---

## Phase 9: Report Buffering & Continuous Playback

**Purpose**: Pre-buffer 3-5 reports for seamless playback (FR-015)

- [ ] T099 Implement buffer pre-generation: Generate 3 reports on page load in src/audio/player.js
- [ ] T100 Implement buffer refill: Generate next report when current plays in src/audio/player.js
- [ ] T101 Implement buffer management: Maintain 3-5 reports in buffer in src/audio/player.js
- [ ] T102 Add buffer status logging for debugging in src/audio/player.js
- [ ] T103 [P] Write integration test: Buffer maintains 3-5 reports during playback in tests/integration/natural-speech-generation.test.js
- [ ] T104 Manual test: Play continuously for 30 minutes, verify no gaps (SC-006)

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T105 [P] Code cleanup: Remove unused imports and commented code
- [ ] T106 [P] Code cleanup: Add JSDoc comments to all public methods
- [ ] T107 [P] Update quickstart.md with final API key setup instructions
- [ ] T108 [P] Update README with natural speech generation features
- [ ] T109 [P] Add error handling for missing API key with user-friendly message
- [ ] T110 [P] Add browser compatibility check: Verify fetch and AudioContext support
- [ ] T111 Conduct listener testing: Blind A/B tests for SC-001 (80% indistinguishability)
- [ ] T112 Conduct audio analysis: Verify pause timings with Audacity (SC-009-011)
- [ ] T113 Conduct A/B testing: Verify phantom identification rate (SC-013: 90%+)
- [ ] T114 Run full test suite: npm test
- [ ] T115 Run quickstart validation: Follow quickstart.md steps end-to-end
- [ ] T116 Security review: Verify API key restrictions configured in Google Cloud Console
- [ ] T117 Cost review: Calculate actual cost per report based on usage stats
- [ ] T118 Performance review: Verify <2s generation time (SC-003)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - No dependencies on other stories
- **User Story 4 (Phase 4)**: Depends on US1 (builds on basic synthesis)
- **User Story 2 (Phase 5)**: Depends on US1 and US4 (needs timing for phantom effects)
- **User Story 3 (Phase 6)**: Depends on US1 (adds variations to basic synthesis)
- **Error Handling (Phase 7)**: Depends on US1 (needs working synthesis to test fallback)
- **Caching (Phase 8)**: Depends on US1 (optimizes existing synthesis)
- **Buffering (Phase 9)**: Depends on US1 and Phase 8 (uses cached synthesis)
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories ✅ MVP
- **User Story 4 (P1)**: Can start after US1 - Builds on basic synthesis
- **User Story 2 (P2)**: Can start after US1 and US4 - Needs timing infrastructure
- **User Story 3 (P2)**: Can start after US1 - Adds variations independently

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- SSMLTemplateBuilder methods before TTS adapter
- TTS adapter before integration into player
- Core implementation before edge cases
- Story complete before moving to next priority

### Parallel Opportunities

**Setup (Phase 1)**:
- T003, T004, T005 can run in parallel

**Foundational (Phase 2)**:
- T007-T014 can ALL run in parallel (different files, no dependencies)

**User Story 1 - Tests**:
- T015-T019 can run in parallel (all test files)

**User Story 1 - Implementation**:
- T020-T024 can run in parallel (SSMLTemplateBuilder methods in same file but different functions)
- T025-T028 must run sequentially (same file, dependencies)
- T020-T024 parallel, then T025-T028 sequential, then T029-T032 sequential

**User Story 4 - Tests**:
- T036-T041 can run in parallel (all test files)

**User Story 2 - Tests**:
- T053-T056 can run in parallel (all test files)

**User Story 3 - Tests**:
- T066-T070 can run in parallel (all test files)

**Polish (Phase 10)**:
- T105-T110 can run in parallel (documentation, code cleanup)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Write unit test: SSMLTemplateBuilder generates valid SSML for standard area in tests/unit/ssml-template-builder.test.js"
Task: "Write unit test: SSMLTemplateBuilder includes all required break tags in tests/unit/ssml-template-builder.test.js"
Task: "Write unit test: SSMLTemplateBuilder escapes XML special characters in tests/unit/ssml-template-builder.test.js"
Task: "Write integration test: Synthesize and play standard area report in tests/integration/natural-speech-generation.test.js"
Task: "Write integration test: Generated audio has no perceivable gaps in tests/integration/natural-speech-generation.test.js"

# Then launch all SSMLTemplateBuilder methods together:
Task: "Implement SSMLTemplateBuilder.build() for standard areas with basic SSML structure in src/audio/ssml-template-builder.js"
Task: "Implement SSMLTemplateBuilder._buildWindSSML() for wind components in src/audio/ssml-template-builder.js"
Task: "Implement SSMLTemplateBuilder._buildSeaSSML() for sea state in src/audio/ssml-template-builder.js"
Task: "Implement SSMLTemplateBuilder._buildWeatherSSML() for weather in src/audio/ssml-template-builder.js"
Task: "Implement SSMLTemplateBuilder._escape() for XML character escaping in src/audio/ssml-template-builder.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 4 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Natural speech for standard areas)
4. Complete Phase 4: User Story 4 (BBC Radio 4 rhythm)
5. **STOP and VALIDATE**: Test combined US1+US4 - standard reports with authentic timing
6. Deploy/demo if ready

**Why US1+US4**: Both are P1 priority and together deliver the core value - natural BBC-quality speech. US4 builds directly on US1.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Natural speech working → Test independently
3. Add User Story 4 → BBC timing added → Test combined US1+US4 → Deploy/Demo (MVP!)
4. Add User Story 2 → Phantom effects → Test independently → Deploy/Demo
5. Add User Story 3 → BBC variations → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (critical path)
2. Once Foundational is done:
   - Developer A: User Story 1 (Natural speech)
   - Developer B: User Story 4 (BBC timing) - starts after A completes US1
   - OR: Developer A does US1+US4 sequentially (they're tightly coupled)
3. Then in parallel:
   - Developer A: User Story 2 (Phantom effects)
   - Developer B: User Story 3 (BBC variations)
4. Stories complete and integrate independently

---

## Task Summary

**Total Tasks**: 118

**Tasks per Phase**:
- Phase 1 (Setup): 5 tasks
- Phase 2 (Foundational): 9 tasks
- Phase 3 (User Story 1): 21 tasks (5 tests + 16 implementation)
- Phase 4 (User Story 4): 17 tasks (6 tests + 11 implementation)
- Phase 5 (User Story 2): 13 tasks (4 tests + 9 implementation)
- Phase 6 (User Story 3): 17 tasks (5 tests + 12 implementation)
- Phase 7 (Error Handling): 6 tasks
- Phase 8 (Caching): 10 tasks
- Phase 9 (Buffering): 6 tasks
- Phase 10 (Polish): 14 tasks

**Parallel Opportunities**: 47 tasks marked [P] can run in parallel

**Independent Test Criteria**:
- US1: Generate standard area report, verify natural flow with no gaps
- US4: Measure pause durations with audio analysis, verify 85-90% speed
- US2: Compare phantom vs standard, verify 10% slower and pitch drop
- US3: Generate report with compound forces/timing/pressure, verify natural flow

**Suggested MVP Scope**: User Story 1 + User Story 4 (P1 priorities - natural speech with BBC timing)

---

## Notes

- [P] tasks = different files or independent methods, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD approach)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- US1 and US4 are tightly coupled (timing builds on synthesis) - consider implementing sequentially by same developer
