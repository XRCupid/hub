import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useGraph } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import { MathUtils } from 'three';
import type { TrackingData, FacialExpressions } from '../types/tracking';

const DEFAULT_AVATAR_URL = '/avatars/coach_grace.glb';

interface PresenceAvatarProps {
  avatarUrl?: string;
  position?: [number, number, number] | THREE.Vector3;
  scale?: number; // Overall scale for the group
  trackingData?: TrackingData; // For user's face tracking (ML5)
  animationName?: string; // e.g., 'idle', 'talking'
  emotionalBlendshapes?: Record<string, number>; // For Hume EVI prosody
  audioData?: Uint8Array; // For lip-sync from Hume EVI audio
  participantId?: string;
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
  'mouthOpen': { targets: ['jawOpen'], amplify: 0.8, debug: true },
  'mouthSmile': { targets: ['mouthSmileLeft', 'mouthSmileRight'], amplify: 7.0 }, // Restore high amplification for smiles
  'mouthFrown': { targets: ['mouthFrownLeft', 'mouthFrownRight'], amplify: 7.0 },
  'mouthPucker': { targets: ['mouthPucker'], amplify: 1.8 },
  'browInnerUp': { targets: ['browInnerUp'], amplify: 1.5 },
  'browUpLeft': { targets: ['browOuterUpLeft'], amplify: 1.5 },
  'browUpRight': { targets: ['browOuterUpRight'], amplify: 1.5 },
  'eyebrowRaiseLeft': { targets: ['browOuterUpLeft'], amplify: 5.0 }, // Restore high amplification
  'eyebrowRaiseRight': { targets: ['browOuterUpRight'], amplify: 5.0 },
  'eyebrowFurrow': { targets: ['browDownLeft', 'browDownRight'], amplify: 5.0 },
  'eyeSquintLeft': { targets: ['eyeSquintLeft'], amplify: 3.0 },
  'eyeSquintRight': { targets: ['eyeSquintRight'], amplify: 3.0 },
  'eyeWideLeft': { targets: ['eyeWideLeft'], amplify: 3.0 },
  'eyeWideRight': { targets: ['eyeWideRight'], amplify: 3.0 },
  'cheekPuff': { targets: ['cheekPuff'], amplify: 1.5 },
  'cheekSquintLeft': { targets: ['cheekSquintLeft'], amplify: 1.3 },
  'cheekSquintRight': { targets: ['cheekSquintRight'], amplify: 1.3 },
  'noseSneer': { targets: ['noseSneerLeft', 'noseSneerRight'], amplify: 1.5 },
  'jawLeft': { targets: ['jawLeft'], amplify: 1.2 },
  'jawRight': { targets: ['jawRight'], amplify: 1.2 },
  'mouthLeft': { targets: ['mouthLeft'], amplify: 1.5 },
  'mouthRight': { targets: ['mouthRight'], amplify: 1.5 },
  'mouthRollLower': { targets: ['mouthRollLower'], amplify: 1.5 },
  'mouthRollUpper': { targets: ['mouthRollUpper'], amplify: 1.5 },
  'mouthShrugLower': { targets: ['mouthShrugLower'], amplify: 1.5 },
  'mouthShrugUpper': { targets: ['mouthShrugUpper'], amplify: 1.5 },
  'mouthFunnel': { targets: ['mouthFunnel'], amplify: 1.5 },
  'mouthPress': { targets: ['mouthPressLeft', 'mouthPressRight'], amplify: 1.5 },
  'mouthLowerDown': { targets: ['mouthLowerDownLeft', 'mouthLowerDownRight'], amplify: 1.5 },
  'mouthUpperUp': { targets: ['mouthUpperUpLeft', 'mouthUpperUpRight'], amplify: 1.5 },
  'mouthPout': { targets: ['mouthPucker'], amplify: 1.8 } // Map pout to pucker with amplification
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

export const PresenceAvatar: React.FC<PresenceAvatarProps> = React.memo(({
  avatarUrl,
  trackingData,
  position = [0, 0, 0],
  scale = 1,
  participantId,
  animationName = 'idle',
  emotionalBlendshapes,
  audioData
}) => {
  // Determine if this is a coach avatar
  const isCoachAvatar = trackingData === undefined;
  const avatarType = isCoachAvatar ? 'coach' : 'user';
  
  // Debug: Add unique instance tracking
  const instanceIdRef = useRef(Math.random().toString(36).substr(2, 9));
  
  useEffect(() => {
    console.log(`[PresenceAvatar-${instanceIdRef.current}] Mounted:`, {
      avatarType,
      participantId,
      hasTrackingData: !!trackingData,
      avatarUrl,
      timestamp: Date.now()
    });
    return () => {
      console.log(`[PresenceAvatar-${instanceIdRef.current}] Unmounted`);
    };
  }, []);

  useEffect(() => {
    if (isCoachAvatar && emotionalBlendshapes && Object.keys(emotionalBlendshapes).length > 0) {
      console.log(`[PresenceAvatar-${instanceIdRef.current}] Emotional blendshapes:`, Object.keys(emotionalBlendshapes).length);
    }
    if (!isCoachAvatar && trackingData?.facialExpressions) {
      console.log(`[PresenceAvatar-${instanceIdRef.current}] Tracking data expressions:`, Object.keys(trackingData.facialExpressions).length);
    }
  }, [emotionalBlendshapes, trackingData, isCoachAvatar, avatarType]);

  // All hooks must be called unconditionally at the top
  const groupRef = useRef<THREE.Group>(null!); // Non-null assertion to avoid constant null checks
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
  
  // Clone the scene using useMemo to prevent re-cloning on every render
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    const cloned = SkeletonUtils.clone(scene);
    return cloned;
  }, [scene]);

