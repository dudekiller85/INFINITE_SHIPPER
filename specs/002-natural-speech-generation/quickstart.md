# Quickstart Guide: Natural Speech Generation

**Feature**: Natural Speech Generation for Shipping Forecast
**Date**: 2026-02-01
**Audience**: Developers implementing this feature

## Overview

This guide walks you through setting up, testing, and integrating SSML-based natural speech generation into The Infinite Shipping Forecast. By the end, you'll have working code that transforms weather reports into BBC-quality audio.

**Estimated Setup Time**: 30 minutes

---

## Prerequisites

### Required Knowledge
- JavaScript ES6+ (async/await, classes, modules)
- Web Audio API basics
- SSML (Speech Synthesis Markup Language) - we'll teach you
- Git and npm

### Required Tools
- Node.js 18+ (for development tools)
- Modern browser (Chrome 90+, Safari 14+, or Firefox 88+)
- Google Cloud account with Text-to-Speech API enabled
- Text editor (VS Code recommended)

### Required Files
- `/src/core/generator.js` - Weather report generator (already exists)
- `/src/audio/player.js` - Audio playback (already exists)
- Google Cloud API key (you'll create this)

---

## Step 1: Get Google Cloud API Key (5 minutes)

### Create API Key

1. **Visit Google Cloud Console**: https://console.cloud.google.com/
2. **Create or select project**: "Infinite Shipping Forecast"
3. **Enable Text-to-Speech API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Cloud Text-to-Speech API"
   - Click "Enable"

4. **Create API Key**:
   - Navigate to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the key (e.g., `AIzaSyDtQveOIMcqrZVKnDscu-tuZ3da_D0ZG3U`)

5. **Restrict API Key** (important for security):
   - Click "Restrict Key"
   - **Application restrictions**: HTTP referrers
     - Add: `http://localhost:*/*` (for development)
     - Add: `https://yourdomain.com/*` (for production)
   - **API restrictions**: Cloud Text-to-Speech API
   - **Quota**: Set daily limit to 10,000 requests (optional, ~$24/day max)
   - Click "Save"

### Store API Key

Create `/src/config.js`:

```javascript
// DO NOT COMMIT THIS FILE TO GIT
// Add to .gitignore: src/config.js

export const TTS_API_KEY = 'AIzaSyDtQveOIMcqrZVKnDscu-tuZ3da_D0ZG3U';
```

Add to `.gitignore`:

```bash
# API keys
src/config.js
```

---

## Step 2: Install Dependencies (2 minutes)

No new dependencies needed! The feature uses:
- **Fetch API** (built into browsers)
- **Web Audio API** (already used in project)
- **ES6 modules** (already configured)

Verify existing setup:

```bash
npm install           # Install existing dev dependencies
npm run test          # Ensure Jest works
```

---

## Step 3: Create Core Modules (10 minutes)

### 3.1 Prosody Configuration

Create `/src/audio/prosody-config.js`:

```javascript
/**
 * BBC Radio 4 prosody rules for shipping forecast
 * Based on FR-014, FR-019-030 from specification
 */

export const PROSODY_CONFIG = {
  // Speaking rates (FR-014)
  rates: {
    standard: 0.85,      // 85% for standard areas
    phantom: 0.9         // 90% for phantom (additional to pitch)
  },
  
  // Pause durations (FR-020 through FR-025)
  breaks: {
    afterAreaName: '800ms',
    afterWindDirection: '200ms',
    afterWindForce: '600ms',
    afterSeaState: '600ms',
    afterWeather: '600ms',
    afterVisibility: '600ms',
    endOfReport: '1500ms'
  },
  
  // Emphasis levels (FR-019, FR-026)
  emphasis: {
    areaName: 'strong',
    visibility: 'reduced',
    default: 'moderate'
  },
  
  // Phantom area effects (FR-027, FR-028)
  phantom: {
    speedMultiplier: 0.9,    // 10% slower
    pitchContour: {
      start: '+0%',          // Area name: normal
      middle: '-12%',        // Wind/sea: maximum drop
      end: '-6%'             // Visibility/pressure: partial recovery
    }
  }
};
```

### 3.2 SSML Template Builder

Create `/src/audio/ssml-template-builder.js`:

```javascript
import { PROSODY_CONFIG } from './prosody-config.js';

/**
 * Builds SSML templates from weather report objects
 */
export class SSMLTemplateBuilder {
  /**
   * Build SSML template from weather report
   * @param {Object} report - Weather report from generator.js
   * @returns {Object} SSMLTemplate object
   */
  build(report) {
    const isPhantom = report.area.type === 'phantom';
    const ssmlParts = [];
    
    // Open root <speak> tag
    ssmlParts.push('<speak>');
    
    // Phantom areas: wrap in speed/pitch adjustment
    if (isPhantom) {
      ssmlParts.push(`<prosody rate="${PROSODY_CONFIG.rates.phantom}" pitch="${PROSODY_CONFIG.phantom.pitchContour.middle}">`);
    }
    
    // Area name (always start with normal pitch, even for phantoms)
    ssmlParts.push('<prosody pitch="+0%">');
    ssmlParts.push(`<emphasis level="${PROSODY_CONFIG.emphasis.areaName}">${this._escape(report.area.name)}.</emphasis>`);
    ssmlParts.push(`<break time="${PROSODY_CONFIG.breaks.afterAreaName}"/>`);
    ssmlParts.push('</prosody>');
    
    // Wind components (at standard rate)
    ssmlParts.push(`<prosody rate="${PROSODY_CONFIG.rates.standard}">`);
    ssmlParts.push(this._buildWindSSML(report.wind));
    ssmlParts.push('</prosody>');
    
    // Sea state (mid-report pitch drop for phantoms)
    if (isPhantom) {
      ssmlParts.push(`<prosody pitch="${PROSODY_CONFIG.phantom.pitchContour.middle}">`);
    }
    ssmlParts.push(this._buildSeaSSML(report.seaState, report.seaTiming, report.waves));
    if (isPhantom) {
      ssmlParts.push('</prosody>');
    }
    
    // Weather
    ssmlParts.push(this._buildWeatherSSML(report.weather, report.weatherTiming));
    
    // Visibility (partial recovery for phantoms)
    if (isPhantom) {
      ssmlParts.push(`<prosody pitch="${PROSODY_CONFIG.phantom.pitchContour.end}">`);
    }
    ssmlParts.push(`<emphasis level="${PROSODY_CONFIG.emphasis.visibility}">${this._escape(report.visibility)}.</emphasis>`);
    ssmlParts.push(`<break time="${PROSODY_CONFIG.breaks.afterVisibility}"/>`);
    if (isPhantom) {
      ssmlParts.push('</prosody>');
    }
    
    // Pressure (optional)
    if (report.pressure) {
      ssmlParts.push(`${this._escape(report.pressure)}.`);
    }
    
    // End of report pause
    ssmlParts.push(`<break time="${PROSODY_CONFIG.breaks.endOfReport}"/>`);
    
    // Close phantom prosody wrapper
    if (isPhantom) {
      ssmlParts.push('</prosody>');
    }
    
    // Close root <speak> tag
    ssmlParts.push('</speak>');
    
    const ssml = ssmlParts.join('');
    
    return {
      ssml,
      reportId: this._generateReportId(report),
      areaName: report.area.name,
      isPhantom,
      characterCount: ssml.length,
      createdAt: new Date()
    };
  }
  
  /**
   * Build SSML for wind components
   * @private
   */
  _buildWindSSML(wind) {
    const parts = [];
    
    // Direction
    parts.push(`${this._escape(wind.direction)}`);
    parts.push(`<break time="${PROSODY_CONFIG.breaks.afterWindDirection}"/>`);
    
    // Force (simple or compound)
    if (Array.isArray(wind.force)) {
      parts.push(`${wind.force[0]} ${wind.connector} ${wind.force[1]}`);
    } else {
      parts.push(`${wind.force}`);
    }
    
    // Behavior, modifier, timing
    if (wind.behavior) parts.push(`, ${wind.behavior.toLowerCase()}`);
    if (wind.modifier) parts.push(`, ${wind.modifier}`);
    if (wind.timing) parts.push(` ${wind.timing}`);
    
    parts.push('.');
    parts.push(`<break time="${PROSODY_CONFIG.breaks.afterWindForce}"/>`);
    
    return parts.join('');
  }
  
  /**
   * Build SSML for sea state
   * @private
   */
  _buildSeaSSML(seaState, seaTiming, waves) {
    const parts = [this._escape(seaState)];
    if (seaTiming) parts.push(` ${seaTiming}`);
    if (waves) parts.push(`, ${waves.toLowerCase()}`);
    parts.push('.');
    parts.push(`<break time="${PROSODY_CONFIG.breaks.afterSeaState}"/>`);
    return parts.join('');
  }
  
  /**
   * Build SSML for weather
   * @private
   */
  _buildWeatherSSML(weather, weatherTiming) {
    const parts = [this._escape(weather)];
    if (weatherTiming) parts.push(` ${weatherTiming}`);
    parts.push('.');
    parts.push(`<break time="${PROSODY_CONFIG.breaks.afterWeather}"/>`);
    return parts.join('');
  }
  
  /**
   * Escape special XML characters
   * @private
   */
  _escape(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
  
  /**
   * Generate unique report ID
   * @private
   */
  _generateReportId(report) {
    const str = `${report.area.name}-${report.timestamp}`;
    return btoa(str).substring(0, 16); // Simple base64 hash
  }
}
```

---

## Step 4: Test SSML Generation (3 minutes)

Create `/tests/unit/ssml-template-builder.test.js`:

```javascript
import { SSMLTemplateBuilder } from '../../src/audio/ssml-template-builder.js';

describe('SSMLTemplateBuilder', () => {
  let builder;
  
  beforeEach(() => {
    builder = new SSMLTemplateBuilder();
  });
  
  it('should generate valid SSML for standard area', () => {
    const report = {
      area: {name: 'Viking', type: 'standard'},
      wind: {direction: 'Southwesterly', force: 7, connector: null, behavior: null, modifier: null, timing: null},
      seaState: 'Rough',
      seaTiming: null,
      waves: null,
      weather: 'Rain',
      weatherTiming: null,
      visibility: 'Good',
      visibilityTiming: null,
      pressure: null,
      timestamp: '2026-02-01T15:00:00Z'
    };
    
    const template = builder.build(report);
    
    expect(template.ssml).toContain('<speak>');
    expect(template.ssml).toContain('</speak>');
    expect(template.ssml).toContain('Viking');
    expect(template.ssml).toContain('<break time="800ms"/>');
    expect(template.areaName).toBe('Viking');
    expect(template.isPhantom).toBe(false);
    expect(template.characterCount).toBeGreaterThan(100);
  });
  
  it('should apply phantom prosody for phantom areas', () => {
    const report = {
      area: {name: 'The Void', type: 'phantom'},
      wind: {direction: 'Variable', force: 4, connector: null, behavior: null, modifier: null, timing: null},
      seaState: 'Slight',
      seaTiming: null,
      waves: null,
      weather: 'Fog',
      weatherTiming: null,
      visibility: 'Poor',
      visibilityTiming: null,
      pressure: null,
      timestamp: '2026-02-01T15:00:00Z'
    };
    
    const template = builder.build(report);
    
    expect(template.ssml).toContain('pitch="-12%"');
    expect(template.isPhantom).toBe(true);
  });
});
```

Run tests:

```bash
npm run test -- ssml-template-builder.test.js
```

Expected output: `✓ should generate valid SSML for standard area` ✓ `should apply phantom prosody for phantom areas`

---

## Step 5: Implement TTS Service Adapter (10 minutes)

Create `/src/audio/tts-service-adapter.js`:

```javascript
import { TTS_API_KEY } from '../config.js';

/**
 * Google Cloud Text-to-Speech API adapter
 */
export class GoogleCloudTTSAdapter {
  constructor(config = {}) {
    this.apiKey = config.apiKey || TTS_API_KEY;
    this.timeout = config.timeout || 5000;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 100;
    
    // Usage tracking
    this.stats = {
      requestCount: 0,
      successCount: 0,
      failureCount: 0,
      characterCount: 0,
      lastRequestAt: null,
      totalLatency: 0
    };
  }
  
  /**
   * Synthesize SSML template into audio
   * @param {Object} ssmlTemplate - SSML template object
   * @returns {Promise<Object>} GeneratedAudio object
   */
  async synthesize(ssmlTemplate) {
    const startTime = Date.now();
    this.stats.requestCount++;
    
    try {
      const response = await this._callAPI(ssmlTemplate.ssml);
      const audioBuffer = await this._decodeAudio(response.audioContent);
      
      this.stats.successCount++;
      this.stats.characterCount += ssmlTemplate.characterCount;
      this.stats.lastRequestAt = new Date();
      this.stats.totalLatency += Date.now() - startTime;
      
      return {
        audioBuffer,
        audioBlob: this._base64ToBlob(response.audioContent),
        base64Audio: response.audioContent,
        reportId: ssmlTemplate.reportId,
        areaName: ssmlTemplate.areaName,
        isPhantom: ssmlTemplate.isPhantom,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        fileSize: Math.ceil(response.audioContent.length * 0.75), // Approximate decoded size
        synthesizedAt: new Date(),
        cachedAt: null
      };
    } catch (error) {
      this.stats.failureCount++;
      throw error;
    }
  }
  
  /**
   * Call Google Cloud TTS API
   * @private
   */
  async _callAPI(ssml, attempt = 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          signal: controller.signal,
          body: JSON.stringify({
            input: {ssml},
            voice: {
              languageCode: 'en-GB',
              name: 'en-GB-Neural2-B',
              ssmlGender: 'MALE'
            },
            audioConfig: {
              audioEncoding: 'MP3',
              sampleRateHertz: 24000,
              effectsProfileId: ['headphone-class-device']
            }
          })
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`TTS API error: ${error.error.message}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Retry on transient errors
      if (attempt < this.retryAttempts && this._isRetryable(error)) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        return this._callAPI(ssml, attempt + 1);
      }
      
      throw error;
    }
  }
  
  /**
   * Decode base64 MP3 to AudioBuffer
   * @private
   */
  async _decodeAudio(base64Audio) {
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    return await audioContext.decodeAudioData(bytes.buffer);
  }
  
  /**
   * Convert base64 to Blob
   * @private
   */
  _base64ToBlob(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], {type: 'audio/mpeg'});
  }
  
  /**
   * Check if error is retryable
   * @private
   */
  _isRetryable(error) {
    return error.name === 'AbortError' || error.message.includes('network');
  }
  
  /**
   * Get usage statistics
   * @returns {Object} Usage stats
   */
  getUsageStats() {
    return {
      ...this.stats,
      estimatedCost: (this.stats.characterCount / 1000000) * 16, // $16 per million
      averageLatency: this.stats.requestCount > 0 
        ? this.stats.totalLatency / this.stats.requestCount 
        : 0
    };
  }
}
```

---

## Step 6: Test End-to-End (5 minutes)

Create test HTML page `/test-natural-speech.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Test Natural Speech</title>
</head>
<body>
  <h1>Natural Speech Generation Test</h1>
  <button id="testBtn">Generate & Play Report</button>
  <pre id="output"></pre>
  
  <script type="module">
    import { weatherGenerator } from './src/core/generator.js';
    import { SSMLTemplateBuilder } from './src/audio/ssml-template-builder.js';
    import { GoogleCloudTTSAdapter } from './src/audio/tts-service-adapter.js';
    
    const builder = new SSMLTemplateBuilder();
    const tts = new GoogleCloudTTSAdapter();
    const audioContext = new AudioContext();
    
    document.getElementById('testBtn').addEventListener('click', async () => {
      const output = document.getElementById('output');
      output.textContent = 'Generating report...\\n';
      
      try {
        // 1. Generate report
        const report = weatherGenerator.generateWeatherReport();
        output.textContent += `Report: ${report.text}\\n\\n`;
        
        // 2. Build SSML
        const template = builder.build(report);
        output.textContent += `SSML (${template.characterCount} chars):\\n${template.ssml.substring(0, 200)}...\\n\\n`;
        
        // 3. Synthesize
        output.textContent += 'Synthesizing...\\n';
        const audio = await tts.synthesize(template);
        output.textContent += `Generated: ${audio.duration.toFixed(1)}s, ${audio.fileSize} bytes\\n\\n`;
        
        // 4. Play
        const source = audioContext.createBufferSource();
        source.buffer = audio.audioBuffer;
        source.connect(audioContext.destination);
        source.start();
        
        output.textContent += 'Playing...\\n';
        
        // 5. Stats
        const stats = tts.getUsageStats();
        output.textContent += `\\nStats: ${stats.requestCount} requests, ${stats.characterCount} chars, $${stats.estimatedCost.toFixed(4)} cost\\n`;
        
      } catch (error) {
        output.textContent += `\\nError: ${error.message}\\n`;
      }
    });
  </script>
