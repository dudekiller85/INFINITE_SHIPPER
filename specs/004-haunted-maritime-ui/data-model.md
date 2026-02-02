# Data Model: Haunted Maritime UI

**Feature**: 004-haunted-maritime-ui
**Date**: 2026-02-02
**Purpose**: Define visual entities, their attributes, relationships, and state transitions

---

## Entity Overview

This UI feature involves five primary visual/behavioral entities:

1. **Visual Theme** - Global color palette and typography system
2. **Isobar Layer** - Animated background canvas with contour lines
3. **Central Display Box** - Semi-transparent container for header and button
4. **Area Name Display** - Dynamic text element showing current shipping area
5. **Motion Controller** - Accessibility control managing animation state

---

## Entity: Visual Theme

### Purpose
Manages the global color palette, typography, and animation timing parameters for the haunted maritime aesthetic.

### Attributes

| Attribute | Type | Description | Constraints |
|-----------|------|-------------|-------------|
| `colorPhosphorGreen` | String (HSL) | Primary green color (CRT phosphor aesthetic) | `hsl(140, 70%, 45%)` |
| `colorOceanicBlue` | String (HSL) | Secondary blue color (maritime) | `hsl(200, 60%, 35%)` |
| `colorParchmentGrey` | String (HSL) | Neutral grey color (aged paper) | `hsl(45, 15%, 70%)` |
| `fontSerif` | String | High-authority serif font stack | `'Times New Roman', 'EB Garamond', Georgia, serif` |
| `oscillationPeriod` | Number (seconds) | Duration of one complete hue/blur cycle | 8-12 seconds (default: 10s) |
| `fadeDuration` | Number (seconds) | Duration for area name fade in/out | 1-3 seconds (default: 2s) |

### Variations

Each base color has dark/light/glow variants for different UI contexts:
- Phosphor Green: dim (30% lightness), base (45%), glow (60%)
- Oceanic Blue: dark (20%), base (35%), light (50%)
- Parchment Grey: dark (40%), base (70%), light (85%)

### Implementation

Stored as CSS custom properties in `:root`:
```css
:root {
  --color-phosphor-green: hsl(140, 70%, 45%);
  --font-serif: 'Times New Roman', Georgia, serif;
  --oscillation-period: 10s;
  --fade-duration: 2s;
}
```

---

## Entity: Isobar Layer

### Purpose
Animated full-viewport canvas background displaying meteorological-style contour lines with drift, pulse, and glitch effects.

### Attributes

| Attribute | Type | Description | Constraints |
|-----------|------|-------------|-------------|
| `lineCount` | Number | Number of horizontal isobar lines | 15-25 (default: 20) |
| `lineSpacing` | Number (px) | Vertical distance between lines | `canvas.height / lineCount` |
| `lineColor` | String | Stroke color for isobar lines | Phosphor green with low opacity |
| `lineWidth` | Number (px) | Stroke width for isobar lines | 1-2px |
| `driftSpeed` | Number | Speed of horizontal wave drift | 0.3 (units per frame) |
| `pulseSpeed` | Number | Speed of vertical pulse | 0.2 (units per frame) |
| `glitchProbability` | Number | Chance of glitch per line per frame | 0.001 (0.1%) |
| `time` | Number | Animation time accumulator | Increments by 0.01 per frame |

### Behavior

**Drift**: Sinusoidal horizontal displacement creating slow wave motion
**Pulse**: Secondary sinusoidal wave for organic "breathing" effect
**Glitch**: Random vertical displacement spikes mimicking CRT scan errors

### State Transitions

```
IDLE → ANIMATING (on page load)
ANIMATING → PAUSED (motion reduced mode)
PAUSED → ANIMATING (motion re-enabled)
```

### Relationships
- **Uses** Visual Theme for color palette
- **Responds to** Motion Controller for pause/resume
- **Rendered on** `<canvas id="background">` element

---

## Entity: Central Display Box

### Purpose
Semi-transparent floating container holding the header ("THE INFINITE SHIPPING FORECAST") and the broadcast trigger button.

