/**
 * BBC Radio 4 Prosody Configuration
 *
 * Defines timing, emphasis, and vocal characteristics for natural speech generation
 * Based on FR-014, FR-019-030 from feature specification
 *
 * @see /specs/002-natural-speech-generation/spec.md
 */

export const PROSODY_CONFIG = {
  // Speaking rates (FR-014)
  // Removed rate adjustments - using natural speech speed
  rates: {
    standard: 1.0,       // 100% normal speed
    phantom: 1.0         // Same as standard - no speed adjustment
  },

  // Pause durations in milliseconds (FR-020 through FR-025)
  // These create the characteristic hypnotic rhythm of BBC Radio 4
  breaks: {
    afterAreaName: '800ms',       // FR-020: Long pause after area name header
    afterWindDirection: '200ms',   // FR-021: Brief pause after wind direction
    afterWindForce: '600ms',       // FR-022: Standard component pause
    afterSeaState: '600ms',        // FR-023: Standard component pause
    afterWeather: '600ms',         // FR-024: Standard component pause
    afterVisibility: '600ms',      // Visibility pause (same as other components)
    endOfReport: '1500ms'          // FR-025: Long pause between reports
  },

  // Emphasis levels (FR-019, FR-026)
  // Removed emphasis - using natural speech without artificial stress
  emphasis: {
    areaName: 'none',        // No emphasis on area names
    visibility: 'none',      // No emphasis on visibility
    default: 'none'          // No emphasis on any content
  },

  // Phantom area effects (FR-027, FR-028)
  // Creates unsettling "sagging" vocal effect for phantom areas
  phantom: {
    speedMultiplier: 0.9,    // FR-009: 10% slower than standard (0.9 rate)

    // FR-027, FR-028: Pitch contour that creates unsettling effect
    // Pitch drops mid-report and partially recovers at end
    pitchContour: {
      start: '+0%',          // Area name: normal pitch (maintains authority)
      middle: '-12%',        // Wind/sea: maximum pitch drop (within 10-15% spec)
      end: '-6%'             // Visibility/pressure: partial recovery (50% back)
    }
  },

  // Pronunciation corrections using phonetic respelling
  // IPA phoneme tags don't work reliably with Neural2 voices, so using direct text replacement
  pronunciations: {
    'North Utsire': {
      word: 'Utsire',
      respelling: 'Uutt-seerra',  // Phonetic respelling
      notes: 'Norwegian place name'
    },
    'South Utsire': {
      word: 'Utsire',
      respelling: 'Uutt-seerra',  // Phonetic respelling
      notes: 'Norwegian place name'
    },
    'Cromarty': {
      word: 'Cromarty',
      respelling: 'KROM-ar-tee',  // Phonetic respelling
      notes: 'Scottish place name'
    },
    'Faeroes': {
      word: 'Faeroes',
      respelling: 'FAIR-ohs',  // Phonetic respelling
      notes: 'Islands between Iceland and Norway'
    },
    'FitzRoy': {
      word: 'FitzRoy',
      respelling: 'fits-ROY',  // Phonetic respelling
      notes: 'Named after Admiral Robert FitzRoy'
    },
    'Hebrides': {
      word: 'Hebrides',
      respelling: 'HEB-ri-deez',  // Phonetic respelling
      notes: 'Scottish islands'
    },
    'Malin': {
      word: 'Malin',
      respelling: 'MAL-in',  // Phonetic respelling
      notes: 'Irish headland'
    }
  }
};

/**
 * Get speaking rate for area type
 * @param {boolean} isPhantom - Whether this is a phantom area
 * @returns {number} Speaking rate multiplier
 */
export function getSpeakingRate(isPhantom) {
  return isPhantom ? PROSODY_CONFIG.rates.phantom : PROSODY_CONFIG.rates.standard;
}

/**
 * Get pitch for phantom area section
 * @param {'start'|'middle'|'end'} section - Which section of the report
 * @returns {string} Pitch percentage string (e.g., '-12%')
 */
export function getPhantomPitch(section) {
  return PROSODY_CONFIG.phantom.pitchContour[section];
}

/**
 * Get break time for component
 * @param {string} component - Component name
 * @returns {string} Break time string (e.g., '800ms')
 */
export function getBreakTime(component) {
  const key = 'after' + component.charAt(0).toUpperCase() + component.slice(1);
  return PROSODY_CONFIG.breaks[key] || PROSODY_CONFIG.breaks.afterWindForce;
}
