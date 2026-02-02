/**
 * Audio filters for radio transmission effects
 * Applies bandpass filtering and white noise for authenticity
 */

export class RadioFilter {
  constructor(audioContext) {
    this.audioContext = audioContext;

    // Create audio nodes
    this.bandpassFilter = this.audioContext.createBiquadFilter();
    this.bandpassFilter.type = 'bandpass';
    this.bandpassFilter.frequency.value = 1650; // Center frequency (300-3000Hz range)
    this.bandpassFilter.Q.value = 1.0; // Moderate resonance

    // White noise generator
    this.noiseNode = this._createWhiteNoise();
    this.noiseGain = this.audioContext.createGain();
    this.noiseGain.gain.value = 0.02; // Subtle background noise

    // Connect noise path
    this.noiseNode.connect(this.noiseGain);
    this.noiseGain.connect(this.bandpassFilter);

    // Output gain control
    this.outputGain = this.audioContext.createGain();
    this.outputGain.gain.value = 1.0;

    // Connect filter to output
    this.bandpassFilter.connect(this.outputGain);
  }

  /**
   * Create white noise generator
   * @private
   * @returns {AudioBufferSourceNode}
   */
  _createWhiteNoise() {
    const bufferSize = 2 * this.audioContext.sampleRate;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1; // Random values between -1 and 1
    }

    const whiteNoise = this.audioContext.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    whiteNoise.start(0);

    return whiteNoise;
  }

  /**
   * Connect an audio source to the filter chain
   * @param {AudioNode} sourceNode - Input audio node
   */
  connect(sourceNode) {
    sourceNode.connect(this.bandpassFilter);
  }

  /**
   * Disconnect the filter from output
   */
  disconnect() {
    this.outputGain.disconnect();
  }

  /**
   * Connect filter output to destination
   * @param {AudioNode} destinationNode - Destination audio node
   */
  connectTo(destinationNode) {
    this.outputGain.connect(destinationNode);
  }

  /**
   * Set bandpass filter center frequency
   * @param {number} frequency - Center frequency in Hz (300-3000 range)
   */
  setFilterFrequency(frequency) {
    const clampedFreq = Math.max(300, Math.min(3000, frequency));
    this.bandpassFilter.frequency.value = clampedFreq;
  }

  /**
   * Set white noise gain level
   * @param {number} gain - Noise gain (0.0 - 0.1 typical range)
   */
  setNoiseGain(gain) {
    const clampedGain = Math.max(0, Math.min(0.1, gain));
    this.noiseGain.gain.value = clampedGain;
  }

  /**
   * Set output volume
   * @param {number} volume - Output volume (0.0 - 1.0)
   */
  setVolume(volume) {
    this.outputGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get current filter configuration
   * @returns {{frequency: number, Q: number, noiseGain: number, volume: number}}
   */
  getConfiguration() {
    return {
      frequency: this.bandpassFilter.frequency.value,
      Q: this.bandpassFilter.Q.value,
      noiseGain: this.noiseGain.gain.value,
      volume: this.outputGain.gain.value,
    };
  }

  /**
   * Clean up audio resources
   */
  dispose() {
    this.noiseNode.stop();
    this.noiseNode.disconnect();
    this.noiseGain.disconnect();
    this.bandpassFilter.disconnect();
    this.outputGain.disconnect();
  }
}
