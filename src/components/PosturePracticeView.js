import React, { useState, useEffect, useRef, useCallback } from 'react';
import DemoPlaceholder from './DemoPlaceholder';
import './PosturePracticeView.css';
// Temporarily disabled TensorFlow imports to prevent conflicts with booth demo
// import { tf, initializeTfjs } from '../tfjs-initializer';
// import * as poseDetection from '@tensorflow-models/pose-detection';

// TensorFlow.js is initialized by tfjs-initializer.js when it's imported.
// No need for PosturePracticeView.js to call initializeTfjs() at module scope.
// const tfjsInitPromise = initializeTfjs().then(success => {
//   if (!success) {
//     console.error('Failed to initialize TensorFlow.js');
//   }
//   return success;
// });

// Define keypoint connections for MoveNet - DISABLED FOR BOOTH DEMO
// const CONNECTIONS = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);

// Keypoint indices (COCO naming for MoveNet)
const NOSE = 0;
const LEFT_EYE = 1;
const RIGHT_EYE = 2;
const LEFT_EAR = 3;
const RIGHT_EAR = 4;
const LEFT_SHOULDER = 5;
const RIGHT_SHOULDER = 6;
// const LEFT_ELBOW = 7;
// const RIGHT_ELBOW = 8;
// const LEFT_WRIST = 9;
// const RIGHT_WRIST = 10;
// const LEFT_HIP = 11;
// const RIGHT_HIP = 12;
// const LEFT_KNEE = 13;
// const RIGHT_KNEE = 14;
// const LEFT_ANKLE = 15;
// const RIGHT_ANKLE = 16;

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;
const MIN_KEYPOINT_SCORE = 0.3; // Minimum confidence score for a keypoint to be considered valid

const contentPrompts = [
  { id: 1, text: "Imagine a string pulling you up from the crown of your head.", tip: "This helps lengthen your spine." },
  { id: 2, text: "Gently tuck your chin, as if holding a small fruit under it.", tip: "This aligns your neck properly." },
  { id: 3, text: "Roll your shoulders back and down, away from your ears.", tip: "This opens up your chest." },
  { id: 4, text: "Engage your core slightly, as if bracing for a nudge.", tip: "This supports your lower back." },
  { id: 5, text: "Ensure your weight is evenly distributed, whether sitting or standing.", tip: "Avoid leaning to one side." }
];

