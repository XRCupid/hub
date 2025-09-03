import React, { useState } from 'react';
import {
  CURRICULUM_STRUCTURE,
  ETHICAL_PRINCIPLES,
  PERFORMANCE_METRICS,
  CurriculumModule,
  Lesson,
  getAllLessons,
  getTotalLessonCount
} from '../config/curriculumStructure';
import './CurriculumNavigator.css';

interface CurriculumNavigatorProps {
  selectedCoach?: 'grace' | 'posie' | 'rizzo';
  userProgress?: {
    completedModules: string[];
    currentMetrics: Record<string, number>;
  };
}

export const CurriculumNavigator: React.FC<CurriculumNavigatorProps> = ({
  selectedCoach = 'grace',
  userProgress = { completedModules: [], currentMetrics: {} }
}) => {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [showEthicsPanel, setShowEthicsPanel] = useState(false);
  const [currentCoach, setCurrentCoach] = useState<'grace' | 'posie' | 'rizzo'>(selectedCoach);

  // Get the comprehensive curriculum structure
  const curriculum = CURRICULUM_STRUCTURE;
  const totalLessons = getTotalLessonCount();
  const allLessons = getAllLessons();
  
  // Debug logging
  console.log('Curriculum data:', curriculum);
  console.log('Current coach:', currentCoach);
  console.log('Total lessons:', totalLessons);
  console.log('Current coach data:', curriculum[currentCoach]);

  const renderModule = (module: any, level: string, coachName: string) => {
    const isCompleted = userProgress.completedModules.includes(module.id);
    const isLocked = level === 'intermediate' && userProgress.completedModules.length < 2 ||
                     level === 'advanced' && userProgress.completedModules.length < 4;

    return (
      <div
        key={`${coachName}-${module.id}`}
        className={`module-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`}
        onClick={() => !isLocked && setSelectedModule(module.id)}
      >
        <h4>{module.title}</h4>
        <div className="module-lessons">
          {module.lessons.map((lessonName: string, idx: number) => (
            <div key={idx} className="lesson-preview">
              <h5>{lessonName}</h5>
              <p>{coachName} • {level}</p>
            </div>
          ))}
        </div>
        <div className="module-info">
          <span className="lesson-count">{module.lessons.length} lessons</span>
          <span className="coach-name">{coachName}</span>
        </div>
        {isCompleted && <div className="completion-badge">✓ Completed</div>}
        {isLocked && <div className="lock-icon">🔒</div>}
      </div>
    );
  };

  const renderPerformanceBar = (metricName: string, value: number) => {
    const metric = PERFORMANCE_METRICS[metricName as keyof typeof PERFORMANCE_METRICS];
    if (!metric || !metric.idealRange) return null;

    const [min, max] = metric.idealRange;
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

  const renderCoachSelector = () => {
    return (
      <div className="coach-selector">
        {Object.entries(curriculum).map(([coachId, coach]) => (
          <button
            key={coachId}
            className={`coach-btn ${currentCoach === coachId ? 'active' : ''}`}
            onClick={() => setCurrentCoach(coachId as 'grace' | 'posie' | 'rizzo')}
          >
            <div className="coach-avatar">👩‍🏫</div>
            <div className="coach-info">
              <h4>{coach.name}</h4>
              <p>{coach.focus}</p>
            </div>
          </button>
        ))}
      </div>
    );
  };

  const getCurrentCoachData = () => {
    return curriculum[currentCoach];
  };

  return (
    <div className="curriculum-navigator">
      <div className="navigator-header">
        <h1>XRCupid Curriculum</h1>
        <div className="curriculum-stats">
          <span className="stat">{totalLessons} Total Lessons</span>
          <span className="stat">3 Expert Coaches</span>
          <span className="stat">9 Modules</span>
        </div>
      </div>

      {renderCoachSelector()}

      <div className="curriculum-content">
        <div className="coach-header">
          <h2>{getCurrentCoachData().name} - {getCurrentCoachData().focus}</h2>
        </div>

        <div className="curriculum-levels">
          {Object.entries(getCurrentCoachData().modules).map(([level, modules]) => (
            <div key={level} className="level-section">
              <h3>{level.charAt(0).toUpperCase() + level.slice(1)} Level</h3>
              <div className="modules-grid">
                {modules.map((module: any) => 
                  renderModule(module, level, getCurrentCoachData().name)
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="curriculum-overview">
        <h3>All Courses Overview</h3>
        <div className="courses-summary">
          {allLessons.map((courseGroup, idx) => (
            <div key={idx} className="course-group">
              <h4>{courseGroup.coach} - {courseGroup.module}</h4>
              <div className="course-lessons">
                {courseGroup.lessons.map((lesson, lessonIdx) => (
                  <span key={lessonIdx} className="lesson-tag">{lesson}</span>
                ))}
              </div>
            </div>
          ))}
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
              {Object.keys(userProgress.currentMetrics).length > 0 ? Math.round(
                Object.values(userProgress.currentMetrics).reduce((a, b) => a + b, 0) / 
                Object.keys(PERFORMANCE_METRICS).length * 100
              ) : 0}%
            </span>
            <span className="stat-label">Overall Performance</span>
          </div>
        </div>
      </div>
    </div>
  );
};
