import React, { useMemo } from 'react';
import { extend, useThree } from '@react-three/fiber';
import { EffectComposer } from '@react-three/postprocessing';
import { Bloom, ChromaticAberration, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// Extend Three.js objects for React Three Fiber
extend({ EffectComposer });

interface WorkingPostProcessingProps {
  enabled?: boolean;
  quality?: 'low' | 'medium' | 'high';
}

export const WorkingPostProcessing: React.FC<WorkingPostProcessingProps> = ({ 
  enabled = true, 
  quality = 'medium' 
}) => {
  const { gl, scene, camera } = useThree();
  
  const settings = useMemo(() => {
    switch (quality) {
      case 'low':
        return {
          bloom: { intensity: 0.3, luminanceThreshold: 0.9, luminanceSmoothing: 0.025 },
          chromatic: { offset: new THREE.Vector2(0.001, 0.001) },
          vignette: { darkness: 0.3, offset: 0.3 },
          noise: { opacity: 0.02 }
        };
      case 'high':
        return {
          bloom: { intensity: 0.8, luminanceThreshold: 0.7, luminanceSmoothing: 0.1 },
          chromatic: { offset: new THREE.Vector2(0.003, 0.003) },
          vignette: { darkness: 0.6, offset: 0.5 },
          noise: { opacity: 0.05 }
        };
      default: // medium
        return {
          bloom: { intensity: 0.5, luminanceThreshold: 0.8, luminanceSmoothing: 0.05 },
          chromatic: { offset: new THREE.Vector2(0.002, 0.002) },
          vignette: { darkness: 0.4, offset: 0.4 },
          noise: { opacity: 0.03 }
        };
    }
  }, [quality]);

  if (!enabled) return null;

  return (
    <EffectComposer>
      <Bloom 
        intensity={settings.bloom.intensity}
        luminanceThreshold={settings.bloom.luminanceThreshold}
        luminanceSmoothing={settings.bloom.luminanceSmoothing}
        blendFunction={BlendFunction.ADD}
      />
      <ChromaticAberration 
        offset={settings.chromatic.offset}
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette 
        darkness={settings.vignette.darkness}
        offset={settings.vignette.offset}
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise 
        opacity={settings.noise.opacity}
        blendFunction={BlendFunction.OVERLAY}
      />
    </EffectComposer>
  );
};
