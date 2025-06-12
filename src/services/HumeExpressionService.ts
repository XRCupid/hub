import { IFaceTrackingService, HeadRotation } from './IFaceTrackingService';
import { FacialExpressions } from '../types/tracking';

interface HumeExpression {
  name: string;
  score: number;
}

interface HumePrediction {
  emotions: HumeExpression[];
  time?: {
    begin: number;
    end: number;
  };
}

export class HumeExpressionService {
  private apiKey: string = 'm3KaINwHsH55rJNO6zr2kIEAWvOimYeLTon3OriOXWJeCxCl'; // HARDCODED
  private video: HTMLVideoElement | null = null;
  private isTracking: boolean = false;
  private canvas!: HTMLCanvasElement;
  private context!: CanvasRenderingContext2D;
  private onEmotionCallback?: (emotions: Array<{ emotion: string; score: number }>) => void;
  private socket: WebSocket | null = null;
  private frameInterval: NodeJS.Timeout | null = null;
  private lastExpressions: FacialExpressions = {
    mouthSmile: 0,
    mouthSmileLeft: 0,
    mouthSmileRight: 0,
    mouthFrown: 0,
    mouthOpen: 0,
    mouthPucker: 0,
    mouthDimpleLeft: 0,
    mouthDimpleRight: 0,
    mouthStretchLeft: 0,
    mouthStretchRight: 0,
    mouthPressLeft: 0,
    mouthPressRight: 0,
    lipsSuckUpper: 0,
    lipsSuckLower: 0,
    lipsFunnel: 0,
    browUpLeft: 0,
    browUpRight: 0,
    browInnerUp: 0,
    browInnerUpLeft: 0,
    browInnerUpRight: 0,
    browDownLeft: 0,
    browDownRight: 0,
    eyeSquintLeft: 0,
    eyeSquintRight: 0,
    cheekPuff: 0,
    cheekSquintLeft: 0,
    cheekSquintRight: 0,
    noseSneer: 0,
    tongueOut: 0,
    jawOpen: 0,
    jawLeft: 0,
    jawRight: 0,
    eyeBlinkLeft: 0,
    eyeBlinkRight: 0,
    eyebrowRaiseLeft: 0,
    eyebrowRaiseRight: 0,
    eyebrowFurrow: 0,
    eyeWideLeft: 0,
    eyeWideRight: 0,
    eyeWide: 0,
    eyeBlink: 0,
    eyebrowRaise: 0,
    eyeSquint: 0,
    eyeLookDownLeft: 0,
    eyeLookDownRight: 0,
    eyeLookUpLeft: 0,
    eyeLookUpRight: 0,
    eyeLookInLeft: 0,
    eyeLookInRight: 0,
    eyeLookOutLeft: 0,
    eyeLookOutRight: 0
  };

  private emotionToBlendshapeMap: Record<string, Partial<FacialExpressions>> = {
    'Joy': { 
      mouthSmile: 0.8,
      eyeSquintLeft: 0.3,
      eyeSquintRight: 0.3,
      cheekPuff: 0.2
    },
    'Amusement': { 
      mouthSmile: 1.0,
      mouthOpen: 0.3,
      eyeSquintLeft: 0.4,
      eyeSquintRight: 0.4
    },
    'Surprise': { 
      eyeWideLeft: 0.8,
      eyeWideRight: 0.8,
      browUpLeft: 0.7,
      browUpRight: 0.7,
      mouthOpen: 0.6,
      jawOpen: 0.5
    },
    'Anger': { 
      browDownLeft: 0.8,
      browDownRight: 0.8,
      mouthFrown: 0.6,
      eyeSquintLeft: 0.4,
      eyeSquintRight: 0.4,
      noseSneer: 0.3
    },
    'Sadness': { 
      mouthFrown: 0.7,
      browDownLeft: 0.4,
      browDownRight: 0.4,
      eyeSquintLeft: 0.2,
      eyeSquintRight: 0.2
    },
    'Fear': { 
      eyeWideLeft: 0.7,
      eyeWideRight: 0.7,
      browUpLeft: 0.5,
      browUpRight: 0.5,
      mouthOpen: 0.4
    },
    'Contempt': { 
      mouthSmile: 0.3, // asymmetric smile
      eyeSquintLeft: 0.2,
      noseSneer: 0.4
    },
    'Disgust': { 
      noseSneer: 0.7,
      browDownLeft: 0.3,
      browDownRight: 0.3,
      mouthFrown: 0.4
    },
    'Confusion': { 
      browUpLeft: 0.4,
      browDownRight: 0.4,
      eyeSquintLeft: 0.3,
      mouthOpen: 0.2
    },
    'Concentration': { 
      browDownLeft: 0.5,
      browDownRight: 0.5,
      eyeSquintLeft: 0.3,
      eyeSquintRight: 0.3
    }
  };

