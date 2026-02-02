/**
 * Jest configuration for INFINITE_SHIPPER
 * ES module setup for browser-based code
 */

export default {
  testEnvironment: 'jsdom',
  transform: {},
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFiles: ['<rootDir>/tests/setup.js'],
  moduleFileExtensions: ['js', 'mjs'],
  testTimeout: 10000,
  transformIgnorePatterns: ['node_modules/(?!(@jest)/)']
};
