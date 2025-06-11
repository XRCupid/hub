import React, { useState } from 'react';
import { setHumeCredentials, getHumeCredentials } from '../services/humeCredentialsOverride';
import { useNavigate } from 'react-router-dom';

const HumeQuickSetup: React.FC = () => {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [configId, setConfigId] = useState('3910aba0-b518-440a-a4a2-0ad1772aec57');
  const [saved, setSaved] = useState(false);
  
  const handleSave = () => {
    if (apiKey && secretKey) {
      setHumeCredentials(apiKey, secretKey, configId);
      setSaved(true);
      setTimeout(() => {
        navigate('/coach-call/grace');
      }, 1500);
    }
  };
  
  const generateUrlWithCredentials = () => {
    if (!apiKey || !secretKey) return '';
    const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
    return `${baseUrl}/coach-call/grace?hume_api=${encodeURIComponent(apiKey)}&hume_secret=${encodeURIComponent(secretKey)}&hume_config=${encodeURIComponent(configId)}`;
  };
  
  return (
    <div style={{
      maxWidth: '800px',
      margin: '40px auto',
      padding: '20px',
      backgroundColor: '#1a1a1a',
      color: '#fff',
      borderRadius: '8px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1>🚀 Hume Quick Setup</h1>
      <p>Configure your Hume credentials for the conference demo.</p>
      
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Option 1: Save Credentials Locally</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Hume API Key:
          </label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Your Hume API key"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #444',
              color: '#fff',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Hume Secret Key:
          </label>
          <input
            type="text"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder="Your Hume secret key"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #444',
              color: '#fff',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Config ID (Grace's config):
          </label>
          <input
            type="text"
            value={configId}
            onChange={(e) => setConfigId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #444',
              color: '#fff',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
        
        <button
          onClick={handleSave}
          disabled={!apiKey || !secretKey}
          style={{
            padding: '12px 24px',
            backgroundColor: saved ? '#4CAF50' : '#2196F3',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: apiKey && secretKey ? 'pointer' : 'not-allowed',
            opacity: apiKey && secretKey ? 1 : 0.6,
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {saved ? '✅ Saved! Redirecting...' : 'Save & Go to Coach Grace'}
        </button>
      </div>
      
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Option 2: Direct URL with Credentials</h2>
        <p>Generate a URL with embedded credentials (less secure but works immediately):</p>
        
        {apiKey && secretKey && (
          <div style={{
            padding: '10px',
            backgroundColor: '#1a1a1a',
            borderRadius: '4px',
            wordBreak: 'break-all',
            marginTop: '10px'
          }}>
            <code style={{ fontSize: '12px' }}>{generateUrlWithCredentials()}</code>
            <button
              onClick={() => navigator.clipboard.writeText(generateUrlWithCredentials())}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Copy URL
            </button>
          </div>
        )}
      </div>
      
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Option 3: Browser Console</h2>
        <p>Open the browser console (F12) and run:</p>
        <pre style={{
          padding: '10px',
          backgroundColor: '#1a1a1a',
          borderRadius: '4px',
          overflow: 'auto'
        }}>
{`window.humeCredentials.set(
  "your_api_key",
  "your_secret_key",
  "3910aba0-b518-440a-a4a2-0ad1772aec57"
);`}
        </pre>
      </div>
      
      <div style={{ 
        padding: '15px', 
        backgroundColor: '#3a2a1a', 
        borderRadius: '8px',
        border: '1px solid #ff6b6b'
      }}>
        <h3>⚠️ Important for Conference Demo</h3>
        <ul style={{ marginLeft: '20px' }}>
          <li>Credentials are stored in browser storage (survives page refresh)</li>
          <li>Each device/browser needs credentials configured separately</li>
          <li>For the conference, set up credentials on the demo device beforehand</li>
          <li>The emergency credentials form will appear on any page if credentials are missing</li>
        </ul>
      </div>
    </div>
  );
};

export default HumeQuickSetup;
