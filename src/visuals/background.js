/**
 * Background canvas visualization
 * Generates shifting isobar-like pattern with blur and hue effects
 */

export class BackgroundCanvas {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.animationFrame = null;
    this.time = 0;
    this.blurIntensity = 0;
    this.hueRotation = 0;
    
    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());
  }

  /**
   * Resize canvas to fill viewport
   * @private
   */
  _resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * Initialize and start background animation
   */
  initBackground() {
    this._animate();
  }

  /**
   * Main animation loop
   * @private
   */
  _animate() {
    this.time += 0.01;
    
    this._drawIsobars();
    
    this.animationFrame = requestAnimationFrame(() => this._animate());
  }

  /**
   * Draw procedural isobar-like pattern
   * @private
   */
  _drawIsobars() {
    const { width, height } = this.canvas;
    
    // Clear with dark background
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, width, height);
    
    // Draw isobar lines
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.lineWidth = 1;
    
    const lineCount = 15;
    const spacing = height / lineCount;
    
    for (let i = 0; i < lineCount; i++) {
      this.ctx.beginPath();
      
      for (let x = 0; x <= width; x += 10) {
        // Create wave pattern with time-based offset
        const wave1 = Math.sin((x * 0.01) + (i * 0.5) + (this.time * 0.3)) * 30;
        const wave2 = Math.cos((x * 0.008) + (i * 0.3) - (this.time * 0.2)) * 20;
        const y = (i * spacing) + wave1 + wave2;
        
        if (x === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }
      
      this.ctx.stroke();
    }
  }

  /**
   * Update blur intensity (applied via CSS filter on canvas element)
   * @param {number} intensity - Blur in pixels (0-10)
   */
  updateBlur(intensity) {
    this.blurIntensity = Math.max(0, Math.min(10, intensity));
    this._updateFilter();
  }

  /**
   * Update hue rotation (applied via CSS filter on canvas element)
   * @param {number} degrees - Hue rotation in degrees (0-360)
   */
  updateHueRotation(degrees) {
    this.hueRotation = degrees % 360;
    this._updateFilter();
  }

  /**
   * Apply combined filter to canvas element
   * @private
   */
  _updateFilter() {
    this.canvas.style.filter = `blur(${this.blurIntensity}px) hue-rotate(${this.hueRotation}deg)`;
  }

  /**
   * Stop animation
   */
  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Get current visual state
   * @returns {{blurIntensity: number, hueRotation: number}}
   */
  getState() {
    return {
      blurIntensity: this.blurIntensity,
      hueRotation: this.hueRotation,
    };
  }
}
