import React, { useRef, useEffect, useState, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Use the PostureData type from your app
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

interface AvatarProps {
  postureData: PostureData | null;
}

function Avatar({ postureData }: AvatarProps) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/avatars/AngelChick.glb');
  const { animations: idleAnimations } = useGLTF('/animations/feminine/idle/F_Standing_Idle_001.glb');
  
  // Animation mixer
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  
  // Bone references
  const headBone = useRef<THREE.Bone | null>(null);
  const neckBone = useRef<THREE.Bone | null>(null);
  const leftArmBone = useRef<THREE.Bone | null>(null);
  const rightArmBone = useRef<THREE.Bone | null>(null);
  const leftForeArmBone = useRef<THREE.Bone | null>(null);
  const rightForeArmBone = useRef<THREE.Bone | null>(null);
  
  // Store initial rotations
  const initialRotations = useRef<{ [key: string]: THREE.Quaternion }>({});
  
  // Initialize bones
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Bone) {
          const name = child.name.toLowerCase();
          
          if (name.includes('head')) {
            headBone.current = child;
            initialRotations.current['head'] = child.quaternion.clone();
          } else if (name.includes('neck')) {
            neckBone.current = child;
            initialRotations.current['neck'] = child.quaternion.clone();
          } else if (name.includes('leftarm') || name.includes('left_arm') || name.includes('l_arm')) {
            if (name.includes('forearm') || name.includes('fore')) {
              leftForeArmBone.current = child;
              initialRotations.current['leftForeArm'] = child.quaternion.clone();
            } else {
              leftArmBone.current = child;
              initialRotations.current['leftArm'] = child.quaternion.clone();
            }
          } else if (name.includes('rightarm') || name.includes('right_arm') || name.includes('r_arm')) {
            if (name.includes('forearm') || name.includes('fore')) {
              rightForeArmBone.current = child;
              initialRotations.current['rightForeArm'] = child.quaternion.clone();
            } else {
              rightArmBone.current = child;
              initialRotations.current['rightArm'] = child.quaternion.clone();
            }
          }
        }
      });
      
      if (group.current) {
        group.current.clear();
        group.current.add(scene);
      }
    }
  }, [scene]);

  // Start idle animation
  useEffect(() => {
    if (scene && idleAnimations && idleAnimations.length > 0) {
      const mixer = new THREE.AnimationMixer(scene);
      mixerRef.current = mixer;
      
      const action = mixer.clipAction(idleAnimations[0]);
      action.reset();
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.play();
    }
  }, [scene, idleAnimations]);

  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
    
    if (!postureData || !postureData.keypoints) {
      return;
    }
    
    const keypoints = postureData.keypoints;
    
    // Head tracking
    if (keypoints.nose && keypoints.nose.confidence > 0.3 && headBone.current) {
      const headRotation = new THREE.Euler(
        (keypoints.nose.y - 0.5) * 0.5,
        -(keypoints.nose.x - 0.5) * 0.5,
        0
      );
      headBone.current.quaternion.setFromEuler(headRotation);
    }
    
    // Arm tracking using the working approach from memories
    const applyArmRotation = (
      shoulderKeypoint: PostureKeypoint,
      elbowKeypoint: PostureKeypoint,
      wristKeypoint: PostureKeypoint,
      armBone: THREE.Bone | null,
      foreArmBone: THREE.Bone | null,
      isLeft: boolean
    ) => {
      if (!armBone || !shoulderKeypoint || !elbowKeypoint || !wristKeypoint) return;
      if (shoulderKeypoint.confidence < 0.3 || elbowKeypoint.confidence < 0.3 || wristKeypoint.confidence < 0.3) return;
      
      // Normalize coordinates (from memories)
      const shoulderPos = new THREE.Vector3(
        (shoulderKeypoint.x / 640 - 0.5) * 2,
        -(shoulderKeypoint.y / 480 - 0.5) * 2,
        0
      );
      
      const elbowPos = new THREE.Vector3(
        (elbowKeypoint.x / 640 - 0.5) * 2,
        -(elbowKeypoint.y / 480 - 0.5) * 2,
        -0.15
      );
      
      const wristPos = new THREE.Vector3(
        (wristKeypoint.x / 640 - 0.5) * 2,
        -(wristKeypoint.y / 480 - 0.5) * 2,
        -0.3
      );
      
      // Calculate arm direction
      const armDir = wristPos.clone().sub(shoulderPos).normalize();
      
      // T-pose reference directions (from memories)
      const tPoseDir = isLeft ? new THREE.Vector3(-1, 0, 0) : new THREE.Vector3(1, 0, 0);
      
      // Calculate rotation from T-pose to current pose
      const rotation = new THREE.Quaternion();
      rotation.setFromUnitVectors(tPoseDir, armDir);
      
      // Apply rotation directly (not combined with idle)
      armBone.quaternion.copy(rotation);
      
      // Forearm rotation
      if (foreArmBone) {
        const forearmDir = wristPos.clone().sub(elbowPos).normalize();
        const upperArmDir = elbowPos.clone().sub(shoulderPos).normalize();
        
        const angle = upperArmDir.angleTo(forearmDir);
        const bendRotation = new THREE.Quaternion();
        bendRotation.setFromAxisAngle(new THREE.Vector3(0, 0, isLeft ? -1 : 1), angle * 0.5);
        
        foreArmBone.quaternion.copy(initialRotations.current[isLeft ? 'leftForeArm' : 'rightForeArm']);
        foreArmBone.quaternion.multiply(bendRotation);
      }
    };
    
    // Apply arm tracking
    if (keypoints.leftShoulder && keypoints.leftElbow && keypoints.leftWrist) {
      applyArmRotation(
        keypoints.leftShoulder,
        keypoints.leftElbow,
        keypoints.leftWrist,
        leftArmBone.current,
        leftForeArmBone.current,
        true
      );
    }
    
    if (keypoints.rightShoulder && keypoints.rightElbow && keypoints.rightWrist) {
      applyArmRotation(
        keypoints.rightShoulder,
        keypoints.rightElbow,
        keypoints.rightWrist,
        rightArmBone.current,
        rightForeArmBone.current,
        false
      );
    }
  });

  return <group ref={group} scale={100} position={[0, -100, 0]} />;
}

