import { useEffect, useRef, useCallback, useState } from 'react';

// Add a type for WebSocket connection state
type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';

type EmotionData = {
  predictions?: Array<{
    emotions: Array<{
      name: string;
      score: number;
    }>;
  }>;
};

type OnEmotionDataCallback = (emotion: { name: string; score: number }) => void;

// Helper function to convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export const useHumeEmotionStream = (
  apiKey: string | undefined,
  onEmotionData: OnEmotionDataCallback,
  config?: {
    isEmotionDetectionActive?: boolean;
    isVideoOn?: boolean;
  }
) => {
  const wsRef = useRef<WebSocket | null>(null);
  const isMounted = useRef(true); // Tracks component mount state
  const reconnectAttempts = useRef(0); // Tracks attempts for current connection cycle
  const reconnectTimeout = useRef<number | undefined>(); // Stores timeout ID for clearing

  const { isEmotionDetectionActive = false, isVideoOn = false } = config || {};
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastError, setLastError] = useState<string | null>(null);

  // Effect for component mount/unmount detection
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // Clear any pending reconnect timeout when the component unmounts
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = undefined;
      }
    };
  }, []);

  useEffect(() => {
    // WebSocket should only be active if API key is present AND emotion detection/video are on
    if (!apiKey || !isEmotionDetectionActive || !isVideoOn) {
      if (wsRef.current) {
        console.log('[Hume Stream] Conditions not met or changed. Closing WebSocket.');
        // Clear handlers to prevent them from firing during or after close
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null; 
        wsRef.current.close();
        wsRef.current = null;
        // Reset reconnect attempts when connection is intentionally closed
        reconnectAttempts.current = 0; 
        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
            reconnectTimeout.current = undefined;
        }
      }
      setConnectionState('disconnected');
      return; // Exit early if no connection should be active
    }

    // If a WebSocket connection already exists and is open or connecting, do nothing.
    // This check prevents re-creating a WebSocket if this effect re-runs due to other dependency changes
    // while a connection is already being established or is active.
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      console.log('[Hume Stream] WebSocket already open or connecting. No action needed.');
      return;
    }

    console.log('[Hume Stream] Conditions met. Attempting to establish WebSocket connection.');
    setConnectionState('connecting');
    setLastError(null);

    const wsUrl = `wss://api.hume.ai/v0/stream/models?apiKey=${encodeURIComponent(apiKey)}`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws; // Assign new WebSocket to ref immediately

    console.log('[Hume Stream] WebSocket instance created. URL:', wsUrl);

    ws.onopen = () => {
      if (!isMounted.current || wsRef.current !== ws) return; // Stale closure check
      console.log('[Hume Stream] WebSocket connected.');
      reconnectAttempts.current = 0; // Reset on successful connection
      setConnectionState('connected');
      setLastError(null);

      const initialFrameBase64 = "dGVzdA=="; // Placeholder "test"
      const initialMessage = {
        models: { face: {}, prosody: {} },
        data: initialFrameBase64,
      };
      try {
        console.log('[Hume Stream] Sending initial message:', JSON.stringify(initialMessage,null,2));
        ws.send(JSON.stringify(initialMessage));
      } catch (err) {
        console.error('[Hume Stream] Error sending initial message:', err);
        setLastError(err instanceof Error ? err.message : String(err));
        // Consider closing if initial send fails, or let onclose/onerror handle it
      }
    };

    ws.onmessage = (event) => {
      if (!isMounted.current || wsRef.current !== ws) return; // Stale closure check
      try {
        const data = JSON.parse(event.data as string);
        // console.log('[Hume Stream] Received message:', data);
        if (data.error) {
          console.error('[Hume Stream] Hume API error:', data.error);
          setConnectionState('error');
          setLastError(`Hume API Error: ${data.error.message || data.error}`);
          return;
        }
        // Process emotion data
        if (data.predictions?.[0]?.emotions?.length) {
          const emotions = data.predictions[0].emotions;
          const topEmotion = emotions.reduce((a:any, b:any) => (a.score > b.score ? a : b), { name: 'neutral', score: 0 });
          onEmotionData({
            name: topEmotion.name.toLowerCase(),
            score: topEmotion.score
          });
        }
      } catch (error) {
        console.error('[Hume Stream] Error processing message:', error);
        setLastError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    const attemptReconnect = () => {
        if (!isMounted.current || !isEmotionDetectionActive || !isVideoOn || reconnectAttempts.current >= 5) {
            if (reconnectAttempts.current >=5) {
                console.error('[Hume Stream] Max reconnection attempts reached.');
                setConnectionState('error');
                setLastError('Max reconnection attempts reached.');
            }
            return; // Don't reconnect if component unmounted, feature disabled, or max attempts reached
        }

        reconnectAttempts.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current -1 ), 30000); // Adjust delay calculation
        console.log(`[Hume Stream] Attempting to reconnect (${reconnectAttempts.current}/5) in ${delay}ms...`);
        setConnectionState('reconnecting');
        
        // Clear previous timeout before setting a new one
        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
        }

        reconnectTimeout.current = window.setTimeout(() => {
            if (isMounted.current && isEmotionDetectionActive && isVideoOn) {
                // Explicitly call the effect's logic to re-initiate connection
                // This is a bit of a hack; ideally, the main useEffect re-runs.
                // For now, we'll just create a new WebSocket instance directly if conditions are still met.
                // This requires duplicating the ws creation logic or refactoring ws creation into a separate function.
                // To avoid immediate complexity, let's re-evaluate if this manual reconnect is even needed
                // given the main useEffect will try to establish connection if wsRef.current is null and conditions are met.
                console.log('[Hume Stream] Reconnect timeout: Triggering new connection attempt.');
                // Effectively, the main useEffect should handle this by finding wsRef.current is null.
                // So, we just need to ensure wsRef.current is null after a definitive close.
                // The main useEffect will then take over if conditions (apiKey, isVideoOn, etc.) are still met.
                // Forcing a re-run or a direct call to a 'createAndConnectSocket' function might be cleaner.
                // Let's ensure wsRef.current is null and let the main effect re-evaluate.
                if(wsRef.current && wsRef.current.readyState !== WebSocket.OPEN) {
                  wsRef.current = null; // This will make the main useEffect re-evaluate and try to connect
                  // Manually trigger a state change to encourage re-render of the hook's consumer, potentially re-running this effect.
                  // This is a bit hacky. A better way would be for `connect` to be a stable function that can be called.
                  setConnectionState('connecting'); // Force re-evaluation, not ideal
                }

            }
        }, delay);
    };

    ws.onerror = (event) => {
      if (!isMounted.current || wsRef.current !== ws) return; // Stale closure check
      console.error('[Hume Stream] WebSocket error:', event);
      setLastError('WebSocket error occurred.'); // Avoid complex object in state
      // Don't set to 'error' state immediately, let onclose handle definitive state or attempt reconnect
      // attemptReconnect(); // onerror often followed by onclose, let onclose manage reconnect attempt
    };

    ws.onclose = (event) => {
      if (!isMounted.current || wsRef.current !== ws) return; // Stale closure check
      console.log(`[Hume Stream] WebSocket closed. Code: ${event.code}, Reason: '${event.reason}', Clean: ${event.wasClean}`);
      wsRef.current = null; // Important: clear the ref when the socket is definitively closed.

      if (event.code === 1000 || event.code === 1005) { // Normal closure or no status recieved (often client-side intentional close)
        console.log('[Hume Stream] WebSocket closed normally or intentionally.');
        setConnectionState('disconnected');
        reconnectAttempts.current = 0; // Reset attempts on clean close
        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
            reconnectTimeout.current = undefined;
        }
      } else if (isMounted.current && isEmotionDetectionActive && isVideoOn) {
        // Abnormal closure, and we should be connected
        console.log('[Hume Stream] WebSocket closed abnormally. Attempting reconnect.');
        setLastError(`WebSocket closed abnormally: ${event.code} ${event.reason}`);
        attemptReconnect();
      } else {
        // Closed, but we shouldn't be connected (e.g., feature toggled off during connection attempt)
        setConnectionState('disconnected');
        reconnectAttempts.current = 0;
      }
    };

    // Cleanup function for this effect
    return () => {
      console.log('[Hume Stream] useEffect cleanup: Closing WebSocket.');
      // Clear any pending reconnect timeout first
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = undefined;
      }
      if (wsRef.current) {
        // Remove handlers to prevent them from firing after this cleanup logic
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
            wsRef.current.close(1000); // Send a normal closure code
        }
        wsRef.current = null;
      }
       // When the effect cleans up because dependencies changed (e.g., video toggled off),
       // or component unmounts, ensure connection state is 'disconnected'.
      setConnectionState('disconnected'); 
      reconnectAttempts.current = 0; // Reset reconnect attempts
    };
  // Dependencies: apiKey ensures re-connection if it changes.
  // isEmotionDetectionActive and isVideoOn control the active state.
  // onEmotionData is needed to correctly set up the onmessage handler with the latest callback.
  }, [apiKey, isEmotionDetectionActive, isVideoOn, onEmotionData]); 

  const sendVideoFrame = useCallback(async (frame: Blob | ArrayBuffer) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      // console.warn('[Hume Stream] WebSocket not open. Cannot send video frame.');
      return;
    }
    const base64Data = arrayBufferToBase64(frame instanceof Blob ? await frame.arrayBuffer() : frame);
    const message = {
      models: { face: {}, prosody: {} },
      data: base64Data,
    };
    try {
      wsRef.current.send(JSON.stringify(message));
    } catch (err) {
      console.error('[Hume Stream] Error sending video frame:', err);
      setLastError(err instanceof Error ? err.message : String(err));
    }
  }, []); // No dependencies, relies on wsRef.current which is managed by useEffect

  return { sendVideoFrame, connectionState, lastError };
};
