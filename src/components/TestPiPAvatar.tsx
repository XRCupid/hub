import React, { useState, useEffect } from 'react';
import { UserAvatarPiP } from './UserAvatarPiP';

const TestPiPAvatar: React.FC = () => {
  const [showBasic, setShowBasic] = useState(false);
  const [showWithStream, setShowWithStream] = useState(false);
  const [showWithTracking, setShowWithTracking] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [mockTrackingData, setMockTrackingData] = useState<any>(null);

  // Get camera stream
  const getCameraStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' } 
      });
      setCameraStream(stream);
      console.log('✅ Camera stream obtained');
    } catch (error) {
      console.error('❌ Failed to get camera:', error);
    }
  };

  // Generate mock tracking data
  useEffect(() => {
    const interval = setInterval(() => {
      setMockTrackingData({
        facialExpressions: {
          mouthSmile: Math.random() * 0.5,
          mouthOpen: Math.random() * 0.3,
          browInnerUp: Math.random() * 0.2,
          eyeWideLeft: Math.random() * 0.1,
          eyeWideRight: Math.random() * 0.1,
        },
        headRotation: {
          pitch: (Math.random() - 0.5) * 0.2,
          yaw: (Math.random() - 0.5) * 0.3,
          roll: (Math.random() - 0.5) * 0.1,
        }
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>PiP Avatar Test Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Controls</h2>
        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', maxWidth: '400px' }}>
          <button 
            onClick={getCameraStream}
            style={{ padding: '10px', backgroundColor: cameraStream ? '#4CAF50' : '#f44336', color: 'white' }}
          >
            {cameraStream ? '✅ Camera Active' : '📷 Get Camera Access'}
          </button>

          <button 
            onClick={() => setShowBasic(!showBasic)}
            style={{ padding: '10px', backgroundColor: '#2196F3', color: 'white' }}
          >
            {showBasic ? 'Hide' : 'Show'} Basic PiP (No props)
          </button>

          <button 
            onClick={() => setShowWithStream(!showWithStream)}
            style={{ padding: '10px', backgroundColor: '#FF9800', color: 'white' }}
            disabled={!cameraStream}
          >
            {showWithStream ? 'Hide' : 'Show'} PiP with Camera Stream
          </button>

          <button 
            onClick={() => setShowWithTracking(!showWithTracking)}
            style={{ padding: '10px', backgroundColor: '#9C27B0', color: 'white' }}
          >
            {showWithTracking ? 'Hide' : 'Show'} PiP with Mock Tracking Data
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Status</h2>
        <div style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
          <p>Camera Stream: {cameraStream ? '✅ Available' : '❌ Not available'}</p>
          <p>Mock Tracking: {mockTrackingData ? '✅ Generating' : '❌ Not generating'}</p>
        </div>
      </div>

      {/* Test 1: Basic PiP */}
      {showBasic && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Test 1: Basic PiP (Should initialize own camera)</h3>
          <UserAvatarPiP 
            avatarUrl="/avatars/user_avatar.glb"
            position="top-left"
            size="medium"
          />
        </div>
      )}

      {/* Test 2: PiP with Camera Stream */}
      {showWithStream && cameraStream && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Test 2: PiP with Shared Camera Stream</h3>
          <UserAvatarPiP 
            avatarUrl="/avatars/DougieG.glb"
            position="top-right"
            size="medium"
            enableOwnTracking={true}
            cameraStream={cameraStream}
          />
        </div>
      )}

      {/* Test 3: PiP with Tracking Data */}
      {showWithTracking && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Test 3: PiP with Mock Tracking Data (No camera needed)</h3>
          <UserAvatarPiP 
            avatarUrl="/avatars/user_avatar.glb"
            position="bottom-right"
            size="large"
            trackingData={mockTrackingData}
            enableOwnTracking={false}
          />
        </div>
      )}

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#e8f4f8', borderRadius: '5px' }}>
        <h3>Expected Behavior:</h3>
        <ul>
          <li><strong>Test 1:</strong> Should request camera access and show video + avatar</li>
          <li><strong>Test 2:</strong> Should use existing camera stream (no new permission request)</li>
          <li><strong>Test 3:</strong> Should NOT request camera, just show avatar with mock expressions</li>
        </ul>
      </div>
    </div>
  );
};

export default TestPiPAvatar;
