import React, { useEffect, useRef, useState } from 'react';

declare const ml5: any;

const ML5FaceMeshTest: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<string>('Initializing...');
  const [predictions, setPredictions] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const facemeshRef = useRef<any>(null);

  useEffect(() => {
    const initializeFaceMesh = async () => {
      try {
        // Check ML5 availability
        if (typeof ml5 === 'undefined') {
          setError('ML5 is not loaded');
          return;
        }

        setStatus(`ML5 version: ${ml5.version || 'unknown'}`);

        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Wait for video to be ready
          await new Promise<void>((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play();
                resolve();
              };
            }
          });

          setStatus('Video ready, initializing ML5 FaceMesh...');

          // ML5 v0.12.2 uses the old API
          if (typeof ml5.facemesh !== 'undefined') {
            setStatus('Using ML5 v0.12.2 API');
            facemeshRef.current = ml5.facemesh({
              maxFaces: 1,
              flipHorizontal: false
            }, () => {
              setStatus('FaceMesh model loaded successfully');
              startDetection();
            });
          } else {
            setError('ml5.facemesh is not available');
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    const startDetection = () => {
      if (!facemeshRef.current || !videoRef.current) return;

      const detect = () => {
        if (!facemeshRef.current || !videoRef.current) return;

        try {
          // Use callback pattern
          if (typeof facemeshRef.current.predict === 'function') {
            facemeshRef.current.predict(videoRef.current, (predictions: any) => {
              if (predictions && predictions.length > 0) {
                setPredictions(predictions[0]);
                setStatus(`Detecting... ${predictions[0].landmarks?.length || 0} landmarks`);
              }
            });
          } else if (typeof facemeshRef.current.detect === 'function') {
            facemeshRef.current.detect(videoRef.current, (predictions: any) => {
              if (predictions && predictions.length > 0) {
                setPredictions(predictions[0]);
                setStatus(`Detecting... ${predictions[0].landmarks?.length || 0} landmarks`);
              }
            });
          }
        } catch (err) {
          console.error('Detection error:', err);
          setError(err instanceof Error ? err.message : 'Detection error');
        }

        // Continue detection loop
        requestAnimationFrame(detect);
      };

      detect();
    };

    initializeFaceMesh();

    // Cleanup
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      if (facemeshRef.current && typeof facemeshRef.current.stop === 'function') {
        facemeshRef.current.stop();
      }
    };
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>ML5 FaceMesh Test</h2>
      <div>Status: {status}</div>
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      <div style={{ marginTop: '10px' }}>
        <video
          ref={videoRef}
          width={640}
          height={480}
          style={{ border: '1px solid #ccc' }}
          playsInline
          muted
        />
      </div>
      {predictions && (
        <div style={{ marginTop: '10px' }}>
          <h3>Predictions:</h3>
          <pre>{JSON.stringify({
            landmarks: predictions.landmarks?.length || 0,
            boundingBox: predictions.boundingBox,
            faceOval: predictions.faceOval?.length || 0
          }, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default ML5FaceMeshTest;
