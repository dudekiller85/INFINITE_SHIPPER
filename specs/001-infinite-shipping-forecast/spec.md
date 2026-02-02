# Feature Specification: The Infinite Shipping Forecast

**Feature Branch**: `001-infinite-shipping-forecast`  
**Created**: 31 January 2026  
**Status**: Draft  
**Input**: User description: "A generative web-based art piece that produces a continuous, never-ending audio stream mimicking the BBC Radio 4 Shipping Forecast. The tone is authoritative, rhythmic, and increasingly unsettling."

## Clarifications

### Session 2026-01-31

- Q: How should the system respond when required browser APIs are unavailable? → A: Display error message and prevent experience from loading entirely
- Q: Should audio continue playing when the tab is not visible? → A: Continue playing but after a period of time (eg 1 minute) start adding some unsettling messages, eg "where are you going? The sea waits for no man"
- Q: How should the system respond to multiple clicks on the "Begin Transmission" button? → A: Toggle behavior: first click starts, second click stops, third click restarts
- Q: How should the system sequence areas after all 31 standard areas have been broadcast? → A: Shuffle and repeat in a new random order each cycle
- Q: How should the system handle timing when preparing the next area report? → A: Pre-generate a buffer of 3-5 reports ahead of playback to ensure no gaps

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Experience Continuous Audio Transmission (Priority: P1)

As a visitor, I want to activate and listen to a continuous, procedurally-generated shipping forecast that plays indefinitely, so that I can experience the hypnotic and unsettling nature of the art piece.

**Why this priority**: This is the core experience - without the continuous audio generation and playback, the art piece doesn't exist. This represents the minimum viable product.

**Independent Test**: Can be fully tested by clicking the "Begin Transmission" button and verifying that audio plays continuously with generated weather reports. Delivers complete artistic experience in its simplest form.

**Acceptance Scenarios**:

1. **Given** the page has loaded, **When** I click "Begin Transmission", **Then** audio playback begins immediately with the first area report
2. **Given** audio is playing, **When** one area report completes, **Then** the next area report begins automatically after a 1-second pause
3. **Given** audio is playing, **When** I leave the tab active for 10 minutes, **Then** the forecast continues without interruption
4. **Given** the audio is playing, **When** I hear an area name, **Then** there is a 500ms pause before the weather details begin

---

### User Story 2 - See Visual Accompaniment (Priority: P2)

As a visitor, I want to see a distorted, shifting visual interface that responds to the audio, so that I can have a more immersive multi-sensory experience.

**Why this priority**: Visual elements enhance the unsettling atmosphere but the piece works without them. Can be developed after core audio is functional.

**Independent Test**: Can be tested by verifying background animations, blur effects, and color shifts occur while audio plays. Visual system can be demonstrated separately from audio generation logic.

**Acceptance Scenarios**:

1. **Given** audio is playing, **When** I observe the background, **Then** I see an isobar map pattern that gradually shifts
2. **Given** the page is active, **When** 10 seconds elapse, **Then** the blur filter oscillates from 0px to 3px
3. **Given** the page is active, **When** 60 seconds elapse, **Then** the hue-rotate animation completes one full 360-degree cycle
4. **Given** audio is playing, **When** I observe the bottom of the screen, **Then** I see a green oscilloscope line reacting to audio frequencies

---

### User Story 3 - Encounter Phantom Areas (Priority: P2)

As a visitor, I want to occasionally hear reports from fictional "phantom" sea areas with accompanying visual distortions, so that I can experience the increasingly unsettling progression of the piece.

**Why this priority**: Phantom areas are the key artistic differentiator but require the core generation system to work first. They add the "unsettling" dimension to an otherwise standard forecast.

**Independent Test**: Can be tested by triggering phantom area conditions and verifying both audio (slowed playback) and visual (increased blur) distortions occur. Can be isolated to test the glitch behavior separately.

**Acceptance Scenarios**:

1. **Given** area reports are being generated, **When** a phantom area is selected (2% chance), **Then** I hear an eerie area name like "The Void" or "Obsidian Deep"
2. **Given** a phantom area is being announced, **When** the area name is spoken, **Then** the voice playback rate drops by 10%
3. **Given** a phantom area is being announced, **When** the area name is spoken, **Then** the blur filter spikes to 10px momentarily
4. **Given** a phantom area report completes, **When** the next area begins, **Then** visual and audio effects return to normal

