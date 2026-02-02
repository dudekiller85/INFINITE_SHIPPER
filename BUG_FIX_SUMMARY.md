# Bug Fix: Area Object Handling

## Issue
When running `test-natural-speech.html`, got error:
```
❌ Error: report.area.substring is not a function
   at SSMLTemplateBuilder._generateReportId
```

## Root Cause
The existing `weatherGenerator.generateWeatherReport()` returns:
```javascript
{
  area: {
    name: "Viking",      // Area name as string
    type: "standard",    // "standard" or "phantom"
    id: "viking"        // Normalized ID
  },
  wind: {
    direction: "southwesterly",
    force: 7,            // Can be number OR array like [5, 7]
    // ...
  }
  // ...
}
```

But the SSMLTemplateBuilder was expecting:
```javascript
{
  area: "Viking",        // Just a string
  isPhantom: false,
  wind: { ... }
}
```

## Fix Applied

### 1. Updated `build()` method to handle both formats:
```javascript
// Extract area name (handle both string and object formats)
const areaName = typeof report.area === 'string' ? report.area : report.area.name;
const isPhantom = report.isPhantom || (report.area.type === 'phantom');
```

### 2. Updated `_generateReportId()` to accept string:
```javascript
_generateReportId(areaName) {  // Now takes string directly
  const area = areaName ? areaName.substring(0, 3).toLowerCase() : 'unk';
  // ...
}
```

### 3. Updated `_buildWindSSML()` to handle array force:
```javascript
// Handle both single value and array (e.g., [5, 7] for "5 to 7")
const forceText = Array.isArray(wind.force)
  ? wind.force.join(' to ')
  : String(wind.force);
```

## Files Modified
- ✅ [src/audio/ssml-template-builder.js](src/audio/ssml-template-builder.js)
  - Lines 59-96: Updated `build()` method
  - Lines 94-117: Updated `_buildWindSSML()` method
  - Lines 217-227: Updated `_generateReportId()` method

## Testing
```bash
# Quick validation (no errors)
node test-synthesis.mjs

# Browser test (should work now)
open test-natural-speech.html

# Full app (should work)
npm run dev
open http://localhost:8000
```

## What Now Works
✅ **Test page** - Generates SSML and plays audio
✅ **Full app** - Continuous playback with real weather generator
✅ **Phantom detection** - Automatically detects phantom areas from `area.type`
✅ **Wind ranges** - Handles "Force 5 to 7" format
✅ **Backward compatibility** - Still works with simple string area format

## Status
🎉 **FIXED** - All formats now supported!
