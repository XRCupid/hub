import React, { useState, useEffect } from 'react';
import '../styles/QuickStats.css';

interface UserStats {
  totalSessions: number;
  averageScore: number;
  topSkills: string[];
  areasToImprove: string[];
  streak: number;
}

const QuickStats: React.FC = () => {
  const [stats, setStats] = useState<UserStats>({
    totalSessions: 0,
    averageScore: 0,
    topSkills: [],
    areasToImprove: [],
    streak: 0
  });

  useEffect(() => {
    // Load stats from localStorage
    const loadStats = () => {
      const savedStats = localStorage.getItem('user_dating_stats');
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      } else {
        // Initialize with demo data
        const demoStats: UserStats = {
          totalSessions: 12,
          averageScore: 72,
          topSkills: ['Eye Contact', 'Active Listening', 'Humor'],
          areasToImprove: ['Opening Lines', 'Body Language', 'Story Telling'],
          streak: 3
        };
        setStats(demoStats);
        localStorage.setItem('user_dating_stats', JSON.stringify(demoStats));
      }
    };
    
    loadStats();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4ade80';
    if (score >= 60) return '#fbbf24';
    return '#f87171';
  };

  const getMotivationalMessage = () => {
    if (stats.averageScore >= 80) {
      return "You're crushing it! Keep up the amazing work! 🌟";
    } else if (stats.averageScore >= 60) {
      return "Great progress! You're getting more confident every day! 💪";
    }
    return "Keep practicing! Every session makes you better! 🚀";
  };

  return (
    <div className="quick-stats">
      <h2>Your Dating Skills Progress</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{stats.totalSessions}</div>
          <div className="stat-label">Practice Sessions</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value" style={{ color: getScoreColor(stats.averageScore) }}>
            {stats.averageScore}%
          </div>
          <div className="stat-label">Average Score</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-value">{stats.streak}</div>
          <div className="stat-label">Day Streak</div>
        </div>
      </div>
      
      <div className="skills-overview">
        <div className="skills-section">
          <h3>💪 Your Strengths</h3>
          <div className="skill-tags">
            {stats.topSkills.map((skill, index) => (
              <span key={index} className="skill-tag strength">
                {skill}
              </span>
            ))}
          </div>
        </div>
        
        <div className="skills-section">
          <h3>🎯 Focus Areas</h3>
          <div className="skill-tags">
            {stats.areasToImprove.map((area, index) => (
              <span key={index} className="skill-tag improvement">
                {area}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="motivational-message">
        <p>{getMotivationalMessage()}</p>
      </div>
      
      <div className="quick-actions">
        <button className="action-button primary">
          Start Practice Session
        </button>
        <button className="action-button secondary">
          Review Last Session
        </button>
      </div>
    </div>
  );
};

export default QuickStats;
