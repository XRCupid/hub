/**
 * PiP Tracking Diagnostic Utility
 * Run in browser console to diagnose PiP tracking issues
 */

window.diagnosePiPTracking = function() {
  console.log('🔍 PiP TRACKING DIAGNOSTIC');
  console.log('========================');
  
  // Check ML5 availability
  console.log('📦 ML5 Status:');
  console.log('  - ML5 Available:', typeof window.ml5 !== 'undefined');
  console.log('  - ML5 Version:', window.ml5?.version || 'N/A');
  console.log('  - FaceMesh Available:', typeof window.ml5?.facemesh === 'function');
  console.log('  - PoseNet Available:', typeof window.ml5?.poseNet === 'function');
  
  // Check WebGL
  console.log('🎮 WebGL Status:');
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    console.log('  - WebGL Available:', !!gl);
    console.log('  - WebGL Renderer:', gl ? gl.getParameter(gl.RENDERER) : 'N/A');
  } catch (e) {
    console.log('  - WebGL Available: false (error)');
  }
  
  // Check camera permissions
  console.log('📹 Camera Status:');
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => {
        console.log('  - Camera Permission: GRANTED');
      })
      .catch((err) => {
        console.log('  - Camera Permission: DENIED or UNAVAILABLE');
        console.log('  - Error:', err.message);
      });
  } else {
    console.log('  - Camera API: NOT AVAILABLE');
  }
  
  // Check for existing PiP components
  console.log('👁️ PiP Components:');
  const pipElements = document.querySelectorAll('[class*="pip"], [class*="PiP"]');
  console.log('  - PiP Elements Found:', pipElements.length);
  pipElements.forEach((el, i) => {
    console.log(`  - Element ${i+1}:`, el.className, el.style.display !== 'none' ? 'VISIBLE' : 'HIDDEN');
  });
  
  // Check for UserAvatarPiP specifically
  const userAvatarPips = document.querySelectorAll('[class*="user-avatar-pip"]');
  console.log('  - UserAvatarPiP Elements:', userAvatarPips.length);
  
  // Check for tracking services in global scope
  console.log('🔬 Tracking Services:');
  console.log('  - CombinedFaceTrackingService in window:', 'CombinedFaceTrackingService' in window);
  console.log('  - FallbackFaceTracking in window:', 'FallbackFaceTracking' in window);
  
  console.log('========================');
  console.log('💡 Tips:');
  console.log('  - If ML5 is not available, fallback tracking should activate');
  console.log('  - If camera is denied, tracking may not work properly');
  console.log('  - Check React DevTools for component state');
  console.log('  - Look for [UserAvatarPiP] logs in console');
  
  return {
    ml5Available: typeof window.ml5 !== 'undefined',
    webglAvailable: !!document.createElement('canvas').getContext('webgl'),
    pipElementsCount: pipElements.length
  };
};

// Auto-run diagnostic
console.log('🚀 PiP Diagnostic loaded! Run diagnosePiPTracking() to check status');
