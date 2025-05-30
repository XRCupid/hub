import React, { useState } from 'react';
import { DatingSimulationMaster } from '../components/DatingSimulationMaster';
import { NPCPersonalities } from '../config/NPCPersonalities';
import './DatingCoachDemo.css';

export const DatingCoachDemo: React.FC = () => {
  const [selectedNPC, setSelectedNPC] = useState<string>('confident-sarah');
  const [scenario, setScenario] = useState<'first-date' | 'coffee-chat' | 'dinner-date' | 'activity-date'>('first-date');
  const [mirrorMode, setMirrorMode] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const [showDemo, setShowDemo] = useState(false);

  const scenarios = [
    { id: 'first-date', name: 'First Date', description: 'Practice making a great first impression' },
    { id: 'coffee-chat', name: 'Coffee Chat', description: 'Casual conversation over coffee' },
    { id: 'dinner-date', name: 'Dinner Date', description: 'More formal dining experience' },
    { id: 'activity-date', name: 'Activity Date', description: 'Fun activity-based interaction' }
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
              <div className="feature-icon">🎭</div>
              <h3>Avatar Expression Mirroring</h3>
              <p>See yourself as an avatar with real-time facial expression mapping</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Unified Scoring System</h3>
              <p>Track posture, eye contact, gestures, expressions, and conversation skills</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI-Powered NPCs</h3>
              <p>Practice with diverse personalities powered by Hume AI</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Smart Tracking</h3>
              <p>Intelligent tracking orchestration for optimal performance</p>
            </div>
          </div>

          <div className="setup-options">
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
          
          <DatingSimulationMaster
            npcId={selectedNPC}
            scenario={scenario}
            mirrorMode={mirrorMode}
            showMetrics={showMetrics}
          />
        </div>
      )}
    </div>
  );
};

export default DatingCoachDemo;
