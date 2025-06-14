import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useGraph } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import { MathUtils } from 'three';
import type { TrackingData, FacialExpressions } from '../types/tracking';

const DEFAULT_AVATAR_URL = '/avatars/dougie.glb';

interface MasculinePresenceAvatarProps {
  avatarUrl?: string;
  position?: [number, number, number] | THREE.Vector3;
  scale?: number; 
  trackingData?: TrackingData;
  animationName?: string;
  emotionalBlendshapes?: Record<string, number>;
  audioData?: Uint8Array;
  participantId?: string;
}

// Copy the same mapping from PresenceAvatar
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

// Emotion to blendshape mapping (same as coaches)
const EMOTION_TO_BLENDSHAPE: Record<string, string[]> = {
  joy: ['mouthSmileLeft', 'mouthSmileRight', 'cheekSquintLeft', 'cheekSquintRight'],
  sadness: ['mouthFrownLeft', 'mouthFrownRight', 'browDownLeft', 'browDownRight'],
  anger: ['browDownLeft', 'browDownRight', 'noseSneerLeft', 'noseSneerRight'],
  fear: ['eyeWideLeft', 'eyeWideRight', 'browInnerUp', 'mouthOpen'],
  surprise: ['eyeWideLeft', 'eyeWideRight', 'browOuterUpLeft', 'browOuterUpRight', 'mouthOpen'],
  disgust: ['noseSneerLeft', 'noseSneerRight', 'mouthFrownLeft', 'mouthFrownRight'],
  contempt: ['mouthLeft', 'mouthRight', 'eyeSquintLeft', 'eyeSquintRight']
};

// Helper functions
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

const ANIMATION_PATHS = {
  idle: [
    '/animations/M_Standing_Idle_001.glb',
    '/animations/M_Standing_Idle_002.glb',
    '/animations/M_Standing_Idle_Variations_001.glb',
    '/animations/M_Standing_Idle_Variations_002.glb',
    '/animations/M_Standing_Idle_Variations_003.glb',
    '/animations/M_Standing_Idle_Variations_004.glb',
    '/animations/M_Standing_Idle_Variations_005.glb',
    '/animations/M_Standing_Idle_Variations_006.glb',
    '/animations/M_Standing_Idle_Variations_007.glb',
    '/animations/M_Standing_Idle_Variations_008.glb',
    '/animations/M_Standing_Idle_Variations_009.glb',
    '/animations/M_Standing_Idle_Variations_010.glb'
  ],
  talking: [
    '/animations/M_Talking_Variations_001.glb',
    '/animations/M_Talking_Variations_002.glb',
    '/animations/M_Talking_Variations_003.glb',
    '/animations/M_Talking_Variations_004.glb',
    '/animations/M_Talking_Variations_005.glb',
    '/animations/M_Talking_Variations_006.glb',
    '/animations/M_Talking_Variations_007.glb',
    '/animations/M_Talking_Variations_008.glb',
    '/animations/M_Talking_Variations_009.glb',
    '/animations/M_Talking_Variations_010.glb'
  ]
};

