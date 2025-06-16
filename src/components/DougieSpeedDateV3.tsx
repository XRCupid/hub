import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { PresenceAvatarMaleCoach } from './PresenceAvatarMaleCoach';
import { HybridVoiceService } from '../services/hybridVoiceService';
import { TranscriptSegment } from '../services/humeVoiceService';
import { humeConnectionManager } from '../services/HumeConnectionManager';
import { HumeExpressionService } from '../services/HumeExpressionService';
import RealTimeEmotionSliders from './RealTimeEmotionSliders';
import TranscriptTimeline from './TranscriptTimeline';
import ChemistryReport from './ChemistryReport';
import TrackingPreferencesSelector from './TrackingPreferencesSelector';
import TrackingStatusIndicator from './TrackingStatusIndicator';
import EngagementDashboard from './EngagementDashboard';
import { UnifiedTrackingCoordinator, DateTrackingPreferences, SessionContext, TrackingConfiguration } from '../services/UnifiedTrackingCoordinator';
import { PostureTrackingService } from '../services/PostureTrackingService';
import { EngagementAnalytics } from '../types/tracking';
import { FaLock, FaLockOpen, FaCog, FaEye, FaUser, FaEyeSlash, FaRunning, FaBars, FaComments, FaChartLine } from 'react-icons/fa';
import './DougieSpeedDateV3.css';
import { UserAvatarPiP } from './UserAvatarPiP';

// CV Analytics Types
type CVAnalyticsMode = 'none' | 'eye-contact' | 'posture' | 'combined';

interface CVAnalyticsData {
  eyeContact: {
    percentage: number;
    gazeOnTarget: boolean;
    lookAwayCount: number;
    averageContactDuration: number;
  };
  posture: {
    shoulderAlignment: number;
    headPosition: { x: number; y: number };
    bodyOpenness: number;
    leaning: 'neutral' | 'forward' | 'backward';
    confidenceScore: number;
  };
}

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

// Enhanced analytics interfaces for comprehensive dating performance tracking
interface ConversationSegment {
  timestamp: number;
  speaker: 'user' | 'dougie';
  text: string;
  duration: number;
  facialEmotions: { name: string; score: number }[];
  prosodyEmotions: { name: string; score: number }[];
  engagementLevel: number;
  jokeDetected?: boolean;
  questionAsked?: boolean;
  storyTelling?: boolean;
  interruptionOccurred?: boolean;
  responseLatency?: number;
  energyLevel: number;
  emotionalRange: number;
  topicShift?: boolean;
  followUpToPartner?: boolean;
  activeListening?: boolean;
}

interface PerformanceMetrics {
  speakerMetrics: {
    totalSpeakTime: number;
    averageSegmentLength: number;
    jokeSuccessRate: number; // jokes that got positive response
    storyEngagementScore: number;
    questionQuality: number; // questions that got elaborative responses
    energyConsistency: number;
    emotionalRange: number; // variety of emotions expressed
  };
  listenerMetrics: {
    activeListeningScore: number; // facial expressions during partner's speech
    responseQuality: number; // how well they build on partner's topics
    emotionalMirroring: number; // mimicking partner's emotions
    interruptionRate: number;
    encouragementSignals: number; // nods, smiles, etc.
  };
  overallScores: {
    charisma: number;
    empathy: number;
    authenticity: number;
    chemistry: number;
    conversationFlow: number;
  };
  insights: {
    strengths: string[];
    improvementAreas: string[];
    specificTips: string[];
  };
}

const SPEED_DATE_DURATION = 300; // 5 minutes in seconds

const DOUGIE_CONFIG = {
  id: 'dougie',
  name: 'Dougie',
  avatarUrl: '/avatars/DougieG.glb',
  humeConfigId: '320d816a-8dac-44e6-b59b-1c3d2b6b24d9', // Dougie's correct Hume config ID
  systemPrompt: `You are Dougie, a charming and witty speed date partner. You're confident, playful, and genuinely interested in getting to know your date. Keep responses concise and engaging, ask thoughtful questions, and maintain a light, flirty energy. You have a great sense of humor and aren't afraid to be a little cheeky. Remember, this is a 5-minute speed date, so make every moment count!`,
  personality: {
    traits: ['confident', 'witty', 'charming', 'playful', 'curious'],
    conversationStyle: 'flirty and engaging',
    humorLevel: 'high',
    questioningStyle: 'thoughtful and playful'
  }
};

