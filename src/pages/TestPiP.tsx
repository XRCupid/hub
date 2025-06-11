import React from 'react';
import { UserAvatarPiP } from '../components/UserAvatarPiP';

export const TestPiP: React.FC = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#f0f0f0' }}>
      <h1>Testing PiP Avatar</h1>
      
      {/* Test without any tracking data */}
      <UserAvatarPiP 
        avatarUrl="/avatars/user_avatar.glb"
        position="bottom-right"
        size="medium"
      />
      
      <div style={{ padding: '20px' }}>
        <p>If you see a red border box in the bottom right, the PiP component is rendering.</p>
        <p>If you see the avatar inside, the GLB is loading correctly.</p>
      </div>
    </div>
  );
};
