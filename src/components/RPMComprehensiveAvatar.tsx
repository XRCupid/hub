import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAnimations } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import type { BlendShapeMap, BlendshapeKey } from '../types/blendshapes';
import { ARKitBlendshapeNamesList } from '../types/blendshapes';

interface RPMComprehensiveAvatarProps {
  avatarId: string;
  emotionShapes?: Partial<BlendShapeMap>;
  visemeShapes?: Partial<BlendShapeMap>;
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

export function RPMComprehensiveAvatar({
  avatarId,
  emotionShapes = {},
  visemeShapes = {},
  position = [0, -1.2, 0],
  scale = 1,
  rotation = [0, 0, 0],
  animationClips = [],
  currentAnimationName,
  onModelLoaded
}: RPMComprehensiveAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { gl } = useThree();
  const [loadedModel, setLoadedModel] = useState<THREE.Group | null>(null);
  const [loadedAnimations, setLoadedAnimations] = useState<THREE.AnimationClip[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Configure avatar URL with proper parameters
  const avatarUrl = useMemo(() => {
    const params = new URLSearchParams({
      morphTargets: 'ARKit,Oculus Visemes',
      textureAtlas: '1024',
      pose: 'T',
      lod: '0',
      useHands: 'true',
      meshCompression: 'false'
    });
    return `https://models.readyplayer.me/${avatarId}.glb?${params.toString()}`;
  }, [avatarId]);

  // Load the avatar with proper decoders
  useEffect(() => {
    const gltfLoader = new GLTFLoader();
    
    // Configure KTX2 loader
    const ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath('/basis/');
    ktx2Loader.detectSupport(gl);
    gltfLoader.setKTX2Loader(ktx2Loader);

    // Configure DRACO loader
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    gltfLoader.setDRACOLoader(dracoLoader);

    // Configure Meshopt decoder
    gltfLoader.setMeshoptDecoder(MeshoptDecoder);

    console.log('[RPMComprehensiveAvatar] Loading avatar from:', avatarUrl);

    gltfLoader.load(
      avatarUrl,
      (gltf) => {
        console.log('[RPMComprehensiveAvatar] Successfully loaded avatar');
        
        // Log morph targets for debugging
        gltf.scene.traverse((object) => {
          if (object instanceof THREE.SkinnedMesh) {
            console.log('[RPMComprehensiveAvatar] Found SkinnedMesh:', object.name);
            if (object.morphTargetDictionary) {
              console.log('[RPMComprehensiveAvatar] Morph targets:', Object.keys(object.morphTargetDictionary));
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
        console.log('[RPMComprehensiveAvatar] Loading progress:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
      },
      (error) => {
        console.error('[RPMComprehensiveAvatar] Error loading avatar:', error);
        setError((error as Error).message || 'Failed to load avatar');
      }
    );

    // Cleanup
    return () => {
      ktx2Loader.dispose();
      dracoLoader.dispose();
    };
  }, [avatarUrl, gl, onModelLoaded]);

  // Combine animations
  const allAnimations = useMemo(() => {
    return [...loadedAnimations, ...animationClips];
  }, [loadedAnimations, animationClips]);

  // Setup animations
  const { actions, mixer } = useAnimations(allAnimations, groupRef);

  // Handle animation changes
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

  // Apply blend shapes with proper viseme/emotion blending
  useEffect(() => {
    if (!groupRef.current || !loadedModel) return;

    // Start with emotion shapes
    const finalCombinedShapes: Partial<BlendShapeMap> = { ...emotionShapes };

    // Initialize all ARKit shapes
    ARKitBlendshapeNamesList.forEach(key => {
      const shapeKey = key as BlendshapeKey;
      if (!finalCombinedShapes.hasOwnProperty(shapeKey)) {
        finalCombinedShapes[shapeKey] = 0;
      }
    });

    // Let visemes override their authoritative shapes
    if (visemeShapes && Object.keys(visemeShapes).length > 0) {
      for (const key of ARKitBlendshapeNamesList) {
        const shapeKey = key as BlendshapeKey;
        if (VISEME_AUTHORITATIVE_SHAPES.has(shapeKey)) {
          finalCombinedShapes[shapeKey] = visemeShapes[shapeKey] || 0;
        }
      }
    }

    // Apply the combined shapes
    groupRef.current.traverse((object) => {
      if (object instanceof THREE.SkinnedMesh && object.morphTargetDictionary && object.morphTargetInfluences) {
        ARKitBlendshapeNamesList.forEach((blendshapeName) => {
          const arkitKey = blendshapeName as BlendshapeKey;
          const index = object.morphTargetDictionary![arkitKey];
          if (index !== undefined) {
            const value = finalCombinedShapes[arkitKey] || 0;
            object.morphTargetInfluences![index] = value;
          }
        });
      }
    });
  }, [emotionShapes, visemeShapes, loadedModel]);

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
