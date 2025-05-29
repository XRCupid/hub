import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import styled from 'styled-components';

// 3D Model Component
const Model = () => {
  const { scene } = useGLTF('/bro.glb');
  return <primitive object={scene} scale={2} position={[0, -1, 0]} />;
};

// Canvas Wrapper
const CanvasContainer = styled.div`
  width: 100%;
  height: 100%;
  background: #f0f0f0;
`;

// Loading fallback
const Loader = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #666;
  font-size: 16px;
  font-family: Arial, sans-serif;
`;

const AvatarViewer = () => {
  return (
    <CanvasContainer>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <Suspense fallback={null}>
          <Model />
        </Suspense>
        <OrbitControls enableZoom={true} enablePan={true} />
      </Canvas>
    </CanvasContainer>
  );
};

export default AvatarViewer;
