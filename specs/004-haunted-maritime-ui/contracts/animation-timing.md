# Animation Timing Contract

**Feature**: 004-haunted-maritime-ui
**Date**: 2026-02-02
**Purpose**: Define animation timing specifications and performance budgets

---

## Oscillation Cycle (Global Filters)

### Specification

Oscillating `filter` property applied to background canvas element.

**CSS Animation**:
```css
@keyframes woozy-oscillate {
  0%, 100% {
    filter: hue-rotate(0deg) blur(0px);
  }
  50% {
    filter: hue-rotate(15deg) blur(2px);
  }
}

.background-canvas {
  animation: woozy-oscillate var(--oscillation-period) var(--oscillation-easing) infinite;
}
```

**Parameters**:
- **Duration**: 8-12 seconds (default: 10s via `--oscillation-period`)
- **Hue Rotation**: 0deg → 15deg → 0deg (±15deg per spec)
- **Blur**: 0px → 2px → 0px (0-2px per spec)
- **Easing**: `ease-in-out` (smooth acceleration/deceleration)
- **Loop**: Infinite

**Rationale**:
- 10-second cycle creates subtle, perceptible "woozy" effect without severe discomfort
- `ease-in-out` provides organic, non-linear motion
- Hue rotation stays within ±15deg to avoid color palette violations
- Blur stays within 0-2px to maintain readability

### Performance Budget

| Metric | Target | Measurement |
|--------|--------|-------------|
| Frame Rate | 30+ fps (minimum) | Chrome DevTools Performance tab |
| GPU Layer | Yes (composited) | DevTools Layers panel |
| CPU Usage | <10% (single core) | Activity Monitor / Task Manager |
| Memory | No leaks over 30 min | DevTools Memory profiler |

**Optimization**:
- Use `will-change: filter` to hint GPU layer promotion
- CSS animation (not JS) for browser optimization
- Single animation on single element (not multiple overlapping animations)

---

## Area Name Fade

### Specification

Fade-in and fade-out transitions for area name text display.

**CSS Transition**:
```css
.area-name {
  opacity: 0;
  transition: opacity var(--fade-duration) var(--fade-easing);
}

.area-name.visible {
  opacity: 1;
}
```

**Parameters**:
- **Duration**: 1-3 seconds (default: 2s via `--fade-duration`)
- **Property**: `opacity` (0 → 1 for fade-in, 1 → 0 for fade-out)
- **Easing**: `ease-in-out`
- **Triggers**:
  - Fade-in: On area announcement (broadcast event)
  - Fade-out: On area change or broadcast segment end

**State Lifecycle**:
```
HIDDEN (opacity: 0)
  ↓ [area announced]
FADING_IN (opacity: 0 → 1 over fade-duration)
  ↓ [fade complete]
VISIBLE (opacity: 1)
  ↓ [area changes]
FADING_OUT (opacity: 1 → 0 over fade-duration)
  ↓ [fade complete]
HIDDEN (opacity: 0)
```

**Overlap Handling**:
If new area announced during fade-out:
- Allow current fade-out to complete
- OR interrupt and start new fade-in immediately (spec allows "smooth transitions without jarring")
- Chosen approach: Interrupt with brief (0.3s) crossfade

### Performance Budget

