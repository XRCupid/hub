import React from 'react';

const EnvCheck: React.FC = () => {
  // Check all environment variables
  const envVars = {
    REACT_APP_HUME_API_KEY: process.env.REACT_APP_HUME_API_KEY,
    REACT_APP_HUME_SECRET_KEY: process.env.REACT_APP_HUME_SECRET_KEY,
    REACT_APP_HUME_CONFIG_ID: process.env.REACT_APP_HUME_CONFIG_ID,
    NODE_ENV: process.env.NODE_ENV,
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Environment Variables Check</h2>
      <pre>{JSON.stringify(envVars, null, 2)}</pre>
      <p>If the Hume variables show as undefined, the .env file is not being loaded.</p>
      <p>Make sure to restart the development server after creating/modifying the .env file.</p>
    </div>
  );
};

export default EnvCheck;
