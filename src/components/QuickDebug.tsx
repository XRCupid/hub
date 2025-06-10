import React, { useState, useEffect } from 'react';
import { HumeVoiceService } from '../services/humeVoiceService';

const QuickDebug: React.FC = () => {
  const [envVars, setEnvVars] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [humeStatus, setHumeStatus] = useState('');
  const [error, setError] = useState<string>('');
  const [humeService, setHumeService] = useState<HumeVoiceService | null>(null);
  const [status, setStatus] = useState<string>('Initializing...');
  const [connectionDetails, setConnectionDetails] = useState<any>({});

  useEffect(() => {
    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      originalLog(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      setLogs(prev => [...prev, `[LOG] ${message}`]);
    };
    
    console.error = (...args) => {
      originalError(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      setLogs(prev => [...prev, `[ERROR] ${message}`]);
    };

    // Check environment variables
    const vars = {
      HUME_API_KEY: process.env.REACT_APP_HUME_API_KEY ? '✓ Set' : '✗ Missing',
      HUME_SECRET_KEY: process.env.REACT_APP_HUME_SECRET_KEY ? '✓ Set' : '✗ Missing',
      HUME_CONFIG_ID: process.env.REACT_APP_HUME_CONFIG_ID || 'Using default'
    };
    setEnvVars(vars);

    // Test Hume connection
    const testConnection = async () => {
      try {
        setStatus('Creating HumeVoiceService...');
        const service = new HumeVoiceService();
        setHumeService(service);
        
        // Add error callback to capture more details
        service.setOnErrorCallback((error) => {
          console.error('Service error callback:', error);
          // Check if it's a usage limit error
          if (error.message && error.message.includes('usage limit')) {
            setStatus('⚠️ Hume API Usage Limit Reached');
            setConnectionDetails({
              connected: false,
              error: 'Monthly usage limit reached',
              message: error.message,
              solution: 'Please wait until next month or apply for a limit increase at platform.hume.ai/billing'
            });
          }
        });
        
        service.setOnOpenCallback(() => {
          setStatus('Attempting to connect...');
        });
        
        await service.connect();
        
        setStatus('Connected successfully!');
        setConnectionDetails({
          connected: true,
          socketState: service.checkConnection()
        });
        
        // Cleanup
        setTimeout(() => {
          service.disconnect();
        }, 2000);
      } catch (error: any) {
        setStatus(`Error: ${error.message}`);
        setConnectionDetails({
          connected: false,
          error: error.message,
          stack: error.stack,
          details: error
        });
      }
    };

    testConnection();
    
    // Restore console methods on cleanup
    return () => {
      console.log = originalLog;
      console.error = originalError;
      // CRITICAL: Clean up WebSocket connection - FLUSH THE TOILET!
      if (humeService) {
        console.log('[QuickDebug] Cleaning up Hume connection');
        humeService.disconnect();
      }
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Hume Connection Debug</h1>
      
      <h2>Environment Variables</h2>
      <pre>{JSON.stringify(envVars, null, 2)}</pre>
      
      <h2>Connection Status</h2>
      <p>{status}</p>
      
      <h2>Connection Details</h2>
      <pre>{JSON.stringify(connectionDetails, null, 2)}</pre>
      
      <h2>Console Logs</h2>
      <div style={{ 
        maxHeight: '400px', 
        overflow: 'auto', 
        backgroundColor: '#f0f0f0', 
        padding: '10px',
        fontSize: '12px'
      }}>
        {logs.map((log, i) => (
          <div key={i} style={{ marginBottom: '5px', whiteSpace: 'pre-wrap' }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickDebug;
