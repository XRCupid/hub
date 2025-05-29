import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import SimulationAvatar3D from './TestAvatar';

// Default blendshape values for the avatar
const DEFAULT_BLENDSHAPES = {
  // Mouth
  mouthClose: 0.8,
  mouthFunnel: 0,
  mouthPucker: 0,
  mouthLeft: 0,
  mouthRight: 0,
  mouthSmileLeft: 0.2,
  mouthSmileRight: 0.2,
  jawOpen: 0.1,
  // Add other blendshapes as needed
};

// Map Hume EVI phonemes to blendshape values
const PHONEME_TO_BLENDSHAPE: Record<string, Partial<typeof DEFAULT_BLENDSHAPES>> = {
  // Vowels
  'AA': { jawOpen: 0.7, mouthClose: 0.3 }, // father
  'AE': { jawOpen: 0.6, mouthClose: 0.4 }, // cat
  'AH': { jawOpen: 0.5, mouthClose: 0.5 }, // cut
  'AO': { jawOpen: 0.7, mouthClose: 0.3 }, // dog
  'AW': { jawOpen: 0.6, mouthFunnel: 0.8 }, // cow
  'AY': { jawOpen: 0.5, mouthSmileLeft: 0.6, mouthSmileRight: 0.6 }, // say
  'EH': { jawOpen: 0.4, mouthLeft: 0.5, mouthRight: 0.5 }, // bed (using mouthLeft/Right instead of stretch)
  'ER': { mouthFunnel: 0.7, jawOpen: 0.3 }, // bird
  'EY': { jawOpen: 0.4, mouthSmileLeft: 0.8, mouthSmileRight: 0.8 }, // hey
  'IH': { jawOpen: 0.3, mouthLeft: 0.4, mouthRight: 0.4 }, // it (using mouthLeft/Right instead of stretch)
  'IY': { jawOpen: 0.2, mouthSmileLeft: 0.9, mouthSmileRight: 0.9 }, // happy
  'OW': { jawOpen: 0.6, mouthPucker: 0.7 }, // show
  'OY': { jawOpen: 0.5, mouthFunnel: 0.6 }, // boy
  'UH': { jawOpen: 0.4, mouthFunnel: 0.3 }, // book
  'UW': { jawOpen: 0.3, mouthPucker: 0.9 }, // you
  
  // Consonants - simplified to use only valid blendshape properties
  'B': { mouthClose: 1.0, jawOpen: 0 },
  'CH': { mouthClose: 0.8, mouthPucker: 0.6 },
  'D': { mouthClose: 0.9, jawOpen: 0.1 },
  'DH': { mouthClose: 0.8, jawOpen: 0.3 }, // Removed tongueOut
  'F': { mouthClose: 0.7 }, // Removed mouthLowerDownLeft/Right
  'G': { jawOpen: 0.5, mouthClose: 0.5 },
  'HH': { jawOpen: 0.4, mouthClose: 0.6 },
  'JH': { mouthClose: 0.9, mouthPucker: 0.5 },
  'K': { jawOpen: 0.5, mouthClose: 0.5 },
  'L': { jawOpen: 0.3 }, // Removed tongueOut
  'M': { mouthClose: 1.0, jawOpen: 0 },
  'N': { mouthClose: 0.9, jawOpen: 0.1 },
  'NG': { mouthClose: 0.8, jawOpen: 0.2 },
  'P': { mouthClose: 1.0, jawOpen: 0 },
  'R': { mouthClose: 0.7, mouthLeft: 0.6, mouthRight: 0.6 }, // Using mouthLeft/Right instead of stretch
  'S': { mouthClose: 0.8, mouthLeft: 0.7, mouthRight: 0.7 }, // Using mouthLeft/Right instead of stretch
  'SH': { mouthClose: 0.7, mouthPucker: 0.8 },
  'T': { mouthClose: 0.9, jawOpen: 0.1 },
  'TH': { mouthClose: 0.8, jawOpen: 0.2 }, // Removed tongueOut
  'V': { mouthClose: 0.7 }, // Removed mouthLowerDownLeft/Right
  'W': { jawOpen: 0.4, mouthPucker: 0.9 },
  'Y': { jawOpen: 0.3, mouthSmileLeft: 0.8, mouthSmileRight: 0.8 },
  'Z': { mouthClose: 0.7, mouthLeft: 0.8, mouthRight: 0.8 }, // Using mouthLeft/Right instead of stretch
  'ZH': { mouthClose: 0.6, mouthPucker: 0.7 },
};

