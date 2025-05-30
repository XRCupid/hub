/**
 * RPM Integration Service - Handles Ready Player Me avatars with full feature support
 * Includes: facial expressions, speech visemes, lip sync, and animations
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export interface RPMAvatar {
  id: string;
  url: string;
  scene: THREE.Group;
  mixer: THREE.AnimationMixer;
  morphTargets: Map<string, { mesh: THREE.Mesh; index: number }>;
  animations: Map<string, THREE.AnimationClip>;
  visemeMapping: Map<string, string[]>;
}

export class RPMIntegrationService {
  private loader: GLTFLoader;
  private avatarCache: Map<string, RPMAvatar> = new Map();
  
  // Standard RPM morph target names for facial expressions
  private readonly RPM_MORPH_TARGETS = {
    // Eyes
    eyeBlinkLeft: 'eyeBlinkLeft',
    eyeBlinkRight: 'eyeBlinkRight',
    eyeLookDownLeft: 'eyeLookDownLeft',
    eyeLookDownRight: 'eyeLookDownRight',
    eyeLookInLeft: 'eyeLookInLeft',
    eyeLookInRight: 'eyeLookInRight',
    eyeLookOutLeft: 'eyeLookOutLeft',
    eyeLookOutRight: 'eyeLookOutRight',
    eyeLookUpLeft: 'eyeLookUpLeft',
    eyeLookUpRight: 'eyeLookUpRight',
    eyeSquintLeft: 'eyeSquintLeft',
    eyeSquintRight: 'eyeSquintRight',
    eyeWideLeft: 'eyeWideLeft',
    eyeWideRight: 'eyeWideRight',
    
    // Eyebrows
    browDownLeft: 'browDownLeft',
    browDownRight: 'browDownRight',
    browInnerUp: 'browInnerUp',
    browOuterUpLeft: 'browOuterUpLeft',
    browOuterUpRight: 'browOuterUpRight',
    
    // Nose
    noseSneerLeft: 'noseSneerLeft',
    noseSneerRight: 'noseSneerRight',
    
    // Cheeks
    cheekPuff: 'cheekPuff',
    cheekSquintLeft: 'cheekSquintLeft',
    cheekSquintRight: 'cheekSquintRight',
    
    // Mouth
    mouthClose: 'mouthClose',
    mouthFunnel: 'mouthFunnel',
    mouthPucker: 'mouthPucker',
    mouthLeft: 'mouthLeft',
    mouthRight: 'mouthRight',
    mouthSmileLeft: 'mouthSmileLeft',
    mouthSmileRight: 'mouthSmileRight',
    mouthFrownLeft: 'mouthFrownLeft',
    mouthFrownRight: 'mouthFrownRight',
    mouthDimpleLeft: 'mouthDimpleLeft',
    mouthDimpleRight: 'mouthDimpleRight',
    mouthStretchLeft: 'mouthStretchLeft',
    mouthStretchRight: 'mouthStretchRight',
    mouthRollLower: 'mouthRollLower',
    mouthRollUpper: 'mouthRollUpper',
    mouthShrugLower: 'mouthShrugLower',
    mouthShrugUpper: 'mouthShrugUpper',
    mouthPressLeft: 'mouthPressLeft',
    mouthPressRight: 'mouthPressRight',
    mouthLowerDownLeft: 'mouthLowerDownLeft',
    mouthLowerDownRight: 'mouthLowerDownRight',
    mouthUpperUpLeft: 'mouthUpperUpLeft',
    mouthUpperUpRight: 'mouthUpperUpRight',
    
    // Jaw
    jawForward: 'jawForward',
    jawLeft: 'jawLeft',
    jawRight: 'jawRight',
    jawOpen: 'jawOpen',
    
    // Tongue
    tongueOut: 'tongueOut'
  };
  
  // Viseme to morph target mapping for lip sync
  private readonly VISEME_MAPPING = new Map<string, string[]>([
    ['sil', ['mouthClose']],
    ['PP', ['mouthClose', 'mouthPucker']],
    ['FF', ['mouthFunnel']],
    ['TH', ['tongueOut']],
    ['DD', ['mouthOpen']],
    ['kk', ['mouthOpen', 'mouthSmileLeft', 'mouthSmileRight']],
    ['CH', ['mouthFunnel', 'mouthPucker']],
    ['SS', ['mouthSmileLeft', 'mouthSmileRight']],
    ['nn', ['mouthClose']],
    ['RR', ['mouthPucker']],
    ['aa', ['jawOpen', 'mouthOpen']],
    ['E', ['mouthSmileLeft', 'mouthSmileRight']],
    ['I', ['mouthSmileLeft', 'mouthSmileRight', 'mouthOpen']],
    ['O', ['mouthPucker', 'jawOpen']],
    ['U', ['mouthPucker', 'mouthFunnel']]
  ]);

  constructor() {
    this.loader = new GLTFLoader();
  }

  /**
   * Load an RPM avatar with full feature support
   */
  async loadAvatar(avatarUrl: string): Promise<RPMAvatar> {
    // Check cache first
    if (this.avatarCache.has(avatarUrl)) {
      return this.avatarCache.get(avatarUrl)!;
    }

    return new Promise((resolve, reject) => {
      this.loader.load(
        avatarUrl,
        (gltf) => {
          const avatar: RPMAvatar = {
            id: this.generateAvatarId(avatarUrl),
            url: avatarUrl,
            scene: gltf.scene,
            mixer: new THREE.AnimationMixer(gltf.scene),
            morphTargets: new Map(),
            animations: new Map(),
            visemeMapping: this.VISEME_MAPPING
          };

          // Find all morph targets
          gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh && child.morphTargetDictionary) {
              console.log(`Found morph targets on ${child.name}:`, Object.keys(child.morphTargetDictionary));
              
              // Map each morph target
              for (const [name, index] of Object.entries(child.morphTargetDictionary)) {
                avatar.morphTargets.set(name, { mesh: child, index });
              }
            }
          });

          // Store animations
          if (gltf.animations && gltf.animations.length > 0) {
            gltf.animations.forEach((clip) => {
              avatar.animations.set(clip.name, clip);
            });
          }

          // Cache the avatar
          this.avatarCache.set(avatarUrl, avatar);
          
          console.log(`✅ Loaded RPM avatar with ${avatar.morphTargets.size} morph targets and ${avatar.animations.size} animations`);
          resolve(avatar);
        },
        (progress) => {
          console.log(`Loading avatar: ${(progress.loaded / progress.total * 100).toFixed(0)}%`);
        },
        (error) => {
          console.error('Failed to load RPM avatar:', error);
          reject(error);
        }
      );
    });
  }

  /**
   * Apply facial expression to avatar
   */
  applyExpression(avatar: RPMAvatar, expression: Record<string, number>) {
    for (const [morphName, value] of Object.entries(expression)) {
      const target = avatar.morphTargets.get(morphName);
      if (target && target.mesh.morphTargetInfluences) {
        target.mesh.morphTargetInfluences[target.index] = value;
      }
    }
  }

  /**
   * Apply viseme for lip sync
   */
  applyViseme(avatar: RPMAvatar, viseme: string, intensity: number = 1.0) {
    const morphTargets = this.VISEME_MAPPING.get(viseme) || [];
    
    // Reset all mouth-related morphs
    this.resetMouthMorphs(avatar);
    
    // Apply viseme morphs
    morphTargets.forEach((morphName) => {
      const target = avatar.morphTargets.get(morphName);
      if (target && target.mesh.morphTargetInfluences) {
        target.mesh.morphTargetInfluences[target.index] = intensity;
      }
    });
  }

  /**
   * Play animation on avatar
   */
  playAnimation(avatar: RPMAvatar, animationName: string, options?: {
    loop?: boolean;
    fadeIn?: number;
    fadeOut?: number;
  }) {
    const clip = avatar.animations.get(animationName);
    if (!clip) {
      console.warn(`Animation "${animationName}" not found`);
      return;
    }

    const action = avatar.mixer.clipAction(clip);
    
    if (options?.loop !== false) {
      action.setLoop(THREE.LoopRepeat, Infinity);
    }
    
    if (options?.fadeIn) {
      action.fadeIn(options.fadeIn);
    }
    
    action.play();
    
    // Handle fade out
    if (options?.fadeOut && options.fadeOut > 0) {
      setTimeout(() => {
        action.fadeOut(options.fadeOut!);
      }, (clip.duration - options.fadeOut) * 1000);
    }
  }

  /**
   * Update avatar animations (call in render loop)
   */
  update(avatar: RPMAvatar, deltaTime: number) {
    avatar.mixer.update(deltaTime);
  }

  /**
   * Get available expressions
   */
  getAvailableExpressions(avatar: RPMAvatar): string[] {
    return Array.from(avatar.morphTargets.keys());
  }

  /**
   * Get available animations
   */
  getAvailableAnimations(avatar: RPMAvatar): string[] {
    return Array.from(avatar.animations.keys());
  }

  private generateAvatarId(url: string): string {
    return url.split('/').pop()?.split('.')[0] || `avatar_${Date.now()}`;
  }

  private resetMouthMorphs(avatar: RPMAvatar) {
    const mouthMorphs = [
      'mouthClose', 'mouthFunnel', 'mouthPucker', 'mouthLeft', 'mouthRight',
      'mouthSmileLeft', 'mouthSmileRight', 'mouthFrownLeft', 'mouthFrownRight',
      'mouthDimpleLeft', 'mouthDimpleRight', 'mouthStretchLeft', 'mouthStretchRight',
      'mouthRollLower', 'mouthRollUpper', 'mouthShrugLower', 'mouthShrugUpper',
      'mouthPressLeft', 'mouthPressRight', 'mouthLowerDownLeft', 'mouthLowerDownRight',
      'mouthUpperUpLeft', 'mouthUpperUpRight', 'jawOpen', 'tongueOut'
    ];

    mouthMorphs.forEach((morphName) => {
      const target = avatar.morphTargets.get(morphName);
      if (target && target.mesh.morphTargetInfluences) {
        target.mesh.morphTargetInfluences[target.index] = 0;
      }
    });
  }
}

// Singleton instance
export const rpmIntegration = new RPMIntegrationService();
