import { FacialExpressions } from '../types/tracking';

/**
 * Fallback face tracking service that provides basic simulated tracking data
 * when ML5 or other tracking services fail to initialize.
 * This ensures the PiP always has some form of animation.
 */
export class FallbackFaceTracking {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private currentExpressions: FacialExpressions;
  private animationPhase = 0;

  constructor() {
    this.currentExpressions = this.getNeutralExpression();
  }

  private getNeutralExpression(): FacialExpressions {
    return {
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
  }

  public async initialize(): Promise<void> {
    console.log('[FallbackFaceTracking] Initializing fallback tracking service');
    return Promise.resolve();
  }

  public async startTracking(): Promise<void> {
    if (this.isRunning) {
      console.log('[FallbackFaceTracking] Already running');
      return;
    }

    console.log('[FallbackFaceTracking] Starting fallback tracking with subtle animations');
    this.isRunning = true;

    // Generate subtle, natural-looking facial expressions
    this.intervalId = setInterval(() => {
      this.animationPhase += 0.1;
      
      // Subtle blinking animation (every 3-4 seconds)
      const blinkCycle = Math.sin(this.animationPhase * 0.3);
      const shouldBlink = blinkCycle > 0.95;
      
      // Very subtle smile variation (breathing-like rhythm)
      const smileVariation = Math.sin(this.animationPhase * 0.05) * 0.1;
      
      // Occasional micro-expressions (every 8-10 seconds)
      const microExpressionCycle = Math.sin(this.animationPhase * 0.02);
      const showMicroExpression = microExpressionCycle > 0.8;
      
      this.currentExpressions = {
        ...this.getNeutralExpression(),
        
        // Blinking
        eyeBlinkLeft: shouldBlink ? 0.8 : 0,
        eyeBlinkRight: shouldBlink ? 0.8 : 0,
        eyeBlink: shouldBlink ? 0.8 : 0,
        
        // Subtle smile variation
        mouthSmile: Math.max(0, 0.1 + smileVariation),
        mouthSmileLeft: Math.max(0, 0.05 + smileVariation * 0.5),
        mouthSmileRight: Math.max(0, 0.05 + smileVariation * 0.5),
        
        // Occasional micro-expressions
        browInnerUp: showMicroExpression ? 0.2 : 0,
        cheekSquintLeft: showMicroExpression ? 0.1 : 0,
        cheekSquintRight: showMicroExpression ? 0.1 : 0,
      };
    }, 100); // 10 FPS for fallback
  }

  public stopTracking(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.currentExpressions = this.getNeutralExpression();
    console.log('[FallbackFaceTracking] Stopped fallback tracking');
  }

  public getExpressions(): FacialExpressions {
    return { ...this.currentExpressions };
  }

  public getHeadRotation() {
    // Subtle head movement simulation
    const time = Date.now() / 1000;
    return {
      pitch: Math.sin(time * 0.1) * 2, // ±2 degrees
      yaw: Math.cos(time * 0.08) * 3,  // ±3 degrees  
      roll: Math.sin(time * 0.12) * 1  // ±1 degree
    };
  }

  public getLandmarks() {
    return [];
  }

  public getPostureData() {
    return null;
  }

  public isInitialized(): boolean {
    return true;
  }

  public cleanup(): void {
    this.stopTracking();
    console.log('[FallbackFaceTracking] Cleaned up');
  }
}
