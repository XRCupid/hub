import { BlendShapeMap, BlendshapeKey } from '../types/blendshapes';

/**
 * Blendshape Compositor - Intelligently combines multiple blendshape sources
 * Handles conflicts between lip sync, emotions, and manual overrides
 */

// Define which blendshapes are controlled by which systems
const MOUTH_SHAPES: BlendshapeKey[] = [
  'jawOpen', 'jawForward', 'jawLeft', 'jawRight',
  'mouthClose', 'mouthFunnel', 'mouthPucker', 'mouthLeft', 'mouthRight',
  'mouthSmileLeft', 'mouthSmileRight', 'mouthFrownLeft', 'mouthFrownRight',
  'mouthDimpleLeft', 'mouthDimpleRight', 'mouthStretchLeft', 'mouthStretchRight',
  'mouthRollLower', 'mouthRollUpper', 'mouthShrugLower', 'mouthShrugUpper',
  'mouthPressLeft', 'mouthPressRight', 'mouthLowerDownLeft', 'mouthLowerDownRight',
  'mouthUpperUpLeft', 'mouthUpperUpRight'
];

const EYE_SHAPES: BlendshapeKey[] = [
  'eyeBlinkLeft', 'eyeBlinkRight', 'eyeLookDownLeft', 'eyeLookDownRight',
  'eyeLookInLeft', 'eyeLookInRight', 'eyeLookOutLeft', 'eyeLookOutRight',
  'eyeLookUpLeft', 'eyeLookUpRight', 'eyeSquintLeft', 'eyeSquintRight',
  'eyeWideLeft', 'eyeWideRight'
];

const BROW_SHAPES: BlendshapeKey[] = [
  'browDownLeft', 'browDownRight', 'browInnerUp', 'browOuterUpLeft', 'browOuterUpRight'
];

const CHEEK_SHAPES: BlendshapeKey[] = [
  'cheekPuff', 'cheekSquintLeft', 'cheekSquintRight'
];

export interface BlendshapeInput {
  visemes?: Partial<BlendShapeMap>;      // Lip sync (highest priority for mouth)
  emotions?: Partial<BlendShapeMap>;     // Emotional expressions
  manual?: Partial<BlendShapeMap>;       // Manual overrides (highest priority overall)
  base?: Partial<BlendShapeMap>;         // Base/idle state
}

export interface CompositorConfig {
  // How much to reduce emotion mouth shapes when visemes are active
  emotionMouthReduction: number;         // 0.0 - 1.0 (default: 0.3)
  
  // How much to blend emotion eye/brow shapes with visemes
  emotionFaceBlending: number;           // 0.0 - 1.0 (default: 0.8)
  
  // Smoothing factor for transitions
  smoothingFactor: number;               // 0.0 - 1.0 (default: 0.1)
}

const DEFAULT_CONFIG: CompositorConfig = {
  emotionMouthReduction: 0.3,
  emotionFaceBlending: 0.8,
  smoothingFactor: 0.1
};

export class BlendshapeCompositor {
  private lastOutput: Partial<BlendShapeMap> = {};
  private config: CompositorConfig;

  constructor(config: Partial<CompositorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Compose multiple blendshape inputs into a single output
   */
  compose(inputs: BlendshapeInput): Partial<BlendShapeMap> {
    const { visemes = {}, emotions = {}, manual = {}, base = {} } = inputs;
    const result: Partial<BlendShapeMap> = { ...base };

    // Check if we have active visemes (lip sync)
    const hasActiveVisemes = this.hasSignificantMouthMovement(visemes);
    
    // 1. Apply emotions, but reduce mouth shapes if visemes are active
    Object.entries(emotions).forEach(([key, value]) => {
      const blendshapeKey = key as BlendshapeKey;
      
      if (MOUTH_SHAPES.includes(blendshapeKey) && hasActiveVisemes) {
        // Reduce emotion mouth shapes when lip sync is active
        result[blendshapeKey] = (result[blendshapeKey] || 0) + 
          (value * this.config.emotionMouthReduction);
      } else if (EYE_SHAPES.includes(blendshapeKey) || BROW_SHAPES.includes(blendshapeKey) || CHEEK_SHAPES.includes(blendshapeKey)) {
        // Apply full emotion strength to non-mouth areas
        result[blendshapeKey] = (result[blendshapeKey] || 0) + 
          (value * this.config.emotionFaceBlending);
      } else {
        // Apply full emotion strength to other areas
        result[blendshapeKey] = (result[blendshapeKey] || 0) + value;
      }
    });

    // 2. Apply visemes (lip sync) - these get priority for mouth shapes
    Object.entries(visemes).forEach(([key, value]) => {
      const blendshapeKey = key as BlendshapeKey;
      
      if (MOUTH_SHAPES.includes(blendshapeKey)) {
        // Visemes override mouth shapes completely
        result[blendshapeKey] = value;
      } else {
        // Non-mouth viseme shapes (rare) get added
        result[blendshapeKey] = (result[blendshapeKey] || 0) + value;
      }
    });

    // 3. Apply manual overrides (highest priority)
    Object.entries(manual).forEach(([key, value]) => {
      result[key as BlendshapeKey] = value;
    });

    // 4. Clamp all values to valid range [0, 1]
    Object.keys(result).forEach(key => {
      const blendshapeKey = key as BlendshapeKey;
      result[blendshapeKey] = Math.max(0, Math.min(1, result[blendshapeKey] || 0));
    });

    // 5. Apply smoothing if configured
    if (this.config.smoothingFactor > 0) {
      Object.keys(result).forEach(key => {
        const blendshapeKey = key as BlendshapeKey;
        const currentValue = result[blendshapeKey] || 0;
        const lastValue = this.lastOutput[blendshapeKey] || 0;
        
        result[blendshapeKey] = lastValue + 
          (currentValue - lastValue) * (1 - this.config.smoothingFactor);
      });
    }

    this.lastOutput = { ...result };
    return result;
  }

  /**
   * Check if visemes contain significant mouth movement
   */
  private hasSignificantMouthMovement(visemes: Partial<BlendShapeMap>): boolean {
    const threshold = 0.1; // Minimum value to consider "active"
    
    return MOUTH_SHAPES.some(shape => 
      (visemes[shape] || 0) > threshold
    );
  }

  /**
   * Update compositor configuration
   */
  updateConfig(newConfig: Partial<CompositorConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Reset internal state (useful when switching avatars or contexts)
   */
  reset() {
    this.lastOutput = {};
  }
}

// Convenience function for quick compositing
export function composeBlendshapes(
  inputs: BlendshapeInput, 
  config?: Partial<CompositorConfig>
): Partial<BlendShapeMap> {
  const compositor = new BlendshapeCompositor(config);
  return compositor.compose(inputs);
}