  // Load basic idle animation - most subtle option
  const idleAnimationUrl = '/animations/feminine/idle/F_Standing_Idle_001.glb';
  const { animations: idleAnimations } = useGLTF(idleAnimationUrl);
  useGLTF.preload(idleAnimationUrl);

  // Load talking animations
  const talkingAnimationUrls = [
    '/animations/feminine/talk/F_Talking_Variations_001.glb',
    '/animations/feminine/talk/F_Talking_Variations_002.glb',
    '/animations/feminine/talk/F_Talking_Variations_003.glb',
    '/animations/feminine/talk/F_Talking_Variations_004.glb',
    '/animations/feminine/talk/F_Talking_Variations_005.glb',
    '/animations/feminine/talk/F_Talking_Variations_006.glb'
  ];
  
  // Load all talking animations separately
  const { animations: talking1 } = useGLTF(talkingAnimationUrls[0]);
  const { animations: talking2 } = useGLTF(talkingAnimationUrls[1]);
  const { animations: talking3 } = useGLTF(talkingAnimationUrls[2]);
  const { animations: talking4 } = useGLTF(talkingAnimationUrls[3]);
  const { animations: talking5 } = useGLTF(talkingAnimationUrls[4]);
  const { animations: talking6 } = useGLTF(talkingAnimationUrls[5]);
  
  // Combine all talking animations
  const talkingAnimations = useMemo(() => {
    return [...talking1, ...talking2, ...talking3, ...talking4, ...talking5, ...talking6];
  }, [talking1, talking2, talking3, talking4, talking5, talking6]);
  
  // Preload all animations
  talkingAnimationUrls.forEach(url => useGLTF.preload(url));
  
  // Combine all animations. Ensure names are unique if they aren't already.
  const allAnimations = useMemo(() => {
    // It's good practice to ensure animation names are unique if loaded from different files and might clash.
    // For now, assuming 'idle' and 'F_Talking_Variations_001' are distinct enough or come from files with unique animation names.
    return [...idleAnimations, ...talkingAnimations];
  }, [idleAnimations, talkingAnimations]);
  const { actions, mixer } = useAnimations(allAnimations, clonedScene || groupRef);
  
  const activeActionNameRef = useRef<string | null>(null);
  const lastTalkingAnimationRef = useRef<string | null>(null);

