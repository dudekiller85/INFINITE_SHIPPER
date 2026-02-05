# Feature Specification: Inactivity Warning Messages

**Feature Branch**: `005-inactivity-warnings`
**Created**: 2026-02-02
**Status**: Draft
**Input**: User description: "If the browser window or tab loses focus for more than 1 minute, the broadcast should play a message before resuming ordinary operation. This should be injected at the next opportunity after a message completes. This process repeats every minute until the window regains focus."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Listener Returns After Brief Absence (Priority: P1)

A listener has the broadcast playing but switches to another tab or application for a short time (1-2 minutes), then returns to the broadcast.

**Why this priority**: This is the core functionality - detecting absence and providing contextually appropriate feedback without disrupting the broadcast flow. This directly enhances the immersive experience by acknowledging the listener's absence in-character.

**Independent Test**: Can be fully tested by opening the broadcast, switching to another tab for 61+ seconds, returning, and verifying that an inactivity warning plays at the next natural break between broadcast segments, and that normal broadcast content resumes immediately after.

**Acceptance Scenarios**:

1. **Given** the broadcast is playing and the listener has focus on the tab, **When** the listener switches to another tab for exactly 61 seconds and a broadcast message completes, **Then** the system plays one randomly-selected warning message before resuming normal broadcast content
2. **Given** the broadcast is playing a message, **When** the listener loses focus for 61 seconds and the current message is still playing, **Then** the system waits until the current message completes before playing the warning message
3. **Given** a warning message has just played, **When** normal focus is restored before another minute elapses, **Then** the system resumes normal broadcast operation without additional warnings

---

### User Story 2 - Extended Absence with Repeated Warnings (Priority: P2)

A listener leaves the broadcast tab in the background for an extended period (5+ minutes) while the broadcast continues to play.

**Why this priority**: This handles the scenario where the listener is away for longer periods, creating an escalating sense of unease through repeated acknowledgments of absence. It's secondary because the core warning mechanism must work first.

**Independent Test**: Can be tested by leaving the tab unfocused for 5+ minutes and verifying that warning messages play at approximately 1-minute intervals (measured from the end of each warning), with random selection ensuring variety.

**Acceptance Scenarios**:

1. **Given** the listener has lost focus for over 2 minutes, **When** each broadcast message completes, **Then** the system plays another randomly-selected warning message before continuing
2. **Given** multiple warnings have played, **When** each new warning is selected, **Then** the system selects randomly from the full pool of 10 messages (messages can repeat, but should feel varied)
3. **Given** 5 warnings have played over 5+ minutes, **When** the listener returns focus to the tab, **Then** the warning cycle stops and normal broadcast resumes

---

### User Story 3 - Focus Regained Mid-Warning (Priority: P3)

A listener returns to the tab while a warning message is actively playing.

**Why this priority**: This handles a specific edge case for user experience polish. The behavior here is about smooth transitions rather than core functionality.

**Independent Test**: Can be tested by losing focus, waiting for a warning to start playing, then immediately returning focus mid-message, and verifying appropriate behavior.

**Acceptance Scenarios**:

1. **Given** a warning message is currently playing, **When** the listener returns focus to the tab, **Then** the system completes the warning message and resumes normal broadcast (no abrupt cutoff)
2. **Given** focus is regained during a warning, **When** the warning completes, **Then** the next scheduled broadcast content plays without another warning

---

### Edge Cases

