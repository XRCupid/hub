export interface PerformanceMetrics {
  // Engagement Metrics
  eyeContact: number;           // 0-100: Duration of direct gaze
  facialEngagement: number;     // 0-100: Smile frequency + intensity
  bodyLanguage: number;         // 0-100: Open posture + gestures
  
  // Emotional Metrics
  emotionalRange: number;       // 0-100: Variety of emotions expressed
  positivity: number;          // 0-100: Positive vs negative emotion ratio
  authenticity: number;        // 0-100: Natural vs forced expressions
  
  // Conversation Metrics
  voiceEnergy: number;         // 0-100: Vocal enthusiasm and variation
  conversationFlow: number;    // 0-100: Response timing and rhythm
  emotionalResonance: number;  // 0-100: Matching partner's energy
  
  // Chemistry Indicators
  mirroring: number;           // 0-100: Unconscious mimicking behavior
  attentiveness: number;       // 0-100: Focus on partner vs distractions
  rapport: number;             // 0-100: Overall connection score
}

export interface PerformanceTrend {
  timestamp: number;
  metrics: PerformanceMetrics;
  contextEvent?: string; // e.g., "drew red flag card", "discussed travel"
}

export interface DateSessionAnalytics {
  sessionId: string;
  startTime: number;
  duration: number;
  participants: string[];
  
  // Real-time data
  currentMetrics: PerformanceMetrics;
  trends: PerformanceTrend[];
  
  // Session insights
  peakMoments: Array<{
    timestamp: number;
    metric: keyof PerformanceMetrics;
    value: number;
    context: string;
  }>;
  
  compatibilityScore: number;
  improvementSuggestions: string[];
}

export class DaterPerformanceAnalytics {
  private session: DateSessionAnalytics | null = null;
  private updateInterval: number | null = null;
  private callbacks: ((analytics: DateSessionAnalytics) => void)[] = [];

  constructor() {
    this.startSession = this.startSession.bind(this);
    this.updateMetrics = this.updateMetrics.bind(this);
  }

  startSession(participants: string[]): string {
    const sessionId = `session_${Date.now()}`;
    
    this.session = {
      sessionId,
      startTime: Date.now(),
      duration: 0,
      participants,
      currentMetrics: this.getDefaultMetrics(),
      trends: [],
      peakMoments: [],
      compatibilityScore: 50,
      improvementSuggestions: []
    };

    // Update metrics every 2 seconds for real-time display
    this.updateInterval = window.setInterval(() => {
      if (this.session) {
        this.session.duration = Date.now() - this.session.startTime;
        this.notifyCallbacks();
      }
    }, 2000);

    return sessionId;
  }

  updateMetrics(
    faceData: any,
    postureData: any,
    emotionData: any,
    voiceData: any,
    contextEvent?: string
  ) {
    if (!this.session) return;

    const newMetrics = this.calculateMetrics(faceData, postureData, emotionData, voiceData);
    
    // Store trend data
    this.session.trends.push({
      timestamp: Date.now(),
      metrics: newMetrics,
      contextEvent
    });

    // Keep only last 5 minutes of data for performance
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    this.session.trends = this.session.trends.filter(t => t.timestamp > fiveMinutesAgo);

    // Update current metrics with smoothing
    this.session.currentMetrics = this.smoothMetrics(this.session.currentMetrics, newMetrics);

    // Detect peak moments
    this.detectPeakMoments(newMetrics, contextEvent);

    // Update compatibility score
    this.session.compatibilityScore = this.calculateCompatibilityScore();

    // Generate improvement suggestions
    this.session.improvementSuggestions = this.generateSuggestions();

    this.notifyCallbacks();
  }

  private calculateMetrics(faceData: any, postureData: any, emotionData: any, voiceData: any): PerformanceMetrics {
    return {
      // Engagement Metrics
      eyeContact: this.calculateEyeContact(faceData),
      facialEngagement: this.calculateFacialEngagement(faceData, emotionData),
      bodyLanguage: this.calculateBodyLanguage(postureData),
      
      // Emotional Metrics
      emotionalRange: this.calculateEmotionalRange(emotionData),
      positivity: this.calculatePositivity(emotionData),
      authenticity: this.calculateAuthenticity(faceData, emotionData),
      
      // Conversation Metrics
      voiceEnergy: this.calculateVoiceEnergy(voiceData, emotionData),
      conversationFlow: this.calculateConversationFlow(voiceData),
      emotionalResonance: this.calculateEmotionalResonance(emotionData),
      
      // Chemistry Indicators
      mirroring: this.calculateMirroring(postureData, faceData),
      attentiveness: this.calculateAttentiveness(faceData, postureData),
      rapport: this.calculateRapport(emotionData, voiceData)
    };
  }

  private calculateEyeContact(faceData: any): number {
    if (!faceData?.headRotation) return 50;
    
    const { pitch, yaw } = faceData.headRotation;
    const directGaze = Math.max(0, 100 - (Math.abs(pitch) * 2 + Math.abs(yaw) * 3));
    return Math.min(100, directGaze);
  }

  private calculateFacialEngagement(faceData: any, emotionData: any): number {
    let score = 50;
    
    // Smile detection
    if (faceData?.expressions?.mouthSmileLeft > 0.3 || faceData?.expressions?.mouthSmileRight > 0.3) {
      score += 30;
    }
    
    // Eyebrow movement (interest)
    if (faceData?.expressions?.browInnerUp > 0.2) {
      score += 15;
    }
    
    // Emotional positivity
    if (emotionData?.joy > 0.3 || emotionData?.excitement > 0.3) {
      score += 20;
    }
    
    return Math.min(100, score);
  }

  private calculateBodyLanguage(postureData: any): number {
    if (!postureData?.keypoints) return 50;
    
    let score = 50;
    
    // Open posture (shoulders not hunched)
    const shoulders = postureData.keypoints.filter((kp: any) => 
      kp.part?.includes('shoulder') && kp.score > 0.5
    );
    
    if (shoulders.length >= 2) {
      const shoulderOpenness = Math.abs(shoulders[0].position.y - shoulders[1].position.y);
      score += Math.min(25, shoulderOpenness * 100);
    }
    
    // Forward lean (engagement)
    const nose = postureData.keypoints.find((kp: any) => kp.part === 'nose');
    if (nose && nose.position.z < -0.1) {
      score += 25;
    }
    
    return Math.min(100, score);
  }

  private calculateEmotionalRange(emotionData: any): number {
    if (!emotionData) return 50;
    
    const emotions = ['joy', 'surprise', 'interest', 'excitement', 'contentment'];
    const activeEmotions = emotions.filter(emotion => emotionData[emotion] > 0.2);
    
    return Math.min(100, (activeEmotions.length / emotions.length) * 100);
  }

  private calculatePositivity(emotionData: any): number {
    if (!emotionData) return 50;
    
    const positive = (emotionData.joy || 0) + (emotionData.excitement || 0) + (emotionData.contentment || 0);
    const negative = (emotionData.sadness || 0) + (emotionData.anger || 0) + (emotionData.disgust || 0);
    
    const ratio = positive / (positive + negative + 0.01);
    return Math.min(100, ratio * 100);
  }

  private calculateAuthenticity(faceData: any, emotionData: any): number {
    // Look for micro-expressions and natural timing
    let score = 70; // Base authenticity
    
    // Asymmetrical smiles (more authentic)
    if (faceData?.expressions) {
      const smileAsymmetry = Math.abs(
        (faceData.expressions.mouthSmileLeft || 0) - (faceData.expressions.mouthSmileRight || 0)
      );
      if (smileAsymmetry > 0.1) score += 15;
    }
    
    // Emotion-expression alignment
    if (emotionData?.joy > 0.3 && faceData?.expressions?.mouthSmileLeft > 0.2) {
      score += 15;
    }
    
    return Math.min(100, score);
  }

  private calculateVoiceEnergy(voiceData: any, emotionData: any): number {
    let score = 50;
    
    if (emotionData?.excitement > 0.3) score += 25;
    if (emotionData?.interest > 0.3) score += 20;
    if (voiceData?.volume > 0.6) score += 15;
    
    return Math.min(100, score);
  }

  private calculateConversationFlow(voiceData: any): number {
    // Analyze response timing and natural pauses
    return 50 + Math.random() * 30; // Placeholder for now
  }

  private calculateEmotionalResonance(emotionData: any): number {
    // This would compare emotions between participants
    return 50 + Math.random() * 40; // Placeholder for now
  }

  private calculateMirroring(postureData: any, faceData: any): number {
    // Detect unconscious mimicking behavior
    return 40 + Math.random() * 40; // Placeholder for now
  }

