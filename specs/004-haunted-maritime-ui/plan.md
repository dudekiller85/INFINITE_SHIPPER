# Implementation Plan: Haunted Maritime UI

**Branch**: `004-haunted-maritime-ui` | **Date**: 2026-02-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-haunted-maritime-ui/spec.md`

## Summary

Replace the existing frontend visual experience with a haunted 1970s maritime aesthetic featuring phosphor green/oceanic blue/parchment grey color palette, animated isobar contour lines, oscillating hue-rotate and blur effects (8-12 second cycles), semi-transparent central display box (50% opacity with backdrop blur), and an always-visible accessibility control in the lower right corner to toggle motion effects. This replaces the current basic dark theme with a complete atmospheric redesign that maintains the existing broadcast functionality while establishing the intended dream-like, "woozy" maritime aesthetic.

## Technical Context

**Language/Version**: JavaScript ES6+ (browser-based), Node.js 18+ for tooling
**Primary Dependencies**: Vanilla JS (no frameworks), CSS3 animations and filters, Canvas 2D API
**Storage**: Browser localStorage for motion preference persistence (client-side only)
**Testing**: Manual browser testing (per constitution: no automated testing required)
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge) released within last 2 years
**Project Type**: Web application (single-page, browser-based art piece)
**Performance Goals**: 30+ fps animation, 3-second first meaningful paint, smooth 8-12 second oscillation cycles
**Constraints**: No external CSS/animation libraries, <200ms motion toggle response, prefers-reduced-motion support required
**Scale/Scope**: Single-page UI redesign affecting ~5 files (HTML, CSS, 2-3 JS modules), no backend changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | This Feature | Status |
|-----------|-------------|--------------|--------|
| Personal Project Workflow | Prioritize rapid iteration, direct browser testing, manual verification | UI redesign with manual browser testing, no test automation | ✅ PASS |
| No Automated Testing Required | Manual browser testing only | Manual testing of visual effects, animations, accessibility controls | ✅ PASS |
| Natural Speech Quality | N/A for UI-only changes | No audio changes, preserves existing broadcast functionality | ✅ PASS |
| Real-Time Generation | N/A for UI-only changes | No audio generation changes | ✅ PASS |

**Result**: All constitution requirements satisfied. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/004-haunted-maritime-ui/
├── spec.md              # Feature specification (/speckit.specify output)
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output (CSS variable contracts, animation timing contracts)
```

### Source Code (repository root)

```text
# Current structure (web application)
public/
├── index.html           # [MODIFY] Update layout: add header, rename button, add motion toggle
├── styles.css           # [REPLACE] Complete redesign with haunted maritime theme

src/
├── visuals/
│   ├── background.js    # [MODIFY] Update isobar animation with drift/pulse/glitch
│   ├── effects.js       # [MODIFY] Add oscillating filter controller (8-12s cycles)
│   ├── theme.js         # [NEW] Color palette manager and CSS variable controller
│   └── motion-toggle.js # [NEW] Accessibility control for motion effects
├── app.js               # [MODIFY] Initialize new visual components, wire motion toggle
└── config.js            # [MODIFY] Add visual theme configuration

# Unchanged (existing broadcast functionality preserved)
src/
├── audio/               # No changes
├── core/                # No changes
├── state/               # No changes (may need minor event additions for motion toggle)
└── utils/               # No changes
```

**Structure Decision**: Web application structure maintained. Changes isolated to visual layer (`public/`, `src/visuals/`, `src/app.js`) with zero impact on audio/broadcast core functionality. New modules added for theme management (`theme.js`) and accessibility (`motion-toggle.js`). Existing `background.js` and `effects.js` modified to support new aesthetic requirements.

## Complexity Tracking

> **No violations to justify** - Constitution Check passed cleanly.

---

# Phase 0: Research & Technical Decisions

## Research Tasks

The following areas require investigation before design:

1. **CSS Backdrop-Filter Browser Support**: Verify backdrop-filter (needed for 50% opacity box with blur) works in target browsers (Chrome, Firefox, Safari, Edge last 2 years). Research fallback strategies for browsers without support.

2. **CSS Animation Performance**: Research best practices for 8-12 second continuous CSS filter animations (hue-rotate, blur) to maintain 30+ fps. Investigate will-change property, GPU acceleration, and requestAnimationFrame vs CSS animations.

3. **Isobar Visual Pattern**: Research meteorological isobar line patterns, 1970s CRT phosphor display characteristics, and generative art techniques for creating authentic-looking drifting/pulsing contour lines.

4. **Text Jitter/Drift Animation**: Research CSS or Canvas techniques for per-character "jitter" and "drift" effects on area name text. Evaluate CSS transform vs Canvas text rendering for performance.

5. **Accessibility Controls**: Research WCAG guidelines for motion reduction controls, prefers-reduced-motion media query implementation, and localStorage patterns for persisting user motion preferences.

