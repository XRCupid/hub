import React, { useState, useEffect } from 'react';
import { HumeClient } from 'hume';

interface ConnectionStatus {
  stage: string;
  success: boolean;
  error?: string;
  details?: any;
}

const HumeConnectionDebug: React.FC = () => {
  const [connectionStatuses, setConnectionStatuses] = useState<ConnectionStatus[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  const testConnection = async () => {
    setIsConnecting(true);
    setConnectionStatuses([]);
    
    const addStatus = (status: ConnectionStatus) => {
      setConnectionStatuses(prev => [...prev, status]);
    };

    try {
      // Step 1: Check environment variables
      addStatus({
        stage: 'Environment Check',
        success: true,
        details: {
          hasApiKey: !!process.env.REACT_APP_HUME_API_KEY,
          hasSecretKey: !!process.env.REACT_APP_HUME_SECRET_KEY,
          hasConfigId: !!process.env.REACT_APP_HUME_CONFIG_ID,
          configId: process.env.REACT_APP_HUME_CONFIG_ID
        }
      });

      if (!process.env.REACT_APP_HUME_API_KEY || !process.env.REACT_APP_HUME_SECRET_KEY) {
        throw new Error('Missing Hume API credentials');
      }

      // Step 2: Initialize Hume client
      const client = new HumeClient({
        apiKey: process.env.REACT_APP_HUME_API_KEY,
        secretKey: process.env.REACT_APP_HUME_SECRET_KEY
      });

      addStatus({
        stage: 'Client Initialization',
        success: true,
        details: { clientCreated: true }
      });

      // Step 3: Test API connection with a simple call
      try {
        // Try to list configs to verify API access
        const configs = await client.empathicVoice.configs.listConfigs();
        addStatus({
          stage: 'API Authentication',
          success: true,
          details: { 
            configCount: configs.configs_page?.length || 0,
            configs: configs.configs_page?.map(c => ({ id: c.id, name: c.name }))
          }
        });
      } catch (apiError: any) {
        addStatus({
          stage: 'API Authentication',
          success: false,
          error: apiError.message,
          details: { 
            status: apiError.status,
            statusText: apiError.statusText
          }
        });
        throw apiError;
      }

      // Step 4: Test WebSocket connection
      const configId = process.env.REACT_APP_HUME_CONFIG_ID || '';
      try {
        const socket = await client.empathicVoice.chat.connect({ configId });
        
        addStatus({
          stage: 'WebSocket Connection',
          success: true,
          details: { 
            configId,
            socketConnected: true
          }
        });

        // Clean up
        socket.close();
      } catch (wsError: any) {
        addStatus({
          stage: 'WebSocket Connection',
          success: false,
          error: wsError.message,
          details: { 
            configId,
            errorType: wsError.constructor.name
          }
        });
        throw wsError;
      }

    } catch (error: any) {
      console.error('Connection test failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#1a1a1a', 
      color: '#fff',
      fontFamily: 'monospace',
      maxWidth: '800px',
      margin: '20px auto'
    }}>
      <h2>Hume Connection Debugger</h2>
      
      <button 
        onClick={testConnection}
        disabled={isConnecting}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: isConnecting ? 'not-allowed' : 'pointer',
          opacity: isConnecting ? 0.6 : 1
        }}
      >
        {isConnecting ? 'Testing...' : 'Test Hume Connection'}
      </button>

      <div style={{ marginTop: '20px' }}>
        {connectionStatuses.map((status, index) => (
          <div 
            key={index}
            style={{
              marginBottom: '15px',
              padding: '10px',
              backgroundColor: status.success ? '#1e3a1e' : '#3a1e1e',
              borderLeft: `4px solid ${status.success ? '#4CAF50' : '#f44336'}`,
              borderRadius: '4px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <span style={{ fontSize: '20px', marginRight: '10px' }}>
                {status.success ? '✅' : '❌'}
              </span>
              <strong>{status.stage}</strong>
            </div>
            
            {status.error && (
              <div style={{ color: '#ff6b6b', marginTop: '5px' }}>
                Error: {status.error}
              </div>
            )}
            
            {status.details && (
              <pre style={{ 
                marginTop: '5px', 
                fontSize: '12px',
                opacity: 0.8,
                overflow: 'auto'
              }}>
                {JSON.stringify(status.details, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '30px', fontSize: '14px', opacity: 0.7 }}>
        <h3>What this tests:</h3>
        <ol>
          <li>Environment variables are present</li>
          <li>Hume client can be initialized</li>
          <li>API credentials are valid (lists your configs)</li>
          <li>WebSocket can connect to the specified config</li>
        </ol>
        <p>If all tests pass but the coach still doesn't appear, the issue may be with the specific coach configuration or the rendering logic.</p>
      </div>
    </div>
  );
};

export default HumeConnectionDebug;
