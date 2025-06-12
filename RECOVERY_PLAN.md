# Recovery Plan - Restore Peak Functionality

## Goal
Remove problematic body tracking features while preserving ML5 face mesh fixes and other improvements.

## Files to Remove/Disable
1. **MoveNet Components** (causing TensorFlow conflicts):
   - `/src/components/MoveNetAvatar.tsx`
   - `/src/components/MoveNetAvatarFixed.tsx`
   
2. **Computer Vision Stack** (if causing crashes):
   - `/src/components/ComputerVisionDemo.tsx` (optional - only if problematic)

## Files to Keep/Preserve
1. **ML5 Face Mesh Fixes**:
   - `/src/services/ML5FaceMeshService.ts` - Keep all error handling improvements
   - `/src/components/ML5FaceMeshTest.tsx` - Keep for testing
   
2. **Important Services**:
   - All avatar services (AvatarMirrorSystem, AvatarAutoGenerator, etc.)
   - TrackingOrchestrator
   - Voice services
   - Hume integrations

## Action Steps

### Step 1: Remove MoveNet Routes
Remove from `/src/App.js`:
- Import statements for MoveNetAvatar and MoveNetAvatarFixed
- Route definitions for /movenet-avatar and /movenet-fixed

### Step 2: Remove TensorFlow Pose Detection
From `package.json`, consider removing (if not used elsewhere):
- "@tensorflow-models/pose-detection"
- "@tensorflow-models/hand-pose-detection" (if not needed)

### Step 3: Clean Up Imports
Remove any unused imports related to body tracking.

### Step 4: Verify Core Features
Test these critical paths:
- ConferenceBoothDemo
- EnhancedCoachSession
- Face tracking with ML5
- Avatar rendering
- Voice services

## Commands to Execute

```bash
# 1. Remove MoveNet files
rm src/components/MoveNetAvatar.tsx
rm src/components/MoveNetAvatarFixed.tsx

# 2. Clean and rebuild
npm run clean
npm install
npm start
```

## Validation Checklist
- [ ] Face tracking works without TensorFlow errors
- [ ] ConferenceBoothDemo loads properly
- [ ] Coach sessions work with avatars
- [ ] No console errors about missing modules
- [ ] Browser doesn't crash
