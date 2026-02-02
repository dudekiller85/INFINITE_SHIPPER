# Feature Specification: EBNF-Compliant Broadcast Structure

**Feature Branch**: `003-broadcast-structure`
**Created**: 2 February 2026
**Updated**: 2 February 2026 (Added continuous looping requirement)
**Status**: Draft
**Input**: Update broadcast structure to strictly follow EBNF grammar (src/shipping-forecast.ebnf) with general synopsis, precipitation, icing, and Beaufort scale formatting, while preserving uncanny features (alternative intros, phantom areas)

## Clarifications

### Session 2026-02-02

- Q: Should sea state descriptions be removed entirely to maintain strict EBNF compliance, or kept as an extension to EBNF? → A: Remove sea states entirely for strict EBNF compliance
- Q: What percentage of general synopsis segments should include pressure change information (deepening/clearing + rate)? → A: 50%
- Q: Should the time period announcement have multiple variants (like the introduction), or always use the fixed text "The area forecasts for the next 24 hours:"? → A: Multiple variants (10+) with different phrasings while maintaining 24-hour duration
- Q: When wind force range spans the gale threshold (e.g., 7 to 8), should it format as "7 to gale 8" (mixed) or convert both to same format? → A: Allow mixed format: "7 to gale 8" when spanning threshold
- Q: When pressure change shows "deepening", how much should future pressure decrease from current pressure? → A: 4-12 millibars decrease

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Hear Complete EBNF-Structured Broadcast (Priority: P1)

As a listener, I want the forecast to follow the complete EBNF structure including introduction, gale warnings, general synopsis, and area forecasts with precipitation and icing information, so that each broadcast feels like an authentic, comprehensive BBC Radio 4 shipping forecast.

**Why this priority**: The complete EBNF structure is the foundation for forecast authenticity. It ensures all critical safety information (gales, pressure systems, precipitation, icing) is presented in the correct order following official BBC Radio 4 format.

**Independent Test**: Can be tested by generating broadcasts and verifying they match the EBNF grammar structure at src/shipping-forecast.ebnf. Each segment can be validated independently against EBNF production rules.

**Acceptance Scenarios**:

1. **Given** a broadcast is being generated, **When** audio synthesis begins, **Then** segments appear in order: Introduction → Gale Warnings (if applicable) → General Synopsis → Area Forecasts
2. **Given** an EBNF-compliant broadcast, **When** compared to the grammar file, **Then** all segments match their corresponding production rules
3. **Given** multiple broadcasts are generated, **When** analyzed for structure, **Then** 100% follow the complete EBNF format
4. **Given** 50 broadcasts are generated, **When** introduction variants are analyzed, **Then** at least 20 different variants are used, including both standard Met Office format and surreal variations (preserving uncanny features)

---

### User Story 1a - Experience Continuous Looping Broadcast (Priority: P1)

As a listener, I want the broadcast to loop continuously after completing all 31 areas, restarting from gale warnings with newly randomized content, so that I can experience an infinite, never-repeating shipping forecast stream.

**Why this priority**: Continuous looping is essential for the "infinite" nature of the art piece. The introduction plays once to establish context, then the forecast loops endlessly with fresh randomized content, creating a hypnotic, meditative experience that mimics real BBC Radio 4 broadcast patterns.

**Independent Test**: Can be tested by starting playback and verifying that after 31 area forecasts complete, the system generates new gale warnings, general synopsis, time period, and area forecasts without repeating the introduction.

**Acceptance Scenarios**:

1. **Given** playback has started, **When** the first broadcast completes 31 area forecasts, **Then** a new gale warnings segment begins immediately with different content (no introduction)
2. **Given** playback is looping, **When** each loop iteration completes, **Then** all content is regenerated with new random values (wind directions, precipitation, pressure systems, etc.)
3. **Given** playback has looped 5 times, **When** broadcast structure is analyzed, **Then** introduction only appeared once at the start, and each loop contains Gale Warnings → General Synopsis → Time Period → 31 Areas
4. **Given** continuous playback for 10 minutes, **When** timestamps in gale warnings are examined, **Then** they update to reflect current time with each loop iteration
5. **Given** playback is looping, **When** transitioning between loop iterations, **Then** audio continues seamlessly without gaps, silence, or jarring transitions

