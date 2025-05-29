import React, { useState, useEffect, useRef } from 'react';
import { SpeechDetector } from '../utils/speech-detector';
import '../styles/emotional-avatar.css';

interface EmotionalAvatarProps {
  initialEmotion?: 'neutral' | 'happy' | 'sad' | 'excited' | 'nervous';
}

export const EmotionalAvatar: React.FC<EmotionalAvatarProps> = ({ 
  initialEmotion = 'neutral' 
}) => {
  const [currentEmotion, setCurrentEmotion] = useState(initialEmotion);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechDetectorRef = useRef<SpeechDetector | null>(null);

  useEffect(() => {
    // Initialize speech detection
    const speechDetector = new SpeechDetector();
    speechDetectorRef.current = speechDetector;

    speechDetector.startListening((intensity) => {
      setIsSpeaking(true);
      
      // Approximate emotion based on speech
      const approximatedEmotion = speechDetector.approximateEmotion({
        intensity,
        pitch: 0.6  // Placeholder pitch value
      });

      setCurrentEmotion(approximatedEmotion as 'neutral' | 'happy' | 'sad' | 'excited' | 'nervous');

      // Reset speaking state after a delay
      setTimeout(() => setIsSpeaking(false), 500);
    });

    return () => {
      // Cleanup logic
    };
  }, []);

  return (
    <div 
      className={`emotional-avatar ${currentEmotion}`}
      aria-label={`Avatar expressing ${currentEmotion} emotion`}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="300" 
        height="400" 
        viewBox="0 0 300 400"
      >
        {/* Base Avatar SVG from previous implementation */}
        <ellipse cx="150" cy="200" rx="120" ry="150" fill="#F5D4A0"/>
        
        {/* Dynamic Eye Animation */}
        <g className={`avatar-eyes ${isSpeaking ? 'blink' : ''}`}>
          <circle cx="110" cy="180" r="15" fill="#4A4A4A"/>
          <circle cx="190" cy="180" r="15" fill="#4A4A4A"/>
        </g>

        {/* Dynamic Mouth Animation */}
        <path 
          d="M110,250 Q150,280 190,250" 
          stroke="#FF6B6B" 
          strokeWidth="5" 
          fill="none"
          className={`avatar-mouth ${isSpeaking ? 'speaking' : ''}`}
        />
      </svg>
    </div>
  );
};
