import React from 'react';
import { useGLTF } from '@react-three/drei';

// Preload the avatar
useGLTF.preload('/avatars/coach_grace.glb');

interface SimpleTestAvatarProps {
  url: string;
}

export const SimpleTestAvatar: React.FC<SimpleTestAvatarProps> = ({ url }) => {
  console.log('[SimpleTestAvatar] Rendering with URL:', url);
  
  const { scene } = useGLTF(url);
  console.log('[SimpleTestAvatar] Scene loaded:', scene);
  
  return <primitive object={scene} scale={1} position={[0, 0, 0]} />;
};
