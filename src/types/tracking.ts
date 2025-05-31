// Facial expression tracking data
export interface FacialExpressions {
  mouthSmile: number;
  mouthFrown: number;
  mouthOpen: number;
  mouthPucker: number;
  browUpLeft: number;
  browUpRight: number;
  browDownLeft: number;
  browDownRight: number;
  eyeSquintLeft: number;
  eyeSquintRight: number;
  eyeWideLeft: number;
  eyeWideRight: number;
  eyeBlinkLeft: number;
  eyeBlinkRight: number;
  eyebrowRaiseLeft: number;
  eyebrowRaiseRight: number;
  eyebrowFurrow: number;
  cheekPuff: number;
  jawOpen: number;
  jawLeft: number;
  jawRight: number;
  noseSneer: number;
  tongueOut: number;
  [key: string]: number; // Index signature for dynamic access
}

// Posture tracking data
export interface PostureData {
  confidence: number;
  keypoints: {
    nose?: { x: number; y: number; confidence: number };
    leftEye?: { x: number; y: number; confidence: number };
    rightEye?: { x: number; y: number; confidence: number };
    leftEar?: { x: number; y: number; confidence: number };
    rightEar?: { x: number; y: number; confidence: number };
    leftShoulder?: { x: number; y: number; confidence: number };
    rightShoulder?: { x: number; y: number; confidence: number };
    leftElbow?: { x: number; y: number; confidence: number };
    rightElbow?: { x: number; y: number; confidence: number };
    leftWrist?: { x: number; y: number; confidence: number };
    rightWrist?: { x: number; y: number; confidence: number };
    leftHip?: { x: number; y: number; confidence: number };
    rightHip?: { x: number; y: number; confidence: number };
    leftKnee?: { x: number; y: number; confidence: number };
    rightKnee?: { x: number; y: number; confidence: number };
    leftAnkle?: { x: number; y: number; confidence: number };
    rightAnkle?: { x: number; y: number; confidence: number };
  };
}

// Hand tracking data
export interface HandData {
  confidence: number;
  handedness: 'left' | 'right';
  landmarks: Array<{ x: number; y: number; z: number }>;
}

// Combined tracking data
export interface TrackingData {
  facialExpressions: FacialExpressions | null;
  posture: PostureData | null;
  hands: HandData[] | null;
}
