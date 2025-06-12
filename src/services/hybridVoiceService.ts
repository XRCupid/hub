// Hybrid Voice Service - Combines Hume's emotion tracking with Convai's conversation
import { HumeVoiceService, EmotionalState } from './humeVoiceService';
import { ConvaiVoiceServiceV2 } from './convaiVoiceServiceV2';

export class HybridVoiceService {
  private humeService: HumeVoiceService;
  private convaiService: ConvaiVoiceServiceV2;
  private useHumeForConversation: boolean = true; // Toggle between services
  
  // Callbacks
  private onMessageCallback?: (message: string) => void;
  private onAudioCallback?: (audio: Blob) => void;
  private onEmotionCallback?: (emotions: Array<{name: string, score: number}>) => void;
  private onUserMessageCallback?: (message: string) => void;
  private onErrorCallback?: (error: Error) => void;
  
  constructor() {
    this.humeService = new HumeVoiceService();
    this.convaiService = new ConvaiVoiceServiceV2();
    
    // Set up Hume callbacks for emotion tracking
    this.humeService.setOnEmotionCallback((emotions) => {
      this.onEmotionCallback?.(emotions);
    });
    
    // Forward callbacks based on which service is active
    this.setupCallbacks();
  }
  
  private setupCallbacks() {
    const activeService = this.useHumeForConversation ? this.humeService : this.convaiService;
    
    activeService.setOnMessageCallback((message) => {
      this.onMessageCallback?.(message);
    });
    
    activeService.setOnAudioCallback((audio) => {
      this.onAudioCallback?.(audio);
    });
    
    activeService.setOnUserMessageCallback((message) => {
      this.onUserMessageCallback?.(message);
    });
    
    activeService.setOnErrorCallback((error) => {
      this.onErrorCallback?.(error);
    });
    
    // Always use Hume for emotion tracking
    this.humeService.setOnEmotionCallback((emotions) => {
      this.onEmotionCallback?.(emotions);
    });
  }
  
  // Toggle between services
  public setUseHumeForConversation(useHume: boolean) {
    this.useHumeForConversation = useHume;
    this.setupCallbacks();
  }
  
  // Callback setters
  public setOnMessageCallback(callback: (message: string) => void): void {
    this.onMessageCallback = callback;
    const activeService = this.useHumeForConversation ? this.humeService : this.convaiService;
    activeService.setOnMessageCallback(callback);
  }
  
  public setOnAudioCallback(callback: (audio: Blob) => void): void {
    this.onAudioCallback = callback;
    const activeService = this.useHumeForConversation ? this.humeService : this.convaiService;
    activeService.setOnAudioCallback(callback);
  }
  
  public setOnEmotionCallback(callback: (emotions: Array<{name: string, score: number}>) => void): void {
    this.onEmotionCallback = callback;
    // Always use Hume for emotions
    this.humeService.setOnEmotionCallback(callback);
  }
  
  public setOnUserMessageCallback(callback: (message: string) => void): void {
    this.onUserMessageCallback = callback;
    const activeService = this.useHumeForConversation ? this.humeService : this.convaiService;
    activeService.setOnUserMessageCallback(callback);
  }
  
  public setOnErrorCallback(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
    this.humeService.setOnErrorCallback(callback);
    this.convaiService.setOnErrorCallback(callback);
  }
  
  public setOnUserInterruptionCallback(callback: () => void): void {
    this.humeService.setOnUserInterruptionCallback(callback);
  }
  
  // Add direct callback methods for compatibility with existing code
  public onMessage(callback: (message: string) => void): void {
    this.setOnMessageCallback(callback);
  }
  
  public onAudio(callback: (audioBlob: Blob) => void): void {
    this.setOnAudioCallback(callback);
  }
  
  public onEmotion(callback: (emotions: Array<{name: string, score: number}>) => void): void {
    this.setOnEmotionCallback(callback);
  }
  
  public onAssistantEnd(callback: () => void): void {
    this.humeService.onAssistantEnd(callback);
  }
  
  public onUserMessage(callback: (transcript: string) => void): void {
    this.setOnUserMessageCallback(callback);
  }
  
  public onUserInterruption(callback: () => void): void {
    this.setOnUserInterruptionCallback(callback);
  }
  
  public onError(callback: (error: Error) => void): void {
    this.setOnErrorCallback(callback);
  }
  
  // Connection methods
  async connect(configId?: string): Promise<void> {
    if (this.useHumeForConversation) {
      await this.humeService.connect(configId);
    } else {
      // Connect both services
      await Promise.all([
        this.humeService.connect(configId), // For emotion tracking
        this.convaiService.connect(configId) // For conversation
      ]);
    }
  }
  
  async disconnect(): Promise<void> {
    await Promise.all([
      this.humeService.disconnect(),
      this.convaiService.disconnect()
    ]);
  }
  
  // Input methods - matching Hume's API
  async sendMessage(text: string): Promise<void> {
    if (this.useHumeForConversation) {
      this.humeService.sendMessage(text);
    } else {
      await this.convaiService.sendUserInput(text);
    }
  }
  
  async sendAudio(audioBlob: Blob): Promise<void> {
    if (this.useHumeForConversation) {
      await this.humeService.sendAudio(audioBlob);
    } else {
      await this.convaiService.sendAudioInput(audioBlob);
    }
  }
  
  async sendAudioInput(audioBlob: Blob): Promise<void> {
    // Alias for sendAudio to match Convai API
    await this.sendAudio(audioBlob);
  }
  
  async sendUserInput(text: string): Promise<void> {
    // Alias for sendMessage to match Convai API
    await this.sendMessage(text);
  }
  
  async startRecording(): Promise<void> {
    const activeService = this.useHumeForConversation ? this.humeService : this.convaiService;
    
    if ('startRecording' in activeService) {
      await activeService.startRecording();
    }
  }
  
  async stopRecording(): Promise<void> {
    const activeService = this.useHumeForConversation ? this.humeService : this.convaiService;
    
    if ('stopRecording' in activeService) {
      await activeService.stopRecording();
    }
  }
  
  // Status methods
  isConnectedStatus(): boolean {
    if (this.useHumeForConversation) {
      return this.humeService.checkConnection();
    } else {
      return this.convaiService.isConnectedStatus();
    }
  }
  
  checkConnection(): boolean {
    // Alias for Hume compatibility
    return this.isConnectedStatus();
  }
  
  // Hume-specific methods with proper type checking
  mute(): void {
    if (this.humeService && 'mute' in this.humeService) {
      (this.humeService as any).mute();
    }
  }
  
  unmute(): void {
    if (this.humeService && 'unmute' in this.humeService) {
      (this.humeService as any).unmute();
    }
  }
  
  pauseAssistant(): void {
    if (this.humeService && 'pauseAssistant' in this.humeService) {
      (this.humeService as any).pauseAssistant();
    }
  }
  
  resumeAssistant(): void {
    if (this.humeService && 'resumeAssistant' in this.humeService) {
      (this.humeService as any).resumeAssistant();
    }
  }
  
  pauseAudioInput(): void {
    if (this.humeService && 'pauseAudioInput' in this.humeService) {
      (this.humeService as any).pauseAudioInput();
    }
  }
  
  resumeAudioInput(): void {
    if (this.humeService && 'resumeAudioInput' in this.humeService) {
      (this.humeService as any).resumeAudioInput();
    }
  }
}

export default HybridVoiceService;