### Attributes

| Attribute | Type | Description | Constraints |
|-----------|------|-------------|-------------|
| `width` | String/Number | Box width | `auto` (content-based), max 800px |
| `height` | String/Number | Box height | `auto` (content-based) |
| `opacity` | Number | Background opacity | 0.5 (50%) |
| `backdropBlur` | Number (px) | Backdrop filter blur amount | 10px |
| `backgroundColor` | String | Semi-transparent background color | Oceanic blue dark with opacity |
| `padding` | String (CSS) | Internal spacing | `3rem 4rem` |
| `borderRadius` | Number (px) | Corner rounding | 8px |

### Layout

Positioned using CSS flexbox:
```css
.central-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}
```

### Children Elements

1. **Header**
   - Text: "THE INFINITE SHIPPING FORECAST"
   - Font: Serif, 3rem, uppercase, letter-spacing 0.15em
   - Color: Parchment grey

2. **Button**
   - Text: "BEGIN TRANSMISSION"
   - Font: Serif, 1.2rem, uppercase
   - Border: 2px solid parchment grey
   - Background: transparent (hover: semi-transparent white)

### Relationships
- **Contains** Header and Button elements
- **Positioned** via CSS relative to viewport center
- **Uses** Visual Theme for colors and typography

---

## Entity: Area Name Display

### Purpose
Dynamic text element that displays the currently-announced shipping area name with fade-in/fade-out and jitter animations.

### Attributes

| Attribute | Type | Description | Constraints |
|-----------|------|-------------|-------------|
| `currentArea` | String | Currently displayed area name | 10-20 characters (e.g., "VIKING", "DOGGER") |
| `fadeState` | Enum | Current fade animation state | `hidden`, `fading-in`, `visible`, `fading-out` |
| `fadeDuration` | Number (seconds) | Fade transition duration | 1-3 seconds (from Visual Theme) |
| `jitterAmplitude` | Number (px) | Max displacement for jitter | 1-2px |
| `jitterFrequency` | Number (Hz) | Jitter animation frequency | ~1.25 Hz (0.8s period) |

### Character-Level Attributes

Each character in the area name has:
- `animationDelay`: Random value (0-0.5s) for staggered jitter start
- `transform`: Per-frame jitter displacement (CSS translate)

### State Transitions

```
HIDDEN → FADING_IN (area announced)
FADING_IN → VISIBLE (after fadeDuration)
VISIBLE → FADING_OUT (area changes or broadcast segment ends)
FADING_OUT → HIDDEN (after fadeDuration)
```

### Behavior

1. When area announced: Split text into `<span>` per character, apply random animation delays, fade in
2. While visible: Each character animates independently with jitter effect
3. On area change: Fade out current, fade in new (with slight overlap allowed)

### Relationships
- **Listens to** Broadcast area change events (from `src/state/events.js`)
- **Uses** Visual Theme for typography and fade duration
- **Responds to** Motion Controller for enabling/disabling jitter

---

## Entity: Motion Controller

### Purpose
Manages user preference for motion effects and coordinates enabling/disabling animations across all visual components.

### Attributes

| Attribute | Type | Description | Constraints |
|-----------|------|-------------|-------------|
| `motionEnabled` | Boolean | Whether motion effects are active | `true` or `false` |
| `systemPrefersReduced` | Boolean | OS/browser prefers-reduced-motion setting | Read-only from media query |
| `userOverride` | Boolean | User explicitly toggled motion preference | Persisted to localStorage |

### State

Stored in:
- **Runtime**: JavaScript class instance
- **Persistent**: `localStorage.motionEnabled` (JSON boolean)
- **DOM**: `document.body.classList` contains `motion-reduced` when disabled

### Methods (Behavioral Interface)

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `initialize()` | None | void | Load preference from localStorage, check system preference |
| `toggle()` | None | void | Toggle motion state, persist to localStorage, dispatch event |
| `enable()` | None | void | Explicitly enable motion effects |
| `disable()` | None | void | Explicitly disable motion effects |
| `isEnabled()` | None | Boolean | Check current motion state |

