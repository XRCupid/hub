export async function testMicrophoneAccess() {
  console.log('=== TESTING MICROPHONE ACCESS ===');
  
  try {
    // Get all devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter(d => d.kind === 'audioinput');
    console.log('Audio input devices:', audioInputs);
    
    // Request microphone access
    console.log('Requesting microphone access...');
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } 
    });
    
    console.log('Microphone access granted!');
    console.log('Audio tracks:', stream.getAudioTracks());
    
    // Test audio level
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    source.connect(analyser);
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    let maxLevel = 0;
    const checkLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      if (average > maxLevel) {
        maxLevel = average;
        console.log('Audio level:', average);
      }
    };
    
    // Check levels for 3 seconds
    const interval = setInterval(checkLevel, 100);
    
    setTimeout(() => {
      clearInterval(interval);
      console.log('Max audio level detected:', maxLevel);
      console.log('Speak into the microphone to test if it\'s working');
      
      // Clean up
      stream.getTracks().forEach(track => track.stop());
      audioContext.close();
    }, 3000);
    
    return true;
  } catch (error) {
    console.error('Microphone access error:', error);
    return false;
  }
}

// Auto-expose to window
if (typeof window !== 'undefined') {
  window.testMicrophoneAccess = testMicrophoneAccess;
}
