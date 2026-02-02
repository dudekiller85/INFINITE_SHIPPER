/**
 * Visual effects controller
 * Orchestrates blur and hue-rotation animations
 */

export class VisualEffects {
  constructor(backgroundCanvas) {
    this.background = backgroundCanvas;
    this.startTime = Date.now();
    this.animationFrame = null;
    this.isRunning = false;
    
    // Animation parameters
    this.blurPeriod = 10000; // 10 seconds in milliseconds
    this.blurAmplitude = 3; // 0-3px oscillation
    this.huePeriod = 60000; // 60 seconds in milliseconds
  }

  /**
   * Start effect animations
   */
  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.startTime = Date.now();
    this._animate();
  }

  /**
   * Main animation loop
   * @private
   */
  _animate() {
    if (!this.isRunning) {
      return;
    }

    const elapsed = Date.now() - this.startTime;

    // Calculate blur intensity (sine wave 0-3px over 10 seconds)
    const blurPhase = (elapsed % this.blurPeriod) / this.blurPeriod;
    const blurIntensity = (Math.sin(blurPhase * Math.PI * 2) * 0.5 + 0.5) * this.blurAmplitude;
    this.background.updateBlur(blurIntensity);

    // Calculate hue rotation (linear 0-360° over 60 seconds)
    const huePhase = (elapsed % this.huePeriod) / this.huePeriod;
    const hueRotation = huePhase * 360;
    this.background.updateHueRotation(hueRotation);

    this.animationFrame = requestAnimationFrame(() => this._animate());
  }

  /**
   * Stop effect animations
   */
  stop() {
    this.isRunning = false;

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Reset effects
    this.background.updateBlur(0);
    this.background.updateHueRotation(0);
  }

  /**
   * Trigger phantom effect (intense blur spike)
   */
  triggerPhantomEffect() {
    // Temporarily set blur to maximum
    this.background.updateBlur(10);

    // Return to normal animation after brief spike
    setTimeout(() => {
      // Resume normal animation cycle
    }, 100);
  }

  /**
   * Get current effect values
   * @returns {{blurIntensity: number, hueRotation: number}}
   */
  getState() {
    return this.background.getState();
  }
}
