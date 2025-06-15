// Simplified Red Flag Training System for Phase 1 Deployment
export interface RedFlag {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high';
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

export class SimpleRedFlagTrainingSystem {
  private redFlags: RedFlag[] = [
    {
      id: 'love_bombing',
      name: 'Love Bombing',
      severity: 'medium',
      description: 'Excessive flattery and attention early in a relationship',
      examples: [
        'Calling you their soulmate after one date',
        'Overwhelming you with gifts and attention'
      ],
      warningText: 'Healthy relationships develop gradually over time.'
    }
  ];

  detectRedFlags(message: string): RedFlagDetection[] {
    const detections: RedFlagDetection[] = [];
    const keywords = ['soulmate', 'perfect for me'];
    
    if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
      detections.push({
        detected: true,
        flagId: 'love_bombing',
        confidence: 0.7,
        context: message,
        recommendation: 'Take time to evaluate if this relationship is moving too fast.'
      });
    }
    
    return detections;
  }

  getRedFlagInfo(flagId: string): RedFlag | undefined {
    return this.redFlags.find(flag => flag.id === flagId);
  }
}

export const redFlagTrainingSystem = new SimpleRedFlagTrainingSystem();
