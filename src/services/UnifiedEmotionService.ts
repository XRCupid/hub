/**
 * UnifiedEmotionService
 * Synchronizes and aggregates emotions from both HumeVoiceService (prosody) 
 * and HumeAIService (facial expressions)
 */

const HumeVoiceService = require('./humeVoiceService').default;
const HumeAIService = require('./HumeAIService').default;

export interface UnifiedEmotionData {
  timestamp: number;
  text?: string;
  prosodyEmotions: { name: string; score: number }[];
  facialEmotions: { name: string; score: number }[];
  combinedEmotions: { name: string; score: number }[]; // Weighted average
  dominantEmotion: string;
  emotionIntensity: number;
  confidence: number; // How confident we are in the emotion reading
}

interface EmotionBuffer {
  timestamp: number;
  emotions: { name: string; score: number }[];
  source: 'facial' | 'prosody';
}

export class UnifiedEmotionService {
  private voiceService: any;
  private facialService: any;
  
  // Emotion buffers for synchronization
  private prosodyBuffer: EmotionBuffer[] = [];
  private facialBuffer: EmotionBuffer[] = [];
  private readonly BUFFER_SIZE = 10;
  private readonly SYNC_WINDOW_MS = 500; // Match emotions within 500ms
  
  // Latest emotion states
  private lastProsodyEmotions: { name: string; score: number }[] = [];
  private lastFacialEmotions: { name: string; score: number }[] = [];
  private lastUnifiedEmotions: UnifiedEmotionData | null = null;
  
  // Callbacks
  private onUnifiedEmotionCallback?: (data: UnifiedEmotionData) => void;
  private onTranscriptWithEmotionsCallback?: (data: UnifiedEmotionData) => void;
  
  // Video stream for facial analysis
  private videoStream: MediaStream | null = null;
  private captureInterval: any = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  
  // Connection state
  private isConnected: boolean = false;
  
  constructor() {
    this.voiceService = new HumeVoiceService();
    this.facialService = new HumeAIService();
    
    // Set up voice service callbacks
    this.setupVoiceCallbacks();
    
    // Create hidden canvas for video capture
    this.canvas = document.createElement('canvas');
    this.canvas.width = 640;
    this.canvas.height = 480;
  }
  
  private setupVoiceCallbacks(): void {
    // Capture prosody emotions from voice
    this.voiceService.setOnEmotionCallback((emotions: any) => {
      this.handleProsodyEmotions(emotions);
    });
    
    // Capture transcripts with prosody
    this.voiceService.setOnTranscriptCallback((transcript: any) => {
      this.handleTranscriptWithEmotions(transcript);
    });
    
    // Pass through other callbacks
    this.voiceService.setOnOpenCallback(() => {
      console.log('[UnifiedEmotionService] Voice service connected');
    });
    
    this.voiceService.setOnErrorCallback((error: any) => {
      console.error('[UnifiedEmotionService] Voice error:', error);
    });
  }
  
  private handleProsodyEmotions(emotions: any[]): void {
    const timestamp = Date.now();
    
    // Store in buffer
    this.prosodyBuffer.push({ timestamp, emotions, source: 'prosody' });
    if (this.prosodyBuffer.length > this.BUFFER_SIZE) {
      this.prosodyBuffer.shift();
    }
    
    // Update last state
    this.lastProsodyEmotions = emotions;
    
    // Try to sync with facial emotions
    this.syncEmotions(timestamp);
  }
  
  private handleTranscriptWithEmotions(transcript: any): void {
    const timestamp = Date.now();
    
    // Find matching facial emotions within sync window
    const matchingFacial = this.findMatchingEmotions(timestamp, 'facial');
    
    // Create unified emotion data
    const unifiedData: UnifiedEmotionData = {
      timestamp,
      text: transcript.text,
      prosodyEmotions: transcript.prosodyEmotions || this.lastProsodyEmotions,
      facialEmotions: matchingFacial || this.lastFacialEmotions,
      combinedEmotions: this.combineEmotions(
        transcript.prosodyEmotions || this.lastProsodyEmotions,
        matchingFacial || this.lastFacialEmotions
      ),
      dominantEmotion: '',
      emotionIntensity: 0,
      confidence: 0
    };
    
    // Calculate dominant emotion and intensity
    if (unifiedData.combinedEmotions.length > 0) {
      unifiedData.dominantEmotion = unifiedData.combinedEmotions[0].name;
      unifiedData.emotionIntensity = unifiedData.combinedEmotions[0].score;
      unifiedData.confidence = this.calculateConfidence(
        unifiedData.prosodyEmotions,
        unifiedData.facialEmotions
      );
    }
    
    // Store and callback
    this.lastUnifiedEmotions = unifiedData;
    if (this.onTranscriptWithEmotionsCallback) {
      this.onTranscriptWithEmotionsCallback(unifiedData);
    }
  }
  
