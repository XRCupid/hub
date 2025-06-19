import React, { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    ml5: any;
    tf?: any;
  }
}

const TestML5Direct: React.FC = () => {
  const [status, setStatus] = useState<string[]>([]);
  const [predictions, setPredictions] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const facemeshRef = useRef<any>(null);

  const addStatus = (message: string) => {
    console.log(message);
    setStatus(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const startML5Test = async () => {
    try {
      setStatus(['Starting ML5 test...']);
      
      // Check ML5 availability
      if (!window.ml5) {
        throw new Error('ML5 not loaded');
      }
      
      const ml5 = window.ml5;
      addStatus(`✅ ML5 version: ${ml5.version}`);
      
      // Wait for TensorFlow.js to be ready
      if (window.tf) {
        addStatus('Waiting for TensorFlow.js...');
        await window.tf.ready();
        addStatus(`✅ TensorFlow.js ready, backend: ${window.tf.getBackend()}`);
      }
      
      // Get camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        addStatus('✅ Camera stream active');
        
        // Add video metadata check
        videoRef.current.onloadedmetadata = () => {
          addStatus(`✅ Video dimensions: ${videoRef.current!.videoWidth}x${videoRef.current!.videoHeight}`);
        };
      }
      
      // Create facemesh model
      addStatus('Creating ML5 facemesh...');
      const facemesh = ml5.facemesh(videoRef.current, () => {
        addStatus('✅ Facemesh model loaded');
      });
      
      facemeshRef.current = facemesh;
      
      // Listen for predictions
      facemesh.on('predict', (results: any) => {
        if (results && results.length > 0) {
          addStatus(`✅ Face detected! ${results.length} face(s)`);
          setPredictions(results[0]);
        }
      });
      
    } catch (error: any) {
      addStatus(`❌ Error: ${error.message}`);
      console.error(error);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#1a1a1a', color: 'white', minHeight: '100vh' }}>
      <h1>Direct ML5 Test</h1>
      <p>Testing ML5 facemesh directly without any wrapper services</p>
      
      <button
        onClick={startML5Test}
        style={{
          padding: '12px 24px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px',
          marginBottom: '20px'
        }}
      >
        Start ML5 Test
      </button>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div>
          <h3>Video Feed</h3>
          <video 
            ref={videoRef} 
            style={{ width: '320px', height: '240px', backgroundColor: '#000' }}
            playsInline
            muted
          />
        </div>
        
        <div style={{ flex: 1 }}>
          <h3>Status Log</h3>
          <div style={{ 
            backgroundColor: '#2a2a2a', 
            padding: '10px', 
            borderRadius: '5px', 
            height: '240px', 
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '12px'
          }}>
            {status.map((msg, i) => (
              <div key={i}>{msg}</div>
            ))}
          </div>
        </div>
      </div>
      
      {predictions && (
        <div style={{ backgroundColor: '#333', padding: '20px', borderRadius: '10px' }}>
          <h3>Face Data</h3>
          <p>Keypoints detected: {predictions.scaledMesh?.length || 0}</p>
          <p>Bounding box: {JSON.stringify(predictions.boundingBox?.topLeft || {})}</p>
          {predictions.scaledMesh && predictions.scaledMesh.length > 0 && (
            <p>First keypoint: {JSON.stringify(predictions.scaledMesh[0])}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TestML5Direct;
