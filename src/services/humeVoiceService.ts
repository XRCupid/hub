import { Hume, HumeClient, convertBase64ToBlob, convertBlobToBase64 } from 'hume';

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
  private client: HumeClient;
  private socket: any;
  private isConnected: boolean = false;
  private socketReadyTime: number = 0; // Track when socket became ready
  
  private onAudioCallback?: (audioBlob: Blob) => void;
  private onMessageCallback?: (message: string) => void;
  private onEmotionCallback?: (emotions: EmotionalState) => void;
  private onAssistantEndCallback?: () => void;
  private onUserMessageCallback?: (transcript: string) => void;
  private onUserInterruptionCallback?: () => void;
  private onErrorCallback?: (error: Error) => void;

  constructor() {
    // Initialize client with API key
    this.client = new HumeClient({
      apiKey: process.env.REACT_APP_HUME_API_KEY || '',
      secretKey: process.env.REACT_APP_HUME_SECRET_KEY || ''
    });
  }

  async connect(configId?: string): Promise<void> {
    try {
      console.log('[HumeVoiceService] Connecting to Hume EVI...');
      
      const configToUse = configId || process.env.REACT_APP_HUME_CONFIG_ID || '';
      
      // Connect using the SDK's chat interface
      this.socket = await this.client.empathicVoice.chat.connect({
        configId: configToUse,
      });
      
      console.log('[HumeVoiceService] Socket created:', {
        socket: !!this.socket,
        socketType: typeof this.socket,
        hasMethod: typeof this.socket?.sendAudioInput
      });

      // Wait for the socket to be actually open
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000); // 10 second timeout
        
        // Set up event handlers
        this.socket.on('open', () => {
          console.log('[HumeVoiceService] WebSocket connection opened');
          
          // Wait 2 seconds for socket to fully stabilize
          setTimeout(() => {
            this.isConnected = true;
            console.log('[HumeVoiceService] WebSocket ready after stabilization delay');
            resolve();
          }, 2000);
        });

        this.socket.on('message', (message: any) => {
          console.log('[HumeVoiceService] Received message type:', message.type);
          console.log('[HumeVoiceService] Full message:', JSON.stringify(message).substring(0, 500));
          this.handleMessage(message);
        });

        this.socket.on('error', (error: any) => {
          console.error('[HumeVoiceService] WebSocket error:', error);
          this.isConnected = false;
          clearTimeout(timeout);
          reject(error);
        });

        this.socket.on('close', () => {
          console.log('[HumeVoiceService] WebSocket connection closed');
          this.isConnected = false;
        });
      });
    } catch (error) {
      console.error('[HumeVoiceService] Failed to connect:', error);
      throw error;
    }
  }

  private handleMessage(message: any): void {
    console.log('[HumeVoiceService] Processing message:', message.type);
    
    switch (message.type) {
      case 'audio_output':
        console.log('[HumeVoiceService] Received audio_output');
        if (message.data && this.onAudioCallback) {
          try {
            // Convert base64 to blob with explicit wav mime type
            const audioBlob = convertBase64ToBlob(message.data, 'audio/wav');
            console.log('[HumeVoiceService] Created audio blob:', audioBlob.size, 'type:', audioBlob.type);
            this.onAudioCallback(audioBlob);
          } catch (error) {
            console.error('[HumeVoiceService] Error creating audio blob:', error);
          }
        }
        break;

      case 'assistant_message':
        if (message.message?.content && this.onMessageCallback) {
          console.log('[HumeVoiceService] Assistant message:', message.message.content);
          this.onMessageCallback(message.message.content);
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

    let base64Data: string = '';
    try {
      // Use Hume SDK's convertBlobToBase64 utility
      console.log('[HumeVoiceService] Converting blob to base64 using SDK utility...');
      base64Data = await convertBlobToBase64(audioBlob);
      
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

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
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

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
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
