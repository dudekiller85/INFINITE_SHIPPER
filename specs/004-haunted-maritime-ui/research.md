# Research: Haunted Maritime UI

**Feature**: 004-haunted-maritime-ui
**Date**: 2026-02-02
**Purpose**: Technical research to resolve unknowns before design phase

---

## 1. CSS Backdrop-Filter Browser Support

### Decision
Use CSS `backdrop-filter: blur()` for the semi-transparent central display box with fallback to solid semi-transparent background.

### Rationale
- **Browser Support (Jan 2025)**: backdrop-filter supported in:
  - Chrome 76+ (July 2019)
  - Firefox 103+ (July 2022)
  - Safari 9+ (2015, with `-webkit-` prefix)
  - Edge 79+ (Jan 2020)
- Target browsers (last 2 years) all support backdrop-filter
- Graceful degradation via `@supports` ensures fallback for older browsers

### Implementation Approach
```css
.central-box {
  background: rgba(20, 40, 50, 0.5); /* Fallback */
}

@supports (backdrop-filter: blur(10px)) {
  .central-box {
    backdrop-filter: blur(10px);
  }
}
```

### Alternatives Considered
- **Canvas-based blur**: Rejected due to performance overhead and complexity
- **SVG filter blur**: Rejected due to worse browser support than backdrop-filter
- **No blur, opaque background**: Rejected as it breaks the "floating box" aesthetic requirement

---

## 2. CSS Animation Performance

### Decision
Use CSS `@keyframes` animations for hue-rotate and blur oscillation with `will-change` optimization.

### Rationale
- CSS animations are GPU-accelerated by default (better than JS requestAnimationFrame for simple transforms/filters)
- Declarative approach easier to maintain and debug
- Browser automatically throttles animations in inactive tabs (battery-friendly)
- Can be disabled instantly via class toggle for motion preferences

### Implementation Approach
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
  will-change: filter;
  animation: woozy-oscillate 10s ease-in-out infinite;
}

/* Motion reduced mode */
.motion-reduced .background-canvas {
  animation: none;
  filter: none;
}
```

### Performance Best Practices
- Use `will-change: filter` to hint GPU layer promotion
- Limit animated properties to `transform`, `opacity`, and `filter` (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left` (triggers layout/reflow)
- Single 8-12 second animation (mid-range: 10s) balances perceptibility with smoothness

### Alternatives Considered
- **JavaScript requestAnimationFrame**: Rejected as CPU-bound, harder to optimize, more code
- **Web Animations API**: Rejected as newer API with less support for complex filter animations
- **GSAP or animation library**: Rejected per constitution (no external dependencies for simple animations)

---

## 3. Isobar Visual Pattern

### Decision
Generate procedural isobar lines using Canvas 2D API with sinusoidal wave functions, animated via time parameter for drift/pulse effects.

### Rationale
- **Isobar characteristics**: Contour lines of constant atmospheric pressure, typically parallel curves with occasional convergence
- **1970s CRT phosphor**: Greenish monochrome displays, slightly blurred/glowing lines, scanline artifacts
- Canvas allows real-time generation and animation without image assets
- Existing `BackgroundCanvas` class provides foundation

### Implementation Approach
```javascript
// Enhance existing BackgroundCanvas class
_drawIsobars() {
  const lineCount = 20;
  const spacing = height / lineCount;

  for (let i = 0; i < lineCount; i++) {
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.getIsobarColor(i); // Phosphor green with variation

    for (let x = 0; x <= width; x += 5) {
      // Multi-frequency wave for organic drift
      const drift = Math.sin((x * 0.01) + (this.time * 0.3) + (i * 0.5)) * 30;
      const pulse = Math.cos((x * 0.008) - (this.time * 0.2)) * 15;

      // Occasional glitch effect
      const glitch = (Math.random() < 0.001) ? Math.random() * 20 : 0;

      const y = (i * spacing) + drift + pulse + glitch;

      if (x === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }

    this.ctx.stroke();
  }
}
```

