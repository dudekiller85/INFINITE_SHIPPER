#!/usr/bin/env node
/**
 * Quick Synthesis Test
 *
 * Tests the SSML generation without needing a browser.
 * Run: node test-synthesis.mjs
 */

import { SSMLTemplateBuilder } from './src/audio/ssml-template-builder.js';
import { PROSODY_CONFIG } from './src/audio/prosody-config.js';

console.log('🎙️  Natural Speech Generation Test\n');
console.log('=' .repeat(60));

// Test 1: Standard area report
console.log('\n📋 Test 1: Standard Area Report');
console.log('-'.repeat(60));

const builder = new SSMLTemplateBuilder();

const standardReport = {
  area: 'Viking',
  isPhantom: false,
  wind: {
    direction: 'southwesterly',
    force: 7,
    gusts: 8
  },
  seaState: 'rough',
  weather: 'rain',
  visibility: 'good'
};

const template = builder.build(standardReport);

console.log(`✓ Area: ${template.areaName}`);
console.log(`✓ Phantom: ${template.isPhantom}`);
console.log(`✓ Report ID: ${template.reportId}`);
console.log(`✓ Character Count: ${template.characterCount}`);
console.log(`✓ Created: ${new Date(template.createdAt).toISOString()}`);

console.log('\n📝 Generated SSML:');
console.log(template.ssml);

// Verify SSML structure
const checks = [
  { name: 'Has <speak> tag', test: template.ssml.includes('<speak>') },
  { name: 'Has <prosody> tag', test: template.ssml.includes('<prosody') },
  { name: 'Rate is 85%', test: template.ssml.includes('rate="85%"') },
  { name: 'Area has strong emphasis', test: template.ssml.includes('<emphasis level="strong">Viking</emphasis>') },
  { name: 'Has 800ms break after area', test: template.ssml.includes('800ms') },
  { name: 'Has 200ms break after wind dir', test: template.ssml.includes('200ms') },
  { name: 'Has 600ms breaks', test: template.ssml.includes('600ms') },
  { name: 'Has 1500ms break at end', test: template.ssml.includes('1500ms') },
  { name: 'Visibility has reduced emphasis', test: template.ssml.includes('<emphasis level="reduced">good</emphasis>') },
  { name: 'Valid XML structure', test: template.ssml.startsWith('<speak>') && template.ssml.endsWith('</speak>') }
];

console.log('\n✅ SSML Validation:');
checks.forEach(check => {
  const status = check.test ? '✓' : '✗';
  console.log(`  ${status} ${check.name}`);
});

const allPassed = checks.every(c => c.test);
console.log(`\n${allPassed ? '✅' : '❌'} All checks: ${allPassed ? 'PASSED' : 'FAILED'}`);

// Test 2: Phantom area report
console.log('\n' + '='.repeat(60));
console.log('\n📋 Test 2: Phantom Area Report');
console.log('-'.repeat(60));

const phantomReport = {
  area: 'Finisterre',
  isPhantom: true,
  wind: {
    direction: 'northerly',
    force: 4
  },
  seaState: 'slight',
  weather: 'fog'
};

const phantomTemplate = builder.build(phantomReport);

console.log(`✓ Area: ${phantomTemplate.areaName}`);
console.log(`✓ Phantom: ${phantomTemplate.isPhantom}`);
console.log(`✓ Report ID: ${phantomTemplate.reportId}`);

const phantomChecks = [
  { name: 'Is phantom area', test: phantomTemplate.isPhantom === true },
  { name: 'Rate is 90% (phantom)', test: phantomTemplate.ssml.includes('rate="90%"') },
  { name: 'Has all required breaks', test: phantomTemplate.ssml.includes('800ms') && phantomTemplate.ssml.includes('1500ms') }
];

console.log('\n✅ Phantom SSML Validation:');
phantomChecks.forEach(check => {
  const status = check.test ? '✓' : '✗';
  console.log(`  ${status} ${check.name}`);
});

// Test 3: Prosody config
console.log('\n' + '='.repeat(60));
console.log('\n📋 Test 3: Prosody Configuration');
console.log('-'.repeat(60));

console.log('\n🎵 Speaking Rates:');
console.log(`  Standard: ${PROSODY_CONFIG.rates.standard * 100}%`);
console.log(`  Phantom: ${PROSODY_CONFIG.rates.phantom * 100}%`);

console.log('\n⏱️  Break Timings:');
Object.entries(PROSODY_CONFIG.breaks).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});

console.log('\n🔊 Emphasis Levels:');
Object.entries(PROSODY_CONFIG.emphasis).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Summary');
console.log('-'.repeat(60));

const totalChecks = checks.length + phantomChecks.length;
const passedChecks = [...checks, ...phantomChecks].filter(c => c.test).length;

console.log(`\n✓ Tests Passed: ${passedChecks}/${totalChecks}`);
console.log(`✓ Success Rate: ${Math.round(passedChecks / totalChecks * 100)}%`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 All tests PASSED! Natural speech generation is working correctly.');
  console.log('\n📝 Next steps:');
  console.log('  1. Open test-natural-speech.html in a browser');
  console.log('  2. Run: npm run dev');
  console.log('  3. Open: http://localhost:8000');
  console.log('  4. Run full test suite: npm test');
} else {
  console.log('\n❌ Some tests FAILED. Check the output above for details.');
  process.exit(1);
}

console.log('\n' + '='.repeat(60));
