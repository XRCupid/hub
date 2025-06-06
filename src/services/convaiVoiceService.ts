// Convai Voice Service
// This service handles real-time voice conversations with Convai

// Convai WebSocket endpoint
const CONVAI_WS_URL = 'wss://api.convai.com/character/getResponse';

// Audio utilities
function base64ToBlob(base64: string, type: string = 'audio/wav'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type });
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to convert blob to base64 string.'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Convert audio blob to PCM16 format for Convai
async function convertToPCM16(audioBlob: Blob): Promise<ArrayBuffer> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  // Resample to 16kHz mono
  const targetSampleRate = 16000;
  const numberOfChannels = 1;
  const length = Math.ceil(audioBuffer.duration * targetSampleRate);
  
  const offlineContext = new OfflineAudioContext(numberOfChannels, length, targetSampleRate);
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start();
  
  const resampled = await offlineContext.startRendering();
  
  // Convert to PCM16
  const pcm16 = new Int16Array(resampled.length);
  const channelData = resampled.getChannelData(0);
  
  for (let i = 0; i < channelData.length; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
  }
  
  return pcm16.buffer;
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

interface ConvaiConfig {
  characterId: string;
  sessionId?: string;
  languageCode?: string;
}

export class ConvaiVoiceService {
  private socket: WebSocket | null = null;
  private isConnected: boolean = false;
  private apiKey: string;
  private config: ConvaiConfig | null = null;
  private sessionId: string = '';
  private audioQueue: Blob[] = [];
  private isPlaying: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;
  
  // Callbacks
  private onAudioCallback: ((audioBlob: Blob) => void) | null = null;
  private onMessageCallback: ((message: string) => void) | null = null;
  private onEmotionCallback: ((emotions: EmotionalState) => void) | null = null;
  private onUserMessageCallback: ((transcript: string) => void) | null = null;
  private onUserInterruptionCallback: (() => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.REACT_APP_CONVAI_API_KEY || 'e40c1b9f6a1e16cd16b285e4b3b6884c';
    this.sessionId = this.generateSessionId();
  }
  
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  public setOnAudioCallback(callback: (audioBlob: Blob) => void): void {
    this.onAudioCallback = callback;
  }
  
  public setOnMessageCallback(callback: (message: string) => void): void {
    this.onMessageCallback = callback;
  }
  
