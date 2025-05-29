import React, { useState, useRef, useEffect } from 'react';
import './PhoneCallTraining.css';

interface CallScenario {
  id: string;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  objective: string;
  context: string;
  npcPersonality: string;
  challenges: string[];
  successMetrics: string[];
}

interface VoiceAnalytics {
  pace: number; // words per minute
  tonality: number; // 1-10 warmth scale
  confidence: number; // 1-10 confidence scale
  engagement: number; // 1-10 engagement scale
  pauseQuality: number; // strategic pause usage
  questionRatio: number; // questions vs statements
  activeListening: number; // response relevance
}

interface PhoneCallTrainingProps {
  scenario?: string;
  npcProfile?: any;
  onComplete?: () => void;
}

const CALL_SCENARIOS: CallScenario[] = [
  {
    id: 'first-call',
    title: 'The First Phone Call',
    difficulty: 'beginner',
    duration: '10-15 minutes',
    objective: 'Build rapport and set up an in-person date',
    context: 'You\'ve been texting for 3 days. Good chemistry. Time to hear each other\'s voices.',
    npcPersonality: 'Friendly but slightly nervous about phone calls',
    challenges: [
      'Breaking the initial awkwardness',
      'Transitioning from text energy to voice energy',
      'Finding natural conversation flow',
      'Suggesting a date without pressure'
    ],
    successMetrics: [
      'Natural conversation within 2 minutes',
      'At least 3 genuine laughs',
      'Successfully suggest and plan a date',
      'End on a high note with anticipation'
    ]
  },
  {
    id: 'video-date',
    title: 'Virtual Date Night',
    difficulty: 'intermediate',
    duration: '45-60 minutes',
    objective: 'Create intimate connection through video',
    context: 'Long-distance or pandemic situation. Making video feel like a real date.',
    npcPersonality: 'Romantic but tech-challenged',
    challenges: [
      'Managing technical difficulties gracefully',
      'Creating romantic atmosphere virtually',
      'Maintaining eye contact through camera',
      'Keeping energy high for extended time'
    ],
    successMetrics: [
      'Smooth tech troubleshooting',
      'Create 2+ intimate moments',
      'Maintain engagement for full duration',
      'Plan follow-up activities'
    ]
  },
  {
    id: 'difficult-conversation',
    title: 'The Difficult Topic',
    difficulty: 'advanced',
    duration: '20-30 minutes',
    objective: 'Navigate disagreement while maintaining connection',
    context: 'You discover you have different views on something important.',
    npcPersonality: 'Passionate about their beliefs but open-minded',
    challenges: [
      'Staying calm when disagreeing',
      'Finding common ground',
      'Showing respect for their perspective',
      'Knowing when to change topics'
    ],
    successMetrics: [
      'No raised voices or defensiveness',
      'Find at least one point of agreement',
      'Both feel heard and respected',
      'Successfully pivot to lighter topics'
    ]
  }
];

const VOICE_TECHNIQUES = [
  {
    name: 'The Warm Opening',
    description: 'Start with genuine enthusiasm and energy',
    example: '"Hey! It\'s so good to finally hear your voice! How was your day?"',
    tips: [
      'Smile while talking - it comes through in your voice',
      'Use their name within the first 30 seconds',
      'Match their energy level initially'
    ]
  },
  {
    name: 'Strategic Pausing',
    description: 'Use silence to create intimacy and show listening',
    example: 'After they share something meaningful, pause 2-3 seconds before responding',
    tips: [
      'Don\'t rush to fill every silence',
      'Pause after asking important questions',
      'Use "hmm" or "wow" to show processing'
    ]
  },
  {
    name: 'Voice Mirroring',
    description: 'Subtly match their speaking pace and volume',
    example: 'If they speak slowly and softly, don\'t be loud and fast',
    tips: [
      'Mirror their energy, not their exact voice',
      'Adjust gradually, not immediately',
      'Pay attention to their comfort level'
    ]
  }
];

const CONVERSATION_STARTERS = {
  phone: [
    "I have to say, your voice is exactly what I imagined!",
    "So this is way better than texting - I can actually hear you laugh!",
    "I\'ve been looking forward to this call all day. How are you feeling about finally talking?",
    "Okay, first impression: your voice is [compliment]. Now tell me about your day!"
  ],
  video: [
    "Wow, seeing you smile in real-time is so much better than photos!",
    "I love your setup! Give me the tour of your space.",
    "You look great! I\'m slightly nervous but excited - how about you?",
    "This feels like a real date already. Should we pretend we\'re at a fancy restaurant?"
  ]
};

const TRANSITION_PHRASES = [
  "That reminds me of something I wanted to ask you...",
  "Speaking of [topic], I\'ve been curious about...",
  "You know what\'s funny about that?",
  "I have to tell you something related to that...",
  "That\'s so interesting! It makes me think of..."
];

