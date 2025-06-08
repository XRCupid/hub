import React, { useState, useEffect, useRef } from 'react';
import { DaterPerformanceAnalytics } from '../services/DaterPerformanceAnalytics';
import { ML5FaceMeshService } from '../services/ML5FaceMeshService';
import { PostureTrackingService } from '../services/PostureTrackingService';
import { HumeVoiceService } from '../services/humeVoiceService';
import './AudienceAnalyticsDashboard.css';

interface ParticipantData {
  id: string;
  name: string;
  stream: MediaStream | undefined;
  analytics: DaterPerformanceAnalytics;
  faceMeshService: ML5FaceMeshService;
  postureService: PostureTrackingService;
}

interface AudienceAnalyticsDashboardProps {
  participant1Stream?: MediaStream | undefined;
  participant2Stream?: MediaStream | undefined;
  participant1Name: string;
  participant2Name: string;
  roomId?: string;
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
  roomId
}) => {
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [overallChemistry, setOverallChemistry] = useState<number>(50);
  const [conversationPhase, setConversationPhase] = useState<string>('Getting to know each other');
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [chemistryMoments, setChemistryMoments] = useState<ChemistryMoment[]>([]);
  const [coachingInsights, setCoachingInsights] = useState<CoachingInsight[]>([]);
  const [emotionalSync, setEmotionalSync] = useState<number>(75);

  const sessionStartTime = useRef<number>(0);
  const humeVoiceService = useRef<HumeVoiceService | null>(null);

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
          postureService: new PostureTrackingService()
        },
        {
          id: 'participant2', 
          name: participant2Name,
          stream: participant2Stream,
          analytics: new DaterPerformanceAnalytics(),
          faceMeshService: new ML5FaceMeshService(),
          postureService: new PostureTrackingService()
        }
      ];
      setParticipants(newParticipants);
    }
  }, [participant1Stream, participant2Stream, participant1Name, participant2Name]);

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
    
    // Start face mesh and posture tracking for each participant
    participants.forEach(async (p) => {
      await p.faceMeshService.initialize();
      await p.postureService.initialize();

      if (!p.stream) return;

      // Create video element for tracking
      const video = document.createElement('video');
      video.srcObject = p.stream || null;
      video.play();

      p.faceMeshService.startTracking(video);
      p.postureService.startTracking(video);
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
      // PostureTrackingService doesn't have stopTracking method, but we can clean up
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
    if (Math.random() > 0.8) {
      const newInsight: CoachingInsight = {
        timestamp: Date.now(),
        participant: Math.random() > 0.5 ? participant1Name : participant2Name,
        category: getRandomCategory(),
        message: getRandomCoachingMessage(),
        priority: Math.random() > 0.7 ? 'high' : 'medium'
      };
      setCoachingInsights(prev => [...prev.slice(-2), newInsight]);
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
            
            <div className="participant-video">
              <video 
                autoPlay 
                muted 
                ref={(video) => {
                  if (video && participant1Stream) {
                    video.srcObject = participant1Stream;
                  }
                }}
              />
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
            
            <div className="participant-video">
              <video 
                autoPlay 
                muted 
                ref={(video) => {
                  if (video && participant2Stream) {
                    video.srcObject = participant2Stream;
                  }
                }}
              />
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
          <h3>Live Coaching Insights</h3>
          
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
            {coachingInsights.map((insight, index) => (
              <div key={index} className={`coaching-insight priority-${insight.priority}`}>
                <div className="insight-participant">{insight.participant}</div>
                <div className="insight-message">{insight.message}</div>
                <div className="insight-category">{insight.category}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudienceAnalyticsDashboard;
