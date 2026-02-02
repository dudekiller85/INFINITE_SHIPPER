# Tasks: Haunted Maritime UI

**Input**: Design documents from `/specs/004-haunted-maritime-ui/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Per project constitution, automated testing is NOT required. This feature uses manual browser testing only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Web application structure:
- `public/` - Static files (HTML, CSS)
- `src/` - JavaScript source files
- `src/visuals/` - Visual component modules

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and configuration

- [X] T001 Verify Node.js 18+ and npm are installed
- [X] T002 [P] Create backup of current public/index.html and public/styles.css
- [X] T003 [P] Review contracts/theme-contract.css for CSS variable requirements

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core theme system and motion controller infrastructure - MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: No user story visual work can begin until this phase is complete

- [X] T004 Define CSS custom properties in public/styles.css per contracts/theme-contract.css (color palette: phosphor green, oceanic blue, parchment grey)
- [X] T005 [P] Define CSS animation timing variables in public/styles.css (oscillation-period: 10s, fade-duration: 2s, jitter-period: 0.8s)
- [X] T006 [P] Define CSS typography variables in public/styles.css (font-serif, font sizes, letter-spacing)
- [X] T007 [P] Define CSS layout variables in public/styles.css (box opacity, backdrop-blur, spacing)
- [X] T008 Add @media (prefers-reduced-motion) rule to public/styles.css with motion-reduced overrides
- [X] T009 Add body.motion-reduced CSS class overrides to public/styles.css (disable animations when toggled)
- [X] T010 Create src/visuals/motion-toggle.js with MotionController class per contracts/motion-api.md
- [X] T011 Implement MotionController.initialize() method in src/visuals/motion-toggle.js (load localStorage, check system preference)
- [X] T012 Implement MotionController.toggle() method in src/visuals/motion-toggle.js (save to localStorage, dispatch events)
- [X] T013 Implement MotionController._applyState() private method in src/visuals/motion-toggle.js (add/remove body.motion-reduced class)
- [X] T014 Add motion toggle button HTML to public/index.html (position: lower right corner, aria-label, id="motion-toggle")
- [X] T015 Add motion toggle button styles to public/styles.css (fixed position, circular button, themed colors)
- [X] T016 Initialize MotionController in src/app.js and wire button click event

**Checkpoint**: Foundation ready - theme system active, motion controller functional, user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Initial Experience & Atmosphere (Priority: P1) 🎯 MVP

**Goal**: Create the haunted 1970s maritime atmosphere with animated isobar background, color palette, oscillating filters, and semi-transparent central display box

**Independent Test**: Load webpage in browser. Verify phosphor green/oceanic blue/parchment grey colors present, isobar lines animating with drift/pulse, subtle hue-rotate and blur oscillation (8-12 second cycles), and semi-transparent box with backdrop blur floating in center.

### Implementation for User Story 1

- [X] T017 [P] [US1] Update body background color in public/styles.css to very dark oceanic blue (hsl(200, 50%, 10%))
- [X] T018 [P] [US1] Remove existing CSS from public/styles.css that conflicts with new theme (old colors, old animations)
- [X] T019 [US1] Add CSS @keyframes woozy-oscillate animation to public/styles.css (0%: hue-rotate(0deg) blur(0px), 50%: hue-rotate(15deg) blur(2px), 100%: back to 0)
- [X] T020 [US1] Apply woozy-oscillate animation to #background canvas in public/styles.css (duration: var(--oscillation-period), easing: ease-in-out, infinite loop)
- [X] T021 [US1] Add will-change: filter to #background canvas in public/styles.css for GPU optimization
- [X] T022 [US1] Update BackgroundCanvas isobar drawing in src/visuals/background.js to use phosphor green color (var(--color-phosphor-green-dim))
- [X] T023 [US1] Enhance BackgroundCanvas._drawIsobars() in src/visuals/background.js to implement drift effect (sinusoidal horizontal wave)
- [X] T024 [US1] Enhance BackgroundCanvas._drawIsobars() in src/visuals/background.js to implement pulse effect (secondary sinusoidal vertical wave)
- [X] T025 [US1] Add glitch effect to BackgroundCanvas._drawIsobars() in src/visuals/background.js (random displacement spikes, 0.001 probability)
- [X] T026 [US1] Increase isobar line count from 15 to 20 in src/visuals/background.js
- [X] T027 [US1] Add BackgroundCanvas.pause() and resume() methods in src/visuals/background.js for motion controller integration
- [X] T028 [US1] Wire BackgroundCanvas to motion-disabled/motion-enabled events in src/visuals/background.js
- [X] T029 [US1] Create .central-box container styles in public/styles.css (flexbox centered, semi-transparent background with 50% opacity)
- [X] T030 [US1] Add @supports (backdrop-filter) rule to .central-box in public/styles.css with 10px blur
- [X] T031 [US1] Add .central-box fallback styles in public/styles.css for browsers without backdrop-filter support
- [X] T032 [US1] Style .central-box with padding, border-radius, and gap per contracts in public/styles.css
- [X] T033 [P] [US1] Update HTML structure in public/index.html to wrap content in div.central-box
- [X] T034 [P] [US1] Verify body.motion-reduced disables woozy-oscillate animation in public/styles.css

**Checkpoint**: At this point, User Story 1 should be fully functional - atmospheric background with drift/pulse/glitch, oscillating filters, semi-transparent central box visible. Motion toggle should pause/resume animations.

---

## Phase 4: User Story 2 - Initiating Broadcast Experience (Priority: P2)

**Goal**: Style the header and button with haunted maritime aesthetic, ensuring readability despite atmospheric effects

**Independent Test**: After US1 complete, verify "THE INFINITE SHIPPING FORECAST" header displays in serif font with proper spacing, "BEGIN TRANSMISSION" button is styled with themed colors and remains readable/clickable despite distortion effects.

### Implementation for User Story 2

- [X] T035 [P] [US2] Update button text in public/index.html from "Begin Transmission" to "BEGIN TRANSMISSION"
- [X] T036 [P] [US2] Add h1.forecast-header element to public/index.html with text "THE INFINITE SHIPPING FORECAST"
- [X] T037 [US2] Style .forecast-header in public/styles.css (font: var(--font-serif), size: var(--font-size-header), color: var(--color-parchment-grey))
- [X] T038 [US2] Add .forecast-header letter-spacing and text-transform in public/styles.css (uppercase, wide spacing per contract)
- [X] T039 [US2] Update .transmission-button styles in public/styles.css to use theme color variables (border: parchment-grey, transparent background)
- [X] T040 [US2] Add .transmission-button hover state in public/styles.css (semi-transparent background, phosphor green border)
- [X] T041 [US2] Ensure .transmission-button font uses var(--font-serif) in public/styles.css
- [X] T042 [US2] Ensure .transmission-button remains in document flow within .central-box in public/index.html
- [X] T043 [US2] Verify .transmission-button remains clickable and readable despite woozy effects (manual test in browser)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - atmospheric background with styled header and button, all using haunted maritime theme.

---

## Phase 5: User Story 3 - Live Broadcast Visual Feedback (Priority: P3)

**Goal**: Display current shipping area name with fade-in/fade-out transitions and per-character jitter animation

**Independent Test**: After US1 and US2 complete, click "BEGIN TRANSMISSION", wait for area announcement. Verify area name appears in center with 1-3 second fade-in, text exhibits subtle jitter on individual letters, and fades out (1-3 seconds) when area changes.

### Implementation for User Story 3

- [X] T044 [P] [US3] Add CSS @keyframes text-jitter animation to public/styles.css (4-step keyframe with ±1-2px translate)
- [X] T045 [P] [US3] Add .area-name styles to public/styles.css (font: var(--font-serif), size: var(--font-size-area), color: parchment-grey)
- [X] T046 [US3] Add .area-name opacity transitions to public/styles.css (duration: var(--fade-duration), easing: ease-in-out)
- [X] T047 [US3] Add .area-name.visible class in public/styles.css (opacity: 1)
- [X] T048 [US3] Add .area-name span styles in public/styles.css (display: inline-block, animation: text-jitter)
- [X] T049 [US3] Add body.motion-reduced override for .area-name span animation in public/styles.css (animation: none)
- [X] T050 [US3] Create displayAreaName(areaName) function in src/app.js that wraps each character in span with random animation-delay
- [X] T051 [US3] Listen for broadcast area change events in src/app.js (from src/state/events.js or broadcast generator)
- [X] T052 [US3] Call displayAreaName() when area announced in src/app.js, add .visible class for fade-in
- [X] T053 [US3] Remove .visible class and clear text when area changes in src/app.js for fade-out
- [X] T054 [US3] Ensure fade timing uses var(--fade-duration) CSS variable (1-3 seconds per contracts)
- [X] T055 [US3] Test area name display with motion toggle - verify jitter disables when motion-reduced in browser

**Checkpoint**: All user stories should now be independently functional - complete atmospheric UI with interactive button and dynamic area name display.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, cross-browser testing, and performance validation

- [X] T056 [P] Test in Chrome 115+ and verify all animations, backdrop-filter, and colors work correctly
- [X] T057 [P] Test in Firefox 115+ and verify all features work (may need -moz- prefixes for some properties)
- [X] T058 [P] Test in Safari 16+ and verify backdrop-filter works (-webkit-backdrop-filter may be needed)
- [X] T059 [P] Test in Edge 115+ and verify feature parity with Chrome
- [X] T060 [P] Test on mobile viewport (360px width) and verify responsive scaling in DevTools
- [X] T061 [P] Test on 4K viewport (3840px width) and verify isobar animation maintains 30+ fps
- [X] T062 Open DevTools Performance tab and record 30-second animation session, verify 30+ fps average
- [X] T063 Check DevTools Layers panel to confirm #background canvas has GPU layer (will-change active)
- [X] T064 Run page for 30 minutes with DevTools Memory profiler, verify no memory leaks (stable heap size)
- [X] T065 Verify localStorage persistence - disable motion, reload page, confirm motion stays disabled
- [X] T066 Test system-level prefers-reduced-motion - enable in OS, reload page, verify motion disabled
- [X] T067 [P] Run grep to verify no hardcoded hex colors in public/styles.css (should only be in :root variables)
- [X] T068 [P] Run quickstart.md manual testing checklist to validate all success criteria
- [X] T069 Adjust isobar lineCount or sampling frequency if frame rate drops below 30 fps on any tested platform
- [X] T070 Add code comments to complex animation logic in src/visuals/background.js
- [X] T071 Update CLAUDE.md with any new conventions or patterns discovered during implementation
- [X] T072 Create manual testing notes documenting browser compatibility findings

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1) - Initial Atmosphere**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2) - Button Experience**: Can start after Foundational (Phase 2) - Visually builds on US1 but independently testable
- **User Story 3 (P3) - Area Name Display**: Can start after Foundational (Phase 2) - Requires broadcast events but independently testable

### Within Each User Story

- CSS foundations (colors, animations, variables) before component implementation
- Background/box visual updates before interactive elements
- Motion controller integration after core visuals work
- Style updates before HTML structure changes when possible
- Animation definitions before applying them to elements

### Parallel Opportunities

**Phase 1** (all can run in parallel):
- T002 (backup files)
- T003 (review contracts)

**Phase 2** (many can run in parallel):
- T005, T006, T007 (CSS variable definitions in different sections)
- After T004 complete, T010-T013 (MotionController class methods)

**User Story 1**:
- T017, T018 (CSS cleanup tasks)
- T022-T028 (BackgroundCanvas enhancements in different methods)
- T033, T034 (HTML and CSS verification)

**User Story 2**:
- T035, T036 (HTML updates)
- After HTML updates, T037-T042 (all CSS styling tasks for header and button)

**User Story 3**:
- T044, T045, T046-T049 (all CSS additions for area name)
- T050-T053 (JavaScript event handling can be written in parallel with CSS)

**Phase 6** (most can run in parallel):
- T056-T061 (browser/viewport testing in parallel)
- T067, T068 (validation checks)
- T070, T071, T072 (documentation tasks)

---

## Parallel Example: User Story 1 (Initial Atmosphere)

```bash
# These CSS tasks can all run in parallel:
Task T017: "Update body background color in public/styles.css"
Task T018: "Remove existing CSS conflicts in public/styles.css"

