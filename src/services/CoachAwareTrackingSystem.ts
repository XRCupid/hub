// Coach-Aware Tracking System
// Integrates all tracking data and provides coach with real-time feedback capabilities

import { trackingOrchestrator, TrackerType } from './TrackingOrchestrator';
import { scoringSystem } from './UnifiedScoringSystem';
// import { FacialTrackingService } from './FacialTrackingService';

export interface TrackingState {
  posture: {
    isOpen: boolean;
    isLeaning: boolean;
    shoulderTension: number; // 0-1
    feedback: string;
  };
  eyeContact: {
    isLooking: boolean;
    duration: number;
    quality: number; // 0-1
    feedback: string;
  };
  gestures: {
    areOpen: boolean;
    isExpressive: boolean;
    frequency: number;
    feedback: string;
  };
  facial: {
    emotion: string;
    intensity: number;
    mirroring: boolean;
    feedback: string;
  };
  overall: {
    presence: number; // 0-1
    engagement: number; // 0-1
    chemistry: number; // 0-1
  };
}

export interface CoachFeedback {
  immediate: string[]; // Real-time corrections
  suggestions: string[]; // Things to try
  praise: string[]; // What's working well
  exercise?: PhysicalExercise; // Guided practice
}

export interface PhysicalExercise {
  type: 'posture' | 'eyeContact' | 'gestures' | 'mirroring';
  name: string;
  instructions: string[];
  duration: number; // seconds
  targetMetrics: Partial<TrackingState>;
}

export class CoachAwareTrackingSystem {
  private static instance: CoachAwareTrackingSystem;
  private currentState: TrackingState;
  // private facialTracking: FacialTrackingService;
  private coachCallback?: (state: TrackingState, feedback: CoachFeedback) => void;
  private exerciseMode: boolean = false;
  private currentExercise?: PhysicalExercise;

  constructor() {
    this.currentState = this.initializeState();
    // this.facialTracking = new FacialTrackingService();
    this.setupTrackers();
  }

  static getInstance(): CoachAwareTrackingSystem {
    if (!this.instance) {
      this.instance = new CoachAwareTrackingSystem();
    }
    return this.instance;
  }

  // Initialize all tracking states
  private initializeState(): TrackingState {
    return {
      posture: {
        isOpen: false,
        isLeaning: false,
        shoulderTension: 0.5,
        feedback: ''
      },
      eyeContact: {
        isLooking: false,
        duration: 0,
        quality: 0,
        feedback: ''
      },
      gestures: {
        areOpen: false,
        isExpressive: false,
        frequency: 0,
        feedback: ''
      },
      facial: {
        emotion: 'neutral',
        intensity: 0,
        mirroring: false,
        feedback: ''
      },
      overall: {
        presence: 0,
        engagement: 0,
        chemistry: 0
      }
    };
  }

  // Setup all tracker callbacks
  private setupTrackers(): void {
    // Register posture tracking
    trackingOrchestrator.registerTracker('posture', (data) => {
      this.updatePosture(data);
    });

    // Register eye contact tracking
    trackingOrchestrator.registerTracker('eyes', (data) => {
      this.updateEyeContact(data);
    });

    // Register gesture tracking
    trackingOrchestrator.registerTracker('hands', (data) => {
      this.updateGestures(data);
    });

    // Register facial tracking
    trackingOrchestrator.registerTracker('face', (data) => {
      this.updateFacial(data);
    });
  }

  // Update posture state and generate feedback
  private updatePosture(data: any): void {
    // Add null checks
    if (!data || !data.shoulders || !data.spine || !data.headPosition) {
      return;
    }
    
    const { shoulders, spine, headPosition } = data;
    
    // Analyze posture
    const isOpen = shoulders.width > 0.8 && !shoulders.hunched;
    const isLeaning = headPosition.z > 0.1; // Leaning forward
    const shoulderTension = shoulders.tension || 0.5;

    // Generate specific feedback
    let feedback = '';
    if (!isOpen) {
      feedback = 'Open your shoulders - you appear closed off';
    } else if (shoulderTension > 0.7) {
      feedback = 'Relax your shoulders, they seem tense';
    } else if (isLeaning) {
      feedback = 'Great! Leaning in shows interest';
    } else {
      feedback = 'Good open posture!';
    }

    this.currentState.posture = {
      isOpen,
      isLeaning,
      shoulderTension,
      feedback
    };

    // Update scoring system
    const postureScore = (isOpen ? 40 : 0) + (isLeaning ? 30 : 0) + ((1 - shoulderTension) * 30);
    scoringSystem.updateMetric('posture', postureScore, feedback);

    this.notifyCoach();
  }

