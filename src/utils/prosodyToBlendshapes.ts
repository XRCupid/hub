import { ARKitBlendshapeNamesList, type BlendshapeKey, type BlendShapeMap } from '../types/blendshapes';

const PROSODY_BLENDSHAPE_AMPLIFICATION_FACTOR = 7.0; // Increased for more dramatic expressions

// Map each prosody emotion to blendshape contributions (values are multipliers for score)
const PROSODY_EMOTION_TO_BLENDSHAPE: Record<string, Partial<BlendShapeMap>> = {
  joy: {
    mouthSmileLeft: 1.2,
    mouthSmileRight: 1.2,
    cheekSquintLeft: 0.8,
    cheekSquintRight: 0.8,
    eyeWideLeft: 0.3,
    eyeWideRight: 0.3,
    browOuterUpLeft: 1.0, // Strong eyebrow raise for joy
    browOuterUpRight: 1.0,
    cheekPuff: 0.2, // Slight cheek puff for happiness
  },
  sadness: {
    mouthFrownLeft: 1.2,
    mouthFrownRight: 1.2,
    browInnerUp: 1.0, // Strong inner brow raise (sad puppy eyes)
    browDownLeft: 0.6,
    browDownRight: 0.6,
    eyeLookDownLeft: 0.4,
    eyeLookDownRight: 0.4,
    mouthLowerDownLeft: 0.5, // Droopy mouth corners
    mouthLowerDownRight: 0.5,
  },
  anger: {
    browDownLeft: 1.2, // Very strong brow furrow
    browDownRight: 1.2,
    browInnerUp: 0.3, // Slight inner brow tension
    mouthPressLeft: 0.8,
    mouthPressRight: 0.8,
    eyeSquintLeft: 0.6,
    eyeSquintRight: 0.6,
    noseSneerLeft: 0.4, // Nostril flare for anger
    noseSneerRight: 0.4,
    mouthUpperUpLeft: 0.3, // Slight snarl
    mouthUpperUpRight: 0.3,
  },
  surprise: {
    jawOpen: 0.9,
    eyeWideLeft: 1.2, // Very wide eyes
    eyeWideRight: 1.2,
    browOuterUpLeft: 1.2, // Dramatic eyebrow raise
    browOuterUpRight: 1.2,
    browInnerUp: 0.8, // Full brow raise
    mouthFunnel: 0.3, // Slight "O" mouth shape
  },
  fear: {
    mouthStretchLeft: 0.9,
    mouthStretchRight: 0.9,
    eyeWideLeft: 1.0,
    eyeWideRight: 1.0,
    browInnerUp: 1.0, // Strong worried brow
    browOuterUpLeft: 0.7,
    browOuterUpRight: 0.7,
    jawOpen: 0.4, // Slight jaw drop in fear
  },
  disgust: {
    noseSneerLeft: 0.8,
    noseSneerRight: 0.8,
    mouthUpperUpLeft: 0.7, // Upper lip curl
    mouthUpperUpRight: 0.7,
    eyeSquintLeft: 0.5,
    eyeSquintRight: 0.5,
    browDownLeft: 0.4,
    browDownRight: 0.4,
  },
  contempt: {
    mouthSmileLeft: 0.2, // Asymmetric smirk
    mouthSmileRight: 0.7,
    eyeSquintLeft: 0.3,
    eyeSquintRight: 0.6,
    browDownLeft: 0.2,
    browDownRight: 0.5,
  },
  excitement: {
    mouthSmileLeft: 1.0,
    mouthSmileRight: 1.0,
    eyeWideLeft: 0.8,
    eyeWideRight: 0.8,
    browOuterUpLeft: 0.9,
    browOuterUpRight: 0.9,
    cheekSquintLeft: 0.6,
    cheekSquintRight: 0.6,
    jawOpen: 0.3, // Slight excitement jaw drop
  },
  contentment: {
    mouthSmileLeft: 0.4,
    mouthSmileRight: 0.4,
    eyeSquintLeft: 0.2, // Gentle squint for contentment
    eyeSquintRight: 0.2,
    browOuterUpLeft: 0.2,
    browOuterUpRight: 0.2,
  },
  confusion: {
    browDownLeft: 0.6,
    browOuterUpRight: 0.8, // Asymmetric brow for confusion
    browInnerUp: 0.4,
    mouthPucker: 0.4,
    eyeSquintLeft: 0.3,
    jawOpen: 0.2,
  },
  calm: {
    mouthSmileLeft: 0.15,
    mouthSmileRight: 0.15,
    eyeSquintLeft: 0.1, // Very subtle relaxed expression
    eyeSquintRight: 0.1,
  },
  // Add more emotions that might come from Hume
  amusement: {
    mouthSmileLeft: 0.8,
    mouthSmileRight: 0.8,
    cheekSquintLeft: 0.7,
    cheekSquintRight: 0.7,
    browOuterUpLeft: 0.5,
    browOuterUpRight: 0.5,
  },
  concentration: {
    browDownLeft: 0.5,
    browDownRight: 0.5,
    browInnerUp: 0.3,
    eyeSquintLeft: 0.4,
    eyeSquintRight: 0.4,
  },
};

export const prosodyToBlendshapes = (prosodyScores: Record<string, number>): BlendShapeMap => {
  console.log('[prosodyToBlendshapes] Received prosodyScore keys:', Object.keys(prosodyScores).join(', '));

  // Start with all zeros  // Initialize blendshapes to 0
  const blendshapes: BlendShapeMap = ARKitBlendshapeNamesList.reduce((acc: BlendShapeMap, shapeName: BlendshapeKey) => {
    acc[shapeName] = 0;
    return acc;
  }, {} as BlendShapeMap);

  console.log('[prosodyToBlendshapes] Processing emotions...');
  for (const [emotion, score] of Object.entries(prosodyScores)) {
    const weights = PROSODY_EMOTION_TO_BLENDSHAPE[emotion.toLowerCase()];
    if (!weights) {
      console.log(`[prosodyToBlendshapes] No weights found for emotion: ${emotion}. Skipping.`);
      continue;
    }
    console.log(`[prosodyToBlendshapes] Processing emotion: ${emotion}, Score: ${score.toFixed(4)}`);
    for (const [blend, weight] of Object.entries(weights)) {
      const shapeKey = blend as BlendshapeKey;
      const currentVal = blendshapes[shapeKey] || 0;
      const addition = score * (weight as number) * PROSODY_BLENDSHAPE_AMPLIFICATION_FACTOR;
      blendshapes[shapeKey] = Math.min(1, Math.max(0, currentVal + addition));
      // Optional detailed logging for each blendshape change:
      // console.log(`[prosodyToBlendshapes]   - Blendshape: ${shapeKey}, Weight: ${weight}, Addition: ${addition.toFixed(4)}, New Value: ${blendshapes[shapeKey].toFixed(4)}`);
    }
  }
  console.log(`[prosodyToBlendshapes] Final combined blendshapes count: ${Object.keys(blendshapes).length}, sum of values: ${Object.values(blendshapes).reduce((s, v) => s + v, 0).toFixed(4)}`);
  return blendshapes;
}
