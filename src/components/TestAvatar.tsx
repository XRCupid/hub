import React, { useEffect, useRef, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAnimations } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
// import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'; // Uncomment if you plan to use Meshopt
import { GroupProps } from '@react-three/fiber';
import { GLTF } from 'three-stdlib';
import { BlendshapeKey, BlendShapeMap, ARKitBlendshapeNamesList } from '../types/blendshapes';

const VISEME_AUTHORITATIVE_SHAPES: Set<BlendshapeKey> = new Set([
  'jawOpen', 'mouthFunnel', 'mouthPucker', 'mouthClose',
  'mouthStretchLeft', 'mouthStretchRight',
  'mouthUpperUpLeft', 'mouthUpperUpRight',
  'mouthLowerDownLeft', 'mouthLowerDownRight',
  'jawLeft', 'jawRight', 'jawForward', 'tongueOut',
  'mouthRollUpper', 'mouthRollLower', // Often used in detailed speech animation
  'mouthShrugUpper', 'mouthShrugLower',
  // 'cheekPuff', // Consider if your visemes use this for plosives like 'p', 'b'
]);

// useGLTF.setup() was removed as it's not available in the current @react-three/drei version or typing.

console.log('[TestAvatar MODULE TOP] This module is definitely loading!');

// Log THREE instance at module level in TestAvatar.tsx
console.log('[TestAvatar MODULE] THREE object:', THREE);
console.log('[TestAvatar MODULE] THREE.REVISION:', THREE?.REVISION);
console.log('[TestAvatar MODULE] Is THREE.CanvasTexture available?:', !!THREE?.CanvasTexture);

// This interface helps in typing the result from useGLTF specifically for avatars
// It expects nodes to potentially be SkinnedMesh for blendshapes/animations
interface TestAvatarGLTF extends GLTF {
  nodes: {
    [key: string]: THREE.Mesh | THREE.SkinnedMesh | THREE.Group | THREE.Object3D;
    // Add specific known node names if applicable, e.g.:
    // Wolf3D_Avatar?: THREE.SkinnedMesh;
    // Head?: THREE.SkinnedMesh;
    // Teeth?: THREE.SkinnedMesh;
    // EyeLeft?: THREE.SkinnedMesh;
    // EyeRight?: THREE.SkinnedMesh;
  };
  materials: { [name: string]: THREE.Material };
  // animations are already part of GLTF type
}

export interface TestAvatarProps extends GroupProps {
  avatarUrl: string;
  animationClips?: THREE.AnimationClip[];
  currentAnimationName?: string;
  emotionShapes?: Partial<BlendShapeMap>;
  visemeShapes?: Partial<BlendShapeMap>;
  onModelLoaded?: (model: THREE.Group) => void;
  // position, scale, rotation are inherited from GroupProps
}