  private calculateAttentiveness(faceData: any, postureData: any): number {
    let score = 50;
    
    // Forward lean
    if (postureData?.keypoints) {
      const nose = postureData.keypoints.find((kp: any) => kp.part === 'nose');
      if (nose && nose.position.z < -0.05) score += 30;
    }
    
    // Direct gaze
    if (faceData?.headRotation) {
      const { pitch, yaw } = faceData.headRotation;
      if (Math.abs(pitch) < 15 && Math.abs(yaw) < 20) score += 20;
    }
    
    return Math.min(100, score);
  }

  private calculateRapport(emotionData: any, voiceData: any): number {
    let score = 50;
    
    if (emotionData?.contentment > 0.3) score += 20;
    if (emotionData?.joy > 0.2) score += 15;
    if (emotionData?.interest > 0.3) score += 15;
    
    return Math.min(100, score);
  }

  private smoothMetrics(current: PerformanceMetrics, newMetrics: PerformanceMetrics): PerformanceMetrics {
    const smoothingFactor = 0.3;
    const result = { ...current };
    
    (Object.keys(newMetrics) as Array<keyof PerformanceMetrics>).forEach(key => {
      result[key] = current[key] * (1 - smoothingFactor) + newMetrics[key] * smoothingFactor;
    });
    
    return result;
  }

  private detectPeakMoments(metrics: PerformanceMetrics, contextEvent?: string) {
    if (!this.session) return;
    
    // Detect significant spikes in metrics
    (Object.keys(metrics) as Array<keyof PerformanceMetrics>).forEach(metric => {
      if (metrics[metric] > 85) {
        this.session!.peakMoments.push({
          timestamp: Date.now(),
          metric,
          value: metrics[metric],
          context: contextEvent || 'High performance moment'
        });
      }
    });
    
    // Keep only recent peak moments
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    this.session.peakMoments = this.session.peakMoments.filter(p => p.timestamp > tenMinutesAgo);
  }

  private calculateCompatibilityScore(): number {
    if (!this.session) return 50;
    
    const metrics = this.session.currentMetrics;
    const weights = {
      eyeContact: 0.15,
      facialEngagement: 0.15,
      bodyLanguage: 0.1,
      emotionalRange: 0.1,
      positivity: 0.15,
      authenticity: 0.1,
      voiceEnergy: 0.1,
      conversationFlow: 0.05,
      emotionalResonance: 0.05,
      mirroring: 0.05,
      attentiveness: 0.1,
      rapport: 0.15
    };
    
    let score = 0;
    (Object.keys(weights) as Array<keyof PerformanceMetrics>).forEach(metric => {
      score += metrics[metric] * weights[metric];
    });
    
    return Math.round(score);
  }

  private generateSuggestions(): string[] {
    if (!this.session) return [];
    
    const suggestions: string[] = [];
    const metrics = this.session.currentMetrics;
    
    if (metrics.eyeContact < 60) {
      suggestions.push("Try maintaining more direct eye contact to show engagement");
    }
    
    if (metrics.facialEngagement < 50) {
      suggestions.push("Let your natural reactions show - don't hold back expressions");
    }
    
    if (metrics.bodyLanguage < 60) {
      suggestions.push("Open up your posture and lean forward slightly to show interest");
    }
    
    if (metrics.positivity < 70) {
      suggestions.push("Focus on positive topics and let your enthusiasm shine through");
    }
    
    return suggestions.slice(0, 3); // Max 3 suggestions
  }

  private getDefaultMetrics(): PerformanceMetrics {
    return {
      eyeContact: 50,
      facialEngagement: 50,
      bodyLanguage: 50,
      emotionalRange: 50,
      positivity: 50,
      authenticity: 50,
      voiceEnergy: 50,
      conversationFlow: 50,
      emotionalResonance: 50,
      mirroring: 50,
      attentiveness: 50,
      rapport: 50
    };
  }

  getSession(): DateSessionAnalytics | null {
    return this.session;
  }

  endSession(): DateSessionAnalytics | null {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    const finalSession = this.session;
    this.session = null;
    
    return finalSession;
  }

  onUpdate(callback: (analytics: DateSessionAnalytics) => void) {
    this.callbacks.push(callback);
  }

  private notifyCallbacks() {
    if (this.session) {
      this.callbacks.forEach(callback => callback(this.session!));
    }
  }
}

export const daterPerformanceAnalytics = new DaterPerformanceAnalytics();