---

### User Story 2 - Understand Pressure Systems via General Synopsis (Priority: P1)

As a listener, I want to hear the general synopsis describing pressure systems and their movement, so that I can understand the larger weather pattern affecting the shipping areas.

**Why this priority**: The general synopsis is a critical safety feature in real shipping forecasts that provides context for area-specific conditions. It describes high/low pressure systems, their current location, movement, and expected future position - essential information for mariners planning longer journeys.

**Independent Test**: Can be tested by generating broadcasts and verifying the general synopsis segment appears after gale warnings with pressure description, current location, optional pressure change, and expected future location.

**Acceptance Scenarios**:

1. **Given** a broadcast is being generated, **When** the general synopsis segment plays, **Then** it includes pressure description (High/Medium/Low), current location (compass direction + area + pressure value), and expected future location with time
2. **Given** a general synopsis includes pressure change, **When** it plays, **Then** it specifies deepening/clearing with rate (more slowly/slowly/quickly/very rapidly)
3. **Given** 50 broadcasts are generated, **When** synopsis segments are analyzed, **Then** pressure values are realistic (900-1099), directions use all compass points, and time references are properly formatted
4. **Given** a general synopsis example, **When** validated against EBNF, **Then** it matches production rules at lines 33-38 (e.g., "Low north of Viking 998, deepening slowly, expected west of Faeroes 992 by 18:00 tomorrow")

---

### User Story 3 - Receive Detailed Maritime Safety Information (Priority: P1)

As a listener, I want area forecasts to include precipitation type and modifiers (Thundery showers, Heavy rain, Wintry snow) plus optional icing conditions, so that I receive comprehensive safety-critical weather information following EBNF specification.

**Why this priority**: Precipitation and icing are critical safety information for maritime operations. Thunderstorms, heavy precipitation, and icing conditions pose serious hazards that mariners must know about. This aligns the system with EBNF specification and real BBC forecast structure.

**Independent Test**: Can be tested by generating area forecasts and verifying each includes wind + precipitation + visibility + optional icing (10% probability) matching EBNF production rules at lines 61-63.

**Acceptance Scenarios**:

1. **Given** an area forecast is being generated, **When** it plays, **Then** it includes wind (with Beaufort scale text like "gale 8", "severe gale 9"), precipitation (modifier + type), visibility, and optional icing
2. **Given** 100 area forecasts are generated, **When** precipitation is analyzed, **Then** all 6 modifiers (Thundery, Wintry, Squally, Occasionally, Heavy, Light) and 3 types (showers, rain, snow) appear across the dataset
3. **Given** icing conditions are generated, **When** they appear, **Then** they use "Moderate icing" or "Severe icing" format and appear approximately 10% of the time
4. **Given** wind strength is 8 or greater, **When** formatted, **Then** it uses Beaufort scale text: "gale 8", "severe gale 9", "storm 10", "violent storm 11", or "hurricane force 12" (not just numbers)

---

### Edge Cases

