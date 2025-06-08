import React, { useState } from 'react';
import EnhancedVideoChatWithAudience from './EnhancedVideoChatWithAudience';
import './ConferenceDemoLauncher.css';

const ConferenceDemoLauncher: React.FC = () => {
  const [viewMode, setViewMode] = useState<'launcher' | 'participant' | 'audience'>('launcher');

  if (viewMode === 'participant') {
    return <EnhancedVideoChatWithAudience initialMode="participant" />;
  }

  if (viewMode === 'audience') {
    return <EnhancedVideoChatWithAudience initialMode="audience" />;
  }

  return (
    <div className="conference-demo-launcher">
      <div className="launcher-container">
        <div className="header-section">
          <h1 className="demo-title">🎭 XRCupid Conference Demo</h1>
          <p className="demo-subtitle">AWE 2024 - Dating Analytics Experience</p>
        </div>

        <div className="demo-explanation">
          <div className="explanation-card">
            <h2>🎯 Demo Concept</h2>
            <p>
              Two participants engage in authentic dating conversation while our AI analyzes 
              their interaction in real-time. The audience becomes the "dating coaches," 
              watching live analytics show chemistry, body language, and conversation flow.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Participant Experience</h3>
              <p>Pure human connection - no tech distractions, just authentic conversation</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Audience Analytics</h3>
              <p>Real-time chemistry tracking, body language analysis, and peak moment detection</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔥</div>
              <h3>Chemistry Detection</h3>
              <p>AI identifies moments of connection, emotional synchronization, and rapport building</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Coaching Insights</h3>
              <p>Live feedback on conversation flow, engagement levels, and body language</p>
            </div>
          </div>
        </div>

        <div className="demo-controls">
          <div className="control-section">
            <h3>🎪 Conference Setup</h3>
            <p>Choose your view mode for the AWE demonstration:</p>
            
            <div className="button-grid">
              <button 
                className="mode-button participant-button"
                onClick={() => setViewMode('participant')}
              >
                <div className="button-icon">👤</div>
                <div className="button-content">
                  <h4>Participant View</h4>
                  <p>For the two people having the conversation</p>
                </div>
              </button>

              <button 
                className="mode-button audience-button"
                onClick={() => setViewMode('audience')}
              >
                <div className="button-icon">👥</div>
                <div className="button-content">
                  <h4>Audience Analytics Display</h4>
                  <p>Large screen for conference audience to watch analytics</p>
                </div>
              </button>
            </div>
          </div>

          <div className="setup-instructions">
            <div className="instruction-card">
              <h4>🎬 Demo Setup Instructions</h4>
              <ol>
                <li><strong>Participant Setup:</strong> Two laptops at a table, each running "Participant View"</li>
                <li><strong>Audience Display:</strong> Large screen/projector showing "Audience Analytics Display"</li>
                <li><strong>Room Creation:</strong> First participant creates a room and shares the room ID</li>
                <li><strong>Room Joining:</strong> Second participant joins using the room ID</li>
                <li><strong>Live Analytics:</strong> Audience sees real-time dating analytics and coaching insights</li>
              </ol>
            </div>

            <div className="tech-specs">
              <h4>⚡ Technology Showcase</h4>
              <ul>
                <li>🎥 Real-time WebRTC video chat with Firebase signaling</li>
                <li>😊 ML5 facial expression and emotion detection</li>
                <li>👤 Full-body posture and gesture tracking</li>
                <li>🧠 Hume AI empathic voice analysis</li>
                <li>📈 12 real-time performance metrics</li>
                <li>💕 Chemistry and compatibility scoring</li>
                <li>🎯 Live coaching insights and peak moment detection</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="demo-footer">
          <div className="company-info">
            <h3>🚀 XRCupid Platform</h3>
            <p>AI-powered dating practice and coaching technology</p>
          </div>
          
          <div className="conference-info">
            <h4>AWE 2024 Presentation</h4>
            <p>Live demonstration of real-time dating analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConferenceDemoLauncher;