const DougieSpeedDateV3: React.FC = () => {
  // Core date state
  const [isConnected, setIsConnected] = useState(false);
  const [dateStarted, setDateStarted] = useState(false);
  const [dateEnded, setDateEnded] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(SPEED_DATE_DURATION);
  const [conversationSegments, setConversationSegments] = useState<ConversationSegment[]>([]);
  const [emotionHistory, setEmotionHistory] = useState<any[]>([]);
  const [currentEngagementLevel, setCurrentEngagementLevel] = useState(0);
  const [conversationFlow, setConversationFlow] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [cameraLocked, setCameraLocked] = useState(false);
  const [cameraZoomedIn, setCameraZoomedIn] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState('controls');

  // UI toggle states
  const [showSidebar, setShowSidebar] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showPiP, setShowPiP] = useState(true);
  const [pipSize, setPipSize] = useState<'small' | 'medium' | 'large' | 'hidden'>('medium'); // Default to medium for better visibility
  const [showControls, setShowControls] = useState(true);
  const [showEngagementDashboard, setShowEngagementDashboard] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false); // New practice mode toggle

  // Tracking system state
  const [showTrackingPreferences, setShowTrackingPreferences] = useState(false);
  const [trackingPreferences, setTrackingPreferences] = useState<DateTrackingPreferences | null>(null);
  const [trackingConfiguration, setTrackingConfiguration] = useState<TrackingConfiguration | null>(null);
  const [trackingCoordinator] = useState(() => new UnifiedTrackingCoordinator());
  const [trackingInsights, setTrackingInsights] = useState(null);

  // Emotion tracking
  const [userFacialEmotions, setUserFacialEmotions] = useState<{ name: string; score: number }[]>([]);
  const [userProsodyEmotions, setUserProsodyEmotions] = useState<{ name: string; score: number }[]>([]);
  const [dougieEmotions, setDougieEmotions] = useState<{ name: string; score: number }[]>([]);

  // Transcript and communication
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');

  // Audio and animation
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(128));
  const [animationName, setAnimationName] = useState('idle');
  const [emotionalBlendshapes, setEmotionalBlendshapes] = useState<Record<string, number>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Audio analysis refs (from V2)
  const audioPlayerRef = useRef<HTMLAudioElement>(new Audio());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceCreatedRef = useRef<boolean>(false);

  // Mic analyzer refs
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micAudioContextRef = useRef<AudioContext | null>(null);

  // Debug audioData changes
  useEffect(() => {
    const maxValue = Math.max(...Array.from(audioData));
    const nonZeroCount = Array.from(audioData).filter(val => val > 0).length;
    console.log('[DougieSpeedDateV3] 🎵 AudioData updated:', {
      maxValue,
      nonZeroCount,
      isSpeaking,
      animationName,
      firstFewValues: Array.from(audioData.slice(0, 8))
    });
  }, [audioData, isSpeaking, animationName]);

  // Timing
  const [dateStartTime, setDateStartTime] = useState<number>(0);

  // User avatar state
  const [showUserAvatar, setShowUserAvatar] = useState(false);
  
  // Eye tracking state for avatar interaction
  const [isEyeTrackingEnabled, setIsEyeTrackingEnabled] = useState(false);
  const [isLookingAtAvatar, setIsLookingAtAvatar] = useState(false);
  const [eyeContactPercentage, setEyeContactPercentage] = useState(0);
  const [gazeCalibrated, setGazeCalibrated] = useState(false);
  
  // Refs for eye tracking
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webgazerRef = useRef<any>(null);
  const gazeDataRef = useRef({ totalSamples: 0, onTargetSamples: 0 });
  const avatarBoundsRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const isLookingAtAvatarRef = useRef(false);

  const controlsRef = useRef<any>(null);

  // Enhanced analytics tracking
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [currentSegmentStart, setCurrentSegmentStart] = useState<number | null>(null);
  const [lastSpeechEvent, setLastSpeechEvent] = useState<{ speaker: 'user' | 'dougie', timestamp: number } | null>(null);

  // Analytics view state
  const [analyticsViewMode, setAnalyticsViewMode] = useState<'speaker' | 'listener' | 'combined'>('combined');
  const [showDetailedAnalytics, setShowDetailedAnalytics] = useState(false);

  // Real-time analysis state
  const [listeningQuality, setListeningQuality] = useState(0);

  // Engagement analytics state
  const [engagementAnalytics, setEngagementAnalytics] = useState<EngagementAnalytics | null>(null);

  // CV Analytics State
  const [cvAnalyticsMode, setCvAnalyticsMode] = useState<CVAnalyticsMode>('none');
  const [cvAnalyticsData, setCvAnalyticsData] = useState<CVAnalyticsData | null>(null);

  // Service references
  const voiceServiceRef = useRef<HybridVoiceService | null>(null);
  const expressionServiceRef = useRef<HumeExpressionService | null>(null);
  const postureServiceRef = useRef<PostureTrackingService | null>(null);
  const eyeTrackingRef = useRef<any>(null); // WebGazer instance
  const cvVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const emotionSnapshotRef = useRef<NodeJS.Timeout | null>(null);

  // SAFETY-NET: ensure connections close even if user closes tab or navigates
  // ---------------------------------------------------------------------------
  const safeCleanup = useCallback(() => {
    try {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.disconnect();
      }
      humeConnectionManager.emergencyCleanupAll();
      console.log('[DougieSpeedDateV3] Safe cleanup executed');
    } catch (err) {
      console.warn('[DougieSpeedDateV3] Safe cleanup error:', err);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('beforeunload', safeCleanup);
    return () => {
      safeCleanup(); // also run on React unmount
      window.removeEventListener('beforeunload', safeCleanup);
    };
  }, [safeCleanup]);

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
    console.log('[DougieSpeedDateV3] Initializing services...');

    // Create our audio player first and mark it
    const audioPlayer = new Audio();
    audioPlayer.dataset.dougieSpeedDate = 'true';
    audioPlayerRef.current = audioPlayer;

    // Mute any other audio elements that get created
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLAudioElement && !node.dataset.dougieSpeedDate) {
            console.log('[DougieSpeedDateV3] Muting external audio element');
            node.muted = true;
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const setupServices = async () => {
      try {
        // Initialize voice service
        console.log('[DougieSpeedDateV3] Initializing voice service...');
        voiceServiceRef.current = new HybridVoiceService();
        
        console.log('[DougieSpeedDateV3] Voice service created, setting up callbacks...');
        
        if (voiceServiceRef.current) {
          console.log('[HUME-DEBUG] 🔍 Voice service exists, registering callbacks...');
          
          // Setup voice service callbacks
          voiceServiceRef.current.onAudio((audioBlob: Blob) => {
            console.log('[DougieSpeedDateV3] 🎵 Audio received from Hume, size:', audioBlob.size, 'type:', audioBlob.type);
            
            if (audioBlob.size > 0) {
              console.log('[DougieSpeedDateV3] ✅ Valid audio blob, starting playback...');
              playAudio(audioBlob);
            } else {
              console.warn('[DougieSpeedDateV3] ⚠️ Empty audio blob received from Hume');
            }
          });
          
          console.log('[HUME-DEBUG] ✅ Audio callback registered');
          
          // Also register message callback to see if Hume is working at all
          voiceServiceRef.current.onMessage((message: any) => {
            console.log('[HUME-DEBUG] 📨 Message received from Hume:', message);
          });
          
          console.log('[HUME-DEBUG] ✅ Message callback registered');
          
          // Register error callback
          voiceServiceRef.current.onError((error: any) => {
            console.log('[HUME-DEBUG] ❌ Hume error:', error);
          });
          
          console.log('[HUME-DEBUG] ✅ Error callback registered');
        } else {
          console.log('[HUME-DEBUG] ❌ Voice service is null!');
        }
        
        // Initialize expression service
        expressionServiceRef.current = new HumeExpressionService();

        console.log('[DougieSpeedDateV3] Services initialized');
      } catch (error) {
        console.error('[DougieSpeedDateV3] Service initialization failed:', error);
      }
    };

    setupServices();

    return () => {
      observer.disconnect();
      safeCleanup();
    };
  }, [safeCleanup]);

  // Connection handlers
  const handleConnectClick = async () => {
    try {
      console.log('[DougieSpeedDateV3] 🚀 CONNECT BUTTON CLICKED - Starting connection...');
      
      if (voiceServiceRef.current) {
        console.log('[DougieSpeedDateV3] Voice service exists, attempting to connect...');
        
        // Connect to the service
        console.log('[DougieSpeedDateV3] Calling voiceService.connect() with config:', DOUGIE_CONFIG.humeConfigId);
        await voiceServiceRef.current.connect(DOUGIE_CONFIG.humeConfigId);
        
        console.log('[DougieSpeedDateV3] ✅ Voice service connected successfully!');
        setIsConnected(true);
        setDateStarted(true);
        setDateStartTime(Date.now());
        
        console.log('[DougieSpeedDateV3] 🎤 Testing voice service - sending test message...');
        
        // Send a test message to trigger audio
        setTimeout(() => {
          console.log('[DougieSpeedDateV3] 📤 Sending test message to Hume...');
          if (voiceServiceRef.current) {
            voiceServiceRef.current.sendMessage("Hello, this is a test message to generate audio");
          }
        }, 2000);
        
      } else {
        console.error('[DougieSpeedDateV3] ❌ Voice service is null!');
      }
    } catch (error) {
      console.error('[DougieSpeedDateV3] ❌ Connection failed:', error);
      setIsConnected(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (voiceServiceRef.current) {
        await voiceServiceRef.current.disconnect();
        setIsConnected(false);
        console.log('[DougieSpeedDateV3] Voice service disconnected');
      }
    } catch (error) {
      console.error('[DougieSpeedDateV3] Failed to disconnect:', error);
    }
  };

  // Start the speed date
  const startDate = async () => {
    try {
      console.log('[DougieSpeedDateV3] Starting date with tracking config:', trackingConfiguration);

      // Initialize tracking if configuration is available
      if (trackingConfiguration) {
        try {
          await trackingCoordinator.initializeTracking(trackingConfiguration);
          // Enable engagement analytics for enhanced user feedback
          trackingCoordinator.setEngagementAnalytics(true);
          // Reset engagement analytics for new session
          trackingCoordinator.resetEngagementTracking();
          console.log('[DougieSpeedDateV3] Tracking system initialized successfully');
          
          // Initialize CV analytics in combined mode for engagement tracking
          if (cvAnalyticsMode === 'none') {
            console.log('[DougieSpeedDateV3] Auto-enabling combined CV analytics mode for engagement tracking');
            setCvAnalyticsMode('combined');
            try {
              await initializeCVAnalytics('combined');
              console.log('[DougieSpeedDateV3] ✅ CV analytics initialized successfully');
            } catch (error) {
              console.error('[DougieSpeedDateV3] ❌ Failed to initialize CV analytics:', error);
            }
          }
        } catch (trackingError) {
          console.warn('[DougieSpeedDateV3] Tracking initialization failed, continuing without:', trackingError);
        }
      }

      // Ensure AudioContext is resumed (user interaction required)
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        console.log('[DougieSpeedDateV3] AudioContext resumed');
      }

      setDateStarted(true);
      setDateStartTime(Date.now());

      // Ensure camera is ready for facial expression tracking
      if (cvAnalyticsMode === 'none') {
        console.log('[DougieSpeedDateV3] Initializing camera for facial emotion tracking...');
        try {
          await initializeCVAnalytics('combined');
          console.log('[DougieSpeedDateV3] ✅ Camera initialized successfully for facial tracking');
          
          // Verify camera is working
          if (cvVideoRef.current) {
            console.log('[DougieSpeedDateV3] Camera verification:', {
              videoWidth: cvVideoRef.current.videoWidth,
              videoHeight: cvVideoRef.current.videoHeight,
              readyState: cvVideoRef.current.readyState,
              paused: cvVideoRef.current.paused,
              srcObject: !!cvVideoRef.current.srcObject
            });
          }
        } catch (error) {
          console.error('[DougieSpeedDateV3] Failed to initialize camera for facial tracking:', error);
        }
      }

      // Small delay to ensure camera is fully initialized
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Initialize microphone for user audio analysis
      console.log('[DougieSpeedDateV3] Initializing microphone for user audio analysis...');
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: true, 
            noiseSuppression: true,
            sampleRate: 44100 
          } 
        });
        
        // Create audio context for microphone analysis
        const micAudioContext = new AudioContext();
        const micSource = micAudioContext.createMediaStreamSource(micStream);
        const micAnalyser = micAudioContext.createAnalyser();
        micAnalyser.fftSize = 512;
        micAnalyser.smoothingTimeConstant = 0.3;
        
        micSource.connect(micAnalyser);
        
        // Store microphone analysis setup
        micAnalyserRef.current = micAnalyser;
        micAudioContextRef.current = micAudioContext;
        
        console.log('[DougieSpeedDateV3] Microphone audio analysis initialized');
        
        // Test microphone analysis
        setTimeout(() => {
          if (micAnalyserRef.current) {
            const testArray = new Uint8Array(micAnalyserRef.current.frequencyBinCount);
            micAnalyserRef.current.getByteFrequencyData(testArray);
            console.log('[DougieSpeedDateV3] Microphone test - First 10 values:', Array.from(testArray.slice(0, 10)));
          }
        }, 1000);
        
      } catch (micError) {
        console.error('[DougieSpeedDateV3] Failed to initialize microphone:', micError);
      }

      // Start facial expression tracking
      console.log('[DougieSpeedDateV3] Initializing user facial expression tracking...');
      console.log('[DougieSpeedDateV3] Video element available (cvVideoRef):', !!cvVideoRef.current);
      console.log('[DougieSpeedDateV3] Expression service available:', !!expressionServiceRef.current);
      
      if (cvVideoRef.current && expressionServiceRef.current) {
        console.log('[DougieSpeedDateV3] Starting facial expression tracking...');
        await expressionServiceRef.current!.startTracking(cvVideoRef.current);
        console.log('[DougieSpeedDateV3] Facial expression tracking started successfully');
        
        expressionServiceRef.current!.setOnEmotionCallback((emotions: any[]) => {
          console.log('[DougieSpeedDateV3] Raw user emotions received:', emotions);
          
          const formattedEmotions = emotions.map(e => ({ 
            name: 'emotion' in e ? (e as any).emotion : e.name, 
            score: e.score 
          }));
          console.log('[DougieSpeedDateV3] Formatted user emotions:', formattedEmotions);
          setUserFacialEmotions(formattedEmotions);
          
          // Update the most recent user transcript segment with facial emotions
          setTranscriptSegments(prev => {
            console.log('[DougieSpeedDateV3] Current transcript segments:', prev.length);
            
            if (prev.length > 0) {
              const lastSegment = prev[prev.length - 1];
              console.log('[DougieSpeedDateV3] Last segment:', lastSegment.speaker, 'emotions:', lastSegment.emotions?.length || 0);
              
              if (lastSegment.speaker === 'user' && (!lastSegment.emotions || lastSegment.emotions.length === 0)) {
                console.log('[DougieSpeedDateV3] Adding user facial emotions to existing transcript segment');
                const updatedSegments = [...prev];
                updatedSegments[updatedSegments.length - 1] = {
                  ...lastSegment,
                  emotions: formattedEmotions,
                  facialEmotions: formattedEmotions
                };
                return updatedSegments;
              }
            }
            
            // If no suitable segment exists, create a new user segment with emotions
            console.log('[DougieSpeedDateV3] Creating new user transcript segment for emotions');
            const newUserSegment = {
              id: `user-emotions-${Date.now()}`,
              speaker: 'user' as const,
              text: '[User facial expressions detected]',
              timestamp: Date.now(),
              emotions: formattedEmotions,
              facialEmotions: formattedEmotions,
              audioUrl: null
            };
            
            return [...prev, newUserSegment];
          });
          
          // Process engagement analytics if enabled
          const currentEngagement = trackingCoordinator.getCurrentEngagement();
          if (currentEngagement) {
            console.log('[DougieSpeedDateV3] Engagement analytics updated:', currentEngagement);
            setEngagementAnalytics(currentEngagement);
          } else {
            console.log('[DougieSpeedDateV3] No engagement analytics available from tracking coordinator');
            
            // If tracking coordinator doesn't have data, try to generate engagement from current data
            const avgEmotionScore = formattedEmotions.reduce((sum, e) => sum + e.score, 0) / formattedEmotions.length;
            console.log('[DougieSpeedDateV3] Average emotion score:', avgEmotionScore, 'from', formattedEmotions.length, 'emotions');
            console.log('[DougieSpeedDateV3] Sample emotion scores:', formattedEmotions.slice(0, 5).map(e => ({ name: e.name, score: e.score })));
            
            // Normalize emotion scores - they appear to be 0-100 already, not 0-1
            const normalizedScore = Math.max(0, Math.min(100, avgEmotionScore));
            
            const directEngagement: any = {
              overall: Math.round(normalizedScore),
              emotional: Math.round(normalizedScore),
              eyeContact: cvAnalyticsData?.eyeContact?.percentage || 0,
              posture: cvAnalyticsData?.posture?.confidenceScore || 0
            };
            console.log('[DougieSpeedDateV3] Generated direct engagement from emotions:', directEngagement);
            setEngagementAnalytics(directEngagement);
          }
        });
      } else {
        console.error('[DougieSpeedDateV3] Cannot start facial expression tracking - missing video or expression service');
      }

      // Start the date
      setTimeout(() => {
        console.log('[DougieSpeedDateV3] Sending initial greeting to trigger conversation');
        if (voiceServiceRef.current && isConnected) {
          console.log('[DougieSpeedDateV3] 📤 Sending initial greeting to start conversation...');
          setTimeout(() => {
            voiceServiceRef.current?.sendMessage("Hi Dougie! I'm ready to start our speed date conversation. Please introduce yourself and ask me a question.");
          }, 1000);
        } else {
          console.warn('[DougieSpeedDateV3] ⚠️ Cannot send initial message - voice service not connected');
        }

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
          const snapshot: any = {
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

  // Play audio with lip sync analysis - RESTORED FROM V2 (WORKING VERSION)
  const playAudio = async (audioBlob: Blob) => {
    // Add unique ID to track this audio playback
    const audioId = Date.now() + Math.random();
    console.log(`[DougieSpeedDateV3] Starting audio playback ${audioId}, blob size:`, audioBlob.size);

    // ENHANCED: Validate audio blob before playing
    if (!audioBlob || audioBlob.size === 0) {
      console.warn('[DougieSpeedDateV3] Invalid or empty audio blob received');
      return;
    }

    // Create URL for the audio blob
    const audioUrl = URL.createObjectURL(audioBlob);
    audioPlayerRef.current.src = audioUrl;

    // Setup audio analyzer for lip sync BEFORE playing
    if (!audioSourceCreatedRef.current) {
      try {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioContext();
          console.log('[DougieSpeedDateV3] Created new AudioContext, state:', audioContextRef.current.state);
        }

        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
          console.log('[DougieSpeedDateV3] Resumed AudioContext, new state:', audioContextRef.current.state);
        }

        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        console.log('[DougieSpeedDateV3] Created analyser, frequencyBinCount:', analyser.frequencyBinCount);
        
        const source = audioContextRef.current.createMediaElementSource(audioPlayerRef.current);
        source.connect(analyser);
        analyser.connect(audioContextRef.current.destination);
        console.log('[DougieSpeedDateV3] Audio analyzer connected successfully');

        analyserRef.current = analyser;
        audioSourceCreatedRef.current = true;
        console.log('[DougieSpeedDateV3] Audio analyzer setup complete');
      } catch (error) {
        console.error('[DougieSpeedDateV3] Error setting up audio analyzer:', error);
      }
    }

    // Use a local flag for the animation loop
    let isPlaying = true;

    // ENHANCED: Add timeout to prevent indefinite waiting
    const playPromise = audioPlayerRef.current.play();
    
    // ENHANCED: Better error handling and timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Audio play timeout')), 10000);
    });

    try {
      await Promise.race([playPromise, timeoutPromise]);
      console.log('[DougieSpeedDateV3] Audio playing successfully');

      // Start lip sync animation
      const updateLipSync = () => {
        if (!isPlaying || !analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Ensure we have real audio data before setting
        const maxValue = Math.max(...dataArray);
        const nonZeroCount = dataArray.filter(val => val > 0).length;
        
        console.log(`[DougieSpeedDateV3] Audio analysis: max=${maxValue}, nonZero=${nonZeroCount}, playing=${isPlaying}`);
        
        if (maxValue > 0) {
          setAudioData(new Uint8Array(dataArray)); // Create a copy to trigger re-render
        } else {
          console.warn('[DougieSpeedDateV3] No audio frequency data detected');
        }

        requestAnimationFrame(updateLipSync);
      };
      updateLipSync();
    } catch (e) {
      console.error('[DougieSpeedDateV3] Error playing audio:', e);
      isPlaying = false;
      // Clean up on error
      URL.revokeObjectURL(audioUrl);
      setIsSpeaking(false);
      setAnimationName('idle');
    }

    // Handle audio end
    audioPlayerRef.current.onended = () => {
      console.log('[DougieSpeedDateV3] Audio playback ended');
      isPlaying = false;
      URL.revokeObjectURL(audioUrl);
      setIsSpeaking(false);
      setAnimationName('idle');
      setAudioData(new Uint8Array(128)); // Reset to silence
    };

    // Start talking animation
    setIsSpeaking(true);
    setAnimationName('talking');
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

  // Cleanup function
  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (emotionSnapshotRef.current) clearInterval(emotionSnapshotRef.current);

    // Use connection manager for proper cleanup
    humeConnectionManager.releaseConnection('DougieSpeedDateV3').catch(err => 
      console.warn('[DougieSpeedDateV3] Connection cleanup failed:', err)
    );

    if (expressionServiceRef.current) expressionServiceRef.current.stopTracking();
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    stopCVAnalytics();
    
    // Reset engagement analytics
    trackingCoordinator.resetEngagementTracking();
    setEngagementAnalytics(null);
  };

  // Emergency reset
  const emergencyReset = () => {
    console.log('[DougieSpeedDateV3] Emergency reset triggered');
    cleanup();
    window.location.reload();
  };

  // CV Analytics Functions
  const initializeCVAnalytics = async (mode: CVAnalyticsMode) => {
    console.log('[DougieSpeedDateV3] Initializing CV Analytics mode:', mode);
    
    try {
      if (mode === 'none') {
        await stopCVAnalytics();
        return;
      }

      // Don't re-initialize if we're already in the same mode
      if (cvAnalyticsMode === mode && eyeTrackingRef.current) {
        console.log('[DougieSpeedDateV3] CV Analytics already running in mode:', mode);
        return;
      }

      // Initialize camera stream for CV analytics
      let videoElement = cvVideoRef.current;
      if (!videoElement) {
        // Create a hidden video element for CV analytics
        videoElement = document.createElement('video');
        videoElement.style.display = 'none';
        videoElement.style.position = 'absolute';
        videoElement.width = 640;
        videoElement.height = 480;
        document.body.appendChild(videoElement);
        cvVideoRef.current = videoElement;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      videoElement.srcObject = stream;
      await videoElement.play();

      // Initialize based on mode
      if (mode === 'eye-contact' || mode === 'combined') {
        await initializeEyeTracking();
      }
      
      if (mode === 'posture' || mode === 'combined') {
        await initializePostureTracking();
      }

      setCvAnalyticsMode(mode);
      console.log('[DougieSpeedDateV3] CV Analytics initialized for mode:', mode);
      
    } catch (error) {
      console.error('[DougieSpeedDateV3] Failed to initialize CV Analytics:', error);
    }
  };

  const initializeEyeTracking = async () => {
    try {
      console.log('[DougieSpeedDateV3] Checking WebGazer availability...');
      console.log('window.webgazer:', typeof window.webgazer);
      
      // Initialize WebGazer
      if (window.webgazer) {
        console.log('[DougieSpeedDateV3] Initializing WebGazer...');
        
        const webgazer = window.webgazer;
        webgazerRef.current = webgazer;
        
        // Check if WebGazer is already initialized
        if (eyeTrackingRef.current) {
          console.log('[DougieSpeedDateV3] WebGazer already initialized, skipping...');
          return;
        }
        
        eyeTrackingRef.current = webgazer;
        
        // Ensure WebGazer is properly stopped before starting
        try {
          await webgazer.end();
        } catch (e) {
          // Ignore errors from ending a non-started WebGazer
          console.log('[DougieSpeedDateV3] WebGazer end() called on non-initialized instance (expected)');
        }
        
        await webgazer.setRegression('ridge')
          .setTracker('clmtrackr')
          .begin();
          
        webgazer.showPredictionPoints(false);
        webgazer.showFaceOverlay(false);
        webgazer.showFaceFeedbackBox(false);
        
        // Start gaze prediction
        webgazer.setGazeListener((data: any) => {
          if (data) {
            console.log('[DougieSpeedDateV3] WEBGAZER DATA RECEIVED:', {
              x: data.x?.toFixed(2),
              y: data.y?.toFixed(2),
              timestamp: Date.now()
            });
            updateEyeContactAnalytics(data);
          } else {
            console.log('[DougieSpeedDateV3] WebGazer data is null/undefined');
          }
        });
        
        // Test WebGazer after initialization
        setTimeout(() => {
          console.log('[DougieSpeedDateV3] Testing WebGazer status...');
          console.log('[DougieSpeedDateV3] WebGazer ready:', webgazer.isReady());
          const video = cvVideoRef.current;
          console.log('[DougieSpeedDateV3] Video element dimensions:', {
            width: video?.videoWidth,
            height: video?.videoHeight,
            playing: !video?.paused
          });
        }, 2000);
        
        console.log('[DougieSpeedDateV3] WebGazer initialized successfully');
      } else {
        console.error('[DougieSpeedDateV3] WebGazer not available - make sure it\'s loaded in index.html');
      }
    } catch (error) {
      console.error('[DougieSpeedDateV3] Eye tracking initialization failed:', error);
    }
  };

  const initializePostureTracking = async () => {
    try {
      console.log('[DougieSpeedDateV3] Initializing ML5 posture tracking directly...');
      
      // Check if ML5 is available
      if (typeof window.ml5 === 'undefined') {
        console.error('[DougieSpeedDateV3] ML5 is not loaded! Check index.html');
        return;
      }
      
      console.log('[DougieSpeedDateV3] ML5 is available, version:', window.ml5?.version || 'unknown');
      
      const videoElement = cvVideoRef.current;
      if (!videoElement) {
        console.error('[DougieSpeedDateV3] No video element available for posture tracking');
        return;
      }
      
      console.log('[DougieSpeedDateV3] Video element ready:', {
        videoWidth: videoElement.videoWidth,
        videoHeight: videoElement.videoHeight,
        readyState: videoElement.readyState,
        paused: videoElement.paused,
        srcObject: !!videoElement.srcObject
      });
      
      // Wait for video to be ready
      if (videoElement.readyState < 2) {
        console.log('[DougieSpeedDateV3] Waiting for video to load metadata...');
        await new Promise((resolve) => {
          videoElement.onloadedmetadata = resolve;
        });
      }
      
      console.log('[DougieSpeedDateV3] Creating ML5 poseNet with video:', videoElement.videoWidth, 'x', videoElement.videoHeight);
      
      // Create ML5 poseNet directly
      console.log('[DougieSpeedDateV3] Creating ML5 poseNet...');
      const poseNet = window.ml5.poseNet(videoElement, {
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: 513,
        multiplier: 0.75
      }, () => {
        console.log('[DougieSpeedDateV3] ML5 poseNet model loaded successfully!');
        console.log('[DougieSpeedDateV3] Video dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
      });
      
      // Add error handling for poseNet
      poseNet.on('error', (error: any) => {
        console.error('[DougieSpeedDateV3] ML5 poseNet error:', error);
      });
      
      // Listen for pose predictions with enhanced debugging
      poseNet.on('pose', (results: any[]) => {
        console.log('[DougieSpeedDateV3] ML5 pose callback triggered, results:', results?.length || 0);
        
        if (results && results.length > 0) {
          const pose = results[0];
          console.log('[DougieSpeedDateV3] POSE DETECTED!', {
            confidence: pose.pose.score,
            keypoints: pose.pose.keypoints?.length || 0,
            hasNose: !!pose.pose.keypoints?.find((kp: any) => kp.part === 'nose'),
            hasShoulders: !!pose.pose.keypoints?.find((kp: any) => kp.part === 'leftShoulder')
          });
          
          // Process posture data for engagement analytics
          updatePostureAnalytics(pose.pose);
          
          // Update engagement analytics directly
          const engagementData = calculateEngagementFromPose(pose.pose);
          if (engagementData) {
            console.log('[DougieSpeedDateV3] ENGAGEMENT DATA CALCULATED:', engagementData);
            setEngagementAnalytics(engagementData as any);
          } else {
            console.log('[DougieSpeedDateV3] Failed to calculate engagement from pose');
          }
        } else {
          console.log('[DougieSpeedDateV3] No poses detected in current frame');
        }
      });
      
      // Test pose detection after a delay
      setTimeout(() => {
        console.log('[DougieSpeedDateV3] Testing pose detection after 3 seconds...');
        console.log('[DougieSpeedDateV3] Video playing:', !videoElement.paused);
        console.log('[DougieSpeedDateV3] Video time:', videoElement.currentTime);
      }, 3000);
      
      // Store poseNet reference with proper cleanup
      postureServiceRef.current = { 
        poseNet, 
        dispose: () => {
          console.log('[DougieSpeedDateV3] Disposing ML5 poseNet...');
          poseNet?.dispose();
        }
      } as any;
      
      console.log('[DougieSpeedDateV3] ML5 posture tracking initialized successfully');
      
    } catch (error) {
      console.error('[DougieSpeedDateV3] ML5 posture tracking initialization failed:', error);
    }
  };

  const updateEyeContactAnalytics = (gazeData: any) => {
    console.log('[DougieSpeedDateV3] Updating eye contact analytics with data:', gazeData);
    
    // Simple eye contact detection (looking at center area of screen)
    const screenCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const tolerance = 100;
    
    const isLookingAtCenter = gazeData.x && gazeData.y &&
      Math.abs(gazeData.x - screenCenter.x) < tolerance &&
      Math.abs(gazeData.y - screenCenter.y) < tolerance;
    
    console.log('[DougieSpeedDateV3] Eye contact detected:', isLookingAtCenter, 'Screen center:', screenCenter, 'Gaze:', { x: gazeData.x, y: gazeData.y });
    
    setCvAnalyticsData(prev => {
      if (!prev) {
        const newData: CVAnalyticsData = {
          eyeContact: {
            percentage: isLookingAtCenter ? 100 : 0,
            gazeOnTarget: isLookingAtCenter,
            lookAwayCount: 0,
            averageContactDuration: 0
          },
          posture: {
            shoulderAlignment: 0,
            headPosition: { x: 0, y: 0 },
            bodyOpenness: 0,
            leaning: 'neutral',
            confidenceScore: 0
          }
        };
        console.log('[DougieSpeedDateV3] Initializing CV analytics data:', newData);
        return newData;
      }
      
      const updatedData = {
        ...prev,
        eyeContact: {
          ...prev.eyeContact,
          gazeOnTarget: isLookingAtCenter,
          percentage: isLookingAtCenter ? Math.min(100, prev.eyeContact.percentage + 2) : Math.max(0, prev.eyeContact.percentage - 1)
        }
      };
      console.log('[DougieSpeedDateV3] Updated CV analytics data:', updatedData);
      return updatedData;
    });
  };

  const updatePostureAnalytics = (postureData: any) => {
    if (!postureData || !postureData.keypoints) return;
    
    // Calculate posture metrics
    const leftShoulder = postureData.keypoints.leftShoulder;
    const rightShoulder = postureData.keypoints.rightShoulder;
    const nose = postureData.keypoints.nose;
    
    let shoulderAlignment = 50; // Default neutral
    let bodyOpenness = 50;
    let leaning: 'neutral' | 'forward' | 'backward' = 'neutral';
    let confidenceScore = 50;
    
    if (leftShoulder && rightShoulder && nose) {
      // Calculate shoulder alignment (0-100, 50 is perfect)
      const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
      shoulderAlignment = Math.max(0, 100 - (shoulderDiff * 10));
      
      // Calculate body openness based on shoulder width
      const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
      bodyOpenness = Math.min(100, shoulderWidth / 2);
      
      // Determine leaning based on nose position relative to shoulders
      const shoulderCenter = (leftShoulder.x + rightShoulder.x) / 2;
      const noseDiff = nose.x - shoulderCenter;
      if (Math.abs(noseDiff) > 20) {
        leaning = noseDiff > 0 ? 'forward' : 'backward';
      }
      
      // Calculate confidence score (combination of alignment and openness)
      confidenceScore = (shoulderAlignment + bodyOpenness) / 2;
    }
    
    setCvAnalyticsData(prev => {
      if (!prev) {
        return {
          eyeContact: {
            percentage: 0,
            gazeOnTarget: false,
            lookAwayCount: 0,
            averageContactDuration: 0
          },
          posture: {
            shoulderAlignment,
            headPosition: { x: nose?.x || 0, y: nose?.y || 0 },
            bodyOpenness,
            leaning,
            confidenceScore
          }
        };
      }
      
      return {
        ...prev,
        posture: {
          shoulderAlignment,
          headPosition: { x: nose?.x || 0, y: nose?.y || 0 },
          bodyOpenness,
          leaning,
          confidenceScore
        }
      };
    });
  };

  const calculateEngagementFromPose = (pose: any) => {
    if (!pose.keypoints || pose.keypoints.length === 0) return null;
    
    // Find key landmarks
    const nose = pose.keypoints.find((kp: any) => kp.part === 'nose');
    const leftShoulder = pose.keypoints.find((kp: any) => kp.part === 'leftShoulder');
    const rightShoulder = pose.keypoints.find((kp: any) => kp.part === 'rightShoulder');
    
    if (!nose || !leftShoulder || !rightShoulder) return null;
    
    // Calculate posture metrics
    const shoulderWidth = Math.abs(rightShoulder.position.x - leftShoulder.position.x);
    const shoulderCenter = (leftShoulder.position.x + rightShoulder.position.x) / 2;
    const headAlignment = Math.abs(nose.position.x - shoulderCenter);
    
    // Calculate engagement score (0-100)
    const postureScore = Math.max(0, 100 - (headAlignment / shoulderWidth) * 100);
    const overallEngagement = Math.min(100, postureScore + (cvAnalyticsData?.eyeContact?.percentage || 0)) / 2;
    
    return {
      nodding: { frequency: 0, confidence: 0 },
      posture: { score: postureScore, confidence: pose.score || 0 },
      eyeContact: { percentage: cvAnalyticsData?.eyeContact?.percentage || 0, duration: 0 },
      overallEngagement,
      engagementTrend: 'stable',
      lastUpdate: Date.now()
    };
  };

  const stopCVAnalytics = async () => {
    console.log('[DougieSpeedDateV3] Stopping CV Analytics...');
    
    // Stop eye tracking
    if (eyeTrackingRef.current) {
      try {
        await eyeTrackingRef.current.end();
        eyeTrackingRef.current = null;
        console.log('[DougieSpeedDateV3] WebGazer stopped successfully');
      } catch (error) {
        console.warn('[DougieSpeedDateV3] Error stopping WebGazer (might already be stopped):', error);
        eyeTrackingRef.current = null;
      }
    }
    
    // Stop posture tracking
    if (postureServiceRef.current) {
      try {
        (postureServiceRef.current as any).dispose();
        postureServiceRef.current = null;
      } catch (error) {
        console.warn('[DougieSpeedDateV3] Error stopping posture tracking:', error);
      }
    }
    
    // Reset analytics data
    setCvAnalyticsData(null);
    setCvAnalyticsMode('none');
  };

  const setCameraForEyeTracking = (enabled: boolean) => {
    if (!controlsRef.current) return;
    
    if (enabled) {
      // Move camera extremely close to focus on face for eye tracking
      controlsRef.current.object.position.set(0, 1.67, 0.5); // Extremely close
      controlsRef.current.target.set(0, 1.68, 0); // Focus on upper face/eyes
      controlsRef.current.minDistance = 0.2; // Allow extremely close
      controlsRef.current.maxDistance = 1.2; // Tight max range
    } else {
      // Return to normal viewing distance
      controlsRef.current.object.position.set(0, 1.6, 1.8);
      controlsRef.current.target.set(0, 1.6, 0);
      controlsRef.current.minDistance = 0.8;
      controlsRef.current.maxDistance = 4;
    }
    controlsRef.current.update();
  };

  // Format time remaining
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Update refs for eye tracking
  useEffect(() => {
    isLookingAtAvatarRef.current = isLookingAtAvatar;
  }, [isLookingAtAvatar]);

  useEffect(() => {
    return () => {
      console.log('[DougieSpeedDateV3] Component unmounting, cleaning up WebGazer...');
      if (eyeTrackingRef.current) {
        try {
          eyeTrackingRef.current.end();
        } catch (error) {
          console.warn('[DougieSpeedDateV3] WebGazer cleanup error on unmount:', error);
        }
      }
    };
  }, []);

  useEffect(() => {
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      
      // Also force the main container to exact window height
      const container = document.querySelector('.dougie-speed-date-v3') as HTMLElement;
      if (container) {
        container.style.height = `${window.innerHeight}px`;
      }
    };

    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    
    return () => window.removeEventListener('resize', setViewportHeight);
  }, []);

  // Add periodic CV analytics update
  useEffect(() => {
    if (cvAnalyticsMode !== 'none' && dateStarted) {
      console.log('[DougieSpeedDateV3] Starting periodic engagement analytics updates...');
      
      const interval = setInterval(() => {
        console.log('[DougieSpeedDateV3] Checking engagement analytics...');
        console.log('[DougieSpeedDateV3] Tracking coordinator available:', !!trackingCoordinator);
        
        // Update engagement analytics periodically
        const currentEngagement = trackingCoordinator.getCurrentEngagement();
        console.log('[DougieSpeedDateV3] Current engagement data:', currentEngagement);
        
        if (currentEngagement) {
          console.log('[DougieSpeedDateV3] Periodic engagement analytics update:', currentEngagement);
          setEngagementAnalytics(currentEngagement);
        } else {
          console.log('[DougieSpeedDateV3] No engagement analytics available from tracking coordinator');
        }
      }, 2000); // Update every 2 seconds

      return () => {
        console.log('[DougieSpeedDateV3] Stopping periodic engagement analytics updates');
        clearInterval(interval);
      };
    }
  }, [cvAnalyticsMode, dateStarted]);

  // Helper functions for engagement indicator
  const getEngagementLevel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';  
    if (score >= 40) return 'Fair';
    return 'Needs Focus';
  };

  const getEngagementColor = (score: number): string => {
    if (score >= 80) return 'excellent'; // Green
    if (score >= 60) return 'good';      // Yellow
    if (score >= 40) return 'fair';      // Orange
    return 'poor';                       // Red
  };

  // Fix function placement and use correct property name from EngagementAnalytics interface
  const getEngagementLevelFromAnalytics = (analytics: EngagementAnalytics | null): string => {
    if (!analytics) return 'Unknown';
    return getEngagementLevel(analytics.overallEngagement);
  };

  const getEngagementColorFromAnalytics = (analytics: EngagementAnalytics | null): string => {
    if (!analytics) return 'unknown';
    return getEngagementColor(analytics.overallEngagement);
  };

  useEffect(() => {
    let lipSyncInterval: NodeJS.Timeout | null = null;
    
    if (isSpeaking && audioData.every(val => val === 0)) {
      console.log('[DougieSpeedDateV3] 🎭 Starting fallback lip sync - no audio data available');
      
      // Create dynamic fallback lip sync
      const createFallbackLipSync = () => {
        const data = new Uint8Array(128);
        const intensity = 60 + Math.random() * 80; // 60-140 intensity
        
        // Jaw movement (first 64 bytes)
        for (let i = 0; i < 64; i++) {
          data[i] = intensity + Math.sin(Date.now() * 0.01 + i * 0.1) * 20;
        }
        
        // Mouth shapes (next 64 bytes)  
        for (let i = 64; i < 128; i++) {
          data[i] = intensity * 0.8 + Math.cos(Date.now() * 0.008 + i * 0.05) * 15;
        }
        
        return data;
      };
      
      lipSyncInterval = setInterval(() => {
        if (isSpeaking) {
          setAudioData(createFallbackLipSync());
        }
      }, 80); // Update every 80ms for smooth animation
      
    } else if (!isSpeaking && lipSyncInterval) {
      console.log('[DougieSpeedDateV3] 🔇 Stopping fallback lip sync');
      clearInterval(lipSyncInterval);
      setAudioData(new Uint8Array(128)); // Reset to silence
    }

    return () => {
      if (lipSyncInterval) {
        clearInterval(lipSyncInterval);
      }
    };
  }, [isSpeaking, audioData]);

  return (
    <div className="dougie-speed-date-v3">
      {/* Hidden video element for CV analytics */}
      <video
        ref={cvVideoRef}
        style={{ display: 'none' }}
        autoPlay
        muted
        playsInline
      />

      {/* Top Bar - Toggle Controls */}
      <div className="top-bar-v3">
        <div className="top-bar-left">
          <h2>DougieSpeedDate V3 - Clean Layout Test</h2>
        </div>
        <div className="top-bar-controls">
          <button 
            className={`toggle-btn ${showSidebar ? 'active' : ''}`}
            onClick={() => setShowSidebar(!showSidebar)}
            title="Toggle Sidebar"
          >
            <FaBars /> Sidebar
          </button>
          <button 
            className={`toggle-btn ${showChat ? 'active' : ''}`}
            onClick={() => setShowChat(!showChat)}
            title="Toggle Chat"
          >
            <FaComments /> Chat
          </button>
          <button 
            className={`toggle-btn ${showPiP ? 'active' : ''}`}
            onClick={() => setShowPiP(!showPiP)}
            title="Toggle PiP View"
          >
            👤 PiP View
          </button>
          <button 
            className={`toggle-btn ${practiceMode ? 'active' : ''}`}
            onClick={() => setPracticeMode(!practiceMode)}
            title="Practice Mode - Enable detailed analytics for learning"
          >
            🎯 Practice
          </button>
          <div 
            className="engagement-indicator"
            title={`Engagement: ${getEngagementLevelFromAnalytics(engagementAnalytics)}`}
          >
            <div 
              className={`engagement-dot ${getEngagementColorFromAnalytics(engagementAnalytics)}`}
            />
          </div>
          {practiceMode && (
            <button 
              className={`toggle-btn ${showEngagementDashboard ? 'active' : ''}`}
              onClick={() => setShowEngagementDashboard(!showEngagementDashboard)}
              title="Toggle Detailed Engagement Dashboard (Practice Mode)"
            >
              📊 Details
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="main-container-v3">
        {/* Left Sidebar */}
        {showSidebar && (
          <div className="left-sidebar-v3">
            {/* Tab Navigation */}
            <div className="tab-navigation">
              <button 
                className={`tab-btn ${activeLeftTab === 'controls' ? 'active' : ''}`}
                onClick={() => setActiveLeftTab('controls')}
              >
                🎮 Controls
              </button>
              <button 
                className={`tab-btn ${activeLeftTab === 'avatar' ? 'active' : ''}`}
                onClick={() => setActiveLeftTab('avatar')}
              >
                👤 Avatar
              </button>
              <button 
                className={`tab-btn ${activeLeftTab === 'emotions' ? 'active' : ''}`}
                onClick={() => setActiveLeftTab('emotions')}
              >
                😊 Emotions
              </button>
              <button 
                className={`tab-btn ${activeLeftTab === 'session' ? 'active' : ''}`}
                onClick={() => setActiveLeftTab('session')}
              >
                ⏱️ Session
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {/* Voice & Date Controls Tab */}
              {activeLeftTab === 'controls' && (
                <div className="controls-tab">
                  <h4>🎮 Voice & Date Controls</h4>
                  
                  <div className="control-group">
                    <h5>Connection</h5>
                    <div className="control-buttons">
                      <button 
                        className={`control-btn ${isConnected ? 'connected' : ''}`}
                        onClick={() => handleConnectClick()}
                        disabled={isConnected}
                      >
                        {isConnected ? '✅ Connected' : '🎤 Connect Voice'}
                      </button>
                      <button 
                        className={`control-btn ${!isConnected ? 'disabled' : ''}`}
                        onClick={() => handleDisconnect()}
                        disabled={!isConnected}
                      >
                        📞 Disconnect
                      </button>
                    </div>
                  </div>

                  <div className="control-group">
                    <h5>Date Session</h5>
                    <div className="control-buttons">
                      <button 
                        className={`control-btn ${dateStarted ? 'active' : ''}`}
                        onClick={() => startDate()}
                        disabled={!isConnected || dateStarted || dateEnded}
                      >
                        {dateStarted ? '▶️ Date Active' : '💕 Start Date'}
                      </button>
                      <button 
                        className={`control-btn ${!dateStarted ? 'disabled' : ''}`}
                        onClick={() => endDate()}
                        disabled={!dateStarted || dateEnded}
                      >
                        ⏹️ End Date
                      </button>
                    </div>
                  </div>

                  <div className="control-group">
                    <h5>Emergency</h5>
                    <button 
                      className="control-btn emergency"
                      onClick={() => emergencyReset()}
                    >
                      🚨 Emergency Reset
                    </button>
                  </div>

                  <div className="control-status">
                    <div className="status-item">
                      <span>Connection:</span>
                      <span className={isConnected ? 'status-good' : 'status-warning'}>
                        {isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    <div className="status-item">
                      <span>Date Status:</span>
                      <span className={dateStarted ? 'status-active' : 'status-inactive'}>
                        {dateStarted ? 'Active' : dateEnded ? 'Ended' : 'Not Started'}
                      </span>
                    </div>
                    {timeRemaining > 0 && (
                      <div className="status-item">
                        <span>Time Left:</span>
                        <span className="status-timer">{formatTime(timeRemaining)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Avatar PiP Tab */}
              {activeLeftTab === 'avatar' && (
                <div className="avatar-tab">
                  <h4>👤 Avatar & Camera</h4>
                  
                  <div className="avatar-controls">
                    <h5>PiP Display</h5>
                    <div className="avatar-toggle">
                      <button 
                        className={`avatar-toggle-btn ${showPiP ? 'active' : ''}`}
                        onClick={() => setShowPiP(!showPiP)}
                      >
                        {showPiP ? '👁️ PiP Visible' : '🚫 PiP Hidden'}
                      </button>
                    </div>

                    {showPiP && (
                      <>
                        <h5>Avatar Size</h5>
                        <div className="avatar-size-controls">
                          <button 
                            className={`avatar-size-btn ${pipSize === 'small' ? 'active' : ''}`}
                            onClick={() => setPipSize('small')}
                          >
                            S
                          </button>
                          <button 
                            className={`avatar-size-btn ${pipSize === 'medium' ? 'active' : ''}`}
                            onClick={() => setPipSize('medium')}
                          >
                            M
                          </button>
                          <button 
                            className={`avatar-size-btn ${pipSize === 'large' ? 'active' : ''}`}
                            onClick={() => setPipSize('large')}
                          >
                            L
                          </button>
                        </div>

                        <div className="avatar-preview">
                          <UserAvatarPiP
                            size={pipSize as 'small' | 'medium' | 'large'}
                            position={'bottom-right'}
                            className={`user-avatar-preview user-avatar-${pipSize}`}
                            onClose={() => setShowPiP(false)}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="camera-info">
                    <h5>Camera Status</h5>
                    <div className="camera-details">
                      <div className="detail-item">
                        <span>Video Element:</span>
                        <span className={videoRef.current ? 'status-good' : 'status-warning'}>
                          {videoRef.current ? 'Ready' : 'Not Ready'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span>CV Video:</span>
                        <span className={cvVideoRef.current ? 'status-good' : 'status-warning'}>
                          {cvVideoRef.current ? 'Ready' : 'Not Ready'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Emotions Tab */}
              {activeLeftTab === 'emotions' && (
                <div className="emotions-tab">
                  <h4>😊 Your Emotions</h4>
                  {userFacialEmotions.length > 0 ? (
                    <RealTimeEmotionSliders 
                      emotions={userFacialEmotions.map(e => ({ emotion: e.name, score: e.score }))}
                      participantName="You"
                      position="left"
                    />
                  ) : (
                    <div className="no-emotions">
                      <p>Connect to start tracking emotions</p>
                    </div>
                  )}

                  <h4>Dougie's Emotions</h4>
                  {dougieEmotions.length > 0 ? (
                    <RealTimeEmotionSliders 
                      emotions={dougieEmotions.map(e => ({ emotion: e.name, score: e.score }))}
                      participantName="Dougie"
                      position="right"
                    />
                  ) : (
                    <div className="no-emotions">
                      <p>Start conversation to see Dougie's emotions</p>
                    </div>
                  )}
                </div>
              )}

              {/* Session Tab */}
              {activeLeftTab === 'session' && (
                <div className="session-tab">
                  <h4>⏱️ Session Info</h4>
                  <div className="session-stats">
                    <div className="stat-item">
                      <span>Duration:</span>
                      <span>{timeRemaining > 0 ? formatTime(300 - timeRemaining) : '0:00'}</span>
                    </div>
                    <div className="stat-item">
                      <span>Time Left:</span>
                      <span className="timer-display">{formatTime(timeRemaining)}</span>
                    </div>
                    <div className="stat-item">
                      <span>Status:</span>
                      <span className={dateStarted ? 'status-active' : 'status-inactive'}>
                        {dateStarted ? 'Active' : dateEnded ? 'Ended' : 'Not Started'}
                      </span>
                    </div>
                  </div>

                  <div className="session-controls">
                    <h5>Quick Actions</h5>
                    <button 
                      className="session-btn"
                      onClick={() => setShowReport(true)}
                      disabled={!dateEnded}
                    >
                      📊 View Chemistry Report
                    </button>
                  </div>

                  <div className="debug-info">
                    <h5>Debug Info</h5>
                    <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
                    <p>Speaking: {isSpeaking ? 'Yes' : 'No'}</p>
                    <p>Animation: {animationName}</p>
                    {audioContextRef.current && (
                      <p>Audio Context: {audioContextRef.current.state}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Independent CV Analytics Panel */}
        {showControls && (
          <div className="cv-analytics-panel">
            <div className="cv-panel-header">
              <h4>📊 Computer Vision Analytics</h4>
              <button 
                className="cv-close-btn"
                onClick={() => setShowControls(false)}
                title="Close CV Panel"
              >
                ×
              </button>
            </div>
            
            <div className="cv-mode-selector">
              <h5>Tracking Mode {cvAnalyticsMode !== 'none' && <span className="status-indicator">🟢 Active</span>}</h5>
              <div className="cv-mode-buttons">
                <button
                  onClick={() => initializeCVAnalytics('none')}
                  className={`cv-mode-btn ${cvAnalyticsMode === 'none' ? 'active' : ''}`}
                  title="No tracking"
                >
                  <FaEyeSlash /> Off
                </button>
                <button
                  onClick={() => initializeCVAnalytics('eye-contact')}
                  className={`cv-mode-btn ${cvAnalyticsMode === 'eye-contact' ? 'active' : ''}`}
                  title="Eye contact tracking"
                >
                  <FaEye /> Eyes
                </button>
                <button
                  onClick={() => initializeCVAnalytics('posture')}
                  className={`cv-mode-btn ${cvAnalyticsMode === 'posture' ? 'active' : ''}`}
                  title="Posture tracking"
                >
                  <FaRunning /> Posture
                </button>
                <button
                  onClick={() => initializeCVAnalytics('combined')}
                  className={`cv-mode-btn ${cvAnalyticsMode === 'combined' ? 'active' : ''}`}
                  title="Full tracking (eyes + posture)"
                >
                  <FaUser /> Full
                </button>
              </div>
            </div>

            {/* Avatar Eye Tracking Section */}
            <div className="avatar-eye-tracking">
              <h5>👁️ Avatar Eye Contact</h5>
              <div className="eye-tracking-controls">
                <button
                  onClick={() => {
                    const newEnabled = !isEyeTrackingEnabled;
                    setIsEyeTrackingEnabled(newEnabled);
                    setCameraZoomedIn(newEnabled);
                    setCameraForEyeTracking(newEnabled);
                  }}
                  className={`eye-tracking-btn ${isEyeTrackingEnabled ? 'active' : ''}`}
                  title="Toggle avatar eye tracking"
                >
                  {isEyeTrackingEnabled ? '🎯 Tracking Active' : '🚫 Start Tracking'}
                </button>
              </div>
              
              {isEyeTrackingEnabled && (
                <div className="eye-tracking-status">
                  <div className="tracking-indicator">
                    <span className={`status-dot ${gazeCalibrated ? 'ready' : 'initializing'}`}></span>
                    <span>{gazeCalibrated ? 'Calibrated' : 'Initializing...'}</span>
                  </div>
                  
                  <div className="gaze-feedback">
                    <div className={`gaze-status ${isLookingAtAvatar ? 'looking' : 'not-looking'}`}>
                      {isLookingAtAvatar ? '👁️ Looking at Dougie' : '👀 Look at Dougie\'s face'}
                    </div>
                    
                    <div className="eye-contact-percentage">
                      <span>Eye Contact: {eyeContactPercentage}%</span>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${eyeContactPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Analytics Display */}
            {cvAnalyticsMode !== 'none' && cvAnalyticsData && (
              <div className="cv-analytics-display">
                <h5>📈 Live Metrics</h5>
                
                {/* Eye Contact Analytics */}
                {(cvAnalyticsMode === 'eye-contact' || cvAnalyticsMode === 'combined') && (
                  <div className="cv-metric-section">
                    <div className="cv-metric">
                      <div className="cv-metric-header">
                        <span className="cv-metric-label">👁️ Eye Contact</span>
                        <span className="cv-metric-value">
                          {Math.round(cvAnalyticsData.eyeContact.percentage)}%
                        </span>
                      </div>
                      <div className="cv-metric-bar">
                        <div 
                          className="cv-metric-fill"
                          style={{ width: `${cvAnalyticsData.eyeContact.percentage}%` }}
                        />
                      </div>
                      <div className="cv-details">
                        <div className="cv-detail">
                          <span>Status:</span>
                          <span>{cvAnalyticsData.eyeContact.gazeOnTarget ? 'Good' : 'Look at camera'}</span>
                        </div>
                        <div className="cv-detail">
                          <span>Avg Duration:</span>
                          <span>{cvAnalyticsData.eyeContact.averageContactDuration}s</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Posture Analytics */}
                {(cvAnalyticsMode === 'posture' || cvAnalyticsMode === 'combined') && (
                  <div className="cv-metric-section">
                    <div className="cv-metric">
                      <div className="cv-metric-header">
                        <span className="cv-metric-label">🧘 Posture</span>
                        <span className="cv-metric-value">
                          {Math.round(cvAnalyticsData.posture.confidenceScore)}%
                        </span>
                      </div>
                      <div className="cv-metric-bar">
                        <div 
                          className="cv-metric-fill"
                          style={{ width: `${cvAnalyticsData.posture.confidenceScore}%` }}
                        />
                      </div>
                      <div className="cv-details">
                        <div className="cv-detail">
                          <span>Openness:</span>
                          <span>{Math.round(cvAnalyticsData.posture.bodyOpenness)}%</span>
                        </div>
                        <div className="cv-detail">
                          <span>Confidence:</span>
                          <span>{Math.round(cvAnalyticsData.posture.confidenceScore)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Main Content Area */}
        <div className={`main-content-v3 ${!showSidebar ? 'full-width' : ''} ${!showChat ? 'full-height' : ''}`}>
          {/* PiP View - Final Position (Lower Right) */}
          {showPiP && (
            <div className="pip-view-position">
              <div className="pip-container">
                <div className="pip-header">
                  <h4>Your Avatar</h4>
                  <div className="pip-size-controls">
                    <button 
                      className={`pip-size-btn ${pipSize === 'medium' ? 'active' : ''}`}
                      onClick={() => setPipSize('medium')}
                      title="Medium Size"
                    >
                      M
                    </button>
                    <button 
                      className={`pip-size-btn ${pipSize === 'large' ? 'active' : ''}`}
                      onClick={() => setPipSize('large')}
                      title="Large Size"
                    >
                      L
                    </button>
                  </div>
                </div>
                {showPiP && pipSize !== 'hidden' && (
                  <UserAvatarPiP
                    size={pipSize as 'small' | 'medium' | 'large'}
                    position={'bottom-right'}
                    className={`user-avatar-pip user-avatar-${pipSize}`}
                    onClose={() => setShowPiP(false)}
                  />
                )}
              </div>
            </div>
          )}

          {/* 3D Scene */}
          <Canvas className="three-canvas" ref={canvasRef}>
            <PerspectiveCamera makeDefault position={[0, 1.6, 1.8]} />
            <OrbitControls 
              ref={controlsRef}
              enabled={!cameraLocked}
              target={[0, 1.6, 0]}
              minDistance={0.8}
              maxDistance={4}
              maxPolarAngle={Math.PI / 2}
            />
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} />
            <PresenceAvatarMaleCoach 
              key="stable-dougie-avatar"
              avatarUrl="/avatars/DougieG.glb"
              animationName={animationName}
              audioData={audioData}
              emotionalBlendshapes={emotionalBlendshapes}
              scale={1}
              position={[0, 0, 0]}
            />
          </Canvas>

          {/* Bottom Chat Area */}
          {showChat && (
            <div className={`bottom-chat-v3 ${!showSidebar ? 'full-width' : ''}`}>
              <h3>Live Transcript & Chat</h3>
              {transcriptSegments.length > 0 ? (
                <TranscriptTimeline 
                  segments={transcriptSegments}
                  callDuration={dateStarted ? (Date.now() - dateStartTime) / 1000 : 0}
                  currentTime={dateStarted ? (Date.now() - dateStartTime) / 1000 : 0}
                />
              ) : (
                <div className="no-transcript">
                  <p>Start your date to see the conversation transcript here.</p>
                  <p>The transcript will update in real-time as you talk with Dougie.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chemistry Report Modal */}
      {showReport && (
        <div className="modal-overlay">
          <div className="modal-content">
            <ChemistryReport
              emotionHistory={emotionHistory}
              participant1Name="You"
              participant2Name="Dougie"
              callDuration={SPEED_DATE_DURATION - timeRemaining}
              transcriptSegments={transcriptSegments}
              onClose={() => {
                setShowReport(false);
                setDateStarted(false);
                setDateEnded(false);
                setTimeRemaining(SPEED_DATE_DURATION);
                setTranscriptSegments([]);
                setConversationSegments([]);
                setEmotionHistory([]);
                setUserFacialEmotions([]);
                setDougieEmotions([]);
                setAnimationName('idle');
                setIsSpeaking(false);
                setShowPiP(false);
              }}
            />
          </div>
        </div>
      )}
      {showEngagementDashboard && practiceMode && (
        <EngagementDashboard
          engagementData={engagementAnalytics}
          isVisible={showEngagementDashboard}
          onToggleMinimize={() => setShowEngagementDashboard(false)}
        />
      )}
    </div>
  );
};

export default DougieSpeedDateV3;
