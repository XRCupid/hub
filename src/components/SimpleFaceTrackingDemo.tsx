import React, { useEffect, useRef, useState } from 'react';
import { CombinedFaceTrackingService } from '../services/CombinedFaceTrackingService';
import './FacePuppetingDemo.css';

const trackingService = new CombinedFaceTrackingService();

export const SimpleFaceTrackingDemo: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [expressions, setExpressions] = useState<any>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const animationFrameRef = useRef<number>();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('Initializing tracking service...');
    trackingService.initialize().then(() => {
      console.log('Tracking service initialized');
      setIsInitialized(true);
      // Auto-start camera after initialization
      startWebcam();
    }).catch(err => {
      console.error('Failed to initialize tracking:', err);
      setCameraError('Failed to initialize tracking service');
    });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      trackingService.stopTracking();
    };
  }, []);

  const startWebcam = async () => {
    setCameraError('');
    console.log('Requesting camera access...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640,
          height: 480,
          facingMode: 'user'
        } 
      });
      
      console.log('Camera access granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Video ready, starting tracking...');
          
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              trackingService.startTracking(videoRef.current!);
              setIsTracking(true);
              
              // Start update loop
              const updateTracking = () => {
                const currentExpressions = trackingService.getExpressions();
                setExpressions(currentExpressions);
                animationFrameRef.current = requestAnimationFrame(updateTracking);
              };
              updateTracking();
            });
          }
        };
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      setCameraError(`Camera access failed: ${error.message || 'Unknown error'}`);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    trackingService.stopTracking();
    setIsTracking(false);
    setExpressions(null);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  return (
    <div className="face-puppeting-demo">
      <div className="controls">
        <h2>Simple Face Tracking Test</h2>
        <p>Testing ML5 FaceMesh tracking without avatar rendering</p>
        
        <button onClick={isTracking ? stopWebcam : startWebcam}>
          {isTracking ? 'Stop Camera' : 'Start Camera'}
        </button>
        
        {cameraError && (
          <p className="error" style={{ color: 'red' }}>{cameraError}</p>
        )}
        
        <p className="status">
          Camera: {isTracking ? '🟢 Active' : '⚪ Inactive'}
        </p>
      </div>
      
      <div className="demo-container">
        <div className="video-section" style={{ flex: '0 0 640px' }}>
          <h3>Your Camera Feed</h3>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            width="640"
            height="480"
            style={{ 
              display: 'block',
              width: '100%',
              height: 'auto',
              background: '#000' 
            }}
          />
        </div>
        
        {expressions && (
          <div className="expression-section" style={{ flex: 1, padding: '20px' }}>
            <h3>Detected Expressions</h3>
            <div className="expression-grid">
              {Object.entries(expressions).map(([key, value]) => (
                <div key={key} className="expression-item">
                  <span className="expression-name">{key}:</span>
                  <div className="expression-bar">
                    <div 
                      className="expression-fill" 
                      style={{ width: `${(value as number) * 100}%` }}
                    />
                  </div>
                  <span className="expression-value">{(value as number).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
