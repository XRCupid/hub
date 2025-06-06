import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { ConvaiVoiceService, EmotionalState } from '../services/convaiVoiceService';
import { PresenceAvatar } from './PresenceAvatar';
import { TrackingData, FacialExpressions } from '../types/tracking';
import { getCoachById } from '../config/coachConfig';
import { getConvaiCoachConfig } from '../services/ConvaiCoachConfigurations';
import { ML5FaceMeshService } from '../services/ML5FaceMeshService';
import { CombinedFaceTrackingService } from '../services/CombinedFaceTrackingService';
import { mapEmotionsToBlendshapes } from '../utils/emotionMappings';
import * as THREE from 'three';
import { SafeVisualEffects } from './SafeVisualEffects';
import './EnhancedCoachSession.css';

const EnhancedCoachSessionConvai: React.FC = () => {
  const { coachId = 'alex', lessonId = 'confidence' } = useParams<{ coachId: string; lessonId: string }>();
  const navigate = useNavigate();

  const coach = getCoachById(coachId || "");
  const convaiConfig = getConvaiCoachConfig(coachId || "");
  
  // Mock lesson data to prevent blank page
  const lessons: any[] = [
    {
      id: lessonId || 'grace-intro',
      title: 'Coaching Session',
      duration: '15 min',
      description: 'Interactive coaching session',
      objectives: ['Practice conversation skills'],
      exercises: [
        {
          type: 'practice',
          prompt: 'Let\'s have a conversation to improve your skills',
          duration: 600,
          successCriteria: ['Engagement', 'Clear communication']
        }
      ]
    }
  ];
  
  const currentLesson = lessons.find((l: any) => l.id === lessonId) || lessons[0];
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const currentExercise = currentLesson?.exercises[currentExerciseIndex];

  // State variables
  const [feedback, setFeedback] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false); // For AI coach speaking
  const [currentAnimation, setCurrentAnimation] = useState<string>('idle');
  const [emotionalState, setEmotionalState] = useState<EmotionalState>({});
  const [convaiConnected, setConvaiConnected] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [userMessage, setUserMessage] = useState<string>('');
  const [assistantMessage, setAssistantMessage] = useState<string>('');
  const [trackingData, setTrackingData] = useState<TrackingData | undefined>(undefined);
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [micPermission, setMicPermission] = useState<boolean>(false);
  const [blendshapes, setBlendshapes] = useState<Record<string, number>>({});
  const [showConnectionButton, setShowConnectionButton] = useState(true);

  // Refs
  const convaiServiceRef = useRef<ConvaiVoiceService | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const ml5ServiceRef = useRef<ML5FaceMeshService | null>(null);
  const combinedServiceRef = useRef<CombinedFaceTrackingService | null>(null);
  const trackingIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize Convai service
  useEffect(() => {
    convaiServiceRef.current = new ConvaiVoiceService();
    
    // Set up callbacks
    convaiServiceRef.current.setOnAudioCallback((audioBlob: Blob) => {
      console.log('[EnhancedCoachSessionConvai] Received audio from Convai');
      playAudioWithAnalysis(audioBlob);
    });

    convaiServiceRef.current.setOnMessageCallback((message: string) => {
      console.log('[EnhancedCoachSessionConvai] Assistant message:', message);
      setAssistantMessage(message);
      setFeedback(prev => [...prev, `Coach: ${message}`]);
    });

    convaiServiceRef.current.setOnEmotionCallback((emotions: EmotionalState) => {
      console.log('[EnhancedCoachSessionConvai] Received emotions:', emotions);
      setEmotionalState(emotions);
      
      // Convert emotions to blendshapes for avatar
      // If emotions is a string (single emotion), convert to array format
      const emotionArray = typeof emotions === 'string' 
        ? [{ name: emotions, score: 1.0 }]
        : Array.isArray(emotions) 
          ? emotions 
          : [];
      const newBlendshapes = mapEmotionsToBlendshapes(emotionArray);
      setBlendshapes(newBlendshapes);
    });

    convaiServiceRef.current.setOnUserMessageCallback((transcript: string) => {
      console.log('[EnhancedCoachSessionConvai] User transcript:', transcript);
      setUserMessage(transcript);
      setFeedback(prev => [...prev, `You: ${transcript}`]);
    });

    convaiServiceRef.current.setOnUserInterruptionCallback(() => {
      console.log('[EnhancedCoachSessionConvai] User interruption detected');
      handleInterruption();
    });

    convaiServiceRef.current.setOnErrorCallback((error: Error) => {
      console.error('[EnhancedCoachSessionConvai] Error:', error);
      setFeedback(prev => [...prev, `Error: ${error.message}`]);
    });

    return () => {
      if (convaiServiceRef.current) {
        convaiServiceRef.current.disconnect();
      }
    };
  }, []);

  // Connect to Convai
  const connectToConvai = async () => {
    try {
      console.log('[EnhancedCoachSessionConvai] Connecting to Convai...');
      if (convaiServiceRef.current) {
        await convaiServiceRef.current.connect(convaiConfig.characterId);
        setConvaiConnected(true);
        setShowConnectionButton(false);
        setFeedback(prev => [...prev, 'Connected to Convai successfully']);
        
        // Send initial system prompt
        if (convaiConfig.systemPrompt) {
          await convaiServiceRef.current.sendUserInput(convaiConfig.systemPrompt);
        }
      }
    } catch (error) {
      console.error('[EnhancedCoachSessionConvai] Failed to connect:', error);
      setFeedback(prev => [...prev, `Failed to connect: ${error}`]);
    }
  };

  // Initialize face tracking
  useEffect(() => {
    const initializeTracking = async () => {
      try {
        ml5ServiceRef.current = new ML5FaceMeshService();
        combinedServiceRef.current = new CombinedFaceTrackingService();
        
        await ml5ServiceRef.current.initialize();
        
        // Start tracking interval
        trackingIntervalRef.current = setInterval(() => {
          if (ml5ServiceRef.current && combinedServiceRef.current) {
            const expressions = ml5ServiceRef.current.getExpressions();
            const headRotation = ml5ServiceRef.current.getHeadRotation();
            const landmarks = ml5ServiceRef.current.getLandmarks();
            
            if (expressions && headRotation) {
              const combined = combinedServiceRef.current.getExpressions();
              setTrackingData({
                expressions: combined as unknown as Record<string, number>,
                headRotation,
                landmarks: landmarks || []
              });
            }
          }
        }, 50);
        
      } catch (error) {
        console.error('[EnhancedCoachSessionConvai] Failed to initialize tracking:', error);
      }
    };

    initializeTracking();

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
      if (ml5ServiceRef.current) {
        ml5ServiceRef.current.stopTracking();
      }
    };
  }, []);

  // Request microphone permission
  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission(true);
      return true;
    } catch (error) {
      console.error('[EnhancedCoachSessionConvai] Microphone permission denied:', error);
      setMicPermission(false);
      return false;
    }
  };

  // Start recording
  const startRecording = async () => {
    if (!convaiConnected || !convaiServiceRef.current) {
      console.warn('[EnhancedCoachSessionConvai] Not connected to Convai');
      return;
    }

    const hasPermission = micPermission || await requestMicPermission();
    if (!hasPermission) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      // Create MediaRecorder for continuous streaming
      const mimeType = 'audio/webm;codecs=opus';
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0 && convaiServiceRef.current) {
          // Send audio chunk directly to Convai
          await convaiServiceRef.current.sendAudioInput(event.data);
        }
      };

      mediaRecorderRef.current.start(100); // Send chunks every 100ms
      setIsRecording(true);
      setIsListening(true);
      console.log('[EnhancedCoachSessionConvai] Started recording');
    } catch (error) {
      console.error('[EnhancedCoachSessionConvai] Failed to start recording:', error);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setIsListening(false);
      console.log('[EnhancedCoachSessionConvai] Stopped recording');
    }
  };

  // Play audio with analysis
  const playAudioWithAnalysis = async (audioBlob: Blob) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;

      if (!analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
      }

      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);

      source.onended = () => {
        setIsSpeaking(false);
        setCurrentAnimation('idle');
      };

      setIsSpeaking(true);
      setCurrentAnimation('talk');
      source.start(0);

      // Update audio data for lip sync
      const updateAudioData = () => {
        if (analyserRef.current && isSpeaking) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          setAudioData(dataArray);
          animationFrameRef.current = requestAnimationFrame(updateAudioData);
        }
      };
      updateAudioData();
    } catch (error) {
      console.error('[EnhancedCoachSessionConvai] Error playing audio:', error);
    }
  };

  // Handle interruption
  const handleInterruption = () => {
    if (convaiServiceRef.current && convaiConnected) {
      convaiServiceRef.current.pauseAssistant();
      setIsSpeaking(false);
      setCurrentAnimation('idle');
    }
  };

  // Send text message
  const sendTextMessage = async () => {
    if (userMessage.trim() && convaiServiceRef.current && convaiConnected) {
      await convaiServiceRef.current.sendUserInput(userMessage);
      setUserMessage('');
    }
  };

  // Cleanup animation frame
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Handle window focus/blur
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRecording) {
        stopRecording();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRecording]);

  if (!coach) {
    return <div>Coach not found</div>;
  }

  return (
    <div className="enhanced-coach-session">
      <div className="session-header">
        <button onClick={() => navigate(-1)} className="back-button">← Back</button>
        <h1>{coach.name} - {currentLesson?.title || 'Coaching Session'}</h1>
        <div className="connection-status">
          <span className={`status-indicator ${convaiConnected ? 'connected' : 'disconnected'}`}>
            Convai {convaiConnected ? '✅' : '❌'}
          </span>
          <span className={`status-indicator ${micPermission ? 'connected' : 'disconnected'}`}>
            Mic {micPermission ? '🎤' : '🔇'}
          </span>
          <span className={`status-indicator ${isSpeaking ? 'active' : 'inactive'}`}>
            {isSpeaking ? '🔊 Speaking' : '🔈 Silent'}
          </span>
        </div>
      </div>

      <div className="session-content">
        <div className="coach-avatar-section">
          <div ref={canvasRef} className="avatar-canvas">
            <Canvas
              camera={{ position: [0, 0, 2], fov: 45 }}
              style={{ background: 'transparent' }}
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <PresenceAvatar
                avatarUrl={`/avatars/${coach.avatar}`}
                trackingData={trackingData}
                emotionalBlendshapes={blendshapes}
                audioData={audioData || new Uint8Array()}
              />
              <SafeVisualEffects />
            </Canvas>
          </div>
          
          <div className="emotional-state-panel">
            <h3>Emotional State</h3>
            <div className="emotion-bars">
              {Object.entries(emotionalState).map(([emotion, value]) => (
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
        </div>

        <div className="interaction-section">
          <div className="exercise-panel">
            <h2>{currentExercise?.type === 'practice' ? 'Practice Exercise' : 'Exercise'}</h2>
            <p className="exercise-prompt">{currentExercise?.prompt}</p>
            
            <div className="controls">
              {showConnectionButton && !convaiConnected && (
                <button onClick={connectToConvai} className="connect-button">
                  Connect to Convai
                </button>
              )}
              
              {convaiConnected && (
                <>
                  <button 
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`record-button ${isRecording ? 'recording' : ''}`}
                  >
                    {isRecording ? '⏹️ Stop Recording' : '🎤 Start Recording'}
                  </button>
                  
                  <div className="text-input-section">
                    <input
                      type="text"
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
                      placeholder="Type a message..."
                      className="text-input"
                    />
                    <button onClick={sendTextMessage} className="send-button">
                      Send
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="feedback-panel">
            <h3>Conversation</h3>
            <div className="feedback-list">
              {feedback.map((item, index) => (
                <div key={index} className="feedback-item">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCoachSessionConvai;
