import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { HybridVoiceService } from '../services/hybridVoiceService';
import { PresenceAvatar } from './PresenceAvatar';
import { UserAvatarPiP } from './UserAvatarPiP';
import { EmotionalState } from '../services/humeVoiceService';
import { mapEmotionsToBlendshapes } from '../utils/emotionMappings';
import './DougieSpeedDate.css';

// Dougie config
const DOUGIE_CONFIG = {
  id: 'dougie',
  name: 'Dougie',
  humeConfigId: '320d816a-8dac-44e6-b59b-1c3d2b6b24d9',
  avatarUrl: '/avatars/Dougie.glb',
  description: 'A fun speed dating experience'
};

// Main component - COPIED FROM CoachSession
const DougieSpeedDateFixed: React.FC = () => {
  const navigate = useNavigate();
  
  // State management - SAME AS COACH
  const [isListening, setIsListening] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionalState>({});
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(128));
  const [coachMessage, setCoachMessage] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceTrackingData, setFaceTrackingData] = useState<any>(null);
  const [messageInput, setMessageInput] = useState('');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<string>('idle');
  const [emotionalBlendshapes, setEmotionalBlendshapes] = useState<any>({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  
  // Speed date specific state
  const [dateStarted, setDateStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [showReport, setShowReport] = useState(false);
  
  // Service refs - SAME AS COACH
  const humeVoiceServiceRef = useRef<HybridVoiceService | null>(null);
  
  // Audio refs for lip sync - SAME AS COACH
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(new Audio());
  const audioSourceCreatedRef = useRef<boolean>(false);
  const audioQueueRef = useRef<Blob[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  
  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize voice service - SAME AS COACH
  useEffect(() => {
    const initHybridVoiceService = async () => {
      if (!humeVoiceServiceRef.current) {
        console.log('[DougieSpeedDate] Initializing HybridVoiceService...');
        humeVoiceServiceRef.current = new HybridVoiceService();
        
        // Set up callbacks for audio and messages - SAME AS COACH
        humeVoiceServiceRef.current.onAudio((audioBlob: Blob) => {
          console.log('[DougieSpeedDate] Audio received:', audioBlob.size);
          setIsSpeaking(true);
          setCurrentAnimation('talking');
          audioQueueRef.current.push(audioBlob);
          if (!isPlayingRef.current) {
            playNextAudioFromQueue();
          }
        });
        
        humeVoiceServiceRef.current.onMessage((message: any) => {
          console.log('[DougieSpeedDate] Message received:', message);
          const messageText = typeof message === 'string' ? message : 
                            (message?.message?.content || message?.content || 
                             JSON.stringify(message));
          
          if (messageText && messageText.trim()) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: messageText
            }]);
            setCoachMessage(messageText);
            
            // Handle prosody for emotions
            if (message?.models?.prosody?.scores) {
              const scores = message.models.prosody.scores;
              const emotionsArray = Object.entries(scores).map(([name, score]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                score: score as number
              }));
              const blendshapes = mapEmotionsToBlendshapes(emotionsArray);
              setEmotionalBlendshapes(blendshapes);
            }
          }
        });
        
        humeVoiceServiceRef.current.onAssistantEnd(() => {
          console.log('[DougieSpeedDate] Assistant ended');
          setIsSpeaking(false);
          setCurrentAnimation('idle');
        });
        
        humeVoiceServiceRef.current.onUserMessage((transcript: string) => {
          console.log('[DougieSpeedDate] User message:', transcript);
          setMessages(prev => [...prev, {
            role: 'user',
            content: transcript
          }]);
          setUserTranscript(transcript);
        });
        
        humeVoiceServiceRef.current.onError((error: Error) => {
          console.error('[DougieSpeedDate] Error:', error);
          setError(error.message);
        });
        
        console.log('[DougieSpeedDate] HybridVoiceService initialized successfully');
      }
    };
    
    initHybridVoiceService();
  }, []);

  // Request permissions - SAME AS COACH
  const requestPermissions = async () => {
    try {
      setLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setCameraStream(stream);
      setHasPermissions(true);
      setLoading(false);
    } catch (err) {
      console.error('Permission denied:', err);
      setError('Camera and microphone permissions are required');
      setLoading(false);
    }
  };

  // Connect to service - MODIFIED FOR DOUGIE
  const connectToService = async () => {
    if (!humeVoiceServiceRef.current) return;
    
    try {
      setLoading(true);
      
      // Set to use Hume for conversation
      humeVoiceServiceRef.current.setUseHumeForConversation(true);
      
      // Connect with Dougie's config
      await humeVoiceServiceRef.current.connect(DOUGIE_CONFIG.humeConfigId);
      
      setIsConnected(true);
      setLoading(false);
      
      // Send initial greeting
      setTimeout(() => {
        humeVoiceServiceRef.current?.sendMessage(
          "Hi! I'm Dougie. I'm excited to meet you! Tell me about yourself."
        );
      }, 1000);
      
    } catch (err) {
      console.error('Connection failed:', err);
      setError('Failed to connect to voice service');
      setLoading(false);
    }
  };

  // Play audio from queue - EXACT COPY FROM COACH
  const playNextAudioFromQueue = () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      setCurrentAnimation('idle');
      return;
    }
    
    console.log('[DougieSpeedDate] Playing audio from queue, queue length:', audioQueueRef.current.length);
    isPlayingRef.current = true;
    const audioBlob = audioQueueRef.current.shift()!;
    const audioUrl = URL.createObjectURL(audioBlob);
    audioPlayerRef.current.src = audioUrl;
    
    // Setup audio analyzer for lip sync BEFORE playing
    if (!audioSourceCreatedRef.current) {
      try {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContext({ sampleRate: 48000 });
          console.log('[DougieSpeedDate] Created new AudioContext');
        }
        
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
          console.log('[DougieSpeedDate] Resumed AudioContext');
        }
        
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContextRef.current.createMediaElementSource(audioPlayerRef.current);
        source.connect(analyser);
        analyser.connect(audioContextRef.current.destination);
        
        analyserRef.current = analyser;
        audioSourceCreatedRef.current = true;
        console.log('[DougieSpeedDate] Audio analyzer setup complete');
      } catch (error) {
        console.error('[DougieSpeedDate] Error setting up audio analyzer:', error);
      }
    }
    
    audioPlayerRef.current.play()
      .then(() => {
        console.log('[DougieSpeedDate] Audio playing successfully');
        setIsSpeaking(true);
        setCurrentAnimation('talking');
      })
      .catch(e => {
        console.error('[DougieSpeedDate] Error playing audio:', e);
        isPlayingRef.current = false;
        setIsSpeaking(false);
        setCurrentAnimation('idle');
        setTimeout(() => playNextAudioFromQueue(), 100);
      });
    
    audioPlayerRef.current.onended = () => {
      console.log('[DougieSpeedDate] Audio playback ended');
      URL.revokeObjectURL(audioUrl);
      isPlayingRef.current = false;
      setIsSpeaking(false);
      setCurrentAnimation('idle');
      // Play next audio if available
      setTimeout(() => playNextAudioFromQueue(), 100);
    };
  };

  // Update audio data for lip sync - SAME AS COACH
  useEffect(() => {
    if (!analyserRef.current) return;
    
    const updateAudioData = () => {
      if (analyserRef.current && isSpeaking) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        setAudioData(dataArray);
      }
      requestAnimationFrame(updateAudioData);
    };
    
    updateAudioData();
  }, [isSpeaking]);

  // Start date
  const startDate = async () => {
    setDateStarted(true);
    await requestPermissions();
    await connectToService();
    
    // Start timer
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          endDate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // End date
  const endDate = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Disconnect service
    if (humeVoiceServiceRef.current) {
      humeVoiceServiceRef.current.disconnect();
    }
    
    setShowReport(true);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (humeVoiceServiceRef.current) {
        humeVoiceServiceRef.current.disconnect();
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Pre-date screen
  if (!dateStarted && !showReport) {
    return (
      <div className="dougie-speed-date">
        <div className="pre-date-screen">
          <h1>Speed Date with {DOUGIE_CONFIG.name}</h1>
          <p>{DOUGIE_CONFIG.description}</p>
          
          <div className="date-rules">
            <h3>Speed Date Rules</h3>
            <ul>
              <li>Be yourself and have fun!</li>
              <li>Ask questions and share stories</li>
              <li>Keep it light and engaging</li>
              <li>You have 5 minutes to make a connection</li>
            </ul>
          </div>
          
          <button className="start-button" onClick={startDate}>
            Start Your Date
          </button>
        </div>
      </div>
    );
  }

  // Report screen
  if (showReport) {
    return (
      <div className="dougie-speed-date">
        <div className="date-report">
          <h1>Date Complete!</h1>
          <p>Thanks for speed dating with {DOUGIE_CONFIG.name}!</p>
          
          <div className="conversation-summary">
            <h3>Conversation Summary</h3>
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <strong>{msg.role === 'user' ? 'You' : DOUGIE_CONFIG.name}:</strong> {msg.content}
              </div>
            ))}
          </div>
          
          <button onClick={() => navigate('/speed-date')}>
            Back to Speed Dating
          </button>
        </div>
      </div>
    );
  }

  // Main date interface - SAME STRUCTURE AS COACH
  return (
    <div className="dougie-speed-date">
      {/* Background */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/Venues/GreatBistro.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0
        }}
      />
      
      {/* 3D Scene */}
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        <Canvas>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} />
          
          <Suspense fallback={null}>
            <PresenceAvatar
              avatarUrl={DOUGIE_CONFIG.avatarUrl}
              animationName={currentAnimation}
              audioData={audioData}
              emotionalBlendshapes={emotionalBlendshapes}
              position={[0, -1, 0]}
              scale={1.5}
            />
          </Suspense>
        </Canvas>
      </div>
      
      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
        {/* Timer and End Date Button - MAXIMUM VISIBILITY */}
        <div className="absolute top-4 left-4 pointer-events-auto" style={{ zIndex: 10000 }}>
          <div className="bg-black text-white px-8 py-6 rounded-2xl shadow-2xl border-4 border-white">
            <div className="text-5xl font-bold text-center">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
          </div>
          <button
            onClick={endDate}
            className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white text-2xl font-bold px-8 py-6 rounded-2xl shadow-2xl border-4 border-white hover:scale-105 transition-all"
            style={{ zIndex: 10000 }}
          >
            END DATE
          </button>
        </div>
        
        {/* Messages */}
        {coachMessage && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/80 text-white p-4 rounded-xl max-w-lg pointer-events-auto">
            <p>{coachMessage}</p>
          </div>
        )}
        
        {/* Error */}
        {error && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white p-4 rounded-xl pointer-events-auto">
            <p>{error}</p>
          </div>
        )}
      </div>
      
      {/* User PiP */}
      {isConnected && cameraStream && (
        <UserAvatarPiP
          position="top-right"
          size="medium"
          trackingData={faceTrackingData}
        />
      )}
    </div>
  );
};

export default DougieSpeedDateFixed;
