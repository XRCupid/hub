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

const EyeContactGameRobust: React.FC = () => {
  const [isWebGazerReady, setIsWebGazerReady] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState("Initializing eye tracking...");
  const [isGazingAtAvatar, setIsGazingAtAvatar] = useState(false);
  const [distractions, setDistractions] = useState<Distraction[]>([]);
  const [storyProgress, setStoryProgress] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [gazeHistory, setGazeHistory] = useState<GazeData[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const avatarAreaRef = useRef<HTMLDivElement>(null);
  const webgazerRef = useRef<any>(null);
  const gazeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const distractionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scoreIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const calibrationPointsRef = useRef<HTMLDivElement[]>([]);
  
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

  // Calibration points
  const calibrationPoints = [
    { x: 10, y: 10 },
    { x: 50, y: 10 },
    { x: 90, y: 10 },
    { x: 10, y: 50 },
    { x: 50, y: 50 },
    { x: 90, y: 50 },
    { x: 10, y: 90 },
    { x: 50, y: 90 },
    { x: 90, y: 90 }
  ];

  // Initialize webcam with better error handling
  const initWebcam = async () => {
    try {
      // First check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available');
      }

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setFeedback("Camera ready! Initializing eye tracking...");
        return true;
      }
    } catch (error: any) {
      console.error('Webcam initialization error:', error);
      setWebcamError(error.message || 'Failed to access camera');
      setFeedback("Camera error - using mouse fallback mode");
      return false;
    }
  };

  // Initialize WebGazer with robust error handling
  const initWebGazer = async () => {
    if (!window.webgazer) {
      console.error('WebGazer not loaded');
      setFeedback("Eye tracking not available - using mouse mode");
      return;
    }
    
    try {
      // Clear any existing WebGazer instance
      if (webgazerRef.current) {
        try {
          await window.webgazer.end();
        } catch (e) {
          console.log('Error ending previous WebGazer instance:', e);
        }
      }

      // Configure WebGazer before starting
      window.webgazer.params.showVideoPreview = false;
      window.webgazer.params.showPredictionPoints = false;
      window.webgazer.params.showFaceOverlay = false;
      window.webgazer.params.showFaceFeedbackBox = false;
      
      // Set up gaze listener
      webgazerRef.current = await window.webgazer
        .setGazeListener((data: any, elapsedTime: number) => {
          if (!data || !avatarAreaRef.current || !gameStarted) return;
          
          // Add to gaze history for smoothing
          const gazePoint: GazeData = {
            x: data.x,
            y: data.y,
            timestamp: Date.now()
          };
          
          setGazeHistory(prev => {
            const newHistory = [...prev, gazePoint].slice(-5); // Keep last 5 points
            
            // Calculate smoothed position
            const avgX = newHistory.reduce((sum, p) => sum + p.x, 0) / newHistory.length;
            const avgY = newHistory.reduce((sum, p) => sum + p.y, 0) / newHistory.length;
            
            // Check if looking at avatar
            const avatarRect = avatarAreaRef.current!.getBoundingClientRect();
            const isLookingAtAvatar = 
              avgX >= avatarRect.left - 50 && 
              avgX <= avatarRect.right + 50 && 
              avgY >= avatarRect.top - 50 && 
              avgY <= avatarRect.bottom + 50;
            
            setIsGazingAtAvatar(isLookingAtAvatar);
            
            return newHistory;
          });
        })
        .begin();
      
      // Use existing video element
      if (videoRef.current && videoRef.current.srcObject) {
        window.webgazer.setVideoElement(videoRef.current);
      }
      
      setIsWebGazerReady(true);
      setFeedback("Eye tracking ready! Click the red dots to calibrate.");
      setIsCalibrating(true);
    } catch (error) {
      console.error('Failed to initialize WebGazer:', error);
      setFeedback("Eye tracking failed - using mouse mode");
    }
  };

  // Calibration handler
  const handleCalibrationClick = (pointIndex: number) => {
    if (!window.webgazer || !isCalibrating) return;
    
    const point = calibrationPoints[pointIndex];
    const x = (window.innerWidth * point.x) / 100;
    const y = (window.innerHeight * point.y) / 100;
    
    // Record calibration click
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        window.webgazer.recordScreenPosition(x, y);
      }, i * 100);
    }
    
    setCalibrationStep(pointIndex + 1);
    
    if (pointIndex === calibrationPoints.length - 1) {
      setTimeout(() => {
        setIsCalibrating(false);
        setFeedback("Calibration complete! Look at me while I tell you a story...");
      }, 500);
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
    if (gameStarted && isGazingAtAvatar) {
      scoreIntervalRef.current = setInterval(() => {
        setScore(prev => prev + 1);
        setStreak(prev => prev + 1);
      }, 100);
      
      if (gazeTimeoutRef.current) {
        clearTimeout(gazeTimeoutRef.current);
        gazeTimeoutRef.current = null;
      }
    } else if (gameStarted && !isGazingAtAvatar) {
      if (scoreIntervalRef.current) {
        clearInterval(scoreIntervalRef.current);
      }
      
      if (!gazeTimeoutRef.current) {
        gazeTimeoutRef.current = setTimeout(() => {
          setStreak(0);
          setFeedback("Hey! Look at me, not the distractions!");
        }, 500);
      }
    }
    
    return () => {
      if (scoreIntervalRef.current) {
        clearInterval(scoreIntervalRef.current);
      }
    };
  }, [gameStarted, isGazingAtAvatar]);

  // Initialize everything
  useEffect(() => {
    const init = async () => {
      const webcamReady = await initWebcam();
      if (webcamReady) {
        // Wait a bit for video to be ready
        setTimeout(() => {
          initWebGazer();
        }, 1000);
      }
    };
    
    init();
    
    return () => {
      // Cleanup
      if (window.webgazer && webgazerRef.current) {
        try {
          window.webgazer.end();
        } catch (e) {
          console.error('Error ending WebGazer:', e);
        }
      }
      
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      
      if (distractionIntervalRef.current) {
        clearInterval(distractionIntervalRef.current);
      }
    };
  }, []);

  // Start game
  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setStreak(0);
    setStoryProgress(0);
    setFeedback(storySegments[0]);
    
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
        setFeedback(storySegments[prev + 1]);
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
      {/* Hidden video for WebGazer */}
      <video 
        ref={videoRef} 
        style={{ 
          position: 'absolute',
          top: -9999,
          left: -9999,
          width: 1,
          height: 1
        }} 
      />
      
      {/* Game UI */}
      <div className="game-container">
        {/* Score and status */}
        <div className="game-header">
          <div className="score-display">
            <div>Score: {score}</div>
            <div>Streak: {streak} {getPerformanceEmoji()}</div>
          </div>
          <div className="status">
            {webcamError ? '⚠️ ' + webcamError : 
             isWebGazerReady ? '👁️ Eye Tracking Active' : 
             '⏳ Initializing...'}
          </div>
        </div>
        
        {/* Calibration UI */}
        {isCalibrating && (
          <div className="calibration-overlay">
            <h2>Calibrate Eye Tracking</h2>
            <p>Click each red dot 5 times while looking at it</p>
            {calibrationPoints.map((point, index) => (
              <div
                key={index}
                ref={el => calibrationPointsRef.current[index] = el!}
                className={`calibration-point ${index < calibrationStep ? 'completed' : ''}`}
                style={{
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => handleCalibrationClick(index)}
              >
                {index + 1}
              </div>
            ))}
          </div>
        )}
        
        {/* Avatar area */}
        <div 
          ref={avatarAreaRef}
          className={`avatar-area ${isGazingAtAvatar ? 'gazing' : 'not-gazing'}`}
          style={{ opacity: isCalibrating ? 0.3 : 1 }}
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
        {!gameStarted && isWebGazerReady && !isCalibrating && (
          <button onClick={startGame} className="start-button">
            Start Eye Contact Challenge
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
        {!isCalibrating && (
          <div className="instructions">
            <h3>How to Play:</h3>
            <ul>
              <li>Keep your eyes on the coach while they tell their story</li>
              <li>Don't get distracted by things moving on screen</li>
              <li>Build up your streak for bonus points</li>
              <li>Complete the story to win!</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// Add calibration styles
const style = document.createElement('style');
style.textContent = `
  .calibration-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    text-align: center;
    padding-top: 20px;
  }
  
  .calibration-point {
    position: absolute;
    width: 40px;
    height: 40px;
    background: #ff4444;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-weight: bold;
    color: white;
    transition: all 0.3s ease;
    box-shadow: 0 0 20px rgba(255, 68, 68, 0.5);
  }
  
  .calibration-point:hover {
    transform: translate(-50%, -50%) scale(1.2);
  }
  
  .calibration-point.completed {
    background: #44ff44;
    box-shadow: 0 0 20px rgba(68, 255, 68, 0.5);
  }
`;
document.head.appendChild(style);

export default EyeContactGameRobust;

// TypeScript declaration for WebGazer
declare global {
  interface Window {
    webgazer: any;
  }
}
