# INFINITE_SHIPPER Constitution

<!--
Sync Impact Report:
Version Change: [TEMPLATE] → 1.0.0
Modified Principles: Initial constitution creation
Added Sections:
  - Core Principles (Personal Project Workflow, No Automated Testing Required)
  - Development Philosophy
  - Governance
Removed Sections: N/A (initial version)
Templates Requiring Updates:
  - ⚠ .specify/templates/plan-template.md - Remove mandatory test generation steps
  - ⚠ .specify/templates/tasks-template.md - Remove test task requirements
  - ⚠ .specify/templates/spec-template.md - Make testing optional in acceptance criteria
Follow-up TODOs: None
-->

## Core Principles

### I. Personal Project Workflow

This is a personal art/creative project developed solo. Development practices prioritize:
- Rapid iteration and experimentation
- Direct browser-based testing and validation
- Manual verification over test automation
- Artistic goals over engineering rigor

**Rationale**: Personal projects benefit from flexibility and directness. The overhead of maintaining test suites can slow creative iteration without proportional benefit in a solo context.

### II. No Automated Testing Required

Automated tests (unit tests, integration tests, E2E tests) are **NOT** required for this project. All quality validation is performed through:
- Manual browser testing
- Direct user interaction and feedback
- Console debugging and observation
- Test HTML pages for ad-hoc validation

**Rationale**: For a personal creative project without multiple developers or production deployment constraints, automated testing creates maintenance burden without sufficient value. Manual testing provides immediate feedback and allows faster iteration.

### III. Natural Speech Quality

Audio generation MUST sound natural and humanlike with proper BBC Radio 4 cadence. This is the non-negotiable quality standard:
- No robotic artifacts or perceivable gaps
- Consistent voice characteristics
- Authentic shipping forecast rhythm and timing
- Phantom area effects preserved

**Rationale**: This is an art piece focused on creating an authentic, immersive experience. Natural speech quality is the core value proposition and cannot be compromised.

### IV. Real-Time Generation

Weather reports MUST be generated in real-time using TTS synthesis rather than pre-recorded concatenated audio files.

**Rationale**: Pre-concatenated MP3s sound artificial and break immersion. Real-time synthesis with SSML allows dynamic prosody control for natural-sounding output.

##Development Philosophy

This project embraces rapid prototyping and creative experimentation. Code quality comes from clarity and simplicity rather than formal processes:

- **Simplicity First**: Prefer straightforward implementations over abstraction layers
- **Browser-Based Testing**: Use test HTML pages and browser console for validation
- **Iterative Refinement**: Improve through successive manual testing cycles
- **Documentation Through Code**: Code should be self-explanatory; add comments only where necessary

## Governance

This constitution defines the development philosophy and quality standards for INFINITE_SHIPPER.

**Amendment Process**:
- Constitution can be amended at any time through the `/speckit.constitution` command
- All amendments must be documented with version bump and rationale
- Amendments are immediately effective upon commit

**Compliance**:
- All feature specifications and implementation plans should align with these principles
- Testing requirements in templates should reflect "No Automated Testing Required" principle
- When AI assistants (Claude, etc.) suggest automated tests, remind them of this principle

**Version Control**:
- MAJOR: Fundamental philosophy changes (e.g., reverting "No Testing" principle)
- MINOR: New principles or sections added
- PATCH: Clarifications, wording improvements, typos

**Version**: 1.0.0 | **Ratified**: 2026-02-02 | **Last Amended**: 2026-02-02