  constructor() {
    // Create offscreen canvas for frame capture
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
    console.log('[HumeExpressionService] Service initialized');
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Use the streaming WebSocket API for real-time analysis
        this.socket = new WebSocket(`wss://api.hume.ai/v0/stream/models?apikey=${this.apiKey}`);
        
        this.socket.onopen = () => {
          console.log('[HumeExpressionService] WebSocket connected');
          // Send initial configuration
          this.socket!.send(JSON.stringify({
            models: {
              face: {
                fps_pred: 3, // 3 predictions per second
                prob_threshold: 0.1,
                identify_faces: false,
                min_face_size: 60
              }
            },
            raw_text: false,
            data: null
          }));
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.face && data.face.predictions && data.face.predictions.length > 0) {
              const predictions = data.face.predictions[0];
              if (predictions.emotions) {
                this.processStreamingEmotions(predictions.emotions);
              }
            }
          } catch (error) {
            console.error('[HumeExpressionService] Error processing message:', error);
          }
        };

        this.socket.onerror = (error) => {
          console.error('[HumeExpressionService] WebSocket error:', error);
          reject(error);
        };

        this.socket.onclose = () => {
          console.log('[HumeExpressionService] WebSocket closed');
          this.socket = null;
        };
      } catch (error) {
        console.error('[HumeExpressionService] Failed to connect WebSocket:', error);
        reject(error);
      }
    });
  }

  private processStreamingEmotions(emotions: HumeExpression[]): void {
    // Sort emotions by score
    const sortedEmotions = [...emotions].sort((a, b) => b.score - a.score);
    
    // Convert to the expected format
    const formattedEmotions = sortedEmotions.map(e => ({
      emotion: e.name,
      score: Math.round(e.score * 100) // Convert to percentage
    }));

    console.log('[HumeExpressionService] Detected emotions:', formattedEmotions.slice(0, 5));

    // Call the callback with emotions
    if (this.onEmotionCallback) {
      this.onEmotionCallback(formattedEmotions);
    }
  }

  async startTracking(videoElement: HTMLVideoElement): Promise<void> {
    console.log('[HumeExpressionService] Starting tracking...');
    this.video = videoElement;
    this.isTracking = true;

    // Set canvas size to match video
    this.canvas.width = videoElement.videoWidth || 640;
    this.canvas.height = videoElement.videoHeight || 480;

    // Connect to WebSocket
    await this.connectWebSocket();

    // Start sending frames
    this.startFrameCapture();
  }

  private startFrameCapture(): void {
    if (!this.isTracking || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    // Capture and send frames at 3 FPS
    this.frameInterval = setInterval(() => {
      if (this.video && this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.sendFrame();
      }
    }, 333); // ~3 FPS
  }

  private async sendFrame(): Promise<void> {
    if (!this.video || !this.socket) return;

    try {
      // Draw current frame to canvas
      this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
      
      // Convert to base64
      const imageData = this.canvas.toDataURL('image/jpeg', 0.7);
      const base64Data = imageData.split(',')[1];

      // Send frame through WebSocket
      this.socket.send(JSON.stringify({
        data: base64Data,
        models: {
          face: {}
        }
      }));
    } catch (error) {
      console.error('[HumeExpressionService] Error sending frame:', error);
    }
  }

  stopTracking(): void {
    console.log('[HumeExpressionService] Stopping tracking...');
    this.isTracking = false;
    
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  setOnEmotionCallback(callback: (emotions: Array<{ emotion: string; score: number }>) => void): void {
    this.onEmotionCallback = callback;
  }

  getLastExpressions(): FacialExpressions {
    return { ...this.lastExpressions };
  }

  getHeadRotation(): HeadRotation {
    // Not implemented for Hume API
    return { pitch: 0, yaw: 0, roll: 0 };
  }
}
