import process from 'process';
import React, { useState, useEffect, useRef, useCallback, useMemo, useImperativeHandle, forwardRef } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { OrbitControls, useAnimations, useGLTF } from '@react-three/drei'; // Keep useGLTF for animations if still used there
import { GLTFLoader, KTX2Loader, MeshoptDecoder, type GLTF } from 'three-stdlib';


import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

import * as THREE from 'three';
import { ARKitBlendshapeNamesList, BlendshapeKey } from '../types/blendshapes';
import { Group, Mesh, SkinnedMesh, Vector3Tuple, AnimationClip, LoopRepeat } from 'three';
import { useHumeEmotionStream } from '../hooks/useHumeEmotionStream';
import SimulationAvatar3D from './TestAvatar'; // Re-enable for testing with logs, now points to TestAvatar.tsx
import { GroupProps } from '@react-three/fiber';

// We don't need ReadyPlayerMeAvatarProps here directly anymore, SimulationAvatar3D handles its own prop types.
import { mapEmotionsToBlendshapes, getTopEmotion } from '../utils/emotionMappings';
import { BlendshapeCompositor, BlendshapeInput } from '../utils/blendshapeCompositor';

// Animation file lists (relative to /public directory)
const MASCULINE_TALKING_ANIMATION_FILES = [
  "/animations/M_Talking_Variations_001.glb",
  "/animations/M_Talking_Variations_002.glb",
  "/animations/M_Talking_Variations_003.glb",
  "/animations/M_Talking_Variations_004.glb",
  "/animations/M_Talking_Variations_005.glb",
  "/animations/M_Talking_Variations_006.glb",
  "/animations/M_Talking_Variations_007.glb",
  "/animations/M_Talking_Variations_008.glb",
  "/animations/M_Talking_Variations_009.glb",
  "/animations/M_Talking_Variations_010.glb",
];

const MASCULINE_IDLE_ANIMATION_FILES = [
  "/animations/M_Standing_Idle_001.glb",
  "/animations/M_Standing_Idle_002.glb",
  "/animations/M_Standing_Idle_Variations_001.glb",
  "/animations/M_Standing_Idle_Variations_002.glb",
  "/animations/M_Standing_Idle_Variations_003.glb",
  "/animations/M_Standing_Idle_Variations_004.glb",
  "/animations/M_Standing_Idle_Variations_005.glb",
  "/animations/M_Standing_Idle_Variations_006.glb",
  "/animations/M_Standing_Idle_Variations_007.glb",
  "/animations/M_Standing_Idle_Variations_008.glb",
  "/animations/M_Standing_Idle_Variations_009.glb",
  "/animations/M_Standing_Idle_Variations_010.glb",
];

// Helper to extract filename for unique naming
const getUniqueAnimName = (path: string, prefix: string) => {
  const filename = path.split('/').pop()?.replace('.glb', '');
  return `${prefix}_${filename}`;
};

// Helper to get a filename without extension for prefixing, if needed
// const getBaseFilename = (path: string) => path.split('/').pop()?.split('.')[0] || 'anim';

function useExternalAnimations(animationPaths?: string[]): { clips: THREE.AnimationClip[], names: string[] } {
  // Preload all paths. useGLTF.preload is not a hook.
  useEffect(() => {
    if (animationPaths && animationPaths.length > 0) {
      useGLTF.preload(animationPaths);
    }
  }, [animationPaths]);

  const gltfResults = useGLTF(animationPaths || []) as GLTF[]; // Cast to GLTF[] for type safety

  const processedAnimations = useMemo(() => {
    if (!animationPaths || animationPaths.length === 0 || !gltfResults || gltfResults.length === 0) {
      return { clips: [], names: [] };
    }

    const allClips: THREE.AnimationClip[] = [];
    const allNames: string[] = [];

    const gltfsToProcess = Array.isArray(gltfResults) ? gltfResults : [gltfResults];

    gltfsToProcess.forEach((gltf, i) => {
      if (!gltf || !gltf.animations) {
        console.warn(`[useExternalAnimations] GLTF result at index ${i} (path: ${animationPaths[i]}) is invalid or has no animations.`);
        return;
      }
      gltf.animations.forEach((clip) => {
        allClips.push(clip); 
        allNames.push(clip.name);
      });
    });
    return { clips: allClips, names: [...new Set(allNames)] }; 
  }, [gltfResults, animationPaths]);

  return processedAnimations;
}

// ======================== TYPES ========================

