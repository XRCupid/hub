import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useGraph } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import { MathUtils } from 'three';
import type { TrackingData, FacialExpressions } from '../types/tracking';

interface PresenceAvatarProps {
  avatarUrl: string;
  position?: [number, number, number];
  scale?: number; // Overall scale for the group
  trackingData?: TrackingData;
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

const ML5_TO_RPM_MAPPING: Record<string, { targets: string[]; amplify?: number; debug?: boolean }> = {
  'mouthOpen': { targets: ['jawOpen'], amplify: 0.8, debug: true }, // Changed target to jawOpen, amplify to 0.8
  'mouthSmile': { targets: ['mouthSmileLeft', 'mouthSmileRight'], amplify: 7.0 }, // Amplify to 7.0
  'mouthFrown': { targets: ['mouthFrownLeft', 'mouthFrownRight'], amplify: 7.0 }, // Amplify to 7.0
  'mouthPucker': { targets: ['mouthPucker'], amplify: 1.8 },
  'browInnerUp': { targets: ['browInnerUp'], amplify: 1.5 }, // Added for direct control from ML5's browInnerUp
  'browUpLeft': { targets: ['browOuterUpLeft'], amplify: 1.5 }, // This is an ML5 key, but less direct than eyebrowRaise. Keep as is for now.
  'browUpRight': { targets: ['browOuterUpRight'], amplify: 1.5 }, // This is an ML5 key, but less direct than eyebrowRaise. Keep as is for now.
  'eyebrowRaiseLeft': { targets: ['browOuterUpLeft'], amplify: 5.0 }, // Amplify to 5.0, removed browInnerUp target
  'eyebrowRaiseRight': { targets: ['browOuterUpRight'], amplify: 5.0 }, // Amplify to 5.0, removed browInnerUp target
  'eyebrowFurrow': { targets: ['browDownLeft', 'browDownRight'], amplify: 5.0 }, // Amplify to 5.0
  'eyeSquintLeft': { targets: ['eyeSquintLeft'], amplify: 3.0 }, // Amplify to 3.0
  'eyeSquintRight': { targets: ['eyeSquintRight'], amplify: 3.0 }, // Amplify to 3.0
  'eyeWideLeft': { targets: ['eyeWideLeft'], amplify: 3.0 }, // Amplify to 3.0
  'eyeWideRight': { targets: ['eyeWideRight'], amplify: 3.0 }, // Amplify to 3.0
  'cheekPuff': { targets: ['cheekPuff'], amplify: 1.5 },
  'cheekSquintLeft': { targets: ['cheekSquintLeft'], amplify: 1.3 },
  'cheekSquintRight': { targets: ['cheekSquintRight'], amplify: 1.3 },
  'noseSneer': { targets: ['noseSneerLeft', 'noseSneerRight'], amplify: 1.5 },
  'tongueOut': { targets: ['tongueOut'], amplify: 1.0 },
  'jawOpen': { targets: ['jawOpen'], amplify: 0.8 }, // Amplify to 0.8. Note: ML5 also sends mouthOpen, which maps to jawOpen.
  'jawLeft': { targets: ['jawLeft'], amplify: 1.2 },
  'jawRight': { targets: ['jawRight'], amplify: 1.2 },
  'eyeBlinkLeft': { targets: ['eyeBlinkLeft'], amplify: 1.0 }, // Direct mapping
  'eyeBlinkRight': { targets: ['eyeBlinkRight'], amplify: 1.0 } // Direct mapping
};

const ROTATION_LIMITS = {
  head: {
    pitch: { min: -0.5, max: 0.5 },
    yaw: { min: -0.8, max: 0.8 },
    roll: { min: -0.3, max: 0.3 },
    pitchFactor: 1,
    yawFactor: 1,
    rollFactor: 1
  },
  neck: {
    pitch: { min: -0.3, max: 0.3 },
    yaw: { min: -0.4, max: 0.4 },
    roll: { min: -0.2, max: 0.2 },
    pitchFactor: 0.2, // Neck takes 20% of pitch
    yawFactor: 0.2,   // Neck takes 20% of yaw
    rollFactor: 0.2   // Neck takes 20% of roll
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

export const PresenceAvatar: React.FC<PresenceAvatarProps> = ({
  avatarUrl,
  position = [0, 0, 0],
  scale = 1, // Default group scale to 1, primitive scale is separate
  trackingData
}) => {
  console.log('[PresenceAvatar] Component starting with:', { avatarUrl, trackingData: !!trackingData });
  
  // All hooks must be called unconditionally at the top
  const groupRef = useRef<THREE.Group>(null); // Keep a ref for the returned group
  const { scene } = useGLTF(avatarUrl);
  const modelRootRef = useRef<THREE.Object3D | null>(null);
  
  // Load basic idle animation - most subtle option
  const animationUrl = '/animations/idle.glb';
  const { animations: idleAnimations } = useGLTF(animationUrl);
  
  // All the refs
  const meshWithMorphTargets = useRef<THREE.Mesh | null>(null);
  const headBone = useRef<THREE.Bone | null>(null);
  const neckBone = useRef<THREE.Bone | null>(null);

  const jawBone = useRef<THREE.Bone | null>(null);
  const eyeBone = useRef<THREE.Bone | null>(null);

  // Initial pose references
  const initialHeadLocalQuaternionRef = useRef<THREE.Quaternion | null>(null);
  const initialNeckLocalQuaternionRef = useRef<THREE.Quaternion | null>(null);
  const trackingDataRef = useRef<TrackingData | null>(null);
  const frameCountRef = useRef<number>(0);
  const lastDebugLogRef = useRef<number>(0);
  const morphTargetMapping = useRef<{ logged?: boolean }>({});
  
  // Clone the scene using useMemo to prevent re-cloning on every render
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    const cloned = SkeletonUtils.clone(scene);
    return cloned;
  }, [scene]);
  
  // Setup animation mixer and actions - apply to cloned scene
  const { actions, mixer } = useAnimations(idleAnimations, clonedScene || groupRef);
  
  // Play idle animation when actions are available
  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      console.log('[PresenceAvatar] Available animations:', Object.keys(actions));
      const firstAction = Object.values(actions)[0];
      if (firstAction) {
        // Reset and play the animation
        firstAction.reset();
        firstAction.setLoop(THREE.LoopRepeat, Infinity);
        // Set lower weight to allow head rotation to override
        firstAction.setEffectiveWeight(0.8);
        // Slow down the animation for more subtle breathing
        firstAction.setEffectiveTimeScale(0.5); // Half speed
        firstAction.play();
        console.log('[PresenceAvatar] Playing basic idle animation - action started at 0.5x speed');
      }
    } else {
      console.log('[PresenceAvatar] No animation actions available');
    }
  }, [actions]);

  // useEffect for model setup
  useEffect(() => {
    if (!clonedScene) return;

    console.log('[PresenceAvatar] useEffect: scene loaded, setting up model...');
    
    // Set the model root reference
    modelRootRef.current = clonedScene;
    
    // Find mesh with morph targets
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        console.log('[PresenceAvatar] Found mesh with morph targets:', child.name, 'Targets:', Object.keys(child.morphTargetDictionary).length);
        meshWithMorphTargets.current = child;
      }
    });

    // Find and configure bones
    const allBones: string[] = [];
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        console.log('[PresenceAvatar] Found mesh with morph targets:', child.name);
        meshWithMorphTargets.current = child;
      }
      if (child instanceof THREE.Bone) {
        allBones.push(child.name);
        const lowerName = child.name.toLowerCase();
        
        // Head bone - check for various naming conventions
        if ((lowerName.includes('head') || lowerName === 'head' || lowerName.includes('head_01')) 
            && !lowerName.includes('neck') 
            && !lowerName.includes('eye')
            && !lowerName.includes('jaw')
            && !lowerName.includes('top')  // Exclude HeadTop_End
            && !lowerName.includes('end')) { // Exclude end bones
          console.log('[PresenceAvatar] Found head bone:', child.name);
          headBone.current = child;
        }
        
        // Neck bone - check for various naming conventions
        if (lowerName.includes('neck') || lowerName === 'neck' || lowerName.includes('neck_01')) {
          console.log('[PresenceAvatar] Found neck bone:', child.name);
          neckBone.current = child;
        }
      }
    });
    
    console.log('[PresenceAvatar] All bones found in scene:', allBones);
    console.log('[PresenceAvatar] Head bone set:', !!headBone.current, headBone.current?.name);
    console.log('[PresenceAvatar] Neck bone set:', !!neckBone.current, neckBone.current?.name);
    
    // Fix any default pose issues first
    if (headBone.current) {
      // Reset head to neutral position before storing initial rotation
      headBone.current.rotation.x = 0;
      headBone.current.rotation.y = 0;
      headBone.current.rotation.z = 0;
      // Now store the corrected initial rotation
      initialHeadLocalQuaternionRef.current = headBone.current.quaternion.clone();
      console.log('[PresenceAvatar] Reset and stored head initial position');
    }
    
    if (neckBone.current) {
      // Reset neck to neutral position
      neckBone.current.rotation.x = 0;
      neckBone.current.rotation.y = 0;
      neckBone.current.rotation.z = 0;
      // Store the corrected initial rotation
      initialNeckLocalQuaternionRef.current = neckBone.current.quaternion.clone();
      console.log('[PresenceAvatar] Reset and stored neck initial position');
    }

    // Fix T-pose by adjusting arm positions for more natural idle pose
    // Commenting out to let animation take control
    /*
    const leftUpperArm = clonedScene.getObjectByName('LeftArm') || clonedScene.getObjectByName('mixamorigLeftArm');
    const rightUpperArm = clonedScene.getObjectByName('RightArm') || clonedScene.getObjectByName('mixamorigRightArm');
    const leftForeArm = clonedScene.getObjectByName('LeftForeArm') || clonedScene.getObjectByName('mixamorigLeftForeArm');
    const rightForeArm = clonedScene.getObjectByName('RightForeArm') || clonedScene.getObjectByName('mixamorigRightForeArm');

    if (leftUpperArm) {
      leftUpperArm.rotation.z = Math.PI / 4; // Rotate left arm down
      console.log('[PresenceAvatar] Fixed left upper arm T-pose');
    }
    if (rightUpperArm) {
      rightUpperArm.rotation.z = -Math.PI / 4; // Rotate right arm down
      console.log('[PresenceAvatar] Fixed right upper arm T-pose');
    }
    if (leftForeArm) {
      leftForeArm.rotation.y = Math.PI / 6; // Slight bend in left forearm
    }
    if (rightForeArm) {
      rightForeArm.rotation.y = -Math.PI / 6; // Slight bend in right forearm
    }
    */

    console.log('[PresenceAvatar] Model setup complete', {
      hasMorphTargets: !!meshWithMorphTargets.current,
      hasHeadBone: !!headBone.current,
      hasNeckBone: !!neckBone.current
    });

    // Add the cloned scene to the group
    if (groupRef.current) {
      // Clear any existing children
      while (groupRef.current.children.length > 0) {
        groupRef.current.remove(groupRef.current.children[0]);
      }
      groupRef.current.add(clonedScene);
    }

    console.log('[PresenceAvatar] Model setup complete', {
      hasMorphTargets: !!meshWithMorphTargets.current,
      hasHeadBone: !!headBone.current,
      hasNeckBone: !!neckBone.current
    });
  }, [clonedScene]);

  // useEffect for tracking data
  useEffect(() => {
    if (trackingData) {
      console.log('[PresenceAvatar] Tracking data updated:', trackingData);
      
      let headRotation: { pitch: number; yaw: number; roll: number; } | undefined;
      
      if (trackingData.head?.rotation) {
        const rot = trackingData.head.rotation;
        // Check if it's already in pitch/yaw/roll format
        if ('pitch' in rot && 'yaw' in rot && 'roll' in rot) {
          headRotation = rot as { pitch: number; yaw: number; roll: number; };
        } else if ('x' in rot && 'y' in rot && 'z' in rot && 'w' in rot) {
          // Convert quaternion to euler angles
          const quat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);
          const euler = new THREE.Euler().setFromQuaternion(quat);
          headRotation = {
            pitch: euler.x,
            yaw: euler.y,
            roll: euler.z
          };
        }
      } else if (trackingData.headRotation) {
        headRotation = trackingData.headRotation;
      }
      
      const convertedTrackingData = {
        facialExpressions: trackingData.face?.shapes || trackingData.facialExpressions || {},
        headRotation
      };
      
      trackingDataRef.current = convertedTrackingData;
      
      if (convertedTrackingData.facialExpressions) {
        console.log('[PresenceAvatar] Facial expressions:', Object.keys(convertedTrackingData.facialExpressions));
      }
      if (convertedTrackingData.headRotation) {
        console.log('[PresenceAvatar] Head rotation data present:', convertedTrackingData.headRotation);
      }
    } else {
      // Keep an empty object instead of null to avoid runtime errors
      trackingDataRef.current = { 
        facialExpressions: {} as FacialExpressions, 
        headRotation: undefined 
      };
    }
  }, [trackingData]);

  // useFrame hook for real-time updates
  useFrame((state, delta) => {
    if (frameCountRef.current % 300 === 0) { // Log every 5 seconds
      console.log('[PresenceAvatar] useFrame is running, frame:', frameCountRef.current);
      console.log('[PresenceAvatar] Bone refs in useFrame:', {
        headBone: !!headBone.current,
        headBoneName: headBone.current?.name,
        neckBone: !!neckBone.current,
        neckBoneName: neckBone.current?.name
      });
    }
    frameCountRef.current++;
    
    // Update animation mixer
    if (mixer) {
      mixer.update(delta);
    }
    
    const tracking = trackingDataRef.current;
    if (!tracking || !meshWithMorphTargets.current || !meshWithMorphTargets.current.morphTargetInfluences) {
      return;
    }

    if (!trackingDataRef.current) {
      // Apply idle animation when no tracking data
      if (headBone.current) {
        const time = Date.now() * 0.001;
        const idleNod = Math.sin(time * 0.5) * 0.05;
        headBone.current.rotation.x = idleNod;
      }
      if (frameCountRef.current % 300 === 0) { // Every 5 seconds at 60fps
        console.log('[PresenceAvatar useFrame] No tracking data');
      }
      return;
    }

if (frameCountRef.current % 60 === 0) { // Every second at 60fps
  console.log('[PresenceAvatar useFrame] Processing tracking data:', trackingDataRef.current);
}

const mesh = meshWithMorphTargets.current;
const expressions = tracking?.facialExpressions ?? tracking?.expressions;

// Apply facial expressions with more reasonable amplification
if (mesh.morphTargetDictionary && Object.keys(mesh.morphTargetDictionary).length > 0 && expressions) {
  const expressionLerpFactor = 0.3; // Smoothing factor for expression changes
  const frameMorphTargetValues: Record<string, number> = {}; // Stores target values for current frame

  // Calculate target values for each RPM blendshape based on ML5 expressions and mapping
  Object.entries(expressions).forEach(([ml5Key, rawValue]) => {
    if (typeof rawValue !== 'number') {
      // console.warn(`[PresenceAvatar] Non-numeric rawValue for ${ml5Key}:`, rawValue);
      return;
    }

        const mapping = ML5_TO_RPM_MAPPING[ml5Key as keyof typeof ML5_TO_RPM_MAPPING];
        if (mapping) {
          const amplification = mapping.amplify ?? 1.0;
          const numericRawValue = Number(rawValue); // Ensure it's a number
          const amplifiedValue = MathUtils.clamp(numericRawValue * amplification, 0, 1);

          mapping.targets.forEach(rpmTargetName => {
            // If multiple ML5 keys map to the same RPM target, take the max value
            frameMorphTargetValues[rpmTargetName] = Math.max(frameMorphTargetValues[rpmTargetName] || 0, amplifiedValue);
            
            if (mapping.debug && frameCountRef.current % 120 === 0) { // Log less frequently
               console.log(`[PresenceAvatar] [${ml5Key} -> ${rpmTargetName}] Raw: ${numericRawValue.toFixed(3)}, Amp: ${amplification.toFixed(1)}, TargetVal: ${amplifiedValue.toFixed(3)}`);
            }
          });
        }
      }); // End of Object.entries(expressions).forEach


      // Apply the calculated values to the actual morph targets with smoothing
      if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
        // Apply values for expressions active in the current frame
        Object.entries(frameMorphTargetValues).forEach(([rpmTargetName, targetValue]) => {
            const morphIndex = mesh.morphTargetDictionary![rpmTargetName];
            if (morphIndex !== undefined) {
                mesh.morphTargetInfluences![morphIndex] = lerp(
                    mesh.morphTargetInfluences![morphIndex],
                    targetValue,
                    expressionLerpFactor 
                );
            }
        });

        // Smoothly return inactive morph targets to 0
        // Iterate over all known RPM morph targets in the dictionary
        Object.keys(mesh.morphTargetDictionary).forEach(rpmTargetName => {
            if (!frameMorphTargetValues.hasOwnProperty(rpmTargetName)) {
                const morphIndex = mesh.morphTargetDictionary![rpmTargetName];
                if (morphIndex !== undefined && mesh.morphTargetInfluences![morphIndex] > 0.001) { // Avoid lerping if already near zero
                    mesh.morphTargetInfluences![morphIndex] = lerp(
                        mesh.morphTargetInfluences![morphIndex],
                        0,
                        expressionLerpFactor
                    );
                }
            }
        });
      }

      // Optional: Log active blendshapes count periodically
      const now = Date.now();
      if (now - lastDebugLogRef.current > 5000) { // Log every 5 seconds
        let activeBlendshapes = 0;
        let activeDetails = '';
        if (mesh.morphTargetInfluences && mesh.morphTargetDictionary) {
            Object.keys(mesh.morphTargetDictionary).forEach(name => {
                const idx = mesh.morphTargetDictionary![name];
                if (mesh.morphTargetInfluences![idx] > 0.05) {
                    activeBlendshapes++;
                    if (activeBlendshapes <= 5) activeDetails += `${name}: ${mesh.morphTargetInfluences![idx].toFixed(2)} `; 
                }
            });
        }
        const totalMorphTargets = Object.keys(mesh.morphTargetDictionary || {}).length;
        console.log(`[PresenceAvatar] Active blendshapes: ${activeBlendshapes}/${totalMorphTargets}. Sample: ${activeDetails}`);
        if (!morphTargetMapping.current.logged && mesh.morphTargetDictionary) {
          // console.log('[PresenceAvatar] Available morph targets:', Object.keys(mesh.morphTargetDictionary));
          morphTargetMapping.current.logged = true; // Log full list only once if needed
        }
        lastDebugLogRef.current = now;
      }
    } // End of if (mesh.morphTargetDictionary && ... && expressions)

    // Debug log bone status periodically
    if (frameCountRef.current % 60 === 0) {
      console.log('[PresenceAvatar] Bone and tracking status:', {
        hasHeadBone: !!headBone.current,
        hasNeckBone: !!neckBone.current,
        headBoneName: headBone.current?.name,
        neckBoneName: neckBone.current?.name,
        hasTrackingData: !!trackingDataRef.current,
        hasHeadRotation: !!trackingDataRef.current?.headRotation,
        trackingDataKeys: trackingDataRef.current ? Object.keys(trackingDataRef.current) : [],
        headRotationValue: trackingDataRef.current?.headRotation
      });
    }
    
    if (frameCountRef.current % 60 === 0) {
      console.log('[PresenceAvatar] About to check bones:', {
        headBone: !!headBone.current,
        neckBone: !!neckBone.current,
        condition: !!(headBone.current && neckBone.current)
      });
    }
    
    if (headBone.current && neckBone.current) {
      console.log('[PresenceAvatar] Both bones found, checking for head rotation data...');
      if (trackingDataRef.current?.headRotation) {
        const { pitch, yaw, roll } = trackingDataRef.current.headRotation;
        
        // Debug log raw values periodically
        if (frameCountRef.current % 60 === 0) {
          console.log('[PresenceAvatar] Head rotation raw values (radians):', { pitch, yaw, roll });
          console.log('[PresenceAvatar] Head rotation raw values (degrees):', { 
            pitch: pitch * 180 / Math.PI, 
            yaw: yaw * 180 / Math.PI, 
            roll: roll * 180 / Math.PI 
          });
          console.log('[PresenceAvatar] Applying head rotation to bones');
        }
        
        // The ML5 values are already in radians, with ranges:
        // Pitch: ±45° (±0.785 rad) - looking up/down
        // Yaw: ±45° (±0.785 rad) - looking left/right  
        // Roll: ±35° (±0.611 rad) - tilting head left/right
        
        // Apply slightly wider constraints to preserve natural movement
        const constrainedPitch = MathUtils.clamp(pitch, -Math.PI/3, Math.PI / 2);  // -60° to +90° (increased downward range)
        const constrainedYaw = MathUtils.clamp(yaw, -Math.PI/3, Math.PI/3);      // ±60°
        const constrainedRoll = MathUtils.clamp(roll, -Math.PI/4, Math.PI/4);    // ±45°
        
        // Distribution between head and neck for more natural movement
        const headPitchFactor = 1.0;   // 100% of pitch on head
        const neckPitchFactor = 0.0;   // 0% on neck
        const headYawFactor = 0.75;    // 75% of yaw on head  
        const neckYawFactor = 0.25;    // 25% on neck
        const headRollFactor = 0.85;   // 85% of roll on head (neck doesn't tilt much)
        const neckRollFactor = 0.15;   // 15% on neck
        
        // Smooth interpolation factor - slightly faster for more responsive movement
        const lerpFactor = 0.25;
        
        // Apply rotations with proper axis mapping for Three.js coordinate system
        // Three.js uses right-handed Y-up coordinate system:
        // - X axis: pitch (nodding yes)
        // - Y axis: yaw (shaking head no) 
        // - Z axis: roll (tilting head to shoulder)
        
        // Head rotation - apply mirroring where needed for natural movement
        const targetHeadX = constrainedPitch * headPitchFactor;      // Pitch: positive = look down
        const targetHeadY = constrainedYaw * headYawFactor;          // Yaw: positive = look left
        const targetHeadZ = constrainedRoll * headRollFactor;        // Roll: positive = tilt right
        
        // Apply smooth interpolation to head bone
        headBone.current.rotation.x = MathUtils.lerp(headBone.current.rotation.x, targetHeadX, lerpFactor);
        headBone.current.rotation.y = MathUtils.lerp(headBone.current.rotation.y, targetHeadY, lerpFactor);
        headBone.current.rotation.z = MathUtils.lerp(headBone.current.rotation.z, targetHeadZ, lerpFactor);
        
        // Neck rotation - smaller movements for realism
        const targetNeckX = constrainedPitch * neckPitchFactor;
        const targetNeckY = constrainedYaw * neckYawFactor;
        const targetNeckZ = constrainedRoll * neckRollFactor;
        
        // Apply smooth interpolation to neck bone
        neckBone.current.rotation.x = MathUtils.lerp(neckBone.current.rotation.x, targetNeckX, lerpFactor);
        neckBone.current.rotation.y = MathUtils.lerp(neckBone.current.rotation.y, targetNeckY, lerpFactor);
        neckBone.current.rotation.z = MathUtils.lerp(neckBone.current.rotation.z, targetNeckZ, lerpFactor);
        
        // Log current bone rotations periodically for debugging
        if (frameCountRef.current % 120 === 0) {
          console.log('[PresenceAvatar] Current head bone rotation (degrees):', {
            x: headBone.current.rotation.x * 180 / Math.PI,
            y: headBone.current.rotation.y * 180 / Math.PI,
            z: headBone.current.rotation.z * 180 / Math.PI
          });
          console.log('[PresenceAvatar] Current neck bone rotation (degrees):', {
            x: neckBone.current.rotation.x * 180 / Math.PI,
            y: neckBone.current.rotation.y * 180 / Math.PI,
            z: neckBone.current.rotation.z * 180 / Math.PI
          });
        }
        
      } else {
        // No tracking data - smoothly return to default pose
        const returnSpeed = 0.05;
        
        // Return head to initial pose
        if (headBone.current && initialHeadLocalQuaternionRef.current) {
          headBone.current.quaternion.slerp(initialHeadLocalQuaternionRef.current, returnSpeed);
        }
        
        // Return neck to initial pose
        if (neckBone.current && initialNeckLocalQuaternionRef.current) {
          neckBone.current.quaternion.slerp(initialNeckLocalQuaternionRef.current, returnSpeed);
        }
      }
    } // End of if (headBone.current && neckBone.current)
  }); // End of useFrame

// Now check if scene is loaded after all hooks
if (!clonedScene) {
  console.warn('[PresenceAvatar] GLTF scene not loaded or available, rendering null.');
  return null;
}

console.log('[PresenceAvatar] Rendering. Scene:', clonedScene, 'ModelRootRef:', modelRootRef.current);
return (
  <group ref={groupRef} position={position} scale={scale}>
    {modelRootRef.current && <primitive object={modelRootRef.current} dispose={null} />}
  </group>
);
};

export default PresenceAvatar;