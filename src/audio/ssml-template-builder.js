/**
 * SSML Template Builder
 *
 * Builds SSML (Speech Synthesis Markup Language) templates from weather reports.
 * Applies BBC Radio 4 shipping forecast prosody rules including breaks, emphasis,
 * and prosody adjustments for natural speech generation.
 *
 * Phase 2: T007 - Skeleton Implementation
 */

import { PROSODY_CONFIG } from './prosody-config.js';

/**
 * SSMLTemplateBuilder
 *
 * Converts weather report data into SSML templates with proper prosody markup.
 * Handles standard and phantom areas with different prosody rules.
 *
 * @class
 */
export class SSMLTemplateBuilder {
  /**
   * Constructor
   *
   * Initializes the SSML template builder with default configuration.
   *
   * TODO: Initialize with PROSODY_CONFIG for rule management
   */
  constructor() {
    // TODO: Initialize prosody rules from PROSODY_CONFIG
  }

  /**
   * Build SSML template from weather report (UPDATED for EBNF compliance)
   *
   * Main entry point that converts a complete weather report into an SSML template
   * object with proper markup for BBC Radio 4 shipping forecast style delivery.
   *
   * EBNF Format: {Area}. {Wind [Beaufort]}. {Precipitation}. {Visibility}. [Icing].
   *
   * @param {Object} report - Weather report data
   * @param {string} report.area - Sea area name (e.g., "Viking", "Dogger")
   * @param {boolean} report.isPhantom - Whether this is a phantom area
   * @param {Object} report.wind - Wind information with forceText (Beaufort scale)
   * @param {Object} report.precipitation - Precipitation information (NEW EBNF)
   * @param {Object} report.visibility - Visibility information
   * @param {Object|null} report.icing - Icing information (NEW EBNF, optional)
   *
   * @returns {Object} SSMLTemplate object with structure:
   *   {
   *     ssml: string - Complete SSML markup with prosody
   *     reportId: string - Unique identifier for tracking
   *     areaName: string - Area name for logging
   *     isPhantom: boolean - Phantom area flag
   *     characterCount: number - Character count for billing
   *     createdAt: string - ISO 8601 timestamp
   *   }
   */
  build(report) {
    // Validate input structure
    if (!report || !report.area || !report.wind) {
      throw new Error('Invalid report structure: area and wind are required');
    }

    // Extract area name (handle both string and object formats)
    const areaName = typeof report.area === 'string' ? report.area : report.area.name;
    const isPhantom = report.isPhantom || (report.area.type === 'phantom');

    // Generate unique report ID
    const reportId = this._generateReportId(areaName);

    // Determine speaking rate based on area type
    const rate = isPhantom
      ? Math.round(PROSODY_CONFIG.rates.phantom * 100)
      : Math.round(PROSODY_CONFIG.rates.standard * 100);

    // Build SSML components per EBNF specification
    const areaSSML = this._buildAreaSSML(areaName);
    const breakAfterArea = `<break time="${PROSODY_CONFIG.breaks.afterAreaName}"/>`;

    const windSSML = this._buildWindSSML(report.wind);

    // NEW EBNF: Precipitation replaces sea state and weather
    const precipitationSSML = report.precipitation
      ? this._buildPrecipitationSSML(report.precipitation)
      : '';

    // Visibility (no emphasis when level is 'none')
    const visibilitySSML = report.visibility
      ? this._wrapWithEmphasis(this._escape(report.visibility), PROSODY_CONFIG.emphasis.visibility) + `<break time="${PROSODY_CONFIG.breaks.afterVisibility}"/>`
      : '';

    // NEW EBNF: Icing (optional, appears at end)
    const icingSSML = report.icing
      ? this._buildIcingSSML(report.icing)
      : '';

    // Assemble final SSML (only wrap with prosody if rate is not 100%)
    const content = `${areaSSML}${breakAfterArea}${windSSML}${precipitationSSML}${visibilitySSML}${icingSSML}<break time="${PROSODY_CONFIG.breaks.endOfReport}"/>`;
    const ssml = rate === 100
      ? `<speak>${content}</speak>`
      : `<speak><prosody rate="${rate}%">${content}</prosody></speak>`;

    return {
      ssml,
      reportId,
      areaName,
      isPhantom,
      characterCount: ssml.length,
      createdAt: Date.now()
    };
  }

