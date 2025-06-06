// Core types for the integrated dating system

export interface DatingProfile {
  id: string;
  name: string;
  age: number;
  occupation: string;
  bio: string;
  interests: string[];
  photos: string[];
  personality: 'confident' | 'shy' | 'adventurous' | 'intellectual' | 'charming';
  matchScore?: number;
  conversationStarters: string[];
  dealBreakers: string[];
  greenFlags: string[];
}

export interface TextMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  reactions?: string[];
}

export interface TextConversation {
  id: string;
  profileId: string;
  messages: TextMessage[];
  status: 'active' | 'ghosted' | 'date_scheduled' | 'unmatched';
  dateScheduled?: DateSchedule;
  coachFeedback?: string[];
  scoreMetrics?: ConversationMetrics;
}

export interface DateSchedule {
  id: string;
  profileId: string;
  dateTime: Date;
  location: string;
  locationType: 'restaurant' | 'coffee' | 'activity' | 'bar' | 'park';
  confirmed: boolean;
  preparationTips?: string[];
}

export interface ConversationMetrics {
  responseTime: number; // Average in minutes
  messageLength: number; // Average word count
  emojiUsage: number; // Percentage
  questionRatio: number; // Questions asked vs statements
  engagementScore: number; // 0-100
  flirtLevel: number; // 0-10
  humor: number; // 0-10
  depth: number; // 0-10
}

export interface DateSession {
  id: string;
  profileId: string;
  npcPersonalityId: string;
  dateType: 'first_date' | 'second_date' | 'casual' | 'formal' | 'activity';
  location: string;
  startTime: Date;
  endTime?: Date;
  transcript: ConversationTranscript[];
  performanceMetrics: DatePerformanceMetrics;
  coachFeedback: CoachFeedback[];
  overallScore: number;
  unlockedAchievements?: string[];
}

export interface ConversationTranscript {
  timestamp: Date;
  speaker: 'user' | 'npc';
  content: string;
  emotion?: EmotionData;
  bodyLanguage?: BodyLanguageData;
}

export interface EmotionData {
  primary: string;
  confidence: number;
  valence: number; // -1 to 1
  arousal: number; // 0 to 1
}

export interface BodyLanguageData {
  eyeContact: number; // 0-1
  posture: 'open' | 'closed' | 'neutral';
  gestures: string[];
  proximity: number; // Distance score
}

export interface DatePerformanceMetrics {
  conversationFlow: number; // 0-100
  emotionalConnection: number; // 0-100
  humor: number; // 0-100
  confidence: number; // 0-100
  authenticity: number; // 0-100
  attraction: number; // 0-100
  awkwardMoments: number; // Count
  recoveryFromAwkward: number; // 0-100
  topicVariety: number; // 0-100
  activeListening: number; // 0-100
}

export interface CoachFeedback {
  coachId: string;
  timestamp: Date;
  category: 'success' | 'improvement' | 'warning' | 'tip';
  message: string;
  relatedMetric?: keyof DatePerformanceMetrics;
  severity: 'low' | 'medium' | 'high';
}

export interface UserProgress {
  userId: string;
  level: number;
  experience: number;
  completedDates: number;
  successfulDates: number;
  skills: SkillProgress[];
  achievements: Achievement[];
  coachLessonsCompleted: Record<string, string[]>; // coachId -> lessonIds
  dateHistory: DateSession[];
  textingHistory: TextConversation[];
}

export interface SkillProgress {
  skillId: string;
  name: string;
  category: 'conversation' | 'body_language' | 'humor' | 'confidence' | 'authenticity';
  level: number; // 1-10
  experience: number;
  nextLevelRequirement: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface CoachLesson {
  id: string;
  coachId: string;
  title: string;
  description: string;
  objectives: string[];
  skillsFocused: string[];
  practiceScenarios: PracticeScenario[];
  requiredLevel?: number;
  estimatedDuration: number; // minutes
}

export interface PracticeScenario {
  id: string;
  title: string;
  setup: string;
  npcPersonalityId: string;
  location: string;
  objectives: string[];
  successCriteria: SuccessCriteria[];
  hints: string[];
}

export interface SuccessCriteria {
  metric: keyof DatePerformanceMetrics;
  threshold: number;
  weight: number;
}

// Dating App Swipe Interface
export interface SwipeProfile extends DatingProfile {
  distance?: number;
  lastActive?: Date;
  verificationStatus?: 'verified' | 'pending' | 'none';
  compatibilityScore?: number;
  sharedInterests?: string[];
}

export interface SwipeAction {
  profileId: string;
  action: 'like' | 'superlike' | 'pass';
  timestamp: Date;
  timeSpent: number; // seconds spent viewing profile
}

export interface Match {
  id: string;
  userId: string;
  profileId: string;
  matchedAt: Date;
  conversationStarted: boolean;
  lastMessageAt?: Date;
  expiresAt?: Date; // For time-limited matches
}
