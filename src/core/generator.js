/**
 * Weather report generator
 * Produces procedural weather reports for sea areas
 */

import { STANDARD_AREAS, PHANTOM_AREAS } from './areas.js';
import {
  WIND_DIRECTIONS,
  WIND_BEHAVIORS,
  PRECIPITATION_MODIFIERS,
  PRECIPITATION_TYPES,
  ICING_SEVERITIES,
  VISIBILITY,
  getRandomElement,
  getRandomInt,
} from './vocabulary.js';
import { getCurrentTimestamp } from '../utils/timing.js';

/**
 * Fisher-Yates shuffle algorithm
 * @param {Array} array - Array to shuffle (not mutated)
 * @returns {Array} New shuffled array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Weather Report Generator
 */
export class WeatherReportGenerator {
  constructor() {
    this.currentAreaIndex = 0;
    this.shuffledAreas = shuffleArray(STANDARD_AREAS);
  }

  /**
   * Generate a weather report for the next area
   * @returns {{
   *   area: {name: string, type: string, id: string},
   *   wind: {direction: string, behavior: string|null, force: number|number[], connector: string|null, modifier: string|null, timing: string|null},
   *   seaState: string,
   *   seaTiming: string|null,
   *   weather: string,
   *   weatherTiming: string|null,
   *   visibility: string,
   *   visibilityTiming: string|null,
   *   pressure: string|null,
   *   waves: string|null,
   *   timestamp: string,
   *   text: string
   * }}
   */
  generateWeatherReport() {
    // Determine if this should be a phantom area (2% probability)
    const isPhantom = Math.random() < 0.02;

    // Select area
    let areaName;
    let areaType;

    if (isPhantom) {
      areaName = getRandomElement(PHANTOM_AREAS);
      areaType = 'phantom';
    } else {
      areaName = this.shuffledAreas[this.currentAreaIndex];
      areaType = 'standard';

      // Advance to next area
      this.currentAreaIndex++;

      // If we've cycled through all standard areas, reshuffle
      if (this.currentAreaIndex >= this.shuffledAreas.length) {
        this.currentAreaIndex = 0;
        this.shuffledAreas = shuffleArray(STANDARD_AREAS);
      }
    }

    const area = {
      name: areaName,
      type: areaType,
      id: areaName.toLowerCase().replace(/\s+/g, '-'),
    };

    // Generate wind with realistic variations
    const wind = this._generateWindConditions();

    // Generate EBNF-compliant precipitation (replaces generic weather)
    const precipitation = this._generatePrecipitation();

    // Generate EBNF-compliant icing (10% probability)
    const icing = this._generateIcing();

    // Generate EBNF-compliant visibility (with compound patterns)
    const visibility = this._generateVisibility();
    console.log('[Generator] Visibility:', visibility);

    const timestamp = getCurrentTimestamp();

    // Format report text according to EBNF specification
    const text = this._formatReportText(
      area,
      wind,
      precipitation,
      visibility,
      icing
    );

    return {
      area,
      wind,
      precipitation,
      icing,
      visibility,
      timestamp,
      text,
    };
  }

  /**
   * Generate EBNF-compliant precipitation (EBNF lines 40-42)
   * @private
   * @returns {{modifier: string, type: string, text: string}}
   */
  _generatePrecipitation() {
    const modifier = getRandomElement(PRECIPITATION_MODIFIERS);
    const type = getRandomElement(PRECIPITATION_TYPES);
    return {
      modifier,
      type,
      text: `${modifier} ${type}`,
    };
  }

  /**
   * Generate EBNF-compliant icing conditions (EBNF line 59)
   * @private
   * @returns {{severity: string, text: string}|null}
   */
  _generateIcing() {
    // 10% probability of icing per spec clarification
    if (Math.random() > 0.1) {
      return null;
    }
    const severity = getRandomElement(ICING_SEVERITIES);
    return {
      severity,
      text: `${severity} icing`,
    };
  }

  /**
   * Generate EBNF-compliant visibility (EBNF lines 52-57)
   * Implements all patterns:
   * - Single: "Good"
   * - Compound with "or": "Good or moderate"
   * - Compound with "occasionally": "Good, occasionally poor" or "Good, occasionally poor later"
   * - Compound with "becoming": "Good, becoming moderate" or "Good, becoming moderate later"
   * @private
   * @returns {string} Visibility text
   */
  _generateVisibility() {
    const initialVisibility = getRandomElement(VISIBILITY);

    // 100% chance of compound visibility (temporarily for testing)
    const useCompound = Math.random() < 1.0;

    if (!useCompound) {
      return initialVisibility;
    }

    // For compound patterns, we need a different subsequent visibility
    const subsequentOptions = VISIBILITY.filter(v => v !== initialVisibility);
    const subsequentVisibility = getRandomElement(subsequentOptions).toLowerCase();

    // Choose compound pattern type
    const patternType = Math.random();

    if (patternType < 0.25) {
      // Pattern: "Good or moderate"
      return `${initialVisibility} or ${subsequentVisibility}`;
    } else if (patternType < 0.625) {
      // Pattern: "Good, occasionally poor" (50% with "later")
      const withLater = Math.random() < 0.5 ? ' later' : '';
      return `${initialVisibility}, occasionally ${subsequentVisibility}${withLater}`;
    } else {
      // Pattern: "Good, becoming moderate" (50% with "later")
      const withLater = Math.random() < 0.5 ? ' later' : '';
      return `${initialVisibility}, becoming ${subsequentVisibility}${withLater}`;
    }
  }

