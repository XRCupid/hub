import { BlendShapeMap } from '../types/blendshapes';

/**
 * Mock data for testing avatar integration without external APIs
 */

// Mock viseme data (lip sync)
export const mockVisemeFrames = [
  { audioOffset: 0.0, jawOpen: 0.0, mouthFunnel: 0.0 },
  { audioOffset: 0.1, jawOpen: 0.3, mouthFunnel: 0.2 },
  { audioOffset: 0.2, jawOpen: 0.6, mouthFunnel: 0.4 },
  { audioOffset: 0.3, jawOpen: 0.8, mouthFunnel: 0.6 },
  { audioOffset: 0.4, jawOpen: 0.5, mouthFunnel: 0.3 },
  { audioOffset: 0.5, jawOpen: 0.2, mouthFunnel: 0.1 },
  { audioOffset: 0.6, jawOpen: 0.0, mouthFunnel: 0.0 },
];

// Mock emotion data (prosody)
export const mockEmotions = [
  { name: 'joy', score: 0.8, timestamp: Date.now() },
  { name: 'surprise', score: 0.6, timestamp: Date.now() + 1000 },
  { name: 'sadness', score: 0.7, timestamp: Date.now() + 2000 },
  { name: 'anger', score: 0.5, timestamp: Date.now() + 3000 },
];

// Mock blendshape mappings for emotions
export const mockEmotionBlendshapes: Record<string, Partial<BlendShapeMap>> = {
  joy: {
    mouthSmileLeft: 0.8,
    mouthSmileRight: 0.8,
    eyeSquintLeft: 0.3,
    eyeSquintRight: 0.3,
    cheekPuff: 0.2
  },
  surprise: {
    browInnerUp: 0.9,
    browOuterUpLeft: 0.7,
    browOuterUpRight: 0.7,
    eyeWideLeft: 0.8,
    eyeWideRight: 0.8,
    jawOpen: 0.4,
    mouthFunnel: 0.3
  },
  sadness: {
    browDownLeft: 0.6,
    browDownRight: 0.6,
    mouthFrownLeft: 0.7,
    mouthFrownRight: 0.7,
    eyeSquintLeft: 0.4,
    eyeSquintRight: 0.4
  },
  anger: {
    browDownLeft: 0.8,
    browDownRight: 0.8,
    eyeSquintLeft: 0.9,
    eyeSquintRight: 0.9,
    noseSneerLeft: 0.5,
    noseSneerRight: 0.5,
    mouthPressLeft: 0.6,
    mouthPressRight: 0.6
  }
};

// Function to simulate live viseme data
export function simulateVisemeStream(callback: (visemes: Partial<BlendShapeMap>) => void) {
  let frameIndex = 0;
  
  const interval = setInterval(() => {
    if (frameIndex >= mockVisemeFrames.length) {
      clearInterval(interval);
      callback({}); // End with neutral
      return;
    }
    
    const frame = mockVisemeFrames[frameIndex];
    const visemes: Partial<BlendShapeMap> = {
      jawOpen: frame.jawOpen,
      mouthFunnel: frame.mouthFunnel
    };
    
    callback(visemes);
    frameIndex++;
  }, 100); // 10 FPS
  
  return interval;
}

// Function to simulate emotion changes
export function simulateEmotionStream(callback: (emotion: { name: string; score: number }) => void) {
  let emotionIndex = 0;
  
  const interval = setInterval(() => {
    if (emotionIndex >= mockEmotions.length) {
      emotionIndex = 0; // Loop
    }
    
    const emotion = mockEmotions[emotionIndex];
    callback({ name: emotion.name, score: emotion.score });
    emotionIndex++;
  }, 2000); // Change emotion every 2 seconds
  
  return interval;
}

// Helper to get blendshapes for a specific emotion
export function getEmotionBlendshapes(emotionName: string): Partial<BlendShapeMap> {
  return mockEmotionBlendshapes[emotionName] || {};
}

// Export for browser console testing
(window as any).mockAvatarData = {
  simulateVisemeStream,
  simulateEmotionStream,
  getEmotionBlendshapes,
  mockEmotions,
  mockVisemeFrames
};
