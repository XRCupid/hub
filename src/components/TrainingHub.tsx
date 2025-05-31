import React, { useState, useEffect } from 'react';
import { COACHES, CoachProfile, getCoachById } from '../config/coachConfig';
import { getModulesByCoach, TrainingModule, UserProgress, isModuleUnlocked } from '../config/trainingModules';
import CoachSelection from './CoachSelection';
import TrainingModuleCard from './TrainingModuleCard';
import TrackingDashboard from './TrackingDashboard';
import './TrainingHub.css';

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
      </div>

      {!selectedCoach ? (
        <CoachSelection 
          onSelectCoach={handleCoachSelect}
          selectedCoachId={undefined}
        />
      ) : (
        <div className="training-content">
          <div className="coach-info-bar" style={{ backgroundColor: selectedCoach.color }}>
            <div className="coach-details">
              <h2>Training with {selectedCoach.name}</h2>
              <p>{selectedCoach.personality} coach</p>
            </div>
            <button 
              className="change-coach-btn"
              onClick={() => setSelectedCoach(null)}
            >
              Change Coach
            </button>
          </div>

          <div className="training-layout">
            <div className="modules-section">
              <h3>Available Training Modules</h3>
              <div className="modules-grid">
                {modules.map(module => {
                  const progress = userProgress.find(p => p.moduleId === module.id);
                  const unlocked = isModuleUnlocked(module.id, userProgress);
                  
                  return (
                    <TrainingModuleCard
                      key={module.id}
                      module={module}
                      userProgress={progress}
                      isUnlocked={unlocked}
                      coachColor={selectedCoach.color}
                      onStartModule={handleModuleStart}
                    />
                  );
                })}
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
    </div>
  );
};

export default TrainingHub;
