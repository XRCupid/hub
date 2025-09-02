import React from 'react';
import './ChemistryReportModal.css';

interface ChemistryReportModalProps {
  report: any;
  onClose: () => void;
}

export const ChemistryReportModal: React.FC<ChemistryReportModalProps> = ({ report, onClose }) => {
  if (!report) return null;

  const formatPercent = (value: number) => `${Math.round(value * 100)}%`;
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="chemistry-report-modal-overlay" onClick={onClose}>
      <div className="chemistry-report-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <h2>💫 Chemistry Report</h2>
        
        {/* Overall Chemistry Score */}
        <div className="chemistry-score-section">
          <div className="chemistry-score">
            <div className="score-circle" style={{
              background: `conic-gradient(#ff6b6b 0deg, #ff6b6b ${report.overallChemistry * 360}deg, #333 ${report.overallChemistry * 360}deg)`
            }}>
              <div className="score-inner">
                {formatPercent(report.overallChemistry)}
              </div>
            </div>
            <h3>Overall Chemistry</h3>
          </div>
          
          <div className="sub-scores">
            <div className="sub-score">
              <span className="label">Conversation Flow</span>
              <span className="value">{formatPercent(report.conversationFlow)}</span>
            </div>
            <div className="sub-score">
              <span className="label">Emotional Sync</span>
              <span className="value">{formatPercent(report.emotionalSynchrony)}</span>
            </div>
            <div className="sub-score">
              <span className="label">Call Duration</span>
              <span className="value">{formatDuration(report.duration)}</span>
            </div>
          </div>
        </div>

        {/* User Metrics */}
        <div className="metrics-section">
          <h3>📊 Your Performance</h3>
          <div className="metrics-grid">
            <div className="metric">
              <span className="metric-label">Eye Contact</span>
              <div className="metric-bar">
                <div className="metric-fill" style={{ width: formatPercent(report.userMetrics.avgEyeContact) }}></div>
              </div>
              <span className="metric-value">{formatPercent(report.userMetrics.avgEyeContact)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Posture</span>
              <div className="metric-bar">
                <div className="metric-fill" style={{ width: formatPercent(report.userMetrics.avgPosture) }}></div>
              </div>
              <span className="metric-value">{formatPercent(report.userMetrics.avgPosture)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Speaking Time</span>
              <div className="metric-bar">
                <div className="metric-fill" style={{ width: formatPercent(report.userMetrics.speakingRatio) }}></div>
              </div>
              <span className="metric-value">{formatPercent(report.userMetrics.speakingRatio)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Engagement</span>
              <div className="metric-bar">
                <div className="metric-fill" style={{ width: formatPercent(report.userMetrics.engagementScore) }}></div>
              </div>
              <span className="metric-value">{formatPercent(report.userMetrics.engagementScore)}</span>
            </div>
          </div>
          
          {/* Strengths */}
          {report.userMetrics.strengthAreas?.length > 0 && (
            <div className="strengths">
              <h4>✨ Strengths</h4>
              <ul>
                {report.userMetrics.strengthAreas.map((strength: string, index: number) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Areas for Improvement */}
          {report.userMetrics.improvementAreas?.length > 0 && (
            <div className="improvements">
              <h4>🎯 Areas to Improve</h4>
              <ul>
                {report.userMetrics.improvementAreas.map((area: string, index: number) => (
                  <li key={index}>{area}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Dominant Emotions */}
        {report.userMetrics.dominantEmotions?.length > 0 && (
          <div className="emotions-section">
            <h3>😊 Dominant Emotions</h3>
            <div className="emotions-list">
              {report.userMetrics.dominantEmotions.slice(0, 5).map((emotion: any, index: number) => (
                <div key={index} className="emotion-tag">
                  {emotion.name} ({formatPercent(emotion.score)})
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Summary */}
        {report.aiSummary && (
          <div className="summary-section">
            <h3>🤖 AI Summary</h3>
            <p className="summary-text">{report.aiSummary.forUser}</p>
          </div>
        )}

        {/* Recommendations */}
        {report.recommendations?.length > 0 && (
          <div className="recommendations-section">
            <h3>💡 Recommended Lessons</h3>
            <div className="recommendations-list">
              {report.recommendations.slice(0, 3).map((rec: any) => (
                <div key={rec.id} className={`recommendation recommendation-${rec.priority}`}>
                  <div className="rec-header">
                    <h4>{rec.title}</h4>
                    <span className="rec-coach">Coach {rec.coach}</span>
                  </div>
                  <p className="rec-description">{rec.description}</p>
                  <div className="rec-footer">
                    <span className="rec-duration">⏱️ {rec.estimatedDuration} min</span>
                    <button className="rec-start-btn">Start Lesson</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button className="action-button" onClick={onClose}>Close Report</button>
          <button className="action-button primary">Save & Share</button>
        </div>
      </div>
    </div>
  );
};
