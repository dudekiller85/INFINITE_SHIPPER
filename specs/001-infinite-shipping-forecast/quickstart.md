# Quickstart Guide: The Infinite Shipping Forecast

**Date**: 31 January 2026  
**Feature**: 001-infinite-shipping-forecast

## Prerequisites

- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+)
- Basic understanding of JavaScript ES2020+ modules
- Node.js 18+ (for running tests, not required for deployment)

## Project Structure

```
INFINITE_SHIPPER/
├── src/                      # Source code
│   ├── core/                 # Report generation logic
│   ├── audio/                # Speech synthesis & filtering
│   ├── visuals/              # Canvas & CSS animations
│   ├── state/                # Session state management
│   ├── utils/                # Browser detection, timing
│   └── app.js                # Main entry point
├── public/                   # Static assets
│   ├── index.html            # Single-page HTML
│   ├── styles.css            # Global styles
│   └── assets/               # Images, text files
├── tests/                    # Test suites
│   ├── unit/                 # Jest unit tests
│   └── integration/          # Playwright integration tests
├── specs/                    # Design documentation
│   └── 001-infinite-shipping-forecast/
│       ├── spec.md           # Feature specification
│       ├── plan.md           # This implementation plan
│       ├── research.md       # Technology research
│       ├── data-model.md     # Data structures
│       ├── contracts/        # Module interfaces
│       └── quickstart.md     # This file
├── package.json              # Dependencies (Jest, Playwright, dev tools)
└── README.md                 # Project overview
```

## Getting Started (5 Minutes)

### 1. Clone and Install

```bash
# Clone repository (or initialize if creating from scratch)
git clone <repository-url>
cd INFINITE_SHIPPER

# Install development dependencies
npm install
```

### 2. Run Locally

```bash
# Option A: Use built-in Python server
python3 -m http.server 8000

# Option B: Use Node.js http-server
npx http-server public -p 8000

# Option C: Use VS Code Live Server extension
# Right-click public/index.html → "Open with Live Server"
```

### 3. Open Browser

Navigate to `http://localhost:8000` and click "Begin Transmission"

---

## Development Workflow

### Running Tests

```bash
# Unit tests (Jest)
npm test

# Watch mode for TDD
npm test -- --watch

# Integration tests (Playwright)
npm run test:integration

# All tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint JavaScript
npm run lint

# Format code
npm run format

# Type checking (if using JSDoc)
npm run check-types
```

### Local Development Loop

1. Edit source files in `src/`
2. Refresh browser to see changes (no build step required)
3. Write/update tests in `tests/`
4. Run tests to verify behavior
5. Commit when tests pass

---

## Key Modules Guide

### Core Generation (`src/core/generator.js`)

**Purpose**: Generate random weather reports

**Quick Start**:
```javascript
import { generateWeatherReport } from './core/generator.js';

const report = generateWeatherReport();
console.log(report.text);
// Output: "Viking. Southwest Backing, force 7. Rough. Rain. Visibility Moderate."
```

**When to Edit**:
- Adding new area types
- Changing report template format
- Adjusting probability distributions

---

### Audio Synthesis (`src/audio/synthesizer.js`)

**Purpose**: Convert text reports to speech

**Quick Start**:
```javascript
import { speakReport } from './audio/synthesizer.js';

const report = generateWeatherReport();
await speakReport(report, {
  rate: 1.0,
  pitch: 1.0,
  voice: null // Uses default UK English voice
});
```

**When to Edit**:
- Changing voice selection logic
- Adjusting pause timings
- Adding error handling for speech synthesis

---

### Audio Filtering (`src/audio/filters.js`)

**Purpose**: Apply radio effects to audio

**Quick Start**:
```javascript
import { RadioFilter } from './audio/filters.js';

const audioContext = new AudioContext();
const filter = new RadioFilter(audioContext);

// Connect between source and output
filter.connect(sourceNode, audioContext.destination);

// Adjust radio effect
filter.setFilterFrequency(300, 3000);
filter.setNoiseGain(0.02);
```

**When to Edit**:
- Tuning radio effect parameters
- Adding additional audio processing
- Implementing dynamic filter adjustments

---

### Visual Background (`src/visuals/background.js`)

**Purpose**: Render shifting isobar map

**Quick Start**:
```javascript
import { initBackground, updateBlur } from './visuals/background.js';

const canvas = document.getElementById('background');
initBackground(canvas); // Starts animation loop

// Trigger phantom effect
updateBlur(10); // Spike blur
setTimeout(() => updateBlur(2), 2000); // Return to normal
```

**When to Edit**:
- Changing isobar map patterns
- Adjusting animation speeds
- Adding new visual effects

---

### State Management (`src/state/session.js`)

**Purpose**: Track transmission state and tab visibility

**Quick Start**:
```javascript
import { SessionState } from './state/session.js';
import { EventBus } from './state/events.js';

const state = new SessionState();
const events = new EventBus();

events.on('stateChange', ({ isPlaying }) => {
  updateButton(isPlaying ? 'Stop' : 'Begin');
});

state.togglePlayback(); // Emits stateChange event
```

**When to Edit**:
- Adding new state properties
- Changing tab visibility logic
- Implementing state persistence

---

## Common Tasks

### Add a New Phantom Area

1. Edit `src/core/areas.js`:
```javascript
export const PHANTOM_AREAS = [
  "The Void",
  "Silence",
  "Your New Area" // Add here
];
```

2. No other changes needed (generator automatically includes it)

### Change Phantom Probability

Edit `src/core/generator.js`:
```javascript
function selectArea() {
  const isPhantom = Math.random() < 0.05; // Change from 0.02 to 0.05 for 5%
  // ...
}
```

