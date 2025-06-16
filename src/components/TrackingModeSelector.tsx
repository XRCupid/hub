import React, { useState } from 'react';
import { TrackingMode, TRACKING_MODES } from '../services/UnifiedTrackingCoordinator';
import './TrackingModeSelector.css';

interface TrackingModeSelectorProps {
  currentMode?: TrackingMode;
  onModeSelect: (mode: TrackingMode) => void;
  onClose: () => void;
}

const TrackingModeSelector: React.FC<TrackingModeSelectorProps> = ({
  currentMode,
  onModeSelect,
  onClose
}) => {
  const [selectedMode, setSelectedMode] = useState<TrackingMode>(
    currentMode || TRACKING_MODES.casual
  );

  const handleModeChange = (mode: TrackingMode) => {
    setSelectedMode(mode);
  };

  const handleConfirm = () => {
    onModeSelect(selectedMode);
    onClose();
  };

  const getModeIcon = (modeId: string) => {
    switch (modeId) {
      case 'casual': return '💬';
      case 'eye-contact': return '👁️';
      case 'presence': return '🧍';
      case 'expression': return '🤲';
      default: return '📊';
    }
  };

  const getBatteryIcon = (impact: string) => {
    switch (impact) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="tracking-mode-selector-overlay">
      <div className="tracking-mode-selector">
        <div className="mode-selector-header">
          <h2>Choose Tracking Focus</h2>
          <p>Select what you want to work on (2 models max for performance)</p>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="mode-grid">
          {Object.values(TRACKING_MODES).map((mode) => (
            <div
              key={mode.id}
              className={`mode-card ${selectedMode.id === mode.id ? 'selected' : ''}`}
              onClick={() => handleModeChange(mode)}
            >
              <div className="mode-icon">{getModeIcon(mode.id)}</div>
              
              <div className="mode-info">
                <h3>{mode.displayName}</h3>
                <p className="mode-description">{mode.description}</p>
                
                <div className="mode-details">
                  <div className="detail-row">
                    <span className="detail-label">Focus:</span>
                    <span className="detail-value">{mode.focusArea}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Models:</span>
                    <span className="detail-value">
                      Emotions + {mode.secondary.replace('-', ' ')}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Battery:</span>
                    <span className="detail-value">
                      {getBatteryIcon(mode.batteryImpact)} {mode.batteryImpact}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">{mode.recommendedDuration} min</span>
                  </div>
                  
                  {mode.disables && (
                    <div className="detail-row">
                      <span className="detail-label">Disables:</span>
                      <span className="detail-value disabled-features">
                        {mode.disables.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedMode.id === mode.id && (
                <div className="selected-indicator">✓</div>
              )}
            </div>
          ))}
        </div>

        <div className="mode-selector-footer">
          <div className="performance-note">
            <strong>🎯 Smart Performance:</strong> Only 2 CV models run simultaneously for optimal performance.
            Facial emotions always active for Hume analytics.
          </div>
          
          <div className="action-buttons">
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="confirm-btn" onClick={handleConfirm}>
              Start {selectedMode.displayName}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingModeSelector;
