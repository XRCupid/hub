import React, { useState, useRef, useEffect, FC } from 'react';
import { HumeVoiceService } from '../services/humeVoiceService';
import { ML5FaceMeshService } from '../services/ML5FaceMeshService';
import { PostureTrackingService } from '../services/PostureTrackingService';
import { UserAvatarPiP } from './UserAvatarPiP';
import './NPCDateCall.css';

interface NPCDateCallProps {
  npcName: string;
  npcArchetype: string;
  userName: string;
  onCallEnd: () => void;
}

const NPCDateCall: React.FC<NPCDateCallProps> = ({ 
  npcName, 
  npcArchetype, 
  userName,
  onCallEnd 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmotions, setUserEmotions] = useState<any>({});
  const [conversationScore, setConversationScore] = useState(0);
  const [showPiP, setShowPiP] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const humeService = useRef<HumeVoiceService | null>(null);
  const faceMeshService = useRef<ML5FaceMeshService | null>(null);
  const postureService = useRef<PostureTrackingService | null>(null);

  useEffect(() => {
    initializeCall();
    return () => {
      cleanupServices();
    };
  }, []);

  const initializeCall = async () => {
    try {
      // Initialize video stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Initialize tracking services
      faceMeshService.current = new ML5FaceMeshService();
      postureService.current = new PostureTrackingService();
      
      // Initialize Hume voice service with real API key
      humeService.current = new HumeVoiceService();
      
      // Setup real Hume emotion callbacks
      if (humeService.current) {
        console.log('[NPCDateCall] Setting up Hume callbacks');
        
        // Set up emotion callback to receive real emotion data
        humeService.current.setOnEmotionCallback((emotions: any) => {
          console.log('[NPCDateCall] 🎭 Received Hume emotions:', emotions);
          
          // Format emotions for display
          const formattedEmotions = Array.isArray(emotions) ? emotions : [emotions];
          const emotionMap: any = {};
          
          // Convert to emotion map format
          formattedEmotions.forEach((emotion: any) => {
            if (emotion.name && emotion.score !== undefined) {
              emotionMap[emotion.name.toLowerCase()] = emotion.score;
            }
          });
          
          setUserEmotions(emotionMap);
          updateConversationScore(emotionMap);
        });

        // Setup other Hume callbacks
        humeService.current.setOnMessageCallback((message: any) => {
          console.log('[NPCDateCall] 💬 Hume message:', message);
        });

        humeService.current.setOnErrorCallback((error: any) => {
          console.error('[NPCDateCall] ❌ Hume error:', error);
        });

        // Initialize and start Hume session
        try {
          await humeService.current.connect();
          console.log('[NPCDateCall] ✅ Hume session started successfully');
        } catch (humeError) {
          console.error('[NPCDateCall] Failed to start Hume session:', humeError);
          // Fallback to simulated emotions if Hume fails
          setupFallbackEmotions();
        }
      }

      // Simulate NPC personality based on archetype
      const npcPersonality = getNPCPersonality(npcArchetype);
      
      setIsLoading(false);
      setIsConnected(true);
      
      // Welcome message from NPC
      simulateNPCMessage(`Hi ${userName}! I'm ${npcName}. ${npcPersonality.greeting}`);
      
    } catch (error) {
      console.error('Error initializing NPC date call:', error);
      setIsLoading(false);
      // Setup fallback emotions if initialization fails
      setupFallbackEmotions();
    }
  };

  const setupFallbackEmotions = () => {
    console.log('[NPCDateCall] Setting up fallback emotion simulation');
    const emotionCheckInterval = setInterval(() => {
      // Simulate emotion values for demo purposes as fallback
      const simulatedEmotions = {
        joy: Math.random() * 0.5 + 0.3,
        interest: Math.random() * 0.4 + 0.4,
        excitement: Math.random() * 0.3 + 0.2
      };
      setUserEmotions(simulatedEmotions);
      updateConversationScore(simulatedEmotions);
    }, 2000);
    
    // Store interval for cleanup
    (window as any).emotionInterval = emotionCheckInterval;
  };

  const getNPCPersonality = (archetype: string) => {
    const personalities: Record<string, any> = {
      'Adventurous Artist': {
        greeting: "I just got back from this amazing street art festival. What kind of creative things are you into?",
        topics: ['art', 'travel', 'creativity', 'experiences'],
        responseStyle: 'enthusiastic and imaginative'
      },
      'Tech Entrepreneur': {
        greeting: "I've been working on this fascinating AI project. Are you interested in technology?",
        topics: ['innovation', 'startups', 'future', 'technology'],
        responseStyle: 'analytical and forward-thinking'
      },
      'Wellness Coach': {
        greeting: "You have such positive energy! What do you do to stay centered?",
        topics: ['wellness', 'mindfulness', 'health', 'balance'],
        responseStyle: 'calm and supportive'
      },
      'Travel Blogger': {
        greeting: "I love meeting new people! What's the most interesting place you've been to?",
        topics: ['travel', 'culture', 'adventure', 'stories'],
        responseStyle: 'curious and adventurous'
      }
    };
    
    return personalities[archetype] || personalities['Adventurous Artist'];
  };

  const updateConversationScore = (emotions: any) => {
    // Calculate score based on positive emotions
    const positiveEmotions = ['joy', 'interest', 'excitement', 'amusement'];
    const positiveScore = positiveEmotions.reduce((sum, emotion) => 
      sum + (emotions[emotion] || 0), 0
    );
    
    setConversationScore(prev => Math.min(100, prev + positiveScore * 10));
  };

  const simulateNPCMessage = (message: string) => {
    // In a real implementation, this would use Hume's voice API
    console.log(`${npcName}: ${message}`);
  };

  const cleanupServices = () => {
    console.log('[NPCDateCall] Cleaning up services');
    
    // Clean up Hume service
    if (humeService.current) {
      humeService.current.disconnect();
      humeService.current = null;
    }
    
    // Clean up other services
    if (faceMeshService.current) {
      faceMeshService.current = null;
    }
    
    if (postureService.current) {
      postureService.current = null;
    }
    
    // Clear emotion interval
    if ((window as any).emotionInterval) {
      clearInterval((window as any).emotionInterval);
      (window as any).emotionInterval = null;
    }
    
    // Clean up video stream
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const endCall = () => {
    cleanupServices();
    onCallEnd();
  };

  if (isLoading) {
    return (
      <div className="npc-date-call loading">
        <div className="loading-content">
          <div className="loading-spinner" />
          <p>Connecting with {npcName}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="npc-date-call">
      <div className="call-container">
        <div className="video-section">
          <div className="npc-video">
            <div className="npc-avatar-placeholder">
              <img 
                src={`https://ui-avatars.com/api/?name=${npcName}&size=200&background=FF6B6B&color=fff`} 
                alt={npcName}
              />
              <div className="npc-speaking-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div className="npc-info">
              <h3>{npcName}</h3>
              <p>{npcArchetype}</p>
            </div>
          </div>
          
          <div className="user-video">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline
              className="user-video-element"
            />
            <div className="user-info">
              <h4>{userName}</h4>
            </div>
          </div>
        </div>
        
        <div className="interaction-panel">
          <div className="emotion-display">
            <h4>Your Vibe</h4>
            <div className="emotion-indicators">
              {Object.entries(userEmotions).slice(0, 3).map(([emotion, value]) => (
                <div key={emotion} className="emotion-item">
                  <span className="emotion-label">{emotion}</span>
                  <div className="emotion-bar">
                    <div 
                      className="emotion-fill"
                      style={{ width: `${(value as number) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="chemistry-meter">
            <h4>Chemistry Level</h4>
            <div className="chemistry-visual">
              <div 
                className="chemistry-progress"
                style={{ height: `${conversationScore}%` }}
              />
              <span className="chemistry-value">{Math.round(conversationScore)}%</span>
            </div>
          </div>
          
          <div className="conversation-hints">
            <h4>Conversation Tips</h4>
            <ul>
              <li>Ask about their {npcArchetype.toLowerCase()} experiences</li>
              <li>Share a personal story</li>
              <li>Find common interests</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="call-controls">
        <button 
          className="pip-toggle"
          onClick={() => setShowPiP(!showPiP)}
          title={showPiP ? "Hide Avatar" : "Show Avatar"}
        >
          {showPiP ? '👤' : '👥'}
        </button>
        <button 
          className="end-call-button"
          onClick={endCall}
        >
          End Date
        </button>
      </div>
      {showPiP && <UserAvatarPiP />}
    </div>
  );
};

export default NPCDateCall;
