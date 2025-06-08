import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { PostureTrackingService } from '../services/PostureTrackingService';

const SimpleArmTest: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [keypoints, setKeypoints] = useState<any>(null);
  const postureService = useRef(new PostureTrackingService());

  const startTracking = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = async () => {
          if (!videoRef.current) return;
          
          // Initialize and start posture tracking
          await postureService.current.initialize();
          await postureService.current.startTracking(videoRef.current);
          setIsTracking(true);
          
          // Poll for keypoints
          setInterval(() => {
            const data = postureService.current.getPostureData();
            if (data?.keypoints) {
              setKeypoints(data.keypoints);
              console.log('Keypoints:', data.keypoints);
            }
          }, 100);
        };
      }
    } catch (error) {
      console.error('Error starting tracking:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Simple Arm Tracking Test</h1>
      
      <button onClick={startTracking} disabled={isTracking}>
        {isTracking ? 'Tracking...' : 'Start Tracking'}
      </button>
      
      <video 
        ref={videoRef}
        style={{ width: '320px', height: '240px', border: '1px solid #ccc' }}
        autoPlay
        playsInline
      />
      
      <div style={{ marginTop: '20px' }}>
        <h3>Keypoints:</h3>
        {keypoints && (
          <pre>{JSON.stringify({
            leftWrist: keypoints.leftWrist,
            rightWrist: keypoints.rightWrist,
            leftElbow: keypoints.leftElbow,
            rightElbow: keypoints.rightElbow,
            leftShoulder: keypoints.leftShoulder,
            rightShoulder: keypoints.rightShoulder
          }, null, 2)}</pre>
        )}
      </div>
    </div>
  );
};

export default SimpleArmTest;
