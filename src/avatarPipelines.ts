/**
 * Avatar Creation Pipelines - Centralized exports for all avatar creation functionality
 * This file exposes all avatar creation methods, components, and services in one place
 */

// Services - Avatar Generation
export { AvatarAutoGenerator } from './services/AvatarAutoGenerator';
export { RPMAutoAvatarGenerator } from './services/RPMAutoAvatarGenerator';
export { RPMIntegrationService } from './services/RPMIntegrationService';
export { ReadyPlayerMeService } from './services/readyPlayerMeService';
// export { PreGeneratedAvatars } from './services/PreGeneratedAvatars';

// Services - Face Tracking
export { ML5FaceMeshService } from './services/ML5FaceMeshService';
export { CombinedFaceTrackingService } from './services/CombinedFaceTrackingService';
export { FaceTrackingService } from './services/FaceTrackingService';
export { FacialTrackingService } from './services/FacialTrackingService';
export { SimpleFacialTracking } from './services/SimpleFacialTracking';
export { PostureTrackingService } from './services/PostureTrackingService';
export { TrackingOrchestrator } from './services/TrackingOrchestrator';
export { CoachAwareTrackingSystem } from './services/CoachAwareTrackingSystem';

// Services - Avatar Systems
export { AvatarMirrorSystem } from './services/AvatarMirrorSystem';

// Services - Animation & Expression
export { OptimizedAnimationService } from './services/OptimizedAnimationService';
export { KrikeyAnimationService } from './services/KrikeyAnimationService';
export { TemporaryAnimationService } from './services/TemporaryAnimationService';
export { HumeExpressionService } from './services/HumeExpressionService';
// export { VisemeService } from './services/VisemeService';

// Components - Avatar Display
export { default as PresenceAvatar } from './components/PresenceAvatar';
export { default as CoachAvatar } from './components/CoachAvatar';
// export { default as UserPresenceAvatar } from './components/UserPresenceAvatar';
// export { default as EnhancedAnimatedAvatar } from './components/EnhancedAnimatedAvatar';
// export { default as AnimatedAvatar } from './components/AnimatedAvatar';
// export { default as EmotionalAvatar } from './components/EmotionalAvatar';
// export { default as ProceduralAvatar } from './components/ProceduralAvatar';
export { default as SimpleAvatar } from './components/SimpleAvatar';
export { default as FullBodyAvatar } from './components/FullBodyAvatar';

// Components - Avatar Creation
export { default as RPMAvatarCreator } from './components/RPMAvatarCreator';
export { default as RPMAvatarGenerator } from './components/RPMAvatarGenerator';
// export { default as RPMAvatarManager } from './components/RPMAvatarManager';
export { default as RPMAvatarCreatorModal } from './components/RPMAvatarCreatorModal';

// Components - RPM Avatars
export { default as RPMAvatar } from './components/RPMAvatar';
// export { default as RPMAvatarWithTracking } from './components/RPMAvatarWithTracking';
// export { default as RPMComprehensiveAvatar } from './components/RPMComprehensiveAvatar';
// export { default as RPMConfiguredAvatar } from './components/RPMConfiguredAvatar';
// export { default as RPMWorkingAvatar } from './components/RPMWorkingAvatar';
// export { default as RPMAnimatedAvatar } from './components/RPMAnimatedAvatar';
export { default as SimpleRPMAvatar } from './components/SimpleRPMAvatar';
// export { default as PreloadedRPMAvatar } from './components/PreloadedRPMAvatar';
export { default as ReadyPlayerMeAvatar } from './components/ReadyPlayerMeAvatar';

// Components - Testing & Debugging
// export { default as AvatarTest } from './components/AvatarTest';
export { AvatarTestPage } from './components/AvatarTestPage';
export { default as AvatarDiagnostic } from './components/AvatarDiagnostic';
export { default as AvatarInspector } from './components/AvatarInspector';
export { AvatarComparison } from './components/AvatarComparison';
export { AvatarControlDemo } from './components/AvatarControlDemo';
export { default as AvatarPuppetDemo } from './components/AvatarPuppetDemo';

// Pages
export { default as AvatarCreationHub } from './pages/AvatarCreationHub';

// Types and Interfaces
export type {
  FaceMeshPrediction,
  HeadRotation,
  IFaceTrackingService
} from './services/IFaceTrackingService';

// Import services for utility functions
import { AvatarAutoGenerator as AutoGen } from './services/AvatarAutoGenerator';
import { RPMAutoAvatarGenerator as RPMGen } from './services/RPMAutoAvatarGenerator';
import { AvatarMirrorSystem as MirrorSys } from './services/AvatarMirrorSystem';

// Configuration Constants
export const AVATAR_CONFIG = {
  // Expression Amplification Values (from memory)
  expressionAmplification: {
    mouthSmile: 7.0,
    mouthFrown: 7.0,
    eyebrowRaiseLeft: 5.0,
    eyebrowRaiseRight: 5.0,
    eyebrowFurrow: 5.0,
    eyeSquintLeft: 3.0,
    eyeSquintRight: 3.0,
    eyeWideLeft: 3.0,
    eyeWideRight: 3.0,
    cheekPuff: 2.5,
    mouthOpen: 1.2
  },
  
  // Head Rotation Settings (from memory)
  headRotation: {
    lerpFactor: 0.3,
    pitchScale: 0.7,
    yawScale: 0.7,
    rollScale: 0.5,
    clamps: {
      pitch: [-0.5, 0.5],
      yaw: [-0.6, 0.6],
      roll: [-0.3, 0.3]
    },
    neckMovementScale: 0.3
  },
  
  // Performance Settings
  performance: {
    frameSkip: 2, // Process every 3rd frame
    minProcessInterval: 50, // Minimum 50ms between processing
    smoothingAlpha: 0.4 // Expression lerp factor
  },
  
  // Preset Avatar URLs
  presetAvatars: {
    coaches: {
      grace: '/models/coach_grace.glb',
      posie: '/models/coach_posie.glb',
      rizzo: '/models/coach_rizzo.glb'
    },
    defaults: {
      male: 'https://models.readyplayer.me/64bfa15f0e72c63d7c3f5a1e.glb',
      female: 'https://models.readyplayer.me/64bfa15f0e72c63d7c3f5a2f.glb'
    }
  }
};

// Utility Functions
export const createAvatarPipeline = async (type: 'auto' | 'rpm' | 'mirror' | 'preset', config?: any) => {
  switch (type) {
    case 'auto':
      const autoGen = AutoGen.getInstance();
      return await autoGen.generateAvatar(config);
      
    case 'rpm':
      const rpmGen = RPMGen.getInstance();
      return await rpmGen.generateAvatar(config);
      
    case 'mirror':
      const mirrorSystem = new MirrorSys();
      return mirrorSystem;
      
    case 'preset':
      return AVATAR_CONFIG.presetAvatars;
      
    default:
      throw new Error(`Unknown avatar pipeline type: ${type}`);
  }
};

// Quick Start Helper
export const quickStartAvatar = async (preferences?: any) => {
  const generator = AutoGen.getInstance();
  const avatar = await generator.generateAvatar(preferences || {
    gender: 'female',
    ageRange: '26-35',
    style: 'professional'
  });
  return avatar;
};
