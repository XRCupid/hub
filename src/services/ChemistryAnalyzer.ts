import { AnalyticsSnapshot } from './OptimizedVideoAnalyzer';

export interface ChemistryMetrics {
  overallScore: number;
  emotionalSynchrony: number;
  engagementBalance: number;
  eyeContactQuality: number;
  conversationFlow: number;
  positiveEmotions: number;
  mutualAttention: number;
}

export interface DetailedChemistryReport {
  metrics: ChemistryMetrics;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  summary: string;
  dominantEmotions: {
    user: string;
    partner: string;
  };
  highlights: {
    timestamp: number;
    description: string;
  }[];
}

export class ChemistryAnalyzer {
  private userSnapshots: AnalyticsSnapshot[] = [];
  private partnerSnapshots: AnalyticsSnapshot[] = [];
  private transcriptData: any[] = [];
  private callDuration: number = 0;

  addUserSnapshot(snapshot: AnalyticsSnapshot): void {
    this.userSnapshots.push(snapshot);
    // Keep only last 5 minutes of data
    const cutoff = Date.now() - 5 * 60 * 1000;
    this.userSnapshots = this.userSnapshots.filter(s => s.timestamp > cutoff);
  }

  addPartnerSnapshot(snapshot: AnalyticsSnapshot): void {
    this.partnerSnapshots.push(snapshot);
    const cutoff = Date.now() - 5 * 60 * 1000;
    this.partnerSnapshots = this.partnerSnapshots.filter(s => s.timestamp > cutoff);
  }

  addTranscript(transcript: any[]): void {
    this.transcriptData = transcript;
  }

  setCallDuration(duration: number): void {
    this.callDuration = duration;
  }

  generateReport(): DetailedChemistryReport {
    const metrics = this.calculateMetrics();
    const strengths = this.identifyStrengths(metrics);
    const improvements = this.identifyImprovements(metrics);
    const recommendations = this.generateRecommendations(metrics);
    const summary = this.generateSummary(metrics);
    const dominantEmotions = this.getDominantEmotions();
    const highlights = this.findHighlights();

    return {
      metrics,
      strengths,
      improvements,
      recommendations,
      summary,
      dominantEmotions,
      highlights
    };
  }

  private calculateMetrics(): ChemistryMetrics {
    // Use only user snapshots if partner data not available
    const snapshots = this.userSnapshots.length > 0 ? this.userSnapshots : [];
    
    if (snapshots.length === 0) {
      return this.getDefaultMetrics();
    }

    // Calculate individual metrics
    const eyeContactQuality = this.calculateEyeContactQuality(snapshots);
    const emotionalSynchrony = this.calculateEmotionalSynchrony();
    const engagementBalance = this.calculateEngagementBalance(snapshots);
    const conversationFlow = this.calculateConversationFlow();
    const positiveEmotions = this.calculatePositiveEmotions(snapshots);
    const mutualAttention = this.calculateMutualAttention(snapshots);

    // Calculate weighted overall score
    const overallScore = Math.round(
      eyeContactQuality * 0.20 +
      emotionalSynchrony * 0.20 +
      engagementBalance * 0.15 +
      conversationFlow * 0.15 +
      positiveEmotions * 0.15 +
      mutualAttention * 0.15
    );

    return {
      overallScore,
      emotionalSynchrony,
      engagementBalance,
      eyeContactQuality,
      conversationFlow,
      positiveEmotions,
      mutualAttention
    };
  }

