import * as THREE from 'three';

// Facial expression tracking data
export interface FacialExpressions {
  mouthSmile: number;
  mouthSmileLeft: number;
  mouthSmileRight: number;
  mouthFrown: number;
  mouthOpen: number;
  mouthPucker: number;
  mouthDimpleLeft: number;
  mouthDimpleRight: number;
  mouthStretchLeft: number;
  mouthStretchRight: number;
  mouthPressLeft: number;
  mouthPressRight: number;
  lipsSuckUpper: number;
  lipsSuckLower: number;
  lipsFunnel: number;
  browUpLeft: number;
  browUpRight: number;
  browInnerUp: number; // For the central part of the brow rising
  browInnerUpLeft: number; // Individual left inner brow raise
  browInnerUpRight: number; // Individual right inner brow raise
  browDownLeft: number;
  browDownRight: number;
  eyeSquintLeft: number;
  eyeSquintRight: number;
  cheekPuff: number;
  cheekSquintLeft: number;
  cheekSquintRight: number;
  noseSneer: number;
  tongueOut: number;
  jawOpen: number;
  jawLeft: number;
  jawRight: number;
  eyeBlinkLeft: number;
  eyeBlinkRight: number;
  eyebrowRaiseLeft: number;
  eyebrowRaiseRight: number;
  eyebrowFurrow: number;
  eyeWideLeft: number;
  eyeWideRight: number;
  eyeWide: number; // Combined eye wide measure
  eyeBlink: number;
  eyebrowRaise: number;
  eyeSquint: number;
  eyeLookDownLeft: number;
  eyeLookDownRight: number;
  eyeLookUpLeft: number;
  eyeLookUpRight: number;
  eyeLookInLeft: number;
  eyeLookInRight: number;
  eyeLookOutLeft: number;
  eyeLookOutRight: number;
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

// Unified TrackingData interface
export interface TrackingData {
  source?: 'hume' | 'ml5';
  expressions?: Record<string, number>; // From original PresenceAvatar, kept for compatibility if used
  head?: {
    rotation?: THREE.Quaternion | { x: number; y: number; z: number; w?: number }; // Can be Quaternion or Euler-like
    position?: THREE.Vector3 | { x: number; y: number; z: number };
  };
  headRotation?: { pitch: number; yaw: number; roll: number }; // For existing direct euler angle usage
  facialExpressions?: FacialExpressions; // For existing direct facial expression usage, now strongly typed
  hasExpressions?: boolean;
  hasHeadRotation?: boolean;
  hasLandmarks?: boolean;
  landmarks?: any; // To accommodate AnimationTester's `landmarks: null` and allow flexibility
  posture?: PostureData | null; // Added from the removed definition
  hands?: HandData[] | null;    // Added from the removed definition
  
  // ✨ NEW: Engagement Detection
  engagement?: EngagementAnalytics;
  
  [key: string]: any; // Allow other properties
}

// BlendShapeMappings type
export type BlendShapeMappings = Record<string, any>;

// Hand tracking data
export interface HandData {
  confidence: number;
  handedness: 'left' | 'right';
  landmarks: Array<{ x: number; y: number; z: number }>;
}

// ✨ NEW: Engagement Detection Interfaces
export interface NoddingDetection {
  isNodding: boolean;
  noddingIntensity: number; // 0-1, intensity of nodding motion
  noddingFrequency: number; // nods per minute
  lastNoddingTime: number; // timestamp of last detected nod
  noddingPattern: 'agreement' | 'understanding' | 'encouragement' | 'neutral';
  engagementScore: number; // 0-1, overall nodding engagement
}

export interface PostureEngagement {
  isLeaningIn: boolean;
  leanAngle: number; // degrees of forward lean
  proximityChange: number; // percentage change in distance to camera
  engagementLevel: 'disengaged' | 'neutral' | 'engaged' | 'highly_engaged';
  shoulderPosition: { left: number; right: number }; // y-coordinates for lean detection
  bodyLanguageScore: number; // 0-1, overall postural engagement
}

export interface EyeContactDetection {
  hasEyeContact: boolean;
  eyeContactDuration: number; // seconds of sustained contact
  eyeContactPercentage: number; // percentage of time in contact during conversation
  gazeDirection: { x: number; y: number }; // normalized gaze vector
  contactQuality: 'poor' | 'good' | 'excellent'; // quality of eye contact
  lastContactTime: number; // timestamp of last eye contact
  totalContactTime: number; // cumulative eye contact time
}

export interface EngagementAnalytics {
  nodding: NoddingDetection;
  posture: PostureEngagement;
  eyeContact: EyeContactDetection;
  overallEngagement: number; // 0-1, composite engagement score
  engagementTrend: 'increasing' | 'decreasing' | 'stable';
  lastUpdate: number;
}
