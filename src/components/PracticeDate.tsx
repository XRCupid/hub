import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { PresenceAvatar } from './PresenceAvatar';
import { UserAvatarPiP } from './UserAvatarPiP';
import { NPCPersonalities } from '../config/NPCPersonalities';
import humeVoiceService, { EmotionalState } from '../services/humeVoiceService';
import './PracticeDate.css';

interface ConversationPrompt {
  id: string;
  text: string;
  category: 'opener' | 'compliment' | 'question' | 'story' | 'flirt';
}

const CONVERSATION_PROMPTS: ConversationPrompt[] = [
  { id: 'opener1', text: "Hi! I couldn't help but notice your smile", category: 'opener' },
  { id: 'opener2', text: "Hey there! This is a lovely spot, isn't it?", category: 'opener' },
  { id: 'compliment1', text: "You have amazing energy", category: 'compliment' },
  { id: 'compliment2', text: "I love your style", category: 'compliment' },
  { id: 'question1', text: "What brings you joy these days?", category: 'question' },
  { id: 'question2', text: "What's been the highlight of your week?", category: 'question' },
  { id: 'story1', text: "Share a funny dating story", category: 'story' },
  { id: 'flirt1', text: "You're making me a bit nervous, in a good way", category: 'flirt' }
];

const PracticeDate: React.FC = () => {
  const { npcId } = useParams<{ npcId: string }>();
  const navigate = useNavigate();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [conversation, setConversation] = useState<Array<{role: string, message: string}>>([]);
  const [emotionalState, setEmotionalState] = useState<EmotionalState>({});
  const [dateScore, setDateScore] = useState({
    connection: 50,
    attraction: 50,
    comfort: 50,
    engagement: 50
  });
  const [showPiP, setShowPiP] = useState(true);
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(128));
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  const npc = NPCPersonalities[npcId || ''];

  useEffect(() => {
    if (!npc) {
      navigate('/training-hub');
      return;
    }

    initializeAudioContext();
    connectToHume();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      humeVoiceService.disconnect();
      audioContextRef.current?.close();
    };
  }, [npc]);

  const initializeAudioContext = () => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    analyserRef.current.smoothingTimeConstant = 0.8;
  };

  const connectToHume = async () => {
    try {
      // Set up callbacks before connecting
      humeVoiceService.onEmotion((emotions) => {
        setEmotionalState(emotions);
        updateDateScore(emotions);
      });
      
      humeVoiceService.onAudio(async (audioBlob) => {
        await playAudioWithAnalysis(audioBlob);
      });
      
      humeVoiceService.onMessage((message) => {
        setConversation(prev => [...prev, { role: 'NPC', message }]);
      });
      
      // Connect to Hume
      await humeVoiceService.connect();
      
      setIsConnected(true);
      
      // Send NPC personality context
      const npcContext = {
        type: 'npc_date',
        npc: npc.name,
        systemPrompt: npc.systemPrompt,
        personality: npc.personality,
        conversationStyle: npc.conversationStyle,
        interests: npc.interests
      };
      
      humeVoiceService.sendMessage(JSON.stringify(npcContext));
      
      // Initial greeting from NPC
      const greeting = `Hi! I'm ${npc.name}. ${getRandomGreeting()}`;
      setConversation([{ role: 'NPC', message: greeting }]);
      
    } catch (error) {
      console.error('Failed to connect to Hume:', error);
    }
  };

  const getRandomGreeting = () => {
    const greetings = [
      "It's lovely to meet you!",
      "Thanks for agreeing to this date!",
      "I've been looking forward to this!",
      "You look great! How are you?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  const playAudioWithAnalysis = async (audioBlob: Blob) => {
    try {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      if (!audio) {
        console.error('[PracticeDate] Failed to create audio element');
        return;
      }
      
      audio.addEventListener('play', () => {
        setIsSpeaking(true);
        connectAudioToAnalyser(audio);
      });
      
      audio.addEventListener('ended', () => {
        setIsSpeaking(false);
        setIsListening(true);
        URL.revokeObjectURL(audioUrl);
      });
      
      await audio.play();
    } catch (error) {
      console.error('[PracticeDate] Error playing audio:', error);
      setIsSpeaking(false);
    }
  };

  const connectAudioToAnalyser = (audio: HTMLAudioElement) => {
    if (!audioContextRef.current || !analyserRef.current || !audio) {
      console.warn('[PracticeDate] Missing audio context, analyser, or audio element');
      return;
    }
    
    const source = audioContextRef.current.createMediaElementSource(audio);
    source.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);
    
    const updateAudioData = () => {
      if (!analyserRef.current) return;
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      setAudioData(dataArray);
      
      if (isSpeaking) {
        animationFrameRef.current = requestAnimationFrame(updateAudioData);
      }
    };
    
    updateAudioData();
  };

  const updateDateScore = (emotions: EmotionalState) => {
    // Update date metrics based on emotional state
    setDateScore(prev => {
      const updates = { ...prev };
      
      // Connection increases with joy
      if (emotions.joy && emotions.joy > 0.3) {
        updates.connection = Math.min(100, prev.connection + 2);
      }
      
      // Attraction affected by joy and surprise
      if ((emotions.joy && emotions.joy > 0.3) || (emotions.surprise && emotions.surprise > 0.3)) {
        updates.attraction = Math.min(100, prev.attraction + 1.5);
      }
      
      // Comfort decreases with fear or anger
      if (emotions.fear && emotions.fear > 0.3) {
        updates.comfort = Math.max(0, prev.comfort - 2);
      } else if (emotions.anger && emotions.anger > 0.3) {
        updates.comfort = Math.max(0, prev.comfort - 1);
      } else if (!emotions.fear && !emotions.anger) {
        // Comfort slowly increases when no negative emotions
        updates.comfort = Math.min(100, prev.comfort + 0.5);
      }
      
      // Engagement based on overall emotional activity
      const totalEmotion = Object.values(emotions).reduce((sum: number, val) => sum + (val || 0), 0);
      if (totalEmotion > 1.5) {
        updates.engagement = Math.min(100, prev.engagement + 1);
      }
      
      return updates;
    });
  };

  const sendMessage = (message: string) => {
    setConversation(prev => [...prev, { role: 'User', message }]);
    setIsListening(false);
    
    const context = {
      type: 'user_message',
      message,
      dateScore,
      conversationLength: conversation.length
    };
    
    humeVoiceService.sendMessage(JSON.stringify(context));
  };

  const endDate = () => {
    const finalScore = (dateScore.connection + dateScore.attraction + dateScore.comfort + dateScore.engagement) / 4;
    
    navigate('/date-results', {
      state: {
        npc: npc.name,
        score: finalScore,
        metrics: dateScore,
        conversation: conversation.length,
        duration: Date.now() // Would calculate actual duration
      }
    });
  };

  const getSceneEnvironment = () => {
    // Different environments based on NPC personality
    switch (npc?.id) {
      case 'sarah':
      case 'james':
        return 'wine-bar'; // Sophisticated
      case 'alex':
        return 'outdoor-cafe'; // Adventurous
      case 'maya':
        return 'bookstore-cafe'; // Intellectual
      default:
        return 'coffee-shop'; // Cozy default
    }
  };

  return (
    <div className="practice-date">
      <div className="date-header">
        <button className="back-button" onClick={() => navigate('/training-hub')}>
          ← End Date
        </button>
        <div className="date-info">
          <h2>Date with {npc?.name}</h2>
          <p>{npc?.occupation}, {npc?.age}</p>
        </div>
        <button className="pip-toggle" onClick={() => setShowPiP(!showPiP)}>
          {showPiP ? '👤' : '👥'}
        </button>
      </div>

      <div className="date-content">
        <div className="date-scene">
          <Canvas className="date-canvas">
            <PerspectiveCamera makeDefault position={[0, 1.6, 3]} fov={45} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={0.4} castShadow />
            
            {/* Date environment */}
            <group>
              <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[10, 10]} />
                <meshStandardMaterial color="#2a2a3a" />
              </mesh>
            </group>
            
            {/* NPC Avatar */}
            <PresenceAvatar
              avatarUrl="/avatars/default-date-avatar.glb"
              position={[0, 0, 0]}
              scale={1.1}
              trackingData={{
                position: { x: 0, y: 0, z: 0 },
                rotation: { pitch: 0, yaw: 0, roll: 0 },
                headPosition: { x: 0, y: 0, z: 0 },
                headRotation: { pitch: 0, yaw: 0, roll: 0 },
                leftEye: { x: 0, y: 0 },
                rightEye: { x: 0, y: 0 },
                facialExpressions: {
                  mouthSmile: 0,
                  mouthSmileLeft: 0,
                  mouthSmileRight: 0,
                  mouthFrown: 0,
                  mouthOpen: 0,
                  mouthPucker: 0,
                  mouthDimpleLeft: 0,
                  mouthDimpleRight: 0,
                  mouthStretchLeft: 0,
                  mouthStretchRight: 0,
                  mouthPressLeft: 0,
                  mouthPressRight: 0,
                  lipsSuckUpper: 0,
                  lipsSuckLower: 0,
                  lipsFunnel: 0,
                  browUpLeft: 0,
                  browUpRight: 0,
                  browInnerUp: 0,
                  browInnerUpLeft: 0,
                  browInnerUpRight: 0,
                  browDownLeft: 0,
                  browDownRight: 0,
                  eyeSquintLeft: 0,
                  eyeSquintRight: 0,
                  cheekPuff: 0,
                  cheekSquintLeft: 0,
                  cheekSquintRight: 0,
                  noseSneer: 0,
                  tongueOut: 0,
                  jawOpen: 0,
                  jawLeft: 0,
                  jawRight: 0,
                  eyeBlinkLeft: 0,
                  eyeBlinkRight: 0,
                  eyebrowRaiseLeft: 0,
                  eyebrowRaiseRight: 0,
                  eyebrowFurrow: 0,
                  eyeWideLeft: 0,
                  eyeWideRight: 0,
                  eyeWide: 0,
                  eyeBlink: 0,
                  eyebrowRaise: 0,
                  eyeSquint: 0,
                  eyeLookDownLeft: 0,
                  eyeLookDownRight: 0,
                  eyeLookUpLeft: 0,
                  eyeLookUpRight: 0,
                  eyeLookInLeft: 0,
                  eyeLookInRight: 0,
                  eyeLookOutLeft: 0,
                  eyeLookOutRight: 0
                },
                emotionalState: emotionalState,
                isListening: isListening,
                isSpeaking: isSpeaking,
                audioData: audioData
              }}
            />
          </Canvas>
        </div>

        <div className="date-interface">
          <div className="date-metrics">
            <h3>Date Chemistry</h3>
            <div className="metric-bars">
              <div className="metric">
                <span>Connection</span>
                <div className="metric-bar">
                  <div className="metric-fill" style={{ width: `${dateScore.connection}%` }} />
                </div>
              </div>
              <div className="metric">
                <span>Attraction</span>
                <div className="metric-bar">
                  <div className="metric-fill attraction" style={{ width: `${dateScore.attraction}%` }} />
                </div>
              </div>
              <div className="metric">
                <span>Comfort</span>
                <div className="metric-bar">
                  <div className="metric-fill comfort" style={{ width: `${dateScore.comfort}%` }} />
                </div>
              </div>
              <div className="metric">
                <span>Engagement</span>
                <div className="metric-bar">
                  <div className="metric-fill engagement" style={{ width: `${dateScore.engagement}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="conversation-prompts">
            <h3>Conversation Options</h3>
            <div className="prompts-grid">
              {CONVERSATION_PROMPTS.map(prompt => (
                <button
                  key={prompt.id}
                  className={`prompt-button ${prompt.category} ${selectedPrompt === prompt.id ? 'used' : ''}`}
                  onClick={() => sendMessage(prompt.text)}
                  disabled={selectedPrompt === prompt.id}
                >
                  <span className="prompt-category">{prompt.category}</span>
                  <span className="prompt-text">{prompt.text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="conversation-log">
            <h3>Conversation</h3>
            <div className="messages">
              {conversation.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role.toLowerCase()}`}>
                  <span className="role">{msg.role}:</span>
                  <span className="text">{msg.message}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="date-actions">
            <button className="action-button record" disabled={!isListening}>
              🎤 {isListening ? 'Listening...' : 'Wait for your turn'}
            </button>
            <button className="action-button end" onClick={endDate}>
              End Date & Get Feedback
            </button>
          </div>
        </div>
      </div>

      {showPiP && (
        <UserAvatarPiP
          position="bottom-left"
          size="small"
          onClose={() => setShowPiP(false)}
        />
      )}
    </div>
  );
};

export default PracticeDate;
