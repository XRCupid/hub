import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { VoiceProvider } from '@humeai/voice-react';
import { HumeNPCManager } from './HumeNPCManager';
import { PreloadedRPMSystem } from './PreloadedRPMAvatar';
import { ProceduralAvatar } from './ProceduralAvatar';
import { avatarGenerator } from '../services/AvatarAutoGenerator';
import { scoringSystem } from '../services/UnifiedScoringSystem';
import { trackingOrchestrator } from '../services/TrackingOrchestrator';
import { avatarMirrorSystem } from '../services/AvatarMirrorSystem';
import { simpleFacialTracking } from '../services/SimpleFacialTracking';
import { NPCPersonalities, NPCPersonality } from '../config/NPCPersonalities';
import { FacialBlendShapes } from '../services/AvatarMirrorSystem';
import './DatingSimulationMaster.css';

interface DatingSimulationMasterProps {
  scenario?: 'first-date' | 'coffee-chat' | 'dinner-date' | 'activity-date';
  npcId?: string;
  showMetrics?: boolean;
  mirrorMode?: boolean; // Enable avatar mirroring
}

export const DatingSimulationMaster: React.FC<DatingSimulationMasterProps> = ({
  scenario = 'first-date',
  npcId,
  showMetrics = true,
  mirrorMode = false
}) => {
  const [currentNPC, setCurrentNPC] = useState<NPCPersonality | null>(null);
  const [npcAvatarUrl, setNpcAvatarUrl] = useState<string>('');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string>('');
  const [scores, setScores] = useState(scoringSystem.getCurrentScores());
  const [phase, setPhase] = useState<'greeting' | 'small-talk' | 'deep-conversation' | 'closing'>('greeting');
  const [sessionActive, setSessionActive] = useState(false);
  const [userBlendShapes, setUserBlendShapes] = useState<any>({});
  const [npcBlendShapes, setNpcBlendShapes] = useState<any>({});
  const [sessionMetrics, setSessionMetrics] = useState<any>(null);
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize simulation
  useEffect(() => {
    const initializeSimulation = async () => {
      // Set up NPC
      const npc = npcId ? NPCPersonalities[npcId] : Object.values(NPCPersonalities)[0];
      setCurrentNPC(npc);

      // Initialize avatars
      const initAvatars = async () => {
        // Check for stored RPM avatars first
        const storedAvatars = localStorage.getItem('rpm_avatars');
        let userUrl = '';
        
        if (storedAvatars) {
          try {
            const avatars = JSON.parse(storedAvatars);
            if (avatars.length > 0) {
              userUrl = avatars[0].url;
            }
          } catch (e) {
            console.error('Error parsing stored avatars:', e);
          }
        }
        
        // If no RPM avatar, we'll use ProceduralAvatar component instead
        setUserAvatarUrl(userUrl);
        
        // Generate NPC avatar
        if (currentNPC) {
          const npcAvatar = await avatarGenerator.getAvatarForNPC(currentNPC.id);
          setNpcAvatarUrl(npcAvatar);
        }
      };
      
      initAvatars();
    };

    initializeSimulation();
  }, [npcId, currentNPC]);

  // Initialize tracking systems
  const initializeTracking = async () => {
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 1280, 
          height: 720,
          facingMode: 'user'
        } 
      });
      
      setCameraPermission('granted');
      
      // Create video element for facial tracking
      if (!videoElement) {
        const video = document.createElement('video');
        video.width = 1280;
        video.height = 720;
        video.autoplay = true;
        video.style.display = 'none';
        document.body.appendChild(video);
        setVideoElement(video);
        
        // Set video stream
        video.srcObject = stream;
        
        // Start facial tracking
        simpleFacialTracking.startTracking((blendShapes) => {
          setUserBlendShapes(blendShapes);
        });
        
        // Register face tracker for avatar mirroring
        trackingOrchestrator.registerTracker('face', (data: any) => {
          // Update facial expression score
          const expressionScore = data?.score || 75;
          scoringSystem.updateMetric('facialExpression', expressionScore);
        });
        
        // Register other trackers
        trackingOrchestrator.registerTracker('posture', (data: any) => {
          const postureScore = data?.score || 80;
          scoringSystem.updateMetric('posture', postureScore);
        });
        
        trackingOrchestrator.registerTracker('eyes', (data: any) => {
          const eyeScore = data?.score || 75;
          scoringSystem.updateMetric('eyeContact', eyeScore);
        });
        
        trackingOrchestrator.registerTracker('hands', (data: any) => {
          const gestureScore = data?.score || 70;
          scoringSystem.updateMetric('gestures', gestureScore);
        });
        
        console.log('✅ All tracking systems initialized');
      }
    } catch (error) {
      console.error('❌ Failed to initialize tracking:', error);
      setCameraPermission('denied');
    }
  };

  // Start session
  const startSession = async () => {
    setSessionActive(true);
    
    // Initialize tracking if not already done
    if (cameraPermission === 'pending') {
      await initializeTracking();
    }
    
    // Set phase for tracking orchestrator
    trackingOrchestrator.setPhase('listening');
  };

  // Stop session
  const endSession = () => {
    setSessionActive(false);
    
    // Stop facial tracking
    simpleFacialTracking.stopTracking();
    
    // Get final metrics
    const finalMetrics = scoringSystem.getCurrentScores();
    setSessionMetrics(finalMetrics);
    
    // Show results
    console.log('Session ended. Final scores:', finalMetrics);
  };

  // Initialize avatar mirroring if enabled
  useEffect(() => {
    if (mirrorMode && videoElement) {
      // Set up camera stream
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoElement) {
            videoElement.srcObject = stream;
            videoElement.play();
            
            // Initialize avatar mirror system
            avatarMirrorSystem.initialize(videoElement).then(() => {
              avatarMirrorSystem.onUpdate((blendShapes) => {
                setUserBlendShapes(blendShapes);
              });
            });
          }
        })
        .catch(err => console.error('Camera access denied:', err));
    }

    return () => {
      if (videoElement?.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mirrorMode, videoElement]);

  // Update metrics periodically
  useEffect(() => {
    if (sessionActive) {
      metricsIntervalRef.current = setInterval(() => {
        setScores(scoringSystem.getCurrentScores());
      }, 100);
    }

    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, [sessionActive]);

  // Handle phase transitions
  const handlePhaseChange = (newPhase: typeof phase) => {
    setPhase(newPhase);
    scoringSystem.setConversationPhase(newPhase);
    trackingOrchestrator.setPhase(
      newPhase === 'greeting' ? 'listening' :
      newPhase === 'small-talk' ? 'speaking' :
      newPhase === 'deep-conversation' ? 'thinking' :
      'reacting'
    );
  };

  // Toggle session
  const toggleSession = () => {
    if (sessionActive) {
      endSession();
    } else {
      startSession();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      simpleFacialTracking.stopTracking();
      if (videoElement) {
        const stream = videoElement.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        videoElement.remove();
      }
    };
  }, [videoElement]);

  return (
    <div className="dating-simulation-master">
      {cameraPermission === 'denied' && (
        <div className="camera-permission-notice">
          <p>📷 Camera access is needed for face tracking features. The simulation will continue with simulated data.</p>
        </div>
      )}
      
      {/* Hidden video for face tracking */}
      <video 
        ref={(video) => setVideoElement(video)} 
        style={{ display: 'none' }} 
        playsInline
      />

      {/* Main simulation area */}
      <div className="simulation-container">
        {/* User Avatar */}
        <div className="avatar-container user-avatar">
          <h3>You</h3>
          <div className="avatar-display">
            <PreloadedRPMSystem
              avatarType="male"
              avatarIndex={0}
              blendShapes={userBlendShapes}
              showControls={false}
            />
          </div>
          <div className="metrics">
            <div className="metric">
              <span>Posture:</span>
              <span>{scores.posture.value.toFixed(0)}%</span>
            </div>
            <div className="metric">
              <span>Eye Contact:</span>
              <span>{scores.eyeContact.value.toFixed(0)}%</span>
            </div>
            <div className="metric">
              <span>Gestures:</span>
              <span>{scores.gestures.value.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* NPC Avatar */}
        <div className="avatar-container npc-avatar">
          <h3>{currentNPC?.name || 'Select NPC'}</h3>
          <div className="avatar-display">
            {currentNPC && (
              <PreloadedRPMSystem
                avatarType={['Sarah', 'Emma', 'Sophia'].includes(currentNPC.name) ? 'female' : 'male'}
                avatarIndex={currentNPC.name === 'Sarah' ? 0 : currentNPC.name === 'Emma' ? 1 : 0}
                blendShapes={npcBlendShapes}
                showControls={false}
              />
            )}
          </div>
          <div className="npc-info">
            <p>{currentNPC?.personality}</p>
            <p className="conversation-style">{currentNPC?.conversationStyle}</p>
          </div>
        </div>
      </div>

      {/* Metrics Dashboard */}
      {showMetrics && (
        <div className="metrics-dashboard">
          <div className="overall-score">
            <h2>{scores.overall.score}</h2>
            <span>Overall Score</span>
          </div>
          
          <div className="metric-bars">
            <MetricBar label="Posture" value={scores.posture.value} trend={scores.posture.trend} />
            <MetricBar label="Eye Contact" value={scores.eyeContact.value} trend={scores.eyeContact.trend} />
            <MetricBar label="Gestures" value={scores.gestures.value} trend={scores.gestures.trend} />
            <MetricBar label="Expression" value={scores.facialExpression.value} trend={scores.facialExpression.trend} />
            <MetricBar label="Conversation" value={scores.conversation.value} trend={scores.conversation.trend} />
          </div>

          <div className="chemistry-meter">
            <span>Chemistry</span>
            <div className="meter">
              <div 
                className="meter-fill" 
                style={{ width: `${scores.overall.chemistry}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Real-time Feedback */}
      <div className="feedback-overlay">
        {scoringSystem.getRealTimeFeedback().map((feedback, i) => (
          <div key={i} className="feedback-item">{feedback}</div>
        ))}
      </div>

      {/* Controls */}
      <div className="simulation-controls">
        <button 
          className={`session-btn ${sessionActive ? 'active' : ''}`}
          onClick={toggleSession}
        >
          {sessionActive ? 'End Date' : 'Start Date'}
        </button>

        {sessionActive && (
          <div className="phase-controls">
            <button 
              className={phase === 'greeting' ? 'active' : ''}
              onClick={() => handlePhaseChange('greeting')}
            >
              Greeting
            </button>
            <button 
              className={phase === 'small-talk' ? 'active' : ''}
              onClick={() => handlePhaseChange('small-talk')}
            >
              Small Talk
            </button>
            <button 
              className={phase === 'deep-conversation' ? 'active' : ''}
              onClick={() => handlePhaseChange('deep-conversation')}
            >
              Deep Talk
            </button>
            <button 
              className={phase === 'closing' ? 'active' : ''}
              onClick={() => handlePhaseChange('closing')}
            >
              Closing
            </button>
          </div>
        )}

        <button 
          className="calibrate-btn"
          onClick={() => avatarMirrorSystem.calibrate()}
        >
          Calibrate Expression
        </button>
      </div>

      {/* Hume Integration - properly connected */}
      {sessionActive && currentNPC && (
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
          <VoiceProvider
            auth={{ type: "apiKey", value: process.env.REACT_APP_HUME_API_KEY || "" }}
            configId="405fe2ff-0cf5-4ff9-abf9-fc09f4625ed8"
            onMessage={(message) => {
              // Update NPC expressions based on Hume's prosody
              if (message.type === 'user_message' || message.type === 'assistant_message') {
                const prosody = message.models?.prosody;
                if (prosody) {
                  const emotions = prosody.scores || {};
                  // Map emotions to blend shapes
                  const blendShapes: Partial<FacialBlendShapes> = {};
                  
                  if (emotions.joy > 0.5) {
                    blendShapes.mouthSmileLeft = emotions.joy * 0.8;
                    blendShapes.mouthSmileRight = emotions.joy * 0.8;
                  }
                  if (emotions.sadness > 0.5) {
                    blendShapes.mouthFrownLeft = emotions.sadness * 0.7;
                    blendShapes.mouthFrownRight = emotions.sadness * 0.7;
                  }
                  
                  setNpcBlendShapes(blendShapes);
                }
              }
            }}
          >
            <HumeNPCManager
              npcId={currentNPC.id}
              onPersonalityChange={(npc) => setCurrentNPC(npc)}
            />
          </VoiceProvider>
        </div>
      )}
    </div>
  );
};

// Metric Bar Component
const MetricBar: React.FC<{
  label: string;
  value: number;
  trend?: 'improving' | 'declining' | 'stable';
}> = ({ label, value, trend }) => {
  return (
    <div className="metric-bar">
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        <span className="metric-value">{value}%</span>
        {trend && trend !== 'stable' && (
          <span className={`trend-indicator ${trend}`}>
            {trend === 'improving' ? '↑' : '↓'}
          </span>
        )}
      </div>
      <div className="bar-container">
        <div 
          className={`bar-fill ${value < 60 ? 'low' : value < 80 ? 'medium' : 'high'}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

export default DatingSimulationMaster;
