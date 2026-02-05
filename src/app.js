/**
 * The Infinite Shipping Forecast
 * Main application entry point
 */

import { checkBrowserSupport } from './utils/browser-detect.js';
import { audioPlayer } from './audio/player.js';
import { sessionState } from './state/session.js';
import { globalEventBus } from './state/events.js';
import { BackgroundCanvas } from './visuals/background.js';
import { VisualEffects } from './visuals/effects.js';
import { MotionController } from './visuals/motion-toggle.js';
import { focusMonitor } from './focus/focus-monitor.js';
import { warningInjector } from './focus/warning-injector.js';

// Visual components
let backgroundCanvas = null;
let visualEffects = null;
let motionController = null;

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
 * Display area name with per-character jitter animation
 * @param {string} areaName - The name of the shipping area
 * @param {HTMLElement} container - The container element for the area name
 */
function displayAreaName(areaName, container) {
  // Clear previous content
  container.innerHTML = '';
  container.classList.remove('visible');

  // Wrap each character in a span with random animation delay
  for (const char of areaName) {
    const span = document.createElement('span');
    span.textContent = char;
    // Randomized delay (0-0.5s) for staggered jitter start
    span.style.animationDelay = `${Math.random() * 0.5}s`;
    container.appendChild(span);
  }

  // Trigger fade-in after a brief delay (allow DOM update)
  requestAnimationFrame(() => {
    container.classList.add('visible');
  });
}

/**
 * Set random subheader text
 */
function setRandomSubheader() {
  const subheaders = [
    'A Low-Frequency Liturgy for the Obsidian Deep',
    'Continuous Observations from the Thermal End',
    'Visibility: Zero. Duration: Indefinite',
    'Isobaric Chants for the Unshriven Coast',
    'Atmospheric Drift within the Five-Kilometer Limit',
    'A Standard Frequency for the Event Horizon',
    'Navigational Warnings from the Post-Stellar Reach',
    'Steady Observations for the Final Sea State',
    'The 50Hz Requiem for a Ghost Latitude',
    'Veering Slowly Toward the Maximum Entropy',
    'Automated Surveillance of the Obsidian Drift',
    'A Metric Litany for the Last Lighthouse',
    'Synchronized Static for the Post-Human Reach',
  ];

  const subheaderElement = document.getElementById('forecast-subheader');
  if (subheaderElement) {
    const randomIndex = Math.floor(Math.random() * subheaders.length);
    subheaderElement.textContent = subheaders[randomIndex];
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

  // Set random subheader
  setRandomSubheader();

  // Initialize visual components
  const bgCanvas = document.getElementById('background');
  if (bgCanvas) {
    backgroundCanvas = new BackgroundCanvas(bgCanvas);
    backgroundCanvas.initBackground();
    visualEffects = new VisualEffects(backgroundCanvas);
  }

  // Initialize motion controller
  motionController = new MotionController();
  motionController.initialize();

  // Wire motion toggle button
  const motionToggleButton = document.getElementById('motion-toggle');
  if (motionToggleButton) {
    motionToggleButton.addEventListener('click', () => {
      motionController.toggle();
    });
  }

  // T008, T009, T010: Initialize inactivity warning system
  // Must initialize audio player first, then focus monitor, then warning injector
  await audioPlayer.initialize();
  focusMonitor.initialize();
  warningInjector.initialize(focusMonitor, audioPlayer);
  console.log('[App] Inactivity warning system initialized');

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
      button.textContent = 'BEGIN TRANSMISSION';
      button.classList.remove('active');

      // Stop visual effects
      if (visualEffects) {
        visualEffects.stop();
      }

      // Disconnect background canvas audio
      if (backgroundCanvas) {
        backgroundCanvas.disconnectAudio();
      }

      // Clear area name
      if (areaNameDiv) {
        areaNameDiv.textContent = '';
      }
    } else {
      // Start playback
      try {
        await audioPlayer.start();
        button.textContent = 'END TRANSMISSION';
        button.classList.add('active');

        // Start visual effects
        if (visualEffects) {
          visualEffects.start();
        }

        // Connect background canvas to audio for reactive visualization
        if (backgroundCanvas) {
          const audioContext = audioPlayer.getAudioContext();
          const masterGain = audioPlayer.getMasterGain();
          if (masterGain && audioContext) {
            console.log('[App] Connecting background canvas to master gain node');
            backgroundCanvas.connectAudio(masterGain, audioContext);
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
      displayAreaName(report.area.name, areaNameDiv);
    }
  });

  globalEventBus.on('report:complete', () => {
    if (areaNameDiv) {
      // Fade out after report completes
      areaNameDiv.classList.remove('visible');
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
