import React, { useState, useEffect } from 'react';
import { COACHES } from '../config/curriculumStructure';

interface Message {
  id: string;
  speaker: 'user' | 'coach';
  text: string;
  timestamp: Date;
}

interface CoachResponse {
  text: string;
  options?: string[];
  lesson?: string;
}

const FunctionalCoachDemo: React.FC = () => {
  const [selectedCoach, setSelectedCoach] = useState<string>('grace');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<string | null>(null);

  const coach = COACHES.find(c => c.id === selectedCoach);

  // Coach conversation logic
  const getCoachResponse = (userMessage: string): CoachResponse => {
    const message = userMessage.toLowerCase();
    
    if (selectedCoach === 'grace') {
      if (message.includes('nervous') || message.includes('anxiety')) {
        return {
          text: "I understand that nervousness, darling. It's completely natural to feel that way. Let's practice some breathing techniques and conversation starters that will help you feel more confident.",
          options: ["Practice breathing", "Learn conversation starters", "Tell me more"],
          lesson: "anxiety_management"
        };
      }
      if (message.includes('conversation') || message.includes('talk')) {
        return {
          text: "Wonderful! Conversation is truly an art form. The key is active listening and asking thoughtful questions. Shall we practice with a role-play scenario?",
          options: ["Start role-play", "Learn listening techniques", "Practice questions"],
          lesson: "conversation_mastery"
        };
      }
      return {
        text: "That's a lovely question, dear. Remember, authentic connection comes from being genuinely interested in the other person. What specific situation would you like guidance on?",
        options: ["First date tips", "Conversation skills", "Dealing with nerves"]
      };
    }
    
    if (selectedCoach === 'posie') {
      if (message.includes('body language') || message.includes('nervous')) {
        return {
          text: "Body language speaks louder than words! When you're nervous, your body tenses up. Let's practice some grounding techniques and confident postures.",
          options: ["Practice posture", "Grounding exercise", "Eye contact tips"],
          lesson: "body_language_basics"
        };
      }
      if (message.includes('connection') || message.includes('chemistry')) {
        return {
          text: "Chemistry is about presence and authenticity. It's feeling comfortable in your own skin and being fully present with someone. Want to try a presence exercise?",
          options: ["Presence exercise", "Authenticity tips", "Building rapport"],
          lesson: "authentic_connection"
        };
      }
      return {
        text: "I love your curiosity! Connection happens when we're truly present. What aspect of presence or body language would you like to explore?",
        options: ["Body language", "Eye contact", "Creating chemistry"]
      };
    }
    
    if (selectedCoach === 'rizzo') {
      if (message.includes('confidence') || message.includes('shy')) {
        return {
          text: "Hey, confidence isn't about being perfect - it's about owning who you are! Let's turn that shyness into your secret weapon. Ready to get bold?",
          options: ["Build confidence", "Practice being bold", "Own your style"],
          lesson: "confidence_building"
        };
      }
      if (message.includes('rejection') || message.includes('scared')) {
        return {
          text: "Rejection? That's just redirection, honey! Every 'no' gets you closer to your perfect 'yes'. Let's practice handling rejection like a boss.",
          options: ["Rejection practice", "Mindset shift", "Bold moves"],
          lesson: "rejection_resilience"
        };
      }
      return {
        text: "I'm here to help you unleash that magnetic energy! What's holding you back from being your most irresistible self?",
        options: ["Building magnetism", "Getting over fear", "Making bold moves"]
      };
    }
    
    return { text: "I'm here to help you on your dating journey! What would you like to work on?" };
  };

  // Lesson content
  const getLessonContent = (lessonId: string): string => {
    const lessons: Record<string, string> = {
      anxiety_management: `
🌸 GRACE'S ANXIETY MANAGEMENT LESSON

✨ The 3-Breath Technique:
1. Inhale for 4 counts through your nose
2. Hold for 4 counts  
3. Exhale for 6 counts through your mouth
4. Repeat 3 times

💫 Confidence Affirmations:
- "I am worthy of love and connection"
- "I bring unique value to this conversation"
- "Nervousness shows I care, and that's beautiful"

🎯 Pre-Date Ritual:
- Listen to calming music for 5 minutes
- Practice your breathing technique
- Remind yourself of 3 things you're excited to share
      `,
      conversation_mastery: `
🌟 GRACE'S CONVERSATION MASTERY

🎨 The Art of Questions:
- "What's been the highlight of your week?"
- "What's something you're passionate about lately?"
- "If you could travel anywhere right now, where would you go?"

👂 Active Listening Techniques:
- Reflect: "It sounds like you really enjoy..."
- Elaborate: "Tell me more about that!"
- Connect: "That reminds me of when..."

✨ Conversation Flow:
Question → Listen → Reflect → Share → Question
Keep this cycle going naturally!
      `,
      body_language_basics: `
🌺 POSIE'S BODY LANGUAGE BASICS

💃 Confident Posture:
- Shoulders back and relaxed
- Chin parallel to the ground
- Weight evenly distributed
- Arms uncrossed and open

👀 Eye Contact Mastery:
- Look into their eyes when they're speaking
- Break away naturally every 5-7 seconds
- Return your gaze when making a point
- Smile with your eyes!

🤝 Mirroring Technique:
- Subtly match their energy level
- Mirror their posture (not obviously)
- Match their speaking pace
- This creates unconscious rapport!
      `,
      confidence_building: `
🔥 RIZZO'S CONFIDENCE BUILDING

💪 The Power Pose:
- Stand like a superhero for 2 minutes
- Hands on hips, chest out, chin up
- This literally changes your hormone levels!

🎭 The "Fake It Till You Make It" Method:
- Act confident even if you don't feel it
- Your brain will catch up to your behavior
- Practice bold eye contact in the mirror

⚡ Energy Boosters:
- Play your pump-up song before dates
- Dance for 30 seconds to get energized  
- Remember: You're not trying to impress them, you're deciding if you like them!
      `
    };
    return lessons[lessonId] || "Lesson content coming soon!";
  };

  const sendMessage = () => {
    if (!userInput.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      speaker: 'user',
      text: userInput,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Clear input and show typing
    setUserInput('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const response = getCoachResponse(userInput);
      const coachMessage: Message = {
        id: (Date.now() + 1).toString(),
        speaker: 'coach',
        text: response.text,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, coachMessage]);
      setIsTyping(false);

      // Set lesson if provided
      if (response.lesson) {
        setCurrentLesson(response.lesson);
      }
    }, 1000 + Math.random() * 1000);
  };

  const handleOptionClick = (option: string) => {
    setUserInput(option);
    sendMessage();
  };

  useEffect(() => {
    // Welcome message
    if (coach && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        speaker: 'coach',
        text: `Hi! I'm ${coach.name}. ${coach.description} How can I help you today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [selectedCoach, coach, messages.length]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🎯 Interactive Coach Sessions</h1>
      
      {/* Coach Selection */}
      <div style={{ marginBottom: '2rem' }}>
        <h3>Choose Your Coach:</h3>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          {COACHES.map(c => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCoach(c.id);
                setMessages([]);
                setCurrentLesson(null);
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: selectedCoach === c.id ? '#FF6B9D' : '#f0f0f0',
                color: selectedCoach === c.id ? 'white' : 'black',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
        {coach && (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            {coach.specialty} - {coach.description}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Chat Interface */}
        <div style={{ flex: '1' }}>
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            height: '400px',
            overflowY: 'auto',
            padding: '1rem',
            backgroundColor: '#f9f9f9'
          }}>
            {messages.map(message => (
              <div
                key={message.id}
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
                  <strong>{message.speaker === 'user' ? 'You' : coach?.name}:</strong> {message.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ fontStyle: 'italic', color: '#666' }}>
                {coach?.name} is typing...
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
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

          {/* Quick Options */}
          <div style={{ marginTop: '1rem' }}>
            <p><strong>Try asking about:</strong></p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['I feel nervous about dating', 'How do I start conversations?', 'I need confidence help', 'Body language tips'].map(option => (
                <button
                  key={option}
                  onClick={() => handleOptionClick(option)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lesson Panel */}
        {currentLesson && (
          <div style={{ flex: '1', padding: '1rem', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
            <h3>📚 Current Lesson</h3>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: '1.4' }}>
              {getLessonContent(currentLesson)}
            </pre>
            <button
              onClick={() => setCurrentLesson(null)}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Close Lesson
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FunctionalCoachDemo;
