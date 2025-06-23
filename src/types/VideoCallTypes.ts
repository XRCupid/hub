export interface EmotionScore {
  name: string;
  score: number;
  color?: string;
}

export interface PostureScore {
  confidence: number;
  alignment: number;
  openness: number;
  overall: number;
}

export interface TranscriptEntry {
  speaker: 'user' | 'partner';
  text: string;
  emotions: EmotionScore[];
  timestamp: number;
  duration: number;
}

export interface AnalyticsSnapshot {
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

export interface CallMetrics {
  duration: number;
  avgEyeContact: number;
  avgPosture: number;
  emotionalRange: number;
  speakingRatio: number;
  engagementScore: number;
  chemistry: number;
  conversationFlow: number;
}

export interface PerformanceMetrics {
  eyeContactPercentage: number;
  postureScore: number;
  speakingRatio: number;
  responseTime: number;
  emotionalEngagement: number;
  activeListening: number;
}

export interface CallReport {
  overallScore: number;
  userMetrics: PerformanceMetrics;
  partnerMetrics: PerformanceMetrics;
  chemistryScore: number;
  recommendations: Recommendation[];
  aiSummary: string;
  emotionTimeline: TimelinePoint[];
  transcript: TranscriptEntry[];
}

export interface PerformanceSection {
  title: string;
  score: number;
  color: string;
  description: string;
  metrics: Array<{
    label: string;
    value: string | number;
    isPositive: boolean;
  }>;
}

export interface ChemistryReport {
  overallScore: number;
  sections: PerformanceSection[];
  recommendations: Recommendation[];
  aiSummary: {
    joint: string;
    forUser: string;
    forPartner: string;
  };
}

export interface Recommendation {
  id: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggestedLesson?: string;
  coach?: string;
  exercises?: string[];
}

export interface TimelinePoint {
  time: number;
  engagement: number;
  posture: number;
  eyeContact: number;
  emotions: EmotionScore[];
  transcript?: string;
}

export interface VideoCallAnalyticsProps {
  onClose?: () => void;
  partnerName?: string;
  userId?: string;
}
