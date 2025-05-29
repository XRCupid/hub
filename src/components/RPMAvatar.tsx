import React, { useRef, useState, useEffect, useMemo, FC } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Text, Environment, useAnimations } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';
import { RPMAvatarGenerator } from '../utils/rpmAvatars';

interface RPMAvatarProps {
  avatarUrl: string;
  emotions?: { [key: string]: number };
  isAnimating?: boolean;
  scale?: number;
  position?: [number, number, number];
  enableControls?: boolean;
  className?: string;
}

interface BlendShapeData {
  [key: string]: number;
}

// Mapping of RPM blendshapes to emotions
const EMOTION_BLENDSHAPE_MAP: { [key: string]: string } = {
  // Joy/Happiness
  'mouthSmile_L': 'joy',
  'mouthSmile_R': 'joy',
  'cheekSquint_L': 'joy',
  'cheekSquint_R': 'joy',
  
  // Sadness
  'mouthFrown_L': 'sadness',
  'mouthFrown_R': 'sadness',
  'browInnerUp': 'sadness',
  
  // Anger
  'browDown_L': 'anger',
  'browDown_R': 'anger',
  'mouthPress_L': 'anger',
  'mouthPress_R': 'anger',
  'nostrilDilate_L': 'anger',
  'nostrilDilate_R': 'anger',
  
  // Fear
  'eyeWide_L_fear': 'fear',
  'eyeWide_R_fear': 'fear',
  'browUp_L_fear': 'fear',
  'browUp_R_fear': 'fear',
  'mouthOpen_fear': 'fear',
  
  // Surprise
  'eyeWide_L_surprise': 'surprise',
  'eyeWide_R_surprise': 'surprise',
  'browUp_L_surprise': 'surprise',
  'browUp_R_surprise': 'surprise',
  'mouthOpen_surprise': 'surprise',
  
  // Disgust
  'noseSneer_L': 'disgust',
  'noseSneer_R': 'disgust',
  'mouthUpperUp_L': 'disgust',
  'mouthUpperUp_R': 'disgust',
  
  // Contempt
  'mouthSmile_L_contempt': 'contempt', // asymmetric
  'noseSneer_L_contempt': 'contempt',
  
  // Excitement
  'mouthSmile_L_excitement': 'excitement',
  'mouthSmile_R_excitement': 'excitement',
  'eyeWide_L_excitement': 'excitement',
  'eyeWide_R_excitement': 'excitement',
  
  // Concentration
  'browDown_L_concentration': 'concentration',
  'browDown_R_concentration': 'concentration',
  'eyeSquint_L': 'concentration',
  'eyeSquint_R': 'concentration'
};

