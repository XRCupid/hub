import React, { useState, useEffect, useRef } from 'react';
import { PostureTrackingService } from '../services/PostureTrackingService';
import { ML5FaceMeshService } from '../services/ML5FaceMeshService';
import { CombinedFaceTrackingService } from '../services/CombinedFaceTrackingService';
import { PostureData } from '../types/tracking';
import './ComputerVisionDemo.css';

interface DemoLesson {
  id: string;
  title: string;
  description: string;
  duration: number;
  cvFeatures: string[];
  objectives: string[];
  metrics: string[];
}

const DEMO_LESSONS: DemoLesson[] = [
  {
    id: 'posture-basics',
    title: 'Perfect Your Posture',
    description: 'Learn to maintain confident body language with real-time posture tracking',
    duration: 5,
    cvFeatures: ['Posture Detection', 'Shoulder Alignment', 'Head Position'],
    objectives: [
      'Maintain straight spine for 30 seconds',
      'Keep shoulders level and relaxed',
      'Avoid forward head position'
    ],
    metrics: ['Spine Angle', 'Shoulder Tilt', 'Head Forward Distance']
  },
  {
    id: 'nodding-detection',
    title: 'Active Listening',
    description: 'Show engagement through natural head movements and nodding',
    duration: 7,
    cvFeatures: ['Head Movement Tracking'],
    objectives: [
      'Practice nodding and head tilts to signal active listening',
      'Maintain eye contact during conversation',
      'Use open and approachable body language'
    ],
    metrics: ['Nod Count', 'Head Movement', 'Engagement Score']
  },
  {
    id: 'eye-contact-mastery',
    title: 'Eye Contact Confidence',
    description: 'Build comfortable eye contact skills with adaptive gaze tracking',
    duration: 7,
    cvFeatures: ['Eye Gaze Tracking', 'Blink Detection', 'Focus Duration'],
    objectives: [
      'Maintain eye contact for 3-5 seconds',
      'Practice natural breaking patterns',
      'Build comfort with direct gaze'
    ],
    metrics: ['Gaze Duration', 'Break Frequency', 'Comfort Score']
  },
  {
    id: 'facial-expressions',
    title: 'Express Yourself',
    description: 'Master facial expressions that convey warmth and confidence',
    duration: 10,
    cvFeatures: ['Facial Expression Analysis', 'Smile Detection', 'Emotion Recognition'],
    objectives: [
      'Practice genuine smiles (Duchenne smile)',
      'Show appropriate emotional responses',
      'Avoid nervous expressions'
    ],
    metrics: ['Smile Authenticity', 'Expression Variety', 'Emotional Congruence']
  },
  {
    id: 'gesture-communication',
    title: 'Gesture with Purpose',
    description: 'Use hand gestures to enhance your communication',
    duration: 8,
    cvFeatures: ['Hand Tracking', 'Gesture Recognition', 'Movement Analysis'],
    objectives: [
      'Use open palm gestures',
      'Avoid fidgeting or nervous gestures',
      'Match gestures to speech rhythm'
    ],
    metrics: ['Gesture Frequency', 'Openness Score', 'Gesture-Speech Sync']
  },
  {
    id: 'full-presence',
    title: 'Complete Presence Practice',
    description: 'Combine all skills for authentic, confident presence',
    duration: 15,
    cvFeatures: ['All Features Combined', 'Holistic Analysis', 'Real-time Feedback'],
    objectives: [
      'Maintain good posture throughout',
      'Use appropriate eye contact',
      'Express emotions naturally',
      'Gesture confidently'
    ],
    metrics: ['Overall Presence Score', 'Consistency Rating', 'Authenticity Index']
  }
];