---

### User Story 4 - See Current Area Information (Priority: P3)

As a visitor, I want to see the name of the area currently being broadcast, so that I can follow along with the audio and understand which region is being reported.

**Why this priority**: Text overlay is a nice-to-have enhancement for clarity but not essential to the core experience. Can be added as final polish.

**Independent Test**: Can be tested independently by verifying text appears and updates with each new area. Visual component that doesn't affect audio generation.

**Acceptance Scenarios**:

1. **Given** audio is playing, **When** a new area report begins, **Then** the area name appears on screen in a faded serif font
2. **Given** an area name is displayed, **When** the next area report begins, **Then** the previous area name is replaced with the new one
3. **Given** audio is playing, **When** I observe the text overlay, **Then** only the current area name is visible (not weather details)

---

### Edge Cases

- When the user's browser doesn't support Web Speech API or Web Audio API, the system displays an error message and prevents the experience from loading entirely
- When the tab is backgrounded or minimized, audio continues playing; after 1 minute of being backgrounded, the system begins interspersing unsettling messages (e.g., "where are you going? The sea waits for no man") between area reports
- When the user clicks "Begin Transmission" multiple times, the button toggles: first click starts transmission, second click stops it, third click restarts it
- When all standard areas have been cycled through, the system shuffles and repeats them in a new random order each cycle
- To ensure smooth transitions, the system pre-generates a buffer of 3-5 area reports ahead of playback to prevent gaps or delays

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate weather reports using the template: "[Area Name]. [Wind Direction] [Behavior (Optional)], force [4-12]. [Sea State]. [Weather]. Visibility [Visibility Measurement]."
- **FR-002**: System MUST select from 31 standard BBC shipping forecast areas (Viking, North Utsire, South Utsire, Forties, Cromarty, Forth, Tyne, Dogger, Fisher, German Bight, Humber, Thames, Dover, Wight, Portland, Plymouth, Biscay, Trafalgar, FitzRoy, Sole, Lundy, Fastnet, Irish Sea, Shannon, Rockall, Malin, Hebrides, Bailey, Fair Isle, Faeroes, South-East Iceland)
- **FR-003**: System MUST have a 2% probability of selecting a phantom area instead of a standard area (The Void, Silence, Elder Bank, Mirror Reach, The Marrow, Still Water, Obsidian Deep)
- **FR-004**: System MUST use only metric measurements in forecasts (kilometers, meters, millibars, Beaufort force numbers)
- **FR-005**: System MUST never use imperial measurements (miles, knots) in generated reports
- **FR-006**: System MUST generate realistic wind directions (North, Northeast, East, Southeast, South, Southwest, West, Northwest, Cyclonic, Variable)
- **FR-007**: System MUST generate realistic wind behaviors (Veering, Backing, Becoming, Increasing, Decreasing)
- **FR-008**: System MUST generate realistic sea states (Smooth, Slight, Moderate, Rough, Very Rough, High, Very High, Phenomenal)
- **FR-009**: System MUST generate realistic weather conditions (Fair, Rain, Drizzle, Showers, Thundery showers, Snow, Fog, Freezing spray)
- **FR-010**: System MUST generate realistic visibility measurements (Good, Moderate, Poor, Very poor, Less than 1000 meters, 2 kilometers, 500 meters, Zero)
- **FR-011**: System MUST synthesize speech using a calm, neutral UK English voice (male or female)
- **FR-012**: System MUST insert a 500ms pause after each area name
- **FR-013**: System MUST insert a 1000ms pause between complete area reports
- **FR-014**: System MUST apply a bandpass filter (300Hz to 3000Hz) to create AM radio effect
- **FR-015**: System MUST add constant low-volume white noise (0.02 gain) as background static
- **FR-016**: System MUST display a single "Begin Transmission" button that initiates audio playback when clicked
- **FR-017**: System MUST NOT autoplay audio (must wait for user interaction to comply with browser policies)
- **FR-018**: System MUST continue generating and playing forecasts as long as the tab remains active
- **FR-019**: System MUST display the current area name in a faded serif font while that area is being broadcast
- **FR-020**: System MUST display an animated background showing an isobar-style map that slowly shifts
- **FR-021**: System MUST apply a hue-rotate animation from 0 to 360 degrees over 60 seconds continuously
- **FR-022**: System MUST apply a blur filter that oscillates between 0px and 3px every 10 seconds
- **FR-023**: System MUST display a green oscilloscope visualization at the bottom of the screen that reacts to audio frequencies
- **FR-024**: System MUST, when a phantom area is announced, spike the blur filter to 10px momentarily
- **FR-025**: System MUST, when a phantom area is announced, reduce voice playback rate by 10% for that report only
- **FR-026**: System MUST display a disclaimer footer stating: "Not for navigation. Procedural art piece."
- **FR-027**: System MUST detect browser support for Web Speech API and Web Audio API on page load
- **FR-028**: System MUST display a clear error message when required browser APIs are unavailable and prevent the experience from loading
- **FR-029**: System MUST continue audio playback when the browser tab loses focus or is backgrounded
- **FR-030**: System MUST track how long the tab has been backgrounded
- **FR-031**: System MUST, after the tab has been backgrounded for 1 minute, begin interspersing unsettling messages between area reports
- **FR-032**: System MUST include messages such as "where are you going? The sea waits for no man" in the pool of unsettling messages for backgrounded tabs
- **FR-033**: System MUST implement toggle behavior for the "Begin Transmission" button: first click starts, second click stops, subsequent clicks restart
- **FR-034**: System MUST update button label or visual state to indicate current transmission status (e.g., "Begin Transmission" vs "Stop Transmission")
- **FR-035**: System MUST shuffle the order of standard areas after all 31 have been broadcast
- **FR-036**: System MUST ensure each shuffle produces a new random sequence for the next cycle
- **FR-037**: System MUST maintain a buffer of 3-5 pre-generated area reports ahead of current playback
- **FR-038**: System MUST continuously generate new reports to maintain the buffer as reports are played

