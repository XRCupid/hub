import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FacialBlendShapes } from '../services/AvatarMirrorSystem';

interface PreloadedAvatarProps {
  type: 'male' | 'female' | 'neutral';
  blendShapes?: FacialBlendShapes;
  position?: [number, number, number];
  scale?: number;
}

export const PreloadedAvatar: React.FC<PreloadedAvatarProps> = ({
  type = 'neutral',
  blendShapes,
  position = [0, 0, 0],
  scale = 1
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);

  // Animate blend shapes
  useFrame(() => {
    if (headRef.current && blendShapes) {
      // Simple expression mapping
      const mesh = headRef.current;
      
      // Simulate blend shape morphing with scale and position
      // This is a simplified version - in production you'd use actual morph targets
      if (blendShapes.mouthSmileLeft && blendShapes.mouthSmileRight) {
        const smileAmount = (blendShapes.mouthSmileLeft + blendShapes.mouthSmileRight) / 2;
        mesh.scale.x = 1 + smileAmount * 0.1;
      }
      
      if (blendShapes.eyeBlinkLeft && blendShapes.eyeBlinkRight) {
        const blinkAmount = (blendShapes.eyeBlinkLeft + blendShapes.eyeBlinkRight) / 2;
        // Simulate eye blink with scale
        if (mesh.children[0]) {
          mesh.children[0].scale.y = 1 - blinkAmount * 0.8;
        }
      }
    }
  });

  // Create avatar geometry based on type
  const getAvatarColor = () => {
    switch (type) {
      case 'male': return '#4A90E2';
      case 'female': return '#E74C8C';
      default: return '#9B59B6';
    }
  };

  const getBodyShape = () => {
    switch (type) {
      case 'male': return { shoulders: 1.2, hips: 0.9, height: 1.8 };
      case 'female': return { shoulders: 0.9, hips: 1.1, height: 1.65 };
      default: return { shoulders: 1, hips: 1, height: 1.7 };
    }
  };

  const shape = getBodyShape();

  return (
    <group position={position} scale={scale}>
      {/* Body */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[shape.hips * 0.3, shape.shoulders * 0.4, shape.height * 0.6, 8]} />
        <meshStandardMaterial color={getAvatarColor()} />
      </mesh>

      {/* Head */}
      <mesh ref={headRef} position={[0, shape.height * 0.4, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#F5DEB3" />
        
        {/* Eyes */}
        <mesh position={[-0.1, 0.05, 0.25]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[0.1, 0.05, 0.25]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        
        {/* Mouth */}
        <mesh position={[0, -0.1, 0.28]}>
          <boxGeometry args={[0.15, 0.02, 0.05]} />
          <meshStandardMaterial color="#C44569" />
        </mesh>
      </mesh>

      {/* Arms */}
      <mesh position={[-shape.shoulders * 0.5, 0, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.08, 0.08, shape.height * 0.5, 8]} />
        <meshStandardMaterial color={getAvatarColor()} />
      </mesh>
      <mesh position={[shape.shoulders * 0.5, 0, 0]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.08, 0.08, shape.height * 0.5, 8]} />
        <meshStandardMaterial color={getAvatarColor()} />
      </mesh>

      {/* Hair */}
      <mesh position={[0, shape.height * 0.55, 0]}>
        <sphereGeometry args={[0.32, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshStandardMaterial color={type === 'female' ? '#8B4513' : '#2C2C2C'} />
      </mesh>
    </group>
  );
};
