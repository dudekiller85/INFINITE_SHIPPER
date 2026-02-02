# Module Contracts: The Infinite Shipping Forecast

**Date**: 31 January 2026  
**Feature**: 001-infinite-shipping-forecast

## Overview

Since this is a client-side-only application with no REST API or GraphQL endpoints, "contracts" refer to the interfaces between JavaScript modules. These define the public API surface for each subsystem.

---

## Core Generator Module

**Module**: `src/core/generator.js`

### Functions

#### `generateWeatherReport(): WeatherReport`

Generates a single complete weather report with randomized components.

**Parameters**: None

**Returns**: 
```javascript
{
  area: SeaArea,
  wind: Wind,
  seaState: string,
  weather: string,
  visibility: string,
  timestamp: number,
  text: string
}
```

**Behavior**:
- 2% probability selects from phantom areas, 98% from shuffled standard areas
- Randomly selects wind direction, optional behavior, force (4-12)
- Randomly selects sea state, weather, visibility from vocabularies
- Formats text according to template: "[Area]. [Wind] force [N]. [Sea]. [Weather]. Visibility [Vis]."
- Sets timestamp to Date.now()

**Errors**: None (always succeeds with valid data)

**Side Effects**: Increments internal area index, triggers shuffle after 31 standard areas

---

#### `getCurrentAreaIndex(): number`

Returns current position in the shuffled area cycle.

**Returns**: Integer 0-30

---

#### `resetCycle(): void`

Resets area index to 0 and re-shuffles standard areas.

**Parameters**: None

**Returns**: void

**Side Effects**: Mutates internal shuffled areas array

---

## Buffer Manager Module

**Module**: `src/core/buffer.js`

### Class: ReportBuffer

#### Constructor

```javascript
new ReportBuffer(minSize = 2, maxSize = 5)
```

**Parameters**:
- `minSize: number` - Minimum reports before refill trigger
- `maxSize: number` - Maximum buffer capacity

---

#### `enqueue(report: WeatherReport): boolean`

Adds a report to the buffer tail.

**Parameters**:
- `report: WeatherReport` - Report to add

**Returns**: `true` if added, `false` if buffer full

**Errors**: None (returns false instead of throwing)

---

#### `dequeue(): WeatherReport | null`

Removes and returns the next report from buffer head.

**Returns**: WeatherReport or null if buffer empty

**Side Effects**: Triggers refill if queue length drops to minSize

---

#### `needsRefill(): boolean`

Checks if buffer needs more reports.

**Returns**: `true` if length ≤ minSize

---

#### `size(): number`

Returns current number of queued reports.

**Returns**: Integer 0-maxSize

---

## Audio Synthesizer Module

**Module**: `src/audio/synthesizer.js`

### Functions

#### `speakReport(report: WeatherReport, options: SpeechOptions): Promise<void>`

Synthesizes speech for a weather report.

**Parameters**:
- `report: WeatherReport` - Report to speak
- `options: SpeechOptions`:
  ```javascript
  {
    rate: number,        // 0.5-2.0, default 1.0
    pitch: number,       // 0.0-2.0, default 1.0
    volume: number,      // 0.0-1.0, default 1.0
    voice: string | null // Preferred voice name or null for default
  }
  ```

**Returns**: Promise that resolves when speech completes

**Errors**: 
- Rejects if Web Speech API unavailable
- Rejects if speech synthesis fails

**Side Effects**: 
- Plays audio through default output device
- Pauses between area name and details (500ms)

---

#### `stopSpeaking(): void`

Immediately cancels any in-progress speech.

**Returns**: void

---

#### `getAvailableVoices(): SpeechSynthesisVoice[]`

Returns array of available TTS voices.

**Returns**: Array of voice objects

**Note**: May return empty array if voices not yet loaded (async browser behavior)

---

## Audio Filters Module

**Module**: `src/audio/filters.js`

### Class: RadioFilter

#### Constructor

```javascript
new RadioFilter(audioContext: AudioContext)
```

**Parameters**:
- `audioContext: AudioContext` - Web Audio API context

---

#### `connect(source: AudioNode, destination: AudioNode): void`

Connects filter chain between source and destination.

**Parameters**:
- `source: AudioNode` - Input node (e.g., MediaStreamSource)
- `destination: AudioNode` - Output node (e.g., audioContext.destination)

