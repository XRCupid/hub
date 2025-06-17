import React, { useState } from 'react';
import { UserAvatarPiP } from './UserAvatarPiP';

/**
 * Simple test component to verify PiP tracking functionality
 */
const PiPTrackingTest: React.FC = () => {
  const [showPiP, setShowPiP] = useState(false);
  const [testMode, setTestMode] = useState<'own' | 'fallback' | 'parent'>('own');

  // Mock tracking data for testing parent-provided tracking
  const mockTrackingData = {
    facialExpressions: {
      mouthSmile: 0.3,
      eyeBlink: 0.1,
      browInnerUp: 0.2,
      mouthOpen: 0.1
    },
    headRotation: {
      pitch: 5,
      yaw: -10,
      roll: 2
    },
    posture: null,
    hands: null,
    landmarks: []
  };

  const handleStartTest = () => {
    console.log('[PiPTrackingTest] Starting test with mode:', testMode);
    setShowPiP(true);
  };

  const handleStopTest = () => {
    console.log('[PiPTrackingTest] Stopping test');
    setShowPiP(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>PiP Face Tracking Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Test Mode:</h3>
        <label style={{ display: 'block', margin: '10px 0' }}>
          <input
            type="radio"
            name="testMode"
            value="own"
            checked={testMode === 'own'}
            onChange={(e) => setTestMode(e.target.value as any)}
          />
          Own Tracking (enableOwnTracking=true, uses ML5 or fallback)
        </label>
        <label style={{ display: 'block', margin: '10px 0' }}>
          <input
            type="radio"
            name="testMode"
            value="fallback"
            checked={testMode === 'fallback'}
            onChange={(e) => setTestMode(e.target.value as any)}
          />
          Force Fallback (simulates ML5 failure)
        </label>
        <label style={{ display: 'block', margin: '10px 0' }}>
          <input
            type="radio"
            name="testMode"
            value="parent"
            checked={testMode === 'parent'}
            onChange={(e) => setTestMode(e.target.value as any)}
          />
          Parent Tracking Data (mock data provided)
        </label>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleStartTest}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            marginRight: '10px',
            cursor: 'pointer'
          }}
        >
          Start PiP Test
        </button>
        <button
          onClick={handleStopTest}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Stop PiP Test
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Instructions:</h3>
        <ul>
          <li><strong>Own Tracking:</strong> Uses camera and ML5 face tracking (or fallback if ML5 fails)</li>
          <li><strong>Force Fallback:</strong> Simulates ML5 failure to test fallback animations</li>
          <li><strong>Parent Tracking:</strong> Uses mock data to test parent-provided tracking</li>
        </ul>
        <p><strong>Expected Result:</strong> PiP should appear in bottom-right with face tracking animation</p>
        <p><strong>Check Console:</strong> Look for detailed logging about tracking initialization and data flow</p>
      </div>

      {showPiP && (
        <UserAvatarPiP
          avatarUrl="/avatars/user_avatar.glb"
          position="bottom-right"
          size="large"
          enableOwnTracking={testMode === 'own'}
          trackingData={testMode === 'parent' ? mockTrackingData : undefined}
          onClose={() => setShowPiP(false)}
        />
      )}

      <div style={{ 
        position: 'fixed', 
        bottom: '20px', 
        left: '20px', 
        background: '#f8f9fa', 
        padding: '10px', 
        borderRadius: '5px',
        fontSize: '12px',
        maxWidth: '300px'
      }}>
        <strong>Debug Info:</strong><br/>
        Test Mode: {testMode}<br/>
        PiP Visible: {showPiP ? 'Yes' : 'No'}<br/>
        Check browser console for detailed tracking logs
      </div>
    </div>
  );
};

export default PiPTrackingTest;
