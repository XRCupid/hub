import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { PostureTrackingService } from '../services/PostureTrackingService';
import { CombinedFaceTrackingService } from '../services/CombinedFaceTrackingService';
import { avatarMirrorSystem } from '../services/AvatarMirrorSystem';
import { EnhancedFullBodyAvatar } from './EnhancedFullBodyAvatar';
import { SimpleArmTestAvatar } from './SimpleArmTestAvatar';
import './ComputerVisionDemo.css';

interface PuppetLesson {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  icon: string;
}

const puppetLessons: PuppetLesson[] = [
  {
    id: 'mirror-practice',
    title: 'Mirror Practice',
    description: 'See your movements reflected in your avatar in real-time',
    objectives: [
      'Practice natural head movements',
      'Work on facial expressions',
      'Build body awareness'
    ],
    icon: '🪞'
  },
  {
    id: 'engagement-signals',
    title: 'Engagement Signals',
    description: 'Master non-verbal cues that show active listening',
    objectives: [
      'Practice nodding at appropriate times',
      'Use facial expressions to show interest',
      'Maintain open body language'
    ],
    icon: '💬'
  },
  {
    id: 'confidence-poses',
    title: 'Confidence & Presence',
    description: 'Project confidence through posture and positioning',
    objectives: [
      'Maintain upright, open posture',
      'Practice power poses',
      'Control nervous movements'
    ],
    icon: '💪'
  }
];

