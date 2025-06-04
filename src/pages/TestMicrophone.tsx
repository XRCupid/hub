import React, { useState, useRef, useEffect } from 'react';
import humeVoiceService from '../services/humeVoiceService';

export const TestMicrophone: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [humeConnected, setHumeConnected] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunks = useRef<BlobPart[]>([]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (humeConnected) {
        humeVoiceService.disconnect();
      }
    };
  }, [humeConnected]);

  const testMicrophone = async () => {
    try {
      setFeedback(prev => [...prev, '🎤 Requesting microphone access...']);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setFeedback(prev => [...prev, '✅ Microphone access granted']);
      
      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        chunks.current.push(event.data);
        setFeedback(prev => [...prev, `📊 Data available: ${event.data.size} bytes`]);
      };
      
      mediaRecorderRef.current.onstart = () => {
        setFeedback(prev => [...prev, '🔴 Recording started']);
        setIsListening(true);
      };
      
      mediaRecorderRef.current.onstop = () => {
        setFeedback(prev => [...prev, '🛑 Recording stopped']);
        
        // Send audio to Hume
        if (humeConnected && chunks.current.length > 0) {
          const audioBlob = new Blob(chunks.current, { type: 'audio/webm' });
          setFeedback(prev => [...prev, `📤 Sending ${audioBlob.size} bytes to Hume...`]);
          humeVoiceService.sendAudio(audioBlob);
        }
        
        chunks.current = [];
      };
      
      return true;
    } catch (error) {
      setFeedback(prev => [...prev, `❌ Microphone error: ${error}`]);
      return false;
    }
  };

  const startRecording = () => {
    if (mediaRecorderRef.current) {
      try {
        setFeedback(prev => [...prev, '🎙️ Starting 5-second recording...']);
        mediaRecorderRef.current.start();
        setIsListening(true);
        
        // Stop after 5 seconds
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsListening(false);
          }
        }, 5000);
        
      } catch (error: any) {
        setFeedback(prev => [...prev, `❌ Recording error: ${error.message}`]);
        setIsListening(false);
      }
    }
  };

  const connectToHume = async () => {
    try {
      setFeedback(prev => [...prev, '🔌 Connecting to Hume...']);
      
      // Set up Hume callbacks
      humeVoiceService.onMessage((message: string) => {
        setFeedback(prev => [...prev, `🤖 Hume: ${message}`]);
      });
      
      humeVoiceService.onUserMessage((transcript: string) => {
        setFeedback(prev => [...prev, `👤 You: ${transcript}`]);
      });
      
      humeVoiceService.onEmotion((emotions: any) => {
        setFeedback(prev => [...prev, `😊 Emotions: ${JSON.stringify(emotions).substring(0, 100)}...`]);
      });
      
      humeVoiceService.onAudio((blob: Blob) => {
        setFeedback(prev => [...prev, `🔊 Audio received: ${blob.size} bytes`]);
      });
      
      await humeVoiceService.connect();
      setHumeConnected(true);
      setFeedback(prev => [...prev, '✅ Connected to Hume!']);
    } catch (error: any) {
      setFeedback(prev => [...prev, `❌ Failed to connect: ${error.message}`]);
    }
  };

  const disconnectFromHume = () => {
    humeVoiceService.disconnect();
    setHumeConnected(false);
    setFeedback(prev => [...prev, '🔌 Disconnected from Hume']);
  };

  const clearFeedback = () => {
    setFeedback([]);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Microphone & Hume Test Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testMicrophone} style={{ marginRight: '10px' }}>
          Test Microphone Access
        </button>
        <button onClick={startRecording} disabled={!mediaRecorderRef.current || isListening} style={{ marginRight: '10px' }}>
          {isListening ? 'Recording...' : 'Start 5s Recording'}
        </button>
        <button onClick={connectToHume} disabled={humeConnected} style={{ marginRight: '10px' }}>
          {humeConnected ? 'Hume Connected' : 'Connect to Hume'}
        </button>
        <button onClick={disconnectFromHume} disabled={!humeConnected} style={{ marginRight: '10px' }}>
          Disconnect from Hume
        </button>
        <button onClick={clearFeedback}>
          Clear Log
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#f0f0f0', 
        padding: '10px', 
        borderRadius: '5px',
        height: '400px',
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        {feedback.length === 0 ? (
          <p>No activity yet. Click a button to start testing.</p>
        ) : (
          feedback.map((msg, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              {msg}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <h3>Environment Variables Status:</h3>
        <ul>
          <li>HUME_API_KEY: {process.env.REACT_APP_HUME_API_KEY ? '✅ Set' : '❌ Missing'}</li>
          <li>HUME_SECRET_KEY: {process.env.REACT_APP_HUME_SECRET_KEY ? '✅ Set' : '❌ Missing'}</li>
          <li>HUME_CONFIG_ID: {process.env.REACT_APP_HUME_CONFIG_ID ? '✅ Set' : '❌ Missing'}</li>
        </ul>
      </div>
    </div>
  );
};
