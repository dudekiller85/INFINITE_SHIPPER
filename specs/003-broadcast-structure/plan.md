# Implementation Plan: EBNF-Compliant Broadcast Structure

**Branch**: `003-broadcast-structure` | **Date**: 2026-02-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-broadcast-structure/spec.md`

## Summary

Update the existing broadcast generation system to strictly follow the EBNF grammar defined in [src/shipping-forecast.ebnf](../../src/shipping-forecast.ebnf). Key changes include: (1) Adding **general synopsis** with pressure systems and movement, (2) Replacing generic weather with **structured precipitation** (modifier + type), (3) Adding **icing conditions** for maritime safety, (4) Using **Beaufort scale text** for gale forces (8-12), (5) Removing **sea state descriptions** for EBNF compliance, while (6) **Preserving uncanny features** (phantom areas, surreal introductions, time period variants).

The approach extends the existing `WeatherReportGenerator` and `BroadcastGenerator` classes with new EBNF-specific methods, modifies vocabulary arrays, and updates SSML templates for natural speech synthesis. No new files are created - all changes are modifications to existing modules.

## Technical Context

**Language/Version**: JavaScript ES6+ (browser-based, Node.js 18+ for tooling)
**Primary Dependencies**: Google Cloud Text-to-Speech API (en-GB-Neural2-B voice), SSML markup, Web Audio API
**Storage**: N/A (ephemeral generation only - no persistence)
**Testing**: Manual browser testing via test HTML pages and console debugging (per constitution: no automated tests)
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari) with Web Audio API support
**Project Type**: Single web application (browser-based audio generation)
**Performance Goals**: Generate complete broadcast SSML in <100ms, maintain <5000 character SSML limit per TTS request
**Constraints**: Natural speech quality (BBC Radio 4 authenticity), real-time TTS synthesis, 85% speaking rate for deliberate cadence
**Scale/Scope**: 31 standard areas + 7 phantom areas, 20+ introduction variants, 10+ time period variants, 18 precipitation combinations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

**Constitution Compliance**:

✅ **I. Personal Project Workflow** - PASS
- Implementation follows rapid iteration approach
- Direct browser-based testing via test HTML pages
- Manual verification through console debugging
- No formal engineering processes required

✅ **II. No Automated Testing Required** - PASS
- No unit tests, integration tests, or E2E tests planned
- All validation through manual browser testing
- Console-based debugging and observation
- Test HTML pages for ad-hoc validation

✅ **III. Natural Speech Quality** - PASS
- SSML templates maintain 85% speaking rate for BBC Radio 4 cadence
- Beaufort scale text pronunciation tested with TTS
- Proper breaks between segments (1200ms after synopsis, 800ms between forecasts)
- Phantom area prosody variations preserved (pitch contours, slower rates)
- No robotic artifacts or perceivable gaps

✅ **IV. Real-Time Generation** - PASS
- All weather reports generated dynamically via TTS synthesis
- No pre-recorded or concatenated MP3 files
- SSML allows dynamic prosody control
- Google Cloud TTS API for real-time synthesis

**Gate Status**: ✅ **PASS** - No constitution violations. All principles aligned.

**Re-check after Phase 1 Design**: [Will be updated after design phase]

## Project Structure

### Documentation (this feature)

```
specs/003-broadcast-structure/
├── spec.md              # Feature specification
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output (technical research)
├── data-model.md        # Phase 1 output (data structures)
├── quickstart.md        # Phase 1 output (developer guide)
├── contracts/           # Phase 1 output (EBNF production rules reference)
└── tasks.md             # Phase 2 output (/speckit.tasks - not created yet)
```

### Source Code (repository root)

```
src/
├── core/
│   ├── generator.js              # MODIFY: Add precipitation, icing, Beaufort wind; remove sea state
│   ├── broadcast-generator.js    # MODIFY: Add general synopsis generation
│   ├── vocabulary.js             # MODIFY: Add EBNF arrays, remove SEA_STATES
│   └── areas.js                  # UNCHANGED: Standard/phantom areas
├── audio/
│   ├── ssml-template-builder.js  # MODIFY: Add synopsis/precip/icing SSML, remove sea SSML
│   ├── broadcast-variants.js     # UNCHANGED: Already has 20+ intro, 15 time period variants
│   ├── prosody-config.js         # UNCHANGED: 85% speaking rate
│   ├── tts-service-adapter.js    # UNCHANGED: Google Cloud TTS integration
│   └── player.js                 # UNCHANGED: Audio playback
└── utils/
    └── date-formatter.js         # REUSE: For synopsis future times

tests/ (manual browser testing only - per constitution)
├── test-natural-speech.html      # Manual audio quality validation
└── test-ebnf-compliance.html     # Manual EBNF structure validation

shipping-forecast.ebnf            # REFERENCE: EBNF grammar specification
```

**Structure Decision**: Single project structure with src/ directory containing core generation logic and audio synthesis modules. No new files created - all changes are modifications to existing modules. Testing via manual browser HTML pages per constitution (no automated test suites).

## Complexity Tracking

> **No complexity violations detected** - Constitution check passed all gates.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

---

## Phase 0: Research & Technical Design

### Research Topics

The following areas require technical research before implementation:

1. **EBNF Grammar Parsing Strategy**
   - **Question**: Should we parse the EBNF file programmatically or manually implement production rules?
   - **Research**: Evaluate EBNF parser libraries vs hardcoded rule methods
   - **Decision Criteria**: Simplicity, maintainability, performance

2. **Pressure System Realism**
   - **Question**: How to generate realistic pressure values and movement patterns?
   - **Research**: Typical UK maritime pressure ranges, deepening/clearing rates, geographical movement
   - **Decision Criteria**: BBC authenticity, meteorological plausibility

3. **TTS Pronunciation of EBNF Vocabulary**
   - **Question**: Will Google Cloud TTS correctly pronounce Beaufort scale text, precipitation modifiers, and pressure descriptions?
   - **Research**: Test synthesis of "gale 8", "Thundery showers", "deepening slowly", etc.
   - **Decision Criteria**: Natural pronunciation, no robotic artifacts

4. **SSML Character Limits**
   - **Question**: Will adding general synopsis exceed 5,000 character SSML limit?
   - **Research**: Measure current broadcast character counts, estimate synopsis length
   - **Decision Criteria**: Stay within TTS API limits

5. **Sea State Removal Impact**
   - **Question**: Will removing sea states leave gaps in audio or break existing listeners' expectations?
   - **Research**: Analyze current broadcast structure, identify dependencies
   - **Decision Criteria**: No perceivable gaps, EBNF compliance justification

### Research Outputs

**File**: [research.md](research.md) - Will contain:
- EBNF implementation strategy (hardcoded rules recommended)
- Pressure system generation algorithm
- TTS pronunciation validation results
- SSML character count analysis
- Sea state removal impact assessment

---

## Phase 1: Design & Contracts

### Data Model

**File**: [data-model.md](data-model.md) - Will define:

#### 1. General Synopsis Entity

```javascript
{
  pressureDescription: 'Low' | 'Medium' | 'High',
  currentLocation: {
    direction: string,  // e.g., 'north'
    area: string,       // e.g., 'Viking'
    pressure: number    // 900-1099
  },
  pressureChange: {     // Optional (50% probability)
    type: 'deepening' | 'clearing',
    rate: 'more slowly' | 'slowly' | 'quickly' | 'very rapidly',
    magnitude: number   // 3-12mb scaled by rate
  } | null,
  futureLocation: {
    direction: string,
    area: string,
    pressure: number,   // current ± magnitude
    time: string        // HH:MM format
  },
  text: string          // Formatted EBNF text
}
```

#### 2. Precipitation Entity

```javascript
{
  modifier: 'Thundery' | 'Wintry' | 'Squally' | 'Occasionally' | 'Heavy' | 'Light',
  type: 'showers' | 'rain' | 'snow',
  text: string          // "[modifier] [type]"
}
```

#### 3. Icing Entity

```javascript
{
  severity: 'Moderate' | 'Severe',
  text: string          // "[severity] icing"
} | null              // 10% probability
```

#### 4. Wind Entity (Enhanced)

```javascript
{
  direction: string,    // e.g., 'Southwest'
  force: number | number[],  // Single or compound
  forceText: string,    // Beaufort scale text for 8+
  connector: string | null,  // 'to', 'or'
  behavior: string | null,
  modifier: string | null,
  timing: string | null,
  text: string          // Formatted wind description
}
```

### API Contracts

**Directory**: [contracts/](contracts/) - Will contain:

#### EBNF Production Rules Reference

```
contracts/
├── ebnf-rules.md           # Production rules mapped to code
├── general-synopsis.md     # Lines 33-38 implementation
├── precipitation.md        # Lines 40-42 implementation
├── wind-beaufort.md        # Line 45 implementation
└── icing.md                # Line 59 implementation
```

Each contract file documents:
- EBNF production rule (line numbers from grammar file)
- JavaScript implementation approach
- Example outputs
- Edge cases

### Quickstart Guide

**File**: [quickstart.md](quickstart.md) - Developer guide containing:
1. How to modify EBNF vocabulary
2. How to test general synopsis generation
3. How to validate Beaufort scale text
4. Manual browser testing checklist
5. SSML debugging tips

---

## Phase 2: Implementation Tasks

**File**: [tasks.md](tasks.md) - Created by `/speckit.tasks` command (NOT by /speckit.plan)

Tasks will be generated based on this plan and will include:
- Vocabulary modifications (add EBNF arrays, remove sea states)
- Generator enhancements (precipitation, icing, Beaufort wind)
- Broadcast generator updates (general synopsis)
- SSML template modifications (new segments)
- Manual browser testing validation

---

## Architecture Design

### Implementation Approach

**Strategy**: **Extend existing generators** with EBNF-specific methods rather than creating new modules. This minimizes disruption and maintains compatibility with existing uncanny features (phantom areas, surreal introductions).

### Key Design Decisions

1. **Manual EBNF Rule Implementation**
   - Hardcode EBNF production rules as JavaScript methods
   - Each non-terminal becomes a generator function
   - Simpler than parsing EBNF file dynamically
   - Easier to customize for uncanny features

2. **General Synopsis as New Broadcast Segment**
   - Insert between gale warnings and time period transition
   - Generate fresh pressure data for each broadcast
   - 50% probability of pressure change clause
   - Pressure magnitude scaled by rate descriptor

3. **Precipitation Replaces Generic Weather**
   - Modifier + Type combinations (18 total)
   - All area forecasts use structured precipitation
   - Remove weather array from vocabulary
   - Update SSML templates accordingly

4. **Sea State Removal**
   - Delete SEA_STATES array from vocabulary
   - Remove sea state generation from generator
   - Remove _buildSeaSSML() from template builder
   - No replacement needed (precipitation covers weather info)

5. **Beaufort Scale Text for Gales**
   - Forces 8-12 use text: "gale 8", "severe gale 9", "storm 10", "violent storm 11", "hurricane force 12"
   - Forces 0-7 remain integers
   - Mixed format allowed when compound spans threshold: "7 to gale 8"

### File Modifications

#### 1. src/core/vocabulary.js

**Changes**:
- **ADD** `PRECIPITATION_MODIFIERS` = ['Thundery', 'Wintry', 'Squally', 'Occasionally', 'Heavy', 'Light']
- **ADD** `PRECIPITATION_TYPES` = ['showers', 'rain', 'snow']
- **ADD** `ICING_SEVERITIES` = ['Moderate', 'Severe']
- **ADD** `PRESSURE_DESCRIPTIONS` = ['High', 'Medium', 'Low']
- **ADD** `RATE_OF_CHANGE` = ['more slowly', 'slowly', 'quickly', 'very rapidly']
- **ADD** `COMPASS_DIRECTIONS_SYNOPSIS` = ['north', 'northwest', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west']
- **REMOVE** `SEA_STATES` array entirely
- **KEEP** `WIND_DIRECTIONS`, `VISIBILITY_CONDITIONS`, `STANDARD_AREAS`, `PHANTOM_AREAS`

**Rationale**: Centralize all EBNF vocabulary in one place for easy modification and reference.

#### 2. src/core/generator.js

**Changes**:
- **ADD** `_generatePrecipitation()` method returning `{modifier, type, text}`
- **ADD** `_generateIcing()` method returning `{severity, text} | null` (10% probability)
- **ADD** `_formatWindForce(force)` method returning Beaufort scale text for 8+, integer for 0-7
- **MODIFY** `_generateWindConditions()` to use `_formatWindForce()` and handle mixed format (e.g., "7 to gale 8")
- **MODIFY** `generateWeatherReport()` to use precipitation instead of generic weather
- **MODIFY** `_formatReportText()` to include precipitation and optional icing, exclude sea state
- **REMOVE** `_generateSeaState()` method
- **REMOVE** sea state logic from report generation

**Rationale**: Keeps all weather generation logic in one class, maintains existing patterns, minimal disruption to uncanny features.

#### 3. src/core/broadcast-generator.js

**Changes**:
- **ADD** `_buildGeneralSynopsis()` method returning synopsis object with:
  - Pressure description (random from High/Medium/Low)
  - Current location (direction + area + pressure 900-1099)
  - Pressure change (50% probability with magnitude calculation)
  - Future location (direction + area + adjusted pressure + future time)
  - Formatted EBNF text
- **ADD** `_calculatePressureMagnitude(rate)` helper returning mb change (more slowly=3-5, slowly=4-6, quickly=8-10, very rapidly=10-12)
- **ADD** `_formatFutureTime()` helper returning HH:MM with optional " tomorrow" suffix
- **MODIFY** `generateBroadcast()` to insert synopsis between gale warnings and time period

**Rationale**: Broadcast orchestration remains in one place, synopsis logic encapsulated in dedicated method, maintains existing segment ordering pattern.

#### 4. src/audio/ssml-template-builder.js

**Changes**:
- **ADD** `_buildGeneralSynopsisSSML(synopsis)` method with:
  - 1200ms break before
  - 85% speaking rate
  - Moderate emphasis on "general synopsis"
  - Standard breaks after pressure values
- **ADD** `_buildPrecipitationSSML(precipitation)` method with:
  - Standard breaks after modifier
  - Emphasis on weather severity (Thundery, Wintry, Squally)
- **ADD** `_buildIcingSSML(icing)` method with:
  - Strong emphasis on severity
  - 600ms break after
- **MODIFY** `_buildWindSSML(wind)` to handle Beaufort scale text pronunciation
- **MODIFY** `buildBroadcast()` to include synopsis segment after gale warnings
- **REMOVE** `_buildSeaSSML()` method entirely

**Rationale**: SSML generation stays centralized, new segments follow existing prosody patterns, maintains BBC Radio 4 authenticity.

### Integration Points

**Critical touchpoints** where EBNF changes interact with existing system:

1. **BroadcastGenerator.generateBroadcast()**: Insert general synopsis segment
2. **WeatherReportGenerator.generateWeatherReport()**: Replace weather with precipitation, add icing
3. **SSMLTemplateBuilder.buildBroadcast()**: Add synopsis SSML, modify wind SSML, remove sea SSML
4. **Vocabulary exports**: Update import statements in generator/template builder
5. **Date formatting**: Reuse existing `formatTimeForSpeech()` for synopsis future times

### EBNF Compliance Strategy

**Validation approach** (manual, per constitution):

1. **Generate 50+ broadcasts** in test HTML
2. **Console inspection** of data structures
3. **Audio listening** for natural pronunciation
4. **Manual checklist** against EBNF grammar (lines 33-38, 40-42, 45, 59, 61-63)
5. **Edge case testing** (midnight UTC, force 8, pressure boundaries, compound winds)

**No automated validators** - manual verification sufficient for personal project scope.

---

## Performance Considerations

### SSML Character Limits

**Current Situation**:
- Average broadcast: ~3,500 characters
- General synopsis adds: ~200-300 characters
- Precipitation/icing minimal impact: ~50 characters per forecast
- **Total estimate**: ~4,000-4,500 characters

**Risk Assessment**: **LOW** - Well under 5,000 character TTS API limit

**Mitigation**: Add console warning if SSML exceeds 4,800 characters (future chunking if needed)

### Generation Time

**Current Performance**:
- WeatherReport generation: ~5ms per area
- Broadcast assembly: ~20ms total
- SSML template building: ~30ms total

**Expected Impact**:
- General synopsis: +5ms (pressure calculation, location selection)
- Precipitation: +1ms per forecast (simple random selection)
- Beaufort formatting: +1ms per forecast (conditional text substitution)
- **Total estimate**: ~60ms per complete broadcast

**Acceptable**: Maintains <100ms target, no user-perceivable latency

### Memory Footprint

**Vocabulary additions**:
- PRECIPITATION_MODIFIERS: 6 strings (~100 bytes)
- PRECIPITATION_TYPES: 3 strings (~50 bytes)
- ICING_SEVERITIES: 2 strings (~30 bytes)
- PRESSURE_DESCRIPTIONS: 3 strings (~50 bytes)
- RATE_OF_CHANGE: 4 strings (~80 bytes)
- **Total**: ~310 bytes (negligible)

**No memory concerns** - additions minimal, sea state removal offsets.

---

## Testing Strategy (Manual, Per Constitution)

### Browser Testing Approach

**Test HTML pages**:
1. **test-ebnf-compliance.html**: Generate 50+ broadcasts, display structured data
2. **test-natural-speech.html**: Audio playback, listen for pronunciation issues

### Validation Checklist

**EBNF Compliance** (validate via console inspection):
- [ ] 100% of broadcasts include general synopsis
- [ ] Pressure values always 900-1099
- [ ] Pressure change appears ~50% of time (48-52% across 50 broadcasts)
- [ ] Future pressure change matches rate magnitude (slowly=4-6mb, quickly=8-10mb, etc.)
- [ ] All 18 precipitation combinations appear across 100 area forecasts
- [ ] Icing appears ~10% of time (8-12% across 100 forecasts)
- [ ] Wind forces 8-12 always use Beaufort scale text
- [ ] Wind forces 0-7 always use integers
- [ ] Mixed format appears when compound forces span threshold (e.g., "7 to gale 8")
- [ ] Sea states never appear

**Natural Speech Quality** (validate via audio listening):
- [ ] General synopsis sounds natural at 85% speaking rate
- [ ] Precipitation modifier + type combinations flow naturally
- [ ] Beaufort scale text pronounced correctly by TTS
- [ ] 1200ms break after synopsis provides clear separation
- [ ] No perceivable gaps or robotic artifacts

**Uncanny Features Preserved** (validate via console/audio):
- [ ] Phantom areas still appear with 2% probability
- [ ] Surreal introduction variants still active
- [ ] Time period variants randomized (10+ options)

### Manual Testing Commands

```javascript
// Generate 50 broadcasts and inspect
const testBroadcasts = [];
for (let i = 0; i < 50; i++) {
  const broadcast = broadcastGenerator.generateBroadcast(31);
  testBroadcasts.push(broadcast);
  console.log(`Broadcast ${i+1}:`, broadcast);
}

