import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

function AvatarAnalysis() {
  const { scene, animations } = useGLTF('/avatars/AngelChick.glb');
  
  useEffect(() => {
    console.log('=== AVATAR ANALYSIS ===');
    console.log('Scene:', scene);
    console.log('Animations:', animations);
    console.log('Number of animations:', animations.length);
    
    // Traverse and analyze the scene
    let meshCount = 0;
    let skinnedMeshCount = 0;
    let morphTargetCount = 0;
    
    scene.traverse((child: any) => {
      if (child.isMesh) {
        meshCount++;
        console.log(`\nMesh ${meshCount}: ${child.name}`);
        console.log('- Type:', child.type);
        console.log('- Material:', child.material?.name || 'unnamed');
      }
      
      if (child.isSkinnedMesh) {
        skinnedMeshCount++;
        console.log(`\n=== SKINNED MESH ${skinnedMeshCount}: ${child.name} ===`);
        console.log('- Has skeleton:', !!child.skeleton);
        console.log('- Has geometry:', !!child.geometry);
        
        if (child.geometry) {
          console.log('- Geometry type:', child.geometry.type);
          console.log('- Has morph attributes:', !!child.geometry.morphAttributes);
          
          if (child.geometry.morphAttributes) {
            const morphAttrs = child.geometry.morphAttributes;
            console.log('- Morph attribute keys:', Object.keys(morphAttrs));
            
            // Check for position morphs (most common)
            if (morphAttrs.position) {
              console.log('- Position morph count:', morphAttrs.position.length);
            }
          }
        }
        
        console.log('- Has morphTargetDictionary:', !!child.morphTargetDictionary);
        console.log('- Has morphTargetInfluences:', !!child.morphTargetInfluences);
        
        if (child.morphTargetDictionary) {
          morphTargetCount++;
          const targets = Object.keys(child.morphTargetDictionary);
          console.log('- Morph targets:', targets);
          console.log('- Morph target count:', targets.length);
          
          // Check if it's a standard RPM avatar with expected morph targets
          const hasJawOpen = targets.some(t => t.toLowerCase().includes('jaw') || t.toLowerCase().includes('mouth'));
          console.log('- Has jaw/mouth morphs:', hasJawOpen);
        }
      }
    });
    
    console.log('\n=== SUMMARY ===');
    console.log('Total meshes:', meshCount);
    console.log('Skinned meshes:', skinnedMeshCount);
    console.log('Meshes with morph targets:', morphTargetCount);
  }, [scene, animations]);
  
  return <primitive object={scene} />;
}

const AvatarInspector: React.FC = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#1a1a1a' }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '20px',
        borderRadius: '8px',
        color: 'white',
        maxWidth: '400px'
      }}>
        <h2>Avatar Inspector</h2>
        <p style={{ fontSize: '14px', opacity: 0.8 }}>
          Check the browser console for detailed avatar analysis.
        </p>
        <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '10px' }}>
          This tool analyzes the avatar file to determine if it has morph targets
          for facial animations.
        </p>
      </div>
      
      <Canvas 
        camera={{ 
          position: [0, 1.6, 3],
          fov: 45
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        
        <AvatarAnalysis />
        
        <OrbitControls 
          target={[0, 1.5, 0]}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />
        
        <gridHelper args={[10, 10]} />
      </Canvas>
    </div>
  );
};

// Preload avatar
useGLTF.preload('/avatars/AngelChick.glb');

export default AvatarInspector;
