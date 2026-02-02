# TTS Service Interface

**Version**: 1.0.0
**Date**: 2026-02-01
**Status**: Stable

## Overview

This document defines the interface contract for Text-to-Speech service adapters. The interface provides an abstraction layer allowing different TTS providers (Google Cloud, AWS Polly, ElevenLabs) to be used interchangeably.

---

## Interface: TTSServiceAdapter

### Purpose

Abstract TTS API calls to enable provider swapping, testing, and fallback strategies.

### Methods

#### `synthesize(ssmlTemplate: SSMLTemplate): Promise<GeneratedAudio>`

**Description**: Synthesize SSML template into audio

**Parameters**:
- `ssmlTemplate` (SSMLTemplate): SSML document with prosody markup

**Returns**: Promise<GeneratedAudio> - Audio buffer and metadata

**Throws**:
- `NetworkError`: Network failure, timeout (>5s)
- `AuthenticationError`: Invalid API key, HTTP 401/403
- `RateLimitError`: Too many requests, HTTP 429
- `ValidationError`: Invalid SSML structure
- `ServiceError`: TTS service error, HTTP 500/503

**Example**:
```javascript
const adapter = new GoogleCloudTTSAdapter(apiKey);
const ssmlTemplate = ssmlBuilder.build(weatherReport);

try {
  const audio = await adapter.synthesize(ssmlTemplate);
  console.log(`Generated ${audio.duration}s audio, ${audio.fileSize} bytes`);
} catch (error) {
  if (error instanceof RateLimitError) {
    // Handle rate limiting
  }
}
```

**Performance SLA**:
- Latency: <2000ms (95th percentile)
- Timeout: 5000ms
- Retry: 3 attempts with exponential backoff (100ms, 200ms, 400ms)

---

#### `validateSSML(ssml: string): Promise<boolean>`

**Description**: Validate SSML structure before synthesis (optional, for testing)

**Parameters**:
- `ssml` (string): SSML document string

**Returns**: Promise<boolean> - True if valid, false otherwise

**Throws**: Never throws, returns false on invalid SSML

**Example**:
```javascript
const ssml = '<speak>Test<break time="800ms"/></speak>';
const isValid = await adapter.validateSSML(ssml);
if (!isValid) {
  console.error('Invalid SSML structure');
}
```

---

#### `getUsageStats(): UsageStats`

**Description**: Get API usage statistics for monitoring/cost tracking

**Returns**: UsageStats object

**Example**:
```javascript
const stats = adapter.getUsageStats();
console.log(`Requests: ${stats.requestCount}, Characters: ${stats.characterCount}`);
console.log(`Estimated cost: $${stats.estimatedCost.toFixed(4)}`);
```

**UsageStats Type**:
```typescript
interface UsageStats {
  requestCount: number;        // Total API calls
  successCount: number;        // Successful syntheses
  failureCount: number;        // Failed syntheses
  characterCount: number;      // Total characters synthesized
  estimatedCost: number;       // USD, based on provider pricing
  lastRequestAt: Date | null;  // Timestamp of last request
  averageLatency: number;      // Milliseconds
}
```

---

### Configuration

#### Constructor Parameters

```javascript
constructor(config: TTSConfig)
```

**TTSConfig Type**:
```typescript
interface TTSConfig {
  // Authentication
  apiKey: string;              // Required: API key for TTS service
  
  // Voice configuration
  voice: {
    languageCode: string;      // "en-GB"
    name: string;              // "en-GB-Neural2-B"
    gender?: "MALE" | "FEMALE" | "NEUTRAL";
  };
  
  // Audio configuration
  audioConfig: {
    encoding: "MP3" | "OGG" | "WAV";
    sampleRate: number;        // 24000 (Hz)
    bitrate?: number;          // 48 (kbps), optional
    effectsProfile?: string[]; // ["headphone-class-device"]
  };
  
  // Performance
  timeout?: number;            // 5000 (ms), default
  retryAttempts?: number;      // 3, default
  retryDelay?: number;         // 100 (ms), default base delay
  
  // Monitoring
  enableMetrics?: boolean;     // true, default
  logRequests?: boolean;       // false, default (console.log API calls)
}
```

---

## Implementation: GoogleCloudTTSAdapter