// Standard ARKit blendshape names
export type ARKitBlendshapeName =
  | 'browDownLeft'
  | 'browDownRight'
  | 'browInnerUp'
  | 'browOuterUpLeft'
  | 'browOuterUpRight'
  | 'cheekPuff'
  | 'cheekSquintLeft'
  | 'cheekSquintRight'
  | 'eyeBlinkLeft'
  | 'eyeBlinkRight'
  | 'eyeLookDownLeft'
  | 'eyeLookDownRight'
  | 'eyeLookInLeft'
  | 'eyeLookInRight'
  | 'eyeLookOutLeft'
  | 'eyeLookOutRight'
  | 'eyeLookUpLeft'
  | 'eyeLookUpRight'
  | 'eyeSquintLeft'
  | 'eyeSquintRight'
  | 'eyeWideLeft'
  | 'eyeWideRight'
  | 'jawForward'
  | 'jawLeft'
  | 'jawOpen'
  | 'jawRight'
  | 'mouthClose'
  | 'mouthDimpleLeft'
  | 'mouthDimpleRight'
  | 'mouthFrownLeft'
  | 'mouthFrownRight'
  | 'mouthFunnel'
  | 'mouthLeft'
  | 'mouthLowerDownLeft'
  | 'mouthLowerDownRight'
  | 'mouthPressLeft'
  | 'mouthPressRight'
  | 'mouthPucker'
  | 'mouthRight'
  | 'mouthRollLower'
  | 'mouthRollUpper'
  | 'mouthShrugLower'
  | 'mouthShrugUpper'
  | 'mouthSmileLeft'
  | 'mouthSmileRight'
  | 'mouthStretchLeft'
  | 'mouthStretchRight'
  | 'mouthUpperUpLeft'
  | 'mouthUpperUpRight'
  | 'noseSneerLeft'
  | 'noseSneerRight'
  | 'tongueOut';

export type BlendShapeMap = Partial<Record<ARKitBlendshapeName, number>>;


export interface Emotion {
  name: string;
  score: number;
  timestamp?: number; // Added timestamp
}

interface Avatar3DProps {
  url: string;
  visemeShapes?: Partial<BlendShapeMap>; // For viseme-driven facial expressions
  emotionShapes?: Partial<BlendShapeMap>; // For emotion-driven facial expressions
  isSpeaking?: boolean; // To indicate if avatar is currently speaking (for visemes)
  position?: Vector3Tuple;
  scale?: number | Vector3Tuple;
  onLoaded?: () => void;
  onModelLoaded?: (model: Group) => void;
  currentAnimationName?: string; // For body animation
  additionalClips?: THREE.AnimationClip[]; // For externally loaded animations
}

interface EmotionDrivenAvatarProps {
  humeApiKey?: string;
  avatarUrl: string;
  visemeBlendshapes?: Partial<BlendShapeMap>; // Added for viseme-driven blendshapes
  activeBodyAnimation?: string; // New prop for body animation
  onError?: (error: Error) => void;
  onLoad?: () => void;
  onEmotionDetected?: (emotion: Emotion) => void;
  isSpeaking: boolean; // Added to control avatar speaking state from parent
  visemeData?: Record<string, number>; // Added for direct viseme data input
  detectedEmotions?: Emotion[]; // New prop for receiving emotion data
  directBlendshapes?: Partial<BlendShapeMap>; // For direct blendshape control
  emotionBlendshapes?: Partial<BlendShapeMap>; // For emotion-driven blendshapes (e.g., from prosody)
  cameraEnabled?: boolean;
  talkAnimation?: string; // Fallback if paths are not provided
  idleAnimation?: string; // Fallback if paths are not provided
  talkAnimationPaths?: string[]; // Paths to GLBs for talking animations
  idleAnimationPaths?: string[]; // Paths to GLBs for idle animations
  onEmotions?: (emotions: Emotion[]) => void; // Added onEmotions callback
  currentEmotion?: string; // For direct emotion string input from parent
  idleShapes?: Partial<BlendShapeMap>; // For idle blinking or resting expression
}

// Default light properties for Avatar3D
const AVATAR_AMBIENT_LIGHT_INTENSITY = 0.9; // Slightly increased
const AVATAR_DIRECTIONAL_LIGHT_POSITION = { x: 5, y: 5, z: 5 }; // Simple object for position
const AVATAR_DIRECTIONAL_LIGHT_INTENSITY = 0.8; // Reduced intensity
const AVATAR_HEMISPHERE_SKY_COLOR = 0xffffbb;
const AVATAR_HEMISPHERE_GROUND_COLOR = 0x080820;
const AVATAR_HEMISPHERE_INTENSITY = 0.6;

