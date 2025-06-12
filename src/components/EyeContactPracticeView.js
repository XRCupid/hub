import React, { useState, useEffect, useRef, Suspense } from 'react';


// WebGazer.js should be loaded via script tag in index.html

const EyeContactPracticeView = ({ videoSrc = "/videos/vanessa_placeholder.mp4", sourceType = "file", onSessionComplete }) => {
    const SESSION_DURATION_MS = 15000; // 15 seconds for testing
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [webcamAllowed, setWebcamAllowed] = useState(null); // null: initial, true: allowed, false: denied
    const [isWebGazerReady, setIsWebGazerReady] = useState(false);
    const [sessionEnded, setSessionEnded] = useState(false); // Ensure sessionEnded state is present
    const [isCalibrated, setIsCalibrated] = useState(false); // Ensure isCalibrated state is present
    const [eyeContactPercentage, setEyeContactPercentage] = useState(0);
    const [feedback, setFeedback] = useState("Let's practice your eye contact!");
    const [isGazingAtTarget, setIsGazingAtTarget] = useState(false); // For real-time gaze feedback
    const [initializationStatus, setInitializationStatus] = useState("Initializing...");
    const [isInitializing, setIsInitializing] = useState(false);
    const [isVideoSourceReady, setIsVideoSourceReady] = useState(false); // New state

    const videoRef = useRef(null);
    const videoStreamRef = useRef(null); // To store the stream for cleanup
    const webgazerInstance = useRef(null);
    const gazeDataCollector = useRef({ totalSamples: 0, onTargetSamples: 0 });
    const sessionTimerRef = useRef(null); // To hold the timeout ID for webcam mode
    const webGazerFullySetupRef = useRef(false); // Tracks if initial .begin() and setup was successful
    const gazeListenerAttachedRef = useRef(false); // Tracks if the gaze listener is active
    const isVideoPlayingRef = useRef(isVideoPlaying);
    const isGazingAtTargetRef = useRef(isGazingAtTarget); // Ref for isGazingAtTarget
    const videoRectRef = useRef({ left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 }); // Added videoRectRef declaration

    // Effect to keep isVideoPlayingRef.current in sync with isVideoPlaying state
    useEffect(() => {
        isVideoPlayingRef.current = isVideoPlaying;
    }, [isVideoPlaying]);

    // Effect to keep isGazingAtTargetRef.current in sync with isGazingAtTarget state
    useEffect(() => {
        isGazingAtTargetRef.current = isGazingAtTarget;
    }, [isGazingAtTarget]);

    // Effect to keep refs in sync with state for use in non-React callbacks like WebGazer
    // and to update videoRectRef when video plays/stops
    useEffect(() => {
        console.log(`[RefSyncEffect] Running. isGazingAtTarget: ${isGazingAtTarget}, isVideoPlaying: ${isVideoPlaying}`);
        isGazingAtTargetRef.current = isGazingAtTarget;
        isVideoPlayingRef.current = isVideoPlaying; // Keep isVideoPlayingRef in sync

        if (isVideoPlaying && videoRef.current) {
            requestAnimationFrame(() => {
                if (videoRef.current) { // Double check videoRef.current still exists
                    const videoElement = videoRef.current;
                    
                    // Check computed style and override if necessary when video is playing
                    const computedStyle = window.getComputedStyle(videoElement);
                    if (isVideoPlayingRef.current && computedStyle.display === 'none') {
                        console.log("[RefSyncEffect-rAF] Video display is 'none' while playing, attempting to set to 'inline'.");
                        videoElement.style.display = 'inline'; // Default display for <video> is inline
                        // After this style change, re-fetch computedStyle for accurate logging, though layout might still be pending for getBoundingClientRect
                        // Forcing a reflow here is generally not recommended.
                    }

                    // Log current state for debugging
                    const currentDisplay = window.getComputedStyle(videoElement).display; // Get potentially updated display
                    console.log(`[RefSyncEffect-rAF] Checking video element. Display: ${currentDisplay}, ReadyState: ${videoElement.readyState}, videoWidth: ${videoElement.videoWidth}, videoHeight: ${videoElement.videoHeight}, offsetWidth: ${videoElement.offsetWidth}, offsetHeight: ${videoElement.offsetHeight}`);
                    
                    const rect = videoElement.getBoundingClientRect();
                    console.log("[RefSyncEffect-rAF] getBoundingClientRect():", JSON.stringify(rect));

                    if (rect.width > 0 && rect.height > 0) {
                        videoRectRef.current = rect;
                        console.log("[RefSyncEffect-rAF] videoRectRef updated:", JSON.stringify(videoRectRef.current));
                    } else {
                        console.warn("[RefSyncEffect-rAF] videoRectRef NOT updated. rect.width or rect.height is zero. Video visible?", videoElement.offsetWidth > 0 && videoElement.offsetHeight > 0);
                        if (videoElement.offsetWidth === 0 || videoElement.offsetHeight === 0) {
                            const styles = window.getComputedStyle(videoElement); // Re-log styles if still zero offset
                            console.log("[RefSyncEffect-rAF] Computed styles (if offset still zero): display:", styles.display, "width:", styles.width, "height:", styles.height, "visibility:", styles.visibility, "opacity:", styles.opacity);
                        }
                    }
                } else {
                     console.warn("[RefSyncEffect-rAF] videoRef.current became null inside rAF for isVideoPlaying=true.");
                }
            });
        } else if (!isVideoPlaying) {
            // When video is not playing, set to a default/zero rect
            videoRectRef.current = { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };
            console.log("[RefSyncEffect] isVideoPlaying FALSE. videoRectRef reset to zero.");
        }
    }, [isGazingAtTarget, isVideoPlaying]); // Dependencies

    // Effect for setting up the video source based on sourceType
    useEffect(() => {
        if (!videoRef.current) return;
        // const videoElement = videoRef.current; // Removed intermediate variable
        console.log("[VideoSetupEffect] Running. SourceType:", sourceType, "VideoSrc:", videoSrc);
        setIsVideoSourceReady(false); // Reset on source change

        // Clear previous src/srcObject and stop any existing stream
        if (videoStreamRef.current) {
            videoStreamRef.current.getTracks().forEach(track => track.stop());
            videoStreamRef.current = null;
        }
        videoRef.current.srcObject = null; // Use videoRef.current directly

        // Conditionally clear .src to avoid "Empty src attribute" error for webcams
        if (sourceType !== 'webcam') {
            videoRef.current.src = ""; // Use videoRef.current directly
        }

        const handleLoadedData = () => {
            console.log("[VideoSetupEffect] Video loadeddata event fired.");
            setIsVideoSourceReady(true);
            if (sourceType === 'webcam' && videoRef.current) {
                videoRef.current.play().catch(e => console.warn("[VideoSetup] Webcam autoplay after loadeddata prevented:", e));
            }
        };

        const handleError = (e) => {
            console.error("[VideoSetupEffect] Video error event fired. Event details:", e);
            if (e.target && e.target.error) {
                console.error("[VideoSetupEffect] Video element error details: Code:", e.target.error.code, "Message:", e.target.error.message);
            } else {
                console.error("[VideoSetupEffect] Video element error details: No e.target.error object found.");
            }
            setFeedback("Error loading video source.");
            setIsVideoSourceReady(false); // Keep this to prevent WebGazer trying to init with a bad source
        };

        videoRef.current.addEventListener('loadeddata', handleLoadedData);
        videoRef.current.addEventListener('error', handleError);

        if (sourceType === 'webcam') {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ video: true })
                    .then((stream) => {
                        videoStreamRef.current = stream; // Store the stream for cleanup
                        if (videoRef.current) {
                            videoRef.current.srcObject = stream;
                            videoRef.current.muted = true;
                            console.log("[VideoSetup] Webcam stream object set:", videoRef.current.srcObject);
                            if (videoRef.current.srcObject && typeof videoRef.current.srcObject.getTracks === 'function') {
                                console.log("[VideoSetup] Webcam stream tracks:", videoRef.current.srcObject.getTracks());
                            }
                            // Autoplay will be attempted in handleLoadedData for webcams
                        }
                    })
                    .catch(err => {
                        console.error("[VideoSetup] Error accessing webcam for video display:", err);
                        setFeedback("Could not access webcam. Please check permissions.");
                        setIsVideoSourceReady(false); // Explicitly set to false on webcam error
                    });
            } else {
                setFeedback("Webcam API not supported by this browser.");
            }
        } else if (sourceType === 'url') {
            videoRef.current.src = videoSrc;
        } else { // Default is 'file'
            videoRef.current.src = videoSrc;
        }

        return () => {
            console.log("[VideoSetupEffect] Cleanup. Removing video event listeners.");
            if (videoRef.current) {
                videoRef.current.removeEventListener('loadeddata', handleLoadedData);
                videoRef.current.removeEventListener('error', handleError);
            }
            if (videoStreamRef.current) {
                videoStreamRef.current.getTracks().forEach(track => track.stop());
                videoStreamRef.current = null;
            }
        };
    }, [sourceType, videoSrc]);

    // Main effect for WebGazer initialization and cleanup
    useEffect(() => {
        console.log(`[WebGazerEffect] Running. isVideoSourceReady: ${isVideoSourceReady}, webGazerFullySetupRef: ${webGazerFullySetupRef.current}`);
        if (isVideoSourceReady && window.webgazer) {
            webgazerInstance.current = window.webgazer;
            if (!webGazerFullySetupRef.current) { // Only initialize if not already fully setup
                console.log("[WebGazerEffect] Video source is ready. Attempting to initialize WebGazer.");
                initializeWebGazer();
            } else {
                console.log("[WebGazerEffect] WebGazer already fully setup. No re-initialization needed.");
            }
        } else if (!isVideoSourceReady && window.webgazer) {
            console.log("[WebGazerEffect] Video source NOT ready. WebGazer initialization deferred.");
            // Optionally, reset WebGazer state if video becomes unready after initialization
            if (webGazerFullySetupRef.current && webgazerInstance.current) {
                console.log("[WebGazerEffect] Video became unready. Cleaning up existing WebGazer instance.");
                if (gazeListenerAttachedRef.current) {
                    try { webgazerInstance.current.removeGazeListener(); } catch (e) { console.error("Error removing gaze listener during reset:", e);}
                    gazeListenerAttachedRef.current = false;
                }
                try { webgazerInstance.current.end(); } catch (e) { console.error("Error calling .end() during reset:", e);}
                webGazerFullySetupRef.current = false;
                setIsWebGazerReady(false);
            }
        } else if (!window.webgazer) {
            console.error("[WebGazerEffect] WebGazer.js not loaded. Ensure it's in index.html.");
            setFeedback("Error: Eye-tracking library not loaded.");
        }

        // The main cleanup for this effect should handle what happens when the component unmounts
        // or when isVideoSourceReady changes in a way that stops an ongoing initialization.
        // The previous comprehensive cleanup is good for unmount.
        return () => {
            console.log("[WebGazerEffect] Cleanup initiated. webGazerFullySetupRef:", webGazerFullySetupRef.current, "Instance:", webgazerInstance.current);
            if (webgazerInstance.current) {
                console.log("[WebGazerCleanup] Attempting to stop and cleanup WebGazer.");
                try {
                    webgazerInstance.current.showPredictionPoints(false); // Hide red dot
                    console.log("[WebGazerCleanup] Prediction points hidden.");
                    webgazerInstance.current.pause(); // Pause gaze detection
                    console.log("[WebGazerCleanup] WebGazer paused.");
                    webgazerInstance.current.end(); // Full shutdown and DOM removal
                    console.log("[WebGazerCleanup] .end() called successfully.");
                } catch (e) {
                    console.error("[WebGazerCleanup] Error during WebGazer cleanup:", e);
                }
                if (gazeListenerAttachedRef.current) {
                    gazeListenerAttachedRef.current = false;
                    console.log("[WebGazerCleanup] Gaze listener flag set to false.");
                }
            }
            webGazerFullySetupRef.current = false;
            setIsWebGazerReady(false);
            setWebcamAllowed(null); // Reset webcam permission status

            // WebGazerEffect's cleanup should focus on WebGazer instance and its listener.
            // videoStreamRef is managed by VideoSetupEffect's cleanup.
            if (sessionTimerRef.current) {
                clearTimeout(sessionTimerRef.current);
                sessionTimerRef.current = null;
                console.log("[WebGazerCleanup] Session timer cleared.");
            }
            console.log("[WebGazerEffect] Cleanup finished.");
        };
    }, [isVideoSourceReady]); // Runs when isVideoSourceReady changes, and on mount/unmount

    const initializeWebGazer = async () => {
        if (!webgazerInstance.current) {
            console.log("[InitializeWebGazer] WebGazer library not found on window object.");
            setFeedback("Error: Eye-tracking library not available.");
            setIsInitializing(false);
            setInitializationStatus('Error: Library not found');
            return;
        }

        // If it's already fully set up and ready, don't re-initialize
        if (webGazerFullySetupRef.current && isWebGazerReady) {
            console.log("[InitializeWebGazer] WebGazer already fully set up and ready. Skipping re-initialization.");
            setFeedback("Eye tracker is ready."); // Ensure feedback is positive
            setIsInitializing(false); // Ensure initializing is false
            return;
        }
        
        console.log("[InitializeWebGazer] Starting initialization...");
        setIsInitializing(true);
        setWebcamAllowed(null); // Reset webcam status
        setIsWebGazerReady(false); // Set to false until successfully initialized
        setInitializationStatus('Initializing Tracker (TF Backend)...');

        try {
            // WebGazer will use the globally initialized TensorFlow.js instance and backend.
            // No need to set it here anymore.
            // const tf = webgazerInstance.current.getTF();
            // if (tf) {
            //     const currentBackend = tf.getBackend();
            //     if (currentBackend !== 'webgl') {
            //         console.log('[InitializeWebGazer] Current TF backend is ' + currentBackend + '. Setting to webgl.');
            //         await tf.setBackend('webgl');
            //     }
            //     await tf.ready();
            //     console.log('[InitializeWebGazer] TensorFlow.js backend (webgl) is ready.');
            // } else {
            //     console.warn('[InitializeWebGazer] Could not get TensorFlow instance from WebGazer. WebGazer might manage TF internally or globally set TF is used.');
            // }

            // The calling effect now ensures video is ready via isVideoSourceReady state.
            // The internal check here can be simplified or kept as a safeguard.
            // For now, let's assume the calling effect handles readiness.
            if (!videoRef.current || (!videoRef.current.src && !videoRef.current.srcObject) || videoRef.current.readyState < videoRef.current.HAVE_METADATA) {
                console.warn('[InitializeWebGazer] Called, but video element or its source is not fully ready. This should ideally be caught by isVideoSourceReady. State:', videoRef.current?.readyState);
                // Depending on strictness, could return or throw here.
                // For now, proceed cautiously, WebGazer might handle it or fail later.
            } else {
                console.log('[InitializeWebGazer] Video element appears ready.');
            }

            // if (videoRef.current && (videoRef.current.src || videoRef.current.srcObject)) {
            //     if (videoRef.current.readyState < videoRef.current.HAVE_METADATA) { // HAVE_METADATA is 1
            //         console.log('[InitializeWebGazer] Video metadata not ready, waiting for loadeddata event...');
            //         await new Promise((resolve, reject) => {
            //             const onLoadedData = () => {
            //                 videoRef.current.removeEventListener('loadeddata', onLoadedData);
            //                 videoRef.current.removeEventListener('error', onError);
            //                 console.log('[InitializeWebGazer] Video loadeddata event fired.');
            //                 resolve();
            //             };
            //             const onError = (err) => {
            //                 videoRef.current.removeEventListener('loadeddata', onLoadedData);
            //                 videoRef.current.removeEventListener('error', onError);
            //                 console.error('[InitializeWebGazer] Video error event fired while waiting for loadeddata:', err);
            //                 reject(new Error('Video element failed to load, preventing WebGazer startup.'));
            //             };
            //             videoRef.current.addEventListener('loadeddata', onLoadedData);
            //             videoRef.current.addEventListener('error', onError);
            //         });
            //         console.log('[InitializeWebGazer] Video is now ready after waiting.');
            //     } else {
            //         console.log('[InitializeWebGazer] Video already has metadata or is ready (readyState >= HAVE_METADATA).');
            //     }
            // } else {

            // The old block for when video source isn't available:
            if (!videoRef.current || (!videoRef.current.src && !videoRef.current.srcObject)) {
                // This might not be an immediate error if WebGazer can start without video dimensions
                // but it's a risky state.
                console.warn('[InitializeWebGazer] Video element or its source is not available at the start of initialization. WebGazer might fail if it needs video dimensions immediately.');
                setFeedback("Video source missing for eye tracker.");
                setIsInitializing(false);
                setInitializationStatus("Error: Video missing");
                return; // Cannot proceed without a video source for WebGazer
            }
            
            setInitializationStatus('Initializing Tracker (WebGazer Core)...');
            webgazerInstance.current.showVideoPreview(false)
                                  .showPredictionPoints(true)
                                  .setRegression('ridge') 
                                  .applyKalmanFilter(true);
            
            console.log('[InitializeWebGazer] Calling webgazer.begin()...');
            // Note: .begin() can throw if webcam access is denied or other issues occur.
            await webgazerInstance.current.begin(); // This is the main call that requests webcam etc.
            console.log('[InitializeWebGazer] webgazer.begin() completed successfully.');
            
            setWebcamAllowed(true); // If begin() succeeded, webcam permission was granted
            setIsWebGazerReady(true);
            if (webgazerInstance.current) {
                webgazerInstance.current.showPredictionPoints(true);
            }
            setFeedback("Eye tracker ready. Click various points on the screen to calibrate, then click 'Confirm Calibration'.");
            setInitializationStatus('Ready for Calibration');
            setIsCalibrated(false); // Ensure calibration is required
            webGazerFullySetupRef.current = true; // Mark as fully setup
            console.log("[InitializeWebGazer] Initialization and setup complete, awaiting calibration confirmation.");

            if (!gazeListenerAttachedRef.current) {
                webgazerInstance.current.setGazeListener((data, elapsedTime) => {
                    if (!data || !videoRef.current || !isVideoPlayingRef.current) {
                        return;
                    }
                    // Use the videoRectRef.current updated by the useEffect hook
                    const videoRect = videoRectRef.current;
                    if (!videoRect || videoRect.width === 0 || videoRect.height === 0) {
                        // console.warn("[GazeListener] videoRectRef is not yet valid or video is not visible. Gaze target check skipped.");
                        return; // Don't process gaze if videoRect is not valid
                    }

                    gazeDataCollector.current.totalSamples++;
                    const isCurrentlyOnTarget =
                        data.x >= videoRect.left && data.x <= videoRect.right &&
                        data.y >= videoRect.top && data.y <= videoRect.bottom;

                    // console.log(`[GazeListener] Gaze(x,y): (${data.x.toFixed(2)}, ${data.y.toFixed(2)}) | VideoRect(L,R,T,B): (${videoRect.left.toFixed(2)}, ${videoRect.right.toFixed(2)}, ${videoRect.top.toFixed(2)}, ${videoRect.bottom.toFixed(2)}) | OnTarget: ${isCurrentlyOnTarget}`);

                    if (isCurrentlyOnTarget) {
                        gazeDataCollector.current.onTargetSamples++;
                        if (!isGazingAtTargetRef.current) {
                            setIsGazingAtTarget(true);
                        }
                    } else {
                        if (isGazingAtTargetRef.current) {
                            setIsGazingAtTarget(false);
                        }
                    }
                });
                gazeListenerAttachedRef.current = true;
                console.log("[InitializeWebGazer] Gaze listener attached.");
            }
            webGazerFullySetupRef.current = true; // Mark as fully setup
            console.log("[InitializeWebGazer] Initialization and setup complete.");

        } catch (e) {
            console.error("[InitializeWebGazer] CRITICAL ERROR during initialization:", e);
            let userErrorMessage = "Eye tracker initialization failed. ";
            if (e.name === "NotAllowedError" || (e.message && e.message.toLowerCase().includes("permission denied"))) {
                userErrorMessage += "Webcam access was denied. Please allow access and try again.";
                setWebcamAllowed(false);
                setInitializationStatus('Error: Webcam Denied');
            } else if (e.message && e.message.toLowerCase().includes("already started")) {
                userErrorMessage += "Tracker seems to be already active. Attempting to use existing session.";
                // Try to recover or use the existing session if possible
                setIsWebGazerReady(true); // Assume it's usable
                setWebcamAllowed(true);   // Assume webcam was granted for the "already started" session
                setInitializationStatus('Ready (already started)');
                 if (webgazerInstance.current && !gazeListenerAttachedRef.current) { // Try to attach listener if not already
                    try {
                         webgazerInstance.current.setGazeListener((data, elapsedTime) => {
                            if (!data || !videoRef.current || !isVideoPlayingRef.current) return;
                            const videoRect = videoRef.current.getBoundingClientRect();
                            gazeDataCollector.current.totalSamples++;
                            const isCurrentlyOnTarget = data.x >= videoRect.left && data.x <= videoRect.right && data.y >= videoRect.top && data.y <= videoRect.bottom;
                            if (isCurrentlyOnTarget) {
                                gazeDataCollector.current.onTargetSamples++;
                                if (!isGazingAtTarget) setIsGazingAtTarget(true);
                            } else {
                                if (isGazingAtTarget) setIsGazingAtTarget(false);
                            }
                        });
                        gazeListenerAttachedRef.current = true;
                        console.log("[InitializeWebGazer] Gaze listener attached after 'already started' recovery.");
                    } catch (listenerError) {
                         console.error("[InitializeWebGazer] Failed to set gaze listener after 'already started' error:", listenerError);
                         userErrorMessage = "Eye tracker has an issue (already started, listener fail). Please refresh.";
                         setIsWebGazerReady(false); // Not truly ready
                         setInitializationStatus('Error: Listener attach failed');
                    }
                }
            } else if (e.message && e.message.toLowerCase().includes("video element failed to load")) {
                userErrorMessage += "The video could not be loaded, which is required for eye tracking. Please check the video source.";
                setInitializationStatus('Error: Video Load Fail');
            } else {
                userErrorMessage += "An unexpected error occurred. Check console for details or try refreshing. Details: " + e.message;
                setInitializationStatus('Error: Unknown');
            }
            setFeedback(userErrorMessage);
            setIsWebGazerReady(false); // Explicitly set to false on error
            webGazerFullySetupRef.current = false; // Not fully setup if an error occurred
        } finally {
            // This block executes regardless of try/catch outcome
            // webcamAllowed and isWebGazerReady should reflect the final state
            if (!webGazerFullySetupRef.current) { // Ensure this is false if any
                // path above failed to set it true
                webGazerFullySetupRef.current = false;
            }
            setInitializationStatus(webGazerFullySetupRef.current ? 'Ready' : 'Error');
            setIsInitializing(false); // Stop initializing indicator
        }
    };
    
    
    const handleConfirmCalibration = () => {
        if (webgazerInstance.current) {
            webgazerInstance.current.showPredictionPoints(false);
        }
        setIsCalibrated(true);
        setFeedback("Calibration complete. Click 'Start Practice' when ready.");
        console.log("[Calibration] Calibration confirmed by user.");
    };

    const handleStartPractice = () => {
        if (!isWebGazerReady) {
            setFeedback("Eye tracker is not ready. Please ensure webcam access.");
            return;
        }
        if (!isCalibrated) {
            setFeedback("Please confirm calibration first by clicking various points on the screen and then 'Confirm Calibration'.");
            // Ensure calibration points are visible if somehow hidden
            if (webgazerInstance.current && !webgazerInstance.current.isPredictionPointsVisible()) {
                webgazerInstance.current.showPredictionPoints(true);
            }
            return;
        }
        if (videoRef.current) {
            gazeDataCollector.current = { totalSamples: 0, onTargetSamples: 0 };
            setEyeContactPercentage(0);
            setSessionEnded(false);
            videoRef.current.play().then(() => {
                console.log("[handleStartPractice] video.play() promise resolved.");
                setIsVideoPlaying(true);
                setFeedback("Practice started. Maintain eye contact with the person in the video.");
                if (sourceType === 'webcam') {
                    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
                    sessionTimerRef.current = setTimeout(handleVideoEnd, SESSION_DURATION_MS);
                }
            }).catch(err => {
                console.error("[handleStartPractice] Error starting video playback:", err);
                setFeedback("Error starting video. See console.");
            });
        }
    };
    
    const handleVideoEnd = () => {
        console.log("[VideoEvent] Video ended or session timer expired.");
        if (sessionTimerRef.current) {
            clearTimeout(sessionTimerRef.current);
            sessionTimerRef.current = null;
        }
        setIsVideoPlaying(false);
        setSessionEnded(true);
    
        if (gazeDataCollector.current.totalSamples > 0) {
            const finalPercentage = (gazeDataCollector.current.onTargetSamples / gazeDataCollector.current.totalSamples) * 100;
            setEyeContactPercentage(finalPercentage);
            setFeedback(`Session ended! Eye contact: ${finalPercentage.toFixed(1)}%`);
            if (onSessionComplete) onSessionComplete({ eyeContactPercentage: finalPercentage, duration: sourceType === 'file' ? videoRef.current?.duration : SESSION_DURATION_MS / 1000 });
        } else {
            setFeedback("Session ended. No gaze data was collected.");
            if (onSessionComplete) onSessionComplete({ eyeContactPercentage: 0, duration: sourceType === 'file' ? videoRef.current?.duration : SESSION_DURATION_MS / 1000 });
        }
    };

    const handlePracticeAgain = () => {
        console.log("[PracticeAgain] Resetting for new session.");
        setSessionEnded(false);
        setIsCalibrated(false);
        setIsVideoPlaying(false);
        setEyeContactPercentage(0);
        gazeDataCollector.current = { totalSamples: 0, onTargetSamples: 0 };

        if (webgazerInstance.current) {
            webgazerInstance.current.showPredictionPoints(true); // Show calibration points again
        }
        
        // Reset video to beginning
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
        }
        setFeedback("Click various points on screen to re-calibrate, then click 'Confirm Calibration'.");
        // Potentially reset initializationStatus if needed, or ensure it reflects a ready state for calibration
        if(isWebGazerReady) setInitializationStatus('Ready for Calibration');
    };
    
    let buttonText = "Initializing Tracker...";
    if (initializationStatus === 'Error' && !webcamAllowed) {
        buttonText = "Webcam Access Denied";
    } else if (isInitializing) {
        buttonText = initializationStatus; // Show detailed status like "Initializing (TF Backend)..."
    } else if (!isWebGazerReady) {
        buttonText = "Initialization Failed"; // Or a more specific error from feedback
    } else if (isWebGazerReady && !isVideoPlaying && !sessionEnded) {
        buttonText = "Start Practice";
    } else if (isVideoPlaying) {
        buttonText = "Practice In Progress..."; // Or some other indicator
    } else if (sessionEnded) {
        buttonText = "Practice Again"; // This button is rendered separately but for logic consistency
    }
    let borderColor = '5px solid orange'; // Default when video is not playing
    if (isVideoPlayingRef.current) { // Use the ref for immediate reflection of play state
        borderColor = isGazingAtTargetRef.current ? '5px solid green' : '5px solid red';
    }

    return (
        <div style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
            <h3>Eye Contact Practice Module</h3>
            <p>{feedback}</p>
            {/* Avatar with subtle gaze wandering */}
            
            {webgazerInstance.current && <div id="webgazerVideoFeed" style={{ position: 'absolute', top: '10px', left: '10px', width: '160px', height: '120px', zIndex: 0, display: 'none' }}></div>}
            <div style={{ position: 'relative', width: '640px', margin: '0 auto' }}>
                <video
                    ref={videoRef}
                    width="640"
                    height="480"
                    playsInline
                    style={{ border: borderColor, display: isVideoPlayingRef.current ? 'block' : 'none', margin: '0 auto' }}
                >
                    Your browser does not support the video tag.
                </video>
            </div>

            {!isCalibrated && (
                <button onClick={handleConfirmCalibration} className="btn-primary" style={{ margin: '10px' }}>
                    Confirm Calibration
                </button>
            )}
            {isCalibrated && !isVideoPlaying && !sessionEnded && (
                <button onClick={handleStartPractice} className="btn-primary" style={{ margin: '10px' }}>
                    Start Practice
                </button>
            )}
            {isVideoPlaying && (
                <p>Practice In Progress...</p>
            )}
            {sessionEnded && (
                <button onClick={handlePracticeAgain} className="btn-primary" style={{ margin: '10px' }}>
                    Practice Again
                </button>
            )}

            {sessionEnded && (
                <p>Final Eye Contact: {eyeContactPercentage.toFixed(1)}%</p>
            )}
        </div>
    );
};

export default EyeContactPracticeView;