### Visual References
- BBC Shipping Forecast maps: Parallel curved isobar lines
- 1970s weather radar screens: Green phosphor CRT displays
- Generative art: Perlin noise, sinusoidal displacement fields

### Alternatives Considered
- **SVG path animation**: Rejected as more complex for dynamic generation
- **Pre-rendered animated GIF/video**: Rejected as large file size, not procedural
- **WebGL shader**: Rejected as overengineered for simple 2D lines

---

## 4. Text Jitter/Drift Animation

### Decision
Use CSS `animation` with randomized per-character `animation-delay` via inline styles, targeting individual `<span>` elements.

### Rationale
- Per-character animation requires wrapping each character in a `<span>` (done via JavaScript)
- CSS animations more performant than JavaScript-based character manipulation
- Randomized delays create organic, non-uniform jitter effect

### Implementation Approach
```javascript
// In area name display module
function displayAreaName(areaName) {
  const container = document.getElementById('area-name');
  container.innerHTML = '';

  for (const char of areaName) {
    const span = document.createElement('span');
    span.textContent = char;
    span.style.animationDelay = `${Math.random() * 0.5}s`;
    container.appendChild(span);
  }
}
```

```css
@keyframes text-jitter {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(1px, -1px); }
  50% { transform: translate(-1px, 1px); }
  75% { transform: translate(1px, 1px); }
}

.area-name span {
  display: inline-block;
  animation: text-jitter 0.8s ease-in-out infinite;
}
```

### Performance Consideration
- Limit character count (shipping area names are ~10-15 chars, manageable)
- Use `transform` (GPU-accelerated) instead of `left`/`top`
- Disable animation in motion-reduced mode

### Alternatives Considered
- **Canvas text rendering**: Rejected as harder to maintain, accessibility issues
- **JavaScript per-frame updates**: Rejected as CPU-intensive, battery-draining
- **SVG text with `<animateTransform>`**: Rejected as more complex setup

---

## 5. Accessibility Controls

### Decision
Implement always-visible button in lower right corner with `aria-label`, persist preference to `localStorage`, respect `prefers-reduced-motion` media query.

### Rationale
- **WCAG 2.2.2 (Pause, Stop, Hide)**: Users must be able to pause moving content
- **WCAG 2.3.3 (Animation from Interactions)**: Motion animations can be disabled
- Always-visible control (vs hidden keyboard shortcut) ensures discoverability
- `prefers-reduced-motion` respects OS-level accessibility settings
- localStorage persistence prevents user having to re-disable on each visit

### Implementation Approach
```javascript
class MotionController {
  constructor() {
    this.motionEnabled = this.loadPreference();
    this.respectSystemPreference();
  }

  loadPreference() {
    const saved = localStorage.getItem('motion-enabled');
    return saved !== null ? JSON.parse(saved) : true;
  }

  respectSystemPreference() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      this.motionEnabled = false;
    }
  }

  toggle() {
    this.motionEnabled = !this.motionEnabled;
    localStorage.setItem('motion-enabled', JSON.stringify(this.motionEnabled));
    document.body.classList.toggle('motion-reduced', !this.motionEnabled);
    this.dispatchEvent('motion-change', { enabled: this.motionEnabled });
  }
}
```

```html
<button
  id="motion-toggle"
  class="motion-toggle"
  aria-label="Toggle motion effects"
  aria-pressed="true">
  <!-- Icon: waves or motion symbol -->
</button>
```

```css
.motion-toggle {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 1000;
  /* Ensure visible against all backgrounds */
}
```

### WCAG Compliance
- **WCAG 2.2.2 Level A**: ✅ Users can pause/stop animations
- **WCAG 2.3.3 Level AAA**: ✅ Motion animations can be disabled
- **WCAG 1.4.11 Level AA**: ✅ Control has sufficient contrast against background

