import React, { useState, useEffect } from 'react';
import RPMAvatar from './RPMAvatar';
import RPMAvatarCreatorModal from './RPMAvatarCreatorModal';

interface RPMAvatarProfile {
  id: string;
  name: string;
  avatarUrl: string;
  gender: 'male' | 'female' | 'non-binary';
  style: 'realistic' | 'stylized' | 'anime';
  personality: string[];
  emotions: { [key: string]: number };
}

// Pre-made RPM avatar URLs for different NPCs
const SAMPLE_RPM_AVATARS: RPMAvatarProfile[] = [
  {
    id: 'alex',
    name: 'Alex',
    avatarUrl: 'https://models.readyplayer.me/64bfa15f0e72c63d7c3f5a1e.glb', // Example URL
    gender: 'male',
    style: 'realistic',
    personality: ['intellectual', 'thoughtful', 'adventurous'],
    emotions: { concentration: 0.3, joy: 0.2 }
  },
  {
    id: 'jamie',
    name: 'Jamie',
    avatarUrl: 'https://models.readyplayer.me/64bfa15f0e72c63d7c3f5a2f.glb', // Example URL
    gender: 'female',
    style: 'realistic',
    personality: ['creative', 'passionate', 'witty'],
    emotions: { joy: 0.4, excitement: 0.3 }
  },
  {
    id: 'sam',
    name: 'Sam',
    avatarUrl: 'https://models.readyplayer.me/64bfa15f0e72c63d7c3f5a3g.glb', // Example URL
    gender: 'female',
    style: 'realistic',
    personality: ['ambitious', 'practical', 'warm'],
    emotions: { concentration: 0.2, joy: 0.3 }
  },
  {
    id: 'river',
    name: 'River',
    avatarUrl: 'https://models.readyplayer.me/64bfa15f0e72c63d7c3f5a4h.glb', // Example URL
    gender: 'male',
    style: 'stylized',
    personality: ['artistic', 'mysterious', 'sensitive'],
    emotions: { contemplation: 0.4, mystery: 0.3 }
  }
];

interface RPMAvatarGeneratorProps {
  onAvatarSelect?: (avatar: RPMAvatarProfile) => void;
  selectedAvatarId?: string;
  showGenerator?: boolean;
}

