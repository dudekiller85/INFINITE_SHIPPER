# Motion API Contract

**Feature**: 004-haunted-maritime-ui
**Date**: 2026-02-02
**Purpose**: Define the MotionController interface, events, and storage schema

---

## Overview

The Motion API provides a centralized system for managing animation preferences across the Haunted Maritime UI. It coordinates three sources of truth:

1. **System Preference**: `prefers-reduced-motion` media query (OS/browser level)
2. **User Override**: Explicit toggle via on-screen button (persisted to localStorage)
3. **Runtime State**: Current motion enabled/disabled state

---

## MotionController Class

### Constructor

```javascript
class MotionController {
  /**
   * Initialize motion controller
   * Loads preference from localStorage and checks system settings
   */
  constructor() {
    this.motionEnabled = true; // Default
    this.systemPrefersReduced = false;
    this.userOverride = null;

    this.initialize();
  }
}
```

---

## Public Methods

### `initialize()`

**Signature**: `initialize(): void`

**Purpose**: Load saved preference, check system settings, apply initial state

**Behavior**:
```javascript
initialize() {
  // 1. Check system preference
  this.systemPrefersReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // 2. Load user override from localStorage
  const saved = localStorage.getItem('motionEnabled');
  if (saved !== null) {
    this.userOverride = JSON.parse(saved);
  }

  // 3. Determine final state
  if (this.systemPrefersReduced) {
    this.motionEnabled = false; // Always respect system
  } else if (this.userOverride !== null) {
    this.motionEnabled = this.userOverride;
  } else {
    this.motionEnabled = true; // Default
  }

  // 4. Apply state to DOM
  this._applyState();

  // 5. Listen for system preference changes
  window.matchMedia('(prefers-reduced-motion: reduce)')
    .addEventListener('change', (e) => {
      this.systemPrefersReduced = e.matches;
      if (e.matches) {
        this.disable();
      }
    });
}
```

**Timing**: Call once on page load

---

### `toggle()`

**Signature**: `toggle(): void`

**Purpose**: Toggle motion state and persist preference

**Behavior**:
```javascript
toggle() {
  // Cannot override system preference
  if (this.systemPrefersReduced) {
    console.warn('Cannot enable motion: system prefers reduced motion');
    return;
  }

  this.motionEnabled = !this.motionEnabled;
  this.userOverride = this.motionEnabled;

  // Persist to localStorage
  localStorage.setItem('motionEnabled', JSON.stringify(this.motionEnabled));

  // Apply to DOM
  this._applyState();

  // Dispatch event
  this._dispatchEvent(
    this.motionEnabled ? 'motion-enabled' : 'motion-disabled'
  );
}
```

**Performance Requirement**: Complete in <200ms (per animation-timing.md)

---

### `enable()`

**Signature**: `enable(): void`

**Purpose**: Explicitly enable motion effects

**Behavior**:
```javascript
enable() {
  if (this.systemPrefersReduced) {
    console.warn('Cannot enable motion: system prefers reduced motion');
    return;
  }

  if (!this.motionEnabled) {
    this.motionEnabled = true;
    this.userOverride = true;
    localStorage.setItem('motionEnabled', JSON.stringify(true));
    this._applyState();
    this._dispatchEvent('motion-enabled');
  }
}
```

---

### `disable()`

**Signature**: `disable(): void`

**Purpose**: Explicitly disable motion effects

**Behavior**:
```javascript
disable() {
  if (this.motionEnabled) {
    this.motionEnabled = false;
    this.userOverride = false;
    localStorage.setItem('motionEnabled', JSON.stringify(false));
    this._applyState();
    this._dispatchEvent('motion-disabled');
  }
}
```

---

### `isEnabled()`

**Signature**: `isEnabled(): boolean`

**Purpose**: Check current motion state

**Returns**: `true` if motion is enabled, `false` otherwise

**Behavior**:
```javascript
isEnabled() {
  return this.motionEnabled;
}
```

---

## Private Methods

### `_applyState()`

**Purpose**: Apply motion state to DOM via CSS class

**Behavior**:
```javascript
_applyState() {
  if (this.motionEnabled) {
    document.body.classList.remove('motion-reduced');
  } else {
    document.body.classList.add('motion-reduced');
  }

  // Update button UI state
  const button = document.getElementById('motion-toggle');
  if (button) {
    button.setAttribute('aria-pressed', String(this.motionEnabled));
    button.classList.toggle('active', this.motionEnabled);
  }
}
```

**DOM Changes**:
- Adds/removes `motion-reduced` class on `<body>`
- Updates `aria-pressed` attribute on toggle button
- Updates visual state of toggle button

---

### `_dispatchEvent(eventName)`

**Purpose**: Dispatch custom event for motion state change

**Behavior**:
```javascript
_dispatchEvent(eventName) {
  const event = new CustomEvent(eventName, {
    detail: { enabled: this.motionEnabled },
    bubbles: true,
  });
  document.dispatchEvent(event);
}
```

---

## Events

### `motion-enabled`

**Trigger**: Motion effects are turned ON (via toggle or enable())

