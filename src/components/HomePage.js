import React from 'react';
import { Link } from 'react-router-dom';
import AngelMascot from './AngelMascot';
import { SparkleIcon, HeartIcon, RadiatingHeartIcon, WingedHeartIcon } from './RisographIcons';

const HomePage = () => {
  return (
    <>
      <div className="hero-section">
        <div className="hero-content">
          <AngelMascot size="large" animate={true} />
          
          <h1>Transform Your Dating Life with AI & XR</h1>
          
          <p className="tagline">
            Experience the future of dating coaching through immersive XR simulations, 
            AI-powered guidance, and real-time emotional intelligence training
          </p>
          
          <div className="hero-actions">
            <Link to="/dating-simulation" className="btn-primary">
              <span>Start XR Dating Sim</span>
              <HeartIcon size={20} />
            </Link>
            
            <Link to="/coach-call" className="btn-secondary">
              <span>Meet Your AI Coach</span>
              <SparkleIcon size={20} />
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <section className="section page-container">
        <h2 className="section-title text-center mb-5">Complete Dating Transformation Toolkit</h2>
        
        <div className="feature-grid">
          {/* Conference Demo */}
          <Link to="/conference-booth" className="feature-card">
            <div className="feature-icon">
              <RadiatingHeartIcon size={40} />
            </div>
            <h3>Conference Demo</h3>
            <p>Experience our cutting-edge XR dating simulation showcased at leading tech conferences</p>
          </Link>

          {/* AI Coach Call */}
          <Link to="/coach-call" className="feature-card">
            <div className="feature-icon">
              <SparkleIcon size={40} />
            </div>
            <h3>AI Voice Coach</h3>
            <p>Real-time conversational coaching with emotional intelligence feedback</p>
          </Link>

          {/* Story Creation */}
          <Link to="/conversation-toolkit" className="feature-card">
            <div className="feature-icon">
              <WingedHeartIcon size={40} />
            </div>
            <h3>Conversation Toolkit</h3>
            <p>Browse conversation modules and curiosity prompts to enhance your dating interactions</p>
          </Link>

          {/* Dashboard */}
          <Link to="/dashboard" className="feature-card">
            <div className="feature-icon">
              <HeartIcon size={40} />
            </div>
            <h3>Progress Dashboard</h3>
            <p>Track your dating journey with analytics and personalized insights</p>
          </Link>

          {/* Emotion Analysis */}
          <Link to="/emotion-analysis" className="feature-card">
            <div className="feature-icon">
              <RadiatingHeartIcon size={40} />
            </div>
            <h3>Emotion Analysis Lab</h3>
            <p>Real-time facial and voice emotion detection to improve your emotional awareness</p>
          </Link>

          {/* Speed Date with Dougie */}
          <Link to="/speed-date-dougie" className="feature-card">
            <div className="feature-icon">
              <HeartIcon size={40} />
            </div>
            <h3>Speed Date with Dougie</h3>
            <p>Practice your speed dating skills with our charming AI companion in a fun, low-pressure environment</p>
          </Link>
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-large page-container text-center">
        <h2 className="mb-3">Ready to Master the Art of Connection?</h2>
        <p className="mb-4">Join thousands who've transformed their dating lives with XRCupid's AI-powered platform</p>
        <Link to="/dating-simulation" className="btn-primary">
          <span>Begin Your Journey</span>
          <HeartIcon size={20} />
        </Link>
      </section>
    </>
  );
};

export default HomePage;
