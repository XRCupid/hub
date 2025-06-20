import React from 'react';
import { EyeGesturesTest } from '../components/EyeGesturesTest';

const EyeGesturesTestPage: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0a0a0a', 
      padding: '40px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <EyeGesturesTest />
    </div>
  );
};

export default EyeGesturesTestPage;
