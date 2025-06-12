// Test script to validate tracking system
import { coachAwareTracking } from '../services/CoachAwareTrackingSystem';

export const testPhysicalTracking = () => {
  console.log('🧪 Testing Physical Communication Tracking...');
  
  // Test 1: Check if tracking system initializes
  console.log('✅ Coach-aware tracking system initialized:', coachAwareTracking);
  
  // Test 2: Set up coach callback
  coachAwareTracking.setCoachCallback((state, feedback) => {
    console.log('📊 Tracking State Update:', state);
    console.log('💬 Coach Feedback:', feedback);
  });
  
  // Test 3: Start tracking
  coachAwareTracking.startTracking();
  console.log('✅ Tracking started');
  
  // Test 4: Simulate tracking data
  const testData = {
    posture: {
      shoulderAlignment: 0.85,
      spineAlignment: 0.9,
      headTilt: 0,
      confidence: 0.8
    },
    eyeContact: {
      duration: 5,
      quality: 0.9,
      targetEngagement: 0.85
    },
    gestures: {
      frequency: 8,
      openness: 0.95,
      expressiveness: 0.85
    },
    facialExpression: {
      smile: 0.8,
      eyebrowRaise: 0.1,
      headNod: 0.3,
      emotionalValence: 0.85
    }
  };
  
  console.log('📤 Sending test tracking data:', testData);
  coachAwareTracking.updateTrackingData(testData);
  
  // Test 5: Get current state
  const currentState = coachAwareTracking.getCurrentState();
  console.log('📈 Current tracking state:', currentState);
  
  // Test 6: Test exercise mode
  console.log('🏃 Starting eye contact exercise...');
  coachAwareTracking.startExercise({
    id: 'test-eye-contact',
    name: 'Eye Contact Test',
    type: 'eye-contact',
    duration: 10,
    targetMetrics: {
      eyeContactDuration: 5,
      eyeContactQuality: 0.8
    },
    instructions: ['Look at the avatar', 'Maintain natural eye contact']
  });
  
  return {
    success: true,
    message: 'Physical tracking test completed. Check console for details.'
  };
};
