import React from 'react';
import { SeeSoEyeTracker } from '../components/SeeSoEyeTracker';

const SeeSoTestPage: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0a0a0a', 
      padding: '40px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <SeeSoEyeTracker />
    </div>
  );
};

export default SeeSoTestPage;