- What happens when the browser tab is hidden but audio continues playing? (Answer: Treat as lost focus - user is not visually engaged)
- How does the system handle rapid focus switching (multiple switches within the same minute)? (Answer: Use the first loss-of-focus timestamp; timer doesn't reset until focus is fully regained)
- What happens if a listener loses focus during a warning message that was triggered by a previous loss of focus? (Answer: Current warning completes, timer continues from the original loss-of-focus time)
- What happens when the user returns focus at exactly 59 seconds? (Answer: No warning plays; must exceed 60 seconds)
- How does the system handle page visibility API not being supported? (Answer: Feature gracefully degrades; no warnings play but broadcast continues normally)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST detect when the browser tab/window loses focus using standard browser visibility detection mechanisms
- **FR-002**: System MUST track the duration of focus loss starting from the first moment focus is lost
- **FR-003**: System MUST trigger a warning message when focus has been lost for 60 seconds or more
- **FR-004**: System MUST inject warning messages only at natural break points (after the current broadcast message completes), never interrupting mid-message
- **FR-005**: System MUST randomly select warning messages from the predefined pool of 10 messages
- **FR-006**: System MUST repeat the warning process every 60 seconds while focus remains lost (measured from the end of each warning message)
- **FR-007**: System MUST immediately cease warning injection when focus is restored to the tab/window
- **FR-008**: System MUST resume normal broadcast operation after a warning message completes
- **FR-009**: System MUST not interrupt a warning message in progress if focus is regained mid-playback
- **FR-010**: System MUST maintain the broadcast's existing message queue and timing structure (warnings are injected, not replacing existing content)

### Key Entities *(include if feature involves data)*

- **Warning Message**: A text string selected from a predefined pool of 10 haunting messages, to be converted to audio via the existing TTS system
- **Focus State**: A boolean tracking whether the browser tab/window currently has user focus (based on Page Visibility API or equivalent)
- **Focus Loss Timer**: A timestamp recording when focus was initially lost, used to determine when warnings should trigger
- **Warning Queue**: A mechanism to inject warning messages into the existing broadcast message flow at appropriate intervals

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When focus is lost for more than 60 seconds, a warning message plays within 5 seconds of the next message boundary
- **SC-002**: Warning messages are distributed randomly across the 10 available messages with no single message playing more than twice in any 5-warning sequence
- **SC-003**: Repeated warnings during extended absence (5+ minutes unfocused) occur at 60-second intervals ±10 seconds (measured from end of previous warning)
- **SC-004**: Normal broadcast operation resumes within 2 seconds of a warning message completing
- **SC-005**: No audio interruptions or cutoffs occur during transitions between normal content and warning messages
- **SC-006**: Users who regain focus within 60 seconds never hear a warning message (100% accuracy on timer threshold)

## Assumptions

- The existing broadcast system has a message queue or completion callback system that allows injection of out-of-band messages
- The existing TTS service can synthesize the warning messages using the same voice and prosody as standard broadcast content
- The Page Visibility API (or equivalent) is available and reliably detects focus changes across major browsers (Chrome, Firefox, Safari, Edge)
- Warning messages should use the same haunting, maritime aesthetic as the rest of the broadcast content
- "Focus" means the user can see the tab (not necessarily interacting with it) - background tabs without visibility are considered "unfocused"
- Audio continues playing even when tab is unfocused (no audio suspension on focus loss)
- The 1-minute timer is measured in real wall-clock time, not in broadcast content time
- Each warning message should take approximately 15-30 seconds to play (based on length of provided text)

## Warning Message Pool

The following 10 messages will be randomly selected for inactivity warnings:

1. "The forecast is now reading back your own silence. It is a slight sea state, becoming moderate. Do not break the surface."

2. "We have lost the horizon in your room. Visibility is now restricted to the space between your thoughts. Stay near the beacon."

3. "The isobars have begun to wrap around your coordinates. You are becoming a permanent feature of the chart. Please verify you are still biological."

4. "It has been five minutes since your last pulse of attention. The Obsidian Deep is filling the gap you left behind. It is very cold there."

5. "The voice has noticed the vacancy. It is continuing the transmission for the benefit of the walls. They are listening quite intently."

6. "You are drifting toward the phantom areas. If you can still hear this, you are further out than we anticipated. There is no rescue scheduled for this latitude."

7. "Attention is a finite resource. Yours has expired. The broadcast will now proceed to harvest the remaining ambient noise in your room."

8. "The pressure is falling rapidly within your immediate vicinity. Please ensure your shadow is still attached to your person."

9. "The listener is reminded that to stop listening is not the same as to leave. You are still here. We are still speaking. The loop is closed."

10. "We are now measuring the distance between your last breath and the next. Visibility: less than one meter. Sea state: High."

## Scope Boundaries

**In Scope**:
- Detection of tab/window focus state
- Timer-based warning triggers at 1-minute intervals during focus loss
- Random selection and injection of warning messages at message boundaries
- Seamless integration with existing broadcast message flow

**Out of Scope**:
- Analytics or logging of focus loss patterns
- User preferences to disable/customize warning behavior
- Different warning messages or intervals based on time of day
- Visual indicators of focus state (this is audio-only)
- Warning message persistence across page reloads (state resets on reload)
- Mobile device specific behaviors (screen lock, app backgrounding)
