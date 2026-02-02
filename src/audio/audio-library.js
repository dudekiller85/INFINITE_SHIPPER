/**
 * Audio Library Player
 * Plays pre-generated TTS audio files by concatenating them
 * Replaces Web Speech API with higher quality pre-recorded audio
 */

const AUDIO_BASE_PATH = '/audio';

/**
 * Audio library file path mapper
 */
export class AudioLibrary {
  constructor() {
    this.audioCache = new Map();
    this.isLoading = false;
  }

  /**
   * Convert text to filename-safe string
   * @private
   */
  _toFilename(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Get audio file path for an area name
   * @param {string} areaName - Name of the sea area
   * @param {boolean} isPhantom - Whether this is a phantom area
   * @returns {string} Audio file path
   */
  getAreaPath(areaName, isPhantom = false) {
    const filename = this._toFilename(areaName);
    const suffix = isPhantom ? '-phantom' : '';
    return `${AUDIO_BASE_PATH}/areas/${filename}${suffix}.mp3`;
  }

  /**
   * Get audio file path for wind direction
   * @param {string} direction - Wind direction (e.g., "Northerly")
   * @returns {string} Audio file path
   */
  getWindDirectionPath(direction) {
    const filename = this._toFilename(direction);
    return `${AUDIO_BASE_PATH}/wind/directions/${filename}.mp3`;
  }

  /**
   * Get audio file path for wind behavior
   * @param {string} behavior - Wind behavior (e.g., "Backing")
   * @returns {string|null} Audio file path or null if no behavior
   */
  getWindBehaviorPath(behavior) {
    if (!behavior) return null;
    const filename = this._toFilename(behavior);
    return `${AUDIO_BASE_PATH}/wind/behaviors/${filename}.mp3`;
  }

  /**
   * Get audio file path for wind force
   * @param {number} force - Force number (4-12)
   * @returns {string} Audio file path
   */
  getWindForcePath(force) {
    return `${AUDIO_BASE_PATH}/wind/forces/force-${force}.mp3`;
  }

  /**
   * Get audio file path for sea state
   * @param {string} state - Sea state (e.g., "Rough")
   * @returns {string} Audio file path
   */
  getSeaStatePath(state) {
    const filename = this._toFilename(state);
    return `${AUDIO_BASE_PATH}/sea/${filename}.mp3`;
  }

  /**
   * Get audio file path for weather condition
   * @param {string} weather - Weather condition (e.g., "Rain")
   * @returns {string} Audio file path
   */
  getWeatherPath(weather) {
    const filename = this._toFilename(weather);
    return `${AUDIO_BASE_PATH}/weather/${filename}.mp3`;
  }

  /**
   * Get audio file path for visibility
   * @param {string} visibility - Visibility condition (e.g., "Good")
   * @returns {string} Audio file path
   */
  getVisibilityPath(visibility) {
    const filename = this._toFilename(visibility);
    return `${AUDIO_BASE_PATH}/visibility/${filename}.mp3`;
  }

  /**
   * Get audio file path for unsettling message
   * @param {number} messageIndex - Index of message (1-12)
   * @returns {string} Audio file path
   */
  getUnsettlingMessagePath(messageIndex) {
    return `${AUDIO_BASE_PATH}/unsettling/message-${messageIndex}.mp3`;
  }

  /**
   * Get audio file path for pause
   * @param {'short'|'long'} type - Pause type (short=500ms, long=1000ms)
   * @returns {string} Audio file path
   */
  getPausePath(type) {
    const duration = type === 'short' ? '500ms' : '1000ms';
    return `${AUDIO_BASE_PATH}/pauses/${type}-${duration}.mp3`;
  }

  /**
   * Get audio file path for timing phrase
   * @param {string} phrase - Timing phrase (e.g., "later", "at first")
   * @returns {string} Audio file path
   */
  getTimingPhrasePath(phrase) {
    const filename = this._toFilename(phrase);
    return `${AUDIO_BASE_PATH}/timing/${filename}.mp3`;
  }

  /**
   * Get audio file path for connector
   * @param {string} connector - Connector word (e.g., "or", "to")
   * @returns {string} Audio file path
   */
  getConnectorPath(connector) {
    const filename = this._toFilename(connector);
    return `${AUDIO_BASE_PATH}/connectors/${filename}.mp3`;
  }

  /**
   * Get audio file path for wind modifier
   * @param {string} modifier - Wind modifier (e.g., "increasing", "decreasing")
   * @returns {string} Audio file path
   */
  getWindModifierPath(modifier) {
    const filename = this._toFilename(modifier);
    return `${AUDIO_BASE_PATH}/wind/modifiers/${filename}.mp3`;
  }

  /**
   * Get audio file path for pressure condition
   * @param {string} condition - Pressure condition (e.g., "Pressure rising")
   * @returns {string} Audio file path
   */
  getPressurePath(condition) {
    const filename = this._toFilename(condition);
    return `${AUDIO_BASE_PATH}/pressure/${filename}.mp3`;
  }

  /**
   * Get audio file path for wave/swell condition
   * @param {string} condition - Wave condition (e.g., "Moderate swell")
   * @returns {string} Audio file path
   */
  getWavePath(condition) {
    const filename = this._toFilename(condition);
    return `${AUDIO_BASE_PATH}/waves/${filename}.mp3`;
  }

  /**
   * Get audio file path for number
   * @param {number} num - Number (0-99)
   * @returns {string} Audio file path
   */
  getNumberPath(num) {
    return `${AUDIO_BASE_PATH}/numbers/${num}.mp3`;
  }

  /**
   * Build audio file sequence for a complete weather report with realistic BBC elements
   * @param {Object} report - Weather report object (from generator)
   * @param {Object} report.area - Sea area object
   * @param {Object} report.wind - Wind object with direction, force(s), behavior, modifier, timing
   * @param {string} report.seaState - Sea state
   * @param {string} report.seaTiming - Optional timing for sea state
   * @param {string} report.weather - Weather condition
   * @param {string} report.weatherTiming - Optional timing for weather
   * @param {string} report.visibility - Visibility
   * @param {string} report.visibilityTiming - Optional timing for visibility
   * @param {string} report.pressure - Optional pressure condition
   * @param {string} report.waves - Optional wave/swell condition
   * @returns {string[]} Array of audio file paths to play in sequence
   */
  buildReportSequence(report) {
    const sequence = [];
    const isPhantom = report.area.type === 'phantom';

    // 1. Area name
    sequence.push(this.getAreaPath(report.area.name, isPhantom));

    // 2. Short pause (500ms) after area name
    sequence.push(this.getPausePath('short'));

    // 3. Wind components (enhanced with realistic elements)
    sequence.push(this.getWindDirectionPath(report.wind.direction));

    // Handle compound forces: "5 or 6", "5 to 7"
    if (Array.isArray(report.wind.force)) {
      sequence.push(this.getNumberPath(report.wind.force[0]));
      if (report.wind.connector) {
        sequence.push(this.getConnectorPath(report.wind.connector));
      }
      sequence.push(this.getNumberPath(report.wind.force[1]));
    } else {
      sequence.push(this.getWindForcePath(report.wind.force));
    }

    // Wind behavior (backing, veering, etc.)
    if (report.wind.behavior) {
      sequence.push(this.getWindBehaviorPath(report.wind.behavior));
    }

    // Wind modifier (increasing, decreasing, etc.)
    if (report.wind.modifier) {
      sequence.push(this.getWindModifierPath(report.wind.modifier));
    }

    // Wind timing (later, at first, etc.)
    if (report.wind.timing) {
      sequence.push(this.getTimingPhrasePath(report.wind.timing));
    }

    // 4. Sea state
    sequence.push(this.getSeaStatePath(report.seaState));

    // Sea timing
    if (report.seaTiming) {
      sequence.push(this.getTimingPhrasePath(report.seaTiming));
    }

    // Wave/swell conditions
    if (report.waves) {
      sequence.push(this.getWavePath(report.waves));
    }

    // 5. Weather
    sequence.push(this.getWeatherPath(report.weather));

    // Weather timing
    if (report.weatherTiming) {
      sequence.push(this.getTimingPhrasePath(report.weatherTiming));
    }

    // 6. Visibility
    sequence.push(this.getVisibilityPath(report.visibility));

    // Visibility timing
    if (report.visibilityTiming) {
      sequence.push(this.getTimingPhrasePath(report.visibilityTiming));
    }

    // 7. Pressure condition (optional)
    if (report.pressure) {
      sequence.push(this.getPressurePath(report.pressure));
    }

    // 8. Long pause (1000ms) after complete report
    sequence.push(this.getPausePath('long'));

    return sequence;
  }

  /**
   * Build audio sequence for unsettling message
   * @param {number} messageIndex - Index of message (1-12)
   * @returns {string[]} Array with message path and long pause
   */
  buildUnsettlingSequence(messageIndex) {
    return [
      this.getUnsettlingMessagePath(messageIndex),
      this.getPausePath('long')
    ];
  }

  /**
   * Preload an audio file into cache
   * @param {string} path - Audio file path
   * @returns {Promise<AudioBuffer>} Audio buffer
   */
  async preloadAudio(audioContext, path) {
    if (this.audioCache.has(path)) {
      return this.audioCache.get(path);
    }

    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load audio: ${path}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      this.audioCache.set(path, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.error(`Error loading audio file ${path}:`, error);
      throw error;
    }
  }

  /**
   * Preload multiple audio files
   * @param {AudioContext} audioContext - Web Audio API context
   * @param {string[]} paths - Array of audio file paths
   * @returns {Promise<AudioBuffer[]>} Array of audio buffers
   */
  async preloadMultiple(audioContext, paths) {
    const loadPromises = paths.map(path => this.preloadAudio(audioContext, path));
    return Promise.all(loadPromises);
  }

  /**
   * Clear audio cache
   */
  clearCache() {
    this.audioCache.clear();
  }

  /**
   * Get cache size
   * @returns {number} Number of cached audio files
   */
  getCacheSize() {
    return this.audioCache.size;
  }
}

// Singleton instance
export const audioLibrary = new AudioLibrary();
