import React, { useRef, useEffect, useState } from 'react';

declare global {
  interface Window {
    ml5: any;
  }
}

const DirectPoseTest: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [poses, setPoses] = useState<any[]>([]);
  const poseNetRef = useRef<any>(null);

  useEffect(() => {
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setupPoseNet();
          };
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    const setupPoseNet = () => {
      if (!window.ml5 || !videoRef.current) {
        console.error('ML5 not available or video not ready');
        return;
      }

      console.log('Setting up PoseNet...');
      
      // Create PoseNet
      poseNetRef.current = window.ml5.poseNet(
        videoRef.current,
        {
          architecture: 'MobileNetV1',
          imageScaleFactor: 0.3,
          outputStride: 16,
          flipHorizontal: true,
          minConfidence: 0.5,
          maxPoseDetections: 1,
          scoreThreshold: 0.5,
          nmsRadius: 20,
          detectionType: 'single',
          multiplier: 0.75
        },
        () => {
          console.log('PoseNet model loaded!');
          setIsLoading(false);
          
          // Start detection
          poseNetRef.current.on('pose', (results: any[]) => {
            console.log('Poses detected:', results.length);
            setPoses(results);
            drawPoses(results);
          });
        }
      );
    };

    const drawPoses = (poses: any[]) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx || !videoRef.current) return;

      ctx.clearRect(0, 0, 640, 480);
      
      // Draw video
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
      
      // Draw keypoints
      poses.forEach(pose => {
        const keypoints = pose.pose.keypoints;
        
        // Draw keypoints
        keypoints.forEach((keypoint: any) => {
          if (keypoint.score > 0.3) {
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(keypoint.position.x, keypoint.position.y, 5, 0, 2 * Math.PI);
            ctx.fill();
            
            // Label important keypoints
            if (['leftWrist', 'rightWrist', 'leftElbow', 'rightElbow', 'leftShoulder', 'rightShoulder'].includes(keypoint.part)) {
              ctx.fillStyle = 'white';
              ctx.font = '12px Arial';
              ctx.fillText(keypoint.part, keypoint.position.x + 5, keypoint.position.y - 5);
            }
          }
        });
        
        // Draw skeleton
        const skeleton = pose.skeleton;
        skeleton.forEach((connection: any[]) => {
          const [p1, p2] = connection;
          if (p1.score > 0.3 && p2.score > 0.3) {
            ctx.strokeStyle = 'lime';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p1.position.x, p1.position.y);
            ctx.lineTo(p2.position.x, p2.position.y);
            ctx.stroke();
          }
        });
      });
    };

    setupCamera();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Direct PoseNet Test</h1>
      
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <video 
          ref={videoRef}
          style={{ display: 'none' }}
          width={640}
          height={480}
        />
        <canvas 
          ref={canvasRef}
          width={640}
          height={480}
          style={{ border: '2px solid #333' }}
        />
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <p>Status: {isLoading ? 'Loading PoseNet...' : 'PoseNet Ready'}</p>
        <p>Poses detected: {poses.length}</p>
        {poses.length > 0 && poses[0].pose && (
          <div>
            <h3>Arm Keypoints:</h3>
            <pre>{JSON.stringify({
              leftWrist: poses[0].pose.keypoints.find((k: any) => k.part === 'leftWrist'),
              rightWrist: poses[0].pose.keypoints.find((k: any) => k.part === 'rightWrist'),
              leftElbow: poses[0].pose.keypoints.find((k: any) => k.part === 'leftElbow'),
              rightElbow: poses[0].pose.keypoints.find((k: any) => k.part === 'rightElbow'),
              leftShoulder: poses[0].pose.keypoints.find((k: any) => k.part === 'leftShoulder'),
              rightShoulder: poses[0].pose.keypoints.find((k: any) => k.part === 'rightShoulder')
            }, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectPoseTest;
