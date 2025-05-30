// Unified Scoring System for Dating Simulation
// Combines all tracking metrics into a seamless scoring experience

export interface MetricScore {
  value: number; // 0-100
  weight: number; // 0-1
  feedback?: string;
  trend?: 'improving' | 'declining' | 'stable';
}

export interface DatingMetrics {
  posture: MetricScore;
  eyeContact: MetricScore;
  gestures: MetricScore;
  facialExpression: MetricScore;
  conversation: MetricScore;
  overall: {
    score: number;
    chemistry: number;
    confidence: number;
    engagement: number;
  };
}

export interface ConversationPhase {
  name: 'greeting' | 'small-talk' | 'deep-conversation' | 'closing';
  duration: number;
  weightAdjustments: Partial<Record<keyof DatingMetrics, number>>;
}

export class UnifiedScoringSystem {
  private static instance: UnifiedScoringSystem;
  private currentMetrics: DatingMetrics;
  private historicalData: DatingMetrics[] = [];
  private currentPhase: ConversationPhase;
  private sessionStartTime: number;

  constructor() {
    this.currentMetrics = this.initializeMetrics();
    this.currentPhase = {
      name: 'greeting',
      duration: 0,
      weightAdjustments: {}
    };
    this.sessionStartTime = Date.now();
  }

  static getInstance(): UnifiedScoringSystem {
    if (!this.instance) {
      this.instance = new UnifiedScoringSystem();
    }
    return this.instance;
  }

  // Update individual metric
  updateMetric(
    metric: keyof Omit<DatingMetrics, 'overall'>, 
    value: number, 
    feedback?: string
  ): void {
    const previousValue = this.currentMetrics[metric].value;
    
    // Smooth the value changes to avoid jitter
    const smoothedValue = this.smoothValue(previousValue, value);
    
    // Determine trend
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (smoothedValue > previousValue + 5) trend = 'improving';
    else if (smoothedValue < previousValue - 5) trend = 'declining';

    this.currentMetrics[metric] = {
      ...this.currentMetrics[metric],
      value: smoothedValue,
      feedback,
      trend
    };

    // Recalculate overall scores
    this.calculateOverallScores();
  }

  // Update conversation phase
  setConversationPhase(phase: ConversationPhase['name']): void {
    const phaseConfigs: Record<ConversationPhase['name'], Partial<ConversationPhase>> = {
      'greeting': {
        weightAdjustments: {
          eyeContact: 1.2,
          posture: 1.1,
          facialExpression: 1.3
        }
      },
      'small-talk': {
        weightAdjustments: {
          conversation: 1.2,
          gestures: 1.1,
          eyeContact: 1.0
        }
      },
      'deep-conversation': {
        weightAdjustments: {
          conversation: 1.5,
          eyeContact: 1.2,
          facialExpression: 1.1
        }
      },
      'closing': {
        weightAdjustments: {
          posture: 1.2,
          eyeContact: 1.3,
          facialExpression: 1.2
        }
      }
    };

    this.currentPhase = {
      name: phase,
      duration: Date.now() - this.sessionStartTime,
      weightAdjustments: phaseConfigs[phase].weightAdjustments || {}
    };
  }

  // Get current scores with phase-adjusted weights
  getCurrentScores(): DatingMetrics {
    return { ...this.currentMetrics };
  }

  // Get real-time feedback messages
  getRealTimeFeedback(): string[] {
    const feedback: string[] = [];

    // Check each metric for issues
    if (this.currentMetrics.posture.value < 60) {
      feedback.push("💺 Try sitting up straighter");
    }
    if (this.currentMetrics.eyeContact.value < 40) {
      feedback.push("👀 Make more eye contact");
    }
    if (this.currentMetrics.gestures.value < 50) {
      feedback.push("🤲 Use more open gestures");
    }
    if (this.currentMetrics.conversation.value < 60) {
      feedback.push("💬 Ask follow-up questions");
    }

    // Positive reinforcement
    if (this.currentMetrics.overall.chemistry > 80) {
      feedback.push("✨ Great chemistry!");
    }

    return feedback;
  }

  // Generate post-session report
  generateSessionReport(): {
    summary: string;
    strengths: string[];
    improvements: string[];
    tips: string[];
    overallGrade: string;
  } {
    const scores = this.getCurrentScores();
    const duration = Date.now() - this.sessionStartTime;
    
    // Calculate weighted average
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.entries(scores).forEach(([key, metric]) => {
      if (key !== 'overall' && 'weight' in metric) {
        totalScore += metric.value * metric.weight;
        totalWeight += metric.weight;
      }
    });

    const avgScore = Math.round(totalScore / totalWeight);
    
    const strengths: string[] = [];
    const improvements: string[] = [];
    
    // Analyze each metric
    Object.entries(this.currentMetrics).forEach(([key, metric]) => {
      if (key === 'overall') return;
      
      if (metric.value > 80) {
        strengths.push(this.getStrengthMessage(key as any, metric.value));
      } else if (metric.value < 60) {
        improvements.push(this.getImprovementMessage(key as any, metric.value));
      }
    });

    const grade = this.calculateGrade(avgScore);
    
    return {
      summary: this.generateSummary(avgScore),
      strengths,
      improvements,
      tips: this.generatePersonalizedTips(this.currentMetrics),
      overallGrade: grade
    };
  }

