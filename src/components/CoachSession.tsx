import React, { useState, useEffect, useRef, Suspense, FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { PresenceAvatar } from './PresenceAvatar';
import { UserAvatarPiP } from './UserAvatarPiP';
import humeVoiceService, { EmotionalState } from '../services/humeVoiceService';
import { COACHES } from '../config/coachConfig';
import './CoachSession.css';

const CoachSession: React.FC = () => {
  const { coachId } = useParams<{ coachId: string }>();
  const navigate = useNavigate();
  
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionalState>({});
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array());
  const [coachMessage, setCoachMessage] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceTrackingData, setFaceTrackingData] = useState<any>({ facialExpressions: { jawOpen: 0 } });
  const [messageInput, setMessageInput] = useState('');
  
  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const coach = COACHES[coachId as keyof typeof COACHES];
  
  useEffect(() => {
    if (!coach) {
      navigate('/training-hub');
      return;
    }

    // Initialize audio context
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
    }

    // Set up Hume callbacks
    humeVoiceService.setOnAudioCallback((audioBlob: Blob) => {
      playAudioWithAnalysis(audioBlob);
    });

    humeVoiceService.setOnEmotionCallback((emotions: EmotionalState) => {
      setCurrentEmotion(emotions);
    });

    humeVoiceService.setOnMessageCallback((message: any) => {
      // Extract assistant message from Hume message format
      if (message.type === 'assistant_message' && message.message?.content) {
        setCoachMessage(message.message.content);
      }
    });

    humeVoiceService.setOnUserMessageCallback((transcript: string) => {
      setUserTranscript(transcript);
    });

    humeVoiceService.setOnUserInterruptionCallback(() => {
      setIsSpeaking(false);
      setIsListening(true);
    });

    humeVoiceService.setOnErrorCallback((error: Error) => {
      console.error('[CoachSession] Hume error:', error);
      setError(error.message);
      setIsConnected(false);
    });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, [coach, navigate]);

  useEffect(() => {
    return () => {
      console.log('[CoachSession] Cleaning up on unmount');
      if (isConnected) {
        humeVoiceService.disconnect();
      }
      // Clean up audio analysis
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use coach-specific config ID if available, otherwise use default
      const configId = coach.humeConfigId || process.env.REACT_APP_HUME_CONFIG_ID;
      
      console.log('[CoachSession] Connecting with:', {
        coachName: coach.name,
        configId: configId,
        humeConfigIdFromCoach: coach.humeConfigId,
        envGrace: process.env.REACT_APP_HUME_CONFIG_ID_GRACE,
        envPosie: process.env.REACT_APP_HUME_CONFIG_ID_POSIE,
        envRizzo: process.env.REACT_APP_HUME_CONFIG_ID_RIZZO
      });
      
      await humeVoiceService.connect(configId);
      
      setIsConnected(true);
      console.log('[CoachSession] Connected to Hume voice service with config:', configId);
      
      // The Hume config should automatically start with the greeting
      // If you need to trigger it, you can send an empty message
      // setTimeout(() => {
      //   humeVoiceService.sendMessage('');
      // }, 1000);
      
    } catch (error) {
      console.error('[CoachSession] Connection error:', error);
      setError('Failed to connect to coach. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await humeVoiceService.disconnect();
      setIsConnected(false);
      setIsSpeaking(false);
      setIsListening(false);
    } catch (error) {
      console.error('[CoachSession] Disconnect error:', error);
    }
  };

  const playAudioWithAnalysis = async (audioBlob: Blob) => {
    try {
      // Stop any currently playing audio
      if (currentAudioRef.current) {
        console.log('[CoachSession] Stopping previous audio');
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      
      console.log('[CoachSession] Playing new audio blob, size:', audioBlob.size);
      
      audio.addEventListener('canplay', async () => {
        setIsSpeaking(true);
        await connectAudioToAnalyser(audio);
      });
      
      audio.addEventListener('ended', () => {
        console.log('[CoachSession] Audio ended');
        setIsSpeaking(false);
        setIsListening(true);
        URL.revokeObjectURL(audioUrl);
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
      });
      
      await audio.play();
    } catch (error) {
      console.error('[CoachSession] Error playing audio:', error);
      setIsSpeaking(false);
    }
  };

  const connectAudioToAnalyser = async (audio: HTMLAudioElement) => {
    if (!audioContextRef.current || !analyserRef.current) return;
    
    // Resume audio context if suspended
    if (audioContextRef.current.state === 'suspended') {
      console.log('[CoachSession] Resuming audio context...');
      await audioContextRef.current.resume();
    }
    
    const source = audioContextRef.current.createMediaElementSource(audio);
    source.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);
    
    console.log('[CoachSession] Audio connected:', {
      contextState: audioContextRef.current.state,
      analyserConnected: !!analyserRef.current,
      sourceConnected: !!source
    });
    
    const updateAudioData = () => {
      if (!analyserRef.current) return;
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Debug: Check if we're getting audio data
      const avgVolume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      if (avgVolume > 0) {
        console.log('[CoachSession] Audio data:', { avgVolume, isSpeaking, dataLength: dataArray.length });
      }
      
      setAudioData(dataArray);
      
      // Convert audio volume to mouth animation
      const normalizedVolume = Math.min(avgVolume / 128, 1); // Normalize to 0-1
      const jawOpen = normalizedVolume * 0.3; // Scale to reasonable jaw movement
      setFaceTrackingData({
        facialExpressions: {
          jawOpen: jawOpen,
          mouthOpen: jawOpen * 0.8
        }
      });
      
      if (isSpeaking) {
        animationFrameRef.current = requestAnimationFrame(updateAudioData);
      }
    };
    
    updateAudioData();
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || !isConnected) return;
    
    try {
      setUserTranscript(message);
      humeVoiceService.sendMessage(message);
    } catch (error) {
      console.error('[CoachSession] Error sending message:', error);
    }
  };

  if (!coach) {
    return null;
  }

  return (
    <div className="coach-session">
      <div className="coach-header">
        <button className="back-button" onClick={() => navigate('/training-hub')}>
          ← Back to Training Hub
        </button>
        <h1>Session with {coach.name}</h1>
        <div className="connection-status">
          {isConnected ? (
            <span className="status-connected">● Connected</span>
          ) : (
            <span className="status-disconnected">● Disconnected</span>
          )}
        </div>
      </div>

      <div className="coach-content">
        <div className="coach-avatar-scene" style={{
          backgroundImage: coach.venue ? `url(/venues/${coach.venue})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          zIndex: 1
        }}>
          <Canvas shadows camera={{ position: [0, 0, 2.5], fov: 35 }}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[0, 1, 2]} intensity={1.2} />
            
            <Suspense fallback={null}>
              <PresenceAvatar
                avatarUrl={coach.avatar}
                animationName={isSpeaking ? 'talking' : 'idle'}
                position={[0, -1.4, 0]}
                scale={1.0}
                audioData={isSpeaking ? audioData : undefined}
              />
            </Suspense>
          </Canvas>
        </div>

        <div className="coach-interaction">
          {!isConnected ? (
            <div className="connection-panel">
              <h2>Ready to start your session?</h2>
              <p>{coach.description}</p>
              <button 
                className="connect-button"
                onClick={handleConnect}
                disabled={loading}
              >
                {loading ? 'Connecting...' : 'Start Session'}
              </button>
              {error && <div className="error-message">{error}</div>}
            </div>
          ) : (
            <div className="conversation-panel">
              <div className="coach-message">
                <h3>{coach.name} says:</h3>
                <p>{coachMessage || "..."}</p>
              </div>
              
              <div className="emotion-display">
                <h4>Emotional Analysis</h4>
                <div className="emotion-bars">
                  {Object.entries(currentEmotion).map(([emotion, value]) => (
                    <div key={emotion} className="emotion-bar">
                      <span className="emotion-label">{emotion}</span>
                      <div className="emotion-progress">
                        <div 
                          className="emotion-fill"
                          style={{ width: `${(value || 0) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="user-input">
                <h4>Your response:</h4>
                <p>{userTranscript || (isListening ? "Listening..." : "...")}</p>
              </div>

              <div className="manual-input" style={{ marginTop: '20px' }}>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      sendMessage(messageInput);
                      setMessageInput('');
                    }
                  }}
                  placeholder="Type a message and press Enter"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ccc',
                    marginBottom: '10px'
                  }}
                />
                <button 
                  onClick={() => {
                    sendMessage(messageInput);
                    setMessageInput('');
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Send Message
                </button>
              </div>

              <div className="session-controls">
                <button 
                  className="end-session-button"
                  onClick={handleDisconnect}
                >
                  End Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* User Avatar PiP */}
      {isConnected && (
        <UserAvatarPiP 
          avatarUrl="/avatars/user_avatar.glb"
          position="top-right"
          size="medium"
        />
      )}
    </div>
  );
};

export default CoachSession;
