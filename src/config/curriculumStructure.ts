// Phase 1 Simplified Curriculum Structure - deployment ready
export interface Coach {
  id: string;
  name: string;
  specialty: string;
  description: string;
  avatar: string;
  personality: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  coachId: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  content?: string;
  type?: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  level: string;
  lessons: Lesson[];
}

export interface DatingPerformance {
  sessionId: string;
  coachId: string;
  duration: number;
  emotionalRegulation: number;
  conversationFlow: number;
  boundaryRecognition: number;
  authenticity: number;
  confidence: number;
  overallScore: number;
  timestamp: number;
}

export const COACHES: Coach[] = [
  {
    id: 'grace',
    name: 'Grace',
    specialty: 'Emotional Intelligence',
    description: 'Empathetic coach focusing on emotional connection and authentic communication.',
    avatar: '/avatars/grace.png',
    personality: 'warm and understanding'
  },
  {
    id: 'posie',
    name: 'Posie',
    specialty: 'Body Language & Presence',
    description: 'Intuitive coach helping with authentic embodiment and magnetic engagement.',
    avatar: '/avatars/posie.png',
    personality: 'intuitive and present'
  },
  {
    id: 'rizzo',
    name: 'Rizzo',
    specialty: 'Authenticity & Style',
    description: 'Experienced coach focusing on being genuine while making a great impression.',
    avatar: '/avatars/rizzo.png',
    personality: 'honest and supportive'
  }
];

export const CURRICULUM_MODULES: Module[] = [
  {
    id: 'foundation',
    title: 'Dating Foundations',
    description: 'Essential skills for successful dating interactions',
    level: 'beginner',
    lessons: [
      {
        id: 'first_impressions',
        title: 'Making Great First Impressions',
        description: 'Learn how to present your authentic self confidently',
        coachId: 'grace',
        level: 'beginner',
        duration: 20
      },
      {
        id: 'conversation_basics',
        title: 'Conversation Fundamentals',
        description: 'Master the art of engaging conversation',
        coachId: 'posie',
        level: 'beginner',
        duration: 25
      }
    ]
  },
  {
    id: 'communication',
    title: 'Effective Communication',
    description: 'Advanced communication skills for deeper connections',
    level: 'intermediate',
    lessons: [
      {
        id: 'active_listening',
        title: 'Active Listening Skills',
        description: 'Learn to truly hear and connect with your date',
        coachId: 'grace',
        level: 'intermediate',
        duration: 30
      },
      {
        id: 'emotional_intelligence',
        title: 'Reading Emotional Cues',
        description: 'Understand and respond to emotional signals',
        coachId: 'rizzo',
        level: 'intermediate',
        duration: 35
      }
    ]
  }
];

export const PERFORMANCE_METRICS = {
  emotional_regulation: {
    name: 'Emotional Regulation',
    description: 'Ability to manage emotions during dating interactions',
    idealRange: { min: 70, max: 90 }
  },
  conversation_flow: {
    name: 'Conversation Flow',
    description: 'Natural and engaging conversation skills',
    idealRange: { min: 75, max: 95 }
  },
  boundary_recognition: {
    name: 'Boundary Recognition',
    description: 'Respecting personal boundaries and recognizing red flags',
    idealRange: { min: 80, max: 100 }
  },
  authenticity: {
    name: 'Authenticity',
    description: 'Being genuine while making a good impression',
    idealRange: { min: 70, max: 90 }
  },
  confidence: {
    name: 'Confidence',
    description: 'Self-assured but not arrogant behavior',
    idealRange: { min: 65, max: 85 }
  }
};

// Simple default for immediate deployment
export const CURRICULUM_STRUCTURE = {
  coaches: COACHES,
  modules: CURRICULUM_MODULES,
  foundation: CURRICULUM_MODULES.filter(m => m.level === 'beginner'),
  intermediate: CURRICULUM_MODULES.filter(m => m.level === 'intermediate'),
  advanced: CURRICULUM_MODULES.filter(m => m.level === 'advanced')
};

// Add missing exports for compatibility
export const ETHICAL_PRINCIPLES = {
  consent: 'Always respect consent and boundaries',
  authenticity: 'Be genuine and honest in all interactions',
  safety: 'Prioritize emotional and physical safety for all',
  respect: 'Treat all people with dignity and respect'
};

export const PERSONALITY_TYPES = {
  empathetic: 'Understanding and emotionally supportive',
  analytical: 'Data-driven and objective',
  motivational: 'Encouraging and confidence-building'
};

// Type aliases for compatibility
export type CurriculumModule = Module;
