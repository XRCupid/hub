import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

function AnimatedAvatar() {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/avatars/AngelChick.glb');
  const { animations } = useGLTF('/animations/feminine/idle/F_Standing_Idle_001.glb');
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  
  useEffect(() => {
    if (scene && animations && animations.length > 0) {
      console.log('Avatar loaded, animations available:', animations.length);
      
      // Create mixer with the scene
      const mixer = new THREE.AnimationMixer(scene);
      mixerRef.current = mixer;
      
      // Play the first animation
      const action = mixer.clipAction(animations[0]);
      action.play();
      console.log('Animation started');
    }
  }, [scene, animations]);
  
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });
  
  return <primitive object={scene} scale={100} position={[0, -100, 0]} />;
}

export default function SimpleAvatarAnimationTest() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 100, 300], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <AnimatedAvatar />
        <OrbitControls />
        <gridHelper args={[500, 50]} />
      </Canvas>
    </div>
  );
}

// Preload models
useGLTF.preload('/avatars/AngelChick.glb');
useGLTF.preload('/animations/feminine/idle/F_Standing_Idle_001.glb');
