import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import { SafeVisualEffects } from '../components/SafeVisualEffects';
import { PresenceAvatar } from '../components/PresenceAvatar';
import './PostProcessingDemo.css';

const PostProcessingDemo: React.FC = () => {
  const [effectsEnabled, setEffectsEnabled] = useState<boolean>(false);
  const [style, setStyle] = useState<'subtle' | 'medium' | 'dramatic'>('medium');
  const [showAvatar, setShowAvatar] = useState<boolean>(true);

  return (
    <div className="post-processing-demo">
      <header className="demo-header">
        <h1>Visual Effects Demo</h1>
        <p>Safe visual enhancements without dependency conflicts</p>
      </header>

      <div className="demo-container">
        <div className="controls-panel" style={{ padding: '20px', background: '#f0f0f0' }}>
          <h2>Controls</h2>
          
          <div className="control-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px' }}>Scene Content</label>
            <div>
              <label style={{ marginRight: '20px' }}>
                <input 
                  type="radio" 
                  checked={showAvatar}
                  onChange={() => setShowAvatar(true)}
                />
                Avatar
              </label>
              <label>
                <input 
                  type="radio" 
                  checked={!showAvatar}
                  onChange={() => setShowAvatar(false)}
                />
                Box
              </label>
            </div>
          </div>
          
          <div className="control-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px' }}>Visual Effects</label>
            <div>
              <label style={{ marginRight: '20px' }}>
                <input 
                  type="radio" 
                  checked={!effectsEnabled}
                  onChange={() => setEffectsEnabled(false)}
                />
                Off
              </label>
              <label>
                <input 
                  type="radio" 
                  checked={effectsEnabled}
                  onChange={() => setEffectsEnabled(true)}
                />
                On
              </label>
            </div>
          </div>

          <div className="control-group">
            <label style={{ display: 'block', marginBottom: '10px' }}>Style</label>
            <select 
              value={style} 
              onChange={(e) => setStyle(e.target.value as any)}
              disabled={!effectsEnabled}
              style={{ padding: '5px' }}
            >
              <option value="subtle">Subtle</option>
              <option value="medium">Medium</option>
              <option value="dramatic">Dramatic</option>
            </select>
          </div>
        </div>

        <div className="scene-container" style={{ width: '100%', height: '500px' }}>
          <Canvas camera={{ position: [0, 0, showAvatar ? 2 : 5], fov: showAvatar ? 35 : 50 }}>
            <ambientLight intensity={0.3} />
            <directionalLight position={[10, 10, 5]} intensity={0.7} />
            
            <Suspense fallback={null}>
              {showAvatar ? (
                <PresenceAvatar
                  avatarUrl="/avatars/coach_grace.glb"
                  position={[0, -1.2, 0]}
                  scale={1.0}
                  trackingData={undefined}
                />
              ) : (
                <Box args={[2, 2, 2]}>
                  <meshStandardMaterial 
                    color="hotpink" 
                    metalness={0.3}
                    roughness={0.4}
                  />
                </Box>
              )}
            </Suspense>
            
            <OrbitControls 
              target={showAvatar ? [0, 0, 0] : [0, 0, 0]}
              enablePan={false}
            />
            
            <SafeVisualEffects 
              enabled={effectsEnabled}
              style={style}
            />
          </Canvas>
        </div>
      </div>
    </div>
  );
};

export default PostProcessingDemo;
