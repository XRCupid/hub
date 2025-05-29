import { BlendShapeMap, BlendshapeKey } from '../types/blendshapes'; // Assuming BlendshapeKey is your ARKitBlendshapeName
export type { BlendShapeMap };

// Define Emotion type if not already centrally available
interface Emotion {
  name: string;
  score: number;
}

// Expanded and TitleCased map
// Values are target blendshape intensities when emotion score is 1.0
const HUME_EMOTION_TO_ARKIT_MAP: Record<string, Partial<BlendShapeMap>> = {
  // Positive, High Arousal
  Joy: { mouthSmileLeft: 0.8, mouthSmileRight: 0.8, cheekSquintLeft: 0.6, cheekSquintRight: 0.6, eyeSquintLeft: 0.3, eyeSquintRight: 0.3 },
  Amusement: { mouthSmileLeft: 0.7, mouthSmileRight: 0.7, cheekSquintLeft: 0.5, cheekSquintRight: 0.5 },
  Excitement: { eyeWideLeft: 0.4, eyeWideRight: 0.4, mouthOpen: 0.3, jawOpen: 0.2, browInnerUp: 0.3 },
  Awe: { mouthOpen: 0.4, jawOpen: 0.3, eyeWideLeft: 0.5, eyeWideRight: 0.5, browInnerUp: 0.4 },
  Admiration: { mouthSmileLeft: 0.3, mouthSmileRight: 0.3, eyeLookUpLeft: 0.2, eyeLookUpRight: 0.2, browInnerUp: 0.2 }, // Softer smile, upward gaze
  Love: { mouthSmileLeft: 0.5, mouthSmileRight: 0.5, eyeSquintLeft: 0.2, eyeSquintRight: 0.2, browOuterUpLeft: 0.1, browOuterUpRight: 0.1 }, // Gentle smile

  // Positive, Low Arousal
  Calmness: { eyeSquintLeft: 0.1, eyeSquintRight: 0.1, mouthClose: 0.2 }, // Relaxed eyes, slightly closed mouth
  Contentment: { mouthSmileLeft: 0.2, mouthSmileRight: 0.2 }, // Gentle, subtle smile
  Interest: { browInnerUp: 0.4, eyeWideLeft: 0.2, eyeWideRight: 0.2, jawOpen: 0.15 }, // Renamed mouthOpen to mouthSlightOpen for clarity, maps to jawOpen or mouthOpen
  Serenity: { eyeSquintLeft: 0.05, eyeSquintRight: 0.05 }, // Very subtle relaxation

  // Negative, High Arousal
  Anger: { browDownLeft: 0.9, browDownRight: 0.9, noseSneerLeft: 0.7, noseSneerRight: 0.7, mouthShrugUpper: 0.5, eyeSquintLeft: 0.6, eyeSquintRight: 0.6 },
  Fear: { eyeWideLeft: 0.9, eyeWideRight: 0.9, mouthOpen: 0.5, jawOpen: 0.4, browInnerUp: 0.7, mouthStretchLeft: 0.3, mouthStretchRight: 0.3 },
  Horror: { eyeWideLeft: 1.0, eyeWideRight: 1.0, mouthOpen: 0.7, jawOpen: 0.6, browInnerUp: 0.8, mouthShrugLower: 0.5 },
  Distress: { mouthFrownLeft: 0.6, mouthFrownRight: 0.6, browInnerUp: 0.7, eyeSquintLeft: 0.4, eyeSquintRight: 0.4 },

  // Negative, Low Arousal
  Sadness: { mouthFrownLeft: 0.7, mouthFrownRight: 0.7, browInnerUp: 0.6, browDownLeft: 0.2, browDownRight: 0.2, eyeLookDownLeft: 0.3, eyeLookDownRight: 0.3 },
  Disappointment: { mouthFrownLeft: 0.5, mouthFrownRight: 0.5, browDownLeft: 0.4, browDownRight: 0.4 },
  Tiredness: { eyeSquintLeft: 0.5, eyeSquintRight: 0.5, browDownLeft: 0.3, browDownRight: 0.3, jawOpen: 0.1, mouthOpen: 0.1, eyeLookDownLeft: 0.2, eyeLookDownRight: 0.2 },
  Boredom: { eyeLookDownLeft: 0.4, eyeLookDownRight: 0.4, mouthShrugLower: 0.3, jawOpen: 0.05 },
  Guilt: { browDownLeft: 0.5, browDownRight: 0.5, eyeLookDownLeft: 0.5, eyeLookDownRight: 0.5, mouthPressLeft: 0.2, mouthPressRight: 0.2 },

  // Other
  Surprise: { jawOpen: 0.5, eyeWideLeft: 0.8, eyeWideRight: 0.8, browInnerUp: 0.7, mouthOpen: 0.4 },
  Disgust: { noseSneerLeft: 0.8, noseSneerRight: 0.8, mouthUpperUpLeft: 0.6, mouthUpperUpRight: 0.6, browDownLeft: 0.5, browDownRight: 0.5 },
  Contempt: { mouthSmileLeft: 0.4, noseSneerRight: 0.5 }, // Asymmetrical smile/sneer
  Embarrassment: { cheekPuff: 0.3, eyeLookDownLeft: 0.4, eyeLookDownRight: 0.4, mouthPressLeft: 0.1, mouthPressRight: 0.1 },
  Confusion: { browDownLeft: 0.3, browOuterUpRight: 0.3, mouthPucker: 0.2 }, // One brow down, one up (simplified)

  Neutral: {
    // Explicitly define neutral with very low values or zeros
    // eyeBlinkLeft: 0.01, // slight ambient motion if desired
    // eyeBlinkRight: 0.01,
  },
};

