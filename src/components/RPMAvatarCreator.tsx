import React, { useState, useEffect } from 'react';
import { RPMAvatarGenerator, DEMO_RPM_AVATARS, RPMAvatarConfig } from '../utils/rpmAvatars';

interface RPMAvatarCreatorProps {
  onAvatarSelect: (avatarUrl: string) => void;
  onClose: () => void;
  currentAvatarUrl?: string;
}

const RPMAvatarCreator: React.FC<RPMAvatarCreatorProps> = ({
  onAvatarSelect,
  onClose,
  currentAvatarUrl
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatarUrl || '');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'create'>('presets');

  const handleAvatarSelect = (avatar: RPMAvatarConfig) => {
    setSelectedAvatar(avatar.avatarUrl);
    onAvatarSelect?.(avatar.avatarUrl);
  };

  const handleCustomUrlSubmit = () => {
    if (RPMAvatarGenerator.isValidAvatarUrl(customUrl)) {
      setSelectedAvatar(customUrl);
    } else {
      alert('Please enter a valid Ready Player Me avatar URL (.glb file)');
    }
  };

  const handleConfirm = () => {
    if (selectedAvatar) {
      onAvatarSelect(selectedAvatar);
      onClose();
    }
  };

  const openAvatarCreator = () => {
    const creatorUrl = RPMAvatarGenerator.getAvatarCreatorUrl({
      bodyType: 'halfbody',
      quickStart: true
    });
    window.open(creatorUrl, '_blank', 'width=800,height=600');
  };

  return (
    <div className="rpm-avatar-creator-overlay">
      <div className="rpm-avatar-creator">
        <div className="creator-header">
          <h2>Choose Your Avatar</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="creator-tabs">
          <button 
            className={`tab ${activeTab === 'presets' ? 'active' : ''}`}
            onClick={() => setActiveTab('presets')}
          >
            Preset Avatars
          </button>
          <button 
            className={`tab ${activeTab === 'custom' ? 'active' : ''}`}
            onClick={() => setActiveTab('custom')}
          >
            Custom URL
          </button>
          <button 
            className={`tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create New
          </button>
        </div>

        <div className="creator-content">
          {activeTab === 'presets' && (
            <div className="preset-avatars">
              <p className="section-description">
                Choose from our curated selection of Ready Player Me avatars:
              </p>
              <div className="avatar-grid">
                {DEMO_RPM_AVATARS.map((avatar) => (
                  <div 
                    key={avatar.id}
                    className={`avatar-option ${selectedAvatar === avatar.avatarUrl ? 'selected' : ''}`}
                    onClick={() => handleAvatarSelect(avatar)}
                  >
                    <div className="avatar-preview">
                      <div className="avatar-placeholder">
                        {avatar.name[0]}
                      </div>
                      <div className="avatar-info">
                        <span className="avatar-name">{avatar.name}</span>
                        <span className="avatar-type">{avatar.gender} • {avatar.style}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="custom-url-section">
              <p className="section-description">
                Enter a Ready Player Me avatar URL (.glb file):
              </p>
              <div className="url-input-group">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://models.readyplayer.me/your-avatar-id.glb"
                  className="url-input"
                />
                <button 
                  onClick={handleCustomUrlSubmit}
                  className="validate-btn"
                  disabled={!customUrl}
                >
                  Validate
                </button>
              </div>
              <div className="url-help">
                <p><strong>How to get your avatar URL:</strong></p>
                <ol>
                  <li>Create an avatar at <a href="https://readyplayer.me" target="_blank" rel="noopener noreferrer">readyplayer.me</a></li>
                  <li>Copy the .glb URL from the avatar page</li>
                  <li>Paste it above and click "Validate"</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <div className="create-avatar-section">
              <p className="section-description">
                Create a new avatar using Ready Player Me's Avatar Creator:
              </p>
              <div className="create-steps">
                <div className="step">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <h4>Open Avatar Creator</h4>
                    <p>Click below to open Ready Player Me's avatar creation tool in a new window.</p>
                    <button onClick={openAvatarCreator} className="create-btn">
                      🎨 Create Avatar
                    </button>
                  </div>
                </div>
                <div className="step">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <h4>Customize Your Avatar</h4>
                    <p>Use the creator to design your perfect avatar with facial features, hair, clothing, and more.</p>
                  </div>
                </div>
                <div className="step">
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <h4>Copy the URL</h4>
                    <p>Once created, copy the .glb URL and paste it in the "Custom URL" tab above.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="creator-footer">
          <div className="selected-info">
            {selectedAvatar && (
              <span className="selected-url">
                Selected: {selectedAvatar.substring(0, 50)}...
              </span>
            )}
          </div>
          <div className="creator-actions">
            <button onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button 
              onClick={handleConfirm} 
              className="confirm-btn"
              disabled={!selectedAvatar}
            >
              Use This Avatar
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .rpm-avatar-creator-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .rpm-avatar-creator {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .creator-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .creator-header h2 {
          margin: 0;
          color: #333;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .creator-tabs {
          display: flex;
          border-bottom: 1px solid #eee;
        }

        .tab {
          flex: 1;
          padding: 12px 16px;
          border: none;
          background: none;
          cursor: pointer;
          font-weight: 500;
          color: #666;
          transition: all 0.2s;
        }

        .tab.active {
          color: #4A90E2;
          border-bottom: 2px solid #4A90E2;
        }

        .creator-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .section-description {
          margin: 0 0 16px 0;
          color: #666;
        }

        .avatar-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
        }

        .avatar-option {
          border: 2px solid #eee;
          border-radius: 12px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .avatar-option:hover {
          border-color: #4A90E2;
        }

        .avatar-option.selected {
          border-color: #4A90E2;
          background: #f0f7ff;
        }

        .avatar-placeholder {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #4A90E2;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          margin: 0 auto 8px;
        }

        .avatar-name {
          display: block;
          font-weight: 600;
          color: #333;
        }

        .avatar-type {
          display: block;
          font-size: 12px;
          color: #666;
          margin-top: 2px;
        }

        .url-input-group {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .url-input {
          flex: 1;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
        }

        .validate-btn {
          padding: 12px 20px;
          background: #4A90E2;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        }

        .validate-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .url-help {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 8px;
          border-left: 4px solid #4A90E2;
        }

        .url-help p {
          margin: 0 0 8px 0;
          font-weight: 600;
        }

        .url-help ol {
          margin: 0;
          padding-left: 20px;
        }

        .url-help a {
          color: #4A90E2;
          text-decoration: none;
        }

        .create-steps {
          space-y: 16px;
        }

        .step {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
        }

        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #4A90E2;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          flex-shrink: 0;
        }

        .step-content h4 {
          margin: 0 0 8px 0;
          color: #333;
        }

        .step-content p {
          margin: 0 0 12px 0;
          color: #666;
          line-height: 1.5;
        }

        .create-btn {
          background: #4A90E2;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          font-size: 16px;
        }

        .creator-footer {
          padding: 20px;
          border-top: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .selected-url {
          font-size: 12px;
          color: #666;
          font-family: monospace;
        }

        .creator-actions {
          display: flex;
          gap: 12px;
        }

        .cancel-btn {
          padding: 12px 20px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        }

        .confirm-btn {
          padding: 12px 20px;
          background: #4A90E2;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        }

        .confirm-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default RPMAvatarCreator;
