import React, { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    webgazer: any;
  }
}

export const WebGazerTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Not initialized');
  const [gazeData, setGazeData] = useState<{x: number, y: number} | null>(null);
  const [gazeCount, setGazeCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev.slice(-9), logMessage]); // Keep last 10 logs
  };

  const initializeWebGazer = async () => {
    try {
      addLog('Starting WebGazer initialization...');
      setStatus('Initializing...');

      if (!window.webgazer) {
        addLog('ERROR: WebGazer not found on window object');
        setStatus('WebGazer not loaded');
        return;
      }

      const webgazer = window.webgazer;
      
      // Clean up any existing instance
      addLog('Cleaning up existing WebGazer instance...');
      try {
        await webgazer.end();
      } catch (e) {
        addLog('No existing instance to clean up');
      }

      // Configure WebGazer
      addLog('Configuring WebGazer...');
      webgazer.setRegression('ridge');
      webgazer.showPredictionPoints(true);
      webgazer.showVideo(true);
      webgazer.showFaceOverlay(true);
      webgazer.showFaceFeedbackBox(true);

      // Set up gaze listener
      addLog('Setting up gaze listener...');
      webgazer.setGazeListener((data: {x: number, y: number} | null, elapsedTime: number) => {
        if (data) {
          setGazeData(data);
          setGazeCount(prev => prev + 1);
        }
      });

      // Begin tracking
      addLog('Starting WebGazer...');
      await webgazer.begin();

      // Check if ready
      const isReady = webgazer.isReady();
      addLog(`WebGazer isReady: ${isReady}`);

      if (isReady) {
        setStatus('Running');
        
        // Check for video element
        setTimeout(() => {
          const videoElement = document.getElementById('webgazerVideoFeed');
          if (videoElement) {
            addLog('Video element found');
            const video = videoElement as HTMLVideoElement;
            addLog(`Video dimensions: ${video.videoWidth}x${video.videoHeight}`);
            addLog(`Video readyState: ${video.readyState}`);
          } else {
            addLog('WARNING: Video element not found');
          }
        }, 1000);
      } else {
        setStatus('Failed to start');
      }

    } catch (error) {
      addLog(`ERROR: ${error}`);
      setStatus('Error');
    }
  };

  const stopWebGazer = async () => {
    try {
      addLog('Stopping WebGazer...');
      if (window.webgazer) {
        await window.webgazer.end();
        setStatus('Stopped');
        setGazeData(null);
        addLog('WebGazer stopped');
      }
    } catch (error) {
      addLog(`ERROR stopping: ${error}`);
    }
  };

  const checkVideoPermissions = async () => {
    try {
      addLog('Checking camera permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      addLog('Camera permission granted');
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      addLog(`Camera permission error: ${error}`);
    }
  };

  useEffect(() => {
    // Check if WebGazer is loaded
    addLog('Component mounted, checking WebGazer availability...');
    if (window.webgazer) {
      addLog('WebGazer is available');
    } else {
      addLog('WebGazer NOT available - make sure it\'s loaded in index.html');
    }

    return () => {
      // Cleanup on unmount
      if (window.webgazer && window.webgazer.isReady()) {
        window.webgazer.end();
      }
    };
  }, []);

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'monospace',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1>WebGazer Eye Tracking Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Status: <span style={{ color: status === 'Running' ? 'green' : 'red' }}>{status}</span></h2>
        <button onClick={initializeWebGazer} disabled={status === 'Running'}>
          Initialize WebGazer
        </button>
        <button onClick={stopWebGazer} disabled={status !== 'Running'} style={{ marginLeft: '10px' }}>
          Stop WebGazer
        </button>
        <button onClick={checkVideoPermissions} style={{ marginLeft: '10px' }}>
          Check Camera Permissions
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Gaze Data:</h3>
        <p>Total callbacks: {gazeCount}</p>
        {gazeData ? (
          <p>Current position: X: {gazeData.x.toFixed(2)}, Y: {gazeData.y.toFixed(2)}</p>
        ) : (
          <p>No gaze data yet</p>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Debug Logs:</h3>
        <div style={{
          backgroundColor: 'black',
          color: 'lime',
          padding: '10px',
          height: '200px',
          overflowY: 'auto',
          fontSize: '12px'
        }}>
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>

      <div>
        <h3>Instructions:</h3>
        <ol>
          <li>Click "Check Camera Permissions" first</li>
          <li>Click "Initialize WebGazer"</li>
          <li>You should see a video feed of your face appear</li>
          <li>Green dots should appear showing gaze predictions</li>
          <li>The gaze data counter should increase rapidly</li>
        </ol>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Expected WebGazer Elements:</h3>
        <p>After initialization, these elements should appear on the page:</p>
        <ul>
          <li>webgazerVideoFeed - Your camera feed</li>
          <li>webgazerVideoCanvas - Processing canvas</li>
          <li>webgazerFaceOverlay - Face tracking overlay</li>
          <li>webgazerGazeDot - Green prediction dots</li>
        </ul>
      </div>
    </div>
  );
};
