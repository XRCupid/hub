import React, { useState, useEffect, useRef } from 'react';
import HumeAIService from '../services/HumeAIService';
import './EmotionAnalysis.css';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer
} from 'recharts';

// Emotion labels and colors mapping - Removed surprise
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

// Keywords associated with emotions
const emotionKeywords = {
  Joy: ['happy', 'laugh', 'amazing', 'love', 'great', 'awesome', 'excited', 'fun'],
  Interest: ['curious', 'tell me more', 'interesting', 'fascinating', 'cool', 'neat'],
  Concentration: ['focus', 'understand', 'thinking', 'consider', 'analyze'],
  Boredom: ['boring', 'bored', 'dull', 'whatever', 'meh', 'tired', 'slow'],
  Confusion: ['confused', 'what?', 'don\'t understand', 'unclear', 'complicated'],
  Doubt: ['maybe', 'not sure', 'doubt', 'skeptical', 'really?', 'hmm'],
  Sadness: ['sad', 'upset', 'disappointed', 'unhappy', 'miss', 'sorry'],
  Disgust: ['gross', 'disgusting', 'terrible', 'awful', 'hate', 'dislike'],
  Anxiety: ['worried', 'nervous', 'anxious', 'afraid', 'scared', 'stress', 'fear']
};

const EmotionAnalysis = ({ localStream, remoteStream, apiKey, roomId, userId, onEmotionDataUpdate }) => {
  const [facialEmotions1, setFacialEmotions1] = useState({});
  const [facialEmotions2, setFacialEmotions2] = useState({});
  const [voiceEmotions1, setVoiceEmotions1] = useState({});
  const [voiceEmotions2, setVoiceEmotions2] = useState({});

  const [emotionHistory1, setEmotionHistory1] = useState([]);
  const [emotionHistory2, setEmotionHistory2] = useState([]);

  const [analysisType, setAnalysisType] = useState('facial'); // 'facial' or 'voice'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  // Track conversation topics and keywords
  const [conversationKeywords, setConversationKeywords] = useState({});
  const [detectedTopics, setDetectedTopics] = useState([]);

  // Video refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Off-screen canvases for capturing frames
  const localCanvasRef = useRef(null);
  const remoteCanvasRef = useRef(null);

  // Hume AI service instance
  const humeServiceRef = useRef(null);

  // Intervals and audio context
  const captureInterval = useRef(null);
  const audioProcessorRef = useRef({ local: null, remote: null });
  const audioContextRef = useRef(null);

  // Tracking which source last requested an analysis (so we map responses to local/remote)
  const expectedResponseSourceRef = useRef(null);

  // Debounce times for capturing
  const captureDebounceRef = useRef({ local: 0, remote: 0 });

  // Track if each video is loaded
  const [localVideoReady, setLocalVideoReady] = useState(false);
  const [remoteVideoReady, setRemoteVideoReady] = useState(false);

  // Store emotion data for summary
  const summaryDataRef = useRef({
    user1: {
      emotionTrends: [],
      dominantEmotions: {},
      keywords: {},
    },
    user2: {
      emotionTrends: [],
      dominantEmotions: {},
      keywords: {},
    },
    startTime: Date.now(),
    topics: []
  });

  // Initialize Hume AI service
  useEffect(() => {
    if (!apiKey) {
      setError('Hume AI API key is missing');
      return;
    }
    try {
      // console.log('Initializing Hume AI service with key:', apiKey);
      humeServiceRef.current = new HumeAIService(apiKey);

      return () => {
        stopAnalysis();
      };
    } catch (err) {
      // console.error('Error initializing Hume service:', err);
      setError(`Failed to initialize Hume AI service: ${err.message}`);
    }
  }, [apiKey]);

  // Update video elements when streams change
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  // Start analysis once isAnalyzing === true
  useEffect(() => {
    if (!isAnalyzing || !humeServiceRef.current) {
      return;
    }
    setError('');

    // Start either facial or voice
    if (analysisType === 'facial') {
      setupFacialAnalysis();
    } else if (analysisType === 'voice') {
      setupVoiceAnalysis();
    }
  }, [isAnalyzing, analysisType]);

  // Periodically update summary data
  useEffect(() => {
    if (!isAnalyzing) return;

    const updateSummaryInterval = setInterval(() => {
      // Update summary data
      const currentTime = Date.now();
      const durationMinutes = (currentTime - summaryDataRef.current.startTime) / 60000;
      
      // Get dominant emotions
      const user1Emotions = getEmotions(1);
      const user2Emotions = getEmotions(2);
      
      // Update emotion trends
      summaryDataRef.current.user1.emotionTrends.push({
        timestamp: currentTime,
        emotions: { ...user1Emotions }
      });
      
      summaryDataRef.current.user2.emotionTrends.push({
        timestamp: currentTime,
        emotions: { ...user2Emotions }
      });
      
      // Calculate dominant emotions
      const dominantEmotion1 = getDominantEmotion(user1Emotions);
      const dominantEmotion2 = getDominantEmotion(user2Emotions);
      
      if (dominantEmotion1) {
        summaryDataRef.current.user1.dominantEmotions[dominantEmotion1] = 
          (summaryDataRef.current.user1.dominantEmotions[dominantEmotion1] || 0) + 1;
      }
      
      if (dominantEmotion2) {
        summaryDataRef.current.user2.dominantEmotions[dominantEmotion2] = 
          (summaryDataRef.current.user2.dominantEmotions[dominantEmotion2] || 0) + 1;
      }
      
      // Notify parent component about emotion data update
      if (onEmotionDataUpdate) {
        onEmotionDataUpdate({
          roomId,
          userId,
          summaryData: summaryDataRef.current,
          currentEmotions: {
            user1: user1Emotions,
            user2: user2Emotions
          }
        });
      }
    }, 10000); // Update every 10 seconds
    
    return () => {
      clearInterval(updateSummaryInterval);
    };
  }, [isAnalyzing, roomId, userId, onEmotionDataUpdate]);

  // Get dominant emotion from emotion object
  const getDominantEmotion = (emotions) => {
    if (!emotions || Object.keys(emotions).length === 0) return null;
    
    let dominant = null;
    let highestScore = 0;
    
    Object.entries(emotions).forEach(([emotion, score]) => {
      if (score > highestScore && score > 0.3) { // Only count if score is significant
        highestScore = score;
        dominant = emotion;
      }
    });
    
    return dominant;
  };

  // Start / Stop Analysis
  const startAnalysis = () => {
    if (!localStream || !remoteStream) {
      setError('Video/Audio streams not available');
      return;
    }
    setError('');
    setIsAnalyzing(true);
    
    // Reset summary data
    summaryDataRef.current = {
      user1: {
        emotionTrends: [],
        dominantEmotions: {},
        keywords: {},
      },
      user2: {
        emotionTrends: [],
        dominantEmotions: {},
        keywords: {},
      },
      startTime: Date.now(),
      topics: []
    };
  };

  const stopAnalysis = () => {
    // console.log('Stopping analysis');
    if (captureInterval.current) {
      clearInterval(captureInterval.current);
      captureInterval.current = null;
    }
    if (audioProcessorRef.current) {
      try {
        if (audioProcessorRef.current.local) {
          audioProcessorRef.current.local.disconnect();
        }
        if (audioProcessorRef.current.remote) {
          audioProcessorRef.current.remote.disconnect();
        }
      } catch (e) {
        // console.log('Error disconnecting audio processor:', e);
      }
      audioProcessorRef.current = { local: null, remote: null };
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // console.log('Error closing audio context:', e);
      }
      audioContextRef.current = null;
    }

    if (humeServiceRef.current) {
      humeServiceRef.current.disconnect();
    }
    setIsAnalyzing(false);
  };

  // Facial Analysis
  const setupFacialAnalysis = () => {
    humeServiceRef.current.connectFacial((data) => {
      // console.log('Facial data received:', data);
      if (data.error) {
        // console.error('Error from Hume API:', data.error);
        return;
      }
      const predictions = data.face?.predictions || [];
      if (!predictions.length) {
        // console.log('No valid facial predictions in data');
        return;
      }

      // Determine whether this result is for local or remote
      const source = expectedResponseSourceRef.current;
      if (source) {
        if (source === 'local' && predictions[0]) {
          updateFacialEmotionsLocal(predictions[0].emotions);
        } else if (source === 'remote' && predictions[0]) {
          updateFacialEmotionsRemote(predictions[0].emotions);
        }
      } else {
        // Fallback if we didn't set the source
        if (predictions.length === 1) {
          updateFacialEmotionsLocal(predictions[0].emotions);
        } else if (predictions.length > 1) {
          updateFacialEmotionsLocal(predictions[0].emotions);
          updateFacialEmotionsRemote(predictions[1].emotions);
        }
      }
      // Reset expected source
      expectedResponseSourceRef.current = null;
    });

    // Delay a bit to ensure WebSocket is connected
    setTimeout(() => {
      // Only set up video capture if both videos are loaded
      if (localVideoReady && remoteVideoReady) {
        setupVideoCaptureForAnalysis();
      } else {
        // console.log('Videos not fully loaded yet; waiting for metadata...');
      }
    }, 1000);
  };

  const updateFacialEmotionsLocal = (emotions) => {
    if (!Array.isArray(emotions)) return;
    const emotionMap = {};
    emotions.forEach((emo) => {
      // Skip 'Surprise' emotion
      if (emo.name !== 'Surprise') {
        emotionMap[emo.name] = emo.score;
      }
    });
    const timestamp = Date.now();
    setFacialEmotions1(emotionMap);
    setEmotionHistory1((prev) => {
      const newPoint = { timestamp, emotions: emotionMap };
      return [...prev, newPoint].filter((p) => timestamp - p.timestamp < 30000);
    });
  };

  const updateFacialEmotionsRemote = (emotions) => {
    if (!Array.isArray(emotions)) return;
    const emotionMap = {};
    emotions.forEach((emo) => {
      // Skip 'Surprise' emotion
      if (emo.name !== 'Surprise') {
        emotionMap[emo.name] = emo.score;
      }
    });
    const timestamp = Date.now();
    setFacialEmotions2(emotionMap);
    setEmotionHistory2((prev) => {
      const newPoint = { timestamp, emotions: emotionMap };
      return [...prev, newPoint].filter((p) => timestamp - p.timestamp < 30000);
    });
  };

  // Voice (Prosody) Analysis
  const setupVoiceAnalysis = () => {
    humeServiceRef.current.connectProsody((data) => {
      // console.log('Prosody data received:', data);
      if (data.error) {
        // console.error('Error from Hume API:', data.error);
        return;
      }
      if (!data.prosody?.predictions?.[0]) {
        // console.log('Invalid prosody data:', data);
        return;
      }
      const source = expectedResponseSourceRef.current;
      const emotions = data.prosody.predictions[0].emotions || [];
      const emotionMap = {};
      emotions.forEach((e) => {
        // Skip 'Surprise' emotion
        if (e.name !== 'Surprise') {
          emotionMap[e.name] = e.score;
        }
      });

      if (source === 'local') {
        setVoiceEmotions1(emotionMap);
        const timestamp = Date.now();
        const newPoint = { timestamp, emotions: emotionMap };
        setEmotionHistory1((prev) => {
          return [...prev, newPoint].filter((p) => timestamp - p.timestamp < 30000);
        });
      } else if (source === 'remote') {
        setVoiceEmotions2(emotionMap);
        const timestamp = Date.now();
        const newPoint = { timestamp, emotions: emotionMap };
        setEmotionHistory2((prev) => {
          return [...prev, newPoint].filter((p) => timestamp - p.timestamp < 30000);
        });
      }
      expectedResponseSourceRef.current = null;
    });

    // Delay to ensure WebSocket is connected
    setTimeout(() => {
      setupAudioCaptureForAnalysis();
    }, 1000);
  };

  // Setup video capture
  const setupVideoCaptureForAnalysis = () => {
    if (!localVideoRef.current || !remoteVideoRef.current) {
      // console.warn('Video refs not available');
      return;
    }
    if (!localCanvasRef.current) {
      localCanvasRef.current = document.createElement('canvas');
    }
    if (!remoteCanvasRef.current) {
      remoteCanvasRef.current = document.createElement('canvas');
    }

    // console.log('Setting up video capture intervals...');
    // Clear any existing interval just in case
    if (captureInterval.current) {
      clearInterval(captureInterval.current);
    }

    // Capture frames every 3 seconds
    captureInterval.current = setInterval(() => {
      // Local first
      captureVideoFrame(localVideoRef.current, localCanvasRef.current, 'local');
      // Then remote 1.5s later
      setTimeout(() => {
        captureVideoFrame(remoteVideoRef.current, remoteCanvasRef.current, 'remote');
      }, 1500);
    }, 3000);

    // (Optional) capture an immediate frame, if you want to try right away
    captureVideoFrame(localVideoRef.current, localCanvasRef.current, 'local');
    setTimeout(() => {
      captureVideoFrame(remoteVideoRef.current, remoteCanvasRef.current, 'remote');
    }, 500);
  };

  // Capture a video frame & send
  const captureVideoFrame = (videoElement, canvasElement, source) => {
    if (!videoElement || !canvasElement || !humeServiceRef.current || !isAnalyzing) {
      // console.log(`Skipping frame capture for ${source} - not ready or not analyzing`);
      return;
    }

    // Debounce so we don't spam
    const now = Date.now();
    if (now - captureDebounceRef.current[source] < 2000) {
      // console.log(`Skipping ${source} capture - too soon`);
      return;
    }
    captureDebounceRef.current[source] = now;

    // If video is paused or ended, try to play it
    if (videoElement.paused || videoElement.ended) {
      try {
        videoElement.play().catch((err) => {
          // console.log(`Error playing ${source} video:`, err);
        });
      } catch (err) {
        // console.log(`Unexpected error playing ${source} video:`, err);
      }
    }

    // Delay 200ms to let video "play" if it was paused
    setTimeout(() => {
      if (videoElement.readyState !== 4 || videoElement.paused || videoElement.ended) {
        // console.log(
        //   `Video not ready for ${source}:`,
        //   videoElement.readyState,
        //   videoElement.paused,
        //   videoElement.ended
        // );
        return;
      }
      const width = videoElement.videoWidth;
      const height = videoElement.videoHeight;
      if (!width || !height) {
        // console.log(`Invalid video dimensions for ${source}: ${width}x${height}`);
        return;
      }

      canvasElement.width = width;
      canvasElement.height = height;
      const ctx = canvasElement.getContext('2d');
      try {
        ctx.drawImage(videoElement, 0, 0, width, height);
        const imageData = canvasElement.toDataURL('image/jpeg', 0.8);

        expectedResponseSourceRef.current = source;
        // console.log(`Sending image for ${source} analysis`);

        humeServiceRef.current.sendImageForAnalysis(imageData);
      } catch (error) {
        // console.error(`Frame capture error for ${source}:`, error);
      }
    }, 200);
  };

  // Setup audio capture
  const setupAudioCaptureForAnalysis = () => {
    if (!localStream || !remoteStream || !humeServiceRef.current) {
      // console.warn('Audio streams or Hume service missing');
      return;
    }
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;

    const localTrack = localStream.getAudioTracks()[0];
    const remoteTrack = remoteStream.getAudioTracks()[0];
    if (!localTrack || !remoteTrack) {
      // console.warn('Missing local/remote audio track');
      return;
    }

    const localSource = audioContext.createMediaStreamSource(new MediaStream([localTrack]));
    const remoteSource = audioContext.createMediaStreamSource(new MediaStream([remoteTrack]));

    const processorLocal = audioContext.createScriptProcessor(4096, 1, 1);
    const processorRemote = audioContext.createScriptProcessor(4096, 1, 1);

    const sampleRate = audioContext.sampleRate;
    const maxBufferSize = Math.floor(sampleRate * 4.5);
    let localBuffer = [];
    let remoteBuffer = [];

    let lastLocalAnalysisTime = 0;
    let lastRemoteAnalysisTime = 0;
    const minAnalysisInterval = 5000; // 5s

    processorLocal.onaudioprocess = (e) => {
      const channelData = e.inputBuffer.getChannelData(0);
      localBuffer = localBuffer.concat(Array.from(channelData));

      const now = Date.now();
      if (localBuffer.length >= maxBufferSize && now - lastLocalAnalysisTime >= minAnalysisInterval) {
        const trimmed = localBuffer.slice(0, maxBufferSize);
        expectedResponseSourceRef.current = 'local';
        humeServiceRef.current.sendAudioForAnalysis(new Float32Array(trimmed));
        localBuffer = localBuffer.slice(maxBufferSize);
        lastLocalAnalysisTime = now;
      }
    };

    processorRemote.onaudioprocess = (e) => {
      const channelData = e.inputBuffer.getChannelData(0);
      remoteBuffer = remoteBuffer.concat(Array.from(channelData));

      const now = Date.now();
      if (remoteBuffer.length >= maxBufferSize && now - lastRemoteAnalysisTime >= minAnalysisInterval) {
        const trimmed = remoteBuffer.slice(0, maxBufferSize);
        expectedResponseSourceRef.current = 'remote';
        humeServiceRef.current.sendAudioForAnalysis(new Float32Array(trimmed));
        remoteBuffer = remoteBuffer.slice(maxBufferSize);
        lastRemoteAnalysisTime = now;
      }
    };

    localSource.connect(processorLocal);
    processorLocal.connect(audioContext.destination);

    remoteSource.connect(processorRemote);
    processorRemote.connect(audioContext.destination);

    audioProcessorRef.current = { local: processorLocal, remote: processorRemote };
  };

  // Helper to retrieve current emotions
  const getEmotions = (participantNumber) => {
    if (analysisType === 'facial') {
      return participantNumber === 1 ? facialEmotions1 : facialEmotions2;
    } else {
      return participantNumber === 1 ? voiceEmotions1 : voiceEmotions2;
    }
  };

  // Helper to retrieve emotion history
  const getHistory = (participantNumber) => {
    return participantNumber === 1 ? emotionHistory1 : emotionHistory2;
  };

  // Prepare chart data
  const prepareChartData = (participantId) => {
    const history = getHistory(participantId);
    if (history.length < 2) {
      return [];
    }
    // We'll pick top 3 emotions to plot
    const defaultTop3 = ['Joy', 'Interest', 'Concentration'];
    let topEmotions = [...defaultTop3];

    // Find the real top 3 based on average
    if (history.length > 0) {
      const emotionScores = {};
      emotionConfig.forEach((emotion) => {
        const scores = history
          .map((point) => point.emotions[emotion.name] || 0)
          .filter((v) => v > 0);
        if (scores.length > 0) {
          emotionScores[emotion.name] = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        } else {
          emotionScores[emotion.name] = 0;
        }
      });
      topEmotions = Object.keys(emotionScores)
        .sort((a, b) => emotionScores[b] - emotionScores[a])
        .slice(0, 3);
    }

    return history.map((point) => {
      const result = {
        timestamp: point.timestamp,
        formattedTime: new Date(point.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };
      topEmotions.forEach((emotion) => {
        result[emotion] = point.emotions[emotion] ? Math.round(point.emotions[emotion] * 100) : 0;
      });
      return result;
    });
  };

  // Render emotion bars
  const renderEmotionBars = (participantId) => {
    const emotions = getEmotions(participantId);
    if (!emotions || Object.keys(emotions).length === 0) {
      return (
        <div className="emotion-bars empty">
          <p>
            No emotion data yet.{' '}
            {isAnalyzing ? 'Analyzing...' : 'Start analysis to see results.'}
          </p>
        </div>
      );
    }

    return (
      <div className="emotion-bars">
        {emotionConfig.map((emotion) => {
          const value = emotions[emotion.name] || 0;
          return (
            <div key={emotion.name} className="emotion-bar-container">
              <div className="emotion-label">
                <span className="emotion-emoji">{emotionEmojis[emotion.name]}</span>
                <span className="emotion-name">{emotion.name}</span>
              </div>
              <div className="emotion-bar-background">
                <div
                  className="emotion-bar"
                  style={{
                    width: `${(value * 100).toFixed(1)}%`,
                    backgroundColor: emotion.color,
                  }}
                />
              </div>
              <div className="emotion-value">{(value * 100).toFixed(1)}%</div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render emotion trend
  const renderEmotionTrend = (participantId) => {
    const history = getHistory(participantId);
    if (history.length < 2) {
      return (
        <div className="emotion-trend empty">
          <p>
            Not enough data for trend visualization.
            {!isAnalyzing ? ' Start analysis to collect data.' : ' Collecting data...'}
          </p>
        </div>
      );
    }
    const chartData = prepareChartData(participantId);
    if (!chartData.length) {
      return null;
    }
    // Get top emotion keys from the first data row
    const topEmotions = Object.keys(chartData[0]).filter(
      (k) => k !== 'timestamp' && k !== 'formattedTime'
    );

    return (
      <div className="emotion-trend">
        <h4>Emotion Trend Over Time</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis
              dataKey="formattedTime"
              tick={{ fontSize: 12 }}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              domain={[0, 100]}
              label={{
                value: 'Emotion Intensity (%)',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12 },
              }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, null]}
              labelFormatter={(label) => `Time: ${label}`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '10px',
              }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12 }}
            />

            {topEmotions.map((emotion) => {
              const config = emotionConfig.find((e) => e.name === emotion);
              const color = config ? config.color : '#999';
              return (
                <Line
                  key={emotion}
                  type="monotone"
                  dataKey={emotion}
                  stroke={color}
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                  dot={{ r: 4 }}
                  name={`${emotion} ${emotionEmojis[emotion] || ''}`}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Export summary data
  const getSummaryData = () => {
    return summaryDataRef.current;
  };

  // Render
  return (
    <div className="emotion-analysis-container">
      {/* Controls */}
      <div className="analysis-controls">
        <div className="analysis-type-selector">
          <label>
            <input
              type="radio"
              name="analysisType"
              value="facial"
              checked={analysisType === 'facial'}
              onChange={() => setAnalysisType('facial')}
              disabled={isAnalyzing}
            />
            Facial Expression Analysis
          </label>
          <label>
            <input
              type="radio"
              name="analysisType"
              value="voice"
              checked={analysisType === 'voice'}
              onChange={() => setAnalysisType('voice')}
              disabled={isAnalyzing}
            />
            Voice Expression Analysis
          </label>
        </div>

        <div className="analysis-action-buttons">
          {!isAnalyzing ? (
            <button
              className="analysis-button start-button"
              onClick={startAnalysis}
              disabled={!humeServiceRef.current || !localStream || !remoteStream}
            >
              Start {analysisType.charAt(0).toUpperCase() + analysisType.slice(1)} Analysis
            </button>
          ) : (
            <button className="analysis-button stop-button" onClick={stopAnalysis}>
              Stop Analysis
            </button>
          )}
        </div>
      </div>

      {error && <div className="analysis-error">{error}</div>}

      {/* Hidden video elements */}
      <div style={{ display: 'none' }}>
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          onLoadedMetadata={() => {
            // console.log('Local video metadata loaded');
            setLocalVideoReady(true);
          }}
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          onLoadedMetadata={() => {
            // console.log('Remote video metadata loaded');
            setRemoteVideoReady(true);
          }}
        />
      </div>

      {/* Participant 1 = You */}
      <div className="participant-emotions">
        <h3>You</h3>
        {renderEmotionBars(1)}
        {renderEmotionTrend(1)}
      </div>

      {/* Participant 2 = Remote */}
      <div className="participant-emotions">
        <h3>Remote User</h3>
        {renderEmotionBars(2)}
        {renderEmotionTrend(2)}
      </div>
    </div>
  );
};

export default EmotionAnalysis;