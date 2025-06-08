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

  // Map ML5 keypoint names to our PostureData keypoint names
  private keypointMap: { [key: string]: keyof PostureData['keypoints'] } = {
    'nose': 'nose',
    'leftEye': 'leftEye',
    'rightEye': 'rightEye',
    'leftEar': 'leftEar',
    'rightEar': 'rightEar',
    'leftShoulder': 'leftShoulder',
    'rightShoulder': 'rightShoulder',
    'leftElbow': 'leftElbow',
    'rightElbow': 'rightElbow',
    'leftWrist': 'leftWrist',
    'rightWrist': 'rightWrist',
    'leftHip': 'leftHip',
    'rightHip': 'rightHip',
    'leftKnee': 'leftKnee',
    'rightKnee': 'rightKnee',
    'leftAnkle': 'leftAnkle',
    'rightAnkle': 'rightAnkle'
  };

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

    // Log all keypoint scores for debugging
    console.log('[PostureTracking] Keypoint scores:', keypoints.map((kp: any) => ({
      part: kp.part,
      score: kp.score.toFixed(3),
      position: { x: kp.position.x.toFixed(0), y: kp.position.y.toFixed(0) }
    })));

    // Convert ML5 PoseNet keypoints to our PostureData format
    const postureData: PostureData = {
      confidence: pose.score || 0,
      keypoints: {}
    };

    // Lower confidence threshold to 0.05 for testing
    const minConfidence = 0.05;

    // Map keypoints
    keypoints.forEach((kp: any) => {
      if (kp.score > minConfidence) {
        const mappedName = this.keypointMap[kp.part];
        if (mappedName) {
          postureData.keypoints[mappedName] = {
            x: kp.position.x,
            y: kp.position.y,
            confidence: kp.score
          };
        }
      }
    });
    
    // Log arm keypoints specifically - including those below threshold
    const armParts = ['leftShoulder', 'leftElbow', 'leftWrist', 'rightShoulder', 'rightElbow', 'rightWrist'];
    console.log('[PostureTracking] All arm keypoints (including low confidence):', 
      keypoints
        .filter((kp: any) => armParts.includes(kp.part))
        .map((kp: any) => ({
          part: kp.part,
          score: kp.score.toFixed(3),
          position: { x: kp.position.x.toFixed(0), y: kp.position.y.toFixed(0) },
          mapped: this.keypointMap[kp.part],
          included: kp.score > minConfidence
        }))
    );
    
    // Log which keypoints failed the confidence threshold
    const failedKeypoints = keypoints.filter((kp: any) => 
      kp.score <= minConfidence && armParts.includes(kp.part)
    );
    if (failedKeypoints.length > 0) {
      console.log('[PostureTracking] Low confidence arm keypoints:', failedKeypoints.map((kp: any) => ({
        part: kp.part,
        score: kp.score.toFixed(3)
      })));
    }

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
    if (keypoint && keypoint.score > 0.1) { // Only return if confidence is decent
      return {
        x: keypoint.position.x,
        y: keypoint.position.y,
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
        imageScaleFactor: 0.5, // Increased from 0.3 for better accuracy
        outputStride: 16,
        flipHorizontal: true,
        minConfidence: 0.1, // Lowered from 0.5
        maxPoseDetections: 1,
        scoreThreshold: 0.1, // Lowered from 0.5
        nmsRadius: 20,
        detectionType: 'single',
        multiplier: 1.0 // Increased from 0.75 for better accuracy
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
