import React, { useState, useEffect, useRef } from 'react';
import { DaterPerformanceAnalytics } from '../services/DaterPerformanceAnalytics';
import { ML5FaceMeshService } from '../services/ML5FaceMeshService';
import { PostureTrackingService } from '../services/PostureTrackingService';
import { HumeVoiceService } from '../services/humeVoiceService';
import { HumeExpressionService } from '../services/HumeExpressionService';
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
  humeExpressionService: HumeExpressionService;
  emotions: Array<{ emotion: string; score: number }>;
  humeExpressions: Array<{ emotion: string; score: number }>;
}

interface AudienceAnalyticsDashboardProps {
  participant1Stream?: MediaStream | undefined;
  participant2Stream?: MediaStream | undefined;
  participant1Name: string;
  participant2Name: string;
  participant1EmotionalData?: any;
  participant2EmotionalData?: any;
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
  participant1EmotionalData,
  participant2EmotionalData,
  roomId,
  showPresenceAvatars = true,
  enableRealTimeCoaching = true
}) => {
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [overallChemistry, setOverallChemistry] = useState<number>(50);
  const [realtimeChemistry, setRealtimeChemistry] = useState<number>(50);
  const [chemistryTrend, setChemistryTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [conversationPhase, setConversationPhase] = useState<string>('Getting to know each other');
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [chemistryMoments, setChemistryMoments] = useState<ChemistryMoment[]>([]);
  const [coachingInsights, setCoachingInsights] = useState<CoachingInsight[]>([]);
  const [emotionalSync, setEmotionalSync] = useState<number>(75);
  const [participant1Emotions, setParticipant1Emotions] = useState<Array<{ emotion: string; score: number }>>([]);
  const [participant2Emotions, setParticipant2Emotions] = useState<Array<{ emotion: string; score: number }>>([]);
  const [participant1HumeExpressions, setParticipant1HumeExpressions] = useState<Array<{ emotion: string; score: number }>>([]);
  const [participant2HumeExpressions, setParticipant2HumeExpressions] = useState<Array<{ emotion: string; score: number }>>([]);

  const sessionStartTime = useRef<number>(0);
  const humeVoiceService = useRef<HumeVoiceService | null>(null);
  const reconnectTimeoutId = useRef<number | null>(null);
  const chemistryHistoryRef = useRef<number[]>([]);

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
        p.humeExpressionService.stopTracking();
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
          humeExpressionService: new HumeExpressionService(),
          emotions: [],
          humeExpressions: []
        },
        {
          id: 'participant2',
          name: participant2Name,
          stream: participant2Stream,
          analytics: new DaterPerformanceAnalytics(),
          faceMeshService: new ML5FaceMeshService(),
          postureService: new PostureTrackingService(),
          humeExpressionService: new HumeExpressionService(),
          emotions: [],
          humeExpressions: []
        }
      ];

      // Initialize video element and start Hume expression tracking for each participant
      newParticipants.forEach((participant, index) => {
        if (participant.stream) {
          // Create video element for Hume analysis
          const video = document.createElement('video');
          video.autoplay = true;
          video.muted = true;
          video.srcObject = participant.stream;
          
          // Start Hume expression tracking on video feed
          participant.humeExpressionService.startTracking(video, (expressions: Array<{ emotion: string; score: number }>) => {
            console.log(`[AudienceAnalyticsDashboard] 🎭 Hume expressions for ${participant.name}:`, expressions);
            
            if (index === 0) {
              setParticipant1HumeExpressions(expressions);
            } else {
              setParticipant2HumeExpressions(expressions);
            }
          });
        }
      });

      setParticipants(newParticipants);
      console.log('[AudienceAnalyticsDashboard] Participants initialized with Hume Expression Service');
    }
  }, [participant1Stream, participant2Stream, participant1Name, participant2Name]);

  // Realtime chemistry calculation based on Hume expressions
  useEffect(() => {
    const calculateRealtimeChemistry = () => {
      if (participant1HumeExpressions.length === 0 || participant2HumeExpressions.length === 0) {
        return;
      }

      // Get top emotions for each participant
      const p1TopEmotions = participant1HumeExpressions.slice(0, 3);
      const p2TopEmotions = participant2HumeExpressions.slice(0, 3);

      // Calculate emotional alignment
      let alignmentScore = 0;
      let totalComparisons = 0;

      p1TopEmotions.forEach(p1Emotion => {
        p2TopEmotions.forEach(p2Emotion => {
          if (p1Emotion.emotion === p2Emotion.emotion) {
            // Same emotion - calculate similarity in intensity
            const similarity = 1 - Math.abs(p1Emotion.score - p2Emotion.score);
            alignmentScore += similarity * 2; // Bonus for same emotion
          } else {
            // Different emotions - check if they're complementary
            const complementaryPairs: Record<string, string[]> = {
              'Joy': ['Amusement', 'Surprise'],
              'Amusement': ['Joy', 'Surprise'],
              'Interest': ['Concentration', 'Contemplation'],
              'Concentration': ['Interest', 'Contemplation']
            };
            
            if (complementaryPairs[p1Emotion.emotion]?.includes(p2Emotion.emotion)) {
              alignmentScore += Math.min(p1Emotion.score, p2Emotion.score);
            }
          }
          totalComparisons++;
        });
      });

      const newChemistry = totalComparisons > 0 ? Math.min(100, (alignmentScore / totalComparisons) * 100) : 50;
      
      // Update chemistry trend
      const previousChemistry = chemistryHistoryRef.current[chemistryHistoryRef.current.length - 1] || 50;
      chemistryHistoryRef.current.push(newChemistry);
      
      // Keep only last 10 readings for trend calculation
      if (chemistryHistoryRef.current.length > 10) {
        chemistryHistoryRef.current.shift();
      }

      const trend = newChemistry > previousChemistry + 2 ? 'up' : 
                   newChemistry < previousChemistry - 2 ? 'down' : 'stable';

      setRealtimeChemistry(newChemistry);
      setChemistryTrend(trend);
      setOverallChemistry(newChemistry);

      console.log('[AudienceAnalyticsDashboard] 💕 Chemistry updated:', {
        newChemistry: newChemistry.toFixed(1),
        trend,
        p1Emotions: p1TopEmotions.map(e => `${e.emotion}: ${e.score.toFixed(2)}`),
        p2Emotions: p2TopEmotions.map(e => `${e.emotion}: ${e.score.toFixed(2)}`)
      });
    };

    const interval = setInterval(calculateRealtimeChemistry, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, [participant1HumeExpressions, participant2HumeExpressions]);

  // Utility functions
  const startSession = () => {
    setIsSessionActive(true);
    sessionStartTime.current = Date.now();
  };

  const endSession = () => {
    setIsSessionActive(false);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
              
              {/* Enhanced Emotion Display using Hume Expression Analysis */}
              <div className="emotion-overlay">
                <div className="emotion-source-indicator">
                  <span className="emotion-source-label">📹 Video Analysis</span>
                </div>
                <EmotionDisplay 
                  emotions={participant1HumeExpressions} 
                  participantName={participant1Name}
                />
                {participant1HumeExpressions.length > 0 && (
                  <div className="emotion-bars">
                    {participant1HumeExpressions.slice(0, 3).map((emotion, idx) => (
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
                        <span className="emotion-score">{(emotion.score * 100).toFixed(0)}%</span>
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
            <div className="realtime-chemistry-container">
              <div className="chemistry-ring-wrapper">
                <div className="chemistry-ring">
                  <div 
                    className="chemistry-fill"
                    style={{ 
                      background: `conic-gradient(from 0deg, 
                        ${realtimeChemistry > 80 ? '#FF69B4' : realtimeChemistry > 60 ? '#4ECDC4' : realtimeChemistry > 40 ? '#FFD93D' : '#FF6B6B'} 0%, 
                        ${realtimeChemistry > 80 ? '#FF1493' : realtimeChemistry > 60 ? '#20B2AA' : realtimeChemistry > 40 ? '#FFA500' : '#DC143C'} ${realtimeChemistry}%, 
                        #2A2A2A ${realtimeChemistry}%)`
                    }}
                  >
                    <div className="chemistry-score">
                      <div className="score-number">{Math.round(realtimeChemistry)}</div>
                      <div className="score-label">Chemistry</div>
                      <div className="chemistry-trend">
                        {chemistryTrend === 'up' && <span className="trend-up">↗️</span>}
                        {chemistryTrend === 'down' && <span className="trend-down">↘️</span>}
                        {chemistryTrend === 'stable' && <span className="trend-stable">➡️</span>}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="chemistry-pulse-ring" 
                     style={{
                       animation: `pulse ${3 - (realtimeChemistry / 50)}s infinite`,
                       opacity: realtimeChemistry > 70 ? 0.6 : 0.3
                     }}
                />
              </div>
              
              <div className="chemistry-details">
                <div className="chemistry-status">
                  {realtimeChemistry > 80 && <span className="status-excellent">🔥 Excellent Chemistry!</span>}
                  {realtimeChemistry > 60 && realtimeChemistry <= 80 && <span className="status-good">✨ Good Connection</span>}
                  {realtimeChemistry > 40 && realtimeChemistry <= 60 && <span className="status-moderate">💫 Building Rapport</span>}
                  {realtimeChemistry <= 40 && <span className="status-low">🌱 Getting Started</span>}
                </div>
                
                <div className="conversation-phase">
                  {conversationPhase}
                </div>
                
                <div className="emotional-sync">
                  <span className="sync-label">Emotional Sync:</span>
                  <span className="sync-value">{emotionalSync}%</span>
                </div>
              </div>
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
              
              {/* Enhanced Emotion Display using Hume Expression Analysis */}
              <div className="emotion-overlay">
                <div className="emotion-source-indicator">
                  <span className="emotion-source-label">📹 Video Analysis</span>
                </div>
                <EmotionDisplay 
                  emotions={participant2HumeExpressions} 
                  participantName={participant2Name}
                />
                {participant2HumeExpressions.length > 0 && (
                  <div className="emotion-bars">
                    {participant2HumeExpressions.slice(0, 3).map((emotion, idx) => (
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
                        <span className="emotion-score">{(emotion.score * 100).toFixed(0)}%</span>
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
