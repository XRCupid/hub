import React, { useEffect, useState, useRef } from 'react';
import { PresenceAvatar } from './PresenceAvatar';
import { CombinedFaceTrackingService } from '../services/CombinedFaceTrackingService';
import { ML5FaceMeshService } from '../services/ML5FaceMeshService';
import { TrackingData, FacialExpressions } from '../types/tracking';

// Add unique ID to identify this component instance
let instanceCounter = 0;

interface UserPresenceAvatarProps {
  avatarUrl: string;
  position?: [number, number, number];
  scale?: number;
  enableTracking?: boolean;
  useHumeEmotions?: boolean;
}

interface HeadRotation {
  pitch: number;
  yaw: number;
  roll: number;
}

const UserPresenceAvatar: React.FC<UserPresenceAvatarProps> = ({
  avatarUrl,
  position = [0, 0, 0],
  scale = 1,
  enableTracking = true,
  useHumeEmotions = false
}) => {
  const [instanceId] = useState(() => ++instanceCounter);
  const [expressions, setExpressions] = useState<FacialExpressions | null>(null);
  const [trackingService, setTrackingService] = useState<ML5FaceMeshService | CombinedFaceTrackingService | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [lastHeadRotation, setLastHeadRotation] = useState<HeadRotation | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!enableTracking) return;

    const initTracking = async () => {
      try {
        // Create video element for camera
        const video = document.createElement('video');
        video.autoplay = true;
        video.muted = true;
        video.style.display = 'none';
        document.body.appendChild(video);
        videoRef.current = video;

        // Get camera stream
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
        video.srcObject = stream;

        // Wait for video to be ready
        await new Promise((resolve) => {
          video.addEventListener('loadedmetadata', resolve, { once: true });
        });

        // Create tracking service
        const service = useHumeEmotions 
          ? new CombinedFaceTrackingService()
          : new ML5FaceMeshService();
        
        setTrackingService(service);

        // Start tracking with video element
        if (service instanceof ML5FaceMeshService) {
          service.startTracking(video);
        } else if (service instanceof CombinedFaceTrackingService) {
          await service.startTracking(video);
        }

        setIsTracking(true);
        console.log('Started face tracking for user avatar');
      } catch (error) {
        console.error('Failed to start face tracking:', error);
      }
    };

    initTracking();

    return () => {
      // Cleanup
      if (videoRef.current) {
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        videoRef.current.remove();
      }
      if (trackingService) {
        trackingService.stopTracking();
      }
    };
  }, [enableTracking, useHumeEmotions]);

  // Get expressions from tracking service
  useEffect(() => {
    if (!trackingService || !isTracking) return;

    const interval = setInterval(() => {
      const currentExpressions = trackingService.getExpressions();
      const headRotation = trackingService.getHeadRotation();
      
      // DEBUG: Log jawOpen at the source
      if (currentExpressions && 'jawOpen' in currentExpressions) {
        console.log(` [UserPresenceAvatar #${instanceId}] SOURCE jawOpen=${currentExpressions.jawOpen}`);
      }
      
      if (currentExpressions) {
        setExpressions({
          ...currentExpressions,
          cheekSquintLeft: currentExpressions.cheekSquintLeft ?? 0,
          cheekSquintRight: currentExpressions.cheekSquintRight ?? 0,
          eyeBlink: currentExpressions.eyeBlink ?? 0,
          eyebrowRaise: currentExpressions.eyebrowRaise ?? 0,
          eyeSquint: currentExpressions.eyeSquint ?? 0,
          // Add any other missing keys from FacialExpressions here if needed
        });
      }
      
      if (headRotation) {
        setLastHeadRotation(headRotation);
      }
    }, 16); // Update at 60 FPS for 1:1 tracking

    return () => clearInterval(interval);
  }, [trackingService, isTracking, instanceId]);

  // Convert expressions to tracking data format
  const getTrackingData = (): TrackingData | undefined => {
    if (!expressions) return undefined;

    const trackingData: TrackingData = {
      facialExpressions: expressions,
      headRotation: lastHeadRotation || undefined,
      posture: null,
      hands: null
    };

    return trackingData;
  };

  return (
    <PresenceAvatar
      avatarUrl={avatarUrl}
      position={position}
      scale={scale}
      trackingData={getTrackingData()}
      participantId={`user-${instanceId}`}
    />
  );
};

export default UserPresenceAvatar;
