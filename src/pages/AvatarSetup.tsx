import React, { useState, useEffect } from 'react';
import '../styles/AvatarSetup.css';

const AvatarSetup: React.FC = () => {
  const [currentAvatar, setCurrentAvatar] = useState<string>('');
  const [showIframe, setShowIframe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [setupStep, setSetupStep] = useState<'welcome' | 'create' | 'preview'>('welcome');

  useEffect(() => {
    // Load saved avatar if exists
    const savedAvatar = localStorage.getItem('user_avatar_url');
    if (savedAvatar) {
      setCurrentAvatar(savedAvatar);
      setSetupStep('preview');
    }
  }, []);

  const handleMessage = (event: MessageEvent) => {
    if (event.data?.source === 'readyplayerme') {
      if (event.data.eventName === 'v1.avatar.exported') {
        const avatarUrl = event.data.data.url;
        
        // Add parameters for expressions and quality
        const enhancedUrl = `${avatarUrl}?morphTargets=ARKit,Oculus Visemes&textureAtlas=1024&lod=0`;
        
        setCurrentAvatar(enhancedUrl);
        localStorage.setItem('user_avatar_url', enhancedUrl);
        setShowIframe(false);
        setSetupStep('preview');
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const startAvatarCreation = () => {
    setShowIframe(true);
    setIsLoading(true);
    setSetupStep('create');
  };

  return (
    <div className="avatar-setup">
      {setupStep === 'welcome' && (
        <div className="setup-welcome">
          <h1>Welcome to XRCupid! 👋</h1>
          <p className="subtitle">Let's create your avatar for a more personal experience</p>
          
          <div className="feature-cards">
            <div className="feature-card">
              <div className="feature-icon">📸</div>
              <h3>Photo-Based Avatar</h3>
              <p>Use your selfie to create a personalized avatar that looks like you</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Full Customization</h3>
              <p>Customize every detail - hair, clothing, accessories, and more</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">😊</div>
              <h3>Express Yourself</h3>
              <p>Your avatar will mirror your expressions during conversations</p>
            </div>
          </div>
          
          <div className="action-buttons">
            <button className="primary-button" onClick={startAvatarCreation}>
              Create My Avatar
            </button>
            <button className="secondary-button" onClick={() => setSetupStep('preview')}>
              Use Default Avatar
            </button>
          </div>
        </div>
      )}

      {setupStep === 'create' && (
        <div className="setup-create">
          <h2>Design Your Avatar</h2>
          <p className="instructions">
            💡 <strong>Pro Tip:</strong> Use the QR code option to take a selfie and create an avatar that looks like you!
          </p>
          
          {showIframe && (
            <div className="iframe-container">
              <iframe
                src="https://demo.readyplayer.me/avatar?frameApi"
                title="Ready Player Me Avatar Creator"
                allow="camera *; microphone *"
                className="rpm-iframe"
              />
              {isLoading && (
                <div className="loading-overlay">
                  <div className="spinner"></div>
                  <p>Creating your avatar...</p>
                </div>
              )}
            </div>
          )}
          
          <button className="back-button" onClick={() => {
            setShowIframe(false);
            setSetupStep('welcome');
          }}>
            ← Back
          </button>
        </div>
      )}

      {setupStep === 'preview' && (
        <div className="setup-preview">
          <h2>Your Avatar</h2>
          
          <div className="avatar-preview">
            {currentAvatar ? (
              <div className="avatar-display">
                <img 
                  src={`https://models.readyplayer.me/${currentAvatar.split('/').pop()?.split('.')[0]}.png`}
                  alt="Your avatar"
                  className="avatar-image"
                />
                <p className="avatar-status">✅ Avatar saved successfully!</p>
              </div>
            ) : (
              <div className="default-avatar">
                <div className="placeholder-avatar">👤</div>
                <p>Using default avatar</p>
              </div>
            )}
          </div>
          
          <div className="avatar-tips">
            <h3>How your avatar works:</h3>
            <ul>
              <li>🎭 Mirrors your expressions during conversations</li>
              <li>💬 Represents you in practice sessions</li>
              <li>📈 Helps track your progress visually</li>
              <li>🔄 Can be updated anytime</li>
            </ul>
          </div>
          
          <div className="action-buttons">
            <button className="primary-button" onClick={() => window.location.href = '/coach-call'}>
              Start Talking to Coach
            </button>
            <button className="secondary-button" onClick={() => setSetupStep('create')}>
              Change Avatar
            </button>
          </div>
        </div>
      )}

      <div className="human-touch">
        <p>
          Remember, your avatar is just a fun way to represent yourself. 
          What matters most is the genuine connection and growth you'll experience here. 
          We're here to support you every step of the way! 💜
        </p>
      </div>
    </div>
  );
};

export default AvatarSetup;
