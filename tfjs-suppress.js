// This script suppresses TensorFlow.js warnings at the earliest possible stage
// It must be loaded before any TensorFlow-related scripts

(function() {
  'use strict';
  
  // Store original console methods
  const originalWarn = console.warn;
  const originalLog = console.log;
  const originalError = console.error;
  
  // Track if we've seen the TF warnings to avoid spam
  const seenWarnings = new Set();
  
  // Create wrapper function
  const createWrapper = (originalMethod, methodName) => {
    return function(...args) {
      // Get the first argument which is usually the message
      const firstArg = args[0];
      const message = String(firstArg);
      
      // List of exact messages to suppress
      const suppressMessages = [
        'webgl backend was already registered. Reusing existing backend factory.',
        'cpu backend was already registered. Reusing existing backend factory.',
        'Platform browser has already been set. Overwriting the platform with',
        'backend was already registered',
        'backend factory'
      ];
      
      // Check for kernel registration messages
      const isKernelMessage = message.includes('The kernel') && message.includes('for backend') && message.includes('is already registered');
      
      // Check if this is a message we want to suppress
      const shouldSuppress = suppressMessages.some(msg => message.includes(msg)) || isKernelMessage;
      
      if (shouldSuppress) {
        // For suppressed messages, add to seen set and skip
        seenWarnings.add(message);
        return;
      }
      
      // For all other messages, call the original method
      return originalMethod.apply(console, args);
    };
  };
  
  // Apply wrappers
  console.warn = createWrapper(originalWarn, 'warn');
  console.log = createWrapper(originalLog, 'log');
  console.error = createWrapper(originalError, 'error');
  
  // Also intercept console methods added by other scripts
  let interceptCount = 0;
  const maxIntercepts = 50;
  
  const interceptor = setInterval(() => {
    interceptCount++;
    
    // Re-wrap if methods have been replaced
    if (console.warn !== createWrapper(originalWarn, 'warn')) {
      const currentWarn = console.warn;
      console.warn = function(...args) {
        const wrapper = createWrapper(originalWarn, 'warn');
        return wrapper.apply(this, args);
      };
    }
    
    if (console.log !== createWrapper(originalLog, 'log')) {
      const currentLog = console.log;
      console.log = function(...args) {
        const wrapper = createWrapper(originalLog, 'log');
        return wrapper.apply(this, args);
      };
    }
    
    // Stop after a reasonable number of attempts
    if (interceptCount >= maxIntercepts) {
      clearInterval(interceptor);
    }
  }, 100);
  
  // Use the original log to confirm activation
  originalLog('[tfjs-suppress] TensorFlow warning suppression activated');
})();
