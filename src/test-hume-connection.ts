// Test script to verify Hume connection
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import WebSocket from 'ws';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function getAccessToken(): Promise<string> {
  const apiKey = process.env.REACT_APP_HUME_API_KEY || process.env.REACT_APP_HUME_CLIENT_ID;
  const secretKey = process.env.REACT_APP_HUME_SECRET_KEY || process.env.REACT_APP_HUME_CLIENT_SECRET;
  
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');
  console.log('Secret Key:', secretKey ? 'FOUND' : 'NOT FOUND');
  
  if (!apiKey || !secretKey) {
    throw new Error('Hume credentials not configured');
  }
  
  const credentials = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');
  
  console.log('Making OAuth request...');
  const response = await fetch('https://api.hume.ai/oauth2-cc/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: 'grant_type=client_credentials',
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token request failed:', response.status, errorText);
    throw new Error(`Failed to get access token: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('Access token obtained successfully');
  return data.access_token;
}

async function testWebSocketConnection() {
  try {
    const accessToken = await getAccessToken();
    const configId = process.env.REACT_APP_HUME_CONFIG_ID;
    
    console.log('Config ID:', configId || 'NOT FOUND');
    
    if (!configId) {
      throw new Error('Config ID not configured');
    }
    
    const wsUrl = `wss://api.hume.ai/v0/evi/chat?config_id=${configId}&access_token=${accessToken}`;
    console.log('Connecting to WebSocket...');
    
    const ws = new WebSocket(wsUrl);
    
    ws.on('open', () => {
      console.log('WebSocket connected successfully!');
      console.log('Sending test message...');
      ws.send('Hello, I am testing the connection.');
    });
    
    ws.on('message', (data) => {
      console.log('Received message:', data.toString());
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
    
    ws.on('close', (code, reason) => {
      console.log('WebSocket closed:', code, reason);
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testWebSocketConnection();
