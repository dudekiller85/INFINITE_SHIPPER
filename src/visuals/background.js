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

    // Audio reactivity
    this.analyser = null;
    this.audioDataArray = null;
    this.audioAmplitude = 0;

    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());

    // Listen for motion controller events
    document.addEventListener('motion-disabled', () => {
      this.pause();
    });

    document.addEventListener('motion-enabled', () => {
      this.resume();
    });
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

    // Update audio amplitude if analyser is connected
    if (this.analyser && this.audioDataArray) {
      this.analyser.getByteTimeDomainData(this.audioDataArray);

      // Calculate peak amplitude (0-1 range) - more responsive than average
      let max = 0;
      for (let i = 0; i < this.audioDataArray.length; i++) {
        const normalized = Math.abs((this.audioDataArray[i] - 128) / 128);
        if (normalized > max) {
          max = normalized;
        }
      }
      // Apply gain boost for more visible effect
      this.audioAmplitude = Math.min(max * 3.0, 1.0);
    }

    this._drawIsobars();

    this.animationFrame = requestAnimationFrame(() => this._animate());
  }

  /**
   * Draw procedural isobar-like pattern
   * Enhanced with drift, pulse, and glitch effects for haunted maritime aesthetic
   * @private
   */
  _drawIsobars() {
    const { width, height } = this.canvas;

    // Clear with dark background
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, width, height);

    // Draw isobar lines with phosphor green color
    this.ctx.strokeStyle = 'rgba(26, 138, 26, 0.6)'; // Phosphor green dim with moderate opacity
    this.ctx.lineWidth = 2;

    const lineCount = 20; // Increased from 15
    const spacing = height / lineCount;

    for (let i = 0; i < lineCount; i++) {
      this.ctx.beginPath();

      for (let x = 0; x <= width; x += 10) {
        // Drift effect: sinusoidal horizontal wave
        const drift = Math.sin((x * 0.01) + (i * 0.5) + (this.time * 0.3)) * 30;

        // Pulse effect: secondary sinusoidal vertical wave
        const pulse = Math.cos((x * 0.008) + (i * 0.3) - (this.time * 0.2)) * 15;

        // Glitch effect: random displacement spikes (0.001 probability)
        const glitch = (Math.random() < 0.001) ? (Math.random() - 0.5) * 40 : 0;

        // Audio-reactive vibration: oscilloscope-like response (gentle effect)
        const audioVibration = this.audioAmplitude * Math.sin((x * 0.05) + (i * 0.8)) * 3;

        const y = (i * spacing) + drift + pulse + glitch + audioVibration;

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
   * Pause animation (for motion-reduced mode)
   */
  pause() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Resume animation (for motion-enabled mode)
   */
  resume() {
    if (!this.animationFrame) {
      this._animate();
    }
  }

  /**
   * Connect audio source for reactive visualization
   * @param {AudioNode} audioSource - Web Audio API audio node to analyze
   * @param {AudioContext} audioContext - The audio context
   */
  connectAudio(audioSource, audioContext) {
    if (!audioSource || !audioContext) {
      console.warn('BackgroundCanvas: Invalid audio source or context', {
        audioSource,
        audioContext
      });
      return;
    }

    // Disconnect previous analyser if exists
    if (this.analyser) {
      this.disconnectAudio();
    }

    // Create analyser node
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    // Connect audio source to analyser
    audioSource.connect(this.analyser);

    // Create data array for time domain data
    const bufferLength = this.analyser.frequencyBinCount;
    this.audioDataArray = new Uint8Array(bufferLength);

    console.log('BackgroundCanvas: Audio connected for reactive visualization', {
      fftSize: this.analyser.fftSize,
      bufferLength,
      audioContext: audioContext.state
    });
  }

  /**
   * Disconnect audio source
   */
  disconnectAudio() {
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
      this.audioDataArray = null;
      this.audioAmplitude = 0;
    }
  }

  /**
   * Get current visual state
   * @returns {{blurIntensity: number, hueRotation: number, audioAmplitude: number}}
   */
  getState() {
    return {
      blurIntensity: this.blurIntensity,
      hueRotation: this.hueRotation,
      audioAmplitude: this.audioAmplitude,
    };
  }
}
