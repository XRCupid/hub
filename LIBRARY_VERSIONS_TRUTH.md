# XRCupid Library Versions - Source of Truth

Last Updated: 2025-06-18

## Critical Library Dependencies

### Working Configuration (DO NOT CHANGE WITHOUT EXTENSIVE TESTING)

```html
<!-- public/index.html - Load order is CRITICAL -->
<!-- TensorFlow.js 1.7.4 - Compatible with ML5 0.12.2 -->
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.7.4/dist/tf.min.js"></script>
<!-- ML5.js 0.12.2 - Proven working version -->
<script src="https://unpkg.com/ml5@0.12.2/dist/ml5.min.js"></script>
<!-- WebGazer 2.1.0 - Load AFTER our TF.js to preserve face tracking -->
<script src="https://unpkg.com/webgazer@2.1.0/dist/webgazer.min.js"></script>
```

## Why These Specific Versions?

### ML5.js 0.12.2
- Our face tracking code uses the ML5 0.12.2 API
- Uses `ml5.facemesh()` (lowercase) and `.on('predict', callback)` event handling
- Requires TensorFlow.js 1.7.4 specifically

### TensorFlow.js 1.7.4
- The ONLY version compatible with ML5 0.12.2
- Using TF.js 2.0.0 causes: `TypeError: n.incRef is not a function`
- Using TF.js 3.x causes compatibility issues with ML5 0.12.2

### WebGazer 2.1.0
- Provides eye tracking functionality
- Bundles its own TF.js 3.5.0 internally
- MUST be loaded AFTER our TF.js 1.7.4 to prevent version conflicts

## Known Breaking Changes in Newer Versions

### ML5.js 1.2.1 (DO NOT UPGRADE)
- Breaking API changes:
  - `ml5.facemesh()` → `ml5.faceMesh()` (capital M)
  - `.on()` event handling removed (throws "facemesh.on is not a function")
  - Requires TensorFlow.js 3.x
  - Would require complete rewrite of face tracking code

### WebGazer Version Compatibility
- WebGazer 1.0.0 is compatible with TF.js 1.7.4 but lacks features we need
- WebGazer 2.1.0 works when loaded AFTER our TF.js

## Testing Protocol

Before changing ANY of these versions:

1. Test ML5 face tracking at `/test-ml5`
   - Should show continuous "✅ Face detected! 1 face(s)" messages
   
2. Test WebGazer eye tracking in main app
   - Should show gaze coordinates
   
3. Test PiP avatar face tracking
   - Should track face movements in real-time

## Troubleshooting

### If face tracking stops working:
1. Check browser console for TensorFlow.js version conflicts
2. Verify script load order in index.html
3. Use the `/test-ml5` page to isolate ML5 issues

### Common errors and solutions:
- `TypeError: n.incRef is not a function` → Wrong TF.js version for ML5
- `facemesh.on is not a function` → Using ML5 1.x with old API code
- `Camera not found` → Multiple camera access attempts or permissions issue

## Package.json Dependencies

Keep these in sync with CDN versions:
```json
{
  "@tensorflow/tfjs": "1.7.4",
  "ml5": "0.12.2"
}
```

Note: WebGazer is loaded via CDN only, not npm.