const Avatar3D: FC<{ 
  avatarUrl: string; 
  emotions?: BlendShapeData;
  isAnimating?: boolean;
}> = ({ avatarUrl, emotions = {}, isAnimating = false }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [morphTargets, setMorphTargets] = useState<THREE.Mesh[]>([]);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [gltf, setGltf] = useState<any>(null);
  const [blinkTime, setBlinkTime] = useState(0);
  const { actions, names } = useAnimations(gltf?.animations || [], meshRef);

  // Load avatar with error handling
  useEffect(() => {
    if (!avatarUrl) {
      console.log('RPMAvatar: No avatar URL provided, showing fallback');
      setLoadError(true);
      return;
    }

    console.log('RPMAvatar: Attempting to load avatar from:', avatarUrl);
    const loader = new GLTFLoader();
    loader.load(
      avatarUrl,
      (loadedGltf) => {
        console.log('RPMAvatar: Successfully loaded avatar:', loadedGltf);
        setGltf(loadedGltf);
        setLoadError(false);
      },
      (progress) => {
        console.log('RPMAvatar: Loading progress:', progress);
      },
      (error) => {
        console.error('RPMAvatar: Failed to load avatar from', avatarUrl, 'Error:', error);
        setLoadError(true);
      }
    );
  }, [avatarUrl]);
  
  useEffect(() => {
    if (gltf && gltf.scene && gltf.scene.children) {
      // Find meshes with morph targets (face)
      const meshesWithMorphs: THREE.Mesh[] = [];
      
      gltf.scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh && child.morphTargetDictionary) {
          console.log('🎯 Available morph targets:', Object.keys(child.morphTargetDictionary));
          meshesWithMorphs.push(child);
          
          // Initialize with a slight smile
          const smileLeft = child.morphTargetDictionary['mouthSmileLeft'];
          const smileRight = child.morphTargetDictionary['mouthSmileRight'];
          if (smileLeft !== undefined && smileRight !== undefined && child.morphTargetInfluences) {
            child.morphTargetInfluences[smileLeft] = 0.2;
            child.morphTargetInfluences[smileRight] = 0.2;
          }
          
          // Check for blink morph targets
          const leftBlink = child.morphTargetDictionary['eyeBlinkLeft'];
          const rightBlink = child.morphTargetDictionary['eyeBlinkRight'];
          console.log('👁️ Blink morph targets found:', { 
            leftBlink: leftBlink !== undefined, 
            rightBlink: rightBlink !== undefined 
          });
        }
      });
      
      setMorphTargets(meshesWithMorphs);
    }
  }, [gltf]);
  
  // Load and apply idle animation
  useEffect(() => {
    if (!gltf || !meshRef.current) return;
    
    // Load idle animation from public folder
    const loader = new GLTFLoader();
    loader.load(
      '/animations/Idle.glb', // Standard idle animation
      (animGltf) => {
        if (animGltf.animations.length > 0 && meshRef.current) {
          // Apply animation to our avatar
          const mixer = new THREE.AnimationMixer(meshRef.current);
          const action = mixer.clipAction(animGltf.animations[0]);
          action.play();
          
          // Store mixer for updates
          (meshRef.current as any).mixer = mixer;
        }
      },
      undefined,
      (error) => {
        console.log('Could not load idle animation, avatar will remain in T-pose');
      }
    );
  }, [gltf]);
  
  // Apply emotions to morph targets
  useEffect(() => {
    if (morphTargets.length > 0) {
      morphTargets.forEach(mesh => {
        // Reset all morph targets
        if (mesh.morphTargetInfluences) {
          mesh.morphTargetInfluences.fill(0);
        }
        
        // Apply emotion-based morph targets
        Object.entries(emotions).forEach(([emotion, intensity]) => {
          // Find corresponding RPM blendshapes for this emotion
          Object.entries(EMOTION_BLENDSHAPE_MAP).forEach(([blendshape, mappedEmotion]) => {
            if (mappedEmotion === emotion && mesh.morphTargetDictionary![blendshape] !== undefined) {
              const index = mesh.morphTargetDictionary![blendshape];
              if (mesh.morphTargetInfluences && index !== undefined) {
                mesh.morphTargetInfluences[index] = Math.min(intensity, 1.0);
              }
            }
          });
        });
      });
    }
  }, [emotions, morphTargets]);

  // Animation loop
  useFrame((state, delta) => {
    if (isAnimating && meshRef.current) {
      // Removed rotation animation to keep avatar facing forward
      // meshRef.current.rotation.y += 0.005;
    }
    
    // Update animation mixer
    if (meshRef.current && (meshRef.current as any).mixer) {
      (meshRef.current as any).mixer.update(delta);
    }
    
    // Blinking animation
    setBlinkTime(prev => prev + delta);
    if (morphTargets.length > 0 && blinkTime > 2) { // Blink every 2 seconds instead of 3
      morphTargets.forEach(mesh => {
        if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
          const leftBlink = mesh.morphTargetDictionary['eyeBlinkLeft'];
          const rightBlink = mesh.morphTargetDictionary['eyeBlinkRight'];
          
          if (leftBlink !== undefined && rightBlink !== undefined) {
            // Quick blink animation
            const blinkProgress = (blinkTime - 2) * 15; // Faster blink (was 10)
            if (blinkProgress < 1) {
              const blinkValue = Math.sin(blinkProgress * Math.PI);
              mesh.morphTargetInfluences[leftBlink] = blinkValue;
              mesh.morphTargetInfluences[rightBlink] = blinkValue;
            } else {
              mesh.morphTargetInfluences[leftBlink] = 0;
              mesh.morphTargetInfluences[rightBlink] = 0;
              if (blinkProgress > 1.5) setBlinkTime(0); // Reset blink timer
            }
          }
        }
      });
    }
    
    // Subtle breathing animation
    if (meshRef.current) {
      const breathingOffset = Math.sin(state.clock.elapsedTime * 0.5) * 0.01;
      meshRef.current.scale.y = 1 + breathingOffset;
    }
  });

  // Handle loading error or missing URL - AFTER all hooks
  if (loadError || !avatarUrl) {
    console.log('🎭 Avatar3D: Rendering fallback avatar. loadError:', loadError, 'avatarUrl:', avatarUrl);
    
    // Generate diverse appearance based on avatar ID
    const avatarSeed = avatarUrl ? avatarUrl.length : Math.random() * 1000;
    const skinTones = ['#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#654321'];
    const hairColors = ['#2c1b18', '#8b4513', '#daa520', '#ff6347', '#000000', '#654321'];
    const clothingColors = ['#4A90E2', '#E74C3C', '#2ECC71', '#9B59B6', '#F39C12', '#1ABC9C'];
    
    const skinTone = skinTones[Math.floor(avatarSeed) % skinTones.length];
    const hairColor = hairColors[Math.floor(avatarSeed * 2) % hairColors.length];
    const clothingColor = clothingColors[Math.floor(avatarSeed * 3) % clothingColors.length];
    
    return (
      <group position={[0, -0.5, 0]}>
        {/* Head */}
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color={skinTone} />
        </mesh>
        
        {/* Hair */}
        <mesh position={[0, 1.7, 0]}>
          <sphereGeometry args={[0.32, 16, 16]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>
        
        {/* Body */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.4, 0.3, 1.2, 8]} />
          <meshStandardMaterial color={clothingColor} />
        </mesh>
        
        {/* Arms */}
        <mesh position={[-0.6, 0.8, 0]} rotation={[0, 0, 0.3]}>
          <cylinderGeometry args={[0.08, 0.08, 0.8, 8]} />
          <meshStandardMaterial color={skinTone} />
        </mesh>
        <mesh position={[0.6, 0.8, 0]} rotation={[0, 0, -0.3]}>
          <cylinderGeometry args={[0.08, 0.08, 0.8, 8]} />
          <meshStandardMaterial color={skinTone} />
        </mesh>
        
        {/* Eyes */}
        <mesh position={[-0.1, 1.6, 0.25]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#000" />
        </mesh>
        <mesh position={[0.1, 1.6, 0.25]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#000" />
        </mesh>
        
        {/* Simple smile */}
        <mesh position={[0, 1.4, 0.25]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.08, 0.02, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#000" />
        </mesh>
      </group>
    );
  }
  
  if (!gltf) {
    console.log('🎭 Avatar3D: No GLTF loaded yet, returning null');
    return null;
  }
  
  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      <primitive object={gltf.scene} />
    </group>
  );
};

// Fallback Avatar Component - shows when RPM avatar fails to load
function FallbackAvatar({ 
  emotions = {}, 
  isLipSyncing = false,
  name = 'Avatar'
}: {
  emotions?: Record<string, number>;
  isLipSyncing?: boolean;
  name?: string;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const [time, setTime] = useState(0);

  console.log('🎭 FallbackAvatar rendering with emotions:', emotions);

  // Animation loop
  useFrame((state, delta) => {
    setTime(time + delta);
    
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = Math.sin(time * 2) * 0.1;
      // Removed rotation to keep avatar facing forward
      // meshRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
    }
  });

  // Calculate color based on emotions
  const avatarColor = useMemo(() => {
    const joy = emotions.joy || 0;
    const anger = emotions.anger || 0;
    const sadness = emotions.sadness || 0;
    
    // Base blue color, modified by emotions
    const r = Math.min(1, 0.3 + anger * 0.7);
    const g = Math.min(1, 0.6 + joy * 0.4 - sadness * 0.3);
    const b = Math.min(1, 0.9 - anger * 0.3);
    
    return new THREE.Color(r, g, b);
  }, [emotions]);

  useEffect(() => {
    // This effect is just for the fallback avatar animation setup
    // No need to reference avatarUrl here since this component only shows when there's no URL
  }, []);

  return (
    <group ref={meshRef}>
      {/* Main avatar body */}
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.8, 2, 4, 8]} />
        <meshPhongMaterial color={avatarColor} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshPhongMaterial color={avatarColor} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.2, 1.6, 0.4]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshPhongMaterial color="#000" />
      </mesh>
      <mesh position={[0.2, 1.6, 0.4]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshPhongMaterial color="#000" />
      </mesh>
      
      {/* Mouth - changes with lip sync */}
      <mesh position={[0, 1.3, 0.4]} scale={[isLipSyncing ? 1.2 : 1, isLipSyncing ? 0.8 : 1, 1]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshPhongMaterial color="#000" />
      </mesh>
      
      {/* Name label */}
      <Text
        position={[0, -1.5, 0]}
        fontSize={0.3}
        color="#4A90E2"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>
      
      {/* RPM Setup hint */}
      <Text
        position={[0, -2, 0]}
        fontSize={0.15}
        color="#666"
        anchorX="center"
        anchorY="middle"
        maxWidth={4}
      >
        Fallback Avatar{'\n'}(Add RPM URL for realistic avatar)
      </Text>
    </group>
  );
}

