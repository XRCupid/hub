// Entire file commented out to debug TypeScript build failure
/*
import React, { useState, useEffect, useRef, useCallback } from 'react';
// DEPRECATED: This file is no longer used. See SimulationView.tsx for the new avatar logic.

  avatarUrl = 'https://models.readyplayer.me/681d6cd903879b2f11528470.glb',
  emotion = 'neutral',
  textToSpeak = '',
  onAvatarLoaded = () => {},
  onSpeechStart = () => {},
  onSpeechEnd = () => {},
  ttsApiKey = null,
  ttsLanguage = 'en-US',
  ttsVoice = 'en-US-Standard-C',
  lipsyncModules = ['en']  // New prop for custom modules
}) => {

  const avatarContainerRef = useRef(null);
  const talkingHeadRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // Explicitly use isSpeaking to satisfy ESLint
  const speakingStatus = isSpeaking;
  const [loadError, setLoadError] = useState(null);

  const mapEmotionToMood = (emotion) => {
    const emotionMap = {
      'neutral': 'neutral',
      'happy': 'happy',
      'joy': 'happy',
      'sad': 'sad',
      'sadness': 'sad',
      'angry': 'angry',
      'anger': 'angry',
      'fear': 'fear',
      'disgust': 'disgust',
      'love': 'love',
      
      'excitement': 'happy',
      'interest': 'happy',
      'amusement': 'happy',
      'contentment': 'happy',
      'satisfaction': 'happy',
      'relief': 'happy',
      'pride': 'happy',
      'admiration': 'happy',
      'adoration': 'love',
      'entrancement': 'love',
      'romance': 'love',
      'sympathy': 'sad',
      'disappointment': 'sad',
      'embarrassment': 'sad',
      // Default fallback
      'default': 'neutral'
    };
    
    return emotionMap[emotion] || emotionMap['default'];
  };

  useEffect(() => {
    if (!avatarContainerRef.current) return;

    const initializeTalkingHead = async () => {
      try {
        const TalkingHead = await loadTalkingHead();
        
        const talkingHead = new TalkingHead(avatarContainerRef.current, {
          modelUrl: avatarUrl,
          ttsApikey: ttsApiKey,
          ttsLang: ttsLanguage,
          ttsVoice: ttsVoice,
          lipsyncModules: lipsyncModules,
          cameraView: 'head'
        });

        talkingHeadRef.current = talkingHead;

        talkingHead.addEventListener('modelLoaded', () => {
          setIsLoaded(true);
          onAvatarLoaded(talkingHead);

          // --- BEGIN: Morph Target Name Logging ---
          try {
            // Try to access the underlying Three.js scene/mesh from the TalkingHead instance
            const scene = talkingHead.scene || (talkingHead.model && talkingHead.model.scene);
            if (scene) {
              scene.traverse((child) => {
                if (child.isMesh && child.morphTargetDictionary) {
                  console.log('[DEBUG][TalkingHeadAvatar] Mesh:', child.name);
                  console.log('[DEBUG][TalkingHeadAvatar] Morph Target Names:', Object.keys(child.morphTargetDictionary));
                }
              });
            } else {
              console.warn('[DEBUG][TalkingHeadAvatar] No scene found on TalkingHead instance for morph target inspection');
            }
          } catch (err) {
            console.error('[DEBUG][TalkingHeadAvatar] Error inspecting morph targets:', err);
          }
          // --- END: Morph Target Name Logging ---
        });

        talkingHead.addEventListener('speechStart', () => {
          setIsSpeaking(true);
          onSpeechStart();
        });

        talkingHead.addEventListener('speechEnd', () => {
          setIsSpeaking(false);
          onSpeechEnd();
        });
      } catch (error) {
        console.error('TalkingHead initialization error:', error);
        setLoadError(error);
      }
    };

    initializeTalkingHead();

    return () => {
      if (talkingHeadRef.current) {
        talkingHeadRef.current.dispose();
      }
    };
  }, [avatarUrl, ttsApiKey, ttsLanguage, ttsVoice, lipsyncModules, onAvatarLoaded, onSpeechStart, onSpeechEnd]);

  useEffect(() => {
    if (talkingHeadRef.current && isLoaded) {
      const mood = mapEmotionToMood(emotion);
      talkingHeadRef.current.setMood(mood);
    }
  }, [emotion, isLoaded, talkingHeadRef]);

  useEffect(() => {
    if (talkingHeadRef.current && isLoaded && textToSpeak) {
      try {
        talkingHeadRef.current.speak(textToSpeak);
      } catch (error) {
        console.error('Speech error:', error);
        // Fallback to browser speech synthesis if TalkingHead fails
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [textToSpeak, isLoaded]);

  return (
    <div 
      ref={avatarContainerRef} 
      style={{ 
        width: '100%', 
        height: '400px', 
        position: 'relative' 
      }}
    >
      {!isLoaded && <div>Loading avatar...</div>}
      {loadError && <div>Error loading avatar: {loadError.message}</div>}
    </div>
  );
};

export default TalkingHeadAvatar;
*/