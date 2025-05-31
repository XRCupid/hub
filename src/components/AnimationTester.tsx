import React, { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import PresenceAvatar from './PresenceAvatar';
import { PRELOADED_AVATARS } from '../data/preloadedAvatars';

// Define types locally
type EmotionalState = 'happy' | 'flirty' | 'confident' | 'nervous' | 'excited' | 'interested' | 'neutral';

interface PartnerState {
  engagement: number;
  responseReady: boolean;
  isSpeaking?: boolean;
}

// Available animations
const ANIMATIONS = {
  male: {
    idle: [
      { name: 'Standing Idle 001', url: '/animations/M_Standing_Idle_001.glb' },
      { name: 'Standing Idle 002', url: '/animations/M_Standing_Idle_002.glb' },
      { name: 'Idle Variations 001', url: '/animations/M_Standing_Idle_Variations_001.glb' },
      { name: 'Idle Variations 002', url: '/animations/M_Standing_Idle_Variations_002.glb' },
      { name: 'Idle Variations 003', url: '/animations/M_Standing_Idle_Variations_003.glb' },
    ],
    talking: [
      { name: 'Talking Variations 001', url: '/animations/M_Talking_Variations_001.glb' },
      { name: 'Talking Variations 002', url: '/animations/M_Talking_Variations_002.glb' },
      { name: 'Talking Variations 003', url: '/animations/M_Talking_Variations_003.glb' },
      { name: 'Talking Variations 004', url: '/animations/M_Talking_Variations_004.glb' },
      { name: 'Talking Variations 005', url: '/animations/M_Talking_Variations_005.glb' },
    ]
  },
  female: {
    idle: [
      { name: 'F Standing Idle 001', url: '/animations/feminine/idle/F_Standing_Idle_001.glb' },
      { name: 'F Idle Variations 001', url: '/animations/feminine/idle/F_Standing_Idle_Variations_001.glb' },
      { name: 'F Idle Variations 002', url: '/animations/feminine/idle/F_Standing_Idle_Variations_002.glb' },
      { name: 'F Idle Variations 003', url: '/animations/feminine/idle/F_Standing_Idle_Variations_003.glb' },
      { name: 'F Idle Variations 004', url: '/animations/feminine/idle/F_Standing_Idle_Variations_004.glb' },
      { name: 'F Idle Variations 005', url: '/animations/feminine/idle/F_Standing_Idle_Variations_005.glb' },
    ],
    talking: [
      { name: 'F Talking Variations 001', url: '/animations/feminine/talk/F_Talking_Variations_001.glb' },
      { name: 'F Talking Variations 002', url: '/animations/feminine/talk/F_Talking_Variations_002.glb' },
      { name: 'F Talking Variations 003', url: '/animations/feminine/talk/F_Talking_Variations_003.glb' },
      { name: 'F Talking Variations 004', url: '/animations/feminine/talk/F_Talking_Variations_004.glb' },
      { name: 'F Talking Variations 005', url: '/animations/feminine/talk/F_Talking_Variations_005.glb' },
      { name: 'F Talking Variations 006', url: '/animations/feminine/talk/F_Talking_Variations_006.glb' },
    ]
  }
};

const AnimationTester: React.FC = () => {
  const [selectedAvatar, setSelectedAvatar] = useState('/avatars/myMan.glb');
  
  // Determine avatar gender based on selection
  const currentAvatarData = PRELOADED_AVATARS.find(a => a.path === selectedAvatar);
  const avatarGender = currentAvatarData?.type === 'female' ? 'female' : 'male';
  const currentAnimations = ANIMATIONS[avatarGender];
  
  // Handle avatar change
  useEffect(() => {
    // Reset animations when gender changes
    setSelectedIdleAnimation(currentAnimations.idle[0].url);
    setSelectedTalkAnimation(currentAnimations.talking[0].url);
  }, [avatarGender]); // Only re-run when gender changes
  
  const [selectedIdleAnimation, setSelectedIdleAnimation] = useState(currentAnimations.idle[0].url);
  const [selectedTalkAnimation, setSelectedTalkAnimation] = useState(currentAnimations.talking[0].url);
  const [emotionalState, setEmotionalState] = useState<EmotionalState>('neutral');
  const [engagement, setEngagement] = useState(0.5);
  const [partnerState, setPartnerState] = useState<PartnerState>({
    engagement: 0.5,
    responseReady: false,
    isSpeaking: false
  });

  const emotionalStates: EmotionalState[] = [
    'happy', 'flirty', 'confident', 'nervous', 'excited', 'interested'
  ];

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#f0f0f0' }}>
      <Canvas 
        camera={{ 
          position: [0, 1.6, 2.5], 
          fov: 45 
        }}
        style={{ background: '#1a1a1a' }}
        shadows
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          <Environment preset="city" />
          
          <PresenceAvatar
            avatarUrl={selectedAvatar}
            idleAnimationUrl={selectedIdleAnimation}
            talkAnimationUrl={selectedTalkAnimation}
            position={[0, 0, 0]}
            scale={1}
            emotionalState={emotionalState}
            partnerState={partnerState}
            trackingData={{
              facialExpressions: null,
              posture: null,
              hands: null
            }}
          />
          
          <OrbitControls 
            target={[0, 1.5, 0]} 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
          />
          
          <gridHelper args={[10, 10]} />
        </Suspense>
      </Canvas>

      {/* Control Panel */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: '20px',
        borderRadius: '10px',
        color: 'white',
        maxWidth: '300px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>🎮 Animation Tester</h3>
        
        {/* Avatar Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Select Avatar:</label>
          <select 
            value={selectedAvatar} 
            onChange={(e) => {
              setSelectedAvatar(e.target.value);
              const currentAvatarData = PRELOADED_AVATARS.find(a => a.path === e.target.value);
              const avatarGender = currentAvatarData?.type === 'female' ? 'female' : 'male';
              const currentAnimations = ANIMATIONS[avatarGender];
              setSelectedIdleAnimation(currentAnimations.idle[0].url);
              setSelectedTalkAnimation(currentAnimations.talking[0].url);
            }}
            style={{ width: '100%', padding: '8px', borderRadius: '5px', backgroundColor: '#2a2a2a', color: 'white', border: '1px solid #444' }}
          >
            <optgroup label="Preloaded Avatars">
              {PRELOADED_AVATARS.map(avatar => (
                <option key={avatar.path} value={avatar.path}>{avatar.name}</option>
              ))}
            </optgroup>
            <optgroup label="Custom Avatars">
              <option value="/avatars/myMan.glb">Coach Avatar (myMan)</option>
              <option value="/avatars/fool.glb">Fool Avatar</option>
              <option value="/avatars/user-avatar.glb">User Avatar</option>
            </optgroup>
          </select>
        </div>

        {/* Idle Animation Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Idle Animation:</label>
          <select 
            value={selectedIdleAnimation} 
            onChange={(e) => setSelectedIdleAnimation(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '5px', backgroundColor: '#2a2a2a', color: 'white', border: '1px solid #444' }}
          >
            {currentAnimations.idle.map(anim => (
              <option key={anim.url} value={anim.url}>{anim.name}</option>
            ))}
          </select>
        </div>

        {/* Talk Animation Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Talk Animation:</label>
          <select 
            value={selectedTalkAnimation} 
            onChange={(e) => setSelectedTalkAnimation(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '5px', backgroundColor: '#2a2a2a', color: 'white', border: '1px solid #444' }}
          >
            {currentAnimations.talking.map(anim => (
              <option key={anim.url} value={anim.url}>{anim.name}</option>
            ))}
          </select>
        </div>

        <hr style={{ margin: '20px 0', borderColor: '#444' }} />
        
        {/* Emotional State */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Emotional State:</label>
          <select 
            value={emotionalState} 
            onChange={(e) => setEmotionalState(e.target.value as EmotionalState)}
            style={{ width: '100%', padding: '8px', borderRadius: '5px', backgroundColor: '#2a2a2a', color: 'white', border: '1px solid #444' }}
          >
            <option value="neutral">Neutral</option>
            {emotionalStates.map(state => (
              <option key={state} value={state}>{state.charAt(0).toUpperCase() + state.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Engagement Slider */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Engagement: {engagement.toFixed(2)}
          </label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={engagement}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              setEngagement(value);
              setPartnerState((prev: PartnerState) => ({ ...prev, engagement: value }));
            }}
            style={{ width: '100%' }}
          />
        </div>

        {/* Checkboxes */}
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input 
              type="checkbox"
              checked={partnerState.responseReady}
              onChange={(e) => setPartnerState((prev: PartnerState) => ({ 
                ...prev, 
                responseReady: e.target.checked 
              }))}
              style={{ marginRight: '8px' }}
            />
            Response Ready
          </label>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input 
              type="checkbox"
              checked={partnerState.isSpeaking || false}
              onChange={(e) => setPartnerState((prev: PartnerState) => ({ 
                ...prev, 
                isSpeaking: e.target.checked 
              }))}
              style={{ marginRight: '8px' }}
            />
            Is Speaking (Triggers Talk Animation)
          </label>
        </div>

        <div style={{ marginTop: '20px', fontSize: '12px', opacity: 0.7 }}>
          <p>🖱️ Use mouse to orbit camera</p>
          <p>📏 Scroll to zoom in/out</p>
          <p>🎭 Toggle "Is Speaking" to test animations</p>
        </div>
      </div>
    </div>
  );
};

export default AnimationTester;
