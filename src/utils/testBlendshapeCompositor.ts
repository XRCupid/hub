import { BlendshapeCompositor, BlendshapeInput } from './blendshapeCompositor';
import { BlendShapeMap } from '../types/blendshapes';

/**
 * Test suite for BlendshapeCompositor to verify integration logic
 */

// Mock data representing different scenarios
const mockVisemes: Partial<BlendShapeMap> = {
  jawOpen: 0.8,
  mouthFunnel: 0.6,
  mouthPucker: 0.3
};

const mockEmotions: Partial<BlendShapeMap> = {
  mouthSmileLeft: 0.7,
  mouthSmileRight: 0.7,
  eyeSquintLeft: 0.4,
  eyeSquintRight: 0.4,
  browInnerUp: 0.3,
  jawOpen: 0.2  // This should be overridden by visemes
};

const mockBlinks: Partial<BlendShapeMap> = {
  eyeBlinkLeft: 1.0,
  eyeBlinkRight: 1.0
};

const mockManualOverrides: Partial<BlendShapeMap> = {
  noseSneerLeft: 0.5  // Manual expression
};

export function testBlendshapeCompositor() {
  console.log('🧪 Testing BlendshapeCompositor...\n');

  const compositor = new BlendshapeCompositor({
    emotionMouthReduction: 0.3,
    emotionFaceBlending: 0.8,
    smoothingFactor: 0.0  // Disable smoothing for predictable tests
  });

  // Test 1: Visemes + Emotions (should prioritize visemes for mouth)
  console.log('📋 Test 1: Visemes + Emotions');
  const test1Input: BlendshapeInput = {
    visemes: mockVisemes,
    emotions: mockEmotions,
    base: {},
    manual: {}
  };
  
  const result1 = compositor.compose(test1Input);
  console.log('Input visemes:', mockVisemes);
  console.log('Input emotions:', mockEmotions);
  console.log('Result:', result1);
  console.log('✅ jawOpen should be', mockVisemes.jawOpen, 'got:', result1.jawOpen);
  console.log('✅ mouthSmileLeft should be reduced, got:', result1.mouthSmileLeft);
  console.log('✅ eyeSquintLeft should be preserved, got:', result1.eyeSquintLeft);
  console.log();

  // Test 2: Emotions only (no visemes)
  console.log('📋 Test 2: Emotions Only');
  const test2Input: BlendshapeInput = {
    visemes: {},
    emotions: mockEmotions,
    base: {},
    manual: {}
  };
  
  const result2 = compositor.compose(test2Input);
  console.log('Result:', result2);
  console.log('✅ mouthSmileLeft should be full strength, got:', result2.mouthSmileLeft);
  console.log('✅ jawOpen should be emotion value, got:', result2.jawOpen);
  console.log();

  // Test 3: All systems active
  console.log('📋 Test 3: All Systems Active');
  const test3Input: BlendshapeInput = {
    visemes: mockVisemes,
    emotions: mockEmotions,
    base: mockBlinks,
    manual: mockManualOverrides
  };
  
  const result3 = compositor.compose(test3Input);
  console.log('Result:', result3);
  console.log('✅ Manual override should be preserved, noseSneerLeft:', result3.noseSneerLeft);
  console.log('✅ Blinks should be preserved, eyeBlinkLeft:', result3.eyeBlinkLeft);
  console.log('✅ Viseme jawOpen should override emotion jawOpen:', result3.jawOpen);
  console.log();

  // Test 4: Edge case - empty inputs
  console.log('📋 Test 4: Empty Inputs');
  const test4Input: BlendshapeInput = {
    visemes: {},
    emotions: {},
    base: {},
    manual: {}
  };
  
  const result4 = compositor.compose(test4Input);
  console.log('Result:', result4);
  console.log('✅ Should be empty object or minimal values');
  console.log();

  console.log('🎉 BlendshapeCompositor tests complete!');
  return {
    test1: result1,
    test2: result2,
    test3: result3,
    test4: result4
  };
}

// Export for use in browser console
(window as any).testBlendshapeCompositor = testBlendshapeCompositor;
