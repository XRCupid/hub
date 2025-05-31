import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { EnhancedAnimatedAvatar } from './EnhancedAnimatedAvatar';
import './AvatarControlDemo.css';

export const AvatarControlDemo: React.FC = () => {
  const [headRotation, setHeadRotation] = useState({ pitch: 0, yaw: 0, roll: 0 });
  const [bodyLean, setBodyLean] = useState({ forward: 0, side: 0 });
  const [shoulderHeight, setShouldHeight] = useState(0);
  const [emotionalState, setEmotionalState] = useState<'neutral' | 'happy' | 'sad' | 'excited' | 'thoughtful'>('neutral');
  const [enableMouseTracking, setEnableMouseTracking] = useState(true);
  const [enableKeyboardControl, setEnableKeyboardControl] = useState(true);
  const [voiceIntensity, setVoiceIntensity] = useState(0.5);
  const [isSpeaking, setIsSpeaking] = useState(false);

  return (
    <div className="avatar-control-demo">
      <div className="demo-container">
        <div className="avatar-view">
          <Canvas 
            camera={{ position: [0, 0, 3], fov: 40 }}
            style={{ background: '#1a1a1a' }}
          >
            <ambientLight intensity={0.8} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            <directionalLight position={[-5, 5, -5]} intensity={0.5} />
            
            <EnhancedAnimatedAvatar
              avatarUrl="/avatars/fool.glb"
              animationUrl="/animations/M_Standing_Idle_001.glb"
              position={[0, -1, 0]}
              scale={[1.2, 1.2, 1.2]}
              headRotation={headRotation}
              bodyLean={bodyLean}
              shoulderHeight={shoulderHeight}
              emotionalState={emotionalState}
              enableMouseTracking={enableMouseTracking}
              enableKeyboardControl={enableKeyboardControl}
              enableVoiceIntensityResponse={true}
              voiceIntensity={voiceIntensity}
              isSpeaking={isSpeaking}
            />
          </Canvas>
        </div>
        
        <div className="control-panel">
          <h2>Avatar Control Demo</h2>
          
          <div className="control-section">
            <h3>Input Methods</h3>
            <label>
              <input 
                type="checkbox" 
                checked={enableMouseTracking}
                onChange={(e) => setEnableMouseTracking(e.target.checked)}
              />
              Mouse Tracking (move mouse to control head)
            </label>
            <label>
              <input 
                type="checkbox" 
                checked={enableKeyboardControl}
                onChange={(e) => setEnableKeyboardControl(e.target.checked)}
              />
              Keyboard Control (arrow keys)
            </label>
          </div>
          
          <div className="control-section">
            <h3>Manual Head Control</h3>
            <label>
              Pitch: {headRotation.pitch.toFixed(2)}
              <input 
                type="range" 
                min="-0.5" 
                max="0.5" 
                step="0.01"
                value={headRotation.pitch}
                onChange={(e) => setHeadRotation({...headRotation, pitch: parseFloat(e.target.value)})}
              />
            </label>
            <label>
              Yaw: {headRotation.yaw.toFixed(2)}
              <input 
                type="range" 
                min="-0.5" 
                max="0.5" 
                step="0.01"
                value={headRotation.yaw}
                onChange={(e) => setHeadRotation({...headRotation, yaw: parseFloat(e.target.value)})}
              />
            </label>
            <label>
              Roll: {headRotation.roll.toFixed(2)}
              <input 
                type="range" 
                min="-0.3" 
                max="0.3" 
                step="0.01"
                value={headRotation.roll}
                onChange={(e) => setHeadRotation({...headRotation, roll: parseFloat(e.target.value)})}
              />
            </label>
          </div>
          
          <div className="control-section">
            <h3>Body Control</h3>
            <label>
              Forward Lean: {bodyLean.forward.toFixed(2)}
              <input 
                type="range" 
                min="-1" 
                max="1" 
                step="0.1"
                value={bodyLean.forward}
                onChange={(e) => setBodyLean({...bodyLean, forward: parseFloat(e.target.value)})}
              />
            </label>
            <label>
              Side Lean: {bodyLean.side.toFixed(2)}
              <input 
                type="range" 
                min="-1" 
                max="1" 
                step="0.1"
                value={bodyLean.side}
                onChange={(e) => setBodyLean({...bodyLean, side: parseFloat(e.target.value)})}
              />
            </label>
            <label>
              Shoulder Height: {shoulderHeight.toFixed(2)}
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                value={shoulderHeight}
                onChange={(e) => setShouldHeight(parseFloat(e.target.value))}
              />
            </label>
          </div>
          
          <div className="control-section">
            <h3>Emotional State</h3>
            <select 
              value={emotionalState} 
              onChange={(e) => setEmotionalState(e.target.value as any)}
            >
              <option value="neutral">Neutral</option>
              <option value="happy">Happy</option>
              <option value="sad">Sad</option>
              <option value="excited">Excited</option>
              <option value="thoughtful">Thoughtful</option>
            </select>
          </div>
          
          <div className="control-section">
            <h3>Voice Simulation</h3>
            <label>
              <input 
                type="checkbox" 
                checked={isSpeaking}
                onChange={(e) => setIsSpeaking(e.target.checked)}
              />
              Is Speaking
            </label>
            <label>
              Voice Intensity: {voiceIntensity.toFixed(2)}
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                value={voiceIntensity}
                onChange={(e) => setVoiceIntensity(parseFloat(e.target.value))}
              />
            </label>
          </div>
          
          <div className="info-section">
            <h3>Available Controls:</h3>
            <ul>
              <li><strong>Mouse:</strong> Move cursor to control head direction</li>
              <li><strong>Keyboard:</strong> Arrow keys for head pitch/yaw</li>
              <li><strong>Sliders:</strong> Fine control over all parameters</li>
              <li><strong>Voice:</strong> Simulates speaking animations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