### Events Dispatched

- `motion-enabled`: Fired when motion effects are turned on
- `motion-disabled`: Fired when motion effects are turned off

### Decision Logic

```
IF systemPrefersReduced = true THEN
  motionEnabled = false (always respect system preference)
ELSE IF userOverride exists THEN
  motionEnabled = userOverride (user has explicit preference)
ELSE
  motionEnabled = true (default: motion on)
```

### Relationships

**Controls**:
- Isobar Layer: pause/resume animation
- Central Display Box: remove/apply oscillating filters
- Area Name Display: disable/enable jitter animation

**Persists to**: `localStorage.motionEnabled`

**Reads from**: `window.matchMedia('(prefers-reduced-motion: reduce)')`

---

## Relationships Diagram

```
┌─────────────────┐
│  Visual Theme   │ (Global palette, typography, timing)
└────────┬────────┘
         │ provides colors/fonts to
         ├─────────────┬─────────────┬──────────────┐
         ↓             ↓             ↓              ↓
┌────────────┐  ┌────────────┐  ┌─────────────┐  ┌───────────────┐
│ Isobar     │  │ Central    │  │ Area Name   │  │ Motion        │
│ Layer      │  │ Display    │  │ Display     │  │ Controller    │
└────────────┘  │ Box        │  └─────────────┘  └───────┬───────┘
      ↑         └────────────┘        ↑                   │
      │                               │                   │ controls
      │                               │                   ↓
      └───────────────────────────────┴───────────── (pause/enable)
                                                     animations
```

---

## Validation Rules

### Visual Theme
- All colors MUST use only the three base color families (phosphor green, oceanic blue, parchment grey)
- oscillationPeriod MUST be between 8-12 seconds
- fadeDuration MUST be between 1-3 seconds

### Isobar Layer
- lineCount MUST be 15-25 (too few looks sparse, too many causes performance issues)
- glitchProbability MUST be < 0.01 (glitches should be rare)
- Animation MUST maintain 30+ fps

### Central Display Box
- opacity MUST be 0.5 (per clarification)
- backdropBlur MUST be present (with fallback for unsupported browsers)
- Box MUST remain readable at all viewport sizes

### Area Name Display
- currentArea MUST only contain uppercase letters and spaces
- fadeDuration MUST match Visual Theme setting
- Jitter MUST be disabled when motionEnabled = false

### Motion Controller
- System prefers-reduced-motion MUST always be respected (cannot be overridden)
- User preference MUST persist across sessions
- Toggle response MUST occur within 200ms

---

## Performance Considerations

### Isobar Layer
- Canvas size: Full viewport (can be large on 4K displays)
- Optimization: Use requestAnimationFrame, limit recalculation frequency
- Budget: <16ms per frame (60 fps) or <33ms per frame (30 fps minimum)

### Area Name Display
- Character count: Typically 5-15 characters (max ~20)
- Each character has independent animation (multiplicative performance impact)
- Optimization: Use CSS animations (GPU-accelerated) instead of JS

### Motion Controller
- Toggle action MUST complete in <200ms
- Bulk animation disable via single CSS class toggle (efficient)

---

## Browser Storage Schema

### localStorage

```json
{
  "motionEnabled": true
}
```

**Key**: `motionEnabled`
**Type**: Boolean
**Lifecycle**: Persists indefinitely until user clears browser data
**Fallback**: If key missing, default to `true`

---

## Summary

This data model defines five entities that work together to create the haunted maritime aesthetic:

1. **Visual Theme**: Central configuration for colors, fonts, timing
2. **Isobar Layer**: Animated background with drift/pulse/glitch
3. **Central Display Box**: Semi-transparent floating container
4. **Area Name Display**: Dynamic area name with fade and jitter
5. **Motion Controller**: Accessibility system for animation control

All entities respect the motion controller state and derive visual properties from the unified theme system, ensuring consistency and accessibility.
