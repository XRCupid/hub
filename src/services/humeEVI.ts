// Hume EVI Conversation API integration utility using WebSockets
// Usage: import { sendToHumeEVI, HumeEVIResponse } from './humeEVI';
// Requires: process.env.REACT_APP_HUME_API_KEY

// Debug flag - set to false in production
const DEBUG = true;

// WebSocket configuration
const WS_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // ms
  CONNECTION_TIMEOUT: 60000, // ms
  PING_INTERVAL: 30000, // ms - send ping every 30s to keep connection alive
};

// Global state for connection management
const connectionState = {
  retryCount: 0,
  isConnected: false,
  lastPing: 0,
  activeConnections: new Set<WebSocket>(),
};

// Clean up any lingering WebSocket connections
const cleanupConnections = () => {
  if (DEBUG) console.log('[HumeEVI] Cleaning up WebSocket connections');
  connectionState.activeConnections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close(1000, 'Cleanup');
    }
  });
  connectionState.activeConnections.clear();
};

// Initialize cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupConnections);
}

export interface HumeEVIResponse {
  reply: string;
  audioUrl: string; // URL or base64 audio
  timeline: Array<{ time: number; phoneme: string; }>;
}

// Helper function to convert Hume's visemes to standard phonemes
function visemeToPhoneme(viseme: string): string {
  const visemeMap: Record<string, string> = {
    'AA': 'AA', // father
    'AE': 'AE', // cat
    'AH': 'AH', // but
    'AO': 'AO', // dog
    'AW': 'AW', // cow
    'AY': 'AY', // say
    'B': 'B',
    'CH': 'CH',
    'D': 'D',
    'DH': 'DH',
    'EH': 'EH', // bed
    'ER': 'ER', // her
    'EY': 'EY', // they
    'F': 'F',
    'G': 'G',
    'HH': 'HH',
    'IH': 'IH', // sit
    'IY': 'IY', // see
    'JH': 'JH',
    'K': 'K',
    'L': 'L',
    'M': 'M',
    'N': 'N',
    'NG': 'NG',
    'OW': 'OW', // go
    'OY': 'OY', // boy
    'P': 'P',
    'R': 'R',
    'S': 'S',
    'SH': 'SH',
    'T': 'T',
    'TH': 'TH',
    'UH': 'UH', // book
    'UW': 'UW', // blue
    'V': 'V',
    'W': 'W',
    'Y': 'Y',
    'Z': 'Z',
    'ZH': 'ZH',
    // Map any other visemes to the closest phoneme
    'sil': 'M', // silence - use M (closed mouth)
    'pau': 'M'  // pause - use M (closed mouth)
  };
  
  return visemeMap[viseme] || 'M'; // Default to 'M' for unknown visemes
}

