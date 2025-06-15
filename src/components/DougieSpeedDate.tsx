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
import { UnifiedTrackingCoordinator, DateTrackingPreferences, SessionContext, TrackingConfiguration } from '../services/UnifiedTrackingCoordinator';
import { FaLock, FaLockOpen, FaCog, FaEye } from 'react-icons/fa';
import './DougieSpeedDate.css'; // CRITICAL: Import the CSS file!
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
  
  // Advanced analytics
  engagementLevel: number; // 0-1 based on emotional intensity
  jokeDetected?: boolean;
  questionAsked?: boolean;
  storyTelling?: boolean;
  interruptionOccurred?: boolean;
  responseLatency?: number; // ms delay before speaking
  energyLevel: number; // vocal energy/volume
  emotionalRange: number; // variety of emotions expressed
  
  // Conversation flow metrics
  topicShift?: boolean;
  followUpToPartner?: boolean;
  activeListening?: boolean; // facial expressions while partner speaks
}

interface PerformanceMetrics {
  // Speaker Analytics
  speakerMetrics: {
    totalSpeakTime: number;
    averageSegmentLength: number;
    jokeSuccessRate: number; // jokes that got positive response
    storyEngagementScore: number;
    questionQuality: number; // questions that got elaborative responses
    energyConsistency: number;
    emotionalRange: number; // variety of emotions expressed
  };
  
  // Listener Analytics  
  listenerMetrics: {
    activeListeningScore: number; // facial expressions during partner's speech
    responseQuality: number; // how well they build on partner's topics
    emotionalMirroring: number; // mimicking partner's emotions
    interruptionRate: number;
    encouragementSignals: number; // nods, smiles, etc.
  };
  
  // Overall Performance
  overallScores: {
    charisma: number;
    empathy: number;
    authenticity: number;
    chemistry: number;
    conversationFlow: number;
  };
  
  // Insights for improvement
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

const DOUGIE_CONFIG = {
  id: 'dougie',
  name: 'Dougie',
  avatarUrl: '/avatars/DougieG.glb',
  humeConfigId: '320d816a-8dac-44e6-b59b-1c3d2b6b24d9',
  convaiCharacterId: '', 
  venue: '/images/coffee-shop.jpg',
  personality: 'charming, witty, adventurous',
  description: 'a charming entrepreneur who loves adventure and deep conversations',
  speedDatePrompts: [
    "So tell me, what brings you to speed dating? I'm always curious about people's stories.",
    "I have to say, you have such an interesting energy about you. What do you do for fun?",
    "What's something you're really passionate about? I love hearing what makes people's eyes light up."
  ]
};

const SPEED_DATE_DURATION = 300; // 5 minutes in seconds

const DougieSpeedDate: React.FC = () => {
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
  const [activeLeftTab, setActiveLeftTab] = useState('video'); // Tab state

  // State management
  const [showTrackingPreferences, setShowTrackingPreferences] = useState(false); // Set to false to prevent modal on load
  const [trackingPreferences, setTrackingPreferences] = useState<DateTrackingPreferences | null>(null);
  const [trackingConfiguration, setTrackingConfiguration] = useState<TrackingConfiguration | null>(null);
  const [trackingCoordinator] = useState(() => new UnifiedTrackingCoordinator());
  const [trackingInsights, setTrackingInsights] = useState(null);
  
  // Emotion tracking
  const [userFacialEmotions, setUserFacialEmotions] = useState<{ name: string; score: number }[]>([]);
  const [userProsodyEmotions, setUserProsodyEmotions] = useState<{ name: string; score: number }[]>([]);
  const [dougieEmotions, setDougieEmotions] = useState<{ name: string; score: number }[]>([]);
  
  // Transcript tracking  
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  // Audio and animation
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(128));
  const [animationName, setAnimationName] = useState('idle');
  const [emotionalBlendshapes, setEmotionalBlendshapes] = useState<Record<string, number>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // ---------------------------------------------------------------------------
  // SAFETY-NET: ensure connections close even if user closes tab or navigates
  // ---------------------------------------------------------------------------
  const safeCleanup = useCallback(() => {
    try {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.disconnect();
      }
      humeConnectionManager.emergencyCleanupAll();
      console.log('[DougieSpeedDate] Safe cleanup executed');
    } catch (err) {
      console.warn('[DougieSpeedDate] Safe cleanup error:', err);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('beforeunload', safeCleanup);
    return () => {
      safeCleanup(); // also run on React unmount
      window.removeEventListener('beforeunload', safeCleanup);
    };
  }, [safeCleanup]);

  // Timer
  const [dateStartTime, setDateStartTime] = useState<number>(0);
  
  // Services
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
  
  const [showUserAvatar, setShowUserAvatar] = useState(false);
  const controlsRef = useRef<any>(null);

  // Enhanced analytics tracking
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [currentSegmentStart, setCurrentSegmentStart] = useState<number | null>(null);
  const [lastSpeechEvent, setLastSpeechEvent] = useState<{speaker: 'user' | 'dougie', timestamp: number} | null>(null);
  
  // Analytics view state
  const [analyticsViewMode, setAnalyticsViewMode] = useState<'speaker' | 'listener' | 'combined'>('combined');
  const [showDetailedAnalytics, setShowDetailedAnalytics] = useState(false);
  
  // Real-time analysis state
  const [listeningQuality, setListeningQuality] = useState(0);

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
    console.log('[DougieSpeedDate] Initializing services...');
    
    // Create our audio player first and mark it
    const audioPlayer = new Audio();
    audioPlayer.dataset.dougieSpeedDate = 'true';
    audioPlayerRef.current = audioPlayer;
    
