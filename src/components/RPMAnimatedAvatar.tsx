import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAnimations } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import type { BlendShapeMap, BlendshapeKey } from '../types/blendshapes';
import { ARKitBlendshapeNamesList } from '../types/blendshapes';
import { PRELOADED_AVATARS } from '../data/preloadedAvatars';

interface RPMAnimatedAvatarProps {
  avatarId: string;
  emotionShapes?: Partial<BlendShapeMap>;
  visemeShapes?: Partial<BlendShapeMap>;
  isSpeaking?: boolean;
  position?: [number, number, number];
  scale?: number | [number, number, number];
  rotation?: [number, number, number];
  animationClips?: THREE.AnimationClip[];
  currentAnimationName?: string;
  onModelLoaded?: (model: THREE.Group) => void;
}

// Viseme-authoritative shapes that should be controlled by speech
const VISEME_AUTHORITATIVE_SHAPES = new Set([
  'jawOpen', 'jawForward', 'jawLeft', 'jawRight',
  'mouthClose', 'mouthFunnel', 'mouthPucker', 'mouthLeft', 'mouthRight',
  'mouthSmileLeft', 'mouthSmileRight', 'mouthFrownLeft', 'mouthFrownRight',
  'mouthDimpleLeft', 'mouthDimpleRight', 'mouthStretchLeft', 'mouthStretchRight',
  'mouthRollLower', 'mouthRollUpper', 'mouthShrugLower', 'mouthShrugUpper',
  'mouthPressLeft', 'mouthPressRight', 'mouthLowerDownLeft', 'mouthLowerDownRight',
  'mouthUpperUpLeft', 'mouthUpperUpRight'
]);

// Idle mouth animation for when not speaking
const IDLE_MOUTH_SHAPES: Partial<BlendShapeMap> = {
  jawOpen: 0,
  mouthClose: 0,
  mouthFunnel: 0,
  mouthPucker: 0,
  mouthLeft: 0,
  mouthRight: 0,
  mouthSmileLeft: 0.1,
  mouthSmileRight: 0.1,
  mouthFrownLeft: 0,
  mouthFrownRight: 0,
  mouthDimpleLeft: 0,
  mouthDimpleRight: 0,
  mouthStretchLeft: 0,
  mouthStretchRight: 0,
  mouthRollLower: 0,
  mouthRollUpper: 0,
  mouthShrugLower: 0,
  mouthShrugUpper: 0,
  mouthPressLeft: 0,
  mouthPressRight: 0,
  mouthLowerDownLeft: 0,
  mouthLowerDownRight: 0,
  mouthUpperUpLeft: 0,
  mouthUpperUpRight: 0
};