- When system time is near midnight UTC, the introduction must correctly format date transitions (e.g., "23:55 on Monday" vs "00:05 on Tuesday")
- When wind force is exactly 8, it must be formatted as "gale 8" not just "8" (Beaufort scale text requirement)
- When wind force is compound spanning gale threshold (e.g., "7 to gale 8"), mixed format is allowed with each value using its appropriate Beaufort format (integer for 0-7, text for 8+)
- When wind force is compound within same category (e.g., "5 to 7" or "gale 8 or 9"), both use same format type
- When precipitation modifier is "Occasionally" and type is plural "showers", grammatically this becomes "Occasionally showers" which is correct per EBNF
- When icing conditions appear, they must only use "Moderate" or "Severe" severity (no other levels)
- When pressure values are generated, they must be realistic (900-1099 range) and future pressure should reflect deepening/clearing direction with appropriate magnitude (4-12mb change scaled by rate descriptor)
- When pressure deepens "slowly", future pressure must be 4-6mb lower than current; "quickly" = 8-10mb lower; "very rapidly" = 10-12mb lower
- When pressure clears, the same magnitude changes apply but pressure increases instead of decreases
- When general synopsis includes "tomorrow", the time must be realistic (not "25:00" or similar invalid times)
- When introduction variants include surreal elements (alternative authorities, temporal ambiguities), they must maintain believable vocal delivery without breaking the hypnotic trance
- When gale warnings list areas, they must use standard comma-separated format with "and" before final area (per EBNF lines 22-23)
- When 16+ areas have gales, the inverse format must list non-gale areas (which could be zero if all areas have gales - handle gracefully)
- When phantom areas (The Void, Silence, etc.) are included, they should work within EBNF structure but may violate standard area list
- When visibility uses compound forms ("Good, occasionally poor"), the capitalization must follow EBNF rules (initial capitalized, subsequent lowercase)
- When broadcast loop restarts after 31 areas, introduction must NOT replay (only gale warnings onward)
- When loop iteration generates new content, all randomized elements (wind, precipitation, pressure systems, timestamps) must differ from previous iteration
- When transitioning between loop iterations, audio playback must continue seamlessly without silence gaps exceeding 500ms

## Requirements *(mandatory)*

### Functional Requirements

**EBNF Grammar Compliance**

- **FR-001**: System MUST structure all broadcasts according to EBNF grammar at src/shipping-forecast.ebnf (lines 65: forecast = introduction + gale_warnings + general_synopsis + area_forecasts)
- **FR-002**: System MUST validate generated forecasts against EBNF production rules to ensure structural correctness
- **FR-003**: System MUST follow EBNF formatting rules for all text elements (capitalization, punctuation, word order)

**Introduction Requirements (EBNF lines 19-20)**

- **FR-004**: System MUST begin every broadcast with introduction matching EBNF format: "And now the Shipping Forecast, issued by the Met Office on behalf of the Maritime and Coastguard Agency at [time] today"
- **FR-005**: System MUST generate timestamps in HH:MM format (EBNF line 7: hour 00-23, minute 00-59)
- **FR-006**: System MUST support 20+ introduction variants including surreal alternatives (e.g., "Department of Quiet Waters") while maintaining EBNF structure EXCEPTION: Uncanny feature
- **FR-007**: System MUST randomize introduction variant selection to prevent repetition across consecutive broadcasts

**Gale Warning Requirements (EBNF lines 25-26)**

- **FR-008**: System MUST generate gale warnings segment when any area has wind force 8 or greater
- **FR-009**: System MUST format gale warnings as "There are warnings of gales in [area_list]" (standard format) per EBNF line 25
- **FR-010**: System MUST format gale warnings as "There are warnings of gales in all areas except [area_list]" (inverse format) per EBNF line 26
- **FR-011**: System MUST use standard format when fewer than 16 areas have gales, inverse format when 16+ areas have gales
- **FR-012**: System MUST format area lists per EBNF lines 22-23: single area, "area1 and area2", or "area1, area2, and area3" with proper comma placement
- **FR-013**: System MUST omit gale warnings segment entirely when no areas have force 8+ winds

**General Synopsis Requirements (EBNF lines 33-38) - NEW FEATURE**

