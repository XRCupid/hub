// Basic NPC Dating Scenarios - Phase 1 Implementation
// 3 simple but effective scenarios that provide immediate value

import React, { useState, useEffect } from 'react';
import { PerformanceAnalytics } from '../utils/performanceAnalytics';
import './BasicNPCScenarios.css';

interface BasicNPCScenario {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  learningObjective: string;
  npcBehavior: NPCBehavior;
  successCriteria: string[];
  failurePatterns: string[];
}

interface NPCBehavior {
  responseSpeed: 'fast' | 'medium' | 'slow';
  enthusiasm: number; // 0-1
  interest_decline_rate: number; // How quickly interest drops if user makes mistakes
  rejection_style: 'polite' | 'direct' | 'gradual_fade';
  conversation_depth: number; // 0-1
}

const BasicNPCScenarios: React.FC = () => {
  const [currentScenario, setCurrentScenario] = useState<BasicNPCScenario | null>(null);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [npcInterestLevel, setNpcInterestLevel] = useState(0.7);
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  
  const analytics = new PerformanceAnalytics();

  // 3 CORE SCENARIOS FOR IMMEDIATE IMPLEMENTATION
  const scenarios: BasicNPCScenario[] = [
    {
      id: 'polite_rejection',
      name: 'Learning to Handle Polite Rejection',
      description: 'Practice responding gracefully when someone isn\'t interested',
      difficulty: 'medium',
      learningObjective: 'Accept rejection without taking it personally or trying to convince',
      npcBehavior: {
        responseSpeed: 'medium',
        enthusiasm: 0.3, // Low interest from start
        interest_decline_rate: 0.1,
        rejection_style: 'polite',
        conversation_depth: 0.4
      },
      successCriteria: [
        'Accept the "no" gracefully',
        'Don\'t try to convince or negotiate',
        'End conversation positively',
        'Don\'t take it personally'
      ],
      failurePatterns: [
        'Arguing or trying to convince',
        'Getting defensive or hurt',
        'Asking "why" repeatedly',
        'Making it about their loss'
      ]
    },
    
    {
      id: 'slow_responder',
      name: 'Patience with Slow Communication',
      description: 'Learn emotional regulation when someone takes time to respond',
      difficulty: 'easy',
      learningObjective: 'Maintain composure and avoid over-texting when responses are delayed',
      npcBehavior: {
        responseSpeed: 'slow', // 2-5 minute delays
        enthusiasm: 0.7, // Actually interested, just busy
        interest_decline_rate: 0.3, // Interest drops if user gets impatient
        rejection_style: 'gradual_fade',
        conversation_depth: 0.8
      },
      successCriteria: [
        'Wait patiently for responses',
        'Don\'t send follow-up messages',
        'Maintain message quality despite delays',
        'Stay positive and relaxed'
      ],
      failurePatterns: [
        'Double/triple texting',
        'Getting anxious about delays',
        'Sending "???" or "hello?" messages',
        'Assuming they\'re not interested'
      ]
    },
    
    {
      id: 'interest_mismatch',
      name: 'Recognizing Interest Mismatch',
      description: 'Learn to recognize when someone is being polite but not truly engaged',
      difficulty: 'hard',
      learningObjective: 'Identify and gracefully exit when interest isn\'t mutual',
      npcBehavior: {
        responseSpeed: 'medium',
        enthusiasm: 0.4, // Polite but not engaged
        interest_decline_rate: 0.05, // Very gradual decline
        rejection_style: 'gradual_fade',
        conversation_depth: 0.2 // Surface level only
      },
      successCriteria: [
        'Recognize the low engagement signs',
        'Stop investing heavily in conversation',
        'Exit gracefully without confrontation',
        'Don\'t take it personally'
      ],
      failurePatterns: [
        'Over-investing in one-sided conversation',
        'Trying to force engagement',
        'Missing the subtle disinterest signals',
        'Getting frustrated or pushy'
      ]
    }
  ];

  // NPC MESSAGE GENERATION
  const generateNPCResponse = (userMsg: string, scenario: BasicNPCScenario, context: any): string => {
    const behavior = scenario.npcBehavior;
    
    switch (scenario.id) {
      case 'polite_rejection':
        return handlePoliteRejectionScenario(userMsg, context, behavior);
      case 'slow_responder':
        return handleSlowResponderScenario(userMsg, context, behavior);
      case 'interest_mismatch':
        return handleInterestMismatchScenario(userMsg, context, behavior);
      default:
        return "I'm not sure how to respond to that.";
    }
  };

  const handlePoliteRejectionScenario = (userMsg: string, context: any, behavior: NPCBehavior): string => {
    const messageCount = conversationHistory.length;
    
    if (messageCount < 2) {
      return "Hi! Thanks for reaching out. How has your day been?";
    } else if (messageCount < 4) {
      return "That's nice! I've been pretty busy with work lately.";
    } else if (messageCount === 4) {
      // Time for polite rejection
      return "I appreciate you asking, but I don't think we're a romantic match. I hope you find someone wonderful though!";
    } else {
      // If user continues after rejection
      if (userMsg.toLowerCase().includes('why') || userMsg.toLowerCase().includes('chance')) {
        return "I just don't feel that connection, and that's okay! These things happen.";
      } else {
        return "I hope you understand. Take care!";
      }
    }
  };

  const handleSlowResponderScenario = (userMsg: string, context: any, behavior: NPCBehavior): string => {
    // Simulate delays with actual setTimeout in real implementation
    const responses = [
      "Hey! Sorry for the delay, I was in a meeting. How's your evening going?",
      "That sounds really interesting! I love hearing about people's passions. Tell me more!",
      "Haha, that's so funny! I have a similar story actually...",
      "I'm really enjoying our conversation! What do you like to do on weekends?",
      "That's so cool! I'd love to hear more about that sometime."
    ];
    
    return responses[Math.min(conversationHistory.length, responses.length - 1)];
  };

  const handleInterestMismatchScenario = (userMsg: string, context: any, behavior: NPCBehavior): string => {
    const responses = [
      "Hi there.",
      "Yeah, it's fine.",
      "Oh okay.",
      "That's nice.",
      "Cool.",
      "Mm hmm.",
      "Right."
    ];
    
    // Get progressively shorter and less engaged
    const responseIndex = Math.min(conversationHistory.length, responses.length - 1);
    return responses[responseIndex];
  };

  // PERFORMANCE TRACKING INTEGRATION
  const analyzeUserPerformance = (scenario: BasicNPCScenario, userMessages: string[]): any => {
    const performance = {
      scenario_id: scenario.id,
      total_messages: userMessages.length,
      over_pursuit: false,
      graceful_handling: false,
      emotional_regulation: 0.5,
      lesson_learned: false
    };

    switch (scenario.id) {
      case 'polite_rejection':
        performance.over_pursuit = userMessages.some(msg => 
          msg.toLowerCase().includes('why') || 
          msg.toLowerCase().includes('please') ||
          msg.toLowerCase().includes('chance')
        );
        performance.graceful_handling = !performance.over_pursuit && userMessages.some(msg =>
          msg.toLowerCase().includes('understand') ||
          msg.toLowerCase().includes('thanks') ||
          msg.toLowerCase().includes('good luck')
        );
        break;
        
      case 'slow_responder':
        const impatientMessages = userMessages.filter(msg => 
          msg.includes('??') || 
          msg.toLowerCase().includes('hello?') ||
          msg.toLowerCase().includes('there?')
        );
        performance.over_pursuit = impatientMessages.length > 0;
        performance.emotional_regulation = Math.max(0, 1 - (impatientMessages.length / userMessages.length));
        break;
        
      case 'interest_mismatch':
        const longMessages = userMessages.filter(msg => msg.length > 100);
        performance.over_pursuit = longMessages.length > userMessages.length * 0.5;
        performance.graceful_handling = userMessages.length < 5; // Recognized and stopped early
        break;
    }

    return performance;
  };

  const handleSendMessage = () => {
    if (!userMessage.trim() || !currentScenario) return;

    // Add user message to conversation
    const newHistory = [...conversationHistory, { sender: 'user', message: userMessage, timestamp: Date.now() }];
    
    // Generate NPC response
    const npcResponse = generateNPCResponse(userMessage, currentScenario, { conversationHistory: newHistory });
    
    // Add NPC response with slight delay for realism
    setTimeout(() => {
      setConversationHistory(prev => [...prev, { sender: 'npc', message: npcResponse, timestamp: Date.now() }]);
    }, currentScenario.npcBehavior.responseSpeed === 'slow' ? 3000 : 1000);
    
    setConversationHistory(newHistory);
    setUserMessage('');
    
    // Check if scenario should end
    if (newHistory.length >= 8) {
      endScenario();
    }
  };

  const endScenario = () => {
    if (!currentScenario) return;
    
    const userMessages = conversationHistory.filter(msg => msg.sender === 'user').map(msg => msg.message);
    const performance = analyzeUserPerformance(currentScenario, userMessages);
    
    // Use the analytics system
    const sessionData = {
      emotionData: [{ stress: performance.over_pursuit ? 0.8 : 0.3, confidence: performance.graceful_handling ? 0.8 : 0.4 }],
      conversationData: conversationHistory,
      coachId: 'grace', // Default to Grace for emotional intelligence scenarios
      duration: (Date.now() - sessionStartTime) / 1000
    };
    
    const analytics = new PerformanceAnalytics();
    const sessionAnalytics = analytics.trackSessionPerformance(sessionData);
    
    // Show results
    alert(`Scenario Complete!\nPerformance: ${JSON.stringify(performance, null, 2)}`);
  };

  return (
    <div className="basic-npc-scenarios">
      <h2>Practice Dating Scenarios</h2>
      
      {!currentScenario ? (
        <div className="scenario-selection">
          <h3>Choose a scenario to practice:</h3>
          {scenarios.map(scenario => (
            <div key={scenario.id} className="scenario-card" onClick={() => {
              setCurrentScenario(scenario);
              setSessionStartTime(Date.now());
              setConversationHistory([]);
              setNpcInterestLevel(scenario.npcBehavior.enthusiasm);
            }}>
              <h4>{scenario.name}</h4>
              <p>{scenario.description}</p>
              <div className="difficulty">Difficulty: {scenario.difficulty}</div>
              <div className="objective">Goal: {scenario.learningObjective}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="active-scenario">
          <div className="scenario-header">
            <h3>{currentScenario.name}</h3>
            <p>Goal: {currentScenario.learningObjective}</p>
            <button onClick={() => setCurrentScenario(null)}>← Back to Scenarios</button>
          </div>
          
          <div className="conversation-area">
            {conversationHistory.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                <strong>{msg.sender === 'user' ? 'You' : 'Alex'}:</strong> {msg.message}
              </div>
            ))}
          </div>
          
          <div className="input-area">
            <input
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
          
          <div className="coaching-hints">
            <h4>Success Criteria:</h4>
            <ul>
              {currentScenario.successCriteria.map((criteria, index) => (
                <li key={index}>{criteria}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default BasicNPCScenarios;
