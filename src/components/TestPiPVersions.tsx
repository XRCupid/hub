import React, { useState } from 'react';
import { UserAvatarPiP as CurrentVersion } from './UserAvatarPiP';
import { UserAvatarPiP as June9Version } from './UserAvatarPiP.june9';
import { UserAvatarPiP as June11Version } from './UserAvatarPiP.working-june11';
import { UserAvatarPiP as SimpleVersion } from './UserAvatarPiP.simple';
import { UserAvatarPiP as WorkingVersion } from './UserAvatarPiP.working';

const TestPiPVersions: React.FC = () => {
  const [activeVersion, setActiveVersion] = useState<string>('');

  const versions = [
    { name: 'Current Version', component: CurrentVersion },
    { name: 'June 9 Version', component: June9Version },
    { name: 'June 11 Working', component: June11Version },
    { name: 'Simple Version', component: SimpleVersion },
    { name: 'Working Version', component: WorkingVersion },
  ];

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#1a1a1a', color: 'white', minHeight: '100vh' }}>
      <h1>PiP Avatar Version Comparison</h1>
      <p>Testing different backup versions to find which one has working face tracking</p>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>Select Version to Test:</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {versions.map((version) => (
            <button
              key={version.name}
              onClick={() => setActiveVersion(activeVersion === version.name ? '' : version.name)}
              style={{
                padding: '12px 24px',
                backgroundColor: activeVersion === version.name ? '#4CAF50' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              {activeVersion === version.name ? 'Hide' : 'Show'} {version.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
        <h3>Currently Testing: {activeVersion || 'None'}</h3>
        <p>The avatar should appear in the bottom-right corner and track your facial expressions.</p>
      </div>

      {/* Render the selected version */}
      {versions.map((version) => {
        if (activeVersion === version.name) {
          const Component = version.component;
          return (
            <div key={version.name}>
              <Component
                avatarUrl="/avatars/user_avatar.glb"
                position="bottom-right"
                size="medium"
              />
            </div>
          );
        }
        return null;
      })}

      <div style={{ marginTop: '40px', backgroundColor: '#333', padding: '20px', borderRadius: '10px' }}>
        <h3>Version Notes:</h3>
        <ul>
          <li><strong>June 9 Version:</strong> The original simple version that reportedly worked</li>
          <li><strong>June 11 Working:</strong> The conference demo version that was confirmed working</li>
          <li><strong>Simple Version:</strong> A stripped-down version for testing</li>
          <li><strong>Working Version:</strong> Another backup that might have working tracking</li>
          <li><strong>Current Version:</strong> The current version with complex initialization logic</li>
        </ul>
      </div>
    </div>
  );
};

export default TestPiPVersions;
