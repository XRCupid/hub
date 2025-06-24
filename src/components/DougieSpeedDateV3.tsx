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
import { LessonRecommendations } from './LessonRecommendations';
import TrackingPreferencesSelector from './TrackingPreferencesSelector';
import TrackingStatusIndicator from './TrackingStatusIndicator';
import EngagementDashboard from './EngagementDashboard';
import { UnifiedTrackingCoordinator, DateTrackingPreferences, SessionContext, TrackingConfiguration } from '../services/UnifiedTrackingCoordinator';
import { EngagementAnalytics } from '../types/tracking';
import { FaLock, FaLockOpen, FaCog, FaEye, FaUser, FaEyeSlash, FaRunning, FaBars, FaComments, FaChartLine } from 'react-icons/fa';
import './DougieSpeedDateV3.css';
import { UserAvatarPiP } from './UserAvatarPiP';
import { CombinedFaceTrackingService } from '../services/CombinedFaceTrackingService';
import { SpeedDatePerformanceAnalyzer, SpeedDatePerformanceMetrics, LessonRecommendation } from '../services/SpeedDatePerformanceAnalyzer';
import { useNavigate } from 'react-router-dom';
import { JeelizGlanceTracker } from './JeelizGlanceTracker';
import { EyeGesturesTracker } from './EyeGesturesTracker';
import { WebGazerTracker } from './WebGazerTracker';

// CV Analytics Types
type CVAnalyticsMode = 'none' | 'eye-contact' | 'posture' | 'combined';
type EyeTrackerType = 'none' | 'jeeliz' | 'eyegestures' | 'webgazer';

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

