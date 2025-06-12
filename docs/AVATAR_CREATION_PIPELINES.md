# Avatar Creation Pipelines Documentation

## Overview

The XRCupid platform provides multiple avatar creation pipelines to support different use cases and user preferences. This document exposes all available avatar creation methods, components, and services.

## 🎯 Quick Access

- **Avatar Creation Hub**: `/avatar-creation-hub` - Interactive UI for all avatar creation methods
- **Test Pages**: Various test routes for specific avatar features
- **Services**: Backend services for avatar generation and management

## 📊 Avatar Creation Methods

### 1. Auto-Generation Pipeline

**Service**: `AvatarAutoGenerator`
**Location**: `/src/services/AvatarAutoGenerator.ts`

Generates avatars based on user preferences without manual creation.

```typescript
interface AvatarPreferences {
  gender: 'male' | 'female' | 'non-binary';
  ageRange: '18-25' | '26-35' | '36-45' | '45+';
  ethnicity?: 'asian' | 'black' | 'caucasian' | 'hispanic' | 'middle-eastern' | 'mixed';
  style: 'casual' | 'professional' | 'athletic' | 'creative' | 'elegant';
  bodyType?: 'slim' | 'average' | 'athletic' | 'curvy';
}

// Usage
const generator = AvatarAutoGenerator.getInstance();
const avatar = await generator.generateAvatar(preferences);
```

### 2. Ready Player Me (RPM) Pipeline

**Services**:
- `RPMIntegrationService` - Full RPM avatar support with expressions
- `RPMAutoAvatarGenerator` - Programmatic RPM avatar generation
- `ReadyPlayerMeService` - RPM API integration

**Components**:
- `RPMAvatarCreator` - UI for avatar selection
- `RPMAvatarGenerator` - Avatar generation interface
- `RPMAvatarManager` - Avatar management system

**Key Features**:
- 52 ARKit-compatible blend shapes
- Viseme support for lip-sync
- Custom clothing and accessories
- Performance-optimized GLB models

```typescript
// RPM Integration Service
const rpmService = new RPMIntegrationService();
const avatar = await rpmService.loadAvatar(avatarUrl);

// Apply expressions
await rpmService.setExpression(avatar.id, 'mouthSmile', 0.8);

// Apply visemes for lip-sync
await rpmService.applyViseme(avatar.id, 'AA', 0.7);
```

### 3. Mirror Mode Pipeline

**Services**:
- `ML5FaceMeshService` - Face tracking with ML5.js
- `CombinedFaceTrackingService` - Unified tracking interface
- `AvatarMirrorSystem` - Real-time expression mirroring

**Components**:
- `PresenceAvatar` - Main avatar component with tracking
- `UserPresenceAvatar` - User-specific avatar with face tracking

**Expression Amplification Settings**:
```typescript
// From memory - optimal values for emotional responsiveness
const amplificationValues = {
  mouthSmile: 7.0,
  mouthFrown: 7.0,
  eyebrowRaiseLeft: 5.0,
  eyebrowRaiseRight: 5.0,
  eyebrowFurrow: 5.0,
  eyeSquintLeft: 3.0,
  eyeSquintRight: 3.0,
  eyeWideLeft: 3.0,
  eyeWideRight: 3.0
};
```

### 4. Preset Library

**Service**: `PreGeneratedAvatars`
**Location**: `/src/services/PreGeneratedAvatars.ts`

Pre-optimized avatars for specific use cases:

#### Dating Coaches
- **Grace** (`/models/coach_grace.glb`) - Elegant & Sophisticated
- **Posie** (`/models/coach_posie.glb`) - Warm & Nurturing  
- **Rizzo** (`/models/coach_rizzo.glb`) - Bold & Confident

#### NPC Dates
- Various personality-based avatars
- Pre-configured expressions and animations

## 🛠️ Core Components

### Avatar Display Components

1. **PresenceAvatar** (`/src/components/PresenceAvatar.tsx`)
   - Main avatar component with full tracking support
   - Handles both user and coach avatars
   - Integrates ML5 face tracking and Hume emotional blendshapes

2. **CoachAvatar** (`/src/components/CoachAvatar.tsx`)
   - Specialized for coach avatars without face tracking
   - Uses cloned GLTF scenes to avoid morph target sharing

3. **EnhancedAnimatedAvatar** (`/src/components/EnhancedAnimatedAvatar.tsx`)
   - Advanced animation support
   - Procedural animations and expressions

