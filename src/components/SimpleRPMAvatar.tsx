import React, { useRef, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SimpleRPMAvatarProps {
  avatarUrl: string;
  position?: [number, number, number];
  scale?: number;
  isSpeaking?: boolean;
}

const SimpleRPMAvatar: React.FC<SimpleRPMAvatarProps> = ({
  avatarUrl,
  position = [0, 0, 0],
  scale = 1,
  isSpeaking = false
}) => {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(avatarUrl);
  const { actions, mixer } = useAnimations(animations, group);
  
  // Clone scene
  const clonedScene = React.useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh) {
        child.frustumCulled = false;
      }
    });
    return clone;
  }, [scene]);
  
  // Log what we have
  useEffect(() => {
    console.log('=== SIMPLE RPM AVATAR DEBUG ===');
    console.log('Avatar URL:', avatarUrl);
    console.log('Embedded animations count:', animations.length);
    console.log('Animation names:', animations.map(a => a.name));
    console.log('Actions available:', Object.keys(actions));
  }, [avatarUrl, animations, actions]);
  
  // Play first animation if available
  useEffect(() => {
    if (Object.keys(actions).length > 0) {
      const firstActionKey = Object.keys(actions)[0];
      const firstAction = actions[firstActionKey];
      
      if (firstAction) {
        console.log('Playing animation:', firstActionKey);
        firstAction.reset();
        firstAction.play();
      }
    } else {
      console.warn('No animations found in avatar file');
    }
  }, [actions]);
  
  // Update mixer
  useFrame((state, delta) => {
    if (mixer) {
      mixer.update(delta);
    }
  });
  
  return (
    <group ref={group} position={position} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
};

export default SimpleRPMAvatar;
