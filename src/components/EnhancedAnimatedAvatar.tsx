import React, { useEffect, useRef, useState } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EnhancedAnimatedAvatarProps {
  avatarUrl: string;
  animationUrl: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  
  // Enhanced control props
  headRotation?: { pitch: number; yaw: number; roll: number }; // in radians
  bodyLean?: { forward: number; side: number }; // -1 to 1
  shoulderHeight?: number; // 0 to 1 (0 = relaxed, 1 = tense)
  isSpeaking?: boolean;
  emotionalState?: 'neutral' | 'happy' | 'sad' | 'excited' | 'thoughtful';
  
  // Input control options
  enableMouseTracking?: boolean;
  enableKeyboardControl?: boolean;
  enableVoiceIntensityResponse?: boolean;
  voiceIntensity?: number; // 0 to 1
}

// Preload common avatars and animations
useGLTF.preload('/avatars/fool.glb');
useGLTF.preload('/avatars/chickie.glb');
useGLTF.preload('/avatars/babe.glb');
useGLTF.preload('/avatars/AngelChick.glb');
useGLTF.preload('/animations/M_Standing_Idle_001.glb');
useGLTF.preload('/animations/M_Talking_Variations_001.glb');

export function EnhancedAnimatedAvatar({
  avatarUrl,
  animationUrl,
  position = [0, -1.1, 0],
  rotation = [0, 0, 0],
  scale = [1.4, 1.4, 1.4],
  headRotation = { pitch: 0, yaw: 0, roll: 0 },
  bodyLean = { forward: 0, side: 0 },
  shoulderHeight = 0,
  isSpeaking = false,
  emotionalState = 'neutral',
  enableMouseTracking = false,
  enableKeyboardControl = false,
  enableVoiceIntensityResponse = false,
  voiceIntensity = 0,
}: EnhancedAnimatedAvatarProps) {
  const { scene: avatar } = useGLTF(avatarUrl);
  const { animations: animClips } = useGLTF(animationUrl);
  const { actions } = useAnimations(animClips, avatar);
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [keyboardRotation, setKeyboardRotation] = useState({ pitch: 0, yaw: 0 });
  
  const headBone = useRef<THREE.Bone | null>(null);
  const neckBone = useRef<THREE.Bone | null>(null);
  const spineBone = useRef<THREE.Bone | null>(null);
  const shoulderLBone = useRef<THREE.Bone | null>(null);
  const shoulderRBone = useRef<THREE.Bone | null>(null);

  // Find bones in the avatar
  useEffect(() => {
    if (avatar) {
      avatar.traverse((child) => {
        if (child instanceof THREE.Bone) {
          const boneName = child.name.toLowerCase();
          if (boneName.includes('head')) headBone.current = child;
          else if (boneName.includes('neck')) neckBone.current = child;
          else if (boneName.includes('spine') && !boneName.includes('spine1')) spineBone.current = child;
          else if (boneName.includes('shoulder') && boneName.includes('l')) shoulderLBone.current = child;
          else if (boneName.includes('shoulder') && boneName.includes('r')) shoulderRBone.current = child;
        }
      });
    }
  }, [avatar]);

  // Mouse tracking
  useEffect(() => {
    if (!enableMouseTracking) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      setMousePosition({ x, y });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enableMouseTracking]);

  // Keyboard control
  useEffect(() => {
    if (!enableKeyboardControl) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 0.05;
      switch(e.key) {
        case 'ArrowUp':
          setKeyboardRotation(prev => ({ ...prev, pitch: Math.min(prev.pitch + step, 0.5) }));
          break;
        case 'ArrowDown':
          setKeyboardRotation(prev => ({ ...prev, pitch: Math.max(prev.pitch - step, -0.5) }));
          break;
        case 'ArrowLeft':
          setKeyboardRotation(prev => ({ ...prev, yaw: Math.min(prev.yaw + step, 0.5) }));
          break;
        case 'ArrowRight':
          setKeyboardRotation(prev => ({ ...prev, yaw: Math.max(prev.yaw - step, -0.5) }));
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardControl]);

  // Play animations
  useEffect(() => {
    if (actions && animClips.length > 0) {
      actions[animClips[0].name]?.reset().fadeIn(0.2).play();
    }
    return () => {
      Object.values(actions).forEach((action) => action?.stop());
    };
  }, [actions, animClips]);

  // Animate bones based on inputs
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Combine all rotation inputs
    let finalHeadRotation = { ...headRotation };
    
    // Add mouse tracking
    if (enableMouseTracking) {
      finalHeadRotation.yaw += mousePosition.x * 0.3;
      finalHeadRotation.pitch += mousePosition.y * 0.2;
    }
    
    // Add keyboard control
    if (enableKeyboardControl) {
      finalHeadRotation.yaw += keyboardRotation.yaw;
      finalHeadRotation.pitch += keyboardRotation.pitch;
    }
    
    // Apply head rotation
    if (headBone.current) {
      headBone.current.rotation.x = finalHeadRotation.pitch;
      headBone.current.rotation.y = finalHeadRotation.yaw;
      headBone.current.rotation.z = finalHeadRotation.roll;
      
      // Add subtle movement based on emotional state
      switch(emotionalState) {
        case 'happy':
          headBone.current.rotation.x += Math.sin(time * 2) * 0.02;
          break;
        case 'sad':
          headBone.current.rotation.x -= 0.1;
          break;
        case 'excited':
          headBone.current.rotation.y += Math.sin(time * 4) * 0.03;
          break;
        case 'thoughtful':
          headBone.current.rotation.z += Math.sin(time * 0.5) * 0.02;
          break;
      }
    }
    
    // Apply neck rotation (softer than head)
    if (neckBone.current) {
      neckBone.current.rotation.x = finalHeadRotation.pitch * 0.3;
      neckBone.current.rotation.y = finalHeadRotation.yaw * 0.3;
    }
    
    // Apply body lean
    if (spineBone.current) {
      spineBone.current.rotation.x = bodyLean.forward * 0.2;
      spineBone.current.rotation.z = bodyLean.side * 0.1;
      
      // Add breathing animation
      const breathingAmount = 0.02;
      const breathingSpeed = 0.5;
      spineBone.current.rotation.x += Math.sin(time * breathingSpeed) * breathingAmount;
    }
    
    // Apply shoulder height
    if (shoulderLBone.current && shoulderRBone.current) {
      const shoulderOffset = shoulderHeight * 0.1;
      shoulderLBone.current.position.y = shoulderOffset;
      shoulderRBone.current.position.y = shoulderOffset;
    }
    
    // Voice intensity response
    if (enableVoiceIntensityResponse && isSpeaking && headBone.current) {
      // Add nodding based on voice intensity
      headBone.current.rotation.x += Math.sin(time * 8) * voiceIntensity * 0.05;
      
      // Slight body movement
      if (spineBone.current) {
        spineBone.current.rotation.y += Math.sin(time * 3) * voiceIntensity * 0.02;
      }
    }
  });

  if (!avatar) {
    return null;
  }
  
  return (
    <primitive object={avatar} scale={scale} position={position} rotation={rotation} />
  );
}