</body>
</html>
```

**Test it**:

```bash
npx http-server -p 8000
# Open http://localhost:8000/test-natural-speech.html
# Click "Generate & Play Report"
```

Expected: You'll hear a natural BBC-style weather report with proper pauses!

---

## Step 7: Integrate into Main Application

Update `/src/audio/player.js` to use natural speech:

```javascript
import { SSMLTemplateBuilder } from './ssml-template-builder.js';
import { GoogleCloudTTSAdapter } from './tts-service-adapter.js';
import { LibrarySynthesizer } from './library-synthesizer.js'; // Fallback

export class AudioPlayer {
  constructor(audioContext) {
    this.audioContext = audioContext;
    
    // Initialize synthesizers
    this.ssmlBuilder = new SSMLTemplateBuilder();
    this.ttsAdapter = new GoogleCloudTTSAdapter();
    
    // Fallback synthesizer
    this.fallbackSynthesizer = new LibrarySynthesizer(audioContext);
    
    // State
    this.useFallback = false;
    this.failureCount = 0;
  }
  
  async playReport(report) {
    if (this.useFallback) {
      return this.fallbackSynthesizer.speakReport(report);
    }
    
    try {
      // Build SSML
      const template = this.ssmlBuilder.build(report);
      
      // Synthesize
      const audio = await this.ttsAdapter.synthesize(template);
      
      // Play
      await this._playAudioBuffer(audio.audioBuffer);
      
      // Reset failure count on success
      this.failureCount = 0;
      
    } catch (error) {
      console.error('Natural speech synthesis failed:', error);
      this.failureCount++;
      
      // Switch to fallback after 3 failures
      if (this.failureCount >= 3) {
        console.warn('Switching to MP3 fallback mode');
        this.useFallback = true;
        return this.playReport(report); // Retry with fallback
      }
      
      throw error;
    }
  }
  
