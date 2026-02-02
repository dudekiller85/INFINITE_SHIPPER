/**
 * Oscilloscope visualization
 * Displays real-time frequency analysis of audio
 */

export class Oscilloscope {
  constructor(canvasElement, audioContext) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.audioContext = audioContext;
    this.analyser = null;
    this.dataArray = null;
    this.bufferLength = 0;
    this.animationFrame = null;
    this.color = 'rgba(0, 255, 0, 0.8)';
    this.isRunning = false;
  }

  /**
   * Connect audio source and start visualization
   * @param {AudioNode} sourceNode - Audio source to analyze
   */
  start(sourceNode) {
    if (this.isRunning) {
      return;
    }

    // Create analyser node
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);

    // Connect source to analyser
    if (sourceNode) {
      sourceNode.connect(this.analyser);
    }

    this.isRunning = true;
    this._draw();
  }

  /**
   * Main drawing loop
   * @private
   */
  _draw() {
    if (!this.isRunning) {
      return;
    }

    this.animationFrame = requestAnimationFrame(() => this._draw());

    if (!this.analyser) {
      return;
    }

    // Get frequency data
    this.analyser.getByteTimeDomainData(this.dataArray);

    const { width, height } = this.canvas;

    // Clear canvas
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(0, 0, width, height);

    // Draw waveform
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = this.color;
    this.ctx.beginPath();

    const sliceWidth = (width * 1.0) / this.bufferLength;
    let x = 0;

    for (let i = 0; i < this.bufferLength; i++) {
      const v = this.dataArray[i] / 128.0; // Normalize to 0-2 range
      const y = (v * height) / 2;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.ctx.lineTo(width, height / 2);
    this.ctx.stroke();
  }

  /**
   * Stop visualization
   */
  stop() {
    this.isRunning = false;

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    // Clear canvas
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Set oscilloscope color
   * @param {string} color - CSS color string
   */
  setColor(color) {
    this.color = color;
  }

  /**
   * Get current frequency data
   * @returns {Uint8Array|null}
   */
  getFrequencyData() {
    return this.dataArray;
  }
}
