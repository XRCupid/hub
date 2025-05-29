import React, { useState, useEffect, useRef, Suspense, useCallback, useMemo, lazy } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Group, Vector3, Vector3Tuple } from 'three';
import useAvatarBlendShapes from '../hooks/useAvatarBlendShapes';
import { Html } from '@react-three/drei';

// Define the props interface for SimulationAvatar3D
interface SimulationAvatar3DProps {
  avatarUrl: string;
  blendShapes?: Record<string, number>;
  position?: Vector3Tuple;
  scale?: Vector3Tuple;
  ref?: React.Ref<Group>;
  onLoaded?: () => void;
  onModelLoaded?: (model: Group) => void;
}

// Lazy load the SimulationAvatar3D component with proper typing
const SimulationAvatar3D = lazy(() => import('./SimulationAvatar3D')) as any;

// Loading fallback component
const AvatarLoadingFallback = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="gray" />
  </mesh>
);

// Define the BlendShape type
type BlendShape = {
  // Mouth
  mouthClose: number;
  mouthFunnel: number;
  mouthPucker: number;
  mouthLeft: number;
  mouthRight: number;
  mouthSmileLeft: number;
  mouthSmileRight: number;
  mouthFrownLeft: number;
  mouthFrownRight: number;
  mouthStretchLeft: number;
  mouthStretchRight: number;
  mouthDimpleLeft: number;
  mouthDimpleRight: number;
  mouthRollLower: number;
  mouthRollUpper: number;
  mouthShrugLower: number;
  mouthShrugUpper: number;
  mouthPressLeft: number;
  mouthPressRight: number;
  mouthLowerDownLeft: number;
  mouthLowerDownRight: number;
  mouthUpperUpLeft: number;
  mouthUpperUpRight: number;
  mouthOpen: number;
  // Jaw
  jawOpen: number;
  jawForward: number;
  jawLeft: number;
  jawRight: number;
  // Eyes
  eyeBlinkLeft: number;
  eyeBlinkRight: number;
  eyeSquintLeft: number;
  eyeSquintRight: number;
  eyeWideLeft: number;
  eyeWideRight: number;
  eyeLookInLeft: number;
  eyeLookInRight: number;
  eyeLookOutLeft: number;
  eyeLookOutRight: number;
  eyeLookUpLeft: number;
  eyeLookUpRight: number;
  eyeLookDownLeft: number;
  eyeLookDownRight: number;
  // Brows
  browDownLeft: number;
  browDownRight: number;
  browInnerUp: number;
  browOuterUpLeft: number;
  browOuterUpRight: number;
  // Cheeks
  cheekPuff: number;
  cheekSquintLeft: number;
  cheekSquintRight: number;
  // Nose
  noseSneerLeft: number;
  noseSneerRight: number;
  // Tongue
  tongueOut: number;
  chestBreathing: number;
};

// Default blendshape values for the avatar
const defaultBlendShapes: BlendShape = {
  // Mouth
  mouthClose: 0.5, // Slightly open for neutral
  mouthFunnel: 0,
  mouthPucker: 0,
  mouthLeft: 0,
  mouthRight: 0,
  mouthSmileLeft: 0,
  mouthSmileRight: 0,
  mouthFrownLeft: 0,
  mouthFrownRight: 0,
  mouthStretchLeft: 0,
  mouthStretchRight: 0,
  mouthDimpleLeft: 0,
  mouthDimpleRight: 0,
  mouthRollLower: 0,
  mouthRollUpper: 0,
  mouthShrugLower: 0,
  mouthShrugUpper: 0,
  mouthPressLeft: 0,
  mouthPressRight: 0,
  mouthLowerDownLeft: 0,
  mouthLowerDownRight: 0,
  mouthUpperUpLeft: 0,
  mouthUpperUpRight: 0,
  mouthOpen: 0,
  // Jaw
  jawOpen: 0,
  jawForward: 0,
  jawLeft: 0,
  jawRight: 0,
  // Eyes
  eyeBlinkLeft: 0,
  eyeBlinkRight: 0,
  eyeSquintLeft: 0,
  eyeSquintRight: 0,
  eyeWideLeft: 0,
  eyeWideRight: 0,
  eyeLookInLeft: 0,
  eyeLookInRight: 0,
  eyeLookOutLeft: 0,
  eyeLookOutRight: 0,
  eyeLookUpLeft: 0,
  eyeLookUpRight: 0,
  eyeLookDownLeft: 0,
  eyeLookDownRight: 0,
  // Brows
  browDownLeft: 0,
  browDownRight: 0,
  browInnerUp: 0,
  browOuterUpLeft: 0,
  browOuterUpRight: 0,
  // Cheeks
  cheekPuff: 0,
  cheekSquintLeft: 0,
  cheekSquintRight: 0,
  // Nose
  noseSneerLeft: 0,
  noseSneerRight: 0,
  // Tongue
  tongueOut: 0,
  chestBreathing: 0
};

