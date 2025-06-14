import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { PresenceAvatarWithGender } from './PresenceAvatarWithGender';
import type { TrackingData } from '../types/tracking';

interface PresenceAvatarWithCanvasProps {
  avatarUrl?: string;
  animationName?: string;
  emotionalBlendshapes?: Record<string, number>;
  audioData?: Uint8Array;
  position?: [number, number, number];
  scale?: number;
  trackingData?: TrackingData;
  participantId?: string;
  gender?: 'male' | 'female';
}

const PresenceAvatarWithCanvas: React.FC<PresenceAvatarWithCanvasProps> = (props) => {
  return (
    <Canvas
      camera={{
        position: [0, 1.6, 3],
        fov: 50,
        near: 0.1,
        far: 100
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, 10, -5]} intensity={0.5} />
      
      <Suspense fallback={null}>
        <PresenceAvatarWithGender {...props} />
      </Suspense>
      
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
};

export default PresenceAvatarWithCanvas;
