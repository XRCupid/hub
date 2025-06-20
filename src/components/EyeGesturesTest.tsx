import React, { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    EyeGestures: any;
  }
}

export const EyeGesturesTest: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [gazePoint, setGazePoint] = useState<{ x: number, y: number } | null>(null);
  const [error, setError] = useState<string>('');
  const [calibrationCount, setCalibrationCount] = useState(0);
  const [gazeHistory, setGazeHistory] = useState<Array<{ x: number, y: number, timestamp: number }>>([]);
  
  const gesturesRef = useRef<any>(null);
  const videoCreated = useRef(false);

  useEffect(() => {
    // Create video element if it doesn't exist
    if (!videoCreated.current) {
      const video = document.createElement('video');
      video.id = 'eyegestures-video';
      video.width = 640;
      video.height = 480;
      video.autoplay = true;
      video.style.display = 'none';
      document.body.appendChild(video);

      const status = document.createElement('div');
      status.id = 'status';
      status.style.display = 'none';
      document.body.appendChild(status);

      const errorDiv = document.createElement('div');
      errorDiv.id = 'error';
      errorDiv.style.display = 'none';
      document.body.appendChild(errorDiv);

      videoCreated.current = true;
    }

    // Initialize EyeGestures
    const initEyeGestures = () => {
      try {
        if (!window.EyeGestures) {
          setError('EyeGestures not loaded. Check internet connection.');
          return;
        }

        console.log('[EyeGestures] Initializing...');
        
        const onPoint = (point: number[], calibration: boolean) => {
          console.log('[EyeGestures] Point:', point, 'Calibration:', calibration);
          
          if (point && point.length >= 2) {
            const newPoint = { x: point[0], y: point[1] };
            setGazePoint(newPoint);
            
            // Track gaze history for analysis
            setGazeHistory(prev => {
              const updated = [...prev, { ...newPoint, timestamp: Date.now() }];
              // Keep last 100 points
              return updated.slice(-100);
            });
          }
          
          setIsCalibrating(!calibration);
          if (!calibration) {
            setCalibrationCount(prev => prev + 1);
          }
        };

        const gestures = new window.EyeGestures('eyegestures-video', onPoint);
        
        // Uncomment to hide the blue tracker dot
        // gestures.invisible();
        
        gestures.start();
        gesturesRef.current = gestures;
        
        setIsInitialized(true);
        console.log('[EyeGestures] Started successfully');
        
      } catch (err) {
        console.error('[EyeGestures] Init error:', err);
        setError(`Failed to initialize: ${err instanceof Error ? err.message : String(err)}`);
      }
    };

    // Wait a bit for scripts to load
    setTimeout(initEyeGestures, 1000);

    // Cleanup
    return () => {
      if (gesturesRef.current && gesturesRef.current.stop) {
        gesturesRef.current.stop();
      }
      // Remove created elements
      const video = document.getElementById('eyegestures-video');
      const status = document.getElementById('status');
      const errorDiv = document.getElementById('error');
      if (video) video.remove();
      if (status) status.remove();
      if (errorDiv) errorDiv.remove();
    };
  }, []);

  // Calculate gaze metrics
  const calculateMetrics = () => {
    if (gazeHistory.length < 2) return null;
    
    // Calculate average movement (saccade indicator)
    let totalMovement = 0;
    for (let i = 1; i < gazeHistory.length; i++) {
      const dx = gazeHistory[i].x - gazeHistory[i-1].x;
      const dy = gazeHistory[i].y - gazeHistory[i-1].y;
      totalMovement += Math.sqrt(dx * dx + dy * dy);
    }
    const avgMovement = totalMovement / gazeHistory.length;
    
    // Calculate fixation stability (lower is more stable)
    const lastPoints = gazeHistory.slice(-10);
    const avgX = lastPoints.reduce((sum, p) => sum + p.x, 0) / lastPoints.length;
    const avgY = lastPoints.reduce((sum, p) => sum + p.y, 0) / lastPoints.length;
    let variance = 0;
    lastPoints.forEach(p => {
      const dx = p.x - avgX;
      const dy = p.y - avgY;
      variance += dx * dx + dy * dy;
    });
    const stability = Math.sqrt(variance / lastPoints.length);
    
    return {
      movement: avgMovement,
      stability: stability,
      isStable: stability < 50, // Threshold for stable gaze
      isNervous: avgMovement > 100 // Threshold for nervous movement
    };
  };

  const metrics = calculateMetrics();

  return (
    <div style={{ 
      padding: '20px', 
      background: '#1a1a1a', 
      color: 'white', 
      borderRadius: '8px',
      position: 'relative' 
    }}>
      <h2>EyeGestures Eye Tracking Test</h2>
      
      {error && (
        <div style={{ 
          background: '#f44336', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          Error: {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h3>Status</h3>
          <div>Initialized: {isInitialized ? '✅' : '❌'}</div>
          <div>Calibrating: {isCalibrating ? '🔄 Focus on red dots' : '✅ Calibrated'}</div>
          <div>Calibration Points: {calibrationCount}/20</div>
        </div>

        <div>
          <h3>Current Gaze</h3>
          {gazePoint ? (
            <>
              <div>X: {gazePoint.x.toFixed(0)}px</div>
              <div>Y: {gazePoint.y.toFixed(0)}px</div>
            </>
          ) : (
            <div>No gaze data yet</div>
          )}
        </div>

        <div>
          <h3>Gaze Analysis</h3>
          {metrics ? (
            <>
              <div>Movement: {metrics.movement.toFixed(1)}px/frame</div>
              <div>Stability: {metrics.stability.toFixed(1)}px</div>
              <div>Gaze Type: {metrics.isStable ? '👁️ Stable (focused)' : '👀 Moving'}</div>
              <div>Nervousness: {metrics.isNervous ? '😰 High' : '😌 Low'}</div>
            </>
          ) : (
            <div>Collecting data...</div>
          )}
        </div>

        <div>
          <h3>Dating Chemistry Insights</h3>
          {metrics && !isCalibrating && (
            <>
              <div>Eye Contact Quality: {metrics.isStable ? '💚 Good' : '💛 Wandering'}</div>
              <div>Confidence Level: {!metrics.isNervous ? '⭐ High' : '🌟 Nervous'}</div>
              <div>Engagement: {gazeHistory.length > 50 ? '🔥 Active' : '💤 Just started'}</div>
              <div>Interest Signal: {metrics.stability < 30 ? '💝 Very interested' : '💭 Distracted'}</div>
            </>
          )}
        </div>
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#888' }}>
        <p>Free eye tracking by EyeGestures. Logo required for free use.</p>
        <p>The calibration will show 20 red dots - focus on each one.</p>
        <p>A blue cursor will follow your gaze after calibration.</p>
      </div>
    </div>
  );
};
