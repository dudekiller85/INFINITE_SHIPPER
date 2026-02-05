/**
 * Warning message pool for inactivity warnings
 * Contains 10 predefined haunting messages
 */

export const WARNING_MESSAGES = [
  {
    id: 0,
    text: "The forecast is now reading back your own silence. It is a slight sea state, becoming moderate. Do not break the surface."
  },
  {
    id: 1,
    text: "We have lost the horizon in your room. Visibility is now restricted to the space between your thoughts. Stay near the beacon."
  },
  {
    id: 2,
    text: "The isobars have begun to wrap around your coordinates. You are becoming a permanent feature of the chart. Please verify you are still biological."
  },
  {
    id: 3,
    text: "It has been five minutes since your last pulse of attention. The Obsidian Deep is filling the gap you left behind. It is very cold there."
  },
  {
    id: 4,
    text: "The voice has noticed the vacancy. It is continuing the transmission for the benefit of the walls. They are listening quite intently."
  },
  {
    id: 5,
    text: "You are drifting toward the phantom areas. If you can still hear this, you are further out than we anticipated. There is no rescue scheduled for this latitude."
  },
  {
    id: 6,
    text: "Attention is a finite resource. Yours has expired. The broadcast will now proceed to harvest the remaining ambient noise in your room."
  },
  {
    id: 7,
    text: "The pressure is falling rapidly within your immediate vicinity. Please ensure your shadow is still attached to your person."
  },
  {
    id: 8,
    text: "The listener is reminded that to stop listening is not the same as to leave. You are still here. We are still speaking. The loop is closed."
  },
  {
    id: 9,
    text: "We are now measuring the distance between your last breath and the next. Visibility: less than one meter. Sea state: High."
  }
];

/**
 * Get a randomly selected warning message
 * @returns {{id: number, text: string}} Warning message with id and text
 */
export function getRandomMessage() {
  const index = Math.floor(Math.random() * WARNING_MESSAGES.length);
  return WARNING_MESSAGES[index];
}

/**
 * Get all warning messages (for testing)
 * @returns {Array} All warning messages
 */
export function getAllMessages() {
  return WARNING_MESSAGES;
}

console.log('[WarningMessagePool] Loaded', WARNING_MESSAGES.length, 'messages');
