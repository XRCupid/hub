import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

interface GazeData {
  x: number;
  y: number;
  confidence?: number;
}

interface AvatarProps {
  gazeData: GazeData | null;
}

function Avatar({ gazeData }: AvatarProps) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/avatars/AngelChick.glb');
  const { animations: idleAnimations } = useGLTF('/animations/feminine/idle/F_Standing_Idle_001.glb');
  
  // Animation mixer
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  
  // Eye bone references
  const leftEyeBone = useRef<THREE.Bone | null>(null);
  const rightEyeBone = useRef<THREE.Bone | null>(null);
  const headBone = useRef<THREE.Bone | null>(null);
  
  // Store initial rotations
  const initialRotations = useRef<{ [key: string]: THREE.Quaternion }>({});
  
  // Smooth gaze tracking
  const smoothedGaze = useRef({ x: 0.5, y: 0.5 });
  const smoothingFactor = 0.15; // Higher = smoother but less responsive
  
  // Initialize bones and animation
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Bone) {
          const name = child.name.toLowerCase();
          
          if (name.includes('eye_l') || name.includes('lefteye') || name.includes('l_eye')) {
            leftEyeBone.current = child;
            initialRotations.current['leftEye'] = child.quaternion.clone();
            console.log('Found left eye bone:', child.name);
          } else if (name.includes('eye_r') || name.includes('righteye') || name.includes('r_eye')) {
            rightEyeBone.current = child;
            initialRotations.current['rightEye'] = child.quaternion.clone();
            console.log('Found right eye bone:', child.name);
          } else if (name.includes('head') && !name.includes('headtop')) {
            headBone.current = child;
            initialRotations.current['head'] = child.quaternion.clone();
            console.log('Found head bone:', child.name);
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
    
    if (!gazeData) return;
    
    // Normalize gaze coordinates (WebGazer gives screen coordinates)
    const normalizedX = gazeData.x / window.innerWidth;
    const normalizedY = gazeData.y / window.innerHeight;
    
    // Smooth the gaze data
    smoothedGaze.current.x += (normalizedX - smoothedGaze.current.x) * smoothingFactor;
    smoothedGaze.current.y += (normalizedY - smoothedGaze.current.y) * smoothingFactor;
    
    // Convert to rotation angles
    // Map screen coordinates to reasonable eye rotation ranges
    const maxEyeRotation = Math.PI / 6; // 30 degrees max
    const eyeRotationX = (smoothedGaze.current.y - 0.5) * maxEyeRotation;
    const eyeRotationY = -(smoothedGaze.current.x - 0.5) * maxEyeRotation;
    
    // Apply eye rotations
    if (leftEyeBone.current && initialRotations.current['leftEye']) {
      const rotation = new THREE.Euler(eyeRotationX, eyeRotationY, 0);
      const quaternion = new THREE.Quaternion().setFromEuler(rotation);
      leftEyeBone.current.quaternion.copy(initialRotations.current['leftEye']);
      leftEyeBone.current.quaternion.multiply(quaternion);
    }
    
    if (rightEyeBone.current && initialRotations.current['rightEye']) {
      const rotation = new THREE.Euler(eyeRotationX, eyeRotationY, 0);
      const quaternion = new THREE.Quaternion().setFromEuler(rotation);
      rightEyeBone.current.quaternion.copy(initialRotations.current['rightEye']);
      rightEyeBone.current.quaternion.multiply(quaternion);
    }
    
    // Subtle head movement following eyes (10% of eye movement)
    if (headBone.current && initialRotations.current['head']) {
      const headRotation = new THREE.Euler(eyeRotationX * 0.1, eyeRotationY * 0.1, 0);
      const headQuaternion = new THREE.Quaternion().setFromEuler(headRotation);
      headBone.current.quaternion.copy(initialRotations.current['head']);
      headBone.current.quaternion.multiply(headQuaternion);
    }
  });

  return <group ref={group} scale={100} position={[0, -100, 0]} />;
}

