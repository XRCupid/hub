import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface SimpleAvatarProps {
  avatarUrl: string;
  position?: [number, number, number];
  scale?: number;
  isSpeaking?: boolean;
  emotion?: 'neutral' | 'happy' | 'sad' | 'surprised' | 'thinking';
}

const SimpleAvatar: React.FC<SimpleAvatarProps> = ({
  avatarUrl,
  position = [0, 0, 0],
  scale = 1,
  isSpeaking = false,
  emotion = 'neutral'
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(avatarUrl);
  
  // Clone scene to avoid conflicts
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);
  
  // Simple idle animation
  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Breathing animation
    const breathingScale = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    groupRef.current.scale.y = breathingScale * scale;
    
    // Speaking animation
    if (isSpeaking) {
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 5) * 0.02;
    }
    
    // Subtle sway
    groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.01;
  });
  
  // Apply emotion-based pose
  useEffect(() => {
    if (!groupRef.current) return;
    
    const emotionPoses = {
      neutral: { x: 0, y: 0, z: 0 },
      happy: { x: -0.05, y: 0, z: 0 },
      sad: { x: 0.05, y: 0, z: 0 },
      surprised: { x: -0.1, y: 0, z: 0 },
      thinking: { x: 0, y: 0.1, z: 0 }
    };
    
    const pose = emotionPoses[emotion];
    groupRef.current.rotation.x = pose.x;
    groupRef.current.rotation.y = pose.y;
  }, [emotion]);
  
  return (
    <group ref={groupRef} position={position} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
};

// Fallback avatar for when GLB files aren't available
export const FallbackAvatar: React.FC<Omit<SimpleAvatarProps, 'avatarUrl'>> = (props) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Simple animations
    meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    if (props.isSpeaking) {
      meshRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.05;
    }
  });
  
  const color = props.emotion === 'happy' ? '#4ade80' : 
                 props.emotion === 'sad' ? '#60a5fa' :
                 props.emotion === 'surprised' ? '#f59e0b' : '#a78bfa';
  
  return (
    <group position={props.position} scale={props.scale}>
      {/* Head */}
      <mesh ref={meshRef} position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Body */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 1.2, 32]} />
        <meshStandardMaterial color="#667eea" />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.1, 1.65, 0.25]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.1, 1.65, 0.25]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
};

export default SimpleAvatar;
