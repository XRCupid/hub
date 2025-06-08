import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import './EyeContactGame.css';

interface Distraction {
  id: string;
  type: 'person' | 'bird' | 'notification' | 'text';
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  duration: number;
  content?: string;
  image?: string;
}

const EyeContactGame: React.FC = () => {
  const [isWebGazerReady, setIsWebGazerReady] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState("Look into my eyes while I tell you a story...");
  const [isGazingAtAvatar, setIsGazingAtAvatar] = useState(false);
  const [distractions, setDistractions] = useState<Distraction[]>([]);
  const [storyProgress, setStoryProgress] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const avatarAreaRef = useRef<HTMLDivElement>(null);
  const webgazerRef = useRef<any>(null);
  const gazeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const distractionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
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

  // Initialize webcam
  useEffect(() => {
    const initWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
      }
    };
    
    initWebcam();
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Initialize WebGazer
  useEffect(() => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    
    const initWebGazer = async () => {
      if (!window.webgazer) {
        console.error('WebGazer not loaded');
        return;
      }
      
      try {
        webgazerRef.current = await window.webgazer
          .setGazeListener((data: any, elapsedTime: number) => {
            if (!data || !avatarAreaRef.current) return;
            
            const avatarRect = avatarAreaRef.current.getBoundingClientRect();
            const isLookingAtAvatar = 
              data.x >= avatarRect.left && 
              data.x <= avatarRect.right && 
              data.y >= avatarRect.top && 
              data.y <= avatarRect.bottom;
            
            setIsGazingAtAvatar(isLookingAtAvatar);
            
            if (isLookingAtAvatar && gameStarted) {
              // Clear any pending penalty
              if (gazeTimeoutRef.current) {
                clearTimeout(gazeTimeoutRef.current);
                gazeTimeoutRef.current = null;
              }
              
              // Increase score for maintaining eye contact
              setScore(prev => prev + 1);
              setStreak(prev => prev + 1);
            } else if (gameStarted) {
              // Start penalty timer if not already started
              if (!gazeTimeoutRef.current) {
                gazeTimeoutRef.current = setTimeout(() => {
                  setStreak(0);
                  setFeedback("Hey! Look at me, not the distractions!");
                }, 500);
              }
            }
          })
          .begin();
        
        window.webgazer.showVideoPreview(false);
        window.webgazer.showPredictionPoints(true);
        window.webgazer.showFaceOverlay(false);
        window.webgazer.showFaceFeedbackBox(false);
        
        setIsWebGazerReady(true);
      } catch (error) {
        console.error('Failed to initialize WebGazer:', error);
      }
    };
    
    setTimeout(initWebGazer, 1000);
    
    return () => {
      if (window.webgazer) {
        try {
          window.webgazer.end();
        } catch (e) {
          console.error('Error ending WebGazer:', e);
        }
      }
    };
  }, [videoRef.current?.srcObject, gameStarted]);

  // Create distractions
  const createDistraction = useCallback(() => {
    const types: Distraction['type'][] = ['person', 'bird', 'notification', 'text'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let distraction: Distraction;
    
    switch (type) {
      case 'person':
        distraction = {
          id: Date.now().toString(),
          type: 'person',
          startPosition: { x: -200, y: Math.random() * window.innerHeight },
          endPosition: { x: window.innerWidth + 200, y: Math.random() * window.innerHeight },
          duration: 5000,
          image: '/images/attractive-person.jpg' // You'll need to add this
        };
        break;
      
      case 'bird':
        distraction = {
          id: Date.now().toString(),
          type: 'bird',
          startPosition: { x: -100, y: Math.random() * 300 },
          endPosition: { x: window.innerWidth + 100, y: Math.random() * 300 },
          duration: 3000,
          content: '🦅'
        };
        break;
      
      case 'notification':
        distraction = {
          id: Date.now().toString(),
          type: 'notification',
          startPosition: { x: window.innerWidth - 300, y: 20 },
          endPosition: { x: window.innerWidth - 300, y: 20 },
          duration: 4000,
          content: '💬 New match on XRCupid!'
        };
        break;
      
      case 'text':
        distraction = {
          id: Date.now().toString(),
          type: 'text',
          startPosition: { x: 20, y: window.innerHeight - 100 },
          endPosition: { x: 20, y: window.innerHeight - 100 },
          duration: 3500,
          content: '📱 "Hey, are you free tonight?"'
        };
        break;
    }
    
    setDistractions(prev => [...prev, distraction]);
    
    // Remove distraction after duration
    setTimeout(() => {
      setDistractions(prev => prev.filter(d => d.id !== distraction.id));
    }, distraction.duration);
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
          setFeedback("Great job! You maintained eye contact through the whole story!");
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
      {/* Hidden video for WebGazer */}
      <video ref={videoRef} style={{ display: 'none' }} />
      
      {/* Game UI */}
      <div className="game-container">
        {/* Score and status */}
        <div className="game-header">
          <div className="score-display">
            <div>Score: {score}</div>
            <div>Streak: {streak} {getPerformanceEmoji()}</div>
          </div>
          <div className="status">
            {isWebGazerReady ? '👁️ Eye Tracking Active' : '⏳ Initializing...'}
          </div>
        </div>
        
        {/* Avatar area */}
        <div 
          ref={avatarAreaRef}
          className={`avatar-area ${isGazingAtAvatar ? 'gazing' : 'not-gazing'}`}
        >
          <div className="avatar-container">
            <img 
              src="/avatars/coach-avatar.png" 
              alt="Dating Coach"
              className="coach-avatar"
            />
            <div className="speech-bubble">
              {gameStarted ? storySegments[storyProgress] : feedback}
            </div>
          </div>
        </div>
        
        {/* Start button */}
        {!gameStarted && isWebGazerReady && (
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
              left: distraction.startPosition.x,
              top: distraction.startPosition.y,
              animation: `move-distraction ${distraction.duration}ms linear`
            }}
          >
            {distraction.type === 'person' && distraction.image && (
              <img src={distraction.image} alt="Attractive person" />
            )}
            {distraction.content && (
              <div className="distraction-content">{distraction.content}</div>
            )}
          </div>
        ))}
        
        {/* Instructions */}
        <div className="instructions">
          <h3>How to Play:</h3>
          <ul>
            <li>Look at the coach while they tell their story</li>
            <li>Don't get distracted by things moving on screen</li>
            <li>Build up your streak for bonus points</li>
            <li>Complete the story to win!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EyeContactGame;

// TypeScript declaration for WebGazer
declare global {
  interface Window {
    webgazer: any;
  }
}