- **FR-014**: System MUST include general synopsis section after gale warnings and before area forecasts
- **FR-015**: System MUST begin general synopsis with "The general synopsis:" followed by double newline per EBNF line 38
- **FR-016**: System MUST include pressure description (High/Medium/Low) per EBNF line 30
- **FR-017**: System MUST format current pressure location as "[compass_direction] of [area] [pressure]" where pressure is 900-1099 per EBNF lines 29, 33
- **FR-018**: System MUST include pressure change clause: "[deepening|clearing] [rate_of_change]" in 50% of general synopsis segments per EBNF lines 28, 31, 35
- **FR-018a**: When pressure change shows "deepening", system MUST decrease future pressure by 4-12 millibars from current pressure, scaled by rate: slowly (4-6mb), quickly (8-10mb), very rapidly (10-12mb)
- **FR-018b**: When pressure change shows "clearing", system MUST increase future pressure by 4-12 millibars from current pressure, scaled by rate: slowly (4-6mb), quickly (8-10mb), very rapidly (10-12mb)
- **FR-018c**: Rate "more slowly" MUST use 3-5 millibar change (slower than "slowly")
- **FR-019**: System MUST include expected future location: "expected [compass_direction] of [area] [pressure] by [future_time]" per EBNF line 36
- **FR-020**: System MUST format future times as HH:MM with optional " tomorrow" suffix per EBNF line 8

**Area Forecast Requirements (EBNF lines 61-63)**

- **FR-021**: System MUST format each area forecast as: "[area_list]. [wind]. [precipitation]. [visibility]." with optional " [icing]." per EBNF line 61-62
- **FR-022**: System MUST introduce area forecasts with time period announcement EXCEPTION: Uncanny feature - allows variants while EBNF line 63 specifies fixed text
- **FR-022a**: System MUST support 10+ time period variants (e.g., "The area forecasts for the next 24 hours", "And now the area forecasts for the next 24 hours", "The forecasts for the next 24 hours", "Area forecasts valid for 24 hours") EXCEPTION: Uncanny feature
- **FR-022b**: System MUST randomize time period variant selection to prevent repetition across consecutive broadcasts EXCEPTION: Uncanny feature
- **FR-022c**: All time period variants MUST indicate 24-hour forecast duration EXCEPTION: Uncanny feature

**Wind Requirements (EBNF lines 45-50)**

- **FR-023**: System MUST format wind as "[compass_direction_caps] [wind_strength]" per EBNF line 47
- **FR-024**: System MUST use Beaufort scale text for forces 8-12: "gale 8", "severe gale 9", "storm 10", "violent storm 11", "hurricane force 12" per EBNF line 45
- **FR-025**: System MUST use integers (0-7) for wind forces below gale strength per EBNF line 45
- **FR-026**: System MUST support compound wind forces with " to " or " or " connectors (e.g., "5 to 7", "gale 8 or 9") per EBNF line 47
- **FR-026a**: System MUST allow mixed format for compound wind forces spanning gale threshold (e.g., "7 to gale 8", "6 or gale 8") where each value uses its appropriate format per Beaufort scale rules
- **FR-027**: System MUST capitalize initial wind direction (North, South, East, West, etc.) per EBNF line 11

**Precipitation Requirements (EBNF lines 40-42) - NEW FEATURE**

- **FR-028**: System MUST generate precipitation as "[modifier] [type]" per EBNF line 42
- **FR-029**: System MUST use one of 6 modifiers: Thundery, Wintry, Squally, Occasionally, Heavy, Light per EBNF line 40
- **FR-030**: System MUST use one of 3 types: showers, rain, snow per EBNF line 41
- **FR-031**: System MUST generate all 18 possible combinations (6 modifiers × 3 types) across large sample sets

**Visibility Requirements (EBNF lines 52-57)**

- **FR-032**: System MUST use initial visibility capitalized: Good, Moderate, Poor, Very poor per EBNF line 52
- **FR-033**: System MUST support compound visibility with patterns: "[initial] or [subsequent]", "[initial], occasionally [subsequent]", "[initial], becoming [subsequent] later" per EBNF lines 54-57
- **FR-034**: System MUST use lowercase for subsequent visibility values per EBNF line 53

**Icing Requirements (EBNF line 59) - NEW FEATURE**

- **FR-035**: System MUST optionally append icing conditions to area forecasts (approximately 10% probability)
- **FR-036**: System MUST format icing as "[Moderate|Severe] icing" per EBNF line 59
- **FR-037**: System MUST place icing at end of area forecast after visibility when present per EBNF line 62

