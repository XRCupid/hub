import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

interface AvatarProps {
  postureData: any;
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
  
  // Initialize bones and animations
  useEffect(() => {
    if (scene) {
      // Find bones in the original scene
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
      
      // Add scene to group
      if (group.current) {
        group.current.clear();
        group.current.add(scene);
      }
    }
  }, [scene]);

  // Start idle animation
  useEffect(() => {
    if (scene && idleAnimations && idleAnimations.length > 0) {
      console.log('Setting up idle animation');
      const mixer = new THREE.AnimationMixer(scene);
      mixerRef.current = mixer;
      
      const action = mixer.clipAction(idleAnimations[0]);
      action.reset();
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.play();
      console.log('Started idle animation');
    }
  }, [scene, idleAnimations]);

  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  useFrame(() => {
    if (!postureData || !postureData.keypoints) {
      return;
    }
    
    const keypoints = postureData.keypoints;
    console.log('Processing keypoints:', keypoints.length, keypoints[0]);
    
    // PoseNet keypoint indices (different from MoveNet)
    const NOSE = 0;
    const LEFT_SHOULDER = 5;
    const RIGHT_SHOULDER = 6;
    const LEFT_ELBOW = 7;
    const RIGHT_ELBOW = 8;
    const LEFT_WRIST = 9;
    const RIGHT_WRIST = 10;
    
    // Head tracking
    const nose = keypoints[NOSE];
    if (nose && nose.score > 0.3 && headBone.current) {
      const headRotation = new THREE.Euler(
        (nose.y - 0.5) * 0.5,
        -(nose.x - 0.5) * 0.5,
        0
      );
      headBone.current.quaternion.setFromEuler(headRotation);
    }
    
    // Arm tracking with proper coordinate mapping
    const applyArmRotation = (
      shoulderKeypoint: any,
      elbowKeypoint: any,
      wristKeypoint: any,
      armBone: THREE.Bone | null,
      foreArmBone: THREE.Bone | null,
      isLeft: boolean
    ) => {
      if (!armBone || !shoulderKeypoint || !elbowKeypoint || !wristKeypoint) return;
      if (shoulderKeypoint.score < 0.3 || elbowKeypoint.score < 0.3 || wristKeypoint.score < 0.3) return;
      
      // Normalize coordinates
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
      
      // T-pose reference directions
      const tPoseDir = isLeft ? new THREE.Vector3(-1, 0, 0) : new THREE.Vector3(1, 0, 0);
      
      // Calculate rotation from T-pose to current pose
      const rotation = new THREE.Quaternion();
      rotation.setFromUnitVectors(tPoseDir, armDir);
      
      // Apply rotation
      armBone.quaternion.copy(rotation);
      
      // Forearm rotation
      if (foreArmBone) {
        const forearmDir = wristPos.clone().sub(elbowPos).normalize();
        const upperArmDir = elbowPos.clone().sub(shoulderPos).normalize();
        
        // Calculate elbow bend angle
        const angle = upperArmDir.angleTo(forearmDir);
        const bendRotation = new THREE.Quaternion();
        bendRotation.setFromAxisAngle(new THREE.Vector3(0, 0, isLeft ? -1 : 1), angle * 0.5);
        
        foreArmBone.quaternion.copy(initialRotations.current[isLeft ? 'leftForeArm' : 'rightForeArm']);
        foreArmBone.quaternion.multiply(bendRotation);
      }
    };
    
    // Apply arm tracking
    applyArmRotation(
      keypoints[LEFT_SHOULDER],
      keypoints[LEFT_ELBOW],
      keypoints[LEFT_WRIST],
      leftArmBone.current,
      leftForeArmBone.current,
      true
    );
    
    applyArmRotation(
      keypoints[RIGHT_SHOULDER],
      keypoints[RIGHT_ELBOW],
      keypoints[RIGHT_WRIST],
      rightArmBone.current,
      rightForeArmBone.current,
      false
    );
  });

  return <group ref={group} scale={100} position={[0, -100, 0]} />;
}

export default function MoveNetAvatarFixed() {
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [postureData, setPostureData] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    // Initialize PoseNet instead of MoveNet
    const initializeDetector = async () => {
      try {
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.PoseNet,
          {
            quantBytes: 4,
            architecture: 'MobileNetV1',
            outputStride: 16,
            inputResolution: { width: 640, height: 480 },
            multiplier: 0.75
          }
        );
        
        setDetector(detector);
        console.log('PoseNet detector initialized');
      } catch (error) {
        console.error('Error initializing PoseNet:', error);
      }
    };
    
    initializeDetector();
  }, []);

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
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!detector || !videoRef.current) return;
    
    console.log('Starting pose detection with detector:', detector);

    const detectPose = async () => {
      if (!detector || !videoRef.current) return;
      
      try {
        const poses = await detector.estimatePoses(videoRef.current);
        
        if (poses.length > 0) {
          console.log('Pose detected:', poses[0]);
          setPostureData(poses[0]);
        } else {
          console.log('No poses detected');
        }
      } catch (error) {
        console.error('Error detecting pose:', error);
      }
      
      animationFrameRef.current = requestAnimationFrame(detectPose);
    };

    detectPose();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [detector]);

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
    </div>
  );
}

// Preload models
useGLTF.preload('/avatars/AngelChick.glb');
useGLTF.preload('/animations/feminine/idle/F_Standing_Idle_001.glb');
