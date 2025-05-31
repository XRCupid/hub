import React, { useEffect, useState } from 'react';
import { coachAwareTracking, TrackingState, CoachFeedback } from '../services/CoachAwareTrackingSystem';

export const TestPhysicalFeatures: React.FC = () => {
  const [trackingState, setTrackingState] = useState<TrackingState | null>(null);
  const [coachFeedback, setCoachFeedback] = useState<CoachFeedback | null>(null);

  useEffect(() => {
    // Set up coach callback
    coachAwareTracking.registerCoach((state: TrackingState, feedback: CoachFeedback) => {
      setTrackingState(state);
      setCoachFeedback(feedback);
      console.log('Tracking State:', state);
      console.log('Coach Feedback:', feedback);
    });

    // Start tracking
    coachAwareTracking.startTracking();

    // Simulate some tracking data after 2 seconds
    setTimeout(() => {
      coachAwareTracking.updateTrackingData({
        posture: {
          isOpen: true,
          isLeaning: true,
          shoulderTension: 0.3
        },
        eyeContact: {
          isLooking: true,
          duration: 3,
          quality: 0.8
        },
        gestures: {
          areOpen: true,
          isExpressive: true,
          frequency: 5
        },
        facial: {
          emotion: 'happy',
          intensity: 0.7,
          mirroring: true
        }
      });
    }, 2000);

    // Start an exercise after 4 seconds
    setTimeout(() => {
      coachAwareTracking.startExercise({
        name: 'Eye Contact Practice',
        type: 'eyeContact',
        duration: 30,
        targetMetrics: {
          eyeContact: {
            isLooking: true,
            duration: 5,
            quality: 0.8,
            feedback: ''
          }
        },
        instructions: [
          'Look directly at your partner',
          'Maintain soft, natural eye contact',
          'Blink naturally - don\'t stare'
        ]
      });
    }, 4000);

    return () => {
      coachAwareTracking.stopTracking();
    };
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '10px' }}>
      <h2>Physical Features Test</h2>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Tracking State:</h3>
        <pre style={{ backgroundColor: 'white', padding: '10px', borderRadius: '5px' }}>
          {JSON.stringify(trackingState, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Coach Feedback:</h3>
        <pre style={{ backgroundColor: 'white', padding: '10px', borderRadius: '5px' }}>
          {JSON.stringify(coachFeedback, null, 2)}
        </pre>
      </div>
    </div>
  );
};
