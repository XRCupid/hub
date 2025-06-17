import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { PresenceAvatar } from './PresenceAvatar';
import './UserAvatarPiP.css';

/**
 * SIMPLE, WORKING UserAvatarPiP - Based on version that worked beautifully for weeks
 * Removed all the complex tracking services that caused memory issues
 */

interface UserAvatarPiPProps {
  avatarUrl?: string;
  size?: 'small' | 'medium' | 'large';
  position?: 'bottom-right' | 'top-left' | 'top-right' | 'bottom-left';
  className?: string;
  style?: React.CSSProperties;
  enableOwnTracking?: boolean;
  onClose?: () => void;
  cameraPosition?: [number, number, number];
  cameraFOV?: number;
  cameraTarget?: [number, number, number];
  disableAutoCamera?: boolean;
}

export const UserAvatarPiP: React.FC<UserAvatarPiPProps> = ({ 
  avatarUrl = "/avatars/user_avatar.glb",
  size = 'medium',
  position = 'bottom-right',
  style,
  className,
  enableOwnTracking = false,
  onClose,
  cameraPosition = [0, 1.6, 1.8],
  cameraFOV = 38,
  cameraTarget = [0, 1.6, 0],
  disableAutoCamera = false
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [trackingData, setTrackingData] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simple fallback tracking - just basic animation
  useEffect(() => {
    if (!enableOwnTracking) return;

    console.log('[UserAvatarPiP-Simple] Starting simple tracking...');
    
    // Very lightweight tracking simulation
    intervalRef.current = setInterval(() => {
      const time = Date.now() * 0.001;
      setTrackingData({
        facialExpressions: {
          mouthSmile: Math.max(0, Math.sin(time * 0.5) * 0.3),
          eyeBlinkLeft: Math.max(0, Math.sin(time * 0.7) * 0.2),
          eyeBlinkRight: Math.max(0, Math.sin(time * 0.8) * 0.2),
          browRaise: Math.max(0, Math.sin(time * 0.3) * 0.1),
        },
        headRotation: {
          x: Math.sin(time * 0.2) * 0.1,
          y: Math.cos(time * 0.3) * 0.1,
          z: 0
        }
      });
    }, 200); // 5 FPS - very lightweight

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enableOwnTracking]);

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'pip-small';
      case 'large': return 'pip-large';
      default: return 'pip-medium';
    }
  };

  const getPositionClass = () => {
    return `pip-${position}`;
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`pip-container ${getSizeClass()} ${getPositionClass()} ${className || ''}`}
      style={style}
    >
      {onClose && (
        <button 
          className="pip-close-btn"
          onClick={() => {
            setIsVisible(false);
            onClose();
          }}
          aria-label="Close PiP"
        >
          ×
        </button>
      )}
      
      <div className="pip-content">
        <Suspense fallback={
          <div className="pip-loading">
            <div className="pip-avatar-placeholder">
              👤
            </div>
          </div>
        }>
          <Canvas
            camera={{ 
              position: cameraPosition, 
              fov: cameraFOV 
            }}
            style={{ background: 'transparent' }}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={0.8} />
            
            <PresenceAvatar
              avatarUrl={avatarUrl}
              position={[0, -0.8, 0]}
              scale={1}
              trackingData={trackingData}
              animationName="idle"
            />
            
            {!disableAutoCamera && (
              <OrbitControls
                target={cameraTarget}
                enablePan={false}
                enableZoom={false}
                enableRotate={false}
              />
            )}
          </Canvas>
        </Suspense>
      </div>
      
      {enableOwnTracking && (
        <div className="pip-status">
          <div className="pip-status-dot pip-status-active"></div>
          <span className="pip-status-text">Tracking</span>
        </div>
      )}
    </div>
  );
};

export default UserAvatarPiP;
