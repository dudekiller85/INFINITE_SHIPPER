# Feature Specification: Haunted Maritime UI

**Feature Branch**: `004-haunted-maritime-ui`
**Created**: 2026-02-02
**Status**: Draft
**Input**: User description: "I want to specify the front end visual experience. This should replace other specifications related to the way that it looks.

Objective: Build a web-based frontend for "The Infinite Shipping Forecast." The UI must look like a formal maritime tool from the 1970s that has been "haunted" or distorted by a dream-like state.

Visual Aesthetic:

Color Palette: Sickly "phosphor" greens, deep oceanic blues, and faded parchment greys.

The "Woozy" Effect: Implement a background shader or CSS animation featuring shifting "Isobar" contour lines. These lines should slowly drift, pulse, and occasionally "glitch" or blur.

Motion: Use a global CSS filter that slowly oscillates hue-rotate (±15 degrees) and blur (0px to 2px) to create a subtle sense of motion sickness or "sea legs."

Typography: Use a high-authority Serif font (e.g., "Times New Roman" or "EB Garamond"). The current area name being read should appear in the center, slowly fading in and out, with a slight "jitter" or "drift" to the letters.

Layout: a box floating on top of the isobar effect. A large header reading "THE INFINITE SHIPPING FORECAST". A smaller button reading "BEGIN TRANSMISSION" that triggers the broadcast."

## Clarifications

### Session 2026-02-02

- Q: How should motion-sensitive users access the motion reduction toggle? → A: Always-visible accessibility control (small icon/button in corner)
- Q: What is the duration of one complete oscillation cycle for the global filters (hue-rotate and blur)? → A: Very slow: 8-12 seconds per complete cycle
- Q: What is the fade duration for area names appearing and disappearing during broadcast? → A: Moderate: 1-3 seconds fade in/out per area
- Q: What is the opacity/transparency treatment of the central display box? → A: Semi-transparent (50% opacity) with subtle backdrop blur
- Q: Which corner should the accessibility control (motion toggle) be positioned in? → A: Lower right corner

## User Scenarios & Testing

### User Story 1 - Initial Experience & Atmosphere (Priority: P1)

A user visits The Infinite Shipping Forecast website for the first time. They should immediately feel transported to a 1970s maritime control room that exists in a liminal, dream-like state. The visual presentation establishes the tone and draws them into the experience before any interaction occurs.

**Why this priority**: The atmospheric visual design is the core differentiator of this feature. Without the haunted maritime aesthetic, the experience loses its artistic and emotional impact. This is what separates this project from a standard shipping forecast display.

**Independent Test**: Can be fully tested by loading the webpage and observing whether the visual elements (color palette, animated isobars, typography, distortion effects) create the intended 1970s haunted maritime atmosphere. Success is measured by the presence and quality of all visual components working in concert.

**Acceptance Scenarios**:

1. **Given** a user opens the website in a modern browser, **When** the page loads, **Then** the background displays animated isobar contour lines in phosphor green/oceanic blue that slowly drift and pulse
2. **Given** the page has loaded, **When** the user observes for 10-30 seconds, **Then** they perceive subtle hue rotation (±15 degrees) and blur oscillation (0-2px) creating a "woozy" or "sea legs" sensation
3. **Given** the initial view, **When** observing the overall aesthetic, **Then** the color palette consists exclusively of sickly phosphor greens, deep oceanic blues, and faded parchment greys
4. **Given** the page is displayed, **When** examining the layout, **Then** a centered box floats above the isobar background containing the header and button

---

### User Story 2 - Initiating Broadcast Experience (Priority: P2)

A user wants to start listening to The Infinite Shipping Forecast. They should be able to trigger the broadcast through a clear, thematically-appropriate interaction that maintains the haunted maritime aesthetic.

**Why this priority**: This is the primary call-to-action that moves users from passive observation to active engagement. While essential for functionality, it depends on the atmospheric foundation established in P1.

**Independent Test**: Can be tested by locating and clicking the "BEGIN TRANSMISSION" button and verifying that the button's visual design matches the haunted maritime aesthetic and that the interaction is clear despite the distortion effects.

**Acceptance Scenarios**:

1. **Given** the page has loaded, **When** the user looks at the centered box, **Then** they see a large header reading "THE INFINITE SHIPPING FORECAST" in a high-authority serif font
2. **Given** the header is visible, **When** the user looks below it, **Then** they see a smaller button reading "BEGIN TRANSMISSION" in matching serif typography
3. **Given** the button is visible, **When** the user hovers over or focuses on the button, **Then** the button remains readable and clickable despite the atmospheric distortion effects
4. **Given** the button is clicked, **When** the broadcast begins, **Then** the visual experience continues to maintain the haunted maritime aesthetic throughout playback

---

### User Story 3 - Live Broadcast Visual Feedback (Priority: P3)

While the shipping forecast is being read aloud, a user should see the current area name displayed on screen with dynamic visual effects that reinforce the haunted, dream-like quality of the experience.

**Why this priority**: This enhances the broadcast experience by providing synchronized visual feedback, but the core atmospheric value is already delivered by P1 and P2. This adds polish and depth to the interaction.

**Independent Test**: Can be tested during an active broadcast by verifying that area names appear in the center of the screen with fade-in/fade-out transitions and subtle text jitter/drift effects synchronized to the audio playback.

**Acceptance Scenarios**:

1. **Given** the broadcast is playing and announcing a shipping area, **When** the area name is spoken, **Then** the area name appears in the center of the screen in serif typeface
2. **Given** an area name is displayed, **When** observing the text over several seconds, **Then** the text slowly fades in, remains visible, then fades out with smooth transitions
3. **Given** an area name is visible, **When** watching the text closely, **Then** individual letters exhibit subtle "jitter" or "drift" movements that enhance the dream-like quality
4. **Given** the broadcast transitions to a new area, **When** the new area is announced, **Then** the previous area name fades out and the new one fades in without jarring transitions

