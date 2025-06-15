import { CoachProfile } from '../config/coachConfig';
import { NPCPersonality } from '../config/NPCPersonalities';
import { FacialExpressions, PostureData } from '../types/tracking';

// Core interfaces for dynamic tracking selection
export interface SessionContext {
  activityType: 'speed-date' | 'coach-session' | 'practice' | 'skill-building';
  coachId?: string;
  npcId?: string;
  lessonObjectives: string[];
  userPreferences: DateTrackingPreferences;
  deviceCapabilities: DeviceInfo;
  currentModule?: string;
}

export interface DateTrackingPreferences {
  focusAreas: ('eye-contact' | 'posture' | 'facial-expressions' | 'gestures' | 'voice-only')[];
  performanceMode: 'battery-save' | 'balanced' | 'maximum-insight';
  coachGuidance: boolean;
  realTimeAnalytics: boolean;
  privacyMode: 'local-only' | 'cloud-assisted' | 'full-cloud';
}

export interface DeviceInfo {
  platform: 'mobile' | 'tablet' | 'desktop';
  performance: 'low' | 'medium' | 'high';
  batteryLevel?: number;
  networkQuality: 'poor' | 'good' | 'excellent';
  hasWebGL: boolean;
  hasWebAssembly: boolean;
  cameraQuality: 'basic' | 'hd' | 'high';
  processingPower: number; // 1-10 scale
}

export interface TrackingConfiguration {
  models: {
    face: TrackingModel | null;
    eyes: TrackingModel | null;
    pose: TrackingModel | null;
    hands: TrackingModel | null;
  };
  processingMode: 'real-time' | 'batch' | 'selective';
  updateFrequency: number; // Hz
  analyticsDepth: 'basic' | 'detailed' | 'comprehensive';
  fallbackStrategy: 'degrade' | 'pause' | 'continue-minimal';
}

export interface TrackingModel {
  type: 'ml5-facemesh' | 'mediapipe-face' | 'mediapipe-pose' | 'webgazer' | 'gazecloud' | 'mediapipe-hands';
  priority: 'critical' | 'important' | 'optional';
  processingLoad: number; // 1-10 scale
  accuracy: 'basic' | 'standard' | 'high';
  privacyLevel: 'local' | 'hybrid' | 'cloud';
}

// Coach-specific tracking requirements
export interface CoachTrackingProfile {
  coachId: string;
  displayName: string;
  requiredTracking: {
    face: 'none' | 'basic' | 'advanced' | 'micro-expressions';
    eyes: 'none' | 'contact' | 'gaze-patterns' | 'attention-mapping';
    pose: 'none' | 'basic-posture' | 'body-language' | 'full-kinematic';
    hands: 'none' | 'basic-gestures' | 'detailed-gestures';
  };
  priorityMetrics: string[];
  performanceMode: 'lightweight' | 'balanced' | 'full-fidelity';
  specializations: string[];
  recommendedModels: {
    face?: TrackingModel;
    eyes?: TrackingModel;
    pose?: TrackingModel;
    hands?: TrackingModel;
  };
}

// NPC sensitivity profiles
export interface NPCTrackingRequirements {
  npcId: string;
  displayName: string;
  sensitivityProfile: {
    eyeContact: 'critical' | 'important' | 'neutral' | 'ignore';
    posture: 'critical' | 'important' | 'neutral' | 'ignore';
    facialExpressions: 'critical' | 'important' | 'neutral' | 'ignore';
    handGestures: 'critical' | 'important' | 'neutral' | 'ignore';
    voiceProsody: 'critical' | 'important' | 'neutral' | 'ignore';
  };
  personality: {
    attentionToDetail: number; // 0-1, how much they notice subtle cues
    emotionalIntelligence: number; // 0-1, how well they read emotions
    bodyLanguageAwareness: number; // 0-1, focus on physical presence
    conversationalStyle: 'direct' | 'subtle' | 'analytical' | 'intuitive';
  };
  trackingPreferences: string[];
  analyticsWeight: Record<string, number>;
  backstory?: string; // Why they're sensitive to certain cues
}

