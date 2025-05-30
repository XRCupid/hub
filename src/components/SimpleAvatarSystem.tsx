import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { PreloadedAvatar } from './PreloadedAvatar';
import { FacialBlendShapes } from '../services/AvatarMirrorSystem';

interface SimpleAvatarSystemProps {
  avatarType: 'male' | 'female' | 'neutral';
  blendShapes?: FacialBlendShapes;
  showControls?: boolean;
}

export const SimpleAvatarSystem: React.FC<SimpleAvatarSystemProps> = ({
  avatarType,
  blendShapes,
  showControls = false
}) => {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '300px' }}>
      <Canvas camera={{ position: [0, 1, 3], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <directionalLight position={[-10, -10, -5]} intensity={0.4} />
        
        <PreloadedAvatar
          type={avatarType}
          blendShapes={blendShapes}
          position={[0, -0.5, 0]}
          scale={1}
        />
        
        {showControls && <OrbitControls />}
      </Canvas>
    </div>
  );
};
