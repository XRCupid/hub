import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Avatar } from '@readyplayerme/visage';
// Removed TalkingHeadAvatar import



const EMOTION_BLENDSHAPES = {
  neutral: {
    eyeBlinkLeft: 0.1,
    eyeBlinkRight: 0.1,
    browInnerUp: 0,
    browDownLeft: 0,
    browDownRight: 0,
    jawOpen: 0,
    mouthSmileLeft: 0,
    mouthSmileRight: 0,
    mouthFrownLeft: 0,
    mouthFrownRight: 0,
    cheekPuffLeft: 0,
    cheekPuffRight: 0
  },
  happy: { 
    eyeBlinkLeft: 0.05,
    eyeBlinkRight: 0.05,
    mouthSmileLeft: 0.8, 
    mouthSmileRight: 0.8,
    browInnerUp: 0.4,
    jawOpen: 0.2,
    cheekPuffLeft: 0.3,
    cheekPuffRight: 0.3
  },
  sad: { 
    eyeBlinkLeft: 0.5,
    eyeBlinkRight: 0.5,
    mouthFrownLeft: 0.7, 
    mouthFrownRight: 0.7,
    browDownLeft: 0.6,
    browDownRight: 0.6,
    jawOpen: 0.3,
    cheekPuffLeft: 0.1,
    cheekPuffRight: 0.1
  },
  surprised: { 
    eyeWideLeft: 0.7,
    eyeWideRight: 0.7,
    jawOpen: 0.7,
    browInnerUp: 0.8,
    mouthOpen: 0.5,
    cheekPuffLeft: 0.2,
    cheekPuffRight: 0.2
  },
  angry: {
    browDownLeft: 0.8,
    browDownRight: 0.8,
    mouthPressLeft: 0.6,
    mouthPressRight: 0.6,
    eyeBlinkLeft: 0.4,
    eyeBlinkRight: 0.4,
    jawOpen: 0.3,
    mouthFrownLeft: 0.5,
    mouthFrownRight: 0.5
  }
};

