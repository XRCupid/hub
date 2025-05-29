import React, { useState, useEffect } from 'react';
import ChatSimulation from './ChatSimulation';
import RPMVideoCall from './RPMVideoCall';
import RPMAvatarCreatorModal from './RPMAvatarCreatorModal';
import { DEMO_RPM_AVATARS, RPMAvatarGenerator } from '../utils/rpmAvatars';
import { UserPreferences, AvatarGenerator, GeneratedProfile, ConversationStyle } from '../utils/avatarGenerator';
import UserPreferencesComponent from './UserPreferences';
import ProfileGallery from './ProfileGallery';
import './DatingSimulationFlow.css';
import './AvatarGeneration.css';
import { rpmService } from '../services/readyPlayerMeService';

interface Profile {
  id: string;
  name: string;
  age: number;
  photos: string[];
  avatar: {
    id: string;
    name: string;
    gender: 'male' | 'female';
    style: 'realistic' | 'cartoon';
    avatarUrl: string;
  };
  bio: string;
  interests: string[];
  occupation: string;
  education: string;
  distance: number;
  personality: {
    traits: string[];
    responseStyle: ConversationStyle;
    rizzLevel: number;
    interests: string[];
    dealBreakers: string[];
  };
}

interface Match {
  id: string;
  profile: Profile;
  matchedAt: Date;
  chatStarted: boolean;
  videoCallUnlocked: boolean;
  completed: boolean;
  userScore: {
    firstMessage: number;
    conversationFlow: number;
    rizzScore: number;
    videoChemistry: number;
  };
}

type FlowStage = 'preferences' | 'profile-generation' | 'swiping' | 'matched' | 'chatting' | 'video-date' | 'completed';

// Sample profiles with RPM avatars
const SAMPLE_PROFILES: Profile[] = [
  {
    id: 'alex',
    name: 'Alex',
    age: 28,
    photos: ['https://models.readyplayer.me/6409c2e6d4bb6b0001b84d5d.png'], // RPM avatar photo
    avatar: DEMO_RPM_AVATARS.find(a => a.name === 'Alex') || { 
      id: 'alex-avatar', 
      name: 'Alex', 
      gender: 'male' as const, 
      style: 'realistic' as const, 
      avatarUrl: 'https://models.readyplayer.me/6409c2e6d4bb6b0001b84d5d.glb'
    },
    bio: "Adventure seeker who loves hiking and trying new cuisines. Looking for someone to explore the world with! 🌍✈️",
    interests: ['Hiking', 'Travel', 'Photography', 'Cooking'],
    occupation: 'Software Engineer',
    education: 'BS Computer Science',
    distance: 2.1,
    personality: {
      traits: ['adventurous', 'curious', 'optimistic'],
      responseStyle: 'casual',
      rizzLevel: 7,
      interests: ['outdoor activities', 'travel stories'],
      dealBreakers: ['negativity', 'couch potato']
    }
  },
  {
    id: 'jordan',
    name: 'Jordan',
    age: 26,
    photos: ['https://models.readyplayer.me/6409c2e6d4bb6b0001b84d5e.png'], // RPM avatar photo
    avatar: DEMO_RPM_AVATARS.find(a => a.name === 'Jordan') || { 
      id: 'jordan-avatar', 
      name: 'Jordan', 
      gender: 'female' as const, 
      style: 'realistic' as const, 
      avatarUrl: 'https://models.readyplayer.me/6409c2e6d4bb6b0001b84d5e.glb'
    },
    bio: "Artist by day, bookworm by night. I paint emotions and read souls. Seeking deep conversations and creative sparks. 🎨📚",
    interests: ['Art', 'Reading', 'Museums', 'Coffee'],
    occupation: 'Graphic Designer',
    education: 'BFA Visual Arts',
    distance: 1.8,
    personality: {
      traits: ['creative', 'thoughtful', 'passionate'],
      responseStyle: 'intellectual',
      rizzLevel: 8,
      interests: ['creative projects', 'cultural experiences'],
      dealBreakers: ['boring', 'negative attitude']
    }
  },
  {
    id: 'sam',
    name: 'Sam',
    age: 30,
    photos: ['https://models.readyplayer.me/6409c2e6d4bb6b0001b84d5f.png'], // RPM avatar photo
    avatar: DEMO_RPM_AVATARS.find(a => a.name === 'Sam') || { 
      id: 'sam-avatar', 
      name: 'Sam', 
      gender: 'female' as const, 
      style: 'realistic' as const, 
      avatarUrl: 'https://models.readyplayer.me/6409c2e6d4bb6b0001b84d5f.glb'
    },
    bio: "Startup founder who codes by day and cooks by night. Looking for someone who appreciates both innovation and a good homemade meal. 👩‍💻🍳",
    interests: ['Technology', 'Cooking', 'Entrepreneurship', 'Yoga'],
    occupation: 'Startup Founder',
    education: 'MS Computer Science',
    distance: 3.2,
    personality: {
      traits: ['ambitious', 'innovative', 'nurturing'],
      responseStyle: 'casual',
      rizzLevel: 9,
      interests: ['tech trends', 'business strategy'],
      dealBreakers: ['laziness', 'lack of ambition']
    }
  },
  {
    id: 'river',
    name: 'River',
    age: 27,
    photos: ['https://models.readyplayer.me/6409c2e6d4bb6b0001b84d60.png'], // RPM avatar photo
    avatar: DEMO_RPM_AVATARS.find(a => a.name === 'River') || { 
      id: 'river-avatar', 
      name: 'River', 
      gender: 'male' as const, 
      style: 'realistic' as const, 
      avatarUrl: 'https://models.readyplayer.me/6409c2e6d4bb6b0001b84d60.glb'
    },
    bio: "Artist and musician who finds beauty in unexpected places. Seeking someone who appreciates mystery and isn't afraid of deep waters. 🎨🎵🌊",
    interests: ['Art', 'Music', 'Photography', 'Nature'],
    occupation: 'Artist/Musician',
    education: 'BFA Fine Arts',
    distance: 4.1,
    personality: {
      traits: ['mysterious', 'artistic', 'deep'],
      responseStyle: 'romantic',
      rizzLevel: 6,
      interests: ['artistic expression', 'philosophical discussions'],
      dealBreakers: ['superficiality', 'materialism']
    }
  }
];

