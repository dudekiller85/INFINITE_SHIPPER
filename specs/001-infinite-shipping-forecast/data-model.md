# Data Model: The Infinite Shipping Forecast

**Date**: 31 January 2026  
**Feature**: 001-infinite-shipping-forecast

## Overview

This is a client-side application with no persistent storage. All data structures exist in-memory during a single user session. The model focuses on the domain entities for weather report generation and runtime state management.

## Core Entities

### SeaArea

Represents a geographic region for which weather forecasts are reported.

**Attributes**:
- `name: string` - Display name of the area (e.g., "Viking", "The Void")
- `type: "standard" | "phantom"` - Classification determining selection probability
- `id: string` - Unique identifier (kebab-case of name)

**Validation Rules**:
- name: Required, non-empty string, max 50 characters
- type: Must be exactly "standard" or "phantom"
- id: Required, unique within the areas collection

**State Transitions**: N/A (immutable reference data)

**Relationships**:
- One SeaArea referenced by many WeatherReports (1:N)

**Sample Data**:
```javascript
{
  name: "Viking",
  type: "standard",
  id: "viking"
}

{
  name: "The Void",
  type: "phantom",
  id: "the-void"
}
```

---

### WeatherReport

A single complete forecast statement for one sea area.

**Attributes**:
- `area: SeaArea` - Reference to the area being reported
- `wind: Wind` - Wind conditions
- `seaState: string` - Sea condition (from controlled vocabulary)
- `weather: string` - Weather condition (from controlled vocabulary)
- `visibility: string` - Visibility measurement (from controlled vocabulary)
- `timestamp: number` - Generation time (Date.now())
- `text: string` - Fully formatted report text for speech synthesis

**Validation Rules**:
- area: Required, must be valid SeaArea reference
- wind: Required, must be valid Wind object
- seaState: Required, must match one value from SEA_STATES vocabulary
- weather: Required, must match one value from WEATHER vocabulary
- visibility: Required, must match one value from VISIBILITY vocabulary
- text: Auto-generated from template, follows format: "[Area Name]. [Wind]. [Sea State]. [Weather]. Visibility [Visibility]."

**State Transitions**:
1. Generated → Queued (added to buffer)
2. Queued → Playing (audio synthesis begins)
3. Playing → Complete (audio synthesis ends)

**Relationships**:
- References one SeaArea (N:1)
- Contains one Wind object (1:1 composition)

**Sample Data**:
```javascript
{
  area: { name: "Forties", type: "standard", id: "forties" },
  wind: {
    direction: "Southwest",
    behavior: "Veering",
    force: 7
  },
  seaState: "Rough",
  weather: "Rain",
  visibility: "Moderate",
  timestamp: 1738329600000,
  text: "Forties. Southwest Veering, force 7. Rough. Rain. Visibility Moderate."
}
```

---

### Wind

Represents wind conditions within a weather report.

**Attributes**:
- `direction: string` - Cardinal/intercardinal direction (from controlled vocabulary)
- `behavior: string | null` - Optional change behavior (from controlled vocabulary)
- `force: number` - Beaufort scale force number

**Validation Rules**:
- direction: Required, must match one value from WIND_DIRECTIONS vocabulary
- behavior: Optional (nullable), if present must match one value from WIND_BEHAVIORS vocabulary
- force: Required, integer between 4 and 12 inclusive

**Relationships**:
- Composed within WeatherReport (part-of relationship)

**Sample Data**:
```javascript
{
  direction: "North",
  behavior: "Backing",
  force: 9
}

{
  direction: "Cyclonic",
  behavior: null,
  force: 11
}
```

---

### ReportBuffer

Manages the queue of pre-generated reports to ensure continuous playback.

**Attributes**:
- `queue: WeatherReport[]` - Array of pre-generated reports (FIFO)
- `minSize: number` - Minimum buffer size before refill (2)
- `maxSize: number` - Maximum buffer size (5)
- `isGenerating: boolean` - Flag to prevent concurrent generation

**Validation Rules**:
- queue: Array of valid WeatherReport objects
- minSize: Must be ≥ 1 and < maxSize
- maxSize: Must be ≥ minSize and ≤ 10
- isGenerating: Boolean flag

