import React, { useRef, useEffect, useState } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ConversationAvatarProps {
  avatarUrl: string;
  position?: [number, number, number];
  scale?: number;
  isSpeaking?: boolean;
  audioContext?: AudioContext | null;
  audioData?: Uint8Array;
}

export const ConversationAvatar: React.FC<ConversationAvatarProps> = ({
  avatarUrl,
  position = [0, 0, 0],
  scale = 1,
  isSpeaking = false,
  audioContext,
  audioData
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.SkinnedMesh | null>(null);
  const blinkTimer = useRef(0);
  const nextBlinkTime = useRef(3);
  const currentAnimation = useRef<string>('idle');
  const [isBlinking, setIsBlinking] = useState(false);
  
  // Load avatar
  const { scene } = useGLTF(avatarUrl);
  
  // Animation paths
  const idleAnimationPath = '/animations/feminine/idle/F_Standing_Idle_Variations_001.glb';
  const talkAnimationPath = '/animations/feminine/talk/F_Talking_Variations_001.glb';
  
  // Load both animations
  const { animations: idleAnimations } = useGLTF(idleAnimationPath);
  const { animations: talkAnimations } = useGLTF(talkAnimationPath);
  
  // Set up animation actions
  const { actions: idleActions, mixer: idleMixer } = useAnimations(idleAnimations, scene);
  const { actions: talkActions, mixer: talkMixer } = useAnimations(talkAnimations, scene);
  
  // Find the head mesh for morph targets
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.morphTargetInfluences) {
        meshRef.current = child;
        console.log('Found mesh with morph targets:', child.morphTargetDictionary);
      }
    });
  }, [scene]);
  
  // Handle animation switching
  useEffect(() => {
    const targetAnimation = isSpeaking ? 'talk' : 'idle';
    
    if (currentAnimation.current !== targetAnimation) {
      // Fade out current animation
      const currentActions = currentAnimation.current === 'idle' ? idleActions : talkActions;
      const targetActions = targetAnimation === 'idle' ? idleActions : talkActions;
      
      // Stop all current animations
      Object.values(currentActions).forEach(action => {
        action?.fadeOut(0.5);
      });
      
      // Start target animation
      const animationName = targetAnimation === 'idle' 
        ? idleAnimations[0]?.name 
        : talkAnimations[0]?.name;
        
      if (animationName && targetActions[animationName]) {
        const action = targetActions[animationName];
        action.reset().fadeIn(0.5).play();
        action.setLoop(THREE.LoopRepeat, Infinity);
      }
      
      currentAnimation.current = targetAnimation;
    }
  }, [isSpeaking, idleActions, talkActions, idleAnimations, talkAnimations]);
  
  // Blinking and lip-sync update
  useFrame((state, delta) => {
    // Update animation mixers
    if (idleMixer) idleMixer.update(delta);
    if (talkMixer) talkMixer.update(delta);
    
    // Blinking logic
    blinkTimer.current += delta;
    if (blinkTimer.current > nextBlinkTime.current && !isBlinking) {
      setIsBlinking(true);
      
      // Blink animation using morph targets
      if (meshRef.current?.morphTargetDictionary && meshRef.current.morphTargetInfluences) {
        const blinkIndex = meshRef.current.morphTargetDictionary['eyesClosed'] || 
                          meshRef.current.morphTargetDictionary['blink'] ||
                          meshRef.current.morphTargetDictionary['eyesClose'];
        
        if (blinkIndex !== undefined) {
          // Animate blink
          meshRef.current.morphTargetInfluences[blinkIndex] = 1;
          
          setTimeout(() => {
            if (meshRef.current?.morphTargetInfluences) {
              meshRef.current.morphTargetInfluences[blinkIndex] = 0;
            }
            setIsBlinking(false);
          }, 150);
        }
      }
      
      // Set next blink time (2-5 seconds randomly)
      blinkTimer.current = 0;
      nextBlinkTime.current = 2 + Math.random() * 3;
    }
    
    // Lip-sync when speaking
    if (isSpeaking && audioData && audioData.length > 0 && meshRef.current) {
      // Analyze audio frequency for lip-sync
      const volume = audioData.reduce((sum, val) => sum + val, 0) / audioData.length / 255;
      
      // Map volume to mouth shapes using morph targets
      if (meshRef.current.morphTargetDictionary && meshRef.current.morphTargetInfluences) {
        const mouthOpenIndex = meshRef.current.morphTargetDictionary['mouthOpen'] || 
                              meshRef.current.morphTargetDictionary['mouth_open'] ||
                              meshRef.current.morphTargetDictionary['viseme_aa'];
        
        if (mouthOpenIndex !== undefined) {
          meshRef.current.morphTargetInfluences[mouthOpenIndex] = volume * 0.8;
        }
        
        // Add subtle smile during speech
        const smileIndex = meshRef.current.morphTargetDictionary['mouthSmile'] || 
                          meshRef.current.morphTargetDictionary['smile'];
        
        if (smileIndex !== undefined) {
          meshRef.current.morphTargetInfluences[smileIndex] = 0.1 + volume * 0.1;
        }
      }
    } else if (meshRef.current?.morphTargetInfluences) {
      // Reset mouth shapes when not speaking
      Object.keys(meshRef.current.morphTargetDictionary || {}).forEach(key => {
        if (key.includes('mouth') || key.includes('viseme')) {
          const index = meshRef.current!.morphTargetDictionary![key];
          if (meshRef.current!.morphTargetInfluences![index] > 0) {
            meshRef.current!.morphTargetInfluences![index] *= 0.9; // Smooth transition
          }
        }
      });
    }
    
    // Subtle idle movement
    if (!isSpeaking && groupRef.current) {
      const time = state.clock.elapsedTime;
      groupRef.current.rotation.y = Math.sin(time * 0.5) * 0.05;
      groupRef.current.position.y = position[1] + Math.sin(time * 0.8) * 0.02;
    }
  });
  
  return (
    <group ref={groupRef} position={position} scale={scale}>
      <primitive object={scene} />
    </group>
  );
};
