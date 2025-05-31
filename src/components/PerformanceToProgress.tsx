import React from 'react';
import { DatingPerformance, PERFORMANCE_METRICS } from '../config/curriculumStructure';
import './PerformanceToProgress.css';

interface PerformanceToProgressProps {
  lastDatePerformance?: DatingPerformance;
  overallProgress: {
    totalDates: number;
    averageScores: Record<string, number>;
    unlockedModules: string[];
    nextUnlocks: Array<{
      moduleName: string;
      requirement: string;
      progress: number;
    }>;
  };
}

export const PerformanceToProgress: React.FC<PerformanceToProgressProps> = ({
  lastDatePerformance,
  overallProgress
}) => {
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
                <span>Flow Score</span>
                <div className="skill-bar">
                  <div 
                    className="skill-fill"
                    style={{ width: `${lastDatePerformance.conversationMetrics.flowScore * 100}%` }}
                  />
                </div>
                <span className="skill-value">
                  {(lastDatePerformance.conversationMetrics.flowScore * 100).toFixed(0)}%
                </span>
              </div>
              
              <div className="skill-item">
                <span>Listening Ratio</span>
                <div className="skill-bar">
                  <div 
                    className="skill-fill"
                    style={{ width: `${lastDatePerformance.conversationMetrics.listeningRatio * 100}%` }}
                  />
                </div>
                <span className="skill-value">
                  {(lastDatePerformance.conversationMetrics.listeningRatio * 100).toFixed(0)}%
                </span>
              </div>
              
              <div className="skill-feedback">
                {lastDatePerformance.conversationMetrics.listeningRatio < 0.4 && 
                  "💡 Try asking more open-ended questions and giving space for responses"}
                {lastDatePerformance.conversationMetrics.listeningRatio > 0.6 && 
                  "💡 Share more about yourself to create balance"}
              </div>
            </div>
          </div>

          <div className="category">
            <h4>Chemistry Building</h4>
            <div className="skill-breakdown">
              <div className="skill-item">
                <span>Energy Match</span>
                <div className="skill-bar">
                  <div 
                    className="skill-fill"
                    style={{ width: `${lastDatePerformance.chemistryMetrics.energyMatch * 100}%` }}
                  />
                </div>
                <span className="skill-value">
                  {(lastDatePerformance.chemistryMetrics.energyMatch * 100).toFixed(0)}%
                </span>
              </div>
              
              <div className="skill-feedback">
                {lastDatePerformance.chemistryMetrics.energyMatch < 0.7 && 
                  "💡 Practice matching their enthusiasm level - not too high, not too low"}
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
                    className="skill-fill success"
                    style={{ width: `${lastDatePerformance.respectMetrics.boundaryRecognition * 100}%` }}
                  />
                </div>
                <span className="skill-value">
                  {(lastDatePerformance.respectMetrics.boundaryRecognition * 100).toFixed(0)}%
                </span>
              </div>
              
              <div className="skill-feedback positive">
                {lastDatePerformance.respectMetrics.boundaryRecognition > 0.9 && 
                  "✨ Excellent boundary awareness! This is the foundation of healthy connections."}
              </div>
            </div>
          </div>
        </div>

        <div className="poker-wisdom">
          <h4>Strategic Insights (From the Poker Table)</h4>
          <div className="insight">
            <span className="insight-icon">♠️</span>
            <p>
              {lastDatePerformance.conversationMetrics.flowScore > 0.7 
                ? "You played your hand well - good balance of showing interest and maintaining mystery."
                : "Remember: Sometimes the best move is to check and let them lead the action."}
            </p>
          </div>
          <div className="insight">
            <span className="insight-icon">♥️</span>
            <p>
              "In dating, like in poker, reading the table is crucial. But unlike poker, 
              the goal is for everyone to win."
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderProgressToUnlocks = () => {
    return (
      <div className="progress-to-unlocks">
        <h3>Your Path to Advanced Training</h3>
        
        <div className="unlocks-list">
          {overallProgress.nextUnlocks.map((unlock, idx) => (
            <div key={idx} className="unlock-item">
              <div className="unlock-header">
                <h4>{unlock.moduleName}</h4>
                <span className="requirement">{unlock.requirement}</span>
              </div>
              <div className="unlock-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${unlock.progress * 100}%` }}
                  />
                </div>
                <span className="progress-text">
                  {(unlock.progress * 100).toFixed(0)}% Complete
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="motivation-message">
          <p>
            {overallProgress.totalDates < 3 
              ? "Keep practicing! Each date teaches valuable lessons."
              : overallProgress.totalDates < 10
              ? "You're building solid foundations. Advanced techniques await!"
              : "You're mastering the art of connection. Keep refining your skills!"}
          </p>
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
          <span className="stat-number">{overallProgress.totalDates}</span>
          <span className="stat-label">Practice Dates</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{overallProgress.unlockedModules.length}</span>
          <span className="stat-label">Modules Unlocked</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {Math.round(
              Object.values(overallProgress.averageScores).reduce((a, b) => a + b, 0) / 
              Object.keys(overallProgress.averageScores).length * 100
            )}%
          </span>
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
