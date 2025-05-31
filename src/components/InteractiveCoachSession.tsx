import React, { useState, useEffect, useRef } from 'react';
import { voiceService } from '../services/voiceService';
import './InteractiveCoachSession.css';

interface InteractiveCoachSessionProps {
  coach: 'grace' | 'posie' | 'rizzo';
  lessonContext?: string;
}

export const InteractiveCoachSession: React.FC<InteractiveCoachSessionProps> = ({ 
  coach, 
  lessonContext = "practicing conversation skills" 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [conversation, setConversation] = useState<Array<{role: 'coach' | 'user', text: string}>>([]);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const recognitionRef = useRef<any>(null);

  const coachAvatars = {
    grace: '👗',
    posie: '🧘‍♀️',
    rizzo: '💋'
  };

  const coachGreetings = {
    grace: "Hello darling! I'm so delighted we're working together today. Tell me, what's been on your mind about dating lately?",
    posie: "Welcome, beautiful soul. Take a deep breath with me... *pause* ...now, what would you like to explore in your dating journey today?",
    rizzo: "Hey hot stuff! Ready to level up your dating game? Don't hold back - what's really going on in your love life?"
  };

  useEffect(() => {
    // Check if API key is needed
    const provider = voiceService.getAvailableProvider();
    if (provider === 'openai' && !process.env.REACT_APP_OPENAI_API_KEY) {
      setShowApiKeyInput(true);
    }

    // Initialize with greeting
    const greeting = coachGreetings[coach];
    setConversation([{ role: 'coach', text: greeting }]);
    
    // Setup speech recognition if available
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleUserInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [coach]);

  const handleApiKeySubmit = () => {
    if (apiKey) {
      voiceService.setApiKey('openai', apiKey);
      setShowApiKeyInput(false);
      setError(null);
    }
  };

  const handleUserInput = async (input: string) => {
    if (!input.trim()) return;

    // Add user message to conversation
    setConversation(prev => [...prev, { role: 'user', text: input }]);
    setUserInput('');

    try {
      // Get coach response
      const response = await voiceService.getCoachResponse(coach, input, lessonContext);
      
      // Add coach response to conversation
      setConversation(prev => [...prev, { role: 'coach', text: response }]);
      
      // Speak the response
      setIsSpeaking(true);
      await voiceService.speak(response, coach);
      setIsSpeaking(false);
    } catch (error: any) {
      setError(error.message);
      console.error('Coach interaction error:', error);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not available in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUserInput(userInput);
  };

  if (showApiKeyInput) {
    return (
      <div className="api-key-setup">
        <h3>Setup OpenAI API Key</h3>
        <p>To enable voice conversations with your coach, please enter your OpenAI API key:</p>
        <form onSubmit={(e) => { e.preventDefault(); handleApiKeySubmit(); }}>
          <input
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="api-key-input"
          />
          <button type="submit" className="submit-btn">
            Start Session
          </button>
        </form>
        <p className="privacy-note">
          Your API key is only stored in this session and never sent to our servers.
        </p>
      </div>
    );
  }

  return (
    <div className="interactive-coach-session">
      <div className="session-header">
        <div className="coach-info">
          <span className="coach-avatar">{coachAvatars[coach]}</span>
          <h3>{coach.charAt(0).toUpperCase() + coach.slice(1)}'s Live Session</h3>
        </div>
        <div className={`status ${isSpeaking ? 'speaking' : ''}`}>
          {isSpeaking ? '🔊 Speaking...' : '🎤 Ready'}
        </div>
      </div>

      <div className="conversation-container">
        {conversation.map((message, idx) => (
          <div key={idx} className={`message ${message.role}`}>
            {message.role === 'coach' && (
              <span className="message-avatar">{coachAvatars[coach]}</span>
            )}
            <div className="message-content">
              <p>{message.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="input-controls">
        <form onSubmit={handleTextSubmit} className="text-input-form">
          <input
            type="text"
            placeholder="Type your response..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="text-input"
            disabled={isSpeaking}
          />
          <button type="submit" disabled={isSpeaking || !userInput.trim()}>
            Send
          </button>
        </form>

        <div className="voice-controls">
          <button
            className={`voice-btn ${isListening ? 'listening' : ''}`}
            onClick={toggleListening}
            disabled={isSpeaking}
          >
            {isListening ? '⏹️ Stop' : '🎤 Speak'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="session-tips">
        <p>💡 Try asking about first date ideas, conversation starters, or handling dating anxiety</p>
      </div>
    </div>
  );
};
