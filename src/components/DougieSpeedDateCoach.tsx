import React from 'react';

const DougieSpeedDateCoach: React.FC = () => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontSize: '1.5rem',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div>
        <h1>🚧 Dougie Speed Date Coach</h1>
        <p>This feature is temporarily under maintenance.</p>
        <p>Please try the main speed dating feature instead.</p>
        <a 
          href="/speed-date-dougie" 
          style={{ 
            color: '#FFD700', 
            textDecoration: 'none',
            fontSize: '1.2rem',
            border: '2px solid #FFD700',
            padding: '10px 20px',
            borderRadius: '25px',
            display: 'inline-block',
            marginTop: '20px'
          }}
        >
          Try Dougie Speed Date →
        </a>
      </div>
    </div>
  );
};

export default DougieSpeedDateCoach;
