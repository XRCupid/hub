import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { PresenceAvatar } from './PresenceAvatar';
import { LightweightPostProcessing } from './LightweightPostProcessing';
import { RisographPostProcessing } from './RisographPostProcessing';
import * as THREE from 'three';

interface StylizedAvatarSceneProps {
  avatarUrl: string;
  trackingData?: any;
  postProcessingStyle?: 'lightweight' | 'risograph' | 'none';
  quality?: 'low' | 'medium' | 'high';
}

export const StylizedAvatarScene: React.FC<StylizedAvatarSceneProps> = ({
  avatarUrl,
  trackingData,
  postProcessingStyle = 'lightweight',
  quality = 'medium'
}) => {
  const [intensity, setIntensity] = useState(0.5);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 45 }}
        gl={{ 
          antialias: false, // Disable for better performance with post-processing
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2
        }}
        shadows
      >
        {/* Stylized lighting setup */}
        <ambientLight intensity={0.4} color="#FFE4E1" />
        <directionalLight
          position={[5, 5, 5]}
          intensity={0.8}
          color="#FFF0F5"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight
          position={[-3, 3, -3]}
          intensity={0.4}
          color="#E0FFFF"
        />
        
        {/* Rim light for stylized edge */}
        <spotLight
          position={[0, 5, -5]}
          intensity={0.5}
          color="#FFB6C1"
          angle={0.6}
          penumbra={1}
        />

        {/* Avatar */}
        <Suspense fallback={null}>
          <group position={[0, -1, 0]}>
            <PresenceAvatar
              avatarUrl={avatarUrl}
              trackingData={trackingData}
              scale={1.2}
            />
          </group>
        </Suspense>

        {/* Stylized ground shadow */}
        <ContactShadows
          position={[0, -1, 0]}
          opacity={0.3}
          scale={3}
          blur={2}
          far={3}
          color="#8B7D7B"
        />

        {/* Optional environment for reflections */}
        <Environment preset="studio" />

        {/* Camera controls */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={1.5}
          maxDistance={5}
          target={[0, 0, 0]}
        />

        {/* Post-processing effects */}
        {postProcessingStyle === 'lightweight' && (
          <LightweightPostProcessing quality={quality} />
        )}
        {postProcessingStyle === 'risograph' && (
          <RisographPostProcessing intensity={intensity} preset={quality === 'low' ? 'subtle' : quality === 'high' ? 'intense' : 'medium'} />
        )}
      </Canvas>

      {/* UI Controls */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '15px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Post-Processing Style</h4>
        <select
          value={postProcessingStyle}
          onChange={(e) => window.location.reload()} // Simple reload for demo
          style={{ marginBottom: '10px', width: '100%' }}
        >
          <option value="none">None</option>
          <option value="lightweight">Lightweight Effects</option>
          <option value="risograph">Risograph Style</option>
        </select>

        {postProcessingStyle === 'risograph' && (
          <>
            <h4 style={{ margin: '10px 0 5px 0' }}>Intensity</h4>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={intensity}
              onChange={(e) => setIntensity(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </>
        )}
      </div>
    </div>
  );
};
