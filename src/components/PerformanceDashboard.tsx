import React, { useState, useEffect } from 'react';
import { PerformanceMonitor, PerformanceMetrics } from '../utils/PerformanceMonitor';
import './PerformanceDashboard.css';

interface PerformanceDashboardProps {
  monitor: PerformanceMonitor;
  minimized?: boolean;
  onToggle?: () => void;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ 
  monitor, 
  minimized = false,
  onToggle 
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(monitor.getMetrics());
  const [score, setScore] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(monitor.getMetrics());
      setScore(monitor.getPerformanceScore());
    }, 1000);

    return () => clearInterval(interval);
  }, [monitor]);

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }): string => {
    if (value >= thresholds.good) return '#4CAF50';
    if (value >= thresholds.warning) return '#FFC107';
    return '#F44336';
  };

  const getScoreIcon = (score: number): string => {
    if (score >= 80) return '🚀';
    if (score >= 60) return '✅';
    if (score >= 40) return '⚠️';
    return '❌';
  };

  if (minimized) {
    return (
      <div className="performance-dashboard-mini" onClick={onToggle}>
        <span className="mini-icon">{getScoreIcon(score)}</span>
        <span className="mini-score">{score}</span>
        <span className="mini-fps">{metrics.fps.toFixed(0)} fps</span>
      </div>
    );
  }

  return (
    <div className="performance-dashboard">
      <div className="dashboard-header">
        <h4>Performance Monitor</h4>
        {onToggle && (
          <button className="minimize-btn" onClick={onToggle}>_</button>
        )}
      </div>

      <div className="overall-score">
        <span className="score-icon">{getScoreIcon(score)}</span>
        <span className="score-value">{score}</span>
        <span className="score-label">Performance Score</span>
      </div>

      <div className="metrics-grid">
        {/* Video Performance */}
        <div className="metric-group">
          <h5>Video</h5>
          <div className="metric">
            <span className="metric-label">FPS</span>
            <span 
              className="metric-value"
              style={{ color: getStatusColor(metrics.fps, { good: 25, warning: 20 }) }}
            >
              {metrics.fps.toFixed(1)}
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Drops</span>
            <span className="metric-value">{metrics.analytics.frameDrops}</span>
          </div>
        </div>

        {/* Memory */}
        <div className="metric-group">
          <h5>Memory</h5>
          <div className="metric">
            <span className="metric-label">Used</span>
            <span className="metric-value">{metrics.memory.used} MB</span>
          </div>
          <div className="metric">
            <span className="metric-label">Usage</span>
            <span 
              className="metric-value"
              style={{ color: getStatusColor(100 - metrics.memory.percentage, { good: 40, warning: 20 }) }}
            >
              {metrics.memory.percentage}%
            </span>
          </div>
        </div>

        {/* Network */}
        <div className="metric-group">
          <h5>Network</h5>
          <div className="metric">
            <span className="metric-label">Latency</span>
            <span 
              className="metric-value"
              style={{ color: getStatusColor(200 - metrics.network.rtt, { good: 150, warning: 100 }) }}
            >
              {metrics.network.rtt} ms
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Loss</span>
            <span 
              className="metric-value"
              style={{ color: getStatusColor(5 - metrics.network.packetLoss, { good: 4, warning: 2 }) }}
            >
              {metrics.network.packetLoss}%
            </span>
          </div>
        </div>

        {/* Analytics */}
        <div className="metric-group">
          <h5>Analytics</h5>
          <div className="metric">
            <span className="metric-label">Process</span>
            <span 
              className="metric-value"
              style={{ color: getStatusColor(100 - metrics.analytics.processingTime, { good: 50, warning: 25 }) }}
            >
              {metrics.analytics.processingTime} ms
            </span>
          </div>
        </div>
      </div>

      {/* Network Bandwidth Bar */}
      {metrics.network.bandwidth > 0 && (
        <div className="bandwidth-bar">
          <span className="bandwidth-label">Bandwidth</span>
          <div className="bandwidth-meter">
            <div 
              className="bandwidth-fill"
              style={{ 
                width: `${Math.min(100, metrics.network.bandwidth / 50)}%`,
                backgroundColor: getStatusColor(metrics.network.bandwidth, { good: 1000, warning: 500 })
              }}
            />
          </div>
          <span className="bandwidth-value">{metrics.network.bandwidth} kbps</span>
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard;
