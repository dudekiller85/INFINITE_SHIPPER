# Quickstart: Broadcast Structure

**Feature**: 003-broadcast-structure
**Date**: 2026-02-02

## Overview

This guide shows how to generate and play complete shipping forecast broadcasts with introduction, gale warnings, time period transitions, and area forecasts.

---

## Basic Usage

### Generate a Complete Broadcast

```javascript
import { BroadcastGenerator } from './src/core/broadcast-generator.js';
import { SSMLTemplateBuilder } from './src/audio/ssml-template-builder.js';
import { GoogleCloudTTSAdapter } from './src/audio/tts-service-adapter.js';

// 1. Create broadcast generator
const broadcastGen = new BroadcastGenerator();

// 2. Generate complete broadcast (includes area forecasts)
const broadcast = broadcastGen.generateBroadcast();

// 3. Build SSML
const builder = new SSMLTemplateBuilder();
const ssmlTemplate = builder.buildBroadcast(broadcast);

// 4. Synthesize audio
const tts = new GoogleCloudTTSAdapter();
const audio = await tts.synthesize(ssmlTemplate);

// 5. Play
const audioContext = new AudioContext();
const source = audioContext.createBufferSource();
source.buffer = audio.audioBuffer;
source.connect(audioContext.destination);
source.start();
```

---

## Broadcast Structure

Every broadcast follows this order:

```
1. Introduction (always present)
   ↓ [1500ms pause]
2. Gale Warnings (conditional - only if force 8+ winds exist)
   ↓ [1000ms pause]
3. Time Period Transition (always present)
   ↓ [800ms pause]
4. Area Forecasts (existing system)
```

---

## Introduction Variants

The system randomly selects from 20+ introduction variants:

**Standard Format** (~60% frequency):
```
"And now the shipping forecast, issued by the Met Office on behalf
of the Maritime and Coastguard Agency at {time} {date}"
```

**Surreal Variants** (~40% frequency):
```
"And now the shipping forecast, issued by the Department of Quiet Waters
at a time that may have passed on a day known to the tides"
```

**Timestamp Format** (BBC Radio 4 style):
- 05:30 → "zero five thirty"
- 14:00 → "fourteen hundred"
- 21:45 → "twenty-one forty-five"

**Date Format**:
- "on Tuesday the second of February"
- "on Monday the thirty-first of January"

---

## Gale Warnings

Automatically included when any area has wind force 8 or higher.

**Standard Format**:
```
"Gale warnings. {area}, {direction} gale force {force}"
```

Example:
```
"Gale warnings. Viking, southwesterly gale force 8.
Forties, westerly gale force 9."
```

**Inverse Format** (alternative):
```
"Gale warnings. {direction} gale force {force} in {area}"
```

Example:
```
"Gale warnings. Southwesterly gale force 8 in Viking.
Westerly gale force 9 in Forties."
```

**Ordering**: Gales are listed in geographic order (north to south) following the standard shipping area sequence.

---

## Time Period Variants

The system randomly selects from 10+ time period variants:

**Duration-Based** (40% frequency):
- "for the next 24 hours"
- "for the next 48 hours"
- "issued for the next 6 hours"

**Endpoint-Based** (30% frequency):
- "valid until 0600 tomorrow"
- "until midnight tonight"
- "for the period ending 1800 hours"

**Descriptive** (15% frequency):
- "through Tuesday evening"
- "valid through the overnight period"
- "through the early hours of Wednesday"

**Maritime-Specific** (10% frequency):
- "through the next two tidal periods"

**Other** (5% frequency):
- "until further notice"
- "until the next scheduled update"

---

## Testing

### Browser Testing

Open `test-natural-speech.html` in browser:

1. **Generate Full Broadcast** button - Plays complete broadcast with all segments
2. **Console Output** - Shows selected variant IDs and segment structure
3. **Audio Playback** - Listen for proper pause timings between segments

### Manual Verification

**Check Introduction**:
- Timestamp matches current time (within 1 minute)
- Date is correctly formatted
- 1500ms pause after introduction (use audio editor)

**Check Gale Warnings** (when present):
- Only appears if force 8+ winds exist
- Areas listed in geographic order (north to south)
- 1000ms pause after gale warnings

**Check Time Period**:
- Phrase is appropriate and varied across multiple generations
- 800ms pause after time period

**Check Overall Flow**:
- BBC Radio 4 cadence maintained (85% speaking rate)
- No robotic artifacts or unnatural joins
- Segments flow naturally despite being single SSML synthesis

---

## Variant Distribution Testing

Generate 50+ broadcasts and verify:

```javascript
const variantCounts = {
  introduction: {},
  galeWarning: {},
  timePeriod: {}
};

for (let i = 0; i < 100; i++) {
  const broadcast = broadcastGen.generateBroadcast();

  // Track introduction variants
  const introId = broadcast.introduction.variantId;
  variantCounts.introduction[introId] = (variantCounts.introduction[introId] || 0) + 1;

  // Track gale warning variants (if present)
  if (broadcast.galeWarnings) {
    const galeId = broadcast.galeWarnings.variantId;
    variantCounts.galeWarning[galeId] = (variantCounts.galeWarning[galeId] || 0) + 1;
  }

  // Track time period variants
  const tpId = broadcast.timePeriod.variantId;
  variantCounts.timePeriod[tpId] = (variantCounts.timePeriod[tpId] || 0) + 1;
}

console.log('Variant Distribution:', variantCounts);
```

