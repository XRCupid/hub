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
          
          {/* AWE Conference Demo - Prominent Access */}
          <div className="conference-demo-highlight" style={{
            backgroundColor: '#ff6b6b',
            padding: '15px 25px',
            borderRadius: '12px',
            margin: '20px 0',
            border: '3px solid #ff4757',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)'
          }}>
            <h2 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '1.4em' }}>
              🚀 AWE Conference Demo
            </h2>
            <p style={{ color: 'white', margin: '0 0 15px 0', opacity: 0.9 }}>
              Live audience-coached multiplayer dating experience with real-time analytics
            </p>
            <button 
              className="btn-primary"
              style={{
                backgroundColor: 'white',
                color: '#ff6b6b',
                fontWeight: 'bold',
                fontSize: '1.1em',
                padding: '12px 30px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
              onClick={() => navigate('/conference-demo')}
            >
              🎭 Launch Conference Demo
            </button>
          </div>
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

            <div className="feature-card riso-card">
              <h3>💕 Speed Date with Dougie</h3>
              <p>Practice speed dating with our charming AI companion</p>
              <button className="btn-secondary" onClick={() => navigate('/speed-date-dougie-v2')}>
                Start Speed Date
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
