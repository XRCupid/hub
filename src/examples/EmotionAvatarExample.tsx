import React, { useState, useEffect, useCallback } from 'react';
import EmotionDrivenAvatar from '../components/EmotionDrivenAvatar';
import { getCameraStream, setupFrameCapture } from '../utils/videoUtils';

const HUME_API_KEY = process.env.REACT_APP_HUME_API_KEY || '';
const DEFAULT_AVATAR_URL = '/models/bro.glb'; // Using bro.glb for proper animation support

interface Emotion {
  name: string;
  score: number;
}

export const EmotionAvatarExample: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral');
  const [emotionScore, setEmotionScore] = useState<number>(0);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const sendVideoFrameRef = React.useRef<((blob: Blob) => void) | null>(null);

  // Initialize camera
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cleanup: (() => void) | null = null;

    const initCamera = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get camera stream
        stream = await getCameraStream();
        setCameraStream(stream);
        
        // Set up video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          
          // Start frame capture when video is ready
          cleanup = setupFrameCapture(
            videoRef.current,
            (blob) => {
              // Send frame to Hume via the EmotionDrivenAvatar's sendVideoFrame
              sendVideoFrameRef.current?.(blob);
            },
            100 // 10 FPS
          );
        }
      } catch (err) {
        console.error('Error initializing camera:', err);
        setError('Could not access camera. Please check permissions and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    initCamera();

    // Cleanup function
    return () => {
      if (cleanup) cleanup();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle emotion detection
  const handleEmotionDetected = useCallback((emotion: Emotion) => {
    setCurrentEmotion(emotion.name);
    setEmotionScore(emotion.score);
  }, []);

  // Handle frame sending
  const handleSendVideoFrame = useCallback((sendFrame: (blob: Blob) => void) => {
    sendVideoFrameRef.current = sendFrame;
    return () => {
      sendVideoFrameRef.current = null;
    };
  }, []);

  if (!HUME_API_KEY) {
    return (
      <div className="error" style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Missing Hume API Key</h2>
        <p>Please set the REACT_APP_HUME_API_KEY environment variable</p>
      </div>
    );
  }


  if (error) {
    return (
      <div className="error" style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            marginTop: '10px',
            cursor: 'pointer',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="emotion-avatar-container" style={{ display: 'flex', height: '100vh' }}>
      {/* Left side: Webcam feed and controls */}
      <div style={{ flex: 1, padding: '20px', borderRight: '1px solid #ccc' }}>
        <h2>Camera Feed</h2>
        <div style={{ position: 'relative', width: '100%', maxWidth: '640px', margin: '0 auto' }}>
          <video
            ref={videoRef}
            style={{
              width: '100%',
              borderRadius: '8px',
              transform: 'scaleX(-1)', // Mirror the video
              display: cameraStream ? 'block' : 'none',
            }}
            playsInline
            muted
            autoPlay
          />
          {!cameraStream && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f0f0f0',
              borderRadius: '8px',
            }}>
              {isLoading ? 'Initializing camera...' : 'Camera not available'}
            </div>
          )}
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <h3>Current Emotion:</h3>
          <div style={{
            padding: '10px',
            background: '#f0f0f0',
            borderRadius: '4px',
            marginTop: '10px',
            textTransform: 'capitalize',
            fontWeight: 'bold',
            fontSize: '1.2em',
          }}>
            {currentEmotion} ({(emotionScore * 100).toFixed(1)}%)
          </div>
        </div>
      </div>

      {/* Right side: 3D Avatar */}
      <div style={{ flex: 1, position: 'relative' }}>
        <h2 style={{ padding: '20px', margin: 0 }}>3D Avatar</h2>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, marginTop: '60px' }}>
          <EmotionDrivenAvatar
            humeApiKey={HUME_API_KEY}
            avatarUrl={DEFAULT_AVATAR_URL}
            onLoad={() => console.log('Avatar loaded')}
            onError={(err: Error) => setError(`Avatar Error: ${err.message}`)}
            onEmotionDetected={handleEmotionDetected}
            isSpeaking={false} // Added to satisfy required prop
          />
        </div>
      </div>
    </div>
  );
};

export default EmotionAvatarExample;
