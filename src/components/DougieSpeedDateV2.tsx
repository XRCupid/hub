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
import { EngagementAnalytics } from '../types/tracking';
import { FaLock, FaLockOpen, FaCog, FaEye } from 'react-icons/fa';
import './DougieSpeedDateV2.css';
import { UserAvatarPiP } from './UserAvatarPiP';

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

interface EmotionSnapshot {
  timestamp: number;
  participant1Emotions: { name: string; score: number }[];
  participant2Emotions: { name: string; score: number }[];
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

const DougieSpeedDateV2: React.FC = () => {
  // Core date state
  const [isConnected, setIsConnected] = useState(false);
  const [dateStarted, setDateStarted] = useState(false);
  const [dateEnded, setDateEnded] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(SPEED_DATE_DURATION);
  const [conversationSegments, setConversationSegments] = useState<ConversationSegment[]>([]);
  const [emotionHistory, setEmotionHistory] = useState<EmotionSnapshot[]>([]);
  const [currentEngagementLevel, setCurrentEngagementLevel] = useState(0);
  const [conversationFlow, setConversationFlow] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [cameraLocked, setCameraLocked] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState('emotions');

  // UI toggle states
  const [showSidebar, setShowSidebar] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showPiP, setShowPiP] = useState(true);
  const [pipSize, setPipSize] = useState<'medium' | 'large'>('medium'); // Default to medium for better visibility
  const [showControls, setShowControls] = useState(true);

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

  // Timing
  const [dateStartTime, setDateStartTime] = useState<number>(0);

  // User avatar state
  const [showUserAvatar, setShowUserAvatar] = useState(true);
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

  // Service references
  const voiceServiceRef = useRef<HybridVoiceService | null>(null);
  const expressionServiceRef = useRef<HumeExpressionService | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const emotionSnapshotRef = useRef<NodeJS.Timeout | null>(null);

  // Audio context and analyser
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(new Audio());
  const audioSourceCreatedRef = useRef<boolean>(false);

