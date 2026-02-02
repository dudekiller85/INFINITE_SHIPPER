# Quickstart Guide: Haunted Maritime UI

**Feature**: 004-haunted-maritime-ui
**Date**: 2026-02-02
**Purpose**: Local development setup and manual testing guide

---

## Prerequisites

- Node.js 18+ installed
- Modern web browser (Chrome, Firefox, Safari, or Edge from last 2 years)
- Git repository cloned to local machine
- Text editor or IDE

---

## Setup

### 1. Install Dependencies

```bash
cd /path/to/INFINITE_SHIPPER
npm install
```

This installs:
- `http-server` for local development server
- `prettier` and `eslint` for code formatting/linting

### 2. Checkout Feature Branch

```bash
git checkout 004-haunted-maritime-ui
```

Verify you're on the correct branch:
```bash
git branch --show-current
# Should output: 004-haunted-maritime-ui
```

### 3. Start Development Server

```bash
npm run dev
```

This starts `http-server` on port 8000.

Output should show:
```
Starting up http-server, serving public
Available on:
  http://127.0.0.1:8000
  http://192.168.x.x:8000
Hit CTRL-C to stop the server
```

### 4. Open in Browser

Navigate to: `http://localhost:8000`

You should see:
- Animated isobar background (green/blue wavy lines)
- Semi-transparent central box with header and button
- "THE INFINITE SHIPPING FORECAST" header
- "BEGIN TRANSMISSION" button
- Motion toggle button in lower right corner

---

## Project Structure

```
INFINITE_SHIPPER/
├── public/
│   ├── index.html          # Main HTML file
│   ├── styles.css          # Haunted maritime styles
│   └── audio/              # Pre-generated audio library (if any)
├── src/
│   ├── app.js              # Application entry point
│   ├── config.js           # Configuration
│   ├── visuals/
│   │   ├── background.js   # Isobar canvas animation
│   │   ├── effects.js      # Oscillating filter controller
│   │   ├── theme.js        # Color palette manager
│   │   └── motion-toggle.js # Accessibility control
│   ├── audio/              # Audio generation (existing)
│   ├── core/               # Broadcast logic (existing)
│   ├── state/              # State management (existing)
│   └── utils/              # Utilities (existing)
├── specs/
│   └── 004-haunted-maritime-ui/
│       ├── spec.md         # Feature specification
│       ├── plan.md         # Implementation plan
│       ├── research.md     # Technical research
│       ├── data-model.md   # Entity definitions
│       ├── quickstart.md   # This file
│       └── contracts/      # API/CSS contracts
└── package.json
```

---

## Testing the Visual Effects

### Manual Testing Checklist

Open browser DevTools (F12 or Cmd+Option+I) and follow these tests:

#### 1. Color Palette Verification

**Goal**: Ensure only phosphor green, oceanic blue, and parchment grey colors are used.

**Steps**:
1. Inspect the page with DevTools Elements tab
2. Click on various visual elements (background, box, text, button)
3. In Computed Styles panel, check color values

**Expected Colors** (HSL format):
- Phosphor Green: `hsl(140, 60-80%, 30-60%)`
- Oceanic Blue: `hsl(200, 50-70%, 20-50%)`
- Parchment Grey: `hsl(45, 10-20%, 40-85%)`

**Pass Criteria**: No colors outside these ranges (no pure white, black, red, etc.)

---

#### 2. Oscillating Filter Animation

**Goal**: Verify hue-rotate and blur filters oscillate smoothly over 8-12 seconds.

**Steps**:
1. Watch the background canvas for 30 seconds
2. Observe subtle color shifts (greenish → blueish → greenish)
3. Observe subtle blur increase/decrease

**Expected Behavior**:
- Complete cycle every ~10 seconds
- Smooth transition (no sudden jumps)
- Creates "woozy" or "sea legs" sensation

**DevTools Check**:
1. Open Performance tab
2. Click Record
3. Wait 15 seconds
4. Stop recording
5. Check frame rate (should be 30+ fps)

