#!/bin/bash
# INFINITE_SHIPPER Backend Proxy Setup Script
# Automates deployment steps for Cloudflare Workers

set -e  # Exit on error

echo "═══════════════════════════════════════════════════════"
echo "INFINITE_SHIPPER TTS Proxy - Setup & Deployment"
echo "═══════════════════════════════════════════════════════"
echo ""

# Check if we're in the right directory
if [ ! -f "wrangler.toml" ]; then
  echo "❌ Error: Must run from backend/ directory"
  echo "   Run: cd /Users/petemyall/INFINITE_SHIPPER/backend"
  exit 1
fi

echo "Step 1: Checking Wrangler authentication..."
if wrangler whoami &>/dev/null; then
  echo "✅ Already authenticated with Cloudflare"
else
  echo "⚠️  Not authenticated. Running wrangler login..."
  wrangler login
fi
echo ""

echo "Step 2: Creating KV namespace for rate limiting..."
echo "Running: wrangler kv:namespace create RATE_LIMIT_KV"
echo ""

# Create KV namespace and capture output
KV_OUTPUT=$(wrangler kv:namespace create RATE_LIMIT_KV)
echo "$KV_OUTPUT"
echo ""

# Extract the ID from output (format: id = "abc123...")
KV_ID=$(echo "$KV_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

if [ -z "$KV_ID" ]; then
  echo "❌ Error: Could not extract KV namespace ID"
  echo "   Please manually update wrangler.toml with the ID shown above"
  exit 1
fi

echo "✅ KV namespace created with ID: $KV_ID"
echo ""

echo "Step 3: Updating wrangler.toml with KV namespace ID..."

# Uncomment and update the KV namespace section
sed -i.backup 's/^# \[\[kv_namespaces\]\]/[[kv_namespaces]]/' wrangler.toml
sed -i.backup 's/^# binding = "RATE_LIMIT_KV"/binding = "RATE_LIMIT_KV"/' wrangler.toml
sed -i.backup "s/^# id = \"\".*$/id = \"$KV_ID\"/" wrangler.toml

# Remove backup file
rm -f wrangler.toml.backup

echo "✅ wrangler.toml updated"
echo ""

echo "Step 4: Storing Google Cloud TTS API key as secret..."
echo "⚠️  MANUAL STEP: You will be prompted to enter your API key"
echo ""
read -p "Press Enter to continue..."

wrangler secret put GOOGLE_TTS_API_KEY

echo ""
echo "✅ API key stored securely"
echo ""

echo "Step 5: Testing locally..."
echo "Starting local dev server with wrangler dev..."
echo ""
echo "⚠️  MANUAL TESTING REQUIRED:"
echo "   1. Open backend/test-proxy.html in your browser"
echo "   2. Click 'Test TTS Synthesis'"
echo "   3. Verify audio is returned"
echo "   4. Open DevTools Network tab"
echo "   5. Confirm NO API key visible in requests"
echo ""
read -p "Press Enter to start dev server (Ctrl+C to stop)..."

wrangler dev
