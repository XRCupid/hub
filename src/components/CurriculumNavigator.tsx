import React, { useState } from 'react';
import {
  CURRICULUM_STRUCTURE,
  ETHICAL_PRINCIPLES,
  PERFORMANCE_METRICS,
  CurriculumModule
} from '../config/curriculumStructure';
import './CurriculumNavigator.css';

interface CurriculumNavigatorProps {
  selectedCoach: 'grace' | 'posie' | 'rizzo';
  userProgress?: {
    completedModules: string[];
    currentMetrics: Record<string, number>;
  };
}

export const CurriculumNavigator: React.FC<CurriculumNavigatorProps> = ({
  selectedCoach,
  userProgress = { completedModules: [], currentMetrics: {} }
}) => {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [showEthicsPanel, setShowEthicsPanel] = useState(false);

  const curriculum = CURRICULUM_STRUCTURE[selectedCoach];

  const renderModule = (module: any, level: string) => {
    const isCompleted = userProgress.completedModules.includes(module.id);
    const isLocked = level === 'intermediate' && userProgress.completedModules.length < 2 ||
                     level === 'advanced' && userProgress.completedModules.length < 4;

    return (
      <div
        key={module.id}
        className={`module-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`}
        onClick={() => !isLocked && setSelectedModule(module.id)}
      >
        <h4>{module.title}</h4>
        <div className="module-lessons">
          {module.lessons.map((lesson: string, idx: number) => (
            <div key={idx} className="lesson-preview">
              • {lesson}
            </div>
          ))}
        </div>
        {isCompleted && <div className="completion-badge">✓ Completed</div>}
        {isLocked && <div className="lock-icon">🔒</div>}
      </div>
    );
  };

  const renderMetrics = () => {
    return (
      <div className="metrics-panel">
        <h3>Your Performance Metrics</h3>
        {Object.entries(PERFORMANCE_METRICS).map(([key, metric]) => {
          const value = userProgress.currentMetrics[key] || 0;
          const inRange = value >= metric.idealRange[0] && value <= metric.idealRange[1];
          
          return (
            <div key={key} className="metric-item">
              <div className="metric-header">
                <span className="metric-name">{metric.name}</span>
                <span className={`metric-value ${inRange ? 'good' : 'needs-work'}`}>
                  {(value * 100).toFixed(0)}%
                </span>
              </div>
              <div className="metric-description">{metric.description}</div>
              <div className="metric-bar">
                <div className="ideal-range" 
                     style={{
                       left: `${metric.idealRange[0] * 100}%`,
                       width: `${(metric.idealRange[1] - metric.idealRange[0]) * 100}%`
                     }}
                />
                <div className="current-value" 
                     style={{ left: `${value * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderEthicsPanel = () => {
    return (
      <div className={`ethics-panel ${showEthicsPanel ? 'visible' : ''}`}>
        <button 
          className="ethics-toggle"
          onClick={() => setShowEthicsPanel(!showEthicsPanel)}
        >
          {showEthicsPanel ? '✕' : '⚖️'} Ethics Guide
        </button>
        
        {showEthicsPanel && (
          <div className="ethics-content">
            <h3>Our Ethical Principles</h3>
            {Object.entries(ETHICAL_PRINCIPLES).map(([key, principle]) => (
              <div key={key} className="principle">
                <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>
                <p>{principle}</p>
              </div>
            ))}
            
            <div className="ethics-reminder">
              <h4>Remember:</h4>
              <ul>
                <li>These skills are for building genuine connections</li>
                <li>Respect and consent are non-negotiable</li>
                <li>The goal is mutual enjoyment, not conquest</li>
                <li>Your growth should enhance, not manipulate</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="curriculum-navigator">
      <div className="coach-header">
        <h2>{curriculum.name}'s Curriculum</h2>
        <p className="coach-focus">{curriculum.focus}</p>
      </div>

      <div className="curriculum-levels">
        <div className="level-section">
          <h3>Foundation Level</h3>
          <div className="modules-grid">
            {curriculum.modules.foundation.map(module => 
              renderModule(module, 'foundation')
            )}
          </div>
        </div>

        <div className="level-section">
          <h3>Intermediate Level</h3>
          <div className="modules-grid">
            {curriculum.modules.intermediate.map(module => 
              renderModule(module, 'intermediate')
            )}
          </div>
        </div>

        <div className="level-section">
          <h3>Advanced Level</h3>
          <div className="modules-grid">
            {curriculum.modules.advanced.map(module => 
              renderModule(module, 'advanced')
            )}
          </div>
        </div>
      </div>

      {renderMetrics()}
      {renderEthicsPanel()}

      <div className="progress-summary">
        <h3>Your Progress</h3>
        <div className="progress-stats">
          <div className="stat">
            <span className="stat-value">{userProgress.completedModules.length}</span>
            <span className="stat-label">Modules Completed</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {Math.round(
                Object.values(userProgress.currentMetrics).reduce((a, b) => a + b, 0) / 
                Object.keys(PERFORMANCE_METRICS).length * 100
              )}%
            </span>
            <span className="stat-label">Overall Performance</span>
          </div>
        </div>
      </div>
    </div>
  );
};
