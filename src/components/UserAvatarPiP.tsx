import React, { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { CombinedFaceTrackingService } from '../services/CombinedFaceTrackingService';
import { PresenceAvatar } from './PresenceAvatar';
import { FacialExpressions } from '../types/tracking';
import './UserAvatarPiP.css';

// Error boundary for Canvas
class CanvasErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('[CanvasErrorBoundary] Caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[CanvasErrorBoundary] Error details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h3>Canvas Error</h3>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Separate canvas component to prevent re-renders
const AvatarCanvas = ({ 
  avatarUrl, 
  trackingData,
  idleAnimationUrl = "/animations/M_Standing_Idle_001.glb",
  onContextLost
}: { 
  avatarUrl: string;
  trackingData: any;
  idleAnimationUrl?: string;
  onContextLost?: () => void;
}) => {
  console.log('[AvatarCanvas] Rendering with:', { avatarUrl, hasTrackingData: !!trackingData });
  
  // Add a test to ensure canvas doesn't lose context
  React.useEffect(() => {
    console.log('[AvatarCanvas] Mounted');
    return () => {
      console.log('[AvatarCanvas] Unmounting!');
    };
  }, []);
  
  return (
    <CanvasErrorBoundary>
      <Canvas 
        camera={{ 
          position: [0, 1.5, 2.0],
          fov: 28,
          near: 0.1,
          far: 100
        }}
        style={{ width: '100%', height: '100%' }}
        gl={{ preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          console.log('[AvatarCanvas] WebGL context created');
          // Monitor context loss
          const canvas = gl.domElement;
          canvas.addEventListener('webglcontextlost', (e) => {
            console.error('[AvatarCanvas] WebGL context lost!', e);
            e.preventDefault(); // Try to prevent default behavior
            if (onContextLost) {
              onContextLost();
            }
          });
          canvas.addEventListener('webglcontextrestored', (e) => {
            console.log('[AvatarCanvas] WebGL context restored', e);
          });
        }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[0, 10, 5]} 
          intensity={0.8} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[0, 5, 10]} intensity={0.5} />
        
        <Suspense fallback={
          <mesh position={[0, 1.5, 0]}>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color="yellow" />
          </mesh>
        }>
          <PresenceAvatar
            avatarUrl={avatarUrl}
            trackingData={trackingData}
            position={[0, 0, 0]}
            scale={1}
          />
        </Suspense>
        
        <OrbitControls 
          enablePan={false}
          enableZoom={false}
          enableRotate={false}
          target={[0, 1.5, 0]}
        />
      </Canvas>
    </CanvasErrorBoundary>
  );
};

AvatarCanvas.displayName = 'AvatarCanvas';

// Custom comparison to prevent unnecessary re-renders
const arePropsEqual = (prevProps: any, nextProps: any) => {
  // Only re-render if avatar URL changes
  if (prevProps.avatarUrl !== nextProps.avatarUrl) return false;
  if (prevProps.idleAnimationUrl !== nextProps.idleAnimationUrl) return false;
  
  // Don't re-render for tracking data changes
  return true;
};

// Use the memoized version with custom comparison
const MemoizedAvatarCanvas = React.memo(AvatarCanvas, arePropsEqual);

interface UserAvatarPiPProps {
  avatarUrl?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'small' | 'medium' | 'large';
  trackingData?: any;
  onClose?: () => void;
  className?: string;
  enableOwnTracking?: boolean;
  cameraStream?: MediaStream | null;
}

export const UserAvatarPiP: React.FC<UserAvatarPiPProps> = ({ 
  avatarUrl = '/avatars/user_avatar.glb',
  position = 'bottom-right',
  size = 'large',
  trackingData,
  onClose,
  className,
  enableOwnTracking = false,
  cameraStream
}) => {
  console.log('[UserAvatarPiP] Component rendering with props:', { avatarUrl, position, size, hasTrackingData: !!trackingData });
  
  const [isTracking, setIsTracking] = useState(false);
  const [trackingDataState, setTrackingData] = useState<{
    facialExpressions: FacialExpressions | null;
    posture: any | null;
    hands: any | null;
    headRotation?: { pitch: number; yaw: number; roll: number } | null;
    landmarks?: any[] | null;
  }>({
    facialExpressions: null,
    posture: null,
    hands: null
  });
  
  // Use ref to store tracking data to avoid constant re-renders
  const trackingDataRef = useRef(trackingDataState);
  const [error, setError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [attemptReload, setAttemptReload] = useState(0);
  const [trackingSource, setTrackingSource] = useState<string>('ML5');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const trackingService = useRef<CombinedFaceTrackingService | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle WebGL context loss and recovery
  const handleContextLost = useCallback(() => {
    console.error('[UserAvatarPiP] WebGL context lost, attempting recovery...');
    setError('WebGL context lost');
    // Trigger a re-render after a short delay
    setTimeout(() => {
      setError(null);
      setAttemptReload(prev => prev + 1);
    }, 1000);
  }, []);

  // Update tracking data ref when parent tracking data changes
  useEffect(() => {
    if (trackingData) {
      trackingDataRef.current = trackingData;
    }
  }, [trackingData]);

  // Camera position for face framing
  const cameraPosition: [number, number, number] = [0, 1.5, 2.0];
  const cameraTarget: [number, number, number] = [0, 1.5, 0];

  // Log state changes
  React.useEffect(() => {
    console.log('[UserAvatarPiP] State updated:', {
      isTracking,
      hasError: !!error,
      isMinimized,
      hasTrackingData: !!trackingDataState
    });
  }, [isTracking, error, isMinimized, trackingDataState]);

  useEffect(() => {
    // If trackingData is provided from parent, use that instead of camera tracking
    if (trackingData) {
      console.log('[UserAvatarPiP] Using trackingData from parent');
      setTrackingData(trackingData);
      setIsTracking(true);
      setTrackingSource('Parent');
      return; // Don't initialize camera tracking
    }
    
    // Otherwise, initialize camera tracking
    console.log('[UserAvatarPiP] No trackingData provided, initializing camera tracking');
    const initializeTracking = async () => {
      try {
        // Initialize tracking service
        if (!trackingService.current) {
          trackingService.current = new CombinedFaceTrackingService();
          
          // Force ML5-only for now due to Hume API issues
          // const hasHume = process.env.REACT_APP_HUME_API_KEY ? true : false;
          const hasHume = false; // Disable Hume temporarily
          setTrackingSource(hasHume ? 'ML5 + Hume' : 'ML5');
        }
        
        await trackingService.current.initialize();
        
        // Use provided cameraStream if enableOwnTracking is true, otherwise get camera
        let stream: MediaStream;
        if (enableOwnTracking && cameraStream) {
          console.log('[UserAvatarPiP] Using provided cameraStream');
          stream = cameraStream;
        } else {
          console.log('[UserAvatarPiP] Getting camera stream');
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user'
            } 
          });
        }
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Wait for video to be ready
          await new Promise<void>((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => {
                videoRef.current!.play();
                resolve();
              };
            }
          });
          
          // Start tracking
          startTracking();
        }
      } catch (err) {
        console.error('Failed to initialize tracking:', err);
        setError('Failed to access camera or initialize tracking');
      }
    };

    initializeTracking();

    return () => {
      stopTracking();
      // Only stop tracks if we created our own stream
      if (streamRef.current && (!enableOwnTracking || !cameraStream)) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [trackingData, enableOwnTracking, cameraStream]);

  const startTracking = async () => {
    // Don't start camera tracking if we're using parent trackingData
    if (trackingData) {
      console.log('[UserAvatarPiP] Using parent trackingData, skipping camera tracking');
      return;
    }
    
    try {
      if (!trackingService.current || !videoRef.current) {
        throw new Error('Tracking service or video not initialized');
      }
      
      setIsTracking(true);
      setError('');
      
      await trackingService.current.startTracking(videoRef.current);
      
      // Update tracking data at 50ms
      intervalRef.current = setInterval(async () => {
        if (trackingService.current) {
          const expressions = trackingService.current.getExpressions();
          const headRotation = trackingService.current.getHeadRotation();
          const postureData = trackingService.current.getPostureData();
          const landmarks = trackingService.current.getLandmarks();
          
          // Log tracking data occasionally
          if (Math.random() < 0.05) {
            console.log('[UserAvatarPiP] Raw tracking data:', {
              expressions,
              headRotation,
              expressionKeys: expressions ? Object.keys(expressions) : null,
              hasAnyExpression: expressions ? Object.values(expressions).some(v => v > 0) : false
            });
          }
          
          // Update ref immediately
          trackingDataRef.current = {
            facialExpressions: expressions,
            headRotation: headRotation,
            posture: postureData,
            hands: null,
            landmarks: landmarks || []
          };
          
          // Update state every time to ensure data flows to avatar
          setTrackingData(trackingDataRef.current);
        }
      }, 50);
    } catch (err: any) {
      console.error('Tracking error:', err);
      setError(err.message || 'Failed to start tracking');
      setIsTracking(false);
    }
  };

  const stopTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (trackingService.current) {
      trackingService.current.stopTracking();
    }
    
    setIsTracking(false);
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'pip-small';
      case 'large': return 'pip-large';
      default: return 'pip-medium';
    }
  };

  useEffect(() => {
    if (!enableOwnTracking || !cameraStream) return;
    
    const initializeTracking = async () => {
      try {
        console.log('[UserAvatarPiP] Initializing face tracking...');
        
        // Create video element for tracking
        if (!videoRef.current) {
          const video = document.createElement('video');
          video.autoplay = true;
          video.playsInline = true;
          video.muted = true;
          video.style.display = 'none';
          document.body.appendChild(video);
          (videoRef as React.MutableRefObject<HTMLVideoElement>).current = video;
        }
        
        // Set video source
        if (videoRef.current) {
          videoRef.current.srcObject = cameraStream;
        }
        streamRef.current = cameraStream;
        
        // Initialize tracking service
        trackingService.current = new CombinedFaceTrackingService();
        await trackingService.current.initialize();
        if (videoRef.current) {
          await trackingService.current.startTracking(videoRef.current);
        }
        console.log('[UserAvatarPiP] Tracking service initialized');
        setIsTracking(true);
        setTrackingSource('ML5');
        
        // Start tracking loop
        const updateTracking = () => {
          if (trackingService.current && videoRef.current) {
            const expressions = trackingService.current.getExpressions();
            if (expressions) {
              setTrackingData({
                facialExpressions: expressions,
                posture: null,
                hands: null,
                headRotation: null,
                landmarks: null
              });
            }
          }
        };
        
        intervalRef.current = setInterval(updateTracking, 50); // 20 FPS
        
      } catch (error) {
        console.error('[UserAvatarPiP] Error initializing tracking:', error);
        setError('Failed to initialize face tracking');
      }
    };
    
    initializeTracking();
    
    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (trackingService.current) {
        trackingService.current.stopTracking();
      }
      if (videoRef.current && videoRef.current.parentNode) {
        videoRef.current.parentNode.removeChild(videoRef.current);
      }
    };
  }, [enableOwnTracking, cameraStream]);

  return (
    <div 
      className={`user-avatar-pip ${position} ${getSizeClass()} ${isMinimized ? 'minimized' : ''}`}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999
      }}
    >
      {/* Hidden video element for camera feed */}
      <video 
        ref={videoRef} 
        style={{ display: 'none' }} 
        playsInline
        muted
      />
      
      {/* Minimal floating close button */}
      {onClose && (
        <button 
          className="pip-close-button"
          onClick={onClose}
          title="Close"
        >
          ✕
        </button>
      )}
      
      {/* Avatar content takes full space */}
      <div className="avatar-content" style={{ width: '100%', height: '100%' }}>
        {error ? (
          <div style={{ color: 'white', padding: '10px', textAlign: 'center' }}>
            <p>Error loading avatar:</p>
            <p>{error}</p>
            <button onClick={() => setAttemptReload(prev => prev + 1)}>
              Retry
            </button>
          </div>
        ) : (
          <Suspense fallback={
            <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
              Loading avatar...
            </div>
          }>
            <Canvas
              key={`canvas-${attemptReload}`}
              camera={{ 
                position: [0, 1.2, 0.9], 
                fov: 35,
                near: 0.01,
                far: 100
              }}
              gl={{ 
                antialias: true, 
                alpha: true,
                preserveDrawingBuffer: true,
                powerPreference: 'high-performance'
              }}
              onCreated={({ gl }) => {
                console.log('[UserAvatarPiP] Canvas created, WebGL context:', gl);
              }}
              onError={(error: any) => {
                console.error('[UserAvatarPiP] Canvas error:', error);
                setError('WebGL Error: ' + (error?.message || String(error)));
              }}
            >
              <ambientLight intensity={0.6} />
              <directionalLight position={[0, 10, 5]} intensity={0.8} />
              <directionalLight position={[0, 5, 10]} intensity={0.5} />
              
              <Suspense fallback={
                <mesh position={[0, 0.6, 0]}>
                  <sphereGeometry args={[0.2, 32, 32]} />
                  <meshStandardMaterial color="yellow" />
                </mesh>
              }>
                <PresenceAvatar
                  avatarUrl={avatarUrl}
                  trackingData={trackingData || trackingDataRef.current}
                  position={[0, -0.6, 0]}
                  scale={1}
                />
              </Suspense>
              
              <OrbitControls 
                enablePan={false}
                enableZoom={false}
                enableRotate={false}
                target={[0, 1.0, 0]}
              />
            </Canvas>
          </Suspense>
        )}
        
        {(trackingData || trackingDataState)?.facialExpressions && !error && (
          <div className="expression-debug">
            <div className="expression-mini">
              {isTracking && <div style={{color: 'lime', fontSize: '10px'}}>● TRACKING ACTIVE</div>}
              {Object.entries((trackingData || trackingDataState).facialExpressions)
                .filter(([_, value]) => (value as number) > 0.2)
                .slice(0, 3)
                .map(([name, value]) => (
                  <div key={name} style={{ fontSize: '10px', marginBottom: '2px' }}>
                    {name}: {((value as number) * 100).toFixed(0)}%
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
