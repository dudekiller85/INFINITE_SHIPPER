# Feature Specification: Natural Speech Generation for Shipping Forecast

**Feature Branch**: `002-natural-speech-generation`
**Created**: 1 February 2026
**Status**: Draft
**Input**: User description: "Putting combined mp3s together doesn't sound very convincing. I think we'll have to generate each report on the fly. Add a specification stating that each report must be convincingly natural and humanlike, with natural human cadence. Requirements include SSML generation with Radio 4 cadence, specific pause timings for each component, phantom area pitch distortion, and strict metric units."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Experience Natural Speech (Priority: P1)

As a listener, I want the shipping forecast audio to sound natural and humanlike with proper cadence, so that the experience feels authentic and immersive rather than robotic or artificially stitched together.

**Why this priority**: This is the core quality requirement that defines the entire feature. Without natural-sounding speech, the art piece loses its primary impact and fails to achieve the intended BBC Radio 4 authenticity.

**Independent Test**: Can be fully tested by listening to generated reports and comparing them against concatenated MP3s. Listeners should not be able to detect artificial joins or unnatural pacing. Delivers complete value as a standalone quality improvement.

**Acceptance Scenarios**:

1. **Given** a complete weather report, **When** the audio is generated and played, **Then** the speech flows naturally with consistent pacing and no audible gaps between words
2. **Given** a compound wind forecast like "Southwesterly 5 to 7", **When** the audio plays, **Then** the numbers and connectors are spoken with natural rhythm, not as separate chunks
3. **Given** a report with timing phrases like "later" or "at first", **When** the audio plays, **Then** the phrases integrate smoothly without pauses that sound artificial
4. **Given** multiple consecutive reports, **When** played in sequence, **Then** each report maintains consistent voice characteristics (pitch, tone, speed) while varying naturally within human range

---

### User Story 2 - Maintain Phantom Area Effects (Priority: P2)

As a listener, I want phantom area reports to still have their unsettling vocal effects (10% slowdown), so that the eerie atmosphere is preserved even with natural speech generation.

**Why this priority**: The phantom areas are a key artistic element that differentiates this from a standard forecast. However, this effect only matters if the base speech quality (P1) is good.

**Independent Test**: Can be tested by generating phantom vs. standard area reports and measuring playback rate difference. Effect should be perceivable but subtle. Can be demonstrated separately from other features.

**Acceptance Scenarios**:

1. **Given** a phantom area report is being generated, **When** the audio is synthesized, **Then** the entire report plays 10% slower than standard reports
2. **Given** a transition from standard to phantom area, **When** both reports play in sequence, **Then** the slowdown is noticeable but doesn't break immersion
3. **Given** a phantom area name like "The Void", **When** spoken, **Then** the vocal quality remains consistent with slower pacing throughout the entire report

---

### User Story 3 - Support Realistic BBC Variations (Priority: P2)

As a listener, I want the natural speech to handle compound forces, timing phrases, pressure conditions, and wave states smoothly, so that the realistic BBC elements enhance rather than detract from naturalness.

**Why this priority**: These elements add realism and variety but must integrate naturally into speech. They build on the core natural speech quality (P1).

**Independent Test**: Can be tested by generating reports with various combinations of realistic elements and verifying smooth delivery. Each element type can be tested independently.

**Acceptance Scenarios**:

1. **Given** a report with compound forces ("5 or 6"), **When** generated, **Then** the connector word "or" flows naturally between the numbers without artificial pauses
2. **Given** a report with multiple modifiers ("increasing later"), **When** generated, **Then** the phrase sounds like a natural human sentence, not word-by-word synthesis
3. **Given** a report with pressure conditions, **When** added to the end, **Then** it integrates as a natural continuation, not an afterthought
4. **Given** a report with wave conditions mid-sentence, **When** spoken, **Then** the interruption for additional detail sounds conversational, not mechanical

---

### User Story 4 - Experience BBC Radio 4 Rhythm (Priority: P1)

As a listener, I want the forecast to use the distinctive slow, deliberate pacing of BBC Radio 4 shipping forecasts with specific pause durations between components, so that the broadcast feels authentic and has the characteristic hypnotic rhythm.

