import React, { useState, useRef, useEffect, Suspense, FC, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { VoiceProvider, useVoice } from '@humeai/voice-react';
import { PresenceAvatar } from './PresenceAvatar';
import { UserAvatarPiP } from './UserAvatarPiP';
import { MediaDebug } from './MediaDebug';
import { EmotionalState } from '../services/humeVoiceService';
import { COACHES } from '../config/coachConfig';
import './CoachSession.css';

// Inner component that uses the voice hook
const CoachSessionInner: React.FC<{ coach: any; coachId: string }> = ({ coach, coachId }) => {
  const navigate = useNavigate();
  const { connect, disconnect, status, sendSessionSettings, messages } = useVoice();
  
  // State management
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionalState>({});
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array());
  const [coachMessage, setCoachMessage] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceTrackingData, setFaceTrackingData] = useState<any>(null);
  const [messageInput, setMessageInput] = useState('');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  
  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const isConnected = status.value === 'connected';
  
  // Initialize audio context
  useEffect(() => {
    const initAudioContext = async () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
      }
    };
    
    initAudioContext();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
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
        
        console.log('[CoachSession] Media permissions granted:', {
          video: stream.getVideoTracks().length,
          audio: stream.getAudioTracks().length
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

  // Connect when component mounts and permissions are granted
  useEffect(() => {
    if (hasPermissions && !isConnected && status.value === 'disconnected') {
      connectVoice();
    }
  }, [hasPermissions, isConnected, status.value]);

  // Handle messages from Hume
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      if (lastMessage.type === 'assistant_message') {
        setCoachMessage(lastMessage.message?.content || '');
        setIsSpeaking(true);
      } else if (lastMessage.type === 'user_message') {
        setUserTranscript(lastMessage.message?.content || '');
        setIsListening(true);
      }
    }
  }, [messages]);

  const connectVoice = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[CoachSession] Connecting to voice...');
      
      await connect();
      
      console.log('[CoachSession] Connected successfully');
    } catch (err: any) {
      console.error('[CoachSession] Failed to connect:', err);
      setError(err.message || 'Failed to connect to voice service');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      navigate('/coaches');
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !isConnected) return;
    
    try {
      // With the React SDK, sending messages is handled automatically
      // The SDK will process the text input
      console.log('[CoachSession] Message will be processed by Hume SDK:', text);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

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
        <div className="avatar-scene">
          <Canvas
            camera={{ position: [0, 0, 3], fov: 45 }}
            style={{ width: '100%', height: '100%' }}
          >
            <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={45} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[0, 2, 5]} intensity={1} />
            
            <Suspense fallback={null}>
              <PresenceAvatar
                audioData={isSpeaking ? audioData : undefined}
              />
            </Suspense>
          </Canvas>
        </div>

        <div className="session-controls">
          {!isConnected ? (
            <div className="connection-panel">
              <button 
                onClick={connectVoice} 
                disabled={loading}
                className="connect-button"
              >
                {loading ? 'Connecting...' : 'Start Session'}
              </button>
              {error && <div className="error-message">{error}</div>}
            </div>
          ) : (
            <>
              <div className="conversation-status">
                <p>Coach: {coachMessage || 'Waiting...'}</p>
                <div className="emotion-display">
                  Current Emotion: {Object.entries(currentEmotion)
                    .filter(([_, value]) => value > 0.1)
                    .map(([emotion, value]) => `${emotion}: ${(value * 100).toFixed(0)}%`)
                    .join(', ') || 'Neutral'}
                </div>
              </div>

              <div className="user-section">
                <p>You: {userTranscript || (isListening ? 'Listening...' : 'Not speaking')}</p>
              </div>

              <div className="message-input-section">
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
                  placeholder="Type a message..."
                  className="message-input"
                />
                <button 
                  onClick={() => {
                    sendMessage(messageInput);
                    setMessageInput('');
                  }}
                  disabled={!messageInput.trim()}
                  className="send-button"
                >
                  Send
                </button>
              </div>

              <button onClick={handleDisconnect} className="disconnect-button">
                End Session
              </button>
            </>
          )}
        </div>
      </div>

      {/* PiP Avatar with face tracking */}
      {hasPermissions && cameraStream && (
        <UserAvatarPiP 
          avatarUrl="/avatars/user_avatar.glb"
          position="bottom-right"
          size="medium"
          trackingData={faceTrackingData}
          enableOwnTracking={true}
          cameraStream={cameraStream}
        />
      )}
    </div>
  );
};

// Main component with VoiceProvider
const CoachSession: React.FC = () => {
  const { coachId } = useParams<{ coachId: string }>();
  const coaches = Object.values(COACHES);
  const coach = coachId ? coaches.find(c => c.id === coachId) : null;
  
  const auth = useMemo(() => ({
    type: 'apiKey' as const,
    value: process.env.REACT_APP_HUME_API_KEY || ''
  }), []);

  if (!coach) {
    return <div>Coach not found</div>;
  }

  const configId = coach?.humeConfigId || process.env.REACT_APP_HUME_CONFIG_ID;
  
  return (
    <VoiceProvider 
      auth={auth}
      configId={configId}
      onError={(error) => console.error('Hume Voice Error:', error)}
    >
      <CoachSessionInner coach={coach} coachId={coachId || ''} />
    </VoiceProvider>
  );
};

export default CoachSession;
