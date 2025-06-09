import React, { useRef, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { AVATAR_ANIMATIONS } from '../config/animationConfig';
import { SkeletonUtils } from 'three-stdlib';

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
  console.log('🔴 CoachAvatar RENDER - URL:', avatarUrl, 'isSpeaking:', isSpeaking);
  
  // Load the avatar and CLONE it to avoid shared morph targets
  const { scene } = useGLTF(avatarUrl);
  const avatar = React.useMemo(() => {
    if (!scene) return null;
    return SkeletonUtils.clone(scene);
  }, [scene]);
  
  // Choose animation based on speaking state
  const idleAnimation = '/animations/feminine/idle/F_Standing_Idle_Variations_003.glb';
  const talkingAnimation = '/animations/feminine/talk/F_Talking_Variations_001.glb';
  
  // Load both animations
  const { animations: idleAnimations } = useGLTF(idleAnimation);
  const { animations: talkingAnimations } = useGLTF(talkingAnimation);
  
  // Combine animations
  const allAnimations = React.useMemo(() => {
    const anims = [...idleAnimations];
    // Add talking animations with a prefix to distinguish them
    talkingAnimations.forEach(anim => {
      const talkAnim = anim.clone();
      talkAnim.name = 'talking_' + talkAnim.name;
      anims.push(talkAnim);
    });
    return anims;
  }, [idleAnimations, talkingAnimations]);
  
  // Set up animations with the avatar directly (not cloned)
  const { actions } = useAnimations(allAnimations, avatar || undefined);
  
  // Play the appropriate animation based on speaking state
  useEffect(() => {
    if (actions && allAnimations.length > 0 && avatar) {
      // Stop all actions first
      Object.values(actions).forEach((action) => action?.stop());
      
      // Find the appropriate animation
      let animationToPlay: THREE.AnimationAction | undefined;
      
      if (isSpeaking) {
        // Find a talking animation
        const talkingAnimName = Object.keys(actions).find(name => name.startsWith('talking_'));
        if (talkingAnimName) {
          animationToPlay = actions[talkingAnimName] || undefined;
          console.log('Playing talking animation:', talkingAnimName);
        }
      }
      
      // If no talking animation or not speaking, play idle
      if (!animationToPlay) {
        const idleAnimName = Object.keys(actions).find(name => !name.startsWith('talking_'));
        if (idleAnimName) {
          animationToPlay = actions[idleAnimName] || undefined;
          console.log('Playing idle animation:', idleAnimName);
        }
      }
      
      // Play the selected animation
      if (animationToPlay) {
        animationToPlay.reset().fadeIn(0.2).play();
        animationToPlay.setLoop(THREE.LoopRepeat, Infinity);
      }
    }
    
    return () => {
      // Stop all actions on cleanup
      Object.values(actions).forEach((action) => action?.stop());
    };
  }, [actions, allAnimations, isSpeaking, avatar]);
  
  // Add debug effect to track if this component is actually being used
  useEffect(() => {
    console.log('🔴 CoachAvatar MOUNTED with URL:', avatarUrl);
    return () => {
      console.log('🔴 CoachAvatar UNMOUNTED');
    };
  }, []);
  
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
