import React, { useState, useEffect } from 'react';
import { HeartIcon } from './RisographIcons';
import './PasswordProtection.css';

interface PasswordProtectionProps {
  children: React.ReactNode;
}

const PasswordProtection: React.FC<PasswordProtectionProps> = ({ children }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  // The password - you can change this to whatever you want
  const CORRECT_PASSWORD = 'LoversRock25';
  
  // Session timeout in milliseconds (24 hours)
  const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

  useEffect(() => {
    // Check if user is already authenticated
    const authData = localStorage.getItem('xrcupid_auth');
    if (authData) {
      try {
        const { timestamp, authenticated } = JSON.parse(authData);
        const now = Date.now();
        
        // Check if session hasn't expired
        if (authenticated && (now - timestamp) < SESSION_TIMEOUT) {
          setIsAuthenticated(true);
        } else {
          // Session expired, clear auth data
          localStorage.removeItem('xrcupid_auth');
        }
      } catch (e) {
        // Invalid auth data, clear it
        localStorage.removeItem('xrcupid_auth');
      }
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
      
      // Store authentication with timestamp
      const authData = {
        authenticated: true,
        timestamp: Date.now()
      };
      localStorage.setItem('xrcupid_auth', JSON.stringify(authData));
    } else {
      setError('Incorrect password');
      setAttempts(prev => prev + 1);
      setPassword('');
      
      // Add a small delay after failed attempts to prevent brute force
      if (attempts >= 2) {
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setError('');
    setAttempts(0);
    localStorage.removeItem('xrcupid_auth');
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="password-protection-container">
        <div className="password-protection-card">
          <div className="loading-spinner">
            <HeartIcon size={40} color="#FF6B9D" />
          </div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show password prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="password-protection-container">
        <div className="password-protection-card">
          <div className="password-protection-header">
            <HeartIcon size={60} color="#FF6B9D" />
            <h1>XRCupid</h1>
            <p>Private Access Required</p>
          </div>
          
          <form onSubmit={handleSubmit} className="password-form">
            <div className="form-group">
              <label htmlFor="password">Enter Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={error ? 'error' : ''}
                disabled={attempts >= 5}
                autoFocus
              />
            </div>
            
            {error && (
              <div className="error-message">
                {error}
                {attempts >= 3 && (
                  <div className="attempts-warning">
                    Too many failed attempts. Please try again later.
                  </div>
                )}
              </div>
            )}
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={!password || attempts >= 5}
            >
              Enter XRCupid
            </button>
          </form>
          
          <div className="password-protection-footer">
            <p>This site is password protected.</p>
            <p>Contact the administrator if you need access.</p>
          </div>
        </div>
        
        {/* Decorative background elements */}
        <div className="password-bg-decoration">
          <div className="floating-heart" style={{ top: '10%', left: '10%', animationDelay: '0s' }}>
            <HeartIcon size={20} color="rgba(255, 107, 157, 0.3)" />
          </div>
          <div className="floating-heart" style={{ top: '20%', right: '15%', animationDelay: '2s' }}>
            <HeartIcon size={15} color="rgba(255, 107, 157, 0.2)" />
          </div>
          <div className="floating-heart" style={{ bottom: '20%', left: '20%', animationDelay: '4s' }}>
            <HeartIcon size={25} color="rgba(255, 107, 157, 0.25)" />
          </div>
          <div className="floating-heart" style={{ bottom: '30%', right: '10%', animationDelay: '6s' }}>
            <HeartIcon size={18} color="rgba(255, 107, 157, 0.3)" />
          </div>
        </div>
      </div>
    );
  }

  // Render the protected content with logout option
  return (
    <div className="protected-content">
      {/* Small logout button in top-right corner */}
      <button 
        onClick={handleLogout}
        className="logout-button"
        title="Logout from XRCupid"
      >
        🔒 Logout
      </button>
      
      {children}
    </div>
  );
};

export default PasswordProtection;