const SimpleHumeEVI = () => {
  // Define the BlendShapeMap type based on the default shapes
  type BlendShapeMap = typeof DEFAULT_BLENDSHAPES;
  
  const [blendShapes, setBlendShapes] = useState<BlendShapeMap>(DEFAULT_BLENDSHAPES);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentPhoneme, setCurrentPhoneme] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  // Replace with your RPM avatar URL
  const avatarUrl = 'https://models.readyplayer.me/681d6cd903879b2f11528470.glb';
  
  // Connect to Hume EVI WebSocket
  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        // Replace with your Hume API key
        const apiKey = 'YOUR_HUME_API_KEY';
        const wsUrl = `wss://api.hume.ai/v0/evi/chat?apiKey=${apiKey}`;
        
        wsRef.current = new WebSocket(wsUrl);
        
        wsRef.current.onopen = () => {
          console.log('Connected to Hume EVI');
          setIsConnected(true);
          
          // Send initial configuration
          const config = {
            type: 'config',
            data: {
              models: {
                prosody: {}
              },
              stream_window_ms: 50, // Low latency for real-time
              identify_speakers: false,
              identify_emotions: true,
              identify_phonemes: true
            }
          };
          
          wsRef.current?.send(JSON.stringify(config));
        };
        
        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Handle phoneme data for lip-sync
            if (data.type === 'phonemes' && data.data) {
              const phonemes = data.data.phonemes;
              if (phonemes && phonemes.length > 0) {
                // Get the most recent phoneme
                const current = phonemes[phonemes.length - 1];
                setCurrentPhoneme(current.phoneme);
                
                // Update blendshapes based on phoneme
                const phonemeShape = PHONEME_TO_BLENDSHAPE[current.phoneme] || {};
                setBlendShapes(prev => ({
                  ...DEFAULT_BLENDSHAPES, // Reset to defaults
                  ...phonemeShape, // Apply current phoneme shape
                }));
              }
            }
            
            // Handle speaking state
            if (data.type === 'speaking') {
              setIsSpeaking(data.data.is_speaking);
              if (!data.data.is_speaking) {
                // Reset to neutral when not speaking
                setBlendShapes(DEFAULT_BLENDSHAPES);
                setCurrentPhoneme(null);
              }
            }
            
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };
        
        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };
        
        wsRef.current.onclose = () => {
          console.log('WebSocket connection closed');
          setIsConnected(false);
        };
        
      } catch (error) {
        console.error('Error setting up WebSocket:', error);
      }
    };
    
    connectWebSocket();
    
    // Clean up
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
  
  // Simple animation loop for lip-sync (fallback if WebSocket fails)
  useEffect(() => {
    if (isSpeaking && !currentPhoneme) {
      const phonemes = Object.keys(PHONEME_TO_BLENDSHAPE);
      let index = 0;
      
      const animate = () => {
        if (!isSpeaking) return;
        
        const phoneme = phonemes[index % phonemes.length];
        setCurrentPhoneme(phoneme);
        
        const phonemeShape = PHONEME_TO_BLENDSHAPE[phoneme] || {};
        setBlendShapes(prev => ({
          ...DEFAULT_BLENDSHAPES,
          ...phonemeShape,
        }));
        
        index++;
        setTimeout(animate, 100); // Adjust speed as needed
      };
      
      animate();
    }
  }, [isSpeaking, currentPhoneme]);
  
  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1rem', background: '#f0f0f0' }}>
        <h2>Hume EVI + Ready Player Me</h2>
        <div>Status: {isConnected ? 'Connected to Hume EVI' : 'Disconnected'}</div>
        <div>Speaking: {isSpeaking ? 'Yes' : 'No'}</div>
        <div>Current Phoneme: {currentPhoneme || 'None'}</div>
      </div>
      
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas camera={{ position: [0, 1.6, 2], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <OrbitControls 
            enableZoom={true}
            enablePan={true}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2}
          />
          <SimulationAvatar3D 
            avatarUrl="/bro.glb" // Added default avatar URL
            position={[0, -1.6, 0]}
            scale={[1, 1, 1]}
          />
        </Canvas>
      </div>
    </div>
  );
};

export default SimpleHumeEVI;
