# Quickstart Guide: Backend TTS Proxy

**Feature**: 006-backend-tts-proxy
**Date**: 2026-02-04

## Overview

This guide walks you through setting up and deploying the backend TTS proxy using Cloudflare Workers. The proxy secures your Google Cloud TTS API key and implements rate limiting and origin validation.

## Prerequisites

- Node.js 18+ installed
- Google Cloud TTS API key (existing)
- Cloudflare account (free tier)
- Git repository with INFINITE_SHIPPER code

## Initial Setup

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

Wrangler is Cloudflare's CLI tool for managing Workers.

### 2. Authenticate with Cloudflare

```bash
wrangler login
```

This opens a browser window to authorize Wrangler with your Cloudflare account.

### 3. Create Backend Directory

```bash
cd /path/to/INFINITE_SHIPPER
mkdir -p backend/src backend/tests/security
cd backend
```

### 4. Initialize Worker

```bash
npm init -y
npm install --save-dev wrangler
```

### 5. Create Wrangler Configuration

Create `backend/wrangler.toml`:

```toml
name = "infinite-shipper-tts-proxy"
main = "src/index.js"
compatibility_date = "2024-01-01"

[vars]
ALLOWED_ORIGINS = "http://localhost:3000,https://petemyall.github.io/INFINITE_SHIPPER"
RATE_LIMIT_THRESHOLD = "30"

[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = ""  # Will be filled in next step
```

### 6. Create KV Namespace for Rate Limiting

```bash
wrangler kv:namespace create RATE_LIMIT_KV
```

This outputs:
```
{ binding = "RATE_LIMIT_KV", id = "abc123..." }
```

**Copy the `id` value** and paste it into `wrangler.toml` under `[[kv_namespaces]]`.

### 7. Store API Key as Secret

```bash
wrangler secret put GOOGLE_TTS_API_KEY
```

When prompted, paste your Google Cloud TTS API key. This encrypts and stores it securely.

## Local Development

### 1. Create Worker Entry Point

Create `backend/src/index.js` (minimal version for testing):

```javascript
export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Basic proxy (no rate limiting yet)
    if (request.method === 'POST' && new URL(request.url).pathname === '/synthesize') {
      try {
        const body = await request.json();

        const ttsResponse = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${env.GOOGLE_TTS_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }
        );

        const data = await ttsResponse.json();

        return new Response(JSON.stringify(data), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500 }
        );
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};
```

### 2. Run Local Development Server

```bash
wrangler dev
```

This starts a local server at `http://localhost:8787`. The Worker will use your configured secrets and KV namespace.

### 3. Test Locally

Create a test HTML file `backend/test-proxy.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>TTS Proxy Test</title>
</head>
<body>
  <h1>TTS Proxy Test</h1>
  <button id="test">Test TTS Synthesis</button>
  <div id="result"></div>

  <script>
    document.getElementById('test').addEventListener('click', async () => {
      const result = document.getElementById('result');
      result.textContent = 'Testing...';

      try {
        const response = await fetch('http://localhost:8787/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { ssml: '<speak>Test synthesize</speak>' },
            voice: { languageCode: 'en-GB', name: 'en-GB-Neural2-D' },
            audioConfig: { audioEncoding: 'MP3', sampleRateHertz: 24000 },
          }),
        });

        const data = await response.json();

        if (data.audioContent) {
          result.textContent = 'Success! Audio received: ' + data.audioContent.substring(0, 50) + '...';
        } else if (data.error) {
          result.textContent = 'Error: ' + data.error;
        }
      } catch (error) {
        result.textContent = 'Request failed: ' + error.message;
      }
    });
  </script>
</body>
</html>
```

Open this file in a browser and click "Test TTS Synthesis". You should see a success message with base64 audio data.

## Implementation Phases

After the basic proxy works, implement these features in order:

### Phase 1: Rate Limiting

1. Create `backend/src/rate-limiter.js`
2. Implement KV-based request counting
3. Add rate limit check to main Worker
4. Return 429 with Retry-After header

**Test**: Make 31 requests rapidly, verify 31st returns 429.

### Phase 2: Origin Validation

