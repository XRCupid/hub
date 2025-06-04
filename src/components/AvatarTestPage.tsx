import React from 'react';
import { StableAvatarPiP } from './StableAvatarPiP';
import './AvatarTestPage.css';

export const AvatarTestPage: React.FC = () => {
  return (
    <div className="avatar-test-page">
      <div className="test-header">
        <h1>Avatar Expression Test</h1>
        <p>This page tests the StableAvatarPiP component - Canvas never re-renders!</p>
      </div>
      
      <div className="test-content">
        <div className="instructions">
          <h2>Instructions:</h2>
          <ul>
            <li>Grant camera permissions when prompted</li>
            <li>Make various facial expressions (smile, frown, raise eyebrows)</li>
            <li>Turn your head left/right to test mirrored rotation</li>
            <li>Move your body to test posture tracking</li>
          </ul>
          
          <h3>Expression Amplification:</h3>
          <ul>
            <li>Smiles: 3x amplification</li>
            <li>Frowns: 3x amplification</li>
            <li>Eyebrows: 4x amplification</li>
            <li>Eyes: 2.5x amplification</li>
          </ul>
        </div>
        
        <StableAvatarPiP 
          avatarUrl="/avatars/coach_grace.glb"
          position="top-right"
          size="large"
        />
      </div>
    </div>
  );
};
