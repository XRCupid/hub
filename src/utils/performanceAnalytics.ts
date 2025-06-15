// Performance Analytics - Foundation for Adaptive Curriculum
// Integrates with existing coach sessions and tracks key metrics

interface PerformanceMetrics {
  // Basic metrics that work with existing infrastructure
  conversationFlow: number;        // 0-1 score
  emotionalRegulation: number;     // 0-1 score  
  boundaryRespect: number;         // 0-1 score
  rejectionHandling: number;       // 0-1 score
  confidenceLevel: number;         // 0-1 score
  attachmentAnxiety: number;       // 0-1 score (higher = more anxious)
}

interface SessionAnalytics {
  sessionId: string;
  userId: string;
  coachId: 'grace' | 'posie' | 'rizzo';
  sessionType: 'lesson' | 'npc_date' | 'practice';
  startTime: number;
  endTime: number;
  metrics: PerformanceMetrics;
  criticalEvents: CriticalEvent[];
  improvementAreas: string[];
  strengths: string[];
}

interface CriticalEvent {
  timestamp: number;
  type: 'red_flag_missed' | 'over_pursuit' | 'boundary_violation' | 'rejection_poor_handling' | 'confidence_spike' | 'regulation_success';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: any;
}

class PerformanceAnalytics {
  
  // INTEGRATE WITH EXISTING EMOTION TRACKING
  analyzeCoachSession(
    emotionData: any[], // Your existing emotion tracking data
    conversationData: any[], // Your existing conversation data
    coachId: string,
    sessionDuration: number
  ): SessionAnalytics {
    
    const metrics = this.calculateBaseMetrics(emotionData, conversationData, sessionDuration);
    const criticalEvents = this.identifyCriticalEvents(emotionData, conversationData);
    const areas = this.identifyLearningAreas(metrics, criticalEvents, coachId);
    
    return {
      sessionId: this.generateSessionId(),
      userId: this.getCurrentUserId(),
      coachId: coachId as 'grace' | 'posie' | 'rizzo',
      sessionType: 'lesson',
      startTime: Date.now() - sessionDuration * 1000,
      endTime: Date.now(),
      metrics,
      criticalEvents,
      improvementAreas: areas.improvements,
      strengths: areas.strengths
    };
  }
  
  private calculateBaseMetrics(emotionData: any[], conversationData: any[], duration: number): PerformanceMetrics {
    // Use your existing emotion tracking data
    const avgStress = this.calculateAverageStress(emotionData);
    const stressSpikes = this.countStressSpikes(emotionData);
    const recoveryTime = this.calculateRecoveryTime(emotionData);
    
    return {
      conversationFlow: this.assessConversationFlow(conversationData),
      emotionalRegulation: Math.max(0, 1 - (stressSpikes / 10)), // Fewer spikes = better regulation
      boundaryRespect: 0.8, // Placeholder - will enhance with boundary detection
      rejectionHandling: Math.max(0, 1 - (recoveryTime / 300)), // Faster recovery = better handling
      confidenceLevel: this.assessConfidenceFromPosture(emotionData),
      attachmentAnxiety: Math.min(1, avgStress) // Higher stress = more anxiety
    };
  }
  
  private identifyCriticalEvents(emotionData: any[], conversationData: any[]): CriticalEvent[] {
    const events: CriticalEvent[] = [];
    
    // Detect stress spikes (potential overwhelm or rejection sensitivity)
    emotionData.forEach((dataPoint, index) => {
      if (dataPoint.stress > 0.8 && dataPoint.timestamp) {
        events.push({
          timestamp: dataPoint.timestamp,
          type: 'rejection_poor_handling',
          description: 'High stress response detected',
          severity: dataPoint.stress > 0.9 ? 'high' : 'medium',
          context: { stressLevel: dataPoint.stress }
        });
      }
    });
    
    // Detect confidence patterns
    const confidencePattern = this.analyzeConfidencePattern(emotionData);
    if (confidencePattern.hasSignificantBoost) {
      events.push({
        timestamp: confidencePattern.timestamp,
        type: 'confidence_spike',
        description: 'Significant confidence improvement detected',
        severity: 'low',
        context: { improvement: confidencePattern.improvement }
      });
    }
    
    return events;
  }

  // ADD ALL MISSING HELPER METHODS
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private getCurrentUserId(): string {
    // In production, get from auth system
    return 'user_' + (localStorage.getItem('currentUserId') || 'anonymous');
  }

  private calculateAverageStress(emotionData: any[]): number {
    if (!emotionData || emotionData.length === 0) return 0.3;
    const stressValues = emotionData.map(d => d.stress || d.anxiety || 0.3);
    return stressValues.reduce((sum, val) => sum + val, 0) / stressValues.length;
  }

