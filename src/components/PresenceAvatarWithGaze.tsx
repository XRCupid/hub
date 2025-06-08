import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

interface GazeData {
  x: number;
  y: number;
  onTarget: boolean;
}

interface AvatarWithGazeProps {
  gazeData: GazeData | null;
}

function AvatarWithGaze({ gazeData }: AvatarWithGazeProps) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/avatars/AngelChick.glb');
  const { animations: idleAnimations } = useGLTF('/animations/feminine/idle/F_Standing_Idle_001.glb');
  
  // Animation mixer
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  
  // Bone references - we'll look for all possible eye-related bones
  const bones = useRef<{
    leftEye?: THREE.Bone;
    rightEye?: THREE.Bone;
    head?: THREE.Bone;
    neck?: THREE.Bone;
  }>({});
  
  // Store initial rotations
  const initialRotations = useRef<{ [key: string]: THREE.Quaternion }>({});
  
  // Smooth gaze tracking
  const smoothedGaze = useRef({ x: 0.5, y: 0.5 });
  const smoothingFactor = 0.2;
  
  // Initialize bones and animation
  useEffect(() => {
    if (scene) {
      // Log all bones to help identify eye bones
      console.log('=== Avatar Bones ===');
      scene.traverse((child) => {
        if (child instanceof THREE.Bone) {
          console.log('Bone:', child.name);
          const name = child.name.toLowerCase();
          
          // Try various eye bone naming conventions
          if (name.includes('eye') && (name.includes('l') || name.includes('left'))) {
            bones.current.leftEye = child;
            initialRotations.current['leftEye'] = child.quaternion.clone();
            console.log('✓ Found left eye:', child.name);
          } else if (name.includes('eye') && (name.includes('r') || name.includes('right'))) {
            bones.current.rightEye = child;
            initialRotations.current['rightEye'] = child.quaternion.clone();
            console.log('✓ Found right eye:', child.name);
          } else if (name === 'head' || (name.includes('head') && !name.includes('top'))) {
            bones.current.head = child;
            initialRotations.current['head'] = child.quaternion.clone();
            console.log('✓ Found head:', child.name);
          } else if (name.includes('neck')) {
            bones.current.neck = child;
            initialRotations.current['neck'] = child.quaternion.clone();
            console.log('✓ Found neck:', child.name);
          }
        }
      });
      
      // Also check for morph targets that might control eyes
      scene.traverse((child) => {
        if (child instanceof THREE.SkinnedMesh && child.morphTargetDictionary) {
          console.log('Morph targets:', Object.keys(child.morphTargetDictionary));
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
      
      console.log('Started idle animation');
    }
  }, [scene, idleAnimations]);

  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
    
    if (!gazeData) return;
    
    // Normalize gaze coordinates (0-1 range)
    const normalizedX = gazeData.x / window.innerWidth;
    const normalizedY = gazeData.y / window.innerHeight;
    
    // Smooth the gaze data
    smoothedGaze.current.x += (normalizedX - smoothedGaze.current.x) * smoothingFactor;
    smoothedGaze.current.y += (normalizedY - smoothedGaze.current.y) * smoothingFactor;
    
    // Convert to rotation angles
    // Map screen coordinates to eye rotation ranges
    const maxEyeRotation = Math.PI / 8; // 22.5 degrees max for more subtle movement
    const eyeRotationX = -(smoothedGaze.current.y - 0.5) * maxEyeRotation * 2;
    const eyeRotationY = (smoothedGaze.current.x - 0.5) * maxEyeRotation * 2;
    
    // If we have eye bones, rotate them
    if (bones.current.leftEye && initialRotations.current['leftEye']) {
      const rotation = new THREE.Euler(eyeRotationX, eyeRotationY, 0, 'XYZ');
      bones.current.leftEye.quaternion.copy(initialRotations.current['leftEye']);
      bones.current.leftEye.quaternion.multiply(new THREE.Quaternion().setFromEuler(rotation));
    }
    
    if (bones.current.rightEye && initialRotations.current['rightEye']) {
      const rotation = new THREE.Euler(eyeRotationX, eyeRotationY, 0, 'XYZ');
      bones.current.rightEye.quaternion.copy(initialRotations.current['rightEye']);
      bones.current.rightEye.quaternion.multiply(new THREE.Quaternion().setFromEuler(rotation));
    }
    
    // If no eye bones found, use head movement as fallback
    if (!bones.current.leftEye && !bones.current.rightEye && bones.current.head && initialRotations.current['head']) {
      const headRotation = new THREE.Euler(eyeRotationX * 0.3, eyeRotationY * 0.3, 0, 'XYZ');
      bones.current.head.quaternion.copy(initialRotations.current['head']);
      bones.current.head.quaternion.multiply(new THREE.Quaternion().setFromEuler(headRotation));
    }
    
    // Subtle neck movement
    if (bones.current.neck && initialRotations.current['neck']) {
      const neckRotation = new THREE.Euler(eyeRotationX * 0.1, eyeRotationY * 0.1, 0, 'XYZ');
      bones.current.neck.quaternion.copy(initialRotations.current['neck']);
      bones.current.neck.quaternion.multiply(new THREE.Quaternion().setFromEuler(neckRotation));
    }
  });

  return <group ref={group} scale={100} position={[0, -100, 0]} />;
}

