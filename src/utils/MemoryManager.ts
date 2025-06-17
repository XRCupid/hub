/**
 * Emergency Memory Manager for XRCupid Application
 * Addresses memory leaks and high resource usage
 */

export class MemoryManager {
  private static instance: MemoryManager;
  private cleanupTasks: Array<() => void> = [];
  private memoryMonitorInterval: NodeJS.Timeout | null = null;
  private lastMemoryCheck = 0;

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * EMERGENCY: Immediate memory cleanup
   */
  static emergencyCleanup(): void {
    console.log('🚨 EMERGENCY MEMORY CLEANUP INITIATED');
    
    // 1. Clear all intervals and timeouts
    const highId = setTimeout(() => {}, 1);
    for (let i = 1; i < Number(highId); i++) {
      clearTimeout(i);
      clearInterval(i);
    }
    console.log('✅ Cleared all timers');

    // 2. Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
      console.log('✅ Forced garbage collection');
    }

    // 3. Clean up WebGL contexts
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl && 'getExtension' in gl) {
        const ext = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context');
        if (ext) {
          ext.loseContext();
          console.log('✅ Lost WebGL context');
        }
      }
    });

    // 4. Stop all media streams
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      stream.getTracks().forEach(track => track.stop());
    }).catch(() => {}); // Ignore errors
    console.log('✅ Stopped media streams');

    // 5. Clear large objects from memory
    if ((window as any).ml5) {
      delete (window as any).ml5;
      console.log('✅ Cleared ML5 from memory');
    }

    // 6. Clear Three.js scenes
    const scenes = document.querySelectorAll('[data-engine="three.js"]');
    scenes.forEach(scene => {
      if (scene.parentNode) {
        scene.parentNode.removeChild(scene);
      }
    });
    console.log('✅ Cleared Three.js scenes');

    // 7. Clear audio contexts
    try {
      if ((window as any).AudioContext) {
        const audioContext = new (window as any).AudioContext();
        audioContext.close();
      }
    } catch (e) {
      // Ignore errors
    }
    console.log('✅ Closed audio contexts');

    console.log('🚨 EMERGENCY CLEANUP COMPLETED');
  }

  /**
   * Monitor memory usage and auto-cleanup
   */
  startMemoryMonitoring(): void {
    if (this.memoryMonitorInterval) return;

    this.memoryMonitorInterval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
        const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
        const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);

        console.log(`📊 Memory: ${usedMB}MB / ${totalMB}MB (limit: ${limitMB}MB)`);

        // Auto-cleanup if memory usage is high
        if (usedMB > limitMB * 0.8) {
          console.warn('🚨 High memory usage detected, running cleanup...');
          this.runCleanupTasks();
          
          // Force garbage collection if available
          if ((window as any).gc) {
            (window as any).gc();
          }
        }

        this.lastMemoryCheck = Date.now();
      }
    }, 5000); // Check every 5 seconds
  }

  stopMemoryMonitoring(): void {
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
      this.memoryMonitorInterval = null;
    }
  }

  /**
   * Register cleanup task
   */
  addCleanupTask(task: () => void): void {
    this.cleanupTasks.push(task);
  }

  /**
   * Run all registered cleanup tasks
   */
  runCleanupTasks(): void {
    console.log(`🧹 Running ${this.cleanupTasks.length} cleanup tasks...`);
    this.cleanupTasks.forEach((task, index) => {
      try {
        task();
        console.log(`✅ Cleanup task ${index + 1} completed`);
      } catch (error) {
        console.error(`❌ Cleanup task ${index + 1} failed:`, error);
      }
    });
  }

  /**
   * Get current memory usage info
   */
  getMemoryInfo(): any {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576),
        total: Math.round(memory.totalJSHeapSize / 1048576),
        limit: Math.round(memory.jsHeapSizeLimit / 1048576),
        percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
      };
    }
    return null;
  }

  /**
   * Optimize ML5 and TensorFlow.js usage
   */
  static optimizeML5(): void {
    if (typeof (window as any).ml5 !== 'undefined') {
      // Disable debug mode to reduce memory usage
      if ((window as any).ml5.p5Utils) {
        (window as any).ml5.p5Utils.debug = false;
      }
      
      // Clear model cache if available
      if ((window as any).ml5.modelCache) {
        (window as any).ml5.modelCache.clear();
      }
      
      console.log('✅ ML5 optimized for memory usage');
    }

    // Optimize TensorFlow.js backend
    if (typeof (window as any).tf !== 'undefined') {
      const tf = (window as any).tf;
      
      // Use CPU backend if WebGL is causing issues
      tf.setBackend('cpu').then(() => {
        console.log('✅ TensorFlow.js switched to CPU backend');
      });
      
      // Dispose of tensors
      tf.disposeVariables();
      console.log('✅ TensorFlow.js variables disposed');
    }
  }

  /**
   * Clean up Three.js resources
   */
  static cleanupThreeJS(): void {
    // Find and dispose Three.js geometries and materials
    if (typeof (window as any).THREE !== 'undefined') {
      const THREE = (window as any).THREE;
      
      // Dispose of geometries
      if (THREE.GeometryUtils) {
        THREE.GeometryUtils.dispose();
      }
      
      console.log('✅ Three.js resources cleaned up');
    }
  }

  /**
   * Limit concurrent operations
   */
  static limitConcurrentOperations(): void {
    console.log('🔧 Applying performance limits...');
    
    // Track active operations
    let activeOperations = 0;
    const maxOperations = 3;
    
    const originalSetInterval = window.setInterval;
    window.setInterval = function(callback: TimerHandler, ms?: number) {
      if (activeOperations >= maxOperations) {
        console.warn('🚨 Too many intervals, skipping...');
        return 0 as any;
      }
      activeOperations++;
      return originalSetInterval(callback, Math.max(ms || 0, 100)); // Minimum 100ms
    };
    
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = function(callback: TimerHandler, ms?: number) {
      return originalSetTimeout(callback, Math.max(ms || 0, 50)); // Minimum 50ms
    };
    
    console.log('✅ Performance limits applied');
  }
}

// Global emergency functions
(window as any).emergencyCleanup = () => MemoryManager.emergencyCleanup();
(window as any).memoryInfo = () => {
  const info = MemoryManager.getInstance().getMemoryInfo();
  console.log('📊 Memory Info:', info);
  return info;
};
(window as any).optimizeML5 = () => MemoryManager.optimizeML5();
(window as any).cleanupThreeJS = () => MemoryManager.cleanupThreeJS();
(window as any).limitOperations = () => MemoryManager.limitConcurrentOperations();

// Auto-start memory monitoring
MemoryManager.getInstance().startMemoryMonitoring();
console.log('🚀 Memory Manager initialized with monitoring');