const ComputerVisionDemo: React.FC = () => {
  const [selectedLesson, setSelectedLesson] = useState<DemoLesson | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<Record<string, number>>({});
  const [feedbackMessages, setFeedbackMessages] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Head movement tracking state
  const headPositionHistory = useRef<Array<{y: number, timestamp: number}>>([]);
  const nodCount = useRef<number>(0);
  const lastNodTime = useRef<number>(0);
  
  // Services
  const postureService = useRef<PostureTrackingService | null>(null);
  const faceService = useRef<ML5FaceMeshService | null>(null);
  const combinedService = useRef<CombinedFaceTrackingService | null>(null);

  useEffect(() => {
    // Initialize services
    postureService.current = new PostureTrackingService();
    faceService.current = new ML5FaceMeshService();
    combinedService.current = CombinedFaceTrackingService.getInstance();

    return () => {
      // Cleanup
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
      if (postureService.current) postureService.current.stopTracking();
      if (faceService.current) faceService.current.stopTracking();
      if (combinedService.current) combinedService.current.stopTracking();
    };
  }, []);

  const addFeedback = (message: string) => {
    setFeedbackMessages(prev => [...prev, message].slice(-5)); // Keep last 5 messages
  };

  const calculatePostureMetrics = (data: PostureData) => {
    const metrics: Record<string, number> = {
      'Tracking Confidence': data.confidence
    };

    // Calculate shoulder tilt if both shoulders are detected
    if (data.keypoints.leftShoulder && data.keypoints.rightShoulder) {
      const shoulderDiff = Math.abs(data.keypoints.leftShoulder.y - data.keypoints.rightShoulder.y);
      const shoulderDistance = Math.abs(data.keypoints.leftShoulder.x - data.keypoints.rightShoulder.x);
      const shoulderTiltAngle = Math.atan2(shoulderDiff, shoulderDistance) * (180 / Math.PI);
      metrics['Shoulder Tilt'] = Math.min(shoulderTiltAngle / 30, 1); // Normalize to 0-1
    }

    // Calculate head forward position
    if (data.keypoints.nose && data.keypoints.leftShoulder && data.keypoints.rightShoulder) {
      const shoulderMidX = (data.keypoints.leftShoulder.x + data.keypoints.rightShoulder.x) / 2;
      const headForwardDistance = Math.abs(data.keypoints.nose.x - shoulderMidX);
      const shoulderWidth = Math.abs(data.keypoints.leftShoulder.x - data.keypoints.rightShoulder.x);
      metrics['Head Forward'] = Math.min(headForwardDistance / (shoulderWidth * 0.5), 1); // Normalize
    }

    // Calculate spine angle (using shoulders and hips if available)
    if (data.keypoints.leftShoulder && data.keypoints.rightShoulder && 
        data.keypoints.leftHip && data.keypoints.rightHip) {
      const shoulderMidY = (data.keypoints.leftShoulder.y + data.keypoints.rightShoulder.y) / 2;
      const hipMidY = (data.keypoints.leftHip.y + data.keypoints.rightHip.y) / 2;
      const shoulderMidX = (data.keypoints.leftShoulder.x + data.keypoints.rightShoulder.x) / 2;
      const hipMidX = (data.keypoints.leftHip.x + data.keypoints.rightHip.x) / 2;
      
      const spineAngle = Math.atan2(shoulderMidY - hipMidY, shoulderMidX - hipMidX) * (180 / Math.PI);
      const deviationFromVertical = Math.abs(90 - Math.abs(spineAngle));
      metrics['Spine Angle'] = 1 - Math.min(deviationFromVertical / 45, 1); // Higher score = more vertical
    }

    return metrics;
  };

  const detectNodding = (currentY: number, timestamp: number) => {
    // Keep a sliding window of head positions
    headPositionHistory.current.push({ y: currentY, timestamp });
    
    // Keep only last 1 second of data
    const oneSecondAgo = timestamp - 1000;
    headPositionHistory.current = headPositionHistory.current.filter(
      pos => pos.timestamp > oneSecondAgo
    );
    
    if (headPositionHistory.current.length < 10) return false;
    
    // Detect nodding pattern (down-up movement)
    const positions = headPositionHistory.current.map(p => p.y);
    const maxY = Math.max(...positions);
    const minY = Math.min(...positions);
    const range = maxY - minY;
    
    // Check if there's significant vertical movement
    if (range > 20) { // Threshold for nod detection
      const midIndex = Math.floor(positions.length / 2);
      const firstHalf = positions.slice(0, midIndex);
      const secondHalf = positions.slice(midIndex);
      
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      // Check for down-up or up-down pattern
      if (Math.abs(firstAvg - secondAvg) > 10) {
        const timeSinceLastNod = timestamp - lastNodTime.current;
        if (timeSinceLastNod > 500) { // Prevent double-counting
          lastNodTime.current = timestamp;
          nodCount.current++;
          return true;
        }
      }
    }
    
    return false;
  };

  const startLesson = async (lesson: DemoLesson) => {
    setSelectedLesson(lesson);
    setIsTracking(true);
    setFeedbackMessages([]);
    
    // Start video stream
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = async () => {
          if (!videoRef.current) return;
          
          // Start appropriate tracking based on lesson
          if (lesson.cvFeatures.includes('Posture Detection') && postureService.current) {
            await postureService.current.startTracking(videoRef.current);
            
            // Poll for posture data
            trackingIntervalRef.current = setInterval(() => {
              const data = postureService.current?.getPostureData();
              if (data) {
                const metrics = calculatePostureMetrics(data);
                setCurrentMetrics(metrics);
                
                // Generate feedback based on real metrics
                if (metrics['Tracking Confidence'] < 0.5) {
                  addFeedback('Move closer to the camera for better tracking');
                }
                if (metrics['Shoulder Tilt'] && metrics['Shoulder Tilt'] > 0.2) {
                  addFeedback('Try to level your shoulders');
                }
                if (metrics['Head Forward'] && metrics['Head Forward'] > 0.3) {
                  addFeedback('Bring your head back over your shoulders');
                }
                if (metrics['Spine Angle'] && metrics['Spine Angle'] < 0.7) {
                  addFeedback('Straighten your spine for better posture');
                }
              }
            }, 100);
          }

          if (lesson.cvFeatures.includes('Head Movement Tracking') && postureService.current) {
            await postureService.current.startTracking(videoRef.current);
            nodCount.current = 0;
            headPositionHistory.current = [];
            
            trackingIntervalRef.current = setInterval(() => {
              const data = postureService.current?.getPostureData();
              if (data && data.keypoints.nose) {
                const timestamp = Date.now();
                const noseY = data.keypoints.nose.y;
                
                // Detect nodding
                const nodDetected = detectNodding(noseY, timestamp);
                if (nodDetected) {
                  addFeedback('Great nod! Keep showing engagement');
                }
                
                // Calculate metrics
                const recentMovement = headPositionHistory.current.length > 2 ? 
                  Math.abs(headPositionHistory.current[headPositionHistory.current.length - 1].y - 
                          headPositionHistory.current[0].y) / 100 : 0;
                
                setCurrentMetrics({
                  'Nod Count': nodCount.current / 10, // Normalize for display
                  'Head Movement': Math.min(recentMovement, 1),
                  'Engagement Score': Math.min((nodCount.current * 0.1 + recentMovement * 0.5), 1)
                });
              }
            }, 50);
          }

          if ((lesson.cvFeatures.includes('Eye Gaze Tracking') || 
               lesson.cvFeatures.includes('Facial Expression Analysis')) && 
               faceService.current) {
            await faceService.current.startTracking(videoRef.current);
            
            // For face tracking, we'll use mock data since the service doesn't expose data directly
            trackingIntervalRef.current = setInterval(() => {
              // Mock facial expression data for demo
              setCurrentMetrics(prev => ({
                ...prev,
                'Smile Score': Math.random() * 0.3 + 0.5,
                'Eye Contact': Math.random() * 0.2 + 0.7
              }));
            }, 500);
          }

          if (lesson.cvFeatures.includes('All Features Combined') && combinedService.current) {
            combinedService.current.startTracking(videoRef.current);
            
            // Mock combined data
            trackingIntervalRef.current = setInterval(() => {
              setCurrentMetrics(prev => ({
                ...prev,
                'Overall Presence Score': Math.random() * 0.2 + 0.7,
                'Consistency Rating': Math.random() * 0.1 + 0.8,
                'Authenticity Index': Math.random() * 0.15 + 0.75
              }));
            }, 500);
          }
        };
      }

    } catch (error) {
      console.error('Error starting lesson:', error);
      setIsTracking(false);
    }
  };

  const stopLesson = () => {
    setIsTracking(false);
    
    // Clear tracking interval
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
    
    // Stop all services
    postureService.current?.stopTracking();
    faceService.current?.stopTracking();
    combinedService.current?.stopTracking();
    
    // Stop video stream
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  return (
    <div className="cv-demo-container">
      <div className="cv-demo-header">
        <h1>Computer Vision Training Demos</h1>
        <p>Experience our advanced tracking technology with these interactive lessons</p>
      </div>

      {!selectedLesson ? (
        <div className="lesson-grid">
          {DEMO_LESSONS.map(lesson => (
            <div key={lesson.id} className="lesson-card">
              <h3>{lesson.title}</h3>
              <p className="lesson-description">{lesson.description}</p>
              
              <div className="lesson-duration">
                <span className="icon">⏱️</span>
                <span>{lesson.duration} minutes</span>
              </div>

              <div className="cv-features">
                <h4>Computer Vision Features:</h4>
                <ul>
                  {lesson.cvFeatures.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>

              <div className="lesson-objectives">
                <h4>You'll Learn To:</h4>
                <ul>
                  {lesson.objectives.map((objective, idx) => (
                    <li key={idx}>{objective}</li>
                  ))}
                </ul>
              </div>

              <button 
                className="start-lesson-btn"
                onClick={() => startLesson(lesson)}
              >
                Start Lesson
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="active-lesson">
          <div className="lesson-header">
            <button className="back-btn" onClick={() => setSelectedLesson(null)}>
              ← Back to Lessons
            </button>
            <h2>{selectedLesson.title}</h2>
            <button 
              className={`tracking-toggle ${isTracking ? 'stop' : 'start'}`}
              onClick={isTracking ? stopLesson : () => startLesson(selectedLesson)}
            >
              {isTracking ? 'Stop Tracking' : 'Start Tracking'}
            </button>
          </div>

          <div className="lesson-content">
            <div className="video-section">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="tracking-video"
              />
              <canvas 
                ref={canvasRef} 
                className="tracking-overlay"
                width={640}
                height={480}
              />
            </div>

            <div className="metrics-panel">
              <h3>Real-time Metrics</h3>
              <div className="metrics-grid">
                {selectedLesson.metrics.map(metric => (
                  <div key={metric} className="metric-card">
                    <span className="metric-label">{metric}</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill"
                        style={{ 
                          width: `${Math.min(100, (currentMetrics[metric] || 0) * 100)}%`,
                          backgroundColor: getMetricColor(currentMetrics[metric] || 0)
                        }}
                      />
                    </div>
                    <span className="metric-value">
                      {Math.round((currentMetrics[metric] || 0) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="feedback-section">
              <h3>Live Feedback</h3>
              <div className="feedback-messages">
                {feedbackMessages.length === 0 ? (
                  <p className="no-feedback">Start tracking to receive real-time feedback</p>
                ) : (
                  feedbackMessages.map((msg, idx) => (
                    <div key={idx} className="feedback-message">
                      {msg}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="objectives-checklist">
              <h3>Lesson Objectives</h3>
              {selectedLesson.objectives.map((objective, idx) => (
                <div key={idx} className="objective-item">
                  <input type="checkbox" id={`obj-${idx}`} />
                  <label htmlFor={`obj-${idx}`}>{objective}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getMetricColor = (value: number): string => {
  if (value < 0.3) return '#ff4444';
  if (value < 0.7) return '#ffaa00';
  return '#44ff44';
};

export default ComputerVisionDemo;
