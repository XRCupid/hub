import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { PresenceAvatar } from './PresenceAvatar';
import { CombinedFaceTrackingService } from '../services/CombinedFaceTrackingService';
import { FallbackFaceTracking } from '../services/FallbackFaceTracking';
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
  postureData,
  idleAnimationUrl = "/animations/M_Standing_Idle_001.glb",
  onContextLost
}: { 
  avatarUrl: string;
  trackingData: any;
  postureData?: {
    bodyOpenness?: number;
    confidenceScore?: number;
    shoulderAlignment?: number;
    leaning?: string;
  };
  idleAnimationUrl?: string;
  onContextLost?: () => void;
}) => {
  console.log('[AvatarCanvas] Rendering with:', { avatarUrl, hasTrackingData: !!trackingData });
  
  // Enhanced debugging for tracking data
  React.useEffect(() => {
    const debugInterval = setInterval(() => {
      console.log('[AvatarCanvas] 🔍 TRACKING DEBUG:', {
        hasTrackingData: !!trackingData,
        trackingDataKeys: trackingData ? Object.keys(trackingData) : null,
        facialExpressions: trackingData?.facialExpressions ? {
          isObject: typeof trackingData.facialExpressions === 'object' && !Array.isArray(trackingData.facialExpressions),
          isArray: Array.isArray(trackingData.facialExpressions),
          keyCount: typeof trackingData.facialExpressions === 'object' ? Object.keys(trackingData.facialExpressions).length : 0,
          sampleKeys: trackingData.facialExpressions ? Object.keys(trackingData.facialExpressions).slice(0, 3) : null,
          hasValues: trackingData.facialExpressions ? Object.values(trackingData.facialExpressions).some((v: any) => typeof v === 'number' && v > 0) : false
        } : null,
        headRotation: trackingData?.headRotation,
        avatarUrl
      });
    }, 3000); // Every 3 seconds
    
    return () => clearInterval(debugInterval);
  }, [trackingData, avatarUrl]);
  
  // Calculate camera position based on posture data
  const getCameraPosition = (): [number, number, number] => {
    if (!postureData) return [0, 1.2, 2.6];
    
    const { bodyOpenness = 50, shoulderAlignment = 0.5 } = postureData;
    
    // Base position
    let x = 0;
    let y = 1.2;
    let z = 2.6;
    
    // VERY subtle vertical orbit based on posture quality
    const postureQuality = (bodyOpenness + (shoulderAlignment * 100)) / 2; // 0-100
    const heightOffset = (postureQuality - 50) / 500; // -0.1 to +0.1 (very subtle)
    y = 1.2 + heightOffset; // 1.1 to 1.3 range (subtle)
    
    return [x, y, z];
  };
  
  const getControlsTarget = (): [number, number, number] => {
    if (!postureData) return [0, 1.6, 0];
    
    const { bodyOpenness = 50, shoulderAlignment = 0.5 } = postureData;
    const postureQuality = (bodyOpenness + (shoulderAlignment * 100)) / 2; // 0-100
    const targetOffset = (postureQuality - 50) / 1000; // -0.05 to +0.05 (very subtle)
    const targetY = 1.6 + targetOffset; // 1.55 to 1.65 range (subtle)
    
    return [0, targetY, 0];
  };
  
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
          position: getCameraPosition(),
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
          target={getControlsTarget()}
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
  size?: 'small' | 'medium' | 'large';
  position?: 'bottom-right' | 'top-left' | 'top-right' | 'bottom-left';
  className?: string;
  style?: React.CSSProperties;
  cameraStream?: MediaStream | null; // Allow null values
  enableOwnTracking?: boolean;
  trackingData?: any; // Face tracking data
  postureData?: {
    bodyOpenness?: number;
    confidenceScore?: number;
    shoulderAlignment?: number;
    leaning?: string;
  }; 
  onClose?: () => void;
  onTogglePiP?: () => void;
}

