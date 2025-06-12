// Performance Monitor for XRCupid
// Tracks and optimizes app performance

export const performanceMonitor = {
  metrics: {
    fps: 0,
    memory: 0,
    loadTime: 0,
    renderTime: 0
  },
  
  isMonitoring: false,
  lastFrameTime: 0,
  frameCount: 0,
  
  // Start monitoring
  start: function() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    
    // Monitor FPS
    const checkFPS = () => {
      if (!this.isMonitoring) return;
      
      const currentTime = performance.now();
      const deltaTime = currentTime - this.lastFrameTime;
      
      this.frameCount++;
      
      // Calculate FPS every second
      if (deltaTime >= 1000) {
        this.metrics.fps = Math.round((this.frameCount * 1000) / deltaTime);
        this.frameCount = 0;
        this.lastFrameTime = currentTime;
        
        // Check memory if available
        if (performance.memory) {
          this.metrics.memory = Math.round(performance.memory.usedJSHeapSize / 1048576);
        }
        
        // Log if performance is poor
        if (this.metrics.fps < 30) {
          console.warn('⚠️ Low FPS detected:', this.metrics.fps);
          this.suggestOptimizations();
        }
      }
      
      requestAnimationFrame(checkFPS);
    };
    
    checkFPS();
    console.log('📊 Performance monitoring started');
  },
  
  // Stop monitoring
  stop: function() {
    this.isMonitoring = false;
    console.log('📊 Performance monitoring stopped');
  },
  
  // Get current metrics
  getMetrics: function() {
    return {
      ...this.metrics,
      timestamp: Date.now()
    };
  },
  
  // Suggest optimizations based on metrics
  suggestOptimizations: function() {
    const suggestions = [];
    
    if (this.metrics.fps < 30) {
      suggestions.push('Reduce avatar quality or disable animations');
      suggestions.push('Close unnecessary background tabs');
    }
    
    if (this.metrics.memory > 500) {
      suggestions.push('Clear browser cache');
      suggestions.push('Reload the page to free memory');
    }
    
    if (suggestions.length > 0) {
      console.log('💡 Performance suggestions:', suggestions);
      this.applyAutoOptimizations();
    }
    
    return suggestions;
  },
  
  // Apply automatic optimizations
  applyAutoOptimizations: function() {
    // Reduce quality settings
    localStorage.setItem('render_quality', 'low');
    localStorage.setItem('enable_shadows', 'false');
    localStorage.setItem('animation_quality', 'simple');
    
    // Disable non-essential features
    localStorage.setItem('enable_particles', 'false');
    localStorage.setItem('enable_post_processing', 'false');
    
    console.log('✅ Auto-optimizations applied');
  },
  
  // Create performance report
  generateReport: function() {
    const report = {
      metrics: this.getMetrics(),
      suggestions: this.suggestOptimizations(),
      settings: {
        renderQuality: localStorage.getItem('render_quality') || 'medium',
        shadowsEnabled: localStorage.getItem('enable_shadows') !== 'false',
        animationQuality: localStorage.getItem('animation_quality') || 'full'
      },
      timestamp: new Date().toISOString()
    };
    
    // Save report
    const reports = JSON.parse(localStorage.getItem('performance_reports') || '[]');
    reports.push(report);
    
    // Keep only last 10 reports
    if (reports.length > 10) {
      reports.shift();
    }
    
    localStorage.setItem('performance_reports', JSON.stringify(reports));
    
    return report;
  },
  
  // Quick performance test
  runQuickTest: async function() {
    console.log('🏃 Running performance test...');
    
    const startTime = performance.now();
    
    // Test 1: DOM manipulation
    const testDiv = document.createElement('div');
    for (let i = 0; i < 1000; i++) {
      testDiv.innerHTML = `Test ${i}`;
    }
    
    // Test 2: Array operations
    const testArray = new Array(10000).fill(0).map((_, i) => i * 2);
    const sum = testArray.reduce((a, b) => a + b, 0);
    
    // Test 3: Object creation
    const objects = [];
    for (let i = 0; i < 1000; i++) {
      objects.push({ id: i, value: Math.random() });
    }
    
    const endTime = performance.now();
    const testDuration = endTime - startTime;
    
    const rating = testDuration < 50 ? 'Excellent' :
                   testDuration < 100 ? 'Good' :
                   testDuration < 200 ? 'Fair' : 'Poor';
    
    console.log(`✅ Performance test completed in ${testDuration.toFixed(2)}ms - ${rating}`);
    
    return {
      duration: testDuration,
      rating: rating
    };
  }
};

// Auto-start monitoring if enabled
if (typeof window !== 'undefined') {
  window.performanceMonitor = performanceMonitor;
  
  // Start monitoring after page load
  window.addEventListener('load', () => {
    if (localStorage.getItem('enable_performance_monitoring') !== 'false') {
      setTimeout(() => {
        performanceMonitor.start();
      }, 2000);
    }
  });
}
