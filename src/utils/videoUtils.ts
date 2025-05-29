/**
 * Captures a frame from a video element and returns it as a Blob
 * @param videoElement The HTML video element to capture from
 * @param quality Image quality (0-1)
 * @returns Promise that resolves with the captured frame as a Blob
 */
export async function captureVideoFrame(
  videoElement: HTMLVideoElement,
  quality = 0.8
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      console.error('Could not get canvas context');
      resolve(null);
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    try {
      // Draw the current video frame to the canvas
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Convert to Blob
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        quality
      );
    } catch (error) {
      console.error('Error capturing video frame:', error);
      resolve(null);
    }
  });
}

/**
 * Creates a video element from a MediaStream
 * @param stream MediaStream from getUserMedia or similar
 * @returns Promise that resolves with the created video element
 */
export function createVideoElement(stream: MediaStream): Promise<HTMLVideoElement> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    
    video.onloadedmetadata = () => {
      video.play().then(() => resolve(video));
    };
    
    // Fallback in case onloadedmetadata doesn't fire
    setTimeout(() => {
      if (video.readyState >= 2) { // HAVE_CURRENT_DATA
        video.play().then(() => resolve(video));
      }
    }, 1000);
  });
}

/**
 * Requests camera access and returns the video stream
 * @param constraints MediaStreamConstraints for getUserMedia
 * @returns Promise that resolves with the MediaStream
 */
export async function getCameraStream(
  constraints: MediaStreamConstraints = { 
    video: { 
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'user' 
    },
    audio: false 
  }
): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    console.error('Error accessing camera:', error);
    throw error;
  }
}

/**
 * Sets up a video element with the camera stream and starts frame capture
 * @param videoElement The video element to use
 * @param onFrame Callback for each captured frame
 * @param interval Frame capture interval in ms
 * @returns Cleanup function to stop frame capture
 */
export function setupFrameCapture(
  videoElement: HTMLVideoElement,
  onFrame: (blob: Blob) => void,
  interval = 100 // ~10 FPS
): () => void {
  let isRunning = true;
  let frameId: number;
  
  const captureLoop = async () => {
    if (!isRunning) return;
    
    try {
      if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
        const blob = await captureVideoFrame(videoElement);
        if (blob) {
          onFrame(blob);
        }
      }
    } catch (error) {
      console.error('Error in capture loop:', error);
    }
    
    frameId = window.setTimeout(captureLoop, interval);
  };
  
  // Start the capture loop
  captureLoop();
  
  // Return cleanup function
  return () => {
    isRunning = false;
    if (frameId) {
      window.clearTimeout(frameId);
    }
  };
}
