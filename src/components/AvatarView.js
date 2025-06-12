import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Stage, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { AVATAR_ANIMATIONS } from '../config/animationConfig';

function Model(props) {
  const group = useRef();
  const { scene, animations } = useGLTF('/avatars/AngelChick.glb');
  const { actions, mixer } = useAnimations(animations, group);
  
  // Load and play idle animation
  useEffect(() => {
    const loadIdleAnimation = async () => {
      try {
        // Get feminine idle animations from config
        const idleAnimations = AVATAR_ANIMATIONS.female.idle;
        if (idleAnimations && idleAnimations.length > 0) {
          // Pick a random idle animation
          const randomIdle = idleAnimations[Math.floor(Math.random() * idleAnimations.length)];
          
          // Load the animation
          const loader = new GLTFLoader();
          const animData = await loader.loadAsync(randomIdle);
          
          if (animData.animations && animData.animations.length > 0) {
            // Add animation to mixer
            const clip = animData.animations[0];
            const action = mixer.clipAction(clip);
            action.play();
            
            // Make it loop
            action.setLoop(THREE.LoopRepeat, Infinity);
          }
        }
      } catch (error) {
        console.error('Error loading idle animation:', error);
      }
    };
    
    loadIdleAnimation();
    
    return () => {
      // Cleanup animations
      mixer.stopAllAction();
    };
  }, [mixer]);
  
  useFrame((state, delta) => {
    mixer.update(delta);
  });
  
  return <group ref={group}><primitive object={scene} {...props} /></group>;
}

// Preload the model
useGLTF.preload('/avatars/AngelChick.glb');

export default function AvatarView() {
  return (
    <Canvas dpr={[1, 2]} camera={{ fov: 45, position: [0, 1.5, 4] }} style={{ width: '100%', height: '100vh' }}>
      <color attach="background" args={['#1a1a1a']} />
      <ambientLight intensity={0.5} />
      <directionalLight intensity={1} position={[5, 5, 5]} />
      <Suspense fallback={null}>
        <Stage environment="city" intensity={0.6}>
          <Model scale={1.5} position={[0, -1, 0]} />
        </Stage>
      </Suspense>
      <OrbitControls 
        enablePan={false}
        minDistance={2}
        maxDistance={6}
        target={[0, 0.5, 0]}
      />
    </Canvas>
  );
}