1. Create `backend/src/origin-validator.js`
2. Parse `ALLOWED_ORIGINS` environment variable
3. Validate Origin/Referer headers
4. Return 403 for unauthorized origins

**Test**: Make request from unauthorized domain, verify 403.

### Phase 3: Error Handling

1. Create `backend/src/error-handler.js`
2. Format error responses consistently
3. Handle TTS API errors gracefully
4. Never expose API key in errors

**Test**: Send invalid SSML, verify error message doesn't expose key.

### Phase 4: Security Tests

1. Create automated tests in `backend/tests/security/`
2. Test API key exposure (zero credential leakage)
3. Test rate limiting enforcement
4. Test origin validation

**Required by Constitution v1.1.0, Principle II exception**.

## Deployment

### 1. Deploy to Cloudflare

```bash
wrangler deploy
```

This deploys your Worker to Cloudflare's edge network. Output will include your Worker URL:
```
Published infinite-shipper-tts-proxy (0.42 sec)
  https://infinite-shipper-tts-proxy.username.workers.dev
```

### 2. Update Frontend Configuration

In your frontend code (`src/audio/tts-service-adapter.js`), replace the Google Cloud TTS endpoint:

**Before**:
```javascript
const endpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`;
```

**After**:
```javascript
const endpoint = `https://infinite-shipper-tts-proxy.username.workers.dev/synthesize`;
```

### 3. Remove API Key from Frontend

Delete or comment out the API key import:

**Before**:
```javascript
import { TTS_API_KEY } from '../config.js';
```

**After**:
```javascript
// API key now stored securely in backend proxy
// import { TTS_API_KEY } from '../config.js';  // REMOVED
```

### 4. Test Production Deployment

1. Open your deployed frontend in a browser
2. Open DevTools → Network tab
3. Trigger a TTS synthesis
4. Verify:
   - Request goes to Worker URL (not Google Cloud TTS)
   - No API key visible in request
   - Response contains audio data
   - Audio plays successfully

## Monitoring

### View Worker Logs

```bash
wrangler tail
```

This streams live logs from your Worker. Press Ctrl+C to stop.

### View Analytics

Visit Cloudflare Dashboard:
1. Go to Workers & Pages
2. Click your Worker name
3. Click "Metrics" tab
4. View request counts, error rates, and latency

## Troubleshooting

### Error: "No API key configured"

- Verify secret was set: `wrangler secret list`
- If missing, run: `wrangler secret put GOOGLE_TTS_API_KEY`

### Error: "KV namespace not found"

- Verify KV namespace ID in `wrangler.toml`
- Create namespace if missing: `wrangler kv:namespace create RATE_LIMIT_KV`

### Rate limiting not working

- Check KV binding in `wrangler.toml`
- Verify KV namespace exists: `wrangler kv:namespace list`
- Check Worker logs: `wrangler tail`

### CORS errors in browser

- Verify `ALLOWED_ORIGINS` includes your frontend domain
- Check Origin header in request matches allowed list exactly
- Ensure Worker handles OPTIONS preflight requests

### High latency

- Check Worker region: Cloudflare auto-routes to nearest edge
- Verify no unnecessary KV reads/writes in hot path
- Check Google Cloud TTS API latency (most of total time)

## Security Checklist

Before deploying to production:

- [ ] API key stored as Cloudflare Secret (not in code)
- [ ] `ALLOWED_ORIGINS` configured with production domain
- [ ] Rate limiting enabled (30 req/min per IP)
- [ ] Origin validation enabled
- [ ] Security tests passing (API key exposure, rate limit, origin)
- [ ] Error messages don't expose API key
- [ ] Worker logs don't contain sensitive data
- [ ] Frontend no longer contains API key
- [ ] Test with browser DevTools: verify no key in Network tab

## Next Steps

1. **Implement full proxy logic** (rate limiting + origin validation)
2. **Create security tests** (required by Constitution)
3. **Deploy to production**
4. **Update frontend to use proxy**
5. **Remove API key from frontend code**
6. **Test end-to-end with GitHub Pages deployment**

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Workers KV Guide](https://developers.cloudflare.com/kv/)
- [Google Cloud TTS API](https://cloud.google.com/text-to-speech/docs)
- INFINITE_SHIPPER Constitution v1.1.0 (security testing requirements)
