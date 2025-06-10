import React, { useState, useEffect, useRef } from 'react';
import './RealTimeExpressionDashboard.css';

interface EmotionData {
  emotion: string;
  score: number;
  timestamp: number;
}

interface ExpressionData {
  facialExpressions?: {
    happy: number;
    sad: number;
    angry: number;
    surprised: number;
    fearful: number;
    disgusted: number;
    neutral: number;
  };
  voiceEmotions?: EmotionData[];
  engagement?: number;
  chemistry?: number;
}

interface RealTimeExpressionDashboardProps {
  participant1Name: string;
  participant2Name: string;
  participant1Data?: ExpressionData;
  participant2Data?: ExpressionData;
  roomId?: string;
  isActive?: boolean;
}

const RealTimeExpressionDashboard: React.FC<RealTimeExpressionDashboardProps> = ({
  participant1Name,
  participant2Name,
  participant1Data,
  participant2Data,
  roomId,
  isActive = true
}) => {
  const [animationFrame, setAnimationFrame] = useState(0);
  const [chemistryScore, setChemistryScore] = useState(0);
  const [overallMood, setOverallMood] = useState('neutral');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animation loop for live updates
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setAnimationFrame(prev => prev + 1);
    }, 100);

    return () => clearInterval(interval);
  }, [isActive]);

  // Calculate chemistry score based on emotional alignment
  useEffect(() => {
    if (participant1Data?.voiceEmotions && participant2Data?.voiceEmotions) {
      const p1Emotions = participant1Data.voiceEmotions;
      const p2Emotions = participant2Data.voiceEmotions;
      
      if (p1Emotions.length > 0 && p2Emotions.length > 0) {
        const p1Top = p1Emotions[0];
        const p2Top = p2Emotions[0];
        
        // Calculate chemistry based on emotional synchronization
        const alignment = Math.abs(p1Top.score - p2Top.score);
        const chemistry = Math.max(0, 100 - (alignment * 100));
        setChemistryScore(chemistry);
        
        // Determine overall mood
        const avgScore = (p1Top.score + p2Top.score) / 2;
        if (avgScore > 0.7) setOverallMood('positive');
        else if (avgScore < 0.3) setOverallMood('negative');
        else setOverallMood('neutral');
      }
    }
  }, [participant1Data, participant2Data]);

  // Render emotion bar
  const renderEmotionBar = (emotion: string, score: number, color: string) => (
    <div key={emotion} className="emotion-bar">
      <div className="emotion-label">{emotion}</div>
      <div className="emotion-track">
        <div 
          className="emotion-fill" 
          style={{ 
            width: `${score * 100}%`, 
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}40`
          }}
        />
      </div>
      <div className="emotion-score">{Math.round(score * 100)}%</div>
    </div>
  );

  // Render participant emotions
  const renderParticipantEmotions = (
    name: string, 
    data: ExpressionData | undefined, 
    side: 'left' | 'right'
  ) => {
    const emotions = data?.voiceEmotions || [];
    const topEmotion = emotions.length > 0 ? emotions[0] : null;
    
    return (
      <div className={`participant-panel ${side}`}>
        <div className="participant-header">
          <h3>{name}</h3>
          <div className={`mood-indicator ${topEmotion?.emotion || 'neutral'}`}>
            {topEmotion?.emotion || 'neutral'}
          </div>
        </div>
        
        {/* Real-time emotion visualization */}
        <div className="emotion-waves">
          {emotions.slice(0, 5).map((emotion, index) => (
            <div 
              key={index}
              className="emotion-wave"
              style={{
                height: `${emotion.score * 100}%`,
                backgroundColor: getEmotionColor(emotion.emotion),
                animationDelay: `${index * 0.1}s`
              }}
            />
          ))}
        </div>

        {/* Emotion bars */}
        <div className="emotion-bars">
          {emotions.slice(0, 6).map((emotion, index) => 
            renderEmotionBar(
              emotion.emotion, 
              emotion.score, 
              getEmotionColor(emotion.emotion)
            )
          )}
        </div>

        {/* Face expression data */}
        {data?.facialExpressions && (
          <div className="facial-expressions">
            <h4>Facial Expressions</h4>
            {Object.entries(data.facialExpressions).map(([expr, value]) => 
              renderEmotionBar(expr, value, getExpressionColor(expr))
            )}
          </div>
        )}
      </div>
    );
  };

  const getEmotionColor = (emotion: string): string => {
    const colors: Record<string, string> = {
      joy: '#FFD700',
      excitement: '#FF6B35',
      love: '#FF1493',
      admiration: '#9370DB',
      surprise: '#00CED1',
      fear: '#8B0000',
      anger: '#DC143C',
      sadness: '#4169E1',
      disgust: '#228B22',
      neutral: '#808080'
    };
    return colors[emotion.toLowerCase()] || '#808080';
  };

  const getExpressionColor = (expression: string): string => {
    const colors: Record<string, string> = {
      happy: '#FFD700',
      sad: '#4169E1',
      angry: '#DC143C',
      surprised: '#00CED1',
      fearful: '#8B0000',
      disgusted: '#228B22',
      neutral: '#808080'
    };
    return colors[expression] || '#808080';
  };

  return (
    <div className={`realtime-expression-dashboard ${overallMood}`}>
      {/* Header with chemistry score */}
      <div className="dashboard-header">
        <h2>🎭 Real-Time Expression Analysis</h2>
        <div className="chemistry-meter">
          <div className="chemistry-label">Chemistry Score</div>
          <div className="chemistry-score">
            <div 
              className="chemistry-fill"
              style={{ width: `${chemistryScore}%` }}
            />
            <span className="chemistry-text">{Math.round(chemistryScore)}%</span>
          </div>
        </div>
      </div>

      {/* Main dashboard */}
      <div className="dashboard-content">
        {renderParticipantEmotions(participant1Name, participant1Data, 'left')}
        
        {/* Center visualization */}
        <div className="center-visualization">
          <div className="connection-line">
            <div 
              className="connection-pulse"
              style={{ animationDuration: `${2 - (chemistryScore / 100)}s` }}
            />
          </div>
          
          {/* Live chemistry graph */}
          <div className="chemistry-graph">
            <canvas 
              ref={canvasRef}
              width="200" 
              height="100"
              className="chemistry-canvas"
            />
          </div>
          
          {/* Overall mood indicator */}
          <div className={`mood-sphere ${overallMood}`}>
            <div className="mood-text">{overallMood}</div>
          </div>
        </div>

        {renderParticipantEmotions(participant2Name, participant2Data, 'right')}
      </div>

      {/* Live status indicator */}
      <div className="live-indicator">
        <div className="live-dot" />
        <span>LIVE</span>
      </div>
    </div>
  );
};

export default RealTimeExpressionDashboard;
