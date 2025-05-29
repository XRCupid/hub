import React, { useState } from 'react';
import { GeneratedProfile } from '../utils/avatarGenerator';
import { RPMAvatar } from './RPMAvatar';

interface ProfileGalleryProps {
  profiles: GeneratedProfile[];
  onProfileSelect: (profile: GeneratedProfile) => void;
  onStartChat: (profile: GeneratedProfile) => void;
  className?: string;
}

export const ProfileGallery: React.FC<ProfileGalleryProps> = ({
  profiles,
  onProfileSelect,
  onStartChat,
  className = ''
}) => {
  const [selectedProfile, setSelectedProfile] = useState<GeneratedProfile | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'cards'>('cards');

  const handleProfileClick = (profile: GeneratedProfile) => {
    setSelectedProfile(profile);
    onProfileSelect(profile);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#666';
    }
  };

  const getPersonalityEmoji = (personality: string) => {
    const emojiMap: Record<string, string> = {
      outgoing: '🎉',
      shy: '😊',
      intellectual: '🤓',
      artistic: '🎨',
      adventurous: '🏔️',
      romantic: '💕'
    };
    return emojiMap[personality] || '😄';
  };

  return (
    <div className={`profile-gallery ${className}`}>
      <div className="gallery-header">
        <div className="gallery-title">
          <h3>🎭 Generated Dating Profiles</h3>
          <p>{profiles.length} diverse profiles based on your preferences</p>
        </div>
        
        <div className="view-controls">
          <button 
            className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
          >
            📱 Cards
          </button>
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            🔲 Grid
          </button>
        </div>
      </div>

      <div className={`profiles-container ${viewMode}`}>
        {profiles.map((profile) => (
          <div 
            key={profile.id}
            className={`profile-card ${selectedProfile?.id === profile.id ? 'selected' : ''}`}
            onClick={() => handleProfileClick(profile)}
          >
            {/* Avatar Section */}
            <div className="profile-avatar">
              <div className="avatar-container">
                <RPMAvatar
                  avatarUrl={profile.avatar.avatarUrl || ''}
                  emotions={{}}
                  className="profile-avatar-3d"
                />
              </div>
              
              {/* Quick Stats Overlay */}
              <div className="avatar-overlay">
                <span className="age-badge">{profile.age}</span>
                <span 
                  className="difficulty-badge"
                  style={{ backgroundColor: getDifficultyColor(profile.difficulty) }}
                >
                  {profile.difficulty}
                </span>
              </div>
            </div>

            {/* Profile Info */}
            <div className="profile-info">
              <div className="profile-header">
                <h4 className="profile-name">
                  {profile.name}
                  <span className="personality-emoji">
                    {getPersonalityEmoji(profile.personalityType)}
                  </span>
                </h4>
                <p className="profile-pronouns">{profile.pronouns}</p>
              </div>

              <div className="profile-details">
                <div className="detail-row">
                  <span className="detail-label">Personality:</span>
                  <span className="detail-value">{profile.personalityType}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Style:</span>
                  <span className="detail-value">{profile.conversationStyle}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Background:</span>
                  <span className="detail-value">{profile.ethnicity}</span>
                </div>
              </div>

              <p className="profile-bio">{profile.bio}</p>

              {/* Interests */}
              <div className="profile-interests">
                {profile.interests.slice(0, 3).map((interest, index) => (
                  <span key={index} className="interest-tag">
                    {interest}
                  </span>
                ))}
                {profile.interests.length > 3 && (
                  <span className="interest-more">
                    +{profile.interests.length - 3} more
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="profile-actions">
                <button 
                  className="action-btn secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Show full profile details
                  }}
                >
                  👁️ View Details
                </button>
                <button 
                  className="action-btn primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartChat(profile);
                  }}
                >
                  💬 Start Chat
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {profiles.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🎭</div>
          <h4>No Profiles Generated Yet</h4>
          <p>Use the preferences panel above to generate diverse dating profiles</p>
        </div>
      )}

      <style>{`
        .profile-gallery {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .gallery-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding: 0 8px;
        }

        .gallery-title h3 {
          margin: 0 0 4px 0;
          color: #333;
          font-size: 24px;
        }

        .gallery-title p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .view-controls {
          display: flex;
          gap: 8px;
        }

        .view-btn {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .view-btn.active {
          background: #4A90E2;
          color: white;
          border-color: #4A90E2;
        }

        .view-btn:hover:not(.active) {
          background: #f0f7ff;
          border-color: #4A90E2;
        }

        .profiles-container {
          display: grid;
          gap: 20px;
        }

        .profiles-container.cards {
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        }

        .profiles-container.grid {
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        }

        .profile-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: all 0.3s;
          border: 2px solid transparent;
        }

        .profile-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .profile-card.selected {
          border-color: #4A90E2;
          box-shadow: 0 8px 24px rgba(74, 144, 226, 0.3);
        }

        .profile-avatar {
          position: relative;
          height: 200px;
          background: linear-gradient(135deg, #f0f7ff 0%, #e1f0ff 100%);
        }

        .avatar-container {
          width: 100%;
          height: 100%;
        }

        .profile-avatar-3d {
          border-radius: 0;
        }

        .avatar-overlay {
          position: absolute;
          top: 12px;
          right: 12px;
          display: flex;
          gap: 8px;
        }

        .age-badge, .difficulty-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }

        .age-badge {
          background: rgba(0, 0, 0, 0.6);
        }

        .difficulty-badge {
          text-transform: uppercase;
          font-size: 10px;
        }

        .profile-info {
          padding: 20px;
        }

        .profile-header {
          margin-bottom: 16px;
        }

        .profile-name {
          margin: 0 0 4px 0;
          color: #333;
          font-size: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .personality-emoji {
          font-size: 18px;
        }

        .profile-pronouns {
          margin: 0;
          color: #666;
          font-size: 12px;
          font-style: italic;
        }

        .profile-details {
          margin-bottom: 12px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .detail-label {
          color: #666;
          font-weight: 500;
        }

        .detail-value {
          color: #333;
          text-transform: capitalize;
        }

        .profile-bio {
          margin: 0 0 16px 0;
          color: #555;
          font-size: 14px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .profile-interests {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
        }

        .interest-tag {
          background: #f0f7ff;
          color: #4A90E2;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .interest-more {
          color: #666;
          font-size: 12px;
          font-style: italic;
        }

        .profile-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          flex: 1;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn.primary {
          background: #4A90E2;
          color: white;
        }

        .action-btn.primary:hover {
          background: #357ABD;
        }

        .action-btn.secondary {
          background: #f8f9fa;
          color: #333;
          border: 1px solid #ddd;
        }

        .action-btn.secondary:hover {
          background: #e9ecef;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state h4 {
          margin: 0 0 8px 0;
          color: #333;
        }

        .empty-state p {
          margin: 0;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .gallery-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .view-controls {
            justify-content: center;
          }

          .profiles-container.cards,
          .profiles-container.grid {
            grid-template-columns: 1fr;
          }

          .profile-info {
            padding: 16px;
          }

          .action-btn {
            font-size: 12px;
            padding: 8px 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfileGallery;
