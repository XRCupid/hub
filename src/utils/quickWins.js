// Quick Wins for XRCupid - Immediate Improvements

export const quickWins = {
  // 1. Clear localStorage of broken data
  clearBrokenData: () => {
    const keysToRemove = [
      'hume_api_usage_exceeded',
      'broken_avatar_cache',
      'failed_tracking_sessions'
    ];
    
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`✅ Removed ${key}`);
      }
    });
    
    console.log('✨ Cleaned up localStorage');
  },

  // 2. Add default working avatars
  addDefaultAvatars: () => {
    const defaultAvatars = [
      {
        id: 'coach_alex',
        name: 'Alex (Coach)',
        url: '/avatars/alex.glb',
        type: 'coach'
      },
      {
        id: 'sarah_npc',
        name: 'Sarah',
        url: '/avatars/sarah.glb',
        type: 'npc'
      },
      {
        id: 'user_default',
        name: 'Your Avatar',
        url: '/avatars/default_user.glb',
        type: 'user'
      }
    ];

    localStorage.setItem('rpm_avatars', JSON.stringify(defaultAvatars));
    console.log('✅ Added default avatars');
  },

  // 3. Set simplified UI mode
  enableSimplifiedMode: () => {
    localStorage.setItem('ui_mode', 'simplified');
    localStorage.setItem('show_tech_demos', 'false');
    localStorage.setItem('focus_mode', 'dating_coach');
    console.log('✅ Enabled simplified UI mode');
  },

  // 4. Reset Hume configuration
  resetHumeConfig: () => {
    // Clear any cached Hume errors
    const humeKeys = Object.keys(localStorage).filter(key => 
      key.includes('hume') && key.includes('error')
    );
    humeKeys.forEach(key => localStorage.removeItem(key));
    
    // Set the correct config ID from memories
    localStorage.setItem('hume_config_id', '9c6f9d9b-1699-41bb-b335-9925bba5d6d9');
    console.log('✅ Reset Hume configuration');
  },

  // 5. Initialize practice scenarios
  setupPracticeScenarios: () => {
    const scenarios = [
      {
        id: 'first_coffee',
        name: 'Coffee Date',
        difficulty: 'beginner',
        duration: '15min',
        skills: ['conversation', 'eye_contact', 'body_language']
      },
      {
        id: 'dinner_date',
        name: 'Dinner Date',
        difficulty: 'intermediate',
        duration: '30min',
        skills: ['conversation', 'humor', 'storytelling', 'active_listening']
      },
      {
        id: 'video_call',
        name: 'Video Date',
        difficulty: 'beginner',
        duration: '20min',
        skills: ['camera_presence', 'conversation', 'tech_comfort']
      }
    ];
    
    localStorage.setItem('practice_scenarios', JSON.stringify(scenarios));
    console.log('✅ Setup practice scenarios');
  },

  // Run all quick wins
  runAll: () => {
    console.log('🚀 Running all XRCupid quick wins...\n');
    
    quickWins.clearBrokenData();
    quickWins.addDefaultAvatars();
    quickWins.enableSimplifiedMode();
    quickWins.resetHumeConfig();
    quickWins.setupPracticeScenarios();
    
    console.log('\n✨ All quick wins completed! Refresh the page to see changes.');
  }
};

// Make available in browser console
window.quickWins = quickWins;

// Auto-run message
console.log(`
🎯 XRCupid Quick Wins Available!

Run window.quickWins.runAll() to apply all improvements, or run individually:
- window.quickWins.clearBrokenData()
- window.quickWins.addDefaultAvatars()
- window.quickWins.enableSimplifiedMode()
- window.quickWins.resetHumeConfig()
- window.quickWins.setupPracticeScenarios()
`);
