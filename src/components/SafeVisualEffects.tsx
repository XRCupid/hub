import React from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface SafeVisualEffectsProps {
  enabled?: boolean;
  style?: 'subtle' | 'medium' | 'dramatic';
}

export const SafeVisualEffects: React.FC<SafeVisualEffectsProps> = ({ 
  enabled = true, 
  style = 'medium' 
}) => {
  const { scene } = useThree();
  
  // Apply fog for depth
  React.useEffect(() => {
    if (!enabled) {
      scene.fog = null;
      return;
    }
    
    switch (style) {
      case 'subtle':
        scene.fog = new THREE.Fog(0x000000, 10, 30);
        break;
      case 'dramatic':
        scene.fog = new THREE.Fog(0x000000, 5, 20);
        break;
      default: // medium
        scene.fog = new THREE.Fog(0x000000, 8, 25);
    }
    
    return () => {
      scene.fog = null;
    };
  }, [enabled, style, scene]);
  
  if (!enabled) return null;
  
  return (
    <>
      {/* Add rim lighting to enhance avatar edges */}
      <directionalLight
        position={[-5, 5, -5]}
        intensity={style === 'dramatic' ? 0.8 : style === 'medium' ? 0.5 : 0.3}
        color={new THREE.Color(0.5, 0.7, 1)}
      />
      
      {/* Add subtle fill light */}
      <hemisphereLight
        intensity={style === 'dramatic' ? 0.6 : style === 'medium' ? 0.4 : 0.2}
        color={new THREE.Color(1, 0.9, 0.8)}
        groundColor={new THREE.Color(0.2, 0.3, 0.4)}
      />
      
      {/* Add point lights for highlights */}
      {style !== 'subtle' && (
        <>
          <pointLight
            position={[3, 3, 3]}
            intensity={0.3}
            color={new THREE.Color(1, 0.8, 0.6)}
            distance={10}
            decay={2}
          />
          <pointLight
            position={[-3, 3, -3]}
            intensity={0.3}
            color={new THREE.Color(0.6, 0.8, 1)}
            distance={10}
            decay={2}
          />
        </>
      )}
    </>
  );
};
