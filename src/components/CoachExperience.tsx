import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import CoachAvatar from './CoachAvatar';
import { useVoice } from '@humeai/voice-react';
import '../styles/CoachExperience.css';

// Preload avatar model
useGLTF.preload('/avatars/AngelChick.glb');
useGLTF.preload('/avatars/male_1.glb');
useGLTF.preload('/animations/M_Standing_Idle_001.glb');
useGLTF.preload('/animations/M_Talking_Variations_001.glb');

const CoachExperience: React.FC = () => {
  const { connect, disconnect, status, sendSessionSettings, messages } = useVoice();
  const [isCoachSpeaking, setIsCoachSpeaking] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  // Get NPC info from localStorage (from dating flow)
  const [npcInfo, setNpcInfo] = useState<any>(null);
  
  useEffect(() => {
    const savedNPC = localStorage.getItem('currentVideoCallNPC');
    if (savedNPC) {
      const npc = JSON.parse(savedNPC);
      setNpcInfo(npc);
      // Preload the specific avatar
      if (npc.avatarPath) {
        useGLTF.preload(npc.avatarPath);
      }
    }
  }, []);

  useEffect(() => {
    setConnectionStatus(status.value as any);
  }, [status]);

  // Track when the coach is speaking
  useEffect(() => {
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      // Check for assistant messages (when coach is speaking)
      if (lastMessage.type === 'assistant_message') {
        setIsCoachSpeaking(true);
      } else if (lastMessage.type === 'assistant_end' || 
                 lastMessage.type === 'user_interruption' ||
                 lastMessage.type === 'user_message') {
        setIsCoachSpeaking(false);
      }
    }
  }, [messages]);

  // Use matched NPC's avatar or default to AngelChick
  const avatarUrl = npcInfo?.avatarPath || '/avatars/AngelChick.glb';
  const coachName = npcInfo?.name || 'Alex';

  const startConversation = async () => {
    try {
      await connect();
      
      // Set up the coach's personality
      setTimeout(() => {
        sendSessionSettings({
          systemPrompt: `You are a compassionate, understanding dating coach named ${coachName}. You're like a supportive older brother who genuinely wants to help people become their best selves. You:
          - Listen deeply and ask thoughtful questions
          - Share wisdom from your own experiences
          - Celebrate small wins and progress
          - Never judge, always support
          - Help people discover their authentic charm
          - Keep conversations natural and human
          - Use humor when appropriate to ease tension
          - Remember previous conversations and build on them
          
          Start by warmly greeting the user and asking how they're doing today. Make them feel comfortable and valued.`
        });
      }, 1000);
      
      setConversationStarted(true);
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const endConversation = async () => {
    await disconnect();
    setConversationStarted(false);
  };

  return (
    <div className="coach-experience">
      <div className="coach-header">
        <h1>Your Personal Dating Coach</h1>
        <p>Let's work together to bring out your best self</p>
      </div>

      <div className="coach-content">
        <div className="avatar-section">
          <Canvas
            camera={{ position: [0, 1.6, 1.8], fov: 35 }}
            style={{ background: '#f0f4f8' }}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={0.8} />
            <Environment preset="sunset" />
            
            <CoachAvatar
              avatarUrl={avatarUrl}
              position={[0, -0.2, 0]}
              scale={1}
              isSpeaking={isCoachSpeaking}
            />
            
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              minPolarAngle={Math.PI / 2.1}
              maxPolarAngle={Math.PI / 1.9}
              target={[0, 1.4, 0]}
            />
          </Canvas>
        </div>

        <div className="conversation-section">
          {!conversationStarted ? (
            <div className="welcome-state">
              <h2>Ready to level up your dating life?</h2>
              <p>
                I'm {coachName}, your personal dating coach. Think of me as that friend who always gives you 
                honest, supportive advice. I'm here to help you discover what makes you unique and 
                attractive, practice conversations, and build genuine confidence.
              </p>
              
              <div className="coach-promises">
                <div className="promise-card">
                  <span className="promise-icon">🤝</span>
                  <h3>No Judgment</h3>
                  <p>This is a safe space to be yourself</p>
                </div>
                <div className="promise-card">
                  <span className="promise-icon">💡</span>
                  <h3>Practical Advice</h3>
                  <p>Real strategies that actually work</p>
                </div>
                <div className="promise-card">
                  <span className="promise-icon">🎯</span>
                  <h3>Personalized Growth</h3>
                  <p>Tailored to your unique strengths</p>
                </div>
              </div>

              <button 
                className="start-button"
                onClick={startConversation}
                disabled={connectionStatus === 'connecting'}
              >
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Start Conversation'}
              </button>
            </div>
          ) : (
            <div className="active-conversation">
              <div className="connection-status">
                <span className={`status-indicator ${connectionStatus}`}></span>
                {connectionStatus === 'connected' ? `${coachName} is listening...` : 'Connecting...'}
              </div>
              
              <div className="conversation-tips">
                <p>💡 Talk naturally, like you're chatting with a friend</p>
                <p>🎯 Be honest about your challenges and goals</p>
                <p>✨ Remember, every expert was once a beginner</p>
              </div>

              <button 
                className="end-button"
                onClick={endConversation}
              >
                End Conversation
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="coach-footer">
        <p>
          "The most attractive thing you can be is yourself. 
          Let's work on bringing out the best version of you."
        </p>
      </div>
    </div>
  );
};

export default CoachExperience;
