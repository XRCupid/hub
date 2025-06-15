import React, { useState, useEffect } from 'react';
import { COACHES, CoachProfile, getCoachById } from '../config/coachConfig';
import { getModulesByCoach, TrainingModule, UserProgress, isModuleUnlocked } from '../config/trainingModules';
import CoachSelection from './CoachSelection';
import TrainingModuleCard from './TrainingModuleCard';
import TrackingDashboard from './TrackingDashboard';
import './TrainingHub.css';
import { useNavigate } from 'react-router-dom';
import BasicNPCScenarios from './BasicNPCScenarios';
import { PerformanceAnalytics } from '../utils/performanceAnalytics';

// Mock user progress - in production this would come from a database
const mockUserProgress: UserProgress[] = [];

interface TrainingHubProps {
  onStartModule?: (module: TrainingModule, coach: CoachProfile) => void;
}

const TrainingHub: React.FC<TrainingHubProps> = ({ onStartModule }) => {
  const [selectedCoach, setSelectedCoach] = useState<CoachProfile | null>(null);
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress[]>(mockUserProgress);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showNPCScenarios, setShowNPCScenarios] = useState(false);
  const [performanceAnalytics] = useState(new PerformanceAnalytics());
  const navigate = useNavigate();

  const handleCoachSelect = (coach: CoachProfile) => {
    setSelectedCoach(coach);
    setSelectedModule(null);
    setShowDashboard(false);
  };

  const handleModuleStart = (module: TrainingModule) => {
    setSelectedModule(module);
    if (onStartModule && selectedCoach) {
      onStartModule(module, selectedCoach);
    }
  };

  const modules = selectedCoach ? getModulesByCoach(selectedCoach.id) : [];

  // Mock tracking data for demo
  const mockMetrics = selectedModule ? selectedModule.trackingMetrics.map(metric => ({
    metric,
    currentValue: Math.random() * (metric.idealRange?.max || 10),
    history: []
  })) : [];

  return (
    <div className="training-hub">
      <div className="hub-header">
        <h1>XRCupid Training Hub</h1>
        <p className="hub-subtitle">Master the art of romance with personalized coaching</p>
        <button 
          className="hume-test-btn"
          onClick={() => navigate('/hume-test')}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
            border: 'none',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          🧪 Hume AI Test
        </button>
      </div>

      {!selectedCoach ? (
        <CoachSelection 
          onSelectCoach={handleCoachSelect}
          selectedCoachId={undefined}
        />
      ) : (
        <div className="training-content">
          <div className="selected-coach-header">
            <div className="coach-info">
              <h2>Training with {selectedCoach.name}</h2>
              <p>{selectedCoach.personality} coach</p>
            </div>
            <div className="coach-actions">
              <button 
                className="live-session-btn"
                onClick={() => navigate(`/coach-call/${selectedCoach.id}`)}
              >
                Start Live Session
              </button>
              <button 
                className="change-coach-btn"
                onClick={() => setSelectedCoach(null)}
              >
                Change Coach
              </button>
            </div>
          </div>

          <div className="training-layout">
            <div className="training-sections">
              <div 
                className="training-section modules" 
                onClick={() => setShowDashboard(true)}
              >
                <div className="section-icon">📚</div>
                <h3>Training Modules</h3>
                <p>Learn the fundamentals of romance and relationships</p>
                <div className="section-features">
                  <span>• Emotional Intelligence</span>
                  <span>• Communication Skills</span>
                  <span>• Conflict Resolution</span>
                </div>
              </div>
              <div 
                className="training-section npc-practice" 
                onClick={() => setShowNPCScenarios(true)}
              >
                <div className="section-icon">🎭</div>
                <h3>Practice Dating Scenarios</h3>
                <p>Safe practice with AI dates to build confidence</p>
                <div className="section-features">
                  <span>• Rejection handling</span>
                  <span>• Emotional regulation</span>
                  <span>• Reading interest levels</span>
                </div>
              </div>
              <div className="training-section analytics">
                <div className="section-icon">📊</div>
                <h3>Your Progress</h3>
                <div className="progress-summary">
                  <div className="progress-item">
                    <span>Sessions Completed:</span>
                    <span>{performanceAnalytics.getUserHistory('current_user').length}</span>
                  </div>
                  <div className="progress-item">
                    <span>Current Level:</span>
                    <span>Foundation</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedModule && (
              <div className="module-details">
                <div className="details-header">
                  <h3>Module: {selectedModule.name}</h3>
                  <button 
                    className="dashboard-toggle"
                    onClick={() => setShowDashboard(!showDashboard)}
                  >
                    {showDashboard ? 'Hide' : 'Show'} Live Tracking
                  </button>
                </div>

                <div className="module-exercises">
                  <h4>Exercises in this module:</h4>
                  {selectedModule.exercises.map((exercise, index) => (
                    <div key={exercise.id} className="exercise-item">
                      <span className="exercise-number">{index + 1}</span>
                      <div className="exercise-info">
                        <h5>{exercise.name}</h5>
                        <p>{exercise.instructions}</p>
                        <span className="exercise-duration">{exercise.duration}s</span>
                      </div>
                    </div>
                  ))}
                </div>

                {showDashboard && (
                  <TrackingDashboard
                    metrics={mockMetrics}
                    coachColor={selectedCoach.color}
                    sessionActive={false}
                  />
                )}

                <div className="module-actions">
                  <button 
                    className="start-training-btn"
                    style={{ backgroundColor: selectedCoach.color }}
                    onClick={() => {
                      // This would navigate to the actual training session
                      console.log('Starting training:', selectedModule.name);
                      if (onStartModule && selectedCoach) {
                        onStartModule(selectedModule, selectedCoach);
                      }
                    }}
                  >
                    Start Training Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {showNPCScenarios && (
        <div className="modal-overlay" onClick={() => setShowNPCScenarios(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-button" 
              onClick={() => setShowNPCScenarios(false)}
            >
              ×
            </button>
            <BasicNPCScenarios />
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingHub;
