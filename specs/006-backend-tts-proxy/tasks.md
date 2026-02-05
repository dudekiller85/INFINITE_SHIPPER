# Tasks: Backend TTS API Proxy

**Input**: Design documents from `/specs/006-backend-tts-proxy/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Security tests are REQUIRED by Constitution v1.1.0, Principle II exception.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`, `backend/tests/security/`
- **Frontend**: `src/audio/` (existing structure)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and Cloudflare Workers structure

- [ ] T001 Create backend directory structure (backend/src/, backend/tests/security/)
- [ ] T002 Initialize backend package.json with wrangler dependency
- [ ] T003 [P] Install Wrangler CLI globally (npm install -g wrangler)
- [ ] T004 [P] Authenticate with Cloudflare (wrangler login)
- [ ] T005 Create wrangler.toml configuration file in backend/
- [ ] T006 Create KV namespace for rate limiting (wrangler kv:namespace create RATE_LIMIT_KV)
- [ ] T007 Update wrangler.toml with KV namespace ID from T006
- [ ] T008 Store Google Cloud TTS API key as secret (wrangler secret put GOOGLE_TTS_API_KEY)
- [ ] T009 [P] Configure ALLOWED_ORIGINS environment variable in wrangler.toml

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T010 Create error handler module in backend/src/error-handler.js
- [ ] T011 Implement error response formatter with status codes (429, 403, 400, 500)
- [ ] T012 Create logging utility for request tracking in backend/src/error-handler.js
- [ ] T013 [P] Create test HTML page template for manual testing in backend/test-proxy.html

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Secure Audio Generation Without API Exposure (Priority: P1) 🎯 MVP

**Goal**: Implement basic proxy functionality that securely routes TTS requests without exposing API key

**Independent Test**: Open browser DevTools during audio generation and verify that no API keys are visible in Network requests, JavaScript source code, or browser storage. Audio synthesis succeeds through proxy.

### Security Tests for User Story 1 (REQUIRED by Constitution) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T014 [P] [US1] Create API key exposure test in backend/tests/security/api-key-exposure.test.js
- [ ] T015 [P] [US1] Implement test: verify Worker source contains no API key
- [ ] T016 [P] [US1] Implement test: verify response headers contain no API key
- [ ] T017 [P] [US1] Implement test: verify error messages contain no API key
- [ ] T018 [P] [US1] Create test runner script in backend/package.json

### Implementation for User Story 1

- [ ] T019 [US1] Create main Worker entry point in backend/src/index.js
- [ ] T020 [US1] Implement CORS preflight handler (OPTIONS method) in backend/src/index.js
- [ ] T021 [US1] Create TTS proxy module in backend/src/tts-proxy.js
- [ ] T022 [US1] Implement request payload validation in backend/src/tts-proxy.js
- [ ] T023 [US1] Implement Google Cloud TTS API call with env.GOOGLE_TTS_API_KEY in backend/src/tts-proxy.js
- [ ] T024 [US1] Implement response forwarding with CORS headers in backend/src/tts-proxy.js
- [ ] T025 [US1] Add error handling for TTS API failures using error-handler in backend/src/tts-proxy.js
- [ ] T026 [US1] Wire tts-proxy module into main Worker in backend/src/index.js
- [ ] T027 [US1] Test locally with wrangler dev
- [ ] T028 [US1] Run security tests to verify API key is not exposed (T014-T017 must pass)
- [ ] T029 [US1] Update frontend TTS adapter in src/audio/tts-service-adapter.js
- [ ] T030 [US1] Replace Google Cloud TTS endpoint with proxy URL in src/audio/tts-service-adapter.js
- [ ] T031 [US1] Remove API key import from frontend in src/audio/tts-service-adapter.js
- [ ] T032 [US1] Test end-to-end: Frontend → Proxy → Google TTS → Frontend
- [ ] T033 [US1] Verify audio playback works identically to direct API calls

**Checkpoint**: At this point, User Story 1 should be fully functional - secure TTS synthesis through proxy with zero API key exposure

---

## Phase 4: User Story 2 - Rate Limiting and Abuse Prevention (Priority: P2)

