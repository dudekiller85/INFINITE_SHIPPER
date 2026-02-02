/**
 * Motion Controller
 * Manages motion effect preferences and accessibility
 * Per contracts/motion-api.md
 */

export class MotionController {
  constructor() {
    this.motionEnabled = true;
    this.systemPrefersReduced = false;
    this.userOverride = null;
  }

  /**
   * Initialize motion controller
   * Loads preference from localStorage and checks system settings
   */
  initialize() {
    // 1. Check system preference
    this.systemPrefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // 2. Load user override from localStorage
    try {
      const saved = localStorage.getItem('motionEnabled');
      if (saved !== null) {
        this.userOverride = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load motion preference from localStorage:', error);
    }

    // 3. Determine final state
    if (this.systemPrefersReduced) {
      this.motionEnabled = false; // Always respect system preference
    } else if (this.userOverride !== null) {
      this.motionEnabled = this.userOverride;
    } else {
      this.motionEnabled = true; // Default
    }

    // 4. Apply state to DOM
    this._applyState();

    // 5. Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', (e) => {
      this.systemPrefersReduced = e.matches;
      if (e.matches) {
        this.disable();
      }
    });
  }

  /**
   * Toggle motion state
   */
  toggle() {
    // Cannot override system preference
    if (this.systemPrefersReduced) {
      console.warn('Cannot enable motion: system prefers reduced motion');
      return;
    }

    this.motionEnabled = !this.motionEnabled;
    this.userOverride = this.motionEnabled;

    // Persist to localStorage
    try {
      localStorage.setItem('motionEnabled', JSON.stringify(this.motionEnabled));
    } catch (error) {
      console.warn('Failed to persist motion preference:', error);
    }

    // Apply to DOM
    this._applyState();

    // Dispatch event
    this._dispatchEvent(
      this.motionEnabled ? 'motion-enabled' : 'motion-disabled'
    );
  }

  /**
   * Explicitly enable motion effects
   */
  enable() {
    if (this.systemPrefersReduced) {
      console.warn('Cannot enable motion: system prefers reduced motion');
      return;
    }

    if (!this.motionEnabled) {
      this.motionEnabled = true;
      this.userOverride = true;
      try {
        localStorage.setItem('motionEnabled', JSON.stringify(true));
      } catch (error) {
        console.warn('Failed to persist motion preference:', error);
      }
      this._applyState();
      this._dispatchEvent('motion-enabled');
    }
  }

  /**
   * Explicitly disable motion effects
   */
  disable() {
    if (this.motionEnabled) {
      this.motionEnabled = false;
      this.userOverride = false;
      try {
        localStorage.setItem('motionEnabled', JSON.stringify(false));
      } catch (error) {
        console.warn('Failed to persist motion preference:', error);
      }
      this._applyState();
      this._dispatchEvent('motion-disabled');
    }
  }

  /**
   * Check if motion is currently enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.motionEnabled;
  }

  /**
   * Apply motion state to DOM via CSS class
   * @private
   */
  _applyState() {
    if (this.motionEnabled) {
      document.body.classList.remove('motion-reduced');
    } else {
      document.body.classList.add('motion-reduced');
    }

    // Update button UI state
    const button = document.getElementById('motion-toggle');
    if (button) {
      button.setAttribute('aria-pressed', String(this.motionEnabled));
      button.classList.toggle('active', this.motionEnabled);
    }
  }

  /**
   * Dispatch custom event for motion state change
   * @private
   */
  _dispatchEvent(eventName) {
    const event = new CustomEvent(eventName, {
      detail: { enabled: this.motionEnabled },
      bubbles: true,
    });
    document.dispatchEvent(event);
  }
}
