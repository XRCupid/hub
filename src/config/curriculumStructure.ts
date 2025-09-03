// Comprehensive XRCupid Curriculum Structure - Full Version
export interface Coach {
  id: string;
  name: string;
  specialty: string;
  description: string;
  avatar: string;
  personality: string;
  focus?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  coachId: string;
  level: 'foundation' | 'intermediate' | 'advanced';
  duration: number;
  content?: string;
  type?: string;
  exercises?: any[];
  keyTakeaways?: string[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  level: string;
  lessons: Lesson[];
}

export interface CurriculumModule {
  id: string;
  title: string;
  lessons: string[];
}

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

export const COACHES: Coach[] = [
  {
    id: 'grace',
    name: 'Grace',
    specialty: 'Charm & Conversation',
    description: 'Master of authentic charm and engaging conversation skills.',
    avatar: '/avatars/grace.png',
    personality: 'warm and understanding',
    focus: 'Charm & Conversation'
  },
  {
    id: 'posie',
    name: 'Posie',
    specialty: 'Body Language & Chemistry',
    description: 'Expert in non-verbal communication and building authentic chemistry.',
    avatar: '/avatars/posie.png',
    personality: 'intuitive and present',
    focus: 'Body Language & Chemistry'
  },
  {
    id: 'rizzo',
    name: 'Rizzo',
    specialty: 'Confidence & Charisma',
    description: 'Specialist in building authentic confidence and magnetic presence.',
    avatar: '/avatars/rizzo.png',
    personality: 'honest and supportive',
    focus: 'Confidence & Charisma'
  }
];

// Complete Curriculum Structure with 40+ Lessons
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

// Flattened module structure for compatibility
export const CURRICULUM_MODULES: Module[] = [
  {
    id: 'grace-foundation',
    title: 'Conversation Mastery - Foundation',
    description: 'Essential conversation and charm skills with Grace',
    level: 'foundation',
    lessons: [
      {
        id: 'warm_greetings',
        title: 'Warm Authentic Greetings',
        description: 'Create instant comfort with genuine warmth',
        coachId: 'grace',
        level: 'foundation',
        duration: 20
      },
      {
        id: 'voice_tonality',
        title: 'Voice & Tonality',
        description: 'Master the subtle art of vocal communication',
        coachId: 'grace',
        level: 'foundation',
        duration: 25
      },
      {
        id: 'creating_comfort',
        title: 'Creating Comfort Quickly',
        description: 'Help others feel at ease in your presence',
        coachId: 'grace',
        level: 'foundation',
        duration: 30
      },
      {
        id: 'active_listening',
        title: 'Active Listening Mastery',
        description: 'Truly hear and connect with your conversation partner',
        coachId: 'grace',
        level: 'foundation',
        duration: 35
      }
    ]
  },
  {
    id: 'posie-foundation',
    title: 'Body Language & Presence - Foundation',
    description: 'Master non-verbal communication and authentic presence',
    level: 'foundation',
    lessons: [
      {
        id: 'posture_confidence',
        title: 'Posture & Confidence',
        description: 'Embody confidence through your physical presence',
        coachId: 'posie',
        level: 'foundation',
        duration: 25
      },
      {
        id: 'spatial_awareness',
        title: 'Spatial Awareness',
        description: 'Navigate social spaces with grace and intention',
        coachId: 'posie',
        level: 'foundation',
        duration: 20
      },
      {
        id: 'eye_contact_mastery',
        title: 'Eye Contact Without Staring',
        description: 'Create connection through authentic eye contact',
        coachId: 'posie',
        level: 'foundation',
        duration: 30
      },
      {
        id: 'authentic_smiling',
        title: 'Smile Authenticity',
        description: 'Express genuine warmth through natural smiles',
        coachId: 'posie',
        level: 'foundation',
        duration: 15
      }
    ]
  },
  {
    id: 'rizzo-foundation',
    title: 'Confidence & Charisma - Foundation',
    description: 'Build authentic confidence and magnetic presence',
    level: 'foundation',
    lessons: [
      {
        id: 'confidence_vs_arrogance',
        title: 'Confidence vs Arrogance',
        description: 'Learn the crucial difference between healthy confidence and arrogance',
        coachId: 'rizzo',
        level: 'foundation',
        duration: 40
      },
      {
        id: 'outcome_independence',
        title: 'Outcome Independence',
        description: 'Be confident regardless of specific outcomes',
        coachId: 'rizzo',
        level: 'foundation',
        duration: 35
      },
      {
        id: 'rejection_resilience',
        title: 'Rejection Resilience',
        description: 'Handle rejection with grace and maintain self-worth',
        coachId: 'rizzo',
        level: 'foundation',
        duration: 45
      },
      {
        id: 'playful_teasing',
        title: 'Teasing With Kindness',
        description: 'Add playfulness without crossing boundaries',
        coachId: 'rizzo',
        level: 'foundation',
        duration: 30
      }
    ]
  }
];

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

// Add missing exports for compatibility
export const ETHICAL_PRINCIPLES = {
  consent: 'Always respect consent and boundaries',
  authenticity: 'Be genuine and honest in all interactions',
  safety: 'Prioritize emotional and physical safety for all',
  respect: 'Treat all people with dignity and respect'
};

export const PERSONALITY_TYPES = {
  empathetic: 'Understanding and emotionally supportive',
  analytical: 'Data-driven and objective',
  motivational: 'Encouraging and confidence-building'
};

// Function to calculate total lesson count
export function getTotalLessonCount(): number {
  let total = 0;
  Object.values(CURRICULUM_STRUCTURE).forEach(coach => {
    Object.values(coach.modules).forEach(levelModules => {
      levelModules.forEach(module => {
        total += module.lessons.length;
      });
    });
  });
  return total;
}

// Function to get all lessons in a flat structure
export function getAllLessons(): { coach: string; level: string; module: string; lessons: string[] }[] {
  const allLessons: { coach: string; level: string; module: string; lessons: string[] }[] = [];
  
  Object.entries(CURRICULUM_STRUCTURE).forEach(([coachId, coach]) => {
    Object.entries(coach.modules).forEach(([level, modules]) => {
      modules.forEach(module => {
        allLessons.push({
          coach: coach.name,
          level,
          module: module.title,
          lessons: module.lessons
        });
      });
    });
  });
  
  return allLessons;
}

export function calculateModuleUnlock(
  performance: DatingPerformance,
  module: CurriculumModule
): boolean {
  // Logic to determine if user has met criteria
  // Based on ethical performance metrics
  return true; // Placeholder
}
