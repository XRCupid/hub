import React, { useEffect, useRef, useState } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
// Temporarily disabled to prevent console errors
// import { useWebcamTracking } from '../hooks/useWebcamTracking';

interface RPMAvatarWithTrackingProps {
  avatarUrl: string;
  animationUrl?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  
  // Head tracking
  enableWebcamTracking?: boolean;
  headRotation?: { pitch: number; yaw: number; roll: number };
  
  // Facial expressions (0-1 values)
  expressions?: {
    happy?: number;
    sad?: number;
    angry?: number;
    surprised?: number;
    disgusted?: number;
    fearful?: number;
  };
  
  // Visemes for lip sync (0-1 values)
  visemes?: {
    aa?: number;
    E?: number;
    I?: number;
    O?: number;
    U?: number;
    CH?: number;
    DD?: number;
    FF?: number;
    kk?: number;
    nn?: number;
    PP?: number;
    RR?: number;
    SS?: number;
    TH?: number;
  };
  
  // Voice data
  isSpeaking?: boolean;
  voiceIntensity?: number;
  
  // Emotion from voice/context
  emotionalState?: 'neutral' | 'happy' | 'sad' | 'excited' | 'thoughtful' | 'angry' | 'surprised';
}

export const RPMAvatarWithTracking: React.FC<RPMAvatarWithTrackingProps> = ({
  avatarUrl,
  animationUrl,
  position = [0, -0.4, 0], // Raise slightly to center face
  rotation = [0, 0, 0], // Natural pose
  scale = [1.2, 1.2, 1.2], // Slightly larger for close-up
  enableWebcamTracking = false,
  headRotation = { pitch: 0, yaw: 0, roll: 0 },
  expressions = {},
  visemes = {},
  isSpeaking = false,
  voiceIntensity = 0,
  emotionalState = 'neutral',
}) => {
  const { scene } = useGLTF(avatarUrl);
  const animationGltf = useGLTF(animationUrl || avatarUrl); // Always call the hook
  const animClips = animationUrl ? animationGltf.animations : [];
  const { actions } = useAnimations(animClips, scene);
  
  const headBone = useRef<THREE.Bone | null>(null);
  const neckBone = useRef<THREE.Bone | null>(null);
  const morphTargets = useRef<{ [key: string]: THREE.Mesh }>({});
  
  // Temporarily disable webcam tracking to prevent errors
  const webcamTracking = {
    rotation: { pitch: 0, yaw: 0, roll: 0 },
    isWebcamActive: false,
    error: null,
    startWebcam: () => {},
    stopWebcam: () => {}
  };
  
  // Log webcam status
  useEffect(() => {
    if (enableWebcamTracking) {
      console.log('Webcam tracking enabled:', webcamTracking.isWebcamActive);
      if (webcamTracking.error) {
        console.error('Webcam error:', webcamTracking.error);
      }
    }
  }, [enableWebcamTracking, webcamTracking.isWebcamActive, webcamTracking.error]);
  
  // Find bones and morph targets
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Bone) {
          const boneName = child.name.toLowerCase();
          if (boneName.includes('head')) headBone.current = child;
          else if (boneName.includes('neck')) neckBone.current = child;
        }
        
        if (child instanceof THREE.SkinnedMesh && child.morphTargetDictionary) {
          morphTargets.current[child.name] = child;
        }
      });
    }
  }, [scene]);
  
  // Play animations
  useEffect(() => {
    // Try different animation - use idle.glb instead of M_Standing_Idle_001.glb
    if (actions && animClips.length > 0) {
      // Find the best animation clip
      const idleClip = animClips.find(clip => 
        clip.name.toLowerCase().includes('idle') || 
        clip.name.toLowerCase().includes('standing')
      );
      const clipToPlay = idleClip || animClips[0];
      actions[clipToPlay.name]?.reset().fadeIn(0.2).play();
    }
    return () => {
      Object.values(actions).forEach((action) => action?.stop());
    };
  }, [actions, animClips]);
  
  // Apply all transformations
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Combine head rotations
    let finalRotation = { ...headRotation };
    if (enableWebcamTracking) {
      finalRotation.pitch += webcamTracking.rotation.pitch;
      finalRotation.yaw += webcamTracking.rotation.yaw;
      finalRotation.roll += webcamTracking.rotation.roll;
    }
    
    // Apply head rotation
    if (headBone.current) {
      // Base forward tilt to prevent backward lean
      headBone.current.rotation.x = 0.3; // Forward tilt for T-pose
      headBone.current.rotation.y = THREE.MathUtils.lerp(
        headBone.current.rotation.y,
        finalRotation.yaw * 0.7,
        0.1
      );
      headBone.current.rotation.z = THREE.MathUtils.lerp(
        headBone.current.rotation.z,
        finalRotation.roll * 0.3,
        0.1
      );
      
      // Add subtle movements based on emotional state
      switch(emotionalState) {
        case 'happy':
          headBone.current.rotation.y += Math.sin(time * 2) * 0.02;
          break;
        case 'sad':
          headBone.current.rotation.y -= 0.1;
          break;
        case 'excited':
          headBone.current.rotation.z += Math.sin(time * 4) * 0.03;
          break;
        case 'thoughtful':
          headBone.current.rotation.x += Math.sin(time * 0.5) * 0.02;
          break;
        case 'angry':
          headBone.current.rotation.y -= 0.05;
          break;
        case 'surprised':
          headBone.current.rotation.y += 0.05;
          break;
      }
      
      // Add speaking motion
      if (isSpeaking) {
        headBone.current.rotation.y += Math.sin(time * 8) * voiceIntensity * 0.03;
      }
    }
    
    // Apply neck rotation (softer)
    if (neckBone.current) {
      neckBone.current.rotation.x = finalRotation.pitch * 0.3;
      neckBone.current.rotation.y = finalRotation.yaw * 0.3;
    }
    
    // Apply facial expressions and visemes
    Object.entries(morphTargets.current).forEach(([meshName, mesh]) => {
      if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;
      
      // Apply expressions
      Object.entries(expressions).forEach(([expression, value]) => {
        if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
          const morphIndex = mesh.morphTargetDictionary[expression];
          if (morphIndex !== undefined) {
            mesh.morphTargetInfluences[morphIndex] = value || 0;
          }
        }
      });
      
      // Apply visemes (mouth shapes for speech)
      Object.entries(visemes).forEach(([viseme, value]) => {
        if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
          const morphIndex = mesh.morphTargetDictionary[`viseme_${viseme}`];
          if (morphIndex !== undefined) {
            mesh.morphTargetInfluences[morphIndex] = value || 0;
          }
        }
      });
      
      // Apply emotion-based expressions
      const emotionExpressions: { [key: string]: { [key: string]: number } } = {
        happy: { mouthSmile: 0.7, eyeSquintLeft: 0.3, eyeSquintRight: 0.3 },
        sad: { mouthFrownLeft: 0.5, mouthFrownRight: 0.5, eyesClosed: 0.2 },
        angry: { browDownLeft: 0.8, browDownRight: 0.8, mouthFrownLeft: 0.3, mouthFrownRight: 0.3 },
        surprised: { eyeWideLeft: 0.8, eyeWideRight: 0.8, mouthOpen: 0.5, browInnerUp: 0.7 },
        thoughtful: { browDownLeft: 0.2, browDownRight: 0.2, mouthPucker: 0.2 },
      };
      
      if (emotionExpressions[emotionalState] && mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
        Object.entries(emotionExpressions[emotionalState]).forEach(([morphName, value]) => {
          const morphIndex = mesh.morphTargetDictionary![morphName];
          if (morphIndex !== undefined) {
            // Blend with existing value
            mesh.morphTargetInfluences![morphIndex] = Math.max(
              mesh.morphTargetInfluences![morphIndex],
              value
            );
          }
        });
      }
      
      // Natural blinking
      if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
        const blinkSpeed = 0.15;
        const blinkInterval = 4;
        const blink = Math.sin(time * blinkInterval) > 0.95 ? 1 : 0;
        const blinkLeft = mesh.morphTargetDictionary['eyeBlinkLeft'];
        const blinkRight = mesh.morphTargetDictionary['eyeBlinkRight'];
        if (blinkLeft !== undefined) mesh.morphTargetInfluences[blinkLeft] = blink;
        if (blinkRight !== undefined) mesh.morphTargetInfluences[blinkRight] = blink;
      }
    });
  });
  
  if (!scene) return null;
  
  return (
    <group 
      position={position} 
      scale={scale}
      rotation={[0.05, 0, 0]} // Very subtle forward tilt
    >
      <primitive 
        object={scene} 
      />
    </group>
  );
}
