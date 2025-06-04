import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { HumeVoiceService, EmotionalState } from '../services/humeVoiceService';
import { PresenceAvatar } from './PresenceAvatar';
import { TrackingData, FacialExpressions } from '../types/tracking';
import { getCoachById } from '../config/coachConfig';
import { getHumeCoachConfig } from '../services/HumeCoachConfigurations';
import { ML5FaceMeshService } from '../services/ML5FaceMeshService';
import { mapEmotionsToBlendshapes } from '../utils/emotionMappings';
import * as THREE from 'three';
import { getBrowserSupportedMimeType, MimeType } from 'hume';
import './EnhancedCoachSession.css';

const EnhancedCoachSession: React.FC = () => {
  const { coachId = 'alex', lessonId = 'confidence' } = useParams<{ coachId: string; lessonId: string }>();
  const navigate = useNavigate();

  const coach = getCoachById(coachId || "");
  const humeConfig = getHumeCoachConfig(coachId || "");
  
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

  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [exerciseActive, setExerciseActive] = useState(false);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [emotionalState, setEmotionalState] = useState<EmotionalState>({});
  const [showPiP, setShowPiP] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [userInput, setUserInput] = useState('');
  const [humeConnected, setHumeConnected] = useState(false);
  const [microphoneReady, setMicrophoneReady] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioData, setAudioData] = useState(new Uint8Array());
  const [prosodyBlendshapes, setProsodyBlendshapes] = useState<any>({});
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{speaker: string, text: string, timestamp: number}>>([]);
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [error, setError] = useState<string>('');
  const [isMicrophoneSetup, setIsMicrophoneSetup] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState('idle');
  const [showSettings, setShowSettings] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [lastTranscript, setLastTranscript] = useState('');
  const [blendShapes, setBlendShapes] = useState<any>({});
  const [isStreaming, setIsStreaming] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const humeVoiceServiceRef = useRef<HumeVoiceService | null>(null);
  const audioLevelRef = useRef<number>(0);
  const selectedMimeTypeRef = useRef<string>('audio/webm');
  const micStreamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef<boolean>(false); // Add lock to prevent concurrent recordings
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const vadThreshold = 0.02; // Voice activity detection threshold
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  const realtimeRecorderRef = useRef<MediaRecorder | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Helper to convert emotion values to proper format for mapEmotionsToBlendshapes
  const prosodyToBlendshapes = (emotionalValues: Record<string, number>): Record<string, number> => {
    const blendshapes: Record<string, number> = {};
    
    // Emotion-to-blendshape mapping with amplification
    const emotionMapping: Record<string, { shape: string; multiplier: number }[]> = {
      joy: [
        { shape: 'mouthSmileLeft', multiplier: 0.8 },
        { shape: 'mouthSmileRight', multiplier: 0.8 },
        { shape: 'cheekSquintLeft', multiplier: 0.4 },
        { shape: 'cheekSquintRight', multiplier: 0.4 },
      ],
      surprise: [
        { shape: 'eyeWideLeft', multiplier: 0.7 },
        { shape: 'eyeWideRight', multiplier: 0.7 },
        { shape: 'jawOpen', multiplier: 0.3 },
        { shape: 'browInnerUp', multiplier: 0.6 },
      ],
      sadness: [
        { shape: 'mouthFrownLeft', multiplier: 0.6 },
        { shape: 'mouthFrownRight', multiplier: 0.6 },
        { shape: 'browInnerUp', multiplier: 0.3 },
        { shape: 'eyeSquintLeft', multiplier: 0.2 },
        { shape: 'eyeSquintRight', multiplier: 0.2 },
      ],
      anger: [
        { shape: 'browDownLeft', multiplier: 0.7 },
        { shape: 'browDownRight', multiplier: 0.7 },
        { shape: 'eyeSquintLeft', multiplier: 0.4 },
        { shape: 'eyeSquintRight', multiplier: 0.4 },
        { shape: 'jawForward', multiplier: 0.3 },
      ],
      fear: [
        { shape: 'eyeWideLeft', multiplier: 0.6 },
        { shape: 'eyeWideRight', multiplier: 0.6 },
        { shape: 'browInnerUp', multiplier: 0.5 },
        { shape: 'mouthOpen', multiplier: 0.3 },
      ],
      disgust: [
        { shape: 'noseSneerLeft', multiplier: 0.6 },
        { shape: 'noseSneerRight', multiplier: 0.6 },
        { shape: 'mouthUpperUpLeft', multiplier: 0.4 },
        { shape: 'mouthUpperUpRight', multiplier: 0.4 },
      ],
      contempt: [
        { shape: 'mouthLeft', multiplier: 0.5 },
        { shape: 'mouthSmirkLeft', multiplier: 0.6 },
        { shape: 'eyeSquintLeft', multiplier: 0.3 },
      ],
    };

    // Apply emotion mappings
    Object.entries(emotionalValues).forEach(([emotion, value]) => {
      const mappings = emotionMapping[emotion];
      if (mappings && value > 0) {
        mappings.forEach(({ shape, multiplier }) => {
          blendshapes[shape] = Math.min(1, (blendshapes[shape] || 0) + value * multiplier * 1.5);
        });
      }
    });

    return blendshapes;
  };

  // Face tracking for ML5 PresenceAvatar
  const ml5FaceMeshServiceRef = useRef<ML5FaceMeshService | null>(null);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Audio queue for Hume EVI (as per official docs)
  const audioQueueRef = useRef<Blob[]>([]);
  const isPlayingRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Single initialization effect
  useEffect(() => {
    const initialize = async () => {
      console.log('%%%%%%%%%%%%%%%%%%%% [EnhancedCoachSession] INITIALIZE FUNCTION CALLED %%%%%%%%%%%%%%%%%%%%');
      console.log('[EnhancedCoachSession] Starting full initialization...');
      
      // Initialize audio context
      initializeAudioContext();
      
      // Initialize Face Tracking FIRST
      console.log('%%%%%%%%%%%%%%%%%%%% [EnhancedCoachSession] ATTEMPTING FACE TRACKING INIT %%%%%%%%%%%%%%%%%%%%');
      try {
        console.log('[EnhancedCoachSession] Initializing ML5 face tracking...');
        
        // Create video element for face tracking
        const video = document.createElement('video');
        video.width = 640;
        video.height = 480;
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.style.position = 'absolute';
        video.style.top = '-9999px';
        video.style.left = '-9999px';
        document.body.appendChild(video);
        
        // Get webcam stream
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
          video.onloadedmetadata = () => resolve(null);
          video.oncanplay = async () => {
            try {
              await video.play();
              console.log('[EnhancedCoachSession] video.play() called successfully.');
            } catch (playError) {
              console.error('[EnhancedCoachSession] Error calling video.play():', playError);
            }
          };
        });
        
        ml5FaceMeshServiceRef.current = new ML5FaceMeshService();
        await ml5FaceMeshServiceRef.current.initialize();

        console.log(`[EnhancedCoachSession] Video paused state before startTracking: ${video.paused}`);
        console.log('!!!!!!!!!!!!!!!!!!!! [EnhancedCoachSession] ABOUT TO CALL startTracking (ML5FaceMeshService) !!!!!!!!!!!!!!!!!!!!');
        console.log('[EnhancedCoachSession] video element for ML5:', video);
        if (video) {
            console.log(`[EnhancedCoachSession] video properties: id=${video.id}, width=${video.width}, height=${video.height}, autoplay=${video.autoplay}, playsInline=${video.playsInline}, muted=${video.muted}, readyState=${video.readyState}, paused=${video.paused}, srcObject set: ${!!video.srcObject}`);
            if (video.srcObject) {
                const tracks = (video.srcObject as MediaStream).getVideoTracks();
                console.log(`[EnhancedCoachSession] video srcObject tracks: ${tracks.length} tracks. First track enabled: ${tracks.length > 0 ? tracks[0].enabled : 'N/A'}, readyState: ${tracks.length > 0 ? tracks[0].readyState : 'N/A'}`);
            }
        }
        console.log('[EnhancedCoachSession] ml5FaceMeshServiceRef.current instance:', ml5FaceMeshServiceRef.current);

        await ml5FaceMeshServiceRef.current.startTracking(video);
        
        // Set up polling for tracking data
        const trackingInterval = setInterval(() => {
          if (ml5FaceMeshServiceRef.current) {
            const expressions = ml5FaceMeshServiceRef.current.getExpressions();
            const headRotation = ml5FaceMeshServiceRef.current.getHeadRotation();
            const landmarks = ml5FaceMeshServiceRef.current.getLandmarks();
            
            setTrackingData({
              facialExpressions: expressions, // Use the correct field name from TrackingData interface
              headRotation,
              landmarks,
              source: 'ml5' // Set the source of the tracking data
            });
          }
        }, 1000 / 30); // 30 FPS
        
        trackingIntervalRef.current = trackingInterval;
        
        console.log('[EnhancedCoachSession] Face tracking polling started successfully.');
      } catch (error) {
        console.error('!!!!!!!!!!!!!!!!!!!! [EnhancedCoachSession] CAUGHT ERROR during face tracking setup !!!!!!!!!!!!!!!!!!!!', error);
        // console.error('[EnhancedCoachSession] Failed to start face tracking:', error); // Original log commented out for clarity, can be re-enabled
      }
      
      // Auto-connect to Hume
      await connectToHume();
      
      // Then set up microphone
      await setupMicrophone();
    };

    initialize();
    
    return () => {
      // Cleanup on unmount
      console.log('[EnhancedCoachSession] Cleaning up...');
      
      // Stop real-time streaming if active
      if (realtimeRecorderRef.current && realtimeRecorderRef.current.state !== 'inactive') {
        console.log('[EnhancedCoachSession] Stopping real-time recorder...');
        realtimeRecorderRef.current.stop();
      }
      
      // Stop face tracking
      if (ml5FaceMeshServiceRef.current) {
        console.log('[EnhancedCoachSession] Stopping face tracking...');
        ml5FaceMeshServiceRef.current.stopTracking();
        ml5FaceMeshServiceRef.current = null;
      }
      
      // Clear tracking interval
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
      
      // Disconnect Hume
      if (humeVoiceServiceRef.current) {
        console.log('[EnhancedCoachSession] Disconnecting from Hume...');
        humeVoiceServiceRef.current.disconnect();
      }
      
      // Stop microphone
      if (micStreamRef.current) {
        console.log('[EnhancedCoachSession] Stopping microphone...');
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Stop any playing audio
      if (currentAudioRef.current) {
        console.log('[EnhancedCoachSession] Stopping audio playback...');
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      
      // Close audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        console.log('[EnhancedCoachSession] Closing audio context...');
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    // Set up callbacks
    if (humeVoiceServiceRef.current) {
      humeVoiceServiceRef.current.onMessage((message: string) => {
        setFeedback(prev => [...prev, `🤖 ${message}`]);
      });

      humeVoiceServiceRef.current.onAssistantEnd(() => {
        setIsSpeaking(false);
      });

      humeVoiceServiceRef.current.onUserMessage((transcript: string) => {
        setFeedback(prev => [...prev, `👤 ${transcript}`]);
      });

      humeVoiceServiceRef.current.onUserInterruption(() => {
        console.log('[EnhancedCoachSession] User interrupted assistant');
      });

      humeVoiceServiceRef.current.onEmotion((emotionData: EmotionalState) => {
        console.log('[EnhancedCoachSession] Received emotion data:', emotionData);
        setEmotionalState(emotionData);
      });

      humeVoiceServiceRef.current.onError((error: Error) => {
        console.error('[EnhancedCoachSession] Hume error:', error);
        setError(error.message);
        if (error.message.includes('too many active chats')) {
          setHumeConnected(false);
        }
      });

      humeVoiceServiceRef.current.onAudio(playAudioWithAnalysis);
    }

    // Clean up on unmount or page unload
    const handleBeforeUnload = () => {
      console.log('[EnhancedCoachSession] Page unloading, disconnecting Hume...');
      if (humeVoiceServiceRef.current) {
        humeVoiceServiceRef.current.disconnect();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    // Check if we're getting emotions from Hume
    const checkEmotions = setTimeout(() => {
      if (Object.keys(emotionalState).length === 0 && humeConnected) {
        console.log('[EnhancedCoachSession] No emotions received, using default state');
        setEmotionalState({
          joy: 0.5,
          surprise: 0.1,
          sadness: 0.1,
          anger: 0.0,
          fear: 0.0,
          disgust: 0.0,
          contempt: 0.0
        });
      }
    }, 3000);
    
    return () => clearTimeout(checkEmotions);
  }, [humeConnected]);

  useEffect(() => {
    console.log('[EnhancedCoachSession] Listening conditions check:', {
      humeConnected,
      isSpeaking,
      microphoneReady,
      isListening,
      mediaRecorder: !!mediaRecorderRef.current
    });
    
    // Don't auto-start listening - let user control it
    // This prevents race conditions
  }, [humeConnected, isSpeaking, microphoneReady, isListening]);

  useEffect(() => {
    console.log('isSpeaking state changed to:', isSpeaking);
  }, [isSpeaking]);

  useEffect(() => {
    if (!audioContextRef.current) {
      initializeAudioContext();
    }
  }, []);

  useEffect(() => {
    let frameCount = 0;
    const updateAudioData = () => {
      if (analyserRef.current && isSpeaking) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Debug audio data
        if (frameCount % 60 === 0) { // Log every second
          const maxValue = Math.max(...dataArray);
          const avgValue = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          console.log('[EnhancedCoachSession] Audio data:', {
            max: maxValue,
            avg: avgValue.toFixed(2),
            hasData: maxValue > 0,
            analyserState: audioContextRef.current?.state
          });
        }
        
        // Only update state every 3 frames to reduce re-renders
        frameCount++;
        if (frameCount % 3 === 0) {
          setAudioData(new Uint8Array(dataArray));
        }
        
        // Always continue updating
        animationFrameRef.current = requestAnimationFrame(updateAudioData);
      }
    };
    
    if (isSpeaking) {
      frameCount = 0;
      updateAudioData();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isSpeaking]);

  // Convert emotion data to prosody blendshapes
  useEffect(() => {
    if (Object.keys(emotionalState).length > 0) {
      console.log('[EnhancedCoachSession] Emotional state updated, converting to blendshapes:', JSON.stringify(emotionalState).substring(0, 200) + '...');
      // Convert EmotionalState to Record<string, number> by filtering out undefined values
      const emotionalValues: Record<string, number> = {};
      Object.entries(emotionalState).forEach(([key, value]) => {
        if (value !== undefined) {
          emotionalValues[key] = value;
        }
      });
      const blendshapes = prosodyToBlendshapes(emotionalValues); // Amplification is internal
      console.log('[EnhancedCoachSession] Blendshapes generated:', JSON.stringify(blendshapes).substring(0, 200) + '...');
      setProsodyBlendshapes(blendshapes);
    }
  }, [emotionalState]);

  const initializeAudioContext = () => {
    if (!audioContextRef.current) {
      console.log('[EnhancedCoachSession] Initializing audio context');
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext({ sampleRate: 48000 });
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
    }
  };

  const handleUserInteraction = () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().then(() => {
        console.log('[EnhancedCoachSession] Audio context resumed after user interaction');
      });
    }
  };

  const handleInterruption = () => {
    console.log('[EnhancedCoachSession] Handling interruption - clearing audio queue');
    
    // Stop current audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    // Clear the queue
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsSpeaking(false);
  };

  useEffect(() => {
    if (isSpeaking && isSpeakingRef.current) {
      // User started speaking while assistant is speaking - interrupt
      handleInterruption();
    }
  }, [isSpeaking, isSpeakingRef.current]);

  // --- Helper Functions ---

  const connectToHume = async () => {
    if (isConnectingRef.current || humeConnected) {
      console.log('[EnhancedCoachSession] Already connecting or connected to Hume');
      return;
    }
    
    isConnectingRef.current = true;
    setError(''); // Clear any previous errors
    
    try {
      console.log('[EnhancedCoachSession] Connecting to Hume with coach config:', coachId);
      
      if (!humeVoiceServiceRef.current) {
        humeVoiceServiceRef.current = new HumeVoiceService();
        
        // Set up all callbacks
        humeVoiceServiceRef.current.onAudio((audioBlob: Blob) => {
          console.log('[EnhancedCoachSession] Received audio from Hume:', audioBlob.size);
          audioQueueRef.current.push(audioBlob);
          if (!isPlayingRef.current) {
            playNextAudioFromQueue();
          }
        });
        
        humeVoiceServiceRef.current.onMessage((message: string) => {
          console.log('[EnhancedCoachSession] Hume message:', message);
          setFeedback(prev => [...prev, `Coach: ${message}`]);
          setLastTranscript(message);
        });
        
        humeVoiceServiceRef.current.onError((error: Error) => {
          console.error('[EnhancedCoachSession] Hume error:', error);
          if (error.message?.includes('too many active chats')) {
            setError('Too many active connections. Please refresh the page.');
          }
        });
        
        humeVoiceServiceRef.current.onUserMessage((transcript: string) => {
          console.log('[EnhancedCoachSession] User transcript:', transcript);
          setLastTranscript(`You: ${transcript}`);
        });
        
        humeVoiceServiceRef.current.onEmotion((emotions: EmotionalState) => {
          console.log('[EnhancedCoachSession] Emotions updated:', emotions);
          setEmotionalState(emotions);
          const newBlendShapes = prosodyToBlendshapes(emotions as any);
          setBlendShapes(newBlendShapes);
        });
      }
      
      // Connect with the specific coach config
      const configId = process.env.REACT_APP_HUME_CONFIG_ID; // Use only env config, not coach-specific
      console.log('[EnhancedCoachSession] Using Hume config ID:', configId);
      
      await humeVoiceServiceRef.current!.connect(configId);
      
      console.log('[EnhancedCoachSession] Successfully connected to Hume');
      setHumeConnected(true);
      setFeedback(prev => [...prev, '✅ Connected to Hume']);
    } catch (error: any) {
      console.error('[EnhancedCoachSession] Failed to connect to Hume:', error);
      setError(`Failed to connect to Hume: ${error?.message || 'Unknown error'}`);
    } finally {
      isConnectingRef.current = false;
    }
  };

  const setupMicrophone = async () => {
    if (isMicrophoneSetup || micStreamRef.current) {
      console.log('[EnhancedCoachSession] Microphone already setup');
      return;
    }
    
    try {
      console.log('[EnhancedCoachSession] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('[EnhancedCoachSession] Microphone access granted');
      micStreamRef.current = stream;
      
      // Get the best supported MIME type for this browser
      const mimeResult = getBrowserSupportedMimeType();
      const mimeType = mimeResult.success ? mimeResult.mimeType : MimeType.WEBM;
      console.log('[EnhancedCoachSession] Using MIME type:', mimeType);
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });
      
      let isFirstChunk = true;
      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0 && humeVoiceServiceRef.current?.checkConnection()) {
          try {
            // If this is the first chunk, wait a bit to ensure socket is fully ready
            if (isFirstChunk) {
              isFirstChunk = false;
              console.log('[EnhancedCoachSession] First audio chunk, waiting for socket to stabilize...');
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            await humeVoiceServiceRef.current.sendAudio(event.data);
          } catch (error) {
            console.error('[EnhancedCoachSession] Error sending audio:', error);
          }
        }
      };
      
      setMicrophoneReady(true);
      setIsMicrophoneSetup(true);
      console.log('[EnhancedCoachSession] Microphone setup complete');
    } catch (error: any) {
      console.error('[EnhancedCoachSession] Microphone setup failed:', error);
      setError('Microphone access denied or unavailable');
      setMicrophoneReady(false);
    }
  };

  const startRealtimeStreaming = useCallback(async () => {
    if (!micStreamRef.current || !humeConnected) {
      console.log('[EnhancedCoachSession] Cannot start streaming - prerequisites not met');
      return;
    }
    
    if (realtimeRecorderRef.current) {
      console.log('[EnhancedCoachSession] Real-time streaming already active');
      return;
    }
    
    console.log('[EnhancedCoachSession] Starting real-time audio streaming');
    
    try {
      // Get the best supported MIME type for this browser
      const mimeResult = getBrowserSupportedMimeType();
      const mimeType = mimeResult.success ? mimeResult.mimeType : MimeType.WEBM;
      
      console.log('[EnhancedCoachSession] Using audio format:', mimeType);
      
      const recorder = new MediaRecorder(micStreamRef.current, {
        mimeType,
        audioBitsPerSecond: 128000
      });
      
      let isFirstChunk = true;
      recorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && humeVoiceServiceRef.current?.checkConnection()) {
          try {
            // If this is the first chunk, wait a bit to ensure socket is fully ready
            if (isFirstChunk) {
              isFirstChunk = false;
              console.log('[EnhancedCoachSession] First audio chunk, waiting for socket to stabilize...');
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            await humeVoiceServiceRef.current.sendAudio(event.data);
          } catch (error) {
            console.error('[EnhancedCoachSession] Error sending audio:', error);
          }
        }
      };
      
      recorder.onstart = () => {
        console.log('[EnhancedCoachSession] Real-time streaming started');
        setIsListening(true);
        setIsStreaming(true);
      };

      recorder.onstop = () => {
        console.log('[EnhancedCoachSession] Real-time streaming stopped');
        setIsListening(false);
        setIsStreaming(false);
      };
      
      // 100ms chunks as recommended by Hume docs
      recorder.start(100);
      realtimeRecorderRef.current = recorder;
      
    } catch (error: any) {
      console.error('[EnhancedCoachSession] Failed to start streaming:', error);
      setError(`Streaming error: ${error?.message || 'Unknown error'}`);
    }
  }, [humeConnected]);

  const stopRealtimeStreaming = () => {
    if (realtimeRecorderRef.current?.state === 'recording') {
      realtimeRecorderRef.current.stop();
      realtimeRecorderRef.current = null;
    }
  };

  const playAudioWithAnalysis = async (audioBlob: Blob) => {
    console.log('[EnhancedCoachSession] Queueing audio for playback');
    audioQueueRef.current.push(audioBlob);
    
    if (!isPlayingRef.current) {
      playNextAudioFromQueue();
    }
  };

  const playNextAudioFromQueue = async () => {
    if (!audioQueueRef.current.length || isPlayingRef.current) return;
    
    isPlayingRef.current = true;
    const audioBlob = audioQueueRef.current.shift();
    if (!audioBlob) {
      isPlayingRef.current = false;
      return;
    }
    
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.volume = 1.0;
    currentAudioRef.current = audio;
    
    // Connect to analyser for lip sync
    if (audioContextRef.current && analyserRef.current) {
      try {
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        
        const source = audioContextRef.current.createMediaElementSource(audio);
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch (error) {
        console.log('[EnhancedCoachSession] Audio context connection error:', error);
      }
    }
    
    setIsSpeaking(true);
    
    audio.play().catch(error => {
      console.error('[EnhancedCoachSession] Audio playback error:', error);
      isPlayingRef.current = false;
      setIsSpeaking(false);
    });
    
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      isPlayingRef.current = false;
      currentAudioRef.current = null;
      
      if (audioQueueRef.current.length > 0) {
        playNextAudioFromQueue();
      } else {
        setIsSpeaking(false);
      }
    };
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    const message = userInput.trim();
    setUserInput('');
    setFeedback(prev => [...prev, `You: ${message}`]);
    
    if (humeVoiceServiceRef.current?.checkConnection()) {
      humeVoiceServiceRef.current.sendMessage(message);
    }
  };

  const testPiPEmotion = () => {
    console.log('[EnhancedCoachSession] Testing PiP emotion update');
    const testEmotion = {
      joy: 0.8,
      surprise: 0.3,
      sadness: 0.0,
      anger: 0.0,
      fear: 0.0,
      disgust: 0.0,
      contempt: 0.0
    };
    setEmotionalState(testEmotion);
    setFeedback(prev => [...prev, '✅ Set test emotion (Joy: 0.8, Surprise: 0.3)']);
  };

  const getCoachGradient = () => {
    switch (coachId) {
      case 'grace': return 'linear-gradient(135deg, #E8B4D8 0%, #C77BB3 100%)';
      case 'alex': return 'linear-gradient(135deg, #FFB6C1 0%, #FF91A4 100%)';
      case 'maya': return 'linear-gradient(135deg, #FF1744 0%, #D50000 100%)';
      default: return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  };

  // Automatically start streaming when both Hume and microphone are ready
  useEffect(() => {
    if (humeConnected && microphoneReady && !isListening && !isStreaming) {
      console.log('[EnhancedCoachSession] Auto-starting real-time streaming (both services ready)...');
      startRealtimeStreaming();
    }
  }, [humeConnected, microphoneReady, isListening, isStreaming, startRealtimeStreaming]);

  // --- Utility Functions ---
  

  // --- Components ---
  const AvatarWithEmotion: React.FC<{
    avatarUrl: string;
    audioData: Uint8Array;
    emotionalState: EmotionalState;
    isSpeaking: boolean;
    captureRef: React.RefObject<HTMLDivElement>;
  }> = ({ avatarUrl, audioData, emotionalState, isSpeaking }) => {
    const [localBlendshapes, setLocalBlendshapes] = useState<Record<string, number>>({});
    const meshRef = useRef<THREE.SkinnedMesh>(null);

    useEffect(() => {
      if (Object.keys(emotionalState).length > 0) {
        const emotionalValues: Record<string, number> = {};
        Object.entries(emotionalState).forEach(([key, value]) => {
          if (value !== undefined) {
            emotionalValues[key] = value;
          }
        });
        const shapes = prosodyToBlendshapes(emotionalValues);
        setLocalBlendshapes(shapes);
      }
    }, [emotionalState]);

    useFrame(() => {
      if (!meshRef.current?.morphTargetDictionary || !meshRef.current?.morphTargetInfluences) return;

      // Apply emotional blendshapes
      Object.entries(localBlendshapes).forEach(([shapeName, value]) => {
        const index = meshRef.current!.morphTargetDictionary![shapeName];
        if (index !== undefined && meshRef.current!.morphTargetInfluences) {
          meshRef.current!.morphTargetInfluences[index] = value;
        }
      });

      // Apply mouth movement based on audio
      if (isSpeaking && audioData && audioData.length > 0) {
        const average = audioData.reduce((sum, val) => sum + val, 0) / audioData.length;
        const mouthOpen = Math.min(average / 255 * 0.3, 0.3); // Max 30% open
        
        const mouthOpenIndex = meshRef.current!.morphTargetDictionary!['mouthOpen'];
        if (mouthOpenIndex !== undefined && meshRef.current!.morphTargetInfluences) {
          meshRef.current!.morphTargetInfluences[mouthOpenIndex] = mouthOpen;
        }
      }
    });

    return (
      <group>
        <primitive object={new THREE.Object3D()} ref={meshRef} />
        {/* Avatar mesh would be loaded here based on avatarUrl */}
      </group>
    );
  };

  // Use refs for blend shapes
  const blendShapesRef = useRef<any>({});

  // --- Render ---
  console.log('[EnhancedCoachSession] Rendering with:', { coachId, lessonId, currentLesson, coach });
  
  if (!coachId || !lessonId) {
    return <div>Invalid coach or lesson ID</div>;
  }

  if (!currentLesson) {
    return <div>Lesson not found</div>;
  }

  return (
    <div className="enhanced-coach-session">
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}
      
      <div ref={canvasRef} className="immersive-container">
        <Canvas camera={{ position: [0, 0, 1.8], fov: 35 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[0, 1, 2]} intensity={1.2} />
          <Suspense fallback={null}>
            <PresenceAvatar
              avatarUrl={coach?.avatar || `/avatars/coach_${coachId}.glb`}
              trackingData={trackingData || undefined}
              position={[0, -1.4, 0]}
              scale={1.0}
            />
          </Suspense>
        </Canvas>
      </div>
      
      {showPiP && (
        <div className="pip-avatar">
          <Canvas camera={{ position: [0, 0, 1.5], fov: 35 }}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[0, 1, 2]} intensity={1.2} />
            <Suspense fallback={null}>
              <PresenceAvatar
                avatarUrl="/avatars/babe.glb"
                trackingData={trackingData || undefined}
                position={[0, -1.75, 0]}
                scale={1.2}
              />
            </Suspense>
          </Canvas>
        </div>
      )}
      
      <div className="session-controls">
        <div className="control-group">
          <button 
            className="mic-button"
            onClick={() => {
              if (isListening) {
                stopRealtimeStreaming();
              } else {
                startRealtimeStreaming();
              }
            }}
            disabled={!humeConnected || !microphoneReady}
          >
            {isListening ? '🎤 Listening...' : '🎙️ Start Speaking'}
          </button>
          
          <div className="status-indicators">
            <span className={`status ${humeConnected ? 'connected' : ''}`}>
              Hume: {humeConnected ? '✓' : '○'}
            </span>
            <span className={`status ${microphoneReady ? 'connected' : ''}`}>
              Mic: {microphoneReady ? '✓' : '○'}
            </span>
            {audioLevel > 0 && (
              <span className="audio-level">
                Audio: {Math.round(audioLevel * 100)}%
              </span>
            )}
          </div>
        </div>
        
        <button className="settings-button" onClick={() => setShowSettings(true)}>
          ⚙️
        </button>
      </div>
      
      {showSettings && (
        <div className="settings-modal" onClick={(e) => {
          if (e.target === e.currentTarget) setShowSettings(false);
        }}>
          <div className="settings-content">
            <h2>Session Settings</h2>
            <div className="settings-section">
              <h3>Visual Settings</h3>
              <label>
                <input
                  type="checkbox"
                  checked={showPiP}
                  onChange={(e) => setShowPiP(e.target.checked)}
                />
                Show Picture-in-Picture avatar
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={showSubtitles}
                  onChange={(e) => setShowSubtitles(e.target.checked)}
                />
                Show subtitles
              </label>
            </div>
            <div className="settings-section">
              <h3>Session</h3>
              <button onClick={() => {
                setIsSessionActive(false);
                setShowSettings(false);
              }}>End Session</button>
            </div>
            <button className="close-button" onClick={() => setShowSettings(false)}>Close</button>
          </div>
        </div>
      )}
      
      {showSubtitles && lastTranscript && (
        <div className="subtitles">
          {lastTranscript}
        </div>
      )}
    </div>
  );
};

export default EnhancedCoachSession;
