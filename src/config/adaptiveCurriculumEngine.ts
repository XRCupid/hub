// Simplified Adaptive Curriculum Engine for Phase 1 Deployment
// Basic performance analysis and lesson recommendations

export interface EmotionPattern {
  type: string;
  intensity: number;
  duration: number;
  triggers: string[];
}

export interface SimplePerformanceData {
  emotionalRegulation: number;
  conversationFlow: number;
  boundaryRecognition: number;
  authenticity: number;
  confidence: number;
  overallScore: number;
}

export interface LessonRecommendation {
  coachId: string;
  lessonType: string;
  priority: number;
  reason: string;
}

export class SimpleAdaptiveCurriculumEngine {
  
  analyzePerformance(data: SimplePerformanceData): LessonRecommendation[] {
    const recommendations: LessonRecommendation[] = [];

    // Emotional regulation check
    if (data.emotionalRegulation < 60) {
      recommendations.push({
        coachId: 'grace',
        lessonType: 'emotional_intelligence',
        priority: 9,
        reason: 'Low emotional regulation score'
      });
    }

    // Conversation flow check
    if (data.conversationFlow < 50) {
      recommendations.push({
        coachId: 'rizzo',
        lessonType: 'conversation',
        priority: 8,
        reason: 'Needs improvement in conversation flow'
      });
    }

    // Boundary recognition check
    if (data.boundaryRecognition < 70) {
      recommendations.push({
        coachId: 'grace',
        lessonType: 'boundaries',
        priority: 10,
        reason: 'Critical boundary recognition issues'
      });
    }

    // Default recommendation if none triggered
    if (recommendations.length === 0) {
      recommendations.push({
        coachId: 'grace',
        lessonType: 'general',
        priority: 5,
        reason: 'General skill improvement'
      });
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  generatePersonalizedLesson(recommendation: LessonRecommendation): any {
    return {
      id: `adaptive-${Date.now()}`,
      title: `Personalized ${recommendation.lessonType} Training`,
      description: recommendation.reason,
      coachId: recommendation.coachId,
      level: 'adaptive',
      duration: 30,
      type: 'adaptive'
    };
  }
}

export const adaptiveCurriculumEngine = new SimpleAdaptiveCurriculumEngine();
