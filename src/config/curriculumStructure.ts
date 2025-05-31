export interface CurriculumModule {
  id: string;
  title: string;
  coach: 'grace' | 'posie' | 'rizzo';
  level: 'foundation' | 'intermediate' | 'advanced';
  description: string;
  lessons: Lesson[];
  unlockCriteria: UnlockCriteria;
  ethicsNote?: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration: number; // minutes
  type: 'theory' | 'practice' | 'reflection';
  content: string;
  exercises: Exercise[];
  keyTakeaways: string[];
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  metrics: string[];
  ethicalGuidelines?: string[];
}

export interface UnlockCriteria {
  previousModules?: string[];
  datingMetrics?: {
    metric: string;
    threshold: number;
  }[];
  achievements?: string[];
}

// Core Ethical Principles that guide all content
export const ETHICAL_PRINCIPLES = {
  authenticity: "Be genuinely yourself while understanding social dynamics",
  consent: "Respect boundaries and ensure mutual enthusiasm",
  balance: "Express interest without overwhelming or pressuring",
  growth: "Focus on personal development, not manipulation",
  respect: "Honor the other person's autonomy and choices"
};

// Strategic Awareness Module (Poker Psychology Applied Ethically)
export const STRATEGIC_AWARENESS_MODULE: CurriculumModule = {
  id: 'strategic-awareness',
  title: 'Strategic Social Awareness',
  coach: 'rizzo',
  level: 'intermediate',
  description: 'Learn strategic thinking from poker psychology, applied ethically to dating',
  ethicsNote: 'These techniques are about reading situations, not manipulating people',
  lessons: [
    {
      id: 'reading-the-table',
      title: 'Reading Social Dynamics',
      duration: 45,
      type: 'theory',
      content: `
        Just like poker players read the table, we can develop awareness of social dynamics.
        This isn't about deception - it's about understanding:
        - Energy levels in the conversation
        - Mutual interest indicators
        - When to engage vs. give space
        - Recognizing genuine vs. polite interest
      `,
      exercises: [
        {
          id: 'interest-calibration',
          name: 'Interest Level Calibration',
          description: 'Practice recognizing different levels of romantic interest',
          metrics: ['accuracy', 'response-appropriateness'],
          ethicalGuidelines: [
            'Respect lukewarm signals as a "no"',
            'Never try to "convince" someone who shows disinterest'
          ]
        }
      ],
      keyTakeaways: [
        'Awareness helps you respect boundaries better',
        'Reading signals prevents coming on too strong',
        'Strategic thinking means knowing when to fold'
      ]
    },
    {
      id: 'strategic-restraint',
      title: 'The Power of Restraint',
      duration: 40,
      type: 'practice',
      content: `
        In poker, the best players know when NOT to bet. In dating:
        - Creating space allows attraction to build naturally
        - Showing all your cards too early reduces mystery
        - Strategic pauses create anticipation
        - Less can be more when expressing interest
      `,
      exercises: [
        {
          id: 'pause-practice',
          name: 'Strategic Pause Training',
          description: 'Learn to use pauses and space effectively',
          metrics: ['timing', 'comfort-with-silence', 'engagement-quality']
        }
      ],
      keyTakeaways: [
        'Restraint shows confidence and respect',
        'Space allows the other person to invest',
        'Not every moment needs to be filled'
      ]
    }
  ],
  unlockCriteria: {
    previousModules: ['confidence-bootcamp'],
    datingMetrics: [
      { metric: 'not-overwhelming', threshold: 0.8 }
    ]
  }
};

// Balance & Calibration Module
export const BALANCE_MODULE: CurriculumModule = {
  id: 'balance-calibration',
  title: 'Finding Your Balance',
  coach: 'grace',
  level: 'intermediate',
  description: 'Master the art of expressing interest without overwhelming',
  lessons: [
    {
      id: 'interest-expression',
      title: 'Calibrated Interest Expression',
      duration: 50,
      type: 'theory',
      content: `
        Expressing interest is an art of balance:
        - Match and slightly exceed their energy
        - Use the 70/30 rule: Show 70% of your interest
        - Leave room for them to pursue too
        - Progressive disclosure: Share gradually
      `,
      exercises: [
        {
          id: 'energy-matching',
          name: 'Energy Matching Exercise',
          description: 'Practice calibrating your enthusiasm to theirs',
          metrics: ['energy-match', 'reciprocity', 'comfort-level']
        }
      ],
      keyTakeaways: [
        'Matching energy creates comfort',
        'Slight restraint creates intrigue',
        'Balance prevents overwhelming'
      ]
    }
  ],
  unlockCriteria: {
    previousModules: ['conversation-fundamentals']
  }
};

