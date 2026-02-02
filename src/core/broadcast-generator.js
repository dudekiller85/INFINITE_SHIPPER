/**
 * Broadcast Structure Generator
 *
 * Orchestrates complete shipping forecast broadcasts with:
 * - Introduction (timestamp/date, Met Office attribution)
 * - Gale Warnings (conditional, force 8+)
 * - Time Period Transition
 * - Area Forecasts (from existing generator)
 *
 * Implements User Stories 1, 2, 3 from specs/003-broadcast-structure/spec.md
 *
 * @see /specs/003-broadcast-structure/data-model.md
 * @see /specs/003-broadcast-structure/plan.md Phase 2C
 */

import { WeatherReportGenerator } from './generator.js';
import { STANDARD_AREAS } from './areas.js';
import {
  selectIntroductionVariant,
  selectTimePeriodVariant
} from '../audio/broadcast-variants.js';
import { formatBBCTime, formatBBCDate } from '../utils/date-formatter.js';
import {
  PRESSURE_DESCRIPTIONS,
  RATE_OF_CHANGE,
  COMPASS_DIRECTIONS_SYNOPSIS,
  getRandomElement,
  getRandomInt,
} from './vocabulary.js';

/**
 * Broadcast Generator
 *
 * Main orchestrator for complete broadcast structure generation
 */
export class BroadcastGenerator {
  constructor() {
    this.weatherGenerator = new WeatherReportGenerator();
  }

  /**
   * Generate complete broadcast with all segments
   *
   * Structure: Introduction → Gale Warnings (conditional) → General Synopsis → Time Period → Area Forecasts
   *
   * @param {number} [areaCount=31] - Number of area forecasts to generate (default: all 31 standard areas)
   * @returns {Object} Complete broadcast object
   * @returns {string} return.broadcastId - Unique identifier
   * @returns {Date} return.timestamp - Generation timestamp
   * @returns {Object} return.introduction - Introduction segment
   * @returns {Object|null} return.galeWarnings - Gale warnings segment (null if no gales)
   * @returns {Object} return.generalSynopsis - General synopsis segment (NEW EBNF feature)
   * @returns {Object} return.timePeriod - Time period transition
   * @returns {Array} return.areaForecasts - Array of area forecast objects
   * @returns {Date} return.createdAt - Generation timestamp
   */
  generateBroadcast(areaCount = 31) {
    const timestamp = new Date();
    const broadcastId = this._generateBroadcastId();

    // Generate area forecasts using existing generator
    const areaForecasts = [];
    for (let i = 0; i < areaCount; i++) {
      areaForecasts.push(this.weatherGenerator.generateWeatherReport());
    }

    // Build broadcast segments per EBNF specification
    const introduction = this._buildIntroduction(timestamp);
    const galeWarnings = this._buildGaleWarnings(areaForecasts);
    const generalSynopsis = this._buildGeneralSynopsis(); // NEW EBNF feature
    const timePeriod = this._buildTimePeriod();

    return {
      broadcastId,
      timestamp,
      introduction,
      galeWarnings,
      generalSynopsis,
      timePeriod,
      areaForecasts,
      createdAt: timestamp
    };
  }

  /**
   * Build introduction segment with timestamp/date
   *
   * Selects introduction variant and substitutes timestamp/date using BBC format.
   * Implements FR-001 through FR-007.
   *
   * @param {Date} timestamp - Current timestamp for broadcast
   * @returns {Object} Introduction segment
   * @returns {string} return.variantId - Selected variant ID
   * @returns {string} return.authority - Issuing authority text
   * @returns {string} return.timestamp - BBC formatted time
   * @returns {string} return.date - BBC formatted date
   * @returns {string} return.text - Complete introduction text
   * @returns {boolean} return.isSurreal - Whether surreal variant was selected
   * @private
   */
  _buildIntroduction(timestamp) {
    // Select variant using weighted random selection
    const variant = selectIntroductionVariant();

    // Format timestamp and date in BBC style
    const time = formatBBCTime(timestamp);
    const date = formatBBCDate(timestamp);

    // Substitute placeholders in template
    let text = variant.template;
    text = text.replace('{authority}', variant.authorityTemplate);
    text = text.replace('{time}', time);
    text = text.replace('{date}', date);

    return {
      variantId: variant.id,
      authority: variant.authorityTemplate,
      timestamp: time,
      date: date,
      text: text,
      isSurreal: variant.isSurreal
    };
  }

