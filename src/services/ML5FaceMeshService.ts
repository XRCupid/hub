import { FacialExpressions } from '../types/tracking';

declare const ml5: any;

interface FaceMeshPrediction {
  scaledMesh: number[][];
  mesh: number[][];
  annotations: {
    silhouette: number[][];
    lipsUpperOuter: number[][];
    lipsLowerOuter: number[][];
    lipsUpperInner: number[][];
    lipsLowerInner: number[][];
    rightEyeUpper0: number[][];
    rightEyeLower0: number[][];
    rightEyeUpper1: number[][];
    rightEyeLower1: number[][];
    rightEyeUpper2: number[][];
    rightEyeLower2: number[][];
    rightEyeLower3: number[][];
    rightEyebrowUpper: number[][];
    rightEyebrowLower: number[][];
    leftEyeUpper0: number[][];
    leftEyeLower0: number[][];
    leftEyeUpper1: number[][];
    leftEyeLower1: number[][];
    leftEyeUpper2: number[][];
    leftEyeLower2: number[][];
    leftEyeLower3: number[][];
    leftEyebrowUpper: number[][];
    leftEyebrowLower: number[][];
    midwayBetweenEyes: number[][];
    noseTip: number[][];
    noseBottom: number[][];
    noseRightCorner: number[][];
    noseLeftCorner: number[][];
    rightCheek: number[][];
    leftCheek: number[][];
  };
}

export class ML5FaceMeshService {
  private facemesh: any = null;
  private videoElement: HTMLVideoElement | null = null;
  private isTracking = false;
  private lastExpressions: FacialExpressions = {
    mouthSmile: 0,
    mouthFrown: 0,
    mouthOpen: 0,
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
    cheekPuff: 0,
    jawOpen: 0,
    noseSneer: 0,
    tongueOut: 0,
    eyebrowRaiseLeft: 0,
    eyebrowRaiseRight: 0,
    eyebrowFurrow: 0,
    jawLeft: 0,
    jawRight: 0,
    mouthPucker: 0,
  };
  private predictions: FaceMeshPrediction[] = [];
  private hasLoggedAnnotations = false;
  private firstTime = true;
  
  async initialize() {
    console.log('[ML5FaceMesh] Initializing...');
    return new Promise<void>((resolve, reject) => {
      // Check if ml5 is available
      if (typeof ml5 === 'undefined') {
        console.error('[ML5FaceMesh] ml5 is not loaded! Make sure ml5.js is included in your HTML');
        // Don't reject, just resolve so the app can continue
        resolve();
        return;
      }
      
      try {
        // Initialize facemesh
        this.facemesh = ml5.facemesh(() => {
          console.log('[ML5FaceMesh] Model loaded successfully!');
          resolve();
        });
      } catch (error) {
        console.error('[ML5FaceMesh] Failed to initialize:', error);
        console.error('[ML5FaceMesh] ml5:', ml5);
        console.error('[ML5FaceMesh] ml5.facemesh:', ml5.facemesh);
        resolve(); // Still resolve so app continues
      }
    });
  }
  
  startTracking(videoElement: HTMLVideoElement) {
    if (!this.facemesh) {
      console.error('[ML5FaceMesh] Facemesh not initialized');
      return;
    }
    
    console.log('[ML5FaceMesh] Starting tracking...');
    this.videoElement = videoElement;
    this.isTracking = true;
    
    // Start prediction loop
    const predict = () => {
      if (!this.isTracking || !this.videoElement) {
        console.log('[ML5FaceMesh] Stopping prediction loop');
        return;
      }
      
      this.facemesh.predict(this.videoElement, (predictions: FaceMeshPrediction[]) => {
        if (predictions && predictions.length > 0) {
          console.log('[ML5FaceMesh] Got predictions:', predictions.length);
          this.predictions = predictions;
          this.processPredictions(predictions);
        }
        
        // Continue prediction loop
        if (this.isTracking) {
          requestAnimationFrame(predict);
        }
      });
    };
    
    // Start the prediction loop
    predict();
  }
  
  stopTracking() {
    console.log('[ML5FaceMesh] Stopping tracking...');
    this.isTracking = false;
    this.videoElement = null;
  }
  
