import React, { useEffect, useState, useRef } from 'react';
import { ML5EyeTracker } from '../components/ML5EyeTracker';
import { ML5FaceMeshService } from '../services/ML5FaceMeshService';

const ML5EyeTrackerTestPage: React.FC = () => {
  const [ml5Service] = useState(() => new ML5FaceMeshService());
  const [isInitialized, setIsInitialized] = useState(false);
  const [gazeData, setGazeData] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Get camera stream
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user'
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          
          // Initialize ML5
          await ml5Service.initialize();
          await ml5Service.startTracking(videoRef.current);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    };

    init();

    return () => {
      ml5Service.stopTracking();
    };
  }, [ml5Service]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0a0a0a', 
      padding: '40px',
      fontFamily: 'Arial, sans-serif',
      color: 'white'
    }}>
      <h1>ML5-Based Eye Tracker Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p>This uses your existing ML5 face tracking to estimate gaze direction.</p>
        <p>Status: {isInitialized ? '✅ ML5 Initialized' : '⏳ Initializing ML5...'}</p>
      </div>

      <video 
        ref={videoRef}
        style={{ 
          width: '320px', 
          height: '240px', 
          background: '#000',
          marginBottom: '20px'
        }}
        autoPlay
        playsInline
        muted
      />

      {isInitialized && (
        <ML5EyeTracker 
          ml5Service={ml5Service}
          showDebug={true}
          onGazeUpdate={(gaze) => setGazeData(gaze)}
        />
      )}

      {gazeData && (
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          background: '#333', 
          borderRadius: '8px' 
        }}>
          <h3>Gaze Data:</h3>
          <pre>{JSON.stringify(gazeData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default ML5EyeTrackerTestPage;