const SimulationAvatar = ({ 
  type = 'coach',
  avatarUrl = 'https://models.readyplayer.me/681d6cd903879b2f11528470.glb',
  ttsApiKey = null,
  gazeWander = false, // NEW: enable subtle randomized gaze
  textToSpeak = '' // NEW: if provided, avatar will speak this text
}) => {
  console.log('[DEBUG] SimulationAvatar mounted');
  const [emotion, setEmotion] = useState('neutral');
  const [blendShapes, setBlendShapes] = useState({});
  const audioContextRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef(null); // Track the current utterance for cleanup

  // --- Speech synthesis effect ---
  useEffect(() => {
    if (!textToSpeak || typeof window === 'undefined' || !window.speechSynthesis) return;
    // Cancel any previous utterance
    if (utteranceRef.current) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    }
    const utter = new window.SpeechSynthesisUtterance(textToSpeak);
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
      }
    };
  }, [textToSpeak]);
  const avatarRef = useRef(null);
  const morphMeshRef = useRef(null); // Ref to mesh with morph targets

  // --- Gaze wandering state ---
  const [gazeTarget, setGazeTarget] = useState({
    horizontal: 0, // -1 (left) to 1 (right)
    vertical: 0    // -1 (down) to 1 (up)
  });
  const gazeCurrent = useRef({ horizontal: 0, vertical: 0 });
  const gazeTimeout = useRef(null);

  // Helper: Pick a new random gaze target (subtle wandering)
  function pickRandomGazeTarget() {
    // Small range: e.g., -0.2 to 0.2 for both axes
    return {
      horizontal: (Math.random() - 0.5) * 0.4, // -0.2 to +0.2
      vertical: (Math.random() - 0.5) * 0.2   // -0.1 to +0.1
    };
  }

  // Gaze wandering effect
  useEffect(() => {
    if (!gazeWander) return;
    let active = true;
    function loop() {
      if (!active) return;
      setGazeTarget(pickRandomGazeTarget());
      gazeTimeout.current = setTimeout(loop, 1000 + Math.random() * 1000); // 1–2s
    }
    loop();
    return () => {
      active = false;
      if (gazeTimeout.current) clearTimeout(gazeTimeout.current);
    };
  }, [gazeWander]);

  // --- Procedural Speaking Animation & Blinking ---
  useEffect(() => {
    let blinkTimeout;
    let blinkActive = false;
    let speakingAnimationFrame;
    let blinkValue = 0;
    let blinkDirection = 1; // 1 = closing, -1 = opening
    let jawPhase = Math.random() * Math.PI * 2;

    function getEmotionBlendShapes() {
      return EMOTION_BLENDSHAPES[emotion] || EMOTION_BLENDSHAPES.neutral;
    }

    function animateBlink() {
      // Animate blink up and down (0 to 1 and back)
      blinkValue += blinkDirection * 0.2;
      if (blinkValue >= 1) {
        blinkValue = 1;
        blinkDirection = -1;
      } else if (blinkValue <= 0) {
        blinkValue = 0;
        blinkDirection = 1;
        blinkActive = false;
        scheduleNextBlink();
        return;
      }
      updateBlendShapes();
      blinkTimeout = setTimeout(animateBlink, 40);
    }

    function scheduleNextBlink() {
      // Blink every 2.5–5 seconds
      const next = 2500 + Math.random() * 2500;
      blinkTimeout = setTimeout(() => {
        blinkActive = true;
        blinkDirection = 1;
        animateBlink();
      }, next);
    }

    function updateBlendShapes() {
      // Amplify emotion blendshapes for visibility
      const rawBase = getEmotionBlendShapes();
      const base = {};
      for (const k in rawBase) {
        // Amplify all blendshapes except blinks/jaw (which are handled separately)
        if (k.startsWith('mouth') || k.startsWith('brow') || k.startsWith('cheek') || k.startsWith('eye') || k.startsWith('nose')) {
          base[k] = Math.min(1.0, (rawBase[k] || 0) * 3.0);
        } else {
          base[k] = rawBase[k];
        }
      }
      // Animate jawOpen if speaking
      let jawOpen = base.jawOpen || 0;
      if (isSpeaking) {
        // Animate jaw with a sine wave (fast if speaking)
        const now = performance.now() / 1000;
        jawOpen = 0.3 + 0.2 * Math.abs(Math.sin(now * 6 + jawPhase));
      }
      // Animate blink
      const eyeBlinkLeft = blinkActive ? blinkValue : base.eyeBlinkLeft || 0;
      const eyeBlinkRight = blinkActive ? blinkValue : base.eyeBlinkRight || 0;

      // --- Gaze wandering logic ---
      let eyeLookInLeft = base.eyeLookInLeft || 0;
      let eyeLookOutLeft = base.eyeLookOutLeft || 0;
      let eyeLookUpLeft = base.eyeLookUpLeft || 0;
      let eyeLookDownLeft = base.eyeLookDownLeft || 0;
      let eyeLookInRight = base.eyeLookInRight || 0;
      let eyeLookOutRight = base.eyeLookOutRight || 0;
      let eyeLookUpRight = base.eyeLookUpRight || 0;
      let eyeLookDownRight = base.eyeLookDownRight || 0;

      if (gazeWander) {
        // Smoothly interpolate current gaze toward target
        const interp = (from, to, amt) => from + (to - from) * amt;
        gazeCurrent.current.horizontal = interp(gazeCurrent.current.horizontal, gazeTarget.horizontal, 0.07);
        gazeCurrent.current.vertical = interp(gazeCurrent.current.vertical, gazeTarget.vertical, 0.07);
        // Map horizontal: negative = left, positive = right
        // Map vertical: negative = down, positive = up
        // ARKit: eyeLookIn = toward nose, eyeLookOut = away from nose
        eyeLookInLeft = Math.max(0, -gazeCurrent.current.horizontal);
        eyeLookOutLeft = Math.max(0, gazeCurrent.current.horizontal);
        eyeLookInRight = Math.max(0, gazeCurrent.current.horizontal);
        eyeLookOutRight = Math.max(0, -gazeCurrent.current.horizontal);
        eyeLookUpLeft = Math.max(0, gazeCurrent.current.vertical);
        eyeLookDownLeft = Math.max(0, -gazeCurrent.current.vertical);
        eyeLookUpRight = Math.max(0, gazeCurrent.current.vertical);
        eyeLookDownRight = Math.max(0, -gazeCurrent.current.vertical);
      }

      const finalBlendShapes = {
        ...base,
        jawOpen,
        eyeBlinkLeft,
        eyeBlinkRight,
        eyeLookInLeft,
        eyeLookOutLeft,
        eyeLookUpLeft,
        eyeLookDownLeft,
        eyeLookInRight,
        eyeLookOutRight,
        eyeLookUpRight,
        eyeLookDownRight
      };
      console.log('[EMOTION DEBUG] Amplified blendShapes:', finalBlendShapes);
      setBlendShapes(finalBlendShapes);
    }

    // Speaking animation
    function speakingLoop() {
      updateBlendShapes();
      speakingAnimationFrame = requestAnimationFrame(speakingLoop);
    }

    // Start loops
    scheduleNextBlink();
    speakingLoop();

    return () => {
      clearTimeout(blinkTimeout);
      cancelAnimationFrame(speakingAnimationFrame);
    };
  }, [emotion, isSpeaking]);

  useEffect(() => {
    const initAudioAnalysis = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const checkAudioIntensity = () => {
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyser.getByteFrequencyData(dataArray);
          
          const volume = dataArray.reduce((a, b) => a + b) / bufferLength;
          setIsSpeaking(volume > 10);

          requestAnimationFrame(checkAudioIntensity);
        };

        checkAudioIntensity();
      } catch (error) {
        console.error('Audio capture error:', error);
      }
    };

    initAudioAnalysis();
  }, []);

  // --- useFrame: Reapply blendshapes every frame ---
  useFrame(() => {
    if (!morphMeshRef.current) {
      // Only log occasionally to avoid spam
      if (Math.random() < 0.01) console.warn('[DEBUG][useFrame] morphMeshRef.current is NOT set');
      return;
    }
    const dict = morphMeshRef.current.morphTargetDictionary;
    const influences = morphMeshRef.current.morphTargetInfluences;
    if (dict && influences && blendShapes) {
      // Log mesh name and blendshapes (occasionally)
      if (Math.random() < 0.01) {
        console.log('[DEBUG][useFrame] Updating mesh:', morphMeshRef.current.name);
        console.log('[DEBUG][useFrame] BlendShapes:', blendShapes);
        console.log('[DEBUG][useFrame] morphTargetInfluences (before):', [...influences]);
      }
      Object.entries(blendShapes).forEach(([name, value]) => {
        const idx = dict[name];
        if (idx !== undefined) {
          influences[idx] = value;
        }
      });
      if (Math.random() < 0.01) {
        console.log('[DEBUG][useFrame] morphTargetInfluences (after):', [...influences]);
      }
    }
  });

  return (
    <div className="simulation-avatar">
      {console.log('Rendering Avatar component')}
      <Avatar 
        ref={avatarRef}
        modelSrc={avatarUrl}
        blendShapes={blendShapes}
        environment="sunset"
        onModelLoaded={(model) => {
          console.log('Model loaded!', model);
          console.log('Avatar model loaded:', model);

          // --- BEGIN: Morph Target Name Logging ---
          if (model && model.scene) {
            model.scene.traverse((child) => {
              if (child.isMesh && child.morphTargetDictionary) {
                console.log('[DEBUG] Mesh:', child.name);
                console.log('[DEBUG] Morph Target Names:', Object.keys(child.morphTargetDictionary));
                // Store the first mesh with morph targets for useFrame updates
                if (!morphMeshRef.current) {
                  morphMeshRef.current = child;
                  console.log('[DEBUG][onModelLoaded] morphMeshRef set to:', child.name);
                }
              }
            });
          } else {
            console.warn('[DEBUG] Model or scene missing for morph target inspection');
          }
          // --- END: Morph Target Name Logging ---

          // Comprehensive blendshape debugging
          if (model && model.userData) {
            console.group('Avatar Model Debug');
            console.log('Model Source:', avatarUrl);
            
            // Check blendshapes
            if (model.userData.blendShapes) {
              console.log('Available Blendshape Names:', Object.keys(model.userData.blendShapes));
              console.log('Blendshape Values:', model.userData.blendShapes);
              
              // Warn if no blendshapes are being applied
              if (Object.keys(blendShapes).length === 0) {
                console.warn('WARNING: No blendshapes are being applied to the avatar!');
              }
              
              // Validate blendshape names against known ARKit names
              const arKitBlendshapes = [
                'eyeBlinkLeft', 'eyeBlinkRight', 
                'jawOpen', 
                'mouthSmileLeft', 'mouthSmileRight',
                'mouthFrownLeft', 'mouthFrownRight',
                'browInnerUp', 'browDownLeft', 'browDownRight',
                'cheekPuffLeft', 'cheekPuffRight'
              ];
              
              const missingBlendshapes = arKitBlendshapes.filter(
                name => !Object.keys(model.userData.blendShapes).includes(name)
              );
              
              if (missingBlendshapes.length > 0) {
                console.warn('Missing expected blendshapes:', missingBlendshapes);
              }
            } else {
              console.warn('No blendshapes found in model.userData');
            }
            
            // Check mesh and skeleton
            if (model.scene) {
              console.log('Scene Children:', model.scene.children.length);
              model.scene.traverse((child) => {
                if (child.isMesh) {
                  console.log('Mesh:', child.name);
                  
                  // Detailed morphtarget logging
                  if (child.morphTargetDictionary) {
                    console.log('Morphtarget Dictionary:', Object.keys(child.morphTargetDictionary));
                  }
                  if (child.morphTargetInfluences) {
                    console.log('Morphtarget Influences:', child.morphTargetInfluences);
                  }
                }
              });
            }
            
            console.groupEnd();
          } else {
            console.warn('Model or userData is undefined');
          }
        }}
      />
      
      <div className="avatar-controls">
        <select value={emotion} onChange={(e) => setEmotion(e.target.value)}>
          {Object.keys(EMOTION_BLENDSHAPES).map(em => (
            <option key={em} value={em}>{em}</option>
          ))}
        </select>
        <div style={{fontSize: '0.9em', color: '#888'}}>Gaze wander: {gazeWander ? 'On' : 'Off'}</div>
        
        <div className="avatar-info">
          <p>Character Type: {type}</p>
          <p>Speaking: {isSpeaking ? 'Yes' : 'No'}</p>
          <p>Current Emotion: {emotion}</p>
        </div>
      </div>
    </div>
  );
};

export default SimulationAvatar;