**Pass Criteria**:
- Visible oscillation over 10-second period
- Frame rate maintains 30+ fps (green line in Performance timeline)

---

#### 3. Isobar Background Animation

**Goal**: Verify isobar lines drift, pulse, and occasionally glitch.

**Steps**:
1. Focus on background wavy lines
2. Watch for 30 seconds
3. Look for:
   - Slow horizontal drift (waves moving left/right)
   - Vertical pulse (waves breathing up/down)
   - Occasional random glitch spikes

**Expected Behavior**:
- Smooth, organic motion
- No stuttering or lag
- Glitches are rare (1-2 per minute)

**DevTools Check**:
- Performance tab: Frame rate 30+ fps
- Layers tab: Canvas element has own GPU layer

**Pass Criteria**:
- Animation is smooth and continuous
- Frame rate 30+ fps

---

#### 4. Central Display Box

**Goal**: Verify semi-transparent box with backdrop blur.

**Steps**:
1. Inspect the central box element
2. In Computed Styles, check:
   - `opacity`: Should be near 0.5
   - `backdrop-filter`: Should include `blur(10px)`

**Expected Appearance**:
- Box is semi-transparent (you can see isobar lines through it)
- Content behind box is slightly blurred
- Text inside box is fully readable

**Fallback Test** (if backdrop-filter not supported):
1. Open DevTools Console
2. Run: `CSS.supports('backdrop-filter', 'blur(10px)')`
3. If returns `false`, verify solid semi-transparent background is used

**Pass Criteria**:
- Box has 50% opacity
- Backdrop blur visible (or fallback present)
- Text remains readable

---

#### 5. Typography & Layout

**Goal**: Verify serif font and proper spacing.

**Steps**:
1. Inspect header text ("THE INFINITE SHIPPING FORECAST")
2. Check Computed Styles:
   - `font-family`: Should start with "Times New Roman" or "EB Garamond"
   - `font-size`: ~3rem (48px)
   - `letter-spacing`: ~0.15em

3. Inspect button ("BEGIN TRANSMISSION")
4. Check:
   - Same serif font family
   - Font size ~1.2rem
   - Uppercase text

**Pass Criteria**:
- High-authority serif font used throughout
- Spacing creates formal, maritime aesthetic
- Button text is readable despite effects

---

#### 6. Motion Toggle Accessibility Control

**Goal**: Verify motion toggle button works and persists preference.

**Steps**:
1. Locate motion toggle button (lower right corner)
2. Click button
3. Observe:
   - All animations stop immediately
   - Button visual state changes (indicates "off")
4. Click button again
5. Observe:
   - All animations resume
   - Button returns to "on" state

**Persistence Test**:
1. Disable motion via toggle
2. Refresh page (Cmd+R or F5)
3. Verify motion remains disabled

**localStorage Check**:
1. Open DevTools Application tab → Local Storage
2. Find key `motionEnabled`
3. Value should be `true` or `false` (JSON boolean)

**Pass Criteria**:
- Button is visible and clickable
- Clicking disables all animations instantly (<200ms)
- Preference persists across page reloads

---

#### 7. System Preference (prefers-reduced-motion)

**Goal**: Verify system accessibility settings are respected.

**macOS Steps**:
1. Open System Settings → Accessibility → Display
2. Enable "Reduce motion"
3. Reload page
4. Verify all animations are disabled by default

**Windows Steps**:
1. Open Settings → Accessibility → Visual effects
2. Enable "Show animations in Windows"
3. Reload page
4. Verify motion state

**DevTools Test**:
```javascript
// In Console, check system preference
window.matchMedia('(prefers-reduced-motion: reduce)').matches
// Should return true if system preference enabled
```

**Pass Criteria**:
- If system preference enabled, motion is disabled on load
- User cannot override system preference (toggle button disabled or explains why)

---

#### 8. Area Name Display (During Broadcast)

**Goal**: Verify area name fades in/out with jitter effect.

