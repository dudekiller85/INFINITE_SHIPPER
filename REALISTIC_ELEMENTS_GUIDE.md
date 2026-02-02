# Realistic BBC Elements - Usage Guide

This guide explains the new realistic elements added to make the forecast sound more like authentic BBC Radio 4 Shipping Forecast broadcasts.

## What's Been Added

### 1. Timing Phrases
Add temporal context to forecasts:
- `later`
- `at first`
- `for a time`
- `soon`
- `by evening`
- `by midnight`
- `overnight`

### 2. Connectors
Link multiple conditions:
- `or` - alternatives (e.g., "4 or 5")
- `to` - ranges (e.g., "5 to 7")
- `occasionally` - intermittent (e.g., "Force 6, occasionally 7")
- `intermittent` - sporadic conditions
- `then` - sequence (e.g., "Backing, then veering")

### 3. Wind Modifiers
Describe changes to wind:
- `increasing` - getting stronger
- `decreasing` - getting weaker
- `backing` - direction shifting counterclockwise
- `veering` - direction shifting clockwise
- `becoming` - transitioning to different state
- `rising` - getting stronger (alternative)
- `falling` - getting weaker (alternative)

### 4. Pressure Conditions
Add atmospheric context:
- `Pressure rising`
- `Pressure falling`
- `Pressure steady`
- `Low pressure approaching`
- `High pressure building`
- `Pressure rising slowly`
- `Pressure falling slowly`
- `Ridge of high pressure`

### 5. Wave/Swell Conditions
Describe sea characteristics beyond simple state:
- `Moderate swell`
- `Heavy swell`
- `Confused sea`

### 6. Numbers (0-99)
For measurements, times, and forces:
- Wind force ranges: "4 or 5", "5 to 7"
- Times: "by 18 hundred hours"
- Measurements: "waves 2 to 3 meters"

---

## Example Enhanced Forecasts

### Basic (Current)
```
Viking. Southwesterly, force 7. Rough. Rain. Good.
```

### Enhanced with Timing
```
Viking. Southwesterly, force 7. Rough at first. Rain. Good, becoming moderate later.
```

### Enhanced with Compound Forces
```
Viking. Southwesterly 4 or 5, increasing 6 or 7 later. Rough. Rain. Good.
```

### Enhanced with Pressure
```
Viking. Southwesterly 5 to 7. Rough. Rain. Good. Pressure falling.
```

### Enhanced with Waves
```
Viking. Southwesterly, force 7. Rough, moderate swell. Rain. Good.
```

### Enhanced with Multiple Elements
```
Viking. Southwesterly 5, increasing 7 later.
Rough at first, moderate swell.
Rain, then showers.
Good, becoming moderate by evening.
Pressure falling slowly.
```

### Full BBC-Style Report
```
Dogger. Variable 3 or 4, becoming southwesterly 5 to 6,
occasionally 7 later. Slight or moderate at first, then rough.
Rain for a time, then fair. Good, becoming moderate.
Low pressure approaching.
```

---

## Implementation Examples

### Example 1: Compound Wind Forces

**Old generator output:**
```javascript
{
  wind: "Southwesterly, force 7"
}
```

**New generator output:**
```javascript
{
  wind: {
    direction: "Southwesterly",
    force: [5, 7], // Force range
    connector: "to", // "5 to 7"
    modifier: "increasing",
    timing: "later"
  }
}
```

**Audio sequence:**
```javascript
[
  'wind/directions/southwesterly.mp3',
  'numbers/5.mp3',
  'connectors/to.mp3',
  'numbers/7.mp3',
  'wind/modifiers/increasing.mp3',
  'timing/later.mp3'
]
```

**Result:** "Southwesterly 5 to 7, increasing later"

---

### Example 2: Timing with Sea State

**Generator output:**
```javascript
{
  sea: "Rough",
  seaTiming: "at first"
}
```

**Audio sequence:**
```javascript
[
  'sea/rough.mp3',
  'timing/at-first.mp3'
]
```

**Result:** "Rough at first"

---

### Example 3: Pressure Announcement

**Generator output:**
```javascript
{
  pressure: "Pressure falling slowly"
}
```

**Audio sequence:**
```javascript
[
  'pressure/pressure-falling-slowly.mp3'
]
```

**Result:** "Pressure falling slowly"

---

### Example 4: Wave Conditions

**Generator output:**
```javascript
{
  sea: "Rough",
  waves: "Moderate swell"
}
```

**Audio sequence:**
```javascript
[
  'sea/rough.mp3',
  'waves/moderate-swell.mp3'
]
```

**Result:** "Rough, moderate swell"

---

## How to Update Your Generator

### Step 1: Update Report Generation Logic

In [src/core/generator.js](src/core/generator.js), enhance the weather report structure:

```javascript
import {
  TIMING_PHRASES,
  CONNECTORS,
  WIND_MODIFIERS,
  PRESSURE_CONDITIONS,
  WAVE_CONDITIONS,
  getRandomElement
} from './vocabulary.js';

function generateEnhancedReport(area) {
  // 10% chance of compound wind forces
  const useCompoundForce = Math.random() < 0.1;

  let wind;
  if (useCompoundForce) {
    wind = {
      direction: getRandomElement(WIND_DIRECTIONS),
      forces: [
        getRandomInt(4, 6),
        getRandomInt(7, 9)
      ],
      connector: getRandomElement(['or', 'to', 'occasionally'])
    };
  } else {
    wind = {
      direction: getRandomElement(WIND_DIRECTIONS),
      force: getRandomInt(4, 12)
    };
  }

  // 20% chance of wind modifier
  if (Math.random() < 0.2) {
    wind.modifier = getRandomElement(WIND_MODIFIERS);
  }

  // 15% chance of timing phrase
  if (Math.random() < 0.15) {
    wind.timing = getRandomElement(TIMING_PHRASES);
  }

  // 10% chance of pressure condition
  const pressure = Math.random() < 0.1
    ? getRandomElement(PRESSURE_CONDITIONS)
    : null;

  // 15% chance of wave condition
  const waves = Math.random() < 0.15
    ? getRandomElement(WAVE_CONDITIONS)
    : null;

  return {
    area,
    wind,
    sea: getRandomElement(SEA_STATES),
    weather: getRandomElement(WEATHER),
    visibility: getRandomElement(VISIBILITY),
    pressure,
    waves
  };
}
```

### Step 2: Update Audio Sequence Builder

In [src/audio/audio-library.js](src/audio/audio-library.js), update `buildReportSequence()`:

```javascript
buildReportSequence(report) {
  const sequence = [];
  const isPhantom = report.area.type === 'phantom';

  // 1. Area name
  sequence.push(this.getAreaPath(report.area.name, isPhantom));
  sequence.push(this.getPausePath('short'));

  // 2. Wind (now with compound forces)
  if (report.wind.forces) {
    // Compound: "5 to 7" or "4 or 5"
    sequence.push(this.getWindDirectionPath(report.wind.direction));
    sequence.push(this.getNumberPath(report.wind.forces[0]));
    sequence.push(this.getConnectorPath(report.wind.connector));
    sequence.push(this.getNumberPath(report.wind.forces[1]));
  } else {
    // Simple: "Southwesterly, force 7"
    sequence.push(this.getWindDirectionPath(report.wind.direction));
    sequence.push(this.getWindForcePath(report.wind.force));
  }

  // Wind modifier (optional)
  if (report.wind.modifier) {
    sequence.push(this.getWindModifierPath(report.wind.modifier));
  }

  // Wind timing (optional)
  if (report.wind.timing) {
    sequence.push(this.getTimingPhrasePath(report.wind.timing));
  }

  // 3. Sea state
  sequence.push(this.getSeaStatePath(report.sea));

  // Wave conditions (optional)
  if (report.waves) {
    sequence.push(this.getWavePath(report.waves));
  }

  // 4. Weather
  sequence.push(this.getWeatherPath(report.weather));

  // 5. Visibility
  sequence.push(this.getVisibilityPath(report.visibility));

  // 6. Pressure (optional)
  if (report.pressure) {
    sequence.push(this.getPressurePath(report.pressure));
  }

  // 7. Final pause
  sequence.push(this.getPausePath('long'));

  return sequence;
}
```

---

## Frequency Recommendations

To maintain realistic variety without overwhelming the listener:

| Element | Suggested Frequency | Reasoning |
|---------|-------------------|-----------|
| Compound forces ("4 or 5") | 10-15% | Common in real forecasts |
| Wind modifiers ("increasing") | 15-20% | Adds dynamism |
| Timing phrases ("later") | 10-15% | Suggests temporal progression |
| Pressure conditions | 5-10% | Occasional context |
| Wave conditions | 10-15% | Adds maritime detail |

---

## Realism vs. Weirdness Balance

### Phase 1: Normal Operation (0-20 minutes)
- Use all realistic elements normally
- Standard probability distributions
- Authentic BBC feel

### Phase 2: Subtle Shift (20-40 minutes)
- Increase frequency of compound elements
- Start using unusual combinations
- "Variable 3 or 4, becoming cyclonic later"

### Phase 3: Uncanny (40+ minutes)
- Introduce impossible combinations
- "Force 4 or 15" (15 doesn't exist)
- "Increasing, then decreasing, then increasing"
- Prepare for future surreal additions

---

## Testing Realistic Elements

### Quick Test Script

```javascript
// Test all new audio files
const testSequences = [
  // Compound force
  ['numbers/5.mp3', 'connectors/or.mp3', 'numbers/6.mp3'],

  // Wind modifier + timing
  ['wind/modifiers/increasing.mp3', 'timing/later.mp3'],

  // Pressure condition
  ['pressure/pressure-falling.mp3'],

  // Wave condition
  ['waves/moderate-swell.mp3']
];

for (const seq of testSequences) {
  await playSequence(seq);
  await pause(2000);
}
```

---

## Next Steps

1. **Generate the audio library** with new elements
2. **Update generator.js** to create enhanced reports
3. **Test frequency balance** - adjust probabilities
4. **Listen for 30+ minutes** - verify variety doesn't become repetitive
5. **Monitor file loading** - ensure smooth playback with more files

The realistic elements are fully backwards compatible - you can generate them now and integrate gradually.
