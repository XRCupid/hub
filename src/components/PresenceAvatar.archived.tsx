// Enhanced Avatar with Physical Presence
// Creates realistic presence through subtle movements and reactions

import React, { useRef, useMemo, useEffect, useCallback, useState } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame, GroupProps } from '@react-three/fiber';
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
  disableMorphTargets?: boolean; // Add a new prop to disable morph targets
}

// Preload common avatars
useGLTF.preload('/avatars/coach_grace.glb');
useGLTF.preload('/avatars/AngelChick.glb');
useGLTF.preload('/avatars/coach_posie.glb');
useGLTF.preload('/avatars/coach_rizzo.glb');

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
  cameraTarget,
  disableMorphTargets = false, // Initialize the new prop with a default value
}) => {
  console.log('[PresenceAvatar] Rendering, trackingData:', !!trackingData);
  
  const group = useRef<THREE.Group>(null);
  const currentAction = useRef<THREE.AnimationAction | null>(null);
  const hasLoggedMorphTargets = useRef(false);
  const hasAppliedFix = useRef(false);
  const lastSpeakingState = useRef(false);
  const headBone = useRef<THREE.Bone | null>(null);
  const neckBone = useRef<THREE.Bone | null>(null);
  const spineBone = useRef<THREE.Bone | null>(null);
  const smoothedRotation = useRef({ x: 0, y: 0, z: 0 });
  const smoothedPosition = useRef({ x: 0, y: 0, z: 0 });
  const baseHeadPosition = useRef({ x: 0, y: 0, z: 0 });
  const defaultHeadRotation = useRef({ x: 0, y: 0, z: 0 });
  const lastLogTime = useRef<number>(0);
  const frameCount = useRef(0);
  const lastTrackingState = useRef(false);

  // Load avatar model - this must be called at the top level
  const { scene } = useGLTF(avatarUrl);
  
  // Add loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Clone the scene to avoid conflicts
  const clonedScene = useMemo(() => {
    console.log('[PresenceAvatar] Cloning scene for:', avatarUrl);
    if (!scene) {
      console.error('[PresenceAvatar] No scene loaded yet');
      return null;
    }
    
    try {
      const cloned = SkeletonUtils.clone(scene);
      console.log('[PresenceAvatar] Avatar cloned successfully:', {
        originalChildren: scene.children.length,
        clonedChildren: cloned.children.length
      });
      
      // Disable frustum culling on all meshes to prevent them from being culled
      cloned.traverse((child: THREE.Object3D) => {
        if ((child as any).isMesh || (child as any).isSkinnedMesh) {
          const mesh = child as THREE.Mesh | THREE.SkinnedMesh;
          mesh.frustumCulled = false;
          
          // Ensure materials are visible
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat: any) => {
                mat.visible = true;
                mat.opacity = mat.opacity || 1;
                mat.transparent = false;
              });
            } else {
              (mesh.material as any).visible = true;
              (mesh.material as any).opacity = (mesh.material as any).opacity || 1;
              (mesh.material as any).transparent = false;
            }
          }
          
          console.log('[PresenceAvatar] Mesh setup:', {
            name: child.name,
            visible: mesh.visible,
            frustumCulled: mesh.frustumCulled,
            materialVisible: mesh.material ? 
              (Array.isArray(mesh.material) ? mesh.material[0].visible : (mesh.material as any).visible) : null
          });
        }
      });
      
      // Ensure the cloned scene is at proper scale and position
      cloned.position.set(0, 0, 0);
      cloned.scale.set(1, 1, 1);
      cloned.visible = true;
      console.log('[PresenceAvatar] Reset cloned scene position, scale, and visibility');
      
      return cloned;
    } catch (error) {
      console.error('[PresenceAvatar] Error cloning scene:', error);
      return scene; // Fallback to original scene
    }
  }, [scene, avatarUrl]);
  
  // Update loading state when scene is available
  useEffect(() => {
    if (clonedScene) {
      setIsLoading(false);
    }
  }, [clonedScene]);
  
  console.log('[PresenceAvatar] Cloned scene:', !!clonedScene);

  // Find head and neck bones after model loads
  const findBones = useCallback((scene: THREE.Object3D) => {
    const skinnedMesh = scene.getObjectByProperty('type', 'SkinnedMesh') as THREE.SkinnedMesh | undefined;
    if (skinnedMesh?.skeleton) {
      const bones = skinnedMesh.skeleton.bones;
      
      // Find head bone
      const head = bones.find((bone: THREE.Bone) => 
        bone.name.toLowerCase().includes('head') && 
        !bone.name.toLowerCase().includes('headtop')
      );
      
      // Find neck bone
      const neck = bones.find((bone: THREE.Bone) => 
        bone.name.toLowerCase().includes('neck')
      );
      
      // Find spine bones
      const spine = bones.find((bone: THREE.Bone) => 
        bone.name.toLowerCase().includes('spine') || 
        bone.name.toLowerCase().includes('chest')
      );
      
      if (head) {
        headBone.current = head;
        // Store the default head rotation and position
        // Add a small forward tilt adjustment to fix the default pose
        defaultHeadRotation.current = {
          x: head.rotation.x - 0.1, // Slight forward tilt (negative = forward)
          y: head.rotation.y,
          z: head.rotation.z
        };
        baseHeadPosition.current = {
          x: head.position.x,
          y: head.position.y,
          z: head.position.z
        };
        console.log('[PresenceAvatar] Found head bone:', head.name, 'default rotation:', defaultHeadRotation.current);
      }
      
      if (neck) {
        neckBone.current = neck;
        console.log('[PresenceAvatar] Found neck bone:', neck.name);
      }
      
      if (spine) {
        spineBone.current = spine;
        console.log('[PresenceAvatar] Found spine bone:', spine.name);
      }
    }
  }, []);
  
  useEffect(() => {
    if (!clonedScene) return;
    
    findBones(clonedScene as THREE.Object3D);
  }, [clonedScene, findBones]);
  
  // Find and fix T-pose for RPM avatars
  useEffect(() => {
    if (!clonedScene || hasAppliedFix.current) return;
    
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
          console.log('Bone names sample:', boneNames.slice(0, 10));
          
          // Fix T-pose for different avatar types
          skinnedMesh.skeleton.bones.forEach((bone) => {
            const boneName = bone.name;
            const boneNameLower = boneName.toLowerCase();
            
            // For coach_grace and similar avatars
            if (boneNameLower.includes('upperarm_l') || boneName === 'LeftArm' || boneName === 'mixamorig:LeftArm') {
              bone.rotation.x = 0.3;
              bone.rotation.z = 0.8;
              bone.updateMatrixWorld(true);
              console.log('Fixed left arm:', boneName);
            }
            
            if (boneNameLower.includes('upperarm_r') || boneName === 'RightArm' || boneName === 'mixamorig:RightArm') {
              bone.rotation.x = 0.3;
              bone.rotation.z = -0.8;
              bone.updateMatrixWorld(true);
              console.log('Fixed right arm:', boneName);
            }
            
            // Fix shoulders
            if (boneNameLower.includes('shoulder_l') || boneName === 'LeftShoulder' || boneName === 'mixamorig:LeftShoulder') {
              bone.rotation.z = 0.1;
              bone.updateMatrixWorld(true);
              console.log('Fixed left shoulder:', boneName);
            }
            
            if (boneNameLower.includes('shoulder_r') || boneName === 'RightShoulder' || boneName === 'mixamorig:RightShoulder') {
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
  
  // Setup animations with the cloned scene or a dummy group
  const animationTarget = useMemo(() => {
    return clonedScene || new THREE.Group();
  }, [clonedScene]);
  
  const { actions, mixer } = useAnimations(animations, animationTarget);
  
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
    if (!actions || !mixer || !clonedScene) return;
    
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
  }, [actions, mixer, avatarUrl, clonedScene]); // Added avatarUrl as dependency to reinit on avatar change
  
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
    frameCount.current++;
    
    // Detect when tracking data changes
    const hasTrackingData = !!trackingData;
    if (hasTrackingData !== lastTrackingState.current) {
      console.log('[PresenceAvatar] TRACKING STATE CHANGED:', {
        from: lastTrackingState.current,
        to: hasTrackingData,
        groupVisible: group.current?.visible,
        clonedSceneVisible: clonedScene?.visible,
        groupPosition: group.current?.position.toArray(),
        groupScale: group.current?.scale.toArray(),
        clonedScenePosition: clonedScene?.position.toArray(),
        clonedSceneScale: clonedScene?.scale.toArray()
      });
      lastTrackingState.current = hasTrackingData;
    }
    
    // Log every 60 frames (approximately once per second)
    if (frameCount.current % 60 === 0) {
      console.log('[PresenceAvatar] Frame update:', {
        frame: frameCount.current,
        hasTrackingData: !!trackingData,
        hasClonedScene: !!clonedScene,
        clonedSceneVisible: clonedScene?.visible,
        groupVisible: group.current?.visible,
        groupPosition: group.current?.position.toArray(),
        groupScale: group.current?.scale.toArray(),
        clonedSceneInGroup: clonedScene ? group.current?.children.includes(clonedScene) : false
      });
      
      // Check if cloned scene has been removed from group
      if (clonedScene && group.current && !group.current.children.some(child => child === clonedScene)) {
        console.error('[PresenceAvatar] CLONED SCENE REMOVED FROM GROUP!');
      }
      
      // Check for any transform issues
      if (clonedScene) {
        const pos = clonedScene.position.toArray();
        const scale = clonedScene.scale.toArray();
        const hasNaN = [...pos, ...scale].some(v => isNaN(v));
        const hasZeroScale = scale.some(v => v === 0);
        
        if (hasNaN || hasZeroScale) {
          console.error('[PresenceAvatar] INVALID TRANSFORM:', {
            position: pos,
            scale: scale,
            hasNaN,
            hasZeroScale
          });
        }
      }
    }
    
    if (!group.current || !clonedScene) {
      console.warn('[PresenceAvatar] Missing group or clonedScene in useFrame');
      return;
    }
    
    // Debug log tracking data occasionally
    if (Math.random() < 0.02) {
      console.log('[PresenceAvatar] useFrame - tracking data check:', {
        hasTrackingData: !!trackingData,
        hasFacialExpressions: !!trackingData?.facialExpressions,
        hasHeadRotation: !!(trackingData as any)?.headRotation,
        sampleExpression: trackingData?.facialExpressions?.mouthSmile
      });
    }
    
    if (mixer) {
      mixer.update(delta);
      
      // Apply head rotation with smoothing
      const targetBone = neckBone.current || headBone.current;
      if (targetBone) {
        if (trackingData) {
          const headRotation = (trackingData as any).headRotation;
          if (headRotation) {
            // Log head rotation occasionally
            if (Math.random() < 0.02) {
              console.log('[PresenceAvatar] Head rotation raw:', {
                pitch: headRotation.pitch.toFixed(2),
                yaw: headRotation.yaw.toFixed(2),
                roll: headRotation.roll.toFixed(2)
              });
              console.log('[PresenceAvatar] Head rotation applied:', {
                x: (headRotation.pitch * 0.15).toFixed(3),
                y: (-headRotation.yaw * 0.12).toFixed(3),
                z: (-headRotation.roll * 0.08).toFixed(3)
              });
            }
            
            // Apply head and neck rotation with mirroring
            const sensitivity = {
              pitch: 0.15,  // Reduced from 0.3 - much subtler movement
              yaw: 0.12,    // Reduced from 0.25
              roll: 0.08    // Reduced from 0.15
            };
            
            const targetRotation = {
              x: headRotation.pitch * sensitivity.pitch,  // No negation for pitch - positive pitch = look down
              y: -headRotation.yaw * sensitivity.yaw,     // Negate for mirroring
              z: -headRotation.roll * sensitivity.roll    // Negate for mirroring
            };
            
            // Smooth the rotation values over time with stronger smoothing
            smoothedRotation.current.x = THREE.MathUtils.lerp(smoothedRotation.current.x, targetRotation.x, 0.05);
            smoothedRotation.current.y = THREE.MathUtils.lerp(smoothedRotation.current.y, targetRotation.y, 0.05);
            smoothedRotation.current.z = THREE.MathUtils.lerp(smoothedRotation.current.z, targetRotation.z, 0.05);
            
            // Apply rotation only to head, not neck
            if (headBone.current) {
              headBone.current.rotation.x = defaultHeadRotation.current.x + smoothedRotation.current.x;
              headBone.current.rotation.y = defaultHeadRotation.current.y + smoothedRotation.current.y;
              headBone.current.rotation.z = defaultHeadRotation.current.z + smoothedRotation.current.z;
            }
            
            // Keep neck stable - don't apply rotation to neck
            // targetBone is neck, so we skip it
            
            // Add forward/backward movement based on face distance
            // Estimate distance from face size (landmarks spread)
            const faceData = (trackingData as any).landmarks;
            if (faceData && faceData.length > 0 && headBone.current) {
              // Calculate face width from outer eye corners or jaw width
              const leftPoint = faceData[356] || faceData[234] || faceData[454]; // Left face edge
              const rightPoint = faceData[127] || faceData[10] || faceData[234]; // Right face edge
              
              if (leftPoint && rightPoint) {
                const faceWidth = Math.sqrt(
                  Math.pow(rightPoint[0] - leftPoint[0], 2) + 
                  Math.pow(rightPoint[1] - leftPoint[1], 2)
                );
                
                // Normalize face width (typical range 0.3 to 0.6)
                // Larger face = closer to camera = move forward
                const normalizedDistance = (faceWidth - 0.45) * 2.5; // Reduced from 5.0 to 2.5
                const targetZ = THREE.MathUtils.clamp(normalizedDistance * 0.05, -0.03, 0.03); // Reduced range
                
                // Smooth the position
                smoothedPosition.current.z = THREE.MathUtils.lerp(
                  smoothedPosition.current.z, 
                  targetZ, 
                  0.05 // Reduced from 0.08 for smoother movement
                );
                
                // Apply position offset to head
                headBone.current.position.z = baseHeadPosition.current.z + smoothedPosition.current.z;
                
                // Log more frequently for debugging
                if (Math.random() < 0.05) { // Increased from 0.01
                  console.log('[PresenceAvatar] Head depth:', {
                    faceWidth: faceWidth.toFixed(3),
                    normalizedDistance: normalizedDistance.toFixed(3),
                    targetZ: targetZ.toFixed(3),
                    smoothedZ: smoothedPosition.current.z.toFixed(3),
                    applied: (baseHeadPosition.current.z + smoothedPosition.current.z).toFixed(3)
                  });
                }
              } else {
                console.log('[PresenceAvatar] No face landmarks found for depth calculation');
              }
            }
          } else {
            // Reset to default position when no tracking data
            smoothedRotation.current.x = THREE.MathUtils.lerp(smoothedRotation.current.x, 0, 0.05);
            smoothedRotation.current.y = THREE.MathUtils.lerp(smoothedRotation.current.y, 0, 0.05);
            smoothedRotation.current.z = THREE.MathUtils.lerp(smoothedRotation.current.z, 0, 0.05);
            smoothedPosition.current.z = THREE.MathUtils.lerp(smoothedPosition.current.z, 0, 0.05);
            
            if (headBone.current) {
              headBone.current.rotation.x = defaultHeadRotation.current.x + smoothedRotation.current.x;
              headBone.current.rotation.y = defaultHeadRotation.current.y + smoothedRotation.current.y;
              headBone.current.rotation.z = defaultHeadRotation.current.z + smoothedRotation.current.z;
              headBone.current.position.z = baseHeadPosition.current.z + smoothedPosition.current.z;
            }
          }
          
          // Apply posture tracking to spine/torso
          if (trackingData?.posture && clonedScene) {
            const skinnedMesh = clonedScene.getObjectByProperty('type', 'SkinnedMesh') as THREE.SkinnedMesh | undefined;
            if (skinnedMesh?.skeleton) {
              const spineBone = skinnedMesh.skeleton.bones.find((bone: THREE.Bone) => 
                bone.name.toLowerCase().includes('spine') || 
                bone.name.toLowerCase().includes('chest')
              );
              
              if (spineBone) {
                const posture = trackingData.posture;
                // Apply subtle torso rotation based on shoulder positions
                if (posture.keypoints.leftShoulder && posture.keypoints.rightShoulder) {
                  const shoulderTilt = (posture.keypoints.leftShoulder.y - posture.keypoints.rightShoulder.y) * 0.5;
                  const clampedTilt = THREE.MathUtils.clamp(shoulderTilt, -0.2, 0.2);
                  
                  // Log only occasionally to avoid spam
                  if (Math.random() < 0.02) {
                    console.log('[PresenceAvatar] Applying posture:', {
                      leftY: posture.keypoints.leftShoulder.y.toFixed(3),
                      rightY: posture.keypoints.rightShoulder.y.toFixed(3),
                      tilt: shoulderTilt.toFixed(3),
                      clampedTilt: clampedTilt.toFixed(3)
                    });
                  }
                  
                  spineBone.rotation.z = THREE.MathUtils.lerp(
                    spineBone.rotation.z, 
                    clampedTilt,
                    0.05
                  );
                }
              } else if (Math.random() < 0.01) {
                console.log('[PresenceAvatar] No spine/chest bone found in skeleton');
              }
            }
          }
          
          // Apply facial expressions here in useFrame
          if (trackingData?.facialExpressions && clonedScene && !disableMorphTargets) {
            // Log before morph target processing
            const beforeVisible = clonedScene.visible;
            const beforePosition = clonedScene.position.clone();
            const beforeScale = clonedScene.scale.clone();
            
            if (Math.random() < 0.05) {
              console.log('[PresenceAvatar] BEFORE morph targets:', {
                visible: beforeVisible,
                position: beforePosition.toArray(),
                scale: beforeScale.toArray()
              });
            }
            
            // Find the skinned mesh with morph targets
            let meshWithMorphs: THREE.SkinnedMesh | null = null;
            
            clonedScene.traverse((child) => {
              if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
                const skinnedMesh = child as THREE.SkinnedMesh;
                if ((skinnedMesh as any).morphTargetDictionary && (skinnedMesh as any).morphTargetInfluences) {
                  meshWithMorphs = skinnedMesh;
                }
              }
            });
            
            if (Math.random() < 0.05) {
              console.log('[PresenceAvatar] Found mesh:', !!meshWithMorphs);
            }
            
            if (meshWithMorphs) {
              const meshAny = meshWithMorphs as any;
              if (meshAny.morphTargetDictionary && meshAny.morphTargetInfluences) {
                // Now TypeScript knows these properties exist
                const morphDict = meshAny.morphTargetDictionary;
                const morphInfluences = meshAny.morphTargetInfluences;
                
                // Log all available morph targets once
                if (!hasLoggedMorphTargets.current) {
                  console.log('=== Available Morph Targets ===');
                  console.log('Total morph targets:', Object.keys(morphDict).length);
                  Object.keys(morphDict).forEach((name, index) => {
                    console.log(`  ${index}: ${name}`);
                  });
                  hasLoggedMorphTargets.current = true;
                }
                
                // Apply expressions to morph targets
                const expressions = trackingData.facialExpressions;
                const activeExpressions: string[] = [];
                
                Object.entries(expressions).forEach(([key, value]) => {
                  if (value > 0.01) {
                    activeExpressions.push(`${key}:${value.toFixed(2)}`);
                  }
                });
                
                // Log expression values periodically
                const now = Date.now();
                if (activeExpressions.length > 0 && now - lastLogTime.current > 3000) {
                  console.log('[PresenceAvatar] Active expressions:', {
                    expressions: activeExpressions.join(', '),
                    hasMesh: true,
                    morphTargetCount: Object.keys(morphDict).length
                  });
                  
                  lastLogTime.current = now;
                }
                
                // Function to apply bilateral expressions
                const applyBilateral = (leftExpName: string, rightExpName: string) => {
                  const leftPossible = leftExpName;
                  const rightPossible = rightExpName;
                  
                  if (leftPossible && rightPossible && morphDict && morphInfluences) {
                    const leftTarget = findMorphTarget([leftPossible]);
                    const rightTarget = findMorphTarget([rightPossible]);
                    
                    if (leftTarget && rightTarget) {
                      const leftIndex = morphDict[leftTarget];
                      const rightIndex = morphDict[rightTarget];
                      const leftValue = morphInfluences[leftIndex] || 0;
                      const rightValue = morphInfluences[rightIndex] || 0;
                      const maxValue = Math.max(leftValue, rightValue);
                      
                      if (maxValue > 0) {
                        morphInfluences[leftIndex] = maxValue;
                        morphInfluences[rightIndex] = maxValue;
                      }
                    }
                  }
                };
                
                // Function to find a morph target from possible names
                const findMorphTarget = (possibleNames: string[]): string | null => {
                  if (!morphDict) return null;
                  for (const name of possibleNames) {
                    if (morphDict.hasOwnProperty(name)) {
                      return name;
                    }
                  }
                  return null;
                };
                
                // Apply expressions to morph targets
                const applyMorphTargets = (mesh: THREE.SkinnedMesh, expressions: any) => {
                  // Detect if we have strong smile/frown to reduce mouth open
                  const hasSmile = (expressions.mouthSmileLeft || 0) > 0.15 || (expressions.mouthSmileRight || 0) > 0.15;
                  const hasFrown = (expressions.mouthFrownLeft || 0) > 0.15 || (expressions.mouthFrownRight || 0) > 0.15;
                  const hasPucker = (expressions.mouthPucker || 0) > 0.15;
                  
                  // Expression name mapping to possible morph target names
                  const expressionMorphMap: { [key: string]: string[] } = {
                    // Eye expressions
                    eyeBlinkLeft: ['eyeBlinkLeft', 'eyeBlink_L', 'EyeBlinkLeft', 'leftEyeClosed', 'eye_closed_L'],
                    eyeBlinkRight: ['eyeBlinkRight', 'eyeBlink_R', 'EyeBlinkRight', 'rightEyeClosed', 'eye_closed_R'],
                    eyeWideLeft: ['eyeWideLeft', 'eyeWide_L', 'EyeWideLeft', 'eye_wide_L'],
                    eyeWideRight: ['eyeWideRight', 'eyeWide_R', 'EyeWideRight', 'eye_wide_R'],
                    eyeSquintLeft: ['eyeSquintLeft', 'eyeSquint_L', 'EyeSquintLeft', 'eye_squint_L'],
                    eyeSquintRight: ['eyeSquintRight', 'eyeSquint_R', 'EyeSquintRight', 'eye_squint_R'],
                    
                    // Eyebrow expressions  
                    eyebrowRaiseLeft: ['browOuterUpLeft', 'browOuterUp_L', 'BrowOuterUpLeft', 'leftBrowUp', 'brow_up_L'],
                    eyebrowRaiseRight: ['browOuterUpRight', 'browOuterUp_R', 'BrowOuterUpRight', 'rightBrowUp', 'brow_up_R'],
                    eyebrowFurrow: ['browInnerUp', 'browDown', 'BrowInnerUp', 'browFurrow', 'brow_angry'],
                    browDownLeft: ['browDownLeft', 'browDown_L', 'BrowDownLeft', 'brow_down_L'],
                    browDownRight: ['browDownRight', 'browDown_R', 'BrowDownRight', 'brow_down_R'],
                    browInnerUp: ['browInnerUp', 'BrowInnerUp', 'brow_inner_up'],
                    
                    // Mouth expressions
                    mouthSmile: ['mouthSmileLeft', 'mouthSmile_L', 'MouthSmileLeft', 'smile', 'mouth_smile_L'],
                    mouthSmileRight: ['mouthSmileRight', 'mouthSmile_R', 'MouthSmileRight', 'mouth_smile_R'],
                    mouthFrown: ['mouthFrownLeft', 'mouthFrown_L', 'MouthFrownLeft', 'frown', 'mouth_frown_L'],
                    mouthFrownRight: ['mouthFrownRight', 'mouthFrown_R', 'MouthFrownRight', 'mouth_frown_R'],
                    mouthPucker: ['mouthPucker', 'MouthPucker', 'pucker', 'mouth_pucker'],
                    mouthOpen: ['mouthOpen', 'jawOpen', 'MouthOpen', 'mouth_open', 'jaw_open'],
                    mouthPress: ['mouthPress', 'MouthPress', 'mouth_press'],
                    mouthPressLeft: ['mouthPressLeft', 'mouthPress_L', 'MouthPressLeft'],
                    mouthPressRight: ['mouthPressRight', 'mouthPress_R', 'MouthPressRight'],
                    mouthUpperUpLeft: ['mouthUpperUpLeft', 'mouthUpperUp_L', 'mouth_upperLip_raise_L'],
                    mouthUpperUpRight: ['mouthUpperUpRight', 'mouthUpperUp_R', 'mouth_upperLip_raise_R'],
                    mouthLowerDown: ['mouthLowerDown', 'MouthLowerDown', 'mouth_lowerLip_depress'],
                    mouthStretchLeft: ['mouthStretchLeft', 'mouthStretch_L', 'mouth_stretch_L'],
                    mouthStretchRight: ['mouthStretchRight', 'mouthStretch_R', 'mouth_stretch_R'],
                    mouthDimpleLeft: ['mouthDimpleLeft', 'mouthDimple_L', 'mouth_dimple_L'],
                    mouthDimpleRight: ['mouthDimpleRight', 'mouthDimple_R', 'mouth_dimple_R'],
                    
                    // Jaw movements
                    jawLeft: ['jawLeft', 'JawLeft', 'jaw_left'],
                    jawRight: ['jawRight', 'JawRight', 'jaw_right'],
                    jawForward: ['jawForward', 'JawForward', 'jaw_forward'],
                    
                    // Cheek expressions
                    cheekPuff: ['cheekPuff', 'CheekPuff', 'cheek_puff'],
                    cheekSquintLeft: ['cheekSquintLeft', 'cheekSquint_L', 'cheek_squint_L'],
                    cheekSquintRight: ['cheekSquintRight', 'cheekSquint_R', 'cheek_squint_R'],
                    
                    // Nose expressions
                    noseSneerLeft: ['noseSneerLeft', 'noseSneer_L', 'nose_sneer_L'],
                    noseSneerRight: ['noseSneerRight', 'noseSneer_R', 'nose_sneer_R'],
                    
                    // Tongue expressions
                    tongueOut: ['tongueOut', 'TongueOut', 'tongue_out']
                  };
                  
                  // Apply each expression
                  Object.entries(expressions).forEach(([key, value]) => {
                    if (typeof value !== 'number' || value <= 0) return;
                    
                    const possibleNames = expressionMorphMap[key];
                    if (possibleNames) {
                      const targetName = findMorphTarget(possibleNames);
                      
                      if (targetName && morphDict && morphInfluences) {
                        const index = morphDict[targetName];
                        
                        // When we have emotional expressions, reduce mouth open significantly
                        let mouthOpenReduction = 1.0;
                        if (key === 'jawOpen' && (hasSmile || hasFrown || hasPucker)) {
                          mouthOpenReduction = 0.15;
                          console.log('[PresenceAvatar] Reducing mouth open due to emotional expression');
                        }
                        
                        // Apply the expression value with mouth open reduction
                        let targetValue = value * mouthOpenReduction;
                        
                        // Amplify certain expressions for better visibility
                        const amplificationMap: { [key: string]: number } = {
                          'mouthSmileLeft': 1.8,
                          'mouthSmileRight': 1.8,
                          'mouthFrownLeft': 1.5,
                          'mouthFrownRight': 1.5,
                          'browRaiseLeft': 2.0,
                          'browRaiseRight': 2.0,
                          'eyeBlinkLeft': 1.2,
                          'eyeBlinkRight': 1.2,
                          'cheekSquintLeft': 1.5,
                          'cheekSquintRight': 1.5,
                          'noseSneerLeft': 2.0,
                          'noseSneerRight': 2.0,
                          'mouthPucker': 1.8,
                          'jawOpen': 1.0
                        };
                        
                        const amplification = amplificationMap[key] || 1.0;
                        const amplifiedValue = Math.min(targetValue * amplification, 1.0);
                        
                        morphInfluences[index] = amplifiedValue;
                        
                        // Log high expression values
                        if (value > 0.3 && Math.random() < 0.05) {
                          console.log(`[PresenceAvatar] High expression: ${key} = ${value.toFixed(3)} -> ${targetName}[${index}] = ${amplifiedValue.toFixed(3)}`);
                        }
                      }
                    }
                  });
                  
                  // Helper function to apply bilateral expressions
                  const applyBilateral = (leftExpName: string, rightExpName: string) => {
                    const leftPossible = leftExpName;
                    const rightPossible = rightExpName;
                    
                    if (leftPossible && rightPossible && morphDict && morphInfluences) {
                      const leftTarget = findMorphTarget([leftPossible]);
                      const rightTarget = findMorphTarget([rightPossible]);
                      
                      if (leftTarget && rightTarget) {
                        const leftIndex = morphDict[leftTarget];
                        const rightIndex = morphDict[rightTarget];
                        const leftValue = morphInfluences[leftIndex] || 0;
                        const rightValue = morphInfluences[rightIndex] || 0;
                        const maxValue = Math.max(leftValue, rightValue);
                        
                        if (maxValue > 0) {
                          morphInfluences[leftIndex] = maxValue;
                          morphInfluences[rightIndex] = maxValue;
                        }
                      }
                    }
                  };
                  
                  // Synchronize bilateral expressions
                  applyBilateral('mouthSmileLeft', 'mouthSmileRight');
                  applyBilateral('mouthFrownLeft', 'mouthFrownRight');
                  applyBilateral('eyebrowRaiseLeft', 'eyebrowRaiseRight');
                  applyBilateral('eyeBlinkLeft', 'eyeBlinkRight');
                  applyBilateral('cheekSquintLeft', 'cheekSquintRight');
                };
                
                applyMorphTargets(meshWithMorphs, expressions);
                
                // Log mesh visibility after applying expressions
                if (Math.random() < 0.02) {
                  console.log('[PresenceAvatar] After applying expressions:', {
                    meshVisible: meshAny.visible,
                    meshPosition: meshAny.position.toArray(),
                    meshScale: meshAny.scale.toArray(),
                    parentVisible: meshAny.parent?.visible,
                    sceneVisible: clonedScene.visible
                  });
                }
              }
            }
            
            // Check if visibility changed after morph target processing
            if (clonedScene.visible !== beforeVisible) {
              console.error('[PresenceAvatar] VISIBILITY CHANGED during morph targets!', {
                before: beforeVisible,
                after: clonedScene.visible
              });
            }
            
            // Check if position/scale changed unexpectedly
            const afterPosition = clonedScene.position;
            const afterScale = clonedScene.scale;
            if (!beforePosition.equals(afterPosition) || !beforeScale.equals(afterScale)) {
              console.error('[PresenceAvatar] TRANSFORM CHANGED during morph targets!', {
                positionBefore: beforePosition.toArray(),
                positionAfter: afterPosition.toArray(),
                scaleBefore: beforeScale.toArray(),
                scaleAfter: afterScale.toArray()
              });
            }
          }
        }
      }
    }
  });
  
  // Cleanup on unmount
  useEffect(() => {
    console.log('[PresenceAvatar] Component mounted');
    return () => {
      console.log('[PresenceAvatar] Component unmounting!');
    };
  }, []);

  useEffect(() => {
    console.log('[PresenceAvatar] Component mounted with avatarUrl:', avatarUrl);
    console.log('[PresenceAvatar] Position:', position);
    console.log('[PresenceAvatar] Scale:', scale);
  }, [avatarUrl, position, scale]);

  const scaleVector = new THREE.Vector3(scale, scale, scale);

  useFrame(() => {
    if (!group.current || !clonedScene) return;
    
    if (Math.random() < 0.01) {
      console.log('[PresenceAvatar] === Avatar State Check ===');
      console.log('[PresenceAvatar] Group visible:', group.current.visible);
      console.log('[PresenceAvatar] Group position:', group.current.position.toArray());
      console.log('[PresenceAvatar] Group scale:', group.current.scale.toArray());
      console.log('[PresenceAvatar] Group children count:', group.current.children.length);
      
      console.log('[PresenceAvatar] ClonedScene visible:', clonedScene.visible);
      console.log('[PresenceAvatar] ClonedScene position:', clonedScene.position.toArray());
      console.log('[PresenceAvatar] ClonedScene scale:', clonedScene.scale.toArray());
      console.log('[PresenceAvatar] ClonedScene children:', clonedScene.children.length);
      
      // Check all children
      let skinnedMeshCount = 0;
      let visibleMeshCount = 0;
      clonedScene.traverse((child: THREE.Object3D) => {
        if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
          skinnedMeshCount++;
          if (child.visible) visibleMeshCount++;
          const mesh = child as THREE.SkinnedMesh;
          console.log('[PresenceAvatar] SkinnedMesh:', {
            name: child.name,
            visible: child.visible,
            position: child.position.toArray(),
            scale: child.scale.toArray(),
            parentVisible: child.parent?.visible,
            geometry: !!mesh.geometry,
            geometryBounds: mesh.geometry?.boundingBox ? 
              [mesh.geometry.boundingBox.min.toArray(), mesh.geometry.boundingBox.max.toArray()] : null,
            material: mesh.material ? (Array.isArray(mesh.material) ? mesh.material.length : 1) : 0,
            materialVisible: mesh.material ? 
              (Array.isArray(mesh.material) ? (mesh.material[0] as any).visible : (mesh.material as any).visible) : null,
            materialOpacity: mesh.material ? 
              (Array.isArray(mesh.material) ? (mesh.material[0] as any).opacity : (mesh.material as any).opacity) : null,
            materialTransparent: mesh.material ? 
              (Array.isArray(mesh.material) ? (mesh.material[0] as any).transparent : (mesh.material as any).transparent) : null
          });
        }
      });
      
      console.log('[PresenceAvatar] Total skinned meshes:', skinnedMeshCount, 'Visible:', visibleMeshCount);
      console.log('[PresenceAvatar] ======================');
    }
    
    const groupRef = group.current;
    if (groupRef) {
      console.log('[PresenceAvatar] useFrame - Avatar group and clonedScene visibility:', {
        groupVisible: groupRef.visible,
        groupPosition: groupRef.position.toArray(),
        groupScale: groupRef.scale.toArray(),
        clonedSceneVisible: clonedScene.visible,
        clonedScenePosition: clonedScene.position.toArray(),
        clonedSceneScale: clonedScene.scale.toArray(),
        clonedSceneChildren: clonedScene.children.length
      });
      
      // Check for NaN or invalid values
      const groupPos = groupRef.position.toArray();
      const groupScale = groupRef.scale.toArray();
      const clonedPos = clonedScene.position.toArray();
      const clonedScale = clonedScene.scale.toArray();
      
      const hasInvalidValues = [...groupPos, ...groupScale, ...clonedPos, ...clonedScale].some(
        v => isNaN(v) || !isFinite(v)
      );
      
      const hasZeroScale = [...groupScale, ...clonedScale].some(v => v === 0);
      
      if (hasInvalidValues) {
        console.error('[PresenceAvatar] INVALID VALUES DETECTED:', {
          groupPosition: groupPos,
          groupScale: groupScale,
          clonedPosition: clonedPos,
          clonedScale: clonedScale
        });
      }
      
      if (hasZeroScale) {
        console.error('[PresenceAvatar] ZERO SCALE DETECTED:', {
          groupScale: groupScale,
          clonedScale: clonedScale
        });
      }
    }
  });

  // Show loading indicator while scene is loading
  if (isLoading && !clonedScene) {
    console.log('[PresenceAvatar] Loading avatar...');
    return (
      <group position={position}>
        <mesh>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshBasicMaterial color="gray" />
        </mesh>
      </group>
    );
  }

  // Don't render if scene isn't loaded (shouldn't happen with loading check above)
  if (!clonedScene) {
    console.error('[PresenceAvatar] No cloned scene available after loading');
    return null;
  }
  
  // Ensure cloned scene is visible
  if (!clonedScene.visible) {
    console.warn('[PresenceAvatar] Cloned scene is not visible, forcing visibility');
    clonedScene.visible = true;
  }

  return (
    <group 
      ref={group} 
      position={position} 
      scale={scaleVector}
    >
      {/* Render the cloned scene as a single primitive */}
      <primitive object={clonedScene} />
      
      {/* Debug marker to ensure group is rendering */}
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshBasicMaterial color="purple" />
      </mesh>
      
      {/* Subtle shadow for grounding */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[2, 2]} />
        <shadowMaterial opacity={0.4} />
      </mesh>
      
      {/* Custom Box3Helper implementation */}
      {clonedScene && (
        <mesh ref={(ref) => {
          if (ref) {
            const box = new THREE.Box3().setFromObject(clonedScene);
            const center = new THREE.Vector3();
            const size = new THREE.Vector3();
            box.getCenter(center);
            box.getSize(size);
            ref.position.copy(center);
            ref.scale.copy(size);
          }
        }}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="red" wireframe />
        </mesh>
      )}
    </group>
  );
};

export { PresenceAvatar };
export default PresenceAvatar;