// Local emotion mapping helpers (ARKIT_EMOTION_MAP_MINIMAL_V2 and local mapEmotionsToBlendshapes) removed.
// Using imported mapEmotionsToBlendshapes from ../utils/emotionMappings.ts which has its own internal map.

// ======================== COMPONENTS ========================

// Define the InlineBox component here, within the same file scope
const InlineBox = (props: GroupProps) => {
  return (
    <group {...props}>
      <mesh position={[0, 0.5, 0]}> {/* Centered, assuming pivot is at feet */}
        <boxGeometry args={[0.5, 1, 0.5]} /> {/* Approx human-like proportions */}
        <meshStandardMaterial color="purple" /> {/* Distinct color */}
      </mesh>
    </group>
  );
};

const EmotionDrivenAvatarComponentBody = (
  props: EmotionDrivenAvatarProps,
  ref: React.ForwardedRef<THREE.Group | null>
): JSX.Element | null => {
  console.log('[EDA] Props received - detectedEmotions:', JSON.stringify(props.detectedEmotions));
  console.log('[EDA] Props received - isSpeaking:', props.isSpeaking);
  console.log('[EDA] Props received - visemeData:', JSON.stringify(props.visemeData));
  console.log('[EDA] Props received - directBlendshapes:', JSON.stringify(props.directBlendshapes));

  // DEBUG: Check for problematic viseme data overriding face tracking
  if (props.visemeData && Object.keys(props.visemeData).length > 0) {
    console.log('[EDA] ⚠️ VISEME DATA DETECTED - This may override face tracking!');
    if (props.visemeData.jawOpen !== undefined) {
      console.log(`[EDA] ⚠️ jawOpen in visemeData: ${props.visemeData.jawOpen} (this will override ML5)`);
    }
  }

  const {
    humeApiKey,
    avatarUrl,
    activeBodyAnimation,
    onError,
    onLoad,
    isSpeaking,
    detectedEmotions: propDetectedEmotions,
    directBlendshapes,
    emotionBlendshapes,
    cameraEnabled,
    talkAnimation, 
    idleAnimation, 
    talkAnimationPaths = MASCULINE_TALKING_ANIMATION_FILES,
    idleAnimationPaths = MASCULINE_IDLE_ANIMATION_FILES,
    visemeData, // Added to destructure from props
  } = props;

  const modelRef = useRef<THREE.Group>(null); // Local ref for SimulationAvatar3D
  
  // Forward the ref to the internal modelRef if the parent needs access to the THREE.Group
  useImperativeHandle(ref, () => modelRef.current as THREE.Group);

  const [latestStreamEmotion, setLatestStreamEmotion] = useState<Emotion | null>(null);
  const [blinkShapes, setBlinkShapes] = useState<Partial<BlendShapeMap>>({ eyeBlinkLeft: 0, eyeBlinkRight: 0 });

  const handleStreamEmotionData = useCallback((emotion: { name: string; score: number; }) => {
    const newEmotion: Emotion = { ...emotion, timestamp: Date.now() };
    setLatestStreamEmotion(newEmotion);
    if (props.onEmotions) {
      props.onEmotions([newEmotion]);
    }
  }, [props.onEmotions]);

  const { connectionState, lastError, sendVideoFrame } = useHumeEmotionStream(
    humeApiKey, // Pass apiKey directly, hook handles undefined
    handleStreamEmotionData, // Pass the new callback
    { // Pass config object
      isEmotionDetectionActive: cameraEnabled,
      isVideoOn: cameraEnabled 
    }
  );

  useEffect(() => {
    if (lastError && onError) {
      // lastError from useHumeEmotionStream is string | null
      onError(new Error(lastError)); 
    }
  }, [lastError, onError]);

  useEffect(() => {
    let blinkTimeoutId: NodeJS.Timeout;
    let blinkDurationTimeoutId: NodeJS.Timeout;

    const triggerBlink = () => {
      setBlinkShapes({ eyeBlinkLeft: 1, eyeBlinkRight: 1 });
      blinkDurationTimeoutId = setTimeout(() => {
        setBlinkShapes({ eyeBlinkLeft: 0, eyeBlinkRight: 0 });
      }, 150); // Blink duration: 150ms

      // Schedule next blink randomly between 3 to 7 seconds
      const nextBlinkDelay = Math.random() * 4000 + 3000;
      blinkTimeoutId = setTimeout(triggerBlink, nextBlinkDelay);
    };

    // Start the first blink after a short delay
    const initialBlinkDelay = Math.random() * 4000 + 1000; // Initial delay 1-5 seconds
    blinkTimeoutId = setTimeout(triggerBlink, initialBlinkDelay);

    return () => {
      clearTimeout(blinkTimeoutId);
      clearTimeout(blinkDurationTimeoutId);
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount

  const emotionsToProcess = useMemo(() => {
    if (props.currentEmotion) { // Prioritize direct string from parent
      // console.log(`[EDA] Using props.currentEmotion: ${props.currentEmotion}`);
      return [{ name: props.currentEmotion, score: 1.0 }]; // Convert to Emotion[]
    }
    // Fallback to existing logic if props.currentEmotion is not provided
    if (propDetectedEmotions && propDetectedEmotions.length > 0) {
      // console.log('[EDA] Using props.propDetectedEmotions');
      return propDetectedEmotions;
    }
    if (latestStreamEmotion) {
      // console.log('[EDA] Using internal latestStreamEmotion');
      return [latestStreamEmotion];
    }
    // console.log('[EDA] No emotion source found, returning empty array.');
    return [];
  }, [props.currentEmotion, propDetectedEmotions, latestStreamEmotion]);
  console.log('[EDA] emotionsToProcess:', JSON.stringify(emotionsToProcess, null, 2));
  const topEmotion = useMemo(() => getTopEmotion(emotionsToProcess || []), [emotionsToProcess]);

  const activeEmotionShapes = useMemo(() => {
    // Use the imported mapEmotionsToBlendshapes function
    // It expects an array of emotions and uses its internal mapping.
    // Pass an empty array if topEmotion is null to avoid errors and get a neutral/zeroed map.
    const blendshapes = mapEmotionsToBlendshapes(topEmotion ? [topEmotion] : []);
    console.log('[EDA] Blendshapes from mapEmotionsToBlendshapes:', JSON.stringify(blendshapes, null, 2));
    return blendshapes;
  }, [topEmotion]);

  const compositor = useMemo(() => {
    return new BlendshapeCompositor({
      emotionMouthReduction: 0.3,  // Reduce emotion mouth shapes when visemes are active
      emotionFaceBlending: 0.8,    // Keep emotion eye/brow shapes strong
      smoothingFactor: 0.1         // Light smoothing for transitions
    });
  }, []);

  const finalEmotionShapes = useMemo(() => {
    // Only use visemeData when actually speaking or when it contains significant mouth movement
    // This prevents idle/test visemes from overriding ML5 face tracking
    const shouldUseVisemes = isSpeaking || (visemeData && Object.entries(visemeData).some(([key, value]) => 
      key.startsWith('mouth') && (value || 0) > 0.1
    ));
    
    const inputs: BlendshapeInput = {
      visemes: shouldUseVisemes ? (visemeData || {}) : {}, // Only use visemes when speaking or with significant mouth movement
      emotions: activeEmotionShapes || {}, // Emotional expressions
      manual: directBlendshapes || {},     // Manual overrides (highest priority overall)
      base: blinkShapes || {}              // Base/idle state (blinking)
    };
    
    if (!shouldUseVisemes && visemeData && Object.keys(visemeData).length > 0) {
      console.log('[EDA] 🚫 Ignoring visemeData (not speaking and no significant mouth movement):', JSON.stringify(visemeData));
    }
    
    const composedShapes = compositor.compose(inputs);
    
    // Add fallback jaw animation if speaking but no significant mouth movement
    if (isSpeaking) {
      const hasSignificantMouthMovement = Object.entries(composedShapes).some(([key, value]) => 
        key.startsWith('mouth') && (value || 0) > 0.1
      );
      
      if (!hasSignificantMouthMovement && (composedShapes.jawOpen || 0) < 0.1) {
        composedShapes.jawOpen = 0.4; // Fallback jaw animation
        console.log('[EDA] Applied fallback jaw animation for speech');
      }
    }
    
    console.log('[EDA] Composed blendshapes:', JSON.stringify(composedShapes, null, 2));
    return composedShapes;
  }, [compositor, visemeData, activeEmotionShapes, directBlendshapes, blinkShapes, isSpeaking]);

  const { clips: talkClips, names: talkAnimNames } = useExternalAnimations(talkAnimationPaths);
  const { clips: idleClips, names: idleAnimNames } = useExternalAnimations(idleAnimationPaths);
  const allAdditionalClips = useMemo(() => {
      const uniqueClips = new Map<string, THREE.AnimationClip>();
      [...talkClips, ...idleClips].forEach(clip => {
          if (clip && clip.name && !uniqueClips.has(clip.name)) {
              uniqueClips.set(clip.name, clip);
          }
      });
      return Array.from(uniqueClips.values());
  }, [talkClips, idleClips]);

  const [currentTalkAnimIndex, setCurrentTalkAnimIndex] = useState(0);
  const [currentIdleAnimIndex, setCurrentIdleAnimIndex] = useState(0);
  
  const currentAnimationName = useMemo(() => {
    if (activeBodyAnimation) return activeBodyAnimation;
    if (isSpeaking) {
      return talkAnimNames.length > 0 ? talkAnimNames[currentTalkAnimIndex % talkAnimNames.length] : talkAnimation || 'Talk_0';
    }
    return idleAnimNames.length > 0 ? idleAnimNames[currentIdleAnimIndex % idleAnimNames.length] : idleAnimation || 'Idle_0';
  }, [isSpeaking, activeBodyAnimation, talkAnimNames, idleAnimNames, currentTalkAnimIndex, currentIdleAnimIndex, talkAnimation, idleAnimation]);

  const handleModelLoaded = useCallback((loadedModel: THREE.Group) => {
      if (onLoad) {
          onLoad();
      }
  }, [onLoad]);

  if (!avatarUrl) {
    console.warn("EmotionDrivenAvatar: avatarUrl is not provided. Rendering null.");
    if (onError) onError(new Error("EmotionDrivenAvatar: avatarUrl is not provided."));
    return null; 
  }

  console.log("[EmotionDrivenAvatar] Checking IMPORTED THREE instance before Canvas render:");
  console.log("[EmotionDrivenAvatar] IMPORTED THREE object:", THREE);
  console.log("[EmotionDrivenAvatar] IMPORTED THREE.REVISION:", THREE?.REVISION);
  console.log("[EmotionDrivenAvatar] Is IMPORTED THREE.Cache available (added by threejs core)?", !!THREE?.Cache);
  console.log("[EmotionDrivenAvatar] Is IMPORTED THREE.CanvasTexture available (used by R3F Canvas)?", !!THREE?.CanvasTexture);

  console.log("[EmotionDrivenAvatar] Checking WINDOW.THREE instance before Canvas render:");
  console.log("[EmotionDrivenAvatar] WINDOW.THREE object:", (window as any).THREE);
  console.log("[EmotionDrivenAvatar] WINDOW.THREE.REVISION:", (window as any).THREE?.REVISION);
  console.log("[EmotionDrivenAvatar] Is WINDOW.THREE.Cache available?", !!(window as any).THREE?.Cache);
  console.log("[EmotionDrivenAvatar] Is WINDOW.THREE.CanvasTexture available?", !!(window as any).THREE?.CanvasTexture);

  // Log states being passed to SimulationAvatar3D
  console.log('[EDA] Values passed to SimAvatar3D - finalEmotionShapes (COMPOSED):', JSON.stringify(finalEmotionShapes));
  console.log('[EDA] Values passed to SimAvatar3D - visemeData (RAW, for reference):', JSON.stringify(visemeData));
  console.log('[EDA] Values passed to SimAvatar3D - currentAnimationName:', currentAnimationName);

  return (
    <Canvas
      camera={{ position: [0, 0, 2], fov: 50 }} // Values from before the bad edit
      style={{ touchAction: 'none' }}
      shadows
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
    >
      <ambientLight intensity={0.8} />
      <pointLight position={[5, 5, 5]} intensity={0.8} />
      <OrbitControls 
        enableRotate={false}
        enablePan={false}
        enableZoom={false}
        autoRotate={false}
      />
      <SimulationAvatar3D // This is TestAvatar
        avatarUrl={avatarUrl} // Pass the avatarUrl
        animationClips={allAdditionalClips} // Pass the loaded animation clips
        currentAnimationName={currentAnimationName} // Pass the determined current animation name
        emotionShapes={finalEmotionShapes} // Pass the composed blendshapes (includes visemes, emotions, manual, blinks)
        visemeShapes={{}} // Empty since finalEmotionShapes now contains composed visemes
        position={[0, -0.8, 0]}
        scale={1.0}
        onModelLoaded={handleModelLoaded} // Pass onModelLoaded callback
      />
    </Canvas>
  );
}; // Closing EmotionDrivenAvatarComponentBody
EmotionDrivenAvatarComponentBody.displayName = 'EmotionDrivenAvatarComponentBody';

// Assuming EmotionDrivenAvatarProps is defined above in the file or imported.
// The export structure from before the error:
const ForwardedEmotionDrivenAvatar = React.forwardRef<THREE.Group | null, EmotionDrivenAvatarProps>(EmotionDrivenAvatarComponentBody as any); // Using 'as any' to bridge potential ref type mismatches for now, this complex export needs review later.
export default React.memo(ForwardedEmotionDrivenAvatar);
