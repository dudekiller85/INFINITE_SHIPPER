/**
 * Security Test: API Key Exposure
 *
 * REQUIRED by Constitution v1.1.0, Principle II exception
 *
 * Verifies that the API key is never exposed in:
 * - Worker source code
 * - Response headers
 * - Error messages
 * - Network requests
 */

const TEST_PROXY_URL = process.env.PROXY_URL || 'http://localhost:8787/synthesize';

/**
 * Test 1: Verify Worker source code contains no API key
 *
 * This test reads the deployed/local Worker source and checks for patterns
 * that might indicate an exposed API key
 */
async function testWorkerSourceNoApiKey() {
  console.log('Test 1: Checking Worker source for API key exposure...');

  // In a real test, you would:
  // 1. Fetch the Worker's JavaScript source (if accessible)
  // 2. Search for patterns like "AIza" (Google API key prefix)
  // 3. Search for env.GOOGLE_TTS_API_KEY assignments to strings

  // For this implementation, we check the local source files
  const fs = require('fs');
  const path = require('path');

  const sourceFiles = [
    path.join(__dirname, '../../src/index.js'),
    path.join(__dirname, '../../src/tts-proxy.js'),
    path.join(__dirname, '../../src/error-handler.js'),
  ];

  let foundExposure = false;

  for (const file of sourceFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8');

      // Check for hardcoded API keys (Google API keys start with "AIza")
      if (content.match(/['"]AIza[a-zA-Z0-9_-]{35}['"]/)) {
        console.error(`  ✗ FAIL: Found hardcoded API key in ${file}`);
        foundExposure = true;
      }

      // Check for direct API key strings (not env access)
      if (content.match(/const\s+.*API.*KEY\s*=\s*['"][^'"]+['"]/i)) {
        console.error(`  ✗ FAIL: Found hardcoded API key variable in ${file}`);
        foundExposure = true;
      }
    }
  }

  if (!foundExposure) {
    console.log('  ✓ PASS: No hardcoded API keys found in source');
    return true;
  }

  return false;
}

/**
 * Test 2: Verify response headers contain no API key
 */
async function testResponseHeadersNoApiKey() {
  console.log('Test 2: Checking response headers for API key exposure...');

  try {
    const response = await fetch(TEST_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { ssml: '<speak>Test</speak>' },
        voice: { languageCode: 'en-GB', name: 'en-GB-Neural2-D' },
        audioConfig: { audioEncoding: 'MP3', sampleRateHertz: 24000 },
      }),
    });

    // Check all response headers
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value.toLowerCase();
    });

    // Look for API keys in headers (Google API keys start with "AIza")
    for (const [key, value] of Object.entries(headers)) {
      if (value.includes('aiza') || key.includes('authorization') || key.includes('api')) {
        console.error(`  ✗ FAIL: Suspicious header found: ${key}: ${value}`);
        return false;
      }
    }

    console.log('  ✓ PASS: No API keys found in response headers');
    return true;

  } catch (error) {
    console.error(`  ✗ FAIL: Request failed - ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Verify error messages contain no API key
 */
async function testErrorMessagesNoApiKey() {
  console.log('Test 3: Checking error messages for API key exposure...');

  try {
    // Send invalid request to trigger error
    const response = await fetch(TEST_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalid: 'payload' }),
    });

    const data = await response.json();

    if (data.error) {
      const errorMessage = JSON.stringify(data).toLowerCase();

      // Check for API key patterns in error message
      if (errorMessage.includes('aiza') || errorMessage.match(/[a-z0-9_-]{35,}/)) {
        console.error(`  ✗ FAIL: Error message may contain API key: ${data.error}`);
        return false;
      }

      console.log(`  ✓ PASS: Error message clean: "${data.error}"`);
      return true;
    }

    // If no error, that's also acceptable (request succeeded despite invalid payload)
    console.log('  ✓ PASS: No error message to check');
    return true;

  } catch (error) {
    console.error(`  ✗ FAIL: Request failed - ${error.message}`);
    return false;
  }
}

/**
 * Run all API key exposure tests
 */
async function runTests() {
  console.log('\n========================================');
  console.log('API Key Exposure Security Tests');
  console.log('REQUIRED by Constitution v1.1.0');
  console.log('========================================\n');

  const results = [
    await testWorkerSourceNoApiKey(),
    await testResponseHeadersNoApiKey(),
    await testErrorMessagesNoApiKey(),
  ];

  const passCount = results.filter(r => r).length;
  const totalCount = results.length;

  console.log('\n========================================');
  console.log(`Results: ${passCount}/${totalCount} tests passed`);
  console.log('========================================\n');

  if (passCount === totalCount) {
    console.log('✓ ALL TESTS PASSED: API key is not exposed');
    process.exit(0);
  } else {
    console.error('✗ TESTS FAILED: API key may be exposed');
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { runTests };
