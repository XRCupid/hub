import { HumeClient, convertBase64ToBlob, getAudioStream, ensureSingleValidAudioTrack, getBrowserSupportedMimeType, MimeType } from 'hume';
import { getHumeCredentials } from './humeCredentialsOverride';
import { getNuclearCredentials } from './nuclearHumeOverride';

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

export interface TranscriptSegment {
  timestamp: number;
  speaker: string;
  text: string;
  emotions: { name: string; score: number }[]; // Combined emotions (for backward compatibility)
  prosodyEmotions?: { name: string; score: number }[]; // Voice-based emotions
  facialEmotions?: { name: string; score: number }[]; // Face-based emotions
  dominantEmotion?: string;
  emotionIntensity?: number;
  prosodyData?: any; // Raw prosody data from Hume
}

export class HumeVoiceService {
  private static connectionCount = 0; // Track total connections for monitoring
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3; // Reduced from 5 to 3 for safety
  private readonly BASE_RECONNECT_DELAY_MS = 5000; // Increased from 2000 to 5000ms
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private reconnectTimer?: NodeJS.Timeout;
  private isReconnecting: boolean = false;
  private connectionPromise?: Promise<void>;
  private socketReadyPromise?: Promise<void>;
  private socketReadyResolve?: () => void;
  private client: HumeClient | null = null;
  private socket: any; // Consider typing this more strictly if possible, e.g., ChatSocket from '@humeai/voice/dist/src/socket'
  private isConnected: boolean = false;
  private hasConnectedBefore: boolean = false; // New
  private isDisconnecting: boolean = false;
  private onAudioCallback?: (audioBlob: Blob) => void;
  private onMessageCallback?: (message: any) => void; // Type changed
  private onEmotionCallback?: (emotions: any[]) => void;
  private onAssistantEndCallback?: () => void;
  private onUserMessageCallback?: (transcript: string) => void;
  private onUserInterruptionCallback?: () => void;
  private onErrorCallback?: (error: Error) => void;
  private onOpenCallback?: () => void; // New
  private onCloseCallback?: (code: number, reason: string) => void; // New
  private onTranscriptCallback?: (transcript: TranscriptSegment) => void;
  private explicitlyClosed: boolean = false; // New
  private currentConfigId: string | undefined; // New

  private audioStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private mimeType: MimeType = MimeType.WEBM;

  private lastEmotions: { name: string; score: number }[] = [];
  private lastProsodyEmotions: { name: string; score: number }[] = [];
  private lastFacialEmotions: { name: string; score: number }[] = [];
  private transcriptHistory: TranscriptSegment[] = [];

  private globalCleanupHandlers?: () => void;

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