export interface TrackingInsights {
  sessionSummary: {
    modelsUsed: string[];
    dataQuality: Record<string, number>;
    performanceMetrics: {
      processingLoad: number;
      batteryUsage: number;
      accuracy: number;
    };
  };
  coachSpecificInsights: Record<string, any>;
  npcResponseData: {
    sensitivityTriggered: string[];
    personalityAlignment: number;
    engagementFactors: string[];
  };
  recommendations: {
    modelOptimizations: string[];
    focusAreas: string[];
    nextSession: TrackingConfiguration;
  };
}

// The main coordinator class
export class UnifiedTrackingCoordinator {
  private activeConfiguration: TrackingConfiguration | null = null;
  private currentContext: SessionContext | null = null;
  private performanceMonitor: PerformanceMonitor;
  private modelPool: ModelPool;
  
  // Tracking service instances
  private trackingServices: Map<string, any> = new Map();
  
  // Coach profiles registry
  private coachProfiles: Map<string, CoachTrackingProfile> = new Map();
  
  // NPC requirements registry  
  private npcRequirements: Map<string, NPCTrackingRequirements> = new Map();

  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
    this.modelPool = new ModelPool();
    this.initializeCoachProfiles();
    this.initializeNPCRequirements();
  }

  /**
   * Main orchestration method - selects optimal tracking configuration
   */
  selectModelsForSession(context: SessionContext): TrackingConfiguration {
    console.log('🎯 [UnifiedTrackingCoordinator] Selecting models for session:', context);
    
    // Get coach requirements
    const coachProfile = context.coachId ? this.coachProfiles.get(context.coachId) : null;
    
    // Get NPC requirements
    const npcRequirements = context.npcId ? this.npcRequirements.get(context.npcId) : null;
    
    // Analyze device capabilities
    const deviceConstraints = this.analyzeDeviceConstraints(context.deviceCapabilities);
    
    // Generate optimal configuration
    const configuration = this.generateConfiguration({
      coachProfile,
      npcRequirements,
      deviceConstraints,
      userPreferences: context.userPreferences,
      lessonObjectives: context.lessonObjectives,
      activityType: context.activityType
    });

    console.log('✅ [UnifiedTrackingCoordinator] Selected configuration:', configuration);
    return configuration;
  }

  /**
   * Initialize tracking based on selected configuration
   */
  async initializeTracking(config: TrackingConfiguration): Promise<void> {
    console.log('🚀 [UnifiedTrackingCoordinator] Initializing tracking with config:', config);
    
    this.activeConfiguration = config;
    
    // Initialize models in priority order
    const initPromises = [];
    
    if (config.models.face) {
      initPromises.push(this.initializeModel('face', config.models.face));
    }
    
    if (config.models.eyes) {
      initPromises.push(this.initializeModel('eyes', config.models.eyes));
    }
    
    if (config.models.pose) {
      initPromises.push(this.initializeModel('pose', config.models.pose));
    }
    
    if (config.models.hands) {
      initPromises.push(this.initializeModel('hands', config.models.hands));
    }

    try {
      await Promise.all(initPromises);
      console.log('✅ [UnifiedTrackingCoordinator] All tracking models initialized');
    } catch (error) {
      console.error('❌ [UnifiedTrackingCoordinator] Failed to initialize tracking:', error);
      await this.handleInitializationFailure(error);
    }
  }

  /**
   * Generate configuration based on multiple factors
   */
  private generateConfiguration(factors: {
    coachProfile?: CoachTrackingProfile | null;
    npcRequirements?: NPCTrackingRequirements | null;
    deviceConstraints: DeviceConstraints;
    userPreferences: DateTrackingPreferences;
    lessonObjectives: string[];
    activityType: string;
  }): TrackingConfiguration {
    
    const config: TrackingConfiguration = {
      models: {
        face: null,
        eyes: null,
        pose: null,
        hands: null
      },
      processingMode: 'real-time',
      updateFrequency: 30,
      analyticsDepth: 'detailed',
      fallbackStrategy: 'degrade'
    };

    // Apply coach requirements
    if (factors.coachProfile) {
      this.applyCoachRequirements(config, factors.coachProfile);
    }

    // Apply NPC sensitivity
    if (factors.npcRequirements) {
      this.applyNPCRequirements(config, factors.npcRequirements);
    }

    // Apply device constraints
    this.applyDeviceConstraints(config, factors.deviceConstraints);

    // Apply user preferences
    this.applyUserPreferences(config, factors.userPreferences);

    // Apply lesson-specific requirements
    this.applyLessonRequirements(config, factors.lessonObjectives);

    return config;
  }

  /**
   * Initialize coach profiles for each coach type
   */
  private initializeCoachProfiles(): void {
    // Posie - Physical Presence Coach
    this.coachProfiles.set('posie', {
      coachId: 'posie',
      displayName: 'Posie',
      requiredTracking: {
        face: 'basic',
        eyes: 'contact',
        pose: 'body-language',
        hands: 'basic-gestures'
      },
      priorityMetrics: ['posture', 'openness', 'confidence', 'presence'],
      performanceMode: 'full-fidelity',
      specializations: ['body-language', 'posture', 'presence', 'confidence'],
      recommendedModels: {
        pose: {
          type: 'mediapipe-pose',
          priority: 'critical',
          processingLoad: 7,
          accuracy: 'high',
          privacyLevel: 'local'
        },
        face: {
          type: 'ml5-facemesh',
          priority: 'important',
          processingLoad: 5,
          accuracy: 'standard',
          privacyLevel: 'local'
        }
      }
    });

    // Aria - Conversation Coach
    this.coachProfiles.set('aria', {
      coachId: 'aria',
      displayName: 'Aria',
      requiredTracking: {
        face: 'advanced',
        eyes: 'gaze-patterns',
        pose: 'basic-posture',
        hands: 'none'
      },
      priorityMetrics: ['eye-contact', 'facial-engagement', 'listening-cues', 'conversation-flow'],
      performanceMode: 'balanced',
      specializations: ['conversation', 'active-listening', 'eye-contact', 'engagement'],
      recommendedModels: {
        face: {
          type: 'mediapipe-face',
          priority: 'critical',
          processingLoad: 6,
          accuracy: 'high',
          privacyLevel: 'local'
        },
        eyes: {
          type: 'gazecloud',
          priority: 'critical',
          processingLoad: 4,
          accuracy: 'standard',
          privacyLevel: 'cloud'
        }
      }
    });

    // Zara - Confidence Coach  
    this.coachProfiles.set('zara', {
      coachId: 'zara',
      displayName: 'Zara',
      requiredTracking: {
        face: 'micro-expressions',
        eyes: 'attention-mapping',
        pose: 'body-language',
        hands: 'detailed-gestures'
      },
      priorityMetrics: ['authenticity', 'confidence', 'emotional-range', 'presence'],
      performanceMode: 'full-fidelity',
      specializations: ['confidence', 'authenticity', 'emotional-intelligence', 'charisma'],
      recommendedModels: {
        face: {
          type: 'mediapipe-face',
          priority: 'critical',
          processingLoad: 8,
          accuracy: 'high',
          privacyLevel: 'local'
        },
        pose: {
          type: 'mediapipe-pose',
          priority: 'critical',
          processingLoad: 7,
          accuracy: 'high',
          privacyLevel: 'local'
        }
      }
    });

    console.log('✅ [UnifiedTrackingCoordinator] Coach profiles initialized:', this.coachProfiles.size);
  }

  /**
   * Initialize NPC requirements for different personalities
   */
  private initializeNPCRequirements(): void {
    // Confident Sarah - Highly attentive to confidence cues
    this.npcRequirements.set('confident-sarah', {
      npcId: 'confident-sarah',
      displayName: 'Sarah',
      sensitivityProfile: {
        eyeContact: 'critical',
        posture: 'important',
        facialExpressions: 'important',
        handGestures: 'neutral',
        voiceProsody: 'important'
      },
      personality: {
        attentionToDetail: 0.8,
        emotionalIntelligence: 0.7,
        bodyLanguageAwareness: 0.9,
        conversationalStyle: 'direct'
      },
      trackingPreferences: ['eye-contact', 'posture', 'confidence-indicators'],
      analyticsWeight: {
        'eye-contact': 0.4,
        'posture': 0.3,
        'facial-expressions': 0.2,
        'voice-confidence': 0.1
      },
      backstory: 'Sarah values confidence and directness. She notices when people avoid eye contact or have closed body language.'
    });

    // Shy Emma - Sensitive to emotional comfort
    this.npcRequirements.set('shy-emma', {
      npcId: 'shy-emma',
      displayName: 'Emma',
      sensitivityProfile: {
        eyeContact: 'important',
        posture: 'neutral',
        facialExpressions: 'critical',
        handGestures: 'important',
        voiceProsody: 'critical'
      },
      personality: {
        attentionToDetail: 0.9,
        emotionalIntelligence: 0.9,
        bodyLanguageAwareness: 0.6,
        conversationalStyle: 'subtle'
      },
      trackingPreferences: ['facial-expressions', 'emotional-comfort', 'gentle-gestures'],
      analyticsWeight: {
        'facial-expressions': 0.4,
        'voice-tone': 0.3,
        'gestures': 0.2,
        'eye-contact': 0.1
      },
      backstory: 'Emma is highly empathetic and picks up on subtle emotional cues. She appreciates gentleness and emotional intelligence.'
    });

    // Intellectual Maya - Focuses on engagement and attention
    this.npcRequirements.set('intellectual-maya', {
      npcId: 'intellectual-maya',
      displayName: 'Maya',
      sensitivityProfile: {
        eyeContact: 'important',
        posture: 'important',
        facialExpressions: 'important',
        handGestures: 'critical',
        voiceProsody: 'neutral'
      },
      personality: {
        attentionToDetail: 0.7,
        emotionalIntelligence: 0.6,
        bodyLanguageAwareness: 0.7,
        conversationalStyle: 'analytical'
      },
      trackingPreferences: ['engagement-patterns', 'hand-gestures', 'attention-focus'],
      analyticsWeight: {
        'hand-gestures': 0.3,
        'engagement': 0.3,
        'eye-contact': 0.2,
        'posture': 0.2
      },
      backstory: 'Maya appreciates intellectual engagement and notices when people use gestures to emphasize points or show genuine interest.'
    });

    console.log('✅ [UnifiedTrackingCoordinator] NPC requirements initialized:', this.npcRequirements.size);
  }

  // Placeholder methods for configuration application
  private applyCoachRequirements(config: TrackingConfiguration, profile: CoachTrackingProfile): void {
    // Implementation will be added in next steps
  }

  private applyNPCRequirements(config: TrackingConfiguration, requirements: NPCTrackingRequirements): void {
    // Implementation will be added in next steps
  }

  private applyDeviceConstraints(config: TrackingConfiguration, constraints: DeviceConstraints): void {
    // Implementation will be added in next steps
  }

  private applyUserPreferences(config: TrackingConfiguration, preferences: DateTrackingPreferences): void {
    // Implementation will be added in next steps
  }

  private applyLessonRequirements(config: TrackingConfiguration, objectives: string[]): void {
    // Implementation will be added in next steps
  }

  private analyzeDeviceConstraints(capabilities: DeviceInfo): DeviceConstraints {
    // Implementation will be added in next steps
    return {} as DeviceConstraints;
  }

  private async initializeModel(type: string, model: TrackingModel): Promise<void> {
    // Implementation will be added in next steps
  }

  private async handleInitializationFailure(error: any): Promise<void> {
    // Implementation will be added in next steps
  }
}

// Supporting classes
class PerformanceMonitor {
  // Implementation will be added
}

class ModelPool {
  // Implementation will be added
}

interface DeviceConstraints {
  // Implementation will be added
}

export default UnifiedTrackingCoordinator;