**Goal**: Implement IP-based rate limiting (30 requests/minute) to prevent cost overruns from abuse

**Independent Test**: Make 31 rapid requests to the proxy and verify that requests 1-30 succeed, request 31 returns 429 with retryAfter, and after 60 seconds requests succeed again.

### Security Tests for User Story 2 (REQUIRED by Constitution) ⚠️

- [ ] T034 [P] [US2] Create rate limiting test in backend/tests/security/rate-limiting.test.js
- [ ] T035 [P] [US2] Implement test: send 30 requests, verify all succeed
- [ ] T036 [P] [US2] Implement test: send 31st request, verify 429 returned
- [ ] T037 [P] [US2] Implement test: verify retryAfter header present in 429 response
- [ ] T038 [P] [US2] Implement test: wait 60 seconds, verify requests succeed again
- [ ] T039 [P] [US2] Implement test: multiple IPs don't interfere with each other

### Implementation for User Story 2

- [ ] T040 [US2] Create rate limiter module in backend/src/rate-limiter.js
- [ ] T041 [US2] Implement IP extraction from CF-Connecting-IP header in backend/src/rate-limiter.js
- [ ] T042 [US2] Implement rate limit key generation (ratelimit:{ip}:{minute}) in backend/src/rate-limiter.js
- [ ] T043 [US2] Implement KV counter read logic in backend/src/rate-limiter.js
- [ ] T044 [US2] Implement rate limit check (count >= 30) in backend/src/rate-limiter.js
- [ ] T045 [US2] Implement counter increment with 60-second TTL in backend/src/rate-limiter.js
- [ ] T046 [US2] Implement retryAfter calculation (seconds until next minute) in backend/src/rate-limiter.js
- [ ] T047 [US2] Format 429 error response with retryAfter using error-handler in backend/src/rate-limiter.js
- [ ] T048 [US2] Wire rate limiter into main Worker before proxy logic in backend/src/index.js
- [ ] T049 [US2] Test locally: verify 31st request returns 429
- [ ] T050 [US2] Run security tests (T034-T039 must pass)
- [ ] T051 [US2] Test end-to-end: verify frontend receives 429 and handles gracefully

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - secure TTS + rate limiting

---

## Phase 5: User Story 3 - Request Authentication and Origin Validation (Priority: P3)

**Goal**: Implement origin validation to ensure only authorized domains can access the proxy

**Independent Test**: Make requests from allowed origin (succeeds), unauthorized origin (403), no origin (403), and verify CORS preflight works for allowed origins.

### Security Tests for User Story 3 (REQUIRED by Constitution) ⚠️

- [ ] T052 [P] [US3] Create origin validation test in backend/tests/security/origin-validation.test.js
- [ ] T053 [P] [US3] Implement test: request from allowed origin succeeds
- [ ] T054 [P] [US3] Implement test: request from unauthorized origin returns 403
- [ ] T055 [P] [US3] Implement test: request with no origin header returns 403
- [ ] T056 [P] [US3] Implement test: request with spoofed origin returns 403
- [ ] T057 [P] [US3] Implement test: OPTIONS preflight from allowed origin returns 200 with CORS headers

### Implementation for User Story 3

- [ ] T058 [US3] Create origin validator module in backend/src/origin-validator.js
- [ ] T059 [US3] Implement origin extraction from Origin/Referer headers in backend/src/origin-validator.js
- [ ] T060 [US3] Implement ALLOWED_ORIGINS parsing from env var in backend/src/origin-validator.js
- [ ] T061 [US3] Implement exact origin matching against allow list in backend/src/origin-validator.js
- [ ] T062 [US3] Format 403 error response for invalid origins using error-handler in backend/src/origin-validator.js
- [ ] T063 [US3] Update CORS preflight to validate origin before responding in backend/src/index.js
- [ ] T064 [US3] Wire origin validator into main Worker after rate limiter, before proxy in backend/src/index.js
- [ ] T065 [US3] Update CORS response headers to use validated origin (not *) in backend/src/index.js
- [ ] T066 [US3] Test locally with different Origin headers
- [ ] T067 [US3] Run security tests (T052-T057 must pass)
- [ ] T068 [US3] Configure allowed origins for localhost, GitHub Pages, and production domains in wrangler.toml
- [ ] T069 [US3] Test end-to-end: verify only frontend from allowed origin can synthesize

