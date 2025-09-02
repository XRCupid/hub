export interface EmotionData {
  dominant: string;
  confidence: number;
  all: Record<string, number>;
}

export interface AnalyticsData {
  eyeContact: number;
  posture: number;
  emotions: EmotionData;
  timestamp: number;
  frameQuality: number;
}

export class AnalyticsEngine {
  private analyticsHistory: AnalyticsData[] = [];
  private sessionStartTime: number = Date.now();
  
  // Track analytics data
  trackAnalytics(data: AnalyticsData): void {
    this.analyticsHistory.push({
      ...data,
      timestamp: Date.now()
    });
    
    // Keep only last 5 minutes of data
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    this.analyticsHistory = this.analyticsHistory.filter(
      item => item.timestamp > fiveMinutesAgo
    );
  }
  
  // Get current analytics summary
  getCurrentSummary(): {
    averageEyeContact: number;
    averagePosture: number;
    dominantEmotion: string;
    sessionDuration: number;
  } {
    if (this.analyticsHistory.length === 0) {
      return {
        averageEyeContact: 0,
        averagePosture: 0,
        dominantEmotion: 'neutral',
        sessionDuration: 0
      };
    }
    
    const recentData = this.analyticsHistory.slice(-30); // Last 30 seconds
    
    const avgEyeContact = recentData.reduce((sum, d) => sum + d.eyeContact, 0) / recentData.length;
    const avgPosture = recentData.reduce((sum, d) => sum + d.posture, 0) / recentData.length;
    
    // Calculate dominant emotion
    const emotionCounts: Record<string, number> = {};
    recentData.forEach(d => {
      const emotion = d.emotions.dominant;
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });
    
    const dominantEmotion = Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutral';
    
    return {
      averageEyeContact: Math.round(avgEyeContact),
      averagePosture: Math.round(avgPosture),
      dominantEmotion,
      sessionDuration: Math.floor((Date.now() - this.sessionStartTime) / 1000)
    };
  }
  
  // Get full analytics history
  getHistory(): AnalyticsData[] {
    return [...this.analyticsHistory];
  }
  
  // Reset analytics
  reset(): void {
    this.analyticsHistory = [];
    this.sessionStartTime = Date.now();
  }
  
  // Get analytics for chemistry analysis
  getAnalyticsForChemistry(): {
    eyeContactPattern: number[];
    posturePattern: number[];
    emotionTimeline: Array<{ time: number; emotion: string; confidence: number }>;
  } {
    return {
      eyeContactPattern: this.analyticsHistory.map(d => d.eyeContact),
      posturePattern: this.analyticsHistory.map(d => d.posture),
      emotionTimeline: this.analyticsHistory.map(d => ({
        time: d.timestamp,
        emotion: d.emotions.dominant,
        confidence: d.emotions.confidence
      }))
    };
  }
}