  // Play animations based on animationName prop
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) {
      console.log('[PresenceAvatar] No animation actions available to play.');
      return;
    }

    console.log('[PresenceAvatar] Available animation actions:', Object.keys(actions));

    // Find all talking animations
    const talkingAnimations = Object.keys(actions).filter(name => 
      name.toLowerCase().includes('talk') || 
      name.toLowerCase().includes('speak') ||
      name.toLowerCase().includes('f_talking')
    );
    
    if (talkingAnimations.length > 0) {
      console.log('[PresenceAvatar] Available talking animations:', talkingAnimations);
    }

    let targetActionName = '';
    if (animationName === 'talking' && talkingAnimations.length > 0) {
      // If we have multiple talking animations, pick one randomly (but not the same as last time)
      if (talkingAnimations.length > 1) {
        let availableAnimations = talkingAnimations.filter(anim => anim !== lastTalkingAnimationRef.current);
        if (availableAnimations.length === 0) {
          availableAnimations = talkingAnimations; // Reset if we've filtered everything out
        }
        targetActionName = availableAnimations[Math.floor(Math.random() * availableAnimations.length)];
        lastTalkingAnimationRef.current = targetActionName;
      } else {
        targetActionName = talkingAnimations[0];
      }
    } else if (actions['idle']) { // Default to 'idle' if available
      targetActionName = 'idle';
    } else if (Object.keys(actions).length > 0) { // Fallback to the first available animation if 'idle' is not found
        targetActionName = Object.keys(actions)[0];
        console.warn(`[PresenceAvatar] 'idle' animation not found, falling back to ${targetActionName}`);
    }

    if (!targetActionName || !actions[targetActionName]) {
        console.error(`[PresenceAvatar] Target animation '${targetActionName}' not found in actions.`);
        return;
    }

    const newAction = actions[targetActionName];
    const oldActionName = activeActionNameRef.current;
    const oldAction = oldActionName ? actions[oldActionName] : null;

    if (!newAction) {
      console.error(`[PresenceAvatar] newAction '${targetActionName}' is unexpectedly null or undefined.`);
      return;
    }

    if (newAction === oldAction && newAction?.isRunning()) {
        return; // Already playing the target animation
    }

    // Fade out old action if it exists and is different
    if (oldAction && oldAction !== newAction) {
      oldAction.fadeOut(0.3);
    }

    // Configure and play new action
    newAction.reset();
    newAction.setLoop(THREE.LoopRepeat, Infinity);
    newAction.setEffectiveWeight(1.0); // Full weight for primary action
    newAction.setEffectiveTimeScale(animationName === 'talking' ? 0.4 : 0.3); // Talking slowed to 0.4, idle at 0.3
    newAction.fadeIn(0.3).play();

    activeActionNameRef.current = targetActionName;
    console.log(`[PresenceAvatar] Switched animation to: ${targetActionName}`);

  }, [actions, animationName]);

  // useEffect for model setup
  useEffect(() => {
    if (!clonedScene) return;

    console.log('[PresenceAvatar] useEffect: scene loaded, setting up model...');
    
    // Set the model root reference
    modelRootRef.current = clonedScene;
    
    // Find mesh with morph targets
    clonedScene.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        console.log(`[PresenceAvatar-${instanceIdRef.current}] Found mesh with morph targets:`, {
          avatarType,
          meshId: child.uuid,
          morphTargets: Object.keys(child.morphTargetDictionary).length,
          mesh: child
        });
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
      // Track if tracking data is updated - removed to prevent re-renders
      // console.log('[PresenceAvatar] Tracking data updated:', trackingData);
      
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
      
      if (!headRotation && trackingData.rotation) {
        headRotation = trackingData.rotation;
      }
      
      if (!headRotation && trackingData.head) {
        // Convert head object to headRotation format if needed
        const head = trackingData.head as any;
        if (head.pitch !== undefined || head.yaw !== undefined || head.roll !== undefined) {
          headRotation = head;
        }
      }
      
      // Ensure we have valid rotation values
      if (!headRotation || typeof headRotation !== 'object') {
        headRotation = { pitch: 0, yaw: 0, roll: 0 };
      }
      
      // Ensure all rotation values are numbers
      headRotation = {
        pitch: typeof headRotation.pitch === 'number' ? headRotation.pitch : 0,
        yaw: typeof headRotation.yaw === 'number' ? headRotation.yaw : 0,
        roll: typeof headRotation.roll === 'number' ? headRotation.roll : 0
      };
      
      const convertedTrackingData = {
        facialExpressions: trackingData.face?.shapes || trackingData.facialExpressions || {},
        headRotation
      };
      
      trackingDataRef.current = convertedTrackingData;
      
      if (convertedTrackingData.facialExpressions && Object.keys(convertedTrackingData.facialExpressions).length > 0) {
        console.log('[PresenceAvatar] Facial expressions:', Object.keys(convertedTrackingData.facialExpressions).length);
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

  // Process tracking data with memoization to avoid unnecessary recalculations
  const processedTrackingData = useMemo(() => {
    if (!trackingData || trackingData === undefined) {
      return null;
    }
    
    // Process the tracking data directly here instead of relying on ref
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
    
    if (!headRotation && trackingData.rotation) {
      headRotation = trackingData.rotation;
    }
    
    if (!headRotation && trackingData.head) {
      // Convert head object to headRotation format if needed
      const head = trackingData.head as any;
      if (head.pitch !== undefined || head.yaw !== undefined || head.roll !== undefined) {
        headRotation = head;
      }
    }
    
    // Ensure we have valid rotation values
    if (!headRotation || typeof headRotation !== 'object') {
      headRotation = { pitch: 0, yaw: 0, roll: 0 };
    }
    
    // Ensure all rotation values are numbers
    headRotation = {
      pitch: typeof headRotation.pitch === 'number' ? headRotation.pitch : 0,
      yaw: typeof headRotation.yaw === 'number' ? headRotation.yaw : 0,
      roll: typeof headRotation.roll === 'number' ? headRotation.roll : 0
    };
    
    const processed = {
      facialExpressions: trackingData.face?.shapes || trackingData.facialExpressions || {},
      headRotation
    };
    
    // Debug log to verify data is being processed
    if (Object.keys(processed.facialExpressions).length > 0) {
      console.log('[PresenceAvatar] Processed tracking data with', Object.keys(processed.facialExpressions).length, 'expressions');
    }
    
    return processed;
  }, [trackingData]);

  // Add frustum culling and LOD
  useEffect(() => {
    if (!clonedScene) return;
    
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.frustumCulled = true;
        // Reduce texture size if possible
        if (child.material && 'map' in child.material && child.material.map) {
          child.material.map.minFilter = THREE.LinearMipMapLinearFilter;
          child.material.map.generateMipmaps = true;
        }
      }
    });
  }, [clonedScene]);

  // useFrame hook for real-time updates
  useFrame((state, delta) => {
    if (!modelRootRef.current) return;

    const currentFrameCount = state.clock.elapsedTime * 60; // Approximate frame count
    frameCountRef.current = Math.floor(currentFrameCount);
    
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
        headBone.current.rotation.x = lerp(headBone.current.rotation.x, idleNod, 0.1);
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
    // Initialize target morph values for this frame
    const frameMorphTargetValues: Record<string, number> = {};
    const expressionLerpFactor = 0.7; // Increased for near 1:1 responsiveness
    const hasEmotionalBlendshapes = emotionalBlendshapes && Object.keys(emotionalBlendshapes).length > 0;
    
    // Determine avatar type based on whether tracking data exists
    const avatarType = trackingData === undefined ? 'coach' : 'user';
    const isCoachAvatar = avatarType === 'coach';
    
    // Lip Sync Override (if talking and audioData is present) - APPLY FIRST
    if (frameCountRef.current % 30 === 0) {
      console.log('[PresenceAvatar] Lip sync check:', {
        animationName,
        hasMorphTargetDictionary: !!mesh.morphTargetDictionary,
        morphTargetKeys: mesh.morphTargetDictionary ? Object.keys(mesh.morphTargetDictionary).slice(0, 10) : [],
        hasAudioData: !!audioData && audioData.length > 0,
        isCoachAvatar,
        meshType: mesh.type,
        meshName: mesh.name
      });
    }
    
    if (animationName === 'talking' && audioData && audioData.length > 0 && mesh.morphTargetDictionary) {
      // TEST MODE: Force lip sync movement when talking
      const testMode = false; // Disable test mode now that we know it works!
      
      if (testMode && isCoachAvatar) {
        // Generate a sine wave for testing mouth movement
        const time = Date.now() / 1000;
        const testValue = (Math.sin(time * 5) + 1) * 0.5; // 0 to 1 oscillating value
        
        console.log('[PresenceAvatar] TEST MODE - Forcing lip sync:', testValue);
        
        // Try to apply to ALL possible mouth/jaw targets
        const allMouthTargets = [
          'jawOpen', 'mouthOpen', 'viseme_aa', 'viseme_O', 'mouthSmileLeft', 'mouthSmileRight', 'mouthLeft', 'mouthRight', 
          'mouthPucker', 'mouthFunnel', 'mouthDimpleLeft', 'mouthDimpleRight',
          'mouthStretchLeft', 'mouthStretchRight', 'mouthRollLower', 'mouthRollUpper',
          'mouthShrugLower', 'mouthShrugUpper', 'mouthPressLeft', 'mouthPressRight',
          'mouthLowerDownLeft', 'mouthLowerDownRight', 'mouthUpperUpLeft', 'mouthUpperUpRight'
        ];
        
        let foundAnyTarget = false;
        allMouthTargets.forEach(target => {
          if (mesh.morphTargetDictionary && mesh.morphTargetDictionary[target] !== undefined) {
            const morphIndex = mesh.morphTargetDictionary[target];
            if (mesh.morphTargetInfluences && morphIndex !== undefined) {
              mesh.morphTargetInfluences[morphIndex] = testValue;
              foundAnyTarget = true;
              if (frameCountRef.current % 30 === 0) { // Log less frequently
                console.log(`[PresenceAvatar] TEST MODE - Applied to ${target}:`, testValue);
              }
            }
          }
        });
        
        if (!foundAnyTarget && frameCountRef.current % 60 === 0) {
          console.error('[PresenceAvatar] TEST MODE - No mouth morph targets found! Available targets:', 
            Object.keys(mesh.morphTargetDictionary || {}));
        }
        
        return; // Skip normal lip sync processing in test mode
      }
      
      // Normal lip sync processing
      let totalEnergy = 0;
      const relevantBins = Math.min(64, audioData.length); // Increased to 64 for even wider range
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
      const combinedEnergy = Math.max(averageEnergy, peakEnergy * 0.7); // Use whichever is higher
      
      // Try multiple possible jaw/mouth morph targets
      const possibleJawTargets = ['jawOpen', 'mouthOpen', 'viseme_aa', 'viseme_O', '0', '1'];
      let jawTargetFound = false;
      
      for (const target of possibleJawTargets) {
        if (mesh.morphTargetDictionary && mesh.morphTargetDictionary[target] !== undefined) {
          // Reduced multiplier for more natural mouth movement
          const lipSyncValue = MathUtils.clamp(combinedEnergy * 2.0, 0, 0.4); // Reduced from 10.0 to 2.0, max 0.4
          
          // Force set the value directly to ensure it's not overridden
          const morphIndex = mesh.morphTargetDictionary[target];
          if (mesh.morphTargetInfluences && morphIndex !== undefined) {
            mesh.morphTargetInfluences[morphIndex] = lipSyncValue;
          }
          
          // Also apply to related mouth shapes for more visible effect
          if (target === 'jawOpen' || target === 'mouthOpen') {
            // Apply to other mouth-related morph targets if they exist
            const relatedTargets = ['mouthSmileLeft', 'mouthSmileRight', 'mouthLeft', 'mouthRight', 'mouthPucker', 'mouthFunnel', 'mouthDimpleLeft', 'mouthDimpleRight'];
            relatedTargets.forEach(related => {
              if (mesh.morphTargetDictionary && mesh.morphTargetDictionary[related] !== undefined) {
                const relatedIndex = mesh.morphTargetDictionary[related];
                if (mesh.morphTargetInfluences) {
                  mesh.morphTargetInfluences[relatedIndex] = lipSyncValue * 0.3; // Reduced from 0.7 to 0.3
                }
              }
            });
          }
          
          // For RPM avatars with numbered targets, apply to secondary target
          if (target === '0' && mesh.morphTargetDictionary && mesh.morphTargetDictionary['1'] !== undefined) {
            const secondaryIndex = mesh.morphTargetDictionary['1'];
            if (mesh.morphTargetInfluences && secondaryIndex !== undefined) {
              mesh.morphTargetInfluences[secondaryIndex] = lipSyncValue * 0.5;
            }
          }
          
          // Debug lip sync every 30 frames - ALWAYS log when talking
          if (frameCountRef.current % 30 === 0) {
            console.log('[PresenceAvatar] Lip sync applied:', { 
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
          break; // Use the first available target
        }
      }
      
      if (!jawTargetFound) {
        console.warn('[PresenceAvatar] No jaw/mouth morph target found! Available targets:', Object.keys(mesh.morphTargetDictionary || {}));
      }
    }
    
    // Determine the source of expressions: Hume EVI or ML5 tracking data
    if (hasEmotionalBlendshapes) {
      // Priority 1: Hume EVI emotionalBlendshapes
      Object.entries(emotionalBlendshapes).forEach(([humeKey, rawValue]) => {
        if (typeof rawValue !== 'number') return;
        const mapping = HUME_TO_RPM_MAPPING[humeKey as keyof typeof HUME_TO_RPM_MAPPING];
        if (mapping) {
          const amplification = mapping.amplify ?? 1.0;
          const amplifiedValue = MathUtils.clamp(Number(rawValue) * amplification, 0, 1);
          frameMorphTargetValues[mapping.target] = Math.max(frameMorphTargetValues[mapping.target] || 0, amplifiedValue);
        }
      });
    } else if (tracking?.facialExpressions || tracking?.expressions) {
      // Priority 2: ML5 trackingData (check both facialExpressions and expressions)
      const expressions = tracking?.facialExpressions ?? tracking?.expressions;
      if (expressions) {
        // Debug log once per second
        if (frameCountRef.current % 60 === 0) {
          const significantExpressions = Object.entries(expressions)
            .filter(([key, value]) => typeof value === 'number' && value > 0.1)
            .map(([key, value]) => `${key}: ${(value as number).toFixed(2)}`);
          
          if (significantExpressions.length > 0) {
            console.log('[PresenceAvatar] Applying ML5 expressions:', significantExpressions.join(', '));
          }
        }
        
        Object.entries(expressions).forEach(([ml5Key, rawValue]) => {
          if (typeof rawValue !== 'number') return;
          const mapping = ML5_TO_RPM_MAPPING[ml5Key as keyof typeof ML5_TO_RPM_MAPPING];
          if (mapping) {
            const amplification = mapping.amplify ?? 1.0;
            const numericRawValue = Number(rawValue);
            const amplifiedValue = MathUtils.clamp(numericRawValue * amplification, 0, 1);
            
            // Debug log for high-value expressions
            if (amplifiedValue > 0.3 && (ml5Key.includes('mouth') || ml5Key.includes('smile'))) {
              console.log(`[PresenceAvatar] Expression: ${ml5Key} = ${amplifiedValue}`);
            }
            
            mapping.targets.forEach(rpmTargetName => {
              frameMorphTargetValues[rpmTargetName] = Math.max(frameMorphTargetValues[rpmTargetName] || 0, amplifiedValue);
            });
          }
        });
      }
    }

    // Apply the final frameMorphTargetValues to the actual morph targets with smoothing
    if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
      // Track which morph targets were set by lip sync to avoid overriding them
      const lipSyncTargets = ['jawOpen', 'mouthOpen', 'viseme_aa', 'viseme_O', 'mouthSmileLeft', 'mouthSmileRight', 'mouthLeft', 'mouthRight', 'mouthPucker'];
      
      Object.keys(mesh.morphTargetDictionary).forEach(rpmTargetName => {
        const morphIndex = mesh.morphTargetDictionary![rpmTargetName];
        if (morphIndex !== undefined) {
          // Skip smoothing for lip sync targets when talking
          if (animationName === 'talking' && lipSyncTargets.includes(rpmTargetName)) {
            // Lip sync values are already set directly, don't override them
            return;
          }
          
          const targetValue = frameMorphTargetValues[rpmTargetName] || 0;
          const currentValue = mesh.morphTargetInfluences![morphIndex] !== undefined ? mesh.morphTargetInfluences![morphIndex] : 0;
          
          if (Math.abs(currentValue - targetValue) > 0.001) { // Only lerp if there's a change
            mesh.morphTargetInfluences![morphIndex] = lerp(
              currentValue,
              targetValue,
              expressionLerpFactor
            );
          } else if (targetValue === 0 && currentValue !== 0) {
             mesh.morphTargetInfluences![morphIndex] = 0; // Snap to 0 if target is 0 and current is not already 0
          }
        }
      });
    }

    // Optional: Log active blendshapes count periodically
    const now = Date.now();
    if (now - lastDebugLogRef.current > 5000) { // Log every 5 seconds
      let activeBlendshapes = 0;
      if (mesh.morphTargetInfluences) {
        mesh.morphTargetInfluences.forEach((influence) => {
          if (influence > 0.01) activeBlendshapes++;
        });
      }
      if (activeBlendshapes > 0) {
        console.log(`[PresenceAvatar] Active blendshapes: ${activeBlendshapes}`);
      }
      lastDebugLogRef.current = now;
    }

    // Head rotation from tracking data with neck support
    if (tracking?.headRotation && headBone.current && !isCoachAvatar) {
      const headRotation = tracking.headRotation;
      
      if (headRotation && typeof headRotation === 'object') {
        const rotationLerpFactor = 0.8; // Restored high value for fast tracking
        
        // Apply rotation with minimal scaling and offset for pitch
        if (typeof headRotation.pitch === 'number') {
          // No manual offset needed - ML5 handles calibration
          const targetPitch = MathUtils.clamp(headRotation.pitch, -0.8, 0.8);
          headBone.current.rotation.x = lerp(headBone.current.rotation.x, targetPitch, rotationLerpFactor);
        }
        if (typeof headRotation.yaw === 'number') {
          const targetYaw = MathUtils.clamp(headRotation.yaw * 0.9, -0.7, 0.7); // Minimal scaling for responsiveness
          headBone.current.rotation.y = lerp(headBone.current.rotation.y, targetYaw, rotationLerpFactor);
        }
        if (typeof headRotation.roll === 'number') {
          const targetRoll = MathUtils.clamp(headRotation.roll * 0.8, -0.4, 0.4); // Minimal scaling
          headBone.current.rotation.z = lerp(headBone.current.rotation.z, targetRoll, rotationLerpFactor);
        }
        
        // Also apply subtle neck movement for more natural look
        if (neckBone.current) {
          neckBone.current.rotation.x = lerp(neckBone.current.rotation.x, headBone.current.rotation.x * 0.3, rotationLerpFactor);
          neckBone.current.rotation.y = lerp(neckBone.current.rotation.y, headBone.current.rotation.y * 0.3, rotationLerpFactor);
        }
      }
    } else if (isCoachAvatar && headBone.current) {
      // Coach avatar subtle idle movement
      const time = Date.now() * 0.001;
      const idleNod = Math.sin(time * 0.5) * 0.02;
      headBone.current.rotation.x = lerp(headBone.current.rotation.x, idleNod, 0.1);
    }
  });

// Now check if scene is loaded after all hooks
if (!clonedScene || !modelRootRef.current) {
  // Removed excessive logging
  // console.log('[PresenceAvatar] Rendering. Scene:', clonedScene, 'ModelRootRef:', modelRootRef.current);
  return null;
}

console.log('[PresenceAvatar] Rendering. Scene:', clonedScene, 'ModelRootRef:', modelRootRef.current);
return (
  <group ref={groupRef} position={position as [number, number, number]} scale={scale}>
    {modelRootRef.current && <primitive object={modelRootRef.current} dispose={null} />}
  </group>
);
});

export default PresenceAvatar;