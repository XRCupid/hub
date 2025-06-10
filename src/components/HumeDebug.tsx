import React, { useState, useEffect } from 'react';
import { HumeVoiceService } from '../services/humeVoiceService';

const HumeDebug: React.FC = () => {
  const [status, setStatus] = useState<string>('Not connected');
  const [error, setError] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [service, setService] = useState<HumeVoiceService | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const testConnection = async () => {
    try {
      addLog('Starting connection test...');
      setStatus('Connecting...');
      setError('');

      // Check environment variables
      const apiKey = process.env.REACT_APP_HUME_API_KEY;
      const secretKey = process.env.REACT_APP_HUME_SECRET_KEY;
      const configId = process.env.REACT_APP_HUME_CONFIG_ID;

      addLog(`API Key: ${apiKey ? 'Set (' + apiKey.substring(0, 10) + '...)' : 'NOT SET'}`);
      addLog(`Secret Key: ${secretKey ? 'Set' : 'NOT SET'}`);
      addLog(`Config ID: ${configId || 'NOT SET'}`);

      if (!apiKey || !secretKey) {
        throw new Error('Missing API credentials. Please set REACT_APP_HUME_API_KEY and REACT_APP_HUME_SECRET_KEY in your .env file');
      }

      const service = new HumeVoiceService();
      setService(service);
      
      service.setOnOpenCallback(() => {
        addLog('WebSocket opened successfully!');
        setStatus('Connected');
        setIsConnected(true);
      });

      service.setOnErrorCallback((err) => {
        addLog(`Error: ${err.message}`);
        setError(err.message);
      });

      service.setOnCloseCallback((code, reason) => {
        addLog(`WebSocket closed: ${code} - ${reason}`);
        setStatus('Disconnected');
        setIsConnected(false);
      });

      await service.connect(configId);
      
    } catch (err: any) {
      addLog(`Connection failed: ${err.message}`);
      setError(err.message);
      setStatus('Failed');
    }
  };

  // CRITICAL: Clean up WebSocket connection on unmount - FLUSH THE TOILET!
  useEffect(() => {
    return () => {
      console.log('[HumeDebug] Cleaning up on unmount');
      if (isConnected && service) {
        // Disconnect any test connections
        service.disconnect();
      }
    };
  }, [isConnected, service]);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Hume Connection Debug</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Environment Check:</h3>
        <ul>
          <li>REACT_APP_HUME_API_KEY: {process.env.REACT_APP_HUME_API_KEY ? '✅ Set' : '❌ Missing'}</li>
          <li>REACT_APP_HUME_SECRET_KEY: {process.env.REACT_APP_HUME_SECRET_KEY ? '✅ Set' : '❌ Missing'}</li>
          <li>REACT_APP_HUME_CONFIG_ID: {process.env.REACT_APP_HUME_CONFIG_ID || '❌ Missing (will use default)'}</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Status: {status}</h3>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      </div>

      <button onClick={testConnection} style={{ padding: '10px 20px', fontSize: '16px' }}>
        Test Connection
      </button>

      <div style={{ marginTop: '20px' }}>
        <h3>Logs:</h3>
        <div style={{ 
          backgroundColor: '#f0f0f0', 
          padding: '10px', 
          maxHeight: '300px', 
          overflow: 'auto',
          fontSize: '12px'
        }}>
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h4>Setup Instructions:</h4>
        <ol>
          <li>Create a .env file in the project root (same directory as package.json)</li>
          <li>Add the following lines:
            <pre style={{ backgroundColor: '#f0f0f0', padding: '10px' }}>
{`REACT_APP_HUME_API_KEY=your_api_key_here
REACT_APP_HUME_SECRET_KEY=your_secret_key_here
REACT_APP_HUME_CONFIG_ID=your_config_id_here`}
            </pre>
          </li>
          <li>Restart the development server after adding the .env file</li>
        </ol>
      </div>
    </div>
  );
};

export default HumeDebug;
