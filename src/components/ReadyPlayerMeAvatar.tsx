import React, { useRef, useEffect, useImperativeHandle } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';

export interface ReadyPlayerMeAvatarProps {
  modelUrl: string;
  blendShapes?: Record<string, number>;
  enableHeadMovement?: boolean; // Placeholder for now
  position?: [number, number, number];
  scale?: [number, number, number] | number;
  onModelLoaded?: (model: THREE.Group, animations: THREE.AnimationClip[]) => void;
  currentAnimationName?: string; // To control which animation plays
  isSpeaking?: boolean; // Added for speaking state
  visemeData?: Record<string, number>; // Added for viseme data
  additionalClips?: THREE.AnimationClip[]; // Added for additional animation clips
}

// Extend GLTF type to include nodes and materials if specific access is needed
interface ExtendedGLTF extends GLTF {
  nodes: { [name: string]: THREE.SkinnedMesh | THREE.Mesh | THREE.Object3D };
  materials: { [name: string]: THREE.Material };
}

const ReadyPlayerMeAvatar = React.forwardRef<THREE.Group, ReadyPlayerMeAvatarProps>(
  ({ modelUrl, blendShapes, position, scale, onModelLoaded, currentAnimationName, isSpeaking, visemeData, additionalClips }, ref) => {
    const groupRef = useRef<THREE.Group>(null!); // Initialized by primitive
    // Explicitly cast the result of useGLTF
    const { scene, animations } = useGLTF(modelUrl) as ExtendedGLTF; 
    const { actions, mixer } = useAnimations(animations, groupRef);

    // Expose the group ref to the parent component (e.g., SimulationAvatar3D)
    useImperativeHandle(ref, () => groupRef.current);

    // Notify parent when model is loaded
    useEffect(() => {
      if (scene && groupRef.current && onModelLoaded) {
        onModelLoaded(groupRef.current, animations);
      }
    }, [scene, animations, onModelLoaded]);

    // Apply blendshapes
    useEffect(() => {
      if (groupRef.current && blendShapes) {
        groupRef.current.traverse((object) => {
          if (object instanceof THREE.SkinnedMesh && object.morphTargetDictionary) {
            Object.keys(blendShapes).forEach((key) => {
              const value = blendShapes[key];
              const index = object.morphTargetDictionary![key];
              if (index !== undefined && value !== undefined) {
                object.morphTargetInfluences![index] = THREE.MathUtils.clamp(value, 0, 1);
              }
            });
          }
        });
      }
    }, [blendShapes]); // Dependency: scene is implicit via groupRef.current

    // Animation control
    useEffect(() => {
      if (actions && currentAnimationName) {
        const currentAction = actions[currentAnimationName];
        if (currentAction) {
          // Fade in the new animation and fade out others
          mixer.stopAllAction(); // Stop all other animations
          currentAction.reset().fadeIn(0.3).play();
        } else {
          console.warn(`[ReadyPlayerMeAvatar] Animation "${currentAnimationName}" not found.`);
          // Optionally play a default animation or do nothing
          if (animations.length > 0 && actions[animations[0].name]) {
            actions[animations[0].name]?.reset().fadeIn(0.3).play(); // Play first animation as fallback
          }
        }
      } else if (actions && animations.length > 0 && actions[animations[0].name]) {
        // If no currentAnimationName is provided, play the first animation by default
        actions[animations[0].name]?.reset().fadeIn(0.3).play();
      }

      return () => {
        // Fade out the current animation when component unmounts or animation changes
        if (actions && currentAnimationName) {
          actions[currentAnimationName]?.fadeOut(0.3);
        }
      };
    }, [actions, animations, mixer, currentAnimationName]);

    // Note: useGLTF is suspenseful, so <React.Suspense> must be used by the parent.
    return (
      <primitive
        object={scene}
        ref={groupRef}
        position={position}
        scale={scale}
        dispose={null} // Important: Drei's useGLTF handles disposal by default
      />
    );
  }
);

ReadyPlayerMeAvatar.displayName = 'ReadyPlayerMeAvatar';
export default ReadyPlayerMeAvatar;

// Export the ultra-minimal version too, in case it's needed for other tests, but rename it.
export const ReadyPlayerMeAvatarDebugBox = (props: Omit<ReadyPlayerMeAvatarProps, 'modelUrl'>) => {
  return (
    <mesh position={props.position} scale={props.scale}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="purple" />
    </mesh>
  );
};


