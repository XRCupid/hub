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
  x: number;
  y: number;
  timestamp: number;
}

const EyeContactGameWebGazer: React.FC = () => {
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState("Click Start to begin calibration");
  const [isLookingAtAvatar, setIsLookingAtAvatar] = useState(false);
  const [distractions, setDistractions] = useState<Distraction[]>([]);
  const [storyProgress, setStoryProgress] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [webgazerReady, setWebgazerReady] = useState(false);
  const [currentGaze, setCurrentGaze] = useState<GazeData | null>(null);
  
  const avatarAreaRef = useRef<HTMLDivElement>(null);
  const distractionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scoreIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const gazeHistoryRef = useRef<GazeData[]>([]);
  
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

  // Initialize WebGazer
  const initWebGazer = useCallback(async () => {
    if (!window.webgazer) {
      console.error('WebGazer not loaded');
      setFeedback("WebGazer not available - please refresh");
      return;
    }

    try {
      // Configure WebGazer
      window.webgazer
        .setRegression('ridge')
        .setTracker('TFFacemesh')
        .showVideoPreview(true)
        .showPredictionPoints(true)
        .showFaceOverlay(false)
        .showFaceFeedbackBox(false);

      // Set gaze listener
      window.webgazer.setGazeListener((data: any, timestamp: number) => {
        if (data == null) return;
        
        const gazeData: GazeData = {
          x: data.x,
          y: data.y,
          timestamp
        };
        
        // Add to history for smoothing
        gazeHistoryRef.current.push(gazeData);
        if (gazeHistoryRef.current.length > 5) {
          gazeHistoryRef.current.shift();
        }
        
        // Calculate smoothed position
        if (gazeHistoryRef.current.length > 0) {
          const avgX = gazeHistoryRef.current.reduce((sum, g) => sum + g.x, 0) / gazeHistoryRef.current.length;
          const avgY = gazeHistoryRef.current.reduce((sum, g) => sum + g.y, 0) / gazeHistoryRef.current.length;
          
          setCurrentGaze({ x: avgX, y: avgY, timestamp });
          
          // Check if looking at avatar
          if (avatarAreaRef.current && isCalibrated) {
            const rect = avatarAreaRef.current.getBoundingClientRect();
            const buffer = 100; // Increased buffer for better detection
            
            const isLooking = avgX >= rect.left - buffer && 
                            avgX <= rect.right + buffer && 
                            avgY >= rect.top - buffer && 
                            avgY <= rect.bottom + buffer;
            
            setIsLookingAtAvatar(isLooking);
          }
        }
      });

      // Start WebGazer
      await window.webgazer.begin();
      
      // Position video preview
      const video = document.getElementById('webgazerVideoFeed');
      if (video) {
        video.style.position = 'fixed';
        video.style.bottom = '20px';
        video.style.right = '20px';
        video.style.width = '160px';
        video.style.height = '120px';
        video.style.borderRadius = '10px';
        video.style.border = '2px solid white';
        video.style.zIndex = '1000';
      }
      
      setWebgazerReady(true);
      setFeedback("WebGazer ready! Click calibration points when they appear.");
      
    } catch (error) {
      console.error('Failed to initialize WebGazer:', error);
      setFeedback("Failed to start eye tracking - please check camera permissions");
    }
  }, [isCalibrated]);

  // Calibration
  const startCalibration = () => {
    setCalibrationPoints([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    setFeedback("Click each red dot 5 times to calibrate");
  };

  const handleCalibrationClick = (pointIndex: number) => {
    // Remove clicked point
    setCalibrationPoints(prev => prev.filter(p => p !== pointIndex));
    
    if (calibrationPoints.length === 1) {
      // Last point clicked
      setIsCalibrated(true);
      setFeedback("Calibration complete! Look at the coach to start.");
      
      // Hide WebGazer prediction points after calibration
      if (window.webgazer) {
        window.webgazer.showPredictionPoints(false);
      }
    }
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

  // Initialize WebGazer on mount
  useEffect(() => {
    // Small delay to ensure WebGazer script is loaded
    setTimeout(() => {
      initWebGazer();
    }, 1000);
    
    return () => {
      // Cleanup
      if (window.webgazer) {
        window.webgazer.end();
      }
      
      if (distractionIntervalRef.current) {
        clearInterval(distractionIntervalRef.current);
      }
    };
  }, [initWebGazer]);

  // Start game
  const startGame = () => {
    if (!isCalibrated) {
      startCalibration();
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
      {/* Calibration UI */}
      {!isCalibrated && calibrationPoints.length > 0 && (
        <div className="calibration-container">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(index => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const isActive = calibrationPoints.includes(index);
            
            return (
              <div
                key={index}
                className={`calibration-point ${isActive ? 'active' : 'completed'}`}
                style={{
                  position: 'absolute',
                  left: `${25 + col * 25}%`,
                  top: `${25 + row * 25}%`,
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: isActive ? 'red' : 'green',
                  cursor: isActive ? 'pointer' : 'default',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: 'white',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => isActive && handleCalibrationClick(index)}
              >
                {isActive ? index + 1 : '✓'}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Game UI */}
      <div className="game-container">
        {/* Score and status */}
        <div className="game-header">
          <div className="score-display">
            <div>Score: {score}</div>
            <div>Streak: {streak} {getPerformanceEmoji()}</div>
          </div>
          <div className="status">
            {webgazerReady ? 
              (isCalibrated ? '👁️ Eye Tracking Active' : '🎯 Calibrating...') : 
              '⏳ Initializing WebGazer...'}
          </div>
        </div>
        
        {/* Gaze indicator */}
        {currentGaze && isCalibrated && (
          <div 
            style={{
              position: 'fixed',
              left: currentGaze.x - 10,
              top: currentGaze.y - 10,
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: isLookingAtAvatar ? 'lime' : 'red',
              opacity: 0.7,
              pointerEvents: 'none',
              zIndex: 9999,
              transition: 'all 0.1s ease'
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
        
        {/* Start button */}
        {webgazerReady && (
          <button onClick={startGame} className="start-button">
            {!isCalibrated ? 'Start Calibration' : 
             gameStarted ? 'Game in Progress...' : 
             'Start Eye Contact Challenge'}
          </button>
        )}
        
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
            <li>First, calibrate by clicking each red dot 5 times</li>
            <li>Keep your eyes on the coach avatar</li>
            <li>Don't get distracted by things moving on screen</li>
            <li>Build up your streak for bonus points</li>
            <li>Complete the story to win!</li>
          </ul>
          <p style={{ marginTop: '10px', fontSize: '12px', fontStyle: 'italic' }}>
            Using WebGazer 2.1.0 for real eye gaze tracking
          </p>
        </div>
      </div>
    </div>
  );
};

export default EyeContactGameWebGazer;

// TypeScript declaration for WebGazer
declare global {
  interface Window {
    webgazer: any;
  }
}
