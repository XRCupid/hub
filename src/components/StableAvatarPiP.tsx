import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import { PresenceAvatar } from './PresenceAvatar';
import { CombinedFaceTrackingService } from '../services/CombinedFaceTrackingService';
import { CameraHelper, AxesHelper } from 'three';
import './UserAvatarPiP.css';

// Tracking data ref to avoid re-renders
const trackingDataRef = { current: null as any };

// Memoized Canvas that never re-renders
const StableCanvas = React.memo<{ avatarUrl: string }>(({ avatarUrl }) => {
  console.log('[DEBUG] StableCanvas rendering');
  
  return (
    <Canvas 
      camera={{ 
        position: [0, 1.5, 3.0], // Move camera back a bit more
        fov: 45,
        near: 0.1,
        far: 100
      }}
      style={{ width: '100%', height: '100%' }}
      gl={{ 
        preserveDrawingBuffer: true,
        antialias: true 
      }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} />
      
      <OrbitControls 
        enablePan={false}
        enableZoom={false}
        enableRotate={true}
        target={[0, 1.5, 0]}
      />
      
      {/* Render the actual avatar */}
      <Suspense fallback={<LoadingFallback />}>
        <AvatarUpdater avatarUrl={avatarUrl} />
      </Suspense>
    </Canvas>
  );
}, () => true); // Never re-render

// Loading fallback component
const LoadingFallback = () => {
  return (
    <mesh position={[0, 1, 0]}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshBasicMaterial color="blue" wireframe />
    </mesh>
  );
};

// Component inside Canvas that can access useFrame
const AvatarUpdater = React.memo(({ avatarUrl }: { avatarUrl: string }) => {
  const [updateCount, setUpdateCount] = useState(0);
  
  // Force update periodically to pick up new tracking data
  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateCount(prev => {
        const newCount = prev + 1;
        if (newCount % 30 === 0) { // Log every 3 seconds
          console.log('[DEBUG] AvatarUpdater update count:', newCount, 'trackingData:', !!trackingDataRef.current);
          if (trackingDataRef.current?.facialExpressions) {
            const activeExpressions = Object.entries(trackingDataRef.current.facialExpressions)
              .filter(([_, v]) => (v as number) > 0.01)
              .map(([k, v]) => `${k}: ${(v as number).toFixed(2)}`);
            if (activeExpressions.length > 0) {
              console.log('[DEBUG] Active expressions in AvatarUpdater:', activeExpressions.join(', '));
            }
          }
        }
        return newCount;
      });
    }, 100); // Update 10 times per second
    
    return () => clearInterval(interval);
  }, []);
  
  // Get current tracking data
  const trackingData = trackingDataRef.current;
  
  return (
    <PresenceAvatar
      avatarUrl={avatarUrl}
      trackingData={trackingData}
      position={[0, 0, 0]}
      scale={1}
    />
  );
});

interface StableAvatarPiPProps {
  avatarUrl?: string;
  onClose?: () => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'small' | 'medium' | 'large';
}