  private handleFacialEmotions(emotions: { name: string; score: number }[]): void {
    const timestamp = Date.now();
    
    // Store in buffer
    this.facialBuffer.push({ timestamp, emotions, source: 'facial' });
    if (this.facialBuffer.length > this.BUFFER_SIZE) {
      this.facialBuffer.shift();
    }
    
    // Update last state
    this.lastFacialEmotions = emotions;
    
    // Try to sync with prosody emotions
    this.syncEmotions(timestamp);
  }
  
  private syncEmotions(currentTimestamp: number): void {
    // Find matching emotions from both sources within sync window
    const matchingProsody = this.findMatchingEmotions(currentTimestamp, 'prosody');
    const matchingFacial = this.findMatchingEmotions(currentTimestamp, 'facial');
    
    if (matchingProsody || matchingFacial) {
      const unifiedData: UnifiedEmotionData = {
        timestamp: currentTimestamp,
        prosodyEmotions: matchingProsody || this.lastProsodyEmotions,
        facialEmotions: matchingFacial || this.lastFacialEmotions,
        combinedEmotions: this.combineEmotions(
          matchingProsody || this.lastProsodyEmotions,
          matchingFacial || this.lastFacialEmotions
        ),
        dominantEmotion: '',
        emotionIntensity: 0,
        confidence: 0
      };
      
      // Calculate dominant emotion
      if (unifiedData.combinedEmotions.length > 0) {
        unifiedData.dominantEmotion = unifiedData.combinedEmotions[0].name;
        unifiedData.emotionIntensity = unifiedData.combinedEmotions[0].score;
        unifiedData.confidence = this.calculateConfidence(
          unifiedData.prosodyEmotions,
          unifiedData.facialEmotions
        );
      }
      
      this.lastUnifiedEmotions = unifiedData;
      
      if (this.onUnifiedEmotionCallback) {
        this.onUnifiedEmotionCallback(unifiedData);
      }
    }
  }
  
  private findMatchingEmotions(
    targetTimestamp: number,
    source: 'facial' | 'prosody'
  ): { name: string; score: number }[] | null {
    const buffer = source === 'facial' ? this.facialBuffer : this.prosodyBuffer;
    
    // Find emotions within sync window
    for (let i = buffer.length - 1; i >= 0; i--) {
      const timeDiff = Math.abs(buffer[i].timestamp - targetTimestamp);
      if (timeDiff <= this.SYNC_WINDOW_MS) {
        return buffer[i].emotions;
      }
    }
    
    return null;
  }
  
  private combineEmotions(
    prosody: { name: string; score: number }[],
    facial: { name: string; score: number }[]
  ): { name: string; score: number }[] {
    const emotionMap = new Map<string, { prosodyScore: number; facialScore: number }>();
    
    // Weight factors
    const PROSODY_WEIGHT = 0.4;
    const FACIAL_WEIGHT = 0.6;
    
    // Add prosody emotions
    prosody.forEach(emotion => {
      if (!emotionMap.has(emotion.name)) {
        emotionMap.set(emotion.name, { prosodyScore: 0, facialScore: 0 });
      }
      emotionMap.get(emotion.name)!.prosodyScore = emotion.score;
    });
    
    // Add facial emotions
    facial.forEach(emotion => {
      if (!emotionMap.has(emotion.name)) {
        emotionMap.set(emotion.name, { prosodyScore: 0, facialScore: 0 });
      }
      emotionMap.get(emotion.name)!.facialScore = emotion.score;
    });
    
    // Calculate weighted average
    const combined: { name: string; score: number }[] = [];
    emotionMap.forEach((scores, name) => {
      const weightedScore = 
        (scores.prosodyScore * PROSODY_WEIGHT) + 
        (scores.facialScore * FACIAL_WEIGHT);
      combined.push({ name, score: Math.round(weightedScore) });
    });
    
    // Sort by score descending
    combined.sort((a, b) => b.score - a.score);
    
    return combined;
  }
  
