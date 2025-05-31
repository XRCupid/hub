import React, { useState } from 'react';

export const RPMAvatarHelper: React.FC = () => {
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarId, setAvatarId] = useState('');

  const extractAvatarId = (url: string) => {
    // Extract avatar ID from various Ready Player Me URL formats
    const patterns = [
      /models\.readyplayer\.me\/([a-f0-9]{24})\.glb/i,
      /readyplayer\.me\/.*\/([a-f0-9]{24})/i,
      /([a-f0-9]{24})/i
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  const generateProperUrl = (id: string) => {
    const params = new URLSearchParams({
      morphTargets: 'ARKit,Oculus Visemes',
      textureAtlas: '1024',
      lod: '0',
      useHands: 'false'
    });
    return `https://models.readyplayer.me/${id}.glb?${params.toString()}`;
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setAvatarUrl(url);
    
    const id = extractAvatarId(url);
    if (id) {
      setAvatarId(id);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Ready Player Me Avatar Helper</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>How to get a Ready Player Me avatar:</h3>
        <ol>
          <li>Go to <a href="https://readyplayer.me/avatar" target="_blank" rel="noopener noreferrer">https://readyplayer.me/avatar</a></li>
          <li>Create or customize your avatar</li>
          <li>Click "Copy avatar link" or get the URL</li>
          <li>Paste it below</li>
        </ol>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>
          <strong>Paste your Ready Player Me URL:</strong>
          <input
            type="text"
            value={avatarUrl}
            onChange={handleUrlChange}
            placeholder="e.g., https://readyplayer.me/gallery/64c3a4a5c91663ff12b6d6f1"
            style={{
              width: '100%',
              padding: '10px',
              marginTop: '5px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </label>
      </div>

      {avatarId && (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f0f8ff', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4>✅ Avatar ID Found: <code>{avatarId}</code></h4>
          <p><strong>Proper GLB URL with mouth sync support:</strong></p>
          <code style={{ 
            display: 'block', 
            padding: '10px', 
            backgroundColor: '#333', 
            color: '#0f0',
            borderRadius: '4px',
            overflowX: 'auto',
            fontSize: '12px'
          }}>
            {generateProperUrl(avatarId)}
          </code>
          
          <button
            onClick={() => navigator.clipboard.writeText(generateProperUrl(avatarId))}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Copy URL to Clipboard
          </button>
        </div>
      )}

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffeaa7',
        borderRadius: '4px' 
      }}>
        <h4>⚠️ Important for Mouth Sync:</h4>
        <p>The URL must include these parameters:</p>
        <ul>
          <li><code>morphTargets=ARKit,Oculus Visemes</code> - Required for mouth animations</li>
          <li><code>textureAtlas=1024</code> - Texture quality</li>
          <li><code>lod=0</code> - Level of detail (0 = highest)</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>To use this avatar in the app:</h3>
        <ol>
          <li>Download the GLB file using the proper URL above</li>
          <li>Save it to <code>/public/avatars/</code> directory</li>
          <li>Update <code>preloadedAvatars.ts</code> with the new avatar info</li>
        </ol>
      </div>
    </div>
  );
};