// Non-Toxic Confidence Module (Extracting value from problematic sources)
export const HEALTHY_CONFIDENCE_MODULE: CurriculumModule = {
  id: 'healthy-confidence',
  title: 'Authentic Confidence Without Toxicity',
  coach: 'rizzo',
  level: 'foundation',
  description: 'Build genuine confidence while rejecting toxic patterns',
  ethicsNote: 'We extract confidence lessons while firmly rejecting manipulation, misogyny, and disrespect',
  lessons: [
    {
      id: 'confidence-vs-arrogance',
      title: 'Confidence Without Arrogance',
      duration: 45,
      type: 'theory',
      content: `
        True confidence is:
        - Self-assurance without putting others down
        - Being outcome-independent, not indifferent to others' feelings
        - Leading with respect, not dominance
        - Vulnerability as strength, not weakness
        
        We reject:
        - Negging or backhanded compliments
        - Power games or manipulation
        - Treating dating as conquest
        - Disrespecting boundaries as "persistence"
      `,
      exercises: [
        {
          id: 'healthy-assertiveness',
          name: 'Assertive Not Aggressive',
          description: 'Practice expressing desires respectfully',
          metrics: ['clarity', 'respect', 'authenticity'],
          ethicalGuidelines: [
            'State preferences without demanding',
            'Accept "no" gracefully',
            'Confidence includes respecting others'
          ]
        }
      ],
      keyTakeaways: [
        'Real confidence respects others',
        'Strength includes emotional intelligence',
        'Authenticity beats tactics'
      ]
    }
  ],
  unlockCriteria: {}
};

