import React, { useEffect, Suspense } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import '@react-three/fiber';
import { ErrorBoundary } from 'react-error-boundary';

interface AnimatedAvatarProps {
  avatarUrl: string; // e.g. '/bro.glb'
  animationUrl: string; // e.g. '/animations/M_Standing_Idle_001.glb' or '/animations/M_Talking_Variations_001.glb'
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

// Preload common avatars and animations
useGLTF.preload('/avatars/fool.glb');
useGLTF.preload('/avatars/chickie.glb');
useGLTF.preload('/avatars/babe.glb');
useGLTF.preload('/avatars/AngelChick.glb');
useGLTF.preload('/animations/M_Standing_Idle_001.glb');
useGLTF.preload('/animations/M_Talking_Variations_001.glb');

function AvatarFallback({ error }: { error: Error }) {
  console.error('Avatar loading error:', error);
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[1, 2, 0.5]} />
      <meshStandardMaterial color="gray" />
    </mesh>
  );
}

function AnimatedAvatarInner({
  avatarUrl,
  animationUrl,
  position = [0, -1.1, 0],
  rotation = [0, 0, 0],
  scale = [1.4, 1.4, 1.4],
}: AnimatedAvatarProps) {
  console.log('Loading avatar:', avatarUrl, 'with animation:', animationUrl);
  
  const { scene: avatar } = useGLTF(avatarUrl);
  const { animations: animClips } = useGLTF(animationUrl);
  const { actions } = useAnimations(animClips, avatar);

  useEffect(() => {
    if (actions && animClips.length > 0) {
      console.log('Playing animation:', animClips[0].name);
      actions[animClips[0].name]?.reset().fadeIn(0.2).play();
    } else {
      console.log('No animations found or actions not ready');
    }
    return () => {
      Object.values(actions).forEach((action) => action?.stop());
    };
  }, [actions, animClips]);

  if (!avatar) {
    console.error('Avatar not loaded:', avatarUrl);
    return null;
  }
  
  return (
    // @ts-ignore
    <primitive object={avatar} scale={scale} position={position} rotation={rotation} />
  );
}

export function AnimatedAvatar(props: AnimatedAvatarProps) {
  return (
    <ErrorBoundary fallbackRender={({ error }) => <AvatarFallback error={error} />}>
      <Suspense fallback={
        <mesh position={props.position}>
          <boxGeometry args={[1, 2, 0.5]} />
          <meshStandardMaterial color="lightgray" />
        </mesh>
      }>
        <AnimatedAvatarInner {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
