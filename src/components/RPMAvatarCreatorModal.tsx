import React, { useEffect, useRef, useState } from 'react';
import { rpmService } from '../services/readyPlayerMeService';

interface RPMAvatarCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAvatarCreated: (avatarUrl: string) => void;
  title?: string;
}

const RPMAvatarCreatorModal: React.FC<RPMAvatarCreatorModalProps> = ({
  isOpen,
  onClose,
  onAvatarCreated,
  title = "Create Your Avatar"
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Setup message listener for avatar creation
    const cleanup = rpmService.setupAvatarCreatorListener(
      (avatarUrl: string) => {
        console.log('Avatar created successfully:', avatarUrl);
        onAvatarCreated(avatarUrl);
        onClose();
      },
      (error: string) => {
        console.error('Avatar creation error:', error);
        setError(error);
      }
    );

    return cleanup;
  }, [isOpen, onAvatarCreated, onClose]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load avatar creator. Please check your RPM configuration.');
  };

  if (!isOpen) return null;

  const avatarCreatorUrl = rpmService.getAvatarCreatorUrl({
    bodyType: 'halfbody',
    quickStart: false,
    clearCache: true
  });

  return (
    <div className="rpm-modal-overlay">
      <div className="rpm-modal">
        <div className="rpm-modal-header">
          <h2>{title}</h2>
          <button className="rpm-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="rpm-modal-content">
          {isLoading && (
            <div className="rpm-loading">
              <div className="rpm-spinner"></div>
              <p>Loading avatar creator...</p>
            </div>
          )}
          
          {error && (
            <div className="rpm-error">
              <h3>Configuration Required</h3>
              <p>{error}</p>
              <div className="rpm-setup-instructions">
                <h4>Setup Instructions:</h4>
                <ol>
                  <li>Go to <a href="https://studio.readyplayer.me" target="_blank" rel="noopener noreferrer">studio.readyplayer.me</a></li>
                  <li>Create a free developer account</li>
                  <li>Create a new Application</li>
                  <li>Copy your subdomain and App ID</li>
                  <li>Update the configuration in <code>src/services/readyPlayerMeService.ts</code></li>
                </ol>
              </div>
            </div>
          )}
          
          <iframe
            ref={iframeRef}
            src={avatarCreatorUrl}
            className="rpm-iframe"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            allow="camera; microphone"
          />
        </div>
      </div>

      <style>{`
        .rpm-modal-overlay {
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

        .rpm-modal {
          background: white;
          border-radius: 12px;
          width: 90vw;
          height: 90vh;
          max-width: 800px;
          max-height: 600px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .rpm-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
          background: #f8f9fa;
        }

        .rpm-modal-header h2 {
          margin: 0;
          color: #333;
        }

        .rpm-close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rpm-close-btn:hover {
          color: #333;
        }

        .rpm-modal-content {
          flex: 1;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .rpm-iframe {
          width: 100%;
          height: 100%;
          border: none;
          flex: 1;
        }

        .rpm-loading {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: white;
          z-index: 10;
        }

        .rpm-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: rpm-spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes rpm-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .rpm-error {
          padding: 40px;
          text-align: center;
          color: #666;
        }

        .rpm-error h3 {
          color: #dc3545;
          margin-bottom: 16px;
        }

        .rpm-setup-instructions {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-top: 20px;
          text-align: left;
        }

        .rpm-setup-instructions h4 {
          margin-top: 0;
          color: #333;
        }

        .rpm-setup-instructions ol {
          margin: 16px 0;
          padding-left: 20px;
        }

        .rpm-setup-instructions li {
          margin-bottom: 8px;
        }

        .rpm-setup-instructions a {
          color: #007bff;
          text-decoration: none;
        }

        .rpm-setup-instructions a:hover {
          text-decoration: underline;
        }

        .rpm-setup-instructions code {
          background: #e9ecef;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Monaco', 'Consolas', monospace;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default RPMAvatarCreatorModal;
