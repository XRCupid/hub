import React, { useState, useEffect, useRef } from 'react';
import { DaterPerformanceAnalytics } from '../services/DaterPerformanceAnalytics';
import { ML5FaceMeshService } from '../services/ML5FaceMeshService';
import { PostureTrackingService } from '../services/PostureTrackingService';
import { HumeVoiceService } from '../services/humeVoiceService';
import { EmotionDisplay } from './EmotionDisplay';
import PresenceAvatar from './PresenceAvatar';
import { Canvas } from '@react-three/fiber';
import './AudienceAnalyticsDashboard.css';

interface ParticipantData {
  id: string;
  name: string;
  stream: MediaStream | undefined;
  analytics: DaterPerformanceAnalytics;
  faceMeshService: ML5FaceMeshService;
  postureService: PostureTrackingService;
  emotions: Array<{ emotion: string; score: number }>;
}

interface AudienceAnalyticsDashboardProps {
  participant1Stream?: MediaStream | undefined;
  participant2Stream?: MediaStream | undefined;
  participant1Name: string;
  participant2Name: string;
  roomId?: string;
  showPresenceAvatars?: boolean;
  enableRealTimeCoaching?: boolean;
}

interface ChemistryMoment {
  timestamp: number;
  score: number;
  context: string;
}

