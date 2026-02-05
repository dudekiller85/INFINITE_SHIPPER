# Data Model: Backend TTS Proxy

**Feature**: 006-backend-tts-proxy
**Date**: 2026-02-04

## Overview

This document defines the data entities, structures, and relationships for the backend TTS proxy service. The proxy intermediates between the frontend and Google Cloud TTS API, managing request validation, rate limiting state, and secure credential handling.

## Entities

### 1. TTSRequest (Frontend → Proxy)

Request payload sent from the frontend to the proxy endpoint.

**Structure**:
```typescript
interface TTSRequest {
  input: {
    ssml: string;  // SSML-formatted text-to-speech content
  };
  voice: {
    languageCode: string;  // e.g., "en-GB"
    name: string;          // e.g., "en-GB-Neural2-D"
  };
  audioConfig: {
    audioEncoding: string;  // e.g., "MP3"
    sampleRateHertz: number; // e.g., 24000
  };
}
```

**Fields**:
- `input.ssml` (required): SSML markup containing the text to synthesize
  - Format: Valid SSML wrapped in `<speak>` tags
  - Validation: Must be non-empty string
  - Example: `"<speak>Southerly <break time=\"200ms\"/> 5 or 6.</speak>"`

- `voice.languageCode` (required): BCP-47 language code
  - Format: Language-region code
  - Example: `"en-GB"`, `"en-US"`
  - Default: `"en-GB"` (used by INFINITE_SHIPPER)

- `voice.name` (required): Google Cloud TTS voice identifier
  - Format: `{languageCode}-{type}-{variant}`
  - Example: `"en-GB-Neural2-D"`
  - Default: `"en-GB-Neural2-D"` (male BBC-style voice)

- `audioConfig.audioEncoding` (required): Output audio format
  - Allowed values: `"MP3"`, `"LINEAR16"`, `"OGG_OPUS"`
  - Default: `"MP3"` (browser-compatible)

- `audioConfig.sampleRateHertz` (required): Audio sample rate
  - Format: Integer Hz value
  - Example: `24000`, `48000`
  - Default: `24000` (standard quality for speech)

**Validation Rules**:
- `input.ssml` must not be empty
- `voice.languageCode` must match `voice.name` prefix
- `audioConfig.sampleRateHertz` must be valid for chosen encoding

**Example**:
```json
{
  "input": {
    "ssml": "<speak>Dover. <break time=\"200ms\"/> Southerly 5 or 6.</speak>"
  },
  "voice": {
    "languageCode": "en-GB",
    "name": "en-GB-Neural2-D"
  },
  "audioConfig": {
    "audioEncoding": "MP3",
    "sampleRateHertz": 24000
  }
}
```

---

### 2. TTSResponse (Proxy → Frontend)

Response payload returned from the proxy to the frontend.

**Success Structure**:
```typescript
interface TTSSuccessResponse {
  audioContent: string;  // Base64-encoded audio data
  timepoints?: Array<{   // Optional timing markers
    markName: string;
    timeSeconds: number;
  }>;
  audioConfig: {
    audioEncoding: string;
    sampleRateHertz: number;
  };
}
```

**Error Structure**:
```typescript
interface TTSErrorResponse {
  error: string;         // Human-readable error message
  code?: number;         // HTTP status code
  retryAfter?: number;   // Seconds until retry allowed (rate limit only)
  details?: string;      // Additional error context
}
```

**Success Fields**:
- `audioContent` (required): Base64-encoded synthesized audio
  - Format: Base64 string
  - Decoding: Use `atob()` in browser to get binary data
  - Usage: Convert to Blob, then AudioBuffer for playback

- `timepoints` (optional): SSML timing markers
  - Currently unused by INFINITE_SHIPPER
  - Included for future enhancements

- `audioConfig` (required): Echo of request audio configuration
  - Used to verify response matches request

**Error Fields**:
- `error` (required): Error description
  - Examples: `"Rate limit exceeded"`, `"Forbidden: Invalid origin"`

- `code` (optional): HTTP status code for context
  - Redundant with HTTP response code but useful for logging

- `retryAfter` (required for 429): Seconds until rate limit resets
  - Format: Integer seconds
  - Example: `42` means retry in 42 seconds

- `details` (optional): Additional error information
  - Includes upstream TTS API errors
  - Never includes API keys or sensitive data

**Example Success**:
```json
{
  "audioContent": "//NExAAQYAIIAAhEuElFV...(truncated)",
  "audioConfig": {
    "audioEncoding": "MP3",
    "sampleRateHertz": 24000
  }
}
```

**Example Error (Rate Limit)**:
```json
{
  "error": "Rate limit exceeded",
  "code": 429,
  "retryAfter": 42
}
```

**Example Error (Invalid Origin)**:
```json
{
  "error": "Forbidden: Invalid origin",
  "code": 403
}
```

---

### 3. RateLimitState (Workers KV Store)

Ephemeral state tracking request counts for rate limiting.

**Storage**: Cloudflare Workers KV (distributed key-value store)

**Structure**:
```typescript
interface RateLimitState {
  key: string;    // "ratelimit:{ip}:{minute}"
  value: string;  // String representation of count
  ttl: number;    // Time-to-live in seconds (60)
}
```

**Key Format**: `ratelimit:{ip}:{minute}`
- `{ip}`: Client IP address from `CF-Connecting-IP` header
- `{minute}`: Unix timestamp truncated to minute granularity
- Example: `ratelimit:203.0.113.42:28977340`

**Value**: String integer representing request count
- Format: `"1"`, `"2"`, ..., `"30"`
- Type: String (KV stores values as strings)
- Conversion: `parseInt(value)` to use in comparisons

