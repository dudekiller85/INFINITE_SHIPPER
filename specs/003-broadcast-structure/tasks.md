# Implementation Tasks: Broadcast Structure with Introduction and Transitions

**Feature**: 003-broadcast-structure
**Branch**: `003-broadcast-structure`
**Created**: 2026-02-02
**Status**: Ready for Implementation

## Summary

**Total Tasks**: 23
**User Stories**: 3 (US1: P1, US2: P1, US3: P2)
**MVP Scope**: User Story 1 (Introduction with timestamp/date)

### Task Breakdown

- **Phase 1 - Setup**: 0 tasks (no setup needed - extends existing system)
- **Phase 2 - Foundational**: 2 tasks (date formatting utilities)
- **Phase 3 - US1 (P1)**: 9 tasks (introduction broadcast structure)
- **Phase 4 - US2 (P1)**: 5 tasks (gale warnings)
- **Phase 5 - US3 (P2)**: 4 tasks (time period variants)
- **Phase 6 - Polish**: 3 tasks (integration & documentation)

### Parallel Execution Opportunities

**Phase 2 (Foundational)**:
- All 2 tasks can run in parallel (different utilities)

**Phase 3 (US1)**:
- T003-T007 can run in parallel (variant library independent of other work)
- T008-T009 can run in parallel after T007 (broadcast generator + SSML builder)

**Phase 4 (US2)**:
- T013-T014 can run in parallel (variant libraries + generator extension)

**Phase 5 (US3)**:
- T018-T019 can run in parallel (variants + SSML extension)

### Independent Test Criteria

**US1 (Introduction)**: Generate broadcasts and verify introduction always appears first with correct timestamp/date formatting. Delivers immediate value as standalone improvement.

**US2 (Gale Warnings)**: Generate broadcasts with force 8+ winds and verify warnings appear between introduction and area forecasts. Test independently by manipulating wind force data.

**US3 (Time Period)**: Generate 100 broadcasts and analyze time period phrase distribution. Each variant can be validated independently for grammatical correctness.

---

## Implementation Strategy

**MVP First Approach**: Implement User Story 1 first (Tasks T001-T011). This delivers a complete, testable broadcast with introduction. Stories 2 and 3 are additive enhancements that don't break US1.

**Incremental Delivery**:
1. **After US1**: Broadcasts have proper introduction with timestamp/date (foundation of authenticity)
2. **After US2**: Broadcasts include safety-critical gale warnings when applicable
3. **After US3**: Broadcasts have varied time period announcements (prevents listener fatigue)

Each user story delivers independently testable value.

---

## Phase 1: Setup

No setup tasks required. This feature extends existing audio generation system (002-natural-speech-generation).

---

## Phase 2: Foundational Tasks (MUST complete before user stories)

These utilities are used by all user stories and must be completed first.

### Date/Time Formatting Utilities

- [X] T001 [P] Create date formatter module in src/utils/date-formatter.js with formatBBCTime() function for timestamp formatting
- [X] T002 [P] Add formatBBCDate() and getOrdinalSuffix() functions to src/utils/date-formatter.js for date formatting

**Implementation Details**:
- **T001**: formatBBCTime(date) converts Date to BBC spoken format:
  - 05:30 → "zero five thirty"
  - 14:00 → "fourteen hundred"
  - 21:45 → "twenty-one forty-five"
  - Use "zero" for digit 0, not "oh"
  - Handle hours 00-23, minutes 00-59

- **T002**: formatBBCDate(date) converts Date to BBC spoken format:
  - Format: "on [day] the [ordinal] of [month]"
  - Example: "on Tuesday the second of February"
  - getOrdinalSuffix(day) returns st/nd/rd/th suffix
  - Handle edge cases: midnight UTC date transitions

**Dependencies**: None (foundational)

**Test Criteria**: Manual console testing with various timestamps (00:00, 05:30, 12:00, 23:59) and dates (1st, 2nd, 3rd, 21st, 31st).

---

## Phase 3: User Story 1 - Introduction Broadcast (Priority: P1)

**Goal**: Add complete broadcast introduction with Met Office attribution, timestamp, and date. This establishes broadcast authenticity and temporal context.

**Independent Test**: Generate broadcasts and verify introduction always appears first with correct timestamp/date formatting in BBC style.

