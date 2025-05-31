// Training Module Configuration for Each Dating Coach

export interface TrackingMetric {
  id: string;
  name: string;
  description: string;
  unit: string; // percentage, count, seconds, etc.
  idealRange?: { min: number; max: number };
  weight: number; // importance in overall score (0-1)
}

export interface TrainingModule {
  id: string;
  name: string;
  coachId: string;
  description: string;
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[]; // module IDs
  objectives: string[];
  exercises: Exercise[];
  trackingMetrics: TrackingMetric[];
  successCriteria: SuccessCriteria;
}

export interface Exercise {
  id: string;
  name: string;
  type: 'conversation' | 'scenario' | 'mirroring' | 'freestyle' | 'reaction';
  instructions: string;
  duration: number; // seconds
  prompts?: string[];
  expectedBehaviors: string[];
}

export interface SuccessCriteria {
  minimumScore: number; // 0-100
  requiredMetrics: { metricId: string; minimumValue: number }[];
  bonusObjectives?: string[];
}

// GRACE'S TRAINING MODULES - Charm & Conversation
export const GRACE_MODULES: TrainingModule[] = [
  {
    id: 'grace-intro-charm',
    name: 'Introduction to Charm',
    coachId: 'grace',
    description: 'Master the fundamentals of charming conversation and social grace',
    duration: 15,
    difficulty: 'beginner',
    objectives: [
      'Deliver sincere compliments naturally',
      'Maintain engaging eye contact',
      'Use open-ended questions effectively',
      'Practice active listening'
    ],
    exercises: [
      {
        id: 'compliment-craft',
        name: 'Compliment Crafting',
        type: 'conversation',
        instructions: 'Practice giving specific, sincere compliments that go beyond appearance',
        duration: 180,
        prompts: [
          'Your date just told you about their passion project',
          'You notice your date has excellent taste in wine',
          'Your date shares a personal achievement'
        ],
        expectedBehaviors: ['Specificity', 'Sincerity', 'Follow-up questions']
      },
      {
        id: 'conversation-flow',
        name: 'Conversation Flow',
        type: 'freestyle',
        instructions: 'Keep a natural conversation going for 3 minutes without awkward pauses',
        duration: 180,
        expectedBehaviors: ['Smooth transitions', 'Balanced speaking time', 'Natural follow-ups']
      }
    ],
    trackingMetrics: [
      {
        id: 'conversation-flow-score',
        name: 'Conversation Flow',
        description: 'Smoothness of topic transitions and lack of awkward pauses',
        unit: 'percentage',
        idealRange: { min: 70, max: 100 },
        weight: 0.3
      },
      {
        id: 'compliment-quality',
        name: 'Compliment Quality',
        description: 'Specificity and sincerity of compliments',
        unit: 'score',
        idealRange: { min: 7, max: 10 },
        weight: 0.2
      },
      {
        id: 'question-ratio',
        name: 'Question Ratio',
        description: 'Balance of questions asked vs statements made',
        unit: 'ratio',
        idealRange: { min: 0.3, max: 0.5 },
        weight: 0.2
      },
      {
        id: 'active-listening',
        name: 'Active Listening Score',
        description: 'References to previous conversation points',
        unit: 'count',
        idealRange: { min: 3, max: 10 },
        weight: 0.3
      }
    ],
    successCriteria: {
      minimumScore: 70,
      requiredMetrics: [
        { metricId: 'conversation-flow-score', minimumValue: 65 },
        { metricId: 'active-listening', minimumValue: 3 }
      ]
    }
  },
  {
    id: 'grace-advanced-etiquette',
    name: 'Advanced Social Etiquette',
    coachId: 'grace',
    description: 'Navigate formal settings and high-stakes social situations with elegance',
    duration: 20,
    difficulty: 'advanced',
    prerequisites: ['grace-intro-charm'],
    objectives: [
      'Master formal dining etiquette',
      'Handle introductions gracefully',
      'Navigate controversial topics diplomatically',
      'Demonstrate cultural awareness'
    ],
    exercises: [
      {
        id: 'formal-dining',
        name: 'Formal Dining Simulation',
        type: 'scenario',
        instructions: 'Navigate a formal dinner date while maintaining conversation',
        duration: 300,
        prompts: ['Wine selection', 'Utensil usage', 'Napkin etiquette', 'Toast giving'],
        expectedBehaviors: ['Proper etiquette', 'Confidence', 'Teaching without condescending']
      }
    ],
    trackingMetrics: [
      {
        id: 'etiquette-violations',
        name: 'Etiquette Violations',
        description: 'Number of social faux pas committed',
        unit: 'count',
        idealRange: { min: 0, max: 2 },
        weight: 0.4
      },
      {
        id: 'grace-under-pressure',
        name: 'Grace Under Pressure',
        description: 'Composure during challenging moments',
        unit: 'percentage',
        idealRange: { min: 80, max: 100 },
        weight: 0.6
      }
    ],
    successCriteria: {
      minimumScore: 80,
      requiredMetrics: [
        { metricId: 'etiquette-violations', minimumValue: 0 },
        { metricId: 'grace-under-pressure', minimumValue: 75 }
      ]
    }
  }
];

