import React, { useState, useEffect, useRef, useCallback } from 'react';
// Temporarily disabled hand pose detection to prevent conflicts with booth demo
// import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import { initializeTensorFlow } from '../tfjs-initializer';
import { confettiBurst } from '../utils/confetti';
import GesturePracticeViewDebugPanel from './GesturePracticeViewDebugPanel';
import './GesturePracticeView.css';

// TensorFlow.js is initialized by tfjs-initializer.js when it's imported.
// No need for GesturePracticeView.js to call initializeTensorFlow() at module scope.
// const tfjsInitPromise = initializeTensorFlow().then(success => {
//   if (!success) {
//     console.error('Failed to initialize TensorFlow.js');
//     throw new Error('Failed to initialize TensorFlow.js');
//   }
//   console.log('TensorFlow.js initialized successfully for GesturePracticeView');
//   return true;
// });

// Maps MediaPipe handedness to display handedness, accounting for mirrored video
function getDisplayHandedness(mpHandedness) {
  // If video is mirrored (scaleX(-1)), swap left/right for display
  if (mpHandedness === 'Left') return 'Right';
  if (mpHandedness === 'Right') return 'Left';
  return mpHandedness;
}

// --- Rhetoric Recitation Exercise Script ---
// Each step corresponds to one of the 8 gestures to practice
const performanceScript = [
  {
    title: "Emphasis Point",
    instructions: "Point emphatically as you say the line.",
    lines: ["This is the most important point!"],
    expectedGestureName: "Emphasis Point"
  },
  {
    title: "Open Hand",
    instructions: "Use an open hand to invite your audience.",
    lines: ["Everyone is welcome to participate."],
    expectedGestureName: "Open Hand"
  },
  {
    title: "Balance",
    instructions: "Balance both hands to show fairness.",
    lines: ["Let's weigh both sides of the argument."],
    expectedGestureName: "Balance"
  },
  {
    title: "Chin Rub",
    instructions: "Rub your chin thoughtfully as you speak.",
    lines: ["Let me think about this for a moment."],
    expectedGestureName: "Chin Rub"
  },
  {
    title: "Attentive Rest",
    instructions: "Rest your hand(s) calmly while listening or pausing.",
    lines: ["I'm listening carefully to your thoughts."],
    expectedGestureName: "Attentive Rest"
  },
  {
    title: "Thumbs Up",
    instructions: "Give a thumbs up to show approval or agreement.",
    lines: ["That's a great idea!"],
    expectedGestureName: "Thumbs Up"
  },
  {
    title: "Peace Sign",
    instructions: "Flash a peace sign for friendliness or emphasis.",
    lines: ["Let's work together in harmony."],
    expectedGestureName: "Peace Sign"
  },
  {
    title: "Prayer Hands",
    instructions: "Bring your hands together in a gesture of gratitude or request.",
    lines: ["Thank you all for your attention."],
    expectedGestureName: "Prayer Hands"
  }
];