# These BackgroundCanvas enhancements can run in parallel:
Task T023: "Enhance BackgroundCanvas._drawIsobars() for drift effect"
Task T024: "Enhance BackgroundCanvas._drawIsobars() for pulse effect"
Task T025: "Add glitch effect to BackgroundCanvas._drawIsobars()"

# These HTML/CSS verification tasks can run in parallel:
Task T033: "Update HTML structure with div.central-box"
Task T034: "Verify motion-reduced disables animations"
```

---

## Parallel Example: Foundational Phase

```bash
# After T004 (base color palette defined), these can all run in parallel:
Task T005: "Define CSS animation timing variables"
Task T006: "Define CSS typography variables"
Task T007: "Define CSS layout variables"

# After CSS foundation complete, these MotionController methods can run in parallel:
Task T011: "Implement MotionController.initialize() method"
Task T012: "Implement MotionController.toggle() method"
Task T013: "Implement MotionController._applyState() method"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T016) - CRITICAL, blocks all stories
3. Complete Phase 3: User Story 1 (T017-T034)
4. **STOP and VALIDATE**: Manual browser test - verify atmospheric background with oscillating filters, semi-transparent box, motion toggle works
5. Demo/validate with stakeholders before proceeding

**Estimated MVP**: 34 tasks (Phases 1-3)