    // Mute any other audio elements that get created
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLAudioElement && !node.dataset.dougieSpeedDate) {
            console.log('[DougieSpeedDate] Muting external audio element');
            node.muted = true;
            node.volume = 0;
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Initialize AudioContext
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContextClass({ sampleRate: 48000 });
    console.log('[DougieSpeedDate] AudioContext initialized');
    
    // Initialize voice service using connection manager
    const initializeVoiceService = async () => {
      if (!voiceServiceRef.current) {
        try {
          console.log('[DougieSpeedDate] Getting voice service from connection manager...');
          voiceServiceRef.current = await humeConnectionManager.getConnection('DougieSpeedDate', DOUGIE_CONFIG.humeConfigId);
          voiceServiceRef.current.setUseHumeForConversation(true);
          console.log('[DougieSpeedDate] HybridVoiceService initialized via connection manager');
        } catch (error) {
          console.error('[DougieSpeedDate] Failed to get voice service:', error);
          // Fallback to direct initialization
          voiceServiceRef.current = new HybridVoiceService();
          voiceServiceRef.current.setUseHumeForConversation(true);
        }
      }
    };
    
    initializeVoiceService();
    
    // Initialize expression service
    expressionServiceRef.current = new HumeExpressionService();
    
    return () => {
      observer.disconnect();
      cleanup();
    };
  }, []);

  // Set up voice service callbacks and connect
  useEffect(() => {
    if (!voiceServiceRef.current || isConnected) return;
    
    const setupVoiceService = async () => {
      try {
        console.log('[DougieSpeedDate] Setting up voice service callbacks...');
        
        // Set up callbacks
        voiceServiceRef.current!.onAudio(async (audioBlob: Blob) => {
          console.log('[DougieSpeedDate] Audio received, size:', audioBlob.size);
          
          // Set speaking animation and state immediately when audio arrives
          setAnimationName('talking');
          setIsSpeaking(true);
          
          try {
            await playAudio(audioBlob);
          } catch (error) {
            console.error('[DougieSpeedDate] Error playing audio:', error);
            // Reset state on error
            setAnimationName('idle');
            setIsSpeaking(false);
            setAudioData(new Uint8Array(128));
          }
        });
        
        voiceServiceRef.current!.onMessage((message: any) => {
          console.log('[DougieSpeedDate] Message received:', message);
          const messageText = typeof message === 'string' ? message : 
                            (message?.message?.content || message?.content || 
                             JSON.stringify(message));
          
          if (messageText && messageText.trim()) {
            setCurrentTranscript(messageText);
            
            // Add to transcript segments for UI display
            const transcriptSegment: TranscriptSegment = {
              timestamp: Date.now(),
              speaker: 'Dougie',
              text: messageText,
              emotions: [], // Empty for now
              dominantEmotion: 'neutral'
            };
            setTranscriptSegments(prev => [...prev, transcriptSegment]);
            
            // Create detailed conversation segment for analytics
            const segmentEnd = Date.now();
            const duration = currentSegmentStart ? segmentEnd - currentSegmentStart : 1000;
            
            const segment = analyzeConversationSegment(
              messageText,
              'dougie',
              [], // Dougie's facial emotions (avatar driven)
              dougieEmotions,
              duration / 1000
            );
            
            const fullSegment: ConversationSegment = {
              ...segment,
              timestamp: (segmentEnd - dateStartTime) / 1000
            };
            
            setConversationSegments(prev => [...prev, fullSegment]);
            
            // Update real-time metrics
            setCurrentEngagementLevel(segment.engagementLevel);
            setConversationFlow(prev => (prev + (segment.followUpToPartner ? 1 : 0.5)) / 2);
            
            // Reset for next segment
            setCurrentSegmentStart(null);
            setLastSpeechEvent({speaker: 'dougie', timestamp: segmentEnd});
          }
        });
        
        voiceServiceRef.current!.onUserMessage((message: string) => {
          console.log('[DougieSpeedDate] User message:', message);
          
          // Add to transcript segments for UI display
          const userTranscriptSegment: TranscriptSegment = {
            timestamp: Date.now(),
            speaker: 'You',
            text: message,
            emotions: [], // Empty for now
            dominantEmotion: 'neutral'
          };
          setTranscriptSegments(prev => [...prev, userTranscriptSegment]);
          
          // Create user conversation segment
          const segmentEnd = Date.now();
          const duration = currentSegmentStart ? segmentEnd - currentSegmentStart : 1000;
          
          const segment = analyzeConversationSegment(
            message,
            'user',
            userFacialEmotions,
            userProsodyEmotions,
            duration / 1000
          );
          
          const fullSegment: ConversationSegment = {
            ...segment,
            timestamp: (segmentEnd - dateStartTime) / 1000
          };
          
          setConversationSegments(prev => [...prev, fullSegment]);
          
          // Calculate response latency if there was a previous speech event
          if (lastSpeechEvent && lastSpeechEvent.speaker === 'dougie') {
            const latency = segmentEnd - lastSpeechEvent.timestamp;
            // Update the segment with response latency
            setConversationSegments(prev => {
              const updated = [...prev];
              if (updated.length > 0) {
                updated[updated.length - 1].responseLatency = latency;
              }
              return updated;
            });
          }
          
          // Update real-time listening quality based on user's engagement during Dougie's speech
          const listeningSignals = userFacialEmotions.filter(e => 
            ['interest', 'joy', 'engagement', 'surprise'].includes(e.name.toLowerCase()) && e.score > 30
          ).length;
          setListeningQuality(listeningSignals / Math.max(userFacialEmotions.length, 1));
          
          setCurrentSegmentStart(segmentEnd);
          setLastSpeechEvent({speaker: 'user', timestamp: segmentEnd});
        });
        
        voiceServiceRef.current!.onEmotion((emotions: Array<{name: string, score: number}>) => {
          console.log('[DougieSpeedDate] Emotions received:', emotions);
          setDougieEmotions(emotions);
          
          // CRITICAL: Convert emotions to blendshapes for avatar
          const blendshapes: Record<string, number> = {};
          emotions.forEach(emotion => {
            // Map common Hume emotions to facial blendshapes
            switch(emotion.name.toLowerCase()) {
              case 'joy':
              case 'happiness':
                blendshapes.mouthSmileLeft = emotion.score * 0.8;
                blendshapes.mouthSmileRight = emotion.score * 0.8;
                blendshapes.cheekSquintLeft = emotion.score * 0.3;
                blendshapes.cheekSquintRight = emotion.score * 0.3;
                break;
              case 'surprise':
              case 'amazement':
                blendshapes.browInnerUp = emotion.score * 0.7;
                blendshapes.browOuterUpLeft = emotion.score * 0.6;
                blendshapes.browOuterUpRight = emotion.score * 0.6;
                blendshapes.eyeWideLeft = emotion.score * 0.5;
                blendshapes.eyeWideRight = emotion.score * 0.5;
                break;
              case 'confusion':
              case 'concentration':
                blendshapes.browDownLeft = emotion.score * 0.4;
                blendshapes.browDownRight = emotion.score * 0.4;
                blendshapes.browInnerUp = emotion.score * 0.3;
                break;
              case 'interest':
              case 'engagement':
                blendshapes.browInnerUp = emotion.score * 0.2;
                blendshapes.mouthSmileLeft = emotion.score * 0.3;
                blendshapes.mouthSmileRight = emotion.score * 0.3;
                break;
              case 'love':
              case 'admiration':
                blendshapes.mouthSmileLeft = emotion.score * 0.6;
                blendshapes.mouthSmileRight = emotion.score * 0.6;
                blendshapes.eyeSquintLeft = emotion.score * 0.2;
                blendshapes.eyeSquintRight = emotion.score * 0.2;
                break;
              case 'excitement':
                blendshapes.mouthSmileLeft = emotion.score * 0.7;
                blendshapes.mouthSmileRight = emotion.score * 0.7;
                blendshapes.browInnerUp = emotion.score * 0.4;
                break;
              case 'sadness':
              case 'disappointment':
                blendshapes.mouthFrownLeft = emotion.score * 0.5;
                blendshapes.mouthFrownRight = emotion.score * 0.5;
                blendshapes.browDownLeft = emotion.score * 0.3;
                blendshapes.browDownRight = emotion.score * 0.3;
                break;
              case 'contempt':
              case 'disgust':
                blendshapes.mouthLeft = emotion.score * 0.4;
                blendshapes.noseSneerLeft = emotion.score * 0.3;
                blendshapes.eyeSquintLeft = emotion.score * 0.2;
                break;
            }
          });
          
          console.log('[DougieSpeedDate] Generated blendshapes:', blendshapes);
          setEmotionalBlendshapes(blendshapes);
        });
        
        voiceServiceRef.current!.onUserMessage((message: string) => {
          console.log('[DougieSpeedDate] User message:', message);
        });
        
        voiceServiceRef.current!.onError((error: Error) => {
          console.error('[DougieSpeedDate] Voice service error:', error);
        });
        
        // Connect to the service
        await voiceServiceRef.current!.connect(DOUGIE_CONFIG.humeConfigId);
        setIsConnected(true);
        console.log('[DougieSpeedDate] Voice service connected successfully');
        
      } catch (error) {
        console.error('[DougieSpeedDate] Failed to connect voice service:', error);
      }
    };
    
    setupVoiceService();
  }, []);

  // Cleanup function
  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (emotionSnapshotRef.current) clearInterval(emotionSnapshotRef.current);
    
    // Use connection manager for proper cleanup
    humeConnectionManager.releaseConnection('DougieSpeedDate').catch(err => 
      console.warn('[DougieSpeedDate] Connection cleanup failed:', err)
    );
    
    if (expressionServiceRef.current) expressionServiceRef.current.stopTracking();
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  };

  // Connection handlers
  const handleConnectClick = async () => {
    try {
      if (voiceServiceRef.current) {
        await voiceServiceRef.current.connect(DOUGIE_CONFIG.humeConfigId);
        setIsConnected(true);
        console.log('[DougieSpeedDate] Voice service connected');
      }
    } catch (error) {
      console.error('[DougieSpeedDate] Failed to connect:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (voiceServiceRef.current) {
        await voiceServiceRef.current.disconnect();
        setIsConnected(false);
        console.log('[DougieSpeedDate] Voice service disconnected');
      }
    } catch (error) {
      console.error('[DougieSpeedDate] Failed to disconnect:', error);
    }
  };

  // Start the speed date
  const startDate = async () => {
    try {
      console.log('[DougieSpeedDate] Starting date with tracking config:', trackingConfiguration);
      
      // Initialize tracking if configuration is available
      if (trackingConfiguration) {
        try {
          await trackingCoordinator.initializeTracking(trackingConfiguration);
          console.log('[DougieSpeedDate] Tracking system initialized successfully');
        } catch (trackingError) {
          console.warn('[DougieSpeedDate] Tracking initialization failed, continuing without:', trackingError);
        }
      }
      
      // Ensure AudioContext is resumed (user interaction required)
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        console.log('[DougieSpeedDate] AudioContext resumed');
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
        console.log('[DougieSpeedDate] Sending initial greeting to trigger conversation');
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
    console.log(`[DougieSpeedDate] Starting audio playback ${audioId}, blob size:`, audioBlob.size);
    
    // Create URL for the audio blob
    const audioUrl = URL.createObjectURL(audioBlob);
    audioPlayerRef.current.src = audioUrl;
    
    // Setup audio analyzer for lip sync BEFORE playing (like coaches do)
    if (!audioSourceCreatedRef.current) {
      try {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioContext();
          console.log('[DougieSpeedDate] Created new AudioContext');
        }
        
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
          console.log('[DougieSpeedDate] Resumed AudioContext');
        }
        
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContextRef.current.createMediaElementSource(audioPlayerRef.current);
        source.connect(analyser);
        analyser.connect(audioContextRef.current.destination);
        
        analyserRef.current = analyser;
        audioSourceCreatedRef.current = true;
        console.log('[DougieSpeedDate] Audio analyzer setup complete');
      } catch (error) {
        console.error('[DougieSpeedDate] Error setting up audio analyzer:', error);
      }
    }
    
    // Use a local flag for the animation loop
    let isPlaying = true;
    
    // Play the audio
    audioPlayerRef.current.play()
      .then(() => {
        console.log('[DougieSpeedDate] Audio playing successfully');
        
        // Start lip sync animation
        const updateLipSync = () => {
          if (!isPlaying || !analyserRef.current) return;
          
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          setAudioData(new Uint8Array(dataArray)); // Create a copy to trigger re-render (like coaches!)
          
          requestAnimationFrame(updateLipSync);
        };
        updateLipSync();
      })
      .catch(e => {
        console.error('[DougieSpeedDate] Error playing audio:', e);
        isPlaying = false;
      });
    
    // Handle audio end
    audioPlayerRef.current.onended = () => {
      console.log('[DougieSpeedDate] Audio playback ended');
      URL.revokeObjectURL(audioUrl);
      isPlaying = false;
      // Reset audio data and animation
      setAudioData(new Uint8Array(128));
      setIsSpeaking(false);
      setAnimationName('idle');
    };
  };

  // End the date
  const endDate = () => {
    console.log('[DougieSpeedDate] ENDING DATE - Cleaning up connections...');
    
    // CRITICAL: Disconnect Hume service immediately
    if (voiceServiceRef.current && isConnected) {
      console.log('[DougieSpeedDate] Disconnecting Hume voice service...');
      voiceServiceRef.current.disconnect();
      setIsConnected(false);
    }
    
    // Clear timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (emotionSnapshotRef.current) clearInterval(emotionSnapshotRef.current);
    
    // Emergency cleanup via connection manager
    humeConnectionManager.emergencyCleanupAll();
    
    setDateEnded(true);
    setAnimationName('idle');
    
    // Generate comprehensive performance analytics
    console.log('[DougieSpeedDate] Generating final performance report...');
    console.log('Conversation segments:', conversationSegments.length);
    console.log('Emotion history:', emotionHistory.length);
    
    const finalMetrics = generateFinalReport();
    console.log('Final performance metrics:', finalMetrics);
    
    // Show report after a delay
    setTimeout(() => {
      setShowReport(true);
    }, 2000); // Reduced delay since connection is already closed
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Convert emotions to tracking data format for UserAvatarPiP
  const userTrackingData = useMemo(() => {
    if (!userFacialEmotions || userFacialEmotions.length === 0) return null;
    
    // Convert emotions array to facial expressions object
    const facialExpressions: any = {};
    userFacialEmotions.forEach(emotion => {
      facialExpressions[emotion.name] = emotion.score / 100; // Convert to 0-1 range
    });
    
    return {
      facialExpressions,
      posture: null,
      hands: null,
      headRotation: null,
      landmarks: null
    };
  }, [userFacialEmotions]);

  // Advanced analytics functions
  const analyzeConversationSegment = (
    text: string, 
    speaker: 'user' | 'dougie',
    facialEmotions: { name: string; score: number }[],
    prosodyEmotions: { name: string; score: number }[],
    duration: number
  ): Omit<ConversationSegment, 'timestamp'> => {
    
    // Detect conversation patterns
    const isQuestion = text.includes('?') || 
      /^(what|how|when|where|why|who|do you|are you|have you|would you|could you)/i.test(text.trim());
    
    const isJoke = /haha|hehe|lol|funny|joke/i.test(text) || 
      facialEmotions.some(e => e.name.toLowerCase() === 'amusement' && e.score > 60);
    
    const isStory = text.length > 50 && 
      /\b(so|then|and then|after that|suddenly|once|yesterday|last)\b/i.test(text);
    
    const hasPositiveResponse = facialEmotions.some(e => 
      ['joy', 'amusement', 'interest', 'excitement'].includes(e.name.toLowerCase()) && e.score > 40
    );
    
    // Calculate engagement level based on emotion intensity
    const emotionIntensity = [...facialEmotions, ...prosodyEmotions]
      .reduce((sum, e) => sum + e.score, 0) / Math.max(facialEmotions.length + prosodyEmotions.length, 1);
    
    const engagementLevel = Math.min(emotionIntensity / 100, 1);
    
    // Calculate energy level from prosody
    const energyLevel = prosodyEmotions
      .filter(e => ['excitement', 'enthusiasm', 'energy'].includes(e.name.toLowerCase()))
      .reduce((sum, e) => sum + e.score, 0) / 100;
    
    // Calculate emotional range (variety of emotions)
    const allEmotions = [...facialEmotions, ...prosodyEmotions];
    const significantEmotions = allEmotions.filter(e => e.score > 20); // Only count emotions above threshold
    const emotionalRange = significantEmotions.length / Math.max(allEmotions.length, 1);
    
    return {
      speaker,
      text,
      duration,
      facialEmotions,
      prosodyEmotions,
      engagementLevel,
      jokeDetected: isJoke,
      questionAsked: isQuestion,
      storyTelling: isStory,
      energyLevel,
      emotionalRange,
      followUpToPartner: false, // TODO: Analyze if building on partner's previous comment
      activeListening: speaker === 'user' ? false : hasPositiveResponse
    };
  };

  const calculatePerformanceMetrics = (segments: ConversationSegment[]): PerformanceMetrics => {
    const userSegments = segments.filter(s => s.speaker === 'user');
    const dougieSegments = segments.filter(s => s.speaker === 'dougie');
    
    // Speaker metrics (user as speaker)
    const totalSpeakTime = userSegments.reduce((sum, s) => sum + s.duration, 0);
    const averageSegmentLength = totalSpeakTime / Math.max(userSegments.length, 1);
    
    const jokes = userSegments.filter(s => s.jokeDetected);
    const jokeSuccessRate = jokes.length > 0 ? 
      jokes.filter(joke => {
        // Check Dougie's response for positive reaction
        const jokeIndex = segments.indexOf(joke);
        const nextSegment = segments[jokeIndex + 1];
        return nextSegment && nextSegment.speaker === 'dougie' && 
          nextSegment.facialEmotions.some(e => ['joy', 'amusement'].includes(e.name.toLowerCase()) && e.score > 50);
      }).length / jokes.length : 0;
    
    const stories = userSegments.filter(s => s.storyTelling);
    const storyEngagementScore = stories.length > 0 ?
      stories.reduce((sum, story) => {
        const storyIndex = segments.indexOf(story);
        const nextSegment = segments[storyIndex + 1];
        const engagement = nextSegment ? nextSegment.engagementLevel : 0;
        return sum + engagement;
      }, 0) / stories.length : 0;
    
    const questions = userSegments.filter(s => s.questionAsked);
    const questionQuality = questions.length > 0 ?
      questions.reduce((sum, q) => {
        const qIndex = segments.indexOf(q);
        const response = segments[qIndex + 1];
        // Good questions get longer, more engaged responses
        const responseQuality = response ? 
          (response.text.length > 30 ? 0.5 : 0) + (response.engagementLevel * 0.5) : 0;
        return sum + responseQuality;
      }, 0) / questions.length : 0;
    
    // Listener metrics (user as listener during Dougie's segments)
    const listeningSegments = dougieSegments.length;
    const activeListeningScore = listeningSegments > 0 ?
      dougieSegments.reduce((sum, dSegment) => {
        // User's facial expressions during Dougie's speech
        const userEmotions = userFacialEmotions; // Current user emotions during this segment
        const listeningSignals = userEmotions.filter(e => 
          ['interest', 'joy', 'engagement', 'surprise'].includes(e.name.toLowerCase()) && e.score > 30
        ).length;
        return sum + (listeningSignals / Math.max(userEmotions.length, 1));
      }, 0) / listeningSegments : 0;
    
    // Calculate overall scores
    const charisma = (jokeSuccessRate * 0.3 + storyEngagementScore * 0.4 + questionQuality * 0.3);
    const empathy = activeListeningScore;
    const authenticity = userSegments.reduce((sum, s) => sum + s.emotionalRange, 0) / Math.max(userSegments.length, 1);
    const chemistry = emotionHistory.length > 0 ? 
      emotionHistory.reduce((sum, snap) => {
        const userPos = snap.participant1Emotions.filter(e => ['joy', 'interest'].includes(e.name.toLowerCase())).reduce((s, e) => s + e.score, 0);
        const dougiePos = snap.participant2Emotions.filter(e => ['joy', 'interest'].includes(e.name.toLowerCase())).reduce((s, e) => s + e.score, 0);
        return sum + Math.min(userPos, dougiePos) / 200;
      }, 0) / emotionHistory.length : 0;
    
    const conversationFlowScore = segments.length > 1 ?
      segments.slice(1).reduce((sum, segment, index) => {
        const prevSegment = segments[index];
        const hasGoodTransition = segment.followUpToPartner || 
          (segment.questionAsked && prevSegment.speaker !== segment.speaker);
        return sum + (hasGoodTransition ? 1 : 0);
      }, 0) / (segments.length - 1) : 0;
    
    // Generate insights
    const insights = generateInsights({
      charisma,
      empathy,
      authenticity,
      chemistry,
      conversationFlow: conversationFlowScore,
      jokeSuccessRate,
      questionQuality,
      activeListeningScore
    });
    
    return {
      speakerMetrics: {
        totalSpeakTime,
        averageSegmentLength,
        jokeSuccessRate,
        storyEngagementScore,
        questionQuality,
        energyConsistency: userSegments.reduce((sum, s) => sum + s.energyLevel, 0) / Math.max(userSegments.length, 1),
        emotionalRange: userSegments.reduce((sum, s) => sum + s.emotionalRange, 0) / Math.max(userSegments.length, 1)
      },
      listenerMetrics: {
        activeListeningScore,
        responseQuality: questionQuality, // How well they respond to partner's questions
        emotionalMirroring: 0.5, // TODO: Calculate emotional mirroring
        interruptionRate: 0, // TODO: Detect interruptions
        encouragementSignals: activeListeningScore * 10 // Approximate from listening score
      },
      overallScores: {
        charisma,
        empathy,
        authenticity,
        chemistry,
        conversationFlow: conversationFlowScore
      },
      insights
    };
  };

  const generateInsights = (scores: any) => {
    const strengths: string[] = [];
    const improvementAreas: string[] = [];
    const specificTips: string[] = [];
    
    if (scores.charisma > 0.7) {
      strengths.push("Excellent storytelling and humor");
    } else if (scores.charisma < 0.3) {
      improvementAreas.push("Work on engaging storytelling");
      specificTips.push("Try sharing more personal anecdotes and asking follow-up questions");
    }
    
    if (scores.empathy > 0.7) {
      strengths.push("Great active listening skills");
    } else if (scores.empathy < 0.3) {
      improvementAreas.push("Improve active listening");
      specificTips.push("Show more facial expressions and engagement when your date is speaking");
    }
    
    if (scores.jokeSuccessRate > 0.5) {
      strengths.push("Good sense of humor");
    } else if (scores.jokeSuccessRate < 0.3 && scores.jokeSuccessRate > 0) {
      specificTips.push("Try reading the room better before making jokes");
    }
    
    if (scores.questionQuality > 0.6) {
      strengths.push("Asks engaging questions");
    } else {
      improvementAreas.push("Ask more open-ended questions");
      specificTips.push("Instead of yes/no questions, try 'What was that like?' or 'How did that make you feel?'");
    }
    
    return { strengths, improvementAreas, specificTips };
  };

  // Generate final performance report
  const generateFinalReport = () => {
    const metrics = calculatePerformanceMetrics(conversationSegments);
    setPerformanceMetrics(metrics);
    return metrics;
  };

  // Render advanced analytics report
  const renderAdvancedAnalytics = () => {
    if (!performanceMetrics) return null;
    
    const { speakerMetrics, listenerMetrics, overallScores, insights } = performanceMetrics;
    
    return (
      <div className="advanced-analytics-container">
        <div className="analytics-header">
          <h2>📊 Advanced Dating Performance Analytics</h2>
          
          {/* View Mode Toggle */}
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${analyticsViewMode === 'speaker' ? 'active' : ''}`}
              onClick={() => setAnalyticsViewMode('speaker')}
            >
              🎤 As Speaker
            </button>
            <button 
              className={`toggle-btn ${analyticsViewMode === 'listener' ? 'active' : ''}`}
              onClick={() => setAnalyticsViewMode('listener')}
            >
              👂 As Listener
            </button>
            <button 
              className={`toggle-btn ${analyticsViewMode === 'combined' ? 'active' : ''}`}
              onClick={() => setAnalyticsViewMode('combined')}
            >
              🔄 Combined
            </button>
          </div>
        </div>

        {/* Overall Scores */}
        <div className="overall-scores">
          <h3>🎯 Overall Performance</h3>
          <div className="score-grid">
            <div className="score-item">
              <span className="score-label">Charisma</span>
              <div className="score-bar">
                <div 
                  className="score-fill charisma" 
                  style={{width: `${overallScores.charisma * 100}%`}}
                />
              </div>
              <span className="score-value">{Math.round(overallScores.charisma * 100)}%</span>
            </div>
            <div className="score-item">
              <span className="score-label">Empathy</span>
              <div className="score-bar">
                <div 
                  className="score-fill empathy" 
                  style={{width: `${overallScores.empathy * 100}%`}}
                />
              </div>
              <span className="score-value">{Math.round(overallScores.empathy * 100)}%</span>
            </div>
            <div className="score-item">
              <span className="score-label">Authenticity</span>
              <div className="score-bar">
                <div 
                  className="score-fill authenticity" 
                  style={{width: `${overallScores.authenticity * 100}%`}}
                />
              </div>
              <span className="score-value">{Math.round(overallScores.authenticity * 100)}%</span>
            </div>
            <div className="score-item">
              <span className="score-label">Chemistry</span>
              <div className="score-bar">
                <div 
                  className="score-fill chemistry" 
                  style={{width: `${overallScores.chemistry * 100}%`}}
                />
              </div>
              <span className="score-value">{Math.round(overallScores.chemistry * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Speaker Analytics */}
        {(analyticsViewMode === 'speaker' || analyticsViewMode === 'combined') && (
          <div className="speaker-analytics">
            <h3>🎤 Speaker Performance</h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <h4>Joke Success Rate</h4>
                <div className="metric-value">{Math.round(speakerMetrics.jokeSuccessRate * 100)}%</div>
                <div className="metric-description">
                  How often your jokes got positive reactions
                </div>
              </div>
              <div className="metric-card">
                <h4>Story Engagement</h4>
                <div className="metric-value">{Math.round(speakerMetrics.storyEngagementScore * 100)}%</div>
                <div className="metric-description">
                  How engaging your stories were to your date
                </div>
              </div>
              <div className="metric-card">
                <h4>Question Quality</h4>
                <div className="metric-value">{Math.round(speakerMetrics.questionQuality * 100)}%</div>
                <div className="metric-description">
                  How well your questions sparked conversation
                </div>
              </div>
              <div className="metric-card">
                <h4>Energy Level</h4>
                <div className="metric-value">{Math.round(speakerMetrics.energyConsistency * 100)}%</div>
                <div className="metric-description">
                  Consistency of your vocal energy
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Listener Analytics */}
        {(analyticsViewMode === 'listener' || analyticsViewMode === 'combined') && (
          <div className="listener-analytics">
            <h3>👂 Listener Performance</h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <h4>Active Listening</h4>
                <div className="metric-value">{Math.round(listenerMetrics.activeListeningScore * 100)}%</div>
                <div className="metric-description">
                  Facial expressions and engagement while listening
                </div>
              </div>
              <div className="metric-card">
                <h4>Response Quality</h4>
                <div className="metric-value">{Math.round(listenerMetrics.responseQuality * 100)}%</div>
                <div className="metric-description">
                  How well you built on your date's topics
                </div>
              </div>
              <div className="metric-card">
                <h4>Encouragement</h4>
                <div className="metric-value">{Math.round(listenerMetrics.encouragementSignals)}x</div>
                <div className="metric-description">
                  Times you showed encouragement signals
                </div>
              </div>
              <div className="metric-card">
                <h4>Emotional Sync</h4>
                <div className="metric-value">{Math.round(listenerMetrics.emotionalMirroring * 100)}%</div>
                <div className="metric-description">
                  How well you mirrored your date's emotions
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Insights Section */}
        <div className="insights-section">
          <h3>💡 Personalized Insights</h3>
          
          {insights.strengths.length > 0 && (
            <div className="insights-card strengths">
              <h4>🌟 Your Strengths</h4>
              <ul>
                {insights.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>
          )}
          
          {insights.improvementAreas.length > 0 && (
            <div className="insights-card improvements">
              <h4>🎯 Areas for Growth</h4>
              <ul>
                {insights.improvementAreas.map((area, index) => (
                  <li key={index}>{area}</li>
                ))}
              </ul>
            </div>
          )}
          
          {insights.specificTips.length > 0 && (
            <div className="insights-card tips">
              <h4>💪 Specific Tips</h4>
              <ul>
                {insights.specificTips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Conversation Timeline */}
        <div className="conversation-timeline">
          <h3>📋 Conversation Analysis</h3>
          <div className="timeline-container">
            {conversationSegments.map((segment, index) => (
              <div key={index} className={`timeline-segment ${segment.speaker}`}>
                <div className="segment-header">
                  <span className="speaker-name">
                    {segment.speaker === 'user' ? 'You' : 'Dougie'}
                  </span>
                  <span className="segment-time">
                    {Math.round(segment.timestamp)}s
                  </span>
                  <span className="engagement-level">
                    Engagement: {Math.round(segment.engagementLevel * 100)}%
                  </span>
                </div>
                <div className="segment-content">
                  <p>{segment.text}</p>
                  <div className="segment-tags">
                    {segment.jokeDetected && <span className="tag joke">😄 Joke</span>}
                    {segment.questionAsked && <span className="tag question">❓ Question</span>}
                    {segment.storyTelling && <span className="tag story">📖 Story</span>}
                    {segment.activeListening && <span className="tag listening">👂 Active Listening</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render report view
  if (showReport && !showTranscript) {
    return (
      <div className="dougie-speed-date report-view">
        <ChemistryReport
          emotionHistory={emotionHistory}
          participant1Name="You"
          participant2Name={DOUGIE_CONFIG.name}
          callDuration={300 - timeRemaining}
          transcriptSegments={transcriptSegments}
          onClose={() => setShowReport(false)}
        />
        <button 
          className="view-transcript-btn"
          onClick={() => setShowTranscript(true)}
        >
          View Full Transcript
        </button>
        {renderAdvancedAnalytics()}
      </div>
    );
  }

  // Render transcript view
  if (showTranscript) {
    return (
      <div className="dougie-speed-date transcript-view">
        <div className="transcript-header">
          <h2>Speed Date Transcript with {DOUGIE_CONFIG.name}</h2>
          <button onClick={() => setShowTranscript(false)}>Back to Report</button>
        </div>
        <TranscriptTimeline
          segments={transcriptSegments}
          callDuration={SPEED_DATE_DURATION - timeRemaining}
        />
      </div>
    );
  }

  // Main date interface
  return (
    <div className="dougie-speed-date">
      {/* EMERGENCY PANIC BUTTON - Always Visible */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2" style={{ zIndex: 999999 }}>
        <button 
          onClick={endDate}
          style={{
            backgroundColor: '#FF0000',
            color: 'white',
            padding: '15px 30px',
            border: '3px solid #fff',
            borderRadius: '50px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            boxShadow: '0 8px 16px rgba(255,0,0,0.5)',
            animation: 'pulse 2s infinite',
            minWidth: '200px'
          } as any}
          title="Emergency: End the call immediately"
        >
          🚨 EMERGENCY END CALL 🚨
        </button>
      </div>
      
      {/* Hidden video for face tracking */}
      <video ref={videoRef} style={{ display: 'none' }} autoPlay playsInline />
      
      {/* Pre-date screen */}
      {!dateStarted && !showReport && (
        <div className="pre-date-screen">
          <h1>Speed Date with {DOUGIE_CONFIG.name}</h1>
          <p>{DOUGIE_CONFIG.description}</p>
          
          <div className="date-rules">
            <h3>Speed Date Rules</h3>
            <ul>
              <li>Be yourself and have fun!</li>
              <li>Ask questions and share stories</li>
              <li>Keep it light and engaging</li>
              <li>You have 5 minutes to make a connection</li>
            </ul>
          </div>
          
          {/* Start Button */}
          {!showTrackingPreferences && (
            <div className="start-date-section">
              <button 
                className="start-date-button"
                onClick={() => setShowTrackingPreferences(true)}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '15px 30px',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  marginTop: '20px',
                  boxShadow: '0 4px 8px rgba(255, 20, 147, 0.3)',
                  transition: 'all 0.3s ease'
                } as any}
                onMouseOver={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.backgroundColor = '#FF69B4';
                  target.style.transform = 'scale(1.05)';
                }}
                onMouseOut={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.backgroundColor = '#4CAF50';
                  target.style.transform = 'scale(1)';
                }}
              >
                🌹 Start Speed Date with Dougie
              </button>
              <p style={{ marginTop: '10px', fontSize: '0.9rem', opacity: 0.8 }}>
                Click to configure your tracking preferences and begin!
              </p>
              
              {/* Emergency cleanup button for investor demos */}
              <button 
                onClick={() => {
                  humeConnectionManager.emergencyCleanupAll();
                  window.location.reload();
                }}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  padding: '8px 16px',
                  fontSize: '0.8rem',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  marginTop: '10px',
                  opacity: 0.7
                } as any}
                title="Emergency: Reset all Hume connections and reload page"
              >
                🚨 Emergency Reset
              </button>
            </div>
          )}
          
          {showTrackingPreferences && (
            console.log('[DEBUG] showTrackingPreferences is true'),
            <TrackingPreferencesSelector
              npcId="dougie"
              activityType="speed-date"
              onPreferencesSelected={async (preferences: DateTrackingPreferences) => {
                console.log('[DEBUG] Preferences selected:', preferences);
                console.log('[DougieSpeedDate] Tracking preferences selected:', preferences);
                setTrackingPreferences(preferences);
                
                // Create session context
                const sessionContext: SessionContext = {
                  activityType: 'speed-date',
                  npcId: 'dougie',
                  lessonObjectives: ['conversation-skills', 'confidence', 'authenticity'],
                  userPreferences: preferences,
                  deviceCapabilities: {
                    platform: 'desktop',
                    performance: 'high',
                    networkQuality: 'excellent',
                    hasWebGL: true,
                    hasWebAssembly: true,
                    cameraQuality: 'hd',
                    processingPower: 8
                  }
                };
                
                // Configure tracking
                const config = trackingCoordinator.selectModelsForSession(sessionContext);
                setTrackingConfiguration(config);
                
                setShowTrackingPreferences(false);
                await startDate();
              }}
              onCancel={() => setShowTrackingPreferences(false)}
            />
          )}
        </div>
      )}
      
      {/* Date screen */}
      {dateStarted && !showReport && (
        <div 
          className="dougie-speed-date-scene"
          style={{
            backgroundImage: 'url(/Venues/GreatBistro.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* WebGL Error Boundary for Avatar */}
          <WebGLErrorBoundary fallback={
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 1 }}>
              <div className="text-center text-white bg-black/80 p-8 rounded-lg">
                <div className="text-6xl mb-4">👤</div>
                <h2 className="text-2xl font-bold mb-2">{DOUGIE_CONFIG.name}</h2>
                <p className="text-lg opacity-80">
                  {isConnected ? '🎤 Voice chat active' : '⚡ Ready to connect'}
                </p>
                <p className="text-sm opacity-60 mt-2">
                  3D Avatar unavailable (WebGL not supported)
                </p>
              </div>
            </div>
          }>
            {/* 3D Scene Layer - Main Avatar */}
            <div className="absolute inset-0" style={{ zIndex: 1 }}>
              <Canvas
                camera={{ position: [0, 0, 5], fov: 50 }}
                gl={{ 
                  antialias: true,
                  alpha: true,
                  preserveDrawingBuffer: true
                }}
              >
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                
                <React.Suspense fallback={null}>
                  <PresenceAvatarMaleCoach
                    avatarUrl={DOUGIE_CONFIG.avatarUrl}
                    position={[0, -0.2, 0]} // Raise avatar slightly
                    scale={1.0}
                    animationName={animationName}
                    emotionalBlendshapes={emotionalBlendshapes}
                    audioData={audioData}
                    participantId="dougie"
                  />
                </React.Suspense>
                <OrbitControls 
                  ref={controlsRef}
                  enablePan={!cameraLocked}
                  enableZoom={!cameraLocked}
                  enableRotate={!cameraLocked}
                  target={[0, 1.5, 0]} // Focus on face level
                  minDistance={1.5}
                  maxDistance={5}
                  minPolarAngle={Math.PI / 4}
                  maxPolarAngle={Math.PI / 2}
                  autoRotate={false}
                  autoRotateSpeed={0}
                  enableDamping={true}
                  dampingFactor={0.05}
                />
              </Canvas>
            </div>
          </WebGLErrorBoundary>
          
          {/* User Avatar PiP - Top Right Corner */}
          <div className="absolute top-20 right-4 w-24 h-24" style={{ zIndex: 999998 }}>
            <UserAvatarPiP
              position="top-right"
              size="small"
              trackingData={userTrackingData}
              enableOwnTracking={true}
            />
          </div>
          
          {/* UI Overlay Layer */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10000 }}>
            
            {/* Top Bar */}
            <div className="date-top-bar pointer-events-auto">
              <div className="flex items-center gap-4">
                <div className="connection-status">
                  Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                </div>
                
                {!isConnected && (
                  <button 
                    onClick={handleConnectClick}
                    className="connect-button"
                    style={{
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    } as any}
                  >
                    Connect
                  </button>
                )}
                
                {isConnected && (
                  <button 
                    onClick={handleDisconnect}
                    className="disconnect-button"
                    style={{
                      backgroundColor: '#f44336',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    } as any}
                  >
                    Disconnect
                  </button>
                )}
                
                {/* Emergency cleanup button for investor demos */}
                <button 
                  onClick={() => {
                    humeConnectionManager.emergencyCleanupAll();
                    window.location.reload();
                  }}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    padding: '8px 16px',
                    fontSize: '14px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    opacity: 0.8
                  } as any}
                  title="Emergency: Reset all Hume connections and reload page"
                >
                  🚨 Emergency Reset
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="timer" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </div>
                
                <button 
                  onClick={endDate}
                  style={{
                    backgroundColor: '#DC143C',
                    color: 'white',
                    padding: '12px 24px',
                    border: '2px solid #fff',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                  } as any}
                >
                  🛑 END CALL
                </button>
              </div>
            </div>
            
            {/* Left Sidebar */}
            <div 
              className="date-sidebar-left pointer-events-auto"
              style={{
                position: 'fixed',
                left: '0px',
                top: '60px',
                bottom: '0px',
                width: '280px',
                backgroundColor: 'rgba(20, 20, 20, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRight: '1px solid rgba(255, 255, 255, 0.2)',
                zIndex: 1000,
                padding: '20px',
                overflowY: 'auto',
                display: 'block'
              }}
            >
              <div className="sidebar-tabs">
                <button 
                  className={`tab-button ${activeLeftTab === 'video' ? 'active' : ''}`}
                  onClick={() => setActiveLeftTab('video')}
                  style={{
                    background: activeLeftTab === 'video' ? '#ff6b6b' : 'transparent',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    cursor: 'pointer',
                    flex: 1
                  } as any}
                >
                  Video
                </button>
                <button 
                  className={`tab-button ${activeLeftTab === 'emotions' ? 'active' : ''}`}
                  onClick={() => setActiveLeftTab('emotions')}
                  style={{
                    background: activeLeftTab === 'emotions' ? '#ff6b6b' : 'transparent',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    cursor: 'pointer',
                    flex: 1
                  } as any}
                >
                  Emotions
                </button>
                <button 
                  className={`tab-button ${activeLeftTab === 'tracking' ? 'active' : ''}`}
                  onClick={() => setActiveLeftTab('tracking')}
                  style={{
                    background: activeLeftTab === 'tracking' ? '#ff6b6b' : 'transparent',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    cursor: 'pointer',
                    flex: 1
                  } as any}
                >
                  Tracking
                </button>
              </div>
              {activeLeftTab === 'video' && (
                <div className="sidebar-section" style={{ marginBottom: '30px' }}>
                  <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '1.1rem' }}>YOUR VIDEO</h3>
                  <div className="user-video-container" style={{ 
                    width: '200px', 
                    height: '200px', 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                    borderRadius: '12px',
                    padding: '15px',
                    overflow: 'auto',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    {userTrackingData?.facialExpressions ? 'Face detected' : 'No face detected'}
                  </div>
                </div>
              )}
              {activeLeftTab === 'emotions' && (
                <div className="sidebar-section" style={{ marginBottom: '30px' }}>
                  <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '1.1rem' }}>YOUR EMOTIONS</h3>
                  <RealTimeEmotionSliders
                    emotions={userFacialEmotions.map(e => ({ emotion: e.name, score: e.score }))}
                    participantName="You"
                  />
                </div>
              )}
              {activeLeftTab === 'tracking' && (
                <div className="sidebar-section" style={{ marginBottom: '30px' }}>
                  <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '1.1rem' }}>DOUGIE'S EMOTIONS</h3>
                  <RealTimeEmotionSliders
                    emotions={dougieEmotions.map(e => ({ emotion: e.name, score: e.score }))}
                    participantName={DOUGIE_CONFIG.name}
                  />
                </div>
              )}
              
              <div className="sidebar-section">
                <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '1.1rem' }}>CAMERA CONTROLS</h3>
                <button
                  onClick={() => setCameraLocked(!cameraLocked)}
                  className="camera-lock-button"
                  style={{
                    backgroundColor: cameraLocked ? '#ff6b35' : '#4CAF50',
                    color: 'white',
                    padding: '10px 15px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    justifyContent: 'center'
                  } as any}
                >
                  {cameraLocked ? <FaLock /> : <FaLockOpen />}
                  {cameraLocked ? 'Camera Locked' : 'Camera Free'}
                </button>
                <p style={{ fontSize: '12px', color: '#ccc', marginTop: '8px', lineHeight: '1.4' }}>
                  {cameraLocked 
                    ? 'Camera is locked. Click to enable mouse controls.'
                    : 'Use mouse to pan, zoom, and rotate the camera view.'
                  }
                </p>
              </div>
            </div>
            
            {/* Right Sidebar */}
            <div className="date-sidebar-right pointer-events-auto">
              <div className="sidebar-section">
                <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '1.1rem' }}>LIVE TRANSCRIPT</h3>
                <div 
                  className="transcript-container"
                  style={{
                    height: 'calc(100vh - 120px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '15px',
                    overflow: 'auto',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {transcriptSegments.length === 0 ? (
                    <div style={{ color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: '50px' }}>
                      Transcript will appear here during conversation...
                    </div>
                  ) : (
                    transcriptSegments.map((segment, index) => (
                      <div key={index} style={{ marginBottom: '12px' }}>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#888', 
                          marginBottom: '4px' 
                        }}>
                          {segment.timestamp} - {segment.speaker}
                        </div>
                        <div style={{ 
                          color: 'white', 
                          fontSize: '14px',
                          lineHeight: '1.4'
                        }}>
                          {segment.text}
                        </div>
                      </div>
                    ))
                  )}
                  
                  {currentTranscript && (
                    <div style={{ 
                      marginTop: '12px',
                      padding: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                        Currently speaking: {currentTranscript}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Chemistry Report */}
      {showReport && (
        <ChemistryReport
          emotionHistory={emotionHistory}
          participant1Name="You"
          participant2Name={DOUGIE_CONFIG.name}
          callDuration={300 - timeRemaining}
          transcriptSegments={transcriptSegments}
          onClose={() => {
            // Reset everything
            setShowReport(false);
            setDateStarted(false);
            setTimeRemaining(300);
            setTranscriptSegments([]);
            setCurrentTranscript('');
            setIsConnected(false);
            setIsSpeaking(false);
            setAnimationName('idle');
            setUserFacialEmotions([]);
            setDougieEmotions([]);
            setEmotionalBlendshapes({});
            setAudioData(new Uint8Array(128));
          }}
        />
      )}
      
      {/* Tracking Status Indicator */}
      {trackingConfiguration && (
        <TrackingStatusIndicator
          configuration={trackingConfiguration}
          isActive={isConnected && dateStarted}
          insights={trackingInsights}
        />
      )}
    </div>
  );
};

export default DougieSpeedDate;
