import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import './AvatarCreationHub.css';

// Import avatar services
import { AvatarAutoGenerator } from '../services/AvatarAutoGenerator';
import { RPMAutoAvatarGenerator } from '../services/RPMAutoAvatarGenerator';
import { RPMIntegrationService } from '../services/RPMIntegrationService';
import { ReadyPlayerMeService } from '../services/readyPlayerMeService';
import { AvatarMirrorSystem } from '../services/AvatarMirrorSystem';

// Import avatar components
import PresenceAvatar from '../components/PresenceAvatar';
import RPMAvatarCreator from '../components/RPMAvatarCreator';
import RPMAvatarGenerator from '../components/RPMAvatarGenerator';
import UserPresenceAvatar from '../components/UserPresenceAvatar';

// Import tracking services
import { ML5FaceMeshService } from '../services/ML5FaceMeshService';
import { CombinedFaceTrackingService } from '../services/CombinedFaceTrackingService';

interface AvatarOption {
  id: string;
  name: string;
  url: string;
  type: 'preset' | 'generated' | 'custom' | 'mirrored' | 'rpm';
  metadata?: any;
}

const AvatarCreationHub: React.FC = () => {
  const [selectedPipeline, setSelectedPipeline] = useState<string>('overview');
  const [avatarOptions, setAvatarOptions] = useState<AvatarOption[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarOption | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Services
  const [avatarAutoGen] = useState(() => AvatarAutoGenerator.getInstance());
  const [ml5Service] = useState(() => new ML5FaceMeshService());
  const [readyPlayerMeService] = useState(() => new ReadyPlayerMeService({ subdomain: 'xr-cupid' }));
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackingDataRef = useRef<any>(null);
  const animationFrameRef = useRef<number>();

  // RPM Message Handler
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Log all messages for debugging
      console.log('Message received from:', event.origin, 'Data:', event.data);

      // Check if message is from Ready Player Me
      if (!event.origin.includes('readyplayer.me')) {
        return;
      }

      try {
        // Handle direct URL strings
        if (typeof event.data === 'string') {
          // Check if it's a full URL
          if (event.data.startsWith('https://models.readyplayer.me/')) {
            const avatarUrl = event.data;
            console.log('Direct avatar URL received:', avatarUrl);

            setAvatarUrl(avatarUrl);
            setSelectedAvatar({
              id: avatarUrl.split('/').pop()?.replace('.glb', '') || avatarUrl,
              url: avatarUrl,
              name: 'Custom RPM Avatar',
              type: 'rpm'
            });
            return;
          }

          // Check if it's just an avatar code/ID
          if (event.data.length > 0 && !event.data.includes('{')) {
            const avatarCode = event.data.trim();
            const avatarUrl = `https://models.readyplayer.me/${avatarCode}.glb`;
            console.log('Avatar code received:', avatarCode, 'Constructed URL:', avatarUrl);

            setAvatarUrl(avatarUrl);
            setSelectedAvatar({
              id: avatarCode,
              url: avatarUrl,
              name: 'Custom RPM Avatar',
              type: 'rpm'
            });
            return;
          }
        }

        // Handle JSON data
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        console.log('RPM Message parsed:', data);

        // Handle v1.avatar.exported event
        if (data.eventName === 'v1.avatar.exported') {
          let avatarUrl = data.data?.url;
          let avatarId = data.data?.avatarId || data.data?.id;

          // If only avatar ID is provided, construct the full URL
          if (!avatarUrl && avatarId) {
            avatarUrl = `https://models.readyplayer.me/${avatarId}.glb`;
          }

          console.log('Avatar exported - ID:', avatarId, 'URL:', avatarUrl);

          if (avatarUrl) {
            setAvatarUrl(avatarUrl);
            setSelectedAvatar({
              id: avatarId || avatarUrl,
              url: avatarUrl,
              name: 'Custom RPM Avatar',
              type: 'rpm'
            });
          }
        }

        // Handle other RPM events
        if (data.source === 'readyplayerme' && data.eventName) {
          console.log('RPM Event:', data.eventName, 'Data:', data);

          // Handle avatar.created or other events that might just send an ID
          if (data.eventName === 'avatar.created' && data.data?.avatarId) {
            const avatarId = data.data.avatarId;
            const avatarUrl = `https://models.readyplayer.me/${avatarId}.glb`;

            setAvatarUrl(avatarUrl);
            setSelectedAvatar({
              id: avatarId,
              url: avatarUrl,
              name: 'Custom RPM Avatar',
              type: 'rpm'
            });
          }
        }
      } catch (error) {
        console.error('Error handling RPM message:', error);
        console.error('Raw data:', event.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Initialize face tracking
  useEffect(() => {
    const initTracking = async () => {
      const videoElement = videoRef.current;
      if (videoElement) {
        try {
          await ml5Service.initialize();
          await ml5Service.startTracking(videoElement);
        } catch (error) {
          console.error('[AvatarCreationHub] Failed to initialize tracking:', error);
        }
      }
    };

    if (selectedPipeline === 'mirror') {
      initTracking();
    }

    return () => {
      if (ml5Service) {
        ml5Service.stopTracking();
      }
    };
  }, [selectedPipeline, ml5Service]);

  // Pipeline handlers
  const handleAutoGenerate = async () => {
    const preferences = {
      gender: 'female' as const,
      ageRange: '26-35' as const,
      style: 'professional' as const,
      ethnicity: 'mixed' as const
    };

    const generatedAvatar = await avatarAutoGen.generateAvatar(preferences);
    const newOption: AvatarOption = {
      id: generatedAvatar.id,
      name: `Auto-Generated ${generatedAvatar.metadata.style}`,
      url: generatedAvatar.url,
      type: 'generated',
      metadata: generatedAvatar.metadata
    };

    setAvatarOptions([...avatarOptions, newOption]);
    setSelectedAvatar(newOption);
  };

  const handleRPMGenerate = async () => {
    const config = {
      gender: 'male' as const,
      style: 'casual' as const,
      age: 'young' as const
    };

    const avatarUrl = await RPMAutoAvatarGenerator.getInstance().generateAvatar(config);
    const newOption: AvatarOption = {
      id: `rpm-${Date.now()}`,
      name: 'RPM Generated Avatar',
      url: avatarUrl,
      type: 'generated',
      metadata: config
    };

    setAvatarOptions([...avatarOptions, newOption]);
    setSelectedAvatar(newOption);
  };

  const handleCustomAvatar = (avatarUrl: string) => {
    const newOption: AvatarOption = {
      id: `custom-${Date.now()}`,
      name: 'Custom Avatar',
      url: avatarUrl,
      type: 'custom'
    };

    setAvatarOptions([...avatarOptions, newOption]);
    setSelectedAvatar(newOption);
    setShowCreator(false);
  };

  const startMirrorMode = async () => {
    if (ml5Service && !isTracking) {
      setIsTracking(true);

      // Set up tracking data updates
      const updateInterval = setInterval(() => {
        const expressions = ml5Service.getExpressions();
        const headRotation = ml5Service.getHeadRotation();
        const landmarks = ml5Service.getLandmarks();

        setTrackingData({
          facialExpressions: expressions,
          headRotation,
          landmarks
        });
      }, 33); // 30 FPS

      return () => clearInterval(updateInterval);
    }
  };

  const pipelines = [
    {
      id: 'overview',
      name: 'Overview',
      description: 'Learn about all avatar creation methods'
    },
    {
      id: 'auto-generate',
      name: 'Auto-Generate',
      description: 'AI-powered avatar generation based on preferences'
    },
    {
      id: 'rpm-builder',
      name: 'RPM Builder',
      description: 'Ready Player Me avatar creation and customization'
    },
    {
      id: 'rpm-converter',
      name: 'RPM URL Converter',
      description: 'Convert Ready Player Me avatar URLs to downloadable GLB files'
    },
    {
      id: 'mirror',
      name: 'Mirror Mode',
      description: 'Real-time avatar that mirrors your expressions'
    },
    {
      id: 'presets',
      name: 'Preset Library',
      description: 'Choose from pre-made optimized avatars'
    }
  ];

  const renderPipelineContent = () => {
    switch (selectedPipeline) {
      case 'overview':
        return (
          <div className="pipeline-overview">
            <h2>Avatar Creation Pipelines</h2>
            <div className="overview-grid">
              <div className="overview-card">
                <h3>🤖 Auto-Generation</h3>
                <p>AI-powered avatar creation based on user preferences. Generates unique avatars programmatically without manual input.</p>
                <ul>
                  <li>Gender, age, ethnicity selection</li>
                  <li>Style preferences (casual, professional, etc.)</li>
                  <li>Automatic optimization for performance</li>
                </ul>
              </div>

              <div className="overview-card">
                <h3>🎨 RPM Builder</h3>
                <p>Integration with Ready Player Me for detailed avatar customization with full expression support.</p>
                <ul>
                  <li>52 facial blend shapes</li>
                  <li>Viseme support for lip-sync</li>
                  <li>Custom clothing and accessories</li>
                </ul>
              </div>

              <div className="overview-card">
                <h3>🪞 Mirror Mode</h3>
                <p>Real-time avatar that mirrors your facial expressions and head movements using ML5 face tracking.</p>
                <ul>
                  <li>Live expression mapping</li>
                  <li>Head rotation tracking</li>
                  <li>Emotion amplification</li>
                </ul>
              </div>

              <div className="overview-card">
                <h3>📚 Preset Library</h3>
                <p>Curated collection of pre-optimized avatars for different personalities and use cases.</p>
                <ul>
                  <li>Coach avatars (Grace, Posie, Rizzo)</li>
                  <li>NPC dating profiles</li>
                  <li>Professional avatars</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'auto-generate':
        return (
          <div className="pipeline-auto-generate">
            <h2>Auto-Generate Avatar</h2>
            <div className="generation-controls">
              <div className="preference-form">
                <h3>Set Preferences</h3>
                <div className="form-group">
                  <label>Gender</label>
                  <select>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Non-binary</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Age Range</label>
                  <select>
                    <option>18-25</option>
                    <option>26-35</option>
                    <option>36-45</option>
                    <option>45+</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Style</label>
                  <select>
                    <option>Casual</option>
                    <option>Professional</option>
                    <option>Athletic</option>
                    <option>Creative</option>
                    <option>Elegant</option>
                  </select>
                </div>
                <button onClick={handleAutoGenerate} className="generate-btn">
                  Generate Avatar
                </button>
              </div>

              <div className="generation-info">
                <h3>How it works</h3>
                <p>Our AI analyzes your preferences and generates a unique avatar that matches your specifications.</p>
                <p>The system uses:</p>
                <ul>
                  <li>Machine learning for facial feature generation</li>
                  <li>Style transfer for clothing and accessories</li>
                  <li>Automatic rigging for animations</li>
                  <li>Expression blend shape mapping</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'rpm-builder':
        return (
          <div className="pipeline-rpm">
            <p>Create a custom avatar using Ready Player Me's advanced builder</p>

            {/* Creation Options */}
            <div className="rpm-creation-options" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button
                className="pipeline-button"
                onClick={() => {
                  const iframe = document.querySelector('iframe[title="Ready Player Me Avatar Creator"]') as HTMLIFrameElement;
                  if (iframe) iframe.src = readyPlayerMeService.getAvatarCreatorUrl({ bodyType: 'halfbody' });
                }}
              >
                🎨 Create from Scratch
              </button>
              <button
                className="pipeline-button"
                onClick={() => {
                  const iframe = document.querySelector('iframe[title="Ready Player Me Avatar Creator"]') as HTMLIFrameElement;
                  if (iframe) iframe.src = readyPlayerMeService.getAvatarCreatorUrl({ bodyType: 'halfbody', quickStart: true });
                }}
              >
                📸 Upload Photo
              </button>
              <button
                className="pipeline-button"
                onClick={() => {
                  // Generate QR code for mobile photo capture
                  window.open('https://xr-cupid.readyplayer.me/avatar?frameApi=true&quickStart=true', '_blank');
                }}
              >
                📱 QR Code for Mobile
              </button>
            </div>

            {/* Avatar Status Display */}
            {avatarUrl && (
              <div className="avatar-status" style={{ 
                padding: '15px', 
                backgroundColor: '#1a1a1a', 
                borderRadius: '8px', 
                marginBottom: '20px',
                border: '2px solid #4CAF50'
              }}>
                <h4 style={{ color: '#4CAF50', marginBottom: '10px' }}>✅ Avatar Created!</h4>
                <p style={{ wordBreak: 'break-all', fontSize: '12px', marginBottom: '10px' }}>
                  <strong>URL:</strong> {avatarUrl}
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    className="pipeline-button"
                    onClick={() => navigator.clipboard.writeText(avatarUrl)}
                  >
                    📋 Copy URL
                  </button>
                  <button 
                    className="pipeline-button"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = avatarUrl;
                      link.download = avatarUrl.split('/').pop() || 'avatar.glb';
                      link.click();
                    }}
                  >
                    📥 Download GLB
                  </button>
                </div>
              </div>
            )}

            {/* Manual Avatar Code Input */}
            <div className="manual-input" style={{ 
              padding: '15px', 
              backgroundColor: '#1a1a1a', 
              borderRadius: '8px', 
              marginBottom: '20px' 
            }}>
              <h4>Manual Avatar Code Entry</h4>
              <p style={{ fontSize: '12px', marginBottom: '10px' }}>
                If you only received an avatar code, enter it here:
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Enter avatar code (e.g., 684753b48152ee3a462c973d)"
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#fff'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      const code = input.value.trim();
                      if (code) {
                        const url = `https://models.readyplayer.me/${code}.glb`;
                        setAvatarUrl(url);
                        setSelectedAvatar({
                          id: code,
                          url: url,
                          name: 'Manual RPM Avatar',
                          type: 'rpm'
                        });
                      }
                    }
                  }}
                />
                <button
                  className="pipeline-button"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder*="avatar code"]') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      const code = input.value.trim();
                      const url = `https://models.readyplayer.me/${code}.glb`;
                      setAvatarUrl(url);
                      setSelectedAvatar({
                        id: code,
                        url: url,
                        name: 'Manual RPM Avatar',
                        type: 'rpm'
                      });
                    }
                  }}
                >
                  ✅ Set Avatar
                </button>
              </div>
            </div>

            {/* Embedded RPM Creator */}
            <div className="rpm-iframe-container" style={{ width: '100%', height: '600px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #333' }}>
              <iframe
                src={readyPlayerMeService.getAvatarCreatorUrl({ bodyType: 'halfbody' })}
                title="Ready Player Me Avatar Creator"
                width="100%"
                height="100%"
                frameBorder="0"
                allow="camera; microphone"
                style={{ border: 'none' }}
              />
            </div>

            <div className="rpm-options" style={{ marginTop: '20px' }}>
              <button className="pipeline-button" onClick={() => window.open('https://xr-cupid.readyplayer.me/avatar', '_blank')}>
                🔗 Open in New Window
              </button>
              {avatarUrl && (
                <>
                  <button className="pipeline-button" onClick={() => navigator.clipboard.writeText(avatarUrl)}>
                    📋 Copy Avatar URL
                  </button>
                  <button className="pipeline-button" onClick={() => window.open(avatarUrl, '_blank')}>
                    👁️ View Avatar
                  </button>
                </>
              )}
            </div>
          </div>
        );

      case 'rpm-converter':
        return (
          <div className="pipeline-content">
            <h3>RPM Avatar URL Converter</h3>
            <p>Convert Ready Player Me avatar URLs to downloadable GLB files</p>

            <div className="url-converter-tool" style={{ marginTop: '20px' }}>
              <div className="input-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="rpm-url-input" style={{ display: 'block', marginBottom: '10px' }}>
                  Paste RPM Avatar URL:
                </label>
                <input
                  id="rpm-url-input"
                  type="text"
                  placeholder="https://models.readyplayer.me/[avatar-id].glb"
                  value={avatarUrl || ''}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #444',
                    borderRadius: '5px',
                    color: '#fff'
                  }}
                />
              </div>

              {avatarUrl && (
                <div className="converter-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    className="pipeline-button"
                    onClick={() => {
                      // Download GLB directly
                      const link = document.createElement('a');
                      link.href = avatarUrl;
                      link.download = `rpm-avatar-${Date.now()}.glb`;
                      link.click();
                    }}
                  >
                    📥 Download GLB
                  </button>

                  <button
                    className="pipeline-button"
                    onClick={() => {
                      // Download with quality parameters
                      const baseUrl = avatarUrl.split('?')[0];
                      const qualityUrl = `${baseUrl}?quality=high&textureAtlas=1024&morphTargets=ARKit`;
                      const link = document.createElement('a');
                      link.href = qualityUrl;
                      link.download = `rpm-avatar-hq-${Date.now()}.glb`;
                      link.click();
                    }}
                  >
                    📥 Download HQ GLB
                  </button>

                  <button
                    className="pipeline-button"
                    onClick={() => {
                      // Get PNG thumbnail
                      const pngUrl = avatarUrl.replace('.glb', '.png');
                      window.open(pngUrl, '_blank');
                    }}
                  >
                    🖼️ View PNG
                  </button>

                  <button
                    className="pipeline-button"
                    onClick={() => {
                      navigator.clipboard.writeText(avatarUrl);
                      alert('URL copied to clipboard!');
                    }}
                  >
                    📋 Copy URL
                  </button>
                </div>
              )}

              <div className="url-formats" style={{ marginTop: '30px', padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
                <h4>URL Format Examples:</h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '10px' }}>
                    <code style={{ backgroundColor: '#2a2a2a', padding: '5px', borderRadius: '3px' }}>
                      https://models.readyplayer.me/[avatar-id].glb
                    </code>
                  </li>
                  <li style={{ marginBottom: '10px' }}>
                    <strong>With parameters:</strong><br />
                    <code style={{ backgroundColor: '#2a2a2a', padding: '5px', borderRadius: '3px', fontSize: '12px' }}>
                      ?quality=high&textureAtlas=1024&morphTargets=ARKit
                    </code>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'mirror':
        return (
          <div className="pipeline-mirror">
            <h2>Mirror Mode</h2>
            <div className="mirror-container">
              <div className="mirror-controls">
                <video
                  id="tracking-video"
                  autoPlay
                  playsInline
                  muted
                  ref={videoRef}
                  style={{ width: '320px', height: '240px' }}
                />
                <button onClick={startMirrorMode} disabled={isTracking}>
                  {isTracking ? 'Tracking Active' : 'Start Tracking'}
                </button>
              </div>

              <div className="mirror-info">
                <h3>Real-time Expression Mapping</h3>
                <p>Your facial expressions are captured and mapped to the avatar in real-time.</p>
                <div className="tracking-stats">
                  {trackingData && (
                    <>
                      <div>Smile: {(trackingData.facialExpressions?.mouthSmileLeft || 0).toFixed(2)}</div>
                      <div>Eyebrows: {(trackingData.facialExpressions?.browInnerUp || 0).toFixed(2)}</div>
                      <div>Mouth Open: {(trackingData.facialExpressions?.mouthOpen || 0).toFixed(2)}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'presets':
        return (
          <div className="pipeline-presets">
            <h2>Preset Avatar Library</h2>
            <div className="preset-categories">
              <div className="category">
                <h3>Dating Coaches</h3>
                <div className="preset-grid">
                  <div className="preset-avatar" onClick={() => handleCustomAvatar('/models/coach_grace.glb')}>
                    <div className="avatar-preview">Grace</div>
                    <p>Elegant & Sophisticated</p>
                  </div>
                  <div className="preset-avatar" onClick={() => handleCustomAvatar('/models/coach_posie.glb')}>
                    <div className="avatar-preview">Posie</div>
                    <p>Warm & Nurturing</p>
                  </div>
                  <div className="preset-avatar" onClick={() => handleCustomAvatar('/models/coach_rizzo.glb')}>
                    <div className="avatar-preview">Rizzo</div>
                    <p>Bold & Confident</p>
                  </div>
                </div>
              </div>

              <div className="category">
                <h3>NPC Dates</h3>
                <div className="preset-grid">
                  <div className="preset-avatar">
                    <div className="avatar-preview">Alex</div>
                    <p>Intellectual Explorer</p>
                  </div>
                  <div className="preset-avatar">
                    <div className="avatar-preview">Jamie</div>
                    <p>Creative Spirit</p>
                  </div>
                  <div className="preset-avatar">
                    <div className="avatar-preview">Sam</div>
                    <p>Ambitious Professional</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="avatar-creation-hub">
      <div className="hub-header">
        <h1>Avatar Creation Hub</h1>
        <p>All avatar creation pipelines and tools in one place</p>
      </div>

      <div className="hub-layout">
        <div className="pipeline-sidebar">
          <h3>Pipelines</h3>
          {pipelines.map(pipeline => (
            <button
              key={pipeline.id}
              className={`pipeline-btn ${selectedPipeline === pipeline.id ? 'active' : ''}`}
              onClick={() => setSelectedPipeline(pipeline.id)}
            >
              <strong>{pipeline.name}</strong>
              <small>{pipeline.description}</small>
            </button>
          ))}
        </div>

        <div className="pipeline-content">
          {renderPipelineContent()}
        </div>

        <div className="avatar-preview">
          <h3>Avatar Preview</h3>
          {selectedAvatar ? (
            <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
              <Stage environment="city" intensity={0.6}>
                <PresenceAvatar
                  avatarUrl={selectedAvatar.url}
                  trackingData={trackingData}
                  position={[0, -1, 0]}
                  scale={1}
                />
              </Stage>
              <OrbitControls enablePan={false} enableZoom={false} />
            </Canvas>
          ) : (
            <div className="no-avatar">
              <p>No avatar selected</p>
              <p>Choose a pipeline to create or select an avatar</p>
            </div>
          )}

          {avatarOptions.length > 0 && (
            <div className="avatar-list">
              <h4>Created Avatars</h4>
              {avatarOptions.map(option => (
                <div
                  key={option.id}
                  className={`avatar-item ${selectedAvatar?.id === option.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatar(option)}
                >
                  <span>{option.name}</span>
                  <small>{option.type}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvatarCreationHub;
