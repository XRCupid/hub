import React from 'react';
import { Canvas } from '@react-three/fiber';

const PostProcessingTest: React.FC = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <h1>Basic Canvas Test</h1>
      <div style={{ width: '100%', height: '400px', border: '1px solid #ccc' }}>
        <Canvas>
          <ambientLight />
          <mesh>
            <boxGeometry />
            <meshStandardMaterial color="orange" />
          </mesh>
        </Canvas>
      </div>
    </div>
  );
};

export default PostProcessingTest;