**Uncanny Features (EXCEPTION to EBNF)**

- **FR-038**: System MUST preserve phantom areas (The Void, Silence, Elder Bank, etc.) as 2% probability additions to standard area list
- **FR-039**: System MUST preserve surreal introduction variants (alternative authorities, temporal ambiguities) alongside standard format
- **FR-040**: System MUST maintain prosody variations for phantom areas (pitch contours, slower rates) within EBNF text structure
- **FR-041a**: System MUST support time period announcement variants (10+) as uncanny feature enhancing variety EXCEPTION: EBNF line 63 specifies fixed format

**Overall Structure Requirements**

- **FR-041**: System MUST structure broadcasts in order: Introduction → Gale Warnings (if applicable) → General Synopsis → Time Period → Area Forecasts per EBNF line 65
- **FR-042**: System MUST maintain BBC Radio 4 prosody and cadence across all broadcast segments
- **FR-043**: System MUST apply appropriate pause timings between broadcast segments per SSML requirements
- **FR-044**: System MUST ensure all broadcast segments synthesize as single continuous SSML document for natural flow

**Continuous Playback Loop Requirements**

- **FR-045**: System MUST loop continuously after completing all 31 area forecasts
- **FR-046**: System MUST restart loop at Gale Warnings segment (skipping Introduction)
- **FR-047**: System MUST regenerate all broadcast content with new randomized values on each loop iteration
- **FR-048**: System MUST maintain seamless audio continuity between loop iterations without gaps or jarring transitions
- **FR-049**: Each loop iteration MUST include: Gale Warnings (if applicable) → General Synopsis → Time Period → 31 Area Forecasts, then repeat
- **FR-050**: Introduction MUST only play once at the start of playback session, not on subsequent loop iterations

### Key Entities

- **Broadcast**: Complete audio sequence following EBNF production rule at line 65: Introduction → Gale Warnings (conditional) → General Synopsis → Area Forecasts, generated as single SSML synthesis request
- **Introduction Segment**: Opening announcement following EBNF lines 19-20, with 20+ variants including standard ("Met Office on behalf of the Maritime and Coastguard Agency") and surreal alternatives ("Department of Quiet Waters", "Office of Forgotten Waters") - UNCANNY EXCEPTION to strict EBNF
- **Gale Warning Segment**: Announcement listing areas with wind force 8+ per EBNF lines 25-26. Uses standard format ("There are warnings of gales in [area_list]") when <16 areas affected, inverse format ("...in all areas except [area_list]") when 16+ areas. Omitted if no gales.
- **General Synopsis**: NEW FEATURE per EBNF lines 33-38. Describes pressure system (High/Medium/Low), current location (direction + area + pressure 900-1099), optional change (deepening/clearing + rate), expected future location with time.
- **Area Forecast**: Per EBNF lines 61-63, consists of area list + wind (Beaufort scale) + precipitation (modifier + type) + visibility (with optional patterns) + optional icing (Moderate/Severe).
- **Precipitation**: NEW FEATURE per EBNF lines 40-42. Structured as modifier (Thundery/Wintry/Squally/Occasionally/Heavy/Light) + type (showers/rain/snow). Replaces generic weather descriptions.
- **Icing**: NEW FEATURE per EBNF line 59. Optional maritime safety warning appearing in ~10% of area forecasts, formatted as "Moderate icing" or "Severe icing".
- **Wind**: Per EBNF lines 45-50, formatted with capitalized direction + Beaufort scale text for 8+ ("gale 8", "severe gale 9", "storm 10", "violent storm 11", "hurricane force 12") or integer for 0-7.
- **Phantom Areas**: UNCANNY EXCEPTION to EBNF. Non-standard areas (The Void, Silence, Elder Bank, Mirror Reach, The Marrow, Still Water, Obsidian Deep) with 2% probability, maintain surreal atmosphere

## Success Criteria *(mandatory)*

### Measurable Outcomes

**EBNF Compliance**

