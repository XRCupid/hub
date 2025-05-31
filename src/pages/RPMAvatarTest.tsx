import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { RPMAnimatedAvatar } from '../components/RPMAnimatedAvatar';
import { PRELOADED_AVATARS } from '../data/preloadedAvatars';
import type { BlendShapeMap } from '../types/blendshapes';

export default function RPMAvatarTest() {
  const [selectedAvatar, setSelectedAvatar] = useState(PRELOADED_AVATARS[0]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [emotionShapes, setEmotionShapes] = useState<Partial<BlendShapeMap>>({
    mouthSmileLeft: 0.2,
    mouthSmileRight: 0.2,
    eyeSquintLeft: 0.1,
    eyeSquintRight: 0.1
  });

  // Test speech animation
  const toggleSpeech = () => {
    setIsSpeaking(!isSpeaking);
  };

  // Test different emotions
  const setEmotion = (emotion: string) => {
    switch(emotion) {
      case 'happy':
        setEmotionShapes({
          mouthSmileLeft: 0.7,
          mouthSmileRight: 0.7,
          eyeSquintLeft: 0.4,
          eyeSquintRight: 0.4,
          cheekSquintLeft: 0.3,
          cheekSquintRight: 0.3
        });
        break;
      case 'sad':
        setEmotionShapes({
          mouthFrownLeft: 0.5,
          mouthFrownRight: 0.5,
          browInnerUp: 0.4,
          eyeSquintLeft: 0.2,
          eyeSquintRight: 0.2
        });
        break;
      case 'surprised':
        setEmotionShapes({
          eyeWideLeft: 0.7,
          eyeWideRight: 0.7,
          browInnerUp: 0.6,
          jawOpen: 0.3,
          mouthOpen: 0.4
        });
        break;
      case 'neutral':
        setEmotionShapes({
          mouthSmileLeft: 0.1,
          mouthSmileRight: 0.1
        });
        break;
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>RPM Avatar Test - Mouth Sync & Positioning</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Avatar Selection:</h3>
        <select 
          value={selectedAvatar.id} 
          onChange={(e) => {
            const avatar = PRELOADED_AVATARS.find(a => a.id === e.target.value);
            if (avatar) setSelectedAvatar(avatar);
          }}
        >
          {PRELOADED_AVATARS.map(avatar => (
            <option key={avatar.id} value={avatar.id}>
              {avatar.name} ({avatar.type})
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Speech Control:</h3>
        <button 
          onClick={toggleSpeech}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: isSpeaking ? '#ff4444' : '#44ff44',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {isSpeaking ? 'Stop Speaking' : 'Start Speaking'}
        </button>
        <span style={{ marginLeft: '20px' }}>
          {isSpeaking ? '🗣️ Avatar is speaking...' : '🤐 Avatar is silent'}
        </span>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Emotions:</h3>
        <button onClick={() => setEmotion('happy')} style={{ marginRight: '10px' }}>😊 Happy</button>
        <button onClick={() => setEmotion('sad')} style={{ marginRight: '10px' }}>😢 Sad</button>
        <button onClick={() => setEmotion('surprised')} style={{ marginRight: '10px' }}>😮 Surprised</button>
        <button onClick={() => setEmotion('neutral')} style={{ marginRight: '10px' }}>😐 Neutral</button>
      </div>

      <div style={{ height: '600px', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
        <Canvas camera={{ position: [0, 0, 2], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.5} />
          <directionalLight position={[-5, 5, -5]} intensity={0.3} />
          
          <RPMAnimatedAvatar
            avatarId={selectedAvatar.id}
            emotionShapes={emotionShapes}
            visemeShapes={{}} // Visemes are handled internally when speaking
            isSpeaking={isSpeaking}
            position={[0, -0.8, 0]}
            scale={1.2}
          />
          
          <OrbitControls />
          
          {/* Grid helper for positioning reference */}
          <gridHelper args={[10, 10]} />
        </Canvas>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h4>Status:</h4>
        <ul>
          <li><strong>Avatar:</strong> {selectedAvatar.name}</li>
          <li><strong>Speaking:</strong> {isSpeaking ? 'Yes' : 'No'}</li>
          <li><strong>Position:</strong> [0, -0.8, 0] (adjustable for proper framing)</li>
          <li><strong>Scale:</strong> 1.2 (slightly larger than default)</li>
          <li><strong>Mouth Animation:</strong> {isSpeaking ? 'Dynamic viseme simulation active' : 'Idle'}</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f4f8', borderRadius: '8px' }}>
        <h4>Key Improvements:</h4>
        <ul>
          <li>✅ Proper mouth sync with speech state</li>
          <li>✅ Correct avatar positioning (Y: -0.8 for better framing)</li>
          <li>✅ Smooth blendshape transitions</li>
          <li>✅ Support for all ARKit blendshapes</li>
          <li>✅ Idle mouth state when not speaking</li>
          <li>✅ Dynamic viseme animation during speech</li>
        </ul>
      </div>
    </div>
  );
}
