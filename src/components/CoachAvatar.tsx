import React, { useRef, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { AVATAR_ANIMATIONS } from '../config/animationConfig';

interface CoachAvatarProps {
  avatarUrl: string;
  position?: [number, number, number];
  scale?: number;
  isSpeaking?: boolean;
}

const CoachAvatar: React.FC<CoachAvatarProps> = ({
  avatarUrl,
  position = [0, 0, 0],
  scale = 1,
  isSpeaking = false
}) => {
  console.log(' CoachAvatar RENDER - URL:', avatarUrl);
  
  // Load the avatar without cloning (like AnimatedAvatar does)
  const { scene: avatar } = useGLTF(avatarUrl);
  
  // Set a specific default animation (F_Standing_Idle_Variations_001.glb)
  const defaultAnimation = '/animations/feminine/idle/F_Standing_Idle_Variations_001.glb';
  
  // Always load the animation (no conditional hooks)
  const { animations } = useGLTF(defaultAnimation);
  
  // Set up animations with the avatar directly (not cloned)
  const { actions } = useAnimations(animations, avatar);
  
  // Play the animation when loaded
  useEffect(() => {
    if (actions && animations.length > 0) {
      console.log('Playing animation:', animations[0].name);
      const action = actions[animations[0].name];
      if (action) {
        action.reset().fadeIn(0.2).play();
        action.setLoop(THREE.LoopRepeat, Infinity);
      }
    }
    
    return () => {
      // Stop all actions on cleanup
      Object.values(actions).forEach((action) => action?.stop());
    };
  }, [actions, animations]);
  
  if (!avatar) {
    console.error('Avatar not loaded:', avatarUrl);
    return null;
  }
  
  return (
    <primitive 
      object={avatar} 
      scale={scale} 
      position={position} 
    />
  );
};

export default CoachAvatar;