**State Transitions**:
1. Empty → Generating (initial fill on start)
2. Below minSize → Generating (automatic refill)
3. At maxSize → Idle (generation paused)

**Operations**:
- `enqueue(report: WeatherReport): void` - Add report to tail (if space available)
- `dequeue(): WeatherReport | null` - Remove and return report from head
- `needsRefill(): boolean` - True if queue.length ≤ minSize
- `isFull(): boolean` - True if queue.length ≥ maxSize

---

### TransmissionState

Tracks the overall state of the audio/visual experience.

**Attributes**:
- `isPlaying: boolean` - Whether transmission is active
- `currentReport: WeatherReport | null` - Report currently being synthesized
- `areaIndex: number` - Position in current cycle (0-30 for standard areas)
- `shuffledAreas: SeaArea[]` - Current shuffled order of standard areas
- `backgroundedAt: number | null` - Timestamp when tab was backgrounded (null if focused)
- `unsettlingMessagesActive: boolean` - Whether unsettling messages should be inserted

**Validation Rules**:
- isPlaying: Boolean
- currentReport: Nullable reference to WeatherReport
- areaIndex: Integer 0-30 (resets to 0 after shuffle)
- shuffledAreas: Array of 31 standard SeaArea objects
- backgroundedAt: Nullable timestamp (number from Date.now())
- unsettlingMessagesActive: Boolean, should be true only if backgroundedAt is set and 60 seconds elapsed

**State Transitions**:
1. Idle → Playing (user clicks "Begin Transmission")
2. Playing → Paused (user clicks "Stop Transmission")
3. Paused → Playing (user clicks "Begin Transmission" again)
4. Focused → Backgrounded (tab loses visibility)
5. Backgrounded → Focused (tab regains visibility)

---

### AudioFilterConfiguration

Immutable configuration for radio effect processing.

**Attributes**:
- `bandpassLowFreq: number` - Lower frequency bound (Hz)
- `bandpassHighFreq: number` - Upper frequency bound (Hz)
- `noiseGain: number` - White noise volume (0.0-1.0)
- `voiceRate: number` - Normal speech rate multiplier (0.9-1.1)
- `phantomVoiceRate: number` - Phantom area speech rate multiplier (0.81 = 10% slower)

**Validation Rules**:
- All frequency values: Positive numbers, lowFreq < highFreq
- noiseGain: Float between 0.0 and 1.0
- voiceRate: Float between 0.5 and 2.0
- phantomVoiceRate: Float between 0.5 and 2.0

**Constants** (from specification):
```javascript
{
  bandpassLowFreq: 300,
  bandpassHighFreq: 3000,
  noiseGain: 0.02,
  voiceRate: 1.0,
  phantomVoiceRate: 0.9
}
```

---

### VisualState

Tracks current visual effect parameters for synchronized animations.

**Attributes**:
- `blurIntensity: number` - Current blur in pixels (0-10)
- `hueRotation: number` - Current hue rotation in degrees (0-360)
- `isPhantomActive: boolean` - Whether currently displaying phantom area effects
- `frequencyData: Uint8Array` - Latest audio frequency spectrum for oscilloscope

**Validation Rules**:
- blurIntensity: Float 0-10, spikes to 10 during phantom areas, oscillates 0-3 normally
- hueRotation: Float 0-360, wraps at 360
- isPhantomActive: Boolean
- frequencyData: Uint8Array of length matching analyser.frequencyBinCount

**State Transitions**:
- Normal → Phantom (phantom area selected): blurIntensity 0-3 → 10
- Phantom → Normal (phantom complete): blurIntensity 10 → 0-3 (resume oscillation)

---

## Controlled Vocabularies

These are reference data arrays, not mutable entities.

### STANDARD_AREAS (31 items)
```javascript
["Viking", "North Utsire", "South Utsire", "Forties", "Cromarty", "Forth", 
 "Tyne", "Dogger", "Fisher", "German Bight", "Humber", "Thames", "Dover", 
 "Wight", "Portland", "Plymouth", "Biscay", "Trafalgar", "FitzRoy", "Sole", 
 "Lundy", "Fastnet", "Irish Sea", "Shannon", "Rockall", "Malin", "Hebrides", 
 "Bailey", "Fair Isle", "Faeroes", "South-East Iceland"]
```

