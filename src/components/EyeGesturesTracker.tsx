import React, { useEffect, useState, useRef } from 'react';

interface EyeGesturesTrackerProps {
  onGazeChange?: (gazeData: { x: number; y: number; looking: boolean }) => void;
  showVideo?: boolean;
}

declare global {
  interface Window {
    EyeGestures: any;
  }
}

export const EyeGesturesTracker: React.FC<EyeGesturesTrackerProps> = ({
  onGazeChange,
  showVideo = true
}) => {
  const [isReady, setIsReady] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [gazePosition, setGazePosition] = useState({ x: 0, y: 0 });
  const [isLooking, setIsLooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engagementHistory, setEngagementHistory] = useState<boolean[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const eyeGesturesRef = useRef<any>(null);

  useEffect(() => {
    const initEyeGestures = async () => {
      // Wait a bit for the library to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!window.EyeGestures) {
        console.error('[EyeGesturesTracker] EyeGestures not found on window');
        setError('EyeGestures library not loaded - please check console');
        return;
      }

      try {
        console.log('[EyeGesturesTracker] Initializing with EyeGestures:', window.EyeGestures);
        
        // Create or get video element
        let video = document.getElementById('eyegestures-video') as HTMLVideoElement;
        if (!video) {
          video = document.createElement('video');
          video.id = 'eyegestures-video';
          video.style.display = 'none';
          video.style.position = 'absolute';
          video.style.width = '1px';
          video.style.height = '1px';
          document.body.appendChild(video);
          console.log('[EyeGesturesTracker] Created hidden video element');
        }

        // Initialize with simplified approach
        const eyeGestures = window.EyeGestures;
        console.log('[EyeGesturesTracker] Attempting to start eye tracking...');
        
        // Try the documented initialization pattern
        eyeGestures.setOnGaze((gazeX: number | null, gazeY: number | null) => {
          const looking = gazeX !== null && gazeY !== null;
          setGazePosition({ x: gazeX || 0, y: gazeY || 0 });
          setIsLooking(looking);
          
          // Update engagement history
          setEngagementHistory(prev => {
            const newHistory = [...prev.slice(-299), looking];
            return newHistory;
          });
          
          if (onGazeChange) {
            onGazeChange({ 
              x: gazeX || 0, 
              y: gazeY || 0, 
              looking 
            });
          }
        });
        
        // Start tracking
        await eyeGestures.start();
        eyeGesturesRef.current = eyeGestures;
        console.log('[EyeGesturesTracker] Started successfully');
        setIsReady(true);
        
      } catch (err: any) {
        console.error('[EyeGesturesTracker] Error:', err);
        setError(`Failed to initialize: ${err.message || 'Unknown error'}`);
      }
    };

    initEyeGestures();

    return () => {
      if (eyeGesturesRef.current) {
        try {
          eyeGesturesRef.current.stop();
        } catch (err) {
          console.error('[EyeGesturesTracker] Error stopping:', err);
        }
      }
      
      // Clean up video element
      const video = document.getElementById('eyegestures-video');
      if (video) {
        video.remove();
      }
    };
  }, [onGazeChange]);

  const startCalibration = () => {
    if (eyeGesturesRef.current) {
      setIsCalibrating(true);
      setCalibrationProgress(0);
      eyeGesturesRef.current.calibrate();
    }
  };

  const engagementPercentage = React.useMemo(() => {
    if (engagementHistory.length === 0) return 0;
    const recentHistory = engagementHistory.slice(-30);
    const looking = recentHistory.filter(h => h).length;
    return Math.round((looking / recentHistory.length) * 100);
  }, [engagementHistory]);

  if (error) {
    return (
      <div style={{ 
        padding: '10px', 
        background: '#ff4444', 
        borderRadius: '4px',
        color: 'white'
      }}>
        <strong>Eye Tracking Error:</strong> {error}
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px',
      color: 'white'
    }}>
      <h3 style={{ marginTop: 0 }}>Eye Tracking (EyeGestures)</h3>
      
      {showVideo && (
        <div style={{ marginBottom: '20px' }}>
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ 
              width: '320px',
              height: '240px',
              borderRadius: '8px',
              display: showVideo ? 'block' : 'none',
              backgroundColor: '#000'
            }}
          />
        </div>
      )}

      {!isReady && !isCalibrating && (
        <div>
          <p>Eye tracking requires calibration</p>
          <button 
            onClick={startCalibration}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Start Calibration
          </button>
        </div>
      )}

      {isCalibrating && (
        <div>
          <p>Follow the dots on screen...</p>
          <div style={{
            width: '100%',
            height: '20px',
            backgroundColor: '#333',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '10px'
          }}>
            <div style={{
              width: `${calibrationProgress}%`,
              height: '100%',
              backgroundColor: '#4CAF50',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <p>{calibrationProgress}% complete</p>
        </div>
      )}

      {isReady && (
        <div>
          <div style={{
            fontSize: '18px',
            marginBottom: '10px',
            color: isLooking ? '#4CAF50' : '#f44336'
          }}>
            {isLooking ? '👀 Tracking Gaze' : '❌ No Gaze Detected'}
          </div>
          
          {isLooking && (
            <div style={{ marginBottom: '15px' }}>
              <small>Gaze Position: ({Math.round(gazePosition.x)}, {Math.round(gazePosition.y)})</small>
            </div>
          )}
          
          <div>
            <div style={{ marginBottom: '5px' }}>Engagement: {engagementPercentage}%</div>
            <div style={{
              width: '100%',
              height: '20px',
              backgroundColor: '#333',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${engagementPercentage}%`,
                height: '100%',
                backgroundColor: engagementPercentage > 70 ? '#4CAF50' : engagementPercentage > 40 ? '#ff9800' : '#f44336',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          <button 
            onClick={startCalibration}
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Recalibrate
          </button>
        </div>
      )}
      
      <div style={{ 
        marginTop: '15px', 
        padding: '10px', 
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <img 
          src="https://eyegestures.com/logo.png" 
          alt="EyeGestures" 
          style={{ height: '20px', marginBottom: '5px' }}
        />
        <p style={{ margin: 0 }}>Powered by EyeGestures - Free eye tracking</p>
      </div>
    </div>
  );
};
