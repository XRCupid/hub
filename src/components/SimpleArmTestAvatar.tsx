import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

interface SimpleArmTestAvatarProps {
  avatarUrl: string;
  position?: [number, number, number];
  scale?: number;
}

export const SimpleArmTestAvatar: React.FC<SimpleArmTestAvatarProps> = ({
  avatarUrl,
  position = [0, 0, 0],
  scale = 1
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(avatarUrl);
  
  // Clone the scene
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  
  // Bone references
  const leftArmBone = useRef<THREE.Bone | null>(null);
  const rightArmBone = useRef<THREE.Bone | null>(null);
  
  // Find bones
  useEffect(() => {
    if (!clonedScene) return;
    
    console.log('[SimpleArmTest] Finding bones...');
    
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Bone) {
        const name = child.name.toLowerCase();
        console.log('[SimpleArmTest] Bone:', child.name);
        
        if ((name.includes('leftarm') || name.includes('arm_l') || name.includes('leftupperarm')) && !name.includes('fore')) {
          leftArmBone.current = child;
          console.log('[SimpleArmTest] Found left arm:', child.name);
        }
        if ((name.includes('rightarm') || name.includes('arm_r') || name.includes('rightupperarm')) && !name.includes('fore')) {
          rightArmBone.current = child;
          console.log('[SimpleArmTest] Found right arm:', child.name);
        }
      }
    });
    
    // Immediately set arms down to test
    if (leftArmBone.current) {
      leftArmBone.current.rotation.z = Math.PI / 4; // 45 degrees down
      console.log('[SimpleArmTest] Set left arm down');
    }
    if (rightArmBone.current) {
      rightArmBone.current.rotation.z = -Math.PI / 4; // 45 degrees down
      console.log('[SimpleArmTest] Set right arm down');
    }
  }, [clonedScene]);
  
  // Animate arms to verify they can move
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (leftArmBone.current) {
      // Wave left arm
      leftArmBone.current.rotation.z = Math.PI / 4 + Math.sin(time * 2) * 0.3;
    }
    
    if (rightArmBone.current) {
      // Wave right arm
      rightArmBone.current.rotation.z = -Math.PI / 4 + Math.sin(time * 2 + Math.PI) * 0.3;
    }
  });
  
  return (
    <group ref={groupRef} position={position} scale={scale}>
      {clonedScene && <primitive object={clonedScene} />}
    </group>
  );
};