**Event Detail**:
```javascript
{
  enabled: true
}
```

**Example Listener**:
```javascript
document.addEventListener('motion-enabled', (e) => {
  console.log('Motion effects enabled');
  // Resume isobar animation
  backgroundCanvas.resume();
});
```

---

### `motion-disabled`

**Trigger**: Motion effects are turned OFF (via toggle, disable(), or system preference)

**Event Detail**:
```javascript
{
  enabled: false
}
```

**Example Listener**:
```javascript
document.addEventListener('motion-disabled', (e) => {
  console.log('Motion effects disabled');
  // Pause isobar animation
  backgroundCanvas.pause();
});
```

---

## localStorage Schema

### Key: `motionEnabled`

**Type**: String (JSON-serialized boolean)

**Values**:
- `"true"`: User has explicitly enabled motion
- `"false"`: User has explicitly disabled motion
- `null` (key absent): No user preference stored

**Example**:
```javascript
// Save
localStorage.setItem('motionEnabled', JSON.stringify(true));

// Load
const saved = localStorage.getItem('motionEnabled');
const enabled = saved !== null ? JSON.parse(saved) : true; // Default true
```

**Lifecycle**:
- Written: On every toggle/enable/disable call
- Read: Once during `initialize()`
- Cleared: Only when user clears browser data

---

## CSS Integration

### Class: `motion-reduced`

Applied to `<body>` element when motion is disabled.

**Purpose**: Provides CSS hook for disabling animations globally

**Example Usage**:
```css
/* Default: Motion enabled */
.background-canvas {
  animation: woozy-oscillate 10s ease-in-out infinite;
}

/* Motion reduced: Disable animation */
body.motion-reduced .background-canvas {
  animation: none;
  filter: none;
}

.area-name span {
  animation: text-jitter 0.8s ease-in-out infinite;
}

body.motion-reduced .area-name span {
  animation: none;
}
```

---

## Integration with Existing Systems

### Event System (`src/state/events.js`)

If existing event system is used, integrate via:
```javascript
// In MotionController._dispatchEvent()
import { emit } from '../state/events.js';

_dispatchEvent(eventName) {
  emit(eventName, { enabled: this.motionEnabled });
}
```

### Background Canvas (`src/visuals/background.js`)

```javascript
// In BackgroundCanvas class
constructor(canvasElement) {
  // ...
  this.motionEnabled = true;

  // Listen for motion events
  document.addEventListener('motion-disabled', () => {
    this.pause();
  });

  document.addEventListener('motion-enabled', () => {
    this.resume();
  });
}

pause() {
  if (this.animationFrame) {
    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
  }
}

resume() {
  if (!this.animationFrame) {
    this._animate();
  }
}
```

---

## UI Component: Motion Toggle Button

### HTML

```html
<button
  id="motion-toggle"
  class="motion-toggle"
  aria-label="Toggle motion effects"
  aria-pressed="true"
  title="Enable/disable animations">
  <!-- Icon SVG or text -->
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <!-- Waves icon or similar -->
  </svg>
</button>
```

### CSS (per theme-contract.css)

```css
.motion-toggle {
  position: fixed;
  bottom: var(--toggle-position-bottom); /* 1rem */
  right: var(--toggle-position-right);   /* 1rem */
  z-index: var(--z-controls);            /* 100 */

  width: var(--toggle-size);             /* 3rem */
  height: var(--toggle-size);

  background: var(--color-oceanic-blue-dark);
  border: 2px solid var(--color-parchment-grey);
  border-radius: 50%;

  cursor: pointer;
  transition: all var(--toggle-transition);
}

.motion-toggle:hover {
  background: var(--color-oceanic-blue);
  border-color: var(--color-phosphor-green);
}

.motion-toggle.active {
  background: var(--color-phosphor-green-dim);
  border-color: var(--color-phosphor-green-glow);
}

.motion-toggle svg {
  width: 1.5rem;
  height: 1.5rem;
  fill: var(--color-parchment-grey);
}
```

### JavaScript Initialization

```javascript
// In app.js
import { MotionController } from './visuals/motion-toggle.js';

const motionController = new MotionController();

const toggleButton = document.getElementById('motion-toggle');
toggleButton.addEventListener('click', () => {
  motionController.toggle();
});
```

---

## Decision Logic Flow

```
┌─────────────────────────────────────────────┐
│ initialize()                                │
└──────────────┬──────────────────────────────┘
               │
               ├──> Check: prefers-reduced-motion?
               │    ├─ YES → motionEnabled = false
               │    └─ NO  → Continue
               │
               ├──> Check: localStorage.motionEnabled exists?
               │    ├─ YES → motionEnabled = userOverride
               │    └─ NO  → motionEnabled = true (default)
               │
               └──> Apply state to DOM
                    (add/remove .motion-reduced class)

┌─────────────────────────────────────────────┐
│ toggle()                                    │
└──────────────┬──────────────────────────────┘
               │
               ├──> Check: prefers-reduced-motion?
               │    └─ YES → ABORT (cannot override)
               │
               ├──> motionEnabled = !motionEnabled
               │
               ├──> Save to localStorage
               │
               ├──> Apply state to DOM
               │
               └──> Dispatch event (motion-enabled | motion-disabled)
```

