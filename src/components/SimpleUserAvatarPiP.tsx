import React, { useEffect, useRef, useState, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import { PresenceAvatar } from './PresenceAvatar';
import { CombinedFaceTrackingService } from '../services/CombinedFaceTrackingService';
import './UserAvatarPiP.css';

// Simple error boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Canvas error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h3>Rendering Error</h3>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Separate Canvas component to prevent re-renders
const AvatarCanvas = memo(({ 
  avatarUrl, 
  trackingData 
}: { 
  avatarUrl: string; 
  trackingData: any;
}) => {
  console.log('[AvatarCanvas] Rendering');
  
  return (
    <Canvas 
      camera={{ 
        position: [0, 1.5, 2.0],
        fov: 28,
        near: 0.1,
        far: 100
      }}
      style={{ width: '100%', height: '100%' }}
      gl={{ preserveDrawingBuffer: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[0, 10, 5]} intensity={0.8} />
      <directionalLight position={[0, 5, 10]} intensity={0.5} />
      
      <Suspense fallback={null}>
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
  );
});

interface SimpleUserAvatarPiPProps {
  avatarUrl?: string;
  onClose?: () => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'small' | 'medium' | 'large';
}

export const SimpleUserAvatarPiP: React.FC<SimpleUserAvatarPiPProps> = ({ 
  avatarUrl = '/avatars/coach_grace.glb',
  onClose,
  position = 'bottom-right',
  size = 'medium'
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [error, setError] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackingService = useRef<CombinedFaceTrackingService | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initializeTracking = async () => {
      try {
        // Initialize tracking service
        if (!trackingService.current) {
          trackingService.current = new CombinedFaceTrackingService();
          await trackingService.current.initialize();
        }
        
        // Set up camera
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error('Failed to initialize:', err);
        setError('Failed to access camera');
      }
    };

    initializeTracking();

    return () => {
      stopTracking();
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startTracking = async () => {
    if (!trackingService.current || !videoRef.current) return;
    
    setIsTracking(true);
    setError('');
    
    try {
      await trackingService.current.startTracking(videoRef.current);
      
      // Update tracking data at 30fps
      intervalRef.current = setInterval(() => {
        if (trackingService.current) {
          const expressions = trackingService.current.getExpressions();
          const headRotation = trackingService.current.getHeadRotation();
          const landmarks = trackingService.current.getLandmarks();
          
          setTrackingData({
            facialExpressions: expressions,
            headRotation: headRotation,
            posture: null,
            hands: null,
            landmarks: landmarks || []
          });
        }
      }, 33); // ~30fps
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
            <div className="pip-content" key="avatar-canvas-container">
              <ErrorBoundary>
                <AvatarCanvas 
                  avatarUrl={avatarUrl}
                  trackingData={trackingData}
                />
              </ErrorBoundary>
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
        
        {trackingData?.facialExpressions && !error && (
          <div className="expression-debug">
            <div className="expression-mini">
              {isTracking && <div style={{color: 'lime', fontSize: '10px'}}>● TRACKING</div>}
              {Object.entries(trackingData.facialExpressions)
                .filter(([_, value]) => (value as number) > 0.2)
                .slice(0, 3)
                .map(([name, value]) => (
                  <div key={name} style={{ fontSize: '10px' }}>
                    {name}: {((value as number) * 100).toFixed(0)}%
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