// Define the EmotionData type
interface EmotionData {
  predictions?: Array<{
    emotions?: {
      happy: number;
      sad: number;
      surprise: number;
      fear: number;
      anger: number;
      disgust: number;
      neutral: number;
      [key: string]: number;
    };
  }>;
}

// Map Hume emotions to blendshape values
const emotionToBlendShape = (emotionData: EmotionData | null): BlendShape => {
  const blendshapes = { ...defaultBlendShapes };
  
  if (!emotionData) return blendshapes;
  
  try {
    const { predictions } = emotionData;
    if (!predictions || !predictions[0]?.emotions) return blendshapes;
    
    const defaultEmotions = {
      happy: 0,
      sad: 0,
      surprise: 0,
      fear: 0,
      anger: 0,
      disgust: 0,
      neutral: 1
    };
    
    const emotions = predictions[0].emotions || defaultEmotions;
    
    // Map emotions to facial expressions
    if (emotions.happy > 0.3) {
      blendshapes.mouthSmileLeft = Math.min(1, emotions.happy * 1.5);
      blendshapes.mouthSmileRight = Math.min(1, emotions.happy * 1.5);
      blendshapes.eyeSquintLeft = Math.min(0.5, emotions.happy * 0.7);
      blendshapes.eyeSquintRight = Math.min(0.5, emotions.happy * 0.7);
    }
    
    if (emotions.sad > 0.3) {
      blendshapes.mouthFrownLeft = Math.min(1, emotions.sad * 1.5);
      blendshapes.mouthFrownRight = Math.min(1, emotions.sad * 1.5);
      blendshapes.browInnerUp = Math.min(1, emotions.sad * 1.2);
    }
    
    if (emotions.anger > 0.3) {
      blendshapes.browDownLeft = Math.min(1, emotions.anger * 1.2);
      blendshapes.browDownRight = Math.min(1, emotions.anger * 1.2);
      blendshapes.mouthFrownLeft = Math.min(1, emotions.anger * 1.5);
      blendshapes.mouthFrownRight = Math.min(1, emotions.anger * 1.5);
      blendshapes.noseSneerLeft = Math.min(1, emotions.anger * 1.2);
      blendshapes.noseSneerRight = Math.min(1, emotions.anger * 1.2);
    }
    
    if (emotions.surprise > 0.3) {
      blendshapes.eyeWideLeft = Math.min(1, emotions.surprise * 1.5);
      blendshapes.eyeWideRight = Math.min(1, emotions.surprise * 1.5);
      blendshapes.browInnerUp = Math.min(1, emotions.surprise * 1.2);
      blendshapes.jawOpen = Math.min(0.7, emotions.surprise * 0.7);
    }
    
    // Error handling is already done in the catch block above
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error processing emotion data';
    console.error('Error processing emotion data:', errorMessage);
    // Return default blendshapes on error
    return { ...defaultBlendShapes };
  }
  
  return blendshapes;
};

interface RPMHumeIntegrationProps {
  emotionData?: any; // Hume AI response data
  onAvatarLoaded?: (avatar: any) => void;
  onEmotionDataProcessed?: (blendShapes: any) => void;
  avatar?: any;
}

