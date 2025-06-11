import { HumeClient, convertBase64ToBlob, getAudioStream, ensureSingleValidAudioTrack, getBrowserSupportedMimeType, MimeType } from 'hume';
import { getHumeCredentials } from './humeCredentialsOverride';

// Re-declare base64ToBlob utility if not available from 'hume'
// (Originally from '@humeai/voice')
function base64ToBlob(base64: string, type: string = 'application/octet-stream'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type });
}

// Utility function to convert Blob to Base64 string
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove the "data:*/*;base64," prefix
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to convert blob to base64 string.'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export interface EmotionalState {
  joy?: number;
  sadness?: number;
  anger?: number;
  fear?: number;
  surprise?: number;
  disgust?: number;
  contempt?: number;
}

export class HumeVoiceService {
  private static connectionCount = 0; // Track total connections for monitoring
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3; // Reduced from 5 to 3 for safety
  private readonly BASE_RECONNECT_DELAY_MS = 5000; // Increased from 2000 to 5000ms
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private client: HumeClient | null = null;
  private socket: any; // Consider typing this more strictly if possible, e.g., ChatSocket from '@humeai/voice/dist/src/socket'
  private isConnected: boolean = false;
  private hasConnectedBefore: boolean = false; // New
  private onAudioCallback?: (audioBlob: Blob) => void;
  private onMessageCallback?: (message: any) => void; // Type changed
  private onEmotionCallback?: (emotions: EmotionalState) => void;
  private onAssistantEndCallback?: () => void;
  private onUserMessageCallback?: (transcript: string) => void;
  private onUserInterruptionCallback?: () => void;
  private onErrorCallback?: (error: Error) => void;
  private onOpenCallback?: () => void; // New
  private onCloseCallback?: (code: number, reason: string) => void; // New

  private explicitlyClosed: boolean = false; // New
  private currentConfigId: string | undefined; // New

  private audioStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private mimeType: MimeType = MimeType.WEBM;

  constructor() {
    console.log('[HumeVoiceService] Constructor called');
    console.log('[HumeVoiceService] Environment variables at construction:', {
      hasApiKey: !!process.env.REACT_APP_HUME_API_KEY,
      hasSecretKey: !!process.env.REACT_APP_HUME_SECRET_KEY,
      apiKeyLength: process.env.REACT_APP_HUME_API_KEY?.length || 0,
      secretKeyLength: process.env.REACT_APP_HUME_SECRET_KEY?.length || 0
    });
    
    // Don't initialize client here - do it in connect() to ensure env vars are loaded
  }

  // Callbacks setters
  public setOnOpenCallback(callback: () => void): void {
    this.onOpenCallback = callback;
  }

  public setOnCloseCallback(callback: (code: number, reason: string) => void): void {
    this.onCloseCallback = callback;
  }

  public setOnAudioCallback(callback: (audioBlob: Blob) => void): void {
    this.onAudioCallback = callback;
  }

  public setOnMessageCallback(callback: (message: any) => void): void { // Type changed for consistency
    this.onMessageCallback = callback;
  }

  public setOnEmotionCallback(callback: (emotions: EmotionalState) => void): void {
    this.onEmotionCallback = callback;
  }

  public setOnAssistantEndCallback(callback: () => void): void {
    this.onAssistantEndCallback = callback;
  }

  public setOnUserMessageCallback(callback: (transcript: string) => void): void {
    this.onUserMessageCallback = callback;
  }

  public setOnUserInterruptionCallback(callback: () => void): void {
    this.onUserInterruptionCallback = callback;
  }
  
