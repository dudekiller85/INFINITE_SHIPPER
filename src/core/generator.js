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
  TIMING_PHRASES,
  CONNECTORS,
  WIND_MODIFIERS,
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

    // Generate visibility
    const visibility = getRandomElement(VISIBILITY);
    const visibilityTiming = Math.random() < 0.1 ? getRandomElement(TIMING_PHRASES) : null;

    const timestamp = getCurrentTimestamp();

    // Format report text according to EBNF specification
    const text = this._formatReportText(
      area,
      wind,
      precipitation,
      visibility,
      visibilityTiming,
      icing
    );

    return {
      area,
      wind,
      precipitation,
      icing,
      visibility,
      visibilityTiming,
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
   * Generate wind conditions with realistic BBC variations
   * @private
   * @returns {{direction: string, behavior: string|null, force: number|number[], connector: string|null, modifier: string|null, timing: string|null, forceText: string}}
   */
  _generateWindConditions() {
    const direction = getRandomElement(WIND_DIRECTIONS);

    // 15% chance of compound wind forces (e.g., "4 or 5", "5 to 7")
    const useCompoundForce = Math.random() < 0.15;

    let force;
    let connector = null;

    if (useCompoundForce) {
      const baseForce = getRandomInt(4, 8);
      const secondForce = baseForce + getRandomInt(1, 2);
      force = [baseForce, secondForce];
      // Use common connectors for compound forces
      connector = getRandomElement(CONNECTORS.filter(c => ['or', 'to', 'occasionally'].includes(c)));
    } else {
      force = getRandomInt(4, 12);
    }

    // 20% chance of wind behavior (backing, veering, etc.)
    const behavior = Math.random() < 0.2 ? getRandomElement(WIND_BEHAVIORS) : null;

    // 15% chance of wind modifier (increasing, decreasing, etc.)
    const modifier = Math.random() < 0.15 ? getRandomElement(WIND_MODIFIERS) : null;

    // 12% chance of timing phrase
    const timing = Math.random() < 0.12 ? getRandomElement(TIMING_PHRASES) : null;

    // Generate Beaufort scale text for display
    let forceText;
    if (Array.isArray(force)) {
      // Compound force: handle mixed format when spanning gale threshold (7 to gale 8)
      const force1Text = this._formatWindForce(force[0]);
      const force2Text = this._formatWindForce(force[1]);
      forceText = `${force1Text} ${connector} ${force2Text}`;
    } else {
      forceText = this._formatWindForce(force);
    }

    return {
      direction,
      behavior,
      force,
      connector,
      modifier,
      timing,
      forceText,
    };
  }

  /**
   * Format report text per EBNF specification (lines 61-63)
   * EBNF template: "{Area name}. {Wind [Beaufort]}. {Precipitation}. {Visibility}. [Icing]."
   * Example: "Dogger. Southwest gale 8 to 9. Thundery showers. Good, occasionally poor. Moderate icing."
   * @private
   */
  _formatReportText(area, wind, precipitation, visibility, visibilityTiming, icing) {
    const parts = [];

    // Area name
    parts.push(area.name);

    // Wind with Beaufort scale text (EBNF line 61)
    let windText = wind.direction;

    // Use Beaufort scale formatted text
    windText += ` ${wind.forceText}`;

    // Add wind behavior if present
    if (wind.behavior) {
      const behaviorForce = Array.isArray(wind.force)
        ? Math.max(wind.force[0] - 2, 4)
        : Math.max(wind.force - 2, 4);
      const behaviorForceText = this._formatWindForce(behaviorForce);
      windText += `, ${wind.behavior.toLowerCase()} ${behaviorForceText}`;
    }

    // Add wind modifier if present
    if (wind.modifier) {
      windText += `, ${wind.modifier}`;
    }

    // Add wind timing if present
    if (wind.timing) {
      windText += ` ${wind.timing}`;
    }

    parts.push(windText);

    // Precipitation (EBNF-compliant, replaces sea state and weather)
    parts.push(precipitation.text);

    // Visibility with optional timing/patterns (EBNF lines 52-57)
    let visibilityText = visibility;
    if (visibilityTiming) {
      visibilityText += `, becoming ${visibility.toLowerCase()}`;
    }
    parts.push(visibilityText);

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