6. **Color Palette Implementation**: Research CSS custom property strategies for maintaining strict color palette (phosphor green, oceanic blue, parchment grey) across all elements. Investigate color management for CRT phosphor aesthetic.

---

*Phase 0 output will be written to `research.md` after research tasks complete.*

---

# Phase 1: Design & Contracts

## Phase 1 Tasks

1. **Define Visual Entity Model** (`data-model.md`):
   - Visual Theme (color palette, typography, animation parameters)
   - Isobar Layer (line patterns, drift/pulse/glitch parameters)
   - Central Display Box (dimensions, opacity, backdrop blur)
   - Area Name Display (fade timing, jitter parameters)
   - Motion Toggle (position, states, persistence)

2. **CSS Contract** (`contracts/theme-contract.css`):
   - CSS custom properties for color palette (--color-phosphor-green, --color-oceanic-blue, --color-parchment-grey)
   - Animation timing variables (--oscillation-period, --fade-duration)
   - Typography variables (--font-serif, --font-size-header, --font-size-area)

3. **Animation Contract** (`contracts/animation-timing.md`):
   - Oscillation cycle spec: 8-12 seconds (±15deg hue-rotate, 0-2px blur)
   - Area name fade spec: 1-3 seconds fade in/out
   - Text jitter spec: frequency, amplitude ranges
   - Performance budgets: 30+ fps, <200ms motion toggle response

4. **Motion API Contract** (`contracts/motion-api.md`):
   - MotionController interface: enable/disable motion effects
   - Preference persistence: localStorage schema
   - Events: motion-enabled, motion-disabled
   - Integration with prefers-reduced-motion

5. **Quickstart Guide** (`quickstart.md`):
   - Local development setup (npm run dev)
   - Testing the visual effects manually
   - Tweaking color palette via CSS variables
   - Testing accessibility controls

---

*Phase 1 outputs will be written after Phase 0 research completes.*

---

# Phase 2: Implementation Tasks

**Note**: Task generation happens via `/speckit.tasks` command (not part of `/speckit.plan`).

Phase 2 will break down implementation into dependency-ordered tasks covering:

1. CSS theme foundation (colors, typography, base animations)
2. Central display box redesign (layout, opacity, backdrop blur)
3. Isobar background animation enhancements (drift, pulse, glitch)
4. Oscillating filter controller (8-12s cycles)
5. Area name display with fade and jitter
6. Motion toggle control (UI, persistence, wiring)
7. Accessibility integration (prefers-reduced-motion, keyboard navigation)
8. Manual browser testing and refinement

---

# Implementation Notes

## Key Architectural Decisions

1. **Pure CSS vs JavaScript for Oscillation**: Use CSS animations for hue-rotate/blur oscillation (GPU-accelerated, declarative) rather than JavaScript requestAnimationFrame. JS only needed for toggling motion on/off.

2. **Canvas vs CSS for Isobar Animation**: Keep existing Canvas 2D approach for isobar lines (allows programmatic drift/pulse/glitch effects). Enhance existing `BackgroundCanvas` class rather than rebuild.

3. **Motion State Management**: Create simple `MotionController` class to manage motion preference state, persist to localStorage, and dispatch events. Integrate with existing state/events system.

4. **Color Palette Enforcement**: Use CSS custom properties defined in `:root` and reference throughout stylesheets. This ensures 100% color consistency (SC-006 success criteria).

## Integration Points

- **Existing `BackgroundCanvas`**: Modify to support drift/pulse/glitch parameters while preserving core animation loop
- **Existing `app.js`**: Add initialization for theme system and motion controller
- **Existing event system**: Wire motion toggle events through `src/state/events.js`
- **Existing broadcast lifecycle**: Hook area name display updates to broadcast area change events

## Risk Mitigation

- **Browser Compatibility**: Fallback plan for backdrop-filter (solid semi-transparent background if unsupported)
- **Performance**: Monitor via browser DevTools during manual testing; reduce animation complexity if fps drops below 30
- **Motion Sickness**: Always-visible toggle ensures users can disable effects immediately if discomfort occurs
- **Accessibility**: Respect prefers-reduced-motion from OS/browser settings, plus manual override

## Success Validation

Manual browser testing checklist (aligns with spec success criteria):

- [ ] SC-001: User feedback reports 1970s maritime atmosphere within 10 seconds
- [ ] SC-002: 80%+ users recognize "haunted" dream-like quality
- [ ] SC-003: 95%+ users can click BEGIN TRANSMISSION button despite effects
- [ ] SC-004: Animations maintain 30+ fps (measured in Chrome DevTools)
- [ ] SC-005: Zero motion discomfort with prefers-reduced-motion enabled
- [ ] SC-006: No colors outside phosphor green/oceanic blue/parchment grey palette
- [ ] SC-007: 100% of users can read header and button text
- [ ] SC-008: Visual experience works on 360px to 4K viewports
- [ ] SC-009: First meaningful paint under 3 seconds (Network tab)
- [ ] SC-010: No JavaScript errors during 30-minute operation (Console)
