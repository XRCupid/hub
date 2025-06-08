import React, { useRef, useEffect, useState, useCallback } from 'react';
import './EyeContactGame.css';

interface Distraction {
  id: string;
  type: 'person' | 'bird' | 'notification' | 'text';
  position: { x: number; y: number };
  content?: string;
  emoji?: string;
}

interface GazeData {
  docX: number;
  docY: number;
  GazeX: number;
  GazeY: number;
  HeadX: number;
  HeadY: number;
  HeadZ: number;
  HeadYaw: number;
  HeadPitch: number;
  HeadRoll: number;
  state: number;
}

declare global {
  interface Window {
    GazeCloudAPI: {
      StartEyeTracking: () => void;
      StopEyeTracking: () => void;
      OnResult: (callback: (data: GazeData) => void) => void;
      OnCalibrationComplete: () => void;
      OnCamDenied: () => void;
      OnError: (msg: string) => void;
      UseClickRecalibration: boolean;
    };
  }
}

const EyeContactGameGazeCloud: React.FC = () => {
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState("Click Start to begin eye tracking setup");
  const [isLookingAtAvatar, setIsLookingAtAvatar] = useState(false);
  const [distractions, setDistractions] = useState<Distraction[]>([]);
  const [storyProgress, setStoryProgress] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentGaze, setCurrentGaze] = useState<{ x: number; y: number } | null>(null);
  const [apiLoaded, setApiLoaded] = useState(false);
  
  const avatarAreaRef = useRef<HTMLDivElement>(null);
  const distractionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scoreIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const gazeHistoryRef = useRef<{ x: number; y: number; timestamp: number }[]>([]);
  
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

  // Load GazeCloudAPI script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://api.gazerecorder.com/GazeCloudAPI.js';
    script.async = true;
    script.onload = () => {
      console.log('GazeCloudAPI loaded');
      setApiLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load GazeCloudAPI');
      setFeedback("Failed to load eye tracking API");
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Initialize GazeCloudAPI
  const initializeGazeTracking = useCallback(() => {
    if (!window.GazeCloudAPI) {
      console.error('GazeCloudAPI not available');
      return;
    }

    // Set up callbacks
    window.GazeCloudAPI.OnResult = (callback: (data: GazeData) => void) => {
      callback({} as GazeData); // Stub implementation
    };

    window.GazeCloudAPI.OnCalibrationComplete = () => {
      console.log('Calibration complete!');
      setIsCalibrated(true);
      setFeedback("Calibration complete! Look at the coach to start.");
    };

    window.GazeCloudAPI.OnCamDenied = () => {
      console.error('Camera access denied');
      setFeedback("Camera access denied - please check permissions");
    };

    window.GazeCloudAPI.OnError = (msg: string) => {
      console.error('GazeCloudAPI error:', msg);
      setFeedback(`Eye tracking error: ${msg}`);
    };

    // Enable click recalibration
    window.GazeCloudAPI.UseClickRecalibration = true;

    // Start eye tracking
    window.GazeCloudAPI.StartEyeTracking();
    setIsTracking(true);
    setFeedback("Follow the red dots with your eyes for calibration");
  }, [isCalibrated]);

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
    
    setTimeout(() => {
      setDistractions(prev => prev.filter(d => d.id !== distraction.id));
    }, 5000);
  }, []);

  // Scoring system
  useEffect(() => {
    if (gameStarted && isLookingAtAvatar) {
      scoreIntervalRef.current = setInterval(() => {
        setScore(prev => prev + 1);
        setStreak(prev => prev + 1);
      }, 100);
      
      setFeedback(storySegments[storyProgress]);
    } else if (gameStarted && !isLookingAtAvatar) {
      if (scoreIntervalRef.current) {
        clearInterval(scoreIntervalRef.current);
      }
      
      // Reset streak after looking away
      setTimeout(() => {
        if (!isLookingAtAvatar) {
          setStreak(0);
          setFeedback("Hey! Look at me, not the distractions!");
        }
      }, 500);
    }
    
    return () => {
      if (scoreIntervalRef.current) {
        clearInterval(scoreIntervalRef.current);
      }
    };
  }, [gameStarted, isLookingAtAvatar, storyProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.GazeCloudAPI && isTracking) {
        window.GazeCloudAPI.StopEyeTracking();
      }
      
      if (distractionIntervalRef.current) {
        clearInterval(distractionIntervalRef.current);
      }
    };
  }, [isTracking]);

  // Start eye tracking
  const startEyeTracking = () => {
    if (!apiLoaded) {
      setFeedback("API still loading, please wait...");
      return;
    }
    
    initializeGazeTracking();
  };

  // Start game
  const startGame = () => {
    if (!isCalibrated) {
      setFeedback("Please complete calibration first!");
      return;
    }
    
    setGameStarted(true);
    setScore(0);
    setStreak(0);
    setStoryProgress(0);
    
    // Start creating distractions
    distractionIntervalRef.current = setInterval(createDistraction, 2000);
    
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
            {!apiLoaded ? '⏳ Loading API...' :
             !isTracking ? '🔌 Not tracking' :
             !isCalibrated ? '🎯 Calibrating...' :
             '👁️ Eye Tracking Active'}
          </div>
        </div>
        
        {/* Gaze indicator */}
        {currentGaze && isCalibrated && (
          <div 
            style={{
              position: 'fixed',
              left: currentGaze.x - 15,
              top: currentGaze.y - 15,
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: isLookingAtAvatar ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)',
              border: '2px solid white',
              pointerEvents: 'none',
              zIndex: 9999,
              transition: 'all 0.1s ease',
              boxShadow: '0 0 10px rgba(0,0,0,0.3)'
            }}
          />
        )}
        
        {/* Avatar area */}
        <div 
          ref={avatarAreaRef}
          className={`avatar-area ${isLookingAtAvatar ? 'gazing' : 'not-gazing'}`}
          style={{ opacity: isCalibrated ? 1 : 0.3 }}
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
              {feedback}
            </div>
          </div>
        </div>
        
        {/* Control buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          {!isTracking && (
            <button onClick={startEyeTracking} className="start-button">
              Start Eye Tracking
            </button>
          )}
          
          {isTracking && isCalibrated && !gameStarted && (
            <button onClick={startGame} className="start-button">
              Start Eye Contact Challenge
            </button>
          )}
          
          {isTracking && (
            <button 
              onClick={() => {
                window.GazeCloudAPI.StopEyeTracking();
                setIsTracking(false);
                setIsCalibrated(false);
                setGameStarted(false);
                setFeedback("Eye tracking stopped");
              }} 
              className="start-button"
              style={{ background: '#dc3545' }}
            >
              Stop Tracking
            </button>
          )}
        </div>
        
        {/* Distractions */}
        {gameStarted && distractions.map(distraction => (
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
            <li>Click "Start Eye Tracking" to begin</li>
            <li>Follow the red dots with your eyes for calibration</li>
            <li>After calibration, keep your eyes on the coach</li>
            <li>Don't get distracted by things moving on screen</li>
            <li>Build up your streak for bonus points</li>
            <li>You can click anywhere to recalibrate if needed</li>
          </ul>
          <p style={{ marginTop: '10px', fontSize: '12px', fontStyle: 'italic' }}>
            Powered by GazeCloudAPI - High accuracy webcam eye tracking
          </p>
        </div>
      </div>
    </div>
  );
};

export default EyeContactGameGazeCloud;