// Pose detection component using the working pattern
function PoseDetection({ onPoseData }: { onPoseData: (data: PostureData | null) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    // Initialize webcam
    const initWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
      }
    };
    
    initWebcam();
    
    // Load PoseNet
    const loadPoseNet = async () => {
      // @ts-ignore - ml5 is loaded via script tag
      if (typeof ml5 !== 'undefined') {
        const poseNet = ml5.poseNet(videoRef.current, () => {
          console.log('PoseNet loaded');
        });
        
        poseNet.on('pose', (results: any) => {
          if (results.length > 0) {
            const pose = results[0].pose;
            const keypoints: { [key: string]: PostureKeypoint } = {};
            
            // Convert ml5 keypoints to our format
            pose.keypoints.forEach((kp: any) => {
              keypoints[kp.part] = {
                x: kp.position.x,
                y: kp.position.y,
                confidence: kp.score
              };
            });
            
            onPoseData({
              keypoints,
              confidence: pose.score
            });
          }
        });
      }
    };
    
    // Wait a bit for ml5 to load
    setTimeout(loadPoseNet, 1000);
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onPoseData]);
  
  return (
    <video
      ref={videoRef}
      style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 320,
        height: 240,
        transform: 'scaleX(-1)',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}
    />
  );
}

export default function WorkingPoseAvatar() {
  const [postureData, setPostureData] = useState<PostureData | null>(null);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas camera={{ position: [0, 100, 300], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Suspense fallback={null}>
          <Avatar postureData={postureData} />
        </Suspense>
        <OrbitControls />
        <gridHelper args={[500, 50]} />
      </Canvas>
      
      <PoseDetection onPoseData={setPostureData} />
    </div>
  );
}

// Preload models
useGLTF.preload('/avatars/AngelChick.glb');
useGLTF.preload('/animations/feminine/idle/F_Standing_Idle_001.glb');

// TypeScript declaration for ml5
declare global {
  interface Window {
    ml5: any;
  }
  const ml5: any;
}
