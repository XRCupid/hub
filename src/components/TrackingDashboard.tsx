import React, { useState } from 'react';
import { TrackingMetric } from '../config/trainingModules';
import './TrackingDashboard.css';

interface MetricData {
  metric: TrackingMetric;
  currentValue: number;
  history: { timestamp: Date; value: number }[];
}

interface TrackingDashboardProps {
  metrics: MetricData[];
  coachColor: string;
  sessionActive: boolean;
}

const TrackingDashboard: React.FC<TrackingDashboardProps> = ({
  metrics,
  coachColor,
  sessionActive
}) => {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  const getMetricStatus = (metric: TrackingMetric, value: number): 'excellent' | 'good' | 'needs-work' => {
    if (!metric.idealRange) return 'good';
    
    if (value >= metric.idealRange.min && value <= metric.idealRange.max) {
      return 'excellent';
    } else if (
      value >= metric.idealRange.min * 0.8 && 
      value <= metric.idealRange.max * 1.2
    ) {
      return 'good';
    }
    return 'needs-work';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#FFC107';
      case 'needs-work': return '#F44336';
      default: return '#666';
    }
  };

  const formatValue = (value: number, unit: string): string => {
    switch (unit) {
      case 'percentage':
        return `${Math.round(value)}%`;
      case 'seconds':
        return `${value.toFixed(1)}s`;
      case 'ratio':
        return value.toFixed(2);
      case 'count':
        return Math.round(value).toString();
      case 'score':
        return `${value.toFixed(1)}/10`;
      default:
        return value.toString();
    }
  };

  return (
    <div className="tracking-dashboard">
      <div className="dashboard-header">
        <h3>Real-time Performance Tracking</h3>
        <div className={`session-indicator ${sessionActive ? 'active' : ''}`}>
          <span className="indicator-dot" />
          {sessionActive ? 'Recording' : 'Paused'}
        </div>
      </div>

      <div className="metrics-grid">
        {metrics.map((metricData) => {
          const status = getMetricStatus(metricData.metric, metricData.currentValue);
          const isExpanded = expandedMetric === metricData.metric.id;
          
          return (
            <div
              key={metricData.metric.id}
              className={`metric-card ${status} ${isExpanded ? 'expanded' : ''}`}
              onClick={() => setExpandedMetric(isExpanded ? null : metricData.metric.id)}
            >
              <div className="metric-header">
                <h4>{metricData.metric.name}</h4>
                <div 
                  className="metric-value"
                  style={{ color: getStatusColor(status) }}
                >
                  {formatValue(metricData.currentValue, metricData.metric.unit)}
                </div>
              </div>

              <div className="metric-body">
                <p className="metric-description">{metricData.metric.description}</p>
                
                {metricData.metric.idealRange && (
                  <div className="ideal-range">
                    <span className="range-label">Ideal Range:</span>
                    <span className="range-value">
                      {formatValue(metricData.metric.idealRange.min, metricData.metric.unit)}
                      {' - '}
                      {formatValue(metricData.metric.idealRange.max, metricData.metric.unit)}
                    </span>
                  </div>
                )}

                <div className="metric-progress">
                  <div className="progress-track">
                    <div 
                      className="progress-indicator"
                      style={{
                        left: `${Math.min(100, Math.max(0, (metricData.currentValue / 10) * 100))}%`,
                        backgroundColor: getStatusColor(status)
                      }}
                    />
                  </div>
                </div>

                {isExpanded && metricData.history.length > 0 && (
                  <div className="metric-history">
                    <h5>Recent History</h5>
                    <div className="history-items">
                      {metricData.history.slice(-5).map((item, index) => (
                        <div key={index} className="history-item">
                          <span className="history-time">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="history-value">
                            {formatValue(item.value, metricData.metric.unit)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="metric-weight">
                <div 
                  className="weight-bar"
                  style={{ 
                    width: `${metricData.metric.weight * 100}%`,
                    backgroundColor: coachColor
                  }}
                />
                <span className="weight-label">
                  {Math.round(metricData.metric.weight * 100)}% weight
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-footer">
        <div className="overall-score">
          <span className="score-label">Overall Module Score:</span>
          <span className="score-value" style={{ color: coachColor }}>
            {Math.round(
              metrics.reduce((sum, m) => {
                const status = getMetricStatus(m.metric, m.currentValue);
                const score = status === 'excellent' ? 100 : status === 'good' ? 75 : 50;
                return sum + (score * m.metric.weight);
              }, 0) / metrics.reduce((sum, m) => sum + m.metric.weight, 0)
            )}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default TrackingDashboard;
