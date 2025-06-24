// Minimal types for VideoCallAnalytics
export interface VideoCallAnalyticsProps {
  partnerName?: string;
}

export interface AnalyticsSnapshot {
  timestamp: number;
  [key: string]: any;
}

export interface EmotionScore {
  name: string;
  score: number;
  color: string;
}

export interface PostureScore {
  confidence: number;
  alignment: number;
  openness: number;
  overall: number;
}

export interface PerformanceMetrics {
  eyeContactPercentage: number;
  postureScore: number;
  speakingRatio: number;
  emotionalEngagement: number;
  overallScore?: number;
}

export interface Recommendation {
  title: string;
  description: string;
  priority?: string;
  category?: string;
}

export interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: number;
  emotions?: any[];
  duration?: number;
}
