import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useVoice, type JSONMessage } from '@humeai/voice-react';
import { RPMAnimatedAvatar } from './RPMAnimatedAvatar';
import type { BlendShapeMap } from '../types/blendshapes';
import { prosodyToBlendshapes } from '../utils/prosodyToBlendshapes';

interface HumeRPMIntegrationProps {
  avatarId: string;
  position?: [number, number, number];
  scale?: number;
  showControls?: boolean;
}

// Map Hume prosody to viseme shapes
function humeToVisemeShapes(prosody: any): Partial<BlendShapeMap> {
  const shapes: Partial<BlendShapeMap> = {};
  
  if (!prosody) return shapes;
  
  // Basic mapping from prosody to mouth shapes
  const { power = 0, pitch = 0, speed = 0 } = prosody;
  
  // Jaw opening based on power (volume)
  shapes.jawOpen = Math.min(power * 0.8, 0.8);
  
  // Mouth shapes based on pitch and speed
  if (pitch > 0.5) {
    shapes.mouthSmileLeft = 0.3;
    shapes.mouthSmileRight = 0.3;
  }
  
  if (speed > 0.5) {
    shapes.mouthFunnel = 0.2;
  }
  
  // Add some variation for natural movement
  const time = Date.now() * 0.001;
  shapes.mouthLeft = Math.sin(time * 3) * 0.05;
  shapes.mouthRight = Math.cos(time * 3) * 0.05;
  
  return shapes;
}

export function HumeRPMIntegration({
  avatarId,
  position = [0, -0.8, 0],
  scale = 1.2,
  showControls = true
}: HumeRPMIntegrationProps) {
  const { messages, sendSessionSettings } = useVoice();
  const [emotionShapes, setEmotionShapes] = useState<Partial<BlendShapeMap>>({});
  const [visemeShapes, setVisemeShapes] = useState<Partial<BlendShapeMap>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastMessageRef = useRef<string>('');

  // Configure Hume session
  useEffect(() => {
    sendSessionSettings({
      context: {
        text: "You are a friendly conversational partner in a dating simulation. Be warm, engaging, and responsive."
      }
    });
  }, [sendSessionSettings]);

  // Process Hume messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    // Handle different message types
    if (lastMessage.type === 'assistant_message') {
      const content = lastMessage.message?.content;
      if (content && content !== lastMessageRef.current) {
        lastMessageRef.current = content;
        console.log('[HumeRPM] Assistant speaking:', content);
        setIsSpeaking(true);
      }
    } else if (lastMessage.type === 'assistant_end') {
      console.log('[HumeRPM] Assistant finished speaking');
      setIsSpeaking(false);
      setVisemeShapes({});
    }

    // Extract prosody data if available
    const prosody = (lastMessage as any).models?.prosody;
    if (prosody && isSpeaking) {
      const shapes = humeToVisemeShapes(prosody);
      setVisemeShapes(shapes);
    }

    // Extract emotion data
    const emotions = (lastMessage as any).models?.face?.predictions?.[0]?.emotions;
    if (emotions) {
      const emotionBlendshapes = prosodyToBlendshapes({ emotions });
      setEmotionShapes(emotionBlendshapes);
    }
  }, [messages, isSpeaking]);

  // Simulate viseme animation when speaking
  useEffect(() => {
    if (!isSpeaking) return;

    const interval = setInterval(() => {
      // Create dynamic mouth movements
      const time = Date.now() * 0.001;
      const baseJaw = 0.2 + Math.sin(time * 8) * 0.3;
      
      setVisemeShapes({
        jawOpen: baseJaw,
        mouthFunnel: Math.sin(time * 10) * 0.2,
        mouthPucker: Math.cos(time * 7) * 0.1,
        mouthLeft: Math.sin(time * 5) * 0.1,
        mouthRight: Math.cos(time * 5) * 0.1,
        mouthSmileLeft: 0.1,
        mouthSmileRight: 0.1,
        mouthStretchLeft: Math.sin(time * 6) * 0.1,
        mouthStretchRight: Math.cos(time * 6) * 0.1,
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isSpeaking]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} />
        
        <RPMAnimatedAvatar
          avatarId={avatarId}
          emotionShapes={emotionShapes}
          visemeShapes={visemeShapes}
          isSpeaking={isSpeaking}
          position={position}
          scale={scale}
        />
        
        {showControls && <OrbitControls />}
      </Canvas>
      
      {/* Debug info */}
      <div style={{ 
        position: 'absolute', 
        bottom: 10, 
        left: 10, 
        background: 'rgba(0,0,0,0.7)', 
        color: 'white', 
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px'
      }}>
        <div>Speaking: {isSpeaking ? 'Yes' : 'No'}</div>
        <div>Jaw Open: {(visemeShapes.jawOpen || 0).toFixed(2)}</div>
        <div>Messages: {messages.length}</div>
      </div>
    </div>
  );
}
