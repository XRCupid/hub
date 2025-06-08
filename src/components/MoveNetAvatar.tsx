import React, { useRef, useEffect, useState, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs';

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
  const spineBone = useRef<THREE.Bone | null>(null);
  const leftShoulderBone = useRef<THREE.Bone | null>(null);
  const rightShoulderBone = useRef<THREE.Bone | null>(null);
  const leftArmBone = useRef<THREE.Bone | null>(null);
  const rightArmBone = useRef<THREE.Bone | null>(null);
  const leftForeArmBone = useRef<THREE.Bone | null>(null);
  const rightForeArmBone = useRef<THREE.Bone | null>(null);
  const leftHandBone = useRef<THREE.Bone | null>(null);
  const rightHandBone = useRef<THREE.Bone | null>(null);
  const hipsBone = useRef<THREE.Bone | null>(null);
  
  // Store initial rotations
  const initialRotations = useRef<{ [key: string]: THREE.Quaternion }>({});
  
  // Debug spheres
  const debugSpheres = useRef<{ [key: string]: THREE.Mesh }>({});
  
  // Initialize bones and animations
  useEffect(() => {
    if (scene) {
      // Find bones in the original scene
      scene.traverse((child) => {
        if (child instanceof THREE.Bone) {
          const name = child.name.toLowerCase();
          
          if (name.includes('head')) headBone.current = child;
          else if (name.includes('neck')) neckBone.current = child;
          else if (name.includes('spine') && !name.includes('spine1') && !name.includes('spine2')) spineBone.current = child;
          else if (name.includes('leftshoulder')) leftShoulderBone.current = child;
          else if (name.includes('rightshoulder')) rightShoulderBone.current = child;
          else if (name.includes('leftarm') && !name.includes('fore')) leftArmBone.current = child;
          else if (name.includes('rightarm') && !name.includes('fore')) rightArmBone.current = child;
          else if (name.includes('leftforearm')) leftForeArmBone.current = child;
          else if (name.includes('rightforearm')) rightForeArmBone.current = child;
          else if (name.includes('lefthand')) leftHandBone.current = child;
          else if (name.includes('righthand')) rightHandBone.current = child;
          else if (name.includes('hips')) hipsBone.current = child;
        }
      });
      
      // Store initial rotations
      const bones = {
        head: headBone.current,
        neck: neckBone.current,
        spine: spineBone.current,
        leftShoulder: leftShoulderBone.current,
        rightShoulder: rightShoulderBone.current,
        leftArm: leftArmBone.current,
        rightArm: rightArmBone.current,
        leftForeArm: leftForeArmBone.current,
        rightForeArm: rightForeArmBone.current,
        leftHand: leftHandBone.current,
        rightHand: rightHandBone.current,
        hips: hipsBone.current
      };
      
      Object.entries(bones).forEach(([key, bone]) => {
        if (bone) {
          initialRotations.current[key] = bone.quaternion.clone();
        }
      });
      
      // Add scene to group
      if (group.current) {
        group.current.clear();
        group.current.add(scene);
      }
    }
  }, [scene]);

  // Create debug spheres
  useEffect(() => {
    const colors = {
      leftShoulder: 0xff0000,
      rightShoulder: 0xff0000,
      leftElbow: 0x00ff00,
      rightElbow: 0x00ff00,
      leftWrist: 0x0000ff,
      rightWrist: 0x0000ff,
      nose: 0xffff00,
      leftEye: 0xff00ff,
      rightEye: 0xff00ff,
      leftEar: 0x00ffff,
      rightEar: 0x00ffff,
      leftHip: 0xff8800,
      rightHip: 0xff8800,
      leftKnee: 0x88ff00,
      rightKnee: 0x88ff00,
      leftAnkle: 0x8800ff,
      rightAnkle: 0x8800ff
    };
    
    Object.entries(colors).forEach(([key, color]) => {
      const geometry = new THREE.SphereGeometry(2, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.visible = false;
      debugSpheres.current[key] = sphere;
      if (group.current) {
        group.current.add(sphere);
      }
    });
  }, []);

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
    
    // MoveNet keypoint indices
    const KEYPOINT_DICT = {
      'nose': 0,
      'left_eye': 1,
      'right_eye': 2,
      'left_ear': 3,
      'right_ear': 4,
      'left_shoulder': 5,
      'right_shoulder': 6,
      'left_elbow': 7,
      'right_elbow': 8,
      'left_wrist': 9,
      'right_wrist': 10,
      'left_hip': 11,
      'right_hip': 12,
      'left_knee': 13,
      'right_knee': 14,
      'left_ankle': 15,
      'right_ankle': 16
    };
    
    // Get keypoints with proper indexing
    const leftShoulder = keypoints[KEYPOINT_DICT['left_shoulder']];
    const rightShoulder = keypoints[KEYPOINT_DICT['right_shoulder']];
    const leftElbow = keypoints[KEYPOINT_DICT['left_elbow']];
    const rightElbow = keypoints[KEYPOINT_DICT['right_elbow']];
    const leftWrist = keypoints[KEYPOINT_DICT['left_wrist']];
    const rightWrist = keypoints[KEYPOINT_DICT['right_wrist']];
    
    // Left arm tracking
    if (leftShoulder && leftShoulder.score > 0.3 && 
        leftElbow && leftElbow.score > 0.3 && 
        leftWrist && leftWrist.score > 0.3 && 
        leftArmBone.current) {
      
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
      if (debugSpheres.current.leftShoulder) {
        debugSpheres.current.leftShoulder.position.set(
          shoulderPos.x * 30,
          shoulderPos.y * 30,
          shoulderPos.z * 30
        );
        debugSpheres.current.leftShoulder.visible = true;
      }
      
      if (debugSpheres.current.leftElbow) {
        debugSpheres.current.leftElbow.position.set(
          elbowPos.x * 30,
          elbowPos.y * 30,
          elbowPos.z * 30
        );
        debugSpheres.current.leftElbow.visible = true;
      }
      
      if (debugSpheres.current.leftWrist) {
        debugSpheres.current.leftWrist.position.set(
          wristPos.x * 30,
          wristPos.y * 30,
          wristPos.z * 30
        );
        debugSpheres.current.leftWrist.visible = true;
      }
      
      // Calculate upper arm direction
      const upperArmDir = elbowPos.clone().sub(shoulderPos).normalize();
      
      // Create rotation from T-pose
      const tPoseDirection = new THREE.Vector3(-1, 0, 0); // Left arm points left
      const rotation = new THREE.Quaternion();
      rotation.setFromUnitVectors(tPoseDirection, upperArmDir);
      
      // Combine with initial rotation
      const finalRotation = initialRotations.current['leftArm'].clone().multiply(rotation);
      
      // Apply with smoothing
      leftArmBone.current.quaternion.slerp(finalRotation, 0.2);
      
      // Handle forearm
      if (leftForeArmBone.current) {
        const upperArmVector = elbowPos.clone().sub(shoulderPos);
        const forearmVector = wristPos.clone().sub(elbowPos);
        const angle = upperArmVector.angleTo(forearmVector);
        const bendAngle = Math.PI - angle;
        
        // Apply bend from initial rotation
        const initialEuler = new THREE.Euler().setFromQuaternion(initialRotations.current['leftForeArm']);
        leftForeArmBone.current.rotation.set(
          initialEuler.x,
          initialEuler.y,
          initialEuler.z - Math.min(bendAngle * 0.8, Math.PI * 0.8)
        );
      }
    }
    
    // Right arm tracking
    if (rightShoulder && rightShoulder.score > 0.3 && 
        rightElbow && rightElbow.score > 0.3 && 
        rightWrist && rightWrist.score > 0.3 && 
        rightArmBone.current) {
      
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
      if (debugSpheres.current.rightShoulder) {
        debugSpheres.current.rightShoulder.position.set(
          shoulderPos.x * 30,
          shoulderPos.y * 30,
          shoulderPos.z * 30
        );
        debugSpheres.current.rightShoulder.visible = true;
      }
      
      if (debugSpheres.current.rightElbow) {
        debugSpheres.current.rightElbow.position.set(
          elbowPos.x * 30,
          elbowPos.y * 30,
          elbowPos.z * 30
        );
        debugSpheres.current.rightElbow.visible = true;
      }
      
      if (debugSpheres.current.rightWrist) {
        debugSpheres.current.rightWrist.position.set(
          wristPos.x * 30,
          wristPos.y * 30,
          wristPos.z * 30
        );
        debugSpheres.current.rightWrist.visible = true;
      }
      
      // Calculate upper arm direction
      const upperArmDir = elbowPos.clone().sub(shoulderPos).normalize();
      
      // Create rotation from T-pose
      const tPoseDirection = new THREE.Vector3(1, 0, 0); // Right arm points right
      const rotation = new THREE.Quaternion();
      rotation.setFromUnitVectors(tPoseDirection, upperArmDir);
      
      // Combine with initial rotation
      const finalRotation = initialRotations.current['rightArm'].clone().multiply(rotation);
      
      // Apply with smoothing
      rightArmBone.current.quaternion.slerp(finalRotation, 0.2);
      
      // Handle forearm
      if (rightForeArmBone.current) {
        const upperArmVector = elbowPos.clone().sub(shoulderPos);
        const forearmVector = wristPos.clone().sub(elbowPos);
        const angle = upperArmVector.angleTo(forearmVector);
        const bendAngle = Math.PI - angle;
        
        // Apply bend from initial rotation
        const initialEuler = new THREE.Euler().setFromQuaternion(initialRotations.current['rightForeArm']);
        rightForeArmBone.current.rotation.set(
          initialEuler.x,
          initialEuler.y,
          initialEuler.z + Math.min(bendAngle * 0.8, Math.PI * 0.8)
        );
      }
    }
  });

  return <group ref={group} scale={[100, 100, 100]} position={[0, -100, 0]} />;
}

