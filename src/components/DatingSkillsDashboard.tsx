import React, { useState, useEffect } from 'react';
import './DatingSkillsDashboard.css';

interface SkillProgress {
  id: string;
  name: string;
  category: 'embodiment' | 'perception' | 'conversation' | 'digital';
  currentLevel: number;
  maxLevel: number;
  xp: number;
  xpToNext: number;
  lastPracticed: Date | null;
  achievements: string[];
  weaknesses: string[];
  strengths: string[];
}

interface CourtingStage {
  id: string;
  name: string;
  description: string;
  skills: string[];
  unlocked: boolean;
  completed: boolean;
  currentStep: number;
  totalSteps: number;
  scenarios: string[];
}

interface UserStats {
  totalXP: number;
  level: number;
  datesSimulated: number;
  conversationsCompleted: number;
  rizzScore: number;
  confidenceLevel: number;
  successRate: number;
  streakDays: number;
}

const INITIAL_SKILLS: SkillProgress[] = [
  // Embodiment Skills
  {
    id: 'posture',
    name: 'Confident Posture',
    category: 'embodiment',
    currentLevel: 1,
    maxLevel: 10,
    xp: 150,
    xpToNext: 350,
    lastPracticed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    achievements: ['First Practice'],
    weaknesses: ['Shoulder tension', 'Forward head posture'],
    strengths: ['Good stance width']
  },
  {
    id: 'eye-contact',
    name: 'Eye Contact Mastery',
    category: 'embodiment',
    currentLevel: 2,
    maxLevel: 10,
    xp: 280,
    xpToNext: 220,
    lastPracticed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    achievements: ['First Practice', 'Consistent Gaze'],
    weaknesses: ['Looking away during pauses'],
    strengths: ['Natural blink rate', 'Warm expressions']
  },
  {
    id: 'gestures',
    name: 'Expressive Gestures',
    category: 'embodiment',
    currentLevel: 1,
    maxLevel: 10,
    xp: 75,
    xpToNext: 425,
    lastPracticed: null,
    achievements: [],
    weaknesses: ['Stiff hand movements'],
    strengths: []
  },
  // Perception Skills
  {
    id: 'social-cues',
    name: 'Social Cue Reading',
    category: 'perception',
    currentLevel: 3,
    maxLevel: 10,
    xp: 420,
    xpToNext: 80,
    lastPracticed: new Date(),
    achievements: ['First Practice', 'Emotion Detective', 'Micro-expression Master'],
    weaknesses: ['Subtle discomfort signals'],
    strengths: ['Interest level detection', 'Comfort assessment']
  },
  {
    id: 'emotional-intelligence',
    name: 'Emotional Intelligence',
    category: 'perception',
    currentLevel: 2,
    maxLevel: 10,
    xp: 310,
    xpToNext: 190,
    lastPracticed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    achievements: ['First Practice', 'Empathy Builder'],
    weaknesses: ['Managing own emotions under pressure'],
    strengths: ['Reading emotional states', 'Appropriate responses']
  },
  // Conversation Skills
  {
    id: 'active-listening',
    name: 'Active Listening',
    category: 'conversation',
    currentLevel: 4,
    maxLevel: 10,
    xp: 580,
    xpToNext: 120,
    lastPracticed: new Date(),
    achievements: ['First Practice', 'Great Listener', 'Conversation Flow', 'Deep Connection'],
    weaknesses: ['Interrupting when excited'],
    strengths: ['Reflective responses', 'Follow-up questions', 'Memory for details']
  },
  {
    id: 'storytelling',
    name: 'Engaging Storytelling',
    category: 'conversation',
    currentLevel: 2,
    maxLevel: 10,
    xp: 240,
    xpToNext: 260,
    lastPracticed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    achievements: ['First Practice', 'Story Bank Builder'],
    weaknesses: ['Pacing', 'Ending stories effectively'],
    strengths: ['Vivid details', 'Emotional connection']
  },
  {
    id: 'humor',
    name: 'Humor & Timing',
    category: 'conversation',
    currentLevel: 1,
    maxLevel: 10,
    xp: 90,
    xpToNext: 410,
    lastPracticed: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    achievements: ['First Practice'],
    weaknesses: ['Timing', 'Reading the room'],
    strengths: ['Self-deprecating humor']
  },
  // Digital Skills
  {
    id: 'messaging',
    name: 'Messaging Mastery',
    category: 'digital',
    currentLevel: 3,
    maxLevel: 10,
    xp: 450,
    xpToNext: 50,
    lastPracticed: new Date(),
    achievements: ['First Practice', 'Conversation Starter', 'Rizz Master'],
    weaknesses: ['Emoji usage', 'Message length'],
    strengths: ['Opening lines', 'Building rapport', 'Question crafting']
  },
  {
    id: 'phone-skills',
    name: 'Phone Conversation',
    category: 'digital',
    currentLevel: 1,
    maxLevel: 10,
    xp: 120,
    xpToNext: 380,
    lastPracticed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    achievements: ['First Practice'],
    weaknesses: ['Voice confidence', 'Awkward pauses'],
    strengths: ['Warm tone']
  }
];