interface CoachingInsight {
  timestamp: number;
  participant: string;
  category: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

const AudienceAnalyticsDashboard: React.FC<AudienceAnalyticsDashboardProps> = ({
  participant1Stream,
  participant2Stream,
  participant1Name,
  participant2Name,
  roomId,
  showPresenceAvatars = true,
  enableRealTimeCoaching = true
}) => {
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [overallChemistry, setOverallChemistry] = useState<number>(50);
  const [conversationPhase, setConversationPhase] = useState<string>('Getting to know each other');
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [chemistryMoments, setChemistryMoments] = useState<ChemistryMoment[]>([]);
  const [coachingInsights, setCoachingInsights] = useState<CoachingInsight[]>([]);
  const [emotionalSync, setEmotionalSync] = useState<number>(75);
  const [participant1Emotions, setParticipant1Emotions] = useState<Array<{ emotion: string; score: number }>>([]);
  const [participant2Emotions, setParticipant2Emotions] = useState<Array<{ emotion: string; score: number }>>([]);

  const sessionStartTime = useRef<number>(0);
  const humeVoiceService = useRef<HumeVoiceService | null>(null);
  const reconnectTimeoutId = useRef<number | null>(null);

  // CRITICAL: Clean up WebSocket connection on unmount - FLUSH THE TOILET!
  useEffect(() => {
    return () => {
      console.log('[AudienceAnalyticsDashboard] Cleaning up on unmount');
      if (humeVoiceService.current) {
        humeVoiceService.current.disconnect();
      }
      // Clear any reconnect timeouts
      if (reconnectTimeoutId.current) {
        clearTimeout(reconnectTimeoutId.current);
      }
      // Stop all tracking services
      participants.forEach(p => {
        p.faceMeshService.stopTracking();
        p.postureService.stopTracking();
        p.analytics.endSession();
      });
    };
  }, []);

  // Initialize participants when streams are available
  useEffect(() => {
    if (participant1Stream && participant2Stream) {
      const newParticipants: ParticipantData[] = [
        {
          id: 'participant1',
          name: participant1Name,
          stream: participant1Stream,
          analytics: new DaterPerformanceAnalytics(),
          faceMeshService: new ML5FaceMeshService(),
          postureService: new PostureTrackingService(),
          emotions: []
        },
        {
          id: 'participant2', 
          name: participant2Name,
          stream: participant2Stream,
          analytics: new DaterPerformanceAnalytics(),
          faceMeshService: new ML5FaceMeshService(),
          postureService: new PostureTrackingService(),
          emotions: []
        }
      ];
      setParticipants(newParticipants);
    }
  }, [participant1Stream, participant2Stream, participant1Name, participant2Name]);

  // Start session and initialize services when streams are available
  useEffect(() => {
    if (!participants.length || !participant1Stream || !participant2Stream) return;
    if (isSessionActive) return;

    console.log('[AudienceDashboard] Starting session with participants:', participants);
    setIsSessionActive(true);
    sessionStartTime.current = Date.now();

    participants.forEach((p) => {
      p.analytics.startSession([p.id]);
    });

    // Initialize Hume for emotion tracking with audio streams
    const initializeHume = async () => {
      try {
        humeVoiceService.current = new HumeVoiceService();
        
        // Connect Hume service
        await humeVoiceService.current.connect();
        
        // Set up Hume emotion callbacks
        humeVoiceService.current.onEmotion((emotionData: any) => {
          console.log('[AudienceDashboard] Received emotion data:', emotionData);
          
          if (emotionData?.predictions && emotionData.predictions.length > 0) {
            const emotions = emotionData.predictions[0].emotions || {};
            
            // Transform Hume emotion data to our format
            const formattedEmotions = Object.entries(emotions)
              .map(([emotion, score]) => ({ emotion, score: score as number }))
              .filter(e => e.score > 0.1) // Only show emotions above 10%
              .sort((a, b) => b.score - a.score);
            
            // For demo purposes, alternate between participants
            // In production, you'd identify which participant is speaking
            const currentSpeaker = Math.random() > 0.5 ? 1 : 2;
            if (currentSpeaker === 1) {
              setParticipant1Emotions(formattedEmotions);
            } else {
              setParticipant2Emotions(formattedEmotions);
            }
            
            // Update emotional sync based on similarity of emotions
            updateEmotionalSync(formattedEmotions);
          }
        });

        // Send audio from participant streams to Hume
        // Note: In production, you'd process audio from each participant separately
        const audioContext = new AudioContext();
        
        // Helper to process audio stream
        const processAudioStream = async (stream: MediaStream) => {
          const source = audioContext.createMediaStreamSource(stream);
          const processor = audioContext.createScriptProcessor(4096, 1, 1);
          
          processor.onaudioprocess = async (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            // Convert to base64 for Hume
            const audioBlob = new Blob([inputData], { type: 'audio/wav' });
            
            // Send to Hume (if connected)
            if (humeVoiceService.current) {
              humeVoiceService.current.sendAudio(audioBlob);
            }
          };
          
          source.connect(processor);
          processor.connect(audioContext.destination);
        };
        
        // Process both participant audio streams
        await processAudioStream(participant1Stream);
        await processAudioStream(participant2Stream);
        
      } catch (error) {
        console.error('[AudienceDashboard] Error initializing Hume:', error);
      }
    };
    
    initializeHume();
    
    // Start face mesh and posture tracking for each participant
    participants.forEach(async (p) => {
      try {
        console.log('[AudienceDashboard] Initializing face mesh for participant:', p.id);
        await p.faceMeshService.initialize();
        await p.postureService.initialize();

        if (!p.stream) return;

        // Create video element for tracking
        const video = document.createElement('video');
        video.srcObject = p.stream || null;
        video.play();

        p.faceMeshService.startTracking(video);
        p.postureService.startTracking(video);
      } catch (error) {
        console.error('[AudienceDashboard] Failed to initialize tracking for participant:', p.id, error);
        // Continue without face tracking - avatars will still work without tracking data
      }
    });

    // Start analytics update loop
    const analyticsInterval = setInterval(() => {
      if (!isSessionActive) {
        clearInterval(analyticsInterval);
        return;
      }
      updateAnalytics();
    }, 2000);

    // Update session duration
    const durationInterval = setInterval(() => {
      if (isSessionActive) {
        setSessionDuration(Math.floor((Date.now() - sessionStartTime.current) / 1000));
      } else {
        clearInterval(durationInterval);
      }
    }, 1000);
    
    return () => {
      console.log('[AudienceDashboard] Cleaning up session');
      participants.forEach((p) => {
        p.analytics.endSession();
        p.faceMeshService.stopTracking();
        p.postureService.stopTracking();
      });
      
      // Disconnect Hume
      if (humeVoiceService.current) {
        humeVoiceService.current.disconnect();
      }
      
      if (reconnectTimeoutId.current) {
        clearTimeout(reconnectTimeoutId.current);
      }
    };
  }, [participants, isSessionActive, participant1Stream, participant2Stream]);

  const startSession = () => {
    if (participants.length !== 2) return;

    setIsSessionActive(true);
    sessionStartTime.current = Date.now();

    // Start analytics for both participants
    participants.forEach(p => {
      p.analytics.startSession([p.id]);
    });

    // Initialize Hume for emotion tracking
    humeVoiceService.current = new HumeVoiceService();
    
    // Set up Hume emotion callbacks
    if (humeVoiceService.current) {
      humeVoiceService.current.onEmotion((emotionData: any) => {
        if (emotionData?.predictions && emotionData.predictions.length > 0) {
          const emotions = emotionData.predictions[0].emotions || [];
          
          // Transform Hume emotion data to our format
          const formattedEmotions = Object.entries(emotions)
            .map(([emotion, score]) => ({ emotion, score: score as number }))
            .filter(e => e.score > 0.1) // Only show emotions above 10%
            .sort((a, b) => b.score - a.score);
          
          // For demo purposes, alternate between participants
          // In production, you'd identify which participant is speaking
          const currentSpeaker = Math.random() > 0.5 ? 1 : 2;
          if (currentSpeaker === 1) {
            setParticipant1Emotions(formattedEmotions);
          } else {
            setParticipant2Emotions(formattedEmotions);
          }
          
          // Update emotional sync based on similarity of emotions
          updateEmotionalSync(formattedEmotions);
        }
      });
    }
    
    // Start face mesh and posture tracking for each participant
    participants.forEach(async (p) => {
      try {
        console.log('[AudienceDashboard] Initializing face mesh for participant:', p.id);
        await p.faceMeshService.initialize();
        await p.postureService.initialize();

        if (!p.stream) return;

        // Create video element for tracking
        const video = document.createElement('video');
        video.srcObject = p.stream || null;
        video.play();

        p.faceMeshService.startTracking(video);
        p.postureService.startTracking(video);
      } catch (error) {
        console.error('[AudienceDashboard] Failed to initialize tracking for participant:', p.id, error);
        // Continue without face tracking - avatars will still work without tracking data
      }
    });

    // Start analytics update loop
    const analyticsInterval = setInterval(() => {
      if (!isSessionActive) {
        clearInterval(analyticsInterval);
        return;
      }
      updateAnalytics();
    }, 2000);

    // Update session duration
    const durationInterval = setInterval(() => {
      if (isSessionActive) {
        setSessionDuration(Math.floor((Date.now() - sessionStartTime.current) / 1000));
      } else {
        clearInterval(durationInterval);
      }
    }, 1000);
  };

  const endSession = () => {
    setIsSessionActive(false);
    // Stop all tracking services
    participants.forEach(p => {
      p.faceMeshService.stopTracking();
      p.postureService.stopTracking();
    });
  };

  const updateAnalytics = () => {
    if (participants.length !== 2) return;

    const [p1, p2] = participants;

    // Get tracking data
    const p1FaceData = p1.faceMeshService.getExpressions();
    const p1HeadRotation = p1.faceMeshService.getHeadRotation();
    const p1PostureData = p1.postureService.getPostureData();

    const p2FaceData = p2.faceMeshService.getExpressions();
    const p2HeadRotation = p2.faceMeshService.getHeadRotation();
    const p2PostureData = p2.postureService.getPostureData();

    // Update analytics with proper parameters
    p1.analytics.updateMetrics(
      p1FaceData,
      p1PostureData,
      null, // emotion data placeholder
      null, // voice data placeholder
      'real-time-update'
    );

    p2.analytics.updateMetrics(
      p2FaceData,
      p2PostureData,
      null, // emotion data placeholder  
      null, // voice data placeholder
      'real-time-update'
    );

    // Calculate overall chemistry using session data
    const p1Session = p1.analytics.getSession();
    const p2Session = p2.analytics.getSession();
    
    if (p1Session && p2Session) {
      const avgChemistry = (p1Session.compatibilityScore + p2Session.compatibilityScore) / 2;
      setOverallChemistry(avgChemistry);
    }

    // Detect chemistry moments
    if (Math.random() > 0.7) { // Simulate chemistry moment detection
      const newMoment: ChemistryMoment = {
        timestamp: Date.now(),
        score: Math.floor(Math.random() * 30) + 70,
        context: getRandomChemistryContext()
      };
      setChemistryMoments(prev => [...prev.slice(-4), newMoment]);
    }

    // Generate coaching insights
    if (enableRealTimeCoaching && isSessionActive) {
      participants.forEach(participant => {
        const newInsights = generateCoachingInsight(participant);
        newInsights.forEach(insight => {
          setCoachingInsights(prev => {
            const updated = [insight, ...prev].slice(0, 10); // Keep last 10 insights
            return updated;
          });
        });
      });
    }

    // Update conversation phase
    const duration = sessionDuration;
    if (duration < 120) {
      setConversationPhase('Ice breaking');
    } else if (duration < 300) {
      setConversationPhase('Getting to know each other');
    } else if (duration < 600) {
      setConversationPhase('Deeper conversation');
    } else {
      setConversationPhase('Building connection');
    }

    // Generate mock emotions if Hume isn't providing real data
    if (participant1Emotions.length === 0) {
      setParticipant1Emotions([
        { emotion: 'joy', score: 0.7 + Math.random() * 0.2 },
        { emotion: 'interest', score: 0.5 + Math.random() * 0.3 },
        { emotion: 'contentment', score: 0.4 + Math.random() * 0.3 }
      ]);
    }
      
    if (participant2Emotions.length === 0) {
      setParticipant2Emotions([
        { emotion: 'excitement', score: 0.6 + Math.random() * 0.3 },
        { emotion: 'joy', score: 0.5 + Math.random() * 0.3 },
        { emotion: 'interest', score: 0.4 + Math.random() * 0.2 }
      ]);
    }

    // Update emotional sync
    updateEmotionalSync(participant1Emotions);
  };

  const updateEmotionalSync = (currentEmotions: Array<{ emotion: string; score: number }>) => {
    // Compare current emotions with the other participant's emotions
    const otherEmotions = currentEmotions === participant1Emotions ? participant2Emotions : participant1Emotions;
    
    if (otherEmotions.length === 0) return;
    
    // Calculate similarity between emotion sets
    let similarity = 0;
    currentEmotions.forEach(e1 => {
      const matchingEmotion = otherEmotions.find(e2 => e2.emotion === e1.emotion);
      if (matchingEmotion) {
        similarity += Math.min(e1.score, matchingEmotion.score);
      }
    });
    
    setEmotionalSync(Math.round(similarity * 100));
  };

  const generateCoachingInsight = (participant: ParticipantData) => {
    const metrics = getParticipantMetrics(participant);
    const insights: CoachingInsight[] = [];
    const timestamp = Date.now();
    
    // Eye contact coaching
    if (metrics.eyeContact < 50) {
      insights.push({
        timestamp,
        participant: participant.name,
        category: 'Eye Contact',
        message: 'Try to maintain eye contact - look at the camera to build connection',
        priority: 'high'
      });
    } else if (metrics.eyeContact > 80) {
      insights.push({
        timestamp,
        participant: participant.name,
        category: 'Eye Contact',
        message: 'Great eye contact! This builds trust and connection',
        priority: 'low'
      });
    }
    
    // Emotional coaching based on current emotions
    const topEmotion = participant.emotions?.[0];
    if (topEmotion) {
      if (['anger', 'disgust', 'fear'].includes(topEmotion.emotion)) {
        insights.push({
          timestamp,
          participant: participant.name,
          category: 'Emotional State',
          message: `Showing ${topEmotion.emotion} - try to relax and find something positive to focus on`,
          priority: 'high'
        });
      } else if (['joy', 'excitement', 'admiration'].includes(topEmotion.emotion)) {
        insights.push({
          timestamp,
          participant: participant.name,
          category: 'Emotional State',
          message: `Great energy! Your ${topEmotion.emotion} is creating positive chemistry`,
          priority: 'low'
        });
      }
    }
    
    // Engagement coaching
    if (metrics.facialEngagement < 60) {
      insights.push({
        timestamp,
        participant: participant.name,
        category: 'Engagement',
        message: 'Show more interest - smile, nod, and react to what they\'re saying',
        priority: 'medium'
      });
    }
    
    // Body language coaching
    if (metrics.bodyLanguage < 60) {
      insights.push({
        timestamp,
        participant: participant.name,
        category: 'Body Language',
        message: 'Open up your posture - uncross arms and lean in slightly',
        priority: 'medium'
      });
    }
    
    return insights;
  };

  const getRandomChemistryContext = (): string => {
    const contexts = [
      'Simultaneous laughter',
      'Mirrored body language',
      'Extended eye contact',
      'Synchronized gestures',
      'Shared excitement',
      'Natural conversation flow'
    ];
    return contexts[Math.floor(Math.random() * contexts.length)];
  };

  const getRandomCategory = (): string => {
    const categories = ['posture', 'eye contact', 'gestures', 'conversation'];
    return categories[Math.floor(Math.random() * categories.length)];
  };

  const getRandomCoachingMessage = (): string => {
    const messages = [
      'Great eye contact! Keep it natural.',
      'Consider leaning in slightly to show engagement.',
      'Perfect mirroring of their energy level.',
      'Nice use of hand gestures while speaking.',
      'Good recovery from that awkward pause.',
      'Excellent active listening demonstrated.'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getMetricColor = (value: number): string => {
    if (value >= 80) return '#4CAF50';
    if (value >= 60) return '#FF9800';
    return '#F44336';
  };

  const getEmotionColor = (emotion: string): string => {
    const emotionColors: Record<string, string> = {
      joy: '#FFD700',
      excitement: '#FF6B6B',
      admiration: '#FF69B4',
      amusement: '#FFA500',
      love: '#FF1493',
      desire: '#DC143C',
      romance: '#FF69B4',
      interest: '#4ECDC4',
      realization: '#9B59B6',
      surprise: '#F39C12',
      confusion: '#95A5A6',
      fear: '#8B4513',
      nervousness: '#D2691E',
      sadness: '#4682B4',
      disappointment: '#708090',
      embarrassment: '#DDA0DD',
      anger: '#B22222',
      contempt: '#8B0000',
      disgust: '#556B2F',
      distress: '#483D8B',
      neutral: '#BDC3C7'
    };
    return emotionColors[emotion.toLowerCase()] || '#95A5A6';
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper function to get metrics safely
  const getParticipantMetrics = (participant: ParticipantData) => {
    const session = participant.analytics.getSession();
    return session?.currentMetrics || {
      eyeContact: 70,
      facialEngagement: 75,
      bodyLanguage: 65,
      emotionalRange: 70,
      positivity: 80
    };
  };

  const getCompatibilityScore = (participant: ParticipantData): number => {
    const session = participant.analytics.getSession();
    return session?.compatibilityScore || 70;
  };

  // Helper function for audio processing
  const blobToBase64 = async (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  return (
    <div className="audience-analytics-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Live Dating Analytics</h1>
        <div className="session-controls">
          {!isSessionActive ? (
            <button onClick={startSession} className="start-session-btn">
              Start Analytics Session
            </button>
          ) : (
            <button onClick={endSession} className="end-session-btn">
              End Session
            </button>
          )}
          <div className="session-duration">
            Duration: {formatDuration(sessionDuration)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Participant Displays */}
        <div className="participants-section">
          {/* Participant 1 */}
          <div className="participant-card">
            <div className="participant-header">
              <h3>{participant1Name}</h3>
              {participants[0] && (
                <div className="compatibility-score">
                  {getCompatibilityScore(participants[0]).toFixed(0)}%
                </div>
              )}
            </div>
            
            <div className="participant-video-container">
              <video 
                autoPlay 
                muted 
                ref={(video) => {
                  if (video && participant1Stream) {
                    video.srcObject = participant1Stream;
                  }
                }}
                className="participant-video"
              />
              
              {/* PiP Avatar Display */}
              {showPresenceAvatars && (
                <div className="pip-avatar-container">
                  <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[0, 0, 5]} />
                    <PresenceAvatar 
                      avatarUrl="/avatars/coach_grace.glb"
                      trackingData={{
                        landmarks: participants[0]?.faceMeshService?.getLandmarks() || [],
                        expressions: (participants[0]?.faceMeshService?.getExpressions() as unknown as Record<string, number>) || {},
                        headRotation: participants[0]?.faceMeshService?.getHeadRotation() || { pitch: 0, yaw: 0, roll: 0 }
                      }}
                      emotionalBlendshapes={participants[0]?.emotions?.reduce((acc, emotion) => ({
                        ...acc,
                        [emotion.emotion]: emotion.score / 100
                      }), {})}
                    />
                  </Canvas>
                  <div className="head-tracking-indicator">
                    <div className="head-rotation-viz">
                      <span>Pitch: {participants[0]?.faceMeshService?.getHeadRotation()?.pitch.toFixed(0) || 0}°</span>
                      <span>Yaw: {participants[0]?.faceMeshService?.getHeadRotation()?.yaw.toFixed(0) || 0}°</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Enhanced Emotion Display */}
              <div className="emotion-overlay">
                <EmotionDisplay 
                  emotions={participant1Emotions} 
                  participantName={participant1Name}
                />
                {participant1Emotions.length > 0 && (
                  <div className="emotion-bars">
                    {participant1Emotions.slice(0, 3).map((emotion, idx) => (
                      <div key={idx} className="emotion-bar-item">
                        <span className="emotion-label">{emotion.emotion}</span>
                        <div className="emotion-bar-bg">
                          <div 
                            className="emotion-bar-fill"
                            style={{
                              width: `${emotion.score * 100}%`,
                              backgroundColor: getEmotionColor(emotion.emotion)
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="participant-metrics">
              {participants[0] && (
                <>
                  <div className="metric-item">
                    <span>Eye Contact</span>
                    <div className="metric-bar-container">
                      <div 
                        className="metric-bar"
                        style={{ 
                          width: `${getParticipantMetrics(participants[0]).eyeContact}%`,
                          backgroundColor: getMetricColor(getParticipantMetrics(participants[0]).eyeContact)
                        }}
                      />
                    </div>
                  </div>
                  <div className="metric-item">
                    <span>Engagement</span>
                    <div className="metric-bar-container">
                      <div 
                        className="metric-bar"
                        style={{ 
                          width: `${getParticipantMetrics(participants[0]).facialEngagement}%`,
                          backgroundColor: getMetricColor(getParticipantMetrics(participants[0]).facialEngagement)
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Chemistry Ring */}
          <div className="chemistry-center">
            <div className="chemistry-ring">
              <div 
                className="chemistry-fill"
                style={{ 
                  background: `conic-gradient(from 0deg, #FF6B6B 0%, #4ECDC4 ${overallChemistry}%, #2A2A2A ${overallChemistry}%)`
                }}
              >
                <div className="chemistry-score">
                  <span className="score-number">{Math.round(overallChemistry)}</span>
                  <span className="score-label">Chemistry</span>
                </div>
              </div>
            </div>
            <div className="conversation-phase">
              {conversationPhase}
            </div>
            <div className="emotional-sync">
              Emotional Sync: {emotionalSync}%
            </div>
          </div>

          {/* Participant 2 */}
          <div className="participant-card">
            <div className="participant-header">
              <h3>{participant2Name}</h3>
              {participants[1] && (
                <div className="compatibility-score">
                  {getCompatibilityScore(participants[1]).toFixed(0)}%
                </div>
              )}
            </div>
            
            <div className="participant-video-container">
              <video 
                autoPlay 
                muted 
                ref={(video) => {
                  if (video && participant2Stream) {
                    video.srcObject = participant2Stream;
                  }
                }}
                className="participant-video"
              />
              
              {/* PiP Avatar Display */}
              {showPresenceAvatars && (
                <div className="pip-avatar-container">
                  <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[0, 0, 5]} />
                    <PresenceAvatar 
                      avatarUrl="/avatars/coach_rizzo.glb"
                      trackingData={{
                        landmarks: participants[1]?.faceMeshService?.getLandmarks() || [],
                        expressions: (participants[1]?.faceMeshService?.getExpressions() as unknown as Record<string, number>) || {},
                        headRotation: participants[1]?.faceMeshService?.getHeadRotation() || { pitch: 0, yaw: 0, roll: 0 }
                      }}
                      emotionalBlendshapes={participants[1]?.emotions?.reduce((acc, emotion) => ({
                        ...acc,
                        [emotion.emotion]: emotion.score / 100
                      }), {})}
                    />
                  </Canvas>
                  <div className="head-tracking-indicator">
                    <div className="head-rotation-viz">
                      <span>Pitch: {participants[1]?.faceMeshService?.getHeadRotation()?.pitch.toFixed(0) || 0}°</span>
                      <span>Yaw: {participants[1]?.faceMeshService?.getHeadRotation()?.yaw.toFixed(0) || 0}°</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Enhanced Emotion Display */}
              <div className="emotion-overlay">
                <EmotionDisplay 
                  emotions={participant2Emotions} 
                  participantName={participant2Name}
                />
                {participant2Emotions.length > 0 && (
                  <div className="emotion-bars">
                    {participant2Emotions.slice(0, 3).map((emotion, idx) => (
                      <div key={idx} className="emotion-bar-item">
                        <span className="emotion-label">{emotion.emotion}</span>
                        <div className="emotion-bar-bg">
                          <div 
                            className="emotion-bar-fill"
                            style={{
                              width: `${emotion.score * 100}%`,
                              backgroundColor: getEmotionColor(emotion.emotion)
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="participant-metrics">
              {participants[1] && (
                <>
                  <div className="metric-item">
                    <span>Eye Contact</span>
                    <div className="metric-bar-container">
                      <div 
                        className="metric-bar"
                        style={{ 
                          width: `${getParticipantMetrics(participants[1]).eyeContact}%`,
                          backgroundColor: getMetricColor(getParticipantMetrics(participants[1]).eyeContact)
                        }}
                      />
                    </div>
                  </div>
                  <div className="metric-item">
                    <span>Engagement</span>
                    <div className="metric-bar-container">
                      <div 
                        className="metric-bar"
                        style={{ 
                          width: `${getParticipantMetrics(participants[1]).facialEngagement}%`,
                          backgroundColor: getMetricColor(getParticipantMetrics(participants[1]).facialEngagement)
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Coaching Panel */}
        <div className="coaching-panel">
          <h3>Real-Time Coaching Advice</h3>
          
          {/* Chemistry Moments */}
          <div className="chemistry-moments">
            <h4>Peak Chemistry Moments</h4>
            {chemistryMoments.map((moment, index) => (
              <div key={index} className="chemistry-moment">
                <div className="moment-score">{moment.score}%</div>
                <div className="moment-context">{moment.context}</div>
                <div className="moment-time">
                  {new Date(moment.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>

          {/* Coaching Insights */}
          <div className="coaching-insights">
            <h4>Coaching Observations</h4>
            {coachingInsights.length === 0 && (
              <div className="no-insights">Monitoring conversation... coaching tips will appear here</div>
            )}
            {coachingInsights.map((insight, index) => (
              <div key={index} className={`coaching-insight priority-${insight.priority}`}>
                <div className="insight-header">
                  <span className="insight-participant">{insight.participant}</span>
                  <span className="insight-category">{insight.category}</span>
                </div>
                <div className="insight-message">{insight.message}</div>
                <div className="insight-time">
                  {new Date(insight.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudienceAnalyticsDashboard;
