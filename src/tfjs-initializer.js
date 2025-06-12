// Initialize TensorFlow.js with proper backend setup and console suppression
(() => {
  let suppressionInterval = null;
  const originalWarn = console.warn;
  const originalLog = console.log;
  const originalError = console.error;
  
  // TensorFlow-specific patterns to suppress
  const tfPatterns = [
    /webgl backend was already registered/i,
    /cpu backend was already registered/i,
    /Platform browser has already been set/i,
    /The kernel '.*' for backend '.*' is already registered/i,
    /backend was already registered/i,
    /is already registered/i
  ];
  
  // Enhanced console override function
  const createOverride = (originalFn, fnName) => {
    return function(...args) {
      // Convert all arguments to strings for checking
      const message = args.map(arg => {
        if (typeof arg === 'string') return arg;
        if (arg && arg.toString) return arg.toString();
        return String(arg);
      }).join(' ');
      
      // Check if this is a TensorFlow warning we want to suppress
      const shouldSuppress = tfPatterns.some(pattern => pattern.test(message));
      
      if (!shouldSuppress) {
        // Call the original function with original arguments
        return originalFn.apply(console, args);
      }
      // Suppress the message by not calling the original function
    };
  };
  
  // Apply console suppression
  const applySuppression = () => {
    console.warn = createOverride(originalWarn, 'warn');
    console.log = createOverride(originalLog, 'log');
    console.error = createOverride(originalError, 'error');
  };
  
  // Apply suppression immediately
  applySuppression();
  
  // Keep reapplying for the first 5 seconds to combat other overrides
  suppressionInterval = setInterval(() => {
    applySuppression();
  }, 100);
  
  // Stop reapplying after 5 seconds
  setTimeout(() => {
    if (suppressionInterval) {
      clearInterval(suppressionInterval);
    }
  }, 5000);
})();

// Singleton TensorFlow instance
let tfInstance = null;
let initializationPromise = null;

// Function to check if ML5 has already loaded TensorFlow
function isML5TensorFlowLoaded() {
  // Check if ML5 is loaded and has initialized TensorFlow
  if (typeof window !== 'undefined' && window.ml5) {
    // ML5 bundles its own TensorFlow, so if ML5 is present, TF is likely loaded
    return true;
  }
  return false;
}

// Idempotent TensorFlow initialization
async function initializeTensorFlow() {
  if (initializationPromise) {
    return initializationPromise;
  }
  
  initializationPromise = (async () => {
    // If ML5 is loaded, don't load our own TensorFlow - use ML5's bundled version
    if (isML5TensorFlowLoaded()) {
      console.log('[tfjs-initializer] ML5 detected, skipping separate TensorFlow initialization');
      // Return null to indicate we're not loading TensorFlow
      return null;
    }
    
    // Check if TensorFlow is already loaded globally
    if (typeof window !== 'undefined' && window.tf) {
      tfInstance = window.tf;
      console.log('[tfjs-initializer] Using existing global TensorFlow instance');
      return window.tf;
    }
    
    // IMPORTANT: Only import TensorFlow if ML5 is NOT present
    // This prevents webpack from bundling TensorFlow when using ML5
    console.warn('[tfjs-initializer] No ML5 detected and no TensorFlow found. ML5 should be loaded for face tracking.');
    return null;
  })();
  
  return initializationPromise;
}

// Initialize on module load only if ML5 is not present
if (!isML5TensorFlowLoaded()) {
  initializeTensorFlow().catch(error => {
    console.error('[tfjs-initializer] Auto-initialization failed:', error);
  });
}

// Export for use in other modules
export { initializeTensorFlow };
export default tfInstance;