export default function PresenceAvatarWithGaze() {
  const [gazeData, setGazeData] = useState<GazeData | null>(null);
  const [isWebGazerReady, setIsWebGazerReady] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const webgazerRef = useRef<any>(null);

  // Initialize webcam first
  useEffect(() => {
    const initWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          console.log('Webcam initialized');
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

  // Initialize WebGazer after webcam is ready
  useEffect(() => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    
    const initWebGazer = async () => {
      if (!window.webgazer) {
        console.error('WebGazer not loaded. Make sure it\'s included in index.html');
        return;
      }
      
      try {
        console.log('Initializing WebGazer...');
        
        // Start WebGazer
        webgazerRef.current = await window.webgazer
          .setGazeListener((data: any, elapsedTime: number) => {
            if (data) {
              setGazeData({
                x: data.x,
                y: data.y,
                onTarget: true
              });
            }
          })
          .begin();
        
        // Configure WebGazer
        window.webgazer.showVideoPreview(false); // We'll show our own video
        window.webgazer.showPredictionPoints(true); // Show the red dot
        window.webgazer.showFaceOverlay(false);
        window.webgazer.showFaceFeedbackBox(false);
        
        setIsWebGazerReady(true);
        console.log('WebGazer initialized successfully');
      } catch (error) {
        console.error('Failed to initialize WebGazer:', error);
      }
    };
    
    // Wait a bit for video to be ready
    setTimeout(initWebGazer, 1000);
    
    return () => {
      if (window.webgazer) {
        try {
          window.webgazer.end();
        } catch (e) {
          console.error('Error ending WebGazer:', e);
        }
      }
    };
  }, [videoRef.current?.srcObject]);

  // Simple calibration
  const startCalibration = () => {
    setIsCalibrating(true);
    setCalibrationStep(0);
  };

  const handleCalibrationClick = (x: number, y: number) => {
    if (window.webgazer) {
      // Record calibration point
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          window.webgazer.recordScreenPosition(x, y);
        }, i * 100);
      }
    }
    
    setCalibrationStep(prev => prev + 1);
    
    if (calibrationStep >= 8) {
      setIsCalibrating(false);
      console.log('Calibration complete');
    }
  };

  // Calibration points
  const calibrationPoints = [
    { x: 0.1, y: 0.1 }, { x: 0.5, y: 0.1 }, { x: 0.9, y: 0.1 },
    { x: 0.1, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.9, y: 0.5 },
    { x: 0.1, y: 0.9 }, { x: 0.5, y: 0.9 }, { x: 0.9, y: 0.9 }
  ];

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 100, 300], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Suspense fallback={null}>
          <AvatarWithGaze gazeData={gazeData} />
        </Suspense>
        <OrbitControls />
        <gridHelper args={[500, 50]} />
      </Canvas>
      
      {/* Hidden video for WebGazer */}
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        width={640}
        height={480}
      />
      
      {/* Status and controls */}
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
        <div style={{ 
          background: 'rgba(0,0,0,0.8)', 
          color: 'white', 
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '10px'
        }}>
          {isWebGazerReady ? '✓ Eye Tracking Active' : '⏳ Initializing...'}
        </div>
        
        {isWebGazerReady && !isCalibrating && (
          <button 
            onClick={startCalibration}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Calibrate Eye Tracking
          </button>
        )}
      </div>
      
      {/* Calibration UI */}
      {isCalibrating && calibrationStep < calibrationPoints.length && (
        <div
          style={{
            position: 'absolute',
            left: `${calibrationPoints[calibrationStep].x * 100}%`,
            top: `${calibrationPoints[calibrationStep].y * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'red',
            cursor: 'pointer',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: 'white',
            fontWeight: 'bold'
          }}
          onClick={() => handleCalibrationClick(
            calibrationPoints[calibrationStep].x * window.innerWidth,
            calibrationPoints[calibrationStep].y * window.innerHeight
          )}
        >
          {calibrationStep + 1}
        </div>
      )}
      
      {/* Debug info */}
      {gazeData && (
        <div style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          <div>Gaze X: {Math.round(gazeData.x)}</div>
          <div>Gaze Y: {Math.round(gazeData.y)}</div>
          <div>Screen: {window.innerWidth}x{window.innerHeight}</div>
        </div>
      )}
    </div>
  );
}

// Preload models
useGLTF.preload('/avatars/AngelChick.glb');
useGLTF.preload('/animations/feminine/idle/F_Standing_Idle_001.glb');

// TypeScript declaration for WebGazer
declare global {
  interface Window {
    webgazer: any;
  }
}