**Side Effects**: Creates internal filter nodes (BiquadFilter, GainNode for noise)

---

#### `disconnect(): void`

Disconnects all filter nodes.

**Returns**: void

---

#### `setFilterFrequency(lowHz: number, highHz: number): void`

Updates bandpass filter frequency range.

**Parameters**:
- `lowHz: number` - Lower bound (default 300)
- `highHz: number` - Upper bound (default 3000)

---

#### `setNoiseGain(level: number): void`

Adjusts white noise volume.

**Parameters**:
- `level: number` - Gain 0.0-1.0 (default 0.02)

---

## Visual Background Module

**Module**: `src/visuals/background.js`

### Functions

#### `initBackground(canvas: HTMLCanvasElement): void`

Initializes isobar map rendering on canvas.

**Parameters**:
- `canvas: HTMLCanvasElement` - Canvas element for rendering

**Side Effects**: Starts animation loop using requestAnimationFrame

---

#### `updateBlur(intensity: number): void`

Updates CSS blur filter on background.

**Parameters**:
- `intensity: number` - Blur in pixels (0-10)

**Side Effects**: Modifies canvas element CSS filter property

---

#### `updateHueRotation(degrees: number): void`

Updates CSS hue-rotate filter on background.

**Parameters**:
- `degrees: number` - Rotation angle 0-360

**Side Effects**: Modifies canvas element CSS filter property

---

## Oscilloscope Module

**Module**: `src/visuals/oscilloscope.js`

### Class: Oscilloscope

#### Constructor

```javascript
new Oscilloscope(canvas: HTMLCanvasElement, analyser: AnalyserNode)
```

**Parameters**:
- `canvas: HTMLCanvasElement` - Canvas for visualization
- `analyser: AnalyserNode` - Web Audio API analyser node

---

#### `start(): void`

Begins drawing oscilloscope visualization.

**Side Effects**: Starts requestAnimationFrame loop

---

#### `stop(): void`

Stops drawing oscilloscope visualization.

**Side Effects**: Cancels requestAnimationFrame loop

---

#### `setColor(cssColor: string): void`

Changes oscilloscope line color.

**Parameters**:
- `cssColor: string` - CSS color value (default "green")

---

## State Management Module

**Module**: `src/state/session.js`

### Class: SessionState

#### Constructor

```javascript
new SessionState()
```

---

#### `isPlaying(): boolean`

Returns current transmission state.

**Returns**: `true` if active, `false` if stopped

---

#### `togglePlayback(): void`

Switches between playing and stopped states.

**Side Effects**: Updates internal state, emits 'stateChange' event

---

#### `getCurrentReport(): WeatherReport | null`

Returns currently playing report.

**Returns**: WeatherReport or null if none

---

#### `setCurrentReport(report: WeatherReport): void`

Updates currently playing report.

**Parameters**:
- `report: WeatherReport` - Report being broadcast

**Side Effects**: Emits 'reportChange' event

---

#### `onTabBlurred(): void`

Handles tab losing visibility.

**Side Effects**: 
- Sets backgroundedAt timestamp
- Starts 60-second timer for unsettling messages

---

#### `onTabFocused(): void`

Handles tab regaining visibility.

**Side Effects**:
- Clears backgroundedAt timestamp
- Disables unsettling messages
- Resets timer

---

#### `shouldShowUnsettlingMessage(): boolean`

Determines if unsettling message should be inserted.

**Returns**: `true` if tab backgrounded for >60 seconds

---

## Browser Detection Module

**Module**: `src/utils/browser-detect.js`

### Functions

#### `checkBrowserSupport(): BrowserSupport`

Detects availability of required browser APIs.

**Returns**:
```javascript
{
  speechSynthesis: boolean,
  audioContext: boolean,
  canvasAPI: boolean,
  pageVisibilityAPI: boolean,
  allSupported: boolean,
  missingAPIs: string[]
}
```

**Side Effects**: None (pure detection)

---

#### `getErrorMessage(support: BrowserSupport): string`

Generates user-friendly error message for unsupported browsers.

**Parameters**:
- `support: BrowserSupport` - Result from checkBrowserSupport()

**Returns**: HTML string with error message and recommendations

---

## Event Bus Module

**Module**: `src/state/events.js`

### Class: EventBus

Lightweight pub/sub for cross-module communication.

#### `on(event: string, handler: Function): void`

