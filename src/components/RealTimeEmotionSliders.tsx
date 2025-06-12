import React, { useEffect, useState } from 'react';
import './RealTimeEmotionSliders.css';

interface EmotionData {
  emotion: string;
  score: number;
}

interface RealTimeEmotionSlidersProps {
  emotions: EmotionData[];
  participantName: string;
  position?: 'left' | 'right';
}

const EMOTION_CONFIG: Record<string, { emoji: string; color: string; description: string }> = {
  // Positive emotions
  joy: { emoji: '😊', color: '#FFD700', description: 'Happy & Joyful' },
  amusement: { emoji: '😄', color: '#FF69B4', description: 'Amused & Entertained' },
  excitement: { emoji: '🤩', color: '#FF6B6B', description: 'Excited & Energetic' },
  contentment: { emoji: '😌', color: '#4ECDC4', description: 'Content & Satisfied' },
  love: { emoji: '🥰', color: '#FF1493', description: 'Loving & Affectionate' },
  admiration: { emoji: '😍', color: '#FF69B4', description: 'Admiring & Impressed' },
  interest: { emoji: '🤔', color: '#A8E6CF', description: 'Interested & Curious' },
  pride: { emoji: '😎', color: '#9370DB', description: 'Proud & Confident' },
  
  // Surprise emotions
  surprise: { emoji: '😮', color: '#FFE66D', description: 'Surprised & Shocked' },
  awe: { emoji: '🤯', color: '#FFA500', description: 'In Awe & Wonder' },
  
  // Negative emotions
  confusion: { emoji: '😕', color: '#B4A7D6', description: 'Confused & Puzzled' },
  fear: { emoji: '😨', color: '#D7BDE2', description: 'Fearful & Anxious' },
  anxiety: { emoji: '😰', color: '#DDA0DD', description: 'Anxious & Worried' },
  sadness: { emoji: '😢', color: '#85C1E2', description: 'Sad & Down' },
  anger: { emoji: '😠', color: '#F1948A', description: 'Angry & Frustrated' },
  disgust: { emoji: '🤢', color: '#ABEBC6', description: 'Disgusted & Repulsed' },
  contempt: { emoji: '😒', color: '#F8C471', description: 'Contemptuous & Scornful' },
  disappointment: { emoji: '😞', color: '#AED6F1', description: 'Disappointed & Let Down' },
  embarrassment: { emoji: '😳', color: '#FFB6C1', description: 'Embarrassed & Shy' },
  shame: { emoji: '😔', color: '#D8BFD8', description: 'Ashamed & Guilty' },
  boredom: { emoji: '😑', color: '#C0C0C0', description: 'Bored & Uninterested' },
  
  // Neutral
  calmness: { emoji: '😌', color: '#98D8C8', description: 'Calm & Peaceful' },
  concentration: { emoji: '🧐', color: '#87CEEB', description: 'Focused & Concentrated' },
  neutral: { emoji: '😐', color: '#BDC3C7', description: 'Neutral & Balanced' }
};

// Generate demo emotions with initial random values
const generateDemoEmotions = () => [
  { emotion: 'joy', score: 0.75 + Math.random() * 0.15 },
  { emotion: 'excitement', score: 0.65 + Math.random() * 0.15 },
  { emotion: 'interest', score: 0.55 + Math.random() * 0.15 },
  { emotion: 'contentment', score: 0.45 + Math.random() * 0.15 },
  { emotion: 'amusement', score: 0.35 + Math.random() * 0.15 },
  { emotion: 'love', score: 0.25 + Math.random() * 0.15 },
  { emotion: 'calmness', score: 0.20 + Math.random() * 0.10 },
  { emotion: 'anxiety', score: 0.15 + Math.random() * 0.10 }
];