- **SC-001**: 100% of generated broadcasts match EBNF grammar structure when validated against src/shipping-forecast.ebnf
- **SC-002**: All text formatting (capitalization, punctuation, word order) follows EBNF production rules in 100% of cases
- **SC-003**: Broadcast structure follows correct EBNF order (Introduction → Gale Warnings → General Synopsis → Area Forecasts) in 100% of cases

**Introduction (EBNF lines 19-20)**

- **SC-004**: 100% of broadcasts begin with introduction containing issuing authority and timestamp in HH:MM format
- **SC-005**: At least 20 distinct introduction variants exist including both standard and surreal alternatives
- **SC-006**: No introduction variant appears more than 10% of the time across 100 broadcasts

**Gale Warnings (EBNF lines 25-26)**

- **SC-007**: Gale warnings use standard format when <16 areas affected and inverse format when 16+ areas in 100% of cases
- **SC-008**: Area lists use proper grammar per EBNF lines 22-23 (commas, "and") in 100% of cases
- **SC-009**: Gale warnings segment is correctly omitted in 100% of broadcasts with no force 8+ winds

**General Synopsis (EBNF lines 33-38) - NEW**

- **SC-010**: 100% of broadcasts include general synopsis section with all required elements (pressure description, current location with pressure value, expected future location with time)
- **SC-011**: Pressure values are realistic (900-1099) in 100% of synopses
- **SC-011a**: When pressure change is specified, future pressure differs from current by 3-12 millibars in correct direction (decrease for deepening, increase for clearing)
- **SC-011b**: Pressure change magnitude correlates with rate descriptor: "more slowly" (3-5mb), "slowly" (4-6mb), "quickly" (8-10mb), "very rapidly" (10-12mb)
- **SC-012**: Pressure change is included in 50% of general synopsis segments (48-52% acceptable range across 100 broadcasts) and uses correct format "[deepening|clearing] [rate]" per EBNF lines 31-32, 28
- **SC-013**: Future times use HH:MM format with optional "tomorrow" suffix in 100% of cases

**Area Forecasts (EBNF lines 61-63)**

- **SC-014**: 100% of area forecasts include wind + precipitation + visibility in correct order per EBNF line 61
- **SC-015**: At least 10 distinct time period announcement variants exist (UNCANNY EXCEPTION to EBNF line 63)
- **SC-015a**: No time period variant appears more than 15% of the time across 100 broadcasts (validates randomization)
- **SC-015b**: All time period variants clearly indicate 24-hour forecast duration in 100% of cases

**Wind (EBNF lines 45-50)**

- **SC-016**: Wind forces 8-12 use Beaufort scale text ("gale 8", "severe gale 9", etc.) in 100% of cases
- **SC-017**: Wind forces 0-7 use integers in 100% of cases
- **SC-017a**: Compound wind forces spanning gale threshold use mixed format (e.g., "7 to gale 8") in 100% of cases
- **SC-018**: Initial wind direction is capitalized (North, South, East, West) in 100% of cases per EBNF line 11

**Precipitation (EBNF lines 40-42) - NEW**

- **SC-019**: 100% of area forecasts include precipitation formatted as "[modifier] [type]"
- **SC-020**: Across 100 forecasts, all 6 modifiers (Thundery, Wintry, Squally, Occasionally, Heavy, Light) appear at least once
- **SC-021**: Across 100 forecasts, all 3 types (showers, rain, snow) appear at least 10 times each
- **SC-022**: All precipitation combinations are grammatically correct and match EBNF line 42 format

**Visibility (EBNF lines 52-57)**

- **SC-023**: Initial visibility is capitalized (Good, Moderate, Poor, Very poor) in 100% of cases
- **SC-024**: Compound visibility patterns use lowercase for subsequent values in 100% of cases
- **SC-025**: Visibility patterns ("or", "occasionally", "becoming later") follow EBNF lines 54-57 format

**Icing (EBNF line 59) - NEW**

