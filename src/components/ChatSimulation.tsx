import React, { useState, useRef, useEffect } from 'react';
import './ChatSimulation.css';

interface Message {
  id: string;
  sender: 'user' | 'npc';
  content: string;
  timestamp: Date;
  type: 'text' | 'suggestion' | 'system';
  reactions?: string[];
  readReceipt?: boolean;
}

interface NPCPersonality {
  id: string;
  name: string;
  avatar: string;
  traits: string[];
  responseStyle: 'flirty' | 'intellectual' | 'casual' | 'mysterious';
  interests: string[];
  dealBreakers: string[];
  rizzLevel: number; // 1-10, how charming they expect you to be
}

interface ChatAnalytics {
  engagementScore: number;
  rizzScore: number;
  conversationFlow: number;
  questionQuality: number;
  storyTelling: number;
  humorLanding: number;
  interestBuilding: number;
}

const SAMPLE_NPCS: NPCPersonality[] = [
  {
    id: 'alex',
    name: 'Alex',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    traits: ['intellectual', 'adventurous', 'deep'],
    responseStyle: 'intellectual',
    interests: ['philosophy', 'hiking', 'jazz'],
    dealBreakers: ['superficial', 'aggressive'],
    rizzLevel: 7
  },
  {
    id: 'jamie',
    name: 'Jamie',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    traits: ['ambitious', 'witty', 'creative'],
    responseStyle: 'flirty',
    interests: ['startups', 'food', 'writing'],
    dealBreakers: ['boring', 'needy'],
    rizzLevel: 8
  }
];

const CONVERSATION_STARTERS = [
  {
    category: 'Observational',
    examples: [
      "I noticed you're into [interest] - what got you started with that?",
      "Your photo at [location] looks amazing! What's the story behind that trip?",
      "I have to ask - [unique detail from bio] sounds fascinating!"
    ]
  },
  {
    category: 'Playful',
    examples: [
      "Okay, I need to settle a debate - [fun either/or question]?",
      "I'm getting [personality trait] vibes from your profile. Am I right?",
      "Quick question: are you more of a [fun comparison] person?"
    ]
  },
  {
    category: 'Story-Based',
    examples: [
      "Your [interest] reminds me of this crazy experience I had...",
      "I saw you're into [hobby] - I just tried that for the first time and...",
      "This might sound random, but your vibe reminds me of..."
    ]
  }
];

const RESPONSE_SUGGESTIONS = {
  engaging: [
    "Tell me more about that!",
    "That's fascinating - what's the story there?",
    "I love that perspective! Here's what I think...",
    "You just reminded me of something similar that happened to me..."
  ],
  flirty: [
    "I'm definitely intrigued by you...",
    "You're full of surprises, aren't you?",
    "I have a feeling we'd have some great conversations in person",
    "There's something about your energy that I really like"
  ],
  recovery: [
    "Haha, that came out wrong - what I meant was...",
    "Let me try that again...",
    "Okay, clearly I need more coffee before texting 😅",
    "You know what, let's pivot - tell me about..."
  ]
};

