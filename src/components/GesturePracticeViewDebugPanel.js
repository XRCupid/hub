import React from 'react';

export default function GesturePracticeViewDebugPanel({ hands, gestureResultsByHand, detectedGesture, videoDims }) {
  return (
    <div style={{
      marginTop: 20,
      padding: 12,
      background: '#222',
      color: '#fff',
      borderRadius: 8,
      fontSize: 13,
      maxWidth: 640,
      width: '100%',
      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      fontFamily: 'monospace',
      opacity: 0.95
    }}>
      <strong style={{ color: '#f7d716' }}>Debug Panel</strong>
      <div>Video: {videoDims.width} x {videoDims.height}</div>
      <div>Detected Hands: {hands.length}</div>
      {hands.map((hand, i) => (
        <div key={i} style={{ margin: '8px 0', borderBottom: '1px solid #444' }}>
          <div>Hand {i + 1} ({hand.handedness && hand.handedness[0]}):</div>
          <div style={{ fontSize: 12, color: '#aaa' }}>
            Keypoints: {hand.keypoints && hand.keypoints.map((kp, idx) => `(${idx}: ${Math.round(kp.x)},${Math.round(kp.y)})`).join(' ')}
          </div>
          <div style={{ fontSize: 12 }}>
            Results: {gestureResultsByHand && gestureResultsByHand[`Hand${i}`] && Object.entries(gestureResultsByHand[`Hand${i}`]).map(([g, v]) => `${g}: ${v ? '✅' : '❌'}`).join(', ')}
          </div>
        </div>
      ))}
      <div><strong>Detected Gesture:</strong> {detectedGesture || 'None'}</div>
    </div>
  );
}
