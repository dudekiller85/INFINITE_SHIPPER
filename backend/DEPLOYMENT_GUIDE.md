# INFINITE_SHIPPER Backend Proxy - Deployment Guide

**Status**: Backend code is 100% complete ✅
**Remaining**: Manual deployment steps only

## Prerequisites Complete ✅

- ✅ Backend directory structure created
- ✅ All source code implemented
- ✅ Security tests written (17 tests total)
- ✅ Dependencies installed (`npm install` complete)
- ✅ Wrangler CLI installed (v4.62.0)

## Step-by-Step Deployment

### Step 1: Authenticate with Cloudflare

```bash
cd /Users/petemyall/INFINITE_SHIPPER/backend
wrangler login
```

**What happens**:
- Browser opens to Cloudflare OAuth page
- Sign in or create Cloudflare account (free)
- Authorize Wrangler
- Return to terminal

**Expected output**: `Successfully logged in`

---

### Step 2: Create KV Namespace for Rate Limiting

```bash
wrangler kv:namespace create RATE_LIMIT_KV
```

**What happens**:
- Creates distributed key-value store for rate limiting
- Returns namespace ID

**Expected output**:
```
{ binding = "RATE_LIMIT_KV", id = "abc123def456..." }
```

**Action**: Copy the `id` value (e.g., "abc123def456...")

---

### Step 3: Update wrangler.toml with KV Namespace ID

Edit `backend/wrangler.toml`:

**Find these lines** (currently commented out):
```toml
# [[kv_namespaces]]
# binding = "RATE_LIMIT_KV"
# id = ""  # TODO: Fill with KV namespace ID from T006
```

**Replace with** (uncomment and add your ID):
```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "YOUR_KV_ID_HERE"  # Paste the ID from Step 2
```

**Save the file**.

---

### Step 4: Store Google Cloud TTS API Key as Secret

```bash
wrangler secret put GOOGLE_TTS_API_KEY
```

**What happens**:
- Prompts you to enter your API key
- Encrypts and stores it securely in Cloudflare

**Action**:
1. When prompted: `Enter a secret value:`
2. Paste your Google Cloud TTS API key (starts with "AIza...")
3. Press Enter

**Expected output**: `Success! Uploaded secret GOOGLE_TTS_API_KEY`

**⚠️ Important**:
- The key is encrypted at rest
- Never logged or exposed
- Not accessible via dashboard after creation

---

### Step 5: Test Locally

```bash
wrangler dev
```

**What happens**:
- Starts local development server
- Accessible at `http://localhost:8787`
- Uses your real API key and KV namespace

**Expected output**:
```
⛅️ wrangler 4.62.0
-------------------
⬣ Listening on http://localhost:8787
```

**Test it**: Open `backend/test-proxy.html` in your browser
- Click "Test TTS Synthesis"
- Should see: "Success! Audio received: //NExAAQ..."
- Open DevTools Network tab: Verify no API key visible

---

### Step 6: Run Security Tests

**In a NEW terminal** (keep `wrangler dev` running):

```bash
cd /Users/petemyall/INFINITE_SHIPPER/backend
npm test
```

