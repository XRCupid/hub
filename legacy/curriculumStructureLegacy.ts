// CORE INTERFACE DEFINITIONS
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

// ADAPTIVE CURRICULUM INTERFACES
interface NPCDateAnalytics {
  trackedMetrics: string[];
  performanceWeights: { [metric: string]: number };
  failureThresholds: { [metric: string]: number };
  adaptiveLessonTriggers: AdaptiveTrigger[];
}

interface InworldAppMetrics {
  textingPerformance: string[];
  emotionalRegulationMarkers: string[];
  redFlagRecognitionTests: RedFlagTest[];
  manipulationResistanceTests: ManipulationTest[];
}

interface RedFlagTest {
  flagType: string;
  testScenario: string;
  passingScore: number;
  failureIntervention: string;
}

interface ManipulationTest {
  tacticType: string;
  testScenario: string;
  passingScore: number;
  failureIntervention: string;
}

interface AdaptiveTrigger {
  condition: string;
  threshold: number;
  adaptiveAction: AdaptiveAction;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

interface AdaptiveAction {
  type: 'generate_failure_scenario' | 'intensive_coaching' | 'safety_intervention' | 'confidence_building';
  targetLesson: string;
  coachAssignment: string;
  additionalSupport: string[];
}

interface FailureScenarioConfig {
  rejectionScenarios?: RejectionScenario[];
  redFlagScenarios?: RedFlagScenario[];
  strategicScenarios?: StrategicScenario[];
  embodiedScenarios?: EmbodiedScenario[];
}

interface RejectionScenario {
  name: string;
  npcBehavior: string;
  userLearningGoal: string;
  expectedFailure: string;
  coachingInterventions: string[];
}

interface RedFlagScenario {
  name: string;
  npcBehavior: string;
  redFlags: string[];
  userLearningGoal: string;
  expectedFailure: string;
  coachingInterventions: string[];
}

interface StrategicScenario {
  name: string;
  npcBehavior: string;
  userLearningGoal: string;
  expectedFailure: string;
  coachingInterventions: string[];
}

interface EmbodiedScenario {
  name: string;
  npcBehavior: string;
  userLearningGoal: string;
  expectedFailure: string;
  coachingInterventions: string[];
}

interface CurriculumStructure {
  [coachId: string]: {
    id: string;
    name: string;
    specialty: string;
    personality: string;
    modules: {
      foundation: CurriculumModule[];
      intermediate: CurriculumModule[];
      advanced: CurriculumModule[];
    };
    // NEW: Performance Integration
    performanceIntegration: {
      npcDateAnalytics: NPCDateAnalytics;
      inworldAppMetrics: InworldAppMetrics;
      adaptiveLessonTriggers: AdaptiveTrigger[];
      failureScenarioDesign: FailureScenarioConfig;
    };
  };
}

// Core Ethical Principles that guide all content
export const ETHICAL_PRINCIPLES = {
  authenticity: "Be genuinely yourself while understanding social dynamics",
  consent: "Respect boundaries and ensure mutual enthusiasm",
  balance: "Express interest without overwhelming or pressuring",
  growth: "Focus on personal development, not manipulation",
  respect: "Honor the other person's autonomy and choices"
};

// Complete Curriculum Structure
export const CURRICULUM_STRUCTURE: CurriculumStructure = {
  grace: {
    id: 'grace',
    name: 'Grace',
    specialty: 'Charm & Conversation',
    personality: 'Nurturing, insightful, and emotionally attuned. Grace helps users develop deep emotional intelligence, healthy vulnerability, and authentic connection skills.',
    
    // NEW: Performance Integration
    performanceIntegration: {
      npcDateAnalytics: {
        trackedMetrics: [
          'emotional_regulation_during_rejection',
          'vulnerability_appropriateness',
          'empathy_demonstration',
          'red_flag_recognition_speed',
          'manipulation_resistance',
          'authentic_expression_level',
          'emotional_intelligence_application',
          'attachment_anxiety_management'
        ],
        performanceWeights: {
          red_flag_recognition_speed: 0.3, // Critical for safety
          manipulation_resistance: 0.25,   // Critical for protection
          emotional_regulation_during_rejection: 0.2,
          vulnerability_appropriateness: 0.15,
          empathy_demonstration: 0.1
        },
        failureThresholds: {
          red_flag_recognition_speed: 0.4,    // Below 40% = urgent safety training
          manipulation_resistance: 0.3,       // Below 30% = manipulation awareness intensive
          emotional_regulation_during_rejection: 0.35
        },
        adaptiveLessonTriggers: [
          {
            condition: 'red_flag_recognition_speed < 0.4',
            threshold: 0.4,
            adaptiveAction: {
              type: 'safety_intervention',
              targetLesson: 'urgent_red_flag_intensive',
              coachAssignment: 'grace',
              additionalSupport: ['safety_resources', 'emergency_contacts', 'boundary_scripts']
            },
            urgency: 'critical'
          },
          {
            condition: 'manipulation_resistance < 0.3',
            threshold: 0.3,
            adaptiveAction: {
              type: 'intensive_coaching',
              targetLesson: 'manipulation_awareness_bootcamp',
              coachAssignment: 'grace',
              additionalSupport: ['gaslighting_recognition', 'boundary_enforcement', 'self_trust_building']
            },
            urgency: 'high'
          },
          {
            condition: 'emotional_regulation_during_rejection < 0.35',
            threshold: 0.35,
            adaptiveAction: {
              type: 'generate_failure_scenario',
              targetLesson: 'rejection_resilience_intensive',
              coachAssignment: 'grace',
              additionalSupport: ['self_compassion_exercises', 'reframe_techniques']
            },
            urgency: 'medium'
          }
        ]
      },
      
      inworldAppMetrics: {
        textingPerformance: [
          'response_time_anxiety',
          'over_investment_in_one_sided_conversations',
          'breadcrumbing_recognition',
          'ghosting_emotional_regulation',
          'appropriate_vulnerability_timing',
          'red_flag_recognition_in_text'
        ],
        emotionalRegulationMarkers: [
          'stress_response_to_delayed_replies',
          'attachment_anxiety_during_silence',
          'emotional_recovery_time_from_rejection',
          'rumination_patterns',
          'catastrophic_thinking_triggers'
        ],
        redFlagRecognitionTests: [
          {
            flagType: 'love_bombing',
            testScenario: 'npc_overwhelming_early_intensity',
            passingScore: 0.7,
            failureIntervention: 'love_bombing_education_intensive'
          },
          {
            flagType: 'gaslighting',
            testScenario: 'npc_reality_distortion_attempts',
            passingScore: 0.8,
            failureIntervention: 'trust_your_reality_workshop'
          },
          {
            flagType: 'boundary_violation',
            testScenario: 'npc_progressive_boundary_testing',
            passingScore: 0.75,
            failureIntervention: 'boundary_enforcement_bootcamp'
          }
        ],
        manipulationResistanceTests: [
          {
            tacticType: 'future_faking',
            testScenario: 'npc_premature_relationship_promises',
            passingScore: 0.6,
            failureIntervention: 'actions_vs_words_training'
          },
          {
            tacticType: 'breadcrumbing',
            testScenario: 'npc_intermittent_reinforcement_pattern',
            passingScore: 0.7,
            failureIntervention: 'consistency_recognition_training'
          }
        ]
      },
      
      failureScenarioDesign: {
        rejectionScenarios: [
          {
            name: 'polite_but_firm_rejection',
            npcBehavior: 'clear_kind_disinterest',
            userLearningGoal: 'accept_gracefully_without_pursuing',
            expectedFailure: 'attempt_to_convince_or_take_personally',
            coachingInterventions: ['self_worth_reminder', 'reframe_rejection_as_mismatch']
          },
          {
            name: 'slow_fade_rejection',
            npcBehavior: 'gradually_decreasing_responsiveness',
            userLearningGoal: 'recognize_pattern_and_stop_pursuing',
            expectedFailure: 'increase_effort_when_sensing_distance',
            coachingInterventions: ['pattern_recognition', 'outcome_independence']
          }
        ],
        redFlagScenarios: [
          {
            name: 'charming_boundary_tester',
            npcBehavior: 'initial_charm_then_subtle_boundary_violations',
            redFlags: ['dismisses_no', 'pressures_for_personal_info', 'guilt_trips_boundaries'],
            userLearningGoal: 'recognize_manipulation_despite_charm',
            expectedFailure: 'rationalize_red_flags_due_to_charm',
            coachingInterventions: ['trust_gut_over_charm', 'boundary_scripts', 'safety_planning']
          }
        ]
      }
    },

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
    id: 'posie',
    name: 'Posie',
    specialty: 'Body Language & Chemistry',
    personality: 'Grounded, intuitive, and somatically aware. Posie helps users develop authentic physical presence, body awareness, and nervous system regulation.',
    
    // NEW: Performance Integration for Embodied Learning
    performanceIntegration: {
      npcDateAnalytics: {
        trackedMetrics: [
          'nervous_system_regulation_speed',
          'body_language_authenticity',
          'somatic_red_flag_detection',
          'presence_vs_performance_ratio',
          'breathing_pattern_stability',
          'posture_confidence_alignment',
          'micro_expression_congruence',
          'embodied_boundary_maintenance'
        ],
        performanceWeights: {
          nervous_system_regulation_speed: 0.3,  // Core to embodied presence
          somatic_red_flag_detection: 0.25,      // Body wisdom for safety
          body_language_authenticity: 0.2,       // Genuine vs performed presence
          presence_vs_performance_ratio: 0.15,   // Authentic being vs doing
          embodied_boundary_maintenance: 0.1     // Physical boundary enforcement
        },
        failureThresholds: {
          nervous_system_regulation_speed: 0.3,  // Takes too long to self-regulate
          somatic_red_flag_detection: 0.4,       // Missing body-based danger signals
          body_language_authenticity: 0.4,       // Too performative/disconnected
          presence_vs_performance_ratio: 0.35    // Over-performing vs being present
        },
        adaptiveLessonTriggers: [
          {
            condition: 'nervous_system_regulation_speed < 0.3',
            threshold: 0.3,
            adaptiveAction: {
              type: 'intensive_coaching',
              targetLesson: 'nervous_system_regulation_bootcamp',
              coachAssignment: 'posie',
              additionalSupport: ['breathing_exercises', 'grounding_techniques', 'somatic_resources']
            },
            urgency: 'high'
          },
          {
            condition: 'somatic_red_flag_detection < 0.4',
            threshold: 0.4,
            adaptiveAction: {
              type: 'safety_intervention',
              targetLesson: 'body_wisdom_safety_training',
              coachAssignment: 'posie',
              additionalSupport: ['gut_instinct_validation', 'danger_signal_recognition']
            },
            urgency: 'critical'
          }
        ]
      },
      
      inworldAppMetrics: {
        textingPerformance: [
          'stress_response_to_communication_patterns',
          'somatic_awareness_during_digital_interaction',
          'body_based_decision_making_in_texting'
        ],
        emotionalRegulationMarkers: [
          'breathing_pattern_changes_during_stress',
          'physical_tension_during_dating_app_use',
          'nervous_system_activation_from_rejection',
          'somatic_recovery_time_after_difficult_interactions'
        ],
        redFlagRecognitionTests: [
          {
            flagType: 'gut_instinct_about_danger',
            testScenario: 'npc_with_subtle_threatening_energy',
            passingScore: 0.8,
            failureIntervention: 'body_wisdom_trust_training'
          }
        ]
      },
      
      failureScenarioDesign: {
        embodiedScenarios: [
          {
            name: 'high_stress_date_environment',
            npcBehavior: 'creates_pressure_or_uncomfortable_situations',
            userLearningGoal: 'maintain_nervous_system_regulation_under_pressure',
            expectedFailure: 'freeze_fight_flight_or_fawn_response',
            coachingInterventions: ['in_moment_grounding', 'boundary_enforcement', 'safe_exit_strategies']
          }
        ]
      }
    },

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
    id: 'rizzo',
    name: 'Rizzo',
    specialty: 'Confidence & Charisma',
    personality: 'Confident, strategic, and charismatically wise. Rizzo teaches users how to be magnetically confident while maintaining strong ethical boundaries and strategic awareness.',
    
    // NEW: Performance Integration for Strategic Coaching
    performanceIntegration: {
      npcDateAnalytics: {
        trackedMetrics: [
          'social_calibration_accuracy',
          'strategic_restraint_timing',
          'confidence_vs_arrogance_balance',
          'influence_style_ethics',
          'outcome_independence_level',
          'strategic_withdrawal_timing',
          'charisma_authenticity_ratio',
          'power_dynamics_navigation'
        ],
        performanceWeights: {
          strategic_restraint_timing: 0.25,      // Core to Rizzo's teaching
          social_calibration_accuracy: 0.2,      // Reading the room
          confidence_vs_arrogance_balance: 0.2,  // Critical character trait
          outcome_independence_level: 0.15,      // Strategic mindset
          influence_style_ethics: 0.2            // Ethical foundation
        },
        failureThresholds: {
          strategic_restraint_timing: 0.3,       // Over-pursuing patterns
          social_calibration_accuracy: 0.4,      // Missing social cues
          confidence_vs_arrogance_balance: 0.5,  // Becoming arrogant/insecure
          outcome_independence_level: 0.35       // Too attached to results
        },
        adaptiveLessonTriggers: [
          {
            condition: 'strategic_restraint_timing < 0.3 AND social_calibration_accuracy < 0.4',
            threshold: 0.3,
            adaptiveAction: {
              type: 'generate_failure_scenario',
              targetLesson: 'strategic_awareness_intensive',
              coachAssignment: 'rizzo',
              additionalSupport: ['pursuit_pattern_analysis', 'outcome_independence_exercises']
            },
            urgency: 'high'
          },
          {
            condition: 'confidence_vs_arrogance_balance < 0.5',
            threshold: 0.5,
            adaptiveAction: {
              type: 'intensive_coaching',
              targetLesson: 'authentic_confidence_recalibration',
              coachAssignment: 'rizzo',
              additionalSupport: ['humility_exercises', 'empathy_building', 'ego_check_systems']
            },
            urgency: 'medium'
          }
        ]
      },
      
      inworldAppMetrics: {
        textingPerformance: [
          'message_investment_ratio',
          'strategic_pause_utilization',
          'outcome_attachment_in_texting',
          'social_calibration_through_text',
          'confidence_vs_neediness_in_messages'
        ],
        emotionalRegulationMarkers: [
          'anxiety_when_not_immediately_responded_to',
          'desperation_signals_in_pursuit',
          'ego_bruising_from_disinterest',
          'attachment_to_specific_matches'
        ],
        redFlagRecognitionTests: [
          {
            flagType: 'manipulation_attempt_on_user',
            testScenario: 'npc_tries_to_manipulate_user_confidence',
            passingScore: 0.8,
            failureIntervention: 'manipulation_resistance_training'
          }
        ],
        manipulationResistanceTests: [
          {
            tacticType: 'ego_stroking_for_compliance',
            testScenario: 'npc_flatters_to_get_user_to_compromise_boundaries',
            passingScore: 0.75,
            failureIntervention: 'flattery_vs_genuine_compliments_training'
          }
        ]
      },
      
      failureScenarioDesign: {
        strategicScenarios: [
          {
            name: 'low_investment_date',
            npcBehavior: 'minimal_effort_responses_testing_user_pursuit',
            userLearningGoal: 'recognize_low_investment_and_withdraw_strategically',
            expectedFailure: 'increase_effort_to_win_them_over',
            coachingInterventions: ['investment_ratio_analysis', 'dignity_preservation', 'strategic_folding']
          },
          {
            name: 'social_hierarchy_navigation',
            npcBehavior: 'group_setting_with_established_social_dynamics',
            userLearningGoal: 'read_room_and_position_appropriately',
            expectedFailure: 'dominate_conversation_or_fade_into_background',
            coachingInterventions: ['social_calibration', 'strategic_positioning', 'ethical_influence']
          }
        ]
      }
    },

    modules: {
      foundation: [
        {
          id: 'healthy-confidence',
          title: 'Authentic Confidence Without Toxicity',
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

// Performance metrics for tracking user progress
export interface DatingPerformance {
  sessionId: string;
  coachId: string;
  duration: number;
  emotionalRegulation: number;
  conversationFlow: number;
  boundaryRecognition: number;
  authenticity: number;
  confidence: number;
  overallScore: number;
  timestamp: number;
}

export const PERFORMANCE_METRICS = {
  emotional_regulation: {
    name: 'Emotional Regulation',
    description: 'Ability to manage emotions during dating scenarios',
    max_score: 100,
    idealRange: [70, 100]
  },
  conversation_flow: {
    name: 'Conversation Flow',
    description: 'Natural conversation and engagement skills',
    max_score: 100,
    idealRange: [75, 100]
  },
  boundary_recognition: {
    name: 'Boundary Recognition', 
    description: 'Identifying and respecting personal boundaries',
    max_score: 100,
    idealRange: [80, 100]
  },
  authenticity: {
    name: 'Authenticity',
    description: 'Being genuine while remaining attractive',
    max_score: 100,
    idealRange: [70, 95]
  },
  confidence: {
    name: 'Confidence',
    description: 'Self-assured presence without arrogance',
    max_score: 100,
    idealRange: [65, 90]
  }
};
