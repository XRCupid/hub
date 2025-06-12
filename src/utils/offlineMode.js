// Offline Mode Handler for XRCupid
// Provides fallback functionality when Hume API is unavailable

export const offlineMode = {
  isEnabled: false,
  
  // Check if we should enable offline mode
  checkStatus: () => {
    const humeErrors = localStorage.getItem('hume_error_count') || '0';
    const lastError = localStorage.getItem('hume_last_error');
    
    // Enable offline mode if too many errors or usage limit reached
    if (parseInt(humeErrors) > 5 || (lastError && lastError.includes('usage_limit'))) {
      offlineMode.enable();
      return true;
    }
    
    return false;
  },
  
  // Enable offline mode
  enable: () => {
    offlineMode.isEnabled = true;
    localStorage.setItem('offline_mode', 'true');
    console.log('🔌 Offline mode enabled - using fallback features');
    
    // Show notification to user
    offlineMode.showNotification();
  },
  
  // Disable offline mode
  disable: () => {
    offlineMode.isEnabled = false;
    localStorage.removeItem('offline_mode');
    localStorage.removeItem('hume_error_count');
    console.log('🌐 Online mode restored');
  },
  
  // Show offline notification
  showNotification: () => {
    const notification = document.createElement('div');
    notification.className = 'offline-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fbbf24;
        color: #78350f;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 10px;
      ">
        <span style="font-size: 20px;">🔌</span>
        <div>
          <strong>Offline Mode Active</strong>
          <div style="font-size: 14px;">Using simulated responses for practice</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  },
  
  // Generate mock responses for coaching
  generateCoachResponse: (context) => {
    const responses = {
      greeting: [
        "Hey there! Ready to work on your dating skills?",
        "Welcome back! Let's continue building your confidence.",
        "Great to see you! What would you like to practice today?"
      ],
      encouragement: [
        "That's a great approach! Keep that energy.",
        "You're making excellent progress!",
        "I like how you're thinking about this."
      ],
      tips: [
        "Remember to maintain eye contact and smile naturally.",
        "Try asking open-ended questions to keep the conversation flowing.",
        "Show genuine interest in what they're saying.",
        "Be yourself - authenticity is attractive!"
      ],
      feedback: [
        "Good job! Your confidence is really showing.",
        "That was better! Try to be a bit more relaxed next time.",
        "Excellent! You're getting the hang of this."
      ]
    };
    
    const category = context || 'greeting';
    const categoryResponses = responses[category] || responses.greeting;
    return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
  },
  
  // Simulate emotion detection
  simulateEmotions: () => {
    const emotions = ['neutral', 'happy', 'confident', 'thoughtful'];
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    
    return {
      primary: randomEmotion,
      confidence: 0.7 + Math.random() * 0.3,
      timestamp: Date.now()
    };
  },
  
  // Store practice session data locally
  savePracticeSession: (sessionData) => {
    const sessions = JSON.parse(localStorage.getItem('offline_sessions') || '[]');
    sessions.push({
      ...sessionData,
      timestamp: Date.now(),
      offline: true
    });
    
    // Keep only last 50 sessions
    if (sessions.length > 50) {
      sessions.shift();
    }
    
    localStorage.setItem('offline_sessions', JSON.stringify(sessions));
  },
  
  // Get stored sessions
  getStoredSessions: () => {
    return JSON.parse(localStorage.getItem('offline_sessions') || '[]');
  }
};

// Auto-check on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    if (localStorage.getItem('offline_mode') === 'true') {
      offlineMode.isEnabled = true;
      console.log('🔌 Offline mode already active');
    }
  });
  
  // Make available globally
  window.offlineMode = offlineMode;
}

// Export utilities
export const isOfflineMode = () => offlineMode.isEnabled;
export const getOfflineResponse = (context) => offlineMode.generateCoachResponse(context);
export const simulateEmotion = () => offlineMode.simulateEmotions();
