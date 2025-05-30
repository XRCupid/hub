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
  private apiKey: string = '';
  private video: HTMLVideoElement | null = null;
  private isTracking: boolean = false;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private lastExpressions: FacialExpressions = {
    mouthSmile: 0,
    mouthFrown: 0,
    mouthOpen: 0,
    mouthPucker: 0,
    browUpLeft: 0,
    browUpRight: 0,
    browDownLeft: 0,
    browDownRight: 0,
    eyeSquintLeft: 0,
    eyeSquintRight: 0,
    eyeWideLeft: 0,
    eyeWideRight: 0,
    eyeBlinkLeft: 0,
    eyeBlinkRight: 0,
    eyebrowRaiseLeft: 0,
    eyebrowRaiseRight: 0,
    eyebrowFurrow: 0,
    cheekPuff: 0,
    jawOpen: 0,
    jawLeft: 0,
    jawRight: 0,
    noseSneer: 0,
    tongueOut: 0
  };

  // Map Hume emotions to blendshapes
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
    
    // Check for API key in environment
    this.apiKey = process.env.REACT_APP_HUME_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[HumeExpressionService] No Hume API key found. Please set REACT_APP_HUME_API_KEY');
    }
  }

  async initialize() {
    console.log('[HumeExpressionService] Initialized');
    // No model to load - we'll use Hume's API
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    console.log('[HumeExpressionService] API key set');
  }

  startTracking(video: HTMLVideoElement) {
    if (!this.apiKey) {
      console.error('[HumeExpressionService] Cannot start tracking without API key');
      return;
    }

    this.video = video;
    this.isTracking = true;
    
    // Set canvas size to match video
    this.canvas.width = video.videoWidth;
    this.canvas.height = video.videoHeight;
    
    console.log('[HumeExpressionService] Starting expression tracking');
    this.track();
  }

  stopTracking() {
    this.isTracking = false;
    console.log('[HumeExpressionService] Stopped expression tracking');
  }

  getExpressions(): FacialExpressions {
    return { ...this.lastExpressions };
  }

  private async track() {
    if (!this.isTracking || !this.video) return;

    try {
      // Capture current frame
      this.context.drawImage(this.video, 0, 0);
      const imageData = this.canvas.toDataURL('image/jpeg', 0.8);
      const base64Data = imageData.split(',')[1];

      // Send to Hume API
      const response = await fetch('https://api.hume.ai/v0/batch/jobs', {
        method: 'POST',
        headers: {
          'X-Hume-Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          models: {
            face: {}
          },
          urls: [],
          files: [{
            content: base64Data,
            content_type: 'image/jpeg'
          }]
        })
      });

      if (response.ok) {
        const result = await response.json();
        const jobId = result.job_id;
        
        // Poll for results (in production, use webhooks)
        const predictions = await this.pollForResults(jobId);
        if (predictions) {
          this.processHumePredictions(predictions);
        }
      } else {
        const errorText = await response.text();
        console.error('[HumeExpressionService] API error:', response.status, errorText);
        
        // Check for usage limit error
        if (response.status === 402 || errorText.includes('usage limit')) {
          console.error('[HumeExpressionService] Monthly usage limit reached');
          // Stop tracking to avoid repeated errors
          this.isTracking = false;
          throw new Error('Monthly usage limit reached');
        }
      }
    } catch (error) {
      console.error('[HumeExpressionService] Tracking error:', error);
    }

    // Continue tracking at a lower rate to avoid API limits
    if (this.isTracking) {
      setTimeout(() => this.track(), 500); // 2 FPS
    }
  }

  private async pollForResults(jobId: string): Promise<HumePrediction[] | null> {
    // Simple polling - in production use webhooks
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        const response = await fetch(`https://api.hume.ai/v0/batch/jobs/${jobId}/predictions`, {
          headers: {
            'X-Hume-Api-Key': this.apiKey
          }
        });
  
        if (response.ok) {
          const data = await response.json();
          if (data[0]?.results?.predictions?.[0]?.models?.face?.grouped_predictions?.[0]?.predictions) {
            return data[0].results.predictions[0].models.face.grouped_predictions[0].predictions;
          }
        } else if (response.status === 400) {
          // Job might still be processing or invalid
          console.warn('[HumeExpressionService] Job not ready or invalid:', jobId);
          continue;
        } else {
          console.error('[HumeExpressionService] Polling error:', response.status);
          break;
        }
      } catch (error) {
        console.error('[HumeExpressionService] Polling request failed:', error);
        break;
      }
    }
    
    return null;
  }

  private processHumePredictions(predictions: HumePrediction[]) {
    if (!predictions.length) return;

    // Reset expressions
    const newExpressions: FacialExpressions = { ...this.lastExpressions };
    Object.keys(newExpressions).forEach(key => {
      newExpressions[key as keyof FacialExpressions] *= 0.5; // Decay
    });

    // Process emotions from Hume
    const emotions = predictions[0].emotions || [];
    
    // Sort by score and take top emotions
    const topEmotions = emotions
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // Top 3 emotions

    console.log('[HumeExpressionService] Top emotions:', topEmotions.map(e => `${e.name}: ${e.score.toFixed(2)}`));

    // Apply emotion mappings to blendshapes
    for (const emotion of topEmotions) {
      const mapping = this.emotionToBlendshapeMap[emotion.name];
      if (mapping) {
        Object.entries(mapping).forEach(([key, value]) => {
          const blendshapeKey = key as keyof FacialExpressions;
          newExpressions[blendshapeKey] = Math.max(
            newExpressions[blendshapeKey],
            (value as number) * emotion.score
          );
        });
      }
    }

    // Smooth the values
    Object.keys(newExpressions).forEach(key => {
      const k = key as keyof FacialExpressions;
      this.lastExpressions[k] = this.lastExpressions[k] * 0.7 + newExpressions[k] * 0.3;
    });
  }
}
