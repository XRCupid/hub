import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import SimpleAvatar3D from '../components/SimpleAvatar3D';

const TestHumeEVI = () => {
  const [blendShapes, setBlendShapes] = useState<Record<string, number>>({
    mouthClose: 0.8,
  });

  // Test animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBlendShapes({
        mouthClose: Math.random() * 0.5,
        mouthSmileLeft: Math.random() * 0.5,
        mouthSmileRight: Math.random() * 0.5,
        jawOpen: Math.random() * 0.5
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 1.6, 2], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />
        <SimpleAvatar3D 
          avatarUrl="https://models.readyplayer.me/681d6cd903879b2f11528470.glb"
          blendShapes={blendShapes}
          position={[0, -1.6, 0]}
        />
      </Canvas>
    </div>
  );
};

export default TestHumeEVI;