// POSIE'S TRAINING MODULES - Body Language & Engagement
export const POSIE_MODULES: TrainingModule[] = [
  {
    id: 'posie-body-basics',
    name: 'Body Language Basics',
    coachId: 'posie',
    description: 'Understand and master the fundamentals of attractive body language',
    duration: 20,
    difficulty: 'beginner',
    objectives: [
      'Maintain appropriate eye contact',
      'Use open body posture',
      'Mirror partner naturally',
      'Understand personal space dynamics'
    ],
    exercises: [
      {
        id: 'eye-contact-practice',
        name: 'Eye Contact Calibration',
        type: 'mirroring',
        instructions: 'Practice maintaining eye contact: 70% during listening, 50% while speaking',
        duration: 120,
        expectedBehaviors: ['Natural breaks', 'Triangle technique', 'Smiling with eyes']
      },
      {
        id: 'mirroring-exercise',
        name: 'Natural Mirroring',
        type: 'mirroring',
        instructions: 'Subtly mirror your partner\'s gestures and energy level',
        duration: 180,
        expectedBehaviors: ['Delayed mirroring', 'Partial matching', 'Energy synchronization']
      }
    ],
    trackingMetrics: [
      {
        id: 'eye-contact-duration',
        name: 'Eye Contact Duration',
        description: 'Percentage of appropriate eye contact maintained',
        unit: 'percentage',
        idealRange: { min: 50, max: 70 },
        weight: 0.3
      },
      {
        id: 'posture-openness',
        name: 'Posture Openness',
        description: 'Openness and invitation of body positioning',
        unit: 'score',
        idealRange: { min: 7, max: 10 },
        weight: 0.2
      },
      {
        id: 'mirroring-naturalness',
        name: 'Mirroring Naturalness',
        description: 'How naturally you mirror without being obvious',
        unit: 'score',
        idealRange: { min: 6, max: 9 },
        weight: 0.3
      },
      {
        id: 'proximity-comfort',
        name: 'Proximity Comfort',
        description: 'Appropriate use of personal space',
        unit: 'score',
        idealRange: { min: 7, max: 10 },
        weight: 0.2
      }
    ],
    successCriteria: {
      minimumScore: 65,
      requiredMetrics: [
        { metricId: 'eye-contact-duration', minimumValue: 40 },
        { metricId: 'posture-openness', minimumValue: 6 }
      ]
    }
  },
  {
    id: 'posie-chemistry-creation',
    name: 'Creating Chemistry Through Presence',
    coachId: 'posie',
    description: 'Advanced techniques for building romantic tension and connection',
    duration: 25,
    difficulty: 'intermediate',
    prerequisites: ['posie-body-basics'],
    objectives: [
      'Create tension through proximity',
      'Use touch appropriately',
      'Build anticipation with pauses',
      'Synchronize breathing and energy'
    ],
    exercises: [
      {
        id: 'tension-building',
        name: 'Tension Building',
        type: 'scenario',
        instructions: 'Create romantic tension without words, using only presence and positioning',
        duration: 240,
        prompts: ['Lean in moment', 'Almost touch', 'Meaningful pause', 'Energy spike'],
        expectedBehaviors: ['Gradual escalation', 'Reading signals', 'Creating anticipation']
      }
    ],
    trackingMetrics: [
      {
        id: 'tension-level',
        name: 'Romantic Tension Level',
        description: 'Measured chemistry and attraction indicators',
        unit: 'score',
        idealRange: { min: 6, max: 9 },
        weight: 0.4
      },
      {
        id: 'touch-appropriateness',
        name: 'Touch Appropriateness',
        description: 'Timing and placement of physical contact',
        unit: 'score',
        idealRange: { min: 8, max: 10 },
        weight: 0.3
      },
      {
        id: 'energy-synchronization',
        name: 'Energy Sync',
        description: 'How well you match and lead energy levels',
        unit: 'percentage',
        idealRange: { min: 70, max: 90 },
        weight: 0.3
      }
    ],
    successCriteria: {
      minimumScore: 75,
      requiredMetrics: [
        { metricId: 'tension-level', minimumValue: 6 },
        { metricId: 'touch-appropriateness', minimumValue: 7 }
      ]
    }
  }
];

