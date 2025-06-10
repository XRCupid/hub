import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { ConversationAvatar } from './ConversationAvatar';
import { UserAvatarPiP } from './UserAvatarPiP';
import humeVoiceService, { EmotionalState } from '../services/humeVoiceService';
import { COACHES } from '../config/coachConfig';
import './ImmersiveCoachCall.css';

const HumeCoachCall: React.FC = () => {
  const { coach } = useParams<{ coach: string }>();
  const navigate = useNavigate();
  
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionalState>({});
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(128));
  const [coachMessage, setCoachMessage] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [showInstructions, setShowInstructions] = useState(true);
  const [showPiP, setShowPiP] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioQueueRef = useRef<HTMLAudioElement[]>([]);
  const isPlayingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const config = COACHES[coach as keyof typeof COACHES];
  
  useEffect(() => {
    if (!config) {
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

    // CRITICAL: Clean up audio context on unmount
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [config]);

  useEffect(() => {
    // Connect to Hume
    connectToHume();

    // Start microphone for user input
    startMicrophone();

    return () => {
      humeVoiceService.disconnect();
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [config, navigate]);

  const connectToHume = async () => {
    try {
      setLoading(true);
      
      // Set up callbacks before connecting
      humeVoiceService.onEmotion((emotions) => {
        setCurrentEmotion(emotions);
        console.log('Detected emotions:', emotions);
      });
      
      humeVoiceService.onAudio(async (audioBlob) => {
        await playAudioBlob(audioBlob);
      });
      
      humeVoiceService.onMessage((message: any) => {
        // Extract the actual message content from the Hume message object
        const messageContent = typeof message === 'string' ? message : 
                              (message.message?.content || message.message || JSON.stringify(message));
        setCoachMessage(messageContent);
        console.log('Coach message:', messageContent);
      });
      
      // Connect with coachId
      await humeVoiceService.connect(coach);
      
      setIsConnected(true);
      
      // Send initial greeting with coach configuration
      const systemPrompt = `You are ${config.name}, a professional dating coach with the following characteristics:
Personality: ${config.personality}
Specialty: ${config.specialty.join(', ')}
Voice Style: ${config.voice.style}

Your teaching techniques include: ${config.techniques.join(', ')}

Start with this greeting: "${config.welcomeMessage}"

Important instructions:
- Keep responses conversational and under 3 sentences
- Match your personality trait (${config.personality})
- Use your voice style (${config.voice.style})
- Focus on your specialties when giving advice
- Be encouraging and supportive
- Respond empathetically based on the user's emotional state`;
      
      await humeVoiceService.sendMessage(systemPrompt);
      
    } catch (error) {
      console.error('Failed to connect to Hume:', error);
      // Fallback to OpenAI/ElevenLabs if needed
    } finally {
      setLoading(false);
    }
  };

  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up media recorder for continuous audio capture
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          audioChunksRef.current = [];
          
          // Send audio to Hume
          if (isConnected && !isSpeaking) {
            setIsListening(false);
            await humeVoiceService.sendAudio(audioBlob);
          }
        }
      };

      // Start recording in chunks
      startListening();
      
    } catch (error) {
      console.error('Microphone access denied:', error);
    }
  };

  const startListening = () => {
    if (mediaRecorderRef.current && !isListening && !isSpeaking) {
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsListening(true);
      
      // Stop recording after 5 seconds of audio
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
          
          // Restart listening after a brief pause
          setTimeout(startListening, 500);
        }
      }, 5000);
    }
  };

  const playAudioBlob = async (audioBlob: Blob) => {
    setIsSpeaking(true);
    setIsListening(false);
    
    // Stop any ongoing recording
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    // Connect to analyser for lip sync
    if (audioContextRef.current && analyserRef.current) {
      const source = audioContextRef.current.createMediaElementSource(audio);
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    }

    audioQueueRef.current.push(audio);
    
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      audioQueueRef.current = audioQueueRef.current.filter(a => a !== audio);
      
      if (audioQueueRef.current.length === 0) {
        setIsSpeaking(false);
        // Resume listening
        setTimeout(startListening, 500);
      }
    };

    await audio.play();
  };

  // Update audio data for lip sync
  useEffect(() => {
    const updateAudioData = () => {
      if (analyserRef.current && isSpeaking) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        setAudioData(new Uint8Array(dataArray));
      }
      requestAnimationFrame(updateAudioData);
    };
    updateAudioData();
  }, [isSpeaking]);

  const getEmotionBasedLighting = () => {
    const { joy = 0, sadness = 0, anger = 0 } = currentEmotion;
    
    if (joy > 0.5) {
      return { color: '#fff5e6', intensity: 0.9 }; // Warm, bright
    } else if (sadness > 0.5) {
      return { color: '#e6f0ff', intensity: 0.6 }; // Cool, dim
    } else if (anger > 0.5) {
      return { color: '#ffe6e6', intensity: 0.8 }; // Reddish
    }
    
    return { color: '#ffffff', intensity: 0.7 }; // Neutral
  };

  const getBackground = () => {
    const colors: { [key: string]: string } = {
      grace: 'radial-gradient(ellipse at center, #1e1e1e 0%, #2a1f2e 100%)',
      posie: 'radial-gradient(ellipse at center, #1e1e1e 0%, #2d1f2a 100%)',
      rizzo: 'radial-gradient(ellipse at center, #1e1e1e 0%, #2f1f1f 100%)'
    };
    return colors[coach as string] || colors.grace;
  };

  const lighting = getEmotionBasedLighting();

  return (
    <div className="immersive-coach-call" style={{ background: getBackground() }}>
      {/* User Avatar PiP */}
      {showPiP && (
        <UserAvatarPiP
          onClose={() => setShowPiP(false)}
          position="bottom-right"
          size="medium"
        />
      )}
      
      <div className="coach-header">
        <button className="back-button" onClick={() => navigate('/sample-lessons')}>
          ← Back to Lessons
        </button>
        <div className="coach-info">
          <h3>{config.name} - Emotional AI Coach</h3>
          <div className="voice-style">
            Voice: {config.voice.style}
          </div>
          <p className="coach-subtitle">{config.specialty[0]} Expert</p>
        </div>
        <div className="connection-status">
          {isConnected ? (
            <span className="status-connected">● Connected to Hume AI</span>
          ) : (
            <span className="status-connecting">○ Connecting...</span>
          )}
        </div>
        <button 
          className="pip-toggle"
          onClick={() => setShowPiP(!showPiP)}
          title={showPiP ? "Hide Avatar" : "Show Avatar"}
        >
          {showPiP ? '👤' : '👥'}
        </button>
      </div>

      <div className="main-content">
        <div className="avatar-section">
          <Canvas 
            camera={{ position: [0, 1.0, 3.5], fov: 35 }}
            className="coach-canvas"
          >
            <ambientLight intensity={0.5 * lighting.intensity} color={lighting.color} />
            <directionalLight 
              position={[5, 5, 5]} 
              intensity={0.5 * lighting.intensity} 
              color={lighting.color}
            />
            <directionalLight 
              position={[-5, 3, -5]} 
              intensity={0.3 * lighting.intensity} 
              color={lighting.color}
            />
            
            <ConversationAvatar
              avatarUrl={config.avatar}
              position={[0, 0, 0]}
              scale={1}
              isSpeaking={isSpeaking}
              audioData={audioData}
              audioContext={audioContextRef.current}
            />
            
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              minPolarAngle={Math.PI / 2.5}
              maxPolarAngle={Math.PI / 1.8}
              target={[0, 0.8, 0]}
            />
            
            <Environment preset="city" />
          </Canvas>

          {showInstructions && (
            <div className="camera-instructions">
              <button 
                className="close-button" 
                onClick={() => setShowInstructions(false)}
                aria-label="Close instructions"
              >
                ×
              </button>
              <h4>Camera Controls</h4>
              <ul>
                <li>🖱️ Left click + drag: Rotate view</li>
                <li>🖱️ Right click + drag: Pan camera</li>
                <li>🖱️ Scroll: Zoom in/out</li>
                <li>🖱️ Double click: Reset view</li>
              </ul>
            </div>
          )}
        </div>

        <div className="conversation-panel">
          <div className="emotion-display">
            <h4>Detected Emotions</h4>
            <div className="emotion-bars">
              {Object.entries(currentEmotion).map(([emotion, value]) => (
                <div key={emotion} className="emotion-bar">
                  <span className="emotion-label">{emotion}</span>
                  <div className="emotion-value">
                    <div 
                      className="emotion-fill" 
                      style={{ width: `${(value || 0) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="conversation-content">
            {coachMessage && (
              <div className="coach-message">
                <strong>{config.name}:</strong> {coachMessage}
              </div>
            )}
            
            {userTranscript && (
              <div className="user-message">
                <strong>You:</strong> {userTranscript}
              </div>
            )}
          </div>

          <div className="conversation-controls">
            <div className={`status-indicator ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}>
              {isSpeaking ? '🔊 Coach is speaking...' : isListening ? '🎤 Listening...' : '🔇 Ready'}
            </div>
            
            <button 
              className="push-to-talk"
              onMouseDown={startListening}
              disabled={!isConnected || isSpeaking}
            >
              {isListening ? 'Recording...' : 'Hold to Speak'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HumeCoachCall;
