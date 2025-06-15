import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RealInvestorDemo.css';

const RealInvestorDemo: React.FC = () => {
  const navigate = useNavigate();
  const [currentDemo, setCurrentDemo] = useState<string>('');

  const workingDemos = [
    {
      id: 'voice-coaching',
      title: 'Live Voice AI Coaching',
      description: 'ACTUAL voice conversation with Grace AI coach using Hume AI emotional intelligence',
      route: '/coach-call/grace',
      tech: 'CoachSession.tsx + HybridVoiceService + Hume AI',
      features: [
        'Real voice conversation (not text)',
        '3D Ready Player Me avatar with lip sync',
        'Live emotion analysis from your speech',
        'Computer vision face tracking',
        'Real-time performance analytics'
      ]
    },
    {
      id: 'voice-dating',
      title: 'Live Voice Speed Dating',
      description: 'ACTUAL voice dating simulation with AI Dougie',
      route: '/speed-date-dougie-v2',
      tech: 'DougieSpeedDateV2.tsx + HybridVoiceService + HumeExpressionService',
      features: [
        'Real voice dating conversation',
        'Multi-modal emotion detection',
        'Live chemistry scoring',
        'Conversation transcript with emotion timeline',
        'Comprehensive post-date analytics'
      ]
    },
    {
      id: 'alternative-coach',
      title: 'Alternative AI Coach',
      description: 'Different AI personality for voice coaching',
      route: '/dougie-coach-simple',
      tech: 'DougieCoachSimple.tsx + HybridVoiceService',
      features: [
        'Different AI coaching personality',
        'Voice-based skill development',
        'Real-time avatar responses',
        'Live emotional analysis',
        'Personalized coaching approach'
      ]
    },
    {
      id: 'live-conference',
      title: 'Multi-Person Live Demo',
      description: 'Real-time analysis of actual human interactions',
      route: '/conference-booth',
      tech: 'ConferenceBoothDemo.tsx + Computer Vision',
      features: [
        'Live computer vision on real people',
        'Multi-person chemistry analysis',
        'Real-time emotional synchronization',
        'Audience engagement metrics',
        'Group interaction analytics'
      ]
    }
  ];

  const handleStartDemo = (route: string, demoId: string) => {
    setCurrentDemo(demoId);
    navigate(route);
  };

  return (
    <div className="real-investor-demo">
      <div className="demo-header">
        <h1>🎯 XRCupid Live Technology Demo</h1>
        <p className="demo-subtitle">
          Experience our <strong>ACTUAL WORKING VOICE AI SYSTEMS</strong> - not mockups or text chats
        </p>
      </div>

      <div className="tech-stack-overview">
        <h2>🚀 Technology Stack</h2>
        <div className="tech-grid">
          <div className="tech-item">
            <h3>Hume AI</h3>
            <p>Emotional intelligence from voice analysis</p>
          </div>
          <div className="tech-item">
            <h3>Ready Player Me</h3>
            <p>3D avatars with real-time lip sync</p>
          </div>
          <div className="tech-item">
            <h3>Computer Vision</h3>
            <p>ML5/MediaPipe face tracking</p>
          </div>
          <div className="tech-item">
            <h3>Real-time Analytics</h3>
            <p>Live performance tracking during conversations</p>
          </div>
        </div>
      </div>

      <div className="working-demos">
        <h2>🎤 Live Working Demonstrations</h2>
        <p className="demos-subtitle">
          Each demo below uses our actual voice AI technology. Click to experience live interactions.
        </p>
        
        <div className="demos-grid">
          {workingDemos.map((demo) => (
            <div key={demo.id} className="demo-card">
              <div className="demo-card-header">
                <h3>{demo.title}</h3>
                <p className="demo-description">{demo.description}</p>
                <div className="tech-info">
                  <span className="tech-label">Technology:</span>
                  <span className="tech-details">{demo.tech}</span>
                </div>
              </div>
              
              <div className="demo-features">
                <h4>Key Features:</h4>
                <ul>
                  {demo.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
              
              <button 
                className="demo-btn"
                onClick={() => handleStartDemo(demo.route, demo.id)}
              >
                🎤 Start Live Demo
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="investor-value">
        <h2>💰 Investment Opportunity</h2>
        <div className="value-grid">
          <div className="value-item">
            <h3>Market Size</h3>
            <p>$2B+ dating coaching market with massive unmet demand</p>
          </div>
          <div className="value-item">
            <h3>Competitive Advantage</h3>
            <p>First platform with LIVE VOICE AI conversations for dating practice</p>
          </div>
          <div className="value-item">
            <h3>Technology Moat</h3>
            <p>Proprietary integration of Hume AI, 3D avatars, and real-time analytics</p>
          </div>
          <div className="value-item">
            <h3>Revenue Model</h3>
            <p>Freemium → Premium → Elite coaching tiers with proven engagement</p>
          </div>
        </div>
      </div>

      <div className="demo-cta">
        <h2>Ready to See the Technology in Action?</h2>
        <p>
          These are <strong>LIVE VOICE AI CONVERSATIONS</strong> - not pre-recorded demos or text chats.
          Experience the future of dating education technology.
        </p>
        <div className="cta-buttons">
          <button 
            className="cta-primary"
            onClick={() => handleStartDemo('/coach-call/grace', 'voice-coaching')}
          >
            🎤 Start with Live AI Coaching
          </button>
          <button 
            className="cta-secondary"
            onClick={() => handleStartDemo('/speed-date-dougie-v2', 'voice-dating')}
          >
            💕 Try Voice Speed Dating
          </button>
        </div>
      </div>
    </div>
  );
};

export default RealInvestorDemo;
