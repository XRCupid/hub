import React, { useRef, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useGraph } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import type { TrackingData } from '../types/tracking';

// Define PostureData type inline
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

interface IdlePoseFullBodyAvatarProps {
  avatarUrl: string;
  trackingData?: TrackingData;
  postureData?: PostureData;
  position?: [number, number, number];
  scale?: number;
  debugMode?: boolean;
}

export const IdlePoseFullBodyAvatar: React.FC<IdlePoseFullBodyAvatarProps> = ({
  avatarUrl,
  trackingData,
  postureData,
  position = [0, 0, 0],
  scale = 1,
  debugMode = true
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(avatarUrl);
  
  // Clone the scene
  const clonedScene = useMemo(() => {
    const cloned = SkeletonUtils.clone(scene);
    return cloned;
  }, [scene]);
  
  // Bone references
  const headBone = useRef<THREE.Bone | null>(null);
  const neckBone = useRef<THREE.Bone | null>(null);
  const leftShoulderBone = useRef<THREE.Bone | null>(null);
  const rightShoulderBone = useRef<THREE.Bone | null>(null);
  const leftArmBone = useRef<THREE.Bone | null>(null);
  const rightArmBone = useRef<THREE.Bone | null>(null);
  const leftForeArmBone = useRef<THREE.Bone | null>(null);
  const rightForeArmBone = useRef<THREE.Bone | null>(null);
  const meshWithMorphTargets = useRef<THREE.Mesh | null>(null);
  
  // Store idle pose rotations (after manual setup)
  const idleRotations = useRef<Record<string, THREE.Quaternion>>({});
  const idleEulers = useRef<Record<string, THREE.Euler>>({});
  
  // Debug spheres
  const debugSpheres = useRef<Record<string, THREE.Mesh>>({});
  const frameCount = useRef(0);
  
  // Find bones and setup
  useEffect(() => {
    if (!clonedScene) return;
    
    console.log('[IdlePoseFullBodyAvatar] Starting bone search...');
    
    // Find bones
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Bone) {
        const name = child.name.toLowerCase();
        console.log('[IdlePoseFullBodyAvatar] Found bone:', child.name);
        
        // Head
        if (name.includes('head') && !name.includes('headtop')) {
          headBone.current = child;
        }
        
        // Shoulders
        if (name.includes('leftshoulder') || name.includes('shoulder_l')) {
          leftShoulderBone.current = child;
        }
        if (name.includes('rightshoulder') || name.includes('shoulder_r')) {
          rightShoulderBone.current = child;
        }
        
        // Arms (upper arm)
        if ((name.includes('leftarm') || name.includes('arm_l') || name.includes('leftupperarm') || name.includes('upperarm_l')) && !name.includes('fore')) {
          leftArmBone.current = child;
        }
        if ((name.includes('rightarm') || name.includes('arm_r') || name.includes('rightupperarm') || name.includes('upperarm_r')) && !name.includes('fore')) {
          rightArmBone.current = child;
        }
        
        // Forearms
        if (name.includes('leftforearm') || name.includes('forearm_l') || name.includes('leftlowerarm') || name.includes('lowerarm_l')) {
          leftForeArmBone.current = child;
        }
        if (name.includes('rightforearm') || name.includes('forearm_r') || name.includes('rightlowerarm') || name.includes('lowerarm_r')) {
          rightForeArmBone.current = child;
        }
        
        // Neck
        if (name.includes('neck')) {
          neckBone.current = child;
        }
      } else if (child instanceof THREE.SkinnedMesh && child.morphTargetDictionary) {
        meshWithMorphTargets.current = child as THREE.Mesh;
      }
    });
    
    console.log('[IdlePoseFullBodyAvatar] Bone search complete:', {
      head: !!headBone.current,
      neck: !!neckBone.current,
      leftShoulder: !!leftShoulderBone.current,
      rightShoulder: !!rightShoulderBone.current,
      leftArm: !!leftArmBone.current,
      rightArm: !!rightArmBone.current,
      leftForeArm: !!leftForeArmBone.current,
      rightForeArm: !!rightForeArmBone.current
    });
    
    // Set manual idle pose
    if (leftArmBone.current) {
      // Rotate arm down and slightly forward
      leftArmBone.current.rotation.z = Math.PI / 3; // 60 degrees down
      leftArmBone.current.rotation.y = -Math.PI / 8; // Slightly forward
    }
    if (rightArmBone.current) {
      // Rotate arm down and slightly forward
      rightArmBone.current.rotation.z = -Math.PI / 3; // 60 degrees down
      rightArmBone.current.rotation.y = Math.PI / 8; // Slightly forward
    }
    if (leftForeArmBone.current) {
      leftForeArmBone.current.rotation.y = Math.PI / 6; // Slight bend
    }
    if (rightForeArmBone.current) {
      rightForeArmBone.current.rotation.y = -Math.PI / 6; // Slight bend
    }
    
    // Store idle rotations after setting them
    setTimeout(() => {
      if (leftArmBone.current) {
        idleRotations.current['leftArm'] = leftArmBone.current.quaternion.clone();
        idleEulers.current['leftArm'] = leftArmBone.current.rotation.clone();
      }
      if (rightArmBone.current) {
        idleRotations.current['rightArm'] = rightArmBone.current.quaternion.clone();
        idleEulers.current['rightArm'] = rightArmBone.current.rotation.clone();
      }
      if (leftForeArmBone.current) {
        idleRotations.current['leftForeArm'] = leftForeArmBone.current.quaternion.clone();
        idleEulers.current['leftForeArm'] = leftForeArmBone.current.rotation.clone();
      }
      if (rightForeArmBone.current) {
        idleRotations.current['rightForeArm'] = rightForeArmBone.current.quaternion.clone();
        idleEulers.current['rightForeArm'] = rightForeArmBone.current.rotation.clone();
      }
      
      console.log('[IdlePoseFullBodyAvatar] Stored idle pose rotations');
    }, 100);
    
    // Create debug spheres
    if (debugMode && groupRef.current) {
      const colors = {
        shoulder: 0xff0000, // Red
        elbow: 0x00ff00,    // Green
        wrist: 0x0000ff     // Blue
      };
      
      ['leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist'].forEach(name => {
        const geometry = new THREE.SphereGeometry(0.05);
        const color = name.includes('Shoulder') ? colors.shoulder : 
                     name.includes('Elbow') ? colors.elbow : colors.wrist;
        const material = new THREE.MeshBasicMaterial({ color });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.visible = false;
        groupRef.current!.add(sphere);
        debugSpheres.current[name] = sphere;
      });
    }
  }, [clonedScene, debugMode]);
  
  // Apply tracking data
  useFrame(() => {
    frameCount.current++;
    
    // Apply posture tracking to arms
    if (postureData && postureData.keypoints) {
      const keypoints = postureData.keypoints;
      
      // Left arm tracking
      const leftShoulder = keypoints.leftShoulder;
      const leftElbow = keypoints.leftElbow;
      const leftWrist = keypoints.leftWrist;
      
      if (leftShoulder && leftShoulder.confidence > 0.05 && leftArmBone.current) {
        // Update debug sphere
        if (debugSpheres.current.leftShoulder) {
          debugSpheres.current.leftShoulder.position.set(
            (leftShoulder.x / 640 - 0.5) * 2,
            -(leftShoulder.y / 480 - 0.5) * 2,
            0
          );
          debugSpheres.current.leftShoulder.visible = true;
        }
        
        if (leftWrist && leftWrist.confidence > 0.05) {
          // Update wrist debug sphere
          if (debugSpheres.current.leftWrist) {
            debugSpheres.current.leftWrist.position.set(
              (leftWrist.x / 640 - 0.5) * 2,
              -(leftWrist.y / 480 - 0.5) * 2,
              0
            );
            debugSpheres.current.leftWrist.visible = true;
          }
          
          // Calculate arm direction
          const shoulderPos = new THREE.Vector3(
            leftShoulder.x / 640 - 0.5,
            -(leftShoulder.y / 480 - 0.5),
            0
          ).normalize();
          
          const wristPos = new THREE.Vector3(
            leftWrist.x / 640 - 0.5,
            -(leftWrist.y / 480 - 0.5),
            -0.2
          ).normalize();
          
          const armDir = wristPos.sub(shoulderPos).normalize();
          
          // Get idle rotation
          const idleRotation = idleRotations.current['leftArm'] || new THREE.Quaternion();
          
          // Calculate rotation from idle direction to target direction
          const idleDir = new THREE.Vector3(-0.7, -0.7, 0).normalize(); // Approximate idle arm direction
          const trackingRotation = new THREE.Quaternion().setFromUnitVectors(idleDir, armDir);
          
          // Apply as offset to idle rotation
          const finalRotation = idleRotation.clone().multiply(trackingRotation);
          leftArmBone.current.quaternion.slerp(finalRotation, 0.3);
          
          // Handle elbow if detected
          if (leftElbow && leftElbow.confidence > 0.05 && leftForeArmBone.current) {
            if (debugSpheres.current.leftElbow) {
              debugSpheres.current.leftElbow.position.set(
                (leftElbow.x / 640 - 0.5) * 2,
                -(leftElbow.y / 480 - 0.5) * 2,
                0
              );
              debugSpheres.current.leftElbow.visible = true;
            }
            
            // Calculate elbow bend
            const elbowPos = new THREE.Vector3(
              leftElbow.x / 640 - 0.5,
              -(leftElbow.y / 480 - 0.5),
              -0.1
            );
            
            const upperArmVec = elbowPos.clone().sub(shoulderPos).normalize();
            const forearmVec = wristPos.clone().sub(elbowPos).normalize();
            const bendAngle = Math.acos(Math.max(-1, Math.min(1, upperArmVec.dot(forearmVec))));
            
            // Apply elbow bend relative to idle pose
            const idleForearmRotation = idleRotations.current['leftForeArm'] || new THREE.Quaternion();
            const bendRotation = new THREE.Quaternion().setFromAxisAngle(
              new THREE.Vector3(0, 0, -1),
              Math.min(bendAngle * 0.8, Math.PI * 0.8)
            );
            const finalForearmRotation = idleForearmRotation.clone().multiply(bendRotation);
            leftForeArmBone.current.quaternion.slerp(finalForearmRotation, 0.3);
          }
        } else {
          // Return to idle pose smoothly
          if (idleRotations.current['leftArm']) {
            leftArmBone.current.quaternion.slerp(idleRotations.current['leftArm'], 0.1);
          }
          if (leftForeArmBone.current && idleRotations.current['leftForeArm']) {
            leftForeArmBone.current.quaternion.slerp(idleRotations.current['leftForeArm'], 0.1);
          }
          
          // Hide debug spheres
          if (debugSpheres.current.leftWrist) debugSpheres.current.leftWrist.visible = false;
          if (debugSpheres.current.leftElbow) debugSpheres.current.leftElbow.visible = false;
        }
      }
      
      // Right arm tracking (mirror of left)
      const rightShoulder = keypoints.rightShoulder;
      const rightElbow = keypoints.rightElbow;
      const rightWrist = keypoints.rightWrist;
      
      if (rightShoulder && rightShoulder.confidence > 0.05 && rightArmBone.current) {
        // Update debug sphere
        if (debugSpheres.current.rightShoulder) {
          debugSpheres.current.rightShoulder.position.set(
            (rightShoulder.x / 640 - 0.5) * 2,
            -(rightShoulder.y / 480 - 0.5) * 2,
            0
          );
          debugSpheres.current.rightShoulder.visible = true;
        }
        
        if (rightWrist && rightWrist.confidence > 0.05) {
          // Update wrist debug sphere
          if (debugSpheres.current.rightWrist) {
            debugSpheres.current.rightWrist.position.set(
              (rightWrist.x / 640 - 0.5) * 2,
              -(rightWrist.y / 480 - 0.5) * 2,
              0
            );
            debugSpheres.current.rightWrist.visible = true;
          }
          
          // Calculate arm direction
          const shoulderPos = new THREE.Vector3(
            rightShoulder.x / 640 - 0.5,
            -(rightShoulder.y / 480 - 0.5),
            0
          ).normalize();
          
          const wristPos = new THREE.Vector3(
            rightWrist.x / 640 - 0.5,
            -(rightWrist.y / 480 - 0.5),
            -0.2
          ).normalize();
          
          const armDir = wristPos.sub(shoulderPos).normalize();
          
          // Get idle rotation
          const idleRotation = idleRotations.current['rightArm'] || new THREE.Quaternion();
          
          // Calculate rotation from idle direction to target direction
          const idleDir = new THREE.Vector3(0.7, -0.7, 0).normalize(); // Approximate idle arm direction
          const trackingRotation = new THREE.Quaternion().setFromUnitVectors(idleDir, armDir);
          
          // Apply as offset to idle rotation
          const finalRotation = idleRotation.clone().multiply(trackingRotation);
          rightArmBone.current.quaternion.slerp(finalRotation, 0.3);
          
          // Handle elbow if detected
          if (rightElbow && rightElbow.confidence > 0.05 && rightForeArmBone.current) {
            if (debugSpheres.current.rightElbow) {
              debugSpheres.current.rightElbow.position.set(
                (rightElbow.x / 640 - 0.5) * 2,
                -(rightElbow.y / 480 - 0.5) * 2,
                0
              );
              debugSpheres.current.rightElbow.visible = true;
            }
            
            // Calculate elbow bend
            const elbowPos = new THREE.Vector3(
              rightElbow.x / 640 - 0.5,
              -(rightElbow.y / 480 - 0.5),
              -0.1
            );
            
            const upperArmVec = elbowPos.clone().sub(shoulderPos).normalize();
            const forearmVec = wristPos.clone().sub(elbowPos).normalize();
            const bendAngle = Math.acos(Math.max(-1, Math.min(1, upperArmVec.dot(forearmVec))));
            
            // Apply elbow bend relative to idle pose
            const idleForearmRotation = idleRotations.current['rightForeArm'] || new THREE.Quaternion();
            const bendRotation = new THREE.Quaternion().setFromAxisAngle(
              new THREE.Vector3(0, 0, 1),
              Math.min(bendAngle * 0.8, Math.PI * 0.8)
            );
            const finalForearmRotation = idleForearmRotation.clone().multiply(bendRotation);
            rightForeArmBone.current.quaternion.slerp(finalForearmRotation, 0.3);
          }
        } else {
          // Return to idle pose smoothly
          if (idleRotations.current['rightArm']) {
            rightArmBone.current.quaternion.slerp(idleRotations.current['rightArm'], 0.1);
          }
          if (rightForeArmBone.current && idleRotations.current['rightForeArm']) {
            rightForeArmBone.current.quaternion.slerp(idleRotations.current['rightForeArm'], 0.1);
          }
          
          // Hide debug spheres
          if (debugSpheres.current.rightWrist) debugSpheres.current.rightWrist.visible = false;
          if (debugSpheres.current.rightElbow) debugSpheres.current.rightElbow.visible = false;
        }
      }
    }
    
    // Apply head tracking from TrackingData
    if (trackingData && trackingData.headRotation && headBone.current) {
      const { pitch, yaw, roll } = trackingData.headRotation;
      
      // Apply rotation with damping
      const targetRotation = new THREE.Euler(
        pitch * 0.5,
        yaw * 0.7,
        roll * 0.3,
        'XYZ'
      );
      
      headBone.current.rotation.x = THREE.MathUtils.lerp(headBone.current.rotation.x, targetRotation.x, 0.1);
      headBone.current.rotation.y = THREE.MathUtils.lerp(headBone.current.rotation.y, targetRotation.y, 0.1);
      headBone.current.rotation.z = THREE.MathUtils.lerp(headBone.current.rotation.z, targetRotation.z, 0.1);
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
  });
  
  return (
    <group ref={groupRef} position={position} scale={scale}>
      {clonedScene && <primitive object={clonedScene} />}
    </group>
  );
};
