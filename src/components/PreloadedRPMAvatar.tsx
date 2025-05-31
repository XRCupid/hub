import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { PreloadedAvatar, PRELOADED_AVATARS } from '../data/preloadedAvatars';
import { RPMComprehensiveAvatar } from './RPMComprehensiveAvatar';
import type { BlendShapeMap } from '../types/blendshapes';

interface PreloadedRPMSystemProps {
  avatarType?: 'male' | 'female' | 'neutral';
  avatarIndex?: number;
  blendShapes?: Partial<BlendShapeMap>;
  showControls?: boolean;
  position?: [number, number, number];
  scale?: number;
}

export function PreloadedRPMSystem({ 
  avatarType = 'male',
  avatarIndex = 0,
  blendShapes = {},
  showControls = true,
  position = [0, -1.2, 0],
  scale = 1
}: PreloadedRPMSystemProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<PreloadedAvatar | null>(null);

  useEffect(() => {
    const avatarsOfType = PRELOADED_AVATARS.filter((a: PreloadedAvatar) => a.type === avatarType);
    if (avatarsOfType.length > avatarIndex) {
      setSelectedAvatar(avatarsOfType[avatarIndex]);
    } else if (avatarsOfType.length > 0) {
      setSelectedAvatar(avatarsOfType[0]);
    }
  }, [avatarType, avatarIndex]);

  if (!selectedAvatar) {
    return <div>No avatar available</div>;
  }

  // Split blendShapes into emotion and viseme shapes
  const visemeShapes: Partial<BlendShapeMap> = {};
  const emotionShapes: Partial<BlendShapeMap> = {};
  
  const VISEME_KEYS = [
    'jawOpen', 'jawForward', 'jawLeft', 'jawRight',
    'mouthClose', 'mouthFunnel', 'mouthPucker', 'mouthLeft', 'mouthRight',
    'mouthSmileLeft', 'mouthSmileRight', 'mouthFrownLeft', 'mouthFrownRight',
    'mouthDimpleLeft', 'mouthDimpleRight', 'mouthStretchLeft', 'mouthStretchRight',
    'mouthRollLower', 'mouthRollUpper', 'mouthShrugLower', 'mouthShrugUpper',
    'mouthPressLeft', 'mouthPressRight', 'mouthLowerDownLeft', 'mouthLowerDownRight',
    'mouthUpperUpLeft', 'mouthUpperUpRight'
  ];

  Object.entries(blendShapes).forEach(([key, value]) => {
    if (VISEME_KEYS.includes(key)) {
      visemeShapes[key as keyof BlendShapeMap] = value;
    } else {
      emotionShapes[key as keyof BlendShapeMap] = value;
    }
  });

  return (
    <Canvas camera={{ position: [0, 0, 2], fov: 50 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      <RPMComprehensiveAvatar
        avatarId={selectedAvatar.id}
        emotionShapes={emotionShapes}
        visemeShapes={visemeShapes}
        position={position}
        scale={scale}
      />
      {showControls && <OrbitControls />}
    </Canvas>
  );
}

// Standalone component for easy testing
export const PreloadedRPMAvatarViewer: React.FC = () => {
  const [typeIndex, setTypeIndex] = useState(0);
  const [avatarIndex, setAvatarIndex] = useState(0);
  const types: ('male' | 'female' | 'neutral')[] = ['male', 'female', 'neutral'];
  const currentType = types[typeIndex];

  const cycleType = () => {
    setTypeIndex((prev) => (prev + 1) % types.length);
    setAvatarIndex(0);
  };

  const cycleAvatar = () => {
    setAvatarIndex((prev) => prev + 1);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f0f0f0' }}>
      <div style={{ width: '300px', padding: '20px', backgroundColor: '#fff' }}>
        <h2>Preloaded RPM Avatars</h2>
        
        <button 
          onClick={cycleType}
          style={{
            padding: '10px 20px',
            margin: '10px 0',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'block',
            width: '100%'
          }}
        >
          Type: {currentType}
        </button>

        <button 
          onClick={cycleAvatar}
          style={{
            padding: '10px 20px',
            margin: '10px 0',
            backgroundColor: '#2ecc71',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'block',
            width: '100%'
          }}
        >
          Next Avatar
        </button>

        <div style={{ marginTop: '20px' }}>
          <h3>Available Avatars:</h3>
          {PRELOADED_AVATARS.map((avatar: PreloadedAvatar, i: number) => (
            <div key={avatar.id} style={{ fontSize: '12px', marginBottom: '20px' }}>
              {avatar.name} ({avatar.type})
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ flex: 1, padding: '20px' }}>
        <PreloadedRPMSystem
          avatarType={currentType}
          avatarIndex={avatarIndex}
          showControls={true}
        />
      </div>
    </div>
  );
};
