import React, { useRef, useState, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ConversationAvatarProps {
  avatarUrl: string;
  position?: [number, number, number];
  scale?: number;
  isSpeaking?: boolean;
  audioContext?: AudioContext | null;
  audioData?: Uint8Array;
}

export const ConversationAvatar: React.FC<ConversationAvatarProps> = ({
  avatarUrl,
  position = [0, 0, 0],
  scale = 1,
  isSpeaking = false,
  audioContext,
  audioData
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.SkinnedMesh | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const pendingActionRef = useRef<THREE.AnimationAction | null>(null);
  const blinkTimer = useRef(0);
  const mouthOpenRef = useRef(0);
  const previousAudioRef = useRef(0);
  const [animationsLoaded, setAnimationsLoaded] = useState(false);
  const lastSpeakingState = useRef(isSpeaking);
  
  // Load avatar and its animations
  const { scene } = useGLTF(avatarUrl);
  
  // Load animation files with proper error handling
  const idleGltf = useGLTF('/animations/feminine/idle/F_Standing_Idle_001.glb');
  const talkGltf = useGLTF('/animations/feminine/talk/F_Talking_Variations_001.glb');
  
  // Animation files are correctly labeled - no need to swap
  const SWAP_ANIMATIONS = false; // Set to false - files are correct
  
  // Debug animation files
  useEffect(() => {
    console.log('=== ANIMATION FILES DEBUG ===');
    console.log('Idle animations:', idleGltf.animations.map(a => a.name));
    console.log('Talk animations:', talkGltf.animations.map(a => a.name));
    console.log('SWAP_ANIMATIONS flag:', SWAP_ANIMATIONS);
    console.log('============================');
  }, [idleGltf.animations, talkGltf.animations]);
  
  // Find mesh with morph targets
  useEffect(() => {
    if (scene) {
      scene.traverse((child: any) => {
        if (child.isMesh && child.morphTargetInfluences && child.morphTargetDictionary) {
          meshRef.current = child;
          console.log('Found mesh with morph targets:', child.name);
          console.log('Available morph targets:', Object.keys(child.morphTargetDictionary));
        }
      });
    }
  }, [scene]);
  
  // Initialize animation mixer once
  useEffect(() => {
    if (!scene || mixerRef.current) return;
    
    mixerRef.current = new THREE.AnimationMixer(scene);
    
    // Start with idle animation immediately to prevent T-pose
    // Apply swap if needed
    const initialAnimations = SWAP_ANIMATIONS ? talkGltf.animations : idleGltf.animations;
    
    if (initialAnimations && initialAnimations.length > 0) {
      const idleClip = initialAnimations[0];
      const idleAction = mixerRef.current.clipAction(idleClip);
      
      idleAction.reset();
      idleAction.setLoop(THREE.LoopRepeat, Infinity);
      idleAction.timeScale = 0.8;
      idleAction.play();
      
      currentActionRef.current = idleAction;
      lastSpeakingState.current = false;
      setAnimationsLoaded(true);
    }
  }, [scene, idleGltf.animations, talkGltf.animations]);
  
  // Handle animation transitions based on speaking state
  useEffect(() => {
    if (!mixerRef.current || !animationsLoaded) return;
    if (isSpeaking === lastSpeakingState.current) return;
    
    console.log(`=== ANIMATION STATE CHANGE ===`);
    console.log(`isSpeaking changed from ${lastSpeakingState.current} to ${isSpeaking}`);
    
    const mixer = mixerRef.current;
    // IMPORTANT: This might be the issue - let's verify the logic
    // When isSpeaking is TRUE, we should play TALK animations
    // When isSpeaking is FALSE, we should play IDLE animations
    
    // Apply swap if needed (in case files are mislabeled)
    const targetAnimations = SWAP_ANIMATIONS 
      ? (isSpeaking ? idleGltf.animations : talkGltf.animations)
      : (isSpeaking ? talkGltf.animations : idleGltf.animations);
    
    console.log(`Selecting animations from: ${isSpeaking ? (SWAP_ANIMATIONS ? 'idleGltf (swapped)' : 'talkGltf') : (SWAP_ANIMATIONS ? 'talkGltf (swapped)' : 'idleGltf')}`);
    
    if (targetAnimations && targetAnimations.length > 0) {
      // Find the best animation clip
      const clip = targetAnimations.find(anim => {
        const animName = anim.name.toLowerCase();
        if (isSpeaking) {
          // When speaking, look for talk/speak animations
          return animName.includes('talk') || animName.includes('speak') || animName.includes('talking');
        } else {
          // When NOT speaking, look for idle animations
          return animName.includes('idle') || animName.includes('stand') || animName.includes('breathing');
        }
      }) || targetAnimations[0];
      
      console.log(`Selected animation: "${clip.name}" from ${isSpeaking ? 'talk' : 'idle'} set`);
      console.log(`Animation search: looking for ${isSpeaking ? 'talk/speak' : 'idle/stand'} in name`);
      console.log('==============================');
      
      // Create new action
      const newAction = mixer.clipAction(clip);
      newAction.reset();
      newAction.setLoop(THREE.LoopRepeat, Infinity);
      newAction.timeScale = isSpeaking ? 1.0 : 0.8;
      
      // Smooth crossfade between animations
      if (currentActionRef.current) {
        newAction.fadeIn(0.3);
        currentActionRef.current.fadeOut(0.3);
        
        // Clean up old action after fade completes
        pendingActionRef.current = currentActionRef.current;
        setTimeout(() => {
          if (pendingActionRef.current) {
            pendingActionRef.current.stop();
            pendingActionRef.current = null;
          }
        }, 300);
      } else {
        // If no current action, start immediately
        newAction.fadeIn(0.1);
      }
      
      newAction.play();
      currentActionRef.current = newAction;
    }
    
    lastSpeakingState.current = isSpeaking;
  }, [isSpeaking, idleGltf.animations, talkGltf.animations, animationsLoaded]);
  
  // Animate lip sync and facial expressions
  useFrame((state, delta) => {
    if (!scene) return;
    
    const time = state.clock.getElapsedTime();
    
    // Update animation mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
    
    // Debug audio data
    if (isSpeaking && audioData && audioData.length > 0) {
      const maxValue = Math.max(...audioData);
      if (maxValue > 0) {
        console.log('Audio data present, max value:', maxValue);
      }
    }
    
    // Natural blinking (always active)
    const blinkTarget = Math.sin(time * 3) > 0.95 ? 1 : 0;
    const blinkSpeed = 0.3;
    
    scene.traverse((child: any) => {
      if (child.isMesh && child.morphTargetInfluences && child.morphTargetDictionary) {
        const morphDict = child.morphTargetDictionary;
        const morphInfluences = child.morphTargetInfluences;
        
        // Debug: Log once per mesh
        if (!child._morphDebugLogged) {
          console.log(`Mesh ${child.name} morph targets:`, Object.keys(morphDict));
          child._morphDebugLogged = true;
        }
        
        // Always blink naturally
        const eyeBlinkNames = [
          'eyeBlinkLeft', 'eyeBlink_L', 'blink_L', 'Blink_Left',
          'eyeBlinkRight', 'eyeBlink_R', 'blink_R', 'Blink_Right',
          'eyeBlink', 'EyeBlink', 'blink', 'Blink',
          'eyesClosed', 'EyesClosed', 'eyes_closed',
          'eyeBlinkLeft01', 'eyeBlinkRight01', 'eyeBlinkLeft02', 'eyeBlinkRight02',
          'eyeBlinkLeft03', 'eyeBlinkRight03', 'eyeBlinkLeft04', 'eyeBlinkRight04',
          'eyeBlinkLeft05', 'eyeBlinkRight05', 'eyeBlinkLeft06', 'eyeBlinkRight06',
          'eyeBlinkLeft07', 'eyeBlinkRight07', 'eyeBlinkLeft08', 'eyeBlinkRight08',
          'eyeBlinkLeft09', 'eyeBlinkRight09', 'eyeBlinkLeft10', 'eyeBlinkRight10',
          'eyeBlinkLeft11', 'eyeBlinkRight11', 'eyeBlinkLeft12', 'eyeBlinkRight12',
          'eyeBlinkLeft13', 'eyeBlinkRight13', 'eyeBlinkLeft14', 'eyeBlinkRight14',
          'eyeBlinkLeft15', 'eyeBlinkRight15', 'eyeBlinkLeft16', 'eyeBlinkRight16',
          'eyeBlinkLeft17', 'eyeBlinkRight17', 'eyeBlinkLeft18', 'eyeBlinkRight18',
          'eyeBlinkLeft19', 'eyeBlinkRight19', 'eyeBlinkLeft20', 'eyeBlinkRight20',
        ];
        eyeBlinkNames.forEach(blinkName => {
          if (morphDict[blinkName] !== undefined) {
            const index = morphDict[blinkName];
            morphInfluences[index] = THREE.MathUtils.lerp(
              morphInfluences[index],
              blinkTarget,
              blinkSpeed
            );
          }
        });
        
        // Lip sync only when speaking and we have audio data
        if (isSpeaking && audioData && audioData.length > 0) {
          // Get RMS (Root Mean Square) for overall audio energy
          let sum = 0;
          for (let i = 0; i < audioData.length; i++) {
            sum += audioData[i] * audioData[i];
          }
          const rms = Math.sqrt(sum / audioData.length) / 255;
          
          // Smooth the audio energy
          const smoothedEnergy = THREE.MathUtils.lerp(
            previousAudioRef.current,
            rms,
            0.3
          );
          previousAudioRef.current = smoothedEnergy;
          
          // Calculate mouth movements with more natural amplitude
          const mouthOpen = smoothedEnergy * 1.2; // Reduced from 2.5 for more natural mouth movement
          const mouthWide = smoothedEnergy * 0.8; // Reduced from 1.8
          const mouthPucker = Math.sin(time * 8) * smoothedEnergy * 0.2; // Reduced from 0.3
          
          // Try all possible mouth morph target names
          const mouthOpenNames = [
            'jawOpen', 'jaw_open', 'mouthOpen', 'mouth_open', 'MouthOpen',
            'JawOpen', 'Jaw_Open', 'mouth', 'Mouth', 'jaw', 'Jaw',
            'viseme_aa', 'viseme_AA', 'aa', 'AA', 'A',
            'viseme_O', 'viseme_o', 'O', 'o',
            'mouthOpenViseme', 'mouthOpenAmount'
          ];
          
          const mouthSmileNames = [
            'mouthSmileLeft', 'mouthSmile_L', 'smile_L', 'MouthSmile_L',
            'mouthSmileRight', 'mouthSmile_R', 'smile_R', 'MouthSmile_R',
            'mouthSmile', 'MouthSmile', 'smile', 'Smile',
            'mouthCornerPullLeft', 'mouthCornerPullRight',
            'viseme_CH', 'viseme_ch', 'CH', 'ch'
          ];
          
          const eyeBlinkNames = [
            'eyeBlinkLeft', 'eyeBlink_L', 'blink_L', 'Blink_Left',
            'eyeBlinkRight', 'eyeBlink_R', 'blink_R', 'Blink_Right',
            'eyeBlink', 'EyeBlink', 'blink', 'Blink',
            'eyesClosed', 'EyesClosed', 'eyes_closed'
          ];
          
          const browNames = [
            'browInnerUp', 'brow_inner_up', 'BrowInnerUp',
            'browOuterUpLeft', 'browOuterUpRight',
            'browRaiseLeft', 'browRaiseRight',
            'browInnerRaise', 'BrowInnerRaise'
          ];
          
          // Debug log available morph targets once
          if (!child._availableMorphsLogged) {
            const availableMorphs = Object.keys(morphDict);
            console.log('=== MORPH TARGET DEBUG ===');
            console.log('Mesh name:', child.name);
            console.log('Available morph targets:', availableMorphs);
            console.log('Total morph count:', availableMorphs.length);
            
            // Check which targets we can use
            const foundMouthOpen = mouthOpenNames.filter(name => morphDict[name] !== undefined);
            const foundMouthSmile = mouthSmileNames.filter(name => morphDict[name] !== undefined);
            const foundEyeBlink = eyeBlinkNames.filter(name => morphDict[name] !== undefined);
            const foundBrow = browNames.filter(name => morphDict[name] !== undefined);
            
            console.log('Found mouth open morphs:', foundMouthOpen);
            console.log('Found mouth smile morphs:', foundMouthSmile);
            console.log('Found eye blink morphs:', foundEyeBlink);
            console.log('Found brow morphs:', foundBrow);
            console.log('========================');
            
            child._availableMorphsLogged = true;
          }
          
          // Apply jaw/mouth open - try all possible names
          let mouthOpenApplied = false;
          mouthOpenNames.forEach(morphName => {
            if (morphDict[morphName] !== undefined && !mouthOpenApplied) {
              const index = morphDict[morphName];
              morphInfluences[index] = THREE.MathUtils.lerp(
                morphInfluences[index],
                mouthOpen,
                0.4
              );
              mouthOpenApplied = true;
              
              // Log once when we're actually applying morph
              if (!child._morphApplicationLogged && mouthOpen > 0.1) {
                console.log(`Applying mouth open morph "${morphName}" with value:`, mouthOpen);
                child._morphApplicationLogged = true;
              }
            }
          });
          
          // Apply mouth wide/smile
          mouthSmileNames.forEach(morphName => {
            if (morphDict[morphName] !== undefined) {
              const index = morphDict[morphName];
              morphInfluences[index] = THREE.MathUtils.lerp(
                morphInfluences[index],
                mouthWide * 0.5,
                0.3
              );
            }
          });
          
          // Add some expression based on audio intensity
          if (smoothedEnergy > 0.3) {
            // Eyebrow raise when loud
            browNames.forEach(morphName => {
              if (morphDict[morphName] !== undefined) {
                const index = morphDict[morphName];
                morphInfluences[index] = THREE.MathUtils.lerp(
                  morphInfluences[index],
                  (smoothedEnergy - 0.3) * 0.5,
                  0.2
                );
              }
            });
          }
        } else {
          // When not speaking, reset mouth to neutral
          const mouthMorphs = [
            'jawOpen', 'jaw_open', 'mouthOpen', 'mouth_open', 'MouthOpen',
            'mouthSmileLeft', 'mouthSmile_L', 'smile_L', 'MouthSmile_L',
            'mouthSmileRight', 'mouthSmile_R', 'smile_R', 'MouthSmile_R',
            'mouthPucker', 'mouth_pucker', 'pucker', 'MouthPucker'
          ];
          
          mouthMorphs.forEach(morphName => {
            if (morphDict[morphName] !== undefined) {
              const index = morphDict[morphName];
              morphInfluences[index] = THREE.MathUtils.lerp(
                morphInfluences[index],
                0,
                0.1
              );
            }
          });
        }
      }
    });
    
    // Subtle head movement for realism
    if (scene) {
      const headRotation = Math.sin(time * 0.5) * 0.02;
      const headNod = Math.sin(time * 0.3) * 0.01;
      scene.rotation.y = headRotation;
      scene.rotation.x = headNod;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <primitive object={scene} />
    </group>
  );
};

// Preload animations
useGLTF.preload('/animations/feminine/idle/F_Standing_Idle_001.glb');
useGLTF.preload('/animations/feminine/talk/F_Talking_Variations_001.glb');
