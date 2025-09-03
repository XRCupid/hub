import { HumeVoiceService } from './humeVoiceService';

// Extended wrapper for HumeVoiceService to provide additional methods needed by VideoCallAnalytics
export class HumeVoiceServiceWrapper extends HumeVoiceService {
  private messages: any[] = [];
  private audioData = {
    volume: 0,
    isSpeaking: false
  };
  private emotionHandlers: ((emotions: any) => void)[] = [];
  private transcriptHandlers: ((transcript: any) => void)[] = [];

  constructor() {
    super();
    
    // Set up callbacks to capture data
    this.onMessage((message: any) => {
      this.messages.push(message);
    });
  }

  // Get all messages received
  getMessages(): any[] {
    return [...this.messages];
  }

  // Get audio data with volume and speaking status
  getAudioData(): { volume: number; isSpeaking: boolean } {
    return { ...this.audioData };
  }

  // Update audio data (called from audio processing)
  updateAudioData(volume: number, isSpeaking: boolean): void {
    this.audioData = { volume, isSpeaking };
  }

  // Clear messages
  clearMessages(): void {
    this.messages = [];
  }

  // Add emotion handler
  onEmotion(handler: (emotions: any) => void): void {
    this.emotionHandlers.push(handler);
    // Also register with parent
    super.onEmotion((emotions) => {
      handler(emotions);
    });
  }

  // Add transcript handler  
  onTranscript(handler: (transcript: any) => void): void {
    this.transcriptHandlers.push(handler);
    // Also register with parent
    super.onTranscript((transcript) => {
      handler(transcript);
    });
  }

  // Override disconnect to clean up wrapper state
  async disconnect(): Promise<void> {
    console.log('[HumeVoiceServiceWrapper] Disconnecting...');
    // Clear wrapper state
    this.messages = [];
    this.audioData = { volume: 0, isSpeaking: false };
    this.emotionHandlers = [];
    this.transcriptHandlers = [];
    
    // Call parent disconnect
    await super.disconnect();
  }
}
