# Face Tracking Performance Optimization Guide

## Current Optimized Settings (as of 2025-06-18)

### ML5FaceMeshService Performance Settings

**Desktop (Non-Mobile) Settings:**
- `skipFrames: 1` - Process every 2nd frame
- `minProcessInterval: 33ms` - ~30 FPS max processing rate
- `smoothingAlpha: 0.3` - More responsive tracking (less smoothing)

**Mobile Settings:**
- `skipFrames: 2` - Process every 3rd frame
- `minProcessInterval: 66ms` - ~15 FPS max processing rate
- `smoothingAlpha: 0.25` - Balanced smoothing for mobile

## Performance Tips

### 1. Reduce Background Processing
- Close unnecessary browser tabs
- Disable browser extensions that might interfere
- Stop other video/camera applications

### 2. Browser-Specific Optimizations

**Chrome/Edge:**
- Enable hardware acceleration in browser settings
- Use `chrome://flags` and enable:
  - WebGL 2.0 Compute
  - GPU Rasterization
  - Override software rendering list

**Firefox:**
- Enable WebRender in `about:config`
- Set `webgl.force-enabled` to true

### 3. System-Level Optimizations
- Ensure your GPU drivers are up to date
- Close CPU-intensive applications
- If on a laptop, use performance power mode (not battery saver)

### 4. Application-Level Tuning

To adjust performance settings in real-time, you can modify these values in the browser console:

```javascript
// Get the ML5 service instance (when on the speed date page)
const ml5Service = window.ml5Service; // If exposed

// For more performance (less quality):
ml5Service.skipFrames = 3; // Process every 4th frame
ml5Service.minProcessInterval = 50; // 20 FPS max

// For better quality (less performance):
ml5Service.skipFrames = 0; // Process every frame
ml5Service.minProcessInterval = 16; // 60 FPS max
```

### 5. Debugging Performance Issues

Check performance in the browser console:
```javascript
// Monitor frame rate
window.diagnostics.checkPerformance();

// Apply automatic performance fixes
window.diagnostics.applyQuickFixes();
```

## Trade-offs

| Setting | Performance Impact | Quality Impact |
|---------|-------------------|----------------|
| Lower skipFrames | ⬇️ Lower FPS | ⬆️ Smoother tracking |
| Higher skipFrames | ⬆️ Higher FPS | ⬇️ Choppier tracking |
| Lower minProcessInterval | ⬇️ More CPU usage | ⬆️ More responsive |
| Higher minProcessInterval | ⬆️ Less CPU usage | ⬇️ Less responsive |
| Lower smoothingAlpha | ⬆️ Less computation | ⬇️ Jittery movement |
| Higher smoothingAlpha | ⬇️ More computation | ⬆️ Smoother movement |

## Recommended Configurations

### High-Performance Gaming PC
```javascript
skipFrames: 0
minProcessInterval: 16  // 60 FPS
smoothingAlpha: 0.4
```

### Standard Desktop/Laptop
```javascript
skipFrames: 1
minProcessInterval: 33  // 30 FPS
smoothingAlpha: 0.3
```

### Older/Mobile Devices
```javascript
skipFrames: 3
minProcessInterval: 66  // 15 FPS
smoothingAlpha: 0.2
```