  /**
   * Build simple SSML for area name only (for testing)
   *
   * Creates a minimal SSML template with just the area name,
   * including proper pronunciation hints and prosody.
   *
   * @param {string} areaName - Area name
   * @param {boolean} isPhantom - Whether this is a phantom area
   *
   * @returns {string} Complete SSML string for just the area name
   */
  buildAreaNameSSML(areaName, isPhantom = false) {
    const rate = isPhantom
      ? Math.round(PROSODY_CONFIG.rates.phantom * 100)
      : Math.round(PROSODY_CONFIG.rates.standard * 100);

    const emphasisLevel = isPhantom ? PROSODY_CONFIG.emphasis.default : PROSODY_CONFIG.emphasis.areaName;

    const areaSSML = this._buildAreaSSML(areaName);

    // Only wrap with prosody if rate is not 100%
    if (rate === 100) {
      return `<speak>${areaSSML}<break time="1000ms"/></speak>`;
    }
    return `<speak><prosody rate="${rate}%">${areaSSML}<break time="1000ms"/></prosody></speak>`;
  }

  /**
   * Build complete broadcast SSML from broadcast object (UPDATED for EBNF)
   *
   * Generates SSML for complete EBNF-compliant broadcast structure:
   * Introduction → Gale Warnings (conditional) → General Synopsis → Time Period → Area Forecasts
   *
   * All segments wrapped in single <speak> tag with BBC Radio 4 prosody (85% rate).
   *
   * @param {Object} broadcast - Complete broadcast object from broadcast-generator
   * @param {Object} broadcast.introduction - Introduction segment
   * @param {Object|null} broadcast.galeWarnings - Gale warnings (null if no gales)
   * @param {Object} broadcast.generalSynopsis - General synopsis segment (NEW EBNF)
   * @param {Object} broadcast.timePeriod - Time period transition
   * @param {Array} broadcast.areaForecasts - Area forecast array
   * @param {string} broadcast.broadcastId - Broadcast ID
   *
   * @returns {Object} SSML template object
   * @returns {string} return.ssml - Complete SSML document
   * @returns {string} return.reportId - Broadcast ID
   * @returns {number} return.characterCount - Total character count
   * @returns {number} return.createdAt - Generation timestamp
   * @returns {Object} return.metadata - Broadcast metadata
   */
  buildBroadcast(broadcast) {
    let ssmlContent = '';

    // Build introduction SSML
    ssmlContent += this._buildIntroductionSSML(broadcast.introduction);

    // Build gale warnings SSML (if present)
    if (broadcast.galeWarnings) {
      ssmlContent += this._buildGaleWarningsSSML(broadcast.galeWarnings);
    }

    // Build general synopsis SSML (NEW EBNF feature)
    if (broadcast.generalSynopsis) {
      ssmlContent += this._buildGeneralSynopsisSSML(broadcast.generalSynopsis);
    }

    // Build time period SSML
    ssmlContent += this._buildTimePeriodSSML(broadcast.timePeriod);

    // Build area forecast SSML (use existing build() method for each area)
    broadcast.areaForecasts.forEach((forecast) => {
      const areaTemplate = this.build(forecast);
      // Extract just the content inside <speak><prosody>...</prosody></speak>
      const content = areaTemplate.ssml.replace(/<speak><prosody[^>]*>|<\/prosody><\/speak>/g, '');
      ssmlContent += content;
    });

    // Wrap everything in single <speak> tag (only add prosody if rate is not 100%)
    const rate = Math.round(PROSODY_CONFIG.rates.standard * 100);
    const ssml = rate === 100
      ? `<speak>${ssmlContent}</speak>`
      : `<speak><prosody rate="${rate}%">${ssmlContent}</prosody></speak>`;

    return {
      ssml,
      reportId: broadcast.broadcastId,
      characterCount: ssml.length,
      createdAt: Date.now(),
      metadata: {
        hasGaleWarnings: broadcast.galeWarnings !== null,
        hasGeneralSynopsis: broadcast.generalSynopsis !== null,
        introductionVariant: broadcast.introduction.variantId,
        galeWarningVariant: broadcast.galeWarnings ? broadcast.galeWarnings.variantId : null,
        timePeriodVariant: broadcast.timePeriod.variantId,
        galeCount: broadcast.galeWarnings ? broadcast.galeWarnings.affectedAreas?.length : 0,
        areaCount: broadcast.areaForecasts.length
      }
    };
  }

