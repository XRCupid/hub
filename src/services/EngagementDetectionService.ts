// Engagement Detection Service - Advanced analytics for user engagement during conversations
import { 
  TrackingData, 
  PostureData, 
  EngagementAnalytics, 
  NoddingDetection, 
  PostureEngagement, 
  EyeContactDetection 
} from '../types/tracking';

export class EngagementDetectionService {
  private headPositionHistory: Array<{ x: number; y: number; z: number; timestamp: number }> = [];
  private shoulderPositionHistory: Array<{ left: number; right: number; timestamp: number }> = [];
  private gazeHistory: Array<{ x: number; y: number; timestamp: number }> = [];
  private eyeContactStartTime: number | null = null;
  private totalEyeContactTime: number = 0;
  private conversationStartTime: number = Date.now();
  
  private readonly HISTORY_WINDOW = 5000; // 5 seconds of history
  private readonly NOD_THRESHOLD = 0.02; // Minimum head movement for nod detection
  private readonly LEAN_THRESHOLD = 0.05; // Minimum shoulder movement for lean detection
  private readonly EYE_CONTACT_THRESHOLD = 0.15; // Max deviation for eye contact

  /**
   * Analyze tracking data for engagement indicators
   */
  public analyzeEngagement(trackingData: TrackingData): EngagementAnalytics {
    const timestamp = Date.now();
    
    // Extract data for analysis
    const headPosition = this.extractHeadPosition(trackingData);
    const shoulderPositions = this.extractShoulderPositions(trackingData);
    const gazeDirection = this.extractGazeDirection(trackingData);
    
    // Update history
    this.updateHistory(headPosition, shoulderPositions, gazeDirection, timestamp);
    
    // Analyze engagement patterns
    const nodding = this.analyzeNodding();
    const posture = this.analyzePosture();
    const eyeContact = this.analyzeEyeContact();
    
    // Calculate overall engagement score
    const overallEngagement = this.calculateOverallEngagement(nodding, posture, eyeContact);
    
    return {
      nodding,
      posture,
      eyeContact,
      overallEngagement,
      engagementTrend: this.calculateEngagementTrend(),
      lastUpdate: timestamp
    };
  }

  /**
   * 🎯 NODDING DETECTION - Analyze rhythmic head movements
   */
  private analyzeNodding(): NoddingDetection {
    if (this.headPositionHistory.length < 10) {
      return this.getDefaultNodding();
    }

    const recentHistory = this.headPositionHistory.slice(-20); // Last 20 samples
    const yPositions = recentHistory.map(pos => pos.y);
    
    // Detect vertical oscillations (nodding pattern)
    let noddingIntensity = 0;
    let noddingCount = 0;
    let lastDirection = 0; // 1 for up, -1 for down
    
    for (let i = 1; i < yPositions.length; i++) {
      const diff = yPositions[i] - yPositions[i - 1];
      
      if (Math.abs(diff) > this.NOD_THRESHOLD) {
        const currentDirection = diff > 0 ? 1 : -1;
        
        // Detect direction change (indicates nod)
        if (lastDirection !== 0 && currentDirection !== lastDirection) {
          noddingCount++;
          noddingIntensity += Math.abs(diff);
        }
        
        lastDirection = currentDirection;
      }
    }
    
    const noddingFrequency = (noddingCount / 2) * (60000 / this.HISTORY_WINDOW); // nods per minute
    const normalizedIntensity = Math.min(noddingIntensity * 10, 1); // Normalize to 0-1
    
    // Determine nodding pattern based on frequency and intensity
    let noddingPattern: NoddingDetection['noddingPattern'] = 'neutral';
    if (noddingFrequency > 15) noddingPattern = 'agreement';
    else if (noddingFrequency > 8) noddingPattern = 'understanding';
    else if (noddingFrequency > 3) noddingPattern = 'encouragement';
    
    const engagementScore = Math.min((noddingFrequency / 10) * 0.7 + normalizedIntensity * 0.3, 1);
    
    return {
      isNodding: noddingCount > 2,
      noddingIntensity: normalizedIntensity,
      noddingFrequency,
      lastNoddingTime: noddingCount > 0 ? Date.now() : 0,
      noddingPattern,
      engagementScore
    };
  }

