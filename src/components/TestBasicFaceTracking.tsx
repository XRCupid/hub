import React, { useState, useEffect, useRef } from 'react';
import { CombinedFaceTrackingService } from '../services/CombinedFaceTrackingService';

const TestBasicFaceTracking: React.FC = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackingService = useRef<CombinedFaceTrackingService | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startTracking = async () => {
    try {
      console.log('Starting face tracking test...');
      
      // Get camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' } 
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      // Initialize tracking
      trackingService.current = new CombinedFaceTrackingService();
      await trackingService.current.initialize();
      
      // Start tracking
      if (videoRef.current) {
        await trackingService.current.startTracking(videoRef.current);
      }
      
      // Set up interval to get expressions
      const interval = setInterval(() => {
        if (trackingService.current) {
          const expressions = trackingService.current.getExpressions();
          if (expressions) {
            setTrackingData(expressions);
            console.log('Tracking data:', expressions);
          }
        }
      }, 100);
      
      setIsTracking(true);
      
      // Store interval for cleanup
      (window as any).trackingInterval = interval;
      
    } catch (err) {
      console.error('Tracking error:', err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (trackingService.current) {
      trackingService.current.cleanup();
    }
    clearInterval((window as any).trackingInterval);
  };

  useEffect(() => {
    return () => stopTracking();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#1a1a1a', color: 'white', minHeight: '100vh' }}>
      <h1>Basic Face Tracking Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={isTracking ? stopTracking : startTracking}
          style={{
            padding: '12px 24px',
            backgroundColor: isTracking ? '#f44336' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: '#f44336', padding: '10px', borderRadius: '5px', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div>
          <h3>Camera Feed</h3>
          <video 
            ref={videoRef} 
            style={{ width: '320px', height: '240px', backgroundColor: '#000' }}
            playsInline
            muted
          />
        </div>
        
        <div style={{ flex: 1 }}>
          <h3>Tracking Data</h3>
          <div style={{ backgroundColor: '#2a2a2a', padding: '10px', borderRadius: '5px', height: '240px', overflow: 'auto' }}>
            {trackingData ? (
              <pre style={{ margin: 0, fontSize: '12px' }}>
                {JSON.stringify(trackingData, null, 2)}
              </pre>
            ) : (
              <p>No tracking data yet...</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#333', padding: '20px', borderRadius: '10px' }}>
        <h3>What should happen:</h3>
        <ol>
          <li>Click "Start Tracking"</li>
          <li>Allow camera access</li>
          <li>You should see your video feed</li>
          <li>The tracking data should update in real-time with facial expressions</li>
          <li>Look for values changing for: mouthSmile, mouthOpen, eyeWideLeft, etc.</li>
        </ol>
      </div>
    </div>
  );
};

export default TestBasicFaceTracking;
