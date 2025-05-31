// Intelligent Tracking Orchestrator
// Manages multiple tracking systems without performance degradation

export type TrackerType = 'posture' | 'hands' | 'eyes' | 'face';

export interface TrackerConfig {
  type: TrackerType;
  priority: number; // 1-5, higher = more important
  updateFrequency: number; // milliseconds between updates
  isActive: boolean;
  lastUpdate: number;
}

export interface TrackingSchedule {
  phase: 'listening' | 'speaking' | 'thinking' | 'reacting';
  activeTrackers: TrackerType[];
  priorities: Record<TrackerType, number>;
}

export interface TrackingStats {
  fps: number;
  activeTrackers: TrackerType[];
  cpuUsage: number;
  memoryUsage: number;
}

export class TrackingOrchestrator {
  private static instance: TrackingOrchestrator;
  private trackers: Map<TrackerType, TrackerConfig>;
  private currentPhase: TrackingSchedule['phase'] = 'listening';
  private performanceMonitor: PerformanceMonitor;
  private callbacks: Map<TrackerType, (data: any) => void> = new Map();

  constructor() {
    this.trackers = this.initializeTrackers();
    this.performanceMonitor = new PerformanceMonitor();
    this.startOrchestration();
  }

  static getInstance(): TrackingOrchestrator {
    if (!this.instance) {
      this.instance = new TrackingOrchestrator();
    }
    return this.instance;
  }

  // Register a tracker callback
  registerTracker(type: TrackerType, callback: (data: any) => void): void {
    this.callbacks.set(type, callback);
  }

  // Update conversation phase for intelligent tracking
  setPhase(phase: TrackingSchedule['phase']): void {
    this.currentPhase = phase;
    this.updateTrackingSchedule();
  }

  // Get current active trackers
  getActiveTrackers(): TrackerType[] {
    return Array.from(this.trackers.entries())
      .filter(([_, config]) => config.isActive)
      .map(([type]) => type);
  }

  // Force enable/disable specific tracker
  setTrackerState(type: TrackerType, active: boolean): void {
    const tracker = this.trackers.get(type);
    if (tracker) {
      tracker.isActive = active;
    }
  }

  // Get current tracking stats
  getStats(): TrackingStats {
    return {
      fps: this.performanceMonitor.getCurrentFPS(),
      activeTrackers: Array.from(this.trackers.entries())
        .filter(([_, config]) => config.isActive)
        .map(([type]) => type),
      cpuUsage: 0, // Would need system integration
      memoryUsage: 0 // Would need system integration
    };
  }

  // Start all tracking
  startTracking(): void {
    this.trackers.forEach((config, type) => {
      config.isActive = true;
    });
  }

  // Stop all tracking  
  stopTracking(): void {
    this.trackers.forEach((config, type) => {
      config.isActive = false;
    });
  }

  private initializeTrackers(): Map<TrackerType, TrackerConfig> {
    return new Map([
      ['face', {
        type: 'face',
        priority: 5, // Always high priority for expressions
        updateFrequency: 33, // 30fps
        isActive: true,
        lastUpdate: 0
      }],
      ['eyes', {
        type: 'eyes',
        priority: 4,
        updateFrequency: 50, // 20fps
        isActive: true,
        lastUpdate: 0
      }],
      ['posture', {
        type: 'posture',
        priority: 3,
        updateFrequency: 2000, // Every 2 seconds
        isActive: true,
        lastUpdate: 0
      }],
      ['hands', {
        type: 'hands',
        priority: 2,
        updateFrequency: 100, // 10fps
        isActive: false, // Start disabled
        lastUpdate: 0
      }]
    ]);
  }