### Add New Unsettling Message

Edit `src/core/vocabulary.js`:
```javascript
export const UNSETTLING_MESSAGES = [
  "Where are you going? The sea waits for no man.",
  "Your new message here."
];
```

### Adjust Visual Effect Timing

Edit `src/visuals/effects.js`:
```javascript
// Change blur oscillation period
const BLUR_PERIOD_MS = 15000; // Changed from 10000 (10s) to 15000 (15s)

// Change hue rotation speed
const HUE_PERIOD_MS = 90000; // Changed from 60000 (60s) to 90000 (90s)
```

### Modify Speech Rate

Edit `src/audio/synthesizer.js`:
```javascript
// Normal speech
const DEFAULT_RATE = 1.1; // Changed from 1.0 to 1.1 (10% faster)

// Phantom speech
const PHANTOM_RATE = 0.8; // Changed from 0.9 to 0.8 (20% slower)
```

---

## Testing Guide

### Unit Test Example

```javascript
// tests/unit/generator.test.js
import { generateWeatherReport } from '../../src/core/generator.js';

describe('generateWeatherReport', () => {
  it('generates valid report structure', () => {
    const report = generateWeatherReport();
    
    expect(report).toHaveProperty('area');
    expect(report).toHaveProperty('wind');
    expect(report).toHaveProperty('text');
    expect(report.wind.force).toBeGreaterThanOrEqual(4);
    expect(report.wind.force).toBeLessThanOrEqual(12);
  });

  it('includes phantom area approximately 2% of the time', () => {
    const reports = Array(1000).fill(0).map(() => generateWeatherReport());
    const phantomCount = reports.filter(r => r.area.type === 'phantom').length;
    
    expect(phantomCount).toBeGreaterThan(5);  // >0.5%
    expect(phantomCount).toBeLessThan(50);    // <5%
  });
});
```

### Integration Test Example

```javascript
// tests/integration/audio-pipeline.test.js
import { test, expect } from '@playwright/test';

test('clicking Begin Transmission starts audio', async ({ page }) => {
  await page.goto('http://localhost:8000');
  
  // Click begin button
  await page.click('button#begin-transmission');
  
  // Wait for audio to start (check button text changes)
  await expect(page.locator('button#begin-transmission')).toContainText('Stop');
  
  // Verify area name appears
  await expect(page.locator('#area-name')).not.toBeEmpty();
  
  // Wait for audio to complete (max 15 seconds per report)
  await page.waitForTimeout(15000);
  
  // Verify next area appears
  const firstArea = await page.locator('#area-name').textContent();
  await page.waitForTimeout(15000);
  const secondArea = await page.locator('#area-name').textContent();
  
  expect(firstArea).not.toBe(secondArea);
});
```

---

## Deployment

### Static Hosting (Netlify, Vercel, GitHub Pages)

```bash
# Build step not required - deploy public/ folder directly

# Netlify
netlify deploy --dir=public --prod

# Vercel
vercel --prod public

# GitHub Pages (via gh-pages branch)
git subtree push --prefix public origin gh-pages
```

### Configuration

No environment variables or build configuration needed. Everything runs in the browser.

---

## Troubleshooting

### Audio Not Playing

**Problem**: No sound after clicking "Begin Transmission"

**Solutions**:
1. Check browser console for errors
2. Verify browser supports Web Speech API (chrome://flags)
3. Ensure volume is not muted
4. Try different browser (Safari has limited voice selection)
5. Check if voices loaded: `speechSynthesis.getVoices()`

### Visual Effects Not Animating

**Problem**: Background is static, no blur/hue changes

**Solutions**:
1. Verify CSS filters supported in browser
2. Check canvas element is visible (not `display: none`)
3. Open DevTools Performance tab to check frame rate
4. Reduce canvas size if performance is poor

### Buffer Underruns (Gaps in Audio)

**Problem**: Pauses between reports longer than 1 second

**Solutions**:
1. Increase buffer size in `src/core/buffer.js` (from 5 to 7)
2. Check generation performance (should be <100ms)
3. Verify no blocking operations in main thread

### Memory Leaks During Long Sessions

**Problem**: Page slows down after 30+ minutes

**Solutions**:
1. Check WeatherReport objects are dereferenced after playback
2. Verify Canvas contexts are not accumulating
3. Use Chrome DevTools Memory profiler to identify leaks
4. Ensure event listeners are removed properly

---

## Performance Benchmarks

Target metrics (from specification):

- **Audio generation**: <100ms per report ✓
- **Frame rate**: 60 fps sustained ✓
- **CPU usage**: <30% during playback ✓
- **Memory**: Stable over 30-minute sessions (< 50MB growth) ✓

Measure with:
```javascript
// In browser console
performance.mark('gen-start');
const report = generateWeatherReport();
performance.mark('gen-end');
performance.measure('generation', 'gen-start', 'gen-end');
console.log(performance.getEntriesByName('generation')[0].duration);
```

---

## Additional Resources

- [Web Speech API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Web Audio API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Canvas API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Page Visibility API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)

---

## Next Steps

1. ✅ Read specification: [spec.md](spec.md)
2. ✅ Review implementation plan: [plan.md](plan.md)
3. ✅ Understand data model: [data-model.md](data-model.md)
4. ✅ Study module contracts: [contracts/module-interfaces.md](contracts/module-interfaces.md)
5. **→ Start implementing**: Use `/speckit.tasks` to break down into concrete tasks
6. **Write tests first**: Follow TDD approach for each module
7. **Run locally**: Test in browser continuously during development
8. **Deploy**: Push to static hosting when tests pass

**Ready to build?** Run `/speckit.tasks` to generate the implementation task list!
