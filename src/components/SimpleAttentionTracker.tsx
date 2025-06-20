import React, { useEffect, useState, useRef } from 'react';

interface SimpleAttentionTrackerProps {
  onAttentionChange?: (isLooking: boolean) => void;
  showVideo?: boolean;
}

export const SimpleAttentionTracker: React.FC<SimpleAttentionTrackerProps> = ({
  onAttentionChange,
  showVideo = true
}) => {
  const [isLooking, setIsLooking] = useState(false);
  const [engagementScore, setEngagementScore] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<number>();
  const lookingHistoryRef = useRef<boolean[]>([]);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startTracking = async () => {
      try {
        // Get camera stream
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 320, 
            height: 240,
            facingMode: 'user'
          } 
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Simple face detection using basic image analysis
        intervalRef.current = window.setInterval(() => {
          if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) return;

            canvas.width = 320;
            canvas.height = 240;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Get image data for simple analysis
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Simple heuristic: check center region for face-like colors
            let facePixels = 0;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const checkRadius = 60;
            
            for (let y = centerY - checkRadius; y < centerY + checkRadius; y++) {
              for (let x = centerX - checkRadius; x < centerX + checkRadius; x++) {
                const idx = (y * canvas.width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                
                // Check for skin-tone colors (very basic)
                if (r > 95 && g > 40 && b > 20 && 
                    r > g && r > b && 
                    Math.abs(r - g) > 15) {
                  facePixels++;
                }
              }
            }
            
            // If enough face pixels detected, assume looking
            const totalPixels = checkRadius * checkRadius * 4;
            const faceRatio = facePixels / totalPixels;
            const looking = faceRatio > 0.15; // 15% threshold
            
            setIsLooking(looking);
            lookingHistoryRef.current.push(looking);
            
            // Keep last 30 samples (about 10 seconds at 3fps)
            if (lookingHistoryRef.current.length > 30) {
              lookingHistoryRef.current.shift();
            }
            
            // Calculate engagement score
            const lookingCount = lookingHistoryRef.current.filter(l => l).length;
            const score = Math.round((lookingCount / lookingHistoryRef.current.length) * 100);
            setEngagementScore(score);
            
            if (onAttentionChange) {
              onAttentionChange(looking);
            }
          }
        }, 333); // ~3 FPS

      } catch (error) {
        console.error('Failed to start attention tracking:', error);
      }
    };

    startTracking();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onAttentionChange]);

  return (
    <div style={{ 
      padding: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: '8px',
      color: 'white'
    }}>
      <h3>Attention Tracker</h3>
      
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '160px',
              height: '120px',
              display: showVideo ? 'block' : 'none',
              borderRadius: '4px'
            }}
          />
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
        </div>
        
        <div>
          <div style={{
            fontSize: '24px',
            marginBottom: '10px',
            color: isLooking ? '#4CAF50' : '#f44336'
          }}>
            {isLooking ? '👀 Looking' : '😴 Not Looking'}
          </div>
          
          <div>
            <div style={{ marginBottom: '5px' }}>Engagement: {engagementScore}%</div>
            <div style={{
              width: '200px',
              height: '20px',
              backgroundColor: '#333',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${engagementScore}%`,
                height: '100%',
                backgroundColor: engagementScore > 70 ? '#4CAF50' : engagementScore > 40 ? '#ff9800' : '#f44336',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
