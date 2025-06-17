import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { HybridVoiceService } from '../services/hybridVoiceService';
import { PresenceAvatar } from './PresenceAvatar';
import { getCoachById } from '../config/coachConfig';
import { getHumeCoachConfig } from '../services/HumeCoachConfigurations';
import { MediaDebug } from './MediaDebug';
import { UserAvatarPiP } from './UserAvatarPiP';
import { EmotionalState } from '../services/humeVoiceService';
import { COACHES } from '../config/coachConfig';
import { mapEmotionsToBlendshapes } from '../utils/emotionMappings';
import EmergencyCredentialsInput from './EmergencyCredentialsInput';
import { getHumeCredentials } from '../services/humeCredentialsOverride';
import './CoachSession.css';

// Main component
const CoachSession: React.FC = () => {
  const { coachId = 'grace' } = useParams<{ coachId: string }>();
  const navigate = useNavigate();
  const coach = getCoachById(coachId);

  // Check WebGL support
  const [webGLSupported, setWebGLSupported] = useState(true);
  
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        console.warn('[CoachSession] WebGL not supported, using fallback');
        setWebGLSupported(false);
      }
    } catch (e) {
      console.warn('[CoachSession] WebGL detection failed, using fallback');
      setWebGLSupported(false);
    }
  }, []);

  // Get coach data
  const humeConfig = getHumeCoachConfig(coachId);
  
  // State management
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
  const [showEmergencyCredentialsInput, setShowEmergencyCredentialsInput] = useState(false);
  
  // Service refs
  const humeVoiceServiceRef = useRef<HybridVoiceService | null>(null);
  
  // Audio refs for lip sync
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(new Audio());
  const audioQueueRef = useRef<Blob[]>([]);
  const isPlayingRef = useRef(false);
  const audioSourceCreatedRef = useRef(false);
  
  // Initialize audio context
  useEffect(() => {
    // Audio element setup
    audioPlayerRef.current.onended = () => {
      console.log('[CoachSession] Audio ended, playing next');
      setIsSpeaking(false);
      setCurrentAnimation('idle');
      console.log('[CoachSession] Animation state set to: idle');
      setTimeout(() => playNextAudioFromQueue(), 100);
    };
    
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Get media permissions
  useEffect(() => {
    const getMediaPermissions = async () => {
      try {
        console.log('[CoachSession] Requesting camera and microphone permissions...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        // Set up face tracking
        stream.getVideoTracks().forEach(track => {
          track.addEventListener('ended', () => {
            console.log('[CoachSession] Video track ended');
          });
        });
        setCameraStream(stream);
        setHasPermissions(true);
      } catch (error) {
        console.error('[CoachSession] Error accessing media devices:', error);
        setError('Please allow camera and microphone access for the coach session');
      }
    };

    getMediaPermissions();

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Initialize HybridVoiceService
  useEffect(() => {
    const initHybridVoiceService = async () => {
      if (!humeVoiceServiceRef.current) {
        console.log('[CoachSession] Initializing HybridVoiceService...');
        humeVoiceServiceRef.current = new HybridVoiceService();
        
        // Set up callbacks for audio and messages
        humeVoiceServiceRef.current.onAudio((audioBlob: Blob) => {
          console.log('[CoachSession] Audio received:', audioBlob.size);
          setIsSpeaking(true);
          setCurrentAnimation('talking');
          console.log('[CoachSession] Animation state set to: talking');
          audioQueueRef.current.push(audioBlob);
          if (!isPlayingRef.current) {
            playNextAudioFromQueue();
          }
        });
        
        humeVoiceServiceRef.current.onMessage((message: any) => {
          console.log('[CoachSession] Message received:', message);
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
              // Convert scores object to array format expected by mapEmotionsToBlendshapes
              const emotionsArray = Object.entries(scores).map(([name, score]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
                score: score as number
              }));
              const blendshapes = mapEmotionsToBlendshapes(emotionsArray);
              setEmotionalBlendshapes(blendshapes);
            }
          }
        });
        
        humeVoiceServiceRef.current.onAssistantEnd(() => {
          console.log('[CoachSession] Assistant ended');
          setIsSpeaking(false);
          setCurrentAnimation('idle');
          console.log('[CoachSession] Animation state set to: idle');
        });
        
        humeVoiceServiceRef.current.onUserMessage((transcript: string) => {
          console.log('[CoachSession] User message:', transcript);
          setMessages(prev => [...prev, {
            role: 'user',
            content: transcript
          }]);
          setUserTranscript(transcript);
        });
        
        humeVoiceServiceRef.current.onError((error: Error) => {
          console.error('[CoachSession] Error:', error);
          setError(error.message);
        });
        
        console.log('[CoachSession] HybridVoiceService initialized successfully');
      }
    };
    
    initHybridVoiceService();
  }, []);

  // Handle connect
  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (humeVoiceServiceRef.current) {
        const configId = coach?.humeConfigId || process.env.REACT_APP_HUME_CONFIG_ID;
        console.log('[CoachSession] Connecting to HybridVoiceService...');
        humeVoiceServiceRef.current.connect(configId).then(() => {
          console.log('[CoachSession] Connected to Hume');
          setIsConnected(true);
          setLoading(false);
          
          // TEMPORARY TEST: Force talking animation after 2 seconds to test lip sync
          setTimeout(() => {
            console.log('[CoachSession] TEST: Forcing talking animation state');
            setCurrentAnimation('talking');
            setIsSpeaking(true);
            
            // Reset after 5 seconds
            setTimeout(() => {
              console.log('[CoachSession] TEST: Resetting to idle animation state');
              setCurrentAnimation('idle');
              setIsSpeaking(false);
            }, 5000);
          }, 2000);
        }).catch((error: any) => {
          console.error('[CoachSession] Connection error:', error);
          setError(error instanceof Error ? error.message : 'Failed to connect to coach');
        });
      }
    } catch (err) {
      console.error('[CoachSession] Connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to coach');
    } finally {
      setLoading(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    try {
      if (humeVoiceServiceRef.current) {
        await humeVoiceServiceRef.current.disconnect();
        setIsConnected(false);
        setMessages([]);
      }
    } catch (err) {
      console.error('[CoachSession] Disconnect error:', err);
    }
  };

  // Play next audio from queue
  const playNextAudioFromQueue = () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      setCurrentAnimation('idle');
      console.log('[CoachSession] Animation state set to: idle');
      return;
    }
    
    console.log('[CoachSession] Playing audio from queue, queue length:', audioQueueRef.current.length);
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
          console.log('[CoachSession] Created new AudioContext');
        }
        
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
          console.log('[CoachSession] Resumed AudioContext');
        }
        
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContextRef.current.createMediaElementSource(audioPlayerRef.current);
        source.connect(analyser);
        analyser.connect(audioContextRef.current.destination);
        
        analyserRef.current = analyser;
        audioSourceCreatedRef.current = true;
        console.log('[CoachSession] Audio analyzer setup complete');
      } catch (error) {
        console.error('[CoachSession] Error setting up audio analyzer:', error);
      }
    }
    
    audioPlayerRef.current.play()
      .then(() => {
        console.log('[CoachSession] Audio playing successfully');
        setIsSpeaking(true);
        setCurrentAnimation('talking');
        console.log('[CoachSession] Animation state set to: talking');
      })
      .catch(e => {
        console.error('[CoachSession] Error playing audio:', e);
        isPlayingRef.current = false;
        setIsSpeaking(false);
        setCurrentAnimation('idle');
        console.log('[CoachSession] Animation state set to: idle');
        setTimeout(() => playNextAudioFromQueue(), 100);
      });
    
    audioPlayerRef.current.onended = () => {
      console.log('[CoachSession] Audio playback ended');
      URL.revokeObjectURL(audioUrl);
      isPlayingRef.current = false;
      setIsSpeaking(false);
      setCurrentAnimation('idle');
      console.log('[CoachSession] Animation state set to: idle');
      // Play next audio if available
      setTimeout(() => playNextAudioFromQueue(), 100);
    };
  };

  // Audio analysis for lip sync
  useEffect(() => {
    if (!isSpeaking || !analyserRef.current) {
      setAudioData(new Uint8Array());
      return;
    }

    console.log('[CoachSession] Starting audio analysis for lip sync');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationId: number;
    let lastLogTime = 0;

    const updateAudioData = () => {
      analyser.getByteFrequencyData(dataArray);
      setAudioData(new Uint8Array(dataArray)); // Create a copy to trigger re-render
      
      // Log audio levels periodically for debugging
      const now = Date.now();
      if (now - lastLogTime > 1000) {
        const avgLevel = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
        console.log('[CoachSession] Audio analysis - Avg level:', avgLevel.toFixed(2), 'Max:', Math.max(...dataArray));
        lastLogTime = now;
      }
      
      animationId = requestAnimationFrame(updateAudioData);
    };

    updateAudioData();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      console.log('[CoachSession] Stopping audio analysis for lip sync');
      setAudioData(new Uint8Array()); // Clear audio data when not speaking
    };
  }, [isSpeaking]);

  // Handle send message
  const sendMessage = async (text: string) => {
    if (!text.trim() || !isConnected) return;
    
    try {
      if (humeVoiceServiceRef.current) {
        await humeVoiceServiceRef.current.sendMessage(text);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Check for credentials on mount
  useEffect(() => {
    const credentials = getHumeCredentials();
    if (!credentials.apiKey || !credentials.secretKey) {
      setShowEmergencyCredentialsInput(true);
      setError('Hume credentials not configured. Please use the emergency credentials form.');
    }
  }, []);

  return (
    <div className="coach-session">
      <MediaDebug />
      <div className="coach-header">
        <h1>Coach Session: {coach?.name || 'Unknown Coach'}</h1>
        <button onClick={() => navigate('/coaches')} className="back-button">
          Back to Coaches
        </button>
      </div>

      <div className="session-container">
        {showEmergencyCredentialsInput && (
          <EmergencyCredentialsInput />
        )}
        <div className="coach-avatar-scene" style={{ 
          backgroundColor: '#1a1a1a',
          backgroundImage: coach?.venue ? `url(/Venues/${coach.venue})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}>
          {isConnected && webGLSupported && (
            <Canvas camera={{ position: [0, 0.8, 3], fov: 35 }}>
              <ambientLight intensity={0.8} />
              <directionalLight position={[0, 1, 2]} intensity={1.2} />
              <Suspense fallback={null}>
                <PresenceAvatar
                  avatarUrl={coach?.avatar || '/avatars/coach_grace.glb'}
                  position={[0, -1.8, 0]}
                  scale={1.3}
                  animationName={currentAnimation}
                  emotionalBlendshapes={emotionalBlendshapes}
                  audioData={audioData}
                />
              </Suspense>
            </Canvas>
          )}
          
          {/* WebGL fallback - show 2D coach representation */}
          {isConnected && !webGLSupported && coach && (
            <div className="coach-fallback" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'white',
              textAlign: 'center',
              padding: '2rem'
            }}>
              <div style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                backgroundColor: coach.color || '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '4rem',
                marginBottom: '1rem',
                border: '4px solid rgba(255,255,255,0.2)'
              }}>
                {coach.name.charAt(0)}
              </div>
              <h2>{coach.name}</h2>
              <p style={{ fontSize: '1.1rem', opacity: 0.8 }}>
                {isSpeaking ? '🎤 Speaking...' : '👋 Ready to help'}
              </p>
              <p style={{ fontSize: '0.9rem', opacity: 0.6, marginTop: '1rem' }}>
                3D Avatar unavailable (WebGL not supported)
              </p>
            </div>
          )}
          
          {!isConnected && coach && (
            <div className="coach-preview" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'white',
              textAlign: 'center',
              padding: '2rem'
            }}>
              <h2>{coach.name}</h2>
              <p>{coach.description}</p>
              <p style={{ marginTop: '2rem', opacity: 0.8 }}>
                Click "Start Coach Session" to begin
              </p>
            </div>
          )}
        </div>
        
        {/* Debug indicator for speaking state */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            padding: '5px 10px',
            backgroundColor: isSpeaking ? '#4CAF50' : '#666',
            color: 'white',
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 1000
          }}>
            {isSpeaking ? '🎤 Speaking' : '🔇 Silent'}
          </div>
        )}

        <div className="session-controls">
          {!isConnected ? (
            <button 
              onClick={handleConnect}
              disabled={!hasPermissions || loading}
              className="control-button start-button"
            >
              {loading ? 'Connecting...' : 'Start Coach Session'}
            </button>
          ) : (
            <button 
              onClick={handleDisconnect}
              className="control-button end-button"
            >
              End Session (Stop Billing)
            </button>
          )}
          <div className="connection-status">
            Status: {isConnected ? '🟢 Connected (Using API Credits)' : '⚫ Disconnected'}
          </div>
        </div>
      </div>

      {/* PiP Avatar with face tracking */}
      {hasPermissions && cameraStream && (
        <UserAvatarPiP 
          avatarUrl="/avatars/user_avatar.glb"
          position="bottom-right"
          size="medium"
          enableOwnTracking={true}
          cameraStream={null} // Let PiP manage its own camera stream
        />
      )}
    </div>
  );
};

export default CoachSession;
