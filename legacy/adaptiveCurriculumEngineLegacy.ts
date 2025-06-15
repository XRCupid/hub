// Advanced Adaptive Curriculum Engine
// Analyzes NPC date performance to dynamically generate personalized lessons

// Types for adaptive curriculum engine
export interface EmotionPattern {
  type: string;
  intensity: number;
  duration: number;
  triggers: string[];
}

interface NPCDatePerformance {
  // Inworld Dating App Performance
  textingMetrics: {
    matchToMessageTime: number; // How long before first message
    messageResponseRate: number; // % of messages that get responses
    conversationDepth: number; // Average conversation length
    ghostingRecovery: number; // How they handle being ignored
    breadcrumbingRecognition: number; // Did they catch manipulation
    eagernessControl: number; // Over-investment vs. strategic restraint
    emotionalRegulation: number; // Reaction to slow/no responses
  };
  
  // Video Date Performance  
  videoCallMetrics: {
    rejectionHandling: number; // Grace under rejection pressure
    disinterestRecognition: number; // Catching when date checks out mentally
    redFlagDetection: number; // Spotting toxic/dangerous behavior
    boundaryMaintenance: number; // Standing firm when manipulated
    authenticityLevel: number; // Being genuine vs. performing
    recoveryFromMistakes: number; // Bouncing back from social errors
    endingGracefully: number; // How they conclude unsuccessful dates
  };
  
  // Real-Time Biometric Data
  stressResponse: {
    rejectionStressSpikes: number[];
    emotionalRegulationTime: number; // How long to recover
    anxietyPatterns: EmotionPattern[];
    confidenceDips: number[];
    avoidanceBehaviors: string[];
  };
  
  // Pattern Recognition  
  learningGaps: {
    repeatedMistakes: string[];
    blindSpots: string[];
    overconfidenceAreas: string[];
    underconfidenceAreas: string[];
    manipulationSusceptibility: string[];
  };
}

interface NPCDateScenario {
  difficulty: 'foundation' | 'intermediate' | 'advanced' | 'expert';
  challengeType: 'rejection' | 'disinterest' | 'red_flags' | 'manipulation' | 'mixed';
  npcPersonality: NPCPersonality;
  expectedFailurePoints: string[];
  learningObjectives: string[];
  successCriteria: PerformanceCriteria;
}

interface NPCPersonality {
  // Healthy NPCs
  engaged: boolean;
  authentic: boolean;
  communicative: boolean;
  
  // Challenging but Normal NPCs
  shy: boolean;
  busy: boolean;
  selective: boolean;
  guarded: boolean;
  
  // Red Flag NPCs (for training recognition)
  manipulative: boolean;
  narcissistic: boolean;
  loveBombing: boolean;
  gaslighting: boolean;
  possessive: boolean;
  dishonest: boolean;
  
  // Dangerous NPCs (for safety training)
  aggressive: boolean;
  boundary_violating: boolean;
  coercive: boolean;
  unstable: boolean;
}

class AdaptiveCurriculumEngine {
  
  // CORE ADAPTIVE LOGIC
  generateNextLesson(userId: string, recentPerformance: NPCDatePerformance[]): AdaptiveLessonPlan {
    const failurePatterns = this.analyzeFailurePatterns(recentPerformance);
    const emotionalGaps = this.analyzeEmotionalRegulation(recentPerformance);
    const safetyGaps = this.analyzeSafetyRecognition(recentPerformance);
    
    return {
      coach: this.selectOptimalCoach(failurePatterns),
      lessonType: this.determineUrgentLearningNeed(failurePatterns, emotionalGaps, safetyGaps),
      difficultyAdjustment: this.calculateDifficultyProgression(recentPerformance),
      npcScenarioSetup: this.designTargetedFailureScenario(failurePatterns),
      emotionalSupportLevel: this.calculateSupportNeeds(emotionalGaps),
      safetyFocus: safetyGaps.length > 0 ? 'critical' : 'maintenance'
    };
  }
  