export default function AvatarPuppetDemo() {
  const [selectedLesson, setSelectedLesson] = useState<PuppetLesson | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState('Ready to start');
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [trackingData, setTrackingData] = useState({
    expressions: {},
    headRotation: { pitch: 0, yaw: 0, roll: 0 },
    landmarks: [] as any[]
  });
  const [postureData, setPostureData] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Services
  const postureService = useRef<PostureTrackingService | null>(null);
  const faceService = useRef<CombinedFaceTrackingService | null>(null);
  const trackingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize services
    postureService.current = new PostureTrackingService();
    faceService.current = new CombinedFaceTrackingService();
    
    // Initialize face tracking service
    const initializeFaceTracking = async () => {
      if (faceService.current) {
        await faceService.current.initialize();
      }
    };
    
    initializeFaceTracking();
    
    // Initialize avatar mirror system with video element
    if (videoRef.current) {
      avatarMirrorSystem.initialize(videoRef.current).catch(console.error);
    }

    return () => {
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
      }
      postureService.current?.stopTracking();
      faceService.current?.stopTracking();
    };
  }, []);

  const startLesson = async (lesson: PuppetLesson) => {
    setSelectedLesson(lesson);
    setIsTracking(true);
    setTrackingStatus('Starting camera...');
    
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
        
        videoRef.current.onloadedmetadata = async () => {
          if (!videoRef.current) return;
          
          setTrackingStatus('Initializing tracking...');
          
          // Start face tracking for expressions and head movement
          if (faceService.current) {
            await faceService.current.startTracking(videoRef.current);
            setTrackingStatus('Face tracking active');
          }
          
          // Start posture tracking
          if (postureService.current && videoRef.current) {
            console.log('[AvatarPuppetDemo] Initializing posture tracking...');
            await postureService.current.initialize();
            await postureService.current.startTracking(videoRef.current);
            setTrackingStatus('All systems active');
          }
          
          // Update metrics
          trackingInterval.current = setInterval(() => {
            const postureData = postureService.current?.getPostureData();
            if (postureData) {
              const confidence = postureData.confidence;
              
              // Update tracking data for avatar
              if (faceService.current) {
                const expressions = faceService.current.getExpressions() || {};
                const headRotation = faceService.current.getHeadRotation() || { pitch: 0, yaw: 0, roll: 0 };
                const landmarks = faceService.current.getLandmarks() || ([] as any[]);
                
                // Debug log occasionally
                if (Math.random() < 0.02) { // Log ~2% of the time
                  console.log('[AvatarPuppetDemo] Face tracking data:', {
                    expressionKeys: Object.keys(expressions),
                    headRotation,
                    hasLandmarks: landmarks.length > 0
                  });
                }
                
                setTrackingData({
                  expressions,
                  headRotation,
                  landmarks
                });
              }
              
              // Update posture data
              setPostureData(postureData);
              
              // Debug log posture data
              if (Math.random() < 0.02) { // Log ~2% of the time
                console.log('[AvatarPuppetDemo] Posture data:', {
                  hasData: !!postureData,
                  confidence: postureData.confidence,
                  leftWrist: postureData.keypoints.leftWrist,
                  rightWrist: postureData.keypoints.rightWrist,
                  leftElbow: postureData.keypoints.leftElbow,
                  rightElbow: postureData.keypoints.rightElbow
                });
              }
              
              // Calculate metrics based on lesson
              setMetrics(prev => ({
                ...prev,
                'Tracking Quality': confidence,
                'Posture Score': confidence > 0.5 ? 0.8 : 0.3
              }));
            }
          }, 100);
        };
      }
    } catch (error) {
      console.error('Error starting lesson:', error);
      setTrackingStatus('Error: Camera access denied');
      setIsTracking(false);
    }
  };

  const stopLesson = () => {
    setIsTracking(false);
    setTrackingStatus('Stopped');
    
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current);
    }
    
    postureService.current?.stopTracking();
    faceService.current?.stopTracking();
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setSelectedLesson(null);
  };

  return (
    <div className="cv-demo-container">
      <div className="cv-demo-header">
        <h1>Avatar Puppet Training</h1>
        <p>Practice your presence with real-time avatar mirroring</p>
      </div>

      {!selectedLesson ? (
        <div className="cv-demo-lessons">
          {puppetLessons.map(lesson => (
            <div 
              key={lesson.id} 
              className="cv-demo-lesson-card"
              onClick={() => startLesson(lesson)}
            >
              <div className="lesson-icon">{lesson.icon}</div>
              <h3>{lesson.title}</h3>
              <p>{lesson.description}</p>
              <ul className="lesson-objectives">
                {lesson.objectives.map((obj, idx) => (
                  <li key={idx}>{obj}</li>
                ))}
              </ul>
              <button className="start-lesson-btn">Start Practice</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="cv-demo-active-lesson">
          <div className="lesson-header">
            <h2>{selectedLesson.title}</h2>
            <button onClick={stopLesson} className="stop-btn">End Session</button>
          </div>

          <div className="puppet-display">
            {/* Hidden video element for camera feed */}
            <video 
              ref={videoRef}
              style={{ display: 'none' }}
              autoPlay
              playsInline
            />
            
            {/* Avatar display */}
            <div className="avatar-container" style={{ 
              width: '640px', 
              height: '480px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <Canvas
                camera={{ position: [0, 0.5, 2.5], fov: 35 }}
                style={{ width: '100%', height: '100%' }}
              >
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={0.5} />
                <EnhancedFullBodyAvatar
                  avatarUrl="/avatars/user_avatar.glb"
                  trackingData={trackingData}
                  postureData={postureData}
                  position={[0, -1.5, 0]}
                  scale={1.5}
                />
                <OrbitControls 
                  enablePan={false}
                  enableZoom={true}
                  minDistance={1.5}
                  maxDistance={5}
                  target={[0, 0.5, 0]}
                />
              </Canvas>
              
              <div className="tracking-status" style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: 'rgba(0, 0, 0, 0.7)',
                color: isTracking ? '#4ecdc4' : '#ff6b6b',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px'
              }}>
                {trackingStatus}
              </div>
            </div>
          </div>

          <div className="cv-demo-metrics">
            <h3>Performance Metrics</h3>
            <div className="metrics-grid">
              {Object.entries(metrics).map(([metric, value]) => (
                <div key={metric} className="metric-item">
                  <label>{metric}</label>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill"
                      style={{ width: `${value * 100}%` }}
                    />
                  </div>
                  <span>{(value * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lesson-tips" style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '20px',
            marginTop: '20px'
          }}>
            <h4>Tips for {selectedLesson.title}:</h4>
            <ul>
              {selectedLesson.objectives.map((obj, idx) => (
                <li key={idx}>{obj}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
