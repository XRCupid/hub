import { FacialExpressions } from '../types/tracking';

export interface HeadRotation {
  pitch: number;
  yaw: number;
  roll: number;
}

export interface FaceMeshPrediction {
  boundingBox: {
    topLeft: number[];
    bottomRight: number[];
  };
  scaledMesh: number[][];
  annotations?: {
    [key: string]: number[][];
  };
}

export interface IFaceTrackingService {
  initialize(): Promise<void>;
  startTracking(videoElement: HTMLVideoElement): void;
  stopTracking(): void;
  getExpressions(): FacialExpressions;
  getHeadRotation(): HeadRotation;
  getLandmarks(): number[][] | null;
}
