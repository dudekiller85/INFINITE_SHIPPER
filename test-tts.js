/**
 * Test script for Google Cloud Text-to-Speech API
 * Generates sample audio files to compare quality
 *
 * Usage: node test-tts.js YOUR_API_KEY
 */

import https from 'https';
import fs from 'fs';

const API_KEY = process.argv[2];

if (!API_KEY) {
  console.error('Error: Please provide your Google Cloud API key');
  console.error('Usage: node test-tts.js YOUR_API_KEY');
  process.exit(1);
}

// Test samples
const samples = [
  {
    text: 'Viking',
    filename: 'test-viking.mp3',
    description: 'Area name only'
  },
  {
    text: 'Viking. Southwest, force 7. Rough. Rain. Good.',
    filename: 'test-full-report.mp3',
    description: 'Full weather report'
  }
];

// Voice options to test
const voices = [
  {
    name: 'en-GB-Neural2-B',
    gender: 'MALE',
    description: 'UK Male (Neural2 - Highest Quality)'
  },
  {
    name: 'en-GB-Wavenet-B',
    gender: 'MALE',
    description: 'UK Male (Wavenet - High Quality)'
  }
];

/**
 * Generate audio using Google Cloud TTS API
 */
async function generateAudio(text, voiceName, gender, outputFile) {
  const requestBody = JSON.stringify({
    input: { text },
    voice: {
      languageCode: 'en-GB',
      name: voiceName,
      ssmlGender: gender
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 1.0,
      pitch: 0.0
    }
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
 * Main test function
 */
async function runTests() {
  console.log('🎙️  Google Cloud Text-to-Speech Quality Test\n');
  console.log('Generating sample audio files...\n');

  // Create output directory
  if (!fs.existsSync('./tts-samples')) {
    fs.mkdirSync('./tts-samples');
  }

  let totalGenerated = 0;

  // Generate samples with first voice (Neural2)
  for (const sample of samples) {
    const voice = voices[0]; // Use Neural2 for main test
    const filename = `./tts-samples/${sample.filename}`;

    try {
      console.log(`📝 Generating: ${sample.description}`);
      console.log(`   Text: "${sample.text}"`);
      console.log(`   Voice: ${voice.description}`);

      await generateAudio(sample.text, voice.name, voice.gender, filename);

      console.log(`   ✅ Saved to: ${filename}\n`);
      totalGenerated++;
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }

  // Generate one comparison with Wavenet
  console.log('📝 Generating comparison sample (Wavenet voice)');
  console.log(`   Text: "${samples[1].text}"`);
  console.log(`   Voice: ${voices[1].description}`);

  try {
    await generateAudio(
      samples[1].text,
      voices[1].name,
      voices[1].gender,
      './tts-samples/test-full-report-wavenet.mp3'
    );
    console.log(`   ✅ Saved to: ./tts-samples/test-full-report-wavenet.mp3\n`);
    totalGenerated++;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✨ Complete! Generated ${totalGenerated} audio files`);
  console.log('   Location: ./tts-samples/');
  console.log('\n🎧 Listen to the samples to compare quality:');
  console.log('   1. test-viking.mp3 (area name)');
  console.log('   2. test-full-report.mp3 (full report - Neural2)');
  console.log('   3. test-full-report-wavenet.mp3 (full report - Wavenet)');
  console.log('\n💡 Compare with your current Web Speech API output');
}

// Run the tests
runTests().catch(console.error);
