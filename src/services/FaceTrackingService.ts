import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/face-landmarks-detection';

export interface FacialExpressions {
  mouthSmile: number;
  mouthOpen: number;
  eyeBlink: number;
  eyebrowRaise: number;
  eyeSquint: number;
  mouthFrown: number;
  cheekPuff: number;
  jawLeft: number;
  jawRight: number;
}

export interface FaceTrackingData {
  headRotation: { pitch: number; yaw: number; roll: number };
  eyeGaze: { x: number; y: number };
  bodyPosture: { lean: number; openness: number };
  facialExpressions: FacialExpressions;
}

export class FaceTrackingService {
  private model: facemesh.FaceLandmarksDetector | null = null;
  private video: HTMLVideoElement | null = null;
  private isTracking = false;
  private lastExpressions: FacialExpressions = {
    mouthSmile: 0,
    mouthOpen: 0,
    eyeBlink: 0,
    eyebrowRaise: 0,
    eyeSquint: 0,
    mouthFrown: 0,
    cheekPuff: 0,
    jawLeft: 0,
    jawRight: 0
  };

  async initialize() {
    try {
      // Ensure TensorFlow.js is ready
      await tf.ready();
      console.log('TensorFlow.js is ready, backend:', tf.getBackend());
      
      // Try using the legacy model which often works better
      const model = facemesh.SupportedModels.MediaPipeFaceMesh;
      const detectorConfig = {
        runtime: 'tfjs' as const,
        maxFaces: 1,
        refineLandmarks: false, // Try without refinement first
        modelType: 'short' // Use short-range model for webcam
      };
      
      console.log('Loading face detection model with config:', detectorConfig);
      this.model = await facemesh.createDetector(model, detectorConfig);
      console.log('Face tracking model loaded successfully');
      
      // Test if the model works with a simple tensor
      try {
        const testTensor = tf.zeros([1, 192, 192, 3]);
        console.log('Created test tensor:', testTensor.shape);
        testTensor.dispose();
      } catch (testError) {
        console.error('Test tensor creation failed:', testError);
      }
    } catch (error) {
      console.error('Failed to load face tracking model:', error);
    }
  }

  async startTracking(video: HTMLVideoElement): Promise<void> {
    console.log('[FaceTrackingService] startTracking called');
    this.video = video;
    
    // Ensure video is visible for face detection
    if (this.video.style.display === 'none' || this.video.style.visibility === 'hidden') {
      console.warn('[FaceTrackingService] Video element is hidden - face detection may not work');
    }
    
    // Check video dimensions
    const rect = this.video.getBoundingClientRect();
    console.log('[FaceTrackingService] Video element dimensions:', {
      width: rect.width,
      height: rect.height,
      visible: rect.width > 0 && rect.height > 0
    });
    
    this.isTracking = true;
    console.log('[FaceTrackingService] Starting tracking loop');
    this.track();
  }

  stopTracking() {
    this.isTracking = false;
  }

  private async track() {
    if (!this.isTracking || !this.video || !this.model) {
      console.log('[FaceTrackingService] Track stopped:', {
        isTracking: this.isTracking,
        hasVideo: !!this.video,
        hasModel: !!this.model
      });
      return;
    }

    try {
      // Debug video element
      console.log('[FaceTrackingService] Video element state:', {
        readyState: this.video.readyState,
        videoWidth: this.video.videoWidth,
        videoHeight: this.video.videoHeight,
        currentTime: this.video.currentTime,
        paused: this.video.paused
      });

      // Create a canvas to test if video is being rendered
      const canvas = document.createElement('canvas');
      canvas.width = this.video.videoWidth;
      canvas.height = this.video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(this.video, 0, 0);
        const imageData = ctx.getImageData(0, 0, 10, 10);
        const hasContent = imageData.data.some(pixel => pixel > 0);
        console.log('[FaceTrackingService] Canvas has content:', hasContent);
      }

      const predictions = await this.model.estimateFaces(this.video);
      console.log('[FaceTrackingService] Predictions:', predictions.length);
      
      if (predictions.length > 0) {
        const face = predictions[0];
        const keypoints = face.keypoints;
        console.log('[FaceTrackingService] Face detected with', keypoints.length, 'keypoints');
        
        // Calculate facial expressions based on landmark positions
        const expressions = this.calculateExpressions(keypoints);
        console.log('[FaceTrackingService] Calculated expressions:', expressions);
        
        // Smooth the values
        Object.keys(expressions).forEach(key => {
          const k = key as keyof FacialExpressions;
          this.lastExpressions[k] = this.lastExpressions[k] * 0.7 + expressions[k] * 0.3;
        });
      } else {
        console.log('[FaceTrackingService] No face detected - ensure your face is visible in the camera');
      }
    } catch (error) {
      console.error('Face tracking error:', error);
      console.error('Error details:', {
        message: (error as any).message,
        stack: (error as any).stack,
        name: (error as any).name
      });
    }

