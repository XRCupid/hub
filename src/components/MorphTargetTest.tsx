import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface MorphTargetAvatarProps {
  onMorphTargetsFound: (targets: string[]) => void;
  morphValues: Record<string, number>;
}

function MorphTargetAvatar({ onMorphTargetsFound, morphValues }: MorphTargetAvatarProps) {
  const { scene } = useGLTF('/avatars/AngelChick.glb');
  const meshRef = useRef<THREE.SkinnedMesh | null>(null);
  const [hasReported, setHasReported] = useState(false);

  useEffect(() => {
    if (hasReported) return;

    // Find the skinned mesh with morph targets
    let foundMesh = false;
    scene.traverse((child: any) => {
      if (child.isSkinnedMesh) {
        console.log('=== Found SkinnedMesh ===');
        console.log('Mesh name:', child.name);
        console.log('Has morphTargetDictionary:', !!child.morphTargetDictionary);
        console.log('Has morphTargetInfluences:', !!child.morphTargetInfluences);

        if (child.morphTargetDictionary && child.morphTargetInfluences) {
          meshRef.current = child;
          foundMesh = true;

          console.log('Morph targets available:', Object.keys(child.morphTargetDictionary));
          console.log('Number of morph targets:', Object.keys(child.morphTargetDictionary).length);
          console.log('Morph target influences length:', child.morphTargetInfluences.length);

          // Notify parent of available morph targets
          onMorphTargetsFound(Object.keys(child.morphTargetDictionary));
          setHasReported(true);
        } else {
          console.log('This mesh has no morph targets');
        }
      }
    });

    if (!foundMesh) {
      console.warn('No skinned mesh with morph targets found in the avatar!');
      console.log('All objects in scene:');
      scene.traverse((child: any) => {
        console.log(`- ${child.type}: ${child.name}`);
      });
    }
  }, [scene, onMorphTargetsFound, hasReported]);

  // Update morph target values every frame
  useFrame(() => {
    if (!meshRef.current || !meshRef.current.morphTargetDictionary || !meshRef.current.morphTargetInfluences) return;

    // Apply morph target values
    Object.entries(morphValues).forEach(([name, value]) => {
      const index = meshRef.current!.morphTargetDictionary![name];
      if (index !== undefined && meshRef.current!.morphTargetInfluences) {
        meshRef.current!.morphTargetInfluences[index] = value;
      }
    });
  });

  return <primitive object={scene} />;
}

const MorphTargetTest: React.FC = () => {
  const [availableTargets, setAvailableTargets] = useState<string[]>([]);
  const [morphValues, setMorphValues] = useState<Record<string, number>>({});

  const handleMorphTargetsFound = (targets: string[]) => {
    console.log('Parent received morph targets:', targets);
    setAvailableTargets(targets);

    // Initialize all morph targets to 0
    const initialValues: Record<string, number> = {};
    targets.forEach(target => {
      initialValues[target] = 0;
    });
    setMorphValues(initialValues);
  };

  const handleSliderChange = (name: string, value: number) => {
    console.log(`Changing ${name} to ${value}`);
    setMorphValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#1a1a1a', display: 'flex' }}>
      {/* Control Panel */}
      <div style={{
        width: '350px',
        backgroundColor: '#222',
        padding: '20px',
        overflowY: 'auto',
        color: 'white'
      }}>
        <h2>Morph Target Controls</h2>
        <p style={{ fontSize: '12px', opacity: 0.7, marginBottom: '20px' }}>
          {availableTargets.length > 0
            ? `Found ${availableTargets.length} morph targets. Adjust sliders to test.`
            : 'Loading morph targets... Check console for details.'
          }
        </p>

        {availableTargets.length > 0 ? (
          availableTargets.map((name) => (
            <div key={name} style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '5px',
                fontSize: '13px',
                fontWeight: name.toLowerCase().includes('mouth') || name.toLowerCase().includes('jaw') ? 'bold' : 'normal',
                color: name.toLowerCase().includes('mouth') || name.toLowerCase().includes('jaw') ? '#4CAF50' : 'white'
              }}>
                {name}: {(morphValues[name] * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={morphValues[name] || 0}
                onChange={(e) => handleSliderChange(name, parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  cursor: 'pointer'
                }}
              />
              <button
                onClick={() => handleSliderChange(name, 0.5)}
                style={{
                  marginTop: '5px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  backgroundColor: '#444',
                  color: 'white',
                  border: '1px solid #666',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Set to 50%
              </button>
            </div>
          ))
        ) : (
          <div>
            <p style={{ opacity: 0.5 }}>
              No morph targets found yet...
            </p>
            <p style={{ fontSize: '12px', opacity: 0.5, marginTop: '10px' }}>
              This avatar might not have facial morph targets.
              Check the console for detailed information.
            </p>
          </div>
        )}
      </div>

      {/* 3D Scene */}
      <div style={{ flex: 1 }}>
        <Canvas
          camera={{
            position: [0, 1.6, 3],
            fov: 45
          }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />

          <MorphTargetAvatar
            onMorphTargetsFound={handleMorphTargetsFound}
            morphValues={morphValues}
          />

          <OrbitControls
            target={[0, 1.5, 0]}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
          />

          <gridHelper args={[10, 10]} />
        </Canvas>
      </div>
    </div>
  );
};

// Preload avatar
useGLTF.preload('/avatars/AngelChick.glb');

export default MorphTargetTest;
