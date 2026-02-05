/**
 * Analog Effects
 * 1970s clandestine aesthetic with ghost box and magnetic interference
 */

export class AnalogEffects {
  constructor() {
    this.ghostBox = null;
    this.centralBox = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.ghostX = 0;
    this.ghostY = 0;
    this.animationFrame = null;
    this.interferenceInterval = null;
    this.isEnabled = true;
  }

  /**
   * Initialize analog effects
   */
  initialize() {
    this.ghostBox = document.querySelector('.ghost-box');
    this.centralBox = document.querySelector('.central-box');

    if (!this.ghostBox || !this.centralBox) {
      console.warn('[AnalogEffects] Ghost box or central box not found');
      return;
    }

    // Check motion preference
    this.checkMotionPreference();

    // Set up mouse tracking for ghost box
    this.setupGhostBoxTracking();

    // Set up random magnetic interference
    this.setupMagneticInterference();

    console.log('[AnalogEffects] Analog effects initialized');
  }

  /**
   * Check if motion should be reduced
   */
  checkMotionPreference() {
    const motionReduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.body.classList.contains('motion-reduced');

    if (motionReduced) {
      this.disable();
    }
  }

  /**
   * Setup ghost box mouse tracking
   */
  setupGhostBoxTracking() {
    if (!this.isEnabled) return;

    // Track mouse position
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    // Animate ghost box with lag
    const animateGhost = () => {
      if (!this.isEnabled) return;

      // Calculate center of screen
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      // Calculate offset from center (in pixels)
      const offsetX = this.mouseX - centerX;
      const offsetY = this.mouseY - centerY;

      // Target ghost position (small displacement based on mouse)
      const targetX = offsetX * 0.01; // 1% of offset
      const targetY = offsetY * 0.01;

      // Smooth interpolation (lag effect)
      this.ghostX += (targetX - this.ghostX) * 0.05;
      this.ghostY += (targetY - this.ghostY) * 0.05;

      // Apply transform
      if (this.ghostBox) {
        this.ghostBox.style.transform = `translate(${this.ghostX}px, ${this.ghostY}px)`;
      }

      this.animationFrame = requestAnimationFrame(animateGhost);
    };

    animateGhost();
  }

  /**
   * Setup random magnetic interference
   */
  setupMagneticInterference() {
    if (!this.isEnabled) return;

    const triggerInterference = () => {
      if (!this.centralBox || !this.isEnabled) return;

      // Add interference class
      this.centralBox.classList.add('interference');

      // Remove after animation completes
      setTimeout(() => {
        if (this.centralBox) {
          this.centralBox.classList.remove('interference');
        }
      }, 300);
    };

    // Random interference every 15-45 seconds
    const scheduleNextInterference = () => {
      if (!this.isEnabled) return;

      const delay = 15000 + Math.random() * 30000; // 15-45 seconds

      this.interferenceInterval = setTimeout(() => {
        triggerInterference();
        scheduleNextInterference();
      }, delay);
    };

    scheduleNextInterference();
  }

  /**
   * Enable effects
   */
  enable() {
    this.isEnabled = true;
    this.initialize();
  }

  /**
   * Disable effects
   */
  disable() {
    this.isEnabled = false;

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.interferenceInterval) {
      clearTimeout(this.interferenceInterval);
      this.interferenceInterval = null;
    }

    // Reset ghost box position
    if (this.ghostBox) {
      this.ghostBox.style.transform = 'translate(0, 0)';
    }
  }
}
