import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import EnhancedCoachSession from './EnhancedCoachSession';
import NPCDateCall from './NPCDateCall';
import { ConversationToolkit } from './ConversationToolkit';
import { 
  CONVERSATION_MODULES, 
  ConversationModule,
  CuriosityItem 
} from '../config/conversationModules';
import './IntegratedCoachDateExperience.css';

interface ConversationTip {
  id: string;
  text: string;
  category: string;
  timing: 'opener' | 'mid' | 'closer';
}

interface DateProgress {
  phase: 'pre-date' | 'active-date' | 'post-date';
  coachingReceived: boolean;
  toolkitUsed: boolean;
  performanceScore: number;
}

export const IntegratedCoachDateExperience: React.FC = () => {
  const navigate = useNavigate();
  const [currentPhase, setCurrentPhase] = useState<'prep' | 'date' | 'review'>('prep');
  const [selectedNPC, setSelectedNPC] = useState<any>(null);
  const [coachId, setCoachId] = useState<string>('grace');
  const [dateProgress, setDateProgress] = useState<DateProgress>({
    phase: 'pre-date',
    coachingReceived: false,
    toolkitUsed: false,
    performanceScore: 0
  });
  
  // Conversation toolkit integration
  const [activeTips, setActiveTips] = useState<ConversationTip[]>([]);
  const [usedModules, setUsedModules] = useState<string[]>([]);
  const [curiosityItems, setCuriosityItems] = useState<CuriosityItem[]>([]);
  
  // Performance tracking
  const [conversationMetrics, setConversationMetrics] = useState({
    engagement: 0,
    topicVariety: 0,
    emotionalConnection: 0,
    questionsAsked: 0,
    storiesShared: 0
  });

  const NPC_PROFILES = [
    {
      id: 'sophia',
      name: 'Sophia',
      archetype: 'Creative Artist',
      interests: ['art', 'travel', 'philosophy'],
      conversationStyle: 'thoughtful and imaginative'
    },
    {
      id: 'alex',
      name: 'Alex',
      archetype: 'Tech Innovator',
      interests: ['technology', 'startups', 'future'],
      conversationStyle: 'analytical and passionate'
    },
    {
      id: 'maya',
      name: 'Maya',
      archetype: 'Nature Enthusiast',
      interests: ['hiking', 'sustainability', 'wellness'],
      conversationStyle: 'warm and grounded'
    }
  ];

  // Pre-date coaching integration
  const generatePreDateCoaching = () => {
    const relevantModules = CONVERSATION_MODULES.filter(module => {
      // Match modules to NPC interests
      if (selectedNPC?.interests.includes('art') && module.category === 'storytelling') return true;
      if (selectedNPC?.interests.includes('technology') && module.category === 'hypotheticals') return true;
      if (selectedNPC?.interests.includes('philosophy') && module.category === 'questions') return true;
      return module.category === 'anecdotes'; // Always include anecdotes
    });

    const tips: ConversationTip[] = relevantModules.slice(0, 3).map(module => ({
      id: module.id,
      text: module.examples[0]?.text || module.description,
      category: module.category,
      timing: module.category === 'questions' ? 'opener' : 'mid'
    }));

    setActiveTips(tips);
    return relevantModules;
  };

  // Real-time conversation suggestions
  const getConversationSuggestion = (timing: 'opener' | 'mid' | 'closer') => {
    const availableTips = activeTips.filter(tip => tip.timing === timing);
    if (availableTips.length === 0) return null;
    
    return availableTips[Math.floor(Math.random() * availableTips.length)];
  };

  // Track toolkit usage during date
  const recordToolkitUsage = (moduleId: string) => {
    setUsedModules(prev => [...prev, moduleId]);
    setDateProgress(prev => ({ ...prev, toolkitUsed: true }));
    
    // Update metrics
    setConversationMetrics(prev => ({
      ...prev,
      topicVariety: Math.min(prev.topicVariety + 10, 100),
      engagement: Math.min(prev.engagement + 5, 100)
    }));
  };

  // Post-date analysis
  const generatePostDateAnalysis = () => {
    const totalScore = Object.values(conversationMetrics).reduce((a, b) => a + b, 0) / 5;
    
    const analysis = {
      overallScore: Math.round(totalScore),
      strengths: [] as string[],
      improvements: [] as string[],
      recommendedModules: [] as string[]
    };

    // Analyze performance
    if (conversationMetrics.questionsAsked < 30) {
      analysis.improvements.push('Ask more open-ended questions');
      analysis.recommendedModules.push('questions');
    }
    if (conversationMetrics.storiesShared < 30) {
      analysis.improvements.push('Share more personal anecdotes');
      analysis.recommendedModules.push('anecdotes');
    }
    if (conversationMetrics.engagement > 70) {
      analysis.strengths.push('Great engagement and active listening');
    }

    return analysis;
  };

  const handleStartPrep = () => {
    setCurrentPhase('prep');
    setDateProgress({ ...dateProgress, phase: 'pre-date' });
  };

  const handleStartDate = () => {
    if (!selectedNPC) {
      alert('Please select someone to date first!');
      return;
    }
    setCurrentPhase('date');
    setDateProgress({ ...dateProgress, phase: 'active-date' });
  };

  const handleDateEnd = () => {
    setCurrentPhase('review');
    setDateProgress({ ...dateProgress, phase: 'post-date' });
  };

  const renderPrepPhase = () => (
    <div className="prep-phase">
      <h2>Pre-Date Preparation</h2>
      
      {/* NPC Selection */}
      <div className="npc-selection">
        <h3>Choose Your Date</h3>
        <div className="npc-grid">
          {NPC_PROFILES.map(npc => (
            <div 
              key={npc.id}
              className={`npc-card ${selectedNPC?.id === npc.id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedNPC(npc);
                generatePreDateCoaching();
              }}
            >
              <h4>{npc.name}</h4>
              <p className="archetype">{npc.archetype}</p>
              <p className="style">{npc.conversationStyle}</p>
              <div className="interests">
                {npc.interests.map(interest => (
                  <span key={interest} className="interest-tag">{interest}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedNPC && (
        <>
          {/* Coach Selection */}
          <div className="coach-selection">
            <h3>Choose Your Coach</h3>
            <div className="coach-options">
              <button 
                className={coachId === 'grace' ? 'active' : ''}
                onClick={() => setCoachId('grace')}
              >
                Grace - Emotional Intelligence
              </button>
              <button 
                className={coachId === 'rizzo' ? 'active' : ''}
                onClick={() => setCoachId('rizzo')}
              >
                Rizzo - Confidence & Charm
              </button>
              <button 
                className={coachId === 'posie' ? 'active' : ''}
                onClick={() => setCoachId('posie')}
              >
                Posie - Authentic Connection
              </button>
            </div>
          </div>

          {/* Integrated Coaching Session */}
          <div className="coaching-section">
            <h3>Pre-Date Coaching Session</h3>
            <p>Get personalized tips for your date with {selectedNPC.name}</p>
            
            {/* Conversation Tips Preview */}
            <div className="tips-preview">
              <h4>Recommended Conversation Starters:</h4>
              {activeTips.map(tip => (
                <div key={tip.id} className="tip-card">
                  <span className="tip-category">{tip.category}</span>
                  <p>{tip.text}</p>
                </div>
              ))}
            </div>

            <button 
              className="start-coaching-btn"
              onClick={() => {
                setDateProgress({ ...dateProgress, coachingReceived: true });
                // This would open the coach session with context
              }}
            >
              Start Coaching Session with {coachId}
            </button>
          </div>

          {/* Conversation Toolkit Preview */}
          <div className="toolkit-preview">
            <h3>Your Conversation Toolkit</h3>
            <ConversationToolkit userId="user" />
          </div>

          <button 
            className="start-date-btn"
            onClick={handleStartDate}
            disabled={!dateProgress.coachingReceived}
          >
            {dateProgress.coachingReceived 
              ? `Start Date with ${selectedNPC.name}`
              : 'Complete coaching session first'
            }
          </button>
        </>
      )}
    </div>
  );

  const renderDatePhase = () => (
    <div className="date-phase">
      {/* Live Conversation Tips Overlay */}
      <div className="live-tips-overlay">
        <h4>Conversation Suggestions</h4>
        <button 
          className="tip-btn"
          onClick={() => {
            const tip = getConversationSuggestion('opener');
            if (tip) recordToolkitUsage(tip.id);
          }}
        >
          Get Opening Line
        </button>
        <button 
          className="tip-btn"
          onClick={() => {
            const tip = getConversationSuggestion('mid');
            if (tip) recordToolkitUsage(tip.id);
          }}
        >
          Change Topic
        </button>
      </div>

      {/* Date Call Component */}
      <NPCDateCall
        npcName={selectedNPC?.name || ''}
        npcArchetype={selectedNPC?.archetype || ''}
        userName="You"
        onCallEnd={handleDateEnd}
      />

      {/* Real-time Metrics */}
      <div className="live-metrics">
        <div className="metric">
          <span>Engagement</span>
          <div className="metric-bar">
            <div 
              className="metric-fill"
              style={{ width: `${conversationMetrics.engagement}%` }}
            />
          </div>
        </div>
        <div className="metric">
          <span>Topic Variety</span>
          <div className="metric-bar">
            <div 
              className="metric-fill"
              style={{ width: `${conversationMetrics.topicVariety}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderReviewPhase = () => {
    const analysis = generatePostDateAnalysis();
    
    return (
      <div className="review-phase">
        <h2>Date Review & Coaching</h2>
        
        <div className="performance-summary">
          <div className="overall-score">
            <h3>Overall Performance</h3>
            <div className="score-circle">
              {analysis.overallScore}%
            </div>
          </div>

          <div className="metrics-breakdown">
            <h3>Conversation Metrics</h3>
            {Object.entries(conversationMetrics).map(([key, value]) => (
              <div key={key} className="metric-row">
                <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span>{value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="toolkit-usage">
          <h3>Toolkit Usage</h3>
          <p>You used {usedModules.length} conversation modules during the date</p>
        </div>

        <div className="coaching-recommendations">
          <h3>Recommended Next Steps</h3>
          
          <div className="strengths">
            <h4>Strengths:</h4>
            <ul>
              {analysis.strengths.map((strength, idx) => (
                <li key={idx}>{strength}</li>
              ))}
            </ul>
          </div>

          <div className="improvements">
            <h4>Areas to Improve:</h4>
            <ul>
              {analysis.improvements.map((improvement, idx) => (
                <li key={idx}>{improvement}</li>
              ))}
            </ul>
          </div>

          <div className="recommended-lessons">
            <h4>Recommended Practice:</h4>
            {analysis.recommendedModules.map(moduleType => (
              <button 
                key={moduleType}
                className="lesson-btn"
                onClick={() => setUsedModules([...usedModules, moduleType])}
              >
                Practice {moduleType}
              </button>
            ))}
          </div>
        </div>

        <div className="action-buttons">
          <button onClick={() => setCurrentPhase('prep')}>
            Try Another Date
          </button>
          <button className="primary" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="integrated-coach-date-experience">
      <div className="experience-header">
        <h1>XRCupid Dating Experience</h1>
        <div className="phase-indicator">
          <div className={`phase ${currentPhase === 'prep' ? 'active' : ''}`}>
            1. Preparation
          </div>
          <div className={`phase ${currentPhase === 'date' ? 'active' : ''}`}>
            2. Live Date
          </div>
          <div className={`phase ${currentPhase === 'review' ? 'active' : ''}`}>
            3. Review & Learn
          </div>
        </div>
      </div>

      <div className="experience-content">
        {currentPhase === 'prep' && renderPrepPhase()}
        {currentPhase === 'date' && renderDatePhase()}
        {currentPhase === 'review' && renderReviewPhase()}
      </div>
    </div>
  );
};

export default IntegratedCoachDateExperience;
