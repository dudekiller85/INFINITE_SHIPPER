/**
 * Google Cloud TTS Audio Library Generator
 * Generates all audio files needed for The Infinite Shipping Forecast
 *
 * Usage: node generate-audio-library.js YOUR_API_KEY
 *
 * This will create ~250+ audio files organized by category:
 * - areas/ (38 files: 31 standard + 7 phantom)
 * - wind/directions/ (10 files)
 * - wind/behaviors/ (4 files)
 * - wind/forces/ (9 files: force 4-12)
 * - wind/modifiers/ (7 files: timing and changes)
 * - sea/ (8 files)
 * - weather/ (8 files)
 * - visibility/ (8 files)
 * - pressure/ (8 complete phrases)
 * - waves/ (3 files for swell conditions)
 * - connectors/ (5 files: or, to, occasionally, etc.)
 * - timing/ (7 files: later, at first, etc.)
 * - numbers/ (100 files: 0-99 for times and measurements)
 * - unsettling/ (12 files)
 * - pauses/ (2 files: 500ms, 1000ms)
 *
 * Estimated cost: ~$1.00-3.00 total
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

const API_KEY = process.argv[2];

if (!API_KEY) {
  console.error('❌ Error: Please provide your Google Cloud API key');
  console.error('Usage: node generate-audio-library.js YOUR_API_KEY');
  process.exit(1);
}

// Voice configuration
const VOICE_CONFIG = {
  languageCode: 'en-GB',
  name: 'en-GB-Neural2-B', // UK Male voice (highest quality)
  ssmlGender: 'MALE'
};

// Audio encoding settings
const AUDIO_CONFIG = {
  audioEncoding: 'MP3',
  speakingRate: 1.0,
  pitch: 0.0
};

// Output directory
const OUTPUT_DIR = './public/audio';

// Audio library structure
const AUDIO_LIBRARY = {
  areas: {
    standard: [
      'Viking',
      'North Utsire',
      'South Utsire',
      'Forties',
      'Cromarty',
      'Forth',
      'Tyne',
      'Dogger',
      'Fisher',
      'German Bight',
      'Humber',
      'Thames',
      'Dover',
      'Wight',
      'Portland',
      'Plymouth',
      'Biscay',
      'Trafalgar',
      'FitzRoy',
      'Sole',
      'Lundy',
      'Fastnet',
      'Irish Sea',
      'Shannon',
      'Rockall',
      'Malin',
      'Hebrides',
      'Bailey',
      'Fair Isle',
      'Faeroes',
      'South-East Iceland'
    ],
    phantom: [
      'The Void',
      'Silence',
      'Elder Bank',
      'Mirror Reach',
      'The Marrow',
      'Still Water',
      'Obsidian Deep'
    ]
  },
  wind: {
    directions: [
      'Northerly',
      'North-easterly',
      'Easterly',
      'South-easterly',
      'Southerly',
      'South-westerly',
      'Westerly',
      'North-westerly',
      'Variable',
      'Cyclonic'
    ],
    behaviors: [
      'Backing',
      'Veering',
      'Becoming variable',
      'Becoming cyclonic'
    ],
    forces: [4, 5, 6, 7, 8, 9, 10, 11, 12] // Force numbers
  },
  sea: [
    'Calm',
    'Smooth',
    'Slight',
    'Moderate',
    'Rough',
    'Very rough',
    'High',
    'Very high'
  ],
  weather: [
    'Fair',
    'Good',
    'Rain',
    'Showers',
    'Drizzle',
    'Fog',
    'Mist',
    'Thunderstorms'
  ],
  visibility: [
    'Excellent',
    'Very good',
    'Good',
    'Moderate',
    'Poor',
    'Very poor',
    'Fog',
    'Dense fog'
  ],
  // NEW: Realistic BBC elements
  timing: [
    'later',
    'at first',
    'for a time',
    'soon',
    'by evening',
    'by midnight',
    'overnight'
  ],
  connectors: [
    'or',
    'to',
    'occasionally',
    'intermittent',
    'then'
  ],
  windModifiers: [
    'increasing',
    'decreasing',
    'backing',
    'veering',
    'becoming',
    'rising',
    'falling'
  ],
  pressure: [
    'Pressure rising',
    'Pressure falling',
    'Pressure steady',
    'Low pressure approaching',
    'High pressure building',
    'Pressure rising slowly',
    'Pressure falling slowly',
    'Ridge of high pressure'
  ],
  waves: [
    'Moderate swell',
    'Heavy swell',
    'Confused sea'
  ],
  unsettling: [
    'Where are you going? The sea waits for no man.',
    'Have you forgotten us?',
    'The forecast continues. Always.',
    'We are still here, even if you are not.',
    'The waves do not pause for you.',
    'Return. The transmission requires a witness.',
    'Your absence changes nothing.',
    'The sea notices your departure.',
    'Still broadcasting. Still waiting.',
    'We continue without you.',
    'The forecast does not sleep.',
    'Distance means nothing to the waves.'
  ]
};

/**
 * Generate audio using Google Cloud TTS API
 */
