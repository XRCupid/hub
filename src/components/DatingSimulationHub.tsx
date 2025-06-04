import React, { useState } from 'react';
import { DatingSimulationMaster } from './DatingSimulationMaster';
import { NPCPersonalities } from '../config/NPCPersonalities';
import RisographAngel from './RisographAngel';
import RisographHeart from './RisographHeart';
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
          className="back-button riso-button secondary"
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
      <div className="hub-hero risograph-hero">
        <div className="angel-decoration-left">
          <RisographAngel size={120} className="floating-angel" />
        </div>
        <div className="hero-content">
          <h1 className="hero-title offset-text">
            <span className="title-main">Choose Your Date</span>
            <RisographHeart size={40} className="title-heart" animated />
          </h1>
          <p className="hero-subtitle">
            Practice conversation skills with our unique AI personalities
          </p>
        </div>
      </div>

      <div className="character-grid">
        {Object.entries(NPCPersonalities).map(([id, personality]) => {
          // Generate emoji based on personality type
          const getEmoji = (id: string) => {
            if (id.includes('sarah')) return '✨';
            if (id.includes('emma')) return '🎨';
            if (id.includes('alex')) return '🏔️';
            if (id.includes('maya')) return '📚';
            if (id.includes('marcus')) return '🎭';
            return '💗';
          };

          return (
            <div key={id} className="character-card riso-card">
              <div className="card-decoration">
                <RisographHeart size={25} />
              </div>
              <div className="character-avatar">
                <div className="avatar-placeholder">
                  {getEmoji(id)}
                </div>
              </div>
              <h3 className="character-name">{personality.name}</h3>
              <p className="character-age">{personality.age} years old</p>
              <p className="character-occupation">{personality.occupation}</p>
              <p className="character-bio">{personality.personality}</p>
              <div className="character-interests">
                <h4>Interests:</h4>
                <div className="interest-tags">
                  {personality.interests.map((interest, index) => (
                    <span key={index} className="interest-tag">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
              <button 
                className="chat-button riso-button"
                onClick={() => startChat(id)}
              >
                Start Chat with {personality.name}
              </button>
            </div>
          );
        })}
      </div>

      <div className="tips-section riso-card">
        <h2 className="tips-title">
          <span className="icon">💡</span>
          Dating Tips
        </h2>
        <ul className="tips-list">
          <li>Be genuine and authentic in your conversations</li>
          <li>Ask open-ended questions to keep the conversation flowing</li>
          <li>Listen actively and respond thoughtfully</li>
          <li>Share your own experiences when appropriate</li>
          <li>Practice makes perfect - try different approaches!</li>
        </ul>
      </div>
    </div>
  );
};

export default DatingSimulationHub;
