import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface ModelInspectorProps {
  avatarUrl: string;
}

export const ModelInspector: React.FC<ModelInspectorProps> = ({ avatarUrl }) => {
  const { scene } = useGLTF(avatarUrl);
  
  useEffect(() => {
    console.log('=== MODEL INSPECTOR ===');
    console.log('Model URL:', avatarUrl);
    
    let meshCount = 0;
    let morphTargetCount = 0;
    const meshDetails: any[] = [];
    
    scene.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh) {
        meshCount++;
        const mesh = child as THREE.SkinnedMesh;
        const details = {
          name: mesh.name,
          hasMorphTargetDictionary: !!mesh.morphTargetDictionary,
          morphTargetCount: mesh.morphTargetDictionary ? Object.keys(mesh.morphTargetDictionary).length : 0,
          morphTargets: mesh.morphTargetDictionary ? Object.keys(mesh.morphTargetDictionary) : [],
          morphTargetInfluencesLength: mesh.morphTargetInfluences?.length || 0,
          geometry: {
            hasMorphAttributes: !!mesh.geometry.morphAttributes,
            morphAttributesPosition: !!mesh.geometry.morphAttributes?.position,
            morphPositionCount: mesh.geometry.morphAttributes?.position?.length || 0
          }
        };
        meshDetails.push(details);
        
        if (details.morphTargetCount > 0) {
          morphTargetCount += details.morphTargetCount;
        }
      }
    });
    
    console.log('Total SkinnedMeshes found:', meshCount);
    console.log('Total morph targets found:', morphTargetCount);
    console.log('Mesh details:', meshDetails);
    console.log('=== END MODEL INSPECTOR ===');
  }, [scene, avatarUrl]);
  
  return null;
};
