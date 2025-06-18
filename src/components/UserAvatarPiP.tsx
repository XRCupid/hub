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
  // Legacy props for backward compatibility
  trackingData?: any;
  cameraStream?: MediaStream | null;
  postureData?: any;
}

export const UserAvatarPiP: React.FC<UserAvatarPiPProps> = ({
  avatarUrl = "/avatars/user_avatar.glb",
  size = 'medium',
  position = 'bottom-right',
  style,
  className,
  enableOwnTracking = false,
  onClose,
  cameraPosition: initialCameraPosition = [0, 1.6, 1.8],
  cameraFOV: initialCameraFOV = 38,
  cameraTarget: initialCameraTarget = [0, 1.6, 0],
  disableAutoCamera = false,
  trackingData,
  cameraStream,
  postureData
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [trackingDataState, setTrackingData] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get size dimensions
  const getSizeDimensions = () => {
    switch(size) {
      case 'small': return { width: 120, height: 120 };
      case 'large': return { width: 320, height: 320 };
      default: return { width: 200, height: 200 };
    }
  };

  const dimensions = getSizeDimensions();

  // Simple fallback tracking - just basic animation
  useEffect(() => {
    if (!enableOwnTracking) return;

    console.log('[UserAvatarPiP-Simple] Starting simple tracking...');
    console.log('[UserAvatarPiP-Simple] Avatar URL:', avatarUrl);
    
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

  const [cameraPosition, setCameraPosition] = useState(() => {
    const saved = localStorage.getItem('pipCameraPosition');
    return saved ? JSON.parse(saved) : initialCameraPosition;
  });
  
  const [cameraTarget, setCameraTarget] = useState(() => {
    const saved = localStorage.getItem('pipCameraTarget');  
    return saved ? JSON.parse(saved) : initialCameraTarget;
  });
  
  const [cameraFOV, setCameraFOV] = useState(() => {
    const saved = localStorage.getItem('pipCameraFOV');
    return saved ? JSON.parse(saved) : initialCameraFOV;
  });

  const [isLocked, setIsLocked] = useState(() => {
    const saved = localStorage.getItem('pipCameraLocked');
    return saved ? JSON.parse(saved) : false;
  });

  const [showTransform, setShowTransform] = useState(false);

  // Save current camera settings to localStorage
  const saveCameraSettings = () => {
    // Get current camera state from OrbitControls
    const canvas = document.querySelector('.user-avatar-pip canvas') as any;
    if (canvas?.__r3f?.camera) {
      const camera = canvas.__r3f.camera;
      const position = [camera.position.x, camera.position.y, camera.position.z];
      const target = [camera.target?.x || 0, camera.target?.y || 1.0, camera.target?.z || 0];
      const fov = camera.fov;
      
      localStorage.setItem('pipCameraPosition', JSON.stringify(position));
      localStorage.setItem('pipCameraTarget', JSON.stringify(target));
      localStorage.setItem('pipCameraFOV', JSON.stringify(fov));
      
      setCameraPosition(position);
      setCameraTarget(target);  
      setCameraFOV(fov);
      
      console.log('PiP Camera Settings Saved:', { position, target, fov });
      alert('Camera settings saved! Will be restored on page reload.');
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`user-avatar-pip ${getSizeClass()} ${getPositionClass()} ${className || ''}`}
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
            gl={{ 
              antialias: true,
              alpha: true,
              powerPreference: "high-performance"
            }}
          >
            <ambientLight intensity={1.2} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} />
            
            <PresenceAvatar
              avatarUrl={avatarUrl}
              position={[0, -0.8, 0]}
              scale={1}
              trackingData={trackingDataState}
              animationName="idle"
            />
            
            <OrbitControls
              target={cameraTarget}
              enablePan={!isLocked}
              enableZoom={!isLocked}
              enableRotate={!isLocked}
            />
          </Canvas>
        </Suspense>
      </div>
      
      {enableOwnTracking && (
        <div className="pip-status">
          <div className="pip-status-dot pip-status-active"></div>
          <span className="pip-status-text">Tracking</span>
        </div>
      )}
      
      <button 
        className="pip-save-btn"
        onClick={saveCameraSettings}
        aria-label="Save Camera Settings"
      >
        Save Camera
      </button>
      
      <button 
        className="pip-lock-btn"
        onClick={() => {
          setIsLocked(!isLocked);
          localStorage.setItem('pipCameraLocked', JSON.stringify(!isLocked));
        }}
        aria-label="Toggle Camera Lock"
      >
        {isLocked ? 'Unlock Camera' : 'Lock Camera'}
      </button>
      
      <button 
        className="pip-transform-btn"
        onClick={() => setShowTransform(!showTransform)}
        aria-label="Toggle Camera Transform"
      >
        {showTransform ? 'Hide Transform' : 'Show Transform'}
      </button>
      
      {showTransform && (
        <div className="pip-transform">
          <p>Camera Position: ({cameraPosition.join(', ')})</p>
          <p>Camera Target: ({cameraTarget.join(', ')})</p>
          <p>Camera FOV: {cameraFOV}</p>
        </div>
      )}
    </div>
  );
};

export default UserAvatarPiP;
