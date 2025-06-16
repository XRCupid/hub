// Eye Contact Indicator - Real-time feedback for eye contact engagement
import React from 'react';
import { EyeContactDetection } from '../types/tracking';
import './EyeContactIndicator.css';

interface EyeContactIndicatorProps {
  eyeContactData: EyeContactDetection;
  isVisible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

const EyeContactIndicator: React.FC<EyeContactIndicatorProps> = ({
  eyeContactData,
  isVisible = true,
  position = 'top-right'
}) => {
  if (!isVisible) return null;

  const {
    hasEyeContact,
    eyeContactDuration,
    eyeContactPercentage,
    contactQuality,
    totalContactTime
  } = eyeContactData;

  // Get status color based on eye contact quality
  const getStatusColor = () => {
    if (!hasEyeContact) return '#ff4444'; // Red for no contact
    switch (contactQuality) {
      case 'excellent': return '#00ff44'; // Green
      case 'good': return '#ffaa00'; // Orange
      case 'poor': return '#ff4444'; // Red
      default: return '#666666'; // Gray
    }
  };

  // Get eye contact icon based on status
  const getEyeContactIcon = () => {
    if (!hasEyeContact) return '👁️‍🗨️'; // Looking away
    switch (contactQuality) {
      case 'excellent': return '👁️✨'; // Excellent contact
      case 'good': return '👁️'; // Good contact
      case 'poor': return '👁️💫'; // Poor contact
      default: return '👁️';
    }
  };

  // Format duration for display
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className={`eye-contact-indicator ${position} ${hasEyeContact ? 'active' : 'inactive'}`}>
      {/* Main Status Circle */}
      <div 
        className="status-circle"
        style={{ 
          backgroundColor: getStatusColor(),
          boxShadow: hasEyeContact ? `0 0 20px ${getStatusColor()}50` : 'none'
        }}
      >
        <span className="status-icon">{getEyeContactIcon()}</span>
      </div>

      {/* Contact Information */}
      <div className="contact-info">
        <div className="contact-status">
          {hasEyeContact ? (
            <span className="status-text active">
              Eye Contact {contactQuality === 'excellent' ? '✨' : ''}
            </span>
          ) : (
            <span className="status-text inactive">Looking Away</span>
          )}
        </div>

        {/* Duration Counter */}
        {hasEyeContact && eyeContactDuration > 0 && (
          <div className="duration-counter">
            <span className="duration-text">
              {formatDuration(eyeContactDuration)}
            </span>
          </div>
        )}

        {/* Contact Statistics */}
        <div className="contact-stats">
          <div className="stat-item">
            <span className="stat-label">Contact:</span>
            <span className="stat-value">{Math.round(eyeContactPercentage)}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total:</span>
            <span className="stat-value">{formatDuration(totalContactTime)}</span>
          </div>
        </div>

        {/* Quality Indicator */}
        <div className="quality-indicator">
          <div className="quality-bar">
            <div 
              className="quality-fill"
              style={{ 
                width: `${eyeContactPercentage}%`,
                backgroundColor: getStatusColor()
              }}
            />
          </div>
          <span className="quality-text">{contactQuality}</span>
        </div>
      </div>

      {/* Pulse Animation for Active Contact */}
      {hasEyeContact && (
        <div className="pulse-ring" style={{ borderColor: getStatusColor() }} />
      )}
    </div>
  );
};

export default EyeContactIndicator;