interface ChemistryData {
  totalScore: number;
  categories: {
    emotionalSync: number;
    conversationalFlow: number;
    mutualEngagement: number;
    humorCompatibility: number;
  };
  summary: string;
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
  // console.log('DougieSpeedDateV3 component initialized'); // Commented out to reduce console spam

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
  const [showPiP, setShowPiP] = useState(false);
  const [pipSize, setPipSize] = useState<'small' | 'medium' | 'large' | 'hidden'>('medium'); // Default to medium for better visibility
  const [showControls, setShowControls] = useState(true);
  const [showEngagementDashboard, setShowEngagementDashboard] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false); // New practice mode toggle
  const [cameraZoomed, setCameraZoomed] = useState(false);
  const [delayedShowPiP, setDelayedShowPiP] = useState(false); // Delayed PiP to avoid WebGL conflicts

  // Eye tracking state
  const [isLookingAtScreen, setIsLookingAtScreen] = useState(false);
  const [lookingHistory, setLookingHistory] = useState<boolean[]>([]);
  const [showEyeTracker, setShowEyeTracker] = useState(false);
  const [eyeTrackerType, setEyeTrackerType] = useState<EyeTrackerType>('none');

  // Camera permission state (needed for PiP)
  const [hasPermissions, setHasPermissions] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // User blendshapes and emotions from face tracking
  const [userBlendshapes, setUserBlendshapes] = useState<Record<string, number>>({});
  const [userEmotions, setUserEmotions] = useState<string[]>([]);
  const [userDetailedEmotions, setUserDetailedEmotions] = useState<Array<{ emotion: string; score: number }>>([]);
  
  // Dougie emotions
  const [dougieEmotions, setDougieEmotions] = useState<string[]>(['happy']);
  
  // Chemistry report
  const [showChemistryReport, setShowChemistryReport] = useState(false);
  const [chemistryData, setChemistryData] = useState<ChemistryData | null>(null);
  
  // PiP controls
  const [pipCameraX, setPipCameraX] = useState(0.70);
  const [pipCameraY, setPipCameraY] = useState(1.70);
  const [pipCameraZ, setPipCameraZ] = useState(1.80);
  const [pipCameraFOV, setPipCameraFOV] = useState(25);
  const [pipTargetX, setPipTargetX] = useState(0);
  const [pipTargetY, setPipTargetY] = useState(1.0);
  const [pipTargetZ, setPipTargetZ] = useState(0);
  const [showPipCameraControls, setShowPipCameraControls] = useState(false);
  const [currentCameraValues, setCurrentCameraValues] = useState<string>('');

  // Get media permissions for PiP
  useEffect(() => {
    const getMediaPermissions = async () => {
      try {
        console.log('[DougieSpeedDateV3] Requesting camera permissions for PiP...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        // Check if video ref exists before setting srcObject
        if (cvVideoRef.current) {
          cvVideoRef.current.srcObject = stream;
          setCameraStream(stream); // Store the stream in state
          setHasPermissions(true);
          console.log('[DougieSpeedDateV3] ✅ Camera permissions granted for PiP');
        } else {
          console.warn('[DougieSpeedDateV3] CV Video ref not available yet for PiP camera stream');
          // Still store the stream for later use
          setCameraStream(stream);
          setHasPermissions(true);
        }
      } catch (error) {
        console.error('[DougieSpeedDateV3] ❌ Error accessing camera for PiP:', error);
        setHasPermissions(false);
      }
    };

    getMediaPermissions();

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Poll for comprehensive tracking data from shared face tracking service
  useEffect(() => {
    if (!cameraStream) return;
    
    console.log('[DougieSpeedDateV3] Setting up comprehensive face tracking polling');
    
    const pollInterval = setInterval(() => {
      try {
        // Get the singleton instance
        const trackingService = CombinedFaceTrackingService.getInstance();
        const comprehensiveData = trackingService.getComprehensiveTrackingData();
        
        if (comprehensiveData) {
          // Update blendshapes (convert FacialExpressions to Record<string, number>)
          const blendshapesRecord: Record<string, number> = {};
          Object.entries(comprehensiveData.blendshapes).forEach(([key, value]) => {
            blendshapesRecord[key] = value;
          });
          setUserBlendshapes(blendshapesRecord);
          
          // Update detailed emotions
          if (comprehensiveData.emotions && comprehensiveData.emotions.length > 0) {
            setUserDetailedEmotions(comprehensiveData.emotions);
            
            // Also map to simple emotion strings for backward compatibility
            const emotions = mapBlendshapesToEmotions(comprehensiveData.blendshapes as unknown as Record<string, number>);
            if (emotions.length > 0) {
              console.log('[DougieSpeedDateV3] User emotions detected:', emotions, 'Detailed:', comprehensiveData.emotions.slice(0, 3));
              setUserEmotions(emotions);
            }
          }
          
          // Log additional tracking data periodically
          if (Math.random() < 0.02) { // Log 2% of the time
            console.log('[DougieSpeedDateV3] Comprehensive tracking data:', {
              hasBlendshapes: Object.keys(comprehensiveData.blendshapes).length > 0,
              emotionCount: comprehensiveData.emotions.length,
              topEmotions: comprehensiveData.emotions.slice(0, 3),
              headRotation: comprehensiveData.headRotation,
              ml5Analysis: comprehensiveData.ml5Analysis
            });
          }
        }
      } catch (error) {
        console.error('[DougieSpeedDateV3] Error polling face tracking:', error);
      }
    }, 100); // Poll every 100ms
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [cameraStream]);

  // Debug logging for camera controls
  useEffect(() => {
    console.log('[DougieSpeedDateV3] Camera controls state:', {
      showPipCameraControls,
      pipCameraX,
      pipCameraY,
      pipCameraZ,
      pipCameraFOV,
      pipTargetY,
      pipTargetZ
    });
  }, [showPipCameraControls, pipCameraX, pipCameraY, pipCameraZ, pipCameraFOV, pipTargetY, pipTargetZ]);

  // Tracking system state
  const [showTrackingPreferences, setShowTrackingPreferences] = useState(false);
  const [trackingPreferences, setTrackingPreferences] = useState<DateTrackingPreferences | null>(null);
  const [trackingConfiguration, setTrackingConfiguration] = useState<TrackingConfiguration | null>(null);
  const [trackingCoordinator] = useState(() => new UnifiedTrackingCoordinator());
  const [trackingInsights, setTrackingInsights] = useState(null);

  // Map blendshapes to emotions - returns string array for compatibility
  const mapBlendshapesToEmotions = (blendshapes: Record<string, number>): string[] => {
    const emotions: string[] = [];

    // Joy/Happiness detection
    const smileScore = (blendshapes['mouthSmileLeft'] || 0) + (blendshapes['mouthSmileRight'] || 0) / 2;
    if (smileScore > 0.3) {
      emotions.push('joy');
    }

    // Surprise detection
    const eyeWide = (blendshapes['eyeWideLeft'] || 0) + (blendshapes['eyeWideRight'] || 0) / 2;
    const mouthOpen = blendshapes['jawOpen'] || 0;
    if (eyeWide > 0.3 && mouthOpen > 0.3) {
      emotions.push('surprise');
    }

    // Sadness detection
    const frownScore = (blendshapes['mouthFrownLeft'] || 0) + (blendshapes['mouthFrownRight'] || 0) / 2;
    const browDown = (blendshapes['browDownLeft'] || 0) + (blendshapes['browDownRight'] || 0) / 2;
    if (frownScore > 0.3 || browDown > 0.3) {
      emotions.push('sadness');
    }

    // Anger detection
    const browFurrow = blendshapes['browInnerUp'] || 0;
    const lipPress = (blendshapes['mouthPressLeft'] || 0) + (blendshapes['mouthPressRight'] || 0) / 2;
    if (browFurrow > 0.3 && lipPress > 0.3) {
      emotions.push('anger');
    }

    // Neutral if no strong emotions detected
    if (emotions.length === 0) {
      emotions.push('neutral');
    }

    return emotions;
  };

  // Update user emotions when blendshapes change
  useEffect(() => {
    if (Object.keys(userBlendshapes).length > 0) {
      const detectedEmotions = mapBlendshapesToEmotions(userBlendshapes);
      if (detectedEmotions.length > 0) {
        console.log('[DougieSpeedDateV3] User emotions detected:', detectedEmotions);
      }
      setUserEmotions(detectedEmotions);
    }
  }, [userBlendshapes]);

  // Transcript and communication
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');

  // Audio and animation
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(128));
  const [animationName, setAnimationName] = useState('idle');
  const [emotionalBlendshapes, setEmotionalBlendshapes] = useState<Record<string, number>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Face tracking for user emotions
  const faceTrackingServiceRef = useRef<CombinedFaceTrackingService | null>(null);
  const faceVideoRef = useRef<HTMLVideoElement | null>(null);

  // Audio analysis refs (from V2)
  const audioPlayerRef = useRef<HTMLAudioElement>(new Audio());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceCreatedRef = useRef<boolean>(false);
  const originalCreateBufferSource = useRef<AudioContext['createBufferSource'] | null>(null);
  const originalDecodeAudioData = useRef<AudioContext['decodeAudioData'] | null>(null);
  const audioCleanupRef = useRef<(() => void) | null>(null);
  const audioQueueRef = useRef<Blob[]>([]);
  const isPlayingRef = useRef(false);

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
  const [eyeContactPercentage, setEyeContactPercentage] = useState(0);
  const [gazeCalibrated, setGazeCalibrated] = useState(false);
  const [eyeContactTotal, setEyeContactTotal] = useState(0);
  const [eyeContactSamples, setEyeContactSamples] = useState(0);
  const [lookAwayCount, setLookAwayCount] = useState(0);
  const [isLookingAtAvatar, setIsLookingAtAvatar] = useState(false);
  
  // Refs for eye tracking
  const webgazerRef = useRef<any>(null);
  const gazeDataRef = useRef({ totalSamples: 0, onTargetSamples: 0 });
  const avatarBoundsRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const isLookingAtAvatarRef = useRef(false);
  const controlsRef = useRef<any>(null);

  // Enhanced analytics tracking
  const [engagementAnalytics, setEngagementAnalytics] = useState<EngagementAnalytics | null>(null);
  
  // Performance analysis states
  const [performanceMetrics, setPerformanceMetrics] = useState<SpeedDatePerformanceMetrics | null>(null);
  const [lessonRecommendations, setLessonRecommendations] = useState<LessonRecommendation[]>([]);

  // CV Analytics State
  const [cvAnalyticsMode, setCvAnalyticsMode] = useState<CVAnalyticsMode>('none'); // Default to none to prevent camera interference
  const [cvAnalyticsData, setCvAnalyticsData] = useState<CVAnalyticsData | null>(null);
  const [showCVPanel, setShowCVPanel] = useState(false);

  // Service references
  const voiceServiceRef = useRef<HybridVoiceService | null>(null);
  const expressionServiceRef = useRef<HumeExpressionService | null>(null);
  const postureServiceRef = useRef<PostureTrackingService | null>(null);
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

  // Delay PiP rendering by 3 seconds to avoid WebGL context conflicts
  useEffect(() => {
    if (showPiP) {
      const timer = setTimeout(() => {
        console.log('[DougieSpeedDateV3] Enabling delayed PiP after 3 seconds');
        setDelayedShowPiP(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      setDelayedShowPiP(false);
    }
  }, [showPiP]);

  // Initialize services and audio context
  useEffect(() => {
    console.log('[DougieSpeedDateV3] Initializing services...');
    
    // Set up global audio blocking to prevent Hume SDK from playing audio
    const blockHumeAudio = () => {
      const currentRoute = window.location.pathname;
      console.log('[DougieSpeedDateV3] Current route:', currentRoute);
      
      // Aggressively block audio elements created by Hume SDK
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLAudioElement) {
              console.log('[DougieSpeedDateV3] Blocking external audio element');
              node.muted = true;
              node.volume = 0;
              node.pause();
              
              // Prevent any attempt to unmute or play
              Object.defineProperty(node, 'muted', {
                get: () => true,
                set: () => true
              });
              Object.defineProperty(node, 'volume', {
                get: () => 0,
                set: () => 0
              });
              const originalPlay = node.play.bind(node);
              node.play = function() {
                console.log('[DougieSpeedDateV3] Blocked audio play attempt');
                return Promise.reject(new Error('Audio blocked'));
              };
            }
          });
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });
      
      // Also block any existing audio elements
      document.querySelectorAll('audio').forEach(audio => {
        if (audio !== audioPlayerRef.current) {
          console.log('[DougieSpeedDateV3] Muting existing audio element');
          audio.muted = true;
          audio.volume = 0;
          audio.pause();
        }
      });
      
      return observer;
    };

    const audioObserver = blockHumeAudio();
    
    // Re-apply blocking every 500ms to catch any SDK attempts to restore audio
    const blockingInterval = setInterval(() => {
      document.querySelectorAll('audio').forEach(audio => {
        if (audio !== audioPlayerRef.current && (!audio.muted || audio.volume > 0)) {
          console.log('[DougieSpeedDateV3] Re-blocking audio element');
          audio.muted = true;
          audio.volume = 0;
          audio.pause();
        }
      });
    }, 500);

    // Create our audio player after setting up blocking
    const audioPlayer = new Audio();
    audioPlayer.dataset.dougieSpeedDate = 'true';
    audioPlayerRef.current = audioPlayer;

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
      audioObserver.disconnect();
      clearInterval(blockingInterval);
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
            participant1Emotions: [...userEmotions],
            participant2Emotions: [...dougieEmotions]
          };
          setEmotionHistory(prev => [...prev, snapshot]);
        }, 5000); // Every 5 seconds

        // Start eye tracking engagement update
        const eyeTrackingInterval = setInterval(() => {
          if (lookingHistory.length > 0) {
            const recentLooks = lookingHistory.slice(-30); // Last 30 samples
            const lookingPercentage = recentLooks.filter(looking => looking).length / recentLooks.length;
            setCurrentEngagementLevel(prev => prev * 0.7 + lookingPercentage * 0.3); // Weighted average
            
            // Log engagement periodically
            if (Math.random() < 0.1) { // 10% of the time
              console.log('[DougieSpeedDateV3] Eye tracking engagement:', {
                isLooking: isLookingAtScreen,
                lookingPercentage: Math.round(lookingPercentage * 100),
                engagementLevel: Math.round(currentEngagementLevel * 100)
              });
            }
          }
        }, 1000); // Every second

        // Store interval ref for cleanup
        (window as any).eyeTrackingInterval = eyeTrackingInterval;

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
    if ((window as any).eyeTrackingInterval) {
      clearInterval((window as any).eyeTrackingInterval);
      delete (window as any).eyeTrackingInterval;
    }

    setDateEnded(true);
    setAnimationName('idle');

    // Send closing message
    if (voiceServiceRef.current && isConnected) {
      voiceServiceRef.current.sendMessage(
        "Wow, time really flies when you're having fun! This has been wonderful. I'd love to see you again!"
      );
    }

    // Automatically disconnect after sending the closing message
    setTimeout(() => {
      if (isConnected) {
        console.log('[DougieSpeedDateV3] Auto-disconnecting after date end...');
        handleDisconnect();
      }
    }, 2000);

    // Analyze performance and generate recommendations
    if (emotionHistory.length > 0 || transcriptSegments.length > 0) {
      console.log('[DougieSpeedDateV3] Analyzing date performance...');
      const analyzer = new SpeedDatePerformanceAnalyzer();
      
      // Convert emotion history to the format expected by the analyzer
      const formattedEmotionHistory = emotionHistory.map(e => ({
        timestamp: e.timestamp,
        participant: e.participant,
        emotions: e.emotions,
        dominantEmotion: Object.entries(e.emotions).reduce((a, b) => 
          (a as [string, number])[1] > (b as [string, number])[1] ? (a as [string, number]) : (b as [string, number])
        )[0] as string,
        valence: 0,
        arousal: 0
      }));
      
      // Convert transcript segments to include id
      const formattedTranscripts = transcriptSegments.map((seg, idx) => ({
        id: `segment-${idx}`,
        text: seg.text,
        speaker: seg.speaker === 'user' || seg.speaker === 'assistant' ? seg.speaker : 'user' as 'user' | 'assistant',
        timestamp: new Date(seg.timestamp).toISOString(),
        emotion: seg.emotions
      }));
      
      const metrics = analyzer.analyzePerformance(
        formattedEmotionHistory,
        formattedTranscripts,
        eyeContactPercentage,
        cvAnalyticsData?.posture?.confidenceScore || 0,
        SPEED_DATE_DURATION - timeRemaining
      );
      
      const recommendations = analyzer.generateLessonRecommendations(metrics);
      
      setPerformanceMetrics(metrics);
      setLessonRecommendations(recommendations);
      
      console.log('[DougieSpeedDateV3] Performance metrics:', metrics);
      console.log('[DougieSpeedDateV3] Lesson recommendations:', recommendations);
    }

    // Show report after a delay
    setTimeout(() => {
      setShowReport(true);
    }, 3000);
  };

  // Emergency reset function
  const emergencyReset = () => {
    console.log('[DougieSpeedDateV3] Emergency reset triggered');
    
    // Stop all timers and intervals
    if (timerRef.current) clearInterval(timerRef.current);
    if (emotionSnapshotRef.current) clearInterval(emotionSnapshotRef.current);
    if ((window as any).eyeTrackingInterval) {
      clearInterval((window as any).eyeTrackingInterval);
      delete (window as any).eyeTrackingInterval;
    }
    
    // Reset all state
    setIsConnected(false);
    setDateStarted(false);
    setDateEnded(false);
    setShowReport(false);
    setUserEmotions([]);
    setDougieEmotions(['happy']);
    setTranscriptSegments([]);
    setEmotionHistory([]);
    setConversationSegments([]);
    setCurrentEngagementLevel(0);
    setConversationFlow(0);
    setShowSidebar(true);
    setShowChat(true);
    setShowPiP(false);
    setPipSize('medium');
    setShowControls(true);
    setShowEngagementDashboard(false);
    setPracticeMode(false);
    setCameraZoomed(false);
    setDelayedShowPiP(false);
    setIsLookingAtScreen(false);
    setLookingHistory([]);
    setShowEyeTracker(false);
    setEyeTrackerType('none');
    setHasPermissions(false);
    setCameraStream(null);
    setUserBlendshapes({});
    setUserDetailedEmotions([]);
    setShowChemistryReport(false);
    setChemistryData(null);
    setPipCameraX(0.70);
    setPipCameraY(1.70);
    setPipCameraZ(1.80);
    setPipCameraFOV(25);
    setPipTargetX(0);
    setPipTargetY(1.0);
    setPipTargetZ(0);
    setShowPipCameraControls(false);
    setCurrentCameraValues('');
    setShowTrackingPreferences(false);
    setTrackingPreferences(null);
    setTrackingConfiguration(null);
    setTrackingInsights(null);
    setIsEyeTrackingEnabled(false);
    setEyeContactPercentage(0);
    setGazeCalibrated(false);
    setEyeContactTotal(0);
    setEyeContactSamples(0);
    setLookAwayCount(0);
    setIsLookingAtAvatar(false);
    setEngagementAnalytics(null);
    setPerformanceMetrics(null);
    setLessonRecommendations([]);
    setCvAnalyticsMode('none');
    setCvAnalyticsData(null);
    setShowCVPanel(false);
    
    // Cleanup services
    safeCleanup();
    
    alert('Emergency reset completed. All systems reset.');
  };

  // CV Panel toggle function
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

  // Get engagement level from analytics data
  const getEngagementLevelFromAnalytics = (): string => {
    if (!cvAnalyticsData) return 'Unknown';
    
    const eyeContactScore = cvAnalyticsData.eyeContact.percentage;
    const postureScore = cvAnalyticsData.posture.shoulderAlignment;
    const overallScore = (eyeContactScore + postureScore) / 2;
    
    if (overallScore >= 80) return 'High';
    if (overallScore >= 50) return 'Medium';
    return 'Low';
  };

  // Get engagement color from analytics data
  const getEngagementColorFromAnalytics = (): string => {
    const level = getEngagementLevelFromAnalytics();
    switch (level) {
      case 'High': return '#22c55e';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Audio playback queue system (matching coach sessions)
  const playNextAudioFromQueue = () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      setAnimationName('idle');
      console.log('[DougieSpeedDateV3] Audio queue empty, animation set to idle');
      return;
    }
    
    console.log('[DougieSpeedDateV3] Playing audio from queue, queue length:', audioQueueRef.current.length);
    isPlayingRef.current = true;
    const audioBlob = audioQueueRef.current.shift()!;
    const audioUrl = URL.createObjectURL(audioBlob);
    
    if (!audioPlayerRef.current) {
      const audioPlayer = new Audio();
      audioPlayer.dataset.dougieSpeedDate = 'true';
      audioPlayerRef.current = audioPlayer;
    }
    
    audioPlayerRef.current.src = audioUrl;
    
    // Setup audio analyzer for lip sync BEFORE playing
    if (!audioSourceCreatedRef.current) {
      try {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContext({ sampleRate: 48000 });
          console.log('[DougieSpeedDateV3] Created new AudioContext');
        }
        
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
          console.log('[DougieSpeedDateV3] AudioContext resumed');
        }
        
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContextRef.current.createMediaElementSource(audioPlayerRef.current);
        source.connect(analyser);
        analyser.connect(audioContextRef.current.destination);
        
        analyserRef.current = analyser;
        audioSourceCreatedRef.current = true;
        console.log('[DougieSpeedDateV3] Audio analyzer setup complete');
      } catch (error) {
        console.error('[DougieSpeedDateV3] Error setting up audio analyzer:', error);
      }
    }
    
    audioPlayerRef.current.play()
      .then(() => {
        console.log('[DougieSpeedDateV3] Audio playing successfully');
        setIsSpeaking(true);
        setAnimationName('talking');
      })
      .catch(e => {
        console.error('[DougieSpeedDateV3] Error playing audio:', e);
        isPlayingRef.current = false;
        setIsSpeaking(false);
        setAnimationName('idle');
        setTimeout(() => playNextAudioFromQueue(), 100);
      });
    
    audioPlayerRef.current.onended = () => {
      console.log('[DougieSpeedDateV3] Audio playback ended');
      URL.revokeObjectURL(audioUrl);
      isPlayingRef.current = false;
      setIsSpeaking(false);
      setAnimationName('idle');
      // Play next audio if available
      setTimeout(() => playNextAudioFromQueue(), 100);
    };
  };

  // Audio playback with basic lip sync
  const playAudio = async (audioBlob: Blob) => {
    console.log('[DougieSpeedDateV3] Audio received:', audioBlob.size);
    setIsSpeaking(true);
    setAnimationName('talking');
    audioQueueRef.current.push(audioBlob);
    if (!isPlayingRef.current) {
      playNextAudioFromQueue();
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

    // Automatically disconnect after sending the closing message
    setTimeout(() => {
      if (isConnected) {
        console.log('[DougieSpeedDateV3] Auto-disconnecting after date end...');
        handleDisconnect();
      }
    }, 2000);

    // Analyze performance and generate recommendations
    if (emotionHistory.length > 0 || transcriptSegments.length > 0) {
      console.log('[DougieSpeedDateV3] Analyzing date performance...');
      const analyzer = new SpeedDatePerformanceAnalyzer();
      
      // Convert emotion history to the format expected by the analyzer
      const formattedEmotionHistory = emotionHistory.map(e => ({
        timestamp: e.timestamp,
        participant: e.participant,
        emotions: e.emotions,
        dominantEmotion: Object.entries(e.emotions).reduce((a, b) => 
          (a as [string, number])[1] > (b as [string, number])[1] ? (a as [string, number]) : (b as [string, number])
        )[0] as string,
        valence: 0,
        arousal: 0
      }));
      
      // Convert transcript segments to include id
      const formattedTranscripts = transcriptSegments.map((seg, idx) => ({
        id: `segment-${idx}`,
        text: seg.text,
        speaker: seg.speaker === 'user' || seg.speaker === 'assistant' ? seg.speaker : 'user' as 'user' | 'assistant',
        timestamp: new Date(seg.timestamp).toISOString(),
        emotion: seg.emotions
      }));
      
      const metrics = analyzer.analyzePerformance(
        formattedEmotionHistory,
        formattedTranscripts,
        eyeContactPercentage,
        cvAnalyticsData?.posture?.confidenceScore || 0,
        SPEED_DATE_DURATION - timeRemaining
      );
      
      const recommendations = analyzer.generateLessonRecommendations(metrics);
      
      setPerformanceMetrics(metrics);
      setLessonRecommendations(recommendations);
      
      console.log('[DougieSpeedDateV3] Performance metrics:', metrics);
      console.log('[DougieSpeedDateV3] Lesson recommendations:', recommendations);
    }

    // Show report after a delay
    setTimeout(() => {
      setShowReport(true);
    }, 3000);
  };

  // Initialize CV analytics based on mode
  const initializeCVAnalytics = async (mode: CVAnalyticsMode) => {
    console.log('[CV ANALYTICS] initializeCVAnalytics called with mode:', mode);
    
    if (!cvVideoRef.current) {
      console.log('[CV ANALYTICS] No video ref, aborting');
      return;
    }
    
    if (mode === 'none') {
      console.log('[CV ANALYTICS] Mode is none, stopping analytics');
      await stopCVAnalytics();
      return;
    }
    
    // Stop any existing analytics first
    console.log('[CV ANALYTICS] Stopping existing analytics before starting new ones');
    await stopCVAnalytics();
    
    try {
      // Ensure camera stream is available
      if (!cvVideoRef.current.srcObject) {
        console.log('[CV ANALYTICS] No video stream, requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
        cvVideoRef.current.srcObject = stream;
        setCameraStream(stream);
        console.log('[CV ANALYTICS] Camera stream obtained');
        
        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            console.log('[CV ANALYTICS] Video ready timeout');
            reject(new Error('Video ready timeout'));
          }, 5000);
          
          const checkReady = () => {
            if (cvVideoRef.current && cvVideoRef.current.readyState >= 2) {
              clearTimeout(timeout);
              console.log('[CV ANALYTICS] Video is ready');
              resolve();
            } else {
              requestAnimationFrame(checkReady);
            }
          };
          checkReady();
        });
      } else {
        console.log('[CV ANALYTICS] Video stream already exists');
      }
      
      // Initialize based on mode
      if (mode === 'posture' || mode === 'combined') {
        console.log('[CV ANALYTICS] Initializing posture tracking...');
        postureServiceRef.current = new PostureTrackingService();
        await postureServiceRef.current.startTracking(cvVideoRef.current);
        postureServiceRef.current.onResults((postureData: any) => {
          updatePostureAnalytics(postureData);
        });
        console.log('[CV ANALYTICS] Posture tracking initialized');
      }
      
      setCvAnalyticsMode(mode);
      console.log('[CV ANALYTICS] Mode set to:', mode);
    } catch (error) {
      console.error('[CV ANALYTICS] Initialization error:', error);
      alert('Failed to initialize CV analytics: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  // Update posture analytics
  const updatePostureAnalytics = (postureData: any) => {
    if (!postureData || !postureData.keypoints) return;
    
    const leftShoulder = postureData.keypoints.leftShoulder;
    const rightShoulder = postureData.keypoints.rightShoulder;
    const nose = postureData.keypoints.nose;
    
    if (!leftShoulder || !rightShoulder || !nose) {
      return;
    }
    
    // Calculate metrics
    const shoulderYDiff = Math.abs(leftShoulder.y - rightShoulder.y);
    const shoulderAlignment = Math.max(0, 100 - (shoulderYDiff * 2));
    const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
    const bodyOpenness = Math.min(100, shoulderWidth / 2);
    
    const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
    const noseLeanOffset = nose.x - shoulderCenterX;
    let leaning: 'neutral' | 'forward' | 'backward' | 'left' | 'right' = 'neutral';
    if (noseLeanOffset > 20) leaning = 'right';
    else if (noseLeanOffset < -20) leaning = 'left';
    
    const confidenceScore = postureData.confidence * 100;
    
    setCvAnalyticsData(prev => {
      const currentData = prev || {
        eyeContact: {
          percentage: 0,
          gazeOnTarget: false,
          lookAwayCount: 0,
          averageContactDuration: 0
        },
        posture: {
          shoulderAlignment: 0,
          headPosition: { x: 0, y: 0 },
          bodyOpenness: 0,
          leaning: 'neutral' as const,
          confidenceScore: 0
        }
      };
      
      return {
        ...currentData,
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

  // Stop CV analytics
  const stopCVAnalytics = async () => {
    console.log('[DougieSpeedDateV3] Stopping CV analytics...');
    
    if (postureServiceRef.current) {
      postureServiceRef.current.stopTracking();
      postureServiceRef.current = null;
    }
    
    setCvAnalyticsData(null);
  };

  // Zoom camera to face
  const handleZoomToFace = () => {
    if (cameraRef.current && controlsRef.current) {
      const targetPosition = cameraZoomed ? [0, 1.6, 1.8] : [0, 1.65, 1.2];
      const targetFOV = cameraZoomed ? 50 : 25;
      const targetLookAt = cameraZoomed ? [0, 1.6, 0] : [0, 1.7, 0];
      
      // Animate camera position
      const startPosition = cameraRef.current.position.clone();
      const startFOV = cameraRef.current.fov;
      const startTarget = controlsRef.current.target.clone();
      const duration = 1000; // 1 second animation
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
        
        // Interpolate position
        cameraRef.current.position.x = startPosition.x + (targetPosition[0] - startPosition.x) * easeProgress;
        cameraRef.current.position.y = startPosition.y + (targetPosition[1] - startPosition.y) * easeProgress;
        cameraRef.current.position.z = startPosition.z + (targetPosition[2] - startPosition.z) * easeProgress;
        
        // Interpolate FOV
        cameraRef.current.fov = startFOV + (targetFOV - startFOV) * easeProgress;
        cameraRef.current.updateProjectionMatrix();
        
        // Interpolate controls target
        controlsRef.current.target.x = startTarget.x + (targetLookAt[0] - startTarget.x) * easeProgress;
        controlsRef.current.target.y = startTarget.y + (targetLookAt[1] - startTarget.y) * easeProgress;
        controlsRef.current.target.z = startTarget.z + (targetLookAt[2] - startTarget.z) * easeProgress;
        controlsRef.current.update();
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      animate();
      setCameraZoomed(!cameraZoomed);
    }
  };

  // Format time remaining
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Audio analysis for lip sync (matching coach sessions)
  useEffect(() => {
    if (!isSpeaking || !analyserRef.current) {
      setAudioData(new Uint8Array());
      return;
    }

    console.log('[DougieSpeedDateV3] Starting audio analysis for lip sync');
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
        console.log('[DougieSpeedDateV3] Audio analysis - Avg level:', avgLevel.toFixed(2), 'Max:', Math.max(...dataArray));
        lastLogTime = now;
      }
      
      animationId = requestAnimationFrame(updateAudioData);
    };

    updateAudioData();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      console.log('[DougieSpeedDateV3] Stopping audio analysis for lip sync');
      setAudioData(new Uint8Array()); // Clear audio data when not speaking
    };
  }, [isSpeaking]);

  const navigate = useNavigate();

  const handleStartLesson = (recommendation: LessonRecommendation) => {
    console.log('[DougieSpeedDateV3] Starting lesson:', recommendation);
    navigate('/coach/lessons', { state: { lesson: recommendation } });
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
            title={`Engagement: ${getEngagementLevelFromAnalytics()}`}
          >
            <div 
              className={`engagement-dot ${getEngagementColorFromAnalytics()}`}
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
          <button 
            className={`toggle-btn ${cameraZoomed ? 'zoomed' : ''}`}
            onClick={handleZoomToFace}
            title={cameraZoomed ? 'Zoom Out' : 'Zoom to Face'}
          >
            <FaEye /> Zoom
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
      <div className={`main-container-v3 ${!showSidebar ? 'full-width' : ''} ${!showChat ? 'full-height' : ''}`}>
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
                    <h5>Step 1: Connection</h5>
                    <div className="control-buttons">
                      <button 
                        className={`control-btn ${isConnected ? 'connected' : ''}`}
                        onClick={() => handleConnectClick()}
                        disabled={isConnected || dateStarted}
                      >
                        {isConnected ? '✅ Connected' : '🎤 Open Connection'}
                      </button>
                      <button 
                        className={`control-btn ${!isConnected ? 'disabled' : ''}`}
                        onClick={() => handleDisconnect()}
                        disabled={!isConnected || dateStarted}
                      >
                        📞 Disconnect
                      </button>
                    </div>
                  </div>

                  <div className="control-group">
                    <h5>Step 2: Date Session</h5>
                    <div className="control-buttons">
                      <button 
                        className={`control-btn ${dateStarted && !dateEnded ? 'active' : ''} ${dateEnded ? 'completed' : ''}`}
                        onClick={() => startDate()}
                        disabled={!isConnected || dateStarted}
                      >
                        {dateEnded ? '✅ Date Completed' : dateStarted ? '▶️ Date in Progress' : '💕 Start Date'}
                      </button>
                      <button 
                        className={`control-btn ${!dateStarted || dateEnded ? 'disabled' : ''}`}
                        onClick={() => endDate()}
                        disabled={!dateStarted || dateEnded}
                      >
                        ⏹️ End Date Early
                      </button>
                    </div>
                    {dateStarted && !dateEnded && (
                      <div className="date-status">
                        <span className="status-indicator active">● Date Active</span>
                        <span className="time-remaining">{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')} remaining</span>
                      </div>
                    )}
                    {dateEnded && (
                      <div className="date-status">
                        <span className="status-indicator completed">● Date Complete - Report Available</span>
                      </div>
                    )}
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
                    
                    {/* Log Camera Position Button */}
                    <div style={{ marginTop: '15px' }}>
                      <button 
                        onClick={() => {
                          const camera = (window as any).pipCamera;
                          if (camera) {
                            const position = {
                              x: camera.position.x.toFixed(3),
                              y: camera.position.y.toFixed(3),
                              z: camera.position.z.toFixed(3),
                              fov: camera.fov.toFixed(1)
                            };
                            
                            const valuesText = `position: [${position.x}, ${position.y}, ${position.z}], fov: ${position.fov}`;
                            setCurrentCameraValues(valuesText);
                            
                            // Also copy to clipboard
                            navigator.clipboard.writeText(valuesText).then(() => {
                              console.log('Camera values copied to clipboard!');
                            });
                          } else {
                            setCurrentCameraValues('Camera not found. Make sure PiP is visible.');
                          }
                        }}
                        style={{
                          background: '#ff6b6b', 
                          color: 'white', 
                          padding: '8px 16px', 
                          borderRadius: '4px', 
                          border: 'none', 
                          cursor: 'pointer',
                          width: '100%',
                          fontWeight: 'bold'
                        }}
                      >
                        📸 Get Current Camera Position
                      </button>
                      
                      {currentCameraValues && (
                        <div style={{ 
                          marginTop: '10px', 
                          padding: '10px', 
                          background: '#f0f0f0', 
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          color: '#333',
                          wordBreak: 'break-all'
                        }}>
                          {currentCameraValues}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pip-camera-controls">
                    <h5>Camera Controls</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ color: '#333', display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Camera X: {pipCameraX.toFixed(2)}</label>
                        <input
                          type="range"
                          min={-3}
                          max={3}
                          step={0.1}
                          value={pipCameraX}
                          onChange={(e) => setPipCameraX(parseFloat(e.target.value))}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ color: '#333', display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Camera Y: {pipCameraY.toFixed(2)}</label>
                        <input
                          type="range"
                          min={0}
                          max={3}
                          step={0.1}
                          value={pipCameraY}
                          onChange={(e) => setPipCameraY(parseFloat(e.target.value))}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ color: '#333', display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Camera Z: {pipCameraZ.toFixed(2)}</label>
                        <input
                          type="range"
                          min={0.5}
                          max={5}
                          step={0.1}
                          value={pipCameraZ}
                          onChange={(e) => setPipCameraZ(parseFloat(e.target.value))}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ color: '#333', display: 'block', fontSize: '12px', fontWeight: 'bold' }}>FOV: {pipCameraFOV.toFixed(0)}</label>
                        <input
                          type="range"
                          min={15}
                          max={75}
                          step={1}
                          value={pipCameraFOV}
                          onChange={(e) => setPipCameraFOV(parseFloat(e.target.value))}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ color: '#333', display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Target Y: {pipTargetY.toFixed(2)}</label>
                        <input
                          type="range"
                          min={-2}
                          max={2}
                          step={0.1}
                          value={pipTargetY}
                          onChange={(e) => setPipTargetY(parseFloat(e.target.value))}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ color: '#333', display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Target Z: {pipTargetZ.toFixed(2)}</label>
                        <input
                          type="range"
                          min={-2}
                          max={2}
                          step={0.1}
                          value={pipTargetZ}
                          onChange={(e) => setPipTargetZ(parseFloat(e.target.value))}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
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

              {/* Emotions Tab */}
              {activeLeftTab === 'emotions' && (
                <div className="emotions-tab">
                  <h4>😊 Your Emotions</h4>
                  {userEmotions.length > 0 ? (
                    <RealTimeEmotionSliders 
                      emotions={userEmotions.map(e => ({ emotion: e, score: 1 }))}
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
                      emotions={dougieEmotions.map(e => ({ emotion: e, score: 1 }))}
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
                </div>
              )}
              {/* Analytics Tab */}
              {activeLeftTab === 'analytics' && (
                <div className="analytics-tab">
                  <h4>📊 Analytics</h4>
                  <div className="analytics-content">
                    {practiceMode ? (
                      <>
                        <p className="practice-mode-notice">🎯 Practice Mode Active</p>
                        
                        {/* CV Analytics Section */}
                        {cvAnalyticsData && (
                          <div className="cv-analytics">
                            <h5>Computer Vision Analytics</h5>
                            
                            {/* Posture Analytics */}
                            {(cvAnalyticsMode === 'posture' || cvAnalyticsMode === 'combined') && cvAnalyticsData.posture && (
                              <div className="cv-analytics-section">
                                <h6>🧍 Posture Analysis</h6>
                                <div className="analytics-metric">
                                  <span className="metric-label">Shoulder Alignment:</span>
                                  <span className={`metric-value ${cvAnalyticsData.posture.shoulderAlignment > 80 ? 'good' : cvAnalyticsData.posture.shoulderAlignment > 60 ? 'moderate' : 'poor'}`}>
                                    {cvAnalyticsData.posture.shoulderAlignment.toFixed(0)}%
                                  </span>
                                </div>
                                <div className="analytics-metric">
                                  <span className="metric-label">Body Openness:</span>
                                  <span className={`metric-value ${cvAnalyticsData.posture.bodyOpenness > 70 ? 'good' : cvAnalyticsData.posture.bodyOpenness > 50 ? 'moderate' : 'poor'}`}>
                                    {cvAnalyticsData.posture.bodyOpenness.toFixed(0)}%
                                  </span>
                                </div>
                                <div className="analytics-metric">
                                  <span className="metric-label">Leaning:</span>
                                  <span className="metric-value">{cvAnalyticsData.posture.leaning}</span>
                                </div>
                                <div className="analytics-metric">
                                  <span className="metric-label">Confidence:</span>
                                  <span className={`metric-value ${cvAnalyticsData.posture.confidenceScore > 80 ? 'good' : cvAnalyticsData.posture.confidenceScore > 60 ? 'moderate' : 'poor'}`}>
                                    {cvAnalyticsData.posture.confidenceScore.toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {!cvAnalyticsData && cvAnalyticsMode === 'none' && (
                          <div className="analytics-empty-state">
                            <p>No CV analytics active.</p>
                            <button 
                              onClick={() => setShowCVPanel(true)}
                              className="analytics-enable-btn"
                            >
                              Enable CV Analytics
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="analytics-content">
                        <p>Enable Practice Mode to see detailed analytics</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className={`main-content-v3 ${!showSidebar ? 'full-width' : ''} ${!showChat ? 'full-height' : ''}`}>
          {/* 3D Scene */}
          <div className="main-scene">
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
                data-keep-context="true"
                onCreated={(state) => {
                  console.log('Canvas created successfully');
                  // Mark the canvas element to preserve its context
                  if (state.gl.domElement) {
                    state.gl.domElement.dataset.keepContext = 'true';
                  }
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
          </div>

          {/* Hidden video element for face tracking */}
          <video
            ref={faceVideoRef}
            style={{ display: 'none' }}
            width={640}
            height={480}
            autoPlay
            playsInline
            muted
          />
          
          {/* PiP User Avatar */}
          {showPiP && pipSize !== 'hidden' && delayedShowPiP && cameraStream && (
            <UserAvatarPiP 
              avatarUrl="/avatars/user_avatar.glb"
              position="bottom-right"
              size="medium"
              enableOwnTracking={true}
              cameraStream={cameraStream}
            />
          )}
          
          {/* Hidden video element for CV analytics */}
          <video
            ref={cvVideoRef}
            style={{ 
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              width: '240px',
              height: '180px',
              border: '2px solid #007bff',
              borderRadius: '8px',
              zIndex: 1000,
              backgroundColor: '#000',
              objectFit: 'cover'
            }}
            autoPlay
            muted
            playsInline
            width={640}
            height={480}
            onLoadedMetadata={() => {
              console.log('[DougieSpeedDateV3] CV video metadata loaded');
              if (cvAnalyticsMode !== 'none') {
                console.log('[DougieSpeedDateV3] Triggering CV analytics init on video ready');
                initializeCVAnalytics(cvAnalyticsMode);
              }
            }}
          />
          
          {/* PiP Toggle Button */}
          {cvVideoRef.current && cameraStream && (
            <button
              style={{
                position: 'fixed',
                bottom: '210px',
                right: '20px',
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                zIndex: 1001
              }}
              onClick={async () => {
                try {
                  if (cvVideoRef.current) {
                    if (document.pictureInPictureElement) {
                      await document.exitPictureInPicture();
                    } else {
                      await cvVideoRef.current.requestPictureInPicture();
                    }
                  }
                } catch (error) {
                  console.error('PiP error:', error);
                }
              }}
            >
              Toggle PiP
            </button>
          )}
          
          {/* Eye Tracking Toggle */}
          <div style={{
            position: 'absolute',
            top: showPipCameraControls ? '290px' : '60px',
            right: '10px',
            zIndex: 1000
          }}>
            <select 
              value={eyeTrackerType}
              onChange={(e) => {
                setEyeTrackerType(e.target.value as EyeTrackerType);
                setShowEyeTracker(e.target.value !== 'none');
              }}
              style={{
                padding: '8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                border: '1px solid #666',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <option value="none">👁️ No Eye Tracking</option>
              <option value="jeeliz">👀 Jeeliz (Simple)</option>
              <option value="eyegestures">🎯 EyeGestures (Advanced)</option>
              <option value="webgazer">👀 WebGazer (Advanced)</option>
            </select>
          </div>
          
          {/* JeelizGlanceTracker - Overlay in top right */}
          {showEyeTracker && eyeTrackerType === 'jeeliz' && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              width: '400px',
              zIndex: 1000,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <JeelizGlanceTracker 
                showVideo={true}
                onWatchingChange={(isWatching) => {
                  setIsLookingAtScreen(isWatching);
                  setLookingHistory(prev => [...prev.slice(-299), isWatching]); // Keep last 300 samples
                }}
              />
            </div>
          )}
          {showEyeTracker && eyeTrackerType === 'eyegestures' && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              width: '400px',
              zIndex: 1000,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <EyeGesturesTracker 
                showVideo={true}
                onGazeChange={(gazeData) => {
                  setIsLookingAtScreen(gazeData.looking);
                  setLookingHistory(prev => [...prev.slice(-299), gazeData.looking]); // Keep last 300 samples
                }}
              />
            </div>
          )}
          {showEyeTracker && eyeTrackerType === 'webgazer' && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              width: '400px',
              zIndex: 1000,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <WebGazerTracker 
                showVideo={true}
                onGazeChange={(gazeData) => {
                  setIsLookingAtScreen(gazeData.looking);
                  setLookingHistory(prev => [...prev.slice(-299), gazeData.looking]); // Keep last 300 samples
                }}
              />
            </div>
          )}

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
                  console.log('[DougieSpeedDateV3] DROPDOWN CHANGED TO:', e.target.value);
                  const mode = e.target.value as CVAnalyticsMode;
                  setCvAnalyticsMode(mode);
                  if (mode !== 'none') {
                    console.log('[DougieSpeedDateV3] CALLING initializeCVAnalytics with mode:', mode);
                    initializeCVAnalytics(mode);
                  } else {
                    console.log('[DougieSpeedDateV3] CALLING stopCVAnalytics');
                    stopCVAnalytics();
                  }
                }}
                className="w-full p-1 border rounded bg-white/10 text-xs"
              >
                <option value="none">None</option>
                <option value="posture">Posture</option>
                <option value="combined">Combined</option>
              </select>
            </div>
            
            <div className="cv-status">
              <div className="status-item">
                <span className="status-label">Mode:</span>
                <strong>{cvAnalyticsMode === 'none' ? 'Disabled' : cvAnalyticsMode}</strong>
              </div>
              <div className="status-item">
                <span className="status-label">Posture Tracking:</span>
                <span className={`status-indicator ${(cvAnalyticsMode === 'posture' || cvAnalyticsMode === 'combined') && postureServiceRef.current ? 'active' : 'inactive'}`}>
                  {(cvAnalyticsMode === 'posture' || cvAnalyticsMode === 'combined') && postureServiceRef.current ? '✅ Active' : '❌ Inactive'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Camera Stream:</span>
                <span className={`status-indicator ${cameraStream ? 'active' : 'inactive'}`}>
                  {cameraStream ? '✅ Active' : '❌ Inactive'}
                </span>
              </div>
              
              {cvAnalyticsData && (
                <div className="cv-live-stats">
                  <h4>Live Stats</h4>
                  {cvAnalyticsData.posture && (cvAnalyticsMode === 'posture' || cvAnalyticsMode === 'combined') && (
                    <div className="live-stat">
                      <span>Posture Score:</span>
                      <strong className={cvAnalyticsData.posture.confidenceScore > 80 ? 'good' : cvAnalyticsData.posture.confidenceScore > 60 ? 'moderate' : 'poor'}>
                        {((cvAnalyticsData.posture.shoulderAlignment + cvAnalyticsData.posture.bodyOpenness) / 2).toFixed(0)}%
                      </strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chemistry Report Modal */}
      {showReport && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
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
                setUserEmotions([]);
                setDougieEmotions([]);
                setAnimationName('idle');
                setIsSpeaking(false);
                setShowPiP(false);
                setPerformanceMetrics(null);
                setLessonRecommendations([]);
              }}
            />
            
            {/* Lesson Recommendations based on performance */}
            {lessonRecommendations.length > 0 && (
              <LessonRecommendations 
                recommendations={lessonRecommendations}
                onStartLesson={handleStartLesson}
              />
            )}
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