  private countStressSpikes(emotionData: any[]): number {
    if (!emotionData || emotionData.length === 0) return 0;
    return emotionData.filter(d => (d.stress || 0) > 0.7).length;
  }

  private calculateRecoveryTime(emotionData: any[]): number {
    // Find stress spikes and measure recovery time
    if (!emotionData || emotionData.length === 0) return 60; // Default 1 minute
    
    let maxRecoveryTime = 0;
    let inStressSpike = false;
    let spikeStartTime = 0;
    
    emotionData.forEach(point => {
      const stress = point.stress || 0;
      const timestamp = point.timestamp || Date.now();
      
      if (!inStressSpike && stress > 0.7) {
        inStressSpike = true;
        spikeStartTime = timestamp;
      } else if (inStressSpike && stress < 0.4) {
        const recoveryTime = (timestamp - spikeStartTime) / 1000; // seconds
        maxRecoveryTime = Math.max(maxRecoveryTime, recoveryTime);
        inStressSpike = false;
      }
    });
    
    return maxRecoveryTime || 60;
  }

  private assessConversationFlow(conversationData: any[]): number {
    if (!conversationData || conversationData.length === 0) return 0.5;
    
    // Simple metric: balance of speaking vs listening
    const userMessages = conversationData.filter(msg => msg.role === 'user').length;
    const totalMessages = conversationData.length;
    const userRatio = userMessages / totalMessages;
    
    // Ideal ratio is around 0.4-0.6 (user speaks 40-60% of time)
    return Math.max(0, 1 - Math.abs(userRatio - 0.5) * 2);
  }

  private assessConfidenceFromPosture(emotionData: any[]): number {
    if (!emotionData || emotionData.length === 0) return 0.5;
    
    // Look for confidence indicators in emotion data
    const confidenceValues = emotionData.map(d => 
      (d.confidence || d.posture?.upright || d.eye_contact || 0.5)
    );
    
    return confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;
  }

  private analyzeConfidencePattern(emotionData: any[]): { hasSignificantBoost: boolean; timestamp: number; improvement: number } {
    if (!emotionData || emotionData.length < 2) {
      return { hasSignificantBoost: false, timestamp: Date.now(), improvement: 0 };
    }
    
    const startConfidence = emotionData[0].confidence || 0.5;
    const endConfidence = emotionData[emotionData.length - 1].confidence || 0.5;
    const improvement = endConfidence - startConfidence;
    
    return {
      hasSignificantBoost: improvement > 0.2,
      timestamp: emotionData[emotionData.length - 1].timestamp || Date.now(),
      improvement
    };
  }

  private identifyLearningAreas(metrics: PerformanceMetrics, events: CriticalEvent[], coachId: string): { improvements: string[]; strengths: string[] } {
    const improvements: string[] = [];
    const strengths: string[] = [];
    
    // Identify improvement areas
    if (metrics.emotionalRegulation < 0.5) {
      improvements.push('emotional_regulation');
    }
    if (metrics.rejectionHandling < 0.4) {
      improvements.push('rejection_resilience');
    }
    if (metrics.conversationFlow < 0.4) {
      improvements.push('conversation_balance');
    }
    if (metrics.attachmentAnxiety > 0.7) {
      improvements.push('attachment_security');
    }
    
    // Identify strengths
    if (metrics.confidenceLevel > 0.7) {
      strengths.push('natural_confidence');
    }
    if (metrics.boundaryRespect > 0.8) {
      strengths.push('respectful_communication');
    }
    if (metrics.conversationFlow > 0.7) {
      strengths.push('balanced_conversation');
    }
    
    return { improvements, strengths };
  }
  
  // ADAPTIVE LESSON RECOMMENDATION ENGINE
  recommendNextLesson(userHistory: SessionAnalytics[]): LessonRecommendation {
    const recentPerformance = userHistory.slice(-5); // Last 5 sessions
    const weakestAreas = this.identifyWeakestAreas(recentPerformance);
    const urgentIssues = this.identifyUrgentIssues(recentPerformance);
    
    if (urgentIssues.length > 0) {
      return this.createUrgentIntervention(urgentIssues[0]);
    }
    
    // Safety check: ensure we have weakest areas
    if (weakestAreas.length === 0) {
      // Return default lesson if no specific weaknesses identified
      return {
        lessonId: 'general_confidence_building',
        coachId: 'grace',
        urgency: 'normal',
        focusAreas: ['self_confidence', 'social_skills', 'personal_growth'],
        estimatedDuration: 30,
        prerequisiteCheck: true
      };
    }
    
    return this.createTargetedLesson(weakestAreas[0]);
  }
  
