import React from 'react';
import { useState, useEffect } from 'react';
import { useVoice } from '@humeai/voice-react';
import { RPMAvatarWithTracking } from './RPMAvatarWithTracking';

interface HumeAvatarIntegrationProps {
  avatarUrl: string;
  animationUrl?: string;
  position?: [number, number, number];
  scale?: [number, number, number];
  enableWebcamTracking?: boolean;
  isUser?: boolean; // true for user avatar, false for NPC
}

export function HumeAvatarIntegration({
  avatarUrl,
  animationUrl,
  position = [0, -1, 0],
  scale = [1.2, 1.2, 1.2],
  enableWebcamTracking = false,
  isUser = false,
}: HumeAvatarIntegrationProps) {
  const { messages } = useVoice();
  
  const [expressions, setExpressions] = useState<{ [key: string]: number }>({});
  const [visemes, setVisemes] = useState<{ [key: string]: number }>({});
  const [emotionalState, setEmotionalState] = useState<'neutral' | 'happy' | 'sad' | 'excited' | 'thoughtful' | 'angry' | 'surprised'>('neutral');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceIntensity, setVoiceIntensity] = useState(0.5);
  const [headRotation, setHeadRotation] = useState({ pitch: 0, yaw: 0, roll: 0 });
  
  // Simple viseme animation based on speaking state
  useEffect(() => {
    if (!isSpeaking) {
      setVisemes({});
      return;
    }
    
    // Animate visemes while speaking
    const interval = setInterval(() => {
      const visemeSequence = ['aa', 'E', 'I', 'O', 'U', 'PP', 'FF', 'TH', 'DD', 'kk', 'CH', 'SS', 'nn', 'RR'];
      const currentViseme = visemeSequence[Math.floor(Math.random() * visemeSequence.length)];
      
      const newVisemes: { [key: string]: number } = {};
      newVisemes[currentViseme] = 0.6 + Math.random() * 0.4;
      setVisemes(newVisemes);
    }, 100);
    
    return () => clearInterval(interval);
  }, [isSpeaking]);
  
  // Track speaking state from messages
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    
    // Simple speaking detection based on message type
    if (lastMessage.type === 'user_message' && isUser) {
      setIsSpeaking(true);
      setEmotionalState('neutral');
      setVoiceIntensity(0.7);
    } else if (lastMessage.type === 'assistant_message' && !isUser) {
      setIsSpeaking(true);
      setEmotionalState('happy');
      setVoiceIntensity(0.6);
    } else if (lastMessage.type === 'user_interruption' || lastMessage.type === 'assistant_end') {
      setIsSpeaking(false);
    }
    
    // Extract emotions if available
    if ('models' in lastMessage && lastMessage.models?.prosody?.scores) {
      const scores = lastMessage.models.prosody.scores;
      
      // Map Hume emotions to our emotional states
      const emotions = Object.entries(scores).sort(([, a], [, b]) => (b as number) - (a as number));
      if (emotions.length > 0) {
        const [topEmotion] = emotions[0];
        
        // Simple emotion mapping
        const emotionMap: { [key: string]: typeof emotionalState } = {
          'Joy': 'happy',
          'Excitement': 'excited',
          'Sadness': 'sad',
          'Anger': 'angry',
          'Surprise': 'surprised',
          'Contemplation': 'thoughtful',
        };
        
        const mappedEmotion = emotionMap[topEmotion];
        if (mappedEmotion) {
          setEmotionalState(mappedEmotion);
        }
        
        // Set expression values
        const newExpressions: { [key: string]: number } = {};
        emotions.forEach(([emotion, score]) => {
          const expressionName = emotion.toLowerCase();
          if (expressionName && typeof score === 'number') {
            newExpressions[expressionName] = score;
          }
        });
        setExpressions(newExpressions);
      }
    }
  }, [messages, isUser]);
  
  // Simulate head movement based on speaking
  useEffect(() => {
    if (!isSpeaking) {
      setHeadRotation({ pitch: 0, yaw: 0, roll: 0 });
      return;
    }
    
    const interval = setInterval(() => {
      setHeadRotation({
        pitch: (Math.random() - 0.5) * 0.1,
        yaw: (Math.random() - 0.5) * 0.15,
        roll: (Math.random() - 0.5) * 0.05,
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, [isSpeaking]);
  
  return (
    <RPMAvatarWithTracking
      avatarUrl={avatarUrl}
      animationUrl={animationUrl}
      position={position}
      scale={scale}
      enableWebcamTracking={enableWebcamTracking}
      headRotation={headRotation}
      expressions={expressions}
      visemes={visemes}
      isSpeaking={isSpeaking}
      voiceIntensity={voiceIntensity}
      emotionalState={emotionalState}
    />
  );
}