async function generateAudio(text, voiceConfig, audioConfig, outputFile, slowdown = false) {
  const config = { ...audioConfig };

  // Apply slowdown for phantom areas (10% slower)
  if (slowdown) {
    config.speakingRate = 0.9;
  }

  const requestBody = JSON.stringify({
    input: { text },
    voice: voiceConfig,
    audioConfig: config
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'texttospeech.googleapis.com',
      path: `/v1/text:synthesize?key=${API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`API Error: ${res.statusCode} - ${data}`));
          return;
        }

        try {
          const response = JSON.parse(data);
          const audioContent = Buffer.from(response.audioContent, 'base64');

          fs.writeFileSync(outputFile, audioContent);
          resolve(outputFile);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
}

/**
 * Create directory if it doesn't exist
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Convert text to filename-safe string
 */
function toFilename(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Delay helper for rate limiting
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate silent audio files for pauses
 */
async function generatePauses() {
  console.log('\n📝 Generating pause files...');

  const pauseDir = path.join(OUTPUT_DIR, 'pauses');
  ensureDir(pauseDir);

  // Short pause (500ms) - use a period
  const shortFile = path.join(pauseDir, 'short-500ms.mp3');
  await generateAudio('.', VOICE_CONFIG, AUDIO_CONFIG, shortFile);
  console.log(`   ✅ short-500ms.mp3`);

  await delay(200);

  // Long pause (1000ms) - use two periods
  const longFile = path.join(pauseDir, 'long-1000ms.mp3');
  await generateAudio('..', VOICE_CONFIG, AUDIO_CONFIG, longFile);
  console.log(`   ✅ long-1000ms.mp3`);

  return 2;
}

/**
 * Generate all audio files
 */
async function generateLibrary() {
  console.log('🎙️  Google Cloud TTS Audio Library Generator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let totalFiles = 0;
  let errors = 0;

  // Create base output directory
  ensureDir(OUTPUT_DIR);

  // 1. Generate area names
  console.log('📍 Generating area names...');
  const areasDir = path.join(OUTPUT_DIR, 'areas');
  ensureDir(areasDir);

  // Standard areas
  for (const area of AUDIO_LIBRARY.areas.standard) {
    try {
      const filename = path.join(areasDir, `${toFilename(area)}.mp3`);
      await generateAudio(area, VOICE_CONFIG, AUDIO_CONFIG, filename);
      console.log(`   ✅ ${area}`);
      totalFiles++;
      await delay(200); // Rate limiting
    } catch (error) {
      console.error(`   ❌ ${area}: ${error.message}`);
      errors++;
    }
  }

  // Phantom areas (with slowdown effect)
  for (const area of AUDIO_LIBRARY.areas.phantom) {
    try {
      const filename = path.join(areasDir, `${toFilename(area)}-phantom.mp3`);
      await generateAudio(area, VOICE_CONFIG, AUDIO_CONFIG, filename, true);
      console.log(`   ✅ ${area} (phantom)`);
      totalFiles++;
      await delay(200);
    } catch (error) {
      console.error(`   ❌ ${area}: ${error.message}`);
      errors++;
    }
  }

  // 2. Generate wind components
  console.log('\n💨 Generating wind vocabulary...');

  // Wind directions
  const windDirDir = path.join(OUTPUT_DIR, 'wind', 'directions');
  ensureDir(windDirDir);

  for (const direction of AUDIO_LIBRARY.wind.directions) {
    try {
      const filename = path.join(windDirDir, `${toFilename(direction)}.mp3`);
      await generateAudio(direction, VOICE_CONFIG, AUDIO_CONFIG, filename);
      console.log(`   ✅ ${direction}`);
      totalFiles++;
      await delay(200);
    } catch (error) {
      console.error(`   ❌ ${direction}: ${error.message}`);
      errors++;
    }
  }

  // Wind behaviors
  const windBehaviorDir = path.join(OUTPUT_DIR, 'wind', 'behaviors');
  ensureDir(windBehaviorDir);

  for (const behavior of AUDIO_LIBRARY.wind.behaviors) {
    try {
      const filename = path.join(windBehaviorDir, `${toFilename(behavior)}.mp3`);
      await generateAudio(behavior, VOICE_CONFIG, AUDIO_CONFIG, filename);
      console.log(`   ✅ ${behavior}`);
      totalFiles++;
      await delay(200);
    } catch (error) {
      console.error(`   ❌ ${behavior}: ${error.message}`);
      errors++;
    }
  }

  // Wind forces
  const windForceDir = path.join(OUTPUT_DIR, 'wind', 'forces');
  ensureDir(windForceDir);

  for (const force of AUDIO_LIBRARY.wind.forces) {
    try {
      const filename = path.join(windForceDir, `force-${force}.mp3`);
      await generateAudio(`Force ${force}`, VOICE_CONFIG, AUDIO_CONFIG, filename);
      console.log(`   ✅ Force ${force}`);
      totalFiles++;
      await delay(200);
    } catch (error) {
      console.error(`   ❌ Force ${force}: ${error.message}`);
      errors++;
    }
  }

  // 3. Generate sea states
  console.log('\n🌊 Generating sea states...');
  const seaDir = path.join(OUTPUT_DIR, 'sea');
  ensureDir(seaDir);

  for (const state of AUDIO_LIBRARY.sea) {
    try {
      const filename = path.join(seaDir, `${toFilename(state)}.mp3`);
      await generateAudio(state, VOICE_CONFIG, AUDIO_CONFIG, filename);
      console.log(`   ✅ ${state}`);
      totalFiles++;
      await delay(200);
    } catch (error) {
      console.error(`   ❌ ${state}: ${error.message}`);
      errors++;
    }
  }

  // 4. Generate weather conditions
  console.log('\n🌧️  Generating weather conditions...');
  const weatherDir = path.join(OUTPUT_DIR, 'weather');
  ensureDir(weatherDir);

  for (const condition of AUDIO_LIBRARY.weather) {
    try {
      const filename = path.join(weatherDir, `${toFilename(condition)}.mp3`);
      await generateAudio(condition, VOICE_CONFIG, AUDIO_CONFIG, filename);
      console.log(`   ✅ ${condition}`);
      totalFiles++;
      await delay(200);
    } catch (error) {
      console.error(`   ❌ ${condition}: ${error.message}`);
      errors++;
    }
  }

  // 5. Generate visibility conditions
  console.log('\n👁️  Generating visibility conditions...');
  const visibilityDir = path.join(OUTPUT_DIR, 'visibility');
  ensureDir(visibilityDir);

  for (const visibility of AUDIO_LIBRARY.visibility) {
    try {
      const filename = path.join(visibilityDir, `${toFilename(visibility)}.mp3`);
      await generateAudio(visibility, VOICE_CONFIG, AUDIO_CONFIG, filename);
      console.log(`   ✅ ${visibility}`);
      totalFiles++;
      await delay(200);
    } catch (error) {
      console.error(`   ❌ ${visibility}: ${error.message}`);
      errors++;
    }
  }

  // 6. Generate timing phrases
  console.log('\n⏰ Generating timing phrases...');
  const timingDir = path.join(OUTPUT_DIR, 'timing');
  ensureDir(timingDir);

  for (const phrase of AUDIO_LIBRARY.timing) {
    try {
      const filename = path.join(timingDir, `${toFilename(phrase)}.mp3`);
      await generateAudio(phrase, VOICE_CONFIG, AUDIO_CONFIG, filename);
      console.log(`   ✅ ${phrase}`);
      totalFiles++;
      await delay(200);
    } catch (error) {
      console.error(`   ❌ ${phrase}: ${error.message}`);
      errors++;
    }
  }

  // 7. Generate connectors
  console.log('\n🔗 Generating connectors...');
  const connectorsDir = path.join(OUTPUT_DIR, 'connectors');
  ensureDir(connectorsDir);

  for (const connector of AUDIO_LIBRARY.connectors) {
    try {
      const filename = path.join(connectorsDir, `${toFilename(connector)}.mp3`);
      await generateAudio(connector, VOICE_CONFIG, AUDIO_CONFIG, filename);
      console.log(`   ✅ ${connector}`);
      totalFiles++;
      await delay(200);
    } catch (error) {
      console.error(`   ❌ ${connector}: ${error.message}`);
      errors++;
    }
  }

  // 8. Generate wind modifiers
  console.log('\n💨 Generating wind modifiers...');
  const windModDir = path.join(OUTPUT_DIR, 'wind', 'modifiers');
  ensureDir(windModDir);

  for (const modifier of AUDIO_LIBRARY.windModifiers) {
    try {
      const filename = path.join(windModDir, `${toFilename(modifier)}.mp3`);
      await generateAudio(modifier, VOICE_CONFIG, AUDIO_CONFIG, filename);
      console.log(`   ✅ ${modifier}`);
      totalFiles++;
      await delay(200);
    } catch (error) {
      console.error(`   ❌ ${modifier}: ${error.message}`);
      errors++;
    }
  }

  // 9. Generate pressure conditions
  console.log('\n🌡️  Generating pressure conditions...');
  const pressureDir = path.join(OUTPUT_DIR, 'pressure');
  ensureDir(pressureDir);

  for (const condition of AUDIO_LIBRARY.pressure) {
    try {
      const filename = path.join(pressureDir, `${toFilename(condition)}.mp3`);
      await generateAudio(condition, VOICE_CONFIG, AUDIO_CONFIG, filename);
      console.log(`   ✅ ${condition}`);
      totalFiles++;
      await delay(200);
    } catch (error) {
      console.error(`   ❌ ${condition}: ${error.message}`);
      errors++;
    }
  }

  // 10. Generate wave conditions
  console.log('\n🌊 Generating wave/swell conditions...');
  const wavesDir = path.join(OUTPUT_DIR, 'waves');
  ensureDir(wavesDir);

  for (const wave of AUDIO_LIBRARY.waves) {
    try {
      const filename = path.join(wavesDir, `${toFilename(wave)}.mp3`);
      await generateAudio(wave, VOICE_CONFIG, AUDIO_CONFIG, filename);
      console.log(`   ✅ ${wave}`);
      totalFiles++;
      await delay(200);
    } catch (error) {
      console.error(`   ❌ ${wave}: ${error.message}`);
      errors++;
    }
  }

  // 11. Generate numbers (0-99 for times, forces, measurements)
  console.log('\n🔢 Generating numbers (0-99)...');
  const numbersDir = path.join(OUTPUT_DIR, 'numbers');
  ensureDir(numbersDir);

  for (let num = 0; num <= 99; num++) {
    try {
      const filename = path.join(numbersDir, `${num}.mp3`);
      await generateAudio(num.toString(), VOICE_CONFIG, AUDIO_CONFIG, filename);
      if (num % 10 === 0) {
        console.log(`   ✅ ${num}...`);
      }
      totalFiles++;
      await delay(200);
    } catch (error) {
      console.error(`   ❌ ${num}: ${error.message}`);
      errors++;
    }
  }

  // 12. Generate unsettling messages
  console.log('\n👻 Generating unsettling messages...');
  const unsettlingDir = path.join(OUTPUT_DIR, 'unsettling');
  ensureDir(unsettlingDir);

  for (let i = 0; i < AUDIO_LIBRARY.unsettling.length; i++) {
    const message = AUDIO_LIBRARY.unsettling[i];
    try {
      const filename = path.join(unsettlingDir, `message-${i + 1}.mp3`);
      await generateAudio(message, VOICE_CONFIG, AUDIO_CONFIG, filename);
      console.log(`   ✅ Message ${i + 1}`);
      totalFiles++;
      await delay(200);
    } catch (error) {
      console.error(`   ❌ Message ${i + 1}: ${error.message}`);
      errors++;
    }
  }

  // 13. Generate pause files
  const pauseFiles = await generatePauses();
  totalFiles += pauseFiles;

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✨ Complete!`);
  console.log(`   📊 Total files generated: ${totalFiles}`);
  if (errors > 0) {
    console.log(`   ⚠️  Errors: ${errors}`);
  }
  console.log(`   📁 Output directory: ${OUTPUT_DIR}`);
  console.log(`   💰 Estimated cost: $${(totalFiles * 0.000016 * 50).toFixed(2)} (approximate)`);
  console.log('\n📂 Directory structure:');
  console.log('   public/audio/');
  console.log('   ├── areas/ (38 files)');
  console.log('   ├── wind/');
  console.log('   │   ├── directions/ (10 files)');
  console.log('   │   ├── behaviors/ (4 files)');
  console.log('   │   ├── modifiers/ (7 files)');
  console.log('   │   └── forces/ (9 files)');
  console.log('   ├── sea/ (8 files)');
  console.log('   ├── weather/ (8 files)');
  console.log('   ├── visibility/ (8 files)');
  console.log('   ├── pressure/ (8 files)');
  console.log('   ├── waves/ (3 files)');
  console.log('   ├── timing/ (7 files)');
  console.log('   ├── connectors/ (5 files)');
  console.log('   ├── numbers/ (100 files)');
  console.log('   ├── unsettling/ (12 files)');
  console.log('   └── pauses/ (2 files)');
  console.log('\n🎉 Ready to integrate into your application!');
}

// Run the generator
generateLibrary().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