// Renamed from original emotionToBlendshapes for clarity if needed, or keep as is.
// This function processes a SINGLE emotion object.
function getBlendshapesForSingleEmotion(emotion: Emotion): Partial<BlendShapeMap> {
  if (!emotion || !emotion.name) return {};

  // Use emotion.name directly (assuming it's TitleCase from Hume)
  const baseShapes = HUME_EMOTION_TO_ARKIT_MAP[emotion.name];
  if (!baseShapes) {
    // console.log(`[emotionMappings] No direct blendshape map for emotion: ${emotion.name}`);
    return {};
  }

  const intensity = emotion.score; // Direct score application (0-1)

  return Object.fromEntries(
    Object.entries(baseShapes).map(([key, value]) => [
      key as BlendshapeKey, // Cast key to BlendshapeKey
      (value as number) * intensity,
    ])
  ) as Partial<BlendShapeMap>;
}

export function getTopEmotion(emotions: Emotion[]): Emotion | null {
  if (!emotions || emotions.length === 0) {
    return null;
  }
  return emotions.reduce(
    (top, current) => (current.score > (top?.score || 0) ? current : top),
    emotions[0] // Initialize with the first emotion to handle single-item arrays correctly
  );
}

// This will be the main function imported by EmotionDrivenAvatar.tsx
export function mapEmotionsToBlendshapes(emotions: Emotion[]): BlendShapeMap {
  const finalBlendshapes = {} as BlendShapeMap;

  // Initialize all known ARKit blendshapes to 0 to ensure a clean slate
  // This step can be skipped if TestAvatar/SimAvatar3D correctly resets influences each frame
  // For now, let's assume it's safer to provide a full map.
  // Consider importing ARKitBlendshapeNamesList from types/blendshapes if available
  const allArkitShapes: BlendshapeKey[] = ["browDownLeft", "browDownRight", "browInnerUp", "browOuterUpLeft", "browOuterUpRight", "cheekPuff", "cheekSquintLeft", "cheekSquintRight", "eyeBlinkLeft", "eyeBlinkRight", "eyeLookDownLeft", "eyeLookDownRight", "eyeLookInLeft", "eyeLookInRight", "eyeLookOutLeft", "eyeLookOutRight", "eyeLookUpLeft", "eyeLookUpRight", "eyeSquintLeft", "eyeSquintRight", "eyeWideLeft", "eyeWideRight", "jawForward", "jawLeft", "jawOpen", "jawRight", "mouthClose", "mouthDimpleLeft", "mouthDimpleRight", "mouthFrownLeft", "mouthFrownRight", "mouthFunnel", "mouthLeft", "mouthLowerDownLeft", "mouthLowerDownRight", "mouthPressLeft", "mouthPressRight", "mouthPucker", "mouthRight", "mouthRollLower", "mouthRollUpper", "mouthShrugLower", "mouthShrugUpper", "mouthSmileLeft", "mouthSmileRight", "mouthStretchLeft", "mouthStretchRight", "mouthUpperUpLeft", "mouthUpperUpRight", "noseSneerLeft", "noseSneerRight", "tongueOut"]; // Add all ARKit names
  allArkitShapes.forEach(shape => finalBlendshapes[shape] = 0);


  const topEmotion = getTopEmotion(emotions);

  if (topEmotion) {
    // console.log(`[mapEmotionsToBlendshapes] Top emotion: ${topEmotion.name}, Score: ${topEmotion.score.toFixed(3)}`);
    const topEmotionBlendshapes = getBlendshapesForSingleEmotion(topEmotion);
    
    for (const [key, value] of Object.entries(topEmotionBlendshapes)) {
      finalBlendshapes[key as BlendshapeKey] = value;
    }
  } else {
    // console.log('[mapEmotionsToBlendshapes] No top emotion found or emotions array empty.');
    // Return the zeroed map for neutral if no emotions
  }
  
  // console.log('[mapEmotionsToBlendshapes] Final combined blendshapes:', JSON.stringify(finalBlendshapes));
  return finalBlendshapes;
}

// Example of how one might blend multiple emotions in the future (more complex):
/*
export function mapEmotionsToBlendshapesAdvanced(emotions: Emotion[]): BlendShapeMap {
  const allBlendshapes: Record<BlendshapeKey, number> = {} as Record<BlendshapeKey, number>;
  ARKitBlendshapeNamesList.forEach(name => allBlendshapes[name] = 0); // Initialize

  // Consider only top N emotions or those above a threshold
  const significantEmotions = emotions.filter(e => e.score > 0.1).sort((a,b) => b.score - a.score).slice(0, 3);

  significantEmotions.forEach(emotion => {
    const emotionShapes = getBlendshapesForSingleEmotion(emotion);
    for (const shapeName_str in emotionShapes) {
      const shapeName = shapeName_str as BlendshapeKey;
      const currentValue = allBlendshapes[shapeName] || 0;
      const newValue = emotionShapes[shapeName]!;
      // Simple averaging or max, could be more sophisticated (e.g., weighted by score)
      allBlendshapes[shapeName] = Math.max(currentValue, newValue); 
    }
  });
  return allBlendshapes;
}
*/