  // Update eye contact state
  private updateEyeContact(data: any): void {
    // Add null checks
    if (!data || !data.isLooking || !data.duration || !data.targetArea) {
      return;
    }
    
    const { isLooking, duration, targetArea } = data;
    
    // Calculate quality based on where they're looking
    const quality = targetArea === 'eyes' ? 1.0 : targetArea === 'face' ? 0.7 : 0.3;

    // Generate feedback
    let feedback = '';
    if (!isLooking) {
      feedback = 'Try to maintain eye contact';
    } else if (duration < 2) {
      feedback = 'Hold eye contact a bit longer';
    } else if (duration > 5) {
      feedback = 'Good eye contact! You can look away briefly to seem natural';
    } else {
      feedback = 'Perfect eye contact duration!';
    }

    this.currentState.eyeContact = {
      isLooking,
      duration,
      quality,
      feedback
    };

    const eyeScore = isLooking ? (quality * 70) + Math.min(duration * 5, 30) : 0;
    scoringSystem.updateMetric('eyeContact', eyeScore, feedback);

    this.notifyCoach();
  }

  // Update gesture state
  private updateGestures(data: any): void {
    // Add null checks
    if (!data || !data.hands || !data.movement) {
      return;
    }
    
    const { hands, movement } = data;
    
    const areOpen = !hands.crossed && !hands.inPockets;
    const isExpressive = movement.amplitude > 0.3;
    const frequency = movement.frequency || 0;

    let feedback = '';
    if (!areOpen) {
      feedback = 'Keep your hands visible and open';
    } else if (!isExpressive) {
      feedback = 'Use more hand gestures to express yourself';
    } else if (frequency > 2) {
      feedback = 'Great expressiveness! Maybe slow down slightly';
    } else {
      feedback = 'Nice natural gestures!';
    }

    this.currentState.gestures = {
      areOpen,
      isExpressive,
      frequency,
      feedback
    };

    const gestureScore = (areOpen ? 40 : 0) + (isExpressive ? 40 : 0) + (frequency > 0.5 && frequency < 2 ? 20 : 0);
    scoringSystem.updateMetric('gestures', gestureScore, feedback);

    this.notifyCoach();
  }

  // Update facial expression state
  private updateFacial(data: any): void {
    // Add null checks
    if (!data || !data.emotion || !data.intensity || !data.partnerEmotion) {
      return;
    }
    
    const { emotion, intensity, partnerEmotion } = data;
    
    // Check if mirroring partner's emotion
    const mirroring = emotion === partnerEmotion && intensity > 0.3;

    let feedback = '';
    if (emotion === 'neutral' && intensity < 0.2) {
      feedback = 'Show more emotion in your face';
    } else if (mirroring) {
      feedback = 'Great emotional mirroring!';
    } else if (emotion === 'happy' && intensity > 0.5) {
      feedback = 'Beautiful genuine smile!';
    } else {
      feedback = 'Good facial engagement';
    }

    this.currentState.facial = {
      emotion,
      intensity,
      mirroring,
      feedback
    };

    const facialScore = (intensity * 50) + (mirroring ? 30 : 0) + (emotion === 'happy' ? 20 : 10);
    scoringSystem.updateMetric('facialExpression', facialScore, feedback);

    this.notifyCoach();
  }

  // Calculate overall metrics
  private calculateOverallMetrics(): void {
    const { posture, eyeContact, gestures, facial } = this.currentState;

    // Presence: How physically present and engaged they appear
    const presence = (
      (posture.isOpen ? 0.3 : 0) +
      (eyeContact.isLooking ? 0.3 : 0) +
      (gestures.areOpen ? 0.2 : 0) +
      (facial.intensity * 0.2)
    );

    // Engagement: Active participation
    const engagement = (
      (posture.isLeaning ? 0.3 : 0) +
      (eyeContact.quality * 0.3) +
      (gestures.isExpressive ? 0.2 : 0) +
      (facial.mirroring ? 0.2 : 0)
    );

    // Chemistry: Natural flow and connection
    const chemistry = (
      (posture.shoulderTension < 0.3 ? 0.3 : 0) +
      (eyeContact.duration > 2 && eyeContact.duration < 5 ? 0.3 : 0) +
      (gestures.frequency > 0.5 && gestures.frequency < 1.5 ? 0.2 : 0) +
      (facial.mirroring ? 0.2 : 0)
    );

    this.currentState.overall = {
      presence: Math.min(presence, 1),
      engagement: Math.min(engagement, 1),
      chemistry: Math.min(chemistry, 1)
    };
  }