// RIZZO'S TRAINING MODULES - Confidence & Charisma
export const RIZZO_MODULES: TrainingModule[] = [
  {
    id: 'rizzo-confidence-101',
    name: 'Confidence Bootcamp',
    coachId: 'rizzo',
    description: 'Build unshakeable confidence and magnetic presence',
    duration: 18,
    difficulty: 'beginner',
    objectives: [
      'Project confidence through voice and posture',
      'Handle rejection with style',
      'Make bold first moves',
      'Own your sexuality'
    ],
    exercises: [
      {
        id: 'rejection-recovery',
        name: 'Rejection Recovery',
        type: 'reaction',
        instructions: 'Practice handling rejection with humor and grace',
        duration: 150,
        prompts: [
          'They say they have a partner',
          'They\'re not interested',
          'They give you a fake number'
        ],
        expectedBehaviors: ['Graceful acceptance', 'Humor', 'Quick recovery', 'No bitterness']
      },
      {
        id: 'bold-opener',
        name: 'Bold Openers',
        type: 'conversation',
        instructions: 'Deliver confident opening lines that stand out',
        duration: 120,
        prompts: ['Bar approach', 'Coffee shop', 'Gym encounter', 'Bookstore browse'],
        expectedBehaviors: ['Confidence', 'Originality', 'Follow-through', 'Reading the room']
      }
    ],
    trackingMetrics: [
      {
        id: 'confidence-projection',
        name: 'Confidence Projection',
        description: 'Overall confidence in voice, posture, and delivery',
        unit: 'score',
        idealRange: { min: 7, max: 10 },
        weight: 0.4
      },
      {
        id: 'recovery-speed',
        name: 'Recovery Speed',
        description: 'How quickly you bounce back from awkward moments',
        unit: 'seconds',
        idealRange: { min: 1, max: 5 },
        weight: 0.2
      },
      {
        id: 'boldness-score',
        name: 'Boldness Score',
        description: 'Willingness to take risks and make moves',
        unit: 'score',
        idealRange: { min: 7, max: 9 },
        weight: 0.4
      }
    ],
    successCriteria: {
      minimumScore: 70,
      requiredMetrics: [
        { metricId: 'confidence-projection', minimumValue: 6 },
        { metricId: 'boldness-score', minimumValue: 6 }
      ]
    }
  },
  {
    id: 'rizzo-banter-master',
    name: 'Banter & Sexual Tension',
    coachId: 'rizzo',
    description: 'Master the art of flirty banter and building sexual tension',
    duration: 22,
    difficulty: 'intermediate',
    prerequisites: ['rizzo-confidence-101'],
    objectives: [
      'Deliver witty comebacks',
      'Use innuendo tastefully',
      'Create push-pull dynamics',
      'Build sexual tension verbally'
    ],
    exercises: [
      {
        id: 'witty-banter',
        name: 'Witty Banter Tennis',
        type: 'conversation',
        instructions: 'Engage in playful verbal sparring with increasing intensity',
        duration: 240,
        prompts: ['Tease response', 'Double entendre', 'Playful challenge', 'Flirty comeback'],
        expectedBehaviors: ['Quick wit', 'Playfulness', 'Calibration', 'Escalation']
      }
    ],
    trackingMetrics: [
      {
        id: 'wit-speed',
        name: 'Response Speed',
        description: 'How quickly you deliver comebacks',
        unit: 'seconds',
        idealRange: { min: 0.5, max: 3 },
        weight: 0.3
      },
      {
        id: 'banter-quality',
        name: 'Banter Quality',
        description: 'Cleverness and appropriateness of responses',
        unit: 'score',
        idealRange: { min: 7, max: 10 },
        weight: 0.4
      },
      {
        id: 'sexual-tension',
        name: 'Sexual Tension Level',
        description: 'Ability to create and maintain attraction',
        unit: 'score',
        idealRange: { min: 6, max: 8 },
        weight: 0.3
      }
    ],
    successCriteria: {
      minimumScore: 75,
      requiredMetrics: [
        { metricId: 'banter-quality', minimumValue: 7 },
        { metricId: 'sexual-tension', minimumValue: 5 }
      ]
    }
  }
];

// Progress tracking interface
export interface UserProgress {
  userId: string;
  moduleId: string;
  completionDate?: Date;
  score: number;
  metricScores: { [metricId: string]: number };
  attempts: number;
  timeSpent: number; // in seconds
  notes?: string;
}

// Helper functions
export function getAllModules(): TrainingModule[] {
  return [...GRACE_MODULES, ...POSIE_MODULES, ...RIZZO_MODULES];
}

export function getModulesByCoach(coachId: string): TrainingModule[] {
  return getAllModules().filter(module => module.coachId === coachId);
}

export function getModuleById(moduleId: string): TrainingModule | undefined {
  return getAllModules().find(module => module.id === moduleId);
}

export function calculateModuleScore(
  metricScores: { [metricId: string]: number },
  module: TrainingModule
): number {
  let totalScore = 0;
  let totalWeight = 0;

  module.trackingMetrics.forEach(metric => {
    const score = metricScores[metric.id] || 0;
    const normalizedScore = metric.idealRange
      ? Math.min(100, (score / metric.idealRange.max) * 100)
      : score;
    
    totalScore += normalizedScore * metric.weight;
    totalWeight += metric.weight;
  });

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

export function isModuleUnlocked(
  moduleId: string,
  userProgress: UserProgress[]
): boolean {
  const module = getModuleById(moduleId);
  if (!module || !module.prerequisites) return true;

  return module.prerequisites.every(prereqId => {
    const progress = userProgress.find(p => p.moduleId === prereqId);
    return progress && progress.score >= module.successCriteria.minimumScore;
  });
}
