import React, { useState, useEffect, useRef, useCallback } from 'react';
import './EyeContactGame.css';

interface Distraction {
  id: string;
  type: 'person' | 'bird' | 'notification' | 'text';
  position: { x: number; y: number };
  content?: string;
  emoji?: string;
}

const EyeContactGameSimple: React.FC = () => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState("Look into my eyes while I tell you a story...");
  const [distractions, setDistractions] = useState<Distraction[]>([]);
  const [storyProgress, setStoryProgress] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isMouseOnAvatar, setIsMouseOnAvatar] = useState(false);
  const [showDemo, setShowDemo] = useState(true);
  
  const avatarAreaRef = useRef<HTMLDivElement>(null);
  const distractionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scoreIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Story segments
  const storySegments = [
    "So there I was, at this amazing coffee shop in Paris...",
    "The waiter came over, and you won't believe what happened next...",
    "He started speaking in perfect English, but with the most charming accent...",
    "And then he asked me if I wanted to see something special...",
    "He led me to this hidden garden behind the café...",
    "There were fairy lights everywhere, and live jazz music playing...",
    "It was like stepping into a movie scene, absolutely magical!",
    "That's when I realized... Paris really is the city of love!"
  ];

  // Distraction templates
  const distractionTemplates = {
    person: [
      { emoji: '👩‍🦰', content: 'Attractive redhead walks by' },
      { emoji: '👨‍💼', content: 'Handsome businessman passes' },
      { emoji: '👩‍🎤', content: 'Stylish woman struts past' },
      { emoji: '🕺', content: 'Dancer moves through' }
    ],
    bird: [
      { emoji: '🦅', content: 'Eagle soars by' },
      { emoji: '🦜', content: 'Colorful parrot flies' },
      { emoji: '🕊️', content: 'Dove glides past' },
      { emoji: '🦆', content: 'Duck waddles by' }
    ],
    notification: [
      { emoji: '💬', content: 'New match on XRCupid!' },
      { emoji: '❤️', content: 'Someone liked your profile!' },
      { emoji: '📸', content: 'Tagged in a photo' },
      { emoji: '🔥', content: 'Your profile is on fire!' }
    ],
    text: [
      { emoji: '📱', content: '"Hey, are you free tonight?"' },
      { emoji: '💌', content: '"Miss you! Call me?"' },
      { emoji: '🍕', content: '"Pizza party at my place!"' },
      { emoji: '🎉', content: '"You won\'t believe what happened!"' }
    ]
  };

  // Create distractions
  const createDistraction = useCallback(() => {
    const types: (keyof typeof distractionTemplates)[] = ['person', 'bird', 'notification', 'text'];
    const type = types[Math.floor(Math.random() * types.length)];
    const template = distractionTemplates[type][Math.floor(Math.random() * distractionTemplates[type].length)];
    
    const side = Math.random() > 0.5 ? 'left' : 'right';
    const yPosition = 100 + Math.random() * (window.innerHeight - 300);
    
    const distraction: Distraction = {
      id: Date.now().toString(),
      type,
      position: {
        x: side === 'left' ? -100 : window.innerWidth + 100,
        y: yPosition
      },
      emoji: template.emoji,
      content: template.content
    };
    
    setDistractions(prev => [...prev, distraction]);
    
    // Animate and remove distraction
    setTimeout(() => {
      setDistractions(prev => prev.filter(d => d.id !== distraction.id));
    }, 5000);
  }, []);

  // Handle mouse tracking (demo mode)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!avatarAreaRef.current || !gameStarted) return;
    
    const avatarRect = avatarAreaRef.current.getBoundingClientRect();
    const isOnAvatar = 
      e.clientX >= avatarRect.left && 
      e.clientX <= avatarRect.right && 
      e.clientY >= avatarRect.top && 
      e.clientY <= avatarRect.bottom;
    
    setIsMouseOnAvatar(isOnAvatar);
    
    if (!isOnAvatar) {
      setStreak(0);
      setFeedback("Hey! Look at me, not the distractions!");
    } else {
      setFeedback(storySegments[storyProgress]);
    }
  }, [gameStarted, storyProgress]);

  // Mouse tracking effect
  useEffect(() => {
    if (showDemo && gameStarted) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [showDemo, gameStarted, handleMouseMove]);

  // Scoring system
  useEffect(() => {
    if (gameStarted && isMouseOnAvatar) {
      scoreIntervalRef.current = setInterval(() => {
        setScore(prev => prev + 1);
        setStreak(prev => prev + 1);
      }, 100);
    } else {
      if (scoreIntervalRef.current) {
        clearInterval(scoreIntervalRef.current);
      }
    }
    
    return () => {
      if (scoreIntervalRef.current) {
        clearInterval(scoreIntervalRef.current);
      }
    };
  }, [gameStarted, isMouseOnAvatar]);

  // Start game
  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setStreak(0);
    setStoryProgress(0);
    
    // Start creating distractions
    distractionIntervalRef.current = setInterval(createDistraction, 1500);
    
    // Progress story
    const storyInterval = setInterval(() => {
      setStoryProgress(prev => {
        if (prev >= storySegments.length - 1) {
          clearInterval(storyInterval);
          if (distractionIntervalRef.current) {
            clearInterval(distractionIntervalRef.current);
          }
          setFeedback(`Amazing! Final score: ${score} | Best streak: ${streak}`);
          setGameStarted(false);
          return prev;
        }
        return prev + 1;
      });
    }, 5000);
  };

  // Calculate performance
  const getPerformanceEmoji = () => {
    if (streak > 50) return '🌟';
    if (streak > 30) return '😊';
    if (streak > 10) return '🙂';
    return '😕';
  };

  return (
    <div className="eye-contact-game">
      {/* Game UI */}
      <div className="game-container">
        {/* Score and status */}
        <div className="game-header">
          <div className="score-display">
            <div>Score: {score}</div>
            <div>Streak: {streak} {getPerformanceEmoji()}</div>
          </div>
          <div className="status">
            {showDemo ? '🖱️ Mouse Demo Mode' : '👁️ Eye Tracking Mode'}
          </div>
        </div>
        
        {/* Demo mode toggle */}
        <div style={{ position: 'absolute', top: 80, right: 20, zIndex: 100 }}>
          <button 
            onClick={() => setShowDemo(!showDemo)}
            style={{
              padding: '10px 20px',
              borderRadius: '20px',
              border: 'none',
              background: 'white',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}
          >
            {showDemo ? 'Switch to Eye Tracking' : 'Switch to Mouse Demo'}
          </button>
        </div>
        
        {/* Avatar area */}
        <div 
          ref={avatarAreaRef}
          className={`avatar-area ${isMouseOnAvatar ? 'gazing' : 'not-gazing'}`}
          style={{ cursor: gameStarted ? 'pointer' : 'default' }}
        >
          <div className="avatar-container">
            <div 
              className="coach-avatar"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '80px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
              }}
            >
              👩‍🏫
            </div>
            <div className="speech-bubble">
              {gameStarted ? storySegments[storyProgress] : feedback}
            </div>
          </div>
        </div>
        
        {/* Start button */}
        {!gameStarted && (
          <button onClick={startGame} className="start-button">
            Start Eye Contact Challenge
          </button>
        )}
        
        {/* Distractions */}
        {distractions.map(distraction => (
          <div
            key={distraction.id}
            className={`distraction distraction-${distraction.type}`}
            style={{
              left: distraction.position.x,
              top: distraction.position.y,
              animation: `move-distraction 5s linear`,
              fontSize: distraction.type === 'bird' || distraction.type === 'person' ? '60px' : '16px'
            }}
          >
            {distraction.emoji && (
              <span style={{ fontSize: distraction.type === 'bird' || distraction.type === 'person' ? '60px' : '24px' }}>
                {distraction.emoji}
              </span>
            )}
            {distraction.content && (
              <div className="distraction-content" style={{ marginLeft: '10px' }}>
                {distraction.content}
              </div>
            )}
          </div>
        ))}
        
        {/* Instructions */}
        <div className="instructions">
          <h3>How to Play:</h3>
          <ul>
            <li>{showDemo ? 'Keep your mouse cursor' : 'Keep your eyes'} on the coach</li>
            <li>Don't get distracted by things moving on screen</li>
            <li>Build up your streak for bonus points</li>
            <li>Listen to the complete story to win!</li>
          </ul>
          {showDemo && (
            <p style={{ marginTop: '10px', fontSize: '12px', fontStyle: 'italic' }}>
              Demo mode: Using mouse instead of eye tracking
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EyeContactGameSimple;
