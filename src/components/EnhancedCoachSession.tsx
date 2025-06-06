import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { HybridVoiceService } from '../services/hybridVoiceService';
import { EmotionalState } from '../services/humeVoiceService';
import { PresenceAvatar } from './PresenceAvatar';
import { TrackingData, FacialExpressions } from '../types/tracking';
import { getCoachById } from '../config/coachConfig';
import { getHumeCoachConfig } from '../services/HumeCoachConfigurations';
import { ML5FaceMeshService } from '../services/ML5FaceMeshService';
import { CombinedFaceTrackingService } from '../services/CombinedFaceTrackingService';
import { getBrowserSupportedMimeType, type MimeType } from '../utils/audioUtils';
import { mapEmotionsToBlendshapes } from '../utils/emotionMappings';
import * as THREE from 'three';
import { SafeVisualEffects } from './SafeVisualEffects';
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

  // State variables
  const [feedback, setFeedback] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false); // For AI coach speaking
  const [currentAnimation, setCurrentAnimation] = useState<string>('idle');
  const [emotionalState, setEmotionalState] = useState<EmotionalState>({});
  const [blendShapes, setBlendShapes] = useState<Record<string, number>>({});
  const [prosodyBlendshapes, setProsodyBlendshapes] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [humeConnected, setHumeConnected] = useState<boolean>(false);
  const [isHumeConnectionLoading, setIsHumeConnectionLoading] = useState<boolean>(false);
  const [microphoneReady, setMicrophoneReady] = useState<boolean>(false);
  const [trackingData, setTrackingData] = useState<any>(null); // Consider a more specific type later
  // const [isRecording, setIsRecording] = useState<boolean>(false); // Already declared above
  const [isFaceTrackingActive, setIsFaceTrackingActive] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [useHumeEVI, setUseHumeEVI] = useState<boolean>(true); // Default to using Hume EVI
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);
  const [coachAudioData, setCoachAudioData] = useState<Uint8Array | null>(null); // For coach lip sync
  const [exerciseActive, setExerciseActive] = useState(false);
  const [showPiP, setShowPiP] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<Array<{speaker: string, text: string, timestamp: number}>>([]);
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [lastTranscript, setLastTranscript] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [isFacialTrackingRunning, setIsFacialTrackingRunning] = useState<boolean>(false);
  const [isMicrophoneSetup, setIsMicrophoneSetup] = useState(false);

  // Chat interface state
  const [messages, setMessages] = useState<Array<{
    id: string;
    text: string;
    sender: 'user' | 'assistant' | 'system';
    timestamp: Date;
    emotion?: EmotionalState;
  }>>([]);
  const [inputText, setInputText] = useState('');
  const [showChat, setShowChat] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Refs
  const humeVoiceServiceRef = useRef<HybridVoiceService | null>(null);
  const audioQueueRef = useRef<Blob[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null); // For ML5 video
  const faceMeshRef = useRef<any>(null); // For ML5 faceMesh instance
  const trackingIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined); // For ML5 tracking interval, corrected type
  const ml5FaceMeshServiceRef = useRef<ML5FaceMeshService | null>(null);
  const combinedFaceTrackingServiceRef = useRef<CombinedFaceTrackingService | null>(null);
  const isInitializedRef = useRef<boolean>(false); // To run initialize once
  const mediaRecorderRef = useRef<MediaRecorder | null>(null); // For microphone
  const audioChunksRef = useRef<Blob[]>([]); // For microphone audio chunks
  const audioContextRef = useRef<AudioContext | null>(null); // For audio processing
  const analyserRef = useRef<AnalyserNode | null>(null); // For mic VAD
  const dataArrayRef = useRef<Uint8Array | null>(null); // For mic VAD data
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null); // For mic VAD source
  const playbackAnalyserRef = useRef<AnalyserNode | null>(null); // For playback lip sync
  const playbackDataArrayRef = useRef<Uint8Array | null>(null); // For playback lip sync data
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null); // For playing Hume's audio
  const coachAudioAnalyserRef = useRef<AnalyserNode | null>(null); // For analyzing coach's audio
  const coachAudioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioSourceCreatedRef = useRef<boolean>(false); // Track if audio source was created
  const canvasRef = useRef<HTMLDivElement>(null); // For the main avatar container
  const currentAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioLevelRef = useRef<number>(0);
  const selectedMimeTypeRef = useRef<string>('audio/webm');
  const micStreamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef<boolean>(false); // Add lock to prevent concurrent recordings
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  const realtimeRecorderRef = useRef<MediaRecorder | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastLogTimeRef = useRef<number | null>(null);

  // Callbacks
  const playNextAudioFromQueue = useCallback(() => {
    console.log('[EnhancedCoachSession] playNextAudioFromQueue called');
    console.log('[EnhancedCoachSession] Queue state:', {
      queueLength: audioQueueRef.current.length,
      isPlaying: isPlayingRef.current,
      hasPlayer: !!audioPlayerRef.current
    });
    
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      console.log('[EnhancedCoachSession] Not playing: either already playing or queue empty');
      return;
    }
    
    const audioBlob = audioQueueRef.current.shift();
    isPlayingRef.current = true; // Set immediately to prevent race conditions
    
    console.log('[EnhancedCoachSession] Processing audio blob:', {
      hasBlob: !!audioBlob,
      blobSize: audioBlob?.size,
      blobType: audioBlob?.type
    });
    
    if (audioBlob && audioPlayerRef.current) {
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log('[EnhancedCoachSession] Created audio URL:', audioUrl);
      audioPlayerRef.current.src = audioUrl;
      
      audioPlayerRef.current.play()
        .then(() => {
          console.log('[EnhancedCoachSession] Audio playback started successfully');
          setIsSpeaking(true); // AI starts speaking
          setCurrentAnimation('talking');
          
          // Setup audio analyzer ONLY ONCE for the audio element
          if (!audioSourceCreatedRef.current && audioPlayerRef.current) {
            try {
              // Check if audio context exists and is not closed
              if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                console.log('[EnhancedCoachSession] Creating new AudioContext');
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                audioContextRef.current = new AudioContext({ sampleRate: 48000 });
              }
              
              // Resume audio context if suspended
              if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume().then(() => {
                  console.log('[EnhancedCoachSession] Audio context resumed');
                });
              }
              
              const analyser = audioContextRef.current.createAnalyser();
              analyser.fftSize = 256;
              const source = audioContextRef.current.createMediaElementSource(audioPlayerRef.current);
              source.connect(analyser);
              analyser.connect(audioContextRef.current.destination);
              
              coachAudioAnalyserRef.current = analyser;
              coachAudioSourceRef.current = source;
              audioSourceCreatedRef.current = true;
              console.log('[EnhancedCoachSession] Audio analyzer setup complete');
            } catch (error) {
              console.error('[EnhancedCoachSession] Error setting up audio analyzer:', error);
            }
          }
        })
        .catch(e => {
          console.error('[EnhancedCoachSession] Error playing audio:', e);
          console.error('[EnhancedCoachSession] Audio element state:', {
            src: audioPlayerRef.current?.src,
            readyState: audioPlayerRef.current?.readyState,
            error: audioPlayerRef.current?.error,
            paused: audioPlayerRef.current?.paused,
            muted: audioPlayerRef.current?.muted,
            volume: audioPlayerRef.current?.volume
          });
          isPlayingRef.current = false;
          setIsSpeaking(false); // AI failed to speak
          setCurrentAnimation('idle');
          // Try next audio in queue
          setTimeout(() => playNextAudioFromQueue(), 100);
        });
      audioPlayerRef.current.onended = () => {
        URL.revokeObjectURL(audioUrl);
        isPlayingRef.current = false;
        setIsSpeaking(false); // AI finished speaking
        setCurrentAnimation('idle');
        
        playNextAudioFromQueue(); // Play next if available
      };
    } else {
      isPlayingRef.current = false; // No blob or player
      setIsSpeaking(false);
      setCurrentAnimation('idle');
    }
  }, [setIsSpeaking, setCurrentAnimation, audioQueueRef, isPlayingRef, audioPlayerRef]); // playNextAudioFromQueue is a dependency for main useEffect

  const handleInterruption = useCallback(() => {
    console.log('[EnhancedCoachSession] Handling user interruption.');
    if (humeVoiceServiceRef.current && humeConnected) { // Use humeConnected state instead of private isConnected
      // Assuming a method like sendInterruption or sendPauseAssistantMessage exists
      // For now, we'll log. Replace with actual SDK call if available.
      // humeVoiceServiceRef.current.sendPauseAssistantMessage(); 
      console.log('[EnhancedCoachSession] Interruption signal sent to Hume (simulated).');
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      // Consider clearing src or resetting to stop current audio completely
      // audioPlayerRef.current.src = ''; 
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    // Clear the audio queue to prevent old messages from playing after interruption
    audioQueueRef.current = []; 
    isPlayingRef.current = false;
    console.log('[EnhancedCoachSession] Audio queue cleared and playback stopped due to interruption.');
    setIsSpeaking(false);
    setCurrentAnimation('idle');
  }, [humeConnected]);

  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const formatEmotionalStateForMapping = useCallback((currentEmotionalState: EmotionalState): { name: string; score: number }[] => {
    return Object.entries(currentEmotionalState)
      .filter(([, score]) => score !== undefined && score > 0) // Only include emotions with a defined, positive score
      .map(([name, score]) => ({ name, score: score as number }));
  }, []);

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

  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      console.log('[EnhancedCoachSession] Initializing audio context');
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext({ sampleRate: 48000 });
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
    }
  }, []);

  const handleUserInteraction = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().then(() => {
        console.log('[EnhancedCoachSession] Audio context resumed after user interaction');
      }).catch(e => console.error("[EnhancedCoachSession] Error resuming audio context", e));
    }
  }, []);

  const resetAudioStateAndAnimation = useCallback(() => {
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsSpeaking(false); // Corrected: Now uses declared setIsSpeaking
    setCurrentAnimation('idle');
  }, [setIsSpeaking, setCurrentAnimation]); // Corrected: Now uses declared setIsSpeaking

  const connectToHume = useCallback(async () => {
    console.log('[EnhancedCoachSession] connectToHume called');
    console.log('[EnhancedCoachSession] Current state:', {
      isConnectingRef: isConnectingRef.current,
      humeConnected,
      humeVoiceServiceRef: !!humeVoiceServiceRef.current
    });
    
    if (isConnectingRef.current || humeConnected) {
      console.log('[EnhancedCoachSession] Skipping connection - already connecting or connected');
      return;
    }
    
    isConnectingRef.current = true;
    setIsHumeConnectionLoading(true);
    setError('');
    
    try {
      // Log environment variables (without exposing full keys)
      console.log('[EnhancedCoachSession] Environment check:', {
        hasApiKey: !!process.env.REACT_APP_HUME_API_KEY,
        hasSecretKey: !!process.env.REACT_APP_HUME_SECRET_KEY,
        hasConfigId: !!process.env.REACT_APP_HUME_CONFIG_ID,
        apiKeyPreview: process.env.REACT_APP_HUME_API_KEY ? 
          process.env.REACT_APP_HUME_API_KEY.substring(0, 10) + '...' : 'NOT SET'
      });
      
      if (!humeVoiceServiceRef.current) {
        console.log('[EnhancedCoachSession] Creating new HybridVoiceService instance');
        humeVoiceServiceRef.current = new HybridVoiceService();
      }
      
      // Set up callbacks BEFORE connecting to ensure we don't miss any messages
      console.log('[EnhancedCoachSession] Setting up Hume EVI callbacks BEFORE connection...');
      
      humeVoiceServiceRef.current.onMessage((message: any) => {
        console.log('[EnhancedCoachSession] onMessage callback triggered');
        console.log('[EnhancedCoachSession] Message type:', typeof message);
        console.log('[EnhancedCoachSession] Message content:', message);
        
        const messageText = typeof message === 'string' ? message : 
                          (message?.message?.content || message?.content || 
                           JSON.stringify(message));
        
        if (messageText && messageText.trim()) {
          const newMessage = {
            id: Date.now().toString(),
            text: messageText,
            sender: 'assistant' as const,
            timestamp: new Date(),
            emotion: message?.models?.prosody?.scores || undefined
          };
          setMessages(prev => [...prev, newMessage]);
        }
      });
      
      humeVoiceServiceRef.current.onAudio((audioBlob: Blob) => {
        console.log('[EnhancedCoachSession] Hume EVI Audio Output received! Size:', audioBlob.size, 'Type:', audioBlob.type);
        setIsSpeaking(true);
        setCurrentAnimation('talking');
        audioQueueRef.current.push(audioBlob);
        if (!isPlayingRef.current) {
          playNextAudioFromQueue();
        }
      });
      
      humeVoiceServiceRef.current.onAssistantEnd(() => {
        console.log('[EnhancedCoachSession] Hume EVI AssistantEnd.');
        setIsSpeaking(false);
        setCurrentAnimation('idle');
      });
      
      humeVoiceServiceRef.current.onUserMessage((transcript: string) => {
        console.log('[EnhancedCoachSession] Hume EVI UserMessage (transcript):', transcript);
        const newMessage = {
          id: Date.now().toString(),
          text: transcript,
          sender: 'user' as const,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
      });
      
      humeVoiceServiceRef.current.onUserInterruption(() => {
        console.log('[EnhancedCoachSession] Hume EVI UserInterruption.');
        handleInterruption();
      });
      
      humeVoiceServiceRef.current.onEmotion((emotionData: EmotionalState) => {
        console.log('[EnhancedCoachSession] Hume EVI Emotion Data:', JSON.stringify(emotionData));
        setEmotionalState(emotionData);
      });
      
      humeVoiceServiceRef.current.onError((error: Error) => {
        console.error('[EnhancedCoachSession] Hume EVI Error:', error);
        setError(`Hume Error: ${error.message}`);
        if (error.message?.includes('too many active chats') || error.message?.includes('Authentication failed') || error.message?.includes('Could not connect')) {
          setHumeConnected(false);
          setIsHumeConnectionLoading(false);
        }
      });
      
      console.log('[EnhancedCoachSession] All callbacks set up, now connecting...');
      
      const coachSpecificConfigId = humeConfig?.configId;
      const environmentConfigId = process.env.REACT_APP_HUME_CONFIG_ID;
      const configIdToUse = coachSpecificConfigId || environmentConfigId;
      
      console.log('[EnhancedCoachSession] Config IDs:', {
        coachSpecific: coachSpecificConfigId,
        environment: environmentConfigId,
        using: configIdToUse
      });
      
      if (!configIdToUse) {
        throw new Error('Hume EVI Config ID not found. Check coach settings or .env file.');
      }
      
      console.log(`[EnhancedCoachSession] Connecting to Hume with EVI config ID: ${configIdToUse}`);
      await humeVoiceServiceRef.current.connect(configIdToUse);
      
      console.log('[EnhancedCoachSession] Connection successful, updating state');
      setHumeConnected(true);
      setIsHumeConnectionLoading(false);
      
      // Add initial greeting message
      const greetingMessage = {
        id: Date.now().toString(),
        text: `Hello! I'm ${coach?.name || 'your coach'}. I'm here to help you with ${currentLesson?.title || 'your session'}. How can I assist you today?`,
        sender: 'assistant' as const,
        timestamp: new Date()
      };
      setMessages([greetingMessage]);
      
      // Add a small delay to ensure the socket is fully ready
      console.log('[EnhancedCoachSession] Waiting for socket to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('[EnhancedCoachSession] Socket should be ready now');
      
      // Send initial message to Hume to start conversation
      console.log('[EnhancedCoachSession] Sending initial message to Hume...');
      try {
        if (humeVoiceServiceRef.current) {
          await humeVoiceServiceRef.current.sendMessage("Hello");
          console.log('[EnhancedCoachSession] Initial message sent successfully');
          console.warn('[EnhancedCoachSession] ⚠️ If you are not hearing audio responses, please check that your Hume EVI configuration has text-to-speech (TTS) enabled at https://platform.hume.ai/');
        }
      } catch (err) {
        console.error('[EnhancedCoachSession] Failed to send initial message:', err);
      }
    } catch (err: any) {      
      console.error('[EnhancedCoachSession] Failed to connect to Hume EVI:', err);
      console.error('[EnhancedCoachSession] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError(`Hume Connection Error: ${err.message}`);
      setHumeConnected(false);
    } finally {
      isConnectingRef.current = false;
      setIsHumeConnectionLoading(false);
    }
  }, [humeConnected, humeConfig?.configId, setError, setHumeConnected, setMessages, coach, currentLesson]);

  const setupMicrophone = useCallback(async () => {
    if (isMicrophoneSetup || micStreamRef.current) return;
    try {
      console.log('[EnhancedCoachSession] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      micStreamRef.current = stream;
      setMicrophoneReady(true);
      setIsMicrophoneSetup(true);
      console.log('[EnhancedCoachSession] Microphone access granted and setup complete.');
    } catch (err: any) {
      console.error('[EnhancedCoachSession] Microphone setup failed:', err);
      setError('Microphone access denied or unavailable. Please check browser permissions.');
      setMicrophoneReady(false);
    }
  }, [isMicrophoneSetup, setError, setMicrophoneReady, setIsMicrophoneSetup]);

  const startRealtimeStreaming = useCallback(async () => {
    console.log('[EnhancedCoachSession] startRealtimeStreaming called');
    console.log('[EnhancedCoachSession] Current state:', {
      humeConnected,
      micStreamRef: !!micStreamRef.current,
      humeVoiceServiceRef: !!humeVoiceServiceRef.current,
      checkConnection: humeVoiceServiceRef.current?.checkConnection()
    });

    if (!humeConnected || !micStreamRef.current || !humeVoiceServiceRef.current) {
      console.error('[EnhancedCoachSession] Prerequisites not met for streaming');
      return;
    }

    if (!humeVoiceServiceRef.current.checkConnection()) {
      console.log('[EnhancedCoachSession] Hume connection not ready, waiting...');
      setError('Hume connection not ready. Please wait a moment and try again.');
      
      // Wait a bit and check again
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!humeVoiceServiceRef.current.checkConnection()) {
        console.error('[EnhancedCoachSession] Hume connection still not ready after wait');
        return;
      }
      
      console.log('[EnhancedCoachSession] Hume connection is now ready');
      setError(''); // Clear error
    }

    try {
      const mimeType = getBrowserSupportedMimeType();
      console.log('[EnhancedCoachSession] Using MIME type:', mimeType);
      
      const recorder = new MediaRecorder(micStreamRef.current, {
        mimeType,
        audioBitsPerSecond: 128000
      });

      let isFirstAudioChunk = true;

      recorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && humeVoiceServiceRef.current?.checkConnection()) {
          console.log('[EnhancedCoachSession] Audio chunk available, size:', event.data.size);
          
          // Wait a bit on first chunk to ensure connection is stable
          if (isFirstAudioChunk) {
            console.log('[EnhancedCoachSession] First audio chunk, waiting 1s for connection stability...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            isFirstAudioChunk = false;
          }
          
          try {
            await humeVoiceServiceRef.current.sendAudio(event.data);
            console.log('[EnhancedCoachSession] Audio chunk sent successfully');
          } catch (error) {
            console.error('[EnhancedCoachSession] Error sending audio chunk:', error);
          }
        }
      };

      recorder.onerror = (event) => {
        console.error('[EnhancedCoachSession] MediaRecorder error:', event);
        setError('Recording error occurred');
      };

      recorder.onstop = () => {
        console.log('[EnhancedCoachSession] MediaRecorder stopped');
      };

      realtimeRecorderRef.current = recorder;
      recorder.start(250); // Capture audio in 250ms chunks
      setIsStreaming(true);
      console.log('[EnhancedCoachSession] MediaRecorder started');
    } catch (error) {
      console.error('[EnhancedCoachSession] Error starting streaming:', error);
      setError('Failed to start audio streaming');
    }
  }, [humeConnected, setError, setIsStreaming, getBrowserSupportedMimeType]);

  const stopRealtimeStreaming = useCallback(() => {
    if (realtimeRecorderRef.current?.state === 'recording') {
      console.log('[EnhancedCoachSession] Stopping real-time streaming...');
      realtimeRecorderRef.current.stop();
      realtimeRecorderRef.current = null;
      setIsStreaming(false);
      console.log('[EnhancedCoachSession] Streaming stopped');
    }
  }, [setIsStreaming]);

  const handleAudioPlaybackCompleted = useCallback(() => {
    console.log('[EnhancedCoachSession] Audio playback completed or error.');
    isPlayingRef.current = false;
    setIsSpeaking(false);
    setCurrentAnimation('idle');
    if (currentAudioRef.current) { // Clean up current audio
      // The onended/onerror handlers should have revoked the URL if they created it.
      currentAudioRef.current = null;
    }
    // Attempt to play the next item if the queue is not empty
    if (audioQueueRef.current.length > 0) {
      playNextAudioFromQueue(); // This relies on playNextAudioFromQueue being defined
    }
  }, [setIsSpeaking, setCurrentAnimation, playNextAudioFromQueue]); // Forward declaration for playNextAudioFromQueue

  const playAudioWithAnalysis = useCallback(async (audioBlob: Blob) => {
    audioQueueRef.current.push(audioBlob);
    if (!isPlayingRef.current) {
      playNextAudioFromQueue();
    }
  }, [playNextAudioFromQueue]);

  const handleSendMessage = useCallback(async () => {
    if (!userInput.trim() || !humeVoiceServiceRef.current?.checkConnection()) return;
    const message = userInput.trim();
    setUserInput('');
    setFeedback(prev => [...prev, `You: ${message}`]);
    setConversationHistory(prev => [...prev, {speaker: 'user', text: message, timestamp: Date.now()}]);
    humeVoiceServiceRef.current.sendMessage(message);
    // Optionally, handle interruption if user speaks over coach
    handleInterruption(); 
  }, [userInput, setUserInput, setFeedback, setConversationHistory, handleInterruption]);

  const handleTogglePiP = useCallback(() => setShowPiP(p => !p), [setShowPiP]);

  const handleToggleRecording = useCallback(() => {
    if (isStreaming) {
      stopRealtimeStreaming();
    } else {
      if (humeConnected && microphoneReady) {
        startRealtimeStreaming();
      } else {
        if(!humeConnected) connectToHume();
        if(!microphoneReady) setupMicrophone();
      }
    }
  }, [isStreaming, humeConnected, microphoneReady, startRealtimeStreaming, stopRealtimeStreaming, connectToHume, setupMicrophone]);

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
        
        // Store video reference
        videoRef.current = video;
        
        // Get webcam stream
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
          video.onloadedmetadata = () => resolve(null);
          video.oncanplay = () => {
            video.play()
              .then(() => {
                console.log('[EnhancedCoachSession] video.play() called successfully.');
              })
              .catch(playError => {
                console.error('[EnhancedCoachSession] Error calling video.play():', playError);
              });
          };
        });
        
        ml5FaceMeshServiceRef.current = new ML5FaceMeshService();
        await ml5FaceMeshServiceRef.current.initialize();

        console.log(`[EnhancedCoachSession] Video paused state before startTracking: ${video.paused}`);
        console.log('!!!!!!!!!!!!!!!!!!!! [EnhancedCoachSession] ABOUT TO CALL startTracking (ML5FaceMeshService) !!!!!!!!!!!!!!!!!!!!');
        console.log('[EnhancedCoachSession] video element for ML5:', video);

        // Actually start tracking!
        ml5FaceMeshServiceRef.current.startTracking(video);
        console.log('[EnhancedCoachSession] ML5 startTracking called successfully');

        const newFaceTrackingIntervalId = setInterval(() => {
          if (video && ml5FaceMeshServiceRef.current) { // Check video and service existence
            const facialExpressions = ml5FaceMeshServiceRef.current.getExpressions();
            const headRotation = ml5FaceMeshServiceRef.current.getHeadRotation();
            const landmarks = ml5FaceMeshServiceRef.current.getLandmarks();

            if (facialExpressions || headRotation || landmarks) { // Check if any data is available
              const data = {
                facialExpressions: facialExpressions || {},
                headRotation: headRotation || {},
                landmarks: landmarks || [],
                source: 'ml5'
              };
              setTrackingData(data);
              
              // Debug log every second
              if (Date.now() % 1000 < 50) {
                console.log('[EnhancedCoachSession] ML5 tracking data:', {
                  hasExpressions: !!facialExpressions && Object.keys(facialExpressions).length > 0,
                  expressions: facialExpressions,
                  hasHeadRotation: !!headRotation,
                  headRotation: headRotation
                });
              }
            }
            setIsFacialTrackingRunning(true); // Set tracking as running
          } else {
            console.warn('[EnhancedCoachSession] Face tracking interval: Video element or ML5 service not available/initialized.');
          }
        }, 1000 / 30); // 30 FPS
        
        trackingIntervalRef.current = newFaceTrackingIntervalId;
        setIsFacialTrackingRunning(true); // Confirming tracking is initiated
        
        console.log('[EnhancedCoachSession] Face tracking polling started successfully.');
      } catch (error) {
        console.error('!!!!!!!!!!!!!!!!!!!! [EnhancedCoachSession] CAUGHT ERROR during face tracking setup !!!!!!!!!!!!!!!!!!!!', error);
        // console.error('[EnhancedCoachSession] Failed to start face tracking:', error); // Original log commented out for clarity, can be re-enabled
      }
      
      // Initialize Combined Face Tracking Service
      combinedFaceTrackingServiceRef.current = new CombinedFaceTrackingService();
      await combinedFaceTrackingServiceRef.current.initialize();
      
      // Start tracking with the video element if it exists
      if (videoRef.current) {
        combinedFaceTrackingServiceRef.current.startTracking(videoRef.current);
        console.log('[EnhancedCoachSession] Started combined face tracking');
      } else {
        console.warn('[EnhancedCoachSession] No video element available for combined face tracking');
      }
      
      // Auto-connect to Hume
      console.log(`[EnhancedCoachSession] Checking before connectToHume: humeVoiceServiceRef.current is ${!!humeVoiceServiceRef.current}`);
      if (!humeVoiceServiceRef.current) {
        console.log('[EnhancedCoachSession] Attempting to connect to Hume...');
        // DISABLED AUTO-CONNECT TO PREVENT CREDIT CONSUMPTION
        // await connectToHume();
        console.log('[EnhancedCoachSession] Auto-connect to Hume disabled to prevent credit consumption');
      } else {
        console.log('[EnhancedCoachSession] Skipping connectToHume as service/connection already exists.');
      }
      
      // Then set up microphone
      console.log(`[EnhancedCoachSession] Checking before setupMicrophone: micStreamRef.current is ${!!micStreamRef.current}`);
      if (!micStreamRef.current) {
        console.log('[EnhancedCoachSession] Attempting to setup microphone...');
        await setupMicrophone();
      } else {
        console.log('[EnhancedCoachSession] Skipping setupMicrophone as stream already exists.');
      }
    };

    initialize();

    return () => {
      // Cleanup on unmount
      console.log('[EnhancedCoachSession] Cleaning up...');
      
      // Stop real-time streaming if active
      if (realtimeRecorderRef.current && realtimeRecorderRef.current.state !== 'inactive') {
        console.log('[EnhancedCoachSession] Stopping real-time recorder...');
        realtimeRecorderRef.current.stop();
        trackingIntervalRef.current = undefined;
      }
      
      // Disconnect Hume
      if (humeVoiceServiceRef.current) {
        console.log('[EnhancedCoachSession] Disconnecting from Hume and nullifying ref...');
        humeVoiceServiceRef.current.disconnect();
        humeVoiceServiceRef.current = null;
      }
      setHumeConnected(false);
      setIsHumeConnectionLoading(false);
      
      // Stop microphone
      if (micStreamRef.current) {
        console.log('[EnhancedCoachSession] Stopping microphone and nullifying ref...');
        micStreamRef.current.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
      }
      setMicrophoneReady(false);
      setIsListening(false); // Also reset listening state if dependent on microphone
      
      // Stop any playing audio
      if (currentAudioRef.current) {
        console.log('[EnhancedCoachSession] Stopping audio playback...');
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      
      // Stop combined face tracking
      if (combinedFaceTrackingServiceRef.current) {
        console.log('[EnhancedCoachSession] Stopping combined face tracking...');
        combinedFaceTrackingServiceRef.current.stopTracking();
        combinedFaceTrackingServiceRef.current = null;
      }
      
      // Clean up video element
      if (videoRef.current) {
        console.log('[EnhancedCoachSession] Cleaning up video element...');
        if (videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current.parentNode) {
          videoRef.current.parentNode.removeChild(videoRef.current);
        }
        videoRef.current = null;
      }
      
      // Close audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        console.log('[EnhancedCoachSession] Closing audio context...');
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (humeVoiceServiceRef.current && humeConnected) { // Use component's humeConnected state
        console.log('[EnhancedCoachSession] Page unloading, disconnecting Hume...');
        humeVoiceServiceRef.current.disconnect();
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden && humeVoiceServiceRef.current && humeConnected) {
        console.log('[EnhancedCoachSession] Page hidden, disconnecting Hume...');
        humeVoiceServiceRef.current.disconnect();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [humeConnected]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (Object.keys(emotionalState).length > 0) {
      const formattedEmotions = formatEmotionalStateForMapping(emotionalState);
      if (formattedEmotions.length > 0) {
        const blendshapes = mapEmotionsToBlendshapes(formattedEmotions);
        setProsodyBlendshapes(blendshapes);
      } else {
        setProsodyBlendshapes({}); // Clear or set to neutral
      }
    }
  }, [emotionalState, setProsodyBlendshapes, formatEmotionalStateForMapping]);

  useEffect(() => {
    if (!audioContextRef.current) {
      initializeAudioContext();
    }
  }, []);

  useEffect(() => {
    if (humeConnected && microphoneReady && !isStreaming) {
      console.log('[EnhancedCoachSession] Auto-starting streaming after Hume connection...');
      // Longer delay to ensure connection is fully stable
      const timer = setTimeout(() => {
        startRealtimeStreaming();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [humeConnected, microphoneReady, isStreaming, startRealtimeStreaming]);

  useEffect(() => {
    return () => {
      console.log('[EnhancedCoachSession] Component unmounting, cleaning up connections...');
      
      // Stop streaming if active
      if (isStreaming) {
        stopRealtimeStreaming();
      }
      
      // Disconnect from Hume if connected
      if (humeVoiceServiceRef.current) {
        humeVoiceServiceRef.current.disconnect().catch(err => {
          console.error('[EnhancedCoachSession] Error disconnecting on unmount:', err);
        });
      }
      
      // Clean up face tracking
      if (combinedFaceTrackingServiceRef.current) {
        combinedFaceTrackingServiceRef.current.stopTracking();
      }
      
      // Clean up audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []); // Empty dependency array means this runs only on unmount

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!coachAudioAnalyserRef.current || !isSpeaking) {
      if (isSpeaking && !coachAudioAnalyserRef.current) {
        console.log('[EnhancedCoachSession] Warning: isSpeaking is true but no audio analyser available');
      }
      return;
    }

    console.log('[EnhancedCoachSession] Starting audio analysis for lip sync');
    const analyser = coachAudioAnalyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationId: number;

    const updateAudioData = () => {
      analyser.getByteFrequencyData(dataArray);
      setCoachAudioData(new Uint8Array(dataArray)); // Create a copy to trigger re-render
      
      // Log audio levels periodically for debugging
      const now = Date.now();
      if (!lastLogTimeRef.current || now - lastLogTimeRef.current > 1000) {
        const avgLevel = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
        console.log('[EnhancedCoachSession] Audio analysis - Avg level:', avgLevel.toFixed(2), 'Max:', Math.max(...dataArray));
        lastLogTimeRef.current = now;
      }
      
      animationId = requestAnimationFrame(updateAudioData);
    };

    updateAudioData();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      console.log('[EnhancedCoachSession] Stopping audio analysis for lip sync');
      setCoachAudioData(null); // Clear audio data when not speaking
    };
  }, [isSpeaking]);

  const AvatarWithEmotion: React.FC<{
    avatarUrl: string;
    audioData: Uint8Array;
    emotionalState: EmotionalState;
    isSpeaking: boolean;
    captureRef: React.RefObject<HTMLDivElement>;
  }> = ({ avatarUrl, audioData, emotionalState, isSpeaking, captureRef }) => {
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
        const average = audioData.reduce((sum: number, val: number) => sum + val, 0) / audioData.length;
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

  // Send message via text input
  const sendMessage = async () => {
    if (!inputText.trim() || !humeVoiceServiceRef.current || !humeConnected) return;
    
    const messageText = inputText.trim();
    setInputText('');
    
    // Add user message to chat
    const userMessage = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user' as const,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Send to Hume
    try {
      await humeVoiceServiceRef.current.sendMessage(messageText);
    } catch (error) {
      console.error('[EnhancedCoachSession] Error sending message:', error);
      setError('Failed to send message');
    }
  };

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
              trackingData={undefined} // Coach's expressions are driven by Hume EVI, not user face tracking
              position={[0, -1.4, 0]}
              scale={1.0}
              animationName={currentAnimation} // For idle/talking states
              emotionalBlendshapes={blendShapes} // For expressions from Hume EVI prosody
              audioData={coachAudioData || new Uint8Array()} // For lip-sync from Hume EVI audio
            />
          </Suspense>
          {/* Add lightweight post-processing for visual enhancement */}
          <SafeVisualEffects style="medium" enabled={true} />
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
            {/* Add subtle post-processing to PiP view */}
            <SafeVisualEffects style="subtle" enabled={true} />
          </Canvas>
        </div>
      )}
      
      <div className="session-controls">
        <div className="control-group">
          {!humeConnected ? (
            <button 
              className="connect-button"
              onClick={() => {
                console.log('[EnhancedCoachSession] User clicked Connect to Hume AI');
                connectToHume();
              }}
              disabled={isHumeConnectionLoading}
              title="⚠️ This will use Hume AI credits. Check console for connection monitoring."
            >
              {isHumeConnectionLoading ? 'Connecting...' : 'Connect to Hume AI (Uses Credits)'}
            </button>
          ) : (
            <button 
              className="disconnect-button"
              onClick={async () => {
                console.log('[EnhancedCoachSession] User clicked Disconnect');
                if (isListening) {
                  stopRealtimeStreaming();
                }
                if (humeVoiceServiceRef.current) {
                  await humeVoiceServiceRef.current.disconnect();
                  setHumeConnected(false);
                }
              }}
              title="Disconnect from Hume AI to save credits"
            >
              Disconnect from Hume AI
            </button>
          )}
          
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
            <span className={`status ${humeConnected ? 'connected' : 'disconnected'}`}>
              <span className="status-dot"></span>
              Hume: {humeConnected ? 'Connected' : 'Disconnected'}
            </span>
            <span className={`status ${microphoneReady ? 'connected' : 'disconnected'}`}>
              <span className="status-dot"></span>
              Mic: {microphoneReady ? 'Ready' : 'Not Ready'}
            </span>
            {!microphoneReady && (
              <button 
                onClick={setupMicrophone}
                className="setup-mic-button"
                style={{
                  marginLeft: '10px',
                  padding: '5px 10px',
                  backgroundColor: '#ff6b6b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Setup Mic
              </button>
            )}
            <span className={`status ${isStreaming ? 'connected' : 'disconnected'}`}>
              <span className="status-dot"></span>
              Streaming: {isStreaming ? 'Active' : 'Inactive'}
            </span>
            {humeConnected && microphoneReady && !isStreaming && (
              <button 
                onClick={startRealtimeStreaming}
                className="start-streaming-button"
                style={{
                  marginLeft: '10px',
                  padding: '5px 10px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Start Streaming
              </button>
            )}
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
                // Disconnect when ending session
                if (humeConnected && humeVoiceServiceRef.current) {
                  humeVoiceServiceRef.current.disconnect();
                  setHumeConnected(false);
                }
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
      
      {showChat && (
        <div className="chat-container">
          <div className="chat-header">
            <h3>Chat with {coach?.name || 'Coach'}</h3>
            <button className="chat-toggle" onClick={() => setShowChat(false)}>×</button>
          </div>
          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`chat-message ${message.sender}`}>
                <span className="message-text">{message.text}</span>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input-container">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              disabled={!humeConnected}
              className="chat-input"
            />
            <button 
              onClick={sendMessage} 
              disabled={!humeConnected || !inputText.trim()}
              className="chat-send-button"
            >
              Send
            </button>
          </div>
        </div>
      )}
      
      {!showChat && (
        <button className="chat-toggle-button" onClick={() => setShowChat(true)}>
          💬 Chat
        </button>
      )}
      
      {/* Hidden audio element for playing Hume's responses */}
      <audio 
        ref={audioPlayerRef} 
        style={{ display: 'none' }} 
      />
    </div>
  );
};

export default EnhancedCoachSession;
