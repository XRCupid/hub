import React, { useState, useRef, useEffect } from 'react';
import { database } from '../firebase';
import AudienceAnalyticsDashboard from './AudienceAnalyticsDashboard';
import QRCode from 'qrcode';
import './ConferenceSetup.css';

interface ConferenceSetupProps {
  mode: 'host-display' | 'mobile';
}

export const ConferenceSetup: React.FC<ConferenceSetupProps> = ({ mode }) => {
  const [roomId, setRoomId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [participantName, setParticipantName] = useState<string>('');
  const [hostName, setHostName] = useState<string>('Host');
  const [mobileName, setMobileName] = useState<string>('Mobile User');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showPresenceAvatars, setShowPresenceAvatars] = useState(true);
  const [qrCode, setQrCode] = useState<string>('');

  const localVideoRef = useRef<HTMLVideoElement>(null);

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Update video element when stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Check for room ID in URL params for mobile mode
  useEffect(() => {
    if (mode === 'mobile') {
      const urlParams = new URLSearchParams(window.location.search);
      const roomFromUrl = urlParams.get('room');
      if (roomFromUrl) {
        setRoomId(roomFromUrl);
      }
    }
  }, [mode]);

  const handleSetupRoom = async () => {
    try {
      const newRoomId = generateRoomId();
      setRoomId(newRoomId);
      
      // Create room in database
      if (database) {
        const roomRef = database.ref(`conference-rooms/${newRoomId}`);
        await roomRef.set({
          createdAt: new Date().toISOString(),
          hostName: participantName || 'Host',
          status: 'waiting'
        });
      }
      
      // Start local video
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setLocalStream(stream);
      
      // Generate QR code for mobile joining
      const mobileUrl = `${window.location.origin}/conference-mobile?room=${newRoomId}`;
      try {
        const qrDataUrl = await QRCode.toDataURL(mobileUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCode(qrDataUrl);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
      
      // Listen for mobile participant
      if (database) {
        const roomRef = database.ref(`conference-rooms/${newRoomId}`);
        roomRef.on('value', (snapshot: any) => {
          const data = snapshot.val();
          if (data?.mobileConnected) {
            setIsConnected(true);
            setMobileName(data.mobileName || 'Mobile User');
            // When mobile connects, switch to analytics view
            setShowAnalytics(true);
          }
        });
      }
    } catch (error) {
      console.error('Error setting up room:', error);
    }
  };

  const handleJoinRoom = async () => {
    try {
      // Start local video
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setLocalStream(stream);
      
      // Check if room exists
      if (database) {
        const roomRef = database.ref(`conference-rooms/${roomId}`);
        const snapshot = await new Promise<any>((resolve) => {
          roomRef.once('value', resolve);
        });
        
        if (!snapshot.exists()) {
          alert('Room not found. Please check the room code.');
          return;
        }
        
        // Get existing data and merge with new data
        const existingData = snapshot.val();
        await roomRef.set({
          ...existingData,
          mobileConnected: true,
          mobileName: participantName || 'Mobile User',
          status: 'connected'
        });
      }
      
      setIsConnected(true);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  return (
    <div className="conference-setup">
      <div className="setup-header">
        <h1>XRCupid Conference Booth</h1>
        <p className="mode-indicator">Mode: {mode === 'host-display' ? 'HOST + DISPLAY' : 'MOBILE PARTICIPANT'}</p>
      </div>

      {!showAnalytics ? (
        <div className="setup-form">
          {mode === 'host-display' ? (
            <div className="host-setup">
              <h2>Host Computer Setup</h2>
              <p className="setup-description">
                This computer will capture webcam video AND display the audience analytics
              </p>
              <input
                type="text"
                placeholder="Host participant name"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                className="name-input"
              />
              <button onClick={handleSetupRoom} className="setup-button">
                Create Room & Start Webcam
              </button>
              {roomId && !isConnected && (
                <div className="room-info">
                  <h3>Room Created!</h3>
                  <div className="room-code">{roomId}</div>
                  
                  {qrCode && (
                    <div className="qr-section">
                      <p className="qr-instruction">Scan with mobile device:</p>
                      <img src={qrCode} alt="QR Code" className="qr-code" />
                      <p className="mobile-scan-info">Or enter code: <strong>{roomId}</strong></p>
                    </div>
                  )}
                  
                  <p className="waiting-status">Waiting for mobile participant...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mobile-setup">
              <h2>Mobile Participant Setup</h2>
              <input
                type="text"
                placeholder="Your name"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                className="name-input"
              />
              <input
                type="text"
                placeholder="Enter Room Code"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="room-input"
                maxLength={6}
              />
              <button onClick={handleJoinRoom} className="setup-button">
                Join Room with Camera
              </button>
              {isConnected && (
                <div className="mobile-connected">
                  <h3>Connected to Room: {roomId}</h3>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="mobile-preview"
                  />
                  <p className="mobile-status">Your video is being shared with the audience display</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="analytics-view">
          <div className="analytics-header">
            <h2>Live Speed Dating Analytics</h2>
            <div className="room-badge">Room: {roomId}</div>
          </div>
          <AudienceAnalyticsDashboard
            participant1Stream={localStream || null}
            participant2Stream={remoteStream || null}
            participant1Name={hostName}
            participant2Name={mobileName}
            roomId={roomId}
            showPresenceAvatars={showPresenceAvatars}
            enableRealTimeCoaching={true}
          />
        </div>
      )}
    </div>
  );
};