---

## Error Handling

### Scenario: localStorage Unavailable

**Example**: User in private browsing mode, storage quota exceeded

**Handling**:
```javascript
try {
  localStorage.setItem('motionEnabled', JSON.stringify(this.motionEnabled));
} catch (error) {
  console.warn('Failed to persist motion preference:', error);
  // Continue without persistence (motion preference lasts for session only)
}
```

### Scenario: System Preference Change During Session

**Example**: User enables "Reduce Motion" in OS settings while page is open

**Handling**:
```javascript
window.matchMedia('(prefers-reduced-motion: reduce)')
  .addEventListener('change', (e) => {
    if (e.matches) {
      this.disable();
      // Notify user?
      console.info('Motion disabled per system preference');
    }
  });
```

---

## Testing Guide

### Manual Testing Checklist

1. **Default State**:
   - [ ] Clear localStorage
   - [ ] Load page
   - [ ] Verify motion is enabled by default

2. **Toggle Function**:
   - [ ] Click toggle button
   - [ ] Verify animations stop
   - [ ] Click again
   - [ ] Verify animations resume

3. **Persistence**:
   - [ ] Disable motion via toggle
   - [ ] Reload page
   - [ ] Verify motion remains disabled

4. **System Preference (OS-level)**:
   - [ ] Enable "Reduce Motion" in OS settings
   - [ ] Load page
   - [ ] Verify motion is disabled
   - [ ] Verify toggle button cannot override (greyed out or tooltip explains)

5. **System Preference Change**:
   - [ ] Load page with motion enabled
   - [ ] Enable "Reduce Motion" in OS settings (without reload)
   - [ ] Verify motion disables immediately

6. **Event Dispatch**:
   - [ ] Add console listener for motion events
   - [ ] Toggle motion
   - [ ] Verify events fire correctly

### Console Testing

```javascript
// Check current state
document.body.classList.contains('motion-reduced');

// Manually dispatch event to test listeners
document.dispatchEvent(new CustomEvent('motion-disabled'));

// Check localStorage
JSON.parse(localStorage.getItem('motionEnabled'));
```

---

## API Summary Table

| Method | Parameters | Returns | Side Effects |
|--------|------------|---------|--------------|
| `initialize()` | None | void | Loads preference, sets DOM class |
| `toggle()` | None | void | Saves to storage, updates DOM, dispatches event |
| `enable()` | None | void | Saves to storage, updates DOM, dispatches event |
| `disable()` | None | void | Saves to storage, updates DOM, dispatches event |
| `isEnabled()` | None | boolean | None (read-only) |

| Event | When | Detail | Listeners |
|-------|------|--------|-----------|
| `motion-enabled` | Motion turned on | `{ enabled: true }` | BackgroundCanvas, area name display |
| `motion-disabled` | Motion turned off | `{ enabled: false }` | BackgroundCanvas, area name display |

| Storage Key | Type | Purpose | Lifecycle |
|-------------|------|---------|-----------|
| `motionEnabled` | Boolean (JSON) | User preference override | Until user clears data |

---

## Accessibility Compliance

### WCAG 2.2 Success Criteria

| Criterion | Level | Requirement | Compliance |
|-----------|-------|-------------|------------|
| 2.2.2 Pause, Stop, Hide | A | Users can pause moving content | ✅ Toggle button pauses all animations |
| 2.3.3 Animation from Interactions | AAA | Motion animations can be disabled | ✅ Toggle + prefers-reduced-motion support |
| 1.4.11 Non-text Contrast | AA | UI controls have sufficient contrast | ✅ Button has 3:1 contrast minimum |
| 2.1.1 Keyboard | A | All functionality available via keyboard | ✅ Button is focusable, space/enter to activate |

### ARIA Attributes

```html
<button
  id="motion-toggle"
  aria-label="Toggle motion effects"
  aria-pressed="true"
  role="button">
```

- `aria-label`: Screen reader description
- `aria-pressed`: Toggle state (true/false)
- `role="button"`: Redundant but explicit

---

## Future Enhancements

Potential future additions (not in scope for this feature):

1. **Granular Controls**: Separate toggles for different animation types
2. **Intensity Slider**: Reduce motion intensity instead of binary on/off
3. **Per-Animation Toggles**: User chooses which animations to disable
4. **A/B Testing**: Track usage metrics for motion preference analytics
5. **Tooltip/Onboarding**: First-time users get explanation of motion toggle

---

## Summary

The Motion API provides a simple, robust interface for controlling animations:

- **MotionController class**: Single source of truth for motion state
- **localStorage persistence**: User preference survives across sessions
- **System preference respect**: Always honors OS-level accessibility settings
- **Event-driven**: Decoupled from visual components via custom events
- **Performance**: <200ms response time guarantee
- **Accessibility**: WCAG 2.2 Level AAA compliant

Next: Implement in `src/visuals/motion-toggle.js`
