import { FacialExpressions } from '../types/tracking';
import { FaceMeshPrediction, HeadRotation, IFaceTrackingService } from './IFaceTrackingService';

declare const ml5: any; // Declare ml5 as a global variable

export class ML5FaceMeshService implements IFaceTrackingService {
  private facemesh: any = null;
  private isTracking = false;
  private isRunning = false; // To control the animation loop
  private videoElement: HTMLVideoElement | null = null;
  private lastExpressions!: FacialExpressions; // Initialized in constructor
  private lastHeadRotation: HeadRotation = { pitch: 0, yaw: 0, roll: 0 };
  private cleanupFunctions: (() => void)[] = [];
  private lastPredictionTime = 0;
  private predictions: any[] = [];
  private smoothingAlpha = 0.15; // Very strong smoothing to combat persistent jitter

  private readonly modelConfig = {
    maxFaces: 1,
    detectionConfidence: 0.8,
    flipHorizontal: false,
  };

  constructor() {
    this.lastExpressions = this.getNeutralExpression();
  }

  private async waitForML5(): Promise<boolean> {
    const maxAttempts = 10;
    const delay = 300;
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
    console.log('[ML5FaceMesh] Initializing face mesh...');
    try {
      const ml5Ready = await this.waitForML5();
      if (!ml5Ready) {
        throw new Error('ML5 or facemesh not available after waiting');
      }
      console.log('[ML5FaceMesh] ML5 is available, creating facemesh model...');
      if (typeof ml5.facemesh !== 'function') {
        console.error('[ML5FaceMesh] ml5.facemesh is not a function!');
        throw new Error('ml5.facemesh is not a function!');
      }
      return new Promise<void>((resolve, reject) => {
        try {
          this.facemesh = ml5.facemesh(this.modelConfig, () => {
            console.log('[ML5FaceMesh] ml5.facemesh LOAD CALLBACK invoked.');
            if (!this.facemesh) {
              console.error('[ML5FaceMesh] CRITICAL: this.facemesh is null INSIDE load callback. This should not happen.');
              reject(new Error('Facemesh model is null or undefined after load callback.'));
              return;
            }
            console.log('[ML5FaceMesh] Model loaded successfully!');
            resolve();
          });
          console.log('[ML5FaceMesh] Value of this.facemesh IMMEDIATELY AFTER ml5.facemesh() call:', this.facemesh);
          if (this.facemesh && typeof this.facemesh.on === 'function') {
            this.facemesh.on('error', (error: any) => {
              console.error('[ML5FaceMesh] Model error:', error);
              reject(error);
            });
          }
        } catch (error) {
          console.error('[ML5FaceMesh] Error during ml5.facemesh call:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('[ML5FaceMesh] Critical initialization error:', error);
      throw error;
    }
  }

  public async startTracking(videoElement: HTMLVideoElement): Promise<void> {
    console.log('[ML5FaceMesh] Starting face tracking...');
    if (!this.facemesh) throw new Error('Face mesh model not loaded. Call initialize() first.');
    if (!videoElement || !videoElement.videoWidth || !videoElement.videoHeight) {
      console.error('[ML5FaceMesh] Video element not ready or invalid.');
      throw new Error('Video element not ready or invalid.');
    }
    
    this.videoElement = videoElement;
    this.isTracking = true;
    this.isRunning = true; 
    console.log('[ML5FaceMesh] Video element ready, queueing detection loop start...');
    // Add a slight delay before the first detectionLoop call to let the model "settle"
    setTimeout(() => {
        if (this.isRunning && this.isTracking && this.facemesh && this.videoElement) { // Re-check conditions
            console.log('[ML5FaceMesh] Initiating detection loop after delay.');
            this.detectionLoop();
        }
    }, 100); // 100ms delay, can be adjusted
  }

  private async detectionLoop(): Promise<void> {
    if (!this.isTracking || !this.facemesh || !this.videoElement || !this.isRunning) {
      // console.log('[ML5FaceMesh] Detection loop conditions not met or stopped. Exiting loop.'); // Can be noisy
      return;
    }

    try {
      if (this.facemesh.predict && typeof this.facemesh.predict === 'function') {
        const predictions = await this.facemesh.predict(this.videoElement);
        this.handlePredictions(predictions);
      } else if (this.facemesh.detect && typeof this.facemesh.detect === 'function') {
        this.facemesh.detect(this.videoElement, (err: any, predictions: any) => {
          if (err) {
            console.warn('[ML5FaceMesh] Error in detect callback:', err);
            return; 
          }
          this.handlePredictions(predictions);
        });
      } else {
        console.error('[ML5FaceMesh] No suitable detection method (predict or detect) found on facemesh model.');
        this.stopTracking(); 
        return;
      }
    } catch (error) {
      console.error('[ML5FaceMesh] Error in detection loop:', error);
    }

    if (this.isRunning) {
        requestAnimationFrame(() => this.detectionLoop());
    }
  }
  
  public stopTracking(): void {
    console.log('[ML5FaceMesh] Stopping face tracking...');
    this.isTracking = false;
    this.isRunning = false; 
    this.videoElement = null; 
    this.facemesh = null; 
    this.cleanupFunctions.forEach(fn => fn());
    this.cleanupFunctions = [];
    console.log('[ML5FaceMesh] Face tracking stopped.');
  }

  private handlePredictions(predictions: any): void {
    if (predictions && predictions.length > 0) {
      this.lastPredictionTime = Date.now();
      this.predictions = predictions; 
      this.processPredictions(predictions[0]); 
    } else {
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

    // Apply smoothing to update this.lastExpressions
    // The 'this.lastExpressions' object holds the previously smoothed values.
    // We iterate over its keys and update them with new smoothed values.
    for (const key in this.lastExpressions) {
      if (Object.prototype.hasOwnProperty.call(this.lastExpressions, key) &&
          Object.prototype.hasOwnProperty.call(rawExpressions, key)) {
        
        const typedKey = key as keyof FacialExpressions;
        const rawVal = rawExpressions[typedKey];
        const lastVal = this.lastExpressions[typedKey];

        if (typeof rawVal === 'number' && typeof lastVal === 'number') {
          (this.lastExpressions as any)[typedKey] = 
            lastVal * (1 - this.smoothingAlpha) + 
            rawVal * this.smoothingAlpha;
        } else {
          // If for some reason a value isn't a number, assign directly (should not happen for FacialExpressions)
          (this.lastExpressions as any)[typedKey] = rawVal;
        }
      }
    }

    // Apply smoothing to update this.lastHeadRotation
    this.lastHeadRotation.pitch = 
      this.lastHeadRotation.pitch * (1 - this.smoothingAlpha) + 
      rawHeadRotation.pitch * this.smoothingAlpha;
    this.lastHeadRotation.yaw = 
      this.lastHeadRotation.yaw * (1 - this.smoothingAlpha) + 
      rawHeadRotation.yaw * this.smoothingAlpha;
    this.lastHeadRotation.roll = 
      this.lastHeadRotation.roll * (1 - this.smoothingAlpha) + 
      rawHeadRotation.roll * this.smoothingAlpha;
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
      const leftInnerBrowY = landmarks[53] ? landmarks[53][1] : null;
      const leftUpperEyelidY = landmarks[159] ? landmarks[159][1] : null;
      const rightInnerBrowY = landmarks[283] ? landmarks[283][1] : null;
      const rightUpperEyelidY = landmarks[386] ? landmarks[386][1] : null;

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
        console.log(`[ExpressionsDebug] EyebrowRaise (Inner) - RawLeft: ${rawLeftBrowRaiseRatio.toFixed(3)}, RawRight: ${rawRightBrowRaiseRatio.toFixed(3)}, Threshold: ${eyebrowRaiseThreshold.toFixed(3)}`);
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

  private eyeAspectRatio(eyePoints: number[][]): number {
    const v1 = Math.hypot(eyePoints[1][0] - eyePoints[5][0], eyePoints[1][1] - eyePoints[5][1]);
    const v2 = Math.hypot(eyePoints[2][0] - eyePoints[4][0], eyePoints[2][1] - eyePoints[4][1]);
    const h = Math.hypot(eyePoints[0][0] - eyePoints[3][0], eyePoints[0][1] - eyePoints[3][1]);
    if (h === 0) return 0.3; // Avoid division by zero, return a neutral EAR
    const ear = (v1 + v2) / (2.0 * h);
    return ear;
  }
}