import React, { useEffect, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

interface AnimatedSimulationAvatarProps {
  avatarUrl: string;
  animationUrl: string;
  blendShapes?: Record<string, number>;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

/**
 * Combines skeletal animation (body movement) and blendshape animation (facial, lipsync, emotion).
 */
const AnimatedSimulationAvatar: React.FC<AnimatedSimulationAvatarProps> = ({
  avatarUrl,
  animationUrl,
  blendShapes = {},
  position = [0, -1.1, 0],
  rotation = [0, 0, 0],
  scale = [1.4, 1.4, 1.4],
}) => {
  // Load avatar and animation
  const { scene: avatar } = useGLTF(avatarUrl);
  const { animations: animClips } = useGLTF(animationUrl);
  const { actions } = useAnimations(animClips, avatar);
  const avatarRef = useRef<any>(null);

  // Play the first animation
  useEffect(() => {
    if (actions && animClips.length > 0) {
      actions[animClips[0].name]?.reset().fadeIn(0.2).play();
    }
    return () => {
      Object.values(actions).forEach((action) => action?.stop());
    };
  }, [actions, animClips]);

  // Re-apply blendshapes every frame (after animation)
  useFrame(() => {
    if (!avatar) return;
    avatar.traverse((child: any) => {
      if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        const dict = child.morphTargetDictionary;
        const influences = child.morphTargetInfluences;
        Object.entries(blendShapes).forEach(([name, value]) => {
          const idx = dict[name];
          if (idx !== undefined) {
            influences[idx] = value;
          }
        });
      }
    });
  });

  if (!avatar) return null;
  return (
    // @ts-ignore
    <primitive ref={avatarRef} object={avatar} position={position} rotation={rotation} scale={scale} />
  );
};

export default AnimatedSimulationAvatar;