- **SC-026**: Icing conditions appear in approximately 10% of area forecasts (8-12% acceptable range across 100 forecasts)
- **SC-027**: When icing appears, it uses only "Moderate icing" or "Severe icing" format in 100% of cases
- **SC-028**: Icing appears at end of area forecast after visibility in 100% of cases per EBNF line 62

**Uncanny Features (EXCEPTION)**

- **SC-029**: Phantom areas appear with ~2% probability across area forecasts (1-3% acceptable)
- **SC-030**: Surreal introduction variants maintain believability (80%+ listener feedback rating as "unsettling but plausible")
- **SC-031**: Phantom areas maintain distinct prosody (pitch contours, timing) while following EBNF text structure
- **SC-032a**: Time period announcement variants provide natural variety and don't disrupt broadcast flow (validated by listener continuity perception tests)

**Continuous Looping**

- **SC-034**: After completing 31 area forecasts, system begins new loop within 2 seconds starting at gale warnings
- **SC-035**: Introduction appears exactly once at playback start across any number of loop iterations
- **SC-036**: Each loop iteration generates fresh randomized content (0% exact duplication of previous loop)
- **SC-037**: Across 5 consecutive loop iterations, gale warnings, general synopsis, time period announcements, and area forecast content all differ measurably
- **SC-038**: Audio transitions between loop iterations are seamless with no gaps exceeding 500ms
- **SC-039**: Timestamps in subsequent loop iterations update to reflect current time

**Overall Quality**

- **SC-040**: All broadcast segments maintain BBC Radio 4 cadence (85% speaking rate) as verified by audio analysis
- **SC-041**: Generated forecasts are indistinguishable from real BBC Radio 4 shipping forecasts in blind listener tests (70%+ accuracy threshold)

## Example Output

### EBNF-Compliant Broadcast Example

```
And now the Shipping Forecast, issued by the Met Office on behalf of the Maritime and Coastguard Agency at 14:23 today.

There are warnings of gales in Viking, Forties, and Fisher.

The general synopsis:

Low north of Viking 998, deepening slowly, expected west of Faeroes 992 by 18:00 tomorrow.

The area forecasts for the next 24 hours:

Viking and Dogger. Southwest gale 8 to 9. Thundery showers. Good, occasionally poor. Moderate icing.

Forties. West 5 or 6. Heavy rain. Moderate, becoming poor later.

Fisher and German Bight. Northeast 7. Wintry snow. Very poor.

Cromarty. Southeast gale 8. Squally showers. Good or moderate. Severe icing.

Forth. Cyclonic 4. Light rain. Good.
```

### EBNF-Compliant Broadcast with Surreal Introduction (Uncanny Variant)

```
And now the shipping forecast, issued by the Department of Quiet Waters at twenty-one hundred on Tuesday the second of February.

The general synopsis:

High south of Shannon 1024, clearing very rapidly, expected north of Hebrides 1031 by 06:00 tomorrow.

The area forecasts for the next 24 hours:

The Void. North 3. Occasionally snow. Poor, becoming very poor.

Plymouth and Biscay. Southwest 6 to 7. Wintry showers. Moderate.

Rockall. West storm 10. Heavy rain. Very poor. Moderate icing.
```

### Continuous Looping Example

**First Playback (includes Introduction)**:
```
And now the Shipping Forecast, issued by the Met Office on behalf of the Maritime and Coastguard Agency at 14:23 today.

There are warnings of gales in Viking, Forties, and Fisher.

The general synopsis:

Low north of Viking 998, deepening slowly, expected west of Faeroes 992 by 18:00 tomorrow.

The area forecasts for the next 24 hours:

[31 area forecasts...]

Sole. Southwest 4. Heavy rain. Good.
```

**Loop Iteration 2 (Introduction skipped, new content)**:
```
There are warnings of gales in Dogger, German Bight, and Humber.

The general synopsis:

High south of Shannon 1026, clearing quickly, expected north of Hebrides 1032 by 20:15 tomorrow.

And now the area forecasts for the next 24 hours:

[31 NEW area forecasts with different wind/precipitation/visibility...]

Sole. North 7. Wintry showers. Moderate, becoming poor later.
```