    // Continue tracking
    if (this.isTracking) {
      requestAnimationFrame(() => this.track());
    }
  }

  private calculateExpressions(keypoints: any[]): FacialExpressions {
    // Key landmark indices for MediaPipe Face Mesh
    const landmarks = {
      // Mouth corners
      mouthLeft: 61,
      mouthRight: 291,
      mouthTop: 13,
      mouthBottom: 14,
      
      // Eyes
      leftEyeTop: 159,
      leftEyeBottom: 145,
      rightEyeTop: 386,
      rightEyeBottom: 374,
      
      // Eyebrows
      leftBrowInner: 46,
      leftBrowOuter: 35,
      rightBrowInner: 276,
      rightBrowOuter: 265,
      
      // Face outline
      chin: 152,
      leftCheek: 116,
      rightCheek: 345
    };

    // Calculate mouth smile (corners up)
    const mouthWidth = this.distance(keypoints[landmarks.mouthLeft], keypoints[landmarks.mouthRight]);
    const mouthHeight = this.distance(keypoints[landmarks.mouthTop], keypoints[landmarks.mouthBottom]);
    const mouthOpen = Math.min(1, mouthHeight / (mouthWidth * 0.3));
    
    // Calculate smile by checking if mouth corners are higher than center
    const mouthCenterY = (keypoints[landmarks.mouthTop].y + keypoints[landmarks.mouthBottom].y) / 2;
    const leftCornerLift = mouthCenterY - keypoints[landmarks.mouthLeft].y;
    const rightCornerLift = mouthCenterY - keypoints[landmarks.mouthRight].y;
    const mouthSmile = Math.max(0, Math.min(1, (leftCornerLift + rightCornerLift) / (mouthWidth * 0.1)));

    // Calculate eye blink
    const leftEyeHeight = this.distance(keypoints[landmarks.leftEyeTop], keypoints[landmarks.leftEyeBottom]);
    const rightEyeHeight = this.distance(keypoints[landmarks.rightEyeTop], keypoints[landmarks.rightEyeBottom]);
    const eyeBlink = 1 - Math.min(1, ((leftEyeHeight + rightEyeHeight) / 2) / (mouthWidth * 0.06));

    // Calculate eyebrow raise
    const leftBrowHeight = keypoints[landmarks.leftBrowOuter].y - keypoints[landmarks.leftEyeTop].y;
    const rightBrowHeight = keypoints[landmarks.rightBrowOuter].y - keypoints[landmarks.rightEyeTop].y;
    const browNeutral = mouthWidth * 0.15;
    const eyebrowRaise = Math.max(0, Math.min(1, 1 - ((leftBrowHeight + rightBrowHeight) / 2) / browNeutral));

    // Simplified calculations for other expressions
    const eyeSquint = Math.max(0, 1 - ((leftEyeHeight + rightEyeHeight) / 2) / (mouthWidth * 0.05)) * (1 - eyeBlink);
    const mouthFrown = Math.max(0, -mouthSmile);
    
    // Check jaw position
    const chinCenterX = keypoints[landmarks.chin].x;
    const faceCenterX = (keypoints[landmarks.leftCheek].x + keypoints[landmarks.rightCheek].x) / 2;
    const jawOffset = (chinCenterX - faceCenterX) / mouthWidth;
    const jawLeft = Math.max(0, -jawOffset);
    const jawRight = Math.max(0, jawOffset);

    // Cheek puff is harder to detect without depth, approximate with face width
    const faceWidth = this.distance(keypoints[landmarks.leftCheek], keypoints[landmarks.rightCheek]);
    const cheekPuff = Math.max(0, Math.min(1, (faceWidth / mouthWidth - 2.5) * 2));

    return {
      mouthSmile,
      mouthOpen,
      eyeBlink,
      eyebrowRaise,
      eyeSquint,
      mouthFrown,
      cheekPuff,
      jawLeft,
      jawRight
    };
  }

  private distance(p1: any, p2: any): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getCurrentExpressions(): FacialExpressions {
    return { ...this.lastExpressions };
  }

  getTrackingData(): FaceTrackingData {
    // For now, return mock head rotation and eye gaze
    // These could be calculated from face landmarks as well
    return {
      headRotation: { pitch: 0, yaw: 0, roll: 0 },
      eyeGaze: { x: 0, y: 0 },
      bodyPosture: { lean: 0, openness: 0.7 },
      facialExpressions: this.getCurrentExpressions()
    };
  }
}

// Singleton instance
export const faceTracker = new FaceTrackingService();