### PHANTOM_AREAS (7 items)
```javascript
["The Void", "Silence", "Elder Bank", "Mirror Reach", "The Marrow", 
 "Still Water", "Obsidian Deep"]
```

### WIND_DIRECTIONS (10 items)
```javascript
["North", "Northeast", "East", "Southeast", "South", "Southwest", 
 "West", "Northwest", "Cyclonic", "Variable"]
```

### WIND_BEHAVIORS (5 items)
```javascript
["Veering", "Backing", "Becoming", "Increasing", "Decreasing"]
```

### SEA_STATES (8 items)
```javascript
["Smooth", "Slight", "Moderate", "Rough", "Very Rough", "High", 
 "Very High", "Phenomenal"]
```

### WEATHER (8 items)
```javascript
["Fair", "Rain", "Drizzle", "Showers", "Thundery showers", "Snow", 
 "Fog", "Freezing spray"]
```

### VISIBILITY (8 items)
```javascript
["Good", "Moderate", "Poor", "Very poor", "Less than 1000 meters", 
 "2 kilometers", "500 meters", "Zero"]
```

### UNSETTLING_MESSAGES (12 items)
```javascript
[
  "Where are you going? The sea waits for no man.",
  "The forecast continues. Are you listening?",
  "Still there? The transmission persists.",
  "The waters do not forget.",
  "Distance is an illusion. The sea is everywhere.",
  "Why do you turn away?",
  "The broadcast does not sleep.",
  "Return. There is more to hear.",
  "Your absence has been noted.",
  "The shipping lanes remain. Do you?",
  "Time passes. The forecast endures.",
  "The waves remember your silence."
]
```

---

## Entity Relationships Diagram

```
SeaArea (reference data)
  ↑ referenced by
  |
WeatherReport (generated, ephemeral)
  |-- contains --> Wind (composite)
  |
  ↓ queued in
  |
ReportBuffer (runtime state)
  |
  ↓ consumed by
  |
TransmissionState (session state)
  |-- references --> shuffledAreas: SeaArea[]
  |-- references --> currentReport: WeatherReport
  |
  ↓ controls
  |
AudioFilterConfiguration (immutable config) + VisualState (runtime state)
```

---

## Data Flow

1. **Initialization**:
   - Load STANDARD_AREAS and PHANTOM_AREAS into memory
   - Shuffle STANDARD_AREAS → TransmissionState.shuffledAreas
   - Initialize empty ReportBuffer

2. **Report Generation**:
   - Select area: 98% probability from shuffledAreas[areaIndex], 2% from PHANTOM_AREAS
   - Randomly select values from vocabularies (Wind, SeaState, Weather, Visibility)
   - Compose Wind object
   - Construct WeatherReport
   - Format text template
   - Enqueue to ReportBuffer

3. **Playback Cycle**:
   - Dequeue WeatherReport from buffer
   - Update TransmissionState.currentReport
   - Synthesize speech with AudioFilterConfiguration
   - Update VisualState (phantom effects if applicable)
   - On completion, increment areaIndex (shuffle if >= 31)
   - Refill buffer if needed

4. **Background Tracking**:
   - On tab blur: Set TransmissionState.backgroundedAt to Date.now()
   - Every report: Check if (Date.now() - backgroundedAt) > 60000
   - If true: Set unsettlingMessagesActive, insert random UNSETTLING_MESSAGE

---

## Memory Considerations

- **WeatherReport**: ~500 bytes each (mostly text)
- **ReportBuffer** (5 reports): ~2.5 KB
- **FrequencyData** (Uint8Array): ~2-4 KB (depends on FFT size)
- **Total session memory**: < 10 KB for all state
- **No memory leaks**: Objects dereferenced after playback completion
- **No persistence**: State resets on page reload

---

## Validation Strategy

**Unit Tests**:
- SeaArea: Validate name uniqueness, type constraints
- Wind: Validate force range (4-12), direction/behavior vocabulary membership
- WeatherReport: Validate template formatting, vocabulary consistency
- ReportBuffer: Validate FIFO ordering, size constraints, refill triggers

**Integration Tests**:
- End-to-end report generation → buffer → playback flow
- State transitions (idle → playing → paused)
- Background timing (60-second threshold)
- Phantom area probability over 100 iterations (expect 1-3 occurrences)
