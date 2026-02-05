# Feature Specification: Backend TTS API Proxy

**Feature Branch**: `006-backend-tts-proxy`
**Created**: 2026-02-04
**Status**: Draft
**Input**: User description: "Backend proxy to secure TTS API key. API key must not be publicly available but must be fetched through a backend proxy, as a critical security matter."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure Audio Generation Without API Exposure (Priority: P1)

As a website visitor, I want to generate TTS audio for shipping forecasts without my session exposing the API credentials to the public internet, so that the service remains secure and cost-controlled.

**Why this priority**: This is the core security requirement. Without proper API key protection, malicious actors can steal and abuse the key, leading to unlimited costs and potential service disruption. This is a critical security vulnerability that must be addressed before public deployment.

**Independent Test**: Can be fully tested by opening browser DevTools during audio generation and verifying that no API keys are visible in Network requests, JavaScript source code, or browser storage. Success delivers secure audio generation with zero credential exposure.

**Acceptance Scenarios**:

1. **Given** the website is loaded in a browser, **When** a user inspects the page source and JavaScript files, **Then** no API keys or credentials are visible in the client-side code
2. **Given** a user initiates audio generation, **When** monitoring network traffic in DevTools, **Then** all TTS API calls are routed through the backend proxy with no API keys visible in request URLs or headers
3. **Given** the backend proxy is operational, **When** the frontend requests TTS synthesis, **Then** the audio is returned successfully without exposing any credentials
4. **Given** a malicious user attempts to reverse-engineer the API flow, **When** they examine all client-side code and network requests, **Then** they cannot extract or access the TTS API key

---

### User Story 2 - Rate Limiting and Abuse Prevention (Priority: P2)

As a service operator, I want to control and limit the number of TTS requests that can be made, so that malicious actors cannot abuse the service even if they discover the proxy endpoint.

**Why this priority**: While hiding the API key is critical (P1), rate limiting provides defense-in-depth. Even with a secure proxy, public endpoints need usage controls to prevent denial-of-service attacks and cost overruns.

**Independent Test**: Can be tested by making repeated rapid requests to the proxy and verifying that requests are throttled after exceeding the defined limit. Delivers cost protection independent of the core proxy functionality.

**Acceptance Scenarios**:

1. **Given** a user has made requests within acceptable limits, **When** they submit a new TTS request, **Then** the request is processed successfully
2. **Given** a user exceeds the rate limit threshold, **When** they attempt another request, **Then** they receive a rate limit error with a retry-after indication
3. **Given** multiple users are accessing the service, **When** one user exceeds their rate limit, **Then** other users remain unaffected
4. **Given** the rate limit period expires, **When** a previously rate-limited user makes a new request, **Then** their request is processed successfully

---

### User Story 3 - Request Authentication and Origin Validation (Priority: P3)

As a service operator, I want to ensure that only requests from my legitimate website can access the TTS proxy, so that third parties cannot abuse my backend endpoint even if they discover the URL.

**Why this priority**: This adds an additional security layer beyond rate limiting. While not as critical as hiding the API key (P1) or preventing abuse (P2), origin validation prevents other websites from freeloading on the proxy service.

**Independent Test**: Can be tested by making requests from different origins (legitimate domain vs. external domains) and verifying that only legitimate origins succeed. Delivers origin-based access control independent of other features.

**Acceptance Scenarios**:

1. **Given** a request originates from the legitimate website domain, **When** the proxy receives the request, **Then** the request is processed
2. **Given** a request originates from an unauthorized domain, **When** the proxy receives the request, **Then** the request is rejected with an authorization error
3. **Given** a request has no origin header or a spoofed origin, **When** the proxy validates the request, **Then** the request is rejected
4. **Given** the website is deployed to multiple environments (dev, staging, prod), **When** configured allowed origins include all environments, **Then** requests from any configured environment succeed

---

### Edge Cases

