/**
 * Browser API feature detection utilities
 */

/**
 * Check browser support for required APIs
 * @returns {{
 *   speechSynthesis: boolean,
 *   audioContext: boolean,
 *   canvasAPI: boolean,
 *   pageVisibilityAPI: boolean,
 *   allSupported: boolean,
 *   missingAPIs: string[]
 * }}
 */
export function checkBrowserSupport() {
  const missing = [];

  const speechSynthesis = 'speechSynthesis' in window;
  if (!speechSynthesis) {
    missing.push('Web Speech API (Speech Synthesis)');
  }

  const audioContext = 'AudioContext' in window || 'webkitAudioContext' in window;
  if (!audioContext) {
    missing.push('Web Audio API');
  }

  const canvasAPI = (() => {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext && canvas.getContext('2d'));
    } catch (e) {
      return false;
    }
  })();
  if (!canvasAPI) {
    missing.push('Canvas API');
  }

  const pageVisibilityAPI = 'hidden' in document || 'visibilityState' in document;
  if (!pageVisibilityAPI) {
    missing.push('Page Visibility API');
  }

  return {
    speechSynthesis,
    audioContext,
    canvasAPI,
    pageVisibilityAPI,
    allSupported: missing.length === 0,
    missingAPIs: missing,
  };
}
