import React, { useState, useRef, useEffect, useCallback } from 'react';
import './FacePuppetingDemo.css';
import { CombinedFaceTrackingService } from '../services/CombinedFaceTrackingService';
import { Canvas } from '@react-three/fiber';
import { PresenceAvatar } from './PresenceAvatar';
import { TrackingData } from '../types/tracking';

export const FacePuppetingDemo: React.FC = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData | undefined>(undefined);
  const [error, setError] = useState<string>('');
  const [isHumeAvailable, setIsHumeAvailable] = useState(true);
  const [trackingSource, setTrackingSource] = useState<'ML5' | 'ML5 + Hume'>('ML5');
  const [cameraReady, setCameraReady] = useState(false);
  const [status, setStatus] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const trackingService = useRef<CombinedFaceTrackingService | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Setup avatar camera position for proper face framing
  const cameraPosition: [number, number, number] = [0, 1.6, 2];
  const cameraTarget: [number, number, number] = [0, 1.5, 0];

  useEffect(() => {
    const initializeServices = async () => {
      try {
        setStatus('Initializing tracking services...');
        
        // Initialize the combined service first
        trackingService.current = CombinedFaceTrackingService.getInstance();
        await trackingService.current.initialize();
        setStatus('Tracking services initialized');
        
        // Set up camera with better error handling
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
              video: { 
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
              } 
            });
            
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              
              // Wait for metadata to be loaded before playing
              videoRef.current.onloadedmetadata = () => {
                if (videoRef.current) {
                  videoRef.current.play()
                    .then(() => {
                      setCameraReady(true);
                      setStatus('Camera ready');
                    })
                    .catch(err => {
                      console.error('Error playing video:', err);
                      setError('Failed to start video playback');
                    });
                }
              };
            }
          } catch (err) {
            console.error('Camera error:', err);
            setError('Camera access denied or unavailable');
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to initialize tracking services');
      }
    };
    
    initializeServices();
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      if (trackingService.current) {
        trackingService.current.stopTracking();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startTracking = async () => {
    if (!cameraReady || !videoRef.current) {
      setError('Camera not ready');
      return;
    }
    
    try {
      setIsTracking(true);
      setError('');
      setStatus('Starting tracking...');
      
      // Start tracking with the video element
      if (trackingService.current) {
        await trackingService.current.startTracking(videoRef.current);
      }
      setStatus('Tracking active');
      
      // Start updating tracking data
      const updateInterval = setInterval(() => {
        if (trackingService.current) {
          const expressions = trackingService.current.getExpressions();
          
          // Debug log all active expressions
          const activeExpressions = Object.entries(expressions)
            .filter(([_, value]) => (value ?? 0) > 0.01)
            .map(([key, value]) => `${key}: ${(value ?? 0).toFixed(2)}`);
          
          if (activeExpressions.length > 0) {
            console.log('[FacePuppeting] Active expressions:', activeExpressions.join(', '));
          }
          
          // Also log any expressions that are non-zero but below threshold
          const lowExpressions = Object.entries(expressions)
            .filter(([_, value]) => (value ?? 0) > 0 && (value ?? 0) <= 0.01)
            .map(([key, value]) => `${key}: ${(value ?? 0).toFixed(3)}`);
          
          if (lowExpressions.length > 0) {
            console.log('[FacePuppeting] Low expressions (below threshold):', lowExpressions.join(', '));
          }
          
          if (expressions) {
            const data: TrackingData = {
              facialExpressions: expressions,
              posture: null,
              hands: null
            };
            setTrackingData(data);
            
            // Update tracking source based on what's available
            if (expressions && Object.keys(expressions).some(key => 
              ['joy', 'anger', 'surprise', 'fear', 'disgust', 'sadness'].includes(key)
            )) {
              setTrackingSource('ML5 + Hume');
            } else {
              setTrackingSource('ML5');
              // Check if Hume error occurred
              if (!isHumeAvailable) {
                setIsHumeAvailable(false);
              }
            }
          }
        }
      }, 100);
      
      intervalRef.current = updateInterval;
    } catch (err) {
      console.error('Tracking error:', err);
      setError('Failed to start tracking');
      setIsTracking(false);
    }
  };

  const stopTracking = () => {
    if (trackingService.current) {
      trackingService.current.stopTracking();
    }
    setIsTracking(false);
    setTrackingData(undefined);
  };

  const formatExpression = (value: number): string => {
    return (value * 100).toFixed(1) + '%';
  };

  return (
    <div className="face-puppeting-demo">
      <div className="controls">
        <h2>Face Puppeting Demo</h2>
        <p>This demo shows real-time face tracking mapped to your avatar</p>
        
        {error && <div className="error">{error}</div>}
        
        <div className="status">
          Status: {isTracking ? 'Tracking Active' : 'Not Tracking'}
          {!isHumeAvailable && ' (Hume unavailable - ML5 only)'}
          {status && <span> - {status}</span>}
        </div>
        
        <button 
          onClick={startTracking} 
          disabled={isTracking}
        >
          Start Tracking
        </button>
        <button 
          onClick={stopTracking} 
          disabled={!isTracking}
        >
          Stop Tracking
        </button>
      </div>

      <div className="demo-container">
        <div className="video-section">
          <h3>Your Camera</h3>
          <video 
            ref={videoRef} 
            playsInline 
            muted
            style={{ display: 'block', width: '100%', height: '480px', objectFit: 'cover' }}
          />
        </div>

        <div className="avatar-section">
          <h3>Your Avatar</h3>
          {trackingSource && isTracking && (
            <div className="tracking-source">Source: {trackingSource}</div>
          )}
          <div className="avatar-canvas">
            <Canvas
              camera={{ 
                position: cameraPosition, 
                fov: 50,
                near: 0.1,
                far: 1000
              }}
              style={{ background: '#f0f0f0' }}
              onCreated={({ camera }) => {
                camera.lookAt(...cameraTarget);
              }}
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 5, 5]} intensity={0.5} />
              <PresenceAvatar 
                trackingData={trackingData}
                position={[0, -1, 0]}
                scale={1}
                avatarUrl="/avatars/coach_grace.glb"
              />
            </Canvas>
          </div>
          
          {trackingData?.facialExpressions && (
            <div className="expression-debug">
              {Object.entries(trackingData.facialExpressions).map(([key, value]) => (
                <div key={key} className="expression-item">
                  <span className="expression-name">{key}:</span>
                  <div className="expression-bar">
                    <div 
                      className="expression-fill" 
                      style={{ width: `${(value || 0) * 100}%` }}
                    />
                  </div>
                  <span className="expression-value">
                    {formatExpression(value || 0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
