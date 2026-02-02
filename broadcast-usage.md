# Broadcast Structure Usage Guide

Quick reference for the complete broadcast structure feature (003-broadcast-structure).

## Quick Start

```javascript
import { BroadcastGenerator } from './src/core/broadcast-generator.js';
import { SSMLTemplateBuilder } from './src/audio/ssml-template-builder.js';
import { GoogleCloudTTSAdapter } from './src/audio/tts-service-adapter.js';

// 1. Generate broadcast
const broadcastGen = new BroadcastGenerator();
const broadcast = broadcastGen.generateBroadcast(); // 31 areas by default

// 2. Build SSML
const builder = new SSMLTemplateBuilder();
const template = builder.buildBroadcast(broadcast);

// 3. Synthesize & play
const tts = new GoogleCloudTTSAdapter();
const audio = await tts.synthesize(template);

const audioContext = new AudioContext();
const source = audioContext.createBufferSource();
source.buffer = audio.audioBuffer;
source.connect(audioContext.destination);
source.start();
```

## Broadcast Structure

Every broadcast follows this order:

1. **Introduction** (always present)
   - Met Office attribution
   - Timestamp in BBC format ("zero five thirty")
   - Date with day of week ("on Tuesday the second of February")
   - 20+ variants (12 standard, 8 surreal)
   - 1500ms pause after

2. **Gale Warnings** (conditional - force 8+ only)
   - Listed in geographic order (north to south)
   - 20+ format variants (14 standard, 8 inverse)
   - 1000ms pause after

3. **Time Period** (always present)
   - Forecast validity announcement
   - 15 variants with weighted distribution
   - 800ms pause after

4. **Area Forecasts** (from existing system)
   - All standard and phantom areas
   - Existing SSML with BBC Radio 4 prosody

## Testing

Open `test-natural-speech.html` in browser:

- **"Generate Full Broadcast"** button - Test complete broadcast structure
- Console shows:
  - Broadcast ID and segments
  - Variant IDs selected
  - Gale warning details (if present)
  - Character count (5000 limit warning)
  - Variant distribution across session

## Variant Distribution

**Introduction Variants** (~60% standard, ~40% surreal):
- Standard: "std-001" through "std-012" (weight 2)
- Surreal: "sur-001" through "sur-008" (weight 1)

**Gale Warning Variants** (~66% standard, ~33% inverse):
- Standard: "gale-std-001" through "gale-std-014" (weight 2)
- Inverse: "gale-inv-001" through "gale-inv-008" (weight 1)

**Time Period Variants** (weighted by frequency):
- Duration-based: "tp-001" through "tp-006" (weight 3, 40%)
- Time-specific: "tp-007" through "tp-010" (weight 2, 30%)
- Descriptive: "tp-011" through "tp-012" (weight 1, 10%)
- Maritime-specific: "tp-013" through "tp-014" (weight 1, 10%)
- Other: "tp-015" (weight 1, 5%)

## Manual Testing Checklist

### User Story 1: Introduction
- [ ] Introduction always appears first
- [ ] Timestamp accurate (within 1 minute)
- [ ] Date formatted correctly (day + ordinal + month)
- [ ] Generate 50 broadcasts, verify 20+ unique variants
- [ ] Surreal variants maintain plausibility (~40% frequency)
- [ ] 1500ms pause after introduction (measure in audio editor)

### User Story 2: Gale Warnings
- [ ] Gale warnings appear when force 8+ exists
- [ ] Gale warnings omitted when no force 8+ winds
- [ ] Gales ordered geographically (north to south)
- [ ] Generate 50 broadcasts with gales, verify 20+ format variants
- [ ] 1000ms pause after gale warnings

### User Story 3: Time Period
- [ ] Time period always present
- [ ] Generate 100 broadcasts, verify 10+ unique variants
- [ ] Frequency distribution matches weights (~40%/30%/15%/10%/5%)
- [ ] 800ms pause after time period

### Overall Quality
- [ ] Single continuous SSML synthesis (no gaps)
- [ ] BBC Radio 4 cadence maintained (85% rate)
- [ ] Character count < 5000 for most broadcasts
- [ ] Audio quality: no robotic artifacts

## Common Issues

**Issue**: Character count exceeds 5000
- **Cause**: Full 31-area broadcasts often reach 5050-7100 chars
- **Solution**: For testing, use fewer areas: `generateBroadcast(20)`

**Issue**: No gale warnings when expected
- **Cause**: Gale threshold is force 8+
- **Solution**: Check wind force values in area forecasts

**Issue**: Surreal variants never appear
- **Cause**: Random distribution over small sample size
- **Solution**: Generate 50+ broadcasts to see ~40% surreal frequency

## Implementation Files

**New Files**:
- `src/utils/date-formatter.js` - BBC timestamp/date formatting
- `src/audio/broadcast-variants.js` - 20+/20+/15 variant libraries
- `src/core/broadcast-generator.js` - Broadcast orchestrator

**Modified Files**:
- `src/audio/ssml-template-builder.js` - Added broadcast SSML methods
- `test-natural-speech.html` - Added broadcast testing UI

## References

- Specification: [specs/003-broadcast-structure/spec.md](specs/003-broadcast-structure/spec.md)
- Implementation Plan: [specs/003-broadcast-structure/plan.md](specs/003-broadcast-structure/plan.md)
- Research: [specs/003-broadcast-structure/research.md](specs/003-broadcast-structure/research.md)
- Data Model: [specs/003-broadcast-structure/data-model.md](specs/003-broadcast-structure/data-model.md)
- Quickstart: [specs/003-broadcast-structure/quickstart.md](specs/003-broadcast-structure/quickstart.md)
