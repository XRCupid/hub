const WebSocket = require('ws');
const http = require('http');

// Create a simple server to monitor WebSocket connections
const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  ws.on('close', () => console.log('WebSocket connection closed'));
  ws.on('error', (err) => console.error('WebSocket error:', err));
});

server.listen(0, '127.0.0.1', () => {
  console.log(`Monitoring WebSocket connections on port ${server.address().port}`);
  console.log('Run your app and check for any unexpected connections');
  console.log('Press Ctrl+C to stop monitoring');
});

// Monitor for existing WebSocket connections
const checkForWsConnections = () => {
  console.log('\nChecking for existing WebSocket connections...');
  const connections = process._getActiveHandles()
    .filter(h => h.constructor && h.constructor.name.includes('WebSocket'));
  
  console.log(`Found ${connections.length} WebSocket connections:`);
  connections.forEach((ws, i) => {
    console.log(`  ${i + 1}. ${ws.constructor.name} - ${ws.url || 'no url'}`);
  });
};

// Check immediately and then every 5 seconds
checkForWsConnections();
const interval = setInterval(checkForWsConnections, 5000);

// Clean up on exit
process.on('SIGINT', () => {
  clearInterval(interval);
  server.close();
  process.exit(0);
});
