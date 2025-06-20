import React, { useEffect, useState, useRef } from 'react';

interface WebGazerTrackerProps {
  onGazeChange?: (gazeData: { x: number; y: number; looking: boolean }) => void;
  showVideo?: boolean;
}

declare global {
  interface Window {
    webgazer: any;
  }
}

export const WebGazerTracker: React.FC<WebGazerTrackerProps> = ({
  onGazeChange,
  showVideo = true
}) => {
  const [isReady, setIsReady] = useState(false);
  const [gazePosition, setGazePosition] = useState({ x: 0, y: 0 });
  const [isLooking, setIsLooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engagementHistory, setEngagementHistory] = useState<boolean[]>([]);
  const isInitialized = useRef(false);

  useEffect(() => {
    const initWebGazer = async () => {
      if (isInitialized.current) return;
      
      // Wait for WebGazer to load
      let attempts = 0;
      while (!window.webgazer && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      if (!window.webgazer) {
        console.error('[WebGazerTracker] WebGazer not found');
        setError('WebGazer library not loaded');
        return;
      }

      try {
        console.log('[WebGazerTracker] Initializing...');
        isInitialized.current = true;
        
        // Configure WebGazer
        window.webgazer
          .setGazeListener((data: any, elapsedTime: number) => {
            if (data == null) {
              setIsLooking(false);
              setEngagementHistory(prev => [...prev.slice(-299), false]);
              if (onGazeChange) {
                onGazeChange({ x: 0, y: 0, looking: false });
              }
              return;
            }
            
            // Update state
            setGazePosition({ x: data.x, y: data.y });
            setIsLooking(true);
            setEngagementHistory(prev => [...prev.slice(-299), true]);
            
            if (onGazeChange) {
              onGazeChange({ 
                x: data.x, 
                y: data.y, 
                looking: true 
              });
            }
          })
          .begin();
          
        // Set up video display
        window.webgazer.showVideoPreview(showVideo);
        window.webgazer.showPredictionPoints(showVideo);
        window.webgazer.showFaceOverlay(showVideo);
        window.webgazer.showFaceFeedbackBox(showVideo);
        
        // Wait for ready
        await window.webgazer.ready;
        console.log('[WebGazerTracker] Ready!');
        setIsReady(true);
        
      } catch (err: any) {
        console.error('[WebGazerTracker] Error:', err);
        setError(`Failed to initialize: ${err.message || 'Unknown error'}`);
        isInitialized.current = false;
      }
    };

    initWebGazer();

    return () => {
      if (window.webgazer && isInitialized.current) {
        try {
          console.log('[WebGazerTracker] Cleaning up...');
          
          // First pause WebGazer to stop processing
          try {
            window.webgazer.pause();
          } catch (e) {
            console.log('[WebGazerTracker] Could not pause:', e);
          }
          
          // Clean up DOM elements first
          const elementsToRemove = [
            'webgazerVideoFeed',
            'webgazerVideoCanvas', 
            'webgazerFaceOverlay',
            'webgazerFaceFeedbackBox',
            'webgazerGazeDot'
          ];
          
          elementsToRemove.forEach(id => {
            const element = document.getElementById(id);
            if (element && element.parentNode) {
              try {
                element.parentNode.removeChild(element);
              } catch (e) {
                console.log(`[WebGazerTracker] Could not remove ${id}:`, e);
              }
            }
          });
          
          // Give it a moment for DOM cleanup
          setTimeout(() => {
            try {
              // Then end WebGazer
              window.webgazer.end();
            } catch (e) {
              console.log('[WebGazerTracker] Could not end webgazer:', e);
            }
            isInitialized.current = false;
          }, 100);
          
        } catch (err) {
          console.error('[WebGazerTracker] Cleanup error:', err);
        }
      }
    };
  }, [onGazeChange, showVideo]);

  const engagementPercentage = React.useMemo(() => {
    if (engagementHistory.length === 0) return 0;
    const recentHistory = engagementHistory.slice(-30);
    const looking = recentHistory.filter(h => h).length;
    return Math.round((looking / recentHistory.length) * 100);
  }, [engagementHistory]);

  if (error) {
    return (
      <div style={{ 
        padding: '10px', 
        background: '#ff4444', 
        borderRadius: '4px',
        color: 'white'
      }}>
        <strong>WebGazer Error:</strong> {error}
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px',
      color: 'white'
    }}>
      <h3 style={{ marginTop: 0 }}>WebGazer Eye Tracking</h3>
      
      <div style={{
        fontSize: '18px',
        marginBottom: '10px',
        color: isReady ? (isLooking ? '#4CAF50' : '#f44336') : '#ff9800'
      }}>
        {!isReady ? '⏳ Initializing...' : isLooking ? '👀 Tracking Gaze' : '❌ No Face Detected'}
      </div>
      
      {isReady && isLooking && (
        <div style={{ marginBottom: '15px' }}>
          <small>Gaze Position: ({Math.round(gazePosition.x)}, {Math.round(gazePosition.y)})</small>
        </div>
      )}
      
      <div>
        <div style={{ marginBottom: '5px' }}>Engagement: {engagementPercentage}%</div>
        <div style={{
          width: '100%',
          height: '20px',
          backgroundColor: '#333',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${engagementPercentage}%`,
            height: '100%',
            backgroundColor: engagementPercentage > 70 ? '#4CAF50' : engagementPercentage > 40 ? '#ff9800' : '#f44336',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
      
      <div style={{ 
        marginTop: '15px', 
        padding: '10px', 
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <p style={{ margin: 0 }}>
          {showVideo ? 'Video preview shown in top-left corner' : 'Video preview hidden'}
        </p>
        <p style={{ margin: '5px 0 0 0', fontSize: '11px', opacity: 0.7 }}>
          WebGazer provides accurate gaze coordinates
        </p>
      </div>
    </div>
  );
};