  /**
   * Build introduction SSML segment
   *
   * Wraps introduction text with BBC Radio 4 prosody and adds 1500ms break.
   * Implements FR-001 through FR-007.
   *
   * @param {Object} introduction - Introduction segment from broadcast-generator
   * @param {string} introduction.text - Complete introduction text
   *
   * @returns {string} SSML for introduction segment
   * @private
   */
  _buildIntroductionSSML(introduction) {
    const text = this._escape(introduction.text);
    const breakDuration = '1500ms'; // FR-023: 1500ms after introduction

    return `${text}<break time="${breakDuration}"/>`;
  }

  /**
   * Build gale warnings SSML segment
   *
   * Wraps gale warnings text with prosody and adds 1000ms break.
   * Implements FR-008 through FR-015.
   *
   * @param {Object} galeWarnings - Gale warnings segment from broadcast-generator
   * @param {string} galeWarnings.text - Complete gale warnings text
   *
   * @returns {string} SSML for gale warnings segment
   * @private
   */
  _buildGaleWarningsSSML(galeWarnings) {
    const text = this._escape(galeWarnings.text);
    const breakDuration = '1000ms'; // FR-023: 1000ms after gale warnings

    return `${text}<break time="${breakDuration}"/>`;
  }

  /**
   * Build general synopsis SSML segment (NEW EBNF feature)
   *
   * Wraps general synopsis text with prosody and adds 1200ms break.
   * Implements EBNF lines 33-38.
   *
   * @param {Object} generalSynopsis - General synopsis segment from broadcast-generator
   * @param {string} generalSynopsis.text - Complete synopsis text
   *
   * @returns {string} SSML for general synopsis segment
   * @private
   */
  _buildGeneralSynopsisSSML(generalSynopsis) {
    const text = this._escape(generalSynopsis.text);
    const breakDuration = '1200ms'; // Break after general synopsis

    return `${text}<break time="${breakDuration}"/>`;
  }

  /**
   * Build time period SSML segment
   *
   * Wraps time period text with prosody and adds 800ms break.
   * Implements FR-016 through FR-020.
   *
   * @param {Object} timePeriod - Time period segment from broadcast-generator
   * @param {string} timePeriod.text - Complete time period text
   *
   * @returns {string} SSML for time period segment
   * @private
   */
  _buildTimePeriodSSML(timePeriod) {
    const text = this._escape(timePeriod.text);
    const breakDuration = '800ms'; // FR-023: 800ms after time period

    return `${text}<break time="${breakDuration}"/>`;
  }

