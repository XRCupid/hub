import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@mediapipe/face_mesh';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-converter';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

interface FaceTrackerProps {
  videoElement: HTMLVideoElement | null;
  onFaceData?: (expressions: {
    eyeBlink: boolean;
    mouthOpen: number;
    smile: number;
    headRotationY: number;
    rawLandmarks: any[];
  }) => void;
}

export const FaceTracker: React.FC<FaceTrackerProps> = ({ videoElement, onFaceData }) => {
  const [detector, setDetector] = useState<any>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    const initializeDetector = async () => {
      try {
        // Wait for TensorFlow.js to be ready
        await tf.ready();
        
        // Ensure WebGL backend is set
        await tf.setBackend('webgl');
        
        // Create face detector with proper config
        const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshTfjsModelConfig = {
          runtime: 'tfjs',
          refineLandmarks: true,
          maxFaces: 1,
        };
        
        const faceDetector = await faceLandmarksDetection.createDetector(model, detectorConfig);
        setDetector(faceDetector);
      } catch (error) {
        console.error('Error initializing face detector:', error);
      }
    };

    initializeDetector();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!detector || !videoElement) return;

    const detectFaces = async () => {
      try {
        if (videoElement.readyState === 4) {
          const faces = await detector.estimateFaces(videoElement);
          
          if (faces.length > 0 && onFaceData) {
            // Extract key landmarks for avatar animation
            const face = faces[0];
            const landmarks = face.keypoints || [];
            
            // Ensure landmarks exist before processing
            if (landmarks.length > 0) {
              const expressions = calculateExpressions(landmarks);
              onFaceData(expressions);
            }
          }
        }
      } catch (error) {
        // Only log if it's not a common cancelation error
        if (error instanceof Error && !error.message.includes('cancel')) {
          console.error('Face detection error:', error);
        }
      }

      animationIdRef.current = requestAnimationFrame(detectFaces);
    };

    detectFaces();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [detector, videoElement, onFaceData]);

  const calculateExpressions = (landmarks: any[]) => {
    // Calculate basic expressions from landmarks
    // These would map to blend shapes on the avatar
    
    // Ensure landmarks exist before accessing
    if (!landmarks || landmarks.length < 468) {
      return {
        eyeBlink: false,
        mouthOpen: 0,
        smile: 0,
        headRotationY: 0,
        rawLandmarks: [],
      };
    }
    
    // Eye blink detection
    const leftEye = {
      top: landmarks[159],
      bottom: landmarks[145],
    };
    const rightEye = {
      top: landmarks[386],
      bottom: landmarks[374],
    };
    
    const leftEyeHeight = leftEye.top && leftEye.bottom 
      ? Math.abs(leftEye.top.y - leftEye.bottom.y) 
      : 10;
    const rightEyeHeight = rightEye.top && rightEye.bottom 
      ? Math.abs(rightEye.top.y - rightEye.bottom.y) 
      : 10;
    const eyeBlink = (leftEyeHeight + rightEyeHeight) / 2 < 5;
    
    // Mouth open detection
    const mouthTop = landmarks[13];
    const mouthBottom = landmarks[14];
    const mouthHeight = mouthTop && mouthBottom 
      ? Math.abs(mouthTop.y - mouthBottom.y) 
      : 0;
    const mouthOpen = Math.min(1, mouthHeight / 20); // Normalized 0-1
    
    // Smile detection (mouth corners)
    const mouthLeft = landmarks[61];
    const mouthRight = landmarks[291];
    const mouthCenter = landmarks[13];
    const smileLeft = mouthLeft && mouthCenter 
      ? mouthLeft.y - mouthCenter.y 
      : 0;
    const smileRight = mouthRight && mouthCenter 
      ? mouthRight.y - mouthCenter.y 
      : 0;
    const smile = Math.max(0, Math.min(1, -(smileLeft + smileRight) / 20));
    
    // Head rotation
    const nose = landmarks[1];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];
    const headRotationY = leftCheek && rightCheek 
      ? (rightCheek.x - leftCheek.x) / 100 
      : 0;
    
    return {
      eyeBlink,
      mouthOpen,
      smile,
      headRotationY,
      rawLandmarks: landmarks,
    };
  };

  return null; // This component doesn't render anything
};
