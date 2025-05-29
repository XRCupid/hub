import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Extend the Mesh type to include morph targets
type MorphMesh = THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]> & {
  morphTargetDictionary?: { [key: string]: number };
  morphTargetInfluences?: number[];
};

interface SimpleAvatar3DProps {
  avatarUrl: string;
  blendShapes?: Record<string, number>;
  position?: [number, number, number];
  scale?: [number, number, number];
}

const SimpleAvatar3D = React.forwardRef<THREE.Group, SimpleAvatar3DProps>(
  ({ 
    avatarUrl, 
    blendShapes = {}, 
    position = [0, 0, 0], 
    scale = [1, 1, 1] 
  }, ref) => {
    const groupRef = useRef<THREE.Group>(null);
    const morphMeshRef = useRef<MorphMesh | null>(null);
    
    // Load the GLB model
    const { scene } = useGLTF(avatarUrl) as unknown as { scene: THREE.Group };
    
    // Set up the scene when the model loads
    useEffect(() => {
      if (!scene) return;
      
      // Find the mesh with morph targets
      scene.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh && 'morphTargetDictionary' in mesh) {
          morphMeshRef.current = mesh as MorphMesh;
          console.log('Available blendshapes:', 
            Object.keys(morphMeshRef.current.morphTargetDictionary || {}));
        }
      });
    }, [scene]);
    
    // Apply blendshapes every frame
    useFrame(() => {
      if (!morphMeshRef.current || !blendShapes) return;
      
      const mesh = morphMeshRef.current;
      const dict = mesh.morphTargetDictionary;
      const influences = mesh.morphTargetInfluences;
      
      if (!dict || !influences) return;
      
      // Apply each blendshape value to the corresponding morph target
      Object.entries(blendShapes).forEach(([name, value]) => {
        const idx = dict[name];
        if (idx !== undefined && idx < influences.length) {
          influences[idx] = value;
        }
      });
    });
    
    return (
      <group ref={groupRef} position={position} scale={scale}>
        <primitive object={scene} ref={ref} />
      </group>
    );
  }
);

export default SimpleAvatar3D;