**Delivers**: Foundation of broadcast authenticity - each forecast feels like a real BBC Radio 4 broadcast event.

### Introduction Variant Library

- [X] T003 [P] [US1] Create broadcast variants module in src/audio/broadcast-variants.js with INTRODUCTION_VARIANTS array
- [X] T004 [P] [US1] Add 12 standard introduction variants to INTRODUCTION_VARIANTS in src/audio/broadcast-variants.js
- [X] T005 [P] [US1] Add 8 surreal introduction variants to INTRODUCTION_VARIANTS in src/audio/broadcast-variants.js
- [X] T006 [P] [US1] Implement selectIntroductionVariant() function with weighted random selection in src/audio/broadcast-variants.js
- [X] T007 [US1] Add variant validation and metadata to introduction variants in src/audio/broadcast-variants.js

**Implementation Details**:
- **T003**: Create module structure with exports for variant arrays and selection functions
- **T004**: Standard variants use Met Office attribution: "issued by the Met Office on behalf of the Maritime and Coastguard Agency". Weight: 2 (appears ~60% of time)
- **T005**: Surreal variants use alternative authorities: "Department of Quiet Waters", "Institute of Maritime Observation", "The Sea Council". Weight: 1 (appears ~40% of time). Must maintain 80%+ "unsettling but plausible" threshold.
- **T006**: Weighted random selection ensures standard variants appear more frequently
- **T007**: Add isSurreal flag, validate template structure, ensure 20+ total variants

**Dependencies**: T001-T002 (date formatting)

### Broadcast Generator Core

- [X] T008 [US1] Create broadcast generator module in src/core/broadcast-generator.js with generateBroadcast() main function
- [X] T009 [US1] Implement _buildIntroduction() method in src/core/broadcast-generator.js for introduction segment construction
- [X] T010 [US1] Add timestamp/date integration to introduction in src/core/broadcast-generator.js using date-formatter utilities

**Implementation Details**:
- **T008**: Main orchestrator that calls existing generator.js for area forecasts, builds complete Broadcast object with all segments
- **T009**: Selects introduction variant using selectIntroductionVariant(), fills template with authority/timestamp/date
- **T010**: Get current Date, call formatBBCTime() and formatBBCDate(), substitute into introduction template

**Dependencies**: T003-T007 (variant library)

### SSML Builder Extension

- [X] T011 [US1] Add buildBroadcast() method to src/audio/ssml-template-builder.js for complete broadcast SSML generation
- [X] T012 [US1] Implement _buildIntroductionSSML() method in src/audio/ssml-template-builder.js with BBC Radio 4 prosody

**Implementation Details**:
- **T011**: Wrap entire broadcast in `<speak>` tag, build SSML for each segment in order: Introduction → Area Forecasts, add segment breaks (1500ms after introduction)
- **T012**: Wrap introduction text in `<prosody rate="85%">`, add `<break time="1500ms"/>` at end for segment separator

**Dependencies**: T008-T010 (broadcast generator), existing ssml-template-builder.js

**Phase 3 Complete**: Broadcasts now have proper introduction with timestamp/date. This is a complete MVP.

---

## Phase 4: User Story 2 - Gale Warnings (Priority: P1)

**Goal**: Add conditional gale warning segment after introduction and before area forecasts. Safety-critical information prioritized per BBC format.

**Independent Test**: Generate broadcasts with force 8+ winds and verify warnings appear between introduction and area forecasts. Manipulate wind force data to test conditional logic.

**Delivers**: BBC authenticity and safety-critical weather information in correct broadcast position.

### Gale Warning Variant Library

- [X] T013 [P] [US2] Add GALE_WARNING_VARIANTS array with 20+ format variants to src/audio/broadcast-variants.js
- [X] T014 [P] [US2] Implement selectGaleWarningVariant() function with weighted random selection in src/audio/broadcast-variants.js

**Implementation Details**:
- **T013**: Standard format (weight 2): "{area}, {direction} gale force {force}". Inverse format (weight 1): "Gale force {force} {direction} in {area}". Total 20+ variants mixing both formats.
- **T014**: Weighted random selection, return variant with formatType ('standard' or 'inverse')

**Dependencies**: None (parallel with foundational)

