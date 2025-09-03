#!/usr/bin/env node

/**
 * Test script for complete Hume integration
 * Tests voice, prosody, and facial emotion services
 */

import HumeVoiceService from './src/services/humeVoiceService.js';
import HumeAIService from './src/services/HumeAIService.js';

console.log('🧪 Starting Hume Integration Test Suite...\n');

// Test configuration
const TEST_DURATION = 30000; // 30 seconds
let testResults = {
  voice: { connected: false, errors: [], messages: 0 },
  prosody: { connected: false, errors: [], emotions: 0 },
  facial: { connected: false, errors: [], emotions: 0 },
  speechToText: { connected: false, errors: [], transcripts: 0 },
  fallback: { tested: false, working: false }
};

// 1. Test Voice Service
async function testVoiceService() {
  console.log('📞 Testing Hume Voice Service...');
  const voiceService = new HumeVoiceService();
  
  try {
    // Set up callbacks to track functionality
    voiceService.setOnOpenCallback(() => {
      console.log('✅ Voice service connected');
      testResults.voice.connected = true;
    });
    
    voiceService.setOnMessageCallback((message) => {
      testResults.voice.messages++;
      console.log(`📨 Voice message received: ${message.type || 'unknown'}`);
    });
    
    voiceService.setOnEmotionCallback((emotions) => {
      testResults.prosody.emotions++;
      console.log(`🎭 Prosody emotions detected: ${emotions.slice(0, 3).map(e => `${e.name}:${e.score}%`).join(', ')}`);
    });
    
    voiceService.setOnTranscriptCallback((transcript) => {
      testResults.speechToText.transcripts++;
      console.log(`📝 Speech transcript: "${transcript.text.substring(0, 50)}..."`);
    });
    
    voiceService.setOnErrorCallback((error) => {
      testResults.voice.errors.push(error.message);
      console.error(`❌ Voice error: ${error.message}`);
    });
    
    // Connect to service
    await voiceService.connect();
    testResults.voice.connected = true;
    
    // Wait for some activity
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test disconnect
    await voiceService.disconnect();
    console.log('✅ Voice service disconnected cleanly');
    
  } catch (error) {
    testResults.voice.errors.push(error.message);
    console.error(`❌ Voice service test failed: ${error.message}`);
  }
}

// 2. Test Facial Emotion Service
async function testFacialService() {
  console.log('\n😊 Testing Hume Facial Emotion Service...');
  const humeService = new HumeAIService();
  
  try {
    // Connect facial analysis
    const socket = humeService.connectFacial((data) => {
      if (data.predictions && data.predictions.length > 0) {
        testResults.facial.emotions++;
        const topEmotion = data.predictions[0].emotions.sort((a, b) => b.score - a.score)[0];
        console.log(`😊 Facial emotion detected: ${topEmotion.name} (${(topEmotion.score * 100).toFixed(1)}%)`);
      }
      if (data.error) {
        testResults.facial.errors.push(data.error);
        console.error(`❌ Facial error: ${data.error}`);
      }
    });
    
    if (socket) {
      testResults.facial.connected = true;
      console.log('✅ Facial service connected');
    }
    
    // Wait for some activity
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Disconnect
    humeService.disconnect();
    console.log('✅ Facial service disconnected cleanly');
    
  } catch (error) {
    testResults.facial.errors.push(error.message);
    console.error(`❌ Facial service test failed: ${error.message}`);
  }
}

// 3. Test Fallback Mechanisms
async function testFallbackMode() {
  console.log('\n🔄 Testing Fallback Mechanisms...');
  const voiceService = new HumeVoiceService();
  
  try {
    // Force fallback by using invalid credentials
    process.env.REACT_APP_HUME_API_KEY = 'invalid_key';
    
    await voiceService.fallbackConnect();
    testResults.fallback.tested = true;
    
    if (voiceService.isConnected) {
      testResults.fallback.working = true;
      console.log('✅ Fallback mode activated successfully');
      
      // Check if default emotions are set
      const emotions = voiceService.lastEmotions;
      if (emotions && emotions.length > 0) {
        console.log(`✅ Default emotions set: ${emotions.map(e => `${e.name}:${e.score}%`).join(', ')}`);
      }
    }
    
    await voiceService.disconnect();
    console.log('✅ Fallback mode disconnected cleanly');
    
  } catch (error) {
    console.error(`❌ Fallback test failed: ${error.message}`);
  }
}

// 4. Test Reconnection Logic
async function testReconnection() {
  console.log('\n🔁 Testing Reconnection Logic...');
  const voiceService = new HumeVoiceService();
  
  try {
    let reconnectCount = 0;
    
    voiceService.setOnCloseCallback((code, reason) => {
      console.log(`🔌 Connection closed: ${reason} (code: ${code})`);
    });
    
    voiceService.setOnOpenCallback(() => {
      reconnectCount++;
      console.log(`✅ Connection opened (attempt #${reconnectCount})`);
    });
    
    // Connect initially
    await voiceService.connect();
    
    // Simulate connection loss
    console.log('📡 Simulating connection loss...');
    const ws = voiceService.getUnderlyingWebSocket();
    if (ws) {
      ws.close();
    }
    
    // Wait for reconnection
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    if (reconnectCount > 1) {
      console.log(`✅ Reconnection successful (${reconnectCount} total connections)`);
    } else {
      console.log('⚠️ Reconnection may not have triggered');
    }
    
    await voiceService.disconnect();
    
  } catch (error) {
    console.error(`❌ Reconnection test failed: ${error.message}`);
  }
}

// Main test runner
async function runAllTests() {
  console.log('=====================================');
  console.log('     HUME INTEGRATION TEST SUITE     ');
  console.log('=====================================\n');
  
  // Run tests sequentially
  await testVoiceService();
  await testFacialService();
  await testFallbackMode();
  await testReconnection();
  
  // Print summary
  console.log('\n=====================================');
  console.log('           TEST SUMMARY              ');
  console.log('=====================================\n');
  
  console.log('Voice Service:');
  console.log(`  Connected: ${testResults.voice.connected ? '✅' : '❌'}`);
  console.log(`  Messages: ${testResults.voice.messages}`);
  console.log(`  Errors: ${testResults.voice.errors.length}`);
  
  console.log('\nProsody Analysis:');
  console.log(`  Emotions detected: ${testResults.prosody.emotions}`);
  
  console.log('\nFacial Analysis:');
  console.log(`  Connected: ${testResults.facial.connected ? '✅' : '❌'}`);
  console.log(`  Emotions detected: ${testResults.facial.emotions}`);
  console.log(`  Errors: ${testResults.facial.errors.length}`);
  
  console.log('\nSpeech-to-Text:');
  console.log(`  Transcripts: ${testResults.speechToText.transcripts}`);
  
  console.log('\nFallback Mode:');
  console.log(`  Tested: ${testResults.fallback.tested ? '✅' : '❌'}`);
  console.log(`  Working: ${testResults.fallback.working ? '✅' : '❌'}`);
  
  const totalErrors = testResults.voice.errors.length + testResults.facial.errors.length;
  console.log(`\nTotal Errors: ${totalErrors}`);
  
  if (totalErrors > 0) {
    console.log('\n⚠️ Some tests encountered errors. Review the output above for details.');
  } else {
    console.log('\n✅ All tests completed successfully!');
  }
  
  process.exit(totalErrors > 0 ? 1 : 0);
}

// Run the tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
