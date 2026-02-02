# Audio Library Setup Guide

This guide explains how to generate and use the high-quality TTS audio library for The Infinite Shipping Forecast.

## Overview

Instead of using the browser's Web Speech API (which has variable quality and robotic voices), we'll use Google Cloud Text-to-Speech to pre-generate all audio components, then play them back by concatenating audio files.

**Benefits:**
- ✨ Professional BBC-quality UK voice
- 🎯 Consistent across all browsers/platforms
- 🚀 Lower latency (no real-time synthesis)
- 💰 Very low cost (~$0.50-2.00 one-time)
- 📦 Works offline after initial load

## Step 1: Generate the Audio Library

### Prerequisites

1. **Google Cloud Account Setup** (5 minutes):
   - Go to https://console.cloud.google.com/
   - Create a new project (or select existing)
   - Enable the Text-to-Speech API:
     - Search for "Text-to-Speech API"
     - Click "Enable"
   - Create an API key:
     - Go to "APIs & Services" → "Credentials"
     - Click "Create Credentials" → "API Key"
     - Copy the API key

2. **Node.js**: Ensure you have Node.js installed (v14+)

### Generate Audio Files

Run the generation script:

```bash
node generate-audio-library.js YOUR_API_KEY
```

This will create approximately **150 audio files** organized in `/public/audio/`:

```
public/audio/
├── areas/ (38 files: 31 standard + 7 phantom)
├── wind/
│   ├── directions/ (10 files)
│   ├── behaviors/ (4 files)
│   └── forces/ (9 files: force 4-12)
├── sea/ (8 files)
├── weather/ (8 files)
├── visibility/ (8 files)
├── unsettling/ (12 files)
└── pauses/ (2 files: 500ms, 1000ms)
```

**Generation time:** ~5-10 minutes (with rate limiting)
**Total size:** ~5-8 MB
**Cost:** ~$0.50-2.00 (very approximate)

## Step 2: Update Your Application

### Option A: Keep Web Speech API as Fallback

You can update the audio player to try the library first, then fall back to Web Speech API if audio files aren't available.

### Option B: Switch Completely to Audio Library

Replace the synthesizer in [src/audio/player.js](src/audio/player.js):

```javascript
// OLD (Web Speech API):
import { speechSynthesizer } from './synthesizer.js';

// NEW (Audio Library):
import { LibrarySynthesizer } from './library-synthesizer.js';

// In your player initialization:
this.synthesizer = new LibrarySynthesizer(this.audioContext);
```

### Update the Player

The LibrarySynthesizer has a slightly different API:

```javascript
// OLD:
await speechSynthesizer.speakReport(report, { rate: 0.9 });

// NEW:
await synthesizer.speakReport(report, {
  destination: this.radioFilter.inputGain // GainNode to connect to
});
```

### Key Differences

| Feature | Web Speech API | Audio Library |
|---------|---------------|---------------|
| Voice Quality | Variable (robotic) | Professional neural TTS |
| Browser Support | Built-in | Requires audio files |
| Setup | None | One-time generation |
| Cost | Free | ~$0.50-2.00 one-time |
| Offline | Yes | Yes (after initial load) |
| Latency | Higher | Lower |

## Step 3: Test the Integration

1. **Check audio files exist:**
   ```bash
   ls public/audio/areas/
   ```

2. **Start your development server:**
   ```bash
   # Your existing dev server command
   npm start
   # or
   python -m http.server 8000
   ```

3. **Test playback:**
   - Click "Begin Transmission"
   - Listen for high-quality UK voice
   - Check browser console for any loading errors

4. **Monitor performance:**
   ```javascript
   // In browser console:
   console.log(synthesizer.getCacheInfo());
   ```

## Troubleshooting

### Audio files not loading

**Error:** `Failed to load audio: /audio/areas/viking.mp3`

**Solution:** Ensure the `/public/audio/` directory is being served by your web server:
- Check file paths match the URL structure
- Verify CORS headers if serving from different domain
- Check browser network tab for 404 errors

### High memory usage

**Issue:** Browser using too much memory

**Solution:** The audio library caches files in memory. For lower memory footprint:
```javascript
// Clear cache after each report (trades memory for loading time)
synthesizer.clearCache();
```

### Slow initial load

**Issue:** First report takes a while to play

**Solution:** Preload audio for the first few reports:
```javascript
// In your buffer/player initialization:
const upcomingReports = buffer.getNextReports(5);
await synthesizer.preloadReports(upcomingReports);
```

## Voice Customization

### Change Voice

Edit [generate-audio-library.js](generate-audio-library.js):

```javascript
// Current voice (UK Male Neural):
const VOICE_CONFIG = {
  languageCode: 'en-GB',
  name: 'en-GB-Neural2-B',
  ssmlGender: 'MALE'
};

// Try UK Female Neural:
const VOICE_CONFIG = {
  languageCode: 'en-GB',
  name: 'en-GB-Neural2-A',
  ssmlGender: 'FEMALE'
};
```

Available UK voices:
- `en-GB-Neural2-A` - Female (Neural2)
- `en-GB-Neural2-B` - Male (Neural2)
- `en-GB-Neural2-C` - Female (Neural2)
- `en-GB-Wavenet-A` - Female (Wavenet)
- `en-GB-Wavenet-B` - Male (Wavenet)

Full list: https://cloud.google.com/text-to-speech/docs/voices

### Adjust Speaking Rate

```javascript
const AUDIO_CONFIG = {
  audioEncoding: 'MP3',
  speakingRate: 0.95, // Slightly slower (0.25 to 4.0)
  pitch: 0.0          // Default pitch (-20.0 to 20.0)
};
```

After changes, re-run the generation script.

## Cost Optimization

### Estimated Costs

Google Cloud TTS pricing (as of 2026):
- Neural2 voices: $16 per 1 million characters
- Wavenet voices: $16 per 1 million characters
- Standard voices: $4 per 1 million characters

**For this project (~150 files, ~50 characters average):**
- Total characters: ~7,500
- Cost: ~$0.12 with Neural2
- With longer messages: ~$0.50-2.00

### Free Tier

Google Cloud offers $300 in free credits for new accounts, which covers thousands of generations.

## Next Steps

After successful integration:

1. **Delete old synthesizer** (optional):
   ```bash
   # If you're not keeping it as fallback:
   rm src/audio/synthesizer.js
   ```

2. **Update imports** throughout your codebase

3. **Test all scenarios**:
   - Standard areas
   - Phantom areas (check 10% slowdown effect)
   - Unsettling messages
   - Long play sessions (30+ minutes)

4. **Monitor performance**:
   - Check memory usage
   - Verify no audio gaps
   - Test on multiple browsers

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify audio files are being served correctly
3. Test with a simple HTML file first
4. Check Google Cloud TTS quotas and billing

## Reverting to Web Speech API

If you need to revert:

```javascript
// In src/audio/player.js:
import { speechSynthesizer } from './synthesizer.js';

// Use old API:
await speechSynthesizer.speakReport(report, { rate: 0.9 });
```

The old Web Speech API synthesizer is preserved in [src/audio/synthesizer.js](src/audio/synthesizer.js).
