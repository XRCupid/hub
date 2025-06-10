import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { PresenceAvatar } from './PresenceAvatar';
import { SafeVisualEffects } from './SafeVisualEffects';
import { UserAvatarPiP } from './UserAvatarPiP';
import { ML5FaceMeshService } from '../services/ML5FaceMeshService';
import humeVoiceService from '../services/humeVoiceService';
import './EnhancedCoachSession.css';

interface RizzoMetrics {
  confidence: number;
  assertiveness: number;
  eyeContact: number;
  vocalClarity: number;
  bodyLanguage: number;
}

const CoachRizzoSession: React.FC = () => {
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
  
  // Rizzo-specific metrics
  const [metrics, setMetrics] = useState<RizzoMetrics>({
    confidence: 0,
    assertiveness: 0,
    eyeContact: 0,
    vocalClarity: 0,
    bodyLanguage: 0
  });

  // Refs
  const ml5FaceMeshServiceRef = useRef<ML5FaceMeshService | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<Blob[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const humeVoiceServiceRef = useRef(humeVoiceService);
  const [humeConnected, setHumeConnected] = useState(false);

  // CRITICAL: Clean up WebSocket connection on unmount
  useEffect(() => {
    return () => {
      console.log('[CoachRizzoSession] Cleaning up on unmount');
      if (humeConnected) {
        humeVoiceService.disconnect();
      }
      // Clean up face tracking
      if (ml5FaceMeshServiceRef.current) {
        ml5FaceMeshServiceRef.current.stopTracking();
      }
    };
  }, []);

  // Initialize face tracking
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

        // Update tracking data
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
              
              // Update Rizzo-specific metrics based on tracking data
              updateRizzoMetrics(data);
            }
          }
          requestAnimationFrame(updateTracking);
        };
        updateTracking();
      } catch (error) {
        console.error('[CoachRizzoSession] Failed to initialize face tracking:', error);
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

  // Update Rizzo-specific metrics
  const updateRizzoMetrics = (data: any) => {
    if (!data.facialExpressions || !data.headRotation) return;

    const expr = data.facialExpressions;
    const rotation = data.headRotation;

    // Calculate confidence based on facial expressions
    const confidence = Math.min(100, 
      (expr.mouthSmile || 0) * 50 + 
      (1 - (expr.browFurrowerLeft + expr.browFurrowerRight) / 2) * 50
    );

    // Calculate assertiveness based on jaw and mouth movements
    const assertiveness = Math.min(100,
      (expr.jawOpen || 0) * 40 +
      (expr.mouthOpen || 0) * 30 +
      (1 - (expr.mouthFrown || 0)) * 30
    );

    // Calculate eye contact based on head rotation
    const eyeContact = Math.max(0, 100 - Math.abs(rotation.yaw) * 2 - Math.abs(rotation.pitch) * 2);

    // Vocal clarity (would need audio analysis in real implementation)
    const vocalClarity = 75; // Placeholder

    // Body language based on head movements
    const bodyLanguage = Math.min(100,
      (1 - Math.abs(rotation.roll) / 30) * 50 +
      (1 - Math.abs(rotation.pitch) / 30) * 50
    );

    setMetrics({
      confidence,
      assertiveness,
      eyeContact,
      vocalClarity,
      bodyLanguage
    });
  };

  // Initialize Hume connection
  useEffect(() => {
    const initializeHume = async () => {
      try {
        // Set up callbacks
        humeVoiceServiceRef.current.onMessage((message: any) => {
          // Extract the actual message content from the Hume message object
          const messageContent = typeof message === 'string' ? message : 
                                (message.message?.content || message.message || JSON.stringify(message));
          setMessages(prev => [...prev, { role: 'coach', content: messageContent }]);
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
          }
          if (emotions.surprise && emotions.surprise > 0.3) {
            blendShapeValues.eyesWide = emotions.surprise;
          }
          if (emotions.anger && emotions.anger > 0.3) {
            blendShapeValues.browFurrower = emotions.anger;
          }
          setBlendShapes(blendShapeValues);
        });

        // Connect to Hume
        // DISABLED AUTO-CONNECT TO SAVE CREDITS - Use manual connect button instead
        // await humeVoiceServiceRef.current.connect();
        // setHumeConnected(true);

        // Send initial context for Coach Rizzo
        const context = {
          type: 'coach_session',
          coach: 'rizzo',
          focus: 'confidence_and_assertiveness',
          systemPrompt: `You are Coach Rizzo, a confidence and assertiveness coach. 
            Your specialty is helping people develop strong communication skills, 
            assertive body language, and confident vocal delivery. 
            Focus on eye contact, posture, vocal projection, and clear communication.
            Provide specific, actionable feedback on these areas.`
        };
        
        humeVoiceServiceRef.current.sendMessage(JSON.stringify(context));
        
      } catch (error) {
        console.error('[CoachRizzoSession] Failed to connect to Hume:', error);
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
          console.error('[CoachRizzoSession] Error playing audio:', e);
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
    <div className="enhanced-coach-session">
      <audio ref={audioPlayerRef} style={{ display: 'none' }} />
      
      {/* Main 3D Scene */}
      <div className="main-scene">
        <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.4} />
          <Suspense fallback={null}>
            <PresenceAvatar
              avatarUrl="/avatars/coach_rizzo.glb"
              trackingData={undefined}
              position={[0, -1.4, 0]}
              scale={1.0}
              animationName={currentAnimation}
              emotionalBlendshapes={blendShapes}
              audioData={audioData}
            />
          </Suspense>
          <SafeVisualEffects style="medium" enabled={true} />
        </Canvas>
      </div>
      
      {/* User Avatar PiP */}
      {showPiP && (
        <UserAvatarPiP
          trackingData={trackingData}
          position="bottom-right"
          size="medium"
          onClose={() => setShowPiP(false)}
        />
      )}
      
      {/* Rizzo-specific Metrics Panel */}
      <div className="rizzo-metrics-panel">
        <h3>Performance Metrics</h3>
        <div className="metric">
          <span>Confidence</span>
          <div className="metric-bar">
            <div className="metric-fill" style={{ width: `${metrics.confidence}%` }} />
          </div>
          <span>{Math.round(metrics.confidence)}%</span>
        </div>
        <div className="metric">
          <span>Assertiveness</span>
          <div className="metric-bar">
            <div className="metric-fill" style={{ width: `${metrics.assertiveness}%` }} />
          </div>
          <span>{Math.round(metrics.assertiveness)}%</span>
        </div>
        <div className="metric">
          <span>Eye Contact</span>
          <div className="metric-bar">
            <div className="metric-fill" style={{ width: `${metrics.eyeContact}%` }} />
          </div>
          <span>{Math.round(metrics.eyeContact)}%</span>
        </div>
        <div className="metric">
          <span>Vocal Clarity</span>
          <div className="metric-bar">
            <div className="metric-fill" style={{ width: `${metrics.vocalClarity}%` }} />
          </div>
          <span>{Math.round(metrics.vocalClarity)}%</span>
        </div>
        <div className="metric">
          <span>Body Language</span>
          <div className="metric-bar">
            <div className="metric-fill" style={{ width: `${metrics.bodyLanguage}%` }} />
          </div>
          <span>{Math.round(metrics.bodyLanguage)}%</span>
        </div>
      </div>
      
      {/* Chat Interface */}
      <div className="chat-interface">
        <div className="messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <strong>{msg.role === 'coach' ? 'Coach Rizzo' : 'You'}:</strong> {msg.content}
            </div>
          ))}
        </div>
        <div className="input-area">
          <input
            type="text"
            placeholder="Type your message..."
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

export default CoachRizzoSession;
