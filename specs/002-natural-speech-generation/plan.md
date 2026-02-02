# Implementation Plan: Natural Speech Generation for Shipping Forecast

**Branch**: `002-natural-speech-generation` | **Date**: 2026-02-01 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from [/specs/002-natural-speech-generation/spec.md](spec.md)

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Replace the existing audio library concatenation approach with real-time SSML-based text-to-speech synthesis to achieve natural, humanlike speech quality. The current system generates pre-recorded MP3 files and stitches them together, resulting in unconvincing robotic audio with unnatural joins. The new approach will dynamically generate complete weather reports as single continuous speech synthesis using SSML markup to control prosody, ensuring BBC Radio 4 authenticity with specific cadence (85-90% speaking rate), precise pause timings (800ms after area names, 600ms between components), emphasis patterns, and phantom area pitch distortion (-10 to -15%).

## Technical Context

**Language/Version**: JavaScript ES6+ (browser-based, Node.js 18+ for tooling)  
**Primary Dependencies**:
- Google Cloud Text-to-Speech API (Neural2 voices) - PRIMARY OPTION
- Amazon Polly Neural voices - FALLBACK OPTION
- ElevenLabs API - EVALUATION OPTION
- Web Audio API (existing, for playback)

**Storage**: Browser-based (no server storage), audio caching in memory/IndexedDB for reliability  
**Testing**: Jest (unit tests), Playwright (integration tests, existing test framework)  
**Target Platform**: Modern web browsers (Chrome 90+, Safari 14+, Firefox 88+) with Web Audio API support  
**Project Type**: Single web application (existing structure at `/src`)  
**Performance Goals**:
- Generate complete report audio within 2 seconds (FR-003)
- Support 3-5 report buffer pre-generation for seamless playback (FR-015)
- Maintain continuous playback for 30+ minutes without gaps (SC-006)

**Constraints**:
- 80% listener indistinguishability from human speech (SC-001)
- Pause timing precision: ±50ms for component breaks, ±100ms for report ends
- Network dependency with graceful degradation (FR-016)
- Cost per report: $0.002-0.01 acceptable for art installation
- Must maintain existing 38 area support (31 standard + 7 phantom)

**Scale/Scope**:
- Single-user web application (art installation context)
- Continuous infinite playback (hours/days)
- ~20-40 reports per hour generation rate
- Support for all existing vocabulary (10 wind directions, 8 sea states, 8 weather types, etc.)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ **PASS** (Constitution file contains only template placeholders - no active principles to validate against)

The project constitution at `.specify/memory/constitution.md` contains only template content with no active principles defined. This feature proceeds without constitutional constraints.

**Note**: If project principles are added in the future (e.g., Library-First, Test-First, API Design Standards), this section should be re-evaluated.

## Project Structure

### Documentation (this feature)

