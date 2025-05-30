declare module '@mediapipe/face_mesh' {
  export interface Results {
    multiFaceLandmarks?: Array<Array<{x: number; y: number; z: number}>>;
    image: HTMLCanvasElement;
  }

  export interface FaceMeshConfig {
    locateFile?: (file: string) => string;
  }

  export interface FaceMeshOptions {
    maxNumFaces?: number;
    refineLandmarks?: boolean;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
  }

  export class FaceMesh {
    constructor(config?: FaceMeshConfig);
    setOptions(options: FaceMeshOptions): void;
    onResults(callback: (results: Results) => void): void;
    send(inputs: {image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement}): Promise<void>;
    close(): void;
  }
}

declare module '@mediapipe/camera_utils' {
  export interface CameraOptions {
    onFrame: () => Promise<void>;
    width?: number;
    height?: number;
    facingMode?: string;
  }

  export class Camera {
    constructor(videoElement: HTMLVideoElement, options: CameraOptions);
    start(): Promise<void>;
    stop(): void;
  }
}
