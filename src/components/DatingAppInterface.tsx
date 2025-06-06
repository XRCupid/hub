import React, { useState, useEffect, useRef } from 'react';
import { SwipeProfile, Match, TextConversation, SwipeAction, TextMessage } from '../types/DatingTypes';
import { generateDatingProfiles } from '../services/ProfileGenerator';
import TextingInterface from './TextingInterface';
import './DatingAppInterface.css';

interface DatingAppInterfaceProps {
  onScheduleDate: (profileId: string, conversation: TextConversation) => void;
  onCoachFeedback?: (feedback: string[]) => void;
  userPreferences?: {
    ageRange: [number, number];
    interests: string[];
    personalityTypes: string[];
  };
}

export const DatingAppInterface: React.FC<DatingAppInterfaceProps> = ({
  onScheduleDate,
  onCoachFeedback,
  userPreferences
}) => {
  const [profiles, setProfiles] = useState<SwipeProfile[]>([]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [conversations, setConversations] = useState<Map<string, TextConversation>>(new Map());
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [swipeHistory, setSwipeHistory] = useState<SwipeAction[]>([]);
  const [showMatches, setShowMatches] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Generate initial profiles
    const generatedProfiles = generateDatingProfiles(20, userPreferences);
    setProfiles(generatedProfiles);
  }, [userPreferences]);

  const handleSwipe = (action: 'like' | 'superlike' | 'pass') => {
    if (currentProfileIndex >= profiles.length) return;

    const currentProfile = profiles[currentProfileIndex];
    const swipeAction: SwipeAction = {
      profileId: currentProfile.id,
      action,
      timestamp: new Date(),
      timeSpent: 10 // TODO: Track actual time
    };

    setSwipeHistory([...swipeHistory, swipeAction]);

    // Handle match logic
    if (action === 'like' || action === 'superlike') {
      const matchProbability = action === 'superlike' ? 0.8 : 0.5;
      if (Math.random() < matchProbability) {
        const newMatch: Match = {
          id: `match-${Date.now()}`,
          userId: 'user',
          profileId: currentProfile.id,
          matchedAt: new Date(),
          conversationStarted: false
        };
        setMatches([...matches, newMatch]);
        
        // Initialize conversation
        const conversation: TextConversation = {
          id: `conv-${currentProfile.id}`,
          profileId: currentProfile.id,
          messages: [],
          status: 'active'
        };
        conversations.set(currentProfile.id, conversation);
        setConversations(new Map(conversations));

        // Show match animation
        showMatchAnimation();
      }
    }

    // Animate card out
    if (cardRef.current) {
      cardRef.current.style.transform = action === 'pass' 
        ? 'translateX(-150%) rotate(-30deg)' 
        : 'translateX(150%) rotate(30deg)';
      cardRef.current.style.opacity = '0';
    }

    setTimeout(() => {
      setCurrentProfileIndex(currentProfileIndex + 1);
      if (cardRef.current) {
        cardRef.current.style.transform = 'translateX(0) rotate(0)';
        cardRef.current.style.opacity = '1';
      }
    }, 300);

    // Provide coach feedback
    if (onCoachFeedback && swipeHistory.length % 5 === 0) {
      analyzeSwipingPattern();
    }
  };

  const showMatchAnimation = () => {
    // TODO: Implement match animation
    console.log("It's a match!");
  };

  const analyzeSwipingPattern = () => {
    const recentSwipes = swipeHistory.slice(-10);
    const likeRatio = recentSwipes.filter(s => s.action !== 'pass').length / recentSwipes.length;
    const avgTimeSpent = recentSwipes.reduce((acc, s) => acc + s.timeSpent, 0) / recentSwipes.length;

    const feedback: string[] = [];
    
    if (likeRatio > 0.8) {
      feedback.push("You're swiping right on almost everyone. Try being more selective!");
    } else if (likeRatio < 0.2) {
      feedback.push("You're being very selective. Remember to keep an open mind!");
    }

    if (avgTimeSpent < 3) {
      feedback.push("Take more time to read profiles before swiping.");
    }

    if (onCoachFeedback && feedback.length > 0) {
      onCoachFeedback(feedback);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    currentX.current = e.touches[0].clientX;
    const deltaX = currentX.current - startX.current;
    
    if (cardRef.current) {
      const rotation = deltaX * 0.1;
      cardRef.current.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;
      
      // Update visual feedback
      const opacity = Math.abs(deltaX) / 100;
      if (deltaX > 0) {
        cardRef.current.querySelector('.like-label')?.setAttribute('style', `opacity: ${opacity}`);
      } else {
        cardRef.current.querySelector('.pass-label')?.setAttribute('style', `opacity: ${opacity}`);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const deltaX = currentX.current - startX.current;
    if (Math.abs(deltaX) > 100) {
      handleSwipe(deltaX > 0 ? 'like' : 'pass');
    } else {
      // Snap back
      if (cardRef.current) {
        cardRef.current.style.transform = 'translateX(0) rotate(0)';
        cardRef.current.querySelector('.like-label')?.setAttribute('style', 'opacity: 0');
        cardRef.current.querySelector('.pass-label')?.setAttribute('style', 'opacity: 0');
      }
    }
  };

  const handleSendMessage = (profileId: string, message: string) => {
    const conversation = conversations.get(profileId);
    if (!conversation) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'user',
      recipientId: profileId,
      content: message,
      timestamp: new Date(),
      read: false
    };

    conversation.messages.push(newMessage);
    conversations.set(profileId, conversation);
    setConversations(new Map(conversations));

    // Simulate NPC response
    setTimeout(() => {
      simulateNPCResponse(profileId);
    }, 2000 + Math.random() * 3000);
  };

  const simulateNPCResponse = (profileId: string) => {
    const conversation = conversations.get(profileId);
    const profile = profiles.find(p => p.id === profileId);
    if (!conversation || !profile) return;

    // Generate contextual response based on personality
    const responses = generateNPCResponses(profile, conversation);
    const response = responses[Math.floor(Math.random() * responses.length)];

    const npcMessage = {
      id: `msg-${Date.now()}`,
      senderId: profileId,
      recipientId: 'user',
      content: response,
      timestamp: new Date(),
      read: false
    };

    conversation.messages.push(npcMessage);
    conversations.set(profileId, conversation);
    setConversations(new Map(conversations));
  };

  const currentProfile = profiles[currentProfileIndex];

  if (selectedMatch && conversations.get(selectedMatch)) {
    const conversation = conversations.get(selectedMatch)!;
    const profile = profiles.find(p => p.id === selectedMatch);
    
    if (!profile) return null;
    
    return (
      <div className="dating-app-container">
        <button 
          className="back-to-matches"
          onClick={() => setSelectedMatch(null)}
        >
          ← Back to Matches
        </button>
        <TextingInterface
          profile={{
            id: selectedMatch,
            name: profile.name,
            age: profile.age,
            occupation: profile.occupation,
            bio: profile.bio,
            interests: profile.interests,
            photos: profile.photos,
            personality: profile.personality,
            conversationStarters: profile.conversationStarters,
            dealBreakers: profile.dealBreakers || [],
            greenFlags: profile.greenFlags || []
          }}
          conversation={conversation}
          onSendMessage={(msg) => handleSendMessage(selectedMatch, msg)}
          onScheduleDate={() => {
            if (onScheduleDate) {
              onScheduleDate(selectedMatch, conversation);
            }
          }}
          coachTips={generateCoachTips(conversation)}
        />
      </div>
    );
  }

  if (showMatches) {
    return (
      <div className="matches-view">
        <div className="matches-header">
          <button onClick={() => setShowMatches(false)}>← Back</button>
          <h2>Your Matches ({matches.length})</h2>
        </div>
        <div className="matches-grid">
          {matches.map(match => {
            const profile = profiles.find(p => p.id === match.profileId);
            const conversation = conversations.get(match.profileId);
            const lastMessage = conversation?.messages[conversation.messages.length - 1];
            
            return profile ? (
              <div 
                key={match.id}
                className="match-card"
                onClick={() => setSelectedMatch(profile.id)}
              >
                <img src={profile.photos[0]} alt={profile.name} />
                <h3>{profile.name}</h3>
                {lastMessage && (
                  <p className="last-message">
                    {lastMessage.senderId === 'user' ? 'You: ' : ''}
                    {lastMessage.content.substring(0, 30)}...
                  </p>
                )}
                {!conversation?.messages.length && (
                  <p className="start-conversation">Start a conversation!</p>
                )}
              </div>
            ) : null;
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="dating-app-container">
      <div className="app-header">
        <button className="menu-btn">☰</button>
        <h1>XR Cupid</h1>
        <button 
          className="matches-btn"
          onClick={() => setShowMatches(true)}
        >
          💬 {matches.length}
        </button>
      </div>

      {currentProfile && currentProfileIndex < profiles.length ? (
        <div className="swipe-container">
          <div 
            ref={cardRef}
            className="profile-card"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="like-label">LIKE</div>
            <div className="pass-label">PASS</div>
            
            <div className="profile-images">
              <img src={currentProfile.photos[0]} alt={currentProfile.name} />
              <div className="image-dots">
                {currentProfile.photos.map((_, idx) => (
                  <span key={idx} className={idx === 0 ? 'active' : ''} />
                ))}
              </div>
            </div>
            
            <div className="profile-info">
              <h2>{currentProfile.name}, {currentProfile.age}</h2>
              <p className="occupation">{currentProfile.occupation}</p>
              {currentProfile.distance && (
                <p className="distance">{currentProfile.distance} miles away</p>
              )}
              
              <div className="bio">
                <p>{currentProfile.bio}</p>
              </div>
              
              <div className="interests">
                {currentProfile.interests.slice(0, 5).map((interest, idx) => (
                  <span key={idx} className="interest-tag">
                    {interest}
                  </span>
                ))}
              </div>

              {currentProfile.sharedInterests && currentProfile.sharedInterests.length > 0 && (
                <div className="shared-interests">
                  <h4>Shared Interests</h4>
                  <div className="interests">
                    {currentProfile.sharedInterests.map((interest, idx) => (
                      <span key={idx} className="shared-tag">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="action-buttons">
            <button 
              className="action-btn pass"
              onClick={() => handleSwipe('pass')}
            >
              ✕
            </button>
            <button 
              className="action-btn superlike"
              onClick={() => handleSwipe('superlike')}
            >
              ⭐
            </button>
            <button 
              className="action-btn like"
              onClick={() => handleSwipe('like')}
            >
              ❤️
            </button>
          </div>
        </div>
      ) : (
        <div className="no-more-profiles">
          <h2>No more profiles!</h2>
          <p>Check back later for more matches</p>
          <button onClick={() => setShowMatches(true)}>
            View Your Matches ({matches.length})
          </button>
        </div>
      )}
    </div>
  );
};

function generateNPCResponses(profile: SwipeProfile, conversation: TextConversation): string[] {
  // Generate contextual responses based on personality and conversation history
  const lastUserMessage = [...conversation.messages]
    .reverse()
    .find(m => m.senderId === 'user')?.content || '';

  const responses: string[] = [];

  // Personality-based responses
  switch (profile.personality) {
    case 'confident':
      responses.push(
        "I like your energy! Tell me something that would surprise me about you 😏",
        "Confidence is attractive, and you've definitely got my attention",
        "So what's your idea of a perfect date? I'm curious if we're on the same wavelength"
      );
      break;
    case 'shy':
      responses.push(
        "Hi! Sorry if I seem a bit nervous, online dating is still new to me 😊",
        "That's really sweet of you to say... what made you swipe right?",
        "I'd love to hear more about your interests. What do you do for fun?"
      );
      break;
    case 'adventurous':
      responses.push(
        "Hey there! Just got back from rock climbing. What adventures have you been on lately?",
        "Life's too short for boring dates. Want to do something spontaneous?",
        "I'm always up for trying new things! What's on your bucket list?"
      );
      break;
    case 'intellectual':
      responses.push(
        "I appreciate thoughtful conversation. What's been occupying your mind lately?",
        "That's an interesting perspective. Have you read anything good recently?",
        "I find intelligence incredibly attractive. What are you passionate about?"
      );
      break;
    case 'charming':
      responses.push(
        "Well hello there 😊 Your profile caught my eye. What's your story?",
        "I have a feeling we'd have great chemistry. Want to find out?",
        "You seem like someone who appreciates good conversation and even better company"
      );
      break;
  }

  return responses;
}

function generateCoachTips(conversation: TextConversation): string[] {
  const tips: string[] = [];
  
  if (conversation.messages.length === 0) {
    tips.push("Start with something from their profile to show you paid attention");
    tips.push("Keep it light and playful for the first message");
  } else if (conversation.messages.length < 5) {
    tips.push("Ask open-ended questions to keep the conversation flowing");
    tips.push("Share something about yourself to build connection");
  } else if (conversation.messages.length > 10) {
    tips.push("Consider suggesting a date if the conversation is going well");
    tips.push("Move from texting to real-life connection");
  }
  
  return tips;
}

export default DatingAppInterface;
