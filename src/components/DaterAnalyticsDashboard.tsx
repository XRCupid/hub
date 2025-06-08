import React, { useState, useEffect } from 'react';
import { 
  DateSessionAnalytics, 
  PerformanceMetrics, 
  daterPerformanceAnalytics 
} from '../services/DaterPerformanceAnalytics';
import './DaterAnalyticsDashboard.css';

interface DaterAnalyticsDashboardProps {
  showForAudience?: boolean;
  participantNames?: string[];
}

const DaterAnalyticsDashboard: React.FC<DaterAnalyticsDashboardProps> = ({
  showForAudience = false,
  participantNames = ['Participant 1', 'Participant 2']
}) => {
  const [analytics, setAnalytics] = useState<DateSessionAnalytics | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);

  useEffect(() => {
    const handleUpdate = (newAnalytics: DateSessionAnalytics) => {
      setAnalytics(newAnalytics);
    };

    daterPerformanceAnalytics.onUpdate(handleUpdate);
    
    return () => {
      // Cleanup callback if needed
    };
  }, []);

  const startSession = () => {
    daterPerformanceAnalytics.startSession(participantNames);
    setIsSessionActive(true);
  };

  const endSession = () => {
    const finalAnalytics = daterPerformanceAnalytics.endSession();
    setIsSessionActive(false);
    if (finalAnalytics) {
      setAnalytics(finalAnalytics);
    }
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getMetricColor = (value: number): string => {
    if (value >= 80) return '#10B981'; // Green
    if (value >= 60) return '#F59E0B'; // Yellow
    if (value >= 40) return '#EF4444'; // Red
    return '#6B7280'; // Gray
  };

  const getConnectionLevel = (score: number): string => {
    if (score >= 85) return 'Explosive Chemistry! 🔥';
    if (score >= 70) return 'Strong Connection 💫';
    if (score >= 55) return 'Good Vibes ✨';
    if (score >= 40) return 'Warming Up 🌱';
    return 'Getting Started 👋';
  };

  if (!analytics) {
    return (
      <div className="analytics-dashboard">
        <div className="session-controls">
          <button 
            onClick={startSession}
            className="start-session-btn"
            disabled={isSessionActive}
          >
            {isSessionActive ? 'Session Active...' : 'Start Date Analytics'}
          </button>
        </div>
      </div>
    );
  }

  const metrics = analytics.currentMetrics;

  return (
    <div className={`analytics-dashboard ${showForAudience ? 'audience-view' : ''}`}>
      {/* Header */}
      <div className="dashboard-header">
        <h2 className="dashboard-title">
          {showForAudience ? '💕 XRCupid Live Date Analytics' : 'Performance Analytics'}
        </h2>
        <div className="session-info">
          <span className="duration">⏱️ {formatDuration(analytics.duration)}</span>
          <span className="compatibility">
            🎯 {analytics.compatibilityScore}% {getConnectionLevel(analytics.compatibilityScore)}
          </span>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="metrics-grid">
        {/* Engagement Section */}
        <div className="metric-section">
          <h3>💫 Engagement</h3>
          <div className="metric-cards">
            <MetricCard 
              title="Eye Contact" 
              value={metrics.eyeContact} 
              icon="👁️"
              description="Direct gaze and attention"
            />
            <MetricCard 
              title="Facial Expression" 
              value={metrics.facialEngagement} 
              icon="😊"
              description="Smiles and reactions"
            />
            <MetricCard 
              title="Body Language" 
              value={metrics.bodyLanguage} 
              icon="🤝"
              description="Open and welcoming posture"
            />
          </div>
        </div>

        {/* Emotional Section */}
        <div className="metric-section">
          <h3>❤️ Emotional Connection</h3>
          <div className="metric-cards">
            <MetricCard 
              title="Emotional Range" 
              value={metrics.emotionalRange} 
              icon="🎭"
              description="Variety of emotions expressed"
            />
            <MetricCard 
              title="Positivity" 
              value={metrics.positivity} 
              icon="☀️"
              description="Positive vs negative energy"
            />
            <MetricCard 
              title="Authenticity" 
              value={metrics.authenticity} 
              icon="💎"
              description="Natural and genuine expressions"
            />
          </div>
        </div>

        {/* Chemistry Section */}
        <div className="metric-section">
          <h3>⚡ Chemistry Indicators</h3>
          <div className="metric-cards">
            <MetricCard 
              title="Voice Energy" 
              value={metrics.voiceEnergy} 
              icon="🎤"
              description="Enthusiasm and vocal variety"
            />
            <MetricCard 
              title="Attentiveness" 
              value={metrics.attentiveness} 
              icon="🎯"
              description="Focus on partner"
            />
            <MetricCard 
              title="Rapport" 
              value={metrics.rapport} 
              icon="🌊"
              description="Overall connection flow"
            />
          </div>
        </div>
      </div>

      {/* Live Trends */}
      {analytics.trends.length > 0 && (
        <div className="trends-section">
          <h3>📈 Live Performance Trends</h3>
          <div className="trend-chart">
            <TrendChart trends={analytics.trends} />
          </div>
        </div>
      )}

      {/* Peak Moments */}
      {analytics.peakMoments.length > 0 && (
        <div className="peak-moments">
          <h3>🌟 Peak Moments</h3>
          <div className="moments-list">
            {analytics.peakMoments.slice(-3).map((moment, index) => (
              <div key={index} className="moment-card">
                <span className="moment-time">
                  {formatDuration(moment.timestamp - analytics.startTime)}
                </span>
                <span className="moment-metric">{moment.metric}</span>
                <span className="moment-value">{Math.round(moment.value)}%</span>
                <span className="moment-context">{moment.context}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvement Suggestions */}
      {analytics.improvementSuggestions.length > 0 && !showForAudience && (
        <div className="suggestions">
          <h3>💡 Live Coaching Tips</h3>
          <ul className="suggestions-list">
            {analytics.improvementSuggestions.map((suggestion, index) => (
              <li key={index} className="suggestion-item">{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Session Controls */}
      <div className="session-controls">
        {isSessionActive ? (
          <button onClick={endSession} className="end-session-btn">
            End Session & Generate Report
          </button>
        ) : (
          <button onClick={startSession} className="start-session-btn">
            Start New Session
          </button>
        )}
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: number;
  icon: string;
  description: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, description }) => {
  const getMetricColor = (val: number): string => {
    if (val >= 80) return '#10B981';
    if (val >= 60) return '#F59E0B';
    if (val >= 40) return '#EF4444';
    return '#6B7280';
  };

  return (
    <div className="metric-card">
      <div className="metric-header">
        <span className="metric-icon">{icon}</span>
        <span className="metric-title">{title}</span>
      </div>
      <div className="metric-value" style={{ color: getMetricColor(value) }}>
        {Math.round(value)}%
      </div>
      <div className="metric-bar">
        <div 
          className="metric-fill" 
          style={{ 
            width: `${value}%`,
            backgroundColor: getMetricColor(value)
          }}
        />
      </div>
      <div className="metric-description">{description}</div>
    </div>
  );
};

interface TrendChartProps {
  trends: Array<{ timestamp: number; metrics: PerformanceMetrics; contextEvent?: string }>;
}

const TrendChart: React.FC<TrendChartProps> = ({ trends }) => {
  const latestTrends = trends.slice(-20); // Show last 20 data points
  
  const chartWidth = 400;
  const chartHeight = 200;
  
  const maxValue = 100;
  const minValue = 0;
  
  const getChartPath = (metricKey: keyof PerformanceMetrics, color: string) => {
    if (latestTrends.length < 2) return '';
    
    const points = latestTrends.map((trend, index) => {
      const x = (index / (latestTrends.length - 1)) * chartWidth;
      const y = chartHeight - ((trend.metrics[metricKey] - minValue) / (maxValue - minValue)) * chartHeight;
      return `${x},${y}`;
    }).join(' ');
    
    return `M ${points.replace(/,/g, ' L ')}`;
  };

  return (
    <div className="trend-chart-container">
      <svg width={chartWidth} height={chartHeight} className="trend-svg">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(value => {
          const y = chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
          return (
            <g key={value}>
              <line 
                x1={0} 
                y1={y} 
                x2={chartWidth} 
                y2={y} 
                stroke="#374151" 
                strokeWidth={0.5}
                opacity={0.3}
              />
              <text 
                x={-5} 
                y={y + 4} 
                fontSize="10" 
                fill="#6B7280" 
                textAnchor="end"
              >
                {value}%
              </text>
            </g>
          );
        })}
        
        {/* Trend lines */}
        <path 
          d={getChartPath('eyeContact', '#3B82F6')} 
          fill="none" 
          stroke="#3B82F6" 
          strokeWidth={2}
        />
        <path 
          d={getChartPath('facialEngagement', '#10B981')} 
          fill="none" 
          stroke="#10B981" 
          strokeWidth={2}
        />
        <path 
          d={getChartPath('rapport', '#F59E0B')} 
          fill="none" 
          stroke="#F59E0B" 
          strokeWidth={2}
        />
      </svg>
      
      <div className="chart-legend">
        <span className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#3B82F6' }} />
          Eye Contact
        </span>
        <span className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#10B981' }} />
          Facial Engagement
        </span>
        <span className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#F59E0B' }} />
          Rapport
        </span>
      </div>
    </div>
  );
};

export default DaterAnalyticsDashboard;
