# Data Model: Broadcast Structure

**Feature**: 003-broadcast-structure
**Date**: 2026-02-02
**Status**: Phase 1 Design

## Overview

Data structures for complete broadcast generation including introduction, gale warnings, time period transitions, and area forecasts. All segments synthesized as single SSML document.

---

## Core Entities

### Broadcast

Complete audio structure containing all broadcast segments in generation order.

**Purpose**: Represents a full shipping forecast broadcast from introduction through all area reports.

**Fields**:
```javascript
{
  broadcastId: string,          // Unique identifier (format: "broadcast-[hex]")
  timestamp: Date,               // Generation time (used for introduction)
  introduction: IntroductionSegment,
  galeWarnings: GaleWarningSegment | null,  // null if no gales
  timePeriod: TimePeriodSegment,
  areaForecasts: AreaForecast[], // Generated weather reports
  ssml: string,                  // Complete SSML for all segments
  characterCount: number,         // Total SSML character count
  createdAt: Date                // Generation timestamp
}
```

**Relationships**:
- Contains exactly 1 `IntroductionSegment`
- Contains 0 or 1 `GaleWarningSegment` (conditional on force 8+ winds)
- Contains exactly 1 `TimePeriodSegment`
- Contains 1 or more `AreaForecast` (typically 31 standard + 7 phantom)

**Lifecycle**:
1. Generate area forecasts via existing `generator.js`
2. Check for gales (force 8+)
3. Select variants for introduction, gale warnings (if applicable), time period
4. Build complete SSML document
5. Synthesize via TTS adapter
6. Play via Web Audio API

**Validation Rules**:
- `broadcastId` must match pattern `^broadcast-[0-9a-f]{8}$`
- `characterCount` must be under 5,000 (Google Cloud TTS limit)
- `areaForecasts` must not be empty
- `galeWarnings` must be null if no force 8+ winds exist
- `galeWarnings` must be non-null if any force 8+ winds exist

---

### IntroductionSegment

Opening announcement with Met Office attribution, timestamp, and date.

**Purpose**: Establishes broadcast authority and temporal context. Uses 20+ variants including surreal alternatives.

**Fields**:
```javascript
{
  variantId: string,     // Which variant selected (e.g., "std-001", "sur-003")
  authority: string,     // Issuing authority text
  timestamp: string,     // BBC formatted time (e.g., "zero five thirty")
  date: string,          // BBC formatted date (e.g., "on Tuesday the second of February")
  ssml: string,          // SSML for this segment
  isSurreal: boolean     // Standard or surreal variant
}
```

**Example Standard Variant**:
```javascript
{
  variantId: "std-001",
  authority: "the Met Office on behalf of the Maritime and Coastguard Agency",
  timestamp: "zero five thirty",
  date: "on Tuesday the second of February",
  ssml: '<prosody rate="85%">And now the shipping forecast, issued by the Met Office on behalf of the Maritime and Coastguard Agency at zero five thirty on Tuesday the second of February.<break time="1500ms"/></prosody>',
  isSurreal: false
}
```

**Example Surreal Variant**:
```javascript
{
  variantId: "sur-003",
  authority: "the Department of Quiet Waters",
  timestamp: "a time that may have passed",
  date: "on a day known to the tides",
  ssml: '<prosody rate="85%">And now the shipping forecast, issued by the Department of Quiet Waters at a time that may have passed on a day known to the tides.<break time="1500ms"/></prosody>',
  isSurreal: true
}
```

**Validation Rules**:
- `authority` must not be empty string
- `timestamp` must be valid BBC format or surreal time phrase
- `date` must include day reference
- `ssml` must include 1500ms break at end (segment separator)

---

### GaleWarningSegment

Urgent announcements for areas with force 8+ winds.

**Purpose**: Safety-critical information prioritized before area forecasts. Conditional - only present when gales exist.

**Fields**:
```javascript
{
  variantId: string,           // Which format variant selected
  gales: Gale[],               // List of gale conditions (ordered geographically)
  formatType: 'standard' | 'inverse',  // Standard or inverse format
  ssml: string                 // SSML for this segment
}
```

**Gale** (sub-structure):
```javascript
{
  areaName: string,   // Affected shipping area
  force: number,      // Wind force (>= 8)
  direction: string   // Wind direction (e.g., "southwesterly")
}
```

**Example Standard Format**:
```javascript
{
  variantId: "gale-std-001",
  gales: [
    { areaName: "Viking", force: 8, direction: "southwesterly" },
    { areaName: "Forties", force: 9, direction: "westerly" }
  ],
  formatType: "standard",
  ssml: '<prosody rate="85%">Gale warnings. Viking, southwesterly gale force 8. Forties, westerly gale force 9.<break time="1000ms"/></prosody>'
}
```