**Loop Iteration 3 continues immediately with fresh randomized content...**

### Key Differences from Previous Version

**ADDED (New EBNF Features)**:
- General synopsis section with pressure systems (e.g., "Low north of Viking 998, deepening slowly...")
- Structured precipitation with modifiers (Thundery showers, Heavy rain, Wintry snow) instead of generic weather
- Icing conditions (Moderate/Severe icing) appearing ~10% of the time
- Beaufort scale text for gale forces ("gale 8", "storm 10" instead of just "8", "10")
- Compound visibility patterns ("Good, occasionally poor", "Moderate, becoming poor later")

**PRESERVED (Uncanny Features)**:
- 20+ introduction variants including surreal alternatives (Department of Quiet Waters, etc.)
- Phantom areas (The Void, Silence, Elder Bank, etc.) with 2% probability
- Alternative authorities and temporal ambiguities in surreal variants
- Distinct prosody for phantom areas
- 10+ time period announcement variants (EXCEPTION to EBNF line 63 fixed format)

**REMOVED/REPLACED**:
- Generic weather descriptions ("Rain", "Fair") → Replaced with structured precipitation (modifier + type)
- Sea state descriptions (Calm, Smooth, Slight, Moderate, Rough, Very rough, High, Very high) → Removed entirely for strict EBNF compliance
- Integer-only wind forces for gales → Must use Beaufort scale text

## Assumptions

- EBNF grammar at src/shipping-forecast.ebnf is complete, correct, and represents target specification for broadcast structure
- Current SSML template builder can be extended to support EBNF-compliant multi-segment structure including new general synopsis
- System can generate realistic pressure values (900-1099) with appropriate deepening/clearing rates (4-12mb change) scaled by rate descriptor (more slowly=3-5mb, slowly=4-6mb, quickly=8-10mb, very rapidly=10-12mb)
- Precipitation modifiers + types (18 combinations) provide sufficient variety for maritime weather descriptions
- Icing probability of ~10% reflects realistic maritime conditions for UK waters
- Beaufort scale text formatting for forces 8-12 is more authentic than using integers
- Mixed format for compound winds spanning gale threshold (e.g., "7 to gale 8") is acceptable and follows Beaufort scale rules where each value uses its appropriate format
- Phantom areas (2% probability) can coexist with EBNF structure without breaking grammar validation
- Surreal introduction variants can maintain EBNF line 19-20 structure while substituting alternative authorities
- Google Cloud TTS (en-GB-Neural2-B voice) can pronounce all EBNF vocabulary naturally (pressure descriptions, precipitation modifiers, icing conditions)
- EBNF compound visibility patterns ("or", "occasionally", "becoming") provide more authentic variety than single-word visibility
- 20+ introduction variants balance EBNF compliance with uncanny surrealism without confusing listeners
- Time period announcement variants (10+) provide variety while maintaining clear 24-hour duration indication (UNCANNY EXCEPTION to EBNF line 63)
- System has access to current UTC time for HH:MM timestamp generation and future time calculations
- All EBNF text elements (with exceptions for phantom areas and surreal intros) follow standard BBC Radio 4 shipping forecast conventions
- Validation against EBNF grammar can be automated to ensure 100% compliance during generation
- General synopsis segment provides sufficient maritime context without requiring detailed meteorological calculations
- Sea state descriptions (Calm, Smooth, Slight, Moderate, Rough, Very rough, High, Very high) are excluded to maintain strict EBNF compliance as they are not part of the EBNF grammar specification
- Continuous looping creates infinite playback by regenerating broadcasts after each 31-area cycle completes
- Introduction plays only once per playback session (not per loop iteration) to establish context without becoming repetitive
- Seamless audio transitions between loop iterations maintain hypnotic listening experience
- Timestamp updates in subsequent loops reflect passage of time and maintain realism
- Loop structure (Gale Warnings → General Synopsis → Time Period → 31 Areas, repeat) creates natural broadcast rhythm without requiring manual restart