  /**
   * Build SSML for wind information (UPDATED for EBNF Beaufort scale text)
   *
   * Generates SSML markup for wind direction and force with Beaufort scale text
   * formatting. Forces 8-12 use text ("gale 8", "severe gale 9", etc.), 0-7 use integers.
   *
   * @private
   * @param {Object} wind - Wind data
   * @param {string} wind.direction - Wind direction (e.g., "Southwesterly")
   * @param {number|number[]} wind.force - Beaufort force (single or array for compound)
   * @param {string} wind.forceText - Beaufort scale formatted text (NEW EBNF feature)
   * @param {string|null} wind.behavior - Wind behavior (backing, veering, etc.)
   * @param {string|null} wind.modifier - Wind modifier (increasing, decreasing, etc.)
   * @param {string|null} wind.timing - Timing phrase (later, soon, etc.)
   *
   * @returns {string} SSML markup for wind section
   */
  _buildWindSSML(wind) {
    if (!wind || !wind.direction) {
      return '';
    }

    let windText = this._escape(wind.direction);
    windText += `<break time="${PROSODY_CONFIG.breaks.afterWindDirection}"/>`;

    // Use Beaufort scale formatted text if available (NEW EBNF feature)
    if (wind.forceText) {
      windText += ` ${this._escape(wind.forceText)}`;
      windText += `<break time="${PROSODY_CONFIG.breaks.afterWindForce}"/>`;
    } else if (wind.force !== undefined) {
      // Fallback to raw force handling for backward compatibility
      const forceText = Array.isArray(wind.force)
        ? wind.force.join(' to ')
        : String(wind.force);
      windText += ` ${forceText}`;
      windText += `<break time="${PROSODY_CONFIG.breaks.afterWindForce}"/>`;
    }

    // Handle wind behavior if present
    if (wind.behavior) {
      windText += ` ${this._escape(wind.behavior)}`;
      windText += `<break time="${PROSODY_CONFIG.breaks.afterWindForce}"/>`;
    }

    // Handle wind modifier if present
    if (wind.modifier) {
      windText += ` ${this._escape(wind.modifier)}`;
      windText += `<break time="${PROSODY_CONFIG.breaks.afterWindForce}"/>`;
    }

    // Handle timing phrase if present
    if (wind.timing) {
      windText += ` ${this._escape(wind.timing)}`;
      windText += `<break time="${PROSODY_CONFIG.breaks.afterWindForce}"/>`;
    }

    return windText;
  }

  /**
   * Build SSML for precipitation (NEW EBNF feature, replaces sea state and weather)
   *
   * Generates SSML markup for EBNF-compliant precipitation with modifier and type.
   * Format: [modifier] [type] (e.g., "Thundery showers", "Heavy rain", "Wintry snow")
   *
   * @private
   * @param {Object} precipitation - Precipitation data
   * @param {string} precipitation.modifier - Modifier (Thundery/Wintry/Squally/Occasionally/Heavy/Light)
   * @param {string} precipitation.type - Type (showers/rain/snow)
   * @param {string} precipitation.text - Complete precipitation text
   *
   * @returns {string} SSML markup for precipitation section
   */
  _buildPrecipitationSSML(precipitation) {
    if (!precipitation || !precipitation.text) {
      return '';
    }

    const text = this._escape(precipitation.text);
    const breakDuration = '600ms'; // Break after precipitation

    return `${text}<break time="${breakDuration}"/>`;
  }

  /**
   * Build SSML for icing conditions (NEW EBNF feature)
   *
   * Generates SSML markup for icing warnings with appropriate emphasis.
   * Format: [severity] icing (e.g., "Moderate icing", "Severe icing")
   *
   * @private
   * @param {Object|null} icing - Icing data (null if no icing)
   * @param {string} icing.severity - Severity (Moderate/Severe)
   * @param {string} icing.text - Complete icing text
   *
   * @returns {string} SSML markup for icing section
   */
  _buildIcingSSML(icing) {
    if (!icing || !icing.text) {
      return '';
    }

    // Apply strong emphasis for icing warnings (safety critical)
    const text = this._escape(icing.text);
    const breakDuration = '500ms'; // Break after icing

    return `<emphasis level="strong">${text}</emphasis><break time="${breakDuration}"/>`;
  }