**Example Inverse Format**:
```javascript
{
  variantId: "gale-inv-002",
  gales: [
    { areaName: "Viking", force: 8, direction: "southwesterly" }
  ],
  formatType: "inverse",
  ssml: '<prosody rate="85%">Gale warnings. Southwesterly gale force 8 in Viking.<break time="1000ms"/></prosody>'
}
```

**Validation Rules**:
- All `gales` must have `force >= 8`
- `gales` array must not be empty when segment exists
- `areaName` must match valid shipping area from `STANDARD_AREAS` or `PHANTOM_AREAS`
- Gales must be ordered geographically (using `STANDARD_AREAS` sequence)
- `ssml` must include 1000ms break at end (segment separator)

**Ordering**: See research.md RQ-002. Gales ordered by geographic position (north to south) using `STANDARD_AREAS` array.

---

### TimePeriodSegment

Transition phrase indicating forecast validity duration.

**Purpose**: Signals start of area forecasts and specifies time coverage. Uses 10+ variants for variety.

**Fields**:
```javascript
{
  variantId: string,      // Which time period variant selected
  duration: string,       // Phrase text
  validityHours: number,  // Actual forecast duration (for validation)
  ssml: string            // SSML for this segment
}
```

**Examples**:
```javascript
// Duration-based
{
  variantId: "tp-001",
  duration: "for the next 24 hours",
  validityHours: 24,
  ssml: '<prosody rate="85%">And now the area forecasts for the next 24 hours.<break time="800ms"/></prosody>'
}

// Endpoint-based
{
  variantId: "tp-002",
  duration: "valid until 0600 tomorrow",
  validityHours: 24,
  ssml: '<prosody rate="85%">And now the area forecasts valid until 0600 tomorrow.<break time="800ms"/></prosody>'
}

// Maritime-specific
{
  variantId: "tp-014",
  duration: "through the next two tidal periods",
  validityHours: 12,
  ssml: '<prosody rate="85%">And now the area forecasts through the next two tidal periods.<break time="800ms"/></prosody>'
}
```

**Validation Rules**:
- `duration` text must accurately reflect `validityHours` (semantic consistency check)
- `validityHours` must be positive integer
- `ssml` must include 800ms break at end (segment separator)

---

## Variant Template Entities

These define the libraries of variant templates used for randomized generation.

### IntroductionVariant

Template for introduction segment generation.

**Purpose**: Defines one possible introduction phrasing with substitution placeholders.

**Fields**:
```javascript
{
  id: string,                    // Unique identifier (e.g., "std-001", "sur-003")
  isSurreal: boolean,            // Standard or surreal category
  authorityTemplate: string,     // Authority text with placeholders
  template: string,              // Full template with {time}, {date} placeholders
  weight: number                 // Selection probability weight (higher = more frequent)
}
```

**Example**:
```javascript
{
  id: "std-001",
  isSurreal: false,
  authorityTemplate: "the Met Office on behalf of the Maritime and Coastguard Agency",
  template: "And now the shipping forecast, issued by {authority} at {time} {date}",
  weight: 2  // Appears 2x as often as weight-1 variants
}
```

**Variant Selection**: Weighted random selection. Standard variants have higher weights (appear ~60% of time), surreal variants lower weights (~40% of time).

---

### GaleWarningVariant

Template for gale warning segment generation.

**Purpose**: Defines one possible gale warning format with substitution logic.

**Fields**:
```javascript
{
  id: string,                      // Unique identifier
  formatType: 'standard' | 'inverse',  // Format category
  template: string,                // Single gale template
  multipleGaleTemplate: string,    // Template for multiple gales
  weight: number                   // Selection probability weight
}
```

**Standard Format Example**:
```javascript
{
  id: "gale-std-001",
  formatType: "standard",
  template: "{area}, {direction} gale force {force}",
  multipleGaleTemplate: "Gale warnings. {gales}",
  weight: 2
}
```

**Inverse Format Example**:
```javascript
{
  id: "gale-inv-001",
  formatType: "inverse",
  template: "{direction} gale force {force} in {area}",
  multipleGaleTemplate: "Gale warnings. {gales}",
  weight: 1
}
```

---

### TimePeriodVariant

Template for time period transition generation.

**Purpose**: Defines one possible time period phrasing.

**Fields**:
```javascript
{
  id: string,           // Unique identifier
  template: string,     // Phrase template
  weight: number        // Selection probability weight
}
```

**Examples**:
```javascript
// High frequency (standard 24-hour)
{
  id: "tp-001",
  template: "And now the area forecasts for the next 24 hours",
  weight: 3
}

// Medium frequency (time-specific)
{
  id: "tp-002",
  template: "And now the area forecasts valid until 0600 tomorrow",
  weight: 2
}

// Low frequency (maritime-specific)
{
  id: "tp-014",
  template: "And now the area forecasts through the next two tidal periods",
  weight: 1
}
```