const COURTING_STAGES: CourtingStage[] = [
  {
    id: 'profile-optimization',
    name: 'Profile Optimization',
    description: 'Create an irresistible dating profile that attracts your ideal matches',
    skills: ['storytelling', 'humor'],
    unlocked: true,
    completed: true,
    currentStep: 5,
    totalSteps: 5,
    scenarios: ['Photo selection', 'Bio writing', 'Interest curation']
  },
  {
    id: 'matching-strategy',
    name: 'Strategic Matching',
    description: 'Learn to identify and match with compatible partners',
    skills: ['social-cues', 'emotional-intelligence'],
    unlocked: true,
    completed: false,
    currentStep: 2,
    totalSteps: 4,
    scenarios: ['Profile analysis', 'Compatibility assessment', 'Strategic swiping']
  },
  {
    id: 'first-message',
    name: 'First Message Mastery',
    description: 'Craft opening messages that get responses and start conversations',
    skills: ['messaging', 'humor', 'storytelling'],
    unlocked: true,
    completed: false,
    currentStep: 3,
    totalSteps: 6,
    scenarios: ['Observational openers', 'Question starters', 'Playful approaches']
  },
  {
    id: 'text-conversation',
    name: 'Text Conversation Building',
    description: 'Build rapport, create chemistry, and maintain engagement through messaging',
    skills: ['messaging', 'active-listening', 'emotional-intelligence'],
    unlocked: true,
    completed: false,
    currentStep: 4,
    totalSteps: 8,
    scenarios: ['Rapport building', 'Flirtation', 'Deep conversations', 'Conflict resolution']
  },
  {
    id: 'phone-transition',
    name: 'Phone Call Transition',
    description: 'Successfully move from texting to voice conversations',
    skills: ['phone-skills', 'active-listening', 'humor'],
    unlocked: false,
    completed: false,
    currentStep: 0,
    totalSteps: 5,
    scenarios: ['Suggesting the call', 'First phone conversation', 'Video chat']
  },
  {
    id: 'date-planning',
    name: 'Date Planning & Setup',
    description: 'Plan and coordinate the perfect first date',
    skills: ['messaging', 'emotional-intelligence'],
    unlocked: false,
    completed: false,
    currentStep: 0,
    totalSteps: 4,
    scenarios: ['Date suggestions', 'Logistics coordination', 'Pre-date communication']
  },
  {
    id: 'first-date',
    name: 'First Date Excellence',
    description: 'Master in-person chemistry and connection',
    skills: ['posture', 'eye-contact', 'gestures', 'active-listening', 'storytelling', 'social-cues'],
    unlocked: false,
    completed: false,
    currentStep: 0,
    totalSteps: 10,
    scenarios: ['Arrival & greeting', 'Conversation flow', 'Physical escalation', 'Date ending']
  }
];