  private calculateConfidence(
    prosody: { name: string; score: number }[],
    facial: { name: string; score: number }[]
  ): number {
    if (!prosody.length && !facial.length) return 0;
    if (!prosody.length || !facial.length) return 50; // Only one source
    
    // Check if top emotions match
    const topProsody = prosody[0]?.name;
    const topFacial = facial[0]?.name;
    
    if (topProsody === topFacial) {
      // High confidence if both agree
      return Math.min(100, (prosody[0].score + facial[0].score) / 2 + 20);
    }
    
    // Lower confidence if they disagree
    return Math.max(30, Math.min(prosody[0]?.score || 0, facial[0]?.score || 0));
  }
  
  public async connect(videoElement?: HTMLVideoElement): Promise<void> {
    console.log('[UnifiedEmotionService] Connecting services...');
    
    try {
      // Store video element if provided
      if (videoElement) {
        this.videoElement = videoElement;
      }
      
      // Connect voice service
      await this.voiceService.connect();
      
      // Connect facial service
      this.facialService.connectFacial((data: any) => {
        if (data.predictions && data.predictions.length > 0) {
          const emotions = data.predictions[0].emotions
            .filter((e: any) => e.name !== 'Surprise') // Filter out surprise
            .map((e: any) => ({ name: e.name, score: Math.round(e.score * 100) }));
          this.handleFacialEmotions(emotions);
        }
      });
      
      // Start video capture if we have a video element
      if (this.videoElement) {
        this.startVideoCapture();
      }
      
      this.isConnected = true;
      console.log('[UnifiedEmotionService] All services connected');
      
    } catch (error) {
      console.error('[UnifiedEmotionService] Failed to connect:', error);
      throw error;
    }
  }
  
  private startVideoCapture(): void {
    if (!this.videoElement || !this.canvas) return;
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    
    console.log('[UnifiedEmotionService] Starting video capture for facial analysis');
    
    // Capture frames at 2 FPS
    this.captureInterval = setInterval(() => {
      if (this.videoElement && this.videoElement.readyState === 4) {
        // Draw current frame to canvas
        ctx.drawImage(this.videoElement, 0, 0, this.canvas!.width, this.canvas!.height);
        
        // Convert to base64 and send to Hume
        this.canvas!.toBlob((blob) => {
          if (blob) {
            this.sendFrameToHume(blob);
          }
        }, 'image/jpeg', 0.8);
      }
    }, 500); // 2 FPS
  }
  
  private async sendFrameToHume(blob: Blob): Promise<void> {
    // Convert blob to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      
      // Send to Hume facial analysis
      if (this.facialService.facialSocket) {
        this.facialService.sendFacialData(base64Data);
      }
    };
    reader.readAsDataURL(blob);
  }
  
  public async disconnect(): Promise<void> {
    console.log('[UnifiedEmotionService] Disconnecting...');
    
    // Stop video capture
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    
    // Disconnect services
    await this.voiceService.disconnect();
    this.facialService.disconnect();
    
    // Clear buffers
    this.prosodyBuffer = [];
    this.facialBuffer = [];
    
    this.isConnected = false;
    console.log('[UnifiedEmotionService] Disconnected');
  }
  
  // Public API
  
  public setOnUnifiedEmotionCallback(callback: (data: UnifiedEmotionData) => void): void {
    this.onUnifiedEmotionCallback = callback;
  }
  
  public setOnTranscriptWithEmotionsCallback(callback: (data: UnifiedEmotionData) => void): void {
    this.onTranscriptWithEmotionsCallback = callback;
  }
  
  public getLastUnifiedEmotions(): UnifiedEmotionData | null {
    return this.lastUnifiedEmotions;
  }
  
  public setVideoElement(videoElement: HTMLVideoElement): void {
    this.videoElement = videoElement;
    if (this.isConnected && !this.captureInterval) {
      this.startVideoCapture();
    }
  }
  
  // Pass-through methods for voice service
  public setOnAudioCallback(callback: (audioBlob: Blob) => void): void {
    this.voiceService.setOnAudioCallback(callback);
  }
  
  public setOnMessageCallback(callback: (message: any) => void): void {
    this.voiceService.setOnMessageCallback(callback);
  }
  
  public setOnErrorCallback(callback: (error: Error) => void): void {
    this.voiceService.setOnErrorCallback(callback);
  }
  
  public sendAudio(audioData: ArrayBuffer): void {
    this.voiceService.sendAudio(audioData);
  }
}

export default UnifiedEmotionService;
