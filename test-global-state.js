console.log('=== Global State Checker ===');

// 1. Check for any existing WebSocket connections
console.log('\n[1] Checking for WebSocket implementations...');
try {
  const ws = require('ws');
  console.log('- WebSocket module loaded successfully');
  
  // Check for any existing WebSocket servers
  const servers = process._getActiveHandles()
    .filter(h => h.constructor && h.constructor.name.includes('Server'));
  
  console.log(`- Found ${servers.length} server instances`);
  servers.forEach((srv, i) => {
    console.log(`  ${i + 1}. ${srv.constructor.name} - ${srv.address ? JSON.stringify(srv.address()) : 'no address'}`);
  });
} catch (e) {
  console.error('- Error checking WebSocket:', e.message);
}

// 2. Check for any existing HTTP/HTTPS agents
console.log('\n[2] Checking for HTTP/HTTPS agents...');
const http = require('http');
const https = require('https');

const checkAgents = (agent, name) => {
  const sockets = agent.sockets || {};
  const requests = agent.requests || {};
  const totalSockets = Object.values(sockets).flat().length;
  const totalRequests = Object.keys(requests).length;
  
  console.log(`- ${name} Agent:`);
  console.log(`  - Sockets: ${totalSockets}`);
  console.log(`  - Pending requests: ${totalRequests}`);
  
  if (totalSockets > 0) {
    console.log('  ! WARNING: Active sockets found');
  }
};

checkAgents(http.globalAgent, 'HTTP');
checkAgents(https.globalAgent, 'HTTPS');

// 3. Check for any active timers
console.log('\n[3] Checking for active timers...');
const activeTimers = [];
const activeIntervals = [];

// This is a bit of a hack to get the active timers
const _setTimeout = setTimeout;
const _setInterval = setInterval;

global.setTimeout = function(cb, delay) {
  const timer = _setTimeout(() => {
    activeTimers.splice(activeTimers.indexOf(timer), 1);
    cb();
  }, delay);
  activeTimers.push(timer);
  return timer;
};

global.setInterval = function(cb, interval) {
  const timer = _setInterval(cb, interval);
  activeIntervals.push(timer);
  return timer;
};

console.log(`- Active timeouts: ${activeTimers.length}`);
console.log(`- Active intervals: ${activeIntervals.length}`);

// 4. Check for any active event emitters
console.log('\n[4] Checking for active event emitters...');
const activeEmitters = [];
const originalEmit = process.emit;

process.emit = function(...args) {
  if (args[0] === 'newListener') {
    activeEmitters.push(args[1]);
  }
  return originalEmit.apply(this, args);
};

console.log(`- Active event emitters: ${activeEmitters.length}`);

// 5. Check for any open file handles
console.log('\n[5] Checking for open file handles...');
const handles = process._getActiveHandles();
const files = handles.filter(h => h.constructor && h.constructor.name === 'Socket');
console.log(`- Open file handles: ${files.length}`);

console.log('\n=== Global State Check Complete ===');

// Restore originals
process.emit = originalEmit;
