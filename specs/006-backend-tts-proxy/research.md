# Research: Backend TTS Proxy Platform & Implementation

**Feature**: 006-backend-tts-proxy
**Date**: 2026-02-04
**Purpose**: Research and evaluate backend hosting platforms and implementation strategies for secure TTS API proxy

## Platform Comparison

### Evaluated Platforms

Four serverless platforms were evaluated for hosting the TTS proxy:

1. **Cloudflare Workers** ⭐ SELECTED
2. Vercel Edge Functions
3. Netlify Functions
4. AWS Lambda

### Evaluation Criteria

- **Rate Limiting**: Built-in or custom implementation feasibility
- **Environment Variables**: Secure storage for API keys
- **CORS Handling**: Flexibility for origin validation
- **Cold Start Latency**: Impact on TTS request latency
- **Cost**: Free tier coverage for ~1000 req/month
- **Deployment Complexity**: Solo developer ease-of-use

### Decision Matrix

| Platform | Latency | Rate Limiting | Free Tier | Complexity | Score |
|----------|---------|---------------|-----------|------------|-------|
| **Cloudflare Workers** | **0-10ms** ⭐ | Custom + KV | **100k/day** ⭐ | Medium | **9/10** |
| Vercel Edge | 0-50ms | Custom + Edge Config | 1M/month | Low ⭐ | 8/10 |
| Netlify | 50-300ms | Custom + Deno KV | 125k/month | Medium | 6/10 |
| AWS Lambda | 200-1000ms | Complex (WAF) | 1M/month | High | 4/10 |

### Selected Platform: Cloudflare Workers

**Decision**: Cloudflare Workers
**Rationale**:
- Industry-leading latency (0-10ms overhead, virtually no cold starts)
- Generous free tier (100k req/day = 3M/month, far exceeds project needs)
- Global edge network (275+ locations) ensures consistent performance
- Workers KV provides distributed rate limiting state
- Secrets management built-in for API key security
- V8 isolates architecture = instant scaling, no cold starts

**Trade-offs Accepted**:
- Requires learning Wrangler CLI (vs. simpler Git-based deployment)
- More manual configuration than Vercel/Netlify
- Custom rate limiting implementation (no built-in solution)

**Alternatives Considered**:
- **Vercel Edge Functions**: Excellent choice, easier deployment, but slightly higher latency and less mature edge network
- **Netlify Functions**: Adequate but higher cold starts (300-600ms for standard functions)
- **AWS Lambda**: Rejected due to complexity, highest cold starts (200-1000ms), requires API Gateway + IAM setup

## Rate Limiting Strategy

### Requirements
- Limit: 30 requests per minute per IP address
- Granularity: Per-IP tracking
- Duration: 60-second sliding window
- Response: HTTP 429 with Retry-After header

### Implementation Approach: Workers KV Sliding Window

**Storage**: Workers KV (Cloudflare's distributed key-value store)

**Key Format**: `ratelimit:{ip}:{minute}`
- Example: `ratelimit:203.0.113.42:1738640400`
- Minute timestamp ensures automatic expiry

**Algorithm**:
1. Extract IP from `CF-Connecting-IP` header (Cloudflare-specific, trusted)
2. Calculate current minute timestamp: `Math.floor(Date.now() / 60000)`
3. Build key: `ratelimit:{ip}:{minute}`
4. Get current count from KV
5. If count ≥ 30, return 429 with `Retry-After: {seconds_until_next_minute}`
6. Increment counter and store with TTL of 60 seconds
7. Proceed with request

**Code Sketch**:
```javascript
async function checkRateLimit(ip, kv) {
  const minute = Math.floor(Date.now() / 60000);
  const key = `ratelimit:${ip}:${minute}`;

  const count = await kv.get(key);
  const current = count ? parseInt(count) : 0;

  if (current >= 30) {
    const secondsRemaining = 60 - (Math.floor(Date.now() / 1000) % 60);
    return { allowed: false, retryAfter: secondsRemaining };
  }

  await kv.put(key, (current + 1).toString(), { expirationTtl: 60 });
  return { allowed: true };
}
```

**Alternatives Considered**:
- **Token Bucket**: More complex, requires periodic cleanup
- **Leaky Bucket**: Overkill for simple per-minute limit
- **Fixed Window**: Chosen approach is simpler and sufficient for use case

## Origin Validation Strategy

### Requirements
- Allow requests only from authorized domains
- Support multiple environments (localhost, staging, production)
- Reject spoofed or missing origin headers
- Return HTTP 403 for unauthorized origins

### Implementation Approach: Allowed Origins List

**Configuration**: Environment variable `ALLOWED_ORIGINS`
- Format: Comma-separated list
- Example: `http://localhost:3000,http://localhost:8080,https://petemyall.github.io`

**Validation Logic**:
1. Check `Origin` header (CORS preflight and requests)
2. If missing, check `Referer` header (fallback)
3. If both missing, reject (403 Forbidden)
4. Parse origin from header
5. Match against allowed list (exact match)
6. If not matched, reject (403 Forbidden)
7. If matched, proceed and set CORS headers

**CORS Headers**:
- `Access-Control-Allow-Origin`: Matched origin (not `*`, specific origin)
- `Access-Control-Allow-Methods`: `POST, OPTIONS`
- `Access-Control-Allow-Headers`: `Content-Type`
- `Access-Control-Max-Age`: `86400` (24 hours)

**Code Sketch**:
```javascript
function validateOrigin(request, allowedOrigins) {
  const origin = request.headers.get('Origin') || request.headers.get('Referer');

  if (!origin) {
    return { valid: false, origin: null };
  }

  const originUrl = new URL(origin);
  const originHost = `${originUrl.protocol}//${originUrl.host}`;

  if (allowedOrigins.includes(originHost)) {
    return { valid: true, origin: originHost };
  }

  return { valid: false, origin: originHost };
}
```

## API Key Security

### Requirements
- API key never exposed to client-side code
- Encrypted at rest
- Not logged or visible in errors
- Accessible only at runtime in Worker

### Implementation: Cloudflare Worker Secrets

**Storage**: Cloudflare Secrets (encrypted environment variables)
**Setup**: `wrangler secret put GOOGLE_TTS_API_KEY`
**Access**: `env.GOOGLE_TTS_API_KEY` binding in Worker code
**Security**:
- Encrypted in Cloudflare's secret storage
- Never logged in Wrangler output
- Not accessible via dashboard after creation
- Bound to Worker at runtime via `env` parameter

**Best Practices**:
- Never log or return API key in responses
- Use separate API keys for dev/staging/prod if needed
- Rotate keys periodically (manual process)
- Set Google Cloud API restrictions (HTTP referrers, quota limits)

## Proxy Architecture

### Request Flow

```
Frontend (Browser)
    ↓ POST /synthesize
    ↓ SSML + voice config
    ↓
