import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COACHES } from '../config/coachConfig';
import { UserAvatarPiP } from './UserAvatarPiP';
import './HumeTestEnvironment.css';

export const HumeTestEnvironment: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCoach, setSelectedCoach] = useState<string>('');
  const [pipPosition, setPipPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right');
  const [pipSize, setPipSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showPiP, setShowPiP] = useState(true);
  const [testMode, setTestMode] = useState<'coaches' | 'pip' | 'both'>('both');

  const handleCoachSelect = (coachId: string) => {
    setSelectedCoach(coachId);
    navigate(`/hume-coach/${coachId}`);
  };

  return (
    <div className="hume-test-environment">
      <header className="test-header">
        <button className="back-button" onClick={() => navigate('/training-hub')}>
          ← Back to Hub
        </button>
        <h1>Hume AI Integration Test Environment</h1>
        <div className="test-mode-selector">
          <button 
            className={`mode-btn ${testMode === 'coaches' ? 'active' : ''}`}
            onClick={() => setTestMode('coaches')}
          >
            Coaches Only
          </button>
          <button 
            className={`mode-btn ${testMode === 'pip' ? 'active' : ''}`}
            onClick={() => setTestMode('pip')}
          >
            PiP Only
          </button>
          <button 
            className={`mode-btn ${testMode === 'both' ? 'active' : ''}`}
            onClick={() => setTestMode('both')}
          >
            Both
          </button>
        </div>
      </header>

      <div className="test-content">
        {/* PiP Test Section */}
        {(testMode === 'pip' || testMode === 'both') && (
          <section className="pip-test-section">
            <h2>User Avatar PiP Testing</h2>
            <div className="pip-controls">
              <div className="control-group">
                <label>PiP Visibility</label>
                <button 
                  className={`toggle-btn ${showPiP ? 'active' : ''}`}
                  onClick={() => setShowPiP(!showPiP)}
                >
                  {showPiP ? 'Hide PiP' : 'Show PiP'}
                </button>
              </div>

              <div className="control-group">
                <label>Position</label>
                <div className="position-grid">
                  <button 
                    className={`pos-btn ${pipPosition === 'top-left' ? 'active' : ''}`}
                    onClick={() => setPipPosition('top-left')}
                  >
                    ↖
                  </button>
                  <button 
                    className={`pos-btn ${pipPosition === 'top-right' ? 'active' : ''}`}
                    onClick={() => setPipPosition('top-right')}
                  >
                    ↗
                  </button>
                  <button 
                    className={`pos-btn ${pipPosition === 'bottom-left' ? 'active' : ''}`}
                    onClick={() => setPipPosition('bottom-left')}
                  >
                    ↙
                  </button>
                  <button 
                    className={`pos-btn ${pipPosition === 'bottom-right' ? 'active' : ''}`}
                    onClick={() => setPipPosition('bottom-right')}
                  >
                    ↘
                  </button>
                </div>
              </div>

              <div className="control-group">
                <label>Size</label>
                <div className="size-options">
                  <button 
                    className={`size-btn ${pipSize === 'small' ? 'active' : ''}`}
                    onClick={() => setPipSize('small')}
                  >
                    Small
                  </button>
                  <button 
                    className={`size-btn ${pipSize === 'medium' ? 'active' : ''}`}
                    onClick={() => setPipSize('medium')}
                  >
                    Medium
                  </button>
                  <button 
                    className={`size-btn ${pipSize === 'large' ? 'active' : ''}`}
                    onClick={() => setPipSize('large')}
                  >
                    Large
                  </button>
                </div>
              </div>
            </div>

            <div className="pip-info">
              <h3>Features Being Tested:</h3>
              <ul>
                <li>✓ Hume emotion detection from camera</li>
                <li>✓ Real-time blendshape mapping</li>
                <li>✓ Lip sync from facial tracking</li>
                <li>✓ Head pose tracking</li>
                <li>✓ Expression visualization</li>
              </ul>
            </div>
          </section>
        )}

        {/* Coach Test Section */}
        {(testMode === 'coaches' || testMode === 'both') && (
          <section className="coach-test-section">
            <h2>Hume AI Coach Testing</h2>
            <div className="coach-grid">
              {Object.values(COACHES).map((coach) => (
                <div 
                  key={coach.id}
                  className="coach-card"
                  onClick={() => handleCoachSelect(coach.id)}
                  style={{ borderColor: coach.color }}
                >
                  <div className="coach-avatar" style={{ backgroundColor: coach.color + '20' }}>
                    <div className="avatar-placeholder">
                      {coach.name[0]}
                    </div>
                  </div>
                  <h3>{coach.name}</h3>
                  <p className="coach-personality">{coach.personality}</p>
                  <p className="coach-description">{coach.description}</p>
                  <div className="coach-voice-info">
                    <span className="voice-label">Voice:</span>
                    <span className="voice-style">{coach.voice.style}</span>
                  </div>
                  <button className="test-coach-btn">
                    Test with Hume AI
                  </button>
                </div>
              ))}
            </div>

            <div className="coach-features">
              <h3>Coach Features:</h3>
              <ul>
                <li>✓ Emotional voice responses</li>
                <li>✓ Real-time emotion detection</li>
                <li>✓ Dynamic lighting based on emotions</li>
                <li>✓ ElevenLabs voice synthesis</li>
                <li>✓ Avatar lip sync and expressions</li>
              </ul>
            </div>
          </section>
        )}
      </div>

      {/* Show PiP if enabled */}
      {showPiP && (testMode === 'pip' || testMode === 'both') && (
        <UserAvatarPiP
          position={pipPosition}
          size={pipSize}
          onClose={() => setShowPiP(false)}
        />
      )}
    </div>
  );
};
