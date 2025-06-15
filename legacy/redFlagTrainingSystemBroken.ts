// Red Flag Training System - Phase 1 (Simplified for deployment)
// Advanced features will be added in Phase 2

export interface RedFlag {
  id: string;
  category: 'manipulation' | 'emotional_abuse' | 'control' | 'deception' | 'safety';
  severity: 'low' | 'medium' | 'high' | 'extreme';
  name: string;
  description: string;
  examples: string[];
  warningText: string;
}

export interface RedFlagDetection {
  detected: boolean;
  flagId: string;
  confidence: number;
  context: string;
  recommendation: string;
}

export class RedFlagTrainingSystem {
  private redFlags: RedFlag[] = [
    {
      id: 'love_bombing',
      category: 'manipulation',
      severity: 'high',
      name: 'Love Bombing',
      description: 'Overwhelming someone with excessive affection early in the relationship',
      examples: [
        'Saying "I love you" within days of meeting',
        'Excessive gifts and grand gestures too early',
        'Wanting to move very fast in the relationship'
      ],
      warningText: 'Be cautious of overwhelming affection too early - healthy relationships develop gradually.'
    },
    {
      id: 'isolation_attempts',
      category: 'control',
      severity: 'extreme',
      name: 'Isolation Attempts',
      description: 'Trying to separate you from friends and family',
      examples: [
        'Discouraging you from seeing friends',
        'Creating conflict with your family',
        'Making you choose between them and others'
      ],
      warningText: 'Healthy partners encourage your relationships with others.'
    },
    {
      id: 'gaslighting',
      category: 'emotional_abuse',
      severity: 'extreme',
      name: 'Gaslighting',
      description: 'Making you question your own reality and memories',
      examples: [
        'Denying things they clearly said or did',
        'Making you feel like you are "too sensitive"',
        'Rewriting history of events'
      ],
      warningText: "Trust your instincts and memories - don't let anyone make you doubt your reality."
    }
  ];

  // Basic red flag detection for text messages
  detectRedFlags(message: string): RedFlagDetection[] {
    const detections: RedFlagDetection[] = [];
    
    // Simple keyword-based detection (Phase 1)
    const loveBombingKeywords = ['soulmate', 'perfect for me', 'never felt this way', 'meant to be'];
    const isolationKeywords = ["don't need them", "they don't understand", 'just us two'];
    const gaslightingKeywords = ["you're being sensitive", 'that never happened', "you're imagining"];
    
    if (loveBombingKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
      detections.push({
        detected: true,
        flagId: 'love_bombing',
        confidence: 0.7,
        context: message,
        recommendation: 'Take time to evaluate if this relationship is moving too fast.'
      });
    }
    
    if (isolationKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
      detections.push({
        detected: true,
        flagId: 'isolation_attempts',
        confidence: 0.8,
        context: message,
        recommendation: 'Maintain your relationships with friends and family.'
      });
    }
    
    if (gaslightingKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
      detections.push({
        detected: true,
        flagId: 'gaslighting',
        confidence: 0.9,
        context: message,
        recommendation: 'Trust your instincts and consider seeking support.'
      });
    }
    
    return detections;
  }

  // Get red flag information by ID
  getRedFlagInfo(flagId: string): RedFlag | undefined {
    return this.redFlags.find(flag => flag.id === flagId);
  }

  // Get all red flags for educational purposes
  getAllRedFlags(): RedFlag[] {
    return this.redFlags;
  }

  // Basic coaching intervention
  getCoachingIntervention(flagId: string, coachId: string = 'grace'): string {
    const redFlag = this.getRedFlagInfo(flagId);
    if (!redFlag) return 'I notice something concerning in this interaction. Let\'s talk about healthy relationship boundaries.';
    
    const interventions = {
      grace: `I want to help you recognize this pattern. ${redFlag.warningText} Remember, you deserve respect and healthy boundaries.`,
      rizzo: `Hold up - this is a red flag we need to address. ${redFlag.warningText} Trust your gut on this one.`,
      posie: `This concerns me, and I want to make sure you're safe. ${redFlag.warningText} You're worth being treated well.`
    };
    
    return interventions[coachId as keyof typeof interventions] || interventions.grace;
  }
}

export default RedFlagTrainingSystem;