**Expected Results**:
- Introduction: 20+ different variants used
- No single variant appears >10% of time (validates randomization)
- Surreal variants appear ~40% of time
- Time period: 10+ different variants used

---

## Character Count Monitoring

Google Cloud TTS has 5,000 character limit for SSML:

```javascript
const broadcast = broadcastGen.generateBroadcast();
const ssmlTemplate = builder.buildBroadcast(broadcast);

console.log(`Character count: ${ssmlTemplate.characterCount}`);

if (ssmlTemplate.characterCount > 5000) {
  console.warn('⚠️  Broadcast exceeds Google Cloud TTS 5000 character limit');
  // Future: implement chunking strategy
}
```

**Typical Character Counts**:
- Introduction: 200-300 chars
- Gale warnings: 50-100 chars per gale
- Time period: 50-100 chars
- Area forecasts: 150-200 chars per area × 31 areas = 4,650-6,200 chars
- **Total**: 5,000-7,100 chars for full 31-area broadcast

**Note**: Full broadcasts may exceed limit. Initial implementation accepts this (manual testing only). Future: implement chunked synthesis for long broadcasts.

---

## Debugging

### Enable Detailed Logging

```javascript
const tts = new GoogleCloudTTSAdapter({
  logRequests: true  // Enables detailed TTS logging
});
```

### Inspect Broadcast Structure

```javascript
const broadcast = broadcastGen.generateBroadcast();

console.log('Broadcast Structure:');
console.log('  Introduction:', broadcast.introduction.variantId);
console.log('  Gale Warnings:', broadcast.galeWarnings ?
  `${broadcast.galeWarnings.gales.length} gales (${broadcast.galeWarnings.variantId})` :
  'None');
console.log('  Time Period:', broadcast.timePeriod.variantId);
console.log('  Area Forecasts:', broadcast.areaForecasts.length, 'areas');
console.log('  Character Count:', broadcast.characterCount);
```

### Inspect Generated SSML

```javascript
const ssmlTemplate = builder.buildBroadcast(broadcast);
console.log('Generated SSML:', ssmlTemplate.ssml);

// Check for proper structure
const hasSpeakTag = ssmlTemplate.ssml.startsWith('<speak>');
const hasProsodyTag = ssmlTemplate.ssml.includes('<prosody rate="85%">');
const hasBreaks = ssmlTemplate.ssml.includes('<break time=');

console.log('SSML Validation:');
console.log('  <speak> tag:', hasSpeakTag ? '✅' : '❌');
console.log('  Prosody control:', hasProsodyTag ? '✅' : '❌');
console.log('  Break tags:', hasBreaks ? '✅' : '❌');
```

---

## Common Issues

### Issue: No gale warnings when expected

**Cause**: Wind force is 7 or lower
**Solution**: Gale threshold is force 8+. Check `windForce` values:

```javascript
broadcast.areaForecasts.forEach(area => {
  const force = Array.isArray(area.wind.force) ?
    Math.max(...area.wind.force) :
    area.wind.force;

  if (force >= 8) {
    console.log(`Gale in ${area.area.name}: force ${force}`);
  }
});
```

### Issue: Timestamp is incorrect

**Cause**: Broadcast uses generation time, not playback time
**Solution**: Generate broadcast immediately before playing:

```javascript
// ❌ Bad: Generate once, play multiple times
const broadcast = broadcastGen.generateBroadcast();
// ... 10 minutes later ...
await playBroadcast(broadcast);  // Timestamp is now 10 minutes old

// ✅ Good: Generate fresh broadcast for each play
async function playFreshBroadcast() {
  const broadcast = broadcastGen.generateBroadcast();
  await playBroadcast(broadcast);
}
```

### Issue: Character count exceeds 5000

**Cause**: Too many area forecasts in single broadcast
**Solution**: Currently expected for full 31-area broadcasts. Future feature will implement chunking. For testing, manually limit areas:

```javascript
// Generate fewer areas for testing
const areaForecasts = broadcastGen.generateAreaForecasts(20);  // Instead of 31
const broadcast = broadcastGen.generateBroadcast(areaForecasts);
```

### Issue: Surreal variants never appear

**Cause**: Random selection may skip surreal variants in small sample sizes
**Solution**: Generate 50+ broadcasts to see variant distribution:

```javascript
const surrealCount = Array.from({ length: 100 }).filter(() => {
  const broadcast = broadcastGen.generateBroadcast();
  return broadcast.introduction.isSurreal;
}).length;

console.log(`Surreal variants: ${surrealCount}/100 (target: ~40%)`);
```

---

## Next Steps

- **Phase 2 Implementation**: See plan.md for implementation phases
- **Task Breakdown**: Run `/speckit.tasks` to generate detailed implementation tasks
- **Manual Testing**: Use test-natural-speech.html for all validation (per constitution)

---

## Reference

- **Specification**: [spec.md](./spec.md)
- **Implementation Plan**: [plan.md](./plan.md)
- **Research**: [research.md](./research.md)
- **Data Model**: [data-model.md](./data-model.md)
- **API Contract**: [contracts/ssml-structure.json](./contracts/ssml-structure.json)
