// Convai Voice Service V2 - Using REST API approach

// Define EmotionalState interface inline for now
interface EmotionalState {
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  disgust: number;
  contempt: number;
}

interface ConvaiConfig {
  characterId: string;
  sessionId: string;
  apiKey: string;
}

interface ConvaiMessage {
  text?: string;
  audio?: string;
  emotion?: any;
  userTranscript?: string;
}

export class ConvaiVoiceServiceV2 {
  private apiKey: string;
  private sessionId: string;
  private config: ConvaiConfig | null = null;
  private isConnected: boolean = false;
  
  // Callbacks
  private onMessageCallback?: (message: string) => void;
  private onAudioCallback?: (audio: Blob) => void;
  private onEmotionCallback?: (emotion: EmotionalState) => void;
  private onUserMessageCallback?: (message: string) => void;
  private onErrorCallback?: (error: Error) => void;
  
  // Audio handling
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  
  constructor() {
    this.apiKey = process.env.REACT_APP_CONVAI_API_KEY || 'e40c1b9f6a1e16cd16b285e4b3b6884c';
    this.sessionId = this.generateSessionId();
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Callback setters
  public setOnMessageCallback(callback: (message: string) => void): void {
    this.onMessageCallback = callback;
  }
  
  public setOnAudioCallback(callback: (audio: Blob) => void): void {
    this.onAudioCallback = callback;
  }
  
  public setOnEmotionCallback(callback: (emotion: EmotionalState) => void): void {
    this.onEmotionCallback = callback;
  }
  
  public setOnUserMessageCallback(callback: (message: string) => void): void {
    this.onUserMessageCallback = callback;
  }
  
  public setOnErrorCallback(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }
  
  async connect(characterId?: string): Promise<void> {
    try {
      console.log('[ConvaiVoiceServiceV2] Connecting...');
      
      this.config = {
        characterId: characterId || 'default',
        sessionId: this.sessionId,
        apiKey: this.apiKey
      };
      
      this.isConnected = true;
      console.log('[ConvaiVoiceServiceV2] Connected (mock mode)');
      
      // Initialize audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
    } catch (error) {
      console.error('[ConvaiVoiceServiceV2] Connection error:', error);
      this.onErrorCallback?.(error as Error);
      throw error;
    }
  }
  
  async sendUserInput(text: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to Convai');
    }
    
    console.log('[ConvaiVoiceServiceV2] Sending text:', text);
    
    // For now, simulate a response
    setTimeout(() => {
      const mockResponse = `I received your message: "${text}". This is a mock response from Convai.`;
      this.onMessageCallback?.(mockResponse);
      
      // Simulate emotion data
      const mockEmotion: EmotionalState = {
        joy: Math.random() * 0.5,
        sadness: 0,
        anger: 0,
        fear: 0,
        surprise: Math.random() * 0.3,
        disgust: 0,
        contempt: 0
      };
      this.onEmotionCallback?.(mockEmotion);
    }, 1000);
  }
  
  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        await this.sendAudioInput(audioBlob);
      };
      
      this.mediaRecorder.start();
      console.log('[ConvaiVoiceServiceV2] Recording started');
    } catch (error) {
      console.error('[ConvaiVoiceServiceV2] Error starting recording:', error);
      this.onErrorCallback?.(error as Error);
    }
  }
  
  async stopRecording(): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      console.log('[ConvaiVoiceServiceV2] Recording stopped');
    }
  }
  
  public async sendAudioInput(audioBlob: Blob): Promise<void> {
    console.log('[ConvaiVoiceServiceV2] Sending audio input');
    
    // For now, simulate a response
    setTimeout(() => {
      this.onUserMessageCallback?.('(Audio input received)');
      this.sendUserInput('Hello from audio input');
    }, 500);
  }
  
  async disconnect(): Promise<void> {
    console.log('[ConvaiVoiceServiceV2] Disconnecting...');
    
    if (this.mediaRecorder) {
      this.stopRecording();
    }
    
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isConnected = false;
    this.config = null;
    
    console.log('[ConvaiVoiceServiceV2] Disconnected');
  }
  
  isConnectedStatus(): boolean {
    return this.isConnected;
  }
}

export default ConvaiVoiceServiceV2;