export const PhoneCallTraining: React.FC<PhoneCallTrainingProps> = ({ scenario, npcProfile, onComplete }) => {
  const [activeScenario, setActiveScenario] = useState<CallScenario | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [analytics, setAnalytics] = useState<VoiceAnalytics>({
    pace: 0,
    tonality: 5,
    confidence: 5,
    engagement: 5,
    pauseQuality: 5,
    questionRatio: 0,
    activeListening: 5
  });
  const [currentPhase, setCurrentPhase] = useState<'prep' | 'active' | 'debrief'>('prep');
  const [callNotes, setCallNotes] = useState<string[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const startCall = async (scenario: CallScenario) => {
    setActiveScenario(scenario);
    setCurrentPhase('active');
    setCallDuration(0);
    setCallNotes([]);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Simulate real-time analytics (in real app, this would analyze actual audio)
      const analyticsInterval = setInterval(() => {
        setAnalytics(prev => ({
          ...prev,
          pace: 120 + Math.random() * 60, // 120-180 WPM
          confidence: Math.max(1, Math.min(10, prev.confidence + (Math.random() - 0.5) * 2)),
          engagement: Math.max(1, Math.min(10, prev.engagement + (Math.random() - 0.5) * 1.5))
        }));
      }, 5000);
      
      setTimeout(() => {
        clearInterval(analyticsInterval);
      }, 1000000); // Clear after very long time
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Please allow microphone access for call training');
    }
  };

  const endCall = () => {
    setIsRecording(false);
    setCurrentPhase('debrief');
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  const addCallNote = (note: string) => {
    setCallNotes(prev => [...prev, `${formatTime(callDuration)}: ${note}`]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderScenarioSelection = () => (
    <div className="scenario-selection">
      <h2>📞 Phone & Video Call Training</h2>
      <p>Master the transition from text to voice and build deeper connections</p>
      
      <div className="scenarios-grid">
        {CALL_SCENARIOS.map(scenario => (
          <div key={scenario.id} className="scenario-card">
            <div className="scenario-header">
              <h3>{scenario.title}</h3>
              <span className={`difficulty ${scenario.difficulty}`}>
                {scenario.difficulty}
              </span>
            </div>
            
            <div className="scenario-details">
              <div className="detail">
                <strong>Duration:</strong> {scenario.duration}
              </div>
              <div className="detail">
                <strong>Objective:</strong> {scenario.objective}
              </div>
              <div className="detail">
                <strong>Context:</strong> {scenario.context}
              </div>
            </div>
            
            <div className="scenario-challenges">
              <h4>Challenges:</h4>
              <ul>
                {scenario.challenges.map((challenge, index) => (
                  <li key={index}>{challenge}</li>
                ))}
              </ul>
            </div>
            
            <button 
              className="start-scenario-btn"
              onClick={() => startCall(scenario)}
            >
              Start Scenario
            </button>
          </div>
        ))}
      </div>
      
      <div className="techniques-section">
        <h3>🎯 Voice Techniques</h3>
        <div className="techniques-grid">
          {VOICE_TECHNIQUES.map((technique, index) => (
            <div key={index} className="technique-card">
              <h4>{technique.name}</h4>
              <p>{technique.description}</p>
              <div className="technique-example">
                <strong>Example:</strong> "{technique.example}"
              </div>
              <div className="technique-tips">
                <strong>Tips:</strong>
                <ul>
                  {technique.tips.map((tip, tipIndex) => (
                    <li key={tipIndex}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderActiveCall = () => (
    <div className="active-call">
      <div className="call-header">
        <h2>📞 {activeScenario?.title}</h2>
        <div className="call-timer">
          {formatTime(callDuration)}
        </div>
      </div>
      
      <div className="call-interface">
        <div className="npc-avatar">
          <div className="avatar-circle">
            <span className="avatar-emoji">😊</span>
          </div>
          <div className="npc-status">
            <h3>Alex</h3>
            <span className="speaking-indicator">
              {isRecording ? '🎤 Speaking...' : '🔇 Muted'}
            </span>
          </div>
        </div>
        
        <div className="real-time-analytics">
          <h4>📊 Real-time Analytics</h4>
          <div className="analytics-grid">
            <div className="metric">
              <span className="metric-label">Pace</span>
              <span className="metric-value">{Math.round(analytics.pace)} WPM</span>
              <div className="metric-bar">
                <div 
                  className="metric-fill"
                  style={{ width: `${Math.min(100, (analytics.pace / 200) * 100)}%` }}
                />
              </div>
            </div>
            
            <div className="metric">
              <span className="metric-label">Confidence</span>
              <span className="metric-value">{analytics.confidence.toFixed(1)}/10</span>
              <div className="metric-bar">
                <div 
                  className="metric-fill"
                  style={{ width: `${analytics.confidence * 10}%` }}
                />
              </div>
            </div>
            
            <div className="metric">
              <span className="metric-label">Engagement</span>
              <span className="metric-value">{analytics.engagement.toFixed(1)}/10</span>
              <div className="metric-bar">
                <div 
                  className="metric-fill"
                  style={{ width: `${analytics.engagement * 10}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="conversation-helpers">
          <h4>💡 Conversation Helpers</h4>
          
          <div className="helper-section">
            <h5>Transition Phrases:</h5>
            <div className="phrase-buttons">
              {TRANSITION_PHRASES.slice(0, 3).map((phrase, index) => (
                <button 
                  key={index}
                  className="phrase-btn"
                  onClick={() => addCallNote(`Used transition: "${phrase}"`)}
                >
                  "{phrase}"
                </button>
              ))}
            </div>
          </div>
          
          <div className="helper-section">
            <h5>Quick Notes:</h5>
            <div className="quick-notes">
              <button onClick={() => addCallNote('Great laugh moment')}>
                😂 Great Laugh
              </button>
              <button onClick={() => addCallNote('Awkward pause - recovered well')}>
                ⏸️ Pause Recovery
              </button>
              <button onClick={() => addCallNote('Deep connection moment')}>
                💕 Connection
              </button>
              <button onClick={() => addCallNote('Successfully changed topic')}>
                🔄 Topic Change
              </button>
            </div>
          </div>
        </div>
        
        <div className="call-controls">
          <button className="mute-btn">🔇 Mute</button>
          <button className="end-call-btn" onClick={endCall}>
            📞 End Call
          </button>
        </div>
      </div>
    </div>
  );

  const renderDebrief = () => (
    <div className="call-debrief">
      <div className="debrief-header">
        <h2>📋 Call Debrief: {activeScenario?.title}</h2>
        <div className="call-summary">
          <span>Duration: {formatTime(callDuration)}</span>
          <span>Notes: {callNotes.length}</span>
        </div>
      </div>
      
      <div className="debrief-content">
        <div className="analytics-summary">
          <h3>📊 Performance Analytics</h3>
          <div className="analytics-detailed">
            <div className="metric-detailed">
              <h4>Speaking Pace</h4>
              <div className="metric-score">
                <span className="score">{Math.round(analytics.pace)} WPM</span>
                <span className="assessment">
                  {analytics.pace < 140 ? 'Too Slow' : 
                   analytics.pace > 180 ? 'Too Fast' : 'Perfect'}
                </span>
              </div>
              <p>Ideal range: 140-180 words per minute for engaging conversation</p>
            </div>
            
            <div className="metric-detailed">
              <h4>Confidence Level</h4>
              <div className="metric-score">
                <span className="score">{analytics.confidence.toFixed(1)}/10</span>
                <span className="assessment">
                  {analytics.confidence < 6 ? 'Needs Work' : 
                   analytics.confidence > 8 ? 'Excellent' : 'Good'}
                </span>
              </div>
              <p>Voice tone, clarity, and assertiveness in communication</p>
            </div>
            
            <div className="metric-detailed">
              <h4>Engagement</h4>
              <div className="metric-score">
                <span className="score">{analytics.engagement.toFixed(1)}/10</span>
                <span className="assessment">
                  {analytics.engagement < 6 ? 'Needs Work' : 
                   analytics.engagement > 8 ? 'Excellent' : 'Good'}
                </span>
              </div>
              <p>Active listening, questions, and conversation flow</p>
            </div>
          </div>
        </div>
        
        <div className="call-notes-section">
          <h3>📝 Call Notes</h3>
          {callNotes.length > 0 ? (
            <div className="notes-list">
              {callNotes.map((note, index) => (
                <div key={index} className="note-item">
                  {note}
                </div>
              ))}
            </div>
          ) : (
            <p>No notes recorded during this call</p>
          )}
        </div>
        
        <div className="success-metrics">
          <h3>🎯 Success Metrics</h3>
          <div className="metrics-checklist">
            {activeScenario?.successMetrics.map((metric, index) => (
              <div key={index} className="metric-item">
                <input type="checkbox" id={`metric-${index}`} />
                <label htmlFor={`metric-${index}`}>{metric}</label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="improvement-suggestions">
          <h3>💡 Improvement Suggestions</h3>
          <div className="suggestions-list">
            {analytics.pace < 140 && (
              <div className="suggestion">
                <strong>Increase Speaking Pace:</strong> You spoke slower than ideal. Practice speaking with more energy and enthusiasm.
              </div>
            )}
            {analytics.confidence < 7 && (
              <div className="suggestion">
                <strong>Build Confidence:</strong> Practice power poses before calls and speak with more conviction.
              </div>
            )}
            {analytics.engagement < 7 && (
              <div className="suggestion">
                <strong>Improve Engagement:</strong> Ask more follow-up questions and show more enthusiasm for their responses.
              </div>
            )}
          </div>
        </div>
        
        <div className="debrief-actions">
          <button 
            className="retry-btn"
            onClick={() => startCall(activeScenario!)}
          >
            🔄 Retry Scenario
          </button>
          <button 
            className="next-scenario-btn"
            onClick={() => {
              setActiveScenario(null);
              setCurrentPhase('prep');
            }}
          >
            📞 Try Another Scenario
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="phone-call-training">
      {currentPhase === 'prep' && renderScenarioSelection()}
      {currentPhase === 'active' && renderActiveCall()}
      {currentPhase === 'debrief' && renderDebrief()}
    </div>
  );
};

export default PhoneCallTraining;