**Frequency Distribution**: See research.md RQ-005 for target distribution (40% duration-based, 30% time-specific, 15% day-based, 10% descriptive, 5% other).

---

## State Transitions

### Broadcast Generation Flow

```
1. START
   ↓
2. Generate area forecasts (existing generator.js)
   ↓
3. Analyze forecasts for gales (force 8+ check)
   ↓
4. SELECT introduction variant (weighted random)
   ↓
5. IF gales exist:
     SELECT gale warning variant
     BUILD gale warning segment
     ORDER gales geographically
   ELSE:
     galeWarnings = null
   ↓
6. SELECT time period variant (weighted random)
   ↓
7. BUILD complete SSML document:
   - Add introduction SSML
   - Add gale warnings SSML (if applicable)
   - Add time period SSML
   - Add area forecast SSML (existing builder)
   ↓
8. VALIDATE character count (<5000)
   ↓
9. RETURN Broadcast object
   ↓
10. SYNTHESIZE via TTS adapter
    ↓
11. PLAY via Web Audio API
    ↓
12. END
```

### Variant Selection Logic

All variant selection uses weighted random algorithm:

```javascript
function selectVariant(variants) {
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.random() * totalWeight;

  for (const variant of variants) {
    random -= variant.weight;
    if (random <= 0) {
      return variant;
    }
  }

  return variants[0]; // Fallback
}
```

This ensures:
- Standard variants appear more frequently than surreal
- Common time periods (24-hour) appear more than rare variants
- Distribution approximates authentic BBC frequency patterns

---

## Relationships

```
Broadcast (1)
├── IntroductionSegment (1)
├── GaleWarningSegment (0..1)
│   └── Gale[] (1..n)
├── TimePeriodSegment (1)
└── AreaForecast[] (1..n)

Broadcast uses variants from:
├── IntroductionVariant[] (20+ templates)
├── GaleWarningVariant[] (20+ templates)
└── TimePeriodVariant[] (10+ templates)
```

---

## Character Count Budget

For 5,000 character Google Cloud TTS limit:

| Segment | Typical Characters | Max Characters |
|---------|-------------------|----------------|
| Introduction | 200-300 | 400 |
| Gale Warnings | 50-100 per gale (0-5 gales) | 500 |
| Time Period | 50-100 | 150 |
| Area Forecasts | 150-200 per area × 31 areas | 6,200 |
| **Total** | **5,050-7,100** | **7,250** |

**Implication**: Full 31-area broadcasts may exceed limit. Strategies:
- Monitor character count during generation
- Warn when approaching 5,000 limit
- Future: implement chunked synthesis for long broadcasts
- Initial implementation: accept potential over-limit (will need chunking)

---

## Integration Points

**Existing Systems**:
- `src/core/generator.js` - Generates `AreaForecast[]` objects
- `src/audio/ssml-template-builder.js` - Builds SSML for area forecasts
- `src/audio/tts-service-adapter.js` - Synthesizes SSML to audio
- `src/core/areas.js` - Provides `STANDARD_AREAS` ordering reference

**New Systems**:
- `src/core/broadcast-generator.js` - Orchestrates broadcast structure
- `src/audio/broadcast-variants.js` - Variant template libraries
- `src/utils/date-formatter.js` - BBC timestamp/date formatting

**Data Flow**:
1. User triggers broadcast generation
2. `broadcast-generator.js` calls `generator.js` for area forecasts
3. `broadcast-generator.js` builds complete `Broadcast` object
4. `ssml-template-builder.js` converts `Broadcast` to SSML string
5. `tts-service-adapter.js` synthesizes SSML to audio
6. Web Audio API plays synthesized audio

---

## Validation Summary

**Per Entity**:
- **Broadcast**: broadcastId pattern, character count <5000, non-empty area forecasts, gale warnings consistency
- **IntroductionSegment**: authority non-empty, valid timestamp/date format, 1500ms break
- **GaleWarningSegment**: all forces >=8, valid area names, geographic ordering, 1000ms break
- **TimePeriodSegment**: duration semantically matches validityHours, 800ms break

**Global Validation**:
- Broadcast structure order: Introduction → GaleWarnings → TimePeriod → AreaForecasts
- Pause timings between segments: 1500ms / 1000ms / 800ms
- BBC Radio 4 cadence maintained: 85% speaking rate across all segments
- Single SSML `<speak>` document envelope

---

## Next Steps

1. ✅ Research complete (research.md)
2. ✅ Data model documented (this file)
3. ⏭️ Create API contracts (contracts/ssml-structure.json)
4. ⏭️ Create quickstart guide (quickstart.md)
5. ⏭️ Update agent context (CLAUDE.md)
6. ⏭️ Generate implementation tasks (tasks.md via /speckit.tasks)