  /**
   * Build gale warnings segment (conditional)
   *
   * Checks all area forecasts for force 8+ winds.
   * Lists affected areas using standard format (<16 areas) or inverse format (16+ areas).
   * If no gales, returns null (segment omitted from broadcast).
   *
   * Implements FR-008 through FR-015.
   *
   * @param {Array} areaForecasts - Array of area forecast objects
   * @returns {Object|null} Gale warnings segment or null
   * @returns {Array} return.affectedAreas - Array of area names with force 8+
   * @returns {string} return.formatType - 'standard' or 'inverse'
   * @returns {string} return.text - Complete gale warnings text
   * @private
   */
  _buildGaleWarnings(areaForecasts) {
    // Check if any gales exist
    if (!this._hasGales(areaForecasts)) {
      return null;
    }

    // Extract area names with gale force winds
    const galeAreaNames = this._extractGaleAreaNames(areaForecasts);

    // Order areas geographically (north to south) using STANDARD_AREAS sequence
    const orderedAreas = this._orderAreasGeographically(galeAreaNames);

    // Determine format based on threshold (16 areas)
    const useInverseFormat = orderedAreas.length >= 16;
    let text;
    let listedAreas;

    if (useInverseFormat) {
      // Inverse format: list areas WITHOUT gales
      const allAreaNames = areaForecasts.map(f => f.area.name);
      const orderedAllAreas = this._orderAreasGeographically(allAreaNames);
      const nonGaleAreas = orderedAllAreas.filter(name => !orderedAreas.includes(name));

      text = 'Gale warnings are in effect in all areas except: ' + nonGaleAreas.join(', ');
      listedAreas = nonGaleAreas;
    } else {
      // Standard format: list areas WITH gales
      text = 'Gale warnings are in effect for: ' + orderedAreas.join(', ');
      listedAreas = orderedAreas;
    }

    return {
      affectedAreas: orderedAreas,
      listedAreas: listedAreas,
      formatType: useInverseFormat ? 'inverse' : 'standard',
      text: text
    };
  }

  /**
   * Build time period transition segment
   *
   * Selects time period variant for forecast validity announcement.
   * Implements FR-016 through FR-020.
   *
   * @returns {Object} Time period segment
   * @returns {string} return.variantId - Selected variant ID
   * @returns {string} return.duration - Time period phrase
   * @returns {number} return.validityHours - Forecast validity duration (typically 24)
   * @returns {string} return.text - Complete time period text
   * @private
   */
  _buildTimePeriod() {
    // Select time period variant
    const variant = selectTimePeriodVariant();

    // For now, all forecasts are 24 hours (can be made dynamic in future)
    const validityHours = 24;

    return {
      variantId: variant.id,
      duration: variant.template,
      validityHours: validityHours,
      text: variant.template
    };
  }

  /**
   * Build general synopsis segment (NEW EBNF feature)
   *
   * Generates pressure system summary with current location, optional change, and expected position.
   * Implements EBNF lines 33-38.
   *
   * Format: "The general synopsis:\n\n{Pressure} {direction} of {area} {pressure}, [{change} {rate},] expected {direction} of {area} {pressure} by {time}."
   *
   * Example: "The general synopsis:\n\nLow north of Viking 998, deepening slowly, expected west of Faeroes 992 by 18:00 tomorrow."
   *
   * @returns {Object} General synopsis segment
   * @returns {string} return.pressureDescription - High/Medium/Low
   * @returns {string} return.currentDirection - Compass direction
   * @returns {string} return.currentArea - Sea area name
   * @returns {number} return.currentPressure - Pressure in mb (900-1099)
   * @returns {string|null} return.changeType - 'deepening' or 'clearing' (50% probability)
   * @returns {string|null} return.changeRate - Rate of change (if change present)
   * @returns {string} return.expectedDirection - Future compass direction
   * @returns {string} return.expectedArea - Future sea area name
   * @returns {number} return.expectedPressure - Future pressure in mb
   * @returns {string} return.expectedTime - Future time (HH:MM or HH:MM tomorrow)
   * @returns {string} return.text - Complete synopsis text
   * @private
   */
  _buildGeneralSynopsis() {
    // Current pressure system
    const pressureDescription = getRandomElement(PRESSURE_DESCRIPTIONS);
    const currentDirection = getRandomElement(COMPASS_DIRECTIONS_SYNOPSIS);
    const currentArea = getRandomElement(STANDARD_AREAS);
    const currentPressure = getRandomInt(900, 1099);

    // Optional change clause (50% probability per EBNF spec)
    let changeType = null;
    let changeRate = null;
    let changeMagnitude = 0;

    if (Math.random() < 0.5) {
      changeType = getRandomElement(['deepening', 'clearing']);
      changeRate = getRandomElement(RATE_OF_CHANGE);
      changeMagnitude = this._calculatePressureMagnitude(changeRate);

      // Apply change direction to pressure
      if (changeType === 'deepening') {
        changeMagnitude = -changeMagnitude; // Deepening = pressure decreases
      }
    }

    // Expected future position
    const expectedDirection = getRandomElement(COMPASS_DIRECTIONS_SYNOPSIS);
    const expectedArea = getRandomElement(STANDARD_AREAS);
    const expectedPressure = currentPressure + changeMagnitude;
    const expectedTime = this._formatFutureTime();

    // Format text per EBNF specification
    let text = 'The general synopsis:\n\n';
    text += `${pressureDescription} ${currentDirection} of ${currentArea} ${currentPressure}`;

    if (changeType && changeRate) {
      text += `, ${changeType} ${changeRate},`;
    }

    text += ` expected ${expectedDirection} of ${expectedArea} ${expectedPressure} by ${expectedTime}.`;

    return {
      pressureDescription,
      currentDirection,
      currentArea,
      currentPressure,
      changeType,
      changeRate,
      expectedDirection,
      expectedArea,
      expectedPressure,
      expectedTime,
      text
    };
  }