**Steps**:
1. Click "BEGIN TRANSMISSION" button
2. Wait for first shipping area to be announced
3. Watch area name display (center of screen)
4. Observe:
   - Text fades in over 1-3 seconds
   - Each letter has slight "jitter" or "drift"
   - Text remains visible during area forecast
   - Text fades out when moving to next area

**Character Animation Test**:
1. Inspect area name element
2. Verify each character is wrapped in `<span>`
3. Each span should have independent animation

**Pass Criteria**:
- Fade transitions are smooth (1-3 seconds)
- Jitter effect is subtle but visible
- Text remains readable throughout
- Animations disabled when motion toggle is off

---

#### 9. Responsive Design

**Goal**: Verify UI works on different viewport sizes.

**Steps**:
1. Open DevTools Device Toolbar (Cmd+Shift+M)
2. Test these viewport sizes:
   - 360x640 (Mobile)
   - 768x1024 (Tablet)
   - 1920x1080 (Desktop)
   - 3840x2160 (4K)

**Expected Behavior**:
- Central box scales appropriately
- Text remains readable
- Button is clickable
- Motion toggle visible in corner
- Isobar animation fills viewport

**Pass Criteria**:
- UI functional on all tested viewports (360px to 4K)
- No horizontal scrolling
- All interactive elements accessible

---

## Tweaking the Color Palette

To experiment with different color variations:

### 1. Open CSS Variables File

The color palette is defined in `public/styles.css` at the top:

```css
:root {
  --color-phosphor-green: hsl(140, 70%, 45%);
  --color-oceanic-blue: hsl(200, 60%, 35%);
  --color-parchment-grey: hsl(45, 15%, 70%);
  /* ... */
}
```

### 2. Live Editing in Browser

**DevTools Method**:
1. Open DevTools (F12)
2. Go to Elements tab
3. Find `:root` style declaration
4. Click on a color value (e.g., `hsl(140, 70%, 45%)`)
5. Adjust HSL values using color picker or typing

**Hue (first value)**:
- 0-360 degrees around color wheel
- Phosphor green: ~140 (green)
- Oceanic blue: ~200 (blue)
- Parchment grey: ~45 (yellow-ish neutral)

**Saturation (second value)**:
- 0% = grayscale
- 100% = fully saturated
- Higher = more vibrant

**Lightness (third value)**:
- 0% = black
- 50% = pure color
- 100% = white

### 3. Experiment Examples

**More Vibrant Green**:
```css
--color-phosphor-green: hsl(140, 90%, 50%);
```

**Darker, Moodier Blue**:
```css
--color-oceanic-blue: hsl(200, 70%, 25%);
```

**Warmer Parchment**:
```css
--color-parchment-grey: hsl(30, 25%, 70%); /* More orange-toned */
```

### 4. Save Changes

Once satisfied, copy updated CSS variables from DevTools and paste into `public/styles.css`.

---

## Performance Profiling

### Frame Rate Monitoring

**Method 1: DevTools FPS Meter**:
1. Open DevTools (F12)
2. Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows)
3. Type "fps" and select "Show frames per second (FPS) meter"
4. FPS meter appears in top-left corner

**Target**: 30+ fps (green), ideally 60 fps

**Method 2: Performance Tab**:
1. Open DevTools Performance tab
2. Click Record (circle icon)
3. Wait 10 seconds while animations run
4. Stop recording
5. Examine:
   - FPS graph (should be mostly green, not red)
   - Frame timing (should be <33ms per frame for 30 fps)
   - Long tasks (none should exceed 50ms)

### Memory Leaks Check

**Goal**: Ensure animations don't leak memory over time.

**Steps**:
1. Open DevTools Memory tab
2. Take initial heap snapshot
3. Let page run for 5 minutes
4. Take second snapshot
5. Compare:
   - Total heap size should be stable (±10%)
   - No continuous growth trend

**Pass Criteria**:
- Memory usage stable over 30 minutes
- No console errors