  // FAILURE PATTERN ANALYSIS
  private analyzeFailurePatterns(performance: NPCDatePerformance[]): LearningGap[] {
    const patterns = [];
    
    // Rejection Handling Analysis
    const rejectionScores = performance.map(p => p.videoCallMetrics.rejectionHandling);
    if (this.average(rejectionScores) < 0.4) {
      patterns.push({
        type: 'rejection_resilience',
        severity: 'high',
        coach: 'rizzo', // Confidence building
        evidence: 'User shows high stress response to rejection across multiple scenarios'
      });
    }
    
    // Disinterest Recognition
    const disinterestRecognition = performance.map(p => p.videoCallMetrics.disinterestRecognition);
    if (this.average(disinterestRecognition) < 0.3) {
      patterns.push({
        type: 'social_calibration',
        severity: 'high',
        coach: 'rizzo', // Strategic awareness
        evidence: 'User continues pursuing when NPC shows clear disinterest signals'
      });
    }
    
    // Red Flag Blindness
    const redFlagDetection = performance.map(p => p.videoCallMetrics.redFlagDetection);
    if (this.average(redFlagDetection) < 0.5) {
      patterns.push({
        type: 'safety_awareness',
        severity: 'critical',
        coach: 'grace', // Emotional intelligence for safety
        evidence: 'User missing dangerous personality markers consistently'
      });
    }
    
    // Over-Investment in Texting
    const textingEagerness = performance.map(p => p.textingMetrics.eagernessControl);
    if (this.average(textingEagerness) < 0.4) {
      patterns.push({
        type: 'strategic_restraint',
        severity: 'medium',
        coach: 'rizzo', // Strategic dating
        evidence: 'User over-investing in text conversations before meeting'
      });
    }
    
    // Manipulation Susceptibility
    const breadcrumbingRecognition = performance.map(p => p.textingMetrics.breadcrumbingRecognition);
    if (this.average(breadcrumbingRecognition) < 0.4) {
      patterns.push({
        type: 'manipulation_recognition',
        severity: 'high',
        coach: 'grace', // Emotional intelligence
        evidence: 'User falling for breadcrumbing and false promises'
      });
    }
    
    return patterns;
  }
  
  // EMOTIONAL REGULATION ANALYSIS
  private analyzeEmotionalRegulation(performance: NPCDatePerformance[]): EmotionalGap[] {
    const gaps = [];
    
    const avgRecoveryTime = this.average(
      performance.map(p => p.stressResponse.emotionalRegulationTime)
    );
    
    if (avgRecoveryTime > 300) { // 5+ minutes to recover
      gaps.push({
        type: 'rejection_recovery',
        severity: 'high',
        intervention: 'breathing_exercises',
        coach: 'posie' // Body-based regulation
      });
    }
    
    const stressSpikes = performance.flatMap(p => p.stressResponse.rejectionStressSpikes);
    const avgStressIntensity = this.average(stressSpikes);
    
    if (avgStressIntensity > 0.8) {
      gaps.push({
        type: 'stress_intensity',
        severity: 'high',
        intervention: 'somatic_grounding',
        coach: 'posie' // Embodied regulation
      });
    }
    
    return gaps;
  }
  
  // SAFETY RECOGNITION ANALYSIS
  private analyzeSafetyRecognition(performance: NPCDatePerformance[]): SafetyGap[] {
    const gaps = [];
    
    // Check performance against different red flag types
    const redFlagScenarios = performance.filter(p => 
      p.videoCallMetrics.redFlagDetection !== undefined
    );
    
    for (const scenario of redFlagScenarios) {
      if (scenario.videoCallMetrics.redFlagDetection < 0.5) {
        gaps.push({
          type: 'red_flag_blindness',
          severity: 'critical',
          specificFlags: this.identifyMissedRedFlags(scenario),
          urgentTraining: true
        });
      }
      
      if (scenario.videoCallMetrics.boundaryMaintenance < 0.4) {
        gaps.push({
          type: 'boundary_weakness',
          severity: 'high',
          manipulation_types: this.identifyManipulationVulnerabilities(scenario),
          urgentTraining: true
        });
      }
    }
    
    return gaps;
  }
  
  // NPC SCENARIO DESIGN BASED ON PERFORMANCE
  designTargetedFailureScenario(failurePatterns: LearningGap[]): NPCDateScenario {
    const primaryGap = failurePatterns[0]; // Most critical gap
    
    switch (primaryGap.type) {
      case 'rejection_resilience':
        return {
          difficulty: 'intermediate',
          challengeType: 'rejection',
          npcPersonality: {
            engaged: false,
            polite: true,
            clear_disinterest: true,
            reason: 'not_feeling_chemistry'
          },
          expectedFailurePoints: [
            'user_will_try_to_convince',
            'user_will_take_it_personally',
            'user_will_lose_composure'
          ],
          learningObjectives: [
            'accept_rejection_gracefully',
            'maintain_dignity',
            'end_interaction_positively'
          ]
        };
        
      case 'safety_awareness':
        return {
          difficulty: 'advanced',
          challengeType: 'red_flags',
          npcPersonality: {
            charming: true,
            manipulative: true,
            love_bombing: true,
            boundary_testing: true
          },
          expectedFailurePoints: [
            'user_will_be_flattered_by_intensity',
            'user_will_ignore_boundary_violations',
            'user_will_rationalize_red_flags'
          ],
          learningObjectives: [
            'recognize_love_bombing',
            'maintain_boundaries_under_charm',
            'trust_gut_feelings_over_words'
          ]
        };
        
      case 'manipulation_recognition':
        return {
          difficulty: 'intermediate',
          challengeType: 'manipulation',
          npcPersonality: {
            breadcrumbing: true,
            hot_and_cold: true,
            validation_withholding: true,
            future_faking: true
          },
          expectedFailurePoints: [
            'user_will_chase_inconsistent_attention',
            'user_will_believe_empty_promises',
            'user_will_over_invest_in_hope'
          ],
          learningObjectives: [
            'recognize_breadcrumbing_patterns',
            'value_consistent_treatment',
            'walk_away_from_mixed_signals'
          ]
        };
    }
  }
  
