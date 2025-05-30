import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { RPMConfiguredAvatar } from './RPMConfiguredAvatar';
import { PreloadedAvatar as PreloadedAvatarComponent } from './PreloadedAvatar';
import { PRELOADED_AVATARS, PreloadedAvatar } from '../data/preloadedAvatars';
import { FacialBlendShapes } from '../services/AvatarMirrorSystem';

interface PreloadedRPMSystemProps {
  avatarType: 'male' | 'female' | 'neutral';
  avatarIndex?: number; // Which avatar of that type to use
  blendShapes?: FacialBlendShapes;
  showControls?: boolean;
  onAvatarChange?: (avatar: PreloadedAvatar) => void;
}

export const PreloadedRPMSystem: React.FC<PreloadedRPMSystemProps> = ({
  avatarType,
  avatarIndex = 0,
  blendShapes,
  showControls = false,
  onAvatarChange
}) => {
  const [currentAvatar, setCurrentAvatar] = useState<PreloadedAvatar | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get avatars of the specified type
    const avatarsOfType = PRELOADED_AVATARS.filter(a => a.type === avatarType);
    
    if (avatarsOfType.length > 0) {
      const selectedAvatar = avatarsOfType[avatarIndex % avatarsOfType.length];
      setCurrentAvatar(selectedAvatar);
      onAvatarChange?.(selectedAvatar);
      
      // Check if the avatar file exists
      fetch(selectedAvatar.path, { method: 'HEAD' })
        .then(response => {
          setIsLoading(!response.ok);
        })
        .catch(() => {
          setIsLoading(true);
        });
    }
  }, [avatarType, avatarIndex, onAvatarChange]);

  const fallback = (
    <PreloadedAvatarComponent
      type={avatarType}
      blendShapes={blendShapes}
      position={[0, -0.5, 0]}
      scale={1}
    />
  );

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '300px' }}>
      <Canvas camera={{ position: [0, 1, 3], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <directionalLight position={[-10, -10, -5]} intensity={0.4} />
        
        {currentAvatar && !isLoading ? (
          <RPMConfiguredAvatar
            avatarUrl={currentAvatar.path}
            blendShapes={blendShapes}
            position={[0, -0.5, 0]}
            scale={1}
            fallbackComponent={fallback}
          />
        ) : (
          fallback
        )}
        
        {showControls && <OrbitControls />}
      </Canvas>
    </div>
  );
};

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
          {PRELOADED_AVATARS.map((avatar, i) => (
            <div key={i} style={{ fontSize: '12px', marginBottom: '5px' }}>
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
