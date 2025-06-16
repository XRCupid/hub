// Engagement Dashboard - Comprehensive engagement analytics display
import React from 'react';
import { EngagementAnalytics } from '../types/tracking';
import EyeContactIndicator from './EyeContactIndicator';
import './EngagementDashboard.css';

interface EngagementDashboardProps {
  engagementData: EngagementAnalytics | null;
  isVisible?: boolean;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

const EngagementDashboard: React.FC<EngagementDashboardProps> = ({
  engagementData,
  isVisible = true,
  isMinimized = false,
  onToggleMinimize
}) => {
  if (!isVisible) return null;

  // Handle null/undefined engagement data
  if (!engagementData) {
    return (
      <div className="engagement-dashboard loading">
        <div className="dashboard-header">
          <h3>📊 Engagement Analytics</h3>
          <span className="loading-text">Initializing...</span>
        </div>
      </div>
    );
  }

  const { nodding, posture, eyeContact, overallEngagement, engagementTrend } = engagementData;

  // Get engagement level description
  const getEngagementLevel = (score: number) => {
    if (score >= 0.8) return { level: 'Excellent', color: '#00ff44' };
    if (score >= 0.6) return { level: 'Good', color: '#ffaa00' };
    if (score >= 0.4) return { level: 'Fair', color: '#ff8800' };
    return { level: 'Needs Improvement', color: '#ff4444' };
  };

  const engagementLevel = getEngagementLevel(overallEngagement);

  // Format trend indicator
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '➡️';
    }
  };

  return (
    <>
      {/* Eye Contact Indicator (separate overlay) */}
      <EyeContactIndicator 
        eyeContactData={eyeContact}
        isVisible={isVisible}
        position="top-right"
      />

      {/* Main Dashboard */}
      <div className={`engagement-dashboard ${isMinimized ? 'minimized' : 'expanded'}`}>
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-title">
            <span className="title-icon">📊</span>
            <span className="title-text">Engagement Analytics</span>
          </div>
          <button 
            className="minimize-toggle"
            onClick={onToggleMinimize}
            aria-label={isMinimized ? 'Expand dashboard' : 'Minimize dashboard'}
          >
            {isMinimized ? '📋' : '➖'}
          </button>
        </div>

        {/* Overall Engagement Score */}
        <div className="overall-engagement">
          <div className="engagement-circle">
            <div 
              className="engagement-fill"
              style={{ 
                background: `conic-gradient(${engagementLevel.color} ${overallEngagement * 360}deg, rgba(255,255,255,0.1) 0deg)`
              }}
            >
              <div className="engagement-inner">
                <span className="engagement-score">{Math.round(overallEngagement * 100)}</span>
                <span className="engagement-percent">%</span>
              </div>
            </div>
          </div>
          <div className="engagement-info">
            <span className="engagement-level" style={{ color: engagementLevel.color }}>
              {engagementLevel.level}
            </span>
            <span className="engagement-trend">
              {getTrendIcon(engagementTrend)} {engagementTrend}
            </span>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Detailed Analytics */}
            <div className="analytics-grid">
              {/* Nodding Analysis */}
              <div className="analytics-card nodding">
                <div className="card-header">
                  <span className="card-icon">👍</span>
                  <span className="card-title">Nodding</span>
                </div>
                <div className="card-content">
                  <div className="metric-row">
                    <span className="metric-label">Status:</span>
                    <span className={`metric-value ${nodding.isNodding ? 'active' : 'inactive'}`}>
                      {nodding.isNodding ? 'Nodding' : 'Still'}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Pattern:</span>
                    <span className="metric-value">{nodding.noddingPattern}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Frequency:</span>
                    <span className="metric-value">{Math.round(nodding.noddingFrequency)}/min</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${nodding.engagementScore * 100}%`,
                        backgroundColor: '#4CAF50'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Posture Analysis */}
              <div className="analytics-card posture">
                <div className="card-header">
                  <span className="card-icon">🏃‍♂️</span>
                  <span className="card-title">Posture</span>
                </div>
                <div className="card-content">
                  <div className="metric-row">
                    <span className="metric-label">Position:</span>
                    <span className={`metric-value ${posture.isLeaningIn ? 'active' : 'inactive'}`}>
                      {posture.isLeaningIn ? 'Leaning In' : 'Relaxed'}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Level:</span>
                    <span className="metric-value">{posture.engagementLevel.replace('_', ' ')}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Lean:</span>
                    <span className="metric-value">{Math.round(posture.leanAngle)}°</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${posture.bodyLanguageScore * 100}%`,
                        backgroundColor: '#2196F3'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Eye Contact Summary */}
              <div className="analytics-card eye-contact">
                <div className="card-header">
                  <span className="card-icon">👁️</span>
                  <span className="card-title">Eye Contact</span>
                </div>
                <div className="card-content">
                  <div className="metric-row">
                    <span className="metric-label">Quality:</span>
                    <span className="metric-value">{eyeContact.contactQuality}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Duration:</span>
                    <span className="metric-value">
                      {Math.round(eyeContact.eyeContactDuration)}s
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Total:</span>
                    <span className="metric-value">
                      {Math.round(eyeContact.totalContactTime)}s
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${eyeContact.eyeContactPercentage}%`,
                        backgroundColor: '#FF9800'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Feedback */}
            <div className="feedback-section">
              <h4 className="feedback-title">💡 Live Feedback</h4>
              <div className="feedback-messages">
                {nodding.isNodding && (
                  <div className="feedback-message positive">
                    Great! Your nodding shows you're actively listening
                  </div>
                )}
                {posture.isLeaningIn && (
                  <div className="feedback-message positive">
                    Excellent posture - leaning in shows engagement
                  </div>
                )}
                {eyeContact.hasEyeContact && (
                  <div className="feedback-message positive">
                    Perfect eye contact - you're showing confidence
                  </div>
                )}
                {overallEngagement < 0.3 && (
                  <div className="feedback-message improvement">
                    Try to engage more - nod, lean in, or make eye contact
                  </div>
                )}
                {eyeContact.eyeContactPercentage < 20 && (
                  <div className="feedback-message improvement">
                    Look at the camera more often to establish connection
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default EngagementDashboard;
