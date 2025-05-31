import { useState, useEffect, useCallback } from 'react';

// Make react-query optional
let useQuery: any;
let useMutation: any;

try {
  const rq = require('@tanstack/react-query');
  useQuery = rq.useQuery;
  useMutation = rq.useMutation;
} catch (e) {
  console.warn('React Query not installed - using fallback');
  // Provide fallback implementations
  useQuery = () => ({ data: null, isLoading: false });
  useMutation = () => ({ mutate: () => {}, isLoading: false });
}

interface AnimationRequest {
  sentiment: string;
  intensity: number;
  context?: string;
  userId?: string;
}

interface AnimationJob {
  id: string;
  state: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    animationUrl: string;
    animationKey: string;
  };
  error?: string;
}

export const useKrikeyAnimation = () => {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [appliedAnimation, setAppliedAnimation] = useState<string | null>(null);

  // Mutation to request animation generation
  const generateAnimation = useMutation({
    mutationFn: async (request: AnimationRequest) => {
      const response = await fetch('/api/animations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentiment: request.sentiment,
          message: request.context,
          intensity: request.intensity,
          userId: request.userId
        })
      });
      
      const data = await response.json();
      setCurrentJobId(data.jobId);
      return data;
    }
  });
  
  // Poll for job completion
  const { data: jobStatus } = useQuery({
    queryKey: ['animation-job', currentJobId],
    queryFn: async () => {
      if (!currentJobId) return null;
      
      const response = await fetch(`/api/animations/status/${currentJobId}`);
      return response.json() as Promise<AnimationJob>;
    },
    enabled: !!currentJobId,
    refetchInterval: (data: AnimationJob | undefined) => {
      // Stop polling when job is complete
      if (data?.state === 'completed' || data?.state === 'failed') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    }
  });
  
  // Apply animation to avatar
  const applyAnimation = useCallback(async (animationUrl: string, avatarMixer: any) => {
    if (!avatarMixer) return;
    
    // Load FBX animation
    const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader');
    const loader = new FBXLoader();
    
    loader.load(animationUrl, (fbx) => {
      if (fbx.animations.length > 0) {
        const action = avatarMixer.clipAction(fbx.animations[0]);
        
        // Fade in new animation
        action.reset();
        action.fadeIn(0.5);
        action.play();
        
        // Clean up previous animations
        avatarMixer.stopAllAction();
      }
    });
  }, []);
  
  return {
    generateAnimation,
    jobStatus,
    applyAnimation,
    isGenerating: generateAnimation.isLoading || 
                  (jobStatus?.state === 'pending' || jobStatus?.state === 'processing')
  };
};

// Pre-generated animation fallbacks
export const FALLBACK_ANIMATIONS = {
  happy: '/assets/animations/preset_happy.fbx',
  sad: '/assets/animations/preset_sad.fbx',
  flirty: '/assets/animations/preset_flirty.fbx',
  nervous: '/assets/animations/preset_nervous.fbx',
  confident: '/assets/animations/preset_confident.fbx',
  neutral: '/assets/animations/preset_neutral.fbx'
};

// Smart animation selector with caching
export const useSmartAnimation = () => {
  const { generateAnimation, jobStatus, applyAnimation } = useKrikeyAnimation();
  const [animationCache] = useState(() => new Map<string, string>());
  
  const getAnimation = useCallback(async (context: AnimationRequest) => {
    // Generate cache key
    const cacheKey = `${context.sentiment}_${Math.round(context.intensity * 10)}`;
    
    // Check cache first
    if (animationCache.has(cacheKey)) {
      return animationCache.get(cacheKey)!;
    }
    
    // Check if we should use fallback (for immediate response)
    if (context.intensity < 0.3) {
      // Low intensity - use preset
      return FALLBACK_ANIMATIONS[context.sentiment as keyof typeof FALLBACK_ANIMATIONS] 
             || FALLBACK_ANIMATIONS.neutral;
    }
    
    // High intensity - generate custom animation
    try {
      await generateAnimation.mutateAsync(context);
      
      // Wait for completion (with timeout)
      const timeout = setTimeout(() => {
        throw new Error('Animation generation timeout');
      }, 30000);
      
      // Poll until complete
      while (jobStatus?.state !== 'completed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      clearTimeout(timeout);
      
      if (jobStatus.result?.animationUrl) {
        animationCache.set(cacheKey, jobStatus.result.animationUrl);
        return jobStatus.result.animationUrl;
      }
    } catch (error) {
      console.error('Failed to generate animation:', error);
    }
    
    // Fallback to preset
    return FALLBACK_ANIMATIONS[context.sentiment as keyof typeof FALLBACK_ANIMATIONS] 
           || FALLBACK_ANIMATIONS.neutral;
  }, [generateAnimation, jobStatus, animationCache]);
  
  return { getAnimation, applyAnimation };
};
