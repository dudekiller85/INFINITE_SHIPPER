# Research: The Infinite Shipping Forecast

**Date**: 31 January 2026  
**Feature**: 001-infinite-shipping-forecast

## Research Tasks

### 1. Web Speech API Voice Selection & Availability

**Decision**: Use SpeechSynthesisUtterance with explicit UK English voice preference, fallback to default

**Rationale**:
- Web Speech API is natively supported in all modern browsers (Chrome, Firefox, Safari, Edge)
- Voice selection varies by browser and OS, but UK English voices are widely available:
  - Chrome/Edge (Windows/Mac): "Microsoft George" or "Google UK English Male/Female"
  - Safari (Mac): "Daniel" (UK), "Kate" (UK)
  - Firefox: Uses OS voices
- Calm, authoritative delivery achieved through rate (0.9-1.0) and pitch (0.9-1.1) adjustments
- No external dependencies or API keys required

**Alternatives Considered**:
- Pre-recorded audio: Rejected due to combinatorial explosion (38 areas × hundreds of weather combinations)
- Third-party TTS APIs (Google Cloud TTS, Amazon Polly): Rejected due to latency, cost, and offline requirement
- AudioWorklet with custom synthesis: Rejected as overly complex for speech generation

### 2. Web Audio API Filtering Best Practices

**Decision**: Use BiquadFilterNode for bandpass (300-3000Hz) + GainNode with buffer source for white noise

**Rationale**:
- BiquadFilterNode is hardware-accelerated and provides precise frequency control
- Bandpass filter with 300-3000Hz range accurately simulates AM radio frequency response
- White noise generation via AudioBuffer with random samples is lightweight and performs well
- GainNode at 0.02 provides subtle static without masking speech
- All nodes connect in series: Source → Filter → Gain → Destination

**Alternatives Considered**:
- ConvolverNode with impulse response: Rejected as overkill for simple bandpass filtering
- Multiple cascaded filters: Rejected as single BiquadFilterNode is sufficient
- Pre-generated audio files for static: Rejected due to seamless looping challenges

### 3. Canvas Animation Performance Optimization

**Decision**: RequestAnimationFrame loop with CSS transforms for blur/hue, Canvas for oscilloscope

**Rationale**:
- CSS filter properties (blur, hue-rotate) are GPU-accelerated and perform at 60fps
- CSS animations handle gradual transitions (10s blur oscillation, 60s hue rotation) efficiently
- Canvas oscilloscope uses single path drawing with requestAnimationFrame throttling
- AnalyserNode provides frequency data (FFT) for oscilloscope without performance impact
- Separation of concerns: CSS for background effects, Canvas for real-time frequency visualization

**Alternatives Considered**:
- Full Canvas rendering for all visuals: Rejected due to unnecessary CPU overhead for static effects
- SVG filters: Rejected due to poorer performance than CSS filters on complex backgrounds
- WebGL: Rejected as overkill for simple 2D effects

### 4. Report Generation Buffer Strategy

**Decision**: Queue-based generator maintaining 3-5 pre-generated reports using async generator pattern

**Rationale**:
- Async generators provide clean syntax for continuous report production
- Buffer size 3-5 balances memory (5 reports ≈ 1KB) vs. generation timing safety margin
- Generation is synchronous (string template + random selection) taking <10ms
- Buffer refill triggers when queue drops to 2 reports, ensuring smooth playback
- No blocking: generation happens during 1-second pauses between reports

**Alternatives Considered**:
- Just-in-time generation: Rejected due to potential audio gaps if generation lags
- Large pre-generation (50+ reports): Rejected as wasteful and reduces randomness feel
- Worker thread generation: Rejected as unnecessary given <10ms generation time

### 5. Browser API Compatibility Detection

**Decision**: Feature detection on page load with graceful error UI, no polyfills

**Rationale**:
- Check window.speechSynthesis and window.AudioContext existence before initialization
- Display clear error message if APIs missing: "This experience requires modern browser support"
- No progressive enhancement: Art piece requires full feature set to maintain artistic integrity
- All target browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) natively support both APIs
- Mobile browser support varies; error message directs to desktop/tablet

**Alternatives Considered**:
- Polyfills: None available for Web Speech API (requires native OS TTS)
- Graceful degradation: Rejected as visual-only or audio-only experience loses artistic intent
- Browser detection by user agent: Rejected in favor of feature detection (more reliable)

### 6. Tab Focus Tracking & Unsettling Messages

**Decision**: Page Visibility API + setTimeout for 60-second threshold, random message selection

**Rationale**:
- document.hidden and visibilitychange event reliably detect tab backgrounding across browsers
- 60-second timer starts on visibility loss, resets on visibility gain
- Message pool (10-15 phrases) selected randomly after threshold
- Messages inserted between area reports using same speech synthesis pipeline
- Timer persists across multiple background/foreground cycles within same session

