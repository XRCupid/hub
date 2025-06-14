import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { PresenceAvatarWithGender } from './PresenceAvatarWithGender';
import { HybridVoiceService } from '../services/hybridVoiceService';
import { HumeExpressionService } from '../services/HumeExpressionService';
import RealTimeEmotionSliders from './RealTimeEmotionSliders';
import TranscriptTimeline from './TranscriptTimeline';
import ChemistryReport from './ChemistryReport';
import { FaLock, FaLockOpen } from 'react-icons/fa';
import './DougieSpeedDate.css';

// WebGL Error Boundary
class WebGLErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[WebGLErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="pip-fallback">
          <p>Unable to load 3D avatar</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Transcript segment type
interface TranscriptSegment {
  timestamp: number;
  speaker: string;
  text: string;
  emotions: { name: string; score: number }[];
  prosodyEmotions?: { name: string; score: number }[];
  facialEmotions?: { name: string; score: number }[];
}

interface EmotionSnapshot {
  timestamp: number;
  participant1Emotions: { name: string; score: number }[];
  participant2Emotions: { name: string; score: number }[];
}

const DOUGIE_CONFIG = {
  id: 'dougie',
  name: 'Dougie',
  avatarUrl: '/avatars/Dougie.glb',
  humeConfigId: '320d816a-8dac-44e6-b59b-1c3d2b6b24d9',
  convaiCharacterId: '', 
  venue: '/images/coffee-shop.jpg',
  personality: 'charming, witty, adventurous',
  description: 'a charming entrepreneur who loves adventure and deep conversations',
  speedDatePrompts: [
    "So tell me, what brings you to speed dating? I'm always curious about people's stories.",
    "I have to say, you have such an interesting energy about you. What do you do for fun?",
    "What's something you're really passionate about? I love hearing what makes people's eyes light up."
  ]
};

const SPEED_DATE_DURATION = 300; // 5 minutes in seconds

const DougieSpeedDate: React.FC = () => {
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [dateStarted, setDateStarted] = useState(false);
  const [dateEnded, setDateEnded] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  
  // Emotion tracking
  const [userFacialEmotions, setUserFacialEmotions] = useState<{ name: string; score: number }[]>([]);
  const [userProsodyEmotions, setUserProsodyEmotions] = useState<{ name: string; score: number }[]>([]);
  const [dougieEmotions, setDougieEmotions] = useState<{ name: string; score: number }[]>([]);
  const [emotionHistory, setEmotionHistory] = useState<EmotionSnapshot[]>([]);
  
  // Transcript tracking
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  // Audio and animation
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(128));
  const [animationName, setAnimationName] = useState('idle');
  const [emotionalBlendshapes, setEmotionalBlendshapes] = useState<Record<string, number>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Timer
  const [timeRemaining, setTimeRemaining] = useState(SPEED_DATE_DURATION);
  const [dateStartTime, setDateStartTime] = useState<number>(0);
  
  // Services
  const voiceServiceRef = useRef<HybridVoiceService | null>(null);
  const expressionServiceRef = useRef<HumeExpressionService | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const emotionSnapshotRef = useRef<NodeJS.Timeout | null>(null);
  
  // Audio context and analyser
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(new Audio());
  const audioSourceCreatedRef = useRef<boolean>(false);
  
  const [showUserAvatar, setShowUserAvatar] = useState(false);
  const [cameraLocked, setCameraLocked] = useState(false);
  const controlsRef = useRef<any>(null);

  // Delay showing user avatar to avoid WebGL conflicts
  useEffect(() => {
    if (isConnected && dateStarted) {
      // Longer delay to ensure main canvas is fully initialized
      const timer = setTimeout(() => setShowUserAvatar(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, dateStarted]);

  // Initialize services and audio context
  useEffect(() => {
    console.log('[DougieSpeedDate] Initializing services...');
    
    // Create our audio player first and mark it
    const audioPlayer = new Audio();
    audioPlayer.dataset.dougieSpeedDate = 'true';
    audioPlayerRef.current = audioPlayer;
    
    // Mute any other audio elements that get created
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLAudioElement && !node.dataset.dougieSpeedDate) {
            console.log('[DougieSpeedDate] Muting external audio element');
            node.muted = true;
            node.volume = 0;
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Initialize AudioContext
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContextClass({ sampleRate: 48000 });
    console.log('[DougieSpeedDate] AudioContext initialized');
    
    // Initialize voice service
    if (!voiceServiceRef.current) {
      voiceServiceRef.current = new HybridVoiceService();
      voiceServiceRef.current.setUseHumeForConversation(true);
      console.log('[DougieSpeedDate] HybridVoiceService initialized');
    }
    
    // Initialize expression service
    expressionServiceRef.current = new HumeExpressionService();
    
    return () => {
      observer.disconnect();
      cleanup();
    };
  }, []);

  // Set up voice service callbacks and connect
  useEffect(() => {
    if (!voiceServiceRef.current || isConnected) return;
    
    const setupVoiceService = async () => {
      try {
        console.log('[DougieSpeedDate] Setting up voice service callbacks...');
        
        // Set up callbacks
        voiceServiceRef.current!.onAudio((audioBlob: Blob) => {
          console.log('[DougieSpeedDate] Audio received, size:', audioBlob.size);
          if (audioBlob.size > 0) {
            setIsSpeaking(true);
            setAnimationName('talking');
            playAudio(audioBlob);
          }
        });
        
        voiceServiceRef.current!.onMessage((message: any) => {
          console.log('[DougieSpeedDate] Message received:', message);
          const messageText = typeof message === 'string' ? message : 
                            (message?.message?.content || message?.content || 
                             JSON.stringify(message));
          
          if (messageText && messageText.trim()) {
            setCurrentTranscript(messageText);
          }
        });
        
        voiceServiceRef.current!.onEmotion((emotions: Array<{name: string, score: number}>) => {
          console.log('[DougieSpeedDate] Emotions received:', emotions);
          setDougieEmotions(emotions);
        });
        
        voiceServiceRef.current!.onUserMessage((message: string) => {
          console.log('[DougieSpeedDate] User message:', message);
        });
        
        voiceServiceRef.current!.onError((error: Error) => {
          console.error('[DougieSpeedDate] Voice service error:', error);
        });
        
        // Connect to the service
        await voiceServiceRef.current!.connect(DOUGIE_CONFIG.humeConfigId);
        setIsConnected(true);
        console.log('[DougieSpeedDate] Voice service connected successfully');
        
      } catch (error) {
        console.error('[DougieSpeedDate] Failed to connect voice service:', error);
      }
    };
    
    setupVoiceService();
  }, []);

  // Cleanup function
  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (emotionSnapshotRef.current) clearInterval(emotionSnapshotRef.current);
    if (voiceServiceRef.current) voiceServiceRef.current.disconnect();
    if (expressionServiceRef.current) expressionServiceRef.current.stopTracking();
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  };

  // Start the speed date
  const startDate = async () => {
    try {
      // Ensure AudioContext is resumed (user interaction required)
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        console.log('[DougieSpeedDate] AudioContext resumed');
      }
      
      setDateStarted(true);
      setDateStartTime(Date.now());
      
      // Start facial expression tracking
      if (videoRef.current) {
        await expressionServiceRef.current!.startTracking(videoRef.current);
        expressionServiceRef.current!.setOnEmotionCallback((emotions: any[]) => {
          const formattedEmotions = emotions.map(e => ({ 
            name: 'emotion' in e ? (e as any).emotion : e.name, 
            score: e.score 
          }));
          setUserFacialEmotions(formattedEmotions);
        });
      }

      // Start the date
      setTimeout(() => {
        console.log('[DougieSpeedDate] Sending initial greeting to trigger conversation');
        voiceServiceRef.current!.sendMessage("Hi!");
        
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

        // Start emotion snapshot collection
        emotionSnapshotRef.current = setInterval(() => {
          const snapshot: EmotionSnapshot = {
            timestamp: (Date.now() - dateStartTime) / 1000,
            participant1Emotions: [...userFacialEmotions],
            participant2Emotions: [...dougieEmotions]
          };
          setEmotionHistory(prev => [...prev, snapshot]);
        }, 5000); // Every 5 seconds

      }, 1500);

    } catch (error) {
      console.error('Failed to start date:', error);
      alert('Failed to connect. Please check your connection and try again.');
    }
  };

  // Play audio with lip sync analysis
  const playAudio = async (audioBlob: Blob) => {
    // Add unique ID to track this audio playback
    const audioId = Date.now() + Math.random();
    console.log(`[DougieSpeedDate] Starting audio playback ${audioId}, blob size:`, audioBlob.size);
    
    // Create URL for the audio blob
    const audioUrl = URL.createObjectURL(audioBlob);
    audioPlayerRef.current.src = audioUrl;
    
    // Setup audio analyzer for lip sync BEFORE playing (like coaches do)
    if (!audioSourceCreatedRef.current) {
      try {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioContext();
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
    
    // Use a local flag for the animation loop
    let isPlaying = true;
    
    // Play the audio
    audioPlayerRef.current.play()
      .then(() => {
        console.log('[DougieSpeedDate] Audio playing successfully');
        
        // Start lip sync animation
        const updateLipSync = () => {
          if (!isPlaying || !analyserRef.current) return;
          
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          setAudioData(dataArray);
          
          requestAnimationFrame(updateLipSync);
        };
        updateLipSync();
      })
      .catch(e => {
        console.error('[DougieSpeedDate] Error playing audio:', e);
        isPlaying = false;
      });
    
    // Handle audio end
    audioPlayerRef.current.onended = () => {
      console.log('[DougieSpeedDate] Audio playback ended');
      URL.revokeObjectURL(audioUrl);
      isPlaying = false;
      // Reset audio data and animation
      setAudioData(new Uint8Array(128));
      setIsSpeaking(false);
      setAnimationName('idle');
    };
  };

  // End the date
  const endDate = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (emotionSnapshotRef.current) clearInterval(emotionSnapshotRef.current);
    
    setDateEnded(true);
    setAnimationName('idle');
    
    // Send closing message
    if (voiceServiceRef.current && isConnected) {
      voiceServiceRef.current.sendMessage(
        "Wow, time really flies when you're having fun! This has been wonderful. I'd love to see you again!"
      );
    }
    
    // Show report after a delay
    setTimeout(() => {
      setShowReport(true);
    }, 3000);
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Map prosody emotions to blendshapes
  useEffect(() => {
    const blendshapes: Record<string, number> = {};
    dougieEmotions.forEach(emotion => {
      const value = emotion.score / 100;
      switch (emotion.name.toLowerCase()) {
        case 'joy':
        case 'amusement':
          blendshapes.happy = Math.max(blendshapes.happy || 0, value);
          break;
        case 'interest':
        case 'excitement':
          blendshapes.surprised = Math.max(blendshapes.surprised || 0, value * 0.5);
          break;
        case 'confusion':
          blendshapes.confused = value;
          break;
        case 'sadness':
          blendshapes.sad = value;
          break;
      }
    });
    setEmotionalBlendshapes(blendshapes);
  }, [dougieEmotions]);

  // Convert emotions to tracking data format for UserAvatarPiP
  const userTrackingData = useMemo(() => {
    if (!userFacialEmotions || userFacialEmotions.length === 0) return null;
    
    // Convert emotions array to facial expressions object
    const facialExpressions: any = {};
    userFacialEmotions.forEach(emotion => {
      facialExpressions[emotion.name] = emotion.score / 100; // Convert to 0-1 range
    });
    
    return {
      facialExpressions,
      posture: null,
      hands: null,
      headRotation: null,
      landmarks: null
    };
  }, [userFacialEmotions]);

  // Render report view
  if (showReport && !showTranscript) {
    return (
      <div className="dougie-speed-date report-view">
        <ChemistryReport
          emotionHistory={emotionHistory}
          participant1Name="You"
          participant2Name={DOUGIE_CONFIG.name}
          callDuration={300 - timeRemaining}
          transcriptSegments={transcriptSegments}
          onClose={() => setShowReport(false)}
        />
        <button 
          className="view-transcript-btn"
          onClick={() => setShowTranscript(true)}
        >
          View Full Transcript
        </button>
      </div>
    );
  }

  // Render transcript view
  if (showTranscript) {
    return (
      <div className="dougie-speed-date transcript-view">
        <div className="transcript-header">
          <h2>Speed Date Transcript with {DOUGIE_CONFIG.name}</h2>
          <button onClick={() => setShowTranscript(false)}>Back to Report</button>
        </div>
        <TranscriptTimeline
          segments={transcriptSegments}
          callDuration={SPEED_DATE_DURATION - timeRemaining}
        />
      </div>
    );
  }

  // Main date interface
  return (
    <div className="dougie-speed-date">
      {/* Hidden video for face tracking */}
      <video ref={videoRef} style={{ display: 'none' }} autoPlay playsInline />
      
      {/* Pre-date screen */}
      {!dateStarted && !showReport && (
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
      )}
      
      {/* Date screen */}
      {dateStarted && !showReport && (
        <>
          {/* Background Image Layer */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: 'url(/Venues/GreatBistro.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              zIndex: 0
            }}
          />
          
          {/* 3D Scene Layer - Main Avatar */}
          <div className="absolute inset-0" style={{ zIndex: 1 }}>
            <Canvas
              camera={{ position: [0, 0, 5], fov: 50 }}
              gl={{ 
                antialias: true,
                alpha: true,
                preserveDrawingBuffer: true
              }}
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              
              <React.Suspense fallback={null}>
                <PresenceAvatarWithGender
                  avatarUrl={DOUGIE_CONFIG.avatarUrl}
                  position={[0, -0.2, 0]} // Raise avatar slightly
                  scale={1.0}
                  trackingData={undefined}
                  animationName={animationName}
                  emotionalBlendshapes={emotionalBlendshapes}
                  audioData={audioData}
                  participantId="dougie"
                  gender="male"
                />
              </React.Suspense>
              <OrbitControls 
                ref={controlsRef}
                enablePan={!cameraLocked}
                enableZoom={!cameraLocked}
                enableRotate={!cameraLocked}
                target={[0, 1.5, 0]} // Focus on face level
                minDistance={1.5}
                maxDistance={5}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 2}
                autoRotate={false}
                autoRotateSpeed={0}
                enableDamping={true}
                dampingFactor={0.05}
              />
            </Canvas>
          </div>
          
          {/* UI Overlay Layer */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10000 }}>
            {/* End Date Button - MAXIMUM VISIBILITY */}
            <div 
              className="absolute top-4 left-4"
              style={{ 
                zIndex: 999999,
                position: 'fixed',
                pointerEvents: 'auto'
              }}
            >
              <button
                onClick={endDate}
                className="bg-red-600 hover:bg-red-700 text-white text-2xl font-bold px-8 py-4 rounded-lg shadow-2xl border-4 border-white"
                style={{
                  cursor: 'pointer',
                  zIndex: 999999
                }}
              >
                END DATE
              </button>
              <div className="mt-4 bg-black text-white px-6 py-3 rounded-lg text-2xl font-bold">
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </div>
            </div>
            
            {/* Camera Lock Button */}
            <div className="absolute bottom-4 right-4 pointer-events-auto">
              <button
                onClick={() => setCameraLocked(!cameraLocked)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  cameraLocked 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
                title={cameraLocked ? 'Unlock camera' : 'Lock camera position'}
              >
                {cameraLocked ? (
                  <>
                    <FaLock className="w-5 h-5" />
                    Camera Locked
                  </>
                ) : (
                  <>
                    <FaLockOpen className="w-5 h-5" />
                    Lock Camera
                  </>
                )}
              </button>
            </div>
            
            {/* Camera Instructions */}
            {!cameraLocked && (
              <div className="absolute top-4 right-4 bg-black/70 text-white p-3 rounded-lg max-w-xs pointer-events-auto">
                <p className="text-sm">
                  <strong>Camera Controls:</strong><br/>
                  • Left click + drag to rotate<br/>
                  • Right click + drag to pan<br/>
                  • Scroll to zoom<br/>
                  Click "Lock Camera" when ready
                </p>
              </div>
            )}
          </div>
          
          {/* Emotion displays */}
          <div className="emotion-displays">
            <div className="user-emotions">
              <h3>Your Emotions</h3>
              <RealTimeEmotionSliders
                emotions={userFacialEmotions.map(e => ({ emotion: e.name, score: e.score }))}
                participantName="You"
              />
            </div>
            <div className="dougie-emotions">
              <h3>{DOUGIE_CONFIG.name}'s Emotions</h3>
              <RealTimeEmotionSliders
                emotions={dougieEmotions.map(e => ({ emotion: e.name, score: e.score }))}
                participantName={DOUGIE_CONFIG.name}
              />
            </div>
          </div>

          {/* Current transcript */}
          {currentTranscript && (
            <div className="current-transcript">
              {currentTranscript}
            </div>
          )}
        </>
      )}
      
      {/* Chemistry Report */}
      {showReport && (
        <ChemistryReport
          emotionHistory={emotionHistory}
          participant1Name="You"
          participant2Name={DOUGIE_CONFIG.name}
          callDuration={300 - timeRemaining}
          transcriptSegments={transcriptSegments}
          onClose={() => {
            // Reset everything
            setShowReport(false);
            setDateStarted(false);
            setTimeRemaining(300);
            setTranscriptSegments([]);
            setCurrentTranscript('');
            setIsConnected(false);
            setIsSpeaking(false);
            setAnimationName('idle');
            setUserFacialEmotions([]);
            setDougieEmotions([]);
            setEmotionalBlendshapes({});
            setAudioData(new Uint8Array(128));
          }}
        />
      )}
    </div>
  );
};

export default DougieSpeedDate;