export const UserAvatarPiP: React.FC<UserAvatarPiPProps> = ({ 
  avatarUrl = "/avatars/user_avatar.glb",
  size = 'medium',
  position = 'bottom-right',
  style,
  className,
  enableOwnTracking = false,
  cameraStream,
  trackingData,
  postureData,
  onClose,
  onTogglePiP
}) => {
  console.log('[UserAvatarPiP] Component rendering with props:', { 
    avatarUrl, 
    position, 
    size, 
    hasTrackingData: !!trackingData,
    trackingData: trackingData,
    hasPostureData: !!postureData,
    postureData: postureData
  });
  
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
  const fallbackTrackingService = useRef<FallbackFaceTracking | null>(null);
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

  // Camera position for face framing - simple close-up portrait
  const cameraPosition: [number, number, number] = [0, 1.6, 1.8];
  const cameraTarget: [number, number, number] = [0, 1.6, 0];

  // Log state changes
  React.useEffect(() => {
    console.log('[UserAvatarPiP] 🎯 STATE UPDATE:', {
      isTracking,
      hasError: !!error,
      error: error,
      isMinimized,
      hasTrackingData: !!trackingDataState,
      trackingSource,
      enableOwnTracking,
      hasParentTrackingData: !!trackingData,
      hasCameraStream: !!cameraStream,
      trackingDataSample: trackingDataState?.facialExpressions ? {
        sampleExpression: Object.entries(trackingDataState.facialExpressions).find(([_, v]) => (v as number) > 0.1)
      } : null
    });
  }, [isTracking, error, isMinimized, trackingDataState, trackingSource, enableOwnTracking, trackingData, cameraStream]);

  useEffect(() => {
    // If trackingData is provided from parent, use that instead of camera tracking
    if (trackingData) {
      console.log('[UserAvatarPiP] Using trackingData from parent:', trackingData);
      
      // Ensure facialExpressions is in the correct format (object, not array)
      let processedTrackingData = trackingData;
      if (trackingData.facialExpressions && Array.isArray(trackingData.facialExpressions)) {
        console.log('[UserAvatarPiP] Converting array facialExpressions to object format');
        const facialExpressionsObj = trackingData.facialExpressions.reduce((obj: any, emotion: any) => {
          obj[emotion.name || emotion.emotion] = emotion.score;
          return obj;
        }, {});
        processedTrackingData = { ...trackingData, facialExpressions: facialExpressionsObj };
      }
      
      setTrackingData(processedTrackingData);
      setIsTracking(true);
      setTrackingSource('Parent');
      return; // Don't initialize camera tracking
    }

    // Only proceed with own tracking if enableOwnTracking is true
    if (!enableOwnTracking) {
      console.log('[UserAvatarPiP] enableOwnTracking=false, skipping camera tracking');
      return;
    }
    
    console.log('[UserAvatarPiP] Initializing own camera tracking with enableOwnTracking=true');
    
    const initializeTracking = async () => {
      try {
        console.log('[UserAvatarPiP] Starting tracking initialization...');
        
        // Check if ML5 is available
        if (typeof window.ml5 === 'undefined' || typeof window.ml5.facemesh !== 'function') {
          console.warn('[UserAvatarPiP] ML5 or facemesh not available, using fallback tracking:', {
            ml5Available: typeof window.ml5 !== 'undefined',
            facemeshAvailable: typeof window.ml5?.facemesh === 'function'
          });
          
          // Initialize fallback tracking
          if (!fallbackTrackingService.current) {
            console.log('[UserAvatarPiP] Creating fallback tracking service...');
            fallbackTrackingService.current = new FallbackFaceTracking();
          }
          
          await fallbackTrackingService.current.initialize();
          setTrackingSource('Fallback');
          console.log('[UserAvatarPiP] Fallback tracking initialized, starting...');
          
          // Start fallback tracking
          await fallbackTrackingService.current.startTracking();
          setIsTracking(true);
          setError('');
          
          // Update tracking data from fallback service
          intervalRef.current = setInterval(() => {
            if (fallbackTrackingService.current) {
              const expressions = fallbackTrackingService.current.getExpressions();
              const headRotation = fallbackTrackingService.current.getHeadRotation();
              
              const newTrackingData = {
                facialExpressions: expressions,
                headRotation: headRotation,
                posture: null,
                hands: null,
                landmarks: []
              };
              
              // Debug fallback tracking data
              if (Math.random() < 0.1) { // 10% of updates
                console.log('[UserAvatarPiP] 🤖 FALLBACK TRACKING DATA:', {
                  expressionKeys: expressions ? Object.keys(expressions) : null,
                  hasNonZeroExpressions: expressions ? Object.values(expressions).some(v => v > 0) : false,
                  sampleExpressions: expressions ? Object.entries(expressions).slice(0, 3).map(([k, v]) => `${k}:${v}`) : null,
                  headRotation: headRotation
                });
              }
              
              trackingDataRef.current = newTrackingData;
              setTrackingData(newTrackingData);
            }
          }, 100); // 10 FPS for fallback
          
          return; // Exit early with fallback tracking
        }
        
        // Initialize tracking service
        if (!trackingService.current) {
          console.log('[UserAvatarPiP] Creating new CombinedFaceTrackingService...');
          trackingService.current = new CombinedFaceTrackingService();
        }
        
        console.log('[UserAvatarPiP] Initializing tracking service...');
        await trackingService.current.initialize();
        console.log('[UserAvatarPiP] Tracking service initialized successfully');

        // Get camera stream
        console.log('[UserAvatarPiP] Getting camera stream...');
        let stream: MediaStream;
        if (cameraStream) {
          console.log('[UserAvatarPiP] Using provided cameraStream');
          stream = cameraStream;
        } else {
          console.log('[UserAvatarPiP] Requesting new camera stream...');
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user'
            } 
          });
        }
        
        streamRef.current = stream;
        console.log('[UserAvatarPiP] Camera stream obtained:', stream.getTracks().length, 'tracks');
        
        // Set up video element
        if (videoRef.current) {
          console.log('[UserAvatarPiP] Setting up video element...');
          videoRef.current.srcObject = stream;
          
          // Wait for video to be ready
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Video loading timeout'));
            }, 10000);
            
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => {
                console.log('[UserAvatarPiP] Video metadata loaded, starting playback...');
                clearTimeout(timeout);
                if (videoRef.current) {
                  videoRef.current.play().then(() => {
                    console.log('[UserAvatarPiP] Video playing successfully');
                    resolve();
                  }).catch(reject);
                }
              };
              videoRef.current.onerror = (e) => {
                clearTimeout(timeout);
                reject(new Error('Video loading error'));
              };
            }
          });
          
          console.log('[UserAvatarPiP] Video ready, starting tracking...');
          // Start tracking
          startTracking();
        }
      } catch (err: any) {
        console.error('[UserAvatarPiP] Failed to initialize tracking:', err);
        setError(`Failed to initialize tracking: ${err.message}`);
      }
    };

    initializeTracking();

    return () => {
      console.log('[UserAvatarPiP] Cleaning up tracking...');
      stopTracking();
      
      // Clean up tracking services
      if (trackingService.current) {
        trackingService.current.cleanup();
      }
      
      if (fallbackTrackingService.current) {
        fallbackTrackingService.current.cleanup();
      }
      
      // Only stop tracks if we created our own stream
      if (streamRef.current && !cameraStream) {
        streamRef.current.getTracks().forEach(track => {
          console.log('[UserAvatarPiP] Stopping track:', track.kind);
          track.stop();
        });
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
      
      console.log('[UserAvatarPiP] Starting ML5 face tracking...');
      setIsTracking(true);
      setError('');
      
      await trackingService.current.startTracking(videoRef.current);
      console.log('[UserAvatarPiP] Face tracking started successfully');
      
      // Update tracking data at 30 FPS (33ms intervals)
      intervalRef.current = setInterval(async () => {
        if (trackingService.current) {
          const expressions = trackingService.current.getExpressions();
          const headRotation = trackingService.current.getHeadRotation();
          const postureData = trackingService.current.getPostureData();
          const landmarks = trackingService.current.getLandmarks();
          
          // Log tracking data occasionally for debugging
          if (Math.random() < 0.02) { // 2% of frames
            console.log('[UserAvatarPiP] 🔬 ML5 TRACKING DATA:', {
              hasExpressions: !!expressions,
              expressionKeys: expressions ? Object.keys(expressions).length : 0,
              hasHeadRotation: !!headRotation,
              hasLandmarks: !!landmarks,
              sampleExpression: expressions ? expressions.mouthSmile || expressions.eyeBlink : null,
              nonZeroExpressions: expressions ? Object.entries(expressions).filter(([_, v]) => v > 0).length : 0,
              trackingServiceType: trackingService.current?.constructor?.name || 'unknown'
            });
          }
          
          const newTrackingData = {
            facialExpressions: expressions,
            headRotation: headRotation,
            posture: postureData,
            hands: null,
            landmarks: landmarks || []
          };
          
          // Update ref immediately for latest data
          trackingDataRef.current = newTrackingData;
          
          // Update state to trigger re-render
          setTrackingData(newTrackingData);
        }
      }, 33); // 30 FPS
      
    } catch (err: any) {
      console.error('[UserAvatarPiP] Tracking error:', err);
      setError(`Tracking error: ${err.message}`);
      setIsTracking(false);
    }
  };

  const stopTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
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
        trackingService.current.cleanup();
      }
      if (videoRef.current && videoRef.current.parentNode) {
        videoRef.current.parentNode.removeChild(videoRef.current);
      }
    };
  }, [enableOwnTracking, cameraStream]);

  // Camera controller component for dynamic pitch adjustment
  const CameraController: React.FC<{ postureData?: any }> = ({ postureData }) => {
    const { camera } = useThree();
    const frameCount = useRef(0);
    const lastPostureRef = useRef<any>(null);
    
    useFrame(() => {
      frameCount.current++;
      
      // Always log posture data status
      if (frameCount.current % 120 === 0) { // Every 2 seconds
        console.log('[PiP CameraController] PostureData received:', !!postureData, postureData);
      }
      
      if (postureData && (postureData.bodyOpenness !== undefined || postureData.shoulderAlignment !== undefined)) {
        const { bodyOpenness = 50, shoulderAlignment = 0.5 } = postureData;
        
        // Calculate pitch adjustment based on posture quality
        const postureQuality = Math.max(10, Math.min(90, (bodyOpenness + (shoulderAlignment * 100)) / 2));
        const pitchAdjustment = (postureQuality - 50) / 150; // Increased sensitivity: ±0.33 radians (±19 degrees)
        
        // Apply camera pitch rotation
        camera.rotation.x = pitchAdjustment;
        camera.updateProjectionMatrix();
        
        // Only log when posture changes
        if (JSON.stringify(postureData) !== JSON.stringify(lastPostureRef.current)) {
          console.log('[PiP Camera] ACTIVE - Posture Quality:', postureQuality.toFixed(1), 
                     'Pitch:', (pitchAdjustment * 180 / Math.PI).toFixed(1), '°', 
                     'BodyOpenness:', bodyOpenness, 'ShoulderAlignment:', shoulderAlignment);
          lastPostureRef.current = postureData;
        }
      } else {
        // Log when no posture data
        if (frameCount.current % 120 === 0) {
          console.log('[PiP Camera] NO POSTURE DATA - Camera static');
        }
      }
    });
    
    return null;
  };

  return (
    <div 
      className={`user-avatar-pip ${position} ${getSizeClass()} ${isMinimized ? 'minimized' : ''}`}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        ...style
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
                position: cameraPosition, 
                fov: 38, // Matches AnimatedAvatarDemo for optimal face framing
                near: 0.01,
                far: 100
              }}
              gl={{ 
                antialias: true, 
                alpha: true,
                powerPreference: 'high-performance'
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
                  trackingData={(() => {
                    const data = trackingData || trackingDataRef.current;
                    console.log('[UserAvatarPiP] Passing tracking data to PresenceAvatar:', data);
                    return data;
                  })()}
                  position={[0, -0.8, 0]} // Move avatar down to show head/shoulders
                  scale={1.8} // Larger scale to fill the canvas
                />
              </Suspense>
              
              <OrbitControls 
                enablePan={false}
                enableZoom={false}
                enableRotate={false}
                target={cameraTarget} // Adjusted target for better framing
              />
              <CameraController postureData={postureData} />
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