export const StableAvatarPiP: React.FC<StableAvatarPiPProps> = ({
  avatarUrl = '/avatars/coach_grace.glb',
  onClose,
  position = 'bottom-right',
  size = 'medium'
}) => {
  console.log('[DEBUG] StableAvatarPiP rendering');
  
  const [isTracking, setIsTracking] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [error, setError] = useState<string>('');
  const [showDebug, setShowDebug] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const trackingService = useRef<CombinedFaceTrackingService | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasInitialized = useRef(false);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const initializeTracking = async () => {
      try {
        console.log('[DEBUG] ========== INITIALIZING ON MOUNT ==========');
        
        // Initialize tracking service
        if (!trackingService.current) {
          console.log('[DEBUG] Creating new CombinedFaceTrackingService');
          trackingService.current = new CombinedFaceTrackingService();
          console.log('[DEBUG] Initializing tracking service...');
          await trackingService.current.initialize();
          console.log('[DEBUG] Tracking service initialized');
          
          // Start tracking immediately after initialization
          await startTracking();
        }
      } catch (err) {
        console.error('[DEBUG] Failed to initialize:', err);
        setError(`Failed to initialize: ${(err as Error)?.message || 'Unknown error'}`);
      }
    };
    
    initializeTracking();
    
    return () => {
      stopTracking();
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoElementRef.current) {
        if (videoElementRef.current.parentNode) {
          videoElementRef.current.parentNode.removeChild(videoElementRef.current);
        }
        if (videoElementRef.current.srcObject) {
          const stream = videoElementRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
        videoElementRef.current = null;
      }
    };
  }, []);
  
  // Log tracking data changes
  useEffect(() => {
    if (trackingDataRef.current) {
      console.log('[DEBUG] Tracking data updated:', {
        headRotation: trackingDataRef.current.headRotation,
        expressions: trackingDataRef.current.facialExpressions
      });
    }
  }, [trackingDataRef.current]);

  const startTracking = useCallback(async () => {
    console.log('[DEBUG] ========== START TRACKING BUTTON PRESSED ==========');
    console.log('[DEBUG] isTracking state before:', isTracking);
    console.log('[DEBUG] trackingService.current:', !!trackingService.current);
    console.log('[DEBUG] videoRef.current:', !!videoRef.current);
    console.log('[DEBUG] Current trackingDataRef:', trackingDataRef.current);
    
    // Check if already tracking
    if (isTracking) {
      console.log('[DEBUG] Already tracking, returning early');
      return;
    }
    
    if (!trackingService.current) {
      console.error('[DEBUG] Tracking service not initialized, creating new instance');
      trackingService.current = new CombinedFaceTrackingService();
      try {
        await trackingService.current.initialize();
        console.log('[DEBUG] Tracking service initialized');
      } catch (err) {
        console.error('[DEBUG] Failed to initialize tracking service:', err);
        setError(`Failed to initialize tracking: ${(err as Error)?.message || 'Unknown error'}`);
        return;
      }
    }
    
    try {
      // Start camera first
      console.log('[DEBUG] Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30, min: 15 }
        },
        audio: false
      });
      
      // Use the video element ref if it exists, otherwise create a new one
      if (!videoElementRef.current) {
        console.log('[DEBUG] Creating new video element');
        const newVideo = document.createElement('video');
        newVideo.style.display = 'none';
        newVideo.setAttribute('playsinline', '');
        newVideo.muted = true;
        document.body.appendChild(newVideo);
        videoElementRef.current = newVideo;
      }
      
      console.log('[DEBUG] Setting video source and playing...');
      const video = videoElementRef.current;
      videoRef.current = video; // Update the ref used by the component
      video.srcObject = stream;
      
      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        const onCanPlay = () => {
          video.removeEventListener('canplay', onCanPlay);
          resolve(true);
        };
        video.addEventListener('canplay', onCanPlay, { once: true });
        
        // Set a timeout in case the video never becomes ready
        setTimeout(() => {
          video.removeEventListener('canplay', onCanPlay);
          console.warn('[DEBUG] Video play timed out, continuing anyway');
          resolve(false);
        }, 3000);
      });
      
      try {
        await video.play();
        console.log('[DEBUG] Video playback started successfully');
      } catch (playErr) {
        console.error('[DEBUG] Video play failed, trying with muted attribute:', playErr);
        video.muted = true;
        await video.play().catch(e => {
          console.error('[DEBUG] Video play with muted attribute also failed:', e);
          throw new Error('Could not start video playback');
        });
      }
      
      // Check if ML5 service is already tracking
      const ml5Service = (trackingService.current as any).ml5Service;
      if (ml5Service && ml5Service.isTracking) {
        console.log('[DEBUG] ML5 service is already tracking! Just updating state.');
        setIsTracking(true);
        return;
      }
      
      console.log('[DEBUG] About to call trackingService.startTracking()...');
      trackingService.current.startTracking(videoRef.current);
      console.log('[DEBUG] startTracking() called successfully');
      setIsTracking(true);
      
      // Set up interval to update tracking data
      intervalRef.current = setInterval(() => {
        if (trackingService.current) {
          const expressions = trackingService.current.getExpressions();
          const headRotation = trackingService.current.getHeadRotation();
          const landmarks = trackingService.current.getLandmarks();
          
          const newTrackingData = {
            facialExpressions: expressions,
            headRotation: headRotation,
            landmarks: landmarks
          };
          
          console.log('[DEBUG] Updating tracking data:', {
            hasExpressions: !!expressions,
            hasHeadRotation: !!headRotation,
            hasLandmarks: !!landmarks,
            sampleExpression: expressions?.mouthOpen?.toFixed(2),
            headRotationSample: headRotation ? `pitch: ${headRotation.pitch.toFixed(2)}` : 'null'
          });
          
          trackingDataRef.current = newTrackingData;
        }
      }, 33); // 30 FPS
    } catch (err) {
      console.error('[DEBUG] Error starting tracking:', err);
      setError(`Failed to start tracking: ${(err as Error)?.message || 'Unknown error'}`);
    }
  }, []);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (trackingService.current) {
      trackingService.current.stopTracking();
    }
    
    trackingDataRef.current = null;
    setIsTracking(false);
  }, []);

  return (
    <>
      <video 
        ref={videoRef}
        style={{ display: 'none' }}
        playsInline
        muted
      />
      
      <div className={`user-avatar-pip ${position} ${size} ${isMinimized ? 'minimized' : ''}`}>
        <div className="pip-controls">
          <button 
            className="pip-button"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Restore" : "Minimize"}
          >
            {isMinimized ? '□' : '_'}
          </button>
          <button 
            className="pip-button"
            onClick={() => setShowDebug(!showDebug)}
            title="Toggle Debug"
          >
            🐛
          </button>
          {onClose && (
            <button 
              className="pip-button"
              onClick={onClose}
              title="Close"
            >
              ×
            </button>
          )}
        </div>
        
        {!isMinimized && (
          <>
            <div className="pip-content">
              <StableCanvas avatarUrl={avatarUrl} />
              
              {error && (
                <div className="error-message" style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'rgba(0,0,0,0.8)',
                  padding: '20px',
                  borderRadius: '8px'
                }}>
                  <p>{error}</p>
                  <button onClick={() => window.location.reload()}>Refresh</button>
                </div>
              )}
            </div>
            
            <div className="pip-footer">
              {!isTracking ? (
                <button onClick={startTracking} className="control-button">
                  Start Camera & Tracking
                </button>
              ) : (
                <button onClick={stopTracking} className="control-button active">
                  Stop Tracking
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};