// Complete Curriculum Structure
export const CURRICULUM_STRUCTURE = {
  grace: {
    name: 'Grace',
    focus: 'Charm & Conversation',
    modules: {
      foundation: [
        {
          id: 'first-impressions',
          title: 'The Art of First Impressions',
          lessons: [
            'Warm Authentic Greetings',
            'Voice & Tonality',
            'Creating Comfort Quickly',
            'The Ethics of Charm'
          ]
        },
        {
          id: 'conversation-fundamentals',
          title: 'Conversation Fundamentals',
          lessons: [
            'Active Listening Mastery',
            'Question Crafting',
            'Finding Common Ground',
            'Avoiding Interview Mode'
          ]
        }
      ],
      intermediate: [
        {
          id: 'balance-calibration',
          title: 'Finding Your Balance',
          lessons: [
            'Calibrated Interest Expression',
            'The 70/30 Rule',
            'Creating Space for Pursuit',
            'Progressive Disclosure'
          ]
        },
        {
          id: 'storytelling',
          title: 'Storytelling & Engagement',
          lessons: [
            'Crafting Your Narrative',
            'Emotional Hooks',
            'Humor Without Harm',
            'Vulnerable Sharing'
          ]
        }
      ],
      advanced: [
        {
          id: 'social-grace',
          title: 'Social Grace Under Pressure',
          lessons: [
            'Handling Rejection Gracefully',
            'Navigating Difficult Topics',
            'Cultural Sensitivity',
            'Conflict as Connection'
          ]
        }
      ]
    }
  },
  
  posie: {
    name: 'Posie',
    focus: 'Body Language & Chemistry',
    modules: {
      foundation: [
        {
          id: 'presence-awareness',
          title: 'Presence & Awareness',
          lessons: [
            'Posture & Confidence',
            'Spatial Awareness',
            'Breathing for Calm',
            'Grounding Techniques'
          ]
        },
        {
          id: 'nonverbal-basics',
          title: 'Non-Verbal Communication',
          lessons: [
            'Eye Contact Without Staring',
            'Smile Authenticity',
            'Open vs Closed Postures',
            'Respecting Personal Space'
          ]
        }
      ],
      intermediate: [
        {
          id: 'chemistry-building',
          title: 'Building Chemistry Ethically',
          lessons: [
            'Energy Matching',
            'The Touch Ladder (With Consent)',
            'Creating Tension Without Pressure',
            'Playful Physical Communication'
          ]
        },
        {
          id: 'reading-responding',
          title: 'Reading & Responding',
          lessons: [
            'Micro-Expression Recognition',
            'Comfort vs Discomfort Signals',
            'When to Advance vs Retreat',
            'Enthusiastic Consent Indicators'
          ]
        }
      ],
      advanced: [
        {
          id: 'magnetic-attraction',
          title: 'Magnetic Attraction',
          lessons: [
            'Sexual Tension (Mutual & Respectful)',
            'Vulnerability & Strength Balance',
            'Creating Memorable Moments',
            'Physical Chemistry Ethics'
          ]
        }
      ]
    }
  },
  
  rizzo: {
    name: 'Rizzo',
    focus: 'Confidence & Charisma',
    modules: {
      foundation: [
        {
          id: 'healthy-confidence',
          title: 'Authentic Confidence',
          lessons: [
            'Confidence vs Arrogance',
            'Outcome Independence',
            'Self-Worth Foundations',
            'Rejection Resilience'
          ]
        },
        {
          id: 'playful-banter',
          title: 'Wit & Playfulness',
          lessons: [
            'Teasing With Kindness',
            'Clever Comebacks',
            'Playful Challenging',
            'Avoiding Toxic Patterns'
          ]
        }
      ],
      intermediate: [
        {
          id: 'strategic-awareness',
          title: 'Strategic Social Awareness',
          lessons: [
            'Reading the Room',
            'Strategic Restraint',
            'When to Fold',
            'Ethical Influence'
          ]
        },
        {
          id: 'sexual-confidence',
          title: 'Sexual Confidence & Respect',
          lessons: [
            'Flirtation With Boundaries',
            'Innuendo Done Right',
            'Building Anticipation',
            'Consent as Sexy'
          ]
        }
      ],
      advanced: [
        {
          id: 'irresistible-presence',
          title: 'Irresistible Presence',
          lessons: [
            'Commanding Attention Respectfully',
            'Sexual Magnetism Ethics',
            'Leadership in Romance',
            'Power With, Not Over'
          ]
        }
      ]
    }
  }
};

// Performance Metrics that emphasize healthy behavior
export const PERFORMANCE_METRICS = {
  conversationFlow: {
    name: 'Conversation Flow',
    description: 'Natural back-and-forth without dominating',
    idealRange: [0.4, 0.6], // Speaking 40-60% of the time
  },
  enthusiasmBalance: {
    name: 'Enthusiasm Balance',
    description: 'Showing interest without overwhelming',
    idealRange: [0.7, 0.9], // 70-90% energy match
  },
  boundaryRespect: {
    name: 'Boundary Respect',
    description: 'Recognizing and respecting limits',
    idealRange: [0.95, 1.0], // Near perfect score expected
  },
  authenticityScore: {
    name: 'Authenticity',
    description: 'Being genuine vs performing',
    idealRange: [0.8, 1.0], // High authenticity valued
  },
  emotionalIntelligence: {
    name: 'Emotional Intelligence',
    description: 'Reading and responding to emotions',
    idealRange: [0.7, 1.0],
  },
  playfulnessQuotient: {
    name: 'Playfulness',
    description: 'Fun without crossing lines',
    idealRange: [0.6, 0.8],
  }
};

// Integration with Dating App Performance
export interface DatingPerformance {
  conversationMetrics: {
    flowScore: number;
    listeningRatio: number;
    questionQuality: number;
  };
  chemistryMetrics: {
    energyMatch: number;
    physicalComfort: number;
    mutualAttraction: number;
  };
  respectMetrics: {
    boundaryRecognition: number;
    consentAwareness: number;
    gracefulnessScore: number;
  };
}

export function calculateModuleUnlock(
  performance: DatingPerformance,
  module: CurriculumModule
): boolean {
  // Logic to determine if user has met criteria
  // Based on ethical performance metrics
  return true; // Placeholder
}