### Broadcast Generator Gale Logic

- [X] T015 [US2] Add _hasGales() method to src/core/broadcast-generator.js to detect force 8+ winds
- [X] T016 [US2] Implement _buildGaleWarnings() method in src/core/broadcast-generator.js with geographic ordering
- [X] T017 [US2] Integrate gale warnings into generateBroadcast() flow in src/core/broadcast-generator.js with conditional logic

**Implementation Details**:
- **T015**: Check all area forecasts, return true if any force >= 8 (handle both single force and force ranges)
- **T016**: Extract gales, order geographically using STANDARD_AREAS sequence (north to south), select variant, build GaleWarningSegment object
- **T017**: Call _hasGales(), if true call _buildGaleWarnings(), otherwise set galeWarnings to null. Structure: Introduction → GaleWarnings (conditional) → Area Forecasts

**Dependencies**: T008-T010 (broadcast generator core), T013-T014 (variant library)

### SSML Builder Gale Extension

- [X] T018 [US2] Add _buildGaleWarningsSSML() method to src/audio/ssml-template-builder.js for gale warning SSML generation

**Implementation Details**:
- **T018**: Wrap gale warnings in `<prosody rate="85%">`, format per variant (standard or inverse), add `<break time="1000ms"/>` at end

**Dependencies**: T011-T012 (SSML builder core), T015-T017 (gale logic)

**Phase 4 Complete**: Broadcasts now include conditional gale warnings in correct position.

---

## Phase 5: User Story 3 - Time Period Variants (Priority: P2)

**Goal**: Add varied time period announcement between gale warnings (or introduction) and area forecasts. Prevents listener fatigue through variety.

**Independent Test**: Generate 100 broadcasts and analyze time period phrase distribution. Each variant independently validated for grammatical correctness.

**Delivers**: Dynamic variety preventing repetition across multiple listening sessions.

### Time Period Variant Library

- [X] T019 [P] [US3] Add TIME_PERIOD_VARIANTS array with 15 variants to src/audio/broadcast-variants.js
- [X] T020 [P] [US3] Implement selectTimePeriodVariant() function with weighted random selection in src/audio/broadcast-variants.js

**Implementation Details**:
- **T019**: Duration-based (weight 3, 40%): "for the next 24 hours", "for the next 48 hours". Time-specific (weight 2, 30%): "valid until 0600 tomorrow". Day-based (weight 1, 15%): "through Tuesday evening". Descriptive (weight 1, 10%): "through the overnight period". Other (weight 1, 5%): "until further notice". Total 15 variants.
- **T020**: Weighted random selection matching frequency distribution from research.md RQ-005

**Dependencies**: None (parallel with other variant libraries)

### Broadcast Generator Time Period Integration

- [X] T021 [US3] Add _buildTimePeriod() method to src/core/broadcast-generator.js for time period segment construction
- [X] T022 [US3] Integrate time period into generateBroadcast() flow in src/core/broadcast-generator.js between gale warnings and area forecasts

**Implementation Details**:
- **T021**: Select time period variant using selectTimePeriodVariant(), build TimePeriodSegment object with variantId, duration text, validityHours
- **T022**: Insert time period segment in broadcast structure: Introduction → GaleWarnings (conditional) → TimePeriod → AreaForecasts

**Dependencies**: T008-T010, T015-T017 (broadcast generator), T019-T020 (variant library)

### SSML Builder Time Period Extension

- [X] T023 [US3] Add _buildTimePeriodSSML() method to src/audio/ssml-template-builder.js for time period transition SSML

**Implementation Details**:
- **T023**: Wrap time period text in `<prosody rate="85%">`, add "And now the area forecasts" prefix, add `<break time="800ms"/>` at end

**Dependencies**: T011-T012, T018 (SSML builder), T021-T022 (time period logic)

**Phase 5 Complete**: Broadcasts now have varied time period announcements.

---

## Phase 6: Polish & Cross-Cutting Concerns

### Integration & Testing

- [X] T024 Update test-natural-speech.html with "Generate Full Broadcast" button and broadcast segment display
- [X] T025 Add variant distribution tracking to test page for validating randomization
- [X] T026 Update README or create broadcast-usage.md with quickstart examples and testing instructions

