import React from 'react';
import { LessonRecommendation } from '../services/SpeedDatePerformanceAnalyzer';
import './LessonRecommendations.css';

interface LessonRecommendationsProps {
  recommendations: LessonRecommendation[];
  onStartLesson?: (recommendation: LessonRecommendation) => void;
}

export const LessonRecommendations: React.FC<LessonRecommendationsProps> = ({ 
  recommendations, 
  onStartLesson 
}) => {
  if (recommendations.length === 0) {
    return null;
  }

  const getCoachEmoji = (coachId: string) => {
    switch (coachId) {
      case 'grace': return '🌸';
      case 'rizzo': return '😎';
      case 'posie': return '💕';
      default: return '👥';
    }
  };

  const getCoachName = (coachId: string) => {
    switch (coachId) {
      case 'grace': return 'Grace';
      case 'rizzo': return 'Rizzo';
      case 'posie': return 'Posie';
      default: return 'Coach';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ff4444';
      case 'medium': return '#ffaa44';
      case 'low': return '#44aa44';
      default: return '#666666';
    }
  };

  return (
    <div className="lesson-recommendations">
      <h3>💡 Personalized Lesson Recommendations</h3>
      <p className="recommendations-intro">
        Based on your date performance, here are tailored lessons to help you improve:
      </p>
      
      <div className="recommendations-list">
        {recommendations.map((rec, index) => (
          <div key={index} className="recommendation-card">
            <div className="recommendation-header">
              <div className="coach-info">
                <span className="coach-emoji">{getCoachEmoji(rec.coachId)}</span>
                <span className="coach-name">{getCoachName(rec.coachId)}</span>
              </div>
              <span 
                className="priority-badge"
                style={{ backgroundColor: getPriorityColor(rec.priority) }}
              >
                {rec.priority.toUpperCase()} PRIORITY
              </span>
            </div>
            
            <h4 className="lesson-focus">{rec.lessonFocus}</h4>
            <p className="lesson-reason">{rec.reason}</p>
            
            <div className="suggested-exercises">
              <h5>Suggested Exercises:</h5>
              <ul>
                {rec.suggestedExercises.map((exercise, idx) => (
                  <li key={idx}>{exercise}</li>
                ))}
              </ul>
            </div>
            
            {onStartLesson && (
              <button 
                className="start-lesson-btn"
                onClick={() => onStartLesson(rec)}
              >
                Start Lesson with {getCoachName(rec.coachId)}
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="recommendations-footer">
        <p>
          💪 Remember: Every expert was once a beginner. 
          Focus on one area at a time for the best results!
        </p>
      </div>
    </div>
  );
};
