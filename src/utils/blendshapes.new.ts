/**
 * ARKit/Ready Player Me blendshape names
 * These are the standard blendshape names used by ARKit and Ready Player Me
 * Reference: https://arkit-face-blendhapes.com/
 */
export type BlendshapeKey = 
  // Core Expression
  | 'browDownLeft' | 'browDownRight' | 'browInnerUp' | 'browOuterUpLeft' | 'browOuterUpRight'
  | 'cheekPuff' | 'cheekSquintLeft' | 'cheekSquintRight'
  | 'eyeBlinkLeft' | 'eyeBlinkRight' | 'eyeLookDownLeft' | 'eyeLookDownRight'
  | 'eyeLookInLeft' | 'eyeLookInRight' | 'eyeLookOutLeft' | 'eyeLookOutRight'
  | 'eyeLookUpLeft' | 'eyeLookUpRight' | 'eyeSquintLeft' | 'eyeSquintRight'
  | 'eyeWideLeft' | 'eyeWideRight'
  | 'jawForward' | 'jawLeft' | 'jawRight' | 'jawOpen'
  | 'mouthClose' | 'mouthDimpleLeft' | 'mouthDimpleRight' | 'mouthFrownLeft'
  | 'mouthFrownRight' | 'mouthFunnel' | 'mouthLeft' | 'mouthLowerDownLeft'
  | 'mouthLowerDownRight' | 'mouthPressLeft' | 'mouthPressRight' | 'mouthPucker'
  | 'mouthRight' | 'mouthRollLower' | 'mouthRollUpper' | 'mouthShrugLower'
  | 'mouthShrugUpper' | 'mouthSmileLeft' | 'mouthSmileRight' | 'mouthStretchLeft'
  | 'mouthStretchRight' | 'mouthUpperUpLeft' | 'mouthUpperUpRight'
  | 'noseSneerLeft' | 'noseSneerRight' | 'tongueOut';

/**
 * Type representing a set of blendshape weights
 * Maps each blendshape key to a number between 0 and 1
 */
export type BlendshapeWeights = {
  [key in BlendshapeKey]?: number;
};

/**
 * Phoneme to blendshape mapping
 * Maps phonemes to the corresponding mouth shapes
 * Based on the International Phonetic Alphabet (IPA)
 */
export const PHONEME_TO_BLENDSHAPE: Record<string, BlendshapeWeights> = {
  // Vowels
  'aa': { jawOpen: 0.7, mouthFunnel: 0.3 },  // father
  'ae': { jawOpen: 0.6, mouthStretchLeft: 0.3, mouthStretchRight: 0.3 },  // cat
  'ah': { jawOpen: 0.5, mouthFunnel: 0.2 },  // about
  'ao': { jawOpen: 0.6, mouthFunnel: 0.4 },  // dog
  'aw': { jawOpen: 0.5, mouthFunnel: 0.5 },  // house
  'ay': { jawOpen: 0.4, mouthSmileLeft: 0.3, mouthSmileRight: 0.3 },  // day
  'eh': { jawOpen: 0.4, mouthStretchLeft: 0.2, mouthStretchRight: 0.2 },  // bed
  'er': { jawOpen: 0.3, mouthFunnel: 0.3 },  // bird
  'ey': { jawOpen: 0.3, mouthSmileLeft: 0.5, mouthSmileRight: 0.5 },  // day (diphthong)
  'ih': { jawOpen: 0.2, mouthStretchLeft: 0.1, mouthStretchRight: 0.1 },  // bit
  'iy': { jawOpen: 0.1, mouthSmileLeft: 0.7, mouthSmileRight: 0.7 },  // see
  'ow': { jawOpen: 0.5, mouthFunnel: 0.5 },  // go
  'oy': { jawOpen: 0.4, mouthFunnel: 0.4, mouthSmileLeft: 0.2, mouthSmileRight: 0.2 },  // boy
  'uh': { jawOpen: 0.3, mouthFunnel: 0.2 },  // book
  'uw': { jawOpen: 0.1, mouthPucker: 0.8 },  // you
  
  // Consonants
  'b': { mouthClose: 1.0, mouthPressLeft: 0.5, mouthPressRight: 0.5 },
  'p': { mouthClose: 1.0, mouthPressLeft: 0.5, mouthPressRight: 0.5 },
  'm': { mouthClose: 1.0, mouthPressLeft: 0.5, mouthPressRight: 0.5 },
  'w': { mouthPucker: 0.7 },
  'f': { mouthLowerDownLeft: 0.7, mouthLowerDownRight: 0.7, mouthPressLeft: 0.5, mouthPressRight: 0.5 },
  'v': { mouthLowerDownLeft: 0.5, mouthLowerDownRight: 0.5, mouthPressLeft: 0.3, mouthPressRight: 0.3 },
  'th': { tongueOut: 0.5, jawOpen: 0.3 },
  'dh': { tongueOut: 0.3, jawOpen: 0.2 },
  't': { jawOpen: 0.1, mouthStretchLeft: 0.5, mouthStretchRight: 0.5 },
  'd': { jawOpen: 0.1, mouthStretchLeft: 0.4, mouthStretchRight: 0.4 },
  's': { jawOpen: 0.1, mouthStretchLeft: 0.6, mouthStretchRight: 0.6 },
  'z': { jawOpen: 0.1, mouthStretchLeft: 0.5, mouthStretchRight: 0.5 },
  'n': { jawOpen: 0.1, mouthStretchLeft: 0.3, mouthStretchRight: 0.3 },
  'l': { tongueOut: 0.3, jawOpen: 0.2 },
  'r': { mouthFunnel: 0.3, jawOpen: 0.2 },
  'sh': { mouthFunnel: 0.5, jawOpen: 0.2 },
  'zh': { mouthFunnel: 0.4, jawOpen: 0.2 },
  'y': { mouthSmileLeft: 0.5, mouthSmileRight: 0.5 },
  'k': { jawOpen: 0.3, mouthStretchLeft: 0.2, mouthStretchRight: 0.2 },
  'g': { jawOpen: 0.3, mouthStretchLeft: 0.1, mouthStretchRight: 0.1 },
  'ng': { jawOpen: 0.3, mouthStretchLeft: 0.1, mouthStretchRight: 0.1 },
  'hh': { jawOpen: 0.5, mouthStretchLeft: 0.3, mouthStretchRight: 0.3 },
  'ch': { mouthFunnel: 0.6, jawOpen: 0.2 },
  'jh': { mouthFunnel: 0.5, jawOpen: 0.2 },
};