  private updateTrackingSchedule(): void {
    const schedules: Record<TrackingSchedule['phase'], Partial<TrackerConfig>[]> = {
      listening: [
        { type: 'eyes', priority: 5, updateFrequency: 33 }, // Watch for engagement
        { type: 'face', priority: 4, updateFrequency: 50 }, // Reactions
        { type: 'posture', priority: 2, updateFrequency: 3000 }, // Less critical
        { type: 'hands', isActive: false } // Not needed
      ],
      speaking: [
        { type: 'face', priority: 5, updateFrequency: 33 }, // Monitor own expressions
        { type: 'hands', priority: 4, updateFrequency: 50, isActive: true }, // Gesture tracking
        { type: 'posture', priority: 3, updateFrequency: 1000 }, // More frequent
        { type: 'eyes', priority: 2, updateFrequency: 100 } // Less critical while speaking
      ],
      thinking: [
        { type: 'face', priority: 5, updateFrequency: 50 },
        { type: 'eyes', priority: 3, updateFrequency: 100 },
        { type: 'posture', priority: 2, updateFrequency: 2000 },
        { type: 'hands', isActive: false }
      ],
      reacting: [
        { type: 'face', priority: 5, updateFrequency: 33 }, // Capture reactions
        { type: 'eyes', priority: 4, updateFrequency: 33 },
        { type: 'hands', priority: 3, updateFrequency: 100, isActive: true },
        { type: 'posture', priority: 1, updateFrequency: 3000 }
      ]
    };

    // Apply schedule updates
    const updates = schedules[this.currentPhase];
    updates.forEach(update => {
      const tracker = this.trackers.get(update.type as TrackerType);
      if (tracker) {
        Object.assign(tracker, update);
      }
    });
  }

  private startOrchestration(): void {
    // Main orchestration loop
    const orchestrate = () => {
      const now = Date.now();
      const fps = this.performanceMonitor.getCurrentFPS();
      
      // Adjust tracking based on performance
      if (fps < 20) {
        this.degradeGracefully();
      } else if (fps > 50) {
        this.enhanceTracking();
      }

      // Process each tracker based on schedule
      this.trackers.forEach((config, type) => {
        if (!config.isActive) return;

        const timeSinceLastUpdate = now - config.lastUpdate;
        if (timeSinceLastUpdate >= config.updateFrequency) {
          this.executeTracker(type);
          config.lastUpdate = now;
        }
      });

      requestAnimationFrame(orchestrate);
    };

    orchestrate();
  }

  private executeTracker(type: TrackerType): void {
    const callback = this.callbacks.get(type);
    if (callback) {
      // Execute in a non-blocking way
      setTimeout(() => {
        try {
          callback(this.getTrackerData(type));
        } catch (error) {
          console.error(`Tracker ${type} error:`, error);
        }
      }, 0);
    }
  }

  private getTrackerData(type: TrackerType): any {
    // This would connect to actual tracking implementations
    // For now, return mock data
    return {
      type,
      timestamp: Date.now(),
      phase: this.currentPhase
    };
  }

  private degradeGracefully(): void {
    // Reduce tracking frequency when performance is low
    this.trackers.forEach(tracker => {
      if (tracker.priority < 4) {
        tracker.updateFrequency = Math.min(tracker.updateFrequency * 1.5, 5000);
      }
    });

    // Disable lowest priority trackers
    const sortedTrackers = Array.from(this.trackers.values())
      .sort((a, b) => a.priority - b.priority);
    
    if (sortedTrackers.length > 2) {
      sortedTrackers[0].isActive = false;
    }
  }

  private enhanceTracking(): void {
    // Restore tracking when performance improves
    this.trackers.forEach(tracker => {
      // Restore original frequencies
      const originalFreqs: Record<TrackerType, number> = {
        face: 33,
        eyes: 50,
        posture: 2000,
        hands: 100
      };
      
      tracker.updateFrequency = originalFreqs[tracker.type];
      
      // Re-enable trackers based on phase
      if (this.shouldTrackerBeActive(tracker.type)) {
        tracker.isActive = true;
      }
    });
  }

  private shouldTrackerBeActive(type: TrackerType): boolean {
    const phaseRequirements: Record<string, TrackerType[]> = {
      listening: ['eyes', 'face', 'posture'],
      speaking: ['face', 'hands', 'posture', 'eyes'],
      thinking: ['face', 'eyes', 'posture'],
      reacting: ['face', 'eyes', 'hands', 'posture']
    };

    return phaseRequirements[this.currentPhase]?.includes(type) ?? false;
  }
}

// Performance monitoring helper
class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;

  getCurrentFPS(): number {
    const now = performance.now();
    const delta = now - this.lastTime;
    
    if (delta >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / delta);
      this.frameCount = 0;
      this.lastTime = now;
    }
    
    this.frameCount++;
    return this.fps;
  }
}

// Export singleton instance
export const trackingOrchestrator = TrackingOrchestrator.getInstance();
