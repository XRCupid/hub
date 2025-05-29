import { useState, useEffect, useCallback } from 'react';

interface EmotionScores {
  happy?: number;
  sad?: number;
  angry?: number;
  surprised?: number;
  neutral?: number;
  phoneme?: string;
  [key: string]: number | string | undefined;
}

interface BlendShapes {
  // Mouth
  mouthClose: number;
  mouthSmileLeft: number;
  mouthSmileRight: number;
  mouthFrownLeft: number;
  mouthFrownRight: number;
  mouthPressLeft: number;
  mouthPressRight: number;
  mouthLowerDownLeft: number;
  mouthLowerDownRight: number;
  mouthUpperUpLeft: number;
  mouthUpperUpRight: number;
  mouthOpen: number;
  mouthPucker: number;
  mouthFunnel: number;
  mouthRollLower: number;
  mouthRollUpper: number;
  mouthShrugLower: number;
  mouthShrugUpper: number;
  
  // Eyes
  eyeBlinkLeft: number;
  eyeBlinkRight: number;
  eyeSquintLeft: number;
  eyeSquintRight: number;
  eyeWideLeft: number;
  eyeWideRight: number;
  eyeLookInLeft: number;
  eyeLookInRight: number;
  eyeLookOutLeft: number;
  eyeLookOutRight: number;
  eyeLookUpLeft: number;
  eyeLookUpRight: number;
  eyeLookDownLeft: number;
  eyeLookDownRight: number;
  
  // Brows
  browDownLeft: number;
  browDownRight: number;
  browInnerUp: number;
  browOuterUpLeft: number;
  browOuterUpRight: number;
  
  // Other
  cheekPuff: number;
  cheekSquintLeft: number;
  cheekSquintRight: number;
  noseSneerLeft: number;
  noseSneerRight: number;
  tongueOut: number;
  jawOpen: number;
  jawForward: number;
  jawLeft: number;
  jawRight: number;
  
  // Additional blendshapes
  [key: string]: number;
}

interface EmotionPrediction {
  name: string;
  score: number;
}

interface Prediction {
  emotions?: EmotionPrediction[];
}

interface FaceData {
  predictions?: Prediction[];
  emotions?: EmotionScores;
}

export interface HumeResponse {
  face?: FaceData;
  predictions?: Prediction[];
  emotions?: EmotionScores;
}

interface UseAvatarBlendShapesReturn {
  blendShapes: Partial<BlendShapes>;
  applyPhoneme: (phoneme: string) => void;
  resetBlendShapes: () => void;
}

/**
 * Maps Hume AI emotion scores to avatar blendshapes
 */
const mapEmotionsToBlendShapes = (emotions: EmotionScores): Partial<BlendShapes> => {
  const {
    happy = 0,
    sad = 0,
    angry = 0,
    surprised = 0,
    neutral = 0,
    ...otherEmotions
  } = emotions;

  // Default neutral expression
  const blendShapes: Partial<BlendShapes> = {
    // Mouth
    mouthClose: 0.5, // Slightly open for neutral
    mouthSmileLeft: 0,
    mouthSmileRight: 0,
    mouthFrownLeft: 0,
    mouthFrownRight: 0,
    mouthPressLeft: 0,
    mouthPressRight: 0,
    mouthLowerDownLeft: 0,
    mouthLowerDownRight: 0,
    mouthUpperUpLeft: 0,
    mouthUpperUpRight: 0,
    mouthOpen: 0,
    mouthPucker: 0,
    mouthFunnel: 0,
    mouthRollLower: 0,
    mouthRollUpper: 0,
    mouthShrugLower: 0,
    mouthShrugUpper: 0,
    
    // Eyes
    eyeBlinkLeft: 0,
    eyeBlinkRight: 0,
    eyeSquintLeft: 0,
    eyeSquintRight: 0,
    eyeWideLeft: 0,
    eyeWideRight: 0,
    eyeLookInLeft: 0,
    eyeLookInRight: 0,
    eyeLookOutLeft: 0,
    eyeLookOutRight: 0,
    eyeLookUpLeft: 0,
    eyeLookUpRight: 0,
    eyeLookDownLeft: 0,
    eyeLookDownRight: 0,
    
    // Brows
    browDownLeft: 0,
    browDownRight: 0,
    browInnerUp: 0,
    browOuterUpLeft: 0,
    browOuterUpRight: 0,
    
    // Other
    cheekPuff: 0,
    cheekSquintLeft: 0,
    cheekSquintRight: 0,
    noseSneerLeft: 0,
    noseSneerRight: 0,
    tongueOut: 0,
    jawOpen: 0,
    jawForward: 0,
    jawLeft: 0,
    jawRight: 0,
  };

  // Apply emotion-based blendshapes
  if (happy > 0.3) {
    blendShapes.mouthSmileLeft = happy;
    blendShapes.mouthSmileRight = happy;
    blendShapes.cheekSquintLeft = happy * 0.8;
    blendShapes.cheekSquintRight = happy * 0.8;
    blendShapes.eyeSquintLeft = happy * 0.5;
    blendShapes.eyeSquintRight = happy * 0.5;
  }

  if (sad > 0.3) {
    blendShapes.mouthFrownLeft = sad * 0.7;
    blendShapes.mouthFrownRight = sad * 0.7;
    blendShapes.browInnerUp = sad * 0.5;
    blendShapes.browOuterUpLeft = sad * 0.3;
    blendShapes.browOuterUpRight = sad * 0.3;
  }

  if (angry > 0.3) {
    blendShapes.browDownLeft = angry * 0.8;
    blendShapes.browDownRight = angry * 0.8;
    blendShapes.noseSneerLeft = angry * 0.5;
    blendShapes.noseSneerRight = angry * 0.5;
    blendShapes.mouthPressLeft = angry * 0.6;
    blendShapes.mouthPressRight = angry * 0.6;
  }

  if (surprised > 0.3) {
    blendShapes.browInnerUp = Math.max(blendShapes.browInnerUp || 0, surprised * 0.8);
    blendShapes.browOuterUpLeft = Math.max(blendShapes.browOuterUpLeft || 0, surprised * 0.8);
    blendShapes.browOuterUpRight = Math.max(blendShapes.browOuterUpRight || 0, surprised * 0.8);
    blendShapes.eyeWideLeft = surprised * 0.9;
    blendShapes.eyeWideRight = surprised * 0.9;
    blendShapes.jawOpen = surprised * 0.5;
  }

  // Handle phonemes if present
  if (emotions.phoneme) {
    const phoneme = emotions.phoneme.toString().toUpperCase();
    
    // Reset mouth shapes when phoneme is present
    blendShapes.mouthClose = 0;
    blendShapes.mouthOpen = 0;
    blendShapes.mouthPucker = 0;
    blendShapes.mouthFunnel = 0;
    
    // Map phonemes to mouth shapes
    if (['AA', 'AE', 'AH', 'AY', 'AW'].includes(phoneme)) {
      // Open mouth for wide vowel sounds
      blendShapes.jawOpen = 0.7;
      blendShapes.mouthFunnel = 0.3;
    } else if (['EE', 'IH', 'IY'].includes(phoneme)) {
      // Smile for E and I sounds
      blendShapes.mouthSmileLeft = 0.8;
      blendShapes.mouthSmileRight = 0.8;
      blendShapes.jawOpen = 0.3;
    } else if (['OO', 'UW', 'UH'].includes(phoneme)) {
      // Pucker for O and U sounds
      blendShapes.mouthPucker = 0.7;
      blendShapes.jawOpen = 0.4;
    } else if (['M', 'B', 'P'].includes(phoneme)) {
      // Closed mouth for M, B, P sounds
      blendShapes.mouthClose = 1.0;
      blendShapes.jawOpen = 0.1;
    } else if (['F', 'V'].includes(phoneme)) {
      // Bite lower lip for F, V sounds
      blendShapes.mouthPressLeft = 0.5;
      blendShapes.mouthPressRight = 0.5;
    } else if (['TH', 'DH'].includes(phoneme)) {
      // Tongue between teeth for TH, DH sounds
      blendShapes.tongueOut = 0.5;
      blendShapes.jawOpen = 0.4;
    }
  }

  return blendShapes;
};

