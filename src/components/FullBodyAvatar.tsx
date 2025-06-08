import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MathUtils } from 'three';
import { TrackingData, PostureData } from '../types/tracking';

interface FullBodyAvatarProps {
  avatarUrl: string;
  trackingData?: TrackingData | null;
  postureData?: PostureData | null;
  position?: [number, number, number];
  scale?: number;
}

const FullBodyAvatar: React.FC<FullBodyAvatarProps> = ({ 
  avatarUrl, 
  trackingData,
  postureData,
  position = [0, 0, 0],
  scale = 1
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(avatarUrl);
  
  // Clone the scene to avoid modifying the cached version
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  
  // Bone references
  const headBone = useRef<THREE.Bone | null>(null);
  const leftShoulderBone = useRef<THREE.Bone | null>(null);
  const rightShoulderBone = useRef<THREE.Bone | null>(null);
  const leftArmBone = useRef<THREE.Bone | null>(null);
  const rightArmBone = useRef<THREE.Bone | null>(null);
  const leftForeArmBone = useRef<THREE.Bone | null>(null);
  const rightForeArmBone = useRef<THREE.Bone | null>(null);
  
  // Store initial bone rotations (T-pose)
  const initialRotations = useRef<{[key: string]: THREE.Quaternion}>({});
  const initialEulers = useRef<{[key: string]: THREE.Euler}>({});
  
  // Morph target references
  const morphTargetMeshes = useRef<THREE.SkinnedMesh[]>([]);
  
  // Frame counter for debugging
  const frameCount = useRef(0);
  
  // Debug flag
  const debugBonesFound = useRef(false);

  // Debug spheres for keypoints
  const debugSpheres = useRef<{[key: string]: THREE.Mesh}>({});
  const [debugMode] = useState(true); // Enable debug mode

  // Animation state
  const poseInitialized = useRef(false);
  const idlePoseTimer = useRef<number>(0);
  
  // Idle pose rotations (arms slightly down and forward)
  const idlePose = {
    leftArm: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI / 4)), // 45 degrees down
    rightArm: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 4)), // 45 degrees down
    leftForeArm: new THREE.Euler(0, 0, -Math.PI / 8), // Slight bend
    rightForeArm: new THREE.Euler(0, 0, Math.PI / 8) // Slight bend
  };

  // Find bones and morph targets
  useEffect(() => {
    if (!clonedScene) return;
    
    const meshes: THREE.SkinnedMesh[] = [];
    
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Bone) {
        const name = child.name.toLowerCase();
        console.log('[FullBodyAvatar] Found bone:', child.name);
        
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
          initialRotations.current['leftArm'] = child.quaternion.clone();
          initialEulers.current['leftArm'] = child.rotation.clone();
        }
        if ((name.includes('rightarm') || name.includes('arm_r') || name.includes('rightupperarm') || name.includes('upperarm_r')) && !name.includes('fore')) {
          rightArmBone.current = child;
          initialRotations.current['rightArm'] = child.quaternion.clone();
          initialEulers.current['rightArm'] = child.rotation.clone();
        }
        
        // Forearms
        if (name.includes('leftforearm') || name.includes('forearm_l') || name.includes('leftlowerarm') || name.includes('lowerarm_l')) {
          leftForeArmBone.current = child;
          initialRotations.current['leftForeArm'] = child.quaternion.clone();
          initialEulers.current['leftForeArm'] = child.rotation.clone();
        }
        if (name.includes('rightforearm') || name.includes('forearm_r') || name.includes('rightlowerarm') || name.includes('lowerarm_r')) {
          rightForeArmBone.current = child;
          initialRotations.current['rightForeArm'] = child.quaternion.clone();
          initialEulers.current['rightForeArm'] = child.rotation.clone();
        }
      }
      
      // Find meshes with morph targets
      if (child instanceof THREE.SkinnedMesh && child.morphTargetDictionary) {
        meshes.push(child);
      }
    });
    
    morphTargetMeshes.current = meshes;
    
    console.log('[FullBodyAvatar] Bone mapping complete:', {
      head: !!headBone.current,
      leftShoulder: !!leftShoulderBone.current,
      rightShoulder: !!rightShoulderBone.current,
      leftArm: !!leftArmBone.current,
      rightArm: !!rightArmBone.current,
      leftForeArm: !!leftForeArmBone.current,
      rightForeArm: !!rightForeArmBone.current,
      morphTargetMeshes: meshes.length
    });
    
    console.log('[FullBodyAvatar] Bones found:', {
      head: headBone.current?.name,
      leftArm: leftArmBone.current?.name,
      rightArm: rightArmBone.current?.name,
      leftForeArm: leftForeArmBone.current?.name,
      rightForeArm: rightForeArmBone.current?.name
    });
    
    console.log('[FullBodyAvatar] Initial rotations:', {
      leftArm: initialRotations.current['leftArm'] ? {
        quaternion: initialRotations.current['leftArm'].toArray().map(v => v.toFixed(3)),
        euler: initialEulers.current['leftArm'] ? [
          (initialEulers.current['leftArm'].x * 180 / Math.PI).toFixed(1),
          (initialEulers.current['leftArm'].y * 180 / Math.PI).toFixed(1),
          (initialEulers.current['leftArm'].z * 180 / Math.PI).toFixed(1)
        ] : null
      } : null,
      rightArm: initialRotations.current['rightArm'] ? {
        quaternion: initialRotations.current['rightArm'].toArray().map(v => v.toFixed(3)),
        euler: initialEulers.current['rightArm'] ? [
          (initialEulers.current['rightArm'].x * 180 / Math.PI).toFixed(1),
          (initialEulers.current['rightArm'].y * 180 / Math.PI).toFixed(1),
          (initialEulers.current['rightArm'].z * 180 / Math.PI).toFixed(1)
        ] : null
      } : null
    });
    
    if (!debugBonesFound.current) {
      console.log('[FullBodyAvatar] Bone search results:', {
        head: headBone.current?.name || 'NOT FOUND',
        leftShoulder: leftShoulderBone.current?.name || 'NOT FOUND',
        rightShoulder: rightShoulderBone.current?.name || 'NOT FOUND',
        leftArm: leftArmBone.current?.name || 'NOT FOUND',
        rightArm: rightArmBone.current?.name || 'NOT FOUND',
        leftForeArm: leftForeArmBone.current?.name || 'NOT FOUND',
        rightForeArm: rightForeArmBone.current?.name || 'NOT FOUND'
      });
      
      // List all bones in the model
      const allBones: string[] = [];
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Bone) {
          allBones.push(child.name);
        }
      });
      console.log('[FullBodyAvatar] All bones in model:', allBones);
      
      debugBonesFound.current = true;
    }
    
    // Create debug spheres
    if (debugMode) {
      const sphereGeometry = new THREE.SphereGeometry(0.05, 16, 16);
      const materials = {
        shoulder: new THREE.MeshBasicMaterial({ color: 0xff0000 }),
        elbow: new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
        wrist: new THREE.MeshBasicMaterial({ color: 0x0000ff })
      };
      
      // Create spheres for each keypoint
      const keypointNames = ['leftShoulder', 'leftElbow', 'leftWrist', 'rightShoulder', 'rightElbow', 'rightWrist'];
      keypointNames.forEach(name => {
        const material = name.includes('Shoulder') ? materials.shoulder :
                        name.includes('Elbow') ? materials.elbow : materials.wrist;
        const sphere = new THREE.Mesh(sphereGeometry, material);
        sphere.visible = false;
        clonedScene.add(sphere);
        debugSpheres.current[name] = sphere;
      });
    }
  }, [clonedScene, debugMode]);
  
  // Apply tracking data every frame
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Debug log every 60 frames
    frameCount.current++;
    if (frameCount.current % 60 === 0) {
      // Check if we're getting posture data from the service
      if (postureData) {
        console.log('[FullBodyAvatar] PostureData from service:', postureData);
        console.log('[FullBodyAvatar] PostureData keypoints detail:', postureData.keypoints);
      }
      
      // Check tracking data posture
      if (trackingData?.posture) {
        console.log('[FullBodyAvatar] TrackingData posture:', trackingData.posture);
        console.log('[FullBodyAvatar] TrackingData keypoints detail:', trackingData.posture.keypoints);
      }
    }
    
    // Apply head rotation from face tracking
    if (trackingData?.headRotation && headBone.current) {
      const { pitch, yaw, roll } = trackingData.headRotation;
      
      // Apply rotation
      headBone.current.rotation.x = MathUtils.degToRad(pitch * 0.5);
      headBone.current.rotation.y = MathUtils.degToRad(-yaw * 0.6);
      headBone.current.rotation.z = MathUtils.degToRad(-roll * 0.3);
    }
    
    // Try to get posture keypoints from either source
    const keypoints = postureData?.keypoints || trackingData?.posture?.keypoints;
    
    if (keypoints) {
      // Log keypoint data every second
      if (frameCount.current % 60 === 0) {
        console.log('[FullBodyAvatar] Using keypoints:', keypoints);
      }
      
      // Get video dimensions from the posture tracking service
      const videoWidth = 640; // Default video width
      const videoHeight = 480; // Default video height
      
      // Simple arm tracking - LEFT ARM
      const leftShoulder = keypoints.leftShoulder;
      const leftElbow = keypoints.leftElbow;
      const leftWrist = keypoints.leftWrist;
      
      // Try different combinations of keypoints
      if (leftShoulder && leftShoulder.confidence > 0.05) {
        const normalizedLeftShoulder = {
          x: leftShoulder.x / videoWidth,
          y: leftShoulder.y / videoHeight
        };
        
        // Case 1: All three keypoints available
        if (leftWrist && leftWrist.confidence > 0.05 && leftElbow && leftElbow.confidence > 0.05) {
          // Normalize coordinates (PoseNet gives pixel coordinates)
          const normalizedLeftWrist = {
            x: leftWrist.x / videoWidth,
            y: leftWrist.y / videoHeight
          };
          const normalizedLeftElbow = {
            x: leftElbow.x / videoWidth,
            y: leftElbow.y / videoHeight
          };
          
          // Log normalized coordinates
          if (frameCount.current % 60 === 0) {
            console.log('[FullBodyAvatar] Left arm normalized coords:', {
              wrist: normalizedLeftWrist,
              elbow: normalizedLeftElbow,
              shoulder: normalizedLeftShoulder
            });
          }
          
          // Convert 2D normalized coordinates to 3D positions
          const shoulderPos = new THREE.Vector3(
            (normalizedLeftShoulder.x - 0.5) * 2,
            -(normalizedLeftShoulder.y - 0.5) * 2,
            0
          );
          const elbowPos = new THREE.Vector3(
            (normalizedLeftElbow.x - 0.5) * 2,
            -(normalizedLeftElbow.y - 0.5) * 2,
            0.2  // Add some depth
          );
          const wristPos = new THREE.Vector3(
            (normalizedLeftWrist.x - 0.5) * 2,
            -(normalizedLeftWrist.y - 0.5) * 2,
            0.3  // Add more depth
          );
          
          // Update debug spheres
          if (debugSpheres.current) {
            if (debugSpheres.current.leftShoulder) {
              debugSpheres.current.leftShoulder.position.copy(shoulderPos);
              debugSpheres.current.leftShoulder.position.multiplyScalar(50); // Scale up for visibility
              debugSpheres.current.leftShoulder.visible = true;
            }
            if (debugSpheres.current.leftElbow) {
              debugSpheres.current.leftElbow.position.copy(elbowPos);
              debugSpheres.current.leftElbow.position.multiplyScalar(50);
              debugSpheres.current.leftElbow.visible = true;
            }
            if (debugSpheres.current.leftWrist) {
              debugSpheres.current.leftWrist.position.copy(wristPos);
              debugSpheres.current.leftWrist.position.multiplyScalar(50);
              debugSpheres.current.leftWrist.visible = true;
            }
          }
          
          // Apply IK to upper arm
          if (leftArmBone.current) {
            const upperArmDir = elbowPos.clone().sub(shoulderPos).normalize();
            const upperArmRotation = new THREE.Quaternion();
            
            // For T-pose avatars, arms point outward (along X axis)
            // Calculate rotation from the T-pose direction to target direction
            const tPoseDirection = new THREE.Vector3(-1, 0, 0); // Left arm points left in T-pose
            upperArmRotation.setFromUnitVectors(tPoseDirection, upperArmDir);
            
            // Combine with initial rotation
            const finalRotation = initialRotations.current['leftArm'] ? 
              initialRotations.current['leftArm'].clone().multiply(upperArmRotation) : 
              upperArmRotation;
            
            // Apply with damping
            leftArmBone.current.quaternion.slerp(finalRotation, 0.3);
          }
          
          // Apply elbow bend
          if (leftForeArmBone.current && leftArmBone.current) {
            const upperArmVector = elbowPos.clone().sub(shoulderPos);
            const forearmVector = wristPos.clone().sub(elbowPos);
            
            // Calculate angle between upper arm and forearm
            const angle = upperArmVector.angleTo(forearmVector);
            const bendAngle = Math.PI - angle;
            
            // For T-pose, we need to apply the bend relative to the initial rotation
            // Reset to initial rotation first
            if (initialEulers.current['leftForeArm']) {
              leftForeArmBone.current.rotation.copy(initialEulers.current['leftForeArm']);
            }
            
            // Apply rotation on local Z axis for elbow bend (negative for proper direction)
            leftForeArmBone.current.rotation.z -= Math.min(bendAngle * 0.8, Math.PI * 0.8);
            
            // Log IK calculations
            if (frameCount.current % 60 === 0) {
              console.log('[FullBodyAvatar] Left arm IK:', {
                angle: (angle * 180 / Math.PI).toFixed(1),
                bendAngle: (bendAngle * 180 / Math.PI).toFixed(1),
                appliedBend: (leftForeArmBone.current.rotation.z * 180 / Math.PI).toFixed(1)
              });
            }
          }
        }
        // Case 2: Only shoulder and wrist (no elbow)
        else if (leftWrist && leftWrist.confidence > 0.05 && leftArmBone.current) {
          const normalizedLeftWrist = {
            x: leftWrist.x / videoWidth,
            y: leftWrist.y / videoHeight
          };
          
          // Direct shoulder to wrist direction
          const shoulderPos = new THREE.Vector3(
            (normalizedLeftShoulder.x - 0.5) * 2,
            -(normalizedLeftShoulder.y - 0.5) * 2,
            0
          );
          const wristPos = new THREE.Vector3(
            (normalizedLeftWrist.x - 0.5) * 2,
            -(normalizedLeftWrist.y - 0.5) * 2,
            0.4
          );
          
          // Update debug spheres
          if (debugSpheres.current) {
            if (debugSpheres.current.leftShoulder) {
              debugSpheres.current.leftShoulder.position.copy(shoulderPos);
              debugSpheres.current.leftShoulder.position.multiplyScalar(50); // Scale up for visibility
              debugSpheres.current.leftShoulder.visible = true;
            }
            if (debugSpheres.current.leftWrist) {
              debugSpheres.current.leftWrist.position.copy(wristPos);
              debugSpheres.current.leftWrist.position.multiplyScalar(50);
              debugSpheres.current.leftWrist.visible = true;
            }
            if (debugSpheres.current.leftElbow) {
              debugSpheres.current.leftElbow.visible = false;
            }
          }
          
          const armDir = wristPos.clone().sub(shoulderPos).normalize();
          const armRotation = new THREE.Quaternion();
          
          // For T-pose avatars, arms point outward
          const tPoseDirection = new THREE.Vector3(-1, 0, 0); // Left arm points left
          armRotation.setFromUnitVectors(tPoseDirection, armDir);
          
          // Combine with initial rotation
          const finalRotation = initialRotations.current['leftArm'] ? 
            initialRotations.current['leftArm'].clone().multiply(armRotation) : 
            armRotation;
          
          leftArmBone.current.quaternion.slerp(finalRotation, 0.2);
          
          if (frameCount.current % 60 === 0) {
            console.log('[FullBodyAvatar] Left arm (shoulder-wrist only):', {
              shoulderPos: shoulderPos.toArray().map(v => v.toFixed(2)),
              wristPos: wristPos.toArray().map(v => v.toFixed(2)),
              armDir: armDir.toArray().map(v => v.toFixed(2))
            });
          }
        }
        // Case 3: Only shoulder - apply default pose
        else if (leftArmBone.current) {
          // Slowly return to T-pose
          const defaultRotation = initialRotations.current['leftArm'] || new THREE.Quaternion();
          leftArmBone.current.quaternion.slerp(defaultRotation, 0.05);
          
          if (leftForeArmBone.current) {
            // Return forearm to initial rotation
            if (initialEulers.current['leftForeArm']) {
              const currentRotation = leftForeArmBone.current.rotation.clone();
              const targetRotation = initialEulers.current['leftForeArm'];
              leftForeArmBone.current.rotation.x = THREE.MathUtils.lerp(currentRotation.x, targetRotation.x, 0.05);
              leftForeArmBone.current.rotation.y = THREE.MathUtils.lerp(currentRotation.y, targetRotation.y, 0.05);
              leftForeArmBone.current.rotation.z = THREE.MathUtils.lerp(currentRotation.z, targetRotation.z, 0.05);
            }
          }
          
          // Update debug spheres
          if (debugSpheres.current) {
            if (debugSpheres.current.leftShoulder) {
              debugSpheres.current.leftShoulder.visible = false;
            }
            if (debugSpheres.current.leftElbow) {
              debugSpheres.current.leftElbow.visible = false;
            }
            if (debugSpheres.current.leftWrist) {
              debugSpheres.current.leftWrist.visible = false;
            }
          }
        }
      }
      
      // Right arm tracking
      if (postureData && postureData.keypoints.rightShoulder) {
        const rightShoulder = postureData.keypoints.rightShoulder;
        const rightElbow = postureData.keypoints.rightElbow;
        const rightWrist = postureData.keypoints.rightWrist;
        
        if (rightShoulder.confidence > 0.05) {
          const normalizedRightShoulder = {
            x: rightShoulder.x / 640,
            y: rightShoulder.y / 480
          };
          
          // Case 1: All three keypoints available
          if (rightWrist && rightWrist.confidence > 0.05 && rightElbow && rightElbow.confidence > 0.05) {
            // Normalize coordinates (assuming 640x480 video)
            const normalizedRightWrist = {
              x: rightWrist.x / 640,
              y: rightWrist.y / 480
            };
            const normalizedRightElbow = {
              x: rightElbow.x / 640,
              y: rightElbow.y / 480
            };
            
            // Log normalized coordinates
            if (frameCount.current % 60 === 0) {
              console.log('[FullBodyAvatar] Right arm normalized coords:', {
                wrist: normalizedRightWrist,
                elbow: normalizedRightElbow,
                shoulder: normalizedRightShoulder
              });
            }
            
            // Apply proper 3D IK for right arm
            if (rightArmBone.current) {
              // Convert 2D positions to 3D world positions
              const shoulderPos = new THREE.Vector3(
                (normalizedRightShoulder.x - 0.5) * 2,
                -(normalizedRightShoulder.y - 0.5) * 2,
                0
              );
              const elbowPos = new THREE.Vector3(
                (normalizedRightElbow.x - 0.5) * 2,
                -(normalizedRightElbow.y - 0.5) * 2,
                0.2
              );
              const wristPos = new THREE.Vector3(
                (normalizedRightWrist.x - 0.5) * 2,
                -(normalizedRightWrist.y - 0.5) * 2,
                0.3
              );
              
              // Update debug spheres
              if (debugSpheres.current) {
                if (debugSpheres.current.rightShoulder) {
                  debugSpheres.current.rightShoulder.position.copy(shoulderPos);
                  debugSpheres.current.rightShoulder.position.multiplyScalar(50); // Scale up for visibility
                  debugSpheres.current.rightShoulder.visible = true;
                }
                if (debugSpheres.current.rightElbow) {
                  debugSpheres.current.rightElbow.position.copy(elbowPos);
                  debugSpheres.current.rightElbow.position.multiplyScalar(50);
                  debugSpheres.current.rightElbow.visible = true;
                }
                if (debugSpheres.current.rightWrist) {
                  debugSpheres.current.rightWrist.position.copy(wristPos);
                  debugSpheres.current.rightWrist.position.multiplyScalar(50);
                  debugSpheres.current.rightWrist.visible = true;
                }
              }
              
              // Calculate upper arm direction
              const upperArmDir = elbowPos.clone().sub(shoulderPos).normalize();
              
              // Calculate rotation for upper arm
              const upperArmRotation = new THREE.Quaternion();
              
              // For T-pose avatars, right arm points right (along positive X axis)
              const tPoseDirection = new THREE.Vector3(1, 0, 0); // Right arm points right in T-pose
              upperArmRotation.setFromUnitVectors(tPoseDirection, upperArmDir);
              
              // Combine with initial rotation
              const finalRotation = initialRotations.current['rightArm'] ? 
                initialRotations.current['rightArm'].clone().multiply(upperArmRotation) : 
                upperArmRotation;
              
              // Apply rotation with damping
              rightArmBone.current.quaternion.slerp(finalRotation, 0.3);
              
              // Apply elbow bend
              if (rightForeArmBone.current) {
                const upperArmVector = elbowPos.clone().sub(shoulderPos);
                const forearmVector = wristPos.clone().sub(elbowPos);
                
                const angle = upperArmVector.angleTo(forearmVector);
                const bendAngle = Math.PI - angle;
                
                // For T-pose, we need to apply the bend relative to the initial rotation
                // Reset to initial rotation first
                if (initialEulers.current['rightForeArm']) {
                  rightForeArmBone.current.rotation.copy(initialEulers.current['rightForeArm']);
                }
                
                // Apply rotation on local Z axis for elbow bend (positive for right arm)
                rightForeArmBone.current.rotation.z += Math.min(bendAngle * 0.8, Math.PI * 0.8);
                
                if (frameCount.current % 60 === 0) {
                  console.log('[FullBodyAvatar] Right arm IK:', {
                    angle: (angle * 180 / Math.PI).toFixed(1),
                    bendAngle: (bendAngle * 180 / Math.PI).toFixed(1),
                    appliedBend: (rightForeArmBone.current.rotation.z * 180 / Math.PI).toFixed(1)
                  });
                }
              }
            }
          }
          // Case 2: Only shoulder and wrist (no elbow)
          else if (rightWrist && rightWrist.confidence > 0.05 && rightArmBone.current) {
            const normalizedRightWrist = {
              x: rightWrist.x / 640,
              y: rightWrist.y / 480
            };
            
            const shoulderPos = new THREE.Vector3(
              (normalizedRightShoulder.x - 0.5) * 2,
              -(normalizedRightShoulder.y - 0.5) * 2,
              0
            );
            const wristPos = new THREE.Vector3(
              (normalizedRightWrist.x - 0.5) * 2,
              -(normalizedRightWrist.y - 0.5) * 2,
              0.4
            );
            
            // Update debug spheres
            if (debugSpheres.current) {
              if (debugSpheres.current.rightShoulder) {
                debugSpheres.current.rightShoulder.position.copy(shoulderPos);
                debugSpheres.current.rightShoulder.position.multiplyScalar(50); // Scale up for visibility
                debugSpheres.current.rightShoulder.visible = true;
              }
              if (debugSpheres.current.rightWrist) {
                debugSpheres.current.rightWrist.position.copy(wristPos);
                debugSpheres.current.rightWrist.position.multiplyScalar(50);
                debugSpheres.current.rightWrist.visible = true;
              }
              if (debugSpheres.current.rightElbow) {
                debugSpheres.current.rightElbow.visible = false;
              }
            }
            
            const armDir = wristPos.clone().sub(shoulderPos).normalize();
            const armRotation = new THREE.Quaternion();
            
            // For T-pose avatars, right arm points right
            const tPoseDirection = new THREE.Vector3(1, 0, 0); // Right arm points right
            armRotation.setFromUnitVectors(tPoseDirection, armDir);
            
            // Combine with initial rotation
            const finalRotation = initialRotations.current['rightArm'] ? 
              initialRotations.current['rightArm'].clone().multiply(armRotation) : 
              armRotation;
            
            rightArmBone.current.quaternion.slerp(finalRotation, 0.2);
            
            if (frameCount.current % 60 === 0) {
              console.log('[FullBodyAvatar] Right arm (shoulder-wrist only):', {
                shoulderPos: shoulderPos.toArray().map(v => v.toFixed(2)),
                wristPos: wristPos.toArray().map(v => v.toFixed(2)),
                armDir: armDir.toArray().map(v => v.toFixed(2))
              });
            }
          }
          // Case 3: Only shoulder - apply default pose
          else if (rightArmBone.current) {
            const defaultRotation = initialRotations.current['rightArm'] || new THREE.Quaternion();
            rightArmBone.current.quaternion.slerp(defaultRotation, 0.05);
            
            if (rightForeArmBone.current) {
              // Return forearm to initial rotation
              if (initialEulers.current['rightForeArm']) {
                const currentRotation = rightForeArmBone.current.rotation.clone();
                const targetRotation = initialEulers.current['rightForeArm'];
                rightForeArmBone.current.rotation.x = THREE.MathUtils.lerp(currentRotation.x, targetRotation.x, 0.05);
                rightForeArmBone.current.rotation.y = THREE.MathUtils.lerp(currentRotation.y, targetRotation.y, 0.05);
                rightForeArmBone.current.rotation.z = THREE.MathUtils.lerp(currentRotation.z, targetRotation.z, 0.05);
              }
            }
            
            // Update debug spheres
            if (debugSpheres.current) {
              if (debugSpheres.current.rightShoulder) {
                debugSpheres.current.rightShoulder.visible = false;
              }
              if (debugSpheres.current.rightElbow) {
                debugSpheres.current.rightElbow.visible = false;
              }
              if (debugSpheres.current.rightWrist) {
                debugSpheres.current.rightWrist.visible = false;
              }
            }
          }
        }
      }
    } else {
      // Log when no keypoints are available
      if (frameCount.current % 60 === 0) {
        console.log('[FullBodyAvatar] No keypoints available');
      }
    }
    
    // Apply facial expressions
    if (trackingData?.expressions && morphTargetMeshes.current.length > 0) {
      const expressions = trackingData.expressions;
      morphTargetMeshes.current.forEach(mesh => {
        if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;
        
        Object.entries(expressions).forEach(([expression, value]) => {
          const index = mesh.morphTargetDictionary![expression];
          if (index !== undefined && mesh.morphTargetInfluences) {
            mesh.morphTargetInfluences[index] = value * 1.5; // Amplify
          }
        });
      });
    }
    
    // Idle pose system
    if (!poseInitialized.current) {
      idlePoseTimer.current += delta;
      if (idlePoseTimer.current > 2) {
        poseInitialized.current = true;
      }
    }
    
    if (poseInitialized.current) {
      if (leftArmBone.current) {
        leftArmBone.current.quaternion.slerp(idlePose.leftArm, 0.05);
      }
      if (rightArmBone.current) {
        rightArmBone.current.quaternion.slerp(idlePose.rightArm, 0.05);
      }
      if (leftForeArmBone.current) {
        leftForeArmBone.current.rotation.z = THREE.MathUtils.lerp(leftForeArmBone.current.rotation.z, idlePose.leftForeArm.z, 0.05);
      }
      if (rightForeArmBone.current) {
        rightForeArmBone.current.rotation.z = THREE.MathUtils.lerp(rightForeArmBone.current.rotation.z, idlePose.rightForeArm.z, 0.05);
      }
    }
  });
  
  return (
    <group ref={groupRef} position={position} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
};

export default FullBodyAvatar;