export function RPMAnimatedAvatar({
  avatarId,
  emotionShapes = {},
  visemeShapes = {},
  isSpeaking = false,
  position = [0, -0.8, 0], // Better default position
  scale = 1.2, // Slightly larger default scale
  rotation = [0, 0, 0],
  animationClips = [],
  currentAnimationName,
  onModelLoaded
}: RPMAnimatedAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { gl } = useThree();
  const [loadedModel, setLoadedModel] = useState<THREE.Group | null>(null);
  const [loadedAnimations, setLoadedAnimations] = useState<THREE.AnimationClip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const lastUpdateTime = useRef(Date.now());
  const currentShapes = useRef<Partial<BlendShapeMap>>({});

  // Load idle and talking animations
  const idleAnimationUrl = '/animations/M_Standing_Idle_001.glb';
  const talkingAnimationUrl = '/animations/M_Talking_Variations_001.glb';
  
  const { animations: idleAnimations } = useGLTF(idleAnimationUrl);
  const { animations: talkingAnimations } = useGLTF(talkingAnimationUrl);

  // Load avatar
  useEffect(() => {
    const avatar = PRELOADED_AVATARS.find(a => a.id === avatarId);
    if (!avatar) {
      console.error(`[RPMAnimatedAvatar] Avatar not found: ${avatarId}`);
      setError(`Avatar not found: ${avatarId}`);
      return;
    }

    // Use local path instead of trying to load from RPM
    const avatarUrl = avatar.path;
    
    console.log(`[RPMAnimatedAvatar] Loading avatar from: ${avatarUrl}`);
    
    const loader = new GLTFLoader();
    
    // Configure KTX2 loader
    const ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath('/basis/');
    ktx2Loader.detectSupport(gl);
    loader.setKTX2Loader(ktx2Loader);

    // Configure DRACO loader
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    loader.setDRACOLoader(dracoLoader);

    // Configure Meshopt decoder
    loader.setMeshoptDecoder(MeshoptDecoder);

    loader.load(
      avatarUrl,
      (gltf) => {
        console.log('[RPMAnimatedAvatar] Successfully loaded avatar');
        
        // Ensure proper material settings
        gltf.scene.traverse((object) => {
          if (object instanceof THREE.SkinnedMesh) {
            console.log('[RPMAnimatedAvatar] Found SkinnedMesh:', object.name);
            if (object.morphTargetDictionary) {
              console.log('[RPMAnimatedAvatar] Morph targets:', Object.keys(object.morphTargetDictionary));
            }
            if (object.material) {
              object.material.needsUpdate = true;
            }
          }
        });

        setLoadedModel(gltf.scene);
        setLoadedAnimations(gltf.animations || []);
        setError(null);
        
        if (onModelLoaded) {
          onModelLoaded(gltf.scene);
        }
      },
      (progress) => {
        console.log('[RPMAnimatedAvatar] Loading progress:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
      },
      (error) => {
        console.error('[RPMAnimatedAvatar] Error loading avatar:', error);
        setError((error as Error).message || 'Failed to load avatar');
      }
    );

    // Cleanup
    return () => {
      ktx2Loader.dispose();
      dracoLoader.dispose();
    };
  }, [avatarId, gl, onModelLoaded]);

  // Combine all animations
  const allAnimations = useMemo(() => {
    const anims = [...loadedAnimations, ...animationClips];
    if (idleAnimations) anims.push(...idleAnimations);
    if (talkingAnimations) anims.push(...talkingAnimations);
    return anims;
  }, [loadedAnimations, animationClips, idleAnimations, talkingAnimations]);

  // Setup animations
  const { actions, mixer } = useAnimations(allAnimations, groupRef);

  // Handle speaking/idle animation switching
  useEffect(() => {
    if (!actions || !idleAnimations || !talkingAnimations) return;

    const idleAction = idleAnimations[0] ? actions[idleAnimations[0].name] : null;
    const talkAction = talkingAnimations[0] ? actions[talkingAnimations[0].name] : null;

    if (isSpeaking && talkAction) {
      // Switch to talking animation
      if (idleAction) idleAction.fadeOut(0.3);
      talkAction.reset().fadeIn(0.3).play();
    } else if (idleAction) {
      // Switch to idle animation
      if (talkAction) talkAction.fadeOut(0.3);
      idleAction.reset().fadeIn(0.3).play();
    }
  }, [actions, isSpeaking, idleAnimations, talkingAnimations]);

  // Handle custom animation changes
  useEffect(() => {
    if (currentAnimationName && actions[currentAnimationName]) {
      const currentAction = actions[currentAnimationName];
      currentAction.reset().fadeIn(0.3).play();
      
      // Fade out other actions
      Object.entries(actions).forEach(([name, action]) => {
        if (name !== currentAnimationName && action?.isRunning()) {
          action.fadeOut(0.3);
        }
      });
    }
  }, [actions, currentAnimationName]);

  // Smooth blendshape transitions with proper timing
  useFrame((state, delta) => {
    if (!groupRef.current || !loadedModel) return;

    // Throttle updates to 30fps for performance
    const now = Date.now();
    if (now - lastUpdateTime.current < 33) return; // ~30fps
    lastUpdateTime.current = now;

    // Determine target shapes based on speaking state
    const targetShapes: Partial<BlendShapeMap> = { ...emotionShapes };
    
    // Initialize all ARKit shapes
    ARKitBlendshapeNamesList.forEach(key => {
      const shapeKey = key as BlendshapeKey;
      if (!targetShapes.hasOwnProperty(shapeKey)) {
        targetShapes[shapeKey] = 0;
      }
    });

    // Apply viseme or idle mouth shapes
    if (isSpeaking && visemeShapes && Object.keys(visemeShapes).length > 0) {
      // When speaking, use viseme shapes for mouth
      for (const key of ARKitBlendshapeNamesList) {
        const shapeKey = key as BlendshapeKey;
        if (VISEME_AUTHORITATIVE_SHAPES.has(shapeKey)) {
          targetShapes[shapeKey] = visemeShapes[shapeKey] || 0;
        }
      }
    } else {
      // When not speaking, use idle mouth shapes
      for (const key of ARKitBlendshapeNamesList) {
        const shapeKey = key as BlendshapeKey;
        if (VISEME_AUTHORITATIVE_SHAPES.has(shapeKey)) {
          targetShapes[shapeKey] = IDLE_MOUTH_SHAPES[shapeKey] || 0;
        }
      }
    }

    // Smooth transitions
    const smoothingFactor = isSpeaking ? 0.3 : 0.1; // Faster response when speaking
    
    ARKitBlendshapeNamesList.forEach((blendshapeName) => {
      const shapeKey = blendshapeName as BlendshapeKey;
      const targetValue = targetShapes[shapeKey] || 0;
      const currentValue = currentShapes.current[shapeKey] || 0;
      
      // Lerp to target value
      currentShapes.current[shapeKey] = THREE.MathUtils.lerp(
        currentValue,
        targetValue,
        smoothingFactor
      );
    });

    // Apply the smoothed shapes to the model
    groupRef.current.traverse((object) => {
      if (object instanceof THREE.SkinnedMesh && object.morphTargetDictionary && object.morphTargetInfluences) {
        ARKitBlendshapeNamesList.forEach((blendshapeName) => {
          const arkitKey = blendshapeName as BlendshapeKey;
          const index = object.morphTargetDictionary![arkitKey];
          if (index !== undefined) {
            const value = currentShapes.current[arkitKey] || 0;
            object.morphTargetInfluences![index] = value;
          }
        });
      }
    });
  });

  if (error) {
    return (
      <mesh position={position}>
        <boxGeometry args={[1, 2, 0.5]} />
        <meshStandardMaterial color="red" />
      </mesh>
    );
  }

  if (!loadedModel) {
    return (
      <mesh position={position}>
        <boxGeometry args={[1, 2, 0.5]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    );
  }

  const scaleArray = typeof scale === 'number' ? [scale, scale, scale] : scale;

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scaleArray as [number, number, number]}>
      <primitive object={loadedModel} />
    </group>
  );
}
