import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LiveDemoController.css';

interface DemoStep {
  id: string;
  title: string;
  description: string;
  route: string;
  duration: number; // in seconds
  keyFeatures: string[];
  investorTalkingPoints: string[];
}

const LiveDemoController: React.FC = () => {
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isAutoMode, setIsAutoMode] = useState<boolean>(false);
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  const demoSteps: DemoStep[] = [
    {
      id: 'intro',
      title: 'Platform Overview',
      description: 'Live metrics and technology stack demonstration',
      route: '/investor-demo',
      duration: 180, // 3 minutes
      keyFeatures: [
        'Real-time user analytics',
        'AI/ML technology stack',
        'Multi-modal emotion tracking',
        'Scalable cloud architecture'
      ],
      investorTalkingPoints: [
        '$2B+ dating coaching market opportunity',
        'First-mover advantage in adaptive AI dating education',
        'Evidence-based therapeutic integration',
        'Freemium to premium revenue model'
      ]
    },
    {
      id: 'live-coaching',
      title: 'Live AI Coaching Session',
      description: 'ACTUAL VOICE CONVERSATION with Grace using full avatar and Hume AI system',
      route: '/coach-call/grace', // This uses CoachSession.tsx with HybridVoiceService
      duration: 240, // 4 minutes
      keyFeatures: [
        'LIVE VOICE CONVERSATION with Hume AI',
        'Real-time 3D avatar with lip sync and emotions',
        'Live facial expression tracking of user',
        'Performance analytics during actual conversation',
        'Adaptive curriculum based on user performance'
      ],
      investorTalkingPoints: [
        'Proprietary Hume AI integration for emotional analysis',
        'Ready Player Me avatars with real-time lip sync',
        'Computer vision face tracking and mirroring',
        'Therapeutic conversation algorithms',
        'NOT TEXT CHAT - Real voice conversations'
      ]
    },
    {
      id: 'speed-dating',
      title: 'Live Speed Dating Simulation',
      description: 'ACTUAL VOICE DATING SIMULATION with comprehensive analytics',
      route: '/speed-date-dougie-v2', // This uses DougieSpeedDateV2.tsx with HybridVoiceService
      duration: 300, // 5 minutes
      keyFeatures: [
        'LIVE VOICE CONVERSATION with AI Dougie',
        'Multi-modal emotion detection (face + voice)',
        'Real-time chemistry scoring algorithms',
        'Live conversation analysis with avatar responses',
        'Post-session performance report with transcript'
      ],
      investorTalkingPoints: [
        'Revolutionary dating practice with LIVE VOICE AI',
        'Comprehensive behavioral analytics during conversation',
        'Skill improvement through deliberate practice',
        'Massive user engagement through voice interaction',
        'Clear differentiation from text-based competitors'
      ]
    },
    {
      id: 'conference-demo',
      title: 'Live Multi-Person Demo',
      description: 'Real-time analysis of actual human interaction',
      route: '/conference-booth',
      duration: 180, // 3 minutes
      keyFeatures: [
        'Live computer vision on real people',
        'Real-time chemistry analysis between participants',
        'Multi-person emotional synchronization',
        'Audience analytics dashboard',
        'Live coaching recommendations'
      ],
      investorTalkingPoints: [
        'Technology works on real human interactions',
        'Scalable to group settings and social events',
        'B2B opportunities (corporate team building, events)',
        'Data collection for improving algorithms',
        'Platform network effects and viral growth'
      ]
    },
    {
      id: 'alternative-coaching',
      title: 'Alternative AI Coaching Experience',
      description: 'VOICE CONVERSATION with different AI personality',
      route: '/dougie-coach-simple', // This uses DougieCoachSimple.tsx with HybridVoiceService
      duration: 180, // 3 minutes
      keyFeatures: [
        'Different AI personality for coaching',
        'LIVE VOICE interaction with avatar',
        'Real-time emotional analysis',
        'Conversation-based skill development',
        'Personalized coaching approach'
      ],
      investorTalkingPoints: [
        'Multiple AI personalities for different user needs',
        'Scalable coaching through voice AI',
        'Personalized learning experiences',
        'Reduced cost compared to human coaches',
        'Available 24/7 for users worldwide'
      ]
    }
  ];

  const currentStep = demoSteps[currentStepIndex];
  const totalDuration = demoSteps.reduce((sum, step) => sum + step.duration, 0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - stepStartTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [stepStartTime]);

  useEffect(() => {
    if (isAutoMode && elapsedTime >= currentStep.duration * 1000) {
      nextStep();
    }
  }, [elapsedTime, isAutoMode, currentStep.duration]);

  const startAutoDemo = () => {
    setIsAutoMode(true);
    setCurrentStepIndex(0);
    setStepStartTime(Date.now());
    navigate(demoSteps[0].route);
  };

  const nextStep = () => {
    if (currentStepIndex < demoSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setStepStartTime(Date.now());
      navigate(demoSteps[nextIndex].route);
    } else {
      setIsAutoMode(false);
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      setStepStartTime(Date.now());
      navigate(demoSteps[prevIndex].route);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStepIndex(stepIndex);
    setStepStartTime(Date.now());
    navigate(demoSteps[stepIndex].route);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const completedTime = demoSteps.slice(0, currentStepIndex).reduce((sum, step) => sum + step.duration, 0);
    const currentStepProgress = Math.min(elapsedTime / 1000, currentStep.duration);
    return ((completedTime + currentStepProgress) / totalDuration) * 100;
  };

  return (
    <div className="live-demo-controller">
      <div className="controller-header">
        <h1>🎯 Million Dollar Demo Controller</h1>
        <p>Navigate through live XRCupid demonstrations with investor talking points</p>
      </div>

      <div className="demo-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
        <div className="progress-info">
          <span>Step {currentStepIndex + 1} of {demoSteps.length}</span>
          <span>{formatTime(Math.floor(elapsedTime / 1000))} / {formatTime(currentStep.duration)}</span>
          <span>Total: {formatTime(totalDuration)}</span>
        </div>
      </div>

      <div className="current-step">
        <div className="step-header">
          <h2>{currentStep.title}</h2>
          <p>{currentStep.description}</p>
        </div>

        <div className="step-content">
          <div className="features-column">
            <h3>🚀 Key Features Being Demonstrated</h3>
            <ul className="features-list">
              {currentStep.keyFeatures.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>

          <div className="talking-points-column">
            <h3>💰 Investor Talking Points</h3>
            <ul className="talking-points-list">
              {currentStep.investorTalkingPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="controller-actions">
        <div className="navigation-controls">
          <button 
            onClick={previousStep}
            disabled={currentStepIndex === 0}
            className="nav-btn prev-btn"
          >
            ← Previous
          </button>

          <button 
            onClick={() => navigate(currentStep.route)}
            className="nav-btn current-btn"
          >
            Go to {currentStep.title}
          </button>

          <button 
            onClick={nextStep}
            disabled={currentStepIndex === demoSteps.length - 1}
            className="nav-btn next-btn"
          >
            Next →
          </button>
        </div>

        <div className="auto-controls">
          <button 
            onClick={startAutoDemo}
            className={`auto-btn ${isAutoMode ? 'active' : ''}`}
          >
            {isAutoMode ? '⏸️ Pause Auto Demo' : '▶️ Start Auto Demo'}
          </button>
        </div>
      </div>

      <div className="step-timeline">
        <h3>Demo Timeline</h3>
        <div className="timeline-steps">
          {demoSteps.map((step, index) => (
            <div 
              key={step.id}
              className={`timeline-step ${index === currentStepIndex ? 'current' : ''} ${index < currentStepIndex ? 'completed' : ''}`}
              onClick={() => goToStep(index)}
            >
              <div className="step-number">{index + 1}</div>
              <div className="step-info">
                <div className="step-title">{step.title}</div>
                <div className="step-duration">{formatTime(step.duration)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="demo-tips">
        <h3>💡 Demo Tips</h3>
        <ul>
          <li><strong>Emphasize Live Interaction:</strong> These are real AI conversations, not pre-recorded demos</li>
          <li><strong>Highlight Technology Stack:</strong> Hume AI, computer vision, real-time analytics</li>
          <li><strong>Show User Value:</strong> Clear skill improvement and confidence building</li>
          <li><strong>Discuss Scalability:</strong> Cloud-ready architecture, API-driven design</li>
          <li><strong>Market Opportunity:</strong> $2B+ market with massive unmet demand</li>
        </ul>
      </div>
    </div>
  );
};

export default LiveDemoController;