/**
 * Emotion to blendshape mapping
 * Maps emotions to facial expressions using blendshapes
 */
export const EMOTION_TO_BLENDSHAPE: Record<string, BlendshapeWeights> = {
  // Basic emotions
  'neutral': {},
  
  'happiness': {
    mouthSmileLeft: 0.8,
    mouthSmileRight: 0.8,
    cheekSquintLeft: 0.6,
    cheekSquintRight: 0.6,
    eyeSquintLeft: 0.3,
    eyeSquintRight: 0.3,
  },
  
  'sadness': {
    browInnerUp: 0.7,
    browOuterUpLeft: 0.5,
    browOuterUpRight: 0.5,
    mouthFrownLeft: 0.6,
    mouthFrownRight: 0.6,
    jawForward: 0.2,
  },
  
  'anger': {
    browDownLeft: 0.8,
    browDownRight: 0.8,
    eyeSquintLeft: 0.7,
    eyeSquintRight: 0.7,
    mouthFunnel: 0.5,
    mouthPressLeft: 0.6,
    mouthPressRight: 0.6,
  },
  
  'fear': {
    browInnerUp: 0.8,
    browOuterUpLeft: 0.6,
    browOuterUpRight: 0.6,
    eyeWideLeft: 0.9,
    eyeWideRight: 0.9,
    mouthStretchLeft: 0.5,
    mouthStretchRight: 0.5,
  },
  
  'surprise': {
    browInnerUp: 0.9,
    eyeWideLeft: 0.8,
    eyeWideRight: 0.8,
    jawOpen: 0.5,
    mouthFunnel: 0.3,
  },
  
  'disgust': {
    noseSneerLeft: 0.8,
    noseSneerRight: 0.8,
    browDownLeft: 0.6,
    browDownRight: 0.6,
    mouthUpperUpLeft: 0.7,  // Using mouthUpperUpLeft instead of upperLipUpLeft
    mouthUpperUpRight: 0.7, // Using mouthUpperUpRight instead of upperLipUpRight
  },
  
  // Compound/Complex emotions
  'excitement': {
    mouthSmileLeft: 0.9,
    mouthSmileRight: 0.9,
    eyeWideLeft: 0.7,
    eyeWideRight: 0.7,
    browInnerUp: 0.5,
    jawOpen: 0.3,
  },
  
  'confusion': {
    browInnerUp: 0.6,
    browOuterUpLeft: 0.4,
    browOuterUpRight: 0.4,
    mouthPucker: 0.5,
  },
  
  'contempt': {
    mouthSmileLeft: 0.5,
    mouthSmileRight: 0.2,  // Asymmetrical smile
    noseSneerLeft: 0.3,
    eyeSquintLeft: 0.4,
  },
};

