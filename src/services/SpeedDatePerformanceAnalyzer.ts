// Define local types since they're from different services
export interface TranscriptSegment {
  id: string;
  text: string;
  speaker: 'user' | 'assistant';
  timestamp: string;
  emotion?: any;
}

export interface EmotionData {
  timestamp: number;
  participant: 'user' | 'dougie';
  emotions: Record<string, number>;
  dominantEmotion?: string;
  valence?: number;
  arousal?: number;
}

export interface SpeedDatePerformanceMetrics {
  // Overall scores
  overallEngagement: number; // 0-100
  chemistryScore: number; // 0-100
  confidenceScore: number; // 0-100
  conversationFlowScore: number; // 0-100
  emotionalConnectionScore: number; // 0-100
  
  // Specific metrics
  eyeContactPercentage: number;
  postureScore: number;
  responseTime: number; // Average ms
  speakingTimeRatio: number; // User vs Dougie
  
  // Behavioral indicators
  awkwardSilences: number;
  interruptionCount: number;
  laughterCount: number;
  questionAskedCount: number;
  personalShareCount: number;
  
  // Emotional patterns
  dominantEmotions: string[];
  emotionalVariability: number;
  positiveEmotionRatio: number;
  
  // Areas of improvement
  weakestAreas: PerformanceArea[];
  strengthAreas: PerformanceArea[];
}

export interface PerformanceArea {
  category: 'eye-contact' | 'conversation' | 'confidence' | 'flirting' | 'emotional-connection' | 'body-language';
  score: number;
  details: string;
}

export interface LessonRecommendation {
  coachId: 'grace' | 'rizzo' | 'posie';
  lessonFocus: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  suggestedExercises: string[];
}

export class SpeedDatePerformanceAnalyzer {
  analyzePerformance(
    emotionHistory: EmotionData[],
    transcriptSegments: TranscriptSegment[],
    eyeContactPercentage: number,
    postureScore: number = 0,
    duration: number
  ): SpeedDatePerformanceMetrics {
    const metrics: SpeedDatePerformanceMetrics = {
      overallEngagement: 0,
      chemistryScore: 0,
      confidenceScore: 0,
      conversationFlowScore: 0,
      emotionalConnectionScore: 0,
      eyeContactPercentage,
      postureScore,
      responseTime: this.calculateAverageResponseTime(transcriptSegments),
      speakingTimeRatio: this.calculateSpeakingRatio(transcriptSegments),
      awkwardSilences: this.detectAwkwardSilences(transcriptSegments),
      interruptionCount: this.countInterruptions(transcriptSegments),
      laughterCount: this.countLaughter(transcriptSegments),
      questionAskedCount: this.countQuestions(transcriptSegments),
      personalShareCount: this.countPersonalShares(transcriptSegments),
      dominantEmotions: this.findDominantEmotions(emotionHistory),
      emotionalVariability: this.calculateEmotionalVariability(emotionHistory),
      positiveEmotionRatio: this.calculatePositiveEmotionRatio(emotionHistory),
      weakestAreas: [],
      strengthAreas: []
    };

    // Calculate composite scores
    metrics.overallEngagement = this.calculateOverallEngagement(metrics);
    metrics.chemistryScore = this.calculateChemistryScore(metrics, emotionHistory);
    metrics.confidenceScore = this.calculateConfidenceScore(metrics, emotionHistory);
    metrics.conversationFlowScore = this.calculateConversationFlow(metrics);
    metrics.emotionalConnectionScore = this.calculateEmotionalConnection(metrics, emotionHistory);
    
    // Identify strengths and weaknesses
    const areas = this.identifyPerformanceAreas(metrics);
    metrics.weakestAreas = areas.weakest;
    metrics.strengthAreas = areas.strengths;
    
    return metrics;
  }

