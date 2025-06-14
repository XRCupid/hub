import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useGraph } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import { MathUtils } from 'three';
import type { TrackingData, FacialExpressions } from '../types/tracking';

const DEFAULT_AVATAR_URL = '/avatars/coach_grace.glb';

interface PresenceAvatarWithGenderProps {
  avatarUrl?: string;
  position?: [number, number, number] | THREE.Vector3;
  scale?: number;
  trackingData?: TrackingData;
  animationName?: string;
  emotionalBlendshapes?: Record<string, number>;
  audioData?: Uint8Array;
  participantId?: string;
  gender?: 'male' | 'female'; // Allow explicit gender override
}

// Hume to RPM blendshape mapping with amplification factors
const HUME_TO_RPM_MAPPING: Record<string, { target: string; amplify?: number }> = {
  'browInnerUp': { target: 'browInnerUp', amplify: 1.5 },
  'browDownLeft': { target: 'browDownLeft', amplify: 1.8 },
  'browDownRight': { target: 'browDownRight', amplify: 1.8 },
  'browOuterUpLeft': { target: 'browOuterUpLeft', amplify: 1.5 },
  'browOuterUpRight': { target: 'browOuterUpRight', amplify: 1.5 },
  'mouthSmileLeft': { target: 'mouthSmileLeft', amplify: 2.5 },
  'mouthSmileRight': { target: 'mouthSmileRight', amplify: 2.5 },
  'mouthFrownLeft': { target: 'mouthFrownLeft', amplify: 2.2 },
  'mouthFrownRight': { target: 'mouthFrownRight', amplify: 2.2 },
  'mouthOpen': { target: 'mouthOpen', amplify: 1.0 },
  'mouthPucker': { target: 'mouthPucker', amplify: 1.8 },
  'mouthLeft': { target: 'mouthLeft', amplify: 1.5 },
  'mouthRight': { target: 'mouthRight', amplify: 1.5 },
  'eyeSquintLeft': { target: 'eyeSquintLeft', amplify: 1.4 },
  'eyeSquintRight': { target: 'eyeSquintRight', amplify: 1.4 },
  'eyeWideLeft': { target: 'eyeWideLeft', amplify: 1.2 },
  'eyeWideRight': { target: 'eyeWideRight', amplify: 1.2 },
  'cheekPuff': { target: 'cheekPuff', amplify: 1.5 },
  'cheekSquintLeft': { target: 'cheekSquintLeft', amplify: 1.3 },
  'cheekSquintRight': { target: 'cheekSquintRight', amplify: 1.3 },
  'noseSneerLeft': { target: 'noseSneerLeft', amplify: 1.5 },
  'noseSneerRight': { target: 'noseSneerRight', amplify: 1.5 },
  'jawOpen': { target: 'jawOpen', amplify: 1.0 },
  'jawLeft': { target: 'jawLeft', amplify: 1.2 },
  'jawRight': { target: 'jawRight', amplify: 1.2 }
};

// Emotion to blendshape mapping
const EMOTION_TO_BLENDSHAPE: Record<string, string[]> = {
  joy: ['mouthSmileLeft', 'mouthSmileRight', 'cheekSquintLeft', 'cheekSquintRight'],
  sadness: ['mouthFrownLeft', 'mouthFrownRight', 'browDownLeft', 'browDownRight'],
  anger: ['browDownLeft', 'browDownRight', 'noseSneerLeft', 'noseSneerRight'],
  fear: ['eyeWideLeft', 'eyeWideRight', 'browInnerUp', 'mouthOpen'],
  surprise: ['eyeWideLeft', 'eyeWideRight', 'browOuterUpLeft', 'browOuterUpRight', 'mouthOpen'],
  disgust: ['noseSneerLeft', 'noseSneerRight', 'mouthFrownLeft', 'mouthFrownRight'],
  contempt: ['mouthLeft', 'mouthRight', 'eyeSquintLeft', 'eyeSquintRight']
};

// Head rotation limits
const HEAD_ROTATION_LIMITS = {
  pitch: { min: -0.5, max: 0.5 },
  yaw: { min: -0.7, max: 0.7 },
  roll: { min: -0.3, max: 0.3 }
};

