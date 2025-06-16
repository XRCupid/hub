import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { PresenceAvatarMaleCoach } from './PresenceAvatarMaleCoach';
import { HybridVoiceService } from '../services/hybridVoiceService';
import { TranscriptSegment } from '../services/humeVoiceService';
import { humeConnectionManager } from '../services/HumeConnectionManager';
import { HumeExpressionService } from '../services/HumeExpressionService';
import { PostureTrackingService } from '../services/PostureTrackingService';
import RealTimeEmotionSliders from './RealTimeEmotionSliders';
import TranscriptTimeline from './TranscriptTimeline';
import ChemistryReport from './ChemistryReport';
import TrackingPreferencesSelector from './TrackingPreferencesSelector';
import TrackingStatusIndicator from './TrackingStatusIndicator';
import EngagementDashboard from './EngagementDashboard';
import { UnifiedTrackingCoordinator, DateTrackingPreferences, SessionContext, TrackingConfiguration } from '../services/UnifiedTrackingCoordinator';
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
    leaning: 'neutral' | 'forward' | 'backward' | 'left' | 'right';
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
  console.log('DougieSpeedDateV3 component initialized');

  // Add global test function for browser console debugging
  useEffect(() => {
    (window as any).testPostureTracking = () => {
      console.log('Window test function called');
      return 'Test function works!';
    };
    console.log('Window test function added - try calling window.testPostureTracking() in console');
  }, []);

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
  const [cameraZoomed, setCameraZoomed] = useState(false);

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

  // Camera ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<any>(null);

  // Face zoom video ref
  const faceZoomVideoRef = useRef<HTMLVideoElement | null>(null);

  // Debug audioData changes
  useEffect(() => {
    const maxValue = Math.max(...Array.from(audioData));
    const nonZeroCount = Array.from(audioData).filter(val => val > 0).length;
    console.log('[DougieSpeedDateV3] AudioData updated:', {
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
  const [showCVPanel, setShowCVPanel] = useState(false);

  // Service references
  const voiceServiceRef = useRef<HybridVoiceService | null>(null);
  const expressionServiceRef = useRef<HumeExpressionService | null>(null);
  const postureServiceRef = useRef<PostureTrackingService | null>(null);
  const eyeTrackingRef = useRef<any>(null); // WebGazer instance
  const cvVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const emotionSnapshotRef = useRef<NodeJS.Timeout | null>(null);

  // Stream reference for camera
  const streamRef = useRef<MediaStream | null>(null);

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
          console.log('[HUME-DEBUG] Voice service exists, registering callbacks...');
          
          // Setup voice service callbacks
          voiceServiceRef.current.onAudio((audioBlob: Blob) => {
            console.log('[DougieSpeedDateV3] Audio received from Hume, size:', audioBlob.size, 'type:', audioBlob.type);
            
            if (audioBlob.size > 0) {
              console.log('[DougieSpeedDateV3] Valid audio blob, starting playback...');
              playAudio(audioBlob);
            } else {
              console.warn('[DougieSpeedDateV3] Empty audio blob received from Hume');
            }
          });
          
          console.log('[HUME-DEBUG] Audio callback registered');
          
          // Also register message callback to see if Hume is working at all
          voiceServiceRef.current.onMessage((message: any) => {
            console.log('[HUME-DEBUG] Message received from Hume:', message);
          });
          
          console.log('[HUME-DEBUG] Message callback registered');
          
          // Register error callback
          voiceServiceRef.current.onError((error: any) => {
            console.log('[HUME-DEBUG] Hume error:', error);
          });
          
          console.log('[HUME-DEBUG] Error callback registered');
        } else {
          console.log('[HUME-DEBUG] Voice service is null!');
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
      console.log('[DougieSpeedDateV3] CONNECT BUTTON CLICKED - Starting connection...');
      
      if (voiceServiceRef.current) {
        console.log('[DougieSpeedDateV3] Voice service exists, attempting to connect...');
        
        // Connect to the service
        console.log('[DougieSpeedDateV3] Calling voiceService.connect() with config:', DOUGIE_CONFIG.humeConfigId);
        await voiceServiceRef.current.connect(DOUGIE_CONFIG.humeConfigId);
        
        console.log('[DougieSpeedDateV3] Voice service connected successfully!');
        setIsConnected(true);
        setDateStarted(true);
        setDateStartTime(Date.now());
        
        console.log('[DougieSpeedDateV3] Testing voice service - sending test message...');
        
        // Send a test message to trigger audio
        setTimeout(() => {
          console.log('[DougieSpeedDateV3] Sending test message to Hume...');
          if (voiceServiceRef.current) {
            voiceServiceRef.current.sendMessage("Hello, this is a test message to generate audio");
          }
        }, 2000);
        
      } else {
        console.error('[DougieSpeedDateV3] Voice service is null!');
      }
    } catch (error) {
      console.error('[DougieSpeedDateV3] Connection failed:', error);
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

      // CV Analytics initialization is now handled via CV panel only
      console.log('[DougieSpeedDateV3] Date started - CV Analytics mode:', cvAnalyticsMode);
      console.log('[DougieSpeedDateV3] Use CV Panel to enable face or posture tracking');

      // Transition to conversation phase immediately
      setTimeout(() => {
        console.log('[DougieSpeedDateV3] Sending initial greeting to trigger conversation');
        if (voiceServiceRef.current && isConnected) {
          console.log('[DougieSpeedDateV3] Sending initial greeting to start conversation...');
          setTimeout(() => {
            voiceServiceRef.current?.sendMessage("Hi Dougie! I'm ready to start our speed date conversation. Please introduce yourself and ask me a question.");
          }, 1000);
        } else {
          console.warn('[DougieSpeedDateV3] Cannot send initial message - voice service not connected');
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
      console.log('Failed to connect. Please check your connection and try again.');
    }
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
    console.log('[DougieSpeedDateV3] CV ANALYTICS INIT CALLED WITH MODE:', mode);
    
    if (!cvVideoRef.current) {
      console.error('[DougieSpeedDateV3] No CV video element available');
      return;
    }
    
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

      // Ensure video element has camera stream
      if (!cvVideoRef.current?.srcObject) {
        console.log('[DougieSpeedDateV3] Requesting camera access...');
        
        try {
          const cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: 640, 
              height: 480,
              facingMode: 'user'
            } 
          });
          
          cvVideoRef.current!.srcObject = cameraStream;
          console.log('[DougieSpeedDateV3] Camera stream attached to video element');
          
          // CRITICAL: Wait for video to actually start playing
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Video failed to start playing within 5 seconds'));
            }, 5000);
            
            cvVideoRef.current!.onloadedmetadata = () => {
              console.log('[DougieSpeedDateV3] Video metadata loaded');
              cvVideoRef.current!.play().then(() => {
                clearTimeout(timeout);
                console.log('[DougieSpeedDateV3] Video playing successfully');
                resolve(true);
              }).catch(reject);
            };
          });
          
        } catch (cameraError) {
          console.error('[DougieSpeedDateV3] Camera access failed:', cameraError);
          alert('Camera access failed. Please allow camera permissions.');
          return;
        }
      } else {
        console.log('[DougieSpeedDateV3] Video element already has camera stream');
      }
      
      // Wait for video to be fully ready with actual dimensions
      await new Promise(resolve => {
        const checkReady = () => {
          if (cvVideoRef.current && 
              cvVideoRef.current.readyState >= 3 && 
              cvVideoRef.current.videoWidth > 0 && 
              cvVideoRef.current.videoHeight > 0) {
            console.log('[DougieSpeedDateV3] Video fully ready with dimensions:', 
                       cvVideoRef.current.videoWidth, 'x', cvVideoRef.current.videoHeight);
            resolve(true);
          } else {
            console.log('[DougieSpeedDateV3] Waiting for video... readyState:', 
                       cvVideoRef.current?.readyState, 'dimensions:', 
                       cvVideoRef.current?.videoWidth, 'x', cvVideoRef.current?.videoHeight);
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });
      
      postureServiceRef.current = new PostureTrackingService();
      await postureServiceRef.current.startTracking(cvVideoRef.current);
      
      console.log('[DougieSpeedDateV3] Setting up posture results callback...');
      postureServiceRef.current.onResults((postureData: any) => {
        console.log('[DougieSpeedDateV3] POSTURE DATA RECEIVED:', postureData);
        updatePostureAnalytics(postureData);
      });
      
      console.log('[DougieSpeedDateV3] POSTURE TRACKING INITIALIZED SUCCESSFULLY!');
    } catch (error) {
      console.error('[DougieSpeedDateV3] POSTURE TRACKING INITIALIZATION FAILED:', error);
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

  const updateEyeContactAnalytics = (gazeData: any) => {
    console.log('[DougieSpeedDateV3] Updating eye contact analytics with data:', gazeData);
    
    // Calculate avatar face area in screen coordinates
    // Avatar is positioned in center of the 3D canvas, face area is roughly top 40% of avatar
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) {
      console.log('[DougieSpeedDateV3] Canvas not available for eye contact calculation');
      return;
    }
    
    // Define avatar face area (center 40% x 50% of canvas, positioned in upper portion)
    const avatarFaceArea = {
      left: canvasRect.left + canvasRect.width * 0.3,   // 30% from left
      right: canvasRect.left + canvasRect.width * 0.7,  // 70% from left
      top: canvasRect.top + canvasRect.height * 0.2,    // 20% from top (face area)
      bottom: canvasRect.top + canvasRect.height * 0.6  // 60% from top
    };
    
    const isLookingAtAvatar = gazeData.x && gazeData.y &&
      gazeData.x >= avatarFaceArea.left &&
      gazeData.x <= avatarFaceArea.right &&
      gazeData.y >= avatarFaceArea.top &&
      gazeData.y <= avatarFaceArea.bottom;
    
    console.log('[DougieSpeedDateV3] Avatar eye contact detected:', isLookingAtAvatar, 
      'Avatar face area:', avatarFaceArea, 
      'Gaze:', { x: gazeData.x, y: gazeData.y });
    
    setCvAnalyticsData(prev => {
      if (!prev) {
        const newData: CVAnalyticsData = {
          eyeContact: {
            percentage: isLookingAtAvatar ? 100 : 0,
            gazeOnTarget: isLookingAtAvatar,
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
      
      const updatedData: CVAnalyticsData = {
        ...prev,
        eyeContact: {
          ...prev.eyeContact,
          gazeOnTarget: isLookingAtAvatar,
          percentage: isLookingAtAvatar ? Math.min(100, prev.eyeContact.percentage + 2) : Math.max(0, prev.eyeContact.percentage - 1)
        }
      };
      console.log('[DougieSpeedDateV3] Updated CV analytics data:', updatedData);
      return updatedData;
    });
  };

  const updatePostureAnalytics = (postureData: any) => {
    if (!postureData || !postureData.keypoints) return;
    
    console.log('[DougieSpeedDateV3] Processing posture data:', {
      confidence: postureData.confidence,
      keypointsAvailable: Object.keys(postureData.keypoints).length
    });
    
    // Extract keypoints from PostureData format (not ML5 format)
    const leftShoulder = postureData.keypoints.leftShoulder;
    const rightShoulder = postureData.keypoints.rightShoulder;
    const nose = postureData.keypoints.nose;
    
    if (!leftShoulder || !rightShoulder || !nose) {
      console.log('[DougieSpeedDateV3] Missing essential keypoints:', {
        leftShoulder: !!leftShoulder,
        rightShoulder: !!rightShoulder,
        nose: !!nose
      });
      return;
    }
    
    // Calculate shoulder alignment (PostureData uses x,y properties directly)
    const shoulderYDiff = Math.abs(leftShoulder.y - rightShoulder.y);
    const shoulderAlignment = Math.max(0, 100 - (shoulderYDiff * 2));
    
    // Calculate body openness based on shoulder width
    const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
    const bodyOpenness = Math.min(100, shoulderWidth / 2);
    
    // Debug body openness calculation
    console.log('[DougieSpeedDateV3] Body Openness Debug:', {
      leftShoulderX: leftShoulder.x,
      rightShoulderX: rightShoulder.x,
      shoulderWidth: shoulderWidth,
      bodyOpenness: bodyOpenness,
      rawCalculation: shoulderWidth / 2
    });
    
    // Determine leaning based on nose position relative to shoulder center
    const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
    const noseLeanOffset = nose.x - shoulderCenterX;
    let leaning: 'neutral' | 'forward' | 'backward' | 'left' | 'right' = 'neutral';
    if (noseLeanOffset > 20) leaning = 'right';
    else if (noseLeanOffset < -20) leaning = 'left';
    
    const confidenceScore = postureData.confidence * 100;
    
    console.log('[DougieSpeedDateV3] Calculated posture metrics:', {
      shoulderAlignment,
      bodyOpenness,
      leaning,
      confidenceScore
    });
    
    setCvAnalyticsData(prev => {
      if (!prev) {
        return {
          eyeContact: { percentage: 0, gazeOnTarget: false, lookAwayCount: 0, averageContactDuration: 0 },
          posture: {
            shoulderAlignment,
            headPosition: { x: nose.x || 0, y: nose.y || 0 },
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
          headPosition: { x: nose.x || 0, y: nose.y || 0 },
          bodyOpenness,
          leaning,
          confidenceScore
        }
      };
    });
  };

  const calculateEngagementFromPose = (pose: any) => {
    if (!pose.keypoints || pose.keypoints.length === 0) return null;
    
    // Find key landmarks using ML5 format
    const nose = pose.keypoints.find((kp: any) => kp.part === 'nose');
    const leftShoulder = pose.keypoints.find((kp: any) => kp.part === 'leftShoulder');
    const rightShoulder = pose.keypoints.find((kp: any) => kp.part === 'rightShoulder');
    
    if (!nose || !leftShoulder || !rightShoulder) return null;
    
    // Calculate posture metrics using ML5 position property
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
        postureServiceRef.current.stopTracking();
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

  // Don't auto-initialize posture tracking - user controls via CV panel
  console.log('[DougieSpeedDateV3] Skipping auto-posture init - user must select via CV panel');
  console.log('[DougieSpeedDateV3] Current CV mode:', cvAnalyticsMode);

  useEffect(() => {
    // Add periodic CV analytics update
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

  // Handle face zoom video setup
  useEffect(() => {
    if (faceZoomVideoRef.current && cvVideoRef.current && cvVideoRef.current.srcObject) {
      faceZoomVideoRef.current.srcObject = cvVideoRef.current.srcObject;
    }
  }, [cvVideoRef.current?.srcObject, activeLeftTab]); // Re-run when stream changes or tab changes

  useEffect(() => {
    let lipSyncInterval: NodeJS.Timeout | null = null;
    
    if (isSpeaking && audioData.every(val => val === 0)) {
      console.log('[DougieSpeedDateV3] Starting fallback lip sync - no audio data available');
      
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
      console.log('[DougieSpeedDateV3] Stopping fallback lip sync');
      clearInterval(lipSyncInterval);
      setAudioData(new Uint8Array(128)); // Reset to silence
    }

    return () => {
      if (lipSyncInterval) {
        clearInterval(lipSyncInterval);
      }
    };
  }, [isSpeaking, audioData]);

  useEffect(() => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.onUserMessage((message: any) => {
        console.log('[DougieSpeedDateV3] User message received:', message);
        
        // Create transcript segment for user message
        const userSegment: TranscriptSegment = {
          timestamp: Date.now(),
          speaker: 'user',
          text: typeof message === 'string' ? message : (message.content || message.text || ''),
          emotions: [],
          prosodyEmotions: undefined,
          facialEmotions: undefined
        };
        
        setTranscriptSegments(prev => [...prev, userSegment]);
        setCurrentTranscript(prev => prev + ' [User]: ' + userSegment.text);
      });
      
      voiceServiceRef.current.onMessage((message: any) => {
        console.log('[DougieSpeedDateV3] Assistant message received:', message);
        
        // Create transcript segment for assistant response
        const assistantSegment: TranscriptSegment = {
          timestamp: Date.now(),
          speaker: 'assistant',
          text: typeof message === 'string' ? message : (message.content || message.text || ''),
          emotions: [],
          prosodyEmotions: undefined,
          facialEmotions: undefined
        };
        
        setTranscriptSegments(prev => [...prev, assistantSegment]);
        setCurrentTranscript(prev => prev + ' [Dougie]: ' + assistantSegment.text);
      });
      
      voiceServiceRef.current.onEmotion((emotions: any) => {
        console.log('[DougieSpeedDateV3] Dougie emotions received:', emotions);
        
        // Convert emotions to blendshapes for avatar
        const blendshapes: Record<string, number> = {};
        
        if (emotions && Array.isArray(emotions)) {
          emotions.forEach((emotion: any) => {
            const emotionName = emotion.name?.toLowerCase() || '';
            const value = emotion.score || 0;
            
            switch (emotionName) {
              case 'joy':
              case 'happiness':
                blendshapes['mouthSmileLeft'] = value * 0.8;
                blendshapes['mouthSmileRight'] = value * 0.8;
                break;
              case 'surprise':
                blendshapes['browInnerUp'] = value * 0.7;
                blendshapes['eyeWideLeft'] = value * 0.6;
                blendshapes['eyeWideRight'] = value * 0.6;
                break;
              case 'confusion':
                blendshapes['browDownLeft'] = value * 0.4;
                blendshapes['browDownRight'] = value * 0.4;
                break;
              case 'interest':
                blendshapes['browOuterUpLeft'] = value * 0.3;
                blendshapes['browOuterUpRight'] = value * 0.3;
                break;
              case 'love':
              case 'adoration':
                blendshapes['mouthSmileLeft'] = value * 0.6;
                blendshapes['mouthSmileRight'] = value * 0.6;
                blendshapes['cheekSquintLeft'] = value * 0.3;
                blendshapes['cheekSquintRight'] = value * 0.3;
                break;
              case 'excitement':
                blendshapes['mouthOpen'] = value * 0.4;
                blendshapes['eyeWideLeft'] = value * 0.5;
                blendshapes['eyeWideRight'] = value * 0.5;
                break;
              case 'sadness':
                blendshapes['mouthFrownLeft'] = value * 0.6;
                blendshapes['mouthFrownRight'] = value * 0.6;
                break;
              case 'contempt':
                blendshapes['mouthLeft'] = value * 0.4;
                blendshapes['noseSneerLeft'] = value * 0.3;
                break;
              case 'disgust':
                blendshapes['noseSneerLeft'] = value * 0.5;
                blendshapes['noseSneerRight'] = value * 0.5;
                blendshapes['mouthPucker'] = value * 0.3;
                break;
            }
          });
        } else if (emotions && typeof emotions === 'object') {
          Object.entries(emotions).forEach(([emotion, intensity]: [string, any]) => {
            const value = typeof intensity === 'number' ? intensity : 0;
            // Same switch logic as above...
          });
        }
        
        // Set emotional blendshapes for avatar
        setEmotionalBlendshapes(blendshapes);
        
        // Update the most recent user transcript segment with emotion data
        setTranscriptSegments(prev => {
          if (prev.length > 0) {
            const updated = [...prev];
            const lastSegment = updated[updated.length - 1];
            if (lastSegment.speaker === 'assistant') {
              lastSegment.prosodyEmotions = emotions;
            }
            return updated;
          }
          return prev;
        });
      });
      
      console.log('[DougieSpeedDateV3] All voice service callbacks registered');
    }
  }, [voiceServiceRef]);

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

  const getEngagementLevelFromAnalytics = (analytics: EngagementAnalytics | null): string => {
    if (!analytics) return 'Unknown';
    return getEngagementLevel(analytics.overallEngagement);
  };

  const getEngagementColorFromAnalytics = (analytics: EngagementAnalytics | null): string => {
    if (!analytics) return 'unknown';
    return getEngagementColor(analytics.overallEngagement);
  };

  // Audio playback with basic lip sync
  const playAudio = async (audioBlob: Blob) => {
    console.log('[DougieSpeedDateV3] Playing audio, blob size:', audioBlob.size);
    
    if (!audioBlob || audioBlob.size === 0) {
      console.warn('[DougieSpeedDateV3] Invalid audio blob');
      return;
    }

    const audioUrl = URL.createObjectURL(audioBlob);
    audioPlayerRef.current.src = audioUrl;
    
    try {
      await audioPlayerRef.current.play();
      setIsSpeaking(true);
      setAnimationName('talking');
      
      audioPlayerRef.current.onended = () => {
        setIsSpeaking(false);
        setAnimationName('idle');
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error('[DougieSpeedDateV3] Audio playback error:', error);
      URL.revokeObjectURL(audioUrl);
    }
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

  const handleCVPanelToggle = () => {
    console.log('CV PANEL BUTTON CLICKED!!!');
    console.log('CV PANEL BUTTON CLICKED!!!');
    console.log('CV PANEL BUTTON CLICKED!!!');
    alert('CV PANEL BUTTON CLICKED! Check console...');
    
    if (!showSidebar) {
      setShowSidebar(true);
    }
    setActiveLeftTab('analytics');
    
    // User must select tracking mode via CV panel
    console.log('[DougieSpeedDateV3] Analytics opened - use CV panel to select tracking mode');
  };

  return (
    <div className="dougie-speed-date-v3">
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
          <button 
            className={`toggle-btn ${cvAnalyticsData ? 'active' : ''}`}
            onClick={() => setShowCVPanel(!showCVPanel)}
            title="Toggle CV Analytics Panel"
          >
            👁️ CV Panel
          </button>
        </div>
        <div className="top-bar-right">
          <div className="user-controls">
            <div className="pip-controls">
              <button 
                className={`pip-toggle-btn ${showPiP ? 'active' : ''}`}
                onClick={() => setShowPiP(!showPiP)}
              >
                {showPiP ? '👁️' : '🚫'}
              </button>
              
              {showPiP && (
                <select 
                  value={pipSize} 
                  onChange={(e) => setPipSize(e.target.value as 'small' | 'medium' | 'large')}
                  className="pip-size-select"
                >
                  <option value="small">S</option>
                  <option value="medium">M</option>
                  <option value="large">L</option>
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="main-container-v3">
        {/* Left Sidebar */}
        {showSidebar && (
          <div className="left-sidebar-v3">
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
              <button 
                className={`tab-btn ${activeLeftTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveLeftTab('analytics')}
              >
                📊 Analytics
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

                    {false && showPiP && pipSize !== 'hidden' && (
                      <div className="pip-container">
                        <div className="pip-info">
                          <p>🔍 PiP View Active</p>
                          <p>Check bottom-right corner →</p>
                        </div>
                      </div>
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
                    
                    {/* Camera Zoom Control */}
                    <div style={{ marginTop: '15px' }}>
                      <div style={{ 
                        padding: '5px', 
                        background: 'rgba(255,0,0,0.2)', 
                        borderRadius: '4px',
                        marginBottom: '5px',
                        fontSize: '11px',
                        color: 'white'
                      }}>
                        DEBUG: Camera zoom button should appear below
                      </div>
                      <button 
                        className="camera-zoom-toggle-btn"
                        style={{
                          width: '100%',
                          padding: '10px 15px',
                          backgroundColor: cameraZoomed ? '#4CAF50' : '#FF6B6B',
                          color: 'white',
                          border: '2px solid #FFD700',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 0.3s ease',
                          zIndex: 9999,
                          position: 'relative',
                          pointerEvents: 'auto'
                        }}
                        onMouseEnter={() => {
                          console.log('MOUSE ENTERED camera zoom button');
                        }}
                        onMouseLeave={() => {
                          console.log('MOUSE LEFT camera zoom button');
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('CAMERA ZOOM BUTTON CLICKED!!!');
                          console.log('Current camera zoomed state:', cameraZoomed);
                          console.log('Camera ref exists:', !!cameraRef.current);
                          
                          setCameraZoomed(!cameraZoomed);
                          
                          // Control camera position for face zoom
                          console.log('Using setCameraForEyeTracking function');
                          setCameraForEyeTracking(!cameraZoomed); // Use existing function that handles OrbitControls properly
                          console.log('Camera zoom set to:', !cameraZoomed);
                          
                        }}
                      >
                        {cameraZoomed ? '👁️ Normal View' : '🔍 Zoom Face'} 
                      </button>
                    </div>
                    
                    {/* Face Zoom Instructions */}
                    {cameraZoomed && (
                      <div style={{
                        marginTop: '10px',
                        padding: '8px',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        border: '1px solid #4CAF50',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#4CAF50'
                      }}>
                        Camera zoomed for close-up eye contact interaction
                      </div>
                    )}
                    
                    {/* Remove the face zoom video section - not needed for 3D camera control */}
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
              {/* Analytics Tab */}
              {activeLeftTab === 'analytics' && (
                <div className="analytics-tab">
                  <h4>📊 Analytics</h4>
                  <div className="analytics-content">
                    <h5>CV Analytics</h5>
                    <div className="cv-analytics">
                      <div className="cv-analytics-section">
                        <h6>Eye Contact</h6>
                        <p>Percentage: {cvAnalyticsData?.eyeContact?.percentage || 0}%</p>
                        <p>Gaze On Target: {cvAnalyticsData?.eyeContact?.gazeOnTarget ? 'Yes' : 'No'}</p>
                      </div>
                      <div className="cv-analytics-section">
                        <h6>Posture</h6>
                        <p>Shoulder Alignment: {cvAnalyticsData?.posture?.shoulderAlignment || 0}%</p>
                        <p>Body Openness: {cvAnalyticsData?.posture?.bodyOpenness || 0}%</p>
                        <p>Confidence Score: {cvAnalyticsData?.posture?.confidenceScore || 0}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className={`main-content-v3 ${!showSidebar ? 'full-width' : ''} ${!showChat ? 'full-height' : ''}`}>
          {/* PiP View - Final Position (Lower Right) */}
          {showPiP && pipSize !== 'hidden' && (
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
                {showPiP && (
                  <UserAvatarPiP
                    avatarUrl="/avatars/user_avatar.glb"
                    position="bottom-right"
                    size="medium"
                    style={{ zIndex: 1000 }}
                    cameraStream={streamRef.current}
                    postureData={(() => {
                      console.log('[DougieSpeedDateV3] PiP PostureData:', cvAnalyticsData?.posture);
                      return cvAnalyticsData?.posture;
                    })()} // Add posture data for camera responsiveness
                    trackingData={null} // Let PiP handle its own tracking
                    enableOwnTracking={true} // Enable PiP's own face tracking
                    onClose={() => setShowPiP(false)}
                  />
                )}
              </div>
            </div>
          )}

          {/* 3D Scene */}
          <WebGLErrorBoundary fallback={
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '400px',
              backgroundColor: '#1a1a1a',
              color: '#fff',
              flexDirection: 'column',
              padding: '20px',
              borderRadius: '8px'
            }}>
              <h3>Avatar Temporarily Unavailable</h3>
              <p>WebGL context limit reached. Please:</p>
              <ul style={{ textAlign: 'left', marginTop: '10px' }}>
                <li>Refresh the page</li>
                <li>Close other browser tabs using WebGL</li>
                <li>Restart your browser if needed</li>
              </ul>
              <button 
                onClick={() => window.location.reload()} 
                style={{
                  marginTop: '15px',
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Refresh Page
              </button>
            </div>
          }>
            <Canvas 
              className="three-canvas" 
              ref={canvasRef}
              onCreated={(state) => {
                console.log('Canvas created successfully');
              }}
              gl={{ 
                preserveDrawingBuffer: false, 
                antialias: false, 
                alpha: true,
                premultipliedAlpha: false 
              }}
              dpr={Math.min(window.devicePixelRatio, 2)} 
            >
              <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 1.6, 1.8]} />
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
          </WebGLErrorBoundary>

          {/* Hidden video element for CV analytics */}
          <video
            ref={cvVideoRef}
            style={{ display: 'none' }}
            autoPlay
            muted
            playsInline
            width={640}
            height={480}
          />

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

      {/* CV Analytics Panel */}
      {showCVPanel && (
        <div className="cv-panel">
          <div className="panel-header">
            <h3>🎯 CV Analytics</h3>
            <button 
              className="panel-toggle" 
              onClick={() => setShowCVPanel(false)}
              title="Close CV Panel"
            >
              ✕
            </button>
          </div>
          
          <div className="cv-controls">
            <div className="cv-mode-selector">
              <label>Tracking Mode:</label>
              <select 
                value={cvAnalyticsMode} 
                onChange={(e) => {
                  const mode = e.target.value as CVAnalyticsMode;
                  setCvAnalyticsMode(mode);
                  if (mode !== 'none') {
                    initializeCVAnalytics(mode);
                  }
                }}
              >
                <option value="none">None</option>
                <option value="eye-contact">Face Tracking</option>
                <option value="posture">Posture Only</option>
                <option value="combined">Combined (Face + Posture)</option>
              </select>
            </div>
            
            <div className="cv-status">
              <div>Mode: <strong>{cvAnalyticsMode}</strong></div>
              <div>Face Data: {userFacialEmotions.length > 0 ? '✅ Active' : '❌ None'}</div>
              <div>Posture Data: {cvAnalyticsData?.posture ? '✅ Active' : '❌ None'}</div>
            </div>
          </div>
        </div>
      )}

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
