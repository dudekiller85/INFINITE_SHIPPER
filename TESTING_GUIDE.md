# Testing Guide: Natural Speech Generation

This guide explains how to test the SSML-based natural speech generation system that replaces MP3 concatenation with real-time TTS synthesis.

## Quick Start

### 1. Browser Test (Simplest)

Open the test page:
```bash
open test-natural-speech.html
```

Or navigate to: `file:///Users/petemyall/INFINITE_SHIPPER/test-natural-speech.html`

**What it tests:**
- Module loading and imports
- SSML template generation
- Google Cloud TTS API integration
- Audio playback
- Usage statistics tracking

**Expected behavior:**
- Green checkmarks for all module checks
- Sample weather report displayed
- Generated SSML shown
- Audio plays with BBC Radio 4 cadence (slow, deliberate, ~15s duration)
- Statistics show synthesis time and audio size

---

## 2. Automated Test Suite

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Unit tests for SSML template builder
NODE_OPTIONS=--experimental-vm-modules npx jest tests/unit/ssml-template-builder.test.js

# Integration tests for end-to-end synthesis
NODE_OPTIONS=--experimental-vm-modules npx jest tests/integration/natural-speech-generation.test.js

# Prosody configuration tests
NODE_OPTIONS=--experimental-vm-modules npx jest tests/unit/prosody-config.test.js

# Timing validation tests
NODE_OPTIONS=--experimental-vm-modules npx jest tests/integration/timing-validation.test.js
```

### Test Coverage
```bash
npm test -- --coverage
```

**Current Status:**
- ✅ 37 tests passing
- ✅ 14 SSML template builder tests
- ✅ 6 natural speech generation integration tests
- ✅ 8 prosody config tests
- ✅ 9 timing validation tests

---

## 3. Full Application Test

### Start Development Server
```bash
npm run dev
```

Then open: `http://localhost:8000`

### Test Checklist

1. **Playback Initialization**
   - [ ] Click "Start" button
   - [ ] Audio context activates (check browser console)
   - [ ] First report plays within 2 seconds

2. **Natural Speech Quality**
   - [ ] Voice sounds natural (not robotic)
   - [ ] No perceivable gaps between words
   - [ ] Smooth transitions between forecast components
   - [ ] Area names emphasized strongly
   - [ ] Visibility de-emphasized (softer)

3. **BBC Radio 4 Cadence**
   - [ ] Speaking rate is slow and deliberate (85% of normal)
   - [ ] Long pause after area name (~800ms)
   - [ ] Brief pause after wind direction (~200ms)
   - [ ] Standard pauses between components (~600ms)
   - [ ] Long pause at report end (~1500ms)

4. **Integration**
   - [ ] Reports play continuously without gaps
   - [ ] Each report is unique (different areas/conditions)
   - [ ] Audio caching works (check console for cache hits)
   - [ ] Fallback to legacy synthesizer works (if API fails)

5. **Error Handling**
   - [ ] Invalid API key shows helpful error
   - [ ] Network timeout retries automatically
   - [ ] Continues playing despite individual synthesis failures

---

## 4. Manual Audio Analysis (Optional)

For precise timing measurements:

### Using Audacity (Free)

1. **Record a report:**
   ```bash
   # Play a report and record system audio
   open test-natural-speech.html
   ```

2. **Analyze pauses in Audacity:**
   - Import the recorded audio
   - Use Analyze > Silence Finder
   - Measure pause durations manually

3. **Verify against spec:**
   - After area name: 800ms ±50ms ✓
   - After wind direction: 200ms ±50ms ✓
   - Between components: 600ms ±50ms ✓
   - At report end: 1500ms ±100ms ✓

### Using Browser DevTools

```javascript
// Open browser console and run:
const { SSMLTemplateBuilder } = await import('./src/audio/ssml-template-builder.js');
const builder = new SSMLTemplateBuilder();

// Generate sample report
const report = {
  area: 'Viking',
  isPhantom: false,
  wind: { direction: 'southwesterly', force: 7, gusts: 8 },
  seaState: 'rough',
  weather: 'rain',
  visibility: 'good'
};

const template = builder.build(report);
console.log(template.ssml);
console.log(`Character count: ${template.characterCount}`);
console.log(`Report ID: ${template.reportId}`);
```

**Expected SSML output:**
```xml
<speak>
  <prosody rate="85%">
    <emphasis level="strong">Viking</emphasis>
    <break time="800ms"/>
    southwesterly
    <break time="200ms"/>
    7
    <break time="600ms"/>
    increasing 8
    <break time="600ms"/>
    rough
    <break time="600ms"/>
    rain
    <break time="600ms"/>
    <emphasis level="reduced">good</emphasis>
    <break time="600ms"/>
    <break time="1500ms"/>
  </prosody>
</speak>
```

---

## 5. Performance Testing

### Synthesis Speed (FR-003)
```bash
# Test synthesis timing
node -e "
const { performance } = require('perf_hooks');
// Run synthesis 10 times and measure
"
```

**Expected:** <2000ms per report (95th percentile)

### Cache Effectiveness
```javascript
// In browser console after playing several reports:
const stats = audioPlayer.getSynthesisStats();
console.log(stats);
```

**Expected output:**
```javascript
{
  totalReports: 10,
  cacheHits: 5,
  cacheMisses: 5,
  cacheHitRate: "50.0",
  synthesisErrors: 0,
  averageSynthesisTime: 1200,
  ttsStats: {
    requestCount: 5,
    successCount: 5,
    failureCount: 0,
    characterCount: 2500,
    estimatedCost: 0.04
  }
}
```

---

## 6. API Key Setup (Required for Real Testing)

The test page uses Google Cloud TTS API with key in `src/config.js`.

**Security Note:** The API key is restricted to:
- HTTP referrers: `http://localhost:*/*`
- API: Cloud Text-to-Speech API only
- Daily quota: 10,000 requests

**Already configured:** ✅ API key is in `src/config.js` and `.gitignore` protects it

---

## 7. Troubleshooting

### Issue: "Module not found" errors
**Solution:** Make sure you're using a local server (not file://):
```bash
npm run dev
```

### Issue: No audio plays
**Solution:**
1. Check browser console for errors
2. Verify API key is valid: `cat src/config.js`
3. Try the mock adapter in tests first

### Issue: Audio sounds robotic
**Solution:**
1. Verify SSML includes `<prosody rate="85%">`
2. Check break tags are present
3. Test with Google Cloud voice `en-GB-Neural2-B`

### Issue: Tests fail with "jest not found"
**Solution:**
```bash
npm install
```

### Issue: CORS errors
**Solution:** API key should allow `localhost:*`. Check console restrictions at:
https://console.cloud.google.com/apis/credentials

---

## Expected Results Summary

✅ **Unit Tests:** 37/37 passing
✅ **SSML Generation:** Valid XML with proper prosody markup
✅ **TTS Synthesis:** Natural speech within 2s
✅ **Audio Quality:** No gaps, natural rhythm
✅ **BBC Cadence:** 85% rate with precise pauses
✅ **Caching:** 50%+ hit rate after warmup
✅ **Error Handling:** Graceful fallback on failures

---

## Next Steps

After validating the MVP (User Stories 1+4), you can optionally implement:

- **Phase 5:** User Story 2 - Phantom area effects (pitch distortion)
- **Phase 6:** User Story 3 - Audio caching optimization
- **Production:** Deploy with proper API key management