/**
 * Hook to manage avatar blendshapes based on emotion data
 */
const useAvatarBlendShapes = (emotionData: HumeResponse | null): UseAvatarBlendShapesReturn => {
  const [blendShapes, setBlendShapes] = useState<Partial<BlendShapes>>({});

  const extractEmotions = useCallback((data: HumeResponse): EmotionScores => {
    const emotions: EmotionScores = {};
    
    try {
      // Check different possible response formats from Hume AI
      if (data.face?.predictions?.[0]?.emotions) {
        // Format: { face: { predictions: [{ emotions: [...] }] } }
        data.face.predictions[0].emotions.forEach((e) => {
          emotions[e.name] = e.score;
        });
      } else if (data.face?.emotions) {
        // Format: { face: { emotions: { ... } } }
        Object.assign(emotions, data.face.emotions);
      } else if (data.predictions?.[0]?.emotions) {
        // Format: { predictions: [{ emotions: [...] }] }
        data.predictions[0].emotions.forEach((e) => {
          emotions[e.name] = e.score;
        });
      } else if (data.emotions) {
        // Format: { emotions: { ... } }
        Object.assign(emotions, data.emotions);
      }
    } catch (error) {
      console.error('Error extracting emotions:', error);
    }
    
    return emotions;
  }, []);

  const applyPhoneme = useCallback((phoneme: string) => {
    setBlendShapes(prev => ({
      ...prev,
      // Reset mouth shapes
      mouthClose: 0,
      mouthOpen: 0,
      mouthPucker: 0,
      mouthFunnel: 0,
      // Add phoneme-specific shapes
      ...(phoneme === 'AA' && { jawOpen: 0.7, mouthFunnel: 0.3 }),
      ...(phoneme === 'M' && { mouthClose: 1.0, jawOpen: 0.1 }),
      // Add more phoneme mappings as needed
    }));
  }, []);

  const resetBlendShapes = useCallback(() => {
    setBlendShapes({
      // Default neutral expression
      mouthClose: 0.5,
      mouthSmileLeft: 0,
      mouthSmileRight: 0,
      // ... other default values
    });
  }, []);

  useEffect(() => {
    if (!emotionData) return;

    try {
      const emotions = extractEmotions(emotionData);
      const newBlendShapes = mapEmotionsToBlendShapes(emotions);
      setBlendShapes(prev => ({
        ...prev,
        ...newBlendShapes
      }));
    } catch (error) {
      console.error('Error processing emotion data:', error);
    }
  }, [emotionData, extractEmotions]);

  return {
    blendShapes,
    applyPhoneme,
    resetBlendShapes,
  };
};

export default useAvatarBlendShapes;