### Class Definition

```javascript
class GoogleCloudTTSAdapter implements TTSServiceAdapter {
  constructor(config: TTSConfig);
  async synthesize(ssmlTemplate: SSMLTemplate): Promise<GeneratedAudio>;
  async validateSSML(ssml: string): Promise<boolean>;
  getUsageStats(): UsageStats;
}
```

### API Endpoint

```
POST https://texttospeech.googleapis.com/v1/text:synthesize?key={API_KEY}
```

### Request Format

```json
{
  "input": {
    "ssml": "<speak>...</speak>"
  },
  "voice": {
    "languageCode": "en-GB",
    "name": "en-GB-Neural2-B",
    "ssmlGender": "MALE"
  },
  "audioConfig": {
    "audioEncoding": "MP3",
    "sampleRateHertz": 24000,
    "speakingRate": 1.0,
    "pitch": 0.0,
    "effectsProfileId": ["headphone-class-device"]
  }
}
```

### Response Format

```json
{
  "audioContent": "base64EncodedMP3Data...",
  "timepoints": [
    {"markName": "area", "timeSeconds": 0.5},
    {"markName": "wind", "timeSeconds": 2.1}
  ],
  "audioConfig": {
    "audioEncoding": "MP3",
    "sampleRateHertz": 24000
  }
}
```

### Error Handling

| HTTP Code | Error Type | Retry? | Fallback Action |
|-----------|------------|--------|-----------------|
| 400 | ValidationError | No | Fix SSML, log error |
| 401/403 | AuthenticationError | No | Check API key, enable fallback |
| 429 | RateLimitError | Yes (3×) | Wait, then fallback |
| 500/503 | ServiceError | Yes (3×) | Wait, then fallback |
| Timeout | NetworkError | Yes (3×) | Fallback immediately |

---

## Implementation: MockTTSAdapter (for testing)

### Purpose

Test adapter that returns mock audio without API calls

### Class Definition

```javascript
class MockTTSAdapter implements TTSServiceAdapter {
  constructor(config: Partial<TTSConfig> = {});
  async synthesize(ssmlTemplate: SSMLTemplate): Promise<GeneratedAudio>;
  async validateSSML(ssml: string): Promise<boolean>;
  getUsageStats(): UsageStats;
  
  // Test-specific methods
  setDelay(ms: number): void;           // Simulate latency
  setShouldFail(fail: boolean): void;   // Simulate errors
  getLastRequest(): SSMLTemplate | null; // Inspect last request
}
```

### Mock Audio Generation

```javascript
// Returns silent audio buffer with realistic duration (12-20s)
synthesize(ssmlTemplate) {
  const duration = 15; // seconds
  const sampleRate = 24000;
  const audioContext = new AudioContext();
  const audioBuffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
  
  return {
    audioBuffer,
    audioBlob: new Blob(), // Empty blob
    base64Audio: "",
    reportId: ssmlTemplate.reportId,
    areaName: ssmlTemplate.areaName,
    isPhantom: ssmlTemplate.isPhantom,
    duration,
    sampleRate,
    fileSize: 90000, // ~90KB mock size
    synthesizedAt: new Date(),
    cachedAt: null
  };
}
```

---

## Error Hierarchy

```
TTSError (base class)
├── NetworkError
│   ├── TimeoutError
│   └── ConnectionError
├── AuthenticationError
│   ├── InvalidKeyError
│   └── PermissionError
├── RateLimitError
├── ValidationError
│   ├── InvalidSSMLError
│   └── InvalidConfigError
└── ServiceError
    ├── ProviderError (5xx)
    └── UnknownError
```

### Error Properties

```typescript
class TTSError extends Error {
  name: string;              // Error class name
  message: string;           // Human-readable message
  code: string;              // Machine-readable code (e.g., "RATE_LIMIT")
  httpStatus?: number;       // HTTP status code if applicable
  retryable: boolean;        // Can this error be retried?
  details?: any;             // Provider-specific error details
}
```

---

## Usage Examples

### Basic Usage

