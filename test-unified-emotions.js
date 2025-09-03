/**
 * Test script for Unified Emotion Service
 * Tests synchronization of facial and voice emotions
 */

import UnifiedEmotionService from './src/services/UnifiedEmotionService.ts';
import HumeAIService from './src/services/HumeAIService.js';

// Test configuration
const TEST_CONFIG = {
  testDuration: 30000, // 30 seconds
  frameInterval: 1000, // Send frame every 1 second
  audioInterval: 500,  // Send audio every 500ms
};

// Mock video element for testing
class MockVideoElement {
  constructor() {
    this.videoWidth = 640;
    this.videoHeight = 480;
    this.paused = false;
    this.readyState = 4; // HAVE_ENOUGH_DATA
  }
}

// Test results collector
class TestResults {
  constructor() {
    this.unifiedEmotions = [];
    this.transcripts = [];
    this.errors = [];
    this.startTime = Date.now();
  }

  addUnifiedEmotion(data) {
    this.unifiedEmotions.push({
      timestamp: Date.now() - this.startTime,
      ...data
    });
    console.log(`[${this.getTime()}] Unified Emotion:`, {
      dominant: data.dominantEmotion,
      intensity: data.emotionIntensity,
      confidence: data.confidence,
      hasFacial: data.facialEmotions.length > 0,
      hasProsody: data.prosodyEmotions.length > 0
    });
  }

  addTranscript(data) {
    this.transcripts.push({
      timestamp: Date.now() - this.startTime,
      ...data
    });
    console.log(`[${this.getTime()}] Transcript:`, {
      text: data.text?.substring(0, 50),
      emotion: data.dominantEmotion,
      confidence: data.confidence
    });
  }

  addError(error) {
    this.errors.push({
      timestamp: Date.now() - this.startTime,
      error: error.message || error
    });
    console.error(`[${this.getTime()}] Error:`, error);
  }

  getTime() {
    const elapsed = Date.now() - this.startTime;
    return `${(elapsed / 1000).toFixed(1)}s`;
  }

  getSummary() {
    const duration = (Date.now() - this.startTime) / 1000;
    const emotionCounts = {};
    const confidenceScores = [];
    
    this.unifiedEmotions.forEach(e => {
      emotionCounts[e.dominantEmotion] = (emotionCounts[e.dominantEmotion] || 0) + 1;
      confidenceScores.push(e.confidence);
    });

    const avgConfidence = confidenceScores.length > 0 
      ? (confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length).toFixed(1)
      : 0;

    return {
      duration: duration.toFixed(1) + 's',
      totalEmotions: this.unifiedEmotions.length,
      totalTranscripts: this.transcripts.length,
      totalErrors: this.errors.length,
      avgConfidence: avgConfidence + '%',
      emotionBreakdown: emotionCounts,
      synchronizationRate: this.calculateSyncRate()
    };
  }

  calculateSyncRate() {
    let synchronized = 0;
    let total = 0;
    
    this.unifiedEmotions.forEach(e => {
      total++;
      if (e.facialEmotions.length > 0 && e.prosodyEmotions.length > 0) {
        synchronized++;
      }
    });
    
    return total > 0 ? ((synchronized / total) * 100).toFixed(1) + '%' : '0%';
  }
}

