import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { COACH_TEACHING_STYLES, SESSION_FLOW_TEMPLATE } from '../config/coachTeachingStyles';
import './CoachingSessionDemo.css';

interface CoachingSessionDemoProps {
  selectedCoach?: 'grace' | 'posie' | 'rizzo';
}

export const CoachingSessionDemo: React.FC<CoachingSessionDemoProps> = ({ 
  selectedCoach: propSelectedCoach 
}) => {
  const { coach: urlCoach } = useParams<{ coach?: string }>();
  const selectedCoach = (propSelectedCoach || urlCoach || 'grace') as 'grace' | 'posie' | 'rizzo';
  const [activePhase, setActivePhase] = useState(0);
  const [sessionType, setSessionType] = useState<'postDateReview' | 'skillIntroduction'>('postDateReview');
  const [showExample, setShowExample] = useState(false);

  const coach = COACH_TEACHING_STYLES[selectedCoach];
  const currentSession = coach.sessionTypes[sessionType];

  const renderSessionPhase = () => {
    const phase = SESSION_FLOW_TEMPLATE.phases[activePhase];
    
    return (
      <div className="session-phase">
        <div className="phase-header">
          <h3>{phase.name}</h3>
          <span className="phase-duration">{phase.duration}</span>
        </div>
        <div className="phase-activities">
          {phase.activities.map((activity, idx) => (
            <div key={idx} className="activity-item">
              <span className="activity-bullet">→</span>
              <span>{activity}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCoachingExample = () => {
    if (!showExample) return null;

    const example = coach.sessionTypes[sessionType];
    
    return (
      <div className="coaching-example">
        <div className="coach-avatar">
          <div className={`coach-icon ${selectedCoach}`}>
            {selectedCoach === 'grace' ? '🌹' : selectedCoach === 'posie' ? '🌸' : '🔥'}
          </div>
        </div>
        
        <div className="dialogue-flow">
          <div className="coach-message opening">
            <strong>{coach.name}:</strong> {example.opening}
          </div>
          
          {example.components.map((component, idx) => (
            <div key={idx} className="session-component">
              <div className="component-label">{component.type.split('-').map(w => 
                w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</div>
              <div className="component-approach">{component.approach}</div>
              <div className="component-example">
                <em>"{component.example}"</em>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderInteractionExamples = () => {
    return (
      <div className="interaction-examples">
        <h4>How {coach.name} Responds to Different Situations</h4>
        {coach.sessionTypes.interactionExamples.map((example, idx) => (
          <div key={idx} className="interaction-card">
            <div className="user-situation">
              <strong>When you:</strong> {example.trigger}
            </div>
            <div className={`coach-response ${selectedCoach}`}>
              <strong>{coach.name}:</strong> "{example.response}"
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="coaching-session-demo">
      <div className="demo-header">
        <h2>Experience {coach.name}'s Teaching Style</h2>
        <p className="teaching-philosophy">"{coach.teachingPhilosophy}"</p>
      </div>

      <div className="session-controls">
        <div className="session-type-selector">
          <button 
            className={sessionType === 'postDateReview' ? 'active' : ''}
            onClick={() => setSessionType('postDateReview')}
          >
            Post-Date Review
          </button>
          <button 
            className={sessionType === 'skillIntroduction' ? 'active' : ''}
            onClick={() => setSessionType('skillIntroduction')}
          >
            Skill Introduction
          </button>
        </div>
      </div>

      <div className="session-content">
        <div className="flow-visualization">
          <h3>Session Flow</h3>
          <div className="phases-timeline">
            {SESSION_FLOW_TEMPLATE.phases.map((phase, idx) => (
              <div 
                key={idx} 
                className={`phase-block ${idx === activePhase ? 'active' : ''}`}
                onClick={() => setActivePhase(idx)}
              >
                <div className="phase-number">{idx + 1}</div>
                <div className="phase-name">{phase.name}</div>
              </div>
            ))}
          </div>
          {renderSessionPhase()}
        </div>

        <div className="coaching-style">
          <h3>{coach.name}'s Approach</h3>
          <div className="style-tags">
            {coach.primaryStyles.map((style, idx) => (
              <span key={idx} className="style-tag">{style}</span>
            ))}
          </div>
          
          <button 
            className="example-toggle"
            onClick={() => setShowExample(!showExample)}
          >
            {showExample ? 'Hide' : 'Show'} Live Example
          </button>
          
          {renderCoachingExample()}
        </div>

        {renderInteractionExamples()}
      </div>

      <div className="implementation-notes">
        <h3>How This Works in Practice</h3>
        <div className="implementation-grid">
          <div className="implementation-item">
            <h4>🎯 Personalized Delivery</h4>
            <p>Each coach adapts their style based on your personality and progress</p>
          </div>
          <div className="implementation-item">
            <h4>🔄 Dynamic Sessions</h4>
            <p>Conversations flow naturally, not like rigid lessons</p>
          </div>
          <div className="implementation-item">
            <h4>📊 Performance Integration</h4>
            <p>Your dating app results directly influence coaching content</p>
          </div>
          <div className="implementation-item">
            <h4>🎭 Multiple Modalities</h4>
            <p>Stories, practice, reflection, and experiential learning combined</p>
          </div>
        </div>
      </div>
    </div>
  );
};
