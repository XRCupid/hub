import React, { useState, useEffect, useRef } from 'react';
import UnifiedEmotionService from '../services/UnifiedEmotionService';
import './TestUnifiedEmotions.css';

interface TestResult {
  timestamp: number;
  type: string;
  data: any;
}

const TestUnifiedEmotions: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [status, setStatus] = useState('Ready to test');
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const serviceRef = useRef<UnifiedEmotionService | null>(null);
  const startTimeRef = useRef<number>(0);

  // Statistics
  const [stats, setStats] = useState({
    totalEmotions: 0,
    totalTranscripts: 0,
    totalErrors: 0,
    avgConfidence: 0,
    syncRate: 0,
    dominantEmotion: '',
    emotionBreakdown: {} as Record<string, number>
  });

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      stopTest();
    };
  }, []);

  const startTest = async () => {
    try {
      setStatus('Initializing camera...');
      setResults([]);
      startTimeRef.current = Date.now();
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setVideoStream(stream);
      
      // Set video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setStatus('Connecting to Unified Emotion Service...');
      
      // Initialize UnifiedEmotionService
      const service = new UnifiedEmotionService();
      serviceRef.current = service;
      
      // Set up callbacks
      service.setOnUnifiedEmotionCallback((data: any) => {
        const result: TestResult = {
          timestamp: Date.now() - startTimeRef.current,
          type: 'unified_emotion',
          data: {
            dominant: data.dominantEmotion,
            intensity: data.emotionIntensity,
            confidence: data.confidence,
            hasFacial: data.facialEmotions?.length > 0,
            hasProsody: data.prosodyEmotions?.length > 0
          }
        };
        
        setResults(prev => [...prev, result]);
        updateStats('emotion', data);
        
        console.log('[TestUnified] Emotion:', result.data);
      });
      
      service.setOnTranscriptWithEmotionsCallback((data: any) => {
        const result: TestResult = {
          timestamp: Date.now() - startTimeRef.current,
          type: 'transcript',
          data: {
            text: data.text,
            emotion: data.dominantEmotion,
            confidence: data.confidence
          }
        };
        
        setResults(prev => [...prev, result]);
        updateStats('transcript', data);
        
        console.log('[TestUnified] Transcript:', result.data);
      });
      
      service.setOnErrorCallback((error: any) => {
        const result: TestResult = {
          timestamp: Date.now() - startTimeRef.current,
          type: 'error',
          data: { error: error.message || error }
        };
        
        setResults(prev => [...prev, result]);
        updateStats('error', error);
        
        console.error('[TestUnified] Error:', error);
      });
      
      // Connect with video element
      await service.connect(videoRef.current);
      
      setStatus('Test running - Speak and show emotions!');
      setIsRunning(true);
      
    } catch (error) {
      console.error('Failed to start test:', error);
      setStatus(`Error: ${error}`);
    }
  };

  const stopTest = async () => {
    try {
      setStatus('Stopping test...');
      
      // Disconnect service
      if (serviceRef.current) {
        await serviceRef.current.disconnect();
        serviceRef.current = null;
      }
      
      // Stop video stream
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        setVideoStream(null);
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      setIsRunning(false);
      setStatus('Test stopped');
      
      // Generate final report
      generateReport();
      
    } catch (error) {
      console.error('Error stopping test:', error);
      setStatus(`Error stopping: ${error}`);
    }
  };

  const updateStats = (type: string, data: any) => {
    setStats(prev => {
      const updated = { ...prev };
      
      if (type === 'emotion') {
        updated.totalEmotions++;
        
        // Update emotion breakdown
        const emotion = data.dominantEmotion;
        if (emotion) {
          updated.emotionBreakdown[emotion] = (updated.emotionBreakdown[emotion] || 0) + 1;
          
          // Find most common emotion
          let maxCount = 0;
          let dominant = '';
          Object.entries(updated.emotionBreakdown).forEach(([em, count]) => {
            if ((count as number) > maxCount) {
              maxCount = count as number;
              dominant = em;
            }
          });
          updated.dominantEmotion = dominant;
        }
        
        // Update confidence
        if (data.confidence) {
          const prevTotal = updated.avgConfidence * (updated.totalEmotions - 1);
          updated.avgConfidence = (prevTotal + data.confidence) / updated.totalEmotions;
        }
        
        // Update sync rate
        if (data.facialEmotions?.length > 0 && data.prosodyEmotions?.length > 0) {
          const prevSynced = (updated.syncRate * (updated.totalEmotions - 1)) / 100;
          updated.syncRate = ((prevSynced + 1) / updated.totalEmotions) * 100;
        } else {
          const prevSynced = (updated.syncRate * (updated.totalEmotions - 1)) / 100;
          updated.syncRate = (prevSynced / updated.totalEmotions) * 100;
        }
      } else if (type === 'transcript') {
        updated.totalTranscripts++;
      } else if (type === 'error') {
        updated.totalErrors++;
      }
      
      return updated;
    });
  };

  const generateReport = () => {
    const duration = (Date.now() - startTimeRef.current) / 1000;
    
    console.log('===========================================');
    console.log('UNIFIED EMOTION TEST REPORT');
    console.log('===========================================');
    console.log(`Duration: ${duration.toFixed(1)}s`);
    console.log(`Total Emotions: ${stats.totalEmotions}`);
    console.log(`Total Transcripts: ${stats.totalTranscripts}`);
    console.log(`Total Errors: ${stats.totalErrors}`);
    console.log(`Avg Confidence: ${stats.avgConfidence.toFixed(1)}%`);
    console.log(`Sync Rate: ${stats.syncRate.toFixed(1)}%`);
    console.log(`Dominant Emotion: ${stats.dominantEmotion}`);
    console.log('Emotion Breakdown:', stats.emotionBreakdown);
    console.log('===========================================');
  };

  const clearResults = () => {
    setResults([]);
    setStats({
      totalEmotions: 0,
      totalTranscripts: 0,
      totalErrors: 0,
      avgConfidence: 0,
      syncRate: 0,
      dominantEmotion: '',
      emotionBreakdown: {}
    });
  };

  return (
    <div className="test-unified-emotions">
      <div className="test-header">
        <h1>Unified Emotion Service Test</h1>
        <div className="test-controls">
          {!isRunning ? (
            <button onClick={startTest} className="btn-start">
              Start Test
            </button>
          ) : (
            <button onClick={stopTest} className="btn-stop">
              Stop Test
            </button>
          )}
          <button onClick={clearResults} className="btn-clear">
            Clear Results
          </button>
        </div>
        <div className="test-status">{status}</div>
      </div>

      <div className="test-content">
        <div className="video-section">
          <h3>Video Feed</h3>
          <video 
            ref={videoRef} 
            className="test-video"
            muted
            playsInline
          />
        </div>

        <div className="stats-section">
          <h3>Live Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Emotions:</span>
              <span className="stat-value">{stats.totalEmotions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Transcripts:</span>
              <span className="stat-value">{stats.totalTranscripts}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Errors:</span>
              <span className="stat-value error">{stats.totalErrors}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Avg Confidence:</span>
              <span className="stat-value">{stats.avgConfidence.toFixed(1)}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Sync Rate:</span>
              <span className="stat-value">{stats.syncRate.toFixed(1)}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Dominant:</span>
              <span className="stat-value">{stats.dominantEmotion || 'None'}</span>
            </div>
          </div>

          {Object.keys(stats.emotionBreakdown).length > 0 && (
            <div className="emotion-breakdown">
              <h4>Emotion Breakdown:</h4>
              {Object.entries(stats.emotionBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([emotion, count]) => (
                  <div key={emotion} className="breakdown-item">
                    <span>{emotion}:</span>
                    <span>{count} ({((count / stats.totalEmotions) * 100).toFixed(1)}%)</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="results-section">
        <h3>Test Results Log</h3>
        <div className="results-log">
          {results.slice(-20).reverse().map((result, idx) => (
            <div key={idx} className={`result-item ${result.type}`}>
              <span className="result-time">{(result.timestamp / 1000).toFixed(1)}s</span>
              <span className="result-type">{result.type}</span>
              <span className="result-data">
                {result.type === 'unified_emotion' && 
                  `${result.data.dominant} (${result.data.intensity}% @ ${result.data.confidence}% confidence)`}
                {result.type === 'transcript' && 
                  `"${result.data.text?.substring(0, 50)}" [${result.data.emotion}]`}
                {result.type === 'error' && 
                  result.data.error}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestUnifiedEmotions;
