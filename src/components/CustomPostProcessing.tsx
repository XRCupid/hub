import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CustomPostProcessingProps {
  enabled?: boolean;
  intensity?: number;
}

// Simple bloom-like effect using built-in Three.js
export const CustomPostProcessing: React.FC<CustomPostProcessingProps> = ({ 
  enabled = true, 
  intensity = 0.5 
}) => {
  const { gl, scene, camera } = useThree();
  const renderTarget = useRef<THREE.WebGLRenderTarget>();
  
  // Create a simple glow effect using built-in Three.js
  const glowMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(1, 0.8, 0.6),
      transparent: true,
      opacity: intensity * 0.3,
      blending: THREE.AdditiveBlending
    });
  }, [intensity]);

  useFrame(() => {
    if (!enabled) return;
    
    // Simple post-processing effect: render scene with glow
    const originalBackground = scene.background;
    scene.background = new THREE.Color(0x000000);
    
    // Store original materials
    const originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        originalMaterials.set(child, child.material);
        child.material = glowMaterial;
      }
    });
    
    // Render glow pass
    gl.render(scene, camera);
    
    // Restore original materials
    originalMaterials.forEach((material, mesh) => {
      mesh.material = material;
    });
    
    scene.background = originalBackground;
  }, 1); // Priority 1 to run after regular render

  if (!enabled) return null;
  
  return null;
};
