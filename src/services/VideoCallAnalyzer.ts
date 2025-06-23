import { EmotionScore, PostureScore, TranscriptEntry, AnalyticsSnapshot } from '../types/VideoCallTypes';

export interface CallAnalytics {
  timestamp: number;
  userEmotions: EmotionScore[];
  partnerEmotions: EmotionScore[];
  userPosture: PostureScore;
  partnerPosture: PostureScore;
  userEyeContact: boolean;
  partnerEyeContact: boolean;
  userSpeaking: boolean;
  partnerSpeaking: boolean;
  userVolume: number;
  partnerVolume: number;
  transcript?: TranscriptEntry;
}

export interface PerformanceMetrics {
  avgEyeContact: number;
  avgPosture: number;
  emotionalRange: number;
  emotionalVariability: number;
  speakingRatio: number;
  engagementScore: number;
  dominantEmotions: EmotionScore[];
  strengthAreas: string[];
  improvementAreas: string[];
  turnTaking: number;
  interruptionCount: number;
  silenceDuration: number;
  laughterCount: number;
  questionCount: number;
}

export interface CallReport {
  callId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  analytics: CallAnalytics[];
  transcript: TranscriptEntry[];
  userMetrics: PerformanceMetrics;
  partnerMetrics: PerformanceMetrics;
  overallChemistry: number;
  conversationFlow: number;
  emotionalSynchrony: number;
  recommendations: Recommendation[];
  aiSummary: {
    joint: string;
    forUser: string;
    forPartner: string;
  };
}

export interface Recommendation {
  id: string;
  category: 'eye-contact' | 'posture' | 'emotion' | 'engagement' | 'conversation' | 'confidence';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggestedLesson: string;
  coach: 'Grace' | 'Rizzo' | 'Posie';
  estimatedDuration: number;
  keyExercises: string[];
}

export class VideoCallAnalyzer {
  private analytics: CallAnalytics[] = [];
  private transcriptEntries: TranscriptEntry[] = [];
  private startTime: Date | null = null;
  private callId: string;

  constructor() {
    this.callId = this.generateCallId();
  }

  private generateCallId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  startCall() {
    this.startTime = new Date();
    this.analytics = [];
    this.transcriptEntries = [];
  }

  addAnalyticsSnapshot(snapshot: AnalyticsSnapshot) {
    this.analytics.push(snapshot);
  }

  addTranscriptEntry(entry: TranscriptEntry) {
    this.transcriptEntries.push(entry);
  }

  calculatePerformanceMetrics(
    data: CallAnalytics[], 
    participant: 'user' | 'partner'
  ): PerformanceMetrics {
    if (data.length === 0) {
      return this.getDefaultMetrics();
    }

    // Eye contact calculation
    const eyeContactData = data.map(d => 
      participant === 'user' ? d.userEyeContact : d.partnerEyeContact
    );
    const avgEyeContact = eyeContactData.filter(Boolean).length / eyeContactData.length;

    // Posture calculation
    const postureData = data.map(d => 
      participant === 'user' ? d.userPosture.overall : d.partnerPosture.overall
    );
    const avgPosture = postureData.reduce((a, b) => a + b, 0) / postureData.length;

    // Emotion analysis
    const emotionData = data.map(d => 
      participant === 'user' ? d.userEmotions : d.partnerEmotions
    ).flat();
    
    const emotionCounts = this.countEmotions(emotionData);
    const dominantEmotions = this.getDominantEmotions(emotionCounts);
    const emotionalRange = Object.keys(emotionCounts).length / 50; // Normalized by total possible emotions
    const emotionalVariability = this.calculateEmotionalVariability(data, participant);

    // Speaking analysis
    const speakingData = data.map(d => 
      participant === 'user' ? d.userSpeaking : d.partnerSpeaking
    );
    const speakingRatio = speakingData.filter(Boolean).length / speakingData.length;

    // Engagement calculation
    const engagementScore = this.calculateEngagement({
      avgEyeContact,
      avgPosture,
      emotionalRange,
      speakingRatio
    });

    // Turn taking and interruptions
    let turnTaking = 0;
    let interruptionCount = 0;
    let lastSpeaker: 'user' | 'partner' | null = null;
    this.transcriptEntries.forEach((entry, index) => {
      const currentSpeaker = entry.speaker === 'user' ? 'user' : 'partner';
      if (lastSpeaker && lastSpeaker !== currentSpeaker) {
        turnTaking++;
      }
      lastSpeaker = currentSpeaker;
    });

    // Silence analysis
    const silenceDuration = this.calculateSilenceDuration(data);

    // Laughter and questions
    const laughterCount = this.countLaughter(emotionData);
    const questionCount = this.countQuestions(participant);

    // Determine strengths and improvements
    const { strengthAreas, improvementAreas } = this.determineAreasOfFocus({
      avgEyeContact,
      avgPosture,
      emotionalRange,
      speakingRatio,
      engagementScore,
      turnTaking
    });

    return {
      avgEyeContact,
      avgPosture,
      emotionalRange,
      emotionalVariability,
      speakingRatio,
      engagementScore,
      dominantEmotions,
      strengthAreas,
      improvementAreas,
      turnTaking,
      interruptionCount,
      silenceDuration,
      laughterCount,
      questionCount
    };
  }

