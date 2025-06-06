import { 
  CoachLesson, 
  PracticeScenario, 
  ConversationMetrics, 
  DateSession,
  TextConversation,
  SwipeAction
} from '../types/DatingTypes';
import { COACHES, SCENARIO_PROMPTS } from '../config/coachConfig';

interface PerformanceData {
  conversationMetrics?: ConversationMetrics;
  dateSession?: DateSession;
  textConversation?: TextConversation;
  swipeHistory?: SwipeAction[];
}

interface LessonRecommendation {
  coachId: string;
  lessonType: 'conversation' | 'confidence' | 'flirting' | 'authenticity' | 'boundaries';
  priority: number;
  reason: string;
}

export class CoachLessonGenerator {
  generatePersonalizedLesson(
    performanceData: PerformanceData,
    previousLessons: CoachLesson[] = []
  ): CoachLesson {
    // Analyze performance to determine lesson needs
    const recommendations = this.analyzePerformanceGaps(performanceData);
    const topRecommendation = recommendations[0];
    
    // Select appropriate coach
    const coach = COACHES[topRecommendation.coachId];
    const lessonId = `lesson-${Date.now()}`;
    
    // Generate practice scenarios based on weaknesses
    const scenarios = this.generatePracticeScenarios(
      topRecommendation.lessonType,
      performanceData
    );

    const lesson: CoachLesson = {
      id: lessonId,
      coachId: topRecommendation.coachId,
      title: this.generateLessonTitle(topRecommendation.lessonType),
      description: this.generateLessonDescription(topRecommendation),
      objectives: this.generateLessonObjectives(topRecommendation.lessonType, performanceData),
      estimatedDuration: 15 + scenarios.length * 5, // Base 15 min + 5 min per scenario
      practiceScenarios: scenarios,
      skillsFocused: this.getSkillsForLessonType(topRecommendation.lessonType),
      requiredLevel: this.calculateDifficulty(previousLessons, performanceData) === 'beginner' ? 1 : 
                     this.calculateDifficulty(previousLessons, performanceData) === 'intermediate' ? 2 : 3
    };

    return lesson;
  }

  private analyzePerformanceGaps(data: PerformanceData): LessonRecommendation[] {
    const recommendations: LessonRecommendation[] = [];

    // Analyze conversation metrics
    if (data.conversationMetrics) {
      const metrics = data.conversationMetrics;
      
      if (metrics.engagementScore < 50) {
        recommendations.push({
          coachId: 'grace',
          lessonType: 'conversation',
          priority: 9,
          reason: 'Low engagement in conversations'
        });
      }

      if (metrics.flirtLevel < 30 && data.textConversation && data.textConversation.messages.length > 20) {
        recommendations.push({
          coachId: 'posie',
          lessonType: 'flirting',
          priority: 8,
          reason: 'Conversations lack romantic tension'
        });
      }

      if (metrics.responseTime > 300) { // 5 minutes
        recommendations.push({
          coachId: 'rizzo',
          lessonType: 'confidence',
          priority: 8,
          reason: 'Slow response times suggest overthinking'
        });
      }
    }

    // Analyze date session performance
    if (data.dateSession) {
      const session = data.dateSession;
      
      if (session.overallScore < 60) {
        recommendations.push({
          coachId: 'grace',
          lessonType: 'conversation',
          priority: 9,
          reason: 'Low overall date performance'
        });
      }

      if (session.performanceMetrics.confidence < 50) {
        recommendations.push({
          coachId: 'rizzo',
          lessonType: 'confidence',
          priority: 8,
          reason: 'Poor confidence during date'
        });
      }
    }

    // Analyze texting patterns
    if (data.textConversation) {
      const messages = data.textConversation.messages;
      const userMessages = messages.filter(m => m.senderId === 'user');
      
      // Check for conversation depth
      const avgLength = userMessages.reduce((acc, m) => acc + m.content.length, 0) / userMessages.length;
      if (avgLength < 50) {
        recommendations.push({
          coachId: 'grace',
          lessonType: 'conversation',
          priority: 8,
          reason: 'Messages are too short and lack depth'
        });
      }
    }

    // Analyze swiping behavior
    if (data.swipeHistory && data.swipeHistory.length > 10) {
      const likeRatio = data.swipeHistory.filter(s => s.action !== 'pass').length / data.swipeHistory.length;
      
      if (likeRatio > 0.9 || likeRatio < 0.1) {
        recommendations.push({
          coachId: 'rizzo',
          lessonType: 'authenticity',
          priority: 7,
          reason: 'Swiping patterns suggest lack of genuine selection'
        });
      }
    }

    // Sort by priority
    recommendations.sort((a, b) => b.priority - a.priority);

    // Ensure we always have at least one recommendation
    if (recommendations.length === 0) {
      recommendations.push({
        coachId: 'grace',
        lessonType: 'conversation',
        priority: 8,
        reason: 'General conversation skills improvement'
      });
    }

    return recommendations;
  }

