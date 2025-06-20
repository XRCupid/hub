import React, { useState, useEffect, useRef, useCallback } from 'react';

interface GazePoint {
  x: number;
  y: number;
  timestamp: number;
  confidence: number;
}

interface CalibrationPoint {
  screenX: number;
  screenY: number;
  eyeData: Array<{ leftPupil: [number, number], rightPupil: [number, number] }>;
}

interface ML5EyeTrackerProps {
  onGazeUpdate?: (point: GazePoint) => void;
  showDebug?: boolean;
  ml5Service?: any; // Your existing ML5FaceMeshService instance
}

export const ML5EyeTracker: React.FC<ML5EyeTrackerProps> = ({ 
  onGazeUpdate, 
  showDebug = false,
  ml5Service 
}) => {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationIndex, setCalibrationIndex] = useState(0);
  const [calibrationData, setCalibrationData] = useState<CalibrationPoint[]>([]);
  const [currentGaze, setCurrentGaze] = useState<GazePoint | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  
  const calibrationPoints = useRef<[number, number][]>([]);
  const regressionModelX = useRef<any>(null);
  const regressionModelY = useRef<any>(null);

  // Initialize calibration points (9-point grid)
  useEffect(() => {
    const points: [number, number][] = [];
    for (let y = 0.2; y <= 0.8; y += 0.3) {
      for (let x = 0.2; x <= 0.8; x += 0.3) {
        points.push([x, y]);
      }
    }
    calibrationPoints.current = points;
  }, []);

  // Get eye landmarks from ML5
  const getEyeData = useCallback(() => {
    if (!ml5Service) return null;
    
    const landmarks = ml5Service.getLandmarks();
    if (!landmarks || landmarks.length === 0) return null;

    // ML5 FaceMesh eye landmark indices
    // Left eye: 133 (left corner), 159 (top), 145 (right corner), 163 (bottom)
    // Right eye: 362 (left corner), 386 (top), 374 (right corner), 390 (bottom)
    // Pupils approximation: center of eye regions
    
    const leftEyeCenter = [
      (landmarks[133]?.[0] + landmarks[145]?.[0]) / 2,
      (landmarks[159]?.[1] + landmarks[163]?.[1]) / 2
    ];
    
    const rightEyeCenter = [
      (landmarks[362]?.[0] + landmarks[374]?.[0]) / 2,
      (landmarks[386]?.[1] + landmarks[390]?.[1]) / 2
    ];

    return {
      leftPupil: leftEyeCenter as [number, number],
      rightPupil: rightEyeCenter as [number, number],
      // Add iris size estimation based on eye openness
      leftIrisSize: Math.abs(landmarks[159]?.[1] - landmarks[163]?.[1]) || 10,
      rightIrisSize: Math.abs(landmarks[386]?.[1] - landmarks[390]?.[1]) || 10
    };
  }, [ml5Service]);

  // Start calibration
  const startCalibration = useCallback(() => {
    setIsCalibrating(true);
    setCalibrationIndex(0);
    setCalibrationData([]);
  }, []);

  // Collect calibration data
  const collectCalibrationPoint = useCallback(() => {
    if (!isCalibrating || calibrationIndex >= calibrationPoints.current.length) return;

    const currentPoint = calibrationPoints.current[calibrationIndex];
    const screenX = currentPoint[0] * window.innerWidth;
    const screenY = currentPoint[1] * window.innerHeight;

    // Collect multiple samples for this calibration point
    const samples: Array<{ leftPupil: [number, number], rightPupil: [number, number] }> = [];
    let sampleCount = 0;

    const collectSample = setInterval(() => {
      const eyeData = getEyeData();
      if (eyeData) {
        samples.push({
          leftPupil: eyeData.leftPupil,
          rightPupil: eyeData.rightPupil
        });
        sampleCount++;
      }

      if (sampleCount >= 10) { // Collect 10 samples per point
        clearInterval(collectSample);
        
        setCalibrationData(prev => [...prev, { screenX, screenY, eyeData: samples }]);
        
        if (calibrationIndex < calibrationPoints.current.length - 1) {
          setCalibrationIndex(prev => prev + 1);
        } else {
          // Calibration complete, train regression model
          finishCalibration();
        }
      }
    }, 100);
  }, [isCalibrating, calibrationIndex, getEyeData]);

  // Train regression model
  const finishCalibration = useCallback(() => {
    if (calibrationData.length < 9) return;

    // Simple linear regression for demo
    // In production, use a proper ML library like regression-js
    const xData: number[][] = [];
    const yData: number[][] = [];
    const screenXs: number[] = [];
    const screenYs: number[] = [];

    calibrationData.forEach(point => {
      point.eyeData.forEach(sample => {
        const features = [
          sample.leftPupil[0],
          sample.leftPupil[1],
          sample.rightPupil[0],
          sample.rightPupil[1],
          // Add pupil difference as feature
          sample.rightPupil[0] - sample.leftPupil[0],
          sample.rightPupil[1] - sample.leftPupil[1]
        ];
        xData.push(features);
        yData.push(features);
        screenXs.push(point.screenX);
        screenYs.push(point.screenY);
      });
    });

    // Store calibration data (would train regression model here)
    regressionModelX.current = { xData, screenXs };
    regressionModelY.current = { yData, screenYs };

    setIsCalibrating(false);
    setIsTracking(true);
  }, [calibrationData]);

  // Predict gaze point
  const predictGaze = useCallback((eyeData: any): GazePoint | null => {
    if (!regressionModelX.current || !regressionModelY.current) return null;

    const features = [
      eyeData.leftPupil[0],
      eyeData.leftPupil[1],
      eyeData.rightPupil[0],
      eyeData.rightPupil[1],
      eyeData.rightPupil[0] - eyeData.leftPupil[0],
      eyeData.rightPupil[1] - eyeData.leftPupil[1]
    ];

    // Simple nearest neighbor prediction for demo
    // In production, use proper regression
    let minDist = Infinity;
    let predictedX = 0;
    let predictedY = 0;

    regressionModelX.current.xData.forEach((sample: number[], idx: number) => {
      const dist = features.reduce((sum, val, i) => sum + Math.pow(val - sample[i], 2), 0);
      if (dist < minDist) {
        minDist = dist;
        predictedX = regressionModelX.current.screenXs[idx];
        predictedY = regressionModelY.current.screenYs[idx];
      }
    });

    // Add smoothing
    const smooth = 0.7;
    if (currentGaze) {
      predictedX = currentGaze.x * smooth + predictedX * (1 - smooth);
      predictedY = currentGaze.y * smooth + predictedY * (1 - smooth);
    }

    return {
      x: predictedX,
      y: predictedY,
      timestamp: Date.now(),
      confidence: 1 - Math.min(minDist / 1000, 1) // Simple confidence metric
    };
  }, [currentGaze, regressionModelX, regressionModelY]);

  // Main tracking loop
  useEffect(() => {
    if (!isTracking || !ml5Service) return;

    const trackingInterval = setInterval(() => {
      const eyeData = getEyeData();
      if (eyeData) {
        const gaze = predictGaze(eyeData);
        if (gaze) {
          setCurrentGaze(gaze);
          onGazeUpdate?.(gaze);
        }
      }
    }, 50); // 20Hz tracking

    return () => clearInterval(trackingInterval);
  }, [isTracking, ml5Service, getEyeData, predictGaze, onGazeUpdate]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Calibration UI */}
      {isCalibrating && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.8)',
          zIndex: 9999
        }}>
          <div style={{
            position: 'absolute',
            left: `${calibrationPoints.current[calibrationIndex][0] * 100}%`,
            top: `${calibrationPoints.current[calibrationIndex][1] * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'red',
              animation: 'pulse 1s infinite'
            }} />
            <div style={{
              position: 'absolute',
              top: '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'white',
              whiteSpace: 'nowrap'
            }}>
              Look here ({calibrationIndex + 1}/9)
            </div>
          </div>
          <button
            onClick={collectCalibrationPoint}
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '10px 20px',
              fontSize: '16px'
            }}
          >
            Click when ready
          </button>
        </div>
      )}

      {/* Gaze dot */}
      {isTracking && currentGaze && !isCalibrating && (
        <div style={{
          position: 'fixed',
          left: `${currentGaze.x}px`,
          top: `${currentGaze.y}px`,
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: `rgba(0, 100, 255, ${currentGaze.confidence})`,
          border: '2px solid white',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 9998,
          transition: 'all 0.1s ease-out'
        }} />
      )}

      {/* Controls */}
      <div style={{ padding: '10px', background: '#222', borderRadius: '8px' }}>
        <h3>ML5 Eye Tracker</h3>
        <button onClick={startCalibration} disabled={isCalibrating}>
          {isCalibrating ? 'Calibrating...' : 'Start Calibration'}
        </button>
        {showDebug && currentGaze && (
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#ccc' }}>
            <div>X: {currentGaze.x.toFixed(0)}px</div>
            <div>Y: {currentGaze.y.toFixed(0)}px</div>
            <div>Confidence: {(currentGaze.confidence * 100).toFixed(0)}%</div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
