import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NPCPersonalities } from '../config/NPCPersonalities';
import RisographAngel from './RisographAngel';
import RisographHeart from './RisographHeart';
import PracticeDate from './PracticeDate';
import './DatingSimulationHub.css';

export const DatingSimulationHub: React.FC = () => {
  const [selectedNPC, setSelectedNPC] = useState<string | null>(null);
  const [showSimulation, setShowSimulation] = useState(false);
  const navigate = useNavigate();

  const startDate = (npcId: string) => {
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
        <PracticeDate />
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
            Experience immersive cafe dates with AI-powered personalities
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
            if (id.includes('haseeb')) return '💻';
            if (id.includes('dougie')) return '🎨';
            if (id.includes('mindy')) return '💎';
            if (id.includes('erika')) return '📈';
            if (id.includes('moh')) return '🤖';
            return '💗';
          };

          // Get avatar image if available
          const getAvatarImage = (id: string) => {
            if (id.includes('haseeb')) return '/avatars/ProfilePics/Haseeb_profile.png';
            if (id.includes('dougie')) return '/avatars/ProfilePics/Dougie_profile.png';
            if (id.includes('mindy')) return '/avatars/ProfilePics/Mindy_profile.png';
            if (id.includes('erika')) return '/avatars/ProfilePics/Erika_profile.png';
            if (id.includes('moh')) return '/avatars/ProfilePics/Moh_profile.png';
            // Default profile pictures for standard NPCs
            if (id.includes('sarah')) return '/avatars/ProfilePics/sarah_profile.png';
            if (id.includes('emma')) return '/avatars/ProfilePics/emma_profile.png';
            if (id.includes('alex')) return '/avatars/ProfilePics/alex_profile.png';
            if (id.includes('maya')) return '/avatars/ProfilePics/maya_profile.png';
            if (id.includes('marcus')) return '/avatars/ProfilePics/marcus_profile.png';
            return null;
          };

          const avatarImage = getAvatarImage(id);

          return (
            <div key={id} className="character-card">
              <div className="card-decoration">
                <RisographHeart size={25} />
              </div>
              <div className="character-avatar">
                {avatarImage ? (
                  <img 
                    src={avatarImage} 
                    alt={personality.name}
                    className="avatar-image"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {getEmoji(id)}
                  </div>
                )}
              </div>
              <div className="character-info">
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
                  className="chat-button"
                  onClick={() => navigate(`/practice-date/${id}`)}
                >
                  Start Cafe Date with {personality.name}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="simulation-features">
        <h2>🌟 Immersive Dating Experience Features</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">☕</div>
            <h3>Cafe Environment</h3>
            <p>Beautiful 3D cafe setting with ambient sounds and atmosphere</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎭</div>
            <h3>3D Avatars</h3>
            <p>Realistic avatars with emotional expressions and body language</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎤</div>
            <h3>Voice Interaction</h3>
            <p>Natural voice conversations with AI-powered responses</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Real-time Feedback</h3>
            <p>Track connection, attraction, and engagement scores</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatingSimulationHub;
