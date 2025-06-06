import React, { useState, useEffect } from 'react';
import { DatingSimulationMaster } from '../components/DatingSimulationMaster';
import { NPCPersonalities } from '../config/NPCPersonalities';
import DatingCoachIntegration from '../components/DatingCoachIntegration';
import './DatingCoachDemo.css';

export const DatingCoachDemo: React.FC = () => {
  const [selectedNPC, setSelectedNPC] = useState<string>('confident-sarah');
  const [scenario, setScenario] = useState<'first-date' | 'coffee-chat' | 'virtual-meeting'>('first-date');
  const [mirrorMode, setMirrorMode] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const [showDemo, setShowDemo] = useState(false);
  const [demoMode, setDemoMode] = useState<'simulation' | 'integrated'>('integrated');

  const scenarios = [
    { id: 'first-date', name: 'First Date', description: 'Practice making a great first impression' },
    { id: 'coffee-chat', name: 'Coffee Chat', description: 'Casual conversation over coffee' },
    { id: 'virtual-meeting', name: 'Virtual Meeting', description: 'Online video date experience' }
  ];

  return (
    <div className="dating-coach-demo">
      {!showDemo ? (
        <div className="demo-setup">
          <div className="demo-header">
            <h1>XRCupid Dating Coach</h1>
            <p>The Ultimate AI-Powered Dating Simulation Platform</p>
          </div>

          <div className="feature-highlights">
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Dating App Integration</h3>
              <p>Swipe, match, and chat with AI-powered personalities</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Texting Analysis</h3>
              <p>Real-time feedback on your messaging skills</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Personalized Coaching</h3>
              <p>Lessons tailored to your specific performance metrics</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Progress Tracking</h3>
              <p>Monitor your improvement across all dating skills</p>
            </div>
          </div>

          <div className="demo-mode-selector">
            <h3>Choose Demo Mode</h3>
            <div className="mode-options">
              <button 
                className={`mode-btn ${demoMode === 'integrated' ? 'active' : ''}`}
                onClick={() => setDemoMode('integrated')}
              >
                <span className="mode-icon">🎯</span>
                <span className="mode-title">Full Dating Experience</span>
                <span className="mode-desc">Swipe → Match → Text → Date → Coach</span>
              </button>
              <button 
                className={`mode-btn ${demoMode === 'simulation' ? 'active' : ''}`}
                onClick={() => setDemoMode('simulation')}
              >
                <span className="mode-icon">🎭</span>
                <span className="mode-title">Direct Simulation</span>
                <span className="mode-desc">Jump straight into a date simulation</span>
              </button>
            </div>
          </div>

          <div className="option-group">
            <h3>Choose Your Date</h3>
            <div className="npc-selector">
              {Object.entries(NPCPersonalities).map(([id, npc]) => (
                <div 
                  key={id}
                  className={`npc-option ${selectedNPC === id ? 'selected' : ''}`}
                  onClick={() => setSelectedNPC(id)}
                >
                  <h4>{npc.name}, {npc.age}</h4>
                  <p>{npc.occupation}</p>
                  <div className="personality-traits">
                    <span>{npc.personality}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="option-group">
            <h3>Select Scenario</h3>
            <div className="scenario-selector">
              {scenarios.map((s) => (
                <div 
                  key={s.id}
                  className={`scenario-option ${scenario === s.id ? 'selected' : ''}`}
                  onClick={() => setScenario(s.id as typeof scenario)}
                >
                  <h4>{s.name}</h4>
                  <p>{s.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="option-group">
            <h3>Settings</h3>
            <div className="settings-options">
              <label className="toggle-option">
                <input 
                  type="checkbox" 
                  checked={mirrorMode} 
                  onChange={(e) => setMirrorMode(e.target.checked)}
                />
                <span>Avatar Mirror Mode</span>
                <small>See yourself as an avatar instead of video</small>
              </label>
              <label className="toggle-option">
                <input 
                  type="checkbox" 
                  checked={showMetrics} 
                  onChange={(e) => setShowMetrics(e.target.checked)}
                />
                <span>Show Real-time Metrics</span>
                <small>Display performance scores during the date</small>
              </label>
            </div>
          </div>

          <button 
            className="start-demo-btn"
            onClick={() => setShowDemo(true)}
          >
            Start Dating Simulation
          </button>
        </div>
      ) : (
        <div className="demo-container">
          <button 
            className="back-btn"
            onClick={() => setShowDemo(false)}
          >
            ← Back to Setup
          </button>
          {demoMode === 'integrated' ? (
            <DatingCoachIntegration
              onBack={() => setShowDemo(false)}
            />
          ) : (
            <DatingSimulationMaster
              onBack={() => setShowDemo(false)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default DatingCoachDemo;
