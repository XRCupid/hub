import React, { useEffect, useState, useRef } from 'react';
import PresenceAvatar from './PresenceAvatar';
import { CombinedFaceTrackingService } from '../services/CombinedFaceTrackingService';
import { ML5FaceMeshService } from '../services/ML5FaceMeshService';
import { TrackingData, FacialExpressions } from '../types/tracking';

interface UserPresenceAvatarProps {
  avatarUrl: string;
  position?: [number, number, number];
  scale?: number;
  enableTracking?: boolean;
  useHumeEmotions?: boolean;
}

const UserPresenceAvatar: React.FC<UserPresenceAvatarProps> = ({
  avatarUrl,
  position = [0, 0, 0],
  scale = 1,
  enableTracking = true,
  useHumeEmotions = false
}) => {
  const [expressions, setExpressions] = useState<FacialExpressions | null>(null);
  const [trackingService, setTrackingService] = useState<ML5FaceMeshService | CombinedFaceTrackingService | null>(null);
  const [isTracking, setIsTracking] = useState(false);
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
      if (currentExpressions) {
        setExpressions(currentExpressions);
      }
    }, 50); // Update at 20 FPS

    return () => clearInterval(interval);
  }, [trackingService, isTracking]);

  // Convert expressions to tracking data format
  const getTrackingData = (): TrackingData | undefined => {
    if (!expressions) return undefined;

    return {
      facialExpressions: expressions,
      posture: null,
      hands: null
    };
  };

  return (
    <PresenceAvatar
      avatarUrl={avatarUrl}
      position={position}
      scale={scale}
      trackingData={getTrackingData()}
      isUser={true}
      emotionalState="neutral"
      debugMode={false}
    />
  );
};

export default UserPresenceAvatar;
