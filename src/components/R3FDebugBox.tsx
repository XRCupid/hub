import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

console.log('R3FDebugBox is rendering');
export default function R3FDebugBox() {
  // Create geometry and material once
  const mesh = useMemo(() => {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ color: 'hotpink' });
    return new THREE.Mesh(geometry, material);
  }, []);

  return (
    <Canvas camera={{ position: [0, 0, 5] }} style={{ width: '100vw', height: '100vh', background: '#222' }}>
      {/* @ts-ignore */}
      <ambientLight intensity={1} />
      {/* @ts-ignore */}
      <directionalLight position={[10, 10, 10]} />
      {/* @ts-ignore */}
      <primitive object={mesh} />
    </Canvas>
  );
}