  /**
   * 🏃‍♂️ POSTURE ANALYSIS - Detect forward lean and engagement
   */
  private analyzePosture(): PostureEngagement {
    if (this.shoulderPositionHistory.length < 5) {
      return this.getDefaultPosture();
    }

    const recent = this.shoulderPositionHistory.slice(-10);
    const baseline = this.shoulderPositionHistory.slice(0, 5);
    
    // Calculate average positions
    const recentAvgLeft = recent.reduce((sum, pos) => sum + pos.left, 0) / recent.length;
    const recentAvgRight = recent.reduce((sum, pos) => sum + pos.right, 0) / recent.length;
    const baselineAvgLeft = baseline.reduce((sum, pos) => sum + pos.left, 0) / baseline.length;
    const baselineAvgRight = baseline.reduce((sum, pos) => sum + pos.right, 0) / baseline.length;
    
    // Detect forward lean (shoulders moving down in frame = leaning forward)
    const leftChange = baselineAvgLeft - recentAvgLeft;
    const rightChange = baselineAvgRight - recentAvgRight;
    const avgChange = (leftChange + rightChange) / 2;
    
    const isLeaningIn = avgChange > this.LEAN_THRESHOLD;
    const leanAngle = Math.max(0, avgChange * 100); // Convert to degrees approximation
    const proximityChange = avgChange * 100; // Percentage change
    
    // Determine engagement level
    let engagementLevel: PostureEngagement['engagementLevel'] = 'neutral';
    if (avgChange > 0.1) engagementLevel = 'highly_engaged';
    else if (avgChange > 0.05) engagementLevel = 'engaged';
    else if (avgChange < -0.05) engagementLevel = 'disengaged';
    
    const bodyLanguageScore = Math.max(0, Math.min(avgChange * 5 + 0.5, 1));
    
    return {
      isLeaningIn,
      leanAngle,
      proximityChange,
      engagementLevel,
      shoulderPosition: { left: recentAvgLeft, right: recentAvgRight },
      bodyLanguageScore
    };
  }

  /**
   * 👁️ EYE CONTACT ANALYSIS - Detect sustained eye contact
   */
  private analyzeEyeContact(): EyeContactDetection {
    if (this.gazeHistory.length < 3) {
      return this.getDefaultEyeContact();
    }

    const recentGaze = this.gazeHistory.slice(-5);
    const avgX = recentGaze.reduce((sum, gaze) => sum + gaze.x, 0) / recentGaze.length;
    const avgY = recentGaze.reduce((sum, gaze) => sum + gaze.y, 0) / recentGaze.length;
    
    // Check if gaze is centered (eye contact)
    const gazeDeviation = Math.sqrt(avgX * avgX + avgY * avgY);
    const hasEyeContact = gazeDeviation < this.EYE_CONTACT_THRESHOLD;
    
    // Track eye contact duration
    const now = Date.now();
    if (hasEyeContact) {
      if (this.eyeContactStartTime === null) {
        this.eyeContactStartTime = now;
      }
    } else {
      if (this.eyeContactStartTime !== null) {
        this.totalEyeContactTime += now - this.eyeContactStartTime;
        this.eyeContactStartTime = null;
      }
    }
    
    const currentContactDuration = this.eyeContactStartTime ? 
      (now - this.eyeContactStartTime) / 1000 : 0;
    
    const conversationDuration = (now - this.conversationStartTime) / 1000;
    const eyeContactPercentage = conversationDuration > 0 ? 
      (this.totalEyeContactTime / 1000) / conversationDuration * 100 : 0;
    
    // Determine contact quality
    let contactQuality: EyeContactDetection['contactQuality'] = 'poor';
    if (eyeContactPercentage > 60) contactQuality = 'excellent';
    else if (eyeContactPercentage > 30) contactQuality = 'good';
    
    return {
      hasEyeContact,
      eyeContactDuration: currentContactDuration,
      eyeContactPercentage,
      gazeDirection: { x: avgX, y: avgY },
      contactQuality,
      lastContactTime: hasEyeContact ? now : (this.eyeContactStartTime || 0),
      totalContactTime: this.totalEyeContactTime / 1000
    };
  }