### Avatar Creation Components

1. **RPMAvatarCreator** (`/src/components/RPMAvatarCreator.tsx`)
   - Modal interface for RPM avatar selection
   - Preset avatars and custom URL support

2. **RPMAvatarGenerator** (`/src/components/RPMAvatarGenerator.tsx`)
   - Programmatic avatar generation
   - Style and personality configuration

3. **AvatarView** (`/src/components/AvatarView.js`)
   - Basic avatar rendering component
   - Legacy support for older avatar systems

## 🔧 Services Architecture

### Face Tracking Services

```typescript
// ML5 Face Mesh Service
const faceTracking = new ML5FaceMeshService();
await faceTracking.startTracking(videoElement);

// Get tracking data
const expressions = faceTracking.getExpressions();
const headRotation = faceTracking.getHeadRotation();
const landmarks = faceTracking.getLandmarks();
```

### Animation Services

- `OptimizedAnimationService` - Performance-optimized animations
- `KrikeyAnimationService` - Krikey animation integration
- `TemporaryAnimationService` - Quick animation testing

### Voice & Expression Services

- `HumeVoiceService` - Hume AI voice integration
- `HumeExpressionService` - Emotional expression mapping
- `VisemeService` - Lip-sync viseme generation

## 📍 Test Routes

- `/avatar-test` - Basic avatar testing
- `/avatar-test-page` - Enhanced testing with UserAvatarPiP
- `/rpm-test` - RPM avatar testing
- `/avatar-diagnostic` - Avatar debugging tools
- `/avatar-inspector` - Detailed avatar inspection
- `/avatar-comparison` - Side-by-side avatar comparison

## 🚀 Quick Start Examples

### Create Auto-Generated Avatar

```typescript
import { AvatarAutoGenerator } from './services/AvatarAutoGenerator';

const generator = AvatarAutoGenerator.getInstance();
const avatar = await generator.generateAvatar({
  gender: 'female',
  ageRange: '26-35',
  style: 'professional'
});
```

### Load RPM Avatar with Tracking

```typescript
import PresenceAvatar from './components/PresenceAvatar';
import { ML5FaceMeshService } from './services/ML5FaceMeshService';

// In your component
const [trackingData, setTrackingData] = useState(null);

// Initialize tracking
const videoElement = document.getElementById('video');
const faceTracking = new ML5FaceMeshService();
await faceTracking.startTracking(videoElement);

// Update loop
setInterval(() => {
  setTrackingData({
    facialExpressions: faceTracking.getExpressions(),
    headRotation: faceTracking.getHeadRotation()
  });
}, 33);

// Render avatar
<PresenceAvatar
  avatarUrl="/models/avatar.glb"
  trackingData={trackingData}
/>
```

### Create Custom Avatar Pipeline

```typescript
import { RPMIntegrationService } from './services/RPMIntegrationService';
import { AvatarMirrorSystem } from './services/AvatarMirrorSystem';

// Initialize services
const rpmService = new RPMIntegrationService();
const mirrorSystem = new AvatarMirrorSystem();

// Load avatar
const avatar = await rpmService.loadAvatar(customAvatarUrl);

// Apply real-time mirroring
mirrorSystem.startMirroring(avatar.id, trackingData);
```

## 🔍 Advanced Features

### Expression Smoothing

The system uses a two-stage smoothing approach:
1. Raw values from ML5FaceMeshService
2. Smoothing applied in CombinedFaceTrackingService

### Head Rotation Configuration

```typescript
const headRotationConfig = {
  lerpFactor: 0.3,
  pitchScale: 0.7,
  yawScale: 0.7,
  rollScale: 0.5,
  clamps: {
    pitch: [-0.5, 0.5],
    yaw: [-0.6, 0.6],
    roll: [-0.3, 0.3]
  }
};
```

### Performance Optimization

- Frame throttling (process every 3rd frame)
- Minimum process interval (50ms)
- GPU optimization flags
- Memory cleanup on unmount

## 📝 Notes

- Always use `trackingDataRef.current` in useFrame for real-time updates
- Coach avatars should skip morph target processing
- Double smoothing should be avoided (only smooth once)
- WebSocket connections must wait for 'open' event before sending data

## 🔗 Related Documentation

- [Hume Integration Guide](./HUME_INTEGRATION.md)
- [ML5 Face Tracking Setup](./ML5_SETUP.md)
- [RPM API Documentation](https://docs.readyplayer.me)
