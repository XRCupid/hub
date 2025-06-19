import { FacialExpressions } from '../types/tracking';
import { FaceMeshPrediction, HeadRotation, IFaceTrackingService } from './IFaceTrackingService';

declare const ml5: any; // Declare ml5 as a global variable

// Global singleton tracking
let globalML5Instance: ML5FaceMeshService | null = null;
let globalInitializationPromise: Promise<void> | null = null;

export class ML5FaceMeshService implements IFaceTrackingService {
  private facemesh: any = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private detectionLoopActive = false; // Detection loop guard
  private isTracking = false;
  private isRunning = false; // To control the animation loop
  private videoElement: HTMLVideoElement | null = null;
  private lastExpressions!: FacialExpressions; // Initialized in constructor
  private lastHeadRotation: HeadRotation = { pitch: 0, yaw: 0, roll: 0 };
  private cleanupFunctions: (() => void)[] = [];
  private lastPredictionTime = 0;
  private predictions: any[] = [];
  private smoothingAlpha = 0.3; // Increased for more responsive tracking
  private frameCount = 0;
  private skipFrames = 1; // Process every 2nd frame for better responsiveness
  private lastProcessTime = 0;
  private minProcessInterval = 33; // ~30 FPS for smoother tracking

  // Calibration state
  private isCalibrated: boolean = false;
  private calibrationFrames: number = 0;
  private calibrationSamples: HeadRotation[] = [];
  private calibrationOffset: HeadRotation = { pitch: 0, yaw: 0, roll: 0 };

  private readonly modelConfig = {
    maxFaces: 1,
    detectionConfidence: this.isMobile() ? 0.7 : 0.8,  // Lower confidence for mobile
    flipHorizontal: false,
  };

  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private getMobileOptimizedSettings() {
    const mobile = this.isMobile();
    return {
      skipFrames: mobile ? 2 : 1,  // Less frame skipping for desktop
      minProcessInterval: mobile ? 66 : 33,  // 15 FPS mobile, 30 FPS desktop
      smoothingAlpha: mobile ? 0.25 : 0.3,  // Less smoothing for more responsiveness
      maxAttempts: mobile ? 15 : 10,
      delay: mobile ? 500 : 300
    };
  }

  constructor() {
    this.lastExpressions = this.getNeutralExpression();
    
    // Apply mobile-optimized settings
    const settings = this.getMobileOptimizedSettings();
    this.skipFrames = settings.skipFrames;
    this.minProcessInterval = settings.minProcessInterval;
    this.smoothingAlpha = settings.smoothingAlpha;
    
    console.log('[ML5FaceMesh] Constructor - Mobile optimizations applied:', {
      isMobile: this.isMobile(),
      skipFrames: this.skipFrames,
      minProcessInterval: this.minProcessInterval,
      smoothingAlpha: this.smoothingAlpha
    });

    // Add global error handler to suppress ML5/TensorFlow errors
    if (typeof window !== 'undefined') {
      const errorHandler = (event: ErrorEvent | PromiseRejectionEvent) => {
        const error = 'reason' in event ? event.reason : event.error;
        if (error?.stack && (
          error.stack.includes('engine.js') || 
          error.stack.includes('tf-core') ||
          error.stack.includes('facemesh') ||
          error.stack.includes('estimateFaces') ||
          error.stack.includes('t is not a function')
        )) {
          event.preventDefault();
          // Silently suppress these errors
          return;
        }
      };
      
      window.addEventListener('error', errorHandler as any);
      window.addEventListener('unhandledrejection', errorHandler as any);
      
      this.cleanupFunctions.push(() => {
        window.removeEventListener('error', errorHandler as any);
        window.removeEventListener('unhandledrejection', errorHandler as any);
      });
    }
  }

