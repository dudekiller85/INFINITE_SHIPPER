/**
 * Timing and delay utility functions
 */

/**
 * Promise-based delay
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Standard 500ms pause
 * @returns {Promise<void>}
 */
export function shortPause() {
  return delay(500);
}

/**
 * Standard 1000ms pause
 * @returns {Promise<void>}
 */
export function longPause() {
  return delay(1000);
}

/**
 * Get current timestamp in ISO format
 * @returns {string}
 */
export function getCurrentTimestamp() {
  return new Date().toISOString();
}