  // ---------------------------------------------------------------------------
  // SAFETY-NET: ensure connections close even if user closes tab or navigates
  // ---------------------------------------------------------------------------
  const safeCleanup = useCallback(() => {
    try {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.disconnect();
      }
      humeConnectionManager.emergencyCleanupAll();
      console.log('[DougieSpeedDateV2] Safe cleanup executed');
    } catch (err) {
      console.warn('[DougieSpeedDateV2] Safe cleanup error:', err);
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
    console.log('[DougieSpeedDateV2] Initializing services...');

    // Create our audio player first and mark it
    const audioPlayer = new Audio();
    audioPlayer.dataset.dougieSpeedDate = 'true';
    audioPlayerRef.current = audioPlayer;

    // Mute any other audio elements that get created
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLAudioElement && !node.dataset.dougieSpeedDate) {
            console.log('[DougieSpeedDateV2] Muting external audio element');
            node.muted = true;
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const setupServices = async () => {
      try {
        // Initialize voice service
        voiceServiceRef.current = new HybridVoiceService();

        // Initialize expression service
        expressionServiceRef.current = new HumeExpressionService();

        console.log('[DougieSpeedDateV2] Services initialized');
      } catch (error) {
        console.error('[DougieSpeedDateV2] Service initialization failed:', error);
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
      if (voiceServiceRef.current) {
        // Setup voice service callbacks
        voiceServiceRef.current.onAudio((audioBlob: Blob) => {
          console.log('[DougieSpeedDateV2] Audio received, size:', audioBlob.size);
          if (audioBlob.size > 0) {
            setIsSpeaking(true);
            setAnimationName('talking');
            playAudio(audioBlob);
          }
        });

        // CRITICAL: Add Hume prosody emotion callback for Dougie's emotions
        voiceServiceRef.current.onEmotion((emotions: { name: string; score: number }[]) => {
          console.log('[DougieSpeedDateV2] 🎭 Prosody emotions received for Dougie:', emotions.slice(0, 5));
          setDougieEmotions(emotions);

          // Convert Hume prosody emotions to blendshapes for avatar animation
          const blendshapes: Record<string, number> = {};
          emotions.forEach(emotion => {
            if (emotion.score > 0.1) { // Only include emotions with meaningful scores
              blendshapes[emotion.name] = emotion.score;
            }
          });

          console.log('[DougieSpeedDateV2] 🎭 Generated emotional blendshapes from prosody:', Object.keys(blendshapes).length, 'emotions');
          console.log('[DougieSpeedDateV2] 🎭 Sample blendshapes:', Object.entries(blendshapes).slice(0, 3));
          setEmotionalBlendshapes(blendshapes);
          
          // ENHANCED: Verify state update
          setTimeout(() => {
            console.log('[DougieSpeedDateV2] 🎭 Emotional blendshapes state updated');
          }, 100);
        });

        voiceServiceRef.current.onMessage((message: any) => {
          console.log('[DougieSpeedDateV2] Message received:', message);
          const messageText = typeof message === 'string' ? message :
                            (message?.message?.content || JSON.stringify(message));

          // Add to transcript WITH current emotion data
          const newSegment: TranscriptSegment = {
            timestamp: Date.now(),
            speaker: 'assistant',
            text: messageText,
            emotions: [...dougieEmotions] // Use actual Dougie emotions from prosody
          };
          setTranscriptSegments(prev => [...prev, newSegment]);
        });

        voiceServiceRef.current.onUserMessage((message: string) => {
          console.log('[DougieSpeedDateV2] User message:', message);
          // Add to transcript WITH current user emotion data
          const newSegment: TranscriptSegment = {
            timestamp: Date.now(),
            speaker: 'user',
            text: message,
            emotions: [...userFacialEmotions] // Use actual user emotions from face tracking
          };
          setTranscriptSegments(prev => [...prev, newSegment]);
        });

        voiceServiceRef.current.onError((error: Error) => {
          console.error('[DougieSpeedDateV2] Voice service error:', error);
        });

        // Connect to the service
        await voiceServiceRef.current.connect(DOUGIE_CONFIG.humeConfigId);
        setIsConnected(true);
        console.log('[DougieSpeedDateV2] Voice service connected');
      }
    } catch (error) {
      console.error('[DougieSpeedDateV2] Failed to connect:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (voiceServiceRef.current) {
        await voiceServiceRef.current.disconnect();
        setIsConnected(false);
        console.log('[DougieSpeedDateV2] Voice service disconnected');
      }
    } catch (error) {
      console.error('[DougieSpeedDateV2] Failed to disconnect:', error);
    }
  };

  // Start the speed date
  const startDate = async () => {
    try {
      console.log('[DougieSpeedDateV2] Starting date with tracking config:', trackingConfiguration);

      // Initialize tracking if configuration is available
      if (trackingConfiguration) {
        try {
          await trackingCoordinator.initializeTracking(trackingConfiguration);
          console.log('[DougieSpeedDateV2] Tracking system initialized successfully');
        } catch (trackingError) {
          console.warn('[DougieSpeedDateV2] Tracking initialization failed, continuing without:', trackingError);
        }
      }

      // Ensure AudioContext is resumed (user interaction required)
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        console.log('[DougieSpeedDateV2] AudioContext resumed');
      }

      setDateStarted(true);
      setDateStartTime(Date.now());

      // Start facial expression tracking
      if (videoRef.current) {
        await expressionServiceRef.current!.startTracking(videoRef.current);
        expressionServiceRef.current!.setOnEmotionCallback((emotions: any[]) => {
          const formattedEmotions = emotions.map(e => ({ 
            name: 'emotion' in e ? (e as any).emotion : e.name, 
            score: e.score 
          }));
          setUserFacialEmotions(formattedEmotions);
        });
      }

      // Start the date
      setTimeout(() => {
        console.log('[DougieSpeedDateV2] Sending initial greeting to trigger conversation');
        voiceServiceRef.current!.sendMessage("Hi!");

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
          const snapshot: EmotionSnapshot = {
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

  // Play audio with lip sync analysis
  const playAudio = async (audioBlob: Blob) => {
    // Add unique ID to track this audio playback
    const audioId = Date.now() + Math.random();
    console.log(`[DougieSpeedDateV2] Starting audio playback ${audioId}, blob size:`, audioBlob.size);

    // ENHANCED: Validate audio blob before playing
    if (!audioBlob || audioBlob.size === 0) {
      console.warn('[DougieSpeedDateV2] Invalid or empty audio blob received');
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
          console.log('[DougieSpeedDateV2] Created new AudioContext');
        }

        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
          console.log('[DougieSpeedDateV2] Resumed AudioContext');
        }

        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContextRef.current.createMediaElementSource(audioPlayerRef.current);
        source.connect(analyser);
        analyser.connect(audioContextRef.current.destination);

        analyserRef.current = analyser;
        audioSourceCreatedRef.current = true;
        console.log('[DougieSpeedDateV2] Audio analyzer setup complete');
      } catch (error) {
        console.error('[DougieSpeedDateV2] Error setting up audio analyzer:', error);
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
      console.log('[DougieSpeedDateV2] Audio playing successfully');

      // Start lip sync animation
      const updateLipSync = () => {
        if (!isPlaying || !analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        setAudioData(new Uint8Array(dataArray)); // Create a copy to trigger re-render

        requestAnimationFrame(updateLipSync);
      };
      updateLipSync();
    } catch (e) {
      console.error('[DougieSpeedDateV2] Error playing audio:', e);
      isPlaying = false;
      // Clean up on error
      URL.revokeObjectURL(audioUrl);
      setIsSpeaking(false);
      setAnimationName('idle');
    }

    // Handle audio end
    audioPlayerRef.current.onended = () => {
      console.log('[DougieSpeedDateV2] Audio playback ended');
      URL.revokeObjectURL(audioUrl);
      isPlaying = false;
      // Reset audio data and animation
      setAudioData(new Uint8Array(128));
      setIsSpeaking(false);
      setAnimationName('idle');
    };

    // ENHANCED: Add error handler for audio element
    audioPlayerRef.current.onerror = (error) => {
      console.error('[DougieSpeedDateV2] Audio element error:', error);
      URL.revokeObjectURL(audioUrl);
      isPlaying = false;
      setIsSpeaking(false);
      setAnimationName('idle');
    };
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
    humeConnectionManager.releaseConnection('DougieSpeedDateV2').catch(err => 
      console.warn('[DougieSpeedDateV2] Connection cleanup failed:', err)
    );

    if (expressionServiceRef.current) expressionServiceRef.current.stopTracking();
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  };

  // Emergency reset
  const emergencyReset = () => {
    console.log('[DougieSpeedDateV2] Emergency reset triggered');
    cleanup();
    window.location.reload();
  };

  // Format time remaining
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    console.log('[DougieSpeedDateV2] 🎭 Avatar Props:', {
      animationName,
      hasAudioData: !!audioData && audioData.length > 0,
      emotionalBlendshapesCount: Object.keys(emotionalBlendshapes).length,
      sampleBlendshapes: Object.entries(emotionalBlendshapes).slice(0, 3),
      dougieEmotionsCount: dougieEmotions.length
    });
  }, [animationName, audioData, emotionalBlendshapes, dougieEmotions]);

  return (
    <div className="dougie-speed-date-v2">
      <div className="app-container-v2">
        {/* Top Bar - Toggle Controls */}
        <div className="top-bar-v2">
          <h2>DougieSpeedDate V2 - Clean Layout Test</h2>
          <button onClick={() => handleConnectClick()}>Connect</button>
          <button onClick={() => handleDisconnect()}>Disconnect</button>
          <button onClick={() => startDate()}>Start Date</button>
          {/* UI Toggle Controls */}
          <div className="ui-toggles">
            <button 
              className={`toggle-btn ${showSidebar ? 'active' : ''}`}
              onClick={() => setShowSidebar(!showSidebar)}
            >
              📋 Sidebar
            </button>
            <button 
              className={`toggle-btn ${showChat ? 'active' : ''}`}
              onClick={() => setShowChat(!showChat)}
            >
              💬 Chat
            </button>
            <button 
              className={`toggle-btn ${showPiP ? 'active' : ''}`}
              onClick={() => setShowPiP(!showPiP)}
            >
              📹 PiP
            </button>
            <button 
              className={`toggle-btn ${showControls ? 'active' : ''}`}
              onClick={() => setShowControls(!showControls)}
            >
              🎤 Controls
            </button>
          </div>
        </div>

        {/* Left Sidebar - Toggleable */}
        {showSidebar && (
          <div className="left-sidebar-v2">
            {/* Tab Navigation */}
            <div className="tab-navigation">
              <button 
                className={`tab-btn ${activeLeftTab === 'emotions' ? 'active' : ''}`}
                onClick={() => setActiveLeftTab('emotions')}
              >
                🎭 Emotions
              </button>
              <button 
                className={`tab-btn ${activeLeftTab === 'session' ? 'active' : ''}`}
                onClick={() => setActiveLeftTab('session')}
              >
                ⏱️ Session
              </button>
              <button 
                className={`tab-btn ${activeLeftTab === 'controls' ? 'active' : ''}`}
                onClick={() => setActiveLeftTab('controls')}
              >
                📹 Controls
              </button>
              <button 
                className={`tab-btn ${activeLeftTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveLeftTab('profile')}
              >
                👤 Profile
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeLeftTab === 'emotions' && (
                <div className="emotions-tab">
                  <h4>Your Emotions</h4>
                  {userFacialEmotions.length > 0 ? (
                    <RealTimeEmotionSliders 
                      emotions={userFacialEmotions.map(e => ({ emotion: e.name, score: e.score }))}
                      participantName="You"
                      position="left"
                    />
                  ) : (
                    <div className="no-emotions">
                      <p>Start date to track emotions</p>
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
                      <p>Start date to track emotions</p>
                    </div>
                  )}
                </div>
              )}

              {activeLeftTab === 'session' && (
                <div className="session-tab">
                  <h4>Date Timer</h4>
                  <div className="timer-display">
                    {dateStarted ? formatTime(timeRemaining) : "5:00"} remaining
                  </div>
                  
                  <h4>Status</h4>
                  <div className="status-indicators">
                    <div className={`status-item ${isConnected ? 'connected' : 'disconnected'}`}>
                      {isConnected ? '🟢' : '🔴'} Connection: {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                    <div className={`status-item ${dateStarted ? 'active' : 'inactive'}`}>
                      {dateStarted ? '▶️' : '⏸️'} Date: {dateStarted ? 'In Progress' : 'Not Started'}
                    </div>
                    {dateEnded && (
                      <div className="status-item completed">
                        ✅ Date: Completed
                      </div>
                    )}
                  </div>
                  
                  <h4>Progress</h4>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{width: `${((SPEED_DATE_DURATION - timeRemaining) / SPEED_DATE_DURATION) * 100}%`}}
                    ></div>
                  </div>
                </div>
              )}

              {activeLeftTab === 'controls' && (
                <div className="controls-tab">
                  <h4>Camera Controls</h4>
                  <button 
                    className={`control-btn ${cameraLocked ? 'active' : ''}`}
                    onClick={() => {
                      setCameraLocked(!cameraLocked);
                      if (controlsRef.current) {
                        controlsRef.current.enabled = !cameraLocked;
                      }
                    }}
                  >
                    {cameraLocked ? <FaLock /> : <FaLockOpen />} 
                    {cameraLocked ? 'Unlock Camera' : 'Lock Camera'}
                  </button>
                  
                  <h4>Display Options</h4>
                  <button 
                    className={`control-btn ${showUserAvatar ? 'active' : ''}`}
                    onClick={() => setShowUserAvatar(!showUserAvatar)}
                    disabled={!dateStarted}
                  >
                    <FaEye /> 
                    {showUserAvatar ? 'Hide User Avatar' : 'Show User Avatar'}
                  </button>
                  
                  <h4>Audio Controls</h4>
                  <div className="audio-info">
                    <p>Speaking: {isSpeaking ? 'Yes' : 'No'}</p>
                    <p>Animation: {animationName}</p>
                    {audioContextRef.current && (
                      <p>Audio Context: {audioContextRef.current.state}</p>
                    )}
                  </div>
                </div>
              )}

              {activeLeftTab === 'profile' && (
                <div className="profile-tab">
                  <h4>Session Goals</h4>
                  <div className="goal-tag">💕 Casual Dating</div>
                  
                  <h4>Shared Interests</h4>
                  <div className="interest-tag">🎬 Movies</div>
                  <div className="interest-tag">🏔️ Travel</div>
                  <div className="interest-tag">🍕 Food</div>
                  
                  <h4>Preferences</h4>
                  <div className="preference">Voice Tone: Warm</div>
                  <div className="preference">Style: Playful</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Area - Adjust for toggles */}
        <div className={`main-content-v2 ${!showSidebar ? 'full-width' : ''} ${!showChat ? 'full-height' : ''}`}>
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
                {showUserAvatar ? (
                  <WebGLErrorBoundary fallback={
                    <div className="pip-fallback">
                      <p>3D Avatar Loading...</p>
                      <video ref={videoRef} autoPlay playsInline muted style={{width: '70px', height: '50px', borderRadius: '3px'}} />
                    </div>
                  }>
                    <UserAvatarPiP
                      size={pipSize}
                      position="bottom-right"
                      enableOwnTracking={true}
                      trackingData={userFacialEmotions}
                      cameraStream={null}
                      className="pip-user-avatar"
                    />
                  </WebGLErrorBoundary>
                ) : (
                  <div className="pip-placeholder">
                    <h4>Your Avatar</h4>
                    <p>Enable in Controls tab</p>
                    {!isConnected && <p><small>Connect first</small></p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dedicated Hume Controls Zone */}
          {showControls && (
            <div className="hume-controls-zone">
              <h3>Hume Voice Controls</h3>
              <div className="hume-buttons">
                <button 
                  className={`hume-btn start-call ${isConnected ? 'connected' : ''}`}
                  onClick={() => handleConnectClick()}
                  disabled={isConnected}
                >
                  {isConnected ? '✅ Connected' : '🎤 Connect Voice'}
                </button>
                <button 
                  className={`hume-btn end-call ${!isConnected ? 'disabled' : ''}`}
                  onClick={() => handleDisconnect()}
                  disabled={!isConnected}
                >
                  📞 Disconnect
                </button>
                <button 
                  className={`hume-btn start-date ${dateStarted ? 'active' : ''}`}
                  onClick={() => startDate()}
                  disabled={!isConnected || dateStarted || dateEnded}
                >
                  {dateStarted ? '▶️ Date Active' : '💕 Start Date'}
                </button>
                <button 
                  className={`hume-btn end-date ${!dateStarted ? 'disabled' : ''}`}
                  onClick={() => endDate()}
                  disabled={!dateStarted || dateEnded}
                >
                  ⏹️ End Date
                </button>
                <button 
                  className="hume-btn emergency-reset"
                  onClick={() => emergencyReset()}
                >
                  🚨 Emergency Reset
                </button>
              </div>
              
              {/* Connection Status */}
              <div className="connection-status">
                <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                  {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                </span>
                {dateStarted && (
                  <span className="date-status">
                    📅 Date Active - {formatTime(timeRemaining)} remaining
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 3D Scene */}
          <Canvas className="three-canvas">
            <PerspectiveCamera makeDefault position={[0, 1.6, 3]} />
            <OrbitControls 
              ref={controlsRef}
              enabled={!cameraLocked}
              target={[0, 1, 0]}
              minDistance={1}
              maxDistance={8}
              maxPolarAngle={Math.PI / 2}
            />
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} />
            <WebGLErrorBoundary>
              <PresenceAvatarMaleCoach 
                avatarUrl="/avatars/DougieG.glb"
                animationName={animationName}
                audioData={audioData}
                emotionalBlendshapes={emotionalBlendshapes}
                scale={1}
                position={[0, 0, 0]}
              />
            </WebGLErrorBoundary>
          </Canvas>

          {/* Bottom Chat Area */}
          {showChat && (
            <div className="bottom-chat-v2">
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
                setShowUserAvatar(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DougieSpeedDateV2;
