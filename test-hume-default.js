const { HumeClient } = require('hume');
require('dotenv').config({ path: '.env.local' });

async function testHumeConnection() {
  console.log('Testing Hume connection with DEFAULT config...');
  
  // Support both naming conventions
  const apiKey = process.env.REACT_APP_HUME_API_KEY || process.env.REACT_APP_HUME_CLIENT_ID;
  const secretKey = process.env.REACT_APP_HUME_SECRET_KEY || process.env.REACT_APP_HUME_CLIENT_SECRET;
  
  console.log('API Key preview:', apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET');
  console.log('Secret Key preview:', secretKey ? secretKey.substring(0, 10) + '...' : 'NOT SET');

  if (!apiKey || !secretKey) {
    console.error('Missing required credentials');
    return;
  }

  try {
    console.log('\n1. Creating HumeClient...');
    const client = new HumeClient({
      apiKey: apiKey,
      secretKey: secretKey,
    });

    console.log('✓ HumeClient created successfully');

    // Try without any config ID - this should use the default
    console.log('\n2. Attempting to connect WITHOUT config ID (using account default)...');
    
    const socket = await client.empathicVoice.chat.connect({ 
      // No configId specified - will use account default
      debug: true 
    });

    console.log('✓ Socket created successfully!');

    // Set up event handlers
    socket.on('open', () => {
      console.log('\n✅ SUCCESS! WebSocket opened with default config!');
      console.log('Your credentials are working correctly.');
      console.log('\nThe issue is that Grace\'s config ID doesn\'t exist on your account.');
      console.log('You need to either:');
      console.log('1. Create a new EVI config for Grace in your Hume dashboard');
      console.log('2. Use the default config (remove the custom config ID)');
      
      // Close after success
      setTimeout(() => {
        socket.close();
        process.exit(0);
      }, 2000);
    });

    socket.on('error', (error) => {
      console.error('\n❌ Socket error:', error.message);
    });

    socket.on('close', () => {
      console.log('\n🔌 Socket closed');
    });

    // Keep the script running
    console.log('\n⏳ Waiting for connection...');
    
    // Timeout after 10 seconds
    setTimeout(() => {
      console.log('\n⏱️ Timeout - closing...');
      socket.close();
      process.exit(1);
    }, 10000);

  } catch (error) {
    console.error('\n❌ Failed to connect:', error.message);
    
    if (error.message?.includes('401')) {
      console.error('\n🔑 Authentication failed even with default config.');
      console.error('Your API credentials may be incorrect.');
    }
  }
}

testHumeConnection();
