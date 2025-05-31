import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OptimizedAnimationService } from '../services/OptimizedAnimationService';

interface UseOptimizedAnimationProps {
  mixer?: THREE.AnimationMixer;
  sentiment: string;
  intensity: number;
  isActive: boolean;
}

export const useOptimizedAnimation = ({
  mixer,
  sentiment,
  intensity,
  isActive
}: UseOptimizedAnimationProps) => {
  const animationService = useRef(new OptimizedAnimationService());
  const currentAction = useRef<THREE.AnimationAction | null>(null);
  const lastContext = useRef<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!mixer || !isActive) return;
    
    const context = {
      sentiment: sentiment as any,
      intensity,
      previousState: lastContext.current
    };
    
    // Create context key for comparison
    const contextKey = `${sentiment}_${Math.round(intensity * 10)}`;
    
    // Avoid redundant animation changes
    if (contextKey === lastContext.current) return;
    
    lastContext.current = contextKey;
    setIsLoading(true);
    
    // Apply animation
    animationService.current
      .applyAnimation(mixer, context, currentAction.current || undefined)
      .then(newAction => {
        currentAction.current = newAction;
        setIsLoading(false);
        
        // Predictive loading for smooth transitions
        animationService.current.predictAndPreload(context);
      })
      .catch(error => {
        console.error('Animation failed:', error);
        setIsLoading(false);
      });
    
  }, [mixer, sentiment, intensity, isActive]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentAction.current) {
        currentAction.current.stop();
      }
    };
  }, []);
  
  return {
    isLoading,
    performanceStats: animationService.current.getPerformanceStats()
  };
};
