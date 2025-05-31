import React from 'react';
import { TrainingModule, UserProgress, calculateModuleScore, isModuleUnlocked } from '../config/trainingModules';
import './TrainingModuleCard.css';

interface TrainingModuleCardProps {
  module: TrainingModule;
  userProgress?: UserProgress;
  isUnlocked: boolean;
  coachColor: string;
  onStartModule: (module: TrainingModule) => void;
}

const TrainingModuleCard: React.FC<TrainingModuleCardProps> = ({
  module,
  userProgress,
  isUnlocked,
  coachColor,
  onStartModule
}) => {
  const isCompleted = userProgress && userProgress.score >= module.successCriteria.minimumScore;
  const score = userProgress ? userProgress.score : 0;
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#666';
    }
  };

  return (
    <div 
      className={`training-module-card ${!isUnlocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''}`}
      style={{ borderColor: isUnlocked ? coachColor : '#444' }}
    >
      <div className="module-header" style={{ backgroundColor: isUnlocked ? coachColor : '#444' }}>
        <h3>{module.name}</h3>
        <span 
          className="difficulty-badge" 
          style={{ backgroundColor: getDifficultyColor(module.difficulty) }}
        >
          {module.difficulty}
        </span>
      </div>
      
      <div className="module-body">
        <p className="module-description">{module.description}</p>
        
        <div className="module-info">
          <span className="duration">
            <i className="icon-clock" /> {module.duration} min
          </span>
          <span className="exercises">
            <i className="icon-exercise" /> {module.exercises.length} exercises
          </span>
        </div>
        
        {isUnlocked && (
          <div className="module-objectives">
            <h4>Objectives:</h4>
            <ul>
              {module.objectives.slice(0, 3).map((objective, index) => (
                <li key={index}>{objective}</li>
              ))}
              {module.objectives.length > 3 && (
                <li className="more">+{module.objectives.length - 3} more</li>
              )}
            </ul>
          </div>
        )}
        
        {userProgress && (
          <div className="module-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${score}%`,
                  backgroundColor: score >= 70 ? '#4CAF50' : coachColor
                }}
              />
            </div>
            <div className="progress-stats">
              <span>Score: {score}%</span>
              <span>Attempts: {userProgress.attempts}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="module-footer">
        {!isUnlocked ? (
          <button className="module-btn locked" disabled>
            <i className="icon-lock" /> Complete Prerequisites
          </button>
        ) : isCompleted ? (
          <button 
            className="module-btn completed"
            onClick={() => onStartModule(module)}
            style={{ backgroundColor: coachColor }}
          >
            <i className="icon-replay" /> Practice Again
          </button>
        ) : (
          <button 
            className="module-btn start"
            onClick={() => onStartModule(module)}
            style={{ 
              backgroundColor: 'transparent',
              borderColor: coachColor,
              color: coachColor
            }}
          >
            <i className="icon-play" /> Start Module
          </button>
        )}
      </div>
    </div>
  );
};

export default TrainingModuleCard;
