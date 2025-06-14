import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { PresenceAvatarMaleCoach } from './PresenceAvatarMaleCoach';
// import MasculinePresenceAvatar from './MasculinePresenceAvatar';
// import { UserAvatarPiP } from './UserAvatarPiP'; // Disabled to prevent WebGL conflicts
import HumeVoiceService from '../services/humeVoiceService';
import { HumeExpressionService } from '../services/HumeExpressionService';
import RealTimeEmotionSliders from './RealTimeEmotionSliders';
import TranscriptTimeline from './TranscriptTimeline';
import ChemistryReport from './ChemistryReport';
import { FaLock, FaLockOpen } from 'react-icons/fa';
import './DougieSpeedDate.css';

// Types
interface TranscriptSegment {
  timestamp: number;
  speaker: string;
  text: string;
  emotions: { emotion: string; score: number }[];
}

interface EmotionSnapshot {
  timestamp: number;
  participant1Emotions: { name: string; score: number }[];
  participant2Emotions: { name: string; score: number }[];
}

interface EmotionData {
  emotion: string;
  score: number;
}

// Dougie configuration
const DOUGIE_CONFIG = {
  id: 'dougie',
  name: 'Dougie',
  avatarUrl: '/avatars/Dougie.glb',
  humeConfigId: '320d816a-8dac-44e6-b59b-1c3d2b6b24d9',
  venue: '/images/coffee-shop.jpg',
  description: 'a charming entrepreneur who loves adventure',
  speedDatePrompts: [
    "So tell me, what brings you to speed dating? I'm always curious about people's stories.",
    "I have to say, you have such an interesting energy about you. What do you do for fun?",
    "What's something you're really passionate about? I love hearing what makes people's eyes light up."
  ]
};

const SPEED_DATE_DURATION = 300; // 5 minutes

