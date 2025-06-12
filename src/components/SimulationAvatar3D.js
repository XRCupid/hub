import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useGLTF } from '@react-three/drei';

// This component is ONLY for use inside <Canvas>!
const SimulationAvatar3D = React.forwardRef(({ avatarUrl, blendShapes, onModelLoaded, onLoaded, ...props }, ref) => {
  const { scene, nodes } = useGLTF(avatarUrl);
  const avatarRef = useRef();
  const morphMeshRef = useRef();

  // Set up morph targets on load
  React.useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh && child.morphTargetDictionary) {
          morphMeshRef.current = child;
        }
      });
      
      if (onModelLoaded) {
        onModelLoaded({ scene });
      }
      if (onLoaded) {
        onLoaded();
      }
    }
  }, [scene, onModelLoaded, onLoaded]);

  // Apply blendshapes every frame
  useFrame(() => {
    // Lock rotation to prevent any spinning
    if (ref && ref.current) {
      ref.current.rotation.y = 0;
      ref.current.rotation.x = 0;
      ref.current.rotation.z = 0;
    }
    
    if (!morphMeshRef.current) return;
    const dict = morphMeshRef.current.morphTargetDictionary;
    const influences = morphMeshRef.current.morphTargetInfluences;
    if (dict && influences && blendShapes) {
      Object.entries(blendShapes).forEach(([name, value]) => {
        const idx = dict[name];
        if (idx !== undefined) {
          influences[idx] = value || 0;
        }
      });
    }
  });

  return (
    <group ref={ref} {...props}>
      <primitive object={scene} />
    </group>
  );
});

export default SimulationAvatar3D;