**Checkpoint**: All user stories should now be independently functional - secure proxy + rate limiting + origin validation

---

## Phase 6: Deployment & Validation

**Purpose**: Deploy to production and validate all security requirements

- [ ] T070 Run all security tests locally (T014-T069 security tests must all pass)
- [ ] T071 Deploy Worker to Cloudflare (wrangler deploy)
- [ ] T072 Record Worker URL from deployment output
- [ ] T073 Update frontend with production Worker URL in src/audio/tts-service-adapter.js
- [ ] T074 Deploy frontend to GitHub Pages with updated proxy URL
- [ ] T075 Test production: Open deployed site in browser with DevTools
- [ ] T076 Verify: No API key visible in Network tab or source code
- [ ] T077 Verify: TTS synthesis works through proxy
- [ ] T078 Verify: 31st rapid request returns 429
- [ ] T079 Verify: Request from different domain returns 403
- [ ] T080 [P] Document Worker URL in quickstart.md
- [ ] T081 [P] Update README with deployment instructions

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T082 [P] Add request logging for monitoring in backend/src/index.js
- [ ] T083 [P] Log: IP, origin, timestamp, success/failure, latency
- [ ] T084 [P] Ensure logs never contain API keys or full SSML content
- [ ] T085 [P] Add performance tracking (measure proxy overhead) in backend/src/index.js
- [ ] T086 Optimize: Minimize KV reads/writes in hot path
- [ ] T087 [P] Add health check endpoint (GET /) in backend/src/index.js
- [ ] T088 [P] Document troubleshooting steps in quickstart.md
- [ ] T089 Code cleanup: Remove test HTML pages and debug logging
- [ ] T090 Security audit: Review all code for potential API key leakage
- [ ] T091 Validate: Run security tests one final time (all must pass)
- [ ] T092 Create deployment checklist based on quickstart.md Security Checklist section
- [ ] T093 [P] Update CLAUDE.md with backend proxy context (if needed)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001-T009) - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion (T010-T013)
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P2): Can start after Foundational - Builds on US1 proxy but independently testable
  - User Story 3 (P3): Can start after Foundational - Builds on US1 proxy but independently testable
- **Deployment (Phase 6)**: Depends on desired user stories being complete (minimum: US1)
- **Polish (Phase 7)**: Depends on deployment and validation

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
  - Delivers: Basic secure proxy functionality
  - Independent: Fully testable without US2 or US3

- **User Story 2 (P2)**: Can start after Foundational (Phase 2) OR after US1 completion
  - Depends on: US1 proxy infrastructure (backend/src/index.js, backend/src/tts-proxy.js)
  - Delivers: Rate limiting on top of secure proxy
  - Independent: Can test rate limiting without origin validation (US3)

- **User Story 3 (P3)**: Can start after Foundational (Phase 2) OR after US1 completion
  - Depends on: US1 proxy infrastructure (backend/src/index.js)
  - Delivers: Origin validation on top of secure proxy
  - Independent: Can test origin validation without rate limiting (US2)

### Within Each User Story

- Security tests MUST be written and FAIL before implementation
- Tests marked [P] can run in parallel (T014-T018 in US1, T034-T039 in US2, T052-T057 in US3)
- Implementation tasks within a story must follow order (e.g., T019 before T026)
- Security tests must pass before moving to next story

### Parallel Opportunities

- **Setup Phase**: T003, T004, T009 can run in parallel
- **Foundational Phase**: T013 can run in parallel with T010-T012
- **User Story 1 Tests**: T014-T018 all run in parallel (write tests concurrently)
- **User Story 2 Tests**: T034-T039 all run in parallel
- **User Story 3 Tests**: T052-T057 all run in parallel
- **Deployment Phase**: T080-T081 can run in parallel
- **Polish Phase**: T082-T084, T087, T088, T093 can run in parallel