### Incremental Delivery

1. **Foundation**: Complete Setup + Foundational (T001-T016) → Theme system and motion controller ready
2. **MVP Release**: Add User Story 1 (T017-T034) → Test independently → Atmospheric background complete
3. **Increment 2**: Add User Story 2 (T035-T043) → Test independently → Header and button styled
4. **Increment 3**: Add User Story 3 (T044-T055) → Test independently → Area name display with animations
5. **Polish**: Phase 6 (T056-T072) → Cross-browser testing, performance validation

Each story adds value without breaking previous stories. Each can be deployed/demoed independently.

### Parallel Team Strategy

With multiple developers (or parallel AI agent execution):

1. **Together**: Team completes Setup + Foundational (Phases 1-2, T001-T016)
2. **Once Foundational is done**:
   - Developer A: User Story 1 (T017-T034) - Background and box atmosphere
   - Developer B: User Story 2 (T035-T043) - Header and button styling
   - Developer C: User Story 3 (T044-T055) - Area name display
3. Stories complete and integrate independently via shared theme system

---

## Task Count Summary

- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 13 tasks (CRITICAL - blocks all stories)
- **Phase 3 (User Story 1 - P1)**: 18 tasks 🎯 MVP
- **Phase 4 (User Story 2 - P2)**: 9 tasks
- **Phase 5 (User Story 3 - P3)**: 12 tasks
- **Phase 6 (Polish)**: 17 tasks

