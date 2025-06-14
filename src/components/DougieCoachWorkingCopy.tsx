import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { HybridVoiceService } from '../services/hybridVoiceService';
import { PresenceAvatarMaleCoach } from './PresenceAvatarMaleCoach';
import { mapEmotionsToBlendshapes } from '../utils/emotionMappings';

// Simplified working Dougie coach - exact copy of CoachSession with minimal changes
const DougieCoachWorkingCopy: React.FC = () => {
  console.log('[DougieCoachWorkingCopy] Component mounting...');
  
  // State management - exact copy from CoachSession
  const [currentAnimation, setCurrentAnimation] = useState<string>('idle');
  const [emotionalBlendshapes, setEmotionalBlendshapes] = useState<any>({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coachMessage, setCoachMessage] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  
  // Service refs - exact copy from CoachSession
  const humeVoiceServiceRef = useRef<HybridVoiceService | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(new Audio());
  const audioQueueRef = useRef<Blob[]>([]);
  const isPlayingRef = useRef(false);
  const audioSourceCreatedRef = useRef(false);
  const audioDataRef = useRef<Uint8Array>(new Uint8Array(128));
  
  // Dougie config - ONLY change
  const DOUGIE_CONFIG_ID = '320d816a-8dac-44e6-b59b-1c3d2b6b24d9';
  const DOUGIE_AVATAR_URL = '/avatars/Douglas.glb'; // NEW: Douglas with full facial blendshapes
  
  // Initialize audio context - exact copy from CoachSession
  useEffect(() => {
    audioPlayerRef.current.onended = () => {
      console.log('[DougieCoachWorkingCopy] Audio ended, playing next');
      setIsSpeaking(false);
      setCurrentAnimation('idle');
      setTimeout(() => playNextAudioFromQueue(), 100);
    };
    
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Initialize HumeVoiceService - exact copy from CoachSession
  useEffect(() => {
    const initHybridVoiceService = async () => {
      if (!humeVoiceServiceRef.current) {
        console.log('[DougieCoachWorkingCopy] Initializing HybridVoiceService...');
        humeVoiceServiceRef.current = new HybridVoiceService();
        
        // Set up callbacks for audio and messages - exact copy from CoachSession
        humeVoiceServiceRef.current.onAudio((audioBlob: Blob) => {
          console.log('[DougieCoachWorkingCopy] Audio received:', audioBlob.size);
          setIsSpeaking(true);
          setCurrentAnimation('talking');
          audioQueueRef.current.push(audioBlob);
          if (!isPlayingRef.current) {
            playNextAudioFromQueue();
          }
        });
        
        humeVoiceServiceRef.current.onMessage((message: any) => {
          console.log('[DougieCoachWorkingCopy] Message received:', message);
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
          console.log('[DougieCoachWorkingCopy] Assistant ended');
          setIsSpeaking(false);
          setCurrentAnimation('idle');
        });
        
        humeVoiceServiceRef.current.onUserMessage((transcript: string) => {
          console.log('[DougieCoachWorkingCopy] User message:', transcript);
          setMessages(prev => [...prev, {
            role: 'user',
            content: transcript
          }]);
          setUserTranscript(transcript);
        });
        
        humeVoiceServiceRef.current.onError((error: Error) => {
          console.error('[DougieCoachWorkingCopy] Error:', error);
          setError(error.message);
        });
        
        console.log('[DougieCoachWorkingCopy] HybridVoiceService initialized successfully');
      }
    };
    
    initHybridVoiceService();
  }, []);

  // Connect handler - exact copy from CoachSession
  const handleConnect = async () => {
    if (!humeVoiceServiceRef.current) return;
    setLoading(true);
    setError(null);
    
    try {
      if (humeVoiceServiceRef.current) {
        console.log('[DougieCoachWorkingCopy] Connecting to HybridVoiceService...');
        humeVoiceServiceRef.current.connect(DOUGIE_CONFIG_ID).then(() => {
          console.log('[DougieCoachWorkingCopy] Connected to Hume');
          setIsConnected(true);
          setLoading(false);
        }).catch((error: any) => {
          console.error('[DougieCoachWorkingCopy] Connection error:', error);
          setError(error instanceof Error ? error.message : 'Failed to connect to coach');
        });
      }
    } catch (err) {
      console.error('[DougieCoachWorkingCopy] Connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to coach');
    } finally {
      setLoading(false);
    }
  };

  // Disconnect handler - exact copy from CoachSession
  const handleDisconnect = async () => {
    if (humeVoiceServiceRef.current) {
      await humeVoiceServiceRef.current.disconnect();
      setIsConnected(false);
    }
  };

  // Play next audio from queue - exact copy from CoachSession
  const playNextAudioFromQueue = () => {
    if (audioQueueRef.current.length === 0) {
      console.log('[DougieCoachWorkingCopy] Audio queue is empty');
      isPlayingRef.current = false;
      return;
    }

    console.log('[DougieCoachWorkingCopy] Playing audio from queue, queue length:', audioQueueRef.current.length);
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
          console.log('[DougieCoachWorkingCopy] Created new AudioContext');
        }

        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
          console.log('[DougieCoachWorkingCopy] Resumed AudioContext');
        }

        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContextRef.current.createMediaElementSource(audioPlayerRef.current);
        
        // Use original AudioNode.connect to bypass HumeVoiceService blocking
        const originalConnect = (window as any).__originalAudioNodeConnect || AudioNode.prototype.connect;
        originalConnect.call(source, analyser);
        originalConnect.call(analyser, audioContextRef.current.destination);
        
        analyserRef.current = analyser;
        audioSourceCreatedRef.current = true;
        console.log('[DougieCoachWorkingCopy] Audio analyzer setup complete with original connect');
      } catch (error) {
        console.error('[DougieCoachWorkingCopy] Error setting up audio analyzer:', error);
      }
    }

    audioPlayerRef.current.play()
      .then(() => {
        console.log('[DougieCoachWorkingCopy] Audio playing successfully');
      })
      .catch((e) => {
        console.error('[DougieCoachWorkingCopy] Error playing audio:', e);
        isPlayingRef.current = false;
        URL.revokeObjectURL(audioUrl);
        setTimeout(() => playNextAudioFromQueue(), 100);
      });

    audioPlayerRef.current.onended = () => {
      console.log('[DougieCoachWorkingCopy] Audio playback ended');
      URL.revokeObjectURL(audioUrl);
      isPlayingRef.current = false;
      
      // Play next audio if available
      setTimeout(() => playNextAudioFromQueue(), 100);
    };
  };

  // Get current audio data for avatar
  const getCurrentAudioData = () => {
    if (analyserRef.current && isSpeaking) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      return dataArray;
    }
    return new Uint8Array(128);
  };

  console.log('[DougieCoachWorkingCopy] Component rendering...');

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000' }}>
      <div style={{ 
        position: 'fixed', 
        top: '120px', 
        left: '20px', 
        zIndex: 10000,
        display: 'flex',
        gap: '10px'
      }}>
        {!isConnected ? (
          <button 
            onClick={handleConnect}
            disabled={loading}
            style={{
              padding: '15px 25px',
              backgroundColor: '#ff1493',
              color: 'white',
              border: '3px solid white',
              borderRadius: '10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 4px 8px rgba(0,0,0,0.5)'
            }}
          >
            {loading ? 'Connecting...' : 'START DOUGIE SESSION'}
          </button>
        ) : (
          <button 
            onClick={handleDisconnect}
            style={{
              padding: '15px 25px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: '3px solid white',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 4px 8px rgba(0,0,0,0.5)'
            }}
          >
            END SESSION
          </button>
        )}
        <button 
          onClick={() => {
            console.log('[DougieCoachWorkingCopy] Testing audio analyser...');
            if (analyserRef.current) {
              const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
              analyserRef.current.getByteFrequencyData(dataArray);
              const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
              console.log('[DougieCoachWorkingCopy] Current audio energy:', avg);
              console.log('[DougieCoachWorkingCopy] Analyser connected:', !!analyserRef.current);
              console.log('[DougieCoachWorkingCopy] Audio playing:', !audioPlayerRef.current.paused);
            } else {
              console.log('[DougieCoachWorkingCopy] No analyser available');
            }
          }}
          style={{
            padding: '10px 15px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: '2px solid white',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          TEST AUDIO
        </button>
      </div>
      {/* Debug info */}
      <div style={{
        position: 'absolute',
        top: '120px',
        right: '20px',
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: '10px',
        zIndex: 2000,
        borderRadius: '5px'
      }}>
        Avatar URL: {DOUGIE_AVATAR_URL}<br/>
        Config ID: {DOUGIE_CONFIG_ID}<br/>
        Connected: {isConnected ? 'Yes' : 'No'}<br/>
        Animation: {currentAnimation}
      </div>
      {error && (
        <div style={{
          position: 'absolute',
          top: '180px',
          left: '20px',
          color: 'red',
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 1000
        }}>
          Error: {error}
        </div>
      )}

      <Canvas style={{ width: '100%', height: '100%' }} camera={{ position: [0, 0, 2], fov: 50 }}>
        <OrbitControls />
        <ambientLight intensity={0.8} />
        <pointLight position={[2, 2, 2]} intensity={1} />
        <pointLight position={[-2, 2, 2]} intensity={1} />
        <directionalLight position={[0, 2, 1]} intensity={1.2} />
        <Suspense fallback={null}>
          <PresenceAvatarMaleCoach
            avatarUrl={DOUGIE_AVATAR_URL}
            position={[0, -0.5, 0]}
            scale={3.0}
            animationName={currentAnimation}
            emotionalBlendshapes={emotionalBlendshapes}
            audioData={getCurrentAudioData()}
          />
        </Suspense>
        <mesh position={[0, 0, -3]}>
          <planeGeometry args={[8, 8]} />
          <meshBasicMaterial color="#222222" />
        </mesh>
      </Canvas>
    </div>
  );
};

export default DougieCoachWorkingCopy;
