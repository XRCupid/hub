import React, { useState, useEffect, useRef } from 'react';

export const WebGazerTestManual: React.FC = () => {
  const [status, setStatus] = useState('Not initialized');
  const [gazeData, setGazeData] = useState<{x: number, y: number} | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[${timestamp}] ${message}`);
  };

  // Manual camera initialization
  const initializeCamera = async () => {
    try {
      addLog('Initializing camera manually...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        addLog('Camera stream started successfully');
      }
    } catch (error) {
      addLog(`Camera error: ${error}`);
    }
  };

  // Initialize WebGazer with existing stream
  const initializeWebGazerWithStream = async () => {
    try {
      if (!window.webgazer) {
        addLog('ERROR: WebGazer not found on window');
        return;
      }

      addLog('Initializing WebGazer with manual stream...');
      
      // Try to set video element directly
      if (videoRef.current && window.webgazer.setVideoElement) {
        window.webgazer.setVideoElement(videoRef.current);
        addLog('Set video element directly');
      }

      // Configure WebGazer
      window.webgazer.setRegression('ridge');
      window.webgazer.showPredictionPoints(true);
      window.webgazer.showVideo(false); // Don't create another video
      window.webgazer.showFaceOverlay(true);
      
      // Set up gaze listener
      window.webgazer.setGazeListener((data: any, elapsedTime: number) => {
        if (data) {
          setGazeData({ x: Math.round(data.x), y: Math.round(data.y) });
        }
      });

      // Start WebGazer
      await window.webgazer.begin();
      setStatus('WebGazer running with manual stream');
      addLog('WebGazer initialized with manual stream');
      
    } catch (error) {
      addLog(`WebGazer error: ${error}`);
      setStatus('Error: ' + error);
    }
  };

  // Try legacy WebGazer version approach
  const tryLegacyWebGazer = async () => {
    try {
      addLog('Trying legacy WebGazer initialization...');
      
      // Clean up any existing instance
      if (window.webgazer && window.webgazer.end) {
        await window.webgazer.end();
      }

      // Remove any WebGazer elements
      ['webgazerVideoFeed', 'webgazerVideoCanvas', 'webgazerFaceOverlay', 'webgazerGazeDot'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.remove();
      });

      // Initialize with minimal settings
      window.webgazer.params.showVideo = true;
      window.webgazer.params.showFaceOverlay = true;
      window.webgazer.params.showPredictionPoints = true;
      
      window.webgazer.setGazeListener((data: any) => {
        if (data) {
          setGazeData({ x: Math.round(data.x), y: Math.round(data.y) });
        }
      });

      await window.webgazer.begin();
      setStatus('WebGazer running (legacy mode)');
      addLog('Legacy WebGazer started');
      
    } catch (error) {
      addLog(`Legacy error: ${error}`);
    }
  };

  // Check WebGazer internals
  const checkWebGazerInternals = () => {
    if (!window.webgazer) {
      addLog('WebGazer not available');
      return;
    }

    addLog('WebGazer internals:');
    addLog(`- Version: ${window.webgazer.version || 'unknown'}`);
    addLog(`- Params: ${JSON.stringify(window.webgazer.params || {})}`);
    addLog(`- Methods: ${Object.keys(window.webgazer).filter(k => typeof window.webgazer[k] === 'function').join(', ')}`);
    
    if (window.webgazer.getTracker) {
      const tracker = window.webgazer.getTracker();
      addLog(`- Tracker: ${tracker ? tracker.constructor.name : 'null'}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>WebGazer Manual Stream Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Status: {status}</h2>
        {gazeData && (
          <div>
            <h3>Gaze Data:</h3>
            <p>X: {gazeData.x}, Y: {gazeData.y}</p>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={initializeCamera} style={{ marginRight: '10px' }}>
          1. Initialize Camera
        </button>
        <button onClick={initializeWebGazerWithStream} style={{ marginRight: '10px' }}>
          2. Init WebGazer with Stream
        </button>
        <button onClick={tryLegacyWebGazer} style={{ marginRight: '10px' }}>
          Try Legacy Mode
        </button>
        <button onClick={checkWebGazerInternals}>
          Check Internals
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Manual Video Feed:</h3>
        <video 
          ref={videoRef}
          style={{ 
            width: '320px', 
            height: '240px', 
            border: '2px solid blue',
            transform: 'scaleX(-1)' // Mirror the video
          }}
          autoPlay
          playsInline
          muted
        />
      </div>

      <div style={{ 
        backgroundColor: 'black', 
        color: 'lime', 
        padding: '10px',
        height: '200px',
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  );
};
