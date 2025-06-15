import React from 'react';
import { DatingPerformance } from '../config/curriculumStructure';
import './PerformanceToProgress.css';

interface PerformanceToProgressProps {
  lastDatePerformance?: DatingPerformance;
}

interface ProgressTopic {
  current: number;
  target: number;
  trend: number;
  recommendations: string[];
}

export const PerformanceToProgress: React.FC<PerformanceToProgressProps> = ({
  lastDatePerformance
}) => {
  const getProgressByTopic = (topic: string): ProgressTopic => {
    if (!lastDatePerformance) {
      return {
        current: 0,
        target: 80,
        trend: 0,
        recommendations: [`Start with basic ${topic} skills`]
      };
    }

    let current = 0;
    let recommendations: string[] = [];

    switch (topic) {
      case 'conversation':
        current = lastDatePerformance.conversationFlow || 0;
        if (current < 50) {
          recommendations.push('Practice active listening techniques');
          recommendations.push('Work on asking engaging questions');
        }
        break;
      case 'emotional_intelligence':
        current = lastDatePerformance.emotionalRegulation || 0;
        if (current < 60) {
          recommendations.push('Practice emotional awareness exercises');
          recommendations.push('Learn to recognize emotional cues');
        }
        break;
      case 'chemistry':
        current = lastDatePerformance.authenticity || 0;
        if (current < 70) {
          recommendations.push('Focus on being genuinely yourself');
          recommendations.push('Work on natural conversation flow');
        }
        break;
      case 'respect':
        current = lastDatePerformance.boundaryRecognition || 0;
        if (current < 80) {
          recommendations.push('Study consent and boundary recognition');
          recommendations.push('Practice respectful communication');
        }
        break;
      default:
        current = lastDatePerformance.overallScore || 0;
        recommendations.push('Continue practicing core dating skills');
    }

    const trend = current > 70 ? 5 : current > 50 ? 2 : -3;

    return {
      current,
      target: 80,
      trend,
      recommendations
    };
  };

  const overallProgress = lastDatePerformance?.overallScore || 0;

  const renderLastDateAnalysis = () => {
    if (!lastDatePerformance) return null;

    return (
      <div className="last-date-analysis">
        <h3>Last Date Performance Analysis</h3>
        
        <div className="performance-categories">
          <div className="category">
            <h4>Conversation Skills</h4>
            <div className="skill-breakdown">
              <div className="skill-item">
                <span>Conversation Flow</span>
                <div className="skill-bar">
                  <div 
                    className="skill-fill"
                    style={{ width: `${lastDatePerformance.conversationFlow * 100}%` }}
                  />
                </div>
                <span className="skill-value">
                  {(lastDatePerformance.conversationFlow * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          <div className="category">
            <h4>Emotional Intelligence</h4>
            <div className="skill-breakdown">
              <div className="skill-item">
                <span>Emotional Regulation</span>
                <div className="skill-bar">
                  <div 
                    className="skill-fill"
                    style={{ width: `${lastDatePerformance.emotionalRegulation * 100}%` }}
                  />
                </div>
                <span className="skill-value">
                  {(lastDatePerformance.emotionalRegulation * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          <div className="category">
            <h4>Chemistry</h4>
            <div className="skill-breakdown">
              <div className="skill-item">
                <span>Authenticity</span>
                <div className="skill-bar">
                  <div 
                    className="skill-fill"
                    style={{ width: `${lastDatePerformance.authenticity * 100}%` }}
                  />
                </div>
                <span className="skill-value">
                  {(lastDatePerformance.authenticity * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          <div className="category">
            <h4>Respect & Boundaries</h4>
            <div className="skill-breakdown">
              <div className="skill-item">
                <span>Boundary Recognition</span>
                <div className="skill-bar">
                  <div 
                    className="skill-fill"
                    style={{ width: `${lastDatePerformance.boundaryRecognition * 100}%` }}
                  />
                </div>
                <span className="skill-value">
                  {(lastDatePerformance.boundaryRecognition * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProgressToUnlocks = () => {
    const conversationProgress = getProgressByTopic('conversation');
    const emotionalIntelligenceProgress = getProgressByTopic('emotional_intelligence');
    const chemistryProgress = getProgressByTopic('chemistry');
    const respectProgress = getProgressByTopic('respect');

    return (
      <div className="progress-to-unlocks">
        <h3>Your Path to Advanced Training</h3>
        
        <div className="unlocks-list">
          <div className="unlock-item">
            <div className="unlock-header">
              <h4>Conversation Skills</h4>
              <span className="requirement">Reach 80% conversation flow</span>
            </div>
            <div className="unlock-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${conversationProgress.current}%` }}
                />
              </div>
              <span className="progress-text">
                {conversationProgress.current}% Complete
              </span>
            </div>
            <div className="unlock-recommendations">
              {conversationProgress.recommendations.map((recommendation, idx) => (
                <p key={idx}>{recommendation}</p>
              ))}
            </div>
          </div>

          <div className="unlock-item">
            <div className="unlock-header">
              <h4>Emotional Intelligence</h4>
              <span className="requirement">Reach 80% emotional regulation</span>
            </div>
            <div className="unlock-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${emotionalIntelligenceProgress.current}%` }}
                />
              </div>
              <span className="progress-text">
                {emotionalIntelligenceProgress.current}% Complete
              </span>
            </div>
            <div className="unlock-recommendations">
              {emotionalIntelligenceProgress.recommendations.map((recommendation, idx) => (
                <p key={idx}>{recommendation}</p>
              ))}
            </div>
          </div>

          <div className="unlock-item">
            <div className="unlock-header">
              <h4>Chemistry</h4>
              <span className="requirement">Reach 80% authenticity</span>
            </div>
            <div className="unlock-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${chemistryProgress.current}%` }}
                />
              </div>
              <span className="progress-text">
                {chemistryProgress.current}% Complete
              </span>
            </div>
            <div className="unlock-recommendations">
              {chemistryProgress.recommendations.map((recommendation, idx) => (
                <p key={idx}>{recommendation}</p>
              ))}
            </div>
          </div>

          <div className="unlock-item">
            <div className="unlock-header">
              <h4>Respect & Boundaries</h4>
              <span className="requirement">Reach 80% boundary recognition</span>
            </div>
            <div className="unlock-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${respectProgress.current}%` }}
                />
              </div>
              <span className="progress-text">
                {respectProgress.current}% Complete
              </span>
            </div>
            <div className="unlock-recommendations">
              {respectProgress.recommendations.map((recommendation, idx) => (
                <p key={idx}>{recommendation}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="performance-to-progress">
      <div className="header">
        <h2>From Practice to Mastery</h2>
        <p>Your dating experiences unlock advanced training modules</p>
      </div>

      {renderLastDateAnalysis()}
      {renderProgressToUnlocks()}

      <div className="overall-stats">
        <div className="stat-card">
          <span className="stat-number">{overallProgress}%</span>
          <span className="stat-label">Overall Mastery</span>
        </div>
      </div>

      <div className="ethics-reminder-small">
        <p>
          <strong>Remember:</strong> True mastery means creating experiences where both people feel 
          valued, respected, and excited to connect.
        </p>
      </div>
    </div>
  );
};
