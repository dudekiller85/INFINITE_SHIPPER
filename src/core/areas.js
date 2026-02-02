/**
 * Sea area definitions for weather report generation
 */

export const STANDARD_AREAS = [
  'Viking',
  'North Utsire',
  'South Utsire',
  'Forties',
  'Cromarty',
  'Forth',
  'Tyne',
  'Dogger',
  'Fisher',
  'German Bight',
  'Humber',
  'Thames',
  'Dover',
  'Wight',
  'Portland',
  'Plymouth',
  'Biscay',
  'Trafalgar',
  'FitzRoy',
  'Sole',
  'Lundy',
  'Fastnet',
  'Irish Sea',
  'Shannon',
  'Rockall',
  'Malin',
  'Hebrides',
  'Bailey',
  'Fair Isle',
  'Faeroes',
  'South-East Iceland',
];

export const PHANTOM_AREAS = [
  'The Void',
  'Silence',
  'Elder Bank',
  'Mirror Reach',
  'The Marrow',
  'Still Water',
  'Obsidian Deep',
];

/**
 * Creates a SeaArea object
 * @param {string} name - Display name of the area
 * @param {'standard'|'phantom'} type - Classification of area
 * @returns {{name: string, type: string, id: string}}
 */
export function createSeaArea(name, type) {
  return {
    name,
    type,
    id: name.toLowerCase().replace(/\s+/g, '-'),
  };
}
