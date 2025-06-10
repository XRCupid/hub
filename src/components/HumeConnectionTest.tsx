import React, { useState, useEffect } from 'react';
import humeVoiceService from '../services/humeVoiceService';

export function HumeConnectionTest() {
  const [status, setStatus] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  
  const addStatus = (message: string) => {
    setStatus(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };
  
  const testConnection = async () => {
    addStatus('Starting connection test...');
    
    // Check environment variables
    const envCheck = {
      hasApiKey: !!process.env.REACT_APP_HUME_API_KEY,
      hasSecretKey: !!process.env.REACT_APP_HUME_SECRET_KEY,
      hasConfigId: !!process.env.REACT_APP_HUME_CONFIG_ID,
      apiKeyPreview: process.env.REACT_APP_HUME_API_KEY ? 
        process.env.REACT_APP_HUME_API_KEY.substring(0, 10) + '...' : 'NOT SET',
      secretKeyPreview: process.env.REACT_APP_HUME_SECRET_KEY ? 
        process.env.REACT_APP_HUME_SECRET_KEY.substring(0, 10) + '...' : 'NOT SET',
      configId: process.env.REACT_APP_HUME_CONFIG_ID || 'NOT SET'
    };
    
    addStatus(`Environment check: ${JSON.stringify(envCheck, null, 2)}`);
    
    if (!envCheck.hasApiKey || !envCheck.hasSecretKey || !envCheck.hasConfigId) {
      addStatus('ERROR: Missing required environment variables!');
      addStatus('Please ensure these are set in your .env.local file:');
      addStatus('- REACT_APP_HUME_API_KEY');
      addStatus('- REACT_APP_HUME_SECRET_KEY');
      addStatus('- REACT_APP_HUME_CONFIG_ID');
      return;
    }
    
    try {
      // Set up callbacks
      humeVoiceService.onMessage((message: any) => {
        addStatus(`Message received: type=${message.type}, id=${message.id}`);
        if (message.message) {
          addStatus(`Message content: ${JSON.stringify(message.message)}`);
        }
      });
      
      humeVoiceService.onAudio((audioBlob: Blob) => {
        addStatus(`Audio received: ${audioBlob.size} bytes`);
      });
      
      // Try to connect
      addStatus('Attempting to connect...');
      await humeVoiceService.connect();
      
      addStatus('SUCCESS: Connected to Hume!');
      setConnected(true);
      
      // Test sending a message
      setTimeout(() => {
        if (humeVoiceService.checkConnection()) {
          addStatus('Sending test message...');
          humeVoiceService.sendMessage('Hello, this is a test message.');
        }
      }, 1000);
      
    } catch (error) {
      addStatus(`ERROR: ${error}`);
      console.error('Full error:', error);
    }
  };
  
  const testDirectApi = async () => {
    addStatus('Testing direct API call...');
    
    const apiKey = process.env.REACT_APP_HUME_API_KEY;
    const secretKey = process.env.REACT_APP_HUME_SECRET_KEY;
    
    if (!apiKey || !secretKey) {
      addStatus('ERROR: Missing API credentials');
      return;
    }
    
    try {
      // Test OAuth endpoint
      const credentials = btoa(`${apiKey}:${secretKey}`);
      const response = await fetch('https://api.hume.ai/oauth2-cc/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        },
        body: 'grant_type=client_credentials',
      });
      
      addStatus(`OAuth response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        addStatus(`Token obtained! Expires in: ${data.expires_in} seconds`);
      } else {
        const errorText = await response.text();
        addStatus(`OAuth error: ${errorText}`);
      }
    } catch (error) {
      addStatus(`Direct API error: ${error}`);
    }
  };
  
  useEffect(() => {
    return () => {
      console.log('[HumeConnectionTest] Cleaning up on unmount');
      if (connected) {
        humeVoiceService.disconnect();
      }
    };
  }, [connected]);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Hume Connection Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testConnection} disabled={connected}>
          Test Hume WebSocket Connection
        </button>
        <button onClick={testDirectApi} style={{ marginLeft: '10px' }}>
          Test Direct API
        </button>
      </div>
      
      <div style={{ 
        backgroundColor: '#f0f0f0', 
        padding: '10px', 
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '12px',
        maxHeight: '400px',
        overflow: 'auto'
      }}>
        {status.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: '5px' }}>
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
}
