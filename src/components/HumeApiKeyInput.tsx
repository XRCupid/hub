import React, { useState, useEffect } from 'react';
import './HumeApiKeyInput.css';

interface HumeApiKeyInputProps {
  onKeysSet?: () => void;
}

export const HumeApiKeyInput: React.FC<HumeApiKeyInputProps> = ({ onKeysSet }) => {
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [showKeys, setShowKeys] = useState(false);
  const [keysStored, setKeysStored] = useState(false);

  useEffect(() => {
    // Check if keys are already stored
    const storedApiKey = localStorage.getItem('humeApiKey');
    const storedSecretKey = localStorage.getItem('humeSecretKey');
    
    if (storedApiKey && storedSecretKey) {
      setKeysStored(true);
      setApiKey(storedApiKey);
      setSecretKey(storedSecretKey);
    }
  }, []);

  const handleSaveKeys = () => {
    if (apiKey && secretKey) {
      // Store in localStorage
      localStorage.setItem('humeApiKey', apiKey);
      localStorage.setItem('humeSecretKey', secretKey);
      
      // Also set in window object for immediate use
      (window as any).REACT_APP_HUME_API_KEY = apiKey;
      (window as any).REACT_APP_HUME_SECRET_KEY = secretKey;
      
      setKeysStored(true);
      
      // Notify parent component
      if (onKeysSet) {
        onKeysSet();
      }
      
      // Reload the page to reinitialize services with new keys
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const handleClearKeys = () => {
    localStorage.removeItem('humeApiKey');
    localStorage.removeItem('humeSecretKey');
    setApiKey('');
    setSecretKey('');
    setKeysStored(false);
  };

  return (
    <div className="hume-api-key-input">
      <div className="api-key-card">
        <h3>Hume AI Configuration</h3>
        
        {keysStored ? (
          <div className="keys-stored">
            <p className="success-message">✅ API keys are configured</p>
            <button onClick={handleClearKeys} className="clear-button">
              Clear Keys
            </button>
          </div>
        ) : (
          <>
            <p className="info-message">
              To use the AI coach, you need to provide your Hume API credentials.
              Get them from <a href="https://platform.hume.ai/" target="_blank" rel="noopener noreferrer">platform.hume.ai</a>
            </p>
            
            <div className="input-group">
              <label htmlFor="apiKey">API Key:</label>
              <div className="input-wrapper">
                <input
                  id="apiKey"
                  type={showKeys ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Hume API key"
                />
              </div>
            </div>
            
            <div className="input-group">
              <label htmlFor="secretKey">Secret Key:</label>
              <div className="input-wrapper">
                <input
                  id="secretKey"
                  type={showKeys ? "text" : "password"}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter your Hume secret key"
                />
              </div>
            </div>
            
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="showKeys"
                checked={showKeys}
                onChange={(e) => setShowKeys(e.target.checked)}
              />
              <label htmlFor="showKeys">Show keys</label>
            </div>
            
            <button 
              onClick={handleSaveKeys}
              disabled={!apiKey || !secretKey}
              className="save-button"
            >
              Save Keys
            </button>
            
            <p className="security-note">
              🔒 Your keys are stored locally in your browser and never sent to our servers.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
