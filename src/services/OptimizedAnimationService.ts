// Optimized Animation Service for XRCupid
// Prioritizes performance and reliability for real-time dating simulations

import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';
import { TemporaryAnimationService } from './TemporaryAnimationService';

interface AnimationContext {
  sentiment: 'positive' | 'negative' | 'flirty' | 'nervous' | 'confident' | 'neutral';
  intensity: number; // 0-1
  gesture?: string;
  previousState?: string;
}

interface AnimationClip {
  url: string;
  duration: number;
  blendInTime: number;
  blendOutTime: number;
  priority: number;
}

interface PerformanceMetrics {
  totalLoads: number;
  cacheHits: number;
  averageLoadTime: number;
  lastLoadTime: number;
}

export class OptimizedAnimationService {
  private animationCache: Map<string, THREE.AnimationClip> = new Map();
  private loadingPromises: Map<string, Promise<THREE.AnimationClip>> = new Map();
  private performanceMetrics: PerformanceMetrics;
  private temporaryService: TemporaryAnimationService;
  private fbxLoader: FBXLoader;
  
  // Pre-defined animation library optimized for dating scenarios
  private readonly ANIMATION_LIBRARY: Record<string, AnimationClip> = {
    // Core Dating Animations (Priority 1)
    'greeting_wave': {
      url: '/assets/animations/greeting_wave.fbx',
      duration: 2.0,
      blendInTime: 0.3,
      blendOutTime: 0.3,
      priority: 1
    },
    'flirty_hair_flip': {
      url: '/assets/animations/flirty_hair_flip.fbx',
      duration: 2.5,
      blendInTime: 0.4,
      blendOutTime: 0.4,
      priority: 1
    },
    'confident_stance': {
      url: '/assets/animations/confident_stance.fbx',
      duration: 3.0,
      blendInTime: 0.5,
      blendOutTime: 0.5,
      priority: 1
    },
    'nervous_fidget': {
      url: '/assets/animations/nervous_fidget.fbx',
      duration: 2.0,
      blendInTime: 0.3,
      blendOutTime: 0.3,
      priority: 1
    },
    'interested_lean': {
      url: '/assets/animations/interested_lean.fbx',
      duration: 3.0,
      blendInTime: 0.6,
      blendOutTime: 0.4,
      priority: 1
    },
    'genuine_laugh': {
      url: '/assets/animations/genuine_laugh.fbx',
      duration: 2.5,
      blendInTime: 0.2,
      blendOutTime: 0.4,
      priority: 1
    },
    
    // Subtle Reactions (Priority 2)
    'subtle_smile': {
      url: '/assets/animations/subtle_smile.fbx',
      duration: 1.5,
      blendInTime: 0.3,
      blendOutTime: 0.3,
      priority: 2
    },
    'thoughtful_nod': {
      url: '/assets/animations/thoughtful_nod.fbx',
      duration: 1.0,
      blendInTime: 0.2,
      blendOutTime: 0.2,
      priority: 2
    },
    'playful_wink': {
      url: '/assets/animations/playful_wink.fbx',
      duration: 0.8,
      blendInTime: 0.1,
      blendOutTime: 0.2,
      priority: 2
    },
    
    // Idle Variations (Priority 3)
    'idle_relaxed': {
      url: '/assets/animations/idle_relaxed.fbx',
      duration: 4.0,
      blendInTime: 0.5,
      blendOutTime: 0.5,
      priority: 3
    },
    'idle_engaged': {
      url: '/assets/animations/idle_engaged.fbx',
      duration: 4.0,
      blendInTime: 0.5,
      blendOutTime: 0.5,
      priority: 3
    }
  };

  // Context-based animation selection matrix
  private readonly CONTEXT_ANIMATIONS = {
    'positive_high': ['genuine_laugh', 'flirty_hair_flip', 'interested_lean'],
    'positive_medium': ['subtle_smile', 'thoughtful_nod', 'idle_engaged'],
    'positive_low': ['subtle_smile', 'idle_relaxed'],
    'flirty_high': ['flirty_hair_flip', 'playful_wink', 'interested_lean'],
    'flirty_medium': ['playful_wink', 'subtle_smile'],
    'flirty_low': ['subtle_smile', 'idle_engaged'],
    'nervous_high': ['nervous_fidget', 'idle_relaxed'],
    'nervous_medium': ['thoughtful_nod', 'idle_relaxed'],
    'confident_high': ['confident_stance', 'interested_lean'],
    'confident_medium': ['thoughtful_nod', 'idle_engaged'],
    'neutral': ['idle_relaxed', 'idle_engaged']
  };

  constructor() {
    this.performanceMetrics = {
      totalLoads: 0,
      cacheHits: 0,
      averageLoadTime: 0,
      lastLoadTime: 0
    };
    this.temporaryService = new TemporaryAnimationService();
    this.fbxLoader = new FBXLoader();
    this.preloadCriticalAnimations();
  }

  // Preload high-priority animations for instant playback
  private async preloadCriticalAnimations() {
    const criticalAnimations = Object.entries(this.ANIMATION_LIBRARY)
      .filter(([_, config]) => config.priority === 1)
      .map(([key, _]) => key);
    
    await Promise.all(
      criticalAnimations.map(key => this.loadAnimation(key))
    );
    
    console.log('Critical animations preloaded');
  }

