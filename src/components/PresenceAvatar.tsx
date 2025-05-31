// Enhanced Avatar with Physical Presence
// Creates realistic presence through subtle movements and reactions

import React, { useRef, useMemo, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { TrackingData } from '../types/tracking';

// Define types locally since types/core might not exist
interface EmotionalState {
  type: 'happy' | 'flirty' | 'confident' | 'nervous' | 'excited' | 'interested' | 'neutral';
}

interface PartnerState {
  engagement: number;
  responseReady: boolean;
  isSpeaking?: boolean;
}

interface PresenceAvatarProps {
  avatarUrl?: string;
  idleAnimationUrl?: string;
  talkAnimationUrl?: string;
  position?: [number, number, number];
  scale?: number;
  emotionalState?: string;
  partnerState?: PartnerState;
  trackingData?: TrackingData;
  debugMode?: boolean;
  isUser?: boolean;
  cameraPosition?: [number, number, number];
  cameraTarget?: [number, number, number];
}

const PresenceAvatar: React.FC<PresenceAvatarProps> = ({
  avatarUrl = '/avatars/AngelChick.glb',
  idleAnimationUrl = '/animations/M_Standing_Idle_001.glb',
  talkAnimationUrl = '/animations/M_Talking_Variations_001.glb',
  position = [0, 0, 0],
  scale = 1,
  emotionalState = 'neutral',
  partnerState,
  trackingData,
  debugMode = false,
  isUser = false,
  cameraPosition,
  cameraTarget
}) => {
  const group = useRef<THREE.Group>(null);
  const currentAction = useRef<THREE.AnimationAction | null>(null);
  const hasLoggedMorphTargets = useRef(false);
  const hasAppliedFix = useRef(false);
  
  // Load avatar
  const { scene } = useGLTF(avatarUrl);
  
  // Clone scene to avoid conflicts
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  
  // Find and fix T-pose for RPM avatars
  useEffect(() => {
    if (!hasAppliedFix.current) {
      console.log('🔧 Applying T-pose fix for PresenceAvatar');
      console.log('Avatar URL:', avatarUrl);
      
      // Debug bone structure
      let foundBones = false;
      let boneNames: string[] = [];
      
      clonedScene.traverse((node: THREE.Object3D) => {
        if ((node as THREE.SkinnedMesh).isSkinnedMesh) {
          const skinnedMesh = node as THREE.SkinnedMesh;
          if (skinnedMesh.skeleton) {
            foundBones = true;
            console.log('Found skeleton with', skinnedMesh.skeleton.bones.length, 'bones');
            
            // Log all bone names
            skinnedMesh.skeleton.bones.forEach((bone, index) => {
              boneNames.push(bone.name);
              if (index < 20) { // Log first 20 bones
                console.log(`Bone ${index}: ${bone.name}`);
              }
            });
            
            // Check for RPM-specific bone names
            const isRPM = boneNames.some(name => 
              name.includes('mixamorig') || 
              name.includes('Hips') || 
              name.includes('Spine')
            );
            
            console.log('Is RPM avatar?', isRPM);
            console.log('Has LeftArm?', boneNames.includes('LeftArm'));
            console.log('Has mixamorig:LeftArm?', boneNames.includes('mixamorig:LeftArm'));
            
            // Fix T-pose for RPM avatars
            skinnedMesh.skeleton.bones.forEach((bone) => {
              const boneName = bone.name;
              
              // Try both standard and mixamo naming
              if (boneName === 'LeftArm' || boneName === 'mixamorig:LeftArm') {
                bone.rotation.x = 0.3;
                bone.rotation.z = 0.8;
                bone.updateMatrixWorld(true);
                console.log('Fixed left arm:', boneName);
              }
              
              if (boneName === 'RightArm' || boneName === 'mixamorig:RightArm') {
                bone.rotation.x = 0.3;
                bone.rotation.z = -0.8;
                bone.updateMatrixWorld(true);
                console.log('Fixed right arm:', boneName);
              }
              
              // Fix shoulders
              if (boneName === 'LeftShoulder' || boneName === 'mixamorig:LeftShoulder') {
                bone.rotation.z = 0.1;
                bone.updateMatrixWorld(true);
                console.log('Fixed left shoulder:', boneName);
              }
              
              if (boneName === 'RightShoulder' || boneName === 'mixamorig:RightShoulder') {
                bone.rotation.z = -0.1;
                bone.updateMatrixWorld(true);
                console.log('Fixed right shoulder:', boneName);
              }
            });
            
            hasAppliedFix.current = true;
            console.log('✅ T-pose fix applied');
          }
        }
      });
      
      if (!foundBones) {
        console.warn('⚠️ No skeleton found in avatar!');
      }
    }
  }, [clonedScene, avatarUrl]);
  
  // Load animations separately and create a combined animations array
  const idleGLTF = useGLTF(idleAnimationUrl);
  const talkGLTF = useGLTF(talkAnimationUrl);
  
  // Combine animations and rename them for clarity
  const animations = useMemo(() => {
    const anims = [];
    if (idleGLTF.animations && idleGLTF.animations.length > 0) {
      const idleAnim = idleGLTF.animations[0].clone();
      idleAnim.name = 'idle';
      anims.push(idleAnim);
    }
    if (talkGLTF.animations && talkGLTF.animations.length > 0) {
      const talkAnim = talkGLTF.animations[0].clone();
      talkAnim.name = 'talk';
      anims.push(talkAnim);
    }
    return anims;
  }, [idleGLTF.animations, talkGLTF.animations]);
  
  // Setup animations with the cloned scene
  const { actions, mixer } = useAnimations(animations, clonedScene);
  
  // Debug animation setup
  useEffect(() => {
    console.log('=== ANIMATION DEBUG ===');
    console.log('Avatar:', avatarUrl);
    console.log('Idle animation:', idleAnimationUrl);
    console.log('Talk animation:', talkAnimationUrl);
    console.log('Number of animations loaded:', animations.length);
    console.log('Animation names:', animations.map(a => a.name));
    console.log('Actions available:', actions ? Object.keys(actions) : 'none');
    console.log('Mixer:', mixer ? 'created' : 'not created');
    console.log('Group ref:', group.current ? 'exists' : 'null');
  }, [avatarUrl, idleAnimationUrl, talkAnimationUrl, animations, actions, mixer]);
  
  // Initialize with idle animation
  useEffect(() => {
    if (!actions || !mixer) return;
    
    // Small delay to ensure everything is loaded
    const timer = setTimeout(() => {
      console.log('=== PRESENCE AVATAR ANIMATION INIT ===');
      console.log('Available actions:', Object.keys(actions));
      
      // Stop all current actions first
      Object.values(actions).forEach(action => {
        if (action) {
          action.stop();
        }
      });
      
      const idleAction = actions['idle'];
      if (idleAction) {
        // Reset and start idle immediately
        idleAction.reset();
        idleAction.setEffectiveWeight(1);
        idleAction.setEffectiveTimeScale(1);
        idleAction.play();
        currentAction.current = idleAction;
        console.log('✅ Started idle animation immediately');
        
        // Force an initial update
        mixer.update(0);
      } else {
        console.error('❌ No idle animation found!');
      }
    }, 100); // 100ms delay
    
    return () => {
      clearTimeout(timer);
      // Cleanup
      if (currentAction.current) {
        currentAction.current.stop();
      }
    };
  }, [actions, mixer, avatarUrl]); // Added avatarUrl as dependency to reinit on avatar change
  
  // Handle speaking state changes
  useEffect(() => {
    if (!actions || !partnerState) return;
    
    const targetAction = partnerState.isSpeaking ? actions['talk'] : actions['idle'];
    
    if (targetAction && currentAction.current !== targetAction) {
      // Fade between animations
      const fadeTime = 0.5;
      
      if (currentAction.current) {
        currentAction.current.fadeOut(fadeTime);
      }
      
      targetAction
        .reset()
        .setEffectiveTimeScale(1)
        .setEffectiveWeight(1)
        .fadeIn(fadeTime)
        .play();
      
      currentAction.current = targetAction;
      
      console.log(`Switched to ${partnerState.isSpeaking ? 'talk' : 'idle'} animation`);
    }
  }, [partnerState?.isSpeaking, actions]);
  
  // Update animation mixer
  useFrame((state, delta) => {
    if (mixer) {
      mixer.update(delta);
      
      // Log animation state once
      if (!hasLoggedMorphTargets.current && currentAction.current) {
        console.log('Animation playing:', currentAction.current.isRunning());
        console.log('Animation time:', currentAction.current.time);
        console.log('Animation weight:', currentAction.current.weight);
        console.log('Animation effective weight:', currentAction.current.getEffectiveWeight());
        console.log('Mixer time:', mixer.time);
      }
    }
  });
  
  // Apply facial expressions via morph targets
  useEffect(() => {
    console.log('=== Morph Target Effect Running ===');
    console.log('trackingData exists:', !!trackingData);
    console.log('trackingData.facialExpressions:', trackingData?.facialExpressions);
    console.log('clonedScene exists:', !!clonedScene);
    
    if (!trackingData?.facialExpressions || !clonedScene) {
      console.log('Early return - missing data');
      return;
    }
    
    // Find the skinned mesh with morph targets
    let mesh: any = null;
    let meshCount = 0;
    clonedScene.traverse((child: any) => {
      if (child.isSkinnedMesh) {
        meshCount++;
        console.log(`Found skinned mesh ${meshCount}:`, child.name);
        console.log('Has morphTargetDictionary:', !!child.morphTargetDictionary);
        console.log('Has morphTargetInfluences:', !!child.morphTargetInfluences);
        
        if (child.morphTargetDictionary) {
          mesh = child;
          console.log('Using this mesh for morph targets');
        }
      }
    });
    
    if (!mesh) {
      console.log('No suitable mesh found');
      return;
    }
    
    if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) {
      console.log('Mesh missing required properties');
      return;
    }
    
    // Log available morph targets once
    if (!hasLoggedMorphTargets.current) {
      console.log('=== MORPH TARGETS AVAILABLE ===');
      console.log('Mesh name:', mesh.name);
      console.log('Morph targets:', Object.keys(mesh.morphTargetDictionary));
      console.log('Total count:', Object.keys(mesh.morphTargetDictionary).length);
      hasLoggedMorphTargets.current = true;
    }
    
    // Map tracking data to ARKit blendshapes with multiple possible names
    const expressionMappings: Record<string, string[]> = {
      // Mouth movements
      mouthOpen: ['jawOpen', 'mouthOpen', 'JawOpen', 'MouthOpen'],
      
      // Eye movements
      eyeBlinkLeft: ['eyeBlinkLeft', 'eyeBlink_L', 'EyeBlinkLeft', 'leftEyeBlink'],
      eyeBlinkRight: ['eyeBlinkRight', 'eyeBlink_R', 'EyeBlinkRight', 'rightEyeBlink'],
      eyeWideLeft: ['eyeWideLeft', 'eyeWide_L', 'EyeWideLeft'],
      eyeWideRight: ['eyeWideRight', 'eyeWide_R', 'EyeWideRight'],
      eyeSquintLeft: ['eyeSquintLeft', 'eyeSquint_L', 'EyeSquintLeft'],
      eyeSquintRight: ['eyeSquintRight', 'eyeSquint_R', 'EyeSquintRight'],
      
      // Eyebrow movements
      eyebrowRaiseLeft: ['browOuterUpLeft', 'browOuterUp_L', 'BrowOuterUpLeft', 'leftBrowUp'],
      eyebrowRaiseRight: ['browOuterUpRight', 'browOuterUp_R', 'BrowOuterUpRight', 'rightBrowUp'],
      eyebrowFurrow: ['browInnerUp', 'browDown', 'BrowInnerUp', 'browFurrow'],
      
      // Mouth expressions
      mouthSmile: ['mouthSmileLeft', 'mouthSmile_L', 'MouthSmileLeft', 'smile'],
      mouthFrown: ['mouthFrownLeft', 'mouthFrown_L', 'MouthFrownLeft', 'frown'],
      mouthPucker: ['mouthPucker', 'MouthPucker', 'pucker'],
      
      // Jaw movements
      jawLeft: ['jawLeft', 'JawLeft'],
      jawRight: ['jawRight', 'JawRight'],
      
      // Cheek
      cheekPuff: ['cheekPuff', 'CheekPuff'],
    };
    
    // Helper function to find the first available morph target from a list of possibilities
    const findMorphTarget = (possibleNames: string[]): string | undefined => {
      for (const name of possibleNames) {
        if (mesh.morphTargetDictionary[name] !== undefined) {
          return name;
        }
      }
      return undefined;
    };
    
    // Apply expressions
    Object.entries(trackingData.facialExpressions).forEach(([expression, value]) => {
      const possibleTargets = expressionMappings[expression];
      
      if (possibleTargets) {
        const targetName = findMorphTarget(possibleTargets);
        
        if (targetName) {
          const index = mesh.morphTargetDictionary[targetName];
          mesh.morphTargetInfluences[index] = value;
          
          // Log all significant expression applications
          if (value > 0.05) {
            console.log(`Applied ${expression}: ${value.toFixed(2)} -> ${targetName} (index ${index})`);
          }
          
          // Extra logging for eye blinks to debug
          if (expression.includes('eyeBlink') && value > 0.01) {
            console.log(`[DEBUG] Eye blink detected: ${expression} = ${value.toFixed(3)}, applied to ${targetName}`);
          }
          
          // Apply to both sides for symmetric expressions
          if (expression === 'mouthSmile') {
            const rightTarget = findMorphTarget(['mouthSmileRight', 'mouthSmile_R', 'MouthSmileRight']);
            if (rightTarget) {
              const rightIndex = mesh.morphTargetDictionary[rightTarget];
              mesh.morphTargetInfluences[rightIndex] = value;
            }
          } else if (expression === 'mouthFrown') {
            const rightTarget = findMorphTarget(['mouthFrownRight', 'mouthFrown_R', 'MouthFrownRight']);
            if (rightTarget) {
              const rightIndex = mesh.morphTargetDictionary[rightTarget];
              mesh.morphTargetInfluences[rightIndex] = value;
            }
          }
        } else if (value > 0.05) {
          // Log expressions that couldn't be mapped
          console.warn(`No morph target found for ${expression}: ${value.toFixed(2)} (tried ${possibleTargets.join(', ')})`);
        }
      }
    });

  }, [trackingData, clonedScene]);

  const scaleVector = new THREE.Vector3(scale, scale, scale);

  return (
    <group 
      ref={group} 
      position={position} 
      scale={scaleVector}
    >
      <primitive object={clonedScene} />
      
      {/* Subtle shadow for grounding */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[2, 2]} />
        <shadowMaterial opacity={0.4} />
      </mesh>
    </group>
  );
};

export { PresenceAvatar };
export default PresenceAvatar;
