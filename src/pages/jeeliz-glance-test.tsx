import React from 'react';
import { JeelizGlanceTracker } from '../components/JeelizGlanceTracker';

const JeelizGlanceTestPage: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0a0a0a', 
      padding: '40px',
      fontFamily: 'Arial, sans-serif',
      color: 'white'
    }}>
      <h1>Jeeliz Glance Tracker Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p>This tracker detects if you're looking at the screen or not.</p>
        <p>Perfect for measuring engagement without complex gaze tracking.</p>
      </div>

      <JeelizGlanceTracker 
        sensitivity={0.5}
        showVideo={true}
        onWatchingChange={(isWatching) => {
          console.log('User watching state changed:', isWatching);
        }}
      />
    </div>
  );
};

export default JeelizGlanceTestPage;
