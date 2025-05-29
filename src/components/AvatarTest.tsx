import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function TestCube() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
}

export function AvatarTest() {
  return (
    <div style={{ width: '400px', height: '400px', border: '2px solid red', background: '#f0f0f0' }}>
      <h3>Canvas Test</h3>
      <div style={{ width: '100%', height: '300px' }}>
        <Canvas camera={{ position: [0, 0, 3] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[2, 2, 2]} intensity={1} />
          <TestCube />
          <OrbitControls />
        </Canvas>
      </div>
    </div>
  );
}
