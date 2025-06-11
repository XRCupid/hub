import React, { useState, useEffect } from 'react';
import { setHumeCredentials, getHumeCredentials } from '../services/humeCredentialsOverride';

const EmergencyCredentialsInput: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [configId, setConfigId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState(false);
  
  useEffect(() => {
    // Load current credentials
    const current = getHumeCredentials();
    if (current.apiKey && current.secretKey) {
      setApiKey(current.apiKey);
      setSecretKey(current.secretKey);
      setConfigId(current.configId);
    }
  }, []);
  
  const handleSave = () => {
    if (apiKey && secretKey) {
      setHumeCredentials(apiKey, secretKey, configId);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      
      // Offer to reload
      if (window.confirm('Credentials saved! Reload the page to apply them?')) {
        window.location.reload();
      }
    }
  };
  
  const maskValue = (value: string) => {
    if (!value || value.length < 10) return value;
    return `${value.substring(0, 5)}...${value.substring(value.length - 3)}`;
  };
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#1a1a1a',
      color: '#fff',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '400px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>🔧 Emergency Credentials</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: 'none',
            border: '1px solid #666',
            color: '#fff',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showForm ? 'Hide' : 'Configure'}
        </button>
      </div>
      
      {!showForm && (
        <div style={{ fontSize: '12px', opacity: 0.8 }}>
          Current: {apiKey ? maskValue(apiKey) : 'Not configured'}
        </div>
      )}
      
      {showForm && (
        <div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>
              Hume API Key:
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Hume API key"
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#2a2a2a',
                border: '1px solid #444',
                color: '#fff',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>
              Hume Secret Key:
            </label>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Enter your Hume secret key"
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#2a2a2a',
                border: '1px solid #444',
                color: '#fff',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>
              Config ID (optional):
            </label>
            <input
              type="text"
              value={configId}
              onChange={(e) => setConfigId(e.target.value)}
              placeholder="3910aba0-b518-440a-a4a2-0ad1772aec57"
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#2a2a2a',
                border: '1px solid #444',
                color: '#fff',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <button
            onClick={handleSave}
            disabled={!apiKey || !secretKey}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: saved ? '#4CAF50' : '#2196F3',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: apiKey && secretKey ? 'pointer' : 'not-allowed',
              opacity: apiKey && secretKey ? 1 : 0.6
            }}
          >
            {saved ? '✅ Saved!' : 'Save Credentials'}
          </button>
          
          <div style={{ marginTop: '10px', fontSize: '11px', opacity: 0.7 }}>
            These credentials will be stored locally and used instead of environment variables.
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyCredentialsInput;