const GesturePracticeView = () => {
  // --- All hooks at the top ---
  const [currentScriptStep, setCurrentScriptStep] = useState(0);
  const [exerciseMessage, setExerciseMessage] = useState("");
  const [hands, setHands] = useState([]); 
  const [gestureResultsByHand, setGestureResultsByHand] = useState({});
  const [webcamStatus, setWebcamStatus] = useState('Initializing Webcam...');
  const [modelStatus, setModelStatus] = useState('Initializing Model...');
  const [feedbackMessage, setFeedbackMessage] = useState('Initializing gesture practice module...');
  const [overallDetectedGestureName, setOverallDetectedGestureName] = useState('');
  const [overallDetectedGestureDetails, setOverallDetectedGestureDetails] = useState('');
  const [gestureDiagrams, setGestureDiagrams] = useState([]);
  const [diagramMap, setDiagramMap] = useState({});
  const [detectedGestures, setDetectedGestures] = useState([]);
  const [videoDims, setVideoDims] = useState({ width: 640, height: 480 });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const gestureHoldStartTimeRef = useRef(null);

  const REQUIRED_HOLD_DURATION = 2000;

  // Get expected gesture for current step
  const expectedGesture = performanceScript[currentScriptStep]?.expectedGestureName || null;
  const diagram = expectedGesture && diagramMap[expectedGesture] ? diagramMap[expectedGesture] : null;

  // Load gesture diagrams JSON on mount
  useEffect(() => {
    async function loadDiagrams() {
      try {
        const response = await fetch(process.env.PUBLIC_URL + '/gesture_diagrams.json');
        const data = await response.json();
        setGestureDiagrams(data);
        const map = {};
        data.forEach(item => { map[item.name] = item; });
        setDiagramMap(map);
      } catch (e) {
        console.warn('Failed to load gesture diagrams:', e);
      }
    }
    loadDiagrams();
  }, []);

  // Draw hand skeletons and keypoints overlay, plus detected gesture label
  function drawHands(hands, ctx, detectedGesture, gestureDetails) {
    if (!ctx || !hands) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    hands.forEach((hand, handIdx) => {
      // Draw keypoints
      hand.keypoints.forEach((pt, i) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = i === 0 ? 'red' : '#00e0ff'; // Wrist in red, others blue
        ctx.fill();
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.stroke();
    });
      // Draw skeleton (connect keypoints for fingers)
      if (hand.keypoints && hand.keypoints.length >= 21) {
        const fingers = [
          [0, 1, 2, 3, 4],       // Thumb
          [0, 5, 6, 7, 8],       // Index
          [0, 9, 10, 11, 12],    // Middle
          [0, 13, 14, 15, 16],   // Ring
          [0, 17, 18, 19, 20]    // Pinky
        ];
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#00e0ff';
        fingers.forEach(finger => {
          ctx.beginPath();
          ctx.moveTo(hand.keypoints[finger[0]].x, hand.keypoints[finger[0]].y);
          for (let k = 1; k < finger.length; k++) {
            ctx.lineTo(hand.keypoints[finger[k]].x, hand.keypoints[finger[k]].y);
          }
          ctx.stroke();
      });
      }
      // Overlay detected gesture label above wrist
      if (detectedGesture && hand.keypoints[0]) {
        ctx.save();
        ctx.font = 'bold 22px sans-serif';
        ctx.fillStyle = '#f7d716';
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 4;
        const label = `${detectedGesture}${gestureDetails ? ' - ' + gestureDetails : ''}`;
        const x = hand.keypoints[0].x;
        const y = Math.max(hand.keypoints[0].y - 24, 28);
        ctx.strokeText(label, x + 8, y);
        ctx.fillText(label, x + 8, y);
        ctx.restore();
      }
  });
  } // closes drawHands

  // Gesture analysis logic
  function analyzeGestures(hands) {
    setHands(hands);
    let detectedGesture = null;
    // Check for gestures in order of specificity
    if (hands.length > 0) {
      const hand = hands[0];
      if (detectEmphasisPoint && detectEmphasisPoint(hand)) {
        detectedGesture = "Emphasis Point";
      } else if (detectOpenHand && detectOpenHand(hand)) {
        detectedGesture = "Open Hand";
      } else if (detectChinRub && detectChinRub(hand, { width: 640, height: 480 })) {
        detectedGesture = "Chin Rub";
      } else if (detectAttentiveRest && detectAttentiveRest(hand, { width: 640, height: 480 })) {
        detectedGesture = "Attentive Rest";
      } else if (detectThumbsUp && detectThumbsUp(hand)) {
        detectedGesture = "Thumbs Up";
      } else if (detectPeaceSign && detectPeaceSign(hand)) {
        detectedGesture = "Peace Sign";
      }
    }
    // Special case for gestures requiring two hands
    if (!detectedGesture && hands.length === 2) {
      if (detectPrayerHands && detectPrayerHands(hands[0], hands[1])) {
        detectedGesture = "Prayer Hands";
      } else if (detectOpenHand && detectOpenHand(hands[0]) && detectOpenHand(hands[1])) {
        // Both open and roughly level
        const yDiff = Math.abs(hands[0].keypoints[0].y - hands[1].keypoints[0].y);
        if (yDiff < 480 * 0.15) {
          detectedGesture = "Balance";
        }
      }
    }
    // Compare with expected gesture
    if (detectedGesture === expectedGesture) {
      setExerciseMessage(`✅ Correct! You performed "${expectedGesture}".`);
    } else if (detectedGesture) {
      setExerciseMessage(`❌ Detected "${detectedGesture}". Try to perform "${expectedGesture}".`);
    } else {
      setExerciseMessage(`No recognizable gesture detected. Try "${expectedGesture}".`);
    }
  }


  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      try {
        // Wait for TF.js initialization
        console.log('[GesturePracticeView] Waiting for TF.js initialization...');
        await initializeTensorFlow(); // Wait for TF.js initialization
        console.log('[GesturePracticeView] Global TF.js initialization complete.');

        // Proceed with model loading and webcam setup as before
        if (!isMounted) return;
        console.log('[GesturePracticeView] Model Ready.');
        setFeedbackMessage('Model loaded. Webcam initializing...');

        // Setup webcam after model is ready
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          if(isMounted) setWebcamStatus('Requesting Webcam Access...');
          const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
          if (!isMounted) {
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              if (isMounted) {
                setWebcamStatus('Webcam Ready');
                console.log('[GesturePracticeView] Webcam ready.');
                setFeedbackMessage('Webcam ready. Position your hands in view.');
              }
            };
          }
        } else {
          console.error('[GesturePracticeView] getUserMedia not supported');
          if (isMounted) setWebcamStatus('Webcam Not Supported');
          if (isMounted) setFeedbackMessage('Webcam access is not supported by your browser.');
        }

      } catch (error) {
        console.error('Error in GesturePracticeView setup:', error);
        if (isMounted) {
            setModelStatus('Model/Webcam Failed');
            setFeedbackMessage(`Setup Error: ${error.message}`);
        }
      }
    };

    setup();

    return () => {
      isMounted = false;
      console.log("[GesturePracticeView] Cleanup effect: stopping webcam.");
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []); // Empty dependency array to run once on mount


  const calculateDistance = (kp1, kp2) => {
    const dx = kp1.x - kp2.x;
    const dy = kp1.y - kp2.y;
    const dz = (kp1.z || 0) - (kp2.z || 0); 
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  // --- GESTURE DETECTION HELPERS FOR 8 GESTURES ---
  // Utility: distance between two keypoints
  const getDist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // 1. Emphasis Point (pinch, R/L) - normalized
  const detectEmphasisPoint = (hand) => {
    if (!hand || !hand.keypoints || hand.keypoints.length < 21) return false;
    const kp = hand.keypoints;
    // Normalize distances by hand size (distance wrist to middle MCP)
    const handSize = getDist(kp[0], kp[9]) || 1;
    const pinch = getDist(kp[4], kp[8]) < handSize * 0.35;
    const midCurled = getDist(kp[12], kp[9]) < getDist(kp[10], kp[9]);
    const ringCurled = getDist(kp[16], kp[13]) < getDist(kp[14], kp[13]);
    const pinkyCurled = getDist(kp[20], kp[17]) < getDist(kp[18], kp[17]);
    return pinch && midCurled && ringCurled && pinkyCurled;
  };

  // 2. Open Hand (all fingers extended, palm up-ish) - normalized
  const detectOpenHand = (hand) => {
    if (!hand || !hand.keypoints || hand.keypoints.length < 21) return false;
    const kp = hand.keypoints;
    const handSize = getDist(kp[0], kp[9]) || 1;
    // All fingers extended: tip-MCP > PIP-MCP for each
    const extended = [8,12,16,20].every(i => getDist(kp[i], kp[i-3]) > getDist(kp[i-1], kp[i-3]) * 1.3);
    // Palm up: index MCP and pinky MCP above wrist (smaller y)
    const palmUp = kp[5].y < kp[0].y && kp[17].y < kp[0].y;
    // Require hand span to be at least 60% of handSize, to avoid false positives
    const span = getDist(kp[5], kp[17]);
    return extended && palmUp && span > handSize * 0.6;
  };

  // 3. Balance (both hands, palms up, level)
  // This must be checked at the multi-hand level

  // 4. Chin Rub (hand near chin area)
  // Approximate: hand near bottom-center of image (y high, x near center)
  const detectChinRub = (hand, videoDims) => {
    if (!hand || !hand.keypoints || hand.keypoints.length < 21) return false;
    const kp = hand.keypoints;
    const palm = kp[0];
    if (!videoDims) return false;
    const { width, height } = videoDims;
    return palm.y > height * 0.65 && Math.abs(palm.x - width/2) < width * 0.18;
  };

  // 5. Attentive Rest (default: no gesture detected, hand low)
  const detectAttentiveRest = (hand, videoDims) => {
    if (!hand || !hand.keypoints || hand.keypoints.length < 21) return false;
    const kp = hand.keypoints;
    const palm = kp[0];
    if (!videoDims) return false;
    return palm.y > videoDims.height * 0.8;
  };

  // 6. Thumbs Up (normalized)
  const detectThumbsUp = (hand) => {
    if (!hand || !hand.keypoints || hand.keypoints.length < 21) return false;
    const kp = hand.keypoints;
    const handSize = getDist(kp[0], kp[9]) || 1;
    // Thumb tip above all other tips (y lower)
    const thumbUp = kp[4].y < Math.min(kp[8].y, kp[12].y, kp[16].y, kp[20].y);
    // Thumb extended: tip far from MCP
    const extended = getDist(kp[4], kp[2]) > handSize * 0.7;
    return thumbUp && extended;
  };

  // 7. Peace Sign (normalized)
  const detectPeaceSign = (hand) => {
    if (!hand || !hand.keypoints || hand.keypoints.length < 21) return false;
    const kp = hand.keypoints;
    const handSize = getDist(kp[0], kp[9]) || 1;
    const indexExt = getDist(kp[8], kp[5]) > getDist(kp[7], kp[5]) * 1.3 && getDist(kp[8], kp[5]) > handSize * 0.6;
    const midExt = getDist(kp[12], kp[9]) > getDist(kp[10], kp[9]) * 1.3 && getDist(kp[12], kp[9]) > handSize * 0.6;
    const ringCurled = getDist(kp[16], kp[13]) < getDist(kp[14], kp[13]);
    const pinkyCurled = getDist(kp[20], kp[17]) < getDist(kp[18], kp[17]);
    return indexExt && midExt && ringCurled && pinkyCurled;
  };

  // 8. Prayer Hands (palms together, normalized)
  const detectPrayerHands = (hand1, hand2) => {
    if (!hand1 || !hand2 || !hand1.keypoints || !hand2.keypoints || hand1.keypoints.length < 21 || hand2.keypoints.length < 21) return false;
    const kp1 = hand1.keypoints;
    const kp2 = hand2.keypoints;
    // Palm bases close together, normalized by average hand size
    const handSize1 = getDist(kp1[0], kp1[9]) || 1;
    const handSize2 = getDist(kp2[0], kp2[9]) || 1;
    const palmDist = getDist(kp1[0], kp2[0]);
    const avgHand = (handSize1 + handSize2) / 2;
    return palmDist < avgHand * 0.5;
  };

 

  // --- Real-time detection loop with overlay and feedback ---
  useEffect(() => {
    let running = true;
    const detectLoop = async () => {
      if (!videoRef.current) return;
      const video = videoRef.current;
      // IMPORTANT: Do NOT use flipHorizontal when video/canvas are mirrored (scaleX(-1))
      // const detectedHands = await detectorRef.current.estimateHands(video);
      setHands([]); // update hands state for gesture analysis and UI
      // Optionally, call analyzeGestures for further analysis
      analyzeGestures([]);
      // Drawing
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        drawHands([], ctx, overallDetectedGestureName, overallDetectedGestureDetails);
      }
      if (running) requestAnimationFrame(detectLoop);
    };
    requestAnimationFrame(detectLoop);
    return () => { running = false; };
  }, [videoDims, overallDetectedGestureName, overallDetectedGestureDetails]);

  // Video dimension sync
  useEffect(() => {
    const checkDims = () => {
      if (videoRef.current) {
        setVideoDims({ width: videoRef.current.videoWidth || 640, height: videoRef.current.videoHeight || 480 });
      }
    };
    const intvl = setInterval(checkDims, 1000);
    return () => clearInterval(intvl);
  }, []);

  useEffect(() => {
    const localGestureResultsByHand = {};
    if (hands.length > 0) {
      hands.forEach((hand, index) => {
        const displayHandedness = getDisplayHandedness(hand.handedness[0]);
        const handId = (displayHandedness === 'Right' || displayHandedness === 'Left') ? displayHandedness : `Hand${index}`;
        const results = {};
        results['Emphasis Point'] = detectEmphasisPoint(hand);
        results['Open Hand'] = detectOpenHand(hand);
        results['Balance'] = hands.length === 2 && detectOpenHand(hands[0]) && detectOpenHand(hands[1]);
        results['Chin Rub'] = detectChinRub(hand, videoDims);
        results['Attentive Rest'] = detectAttentiveRest(hand, videoDims);
        results['Thumbs Up'] = detectThumbsUp(hand);
        results['Peace Sign'] = detectPeaceSign(hand);
        results['Prayer Hands'] = hands.length === 2 && detectPrayerHands(hands[0], hands[1]);
        localGestureResultsByHand[handId] = results;
      }); 
      setGestureResultsByHand(localGestureResultsByHand);
      console.log('Gesture results by hand:', localGestureResultsByHand);

      // Determine overall detected gesture, prioritizing based on expectation or a default order.
      let primaryHandId = hands.find(h => getDisplayHandedness(h.handedness[0]) === 'Right') ? 'Right' : (hands[0] ? (getDisplayHandedness(hands[0].handedness[0]) || 'Hand0') : null);
      let secondaryHandId = hands.find(h => getDisplayHandedness(h.handedness[0]) === 'Left') ? 'Left' : (hands.length > 1 ? (getDisplayHandedness(hands[1].handedness[0]) || 'Hand1') : null);

      if (expectedGesture === 'Balance' && hands.length === 2) {
        if (detectOpenHand(hands[0]) && detectOpenHand(hands[1])) {
          setOverallDetectedGestureName('Balance');
          setOverallDetectedGestureDetails('Both hands open and level.');
        } else {
          setExerciseMessage('Both hands must be open and level for Balance.');
        }
      } else if (expectedGesture === 'Prayer Hands' && hands.length === 2) {
        if (detectPrayerHands(hands[0], hands[1])) {
          setOverallDetectedGestureName('Prayer Hands');
          setOverallDetectedGestureDetails('Prayer Hands detected.');
        } else {
          setExerciseMessage('Bring both hands together for Prayer Hands.');
        }
      } else {
        // Handle single-hand gestures
        let handToConsider = primaryHandId && localGestureResultsByHand[primaryHandId] ? primaryHandId : Object.keys(localGestureResultsByHand)[0];
        if (handToConsider && localGestureResultsByHand[handToConsider]) {
          const results = localGestureResultsByHand[handToConsider];
          for (const gesture of Object.keys(results)) {
            if (results[gesture]) {
              setOverallDetectedGestureName(gesture);
              setOverallDetectedGestureDetails(gesture + ' detected.');
              break;
            }
          }
        }
      }
    }
  }, [hands, expectedGesture, videoDims, gestureResultsByHand]);
  // --- END gesture analysis and feedback ---


  useEffect(() => {
    const runHandDetection = async () => {
      if (webcamStatus === 'Webcam Ready' && videoRef.current && videoRef.current.readyState === 4) {
        const video = videoRef.current;
        // hands state will be updated instead of using a local variable
        let tensorForEstimation = null; 

        try {
          // Create tensor from video
          // tensorForEstimation = tf.browser.fromPixels(video);
          const hasNaN = false; // Removed tf.isNaN(tensorForEstimation).any().dataSync()[0]; 
          console.log('Tensor input for estimateHands - hasNaN:', hasNaN, 'Shape:', null);

          if (!hasNaN) {
            // Use the created tensor for hand estimation
            // const detectedHands = await detectorRef.current.estimateHands(tensorForEstimation);
            setHands([]);
            console.log('Detected hands output:', []);
          } else {
            console.error('Tensor input for estimateHands contains NaN values. Skipping hand estimation.');
          }
        } catch (e) {
          console.error('Error during tensor creation or hand estimation with tensor input:', e);
        } finally {
          if (tensorForEstimation) {
            // tensorForEstimation.dispose(); // Removed
          }
        }
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          drawHands([], ctx);
        }
        analyzeGestures([]);
      }
      animationFrameIdRef.current = requestAnimationFrame(runHandDetection);
    };

    if (videoRef.current) { // Start loop only once video is ready
        runHandDetection();
    }

    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [webcamStatus, analyzeGestures, drawHands]);


  // --- Debug panel toggle state ---
  const [showDebug, setShowDebug] = useState(false);
  // --- Glow/confetti state ---
  const [celebrate, setCelebrate] = useState(false);
  // --- Audio feedback ---
  const playAudio = useCallback((type) => {
    if (typeof window === 'undefined') return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    if (type === 'success') {
      o.frequency.value = 880;
      g.gain.value = 0.08;
    } else {
      o.frequency.value = 220;
      g.gain.value = 0.05;
    }
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.23);
    o.onended = () => ctx.close();
  }, []);

  // --- Celebrate and feedback effect on correct gesture ---
  useEffect(() => {
    if (exerciseMessage && exerciseMessage.startsWith('✅')) {
      setCelebrate(true);
      playAudio('success');
      if (canvasRef.current) confettiBurst(canvasRef.current);
      setTimeout(() => setCelebrate(false), 900);
    } else if (exerciseMessage && exerciseMessage.startsWith('❌')) {
      playAudio('fail');
    }
  }, [exerciseMessage, playAudio]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <button className="gesture-debug-toggle" onClick={() => setShowDebug(v => !v)}>
        {showDebug ? 'Hide Debug' : 'Show Debug'}
      </button>
      <h2>Gesture Practice</h2>
      <p>{feedbackMessage}</p>
      <div style={{ position: 'relative', width: '640px', height: '480px', border: '1px solid black' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' }}
        />
        <canvas
          ref={canvasRef}
          className={celebrate ? 'gesture-celebrate' : ''}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)', zIndex: 2 }}
        />
        {/* Overlay gesture name */}
        {overallDetectedGestureName && (
          <div className={celebrate ? 'gesture-overlay-label gesture-celebrate' : 'gesture-overlay-label'}>
            {overallDetectedGestureName}
          </div>
        )}
      </div>
      {/* Real-time gesture feedback display */}
      <div style={{ marginTop: '20px', padding: '10px', border: '1px dashed gray', minHeight: '50px' }}>
        <p style={{ fontWeight: 'bold', color: 'blue', margin: 0 }}>{exerciseMessage}</p>
      </div>
      {/* Debug panel */}
      {showDebug && (
        <GesturePracticeViewDebugPanel
          hands={hands}
          gestureResultsByHand={gestureResultsByHand}
          detectedGesture={overallDetectedGestureName}
          videoDims={videoDims}
        />
      )}
      {/* Rhetoric Recitation Exercise UI */}
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', width: '640px' }}>
        <h3>Rhetoric Recitation Exercise</h3>
        {performanceScript[currentScriptStep] ? (
          <div className="gesture-practice-content">
            <h2>{performanceScript[currentScriptStep]?.title}</h2>
            {diagram && (
              <div className="gesture-diagram-container" style={{textAlign: 'center', marginBottom: '16px'}}>
                <img 
                  src={diagram.url} 
                  alt={diagram.alt} 
                  style={{maxWidth: '180px', maxHeight: '180px', objectFit: 'contain', borderRadius: '12px', background: '#f7f7f7', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'}}
                />
                <div style={{fontSize: '13px', color: '#666', marginTop: '6px'}}>{diagram.alt}</div>
              </div>
            )}
            <p style={{ marginTop: '10px', fontWeight: 'bold', color: performanceScript?.[currentScriptStep]?.expectedGestureName ? 'orange' : 'green' }}>
              Expected Gesture: {performanceScript?.[currentScriptStep]?.expectedGestureName || 'None'}
            </p>
            <p style={{ marginTop: '10px', fontWeight: 'bold', color: 'blue' }}>{exerciseMessage}</p>
            <div style={{ marginTop: '15px' }}>
              <button onClick={() => {
                setCurrentScriptStep(0);
                setExerciseMessage("");
              }} style={{ marginRight: '10px' }}>
                Start/Restart Exercise
              </button>
              <button onClick={() => {
                setCurrentScriptStep((prev) => Math.max(prev - 1, 0));
                setExerciseMessage("");
              }} style={{ marginRight: '10px' }} disabled={currentScriptStep === 0}>
                Previous Step
              </button>
              <button onClick={() => {
                setCurrentScriptStep((prev) => Math.min(prev + 1, performanceScript.length - 1));
                setExerciseMessage("");
              }} disabled={currentScriptStep >= performanceScript.length - 1}>
                Next Step
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2>No script step available.</h2>
          </div>
        )}
      </div>
    </div>
  );
}

export default GesturePracticeView;
