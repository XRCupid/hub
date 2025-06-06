import React, { useState, useEffect, useRef } from 'react';
import { TextMessage, TextConversation, DatingProfile, ConversationMetrics } from '../types/DatingTypes';
import { analyzeTextingPerformance } from '../services/TextingAnalyzer';
import './TextingInterface.css';

interface TextingInterfaceProps {
  profile: DatingProfile;
  conversation: TextConversation;
  onSendMessage: (message: string) => void;
  onScheduleDate: () => void;
  coachTips?: string[];
  isNPCTyping?: boolean;
}

export const TextingInterface: React.FC<TextingInterfaceProps> = ({
  profile,
  conversation,
  onSendMessage,
  onScheduleDate,
  coachTips = [],
  isNPCTyping = false
}) => {
  const [messageInput, setMessageInput] = useState('');
  const [showCoachTips, setShowCoachTips] = useState(true);
  const [metrics, setMetrics] = useState<ConversationMetrics | null>(null);
  const [suggestedResponses, setSuggestedResponses] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [typingAnimation, setTypingAnimation] = useState('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages]);

  useEffect(() => {
    // Analyze conversation metrics
    if (conversation.messages.length > 0) {
      const analysis = analyzeTextingPerformance(conversation);
      setMetrics(analysis);
    }
  }, [conversation]);

  useEffect(() => {
    // Generate suggested responses based on conversation context
    if (conversation.messages.length > 0) {
      const lastNPCMessage = [...conversation.messages]
        .reverse()
        .find(m => m.senderId === profile.id);
      
      if (lastNPCMessage) {
        setSuggestedResponses(generateSuggestedResponses(lastNPCMessage.content, profile));
      }
    }
  }, [conversation.messages, profile]);

  const handleSend = () => {
    if (messageInput.trim()) {
      onSendMessage(messageInput);
      setMessageInput('');
      setSuggestedResponses([]);
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const getMessageAlignment = (senderId: string) => {
    return senderId === 'user' ? 'sent' : 'received';
  };

  return (
    <div className="texting-interface">
      <div className="texting-header">
        <img src={profile.photos[0]} alt={profile.name} className="profile-pic" />
        <div className="profile-info">
          <h3>{profile.name}</h3>
          <p className="status">
            {isNPCTyping ? 'Typing...' : 
             conversation.status === 'active' ? 'Active now' : 'Last seen recently'}
          </p>
        </div>
        {conversation.messages.length > 5 && (
          <button className="schedule-date-btn" onClick={onScheduleDate}>
            <span className="icon">📅</span>
            Suggest Date
          </button>
        )}
      </div>

      <div className="messages-container">
        {conversation.messages.map((message) => (
          <div
            key={message.id}
            className={`message ${getMessageAlignment(message.senderId)}`}
          >
            <div className="message-bubble">
              <p>{message.content}</p>
              {message.reactions && message.reactions.length > 0 && (
                <div className="reactions">
                  {message.reactions.map((reaction, idx) => (
                    <span key={idx}>{reaction}</span>
                  ))}
                </div>
              )}
            </div>
            <span className="timestamp">{formatTime(message.timestamp)}</span>
          </div>
        ))}
        
        {isNPCTyping && (
          <div className="message received">
            <div className="message-bubble typing">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {showCoachTips && coachTips.length > 0 && (
        <div className="coach-tips">
          <button 
            className="close-tips"
            onClick={() => setShowCoachTips(false)}
          >
            ×
          </button>
          <h4>💡 Coach Tips</h4>
          <ul>
            {coachTips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {metrics && (
        <div className="conversation-metrics">
          <div className="metric">
            <span className="label">Engagement</span>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${metrics.engagementScore}%` }}
              />
            </div>
          </div>
          <div className="metric">
            <span className="label">Flirt Level</span>
            <div className="hearts">
              {Array.from({ length: 10 }).map((_, i) => (
                <span 
                  key={i}
                  className={i < metrics.flirtLevel ? 'filled' : ''}
                >
                  ❤️
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {suggestedResponses.length > 0 && (
        <div className="suggested-responses">
          <p>Suggested responses:</p>
          <div className="suggestions">
            {suggestedResponses.map((response, idx) => (
              <button
                key={idx}
                className="suggestion"
                onClick={() => {
                  setMessageInput(response);
                  setSuggestedResponses([]);
                }}
              >
                {response}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="message-input-container">
        <input
          type="text"
          className="message-input"
          placeholder="Type a message..."
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button className="send-btn" onClick={handleSend}>
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};

function generateSuggestedResponses(lastMessage: string, profile: DatingProfile): string[] {
  const suggestions: string[] = [];
  
  // Question detection
  if (lastMessage.includes('?')) {
    if (lastMessage.toLowerCase().includes('weekend') || lastMessage.toLowerCase().includes('plans')) {
      suggestions.push("I'm thinking of checking out that new coffee place downtown!");
      suggestions.push("Pretty chill weekend ahead. How about you?");
      suggestions.push("Actually was hoping to make some plans... 😊");
    } else if (lastMessage.toLowerCase().includes('how are you') || lastMessage.toLowerCase().includes('how\'s')) {
      suggestions.push("Doing great! Just finished a workout. You?");
      suggestions.push("Can't complain! Having a pretty good day. What about you?");
      suggestions.push("Better now that we're chatting 😊");
    }
  }
  
  // Compliment detection
  if (lastMessage.toLowerCase().includes('cute') || lastMessage.toLowerCase().includes('beautiful') || lastMessage.toLowerCase().includes('handsome')) {
    suggestions.push("Aw thanks! You're pretty easy on the eyes yourself 😊");
    suggestions.push("That's sweet of you to say!");
    suggestions.push("*blushes* You're making me smile");
  }
  
  // Interest-based responses
  profile.interests.forEach(interest => {
    if (lastMessage.toLowerCase().includes(interest.toLowerCase())) {
      suggestions.push(`Yes! I love ${interest} too! What's your favorite part about it?`);
      suggestions.push(`Oh nice! How long have you been into ${interest}?`);
    }
  });
  
  // Default suggestions if none generated
  if (suggestions.length === 0) {
    suggestions.push("That's interesting! Tell me more");
    suggestions.push("Haha I love that!");
    suggestions.push("What made you get into that?");
  }
  
  return suggestions.slice(0, 3); // Return max 3 suggestions
}

export default TextingInterface;
