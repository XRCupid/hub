import { FacialExpressions } from '../types/tracking';
import { ML5FaceMeshService } from './ML5FaceMeshService';
import { HumeExpressionService } from './HumeExpressionService';

export class CombinedFaceTrackingService {
  private ml5Service: ML5FaceMeshService;
  private humeService: HumeExpressionService;
  private useHume: boolean = false;
  private humeError: boolean = false;
  private lastCombinedExpressions: FacialExpressions;
  
  constructor() {
    this.ml5Service = new ML5FaceMeshService();
    this.humeService = new HumeExpressionService();
    this.lastCombinedExpressions = {
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
    
    // Auto-load Hume API key from environment
    const humeApiKey = process.env.REACT_APP_HUME_API_KEY;
    if (humeApiKey) {
      console.log('[CombinedFaceTracking] Found Hume API key in environment');
      this.setHumeApiKey(humeApiKey);
    } else {
      console.log('[CombinedFaceTracking] No Hume API key found, using ML5 only');
    }
  }
  
  async initialize() {
    console.log('[CombinedFaceTracking] Initializing services...');
    await Promise.all([
      this.ml5Service.initialize(),
      this.humeService.initialize()
    ]);
    console.log('[CombinedFaceTracking] All services initialized');
  }
  
  setHumeApiKey(apiKey: string) {
    this.humeService.setApiKey(apiKey);
    this.useHume = true;
  }
  
  startTracking(videoElement: HTMLVideoElement) {
    console.log('[CombinedFaceTracking] Starting tracking with ML5...');
    this.ml5Service.startTracking(videoElement);
    
    if (this.useHume && !this.humeError) {
      console.log('[CombinedFaceTracking] Also starting Hume tracking...');
      try {
        this.humeService.startTracking(videoElement);
      } catch (error: any) {
        console.error('[CombinedFaceTracking] Hume tracking failed:', error);
        if (error.message?.includes('usage limit')) {
          this.humeError = true;
        }
      }
    }
  }
  
  stopTracking() {
    this.ml5Service.stopTracking();
    this.humeService.stopTracking();
  }
  
  getExpressions(): FacialExpressions {
    // Get ML5 expressions (facial landmarks)
    const ml5Expressions = this.ml5Service.getExpressions();
    
    // Get Hume expressions (emotions) if available
    const humeExpressions = (this.useHume && !this.humeError) ? this.humeService.getExpressions() : null;
    
    // Combine expressions
    // ML5 provides: mouthOpen, eyeSquint, browUp (from facial landmarks)
    // Hume provides: mouthSmile, mouthFrown (from emotions)
    
    const combined = { ...ml5Expressions };
    
    if (humeExpressions) {
      // Use Hume's emotion-based expressions for smile/frown
      combined.mouthSmile = humeExpressions.mouthSmile;
      combined.mouthFrown = humeExpressions.mouthFrown;
      combined.noseSneer = humeExpressions.noseSneer;
      combined.cheekPuff = humeExpressions.cheekPuff;
      
      // Blend eye expressions - take the maximum to capture both emotions and physical state
      combined.eyeWideLeft = Math.max(ml5Expressions.eyeWideLeft, humeExpressions.eyeWideLeft);
      combined.eyeWideRight = Math.max(ml5Expressions.eyeWideRight, humeExpressions.eyeWideRight);
    }
    
    // Smooth the combined values
    Object.keys(combined).forEach(key => {
      const k = key as keyof FacialExpressions;
      this.lastCombinedExpressions[k] = 
        this.lastCombinedExpressions[k] * 0.6 + combined[k] * 0.4;
    });
    
    return { ...this.lastCombinedExpressions };
  }
  
  getHeadRotation() {
    return this.ml5Service.getHeadRotation();
  }
}