---

### Edge Cases

- What happens when the user's browser does not support CSS filters or animations? (Graceful degradation to static design with core visual palette maintained)
- How does the woozy effect behave on devices with reduced motion preferences enabled? (Respect prefers-reduced-motion media query, disable oscillating filters while keeping color palette and isobar design)
- What happens if the user leaves the page open for an extended period? (Animations continue indefinitely without performance degradation or memory leaks)
- How does the design adapt to very small mobile screens? (Box and typography scale appropriately while maintaining readability despite distortion effects)
- What happens if the isobar animation causes motion sickness in sensitive users? (Always-visible accessibility control icon/button in lower right corner allows users to reduce or disable motion effects while preserving static aesthetic)

## Requirements

### Functional Requirements

- **FR-001**: System MUST display a full-viewport background featuring animated isobar contour lines
- **FR-002**: Isobar lines MUST slowly drift, pulse, and occasionally exhibit glitch or blur effects
- **FR-003**: System MUST apply a color palette limited to sickly phosphor greens, deep oceanic blues, and faded parchment greys across all visual elements
- **FR-004**: System MUST apply global oscillating filters creating hue rotation of ±15 degrees and blur variation of 0px to 2px with a complete cycle duration of 8-12 seconds
- **FR-005**: Filter oscillation MUST create a subtle "woozy" or "sea legs" sensation without causing severe discomfort
- **FR-006**: System MUST display a centered box element that floats above the isobar background with 50% opacity and subtle backdrop blur effect
- **FR-007**: Centered box MUST contain a large header displaying "THE INFINITE SHIPPING FORECAST"
- **FR-008**: Typography MUST use a high-authority serif font throughout the interface
- **FR-009**: Centered box MUST contain a button labeled "BEGIN TRANSMISSION" positioned below the header
- **FR-010**: Button MUST remain legible and accessible despite atmospheric distortion effects
- **FR-011**: During broadcast playback, system MUST display the current shipping area name in the center of the viewport
- **FR-012**: Area names MUST fade in over 1-3 seconds when announced, remain visible during the forecast, then fade out over 1-3 seconds
- **FR-013**: Displayed area name text MUST exhibit subtle "jitter" or "drift" animation on individual letters
- **FR-014**: System MUST respect user's prefers-reduced-motion browser settings by disabling oscillating filters and motion-heavy animations
- **FR-015**: Visual design MUST maintain consistent aesthetic across different viewport sizes and device types
- **FR-016**: System MUST provide fallback visual experience for browsers that do not support modern CSS features
- **FR-017**: System MUST display an always-visible accessibility control (icon or button) positioned in the lower right corner of the viewport
- **FR-018**: Accessibility control MUST allow users to toggle motion effects (hue rotation, blur oscillation, isobar drift/pulse, text jitter) on or off
- **FR-019**: When motion is disabled via accessibility control, system MUST preserve static visual aesthetic (color palette, isobar lines, serif typography)

### Assumptions

- Users access the experience through modern web browsers (Chrome, Firefox, Safari, Edge) released within the last 2 years
- The target aesthetic prioritizes atmosphere and artistic expression over conventional usability guidelines
- Some level of intentional visual distortion and discomfort ("woozy" effect) is acceptable as it serves the artistic vision
- The serif font (Times New Roman or EB Garamond) is chosen for its authoritative, formal maritime document associations
- The 1970s aesthetic references include CRT phosphor displays and analog maritime instrumentation
- Animation performance targets standard desktop/laptop displays; mobile performance may vary

### Key Entities

- **Visual Theme**: Represents the complete aesthetic system including color palette, typography, animation parameters, and distortion effects. Core attributes include phosphor green/oceanic blue/parchment grey colors, serif font family, hue rotation range (±15°), blur range (0-2px), and oscillation cycle duration (8-12 seconds)
- **Isobar Layer**: Animated background element representing meteorological contour lines. Attributes include line paths, drift speed, pulse timing, glitch frequency, and blur intensity
- **Central Display Box**: Primary UI container floating above the background. Attributes include positioning, size, background treatment (50% opacity with backdrop blur), and color from palette
- **Area Name Display**: Dynamic text element showing the currently-announced shipping area. Attributes include fade timing (1-3 seconds in/out), jitter/drift animation parameters, font size, and positioning

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users report feeling immersed in a 1970s maritime atmosphere within 10 seconds of page load (measured via user testing feedback)
- **SC-002**: The "haunted" or "dream-like" quality is recognized by at least 80% of test users when asked to describe the experience
- **SC-003**: The "BEGIN TRANSMISSION" button remains clickable and identifiable by 95% of users despite atmospheric distortion effects
- **SC-004**: Animations run smoothly at 30+ fps on devices meeting minimum specifications (desktop/laptop with hardware acceleration)
- **SC-005**: Users with motion sensitivity preferences enabled experience zero motion discomfort (validated through reduced-motion mode testing)
- **SC-006**: Color palette consistency is maintained at 100% - no colors outside the phosphor green/oceanic blue/parchment grey range appear
- **SC-007**: Typography maintains readability such that header and button text can be read by 100% of users with normal vision
- **SC-008**: The visual experience functions correctly on viewports ranging from 360px to 4K displays
- **SC-009**: Page load to first meaningful paint (showing isobar animation and central box) occurs within 3 seconds on standard broadband connections
- **SC-010**: No JavaScript errors or performance warnings occur related to animation loops during 30-minute continuous operation