/**
 * Get the default blendshape weights (all zeros)
 */
export function getDefaultBlendshapeWeights(): BlendshapeWeights {
  const weights: BlendshapeWeights = {};
  
  // Initialize all blendshapes to 0
  const allBlendshapes: BlendshapeKey[] = [
    'browDownLeft', 'browDownRight', 'browInnerUp', 'browOuterUpLeft', 'browOuterUpRight',
    'cheekPuff', 'cheekSquintLeft', 'cheekSquintRight',
    'eyeBlinkLeft', 'eyeBlinkRight', 'eyeLookDownLeft', 'eyeLookDownRight',
    'eyeLookInLeft', 'eyeLookInRight', 'eyeLookOutLeft', 'eyeLookOutRight',
    'eyeLookUpLeft', 'eyeLookUpRight', 'eyeSquintLeft', 'eyeSquintRight',
    'eyeWideLeft', 'eyeWideRight',
    'jawForward', 'jawLeft', 'jawRight', 'jawOpen',
    'mouthClose', 'mouthDimpleLeft', 'mouthDimpleRight', 'mouthFrownLeft',
    'mouthFrownRight', 'mouthFunnel', 'mouthLeft', 'mouthLowerDownLeft',
    'mouthLowerDownRight', 'mouthPressLeft', 'mouthPressRight', 'mouthPucker',
    'mouthRight', 'mouthRollLower', 'mouthRollUpper', 'mouthShrugLower',
    'mouthShrugUpper', 'mouthSmileLeft', 'mouthSmileRight', 'mouthStretchLeft',
    'mouthStretchRight', 'mouthUpperUpLeft', 'mouthUpperUpRight',
    'noseSneerLeft', 'noseSneerRight', 'tongueOut'
  ];
  
  for (const key of allBlendshapes) {
    weights[key] = 0;
  }
  
  return weights;
}

/**
 * Interpolate between two blendshape states
 * @param start Starting blendshape state
 * @param end Target blendshape state
 * @param progress Interpolation progress (0 to 1)
 * @returns Interpolated blendshape state
 */
export function interpolateBlendshapes(
  start: BlendshapeWeights,
  end: BlendshapeWeights,
  progress: number
): BlendshapeWeights {
  const result: BlendshapeWeights = {};
  
  // Get all unique keys from both states
  const allKeys = new Set([
    ...Object.keys(start) as BlendshapeKey[],
    ...Object.keys(end) as BlendshapeKey[]
  ]);
  
  // Interpolate each blendshape weight
  for (const key of allKeys) {
    const startVal = start[key] ?? 0;
    const endVal = end[key] ?? 0;
    result[key] = startVal + (endVal - startVal) * progress;
  }
  
  return result;
}

/**
 * Apply smoothing to blendshape weights to reduce sudden changes
 * @param current Current blendshape state
 * @param target Target blendshape state
 * @param smoothingFactor Smoothing factor (0 to 1, where 1 is no smoothing)
 * @returns Smoothed blendshape state
 */
export function smoothBlendshapes(
  current: BlendshapeWeights,
  target: BlendshapeWeights,
  smoothingFactor: number = 0.8
): BlendshapeWeights {
  const smoothed: BlendshapeWeights = {};
  
  // Get all unique keys from both states
  const allKeys = new Set([
    ...Object.keys(current) as BlendshapeKey[],
    ...Object.keys(target) as BlendshapeKey[]
  ]);
  
  // Apply smoothing to each blendshape weight
  for (const key of allKeys) {
    const currentVal = current[key] ?? 0;
    const targetVal = target[key] ?? 0;
    smoothed[key] = currentVal + (targetVal - currentVal) * smoothingFactor;
  }
  
  return smoothed;
}

/**
 * Normalize blendshape weights to ensure they're within valid range (0 to 1)
 * @param weights Blendshape weights to normalize
 * @returns Normalized blendshape weights
 */
export function normalizeBlendshapeWeights(weights: BlendshapeWeights): BlendshapeWeights {
  const normalized: BlendshapeWeights = {};
  
  for (const [key, value] of Object.entries(weights)) {
    // Clamp values between 0 and 1
    normalized[key as BlendshapeKey] = Math.max(0, Math.min(1, value));
  }
  
  return normalized;
}