\`\`\`text
specs/002-natural-speech-generation/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification (already exists)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── ssml-template.schema.json
│   ├── synthesis-request.schema.json
│   └── tts-service.interface.md
├── checklists/
│   └── requirements.md  # Specification validation (already exists)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
\`\`\`

### Source Code (repository root)

\`\`\`text
src/
├── core/
│   ├── areas.js          # Existing: 31 standard + 7 phantom areas
│   ├── generator.js      # Existing: Enhanced with realistic BBC elements
│   ├── vocabulary.js     # Existing: All weather vocabulary
│   └── buffer.js         # Existing: Report buffering logic
├── audio/
│   ├── synthesizer.js             # Existing: Web Speech API (to be replaced)
│   ├── library-synthesizer.js     # Existing: MP3 concatenation (current approach)
│   ├── audio-library.js           # Existing: Path mapping for MP3s
│   ├── ssml-synthesizer.js        # NEW: SSML-based real-time synthesis
│   ├── ssml-template-builder.js   # NEW: Constructs SSML from report objects
│   ├── tts-service-adapter.js     # NEW: Abstraction for TTS API calls
│   ├── prosody-config.js          # NEW: BBC Radio 4 timing/emphasis rules
│   ├── player.js          # Existing: Audio playback coordination (needs update)
│   └── filters.js         # Existing: Radio effects processing
├── state/
│   ├── session.js        # Existing: Session state management
│   └── events.js         # Existing: Event system
├── visuals/
│   ├── background.js     # Existing: Visual effects
│   ├── oscilloscope.js   # Existing: Audio visualization
│   └── effects.js        # Existing: Visual effects
├── utils/
│   ├── timing.js         # Existing: Timing utilities
│   └── browser-detect.js # Existing: Browser capability detection
└── app.js                # Existing: Main application entry point

tests/
├── unit/
│   ├── ssml-template-builder.test.js  # NEW: SSML generation unit tests
│   ├── prosody-config.test.js         # NEW: Timing/emphasis validation
│   └── tts-service-adapter.test.js    # NEW: API adapter tests
└── integration/
    ├── natural-speech-generation.test.js  # NEW: End-to-end synthesis tests
    └── timing-validation.test.js          # NEW: Pause duration verification

public/audio/                    # Existing: 229 MP3 files (may deprecate)
generate-audio-library.js        # Existing: Google Cloud TTS generation script
\`\`\`

**Structure Decision**: Single project structure retained. This is a web application with all source code in `/src`, organized by domain (core, audio, state, visuals, utils). The feature adds new audio synthesis modules while preserving existing architecture. The `/audio` directory will contain both legacy synthesizers (for fallback) and new SSML-based synthesis.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitutional violations - this section is not applicable (constitution contains only template placeholders).

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| TTS API costs exceed budget | High | Medium | Implement aggressive caching, set daily quota limits, evaluate cheaper alternatives |
| SSML timing precision insufficient | High | Low | Use post-synthesis silence padding, validate with audio analysis during Phase 0 |
| Network latency breaks playback | High | Medium | Pre-buffer 3-5 reports (FR-015), implement fallback to Web Speech API |
| Listener tests fail SC-001 (80% threshold) | Critical | Medium | Evaluate multiple TTS services in Phase 0, tune SSML prosody iteratively |
| CORS blocks TTS API calls | High | Low | Implement lightweight proxy server or use service-specific SDKs |
| Browser compatibility issues | Medium | Low | Progressive enhancement, feature detection, fallback to existing system |

## Next Steps

1. ✅ **Complete**: Phase 0 planning (this document)
2. ✅ **Complete**: Generate `research.md` with TTS service evaluation and technical decisions
3. ✅ **Complete**: Generate `data-model.md` with entity definitions
4. ✅ **Complete**: Generate API contracts in `contracts/`
5. ✅ **Complete**: Generate `quickstart.md` for developer onboarding
6. ✅ **Complete**: Update agent context files (CLAUDE.md)
7. ⏳ **Next**: Run `/speckit.tasks` to generate implementation task breakdown

**Blockers**: None - ready to proceed with implementation tasks.

## Planning Phase Complete

**Status**: ✅ All design artifacts generated

**Artifacts Created**:
- [research.md](research.md) - TTS service evaluation, SSML approach, caching strategy
- [data-model.md](data-model.md) - Entity definitions, relationships, state transitions
- [contracts/tts-service.interface.md](contracts/tts-service.interface.md) - TTS service interface contract
- [contracts/ssml-template.schema.json](contracts/ssml-template.schema.json) - SSML template JSON schema
- [contracts/synthesis-request.schema.json](contracts/synthesis-request.schema.json) - API request/response schemas
- [quickstart.md](quickstart.md) - Developer onboarding guide with code examples
- [CLAUDE.md](/Users/petemyall/INFINITE_SHIPPER/CLAUDE.md) - Updated agent context

**Key Decisions**:
1. **TTS Service**: Google Cloud TTS Neural2 (`en-GB-Neural2-B`) - already integrated, excellent quality
2. **SSML Approach**: Full prosody control with dynamic pitch contour for phantom areas
3. **Caching**: In-memory LRU cache (max 50 entries) for cost optimization
4. **Fallback**: Revert to existing MP3 concatenation system on failure
5. **Audio Format**: MP3 at 48kbps, 24000Hz, mono (optimal for speech)
6. **No Proxy Needed**: Direct Google Cloud API calls with API key restrictions

**Ready for Implementation**: All technical unknowns resolved, contracts defined, developer guide complete.
