export interface PerformanceMetrics {
  fps: number;
  memory: {
    used: number;
    limit: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  network: {
    rtt: number;
    packetLoss: number;
    bandwidth: number;
  };
  analytics: {
    processingTime: number;
    frameDrops: number;
    accuracy: number;
  };
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private frameCount = 0;
  private lastFrameTime = 0;
  private frameDrops = 0;
  private analyticsTimings: number[] = [];
  private peerConnection: RTCPeerConnection | null = null;

  constructor() {
    this.metrics = this.getDefaultMetrics();
    this.startMonitoring();
  }

  private getDefaultMetrics(): PerformanceMetrics {
    return {
      fps: 0,
      memory: { used: 0, limit: 0, percentage: 0 },
      cpu: { usage: 0 },
      network: { rtt: 0, packetLoss: 0, bandwidth: 0 },
      analytics: { processingTime: 0, frameDrops: 0, accuracy: 0 }
    };
  }

  setPeerConnection(pc: RTCPeerConnection): void {
    this.peerConnection = pc;
  }

  private startMonitoring(): void {
    // Monitor FPS
    this.monitorFPS();
    
    // Monitor memory usage
    setInterval(() => this.monitorMemory(), 5000);
    
    // Monitor network stats
    setInterval(() => this.monitorNetwork(), 2000);
  }

  private monitorFPS(): void {
    const now = performance.now();
    
    if (this.lastFrameTime > 0) {
      const delta = now - this.lastFrameTime;
      const currentFPS = 1000 / delta;
      
      // Smooth FPS calculation
      this.metrics.fps = this.metrics.fps * 0.9 + currentFPS * 0.1;
      
      // Detect frame drops (target 30 FPS)
      if (delta > 50) { // More than 50ms between frames
        this.frameDrops++;
      }
    }
    
    this.lastFrameTime = now;
    this.frameCount++;
    
    requestAnimationFrame(() => this.monitorFPS());
  }

  private monitorMemory(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memory = {
        used: Math.round(memory.usedJSHeapSize / (1024 * 1024)),
        limit: Math.round(memory.jsHeapSizeLimit / (1024 * 1024)),
        percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
      };
    }
  }

  private async monitorNetwork(): Promise<void> {
    if (!this.peerConnection) return;

    try {
      const stats = await this.peerConnection.getStats();
      
      stats.forEach((report) => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          // RTT (Round Trip Time)
          if (report.currentRoundTripTime) {
            this.metrics.network.rtt = Math.round(report.currentRoundTripTime * 1000);
          }
          
          // Bandwidth
          if (report.availableOutgoingBitrate) {
            this.metrics.network.bandwidth = Math.round(report.availableOutgoingBitrate / 1000); // kbps
          }
        }
        
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          // Packet loss
          const packetsLost = report.packetsLost || 0;
          const packetsReceived = report.packetsReceived || 0;
          const totalPackets = packetsLost + packetsReceived;
          
          if (totalPackets > 0) {
            this.metrics.network.packetLoss = Math.round((packetsLost / totalPackets) * 100);
          }
        }
      });
    } catch (error) {
      console.error('Failed to get network stats:', error);
    }
  }

  recordAnalyticsTime(processingTime: number): void {
    this.analyticsTimings.push(processingTime);
    
    // Keep only last 100 timings
    if (this.analyticsTimings.length > 100) {
      this.analyticsTimings.shift();
    }
    
    // Calculate average
    const avg = this.analyticsTimings.reduce((a, b) => a + b, 0) / this.analyticsTimings.length;
    this.metrics.analytics.processingTime = Math.round(avg);
    this.metrics.analytics.frameDrops = this.frameDrops;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getPerformanceScore(): number {
    // Calculate overall performance score (0-100)
    let score = 100;
    
    // Deduct for low FPS
    if (this.metrics.fps < 30) {
      score -= (30 - this.metrics.fps) * 2;
    }
    
    // Deduct for high memory usage
    if (this.metrics.memory.percentage > 80) {
      score -= (this.metrics.memory.percentage - 80);
    }
    
    // Deduct for network issues
    if (this.metrics.network.rtt > 100) {
      score -= Math.min(20, (this.metrics.network.rtt - 100) / 10);
    }
    
    if (this.metrics.network.packetLoss > 1) {
      score -= Math.min(20, this.metrics.network.packetLoss * 5);
    }
    
    // Deduct for slow analytics
    if (this.metrics.analytics.processingTime > 50) {
      score -= Math.min(15, (this.metrics.analytics.processingTime - 50) / 10);
    }
    
    return Math.max(0, Math.round(score));
  }

  generatePerformanceReport(): string {
    const score = this.getPerformanceScore();
    const m = this.metrics;
    
    return `
Performance Report:
==================
Overall Score: ${score}/100

Video Performance:
- FPS: ${m.fps.toFixed(1)} fps
- Frame Drops: ${m.analytics.frameDrops}

Memory Usage:
- Used: ${m.memory.used} MB
- Limit: ${m.memory.limit} MB  
- Usage: ${m.memory.percentage}%

Network Quality:
- Latency: ${m.network.rtt} ms
- Packet Loss: ${m.network.packetLoss}%
- Bandwidth: ${m.network.bandwidth} kbps

Analytics:
- Processing Time: ${m.analytics.processingTime} ms/frame

Recommendations:
${this.getRecommendations().join('\n')}
    `.trim();
  }

  private getRecommendations(): string[] {
    const recommendations: string[] = [];
    const m = this.metrics;
    
    if (m.fps < 24) {
      recommendations.push('• Consider reducing video resolution to improve FPS');
    }
    
    if (m.memory.percentage > 80) {
      recommendations.push('• High memory usage detected - close unnecessary tabs');
    }
    
    if (m.network.rtt > 150) {
      recommendations.push('• High network latency - check your internet connection');
    }
    
    if (m.network.packetLoss > 2) {
      recommendations.push('• Packet loss detected - may experience video/audio issues');
    }
    
    if (m.analytics.processingTime > 100) {
      recommendations.push('• Analytics processing is slow - consider disabling some features');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('• Performance is optimal!');
    }
    
    return recommendations;
  }

  dispose(): void {
    this.frameCount = 0;
    this.frameDrops = 0;
    this.analyticsTimings = [];
    this.peerConnection = null;
  }
}
