import React from 'react';
import { useNavigate } from 'react-router-dom';

const SimpleInvestorDemo: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '2rem', backgroundColor: '#1a1a2e', color: 'white', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '2rem' }}>
        🎯 XRCupid Investor Demo
      </h1>
      
      <p style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '3rem' }}>
        Experience our <strong>LIVE VOICE AI SYSTEMS</strong> - not text chats or mockups
      </p>

      <div style={{ display: 'grid', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ 
          background: 'linear-gradient(45deg, #667eea, #764ba2)', 
          padding: '2rem', 
          borderRadius: '15px',
          cursor: 'pointer'
        }} onClick={() => navigate('/coach-call/grace')}>
          <h2 style={{ marginBottom: '1rem' }}>🎤 Live AI Coaching with Grace</h2>
          <p style={{ marginBottom: '1rem' }}>ACTUAL voice conversation using CoachSession.tsx + HybridVoiceService</p>
          <ul style={{ marginBottom: '1rem' }}>
            <li>Real voice conversation with Hume AI</li>
            <li>3D Ready Player Me avatar with lip sync</li>
            <li>Live facial expression tracking</li>
            <li>Performance analytics during conversation</li>
          </ul>
          <button style={{ 
            padding: '1rem 2rem', 
            fontSize: '1.2rem', 
            background: '#ffd700', 
            color: '#333', 
            border: 'none', 
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            Start Live Voice Coaching
          </button>
        </div>

        <div style={{ 
          background: 'linear-gradient(45deg, #f093fb, #f5576c)', 
          padding: '2rem', 
          borderRadius: '15px',
          cursor: 'pointer'
        }} onClick={() => navigate('/speed-date-dougie-v2')}>
          <h2 style={{ marginBottom: '1rem' }}>💕 Live Voice Speed Dating</h2>
          <p style={{ marginBottom: '1rem' }}>ACTUAL voice dating using DougieSpeedDate.tsx + HybridVoiceService</p>
          <ul style={{ marginBottom: '1rem' }}>
            <li>Real voice conversation with AI Dougie</li>
            <li>Multi-modal emotion detection (face + voice)</li>
            <li>Live chemistry scoring during conversation</li>
            <li>Comprehensive post-date analytics</li>
          </ul>
          <button style={{ 
            padding: '1rem 2rem', 
            fontSize: '1.2rem', 
            background: '#ffd700', 
            color: '#333', 
            border: 'none', 
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            Start Live Voice Dating
          </button>
        </div>

        <div style={{ 
          background: 'linear-gradient(45deg, #4facfe, #00f2fe)', 
          padding: '2rem', 
          borderRadius: '15px',
          cursor: 'pointer'
        }} onClick={() => navigate('/conference-booth')}>
          <h2 style={{ marginBottom: '1rem' }}>👥 Live Multi-Person Demo</h2>
          <p style={{ marginBottom: '1rem' }}>Real-time analysis using ConferenceBoothDemo.tsx</p>
          <ul style={{ marginBottom: '1rem' }}>
            <li>Live computer vision on real people</li>
            <li>Multi-person chemistry analysis</li>
            <li>Real-time emotional synchronization</li>
            <li>Audience engagement metrics</li>
          </ul>
          <button style={{ 
            padding: '1rem 2rem', 
            fontSize: '1.2rem', 
            background: '#ffd700', 
            color: '#333', 
            border: 'none', 
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            Start Multi-Person Demo
          </button>
        </div>

      </div>

      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>💰 $2B+ Market Opportunity</h2>
        <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
          First platform with LIVE VOICE AI conversations for dating practice
        </p>
      </div>
    </div>
  );
};

export default SimpleInvestorDemo;