export function sendToHumeEVI(
  userText: string,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    connectionTimeout?: number;
  } = {}
): Promise<HumeEVIResponse> {
  const apiKey = process.env.REACT_APP_HUME_API_KEY;
  if (!apiKey) throw new Error('Hume API key missing!');

  const config = {
    maxRetries: options.maxRetries ?? WS_CONFIG.MAX_RETRIES,
    retryDelay: options.retryDelay ?? WS_CONFIG.RETRY_DELAY,
    connectionTimeout: options.connectionTimeout ?? WS_CONFIG.CONNECTION_TIMEOUT,
  };

  let retryCount = 0;
  let pingInterval: NodeJS.Timeout | null = null;

  const attemptConnection = (): Promise<HumeEVIResponse> => {
    return new Promise((resolve, reject) => {
      if (DEBUG) console.log(`[HumeEVI] Attempting WebSocket connection (attempt ${retryCount + 1}/${config.maxRetries + 1})`);
      
      // Create WebSocket with error handling
      let ws: WebSocket;
      try {
        ws = new WebSocket(`wss://api.hume.ai/v0/evi/chat?apiKey=${apiKey}`);
        connectionState.activeConnections.add(ws);
      } catch (error: any) {
        console.error('[HumeEVI] Failed to create WebSocket:', error);
        reject(new Error('Failed to create WebSocket connection'));
        return;
      }
      
      let responseData: HumeEVIResponse | null = null;
      let audioData: string | null = null;
      let timeline: Array<{time: number, phoneme: string}> = [];
      let isResolved = false;

      const cleanupConnection = () => {
        if (pingInterval) clearInterval(pingInterval);
        connectionState.activeConnections.delete(ws);
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1000, 'Operation complete');
        }
      };

      const timeout = setTimeout(() => {
        if (!isResolved) {
          if (DEBUG) console.error('[HumeEVI] Connection timeout');
          cleanupConnection();
          reject(new Error('Connection timeout'));
        }
      }, config.connectionTimeout);

      // Setup ping interval to keep connection alive
      const setupPing = () => {
        if (pingInterval) clearInterval(pingInterval);
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ type: 'ping' }));
              connectionState.lastPing = Date.now();
            } catch (error) {
              if (DEBUG) console.error('[HumeEVI] Ping error:', error);
            }
          }
        }, WS_CONFIG.PING_INTERVAL);
      }; 

      // Connection opened
      ws.onopen = () => {
        if (DEBUG) console.log('[HumeEVI] WebSocket connected');
        connectionState.isConnected = true;
        connectionState.retryCount = 0;
        setupPing();
        
        try {
          // Send the user message with configuration
          ws.send(JSON.stringify({
            type: 'user_message',
            message: userText,
            data: {
              models: {
                language: {
                  identify_speakers: false,
                  timestamps: 'words',
                  sentiment: true,
                  granularity: 'phoneme',
                  viseme: true
                },
                prosody: {},
                face: {}
              },
              stream: true,
              raw_text: false
            }
          }));
        } catch (error) {
          if (DEBUG) console.error('[HumeEVI] Error sending message:', error);
          cleanupConnection();
          reject(error);
        }
      };



      // Define WebSocket event handlers
      const handleMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          
          if (DEBUG) console.log('[HumeEVI] Received message:', data);
          
          if (data.type === 'assistant_message' || data.type === 'user_message') {
            // Process the message response
            responseData = responseData || {
              reply: '',
              audioUrl: '',
              timeline: []
            };
            
            // Update the response text if available
            if (data.message) {
              responseData.reply = data.message;
            }
            
            // Process viseme data for lip-sync if available
            if (data.visemes) {
              timeline = data.visemes.map((v: any) => ({
                time: v.start || 0,
                phoneme: visemeToPhoneme(v.viseme || 'M')
              }));
              responseData.timeline = timeline;
            }
            
            // If we have audio data in the message, use it
            if (data.audio && data.audio.data) {
              audioData = `data:audio/wav;base64,${data.audio.data}`;
              responseData.audioUrl = audioData;
            }
          } 
          else if (data.type === 'audio_output' && data.data) {
            // Store the base64 audio data
            audioData = `data:audio/wav;base64,${data.data}`;
            
            // Update the response data with audio URL if we have it
            if (responseData) {
              responseData.audioUrl = audioData;
            }
          }
          else if (data.type === 'error') {
            throw new Error(data.message || 'Error from Hume EVI');
          }
          else if (data.type === 'message_end') {
            // Final message with all data
            if (responseData) {
              // Ensure we have some default timeline data if none was provided
              if (responseData.timeline.length === 0) {
                // Create a simple timeline based on word count if no viseme data
                const wordCount = responseData.reply.split(/\s+/).length;
                const avgWordDuration = 0.5; // seconds per word
                const totalDuration = wordCount * avgWordDuration;
                
                // Add a default mouth movement
                responseData.timeline = [
                  { time: 0, phoneme: 'M' },
                  { time: totalDuration * 0.1, phoneme: 'AA' },
                  { time: totalDuration * 0.9, phoneme: 'M' }
                ];
              }
              
              // Close the connection and resolve with the complete response
              cleanupConnection();
              isResolved = true;
              resolve(responseData);
            }
          }
        } catch (error) {
          if (DEBUG) console.error('[HumeEVI] Error processing message:', error);
          cleanupConnection();
          if (!isResolved) {
            reject(error);
          }
        }
      };
      
      const handleClose = (event: CloseEvent) => {
        clearTimeout(timeout);
        cleanupConnection();
        
        if (isResolved) return;
        
        if (responseData) {
          isResolved = true;
          resolve(responseData);
        } else if (retryCount < config.maxRetries) {
          retryCount++;
          if (DEBUG) console.log(`[HumeEVI] Connection closed, retrying in ${config.retryDelay}ms...`);
          setTimeout(() => {
            attemptConnection().then(resolve).catch(reject);
          }, config.retryDelay);
        } else {
          const error = new Error(`Connection closed: ${event.code} ${event.reason || 'No response received'}`);
          if (DEBUG) console.error('[HumeEVI]', error);
          reject(error);
        }
      };
      
      const handleError = (error: Event) => {
        if (DEBUG) console.error('[HumeEVI] WebSocket error:', error);
        cleanupConnection();
        
        if (!isResolved && retryCount < config.maxRetries) {
          retryCount++;
          if (DEBUG) console.log(`[HumeEVI] WebSocket error, retrying in ${config.retryDelay}ms...`);
          setTimeout(() => {
            attemptConnection().then(resolve).catch(reject);
          }, config.retryDelay);
        } else if (!isResolved) {
          reject(new Error('WebSocket connection error'));
        }
      };
      
      // Set up event listeners
      ws.addEventListener('message', handleMessage);
      ws.addEventListener('close', handleClose);
      ws.addEventListener('error', handleError);
      
      // Cleanup function to remove all event listeners
      const cleanupEventListeners = () => {
        ws.removeEventListener('message', handleMessage);
        ws.removeEventListener('close', handleClose);
        ws.removeEventListener('error', handleError);
      };

      // Cleanup function that also removes event listeners
      const cleanupWithEventListeners = () => {
        cleanupEventListeners();
        if (pingInterval) clearInterval(pingInterval);
        connectionState.activeConnections.delete(ws);
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1000, 'Operation complete');
        }
      };
      
      // Return a cleanup function that can be called to clean up this connection
      return cleanupWithEventListeners;
    });
  };

  // Start the first connection attempt
  return new Promise((resolve, reject) => {
    attemptConnection()
      .then(resolve)
      .catch(error => {
        console.error('[HumeEVI] Error in sendToHumeEVI:', error);
        reject(error);
      });
  });
}

// Export cleanup function for manual cleanup if needed
export const cleanupHumeEVI = () => {
  cleanupConnections();
};
