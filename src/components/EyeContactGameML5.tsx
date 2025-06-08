import React, { useRef, useEffect, useState, useCallback } from 'react';
import './EyeContactGame.css';

interface Distraction {
  id: string;
  type: 'person' | 'bird' | 'notification' | 'text';
  position: { x: number; y: number };
  content?: string;
  emoji?: string;
}

interface FaceLandmark {
  x: number;
  y: number;
  z?: number;
}

const EyeContactGameML5: React.FC = () => {
  const [isFaceDetectionReady, setIsFaceDetectionReady] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState("Initializing face detection...");
  const [isLookingAtCamera, setIsLookingAtCamera] = useState(false);
  const [distractions, setDistractions] = useState<Distraction[]>([]);
  const [storyProgress, setStoryProgress] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const avatarAreaRef = useRef<HTMLDivElement>(null);
  const facemeshRef = useRef<any>(null);
  const distractionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scoreIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFacePositionRef = useRef<{ x: number; y: number; timestamp: number } | null>(null);
  
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

  // Initialize webcam
  const initWebcam = async () => {
    try {
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
        setFeedback("Camera ready! Initializing face detection...");
        return true;
      }
    } catch (error: any) {
      console.error('Webcam initialization error:', error);
      setWebcamError(error.message || 'Failed to access camera');
      setFeedback("Camera error - please check permissions");
      return false;
    }
  };

  // Initialize ML5 Facemesh for eye tracking
  const initFaceDetection = async () => {
    if (!window.ml5 || !videoRef.current) {
      console.error('ML5 not loaded or video not ready');
      setFeedback("Face detection not available");
      return;
    }
    
    try {
      // Use ml5 facemesh for face and eye detection
      facemeshRef.current = window.ml5.facemesh(videoRef.current, () => {
        console.log('ML5 Facemesh model loaded');
        setIsFaceDetectionReady(true);
        setFeedback("Face detection ready! Look at the coach to start.");
      });
      
      // Set up face detection callback
      facemeshRef.current.on('predict', (results: any[]) => {
        if (!results || results.length === 0) {
          setIsLookingAtCamera(false);
          return;
        }
        
        const face = results[0];
        if (!face || !face.scaledMesh) return;
        
        // Get key facial landmarks
        const leftEye = face.scaledMesh[33]; // Left eye center
        const rightEye = face.scaledMesh[263]; // Right eye center
        const nose = face.scaledMesh[1]; // Nose tip
        
        // Calculate face center and orientation
        const faceCenterX = (leftEye[0] + rightEye[0]) / 2;
        const faceCenterY = (leftEye[1] + rightEye[1]) / 2;
        
        // Calculate eye distance for face size reference
        const eyeDistance = Math.sqrt(
          Math.pow(rightEye[0] - leftEye[0], 2) + 
          Math.pow(rightEye[1] - leftEye[1], 2)
        );
        
        // Check if face is centered (looking at camera)
        const videoWidth = videoRef.current?.videoWidth || 640;
        const videoHeight = videoRef.current?.videoHeight || 480;
        
        const centerThresholdX = videoWidth * 0.3; // 30% of width from center
        const centerThresholdY = videoHeight * 0.3; // 30% of height from center
        
        const isXCentered = Math.abs(faceCenterX - videoWidth / 2) < centerThresholdX;
        const isYCentered = Math.abs(faceCenterY - videoHeight / 2) < centerThresholdY;
        
        // Check face size (too far or too close)
        const idealEyeDistance = videoWidth * 0.15; // 15% of video width
        const isFaceSizeGood = eyeDistance > idealEyeDistance * 0.5 && eyeDistance < idealEyeDistance * 2;
        
        // Determine if looking at camera
        const lookingAtCamera = isXCentered && isYCentered && isFaceSizeGood;
        setIsLookingAtCamera(lookingAtCamera);
        
        // Update debug info
        setDebugInfo(`Face: ${isXCentered ? '✓' : '✗'} X, ${isYCentered ? '✓' : '✗'} Y, ${isFaceSizeGood ? '✓' : '✗'} Size`);
        
        // Store face position for smoothing
        lastFacePositionRef.current = {
          x: faceCenterX,
          y: faceCenterY,
          timestamp: Date.now()
        };
      });
      
    } catch (error) {
      console.error('Failed to initialize face detection:', error);
      setFeedback("Face detection failed - please refresh");
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
    if (gameStarted && isLookingAtCamera) {
      scoreIntervalRef.current = setInterval(() => {
        setScore(prev => prev + 1);
        setStreak(prev => prev + 1);
      }, 100);
      
      setFeedback(storySegments[storyProgress]);
    } else if (gameStarted && !isLookingAtCamera) {
      if (scoreIntervalRef.current) {
        clearInterval(scoreIntervalRef.current);
      }
      
      // Reset streak after looking away
      setTimeout(() => {
        if (!isLookingAtCamera) {
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
  }, [gameStarted, isLookingAtCamera, storyProgress]);

  // Initialize everything
  useEffect(() => {
    const init = async () => {
      const webcamReady = await initWebcam();
      if (webcamReady) {
        // Wait for video to be ready
        setTimeout(() => {
          initFaceDetection();
        }, 1000);
      }
    };
    
    init();
    
    return () => {
      // Cleanup
      if (facemeshRef.current) {
        facemeshRef.current = null;
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
      {/* Hidden video for face detection */}
      <video 
        ref={videoRef} 
        style={{ 
          position: 'absolute',
          bottom: 20,
          right: 20,
          width: 160,
          height: 120,
          borderRadius: '10px',
          border: '2px solid white',
          transform: 'scaleX(-1)', // Mirror the video
          zIndex: 1000
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
             isFaceDetectionReady ? '😊 Face Tracking Active' : 
             '⏳ Initializing...'}
          </div>
        </div>
        
        {/* Debug info */}
        {isFaceDetectionReady && (
          <div style={{
            position: 'absolute',
            top: 80,
            left: 20,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 100
          }}>
            {debugInfo} | Looking: {isLookingAtCamera ? '👁️' : '❌'}
          </div>
        )}
        
        {/* Avatar area */}
        <div 
          ref={avatarAreaRef}
          className={`avatar-area ${isLookingAtCamera ? 'gazing' : 'not-gazing'}`}
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
        {!gameStarted && isFaceDetectionReady && (
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
        <div className="instructions">
          <h3>How to Play:</h3>
          <ul>
            <li>Keep your face centered in the camera view</li>
            <li>Look straight ahead at the coach</li>
            <li>Don't get distracted by things moving on screen</li>
            <li>Build up your streak for bonus points</li>
            <li>Complete the story to win!</li>
          </ul>
          <p style={{ marginTop: '10px', fontSize: '12px', fontStyle: 'italic' }}>
            Using ML5 face detection - keep your face visible in the camera
          </p>
        </div>
      </div>
    </div>
  );
};

export default EyeContactGameML5;

// TypeScript declaration for ML5
declare global {
  interface Window {
    ml5: any;
  }
}
