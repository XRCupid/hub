import React, { useState, useEffect, useRef, createRef, Suspense, useCallback, FC, ReactNode } from 'react';
// Force refresh: 2025-05-30T19:00:00
import { VoiceProvider, useVoice } from '@humeai/voice-react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { HumeNPCManager } from './HumeNPCManager';
import { NPCPersonalities, NPCPersonality, getRandomNPC } from '../config/NPCPersonalities';
import './DatingSimulationHub.css';
import CoachAvatar from './CoachAvatar';
import UserPresenceAvatar from './UserPresenceAvatar';
import { PhysicalCoach } from './PhysicalCoach';
import { coachAwareTracking } from '../services/CoachAwareTrackingSystem';
import { avatarGenerator } from '../services/AvatarAutoGenerator';
import { PRELOADED_AVATARS } from '../data/preloadedAvatars';

interface DatingSimulationMasterProps {
  onBack?: () => void;
}

interface DatingSimulationMasterState {
  isDateActive: boolean;
  currentNPC: NPCPersonality | null;
  userAvatarId: string;
  npcAvatarId: string | null;
  isNPCSpeaking: boolean;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  sessionScore: number;
  sessionFeedback: string[];
}

// Wrapper component to handle speaking states
const HumeVoiceWrapper: React.FC<{
  currentNPC: NPCPersonality;
  onNPCSpeakingChange: (speaking: boolean) => void;
  onUserSpeakingChange: (speaking: boolean) => void;
  onConversationUpdate: (message: { role: 'user' | 'assistant'; content: string }) => void;
  onPersonalityChange: (npc: NPCPersonality) => void;
}> = ({ currentNPC, onNPCSpeakingChange, onUserSpeakingChange, onConversationUpdate, onPersonalityChange }) => {
  const { messages, status, sendSessionSettings } = useVoice();
  
  // Update system prompt when NPC changes
  useEffect(() => {
    if (status.value === 'connected' && sendSessionSettings && currentNPC) {
      sendSessionSettings({
        systemPrompt: currentNPC.systemPrompt
      });
    }
  }, [currentNPC, status.value, sendSessionSettings]);
  
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;
    
    // Handle assistant speaking state
    if (lastMessage.type === 'assistant_message') {
      onNPCSpeakingChange(true);
      const content = lastMessage.message?.content;
      if (content) {
        onConversationUpdate({ role: 'assistant', content });
      }
    } else if (lastMessage.type === 'assistant_end') {
      onNPCSpeakingChange(false);
    }
    
    // Handle user speaking state
    if (lastMessage.type === 'user_message') {
      onUserSpeakingChange(true);
      const content = lastMessage.message?.content;
      if (content) {
        onConversationUpdate({ role: 'user', content });
      }
    } else if (lastMessage.type === 'user_interruption') {
      onUserSpeakingChange(false);
    }
  }, [messages, onNPCSpeakingChange, onUserSpeakingChange, onConversationUpdate]);
  
  return (
    <HumeNPCManager
      npcId={currentNPC.id}
      onPersonalityChange={onPersonalityChange}
    />
  );
};

