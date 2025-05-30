import { FacialBlendShapes } from './AvatarMirrorSystem';

// MediaPipe imports with proper syntax
const FaceMesh = (window as any).FaceMesh || require('@mediapipe/face_mesh').FaceMesh;
const Camera = (window as any).Camera || require('@mediapipe/camera_utils').Camera;

interface Results {
  multiFaceLandmarks?: Array<Array<{x: number; y: number; z: number}>>;
  image: HTMLCanvasElement;
}

export class FacialTrackingService {
  private faceMesh: any;
  private camera: any;
  private isTracking = false;
  private onResultsCallback?: (blendShapes: FacialBlendShapes) => void;

  constructor() {
    // Initialize FaceMesh only if available
    if (typeof FaceMesh !== 'undefined') {
      this.faceMesh = new FaceMesh({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });

      this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.faceMesh.onResults(this.onResults.bind(this));
    } else {
      console.warn('FaceMesh not available, using mock tracking');
    }
  }

  async startTracking(videoElement: HTMLVideoElement, onResults: (blendShapes: FacialBlendShapes) => void) {
    this.onResultsCallback = onResults;
    
    // If MediaPipe is not available, use mock tracking
    if (!this.faceMesh || typeof Camera === 'undefined') {
      console.log('Using mock facial tracking');
      this.startMockTracking();
      return;
    }
    
    if (this.camera) {
      this.camera.stop();
    }

    this.camera = new Camera(videoElement, {
      onFrame: async () => {
        if (this.isTracking && this.faceMesh) {
          await this.faceMesh.send({ image: videoElement });
        }
      },
      width: 1280,
      height: 720
    });

    this.isTracking = true;
    await this.camera.start();
  }

  private startMockTracking() {
    this.isTracking = true;
    
    // Simulate facial tracking with random values
    const mockInterval = setInterval(() => {
      if (!this.isTracking) {
        clearInterval(mockInterval);
        return;
      }
      
      const mockBlendShapes: FacialBlendShapes = {
        eyeBlinkLeft: Math.random() < 0.1 ? 1 : 0,
        eyeBlinkRight: Math.random() < 0.1 ? 1 : 0,
        mouthSmileLeft: Math.random() * 0.5,
        mouthSmileRight: Math.random() * 0.5,
        jawOpen: Math.random() * 0.3,
        browInnerUp: Math.random() * 0.3,
        browDownLeft: 0,
        browDownRight: 0
      };
      
      if (this.onResultsCallback) {
        this.onResultsCallback(mockBlendShapes);
      }
    }, 100);
  }

  stopTracking() {
    this.isTracking = false;
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }
  }

  private onResults(results: Results) {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    const blendShapes = this.calculateBlendShapes(landmarks);
    
    if (this.onResultsCallback) {
      this.onResultsCallback(blendShapes);
    }
  }

  private calculateBlendShapes(landmarks: any[]): FacialBlendShapes {
    // Simple blend shape calculations based on landmark distances
    // These are approximations - in production you'd use more sophisticated calculations
    
    const blendShapes: FacialBlendShapes = {};

    // Eye blink detection
    const leftEyeTop = landmarks[159];
    const leftEyeBottom = landmarks[145];
    const leftEyeHeight = Math.abs(leftEyeTop.y - leftEyeBottom.y);
    blendShapes.eyeBlinkLeft = leftEyeHeight < 0.02 ? 1 : 0;

    const rightEyeTop = landmarks[386];
    const rightEyeBottom = landmarks[374];
    const rightEyeHeight = Math.abs(rightEyeTop.y - rightEyeBottom.y);
    blendShapes.eyeBlinkRight = rightEyeHeight < 0.02 ? 1 : 0;

    // Mouth smile detection
    const mouthLeft = landmarks[61];
    const mouthRight = landmarks[291];
    const mouthCenter = landmarks[13];
    const leftSmile = mouthLeft.y - mouthCenter.y;
    const rightSmile = mouthRight.y - mouthCenter.y;
    
    blendShapes.mouthSmileLeft = Math.max(0, -leftSmile * 10);
    blendShapes.mouthSmileRight = Math.max(0, -rightSmile * 10);

    // Jaw open
    const upperLip = landmarks[13];
    const lowerLip = landmarks[14];
    const mouthOpenness = Math.abs(upperLip.y - lowerLip.y);
    blendShapes.jawOpen = Math.min(1, mouthOpenness * 5);

    // Eyebrow detection
    const leftBrowInner = landmarks[46];
    const leftBrowOuter = landmarks[35];
    const rightBrowInner = landmarks[276];
    const rightBrowOuter = landmarks[265];
    
    // Simple brow raise detection
    const leftBrowHeight = 0.5 - leftBrowInner.y;
    const rightBrowHeight = 0.5 - rightBrowInner.y;
    
    blendShapes.browInnerUp = Math.max(0, (leftBrowHeight + rightBrowHeight) * 5);
    blendShapes.browDownLeft = Math.max(0, -leftBrowHeight * 5);
    blendShapes.browDownRight = Math.max(0, -rightBrowHeight * 5);

    return blendShapes;
  }
}

export const facialTrackingService = new FacialTrackingService();
