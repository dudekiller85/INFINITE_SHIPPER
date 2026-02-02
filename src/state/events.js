/**
 * Event bus for cross-module communication
 */

export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Handler function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Handler function to remove
   */
  off(event, callback) {
    if (!this.listeners.has(event)) {
      return;
    }

    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }

    // Clean up empty arrays
    if (callbacks.length === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * Emit an event to all listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (!this.listeners.has(event)) {
      return;
    }

    const callbacks = this.listeners.get(event);
    callbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for '${event}':`, error);
      }
    });
  }

  /**
   * Remove all listeners for an event or all events
   * @param {string} [event] - Event name (optional, clears all if not provided)
   */
  clear(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// Singleton instance for global event coordination
export const globalEventBus = new EventBus();