Subscribes to an event.

**Parameters**:
- `event: string` - Event name
- `handler: Function` - Callback function

---

#### `emit(event: string, data: any): void`

Publishes an event.

**Parameters**:
- `event: string` - Event name
- `data: any` - Event payload

---

#### `off(event: string, handler: Function): void`

Unsubscribes from an event.

**Parameters**:
- `event: string` - Event name
- `handler: Function` - Previously registered callback

---

## Events Reference

### Standard Events

- `stateChange`: Emitted when transmission state toggles (playing/stopped)
  - Payload: `{ isPlaying: boolean }`

- `reportChange`: Emitted when new report begins playback
  - Payload: `{ report: WeatherReport }`

- `phantomArea`: Emitted when phantom area is selected
  - Payload: `{ area: SeaArea }`

- `normalArea`: Emitted when returning to normal after phantom
  - Payload: `{ area: SeaArea }`

- `tabBlurred`: Emitted when tab loses focus
  - Payload: `{ timestamp: number }`

- `tabFocused`: Emitted when tab regains focus
  - Payload: `{ timestamp: number }`

- `unsettlingMessage`: Emitted when unsettling message should be inserted
  - Payload: `{ message: string }`

- `bufferRefill`: Emitted when buffer needs refilling
  - Payload: `{ currentSize: number, targetSize: number }`

---

## Usage Examples

### Basic Initialization

```javascript
import { generateWeatherReport } from './core/generator.js';
import { ReportBuffer } from './core/buffer.js';
import { speakReport } from './audio/synthesizer.js';

// Initialize buffer
const buffer = new ReportBuffer(2, 5);

// Generate and queue initial reports
for (let i = 0; i < 5; i++) {
  const report = generateWeatherReport();
  buffer.enqueue(report);
}

// Play first report
const firstReport = buffer.dequeue();
await speakReport(firstReport, { rate: 1.0, pitch: 1.0, volume: 1.0 });
```

### Setting Up Audio Chain

```javascript
import { RadioFilter } from './audio/filters.js';

const audioContext = new AudioContext();
const filter = new RadioFilter(audioContext);

// Connect filter between source and destination
const source = audioContext.createMediaStreamSource(stream);
filter.connect(source, audioContext.destination);
```

### Visual Effects

```javascript
import { initBackground, updateBlur } from './visuals/background.js';
import { Oscilloscope } from './visuals/oscilloscope.js';

const bgCanvas = document.getElementById('background');
const oscCanvas = document.getElementById('oscilloscope');

initBackground(bgCanvas);

const oscilloscope = new Oscilloscope(oscCanvas, analyserNode);
oscilloscope.start();

// Trigger phantom effect
updateBlur(10); // Spike blur during phantom area
setTimeout(() => updateBlur(2), 2000); // Return to normal
```

### State Management

```javascript
import { SessionState } from './state/session.js';
import { EventBus } from './state/events.js';

const state = new SessionState();
const events = new EventBus();

// Subscribe to state changes
events.on('stateChange', ({ isPlaying }) => {
  console.log(`Transmission ${isPlaying ? 'started' : 'stopped'}`);
});

// Toggle playback
state.togglePlayback(); // Emits stateChange event
```

---

## Contract Testing Strategy

All module interfaces should have contract tests verifying:

1. **Function Signatures**: Correct parameter types and return types
2. **Error Handling**: Proper rejection/error conditions
3. **Side Effects**: Expected events emitted, state mutations
4. **Boundary Conditions**: Min/max values, empty/null inputs
5. **Integration Points**: Cross-module event flows work correctly

Example test structure:

```javascript
describe('ReportBuffer contract', () => {
  it('enqueue returns false when buffer full', () => {
    const buffer = new ReportBuffer(2, 3);
    buffer.enqueue(mockReport1);
    buffer.enqueue(mockReport2);
    buffer.enqueue(mockReport3);
    expect(buffer.enqueue(mockReport4)).toBe(false);
  });

  it('dequeue triggers refill event when reaching minSize', () => {
    const buffer = new ReportBuffer(2, 5);
    // ... setup with 3 reports
    const eventSpy = jest.fn();
    events.on('bufferRefill', eventSpy);
    buffer.dequeue(); // Size drops to 2 = minSize
    expect(eventSpy).toHaveBeenCalled();
  });
});
```
