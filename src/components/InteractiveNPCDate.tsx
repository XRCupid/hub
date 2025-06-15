import React, { useState, useEffect } from 'react';

interface DateScenario {
  id: string;
  npcName: string;
  setting: string;
  personality: string;
  background: string;
}

interface DateMessage {
  speaker: 'user' | 'npc';
  text: string;
  emotion?: string;
  timestamp: Date;
}

interface ScenarioOutcome {
  score: number;
  feedback: string;
  tips: string[];
}

const InteractiveNPCDate: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>('cafe_date');
  const [messages, setMessages] = useState<DateMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isNPCTyping, setIsNPCTyping] = useState(false);
  const [dateScore, setDateScore] = useState(50);
  const [scenarioComplete, setScenarioComplete] = useState(false);
  const [outcome, setOutcome] = useState<ScenarioOutcome | null>(null);

  const scenarios: Record<string, DateScenario> = {
    cafe_date: {
      id: 'cafe_date',
      npcName: 'Emma',
      setting: 'Cozy coffee shop',
      personality: 'Creative, slightly introverted, loves books and art',
      background: 'Works as a graphic designer, enjoys indie music and weekend art galleries'
    },
    dinner_date: {
      id: 'dinner_date', 
      npcName: 'Alex',
      setting: 'Upscale restaurant',
      personality: 'Outgoing, ambitious, enjoys good food and travel',
      background: 'Marketing professional who travels frequently for work, foodie who loves trying new cuisines'
    },
    park_walk: {
      id: 'park_walk',
      npcName: 'Jordan',
      setting: 'Scenic park trail',
      personality: 'Active, outdoorsy, environmentally conscious',
      background: 'Environmental scientist who loves hiking, rock climbing, and sustainable living'
    }
  };

  const currentScenario = scenarios[selectedScenario];

  // NPC response logic based on user input
  const getNPCResponse = (userMessage: string, messageCount: number): { text: string; emotion: string; scoreChange: number } => {
    const message = userMessage.toLowerCase();
    const npcName = currentScenario.npcName;
    
    // General positive responses
    if (message.includes('how are you') || message.includes('how\'s your day')) {
      return {
        text: `I'm doing great, thanks for asking! This ${currentScenario.setting.toLowerCase()} is really nice. How about you?`,
        emotion: 'happy',
        scoreChange: 5
      };
    }

    // Scenario-specific responses
    if (selectedScenario === 'cafe_date') {
      if (message.includes('coffee') || message.includes('drink')) {
        return {
          text: "I love this place! They have the best lavender latte. I'm kind of a coffee snob though - do you have a favorite coffee shop?",
          emotion: 'interested',
          scoreChange: 8
        };
      }
      if (message.includes('art') || message.includes('design') || message.includes('creative')) {
        return {
          text: "Oh wow, you're interested in art too? I actually work as a graphic designer! There's this amazing gallery opening next weekend - would you be interested in checking it out sometime?",
          emotion: 'excited',
          scoreChange: 15
        };
      }
      if (message.includes('work') || message.includes('job')) {
        return {
          text: "I'm a graphic designer, which I absolutely love! Every project is different. What do you do for work? Do you enjoy it?",
          emotion: 'curious',
          scoreChange: 7
        };
      }
    }

    if (selectedScenario === 'dinner_date') {
      if (message.includes('food') || message.includes('restaurant') || message.includes('delicious')) {
        return {
          text: "The food here is incredible! I've been wanting to try this place forever. Have you been here before? I love discovering new restaurants when I travel for work.",
          emotion: 'enthusiastic',
          scoreChange: 10
        };
      }
      if (message.includes('travel') || message.includes('trip') || message.includes('vacation')) {
        return {
          text: "I travel quite a bit for work in marketing! Last month I was in Barcelona - the food scene there is unreal. Where's the most interesting place you've traveled to?",
          emotion: 'excited',
          scoreChange: 12
        };
      }
    }

    if (selectedScenario === 'park_walk') {
      if (message.includes('nature') || message.includes('outdoors') || message.includes('hiking')) {
        return {
          text: "I'm so glad you appreciate nature too! I'm actually an environmental scientist, so being outdoors is both my work and my passion. Do you have any favorite hiking spots?",
          emotion: 'passionate',
          scoreChange: 15
        };
      }
      if (message.includes('environment') || message.includes('sustainable') || message.includes('climate')) {
        return {
          text: "Yes! It's so refreshing to meet someone who cares about the environment. My work focuses on conservation, and I try to live as sustainably as possible. What got you interested in environmental issues?",
          emotion: 'impressed',
          scoreChange: 18
        };
      }
    }

    // Generic responses based on conversation quality
    if (message.length < 10) {
      return {
        text: "Hmm, okay... *looks around awkwardly* So, um, tell me something interesting about yourself?",
        emotion: 'confused',
        scoreChange: -5
      };
    }

    if (message.includes('?')) {
      return {
        text: `That's a great question! *smiles* You seem really thoughtful. I like that about you.`,
        emotion: 'pleased',
        scoreChange: 8
      };
    }

    // Default responses
    const defaultResponses = [
      { text: "That's really interesting! Tell me more about that.", emotion: 'interested', scoreChange: 5 },
      { text: "I never thought about it that way. You have a unique perspective!", emotion: 'intrigued', scoreChange: 7 },
      { text: "You're really easy to talk to. I'm having a great time!", emotion: 'happy', scoreChange: 10 }
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const sendMessage = () => {
    if (!userInput.trim()) return;

    const userMessage: DateMessage = {
      speaker: 'user',
      text: userInput,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    const messageCount = messages.filter(m => m.speaker === 'user').length + 1;
    setUserInput('');
    setIsNPCTyping(true);

    // Get NPC response
    setTimeout(() => {
      const response = getNPCResponse(userInput, messageCount);
      const npcMessage: DateMessage = {
        speaker: 'npc',
        text: response.text,
        emotion: response.emotion,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, npcMessage]);
      setDateScore(prev => Math.max(0, Math.min(100, prev + response.scoreChange)));
      setIsNPCTyping(false);

      // End scenario after 8-10 exchanges
      if (messageCount >= 8) {
        setTimeout(() => finishDate(), 2000);
      }
    }, 1000 + Math.random() * 1500);
  };

  const finishDate = () => {
    setScenarioComplete(true);
    let feedback = '';
    let tips: string[] = [];

    if (dateScore >= 80) {
      feedback = "Amazing! You had fantastic chemistry and really connected. They're definitely interested in seeing you again!";
      tips = ["Keep being your authentic self", "You showed great conversation skills", "Your questions were engaging and thoughtful"];
    } else if (dateScore >= 60) {
      feedback = "Great job! You had a good connection and the conversation flowed well. There's potential for a second date!";
      tips = ["Try asking more follow-up questions", "Share more personal stories", "Show more enthusiasm about shared interests"];
    } else if (dateScore >= 40) {
      feedback = "Not bad! You had some good moments but there were a few awkward pauses. With practice, you'll improve!";
      tips = ["Work on active listening", "Ask more open-ended questions", "Try to find common ground more quickly"];
    } else {
      feedback = "This one was challenging! Don't worry - every date is practice. Focus on being more engaged and curious.";
      tips = ["Practice conversation starters", "Work on showing genuine interest", "Avoid one-word responses"];
    }

    setOutcome({ score: dateScore, feedback, tips });
  };

  const resetScenario = () => {
    setMessages([]);
    setDateScore(50);
    setScenarioComplete(false);
    setOutcome(null);
    setIsNPCTyping(false);
  };

  useEffect(() => {
    // Opening message
    if (messages.length === 0 && !scenarioComplete) {
      const openingMessage: DateMessage = {
        speaker: 'npc',
        text: `Hi! I'm ${currentScenario.npcName}. Thanks for meeting me here at the ${currentScenario.setting.toLowerCase()}. I'm excited to get to know you!`,
        emotion: 'friendly',
        timestamp: new Date()
      };
      setMessages([openingMessage]);
    }
  }, [selectedScenario, currentScenario, messages.length, scenarioComplete]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>💕 Interactive NPC Dating Practice</h1>
      
      {/* Scenario Selection */}
      <div style={{ marginBottom: '2rem' }}>
        <h3>Choose Your Date Scenario:</h3>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          {Object.values(scenarios).map(scenario => (
            <button
              key={scenario.id}
              onClick={() => {
                setSelectedScenario(scenario.id);
                resetScenario();
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: selectedScenario === scenario.id ? '#FF6B9D' : '#f0f0f0',
                color: selectedScenario === scenario.id ? 'white' : 'black',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {scenario.npcName} - {scenario.setting}
            </button>
          ))}
        </div>
        <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
          <h4>{currentScenario.npcName}</h4>
          <p><strong>Setting:</strong> {currentScenario.setting}</p>
          <p><strong>Personality:</strong> {currentScenario.personality}</p>
          <p><strong>Background:</strong> {currentScenario.background}</p>
        </div>
      </div>

      {!scenarioComplete ? (
        <div style={{ display: 'flex', gap: '2rem' }}>
          {/* Chat Interface */}
          <div style={{ flex: '2' }}>
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              height: '400px',
              overflowY: 'auto',
              padding: '1rem',
              backgroundColor: '#f9f9f9'
            }}>
              {messages.map((message, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '1rem',
                    textAlign: message.speaker === 'user' ? 'right' : 'left'
                  }}
                >
                  <div style={{
                    display: 'inline-block',
                    padding: '0.5rem 1rem',
                    borderRadius: '12px',
                    backgroundColor: message.speaker === 'user' ? '#007bff' : '#e9ecef',
                    color: message.speaker === 'user' ? 'white' : 'black',
                    maxWidth: '70%'
                  }}>
                    <strong>{message.speaker === 'user' ? 'You' : currentScenario.npcName}:</strong> {message.text}
                    {message.emotion && (
                      <div style={{ fontSize: '0.8rem', fontStyle: 'italic', opacity: 0.7 }}>
                        *{message.emotion}*
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isNPCTyping && (
                <div style={{ fontStyle: 'italic', color: '#666' }}>
                  {currentScenario.npcName} is typing...
                </div>
              )}
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="What do you want to say?"
                style={{
                  flex: '1',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              <button
                onClick={sendMessage}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Send
              </button>
            </div>
          </div>

          {/* Date Progress */}
          <div style={{ flex: '1' }}>
            <div style={{ padding: '1rem', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
              <h3>📊 Date Score</h3>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{
                  width: '100%',
                  height: '20px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${dateScore}%`,
                    height: '100%',
                    backgroundColor: dateScore > 70 ? '#28a745' : dateScore > 40 ? '#ffc107' : '#dc3545',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <p style={{ textAlign: 'center', margin: '0.5rem 0' }}>
                  {dateScore}/100
                </p>
              </div>
              
              <h4>💡 Live Tips:</h4>
              <ul style={{ fontSize: '0.9rem' }}>
                <li>Ask about their interests and background</li>
                <li>Share relevant personal stories</li>
                <li>Show genuine curiosity with follow-up questions</li>
                <li>Find common ground to build connection</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        // Results Screen
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>🎉 Date Complete!</h2>
          {outcome && (
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                {outcome.score >= 80 ? '🔥' : outcome.score >= 60 ? '😊' : outcome.score >= 40 ? '😐' : '😔'}
              </div>
              <h3>Final Score: {outcome.score}/100</h3>
              <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>{outcome.feedback}</p>
              
              <div style={{ backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                <h4>💡 Tips for Next Time:</h4>
                <ul style={{ textAlign: 'left', display: 'inline-block' }}>
                  {outcome.tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
              
              <button
                onClick={resetScenario}
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1.1rem'
                }}
              >
                Try Another Date
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InteractiveNPCDate;
