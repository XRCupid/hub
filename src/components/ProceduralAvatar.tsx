import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ProceduralAvatarProps {
  gender: 'male' | 'female';
  skinTone: string;
  hairColor: string;
  hairStyle: 'short' | 'medium' | 'long' | 'bald';
  clothingColor: string;
  position?: [number, number, number];
  blendShapes?: any;
}

export const ProceduralAvatar: React.FC<ProceduralAvatarProps> = ({
  gender,
  skinTone,
  hairColor,
  hairStyle,
  clothingColor,
  position = [0, 0, 0],
  blendShapes = {}
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  
  // Generate avatar colors
  const skinColor = useMemo(() => {
    const tones: Record<string, string> = {
      light: '#fdbcb4',
      medium: '#d4a574',
      dark: '#8b6f47',
      pale: '#ffe0bd',
      tan: '#cd853f'
    };
    return tones[skinTone] || tones.medium;
  }, [skinTone]);

  // Body proportions based on gender
  const proportions = useMemo(() => {
    return gender === 'female' ? {
      shoulderWidth: 0.35,
      hipWidth: 0.4,
      chestSize: 0.15,
      waistSize: 0.3,
      headSize: 0.25
    } : {
      shoulderWidth: 0.45,
      hipWidth: 0.35,
      chestSize: 0.1,
      waistSize: 0.35,
      headSize: 0.28
    };
  }, [gender]);

  // Animation
  useFrame((state) => {
    if (groupRef.current) {
      // Breathing animation
      groupRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.01;
      
      // Subtle idle movement
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
    
    // Apply blend shapes for expressions
    if (headRef.current && blendShapes) {
      // Simulate blend shape effects with scale/position adjustments
      if (blendShapes.mouthSmile) {
        // Smile effect
      }
      if (blendShapes.eyesClosed) {
        // Blink effect
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Head */}
      <mesh ref={headRef} position={[0, 1.6, 0]}>
        <sphereGeometry args={[proportions.headSize, 16, 16]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.08, 1.65, 0.2]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.08, 1.65, 0.2]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      
      {/* Hair */}
      {hairStyle !== 'bald' && (
        <mesh position={[0, 1.75, 0]}>
          <sphereGeometry args={[
            proportions.headSize + 0.05,
            16,
            16,
            0,
            Math.PI * 2,
            0,
            hairStyle === 'short' ? Math.PI * 0.4 : 
            hairStyle === 'medium' ? Math.PI * 0.5 : 
            Math.PI * 0.6
          ]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>
      )}
      
      {/* Body/Torso */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[
          proportions.shoulderWidth,
          proportions.hipWidth,
          0.8,
          8
        ]} />
        <meshStandardMaterial color={clothingColor} />
      </mesh>
      
      {/* Arms */}
      <mesh position={[-proportions.shoulderWidth - 0.15, 1, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.08, 0.06, 0.7, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh position={[proportions.shoulderWidth + 0.15, 1, 0]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.08, 0.06, 0.7, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      
      {/* Legs */}
      <mesh position={[-0.15, 0.2, 0]}>
        <cylinderGeometry args={[0.1, 0.08, 0.8, 8]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
      <mesh position={[0.15, 0.2, 0]}>
        <cylinderGeometry args={[0.1, 0.08, 0.8, 8]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
    </group>
  );
};

// Avatar configuration generator
export const generateAvatarConfig = (preferences: {
  gender?: 'male' | 'female';
  ethnicity?: string;
  style?: string;
  age?: string;
}) => {
  // Skin tone based on ethnicity
  const skinTones: Record<string, string> = {
    caucasian: 'light',
    asian: 'pale',
    african: 'dark',
    hispanic: 'medium',
    middleEastern: 'tan'
  };
  
  // Hair colors
  const hairColors = ['#2c3e50', '#8b4513', '#daa520', '#dc143c', '#696969'];
  
  // Clothing colors based on style
  const clothingColors: Record<string, string> = {
    professional: '#2c3e50',
    casual: '#3498db',
    creative: '#9b59b6',
    elegant: '#c0392b',
    athletic: '#27ae60'
  };
  
  return {
    gender: preferences.gender || 'female',
    skinTone: skinTones[preferences.ethnicity || 'caucasian'] || 'medium',
    hairColor: hairColors[Math.floor(Math.random() * hairColors.length)],
    hairStyle: ['short', 'medium', 'long'][Math.floor(Math.random() * 3)] as any,
    clothingColor: clothingColors[preferences.style || 'casual'] || '#3498db'
  };
};
