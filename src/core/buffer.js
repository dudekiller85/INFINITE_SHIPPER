/**
 * Report buffer for pre-generating weather reports
 * Ensures smooth playback with 3-5 reports buffered ahead
 */

export class ReportBuffer {
  constructor(minSize = 3, maxSize = 5) {
    this.minSize = minSize;
    this.maxSize = maxSize;
    this.queue = [];
  }

  /**
   * Add a report to the buffer
   * @param {Object} report - Weather report object
   */
  enqueue(report) {
    if (this.queue.length < this.maxSize) {
      this.queue.push(report);
    }
  }

  /**
   * Remove and return the next report from buffer
   * @returns {Object|null} Next weather report or null if empty
   */
  dequeue() {
    return this.queue.shift() || null;
  }

  /**
   * Check if buffer needs refilling
   * @returns {boolean} True if buffer size is at or below minimum
   */
  needsRefill() {
    return this.queue.length <= this.minSize;
  }

  /**
   * Get current buffer size
   * @returns {number} Number of reports in buffer
   */
  size() {
    return this.queue.length;
  }

  /**
   * Get buffer capacity remaining
   * @returns {number} Number of additional reports that can be buffered
   */
  capacity() {
    return this.maxSize - this.queue.length;
  }

  /**
   * Clear all reports from buffer
   */
  clear() {
    this.queue = [];
  }

  /**
   * Check if buffer is empty
   * @returns {boolean}
   */
  isEmpty() {
    return this.queue.length === 0;
  }

  /**
   * Check if buffer is full
   * @returns {boolean}
   */
  isFull() {
    return this.queue.length >= this.maxSize;
  }
}
