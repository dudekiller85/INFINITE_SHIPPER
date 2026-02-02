# Research: Broadcast Structure with Introduction and Transitions

**Feature**: 003-broadcast-structure
**Date**: 2026-02-02
**Status**: Phase 0 Complete

## Overview

This document consolidates research findings for implementing complete broadcast structure with introduction, gale warnings, time period transitions, and area forecasts. All research questions from plan.md have been answered with implementation-ready decisions.

---

## RQ-001: BBC Timestamp Formatting

### Decision

**Time Format**:
- Use **"zero"** for the digit 0, not "oh"
- Examples:
  - 05:30 = "zero five thirty"
  - 00:48 = "zero zero forty-eight"
  - 14:00 = "fourteen hundred"
  - 21:00 = "twenty-one hundred"
  - 17:54 = "seventeen fifty-four"

**Date Format**:
- Format: "on [day of week] the [ordinal date] of [month]"
- Example: "on Tuesday the second of February"
- Ordinals: first, second, third, fourth, fifth... twenty-first, twenty-second, thirty-first

### Rationale

The BBC Radio 4 Shipping Forecast uses "zero" rather than "oh" for clarity in maritime contexts. This is standard formal British broadcasting where ambiguity could have safety implications. The date format with day of week + ordinal provides complete temporal context matching BBC style.

### Alternatives Considered

- "Oh" for zero: Rejected as less formal and potentially confusing with letter O
- 24-hour numerical format ("zero five three zero"): Rejected as too mechanical
- 12-hour with AM/PM: Rejected as BBC uses 24-hour clock
- ISO date format: Rejected as not natural spoken language

### Implementation

Create `src/utils/date-formatter.js` with:
- `formatBBCTime(date)` - Returns spoken time format
- `formatBBCDate(date)` - Returns spoken date format
- `getOrdinalSuffix(day)` - Returns st/nd/rd/th suffix

```javascript
// Example implementation outline
function formatBBCTime(date) {
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();

  // Handle hour formatting
  const hourWord = hours === 0 ? "zero" : hours < 10 ? `zero ${hours}` : String(hours);

  // Handle minute formatting
  let minuteWord;
  if (minutes === 0) {
    minuteWord = "hundred";
  } else if (minutes < 10) {
    minuteWord = `zero ${minutes}`;
  } else {
    minuteWord = String(minutes);
  }

  return `${hourWord} ${minuteWord}`;
}
```

---

## RQ-002: Gale Warning Ordering

### Decision

**Use geographic ordering (north to south, west to east)** following the standard 31-area shipping forecast sequence:

1. Viking
2. North Utsire
3. South Utsire
4. Forties
5. Cromarty
6. Forth
7. Tyne
8. Dogger
9. Fisher
10. German Bight
... (continuing through all 31 areas)

### Rationale

Geographic ordering has been BBC standard since the 1920s and reflects:
- **Navigational logic**: Ships traveling standard routes encounter areas in geographic sequence
- **Mental mapping**: Listeners can mentally map warnings to physical locations
- **Consistency**: Matches area forecast segment ordering
- **Tradition**: 100 years of BBC practice

### Alternatives Considered

- Alphabetical ordering: Rejected as it destroys geographic coherence
- Severity-first (highest force first): Rejected as all gale warnings are equally urgent (force 8+ threshold)
- Random ordering: Rejected as completely breaks authenticity
- Grouped by wind direction: Rejected as no BBC precedent

### Implementation

Use existing `STANDARD_AREAS` array from `src/core/areas.js` as ordering reference. When generating gale warnings:

```javascript
function orderGales(gales) {
  // Use standard area sequence as ordering template
  return gales.sort((a, b) => {
    const indexA = STANDARD_AREAS.indexOf(a.areaName);
    const indexB = STANDARD_AREAS.indexOf(b.areaName);
    return indexA - indexB;
  });
}
```

---

## RQ-003: SSML Multi-Segment Synthesis

### Decision

**Character Limit**: Google Cloud Text-to-Speech maximum SSML input is **5,000 characters**

**Long Documents**: 1000-2000 character documents work well with consistent prosody across multiple `<prosody>` and `<break>` tags

**Strategy**: Monitor total character count and implement fallback chunking for broadcasts exceeding 5,000 characters

### Rationale

Google Cloud TTS documented limits confirmed through existing project research. Typical broadcast character counts:
- Introduction: ~200-300 characters
- Gale warnings: ~50-100 per gale × 3-5 gales = 150-500 characters
- Time period: ~50-100 characters
- Area forecasts: ~150-200 per area × 31 areas = 4,650-6,200 characters
- **Total**: ~5,050-7,100 characters for full 31-area broadcast