// Main test function
async function testUnifiedEmotionService() {
  console.log('===========================================');
  console.log('UNIFIED EMOTION SERVICE TEST');
  console.log('===========================================\n');
  
  const results = new TestResults();
  let unifiedService = null;
  let testInterval = null;
  let frameInterval = null;
  
  try {
    // Step 1: Initialize the service
    console.log('Step 1: Initializing UnifiedEmotionService...');
    unifiedService = new UnifiedEmotionService();
    
    // Set up callbacks
    unifiedService.setOnUnifiedEmotionCallback((data) => {
      results.addUnifiedEmotion(data);
    });
    
    unifiedService.setOnTranscriptWithEmotionsCallback((data) => {
      results.addTranscript(data);
    });
    
    unifiedService.setOnErrorCallback((error) => {
      results.addError(error);
    });
    
    console.log('✓ Callbacks configured\n');
    
    // Step 2: Connect the service
    console.log('Step 2: Connecting to Hume services...');
    const mockVideo = new MockVideoElement();
    await unifiedService.connect(mockVideo);
    console.log('✓ Connected successfully\n');
    
    // Step 3: Simulate video frames for facial analysis
    console.log('Step 3: Starting simulated video stream...');
    frameInterval = setInterval(() => {
      // Simulate sending a video frame
      const mockFrame = createMockVideoFrame();
      console.log(`[${results.getTime()}] Sending mock video frame`);
      // In real scenario, the service would capture from video element
    }, TEST_CONFIG.frameInterval);
    console.log('✓ Video simulation started\n');
    
    // Step 4: Simulate audio chunks for voice analysis
    console.log('Step 4: Starting simulated audio stream...');
    testInterval = setInterval(() => {
      const mockAudio = createMockAudioChunk();
      unifiedService.sendAudioData(mockAudio);
      console.log(`[${results.getTime()}] Sent audio chunk (${mockAudio.byteLength} bytes)`);
    }, TEST_CONFIG.audioInterval);
    console.log('✓ Audio simulation started\n');
    
    // Step 5: Run the test for specified duration
    console.log(`Step 5: Running test for ${TEST_CONFIG.testDuration / 1000} seconds...\n`);
    console.log('----------------------------------------');
    console.log('LIVE TEST OUTPUT:');
    console.log('----------------------------------------');
    
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.testDuration));
    
    // Step 6: Stop the test
    console.log('\n----------------------------------------');
    console.log('Step 6: Stopping test...');
    
    clearInterval(testInterval);
    clearInterval(frameInterval);
    
    await unifiedService.disconnect();
    console.log('✓ Disconnected successfully\n');
    
    // Step 7: Display results
    console.log('===========================================');
    console.log('TEST RESULTS:');
    console.log('===========================================');
    const summary = results.getSummary();
    
    console.log('\n📊 Summary Statistics:');
    console.log(`  • Test Duration: ${summary.duration}`);
    console.log(`  • Total Emotions: ${summary.totalEmotions}`);
    console.log(`  • Total Transcripts: ${summary.totalTranscripts}`);
    console.log(`  • Total Errors: ${summary.totalErrors}`);
    console.log(`  • Avg Confidence: ${summary.avgConfidence}`);
    console.log(`  • Sync Rate: ${summary.synchronizationRate}`);
    
    console.log('\n😊 Emotion Breakdown:');
    Object.entries(summary.emotionBreakdown)
      .sort((a, b) => b[1] - a[1])
      .forEach(([emotion, count]) => {
        const percentage = ((count / summary.totalEmotions) * 100).toFixed(1);
        console.log(`  • ${emotion}: ${count} (${percentage}%)`);
      });
    
    // Step 8: Validate results
    console.log('\n✅ Validation:');
    const validations = [
      {
        name: 'Service Connected',
        passed: summary.totalEmotions > 0 || summary.totalTranscripts > 0
      },
      {
        name: 'Emotions Detected',
        passed: summary.totalEmotions > 0
      },
      {
        name: 'Transcripts Captured',
        passed: summary.totalTranscripts > 0
      },
      {
        name: 'Synchronization Working',
        passed: parseFloat(summary.synchronizationRate) > 0
      },
      {
        name: 'No Critical Errors',
        passed: summary.totalErrors === 0
      },
      {
        name: 'Confidence Above Threshold',
        passed: parseFloat(summary.avgConfidence) > 50
      }
    ];
    
    validations.forEach(v => {
      console.log(`  ${v.passed ? '✅' : '❌'} ${v.name}`);
    });
    
    const passedCount = validations.filter(v => v.passed).length;
    const totalCount = validations.length;
    
    console.log('\n===========================================');
    console.log(`TEST ${passedCount === totalCount ? 'PASSED' : 'FAILED'} (${passedCount}/${totalCount} checks passed)`);
    console.log('===========================================');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:', error);
    results.addError(error);
  } finally {
    // Cleanup
    if (testInterval) clearInterval(testInterval);
    if (frameInterval) clearInterval(frameInterval);
    if (unifiedService) {
      try {
        await unifiedService.disconnect();
      } catch (e) {
        console.error('Error during cleanup:', e);
      }
    }
  }
}

// Helper functions
function createMockVideoFrame() {
  // Create a mock base64 image data
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  
  // Draw random colored rectangles to simulate face
  ctx.fillStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
  ctx.fillRect(200, 150, 240, 180);
  
  return canvas.toDataURL('image/jpeg', 0.8);
}

function createMockAudioChunk() {
  // Create mock PCM audio data
  const samples = 1024;
  const buffer = new ArrayBuffer(samples * 2); // 16-bit samples
  const view = new Int16Array(buffer);
  
  // Generate random audio samples
  for (let i = 0; i < samples; i++) {
    view[i] = Math.random() * 32767 - 16384;
  }
  
  return buffer;
}

// Run the test
console.log('🚀 Starting Unified Emotion Service Test...\n');
testUnifiedEmotionService().catch(error => {
  console.error('Fatal test error:', error);
  process.exit(1);
});