**Cross-Story Parallelism**:
- Once Foundational (Phase 2) complete, ALL three user stories CAN start in parallel if desired
- However, for solo developer: Recommended to complete US1 → US2 → US3 sequentially for simplicity

---

## Parallel Example: User Story 1 Security Tests

```bash
# Launch all security tests for User Story 1 together:
Task: "Create API key exposure test in backend/tests/security/api-key-exposure.test.js"
Task: "Implement test: verify Worker source contains no API key"
Task: "Implement test: verify response headers contain no API key"
Task: "Implement test: verify error messages contain no API key"
Task: "Create test runner script in backend/package.json"
```

---

## Parallel Example: User Story 2 Security Tests

```bash
# Launch all rate limiting tests together:
Task: "Create rate limiting test in backend/tests/security/rate-limiting.test.js"
Task: "Implement test: send 30 requests, verify all succeed"
Task: "Implement test: send 31st request, verify 429 returned"
Task: "Implement test: verify retryAfter header present"
Task: "Implement test: wait 60 seconds, verify requests succeed again"
Task: "Implement test: multiple IPs don't interfere with each other"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only) - RECOMMENDED

1. Complete Phase 1: Setup (T001-T009)
2. Complete Phase 2: Foundational (T010-T013) - CRITICAL
3. Complete Phase 3: User Story 1 (T014-T033)
   - Write security tests FIRST (T014-T018), ensure they FAIL
   - Implement proxy (T019-T027)
   - Run tests (T028), ensure they PASS
   - Update frontend (T029-T033)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Open DevTools, verify no API key visible
   - Test audio synthesis works
   - Deploy if ready
5. MVP is now complete: Secure TTS proxy without API exposure

### Incremental Delivery (Full Feature)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (T014-T033) → Test independently → Deploy (MVP)
3. Add User Story 2 (T034-T051) → Test independently → Deploy (MVP + Rate Limiting)
4. Add User Story 3 (T052-T069) → Test independently → Deploy (Full Security)
5. Complete Deployment & Validation (T070-T081)
6. Polish (T082-T093) → Final deployment

### Parallel Team Strategy (If Multiple Developers)

With 3 developers:

1. Team completes Setup + Foundational together (T001-T013)
2. Once Foundational is done:
   - Developer A: User Story 1 (T014-T033) - secure proxy
   - Developer B: User Story 2 (T034-T051) - rate limiting (needs US1 basics)
   - Developer C: User Story 3 (T052-T069) - origin validation (needs US1 basics)
3. Integration: Merge US2 and US3 into US1 proxy
4. Validate all three stories work together

**Note for solo developer**: Complete US1 → US2 → US3 sequentially for simplicity. This avoids merge conflicts and allows testing each increment.

---

## Notes

- **[P] tasks**: Different files, no dependencies - can run in parallel
- **[Story] label**: Maps task to specific user story (US1, US2, US3) for traceability
- **Security tests REQUIRED**: Per Constitution v1.1.0, Principle II exception
- Each user story should be independently completable and testable
- **Security tests must FAIL before implementation, then PASS after**
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Verify: API key never exposed (US1), rate limiting works (US2), origin validation works (US3)
- Cloudflare Workers free tier (100k req/day) covers project needs

## Task Count Summary

- **Total Tasks**: 93
- **Phase 1 (Setup)**: 9 tasks
- **Phase 2 (Foundational)**: 4 tasks
- **Phase 3 (User Story 1)**: 20 tasks (5 tests + 15 implementation)
- **Phase 4 (User Story 2)**: 18 tasks (6 tests + 12 implementation)
- **Phase 5 (User Story 3)**: 18 tasks (6 tests + 12 implementation)
- **Phase 6 (Deployment)**: 12 tasks
- **Phase 7 (Polish)**: 12 tasks
- **Parallel opportunities**: 28 tasks marked [P]
- **MVP scope** (US1 only): 33 tasks (T001-T033)

## Independent Test Criteria

- **User Story 1**: No API key visible in DevTools Network/Source + Audio synthesis succeeds through proxy
- **User Story 2**: 31st request returns 429 + retryAfter header + after 60s requests succeed
- **User Story 3**: Allowed origin succeeds + Unauthorized origin returns 403 + No origin returns 403