**Why this priority**: The Radio 4 cadence is essential to the art piece's identity and authenticity. Without the specific rhythm and pacing, it would sound like generic weather reporting rather than the iconic shipping forecast format.

**Independent Test**: Can be tested by measuring pause durations and speaking rate against BBC Radio 4 recordings. Timing should match within acceptable tolerance ranges. Can be validated independently with audio analysis tools.

**Acceptance Scenarios**:

1. **Given** an area name is spoken, **When** measured with audio analysis, **Then** the pause after the name is 800ms (±50ms)
2. **Given** wind components are spoken, **When** measured, **Then** pauses between direction and force are consistent at 200ms and 600ms respectively
3. **Given** the overall speaking rate, **When** measured in words per minute, **Then** it is 85-90% of normal conversational speed
4. **Given** a complete report, **When** all pauses are totaled, **Then** the report takes 12-20 seconds to deliver (including pauses)

---

### Edge Cases

- When generating very long compound sentences (e.g., "Variable 4 or 5, becoming southwesterly, increasing later"), the system must maintain natural breath patterns and not sound rushed or monotone
- When switching between phantom and standard reports rapidly, voice consistency must be maintained despite the speed difference
- When generating the same report text multiple times, there should be slight natural variation to avoid exact repetition sounding robotic
- When internet connectivity is poor or API fails, the system must handle errors gracefully without dead air or broken audio
- When generating reports quickly in succession (buffer pre-generation), the system must not create perceptible delays or gaps in playback

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate complete weather report audio as single continuous speech synthesis, not concatenated segments
- **FR-002**: System MUST produce speech that sounds natural with humanlike cadence, including appropriate pauses, rhythm, and intonation
- **FR-003**: System MUST generate speech in real-time or near-real-time (within 2 seconds of report generation) to support continuous playback
- **FR-004**: System MUST support UK English male voice that matches BBC Radio 4 authenticity
- **FR-005**: System MUST handle compound wind forces ("5 or 6", "5 to 7") as naturally flowing sentences
- **FR-006**: System MUST integrate timing phrases ("later", "at first", "for a time") seamlessly into sentence structure
- **FR-007**: System MUST incorporate pressure conditions ("Pressure falling slowly") as natural sentence continuations
- **FR-008**: System MUST include wave/swell conditions ("Moderate swell") mid-sentence without awkward breaks
- **FR-009**: System MUST apply 10% speed reduction to phantom area reports while maintaining natural voice quality
- **FR-010**: System MUST maintain consistent voice characteristics (pitch, tone, accent) across all reports
- **FR-011**: System MUST generate appropriate prosody (stress, intonation patterns) for BBC-style weather broadcasts
- **FR-012**: System MUST include natural breathing points and pauses appropriate for sentence structure
- **FR-013**: System MUST avoid robotic artifacts such as word-by-word synthesis, unnatural joins, or mechanical pacing
- **FR-014**: System MUST use slow speaking rate at 85-90% of normal speed to match BBC Radio 4 cadence
- **FR-019**: System MUST apply strong emphasis to area names to mark them as headers
- **FR-020**: System MUST insert 800ms pause after area names are spoken
- **FR-021**: System MUST insert 200ms pause after wind direction is spoken
- **FR-022**: System MUST insert 600ms pause after wind force is spoken
- **FR-023**: System MUST insert 600ms pause after sea state is spoken
- **FR-024**: System MUST insert 600ms pause after weather condition is spoken
- **FR-025**: System MUST insert 1500ms pause at the end of each complete report
- **FR-026**: System MUST apply reduced emphasis to visibility values to create subtle vocal variation
- **FR-027**: System MUST apply pitch reduction of 10-15% to phantom area reports to create unsettling "sagging" vocal effect
- **FR-028**: System MUST use pitch contour for phantom areas that starts normal, drops mid-report, and partially recovers at end
- **FR-029**: System MUST express all distance measurements in kilometers or meters, never miles
- **FR-030**: System MUST automatically append "kilometers" or "meters" to numeric visibility values
- **FR-015**: System MUST support buffering of 3-5 pre-generated reports to ensure continuous playback without gaps
- **FR-016**: System MUST handle network failures or API errors gracefully without breaking the audio stream
- **FR-017**: System MUST generate speech that passes human listener tests as indistinguishable from recorded human speech in 80%+ of cases
- **FR-018**: System MUST support the same vocabulary and elements as current system (31 standard areas, 7 phantom areas, timing phrases, connectors, modifiers, pressure, waves)