---

## Common Issues & Troubleshooting

### Issue: Animations are choppy/laggy

**Possible Causes**:
- Too many isobar lines (reduce `lineCount` in background.js)
- Browser not using GPU acceleration
- Other heavy tabs/applications running

**Solutions**:
1. Check GPU acceleration: chrome://gpu (Chrome) or about:support (Firefox)
2. Close other browser tabs
3. Reduce animation complexity:
   ```javascript
   // In src/visuals/background.js
   const lineCount = 12; // Instead of 20
   ```

---

### Issue: Backdrop-filter not working

**Possible Causes**:
- Browser doesn't support backdrop-filter
- Browser version too old

**Check Support**:
```javascript
// In DevTools Console
CSS.supports('backdrop-filter', 'blur(10px)')
// Should return true if supported
```

**Fallback**:
Spec requires fallback to solid semi-transparent background. Check `@supports` rule in CSS:
```css
.central-box {
  background: rgba(26, 77, 102, 0.5); /* Fallback */
}

@supports (backdrop-filter: blur(10px)) {
  .central-box {
    backdrop-filter: blur(10px);
  }
}
```

---

### Issue: Motion toggle doesn't persist

**Possible Causes**:
- localStorage disabled (private browsing)
- Storage quota exceeded

**Check localStorage**:
```javascript
// In DevTools Console
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
  console.log('localStorage available');
} catch (e) {
  console.error('localStorage unavailable:', e);
}
```

**Expected Behavior**:
Feature should still work (motion preference lasts for session only).

---

### Issue: Colors don't match spec

**Debug Steps**:
1. Open DevTools Elements tab
2. Inspect element with incorrect color
3. Check Computed Styles panel for actual color value
4. Trace back to CSS source:
   - Should reference `var(--color-*)` not hardcoded hex
5. Verify CSS variable definition in `:root`

**Validation Command**:
```bash
# Check for hardcoded colors in CSS (should return empty)
grep -E "#[0-9a-fA-F]{3,6}" public/styles.css
```

---

## Next Steps

After verifying the haunted maritime UI works locally:

1. **Manual Testing**: Complete all items in testing checklist above
2. **Refinement**: Tweak colors, timing, or animations based on feel
3. **Cross-Browser**: Test in Chrome, Firefox, Safari, Edge
4. **Mobile Testing**: Test on actual mobile device (not just DevTools emulation)
5. **Ready for Tasks**: Proceed to `/speckit.tasks` to generate implementation tasks

---

## Quick Reference

### Useful Console Commands

```javascript
// Check motion state
document.body.classList.contains('motion-reduced');

// Manually toggle motion
document.querySelector('.motion-toggle').click();

// Get current CSS variable value
getComputedStyle(document.documentElement)
  .getPropertyValue('--color-phosphor-green');

// Check system preference
window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Force enable motion (bypass system pref - for testing only)
document.body.classList.remove('motion-reduced');

// Check localStorage
localStorage.getItem('motionEnabled');
```

### Keyboard Shortcuts

- **F12** / **Cmd+Option+I**: Open DevTools
- **Cmd+Shift+M** / **Ctrl+Shift+M**: Toggle device toolbar
- **Cmd+R** / **F5**: Refresh page
- **Cmd+Shift+R** / **Ctrl+F5**: Hard refresh (bypass cache)

### File Locations

| File | Purpose |
|------|---------|
| `public/index.html` | HTML structure |
| `public/styles.css` | All CSS styles |
| `src/app.js` | Entry point, initialization |
| `src/visuals/background.js` | Isobar canvas animation |
| `src/visuals/motion-toggle.js` | Motion controller |
| `src/visuals/theme.js` | Color palette manager |

---

## Support

If issues persist after following this guide:
1. Check browser console for JavaScript errors
2. Verify Node.js and npm versions meet requirements
3. Try clearing browser cache and localStorage
4. Review spec.md and plan.md for additional context

Happy testing! 🚢🌊
