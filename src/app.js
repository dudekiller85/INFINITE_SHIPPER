/**
 * The Infinite Shipping Forecast
 * Main application entry point
 */

import { checkBrowserSupport } from './utils/browser-detect.js';
import { audioPlayer } from './audio/player.js';
import { sessionState } from './state/session.js';
import { globalEventBus } from './state/events.js';
import { BackgroundCanvas } from './visuals/background.js';
import { Oscilloscope } from './visuals/oscilloscope.js';
import { VisualEffects } from './visuals/effects.js';

// Visual components
let backgroundCanvas = null;
let oscilloscope = null;
let visualEffects = null;

/**
 * Display error message to user
 */
function showError(message) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

/**
 * Hide error message
 */
function hideError() {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.style.display = 'none';
  }
}

/**
 * Initialize the application
 */
async function initialize() {
  // Check browser support
  const support = checkBrowserSupport();

  if (!support.allSupported) {
    const missingAPIs = support.missingAPIs.join(', ');
    showError(
      `Your browser does not support required features: ${missingAPIs}. Please use a modern browser (Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+).`
    );
    return false;
  }

  // Initialize visual components
  const bgCanvas = document.getElementById('background');
  if (bgCanvas) {
    backgroundCanvas = new BackgroundCanvas(bgCanvas);
    backgroundCanvas.initBackground();
    visualEffects = new VisualEffects(backgroundCanvas);
  }

  hideError();
  return true;
}

/**
 * Set up UI event handlers
 */
function setupUI() {
  const button = document.getElementById('begin-transmission');
  const areaNameDiv = document.getElementById('area-name');

  if (!button) {
    console.error('Begin Transmission button not found');
    return;
  }

  // Button click handler - toggle playback
  button.addEventListener('click', async () => {
    if (sessionState.isPlaying) {
      // Stop playback
      await audioPlayer.stop();
      button.textContent = 'Begin Transmission';
      button.classList.remove('active');

      // Stop visual effects
      if (visualEffects) {
        visualEffects.stop();
      }

      // Stop oscilloscope
      if (oscilloscope) {
        oscilloscope.stop();
      }
      
      // Clear area name
      if (areaNameDiv) {
        areaNameDiv.textContent = '';
      }
    } else {
      // Start playback
      try {
        await audioPlayer.start();
        button.textContent = 'End Transmission';
        button.classList.add('active');

        // Start visual effects
        if (visualEffects) {
          visualEffects.start();
        }

        // Start oscilloscope
        const oscCanvas = document.getElementById('oscilloscope');
        if (oscCanvas && !oscilloscope) {
          const audioContext = audioPlayer.getAudioContext();
          oscilloscope = new Oscilloscope(oscCanvas, audioContext);
          
          // Connect to audio output for visualization
          const radioFilter = audioPlayer.getRadioFilter();
          if (radioFilter) {
            oscilloscope.start(radioFilter.outputGain);
          }
        } else if (oscilloscope) {
          const radioFilter = audioPlayer.getRadioFilter();
          if (radioFilter) {
            oscilloscope.start(radioFilter.outputGain);
          }
        }
      } catch (error) {
        console.error('Failed to start playback:', error);
        showError('Failed to start audio playback. Please try again.');
      }
    }
  });

  // Listen for report events to update area name display
  globalEventBus.on('report:playing', (report) => {
    if (areaNameDiv && report && report.area) {
      areaNameDiv.textContent = report.area.name;
      areaNameDiv.style.opacity = '1';
    }
  });

  globalEventBus.on('report:complete', () => {
    if (areaNameDiv) {
      // Fade out after report completes
      areaNameDiv.style.opacity = '0.6';
    }
  });
}

/**
 * Main application startup
 */
async function main() {
  console.log('The Infinite Shipping Forecast - Starting...');

  const supported = await initialize();

  if (supported) {
    setupUI();
    console.log('Application ready. Click "Begin Transmission" to start.');
  } else {
    console.error('Browser not supported. Application cannot start.');
  }
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
