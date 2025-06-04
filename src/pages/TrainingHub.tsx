import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COACHES } from '../config/coachConfig';
import { NPCPersonalities } from '../config/NPCPersonalities';
import './TrainingHub.css';

interface TrainingSection {
  type: 'coach' | 'npc';
  title: string;
  subtitle: string;
  items: any[];
}

const TrainingHub: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'coaches' | 'dates'>('coaches');

  const coachLessons = Object.values(COACHES).map(coach => ({
    ...coach,
    lessons: [
      { id: `${coach.id}-intro`, title: 'Introduction & Basics', duration: '15 min', difficulty: 'Beginner' },
      { id: `${coach.id}-advanced`, title: 'Advanced Techniques', duration: '20 min', difficulty: 'Intermediate' }
    ]
  }));

  const npcDates = Object.values(NPCPersonalities).slice(0, 6); // Show first 6 NPCs

  const handleCoachLesson = (coachId: string, lessonId: string) => {
    navigate(`/coach-session/${coachId}/${lessonId}`);
  };

  const handleNPCDate = (npcId: string) => {
    navigate(`/practice-date/${npcId}`);
  };

  const handleQuickCall = (coachId: string) => {
    navigate(`/immersive-coach-call/${coachId}`);
  };

  return (
    <div className="training-hub">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">XR Cupid Training Center</h1>
          <p className="hero-subtitle">Master the art of connection with personalized coaching</p>
          
          <div className="section-tabs">
            <button 
              className={`tab ${activeSection === 'coaches' ? 'active' : ''}`}
              onClick={() => setActiveSection('coaches')}
            >
              <span className="tab-icon">🎓</span>
              Coach Lessons
            </button>
            <button 
              className={`tab ${activeSection === 'dates' ? 'active' : ''}`}
              onClick={() => setActiveSection('dates')}
            >
              <span className="tab-icon">💝</span>
              Practice Dates
            </button>
          </div>
        </div>
        
        <div className="hero-decoration">
          <div className="floating-heart">💕</div>
          <div className="floating-star">✨</div>
        </div>
      </div>

      {/* Coaches Section */}
      {activeSection === 'coaches' && (
        <div className="coaches-section">
          <h2 className="section-title">Meet Your Dating Coaches</h2>
          <div className="coaches-grid">
            {coachLessons.map((coach) => (
              <div key={coach.id} className="coach-card" style={{ '--coach-color': coach.color } as React.CSSProperties}>
                <div className="coach-header">
                  <div className="coach-avatar">
                    <img src={`/avatars/${coach.id}_thumbnail.png`} alt={coach.name} />
                  </div>
                  <div className="coach-info">
                    <h3>{coach.name}</h3>
                    <p className="coach-specialty">{coach.specialty.slice(0, 3).join(' • ')}</p>
                  </div>
                </div>
                
                <p className="coach-description">{coach.description}</p>
                
                <div className="coach-lessons">
                  <h4>Available Lessons</h4>
                  {coach.lessons.map((lesson) => (
                    <div key={lesson.id} className="lesson-item">
                      <div className="lesson-info">
                        <span className="lesson-title">{lesson.title}</span>
                        <span className="lesson-meta">
                          <span className="duration">{lesson.duration}</span>
                          <span className="difficulty">{lesson.difficulty}</span>
                        </span>
                      </div>
                      <button 
                        className="lesson-button"
                        onClick={() => handleCoachLesson(coach.id, lesson.id)}
                      >
                        Start
                      </button>
                    </div>
                  ))}
                </div>
                
                <button 
                  className="quick-call-button"
                  onClick={() => handleQuickCall(coach.id)}
                >
                  <span className="call-icon">📞</span>
                  Quick Call with {coach.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Practice Dates Section */}
      {activeSection === 'dates' && (
        <div className="dates-section">
          <h2 className="section-title">Practice Your Skills</h2>
          <p className="section-description">
            Meet diverse personalities and practice your dating skills in a safe environment
          </p>
          
          <div className="dates-grid">
            {npcDates.map((npc) => (
              <div key={npc.id} className="date-card">
                <div className="date-header">
                  <div className="date-avatar">
                    <div className="avatar-placeholder">
                      {npc.name[0]}
                    </div>
                  </div>
                  <div className="date-info">
                    <h3>{npc.name}, {npc.age}</h3>
                    <p className="occupation">{npc.occupation}</p>
                  </div>
                </div>
                
                <div className="personality-tags">
                  {npc.personality.split(', ').map((trait, idx) => (
                    <span key={idx} className="tag">{trait}</span>
                  ))}
                </div>
                
                <div className="interests">
                  <h4>Interests</h4>
                  <p>{npc.interests.slice(0, 3).join(' • ')}</p>
                </div>
                
                <p className="conversation-style">
                  <em>"{npc.conversationStyle}"</em>
                </p>
                
                <button 
                  className="date-button"
                  onClick={() => handleNPCDate(npc.id)}
                >
                  Start Practice Date
                </button>
              </div>
            ))}
          </div>
          
          <div className="date-tips">
            <h3>💡 Dating Tips</h3>
            <div className="tips-grid">
              <div className="tip">
                <span className="tip-icon">👀</span>
                <p>Practice maintaining eye contact for 3-5 seconds at a time</p>
              </div>
              <div className="tip">
                <span className="tip-icon">😊</span>
                <p>Mirror their energy level and conversation pace</p>
              </div>
              <div className="tip">
                <span className="tip-icon">❓</span>
                <p>Ask open-ended questions that invite sharing</p>
              </div>
              <div className="tip">
                <span className="tip-icon">🎯</span>
                <p>Be genuinely curious about their passions</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <button 
          className="action-button primary"
          onClick={() => navigate('/self-assessment')}
        >
          <span className="icon">📊</span>
          Take Self Assessment
        </button>
        <button 
          className="action-button secondary"
          onClick={() => navigate('/progress')}
        >
          <span className="icon">📈</span>
          View Progress
        </button>
        <button 
          className="action-button secondary"
          onClick={() => navigate('/settings')}
        >
          <span className="icon">⚙️</span>
          Settings
        </button>
      </div>
    </div>
  );
};

export default TrainingHub;
