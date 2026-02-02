/**
 * Jest test setup
 * Mocks browser APIs and global objects for testing
 */

// Mock atob (base64 decode) for Node.js environment
if (typeof global.atob === 'undefined') {
  global.atob = (str) => Buffer.from(str, 'base64').toString('binary');
}

// Mock btoa (base64 encode) for Node.js environment
if (typeof global.btoa === 'undefined') {
  global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
}

// Mock fetch for API calls
global.fetch = () => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({ audioContent: '' }),
  status: 200
});

// Mock AbortController
if (typeof global.AbortController === 'undefined') {
  global.AbortController = class AbortController {
    constructor() {
      this.signal = {
        aborted: false,
        addEventListener: () => {},
        removeEventListener: () => {}
      };
    }
    abort() {
      this.signal.aborted = true;
    }
  };
}

// Mock Audio element
global.Audio = class Audio {
  constructor(src) {
    this.src = src;
    this.onended = null;
    this.onerror = null;
  }
  play() {
    return Promise.resolve();
  }
  pause() {}
};

// Mock URL.createObjectURL
global.URL.createObjectURL = () => 'blob:mock-url';
global.URL.revokeObjectURL = () => {};

// Suppress console logs during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn()
// };