export const ChatSimulation: React.FC<{ npcId?: string; onVideoCallUnlock?: () => void }> = ({ npcId = 'alex', onVideoCallUnlock }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [npc] = useState(SAMPLE_NPCS.find(n => n.id === npcId) || SAMPLE_NPCS[0]);
  const [analytics, setAnalytics] = useState<ChatAnalytics>({
    engagementScore: 50,
    rizzScore: 50,
    conversationFlow: 50,
    questionQuality: 50,
    storyTelling: 50,
    humorLanding: 50,
    interestBuilding: 50
  });
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [conversationStage, setConversationStage] = useState<'opening' | 'building' | 'deepening' | 'transitioning'>('opening');
  const [phoneTransitionUnlocked, setPhoneTransitionUnlocked] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with NPC's opening message
    if (messages.length === 0) {
      const openingMessage: Message = {
        id: '1',
        sender: 'npc',
        content: getOpeningMessage(),
        timestamp: new Date(),
        type: 'text',
        readReceipt: true
      };
      setMessages([openingMessage]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getOpeningMessage = (): string => {
    const openings = [
      "Hey! I saw we matched - love your vibe ✨",
      "Hi there! Your profile caught my eye, especially the part about...",
      "Hey! I have to ask - what's the story behind that photo of you...?",
      "Hi! I'm getting good energy from your profile 😊"
    ];
    return openings[Math.floor(Math.random() * openings.length)];
  };

  const analyzeMessage = (content: string): Partial<ChatAnalytics> => {
    const analysis: Partial<ChatAnalytics> = {};
    
    // Rizz analysis
    const rizzIndicators = ['😏', '😉', 'intrigued', 'fascinating', 'energy', 'vibe'];
    const rizzCount = rizzIndicators.filter(indicator => 
      content.toLowerCase().includes(indicator.toLowerCase())
    ).length;
    analysis.rizzScore = Math.min(100, 50 + (rizzCount * 15));

    // Question quality
    const questionMarks = (content.match(/\?/g) || []).length;
    const openQuestions = ['what', 'how', 'why', 'tell me'].filter(q => 
      content.toLowerCase().includes(q)
    ).length;
    analysis.questionQuality = Math.min(100, 30 + (questionMarks * 20) + (openQuestions * 15));

    // Engagement
    const engagementWords = ['love', 'amazing', 'fascinating', 'interesting', 'tell me more'];
    const engagementCount = engagementWords.filter(word => 
      content.toLowerCase().includes(word)
    ).length;
    analysis.engagementScore = Math.min(100, 40 + (engagementCount * 20));

    return analysis;
  };

  const generateNPCResponse = (userMessage: string): string => {
    const responses = {
      intellectual: [
        "That's a really interesting perspective! I've been thinking about...",
        "I love how you put that. It reminds me of this book I read...",
        "You seem like someone who thinks deeply about things. What's your take on...?"
      ],
      flirty: [
        "I like the way you think 😏 Tell me more about...",
        "You're definitely keeping me interested... What else should I know about you?",
        "I have a feeling our conversations would be even better in person 😉"
      ],
      casual: [
        "Haha nice! I'm totally the same way with...",
        "That sounds awesome! I've been wanting to try...",
        "Cool! So what else are you up to these days?"
      ],
      mysterious: [
        "Intriguing... there's definitely more to you than meets the eye",
        "I'm getting the sense you have some good stories...",
        "You're full of surprises, aren't you? 🤔"
      ]
    };

    const styleResponses = responses[npc.responseStyle] || responses.casual;
    return styleResponses[Math.floor(Math.random() * styleResponses.length)];
  };

  const sendMessage = () => {
    if (!currentMessage.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: currentMessage,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMsg]);

    // Analyze user message
    const messageAnalysis = analyzeMessage(currentMessage);
    setAnalytics(prev => ({ ...prev, ...messageAnalysis }));

    // Generate NPC response after delay
    setTimeout(() => {
      const npcResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'npc',
        content: generateNPCResponse(currentMessage),
        timestamp: new Date(),
        type: 'text',
        readReceipt: true
      };
      setMessages(prev => [...prev, npcResponse]);

      // Check for phone transition unlock
      if (analytics.engagementScore > 70 && analytics.rizzScore > 60 && messages.length > 6) {
        setPhoneTransitionUnlocked(true);
      }
    }, 1000 + Math.random() * 2000);

    setCurrentMessage('');
  };

  const applySuggestion = (suggestion: string) => {
    setCurrentMessage(suggestion);
  };

  const getCurrentSuggestions = () => {
    switch (conversationStage) {
      case 'opening':
        return CONVERSATION_STARTERS[0].examples;
      case 'building':
        return RESPONSE_SUGGESTIONS.engaging;
      case 'deepening':
        return RESPONSE_SUGGESTIONS.flirty;
      default:
        return RESPONSE_SUGGESTIONS.engaging;
    }
  };

  return (
    <div className="chat-simulation">
      {/* Header */}
      <div className="chat-header">
        <img src={npc.avatar} alt={npc.name} className="chat-avatar" />
        <div className="chat-header-info">
          <h3>{npc.name}</h3>
          <span className="chat-status">Active now</span>
        </div>
        <div className="chat-analytics-mini">
          <div className="rizz-meter">
            <span>🔥 {analytics.rizzScore}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages" ref={chatContainerRef}>
        {messages.map(message => (
          <div key={message.id} className={`message ${message.sender}`}>
            <div className="message-content">
              {message.content}
              {message.readReceipt && <span className="read-receipt">✓✓</span>}
            </div>
            <div className="message-time">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions Panel */}
      {showSuggestions && (
        <div className="suggestions-panel">
          <h4>💡 Rizz Suggestions:</h4>
          <div className="suggestions-grid">
            {getCurrentSuggestions().slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                className="suggestion-btn"
                onClick={() => applySuggestion(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="chat-input-area">
        <input
          type="text"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          className="chat-input"
        />
        <button onClick={sendMessage} className="send-btn">
          Send
        </button>
      </div>

      {/* Phone Transition */}
      {phoneTransitionUnlocked && (
        <div className="phone-transition-prompt">
          <div className="transition-card">
            <h4>🎉 Great conversation!</h4>
            <p>You've built enough rapport to suggest a phone call!</p>
            <button className="transition-btn">
              "Want to continue this over a quick call?"
            </button>
          </div>
        </div>
      )}

      {/* Analytics Dashboard */}
      <div className="chat-analytics">
        <h4>📊 Conversation Analytics</h4>
        <div className="analytics-grid">
          <div className="metric">
            <span>🔥 Rizz</span>
            <div className="meter">
              <div className="meter-fill" style={{ width: `${analytics.rizzScore}%` }}></div>
            </div>
            <span>{analytics.rizzScore}</span>
          </div>
          <div className="metric">
            <span>💬 Engagement</span>
            <div className="meter">
              <div className="meter-fill" style={{ width: `${analytics.engagementScore}%` }}></div>
            </div>
            <span>{analytics.engagementScore}</span>
          </div>
          <div className="metric">
            <span>❓ Questions</span>
            <div className="meter">
              <div className="meter-fill" style={{ width: `${analytics.questionQuality}%` }}></div>
            </div>
            <span>{analytics.questionQuality}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSimulation;
