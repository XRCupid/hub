import React, { useState } from 'react';
import { UnifiedTrackingCoordinator, CoachTrackingProfile } from '../services/UnifiedTrackingCoordinator';
import { getCoachById } from '../config/coachConfig';

interface CoachTrackingDemoProps {
  onClose?: () => void;
}

const CoachTrackingDemo: React.FC<CoachTrackingDemoProps> = ({ onClose }) => {
  const [selectedCoachId, setSelectedCoachId] = useState<string>('posie');
  const [trackingCoordinator] = useState(() => new UnifiedTrackingCoordinator());
  
  // Demo coach profiles
  const demoCoaches = [
    {
      id: 'posie',
      name: 'Posie',
      specialty: 'Physical Presence',
      description: 'Focuses on body language, posture, and physical confidence',
      trackingNeeds: ['posture', 'body-language', 'presence'],
      primaryModel: 'mediapipe-pose',
      icon: '🧍‍♀️'
    },
    {
      id: 'aria',
      name: 'Aria',
      specialty: 'Conversation Skills',
      description: 'Emphasizes eye contact, facial expressions, and engagement',
      trackingNeeds: ['eye-contact', 'facial-expressions', 'engagement'],
      primaryModel: 'mediapipe-face + gazecloud',
      icon: '👁️'
    },
    {
      id: 'zara',
      name: 'Zara',
      specialty: 'Confidence & Charisma',
      description: 'Analyzes full multimodal presence and authenticity',
      trackingNeeds: ['micro-expressions', 'body-language', 'gestures', 'voice'],
      primaryModel: 'full-stack',
      icon: '✨'
    },
    {
      id: 'kai',
      name: 'Kai',
      specialty: 'Authenticity',
      description: 'Detects emotional authenticity and micro-expressions',
      trackingNeeds: ['micro-expressions', 'emotional-range', 'authenticity'],
      primaryModel: 'mediapipe-face + emotional-analysis',
      icon: '💚'
    }
  ];

  const selectedCoach = demoCoaches.find(c => c.id === selectedCoachId);

  const getTrackingRequirements = (coachId: string) => {
    const coach = demoCoaches.find(c => c.id === coachId);
    if (!coach) return [];

    return coach.trackingNeeds.map(need => ({
      need,
      description: getTrackingDescription(need),
      model: getRequiredModel(need),
      processingLoad: getProcessingLoad(need),
      batteryImpact: getBatteryImpact(need)
    }));
  };

  const getTrackingDescription = (need: string): string => {
    const descriptions: Record<string, string> = {
      'posture': 'Analyzes shoulder alignment, spine posture, and overall body positioning',
      'body-language': 'Tracks openness, confidence signals, and physical presence',
      'presence': 'Measures overall physical confidence and space occupation',
      'eye-contact': 'Monitors gaze patterns, eye contact duration, and attention focus',
      'facial-expressions': 'Detects basic emotions and engagement levels',
      'engagement': 'Measures facial responsiveness and active listening cues',
      'micro-expressions': 'Analyzes subtle facial movements and emotional authenticity',
      'gestures': 'Tracks hand movements and expressive gestures',
      'voice': 'Analyzes vocal prosody and emotional authenticity',
      'emotional-range': 'Measures variety and authenticity of emotional expressions',
      'authenticity': 'Detects genuine vs. masked emotional responses'
    };
    return descriptions[need] || 'Advanced tracking capability';
  };

  const getRequiredModel = (need: string): string => {
    const models: Record<string, string> = {
      'posture': 'MediaPipe Pose',
      'body-language': 'MediaPipe Pose',
      'presence': 'MediaPipe Pose',
      'eye-contact': 'GazeCloud API',
      'facial-expressions': 'ML5 FaceMesh',
      'engagement': 'MediaPipe Face',
      'micro-expressions': 'MediaPipe Face (High Res)',
      'gestures': 'MediaPipe Hands',
      'voice': 'Hume Voice API',
      'emotional-range': 'MediaPipe Face + Hume',
      'authenticity': 'MediaPipe Face + ML Analysis'
    };
    return models[need] || 'Advanced Model';
  };

  const getProcessingLoad = (need: string): number => {
    const loads: Record<string, number> = {
      'posture': 7,
      'body-language': 8,
      'presence': 6,
      'eye-contact': 5,
      'facial-expressions': 5,
      'engagement': 6,
      'micro-expressions': 9,
      'gestures': 4,
      'voice': 3,
      'emotional-range': 8,
      'authenticity': 9
    };
    return loads[need] || 5;
  };

  const getBatteryImpact = (need: string): 'low' | 'medium' | 'high' => {
    const impacts: Record<string, 'low' | 'medium' | 'high'> = {
      'posture': 'high',
      'body-language': 'high',
      'presence': 'medium',
      'eye-contact': 'medium',
      'facial-expressions': 'medium',
      'engagement': 'medium',
      'micro-expressions': 'high',
      'gestures': 'low',
      'voice': 'low',
      'emotional-range': 'high',
      'authenticity': 'high'
    };
    return impacts[need] || 'medium';
  };

  const requirements = getTrackingRequirements(selectedCoachId);
  const totalProcessingLoad = requirements.reduce((sum, req) => sum + req.processingLoad, 0);
  const avgBatteryImpact = requirements.length > 0 ? 
    requirements.filter(r => r.batteryImpact === 'high').length > requirements.length / 2 ? 'high' :
    requirements.filter(r => r.batteryImpact === 'medium').length > 0 ? 'medium' : 'low'
    : 'low';

  return (
    <div className="coach-tracking-demo">
      <div className="demo-header">
        <h2>Coach-Specific Tracking Requirements</h2>
        <p>Each coach specializes in different aspects of dating skills and requires different tracking models</p>
        {onClose && (
          <button className="close-btn" onClick={onClose}>×</button>
        )}
      </div>

      <div className="coach-selector">
        {demoCoaches.map(coach => (
          <div 
            key={coach.id}
            className={`coach-card ${selectedCoachId === coach.id ? 'selected' : ''}`}
            onClick={() => setSelectedCoachId(coach.id)}
          >
            <div className="coach-icon">{coach.icon}</div>
            <h3>{coach.name}</h3>
            <p className="specialty">{coach.specialty}</p>
            <p className="description">{coach.description}</p>
          </div>
        ))}
      </div>

      {selectedCoach && (
        <div className="tracking-requirements">
          <div className="requirements-header">
            <h3>Tracking Requirements for {selectedCoach.name}</h3>
            <div className="requirements-summary">
              <div className="summary-item">
                <span className="label">Processing Load:</span>
                <span className={`value load-${totalProcessingLoad > 20 ? 'high' : totalProcessingLoad > 10 ? 'medium' : 'low'}`}>
                  {totalProcessingLoad}/40
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Battery Impact:</span>
                <span className={`value impact-${avgBatteryImpact}`}>
                  {avgBatteryImpact.toUpperCase()}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Models Needed:</span>
                <span className="value">{requirements.length}</span>
              </div>
            </div>
          </div>

          <div className="requirements-list">
            {requirements.map(req => (
              <div key={req.need} className="requirement-item">
                <div className="requirement-header">
                  <h4>{req.need.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                  <div className="requirement-badges">
                    <span className={`processing-badge load-${req.processingLoad > 7 ? 'high' : req.processingLoad > 4 ? 'medium' : 'low'}`}>
                      {req.processingLoad}/10
                    </span>
                    <span className={`battery-badge impact-${req.batteryImpact}`}>
                      {req.batteryImpact}
                    </span>
                  </div>
                </div>
                <p className="requirement-description">{req.description}</p>
                <div className="model-info">
                  <span className="model-label">Model:</span>
                  <span className="model-name">{req.model}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="demo-actions">
            <button className="action-btn primary">
              Start {selectedCoach.name} Session
            </button>
            <button className="action-btn secondary">
              View Tracking Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachTrackingDemo;
