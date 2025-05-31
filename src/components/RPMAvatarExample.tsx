import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import { Mesh, Object3D } from 'three';

interface AvatarWithLipSyncProps {
  avatarUrl: string;
  currentViseme?: string;
  expression?: string;
  speaking?: boolean;
}

// Available avatars from manifest
const AVAILABLE_AVATARS = [
  { name: 'Select an avatar...', path: '' },
  { name: 'AngelChick', path: '/avatars/AngelChick.glb' },
  { name: 'Male 1', path: '/avatars/male_1.glb' },
  { name: 'Female 1', path: '/avatars/female_1.glb' },
  { name: 'Male 2', path: '/avatars/male_2.glb' },
  { name: 'Female 2', path: '/avatars/female_2.glb' },
  { name: 'Neutral 1', path: '/avatars/neutral_1.glb' }
];

// Component that handles the avatar with all features
function AvatarWithLipSync({ avatarUrl, currentViseme, expression, speaking }: AvatarWithLipSyncProps) {
  const { scene } = useGLTF(avatarUrl);
  const [blinking, setBlinking] = useState(false);
  
  // Natural blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    }, Math.random() * 3000 + 2000);
    
    return () => clearInterval(blinkInterval);
  }, []);
  
  // Apply morph targets
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as Mesh).morphTargetDictionary && (child as Mesh).morphTargetInfluences) {
        const mesh = child as Mesh;
        
        // Reset all morph targets
        if (mesh.morphTargetDictionary) {
          Object.keys(mesh.morphTargetDictionary).forEach(key => {
            const index = mesh.morphTargetDictionary![key];
            mesh.morphTargetInfluences![index] = 0;
          });
        }
        
        // Apply blinking
        if (blinking && mesh.morphTargetDictionary) {
          ['eyeBlinkLeft', 'eyeBlinkRight'].forEach(morphName => {
            if (mesh.morphTargetDictionary![morphName] !== undefined) {
              const index = mesh.morphTargetDictionary![morphName];
              mesh.morphTargetInfluences![index] = 1;
            }
          });
        }
        
        // Apply current viseme for lip sync
        if (currentViseme && mesh.morphTargetDictionary && mesh.morphTargetDictionary[`viseme_${currentViseme}`] !== undefined) {
          const index = mesh.morphTargetDictionary[`viseme_${currentViseme}`];
          mesh.morphTargetInfluences![index] = 0.8;
        }
        
        // Apply expression
        if (expression && mesh.morphTargetDictionary) {
          const expressionMorphs: Record<string, string[]> = {
            happy: ['mouthSmile', 'eyeSquintLeft', 'eyeSquintRight'],
            sad: ['mouthFrownLeft', 'mouthFrownRight', 'browInnerUp'],
            surprised: ['mouthOpen', 'eyeWideLeft', 'eyeWideRight'],
            angry: ['browDownLeft', 'browDownRight', 'mouthFrownLeft', 'mouthFrownRight']
          };
          
          if (expressionMorphs[expression]) {
            expressionMorphs[expression].forEach(morphName => {
              if (mesh.morphTargetDictionary?.[morphName] !== undefined) {
                const index = mesh.morphTargetDictionary[morphName];
                mesh.morphTargetInfluences![index] = 0.6;
              }
            });
          }
        }
        
        // Subtle idle animation when speaking
        if (speaking && !currentViseme && mesh.morphTargetDictionary?.['mouthOpen'] !== undefined) {
          const time = Date.now() * 0.001;
          const index = mesh.morphTargetDictionary['mouthOpen'];
          mesh.morphTargetInfluences![index] = Math.sin(time * 5) * 0.1 + 0.1;
        }
      }
    });
  }, [scene, currentViseme, expression, blinking, speaking]);
  
  return <primitive object={scene} scale={1.2} position={[0, -1, 0]} />;
}

// Example usage component
export default function RPMAvatarExample() {
  const [avatarUrl, setAvatarUrl] = useState('');
  const [currentViseme, setCurrentViseme] = useState<string>('');
  const [expression, setExpression] = useState<string>('');
  const [speaking, setSpeaking] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  
  // Simulate speech with visemes
  const simulateSpeech = () => {
    setSpeaking(true);
    const visemeSequence = ['aa', 'E', 'I', 'O', 'U', 'PP', 'FF', 'TH', 'DD', 'kk', 'CH', 'SS', 'nn', 'RR', 'aa'];
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < visemeSequence.length) {
        setCurrentViseme(visemeSequence[index]);
        index++;
      } else {
        clearInterval(interval);
        setCurrentViseme('');
        setSpeaking(false);
      }
    }, 150);
  };
  
  const loadAvatar = () => {
    if (avatarUrl && avatarUrl.endsWith('.glb')) {
      setShowAvatar(true);
    } else {
      alert('Please enter a valid avatar path ending with .glb');
    }
  };
  
  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>
        <h1>Ready Player Me Avatar Test</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px' }}>
            Select from available avatars:
            <select
              value={avatarUrl}
              onChange={(e) => {
                setAvatarUrl(e.target.value);
                setShowAvatar(false);
              }}
              style={{
                marginLeft: '10px',
                padding: '5px',
                fontSize: '14px'
              }}
            >
              {AVAILABLE_AVATARS.map(avatar => (
                <option key={avatar.path} value={avatar.path}>
                  {avatar.name}
                </option>
              ))}
            </select>
          </label>
          
          <label style={{ display: 'block' }}>
            Or enter custom avatar path: 
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => {
                setAvatarUrl(e.target.value);
                setShowAvatar(false);
              }}
              style={{ 
                marginLeft: '10px', 
                padding: '5px', 
                width: '500px',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}
              placeholder="/avatars/your_avatar.glb"
            />
          </label>
          <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
            Current path: {avatarUrl || 'None selected'}
          </small>
          
          <button
            onClick={loadAvatar}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Load Avatar
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setExpression('happy')} disabled={!showAvatar}>😊 Happy</button>
          <button onClick={() => setExpression('sad')} disabled={!showAvatar}>😢 Sad</button>
          <button onClick={() => setExpression('surprised')} disabled={!showAvatar}>😮 Surprised</button>
          <button onClick={() => setExpression('angry')} disabled={!showAvatar}>😠 Angry</button>
          <button onClick={() => setExpression('')} disabled={!showAvatar}>😐 Neutral</button>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={simulateSpeech} disabled={speaking || !showAvatar}>
            {speaking ? '🎤 Speaking...' : '🎤 Test Speech'}
          </button>
          <button onClick={() => setCurrentViseme('aa')} disabled={!showAvatar}>Test Viseme AA</button>
          <button onClick={() => setCurrentViseme('O')} disabled={!showAvatar}>Test Viseme O</button>
          <button onClick={() => setCurrentViseme('')} disabled={!showAvatar}>Clear Viseme</button>
        </div>
        
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
          <strong>Current State:</strong>
          <ul>
            <li>Avatar: {showAvatar ? avatarUrl : 'Not loaded'}</li>
            <li>Expression: {expression || 'neutral'}</li>
            <li>Viseme: {currentViseme || 'none'}</li>
            <li>Speaking: {speaking ? 'yes' : 'no'}</li>
          </ul>
        </div>
      </div>
      
      <div style={{ flex: 1 }}>
        <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.5} />
          {showAvatar && avatarUrl && (
            <AvatarWithLipSync
              avatarUrl={avatarUrl}
              currentViseme={currentViseme}
              expression={expression}
              speaking={speaking}
            />
          )}
          <OrbitControls />
        </Canvas>
      </div>
    </div>
  );
}
