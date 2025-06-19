import { FacialExpressions, PostureData } from '../types/tracking';
import { ML5FaceMeshService } from './ML5FaceMeshService';
import { HumeExpressionService } from './HumeExpressionService';
import { PostureTrackingService } from './PostureTrackingService';

export class CombinedFaceTrackingService {
  private static instance: CombinedFaceTrackingService | null = null;
  private ml5Service: ML5FaceMeshService;
  private humeService: HumeExpressionService;
  private postureService: PostureTrackingService;
  private useHume: boolean = false;
  private humeError: boolean = false;
  private lastCombinedExpressions: FacialExpressions;
  private lastPostureData: PostureData | null = null;
  private lastEmotionalData: Array<{ emotion: string; score: number }> = [];
  private emotionCallback?: (emotions: Array<{ emotion: string; score: number }>) => void;

  // Make constructor private for singleton pattern
  private constructor() {
    this.ml5Service = new ML5FaceMeshService();
    this.humeService = new HumeExpressionService();
    this.postureService = new PostureTrackingService();
    this.lastCombinedExpressions = {
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

    // CRITICAL: Reset jawOpen to prevent stuck mouth
    console.log('[CombinedFaceTracking] Initialized with jawOpen=0');

    // Initialize Hume if API key is available
    const humeApiKey = 'm3KaINwHsH55rJNO6zr2kIEAWvOimYeLTon3OriOXWJeCxCl'; // HARDCODED
    if (humeApiKey) {
      console.log('[CombinedFaceTracking] Found Hume API key in environment');
      this.setHumeApiKey(humeApiKey);
    } else {
      console.log('[CombinedFaceTracking] No Hume API key found, using ML5 only');
    }
    console.log('[CombinedFaceTracking] Hume enabled, using ML5 and Hume');

    // Add emotion callback for Hume
    this.humeService.setOnEmotionCallback((emotions) => {
      this.lastEmotionalData = emotions;
      if (this.emotionCallback) {
        this.emotionCallback(emotions);
      }
    });
  }

  async initialize() {
    console.log('[CombinedFaceTracking] Initializing services...');
    try {
      // Only initialize ML5 since Hume is disabled
      await this.ml5Service.initialize();
      console.log('[CombinedFaceTracking] ML5 service initialized');

      // Skip Hume initialization since it's disabled
      // await this.humeService.initialize();

      console.log('[CombinedFaceTracking] All services initialized');
    } catch (error) {
      console.error('[CombinedFaceTracking] Error during initialization:', error);
      throw error;
    }
  }

  setHumeApiKey(apiKey: string) {
    // API key is now hardcoded in HumeExpressionService
    this.useHume = true;
  }

  async startTracking(videoElement: HTMLVideoElement) {
    console.log('[CombinedFaceTracking] Starting tracking with ML5...');

    // Ensure ML5 is initialized
    await this.ml5Service.initialize();

    this.ml5Service.startTracking(videoElement);

    // Posture tracking disabled for now - focus on expressions
    // this.postureService.startTracking(videoElement);
    // this.postureService.onResults((data) => {
    //   this.lastPostureData = data;
    // });

    if (this.useHume && !this.humeError) {
      console.log('[CombinedFaceTracking] Also starting Hume tracking...');
      try {
        await this.humeService.startTracking(videoElement);
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
    // this.postureService.stopTracking();
  }

  getExpressions(): FacialExpressions {
    // Get ML5 expressions (facial landmarks)
    const ml5Expressions = this.ml5Service.getExpressions();

    // Debug log ML5 jawOpen value - ALWAYS log to catch discrepancies
    console.log(`[CombinedFaceTracking] ML5 reports jawOpen: ${ml5Expressions.jawOpen.toFixed(3)}`);

    // Get Hume expressions (emotions) if available
    const humeExpressions = (this.useHume && !this.humeError) ? this.humeService.getLastExpressions() : null;

    // Combine expressions
    // ML5 provides: mouthOpen, eyeSquint, browUp (from facial landmarks)
    // Hume provides: mouthSmile, mouthFrown (from emotions)

    const combined = { ...ml5Expressions };

    // CRITICAL FIX: Force jawOpen to 0 if ML5 reports 0
    if (ml5Expressions.jawOpen === 0) {
      combined.jawOpen = 0;
    }

    // Debug log combined jawOpen before any modifications
    if (combined.jawOpen > 0 || this.lastCombinedExpressions.jawOpen > 0) {
      console.log(`[CombinedFaceTracking] DEBUG: ML5 jawOpen=${ml5Expressions.jawOpen.toFixed(3)}, combined=${combined.jawOpen.toFixed(3)}, last=${this.lastCombinedExpressions.jawOpen.toFixed(3)}`);
    }

    // CRITICAL FIX: Ensure all keys from lastCombinedExpressions are present in combined
    // This prevents undefined values that could become NaN
    Object.keys(this.lastCombinedExpressions).forEach(key => {
      const k = key as keyof FacialExpressions;
      if (combined[k] === undefined) {
        combined[k] = 0;
      }
    });

    if (humeExpressions) {
      // Use Hume's emotion-based expressions for smile/frown
      combined.mouthSmile = humeExpressions.mouthSmile;
      combined.mouthFrown = humeExpressions.mouthFrown;
      combined.noseSneer = humeExpressions.noseSneer;
      combined.cheekPuff = humeExpressions.cheekPuff;

      // When smiling or frowning, reduce mouth open to prevent conflict
      const emotionIntensity = Math.max(
        humeExpressions.mouthSmile || 0,
        humeExpressions.mouthFrown || 0
      );

      // Reduce mouth open when emotional expressions are active
      if (emotionIntensity > 0.1) {
        combined.mouthOpen = combined.mouthOpen * (1 - emotionIntensity * 0.7);
      }

      // Blend eye expressions - take the maximum to capture both emotions and physical state
      combined.eyeWideLeft = Math.max(ml5Expressions.eyeWideLeft, humeExpressions.eyeWideLeft);
      combined.eyeWideRight = Math.max(ml5Expressions.eyeWideRight, humeExpressions.eyeWideRight);
    }

    // Smooth the combined values
    Object.keys(combined).forEach(key => {
      const k = key as keyof FacialExpressions;

      // Special handling for jawOpen - if it's close to 0, snap to 0
      // INCREASED THRESHOLD: Was 0.05, now 0.1 to be more aggressive
      if (k === 'jawOpen' && combined[k] < 0.1) {
        if (this.lastCombinedExpressions[k] > 0.01) {
          console.log(`[CombinedFaceTracking] Snapping jawOpen to 0 (was ${this.lastCombinedExpressions[k].toFixed(3)}, raw=${combined[k].toFixed(3)})`);
        }
        this.lastCombinedExpressions[k] = 0;
      } else {
        // Normal smoothing for other values
        const oldValue = this.lastCombinedExpressions[k];
        const newValue = oldValue * 0.6 + combined[k] * 0.4;

        // Debug log for jawOpen changes
        if (k === 'jawOpen' && Math.abs(oldValue - newValue) > 0.01) {
          console.log(`[CombinedFaceTracking] Smoothing jawOpen: ${oldValue.toFixed(3)} -> ${newValue.toFixed(3)} (raw: ${combined[k].toFixed(3)})`);
        }

        this.lastCombinedExpressions[k] = newValue;
      }
    });

    return { ...this.lastCombinedExpressions };
  }

  resetStuckExpressions() {
    this.lastCombinedExpressions.jawOpen = 0;
  }

  getHeadRotation() {
    return this.ml5Service.getHeadRotation();
  }

  getPostureData(): PostureData | null {
    return this.lastPostureData;
  }

  getLandmarks(): any[] | null {
    return this.ml5Service.getLandmarks();
  }

  cleanup() {
    console.log('[CombinedFaceTracking] Cleaning up services...');

    // Clean up ML5 service (safe runtime check)
    if (this.ml5Service) {
      const ml5Service = this.ml5Service as any;
      if (typeof ml5Service.cleanup === 'function') {
        ml5Service.cleanup();
      } else if (typeof ml5Service.stopTracking === 'function') {
        ml5Service.stopTracking();
      }
    }

    // Clean up Hume service (safe runtime check)
    if (this.humeService) {
      const humeService = this.humeService as any;
      if (typeof humeService.cleanup === 'function') {
        humeService.cleanup();
      } else if (typeof humeService.stopTracking === 'function') {
        humeService.stopTracking();
      }
    }

    // Clean up posture service (safe runtime check)
    if (this.postureService) {
      const postureService = this.postureService as any;
      if (typeof postureService.cleanup === 'function') {
        postureService.cleanup();
      } else if (typeof postureService.stopTracking === 'function') {
        postureService.stopTracking();
      }
    }

    // Reset state
    this.useHume = false;
    this.humeError = false;
    this.lastCombinedExpressions = {
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
    this.lastPostureData = null;

    console.log('[CombinedFaceTracking] Cleanup completed');
  }

  // Get detailed emotional data (not just blendshapes)
  getDetailedEmotions(): Array<{ emotion: string; score: number }> {
    return this.lastEmotionalData;
  }

  // Set callback for emotional data updates
  setOnEmotionCallback(callback: (emotions: Array<{ emotion: string; score: number }>) => void): void {
    this.emotionCallback = callback;
  }

  // Get all tracking data in a comprehensive format
  getComprehensiveTrackingData() {
    return {
      blendshapes: this.getExpressions(),
      emotions: this.getDetailedEmotions(),
      headRotation: this.getHeadRotation(),
      landmarks: this.getLandmarks(),
      posture: this.getPostureData(),
      // ML5 provides basic face detection
      ml5Analysis: {
        confidence: 1.0, // ML5 doesn't expose confidence directly
        faceDetected: this.getLandmarks() !== null
      }
    };
  }

  // Singleton getInstance method
  public static getInstance(): CombinedFaceTrackingService {
    if (!CombinedFaceTrackingService.instance) {
      console.log('[CombinedFaceTrackingService] Creating singleton instance');
      CombinedFaceTrackingService.instance = new CombinedFaceTrackingService();
    }
    return CombinedFaceTrackingService.instance;
  }

  // Reset instance (useful for cleanup)
  public static resetInstance(): void {
    if (CombinedFaceTrackingService.instance) {
      CombinedFaceTrackingService.instance.stopTracking();
      CombinedFaceTrackingService.instance = null;
    }
  }
}