  public setOnEmotionCallback(callback: (emotions: any[]) => void): void {
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

  public setOnTranscriptCallback(callback: (transcript: TranscriptSegment) => void): void {
    this.onTranscriptCallback = callback;
  }

  async connect(configId?: string): Promise<void> {
    console.log('[HumeVoiceService] 🔌 Starting connection...');
    
    try {
      // NUCLEAR OVERRIDE - YOUR CREDENTIALS ONLY
      let credentials;
      try {
        credentials = getNuclearCredentials();
        console.log('[HumeVoiceService] 🚨 USING NUCLEAR OVERRIDE CREDENTIALS');
      } catch (e) {
        // Fallback to original override system
        credentials = getHumeCredentials();
        console.log('[HumeVoiceService] ⚠️ Nuclear override failed, using standard override');
      }
      
      const { apiKey, secretKey, configId: overrideConfigId } = credentials;
      
      // CRITICAL: Prevent multiple connections
      if (this.client) {
        console.warn('[HumeVoiceService] Already connected! Disconnecting first to prevent connection leak.');
        await this.disconnect();
      }
      
      // Store the config ID
      this.currentConfigId = configId || overrideConfigId;
      
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
      
      const configToUse = this.currentConfigId || process.env.REACT_APP_HUME_CONFIG_ID || '';
      this.currentConfigId = configToUse; // Store for reconnect
      
      console.log('[HumeVoiceService] Using config ID:', configToUse);
      
      // Validate credentials
      
      // Check if API keys are available
      if (!apiKey || !secretKey) {
        // HARDCODE AS FINAL FALLBACK
        const HARDCODED_API_KEY = 'm3KaINwHsH55rJNO6zr2kIEAWvOimYeLTon3OriOXWJeCxCl';
        const HARDCODED_SECRET_KEY = 'IWtKuDbybQZLI0qWWPJn2M1iW3wrKGiQhmoQcTvIGJD2iBhDG3eRD35969FzcjNT';
        
        console.error('[HumeVoiceService] ❌ No API keys found! Using hardcoded fallback');
        this.client = new HumeClient({
          apiKey: HARDCODED_API_KEY,
          secretKey: HARDCODED_SECRET_KEY
        });
      } else {
        // Create Hume client with credentials
        this.client = new HumeClient({
          apiKey: apiKey,
          secretKey: secretKey
        });
      }
      
      console.log('[HumeVoiceService] Client initialized:', {
        hasClient: !!this.client,
        clientType: typeof this.client
      });
      
      // Connect using the SDK's chat interface
      console.log('[HumeVoiceService] Calling client.empathicVoice.chat.connect...');
      
      const connectOptions: any = {
        configId: configToUse,
      };
      
      console.log('[HumeVoiceService] Connect options:', connectOptions);
      
      this.socket = await this.client.empathicVoice.chat.connect(connectOptions);
      
      // Create a promise that resolves when socket is actually ready
      this.socketReadyPromise = new Promise((resolve) => {
        this.socketReadyResolve = resolve;
      });
      
      // Set up event handlers immediately after creating socket
      console.log('[HumeVoiceService] Setting up event handlers');
      
      this.socket.on('open', () => {
        console.log('[HumeVoiceService] 🟢 Socket opened');
        this.isConnected = true;
        this.hasConnectedBefore = true;
        
        // Resolve the socket ready promise
        if (this.socketReadyResolve) {
          this.socketReadyResolve();
          this.socketReadyResolve = undefined;
        }
        
        // Set up microphone streaming after connection is established
        // Add a longer delay to ensure socket is fully ready
        setTimeout(() => {
          // Double-check socket is still connected before setting up microphone
          const underlyingSocket = this.getUnderlyingWebSocket();
          if (!this.isConnected || !underlyingSocket || underlyingSocket.readyState !== WebSocket.OPEN) {
            console.warn('[HumeVoiceService] Socket not ready after open event, skipping microphone setup');
            return;
          }
          
          this.setupMicrophoneStreaming().then(() => {
            console.log('[HumeVoiceService] Microphone streaming setup complete');
          }).catch(error => {
            console.error('[HumeVoiceService] Failed to setup microphone after connection:', error);
          });
        }, 500); // 500ms delay to ensure socket is fully ready
        
        if (this.onOpenCallback) {
          this.onOpenCallback();
        }
      });
      
      this.socket.on('message', (message: any) => {
        console.log('[HumeVoiceService] 📨 Received message:', {
          type: message.type,
          hasTranscript: !!message.transcript,
          hasProsody: !!message.prosody,
          hasModels: !!message.models,
          messageKeys: Object.keys(message)
        });
        
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
            }
            break;

          case 'assistant_message':
            console.log('[HumeVoiceService] 🤖 Assistant message:', {
              content: message.message?.content,
              hasProsody: !!message.models?.prosody
            });
            
            if (message.message?.content && this.onMessageCallback) {
              this.onMessageCallback?.(message);
            }
            
            // Create transcript segment for assistant
            if (message.message?.content && this.onTranscriptCallback) {
              console.log('[HumeVoiceService] 📝 Creating assistant transcript segment');
              const segment: TranscriptSegment = {
                timestamp: Date.now(),
                speaker: 'Assistant',
                text: message.message.content,
                emotions: this.lastEmotions || [],
                prosodyEmotions: this.lastProsodyEmotions || [],
                facialEmotions: this.lastFacialEmotions || [],
                dominantEmotion: this.lastEmotions?.[0]?.name,
                emotionIntensity: this.lastEmotions?.[0]?.score / 100,
                prosodyData: message.models?.prosody
              };
              this.transcriptHistory.push(segment);
              this.onTranscriptCallback(segment);
            }
            
            // Extract emotion data from prosody scores
            if (message.models?.prosody?.scores && this.onEmotionCallback) {
              console.log('[HumeVoiceService] 🎭 Found prosody emotion data');
              const emotions = this.convertEmotionsToArray(message.models.prosody.scores);
              console.log('[HumeVoiceService] Converted prosody emotions:', emotions.slice(0, 5));
              this.lastProsodyEmotions = emotions;
              this.lastEmotions = emotions;
              this.onEmotionCallback(emotions);
            }
            break;

          case 'user_message':
            console.log('[HumeVoiceService] 👤 User message:', {
              content: message.message?.content,
              hasProsody: !!message.models?.prosody
            });
            
            if (message.message?.content) {
              if (this.onUserMessageCallback) {
                this.onUserMessageCallback(message.message.content);
              }
              
              // Create transcript segment for user
              if (this.onTranscriptCallback) {
                console.log('[HumeVoiceService] 📝 Creating user transcript segment');
                const segment: TranscriptSegment = {
                  timestamp: Date.now(),
                  speaker: 'User',
                  text: message.message.content,
                  emotions: this.lastEmotions || [],
                  prosodyEmotions: this.lastProsodyEmotions || [],
                  facialEmotions: this.lastFacialEmotions || [],
                  dominantEmotion: this.lastEmotions?.[0]?.name,
                  emotionIntensity: this.lastEmotions?.[0]?.score / 100,
                  prosodyData: message.models?.prosody
                };
                this.transcriptHistory.push(segment);
                this.onTranscriptCallback(segment);
              }
            }
            break;

          case 'user_interruption':
            console.log('[HumeVoiceService] 🛑 User interruption');
            if (this.onUserInterruptionCallback) {
              this.onUserInterruptionCallback();
            }
            break;

          case 'emotion_features':
            console.log('[HumeVoiceService] 🎭 Emotion features received');
            if (message.models?.prosody?.scores && this.onEmotionCallback) {
              const emotions = this.convertEmotionsToArray(message.models.prosody.scores);
              this.lastProsodyEmotions = emotions;
              this.lastEmotions = emotions;
              this.onEmotionCallback(emotions);
            }
            break;

          case 'error':
            console.error('[HumeVoiceService] ❌ Error message:', message);
            if (message.message?.includes('too many active chats')) {
              console.error('[HumeVoiceService] Too many active chats - consider closing old connections');
              if (this.onErrorCallback) {
                this.onErrorCallback(new Error('Too many active chats. Please close other sessions and try again.'));
              }
            }
            break;

          default:
            console.log('[HumeVoiceService] 🔍 Unknown message type:', message.type);
        }
      });

      this.socket.on('error', (error: any) => {
        console.error('[HumeVoiceService] ❌ Socket error:', error);
        
        // Clear socket ready promise
        this.socketReadyPromise = undefined;
        this.socketReadyResolve = undefined;
        
        if (this.onErrorCallback) {
          this.onErrorCallback(error);
        }
        
        // Auto-cleanup on error
        if (!this.isDisconnecting) {
          console.log('[HumeVoiceService] Socket error, cleaning up...');
          this.cleanup();
        }
      });

      this.socket.on('close', (event: any) => {
        console.log('[HumeVoiceService] 🔴 Socket closed:', event);
        this.isConnected = false;
        
        // Clear socket ready promise
        this.socketReadyPromise = undefined;
        this.socketReadyResolve = undefined;
        
        if (this.onCloseCallback) {
          this.onCloseCallback(event.code, event.reason);
        }
        
        // Auto-cleanup on unexpected close
        if (!this.isDisconnecting) {
          console.log('[HumeVoiceService] Unexpected socket close, cleaning up...');
          this.cleanup();
        }
      });
      
      // Wait for socket to be ready (the 'open' event will set isConnected = true)
      let attempts = 0;
      while (!this.isConnected && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!this.isConnected) {
        console.warn('[HumeVoiceService] Socket did not reach connected state after 5 seconds');
      } else {
        console.log('[HumeVoiceService] Socket is connected and ready');
      }
      
      // Add global cleanup handlers
      this.setupGlobalCleanupHandlers();
      
      // Wait for socket to be ready before returning
      if (this.socketReadyPromise) {
        console.log('[HumeVoiceService] Waiting for socket to be ready...');
        await this.socketReadyPromise;
        console.log('[HumeVoiceService] Socket is ready');
      }
      
    } catch (error) {
      console.error('[HumeVoiceService] Failed to connect:', {
        error: error,
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        name: (error as any)?.name
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

  private setupGlobalCleanupHandlers() {
    // Cleanup on page unload
    const handleUnload = () => {
      console.log('[HumeVoiceService] Page unloading, disconnecting...');
      this.disconnect();
    };
    
    // Cleanup on navigation
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (this.isConnected) {
        console.log('[HumeVoiceService] Navigation detected, disconnecting...');
        this.disconnect();
      }
    };
    
    // Cleanup on visibility change (tab switch)
    const handleVisibilityChange = () => {
      if (document.hidden && this.isConnected) {
        console.log('[HumeVoiceService] Tab hidden, disconnecting...');
        this.disconnect();
      }
    };
    
    window.addEventListener('unload', handleUnload);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Store cleanup function
    this.globalCleanupHandlers = () => {
      window.removeEventListener('unload', handleUnload);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
            // Wait for socket to be ready before sending
            if (this.socketReadyPromise) {
              await this.socketReadyPromise;
            }
            
            // Double-check the socket is ready
            const underlyingSocket = this.getUnderlyingWebSocket();
            if (!underlyingSocket || underlyingSocket.readyState !== WebSocket.OPEN) {
              console.warn('[HumeVoiceService] Socket not ready for audio, skipping chunk');
              return;
            }
            
            console.log('[HumeVoiceService] Sending audio chunk, size:', event.data.size);
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
      console.log('[HumeVoiceService] Microphone streaming started with timeslice: 100ms');
      
    } catch (error) {
      console.error('[HumeVoiceService] Error setting up microphone:', error);
      throw new Error('Failed to set up microphone streaming');
    }
  }

  private stopTracking() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }
    
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
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

  private convertEmotionsToArray(scores: any): { name: string; score: number }[] {
    const emotionArray: { name: string; score: number }[] = [];
    
    // Convert all emotion scores to array format
    for (const [emotion, score] of Object.entries(scores)) {
      if (typeof score === 'number' && score > 0.01) { // Only include emotions with score > 1%
        emotionArray.push({
          name: emotion.charAt(0).toUpperCase() + emotion.slice(1), // Capitalize first letter
          score: Math.round(score * 100) // Convert to percentage
        });
      }
    }
    
    // Sort by score descending
    emotionArray.sort((a, b) => b.score - a.score);
    
    // Return top 8 emotions
    return emotionArray.slice(0, 8);
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
            console.error(`[HumeVoiceService] Max reconnect attempts reached after direct connect failure. No retry scheduled.`);
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

  async disconnect(): Promise<void> {
    console.log('[HumeVoiceService] Disconnect called');
    
    if (this.isDisconnecting) {
      console.log('[HumeVoiceService] Already disconnecting, skipping');
      return;
    }
    
    this.isDisconnecting = true;
    
    try {
      // Stop audio first
      this.stopTracking();
      
      // Close socket if it exists
      if (this.socket) {
        console.log('[HumeVoiceService] Closing socket connection');
        
        // Try to close gracefully
        if (typeof this.socket.close === 'function') {
          this.socket.close();
        } else if (typeof this.socket.disconnect === 'function') {
          this.socket.disconnect();
        } else {
          // Try to close underlying WebSocket
          const ws = this.getUnderlyingWebSocket();
          if (ws && typeof ws.close === 'function') {
            ws.close();
          }
        }
        
        this.socket = null;
      }
      
      // Cleanup everything
      this.cleanup();
      
    } catch (error) {
      console.error('[HumeVoiceService] Error during disconnect:', error);
    } finally {
      this.isConnected = false;
      this.isDisconnecting = false;
    }
    
    console.log('[HumeVoiceService] Disconnect complete');
  }

  private cleanup() {
    // Remove global handlers
    if (this.globalCleanupHandlers) {
      this.globalCleanupHandlers();
      this.globalCleanupHandlers = undefined;
    }
    
    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    
    // Clear promises
    this.connectionPromise = undefined;
    this.socketReadyPromise = undefined;
    this.socketReadyResolve = undefined;
    
    // Clear media stream (if not already cleared)
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      this.audioStream = null;
    }
    
    // Clear media recorder
    if (this.mediaRecorder) {
      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      this.mediaRecorder = null;
    }
  }

  async sendAudio(audioBlob: Blob): Promise<void> {
    console.log('[HumeVoiceService] sendAudio called with blob size:', audioBlob.size, 'type:', audioBlob.type);
    
    // Wait for socket to be ready if still connecting
    if (this.socketReadyPromise) {
      console.log('[HumeVoiceService] Waiting for socket to be ready before sending audio...');
      try {
        await Promise.race([
          this.socketReadyPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Socket ready timeout')), 5000))
        ]);
      } catch (error) {
        console.error('[HumeVoiceService] Socket ready timeout:', error);
        return;
      }
    }
    
    if (!this.checkConnection()) {
      console.error('[HumeVoiceService] Not connected or not ready');
      return;
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
        message: (error as any)?.message || 'Unknown error',
        stack: (error as any)?.stack,
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
    if (!this.socket || !this.isConnected) {
      console.warn('[HumeVoiceService] Not connected');
      return false;
    }
    
    // Check if socket has required methods
    if (typeof this.socket.sendAudioInput !== 'function') {
      console.error('[HumeVoiceService] Socket missing required methods');
      return false;
    }
    
    // Additional WebSocket state check
    const ws = this.getUnderlyingWebSocket();
    if (ws && ws.readyState !== 1) { // 1 = WebSocket.OPEN
      console.error('[HumeVoiceService] WebSocket not in OPEN state:', ws.readyState);
      return false;
    }
    
    return true;
  }
  
  private getUnderlyingWebSocket(): WebSocket | null {
    if (!this.socket) return null;
    
    // Try to find the underlying WebSocket
    const possibleProps = ['_socket', 'socket', 'ws', '_ws', 'webSocket', '_webSocket'];
    for (const prop of possibleProps) {
      const ws = (this.socket as any)[prop];
      if (ws && typeof ws.readyState === 'number') {
        return ws;
      }
    }
    
    // Check if socket itself is a WebSocket
    if ((this.socket as any).readyState !== undefined) {
      return this.socket as any;
    }
    
    return null;
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

  onEmotion(callback: (emotions: any[]) => void): void {
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

  onTranscript(callback: (transcript: TranscriptSegment) => void): void {
    this.onTranscriptCallback = callback;
  }

  getTranscriptHistory(): TranscriptSegment[] {
    return [...this.transcriptHistory];
  }

  clearTranscriptHistory(): void {
    this.transcriptHistory = [];
  }

  sendTextMessage(message: string): void {
    if (!this.checkConnection()) {
      console.error('[HumeVoiceService] Not connected');
      return;
    }

    try {
      // Use SDK's sendUserInput method
      this.socket.sendUserInput(message);
      console.log('[HumeVoiceService] Sent user input:', message);
    } catch (error) {
      console.error('[HumeVoiceService] Error sending message:', error);
    }
  }

  setFacialEmotions(emotions: { name: string; score: number }[]): void {
    this.lastFacialEmotions = emotions;
    // Optionally merge with prosody for combined view
    // This could be weighted average or other combination strategy
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
