// Avatar Expression Mirroring System
// Maps user's facial expressions to RPM avatar in real-time

import { FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision';

export interface FacialBlendShapes {
  // Eyes
  eyeBlinkLeft?: number;
  eyeBlinkRight?: number;
  eyeLookDownLeft?: number;
  eyeLookDownRight?: number;
  eyeLookInLeft?: number;
  eyeLookInRight?: number;
  eyeLookOutLeft?: number;
  eyeLookOutRight?: number;
  eyeLookUpLeft?: number;
  eyeLookUpRight?: number;
  eyeSquintLeft?: number;
  eyeSquintRight?: number;
  eyeWideLeft?: number;
  eyeWideRight?: number;
  
  // Eyebrows
  browDownLeft?: number;
  browDownRight?: number;
  browInnerUp?: number;
  browOuterUpLeft?: number;
  browOuterUpRight?: number;
  
  // Jaw
  jawForward?: number;
  jawLeft?: number;
  jawRight?: number;
  jawOpen?: number;
  
  // Mouth
  mouthClose?: number;
  mouthFunnel?: number;
  mouthPucker?: number;
  mouthLeft?: number;
  mouthRight?: number;
  mouthSmileLeft?: number;
  mouthSmileRight?: number;
  mouthFrownLeft?: number;
  mouthFrownRight?: number;
  mouthDimpleLeft?: number;
  mouthDimpleRight?: number;
  mouthStretchLeft?: number;
  mouthStretchRight?: number;
  mouthRollLower?: number;
  mouthRollUpper?: number;
  mouthShrugLower?: number;
  mouthShrugUpper?: number;
  mouthPressLeft?: number;
  mouthPressRight?: number;
  mouthLowerDownLeft?: number;
  mouthLowerDownRight?: number;
  mouthUpperUpLeft?: number;
  mouthUpperUpRight?: number;
  mouthOpen?: number;
  
  // Cheek
  cheekPuff?: number;
  cheekSquintLeft?: number;
  cheekSquintRight?: number;
  
  // Nose
  noseSneerLeft?: number;
  noseSneerRight?: number;
  
  // Tongue
  tongueOut?: number;
}

export class AvatarMirrorSystem {
  private static instance: AvatarMirrorSystem;
  private faceLandmarker: FaceLandmarker | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private isInitialized = false;
  private currentBlendShapes: Partial<FacialBlendShapes> = {};
  private smoothingFactor = 0.3; // For smooth transitions
  private calibrationData: Partial<FacialBlendShapes> = {};
  private onBlendShapeUpdate?: (blendShapes: Partial<FacialBlendShapes>) => void;

  static getInstance(): AvatarMirrorSystem {
    if (!this.instance) {
      this.instance = new AvatarMirrorSystem();
    }
    return this.instance;
  }

  // Initialize the face tracking system
  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    this.videoElement = videoElement;
    
    try {
      // Initialize MediaPipe FaceLandmarker
      const vision = await import('@mediapipe/tasks-vision');
      const filesetResolver = await vision.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      this.faceLandmarker = await vision.FaceLandmarker.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU'
          },
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
          runningMode: 'VIDEO',
          numFaces: 1
        }
      );

      this.isInitialized = true;
      this.startTracking();
    } catch (error) {
      console.error('Failed to initialize AvatarMirrorSystem:', error);
    }
  }

  // Set callback for blend shape updates
  onUpdate(callback: (blendShapes: Partial<FacialBlendShapes>) => void): void {
    this.onBlendShapeUpdate = callback;
  }

  // Calibrate neutral expression
  calibrate(): void {
    this.calibrationData = { ...this.currentBlendShapes };
    console.log('Calibrated neutral expression');
  }

  // Start real-time tracking
  private startTracking(): void {
    if (!this.faceLandmarker || !this.videoElement) return;

    const processFrame = async () => {
      if (!this.videoElement || !this.faceLandmarker) return;

      try {
        const results = await this.faceLandmarker.detectForVideo(
          this.videoElement,
          performance.now()
        );

        if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
          this.processBlendShapes(results.faceBlendshapes[0]);
        }
      } catch (error) {
        console.error('Face tracking error:', error);
      }

      if (this.isInitialized) {
        requestAnimationFrame(processFrame);
      }
    };

    processFrame();
  }

  // Process and map MediaPipe blend shapes to RPM format
  private processBlendShapes(blendshapes: any): void {
    const mappedBlendShapes: Partial<FacialBlendShapes> = {};

    // Map MediaPipe categories to our blend shape names
    blendshapes.categories.forEach((category: any) => {
      const shapeName = this.mapMediaPipeToRPM(category.categoryName);
      if (shapeName) {
        // Apply calibration offset
        const calibratedValue = this.applyCalibration(shapeName, category.score);
        
        // Smooth the value
        const currentValue = this.currentBlendShapes[shapeName] || 0;
        const smoothedValue = this.smoothValue(currentValue, calibratedValue);
        
        // Apply thresholds and amplification
        mappedBlendShapes[shapeName] = this.processValue(shapeName, smoothedValue);
      }
    });

    this.currentBlendShapes = mappedBlendShapes;
    
    // Notify listeners
    if (this.onBlendShapeUpdate) {
      this.onBlendShapeUpdate(mappedBlendShapes);
    }
  }

  // Map MediaPipe category names to RPM blend shape names
  private mapMediaPipeToRPM(mediaPipeName: string): keyof FacialBlendShapes | null {
    const mappings: Record<string, keyof FacialBlendShapes> = {
      // Eyes
      'eyeBlinkLeft': 'eyeBlinkLeft',
      'eyeBlinkRight': 'eyeBlinkRight',
      'eyeLookDownLeft': 'eyeLookDownLeft',
      'eyeLookDownRight': 'eyeLookDownRight',
      'eyeLookInLeft': 'eyeLookInLeft',
      'eyeLookInRight': 'eyeLookInRight',
      'eyeLookOutLeft': 'eyeLookOutLeft',
      'eyeLookOutRight': 'eyeLookOutRight',
      'eyeLookUpLeft': 'eyeLookUpLeft',
      'eyeLookUpRight': 'eyeLookUpRight',
      'eyeSquintLeft': 'eyeSquintLeft',
      'eyeSquintRight': 'eyeSquintRight',
      'eyeWideLeft': 'eyeWideLeft',
      'eyeWideRight': 'eyeWideRight',
      
      // Eyebrows
      'browDownLeft': 'browDownLeft',
      'browDownRight': 'browDownRight',
      'browInnerUp': 'browInnerUp',
      'browOuterUpLeft': 'browOuterUpLeft',
      'browOuterUpRight': 'browOuterUpRight',
      
      // Mouth
      'mouthClose': 'mouthClose',
      'mouthFunnel': 'mouthFunnel',
      'mouthPucker': 'mouthPucker',
      'mouthLeft': 'mouthLeft',
      'mouthRight': 'mouthRight',
      'mouthSmileLeft': 'mouthSmileLeft',
      'mouthSmileRight': 'mouthSmileRight',
      'mouthFrownLeft': 'mouthFrownLeft',
      'mouthFrownRight': 'mouthFrownRight',
      'mouthDimpleLeft': 'mouthDimpleLeft',
      'mouthDimpleRight': 'mouthDimpleRight',
      'mouthStretchLeft': 'mouthStretchLeft',
      'mouthStretchRight': 'mouthStretchRight',
      'mouthRollLower': 'mouthRollLower',
      'mouthRollUpper': 'mouthRollUpper',
      'mouthShrugLower': 'mouthShrugLower',
      'mouthShrugUpper': 'mouthShrugUpper',
      'mouthPressLeft': 'mouthPressLeft',
      'mouthPressRight': 'mouthPressRight',
      'mouthLowerDownLeft': 'mouthLowerDownLeft',
      'mouthLowerDownRight': 'mouthLowerDownRight',
      'mouthUpperUpLeft': 'mouthUpperUpLeft',
      'mouthUpperUpRight': 'mouthUpperUpRight',
      
      // Jaw
      'jawForward': 'jawForward',
      'jawLeft': 'jawLeft',
      'jawRight': 'jawRight',
      'jawOpen': 'jawOpen',
      
      // Cheeks
      'cheekPuff': 'cheekPuff',
      'cheekSquintLeft': 'cheekSquintLeft',
      'cheekSquintRight': 'cheekSquintRight',
      
      // Nose
      'noseSneerLeft': 'noseSneerLeft',
      'noseSneerRight': 'noseSneerRight'
    };

    return mappings[mediaPipeName] || null;
  }

  // Apply calibration offset
  private applyCalibration(shapeName: keyof FacialBlendShapes, value: number): number {
    const calibrationValue = this.calibrationData[shapeName] || 0;
    return Math.max(0, Math.min(1, value - calibrationValue));
  }

  // Smooth value changes
  private smoothValue(currentValue: number, targetValue: number): number {
    return currentValue + (targetValue - currentValue) * this.smoothingFactor;
  }

  // Process value with thresholds and amplification
  private processValue(shapeName: keyof FacialBlendShapes, value: number): number {
    // Different shapes need different processing
    const config: Record<string, { threshold: number; amplification: number }> = {
      // Eyes are sensitive, need lower threshold
      eyeBlinkLeft: { threshold: 0.3, amplification: 1.5 },
      eyeBlinkRight: { threshold: 0.3, amplification: 1.5 },
      
      // Smiles need amplification
      mouthSmileLeft: { threshold: 0.1, amplification: 2.0 },
      mouthSmileRight: { threshold: 0.1, amplification: 2.0 },
      
      // Eyebrows are expressive
      browInnerUp: { threshold: 0.15, amplification: 1.8 },
      
      // Default
      default: { threshold: 0.1, amplification: 1.2 }
    };

    const shapeConfig = config[shapeName] || config.default;
    
    // Apply threshold
    if (value < shapeConfig.threshold) {
      return 0;
    }

    // Apply amplification
    const amplified = (value - shapeConfig.threshold) * shapeConfig.amplification;
    
    // Clamp to 0-1 range
    return Math.max(0, Math.min(1, amplified));
  }

  // Get current blend shapes
  getCurrentBlendShapes(): Partial<FacialBlendShapes> {
    return { ...this.currentBlendShapes };
  }

  // Stop tracking
  stop(): void {
    this.isInitialized = false;
    if (this.faceLandmarker) {
      this.faceLandmarker.close();
      this.faceLandmarker = null;
    }
  }

  // Utility to create expression presets
  createExpressionPreset(name: string): Partial<FacialBlendShapes> {
    const presets: Record<string, Partial<FacialBlendShapes>> = {
      smile: {
        mouthSmileLeft: 0.8,
        mouthSmileRight: 0.8,
        cheekSquintLeft: 0.3,
        cheekSquintRight: 0.3
      },
      surprised: {
        eyeWideLeft: 0.8,
        eyeWideRight: 0.8,
        browInnerUp: 0.9,
        browOuterUpLeft: 0.7,
        browOuterUpRight: 0.7,
        jawOpen: 0.3
      },
      thinking: {
        eyeLookUpLeft: 0.4,
        eyeLookUpRight: 0.4,
        browInnerUp: 0.2,
        mouthPucker: 0.2
      },
      skeptical: {
        browDownLeft: 0.3,
        browInnerUp: 0.4,
        eyeSquintLeft: 0.2,
        mouthLeft: 0.2
      }
    };

    return presets[name] || {};
  }
}

// Export singleton instance
export const avatarMirrorSystem = AvatarMirrorSystem.getInstance();
