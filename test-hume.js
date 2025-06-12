const { HumeClient } = require('hume');
require('dotenv').config({ path: '.env.local' });

async function testHumeConnection() {
  console.log('Testing Hume connection...');
  console.log('Environment file:', '.env.local');
  
  // Support both naming conventions
  const apiKey = process.env.REACT_APP_HUME_API_KEY || process.env.REACT_APP_HUME_CLIENT_ID;
  const secretKey = process.env.REACT_APP_HUME_SECRET_KEY || process.env.REACT_APP_HUME_CLIENT_SECRET;
  
  console.log('API Key present:', !!apiKey);
  console.log('API Key preview:', apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET');
  console.log('Secret Key present:', !!secretKey);
  console.log('Secret Key preview:', secretKey ? secretKey.substring(0, 10) + '...' : 'NOT SET');
  console.log('Config ID from env:', process.env.REACT_APP_HUME_CONFIG_ID);

  if (!apiKey || !secretKey) {
    console.error('Missing required credentials');
    console.error('Found variables:');
    console.error('- REACT_APP_HUME_API_KEY:', !!process.env.REACT_APP_HUME_API_KEY);
    console.error('- REACT_APP_HUME_SECRET_KEY:', !!process.env.REACT_APP_HUME_SECRET_KEY);
    console.error('- REACT_APP_HUME_CLIENT_ID:', !!process.env.REACT_APP_HUME_CLIENT_ID);
    console.error('- REACT_APP_HUME_CLIENT_SECRET:', !!process.env.REACT_APP_HUME_CLIENT_SECRET);
    return;
  }

  try {
    console.log('\n1. Creating HumeClient...');
    const client = new HumeClient({
      apiKey: apiKey,
      secretKey: secretKey,
    });

    console.log(' HumeClient created successfully');

    // Grace's config ID
    const graceConfigId = '3910aba0-b518-440a-a4a2-0ad1772aec57';
    const configId = graceConfigId;
    
    console.log('\n2. Attempting to connect to chat with config:', configId);
    console.log('   (This is Grace\'s custom EVI config)');
    
    const socket = await client.empathicVoice.chat.connect({ 
      configId,
      debug: true 
    });

    console.log(' Socket created successfully!');
    console.log('Socket type:', typeof socket);
    console.log('Socket properties:', Object.keys(socket));

    // Set up event handlers before waiting for open
    socket.on('open', () => {
      console.log('\n WebSocket opened successfully!');
      console.log('Connection is ready for communication');
      
      // Send a test message after connection is open
      setTimeout(() => {
        console.log('\n3. Sending test message...');
        socket.sendUserInput('Hello Grace, this is a test');
      }, 1000);
    });

    socket.on('message', (message) => {
      console.log('\n Received message:', JSON.stringify(message, null, 2));
    });

    socket.on('error', (error) => {
      console.error('\n Socket error:', error);
      if (error.message) {
        console.error('Error message:', error.message);
      }
      if (error.code) {
        console.error('Error code:', error.code);
      }
    });

    socket.on('close', () => {
      console.log('\n Socket closed');
    });

    // Keep the script running
    console.log('\n Waiting for connection... (press Ctrl+C to exit)');
    
    // Disconnect after 30 seconds
    setTimeout(() => {
      console.log('\n4. Disconnecting after 30 seconds...');
      socket.close();
      process.exit(0);
    }, 30000);

  } catch (error) {
    console.error('\n Failed to connect:', error);
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    if (error.message?.includes('401')) {
      console.error('\n Authentication failed. Please check your API key and secret key.');
    } else if (error.message?.includes('E0709')) {
      console.error('\n  Config not found. The config ID may not exist on your Hume account.');
      console.error('   You may need to create a new EVI config in your Hume dashboard.');
    } else if (error.message?.includes('network')) {
      console.error('\n Network error. Check your internet connection and firewall settings.');
    }
  }
}

testHumeConnection();
