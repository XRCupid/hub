import React, { useState, useEffect, useRef } from 'react';

interface GazeData {
  timestamp: number;
  x: number;
  y: number;
  state: number; // 0: fixation, 1: saccade
  eyeMovementState: number;
}

interface AttentionData {
  isAttentive: boolean;
  attentionScore: number;
  leftEyeOpenness: number;
  rightEyeOpenness: number;
  drowsinessLevel: number;
}

export const SeeSoEyeTracker: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [gazeData, setGazeData] = useState<GazeData | null>(null);
  const [attentionData, setAttentionData] = useState<AttentionData | null>(null);
  const [error, setError] = useState<string>('');
  const [licenseKey, setLicenseKey] = useState('');
  
  const seesoRef = useRef<any>(null);
  const calibrationPoints = useRef<number>(0);

  // Initialize SeeSo
  const initializeSeeSo = async () => {
    try {
      if (!window.seeSo) {
        setError('SeeSo SDK not loaded. Please check your internet connection.');
        return;
      }

      console.log('[SeeSo] Initializing with license key...');
      
      // Initialize with your license key
      // For testing, you can use the trial license from SeeSo website
      const seeso = new window.seeSo.EasySeeSo();
      
      // Set your license key (get from https://console.seeso.io)
      await seeso.init(licenseKey || 'YOUR_LICENSE_KEY_HERE', async () => {
        console.log('[SeeSo] Initialized successfully');
        setIsInitialized(true);
        
        // Set callbacks
        seeso.setGazeCallback((data: GazeData) => {
          setGazeData(data);
        });
        
        seeso.setAttentionCallback((data: AttentionData) => {
          setAttentionData(data);
        });
        
        seeso.setCalibrationCallback((data: {progress: number}) => {
          setCalibrationProgress(data.progress);
          calibrationPoints.current++;
        });
        
        seesoRef.current = seeso;
      });
      
    } catch (err) {
      console.error('[SeeSo] Initialization error:', err);
      setError(`Failed to initialize SeeSo: ${err.message}`);
    }
  };

  // Start calibration
  const startCalibration = async () => {
    if (!seesoRef.current) return;
    
    try {
      setIsCalibrating(true);
      setCalibrationProgress(0);
      calibrationPoints.current = 0;
      
      await seesoRef.current.startCalibration(5); // 5-point calibration
      console.log('[SeeSo] Calibration started');
    } catch (err) {
      console.error('[SeeSo] Calibration error:', err);
      setError(`Calibration failed: ${err.message}`);
      setIsCalibrating(false);
    }
  };

  // Start tracking
  const startTracking = async () => {
    if (!seesoRef.current) return;
    
    try {
      await seesoRef.current.startTracking();
      console.log('[SeeSo] Tracking started');
    } catch (err) {
      console.error('[SeeSo] Tracking error:', err);
      setError(`Failed to start tracking: ${err.message}`);
    }
  };

  // Stop tracking
  const stopTracking = async () => {
    if (!seesoRef.current) return;
    
    try {
      await seesoRef.current.stopTracking();
      console.log('[SeeSo] Tracking stopped');
    } catch (err) {
      console.error('[SeeSo] Stop tracking error:', err);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (seesoRef.current) {
        stopTracking();
        seesoRef.current.deinit();
      }
    };
  }, []);

  // Check calibration completion
  useEffect(() => {
    if (calibrationProgress >= 100 && isCalibrating) {
      setIsCalibrating(false);
      console.log('[SeeSo] Calibration completed');
      startTracking();
    }
  }, [calibrationProgress, isCalibrating]);

  return (
    <div style={{ padding: '20px', background: '#1a1a1a', color: 'white', borderRadius: '8px' }}>
      <h2>SeeSo Eye Tracking Test</h2>
      
      {!isInitialized && (
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Enter SeeSo License Key (or use trial)"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            style={{ 
              width: '300px', 
              padding: '8px', 
              marginRight: '10px',
              background: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px'
            }}
          />
          <button 
            onClick={initializeSeeSo}
            style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Initialize SeeSo
          </button>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
            Get a free trial key at: <a href="https://console.seeso.io" target="_blank" rel="noopener noreferrer" style={{ color: '#4CAF50' }}>https://console.seeso.io</a>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: '#f44336', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h3>Status</h3>
          <div>Initialized: {isInitialized ? '✅' : '❌'}</div>
          <div>Calibrating: {isCalibrating ? '🔄' : '❌'}</div>
          <div>Calibration Progress: {calibrationProgress}%</div>
          
          {isInitialized && !isCalibrating && (
            <button 
              onClick={startCalibration}
              style={{ marginTop: '10px', padding: '8px 16px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Start Calibration
            </button>
          )}
        </div>

        <div>
          <h3>Gaze Data</h3>
          {gazeData ? (
            <>
              <div>X: {gazeData.x.toFixed(2)}</div>
              <div>Y: {gazeData.y.toFixed(2)}</div>
              <div>State: {gazeData.state === 0 ? 'Fixation' : 'Saccade'}</div>
            </>
          ) : (
            <div>No gaze data yet</div>
          )}
        </div>

        <div>
          <h3>Attention Metrics</h3>
          {attentionData ? (
            <>
              <div>Attentive: {attentionData.isAttentive ? '✅' : '❌'}</div>
              <div>Attention Score: {(attentionData.attentionScore * 100).toFixed(0)}%</div>
              <div>Left Eye: {(attentionData.leftEyeOpenness * 100).toFixed(0)}%</div>
              <div>Right Eye: {(attentionData.rightEyeOpenness * 100).toFixed(0)}%</div>
              <div>Drowsiness: {(attentionData.drowsinessLevel * 100).toFixed(0)}%</div>
            </>
          ) : (
            <div>No attention data yet</div>
          )}
        </div>

        <div>
          <h3>Dating Chemistry Insights</h3>
          {gazeData && attentionData && (
            <>
              <div>Engagement Level: {attentionData.isAttentive ? 'High' : 'Low'}</div>
              <div>Eye Contact Quality: {gazeData.state === 0 ? 'Stable' : 'Nervous'}</div>
              <div>Interest Score: {(attentionData.attentionScore * 100).toFixed(0)}%</div>
              <div>Alertness: {(100 - attentionData.drowsinessLevel * 100).toFixed(0)}%</div>
            </>
          )}
        </div>
      </div>

      {isInitialized && (
        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={stopTracking}
            style={{ padding: '8px 16px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Stop Tracking
          </button>
        </div>
      )}
    </div>
  );
};