Cloudflare Worker
    ↓ 1. Validate origin
    ↓ 2. Check rate limit
    ↓ 3. Validate payload
    ↓ 4. Add API key header
    ↓
Google Cloud TTS API
    ↓ Synthesize audio
    ↓
Cloudflare Worker
    ↓ Format response
    ↓ Add CORS headers
    ↓
Frontend (Browser)
    ↓ Decode audio
    ↓ Play via Web Audio API
```

### Error Handling

| Error Scenario | HTTP Code | Response |
|----------------|-----------|----------|
| Rate limit exceeded | 429 | `{ error: "Rate limit exceeded", retryAfter: N }` |
| Invalid origin | 403 | `{ error: "Forbidden: Invalid origin" }` |
| Invalid SSML | 400 | `{ error: "Bad request: Invalid SSML" }` |
| TTS API error | 500 | `{ error: "TTS synthesis failed", details: "..." }` |
| Missing API key | 500 | `{ error: "Internal configuration error" }` |
| Network timeout | 504 | `{ error: "Gateway timeout" }` |

### Logging Strategy

**Log Events**:
- Request received (IP, origin, timestamp)
- Rate limit decisions (allowed/rejected)
- Origin validation results
- TTS API call latency
- Errors (without sensitive data)

**DO NOT Log**:
- API keys
- Full SSML content (may contain sensitive data)
- User-identifiable information beyond IP

**Implementation**: `console.log()` in Worker (appears in Wrangler tail/dashboard logs)

## Performance Optimization

### Latency Targets
- Proxy overhead: < 50ms (target: 10-20ms)
- Total request time: < 2500ms (Google TTS: ~2000ms, proxy: ~50ms)

### Optimizations
1. **Edge Routing**: Cloudflare automatically routes to nearest POP
2. **KV Reads**: Single KV get for rate limit check (~5-10ms)
3. **Minimal Processing**: Direct passthrough of TTS response
4. **HTTP/2**: Enabled by default on Cloudflare

### Monitoring
- Cloudflare Analytics (free tier includes basic metrics)
- Worker logs via `wrangler tail` during development
- Custom logging for request count tracking

## Security Testing Requirements

Per Constitution v1.1.0, Principle II exception, the following automated tests are REQUIRED:

### 1. API Key Exposure Test
**Purpose**: Verify zero credential leakage
**Test Scenarios**:
- Inspect Worker source code (should not contain key)
- Check response headers (should not expose key)
- Verify error messages (should not leak key)
- Test with invalid origin (should fail before using key)

### 2. Rate Limiting Test
**Purpose**: Verify 30 req/min enforcement
**Test Scenarios**:
- Send 30 requests rapidly (all should succeed)
- Send 31st request (should return 429)
- Wait 60 seconds and retry (should succeed)
- Multiple IPs should not interfere with each other

### 3. Origin Validation Test
**Purpose**: Verify unauthorized domain rejection
**Test Scenarios**:
- Request from allowed origin (should succeed)
- Request from unauthorized origin (should return 403)
- Request with no origin header (should return 403)
- Request with spoofed origin (should return 403)
- OPTIONS preflight from allowed origin (should return 200)

## Deployment Strategy

### Initial Deployment
1. Create Cloudflare account (free tier)
2. Install Wrangler CLI: `npm install -g wrangler`
3. Authenticate: `wrangler login`
4. Create Worker: `wrangler init backend`
5. Create KV namespace: `wrangler kv:namespace create RATE_LIMIT_KV`
6. Set secrets: `wrangler secret put GOOGLE_TTS_API_KEY`
7. Configure `wrangler.toml` with KV binding and env vars
8. Deploy: `wrangler deploy`
9. Update frontend with Worker URL
10. Test with browser DevTools

### Ongoing Updates
1. Modify Worker code locally
2. Test with `wrangler dev` (local development server)
3. Deploy with `wrangler deploy` (zero-downtime deployment)
4. Monitor logs with `wrangler tail`

### Rollback Strategy
- Cloudflare maintains deployment history
- Rollback via dashboard: Workers > Version History > Rollback
- Or redeploy previous git commit

## References

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Workers KV](https://developers.cloudflare.com/kv/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Google Cloud TTS API](https://cloud.google.com/text-to-speech/docs)
- INFINITE_SHIPPER Constitution v1.1.0, Principle II (Security Testing Exception)