// WebGazer integration component
function WebGazerIntegration({ onGazeData }: { onGazeData: (data: GazeData | null) => void }) {
  const [isWebGazerReady, setIsWebGazerReady] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState<number>(0);
  
  useEffect(() => {
    // Check if webgazer is loaded
    if (!window.webgazer) {
      console.error('WebGazer not loaded. Add it to index.html');
      return;
    }
    
    const initWebGazer = async () => {
      try {
        // Start WebGazer
        await window.webgazer
          .setGazeListener((data: any, elapsedTime: number) => {
            if (data) {
              onGazeData({
                x: data.x,
                y: data.y,
                confidence: 1 // WebGazer doesn't provide confidence
              });
            }
          })
          .begin();
        
        // Configure WebGazer
        window.webgazer.showVideoPreview(true);
        window.webgazer.showPredictionPoints(true);
        window.webgazer.showFaceOverlay(false);
        window.webgazer.showFaceFeedbackBox(false);
        
        setIsWebGazerReady(true);
      } catch (error) {
        console.error('Failed to initialize WebGazer:', error);
      }
    };
    
    initWebGazer();
    
    return () => {
      if (window.webgazer) {
        window.webgazer.end();
      }
    };
  }, [onGazeData]);
  
  // Simple calibration UI
  const calibrate = () => {
    if (!window.webgazer) return;
    
    // Create calibration points
    const points = [
      { x: 0.1, y: 0.1 },
      { x: 0.5, y: 0.1 },
      { x: 0.9, y: 0.1 },
      { x: 0.1, y: 0.5 },
      { x: 0.5, y: 0.5 },
      { x: 0.9, y: 0.5 },
      { x: 0.1, y: 0.9 },
      { x: 0.5, y: 0.9 },
      { x: 0.9, y: 0.9 }
    ];
    
    let currentPoint = 0;
    
    const showNextPoint = () => {
      if (currentPoint >= points.length) {
        setCalibrationPoints(0);
        return;
      }
      
      const point = points[currentPoint];
      const dot = document.createElement('div');
      dot.style.position = 'fixed';
      dot.style.width = '20px';
      dot.style.height = '20px';
      dot.style.borderRadius = '50%';
      dot.style.backgroundColor = 'red';
      dot.style.left = `${point.x * window.innerWidth - 10}px`;
      dot.style.top = `${point.y * window.innerHeight - 10}px`;
      dot.style.zIndex = '10000';
      dot.style.cursor = 'pointer';
      
      dot.onclick = () => {
        // Register calibration click
        if (window.webgazer) {
          window.webgazer.recordScreenPosition(point.x * window.innerWidth, point.y * window.innerHeight);
        }
        dot.remove();
        currentPoint++;
        setCalibrationPoints(currentPoint);
        setTimeout(showNextPoint, 500);
      };
      
      document.body.appendChild(dot);
    };
    
    showNextPoint();
  };
  
  return (
    <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
      <div style={{ 
        background: 'rgba(0,0,0,0.8)', 
        color: 'white', 
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '10px'
      }}>
        {isWebGazerReady ? 'WebGazer Ready' : 'Initializing WebGazer...'}
        {calibrationPoints > 0 && ` (Calibration: ${calibrationPoints}/9)`}
      </div>
      <button 
        onClick={calibrate}
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
    </div>
  );
}

export default function EyeTrackingAvatar() {
  const [gazeData, setGazeData] = useState<GazeData | null>(null);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas camera={{ position: [0, 100, 300], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Suspense fallback={null}>
          <Avatar gazeData={gazeData} />
        </Suspense>
        <OrbitControls />
        <gridHelper args={[500, 50]} />
      </Canvas>
      
      <WebGazerIntegration onGazeData={setGazeData} />
      
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
          fontFamily: 'monospace'
        }}>
          Gaze: X={gazeData.x.toFixed(0)}, Y={gazeData.y.toFixed(0)}
        </div>
      )}
    </div>
  );
}

// Preload models
useGLTF.preload('/avatars/AngelChick.glb');
useGLTF.preload('/animations/feminine/idle/F_Standing_Idle_001.glb');

// TypeScript declarations for WebGazer
declare global {
  interface Window {
    webgazer: any;
  }
}