  private async waitForML5(): Promise<boolean> {
    const { maxAttempts, delay } = this.getMobileOptimizedSettings();
    for (let i = 0; i < maxAttempts; i++) {
      if (typeof ml5 !== 'undefined' && ml5.facemesh) {
        console.log(`[ML5FaceMesh] ML5 loaded after ${i * delay}ms`);
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    console.error('[ML5FaceMesh] ML5 not loaded after max attempts');
    return false;
  }

  public async initialize(): Promise<void> {
    // Use global singleton pattern to prevent multiple ML5 initializations
    if (globalInitializationPromise) {
      console.log('[ML5FaceMesh] Using global initialization promise');
      return globalInitializationPromise;
    }
    
    // Return existing initialization promise if already in progress
    if (this.initializationPromise) {
      console.log('[ML5FaceMesh] Returning existing initialization promise');
      return this.initializationPromise;
    }

    // If already initialized, return immediately
    if (this.isInitialized && this.facemesh) {
      console.log('[ML5FaceMesh] Already initialized, skipping');
      return Promise.resolve();
    }

    // Create global initialization promise
    globalInitializationPromise = this._doInitialize();
    this.initializationPromise = globalInitializationPromise;
    
    try {
      await globalInitializationPromise;
    } catch (error) {
      // Reset global promise on error
      globalInitializationPromise = null;
      throw error;
    }
    
    return globalInitializationPromise;
  }

  private async _doInitialize(): Promise<void> {
    console.log('[ML5FaceMesh] Initializing face mesh...');
    console.log('[ML5FaceMesh] Current state:', {
      isInitialized: this.isInitialized,
      hasFacemesh: !!this.facemesh,
      ml5Available: typeof ml5 !== 'undefined',
      facemeshAvailable: typeof ml5?.facemesh === 'function'
    });
    
    // Wait for ml5 to be available
    const ml5Ready = await this.waitForML5();
    if (!ml5Ready) {
      throw new Error('ML5 or facemesh not available after waiting');
    }
    console.log('[ML5FaceMesh] ML5 is available, creating facemesh model...');
    
    // Check if ml5.facemesh is available
    if (typeof ml5.facemesh !== 'function') {
      console.error('[ML5FaceMesh] ml5.facemesh is not a function!');
      throw new Error('ml5.facemesh is not a function!');
    }
    return new Promise<void>((resolve, reject) => {
      try {
        console.log('[ML5FaceMesh] Creating facemesh with config:', this.modelConfig);
        this.facemesh = ml5.facemesh(this.modelConfig, () => {
          console.log('[ML5FaceMesh] ml5.facemesh LOAD CALLBACK invoked.');
          // Don't check if this.facemesh is null here - it may be set asynchronously
          console.log('[ML5FaceMesh] Model loaded successfully!');
          console.log('[ML5FaceMesh] Available methods:', this.facemesh ? Object.keys(this.facemesh) : 'facemesh is null');
          this.isInitialized = true;
          resolve();
        });
        console.log('[ML5FaceMesh] Value of this.facemesh IMMEDIATELY AFTER ml5.facemesh() call:', this.facemesh);
        console.log('[ML5FaceMesh] Is facemesh null?', this.facemesh === null);
        console.log('[ML5FaceMesh] Facemesh type:', typeof this.facemesh);
        
        // Check if facemesh was created synchronously
        if (this.facemesh) {
          console.log('[ML5FaceMesh] Facemesh created synchronously, checking if ready...');
          // Sometimes ML5 creates the object synchronously but still needs to load
          // Wait a bit for the callback to fire
          setTimeout(() => {
            if (!this.isInitialized && this.facemesh) {
              console.log('[ML5FaceMesh] Facemesh exists but callback not fired, forcing initialization');
              this.isInitialized = true;
              resolve();
            }
          }, 2000);
        }
        
        // Add a timeout to handle cases where the callback never fires
        setTimeout(() => {
          if (!this.isInitialized) {
            console.log('[ML5FaceMesh] Model load timeout - forcing initialization');
            if (this.facemesh) {
              console.log('[ML5FaceMesh] Facemesh exists during timeout, marking as initialized');
              this.isInitialized = true;
              resolve();
            } else {
              console.error('[ML5FaceMesh] Facemesh still null after timeout');
              reject(new Error('ML5 FaceMesh model failed to load within timeout'));
            }
          }
        }, 8000); // 8 seconds timeout
      } catch (error) {
        console.error('[ML5FaceMesh] Error during ml5.facemesh call:', error);
        reject(error);
      }
    }).then(() => {
      // Additional check after promise resolves
      console.log('[ML5FaceMesh] After initialization promise resolved:', {
        hasFacemesh: !!this.facemesh,
        isInitialized: this.isInitialized
      });
    });
  }

  public async startTracking(videoElement: HTMLVideoElement): Promise<void> {
    console.log('[ML5FaceMesh] Starting face tracking...');
    console.log('[ML5FaceMesh] Current state:', {
      hasFacemesh: !!this.facemesh,
      isInitialized: this.isInitialized,
      facemeshType: typeof this.facemesh,
      facemeshValue: this.facemesh
    });
    console.log('[ML5FaceMesh] Device info:', {
      isMobile: this.isMobile(),
      userAgent: navigator.userAgent,
      videoWidth: videoElement.videoWidth,
      videoHeight: videoElement.videoHeight
    });
    
    if (!this.facemesh) {
      console.warn('[ML5FaceMesh] Face mesh model not loaded properly, attempting to reinitialize...');
      // Reset initialization state to force a fresh attempt
      this.isInitialized = false;
      this.initializationPromise = null;
      globalInitializationPromise = null;
      
      // Try to initialize again
      await this.initialize();
      
      // Wait a bit for the model to settle
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!this.facemesh) {
        console.error('[ML5FaceMesh] Face mesh model still not loaded after reinitialization');
        console.error('[ML5FaceMesh] ML5 state:', {
          ml5Exists: typeof ml5 !== 'undefined',
          ml5FacemeshExists: typeof ml5 !== 'undefined' && typeof ml5.facemesh === 'function',
          thisInstance: this,
          globalPromise: globalInitializationPromise
        });
        throw new Error('Face mesh model not loaded. Call initialize() first.');
      }
    }
    
    if (!videoElement || !videoElement.videoWidth || !videoElement.videoHeight) {
      console.warn('[ML5FaceMesh] Video element not ready or invalid.');
      
      // On mobile, wait a bit longer for video to be ready
      if (this.isMobile()) {
        console.log('[ML5FaceMesh] Mobile detected, waiting for video to be ready...');
        let attempts = 0;
        while (attempts < 10 && (!videoElement.videoWidth || !videoElement.videoHeight)) {
          await new Promise(resolve => setTimeout(resolve, 200));
          attempts++;
          console.log(`[ML5FaceMesh] Video check attempt ${attempts}: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
        }
        
        if (!videoElement.videoWidth || !videoElement.videoHeight) {
          console.warn('[ML5FaceMesh] Video element not ready after mobile wait period. Skipping face tracking.');
          return; // Gracefully return instead of throwing
        }
      } else {
        console.warn('[ML5FaceMesh] Video element not ready or invalid. Skipping face tracking.');
        return; // Gracefully return instead of throwing
      }
    }
    
    this.videoElement = videoElement;
    this.isTracking = true;
    this.isRunning = true; 
    
    // Prevent multiple detection loops
    if (this.detectionLoopActive) {
      console.log('[ML5FaceMesh] Detection loop already active, skipping');
      return;
    }
    
    this.detectionLoopActive = true;
    console.log('[ML5FaceMesh] Video element ready, queueing detection loop start...');
    // Add a slight delay before the first detectionLoop call to let the model "settle"
    setTimeout(() => {
        if (this.isRunning && this.isTracking && this.facemesh && this.videoElement) { // Re-check conditions
            console.log('[ML5FaceMesh] Initiating detection loop after delay.');
            this.detectionLoop();
        } else {
            this.detectionLoopActive = false;
        }
    }, 100); // 100ms delay, can be adjusted
  }

  private async detectionLoop(): Promise<void> {
    if (!this.isTracking || !this.facemesh || !this.videoElement || !this.isRunning) {
      this.detectionLoopActive = false;
      return;
    }

    // Frame skipping to reduce CPU usage
    this.frameCount++;
    const { skipFrames } = this.getMobileOptimizedSettings();
    if (this.frameCount % (skipFrames + 1) !== 0) {
      // Skip this frame
      if (this.isRunning) {
        requestAnimationFrame(() => this.detectionLoop());
      }
      return;
    }

    // Throttle processing rate
    const now = Date.now();
    const { minProcessInterval } = this.getMobileOptimizedSettings();
    if (now - this.lastProcessTime < minProcessInterval) {
      // Too soon, skip processing
      if (this.isRunning) {
        requestAnimationFrame(() => this.detectionLoop());
      }
      return;
    }
    this.lastProcessTime = now;

    try {
      // Wrap detection in a promise to catch any internal errors
      await new Promise<void>((resolve) => {
        if (this.facemesh && this.facemesh.predict && typeof this.facemesh.predict === 'function') {
          // Use callback-based predict to avoid promise rejection issues
          this.facemesh.predict(this.videoElement, (predictions: any) => {
            this.handlePredictions(predictions);
            resolve();
          });
        } else if (this.facemesh && this.facemesh.detect && typeof this.facemesh.detect === 'function') {
          this.facemesh.detect(this.videoElement, (err: any, predictions: any) => {
            if (!err) {
              this.handlePredictions(predictions);
            }
            resolve();
          });
        } else {
          console.error('[ML5FaceMesh] No suitable detection method found');
          this.stopTracking(); 
          resolve();
        }
      }).catch(() => {
        // Silently ignore detection errors to prevent crashes
      });
    } catch (error) {
      // Silently ignore errors to prevent memory issues from error accumulation
    }

    if (this.isRunning) {
        requestAnimationFrame(() => this.detectionLoop());
    }
  }
  
  public stopTracking(): void {
    console.log('[ML5FaceMesh] Stopping face tracking...');
    this.isTracking = false;
    this.isRunning = false; 
    this.detectionLoopActive = false;
    
    // Clean up video reference but don't null facemesh immediately
    this.videoElement = null; 
    
    // Clear predictions to free memory
    this.predictions = [];
    
    // Run cleanup functions
    this.cleanupFunctions.forEach(fn => fn());
    this.cleanupFunctions = [];
    
    // Null facemesh after cleanup
    this.facemesh = null; 
    this.isInitialized = false;
    this.initializationPromise = null;
    
    // Reset calibration when stopping
    this.isCalibrated = false;
    this.calibrationFrames = 0;
    this.calibrationSamples = [];
    this.calibrationOffset = { pitch: 0, yaw: 0, roll: 0 };
    
    console.log('[ML5FaceMesh] Face tracking stopped.');
  }

  private handlePredictions(predictions: any): void {
    if (predictions && predictions.length > 0) {
      this.lastPredictionTime = Date.now();
      this.predictions = predictions; 
      console.log(`[ML5FaceMesh] 🎯 Detection results:`, {
        resultsCount: predictions?.length || 0,
        hasResults: predictions && predictions.length > 0,
        hasPredictions: predictions?.[0]?.scaledMesh ? true : false,
        frameCount: this.frameCount
      });
      this.processPredictions(predictions[0]); 
    } else {
      console.warn(`[ML5FaceMesh] ⚠️ No face detected in frame ${this.frameCount}`);
      this.lastExpressions = this.getNeutralExpression();
      this.lastHeadRotation = { pitch: 0, yaw: 0, roll: 0 };
    }
  }

  private processPredictions(prediction: FaceMeshPrediction): void {
    if (!prediction || !prediction.scaledMesh) {
      // console.warn('[ML5FaceMesh] Invalid prediction object or missing scaledMesh, holding last valid values.');
      // If a single prediction is bad, we keep the last smoothed values instead of resetting to neutral abruptly.
      // The handlePredictions method will reset to neutral if the entire predictions array is empty for a while.
      return;
    }
    const landmarks = prediction.scaledMesh as number[][];

    // Calculate new raw values
    const rawExpressions = this.calculateExpressions(landmarks);
    const rawHeadRotation = this.calculateHeadRotation(landmarks);

    // Handle calibration
    if (!this.isCalibrated) {
      this.calibrationSamples.push({ ...rawHeadRotation });
      this.calibrationFrames++;
      
      // Calibrate after collecting 30 frames (about 1 second)
      if (this.calibrationFrames >= 30) {
        // Calculate average of calibration samples
        const avgPitch = this.calibrationSamples.reduce((sum, s) => sum + s.pitch, 0) / this.calibrationSamples.length;
        const avgYaw = this.calibrationSamples.reduce((sum, s) => sum + s.yaw, 0) / this.calibrationSamples.length;
        const avgRoll = this.calibrationSamples.reduce((sum, s) => sum + s.roll, 0) / this.calibrationSamples.length;
        
        this.calibrationOffset = { pitch: avgPitch, yaw: avgYaw, roll: avgRoll };
        this.isCalibrated = true;
        
        console.log('[ML5FaceMesh] Calibration complete:', this.calibrationOffset);
      }
    }
    
    // Apply calibration offset
    const calibratedHeadRotation = this.isCalibrated ? {
      pitch: rawHeadRotation.pitch - this.calibrationOffset.pitch,
      yaw: rawHeadRotation.yaw - this.calibrationOffset.yaw,
      roll: rawHeadRotation.roll - this.calibrationOffset.roll
    } : rawHeadRotation;

    // Apply smoothing to update this.lastExpressions
    // The 'this.lastExpressions' object holds the previously smoothed values.
    // We iterate over its keys and update them with new smoothed values.
    const { smoothingAlpha } = this.getMobileOptimizedSettings();
    for (const key in this.lastExpressions) {
      if (Object.prototype.hasOwnProperty.call(this.lastExpressions, key) &&
          Object.prototype.hasOwnProperty.call(rawExpressions, key)) {
        
        const typedKey = key as keyof FacialExpressions;
        const rawVal = rawExpressions[typedKey];
        const lastVal = this.lastExpressions[typedKey];

        if (typeof rawVal === 'number' && typeof lastVal === 'number') {
          (this.lastExpressions as any)[typedKey] = 
            lastVal * (1 - smoothingAlpha) + 
            rawVal * smoothingAlpha;
        } else {
          // If for some reason a value isn't a number, assign directly (should not happen for FacialExpressions)
          (this.lastExpressions as any)[typedKey] = rawVal;
        }
      }
    }

    // Apply smoothing to update this.lastHeadRotation
    this.lastHeadRotation.pitch = 
      this.lastHeadRotation.pitch * (1 - smoothingAlpha) + 
      calibratedHeadRotation.pitch * smoothingAlpha;
    this.lastHeadRotation.yaw = 
      this.lastHeadRotation.yaw * (1 - smoothingAlpha) + 
      calibratedHeadRotation.yaw * smoothingAlpha;
    this.lastHeadRotation.roll = 
      this.lastHeadRotation.roll * (1 - smoothingAlpha) + 
      calibratedHeadRotation.roll * smoothingAlpha;
  }

  public getTrackingData(): { facialExpressions: FacialExpressions; headRotation: HeadRotation; landmarks: number[][] | null } {
    return {
      facialExpressions: this.getExpressions(),
      headRotation: this.getHeadRotation(),
      landmarks: this.getLandmarks()
    };
  }

  public getExpressions(): FacialExpressions {
    return this.lastExpressions;
  }

  public getHeadRotation(): HeadRotation {
    return this.lastHeadRotation;
  }

  public getLandmarks(): number[][] | null {
    if (this.predictions && this.predictions.length > 0 && this.predictions[0].scaledMesh) {
      return this.predictions[0].scaledMesh as number[][];
    }
    return null;
  }

  private getNeutralExpression(): FacialExpressions {
    return {
      mouthSmile: 0, mouthSmileLeft: 0, mouthSmileRight: 0, mouthFrown: 0,
      mouthOpen: 0, mouthPucker: 0, mouthDimpleLeft: 0, mouthDimpleRight: 0,
      mouthStretchLeft: 0, mouthStretchRight: 0, mouthPressLeft: 0, mouthPressRight: 0,
      lipsSuckUpper: 0, lipsSuckLower: 0, lipsFunnel: 0,
      browUpLeft: 0, browUpRight: 0, browInnerUp: 0, browInnerUpLeft: 0, browInnerUpRight: 0, browDownLeft: 0, browDownRight: 0,
      eyeSquintLeft: 0, eyeSquintRight: 0, cheekPuff: 0, cheekSquintLeft: 0, cheekSquintRight: 0,
      noseSneer: 0, tongueOut: 0, jawOpen: 0, jawLeft: 0, jawRight: 0,
      eyeBlinkLeft: 0, eyeBlinkRight: 0, eyebrowRaiseLeft: 0, eyebrowRaiseRight: 0, eyebrowFurrow: 0,
      eyeWideLeft: 0, eyeWideRight: 0, eyeWide: 0, eyeBlink: 0, eyebrowRaise: 0, eyeSquint: 0,
      eyeLookDownLeft: 0, eyeLookDownRight: 0, eyeLookUpLeft: 0, eyeLookUpRight: 0,
      eyeLookInLeft: 0, eyeLookInRight: 0, eyeLookOutLeft: 0, eyeLookOutRight: 0
    };
  }

  private calculateExpressions(landmarks: number[][]): FacialExpressions {
    const expressions = this.getNeutralExpression();
    if (!landmarks || landmarks.length < 468) {
      // console.warn(`[ML5FaceMesh] Insufficient landmarks: ${landmarks?.length}`); // Can be noisy
      console.error(`[ML5FaceMeshService] CRITICAL: No/insufficient landmarks for expression calculation. Found: ${landmarks?.length}, Needed: 468. Returning neutral expressions.`);
      return expressions;
    }

    try {
      const forehead = landmarks[10]; 
      const noseTipForHeight = landmarks[1]; 
      let faceHeight = 100; 
      if (forehead && noseTipForHeight && Array.isArray(forehead) && Array.isArray(noseTipForHeight) && forehead.length > 1 && noseTipForHeight.length > 1) {
        faceHeight = Math.abs(forehead[1] - noseTipForHeight[1]);
        faceHeight = Math.max(faceHeight, 50); 
        console.log(`[ExpressionsDebug] faceHeight: ${faceHeight.toFixed(2)}`); 
      }

      const upperLip = landmarks[13]; 
      const lowerLip = landmarks[14]; 
      if (upperLip && lowerLip && Array.isArray(upperLip) && Array.isArray(lowerLip) && upperLip.length > 1 && lowerLip.length > 1) {
        const mouthDistance = Math.abs(lowerLip[1] - upperLip[1]);
        const normalizedMouthDistance = (mouthDistance / faceHeight) * 100;
        const mouthOpenVal = Math.min(1, Math.max(0, (normalizedMouthDistance - 3) / 18)); // Decreased sensitivity
        expressions.mouthOpen = mouthOpenVal;
        expressions.jawOpen = mouthOpenVal * 0.6; 
      }

      const leftMouthCorner = landmarks[61];
      const rightMouthCorner = landmarks[291];
      const noseBase = landmarks[2]; 
      if (leftMouthCorner && rightMouthCorner && noseBase && 
          Array.isArray(leftMouthCorner) && Array.isArray(rightMouthCorner) && Array.isArray(noseBase) &&
          leftMouthCorner.length > 1 && rightMouthCorner.length > 1 && noseBase.length > 1) {
        const mouthCenterY = (leftMouthCorner[1] + rightMouthCorner[1]) / 2;
        const smileDivisor = faceHeight * 0.04; // Max sensitivity for smile
        const neutralSmileOffset = 0.18; // Max boost for smile detection
        let smileRatio = smileDivisor > 0 ? Math.max(0, (noseBase[1] - mouthCenterY) / smileDivisor) : 0;
        smileRatio += neutralSmileOffset;
        console.log(`[ExpressionsDebug] Smile - RawRatio: ${smileRatio.toFixed(3)}, WithOffset: ${(smileRatio).toFixed(3)}`);
        expressions.mouthSmile = smileRatio > 0.1 ? Math.min(1, Math.max(0, (smileRatio - 0.1) / (1.0 - 0.1))) : 0; // Added 0.1 threshold
        const neutralFrownOffset = 0.2; // Further increased offset to counteract default frown
        const frownDivisor = faceHeight * 0.04; // Define frownDivisor
        let frownRatio = frownDivisor > 0 ? Math.max(0, (mouthCenterY - noseBase[1]) / frownDivisor) : 0;
        frownRatio = Math.max(0, frownRatio - neutralFrownOffset); // Apply offset, ensuring it doesn't go below 0
        console.log(`[ExpressionsDebug] Frown - RawRatio: ${frownRatio.toFixed(3)}, WithOffset: ${frownRatio.toFixed(3)}`);
        expressions.mouthFrown = frownRatio > 0.1 ? Math.min(1, Math.max(0, (frownRatio - 0.1) / (1.0 - 0.1))) : 0; // Added 0.1 threshold

        // Asymmetric smile (mouthSmileLeft, mouthSmileRight)
        // Apply the same neutralSmileOffset logic for asymmetric smiles
        let leftMouthSmileRatio = smileDivisor > 0 ? Math.max(0, (noseBase[1] - leftMouthCorner[1]) / smileDivisor) : 0;
        leftMouthSmileRatio += neutralSmileOffset; // Using the same offset as combined smile
        expressions.mouthSmileLeft = leftMouthSmileRatio > 0.1 ? Math.min(1, Math.max(0, (leftMouthSmileRatio - 0.1) / (1.0 - 0.1))) : 0; // Added 0.1 threshold

        let rightMouthSmileRatio = smileDivisor > 0 ? Math.max(0, (noseBase[1] - rightMouthCorner[1]) / smileDivisor) : 0;
        rightMouthSmileRatio += neutralSmileOffset; // Using the same offset as combined smile
        expressions.mouthSmileRight = rightMouthSmileRatio > 0.1 ? Math.min(1, Math.max(0, (rightMouthSmileRatio - 0.1) / (1.0 - 0.1))) : 0; // Added 0.1 threshold
      }

      // Jaw Left/Right
      const chin = landmarks[152];
      const noseTip = landmarks[1]; // Using nose tip as a relatively stable central X reference
      if (chin && noseTip && Array.isArray(chin) && chin.length > 0 && Array.isArray(noseTip) && noseTip.length > 0) {
        const jawDisplacementX = chin[0] - noseTip[0];
        const jawMovementSensitivity = faceHeight * 0.08; // Adjust sensitivity as needed
        if (jawDisplacementX > jawMovementSensitivity * 0.2) { // Threshold to prevent jitter for small movements
            expressions.jawRight = Math.min(1, Math.max(0, (jawDisplacementX - (jawMovementSensitivity*0.2)) / jawMovementSensitivity));
            expressions.jawLeft = 0;
        } else if (jawDisplacementX < -jawMovementSensitivity * 0.2) {
            expressions.jawLeft = Math.min(1, Math.max(0, (-jawDisplacementX - (jawMovementSensitivity*0.2)) / jawMovementSensitivity));
            expressions.jawRight = 0;
        } else {
            expressions.jawLeft = 0;
            expressions.jawRight = 0;
        }
      }

      // Eyebrow Up (browInnerUp)
      const leftInnerBrowY = landmarks[53]?.[1] || 0; 
      const leftUpperEyelidY = landmarks[159]?.[1] || 0; 
      const rightInnerBrowY = landmarks[283]?.[1] || 0; 
      const rightUpperEyelidY = landmarks[386]?.[1] || 0;

      if (leftInnerBrowY !== null && leftUpperEyelidY !== null && rightInnerBrowY !== null && rightUpperEyelidY !== null && faceHeight > 0) {
        const browRaiseDivisor = faceHeight * 0.08; // Sensitivity: smaller = more sensitive
        const neutralBrowOffset = -0.55; // Negative offset to lower default brows (increased from -0.4)
        const browRaiseThreshold = 0.05;    // Movement needed to trigger

        // Distance increases when brow is up (assuming Y decreases upwards)
        const leftBrowDist = leftUpperEyelidY - leftInnerBrowY;
        const rightBrowDist = rightUpperEyelidY - rightInnerBrowY;

        let leftBrowUpRatio = browRaiseDivisor > 0 ? Math.max(0, leftBrowDist / browRaiseDivisor) : 0;
        leftBrowUpRatio += neutralBrowOffset;
        const finalLeftBrowUp = leftBrowUpRatio > browRaiseThreshold ? Math.min(1, (leftBrowUpRatio - browRaiseThreshold) / (1.0 - browRaiseThreshold)) : 0;

        let rightBrowUpRatio = browRaiseDivisor > 0 ? Math.max(0, rightBrowDist / browRaiseDivisor) : 0;
        rightBrowUpRatio += neutralBrowOffset;
        const finalRightBrowUp = rightBrowUpRatio > browRaiseThreshold ? Math.min(1, (rightBrowUpRatio - browRaiseThreshold) / (1.0 - browRaiseThreshold)) : 0;
        
        expressions.browInnerUp = Math.max(finalLeftBrowUp, finalRightBrowUp);
        // Assuming RPM mapping might use these if available, otherwise browInnerUp is primary
        expressions.browInnerUpLeft = finalLeftBrowUp; 
        expressions.browInnerUpRight = finalRightBrowUp;

        console.log(`[ExpressionsDebug] BrowUp - LRaw: ${(leftBrowDist / browRaiseDivisor).toFixed(3)}, RRaw: ${(rightBrowDist / browRaiseDivisor).toFixed(3)}, LFinal: ${finalLeftBrowUp.toFixed(3)}, RFinal: ${finalRightBrowUp.toFixed(3)}, Offset: ${neutralBrowOffset}`);
      } else {
        expressions.browInnerUp = 0;
        expressions.browInnerUpLeft = 0;
        expressions.browInnerUpRight = 0;
      }

      // Set browDown to 0 for now, focusing on fixing high default brows
      expressions.browDownLeft = 0;
      expressions.browDownRight = 0;

      const leftEyePoints = [landmarks[33], landmarks[160], landmarks[158], landmarks[133], landmarks[153], landmarks[144]];
      const rightEyePoints = [landmarks[362], landmarks[385], landmarks[387], landmarks[263], landmarks[373], landmarks[380]];
      if (leftEyePoints.every(p => p && Array.isArray(p) && p.length > 1) && rightEyePoints.every(p => p && Array.isArray(p) && p.length > 1)) {
        const leftEAR = this.eyeAspectRatio(leftEyePoints);
        const rightEAR = this.eyeAspectRatio(rightEyePoints);
        // Temporarily disable blink calculation and log raw EAR values for calibration
        console.log(`[EAR CALIBRATION] LeftEAR: ${leftEAR.toFixed(4)}, RightEAR: ${rightEAR.toFixed(4)}`);
        expressions.eyeBlinkLeft = 0; // Disabled for calibration
        expressions.eyeBlinkRight = 0; // Disabled for calibration
        expressions.eyeSquintLeft = 0; // Disabled for calibration
        expressions.eyeSquintRight = 0; // Disabled for calibration
        expressions.eyeSquint = 0; // Disabled for calibration

        // Eye Wide
        expressions.eyeWideLeft = 0; // Disabled for calibration
        expressions.eyeWideRight = 0; // Disabled for calibration
        expressions.eyeWide = 0; // Disabled for calibration
      }

      // cheekPuff is difficult to detect reliably with FaceMesh alone and is not implemented.
      // expressions.cheekPuff = 0; 
      
      const leftInnerBrowTop = landmarks[70]; 
      const leftUpperEyelid = landmarks[27];  
      const rightInnerBrowTop = landmarks[107]; 
      const rightUpperEyelid = landmarks[257]; 

      if (leftInnerBrowTop && leftUpperEyelid && rightInnerBrowTop && rightUpperEyelid &&
          Array.isArray(leftInnerBrowTop) && Array.isArray(leftUpperEyelid) &&
          Array.isArray(rightInnerBrowTop) && Array.isArray(rightUpperEyelid) &&
          leftInnerBrowTop.length > 1 && leftUpperEyelid.length > 1 && 
          rightInnerBrowTop.length > 1 && rightUpperEyelid.length > 1) {
        const rawLeftBrowRaiseRatio = Math.max(0, (leftUpperEyelid[1] - leftInnerBrowTop[1]) / (faceHeight * 0.12)); // Increased responsiveness
        const rawRightBrowRaiseRatio = Math.max(0, (rightUpperEyelid[1] - rightInnerBrowTop[1]) / (faceHeight * 0.12)); // Increased responsiveness
        const eyebrowRaiseThreshold = 0.32; // Slightly increased threshold for default high brows
        console.log(`[ExpressionsDebug] BrowUp (Inner) - RawLeft: ${rawLeftBrowRaiseRatio.toFixed(3)}, RawRight: ${rawRightBrowRaiseRatio.toFixed(3)}, Threshold: ${eyebrowRaiseThreshold.toFixed(3)}`);
        expressions.eyebrowRaiseLeft = rawLeftBrowRaiseRatio > eyebrowRaiseThreshold ? Math.min(1, Math.max(0, (rawLeftBrowRaiseRatio - eyebrowRaiseThreshold) / (1.0 - eyebrowRaiseThreshold))) : 0;
        expressions.eyebrowRaiseRight = rawRightBrowRaiseRatio > eyebrowRaiseThreshold ? Math.min(1, Math.max(0, (rawRightBrowRaiseRatio - eyebrowRaiseThreshold) / (1.0 - eyebrowRaiseThreshold))) : 0;
        expressions.eyebrowRaise = (expressions.eyebrowRaiseLeft + expressions.eyebrowRaiseRight) / 2;
      }

      const leftOuterBrow = landmarks[52]; 
      const leftOuterEyeCorner = landmarks[33]; 
      const rightOuterBrow = landmarks[282]; 
      const rightOuterEyeCorner = landmarks[263]; 
      if (leftOuterBrow && leftOuterEyeCorner && rightOuterBrow && rightOuterEyeCorner &&
          Array.isArray(leftOuterBrow) && Array.isArray(leftOuterEyeCorner) &&
          Array.isArray(rightOuterBrow) && Array.isArray(rightOuterEyeCorner) &&
          leftOuterBrow.length > 1 && leftOuterEyeCorner.length > 1 &&
          rightOuterBrow.length > 1 && rightOuterEyeCorner.length > 1) {
        const rawBrowUpLeft = (leftOuterEyeCorner[1] - leftOuterBrow[1]);
        const leftBrowRaiseDist = Math.max(0, (leftOuterEyeCorner[1] - leftOuterBrow[1]));
        expressions.browUpLeft = Math.min(1, leftBrowRaiseDist / (faceHeight * 0.07)); // Decreased sensitivity
        const rightBrowRaiseDist = Math.max(0, (rightOuterEyeCorner[1] - rightOuterBrow[1]));
        const leftOuterBrowVal = leftBrowRaiseDist / (faceHeight * 0.03);
        const rightOuterBrowVal = rightBrowRaiseDist / (faceHeight * 0.03);
        console.log(`[ExpressionsDebug] BrowUp (Outer) - LeftVal: ${leftOuterBrowVal.toFixed(3)}, RightVal: ${rightOuterBrowVal.toFixed(3)} (DistL: ${leftBrowRaiseDist.toFixed(2)}, DistR: ${rightBrowRaiseDist.toFixed(2)}, Divisor: ${(faceHeight * 0.07).toFixed(2)})`);
        expressions.browUpRight = Math.min(1, rightBrowRaiseDist / (faceHeight * 0.07)); // Decreased sensitivity
      }

      const leftInnerBrowFurrow = landmarks[55]; 
      const rightInnerBrowFurrow = landmarks[285]; 
      if (leftInnerBrowFurrow && rightInnerBrowFurrow && 
          Array.isArray(leftInnerBrowFurrow) && Array.isArray(rightInnerBrowFurrow) &&
          leftInnerBrowFurrow.length > 0 && rightInnerBrowFurrow.length > 0) { // Check for X coord
        const innerBrowDistance = Math.abs(rightInnerBrowFurrow[0] - leftInnerBrowFurrow[0]);
        const referenceInnerBrowDistance = faceHeight * 0.23; 
        const furrowSensitivity = faceHeight * 0.1; 
        const furrowRatio = (referenceInnerBrowDistance - innerBrowDistance) / furrowSensitivity;
        console.log(`[ExpressionsDebug] EyebrowFurrow - Ratio: ${furrowRatio.toFixed(3)} (InnerDist: ${innerBrowDistance.toFixed(2)}, RefDist: ${referenceInnerBrowDistance.toFixed(2)}, Sensitivity: ${furrowSensitivity.toFixed(2)})`);
        expressions.eyebrowFurrow = Math.min(1, Math.max(0, furrowRatio));
        expressions.browDownLeft = expressions.eyebrowFurrow; 
        expressions.browDownRight = expressions.eyebrowFurrow;
      }

      // Debug log significant expressions
      const hasSignificantExpression = Object.entries(expressions).some(([key, value]) => 
        value > 0.1 && !key.includes('eyeLook')
      );
      
      if (hasSignificantExpression && Math.random() < 0.05) { // Log 5% of the time when expressions detected
        console.log('[ML5FaceMesh] Calculated expressions:', {
          mouthOpen: expressions.mouthOpen.toFixed(2),
          jawOpen: expressions.jawOpen.toFixed(2),
          mouthSmile: expressions.mouthSmile.toFixed(2),
          mouthSmileLeft: expressions.mouthSmileLeft.toFixed(2),
          mouthSmileRight: expressions.mouthSmileRight.toFixed(2),
          eyebrowRaiseLeft: expressions.eyebrowRaiseLeft.toFixed(2),
          eyebrowRaiseRight: expressions.eyebrowRaiseRight.toFixed(2)
        });
      }

    } catch (e: any) {
      console.warn('[ML5FaceMesh] Error calculating expressions:', e.message, e.stack);
      return this.getNeutralExpression(); 
    }
    return expressions;
  }

  private calculateHeadRotation(landmarks: number[][]): HeadRotation {
    if (!landmarks || landmarks.length < 468) {
      return { pitch: 0, yaw: 0, roll: 0 };
    }
    try {
      const noseTip = landmarks[1];
      const chin = landmarks[152];
      const leftEyeInnerCorner = landmarks[133];
      const rightEyeInnerCorner = landmarks[362];
      // const leftEarTragus = landmarks[234]; 
      // const rightEarTragus = landmarks[454];

      if (![noseTip, chin, leftEyeInnerCorner, rightEyeInnerCorner].every(pt => pt && Array.isArray(pt) && pt.length > 1)) {
        return { pitch: 0, yaw: 0, roll: 0 };
      }

      const p1 = noseTip; 
      const p2 = chin; 
      const p3 = leftEyeInnerCorner; 
      const p4 = rightEyeInnerCorner; 

      const eyeMidPointX = (p3[0] + p4[0]) / 2;
      const eyeMidPointY = (p3[1] + p4[1]) / 2;
      
      const yawDivisor = (p4[0] - p3[0]);
      const yaw = yawDivisor === 0 ? 0 : (p1[0] - eyeMidPointX) / yawDivisor; 
      
      const pitchDivisor = (p2[1] - eyeMidPointY); // Use eye midpoint Y for more stability
      const pitch = pitchDivisor === 0 ? 0 : (p1[1] - eyeMidPointY) / pitchDivisor; 

      const roll = Math.atan2(p4[1] - p3[1], p4[0] - p3[0]);

      // Raw, unscaled values (pitch and yaw are ratios, roll is radians)
      const rawPitchValue = pitch;
      const rawYawValue = yaw;
      const rawRollValue = roll;

      // SCALERS TO OUTPUT RADIANS 
      const PITCH_RADIAN_SCALER = 4.5; 
      const YAW_RADIAN_SCALER = -3.0; // Negative to invert, consistent with previous yaw
      const ROLL_RADIAN_SCALER = 2.5; // Keep existing roll sensitivity, roll is already in radians

      const scaledPitch = rawPitchValue * PITCH_RADIAN_SCALER; // Outputting radians
      const scaledYaw = rawYawValue * YAW_RADIAN_SCALER;     // Outputting radians
      const scaledRoll = rawRollValue * ROLL_RADIAN_SCALER;   // Still radians, just scaled (rawRollValue is already rad)

      // Update log message to reflect units
      console.log(`[HeadRotationRaw] P: ${rawPitchValue.toFixed(3)} (ratio), Y: ${rawYawValue.toFixed(3)} (ratio), R: ${rawRollValue.toFixed(3)} (rad)`);
      console.log(`[HeadRotationScaledRad] P: ${scaledPitch.toFixed(3)} (rad), Y: ${scaledYaw.toFixed(3)} (rad), R: ${scaledRoll.toFixed(3)} (rad)`);

      return {
        pitch: scaledPitch, 
        yaw: scaledYaw,     
        roll: scaledRoll 
      };
    } catch (e: any) {
      console.warn('[ML5FaceMesh] Error calculating head rotation:', e.message);
      return { pitch: 0, yaw: 0, roll: 0 };
    }
  }

  private eyeAspectRatio(eyePoints: number[][]): number {
    const v1 = Math.hypot(eyePoints[1][0] - eyePoints[5][0], eyePoints[1][1] - eyePoints[5][1]);
    const v2 = Math.hypot(eyePoints[2][0] - eyePoints[4][0], eyePoints[2][1] - eyePoints[4][1]);
    const h = Math.hypot(eyePoints[0][0] - eyePoints[3][0], eyePoints[0][1] - eyePoints[3][1]);
    if (h === 0) return 0.3; // Avoid division by zero, return a neutral EAR
    const ear = (v1 + v2) / (2.0 * h);
    return ear;
  }
}