export const DatingSimulationFlow: React.FC = () => {
  const [stage, setStage] = useState<FlowStage>('preferences');
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [generatedProfiles, setGeneratedProfiles] = useState<GeneratedProfile[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>(SAMPLE_PROFILES);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [showAvatarCreator, setShowAvatarCreator] = useState(false);

  // Handle preference changes
  const handlePreferencesChange = (preferences: UserPreferences) => {
    setUserPreferences(preferences);
  };

  // Handle profile generation
  const handleProfilesGenerated = async (profiles: GeneratedProfile[]) => {
    setGeneratedProfiles(profiles);
    
    // Convert generated profiles to the format used by the dating simulation
    const convertedProfiles: Profile[] = profiles.map((profile) => {
      return {
        id: profile.id,
        name: profile.name,
        age: profile.age,
        photos: profile.photos,
        avatar: {
          ...profile.avatar,
          avatarUrl: profile.avatar.avatarUrl
        },
        bio: profile.bio,
        interests: profile.interests,
        occupation: getRandomOccupation(),
        education: getRandomEducation(),
        distance: Math.floor(Math.random() * 25) + 1,
        personality: {
          traits: [profile.personalityType, profile.ethnicity.toLowerCase()],
          responseStyle: profile.conversationStyle,
          rizzLevel: profile.difficulty === 'easy' ? 3 : profile.difficulty === 'medium' ? 5 : 8,
          interests: profile.interests,
          dealBreakers: getRandomDealBreakers()
        }
      };
    });
    
    setAvailableProfiles(convertedProfiles);
    setStage('swiping');
  };

  // Handle profile selection from gallery
  const handleProfileSelect = (profile: GeneratedProfile) => {
    console.log('Selected profile:', profile);
  };

  // Handle starting chat with a profile
  const handleStartChat = (profile: GeneratedProfile) => {
    // Find the converted profile and create a match
    const convertedProfile = availableProfiles.find(p => p.id === profile.id);
    if (convertedProfile) {
      const newMatch: Match = {
        id: `match-${Date.now()}`,
        profile: convertedProfile,
        matchedAt: new Date(),
        chatStarted: true,
        videoCallUnlocked: false,
        completed: false,
        userScore: {
          firstMessage: 0,
          conversationFlow: 0,
          rizzScore: 0,
          videoChemistry: 0
        }
      };
      
      setMatches(prev => [...prev, newMatch]);
      setCurrentMatch(newMatch);
      setStage('chatting');
    }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      // Create a match
      const newMatch: Match = {
        id: `match-${availableProfiles[swipeIndex].id}-${Date.now()}`,
        profile: availableProfiles[swipeIndex],
        matchedAt: new Date(),
        chatStarted: false,
        videoCallUnlocked: false,
        completed: false,
        userScore: {
          firstMessage: 0,
          conversationFlow: 0,
          rizzScore: 0,
          videoChemistry: 0
        }
      };
      
      setMatches(prev => [...prev, newMatch]);
      setCurrentMatch(newMatch);
      setStage('matched');
    } else {
      // Move to next profile
      if (swipeIndex < availableProfiles.length - 1) {
        setSwipeIndex(prev => prev + 1);
      } else {
        setSwipeIndex(0); // Loop back
      }
    }
  };

  const startChat = () => {
    if (currentMatch) {
      setCurrentMatch({
        ...currentMatch,
        chatStarted: true
      });
      setStage('chatting');
    }
  };

  const unlockVideoCall = () => {
    if (currentMatch) {
      setCurrentMatch({
        ...currentMatch,
        videoCallUnlocked: true
      });
      setStage('video-date');
    }
  };

  const completeSimulation = () => {
    if (currentMatch) {
      setCurrentMatch({
        ...currentMatch,
        completed: true
      });
      setStage('completed');
    }
  };

  const resetToSwiping = () => {
    setStage('swiping');
    setCurrentMatch(null);
  };

  const renderSwipingStage = () => (
    <div className="swiping-stage">
      <div className="app-header">
        <h1>🔥 XRCupid</h1>
        <div className="location-info">
          <span>📍 San Francisco, CA</span>
        </div>
      </div>

      <div className="card-stack">
        <div className="profile-card">
          <div className="profile-photos">
            <img src={availableProfiles[swipeIndex].photos[0]} alt={availableProfiles[swipeIndex].name} />
            <div className="photo-indicators">
              <div className="indicator active"></div>
            </div>
          </div>
          
          <div className="profile-info">
            <div className="name-age">
              <h2>{availableProfiles[swipeIndex].name}, {availableProfiles[swipeIndex].age}</h2>
              <span className="distance">{availableProfiles[swipeIndex].distance} miles away</span>
            </div>
            
            <div className="occupation">
              <span>💼 {availableProfiles[swipeIndex].occupation}</span>
            </div>
            
            <div className="bio">
              <p>{availableProfiles[swipeIndex].bio}</p>
            </div>
            
            <div className="interests">
              {availableProfiles[swipeIndex].interests.slice(0, 4).map((interest, index) => (
                <span key={index} className="interest-tag">{interest}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="swipe-actions">
        <button 
          className="action-btn pass"
          onClick={() => handleSwipe('left')}
        >
          ❌
        </button>
        
        <button 
          className="action-btn super-like"
          onClick={() => handleSwipe('right')}
        >
          ⭐
        </button>
        
        <button 
          className="action-btn like"
          onClick={() => handleSwipe('right')}
        >
          💚
        </button>
      </div>

      <div className="swipe-tutorial">
        <p>👆 Tap ❌ to pass, 💚 to like, or ⭐ for super like</p>
      </div>
    </div>
  );

  const renderMatchedStage = () => (
    <div className="matched-stage">
      <div className="match-celebration">
        <div className="celebration-header">
          <h1>🎉 IT'S A MATCH! 🎉</h1>
          <p>You and {currentMatch?.profile.name} liked each other</p>
        </div>
        
        <div className="match-photos">
          <div className="photo-container">
            <img src="https://randomuser.me/api/portraits/men/1.jpg" alt="You" />
            <span>You</span>
          </div>
          <div className="heart-icon">💖</div>
          <div className="photo-container">
            <img src={currentMatch?.profile.photos[0]} alt={currentMatch?.profile.name} />
            <span>{currentMatch?.profile.name}</span>
          </div>
        </div>
        
        <div className="match-actions">
          <button className="start-chat-btn" onClick={startChat}>
            💬 Start Chatting
          </button>
          <button className="keep-swiping-btn" onClick={resetToSwiping}>
            🔥 Keep Swiping
          </button>
        </div>
        
        <div className="match-tips">
          <h3>💡 First Message Tips:</h3>
          <ul>
            <li>Reference something from their profile</li>
            <li>Ask an engaging question</li>
            <li>Be authentic and show personality</li>
            <li>Avoid generic "hey" messages</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderChattingStage = () => (
    <div className="chatting-stage">
      <div className="chat-header">
        <button className="back-btn" onClick={() => setStage('matched')}>
          ← Back
        </button>
        <div className="match-info">
          <img src={currentMatch?.profile.photos[0]} alt={currentMatch?.profile.name} />
          <div>
            <h3>{currentMatch?.profile.name}</h3>
            <span className="online-status">🟢 Online</span>
          </div>
        </div>
        <button className="video-call-btn" onClick={unlockVideoCall}>
          📹 Video Date
        </button>
      </div>
      
      <ChatSimulation 
        npcId={currentMatch?.profile.id || 'alex'}
        onVideoCallUnlock={unlockVideoCall}
      />
    </div>
  );

  const renderVideoDateStage = () => (
    <div className="video-date-stage">
      <div className="video-header">
        <button className="back-btn" onClick={() => setStage('chatting')}>
          ← Back to Chat
        </button>
        <h3>📹 Video Date with {currentMatch?.profile.name}</h3>
      </div>
      
      <RPMVideoCall 
        npcProfile={{
          id: currentMatch?.profile.id || 'alex',
          name: currentMatch?.profile.name || 'Alex',
          avatar: currentMatch?.profile.avatar || {
            id: 'fallback-avatar',
            name: 'Alex',
            gender: 'male' as const,
            style: 'realistic' as const,
            avatarUrl: ''
          },
          personality: currentMatch?.profile.personality || {
            traits: ['friendly'],
            responseStyle: 'casual'
          }
        }}
        scenario="video-date"
        onCallEnd={completeSimulation}
      />
    </div>
  );

  const renderCompletedStage = () => (
    <div className="completed-stage">
      <div className="completion-celebration">
        <h1>🎊 Simulation Complete! 🎊</h1>
        <p>Great job practicing with {currentMatch?.profile.name}!</p>
        
        <div className="final-scores">
          <h3>📊 Your Performance:</h3>
          <div className="score-grid">
            <div className="score-item">
              <span className="score-label">First Message</span>
              <span className="score-value">85%</span>
            </div>
            <div className="score-item">
              <span className="score-label">Conversation Flow</span>
              <span className="score-value">78%</span>
            </div>
            <div className="score-item">
              <span className="score-label">Rizz Score</span>
              <span className="score-value">82%</span>
            </div>
            <div className="score-item">
              <span className="score-label">Video Chemistry</span>
              <span className="score-value">76%</span>
            </div>
          </div>
        </div>
        
        <div className="completion-actions">
          <button className="new-match-btn" onClick={resetToSwiping}>
            🔥 Find New Match
          </button>
          <button className="dashboard-btn" onClick={() => window.location.href = '/skills-dashboard'}>
            📊 View Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  const renderPreferencesStage = () => (
    <div className="preferences-stage">
      <div className="stage-header">
        <h2>🎯 Set Your Dating Preferences</h2>
        <p>Customize your ideal matches for realistic practice scenarios</p>
      </div>
      
      <div className="avatar-creation-section">
        <div className="avatar-creator-card">
          <h3>🎨 Create Your Avatar First</h3>
          <p>Want to create your own avatar before starting? Use Ready Player Me!</p>
          <button 
            className="create-avatar-btn"
            onClick={() => setShowAvatarCreator(true)}
          >
            🎭 Create Custom Avatar
          </button>
        </div>
        
        <div className="avatar-creator-card">
          <h3>🔄 Refresh Profiles</h3>
          <p>Generate new profiles with fresh RPM avatars</p>
          <button 
            className="create-avatar-btn"
            onClick={async () => {
              if (userPreferences) {
                const newProfiles = await AvatarGenerator.generateProfiles(userPreferences, 6);
                await handleProfilesGenerated(newProfiles);
              }
            }}
          >
            🔄 Regenerate Profiles
          </button>
        </div>
      </div>
      
      <UserPreferencesComponent 
        onPreferencesChange={handlePreferencesChange}
        onProfilesGenerated={handleProfilesGenerated}
      />
      
      <div className="stage-actions">
        <button 
          className="skip-btn"
          onClick={async () => {
            const demoPreferences: UserPreferences = {
              interestedIn: 'all',
              ageRange: [22, 35],
              styles: ['realistic'],
              ethnicities: ['caucasian', 'asian', 'hispanic'],
              bodyTypes: ['halfbody', 'fullbody'],
              personalityTypes: ['outgoing', 'intellectual']
            };
            const demoProfiles = await AvatarGenerator.generateProfiles(demoPreferences, 6);
            await handleProfilesGenerated(demoProfiles);
            setStage('profile-generation');
          }}
        >
          🚀 Quick Demo (Skip to Avatars)
        </button>
        <button 
          className="continue-btn"
          onClick={() => setStage('swiping')}
          disabled={!userPreferences}
        >
          Continue to Swiping →
        </button>
      </div>
    </div>
  );

  const renderProfileGenerationStage = () => (
    <div className="profile-generation-stage">
      <div className="stage-header">
        <h2>🎭 Your Generated Profiles</h2>
        <p>AI-generated diverse profiles based on your preferences</p>
      </div>
      
      <div className="avatar-creation-section">
        <div className="avatar-creator-card">
          <h3>🎨 Create Your Own Avatar</h3>
          <p>Want to practice with a custom avatar? Create your own using Ready Player Me!</p>
          <button 
            className="create-avatar-btn"
            onClick={() => setShowAvatarCreator(true)}
          >
            🎭 Create Custom Avatar
          </button>
        </div>
        
        <div className="avatar-creator-card">
          <h3>🔄 Refresh Profiles</h3>
          <p>Generate new profiles with fresh RPM avatars</p>
          <button 
            className="create-avatar-btn"
            onClick={async () => {
              if (userPreferences) {
                const newProfiles = await AvatarGenerator.generateProfiles(userPreferences, 6);
                await handleProfilesGenerated(newProfiles);
              }
            }}
          >
            🔄 Regenerate Profiles
          </button>
        </div>
      </div>
      
      <ProfileGallery
        profiles={generatedProfiles}
        onProfileSelect={handleProfileSelect}
        onStartChat={handleStartChat}
      />
      
      <div className="stage-actions">
        <button 
          className="back-btn"
          onClick={() => setStage('preferences')}
        >
          ← Back to Preferences
        </button>
        <button 
          className="continue-btn"
          onClick={() => setStage('swiping')}
        >
          Continue to Swiping →
        </button>
      </div>
    </div>
  );

  const renderStage = () => {
    switch (stage) {
      case 'preferences':
        return renderPreferencesStage();
      case 'profile-generation':
        return renderProfileGenerationStage();
      case 'swiping':
        return renderSwipingStage();
      case 'matched':
        return renderMatchedStage();
      case 'chatting':
        return renderChattingStage();
      case 'video-date':
        return renderVideoDateStage();
      case 'completed':
        return renderCompletedStage();
      default:
        return null;
    }
  };

  // Helper functions for profile generation
  const getRandomOccupation = () => {
    const occupations = [
      'Software Engineer', 'Teacher', 'Designer', 'Marketing Manager', 'Nurse',
      'Photographer', 'Writer', 'Consultant', 'Artist', 'Entrepreneur',
      'Doctor', 'Lawyer', 'Chef', 'Musician', 'Therapist'
    ];
    return occupations[Math.floor(Math.random() * occupations.length)];
  };

  const getRandomEducation = () => {
    const educations = [
      'Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'High School',
      'Associate Degree', 'Trade School', 'Some College'
    ];
    return educations[Math.floor(Math.random() * educations.length)];
  };

  const getRandomDealBreakers = () => {
    const dealBreakers = [
      'smoking', 'no ambition', 'rudeness', 'dishonesty', 'poor hygiene',
      'excessive drinking', 'no sense of humor', 'close-mindedness'
    ];
    return dealBreakers.slice(0, Math.floor(Math.random() * 3) + 1);
  };

  return (
    <div className="dating-simulation-flow">
      {renderStage()}
      
      <div className="progress-indicator">
        <div className={`step ${stage === 'swiping' ? 'active' : ['matched', 'chatting', 'video-date', 'completed'].includes(stage) ? 'completed' : ''}`}>
          🔥 Match
        </div>
        <div className={`step ${stage === 'chatting' ? 'active' : ['video-date', 'completed'].includes(stage) ? 'completed' : ''}`}>
          💬 Chat
        </div>
        <div className={`step ${stage === 'video-date' ? 'active' : stage === 'completed' ? 'completed' : ''}`}>
          📹 Video Date
        </div>
        <div className={`step ${stage === 'completed' ? 'active' : ''}`}>
          🎊 Complete
        </div>
      </div>
      {showAvatarCreator && (
        <RPMAvatarCreatorModal
          isOpen={showAvatarCreator}
          onClose={() => setShowAvatarCreator(false)}
          onAvatarCreated={(avatarUrl: string) => {
            console.log('New avatar created:', avatarUrl);
            // You can add logic here to save the avatar or add it to profiles
            setShowAvatarCreator(false);
          }}
        />
      )}
    </div>
  );
};

export default DatingSimulationFlow;
