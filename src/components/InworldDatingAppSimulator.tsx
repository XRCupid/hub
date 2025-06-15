// Placeholder for future Inworld Dating App Simulator
// This will be implemented in Phase 2 of the deployment

import React from 'react';

const InworldDatingAppSimulator: React.FC = () => {
  return (
    <div className="inworld-dating-app-placeholder" style={{
      padding: '40px 20px',
      textAlign: 'center',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      margin: '20px 0'
    }}>
      <h2 style={{ color: '#1976d2', marginBottom: '20px' }}>
        📱 Inworld Dating App - Coming Soon!
      </h2>
      <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '25px' }}>
        This advanced feature will be available in Phase 2 and will include:
      </p>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '15px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h4 style={{ color: '#333', margin: '0 0 10px 0' }}>💬 Realistic NPC Matches</h4>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
            Practice with varied personality types and response patterns
          </p>
        </div>
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h4 style={{ color: '#333', margin: '0 0 10px 0' }}>🧠 Emotional Regulation</h4>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
            Train to handle rejection, ghosting, and difficult scenarios
          </p>
        </div>
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h4 style={{ color: '#333', margin: '0 0 10px 0' }}>🚩 Red Flag Detection</h4>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
            Learn to identify manipulation and unsafe behaviors
          </p> 
        </div>
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h4 style={{ color: '#333', margin: '0 0 10px 0' }}>📊 Advanced Analytics</h4>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
            Get detailed performance insights and coaching
          </p>
        </div>
      </div>
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '8px',
        border: '2px solid #2196f3'
      }}>
        <p style={{ 
          color: '#1976d2', 
          fontWeight: '600', 
          fontSize: '1.1rem',
          margin: 0
        }}>
          🎯 Try the Basic NPC Scenarios in the Training Hub to get started!
        </p>
      </div>
    </div>
  );
};

export default InworldDatingAppSimulator;