| Metric | Target |
|--------|--------|
| Transition Property | `opacity` only (GPU-accelerated) |
| Reflow/Repaint | Zero (opacity doesn't trigger layout) |
| Smoothness | 60 fps (opacity transitions are cheap) |

---

## Text Jitter Animation

### Specification

Per-character "jitter" or "drift" animation on area name text.

**CSS Animation**:
```css
@keyframes text-jitter {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(1px, -1px); }
  50% { transform: translate(-1px, 1px); }
  75% { transform: translate(1px, 1px); }
}

.area-name span {
  display: inline-block;
  animation: text-jitter var(--jitter-period) ease-in-out infinite;
  animation-delay: var(--random-delay); /* Set via JS: 0-0.5s */
}
```

**Parameters**:
- **Duration**: 0.8s (per character, ~1.25 Hz frequency)
- **Amplitude**: ±1-2px (max displacement)
- **Pattern**: 4-step keyframe creating diamond-shaped motion path
- **Delay**: Randomized per character (0-0.5s) for organic stagger
- **Easing**: `ease-in-out`
- **Loop**: Infinite

**Character Count Limit**:
- Typical shipping area names: 5-15 characters
- Maximum tested: 20 characters
- Each character is an individual `<span>` with independent animation

### Performance Budget

| Metric | Target | Notes |
|--------|--------|-------|
| Character Count | ≤20 | Beyond this, consider disabling jitter |
| Frame Rate | 30+ fps | Test with 20 characters |
| Animation Property | `transform` only | GPU-accelerated |
| Layout Impact | Zero | `inline-block` prevents layout shift |

**Optimization**:
- Use `transform: translate()` (not `left`/`top`)
- Each `<span>` gets GPU layer (monitor layer count in DevTools)
- If >20 characters, disable jitter or use simplified animation

---

## Motion Toggle Response

### Specification

Time from user clicking motion toggle button to visual effect change.

**Target**: <200ms (per constraints in spec)

**Measurement**:
```javascript
// In motion-toggle.js
toggle() {
  const startTime = performance.now();

  this.motionEnabled = !this.motionEnabled;
  document.body.classList.toggle('motion-reduced', !this.motionEnabled);

  const endTime = performance.now();
  console.assert(endTime - startTime < 200, 'Toggle response too slow');
}
```

**Affected Systems**:
1. Oscillation animation: Paused via CSS class
2. Text jitter: Disabled via CSS class
3. Isobar drift/pulse: JavaScript animation loop continues but simplified
4. Preference persistence: `localStorage.setItem` (async, doesn't block)

**Performance Budget**:
- Class toggle: <1ms (synchronous DOM operation)
- CSS recalculation: <10ms (browser-dependent)
- Animation stop: <5ms (GPU state change)
- Total: <20ms (well under 200ms budget)

---

## Isobar Background Animation

### Specification

Canvas-based procedural animation rendering isobar contour lines.

**Frame Rate Target**: 30-60 fps

**Animation Loop**:
```javascript
_animate() {
  this.time += 0.01; // Time accumulator

  this._drawIsobars();

  this.animationFrame = requestAnimationFrame(() => this._animate());
}
```

**Parameters**:
- **Frame Time Budget**: <16ms (60 fps) or <33ms (30 fps)
- **Canvas Size**: Full viewport (can be 3840x2160 on 4K displays)
- **Line Count**: 15-25 (default: 20)
- **Calculation Complexity**: O(width * lineCount) per frame

### Performance Budget

| Metric | Target | Measurement |
|--------|--------|-------------|
| Frame Time | <16ms (60 fps ideal) | `performance.now()` delta |
| Drop Budget | <33ms (30 fps minimum) | DevTools Performance tab |
| Canvas Ops | <5ms | Time `_drawIsobars()` method |
| Total Frame | <10ms (leaves 6ms for browser) | Include RAF overhead |

**Optimization Strategies**:
1. **Reduce line count** on lower-end devices (detect via frame rate monitoring)
2. **Reduce sampling frequency** (draw every 10px instead of every 5px)
3. **Skip frames** if previous frame took >33ms
4. **Simplify math** (pre-compute sin/cos lookup tables)

**Degradation Plan**:
```
60 fps: Full quality (20 lines, 5px sampling)
  ↓ [frame time > 16ms sustained]
45 fps: Reduced quality (15 lines, 10px sampling)
  ↓ [frame time > 22ms sustained]
30 fps: Minimum quality (12 lines, 15px sampling)
  ↓ [frame time > 33ms sustained]
PAUSE: Disable animation, show static isobars
```

---

## Performance Testing Checklist

Use this checklist for manual browser testing:

### Oscillation
- [ ] Animation runs smoothly (no visible stuttering)
- [ ] DevTools Performance shows 30+ fps average
- [ ] GPU layer visible in Layers panel
- [ ] CPU usage <10% in Activity Monitor

### Area Name Fade
- [ ] Fade-in completes in 1-3 seconds (subjective)
- [ ] Fade-out completes in 1-3 seconds
- [ ] No layout shift during fade
- [ ] Smooth 60 fps during transition

### Text Jitter
- [ ] Each character animates independently
- [ ] Staggered start creates organic effect
- [ ] Frame rate remains 30+ fps with 15 characters
- [ ] No excessive GPU layers (check DevTools Layers)

### Motion Toggle
- [ ] Click response feels instant (<200ms)
- [ ] All animations stop/start correctly
- [ ] No console errors during toggle
- [ ] Preference persists on page reload

### Isobar Animation
- [ ] Smooth animation at all viewport sizes
- [ ] Frame rate 30+ fps on 1080p display
- [ ] Frame rate 30+ fps on 4K display (or degrades gracefully)
- [ ] No memory leaks over 30-minute runtime

---

## Browser Compatibility

### Tested Platforms

Target: Modern browsers released within last 2 years (per spec)

| Browser | Version | Oscillation | Backdrop-Filter | Jitter | Overall |
|---------|---------|-------------|-----------------|--------|---------|
| Chrome | 115+ | ✅ | ✅ | ✅ | ✅ |
| Firefox | 115+ | ✅ | ✅ | ✅ | ✅ |
| Safari | 16+ | ✅ | ✅ (`-webkit-`) | ✅ | ✅ |
| Edge | 115+ | ✅ | ✅ | ✅ | ✅ |

### Fallback Behavior

If browser doesn't support a feature:
- **backdrop-filter**: Fall back to solid semi-transparent background
- **CSS animations**: Graceful degradation (no animation, static display)
- **Canvas**: No fallback (Canvas 2D is universally supported)

---

## Summary

| Animation | Duration | Property | Target FPS | Budget |
|-----------|----------|----------|------------|--------|
| Oscillation | 8-12s (default 10s) | `filter` | 30+ | <16ms per frame |
| Area Fade | 1-3s (default 2s) | `opacity` | 60 | Trivial |
| Text Jitter | 0.8s loop | `transform` | 30+ | <5ms per frame |
| Motion Toggle | N/A | Class change | N/A | <200ms total |
| Isobar Anim | Continuous | Canvas draw | 30-60 | <16ms per frame |

**Total Performance Budget**: 30 fps minimum across all animations simultaneously.