  /**
   * Calculate pressure magnitude change based on rate of change
   *
   * Maps rate phrases to millibar changes per EBNF specification
   *
   * @param {string} rate - Rate of change phrase
   * @returns {number} Pressure change magnitude in mb
   * @private
   */
  _calculatePressureMagnitude(rate) {
    const magnitudeMap = {
      'more slowly': getRandomInt(3, 5),   // 3-5mb
      'slowly': getRandomInt(4, 6),        // 4-6mb
      'quickly': getRandomInt(8, 10),      // 8-10mb
      'very rapidly': getRandomInt(10, 12) // 10-12mb
    };

    return magnitudeMap[rate] || 5; // Default to 5mb if unknown
  }

  /**
   * Format future time for general synopsis expected position
   *
   * Generates time between 3-24 hours in future, with optional "tomorrow" suffix
   *
   * @returns {string} Future time (HH:MM or HH:MM tomorrow)
   * @private
   */
  _formatFutureTime() {
    const now = new Date();
    const hoursAhead = getRandomInt(3, 24);
    const future = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    const hours = String(future.getHours()).padStart(2, '0');
    const minutes = String(future.getMinutes()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    // Add "tomorrow" suffix if crossed midnight
    if (future.getDate() !== now.getDate()) {
      return `${timeString} tomorrow`;
    }

    return timeString;
  }

  /**
   * Check if any area forecasts have gale force winds (8+)
   *
   * @param {Array} areaForecasts - Array of area forecast objects
   * @returns {boolean} True if any gales exist
   * @private
   */
  _hasGales(areaForecasts) {
    return areaForecasts.some((forecast) => {
      const force = forecast.wind.force;

      // Handle both single force and force ranges
      if (Array.isArray(force)) {
        return Math.max(...force) >= 8;
      }

      return force >= 8;
    });
  }

  /**
   * Extract area names with gale force winds (8+)
   *
   * @param {Array} areaForecasts - Array of area forecast objects
   * @returns {Array} Array of area names with force 8+
   * @private
   */
  _extractGaleAreaNames(areaForecasts) {
    const galeAreas = [];

    areaForecasts.forEach((forecast) => {
      const force = forecast.wind.force;
      let maxForce;

      // Handle both single force and force ranges
      if (Array.isArray(force)) {
        maxForce = Math.max(...force);
      } else {
        maxForce = force;
      }

      if (maxForce >= 8) {
        galeAreas.push(forecast.area.name);
      }
    });

    return galeAreas;
  }

  /**
   * Order area names geographically using STANDARD_AREAS sequence
   *
   * BBC ordering convention: north to south, following the established
   * 31-area sequence. Per research.md RQ-002.
   *
   * @param {Array} areaNames - Array of area names
   * @returns {Array} Geographically ordered area names
   * @private
   */
  _orderAreasGeographically(areaNames) {
    return areaNames.sort((a, b) => {
      const indexA = STANDARD_AREAS.indexOf(a);
      const indexB = STANDARD_AREAS.indexOf(b);

      // If area not found in standard areas (e.g., phantom), put at end
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexA - indexB;
    });
  }

  /**
   * Generate unique broadcast ID
   *
   * Format: broadcast-[8 hex chars]
   *
   * @returns {string} Broadcast ID
   * @private
   */
  _generateBroadcastId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 0xffffffff);
    const combined = timestamp ^ random;
    const hex = combined.toString(16).padStart(8, '0').substring(0, 8);
    return `broadcast-${hex}`;
  }
}

// Export singleton instance (class already exported at declaration)
export const broadcastGenerator = new BroadcastGenerator();