  generateLessonRecommendations(metrics: SpeedDatePerformanceMetrics): LessonRecommendation[] {
    const recommendations: LessonRecommendation[] = [];
    
    // Eye contact issues
    if (metrics.eyeContactPercentage < 40) {
      recommendations.push({
        coachId: 'rizzo',
        lessonFocus: 'Building Confidence Through Eye Contact',
        priority: 'high',
        reason: `Your eye contact was only ${metrics.eyeContactPercentage.toFixed(0)}%. Strong eye contact shows confidence and interest.`,
        suggestedExercises: [
          'Eye Contact Meditation Exercise',
          'Mirror Practice Sessions',
          'Progressive Eye Contact Challenges'
        ]
      });
    }
    
    // Conversation flow issues
    if (metrics.conversationFlowScore < 50 || metrics.awkwardSilences > 3) {
      recommendations.push({
        coachId: 'grace',
        lessonFocus: 'Mastering Natural Conversation Flow',
        priority: metrics.awkwardSilences > 5 ? 'high' : 'medium',
        reason: `You had ${metrics.awkwardSilences} awkward silences. Let's work on keeping conversations flowing naturally.`,
        suggestedExercises: [
          'Active Listening Techniques',
          'Open-Ended Question Practice',
          'Story-Telling Frameworks'
        ]
      });
    }
    
    // Low emotional connection
    if (metrics.emotionalConnectionScore < 40 || metrics.personalShareCount < 2) {
      recommendations.push({
        coachId: 'grace',
        lessonFocus: 'Creating Deeper Connections',
        priority: 'medium',
        reason: 'The conversation stayed surface-level. Deep connections come from vulnerability and authentic sharing.',
        suggestedExercises: [
          'Vulnerability Exercises',
          'Personal Story Development',
          'Emotional Intelligence Building'
        ]
      });
    }
    
    // Flirting and chemistry
    if (metrics.chemistryScore < 50 && metrics.laughterCount < 2) {
      recommendations.push({
        coachId: 'posie',
        lessonFocus: 'Building Romantic Chemistry',
        priority: 'medium',
        reason: 'The date lacked playful energy. A little flirtation can create exciting chemistry!',
        suggestedExercises: [
          'Playful Banter Techniques',
          'Compliment Crafting',
          'Body Language Flirting'
        ]
      });
    }
    
    // Confidence issues
    if (metrics.confidenceScore < 50 || metrics.speakingTimeRatio < 0.3) {
      recommendations.push({
        coachId: 'rizzo',
        lessonFocus: 'Owning Your Presence',
        priority: 'high',
        reason: `You spoke only ${(metrics.speakingTimeRatio * 100).toFixed(0)}% of the time. Your voice deserves to be heard!`,
        suggestedExercises: [
          'Assertiveness Training',
          'Voice Projection Exercises',
          'Confidence Posture Practice'
        ]
      });
    }
    
    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  private calculateAverageResponseTime(segments: TranscriptSegment[]): number {
    const responseTimes: number[] = [];
    
    for (let i = 1; i < segments.length; i++) {
      if (segments[i].speaker === 'user' && segments[i-1].speaker === 'assistant') {
        const responseTime = new Date(segments[i].timestamp).getTime() - 
                           new Date(segments[i-1].timestamp).getTime();
        responseTimes.push(responseTime);
      }
    }
    
    return responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;
  }

  private calculateSpeakingRatio(segments: TranscriptSegment[]): number {
    const userWords = segments
      .filter(s => s.speaker === 'user')
      .reduce((sum, s) => sum + s.text.split(' ').length, 0);
    
    const totalWords = segments
      .reduce((sum, s) => sum + s.text.split(' ').length, 0);
    
    return totalWords > 0 ? userWords / totalWords : 0.5;
  }

  private detectAwkwardSilences(segments: TranscriptSegment[]): number {
    let silenceCount = 0;
    const SILENCE_THRESHOLD = 5000; // 5 seconds
    
    for (let i = 1; i < segments.length; i++) {
      const timeDiff = new Date(segments[i].timestamp).getTime() - 
                      new Date(segments[i-1].timestamp).getTime();
      if (timeDiff > SILENCE_THRESHOLD) {
        silenceCount++;
      }
    }
    
    return silenceCount;
  }

  private countInterruptions(segments: TranscriptSegment[]): number {
    // Simple heuristic: rapid speaker changes with short segments
    let interruptions = 0;
    
    for (let i = 1; i < segments.length - 1; i++) {
      if (segments[i].text.length < 20 && 
          segments[i-1].speaker !== segments[i].speaker &&
          segments[i].speaker !== segments[i+1].speaker) {
        interruptions++;
      }
    }
    
    return interruptions;
  }

  private countLaughter(segments: TranscriptSegment[]): number {
    const laughterPatterns = /\b(haha|hehe|lol|laugh|giggl)/i;
    return segments.filter(s => laughterPatterns.test(s.text)).length;
  }

  private countQuestions(segments: TranscriptSegment[]): number {
    return segments
      .filter(s => s.speaker === 'user')
      .filter(s => s.text.includes('?')).length;
  }

  private countPersonalShares(segments: TranscriptSegment[]): number {
    const personalKeywords = /\b(I |me |my |myself|personally|actually)\b/i;
    return segments
      .filter(s => s.speaker === 'user')
      .filter(s => personalKeywords.test(s.text) && s.text.length > 50).length;
  }

  private findDominantEmotions(emotionHistory: EmotionData[]): string[] {
    const emotionCounts: Record<string, number> = {};
    
    emotionHistory.forEach(data => {
      if (data.dominantEmotion) {
        emotionCounts[data.dominantEmotion] = (emotionCounts[data.dominantEmotion] || 0) + 1;
      }
    });
    
    return Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([emotion]) => emotion);
  }

  private calculateEmotionalVariability(emotionHistory: EmotionData[]): number {
    const uniqueEmotions = new Set(emotionHistory.map(e => e.dominantEmotion)).size;
    return Math.min(uniqueEmotions / 7, 1) * 100; // Assuming 7 basic emotions
  }