export const RPMAvatar: FC<RPMAvatarProps> = ({
  avatarUrl,
  emotions = {},
  isAnimating = true,
  scale = 1,
  position = [0, -1, 0],
  enableControls = false,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const handleLoadingComplete = () => {
    setIsLoading(false);
  };
  
  const handleError = (error: any) => {
    console.error('RPM Avatar loading error:', error);
    setError('Failed to load avatar');
    setIsLoading(false);
  };

  // Log setup instructions on first render
  useEffect(() => {
    console.log(' RPMAvatar render - URL:', avatarUrl, 'isEmpty:', !avatarUrl);
    if (!avatarUrl) {
      console.log(' RPM Avatar: No URL provided, showing fallback avatar');
      setIsLoading(false); // Don't show loading for fallback
      RPMAvatarGenerator.logSetupInstructions();
    }
  }, [avatarUrl]);

  return (
    <div className={`rpm-avatar-container ${className}`} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {isLoading && (
        <div className="avatar-loading">
          <div className="loading-spinner"></div>
          <p>Loading avatar...</p>
        </div>
      )}
      
      {error && (
        <div className="avatar-error">
          <p> {error}</p>
          <p>Using fallback image</p>
        </div>
      )}
      
      <Canvas
        camera={{ position: [0, 1.6, 1.2], fov: 30 }}
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', width: '100%', height: '100%' }}
        gl={{ 
          preserveDrawingBuffer: true,
          antialias: true,
          alpha: true
        }}
        onCreated={(state) => {
          console.log('🎨 Canvas created successfully!', state);
          // Add context lost/restored handlers
          const canvas = state.gl.domElement;
          canvas.addEventListener('webglcontextlost', (e) => {
            console.warn('🚨 WebGL context lost, preventing default');
            e.preventDefault();
          });
          canvas.addEventListener('webglcontextrestored', () => {
            console.log('✅ WebGL context restored');
          });
          handleLoadingComplete();
        }}
        onError={(error) => {
          console.error('🚨 Canvas error:', error);
          handleError(error);
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[0, 2, 3]} intensity={1.2} />
        <pointLight position={[-2, 1, 2]} intensity={0.8} color="#ffd700" />
        <pointLight position={[2, 1, 2]} intensity={0.6} color="#87ceeb" />
        
        <Avatar3D 
          avatarUrl={avatarUrl} 
          emotions={emotions}
          isAnimating={isAnimating}
        />
        
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
          target={[0, 1.5, 0]}
        />
        
        <Environment preset="studio" />
      </Canvas>
      
      <style>{`
        .rpm-avatar-container {
          border-radius: 12px;
          overflow: hidden;
        }
        
        .avatar-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 10;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 10px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .avatar-error {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 10;
          background: rgba(255,255,255,0.9);
          padding: 20px;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
};

export default RPMAvatar;
