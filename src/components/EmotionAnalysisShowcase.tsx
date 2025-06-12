import React, { useState, useRef, useEffect } from 'react';
import { HumeExpressionService } from '../services/HumeExpressionService';
import { HumeVoiceService, TranscriptSegment } from '../services/humeVoiceService';
import RealTimeEmotionSliders from './RealTimeEmotionSliders';
import TranscriptTimeline from './TranscriptTimeline';
import './EmotionAnalysisShowcase.css';

interface AnalysisMode {
  facial: boolean;
  prosody: boolean;
}

const EmotionAnalysisShowcase: React.FC = () => {
  const [mode, setMode] = useState<AnalysisMode>({ facial: true, prosody: true });
  const [isRecording, setIsRecording] = useState(false);
  const [facialEmotions, setFacialEmotions] = useState<Array<{ emotion: string; score: number }>>([]);
  const [prosodyEmotions, setProsodyEmotions] = useState<Array<{ name: string; score: number }>>([]);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const humeExpressionService = useRef<HumeExpressionService | null>(null);
  const humeVoiceService = useRef<HumeVoiceService | null>(null);
  const recordingStartTime = useRef<number | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize services
  useEffect(() => {
    humeExpressionService.current = new HumeExpressionService();
    humeVoiceService.current = new HumeVoiceService();

    // Set up facial expression service
    if (humeExpressionService.current && videoRef.current) {
      humeExpressionService.current.setOnEmotionCallback((emotions) => {
        console.log('[EmotionShowcase] Received facial emotions:', emotions);
        setFacialEmotions(emotions);
      });
    }

    // Set up voice service callbacks
    if (humeVoiceService.current) {
      humeVoiceService.current.setOnEmotionCallback((emotions) => {
        console.log('[EmotionShowcase] Received prosody emotions:', emotions);
        setProsodyEmotions(emotions);
      });

      humeVoiceService.current.setOnTranscriptCallback((segment: TranscriptSegment) => {
        console.log('[EmotionShowcase] Received transcript segment:', segment);
        // Always capture transcript segments when they arrive
        const updatedSegment = {
          ...segment,
          prosodyEmotions: segment.prosodyEmotions || [],
          facialEmotions: facialEmotions.map(e => ({ name: e.emotion, score: e.score })),
          emotions: [] // We'll compute combined later if needed
        };
        
        setTranscriptSegments(prev => {
          const newSegments = [...prev, updatedSegment];
          console.log('[EmotionShowcase] Total transcript segments:', newSegments.length);
          return newSegments;
        });
      });
    }

    return () => {
      stopRecording();
    };
  }, [facialEmotions]);

  // Update facial emotions in voice service when they change
  useEffect(() => {
    if (humeVoiceService.current && mode.facial && facialEmotions.length > 0) {
      const formattedEmotions = facialEmotions.map(e => ({
        name: e.emotion,
        score: e.score
      }));
      humeVoiceService.current.setFacialEmotions(formattedEmotions);
    }
  }, [facialEmotions, mode.facial]);

  const startRecording = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: mode.facial, 
        audio: mode.prosody 
      });
      setLocalStream(stream);

      // Set up video if facial mode is enabled
      if (mode.facial && videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Start facial tracking if enabled
        if (mode.facial && videoRef.current && humeExpressionService.current) {
          await humeExpressionService.current.startTracking(videoRef.current);
        }
      }

      // Connect voice service if prosody mode is enabled
      if (mode.prosody && humeVoiceService.current) {
        await humeVoiceService.current.connect();
        // Audio recording starts automatically when connected
      }

      // Start recording timer
      recordingStartTime.current = Date.now();
      setIsRecording(true);
      
      // Update duration every 100ms
      durationInterval.current = setInterval(() => {
        if (recordingStartTime.current) {
          setRecordingDuration(Date.now() - recordingStartTime.current);
        }
      }, 100);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording. Please check your camera/microphone permissions.');
    }
  };

  const stopRecording = () => {
    // Stop facial tracking
    if (humeExpressionService.current) {
      humeExpressionService.current.stopTracking();
    }

    // Disconnect voice service
    if (humeVoiceService.current) {
      humeVoiceService.current.disconnect();
    }

    // Stop media stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Clear video
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Stop duration timer
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }

    setIsRecording(false);
  };

  const toggleMode = (modeType: 'facial' | 'prosody') => {
    if (isRecording) {
      alert('Please stop recording before changing modes');
      return;
    }

    setMode(prev => ({
      ...prev,
      [modeType]: !prev[modeType]
    }));
  };

  const clearData = () => {
    setTranscriptSegments([]);
    setFacialEmotions([]);
    setProsodyEmotions([]);
    setRecordingDuration(0);
    if (humeVoiceService.current) {
      humeVoiceService.current.clearTranscriptHistory();
    }
  };

  const sendTestMessage = () => {
    if (humeVoiceService.current && isRecording) {
      console.log('[EmotionShowcase] Sending test message...');
      humeVoiceService.current.sendTextMessage("Hello, how are you today?");
    } else {
      console.log('[EmotionShowcase] Voice service not connected or not recording');
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="emotion-analysis-showcase">
      <div className="showcase-header">
        <h1>🎭 Emotion Analysis Feature Stack</h1>
        <p>Experience the power of facial and voice emotion analysis</p>
      </div>

      {/* Mode Selection */}
      <div className="mode-controls">
        <div className="mode-toggle">
          <label>
            <input
              type="checkbox"
              checked={mode.facial}
              onChange={() => toggleMode('facial')}
              disabled={isRecording}
            />
            <span className="toggle-label">😊 Facial Analysis</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={mode.prosody}
              onChange={() => toggleMode('prosody')}
              disabled={isRecording}
            />
            <span className="toggle-label">🎙️ Voice Prosody Analysis</span>
          </label>
        </div>
        
        <div className="mode-description">
          {mode.facial && mode.prosody && (
            <p>🔥 <strong>Combined Mode:</strong> Analyzing both facial expressions and voice prosody for complete emotional insight</p>
          )}
          {mode.facial && !mode.prosody && (
            <p>😊 <strong>Facial Only:</strong> Tracking emotions through facial expressions and micro-movements</p>
          )}
          {!mode.facial && mode.prosody && (
            <p>🎙️ <strong>Voice Only:</strong> Detecting emotions through speech patterns, tone, and prosody</p>
          )}
          {!mode.facial && !mode.prosody && (
            <p>⚠️ Please select at least one analysis mode</p>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="analysis-container">
        {/* Left Panel - Video/Audio Input + Facial Emotions */}
        <div className="input-panel">
          <div className="video-section">
            {mode.facial ? (
              <video
                ref={videoRef}
                className="analysis-video"
                playsInline
                muted
              />
            ) : (
              <div className="audio-only-display">
                <div className="audio-visualizer">
                  <div className="audio-icon">🎙️</div>
                  <div className="audio-waves">
                    <span></span><span></span><span></span><span></span><span></span>
                  </div>
                </div>
                <p>Audio-only mode active</p>
              </div>
            )}
            
            {isRecording && (
              <div className="recording-indicator">
                <span className="rec-dot"></span>
                Recording: {formatDuration(recordingDuration)}
              </div>
            )}
          </div>

          <div className="control-buttons">
            {!isRecording ? (
              <button
                className="control-btn start"
                onClick={startRecording}
                disabled={!mode.facial && !mode.prosody}
              >
                🔴 Start Analysis
              </button>
            ) : (
              <button
                className="control-btn stop"
                onClick={stopRecording}
              >
                ⏹️ Stop Analysis
              </button>
            )}
            
            <button
              className="control-btn clear"
              onClick={clearData}
              disabled={isRecording}
            >
              🗑️ Clear Data
            </button>

            {mode.prosody && isRecording && (
              <button
                className="control-btn test"
                onClick={sendTestMessage}
              >
                🎤 Send Test Message
              </button>
            )}
          </div>

          {/* Facial Emotions shown below video when in facial mode */}
          {mode.facial && (
            <div className="emotion-section">
              <h3>😊 Facial Emotion Analysis</h3>
              <RealTimeEmotionSliders
                emotions={facialEmotions}
                participantName="Your Face"
              />
            </div>
          )}
        </div>

        {/* Right Panel - Prosody Analysis + Live Transcript */}
        <div className="emotion-panel">
          {mode.prosody && (
            <>
              <div className="emotion-section">
                <h3>🎙️ Voice Prosody Analysis</h3>
                <RealTimeEmotionSliders
                  emotions={prosodyEmotions.map(e => ({ 
                    emotion: e.name || 'unknown', 
                    score: e.score || 0 
                  }))}
                  participantName="Your Voice"
                />
              </div>

              {/* Live Transcript for Prosody */}
              <div className="live-transcript">
                <h4>📝 Live Transcript</h4>
                <div className="transcript-content">
                  {transcriptSegments.length > 0 ? (
                    transcriptSegments.slice(-5).map((segment, index) => (
                      <div key={index} className="transcript-line">
                        <span className="speaker">{segment.speaker}:</span>
                        <span className="text">{segment.text}</span>
                      </div>
                    ))
                  ) : (
                    <p className="no-transcript">Start speaking to see transcript...</p>
                  )}
                </div>
              </div>
            </>
          )}
          
          {mode.facial && mode.prosody && (
            <div className="comparison-insights">
              <h4>🔍 Voice vs Face Insights</h4>
              <div className="insight-cards">
                {/* We'll add dynamic insights here based on emotion differences */}
                <div className="insight-card">
                  <span className="insight-icon">🎭</span>
                  <p>Comparing emotional signals from voice and face...</p>
                </div>
              </div>
            </div>
          )}

          {/* Show placeholder when only facial mode is active */}
          {mode.facial && !mode.prosody && (
            <div className="prosody-placeholder">
              <div className="placeholder-content">
                <span className="placeholder-icon">🎙️</span>
                <h4>Voice Analysis Disabled</h4>
                <p>Enable voice prosody analysis to see speech emotions and transcript</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Transcript Timeline - shown at bottom when there's data */}
      {transcriptSegments.length > 0 && (
        <div className="transcript-section">
          <h2>📝 Emotion-Mapped Transcript</h2>
          <TranscriptTimeline
            segments={transcriptSegments}
            callDuration={recordingDuration / 1000}
          />
        </div>
      )}
    </div>
  );
};

export default EmotionAnalysisShowcase;
