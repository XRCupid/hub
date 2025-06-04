import { PostureData } from '../types/tracking';

declare const ml5: any;
declare global {
  interface Window {
    ml5: any;
  }
}

export class PostureTrackingService {
  private poseNet: any = null;
  private videoElement: HTMLVideoElement | null = null;
  private lastPostureData: PostureData | null = null;
  private isTracking: boolean = false;
  private onResultsCallback: ((data: PostureData) => void) | null = null;

  constructor() {
    console.log('[PostureTracking] Initializing ML5 PoseNet service...');
  }

  async initialize() {
    try {
      console.log('[PostureTracking] Waiting for ML5 to load...');
      // ML5 PoseNet will be initialized when we have a video element
      console.log('[PostureTracking] ML5 PoseNet ready to initialize');
    } catch (error) {
      console.error('[PostureTracking] Failed to initialize:', error);
    }
  }

  private handlePose(poses: any[]) {
    if (!poses || poses.length === 0) {
      return;
    }

    const pose = poses[0].pose;
    const keypoints = pose.keypoints;

    // Convert ML5 PoseNet keypoints to our PostureData format
    const postureData: PostureData = {
      confidence: pose.score || 0,
      keypoints: {
        nose: this.getKeypoint(keypoints, 'nose'),
        leftEye: this.getKeypoint(keypoints, 'leftEye'),
        rightEye: this.getKeypoint(keypoints, 'rightEye'),
        leftEar: this.getKeypoint(keypoints, 'leftEar'),
        rightEar: this.getKeypoint(keypoints, 'rightEar'),
        leftShoulder: this.getKeypoint(keypoints, 'leftShoulder'),
        rightShoulder: this.getKeypoint(keypoints, 'rightShoulder'),
        leftElbow: this.getKeypoint(keypoints, 'leftElbow'),
        rightElbow: this.getKeypoint(keypoints, 'rightElbow'),
        leftWrist: this.getKeypoint(keypoints, 'leftWrist'),
        rightWrist: this.getKeypoint(keypoints, 'rightWrist'),
        leftHip: this.getKeypoint(keypoints, 'leftHip'),
        rightHip: this.getKeypoint(keypoints, 'rightHip'),
        leftKnee: this.getKeypoint(keypoints, 'leftKnee'),
        rightKnee: this.getKeypoint(keypoints, 'rightKnee'),
        leftAnkle: this.getKeypoint(keypoints, 'leftAnkle'),
        rightAnkle: this.getKeypoint(keypoints, 'rightAnkle')
      }
    };

    this.lastPostureData = postureData;
    
    // Log occasionally
    if (Math.random() < 0.02) {
      console.log('[PostureTracking] Got posture data:', {
        leftShoulder: postureData.keypoints.leftShoulder,
        rightShoulder: postureData.keypoints.rightShoulder,
        confidence: postureData.confidence
      });
    }
    
    if (this.onResultsCallback) {
      this.onResultsCallback(postureData);
    }
  }

  private getKeypoint(keypoints: any[], name: string) {
    const keypoint = keypoints.find((kp: any) => kp.part === name);
    if (keypoint && keypoint.score > 0.3) { // Only return if confidence is decent
      return {
        x: keypoint.position.x / (this.videoElement?.videoWidth || 640), // Normalize to 0-1
        y: keypoint.position.y / (this.videoElement?.videoHeight || 480), // Normalize to 0-1
        confidence: keypoint.score
      };
    }
    return undefined;
  }

  async startTracking(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    this.isTracking = true;
    
    try {
      console.log('[PostureTracking] Starting ML5 PoseNet tracking...');
      console.log('[PostureTracking] Video element:', videoElement);
      console.log('[PostureTracking] Video dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
      
      if (!window.ml5) {
        console.error('[PostureTracking] ML5 is not loaded!');
        return;
      }
      
      console.log('[PostureTracking] ML5 version:', ml5.version);
      
      // Initialize PoseNet with the video element
      this.poseNet = ml5.poseNet(videoElement, {
        architecture: 'MobileNetV1',
        imageScaleFactor: 0.3,
        outputStride: 16,
        flipHorizontal: true,
        minConfidence: 0.5,
        maxPoseDetections: 1,
        scoreThreshold: 0.5,
        nmsRadius: 20,
        detectionType: 'single',
        multiplier: 0.75
      }, () => {
        console.log('[PostureTracking] ML5 PoseNet loaded successfully');
        console.log('[PostureTracking] PoseNet object:', this.poseNet);
      });

      // Set up the pose detection callback
      this.poseNet.on('pose', (results: any) => {
        console.log('[PostureTracking] Pose detected:', results.length, 'poses');
        if (this.isTracking) {
          this.handlePose(results);
        }
      });

      console.log('[PostureTracking] Started tracking - waiting for poses...');
    } catch (error) {
      console.error('[PostureTracking] Failed to start tracking:', error);
      console.error('[PostureTracking] Error stack:', (error as any).stack);
    }
  }

  stopTracking() {
    console.log('[PostureTracking] Stopping tracking...');
    this.isTracking = false;
    
    if (this.poseNet) {
      // ML5 PoseNet doesn't have a specific stop method, 
      // but setting isTracking to false will stop processing results
      this.poseNet = null;
    }
  }

  getPostureData(): PostureData | null {
    return this.lastPostureData;
  }

  onResults(callback: (data: PostureData) => void) {
    this.onResultsCallback = callback;
  }
}
