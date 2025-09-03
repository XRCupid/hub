import React, { useState, useEffect, useRef } from 'react';
import UnifiedEmotionService from '../services/UnifiedEmotionService';
import './EmotionAnalysis.css';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer
} from 'recharts';

// Emotion labels and colors mapping
const emotionConfig = [
  { name: 'Joy', color: '#5cb85c' },
  { name: 'Interest', color: '#5bc0de' },
  { name: 'Concentration', color: '#428bca' },
  { name: 'Boredom', color: '#777777' },
  { name: 'Confusion', color: '#ff7f0e' },
  { name: 'Doubt', color: '#d9534f' },
  { name: 'Sadness', color: '#5253a3' },
  { name: 'Disgust', color: '#a94442' },
  { name: 'Anxiety', color: '#d62728' },
];

// Emoji mapping for emotions
const emotionEmojis = {
  Joy: '😊',
  Interest: '🙂',
  Concentration: '😐',
  Boredom: '😒',
  Confusion: '😕',
  Doubt: '🤔',
  Sadness: '😢',
  Disgust: '😖',
  Anxiety: '😨',
};

const EmotionAnalysisUnified = ({ 
  localStream, 
  remoteStream, 
  localVideoRef,
  remoteVideoRef,
  roomId, 
  userId, 
  onEmotionDataUpdate 
}) => {
  const [unifiedEmotions1, setUnifiedEmotions1] = useState(null);
  const [unifiedEmotions2, setUnifiedEmotions2] = useState(null);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [transcripts, setTranscripts] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  
  const unifiedServiceRef = useRef(null);
  const summaryDataRef = useRef({
    user1: {
      emotionTrends: [],
      dominantEmotions: {},
      keywords: {},
      confidence: 0
    },
    user2: {
      emotionTrends: [],
      dominantEmotions: {},
      keywords: {},
      confidence: 0
    },
    startTime: Date.now(),
    topics: []
  });

  useEffect(() => {
    if (!localStream || !remoteStream) return;

    const initializeUnifiedService = async () => {
      try {
        console.log('[EmotionAnalysisUnified] Initializing unified emotion service...');
        
        unifiedServiceRef.current = new UnifiedEmotionService();
        
        // Set up callbacks for unified emotion data
        unifiedServiceRef.current.setOnUnifiedEmotionCallback((data) => {
          console.log('[EmotionAnalysisUnified] Unified emotions:', {
            dominant: data.dominantEmotion,
            intensity: data.emotionIntensity,
            confidence: data.confidence,
            prosody: data.prosodyEmotions.slice(0, 3),
            facial: data.facialEmotions.slice(0, 3)
          });
          
          // Update UI with unified emotion data
          setUnifiedEmotions1(data);
          
          // Update emotion history
          setEmotionHistory(prev => {
            const newHistory = [...prev, {
              timestamp: data.timestamp,
              dominant: data.dominantEmotion,
              intensity: data.emotionIntensity,
              confidence: data.confidence
            }];
            // Keep last 30 seconds of history
            return newHistory.filter(h => Date.now() - h.timestamp < 30000);
          });
          
          // Update summary data
          updateSummaryData(data, 'user1');
        });
        
        // Set up transcript callback with emotions
        unifiedServiceRef.current.setOnTranscriptWithEmotionsCallback((data) => {
          console.log('[EmotionAnalysisUnified] Transcript with emotions:', {
            text: data.text?.substring(0, 50),
            dominant: data.dominantEmotion,
            confidence: data.confidence
          });
          
          setTranscripts(prev => [...prev, {
            timestamp: data.timestamp,
            text: data.text,
            emotion: data.dominantEmotion,
            confidence: data.confidence
          }].slice(-10)); // Keep last 10 transcripts
        });
        
        // Set up error callback
        unifiedServiceRef.current.setOnErrorCallback((error) => {
          console.error('[EmotionAnalysisUnified] Service error:', error);
          setError(error.message);
        });
        
        // Set video element for facial analysis if available
        if (localVideoRef?.current) {
          unifiedServiceRef.current.setVideoElement(localVideoRef.current);
        }
        
        // Connect the service
        await unifiedServiceRef.current.connect(localVideoRef?.current);
        console.log('[EmotionAnalysisUnified] Service connected successfully');
        
        setIsAnalyzing(true);
        setError('');
        
      } catch (error) {
        console.error('[EmotionAnalysisUnified] Failed to initialize:', error);
        setError('Failed to initialize emotion analysis: ' + error.message);
      }
    };

    initializeUnifiedService();

    // Cleanup on unmount
    return () => {
      if (unifiedServiceRef.current) {
        unifiedServiceRef.current.disconnect();
        unifiedServiceRef.current = null;
      }
    };
  }, [localStream, remoteStream, localVideoRef]);

  // Update summary data for analytics
  const updateSummaryData = (emotionData, user) => {
    const userData = summaryDataRef.current[user];
    
    // Track emotion trends
    userData.emotionTrends.push({
      timestamp: emotionData.timestamp,
      emotion: emotionData.dominantEmotion,
      intensity: emotionData.emotionIntensity
    });
    
    // Update dominant emotion counts
    if (!userData.dominantEmotions[emotionData.dominantEmotion]) {
      userData.dominantEmotions[emotionData.dominantEmotion] = 0;
    }
    userData.dominantEmotions[emotionData.dominantEmotion]++;
    
    // Update average confidence
    userData.confidence = (userData.confidence + emotionData.confidence) / 2;
  };

  // Get display data for emotion visualization
  const getEmotionDisplayData = (unifiedData) => {
    if (!unifiedData) return null;
    
    const topEmotions = unifiedData.combinedEmotions.slice(0, 3);
    return {
      dominant: unifiedData.dominantEmotion,
      emoji: emotionEmojis[unifiedData.dominantEmotion] || '😐',
      intensity: unifiedData.emotionIntensity,
      confidence: unifiedData.confidence,
      topEmotions,
      sources: {
        voice: unifiedData.prosodyEmotions.length > 0,
        face: unifiedData.facialEmotions.length > 0
      }
    };
  };

  // Render emotion card
  const renderEmotionCard = (title, data, isLocal = true) => {
    const displayData = getEmotionDisplayData(data);
    if (!displayData) {
      return (
        <div className="emotion-card">
          <h3>{title}</h3>
          <p>No emotion data available</p>
        </div>
      );
    }

    return (
      <div className="emotion-card">
        <h3>{title}</h3>
        <div className="dominant-emotion">
          <span className="emotion-emoji">{displayData.emoji}</span>
          <span className="emotion-name">{displayData.dominant}</span>
          <span className="emotion-intensity">{displayData.intensity}%</span>
        </div>
        
        <div className="confidence-bar">
          <div className="confidence-label">Confidence: {displayData.confidence}%</div>
          <div className="confidence-progress">
            <div 
              className="confidence-fill" 
              style={{ width: `${displayData.confidence}%` }}
            />
          </div>
        </div>
        
        <div className="emotion-sources">
          {displayData.sources.voice && <span className="source-badge voice">🎤 Voice</span>}
          {displayData.sources.face && <span className="source-badge face">😊 Face</span>}
        </div>
        
        <div className="top-emotions">
          {displayData.topEmotions.map((emotion, idx) => (
            <div key={idx} className="emotion-item">
              <span>{emotion.name}</span>
              <div className="emotion-bar">
                <div 
                  className="emotion-bar-fill"
                  style={{ 
                    width: `${emotion.score}%`,
                    backgroundColor: emotionConfig.find(e => e.name === emotion.name)?.color 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render transcript history
  const renderTranscripts = () => {
    if (transcripts.length === 0) return null;
    
    return (
      <div className="transcript-history">
        <h3>Recent Transcripts</h3>
        <div className="transcript-list">
          {transcripts.map((t, idx) => (
            <div key={idx} className="transcript-item">
              <span className="transcript-emotion">{emotionEmojis[t.emotion] || '😐'}</span>
              <span className="transcript-text">{t.text}</span>
              <span className="transcript-confidence">{t.confidence}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="emotion-analysis-unified">
      <div className="analysis-header">
        <h2>Unified Emotion Analysis</h2>
        <div className="analysis-status">
          {isAnalyzing ? (
            <span className="status-active">🔴 Analyzing</span>
          ) : (
            <span className="status-inactive">⚪ Not Active</span>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <div className="emotion-cards-container">
        {renderEmotionCard('Your Emotions', unifiedEmotions1, true)}
        {renderEmotionCard('Partner Emotions', unifiedEmotions2, false)}
      </div>

      {emotionHistory.length > 0 && (
        <div className="emotion-chart">
          <h3>Emotion Timeline</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={emotionHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(time) => new Date(time).toLocaleTimeString()}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="intensity" 
                stroke="#8884d8" 
                name="Intensity"
              />
              <Line 
                type="monotone" 
                dataKey="confidence" 
                stroke="#82ca9d" 
                name="Confidence"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {renderTranscripts()}

      <div className="analysis-summary">
        <h3>Session Summary</h3>
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">Duration:</span>
            <span className="stat-value">
              {Math.floor((Date.now() - summaryDataRef.current.startTime) / 60000)} min
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Avg Confidence:</span>
            <span className="stat-value">
              {Math.round(summaryDataRef.current.user1.confidence)}%
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Transcripts:</span>
            <span className="stat-value">{transcripts.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionAnalysisUnified;
