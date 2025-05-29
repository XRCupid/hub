import React, { useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import '@react-three/fiber';

interface AnimatedAvatarProps {
  avatarUrl: string; // e.g. '/bro.glb'
  animationUrl: string; // e.g. '/animations/M_Standing_Idle_001.glb' or '/animations/M_Talking_Variations_001.glb'
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export function AnimatedAvatar({
  avatarUrl,
  animationUrl,
  position = [0, -1.1, 0],
  rotation = [0, 0, 0],
  scale = [1.4, 1.4, 1.4],
}: AnimatedAvatarProps) {
  const { scene: avatar } = useGLTF(avatarUrl);
  const { animations: animClips } = useGLTF(animationUrl);
  const { actions } = useAnimations(animClips, avatar);

  useEffect(() => {
    if (actions && animClips.length > 0) {
      actions[animClips[0].name]?.reset().fadeIn(0.2).play();
    }
    return () => {
      Object.values(actions).forEach((action) => action?.stop());
    };
  }, [actions, animClips]);

  if (!avatar) {
    return null;
  }
  return (
    // @ts-ignore
    <primitive object={avatar} scale={scale} position={position} rotation={rotation} />
  );
}
