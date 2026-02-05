# INFINITE_SHIPPER Constitution

<!--
Sync Impact Report:
Version Change: 1.0.0 → 1.1.0
Modified Principles:
  - "No Automated Testing Required" → Added security testing exception for backend proxy
Added Sections:
  - Exception clause in Principle II for critical security components
Removed Sections: N/A
Templates Requiring Updates:
  - ✅ No template changes required (exception is principle-level guidance)
Follow-up TODOs:
  - Security tests for backend proxy should be implemented when proxy is built (feature 006)
  - API key exposure tests should verify zero credential leakage
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

**Exception**: Security-critical components MUST have automated tests:
- Backend proxy API key obfuscation (MUST verify zero credential exposure)
- Rate limiting enforcement (MUST verify abuse prevention)
- Origin validation (MUST verify unauthorized requests are rejected)

**Rationale**: For a personal creative project without multiple developers or production deployment constraints, automated testing creates maintenance burden without sufficient value. Manual testing provides immediate feedback and allows faster iteration. However, security vulnerabilities that could lead to financial loss or data exposure require automated verification that cannot be reliably performed manually.

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

## Development Philosophy

This project embraces rapid prototyping and creative experimentation. Code quality comes from clarity and simplicity rather than formal processes:

- **Simplicity First**: Prefer straightforward implementations over abstraction layers
- **Browser-Based Testing**: Use test HTML pages and browser console for validation
- **Iterative Refinement**: Improve through successive manual testing cycles
- **Documentation Through Code**: Code should be self-explanatory; add comments only where necessary
- **Security as Exception**: Security-critical paths warrant automated verification

## Governance

This constitution defines the development philosophy and quality standards for INFINITE_SHIPPER.

**Amendment Process**:
- Constitution can be amended at any time through the `/speckit.constitution` command
- All amendments must be documented with version bump and rationale
- Amendments are immediately effective upon commit

**Compliance**:
- All feature specifications and implementation plans should align with these principles
- Testing requirements in templates should reflect "No Automated Testing Required" principle
- Security-critical features (API proxies, authentication) MUST include automated security tests
- When AI assistants (Claude, etc.) suggest automated tests, remind them of this principle and the security exception

**Version Control**:
- MAJOR: Fundamental philosophy changes (e.g., reverting "No Testing" principle)
- MINOR: New principles or sections added
- PATCH: Clarifications, wording improvements, typos

**Version**: 1.1.0 | **Ratified**: 2026-02-02 | **Last Amended**: 2026-02-04
