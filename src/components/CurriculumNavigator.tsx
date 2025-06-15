import React, { useState } from 'react';
import {
  CURRICULUM_STRUCTURE,
  ETHICAL_PRINCIPLES,
  PERFORMANCE_METRICS,
  CurriculumModule,
  Lesson
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

  // Use simplified curriculum structure
  const curriculum = CURRICULUM_STRUCTURE;

  const renderModule = (module: CurriculumModule, level: string) => {
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
          {module.lessons.map((lesson: Lesson, idx: number) => (
            <div key={lesson.id || idx} className="lesson-preview">
              <h4>{lesson.title}</h4>
              <p>{lesson.description}</p>
            </div>
          ))}
        </div>
        {isCompleted && <div className="completion-badge">✓ Completed</div>}
        {isLocked && <div className="lock-icon">🔒</div>}
      </div>
    );
  };

  const renderPerformanceBar = (metricName: string, value: number) => {
    const metric = PERFORMANCE_METRICS[metricName as keyof typeof PERFORMANCE_METRICS];
    if (!metric || !metric.idealRange) return null;

    const { min, max } = metric.idealRange;
    const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
    
    return (
      <div className="performance-bar">
        <div className="bar-track">
          <div 
            className="bar-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="bar-value">{value}%</span>
      </div>
    );
  };

  const renderCurrentMetrics = () => {
    if (!userProgress.currentMetrics || Object.keys(userProgress.currentMetrics).length === 0) {
      return (
        <div className="current-metrics">
          <h4>Current Performance</h4>
          <p>Complete lessons to see your performance metrics</p>
        </div>
      );
    }

    return (
      <div className="current-metrics">
        <h4>Current Performance</h4>
        {Object.entries(userProgress.currentMetrics).map(([key, value]) => (
          <div key={key} className="metric-item">
            <span className="metric-name">{PERFORMANCE_METRICS[key as keyof typeof PERFORMANCE_METRICS]?.name || key}</span>
            {renderPerformanceBar(key, value as number)}
          </div>
        ))}
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
        <h2>Curriculum</h2>
        <p className="coach-focus"></p>
      </div>

      <div className="curriculum-levels">
        <div className="level-section">
          <h3>Foundation Level</h3>
          <div className="modules-grid">
            {curriculum.foundation.map((module: CurriculumModule) => 
              renderModule(module, 'foundation')
            )}
          </div>
        </div>

        <div className="level-section">
          <h3>Intermediate Level</h3>
          <div className="modules-grid">
            {curriculum.intermediate.map((module: CurriculumModule) => 
              renderModule(module, 'intermediate')
            )}
          </div>
        </div>

        <div className="level-section">
          <h3>Advanced Level</h3>
          <div className="modules-grid">
            {curriculum.advanced.map((module: CurriculumModule) => 
              renderModule(module, 'advanced')
            )}
          </div>
        </div>
      </div>

      {renderCurrentMetrics()}
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
