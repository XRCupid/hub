import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { rpmIntegration, RPMAvatar } from '../services/RPMIntegrationService';
import { FacialBlendShapes } from '../services/AvatarMirrorSystem';

interface RPMWorkingAvatarProps {
  avatarUrl: string;
  blendShapes?: FacialBlendShapes;
  viseme?: string;
  animation?: string;
  position?: [number, number, number];
  scale?: number;
  enableOrbitControls?: boolean;
  onAvatarLoaded?: (avatar: RPMAvatar) => void;
}

// Inner component that uses Three.js hooks
const AvatarScene: React.FC<RPMWorkingAvatarProps & { onError: (error: any) => void }> = ({
  avatarUrl,
  blendShapes,
  viseme,
  animation,
  position = [0, 0, 0],
  scale = 1,
  onAvatarLoaded,
  onError
}) => {
  const [avatar, setAvatar] = useState<RPMAvatar | null>(null);
  const [loading, setLoading] = useState(true);
  const groupRef = useRef<THREE.Group>(null);
  const clockRef = useRef(new THREE.Clock());

  // Load avatar
  useEffect(() => {
    if (!avatarUrl) {
      onError(new Error('No avatar URL provided'));
      return;
    }

    setLoading(true);
    rpmIntegration.loadAvatar(avatarUrl)
      .then((loadedAvatar) => {
        setAvatar(loadedAvatar);
        setLoading(false);
        
        if (groupRef.current) {
          // Clear existing children
          while (groupRef.current.children.length > 0) {
            groupRef.current.remove(groupRef.current.children[0]);
          }
          
          // Add avatar to scene
          groupRef.current.add(loadedAvatar.scene);
          
          // Apply scale
          loadedAvatar.scene.scale.set(scale, scale, scale);
          
          // Play idle animation by default
          const idleAnim = loadedAvatar.animations.get('Idle') || 
                          loadedAvatar.animations.get('idle') ||
                          Array.from(loadedAvatar.animations.values())[0];
          
          if (idleAnim) {
            rpmIntegration.playAnimation(loadedAvatar, idleAnim.name, { loop: true });
          }
        }
        
        if (onAvatarLoaded) {
          onAvatarLoaded(loadedAvatar);
        }
        
        console.log('✅ RPM Avatar loaded successfully');
        console.log('Available expressions:', rpmIntegration.getAvailableExpressions(loadedAvatar));
        console.log('Available animations:', rpmIntegration.getAvailableAnimations(loadedAvatar));
      })
      .catch((error) => {
        console.error('Failed to load avatar:', error);
        setLoading(false);
        onError(error);
      });
  }, [avatarUrl, scale, onAvatarLoaded, onError]);

  // Apply blend shapes
  useEffect(() => {
    if (!avatar || !blendShapes) return;
    
    // Convert MediaPipe blend shapes to RPM morph targets
    const expression: Record<string, number> = {};
    
    // Map common expressions
    if (blendShapes.eyeBlinkLeft !== undefined) expression.eyeBlinkLeft = blendShapes.eyeBlinkLeft;
    if (blendShapes.eyeBlinkRight !== undefined) expression.eyeBlinkRight = blendShapes.eyeBlinkRight;
    if (blendShapes.browDownLeft !== undefined) expression.browDownLeft = blendShapes.browDownLeft;
    if (blendShapes.browDownRight !== undefined) expression.browDownRight = blendShapes.browDownRight;
    if (blendShapes.browInnerUp !== undefined) expression.browInnerUp = blendShapes.browInnerUp;
    if (blendShapes.browOuterUpLeft !== undefined) expression.browOuterUpLeft = blendShapes.browOuterUpLeft;
    if (blendShapes.browOuterUpRight !== undefined) expression.browOuterUpRight = blendShapes.browOuterUpRight;
    if (blendShapes.cheekSquintLeft !== undefined) expression.cheekSquintLeft = blendShapes.cheekSquintLeft;
    if (blendShapes.cheekSquintRight !== undefined) expression.cheekSquintRight = blendShapes.cheekSquintRight;
    if (blendShapes.jawOpen !== undefined) expression.jawOpen = blendShapes.jawOpen;
    if (blendShapes.mouthClose !== undefined) expression.mouthClose = blendShapes.mouthClose;
    if (blendShapes.mouthFunnel !== undefined) expression.mouthFunnel = blendShapes.mouthFunnel;
    if (blendShapes.mouthPucker !== undefined) expression.mouthPucker = blendShapes.mouthPucker;
    if (blendShapes.mouthLeft !== undefined) expression.mouthLeft = blendShapes.mouthLeft;
    if (blendShapes.mouthRight !== undefined) expression.mouthRight = blendShapes.mouthRight;
    if (blendShapes.mouthSmileLeft !== undefined) expression.mouthSmileLeft = blendShapes.mouthSmileLeft;
    if (blendShapes.mouthSmileRight !== undefined) expression.mouthSmileRight = blendShapes.mouthSmileRight;
    if (blendShapes.mouthFrownLeft !== undefined) expression.mouthFrownLeft = blendShapes.mouthFrownLeft;
    if (blendShapes.mouthFrownRight !== undefined) expression.mouthFrownRight = blendShapes.mouthFrownRight;
    if (blendShapes.mouthDimpleLeft !== undefined) expression.mouthDimpleLeft = blendShapes.mouthDimpleLeft;
    if (blendShapes.mouthDimpleRight !== undefined) expression.mouthDimpleRight = blendShapes.mouthDimpleRight;
    if (blendShapes.mouthStretchLeft !== undefined) expression.mouthStretchLeft = blendShapes.mouthStretchLeft;
    if (blendShapes.mouthStretchRight !== undefined) expression.mouthStretchRight = blendShapes.mouthStretchRight;
    if (blendShapes.mouthRollLower !== undefined) expression.mouthRollLower = blendShapes.mouthRollLower;
    if (blendShapes.mouthRollUpper !== undefined) expression.mouthRollUpper = blendShapes.mouthRollUpper;
    if (blendShapes.mouthShrugLower !== undefined) expression.mouthShrugLower = blendShapes.mouthShrugLower;
    if (blendShapes.mouthShrugUpper !== undefined) expression.mouthShrugUpper = blendShapes.mouthShrugUpper;
    if (blendShapes.mouthPressLeft !== undefined) expression.mouthPressLeft = blendShapes.mouthPressLeft;
    if (blendShapes.mouthPressRight !== undefined) expression.mouthPressRight = blendShapes.mouthPressRight;
    if (blendShapes.mouthLowerDownLeft !== undefined) expression.mouthLowerDownLeft = blendShapes.mouthLowerDownLeft;
    if (blendShapes.mouthLowerDownRight !== undefined) expression.mouthLowerDownRight = blendShapes.mouthLowerDownRight;
    if (blendShapes.mouthUpperUpLeft !== undefined) expression.mouthUpperUpLeft = blendShapes.mouthUpperUpLeft;
    if (blendShapes.mouthUpperUpRight !== undefined) expression.mouthUpperUpRight = blendShapes.mouthUpperUpRight;
    if (blendShapes.noseSneerLeft !== undefined) expression.noseSneerLeft = blendShapes.noseSneerLeft;
    if (blendShapes.noseSneerRight !== undefined) expression.noseSneerRight = blendShapes.noseSneerRight;
    if (blendShapes.cheekPuff !== undefined) expression.cheekPuff = blendShapes.cheekPuff;
    if (blendShapes.eyeLookDownLeft !== undefined) expression.eyeLookDownLeft = blendShapes.eyeLookDownLeft;
    if (blendShapes.eyeLookDownRight !== undefined) expression.eyeLookDownRight = blendShapes.eyeLookDownRight;
    if (blendShapes.eyeLookInLeft !== undefined) expression.eyeLookInLeft = blendShapes.eyeLookInLeft;
    if (blendShapes.eyeLookInRight !== undefined) expression.eyeLookInRight = blendShapes.eyeLookInRight;
    if (blendShapes.eyeLookOutLeft !== undefined) expression.eyeLookOutLeft = blendShapes.eyeLookOutLeft;
    if (blendShapes.eyeLookOutRight !== undefined) expression.eyeLookOutRight = blendShapes.eyeLookOutRight;
    if (blendShapes.eyeLookUpLeft !== undefined) expression.eyeLookUpLeft = blendShapes.eyeLookUpLeft;
    if (blendShapes.eyeLookUpRight !== undefined) expression.eyeLookUpRight = blendShapes.eyeLookUpRight;
    if (blendShapes.eyeSquintLeft !== undefined) expression.eyeSquintLeft = blendShapes.eyeSquintLeft;
    if (blendShapes.eyeSquintRight !== undefined) expression.eyeSquintRight = blendShapes.eyeSquintRight;
    if (blendShapes.eyeWideLeft !== undefined) expression.eyeWideLeft = blendShapes.eyeWideLeft;
    if (blendShapes.eyeWideRight !== undefined) expression.eyeWideRight = blendShapes.eyeWideRight;
    if (blendShapes.jawForward !== undefined) expression.jawForward = blendShapes.jawForward;
    if (blendShapes.jawLeft !== undefined) expression.jawLeft = blendShapes.jawLeft;
    if (blendShapes.jawRight !== undefined) expression.jawRight = blendShapes.jawRight;
    if (blendShapes.tongueOut !== undefined) expression.tongueOut = blendShapes.tongueOut;
    
    rpmIntegration.applyExpression(avatar, expression);
  }, [avatar, blendShapes]);

  // Apply viseme
  useEffect(() => {
    if (!avatar || !viseme) return;
    rpmIntegration.applyViseme(avatar, viseme);
  }, [avatar, viseme]);

  // Play animation
  useEffect(() => {
    if (!avatar || !animation) return;
    rpmIntegration.playAnimation(avatar, animation, { loop: true, fadeIn: 0.5 });
  }, [avatar, animation]);

  // Update animations
  useFrame(() => {
    if (avatar) {
      const delta = clockRef.current.getDelta();
      rpmIntegration.update(avatar, delta);
    }
  });

  if (loading) {
    return (
      <mesh position={position}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#4A90E2" />
      </mesh>
    );
  }

  return <group ref={groupRef} position={position} />;
};

// Main component with Canvas
export const RPMWorkingAvatar: React.FC<RPMWorkingAvatarProps> = (props) => {
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        color: '#666',
        fontSize: '14px',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div>
          <p>Failed to load avatar</p>
          <p style={{ fontSize: '12px', marginTop: '10px' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 1.5, 3], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <directionalLight position={[-10, -10, -5]} intensity={0.4} />
      
      <AvatarScene 
        {...props} 
        onError={(err) => setError(err.message || 'Unknown error')}
      />
      
      {props.enableOrbitControls && <OrbitControls />}
    </Canvas>
  );
};
