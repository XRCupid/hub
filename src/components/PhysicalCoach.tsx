// Physical Dating Coach Component
// Provides real-time feedback and guides physical exercises

import React, { useState, useEffect, useCallback } from 'react';
import { coachAwareTracking, TrackingState, CoachFeedback, PhysicalExercise } from '../services/CoachAwareTrackingSystem';
import './PhysicalCoach.css';

interface PhysicalCoachProps {
  isActive: boolean;
  onExerciseComplete?: (exercise: PhysicalExercise) => void;
}

export const PhysicalCoach: React.FC<PhysicalCoachProps> = ({
  isActive,
  onExerciseComplete
}) => {
  console.log('🎯 PhysicalCoach mounted, isActive:', isActive);

  const [trackingState, setTrackingState] = useState<TrackingState | null>(null);
  const [coachFeedback, setCoachFeedback] = useState<CoachFeedback | null>(null);
  const [currentExercise, setCurrentExercise] = useState<PhysicalExercise | null>(null);
  const [exerciseProgress, setExerciseProgress] = useState(0);
  const [coachMessage, setCoachMessage] = useState("Let's work on your physical presence!");

  console.log('🏃 PhysicalCoach rendered - isActive:', isActive);

  // Register with tracking system
  useEffect(() => {
    if (isActive) {
      console.log('📊 Setting up coach callback...');
      coachAwareTracking.registerCoach((state, feedback) => {
        console.log('📈 Received tracking update:', { state, feedback });
        setTrackingState(state);
        setCoachFeedback(feedback);
        
        // Update coach message based on feedback
        if (feedback.immediate.length > 0) {
          setCoachMessage(feedback.immediate[0]);
        } else if (feedback.praise.length > 0) {
          setCoachMessage(feedback.praise[0]);
        } else if (feedback.suggestions.length > 0) {
          setCoachMessage(feedback.suggestions[0]);
        }
      });

      // Start tracking
      console.log('🚀 Starting tracking system...');
      coachAwareTracking.startTracking();

      // Immediately simulate some data to test UI
      console.log('🧪 Simulating initial tracking data...');
      coachAwareTracking.updateTrackingData({
        posture: {
          isOpen: true,
          isLeaning: false,
          shoulderTension: 0.5
        },
        eyeContact: {
          isLooking: true,
          duration: 2,
          quality: 0.7
        },
        gestures: {
          areOpen: true,
          isExpressive: false,
          frequency: 3
        },
        facial: {
          emotion: 'neutral',
          intensity: 0.5,
          mirroring: false
        }
      });
    } else {
      coachAwareTracking.stopTracking();
    }

    return () => {
      console.log('🛑 Stopping tracking system...');
      coachAwareTracking.stopTracking();
    };
  }, [isActive]);

  // Handle exercise
  useEffect(() => {
    if (coachFeedback?.exercise && !currentExercise) {
      // Start new exercise
      setCurrentExercise(coachFeedback.exercise);
      setExerciseProgress(0);
      coachAwareTracking.startExercise(coachFeedback.exercise);
    }
  }, [coachFeedback?.exercise, currentExercise]);

  // Exercise timer
  useEffect(() => {
    if (currentExercise && exerciseProgress < currentExercise.duration) {
      const timer = setTimeout(() => {
        setExerciseProgress(prev => prev + 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (currentExercise && exerciseProgress >= currentExercise.duration) {
      // Exercise complete
      coachAwareTracking.endExercise();
      onExerciseComplete?.(currentExercise);
      setCurrentExercise(null);
      setExerciseProgress(0);
      setCoachMessage("Great job! Let's continue practicing.");
    }
  }, [currentExercise, exerciseProgress, onExerciseComplete]);

  const renderMetricBar = (label: string, value: number, color: string) => (
    <div className="metric-bar">
      <div className="metric-label">{label}</div>
      <div className="metric-track">
        <div 
          className="metric-fill" 
          style={{ 
            width: `${value * 100}%`,
            backgroundColor: color
          }}
        />
      </div>
      <div className="metric-value">{Math.round(value * 100)}%</div>
    </div>
  );

  const renderExercise = () => {
    if (!currentExercise) return null;

    const progress = (exerciseProgress / currentExercise.duration) * 100;
    const currentStep = Math.floor((exerciseProgress / currentExercise.duration) * currentExercise.instructions.length);
    const instruction = currentExercise.instructions[currentStep] || currentExercise.instructions[currentExercise.instructions.length - 1];

    return (
      <div className="exercise-panel">
        <h3>Exercise: {currentExercise.name}</h3>
        <div className="exercise-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="time-remaining">
            {currentExercise.duration - exerciseProgress}s remaining
          </div>
        </div>
        <div className="exercise-instruction">
          <div className="instruction-number">Step {currentStep + 1}</div>
          <div className="instruction-text">{instruction}</div>
        </div>
      </div>
    );
  };

  if (!isActive || !trackingState) {
    return null;
  }

  return (
    <div className="physical-coach">
      {/* Coach Avatar/Message */}
      <div className="coach-header">
        <div className="coach-avatar">
          <div className="coach-icon">👩‍🏫</div>
        </div>
        <div className="coach-message">
          <p>{coachMessage}</p>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="metrics-panel">
        <h3>Physical Presence</h3>
        {renderMetricBar('Posture', trackingState.posture.isOpen ? 0.8 : 0.3, '#4CAF50')}
        {renderMetricBar('Eye Contact', trackingState.eyeContact.quality, '#2196F3')}
        {renderMetricBar('Gestures', trackingState.gestures.areOpen ? 0.7 : 0.2, '#FF9800')}
        {renderMetricBar('Expression', trackingState.facial.intensity, '#E91E63')}
      </div>

      {/* Overall Performance */}
      <div className="overall-panel">
        <h3>Connection Quality</h3>
        <div className="connection-metrics">
          <div className="connection-metric">
            <div className="metric-icon">✨</div>
            <div className="metric-name">Presence</div>
            <div className="metric-score">{Math.round(trackingState.overall.presence * 100)}%</div>
          </div>
          <div className="connection-metric">
            <div className="metric-icon">💫</div>
            <div className="metric-name">Engagement</div>
            <div className="metric-score">{Math.round(trackingState.overall.engagement * 100)}%</div>
          </div>
          <div className="connection-metric">
            <div className="metric-icon">💕</div>
            <div className="metric-name">Chemistry</div>
            <div className="metric-score">{Math.round(trackingState.overall.chemistry * 100)}%</div>
          </div>
        </div>
      </div>

      {/* Active Exercise */}
      {currentExercise && renderExercise()}

      {/* Quick Tips */}
      {coachFeedback && !currentExercise && (
        <div className="tips-panel">
          {coachFeedback.immediate.length > 0 && (
            <div className="tip-section immediate">
              <h4>🚨 Quick Fix</h4>
              {coachFeedback.immediate.map((tip, i) => (
                <p key={i}>{tip}</p>
              ))}
            </div>
          )}
          
          {coachFeedback.suggestions.length > 0 && (
            <div className="tip-section suggestions">
              <h4>💡 Try This</h4>
              {coachFeedback.suggestions.map((tip, i) => (
                <p key={i}>{tip}</p>
              ))}
            </div>
          )}
          
          {coachFeedback.praise.length > 0 && (
            <div className="tip-section praise">
              <h4>🌟 Great Job!</h4>
              {coachFeedback.praise.map((tip, i) => (
                <p key={i}>{tip}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
