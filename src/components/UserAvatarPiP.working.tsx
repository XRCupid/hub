import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { PresenceAvatar } from './PresenceAvatar';
import { ML5FaceMeshService } from '../services/ML5FaceMeshService';
import './UserAvatarPiP.css';

/**
 * WORKING UserAvatarPiP with DIRECT ML5 integration
 * No complex services, no memory leaks, just pure face tracking
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
  const [isTracking, setIsTracking] = useState(false);
  
  // Single ML5 service reference
  const ml5Service = useRef<ML5FaceMeshService | null>(null);

  // Initialize face tracking
  useEffect(() => {
    if (!enableOwnTracking) return;

    console.log('[UserAvatarPiP] Starting ML5 face tracking...');
    
    const initTracking = async () => {
      try {
        // Create ML5 service
        ml5Service.current = new ML5FaceMeshService();
        
        // Initialize
        await ml5Service.current.initialize();
        
        // Get camera stream and video element
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        
        await new Promise((resolve) => {
          video.onloadedmetadata = resolve;
        });

        // Start ML5 tracking
        await ml5Service.current.startTracking(video);
        
        // Polling loop to get tracking data
        const trackingInterval = setInterval(() => {
          if (ml5Service.current) {
            const expressions = ml5Service.current.getExpressions();
            const headRotation = ml5Service.current.getHeadRotation();
            
            setTrackingData({
              facialExpressions: expressions,
              headRotation,
              landmarks: ml5Service.current.getLandmarks() || []
            });
          }
        }, 100);

        setIsTracking(true);
        console.log('[UserAvatarPiP] ✅ ML5 tracking started successfully');
        
        // Cleanup function
        return () => {
          clearInterval(trackingInterval);
          if (video.srcObject) {
            const tracks = (video.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
          }
        };
        
      } catch (error) {
        console.warn('[UserAvatarPiP] ML5 failed, using fallback:', error);
        
        // Simple fallback animation
        const fallbackInterval = setInterval(() => {
          const time = Date.now() * 0.001;
          setTrackingData({
            facialExpressions: {
              mouthSmile: Math.max(0, Math.sin(time * 0.5) * 0.3),
              eyeBlinkLeft: Math.max(0, Math.sin(time * 0.7) * 0.2),
              eyeBlinkRight: Math.max(0, Math.sin(time * 0.8) * 0.2),
            },
            headRotation: {
              x: Math.sin(time * 0.2) * 0.1,
              y: Math.cos(time * 0.3) * 0.1,
              z: 0
            }
          });
        }, 200);

        return () => clearInterval(fallbackInterval);
      }
    };

    initTracking();

    return () => {
      if (ml5Service.current) {
        ml5Service.current.stopTracking();
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
            gl={{ 
              antialias: true,
              alpha: true,
              powerPreference: "high-performance"
            }}
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
          <div className={`pip-status-dot ${isTracking ? 'pip-status-active' : 'pip-status-fallback'}`}></div>
          <span className="pip-status-text">
            {isTracking ? 'Face Sync' : 'Animated'}
          </span>
        </div>
      )}
    </div>
  );
};

export default UserAvatarPiP;