  // Helper methods
  private extractHeadPosition(trackingData: TrackingData): { x: number; y: number; z: number } {
    if (trackingData.head?.position) {
      const pos = trackingData.head.position;
      // Handle both Vector3 and plain object types
      if (typeof pos === 'object' && pos !== null) {
        return {
          x: (pos as any).x || 0,
          y: (pos as any).y || 0,
          z: (pos as any).z || 0
        };
      }
    }
    return { x: 0, y: 0, z: 0 };
  }

  private extractShoulderPositions(trackingData: TrackingData): { left: number; right: number } {
    const posture = trackingData.posture;
    if (posture?.keypoints?.leftShoulder && posture?.keypoints?.rightShoulder) {
      return {
        left: posture.keypoints.leftShoulder.y,
        right: posture.keypoints.rightShoulder.y
      };
    }
    return { left: 0.5, right: 0.5 };
  }

  private extractGazeDirection(trackingData: TrackingData): { x: number; y: number } {
    // Simplified gaze estimation from head rotation
    if (trackingData.headRotation) {
      return {
        x: trackingData.headRotation.yaw / Math.PI, // Normalize to -1 to 1
        y: trackingData.headRotation.pitch / Math.PI
      };
    }
    return { x: 0, y: 0 };
  }

  private updateHistory(
    headPosition: { x: number; y: number; z: number },
    shoulderPositions: { left: number; right: number },
    gazeDirection: { x: number; y: number },
    timestamp: number
  ) {
    // Update head position history
    this.headPositionHistory.push({ ...headPosition, timestamp });
    this.headPositionHistory = this.headPositionHistory.filter(
      pos => timestamp - pos.timestamp < this.HISTORY_WINDOW
    );

    // Update shoulder position history
    this.shoulderPositionHistory.push({ ...shoulderPositions, timestamp });
    this.shoulderPositionHistory = this.shoulderPositionHistory.filter(
      pos => timestamp - pos.timestamp < this.HISTORY_WINDOW
    );

    // Update gaze history
    this.gazeHistory.push({ ...gazeDirection, timestamp });
    this.gazeHistory = this.gazeHistory.filter(
      gaze => timestamp - gaze.timestamp < this.HISTORY_WINDOW
    );
  }

  private calculateOverallEngagement(
    nodding: NoddingDetection,
    posture: PostureEngagement,
    eyeContact: EyeContactDetection
  ): number {
    // Weighted combination of engagement indicators
    const weights = {
      nodding: 0.3,
      posture: 0.4,
      eyeContact: 0.3
    };

    return Math.min(
      nodding.engagementScore * weights.nodding +
      posture.bodyLanguageScore * weights.posture +
      (eyeContact.eyeContactPercentage / 100) * weights.eyeContact,
      1
    );
  }

  private calculateEngagementTrend(): 'increasing' | 'decreasing' | 'stable' {
    // Simplified trend calculation - could be enhanced with more sophisticated analysis
    return 'stable';
  }

  // Default values for when insufficient data is available
  private getDefaultNodding(): NoddingDetection {
    return {
      isNodding: false,
      noddingIntensity: 0,
      noddingFrequency: 0,
      lastNoddingTime: 0,
      noddingPattern: 'neutral',
      engagementScore: 0
    };
  }

  private getDefaultPosture(): PostureEngagement {
    return {
      isLeaningIn: false,
      leanAngle: 0,
      proximityChange: 0,
      engagementLevel: 'neutral',
      shoulderPosition: { left: 0.5, right: 0.5 },
      bodyLanguageScore: 0.5
    };
  }

  private getDefaultEyeContact(): EyeContactDetection {
    return {
      hasEyeContact: false,
      eyeContactDuration: 0,
      eyeContactPercentage: 0,
      gazeDirection: { x: 0, y: 0 },
      contactQuality: 'poor',
      lastContactTime: 0,
      totalContactTime: 0
    };
  }

  /**
   * Reset engagement tracking (call when starting new conversation)
   */
  public reset() {
    this.headPositionHistory = [];
    this.shoulderPositionHistory = [];
    this.gazeHistory = [];
    this.eyeContactStartTime = null;
    this.totalEyeContactTime = 0;
    this.conversationStartTime = Date.now();
  }
}