  private processPredictions(predictions: FaceMeshPrediction[]) {
    if (predictions.length === 0) return;
    
    const face = predictions[0];
    const annotations = face.annotations;
    const mesh = face.scaledMesh;
    
    // Log available annotations
    if (this.firstTime) {
      console.log('[ML5] Available annotations:', Object.keys(annotations));
      console.log('[ML5] Annotation details:', {
        rightEyeUpper0: annotations.rightEyeUpper0 ? `Array of ${annotations.rightEyeUpper0.length} points` : 'undefined',
        rightEyeLower0: annotations.rightEyeLower0 ? `Array of ${annotations.rightEyeLower0.length} points` : 'undefined',
        leftEyeUpper0: annotations.leftEyeUpper0 ? `Array of ${annotations.leftEyeUpper0.length} points` : 'undefined',
        leftEyeLower0: annotations.leftEyeLower0 ? `Array of ${annotations.leftEyeLower0.length} points` : 'undefined'
      });
      this.firstTime = false;
    }
    
    // Calculate mouth open (distance between upper and lower lips)
    const upperLip = annotations.lipsUpperInner;
    const lowerLip = annotations.lipsLowerInner;
    if (upperLip && lowerLip && upperLip[5] && lowerLip[5]) {
      const mouthOpenDistance = Math.abs(upperLip[5][1] - lowerLip[5][1]);
      // More sensitive: was /20, now /10
      this.lastExpressions.mouthOpen = Math.min(mouthOpenDistance / 10, 1);
      this.lastExpressions.jawOpen = this.lastExpressions.mouthOpen; // Mirror to jawOpen
      
      if (mouthOpenDistance > 2) {
        console.log(`[ML5] Mouth open distance: ${mouthOpenDistance.toFixed(1)}, value: ${this.lastExpressions.mouthOpen.toFixed(2)}`);
      }
    }
    
    // Calculate smile (corners of mouth relative to center)
    const leftMouthCorner = annotations.lipsUpperOuter?.[0];
    const rightMouthCorner = annotations.lipsUpperOuter?.[6];
    const upperLipCenter = annotations.lipsUpperOuter?.[3];
    const lowerLipCenter = annotations.lipsLowerOuter?.[3];
    
    if (leftMouthCorner && rightMouthCorner && upperLipCenter) {
      // Check if corners are higher than center (smile) or lower (frown)
      const leftCornerHeight = leftMouthCorner[1] - upperLipCenter[1];
      const rightCornerHeight = rightMouthCorner[1] - upperLipCenter[1];
      const avgCornerHeight = (leftCornerHeight + rightCornerHeight) / 2;
      
      // More sensitive: was /8, now /4
      this.lastExpressions.mouthSmile = Math.max(0, Math.min(-avgCornerHeight / 4, 1));
      this.lastExpressions.mouthFrown = Math.max(0, Math.min(avgCornerHeight / 4, 1));
      
      // Debug logging
      if (Math.abs(avgCornerHeight) > 1) {
        console.log(`[ML5] Mouth corners: ${avgCornerHeight.toFixed(2)} (smile: ${this.lastExpressions.mouthSmile.toFixed(2)}, frown: ${this.lastExpressions.mouthFrown.toFixed(2)})`);
      }
    }
    
    // Calculate mouth pucker (lips pushed forward)
    if (upperLip && lowerLip) {
      // Calculate horizontal width and vertical height
      const lipWidth = Math.abs(annotations.lipsUpperOuter?.[0]?.[0] - annotations.lipsUpperOuter?.[6]?.[0]) || 50;
      const lipHeight = Math.abs(upperLip[5][1] - lowerLip[5][1]);
      
      // Pucker is when lips are narrower and slightly open
      const widthRatio = lipWidth / 60; // Normal width around 60
      const heightRatio = lipHeight / 20; // Normal closed mouth height
      
      // Pucker when width is small and height is moderate
      this.lastExpressions.mouthPucker = Math.max(0, Math.min((1.2 - widthRatio) * heightRatio, 1));
      
      if (this.lastExpressions.mouthPucker > 0.1) {
        console.log(`[ML5] Mouth pucker: ${this.lastExpressions.mouthPucker.toFixed(2)} (width: ${lipWidth.toFixed(0)}, height: ${lipHeight.toFixed(0)})`);
      }
    }
    
    // Calculate eye blinks more accurately
    // Always use simplified mesh-based tracking for eyes since it's more reliable
    if (mesh && mesh.length >= 468) {
      // Use specific mesh indices for eye landmarks
      // Right eye: upper lid point 159, lower lid point 145
      // Left eye: upper lid point 386, lower lid point 374
      
      try {
        // Right eye
        const rightUpper = mesh[159];
        const rightLower = mesh[145];
        if (rightUpper && rightLower) {
          const rightEyeDistance = Math.abs(rightUpper[1] - rightLower[1]);
          const normalOpenDistance = 10;
          const closedThreshold = 3;
          
          this.lastExpressions.eyeBlinkRight = Math.max(0, Math.min(1 - ((rightEyeDistance - closedThreshold) / (normalOpenDistance - closedThreshold)), 1));
          this.lastExpressions.eyeWideRight = Math.max(0, (rightEyeDistance - normalOpenDistance) / 5);
          
          if (this.lastExpressions.eyeBlinkRight > 0.05 || rightEyeDistance < 8) {
            console.log(`[ML5] Right eye: distance=${rightEyeDistance.toFixed(1)}, blink=${this.lastExpressions.eyeBlinkRight.toFixed(2)}`);
          }
        }
        
        // Left eye
        const leftUpper = mesh[386];
        const leftLower = mesh[374];
        if (leftUpper && leftLower) {
          const leftEyeDistance = Math.abs(leftUpper[1] - leftLower[1]);
          const normalOpenDistance = 10;
          const closedThreshold = 3;
          
          this.lastExpressions.eyeBlinkLeft = Math.max(0, Math.min(1 - ((leftEyeDistance - closedThreshold) / (normalOpenDistance - closedThreshold)), 1));
          this.lastExpressions.eyeWideLeft = Math.max(0, (leftEyeDistance - normalOpenDistance) / 5);
          
          if (this.lastExpressions.eyeBlinkLeft > 0.05 || leftEyeDistance < 8) {
            console.log(`[ML5] Left eye: distance=${leftEyeDistance.toFixed(1)}, blink=${this.lastExpressions.eyeBlinkLeft.toFixed(2)}`);
          }
        }
      } catch (error) {
        console.error('[ML5] Error accessing mesh points:', error);
      }
    }

    // Calculate eyebrow movements using specific landmarks
    const rightEyebrow = annotations.rightEyebrowUpper;
    const leftEyebrow = annotations.leftEyebrowUpper;
    
    if (rightEyebrow && rightEyebrow.length > 2) {
      // Get the middle point of the eyebrow
      const midPoint = Math.floor(rightEyebrow.length / 2);
      const browHeight = rightEyebrow[midPoint][1];
      
      // Normal eyebrow position is around 80-90 pixels
      // Raised eyebrow is around 70-80 pixels
      const normalBrowHeight = 90;
      const raisedThreshold = 70;
      
      // Calculate raise amount (0 = normal, 1 = fully raised)
      this.lastExpressions.eyebrowRaiseRight = Math.max(0, Math.min((normalBrowHeight - browHeight) / (normalBrowHeight - raisedThreshold), 1));
      
      if (this.lastExpressions.eyebrowRaiseRight > 0.1) {
        console.log(`[ML5] Right eyebrow: height=${browHeight.toFixed(1)}, raise=${this.lastExpressions.eyebrowRaiseRight.toFixed(2)}`);
      }
    } else if (mesh && mesh.length >= 468) {
      // Fallback: use mesh points for eyebrows
      // Right eyebrow center point: 70
      try {
        const rightBrowPoint = mesh[70];
        if (rightBrowPoint) {
          const browHeight = rightBrowPoint[1];
          const normalBrowHeight = 90;
          const raisedThreshold = 70;
          this.lastExpressions.eyebrowRaiseRight = Math.max(0, Math.min((normalBrowHeight - browHeight) / (normalBrowHeight - raisedThreshold), 1));
          
          if (this.lastExpressions.eyebrowRaiseRight > 0.1) {
            console.log(`[ML5] Right eyebrow (mesh): height=${browHeight.toFixed(1)}, raise=${this.lastExpressions.eyebrowRaiseRight.toFixed(2)}`);
          }
        }
      } catch (error) {
        console.error('[ML5] Error accessing eyebrow mesh point:', error);
      }
    }
    
    if (leftEyebrow && leftEyebrow.length > 2) {
      const midPoint = Math.floor(leftEyebrow.length / 2);
      const browHeight = leftEyebrow[midPoint][1];
      
      // Same thresholds as right eyebrow
      const normalBrowHeight = 90;
      const raisedThreshold = 70;
      
      this.lastExpressions.eyebrowRaiseLeft = Math.max(0, Math.min((normalBrowHeight - browHeight) / (normalBrowHeight - raisedThreshold), 1));
      
      if (this.lastExpressions.eyebrowRaiseLeft > 0.1) {
        console.log(`[ML5] Left eyebrow: height=${browHeight.toFixed(1)}, raise=${this.lastExpressions.eyebrowRaiseLeft.toFixed(2)}`);
      }
    } else if (mesh && mesh.length >= 468) {
      // Fallback: use mesh points for eyebrows
      // Left eyebrow center point: 300
      try {
        const leftBrowPoint = mesh[300];
        if (leftBrowPoint) {
          const browHeight = leftBrowPoint[1];
          const normalBrowHeight = 90;
          const raisedThreshold = 70;
          this.lastExpressions.eyebrowRaiseLeft = Math.max(0, Math.min((normalBrowHeight - browHeight) / (normalBrowHeight - raisedThreshold), 1));
          
          if (this.lastExpressions.eyebrowRaiseLeft > 0.1) {
            console.log(`[ML5] Left eyebrow (mesh): height=${browHeight.toFixed(1)}, raise=${this.lastExpressions.eyebrowRaiseLeft.toFixed(2)}`);
          }
        }
      } catch (error) {
        console.error('[ML5] Error accessing eyebrow mesh point:', error);
      }
    }

    // Eyebrow furrow - check inner eyebrow points
    if (rightEyebrow && leftEyebrow && rightEyebrow[0] && leftEyebrow[4]) {
      const innerBrowDistance = Math.abs(rightEyebrow[0][0] - leftEyebrow[4][0]);
      this.lastExpressions.eyebrowFurrow = Math.max(0, Math.min((50 - innerBrowDistance) / 20, 1));
    }
    
    // Head rotation based on nose
    const noseTip = annotations.noseTip?.[0];
    const noseBottom = annotations.noseBottom?.[0];
    if (noseTip && noseBottom) {
      const noseX = noseTip[0];
      const centerX = 320; // Assuming 640px width
      const turnRatio = (noseX - centerX) / centerX;
      
      this.lastExpressions.jawLeft = Math.max(0, Math.min(-turnRatio * 3, 1));
      this.lastExpressions.jawRight = Math.max(0, Math.min(turnRatio * 3, 1));
    }
    
    // Cheek puff - detect based on face width at cheek level
    const rightCheekAnnotation = annotations.rightCheek;
    const leftCheekAnnotation = annotations.leftCheek;
    
    if (rightCheekAnnotation && leftCheekAnnotation && rightCheekAnnotation.length > 0) {
      // Get the outermost cheek points
      const rightCheekOuter = rightCheekAnnotation[rightCheekAnnotation.length - 1];
      const leftCheekOuter = leftCheekAnnotation[0];
      
      if (rightCheekOuter && leftCheekOuter) {
        const cheekWidth = Math.abs(rightCheekOuter[0] - leftCheekOuter[0]);
        const normalWidth = 140; // Approximate normal cheek width
        
        // Cheek puff when cheeks are wider than normal
        this.lastExpressions.cheekPuff = Math.max(0, Math.min((cheekWidth - normalWidth) / 20, 1));
        
        if (this.lastExpressions.cheekPuff > 0.1) {
          console.log(`[ML5] Cheek puff: ${this.lastExpressions.cheekPuff.toFixed(2)} (width: ${cheekWidth.toFixed(0)})`);
        }
      }
    }
    
    // Smooth out the expressions to avoid jittery movements
    Object.keys(this.lastExpressions).forEach(key => {
      const currentValue = this.lastExpressions[key];
      
      // Special handling for blinks - no damping for quick movements
      if (key.includes('eyeBlink')) {
        // Blinks need to be responsive, so minimal damping
        this.lastExpressions[key] = currentValue > 0.02 ? currentValue : 0; 
      } else {
        // Other expressions can have slight damping
        if (currentValue > 0.01) { 
          this.lastExpressions[key] = currentValue * 0.95; 
        } else {
          this.lastExpressions[key] = 0;
        }
      }
    });
  }
  
  getExpressions(): FacialExpressions {
    return { ...this.lastExpressions };
  }
  
  getHeadRotation(): { pitch: number; yaw: number; roll: number } | null {
    if (this.predictions.length === 0) return null;
    
    const face = this.predictions[0];
    const mesh = face.scaledMesh;
    
    // Use key facial landmarks to estimate head rotation
    // This is a simplified estimation
    const noseTip = mesh[1];
    const leftEye = mesh[33];
    const rightEye = mesh[263];
    
    if (!noseTip || !leftEye || !rightEye) return null;
    
    // Calculate yaw (left-right rotation)
    const eyeCenter = [
      (leftEye[0] + rightEye[0]) / 2,
      (leftEye[1] + rightEye[1]) / 2
    ];
    const yaw = Math.atan2(noseTip[0] - eyeCenter[0], 100) * (180 / Math.PI);
    
    // Calculate pitch (up-down rotation)
    const pitch = Math.atan2(noseTip[1] - eyeCenter[1], 100) * (180 / Math.PI);
    
    // Calculate roll (tilt)
    const roll = Math.atan2(rightEye[1] - leftEye[1], rightEye[0] - leftEye[0]) * (180 / Math.PI);
    
    return { pitch, yaw, roll };
  }
}