export const DatingSimulationMaster: React.FC<DatingSimulationMasterProps> = ({ onBack = () => {} }) => {
  const [state, setState] = useState<DatingSimulationMasterState>({
    isDateActive: false,
    currentNPC: null,
    userAvatarId: 'user',
    npcAvatarId: null,
    isNPCSpeaking: false,
    conversationHistory: [],
    sessionScore: 0,
    sessionFeedback: []
  });

  const [voiceError, setVoiceError] = useState<string>('');

  // Debug logging
  useEffect(() => {
    console.log('=== HUME DEBUG ===');
    console.log('Full env check:', {
      hasApiKey: !!process.env.REACT_APP_HUME_API_KEY,
      hasConfigId: !!process.env.REACT_APP_HUME_CONFIG_ID,
      configIdValue: process.env.REACT_APP_HUME_CONFIG_ID,
      apiKeyLength: process.env.REACT_APP_HUME_API_KEY?.length || 0,
      allEnvKeys: Object.keys(process.env).filter(k => k.startsWith('REACT_APP_'))
    });
    
    // Log window.env if it exists (some React setups use this)
    if ((window as any).__env) {
      console.log('Window env:', (window as any).__env);
    }
  }, []);

  const humeApiKey = process.env.REACT_APP_HUME_API_KEY || '';
  const humeConfigId = process.env.REACT_APP_HUME_CONFIG_ID || '9c6f9d9b-1699-41bb-b335-9925bba5d6d9';

  if (!humeApiKey) {
    return (
      <div className="dating-simulation-master">
        <div className="error-message">
          <h2>Configuration Error</h2>
          <p>Hume API Key is missing. Please set REACT_APP_HUME_API_KEY in your .env file.</p>
          <button onClick={onBack} className="back-button">Back to Hub</button>
        </div>
      </div>
    );
  }

  return (
    <VoiceProvider
      auth={{ type: "apiKey", value: humeApiKey }}
      configId={humeConfigId}
      onError={(error) => {
        console.error('Hume VoiceProvider error:', error);
        console.error('Error details:', {
          message: error.message || error,
          type: error.type,
          error: error.error,
          apiKeyUsed: humeApiKey.substring(0, 10) + '...',
          configIdUsed: humeConfigId
        });
      }}
      onMessage={(message) => {
        console.log('Hume message:', message);
        if (message.type === 'error' && message.slug === 'usage_limit_reached') {
          setVoiceError('Monthly Hume API usage limit reached. Voice features unavailable until next billing cycle.');
        }
      }}
    >
      <DatingSimulationContent 
        onBack={onBack}
        state={state}
        setState={setState}
        voiceError={voiceError}
      />
    </VoiceProvider>
  );
};