  public setOnEmotionCallback(callback: (emotions: EmotionalState) => void): void {
    this.onEmotionCallback = callback;
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
    try {
      console.log('[ConvaiVoiceService] Connecting to Convai...');
      
      if (this.isConnected && this.socket) {
        console.warn('[ConvaiVoiceService] Already connected.');
        return;
      }
      
      // Use configId as characterId for Convai
      this.config = {
        characterId: configId || process.env.REACT_APP_CONVAI_CHARACTER_ID || '',
        sessionId: this.sessionId,
        languageCode: 'en-US'
      };
      
      // Create WebSocket connection
      // Convai uses the API key in the URL parameters
      const wsUrl = `${CONVAI_WS_URL}`;
      this.socket = new WebSocket(wsUrl);
      
      // Set up event handlers
      this.socket.onopen = () => {
        console.log('[ConvaiVoiceService] WebSocket connected');
        this.isConnected = true;
        
        // Send initial configuration with API key
        this.sendWebSocketMessage({
          userText: '', // Empty initial message
          charID: this.config!.characterId || '',
          sessionID: this.sessionId,
          voiceResponse: true,
          apiKey: this.apiKey,
          audioConfig: {
            sampleRate: 16000,
            encoding: 'PCM16'
          }
        });
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[ConvaiVoiceService] Received message:', data);
          
          // Handle different message types from Convai
          if (data.text) {
            // Assistant's text response
            this.onMessageCallback?.(data.text);
          }
          
          if (data.audio) {
            // Audio response (base64 encoded)
            const audioBlob = base64ToBlob(data.audio, 'audio/wav');
            this.onAudioCallback?.(audioBlob);
            this.audioQueue.push(audioBlob);
            this.processAudioQueue();
          }
          
          if (data.userTranscript) {
            // User's speech transcribed
            this.onUserMessageCallback?.(data.userTranscript);
          }
          
          if (data.emotion || data.emotions) {
            // Emotion data
            const emotions = data.emotions || data.emotion;
            this.onEmotionCallback?.(emotions);
          }
          
          if (data.error) {
            // Error from Convai
            console.error('[ConvaiVoiceService] Convai error:', data.error);
            this.onErrorCallback?.(new Error(data.error));
          }
        } catch (error) {
          console.error('[ConvaiVoiceService] Error parsing message:', error);
          this.onErrorCallback?.(error as Error);
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('[ConvaiVoiceService] WebSocket error:', error);
        if (this.onErrorCallback) {
          this.onErrorCallback(new Error('WebSocket connection error'));
        }
      };
      
      this.socket.onclose = () => {
        console.log('[ConvaiVoiceService] WebSocket closed');
        this.isConnected = false;
        this.socket = null;
      };
      
      // Wait for connection to be established
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);
        
        const checkConnection = setInterval(() => {
          if (this.isConnected) {
            clearInterval(checkConnection);
            clearTimeout(timeout);
            resolve();
          }
        }, 100);
      });
      
    } catch (error) {
      console.error('[ConvaiVoiceService] Connection error:', error);
      throw error;
    }
  }
  
  private sendWebSocketMessage(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }
  
  async sendUserInput(text: string): Promise<void> {
    console.log('[ConvaiVoiceService] Sending text input:', text);
    this.sendWebSocketMessage({
      userText: text,
      charID: this.config!.characterId || '',
      sessionID: this.sessionId,
      voiceResponse: true,
      apiKey: this.apiKey
    });
  }
  
  async sendAudioInput(audioData: Blob | ArrayBuffer): Promise<void> {
    try {
      let pcmData: ArrayBuffer;
      
      if (audioData instanceof Blob) {
        // Convert blob to PCM16
        pcmData = await convertToPCM16(audioData);
      } else {
        pcmData = audioData;
      }
      
      // Convert to base64 for transmission
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcmData)));
      
      this.sendWebSocketMessage({
        audio: base64Audio,
        charID: this.config!.characterId || '',
        sessionID: this.sessionId,
        voiceResponse: true,
        apiKey: this.apiKey
      });
    } catch (error) {
      console.error('[ConvaiVoiceService] Error sending audio:', error);
    }
  }
  
  private async processAudioQueue(): Promise<void> {
    if (this.isPlaying || this.audioQueue.length === 0) {
      return;
    }
    
    this.isPlaying = true;
    const audioBlob = this.audioQueue.shift()!;
    
    try {
      const audioUrl = URL.createObjectURL(audioBlob);
      this.currentAudio = new Audio(audioUrl);
      
      this.currentAudio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.isPlaying = false;
        this.currentAudio = null;
        this.processAudioQueue();
      };
      
      await this.currentAudio.play();
    } catch (error) {
      console.error('[ConvaiVoiceService] Error playing audio:', error);
      this.isPlaying = false;
      this.processAudioQueue();
    }
  }
  
  public pauseAssistant(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
    this.audioQueue = [];
    this.sendWebSocketMessage({
      interrupt: true,
      charID: this.config!.characterId || '',
      sessionID: this.sessionId,
      apiKey: this.apiKey
    });
  }
  
  public disconnect(): void {
    console.log('[ConvaiVoiceService] Disconnecting...');
    
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    
    this.audioQueue = [];
    
    if (this.socket) {
      this.sendWebSocketMessage({
        end: true,
        charID: this.config!.characterId || '',
        sessionID: this.sessionId,
        apiKey: this.apiKey
      });
      this.socket.close();
      this.socket = null;
    }
    
    this.isConnected = false;
  }
  
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
  
  // Compatibility methods for easier migration from Hume
  public sendMessage(text: string): void {
    this.sendUserInput(text);
  }
  
  public sendPauseAssistantMessage(): void {
    this.pauseAssistant();
  }
}

// Export singleton instance for backward compatibility
const convaiVoiceService = new ConvaiVoiceService();
export default convaiVoiceService;
