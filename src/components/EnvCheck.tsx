import React from 'react';

const EnvCheck: React.FC = () => {
  // Check all environment variables
  const envVars = {
    REACT_APP_HUME_API_KEY: process.env.REACT_APP_HUME_API_KEY,
    REACT_APP_HUME_SECRET_KEY: process.env.REACT_APP_HUME_SECRET_KEY,
    REACT_APP_HUME_CONFIG_ID: process.env.REACT_APP_HUME_CONFIG_ID,
    NODE_ENV: process.env.NODE_ENV,
  };

  // Helper to show partial keys for security
  const maskKey = (key: string | undefined) => {
    if (!key) return 'NOT SET';
    if (key.length < 10) return 'INVALID (too short)';
    return `${key.substring(0, 5)}...${key.substring(key.length - 3)} (length: ${key.length})`;
  };

  // Check specific coach configs
  const coachConfigs = {
    grace: process.env.REACT_APP_HUME_CONFIG_ID_GRACE || process.env.REACT_APP_HUME_CONFIG_ID,
    posie: process.env.REACT_APP_HUME_CONFIG_ID_POSIE || process.env.REACT_APP_HUME_CONFIG_ID,
    rizzo: process.env.REACT_APP_HUME_CONFIG_ID_RIZZO || process.env.REACT_APP_HUME_CONFIG_ID,
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#1a1a1a', color: '#fff' }}>
      <h2>Environment Variables Check</h2>
      
      <h3>Hume API Credentials:</h3>
      <ul>
        <li>API Key: {maskKey(envVars.REACT_APP_HUME_API_KEY)}</li>
        <li>Secret Key: {maskKey(envVars.REACT_APP_HUME_SECRET_KEY)}</li>
        <li>Default Config ID: {envVars.REACT_APP_HUME_CONFIG_ID || 'NOT SET'}</li>
      </ul>

      <h3>Coach-Specific Configs:</h3>
      <ul>
        <li>Grace: {coachConfigs.grace}</li>
        <li>Posie: {coachConfigs.posie}</li>
        <li>Rizzo: {coachConfigs.rizzo}</li>
      </ul>

      <h3>Environment:</h3>
      <ul>
        <li>NODE_ENV: {envVars.NODE_ENV}</li>
        <li>Build Time: {new Date().toISOString()}</li>
      </ul>

      <h3>Diagnostics:</h3>
      {!envVars.REACT_APP_HUME_API_KEY && (
        <p style={{ color: '#ff6b6b' }}>
          ⚠️ HUME API KEY NOT FOUND! The app won't be able to connect to Hume services.
        </p>
      )}
      {!envVars.REACT_APP_HUME_SECRET_KEY && (
        <p style={{ color: '#ff6b6b' }}>
          ⚠️ HUME SECRET KEY NOT FOUND! The app won't be able to authenticate with Hume.
        </p>
      )}
      {envVars.REACT_APP_HUME_API_KEY && envVars.REACT_APP_HUME_SECRET_KEY && (
        <p style={{ color: '#51cf66' }}>
          ✅ Hume credentials are configured. If connection still fails, check:
          <br />- Config ID exists in your Hume account
          <br />- API keys are from the correct account
          <br />- No typos in the credentials
        </p>
      )}

      <p style={{ marginTop: '20px', fontSize: '12px', opacity: 0.7 }}>
        If the Hume variables show as NOT SET, the environment variables are not being loaded properly.
        <br />For production deployment, ensure GitHub Secrets are configured or .env.production is built correctly.
      </p>
    </div>
  );
};

export default EnvCheck;