const TestAvatar: React.FC<TestAvatarProps> = (props) => {
  const {
    avatarUrl,
    animationClips = [],
    currentAnimationName,
    emotionShapes = {},
    visemeShapes = {},
    onModelLoaded,
    ...groupProps // Spread the rest of the GroupProps (like position, scale)
  } = props;

  const groupRef = useRef<THREE.Group>(null!);
  const [loadedModel, setLoadedModel] = React.useState<THREE.Group | null>(null);
  const [loadedAnimations, setLoadedAnimations] = React.useState<THREE.AnimationClip[]>([]);
  const { gl } = useThree(); // Get the WebGL renderer instance

  useEffect(() => {
    if (!avatarUrl || !gl) return; // Wait for gl to be available

    const loader = new GLTFLoader();

    // Initialize KTX2Loader with the renderer and transcoder path
    const ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath('/basis/'); // Ensure /basis/ path is correct and files are in public/basis/
    ktx2Loader.detectSupport(gl); // Crucial step: make KTX2Loader aware of the renderer

    const dracoLoader = new DRACOLoader().setDecoderPath('/draco/gltf/'); // Ensure /draco/gltf/ path is correct and files are in public/draco/gltf/
    
    loader.setKTX2Loader(ktx2Loader);
    loader.setDRACOLoader(dracoLoader);
    loader.setMeshoptDecoder(MeshoptDecoder); // Add MeshoptDecoder

    loader.load(
      avatarUrl,
      (gltf) => {
        console.log('[TestAvatar] Model loaded successfully:', gltf);
        
        // Log morph target dictionary for skinned meshes
        gltf.scene.traverse((object) => {
          if (object instanceof THREE.SkinnedMesh) {
            const mesh = object as THREE.SkinnedMesh;
            if (mesh.morphTargetDictionary && Object.keys(mesh.morphTargetDictionary).length > 0) {
              console.log('[TestAvatar] Model morphTargetDictionary for mesh:', mesh.name, JSON.stringify(mesh.morphTargetDictionary));
            } else if (mesh.morphTargetDictionary) {
              console.log('[TestAvatar] Model morphTargetDictionary for mesh:', mesh.name, 'is empty or undefined.');
            }
          }
        });

        setLoadedModel(gltf.scene);
        setLoadedAnimations(gltf.animations || []);
        if (onModelLoaded) {
          onModelLoaded(gltf.scene);
        }
      },
      undefined, // onProgress callback (optional)
      (error: any) => { // Changed to any for now to bypass strict typing issues
        console.error('[TestAvatar] Error loading GLTF model:', error, error.message);
        // Check if the error is related to KTX2 loading specifically
        if (error.message && (error.message.toLowerCase().includes('ktx2') || error.message.toLowerCase().includes('texture'))) {
            console.error('[TestAvatar] KTX2/Texture specific loading error. Check transcoder path (public/basis/), files, and WebGL2 context.');
        }
      }
    );

    // Cleanup function for KTX2Loader and DRACOLoader
    return () => {
      ktx2Loader.dispose();
      dracoLoader.dispose();
      // MeshoptDecoder does not have a dispose method in the same way as KTX2Loader/DRACOLoader
    };
  }, [avatarUrl, onModelLoaded, gl]); // Add gl to dependency array

  // Combine GLTF animations (now from state) with explicitly passed animationClips
  const allAnims = useMemo(() => {
    let combined = [...(loadedAnimations || [])]; // Start with animations from loaded model
    if (animationClips) {
      combined = [...combined, ...animationClips];
    }
    return combined;
  }, [loadedAnimations, animationClips]);

  // Note: useAnimations target (groupRef) might not be ready when loadedModel changes initially.
  // We need to ensure groupRef.current is populated with loadedModel before useAnimations can effectively target it.
  // This is handled by rendering primitive object={loadedModel} inside the groupRef.
  const { actions, mixer } = useAnimations(allAnims, groupRef);

  useEffect(() => {
    if (loadedModel && groupRef.current) {
      // TODO: Ensure the scene is properly scaled and positioned if needed.
      // e.g., scene.scale.set(0.01, 0.01, 0.01); for RPM avatars
      if (onModelLoaded) {
        onModelLoaded(loadedModel as THREE.Group);
      }
    }
  }, [loadedModel, onModelLoaded]);

  useEffect(() => {
    // Animation control logic
    if (currentAnimationName && actions[currentAnimationName]) {
      const currentAction = actions[currentAnimationName];
      if (currentAction) {
        // Fade in the new action
        currentAction.reset().fadeIn(0.3).play();
        // Fade out other actions
        Object.values(actions).forEach(action => {
          if (action && action !== currentAction && action.isRunning()) {
            action.fadeOut(0.3);
          }
        });
      }
    } else if (actions && Object.keys(actions).length > 0 && !currentAnimationName) {
      // Default: play the first animation if no currentAnimationName is specified
      // Or, ensure a default idle animation is played.
      // This part might need refinement based on desired default behavior.
      const firstAction = Object.values(actions)[0];
      if (firstAction) {
        firstAction.reset().fadeIn(0.3).play();
      }
    }

    return () => {
      // Cleanup: fade out all actions when component unmounts or currentAnimationName changes
      if (actions) {
        Object.values(actions).forEach(action => {
          if (action && action.isRunning()) {
            action.fadeOut(0.3);
          }
        });
      }
    };
  }, [actions, currentAnimationName, mixer]);

  useEffect(() => {
    // Blendshape (morph target) update logic
    if (emotionShapes && Object.keys(emotionShapes).length > 0) {
      // console.log('[TestAvatar] Received emotionShapes prop:', JSON.stringify(emotionShapes));
    } else if (emotionShapes) {
      // console.log('[TestAvatar] Received emotionShapes prop: (empty or all zero values)');
    }
    if (visemeShapes && Object.keys(visemeShapes).length > 0) {
      // console.log('[TestAvatar] Received visemeShapes prop:', JSON.stringify(visemeShapes));
    } else if (visemeShapes) {
      // console.log('[TestAvatar] Received visemeShapes prop: (empty or all zero values)');
    }

    if (!groupRef.current || !loadedModel) return;

    console.log('[TestAvatar useEffect] emotionShapes received:', JSON.stringify(emotionShapes));

    // Start with all emotional expressions (which include blinks)
    const finalCombinedShapes: Partial<BlendShapeMap> = { ...emotionShapes };

    // Let visemes override only their authoritative shapes
    // Ensure all ARKit shapes are initialized if not present in emotionShapes
    ARKitBlendshapeNamesList.forEach(key => {
      const shapeKey = key as BlendshapeKey;
      if (!finalCombinedShapes.hasOwnProperty(shapeKey)) {
        finalCombinedShapes[shapeKey] = 0;
      }
    });

    if (visemeShapes && Object.keys(visemeShapes).length > 0) {
      for (const key of ARKitBlendshapeNamesList) {
        const shapeKey = key as BlendshapeKey;
        if (VISEME_AUTHORITATIVE_SHAPES.has(shapeKey)) {
          // If it's a viseme-controlled shape, take the viseme value (even if 0 or undefined)
          finalCombinedShapes[shapeKey] = visemeShapes[shapeKey] || 0;
        }
        // For non-viseme-authoritative shapes, the value from emotionShapes (or its default 0) is kept.
      }
    }
    console.log('[TestAvatar useEffect] Applying finalCombinedShapes:', JSON.stringify(finalCombinedShapes));

    groupRef.current.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.SkinnedMesh && object.morphTargetDictionary && object.morphTargetInfluences) {
        ARKitBlendshapeNamesList.forEach((blendshapeName) => {
          const arkitKey = blendshapeName as BlendshapeKey;
          const index = object.morphTargetDictionary![arkitKey];
          if (index !== undefined) {
            const value = finalCombinedShapes[arkitKey] || 0;
            object.morphTargetInfluences![index] = value;

            // if (arkitKey === 'jawOpen' && value > 0.01) {
            //   console.log(`[TestAvatar] Applying jawOpen: ${value} (from finalCombinedShapes)`);
            // }
          } else {
            // This case should ideally not happen if ARKitBlendshapeNamesList is accurate
            // and the model has all these blendshapes.
            // If it does, it means the model is missing an expected ARKit blendshape.
          }
        });
      }
    });
  }, [emotionShapes, visemeShapes, loadedModel, groupRef]);

  if (!loadedModel) return null; // Or a loading fallback

  // Using primitive and forwarding ref for useAnimations and direct manipulation
  return <primitive ref={groupRef} object={loadedModel} {...groupProps} />;
};

TestAvatar.displayName = 'TestAvatar';

export default TestAvatar;
