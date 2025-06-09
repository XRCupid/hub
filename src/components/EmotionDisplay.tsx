import React from 'react';
import './EmotionDisplay.css';

interface EmotionData {
  emotion: string;
  score: number;
}

interface EmotionDisplayProps {
  emotions: EmotionData[];
  participantName: string;
}

const EMOTION_COLORS: Record<string, string> = {
  joy: '#FFD700',
  excitement: '#FF6B6B',
  contentment: '#4ECDC4',
  interest: '#A8E6CF',
  surprise: '#FFE66D',
  confusion: '#B4A7D6',
  fear: '#D7BDE2',
  sadness: '#85C1E2',
  anger: '#F1948A',
  disgust: '#ABEBC6',
  contempt: '#F8C471',
  disappointment: '#AED6F1',
  neutral: '#BDC3C7'
};

const EMOTION_EMOJIS: Record<string, string> = {
  joy: '😊',
  excitement: '🤩',
  contentment: '😌',
  interest: '🤔',
  surprise: '😮',
  confusion: '😕',
  fear: '😨',
  sadness: '😢',
  anger: '😠',
  disgust: '🤢',
  contempt: '😒',
  disappointment: '😞',
  neutral: '😐'
};

export const EmotionDisplay: React.FC<EmotionDisplayProps> = ({ emotions, participantName }) => {
  // Sort emotions by score and take top 3
  const topEmotions = emotions
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const dominantEmotion = topEmotions[0];

  return (
    <div className="emotion-display">
      <div className="emotion-header">
        <h4>{participantName}'s Emotions</h4>
        {dominantEmotion && (
          <span className="dominant-emotion">
            {EMOTION_EMOJIS[dominantEmotion.emotion] || '😐'} {dominantEmotion.emotion}
          </span>
        )}
      </div>
      
      <div className="emotion-bars">
        {topEmotions.map((emotion, index) => (
          <div key={emotion.emotion} className="emotion-bar-container">
            <div className="emotion-label">
              <span className="emotion-emoji">
                {EMOTION_EMOJIS[emotion.emotion] || '😐'}
              </span>
              <span className="emotion-name">{emotion.emotion}</span>
            </div>
            <div className="emotion-bar-wrapper">
              <div
                className="emotion-bar"
                style={{
                  width: `${emotion.score * 100}%`,
                  backgroundColor: EMOTION_COLORS[emotion.emotion] || '#BDC3C7',
                  animationDelay: `${index * 100}ms`
                }}
              />
            </div>
            <span className="emotion-score">{Math.round(emotion.score * 100)}%</span>
          </div>
        ))}
      </div>

      <div className="emotion-radar">
        <svg viewBox="0 0 200 200" className="emotion-svg">
          <circle cx="100" cy="100" r="80" fill="none" stroke="#333" strokeWidth="1" opacity="0.3" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="#333" strokeWidth="1" opacity="0.2" />
          <circle cx="100" cy="100" r="40" fill="none" stroke="#333" strokeWidth="1" opacity="0.1" />
          
          {emotions.slice(0, 6).map((emotion, index) => {
            const angle = (index * 60 - 90) * (Math.PI / 180);
            const radius = emotion.score * 80;
            const x = 100 + radius * Math.cos(angle);
            const y = 100 + radius * Math.sin(angle);
            
            return (
              <g key={emotion.emotion}>
                <line
                  x1="100"
                  y1="100"
                  x2={100 + 80 * Math.cos(angle)}
                  y2={100 + 80 * Math.sin(angle)}
                  stroke="#333"
                  strokeWidth="1"
                  opacity="0.2"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill={EMOTION_COLORS[emotion.emotion] || '#BDC3C7'}
                  className="emotion-dot"
                />
                <text
                  x={100 + 90 * Math.cos(angle)}
                  y={100 + 90 * Math.sin(angle)}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  className="emotion-radar-label"
                  fontSize="10"
                >
                  {EMOTION_EMOJIS[emotion.emotion] || '😐'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