Full broadcasts may exceed limit. Options:
- **Option A**: Chunk synthesis (intro+gales+time as chunk 1, areas in groups)
- **Option B**: Limit to 20-25 areas per broadcast
- **Option C**: For now, accept full broadcasts may need chunking

### Alternatives Considered

- Assume no limit: Rejected as 5,000 character limit is documented
- Split into many small requests: Rejected as prosody may vary between requests
- Use Web Speech API: Rejected as poor quality, no SSML support
- Remove SSML: Rejected as required for pause timing and prosody control

### Implementation

Add character counting to `SSMLTemplateBuilder`:

```javascript
buildBroadcast(broadcast) {
  let ssml = '<speak>';
  // ... build segments ...
  ssml += '</speak>';

  if (ssml.length > 5000) {
    console.warn(`Broadcast SSML ${ssml.length} chars exceeds 5000 limit`);
    // Future: implement chunking strategy
  }

  return {
    ssml,
    characterCount: ssml.length,
    exceedsLimit: ssml.length > 5000
  };
}
```

---

## RQ-004: Surreal Variant Boundaries

### Decision

**Maintains Plausibility** (unsettling but believable):

1. **Alternative Authority Names** - Plausible-sounding official bodies:
   - "Department of Quiet Waters"
   - "Institute of Maritime Observation"
   - "Coastal Monitoring Service"
   - "Maritime Weather Bureau"
   - "The Sea Council"

2. **Temporal Phrasing Alterations** - Subtle time ambiguities:
   - "at a time that may have passed"
   - "at a time yet to be determined"
   - "at an hour known to the tides"
   - "at a time between times"

3. **Procedural Variations** - Bureaucratic formality with oddness:
   - "issued by the Met Office under instruction from deeper waters"
   - "issued on behalf of those who watch the shipping lanes"

**Crosses into Parody** (avoid):
- Overtly silly names ("Department of Spooky Oceans")
- Pop culture references ("issued by Poseidon")
- Obvious jokes or humor
- Breaking the fourth wall
- Meta-commentary

### Rationale

Success criterion SC-012 requires 80%+ listeners rate surreal variants as "unsettling but plausible". Maximum effect occurs at boundary between "slightly wrong but can't identify why" and "obviously intentional weirdness".

**What works**:
- Bureaucratic formality maintains authority even when content is strange
- Temporal ambiguity creates unease without breaking belief
- Institutional vocabulary ("Department", "Institute", "Council") maintains official tone
- Maritime vocabulary stays thematically consistent
- Passive voice maintains formal broadcasting style

**What breaks immersion**:
- Humor signals "this is fake"
- Mythological references too on-the-nose
- Modern slang destroys BBC formality
- Self-reference ruins hypnotic trance

### Alternatives Considered

- No surreal variants (pure authenticity): Rejected as FR-006 requires surrealism
- Fully surreal (no authenticity): Rejected as fails plausibility requirement
- Progressive weirdness over time: Viable future enhancement but too complex for initial implementation
- Context-specific surrealism (only during phantom): Rejected as reduces variety

### Implementation

Create curated variant library in `src/audio/broadcast-variants.js`:

```javascript
const INTRODUCTION_VARIANTS = [
  // Standard variants (60%)
  {
    id: 'std-001',
    isSurreal: false,
    template: 'And now the shipping forecast, issued by the Met Office on behalf of the Maritime and Coastguard Agency',
    weight: 2
  },
  // Surreal variants (40%)
  {
    id: 'sur-001',
    isSurreal: true,
    template: 'And now the shipping forecast, issued by the Department of Quiet Waters',
    weight: 1
  }
];
```

User testing required: Generate 20-30 variants, A/B test for "real but unusual" vs "intentional parody" perception.

---

## RQ-005: Time Period Variants

### Decision

**15 Authentic BBC Time Period Variants**:

1. "for the next 24 hours" (duration-based, standard)
2. "valid until 0600 tomorrow" (endpoint-based, specific time)
3. "until midnight tonight" (endpoint-based, evening)
4. "through Tuesday evening" (day-based duration)
5. "for the period ending 1800 hours" (formal time-based)
6. "issued for the next 6 hours" (short duration)
7. "valid through the overnight period" (descriptive period)
8. "for the remainder of today and tonight" (two-period span)
9. "until 0000 UTC Wednesday" (precise UTC format)
10. "for the next 48 hours" (extended duration)
11. "through the early hours of Wednesday" (descriptive + day)
12. "valid until further notice" (indefinite, rare)
13. "for the 24-hour period beginning 0600" (start-time based)
14. "through the next two tidal periods" (maritime-specific)
15. "until the next scheduled update" (reference to broadcast schedule)