**Implementation Details**:
- **T024**: Add button that calls broadcast generator, displays introduction/gale/time period variant IDs, shows segment structure, plays complete broadcast
- **T025**: Add console logging showing which variants were selected, track counts across multiple generations to verify distribution (20+ intro variants, no single variant >10%)
- **T026**: Document basic usage, variant libraries, testing procedures, character count monitoring (5000 char limit)

**Dependencies**: T008-T023 (all user stories complete)

**Phase 6 Complete**: Full feature implemented with testing tools and documentation.

---

## Dependency Graph

```
Foundational (MUST complete first):
  T001 [P] Date formatter: formatBBCTime()
  T002 [P] Date formatter: formatBBCDate() + getOrdinalSuffix()

User Story 1 (P1) - Introduction:
  T003 [P] Variant module structure
  T004 [P] 12 standard variants    } Can run in parallel
  T005 [P] 8 surreal variants      }
  T006 [P] selectIntroductionVariant()
  T007     Variant validation
  ↓ (requires T001-T002 for date formatting, T003-T007 for variants)
  T008     Broadcast generator core
  T009     _buildIntroduction()     } Can run in parallel
  T010     Timestamp/date integration }
  ↓ (requires T008-T010)
  T011     buildBroadcast() SSML
  T012     _buildIntroductionSSML()

User Story 2 (P1) - Gale Warnings (independent of US1 variants, depends on US1 structure):
  T013 [P] Gale warning variants   } Can run in parallel
  T014 [P] selectGaleWarningVariant() }
  ↓ (requires T008-T010 for broadcast generator)
  T015     _hasGales() detection
  T016     _buildGaleWarnings()
  T017     Integrate into generateBroadcast()
  ↓ (requires T011-T012 for SSML builder)
  T018     _buildGaleWarningsSSML()

User Story 3 (P2) - Time Period (independent of US1/US2 variants, depends on US1/US2 structure):
  T019 [P] Time period variants    } Can run in parallel
  T020 [P] selectTimePeriodVariant() }
  ↓ (requires T008-T010, T015-T017 for broadcast generator)
  T021     _buildTimePeriod()
  T022     Integrate into generateBroadcast()
  ↓ (requires T011-T012, T018 for SSML builder)
  T023     _buildTimePeriodSSML()

Polish (requires all user stories):
  T024     Test page updates
  T025     Variant tracking
  T026     Documentation

Critical Path: T001→T002→T003→T007→T008→T010→T011→T012→T015→T017→T018→T021→T022→T023→T024
```

---

## Validation Strategy

Per constitution principle II (no automated testing required), all validation via manual browser testing:

### User Story 1 Validation
- Generate 50 broadcasts in test page
- Verify introduction always appears first
- Check timestamp accuracy (within 1 minute of generation time)
- Check date format (day of week + ordinal + month)
- Count variant distribution (target 20+ different variants, no single variant >10%)
- Listen for 1500ms pause after introduction

### User Story 2 Validation
- Generate broadcasts with wind force 7 (no gales expected)
- Generate broadcasts with wind force 8+ (gales expected)
- Verify gale warnings appear after introduction, before area forecasts
- Check geographic ordering (north to south per STANDARD_AREAS)
- Count format variants (standard vs inverse, target 20+ variants)
- Listen for 1000ms pause after gale warnings

### User Story 3 Validation
- Generate 100 broadcasts
- Count time period variant distribution (target 10+ variants, roughly equal frequency)
- Verify phrases are grammatically correct and varied
- Check time period appears after gale warnings (or intro if no gales), before area forecasts
- Listen for 800ms pause after time period

### SSML Character Count Monitoring
- Check broadcast character count after generation
- Warn if approaching 5000 character Google Cloud TTS limit
- Note: Full 31-area broadcasts may exceed limit (5050-7100 chars typical)

### Edge Cases
- Midnight UTC timestamp (date transition)
- Multiple adjacent gales (geographic grouping)
- Force exactly 8 (gale threshold)
- Short broadcasts (3 areas)
- Surreal variant immersion (80%+ "unsettling but plausible")

---

## Success Criteria

**Phase 2 Complete**: Date/time formatting utilities working with all edge cases

