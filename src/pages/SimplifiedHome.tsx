import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SimplifiedHome.css';
import QuickStats from '../components/QuickStats';
import RisographAngel from '../components/RisographAngel';
import RisographHeart from '../components/RisographHeart';

const SimplifiedHome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="simplified-home">
      <div className="hero-section risograph-hero">
        <div className="angel-decoration-wrapper">
          <RisographAngel size={180} className="hero-angel" />
        </div>
        
        <div className="hero-content">
          <h1 className="app-title offset-text">
            <span className="title-main">XR Cupid</span>
            <RisographHeart size={50} className="title-heart" animated />
          </h1>
          <p className="tagline">Your Personal Dating Coach</p>
        </div>
        
        <div className="core-features">
          <div className="feature-card main riso-card">
            <div className="card-decoration">
              <RisographHeart size={30} />
            </div>
            <h2>🎯 Dating Coach</h2>
            <p>Practice conversations with AI-powered dating coaches who help you build confidence and charm</p>
            <button 
              className="btn-primary riso-button"
              onClick={() => navigate('/dating-simulation')}
            >
              Start Coaching Session
            </button>
          </div>

          <div className="feature-grid">
            <div className="feature-card riso-card">
              <h3>💬 Chat Practice</h3>
              <p>Master the art of digital conversation</p>
              <button className="btn-secondary" onClick={() => navigate('/chat-simulation')}>
                Practice Texting
              </button>
            </div>

            <div className="feature-card riso-card">
              <h3>📞 Phone Skills</h3>
              <p>Build confidence for voice calls</p>
              <button className="btn-secondary" onClick={() => navigate('/phone-training')}>
                Practice Calls
              </button>
            </div>

            <div className="feature-card riso-card">
              <h3>🎥 Video Dates</h3>
              <p>Perfect your video presence</p>
              <button className="btn-secondary" onClick={() => navigate('/rpm-test')}>
                Video Practice
              </button>
            </div>
          </div>
        </div>

        <div className="quick-links">
          <button 
            className="secondary-button"
            onClick={() => navigate('/avatar-manager')}
          >
            Manage Avatars
          </button>
          <button 
            className="secondary-button"
            onClick={() => navigate('/dating-skills')}
          >
            Skills Dashboard
          </button>
        </div>

        <div className="cta-section">
          <button className="primary-button" onClick={() => navigate('/avatar-setup')}>
            Create Your Avatar
          </button>
          <button className="secondary-button" onClick={() => navigate('/training-hub')}>
            Start Training
          </button>
          <button className="primary-button" onClick={() => navigate('/dating')}>
            Find Matches & Practice Dates
          </button>
        </div>

        <div className="tips-section">
          <h3>Quick Tips</h3>
          <ul>
            <li>🎯 Practice makes perfect - aim for daily sessions</li>
            <li>💬 Focus on active listening and genuine responses</li>
            <li>😊 Maintain eye contact and smile naturally</li>
            <li>🚀 Be yourself - authenticity is attractive!</li>
          </ul>
        </div>
        
        <QuickStats />
      </div>
    </div>
  );
};

export default SimplifiedHome;