export const RPMAvatarGenerator: React.FC<RPMAvatarGeneratorProps> = ({
  onAvatarSelect,
  selectedAvatarId,
  showGenerator = true
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState<RPMAvatarProfile | null>(null);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatorMode, setGeneratorMode] = useState<'preset' | 'custom' | 'generate' | 'creator'>('preset');
  const [showRPMCreator, setShowRPMCreator] = useState(false);

  useEffect(() => {
    if (selectedAvatarId) {
      const avatar = SAMPLE_RPM_AVATARS.find(a => a.id === selectedAvatarId);
      if (avatar) {
        setSelectedAvatar(avatar);
      }
    }
  }, [selectedAvatarId]);

  const handleAvatarSelect = (avatar: RPMAvatarProfile) => {
    setSelectedAvatar(avatar);
    onAvatarSelect?.(avatar);
  };

  const generateNewAvatar = async () => {
    setIsGenerating(true);
    
    // In a real implementation, this would call the RPM API
    // For now, we'll simulate the process
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate random avatar URL (in real implementation, this comes from RPM API)
      const newAvatarUrl = `https://models.readyplayer.me/generated-${Date.now()}.glb`;
      
      const newAvatar: RPMAvatarProfile = {
        id: `generated-${Date.now()}`,
        name: 'Generated Avatar',
        avatarUrl: newAvatarUrl,
        gender: 'non-binary',
        style: 'realistic',
        personality: ['unique', 'generated'],
        emotions: { neutral: 0.5 }
      };
      
      handleAvatarSelect(newAvatar);
    } catch (error) {
      console.error('Avatar generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomUrl = () => {
    if (customAvatarUrl.trim()) {
      const customAvatar: RPMAvatarProfile = {
        id: `custom-${Date.now()}`,
        name: 'Custom Avatar',
        avatarUrl: customAvatarUrl.trim(),
        gender: 'non-binary',
        style: 'realistic',
        personality: ['custom'],
        emotions: { neutral: 0.5 }
      };
      
      handleAvatarSelect(customAvatar);
      setCustomAvatarUrl('');
    }
  };

  const handleRPMAvatarCreated = (avatarUrl: string) => {
    const newAvatar: RPMAvatarProfile = {
      id: `rpm-${Date.now()}`,
      name: 'My Avatar',
      avatarUrl: avatarUrl,
      gender: 'non-binary',
      style: 'realistic',
      personality: ['custom', 'unique'],
      emotions: { neutral: 0.5 }
    };
    
    handleAvatarSelect(newAvatar);
    setShowRPMCreator(false);
  };

  if (!showGenerator) {
    return selectedAvatar ? (
      <RPMAvatar
        avatarUrl={selectedAvatar.avatarUrl}
        emotions={selectedAvatar.emotions}
        className="selected-avatar"
      />
    ) : null;
  }

  return (
    <div className="rpm-avatar-generator">
      <div className="generator-header">
        <h3>🎭 Choose Your Avatar</h3>
        <div className="mode-selector">
          <button 
            className={generatorMode === 'preset' ? 'active' : ''}
            onClick={() => setGeneratorMode('preset')}
          >
            📋 Presets
          </button>
          <button 
            className={generatorMode === 'generate' ? 'active' : ''}
            onClick={() => setGeneratorMode('generate')}
          >
            🎲 Generate
          </button>
          <button 
            className={generatorMode === 'custom' ? 'active' : ''}
            onClick={() => setGeneratorMode('custom')}
          >
            🔗 Custom URL
          </button>
          <button 
            className={generatorMode === 'creator' ? 'active' : ''}
            onClick={() => {
              setGeneratorMode('creator');
              setShowRPMCreator(true);
            }}
          >
            🎨 Create
          </button>
        </div>
      </div>

      {generatorMode === 'preset' && (
        <div className="preset-avatars">
          <div className="avatar-grid">
            {SAMPLE_RPM_AVATARS.map((avatar) => (
              <div 
                key={avatar.id}
                className={`avatar-card ${selectedAvatar?.id === avatar.id ? 'selected' : ''}`}
                onClick={() => handleAvatarSelect(avatar)}
              >
                <div className="avatar-preview">
                  <RPMAvatar
                    avatarUrl={avatar.avatarUrl}
                    emotions={avatar.emotions}
                    isAnimating={false}
                    enableControls={false}
                  />
                </div>
                <div className="avatar-info">
                  <h4>{avatar.name}</h4>
                  <div className="avatar-tags">
                    <span className={`gender-tag ${avatar.gender}`}>
                      {avatar.gender}
                    </span>
                    <span className={`style-tag ${avatar.style}`}>
                      {avatar.style}
                    </span>
                  </div>
                  <div className="personality-tags">
                    {avatar.personality.slice(0, 2).map((trait, index) => (
                      <span key={index} className="personality-tag">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {generatorMode === 'generate' && (
        <div className="avatar-generator">
          <div className="generator-options">
            <h4>🎨 Generate New Avatar</h4>
            <p>Create a unique avatar using Ready Player Me's generator</p>
            
            <div className="generation-controls">
              <div className="option-group">
                <label>Gender:</label>
                <select>
                  <option value="random">Random</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                </select>
              </div>
              
              <div className="option-group">
                <label>Style:</label>
                <select>
                  <option value="realistic">Realistic</option>
                  <option value="stylized">Stylized</option>
                  <option value="anime">Anime</option>
                </select>
              </div>
            </div>
            
            <button 
              className="generate-btn"
              onClick={generateNewAvatar}
              disabled={isGenerating}
            >
              {isGenerating ? '🎲 Generating...' : '🎲 Generate Avatar'}
            </button>
            
            <div className="rpm-integration-note">
              <p>💡 <strong>Pro Tip:</strong> Visit <a href="https://readyplayer.me" target="_blank" rel="noopener noreferrer">ReadyPlayer.Me</a> to create custom avatars</p>
            </div>
          </div>
        </div>
      )}

      {generatorMode === 'custom' && (
        <div className="custom-avatar">
          <h4>🔗 Custom Avatar URL</h4>
          <p>Enter a Ready Player Me avatar URL (.glb file)</p>
          
          <div className="url-input-group">
            <input
              type="url"
              placeholder="https://models.readyplayer.me/your-avatar.glb"
              value={customAvatarUrl}
              onChange={(e) => setCustomAvatarUrl(e.target.value)}
            />
            <button onClick={handleCustomUrl} disabled={!customAvatarUrl.trim()}>
              Load Avatar
            </button>
          </div>
          
          <div className="url-help">
            <h5>How to get your avatar URL:</h5>
            <ol>
              <li>Visit <a href="https://readyplayer.me" target="_blank" rel="noopener noreferrer">ReadyPlayer.Me</a></li>
              <li>Create or customize your avatar</li>
              <li>Copy the .glb model URL</li>
              <li>Paste it above</li>
            </ol>
          </div>
        </div>
      )}

      {generatorMode === 'creator' && (
        <RPMAvatarCreatorModal
          isOpen={showRPMCreator}
          onClose={() => setShowRPMCreator(false)}
          onAvatarCreated={handleRPMAvatarCreated}
        />
      )}

      {selectedAvatar && (
        <div className="selected-avatar-preview">
          <h4>Selected Avatar: {selectedAvatar.name}</h4>
          <div className="preview-container">
            <RPMAvatar
              avatarUrl={selectedAvatar.avatarUrl}
              emotions={selectedAvatar.emotions}
              enableControls={true}
            />
          </div>
        </div>
      )}

      <style>{`
        .rpm-avatar-generator {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .generator-header {
          margin-bottom: 24px;
        }

        .generator-header h3 {
          margin: 0 0 16px 0;
          color: #333;
        }

        .mode-selector {
          display: flex;
          gap: 8px;
          background: #f5f5f5;
          padding: 4px;
          border-radius: 8px;
        }

        .mode-selector button {
          flex: 1;
          padding: 8px 16px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
        }

        .mode-selector button.active {
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          color: #667eea;
          font-weight: 600;
        }

        .avatar-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .avatar-card {
          border: 2px solid #e9ecef;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
        }

        .avatar-card:hover {
          border-color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }

        .avatar-card.selected {
          border-color: #667eea;
          background: #f8f9ff;
        }

        .avatar-preview {
          height: 200px;
          margin-bottom: 12px;
          border-radius: 8px;
          overflow: hidden;
          background: #f8f9fa;
        }

        .avatar-info h4 {
          margin: 0 0 8px 0;
          color: #333;
        }

        .avatar-tags {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }

        .gender-tag, .style-tag {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .gender-tag.male { background: #e3f2fd; color: #1976d2; }
        .gender-tag.female { background: #fce4ec; color: #c2185b; }
        .gender-tag.non-binary { background: #f3e5f5; color: #7b1fa2; }

        .style-tag.realistic { background: #e8f5e8; color: #2e7d32; }
        .style-tag.stylized { background: #fff3e0; color: #f57c00; }
        .style-tag.anime { background: #e1f5fe; color: #0277bd; }

        .personality-tags {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .personality-tag {
          background: #f5f5f5;
          color: #666;
          padding: 2px 6px;
          border-radius: 8px;
          font-size: 11px;
        }

        .generator-options {
          text-align: center;
          padding: 24px;
        }

        .generation-controls {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin: 20px 0;
        }

        .option-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .option-group label {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .option-group select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .generate-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .generate-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .generate-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .rpm-integration-note {
          margin-top: 20px;
          padding: 16px;
          background: #f8f9ff;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }

        .rpm-integration-note a {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
        }

        .url-input-group {
          display: flex;
          gap: 8px;
          margin: 16px 0;
        }

        .url-input-group input {
          flex: 1;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .url-input-group button {
          background: #667eea;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .url-help {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 8px;
          text-align: left;
        }

        .url-help h5 {
          margin: 0 0 8px 0;
          color: #333;
        }

        .url-help ol {
          margin: 0;
          padding-left: 20px;
        }

        .url-help li {
          margin-bottom: 4px;
        }

        .selected-avatar-preview {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e9ecef;
        }

        .selected-avatar-preview h4 {
          margin: 0 0 16px 0;
          color: #333;
        }

        .preview-container {
          height: 300px;
          border-radius: 12px;
          overflow: hidden;
          background: #f8f9fa;
        }
      `}</style>
    </div>
  );
};

export default RPMAvatarGenerator;