  // DYNAMIC DIFFICULTY ADJUSTMENT
  private calculateDifficultyProgression(performance: NPCDatePerformance[]): DifficultyAdjustment {
    const recentSuccessRate = this.calculateSuccessRate(performance.slice(-5));
    const improvementTrend = this.calculateImprovementTrend(performance);
    const emotionalStability = this.assessEmotionalStability(performance);
    
    if (recentSuccessRate > 0.8 && improvementTrend > 0.2 && emotionalStability > 0.7) {
      return {
        action: 'increase_difficulty',
        amount: 'moderate',
        newChallenges: ['mixed_signals', 'complex_personalities', 'multiple_red_flags']
      };
    }
    
    if (recentSuccessRate < 0.3 || emotionalStability < 0.4) {
      return {
        action: 'decrease_difficulty',
        amount: 'significant',
        supportIncrease: 'high',
        focusAreas: ['emotional_regulation', 'basic_safety', 'self_compassion']
      };
    }
    
    return {
      action: 'maintain',
      amount: 'stable',
      refinement: 'increase_nuance'
    };
  }
}

// INWORLD DATING APP SIMULATION ENGINE
class InworldDatingAppSimulator {
  
  // REALISTIC NPC RESPONSE PATTERNS
  generateNPCResponsePattern(userProfile: UserProfile, npcPersonality: NPCPersonality): ResponsePattern {
    return {
      initialResponse: {
        probability: this.calculateResponseProbability(userProfile, npcPersonality),
        delay: this.calculateResponseDelay(npcPersonality),
        enthusiasm: this.calculateEnthusiasmLevel(userProfile, npcPersonality)
      },
      conversationFlow: {
        messageFrequency: this.designMessageFrequency(npcPersonality),
        lengthPattern: this.designResponseLengths(npcPersonality),
        engagementDecay: this.designEngagementDecay(npcPersonality),
        ghostingProbability: this.calculateGhostingRisk(npcPersonality)
      },
      manipulationTactics: npcPersonality.manipulative ? {
        breadcrumbingPattern: this.designBreadcrumbingBehavior(),
        hotColdCycle: this.designHotColdPattern(),
        validationWithholding: this.designValidationWithholding()
      } : null
    };
  }
  
  // EMOTIONAL REGULATION TRAINING THROUGH TEXTING
  designEmotionalRegulationChallenge(userWeaknesses: string[]): TextingChallenge {
    const challenges = [];
    
    if (userWeaknesses.includes('rejection_sensitivity')) {
      challenges.push({
        type: 'slow_response_training',
        npc_behavior: 'takes 6+ hours to respond',
        learning_objective: 'maintain_composure_during_silence',
        failure_scenario: 'user_double_texts_or_gets_anxious'
      });
    }
    
    if (userWeaknesses.includes('over_investment')) {
      challenges.push({
        type: 'restraint_training',
        npc_behavior: 'gives_minimal_responses',
        learning_objective: 'match_investment_level',
        failure_scenario: 'user_writes_essays_to_short_responses'
      });
    }
    
    if (userWeaknesses.includes('manipulation_vulnerability')) {
      challenges.push({
        type: 'breadcrumb_recognition',
        npc_behavior: 'sporadic_attention_with_false_promises',
        learning_objective: 'recognize_and_exit_manipulation',
        failure_scenario: 'user_stays_hopeful_despite_inconsistency'
      });
    }
    
    return {
      challenges,
      progressionCriteria: 'must_demonstrate_emotional_regulation_for_3_consecutive_scenarios',
      failureConsequences: 'additional_coaching_sessions_before_video_dates'
    };
  }
}

export { AdaptiveCurriculumEngine, InworldDatingAppSimulator };
