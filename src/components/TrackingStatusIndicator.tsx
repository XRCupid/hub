import React from 'react';
import { TrackingConfiguration } from '../services/UnifiedTrackingCoordinator';

interface TrackingStatusIndicatorProps {
  configuration: TrackingConfiguration | null;
  isActive: boolean;
  insights?: any;
  onToggleDetails?: () => void;
}

const TrackingStatusIndicator: React.FC<TrackingStatusIndicatorProps> = ({
  configuration,
  isActive,
  insights,
  onToggleDetails
}) => {
  
  if (!configuration) {
    return null;
  }

  const getModelIcon = (modelType: string) => {
    switch (modelType) {
      case 'ml5-facemesh':
      case 'mediapipe-face':
        return '😊';
      case 'webgazer':
      case 'gazecloud':
        return '👁️';
      case 'mediapipe-pose':
        return '🧍';
      case 'mediapipe-hands':
        return '🤲';
      default:
        return '📊';
    }
  };

  const getModelStatus = (model: any) => {
    if (!model) return 'inactive';
    return isActive ? 'active' : 'ready';
  };

  const activeModels = Object.entries(configuration.models)
    .filter(([_, model]) => model !== null)
    .map(([type, model]) => ({ type, model: model! }));

  const processingLoad = activeModels.reduce((total, { model }) => total + (model.processingLoad || 0), 0);
  const getProcessingLevel = () => {
    if (processingLoad <= 10) return 'low';
    if (processingLoad <= 20) return 'medium';
    return 'high';
  };

  return (
    <div className="tracking-status-indicator">
      <div className="status-header">
        <div className="status-title">
          <span className={`status-dot ${isActive ? 'active' : 'ready'}`}></span>
          <span>Tracking Status</span>
        </div>
        <div className="processing-indicator">
          <span className={`processing-level ${getProcessingLevel()}`}>
            {getProcessingLevel().toUpperCase()}
          </span>
        </div>
      </div>

      <div className="active-models">
        {activeModels.map(({ type, model }) => (
          <div key={type} className="model-indicator">
            <span className="model-icon">{getModelIcon(model.type)}</span>
            <span className="model-name">{type.replace('-', ' ')}</span>
            <span className={`model-status ${getModelStatus(model)}`}></span>
          </div>
        ))}
      </div>

      <div className="configuration-details">
        <div className="detail-item">
          <span className="detail-label">Mode:</span>
          <span className="detail-value">{configuration.processingMode}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Update Rate:</span>
          <span className="detail-value">{configuration.updateFrequency}Hz</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Analytics:</span>
          <span className="detail-value">{configuration.analyticsDepth}</span>
        </div>
      </div>

      {insights && (
        <div className="insights-preview">
          <div className="insights-header">
            <span>📈 Live Insights</span>
            {onToggleDetails && (
              <button className="toggle-details" onClick={onToggleDetails}>
                Details
              </button>
            )}
          </div>
          <div className="insights-summary">
            {insights.performanceMetrics && (
              <div className="metric-summary">
                Processing: {insights.performanceMetrics.processingLoad.toFixed(1)}%
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .tracking-status-indicator {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          border-radius: 12px;
          padding: 16px;
          min-width: 250px;
          font-size: 14px;
          z-index: 100;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .status-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ccc;
        }

        .status-dot.active {
          background: #00ff00;
          box-shadow: 0 0 8px #00ff00;
          animation: pulse 2s infinite;
        }

        .status-dot.ready {
          background: #ffd700;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .processing-indicator {
          font-size: 12px;
          font-weight: bold;
        }

        .processing-level.low {
          color: #00ff00;
        }

        .processing-level.medium {
          color: #ffd700;
        }

        .processing-level.high {
          color: #ff6b6b;
        }

        .active-models {
          margin-bottom: 12px;
        }

        .model-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
        }

        .model-icon {
          font-size: 16px;
        }

        .model-name {
          flex: 1;
          text-transform: capitalize;
        }

        .model-status {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ccc;
        }

        .model-status.active {
          background: #00ff00;
          box-shadow: 0 0 4px #00ff00;
        }

        .model-status.ready {
          background: #ffd700;
        }

        .configuration-details {
          margin-bottom: 12px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 12px;
        }

        .detail-label {
          color: #ccc;
        }

        .detail-value {
          color: white;
          font-weight: 500;
        }

        .insights-preview {
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .insights-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .toggle-details {
          background: none;
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
        }

        .toggle-details:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .insights-summary {
          font-size: 11px;
          color: #ccc;
        }

        .metric-summary {
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
};

export default TrackingStatusIndicator;