// Main content component that uses voice hooks
const DatingSimulationContent: React.FC<{
  onBack?: () => void;
  state: DatingSimulationMasterState;
  setState: React.Dispatch<React.SetStateAction<DatingSimulationMasterState>>;
  voiceError: string;
}> = ({ onBack, state, setState, voiceError }) => {
  const { connect, disconnect, status, sendSessionSettings, messages } = useVoice();

  const {
    isDateActive,
    currentNPC,
    userAvatarId,
    npcAvatarId,
    isNPCSpeaking,
    conversationHistory,
    sessionScore,
    sessionFeedback
  } = state;

  const videoRef = React.createRef<HTMLVideoElement>();

  const [voiceStatus, setVoiceStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [webcamStatus, setWebcamStatus] = useState<'idle' | 'active' | 'error'>('idle');
  const [coachActive, setCoachActive] = useState(true);
  const [practiceMode, setPracticeMode] = useState(false);

  // Initialize with a random NPC
  useEffect(() => {
    if (!state.currentNPC) {
      setState(prev => ({ ...prev, currentNPC: getRandomNPC() }));
    }
  }, []);

  // Update avatar when NPC changes
  useEffect(() => {
    const initAvatars = async () => {
      const { currentNPC } = state;
      if (currentNPC) {
        // Get avatar ID directly from avatar generator
        const avatarId = avatarGenerator.getNPCAvatarId(currentNPC.id);
        setState(prev => ({ ...prev, npcAvatarId: avatarId }));
      }
    };
    initAvatars();
  }, [state.currentNPC]);

  // Initialize tracking system
  useEffect(() => {
    coachAwareTracking.startTracking();
    return () => {
      coachAwareTracking.stopTracking();
    };
  }, []);

  const handleNPCChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const npcId = e.target.value;
    const npc = NPCPersonalities[npcId];
    if (npc) {
      setState(prev => ({ ...prev, currentNPC: npc }));
    }
  };

  const userAvatar = PRELOADED_AVATARS.find(a => a.id === userAvatarId);
  const userAvatarUrl = userAvatar ? userAvatar.path : '/avatars/fool.glb';
  
  const npcAvatar = npcAvatarId ? PRELOADED_AVATARS.find(a => a.id === npcAvatarId) : null;
  const npcAvatarUrl = npcAvatar ? npcAvatar.path : '/avatars/chickie.glb';

  const setCurrentNPC = (npc: NPCPersonality | null) => {
    setState(prev => ({ ...prev, currentNPC: npc }));
  };

  const setNpcAvatarId = (id: string | null) => {
    setState(prev => ({ ...prev, npcAvatarId: id }));
  };

  const setIsNPCSpeaking = (speaking: boolean) => {
    setState(prev => ({ ...prev, isNPCSpeaking: speaking }));
  };

  const handleStartDate = useCallback(() => {
    if (!userAvatarId || !currentNPC || !npcAvatarId || status.value !== 'connected') {
      console.log('Cannot start date: Please ensure voice is connected and both avatars are selected');
      return;
    }
    setState(prev => ({ 
      ...prev, 
      isDateActive: true,
      conversationHistory: [],
      sessionScore: 0,
      sessionFeedback: []
    }));
    setCoachActive(true);
  }, [userAvatarId, currentNPC, npcAvatarId, status.value]);

  const handleEndDate = useCallback(() => {
    setState(prev => ({ ...prev, isDateActive: false }));
    setCoachActive(false);
    if (status.value === 'connected') {
      disconnect();
    }
  }, [disconnect, status.value]);

  const handleConversationUpdate = (message: { role: 'user' | 'assistant'; content: string }) => {
    setState(prev => ({
      ...prev,
      conversationHistory: [...prev.conversationHistory, message]
    }));
  };

  const handleConnect = async () => {
    try {
      const apiKey = process.env.REACT_APP_HUME_API_KEY || '';
      const configId = process.env.REACT_APP_HUME_CONFIG_ID || '9c6f9d9b-1699-41bb-b335-9925bba5d6d9';
      
      console.log('Attempting to connect with:', {
        apiKey: apiKey.substring(0, 10) + '...',
        configId: configId
      });
      
      setVoiceStatus('connecting');
      await connect();
      
      // Send the system prompt after connecting
      if (messages.length === 0 && currentNPC) {
        await sendSessionSettings({
          systemPrompt: currentNPC.systemPrompt
        });
      }
      
      setVoiceStatus('connected');
    } catch (error: any) {
      console.error('Failed to connect:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      setVoiceStatus('error');
    }
  };

  const humeApiKey = process.env.REACT_APP_HUME_API_KEY || '';
  const humeConfigId = process.env.REACT_APP_HUME_CONFIG_ID || '9c6f9d9b-1699-41bb-b335-9925bba5d6d9';

  // Test function for physical tracking
  const testPhysicalTracking = () => {
    console.log('🧪 Testing physical tracking...');
    coachAwareTracking.updateTrackingData({
      posture: {
        isOpen: Math.random() > 0.5,
        isLeaning: Math.random() > 0.5,
        shoulderTension: Math.random()
      },
      eyeContact: {
        isLooking: Math.random() > 0.3,
        duration: Math.floor(Math.random() * 5),
        quality: Math.random()
      },
      gestures: {
        areOpen: Math.random() > 0.5,
        isExpressive: Math.random() > 0.5,
        frequency: Math.floor(Math.random() * 10)
      },
      facial: {
        emotion: ['happy', 'neutral', 'interested', 'surprised'][Math.floor(Math.random() * 4)],
        intensity: Math.random(),
        mirroring: Math.random() > 0.5
      }
    });
  };

  if (isDateActive) {
    console.log('🎮 Rendering immersive date view');
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000',
        zIndex: 1000,
        overflow: 'hidden'
      }}>
        {/* Debug banner */}
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0,
          background: 'red', 
          color: 'white', 
          padding: '10px',
          zIndex: 9999,
          fontSize: '20px',
          textAlign: 'center'
        }}>
          🚨 DATE VIEW ACTIVE - If you see this, the component is rendering! 🚨
        </div>
        
        {/* Main Date View - Full Screen */}
        <div style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          background: 'linear-gradient(to bottom, #1a1a2e, #0f0f1e)'
        }}>
          <Canvas
            camera={{ position: [0, 1.6, 3], fov: 50 }}
            style={{ width: '100%', height: '100%' }}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            
            {/* Blue box placeholder for coach */}
            <mesh position={[0, 1.5, 0]}>
              <boxGeometry args={[1, 2, 0.5]} />
              <meshStandardMaterial color="#4a90e2" />
            </mesh>
            
            <OrbitControls
              enablePan={false}
              enableZoom={true}
              minDistance={2}
              maxDistance={5}
              target={[0, 1.5, 0]}
            />
          </Canvas>

          {/* Date Info Overlay - with inline styles */}
          <div style={{
            position: 'absolute',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '15px 30px',
            borderRadius: '30px',
            textAlign: 'center',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>
              {currentNPC?.name || 'Your Date'}
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#0ff' }}>
              {isNPCSpeaking ? "💬 Speaking..." : "👂 Listening..."}
            </p>
          </div>

          {/* User PiP Container - with inline styles */}
          <div style={{
            position: 'absolute',
            bottom: '100px',
            right: '20px',
            width: '200px',
            height: '150px',
            background: '#000',
            borderRadius: '15px',
            overflow: 'hidden',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ 
              width: '100%', 
              height: '100%', 
              background: '#222',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666'
            }}>
              User Video
            </div>
          </div>

          {/* Date Controls - with inline styles */}
          <div style={{
            position: 'absolute',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '15px',
            padding: '10px',
            background: 'rgba(0, 0, 0, 0.8)',
            borderRadius: '25px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <button 
              style={{
                padding: '12px 24px',
                background: 'rgba(255, 0, 0, 0.5)',
                border: '1px solid rgba(255, 0, 0, 0.2)',
                borderRadius: '20px',
                color: 'white',
                fontSize: '14px',
                cursor: 'pointer'
              }}
              onClick={handleEndDate}
            >
              ❌ End Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dating-simulation-master">
      <div className="dating-simulation-content">
        {/* Header */}
        <div className="dating-header">
          <div className="header-content">
            <h1 className="app-title">XR Cupid</h1>
            <button 
              onClick={onBack}
              className="back-button"
            >
              ← Back to Hub
            </button>
            <button 
              className="test-button"
              onClick={testPhysicalTracking}
              style={{ marginLeft: '10px' }}
            >
              Test Tracking
            </button>
            <button 
              className={`practice-button ${practiceMode ? 'active' : ''}`}
              onClick={() => setPracticeMode(!practiceMode)}
              style={{ marginLeft: '10px' }}
            >
              {practiceMode ? '🎯 Practice Mode ON' : '🎯 Practice Mode'}
            </button>
            <button 
              className="test-button"
              onClick={() => {
                console.log('🚀 TEST MODE: Forcing date view active');
                setState(prev => ({ ...prev, isDateActive: true }));
              }}
              style={{ 
                marginLeft: '10px',
                background: '#ff6b6b',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              🧪 TEST: View Date UI
            </button>
          </div>
        </div>

        {/* Error State */}
        {voiceError && (
          <div className="error-message">
            <h2>Connection Error</h2>
            <p>{voiceError}</p>
            <button onClick={handleConnect} className="connect-button">
              Try Again
            </button>
          </div>
        )}

        {/* Main Content */}
        {!voiceError && (
          <>
            {!isDateActive ? (
              /* Setup Layout */
              <div className="dating-layout">
                {/* User Avatar */}
                <div className="avatar-section">
                  <h2 className="avatar-label">You</h2>
                  <div className="avatar-display">
                    <Canvas 
                      camera={{ 
                        position: [0, 1.6, 1.5], 
                        fov: 30,
                        near: 0.1,
                        far: 100
                      }}
                      onCreated={({ camera }) => {
                        camera.lookAt(0, 1.6, 0);
                      }}
                    >
                      <ambientLight intensity={0.6} />
                      <directionalLight position={[2, 4, 2]} intensity={0.8} color="#ffffff" />
                      <directionalLight position={[-2, 2, 2]} intensity={0.4} color="#ffeaa7" />
                      <pointLight position={[0, 2, 1]} intensity={0.3} color="#fd79a8" />
                      <UserPresenceAvatar
                        avatarUrl={userAvatarUrl}
                        position={[0, -1, 0]}
                        scale={1.2}
                      />
                    </Canvas>
                  </div>
                </div>

                {/* Control Panel */}
                <div className="control-panel">
                  <div className="control-section">
                    <h3>Voice Connection</h3>
                    <div className={`voice-status status-${voiceStatus}`}>
                      Status: {voiceStatus}
                    </div>
                    {status.value === 'connected' ? (
                      <button onClick={() => disconnect()} className="disconnect-button">
                        Disconnect
                      </button>
                    ) : (
                      <button onClick={handleConnect} className="connect-button">
                        Connect Voice
                      </button>
                    )}
                  </div>

                  <div className="control-section">
                    <h3>Choose Your Avatar</h3>
                    <select 
                      value={userAvatarId} 
                      onChange={(e) => setState(prev => ({ ...prev, userAvatarId: e.target.value }))}
                    >
                      <option value="">Select Your Avatar</option>
                      {PRELOADED_AVATARS.map(avatar => (
                        <option key={avatar.id} value={avatar.id}>
                          {avatar.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="control-section">
                    <h3>Choose Your Date</h3>
                    <select 
                      value={state.currentNPC?.id || ''} 
                      onChange={handleNPCChange}
                    >
                      <option value="">Select someone...</option>
                      {Object.values(NPCPersonalities).map((npc: NPCPersonality) => (
                        <option key={npc.id} value={npc.id}>
                          {npc.name} - {npc.occupation} ({npc.age})
                        </option>
                      ))}
                    </select>
                  </div>

                  {currentNPC && (
                    <div className="ready-to-start">
                      <h2>Ready for your date?</h2>
                      <p><strong>{currentNPC.name}</strong>, {currentNPC.age}</p>
                      <p className="npc-description">{currentNPC.personality}</p>
                      <button onClick={handleStartDate} className="start-date-button">
                        Start Date ❤️
                      </button>
                      {/* DEBUG: Test Date View Without Connection */}
                      <button
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          padding: '10px 20px',
                          background: '#ff6b6b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          zIndex: 1000
                        }}
                        onClick={() => {
                          console.log('🚀 TEST MODE: Forcing date view active');
                          setState(prev => ({ ...prev, isDateActive: true }));
                        }}
                      >
                        🧪 TEST: View Date UI (No Connection)
                      </button>
                    </div>
                  )}
                </div>

                {/* NPC Avatar */}
                <div className="avatar-section">
                  <h2 className="avatar-label">{currentNPC?.name || 'Your Date'}</h2>
                  <div className="avatar-display">
                    {currentNPC && npcAvatarId && (
                      <Canvas 
                        camera={{ 
                          position: [0, 1.6, 1.5], 
                          fov: 30,
                          near: 0.1,
                          far: 100
                        }}
                        onCreated={({ camera }) => {
                          camera.lookAt(0, 1.6, 0);
                        }}
                      >
                        <ambientLight intensity={0.6} />
                        <directionalLight position={[2, 4, 2]} intensity={0.8} color="#ffffff" />
                        <directionalLight position={[-2, 2, 2]} intensity={0.4} color="#ffeaa7" />
                        <pointLight position={[0, 2, 1]} intensity={0.3} color="#fd79a8" />
                        <CoachAvatar
                          avatarUrl={npcAvatarUrl}
                          position={[0, -1, 0]}
                          scale={1.2}
                          isSpeaking={isNPCSpeaking}
                        />
                      </Canvas>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Date Active Layout */
              <div className="date-active-layout">
                {/* User Side */}
                <div className="user-side">
                  <h2 className="avatar-label">You</h2>
                  <div className="webcam-display">
                    {webcamStatus === 'active' && (
                      <div className="webcam-indicator">
                        <span className="webcam-dot"></span> Camera Active
                      </div>
                    )}
                    <Canvas 
                      camera={{ 
                        position: [0, 1.6, 1.5], 
                        fov: 30,
                        near: 0.1,
                        far: 100
                      }}
                      onCreated={({ camera }) => {
                        camera.lookAt(0, 1.6, 0);
                      }}
                    >
                      <ambientLight intensity={0.6} />
                      <directionalLight position={[2, 4, 2]} intensity={0.8} color="#ffffff" />
                      <directionalLight position={[-2, 2, 2]} intensity={0.4} color="#ffeaa7" />
                      <pointLight position={[0, 2, 1]} intensity={0.3} color="#fd79a8" />
                      <UserPresenceAvatar
                        avatarUrl={userAvatarUrl}
                        position={[0, -1, 0]}
                        scale={1.2}
                      />
                    </Canvas>
                  </div>
                </div>

                {/* NPC Side */}
                <div className="npc-side">
                  <h2 className="avatar-label">{currentNPC?.name}</h2>
                  <div className="avatar-display">
                    {currentNPC && npcAvatarId && (
                      <Canvas 
                        camera={{ 
                          position: [0, 1.6, 1.5], 
                          fov: 30,
                          near: 0.1,
                          far: 100
                        }}
                        onCreated={({ camera }) => {
                          camera.lookAt(0, 1.6, 0);
                        }}
                      >
                        <ambientLight intensity={0.6} />
                        <directionalLight position={[2, 4, 2]} intensity={0.8} color="#ffffff" />
                        <directionalLight position={[-2, 2, 2]} intensity={0.4} color="#ffeaa7" />
                        <pointLight position={[0, 2, 1]} intensity={0.3} color="#fd79a8" />
                        <CoachAvatar
                          avatarUrl={npcAvatarUrl}
                          position={[0, -1, 0]}
                          scale={1.2}
                          isSpeaking={isNPCSpeaking}
                        />
                      </Canvas>
                    )}
                  </div>
                </div>

                {/* Conversation area at bottom */}
                <div className="conversation-area">
                  <div className="date-controls">
                    <h3>Dating {currentNPC?.name}</h3>
                    <button onClick={handleEndDate} className="end-date-button">
                      End Date
                    </button>
                  </div>
                  <p>Voice chat is {status.value === 'connected' ? 'active' : 'not connected'}. Speak naturally!</p>
                  {isNPCSpeaking && <p className="speaking-indicator">💬 {currentNPC?.name} is speaking...</p>}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Physical Coach Overlay */}
      {(coachActive || practiceMode) && (
        <PhysicalCoach 
          isActive={true}
          onExerciseComplete={(exercise) => {
            console.log('Exercise completed:', exercise.name);
          }}
        />
      )}

      {/* Practice Mode Instructions */}
      {practiceMode && !isDateActive && (
        <div className="practice-mode-instructions">
          <h2>Physical Communication Practice</h2>
          <p>Welcome to Practice Mode! Here you can work on:</p>
          <ul>
            <li>👁️ <strong>Eye Contact</strong> - Building connection through gaze</li>
            <li>🧍 <strong>Posture</strong> - Projecting confidence and openness</li>
            <li>👐 <strong>Gestures</strong> - Expressing yourself naturally</li>
            <li>😊 <strong>Facial Expressions</strong> - Showing authentic emotions</li>
          </ul>
          <p>The Physical Coach (bottom-right) will guide you through exercises and provide real-time feedback.</p>
          <button 
            className="start-practice-button"
            onClick={() => {
              coachAwareTracking.startExercise({
                name: 'Basic Body Language',
                type: 'posture',
                duration: 60,
                targetMetrics: {
                  posture: {
                    isOpen: true,
                    isLeaning: true,
                    shoulderTension: 0.3,
                    feedback: ''
                  }
                },
                instructions: [
                  'Stand or sit with shoulders back',
                  'Keep your chest open',
                  'Lean slightly forward to show interest'
                ]
              });
            }}
          >
            Start Basic Exercise
          </button>
        </div>
      )}
    </div>
  );
};
