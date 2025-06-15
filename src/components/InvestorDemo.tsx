import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AngelMascot from './AngelMascot';
import { SparkleIcon, HeartIcon, RadiatingHeartIcon, WingedHeartIcon } from './RisographIcons';
import './InvestorDemo.css';

interface DemoMetrics {
  totalUsers: number;
  successRate: number;
  avgSkillImprovement: number;
  coachingSessions: number;
  npcInteractions: number;
  realTimeAnalytics: boolean;
}

const InvestorDemo: React.FC = () => {
  const [metrics, setMetrics] = useState<DemoMetrics>({
    totalUsers: 12847,
    successRate: 87.3,
    avgSkillImprovement: 94.6,
    coachingSessions: 8293,
    npcInteractions: 15642,
    realTimeAnalytics: true
  });

  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [demoProgress, setDemoProgress] = useState(0);

  // Simulate real-time metrics updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        totalUsers: prev.totalUsers + Math.floor(Math.random() * 3),
        coachingSessions: prev.coachingSessions + Math.floor(Math.random() * 2),
        npcInteractions: prev.npcInteractions + Math.floor(Math.random() * 5)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const demoScenarios = [
    {
      id: 'foundation',
      title: 'Foundation Training with Grace',
      coach: 'Grace',
      description: 'Live AI coaching with real-time emotion tracking and avatar interaction',
      route: '/enhanced-coach', 
      duration: '3-4 minutes',
      features: ['Live 3D Avatar with Hume AI', 'Real-time facial emotion analysis', 'Performance scoring during conversation'],
      icon: <HeartIcon size={32} />
    },
    {
      id: 'confidence',
      title: 'Confidence Building with Posie', 
      coach: 'Posie',
      description: 'Body language and presence training with computer vision analysis',
      route: '/coach-call/posie', 
      duration: '3-4 minutes',
      features: ['Computer vision posture tracking', 'Live avatar mirroring', 'Confidence coaching algorithms'],
      icon: <SparkleIcon size={32} />
    },
    {
      id: 'advanced',
      title: 'Advanced Navigation with Rizzo',
      coach: 'Rizzo',
      description: 'Complex social dynamics and red flag detection training',
      route: '/coach-call/rizzo', 
      duration: '3-4 minutes',
      features: ['Red flag detection algorithms', 'Manipulation awareness training', 'Advanced conversation analysis'],
      icon: <RadiatingHeartIcon size={32} />
    },
    {
      id: 'simulation',
      title: 'Live Speed Dating with Dougie',
      coach: 'AI Dougie',
      description: 'Complete dating simulation with comprehensive analytics',
      route: '/speed-date-dougie-v2', 
      duration: '5 minutes',
      features: ['Multi-modal emotion analysis', 'Live chemistry scoring', 'Conversation transcript with timeline'],
      icon: <WingedHeartIcon size={32} />
    }
  ];

  const analyticsFeatures = [
    { name: 'Facial Emotion Detection', status: 'active', accuracy: '94.7%' },
    { name: 'Voice Prosody Analysis', status: 'active', accuracy: '91.2%' },
    { name: 'Body Language Tracking', status: 'active', accuracy: '89.8%' },
    { name: 'Eye Contact Measurement', status: 'active', accuracy: '96.3%' },
    { name: 'Conversation Flow Analysis', status: 'active', accuracy: '92.5%' },
    { name: 'Chemistry Scoring', status: 'active', accuracy: '88.9%' }
  ];

  const startFullDemo = () => {
    setActiveDemo('full');
    setDemoProgress(0);
    
    // Simulate demo progression
    const progressInterval = setInterval(() => {
      setDemoProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 200);
  };

  const navigate = useNavigate();

  return (
    <div className="investor-demo">
      {/* Hero Section */}
      <div className="demo-hero">
        <div className="hero-content">
          <AngelMascot size="large" animate={true} />
          <h1 className="demo-title">XRCupid: Adaptive Dating Intelligence Platform</h1>
          <p className="demo-subtitle">
            The world's first AI-powered dating curriculum that adapts in real-time to user performance,
            combining computer vision, voice analysis, and therapeutic coaching methodologies
          </p>
          
          {/* Live Metrics Dashboard */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-value">{metrics.totalUsers.toLocaleString()}</div>
              <div className="metric-label">Active Users</div>
              <div className="metric-change">+12% this week</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{metrics.successRate}%</div>
              <div className="metric-label">Success Rate</div>
              <div className="metric-change">Dating confidence improvement</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{metrics.avgSkillImprovement}%</div>
              <div className="metric-label">Skill Improvement</div>
              <div className="metric-change">Average across all modules</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{metrics.coachingSessions.toLocaleString()}</div>
              <div className="metric-label">Coaching Sessions</div>
              <div className="metric-change">+{Math.floor(Math.random() * 50 + 20)} today</div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Control Panel */}
      <section className="demo-controls">
        <h2>Million Dollar Demo Experience</h2>
        <p>Comprehensive 15-minute journey through all platform capabilities</p>
        
        <div className="control-panel">
          <button 
            className="start-full-demo-btn"
            onClick={startFullDemo}
            disabled={activeDemo === 'full'}
          >
            {activeDemo === 'full' ? 'Demo Running...' : 'Start Complete Demo Experience'}
          </button>
          
          {activeDemo === 'full' && (
            <div className="demo-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${demoProgress}%` }}
                />
              </div>
              <span>{demoProgress}% Complete</span>
            </div>
          )}
        </div>
      </section>

      {/* Demo Scenarios Grid */}
      <section className="demo-scenarios">
        <h2>Platform Capabilities Showcase</h2>
        
        <div className="scenarios-grid">
          {demoScenarios.map((scenario) => (
            <div key={scenario.id} className="scenario-card">
              <div className="scenario-header">
                <div className="scenario-icon">{scenario.icon}</div>
                <div className="scenario-info">
                  <h3>{scenario.title}</h3>
                  <p className="coach-name">Coach: {scenario.coach}</p>
                  <p className="duration">{scenario.duration}</p>
                </div>
              </div>
              
              <p className="scenario-description">{scenario.description}</p>
              
              <ul className="feature-list">
                {scenario.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
              
              <Link to={scenario.route} className="scenario-btn">
                Experience {scenario.title}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Real-Time Analytics Dashboard */}
      <section className="analytics-showcase">
        <h2>Real-Time Analytics Engine</h2>
        <p>Our multi-modal analysis system provides unprecedented insight into dating performance</p>
        
        <div className="analytics-grid">
          {analyticsFeatures.map((feature, index) => (
            <div key={index} className="analytics-card">
              <div className="analytics-header">
                <h4>{feature.name}</h4>
                <div className={`status-indicator ${feature.status}`}>
                  <div className="status-dot"></div>
                  {feature.status}
                </div>
              </div>
              <div className="accuracy-score">{feature.accuracy}</div>
              <div className="accuracy-label">Accuracy Rate</div>
            </div>
          ))}
        </div>
      </section>

      {/* Technology Stack */}
      <section className="tech-stack">
        <h2>Cutting-Edge Technology Stack</h2>
        
        <div className="tech-categories">
          <div className="tech-category">
            <h3>AI & Machine Learning</h3>
            <ul>
              <li>Hume AI - Emotional Intelligence</li>
              <li>TensorFlow.js - Computer Vision</li>
              <li>ML5.js - Face & Gesture Tracking</li>
              <li>Custom NLP - Conversation Analysis</li>
            </ul>
          </div>
          
          <div className="tech-category">
            <h3>Immersive Technologies</h3>
            <ul>
              <li>Three.js - 3D Avatar Rendering</li>
              <li>Ready Player Me - Avatar Creation</li>
              <li>WebGL - Real-time Graphics</li>
              <li>WebRTC - Live Video Integration</li>
            </ul>
          </div>
          
          <div className="tech-category">
            <h3>Real-Time Analytics</h3>
            <ul>
              <li>Multi-modal Emotion Detection</li>
              <li>Performance Scoring Algorithms</li>
              <li>Adaptive Curriculum Engine</li>
              <li>Behavioral Pattern Recognition</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="demo-cta">
        <div className="cta-section">
          <h2>Ready to Experience the Future of Dating?</h2>
          <p>See our complete platform in action with <strong>LIVE VOICE AI CONVERSATIONS</strong></p>
          <div className="cta-buttons">
            <button 
              className="cta-primary"
              onClick={() => navigate('/live-demo-controller')}
            >
              🎯 Start Live Demo Controller
            </button>
            <button 
              className="cta-secondary"
              onClick={() => navigate('/coach-call/grace')}
            >
              🎤 Try Live Voice AI Coaching Now
            </button>
          </div>
          <p className="voice-emphasis">⚡ Not text chats - Real voice conversations with AI avatars!</p>
        </div>
      </section>
    </div>
  );
};

export default InvestorDemo;
