const { HumeClient } = require('hume');
require('dotenv').config({ path: '.env.local' });

async function testHumeConnection() {
  console.log('Testing Hume connection...');
  
  // Support both naming conventions
  const apiKey = process.env.REACT_APP_HUME_API_KEY || process.env.REACT_APP_HUME_CLIENT_ID;
  const secretKey = process.env.REACT_APP_HUME_SECRET_KEY || process.env.REACT_APP_HUME_CLIENT_SECRET;
  
  if (!apiKey || !secretKey) {
    console.error('Missing required credentials');
    return;
  }

  let socket = null;
  let cleanupCalled = false;

  // Handle process termination
  const cleanup = async () => {
    if (cleanupCalled) return;
    cleanupCalled = true;
    
    console.log('\nCleaning up...');
    if (socket) {
      try {
        await socket.close();
        console.log('WebSocket connection closed');
      } catch (err) {
        console.error('Error closing socket:', err.message);
      }
    }
    process.exit(0);
  };

  // Handle process termination
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    cleanup().then(() => process.exit(1));
  });

  try {
    console.log('\n1. Creating HumeClient...');
    const client = new HumeClient({ apiKey, secretKey });
    console.log(' HumeClient created successfully');

    // Use default config instead of Grace's custom one
    const configId = 'default';
    
    console.log(`\n2. Attempting to connect to chat with config: ${configId}`);
    
    // Set a timeout for the connection attempt
    const connectionTimeout = setTimeout(() => {
      throw new Error('Connection attempt timed out after 30 seconds');
    }, 30000);

    try {
      socket = await client.empathicVoice.chat.connect({ 
        configId,
        debug: true,
        transportOptions: {
          websocket: {
            maxReconnectionDelay: 10000,
            minReconnectionDelay: 1000,
            reconnectionDelayGrowFactor: 1.3,
            connectionTimeout: 10000,
            maxRetries: 3,
            debug: true
          }
        }
      });

      clearTimeout(connectionTimeout);
      console.log(' Socket created successfully!');

      // Set up event handlers
      socket.on('open', () => {
        console.log('\n WebSocket opened successfully!');
        
        // Send a test message after a short delay
        setTimeout(() => {
          console.log('\n3. Sending test message...');
          socket.sendUserInput('Hello, this is a test message');
        }, 1000);
      });

      socket.on('message', (message) => {
        console.log('\n Received message:', JSON.stringify(message, null, 2));
      });

      socket.on('error', (error) => {
        console.error('\n Socket error:', error);
        cleanup().catch(console.error);
      });

      socket.on('close', () => {
        console.log('\n Socket closed');
        cleanup().catch(console.error);
      });

      // Keep the process alive
      await new Promise(() => {});
      
    } catch (err) {
      clearTimeout(connectionTimeout);
      throw err;
    }

  } catch (error) {
    console.error('\n Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    await cleanup();
    process.exit(1);
  }
}

testHumeConnection();