**TTL**: 60 seconds (auto-expires after 1 minute)
- Ensures automatic cleanup
- No manual deletion required
- Key becomes inaccessible after expiration

**State Transitions**:
1. **Initial**: Key does not exist → count = 0
2. **Increment**: Each request increments count by 1
3. **Limit Reached**: count ≥ 30 → reject new requests
4. **Expiry**: After 60 seconds → key deleted, count resets

**Example Entry**:
- Key: `"ratelimit:203.0.113.42:28977340"`
- Value: `"15"`
- TTL: `60` seconds
- Interpretation: IP `203.0.113.42` has made 15 requests in minute `28977340`

---

### 4. ProxyConfig (Environment Variables)

Configuration values for the proxy Worker, stored as environment variables and secrets.

**Structure**:
```typescript
interface ProxyConfig {
  GOOGLE_TTS_API_KEY: string;     // Secret
  ALLOWED_ORIGINS: string;        // Env var
  RATE_LIMIT_THRESHOLD?: number;  // Env var (optional)
  RATE_LIMIT_KV: KVNamespace;     // KV binding
}
```

**Fields**:

- `GOOGLE_TTS_API_KEY` (required, secret):
  - Type: Cloudflare Worker Secret
  - Storage: Encrypted in Cloudflare Secrets
  - Access: `env.GOOGLE_TTS_API_KEY` in Worker
  - Setup: `wrangler secret put GOOGLE_TTS_API_KEY`
  - Security: Never logged, never returned in responses

- `ALLOWED_ORIGINS` (required, env var):
  - Type: String (comma-separated list)
  - Format: `"origin1,origin2,origin3"`
  - Example: `"http://localhost:3000,https://petemyall.github.io"`
  - Setup: Set in `wrangler.toml` under `[vars]`
  - Usage: Split by comma, trim whitespace, validate exact match

- `RATE_LIMIT_THRESHOLD` (optional, env var):
  - Type: Number (integer)
  - Default: `30` (requests per minute per IP)
  - Setup: Set in `wrangler.toml` under `[vars]`
  - Usage: Allow override for testing or adjustment

- `RATE_LIMIT_KV` (required, KV binding):
  - Type: Workers KV namespace binding
  - Setup: Create namespace with `wrangler kv:namespace create RATE_LIMIT_KV`
  - Configuration: Bind in `wrangler.toml` under `[[kv_namespaces]]`
  - Access: `env.RATE_LIMIT_KV` provides KV API (`get`, `put`, `delete`)

**Example Configuration (`wrangler.toml`)**:
```toml
name = "tts-proxy"
main = "src/index.js"
compatibility_date = "2024-01-01"

[vars]
ALLOWED_ORIGINS = "http://localhost:3000,https://petemyall.github.io/INFINITE_SHIPPER"
RATE_LIMIT_THRESHOLD = "30"

[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "abc123def456"  # Created by wrangler kv:namespace create
```

---

## Relationships

```
┌─────────────┐
│  Frontend   │
│  (Browser)  │
└──────┬──────┘
       │ POST TTSRequest
       ↓
┌─────────────────────────┐
│   Cloudflare Worker     │
│  (Proxy Service)        │
│                         │
│  Uses:                  │
│  - ProxyConfig (env)    │
│  - RateLimitState (KV)  │
└──────┬──────────────────┘
       │ Forwarded TTSRequest
       ↓        (+ API key header)
┌─────────────────────┐
│ Google Cloud TTS API│
└──────┬──────────────┘
       │ TTS Audio Response
       ↓
┌─────────────────────────┐
│   Cloudflare Worker     │
│  (Formats & validates)  │
└──────┬──────────────────┘
       │ TTSResponse
       ↓
┌─────────────┐
│  Frontend   │
│  (Decodes   │
│   & plays)  │
└─────────────┘
```

## Data Flow

### 1. Request Validation Phase
- Frontend sends TTSRequest with Origin header
- Worker extracts IP from `CF-Connecting-IP`
- Worker validates origin against `ALLOWED_ORIGINS`
- Worker checks `RateLimitState` in KV for IP
- If valid and not rate-limited → proceed
- If invalid origin → 403 error response
- If rate-limited → 429 error response with retryAfter

### 2. Proxy Phase
- Worker adds Authorization header with `GOOGLE_TTS_API_KEY`
- Worker forwards TTSRequest to Google Cloud TTS API
- Worker receives response with base64 audio
- Worker increments `RateLimitState` counter in KV

### 3. Response Phase
- Worker formats TTSResponse with audio or error
- Worker adds CORS headers for allowed origin
- Worker returns response to frontend
- Frontend decodes base64, creates AudioBuffer, plays audio

## State Management

**Stateless Components**:
- Cloudflare Worker (no persistent state between requests)
- Request/response transformation (pure functions)

**Stateful Components**:
- `RateLimitState`: Stored in Workers KV, ephemeral (60-second TTL)
- `ProxyConfig`: Stored in environment, read-only at runtime

**No Database**: This feature does not require a traditional database. All state is ephemeral and managed via Workers KV for rate limiting only.

## Security Considerations

**Sensitive Data**:
- `GOOGLE_TTS_API_KEY`: Never logged, never exposed in responses
- IP addresses: Logged for rate limiting, not shared externally
- SSML content: Not logged (may contain sensitive user data)

**Validation**:
- All TTSRequest fields validated before forwarding
- Origin header validated against allow list
- Rate limit enforced before API call

**Error Handling**:
- Error messages never expose API keys
- Error details sanitized to remove sensitive info
- Upstream TTS API errors logged but not fully exposed to frontend