const USER_STATS: UserStats = {
  totalXP: 2715,
  level: 8,
  datesSimulated: 12,
  conversationsCompleted: 47,
  rizzScore: 73,
  confidenceLevel: 68,
  successRate: 76,
  streakDays: 5
};

export const DatingSkillsDashboard: React.FC = () => {
  const [skills, setSkills] = useState<SkillProgress[]>(INITIAL_SKILLS);
  const [courtingStages, setCourtingStages] = useState<CourtingStage[]>(COURTING_STAGES);
  const [userStats, setUserStats] = useState<UserStats>(USER_STATS);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'journey' | 'practice'>('overview');
  const [selectedSkill, setSelectedSkill] = useState<SkillProgress | null>(null);

  const getSkillsByCategory = (category: string) => {
    return skills.filter(skill => skill.category === category);
  };

  const getOverallProgress = () => {
    const totalXP = skills.reduce((sum, skill) => sum + skill.xp, 0);
    const totalPossibleXP = skills.reduce((sum, skill) => sum + (skill.maxLevel * 500), 0);
    return Math.round((totalXP / totalPossibleXP) * 100);
  };

  const getNextUnlockedStage = () => {
    return courtingStages.find(stage => !stage.unlocked);
  };

  const renderOverview = () => (
    <div className="overview-tab">
      <div className="stats-grid">
        <div className="stat-card level-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Level {userStats.level}</h3>
            <p>{userStats.totalXP} XP Total</p>
            <div className="level-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${(userStats.totalXP % 500) / 5}%` }}
                />
              </div>
              <span>{userStats.totalXP % 500}/500 to Level {userStats.level + 1}</span>
            </div>
          </div>
        </div>

        <div className="stat-card rizz-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <h3>Rizz Score</h3>
            <div className="rizz-score">{userStats.rizzScore}</div>
            <p className="rizz-level">
              {userStats.rizzScore >= 80 ? 'Legendary' :
               userStats.rizzScore >= 60 ? 'Strong' :
               userStats.rizzScore >= 40 ? 'Developing' : 'Beginner'}
            </p>
          </div>
        </div>

        <div className="stat-card confidence-card">
          <div className="stat-icon">💪</div>
          <div className="stat-content">
            <h3>Confidence</h3>
            <div className="confidence-meter">
              <div 
                className="confidence-fill"
                style={{ width: `${userStats.confidenceLevel}%` }}
              />
            </div>
            <p>{userStats.confidenceLevel}% Confident</p>
          </div>
        </div>

        <div className="stat-card streak-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <h3>Practice Streak</h3>
            <div className="streak-number">{userStats.streakDays}</div>
            <p>Days in a row</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>🚀 Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-btn primary">
            <span className="action-icon">💬</span>
            <div>
              <h4>Continue Chat Practice</h4>
              <p>Practice messaging with Alex</p>
            </div>
          </button>
          
          <button className="action-btn">
            <span className="action-icon">📞</span>
            <div>
              <h4>Phone Call Training</h4>
              <p>Master voice conversations</p>
            </div>
          </button>
          
          <button className="action-btn">
            <span className="action-icon">🎭</span>
            <div>
              <h4>Date Simulation</h4>
              <p>Practice first date scenarios</p>
            </div>
          </button>
          
          <button className="action-btn">
            <span className="action-icon">📊</span>
            <div>
              <h4>Skill Assessment</h4>
              <p>Identify areas to improve</p>
            </div>
          </button>
        </div>
      </div>

      <div className="recent-achievements">
        <h3>🏆 Recent Achievements</h3>
        <div className="achievements-list">
          <div className="achievement">
            <span className="achievement-icon">🔥</span>
            <div>
              <h4>Rizz Master</h4>
              <p>Achieved 70+ rizz score in messaging</p>
              <span className="achievement-time">2 hours ago</span>
            </div>
          </div>
          
          <div className="achievement">
            <span className="achievement-icon">👁️</span>
            <div>
              <h4>Eye Contact Expert</h4>
              <p>Maintained 80%+ eye contact in simulation</p>
              <span className="achievement-time">1 day ago</span>
            </div>
          </div>
          
          <div className="achievement">
            <span className="achievement-icon">💬</span>
            <div>
              <h4>Deep Connection</h4>
              <p>Created emotional moment in conversation</p>
              <span className="achievement-time">3 days ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSkillsTab = () => (
    <div className="skills-tab">
      <div className="skills-overview">
        <h3>📈 Skills Progress Overview</h3>
        <div className="overall-progress">
          <div className="progress-circle">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e9ecef" strokeWidth="8"/>
              <circle 
                cx="50" cy="50" r="45" fill="none" stroke="#667eea" strokeWidth="8"
                strokeDasharray={`${getOverallProgress() * 2.83} 283`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="progress-text">
              <span className="progress-number">{getOverallProgress()}%</span>
              <span className="progress-label">Complete</span>
            </div>
          </div>
        </div>
      </div>

      <div className="skills-categories">
        {['embodiment', 'perception', 'conversation', 'digital'].map(category => (
          <div key={category} className="skill-category">
            <h4 className="category-title">
              {category === 'embodiment' ? '🕺 Embodiment' :
               category === 'perception' ? '🧠 Perception' :
               category === 'conversation' ? '💬 Conversation' : '📱 Digital'}
            </h4>
            
            <div className="skills-grid">
              {getSkillsByCategory(category).map(skill => (
                <div 
                  key={skill.id} 
                  className="skill-card"
                  onClick={() => setSelectedSkill(skill)}
                >
                  <div className="skill-header">
                    <h5>{skill.name}</h5>
                    <span className="skill-level">Lv. {skill.currentLevel}</span>
                  </div>
                  
                  <div className="skill-progress">
                    <div className="xp-bar">
                      <div 
                        className="xp-fill"
                        style={{ width: `${(skill.xp / (skill.xp + skill.xpToNext)) * 100}%` }}
                      />
                    </div>
                    <span className="xp-text">{skill.xp}/{skill.xp + skill.xpToNext} XP</span>
                  </div>
                  
                  <div className="skill-status">
                    {skill.lastPracticed ? (
                      <span className="last-practiced">
                        Last: {skill.lastPracticed.toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="never-practiced">Never practiced</span>
                    )}
                  </div>
                  
                  {skill.achievements.length > 0 && (
                    <div className="skill-achievements">
                      {skill.achievements.slice(0, 2).map((achievement, index) => (
                        <span key={index} className="mini-achievement">
                          🏆 {achievement}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderJourneyTab = () => (
    <div className="journey-tab">
      <h3>🗺️ Your Courting Journey</h3>
      <p>Master each stage to become a dating expert</p>
      
      <div className="journey-progress">
        <div className="journey-path">
          {courtingStages.map((stage, index) => (
            <div key={stage.id} className={`journey-stage ${stage.completed ? 'completed' : stage.unlocked ? 'active' : 'locked'}`}>
              <div className="stage-connector" />
              
              <div className="stage-content">
                <div className="stage-icon">
                  {stage.completed ? '✅' : stage.unlocked ? '🎯' : '🔒'}
                </div>
                
                <div className="stage-info">
                  <h4>{stage.name}</h4>
                  <p>{stage.description}</p>
                  
                  <div className="stage-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${(stage.currentStep / stage.totalSteps) * 100}%` }}
                      />
                    </div>
                    <span>{stage.currentStep}/{stage.totalSteps} steps</span>
                  </div>
                  
                  <div className="stage-skills">
                    <strong>Skills needed:</strong>
                    <div className="skills-tags">
                      {stage.skills.map(skillId => {
                        const skill = skills.find(s => s.id === skillId);
                        return skill ? (
                          <span key={skillId} className="skill-tag">
                            {skill.name} (Lv.{skill.currentLevel})
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                  
                  {stage.unlocked && (
                    <button className="stage-action-btn">
                      {stage.completed ? 'Review' : 'Continue'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPracticeTab = () => (
    <div className="practice-tab">
      <h3>🎯 Practice Recommendations</h3>
      
      <div className="practice-sections">
        <div className="urgent-practice">
          <h4>🚨 Needs Attention</h4>
          <div className="practice-cards">
            {skills
              .filter(skill => !skill.lastPracticed || 
                (new Date().getTime() - skill.lastPracticed.getTime()) > 3 * 24 * 60 * 60 * 1000)
              .slice(0, 3)
              .map(skill => (
                <div key={skill.id} className="practice-card urgent">
                  <h5>{skill.name}</h5>
                  <p>
                    {!skill.lastPracticed 
                      ? 'Never practiced' 
                      : `Last practiced ${Math.floor((new Date().getTime() - skill.lastPracticed.getTime()) / (24 * 60 * 60 * 1000))} days ago`
                    }
                  </p>
                  <button className="practice-btn">Practice Now</button>
                </div>
              ))}
          </div>
        </div>
        
        <div className="daily-challenges">
          <h4>📅 Today's Challenges</h4>
          <div className="challenges-list">
            <div className="challenge-item">
              <span className="challenge-icon">💬</span>
              <div>
                <h5>Conversation Starter Challenge</h5>
                <p>Practice 3 different opening lines with NPCs</p>
                <span className="challenge-reward">+50 XP</span>
              </div>
            </div>
            
            <div className="challenge-item">
              <span className="challenge-icon">👁️</span>
              <div>
                <h5>Eye Contact Mastery</h5>
                <p>Maintain 80%+ eye contact in a 5-minute conversation</p>
                <span className="challenge-reward">+75 XP</span>
              </div>
            </div>
            
            <div className="challenge-item">
              <span className="challenge-icon">📞</span>
              <div>
                <h5>Phone Confidence Builder</h5>
                <p>Complete a 10-minute phone simulation without awkward pauses</p>
                <span className="challenge-reward">+100 XP</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="skill-recommendations">
          <h4>📈 Skill Recommendations</h4>
          <div className="recommendations-grid">
            <div className="recommendation-card">
              <h5>Focus on Humor</h5>
              <p>Your humor timing needs work. Practice joke delivery and reading the room.</p>
              <div className="recommendation-actions">
                <button className="rec-btn primary">Start Humor Training</button>
                <button className="rec-btn">View Resources</button>
              </div>
            </div>
            
            <div className="recommendation-card">
              <h5>Strengthen Phone Skills</h5>
              <p>Great messaging skills! Time to level up your voice conversations.</p>
              <div className="recommendation-actions">
                <button className="rec-btn primary">Phone Practice</button>
                <button className="rec-btn">Voice Tips</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dating-skills-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>🎯 Dating Skills Dashboard</h1>
          <p>Your complete courting mastery journey</p>
        </div>
        
        <div className="header-stats">
          <div className="header-stat">
            <span className="stat-value">{userStats.level}</span>
            <span className="stat-label">Level</span>
          </div>
          <div className="header-stat">
            <span className="stat-value">{userStats.rizzScore}</span>
            <span className="stat-label">Rizz</span>
          </div>
          <div className="header-stat">
            <span className="stat-value">{userStats.streakDays}</span>
            <span className="stat-label">Streak</span>
          </div>
        </div>
      </div>

      <div className="dashboard-navigation">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={activeTab === 'skills' ? 'active' : ''}
          onClick={() => setActiveTab('skills')}
        >
          🎯 Skills
        </button>
        <button 
          className={activeTab === 'journey' ? 'active' : ''}
          onClick={() => setActiveTab('journey')}
        >
          🗺️ Journey
        </button>
        <button 
          className={activeTab === 'practice' ? 'active' : ''}
          onClick={() => setActiveTab('practice')}
        >
          💪 Practice
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'skills' && renderSkillsTab()}
        {activeTab === 'journey' && renderJourneyTab()}
        {activeTab === 'practice' && renderPracticeTab()}
      </div>
    </div>
  );
};

export default DatingSkillsDashboard;