  private identifyWeakestAreas(sessions: SessionAnalytics[]): WeaknessArea[] {
    const averageMetrics = this.calculateAverageMetrics(sessions);
    const areas: WeaknessArea[] = [];
    
    if (averageMetrics.emotionalRegulation < 0.4) {
      areas.push({
        area: 'emotional_regulation',
        severity: 'high',
        coach: 'grace',
        priority: 9
      });
    }
    
    if (averageMetrics.rejectionHandling < 0.3) {
      areas.push({
        area: 'rejection_resilience',
        severity: 'critical',
        coach: 'rizzo',
        priority: 10
      });
    }
    
    if (averageMetrics.attachmentAnxiety > 0.7) {
      areas.push({
        area: 'attachment_security',
        severity: 'medium',
        coach: 'grace',
        priority: 7
      });
    }
    
    return areas.sort((a, b) => b.priority - a.priority);
  }

  private calculateAverageMetrics(sessions: SessionAnalytics[]): PerformanceMetrics {
    if (!sessions || sessions.length === 0) {
      return {
        conversationFlow: 0.5,
        emotionalRegulation: 0.5,
        boundaryRespect: 0.5,
        rejectionHandling: 0.5,
        confidenceLevel: 0.5,
        attachmentAnxiety: 0.5
      };
    }
    
    const metricKeys: (keyof PerformanceMetrics)[] = [
      'conversationFlow', 'emotionalRegulation', 'boundaryRespect', 
      'rejectionHandling', 'confidenceLevel', 'attachmentAnxiety'
    ];
    
    const averages: Partial<PerformanceMetrics> = {};
    
    metricKeys.forEach(key => {
      const values = sessions.map(s => s.metrics[key]).filter(v => v !== undefined);
      averages[key] = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0.5;
    });
    
    return averages as PerformanceMetrics;
  }

  private identifyUrgentIssues(sessions: SessionAnalytics[]): string[] {
    const urgentIssues: string[] = [];
    
    sessions.forEach(session => {
      // Check for critical events
      const criticalEvents = session.criticalEvents.filter(e => e.severity === 'critical' || e.severity === 'high');
      if (criticalEvents.length > 0) {
        urgentIssues.push('safety_concern');
      }
      
      // Check for very poor performance
      if (session.metrics.rejectionHandling < 0.2) {
        urgentIssues.push('rejection_crisis');
      }
      if (session.metrics.emotionalRegulation < 0.2) {
        urgentIssues.push('emotional_dysregulation');
      }
    });
    
    return [...new Set(urgentIssues)]; // Remove duplicates
  }

  private createUrgentIntervention(issue: string): LessonRecommendation {
    const interventions: { [key: string]: LessonRecommendation } = {
      safety_concern: {
        lessonId: 'urgent_safety_intervention',
        coachId: 'grace',
        urgency: 'critical',
        focusAreas: ['safety_awareness', 'boundary_enforcement', 'red_flag_recognition'],
        estimatedDuration: 30,
        prerequisiteCheck: false
      },
      rejection_crisis: {
        lessonId: 'rejection_resilience_intensive',
        coachId: 'rizzo',
        urgency: 'critical',
        focusAreas: ['rejection_handling', 'self_worth', 'outcome_independence'],
        estimatedDuration: 45,
        prerequisiteCheck: false
      },
      emotional_dysregulation: {
        lessonId: 'emotional_regulation_bootcamp',
        coachId: 'posie',
        urgency: 'high',
        focusAreas: ['breathing_techniques', 'nervous_system_regulation', 'grounding'],
        estimatedDuration: 25,
        prerequisiteCheck: false
      }
    };
    
    return interventions[issue] || this.createTargetedLesson({ area: 'general_improvement', severity: 'medium', coach: 'grace', priority: 5 });
  }

  private createTargetedLesson(weakness: WeaknessArea): LessonRecommendation {
    // Safety check for undefined weakness
    if (!weakness || !weakness.area) {
      return {
        lessonId: 'general_confidence_building',
        coachId: 'grace',
        urgency: 'normal',
        focusAreas: ['self_confidence', 'social_skills', 'personal_growth'],
        estimatedDuration: 30,
        prerequisiteCheck: true
      };
    }

    const lessonMap: { [key: string]: LessonRecommendation } = {
      emotional_regulation: {
        lessonId: 'emotional_intelligence_foundation',
        coachId: 'grace',
        urgency: 'high',
        focusAreas: ['emotional_awareness', 'regulation_techniques', 'self_compassion'],
        estimatedDuration: 35,
        prerequisiteCheck: true
      },
      rejection_resilience: {
        lessonId: 'handling_rejection_gracefully',
        coachId: 'rizzo',
        urgency: 'high',
        focusAreas: ['reframing_rejection', 'maintaining_dignity', 'moving_forward'],
        estimatedDuration: 40,
        prerequisiteCheck: true
      },
      attachment_security: {
        lessonId: 'secure_attachment_building',
        coachId: 'grace',
        urgency: 'normal',
        focusAreas: ['attachment_styles', 'anxiety_management', 'secure_relating'],
        estimatedDuration: 45,
        prerequisiteCheck: true
      }
    };
    
    return lessonMap[weakness.area] || {
      lessonId: 'general_confidence_building',
      coachId: 'rizzo',
      urgency: 'normal',
      focusAreas: ['self_confidence', 'social_skills', 'personal_growth'],
      estimatedDuration: 30,
      prerequisiteCheck: true
    };
  }