### Key Entities

- **Weather Report**: A single complete forecast statement for one sea area, containing: area name, wind details (direction, optional behavior, force), sea state, weather condition, and visibility measurement
- **Sea Area**: A named geographic region for which weather is reported; can be either a standard BBC area or a phantom area with 2% selection probability
- **Audio Filter Configuration**: Settings for the radio effect including bandpass frequency range (300-3000Hz) and white noise gain level (0.02)
- **Visual State**: Current animation parameters including blur intensity (0-3px normal, 10px for phantom), hue rotation angle (0-360deg), and oscilloscope frequency data
- **Generation Parameters**: Dictionary of valid values for each weather component (wind directions, behaviors, sea states, weather types, visibility ranges)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can initiate the experience with a single button click and hear audio begin within 2 seconds
- **SC-002**: System generates and plays continuous audio for at least 30 minutes without interruption or repetition of exact same reports
- **SC-003**: Phantom areas appear approximately 2% of the time (statistically validated over 100 area reports)
- **SC-004**: Each complete area report (including pauses) takes between 8-15 seconds to deliver
- **SC-005**: Visual distortions (blur spike and voice slowdown) are perceivable and synchronized when phantom areas are announced
- **SC-006**: Audio maintains clear speech intelligibility despite radio filtering effects (user testing confirms 95%+ word comprehension)
- **SC-007**: Page remains responsive and performant during continuous playback (no memory leaks, CPU usage stays below 30% on modern browsers)
- **SC-008**: All measurements in generated forecasts use metric units (0 instances of "miles" or "knots" in a 1-hour listening session)
- **SC-009**: Oscilloscope visualization responds to audio with less than 50ms latency

## Assumptions

- Users will access the art piece using modern web browsers (Chrome, Firefox, Safari, Edge) with Web Audio API and Web Speech API support
- Users have audio output capability (speakers or headphones)
- The experience is designed for desktop and tablet viewing (not optimized for mobile phones)
- Users understand this is an art piece and not functional maritime information
- A single user session is expected to last between 5-30 minutes on average
- The piece is intended for gallery exhibition, online portfolio, or art installation contexts
- Server-side generation is not required; all logic runs in the browser
- No user accounts, data persistence, or backend services are needed
- Standard web hosting is sufficient (static file hosting)
