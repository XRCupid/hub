import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { PresenceAvatar } from './PresenceAvatar';
import { StandardizedFaceTracking, StandardizedTrackingData } from '../services/StandardizedFaceTracking';
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
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Retry
          </button>
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
            position={[0, -0.5, 0]} 
            scale={1.5} 
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
  // Camera control props
  cameraPosition?: [number, number, number];
  cameraFOV?: number;
  cameraTarget?: [number, number, number];
  disableAutoCamera?: boolean; // Disable automatic camera control for manual mode
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
  onTogglePiP,
  cameraPosition = [0, 1.6, 1.8],
  cameraFOV = 38,
  cameraTarget = [0, 1.6, 0],
  disableAutoCamera = false
}) => {
  console.log('[UserAvatarPiP] Component rendering with props:', { 
    avatarUrl, 
    position, 
    size, 
    hasTrackingData: !!trackingData,
    trackingData: trackingData,
    hasPostureData: !!postureData,
    postureData: postureData,
    cameraPosition,
    cameraFOV,
    cameraTarget,
    disableAutoCamera
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
  const trackingService = useRef<StandardizedFaceTracking | null>(null);
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
    console.log('[UserAvatarPiP] 🎯 STATE UPDATE:', {
      isTracking,
      error,
      isMinimized,
      hasTrackingData: !!trackingData,
      hasParentTrackingData: !!trackingData,
      hasCameraStream: !!cameraStream,
      trackingSource,
      enableOwnTracking,
    });

    // Use parent tracking data if available
    if (trackingData) {
      console.log('[UserAvatarPiP] Using parent trackingData:', trackingData);
      
      // Convert array format to object format if needed
      let processedTrackingData = trackingData;
      if (trackingData.facialExpressions && Array.isArray(trackingData.facialExpressions)) {
        const facialExpressionsObj = trackingData.facialExpressions.reduce((obj: Record<string, number>, emotion: any) => {
          obj[emotion.name] = emotion.score;
          return obj;
        }, {});
        
        processedTrackingData = {
          ...trackingData,
          facialExpressions: facialExpressionsObj
        };
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
        
        // Initialize tracking service
        if (!trackingService.current) {
          console.log('[UserAvatarPiP] Creating new StandardizedFaceTracking service...');
          trackingService.current = new StandardizedFaceTracking('UserAvatarPiP', {
            enableML5: true,
            enableFallback: true,
            debugLogging: true
          });
        }
        
        console.log('[UserAvatarPiP] Initializing tracking service...');
        await trackingService.current.initialize();
        
        console.log('[UserAvatarPiP] Starting tracking service...');
        await trackingService.current.startTracking((data: StandardizedTrackingData) => {
          // Convert standardized data to component format
          const convertedData = {
            facialExpressions: data.facialExpressions,
            headRotation: data.headRotation,
            posture: null,
            hands: null,
            landmarks: []
          };
          
          trackingDataRef.current = convertedData;
          setTrackingData(convertedData);
          
          // Debug tracking data occasionally
          if (Math.random() < 0.02) { // 2% of updates
            console.log('[UserAvatarPiP] 🔬 STANDARDIZED TRACKING DATA:', {
              hasExpressions: !!data.facialExpressions,
              expressionKeys: Object.keys(data.facialExpressions).length,
              confidence: data.confidence,
              timestamp: data.timestamp,
              nonZeroExpressions: Object.entries(data.facialExpressions).filter(([_, v]) => v > 0).length
            });
          }
        });
        
        setIsTracking(true);
        setError('');
        setTrackingSource('Standardized');
        console.log('[UserAvatarPiP] Face tracking started successfully');
        
      } catch (error) {
        console.error('[UserAvatarPiP] Face tracking initialization failed:', error);
        setError(`Failed to initialize face tracking: ${error}`);
        setIsTracking(false);
      }
    };

    initializeTracking();
    
    // Cleanup function
    return () => {
      console.log('[UserAvatarPiP] Cleaning up tracking resources...');
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (trackingService.current) {
        trackingService.current.cleanup();
      }
      
      setIsTracking(false);
      setTrackingData({
        facialExpressions: null,
        headRotation: null,
        posture: null,
        hands: null,
        landmarks: []
      });
    };
  }, [trackingData, enableOwnTracking, cameraStream]);

  useEffect(() => {
    if (!enableOwnTracking || !cameraStream) return;

    const initializeWithStream = async () => {
      try {
        console.log('[UserAvatarPiP] Initializing with provided camera stream...');
        
        // Store the provided stream
        streamRef.current = cameraStream;
        
        // Initialize tracking service
        trackingService.current = new StandardizedFaceTracking('UserAvatarPiP-Stream', {
          enableML5: true,
          enableFallback: true,
          debugLogging: true
        });
        await trackingService.current.initialize();
        console.log('[UserAvatarPiP] Tracking service initialized');
        setIsTracking(true);
        setTrackingSource('Standardized');
        
        // Start tracking with callback
        await trackingService.current.startTracking((data: StandardizedTrackingData) => {
          const convertedData = {
            facialExpressions: data.facialExpressions,
            headRotation: data.headRotation,
            posture: null,
            hands: null,
            landmarks: []
          };
          
          trackingDataRef.current = convertedData;
          setTrackingData(convertedData);
          
          // Debug tracking data occasionally
          if (Math.random() < 0.02) { // 2% of updates
            console.log('[UserAvatarPiP] 🔬 STREAM TRACKING DATA:', {
              hasExpressions: !!data.facialExpressions,
              expressionKeys: Object.keys(data.facialExpressions).length,
              confidence: data.confidence
            });
          }
        });
        
      } catch (error) {
        console.error('[UserAvatarPiP] Stream tracking initialization failed:', error);
        setError(`Stream tracking failed: ${error}`);
      }
    };

    initializeWithStream();
  }, [enableOwnTracking, cameraStream]);

  // Utility functions
  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'pip-small';
      case 'large': return 'pip-large';
      default: return 'pip-medium';
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

  // Debug logging for camera props
  React.useEffect(() => {
    console.log('[UserAvatarPiP] 🔍 Camera props changed:', {
      position: cameraPosition,
      fov: cameraFOV,
      target: cameraTarget,
      disableAutoCamera,
      hasPostureData: !!postureData
    });
    
    if (postureData) {
      console.log('[UserAvatarPiP] 📊 Posture data received:', postureData);
    }
  }, [cameraPosition, cameraFOV, cameraTarget, disableAutoCamera, postureData]);

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
        const pitchAdjustment = (postureQuality - 50) / 50; // Increased sensitivity: ±1.8 radians (±103 degrees) for testing
        
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

  // Manual Camera Controller component
  const ManualCameraController: React.FC<{ 
    position: [number, number, number]; 
    fov: number; 
    target: [number, number, number] 
  }> = ({ position, fov, target }) => {
    const { camera } = useThree();
    
    React.useEffect(() => {
      if (camera) {
        console.log('[ManualCameraController] Setting camera position:', position, 'fov:', fov);
        camera.position.set(position[0], position[1], position[2]);
        if ('fov' in camera) {
          (camera as any).fov = fov;
          camera.updateProjectionMatrix();
        }
      }
    }, [camera, position, fov]);
    
    return null;
  };

  // Hybrid Camera Controller - Manual position + Posture pitch
  const HybridCameraController: React.FC<{ 
    position: [number, number, number]; 
    fov: number; 
    target: [number, number, number];
    postureData?: any;
  }> = ({ position, fov, target, postureData }) => {
    const { camera } = useThree();
    const frameCount = useRef(0);
    const lastPostureRef = useRef<any>(null);
    
    // Set manual position and FOV
    React.useEffect(() => {
      if (camera) {
        console.log('[HybridCameraController] Setting base camera position:', position, 'fov:', fov);
        camera.position.set(position[0], position[1], position[2]);
        if ('fov' in camera) {
          (camera as any).fov = fov;
          camera.updateProjectionMatrix();
        }
      }
    }, [camera, position, fov]);
    
    // Apply posture-based pitch adjustment
    useFrame(() => {
      if (!camera) return;
      
      frameCount.current++;
      
      // Always log posture data status
      if (frameCount.current % 120 === 0) { // Every 2 seconds
        console.log('[PiP HybridCameraController] PostureData received:', !!postureData, postureData);
      }
      
      if (postureData && (postureData.bodyOpenness !== undefined || postureData.shoulderAlignment !== undefined)) {
        const { bodyOpenness = 50, shoulderAlignment = 0.5 } = postureData;
        
        // Calculate pitch adjustment based on posture quality
        const postureQuality = Math.max(10, Math.min(90, (bodyOpenness + (shoulderAlignment * 100)) / 2));
        const pitchAdjustment = (50 - postureQuality) / 50; // Reduced sensitivity: ±1.8 radians (±103 degrees) for testing
        
        // Apply camera pitch rotation
        camera.rotation.x = pitchAdjustment;
        camera.updateProjectionMatrix();
        
        // Only log when posture changes
        if (JSON.stringify(postureData) !== JSON.stringify(lastPostureRef.current)) {
          console.log('[PiP Hybrid Camera] 🎯 ACTIVE - Posture Quality:', postureQuality.toFixed(1), 
                     'Pitch:', (pitchAdjustment * 180 / Math.PI).toFixed(1), '°', 
                     'BodyOpenness:', bodyOpenness, 'ShoulderAlignment:', shoulderAlignment);
          lastPostureRef.current = postureData;
        }
      } else {
        // Reset pitch when no posture data
        if (camera.rotation.x !== 0) {
          camera.rotation.x = 0;
          camera.updateProjectionMatrix();
        }
        // Log when no posture data
        if (frameCount.current % 120 === 0) {
          console.log('[PiP Hybrid Camera] NO POSTURE DATA - Camera pitch reset to 0');
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
                fov: cameraFOV,
                near: 0.1,
                far: 1000
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
              <directionalLight position={[5, 5, 5]} intensity={0.8} />
              <directionalLight position={[-5, -5, -5]} intensity={0.4} />
              
              <group 
                rotation={[
                  0,
                  0, // Y-axis (no left/right rotation)  
                  0  // Z-axis (no roll)
                ]}
                position={[0, 0, 0]} 
              >
                <PresenceAvatar
                  avatarUrl={avatarUrl}
                  trackingData={(() => {
                    const data = trackingData || trackingDataRef.current;
                    console.log('[UserAvatarPiP] Passing tracking data to PresenceAvatar:', data);
                    return data;
                  })()}
                  position={[0, -0.5, 0]} 
                  scale={1.5} 
                />
              </group>
              
              <OrbitControls 
                enablePan={false}
                enableZoom={false}
                enableRotate={false}
                target={cameraTarget} // Adjusted target for better framing
              />
              {disableAutoCamera ? <ManualCameraController position={cameraPosition} fov={cameraFOV} target={cameraTarget} /> : <HybridCameraController position={cameraPosition} fov={cameraFOV} target={cameraTarget} postureData={postureData} />}
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

export default UserAvatarPiP;