### Key Entities

- **Generated Speech**: A single audio segment containing a complete weather report spoken as natural continuous speech with Radio 4 cadence (85-90% normal speed), including all sentence structure, prosody, and timing appropriate for BBC-style broadcasts
- **Synthesis Request**: A structured weather report object (area, wind details, sea state, weather, visibility, timing modifiers, pressure, waves) that will be converted to natural speech with proper markup
- **Voice Profile**: Configuration defining the UK English male voice characteristics (pitch, speed, tone, accent, speaking rate at 85-90%) used consistently across all generations
- **Prosody Rules**: Specific guidelines for Radio 4 rhythm including: strong emphasis on area names (800ms pause), reduced emphasis on visibility, 600ms pauses between components, and 10-15% pitch reduction with contour for phantom areas
- **Pause Timings**: Defined durations for each report component - area name (800ms), wind components (200ms direction, 600ms force), sea/weather (600ms each), report end (1500ms)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 80% or more of listeners cannot distinguish generated speech from recorded human speech in blind comparison tests
- **SC-002**: Generated speech contains no perceivable gaps, clicks, or artificial joins when transitioning between report elements
- **SC-003**: Complete weather reports are generated within 2 seconds of being requested, enabling seamless buffer pre-generation
- **SC-004**: Phantom area reports play 10% slower than standard reports, with the difference being perceivable but not jarring (verified through playback rate measurement)
- **SC-005**: Reports with compound elements (forces, timing, pressure) sound as natural as simple reports in listener evaluations
- **SC-006**: System maintains continuous audio playback for 30+ minutes without audible artifacts, delays, or quality degradation
- **SC-007**: Voice characteristics (pitch, tone, accent) remain consistent across 100+ consecutive report generations
- **SC-008**: Natural breathing patterns and sentence-appropriate pauses are present, as verified by speech analysis tools showing pause placement aligns with punctuation and phrase boundaries
- **SC-009**: Area name pauses measure 800ms (±50ms) as verified by audio timeline analysis
- **SC-010**: Component pauses (wind, sea, weather) measure 600ms (±50ms) between elements
- **SC-011**: End-of-report pauses measure 1500ms (±100ms) as verified by playback timing
- **SC-012**: Overall speaking rate is 85-90% of normal speed as measured by words per minute comparison
- **SC-013**: Phantom area pitch reduction is perceivable to listeners (verified in A/B tests showing 90%+ can identify phantom reports by vocal quality alone)
- **SC-014**: All distance measurements use metric units (0 instances of "miles" in 100 generated reports)

## Assumptions

- Text-to-speech services capable of generating natural humanlike speech with proper prosody are available (e.g., Google Cloud TTS Neural2 voices, Amazon Polly Neural voices, ElevenLabs, or similar)
- The service can generate UK English speech in real-time or near-real-time (under 2 seconds)
- Network connectivity is generally stable for API calls, though fallback strategies will be needed for failures
- The additional cost per report generation is acceptable for an art installation context (estimated $0.002-0.01 per report depending on service)
- SSML (Speech Synthesis Markup Language) is supported by the chosen TTS service with full prosody control including rate, emphasis, pitch, and break tags
- SSML timing precision allows control of pauses within ±50ms tolerance for component breaks (200ms, 600ms, 800ms, 1500ms)
- The service supports pitch modification at percentage levels (-10% to -15%) with contour control for phantom area effects
- Speaking rate can be controlled at percentage levels (85-90% of normal) for Radio 4 cadence
- The current structured report format (area, wind, sea, weather, visibility, modifiers) provides sufficient information for natural sentence generation with SSML markup
- Emphasis levels (strong, moderate, reduced) are supported and produce perceivable vocal differences
- Caching strategies can be used to reduce costs and improve reliability (e.g., caching SSML templates or entire generated audio)
- Users will perceive the quality improvement despite potentially higher latency than pre-recorded MP3s
- The TTS service accepts numeric values with unit suffixes and correctly pronounces metric units (kilometers, meters)
- SSML break durations are consistent across multiple synthesis requests for the same timing values