  public setOnErrorCallback(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  async connect(configId?: string): Promise<void> {
    console.log('[HumeVoiceService] Connect called with configId:', configId);
    
    // CRITICAL: Prevent multiple connections
    if (this.client) {
      console.warn('[HumeVoiceService] Already connected! Disconnecting first to prevent connection leak.');
      await this.disconnect();
    }
    
    // Store the config ID
    this.currentConfigId = configId;
    
    try {
      console.log('[HumeVoiceService] Connect method called');
      
      // Safety check: Prevent multiple simultaneous connections
      if (this.isConnected && this.socket) {
        console.warn('[HumeVoiceService] Already connected. Skipping connection attempt to prevent credit consumption.');
        return;
      }
      
      // Safety check: Clear any pending reconnection attempts
      if (this.reconnectTimeoutId) {
        clearTimeout(this.reconnectTimeoutId);
        this.reconnectTimeoutId = null;
        console.log('[HumeVoiceService] Cleared pending reconnection timeout');
      }
      
      // Reset connection state
      this.explicitlyClosed = false;
      this.reconnectAttempts = 0;
      
      console.log('[HumeVoiceService] Environment check:', {
        hasApiKey: !!process.env.REACT_APP_HUME_API_KEY,
        hasSecretKey: !!process.env.REACT_APP_HUME_SECRET_KEY,
        apiKeyLength: process.env.REACT_APP_HUME_API_KEY?.length || 0,
        secretKeyLength: process.env.REACT_APP_HUME_SECRET_KEY?.length || 0
      });
      
      console.log('[HumeVoiceService] Connecting to Hume EVI...');
      this.explicitlyClosed = false; // Reset for new connection attempt
      
      // Increment connection counter for monitoring
      HumeVoiceService.connectionCount++;
      console.log(`[HumeVoiceService] 📊 Connection attempt #${HumeVoiceService.connectionCount} (Session total)`);
      
      const configToUse = configId || process.env.REACT_APP_HUME_CONFIG_ID || '';
      this.currentConfigId = configToUse; // Store for reconnect
      
      console.log('[HumeVoiceService] Using config ID:', configToUse);
      
      // Get credentials from override system
      const credentials = getHumeCredentials();
      
      // Validate credentials
      const apiKey = credentials.apiKey;
      const secretKey = credentials.secretKey;
      
      // Check if API keys are available
      if (!apiKey || !secretKey) {
        const error = new Error('Hume API credentials not configured. Please check console for override instructions.');
        console.error('[HumeVoiceService]', error.message);
        console.error('[HumeVoiceService] Use window.humeCredentials.set("api_key", "secret_key") to set credentials');
        if (this.onErrorCallback) {
          this.onErrorCallback(error);
        }
        throw error;
      }
      
      // Debug: Show partial credentials being used
      console.log('[HumeVoiceService] Using credentials:', {
        apiKeyPrefix: apiKey?.substring(0, 10) + '...',
        apiKeyLength: apiKey?.length,
        secretKeyPrefix: secretKey?.substring(0, 10) + '...',
        secretKeyLength: secretKey?.length,
        source: credentials.apiKey === process.env.REACT_APP_HUME_API_KEY ? 'environment' : 'override'
      });
      
      // Initialize client with API key
      this.client = new HumeClient({
        apiKey,
        secretKey
      });
      
      console.log('[HumeVoiceService] Client initialized:', {
        hasClient: !!this.client,
        clientType: typeof this.client
      });
      
      // Connect using the SDK's chat interface
      console.log('[HumeVoiceService] Calling client.empathicVoice.chat.connect...');
      
      try {
        // Try without version to see if that helps
        const connectOptions: any = {
          configId: configToUse,
        };
        
        console.log('[HumeVoiceService] Connect options:', connectOptions);
        
        this.socket = await this.client.empathicVoice.chat.connect(connectOptions);
      } catch (connectError: any) {
        console.error('[HumeVoiceService] Socket connection failed:', {
          error: connectError,
          message: connectError?.message,
          status: connectError?.status,
          statusText: connectError?.statusText,
          response: connectError?.response,
          stack: connectError?.stack,
          configId: configToUse,
          apiKeyFirst5: apiKey?.substring(0, 5) + '...',
          apiKeyLength: apiKey?.length
        });
        
        // Check if it's an auth error
        if (connectError?.status === 401 || connectError?.message?.includes('401')) {
          throw new Error('Authentication failed. Please check your Hume API credentials. API key starts with: ' + apiKey?.substring(0, 5));
        }
        
        // Check if it's a config not found error
        if (connectError?.message?.includes('does not exist')) {
          throw new Error(`Config ID ${configToUse} not found. This config may belong to a different Hume account. Current API key starts with: ${apiKey?.substring(0, 5)}`);
        }
        
        // Check if it's a network error
        if (connectError?.message?.includes('network') || connectError?.message?.includes('fetch')) {
          throw new Error('Network error. Please check your internet connection.');
        }
        
        throw connectError;
      }
      
      console.log('[HumeVoiceService] Socket created:', {
        socket: !!this.socket,
        socketType: typeof this.socket,
        hasMethod: typeof this.socket?.sendAudioInput,
        socketKeys: this.socket ? Object.keys(this.socket) : [],
        socketPrototype: this.socket ? Object.getPrototypeOf(this.socket).constructor.name : 'N/A'
      });

      // Set up microphone streaming
      await this.setupMicrophoneStreaming();

      // Try to find the actual WebSocket
      let actualWebSocket: any = null;
      if (this.socket) {
        // Check common property names for the underlying WebSocket
        const possibleSocketProps = ['_socket', 'socket', 'ws', '_ws', 'webSocket', '_webSocket'];
        for (const prop of possibleSocketProps) {
          if ((this.socket as any)[prop]) {
            actualWebSocket = (this.socket as any)[prop];
            console.log(`[HumeVoiceService] Found WebSocket at property: ${prop}`);
            break;
          }
        }
        
        // If not found, try to find it in the prototype chain
        if (!actualWebSocket) {
          const proto = Object.getPrototypeOf(this.socket);
          for (const prop of possibleSocketProps) {
            if (proto[prop]) {
              actualWebSocket = proto[prop];
              console.log(`[HumeVoiceService] Found WebSocket in prototype at property: ${prop}`);
              break;
            }
          }
        }
      }

      // Wait for the underlying WebSocket to be fully open
      // The Hume SDK socket might have an internal WebSocket that needs to be ready
      const waitForSocketOpen = async (maxAttempts = 50): Promise<boolean> => {
        for (let i = 0; i < maxAttempts; i++) {
          try {
            let socketState: number | undefined;
            
            // Try multiple ways to get the socket state
            if (actualWebSocket && typeof actualWebSocket.readyState === 'number') {
              socketState = actualWebSocket.readyState;
            } else if ((this.socket as any)._socket?.readyState !== undefined) {
              socketState = (this.socket as any)._socket.readyState;
            } else if ((this.socket as any).readyState !== undefined) {
              socketState = (this.socket as any).readyState;
            }
            
            console.log(`[HumeVoiceService] Checking socket state (attempt ${i + 1}/${maxAttempts}):`, socketState, 'actualWebSocket:', !!actualWebSocket);
            
            if (socketState === 1) { // 1 = WebSocket.OPEN
              return true;
            }
            
            // If we can't find the readyState but have waited a bit, assume it's ready
            if (i > 10 && socketState === undefined) {
              console.log('[HumeVoiceService] Cannot determine socket state, assuming ready after wait');
              return true;
            }
          } catch (e) {
            console.log('[HumeVoiceService] Could not check socket readyState, waiting...', e);
          }
          
          // Wait 100ms before next check
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return false;
      };

      // Wait for socket to be fully open
      const socketReady = await waitForSocketOpen();
      if (!socketReady) {
        console.warn('[HumeVoiceService] Socket did not reach OPEN state after 5 seconds, proceeding anyway');
      }
      
      this.isConnected = true;
      this.hasConnectedBefore = true; // Set flag
      console.log('[HumeVoiceService] Socket connected successfully and ready');
      
      // Set up event handlers
      this.setupEventHandlers();
      
      // Notify connection is ready
      if (this.onOpenCallback) {
        this.onOpenCallback();
      }
    } catch (error: any) {
      console.error('[HumeVoiceService] Failed to connect:', {
        error: error,
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      
      // Set connection state to false
      this.isConnected = false;
      
      // If this is a reconnect attempt, increment the counter
      if (this.reconnectAttempts > 0) {
        // The reconnect logic will handle retries
        throw error;
      }
      
      throw error;
    }
  }

  private async setupMicrophoneStreaming(): Promise<void> {
    try {
      console.log('[HumeVoiceService] Setting up microphone streaming...');
      
      // Get supported MIME type
      const mimeTypeResult = getBrowserSupportedMimeType();
      this.mimeType = mimeTypeResult.success ? mimeTypeResult.mimeType : MimeType.WEBM;
      console.log('[HumeVoiceService] Using MIME type:', this.mimeType);
      
      // Get audio stream with echo cancellation, noise suppression, etc.
      this.audioStream = await getAudioStream();
      ensureSingleValidAudioTrack(this.audioStream);
      console.log('[HumeVoiceService] Audio stream obtained');
      
      // Create MediaRecorder for real-time streaming
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: this.mimeType,
      });
      
      // Send audio data in real-time as it's recorded
      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && this.socket && this.isConnected) {
          try {
            // Convert blob to base64
            const base64Audio = await blobToBase64(event.data);
            // Send to Hume
            await this.socket.sendAudioInput({ data: base64Audio });
          } catch (error) {
            console.error('[HumeVoiceService] Error sending audio:', error);
          }
        }
      };
      
      // Start recording with small time slices for low latency
      this.mediaRecorder.start(100); // 100ms chunks for real-time streaming
      console.log('[HumeVoiceService] Microphone streaming started');
      
    } catch (error) {
      console.error('[HumeVoiceService] Error setting up microphone:', error);
      throw new Error('Failed to set up microphone streaming');
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) {
      console.error('[HumeVoiceService] Cannot setup event handlers: socket is null');
      return;
    }

    console.log('[HumeVoiceService] Setting up event handlers');
    
    this.socket.on('message', (message: any) => {
      console.log('[HumeVoiceService] Received message:', message);
      console.log('[HumeVoiceService] Message type:', message.type);
      console.log('[HumeVoiceService] Message keys:', Object.keys(message));
      
      // Log ALL message types to understand what we're getting
      console.log('[HumeVoiceService] 📨 FULL MESSAGE:', JSON.stringify(message, null, 2));
      
      // Log specific details for debugging audio issues
      if (message.type === 'assistant_message') {
        console.log('[HumeVoiceService] Assistant message has data?', !!message.data);
        console.log('[HumeVoiceService] Assistant message keys:', message.message ? Object.keys(message.message) : 'no message key');
      }
      
      switch (message.type) {
        case 'audio_output':
          console.log('[HumeVoiceService] 🎵 Received audio_output');
          if (message.data && this.onAudioCallback) {
            try {
              // Use Hume SDK's convertBase64ToBlob if available, otherwise fallback
              const audioBlob = typeof convertBase64ToBlob === 'function' 
                ? convertBase64ToBlob(message.data)
                : base64ToBlob(message.data, 'audio/wav');
              console.log('[HumeVoiceService] Created audio blob:', audioBlob.size, 'type:', audioBlob.type);
              this.onAudioCallback(audioBlob);
            } catch (error) {
              console.error('[HumeVoiceService] Error creating audio blob:', error);
            }
          } else {
            console.warn('[HumeVoiceService] ⚠️ No audio data in audio_output message or no callback set');
          }
          break;

        case 'assistant_message':
          if (message.message?.content && this.onMessageCallback) {
            console.log('[HumeVoiceService] Assistant message:', message.message.content);
            console.log('[HumeVoiceService] Invoking onMessageCallback with message type:', message.type);
            this.onMessageCallback?.(message);
            console.log('[HumeVoiceService] onMessageCallback invoked.');
          }
          // Extract emotion data from prosody scores in assistant messages
          if (message.models?.prosody?.scores && this.onEmotionCallback) {
            console.log('[HumeVoiceService] Found emotion data in assistant message');
            const emotions = this.convertEmotions(message.models.prosody.scores);
            console.log('[HumeVoiceService] Converted emotions:', emotions);
            this.onEmotionCallback(emotions);
          }
          break;

        case 'assistant_end':
          console.log('[HumeVoiceService] Assistant finished');
          if (this.onAssistantEndCallback) {
            this.onAssistantEndCallback();
          }
          break;

        case 'user_message':
          if (message.message?.content && this.onUserMessageCallback) {
            console.log('[HumeVoiceService] User message:', message.message.content);
            this.onUserMessageCallback(message.message.content);
          }
          break;

        case 'user_interruption':
          console.log('[HumeVoiceService] User interruption');
          if (this.onUserInterruptionCallback) {
            this.onUserInterruptionCallback();
          }
          break;

        case 'emotion_features':
          if (message.models?.prosody?.scores && this.onEmotionCallback) {
            const emotions = this.convertEmotions(message.models.prosody.scores);
            this.onEmotionCallback(emotions);
          }
          break;

        case 'error':
          console.error('[HumeVoiceService] Error message:', message);
          if (message.message?.includes('too many active chats')) {
            console.error('[HumeVoiceService] Too many active chats - consider closing old connections');
            if (this.onErrorCallback) {
              this.onErrorCallback(new Error('Too many active chats. Please close other sessions and try again.'));
            }
          }
          break;
      }
    });

    this.socket.on('error', (error: any) => {
      console.error('[HumeVoiceService] Socket error:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    });

    this.socket.on('close', (code: number, reason: Buffer) => {
      const reasonString = reason ? reason.toString() : 'No reason provided';
      console.log(`[HumeVoiceService] WebSocket closed. Code: ${code}, Reason: ${reasonString}`);
      this.isConnected = false;
      console.log('[HumeVoiceService] Invoking onCloseCallback...');
      if (this.onCloseCallback) {
        this.onCloseCallback(code, reasonString);
      }
      console.log('[HumeVoiceService] onCloseCallback invoked.');
      
      // Don't reconnect if we never successfully connected
      if (this.reconnectAttempts === 0 && !this.hasConnectedBefore) {
        console.error('[HumeVoiceService] Initial connection failed. Not attempting reconnect.');
        return;
      }
      
      // Attempt to reconnect if not explicitly disconnected
      if (!this.explicitlyClosed) {
        if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
          const delay = this.BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts);
          this.reconnectAttempts++;
          console.log(`[HumeVoiceService] Unexpected close. Attempting reconnect #${this.reconnectAttempts} in ${delay / 1000}s...`);
          this.reconnectTimeoutId = setTimeout(() => {
            this.reconnect();
          }, delay);
        } else {
          console.error(`[HumeVoiceService] Max reconnect attempts (${this.MAX_RECONNECT_ATTEMPTS}) reached. Stopping reconnection attempts.`);
          this.onErrorCallback?.(new Error('Max reconnect attempts reached. Please check your connection or Hume service status.'));
        }
      } else {
        this.reconnectAttempts = 0; // Reset if explicitly closed
      }
    });
  }

  public async reconnect(): Promise<void> {
    console.log(`[HumeVoiceService] reconnect called. explicitlyClosed: ${this.explicitlyClosed}, attempts: ${this.reconnectAttempts}`);
    if (this.explicitlyClosed) {
      console.log('[HumeVoiceService] Reconnect aborted, connection was explicitly closed.');
      this.reconnectAttempts = 0; // Reset attempts
      if (this.reconnectTimeoutId) {
        clearTimeout(this.reconnectTimeoutId);
        this.reconnectTimeoutId = null;
      }
      return;
    }

    // Clear any existing timeout just in case reconnect is called manually or from a different path
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    console.log('[HumeVoiceService] Attempting to connect via reconnect method...');
    if (this.currentConfigId) {
      try {
        await this.connect(this.currentConfigId); // connect will reset explicitlyClosed to false
        // Successful connection will reset reconnectAttempts in 'on.open'
        console.log('[HumeVoiceService] Connection attempt via reconnect method successful or socket events will handle further.');
      } catch (error) {
        console.error('[HumeVoiceService] Connection attempt via reconnect method failed directly:', error);
        // This catch block handles errors thrown directly by the this.connect call itself (e.g., SDK client error before socket events)
        // The 'close' event handler (if the socket was ever created and then closed) will manage scheduled retries.
        // If connect() fails *before* attaching 'close', we need to ensure retry logic is still triggered.
        if (!this.explicitlyClosed) { // Check again, as connect() might have been interrupted
          // If reconnectAttempts wasn't incremented by a 'close' event, ensure it's in a state to retry
          // This path is tricky because 'close' is the main driver for scheduled retries.
          // If 'connect' fails very early, 'close' might not fire. We might need to manually trigger the retry scheduling from here.
          console.warn('[HumeVoiceService] connect() threw directly. The on.close handler might not have triggered a retry. Checking if manual retry schedule is needed.');
          // If no reconnect is scheduled and we haven't hit max attempts, schedule one.
          // This is a fallback. Ideally, the SDK's socket 'close' or 'error' events should always lead to our 'close' handler.
          if (!this.reconnectTimeoutId && this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
            const delay = this.BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts);
            this.reconnectAttempts++; // Increment here as 'close' didn't
            console.log(`[HumeVoiceService] Fallback: Scheduling reconnect #${this.reconnectAttempts} in ${delay / 1000}s due to direct connect() error.`);
            this.reconnectTimeoutId = setTimeout(() => {
              this.reconnect();
            }, delay);
          } else if (!this.reconnectTimeoutId && this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
            console.error(`[HumeVoiceService] Max reconnect attempts reached after direct connect() failure. No retry scheduled.`);
            this.onErrorCallback?.(new Error('Max reconnect attempts reached after direct connect failure.'));
          }
        }
        // Do not re-throw the error here if retries are being handled, otherwise it might propagate up and stop further retries.
        // this.onErrorCallback?.(new Error(`Reconnect failed: ${error instanceof Error ? error.message : String(error)}`));
      }
    } else {
      const errMsg = '[HumeVoiceService] No config ID available to reconnect with.';
      console.error(errMsg);
      this.onErrorCallback?.(new Error(errMsg));
    }
  }