// Neck rotation distribution
const NECK_ROTATION_FACTOR = {
  pitch: {
    neck: 0.3,
    head: 0.7
  },
  yaw: {
    neck: 0.4,
    head: 0.6
  },
  roll: {
    neck: 0.2,
    head: 0.8
  }
};

function clampRotation(value: number, limits: { min: number; max: number }): number {
  return Math.max(limits.min, Math.min(limits.max, value));
}

function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

const tempEuler = new THREE.Euler();
const tempQuat = new THREE.Quaternion();
const tempMatrix = new THREE.Matrix4();
const deltaMatrix = new THREE.Matrix4();
const targetWorldMatrix = new THREE.Matrix4();
const parentInverseWorldMatrix = new THREE.Matrix4();
const targetLocalMatrix = new THREE.Matrix4();

export const PresenceAvatarWithGender: React.FC<PresenceAvatarWithGenderProps> = React.memo(({
  avatarUrl,
  trackingData,
  position = [0, 0, 0],
  scale = 1,
  participantId,
  animationName = 'idle',
  emotionalBlendshapes,
  audioData,
  gender
}) => {
  // Determine gender from avatar URL or explicit prop
  const detectedGender = useMemo(() => {
    if (gender) return gender;
    
    // Check avatar URL for gender hints
    const url = avatarUrl?.toLowerCase() || '';
    if (url.includes('dougie') || url.includes('male') || url.includes('_m_')) {
      return 'male';
    }
    if (url.includes('grace') || url.includes('female') || url.includes('_f_')) {
      return 'female';
    }
    
    // Default to female for backward compatibility
    return 'female';
  }, [avatarUrl, gender]);

  const isCoachAvatar = trackingData === undefined;
  const avatarType = isCoachAvatar ? 'coach' : 'user';
  
  const instanceIdRef = useRef(Math.random().toString(36).substr(2, 9));
  
  useEffect(() => {
    console.log(`[PresenceAvatarWithGender-${instanceIdRef.current}] Mounted:`, {
      avatarType,
      participantId,
      hasTrackingData: !!trackingData,
      avatarUrl,
      detectedGender,
      timestamp: Date.now()
    });
    return () => {
      console.log(`[PresenceAvatarWithGender-${instanceIdRef.current}] Unmounted`);
    };
  }, []);

  const { scene } = useGLTF(avatarUrl || DEFAULT_AVATAR_URL);
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes } = useGraph(clone);

  // Load gender-appropriate animations
  const genderPrefix = detectedGender === 'male' ? 'M' : 'F';
  const idleAnimationUrl = `/animations/${genderPrefix}_Standing_Idle_001.glb`;
  const { animations: idleAnimations } = useGLTF(idleAnimationUrl);

  // Load talking animations based on gender
  const talkingAnimationUrls = [
    `/animations/${genderPrefix}_Talking_Variations_001.glb`,
    `/animations/${genderPrefix}_Talking_Variations_002.glb`,
    `/animations/${genderPrefix}_Talking_Variations_003.glb`,
    `/animations/${genderPrefix}_Talking_Variations_004.glb`,
    `/animations/${genderPrefix}_Talking_Variations_005.glb`,
    `/animations/${genderPrefix}_Talking_Variations_006.glb`
  ];

  // Load all talking animations separately
  const { animations: talking1 } = useGLTF(talkingAnimationUrls[0]);
  const { animations: talking2 } = useGLTF(talkingAnimationUrls[1]);
  const { animations: talking3 } = useGLTF(talkingAnimationUrls[2]);
  const { animations: talking4 } = useGLTF(talkingAnimationUrls[3]);
  const { animations: talking5 } = useGLTF(talkingAnimationUrls[4]);
  const { animations: talking6 } = useGLTF(talkingAnimationUrls[5]);

  // Combine all talking animations
  const talkingAnimations = [...talking1, ...talking2, ...talking3, ...talking4, ...talking5, ...talking6];

  // Preload all animations
  talkingAnimationUrls.forEach(url => useGLTF.preload(url));

  // Combine all animations
  const allAnimations = useMemo(() => {
    const combined = [...idleAnimations, ...talkingAnimations];
    console.log(`[PresenceAvatarWithGender] Loaded ${combined.length} animations for ${detectedGender} avatar`);
    return combined;
  }, [idleAnimations, talkingAnimations, detectedGender]);

  const { actions, mixer } = useAnimations(allAnimations, clone);

  // Track the last talking animation to avoid repeating
  const lastTalkingAnimationRef = useRef<string | null>(null);
  const lastAnimationNameRef = useRef<string>('idle');
  const animationChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) return;
    
    // Debounce animation changes to prevent flickering
    if (animationChangeTimeoutRef.current) {
      clearTimeout(animationChangeTimeoutRef.current);
    }
    
    // Only change animation if it's actually different
    if (lastAnimationNameRef.current === animationName) {
      return;
    }
    
    animationChangeTimeoutRef.current = setTimeout(() => {
      lastAnimationNameRef.current = animationName;
      
      // Stop all animations with fade out
      Object.values(actions).forEach(action => {
        if (action) action.fadeOut(0.3); // Smooth fade out over 0.3 seconds
      });
      
      if (animationName === 'talking') {
        // Find all talking animations
        const talkingAnimations = Object.entries(actions).filter(([name]) => 
          name.toLowerCase().includes('talking') || name.toLowerCase().includes('talk')
        );
        
        if (talkingAnimations.length > 0) {
          console.log('[PresenceAvatarWithGender] Available talking animations:', talkingAnimations);
          
          // If we have multiple talking animations, pick one randomly (but not the same as last time)
          let selectedAnimation;
          if (talkingAnimations.length > 1) {
            let availableAnimations = talkingAnimations.filter(([name]) => name !== lastTalkingAnimationRef.current);
            if (availableAnimations.length === 0) availableAnimations = talkingAnimations;
            
            const randomIndex = Math.floor(Math.random() * availableAnimations.length);
            selectedAnimation = availableAnimations[randomIndex];
          } else {
            selectedAnimation = talkingAnimations[0];
          }
          
          const [animName, action] = selectedAnimation;
          console.log('[PresenceAvatarWithGender] Playing talking animation:', animName);
          lastTalkingAnimationRef.current = animName;
          
          if (action) {
            action.reset();
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.fadeIn(0.3); // Smooth fade in over 0.3 seconds
            action.timeScale = 0.7; // Slow down animation to 70% speed
            action.play();
          }
        }
      } else {
        // Play idle animation
        const idleAnimation = Object.entries(actions).find(([name]) => 
          name.toLowerCase().includes('idle')
        );
        
        if (idleAnimation) {
          const [animName, action] = idleAnimation;
          console.log('[PresenceAvatarWithGender] Playing idle animation:', animName);
          if (action) {
            action.reset();
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.fadeIn(0.3); // Smooth fade in over 0.3 seconds
            action.timeScale = 0.8; // Slow down idle animation to 80% speed
            action.play();
          }
        }
      }
    }, 100);
  }, [animationName, actions]);

  // Find mesh with morph targets
  const meshesWithMorphTargets = useRef<THREE.SkinnedMesh[]>([]);
  const headBone = useRef<THREE.Bone | null>(null);
  const neckBone = useRef<THREE.Bone | null>(null);

  useEffect(() => {
    meshesWithMorphTargets.current = [];
    clone.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.morphTargetDictionary) {
        meshesWithMorphTargets.current.push(child);
        console.log('[PresenceAvatarWithGender] Found mesh with morph targets:', child.name, Object.keys(child.morphTargetDictionary));
      }
      if (child instanceof THREE.Bone) {
        if (child.name.toLowerCase().includes('head')) {
          headBone.current = child;
          console.log('[PresenceAvatarWithGender] Found head bone:', child.name);
        } else if (child.name.toLowerCase().includes('neck')) {
          neckBone.current = child;
          console.log('[PresenceAvatarWithGender] Found neck bone:', child.name);
        }
      }
    });
  }, [clone]);

  // Smooth rotation values
  const smoothedRotation = useRef({ pitch: 0, yaw: 0, roll: 0 });
  const ROTATION_SMOOTHING = 0.1;

  // Audio analysis for lip sync
  const audioAnalyser = useRef<{ volume: number; frequency: number }>({ volume: 0, frequency: 0 });
  const morphTargetsDebuggedRef = useRef(false);
  const frameCount = useRef(0);
  
  useFrame(() => {
    if (meshesWithMorphTargets.current.length === 0) return;

    // Analyze audio data in the render loop for real-time lip sync
    if (audioData && audioData.length > 0) {
      // Simple audio analysis
      let sum = 0;
      let max = 0;
      for (let i = 0; i < audioData.length; i++) {
        sum += audioData[i];
        max = Math.max(max, audioData[i]);
      }
      audioAnalyser.current.volume = sum / audioData.length / 255;
      audioAnalyser.current.frequency = max / 255;
      
      // Log every 60 frames (about once per second)
      if (frameCount.current % 60 === 0) {
        console.log('[PresenceAvatarWithGender] Audio data:', {
          hasAudioData: true,
          dataLength: audioData.length,
          volume: audioAnalyser.current.volume,
          frequency: audioAnalyser.current.frequency,
          max: max,
          sum: sum,
          participantId,
          isCoachAvatar
        });
      }
    } else {
      audioAnalyser.current.volume = 0;
      audioAnalyser.current.frequency = 0;
    }

    frameCount.current++;

    // Debug log morph targets once
    if (!morphTargetsDebuggedRef.current) {
      console.log('[PresenceAvatarWithGender] Morph targets found:', 
        meshesWithMorphTargets.current.map(mesh => ({
          name: mesh.name,
          morphTargets: Object.keys(mesh.morphTargetDictionary || {})
        }))
      );
      morphTargetsDebuggedRef.current = true;
    }

    // Apply emotional blendshapes from Hume EVI
    if (emotionalBlendshapes) {
      meshesWithMorphTargets.current.forEach(mesh => {
        if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;

        Object.entries(emotionalBlendshapes).forEach(([emotion, value]) => {
          const blendshapes = EMOTION_TO_BLENDSHAPE[emotion];
          if (blendshapes) {
            blendshapes.forEach(blendshape => {
              const mapping = HUME_TO_RPM_MAPPING[blendshape];
              if (mapping && mesh.morphTargetDictionary) {
                const morphIndex = mesh.morphTargetDictionary[mapping.target];
                if (morphIndex !== undefined && mesh.morphTargetInfluences) {
                  const amplifiedValue = value * (mapping.amplify || 1.0);
                  mesh.morphTargetInfluences[morphIndex] = MathUtils.clamp(amplifiedValue, 0, 1);
                }
              }
            });
          }
        });
      });
    }

    // Apply lip sync from audio data
    if (audioData && audioData.length > 0) {
      // Log audio analysis values periodically
      if (Math.random() < 0.01) { // Log ~1% of frames
        console.log('[PresenceAvatarWithGender] Audio analysis:', {
          volume: audioAnalyser.current.volume,
          frequency: audioAnalyser.current.frequency,
          audioDataLength: audioData.length,
          isCoachAvatar,
          gender: detectedGender
        });
      }

      meshesWithMorphTargets.current.forEach(mesh => {
        if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;

        // Try multiple possible jaw/mouth morph targets including RPM numbered targets
        const possibleJawTargets = ['mouthOpen', 'jawOpen', 'viseme_aa', 'viseme_O', '0', '1'];
        let jawTargetFound = false;
        
        for (const target of possibleJawTargets) {
          if (mesh.morphTargetDictionary[target] !== undefined) {
            const targetValue = audioAnalyser.current.volume * 0.8;
            const morphIndex = mesh.morphTargetDictionary[target];
            const currentValue = mesh.morphTargetInfluences[morphIndex];
            mesh.morphTargetInfluences[morphIndex] = lerp(currentValue, targetValue, 0.3);
            
            // Log when we apply lip sync
            if (Math.random() < 0.01 && targetValue > 0.01) { // Log when there's actual movement
              console.log(`[PresenceAvatarWithGender] Applied lip sync to ${target}:`, {
                targetValue,
                currentValue,
                morphIndex,
                meshName: mesh.name
              });
            }
            
            // For RPM avatars with numbered targets, apply to secondary target
            if (target === '0' && mesh.morphTargetDictionary['1'] !== undefined) {
              const secondaryIndex = mesh.morphTargetDictionary['1'];
              const secondaryValue = audioAnalyser.current.volume * 0.4;
              mesh.morphTargetInfluences[secondaryIndex] = lerp(
                mesh.morphTargetInfluences[secondaryIndex],
                secondaryValue,
                0.3
              );
            }
            
            jawTargetFound = true;
            break;
          }
        }
        
        // Log warning if no jaw target found (only once)
        if (!jawTargetFound && !morphTargetsDebuggedRef.current) {
          console.warn('[PresenceAvatarWithGender] No jaw/mouth morph target found! Available targets:', Object.keys(mesh.morphTargetDictionary));
          morphTargetsDebuggedRef.current = true;
        }

        // Map frequency to mouth shape (for non-RPM avatars)
        const mouthSmileLeftIndex = mesh.morphTargetDictionary['mouthSmileLeft'];
        const mouthSmileRightIndex = mesh.morphTargetDictionary['mouthSmileRight'];
        if (mouthSmileLeftIndex !== undefined && mouthSmileRightIndex !== undefined) {
          const smileValue = audioAnalyser.current.frequency * 0.3;
          mesh.morphTargetInfluences[mouthSmileLeftIndex] = lerp(
            mesh.morphTargetInfluences[mouthSmileLeftIndex],
            smileValue,
            0.2
          );
          mesh.morphTargetInfluences[mouthSmileRightIndex] = lerp(
            mesh.morphTargetInfluences[mouthSmileRightIndex],
            smileValue,
            0.2
          );
        }
      });
    }

    // Apply face tracking data (for user avatars)
    if (trackingData && trackingData.rotation) {
      const { pitch, yaw, roll } = trackingData.rotation;

      // Smooth the rotation values
      smoothedRotation.current.pitch = lerp(
        smoothedRotation.current.pitch,
        clampRotation(pitch, HEAD_ROTATION_LIMITS.pitch),
        ROTATION_SMOOTHING
      );
      smoothedRotation.current.yaw = lerp(
        smoothedRotation.current.yaw,
        clampRotation(yaw, HEAD_ROTATION_LIMITS.yaw),
        ROTATION_SMOOTHING
      );
      smoothedRotation.current.roll = lerp(
        smoothedRotation.current.roll,
        clampRotation(roll, HEAD_ROTATION_LIMITS.roll),
        ROTATION_SMOOTHING
      );

      // Apply rotation to neck and head bones
      if (neckBone.current) {
        tempEuler.set(
          smoothedRotation.current.pitch * NECK_ROTATION_FACTOR.pitch.neck,
          smoothedRotation.current.yaw * NECK_ROTATION_FACTOR.yaw.neck,
          smoothedRotation.current.roll * NECK_ROTATION_FACTOR.roll.neck,
          'XYZ'
        );
        neckBone.current.quaternion.setFromEuler(tempEuler);
      }

      if (headBone.current) {
        tempEuler.set(
          smoothedRotation.current.pitch * NECK_ROTATION_FACTOR.pitch.head,
          smoothedRotation.current.yaw * NECK_ROTATION_FACTOR.yaw.head,
          smoothedRotation.current.roll * NECK_ROTATION_FACTOR.roll.head,
          'XYZ'
        );
        headBone.current.quaternion.setFromEuler(tempEuler);
      }

      // Apply facial expressions from tracking data
      if (trackingData.expressions) {
        meshesWithMorphTargets.current.forEach(mesh => {
          if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;

          Object.entries(trackingData.expressions!).forEach(([expression, value]) => {
            const morphIndex = mesh.morphTargetDictionary![expression];
            if (morphIndex !== undefined) {
              mesh.morphTargetInfluences![morphIndex] = value;
            }
          });
        });
      }
    }
  });

  // Convert position prop to proper Vector3 format
  const positionVector = Array.isArray(position) && position.length === 3 
    ? position as [number, number, number]
    : [0, 0, 0] as [number, number, number];

  return (
    <group position={positionVector} scale={scale}>
      <primitive object={clone} />
    </group>
  );
});

PresenceAvatarWithGender.displayName = 'PresenceAvatarWithGender';

// Preload common avatar URLs
[
  '/avatars/coach_grace.glb',
  '/avatars/Dougie.glb',
  '/animations/M_Standing_Idle_001.glb',
  '/animations/F_Standing_Idle_001.glb'
].forEach(url => {
  useGLTF.preload(url);
});