  // Generate coach feedback based on current state
  private generateCoachFeedback(): CoachFeedback {
    const { posture, eyeContact, gestures, facial, overall } = this.currentState;
    
    const immediate: string[] = [];
    const suggestions: string[] = [];
    const praise: string[] = [];

    // Immediate corrections (most important issues)
    if (!posture.isOpen) {
      immediate.push("Open your shoulders - you're appearing closed off");
    }
    if (!eyeContact.isLooking) {
      immediate.push("Look at your date's eyes");
    }
    if (!gestures.areOpen) {
      immediate.push("Uncross your arms/take hands out of pockets");
    }

    // Suggestions for improvement
    if (overall.presence < 0.5) {
      suggestions.push("Let's work on your physical presence - try the Power Pose exercise");
    }
    if (!posture.isLeaning && overall.engagement > 0.7) {
      suggestions.push("You're engaged! Try leaning in slightly to show interest");
    }
    if (facial.intensity < 0.3) {
      suggestions.push("Express more with your face - practice the Emotion Mirror exercise");
    }

    // Praise what's working
    if (posture.isOpen && posture.isLeaning) {
      praise.push("Excellent body language - open and engaged!");
    }
    if (eyeContact.quality > 0.8 && eyeContact.duration > 2) {
      praise.push("Perfect eye contact - intimate but not intimidating");
    }
    if (facial.mirroring) {
      praise.push("Great emotional attunement - you're mirroring naturally!");
    }

    // Suggest exercise if needed
    let exercise: PhysicalExercise | undefined;
    if (overall.presence < 0.5) {
      exercise = this.getPresenceExercise();
    } else if (!facial.mirroring && overall.chemistry < 0.5) {
      exercise = this.getMirroringExercise();
    }

    return { immediate, suggestions, praise, exercise };
  }

  // Get presence-building exercise
  private getPresenceExercise(): PhysicalExercise {
    return {
      type: 'posture',
      name: 'Power Presence Sequence',
      instructions: [
        'Stand up and shake out your body',
        'Roll your shoulders back and down',
        'Lift your chest slightly',
        'Imagine a string pulling you up from the crown of your head',
        'Take 3 deep breaths maintaining this posture',
        'Sit back down maintaining the open posture'
      ],
      duration: 60,
      targetMetrics: {
        posture: {
          isOpen: true,
          shoulderTension: 0.2,
          isLeaning: false,
          feedback: ''
        }
      }
    };
  }

  // Get mirroring exercise
  private getMirroringExercise(): PhysicalExercise {
    return {
      type: 'mirroring',
      name: 'Emotional Mirror Practice',
      instructions: [
        'Watch your date\'s facial expression',
        'Subtly match their energy level',
        'If they smile, let yourself smile naturally',
        'If they lean in, wait a beat then lean in too',
        'Focus on feeling what they\'re feeling'
      ],
      duration: 120,
      targetMetrics: {
        facial: {
          mirroring: true,
          intensity: 0.5,
          emotion: 'happy',
          feedback: ''
        }
      }
    };
  }

  // Notify coach of state changes
  private notifyCoach(): void {
    this.calculateOverallMetrics();
    const feedback = this.generateCoachFeedback();
    
    if (this.coachCallback) {
      this.coachCallback(this.currentState, feedback);
    }
  }

  // Public methods for coach integration

  // Register coach callback
  public registerCoach(callback: (state: TrackingState, feedback: CoachFeedback) => void): void {
    this.coachCallback = callback;
  }

  // Update tracking data manually (for testing)
  public updateTrackingData(data: {
    posture?: Partial<TrackingState['posture']>;
    eyeContact?: Partial<TrackingState['eyeContact']>;
    gestures?: Partial<TrackingState['gestures']>;
    facial?: Partial<TrackingState['facial']>;
  }): void {
    // Update posture
    if (data.posture) {
      this.currentState.posture = { ...this.currentState.posture, ...data.posture };
    }
    
    // Update eye contact
    if (data.eyeContact) {
      this.currentState.eyeContact = { ...this.currentState.eyeContact, ...data.eyeContact };
    }
    
    // Update gestures
    if (data.gestures) {
      this.currentState.gestures = { ...this.currentState.gestures, ...data.gestures };
    }
    
    // Update facial expressions
    if (data.facial) {
      this.currentState.facial = { ...this.currentState.facial, ...data.facial };
    }
    
    // Generate feedback and notify coach
    this.generateCoachFeedback();
    this.notifyCoach();
  }

  // Start an exercise
  public startExercise(exercise: PhysicalExercise): void {
    this.exerciseMode = true;
    this.currentExercise = exercise;
    
    // Focus tracking on exercise-relevant metrics
    switch (exercise.type) {
      case 'posture':
        trackingOrchestrator.setPhase('thinking'); // Focus on posture
        break;
      case 'eyeContact':
        trackingOrchestrator.setPhase('listening'); // Focus on eyes
        break;
      case 'gestures':
        trackingOrchestrator.setPhase('speaking'); // Focus on hands
        break;
    }
  }

  // End exercise mode
  public endExercise(): void {
    this.exerciseMode = false;
    this.currentExercise = undefined;
    trackingOrchestrator.setPhase('listening'); // Return to normal
  }

  // Get current state
  public getState(): TrackingState {
    return this.currentState;
  }

  // Start all tracking
  public startTracking(): void {
    trackingOrchestrator.startTracking();
    // this.facialTracking.startTracking();
  }

  // Stop all tracking
  public stopTracking(): void {
    trackingOrchestrator.stopTracking();
    // this.facialTracking.stopTracking();
  }
}

export const coachAwareTracking = CoachAwareTrackingSystem.getInstance();