// Validate general synopsis
const synopsisCount = testBroadcasts.filter(b => b.generalSynopsis).length;
console.log(`General synopsis present: ${synopsisCount}/50 (should be 50)`);

// Validate pressure change frequency
const changeCount = testBroadcasts.filter(b => b.generalSynopsis.pressureChange).length;
console.log(`Pressure change frequency: ${changeCount}/50 (should be ~25, 48-52% acceptable)`);

// Validate precipitation combinations
const allForecasts = testBroadcasts.flatMap(b => b.areaForecasts);
const precipCombos = new Set(allForecasts.map(f => f.precipitation.text));
console.log(`Unique precipitation combinations: ${precipCombos.size} (target 18)`, precipCombos);

// Validate icing frequency
const icingCount = allForecasts.filter(f => f.icing).length;
console.log(`Icing frequency: ${icingCount}/${allForecasts.length} (should be ~10%, 8-12% acceptable)`);

// Validate Beaufort scale
const galeWinds = allForecasts.filter(f => {
  const force = Array.isArray(f.wind.force) ? Math.max(...f.wind.force) : f.wind.force;
  return force >= 8;
});
const beaufortCorrect = galeWinds.every(f => f.wind.forceText.includes('gale') || f.wind.forceText.includes('storm') || f.wind.forceText.includes('hurricane'));
console.log(`Beaufort scale text correct: ${beaufortCorrect} (should be true)`);

