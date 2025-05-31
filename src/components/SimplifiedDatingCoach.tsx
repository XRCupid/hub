import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useVoice } from '@humeai/voice-react';
import '../styles/SimplifiedDatingCoach.css';

interface CoachSession {
  topic: string;
  duration: string;
  skills: string[];
}

const coachingSessions: CoachSession[] = [
  {
    topic: "First Impressions",
    duration: "10 min",
    skills: ["Body language", "Eye contact", "Opening lines"]
  },
  {
    topic: "Conversation Flow",
    duration: "15 min", 
    skills: ["Active listening", "Asking questions", "Storytelling"]
  },
  {
    topic: "Building Connection",
    duration: "20 min",
    skills: ["Emotional intelligence", "Humor", "Vulnerability"]
  }
];

const SimplifiedDatingCoach: React.FC = () => {
  const { connect, disconnect, status } = useVoice();
  const [selectedSession, setSelectedSession] = useState<CoachSession | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [feedback, setFeedback] = useState<string[]>([]);

  const handleStartSession = async (session: CoachSession) => {
    setSelectedSession(session);
    setIsSessionActive(true);
    
    // Connect to Hume if not already connected
    if (status.value !== 'connected') {
      try {
        await connect();
      } catch (error) {
        console.error('Failed to connect to voice:', error);
        setFeedback(prev => [...prev, '⚠️ Voice connection failed. Continuing without voice.']);
      }
    }
    
    // Initialize coaching session
    setFeedback([`🎯 Starting ${session.topic} coaching session...`]);
  };

  const handleEndSession = () => {
    setIsSessionActive(false);
    setFeedback(prev => [...prev, '✅ Session completed! Great work!']);
    
    // Add summary feedback
    setTimeout(() => {
      setFeedback(prev => [...prev, 
        '📊 Session Summary:',
        '• Eye contact: Good improvement',
        '• Conversation flow: Natural and engaging',
        '• Areas to practice: Using more open-ended questions'
      ]);
    }, 1000);
  };

  return (
    <div className="simplified-coach">
      {!isSessionActive ? (
        <div className="session-selector">
          <h1>Dating Coach Sessions</h1>
          <p className="subtitle">Choose a skill to practice</p>
          
          <div className="sessions-grid">
            {coachingSessions.map((session, index) => (
              <div key={index} className="session-card">
                <h3>{session.topic}</h3>
                <p className="duration">⏱️ {session.duration}</p>
                <div className="skills">
                  {session.skills.map((skill, i) => (
                    <span key={i} className="skill-tag">{skill}</span>
                  ))}
                </div>
                <button 
                  className="start-button"
                  onClick={() => handleStartSession(session)}
                >
                  Start Practice
                </button>
              </div>
            ))}
          </div>
          
          <div className="quick-tips">
            <h3>💡 Quick Tips</h3>
            <ul>
              <li>Maintain eye contact for 3-5 seconds at a time</li>
              <li>Mirror your date's energy level</li>
              <li>Ask follow-up questions to show genuine interest</li>
              <li>Share personal stories to build connection</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="active-session">
          <div className="session-header">
            <h2>{selectedSession?.topic} Practice</h2>
            <button className="end-button" onClick={handleEndSession}>
              End Session
            </button>
          </div>
          
          <div className="session-content">
            <div className="avatar-view">
              <Canvas
                camera={{ position: [0, 1.5, 2], fov: 45 }}
                style={{ background: '#1a1a1a' }}
              >
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                
                {/* Simple avatar placeholder */}
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[1, 2, 0.5]} />
                  <meshStandardMaterial color="#667eea" />
                </mesh>
                
                <OrbitControls 
                  enablePan={false}
                  enableZoom={false}
                  maxPolarAngle={Math.PI / 2}
                  minPolarAngle={Math.PI / 3}
                />
              </Canvas>
            </div>
            
            <div className="feedback-panel">
              <h3>Coach Feedback</h3>
              <div className="feedback-messages">
                {feedback.map((msg, index) => (
                  <div key={index} className="feedback-message">
                    {msg}
                  </div>
                ))}
              </div>
              
              <div className="practice-prompts">
                <h4>Try this:</h4>
                <p>"Tell me about something you're passionate about"</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimplifiedDatingCoach;