  private calculateEyeContactQuality(snapshots: AnalyticsSnapshot[]): number {
    if (snapshots.length === 0) return 50;
    
    const eyeContactValues = snapshots.map(s => s.eyeContact);
    const avgEyeContact = this.average(eyeContactValues);
    
    // Good eye contact is 60-80%, penalize too little or too much
    let score = 0;
    if (avgEyeContact < 30) {
      score = avgEyeContact * 1.5; // Scale up to 45
    } else if (avgEyeContact <= 80) {
      score = 45 + (avgEyeContact - 30) * 1.1; // Scale to 100
    } else {
      score = 100 - (avgEyeContact - 80) * 0.5; // Penalize excessive staring
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateEmotionalSynchrony(): number {
    if (this.userSnapshots.length < 2) return 50;
    
    // Analyze emotion transitions
    let synchronyScore = 0;
    let transitionCount = 0;
    
    for (let i = 1; i < this.userSnapshots.length; i++) {
      const prevEmotion = this.userSnapshots[i - 1].emotion;
      const currEmotion = this.userSnapshots[i].emotion;
      
      // Check for positive emotion continuity
      const positiveEmotions = ['happy', 'surprised', 'neutral'];
      if (positiveEmotions.includes(prevEmotion) && positiveEmotions.includes(currEmotion)) {
        synchronyScore += 1;
      }
      
      transitionCount++;
    }
    
    if (transitionCount === 0) return 50;
    
    return Math.round((synchronyScore / transitionCount) * 100);
  }

  private calculateEngagementBalance(snapshots: AnalyticsSnapshot[]): number {
    if (snapshots.length === 0) return 50;
    
    const engagementValues = snapshots.map(s => s.engagement);
    const avgEngagement = this.average(engagementValues);
    
    // Calculate variance for consistency
    const variance = this.calculateVariance(engagementValues);
    const consistencyScore = Math.max(0, 100 - variance);
    
    // Combine average and consistency
    return Math.round(avgEngagement * 0.7 + consistencyScore * 0.3);
  }

  private calculateConversationFlow(): number {
    if (this.transcriptData.length === 0) return 50;
    
    // Analyze speaking patterns
    let turnTaking = 0;
    let lastSpeaker = '';
    
    this.transcriptData.forEach(entry => {
      if (entry.speaker !== lastSpeaker) {
        turnTaking++;
        lastSpeaker = entry.speaker;
      }
    });
    
    // Good conversation has frequent turn-taking
    const turnsPerMinute = (turnTaking / Math.max(1, this.callDuration / 60));
    const flowScore = Math.min(100, turnsPerMinute * 10);
    
    return Math.round(flowScore);
  }

  private calculatePositiveEmotions(snapshots: AnalyticsSnapshot[]): number {
    if (snapshots.length === 0) return 50;
    
    const positiveEmotions = ['happy', 'surprised'];
    let positiveCount = 0;
    
    snapshots.forEach(snapshot => {
      if (positiveEmotions.includes(snapshot.emotion)) {
        positiveCount++;
      }
      
      // Also check emotion scores
      if (snapshot.emotionScores) {
        const happyScore = snapshot.emotionScores.happy || 0;
        if (happyScore > 50) {
          positiveCount += 0.5;
        }
      }
    });
    
    return Math.round((positiveCount / snapshots.length) * 100);
  }

  private calculateMutualAttention(snapshots: AnalyticsSnapshot[]): number {
    if (snapshots.length === 0) return 50;
    
    // Combine eye contact and posture as attention indicators
    const attentionScores = snapshots.map(s => 
      (s.eyeContact * 0.6 + s.posture * 0.4)
    );
    
    return Math.round(this.average(attentionScores));
  }

  private identifyStrengths(metrics: ChemistryMetrics): string[] {
    const strengths: string[] = [];
    
    if (metrics.eyeContactQuality > 75) {
      strengths.push('Excellent eye contact and visual connection');
    }
    if (metrics.emotionalSynchrony > 70) {
      strengths.push('Strong emotional attunement');
    }
    if (metrics.engagementBalance > 75) {
      strengths.push('Consistently high engagement');
    }
    if (metrics.conversationFlow > 70) {
      strengths.push('Natural conversation flow');
    }
    if (metrics.positiveEmotions > 60) {
      strengths.push('Positive emotional atmosphere');
    }
    if (metrics.mutualAttention > 80) {
      strengths.push('Focused mutual attention');
    }
    
    if (strengths.length === 0) {
      strengths.push('Building connection foundation');
    }
    
    return strengths.slice(0, 3); // Top 3 strengths
  }

  private identifyImprovements(metrics: ChemistryMetrics): string[] {
    const improvements: string[] = [];
    
    if (metrics.eyeContactQuality < 40) {
      improvements.push('Increase eye contact to build connection');
    }
    if (metrics.emotionalSynchrony < 40) {
      improvements.push('Mirror positive emotions more');
    }
    if (metrics.engagementBalance < 40) {
      improvements.push('Show more consistent engagement');
    }
    if (metrics.conversationFlow < 40) {
      improvements.push('Practice active listening and turn-taking');
    }
    if (metrics.positiveEmotions < 30) {
      improvements.push('Express more positive emotions');
    }
    if (metrics.mutualAttention < 40) {
      improvements.push('Focus attention on your partner');
    }
    
    return improvements.slice(0, 3); // Top 3 improvements
  }

  private generateRecommendations(metrics: ChemistryMetrics): string[] {
    const recommendations: string[] = [];
    
    // Prioritized recommendations based on lowest scores
    const metricScores = [
      { name: 'eyeContact', score: metrics.eyeContactQuality },
      { name: 'emotion', score: metrics.emotionalSynchrony },
      { name: 'engagement', score: metrics.engagementBalance },
      { name: 'conversation', score: metrics.conversationFlow },
      { name: 'positive', score: metrics.positiveEmotions },
      { name: 'attention', score: metrics.mutualAttention }
    ].sort((a, b) => a.score - b.score);
    
    // Generate specific recommendations for lowest metrics
    metricScores.slice(0, 2).forEach(metric => {
      switch (metric.name) {
        case 'eyeContact':
          recommendations.push('Practice maintaining eye contact for 3-5 seconds at a time');
          break;
        case 'emotion':
          recommendations.push('Try mirroring your partner\'s positive expressions');
          break;
        case 'engagement':
          recommendations.push('Use active listening cues like nodding and "mm-hmm"');
          break;
        case 'conversation':
          recommendations.push('Ask open-ended questions and pause for responses');
          break;
        case 'positive':
          recommendations.push('Smile more and express enthusiasm about shared interests');
          break;
        case 'attention':
          recommendations.push('Lean in slightly and maintain open body language');
          break;
      }
    });
    
    // Add general recommendation
    if (metrics.overallScore > 70) {
      recommendations.push('Keep up the great connection!');
    } else if (metrics.overallScore > 50) {
      recommendations.push('Focus on being present and authentic');
    } else {
      recommendations.push('Relax and let the conversation flow naturally');
    }
    
    return recommendations.slice(0, 3);
  }

  private generateSummary(metrics: ChemistryMetrics): string {
    const score = metrics.overallScore;
    
    if (score >= 80) {
      return 'Exceptional chemistry! You showed strong mutual interest, emotional connection, and natural conversation flow. The interaction felt genuine and engaging.';
    } else if (score >= 60) {
      return 'Good connection established. You maintained positive engagement and showed interest in each other. With a bit more emotional synchrony, the chemistry could be even stronger.';
    } else if (score >= 40) {
      return 'Moderate chemistry detected. While there were moments of connection, focusing on eye contact and active listening could enhance the interaction.';
    } else {
      return 'Room for improvement in building chemistry. Try to relax, be more present, and focus on creating genuine moments of connection through eye contact and positive emotions.';
    }
  }

  private getDominantEmotions(): { user: string; partner: string } {
    const userEmotions = this.getEmotionDistribution(this.userSnapshots);
    const partnerEmotions = this.getEmotionDistribution(this.partnerSnapshots);
    
    return {
      user: userEmotions[0]?.[0] || 'neutral',
      partner: partnerEmotions[0]?.[0] || 'neutral'
    };
  }

  private getEmotionDistribution(snapshots: AnalyticsSnapshot[]): [string, number][] {
    const emotionCounts: { [key: string]: number } = {};
    
    snapshots.forEach(snapshot => {
      if (snapshot.emotion) {
        emotionCounts[snapshot.emotion] = (emotionCounts[snapshot.emotion] || 0) + 1;
      }
    });
    
    return Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a);
  }

  private findHighlights(): { timestamp: number; description: string }[] {
    const highlights: { timestamp: number; description: string }[] = [];
    
    // Find high engagement moments
    this.userSnapshots.forEach((snapshot, index) => {
      if (snapshot.engagement > 80 && snapshot.emotion === 'happy') {
        highlights.push({
          timestamp: snapshot.timestamp,
          description: 'High engagement and positive emotion'
        });
      }
      
      // Find emotion synchrony moments
      if (index > 0) {
        const prev = this.userSnapshots[index - 1];
        if (prev.emotion === 'happy' && snapshot.emotion === 'happy') {
          highlights.push({
            timestamp: snapshot.timestamp,
            description: 'Shared moment of happiness'
          });
        }
      }
    });
    
    // Keep only unique highlights
    const uniqueHighlights = highlights.filter((h, i, arr) => 
      i === arr.findIndex(h2 => Math.abs(h2.timestamp - h.timestamp) < 5000)
    );
    
    return uniqueHighlights.slice(0, 5); // Top 5 highlights
  }

  private getDefaultMetrics(): ChemistryMetrics {
    return {
      overallScore: 0,
      emotionalSynchrony: 0,
      engagementBalance: 0,
      eyeContactQuality: 0,
      conversationFlow: 0,
      positiveEmotions: 0,
      mutualAttention: 0
    };
  }

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const avg = this.average(numbers);
    const squaredDiffs = numbers.map(n => Math.pow(n - avg, 2));
    return Math.sqrt(this.average(squaredDiffs));
  }

  reset(): void {
    this.userSnapshots = [];
    this.partnerSnapshots = [];
    this.transcriptData = [];
    this.callDuration = 0;
  }
}