**Phase 3 Complete (US1 MVP)**:
- ✅ Introduction always present with correct timestamp/date
- ✅ 20+ introduction variants exist and are used
- ✅ BBC Radio 4 cadence maintained (85% speaking rate)
- ✅ 1500ms pause after introduction
- ✅ Single continuous SSML synthesis

**Phase 4 Complete (US2)**:
- ✅ Gale warnings appear when force 8+ exists
- ✅ Gale warnings omitted when no force 8+ winds
- ✅ Geographic ordering (north to south)
- ✅ 20+ gale warning format variants exist
- ✅ 1000ms pause after gale warnings
- ✅ Correct segment order: Introduction → GaleWarnings → AreaForecasts

**Phase 5 Complete (US3)**:
- ✅ 10+ time period variants exist
- ✅ Roughly equal distribution across 100 broadcasts
- ✅ 800ms pause after time period
- ✅ Correct segment order: Introduction → GaleWarnings → TimePeriod → AreaForecasts

**Phase 6 Complete**:
- ✅ Test page has "Generate Full Broadcast" button
- ✅ Variant distribution tracking works
- ✅ Documentation updated with usage examples

---

## Parallel Execution Examples

### Phase 2 (Foundational)
Run both tasks in parallel:
```bash
# Terminal 1
Task T001: Create formatBBCTime() in date-formatter.js

# Terminal 2
Task T002: Create formatBBCDate() in date-formatter.js
```

### Phase 3 (US1) - First Wave
Run variant library tasks in parallel:
```bash
# Terminal 1
Task T003: Create broadcast-variants.js module structure

# Terminal 2
Task T004: Add 12 standard introduction variants

# Terminal 3
Task T005: Add 8 surreal introduction variants
```

### Phase 3 (US1) - Second Wave
After T007 complete, run broadcast generator + SSML builder in parallel:
```bash
# Terminal 1
Task T008-T010: Broadcast generator core + introduction logic

# Terminal 2
Task T011-T012: SSML builder broadcast methods
```

### Phase 4 (US2) - First Wave
```bash
# Terminal 1
Task T013-T014: Gale warning variant library

# Terminal 2 (requires T008-T010)
Task T015-T017: Gale warning broadcast logic
```

### Phase 5 (US3) - First Wave
```bash
# Terminal 1
Task T019-T020: Time period variant library

# Terminal 2 (requires T008-T010, T015-T017)
Task T021-T022: Time period broadcast logic
```

---

## MVP Scope Recommendation

**Minimum Viable Product**: Complete Phase 2 (Foundational) + Phase 3 (User Story 1) = Tasks T001-T012

This delivers:
- Complete broadcast introduction with timestamp/date
- 20+ variants (standard + surreal)
- BBC Radio 4 authenticity
- Single continuous SSML synthesis
- Proper pause timings

**Value**: Foundation of broadcast authenticity - each forecast feels like a real BBC Radio 4 broadcast event rather than isolated area reports.

**Independent Testing**: Generate broadcasts, verify introduction format, test timestamp accuracy, validate variant distribution.

User Stories 2 and 3 can be added incrementally without breaking US1 functionality.

---

## File Change Summary

### New Files (3)
- `src/utils/date-formatter.js` - BBC timestamp/date formatting
- `src/audio/broadcast-variants.js` - 20+ intro, 20+ gale, 15 time period variants
- `src/core/broadcast-generator.js` - Broadcast structure orchestrator

### Modified Files (2)
- `src/audio/ssml-template-builder.js` - Add broadcast SSML methods
- `test-natural-speech.html` - Add broadcast testing UI

### Documentation (1)
- `broadcast-usage.md` or README update - Usage examples and testing

---

## Notes

- **No Automated Testing**: Per constitution principle II, all validation via manual browser testing
- **Character Limit**: Google Cloud TTS has 5000 char limit. Full 31-area broadcasts may exceed (5050-7100 chars). Monitor and warn, implement chunking in future if needed.
- **Variant Distribution**: Weighted random selection ensures standard variants appear ~60%, surreal ~40%
- **Geographic Ordering**: Use existing STANDARD_AREAS array from src/core/areas.js for gale ordering
- **Pause Timings**: 1500ms after introduction, 1000ms after gale warnings, 800ms after time period
- **BBC Cadence**: All segments use 85% speaking rate via `<prosody rate="85%">` tags
