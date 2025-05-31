import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import TestAvatar from './TestAvatar';
import { RPMComprehensiveAvatar } from './RPMComprehensiveAvatar';
import { PRELOADED_AVATARS } from '../data/preloadedAvatars';
import type { BlendShapeMap } from '../types/blendshapes';

export function AvatarComparison() {
  const [testBlendShapes, setTestBlendShapes] = useState<Partial<BlendShapeMap>>({
    jawOpen: 0.3,
    mouthSmileLeft: 0.5,
    mouthSmileRight: 0.5,
    eyeBlinkLeft: 0.2,
    eyeBlinkRight: 0.2
  });

  const handleSliderChange = (key: keyof BlendShapeMap, value: number) => {
    setTestBlendShapes(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Avatar Comparison: bro.glb vs RPM Avatars</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Test Blend Shapes:</h3>
        {Object.entries(testBlendShapes).map(([key, value]) => (
          <div key={key} style={{ marginBottom: '10px' }}>
            <label>{key}: {value.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={value}
              onChange={(e) => handleSliderChange(key as keyof BlendShapeMap, parseFloat(e.target.value))}
              style={{ width: '200px', marginLeft: '10px' }}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: '500px' }}>
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
          <h3 style={{ textAlign: 'center', margin: '10px' }}>bro.glb (Working Reference)</h3>
          <Canvas camera={{ position: [0, 0, 2], fov: 50 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={0.5} />
            <TestAvatar
              avatarUrl="/bro.glb"
              emotionShapes={testBlendShapes}
              visemeShapes={testBlendShapes}
            />
            <OrbitControls />
          </Canvas>
        </div>

        <div style={{ border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
          <h3 style={{ textAlign: 'center', margin: '10px' }}>RPM Avatar (male_1)</h3>
          <Canvas camera={{ position: [0, 0, 2], fov: 50 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={0.5} />
            <RPMComprehensiveAvatar
              avatarId={PRELOADED_AVATARS[0].id}
              emotionShapes={testBlendShapes}
              visemeShapes={testBlendShapes}
              position={[0, -1.2, 0]}
              scale={1}
            />
            <OrbitControls />
          </Canvas>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h4>Key Differences to Address:</h4>
        <ul>
          <li><strong>Mouth Sync:</strong> Viseme shapes control mouth movements during speech</li>
          <li><strong>Position:</strong> Avatar may need Y-axis adjustment (currently at -1.2)</li>
          <li><strong>Scale:</strong> RPM avatars might need different scaling</li>
          <li><strong>Morph Targets:</strong> Both should have ARKit blendshapes if configured correctly</li>
        </ul>
      </div>
    </div>
  );
}
