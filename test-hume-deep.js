const { HumeClient } = require('hume');
const http = require('http');
const https = require('https');

// Log all HTTP/HTTPS requests
console.log('Setting up request logging...');

const originalHttpRequest = http.request;
const originalHttpsRequest = https.request;

http.request = function() {
  const req = originalHttpRequest.apply(this, arguments);
  console.log(`[HTTP] ${arguments[0]?.method || 'GET'} ${arguments[0]?.href || arguments[0]?.hostname}`);
  return req;
};

https.request = function() {
  const req = originalHttpsRequest.apply(this, arguments);
  console.log(`[HTTPS] ${arguments[0]?.method || 'GET'} ${arguments[0]?.href || arguments[0]?.hostname}`);
  return req;
};

async function testHumeConnection() {
  console.log('\n=== Starting Hume Deep Test ===');
  
  // Load environment variables from .env.local
  require('dotenv').config({ path: '.env.local' });
  
  const apiKey = process.env.REACT_APP_HUME_API_KEY;
  const secretKey = process.env.REACT_APP_HUME_SECRET_KEY;
  
  if (!apiKey || !secretKey) {
    console.error('Error: Missing Hume API credentials in .env.local');
    console.error('Please ensure you have:');
    console.error('REACT_APP_HUME_API_KEY=your_api_key');
    console.error('REACT_APP_HUME_SECRET_KEY=your_secret_key');
    return;
  }

  console.log('\n[1] Creating HumeClient...');
  const client = new HumeClient({ 
    apiKey, 
    secretKey,
    // Force new connection pool
    httpAgent: new http.Agent({ keepAlive: false }),
    httpsAgent: new https.Agent({ keepAlive: false })
  });

  try {
    console.log('\n[2] Attempting to list available configs...');
    const configs = await client.empathicVoice.listConfigs();
    console.log('Available configs:', JSON.stringify(configs, null, 2));
    
    console.log('\n[3] Attempting to connect with default config...');
    const socket = await client.empathicVoice.chat.connect({ 
      configId: 'default',
      debug: true
    });

    console.log('\n[4] Setting up WebSocket event handlers...');
    
    socket.on('open', () => {
      console.log('\n[WebSocket] Connection opened');
      console.log('[WebSocket] Sending test message...');
      socket.sendUserInput('Hello, testing connection');
    });

    socket.on('message', (msg) => {
      console.log('\n[WebSocket] Message received:', JSON.stringify(msg, null, 2));
    });

    socket.on('error', (err) => {
      console.error('\n[WebSocket] Error:', err);
    });

    socket.on('close', () => {
      console.log('\n[WebSocket] Connection closed');
    });

    // Close after 30 seconds
    setTimeout(() => {
      console.log('\n[Test] Closing WebSocket after timeout...');
      socket.close();
      process.exit(0);
    }, 30000);

  } catch (error) {
    console.error('\n[Error] Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testHumeConnection().catch(console.error);
