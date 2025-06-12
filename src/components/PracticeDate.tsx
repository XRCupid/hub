import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { PresenceAvatar } from './PresenceAvatar';
import { SafeVisualEffects } from './SafeVisualEffects';
import { DateEnvironment } from './DateEnvironments';
import { NPCPersonalities } from '../config/NPCPersonalities';
import humeVoiceService, { EmotionalState } from '../services/humeVoiceService';
import { ML5FaceMeshService } from '../services/ML5FaceMeshService';
import './PracticeDate.css';
import { CoachLesson, PracticeScenario } from '../types/DatingTypes';

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
  const [emotionalState, setEmotionalState] = useState<Array<{name: string, score: number}>>([]);
  const [dateScore, setDateScore] = useState({
    connection: 50,
    attraction: 50,
    comfort: 50,
    engagement: 50
  });
  const [showPiP, setShowPiP] = useState(true);
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(128));
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [dateStarted, setDateStarted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Animation states
  const [currentIdleAnimation, setCurrentIdleAnimation] = useState('');
  const [currentTalkingAnimation, setCurrentTalkingAnimation] = useState('');
  
  // Determine if NPC is male or female based on their ID
  const isMaleNPC = npcId?.includes('haseeb') || npcId?.includes('dougie');
  
  const idleAnimations = isMaleNPC ? [
    '/animations/M_Standing_Idle_001.glb',
    '/animations/M_Standing_Idle_002.glb',
    '/animations/M_Standing_Idle_Variations_001.glb',
    '/animations/M_Standing_Idle_Variations_002.glb',
    '/animations/M_Standing_Idle_Variations_003.glb'
  ] : [
    '/animations/feminine/idle/F_Standing_Idle_001.glb',
    '/animations/feminine/idle/F_Standing_Idle_Variations_001.glb',
    '/animations/feminine/idle/F_Standing_Idle_Variations_002.glb',
    '/animations/feminine/idle/F_Standing_Idle_Variations_003.glb',
    '/animations/feminine/idle/F_Standing_Idle_Variations_004.glb'
  ];
  
  const talkingAnimations = isMaleNPC ? [
    '/animations/M_Talking_Variations_001.glb',
    '/animations/M_Talking_Variations_002.glb',
    '/animations/M_Talking_Variations_003.glb',
    '/animations/M_Talking_Variations_004.glb',
    '/animations/M_Talking_Variations_005.glb'
  ] : [
    '/animations/feminine/talk/F_Talking_Variations_001.glb',
    '/animations/feminine/talk/F_Talking_Variations_002.glb',
    '/animations/feminine/talk/F_Talking_Variations_003.glb',
    '/animations/feminine/talk/F_Talking_Variations_004.glb',
    '/animations/feminine/talk/F_Talking_Variations_005.glb'
  ];
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ml5FaceMeshServiceRef = useRef<ML5FaceMeshService | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const connectionInitialized = useRef(false); // Add ref to track connection state
  
  const npc = npcId ? NPCPersonalities[npcId] : undefined;

  useEffect(() => {
    if (!npc) {
      navigate('/training-hub');
      return;
    }
    
    const initializeFaceTracking = async () => {
      if (!ml5FaceMeshServiceRef.current) {
        ml5FaceMeshServiceRef.current = new ML5FaceMeshService();
        try {
          await ml5FaceMeshServiceRef.current.initialize();
          console.log('Face mesh initialized successfully');
        } catch (error) {
          console.error('Failed to initialize face mesh:', error);
        }
      }
    };

    initializeFaceTracking();
  }, []);

  useEffect(() => {
    const startTracking = async () => {
      if (videoRef.current && ml5FaceMeshServiceRef.current) {
        try {
          // Wait for video to be playing
          if (videoRef.current.readyState >= 2) {
            await ml5FaceMeshServiceRef.current.startTracking(videoRef.current);
            console.log('Face tracking started');
          } else {
            // Wait for video to be ready
            videoRef.current.addEventListener('loadeddata', async () => {
              if (ml5FaceMeshServiceRef.current && videoRef.current) {
                await ml5FaceMeshServiceRef.current.startTracking(videoRef.current);
                console.log('Face tracking started after video loaded');
              }
            });
          }
        } catch (error) {
          console.error('Failed to start face tracking:', error);
        }
      }
    };

    if (videoRef.current) {
      startTracking();
    }
  }, [videoRef.current]);

  useEffect(() => {
    if (!npc) {
      navigate('/training-hub');
      return;
    }
    
    const setupVideo = async () => {
      try {
        const videoElement = document.createElement('video');
        videoElement.width = 640;
        videoElement.height = 480;
        videoElement.autoplay = true;
        videoElement.style.position = 'absolute';
        videoElement.style.top = '-9999px';
        videoElement.style.left = '-9999px';
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user'
          } 
        });
        
        videoElement.srcObject = stream;
        document.body.appendChild(videoElement);
        videoRef.current = videoElement;
        
        // Wait for video to play
        await videoElement.play();
      } catch (error) {
        console.error('Failed to setup video:', error);
      }
    };

    setupVideo();
  }, [npc]);

  // Update tracking data
  useEffect(() => {
    const updateTracking = () => {
      if (ml5FaceMeshServiceRef.current) {
        const facialExpressions = ml5FaceMeshServiceRef.current.getExpressions();
        const headRotation = ml5FaceMeshServiceRef.current.getHeadRotation();
        const landmarks = ml5FaceMeshServiceRef.current.getLandmarks();
        
        if (facialExpressions || headRotation || landmarks) {
          const data = {
            facialExpressions: facialExpressions || {},
            headRotation: headRotation || {},
            landmarks: landmarks || [],
            source: 'ml5'
          };
          setTrackingData(data);
        }
      }
      animationFrameRef.current = requestAnimationFrame(updateTracking);
    };
    
    updateTracking();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!npc) {
      navigate('/training-hub');
      return;
    }
    
    const initializeHume = async () => {
      if (!dateStarted || connectionInitialized.current) return; // Prevent multiple connections
      
      connectionInitialized.current = true; // Mark as initialized
      setIsConnecting(true);
      
      try {
        // Initialize audio context first
        if (!audioContextRef.current) {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContext();
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          analyserRef.current.smoothingTimeConstant = 0.8;
        }
        
        // Set up callbacks before connecting
        humeVoiceService.onEmotion((emotions) => {
          setEmotionalState(emotions);
          updateDateScore(emotions);
        });
        
        humeVoiceService.onAudio(async (audioBlob) => {
          await playAudioWithAnalysis(audioBlob);
        });
        
        humeVoiceService.onMessage((message: any) => {
          // Extract the actual message content from the Hume message object
          const messageContent = typeof message === 'string' ? message : 
                                (message.message?.content || message.message || JSON.stringify(message));
          setConversation(prev => [...prev, { role: 'NPC', message: messageContent }]);
        });
        
        // Connect to Hume
        await humeVoiceService.connect();
        
        setIsConnected(true);
        setIsConnecting(false);
        
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
        setIsConnecting(false);
      }
    };

    if (dateStarted) {
      initializeHume();
    }

    return () => {
      // Cleanup
      if (ml5FaceMeshServiceRef.current) {
        ml5FaceMeshServiceRef.current.stopTracking();
        ml5FaceMeshServiceRef.current = null;
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Cleanup audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      
      // Cleanup video element
      if (videoRef.current) {
        const video = videoRef.current;
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        video.srcObject = null;
        
        // Only remove if it's still in the DOM
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
        videoRef.current = null;
      }
      
      // Cleanup Hume voice service
      if (connectionInitialized.current && isConnected) {
        humeVoiceService.disconnect();
        connectionInitialized.current = false;
      }
    };
  }, [dateStarted, npc]); // Remove isConnected and humeVoiceService from dependencies
  
  useEffect(() => {
    if (idleAnimations.length > 0 && !currentIdleAnimation) {
      setCurrentIdleAnimation(idleAnimations[0]);
    }
    if (talkingAnimations.length > 0 && !currentTalkingAnimation) {
      setCurrentTalkingAnimation(talkingAnimations[0]);
    }
  }, [idleAnimations, talkingAnimations]);

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
    
    try {
      // Check if audio element already has a source
      if (!(audio as any)._sourceConnected) {
        const source = audioContextRef.current.createMediaElementSource(audio);
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
        (audio as any)._sourceConnected = true; // Mark as connected
      }
      
      const updateAudioData = () => {
        if (!analyserRef.current || !isSpeaking) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        setAudioData(dataArray);
        
        if (isSpeaking) {
          animationFrameRef.current = requestAnimationFrame(updateAudioData);
        }
      };
      
      updateAudioData();
    } catch (error) {
      console.error('[PracticeDate] Error connecting audio to analyser:', error);
    }
  };

  const updateDateScore = (emotions: Array<{name: string, score: number}>) => {
    // Find specific emotions in the array
    const joyEmotion = emotions.find(e => e.name === 'Joy');
    const interestEmotion = emotions.find(e => e.name === 'Interest');
    const calmEmotion = emotions.find(e => e.name === 'Calmness');
    const excitementEmotion = emotions.find(e => e.name === 'Excitement');
    
    const joy = joyEmotion?.score || 0;
    const interest = interestEmotion?.score || 0;
    const calmness = calmEmotion?.score || 0;
    const excitement = excitementEmotion?.score || 0;
    
    setDateScore(prev => ({
      connection: Math.min(100, prev.connection + (joy * 2)),
      attraction: Math.min(100, prev.attraction + (interest * 1.5)),
      comfort: Math.min(100, prev.comfort + (calmness * 1)),
      engagement: Math.min(100, prev.engagement + (excitement * 1.5))
    }));
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
    // Disconnect Hume before leaving
    humeVoiceService.disconnect();
    
    const finalScore = (dateScore.connection + dateScore.attraction + dateScore.comfort + dateScore.engagement) / 4;
    
    navigate('/date-results', {
      state: {
        npc: npc?.name,
        score: finalScore,
        metrics: dateScore,
        conversation: conversation.length,
        duration: Date.now() // Would calculate actual duration
      }
    });
  };

  const getSceneEnvironment = () => {
    // Map NPCs to venue backgrounds
    switch (npc?.id) {
      case 'tech-haseeb':
      case 'intellectual-maya':
        return '/venues/GreatCafe.png'; // Tech/intellectual vibes
      case 'creative-dougie':
      case 'adventurous-alex':
        return '/venues/GreatPark.png'; // Creative/outdoor vibes
      case 'glamorous-mindy':
      case 'confident-sarah':
      case 'charming-marcus':
      case 'ambitious-erika':
        return '/venues/GreatBistro.png'; // Upscale/sophisticated vibes
      default:
        return '/venues/GreatCafe.png'; // Default to cafe
    }
  };

  const getAvatarUrl = () => {
    // Check for custom avatars first
    if (npcId?.includes('haseeb')) {
      return '/avatars/Haseeb.glb';
    }
    if (npcId?.includes('dougie')) {
      return '/avatars/Dougie.glb';
    }
    if (npcId?.includes('mindy')) {
      return '/avatars/Mindy.glb';
    }
    if (npcId?.includes('erika')) {
      return '/avatars/Erika.glb';
    }
    if (npcId?.includes('moh')) {
      return '/avatars/Moh.glb';
    }
    
    // Map NPCs to available avatars based on their characteristics
    if (npcId?.includes('sarah') || npcId?.includes('confident')) {
      return '/avatars/female_1.glb';
    }
    if (npcId?.includes('emma') || npcId?.includes('creative')) {
      return '/avatars/female_2.glb';
    }
    if (npcId?.includes('alex') || npcId?.includes('adventurous')) {
      return '/avatars/male_1.glb';
    }
    if (npcId?.includes('maya') || npcId?.includes('intellectual')) {
      return '/avatars/babe.glb';
    }
    if (npcId?.includes('marcus') || npcId?.includes('charming')) {
      return '/avatars/male_2.glb';
    }
    
    // Default fallback
    return '/avatars/neutral_1.glb';
  };

  // Rotate animations periodically
  useEffect(() => {
    if (!isSpeaking) {
      const interval = setInterval(() => {
        const randomIdle = idleAnimations[Math.floor(Math.random() * idleAnimations.length)];
        setCurrentIdleAnimation(randomIdle);
      }, 10000); // Change idle animation every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [isSpeaking, idleAnimations]);
  
  useEffect(() => {
    if (isSpeaking) {
      const interval = setInterval(() => {
        const randomTalk = talkingAnimations[Math.floor(Math.random() * talkingAnimations.length)];
        setCurrentTalkingAnimation(randomTalk);
      }, 5000); // Change talking animation every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [isSpeaking, talkingAnimations]);

  const startDate = async () => {
    // Initialize audio context on user interaction
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
    }
    
    // Resume audio context if it's suspended
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    setDateStarted(true);
  };

  // CRITICAL: Clean up WebSocket connection on unmount - FLUSH THE TOILET!
  useEffect(() => {
    return () => {
      console.log('[PracticeDate] Cleaning up on unmount');
      if (isConnected) {
        humeVoiceService.disconnect();
      }
      // Clean up audio analysis
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Clean up face tracking
      if (ml5FaceMeshServiceRef.current) {
        // Use proper cleanup method if exists
      }
    };
  }, []);

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

      {!dateStarted && (
        <div className="date-start-overlay">
          <div className="date-start-content">
            <h2>Ready to meet {npc?.name}?</h2>
            <p>Click start to begin your cafe date</p>
            <button className="start-date-button" onClick={startDate}>
              Start Date
            </button>
          </div>
        </div>
      )}

      {dateStarted && isConnecting && (
        <div className="date-start-overlay">
          <div className="date-calling-content">
            <div className="calling-avatar">
              <img src={`/avatars/ProfilePics/${npc?.id}_profile.png`} alt={npc?.name} />
            </div>
            <h2>Calling {npc?.name}...</h2>
            <div className="calling-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p>Setting up your cafe date</p>
          </div>
        </div>
      )}

      {dateStarted && isConnected && (
        <div className="date-content">
          <div className="date-scene" style={{ backgroundImage: `url(${getSceneEnvironment()})` }}>
            <Canvas className="date-canvas" shadows>
              <PerspectiveCamera makeDefault position={[0, 0.2, 2.5]} fov={35} />
              
              {/* NPC Avatar */}
              <PresenceAvatar
                avatarUrl={getAvatarUrl()}
                animationName={isSpeaking ? 'talking' : 'idle'}
                position={[0, -1.75, 0]}
                scale={1.2}
                audioData={isSpeaking ? audioData : undefined}
              />
              
              {/* Lighting */}
              <ambientLight intensity={0.6} />
              <directionalLight 
                position={[2, 3, 2]} 
                intensity={1.2} 
                castShadow
                shadow-mapSize={[2048, 2048]}
              />
              <directionalLight 
                position={[-2, 2, -1]} 
                intensity={0.4} 
                color="#ffeedd"
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
      )}

      {showPiP && (
        <div className="pip-avatar">
          <Canvas camera={{ position: [0, 0, 1.5], fov: 35 }}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[0, 1, 2]} intensity={1.2} />
            <Suspense fallback={null}>
              <PresenceAvatar
                avatarUrl="/avatars/babe.glb"
                trackingData={trackingData || undefined}
                position={[0, -1.75, 0]}
                scale={1.2}
              />
            </Suspense>
            <SafeVisualEffects style="subtle" enabled={true} />
          </Canvas>
        </div>
      )}
    </div>
  );
};

export default PracticeDate;