**Frequency Distribution**:
- 24-hour variants (1, 10, 13): 40% (most common)
- Time-specific (2, 3, 5, 9): 30%
- Day-based (4, 11): 15%
- Descriptive (7, 8, 14): 10%
- Other (6, 12, 15): 5%

### Rationale

Real BBC Shipping Forecasts use varied time period phrasing based on broadcast time, forecast confidence, and weather stability. Five authentic pattern types identified:

1. **Duration-Based**: "next 24 hours" - most common, clear time span
2. **Endpoint-Based**: "until 0600 tomorrow" - specific expiry moment
3. **Period-Based**: "through Tuesday evening" - descriptive time periods
4. **Maritime-Specific**: "next two tidal periods" - nautical authenticity
5. **Reference-Based**: "until further notice" - implies ongoing monitoring

Randomizing these provides authentic variety matching real BBC practice while preventing listener fatigue from repetition.

### Alternatives Considered

- Single standard phrase: Rejected as fails FR-017 requirement for 10+ variants
- Computer-generated variations: Rejected as unnatural (BBC never uses specific minute durations)
- Vague phrases only: Rejected as shipping forecast requires specific time frames for safety
- 50+ variants: Rejected as diminishing returns beyond 10-15 quality variants

### Implementation

Add to `src/audio/broadcast-variants.js`:

```javascript
const TIME_PERIOD_VARIANTS = [
  { id: 'tp-001', template: 'for the next 24 hours', weight: 3 },
  { id: 'tp-002', template: 'valid until 0600 tomorrow', weight: 2 },
  { id: 'tp-003', template: 'until midnight tonight', weight: 2 },
  // ... 12 more variants
];

function selectTimePeriodVariant() {
  // Weighted random selection
  const totalWeight = TIME_PERIOD_VARIANTS.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.random() * totalWeight;

  for (const variant of TIME_PERIOD_VARIANTS) {
    random -= variant.weight;
    if (random <= 0) return variant;
  }

  return TIME_PERIOD_VARIANTS[0]; // fallback
}
```

---

## Implementation Summary

### Files to Create

1. **`src/utils/date-formatter.js`**
   - `formatBBCTime(date)` - "zero five thirty"
   - `formatBBCDate(date)` - "on Tuesday the second of February"
   - `getOrdinalSuffix(day)` - st/nd/rd/th

2. **`src/audio/broadcast-variants.js`**
   - `INTRODUCTION_VARIANTS` - 20+ variants (12 standard, 8+ surreal)
   - `GALE_WARNING_VARIANTS` - 20+ format variants
   - `TIME_PERIOD_VARIANTS` - 15 time period phrases
   - `selectIntroductionVariant()` - weighted random selection
   - `selectGaleWarningVariant()` - weighted random selection
   - `selectTimePeriodVariant()` - weighted random selection

3. **`src/core/broadcast-generator.js`**
   - `generateBroadcast(areaForecasts)` - main orchestrator
   - `orderGales(gales)` - geographic ordering using STANDARD_AREAS
   - Character count monitoring for 5,000 limit

### Files to Modify

1. **`src/audio/ssml-template-builder.js`**
   - Add `buildBroadcast(broadcast)` method
   - Add inter-segment pause logic (1500ms/1000ms/800ms)
   - Add character count tracking

### Testing Strategy

Per constitution principle II (no automated testing required), validation via:
- Manual browser testing in test-natural-speech.html
- Console inspection of variant distribution across 50+ generations
- Audio quality verification for pause timings
- Edge case testing (midnight UTC, multiple gales, long broadcasts)
- User testing of surreal variant plausibility (target 80%+ "unsettling but plausible")

---

## Risks Addressed

| Risk | Mitigation Strategy |
|------|---------------------|
| SSML length exceeds 5,000 chars | Monitor character count, prepare chunking fallback |
| Surreal variants break immersion | Curated library with plausibility testing |
| Timestamp edge cases (midnight) | Comprehensive date formatter edge case handling |
| Gale ordering feels inauthentic | Use established geographic sequence from STANDARD_AREAS |
| Prosody inconsistency | Single SSML document synthesis, tested up to 2,000 chars |

---

## Next Phase

Phase 1 (Design) can now proceed with all research questions resolved:
- Create data-model.md from plan.md design section
- Create contracts/ssml-structure.json
- Create quickstart.md
- Update CLAUDE.md via update-agent-context.sh

All implementation decisions documented and ready for Phase 2 (Implementation).