### Alternatives Considered
- **Keyboard shortcut only (e.g., 'M' key)**: Rejected as not discoverable
- **Settings menu**: Rejected as requires extra navigation step
- **Auto-detect only via prefers-reduced-motion**: Rejected as some users may want manual control

---

## 6. Color Palette Implementation

### Decision
Define color palette as CSS custom properties in `:root`, derive all colors from three base values, use HSL format for easier variation generation.

### Rationale
- CSS custom properties (CSS variables) allow centralized color management
- HSL format easier to create "phosphor glow" variants (adjust lightness/saturation)
- Single source of truth ensures 100% color consistency (SC-006 requirement)
- Can be overridden per theme or user preference if needed

### Color Specifications

**Phosphor Green** (primary, inspired by 1970s CRT monitors):
- Base: `hsl(140, 70%, 45%)` → `#26d926` (bright, slightly yellow-green)
- Dim: `hsl(140, 60%, 30%)` → `#1a8a1a` (darker, for backgrounds)
- Glow: `hsl(140, 80%, 60%)` → `#33ff33` (bright, for highlights)

**Oceanic Blue** (secondary, deep maritime blue):
- Base: `hsl(200, 60%, 35%)` → `#2480a6` (medium ocean blue)
- Dark: `hsl(200, 50%, 20%)` → `#1a4d66` (dark, for box backgrounds)
- Light: `hsl(200, 70%, 50%)` → `#268cbf` (lighter, for accents)

**Parchment Grey** (neutral, aged paper):
- Base: `hsl(45, 15%, 70%)` → `#bfb8a6` (warm grey-beige)
- Dark: `hsl(45, 10%, 40%)` → `#706d66` (darker, for text)
- Light: `hsl(45, 20%, 85%)` → `#ddd9cc` (lighter, for backgrounds)

### Implementation Approach
```css
:root {
  /* Base colors */
  --color-phosphor-green: hsl(140, 70%, 45%);
  --color-phosphor-green-dim: hsl(140, 60%, 30%);
  --color-phosphor-green-glow: hsl(140, 80%, 60%);

  --color-oceanic-blue: hsl(200, 60%, 35%);
  --color-oceanic-blue-dark: hsl(200, 50%, 20%);
  --color-oceanic-blue-light: hsl(200, 70%, 50%);

  --color-parchment-grey: hsl(45, 15%, 70%);
  --color-parchment-grey-dark: hsl(45, 10%, 40%);
  --color-parchment-grey-light: hsl(45, 20%, 85%);

  /* Semantic mappings */
  --color-primary: var(--color-phosphor-green);
  --color-secondary: var(--color-oceanic-blue);
  --color-neutral: var(--color-parchment-grey);

  --color-background: hsl(200, 50%, 10%); /* Very dark oceanic blue */
  --color-text: var(--color-parchment-grey);
  --color-accent: var(--color-phosphor-green-glow);
}
```

### Enforcement Strategy
1. **Linting**: No hardcoded hex colors in CSS (use custom properties)
2. **Manual testing**: Visual inspection against color palette reference
3. **Browser DevTools**: Inspect computed styles to verify color values

### Alternatives Considered
- **Sass variables**: Rejected as requires build step, less dynamic than CSS custom properties
- **JavaScript color manager**: Rejected as CSS custom properties already provide this functionality
- **Hardcoded colors**: Rejected as makes palette changes difficult, violates SC-006

---

## Summary of Decisions

| Research Area | Decision | Key Technology |
|---------------|----------|----------------|
| Backdrop Filter | Use with @supports fallback | CSS backdrop-filter |
| Animation Performance | CSS @keyframes with will-change | CSS animations |
| Isobar Pattern | Procedural Canvas 2D with sinusoidal waves | Canvas API |
| Text Jitter | Per-character CSS animation with random delay | CSS animations |
| Accessibility Control | Always-visible button + prefers-reduced-motion | localStorage + media query |
| Color Palette | CSS custom properties in HSL format | CSS variables |

**Next Phase**: Generate data model and contracts based on these technical decisions.