```javascript
import { GoogleCloudTTSAdapter } from './tts-service-adapter.js';
import { SSMLTemplateBuilder } from './ssml-template-builder.js';

const adapter = new GoogleCloudTTSAdapter({
  apiKey: 'AIzaSy...',
  voice: {
    languageCode: 'en-GB',
    name: 'en-GB-Neural2-B'
  },
  audioConfig: {
    encoding: 'MP3',
    sampleRate: 24000
  }
});

const builder = new SSMLTemplateBuilder();
const weatherReport = generator.generateWeatherReport();
const ssmlTemplate = builder.build(weatherReport);

const audio = await adapter.synthesize(ssmlTemplate);
// Play audio...
```

### With Error Handling

```javascript
let failureCount = 0;

async function synthesizeWithFallback(report) {
  try {
    const ssml = builder.build(report);
    const audio = await adapter.synthesize(ssml);
    failureCount = 0; // Reset on success
    return audio;
  } catch (error) {
    failureCount++;
    console.error(`Synthesis failed (${failureCount}/3):`, error);
    
    if (error instanceof RateLimitError) {
      console.warn('Rate limit hit, waiting 60s...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      return synthesizeWithFallback(report); // Retry once
    }
    
    if (failureCount >= 3) {
      console.error('Switching to MP3 fallback');
      enableFallbackMode();
    }
    
    throw error; // Propagate to caller
  }
}
```

### Testing with MockAdapter

```javascript
import { MockTTSAdapter } from './tts-service-adapter.js';

describe('SSMLSynthesizer', () => {
  it('should handle synthesis errors gracefully', async () => {
    const mockAdapter = new MockTTSAdapter();
    mockAdapter.setShouldFail(true);
    
    const synthesizer = new SSMLSynthesizer(mockAdapter);
    
    await expect(
      synthesizer.speakReport(weatherReport)
    ).rejects.toThrow(ServiceError);
  });
  
  it('should generate correct SSML for phantom areas', async () => {
    const mockAdapter = new MockTTSAdapter();
    const synthesizer = new SSMLSynthesizer(mockAdapter);
    
    const phantomReport = {...weatherReport, area: {type: 'phantom', name: 'The Void'}};
    await synthesizer.speakReport(phantomReport);
    
    const lastRequest = mockAdapter.getLastRequest();
    expect(lastRequest.ssml).toContain('pitch="-12%"');
    expect(lastRequest.isPhantom).toBe(true);
  });
});
```

---

## Performance Characteristics

| Operation | Latency | Notes |
|-----------|---------|-------|
| `synthesize()` | 800-1500ms | Network + Google processing |
| `validateSSML()` | 50-100ms | Local XML parsing |
| `getUsageStats()` | <1ms | In-memory read |
| Constructor | <1ms | Synchronous initialization |

---

## Compliance & Testing

### Contract Tests

All implementations MUST pass the following tests:

```javascript
describe('TTSServiceAdapter contract', () => {
  it('should synthesize valid SSML into audio');
  it('should reject invalid SSML with ValidationError');
  it('should timeout after 5 seconds');
  it('should retry 3 times on transient errors');
  it('should throw AuthenticationError for invalid API key');
  it('should return accurate usage statistics');
});
```

### Integration Tests

```javascript
describe('TTSServiceAdapter integration', () => {
  it('should generate audio with correct pause timings (±50ms)');
  it('should apply pitch reduction for phantom areas');
  it('should respect speaking rate (85-90%)');
  it('should produce MP3 files ~60-120KB for 15s reports');
});
```

---

## Versioning

**Current Version**: 1.0.0

### Breaking Changes

Changes that break this interface contract:
- Method signature changes
- Required parameter additions
- Error type hierarchy changes
- Response format changes

### Non-Breaking Changes

Changes that preserve compatibility:
- Optional parameter additions
- New methods
- Additional error types (extending hierarchy)
- New response fields (additive)

---

## Future Considerations

**v1.1.0** (potential additions):
- `synthesizeStreaming()`: Stream audio as it's generated
- `batchSynthesize()`: Synthesize multiple reports in one API call
- `getCachedVoices()`: List available voices
- `estimateCost()`: Predict cost before synthesis

**v2.0.0** (potential breaking changes):
- Support for SSML 2.0 specification
- Voice cloning support (ElevenLabs integration)
- Real-time streaming synthesis
- Multi-language support beyond en-GB
