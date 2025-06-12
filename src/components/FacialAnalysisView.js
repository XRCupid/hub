import React, { useEffect, useRef, useState, useCallback } from 'react';
import { webSocketManager } from '../services/WebSocketManager';

const FRAME_CAPTURE_INTERVAL_MS = 1000; // Capture frame every 1 second
const HUME_API_KEY = process.env.REACT_APP_HUME_API_KEY;

// Helper to get top N emotions
const getTopEmotions = (predictions, topN = 3) => {
  if (!predictions || !predictions.emotions) {
    return [];
  }
  return predictions.emotions
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
};

function FacialAnalysisView() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Idle');
  const [isCapturing, setIsCapturing] = useState(false);
  const [latestPrediction, setLatestPrediction] = useState(null); // Stores the full prediction object for the most dominant face
  const intervalRef = useRef(null);
  const socketRef = useRef(null);
  const mountRef = useRef(true); // To manage re-connections only when mounted
  const unsubscribeRef = useRef(null);

  const stopStreaming = useCallback((closeSocket = true) => {
    setIsCapturing(false);
    setStatus('Stopped');
    
    // Clear the interval for capturing frames
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Close WebSocket connection if requested
    if (closeSocket) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (socketRef.current) {
        webSocketManager.closeConnection(`facial-analysis:${socketRef.current.url}`);
        socketRef.current = null;
      }
    }
    // Don't stop the webcam stream here, allow user to restart analysis
  }, []);

  const handleSocketMessage = useCallback((event) => {
    try {
      const response = JSON.parse(event.data);
      // console.log("Hume WS Message:", response);
      if (response.face && response.face.predictions && response.face.predictions.length > 0) {
        // For simplicity, we'll take the first face prediction if multiple are detected.
        setLatestPrediction(response.face.predictions[0]);
        setError(''); // Clear previous errors on successful message
        setStatus('Receiving predictions...');
      } else if (response.error) {
        console.error("Hume API Error:", response.error);
        setError(`API Error: ${response.error.message || response.error}`);
        setStatus('Error from API');
        // stopStreaming(); // Consider stopping on critical errors
      } else if (response.face && response.face.warning && !response.face.predictions) {
        // Handle cases like "no face detected"
        setStatus(`Warning: ${response.face.warning}`);
        setLatestPrediction(null); // Clear old predictions
      }
    } catch (err) {
      console.error("Error parsing WebSocket message:", err);
      setError('Error processing server response.');
    }
  }, []);

  const captureAndSendFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !stream || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      // console.log("Skipping frame: prerequisites not met or socket not open.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8); // 0.8 quality
    const base64Data = imageDataUrl.split(',')[1];

    if (base64Data) {
      try {
        socketRef.current.send(JSON.stringify({
          models: { face: {} },
          data: base64Data,
          // stream_window_ms: 1000, // Optional: helps Hume smooth results, but adds latency.
                                      // The example FaceWidgets.tsx does not use it, implying it may not be critical for basic streaming.
        }));
      } catch (err) {
        console.error("Error sending frame over WebSocket:", err);
        setError("Error sending frame data.");
        // If send fails, might indicate a closed socket, onError or onClose should handle it.
      }
    }
  }, [stream]);

  const connectWebSocket = useCallback(() => {
    if (!HUME_API_KEY) {
      setError("Hume API Key not found. Please set REACT_APP_HUME_API_KEY in your .env file.");
      setStatus('API Key Missing');
      setIsCapturing(false);
      return;
    }

    const websocketUrl = `wss://api.hume.ai/v0/stream/models?apiKey=${HUME_API_KEY}`;
    const connectionKey = `facial-analysis:${websocketUrl}`;
    
    // Close any existing connection
    if (socketRef.current) {
      webSocketManager.closeConnection(connectionKey);
      socketRef.current = null;
    }
    
    // Unsubscribe from any existing subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    setStatus('Connecting to Hume AI...');
    
    try {
      // Get or create WebSocket connection
      socketRef.current = webSocketManager.getConnection(websocketUrl, 'facial-analysis');
      
      // Subscribe to WebSocket events
      unsubscribeRef.current = webSocketManager.subscribe(connectionKey, (event) => {
        switch (event.type) {
          case 'open':
            console.log("WebSocket connection established.");
            setStatus('Connected. Starting analysis...');
            setError('');
            // Start capturing frames
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(captureAndSendFrame, FRAME_CAPTURE_INTERVAL_MS);
            break;
            
          case 'message':
            handleSocketMessage(event);
            break;
            
          case 'error':
            console.error("WebSocket Error:", event.error);
            setError("WebSocket connection error. Check console for details.");
            setStatus('Connection Error');
            break;
            
          case 'close':
            console.log("WebSocket connection closed.", event.code, event.reason);
            if (mountRef.current && isCapturing) {
              setStatus('Connection closed. Attempting to reconnect...');
              if (event.code !== 1000) { // 1000 is normal closure
                setError('Connection closed unexpectedly. Please restart analysis.');
                stopStreaming(false);
              }
            } else {
              setStatus('Disconnected');
            }
            break;
            
          case 'reconnect_failed':
            console.error("WebSocket reconnection failed after", event.attempts, "attempts");
            setError(`Failed to reconnect after ${event.attempts} attempts. Please try again.`);
            setStatus('Connection Failed');
            break;
          
          default:
            break;
        }
      });
    } catch (error) {
      console.error("Error setting up WebSocket:", error);
      setError(`Failed to connect: ${error.message}`);
      setStatus('Connection Error');
      stopStreaming(false);
    }
  }, [captureAndSendFrame, handleSocketMessage, isCapturing, stopStreaming]);

  useEffect(() => {
    mountRef.current = true;
    // Start webcam when component mounts
    let currentStream;
    const getMedia = async () => {
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false // Only video for facial analysis
        });
        setStream(currentStream);
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
        setStatus('Webcam ready.');
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setError('Could not access webcam. Please check permissions.');
        setStatus('Webcam Error');
      }
    };
    getMedia();

    return () => {
      mountRef.current = false;
      console.log("FacialAnalysisView unmounting.");
      stopStreaming();
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      // Clean up any remaining subscriptions
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopStreaming]); // Run once on mount to get webcam

  // Effect to manage streaming based on isCapturing state
  useEffect(() => {
    if (isCapturing && stream) {
      connectWebSocket();
    } else if (!isCapturing) {
      stopStreaming();
    }
  }, [isCapturing, stream, connectWebSocket, stopStreaming]);

  const topEmotions = latestPrediction ? getTopEmotions(latestPrediction, 5) : [];

  if (!HUME_API_KEY) {
    return (
      <div style={{ padding: '20px', color: 'red', border: '1px solid red', margin: '10px' }}>
        <h2>Hume API Key Not Configured</h2>
        <p>Please set the <code>REACT_APP_HUME_API_KEY</code> environment variable in your <code>.env</code> file in the root of your project.</p>
        <p>Example: <code>REACT_APP_HUME_API_KEY=your_actual_api_key_here</code></p>
        <p>After adding it, you may need to restart your development server.</p>
      </div>
    );
  }

  return (
    <div className="content-card">
      <div>
        <h3>Facial Expression Analysis</h3>
      <p className="text-small">Status: {status}</p>
      {error && <p className="text-small" style={{ color: 'red' }}>Error: {error}</p>}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="video-player"
        style={{ width: '320px', height: '240px', transform: 'scaleX(-1)' /* Mirror display */ }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{ marginTop: '10px' }}>
        {!isCapturing ? (
          <button onClick={() => setIsCapturing(true)} disabled={!stream || isCapturing} className="btn-primary">
            Start Facial Analysis
          </button>
        ) : (
          <button onClick={() => setIsCapturing(false)} disabled={!isCapturing} className="btn-primary">
            Stop Facial Analysis
          </button>
        )}
      </div>

      {latestPrediction && (
        <div style={{ marginTop: '20px' }}>
          <h4>Top Emotions Detected:</h4>
          {topEmotions.length > 0 ? (
            <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
              {topEmotions.map((emotion) => (
                <li key={emotion.name}>
                  {emotion.name}: {emotion.score.toFixed(3)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-small">No emotions detected or data is still processing.</p>
          )}
          {/* Optional: Display bounding box or other info */}
          {/* latestPrediction.bbox && <p>Face BBox: {JSON.stringify(latestPrediction.bbox)}</p> */}
            </div>
          )}
        </div>
      </div>
  );
}

export default FacialAnalysisView;