export const MasculinePresenceAvatar: React.FC<MasculinePresenceAvatarProps> = ({
  avatarUrl,
  position = [0, 0, 0],
  scale = 1,
  trackingData,
  animationName = 'idle',
  emotionalBlendshapes,
  audioData,
  participantId = 'unnamed'
}) => {
  const isCoachAvatar = trackingData === undefined;
  const avatarType = isCoachAvatar ? 'coach' : 'user';
  
  const hasEmotionalBlendshapes = emotionalBlendshapes && Object.keys(emotionalBlendshapes).length > 0;
  
  const groupRef = useRef<THREE.Group>(null!);
  const modelRootRef = useRef<THREE.Object3D | null>(null);
  const meshWithMorphTargets = useRef<THREE.Mesh | null>(null);
  const headBone = useRef<THREE.Bone | null>(null);
  const neckBone = useRef<THREE.Bone | null>(null);
  const jawBone = useRef<THREE.Bone | null>(null);
  const initialHeadLocalQuaternionRef = useRef<THREE.Quaternion | null>(null);
  const initialNeckLocalQuaternionRef = useRef<THREE.Quaternion | null>(null);
  const trackingDataRef = useRef<TrackingData | null>(null);
  const frameCountRef = useRef(0);
  const lastDebugLogRef = useRef<number>(0);
  const morphTargetMapping = useRef<{ logged?: boolean }>({});
  const currentInfluences = useRef<Record<string, number>>({});
  const morphTargetsLoggedRef = useRef(false);
  
  const { scene } = useGLTF(avatarUrl || DEFAULT_AVATAR_URL);
  
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    const cloned = SkeletonUtils.clone(scene);
    return cloned;
  }, [scene]);

  // Load masculine idle animation
  const { animations: idleAnimations = [] } = useGLTF(ANIMATION_PATHS.idle[0]);
  
  // Load talking animations individually (React hooks must be called at top level)
  const { animations: talk1 = [] } = useGLTF(ANIMATION_PATHS.talking[0]);
  const { animations: talk2 = [] } = useGLTF(ANIMATION_PATHS.talking[1]);
  const { animations: talk3 = [] } = useGLTF(ANIMATION_PATHS.talking[2]);
  const { animations: talk4 = [] } = useGLTF(ANIMATION_PATHS.talking[3]);
  const { animations: talk5 = [] } = useGLTF(ANIMATION_PATHS.talking[4]);
  const { animations: talk6 = [] } = useGLTF(ANIMATION_PATHS.talking[5]);
  const { animations: talk7 = [] } = useGLTF(ANIMATION_PATHS.talking[6]);
  const { animations: talk8 = [] } = useGLTF(ANIMATION_PATHS.talking[7]);
  const { animations: talk9 = [] } = useGLTF(ANIMATION_PATHS.talking[8]);
  const { animations: talk10 = [] } = useGLTF(ANIMATION_PATHS.talking[9]);

  // Combine all talking animations
  const allTalkingAnimations = useMemo(() => {
    return [...talk1, ...talk2, ...talk3, ...talk4, ...talk5, ...talk6, ...talk7, ...talk8, ...talk9, ...talk10];
  }, [talk1, talk2, talk3, talk4, talk5, talk6, talk7, talk8, talk9, talk10]);
  
  // Combine all animations
  const allAnimations = useMemo(() => {
    return [...idleAnimations, ...allTalkingAnimations];
  }, [idleAnimations, allTalkingAnimations]);
  
  // Preload all animations
  useEffect(() => {
    ANIMATION_PATHS.idle.forEach(url => useGLTF.preload(url));
    ANIMATION_PATHS.talking.forEach(url => useGLTF.preload(url));
  }, []);
  
  const { actions, mixer } = useAnimations(allAnimations, clonedScene || groupRef);
  
  const activeActionNameRef = useRef<string | null>(null);
  const lastTalkingAnimationRef = useRef<string | null>(null);
  
  // Animation management
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) {
      console.log('[MasculinePresenceAvatar] No animation actions available to play.');
      return;
    }

    const playAnimation = (name: string) => {
      const oldActionName = activeActionNameRef.current;
      
      if (oldActionName === name && actions[name]?.isRunning()) {
        return;
      }

      // Handle talking animations - pick a random one
      let actualAnimationName = name;
      if (name === 'talking') {
        const talkingActions = Object.keys(actions).filter(key => 
          key.toLowerCase().includes('talk') || key.toLowerCase().includes('talking')
        );
        
        if (talkingActions.length > 0) {
          actualAnimationName = talkingActions[Math.floor(Math.random() * talkingActions.length)];
          lastTalkingAnimationRef.current = actualAnimationName;
        } else if (lastTalkingAnimationRef.current && actions[lastTalkingAnimationRef.current]) {
          actualAnimationName = lastTalkingAnimationRef.current;
        }
      } else if (name === 'idle') {
        const idleActions = Object.keys(actions).filter(key => 
          key.toLowerCase().includes('idle')
        );
        
        if (idleActions.length > 0) {
          actualAnimationName = idleActions[0];
        }
      }

      const selectedAction = actions[actualAnimationName];
      if (!selectedAction) {
        console.warn(`[MasculinePresenceAvatar] Animation "${actualAnimationName}" not found`);
        return;
      }

      // Fade out old animation
      if (oldActionName && actions[oldActionName]) {
        actions[oldActionName].fadeOut(0.3);
        setTimeout(() => {
          actions[oldActionName]?.stop();
        }, 300);
      }

      // Play new animation
      selectedAction.reset();
      selectedAction.fadeIn(0.5);
      selectedAction.timeScale = 0.5; // Slow down animation to 50% speed
      selectedAction.play();
      
      console.log('[MasculinePresenceAvatar] Playing animation:', actualAnimationName, 'timeScale:', selectedAction.timeScale);
      activeActionNameRef.current = actualAnimationName;
    };

    playAnimation(animationName);
  }, [animationName, actions]);

  // Setup model
  useEffect(() => {
    if (!clonedScene) return;

    console.log('[MasculinePresenceAvatar] Setting up model...');
    
    let mesh: THREE.SkinnedMesh | null = null;
    let meshCount = 0;
    clonedScene?.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh) {
        meshCount++;
        console.log('[MasculinePresenceAvatar] Found SkinnedMesh:', {
          name: child.name,
          hasMorphTargetDictionary: !!child.morphTargetDictionary,
          morphTargetCount: child.morphTargetDictionary ? Object.keys(child.morphTargetDictionary).length : 0,
          morphTargets: child.morphTargetDictionary ? Object.keys(child.morphTargetDictionary).slice(0, 5) : []
        });
        
        if (child.morphTargetDictionary) {
          mesh = child;
          meshWithMorphTargets.current = child;
          // Force enable morph target influences
          if (mesh.morphTargetInfluences) {
            mesh.morphTargetInfluences = mesh.morphTargetInfluences.map(() => 0);
          }
          if (!morphTargetsLoggedRef.current) {
            console.log('[MasculinePresenceAvatar] Available morph targets:', Object.keys(child.morphTargetDictionary));
            morphTargetsLoggedRef.current = true;
          }
        }
      } else if (child instanceof THREE.Bone) {
        const boneName = child.name.toLowerCase();
        if (boneName.includes('head') && !boneName.includes('headtop')) {
          headBone.current = child;
          initialHeadLocalQuaternionRef.current = child.quaternion.clone();
        } else if (boneName.includes('neck')) {
          neckBone.current = child;
          initialNeckLocalQuaternionRef.current = child.quaternion.clone();
        } else if (boneName.includes('jaw')) {
          jawBone.current = child;
        }
      }
    });
    
    modelRootRef.current = clonedScene;
    
    console.log('[MasculinePresenceAvatar] Model setup complete', {
      hasMorphTargets: !!mesh,
      hasHeadBone: !!headBone.current,
      hasNeckBone: !!neckBone.current,
      meshCount
    });
  }, [clonedScene]);

  // Process tracking data
  const processedTrackingData = useMemo(() => {
    if (!trackingData || trackingData === undefined) {
      return null;
    }
    
    let expressions: Partial<FacialExpressions> = {};
    let headRotation = null;
    
    if (trackingData.facialExpressions) {
      expressions = trackingData.facialExpressions;
    }
    
    if (trackingData.headRotation && 
        typeof trackingData.headRotation === 'object' &&
        'pitch' in trackingData.headRotation) {
      headRotation = trackingData.headRotation;
    }
    
    return {
      facialExpressions: expressions,
      headRotation: headRotation
    };
  }, [trackingData]);

  // Animation frame
  useFrame((state, delta) => {
    if (!modelRootRef.current) return;

    const currentFrameCount = state.clock.elapsedTime * 60;
    frameCountRef.current = Math.floor(currentFrameCount);
    
    const tracking = processedTrackingData;
    const mesh = meshWithMorphTargets.current;
    
    // Lip sync from audio
    if (animationName === 'talking' && audioData && audioData.length > 0) {
      // Debug log mesh state
      if (frameCountRef.current % 30 === 0) {
        console.log('[MasculinePresenceAvatar] Lip sync check:', {
          hasMesh: !!mesh,
          hasMorphTargetDictionary: !!mesh?.morphTargetDictionary,
          morphTargetCount: mesh?.morphTargetDictionary ? Object.keys(mesh.morphTargetDictionary).length : 0,
          morphTargets: mesh?.morphTargetDictionary ? Object.keys(mesh.morphTargetDictionary).slice(0, 10) : [],
          audioDataLength: audioData.length,
          animationName
        });
      }
      
      if (mesh?.morphTargetDictionary) {
        let totalEnergy = 0;
        const relevantBins = Math.min(64, audioData.length);
        let maxEnergy = 0;
        
        for (let i = 0; i < relevantBins; i++) {
          // Weight speech frequencies more heavily (100-1000 Hz range typically bins 2-20)
          let weight = 1.0;
          if (i >= 2 && i <= 20) {
            weight = 2.0; // Double weight for speech frequencies
          }
          const binEnergy = audioData[i] * weight;
          totalEnergy += binEnergy;
          maxEnergy = Math.max(maxEnergy, audioData[i]);
        }
        
        // Use both average and peak energy for more responsive lip sync
        const averageEnergy = relevantBins > 0 ? totalEnergy / relevantBins / 255 : 0;
        const peakEnergy = maxEnergy / 255;
        const combinedEnergy = Math.max(averageEnergy, peakEnergy * 0.7);
        
        // Log morph targets once
        if (frameCountRef.current === 0) {
          console.log('[MasculinePresenceAvatar] Available morph targets:', Object.keys(mesh.morphTargetDictionary));
        }
        
        // Try multiple possible jaw/mouth morph targets (including numbered ones for Dougie)
        const possibleJawTargets = ['jawOpen', 'mouthOpen', 'viseme_aa', 'viseme_O', '0', '1'];
        let jawTargetFound = false;
        
        for (const target of possibleJawTargets) {
          if (mesh.morphTargetDictionary[target] !== undefined) {
            // Reduced multiplier for more natural mouth movement
            const lipSyncValue = MathUtils.clamp(combinedEnergy * 2.0, 0, 0.4);
            
            // Force set the value directly to ensure it's not overridden
            const morphIndex = mesh.morphTargetDictionary[target];
            if (mesh.morphTargetInfluences && morphIndex !== undefined) {
              mesh.morphTargetInfluences[morphIndex] = lipSyncValue;
            }
            
            // For numbered targets, try to apply to both if they exist (one might be jaw, one might be tongue)
            if (target === '0' && mesh.morphTargetDictionary['1'] !== undefined) {
              const secondIndex = mesh.morphTargetDictionary['1'];
              if (mesh.morphTargetInfluences && secondIndex !== undefined) {
                mesh.morphTargetInfluences[secondIndex] = lipSyncValue * 0.5;
              }
            }
            
            // Debug lip sync every 30 frames
            if (frameCountRef.current % 30 === 0 && combinedEnergy > 0) {
              console.log('[MasculinePresenceAvatar] Lip sync applied:', {
                target,
                averageEnergy,
                peakEnergy,
                combinedEnergy,
                lipSyncValue,
                morphIndex,
                totalEnergy,
                maxEnergy,
                audioDataLength: audioData.length,
                audioDataSample: Array.from(audioData.slice(0, 10))
              });
            }
            jawTargetFound = true;
            break;
          }
        }
        
        if (!jawTargetFound && frameCountRef.current % 300 === 0) {
          console.warn('[MasculinePresenceAvatar] No jaw/mouth morph target found! Available targets:', Object.keys(mesh.morphTargetDictionary));
        }
      }
    } else if (animationName === 'idle' && mesh?.morphTargetInfluences && mesh?.morphTargetDictionary) {
      // Reset all morph targets when idle
      Object.keys(mesh.morphTargetDictionary).forEach((targetName) => {
        const targetIndex = mesh.morphTargetDictionary![targetName];
        if (targetIndex !== undefined && mesh.morphTargetInfluences) {
          mesh.morphTargetInfluences[targetIndex] = 0;
        }
      });
    }
    
    // Apply emotional blendshapes
    if (hasEmotionalBlendshapes && mesh?.morphTargetDictionary) {
      // Log mesh info every 60 frames
      if (frameCountRef.current % 60 === 0) {
        console.log('[MasculinePresenceAvatar] Mesh info:', {
          hasMesh: !!mesh,
          morphTargetDictionary: Object.keys(mesh.morphTargetDictionary || {}),
          morphTargetInfluences: mesh.morphTargetInfluences?.length || 0
        });
      }
      
      Object.entries(emotionalBlendshapes!).forEach(([emotion, value]) => {
        const blendshapes = EMOTION_TO_BLENDSHAPE[emotion];
        if (blendshapes) {
          blendshapes.forEach(blendshape => {
            const mapping = HUME_TO_RPM_MAPPING[blendshape];
            if (mapping && mesh.morphTargetDictionary![mapping.target] !== undefined) {
              const targetIndex = mesh.morphTargetDictionary![mapping.target];
              const amplifiedValue = value * (mapping.amplify || 1.0);
              
              if (mesh.morphTargetInfluences) {
                mesh.morphTargetInfluences[targetIndex] = MathUtils.clamp(amplifiedValue, 0, 1);
                
                // Log when we set a significant morph target
                if (amplifiedValue > 0.1 && frameCountRef.current % 60 === 0) {
                  console.log('[MasculinePresenceAvatar] Setting morph:', {
                    emotion,
                    blendshape,
                    targetName: mapping.target,
                    targetIndex,
                    value: amplifiedValue
                  });
                }
              }
            } else if (value > 0.1 && frameCountRef.current % 60 === 0) {
              // Log missing morph targets
              console.warn('[MasculinePresenceAvatar] Missing morph target:', {
                emotion,
                blendshape,
                attemptedTarget: mapping?.target,
                available: Object.keys(mesh.morphTargetDictionary || {}).slice(0, 10)
              });
            }
          });
        }
      });
    } else if (tracking?.facialExpressions && mesh?.morphTargetDictionary) {
      // Apply ML5 tracking expressions
      Object.entries(tracking.facialExpressions).forEach(([expression, value]) => {
        if (mesh.morphTargetDictionary![expression] !== undefined) {
          const targetIndex = mesh.morphTargetDictionary![expression];
          if (mesh.morphTargetInfluences) {
            mesh.morphTargetInfluences[targetIndex] = MathUtils.clamp(value, 0, 1);
          }
        }
      });
    }
    
    // Apply head rotation for user avatars
    if (tracking?.headRotation && headBone.current && !isCoachAvatar) {
      const headRotation = tracking.headRotation;
      
      if (headRotation && typeof headRotation === 'object') {
        const rotationLerpFactor = 0.8;
        
        headBone.current.rotation.x = lerp(
          headBone.current.rotation.x,
          clampRotation(-headRotation.pitch * 0.5, { min: -0.5, max: 0.5 }),
          rotationLerpFactor
        );
        
        headBone.current.rotation.y = lerp(
          headBone.current.rotation.y,
          clampRotation(headRotation.yaw * 0.5, { min: -0.7, max: 0.7 }),
          rotationLerpFactor
        );
        
        headBone.current.rotation.z = lerp(
          headBone.current.rotation.z,
          clampRotation(-headRotation.roll * 0.3, { min: -0.3, max: 0.3 }),
          rotationLerpFactor
        );
      }
    }
    
    // Mix animations
    if (mixer) {
      mixer.update(delta);
    }
    
    // Find the SkinnedMesh with morph targets if we don't have it yet
    if (!meshWithMorphTargets.current && clonedScene) {
      clonedScene.traverse((child) => {
        if (child instanceof THREE.SkinnedMesh && child.morphTargetDictionary) {
          meshWithMorphTargets.current = child;
          console.log('[MasculinePresenceAvatar] Found mesh with morph targets in frame');
        }
      });
    }
    
    // Rest of the code remains the same
  });

  if (!clonedScene || !modelRootRef.current) {
    return null;
  }

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <primitive object={modelRootRef.current} />
    </group>
  );
};

export default MasculinePresenceAvatar;
