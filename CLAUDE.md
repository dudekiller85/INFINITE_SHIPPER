# INFINITE_SHIPPER Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-01

## Active Technologies
- JavaScript ES6+ (browser-based, Node.js 18+ for tooling) + Google Cloud TTS API (en-GB-Neural2-B voice), SSML template builder, weather generator (003-broadcast-structure)
- N/A (ephemeral generation only) (003-broadcast-structure)
- JavaScript ES6+ (browser-based), Node.js 18+ for tooling + Vanilla JS (no frameworks), CSS3 animations and filters, Canvas 2D API (004-haunted-maritime-ui)
- Browser localStorage for motion preference persistence (client-side only) (004-haunted-maritime-ui)
- JavaScript ES6+ (browser-based), Node.js 18+ for tooling + Google Cloud TTS API (en-GB-Neural2-B voice), SSML template builder, Page Visibility API (005-inactivity-warnings)
- JavaScript ES6+ (Cloudflare Workers runtime, V8) (006-backend-tts-proxy)
- Workers KV (distributed key-value store for rate limit counters) (006-backend-tts-proxy)

- JavaScript ES6+ (browser-based, Node.js 18+ for tooling) (002-natural-speech-generation)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test && npm run lint

## Code Style

JavaScript ES6+ (browser-based, Node.js 18+ for tooling): Follow standard conventions

## Recent Changes
- 006-backend-tts-proxy: Added JavaScript ES6+ (Cloudflare Workers runtime, V8)
- 005-inactivity-warnings: Added JavaScript ES6+ (browser-based), Node.js 18+ for tooling + Google Cloud TTS API (en-GB-Neural2-B voice), SSML template builder, Page Visibility API
- 004-haunted-maritime-ui: Added JavaScript ES6+ (browser-based), Node.js 18+ for tooling + Vanilla JS (no frameworks), CSS3 animations and filters, Canvas 2D API


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