  private getDefaultMetrics(): PerformanceMetrics {
    return {
      avgEyeContact: 0,
      avgPosture: 0,
      emotionalRange: 0,
      emotionalVariability: 0,
      speakingRatio: 0,
      engagementScore: 0,
      dominantEmotions: [],
      strengthAreas: [],
      improvementAreas: [],
      turnTaking: 0,
      interruptionCount: 0,
      silenceDuration: 0,
      laughterCount: 0,
      questionCount: 0
    };
  }

  private countEmotions(emotions: EmotionScore[]): Record<string, number> {
    const counts: Record<string, number> = {};
    emotions.forEach(emotion => {
      const name = emotion.name || 'neutral';
      counts[name] = (counts[name] || 0) + 1;
    });
    return counts;
  }

  private getDominantEmotions(counts: Record<string, number>): EmotionScore[] {
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        score: count / Object.values(counts).reduce((a, b) => a + b, 0)
      }));
  }

  private calculateEmotionalVariability(data: CallAnalytics[], participant: 'user' | 'partner'): number {
    const emotions = data.map(d => 
      participant === 'user' ? d.userEmotions[0]?.name : d.partnerEmotions[0]?.name
    ).filter(Boolean);
    
    let changes = 0;
    for (let i = 1; i < emotions.length; i++) {
      if (emotions[i] !== emotions[i - 1]) changes++;
    }
    
    return emotions.length > 1 ? changes / (emotions.length - 1) : 0;
  }

  private calculateEngagement(metrics: {
    avgEyeContact: number;
    avgPosture: number;
    emotionalRange: number;
    speakingRatio: number;
  }): number {
    const weights = {
      eyeContact: 0.3,
      posture: 0.2,
      emotion: 0.25,
      speaking: 0.25
    };

    return (
      metrics.avgEyeContact * weights.eyeContact +
      metrics.avgPosture * weights.posture +
      metrics.emotionalRange * weights.emotion +
      metrics.speakingRatio * weights.speaking
    );
  }

  private calculateSilenceDuration(data: CallAnalytics[]): number {
    const silentSnapshots = data.filter(d => !d.userSpeaking && !d.partnerSpeaking);
    return (silentSnapshots.length / data.length) * 100; // Percentage
  }

  private countLaughter(emotions: EmotionScore[]): number {
    return emotions.filter(e => 
      e.name === 'joy' || e.name === 'amusement' || e.name === 'excitement'
    ).length;
  }

  private countQuestions(participant: 'user' | 'partner'): number {
    return this.transcriptEntries.filter(t => 
      t.speaker === participant && t.text.includes('?')
    ).length;
  }

  private determineAreasOfFocus(metrics: any): { strengthAreas: string[]; improvementAreas: string[] } {
    const strengthAreas: string[] = [];
    const improvementAreas: string[] = [];

    // Eye contact
    if (metrics.avgEyeContact > 0.7) {
      strengthAreas.push('Excellent eye contact maintenance');
    } else if (metrics.avgEyeContact < 0.4) {
      improvementAreas.push('Increase eye contact for better connection');
    }

    // Posture
    if (metrics.avgPosture > 0.8) {
      strengthAreas.push('Confident and open body language');
    } else if (metrics.avgPosture < 0.5) {
      improvementAreas.push('Improve posture for better presence');
    }

    // Emotional expression
    if (metrics.emotionalRange > 0.6) {
      strengthAreas.push('Rich emotional expression');
    } else if (metrics.emotionalRange < 0.3) {
      improvementAreas.push('Express emotions more openly');
    }

    // Speaking balance
    if (metrics.speakingRatio > 0.3 && metrics.speakingRatio < 0.6) {
      strengthAreas.push('Balanced conversation participation');
    } else if (metrics.speakingRatio < 0.2) {
      improvementAreas.push('Speak up more in conversations');
    } else if (metrics.speakingRatio > 0.7) {
      improvementAreas.push('Give your partner more space to speak');
    }

    // Turn taking
    if (metrics.turnTaking > 2 && metrics.turnTaking < 5) {
      strengthAreas.push('Natural conversation flow');
    } else if (metrics.turnTaking < 1) {
      improvementAreas.push('Practice more dynamic exchanges');
    }

    return { strengthAreas, improvementAreas };
  }

  calculateChemistry(userMetrics: PerformanceMetrics, partnerMetrics: PerformanceMetrics): number {
    // Chemistry based on synchrony and balance
    const factors = {
      emotionalSynchrony: this.calculateEmotionalSynchrony(),
      speakingBalance: 1 - Math.abs(userMetrics.speakingRatio - partnerMetrics.speakingRatio),
      engagementMatch: 1 - Math.abs(userMetrics.engagementScore - partnerMetrics.engagementScore),
      eyeContactSynchrony: Math.min(userMetrics.avgEyeContact, partnerMetrics.avgEyeContact),
      laughterShared: Math.min(userMetrics.laughterCount, partnerMetrics.laughterCount) / 10
    };

    const weights = {
      emotionalSynchrony: 0.3,
      speakingBalance: 0.2,
      engagementMatch: 0.2,
      eyeContactSynchrony: 0.2,
      laughterShared: 0.1
    };

    return Object.entries(factors).reduce((sum, [key, value]) => 
      sum + value * weights[key as keyof typeof weights], 0
    );
  }

  private calculateEmotionalSynchrony(): number {
    let synchronizedMoments = 0;
    let totalMoments = 0;

    this.analytics.forEach(snapshot => {
      if (snapshot.userEmotions[0] && snapshot.partnerEmotions[0]) {
        totalMoments++;
        if (snapshot.userEmotions[0].name === snapshot.partnerEmotions[0].name) {
          synchronizedMoments++;
        }
      }
    });

    return totalMoments > 0 ? synchronizedMoments / totalMoments : 0;
  }

  calculateConversationFlow(): number {
    // Analyze smoothness of conversation
    let flowScore = 1;
    
    // Penalize long silences
    const silenceRatio = this.analytics.filter(d => !d.userSpeaking && !d.partnerSpeaking).length / this.analytics.length;
    flowScore -= silenceRatio * 0.5;

    // Penalize interruptions
    const interruptions = this.analytics.filter(d => d.userSpeaking && d.partnerSpeaking).length;
    flowScore -= (interruptions / this.analytics.length) * 0.3;

    // Reward turn taking
    let turns = 0;
    let lastSpeaker = null;
    this.analytics.forEach(d => {
      const speaker = d.userSpeaking ? 'user' : d.partnerSpeaking ? 'partner' : null;
      if (speaker && speaker !== lastSpeaker) {
        turns++;
        lastSpeaker = speaker;
      }
    });
    
    const idealTurnRate = 0.02; // Ideal turn every 50 snapshots
    const actualTurnRate = turns / this.analytics.length;
    flowScore += (1 - Math.abs(actualTurnRate - idealTurnRate) * 10) * 0.2;

    return Math.max(0, Math.min(1, flowScore));
  }

  generateRecommendations(
    userMetrics: PerformanceMetrics, 
    partnerMetrics: PerformanceMetrics
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Eye contact recommendations
    if (userMetrics.avgEyeContact < 0.5) {
      recommendations.push({
        id: 'rec_eye_contact',
        category: 'eye-contact',
        priority: 'high',
        title: 'Improve Eye Contact',
        description: 'Your eye contact was below optimal levels. Maintaining eye contact shows confidence and creates deeper connection.',
        suggestedLesson: 'Eye Contact Mastery',
        coach: 'Rizzo',
        estimatedDuration: 15,
        keyExercises: [
          'Eye contact meditation',
          'Mirror practice sessions',
          'Progressive eye contact challenges'
        ]
      });
    }

    // Posture recommendations
    if (userMetrics.avgPosture < 0.6) {
      recommendations.push({
        id: 'rec_posture',
        category: 'posture',
        priority: 'medium',
        title: 'Enhance Body Language',
        description: 'Your posture could be more open and confident. Good posture projects confidence and approachability.',
        suggestedLesson: 'Power Posture Training',
        coach: 'Rizzo',
        estimatedDuration: 20,
        keyExercises: [
          'Power pose practice',
          'Body scan awareness',
          'Open gesture training'
        ]
      });
    }

    // Emotional expression
    if (userMetrics.emotionalRange < 0.4) {
      recommendations.push({
        id: 'rec_emotion',
        category: 'emotion',
        priority: 'medium',
        title: 'Express Emotions More Freely',
        description: 'You showed limited emotional range. Expressing emotions creates authentic connections.',
        suggestedLesson: 'Emotional Expression Workshop',
        coach: 'Grace',
        estimatedDuration: 25,
        keyExercises: [
          'Emotion identification',
          'Expression practice',
          'Vulnerability exercises'
        ]
      });
    }

    // Conversation balance
    if (userMetrics.speakingRatio < 0.3 || userMetrics.speakingRatio > 0.7) {
      const tooMuch = userMetrics.speakingRatio > 0.7;
      recommendations.push({
        id: 'rec_conversation',
        category: 'conversation',
        priority: 'high',
        title: tooMuch ? 'Practice Active Listening' : 'Speak Up More',
        description: tooMuch 
          ? 'You dominated the conversation. Great connections require balanced dialogue.'
          : 'You spoke very little. Sharing your thoughts is essential for connection.',
        suggestedLesson: tooMuch ? 'Active Listening Mastery' : 'Confident Communication',
        coach: 'Grace',
        estimatedDuration: 30,
        keyExercises: tooMuch ? [
          'Listening meditation',
          'Question asking practice',
          'Pause training'
        ] : [
          'Story telling practice',
          'Opinion sharing exercises',
          'Spontaneous speaking drills'
        ]
      });
    }

    // Chemistry-based recommendations
    const chemistry = this.calculateChemistry(userMetrics, partnerMetrics);
    if (chemistry < 0.5) {
      recommendations.push({
        id: 'rec_chemistry',
        category: 'engagement',
        priority: 'low',
        title: 'Build Better Chemistry',
        description: 'The overall chemistry could be improved. Focus on creating genuine moments of connection.',
        suggestedLesson: 'Chemistry & Attraction',
        coach: 'Posie',
        estimatedDuration: 35,
        keyExercises: [
          'Playful banter practice',
          'Compliment giving',
          'Creating emotional moments'
        ]
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  async generateAISummary(
    userMetrics: PerformanceMetrics,
    partnerMetrics: PerformanceMetrics,
    chemistry: number
  ): Promise<{ joint: string; forUser: string; forPartner: string }> {
    // In a real implementation, this would call an AI service
    // For now, we'll generate template-based summaries

    const joint = this.generateJointSummary(userMetrics, partnerMetrics, chemistry);
    const forUser = this.generateUserSummary(userMetrics, chemistry);
    const forPartner = this.generatePartnerSummary(partnerMetrics, chemistry);

    return { joint, forUser, forPartner };
  }

  private generateJointSummary(
    userMetrics: PerformanceMetrics, 
    partnerMetrics: PerformanceMetrics, 
    chemistry: number
  ): string {
    const chemistryLevel = chemistry > 0.8 ? 'exceptional' : chemistry > 0.6 ? 'strong' : chemistry > 0.4 ? 'moderate' : 'developing';
    const conversationBalance = Math.abs(userMetrics.speakingRatio - 0.5) < 0.2 && Math.abs(partnerMetrics.speakingRatio - 0.5) < 0.2 ? 'balanced' : 'imbalanced';
    
    return `This conversation showed ${chemistryLevel} chemistry between participants. The dialogue was ${conversationBalance}, ` +
      `with both parties demonstrating ${userMetrics.engagementScore > 0.7 && partnerMetrics.engagementScore > 0.7 ? 'high' : 'moderate'} engagement. ` +
      `Key emotional moments included ${userMetrics.dominantEmotions[0]?.name || 'neutral'} and ${partnerMetrics.dominantEmotions[0]?.name || 'neutral'} expressions. ` +
      `The interaction featured ${userMetrics.laughterCount + partnerMetrics.laughterCount} moments of shared joy and ${userMetrics.questionCount + partnerMetrics.questionCount} questions exchanged. ` +
      `Overall, this was a ${chemistry > 0.6 ? 'successful' : 'developing'} interaction with ${chemistry > 0.6 ? 'strong potential for' : 'opportunities to build'} deeper connection.`;
  }

  private generateUserSummary(userMetrics: PerformanceMetrics, chemistry: number): string {
    const strengths = userMetrics.strengthAreas.slice(0, 2).join(' and ') || 'consistent engagement';
    const improvements = userMetrics.improvementAreas[0] || 'maintaining energy throughout';
    
    return `Your performance showed ${strengths}. You maintained ${(userMetrics.avgEyeContact * 100).toFixed(0)}% eye contact ` +
      `and expressed primarily ${userMetrics.dominantEmotions[0]?.name || 'neutral'} emotions. Your speaking ratio of ${(userMetrics.speakingRatio * 100).toFixed(0)}% ` +
      `${userMetrics.speakingRatio > 0.6 ? 'dominated the conversation' : userMetrics.speakingRatio < 0.4 ? 'left room for more participation' : 'was well-balanced'}. ` +
      `To enhance future interactions, focus on ${improvements}. ` +
      `Your overall engagement score of ${(userMetrics.engagementScore * 100).toFixed(0)}% shows ${userMetrics.engagementScore > 0.7 ? 'excellent' : 'good'} presence and attention.`;
  }

  private generatePartnerSummary(partnerMetrics: PerformanceMetrics, chemistry: number): string {
    const strengths = partnerMetrics.strengthAreas.slice(0, 2).join(' and ') || 'active participation';
    const improvements = partnerMetrics.improvementAreas[0] || 'deepening emotional expression';
    
    return `Your conversation partner demonstrated ${strengths}. They maintained ${(partnerMetrics.avgEyeContact * 100).toFixed(0)}% eye contact ` +
      `and showed ${partnerMetrics.emotionalRange > 0.6 ? 'diverse' : 'consistent'} emotional expression. ` +
      `Their participation level of ${(partnerMetrics.speakingRatio * 100).toFixed(0)}% ${partnerMetrics.speakingRatio > 0.5 ? 'led' : 'supported'} the conversation flow. ` +
      `Areas for their growth include ${improvements}. ` +
      `Their engagement level of ${(partnerMetrics.engagementScore * 100).toFixed(0)}% indicates ${partnerMetrics.engagementScore > 0.7 ? 'strong' : 'moderate'} interest and connection.`;
  }

  async generateReport(): Promise<CallReport> {
    if (!this.startTime) {
      throw new Error('Call not started');
    }

    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();

    const userMetrics = this.calculatePerformanceMetrics(this.analytics, 'user');
    const partnerMetrics = this.calculatePerformanceMetrics(this.analytics, 'partner');
    const overallChemistry = this.calculateChemistry(userMetrics, partnerMetrics);
    const conversationFlow = this.calculateConversationFlow();
    const emotionalSynchrony = this.calculateEmotionalSynchrony();
    const recommendations = this.generateRecommendations(userMetrics, partnerMetrics);

    const aiSummary = await this.generateAISummary(userMetrics, partnerMetrics, overallChemistry);
    
    return {
      callId: this.callId,
      startTime: this.startTime,
      endTime,
      duration,
      analytics: this.analytics,
      transcript: this.transcriptEntries,
      userMetrics,
      partnerMetrics,
      overallChemistry,
      conversationFlow,
      emotionalSynchrony,
      recommendations,
      aiSummary
    };
  }

  async analyzeCall(): Promise<CallReport> {
    return await this.generateReport();
  }
}

export default VideoCallAnalyzer;
