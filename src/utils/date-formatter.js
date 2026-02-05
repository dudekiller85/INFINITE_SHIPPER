/**
 * BBC Radio 4 Date and Time Formatting Utilities
 *
 * Converts timestamps and dates to BBC spoken format for shipping forecast introductions.
 * Based on research from specs/003-broadcast-structure/research.md RQ-001.
 *
 * @see /specs/003-broadcast-structure/spec.md FR-003, FR-004
 */

/**
 * Format time in BBC Radio 4 spoken format
 *
 * Converts a Date object to BBC spoken time format using "zero" for digit 0.
 * Examples:
 * - 05:30 → "zero five thirty"
 * - 14:00 → "fourteen hundred"
 * - 21:45 → "twenty-one forty-five"
 * - 00:00 → "zero zero hundred"
 *
 * @param {Date} date - Date object to format
 * @returns {string} BBC formatted time string
 */
export function formatBBCTime(date) {
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();

  // Format hours
  let hourWord;
  if (hours === 0) {
    hourWord = 'zero zero';
  } else if (hours < 10) {
    hourWord = `zero ${numberToWord(hours)}`;
  } else {
    hourWord = numberToWord(hours);
  }

  // Format minutes
  let minuteWord;
  if (minutes === 0) {
    minuteWord = 'hundred';
  } else if (minutes < 10) {
    minuteWord = `zero ${numberToWord(minutes)}`;
  } else {
    minuteWord = numberToWord(minutes);
  }

  return `${hourWord} ${minuteWord}`;
}

/**
 * Convert number (0-59) to spoken word
 * Handles hours (0-23) and minutes (0-59)
 *
 * @param {number} num - Number to convert
 * @returns {string} Spoken word representation
 * @private
 */
function numberToWord(num) {
  // Basic numbers 0-19
  const ones = [
    'zero',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen'
  ];

  // Tens 20-50
  const tens = [
    '',
    '',
    'twenty',
    'thirty',
    'forty',
    'fifty',
    'sixty' // Only needed for minutes
  ];

  if (num < 20) {
    return ones[num];
  }

  const tensDigit = Math.floor(num / 10);
  const onesDigit = num % 10;

  if (onesDigit === 0) {
    return tens[tensDigit];
  }

  return `${tens[tensDigit]}-${ones[onesDigit]}`;
}

/**
 * Format date in BBC Radio 4 spoken format
 *
 * Converts a Date object to BBC spoken date format with day of week and ordinal date.
 * Format: "[time] on [day] the [ordinal] of [month]" when used with time
 * Format standalone: "on [day] the [ordinal] of [month]"
 * Example: "zero five thirty on Tuesday the second of February"
 *
 * @param {Date} date - Date object to format
 * @param {boolean} [includeOn=false] - Whether to include "on" prefix
 * @returns {string} BBC formatted date string
 */
export function formatBBCDate(date, includeOn = false) {
  const dayOfWeek = getDayOfWeek(date.getUTCDay());
  const dayOfMonth = date.getUTCDate();
  const month = getMonth(date.getUTCMonth());

  const ordinal = getOrdinalDay(dayOfMonth);

  if (includeOn) {
    return `on ${dayOfWeek} the ${ordinal} of ${month}`;
  }
  return `${dayOfWeek} the ${ordinal} of ${month}`;
}

/**
 * Get day of week name
 *
 * @param {number} day - Day index (0-6, where 0 is Sunday)
 * @returns {string} Day name
 * @private
 */
function getDayOfWeek(day) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day];
}

/**
 * Get month name
 *
 * @param {number} month - Month index (0-11, where 0 is January)
 * @returns {string} Month name
 * @private
 */
function getMonth(month) {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  return months[month];
}

/**
 * Get day of month with ordinal suffix as spoken word
 *
 * Converts day number to ordinal word form.
 * Examples:
 * - 1 → "first"
 * - 2 → "second"
 * - 21 → "twenty-first"
 * - 31 → "thirty-first"
 *
 * @param {number} day - Day of month (1-31)
 * @returns {string} Ordinal day as spoken word
 */
export function getOrdinalDay(day) {
  // Special cases for 1-19
  const special = [
    '',
    'first',
    'second',
    'third',
    'fourth',
    'fifth',
    'sixth',
    'seventh',
    'eighth',
    'ninth',
    'tenth',
    'eleventh',
    'twelfth',
    'thirteenth',
    'fourteenth',
    'fifteenth',
    'sixteenth',
    'seventeenth',
    'eighteenth',
    'nineteenth'
  ];

  if (day < 20) {
    return special[day];
  }

  // For 20-31, combine tens with ordinal suffix
  const tens = {
    20: 'twenty',
    30: 'thirty'
  };

  const ordinalSuffixes = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth'];

  const tensDigit = Math.floor(day / 10) * 10;
  const onesDigit = day % 10;

  if (onesDigit === 0) {
    // 20 → "twentieth", 30 → "thirtieth"
    return tens[tensDigit] + 'th';
  }

  // 21 → "twenty-first", 22 → "twenty-second", etc.
  return `${tens[tensDigit]}-${ordinalSuffixes[onesDigit]}`;
}

/**
 * Get numeric ordinal suffix (st/nd/rd/th) for display purposes
 *
 * Returns the suffix for numeric date display (not used in spoken format).
 * Examples:
 * - 1 → "st"
 * - 2 → "nd"
 * - 21 → "st"
 * - 31 → "st"
 *
 * @param {number} day - Day of month (1-31)
 * @returns {string} Ordinal suffix
 */
export function getOrdinalSuffix(day) {
  if (day >= 11 && day <= 13) {
    return 'th';
  }

  const lastDigit = day % 10;

  switch (lastDigit) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

/**
 * Format pressure value as individual digits for BBC Radio 4 spoken format
 *
 * Converts pressure values to digit-by-digit spoken format.
 * "0" is pronounced as "oh" in middle positions, "zero" at start.
 * Examples:
 * - 904 → "nine-oh-four"
 * - 1012 → "one-oh-one-two"
 * - 998 → "nine-nine-eight"
 * - 1000 → "one-oh-oh-oh"
 *
 * @param {number} pressure - Pressure value in millibars (900-1099)
 * @returns {string} Digit-by-digit spoken format
 */
export function formatPressureDigits(pressure) {
  const digits = pressure.toString().split('');
  const digitWords = {
    '0': 'oh',
    '1': 'one',
    '2': 'two',
    '3': 'three',
    '4': 'four',
    '5': 'five',
    '6': 'six',
    '7': 'seven',
    '8': 'eight',
    '9': 'nine'
  };

  // Convert each digit to word, but use "oh" for 0 except at the start
  const words = digits.map((digit, index) => {
    if (digit === '0' && index === 0) {
      return 'zero';
    }
    return digitWords[digit];
  });

  return words.join('-');
}
