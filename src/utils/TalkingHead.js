// DEPRECATED: This file is no longer used. See SimulationView.tsx for the new avatar logic.

// Comprehensive logging mock implementation
class MockTalkingHead {
  constructor(container, options) {
    console.error('🚨 Using MOCK TalkingHead implementation');
    console.log('Container:', container);
    console.log('Options:', JSON.stringify(options, null, 2));
    this.container = container;
    this.options = options;
  }

  addEventListener(event, callback) {
    console.warn(`🔔 Mock addEventListener: ${event}`);
    // Simulate event for testing
    if (event === 'modelLoaded') {
      setTimeout(() => {
        console.log('🎉 Mock modelLoaded event triggered');
        callback();
      }, 100);
    }
  }

  setMood(mood) {
    console.warn(`🎭 Mock setMood: ${mood}`);
  }

  dispose() {
    console.warn('🗑️ Mock dispose called');
  }

  speak(text) {
    console.warn(`🗣️ Mock speak called with text: ${text}`);
  }
}

// Global TalkingHead loader with extensive error handling
const loadTalkingHead = () => {
  console.log('🔍 Attempting to load TalkingHead');

  // Check if TalkingHead is already globally available
  if (window.TalkingHead) {
    console.log('✅ TalkingHead already globally available');
    return Promise.resolve(window.TalkingHead);
  }
  return Promise.resolve(MockTalkingHead);
};

// Export a function that returns a promise resolving to TalkingHead
export default loadTalkingHead;
