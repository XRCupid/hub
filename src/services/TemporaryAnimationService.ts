// Temporary Animation Service using Free Resources
// Gets you running immediately while you build the full library

import * as THREE from 'three';

export class TemporaryAnimationService {
  
  // Use Mixamo's free animations as placeholders
  private readonly MIXAMO_ANIMATIONS = {
    'greeting_wave': 'https://www.mixamo.com/animations/waving',
    'confident_stance': 'https://www.mixamo.com/animations/standing-idle',
    'subtle_smile': 'https://www.mixamo.com/animations/happy-idle',
    'idle_relaxed': 'https://www.mixamo.com/animations/breathing-idle',
    'idle_engaged': 'https://www.mixamo.com/animations/standing-idle-01'
  };

  // Generate procedural animations for immediate use
  public createProceduralAnimation(type: string): THREE.AnimationClip {
    const duration = 2.0;
    const tracks: THREE.KeyframeTrack[] = [];

    switch (type) {
      case 'greeting_wave':
        // Create a simple wave animation
        tracks.push(
          new THREE.QuaternionKeyframeTrack(
            'RightArm.quaternion',
            [0, 0.5, 1.0, 1.5, 2.0],
            [
              0, 0, 0, 1,  // Start
              0, 0, 0.3, 0.95,  // Raise arm
              0, 0.1, 0.3, 0.95,  // Wave right
              0, -0.1, 0.3, 0.95,  // Wave left
              0, 0, 0, 1   // Return
            ]
          )
        );
        break;

      case 'flirty_hair_flip':
        // Head tilt with hand gesture
        tracks.push(
          new THREE.QuaternionKeyframeTrack(
            'Head.quaternion',
            [0, 0.8, 1.6, 2.5],
            [
              0, 0, 0, 1,  // Start
              0.1, 0.1, 0, 0.99,  // Tilt head
              0.1, -0.1, 0, 0.99,  // Flip motion
              0, 0, 0, 1   // Return
            ]
          )
        );
        break;

      case 'confident_stance':
        // Chest out, shoulders back
        tracks.push(
          new THREE.VectorKeyframeTrack(
            'Spine.scale',
            [0, 1.5, 3.0],
            [
              1, 1, 1,  // Normal
              1.05, 1.02, 1,  // Expand chest
              1.05, 1.02, 1   // Hold
            ]
          )
        );
        break;

      case 'nervous_fidget':
        // Hand movements
        tracks.push(
          new THREE.VectorKeyframeTrack(
            'LeftHand.position',
            [0, 0.5, 1.0, 1.5, 2.0],
            [
              0, 0, 0,  // Start
              0.02, 0, 0,  // Small movement
              -0.02, 0.01, 0,  // Fidget
              0.01, -0.01, 0,  // More fidget
              0, 0, 0   // Return
            ]
          )
        );
        break;

      case 'interested_lean':
        // Lean forward slightly
        tracks.push(
          new THREE.QuaternionKeyframeTrack(
            'Spine.quaternion',
            [0, 1.5, 3.0],
            [
              0, 0, 0, 1,  // Start
              0.15, 0, 0, 0.99,  // Lean forward
              0.15, 0, 0, 0.99   // Hold
            ]
          )
        );
        break;

      case 'genuine_laugh':
        // Head back with bounce
        tracks.push(
          new THREE.QuaternionKeyframeTrack(
            'Head.quaternion',
            [0, 0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.1, 2.5],
            [
              0, 0, 0, 1,  // Start
              -0.1, 0, 0, 0.99,  // Head back
              -0.08, 0, 0, 0.99,  // Bounce
              -0.12, 0, 0, 0.99,  // Back more
              -0.08, 0, 0, 0.99,  // Bounce
              -0.1, 0, 0, 0.99,  // Stabilize
              -0.05, 0, 0, 0.99,  // Coming down
              -0.02, 0, 0, 0.99,  // Almost there
              0, 0, 0, 1   // Return
            ]
          )
        );
        break;

      default:
        // Default idle animation - subtle breathing
        tracks.push(
          new THREE.VectorKeyframeTrack(
            'Spine.scale',
            [0, 2, 4],
            [
              1, 1, 1,
              1.01, 1.01, 1,
              1, 1, 1
            ]
          )
        );
    }

    return new THREE.AnimationClip(type, duration, tracks);
  }

  // Create a basic animation mixer setup
  public setupBasicAnimations(model: THREE.Object3D): THREE.AnimationMixer {
    const mixer = new THREE.AnimationMixer(model);
    
    // Create all basic animations
    const animationTypes = [
      'greeting_wave',
      'flirty_hair_flip', 
      'confident_stance',
      'nervous_fidget',
      'interested_lean',
      'genuine_laugh',
      'subtle_smile',
      'thoughtful_nod',
      'playful_wink',
      'idle_relaxed',
      'idle_engaged'
    ];

    const clips: Record<string, THREE.AnimationClip> = {};
    
    animationTypes.forEach(type => {
      clips[type] = this.createProceduralAnimation(type);
    });

    return mixer;
  }
}