  private generatePracticeScenarios(
    lessonType: string,
    performanceData: PerformanceData
  ): PracticeScenario[] {
    const scenarios: PracticeScenario[] = [];

    switch (lessonType) {
      case 'conversation':
        scenarios.push(
          {
            id: `scenario-${Date.now()}-1`,
            title: 'Opening Message',
            setup: 'You matched with someone who shares your interest in hiking',
            npcPersonalityId: 'adventurous',
            location: 'texting',
            objectives: ['Start with an engaging opener', 'Ask an open-ended question', 'Show genuine interest'],
            successCriteria: [
              { metric: 'conversationFlow', threshold: 70, weight: 0.5 },
              { metric: 'emotionalConnection', threshold: 60, weight: 0.3 },
              { metric: 'humor', threshold: 80, weight: 0.2 }
            ],
            hints: ['Reference their profile', 'Use humor appropriately', 'Listen actively']
          },
          {
            id: `scenario-${Date.now()}-2`,
            title: 'Deep Conversation',
            setup: 'The conversation has been going for 10 messages',
            npcPersonalityId: 'intellectual',
            location: 'texting',
            objectives: ['Transition to deeper topics', 'Share something personal', 'Build connection'],
            successCriteria: [
              { metric: 'emotionalConnection', threshold: 70, weight: 0.4 },
              { metric: 'conversationFlow', threshold: 60, weight: 0.3 },
              { metric: 'humor', threshold: 70, weight: 0.3 }
            ],
            hints: ['Keep it light and fun', 'Read their reactions', 'Build tension slowly']
          }
        );
        break;

      case 'flirting':
        scenarios.push(
          {
            id: `scenario-${Date.now()}-1`,
            title: 'Flirtatious Banter',
            setup: 'You\'ve been texting for a few days and want to increase romantic tension',
            npcPersonalityId: 'playful',
            location: 'texting',
            objectives: ['Use playful teasing', 'Give genuine compliments', 'Create anticipation'],
            successCriteria: [
              { metric: 'emotionalConnection', threshold: 70, weight: 0.4 },
              { metric: 'conversationFlow', threshold: 60, weight: 0.3 },
              { metric: 'humor', threshold: 70, weight: 0.3 }
            ],
            hints: ['Keep it light and fun', 'Read their reactions', 'Build tension slowly']
          },
          {
            id: `scenario-${Date.now()}-2`,
            title: 'Date Planning',
            setup: 'You\'re planning your first date',
            npcPersonalityId: 'romantic',
            location: 'texting',
            objectives: ['Express excitement', 'Be subtly flirtatious', 'Build anticipation'],
            successCriteria: [
              { metric: 'emotionalConnection', threshold: 80, weight: 0.5 },
              { metric: 'conversationFlow', threshold: 70, weight: 0.3 },
              { metric: 'humor', threshold: 70, weight: 0.2 }
            ],
            hints: ['Show enthusiasm', 'Use subtle flirting', 'Create anticipation']
          }
        );
        break;

      case 'confidence':
        scenarios.push(
          {
            id: `scenario-${Date.now()}-1`,
            title: 'Career Discussion',
            setup: 'They asked about your career and achievements',
            npcPersonalityId: 'ambitious',
            location: 'date',
            objectives: ['Share accomplishments humbly', 'Show passion', 'Maintain balance'],
            successCriteria: [
              { metric: 'confidence', threshold: 75, weight: 0.5 },
              { metric: 'conversationFlow', threshold: 70, weight: 0.3 },
              { metric: 'activeListening', threshold: 80, weight: 0.2 }
            ],
            hints: ['Stand tall', 'Speak clearly', 'Make eye contact']
          }
        );
        break;

      case 'authenticity':
        scenarios.push(
          {
            id: `scenario-${Date.now()}-1`,
            title: 'Weekend Plans',
            setup: 'They asked about your weekend plans',
            npcPersonalityId: 'authentic',
            location: 'texting',
            objectives: ['Be honest about interests', 'Show vulnerability', 'Stay attractive'],
            successCriteria: [
              { metric: 'emotionalConnection', threshold: 80, weight: 0.5 },
              { metric: 'authenticity', threshold: 90, weight: 0.3 },
              { metric: 'conversationFlow', threshold: 70, weight: 0.2 }
            ],
            hints: ['Share personal stories', 'Be genuine', 'Connect on values']
          }
        );
        break;
    }

    return scenarios;
  }

