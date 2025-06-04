import React from 'react';
import { COACHES, CoachProfile } from '../config/coachConfig';
import RisographAngel from './RisographAngel';
import RisographHeart from './RisographHeart';
import './CoachSelection.css';

interface CoachSelectionProps {
  onSelectCoach: (coach: CoachProfile) => void;
  selectedCoachId?: string;
}

const CoachSelection: React.FC<CoachSelectionProps> = ({ onSelectCoach, selectedCoachId }) => {
  const coaches = Object.values(COACHES);

  return (
    <div className="coach-selection-container risograph-container">
      <div className="selection-hero">
        <RisographAngel size={100} className="hero-angel-small" />
        <h2 className="coach-selection-title offset-text">
          <span className="title-main">Choose Your Dating Coach</span>
          <RisographHeart size={35} className="title-heart" animated />
        </h2>
        <p className="coach-selection-subtitle">Each coach specializes in different aspects of romance</p>
      </div>
      
      <div className="coach-cards">
        {coaches.map((coach) => (
          <div 
            key={coach.id} 
            className={`coach-card riso-card ${selectedCoachId === coach.id ? 'selected' : ''}`}
            onClick={() => onSelectCoach(coach)}
            style={{ borderColor: coach.color }}
          >
            <div className="coach-card-decoration">
              <RisographHeart size={20} />
            </div>
            <div className="coach-card-header" style={{ backgroundColor: coach.color }}>
              <h3>{coach.name}</h3>
            </div>
            
            <div className="coach-card-body">
              <p className="coach-description">{coach.description}</p>
              
              <div className="coach-specialties">
                <h4>Specializes in:</h4>
                <div className="specialty-tags">
                  {coach.specialty.slice(0, 3).map((spec, index) => (
                    <span key={index} className="specialty-tag" style={{ backgroundColor: `${coach.color}20`, color: coach.color }}>
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="coach-personality">
                <span className="personality-badge" style={{ color: coach.color }}>
                  {coach.personality} personality
                </span>
              </div>
            </div>
            
            <div className="coach-card-footer">
              <button 
                className="select-coach-btn"
                style={{ 
                  backgroundColor: selectedCoachId === coach.id ? coach.color : 'transparent',
                  borderColor: coach.color,
                  color: selectedCoachId === coach.id ? 'white' : coach.color
                }}
              >
                {selectedCoachId === coach.id ? 'Selected' : 'Select Coach'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoachSelection;