  private initializeMetrics(): DatingMetrics {
    return {
      posture: { value: 70, weight: 0.2 },
      eyeContact: { value: 70, weight: 0.25 },
      gestures: { value: 70, weight: 0.15 },
      facialExpression: { value: 70, weight: 0.15 },
      conversation: { value: 70, weight: 0.25 },
      overall: {
        score: 70,
        chemistry: 70,
        confidence: 70,
        engagement: 70
      }
    };
  }

  private calculateOverallScores(): void {
    // Apply phase-based weight adjustments
    const adjustedMetrics = { ...this.currentMetrics };
    
    Object.entries(this.currentPhase.weightAdjustments).forEach(([metric, adjustment]) => {
      if (metric in adjustedMetrics && metric !== 'overall') {
        const metricData = adjustedMetrics[metric as keyof DatingMetrics];
        if ('weight' in metricData) {
          metricData.weight *= adjustment || 1;
        }
      }
    });

    // Normalize weights
    const totalWeight = Object.values(adjustedMetrics)
      .filter(m => typeof m === 'object' && 'weight' in m)
      .reduce((sum, m) => sum + (m as MetricScore).weight, 0);

    // Calculate weighted average
    let weightedSum = 0;
    Object.entries(adjustedMetrics).forEach(([key, metric]) => {
      if (key !== 'overall' && 'weight' in metric) {
        const normalizedWeight = metric.weight / totalWeight;
        weightedSum += metric.value * normalizedWeight;
      }
    });

    // Update overall scores
    this.currentMetrics.overall = {
      score: Math.round(weightedSum),
      chemistry: this.calculateChemistry(),
      confidence: this.calculateConfidence(),
      engagement: this.calculateEngagement()
    };
  }

  private calculateChemistry(): number {
    // Chemistry based on eye contact, facial expression, and conversation
    return Math.round(
      (this.currentMetrics.eyeContact.value * 0.4 +
       this.currentMetrics.facialExpression.value * 0.3 +
       this.currentMetrics.conversation.value * 0.3)
    );
  }

  private calculateConfidence(): number {
    // Confidence based on posture, gestures, and conversation
    return Math.round(
      (this.currentMetrics.posture.value * 0.4 +
       this.currentMetrics.gestures.value * 0.3 +
       this.currentMetrics.conversation.value * 0.3)
    );
  }

  private calculateEngagement(): number {
    // Engagement based on all metrics
    return this.currentMetrics.overall.score;
  }

  private smoothValue(oldValue: number, newValue: number, factor: number = 0.3): number {
    return Math.round(oldValue + (newValue - oldValue) * factor);
  }

  private calculateGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'C+';
    if (score >= 65) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private generateSummary(score: number): string {
    if (score >= 85) return "Excellent date! You showed great connection and engagement.";
    if (score >= 75) return "Good date with positive moments. Some areas could be refined.";
    if (score >= 65) return "Decent interaction with room for improvement in key areas.";
    return "This date needs work. Focus on the improvement areas below.";
  }

  private getStrengthMessage(metric: string, value: number): string {
    const messages: Record<string, string> = {
      posture: `Confident body language (${value}%)`,
      eyeContact: `Excellent eye contact (${value}%)`,
      gestures: `Expressive and open gestures (${value}%)`,
      facialExpression: `Warm and engaging expressions (${value}%)`,
      conversation: `Great conversational flow (${value}%)`
    };
    return messages[metric] || `Strong ${metric} (${value}%)`;
  }

  private getImprovementMessage(metric: string, value: number): string {
    const messages: Record<string, string> = {
      posture: `Work on sitting up straight (${value}%)`,
      eyeContact: `Increase eye contact frequency (${value}%)`,
      gestures: `Use more open body language (${value}%)`,
      facialExpression: `Show more emotional engagement (${value}%)`,
      conversation: `Ask more engaging questions (${value}%)`
    };
    return messages[metric] || `Improve ${metric} (${value}%)`;
  }

  private generatePersonalizedTips(metrics: DatingMetrics): string[] {
    const tips: string[] = [];
    
    // Generate tips based on lowest scores
    const metricEntries = Object.entries(metrics)
      .filter(([key]) => key !== 'overall')
      .sort((a, b) => (a[1] as MetricScore).value - (b[1] as MetricScore).value);

    // Focus on bottom 2 metrics
    metricEntries.slice(0, 2).forEach(([metric]) => {
      tips.push(...this.getTipsForMetric(metric as any));
    });

    return tips.slice(0, 3); // Return top 3 tips
  }

  private getTipsForMetric(metric: string): string[] {
    const tipDatabase: Record<string, string[]> = {
      posture: [
        "Practice the 'string from head' visualization",
        "Set reminders to check your posture every 10 minutes",
        "Strengthen your core with daily planks"
      ],
      eyeContact: [
        "Try the triangle technique: alternate looking at each eye and mouth",
        "Practice 3-second eye contact intervals",
        "Look away briefly to avoid staring"
      ],
      gestures: [
        "Keep hands visible and relaxed on the table",
        "Mirror your date's energy level",
        "Use hand gestures when telling stories"
      ],
      facialExpression: [
        "Practice smiling with your eyes (Duchenne smile)",
        "React genuinely to what they're saying",
        "Relax your face between expressions"
      ],
      conversation: [
        "Ask open-ended follow-up questions",
        "Share related personal stories",
        "Practice active listening techniques"
      ]
    };

    return tipDatabase[metric] || ["Focus on being present and authentic"];
  }
}

// Export singleton instance
export const scoringSystem = UnifiedScoringSystem.getInstance();