  private generateLessonTitle(lessonType: string): string {
    const titles: Record<string, string[]> = {
      conversation: [
        'Mastering the Art of Conversation',
        'From Small Talk to Deep Connection',
        'Engaging Conversations That Captivate'
      ],
      flirting: [
        'The Subtle Art of Flirtation',
        'Building Romantic Tension',
        'Playful Banter Mastery'
      ],
      confidence: [
        'Projecting Authentic Confidence',
        'Own Your Worth',
        'Confidence Without Arrogance'
      ],
      authenticity: [
        'Being Your Best Self',
        'Authentic Attraction',
        'Genuine Connection Building'
      ],
      boundaries: [
        'Setting Healthy Boundaries',
        'Respect and Attraction',
        'The Power of Standards'
      ]
    };

    const typeTitles = titles[lessonType] || titles.conversation;
    return typeTitles[Math.floor(Math.random() * typeTitles.length)];
  }

  private generateLessonDescription(recommendation: LessonRecommendation): string {
    return `Based on your recent ${recommendation.reason.toLowerCase()}, this lesson will help you ${
      recommendation.lessonType === 'conversation' ? 'develop engaging conversation skills' :
      recommendation.lessonType === 'flirting' ? 'add romantic energy to your interactions' :
      recommendation.lessonType === 'confidence' ? 'project authentic confidence' :
      recommendation.lessonType === 'authenticity' ? 'connect genuinely while maintaining attraction' :
      'establish healthy boundaries'
    }. Your coach ${COACHES[recommendation.coachId].name} will guide you through practical exercises.`;
  }

  private generateLessonObjectives(lessonType: string, data: PerformanceData): string[] {
    const baseObjectives: Record<string, string[]> = {
      conversation: [
        'Start conversations with engaging openers',
        'Ask questions that spark meaningful dialogue',
        'Transition smoothly between topics',
        'Show genuine interest and active listening'
      ],
      flirting: [
        'Use playful language appropriately',
        'Give genuine, specific compliments',
        'Create romantic tension through text',
        'Know when to escalate and when to pull back'
      ],
      confidence: [
        'Share achievements without bragging',
        'Handle rejection gracefully',
        'Express opinions with conviction',
        'Maintain self-worth in all interactions'
      ],
      authenticity: [
        'Express your true personality',
        'Share vulnerabilities appropriately',
        'Maintain attraction while being genuine',
        'Build connections based on real compatibility'
      ],
      boundaries: [
        'Communicate your standards clearly',
        'Recognize and respect others\' boundaries',
        'Say no without guilt',
        'Maintain self-respect in dating'
      ]
    };

    let objectives = baseObjectives[lessonType] || baseObjectives.conversation;

    // Add specific objectives based on performance data
    if (data.conversationMetrics) {
      if (data.conversationMetrics.messageLength < 50) {
        objectives.push('Write more detailed, engaging messages');
      }
    }

    return objectives.slice(0, 4); // Return top 4 objectives
  }

  private calculateDifficulty(
    previousLessons: CoachLesson[], 
    performanceData: PerformanceData
  ): 'beginner' | 'intermediate' | 'advanced' {
    const completedLessons = previousLessons.length;
    
    if (completedLessons < 3) return 'beginner';
    if (completedLessons < 10) return 'intermediate';
    
    // Also consider performance metrics
    if (performanceData.conversationMetrics && performanceData.conversationMetrics.engagementScore > 80) {
      return 'advanced';
    }

    return 'intermediate';
  }

  generatePostDateLesson(dateSession: DateSession): CoachLesson {
    // Analyze date performance and create targeted lesson
    const performanceData: PerformanceData = { dateSession };
    return this.generatePersonalizedLesson(performanceData);
  }

  generateWeeklyProgress(
    lessons: CoachLesson[],
    conversations: TextConversation[],
    dates: DateSession[]
  ): {
    summary: string;
    improvements: string[];
    areasToFocus: string[];
    nextSteps: string[];
  } {
    const completedLessons = lessons.length;
    const avgPerformance = dates.reduce((acc, d) => acc + d.overallScore, 0) / dates.length || 0;

    return {
      summary: `This week you completed ${completedLessons} lessons and had ${dates.length} dates with an average performance of ${avgPerformance.toFixed(0)}%.`,
      improvements: [
        'Conversation flow has become more natural',
        'Response times have decreased by 30%',
        'Confidence levels showing steady improvement'
      ],
      areasToFocus: [
        'Continue working on flirtation techniques',
        'Practice vulnerability in deeper conversations',
        'Maintain consistency in your improved communication'
      ],
      nextSteps: [
        'Schedule your next coaching session',
        'Apply learned techniques in upcoming dates',
        'Review and practice weak areas identified'
      ]
    };
  }

  private getSkillsForLessonType(lessonType: string): string[] {
    const skillsMap: Record<string, string[]> = {
      conversation: ['active listening', 'question asking', 'topic transitions'],
      flirting: ['playful banter', 'compliments', 'creating chemistry'],
      confidence: ['body language', 'voice projection', 'self-assurance'],
      authenticity: ['vulnerability', 'genuine expression', 'value alignment'],
      boundaries: ['assertiveness', 'respect', 'clear communication']
    };
    
    return skillsMap[lessonType] || ['general dating skills'];
  }
}

export const coachLessonGenerator = new CoachLessonGenerator();
