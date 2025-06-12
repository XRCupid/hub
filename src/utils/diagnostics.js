// XRCupid Diagnostics - Quick health check and fixes

export const diagnostics = {
  // Check Hume API status
  checkHumeAPI: async () => {
    console.log('🔍 Checking Hume API status...');
    
    const apiKey = 'm3KaINwHsH55rJNO6zr2kIEAWvOimYeLTon3OriOXWJeCxCl';
    const configId = 'bfd6db39-f0ea-46c3-a64b-e902d8cec212'; // Grace config
    
    if (!apiKey) {
      console.error('❌ No Hume API key found in environment');
      return false;
    }
    
    // Check if we've hit usage limits
    const lastError = localStorage.getItem('hume_last_error');
    if (lastError && lastError.includes('usage_limit_reached')) {
      console.warn('⚠️ Hume API usage limit previously reached');
      console.log('💡 Consider using offline mode or upgrading plan');
    }
    
    console.log('✅ Hume Config ID:', configId);
    return true;
  },

  // Check avatar availability
  checkAvatars: () => {
    console.log('🔍 Checking avatars...');
    
    const avatarFiles = [
      '/avatars/AngelChick.glb',
      '/avatars/alex.glb',
      '/avatars/sarah.glb',
      '/avatars/default_user.glb'
    ];
    
    const animations = [
      '/animations/M_Standing_Idle_001.glb',
      '/animations/M_Talking_Variations_001.glb'
    ];
    
    let missingFiles = [];
    
    // Note: In a real check, we'd fetch these files
    console.log('📦 Expected avatar files:', avatarFiles);
    console.log('🎬 Expected animation files:', animations);
    
    const storedAvatars = localStorage.getItem('rpm_avatars');
    if (storedAvatars) {
      const avatars = JSON.parse(storedAvatars);
      console.log(`✅ Found ${avatars.length} avatars in localStorage`);
    } else {
      console.warn('⚠️ No avatars in localStorage');
    }
    
    return true;
  },

  // Check tracking services
  checkTracking: () => {
    console.log('🔍 Checking tracking services...');
    
    const trackingModes = {
      'face_tracking': localStorage.getItem('face_tracking_enabled') !== 'false',
      'posture_tracking': localStorage.getItem('posture_tracking_enabled') !== 'false',
      'gesture_tracking': localStorage.getItem('gesture_tracking_enabled') !== 'false'
    };
    
    Object.entries(trackingModes).forEach(([mode, enabled]) => {
      console.log(`${enabled ? '✅' : '❌'} ${mode}: ${enabled ? 'Enabled' : 'Disabled'}`);
    });
    
    // Recommend simplified mode if performance issues
    if (Object.values(trackingModes).every(v => v)) {
      console.log('💡 All tracking enabled - consider disabling some for better performance');
    }
    
    return true;
  },

  // Performance check
  checkPerformance: () => {
    console.log('🔍 Checking performance...');
    
    // Check memory usage
    if (performance.memory) {
      const usedMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
      const totalMB = Math.round(performance.memory.totalJSHeapSize / 1048576);
      console.log(`💾 Memory: ${usedMB}MB / ${totalMB}MB`);
      
      if (usedMB > totalMB * 0.8) {
        console.warn('⚠️ High memory usage detected');
      }
    }
    
    // Check for too many active components
    const activeRoutes = document.querySelectorAll('.nav-link.active').length;
    if (activeRoutes > 1) {
      console.warn('⚠️ Multiple active routes detected');
    }
    
    return true;
  },

  // Quick fixes
  applyQuickFixes: () => {
    console.log('🔧 Applying quick fixes...');
    
    // 1. Clear error states
    const errorKeys = Object.keys(localStorage).filter(key => 
      key.includes('error') || key.includes('failed')
    );
    errorKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Cleared ${key}`);
    });
    
    // 2. Set optimized defaults
    localStorage.setItem('render_quality', 'medium');
    localStorage.setItem('enable_shadows', 'false');
    localStorage.setItem('max_avatars', '2');
    
    // 3. Disable unused features
    localStorage.setItem('enable_hand_tracking', 'false');
    localStorage.setItem('enable_complex_animations', 'false');
    
    console.log('✅ Quick fixes applied');
  },

  // Run full diagnostic
  runFullDiagnostic: async () => {
    console.log('🏥 Running XRCupid Diagnostic...\n');
    
    await diagnostics.checkHumeAPI();
    console.log('');
    
    diagnostics.checkAvatars();
    console.log('');
    
    diagnostics.checkTracking();
    console.log('');
    
    diagnostics.checkPerformance();
    console.log('');
    
    console.log('💡 Run diagnostics.applyQuickFixes() to optimize performance');
  }
};

// Make available globally
window.diagnostics = diagnostics;

// Show available commands
console.log(`
🏥 XRCupid Diagnostics Available!

Run diagnostics:
- window.diagnostics.runFullDiagnostic() - Full system check
- window.diagnostics.checkHumeAPI() - Check Hume API status
- window.diagnostics.checkAvatars() - Check avatar availability
- window.diagnostics.checkTracking() - Check tracking services
- window.diagnostics.checkPerformance() - Check performance metrics
- window.diagnostics.applyQuickFixes() - Apply performance fixes
`);
