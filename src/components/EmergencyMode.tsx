import React from 'react';

/**
 * Emergency low-memory mode component
 * Replaces resource-intensive components when memory is critical
 */
export const EmergencyMode: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{
      padding: '20px',
      background: '#ffe6e6',
      border: '2px solid #ff4444',
      borderRadius: '8px',
      margin: '20px',
      textAlign: 'center'
    }}>
      <h2 style={{ color: '#cc0000' }}>🚨 Emergency Low-Memory Mode</h2>
      <p>
        Some features have been disabled to prevent system crashes.
        <br />
        Heavy components (3D avatars, ML5 tracking, video processing) are temporarily unavailable.
      </p>
      <div style={{ marginTop: '20px' }}>
        {children}
      </div>
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p>To restore full functionality:</p>
        <ol style={{ textAlign: 'left', display: 'inline-block' }}>
          <li>Close unnecessary browser tabs</li>
          <li>Restart your browser</li>
          <li>Use `npm run start:normal` when ready</li>
        </ol>
      </div>
    </div>
  );
};

/**
 * Lightweight avatar placeholder
 */
export const LightweightAvatar: React.FC<{ name?: string }> = ({ name = 'Avatar' }) => {
  return (
    <div style={{
      width: '200px',
      height: '200px',
      borderRadius: '50%',
      background: 'linear-gradient(45deg, #ff69b4, #9932cc)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '24px',
      fontWeight: 'bold',
      margin: '20px auto'
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

/**
 * Simple emotion display without ML5
 */
export const SimpleEmotionDisplay: React.FC<{ emotions?: string[] }> = ({ 
  emotions = ['Happy', 'Excited', 'Confident'] 
}) => {
  return (
    <div style={{ padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
      <h4>Current Emotions:</h4>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {emotions.map((emotion, index) => (
          <span 
            key={index}
            style={{
              padding: '5px 10px',
              background: '#4CAF50',
              color: 'white',
              borderRadius: '15px',
              fontSize: '12px'
            }}
          >
            {emotion}
          </span>
        ))}
      </div>
    </div>
  );
};
