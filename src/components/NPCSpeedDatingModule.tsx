import React, { useState, useEffect } from 'react';
import NPCDateCall from './NPCDateCall';
import './NPCSpeedDatingModule.css';

interface NPCProfile {
  id: string;
  name: string;
  archetype: string;
  description: string;
  image: string;
  chemistry: number;
  conversationStyle: string;
}

const NPC_PROFILES: NPCProfile[] = [
  {
    id: 'sofia',
    name: 'Sofia',
    archetype: 'Adventurous Artist',
    description: 'Creative soul who loves exploring galleries and hidden cafes',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    chemistry: 0,
    conversationStyle: 'playful and creative'
  },
  {
    id: 'maya',
    name: 'Maya',
    archetype: 'Tech Entrepreneur',
    description: 'Startup founder passionate about AI and sustainability',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300',
    chemistry: 0,
    conversationStyle: 'intellectual and driven'
  },
  {
    id: 'luna',
    name: 'Luna',
    archetype: 'Wellness Coach',
    description: 'Yoga instructor focused on mindfulness and healthy living',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
    chemistry: 0,
    conversationStyle: 'calm and insightful'
  },
  {
    id: 'ava',
    name: 'Ava',
    archetype: 'Travel Blogger',
    description: 'Globetrotter with stories from every continent',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
    chemistry: 0,
    conversationStyle: 'adventurous and spontaneous'
  }
];

const NPCSpeedDatingModule: React.FC = () => {
  const [currentNPC, setCurrentNPC] = useState<NPCProfile | null>(null);
  const [matchHistory, setMatchHistory] = useState<NPCProfile[]>([]);
  const [isInDate, setIsInDate] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes per date
  const [showResults, setShowResults] = useState(false);
  const [userName, setUserName] = useState('');
  const [hasStarted, setHasStarted] = useState(false);

  // Timer for speed dating rounds
  useEffect(() => {
    if (isInDate && timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isInDate && timeRemaining === 0) {
      endCurrentDate();
    }
  }, [isInDate, timeRemaining]);

  const startSpeedDating = () => {
    if (!userName.trim()) return;
    setHasStarted(true);
    startNextDate();
  };

  const startNextDate = () => {
    const availableNPCs = NPC_PROFILES.filter(
      npc => !matchHistory.find(match => match.id === npc.id)
    );
    
    if (availableNPCs.length === 0) {
      setShowResults(true);
      return;
    }
    
    const nextNPC = availableNPCs[Math.floor(Math.random() * availableNPCs.length)];
    setCurrentNPC(nextNPC);
    setIsInDate(true);
    setTimeRemaining(180);
  };

  const endCurrentDate = () => {
    if (currentNPC) {
      // Simulate chemistry score based on interaction
      const chemistryScore = Math.floor(Math.random() * 30) + 70; // 70-100
      const npcWithChemistry = { ...currentNPC, chemistry: chemistryScore };
      setMatchHistory(prev => [...prev, npcWithChemistry]);
    }
    setIsInDate(false);
    setCurrentNPC(null);
  };

  const handleDateEnd = () => {
    endCurrentDate();
    if (matchHistory.length + 1 < NPC_PROFILES.length) {
      setTimeout(startNextDate, 2000);
    } else {
      setShowResults(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTopMatches = () => {
    return [...matchHistory]
      .sort((a, b) => b.chemistry - a.chemistry)
      .slice(0, 3);
  };

  if (showResults) {
    const topMatches = getTopMatches();
    
    return (
      <div className="speed-dating-results">
        <div className="results-card riso-card">
          <h2 className="results-title riso-text-offset">Your Speed Dating Results!</h2>
          
          <div className="matches-section">
            <h3>Top Matches 💕</h3>
            <div className="top-matches">
              {topMatches.map((match, index) => (
                <div key={match.id} className="match-card">
                  <div className="match-rank">#{index + 1}</div>
                  <img src={match.image} alt={match.name} className="match-avatar" />
                  <h4>{match.name}</h4>
                  <p className="match-archetype">{match.archetype}</p>
                  <div className="chemistry-score">
                    <span className="chemistry-label">Chemistry</span>
                    <div className="chemistry-bar">
                      <div 
                        className="chemistry-fill"
                        style={{ width: `${match.chemistry}%` }}
                      />
                    </div>
                    <span className="chemistry-percent">{match.chemistry}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            className="riso-button primary"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="speed-dating-module">
        <div className="intro-card riso-card">
          <h1 className="module-title riso-text-offset">NPC Speed Dating</h1>
          <p className="module-subtitle">Meet 4 unique AI personalities in 3-minute dates!</p>
          
          <div className="npc-preview">
            {NPC_PROFILES.map(npc => (
              <div key={npc.id} className="npc-preview-card">
                <img src={npc.image} alt={npc.name} />
                <h4>{npc.name}</h4>
                <p>{npc.archetype}</p>
              </div>
            ))}
          </div>
          
          <div className="start-section">
            <input
              type="text"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="riso-input"
              onKeyPress={(e) => e.key === 'Enter' && startSpeedDating()}
            />
            <button 
              className="riso-button primary"
              onClick={startSpeedDating}
              disabled={!userName.trim()}
            >
              Start Speed Dating
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isInDate && currentNPC) {
    return (
      <div className="speed-dating-active">
        <div className="date-header riso-card">
          <div className="date-info">
            <h3>Speed Dating with {currentNPC.name}</h3>
            <p>{currentNPC.archetype} - {currentNPC.conversationStyle}</p>
          </div>
          <div className="timer">
            <span className="timer-label">Time Remaining</span>
            <span className="timer-value">{formatTime(timeRemaining)}</span>
          </div>
          <div className="date-progress">
            Date {matchHistory.length + 1} of {NPC_PROFILES.length}
          </div>
        </div>
        
        <NPCDateCall
          npcName={currentNPC.name}
          npcArchetype={currentNPC.archetype}
          userName={userName}
          onCallEnd={handleDateEnd}
        />
      </div>
    );
  }

  return (
    <div className="speed-dating-loading">
      <div className="riso-card">
        <h3>Preparing next date...</h3>
        <div className="loading-spinner" />
      </div>
    </div>
  );
};

export default NPCSpeedDatingModule;
