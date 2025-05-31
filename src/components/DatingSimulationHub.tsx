import React, { useState } from 'react';
import { DatingSimulationMaster } from './DatingSimulationMaster';
import { NPCPersonalities } from '../config/NPCPersonalities';
import './DatingSimulationHub.css';

export const DatingSimulationHub: React.FC = () => {
  const [selectedNPC, setSelectedNPC] = useState<string | null>(null);
  const [showSimulation, setShowSimulation] = useState(false);

  const startChat = (npcId: string) => {
    setSelectedNPC(npcId);
    setShowSimulation(true);
  };

  if (showSimulation && selectedNPC) {
    return (
      <div className="simulation-wrapper">
        <button 
          className="back-button"
          onClick={() => {
            setShowSimulation(false);
            setSelectedNPC(null);
          }}
        >
          ← Back to Character Selection
        </button>
        <DatingSimulationMaster 
          onBack={() => {
            setShowSimulation(false);
            setSelectedNPC(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="dating-hub">
      <div className="hub-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Find Your Perfect Match
            <span className="title-emoji">💕</span>
          </h1>
          <p className="hero-subtitle">
            Practice your dating skills with AI-powered personalities in a safe, judgment-free environment
          </p>
        </div>
        <div className="hero-decoration"></div>
      </div>

      <div className="matches-section">
        <div className="section-header">
          <h2>Your Matches</h2>
          <p>Choose someone interesting to start a conversation</p>
        </div>

        <div className="matches-grid">
          {Object.entries(NPCPersonalities).map(([id, npc]) => (
            <div key={id} className="match-card">
              <div className="match-image">
                <div className="avatar-gradient" data-initial={npc.name.charAt(0)}>
                  <span className="avatar-letter">{npc.name.charAt(0)}</span>
                </div>
                <div className="online-indicator"></div>
              </div>
              
              <div className="match-info">
                <h3 className="match-name">{npc.name}, {npc.age}</h3>
                <p className="match-occupation">{npc.occupation}</p>
                <p className="match-personality">{npc.personality}</p>
                
                <div className="match-interests">
                  {npc.interests.slice(0, 3).map((interest, i) => (
                    <span key={i} className="interest-pill">{interest}</span>
                  ))}
                  {npc.interests.length > 3 && (
                    <span className="interest-more">+{npc.interests.length - 3}</span>
                  )}
                </div>
              </div>

              <button 
                className="start-chat-btn"
                onClick={() => startChat(id)}
              >
                <span className="btn-text">Start Chat</span>
                <svg className="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 9H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M7 13H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="features-section">
        <h2>Why Practice Here?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎭</div>
            <h3>Real Expression Tracking</h3>
            <p>Your facial expressions are mirrored in real-time for authentic interactions</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🗣️</div>
            <h3>Natural Conversations</h3>
            <p>Voice-powered AI creates fluid, realistic dialogue experiences</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Track Your Progress</h3>
            <p>Get insights on your communication style and areas for improvement</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Safe Environment</h3>
            <p>Practice without pressure in a judgment-free space</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatingSimulationHub;
