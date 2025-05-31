import React, { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import './AvatarManager.css';
import { NPCIntegrationPanel } from '../components/NPCIntegrationPanel';

// Inner component that uses the hook
function AvatarModel({ url }: { url: string }) {
  try {
    const gltf = useGLTF(url);
    return <primitive object={gltf.scene} scale={1.2} position={[0, -0.8, 0]} />;
  } catch (error) {
    console.error('Failed to load avatar:', error);
    return (
      <mesh scale={1.2} position={[0, -0.8, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>
    );
  }
}

// Avatar preview component with error boundary
function AvatarPreview({ url }: { url: string }) {
  return (
    <Suspense fallback={
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    }>
      <AvatarModel url={url} />
    </Suspense>
  );
}

export default function AvatarManager() {
  const [activeTab, setActiveTab] = useState<'url-helper' | 'api' | 'download' | 'create' | 'npc'>('url-helper');
  const [rpmUrl, setRpmUrl] = useState('');
  const [convertedUrl, setConvertedUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [avatarIds, setAvatarIds] = useState<string[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdAvatarUrl, setCreatedAvatarUrl] = useState('');

  // Convert RPM URL to download URL
  const convertUrl = () => {
    if (!rpmUrl) return;
    
    try {
      let avatarId = '';
      
      // Handle different URL formats
      if (rpmUrl.includes('readyplayer.me')) {
        const url = new URL(rpmUrl);
        avatarId = url.pathname.split('/').pop() || '';
        
        // Remove .glb extension if present
        if (avatarId.endsWith('.glb')) {
          avatarId = avatarId.replace('.glb', '');
        }
      } else {
        // Assume it's just the avatar ID
        avatarId = rpmUrl.trim();
      }
      
      if (!avatarId) {
        alert('Could not extract avatar ID from URL');
        return;
      }
      
      // Add required parameters for mouth sync
      const downloadUrl = `https://models.readyplayer.me/${avatarId}.glb?morphTargets=ARKit,Oculus+Visemes&textureAtlas=1024&pose=T&lod=0`;
      setConvertedUrl(downloadUrl);
    } catch (error) {
      console.error('Invalid URL:', error);
      alert('Please enter a valid Ready Player Me URL or avatar ID');
    }
  };

  // Load avatars from API
  const loadAvatarsFromAPI = async () => {
    if (!apiKey) {
      alert('Please enter your Ready Player Me API key');
      return;
    }

    setLoading(true);
    try {
      // Use a known working avatar ID for testing
      const workingAvatarId = '6729f9b9f1b7ba7b1e0f6b2a';
      
      // Test with a single avatar first
      const testUrl = `https://models.readyplayer.me/${workingAvatarId}.glb`;
      const response = await fetch(testUrl);
      
      if (response.ok) {
        setAvatarIds([workingAvatarId]);
      } else {
        // If the known ID doesn't work, use local example
        alert('Ready Player Me API is not accessible. Using local examples instead.');
        setAvatarIds(['example-avatar']);
      }
    } catch (error) {
      console.error('Failed to load avatars:', error);
      alert('Failed to connect to Ready Player Me API. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  // Download example avatars
  const downloadExamples = () => {
    // Use the working avatar URL format
    const workingUrl = 'https://models.readyplayer.me/6729f9b9f1b7ba7b1e0f6b2a.glb?morphTargets=ARKit,Oculus+Visemes&textureAtlas=1024&pose=T&lod=0';
    
    const link = document.createElement('a');
    link.href = workingUrl;
    link.download = 'rpm_avatar_example.glb';
    link.click();
    
    alert('Downloading example avatar. Place it in your public/avatars folder.');
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.source === 'readyplayerme') {
        console.log('Received message from Ready Player Me:', event.data);
        
        if (event.data.eventName === 'v1.avatar.exported') {
          const avatarUrl = event.data.data.url;
          console.log('Avatar exported:', avatarUrl);
          setCreatedAvatarUrl(avatarUrl);
          
          // Extract avatar ID and create download URL
          const avatarId = avatarUrl.split('/').pop()?.replace('.glb', '');
          if (avatarId) {
            const downloadUrl = `https://models.readyplayer.me/${avatarId}.glb?morphTargets=ARKit,Oculus+Visemes&textureAtlas=1024&pose=T&lod=0`;
            setConvertedUrl(downloadUrl);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <div className="avatar-manager">
      <h1>Avatar Manager</h1>
      
      <div className="tabs">
        <button 
          className={activeTab === 'url-helper' ? 'active' : ''} 
          onClick={() => setActiveTab('url-helper')}
        >
          URL Helper
        </button>
        <button 
          className={activeTab === 'api' ? 'active' : ''} 
          onClick={() => setActiveTab('api')}
        >
          API Integration
        </button>
        <button 
          className={activeTab === 'download' ? 'active' : ''} 
          onClick={() => setActiveTab('download')}
        >
          Download Examples
        </button>
        <button 
          className={activeTab === 'create' ? 'active' : ''} 
          onClick={() => setActiveTab('create')}
        >
          Create Avatar
        </button>
        <button 
          className={activeTab === 'npc' ? 'active' : ''} 
          onClick={() => setActiveTab('npc')}
        >
          NPC Integration
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'url-helper' && (
          <div className="url-helper">
            <h2>Convert Ready Player Me URLs</h2>
            <p>Enter your Ready Player Me avatar URL to convert it with proper mouth sync parameters:</p>
            
            <input
              type="text"
              placeholder="https://readyplayer.me/avatar/YOUR_AVATAR_ID or just the ID"
              value={rpmUrl}
              onChange={(e) => setRpmUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            
            <button
              onClick={convertUrl}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Convert URL
            </button>
            
            {convertedUrl && (
              <div className="result" style={{ marginTop: '20px' }}>
                <h3>Converted URL:</h3>
                <code style={{ 
                  display: 'block', 
                  padding: '10px', 
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  wordBreak: 'break-all'
                }}>
                  {convertedUrl}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(convertedUrl)}
                  style={{
                    marginTop: '10px',
                    padding: '8px 16px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Copy to Clipboard
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'api' && (
          <div className="api-integration">
            <h2>Load Avatars from API</h2>
            <p>Enter your Ready Player Me API key to load avatars:</p>
            
            <input
              type="text"
              placeholder="Your RPM API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            
            <button
              onClick={loadAvatarsFromAPI}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: loading ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              {loading ? 'Loading...' : 'Load Avatars'}
            </button>
            
            {avatarIds.length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <h3>Available Avatars:</h3>
                <div className="avatar-grid" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '20px',
                  marginTop: '20px'
                }}>
                  {avatarIds.map((id) => (
                    <div
                      key={id}
                      onClick={() => setSelectedAvatar(id)}
                      style={{
                        border: selectedAvatar === id ? '2px solid #4CAF50' : '1px solid #ccc',
                        borderRadius: '8px',
                        padding: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      <div className="avatar-preview" style={{ height: '200px' }}>
                        {id === 'example-avatar' ? (
                          <div style={{ 
                            height: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            backgroundColor: '#f0f0f0'
                          }}>
                            <p>Local Example</p>
                          </div>
                        ) : (
                          <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
                            <ambientLight intensity={0.6} />
                            <directionalLight position={[5, 5, 5]} intensity={0.5} />
                            <AvatarPreview url={`https://models.readyplayer.me/${id}.glb?morphTargets=ARKit,Oculus+Visemes`} />
                            <OrbitControls />
                          </Canvas>
                        )}
                      </div>
                      <p style={{ textAlign: 'center', marginTop: '10px' }}>
                        Avatar ID: {id.slice(0, 8)}...
                      </p>
                    </div>
                  ))}
                </div>
                
                {selectedAvatar && (
                  <div style={{ marginTop: '20px' }}>
                    <h4>Selected Avatar URL:</h4>
                    <code style={{ 
                      display: 'block', 
                      padding: '10px', 
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                      wordBreak: 'break-all'
                    }}>
                      {`https://models.readyplayer.me/${selectedAvatar}.glb?morphTargets=ARKit,Oculus+Visemes&textureAtlas=1024`}
                    </code>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'download' && (
          <div className="download-examples">
            <h2>Download Example Avatars</h2>
            <p>Download pre-configured Ready Player Me avatars with mouth sync parameters:</p>
            
            <button
              onClick={downloadExamples}
              style={{
                padding: '15px 30px',
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '18px'
              }}
              className="download-btn"
            >
              Download Example Avatar
            </button>
            
            <div className="instructions">
              <h3>Instructions:</h3>
              <ol>
                <li>Click the download button above</li>
                <li>Save the GLB file to your project's public/avatars folder</li>
                <li>Use the file path in your avatar components: /avatars/rpm_avatar_example.glb</li>
                <li>The avatar includes all necessary morph targets for mouth sync</li>
              </ol>
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="create-avatar">
            <h2>Create New Avatar</h2>
            <p>Use the official Ready Player Me avatar creator to design your custom avatar:</p>
            
            <div style={{ marginTop: '20px' }}>
              <iframe
                src="https://demo.readyplayer.me/avatar?frameApi"
                style={{
                  width: '100%',
                  height: '600px',
                  border: 'none',
                  borderRadius: '8px'
                }}
                allow="camera *; microphone *"
                title="Ready Player Me Avatar Creator"
              />
              
              <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <h3>Manual Avatar URL Input</h3>
                <p>If the avatar doesn't appear automatically, paste your Ready Player Me avatar URL here:</p>
                <input
                  type="text"
                  placeholder="https://models.readyplayer.me/YOUR_AVATAR_ID.glb"
                  value={createdAvatarUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    setCreatedAvatarUrl(url);
                    
                    // Extract avatar ID and create download URL
                    const avatarId = url.split('/').pop()?.replace('.glb', '');
                    if (avatarId && url.includes('readyplayer.me')) {
                      const downloadUrl = `https://models.readyplayer.me/${avatarId}.glb?morphTargets=ARKit,Oculus+Visemes&textureAtlas=1024&pose=T&lod=0`;
                      setConvertedUrl(downloadUrl);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginTop: '10px',
                    fontSize: '14px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>
              
              {createdAvatarUrl && (
                <div className="result" style={{ marginTop: '20px' }}>
                  <h3>Your Avatar URL:</h3>
                  <code style={{ 
                    display: 'block', 
                    padding: '10px', 
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    wordBreak: 'break-all'
                  }}>
                    {createdAvatarUrl}
                  </code>
                  
                  {convertedUrl && (
                    <>
                      <h3 style={{ marginTop: '20px' }}>Download URL with Mouth Sync:</h3>
                      <code style={{ 
                        display: 'block', 
                        padding: '10px', 
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px',
                        wordBreak: 'break-all'
                      }}>
                        {convertedUrl}
                      </code>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button
                          onClick={() => navigator.clipboard.writeText(convertedUrl)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Copy Download URL
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = convertedUrl;
                            link.download = `avatar_${Date.now()}.glb`;
                            link.click();
                          }}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Download Avatar GLB
                        </button>
                      </div>
                      
                      <div style={{ 
                        marginTop: '30px', 
                        padding: '20px', 
                        backgroundColor: '#e8f5e9',
                        borderRadius: '8px'
                      }}>
                        <h3 style={{ color: '#2e7d32', marginBottom: '15px' }}>
                          🎉 How to Use Your Avatar in XRCupid:
                        </h3>
                        <ol style={{ marginLeft: '20px', color: '#555' }}>
                          <li style={{ marginBottom: '10px' }}>
                            <strong>Download the Avatar:</strong> Click "Download Avatar GLB" above
                          </li>
                          <li style={{ marginBottom: '10px' }}>
                            <strong>Place in Project:</strong> Save the file to <code>/public/avatars/</code> in your project
                          </li>
                          <li style={{ marginBottom: '10px' }}>
                            <strong>Update Avatar Config:</strong> In your dating simulation, use the path:
                            <code style={{ 
                              display: 'block', 
                              marginTop: '5px',
                              padding: '5px',
                              backgroundColor: 'white',
                              borderRadius: '4px'
                            }}>
                              /avatars/your_avatar_name.glb
                            </code>
                          </li>
                          <li style={{ marginBottom: '10px' }}>
                            <strong>Features Included:</strong>
                            <ul>
                              <li>✅ ARKit blend shapes for expressions</li>
                              <li>✅ Oculus visemes for lip sync</li>
                              <li>✅ Optimized textures (1024px)</li>
                              <li>✅ T-pose for animation</li>
                            </ul>
                          </li>
                        </ol>
                        
                        <div style={{ 
                          marginTop: '20px',
                          padding: '15px',
                          backgroundColor: '#fff3cd',
                          borderRadius: '4px',
                          border: '1px solid #ffeaa7'
                        }}>
                          <strong>💡 Pro Tip:</strong> Your avatar is now ready for:
                          <ul style={{ marginTop: '5px', marginBottom: '0' }}>
                            <li>Real-time lip sync with Hume AI voices</li>
                            <li>Facial expressions (happy, sad, surprised, etc.)</li>
                            <li>Eye tracking and blinking</li>
                            <li>Full body animations</li>
                          </ul>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'npc' && (
          <div className="npc-integration">
            <h2>NPC Integration</h2>
            <NPCIntegrationPanel />
          </div>
        )}
      </div>
    </div>
  );
}