**Alternatives Considered**:
- Immediate unsettling messages: Rejected as too aggressive, users expect brief tab switches
- Web Workers for background timing: Unnecessary, setTimeout continues reliably when backgrounded
- Different voices for messages: Rejected to maintain tonal consistency

### 7. Phantom Area Probability Implementation

**Decision**: Math.random() < 0.02 check before each area selection, cryptographically secure not required

**Rationale**:
- Standard Math.random() provides sufficient pseudo-randomness for artistic effect
- 2% probability (1 in 50) means ~1 phantom per full cycle (31 standard areas)
- Simple conditional: `if (Math.random() < 0.02) selectPhantomArea() else selectStandardArea()`
- No seeding required; randomness per session is acceptable and enhances uniqueness
- Statistical validation: Over 100 reports, expect 1-3 phantom areas

**Alternatives Considered**:
- Crypto.getRandomValues: Rejected as overkill for non-security use case
- Fixed intervals: Rejected as too predictable and breaks immersion
- Weighted selection after N standard areas: Rejected as adds unnecessary complexity

### 8. State Management for Toggle Button

**Decision**: Simple boolean flag (isPlaying) in module-level state, direct DOM updates

**Rationale**:
- Single boolean tracks transmission state: false (stopped) → true (playing)
- Button click handler toggles state and updates button text ("Begin Transmission" ↔ "Stop Transmission")
- State controls: audio context resume/suspend, speech synthesis cancel, animation loops
- No framework needed: vanilla JavaScript state management is sufficient for single-page app
- Event bus pattern for cross-component coordination (button → audio → visuals)

**Alternatives Considered**:
- State management library (Redux, MobX): Rejected as overkill for 2-state system
- Multiple state variables: Consolidated into single source of truth (isPlaying)
- localStorage persistence: Rejected as state should reset on page reload (fresh experience)

### 9. Area Shuffling Algorithm

**Decision**: Fisher-Yates shuffle implemented in JavaScript, triggered after full cycle completion

**Rationale**:
- Fisher-Yates provides uniform random permutation in O(n) time with O(1) space
- Shuffle triggered when area index reaches 31 (all standard areas broadcast)
- Maintains separate tracking for standard areas vs. phantom areas (2% per-report probability)
- Simple implementation: swap each element with random element from remaining unshuffled portion
- Ensures no immediate repeats between cycles

**Alternatives Considered**:
- Sort by random key: Less efficient O(n log n) and potential bias
- Pre-generated permutations: Unnecessarily complex and limits runtime variety
- Weighted shuffle (based on rarity): Rejected to maintain equal BBC area importance

### 10. Testing Strategy for Async Audio/Visual Systems

**Decision**: Jest for unit tests (pure functions), Playwright for integration (browser automation)

**Rationale**:
- Jest handles synchronous logic: report generation, area selection, shuffle algorithm, buffer management
- Playwright provides real browser environment for:
  - Web Audio API interactions
  - Web Speech API synthesis
  - Visual rendering (Canvas, CSS animations)
  - Page Visibility API timing
- Mock Web APIs in Jest for unit testing business logic independently
- Playwright tests validate end-to-end user scenarios from spec acceptance criteria
- CI-ready: Both frameworks support headless execution

**Alternatives Considered**:
- Cypress: Rejected due to better Playwright support for Web Audio/Speech APIs
- Manual testing only: Rejected as insufficient for continuous integration
- Selenium: Rejected due to more verbose API and slower execution than Playwright

## Unknowns Resolution Summary

All technical uncertainties from the specification have been resolved:
- ✅ Voice selection mechanism defined
- ✅ Audio filtering approach established
- ✅ Visual performance strategy determined
- ✅ Buffering algorithm designed
- ✅ Browser compatibility handling specified
- ✅ Background behavior implementation clarified
- ✅ Probability calculation method chosen
- ✅ State management pattern selected
- ✅ Shuffle algorithm identified
- ✅ Testing tools and strategy confirmed

## Technology Stack Summary

**Core Technologies**:
- JavaScript ES2020+ (native browser)
- Web Audio API (audio processing)
- Web Speech API (text-to-speech)
- Canvas API (oscilloscope visualization)
- CSS3 (background effects, animations)
- Page Visibility API (tab focus tracking)

**Development Tools**:
- Jest (unit testing)
- Playwright (integration testing)
- ESLint (code quality)
- Prettier (code formatting)

**Deployment**:
- Static file hosting (Netlify, Vercel, GitHub Pages, or any web server)
- No build step required (ES modules native support)
- No environment variables or configuration needed
