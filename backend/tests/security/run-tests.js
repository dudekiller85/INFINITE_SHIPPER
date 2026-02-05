/**
 * Security Test Runner
 * Runs all REQUIRED security tests per Constitution v1.1.0
 */

const path = require('path');

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('Security Test Suite - INFINITE_SHIPPER TTS Proxy');
  console.log('REQUIRED by Constitution v1.1.0, Principle II Exception');
  console.log('═══════════════════════════════════════════════════════\n');

  const tests = [
    { name: 'API Key Exposure', file: './api-key-exposure.test.js' },
    { name: 'Rate Limiting', file: './rate-limiting.test.js' },
    { name: 'Origin Validation', file: './origin-validation.test.js' },
  ];

  const results = [];

  for (const test of tests) {
    try {
      const testModule = require(test.file);
      console.log(`\nRunning: ${test.name}`);
      console.log('─'.repeat(50));

      await testModule.runTests();
      results.push({ name: test.name, passed: true });
    } catch (error) {
      console.error(`\n✗ ${test.name} FAILED:`, error.message);
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('Test Summary');
  console.log('═══════════════════════════════════════════════════════\n');

  results.forEach(result => {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${status}: ${result.name}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });

  const passCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  console.log(`\nTotal: ${passCount}/${totalCount} test suites passed\n`);

  if (passCount === totalCount) {
    console.log('✓ ALL SECURITY TESTS PASSED');
    console.log('  The system meets Constitution v1.1.0 security requirements');
    process.exit(0);
  } else {
    console.error('✗ SECURITY TESTS FAILED');
    console.error('  Implementation does not meet Constitution requirements');
    process.exit(1);
  }
}

runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