  /**
   * Build SSML for area name with pronunciation hints
   *
   * Wraps the area name with proper emphasis and applies pronunciation
   * corrections using IPA phonemes for commonly mispronounced names.
   *
   * @private
   * @param {string} areaName - Area name to process
   *
   * @returns {string} SSML markup for area name
   */
  _buildAreaSSML(areaName) {
    const emphasisLevel = PROSODY_CONFIG.emphasis.areaName;

    // Check if this area has a pronunciation correction
    const pronunciation = PROSODY_CONFIG.pronunciations && PROSODY_CONFIG.pronunciations[areaName];

    let processedName;

    if (pronunciation && pronunciation.respelling) {
      // Use direct phonetic respelling (most reliable with Neural2 voices)
      // Simply replace the word with its phonetic spelling
      const word = pronunciation.word;
      const respelling = pronunciation.respelling;

      // Replace the word with respelled version, then escape
      const replaced = areaName.replace(word, respelling);
      processedName = this._escape(replaced);
    } else if (pronunciation && pronunciation.ipa) {
      // Use phoneme tag with IPA notation for precise pronunciation
      // Format: <phoneme alphabet="ipa" ph="...">word</phoneme>
      // Google Cloud TTS supports IPA phonemes for accurate pronunciation
      const word = pronunciation.word;
      const ipa = pronunciation.ipa;

      // Replace the word with phoneme-tagged version
      const escapedName = this._escape(areaName);
      processedName = escapedName.replace(
        word,
        `<phoneme alphabet="ipa" ph="${ipa}">${word}</phoneme>`
      );
    } else if (pronunciation && pronunciation.phonetic) {
      // Fallback to sub tag if only phonetic spelling is provided
      const word = pronunciation.word;
      const phonetic = pronunciation.phonetic;

      const escapedName = this._escape(areaName);
      processedName = escapedName.replace(
        word,
        `<sub alias="${phonetic}">${word}</sub>`
      );
    } else {
      // No pronunciation correction needed
      processedName = this._escape(areaName);
    }

    // Wrap with emphasis only if emphasisLevel is not 'none'
    return this._wrapWithEmphasis(processedName, emphasisLevel);
  }

  /**
   * Wrap text with emphasis tag if level is not 'none'
   *
   * Conditionally wraps text in SSML emphasis tags. If emphasisLevel is 'none',
   * returns the text unwrapped. Otherwise, wraps with <emphasis level="...">
   *
   * @private
   * @param {string} text - Text to potentially wrap
   * @param {string} emphasisLevel - Emphasis level ('none', 'reduced', 'moderate', 'strong')
   *
   * @returns {string} Text wrapped in emphasis tag or plain text
   */
  _wrapWithEmphasis(text, emphasisLevel) {
    if (!text) return '';
    if (emphasisLevel === 'none') {
      return text;
    }
    return `<emphasis level="${emphasisLevel}">${text}</emphasis>`;
  }

  /**
   * Escape XML special characters in text
   *
   * Escapes characters that have special meaning in XML/SSML to prevent
   * markup injection and parsing errors.
   *
   * @private
   * @param {string} text - Text to escape
   *
   * @returns {string} Escaped text safe for SSML
   *
   * T024: Implementation for XML character escaping
   */
  _escape(text) {
    if (!text) return '';
    if (typeof text !== 'string') return String(text);

    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Generate unique report identifier
   *
   * Creates a unique identifier for tracking this specific SSML template
   * and its generated audio through the pipeline.
   *
   * @private
   * @param {string} areaName - Area name string
   *
   * @returns {string} Unique report ID (UUID or hash-based)
   *
   * T020: Implementation (included with build)
   */
  _generateReportId(areaName) {
    // Generate a simple unique ID using timestamp and random component
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    const area = areaName ? areaName.substring(0, 3).toLowerCase() : 'unk';

    return `report-${area}-${timestamp}-${random}`;
  }
}
