import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

// List of all available animations
const ANIMATIONS = [
  { name: 'Standing Idle 1', file: '/animations/M_Standing_Idle_001.glb' },
  { name: 'Standing Idle 2', file: '/animations/M_Standing_Idle_002.glb' },
  { name: 'Idle Variation 1', file: '/animations/M_Standing_Idle_Variations_001.glb' },
  { name: 'Idle Variation 2', file: '/animations/M_Standing_Idle_Variations_002.glb' },
  { name: 'Idle Variation 3', file: '/animations/M_Standing_Idle_Variations_003.glb' },
  { name: 'Idle Variation 4', file: '/animations/M_Standing_Idle_Variations_004.glb' },
  { name: 'Idle Variation 5', file: '/animations/M_Standing_Idle_Variations_005.glb' },
  { name: 'Idle Variation 6', file: '/animations/M_Standing_Idle_Variations_006.glb' },
  { name: 'Idle Variation 7', file: '/animations/M_Standing_Idle_Variations_007.glb' },
  { name: 'Idle Variation 8', file: '/animations/M_Standing_Idle_Variations_008.glb' },
  { name: 'Idle Variation 9', file: '/animations/M_Standing_Idle_Variations_009.glb' },
  { name: 'Idle Variation 10', file: '/animations/M_Standing_Idle_Variations_010.glb' },
  { name: 'Talking 1', file: '/animations/M_Talking_Variations_001.glb' },
  { name: 'Talking 2', file: '/animations/M_Talking_Variations_002.glb' },
  { name: 'Talking 3', file: '/animations/M_Talking_Variations_003.glb' },
  { name: 'Talking 4', file: '/animations/M_Talking_Variations_004.glb' },
  { name: 'Talking 5', file: '/animations/M_Talking_Variations_005.glb' },
  { name: 'Talking 6', file: '/animations/M_Talking_Variations_006.glb' },
  { name: 'Talking 7', file: '/animations/M_Talking_Variations_007.glb' },
  { name: 'Talking 8', file: '/animations/M_Talking_Variations_008.glb' },
  { name: 'Talking 9', file: '/animations/M_Talking_Variations_009.glb' },
  { name: 'Talking 10', file: '/animations/M_Talking_Variations_010.glb' },
  { name: 'Simple Idle', file: '/animations/idle.glb' },
  { name: 'Simple Talk', file: '/animations/talk.glb' }
];

interface AnimatedAvatarProps {
  animationUrl: string;
}

function AnimatedAvatar({ animationUrl }: AnimatedAvatarProps) {
  // Load avatar model
  const avatar = useGLTF('/avatars/AngelChick.glb');
  
  // Load animation separately
  const animation = useGLTF(animationUrl);
  
  // Setup animations on the avatar scene
  const { actions, mixer } = useAnimations(animation.animations, avatar.scene);
  
  useEffect(() => {
    console.log('=== Animation Debug Info ===');
    console.log('Animation URL:', animationUrl);
    console.log('Animation clips:', animation.animations);
    console.log('Actions created:', Object.keys(actions));
    
    // Stop all current actions
    Object.values(actions).forEach(action => {
      if (action) action.stop();
    });
    
    // Play the first available animation
    const actionKeys = Object.keys(actions);
    if (actionKeys.length > 0) {
      const firstAction = actions[actionKeys[0]];
      if (firstAction) {
        console.log(`Playing animation: ${actionKeys[0]}`);
        firstAction.reset().play();
      }
    } else {
      console.error('No actions available!');
    }
  }, [animationUrl, animation, actions]);
  
  return <primitive object={avatar.scene} />;
}

const SimpleAnimationTest: React.FC = () => {
  const [selectedAnimation, setSelectedAnimation] = useState(ANIMATIONS[0].file);
  
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#1a1a1a' }}>
      {/* Animation Selector Menu */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '20px',
        borderRadius: '8px',
        color: 'white'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Animation Selector</h3>
        <select 
          value={selectedAnimation}
          onChange={(e) => setSelectedAnimation(e.target.value)}
          style={{
            width: '250px',
            padding: '8px',
            fontSize: '14px',
            backgroundColor: '#333',
            color: 'white',
            border: '1px solid #555',
            borderRadius: '4px'
          }}
        >
          {ANIMATIONS.map((anim) => (
            <option key={anim.file} value={anim.file}>
              {anim.name}
            </option>
          ))}
        </select>
        <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.7 }}>
          Selected: {ANIMATIONS.find(a => a.file === selectedAnimation)?.name}
        </div>
      </div>
      
      <Canvas 
        camera={{ 
          position: [0, 1, 3],
          fov: 45
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        
        <AnimatedAvatar animationUrl={selectedAnimation} />
        
        <OrbitControls 
          target={[0, 1, 0]}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />
        
        <gridHelper args={[10, 10]} />
      </Canvas>
    </div>
  );
};

// Preload assets
useGLTF.preload('/avatars/AngelChick.glb');
ANIMATIONS.forEach(anim => {
  useGLTF.preload(anim.file);
});

export default SimpleAnimationTest;
