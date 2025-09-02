import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoCallAnalytics from './VideoCallAnalytics';
import './EasyTigerDemo.css';

const EasyTigerDemo: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'TigerStripes2024') {
      setAuthenticated(true);
    } else {
      alert('Invalid password');
    }
  };

  if (!authenticated) {
    return (
      <div className="easytiger-auth">
        <div className="auth-container">
          <div className="logo-section">
            <h1 className="brand">EasyTiger</h1>
            <p className="tagline">AI-Powered Video Analytics Platform</p>
          </div>
          
          <form onSubmit={handleLogin} className="auth-form">
            <h2>Investor Demo Access</h2>
            <input
              type="password"
              placeholder="Enter demo password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="password-input"
              autoFocus
            />
            <button type="submit" className="access-button">
              Access Demo
            </button>
          </form>

          <div className="demo-info">
            <h3>What You'll Experience:</h3>
            <ul>
              <li>Real-time facial emotion analysis during video calls</li>
              <li>Chemistry scoring between participants</li>
              <li>AI-generated conversation insights</li>
              <li>Professional coaching recommendations</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="easytiger-demo">
      <header className="demo-header">
        <div className="header-content">
          <h1 className="brand">EasyTiger</h1>
          <div className="header-actions">
            <span className="demo-badge">INVESTOR DEMO</span>
            <button 
              onClick={() => setAuthenticated(false)}
              className="logout-button"
            >
              Exit Demo
            </button>
          </div>
        </div>
      </header>

      <div className="demo-container">
        <div className="demo-intro">
          <h2>Video Call Analytics Demo</h2>
          <p>Experience our AI-powered platform that transforms video conversations into actionable insights.</p>
        </div>

        <VideoCallAnalytics />
      </div>

      <footer className="demo-footer">
        <p>© 2024 EasyTiger. Confidential Demo - Do Not Distribute</p>
      </footer>
    </div>
  );
};

export default EasyTigerDemo;