  /**
   * Format wind force using Beaufort scale text for forces 8-12 (EBNF line 45)
   * @private
   * @param {number} force - Wind force (0-12)
   * @returns {string} Formatted force text
   */
  _formatWindForce(force) {
    const beaufortMap = {
      8: 'gale 8',
      9: 'severe gale 9',
      10: 'storm 10',
      11: 'violent storm 11',
      12: 'hurricane force 12',
    };
    return beaufortMap[force] || String(force);
  }

  /**
   * Generate EBNF-compliant wind conditions (EBNF lines 45-50)
   * Implements patterns:
   * - Simple: "Northwesterly 5"
   * - Compound strength: "Northwesterly 5 to 7"
   * - With change: "Northwesterly 5 to 7, backing southwesterly 4"
   * - With change + occasional: "Northwesterly 5 to 7, backing southwesterly 4, occasionally easterly 6"
   * @private
   * @returns {{direction: string, force: number|number[], forceText: string, windChange: string|null, subsequentWind: object|null, occasionalWind: object|null}}
   */
  _generateWindConditions() {
    // Initial wind direction (capitalized per EBNF)
    const direction = getRandomElement(WIND_DIRECTIONS);

    // 20% chance of compound wind forces (EBNF: " to " connector only)
    const useCompoundForce = Math.random() < 0.2;

    let force;
    let forceText;

    if (useCompoundForce) {
      const baseForce = getRandomInt(3, 10);
      const secondForce = baseForce + getRandomInt(1, 3);
      force = [baseForce, Math.min(secondForce, 12)];
      // Compound force: handle mixed format when spanning gale threshold (7 to gale 8)
      const force1Text = this._formatWindForce(force[0]);
      const force2Text = this._formatWindForce(force[1]);
      forceText = `${force1Text} to ${force2Text}`;
    } else {
      force = getRandomInt(3, 12);
      forceText = this._formatWindForce(force);
    }

    // 25% chance of wind change (EBNF: backing, veering, becoming cyclonic)
    const hasWindChange = Math.random() < 0.25;
    let windChange = null;
    let subsequentWind = null;
    let occasionalWind = null;

    if (hasWindChange) {
      // EBNF wind_change: "becoming cyclonic" | "veering" | "backing"
      windChange = getRandomElement(WIND_BEHAVIORS.filter(b => b !== null));

      // Generate subsequent wind (lowercase direction per EBNF)
      const subsequentDirection = getRandomElement(WIND_DIRECTIONS).toLowerCase();
      const subsequentForce = getRandomInt(3, 10);
      const subsequentForceText = this._formatWindForce(subsequentForce);

      // 50% chance of "later" suffix
      const laterSuffix = Math.random() < 0.5 ? ' later' : '';

      subsequentWind = {
        direction: subsequentDirection,
        force: subsequentForce,
        text: `${subsequentDirection} ${subsequentForceText}${laterSuffix}`
      };

      // 30% chance of occasional subsequent wind (EBNF: ", occasionally " <subsequent_wind>)
      if (Math.random() < 0.3) {
        const occasionalDirection = getRandomElement(WIND_DIRECTIONS).toLowerCase();
        const occasionalForce = getRandomInt(3, 10);
        const occasionalForceText = this._formatWindForce(occasionalForce);

        // 50% chance of "later" suffix
        const occasionalLater = Math.random() < 0.5 ? ' later' : '';

        occasionalWind = {
          direction: occasionalDirection,
          force: occasionalForce,
          text: `${occasionalDirection} ${occasionalForceText}${occasionalLater}`
        };
      }
    }

    return {
      direction,
      force,
      forceText,
      windChange,
      subsequentWind,
      occasionalWind
    };
  }

  /**
   * Format report text per EBNF specification (lines 61-63)
   * EBNF template: "{Area name}. {Wind [Beaufort]}. {Precipitation}. {Visibility}. [Icing]."
   * Example: "Dogger. Southwest gale 8 to 9. Thundery showers. Good, occasionally poor. Moderate icing."
   * @private
   */
  _formatReportText(area, wind, precipitation, visibility, icing) {
    const parts = [];

    // Area name
    parts.push(area.name);

    // Wind per EBNF specification (lines 47-50)
    // Pattern: <initial_wind> [", " <wind_change> " " <subsequent_wind> [", occasionally " <occasional_wind>]]
    let windText = `${wind.direction} ${wind.forceText}`;

    // Add wind change and subsequent wind if present
    if (wind.windChange && wind.subsequentWind) {
      windText += `, ${wind.windChange.toLowerCase()} ${wind.subsequentWind.text}`;

      // Add occasional wind if present
      if (wind.occasionalWind) {
        windText += `, occasionally ${wind.occasionalWind.text}`;
      }
    }

    parts.push(windText);

    // Precipitation (EBNF-compliant, replaces sea state and weather)
    parts.push(precipitation.text);

    // Visibility (EBNF lines 52-57) - already formatted by _generateVisibility()
    parts.push(visibility);

    // Icing (EBNF line 59) - optional, appears at end per spec
    if (icing) {
      parts.push(icing.text);
    }

    // Join with periods and spaces
    return parts.join('. ') + '.';
  }

  /**
   * Get current area index in the cycle
   * @returns {number}
   */
  getCurrentAreaIndex() {
    return this.currentAreaIndex;
  }

  /**
   * Reset the area cycling (reshuffle and start from beginning)
   */
  resetCycle() {
    this.currentAreaIndex = 0;
    this.shuffledAreas = shuffleArray(STANDARD_AREAS);
  }
}

// Singleton instance
export const weatherGenerator = new WeatherReportGenerator();
