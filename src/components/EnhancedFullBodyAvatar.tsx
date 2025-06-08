import React, { useRef, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useGraph } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import type { TrackingData } from '../types/tracking';

// Define PostureData type inline since the file might not exist
interface PostureKeypoint {
  x: number;
  y: number;
  confidence: number;
}

interface PostureData {
  keypoints: {
    [key: string]: PostureKeypoint;
  };
  confidence: number;
}

interface EnhancedFullBodyAvatarProps {
  avatarUrl: string;
  trackingData?: TrackingData;
  postureData?: PostureData | null;
  position?: [number, number, number];
  scale?: number;
  animationName?: string;
}

export const EnhancedFullBodyAvatar: React.FC<EnhancedFullBodyAvatarProps> = ({
  avatarUrl,
  trackingData,
  postureData,
  position = [0, 0, 0],
  scale = 1,
  animationName = 'idle'
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(avatarUrl);
  
  // Clone the scene to avoid modifying the cached version
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    return SkeletonUtils.clone(scene);
  }, [scene]);
  
  // Bone references
  const headBone = useRef<THREE.Bone | null>(null);
  const neckBone = useRef<THREE.Bone | null>(null);
  const spineBone = useRef<THREE.Bone | null>(null);
  const spine1Bone = useRef<THREE.Bone | null>(null);
  const spine2Bone = useRef<THREE.Bone | null>(null);
  const leftShoulderBone = useRef<THREE.Bone | null>(null);
  const rightShoulderBone = useRef<THREE.Bone | null>(null);
  const leftArmBone = useRef<THREE.Bone | null>(null);
  const rightArmBone = useRef<THREE.Bone | null>(null);
  const leftForeArmBone = useRef<THREE.Bone | null>(null);
  const rightForeArmBone = useRef<THREE.Bone | null>(null);
  const meshWithMorphTargets = useRef<THREE.Mesh | null>(null);
  
  // Initial rotations for idle pose
  const initialRotations = useRef<{[key: string]: THREE.Quaternion}>({});
  const initialEulers = useRef<{[key: string]: THREE.Euler}>({});
  
  // Debug
  const frameCount = useRef(0);
  const debugSpheres = useRef<{[key: string]: THREE.Mesh}>({});
  const prevArmRotations = useRef<{
    leftArm?: THREE.Quaternion;
    rightArm?: THREE.Quaternion;
    leftForeArm?: THREE.Quaternion;
    rightForeArm?: THREE.Quaternion;
  }>({});
  const [debugMode] = useState(true);
  
  // Load idle animation
  const idleAnimationUrl = '/animations/feminine/idle/F_Standing_Idle_001.glb';
  const { animations: idleAnimations } = useGLTF(idleAnimationUrl);
  useGLTF.preload(idleAnimationUrl);
  
  const { actions, mixer } = useAnimations(idleAnimations, clonedScene || groupRef);
  
  // Find bones and setup
  useEffect(() => {
    if (!clonedScene) return;
    
    console.log('[EnhancedFullBodyAvatar] Starting bone search...');
    
    // Find bones
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Bone) {
        const name = child.name.toLowerCase();
        
        // Log all bone names for debugging
        if (frameCount.current === 0) {
          console.log('[EnhancedFullBodyAvatar] Found bone:', child.name);
        }
        
        if (name.includes('head') && !name.includes('headtop')) {
          headBone.current = child;
          console.log('[EnhancedFullBodyAvatar] Found head bone:', child.name);
        } else if (name.includes('neck')) {
          neckBone.current = child;
          console.log('[EnhancedFullBodyAvatar] Found neck bone:', child.name);
        } 
        // Spine (check more specific names first)
        else if (name.includes('spine2')) {
          spine2Bone.current = child;
          console.log('[EnhancedFullBodyAvatar] Found spine2 bone:', child.name);
        } else if (name.includes('spine1')) {
          spine1Bone.current = child;
          console.log('[EnhancedFullBodyAvatar] Found spine1 bone:', child.name);
        } else if (name.includes('spine')) {
          spineBone.current = child;
          console.log('[EnhancedFullBodyAvatar] Found spine bone:', child.name);
        } 
        // Shoulders
        else if (name.includes('leftshoulder') || name.includes('shoulder_l')) {
          leftShoulderBone.current = child;
          console.log('[EnhancedFullBodyAvatar] Found left shoulder bone:', child.name);
        } else if (name.includes('rightshoulder') || name.includes('shoulder_r')) {
          rightShoulderBone.current = child;
          console.log('[EnhancedFullBodyAvatar] Found right shoulder bone:', child.name);
        } 
        // Arms (upper arm)
        else if ((name.includes('leftarm') || name.includes('arm_l') || name.includes('leftupperarm') || name.includes('upperarm_l')) && !name.includes('fore')) {
          leftArmBone.current = child;
          console.log('[EnhancedFullBodyAvatar] Found left arm bone:', child.name);
        }
        else if ((name.includes('rightarm') || name.includes('arm_r') || name.includes('rightupperarm') || name.includes('upperarm_r')) && !name.includes('fore')) {
          rightArmBone.current = child;
          console.log('[EnhancedFullBodyAvatar] Found right arm bone:', child.name);
        }
        // Forearms
        else if (name.includes('leftforearm') || name.includes('forearm_l') || name.includes('leftlowerarm') || name.includes('lowerarm_l')) {
          leftForeArmBone.current = child;
          console.log('[EnhancedFullBodyAvatar] Found left forearm bone:', child.name);
        }
        else if (name.includes('rightforearm') || name.includes('forearm_r') || name.includes('rightlowerarm') || name.includes('lowerarm_r')) {
          rightForeArmBone.current = child;
          console.log('[EnhancedFullBodyAvatar] Found right forearm bone:', child.name);
        }
      } else if (child instanceof THREE.SkinnedMesh && child.morphTargetDictionary) {
        meshWithMorphTargets.current = child as THREE.Mesh;
        console.log('[EnhancedFullBodyAvatar] Found mesh with morph targets:', child.name);
      }
    });
    
    console.log('[EnhancedFullBodyAvatar] Bone search complete:', {
      head: !!headBone.current,
      neck: !!neckBone.current,
      spine: !!spineBone.current,
      spine1: !!spine1Bone.current,
      spine2: !!spine2Bone.current,
      leftShoulder: !!leftShoulderBone.current,
      rightShoulder: !!rightShoulderBone.current,
      leftArm: !!leftArmBone.current,
      rightArm: !!rightArmBone.current,
      leftForeArm: !!leftForeArmBone.current,
      rightForeArm: !!rightForeArmBone.current
    });
    
    // Store initial rotations after idle animation settles
    setTimeout(() => {
      if (headBone.current) {
        initialRotations.current['head'] = headBone.current.quaternion.clone();
        initialEulers.current['head'] = headBone.current.rotation.clone();
      }
      if (neckBone.current) {
        initialRotations.current['neck'] = neckBone.current.quaternion.clone();
        initialEulers.current['neck'] = neckBone.current.rotation.clone();
      }
      if (spineBone.current) {
        initialRotations.current['spine'] = spineBone.current.quaternion.clone();
        initialEulers.current['spine'] = spineBone.current.rotation.clone();
      }
      if (spine1Bone.current) {
        initialRotations.current['spine1'] = spine1Bone.current.quaternion.clone();
        initialEulers.current['spine1'] = spine1Bone.current.rotation.clone();
      }
      if (spine2Bone.current) {
        initialRotations.current['spine2'] = spine2Bone.current.quaternion.clone();
        initialEulers.current['spine2'] = spine2Bone.current.rotation.clone();
      }
      if (leftShoulderBone.current) {
        initialRotations.current['leftShoulder'] = leftShoulderBone.current.quaternion.clone();
        initialEulers.current['leftShoulder'] = leftShoulderBone.current.rotation.clone();
      }
      if (rightShoulderBone.current) {
        initialRotations.current['rightShoulder'] = rightShoulderBone.current.quaternion.clone();
        initialEulers.current['rightShoulder'] = rightShoulderBone.current.rotation.clone();
      }
      if (leftArmBone.current) {
        initialRotations.current['leftArm'] = leftArmBone.current.quaternion.clone();
        initialEulers.current['leftArm'] = leftArmBone.current.rotation.clone();
      }
      if (rightArmBone.current) {
        initialRotations.current['rightArm'] = rightArmBone.current.quaternion.clone();
        initialEulers.current['rightArm'] = rightArmBone.current.rotation.clone();
      }
      if (leftForeArmBone.current) {
        initialRotations.current['leftForeArm'] = leftForeArmBone.current.quaternion.clone();
        initialEulers.current['leftForeArm'] = leftForeArmBone.current.rotation.clone();
      }
      if (rightForeArmBone.current) {
        initialRotations.current['rightForeArm'] = rightForeArmBone.current.quaternion.clone();
        initialEulers.current['rightForeArm'] = rightForeArmBone.current.rotation.clone();
      }
      console.log('[EnhancedFullBodyAvatar] Stored initial rotations for idle pose');
    }, 1000); // Wait for idle animation to settle
    
    // Manual idle pose setup as fallback
    if (leftArmBone.current && rightArmBone.current) {
      // Set arms to a more natural idle position (45 degrees down)
      leftArmBone.current.rotation.z = Math.PI / 4;
      rightArmBone.current.rotation.z = -Math.PI / 4;
      
      if (leftForeArmBone.current) {
        leftForeArmBone.current.rotation.y = Math.PI / 6;
      }
      if (rightForeArmBone.current) {
        rightForeArmBone.current.rotation.y = -Math.PI / 6;
      }
      
      console.log('[EnhancedFullBodyAvatar] Applied manual idle pose');
    }
    
    // Create debug spheres
    if (debugMode && groupRef.current) {
      const colors = {
        leftShoulder: 0xff0000,
        rightShoulder: 0xff0000,
        leftElbow: 0x00ff00,
        rightElbow: 0x00ff00,
        leftWrist: 0x0000ff,
        rightWrist: 0x0000ff
      };
      
      Object.entries(colors).forEach(([name, color]) => {
        const geometry = new THREE.SphereGeometry(0.03);
        const material = new THREE.MeshBasicMaterial({ color });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.visible = false;
        groupRef.current!.add(sphere);
        debugSpheres.current[name] = sphere;
      });
    }
  }, [clonedScene, debugMode]);
  
  // Play idle animation
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) {
      console.log('[EnhancedFullBodyAvatar] No animations loaded yet');
      return;
    }
    
    console.log('[EnhancedFullBodyAvatar] Available animations:', Object.keys(actions));
    
    const idleAction = Object.values(actions)[0];
    if (idleAction) {
      idleAction.reset().fadeIn(0.5).play();
      console.log('[EnhancedFullBodyAvatar] Playing idle animation');
    } else {
      console.log('[EnhancedFullBodyAvatar] No idle animation found');
    }
    
    return () => {
      if (idleAction) {
        idleAction.fadeOut(0.5);
      }
    };
  }, [actions]);
  
  // Apply tracking data
  useFrame((state, delta) => {
    frameCount.current++;
    
    // Update mixer for animations
    if (mixer) {
      mixer.update(delta);
    }
    
    // Apply head tracking from TrackingData
    if (trackingData && trackingData.headRotation) {
      const { pitch, yaw, roll } = trackingData.headRotation;
      
      // Enhanced head tracking with neck contribution
      if (neckBone.current) {
        // Neck takes about 30% of the rotation
        const neckPitch = pitch * 0.3;
        const neckYaw = yaw * 0.3;
        const neckRoll = roll * 0.2;
        
        neckBone.current.rotation.x = THREE.MathUtils.lerp(
          neckBone.current.rotation.x, 
          neckPitch, 
          0.15
        );
        neckBone.current.rotation.y = THREE.MathUtils.lerp(
          neckBone.current.rotation.y, 
          neckYaw, 
          0.15
        );
        neckBone.current.rotation.z = THREE.MathUtils.lerp(
          neckBone.current.rotation.z, 
          neckRoll, 
          0.15
        );
      }
      
      if (headBone.current) {
        // Head takes the remaining rotation
        const headPitch = pitch * 0.7;
        const headYaw = yaw * 0.7;
        const headRoll = roll * 0.5;
        
        // Apply rotation with damping for smooth movement
        const targetRotation = new THREE.Euler(
          headPitch,
          headYaw,
          headRoll,
          'XYZ'
        );
        
        headBone.current.rotation.x = THREE.MathUtils.lerp(
          headBone.current.rotation.x, 
          targetRotation.x, 
          0.2
        );
        headBone.current.rotation.y = THREE.MathUtils.lerp(
          headBone.current.rotation.y, 
          targetRotation.y, 
          0.2
        );
        headBone.current.rotation.z = THREE.MathUtils.lerp(
          headBone.current.rotation.z, 
          targetRotation.z, 
          0.15
        );
      }
    }
    
    // Apply facial expressions
    if (trackingData && trackingData.expressions && meshWithMorphTargets.current) {
      const mesh = meshWithMorphTargets.current;
      if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
        Object.entries(trackingData.expressions).forEach(([expression, value]) => {
          const morphIndex = mesh.morphTargetDictionary![expression];
          if (morphIndex !== undefined) {
            mesh.morphTargetInfluences![morphIndex] = value;
          }
        });
      }
    }
    
    // Apply arm tracking from PostureData
    if (postureData && postureData.keypoints) {
      const keypoints = postureData.keypoints;
      
      // Right arm tracking (tracking user's right arm to avatar's right arm)
      const rightShoulder = keypoints.rightShoulder;
      const rightElbow = keypoints.rightElbow;
      const rightWrist = keypoints.rightWrist;
      
      if (rightShoulder && rightShoulder.confidence > 0.15 && 
          rightElbow && rightElbow.confidence > 0.15 && 
          rightWrist && rightWrist.confidence > 0.15 && 
          leftArmBone.current) {  // Note: using leftArmBone for right tracking
        
        // Convert to normalized 3D positions
        const shoulderPos = new THREE.Vector3(
          (rightShoulder.x / 640 - 0.5) * 2,
          -(rightShoulder.y / 480 - 0.5) * 2,
          0
        );
        
        const elbowPos = new THREE.Vector3(
          (rightElbow.x / 640 - 0.5) * 2,
          -(rightElbow.y / 480 - 0.5) * 2,
          0.1
        );
        
        const wristPos = new THREE.Vector3(
          (rightWrist.x / 640 - 0.5) * 2,
          -(rightWrist.y / 480 - 0.5) * 2,
          0.2
        );
        
        // Update debug spheres
        if (debugSpheres.current.leftShoulder) {
          debugSpheres.current.leftShoulder.position.set(
            shoulderPos.x * 25,
            shoulderPos.y * 25,
            shoulderPos.z * 25
          );
          debugSpheres.current.leftShoulder.visible = true;
        }
        
        if (debugSpheres.current.leftElbow) {
          debugSpheres.current.leftElbow.position.set(
            elbowPos.x * 25,
            elbowPos.y * 25,
            elbowPos.z * 25
          );
          debugSpheres.current.leftElbow.visible = true;
        }
        
        if (debugSpheres.current.leftWrist) {
          debugSpheres.current.leftWrist.position.set(
            wristPos.x * 25,
            wristPos.y * 25,
            wristPos.z * 25
          );
          debugSpheres.current.leftWrist.visible = true;
        }
        
        // Calculate upper arm direction
        const upperArmDir = elbowPos.clone().sub(shoulderPos).normalize();
        
        // Create rotation directly from T-pose
        const tPoseDirection = new THREE.Vector3(-1, 0, 0); // Left arm points left
        const rotation = new THREE.Quaternion();
        rotation.setFromUnitVectors(tPoseDirection, upperArmDir);
        
        // Apply with smoothing
        leftArmBone.current.quaternion.slerp(rotation, 0.1);
        
        // Handle forearm
        if (leftForeArmBone.current) {
          const upperArmVector = elbowPos.clone().sub(shoulderPos);
          const forearmVector = wristPos.clone().sub(elbowPos);
          const angle = upperArmVector.angleTo(forearmVector);
          const bendAngle = Math.PI - angle;
          
          // Apply bend directly
          leftForeArmBone.current.rotation.set(0, 0, -Math.min(bendAngle * 0.7, Math.PI * 0.7));
        }
      }
      
      // Left arm tracking (tracking user's left arm to avatar's left arm)
      const leftShoulder = keypoints.leftShoulder;
      const leftElbow = keypoints.leftElbow;
      const leftWrist = keypoints.leftWrist;
      
      if (leftShoulder && leftShoulder.confidence > 0.15 && 
          leftElbow && leftElbow.confidence > 0.15 && 
          leftWrist && leftWrist.confidence > 0.15 && 
          rightArmBone.current) {  // Note: using rightArmBone for left tracking
        
        // Convert to normalized 3D positions
        const shoulderPos = new THREE.Vector3(
          (leftShoulder.x / 640 - 0.5) * 2,
          -(leftShoulder.y / 480 - 0.5) * 2,
          0
        );
        
        const elbowPos = new THREE.Vector3(
          (leftElbow.x / 640 - 0.5) * 2,
          -(leftElbow.y / 480 - 0.5) * 2,
          0.1
        );
        
        const wristPos = new THREE.Vector3(
          (leftWrist.x / 640 - 0.5) * 2,
          -(leftWrist.y / 480 - 0.5) * 2,
          0.2
        );
        
        // Update debug spheres
        if (debugSpheres.current.rightShoulder) {
          debugSpheres.current.rightShoulder.position.set(
            shoulderPos.x * 25,
            shoulderPos.y * 25,
            shoulderPos.z * 25
          );
          debugSpheres.current.rightShoulder.visible = true;
        }
        
        if (debugSpheres.current.rightElbow) {
          debugSpheres.current.rightElbow.position.set(
            elbowPos.x * 25,
            elbowPos.y * 25,
            elbowPos.z * 25
          );
          debugSpheres.current.rightElbow.visible = true;
        }
        
        if (debugSpheres.current.rightWrist) {
          debugSpheres.current.rightWrist.position.set(
            wristPos.x * 25,
            wristPos.y * 25,
            wristPos.z * 25
          );
          debugSpheres.current.rightWrist.visible = true;
        }
        
        // Calculate upper arm direction
        const upperArmDir = elbowPos.clone().sub(shoulderPos).normalize();
        
        // Create rotation directly from T-pose
        const tPoseDirection = new THREE.Vector3(1, 0, 0); // Right arm points right
        const rotation = new THREE.Quaternion();
        rotation.setFromUnitVectors(tPoseDirection, upperArmDir);
        
        // Apply with smoothing
        rightArmBone.current.quaternion.slerp(rotation, 0.1);
        
        // Handle forearm
        if (rightForeArmBone.current) {
          const upperArmVector = elbowPos.clone().sub(shoulderPos);
          const forearmVector = wristPos.clone().sub(elbowPos);
          const angle = upperArmVector.angleTo(forearmVector);
          const bendAngle = Math.PI - angle;
          
          // Apply bend directly
          rightForeArmBone.current.rotation.set(0, 0, Math.min(bendAngle * 0.7, Math.PI * 0.7));
        }
      }
      
      // Apply shoulder tilt and spine leaning
      if (leftShoulder && rightShoulder && leftShoulder.confidence > 0.2 && rightShoulder.confidence > 0.2) {
        // Calculate shoulder tilt
        const shoulderDiff = (rightShoulder.y - leftShoulder.y) / 480; // Normalized difference
        const shoulderTilt = shoulderDiff * 0.3; // Scale down for natural movement
        
        // Apply to spine bones if available
        if (spine2Bone.current) {
          const idleSpine2Rotation = initialEulers.current['spine2'] || new THREE.Euler();
          spine2Bone.current.rotation.copy(idleSpine2Rotation);
          spine2Bone.current.rotation.z = THREE.MathUtils.lerp(
            spine2Bone.current.rotation.z,
            spine2Bone.current.rotation.z + shoulderTilt,
            0.2
          );
        }
        
        // Calculate forward/backward lean based on shoulder position relative to hips
        const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
        const leftHip = keypoints.leftHip;
        const rightHip = keypoints.rightHip;
        
        if (leftHip && rightHip && leftHip.confidence > 0.2 && rightHip.confidence > 0.2) {
          const avgHipY = (leftHip.y + rightHip.y) / 2;
          const leanAmount = ((avgShoulderY - avgHipY) / 480 - 0.2) * 0.5; // Normalized and scaled
          
          if (spineBone.current) {
            const idleSpineRotation = initialEulers.current['spine'] || new THREE.Euler();
            spineBone.current.rotation.copy(idleSpineRotation);
            spineBone.current.rotation.x = THREE.MathUtils.lerp(
              spineBone.current.rotation.x,
              spineBone.current.rotation.x - leanAmount,
              0.2
            );
          }
        }
        
        // Apply shoulder movements
        if (leftShoulderBone.current) {
          const leftShoulderHeight = (leftShoulder.y / 480 - 0.5) * 0.2;
          leftShoulderBone.current.rotation.z = THREE.MathUtils.lerp(
            leftShoulderBone.current.rotation.z,
            -leftShoulderHeight,
            0.3
          );
        }
        
        if (rightShoulderBone.current) {
          const rightShoulderHeight = (rightShoulder.y / 480 - 0.5) * 0.2;
          rightShoulderBone.current.rotation.z = THREE.MathUtils.lerp(
            rightShoulderBone.current.rotation.z,
            rightShoulderHeight,
            0.3
          );
        }
      }
    }
  });
  
  return (
    <group ref={groupRef} position={position} scale={scale}>
      {clonedScene && <primitive object={clonedScene} />}
    </group>
  );
};
