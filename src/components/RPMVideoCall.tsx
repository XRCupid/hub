import React, { useState, useEffect, useRef } from 'react';
import RPMAvatar from './RPMAvatar';
import { VoiceProvider, useVoice } from "@humeai/voice-react";

interface RPMVideoCallProps {
  npcProfile: {
    id: string;
    name: string;
    avatar: {
      id: string;
      name: string;
      gender: 'male' | 'female';
      style: 'realistic' | 'cartoon';
      avatarUrl: string;
    };
    personality: {
      traits: string[];
      responseStyle: string;
    };
  };
  onCallEnd?: () => void;
  scenario?: string;
}

interface CallState {
  isConnected: boolean;
  isUserSpeaking: boolean;
  isNpcSpeaking: boolean;
  callDuration: number;
  currentEmotion: string;
  emotionIntensity: number;
  isMuted: boolean;
  isVideoOff: boolean;
}

interface EmotionState {
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  disgust: number;
  neutral: number;
  concentration: number;
  [key: string]: number;
}

interface ChatMessage {
  type: 'user' | 'npc';
  content: string;
  timestamp: string;
}

interface ConversationAnalytics {
  engagement: number;
  chemistry: number;
  conversationFlow: number;
  eyeContact: number;
  responseTime: number;
}

const RPMVideoCallContent: React.FC<RPMVideoCallProps> = ({
  npcProfile,
  onCallEnd,
  scenario = 'video-date'
}) => {
  const [callState, setCallState] = useState<CallState>({
    isConnected: false,
    isUserSpeaking: false,
    isNpcSpeaking: false,
    callDuration: 0,
    currentEmotion: 'neutral',
    emotionIntensity: 0.3,
    isMuted: false,
    isVideoOff: false
  });

  const [npcEmotions, setNpcEmotions] = useState<EmotionState>({
    joy: 0.2,
    sadness: 0.1,
    anger: 0.1,
    fear: 0.1,
    surprise: 0.1,
    disgust: 0.1,
    neutral: 0.5,
    concentration: 0.1
  });

  const [conversationAnalytics, setConversationAnalytics] = useState<ConversationAnalytics>({
    engagement: 75,
    chemistry: 68,
    conversationFlow: 82,
    eyeContact: 70,
    responseTime: 85
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Mock Hume AI connection for testing
  const mockVoiceState = {
    connect: async () => {
      console.log('🎭 Mock: Starting video call...');
      setCallState(prev => ({ ...prev, isConnected: true }));
    },
    disconnect: () => {
      console.log('🎭 Mock: Ending video call...');
      setCallState(prev => ({ ...prev, isConnected: false }));
    },
    status: 'disconnected',
    messages: []
  };
  
  // Use mock for now - replace with useVoice() when Hume AI is properly configured
  const { connect, disconnect, status } = mockVoiceState;
  const callTimerRef = useRef<NodeJS.Timeout>();

  // Debug logging
  useEffect(() => {
    console.log('🎭 NPC Profile:', npcProfile);
    console.log('🎭 Avatar URL:', npcProfile.avatar?.avatarUrl);
    console.log('🎭 Avatar Object:', npcProfile.avatar);
  }, [npcProfile]);

  // Start call timer
  useEffect(() => {
    if (callState.isConnected) {
      callTimerRef.current = setInterval(() => {
        setCallState(prev => ({
          ...prev,
          callDuration: prev.callDuration + 1
        }));
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callState.isConnected]);

  // Process Hume AI messages for emotion analysis (simplified for mock)
  useEffect(() => {
    // For now, skip complex message processing since we're using mock
    // This will be re-enabled when proper Hume AI integration is added
    console.log('📝 Messages updated:', messages.length);
  }, [messages]);

  // Simulate emotions for testing (remove when Hume AI is connected)
  useEffect(() => {
    if (callState.isConnected) {
      const emotionInterval = setInterval(() => {
        const emotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'neutral', 'concentration'];
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
        
        setNpcEmotions(prev => ({
          ...prev,
          [randomEmotion]: Math.random() * 0.8 + 0.2,
          neutral: 0.2
        }));
        
        console.log(`🎭 Mock emotion: ${randomEmotion}`);
      }, 3000); // Change emotion every 3 seconds
      
      return () => clearInterval(emotionInterval);
    }
  }, [callState.isConnected]);

  const startCall = async () => {
    try {
      await connect();
      setCallState(prev => ({ ...prev, isConnected: true }));
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };

  const endCall = () => {
    disconnect();
    setCallState(prev => ({ ...prev, isConnected: false }));
    onCallEnd?.();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getScenarioContext = () => {
    const contexts = {
      'video-date': {
        title: 'Video Date',
        description: 'First video call to check chemistry and vibe',
        tips: ['Make eye contact', 'Show genuine interest', 'Ask engaging questions', 'Be yourself']
      },
      'follow-up': {
        title: 'Follow-up Call',
        description: 'Building on your previous conversation',
        tips: ['Reference previous topics', 'Share something personal', 'Plan future activities']
      },
      'casual-chat': {
        title: 'Casual Chat',
        description: 'Relaxed conversation to get to know each other',
        tips: ['Keep it light', 'Share stories', 'Find common interests']
      }
    };
    return contexts[scenario as keyof typeof contexts] || contexts['video-date'];
  };

  const scenarioInfo = getScenarioContext();

  return (
    <div className="video-call-container">
      <style>{`
        .video-call-container {
          background: #1a1a1a;
          border-radius: 12px;
          overflow: hidden;
          color: white;
          width: 100%;
          height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .video-call-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: rgba(0,0,0,0.5);
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .call-info h3 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
        }

        .call-status {
          font-size: 14px;
          opacity: 0.8;
        }

        .header-btn {
          background: #ff4757;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .header-btn:hover {
          background: #ff3742;
        }

        .video-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .npc-video-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 1200px;
          width: 100%;
        }

        .avatar-display {
          width: 80vw;
          max-width: 1000px;
          height: 60vh;
          min-height: 400px;
          background: #2a2a2a;
          border-radius: 16px;
          overflow: hidden;
          border: 2px solid #4A90E2;
          margin-bottom: 20px;
        }

        .video-avatar {
          width: 100%;
          height: 100%;
        }

        .npc-info {
          text-align: center;
          margin-bottom: 30px;
        }

        .npc-info h4 {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 600;
        }

        .emotion-status {
          font-size: 14px;
          opacity: 0.7;
          color: #4A90E2;
        }

        .simple-controls {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .control-btn {
          background: #2a2a2a;
          color: white;
          border: 2px solid #4A90E2;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .control-btn:hover {
          background: #4A90E2;
          transform: translateY(-2px);
        }

        .control-btn.muted {
          background: #ff4757;
          border-color: #ff4757;
        }

        .end-call-btn {
          background: #ff4757;
          border-color: #ff4757;
        }

        .end-call-btn:hover {
          background: #ff3742;
          border-color: #ff3742;
        }

        @media (max-width: 768px) {
          .video-content {
            padding: 20px;
          }
          
          .avatar-display {
            width: 100%;
            max-width: 400px;
            height: 300px;
          }
          
          .simple-controls {
            flex-direction: column;
            gap: 12px;
          }
          
          .control-btn {
            width: 200px;
          }
        }
      `}</style>
      <div className="video-call-header">
        <div className="call-info">
          <h3>Video Date with {npcProfile.name}</h3>
          <span className="call-status">
            {callState.isConnected ? '🟢 Connected' : '🔴 Connecting...'}
          </span>
        </div>
        <div className="call-controls-header">
          <button className="header-btn" onClick={endCall}>
            End Call
          </button>
        </div>
      </div>

      <div className="video-content">
        {/* Main NPC Avatar */}
        <div className="npc-video-container">
          <div className="avatar-display">
            <RPMAvatar
              avatarUrl={npcProfile.avatar?.avatarUrl || ''} 
              emotions={npcEmotions}
              isAnimating={true}
              className="video-avatar"
            />
          </div>
          <div className="npc-info">
            <h4>{npcProfile.name}</h4>
            <div className="emotion-status">
              Current mood: {callState.currentEmotion}
            </div>
          </div>
        </div>

        {/* Simple Controls */}
        <div className="simple-controls">
          <button className={`control-btn ${callState.isMuted ? 'muted' : ''}`}>
            {callState.isMuted ? '🔇 Unmute' : '🎤 Mute'}
          </button>
          <button className="control-btn end-call-btn" onClick={endCall}>
            📞 End Call
          </button>
        </div>
      </div>
    </div>
  );
};

export const RPMVideoCall: React.FC<RPMVideoCallProps> = (props) => {
  return (
    <VoiceProvider 
      auth={{ type: "apiKey", value: process.env.REACT_APP_HUME_API_KEY || "" }}
      hostname={process.env.REACT_APP_HUME_HOSTNAME}
    >
      <RPMVideoCallContent {...props} />
    </VoiceProvider>
  );
};

export default RPMVideoCall;
