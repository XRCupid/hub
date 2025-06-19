import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { PresenceAvatar } from './PresenceAvatar';
import { CombinedFaceTrackingService } from '../services/CombinedFaceTrackingService';
import type { TrackingData } from '../types/tracking';

interface CircularPiPAvatarProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: number; // diameter in pixels
  avatarUrl?: string;
  enableOwnTracking?: boolean;
  trackingData?: TrackingData; // Accept parent tracking data
  onClose?: () => void;
  cameraStream?: MediaStream | null;
}

export const CircularPiPAvatar: React.FC<CircularPiPAvatarProps> = ({
  position = 'bottom-right',
  size = 200,
  avatarUrl,
  trackingData,
  enableOwnTracking = false,
  onClose,
  cameraStream = null,
  ...props
}) => {
  console.log('🚨 CircularPiPAvatar RENDER - enableOwnTracking:', enableOwnTracking);
  
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentTrackingData, setCurrentTrackingData] = useState<TrackingData | null>(null);
  
  console.log('🔥 CIRCULAR PIP AVATAR RENDER:', { 
    position, 
    size, 
    hasTrackingData: !!trackingData,
    enableOwnTracking 
  });
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackingService = useRef<CombinedFaceTrackingService | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  console.log('🎥 CircularPiPAvatar mounted with enableOwnTracking:', enableOwnTracking);

  // Component mount log
  useEffect(() => {
    console.log('🚀 PiP component did mount, enableOwnTracking =', enableOwnTracking);
  }, []);

  // Set tracking status based on whether we have tracking data
  useEffect(() => {
    setIsTracking(!!trackingData?.facialExpressions);
    console.log('🔴 PiP TRACKING DEBUG:', {
      hasTrackingData: !!trackingData,
      hasFacialExpressions: !!trackingData?.facialExpressions,
      jawOpen: trackingData?.facialExpressions?.jawOpen,
      trackingDataKeys: trackingData ? Object.keys(trackingData) : 'none'
    });
  }, [trackingData]);

  // Debug tracking data
  useEffect(() => {
    console.log('🎭 PiP Tracking state:', {
      isTracking,
      hasCurrentTrackingData: !!currentTrackingData,
      hasPropsTrackingData: !!trackingData,
      expressions: currentTrackingData?.facialExpressions,
      enableOwnTracking
    });
  }, [isTracking, currentTrackingData, trackingData, enableOwnTracking]);

  // Camera initialization for own tracking
  useEffect(() => {
    console.log('🎥 PiP useEffect triggered - enableOwnTracking:', enableOwnTracking);
    console.log('🎥 PiP effect deps:', { enableOwnTracking, mounted: true });
    
    if (!enableOwnTracking) {
      console.log('🎥 PiP own tracking disabled, using external tracking data');
      return;
    }
    
    console.log('🎥 PiP STARTING OWN CAMERA TRACKING...');
    
    let isMounted = true;
    
    const initializePiPTracking = async () => {
      // Delay to avoid race conditions with main scene ML5 initialization
      console.log('🎥 PiP delaying initialization to avoid ML5 conflicts...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Increased from 1000ms to 2000ms
      
      if (!isMounted) {
        console.log('🎥 PiP component unmounted during delay, aborting initialization');
        return;
      }
      
      console.log('🎥 PiP delay complete, proceeding with initialization...');
      
      const initCamera = async () => {
        try {
          console.log('🎥 PiP requesting camera permissions...');
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'user',
              width: { ideal: 640 },
              height: { ideal: 480 }
            } 
          });
          
          console.log('🎥 PiP camera permissions granted, stream obtained:', {
            active: stream.active,
            tracks: stream.getTracks().length,
            videoTracks: stream.getVideoTracks().length
          });
          
          if (!isMounted) {
            console.log('🎥 PiP component unmounted after getting stream, cleaning up');
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          
          streamRef.current = stream;
          
          // Create hidden video element
          const video = document.createElement('video');
          video.autoplay = true;
          video.playsInline = true;
          video.muted = true;
          video.width = 640;
          video.height = 480;
          video.style.display = 'none';
          video.style.position = 'absolute';
          video.style.top = '-9999px';
          document.body.appendChild(video);
          videoRef.current = video;
          
          // Set video source after appending to DOM
          video.srcObject = stream;
          console.log('🎥 PiP video element created and stream attached');
          
          // Wait for video to be ready
          await new Promise<void>((resolve) => {
            console.log('🎥 PiP waiting for video metadata...');
            const checkVideo = () => {
              if (video.readyState >= 2) {
                console.log('🎥 PiP video ready state:', video.readyState);
                video.play().then(() => {
                  console.log('🎥 PiP video playing');
                  resolve();
                }).catch(err => {
                  console.error('🎥 PiP video play error:', err);
                  resolve();
                });
              } else {
                setTimeout(checkVideo, 100);
              }
            };
            
            video.onloadedmetadata = () => {
              console.log('🎥 PiP video metadata loaded');
              checkVideo();
            };
            
            // Fallback if metadata never loads
            setTimeout(() => {
              console.warn('🎥 PiP video metadata timeout, forcing continue');
              resolve();
            }, 3000);
          });
          
          // Initialize face tracking service
          if (!trackingService.current) {
            console.log('🎥 PiP creating tracking service...');
            trackingService.current = new CombinedFaceTrackingService();
            console.log('🎥 PiP tracking service created');
          }
          
          // Start tracking
          if (videoRef.current && trackingService.current) {
            console.log('🎥 PiP starting face tracking...');
            try {
              await trackingService.current.startTracking(videoRef.current);
              console.log('🎥 PiP FACE TRACKING STARTED SUCCESSFULLY');
              setIsTracking(true);
            } catch (err) {
              console.error('🎥 PiP tracking initialization failed:', err);
              throw err;
            }
            
            // Start tracking loop
            intervalRef.current = setInterval(() => {
              if (trackingService.current) {
                const expressions = trackingService.current.getExpressions();
                if (expressions) {
                  // Log every 2 seconds to avoid spam
                  if (Date.now() % 2000 < 50) {
                    console.log('🎥 PiP TRACKING DATA:', {
                      jawOpen: expressions.jawOpen,
                      mouthSmileLeft: expressions.mouthSmileLeft,
                      mouthSmileRight: expressions.mouthSmileRight,
                      browInnerUp: expressions.browInnerUp,
                      eyeWideLeft: expressions.eyeWideLeft,
                      eyeWideRight: expressions.eyeWideRight,
                      hasAnyExpression: Object.values(expressions).some(v => v > 0)
                    });
                  }
                  
                  // Convert to TrackingData format
                  const trackingData: TrackingData = {
                    facialExpressions: expressions,
                    headRotation: { pitch: 0, yaw: 0, roll: 0 }
                  };
                  setCurrentTrackingData(trackingData);
                } else {
                  console.warn('🎥 PiP: No expressions detected');
                }
              }
            }, 50); // 20fps tracking
          }
          
        } catch (error) {
          console.error('🎥 PiP CAMERA ERROR:', error);
          setError('Camera permission denied');
          setIsTracking(false);
        }
      };
      
      initCamera();
    };
    
    initializePiPTracking();
    
    // Cleanup function
    return () => {
      console.log('🎥 PiP cleaning up camera and tracking...');
      isMounted = false;
      
      // Stop tracking
      if (trackingService.current) {
        trackingService.current.stopTracking();
        trackingService.current = null;
      }
      
      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Stop and cleanup video
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Remove video element
      if (videoRef.current) {
        if (videoRef.current.parentNode) {
          videoRef.current.parentNode.removeChild(videoRef.current);
        }
        videoRef.current = null;
      }
    };
  }, [enableOwnTracking]); // Dependency on enableOwnTracking

  // Cleanup on unmount  
  useEffect(() => {
    return () => {
      console.log('🧹 PiP CLEANUP STARTING...');
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (trackingService.current) {
        trackingService.current.stopTracking();
        trackingService.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (videoRef.current) {
        // Just cleanup the video element - it was never added to DOM
        try {
          if (videoRef.current.srcObject) {
            videoRef.current.srcObject = null;
          }
        } catch (error) {
          console.warn('🧹 Video srcObject cleanup warning:', error);
        }
        videoRef.current = null;
      }
      
      console.log('🧹 PiP CLEANUP COMPLETE');
    };
  }, []);

  // Position styles
  const getPositionStyle = () => {
    const baseStyle = {
      position: 'fixed' as const,
      zIndex: 9999,
      width: size,
      height: size,
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyle, top: '20px', left: '20px' };
      case 'top-right':
        return { ...baseStyle, top: '20px', right: '20px' };
      case 'bottom-left':
        return { ...baseStyle, bottom: '20px', left: '20px' };
      case 'bottom-right':
      default:
        return { ...baseStyle, bottom: '20px', right: '20px' };
    }
  };

  return (
    <div
      style={{
        ...getPositionStyle(),
        borderRadius: '50%', // Perfect circle
        overflow: 'hidden',
        border: '4px solid #ff69b4', // Bright pink border
        background: 'rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(255, 105, 180, 0.3)', // Pink glow
      }}
    >
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001
          }}
        >
          ✕
        </button>
      )}

      {/* Status indicator */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: isTracking ? '#4CAF50' : '#f44336',
          border: '2px solid white',
          zIndex: 10001
        }}
      />

      {/* Error display */}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '12px',
            textAlign: 'center',
            zIndex: 10001
          }}
        >
          {error}
        </div>
      )}

      {/* 3D Avatar Canvas */}
      <Canvas
        camera={{
          position: [0, 1.6, 2.5], // Move camera back and at face height
          fov: 20, // Very tight FOV for face zoom
          near: 0.1,
          far: 100
        }}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%', // Circular canvas
        }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 4, 2]} intensity={0.7} />
        
        <Suspense fallback={null}>
          <PresenceAvatar
            avatarUrl={avatarUrl}
            position={[0, 0, 0]} // Reset to center position
            scale={1} // Reset scale
            trackingData={(() => {
              const data = currentTrackingData || trackingData;
              if (data && Date.now() % 2000 < 50) {
                console.log('🎭 PiP Passing to PresenceAvatar:', {
                  hasData: !!data,
                  hasFacialExpressions: !!data?.facialExpressions,
                  sampleExpression: data?.facialExpressions?.jawOpen,
                  allExpressions: data?.facialExpressions
                });
              }
              return data;
            })()}
            animationName="idle"
          />
        </Suspense>
        
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={false}
          target={[0, 1.6, 0]} // Look at face height
        />
      </Canvas>
    </div>
  );
};
