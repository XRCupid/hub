import React, { useState, useRef, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { HybridVoiceService } from '../services/hybridVoiceService';
import { PresenceAvatarMaleCoach } from './PresenceAvatarMaleCoach';
import './CoachSession.css';

const DougieCoachSimple: React.FC = () => {
  // State - exact copy from CoachSession
  const [currentAnimation, setCurrentAnimation] = useState<string>('idle');
  const [emotionalBlendshapes, setEmotionalBlendshapes] = useState<any>({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [coachMessage, setCoachMessage] = useState<string>('');
  const [userTranscript, setUserTranscript] = useState<string>('');
  const isPlayingRef = useRef(false);
  
  // Service refs - exact copy from CoachSession
  const humeVoiceServiceRef = useRef<HybridVoiceService | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioDataRef = useRef<Uint8Array>(new Uint8Array(128));
  const audioPlayerRef = useRef<HTMLAudioElement>(new Audio());
  const audioQueueRef = useRef<Blob[]>([]);
  const audioSourceCreatedRef = useRef(false);

  // Dougie config
  const DOUGIE_CONFIG = {
    avatarUrl: '/avatars/Dougie.glb',
    configId: '320d816a-8dac-44e6-b59b-1c3d2b6b24d9'
  };

  // Initialize service and setup callbacks - exact copy from CoachSession
  useEffect(() => {
    if (!humeVoiceServiceRef.current) {
      console.log('[DougieCoachSimple] Initializing HybridVoiceService...');
      humeVoiceServiceRef.current = new HybridVoiceService();
      
      // Setup callbacks exactly like CoachSession
      humeVoiceServiceRef.current.onAudio((audioBlob: Blob) => {
        console.log('[DougieCoachSimple] Audio received:', audioBlob.size);
        setIsSpeaking(true);
        setCurrentAnimation('talking');
        console.log('[DougieCoachSimple] Animation state set to: talking');
        audioQueueRef.current.push(audioBlob);
        
        // Always try to play - remove the isPlayingRef check that's blocking it
        playNextAudio();
      });
      
      humeVoiceServiceRef.current.onMessage((message: any) => {
        console.log('[DougieCoachSimple] Message received:', message);
        const messageText = typeof message === 'string' ? message : 
                          (message?.message?.content || message?.content || 
                           JSON.stringify(message));
        
        if (messageText && messageText.trim()) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: messageText
          }]);
          setCoachMessage(messageText);
        }
      });
      
      humeVoiceServiceRef.current.onAssistantEnd(() => {
        console.log('[DougieCoachSimple] Assistant ended');
        setIsSpeaking(false);
        setCurrentAnimation('idle');
        console.log('[DougieCoachSimple] Animation state set to: idle');
      });
      
      humeVoiceServiceRef.current.onUserMessage((transcript: string) => {
        console.log('[DougieCoachSimple] User message:', transcript);
        setMessages(prev => [...prev, {
          role: 'user',
          content: transcript
        }]);
        setUserTranscript(transcript);
      });
      
      humeVoiceServiceRef.current.onError((error: Error) => {
        console.error('[DougieCoachSimple] Error:', error);
        setError(error.message);
      });
      
      console.log('[DougieCoachSimple] HybridVoiceService initialized successfully');
    }
    
    return () => {
      if (humeVoiceServiceRef.current) {
        humeVoiceServiceRef.current.disconnect();
      }
    };
  }, []);

  const playNextAudio = () => {
    if (audioQueueRef.current.length > 0) {
      isPlayingRef.current = true;
      console.log('[DougieCoachSimple] playNextAudio called, queue length:', audioQueueRef.current.length);
      
      const audioBlob = audioQueueRef.current.shift()!; // Non-null assertion since we check length
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log('[DougieCoachSimple] Created audio URL:', audioUrl.slice(0, 50), '...');
      
      audioPlayerRef.current.src = audioUrl;
      
      // Setup audio analyzer BEFORE playing
      console.log('[DougieCoachSimple] Setting up audio analyzer (forced)...');
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
          console.log('[DougieCoachSimple] Created AudioContext');
        }
        
        if (!analyserRef.current) {
          const analyser = audioContextRef.current.createAnalyser();
          analyser.fftSize = 256;
          analyserRef.current = analyser;
          console.log('[DougieCoachSimple] Created analyser');
        }
        
        // Only create media source once
        if (!audioSourceCreatedRef.current) {
          const source = audioContextRef.current.createMediaElementSource(audioPlayerRef.current);
          source.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
          audioSourceCreatedRef.current = true;
          console.log('[DougieCoachSimple] Connected audio source to analyser');
        }
        
        // Ensure audio context is running
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().then(() => {
            console.log('[DougieCoachSimple] AudioContext resumed');
          });
        }
        
        console.log('[DougieCoachSimple] Audio analyzer setup complete');
      } catch (error) {
        console.error('[DougieCoachSimple] Audio analyzer setup failed:', error);
      }
      
      console.log('[DougieCoachSimple] Starting audio playback...');
      audioPlayerRef.current.play().then(() => {
        console.log('[DougieCoachSimple] Audio playback started successfully');
        console.log('[DougieCoachSimple] Audio duration:', audioPlayerRef.current.duration, 'current time:', audioPlayerRef.current.currentTime);
      }).catch((error) => {
        console.error('[DougieCoachSimple] Audio playback failed:', error);
      });
      
      audioPlayerRef.current.onended = () => {
        console.log('[DougieCoachSimple] Audio playback ended - duration:', audioPlayerRef.current.duration);
        isPlayingRef.current = false;
        URL.revokeObjectURL(audioUrl);
        playNextAudio(); // Play next in queue
      };
    } else {
      console.log('[DougieCoachSimple] Audio queue is empty');
    }
  };

  // Audio analysis setup - connect to speech analyser
  useEffect(() => {
    let frameCount = 0;
    
    // Audio data update loop - connects to the speech analyser
    const updateAudioData = () => {
      frameCount++;
      
      if (analyserRef.current && isSpeaking) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        audioDataRef.current = new Uint8Array(dataArray); // Create new array copy
        
        // Log every 30 frames when speaking
        if (frameCount % 30 === 0) {
          const avgEnergy = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
          console.log('[DougieCoachSimple] Audio data update - speaking:', isSpeaking, 'avgEnergy:', avgEnergy.toFixed(2), 'analyser connected:', !!analyserRef.current);
        }
      } else {
        // Silent when not speaking
        audioDataRef.current = new Uint8Array(128);
        
        // Log occasionally when not speaking
        if (frameCount % 60 === 0) {
          console.log('[DougieCoachSimple] Audio data update - speaking:', isSpeaking, 'setting silent data');
        }
      }
      requestAnimationFrame(updateAudioData);
    };

    updateAudioData();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isSpeaking]);

  // Connect handler - exact copy from CoachSession
  const handleConnect = async () => {
    if (!humeVoiceServiceRef.current) return;
    
    setLoading(true);
    setError(null);
    
    if (humeVoiceServiceRef.current) {
      const configId = DOUGIE_CONFIG.configId;
      console.log('[DougieCoachSimple] Connecting to HybridVoiceService...');
      humeVoiceServiceRef.current.connect(configId).then(() => {
        console.log('[DougieCoachSimple] Connected to Hume');
        setIsConnected(true);
        setLoading(false);
      }).catch((error: any) => {
        console.error('[DougieCoachSimple] Connection error:', error);
        setError(error instanceof Error ? error.message : 'Failed to connect to coach');
        setLoading(false);
      });
    }
  };

  const handleDisconnect = () => {
    if (humeVoiceServiceRef.current) {
      humeVoiceServiceRef.current.disconnect();
    }
    setIsConnected(false);
    setIsSpeaking(false);
    setCurrentAnimation('idle');
  };

  return (
    <div className="coach-session-container">
      <div className="avatar-display" style={{
        width: '100%',
        height: '600px',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        {isConnected && (
          <Canvas camera={{ position: [0, 0.8, 3], fov: 35 }}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[0, 1, 2]} intensity={1.2} />
            <Suspense fallback={null}>
              <PresenceAvatarMaleCoach
                avatarUrl={DOUGIE_CONFIG.avatarUrl}
                position={[0, -1.8, 0]}
                scale={1.3}
                animationName={currentAnimation}
                emotionalBlendshapes={emotionalBlendshapes}
                audioData={audioDataRef.current}
              />
            </Suspense>
          </Canvas>
        )}
        {!isConnected && (
          <div className="coach-preview" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'white'
          }}>
            <h2>Dougie - Speed Dating Coach</h2>
            <p>Ready to practice your dating conversations</p>
          </div>
        )}
      </div>
      
      <div className="session-controls" style={{ padding: '20px', textAlign: 'center' }}>
        {!isConnected ? (
          <button 
            onClick={handleConnect} 
            disabled={loading}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Connecting...' : 'Start Session'}
          </button>
        ) : (
          <button 
            onClick={handleDisconnect}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            End Session
          </button>
        )}
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </div>
    </div>
  );
};

export default DougieCoachSimple;