function PosturePracticeView() {
  const [showAvatar, setShowAvatar] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const baselineCapturedRef = useRef(false);
  const baselineCaptureTimerRef = useRef(null);
  const challengeTimerRef = useRef(null);
  const successfulHoldSecondsRef = useRef(0);

  const [webcamStatus, setWebcamStatus] = useState('Initializing Webcam...');
  const [modelStatus, setModelStatus] = useState('Initializing Model...');
  const [isCameraMirrored, setIsCameraMirrored] = useState(true);
  const [detectionPaused, setDetectionPaused] = useState(true); // Start paused

  const [postureScore, setPostureScore] = useState(100);
  const [isLeaningIn, setIsLeaningIn] = useState(false);
  const [baselineShoulderWidth, setBaselineShoulderWidth] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('Click "Start Practice" to begin.');
  const [detailedFeedback, setDetailedFeedback] = useState({
    slouching: false,
    forwardHead: false,
    shoulderTilt: false,
    leaningTooClose: false, // Added this for clarity
  });

  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeTimeRemaining, setChallengeTimeRemaining] = useState(0);
  const [challengeTimeTotal] = useState(10); // 10 seconds for challenge
  const [challengeStatus, setChallengeStatus] = useState(''); // e.g., 'Hold a good posture!'
  const [challengeFeedback, setChallengeFeedback] = useState(''); // e.g., 'Good job!', 'Try again!'
  const [currentContentPrompt, setCurrentContentPrompt] = useState(null);

  const isSystemReady = webcamStatus === 'Webcam Ready' && modelStatus === 'Model Ready';

  const getRandomContentPrompt = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * contentPrompts.length);
    return contentPrompts[randomIndex];
  }, []);

  // Initialize Model (TF.js core is initialized globally in App.js via tfjs-initializer.js)
  useEffect(() => {
    let isMounted = true; // Flag to check if component is still mounted
    // Removed checkInterval as global promise handles readiness

    async function initModel() {
      try {
        // Wait for the TF.js initialization to complete
        console.log('[PosturePracticeView] useEffect: Waiting for TF.js initialization...');
        // await initializeTfjs(); // Wait for TF.js initialization
        if (!isMounted) return;
        console.log('[PosturePracticeView] Global TF.js initialization complete.');

        // Proceed with model loading if tf and poseDetection are available
        // if (!tf || !poseDetection) {
        //   if (isMounted) setModelStatus('TF.js or PoseDetection not ready after global init');
        //   console.warn("[PosturePracticeView] TensorFlow or PoseDetection not available after global init.");
        //   return;
        // }
        
        // tf.ready() should have been handled by the global initializer for the active backend.
        // No need to call tf.ready() again here if the global promise resolved.

        // if (detectorRef.current) { // Check if detector is already created
        //   console.log('[PosturePracticeView] Pose detector already exists.');
        //   if (isMounted) setModelStatus('Model Ready'); // Update status if needed
        //   return;
        // }

        // if (isMounted) setModelStatus('Loading pose-detection model...');
        // console.log('[PosturePracticeView] Attempting to create pose detector (once)...');

        // const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
        // const createdDetector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
        
        // if (isMounted) {
        //   detectorRef.current = createdDetector;
        //   setModelStatus('Model Ready');
        //   console.log('[PosturePracticeView] Pose detector created successfully.');
        // } else {
        //   createdDetector.dispose();
        // }
      } catch (error) {
        console.error("[PosturePracticeView] Error initializing Model:", error);
        if (isMounted) setModelStatus('Model Failed to Load. Check console.');
      }
    }

    initModel(); // Call the async function

    return () => {
      isMounted = false;
      // if (detectorRef.current && typeof detectorRef.current.dispose === 'function') {
      //   detectorRef.current.dispose();
      //   detectorRef.current = null;
      //   console.log('[PosturePracticeView] Pose detector disposed.');
      // }
      if (baselineCaptureTimerRef.current) clearTimeout(baselineCaptureTimerRef.current);
      if (challengeTimerRef.current) clearTimeout(challengeTimerRef.current);
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, []);


  // Setup Webcam
  const setupWebcam = useCallback(async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        setWebcamStatus('Requesting Webcam Access...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT },
          audio: false,
        });
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            resolve();
          };
        });
        videoRef.current.width = VIDEO_WIDTH;
        videoRef.current.height = VIDEO_HEIGHT;
        canvasRef.current.width = VIDEO_WIDTH;
        canvasRef.current.height = VIDEO_HEIGHT;
        setWebcamStatus('Webcam Ready');
        return true;
      } catch (error) {
        console.error("Error accessing webcam:", error);
        setWebcamStatus(`Webcam Error: ${error.message}. Check permissions.`);
        return false;
      }
    } else {
      setWebcamStatus('getUserMedia not supported by this browser.');
      return false;
    }
  }, []);

  const drawKeypoints = useCallback((keypoints, ctx) => {
    if (!keypoints || keypoints.length === 0) return;
    ctx.fillStyle = 'Green';
    ctx.strokeStyle = 'White';
    ctx.lineWidth = 2;

    for (const keypoint of keypoints) {
      if (keypoint.score && keypoint.score >= MIN_KEYPOINT_SCORE) {
        const x = keypoint.x;
        const y = keypoint.y;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }
    }
  }, []);

  const drawSkeleton = useCallback((keypoints, ctx) => {
    if (!keypoints || keypoints.length === 0) return;
    ctx.strokeStyle = 'White';
    ctx.lineWidth = 2;

    // CONNECTIONS.forEach(pair => {
    //   const from = keypoints[pair[0]];
    //   const to = keypoints[pair[1]];

    //   if (from && to && from.score && from.score >= MIN_KEYPOINT_SCORE && to.score && to.score >= MIN_KEYPOINT_SCORE) {
    //     ctx.beginPath();
    //     ctx.moveTo(from.x, from.y);
    //     ctx.lineTo(to.x, to.y);
    //     ctx.stroke();
    //   }
    // });
  }, []);

  const calculateDistance = (p1, p2) => {
    if (!p1 || !p2) return 0;
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  const getShoulderWidth = (keypoints) => {
    const leftShoulder = keypoints[LEFT_SHOULDER];
    const rightShoulder = keypoints[RIGHT_SHOULDER];
    if (leftShoulder && rightShoulder && leftShoulder.score && leftShoulder.score >= MIN_KEYPOINT_SCORE && rightShoulder.score && rightShoulder.score >= MIN_KEYPOINT_SCORE) {
      return calculateDistance(leftShoulder, rightShoulder);
    }
    return null;
  };

  const analyzePose = useCallback((keypoints) => {
    if (!keypoints || keypoints.length === 0) {
        setFeedbackMessage("No pose detected. Ensure you are visible in the camera.");
        setDetailedFeedback({ slouching: false, forwardHead: false, shoulderTilt: false, leaningTooClose: false });
        setPostureScore(prev => Math.max(0, prev - 1)); // Gradual score decrease if no pose
        return;
    }

    if (!baselineCapturedRef.current || !baselineShoulderWidth) {
      setFeedbackMessage("Calibrating baseline posture... Please hold a good, neutral posture.");
      return;
    }

    let currentScore = 100;
    let primaryFeedback = "";
    const newDetailedFeedback = {
      slouching: false,
      forwardHead: false,
      shoulderTilt: false,
      leaningTooClose: false,
    };

    const leftShoulder = keypoints[LEFT_SHOULDER];
    const rightShoulder = keypoints[RIGHT_SHOULDER];
    const leftEar = keypoints[LEFT_EAR];
    const rightEar = keypoints[RIGHT_EAR];
    const nose = keypoints[NOSE];

    const shouldersVisible = leftShoulder?.score && leftShoulder.score >= MIN_KEYPOINT_SCORE && rightShoulder?.score && rightShoulder.score >= MIN_KEYPOINT_SCORE;
    const earsVisible = leftEar?.score && leftEar.score >= MIN_KEYPOINT_SCORE && rightEar?.score && rightEar.score >= MIN_KEYPOINT_SCORE;
    const noseVisible = nose?.score && nose.score >= MIN_KEYPOINT_SCORE;
    
    let currentShoulderWidth = null;
    if (shouldersVisible) {
      currentShoulderWidth = getShoulderWidth(keypoints);
    } else {
        primaryFeedback += "Shoulders not clearly visible. ";
        currentScore -= 10;
    }

    // 1. Leaning In / Engaged Detection
    let tempIsLeaningIn = false;
    if (currentShoulderWidth && baselineShoulderWidth) {
      const shoulderWidthIncreaseFactor = currentShoulderWidth / baselineShoulderWidth;
      // Adjusted threshold for leaning in, e.g., 15% increase
      if (shoulderWidthIncreaseFactor > 1.15) { 
        const shoulderMidPointX = (leftShoulder.x + rightShoulder.x) / 2;
        // Check if nose is relatively centered when leaning in
        if (noseVisible && Math.abs(nose.x - shoulderMidPointX) < baselineShoulderWidth * 0.30) { // Nose within 30% of baseline shoulder width from center
          tempIsLeaningIn = true;
          newDetailedFeedback.leaningTooClose = true;
          primaryFeedback = "Leaning In (Engaged). Good for showing interest! ";
          // If leaning in, we might not penalize other aspects as much or score differently
        }
      }
    }
    setIsLeaningIn(tempIsLeaningIn);

    // Only apply these penalties if not "Leaning In (Engaged)"
    if (!tempIsLeaningIn) {
      // 2. Slouching Detection (Ears relative to Shoulders vertically)
      if (shouldersVisible && earsVisible) {
        const earMidPointY = (leftEar.y + rightEar.y) / 2;
        const shoulderMidPointY = (leftShoulder.y + rightShoulder.y) / 2;
        const earShoulderOffsetY = earMidPointY - shoulderMidPointY;
        // Slouch if ears are significantly lower than shoulders (positive offset here means ears are lower)
        // Threshold: e.g., 10% of baseline shoulder width
        const slouchThreshold = baselineShoulderWidth * 0.10; 
        if (earShoulderOffsetY > slouchThreshold) {
          currentScore -= 35;
          newDetailedFeedback.slouching = true;
          primaryFeedback += "Slouching detected. ";
        }
      } else if (!earsVisible) {
          primaryFeedback += "Ears not clearly visible. ";
          currentScore -= 5;
      }

      // 3. Forward Head Posture (Nose relative to Shoulders horizontally)
      if (shouldersVisible && noseVisible) {
        const shoulderMidPointX = (leftShoulder.x + rightShoulder.x) / 2;
        // If mirrored, a smaller nose.x relative to shoulderMidPointX is forward.
        // If not mirrored, a larger nose.x relative to shoulderMidPointX is forward.
        const headForwardOffset = isCameraMirrored ? shoulderMidPointX - nose.x : nose.x - shoulderMidPointX;
        // Threshold: e.g., 15% of baseline shoulder width
        const forwardHeadThreshold = baselineShoulderWidth * 0.15;
        if (headForwardOffset > forwardHeadThreshold) {
          currentScore -= 30;
          newDetailedFeedback.forwardHead = true;
          primaryFeedback += "Forward head posture. ";
        }
      } else if(!noseVisible){
          primaryFeedback += "Nose not clearly visible. ";
          currentScore -= 5;
      }
    }

    // 4. Shoulder Tilt / Uneven Shoulders
    if (shouldersVisible) {
      const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
      // Threshold: e.g., 10% of baseline shoulder width
      const tiltThreshold = baselineShoulderWidth * 0.10;
      if (shoulderTilt > tiltThreshold) {
        currentScore -= 25;
        newDetailedFeedback.shoulderTilt = true;
        primaryFeedback += "Uneven shoulders detected. ";
      }
    }
    
    if (!primaryFeedback && !tempIsLeaningIn) {
      primaryFeedback = "Good posture!";
    } else if (!primaryFeedback && tempIsLeaningIn) {
        // Already handled by the leaning in message
    } else if (primaryFeedback && tempIsLeaningIn) {
        // Message for leaning in already set, other issues might be secondary
    }


    setPostureScore(Math.max(0, Math.min(100, currentScore)));
    setFeedbackMessage(primaryFeedback.trim() || (tempIsLeaningIn ? "Leaning In (Engaged)." : "Analyzing..."));
    setDetailedFeedback(newDetailedFeedback);

  }, [baselineShoulderWidth, isCameraMirrored]);


  const detectPose = useCallback(async () => {
    if (detectionPaused || !detectorRef.current || !videoRef.current || videoRef.current.readyState < 2) {
      if (!detectionPaused) { // Only loop if not intentionally paused
        animationFrameIdRef.current = requestAnimationFrame(detectPose);
      }
      return;
    }

    try {
      // const poses = await detectorRef.current.estimatePoses(videoRef.current, {
      //   flipHorizontal: false // We handle mirroring at the canvas/video display level
      // });
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

      if (isCameraMirrored) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-VIDEO_WIDTH, 0);
      }

      // if (poses && poses.length > 0 && poses[0].keypoints) {
      //   const keypoints = poses[0].keypoints;
      //   drawKeypoints(keypoints, ctx);
      //   drawSkeleton(keypoints, ctx);
        
      //   if (!baselineCapturedRef.current && !baselineCaptureTimerRef.current) {
      //       setFeedbackMessage("Hold a good neutral posture for baseline calibration (3s)...");
      //       baselineCaptureTimerRef.current = setTimeout(() => {
      //           const currentSW = getShoulderWidth(keypoints);
      //           if (currentSW) {
      //               setBaselineShoulderWidth(currentSW);
      //               baselineCapturedRef.current = true;
      //               setFeedbackMessage("Baseline captured! Analyzing posture...");
      //               console.log("Baseline Shoulder Width:", currentSW);
      //           } else {
      //               setFeedbackMessage("Could not capture baseline. Ensure shoulders are visible.");
      //           }
      //           baselineCaptureTimerRef.current = null; 
      //       }, 3000); // 3-second delay
      //   } else if (baselineCapturedRef.current) {
      //       analyzePose(keypoints);
      //   }

      // } else {
      //   setFeedbackMessage("No person detected. Please position yourself in front of the camera.");
      // }

      if (isCameraMirrored) {
        ctx.restore();
      }

    } catch (error) {
      console.error("Error during pose detection:", error);
      // Potentially stop detection or show error
    }
    if (!detectionPaused) {
      animationFrameIdRef.current = requestAnimationFrame(detectPose);
    }
  }, [detectionPaused, isCameraMirrored, analyzePose, drawKeypoints, drawSkeleton, baselineShoulderWidth]);

  // Start/Stop Detection Effect
  useEffect(() => {
    if (!detectionPaused && isSystemReady) {
      detectPose();
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if(baselineCaptureTimerRef.current) {
        clearTimeout(baselineCaptureTimerRef.current);
        baselineCaptureTimerRef.current = null;
      }
    }
    return () => { // Cleanup
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if (baselineCaptureTimerRef.current) clearTimeout(baselineCaptureTimerRef.current);
      if (challengeTimerRef.current) clearInterval(challengeTimerRef.current);
    };
  }, [detectionPaused, isSystemReady, detectPose]);


  // Challenge Logic Effect
  useEffect(() => {
    if (challengeActive && !detectionPaused) {
      if (challengeTimeRemaining > 0) {
        if (!challengeTimerRef.current) { // Start timer if not already running
            successfulHoldSecondsRef.current = 0; // Reset successful hold time
            challengeTimerRef.current = setInterval(() => {
            setChallengeTimeRemaining(prev => prev - 1);
            
            // Check posture during challenge
            if (postureScore > 85 && !isLeaningIn && !detailedFeedback.slouching && !detailedFeedback.forwardHead && !detailedFeedback.shoulderTilt) {
                successfulHoldSecondsRef.current += 1;
                setChallengeStatus(`Good posture! Hold for ${challengeTimeTotal - successfulHoldSecondsRef.current}s more.`);
            } else {
                setChallengeStatus("Adjust your posture to match the prompt!");
            }

          }, 1000);
        }
      } else { // Time is up
        clearInterval(challengeTimerRef.current);
        challengeTimerRef.current = null;
        setChallengeActive(false);
        setDetectionPaused(true); // Pause detection after challenge
        if (successfulHoldSecondsRef.current >= challengeTimeTotal * 0.8) { // e.g. 80% of time in good posture
          setChallengeFeedback(`Challenge Complete! Great job holding good posture for ${successfulHoldSecondsRef.current}s!`);
          setChallengeStatus("Success!");
        } else {
          setChallengeFeedback(`Challenge Ended. You held good posture for ${successfulHoldSecondsRef.current}s. Try to maintain it longer next time!`);
          setChallengeStatus("Try Again?");
        }
      }
    } else { // Challenge not active or detection paused
      if (challengeTimerRef.current) {
        clearInterval(challengeTimerRef.current);
        challengeTimerRef.current = null;
      }
    }
    return () => {
        if (challengeTimerRef.current) clearInterval(challengeTimerRef.current);
    }
  }, [challengeActive, challengeTimeRemaining, detectionPaused, postureScore, isLeaningIn, detailedFeedback, challengeTimeTotal]);


  const handleStartStopPractice = async () => {
    if (detectionPaused) { // If paused, we want to start
      if (webcamStatus !== 'Webcam Ready') {
        const webcamReady = await setupWebcam();
        if (!webcamReady) return; // Don't proceed if webcam setup failed
      }
      if (modelStatus !== 'Model Ready') {
        setFeedbackMessage("Model is not ready. Please wait or check console.");
        return;
      }
      setDetectionPaused(false);
      setFeedbackMessage("Initializing calibration...");
      baselineCapturedRef.current = false; // Reset baseline capture
      setBaselineShoulderWidth(null);
      if (baselineCaptureTimerRef.current) clearTimeout(baselineCaptureTimerRef.current);
      baselineCaptureTimerRef.current = null;
      setPostureScore(100); // Reset score
      // detectPose will be called by the useEffect hook
    } else { // If running, we want to stop
      setDetectionPaused(true);
      setFeedbackMessage('Practice paused. Click "Start Practice" to resume.');
      // Cleanup of animation frame is handled by useEffect
    }
  };

  const handleToggleMirror = () => {
    setIsCameraMirrored(prev => !prev);
  };

  const handleStartChallenge = () => {
    if (!baselineCapturedRef.current) {
        setChallengeFeedback("Please complete baseline calibration first by starting practice.");
        return;
    }
    if (detectionPaused) {
        setChallengeFeedback("Please start practice before starting a challenge.");
        return;
    }
    setCurrentContentPrompt(getRandomContentPrompt());
    setChallengeActive(true);
    setChallengeTimeRemaining(challengeTimeTotal);
    successfulHoldSecondsRef.current = 0;
    setChallengeStatus(`Challenge Started: Hold good posture for ${challengeTimeTotal} seconds!`);
    setChallengeFeedback('');
  };
  
  const getPostureBarColor = () => {
    if (postureScore > 80) return '#4CAF50'; // Green
    if (postureScore > 60) return '#FFC107'; // Amber
    return '#F44336'; // Red
  };

  return (
    <>
    <div className="posture-practice-view">
      {/* Existing content */}
    </div>
  </>
);
}

export default PosturePracticeView;