const RPMHumeIntegration: React.FC<RPMHumeIntegrationProps> = ({
  emotionData,
  onAvatarLoaded,
  onEmotionDataProcessed,
  avatar,
}) => {
  const [currentPhoneme, setCurrentPhoneme] = useState<string | null>(null);
  const [currentBlendShapes, setCurrentBlendShapes] = useState<BlendShape>({
    // Initialize with some default values to prevent T-pose
    eyeBlinkLeft: 0,
    eyeBlinkRight: 0,
    mouthSmileLeft: 0.1,
    browInnerUp: 0.05,
    chestBreathing: 0,
  } as BlendShape);
  const [idleAnimation, setIdleAnimation] = useState({ 
    breathing: 0,
    blinkTimer: 0,
    nextBlink: 3
  });
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // Use the useAvatarBlendShapes hook
  const { applyPhoneme, resetBlendShapes } = useAvatarBlendShapes(emotionData);
  
  const humeBlendShapes = emotionToBlendShape(emotionData);
  
  // Merge default blendshapes with the ones from the hook
  const mergedBlendShapes = useMemo(() => {
    return {
      ...humeBlendShapes,
      ...currentBlendShapes,
      // Ensure Hume emotions override idle blinks when expressing
      eyeBlinkLeft: humeBlendShapes.eyeBlinkLeft || currentBlendShapes.eyeBlinkLeft || 0,
      eyeBlinkRight: humeBlendShapes.eyeBlinkRight || currentBlendShapes.eyeBlinkRight || 0
    };
  }, [humeBlendShapes, currentBlendShapes]);
  
  // Notify parent when blend shapes are updated
  useEffect(() => {
    if (onEmotionDataProcessed) {
      onEmotionDataProcessed(mergedBlendShapes);
    }
  }, [mergedBlendShapes, onEmotionDataProcessed]);
  
  // Handle phoneme changes
  useEffect(() => {
    if (emotionData?.phoneme) {
      applyPhoneme(emotionData.phoneme);
    } else {
      resetBlendShapes();
    }
  }, [emotionData?.phoneme, applyPhoneme, resetBlendShapes]);
  
  // Create a ref to store the avatar instance
  const avatarRef = useRef<Group | null>(null);
  
  // Handle ref callback
  const handleAvatarRef = useCallback((node: Group | null) => {
    if (node) {
      avatarRef.current = node;
      if (onAvatarLoaded) {
        onAvatarLoaded(node);
      }
    }
  }, [onAvatarLoaded]);
  const wsRef = useRef<WebSocket | null>(null);
  const errorRef = useRef<string>('');
  
  // Update error ref when error state changes
  useEffect(() => {
    errorRef.current = error;
  }, [error]);
  const animationFrameRef = useRef<number>();
  const lastUpdateTime = useRef(0);
  
  // Update idle animation
  useEffect(() => {
    const interval = setInterval(() => {
      setIdleAnimation(prev => {
        const time = Date.now() / 1000;
        const breathing = Math.sin(time * 0.5) * 0.02; // Subtle breathing
        
        // Blinking
        let blinkTimer = prev.blinkTimer + 0.016; // ~60fps
        let nextBlink = prev.nextBlink;
        let blinkValue = 0;
        
        if (blinkTimer >= nextBlink) {
          blinkValue = 1;
          blinkTimer = 0;
          nextBlink = 2 + Math.random() * 4; // Next blink in 2-6 seconds
        } else if (blinkTimer < 0.15) {
          blinkValue = Math.sin((blinkTimer / 0.15) * Math.PI);
        }
        
        // Apply idle animations to blend shapes
        setCurrentBlendShapes(shapes => ({
          ...shapes,
          eyeBlinkLeft: blinkValue,
          eyeBlinkRight: blinkValue,
          chestBreathing: breathing
        }));
        
        return { breathing, blinkTimer, nextBlink };
      });
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, []);

  // Connect to Hume WebSocket
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        // Get API key from environment or localStorage
        const apiKey = process.env.REACT_APP_HUME_API_KEY || 
                      localStorage.getItem('humeApiKey') || 
                      '';
        
        if (!apiKey) {
          console.error('No Hume API key found. Please set REACT_APP_HUME_API_KEY or save it in settings.');
          setError('No Hume API key configured');
          return;
        }
        
        const wsUrl = `wss://api.hume.ai/v0/stream/models?apiKey=${apiKey}`;
        
        wsRef.current = new WebSocket(wsUrl);
        
        wsRef.current.onopen = () => {
          console.log('Connected to Hume WebSocket');
          setIsConnected(true);
          setError('');
          
          // Send configuration
          const config = {
            data: {
              models: {
                face: {}
              },
              data: "" // Will be replaced with actual image data
            }
          };
          
          wsRef.current?.send(JSON.stringify(config));
        };
        
        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.face) {
              const newBlendShapes = emotionToBlendShape(data.face);
              setCurrentBlendShapes(newBlendShapes);
            }
          } catch (e) {
            console.error('Error processing WebSocket message:', e);
          }
        };
        
        wsRef.current.onerror = (event) => {
          const errorMessage = 'WebSocket connection error';
          console.error('WebSocket error:', event);
          setError(errorMessage);
          setIsConnected(false);
        };
        
        wsRef.current.onclose = (event) => {
          console.log('WebSocket connection closed', event.code, event.reason);
          setIsConnected(false);
          if (event.code !== 1000) { // 1000 is normal closure
            const errorMessage = `WebSocket closed with code ${event.code}: ${event.reason || 'Unknown reason'}`;
            setError(errorMessage);
          }
          // Attempt to reconnect after a delay
          setTimeout(connectWebSocket, 3000);
        };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to connect to Hume EVI';
        console.error('Error setting up WebSocket:', errorMessage);
        setError(errorMessage);
        setIsConnected(false);
      }
    };
    
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Simple animation loop for lip-sync (placeholder)
  useEffect(() => {
    let frameCount = 0;
    
    const animate = (time: number) => {
      // Throttle updates to ~30fps
      if (time - lastUpdateTime.current > 33) {
        lastUpdateTime.current = time;
        
        // Simple mouth movement based on time
        frameCount++;
        const sinValue = Math.sin(frameCount * 0.1) * 0.5 + 0.5;
        
        setCurrentBlendShapes(prev => ({
          ...prev,
          jawOpen: Math.max(0.1, sinValue * 0.5), // Keep some jaw open
          mouthClose: 1 - sinValue * 0.8, // Opposite of jawOpen for more natural look
        }));
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Use avatar from props or get from localStorage
  const getAvatarUrl = () => {
    if (avatar?.modelUrl) {
      return avatar.modelUrl;
    }
    
    // Try to get from localStorage
    const storedAvatars = localStorage.getItem('rpm_avatars');
    if (storedAvatars) {
      const avatars = JSON.parse(storedAvatars);
      if (avatars.length > 0) {
        return avatars[0].url;
      }
    }
    
    // Fallback to a working demo avatar
    return 'https://models.readyplayer.me/64c3f39b6db681b862c7e479.glb';
  };
  
  const avatarUrl = getAvatarUrl();
  
  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1rem', background: '#f0f0f0' }}>
        <h2>RPM Avatar with Hume Integration</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span>Status: </span>
          <span style={{ 
            color: isConnected ? 'green' : 'red',
            fontWeight: 'bold'
          }}>
            {isConnected ? '🟢 Connected to Hume' : '🔴 Not Connected'}
          </span>
          {error && <span style={{ color: 'red', marginLeft: '1rem' }}>{error}</span>}
        </div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
          {!isConnected && 'Avatar will show idle animations only. Connect to Hume for full emotion support.'}
        </div>
      </div>
      
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas
          camera={{ 
            position: [0, 1.6, 2.5],  // Position camera at eye level, facing the avatar
            fov: 45,                  // Field of view for natural perspective
            near: 0.1,
            far: 100
          }}
          style={{ background: '#f0f0f0' }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[0, 5, 5]} intensity={0.5} />
          <Suspense fallback={<AvatarLoadingFallback />}>
            <SimulationAvatar3D 
              ref={handleAvatarRef}
              avatarUrl={avatarUrl}
              blendShapes={mergedBlendShapes}
              position={[0, -0.5, 0]}  // Center the avatar
              scale={[1, 1, 1]}
              onLoaded={() => {
                console.log('Avatar loaded');
                if (onAvatarLoaded) {
                  onAvatarLoaded(avatarRef.current);
                }
              }}
              onModelLoaded={(model: Group) => {
                console.log('Avatar model loaded:', model);
                console.log('Current blend shapes:', mergedBlendShapes);
              }}
            />
          </Suspense>
          <Html position={[0, 2.5, 0]}>
            <div style={{ 
              background: 'rgba(0,0,0,0.7)', 
              color: 'white', 
              padding: '10px',
              borderRadius: '5px',
              fontSize: '12px',
              whiteSpace: 'pre'
            }}>
              Avatar URL: {avatarUrl.split('/').pop()}
              {'\n'}Breathing: {idleAnimation.breathing.toFixed(2)}
              {'\n'}Blink Timer: {idleAnimation.blinkTimer.toFixed(2)}
              {'\n'}Eye Blink: {(mergedBlendShapes.eyeBlinkLeft || 0).toFixed(2)}
            </div>
          </Html>
          <OrbitControls 
            enablePan={false}
            enableZoom={false}
            enableRotate={false}  // Disable rotation for chat view
            autoRotate={false}    // Explicitly disable auto-rotation
            target={[0, 1.2, 0]}  // Look at chest/face area
          />
        </Canvas>
      </div>
    </div>
  );
};

export default RPMHumeIntegration;
