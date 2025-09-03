export interface EmotionScore {
  name: string;
  score: number;
  color?: string;
}

export interface PostureScore {
  confidence?: number;
  alignment?: number;
  openness?: number;
  overall: number;
  leaning?: 'forward' | 'neutral' | 'backward';
  mirroring?: boolean;
}

export interface TranscriptEntry {
  speaker: 'user' | 'partner';
  text: string;
  emotion?: EmotionScore;
  emotions?: EmotionScore[];
  timestamp: number;
  duration?: number;
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
  eyeContactPercentage?: number;
  postureScore?: number;
  responseTime?: number;
  emotionalEngagement?: number;
  activeListening?: number;
}

export interface CallReport {
  callId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  analytics: AnalyticsSnapshot[];
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
  overallScore?: number;
  chemistryScore?: number;
  emotionTimeline?: TimelinePoint[];
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
  category: 'eye-contact' | 'posture' | 'emotion' | 'engagement' | 'conversation' | 'confidence' | string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggestedLesson: string;
  coach: 'Grace' | 'Rizzo' | 'Posie' | string;
  estimatedDuration: number;
  keyExercises: string[];
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