export default function MoveNetAvatar() {
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [postureData, setPostureData] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    // Initialize TensorFlow.js and MoveNet
    const initializeDetector = async () => {
      try {
        // Wait for TensorFlow.js to be ready
        await tf.ready();
        console.log('TensorFlow.js backend:', tf.getBackend());
        
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
          minPoseScore: 0.25
        };
        
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          detectorConfig
        );
        
        setDetector(detector);
        console.log('MoveNet detector initialized');
      } catch (error) {
        console.error('Error initializing MoveNet:', error);
      }
    };
    
    initializeDetector();
    
    return () => {
      if (detector) {
        detector.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (!detector) return;
    
    // Setup webcam
    const setupCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Browser API navigator.mediaDevices.getUserMedia not available');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => resolve(null);
          }
        });
      }
    };

    const detectPose = async () => {
      if (!detector || !videoRef.current) return;
      
      try {
        const poses = await detector.estimatePoses(videoRef.current);
        
        if (poses.length > 0) {
          setPostureData(poses[0]);
        } else {
          setPostureData(null);
        }
      } catch (error) {
        console.error('Error detecting pose:', error);
      }
      
      animationFrameRef.current = requestAnimationFrame(detectPose);
    };

    setupCamera().then(() => {
      detectPose();
    });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [detector]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '320px',
          height: '240px',
          transform: 'scaleX(-1)',
          zIndex: 10
        }}
      />
      
      <Canvas
        camera={{ position: [0, 100, 300], fov: 50 }}
        style={{ background: '#f0f0f0' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Suspense fallback={null}>
          <Avatar postureData={postureData} />
        </Suspense>
        <OrbitControls />
        <gridHelper args={[500, 50]} />
      </Canvas>
    </div>
  );
}

// Preload the avatar model
useGLTF.preload('/avatars/AngelChick.glb');
useGLTF.preload('/animations/feminine/idle/F_Standing_Idle_001.glb');