  private assessCurrentLevel(userHistory: SessionAnalytics[]): 'foundation' | 'intermediate' | 'advanced' {
    if (!userHistory || userHistory.length < 3) return 'foundation';
    
    const recentMetrics = this.calculateAverageMetrics(userHistory.slice(-5));
    const overallScore = (
      recentMetrics.conversationFlow + 
      recentMetrics.emotionalRegulation + 
      recentMetrics.rejectionHandling + 
      recentMetrics.confidenceLevel
    ) / 4;
    
    if (overallScore >= 0.8) return 'advanced';
    if (overallScore >= 0.6) return 'intermediate';
    return 'foundation';
  }

  private assessAdvancedReadiness(userHistory: SessionAnalytics[]): boolean {
    return this.assessCurrentLevel(userHistory) === 'advanced';
  }

  private identifySkillGaps(userHistory: SessionAnalytics[]): string[] {
    const averageMetrics = this.calculateAverageMetrics(userHistory);
    const gaps: string[] = [];
    
    if (averageMetrics.conversationFlow < 0.6) gaps.push('conversation_balance');
    if (averageMetrics.emotionalRegulation < 0.6) gaps.push('emotional_regulation');
    if (averageMetrics.rejectionHandling < 0.6) gaps.push('rejection_resilience');
    if (averageMetrics.confidenceLevel < 0.6) gaps.push('confidence_building');
    if (averageMetrics.attachmentAnxiety > 0.6) gaps.push('attachment_security');
    
    return gaps;
  }
  
  // INTEGRATION HELPERS FOR EXISTING CODEBASE
  
  // Call this from your existing CoachSession component
  trackSessionPerformance(sessionData: any) {
    const analytics = this.analyzeCoachSession(
      sessionData.emotionData,
      sessionData.conversationData,
      sessionData.coachId,
      sessionData.duration
    );
    
    this.saveAnalytics(analytics);
    return analytics;
  }
  
  // Call this to get next lesson recommendation
  getAdaptiveLessonPlan(userId: string): LessonPlan {
    const userHistory = this.getUserHistory(userId);
    const recommendation = this.recommendNextLesson(userHistory);
    
    return {
      nextLesson: recommendation,
      currentLevel: this.assessCurrentLevel(userHistory),
      readinessForAdvanced: this.assessAdvancedReadiness(userHistory),
      criticalSkillGaps: this.identifySkillGaps(userHistory)
    };
  }
  
  private saveAnalytics(analytics: SessionAnalytics) {
    // Save to your existing database/storage system
    localStorage.setItem(`session_${analytics.sessionId}`, JSON.stringify(analytics));
    
    // Also save to user history
    const userHistory = this.getUserHistory(analytics.userId);
    userHistory.push(analytics);
    localStorage.setItem(`user_history_${analytics.userId}`, JSON.stringify(userHistory));
  }
  
  // MAKE PUBLIC FOR EXTERNAL ACCESS
  getUserHistory(userId: string): SessionAnalytics[] {
    const stored = localStorage.getItem(`user_history_${userId}`);
    return stored ? JSON.parse(stored) : [];
  }
}

// TYPES FOR INTEGRATION
interface WeaknessArea {
  area: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  coach: 'grace' | 'posie' | 'rizzo';
  priority: number;
}

interface LessonRecommendation {
  lessonId: string;
  coachId: string;
  urgency: 'normal' | 'high' | 'critical';
  focusAreas: string[];
  estimatedDuration: number;
  prerequisiteCheck: boolean;
}

interface LessonPlan {
  nextLesson: LessonRecommendation;
  currentLevel: 'foundation' | 'intermediate' | 'advanced';
  readinessForAdvanced: boolean;
  criticalSkillGaps: string[];
}

export { PerformanceAnalytics, type SessionAnalytics, type PerformanceMetrics, type LessonPlan };
