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
  // 85% for standard areas creates slow, deliberate BBC Radio 4 cadence
  // 90% for phantom areas (additional to pitch reduction)
  rates: {
    standard: 0.85,      // 85% of normal speed for standard areas
    phantom: 0.9         // 90% for phantom (combined with 10% pitch reduction)
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
  // Controls vocal stress and prominence
  emphasis: {
    areaName: 'strong',      // FR-019: Area names are headers, need strong emphasis
    visibility: 'reduced',   // FR-026: Visibility de-emphasized for vocal variation
    default: 'moderate'      // Default for most content
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

  // Pronunciation corrections using IPA phonemes
  // For area names that are commonly mispronounced by TTS engines
  pronunciations: {
    'North Utsire': {
      word: 'Utsire',
      ipa: 'ˈuːtsɪrə',  // OOT-seer-uh (Norwegian pronunciation)
      notes: 'Norwegian place name'
    },
    'South Utsire': {
      word: 'Utsire',
      ipa: 'ˈuːtsɪrə',  // OOT-seer-uh
      notes: 'Norwegian place name'
    },
    'Cromarty': {
      word: 'Cromarty',
      ipa: 'ˈkrɒmərti',     // KROM-ar-tee
      notes: 'Scottish place name'
    },
    'Faeroes': {
      word: 'Faeroes',
      ipa: 'ˈfɛəroʊz',      // FAIR-ohs
      notes: 'Islands between Iceland and Norway'
    },
    'FitzRoy': {
      word: 'FitzRoy',
      ipa: 'fɪtsˈrɔɪ',      // fits-ROY
      notes: 'Named after Admiral Robert FitzRoy'
    },
    'Hebrides': {
      word: 'Hebrides',
      ipa: 'ˈhɛbrɪdiːz',    // HEB-ri-deez
      notes: 'Scottish islands'
    },
    'Malin': {
      word: 'Malin',
      ipa: 'ˈmælɪn',        // MAL-in
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
