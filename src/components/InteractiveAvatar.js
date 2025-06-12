import React, { useState, useEffect, useRef } from 'react';
import { Avatar } from '@readyplayerme/visage';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

// Emotion mapping for Ready Player Me blendshapes
const EMOTION_BLENDSHAPES = {
  neutral: {
    mouthSmileLeft: 0,
    mouthSmileRight: 0,
    mouthFrownLeft: 0,
    mouthFrownRight: 0,
    eyeBlinkLeft: 0.2,
    eyeBlinkRight: 0.2
  },
  happy: {
    mouthSmileLeft: 0.7,
    mouthSmileRight: 0.7,
    eyeBlinkLeft: 0.1,
    eyeBlinkRight: 0.1
  },
  sad: {
    mouthFrownLeft: 0.5,
    mouthFrownRight: 0.5,
    eyeBlinkLeft: 0.4,
    eyeBlinkRight: 0.4
  },
  surprised: {
    jawOpen: 0.3,
    eyeWideLeft: 0.5,
    eyeWideRight: 0.5
  },
  angry: {
    browDownLeft: 0.6,
    browDownRight: 0.6,
    mouthPressLeft: 0.4,
    mouthPressRight: 0.4
  }
};

const InteractiveAvatar = ({ 
  characterType = 'coach', 
  avatarUrl = 'https://models.readyplayer.me/681d6cd903879b2f11528470.glb',
  onEmotionChange 
}) => {
  const [emotion, setEmotion] = useState('neutral');
  const [blendShapes, setBlendShapes] = useState({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  useEffect(() => {
    const initAudioAnalysis = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const checkAudioIntensity = () => {
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyser.getByteFrequencyData(dataArray);
          
          const volume = dataArray.reduce((a, b) => a + b) / bufferLength;
          
          setIsSpeaking(volume > 10);

          requestAnimationFrame(checkAudioIntensity);
        };

        checkAudioIntensity();
      } catch (error) {
        console.error('Audio capture error:', error);
      }
    };

    initAudioAnalysis();
  }, []);

  useEffect(() => {
    // Apply emotion-based blendshapes
    const emotionBlendShapes = EMOTION_BLENDSHAPES[emotion] || EMOTION_BLENDSHAPES.neutral;
    setBlendShapes(emotionBlendShapes);

    if (onEmotionChange) {
      onEmotionChange(emotion);
    }
  }, [emotion, onEmotionChange]);

  const handleEmotionChange = (e) => {
    setEmotion(e.target.value);
  };

  return (
    <div className="interactive-avatar">
      <Canvas camera={{ position: [0, 1.6, 3], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Avatar 
          modelSrc={avatarUrl}
          blendShapes={blendShapes}
          environment="sunset"
        />
        <OrbitControls />
      </Canvas>
      
      <div className="avatar-controls">
        <select value={emotion} onChange={handleEmotionChange}>
          {Object.keys(EMOTION_BLENDSHAPES).map(em => (
            <option key={em} value={em}>{em}</option>
          ))}
        </select>
        
        <div className="avatar-info">
          <p>Character Type: {characterType}</p>
          <p>Speaking: {isSpeaking ? 'Yes' : 'No'}</p>
          <p>Current Emotion: {emotion}</p>
        </div>
      </div>
    </div>
  );
};

export default InteractiveAvatar;