// Validate no sea states
const hasSeaState = allForecasts.some(f => f.seaState);
console.log(`Sea states removed: ${!hasSeaState} (should be true)`);
```

---

## Implementation Sequence

**Recommended order** (minimize breaking changes during development):

### Day 1: Vocabulary Updates
- Add new arrays to vocabulary.js (PRECIPITATION_MODIFIERS, PRECIPITATION_TYPES, ICING_SEVERITIES, PRESSURE_DESCRIPTIONS, RATE_OF_CHANGE, COMPASS_DIRECTIONS_SYNOPSIS)
- Remove SEA_STATES array
- Test imports in console: `console.log(vocabulary.PRECIPITATION_MODIFIERS)`

### Day 2: Precipitation & Icing
- Add `_generatePrecipitation()` to generator.js
- Add `_generateIcing()` to generator.js
- Update `generateWeatherReport()` to use precipitation
- Remove sea state generation
- Test in console: Generate 20 reports, verify no sea states, all have precipitation

### Day 3: Beaufort Scale Wind
- Add `_formatWindForce()` to generator.js
- Modify `_generateWindConditions()` to use Beaufort text
- Test compound forces spanning threshold: `console.log(generator._generateWindConditions())` repeatedly until "7 to gale 8" appears
- Verify forces 8-12 always use text

### Day 4: General Synopsis
- Add `_buildGeneralSynopsis()` to broadcast-generator.js
- Add `_calculatePressureMagnitude()` and `_formatFutureTime()` helpers
- Update `generateBroadcast()` to include synopsis
- Test pressure change logic: Generate 50 broadcasts, count pressure change frequency (should be ~25)
- Validate magnitude calculation: Check that "slowly" = 4-6mb, "quickly" = 8-10mb, etc.

### Day 5: SSML Integration
- Add `_buildGeneralSynopsisSSML()` to ssml-template-builder.js
- Add `_buildPrecipitationSSML()` and `_buildIcingSSML()`
- Modify `_buildWindSSML()` for Beaufort text
- Remove `_buildSeaSSML()`
- Update `buildBroadcast()` to include all new segments
- Test SSML character count: `console.log(ssmlTemplate.length)` (should be <4500)

### Day 6: Browser Testing
- Load test-ebnf-compliance.html
- Generate 50+ complete broadcasts
- Run validation checklist (console commands above)
- Load test-natural-speech.html
- Listen to audio quality
- Test edge cases: midnight UTC, force 8, pressure boundaries

### Day 7: Refinement
- Adjust SSML breaks if needed for natural flow
- Fix any pronunciation issues with TTS (add phoneme tags if needed)
- Verify all success metrics from checklist
- Document any known issues or future improvements

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SSML exceeds 5,000 char limit | High | Medium | Add console warning; future chunking if needed |
| Beaufort scale text sounds unnatural | Low | High | Test with TTS synthesis; adjust SSML breaks if needed |
| Precipitation combinations sound repetitive | Medium | Low | 18 combinations provide variety; monitor over 50+ broadcasts |
| General synopsis breaks flow | Low | Medium | 1200ms break provides clear separation; adjust if needed |
| Missing sea states noticed by users | Low | Low | EBNF compliance justification; precipitation replaces weather |
| Pressure change magnitude incorrect | Low | Medium | Validate magnitude calculation matches rate descriptors |
| Mixed wind format confusing | Low | Low | Test with multiple examples; EBNF allows mixed format |
| Time period variants don't randomize | Low | Low | Verify variant selection in broadcast-variants.js |

---

## Success Criteria

**Manual validation** via browser testing and console inspection:

### EBNF Compliance
- General synopsis appears in 100% of broadcasts
- Pressure values realistic (900-1099) in 100% of synopses
- Pressure change frequency 48-52% across 50+ broadcasts
- Pressure magnitude correlates with rate (slowly=4-6mb, quickly=8-10mb, very rapidly=10-12mb, more slowly=3-5mb)
- All 18 precipitation combinations appear across 100+ area forecasts
- Icing frequency 8-12% across 100+ area forecasts
- Wind forces 8-12 use Beaufort scale text in 100% of cases
- Wind forces 0-7 use integers in 100% of cases
- Sea states never appear

### Natural Speech Quality
- General synopsis sounds natural at 85% speaking rate
- Precipitation combinations flow naturally (no awkward pauses)
- Beaufort scale text pronounced correctly ("gale eight", not "gale digit eight")
- 1200ms break after synopsis provides clear audible separation
- No robotic artifacts or perceivable gaps

### Uncanny Features Preserved
- Phantom areas appear with 1-3% probability (verify across 100+ forecasts)
- Surreal introduction variants active (check for "Department of Quiet Waters", etc.)
- Time period variants randomized (no single variant >15% across 50+ broadcasts)

---

## Critical Files for Implementation

**Top 5 files** requiring modification (in order of implementation):

1. **[src/core/vocabulary.js](../../src/core/vocabulary.js)** - Add EBNF vocabulary arrays, remove SEA_STATES
2. **[src/core/generator.js](../../src/core/generator.js)** - Add precipitation/icing/Beaufort wind methods, remove sea state
3. **[src/core/broadcast-generator.js](../../src/core/broadcast-generator.js)** - Add general synopsis generation method
4. **[src/audio/ssml-template-builder.js](../../src/audio/ssml-template-builder.js)** - Add new SSML segment builders, remove sea SSML
5. **[src/shipping-forecast.ebnf](../../src/shipping-forecast.ebnf)** - Reference grammar for validation (read-only)

**Supporting files** (reused, not modified):
- [src/audio/broadcast-variants.js](../../src/audio/broadcast-variants.js) - Already has 15 time period variants
- [src/utils/date-formatter.js](../../src/utils/date-formatter.js) - Reuse for synopsis future times
- [src/core/areas.js](../../src/core/areas.js) - Standard/phantom areas unchanged
- [src/audio/prosody-config.js](../../src/audio/prosody-config.js) - 85% speaking rate unchanged

---

## Next Steps

1. **Phase 0**: Create research.md (resolve technical unknowns)
2. **Phase 1**: Create data-model.md, contracts/, quickstart.md
3. **Phase 2**: Generate tasks.md via `/speckit.tasks` command
4. **Implementation**: Follow 7-day sequence above
5. **Validation**: Complete manual testing checklist
6. **Deployment**: Merge to main branch after browser validation

---

**Constitution Check Re-evaluation (Post-Design)**: ✅ **PASS**
- No automated testing added (manual browser testing only)
- Natural speech quality maintained (SSML prosody, BBC cadence)
- Real-time TTS generation preserved (no pre-recorded audio)
- Rapid iteration workflow supported (7-day implementation, direct browser testing)