const DougieSpeedDateSimple: React.FC = () => {
  const navigate = useNavigate();
  
  // Core state
  const [isConnected, setIsConnected] = useState(false);
  const [dateStarted, setDateStarted] = useState(false);
  const [dateEnded, setDateEnded] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(SPEED_DATE_DURATION);
  const [cameraLocked, setCameraLocked] = useState(true);
  const [dateStartTime, setDateStartTime] = useState<number>(0);
  
  // Emotion tracking
  const [userFacialEmotions, setUserFacialEmotions] = useState<{ emotion: string; score: number }[]>([]);
  const [userProsodyEmotions, setUserProsodyEmotions] = useState<{ emotion: string; score: number }[]>([]);
  const [dougieEmotions, setDougieEmotions] = useState<{ emotion: string; score: number }[]>([]);
  const [emotionHistory, setEmotionHistory] = useState<EmotionSnapshot[]>([]);
  
  // Transcript tracking
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  
  // Audio and animation
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [animationName, setAnimationName] = useState<string>('idle');
  const [audioDataState, setAudioDataState] = useState<Uint8Array>(new Uint8Array(128));
  const audioQueueRef = useRef<Blob[]>([]);
  const isPlayingRef = useRef(false);
  const audioPlayerRef = useRef<HTMLAudioElement>(new Audio());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceCreatedRef = useRef(false);
  const animationChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentEmotionsRef = useRef<{ user: EmotionData[], dougie: EmotionData[] }>({
    user: [],
    dougie: []
  });
  const audioDataRef = useRef<Uint8Array>(new Uint8Array(128));
  const audioFrameRef = useRef<number>(0);
  
  // Service refs
  const voiceServiceRef = useRef<typeof HumeVoiceService | null>(null);
  const expressionServiceRef = useRef<HumeExpressionService | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const emotionSnapshotRef = useRef<NodeJS.Timeout | null>(null);
  const controlsRef = useRef<any>(null);
  
  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('[DougieSpeedDate] Cleaning up...');
    
    // Clear any pending animation timeouts
    if (animationChangeTimeoutRef.current) {
      clearTimeout(animationChangeTimeoutRef.current);
    }
    
    // Stop all audio
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = '';
    }
    
    // Clear audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Disconnect services
    if (voiceServiceRef.current) {
      voiceServiceRef.current.disconnect();
      voiceServiceRef.current = null;
    }
    
    if (expressionServiceRef.current) {
      expressionServiceRef.current.stopTracking();
      expressionServiceRef.current = null;
    }
    
    // Clear refs
    analyserRef.current = null;
    audioSourceCreatedRef.current = false;
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    audioDataRef.current = new Uint8Array(128);
  }, []);

  // Initialize services
  useEffect(() => {
    console.log('[DougieSpeedDate] Initializing services...');
    
    // Use the singleton instance
    voiceServiceRef.current = HumeVoiceService;
    
    // Create expression service
    expressionServiceRef.current = new HumeExpressionService();
    
    return cleanup;
  }, [cleanup]);

  // Play audio from queue (similar to coach components)
  const playNextAudioFromQueue = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      setAnimationName('idle');
      audioDataRef.current = new Uint8Array(128);
      setAudioDataState(new Uint8Array(128));
      return;
    }
    
    const audioBlob = audioQueueRef.current.shift()!;
    const audioUrl = URL.createObjectURL(audioBlob);
    audioPlayerRef.current.src = audioUrl;
    
    // Setup audio context and analyser if needed (only once)
    if (!audioContextRef.current) {
      console.log('[DougieSpeedDate] Creating audio context and analyser');
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      audioDataRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      setAudioDataState(new Uint8Array(analyserRef.current.frequencyBinCount));
      
      // Resume context if suspended
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    }
    
    // Connect audio element to analyser if not already connected
    if (audioPlayerRef.current && analyserRef.current && !audioSourceCreatedRef.current) {
      try {
        console.log('[DougieSpeedDate] Connecting audio element to analyser');
        const source = audioContextRef.current!.createMediaElementSource(audioPlayerRef.current);
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current!.destination);
        audioSourceCreatedRef.current = true;
        console.log('[DougieSpeedDate] Audio analyser connected successfully');
      } catch (error) {
        console.error('[DougieSpeedDate] Error creating audio source:', error);
      }
    }

    audioPlayerRef.current.play()
      .then(() => {
        console.log('[DougieSpeedDate] Audio playing successfully');
        isPlayingRef.current = true;
        setAnimationName('talking');
        
        // Ensure audio context is running
        if (audioContextRef.current?.state === 'suspended') {
          console.log('[DougieSpeedDate] Resuming suspended audio context');
          audioContextRef.current.resume();
        }
        
        // Update audio data for lip sync
        if (analyserRef.current) {
          console.log('[DougieSpeedDate] Starting audio analysis, analyser:', analyserRef.current);
          const updateAudioData = () => {
            if (!isPlayingRef.current) return;
            
            const dataArray = new Uint8Array(analyserRef.current!.frequencyBinCount);
            analyserRef.current!.getByteFrequencyData(dataArray);
            audioDataRef.current = dataArray;
            setAudioDataState(dataArray); // Update state for avatar
            
            // Debug log every second
            const now = Date.now();
            if (!audioFrameRef.current || now - audioFrameRef.current > 1000) {
              const avgEnergy = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
              console.log('[DougieSpeedDate] Audio energy:', { 
                avg: avgEnergy,
                max: Math.max(...dataArray),
                dataLength: dataArray.length,
                analyserConnected: !!analyserRef.current,
                audioContextState: audioContextRef.current?.state
              });
              audioFrameRef.current = now;
            }
            
            requestAnimationFrame(updateAudioData);
          };
          updateAudioData();
        } else {
          console.error('[DougieSpeedDate] No analyser available for lip sync!');
        }
      }).catch(error => {
        console.error('[DougieSpeedDate] Error playing audio:', error);
        playNextAudioFromQueue();
      });
  }, []);

  // Initialize audio context and player
  useEffect(() => {
    // Setup audio player callbacks
    audioPlayerRef.current.onended = () => {
      console.log('[DougieSpeedDate] Audio ended, playing next');
      isPlayingRef.current = false;
      setIsSpeaking(false);
      setAnimationName('idle');
      audioDataRef.current = new Uint8Array(128);
      setAudioDataState(new Uint8Array(128));
      setTimeout(() => playNextAudioFromQueue(), 100);
    };

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [playNextAudioFromQueue]);

  // Handle audio playback
  const playAudio = useCallback((audioBlob: Blob) => {
    console.log('[DougieSpeedDate] playAudio called with blob size:', audioBlob.size);
    audioQueueRef.current.push(audioBlob);
    if (!isPlayingRef.current) {
      playNextAudioFromQueue();
    }
  }, [playNextAudioFromQueue]);

  // Connect to Hume
  const connectToHume = async () => {
    if (!voiceServiceRef.current || isConnected) return;
    
    try {
      console.log('[DougieSpeedDate] Connecting to Hume...');
      
      // Set up callbacks
      voiceServiceRef.current.setOnAudioCallback((audioBlob: Blob) => {
        console.log('[DougieSpeedDate] Audio received');
        playAudio(audioBlob);
      });
      
      voiceServiceRef.current.setOnMessageCallback((message: any) => {
        console.log('[DougieSpeedDate] Message received:', message);
      });
      
      voiceServiceRef.current.setOnTranscriptCallback((transcript: any) => {
        console.log('[DougieSpeedDate] Transcript received:', transcript);
        // Convert to our format
        const segment: TranscriptSegment = {
          timestamp: Date.now(),
          speaker: transcript.speaker || 'user',
          text: transcript.text || '',
          emotions: (transcript.emotions || []).map((e: any) => ({
            emotion: e.name || e.emotion,
            score: e.score || 0
          }))
        };
        setTranscriptSegments(prev => [...prev, segment]);
      });
      
      voiceServiceRef.current.setOnEmotionCallback((emotions: any[]) => {
        console.log('[DougieSpeedDate] Dougie emotions updated:', emotions);
        // Map from {name, score} to {emotion, score} and lowercase the emotion name
        const mappedEmotions = emotions.map(e => ({
          emotion: e.name ? e.name.toLowerCase() : e.emotion?.toLowerCase() || 'neutral',
          score: e.score || 0
        }));
        currentEmotionsRef.current.dougie = mappedEmotions;
        setDougieEmotions(mappedEmotions);
      });
      
      voiceServiceRef.current.setOnAssistantEndCallback(() => {
        console.log('[DougieSpeedDate] Assistant ended speaking');
        setIsSpeaking(false);
        setAnimationName('idle'); // Use generic animation name
      });
      
      // Connect with Dougie's config
      await voiceServiceRef.current.connect(DOUGIE_CONFIG.humeConfigId);
      setIsConnected(true);
      console.log('[DougieSpeedDate] Connected to Hume');
      
    } catch (error) {
      console.error('[DougieSpeedDate] Failed to connect:', error);
    }
  };

  // Start date
  const startDate = useCallback(async () => {
    setDateStarted(true);
    setDateStartTime(Date.now());
    await connectToHume();
    
    // Start timer
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          endDate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Start emotion snapshots
    emotionSnapshotRef.current = setInterval(() => {
      setEmotionHistory(prev => [...prev, {
        timestamp: Date.now(),
        participant1Emotions: currentEmotionsRef.current.user.map(e => ({ name: e.emotion, score: e.score })),
        participant2Emotions: currentEmotionsRef.current.dougie.map(e => ({ name: e.emotion, score: e.score }))
      }]);
    }, 5000);
    
    // Start facial tracking
    if (expressionServiceRef.current && videoRef.current) {
      expressionServiceRef.current.setOnEmotionCallback((emotions: { emotion: string; score: number }[]) => {
        setUserFacialEmotions(emotions);
        
        // Also update for chemistry tracking
        currentEmotionsRef.current.user = emotions;
      });
      expressionServiceRef.current.startTracking(videoRef.current);
    }
    
    // Send initial message
    if (voiceServiceRef.current) {
      const greeting = DOUGIE_CONFIG.speedDatePrompts[0];
      voiceServiceRef.current.sendTextMessage(greeting);
    }
  }, [connectToHume]);

  // End date
  const endDate = useCallback(() => {
    setDateEnded(true);
    cleanup();
    
    // Show report after delay
    setTimeout(() => {
      setShowReport(true);
    }, 1000);
  }, [cleanup, setShowReport]);

  // Add debug effect
  useEffect(() => {
    console.log('[DougieSpeedDate] Component mounted, dateStarted:', dateStarted);
  }, [dateStarted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[DougieSpeedDate] Cleaning up...');
      
      // Disconnect Hume services
      if (voiceServiceRef.current) {
        voiceServiceRef.current.disconnect();
      }
      if (expressionServiceRef.current) {
        expressionServiceRef.current.stopTracking();
      }
      
      // Clean up audio
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.src = '';
      }
      
      // Clean up WebGL context (will be handled by Canvas unmount)
      console.log('[DougieSpeedDate] Cleanup complete');
    };
  }, []);

  // Show chemistry report
  if (showReport) {
    return (
      <ChemistryReport
        emotionHistory={emotionHistory}
        participant1Name="You"
        participant2Name={DOUGIE_CONFIG.name}
        callDuration={SPEED_DATE_DURATION - timeRemaining}
        onClose={() => navigate('/')}
      />
    );
  }

  // Main render
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${DOUGIE_CONFIG.venue})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Main 3D Scene */}
      <div className="absolute inset-0 z-10" style={{ width: '100vw', height: '100vh' }}>
        <Canvas 
          camera={{ position: [0, 1.6, 2.5], fov: 50 }}
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh' 
          }}
          gl={{ 
            antialias: true, 
            powerPreference: "high-performance",
            preserveDrawingBuffer: false
          }}
          onCreated={({ gl }) => {
            console.log('[DougieSpeedDate] WebGL context created');
            gl.setClearColor('#000000', 0);
          }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <directionalLight position={[-5, 5, -5]} intensity={0.4} />
          
          <PresenceAvatarMaleCoach
            avatarUrl={DOUGIE_CONFIG.avatarUrl}
            position={[0, -1.5, 0]}
            scale={1}
            animationName={animationName}
            audioData={audioDataState}
            participantId="dougie"
            emotionalBlendshapes={dougieEmotions.reduce((acc, e) => {
              const result = {
                ...acc,
                [e.emotion]: e.score
              };
              // Log every 60 frames for debugging
              if (Date.now() % 1000 < 16 && Object.keys(result).length > 0) {
                console.log('[DougieSpeedDate] Passing emotions to avatar:', result);
              }
              return result;
            }, {} as Record<string, number>)}
          />
          
          <OrbitControls 
            ref={controlsRef}
            target={[0, 1.5, 0]}
            enablePan={!cameraLocked}
            enableZoom={!cameraLocked}
            enableRotate={!cameraLocked}
          />
        </Canvas>
      </div>
      
      {/* UI Overlay */}
      {!dateStarted ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-lg">
            <h1 className="text-4xl font-bold mb-4">Speed Date with {DOUGIE_CONFIG.name}</h1>
            <p className="text-xl mb-6">{DOUGIE_CONFIG.description}</p>
            <button
              onClick={startDate}
              className="bg-pink-500 hover:bg-pink-600 text-white text-xl font-bold px-8 py-4 rounded-lg transition-colors"
            >
              Start 5-Minute Date
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Timer and End Button */}
          <div className="absolute top-4 left-4 z-40">
            <button
              onClick={endDate}
              className="bg-red-600 hover:bg-red-700 text-white text-2xl font-bold px-8 py-4 rounded-lg shadow-2xl mb-4"
            >
              END DATE
            </button>
            <div className="bg-black text-white px-6 py-3 rounded-lg text-2xl font-bold text-center">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
          </div>
          
          {/* Camera Lock Button */}
          <div className="absolute bottom-4 right-4 z-40">
            <button
              onClick={() => setCameraLocked(!cameraLocked)}
              className={`${
                cameraLocked ? 'bg-green-600' : 'bg-gray-600'
              } hover:opacity-80 text-white p-4 rounded-lg shadow-2xl flex items-center gap-2`}
            >
              {cameraLocked ? <FaLock size={24} /> : <FaLockOpen size={24} />}
              <span className="text-lg font-bold">
                {cameraLocked ? 'Camera Locked' : 'Camera Unlocked'}
              </span>
            </button>
          </div>
          
          {/* Emotion Display */}
          <div className="absolute bottom-4 left-4 z-30 max-w-md">
            <RealTimeEmotionSliders
              emotions={userFacialEmotions}
              participantName="Your Emotions"
            />
          </div>
        </>
      )}
      
      {/* Hidden video for face tracking */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default DougieSpeedDateSimple;