  private calculatePositiveEmotionRatio(emotionHistory: EmotionData[]): number {
    const positiveEmotions = ['happy', 'excited', 'joy', 'love', 'content'];
    const positiveCount = emotionHistory.filter(e => 
      positiveEmotions.includes(e.dominantEmotion?.toLowerCase() || '')
    ).length;
    
    return emotionHistory.length > 0 ? positiveCount / emotionHistory.length : 0;
  }

  private calculateOverallEngagement(metrics: Partial<SpeedDatePerformanceMetrics>): number {
    const factors = [
      metrics.eyeContactPercentage || 0,
      metrics.speakingTimeRatio ? metrics.speakingTimeRatio * 100 : 50,
      metrics.questionAskedCount ? Math.min(metrics.questionAskedCount * 10, 100) : 0,
      metrics.personalShareCount ? Math.min(metrics.personalShareCount * 20, 100) : 0,
      metrics.awkwardSilences ? Math.max(100 - metrics.awkwardSilences * 10, 0) : 100
    ];
    
    return factors.reduce((a, b) => a + b, 0) / factors.length;
  }

  private calculateChemistryScore(
    metrics: Partial<SpeedDatePerformanceMetrics>, 
    emotionHistory: EmotionData[]
  ): number {
    const factors = [
      metrics.laughterCount ? Math.min(metrics.laughterCount * 15, 100) : 0,
      metrics.positiveEmotionRatio ? metrics.positiveEmotionRatio * 100 : 0,
      metrics.emotionalVariability || 0,
      metrics.eyeContactPercentage || 0
    ];
    
    return factors.reduce((a, b) => a + b, 0) / factors.length;
  }

  private calculateConfidenceScore(
    metrics: Partial<SpeedDatePerformanceMetrics>,
    emotionHistory: EmotionData[]
  ): number {
    const factors = [
      metrics.eyeContactPercentage || 0,
      metrics.speakingTimeRatio ? Math.min(metrics.speakingTimeRatio * 200, 100) : 0,
      metrics.postureScore || 50,
      metrics.responseTime ? Math.max(100 - (metrics.responseTime / 50), 0) : 50
    ];
    
    return factors.reduce((a, b) => a + b, 0) / factors.length;
  }

  private calculateConversationFlow(metrics: Partial<SpeedDatePerformanceMetrics>): number {
    const factors = [
      metrics.awkwardSilences ? Math.max(100 - metrics.awkwardSilences * 15, 0) : 100,
      metrics.questionAskedCount ? Math.min(metrics.questionAskedCount * 10, 100) : 0,
      metrics.speakingTimeRatio ? Math.abs(0.5 - (metrics.speakingTimeRatio || 0.5)) * -200 + 100 : 50,
      metrics.interruptionCount ? Math.max(100 - metrics.interruptionCount * 20, 0) : 100
    ];
    
    return factors.reduce((a, b) => a + b, 0) / factors.length;
  }

  private calculateEmotionalConnection(
    metrics: Partial<SpeedDatePerformanceMetrics>,
    emotionHistory: EmotionData[]
  ): number {
    const factors = [
      metrics.personalShareCount ? Math.min(metrics.personalShareCount * 25, 100) : 0,
      metrics.emotionalVariability || 0,
      metrics.positiveEmotionRatio ? metrics.positiveEmotionRatio * 100 : 0,
      metrics.laughterCount ? Math.min(metrics.laughterCount * 10, 100) : 0
    ];
    
    return factors.reduce((a, b) => a + b, 0) / factors.length;
  }

  private identifyPerformanceAreas(metrics: SpeedDatePerformanceMetrics): {
    weakest: PerformanceArea[];
    strengths: PerformanceArea[];
  } {
    const areas: PerformanceArea[] = [
      {
        category: 'eye-contact',
        score: metrics.eyeContactPercentage,
        details: `${metrics.eyeContactPercentage.toFixed(0)}% eye contact maintained`
      },
      {
        category: 'conversation',
        score: metrics.conversationFlowScore,
        details: `${metrics.awkwardSilences} awkward silences, ${metrics.questionAskedCount} questions asked`
      },
      {
        category: 'confidence',
        score: metrics.confidenceScore,
        details: `${(metrics.speakingTimeRatio * 100).toFixed(0)}% speaking time`
      },
      {
        category: 'emotional-connection',
        score: metrics.emotionalConnectionScore,
        details: `${metrics.personalShareCount} personal shares`
      },
      {
        category: 'flirting',
        score: metrics.chemistryScore,
        details: `${metrics.laughterCount} moments of laughter`
      },
      {
        category: 'body-language',
        score: metrics.postureScore,
        details: `Posture score: ${metrics.postureScore.toFixed(0)}%`
      }
    ];
    
    // Sort by score
    areas.sort((a, b) => a.score - b.score);
    
    return {
      weakest: areas.slice(0, 3),
      strengths: areas.slice(-3).reverse()
    };
  }
}