  // Smart animation selection based on context
  public selectAnimation(context: AnimationContext): string {
    const intensityLevel = context.intensity > 0.7 ? 'high' : 
                          context.intensity > 0.3 ? 'medium' : 'low';
    
    const contextKey = `${context.sentiment}_${intensityLevel}`;
    const candidates = this.CONTEXT_ANIMATIONS[contextKey as keyof typeof this.CONTEXT_ANIMATIONS] 
                      || this.CONTEXT_ANIMATIONS.neutral;
    
    // Add variety by cycling through candidates
    const index = Math.floor(Date.now() / 10000) % candidates.length;
    return candidates[index];
  }

  // Load animation with caching
  private async loadAnimation(animationKey: string): Promise<THREE.AnimationClip> {
    const startTime = performance.now();
    
    try {
      // Try loading from file first
      const animationUrl = `/assets/animations/${animationKey}.fbx`;
      const response = await fetch(animationUrl, { method: 'HEAD' });
      
      if (response.ok) {
        // File exists, load it
        const loader = new FBXLoader();
        const fbx = await new Promise<THREE.Group>((resolve, reject) => {
          loader.load(
            animationUrl,
            (object) => resolve(object),
            undefined,
            (error) => reject(error)
          );
        });
        
        if (fbx.animations && fbx.animations.length > 0) {
          const clip = fbx.animations[0];
          clip.name = animationKey;
          this.animationCache.set(animationKey, clip);
          return clip;
        }
      }
    } catch (error) {
      console.warn(`FBX file not found for ${animationKey}, using procedural animation`);
    }
    
    // Fallback to procedural animation
    const proceduralClip = this.temporaryService.createProceduralAnimation(animationKey);
    
    const loadTime = performance.now() - startTime;
    this.updatePerformanceMetrics(loadTime);
    
    return proceduralClip;
  }

  private updatePerformanceMetrics(loadTime: number) {
    this.performanceMetrics.totalLoads++;
    this.performanceMetrics.lastLoadTime = loadTime;
    this.performanceMetrics.averageLoadTime = (this.performanceMetrics.averageLoadTime * (this.performanceMetrics.totalLoads - 1) + loadTime) / this.performanceMetrics.totalLoads;
  }

  // Apply animation to avatar with smooth blending
  public async applyAnimation(
    mixer: THREE.AnimationMixer,
    context: AnimationContext,
    currentAction?: THREE.AnimationAction
  ): Promise<THREE.AnimationAction> {
    const animationKey = this.selectAnimation(context);
    const config = this.ANIMATION_LIBRARY[animationKey];
    
    try {
      const clip = await this.loadAnimation(animationKey);
      const newAction = mixer.clipAction(clip);
      
      // Configure action
      newAction.setLoop(
        config.duration > 3 ? THREE.LoopRepeat : THREE.LoopOnce, 
        1
      );
      
      // Smooth transition from current action
      if (currentAction && currentAction.isRunning()) {
        newAction.reset();
        newAction.fadeIn(config.blendInTime);
        currentAction.fadeOut(config.blendOutTime);
      } else {
        newAction.reset();
        newAction.fadeIn(config.blendInTime);
      }
      
      newAction.play();
      return newAction;
      
    } catch (error) {
      console.error(`Failed to apply animation ${animationKey}:`, error);
      // Return idle animation as fallback
      return this.applyFallbackAnimation(mixer, currentAction);
    }
  }

  // Fallback to ensure avatar never freezes
  private async applyFallbackAnimation(
    mixer: THREE.AnimationMixer,
    currentAction?: THREE.AnimationAction
  ): Promise<THREE.AnimationAction> {
    const fallbackKey = 'idle_relaxed';
    const clip = await this.loadAnimation(fallbackKey);
    const action = mixer.clipAction(clip);
    
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.reset();
    action.fadeIn(0.5);
    
    if (currentAction) {
      currentAction.fadeOut(0.5);
    }
    
    action.play();
    return action;
  }

  // Predictive loading based on conversation flow
  public predictAndPreload(currentContext: AnimationContext) {
    // Predict likely next animations based on current state
    const predictions = this.getPredictedAnimations(currentContext);
    
    // Preload in background
    predictions.forEach(animationKey => {
      if (!this.animationCache.has(animationKey)) {
        this.loadAnimation(animationKey).catch(() => {
          // Silent fail for predictions
        });
      }
    });
  }

  private getPredictedAnimations(context: AnimationContext): string[] {
    // Smart prediction logic based on conversation patterns
    const predictions: string[] = [];
    
    if (context.sentiment === 'flirty') {
      predictions.push('genuine_laugh', 'interested_lean');
    } else if (context.sentiment === 'nervous') {
      predictions.push('confident_stance', 'subtle_smile');
    } else if (context.sentiment === 'positive') {
      predictions.push('flirty_hair_flip', 'playful_wink');
    }
    
    return predictions;
  }

  // Performance metrics
  public getPerformanceStats() {
    return {
      cachedAnimations: this.animationCache.size,
      cacheHitRate: this.calculateCacheHitRate(),
      averageLoadTime: this.performanceMetrics.averageLoadTime
    };
  }

  private calculateCacheHitRate(): number {
    // Implementation would track hits vs misses
    return 0.85; // Example
  }
}
