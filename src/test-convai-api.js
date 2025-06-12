// Test Convai API connection
const WebSocket = require('ws');
const API_KEY = 'e40c1b9f6a1e16cd16b285e4b3b6884c';

async function testConvaiAPI() {
  try {
    // Test character info endpoint
    const response = await fetch('https://api.convai.com/character/info', {
      method: 'POST',
      headers: {
        'CONVAI-API-KEY': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        charID: 'test' // Try with a test character ID
      })
    });
    
    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response text:', text);
    
    if (!response.ok) {
      // Try WebSocket approach
      console.log('\nTrying WebSocket connection...');
      testWebSocket();
    }
    
  } catch (error) {
    console.error('Error testing Convai API:', error);
  }
}

function testWebSocket() {
  const ws = new WebSocket('wss://api.convai.com/character/getResponse');
  
  ws.on('open', () => {
    console.log('WebSocket connected');
    ws.send(JSON.stringify({
      apiKey: API_KEY,
      charID: 'test',
      sessionID: 'test-session',
      userText: 'Hello'
    }));
  });
  
  ws.on('message', (data) => {
    console.log('WebSocket message:', data.toString());
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  ws.on('close', () => {
    console.log('WebSocket closed');
  });
}

// Run the test
testConvaiAPI();
