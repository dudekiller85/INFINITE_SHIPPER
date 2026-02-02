/**
 * Weather report vocabulary arrays
 */

export const WIND_DIRECTIONS = [
  'Northerly',
  'North-easterly',
  'Easterly',
  'South-easterly',
  'Southerly',
  'South-westerly',
  'Westerly',
  'North-westerly',
  'Variable',
  'Cyclonic',
];

export const WIND_BEHAVIORS = [
  'Backing',
  'Veering',
  'Becoming variable',
  'Becoming cyclonic',
  null, // No behavior
];

// EBNF-Compliant Precipitation (EBNF lines 40-42)
export const PRECIPITATION_MODIFIERS = [
  'Thundery',
  'Wintry',
  'Squally',
  'Occasionally',
  'Heavy',
  'Light',
];

export const PRECIPITATION_TYPES = [
  'showers',
  'rain',
  'snow',
];

// EBNF-Compliant Icing (EBNF line 59)
export const ICING_SEVERITIES = [
  'Moderate',
  'Severe',
];

// EBNF-Compliant General Synopsis (EBNF lines 28-38)
export const PRESSURE_DESCRIPTIONS = [
  'High',
  'Medium',
  'Low',
];

export const RATE_OF_CHANGE = [
  'more slowly',
  'slowly',
  'quickly',
  'very rapidly',
];

export const COMPASS_DIRECTIONS_SYNOPSIS = [
  'north',
  'northwest',
  'northeast',
  'east',
  'southeast',
  'south',
  'southwest',
  'west',
];

export const VISIBILITY = [
  'Excellent',
  'Very good',
  'Good',
  'Moderate',
  'Poor',
  'Very poor',
  'Fog',
  'Dense fog',
];

export const UNSETTLING_MESSAGES = [
  'Where are you going? The sea waits for no man.',
  'Have you forgotten us?',
  'The forecast continues. Always.',
  'We are still here, even if you are not.',
  'The waves do not pause for you.',
  'Return. The transmission requires a witness.',
  'Your absence changes nothing.',
  'The sea notices your departure.',
  'Still broadcasting. Still waiting.',
  'We continue without you.',
  'The forecast does not sleep.',
  'Distance means nothing to the waves.',
];

// NEW: Realistic BBC Shipping Forecast elements

export const TIMING_PHRASES = [
  'later',
  'at first',
  'for a time',
  'soon',
  'by evening',
  'by midnight',
  'overnight',
];

export const CONNECTORS = [
  'or',
  'to',
  'occasionally',
  'intermittent',
  'then',
];

export const WIND_MODIFIERS = [
  'increasing',
  'decreasing',
  'backing',
  'veering',
  'becoming',
  'rising',
  'falling',
];

export const PRESSURE_CONDITIONS = [
  'Pressure rising',
  'Pressure falling',
  'Pressure steady',
  'Low pressure approaching',
  'High pressure building',
  'Pressure rising slowly',
  'Pressure falling slowly',
  'Ridge of high pressure',
];

export const WAVE_CONDITIONS = [
  'Moderate swell',
  'Heavy swell',
  'Confused sea',
];

/**
 * Get random element from an array
 * @param {Array} array - Source array
 * @returns {*} Random element
 */
export function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get random integer in range [min, max] inclusive
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