  public disconnect(): void {
    console.log('[HumeVoiceService] Disconnect called - cleaning up connection...');
    
    // Clear any pending reconnect attempts
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    this.reconnectAttempts = 0; // Reset attempts on explicit disconnect
    console.log('[HumeVoiceService] Disconnecting explicitly...');
    this.explicitlyClosed = true;
    
    // Stop microphone streaming
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }
    
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    
    // Force close the websocket if it exists
    if (this.socket) {
      try {
        // Remove event listeners to prevent any callbacks during close
        if (typeof this.socket.removeAllListeners === 'function') {
          this.socket.removeAllListeners();
        }
        
        // Force close with code 1000 (normal closure)
        if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
          this.socket.close(1000, 'User initiated disconnect');
        }
        
        // Set to null to ensure garbage collection
        this.socket = null;
      } catch (error) {
        console.error('[HumeVoiceService] Error during socket cleanup:', error);
      }
    }
    
    // Update state
    this.isConnected = false;
    
    // Call close callback if set
    if (this.onCloseCallback) {
      this.onCloseCallback(1000, 'User initiated disconnect');
    }
    
    console.log('[HumeVoiceService] Disconnect complete');
  }

  private handleMessage(message: any): void {
    console.log('[HumeVoiceService] Received message type:', message.type);
    console.log('[HumeVoiceService] Message keys:', Object.keys(message));
    
    // Log ALL message types to understand what we're getting
    console.log('[HumeVoiceService] 📨 FULL MESSAGE:', JSON.stringify(message, null, 2));
    
    // Log specific details for debugging audio issues
    if (message.type === 'assistant_message') {
      console.log('[HumeVoiceService] Assistant message has data?', !!message.data);
      console.log('[HumeVoiceService] Assistant message keys:', message.message ? Object.keys(message.message) : 'no message key');
    }
    
    switch (message.type) {
      case 'audio_output':
        console.log('[HumeVoiceService] 🎵 Received audio_output');
        if (message.data && this.onAudioCallback) {
          try {
            // Use Hume SDK's convertBase64ToBlob if available, otherwise fallback
            const audioBlob = typeof convertBase64ToBlob === 'function' 
              ? convertBase64ToBlob(message.data)
              : base64ToBlob(message.data, 'audio/wav');
            console.log('[HumeVoiceService] Created audio blob:', audioBlob.size, 'type:', audioBlob.type);
            this.onAudioCallback(audioBlob);
          } catch (error) {
            console.error('[HumeVoiceService] Error creating audio blob:', error);
          }
        } else {
          console.warn('[HumeVoiceService] ⚠️ No audio data in audio_output message or no callback set');
        }
        break;

      case 'assistant_message':
        if (message.message?.content && this.onMessageCallback) {
          console.log('[HumeVoiceService] Assistant message:', message.message.content);
          console.log('[HumeVoiceService] Invoking onMessageCallback with message type:', message.type);
          this.onMessageCallback?.(message);
          console.log('[HumeVoiceService] onMessageCallback invoked.');
        }
        // Extract emotion data from prosody scores in assistant messages
        if (message.models?.prosody?.scores && this.onEmotionCallback) {
          console.log('[HumeVoiceService] Found emotion data in assistant message');
          const emotions = this.convertEmotions(message.models.prosody.scores);
          console.log('[HumeVoiceService] Converted emotions:', emotions);
          this.onEmotionCallback(emotions);
        }
        break;

      case 'assistant_end':
        console.log('[HumeVoiceService] Assistant finished');
        if (this.onAssistantEndCallback) {
          this.onAssistantEndCallback();
        }
        break;

      case 'user_message':
        if (message.message?.content && this.onUserMessageCallback) {
          console.log('[HumeVoiceService] User message:', message.message.content);
          this.onUserMessageCallback(message.message.content);
        }
        break;

      case 'user_interruption':
        console.log('[HumeVoiceService] User interruption');
        if (this.onUserInterruptionCallback) {
          this.onUserInterruptionCallback();
        }
        break;

      case 'emotion_features':
        if (message.models?.prosody?.scores && this.onEmotionCallback) {
          const emotions = this.convertEmotions(message.models.prosody.scores);
          this.onEmotionCallback(emotions);
        }
        break;

      case 'error':
        console.error('[HumeVoiceService] Error message:', message);
        if (message.message?.includes('too many active chats')) {
          console.error('[HumeVoiceService] Too many active chats - consider closing old connections');
          if (this.onErrorCallback) {
            this.onErrorCallback(new Error('Too many active chats. Please close other sessions and try again.'));
          }
        }
        break;
    }
  }

  private convertEmotions(scores: any): EmotionalState {
    const emotions: EmotionalState = {};
    
    // Map Hume emotion names to our simplified set
    // Using the highest scoring relevant emotions
    if (scores.joy !== undefined) emotions.joy = scores.joy;
    if (scores.Joy !== undefined) emotions.joy = scores.Joy;
    if (scores.sadness !== undefined) emotions.sadness = scores.sadness;
    if (scores.Sadness !== undefined) emotions.sadness = scores.Sadness;
    if (scores.anger !== undefined) emotions.anger = scores.anger;
    if (scores.Anger !== undefined) emotions.anger = scores.Anger;
    if (scores.fear !== undefined) emotions.fear = scores.fear;
    if (scores.Fear !== undefined) emotions.fear = scores.Fear;
    if (scores.surprise !== undefined) emotions.surprise = scores.surprise;
    if (scores.Surprise !== undefined) emotions.surprise = scores.Surprise;
    if (scores.disgust !== undefined) emotions.disgust = scores.disgust;
    if (scores.Disgust !== undefined) emotions.disgust = scores.Disgust;
    if (scores.contempt !== undefined) emotions.contempt = scores.contempt;
    if (scores.Contempt !== undefined) emotions.contempt = scores.Contempt;
    
    // Also capture some key prosody features that map to emotions
    if (scores.amusement !== undefined && scores.amusement > 0.1) {
      emotions.joy = Math.max(emotions.joy || 0, scores.amusement);
    }
    if (scores.excitement !== undefined && scores.excitement > 0.1) {
      emotions.joy = Math.max(emotions.joy || 0, scores.excitement);
    }
    if (scores.anxiety !== undefined && scores.anxiety > 0.1) {
      emotions.fear = Math.max(emotions.fear || 0, scores.anxiety);
    }
    
    console.log('[HumeVoiceService] Emotion conversion - Input:', JSON.stringify(scores).substring(0, 200));
    console.log('[HumeVoiceService] Emotion conversion - Output:', emotions);
    
    return emotions;
  }

  async sendAudio(audioBlob: Blob): Promise<void> {
    console.log('[HumeVoiceService] sendAudio called with blob size:', audioBlob.size, 'type:', audioBlob.type);
    
    if (!this.checkConnection()) {
      console.error('[HumeVoiceService] Not connected or not ready, socket:', this.socket, 'isConnected:', this.isConnected);
      return;
    }

    // Additional safety check - ensure socket has a sendAudioInput method
    if (!this.socket || typeof this.socket.sendAudioInput !== 'function') {
      console.error('[HumeVoiceService] Socket missing sendAudioInput method');
      return;
    }

    // Check if the underlying WebSocket is actually open
    // The Hume SDK socket might have an internal WebSocket we need to check
    try {
      // Try to access the socket's state - this might throw if socket is not ready
      let socketState: number | undefined;
      
      // Try multiple ways to get the socket state
      const possibleSocketProps = ['_socket', 'socket', 'ws', '_ws', 'webSocket', '_webSocket'];
      for (const prop of possibleSocketProps) {
        const ws = (this.socket as any)[prop];
        if (ws && typeof ws.readyState === 'number') {
          socketState = ws.readyState;
          break;
        }
      }
      
      // Fallback to direct readyState
      if (socketState === undefined && (this.socket as any).readyState !== undefined) {
        socketState = (this.socket as any).readyState;
      }
      
      console.log('[HumeVoiceService] Socket readyState:', socketState);
      
      if (socketState !== undefined && socketState !== 1) { // 1 = WebSocket.OPEN
        console.error('[HumeVoiceService] Socket is not in OPEN state, readyState:', socketState);
        
        // If socket is CONNECTING (0), wait a bit and retry once
        if (socketState === 0) {
          console.log('[HumeVoiceService] Socket is CONNECTING, waiting 500ms and retrying...');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Check again
          let newSocketState: number | undefined;
          for (const prop of possibleSocketProps) {
            const ws = (this.socket as any)[prop];
            if (ws && typeof ws.readyState === 'number') {
              newSocketState = ws.readyState;
              break;
            }
          }
          if (newSocketState === undefined && (this.socket as any).readyState !== undefined) {
            newSocketState = (this.socket as any).readyState;
          }
          
          if (newSocketState !== 1) {
            console.error('[HumeVoiceService] Socket still not ready after wait, aborting');
            return;
          }
          console.log('[HumeVoiceService] Socket is now ready after wait');
        } else {
          return;
        }
      }
    } catch (e) {
      console.log('[HumeVoiceService] Could not check socket readyState, proceeding anyway');
    }

    let base64Data: string = '';
    try {
      // Use Hume SDK's convertBlobToBase64 utility
      console.log('[HumeVoiceService] Converting blob to base64 using SDK utility...');
      base64Data = await blobToBase64(audioBlob);
      
      console.log('[HumeVoiceService] Sending audio data, base64 length:', base64Data.length);
      console.log('[HumeVoiceService] Socket state:', {
        socket: !!this.socket,
        isConnected: this.isConnected,
        socketType: typeof this.socket
      });

      // Use SDK's sendAudioInput method
      await this.socket.sendAudioInput({ data: base64Data });
      console.log('[HumeVoiceService] Audio sent successfully');
    } catch (error: any) {
      console.error('[HumeVoiceService] Error sending audio:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        error: error,
        socketConnected: this.checkConnection(),
        base64Length: base64Data?.length
      });
      throw error;
    }
  }

  sendMessage(text: string): void {
    if (!this.checkConnection()) {
      console.error('[HumeVoiceService] Not connected');
      return;
    }

    try {
      // Use SDK's sendUserInput method
      this.socket.sendUserInput(text);
      console.log('[HumeVoiceService] Sent user input:', text);
    } catch (error) {
      console.error('[HumeVoiceService] Error sending message:', error);
    }
  }

  // Check if the connection is active
  checkConnection(): boolean {
    const isReady = this.isConnected && this.socket && typeof this.socket.sendAudioInput === 'function';
    console.log('[HumeVoiceService] Connection check:', {
      isConnected: this.isConnected,
      hasSocket: !!this.socket,
      hasMethod: this.socket ? typeof this.socket.sendAudioInput === 'function' : false,
      isReady
    });
    return isReady;
  }

  getConnectionStatus(): { connected: boolean; configId?: string; hasClient: boolean } {
    return {
      connected: !!this.client,
      configId: this.currentConfigId,
      hasClient: !!this.client
    };
  }

  // Callback setters
  onAudio(callback: (audioBlob: Blob) => void): void {
    this.onAudioCallback = callback;
  }

  onMessage(callback: (message: string) => void): void {
    this.onMessageCallback = callback;
  }

  onEmotion(callback: (emotions: EmotionalState) => void): void {
    this.onEmotionCallback = callback;
  }

  onAssistantEnd(callback: () => void): void {
    this.onAssistantEndCallback = callback;
  }

  onUserMessage(callback: (transcript: string) => void): void {
    this.onUserMessageCallback = callback;
  }

  onUserInterruption(callback: () => void): void {
    this.onUserInterruptionCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }


  // Additional methods
  pauseAudioInput(): void {
    if (this.checkConnection()) {
      this.socket.sendPauseAssistantMessage();
    }
  }

  resumeAudioInput(): void {
    if (this.checkConnection()) {
      this.socket.sendResumeAssistantMessage();
    }
  }

  interruptAssistant(): void {
    if (this.checkConnection()) {
      this.socket.clearResponseAudio();
    }
  }
}

// Create and export singleton instance for backwards compatibility
const humeVoiceService = new HumeVoiceService();
export default humeVoiceService;
