import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';

// Change this to your avatar URL if needed
// Use your exported ARKit blendshape model by default
const AVATAR_URL = '/models/face-arkit.glb';

export default function GLBBlendshapeDebugger({ url = AVATAR_URL }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    if (!scene) return;
    console.group('[GLBBlendshapeDebugger] Blendshape Inspection');
    scene.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary) {
        console.log('[GLBBlendshapeDebugger] Mesh:', child.name);
        console.log('[GLBBlendshapeDebugger] Morph Target Names:', Object.keys(child.morphTargetDictionary));
      }
    });
    console.groupEnd();
  }, [scene]);

  return (
    <div style={{ display: 'none' }} /> // No visible UI, just logs
  );
}

// To use: import and render <GLBBlendshapeDebugger /> somewhere in your app temporarily.