- What happens when the backend proxy is unavailable or returns an error?
- How does the system handle network timeouts between frontend and proxy?
- What occurs when the proxy successfully authenticates but the Google TTS API returns an error?
- How does the system respond when the TTS API key becomes invalid or quota is exceeded?
- What happens when a user makes multiple simultaneous requests?
- How does the system handle requests with malformed or invalid SSML content?
- What occurs when the proxy endpoint URL changes or is temporarily moved?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST route all TTS API requests through a backend proxy service that holds the API credentials
- **FR-002**: System MUST ensure that the TTS API key is never exposed to client-side code, network requests, or browser storage
- **FR-003**: Backend proxy MUST validate incoming requests before forwarding them to the Google Cloud TTS API
- **FR-004**: Frontend MUST call the backend proxy endpoint instead of calling the TTS API directly
- **FR-005**: Backend proxy MUST accept SSML content and voice configuration from frontend requests
- **FR-006**: Backend proxy MUST return synthesized audio data to the frontend in a format compatible with Web Audio API
- **FR-007**: System MUST implement rate limiting to prevent abuse, limiting requests to 30 requests per minute per IP address
- **FR-008**: Backend proxy MUST validate request origin to ensure requests come from authorized domains only
- **FR-009**: System MUST log all TTS requests for monitoring, debugging, and cost tracking purposes
- **FR-010**: Backend proxy MUST handle TTS API errors gracefully and return appropriate error messages to the frontend
- **FR-011**: System MUST store the API key in a secure environment variable or secret management system on the backend
- **FR-012**: Backend proxy MUST return appropriate HTTP status codes for different error scenarios (rate limit, unauthorized origin, API errors, etc.)
- **FR-013**: System MUST allow configuration of allowed origins for development, staging, and production environments
- **FR-014**: Frontend MUST update existing TTS service adapter to use the proxy endpoint instead of direct API calls

### Key Entities

- **Backend Proxy Service**: The server-side application that intermediates between the frontend and Google Cloud TTS API. Responsible for credential management, request validation, rate limiting, and origin checking.
- **TTS Request**: A request from the frontend containing SSML content, voice configuration, and audio settings. Validated and forwarded by the proxy.
- **Proxy Response**: The response from the backend proxy containing either synthesized audio data or error information.
- **Rate Limit State**: Tracking information for rate limiting decisions, including request counts, timestamps, and user/IP identification.
- **Allowed Origins Configuration**: List of authorized domain origins that can access the proxy service.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: No API keys or credentials are visible in any client-side code, network requests, or browser storage when inspected
- **SC-002**: All TTS synthesis requests complete successfully through the proxy with audio quality identical to direct API calls
- **SC-003**: Requests exceeding the rate limit are rejected with appropriate error codes within 100ms
- **SC-004**: Unauthorized origin requests are rejected with 403 status code within 100ms
- **SC-005**: Proxy service handles 100 concurrent requests without errors or timeouts
- **SC-006**: Average request latency through proxy is within 200ms of direct API call latency (accounting for proxy overhead)
- **SC-007**: Service operator can identify and track TTS usage from proxy logs without manual intervention
- **SC-008**: Zero successful API key extraction attempts during security testing and code review

## Scope & Boundaries *(mandatory)*

### In Scope

- Backend proxy service implementation for TTS API requests
- Frontend modifications to route TTS requests through proxy
- Rate limiting implementation on proxy
- Origin validation and request authentication
- Error handling for proxy failures and API errors
- Secure credential management and storage
- Request/response logging for monitoring

### Out of Scope

- Migration of existing pre-generated audio files (those remain unchanged)
- User authentication or individual user accounts (rate limiting by IP only)
- Caching of TTS responses (can be added later as optimization)
- Multiple TTS provider support (Google Cloud TTS only)
- Administrative dashboard for monitoring (logs only)
- Automatic API key rotation
- Geographic load balancing or CDN integration

## Assumptions *(mandatory)*

- The backend proxy will be deployed on a platform supporting server-side applications with environment variable storage (e.g., Vercel, Netlify, Cloudflare Workers, AWS Lambda)
- The existing Google Cloud TTS API key has appropriate rate limits and billing alerts configured at the Google Cloud level
- The frontend application already has working TTS synthesis code that needs modification to use the proxy
- Standard HTTPS is sufficient for transport security between frontend and proxy
- Rate limiting will be IP-based initially (no user authentication required)
- The backend deployment platform supports CORS configuration for origin validation
- Production domain URL is known and can be configured as an allowed origin

## Dependencies *(include if applicable)*

- Backend hosting platform must support serverless functions or persistent backend services
- Backend platform must support secure environment variable storage for API keys
- Google Cloud TTS API quota and billing must remain active
- Frontend application must be able to make HTTPS requests to the proxy endpoint
- Proxy endpoint URL must be communicated to frontend during build/deployment process

## Constraints *(include if applicable)*

- Backend proxy must be deployed before the frontend can be published publicly
- Rate limiting configuration must balance legitimate use against abuse prevention
- Proxy latency overhead should not significantly impact user experience
- Allowed origins configuration must include all legitimate deployment environments without exposing the proxy to abuse
- Cost constraints require preventing unlimited API usage through the proxy
