import React, { useEffect, useState, useRef } from 'react';

interface JeelizGlanceTrackerProps {
  onWatchingChange?: (isWatching: boolean) => void;
  sensitivity?: number; // 0-1, default 0.5
  showVideo?: boolean;
}

declare global {
  interface Window {
    JEELIZGLANCETRACKER: any;
  }
}

export const JeelizGlanceTracker: React.FC<JeelizGlanceTrackerProps> = ({
  onWatchingChange,
  sensitivity = 0.5,
  showVideo = true
}) => {
  const [isReady, setIsReady] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchHistory, setWatchHistory] = useState<Array<{time: number, watching: boolean}>>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const initTracker = async () => {
      if (isInitialized.current) {
        console.log('[JeelizGlanceTracker] Already initialized');
        return;
      }

      if (!window.JEELIZGLANCETRACKER) {
        console.error('[JeelizGlanceTracker] JEELIZGLANCETRACKER not loaded');
        setError('Jeeliz library not loaded');
        return;
      }

      if (!canvasRef.current) {
        console.error('[JeelizGlanceTracker] Canvas not ready');
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(initTracker, 500);
        }
        return;
      }

      try {
        console.log('[JeelizGlanceTracker] Checking WebGL contexts...');
        
        // Try to free up WebGL contexts by forcing garbage collection
        const allCanvases = document.querySelectorAll('canvas');
        console.log(`[JeelizGlanceTracker] Found ${allCanvases.length} canvases`);
        
        // Force lose context on canvases that aren't actively being used
        allCanvases.forEach((canvas, index) => {
          if (canvas !== canvasRef.current && canvas.id !== 'avatar-canvas') {
            const ctx = canvas.getContext('webgl') || canvas.getContext('webgl2') || canvas.getContext('experimental-webgl');
            if (ctx) {
              const loseContext = (ctx as WebGLRenderingContext).getExtension('WEBGL_lose_context');
              if (loseContext && !canvas.dataset.keepContext) {
                console.log(`[JeelizGlanceTracker] Releasing context on canvas ${index}`);
                loseContext.loseContext();
              }
            }
          }
        });
        
        // Wait a bit for contexts to be released
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('[JeelizGlanceTracker] Initializing...');
        
        // Initialize Jeeliz with proper settings
        window.JEELIZGLANCETRACKER.init({
          canvas: canvasRef.current, // Use canvas element directly instead of ID
          
          callbackReady: function(err: any) {
            if (!mounted) return;
            
            if (err) {
              console.error('[JeelizGlanceTracker] Init error:', err);
              setError(`Initialization failed: ${err}`);
              
              // Retry if WebGL context issue
              if (err.includes('WebGL') && retryCount < maxRetries) {
                retryCount++;
                console.log(`[JeelizGlanceTracker] Retrying... (${retryCount}/${maxRetries})`);
                setTimeout(initTracker, 1000);
              }
              return;
            }
            
            console.log('[JeelizGlanceTracker] Successfully initialized!');
            setIsReady(true);
            isInitialized.current = true;
          },
          
          callbackTrack: function(isWatchingParam: boolean) {
            if (!mounted) return;
            
            setIsWatching(isWatchingParam);
            setWatchHistory(prev => {
              const newHistory = [...prev.slice(-299), {
                time: Date.now(),
                watching: isWatchingParam
              }];
              return newHistory;
            });
            
            if (onWatchingChange) {
              onWatchingChange(isWatchingParam);
            }
          },
          
          // Jeeliz settings
          NNCPath: 'https://cdn.jsdelivr.net/gh/jeeliz/jeelizGlanceTracker/dist/',
          isDisplayVideo: showVideo,
          videoSettings: {
            idealWidth: 320,
            idealHeight: 240,
            maxWidth: 640,
            maxHeight: 480
          }
        });
        
      } catch (err: any) {
        console.error('[JeelizGlanceTracker] Exception during init:', err);
        setError(`Failed to initialize: ${err.message || err}`);
      }
    };

    // Wait a bit before initializing to let other components settle
    const timeoutId = setTimeout(initTracker, 2000);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      
      if (isInitialized.current && window.JEELIZGLANCETRACKER?.destroy) {
        try {
          console.log('[JeelizGlanceTracker] Destroying tracker');
          window.JEELIZGLANCETRACKER.destroy();
          isInitialized.current = false;
        } catch (err) {
          console.error('[JeelizGlanceTracker] Error destroying:', err);
        }
      }
    };
  }, []); // Remove dependencies to prevent re-initialization

  // Calculate engagement percentage
  const engagementPercentage = React.useMemo(() => {
    if (watchHistory.length === 0) return 0;
    const recentHistory = watchHistory.slice(-30); // Last 30 samples
    const watching = recentHistory.filter(h => h.watching).length;
    return Math.round((watching / recentHistory.length) * 100);
  }, [watchHistory]);

  if (error) {
    return (
      <div style={{ 
        padding: '10px', 
        background: '#ff4444', 
        borderRadius: '4px',
        color: 'white'
      }}>
        <strong>Eye Tracking Error:</strong> {error}
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px',
      color: 'white'
    }}>
      <h3 style={{ marginTop: 0 }}>Eye Tracking</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <canvas 
          ref={canvasRef}
          width={320}
          height={240}
          style={{ 
            width: '320px',
            height: '240px',
            borderRadius: '8px',
            display: showVideo ? 'block' : 'none',
            backgroundColor: '#000'
          }}
        />
      </div>

      {isReady && (
        <div>
          <div style={{
            fontSize: '24px',
            marginBottom: '10px',
            color: isWatching ? '#4CAF50' : '#f44336'
          }}>
            {isWatching ? '👀 Looking at Screen' : '👁️‍🗨️ Looking Away'}
          </div>
          
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
        </div>
      )}
      
      {!isReady && !error && (
        <div>Initializing eye tracking...</div>
      )}
    </div>
  );
};