  async _playAudioBuffer(audioBuffer) {
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.radioFilter.inputGain); // Connect to existing filter chain
    source.start();
    
    return new Promise(resolve => {
      source.onended = resolve;
    });
  }
}
```

---

## Troubleshooting

### Problem: 401 Authentication Error

**Cause**: Invalid API key or not enabled

**Solution**:
1. Verify API key in `/src/config.js`
2. Check Google Cloud Console → APIs & Services → Text-to-Speech is enabled
3. Verify API key restrictions allow `http://localhost:8000`

### Problem: CORS Error

**Cause**: Browser blocking cross-origin request

**Solution**:
1. Check browser console for specific CORS error
2. Verify API key restrictions in Google Cloud Console
3. Google Cloud TTS should allow CORS by default - if not, you may need a proxy server

### Problem: Audio Doesn't Play

**Cause**: AudioContext not created after user interaction

**Solution**:
```javascript
// AudioContext must be created AFTER user clicks button
document.getElementById('startBtn').addEventListener('click', () => {
  const audioContext = new AudioContext();
  // Now initialize player...
});
```

### Problem: Pause Timings Seem Wrong

**Cause**: Timing variance is normal (±50ms)

**Solution**:
- Use audio analysis tool (Audacity) to measure actual pauses
- Variance of ±50ms is within specification
- If consistently outside tolerance, adjust PROSODY_CONFIG values

---

## Next Steps

1. **Implement Caching**: Add `AudioCache` class to reduce API costs
2. **Add Metrics**: Track usage stats, display in UI
3. **Tune Prosody**: Adjust timing/emphasis based on listener feedback
4. **Write Tests**: Complete test coverage for all modules
5. **Performance**: Implement pre-buffering for seamless playback

---

## Resources

- **Google Cloud TTS Docs**: https://cloud.google.com/text-to-speech/docs
- **SSML Reference**: https://www.w3.org/TR/speech-synthesis11/
- **Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **Feature Specification**: [spec.md](spec.md)
- **Implementation Plan**: [plan.md](plan.md)
- **API Contracts**: [contracts/](contracts/)

---

## Getting Help

**Common Issues**: Check [Troubleshooting](#troubleshooting) section above

**API Questions**: See [contracts/tts-service.interface.md](contracts/tts-service.interface.md)

**Specification Questions**: See [spec.md](spec.md)

**Bug Reports**: Check console for errors, include full error message when asking for help
