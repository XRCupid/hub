import React, { useState, useRef, useEffect } from 'react';
import { HybridVoiceService } from '../services/hybridVoiceService';
import { EmotionalState } from '../services/humeVoiceService';
import './TestConvai.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: Date;
  emotion?: Array<{name: string, score: number}>;
}

const TestConvai: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<Array<{name: string, score: number}>>([]);
  const [useHume, setUseHume] = useState(true); // Toggle between Hume and Convai
  
  const voiceServiceRef = useRef<HybridVoiceService | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Initialize the hybrid voice service
    voiceServiceRef.current = new HybridVoiceService();
    
    // Set up callbacks
    voiceServiceRef.current.setOnMessageCallback((message: any) => {
      const messageText = typeof message === 'string' ? message : message?.message?.content || JSON.stringify(message);
      addMessage(messageText, 'assistant');
    });
    
    voiceServiceRef.current.setOnAudioCallback((audioBlob: Blob) => {
      // Play the audio
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play().catch(e => console.error('Error playing audio:', e));
    });
    
    voiceServiceRef.current.setOnEmotionCallback((emotion) => {
      console.log('Emotion data:', emotion);
      setCurrentEmotion(emotion);
      // Add emotion to the last assistant message
      setMessages(prev => {
        const newMessages = [...prev];
        const lastAssistantIndex = newMessages.findLastIndex(m => m.sender === 'assistant');
        if (lastAssistantIndex >= 0) {
          newMessages[lastAssistantIndex].emotion = emotion;
        }
        return newMessages;
      });
    });
    
    voiceServiceRef.current.setOnUserMessageCallback((transcript: string) => {
      addMessage(transcript, 'user');
    });
    
    voiceServiceRef.current.setOnErrorCallback((error: Error) => {
      console.error('Voice service error:', error);
      addMessage(`Error: ${error.message}`, 'system');
    });
    
    return () => {
      if (voiceServiceRef.current && isConnected) {
        voiceServiceRef.current.disconnect();
      }
    };
  }, []);

  const addMessage = (text: string, sender: 'user' | 'assistant' | 'system') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleConnect = async () => {
    if (!voiceServiceRef.current) return;
    
    setIsConnecting(true);
    try {
      // Set which service to use for conversation
      voiceServiceRef.current.setUseHumeForConversation(useHume);
      
      // Connect with appropriate config
      const configId = useHume ? process.env.REACT_APP_HUME_CONFIG_ID : undefined;
      await voiceServiceRef.current.connect(configId);
      
      setIsConnected(true);
      addMessage(`Connected to ${useHume ? 'Hume' : 'Convai'} voice service`, 'system');
    } catch (error) {
      console.error('Connection error:', error);
      addMessage(`Failed to connect: ${error}`, 'system');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!voiceServiceRef.current) return;
    
    try {
      await voiceServiceRef.current.disconnect();
      setIsConnected(false);
      addMessage('Disconnected from voice service', 'system');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const handleSendText = async () => {
    if (!voiceServiceRef.current || !isConnected || !inputText.trim()) return;
    
    try {
      await voiceServiceRef.current.sendMessage(inputText);
      addMessage(inputText, 'user');
      setInputText('');
    } catch (error) {
      console.error('Error sending text:', error);
      addMessage(`Error sending message: ${error}`, 'system');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (voiceServiceRef.current && isConnected) {
          try {
            await voiceServiceRef.current.sendAudio(audioBlob);
          } catch (error) {
            console.error('Error sending audio:', error);
            addMessage(`Error sending audio: ${error}`, 'system');
          }
        }
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      addMessage('Recording started...', 'system');
    } catch (error) {
      console.error('Error starting recording:', error);
      addMessage(`Error accessing microphone: ${error}`, 'system');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      addMessage('Recording stopped', 'system');
    }
  };

  const handleServiceToggle = () => {
    if (isConnected) {
      addMessage('Please disconnect before switching services', 'system');
      return;
    }
    setUseHume(!useHume);
    addMessage(`Switched to ${!useHume ? 'Hume' : 'Convai'} service`, 'system');
  };

  const formatEmotion = (emotion: Array<{name: string, score: number}>) => {
    const topEmotions = emotion
      .filter(({ score }) => score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ name, score }) => `${name}: ${(score * 100).toFixed(1)}%`)
      .join(', ');
    return topEmotions || 'No strong emotions detected';
  };

  return (
    <div className="test-convai-container">
      <h1>Voice Service Test - {useHume ? 'Hume' : 'Convai'}</h1>
      
      <div className="service-toggle">
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={useHume}
            onChange={handleServiceToggle}
            disabled={isConnected}
          />
          <span className="toggle-slider"></span>
          <span className="toggle-label">{useHume ? 'Hume AI' : 'Convai'}</span>
        </label>
        {isConnected && <small>Disconnect to switch services</small>}
      </div>
      
      <div className="connection-status">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></div>
        <span>{isConnected ? `Connected to ${useHume ? 'Hume' : 'Convai'}` : 'Disconnected'}</span>
      </div>
      
      {currentEmotion.length > 0 && (
        <div className="emotion-display">
          <strong>Current Emotions:</strong> {formatEmotion(currentEmotion)}
        </div>
      )}
      
      <div className="controls">
        {!isConnected ? (
          <button 
            onClick={handleConnect} 
            disabled={isConnecting}
            className="connect-btn"
          >
            {isConnecting ? 'Connecting...' : `Connect to ${useHume ? 'Hume' : 'Convai'}`}
          </button>
        ) : (
          <button 
            onClick={handleDisconnect}
            className="disconnect-btn"
          >
            Disconnect
          </button>
        )}
      </div>
      
      <div className="messages-container">
        <div className="messages-list">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.sender}`}>
              <div className="message-content">{message.text}</div>
              {message.emotion && (
                <div className="message-emotion">
                  <small>{formatEmotion(message.emotion)}</small>
                </div>
              )}
              <div className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {isConnected && (
        <div className="input-controls">
          <div className="text-input-container">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
              placeholder="Type a message..."
              className="text-input"
            />
            <button onClick={handleSendText} className="send-btn">
              Send
            </button>
          </div>
          
          <div className="audio-controls">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`record-btn ${isRecording ? 'recording' : ''}`}
            >
              {isRecording ? '⏹️ Stop Recording' : '🎤 Start Recording'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestConvai;