**What happens**:
- Runs all 17 security tests
- Tests against local dev server (http://localhost:8787)

**Expected output**:
```
═══════════════════════════════════════════════════════
Security Test Suite - INFINITE_SHIPPER TTS Proxy
REQUIRED by Constitution v1.1.0, Principle II Exception
═══════════════════════════════════════════════════════

Running: API Key Exposure
✓ PASS: No hardcoded API keys found in source
✓ PASS: No API keys found in response headers
✓ PASS: Error message clean

Running: Rate Limiting
✓ PASS: All 30 requests succeeded
✓ PASS: 31st request returned 429
✓ PASS: retryAfter header present

Running: Origin Validation
✓ PASS: Request from allowed origin succeeded
✓ PASS: Unauthorized origin rejected with 403
✓ PASS: Spoofed origin rejected with 403

✓ ALL SECURITY TESTS PASSED
```

**If any tests fail**: Stop here and debug before deploying

---

### Step 7: Deploy to Production

```bash
wrangler deploy
```

**What happens**:
- Uploads Worker to Cloudflare's global network
- Deploys to 275+ edge locations
- Returns your Worker URL

**Expected output**:
```
Published infinite-shipper-tts-proxy (1.23 sec)
  https://infinite-shipper-tts-proxy.YOUR-USERNAME.workers.dev

Current Version ID: abc123def456
```

**Action**: Copy your Worker URL

---

### Step 8: Update Frontend Configuration

Edit `src/audio/tts-service-adapter.js`:

**Find line ~254** (in `_callAPI` method):
```javascript
const endpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`;
```

**Replace with your Worker URL**:
```javascript
const endpoint = 'https://infinite-shipper-tts-proxy.YOUR-USERNAME.workers.dev/synthesize';
```

**Remove API key import** (around line 11):
```javascript
// DELETE THIS LINE:
// import { TTS_API_KEY } from '../config.js';
```

**Update constructor** (around line 53):
```javascript
// DELETE OR COMMENT OUT:
// this.apiKey = config.apiKey || TTS_API_KEY;
```

---

### Step 9: Test Frontend Integration

1. **Start local frontend server**:
   ```bash
   cd /Users/petemyall/INFINITE_SHIPPER
   # If using local server:
   python3 -m http.server 3000
   # Or open index.html directly in browser
   ```

2. **Open the site** in your browser

3. **Open DevTools** → Network tab

4. **Click "BEGIN TRANSMISSION"**

5. **Verify**:
   - ✅ Audio plays successfully
   - ✅ Network request goes to your Worker URL (not Google TTS)
   - ✅ No API key visible anywhere in Network tab
   - ✅ No API key in Sources tab (check `tts-service-adapter.js`)

---

### Step 10: Deploy Frontend to GitHub Pages

1. **Commit changes**:
   ```bash
   git add .
   git commit -m "Secure TTS proxy: Route through Cloudflare Worker

   - Remove API key from frontend
   - Add backend Worker proxy
   - All security tests passing

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

   git push origin 005-inactivity-warnings
   ```

2. **Deploy to GitHub Pages**:
   - Push to your main branch or use GitHub Pages settings
   - Wait for deployment

3. **Test production site**:
   - Open your GitHub Pages URL
   - Test audio synthesis
   - Verify no API key exposure in DevTools

---

## Verification Checklist

After deployment, verify ALL of these:

### Security Checks ✓
- [ ] Open DevTools Network tab during audio generation
- [ ] Confirm: No API key in request URLs
- [ ] Confirm: No API key in request headers
- [ ] Confirm: Requests go to Worker URL (not Google TTS)
- [ ] Open DevTools Sources tab
- [ ] Confirm: No API key in `tts-service-adapter.js` source
- [ ] Check browser localStorage/sessionStorage
- [ ] Confirm: No API key stored

### Functionality Checks ✓
- [ ] Audio synthesis works (same quality as before)
- [ ] Multiple requests succeed
- [ ] Error handling works (try invalid SSML)

### Rate Limiting Checks ✓
- [ ] Make 30 rapid requests (all succeed)
- [ ] Make 31st request (returns 429)
- [ ] Wait 60 seconds (requests succeed again)

### Origin Validation Checks ✓
- [ ] Requests from your domain succeed
- [ ] Check Worker logs for origin validation

---

## Monitoring

### View Worker Logs

```bash
wrangler tail
```

**What you see**:
- Real-time request logs
- IP addresses, status codes, latency
- Rate limit decisions
- Origin validation results
- Errors (sanitized, no secrets)

**Press Ctrl+C to stop**

### View Analytics

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to: Workers & Pages
3. Click: `infinite-shipper-tts-proxy`
4. Click: **Metrics** tab

**What you see**:
- Request count
- Success rate
- Error rate
- Latency (p50, p95, p99)
- Data transfer

---

## Cost Tracking

**Free Tier**: 100,000 requests/day
**Your Usage**: ~33 requests/day estimated
**Cost**: $0 (well within free tier)

**To monitor**:
- Check Worker Analytics daily
- Set up billing alerts in Cloudflare dashboard

---

## Troubleshooting

### "API key not configured" error

**Problem**: Secret not set or Worker can't access it
**Solution**:
```bash
wrangler secret list  # Check if secret exists
wrangler secret put GOOGLE_TTS_API_KEY  # Re-create if missing
```

### "KV namespace not found" error

**Problem**: KV namespace not bound in wrangler.toml
**Solution**:
1. Check `wrangler.toml` has correct `[[kv_namespaces]]` section
2. Verify `id` matches your KV namespace
3. Run: `wrangler kv:namespace list` to see available namespaces

### Rate limiting not working

**Problem**: KV writes failing
**Solution**:
1. Check Worker logs: `wrangler tail`
2. Verify KV namespace binding
3. Check Cloudflare dashboard for KV errors

### CORS errors in browser

**Problem**: Origin not in ALLOWED_ORIGINS
**Solution**:
1. Edit `backend/wrangler.toml`
2. Add your domain to ALLOWED_ORIGINS:
   ```toml
   ALLOWED_ORIGINS = "http://localhost:3000,https://yourdomain.com,https://petemyall.github.io/INFINITE_SHIPPER"
   ```
3. Redeploy: `wrangler deploy`

### High latency

**Problem**: Cold starts or network issues
**Solution**:
- Check Worker logs for actual latency
- Google TTS API takes ~2000ms (most of total time)
- Proxy overhead should be <50ms
- If higher: Check Cloudflare status page

---

## Rollback Procedure

If something goes wrong after deployment:

### Option 1: Rollback Worker

```bash
# View deployment history
wrangler deployments list

# Rollback to previous version
wrangler rollback [VERSION_ID]
```

### Option 2: Revert Frontend

```bash
git revert HEAD
git push
```

### Option 3: Disable Proxy Temporarily

Edit `src/audio/tts-service-adapter.js`:
- Restore original Google TTS endpoint
- Re-add API key import (from backup)
- Redeploy frontend

**⚠️ WARNING**: This re-exposes your API key!

---

## Support & Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Workers KV Guide](https://developers.cloudflare.com/kv/)
- [Google Cloud TTS API](https://cloud.google.com/text-to-speech/docs)

---

## Success! 🎉

Once all steps are complete:
- ✅ API key secured (zero exposure)
- ✅ Rate limiting active (30 req/min per IP)
- ✅ Origin validation enforced
- ✅ All security tests passing
- ✅ Website publicly deployable
- ✅ $0 cost (free tier)

Your INFINITE_SHIPPER TTS proxy is production-ready!