**Total**: 72 tasks

**Parallel Opportunities**: 31 tasks marked [P] can run in parallel with other tasks in their phase

**MVP Scope**: Phases 1-3 (34 tasks) delivers the core atmospheric experience

---

## Notes

- [P] tasks = different files or independent sections, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Per project constitution: NO automated tests required, manual browser testing only
- Commit after each task or logical group of related tasks
- Stop at any checkpoint to validate story independently via manual testing
- Verify motion toggle works after each user story phase
- Use browser DevTools for performance validation (30+ fps requirement)
- Reference contracts/ documents for specific CSS variable names and animation parameters
- Reference data-model.md for entity attributes and relationships
- Reference quickstart.md for manual testing procedures

---

## Manual Testing Checkpoints

After each user story phase, use browser DevTools to verify:

**After US1 (T034)**:
- [ ] Color palette: Only phosphor green, oceanic blue, parchment grey visible
- [ ] Isobar animation: Smooth drift, pulse, occasional glitch
- [ ] Oscillation: Hue-rotate and blur cycling over ~10 seconds
- [ ] Central box: 50% opacity with backdrop blur (or fallback)
- [ ] Motion toggle: Clicking disables all animations, persists on reload
- [ ] Frame rate: 30+ fps in DevTools Performance tab

**After US2 (T043)**:
- [ ] Header: "THE INFINITE SHIPPING FORECAST" in serif, uppercase, wide spacing
- [ ] Button: "BEGIN TRANSMISSION" themed, readable, clickable despite effects
- [ ] Typography: All text uses serif font from theme
- [ ] Hover state: Button responds to hover with themed colors

**After US3 (T055)**:
- [ ] Area name: Fades in 1-3 seconds when area announced
- [ ] Text jitter: Each letter has subtle independent animation
- [ ] Area change: Previous name fades out, new one fades in smoothly
- [ ] Motion toggle: Jitter disables when motion-reduced active

**After Phase 6 (T072)**:
- [ ] All browsers: Chrome, Firefox, Safari, Edge tested and working
- [ ] All viewports: 360px to 4K tested and responsive
- [ ] Performance: 30+ fps maintained, no memory leaks
- [ ] Accessibility: prefers-reduced-motion respected
- [ ] Persistence: Motion preference survives page reload
