import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatingApp from './DatingApp';
import ChatSimulation from './ChatSimulation';
import './DatingFlow.css';
import './DatingApp.css';

interface Match {
  id: number;
  name: string;
  photo: string;
  bio: string;
  avatarPath: string;
  hasUnlockedVideoCall?: boolean;
  hasChatted?: boolean;
}

interface DatingFlowState {
  currentView: 'browse' | 'matches' | 'chat' | 'video-prep';
  matches: Match[];
  currentChat: Match | null;
}

const NPC_PROFILES = [
  {
    id: 1,
    name: 'Alex',
    age: 28,
    photo: 'https://randomuser.me/api/portraits/men/32.jpg',
    bio: 'Loves hiking, philosophy, and jazz. Looking for deep conversation.',
    interests: ['Hiking', 'Philosophy', 'Jazz'],
    funFact: 'Once backpacked solo across Patagonia.',
    avatarPath: '/avatars/myMan.glb'
  },
  {
    id: 4,
    name: 'Angel',
    age: 25,
    photo: 'https://randomuser.me/api/portraits/women/25.jpg',
    bio: 'Creative soul, music lover, and adventure seeker. Life is too short for boring conversations.',
    interests: ['Music', 'Art', 'Adventure'],
    funFact: 'Can play three instruments and loves spontaneous road trips.',
    avatarPath: '/avatars/AngelChick.glb'
  }
];

export default function DatingFlow() {
  const navigate = useNavigate();
  const [flowState, setFlowState] = useState<DatingFlowState>({
    currentView: 'browse',
    matches: [],
    currentChat: null
  });

  // Load saved progress from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('datingFlowState');
    if (savedState) {
      setFlowState(JSON.parse(savedState));
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem('datingFlowState', JSON.stringify(flowState));
  }, [flowState]);

  const handleMatch = (matchId: number) => {
    const profile = NPC_PROFILES.find(p => p.id === matchId);
    if (profile && !flowState.matches.find(m => m.id === matchId)) {
      const newMatch: Match = {
        id: profile.id,
        name: profile.name,
        photo: profile.photo,
        bio: profile.bio,
        avatarPath: profile.avatarPath,
        hasUnlockedVideoCall: false,
        hasChatted: false
      };
      
      setFlowState(prev => ({
        ...prev,
        matches: [...prev.matches, newMatch]
      }));
    }
  };

  const handleChatStart = (match: Match) => {
    setFlowState(prev => ({
      ...prev,
      currentView: 'chat',
      currentChat: match,
      matches: prev.matches.map(m => 
        m.id === match.id ? { ...m, hasChatted: true } : m
      )
    }));
  };

  const handleVideoCallUnlock = () => {
    if (flowState.currentChat) {
      setFlowState(prev => ({
        ...prev,
        currentView: 'video-prep',
        matches: prev.matches.map(m => 
          m.id === prev.currentChat!.id 
            ? { ...m, hasUnlockedVideoCall: true } 
            : m
        )
      }));
    }
  };

  const handleStartVideoCall = () => {
    // Navigate to the coach experience with the matched NPC's avatar
    if (flowState.currentChat) {
      // Save the current match info for the video call
      localStorage.setItem('currentVideoCallNPC', JSON.stringify(flowState.currentChat));
      navigate('/coach-call');
    }
  };

  const handleBackToMatches = () => {
    setFlowState(prev => ({
      ...prev,
      currentView: 'matches',
      currentChat: null
    }));
  };

  return (
    <div className="dating-flow-container">
      {/* Header */}
      <div className="dating-flow-header">
        <h1>XR Cupid Dating</h1>
        <div className="dating-flow-nav">
          <button 
            className={flowState.currentView === 'browse' ? 'active' : ''}
            onClick={() => setFlowState(prev => ({ ...prev, currentView: 'browse' }))}
          >
            Browse
          </button>
          <button 
            className={flowState.currentView === 'matches' ? 'active' : ''}
            onClick={() => setFlowState(prev => ({ ...prev, currentView: 'matches' }))}
          >
            Matches ({flowState.matches.length})
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dating-flow-content">
        {flowState.currentView === 'browse' && (
          <div className="browse-view">
            <h2>Find Your Match</h2>
            <p>Swipe right to match, left to pass</p>
            {/* The DatingApp component would need to be modified to accept callbacks */}
            <div className="npc-cards">
              {NPC_PROFILES.map(npc => (
                <div key={npc.id} className="npc-card">
                  <img src={npc.photo} alt={npc.name} />
                  <h3>{npc.name}, {npc.age}</h3>
                  <p>{npc.bio}</p>
                  <button onClick={() => handleMatch(npc.id)}>Match</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {flowState.currentView === 'matches' && (
          <div className="matches-view">
            <h2>Your Matches</h2>
            {flowState.matches.length === 0 ? (
              <p>No matches yet. Keep swiping!</p>
            ) : (
              <div className="match-list">
                {flowState.matches.map(match => (
                  <div key={match.id} className="match-card">
                    <img src={match.photo} alt={match.name} />
                    <div className="match-info">
                      <h3>{match.name}</h3>
                      <p>{match.bio}</p>
                      <div className="match-status">
                        {match.hasUnlockedVideoCall && (
                          <span className="status-badge">📹 Video Unlocked</span>
                        )}
                        {match.hasChatted && (
                          <span className="status-badge">💬 Chatted</span>
                        )}
                      </div>
                      <div className="match-actions">
                        <button 
                          className="chat-button"
                          onClick={() => handleChatStart(match)}
                        >
                          {match.hasChatted ? 'Continue Chat' : 'Start Chat'}
                        </button>
                        {match.hasUnlockedVideoCall && (
                          <button 
                            className="video-button"
                            onClick={() => {
                              setFlowState(prev => ({ ...prev, currentChat: match }));
                              handleStartVideoCall();
                            }}
                          >
                            Practice Date
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {flowState.currentView === 'chat' && flowState.currentChat && (
          <div className="chat-view">
            <div className="chat-header">
              <button onClick={handleBackToMatches}>← Back</button>
              <h2>Chatting with {flowState.currentChat.name}</h2>
            </div>
            <ChatSimulation 
              npcId={flowState.currentChat.name.toLowerCase()}
              onVideoCallUnlock={handleVideoCallUnlock}
            />
          </div>
        )}

        {flowState.currentView === 'video-prep' && flowState.currentChat && (
          <div className="video-prep-view">
            <h2>🎉 Congratulations!</h2>
            <p>You've unlocked a practice video date with {flowState.currentChat.name}!</p>
            <div className="video-prep-tips">
              <h3>Quick Tips:</h3>
              <ul>
                <li>✅ Check your camera and microphone</li>
                <li>✅ Choose a quiet, well-lit space</li>
                <li>✅ Have some conversation topics ready</li>
                <li>✅ Relax and be yourself!</li>
              </ul>
            </div>
            <div className="video-prep-actions">
              <button className="start-video-button" onClick={handleStartVideoCall}>
                Start Practice Date
              </button>
              <button className="back-button" onClick={handleBackToMatches}>
                Maybe Later
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
