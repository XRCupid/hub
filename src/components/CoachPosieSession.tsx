import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PresenceAvatar } from './PresenceAvatar';
import { SafeVisualEffects } from './SafeVisualEffects';
import { ML5FaceMeshService } from '../services/ML5FaceMeshService';
import humeVoiceService from '../services/humeVoiceService';
import './EnhancedCoachSession.css';

interface PosieMetrics {
  emotionalAwareness: number;
  empathy: number;
  activeListening: number;
  emotionalExpression: number;
  rapport: number;
}

interface EmotionHistory {
  timestamp: number;
  emotion: string;
  intensity: number;
}

const CoachPosieSession: React.FC = () => {
  // Core state
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<string>('idle');
  const [blendShapes, setBlendShapes] = useState<any>({});
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(128));
  const [trackingData, setTrackingData] = useState<any>(null);
  const [showPiP, setShowPiP] = useState(true);
  
  // Posie-specific metrics
  const [metrics, setMetrics] = useState<PosieMetrics>({
    emotionalAwareness: 0,
    empathy: 0,
    activeListening: 0,
    emotionalExpression: 0,
    rapport: 0
  });
  
  // Emotion tracking
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral');
  const [emotionHistory, setEmotionHistory] = useState<EmotionHistory[]>([]);

  // Refs
  const ml5FaceMeshServiceRef = useRef<ML5FaceMeshService | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<Blob[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const humeVoiceServiceRef = useRef(humeVoiceService);
  const [humeConnected, setHumeConnected] = useState(false);

  // Initialize face tracking with emotion detection focus
  useEffect(() => {
    const initializeFaceTracking = async () => {
      try {
        // Create video element
        const video = document.createElement('video');
        video.width = 640;
        video.height = 480;
        video.autoplay = true;
        video.playsInline = true;
        video.style.display = 'none';
        document.body.appendChild(video);
        videoRef.current = video;

        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user'
          }, 
          audio: false 
        });
        video.srcObject = stream;
        await video.play();

        // Initialize ML5 face tracking
        ml5FaceMeshServiceRef.current = new ML5FaceMeshService();
        await ml5FaceMeshServiceRef.current.initialize();
        ml5FaceMeshServiceRef.current.startTracking(video);

        // Update tracking data with emotion focus
        const updateTracking = () => {
          if (ml5FaceMeshServiceRef.current) {
            const facialExpressions = ml5FaceMeshServiceRef.current.getExpressions();
            const headRotation = ml5FaceMeshServiceRef.current.getHeadRotation();
            const landmarks = ml5FaceMeshServiceRef.current.getLandmarks();
            
            if (facialExpressions || headRotation || landmarks) {
              const data = {
                facialExpressions: facialExpressions || {},
                headRotation: headRotation || {},
                landmarks: landmarks || [],
                source: 'ml5'
              };
              setTrackingData(data);
              
              // Update Posie-specific emotion metrics
              updatePosieMetrics(data);
              detectUserEmotion(data);
            }
          }
          requestAnimationFrame(updateTracking);
        };
        updateTracking();
      } catch (error) {
        console.error('[CoachPosieSession] Failed to initialize face tracking:', error);
      }
    };

    initializeFaceTracking();

    return () => {
      if (ml5FaceMeshServiceRef.current) {
        ml5FaceMeshServiceRef.current.stopTracking();
      }
      if (videoRef.current) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        videoRef.current.remove();
      }
    };
  }, []);

  // Detect user emotion from facial expressions
  const detectUserEmotion = (data: any) => {
    if (!data.facialExpressions) return;

    const expr = data.facialExpressions;
    let detectedEmotion = 'neutral';
    let maxScore = 0;

    // Simple emotion detection based on facial expressions
    const emotions = {
      happy: (expr.mouthSmile || 0) + (expr.cheekSquintLeft + expr.cheekSquintRight) / 2,
      sad: (expr.mouthFrown || 0) + (expr.browInnerUp || 0),
      surprised: (expr.eyesWide || 0) + (expr.jawOpen || 0) * 0.5,
      angry: (expr.browFurrowerLeft + expr.browFurrowerRight) / 2 + (expr.lipsPucker || 0),
      confused: (expr.browInnerUp || 0) + (expr.mouthPucker || 0)
    };

    Object.entries(emotions).forEach(([emotion, score]) => {
      if (score > maxScore && score > 0.3) {
        maxScore = score;
        detectedEmotion = emotion;
      }
    });

    if (detectedEmotion !== currentEmotion) {
      setCurrentEmotion(detectedEmotion);
      setEmotionHistory(prev => [...prev, {
        timestamp: Date.now(),
        emotion: detectedEmotion,
        intensity: maxScore
      }].slice(-20)); // Keep last 20 emotions
    }
  };

  // Update Posie-specific metrics
  const updatePosieMetrics = (data: any) => {
    if (!data.facialExpressions || !data.headRotation) return;

    const expr = data.facialExpressions;
    const rotation = data.headRotation;

    // Emotional awareness - based on variety of expressions
    const expressionVariety = Object.values(expr).filter((v: any) => v > 0.1).length;
    const emotionalAwareness = Math.min(100, expressionVariety * 15);

    // Empathy - based on mirroring and responsive expressions
    const empathy = Math.min(100,
      (expr.mouthSmile || 0) * 30 +
      (expr.browInnerUp || 0) * 20 +
      (1 - Math.abs(rotation.yaw) / 45) * 50
    );

    // Active listening - based on head nods and eye focus
    const activeListening = Math.min(100,
      (1 - Math.abs(rotation.yaw) / 30) * 40 +
      (1 - Math.abs(rotation.pitch - 5) / 30) * 30 + // Slight downward tilt
      (expr.browRaiserLeft + expr.browRaiserRight) * 15
    );

    // Emotional expression - based on expression intensity
    const totalExpression = Object.values(expr).reduce((sum: number, val: any) => sum + (val || 0), 0);
    const emotionalExpression = Math.min(100, totalExpression * 10);

    // Rapport - combination of other metrics
    const rapport = (empathy + activeListening + emotionalExpression) / 3;

    setMetrics({
      emotionalAwareness,
      empathy,
      activeListening,
      emotionalExpression,
      rapport
    });
  };

  // Initialize Hume connection
  useEffect(() => {
    const initializeHume = async () => {
      try {
        // Set up callbacks
        humeVoiceServiceRef.current.onMessage((message) => {
          setMessages(prev => [...prev, { role: 'coach', content: message }]);
        });

        humeVoiceServiceRef.current.onAudio(async (audioBlob) => {
          audioQueueRef.current.push(audioBlob);
          playNextAudioFromQueue();
        });

        humeVoiceServiceRef.current.onEmotion((emotions) => {
          // Update blend shapes based on emotions
          const blendShapeValues: any = {};
          if (emotions.joy && emotions.joy > 0.3) {
            blendShapeValues.mouthSmile = emotions.joy;
            blendShapeValues.cheekSquintLeft = emotions.joy * 0.5;
            blendShapeValues.cheekSquintRight = emotions.joy * 0.5;
          }
          if (emotions.sadness && emotions.sadness > 0.3) {
            blendShapeValues.browInnerUp = emotions.sadness * 0.3;
            blendShapeValues.mouthFrown = emotions.sadness * 0.2;
          }
          if (emotions.surprise && emotions.surprise > 0.3) {
            blendShapeValues.browRaiserLeft = emotions.surprise * 0.4;
            blendShapeValues.browRaiserRight = emotions.surprise * 0.4;
          }
          setBlendShapes(blendShapeValues);
        });

        // Connect to Hume
        await humeVoiceServiceRef.current.connect();
        setHumeConnected(true);

        // Send initial context for Coach Posie
        const context = {
          type: 'coach_session',
          coach: 'posie',
          focus: 'emotional_intelligence',
          systemPrompt: `You are Coach Posie, an emotional intelligence and empathy coach. 
            Your specialty is helping people understand and express emotions effectively, 
            develop deeper empathy, and build meaningful connections. 
            Focus on emotional awareness, active listening, reading social cues, and authentic expression.
            Be warm, understanding, and create a safe space for emotional exploration.`
        };
        
        humeVoiceServiceRef.current.sendMessage(JSON.stringify(context));
        
      } catch (error) {
        console.error('[CoachPosieSession] Failed to connect to Hume:', error);
      }
    };

    initializeHume();

    return () => {
      humeVoiceServiceRef.current.disconnect();
    };
  }, []);

  // Audio playback
  const playNextAudioFromQueue = useCallback(() => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      return;
    }
    isPlayingRef.current = true;
    const audioBlob = audioQueueRef.current.shift();
    if (audioBlob && audioPlayerRef.current) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioPlayerRef.current.src = audioUrl;
      audioPlayerRef.current.play()
        .then(() => {
          setIsSpeaking(true);
          setCurrentAnimation('talk');
        })
        .catch(e => {
          console.error('[CoachPosieSession] Error playing audio:', e);
          isPlayingRef.current = false;
          setIsSpeaking(false);
          setCurrentAnimation('idle');
        });
      audioPlayerRef.current.onended = () => {
        URL.revokeObjectURL(audioUrl);
        isPlayingRef.current = false;
        setIsSpeaking(false);
        setCurrentAnimation('idle');
        playNextAudioFromQueue();
      };
    } else {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      setCurrentAnimation('idle');
    }
  }, []);

  // Handle user input
  const handleSendMessage = (message: string) => {
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    humeVoiceServiceRef.current.sendMessage(message);
  };

  return (
    <div className="enhanced-coach-session posie-session">
      <audio ref={audioPlayerRef} style={{ display: 'none' }} />
      
      {/* Main 3D Scene */}
      <div className="main-scene">
        <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 5, 5]} intensity={0.3} />
          <Suspense fallback={null}>
            <PresenceAvatar
              avatarUrl="/avatars/coach_posie.glb"
              trackingData={undefined}
              position={[0, -1.4, 0]}
              scale={1.0}
              animationName={currentAnimation}
              emotionalBlendshapes={blendShapes}
              audioData={audioData}
            />
          </Suspense>
          <SafeVisualEffects style="subtle" enabled={true} />
        </Canvas>
      </div>
      
      {/* User Avatar PiP */}
      {showPiP && (
        <div className="pip-avatar">
          <Canvas camera={{ position: [0, 0, 1.5], fov: 35 }}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[0, 1, 2]} intensity={1.2} />
            <Suspense fallback={null}>
              <PresenceAvatar
                avatarUrl="/avatars/babe.glb"
                trackingData={trackingData || undefined}
                position={[0, -1.75, 0]}
                scale={1.2}
              />
            </Suspense>
            <SafeVisualEffects style="subtle" enabled={true} />
          </Canvas>
        </div>
      )}
      
      {/* Posie-specific Metrics Panel */}
      <div className="posie-metrics-panel">
        <h3>Emotional Intelligence Metrics</h3>
        <div className="metric">
          <span>Emotional Awareness</span>
          <div className="metric-bar">
            <div className="metric-fill emotional" style={{ width: `${metrics.emotionalAwareness}%` }} />
          </div>
          <span>{Math.round(metrics.emotionalAwareness)}%</span>
        </div>
        <div className="metric">
          <span>Empathy</span>
          <div className="metric-bar">
            <div className="metric-fill empathy" style={{ width: `${metrics.empathy}%` }} />
          </div>
          <span>{Math.round(metrics.empathy)}%</span>
        </div>
        <div className="metric">
          <span>Active Listening</span>
          <div className="metric-bar">
            <div className="metric-fill listening" style={{ width: `${metrics.activeListening}%` }} />
          </div>
          <span>{Math.round(metrics.activeListening)}%</span>
        </div>
        <div className="metric">
          <span>Emotional Expression</span>
          <div className="metric-bar">
            <div className="metric-fill expression" style={{ width: `${metrics.emotionalExpression}%` }} />
          </div>
          <span>{Math.round(metrics.emotionalExpression)}%</span>
        </div>
        <div className="metric">
          <span>Rapport Building</span>
          <div className="metric-bar">
            <div className="metric-fill rapport" style={{ width: `${metrics.rapport}%` }} />
          </div>
          <span>{Math.round(metrics.rapport)}%</span>
        </div>
      </div>
      
      {/* Emotion Display */}
      <div className="emotion-display">
        <h4>Current Emotion</h4>
        <div className={`emotion-indicator ${currentEmotion}`}>
          {currentEmotion.charAt(0).toUpperCase() + currentEmotion.slice(1)}
        </div>
        <div className="emotion-history">
          {emotionHistory.slice(-5).map((item, idx) => (
            <span key={idx} className={`emotion-tag ${item.emotion}`}>
              {item.emotion}
            </span>
          ))}
        </div>
      </div>
      
      {/* Chat Interface */}
      <div className="chat-interface">
        <div className="messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <strong>{msg.role === 'coach' ? 'Coach Posie' : 'You'}:</strong> {msg.content}
            </div>
          ))}
        </div>
        <div className="input-area">
          <input
            type="text"
            placeholder="Share your thoughts and feelings..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value) {
                handleSendMessage(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
      </div>
      
      {/* Control buttons */}
      <button className="pip-toggle" onClick={() => setShowPiP(!showPiP)}>
        {showPiP ? '👤' : '👥'}
      </button>
    </div>
  );
};

export default CoachPosieSession;