export const RealTimeEmotionSliders: React.FC<RealTimeEmotionSlidersProps> = ({ 
  emotions, 
  participantName,
  position = 'left' 
}) => {
  // Initialize with demo data if no emotions provided
  const [animatedEmotions, setAnimatedEmotions] = useState<EmotionData[]>(() => {
    return emotions && emotions.length > 0 ? emotions : generateDemoEmotions();
  });

  // Update emotions when prop changes
  useEffect(() => {
    if (emotions && emotions.length > 0) {
      setAnimatedEmotions(emotions);
    }
  }, [emotions]);

  // Animate demo emotions if no real data
  useEffect(() => {
    if (!emotions || emotions.length === 0) {
      const interval = setInterval(() => {
        setAnimatedEmotions(prevEmotions => 
          prevEmotions.map(e => ({
            ...e,
            score: Math.max(0.05, Math.min(0.95, e.score + (Math.random() - 0.5) * 0.1))
          })).sort((a, b) => b.score - a.score)
        );
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [emotions]);

  const getEmotionConfig = (emotion: string) => {
    // Try exact match first
    const lowerEmotion = emotion.toLowerCase();
    if (EMOTION_CONFIG[lowerEmotion]) {
      return EMOTION_CONFIG[lowerEmotion];
    }
    
    // Try to find partial match
    for (const [key, config] of Object.entries(EMOTION_CONFIG)) {
      if (lowerEmotion.includes(key) || key.includes(lowerEmotion)) {
        return config;
      }
    }
    
    // Default fallback
    return { emoji: '😐', color: '#808080', description: emotion };
  };

  // Calculate emotional categories
  const positiveEmotions = ['joy', 'amusement', 'excitement', 'contentment', 'love', 'admiration', 'interest', 'pride', 'calmness'];
  const negativeEmotions = ['fear', 'anxiety', 'sadness', 'anger', 'disgust', 'contempt', 'disappointment', 'embarrassment', 'shame'];
  const engagedEmotions = ['interest', 'concentration', 'surprise', 'awe', 'confusion'];

  const positiveScore = animatedEmotions
    .filter(e => positiveEmotions.includes(e.emotion.toLowerCase()))
    .reduce((sum, e) => sum + e.score, 0) / positiveEmotions.length;
  
  const negativeScore = animatedEmotions
    .filter(e => negativeEmotions.includes(e.emotion.toLowerCase()))
    .reduce((sum, e) => sum + e.score, 0) / negativeEmotions.length;
  
  const engagedScore = animatedEmotions
    .filter(e => engagedEmotions.includes(e.emotion.toLowerCase()))
    .reduce((sum, e) => sum + e.score, 0) / engagedEmotions.length;

  // Show all emotions, but highlight the top ones
  const displayEmotions = animatedEmotions.length > 12 
    ? animatedEmotions.slice(0, 12) 
    : animatedEmotions;

  const dominantEmotion = displayEmotions[0];

  return (
    <div className={`realtime-emotion-sliders ${position || ''}`}>
      <div className="participant-header">
        <h4>{participantName}</h4>
        {dominantEmotion && (
          <div className="dominant-emotion">
            <span className="dominant-emoji">{getEmotionConfig(dominantEmotion.emotion).emoji}</span>
            <span className="dominant-label">{dominantEmotion.emotion}</span>
            <span className="dominant-score">{Math.round(dominantEmotion.score * 100)}%</span>
          </div>
        )}
      </div>

      <div className="emotion-sliders">
        {displayEmotions.map((emotion, index) => {
          const config = getEmotionConfig(emotion.emotion);
          const isTop3 = index < 3;
          
          return (
            <div key={emotion.emotion} className={`emotion-slider ${isTop3 ? 'top-emotion' : ''}`}>
              <div className="emotion-label">
                <span className="emotion-emoji">{config.emoji}</span>
                <span className="emotion-name">{emotion.emotion}</span>
                <span className="emotion-description">{config.description}</span>
              </div>
              <div className="slider-container">
                <div className="slider-track">
                  <div 
                    className="slider-fill"
                    style={{ 
                      width: `${emotion.score * 100}%`,
                      backgroundColor: config.color,
                      opacity: isTop3 ? 1 : 0.7
                    }}
                  />
                </div>
                <span className="emotion-score">{Math.round(emotion.score * 100)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {animatedEmotions.length > 12 && (
        <div className="more-emotions-note">
          +{animatedEmotions.length - 12} more emotions detected
        </div>
      )}
    </div>
  );
};

export default RealTimeEmotionSliders;
