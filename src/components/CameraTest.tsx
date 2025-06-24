import React, { useEffect, useRef } from 'react';

const CameraTest: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        console.log('🎥 Starting camera test...');
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        console.log('✅ Camera granted in test component');
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('✅ Video element set in test component');
          
          videoRef.current.play().then(() => {
            console.log('✅ Video playing in test component');
          });
        }
        
      } catch (error) {
        console.error('❌ Camera test failed:', error);
      }
    };
    
    startCamera();
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '50%', 
      left: '50%', 
      transform: 'translate(-50%, -50%)',
      zIndex: 10000,
      background: 'white',
      padding: '20px',
      border: '3px solid red',
      borderRadius: '10px'
    }}>
      <h3>CAMERA TEST</h3>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: '300px',
          height: '200px',
          border: '2px solid black'
        }}
      />
      <div>If you see video above, camera works!</div>
    </div>
  );
};

export default CameraTest;
