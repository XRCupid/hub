import React from 'react';
import { DetailedChemistryReport } from '../services/ChemistryAnalyzer';
import './ChemistryReportModal.css';

interface ChemistryReportModalProps {
  report: DetailedChemistryReport;
  userName: string;
  partnerName: string;
  onClose: () => void;
  performanceScore?: number;
}

const ChemistryReportModalOptimized: React.FC<ChemistryReportModalProps> = ({
  report,
  userName,
  partnerName,
  onClose,
  performanceScore
}) => {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFC107';
    if (score >= 40) return '#FF9800';
    return '#F44336';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  const formatHighlightTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="chemistry-report-modal-overlay" onClick={onClose}>
      <div className="chemistry-report-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="report-header">
          <h2>Chemistry Analysis Report</h2>
          <p className="participants">{userName} & {partnerName}</p>
        </div>

        {/* Overall Chemistry Score */}
        <div className="overall-score-section">
          <div className="score-circle" style={{ borderColor: getScoreColor(report.metrics.overallScore) }}>
            <div className="score-value">{report.metrics.overallScore}</div>
            <div className="score-label">{getScoreLabel(report.metrics.overallScore)}</div>
          </div>
          <p className="score-summary">{report.summary}</p>
        </div>

        {/* Detailed Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-icon">👁️</span>
              <span className="metric-title">Eye Contact</span>
            </div>
            <div className="metric-value" style={{ color: getScoreColor(report.metrics.eyeContactQuality) }}>
              {report.metrics.eyeContactQuality}%
            </div>
            <div className="metric-bar">
              <div 
                className="metric-fill" 
                style={{ 
                  width: `${report.metrics.eyeContactQuality}%`,
                  backgroundColor: getScoreColor(report.metrics.eyeContactQuality)
                }}
              />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-icon">🎭</span>
              <span className="metric-title">Emotional Sync</span>
            </div>
            <div className="metric-value" style={{ color: getScoreColor(report.metrics.emotionalSynchrony) }}>
              {report.metrics.emotionalSynchrony}%
            </div>
            <div className="metric-bar">
              <div 
                className="metric-fill" 
                style={{ 
                  width: `${report.metrics.emotionalSynchrony}%`,
                  backgroundColor: getScoreColor(report.metrics.emotionalSynchrony)
                }}
              />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-icon">💬</span>
              <span className="metric-title">Conversation Flow</span>
            </div>
            <div className="metric-value" style={{ color: getScoreColor(report.metrics.conversationFlow) }}>
              {report.metrics.conversationFlow}%
            </div>
            <div className="metric-bar">
              <div 
                className="metric-fill" 
                style={{ 
                  width: `${report.metrics.conversationFlow}%`,
                  backgroundColor: getScoreColor(report.metrics.conversationFlow)
                }}
              />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-icon">✨</span>
              <span className="metric-title">Engagement</span>
            </div>
            <div className="metric-value" style={{ color: getScoreColor(report.metrics.engagementBalance) }}>
              {report.metrics.engagementBalance}%
            </div>
            <div className="metric-bar">
              <div 
                className="metric-fill" 
                style={{ 
                  width: `${report.metrics.engagementBalance}%`,
                  backgroundColor: getScoreColor(report.metrics.engagementBalance)
                }}
              />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-icon">😊</span>
              <span className="metric-title">Positive Vibes</span>
            </div>
            <div className="metric-value" style={{ color: getScoreColor(report.metrics.positiveEmotions) }}>
              {report.metrics.positiveEmotions}%
            </div>
            <div className="metric-bar">
              <div 
                className="metric-fill" 
                style={{ 
                  width: `${report.metrics.positiveEmotions}%`,
                  backgroundColor: getScoreColor(report.metrics.positiveEmotions)
                }}
              />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-icon">🎯</span>
              <span className="metric-title">Mutual Attention</span>
            </div>
            <div className="metric-value" style={{ color: getScoreColor(report.metrics.mutualAttention) }}>
              {report.metrics.mutualAttention}%
            </div>
            <div className="metric-bar">
              <div 
                className="metric-fill" 
                style={{ 
                  width: `${report.metrics.mutualAttention}%`,
                  backgroundColor: getScoreColor(report.metrics.mutualAttention)
                }}
              />
            </div>
          </div>
        </div>

        {/* Dominant Emotions */}
        <div className="emotions-section">
          <h3>Dominant Emotions</h3>
          <div className="emotions-display">
            <div className="emotion-block">
              <span className="emotion-label">{userName}</span>
              <span className="emotion-value">{report.dominantEmotions.user}</span>
            </div>
            <div className="emotion-separator">⚡</div>
            <div className="emotion-block">
              <span className="emotion-label">{partnerName}</span>
              <span className="emotion-value">{report.dominantEmotions.partner}</span>
            </div>
          </div>
        </div>

        {/* Highlights */}
        {report.highlights && report.highlights.length > 0 && (
          <div className="highlights-section">
            <h3>Key Moments</h3>
            <div className="highlights-list">
              {report.highlights.map((highlight, index) => (
                <div key={index} className="highlight-item">
                  <span className="highlight-time">{formatHighlightTime(highlight.timestamp)}</span>
                  <span className="highlight-description">{highlight.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths & Improvements */}
        <div className="feedback-section">
          <div className="feedback-column">
            <h3>💪 Strengths</h3>
            <ul className="feedback-list strengths">
              {report.strengths.map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          </div>
          
          <div className="feedback-column">
            <h3>🎯 Areas to Improve</h3>
            <ul className="feedback-list improvements">
              {report.improvements.map((improvement, index) => (
                <li key={index}>{improvement}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recommendations */}
        <div className="recommendations-section">
          <h3>📝 Personalized Recommendations</h3>
          <div className="recommendations-list">
            {report.recommendations.map((rec, index) => (
              <div key={index} className="recommendation-item">
                <span className="rec-number">{index + 1}</span>
                <span className="rec-text">{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Score (if available) */}
        {performanceScore !== undefined && (
          <div className="performance-section">
            <h4>System Performance</h4>
            <div className="performance-score">
              <span className="perf-label">Call Quality Score:</span>
              <span className="perf-value" style={{ color: getScoreColor(performanceScore) }}>
                {performanceScore}/100
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="report-actions">
          <button className="action-button secondary" onClick={onClose}>
            Close
          </button>
          <button className="action-button primary" onClick={() => {
            // Download report as JSON
            const dataStr = JSON.stringify(report, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = `chemistry-report-${Date.now()}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
          }}>
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChemistryReportModalOptimized;
