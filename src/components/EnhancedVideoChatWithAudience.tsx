import React, { useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer';
import { database } from '../firebase';
import AudienceAnalyticsDashboard from './AudienceAnalyticsDashboard';
import './VideoChat.css';

interface Props {
  initialMode?: 'participant' | 'audience';
  roomId?: string;
}

const EnhancedVideoChatWithAudience: React.FC<Props> = ({ 
  initialMode = 'participant', 
  roomId: propRoomId 
}) => {
  // State management
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [roomId, setRoomId] = useState(propRoomId || '');
  const [isInRoom, setIsInRoom] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Not connected');
  const [currentUserName, setCurrentUserName] = useState('');
  const [participant1Name, setParticipant1Name] = useState('');
  const [participant2Name, setParticipant2Name] = useState('');
  const [mode, setMode] = useState<'participant' | 'audience'>(initialMode);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<any>(null);
  const roomRef = useRef<string | null>(null);
  const myPeerIdRef = useRef<string>(`peer_${Date.now()}`);
  const processedSignalsRef = useRef<Set<string>>(new Set());

  // Initialize user media
  useEffect(() => {
    initializeMedia();
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Auto-join if roomId is provided
  useEffect(() => {
    if (propRoomId && currentUserName) {
      setRoomId(propRoomId);
      joinRoom(propRoomId);
    }
  }, [propRoomId, currentUserName]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media:', error);
      setConnectionStatus('Media access denied');
    }
  };

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const cleanupRoom = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    if (roomRef.current) {
      // Clean up Firebase room data
      const roomPath = database.ref(`rooms/${roomRef.current}`);
      roomPath.remove();
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    setRemoteStream(null);
    setIsInRoom(false);
    setConnectionStatus('Not connected');
    roomRef.current = null;
  };

  const leaveRoom = () => {
    cleanupRoom();
    initializeMedia();
  };

  const joinRoom = async (roomToJoin: string) => {
    if (!localStream || !currentUserName.trim()) {
      alert('Please enter your name and ensure camera access');
      return;
    }

    try {
      roomRef.current = roomToJoin;
      setIsInRoom(true);
      setIsHost(false);

      // Check if room exists and get host info
      const roomInfoRef = database.ref(`rooms/${roomToJoin}/info`);
      roomInfoRef.on('value', (snapshot: any) => {
        const roomInfo = snapshot.val();
        if (roomInfo) {
          setParticipant1Name(roomInfo.hostName || 'Host');
        }
      });

      // Add ourselves to the room
      const guestInfoRef = database.ref(`rooms/${roomToJoin}/guest`);
      await guestInfoRef.set({
        name: currentUserName,
        peerId: myPeerIdRef.current,
        joinedAt: Date.now()
      });

      // Clear old signals to prevent processing stale data
      await database.ref(`rooms/${roomToJoin}/signals`).remove();
      processedSignalsRef.current.clear();

      setParticipant2Name(currentUserName);

      // Create peer connection as guest (not initiator)
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: localStream
      });

      peer.on('signal', (signal: any) => {
        console.log('📡 Sending signal:', signal);
        database.ref(`rooms/${roomToJoin}/signals`).push({
          signal: JSON.stringify(signal),
          from: myPeerIdRef.current,
          timestamp: Date.now()
        });
      });

      peer.on('stream', (stream: MediaStream) => {
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
        setConnectionStatus('Connected');
      });

      peer.on('error', (error: Error) => {
        console.error('Peer error:', error);
        setConnectionStatus('Connection failed');
      });

      // Listen for host signals
      const hostSignalsRef = database.ref(`rooms/${roomToJoin}/signals`);
      hostSignalsRef.on('child_added', (snapshot: any) => {
        const signalKey = snapshot.key;
        const rawData = snapshot.val();
        
        // Skip if we've already processed this signal
        if (processedSignalsRef.current.has(signalKey)) {
          return;
        }
        
        // Mark this signal as processed immediately to prevent race conditions
        processedSignalsRef.current.add(signalKey);
        
        console.log('📡 Received raw signal data:', rawData);
        
        // Handle Firebase push() structure - extract the actual signal data
        let signalData = rawData;
        
        // If it's a nested object with Firebase keys, extract the first value
        if (rawData && typeof rawData === 'object' && !rawData.signal) {
          const keys = Object.keys(rawData);
          if (keys.length > 0) {
            signalData = rawData[keys[0]];
            console.log('📡 Extracted nested signal data:', signalData);
          }
        }
        
        if (signalData && signalData.from !== myPeerIdRef.current && signalData.signal) {
          try {
            const signal = typeof signalData.signal === 'string' 
              ? JSON.parse(signalData.signal) 
              : signalData.signal;
            console.log('📡 Parsed signal for guest:', signal);
            
            // Only process if peer exists and signal is valid
            if (peer && signal && (signal.type === 'offer' || signal.type === 'answer' || signal.sdp || signal.candidate)) {
              peer.signal(signal);
              
              // Clean up old signals (remove this signal after processing)
              setTimeout(() => {
                database.ref(`rooms/${roomToJoin}/signals/${signalKey}`).remove();
              }, 1000);
            }
          } catch (error) {
            console.error('Guest error parsing signal:', error);
          }
        }
      });

      peerRef.current = peer;
      setConnectionStatus('Connecting...');

    } catch (error) {
      console.error('Error joining room:', error);
      setConnectionStatus('Failed to join');
    }
  };

  const createRoom = async () => {
    if (!localStream || !currentUserName.trim()) {
      alert('Please enter your name and ensure camera access');
      return;
    }

    const newRoomId = generateRoomId();
    roomRef.current = newRoomId;
    setRoomId(newRoomId);
    setIsInRoom(true);
    setIsHost(true);
    setParticipant1Name(currentUserName);

    // Set up room info in Firebase
    const roomInfoRef = database.ref(`rooms/${newRoomId}/info`);
    await roomInfoRef.set({
      hostName: currentUserName,
      hostPeerId: myPeerIdRef.current,
      createdAt: Date.now(),
      isActive: true
    });

    // Clear old signals to prevent processing stale data
    await database.ref(`rooms/${newRoomId}/signals`).remove();
    processedSignalsRef.current.clear();

    // Listen for guest joining
    const guestRef = database.ref(`rooms/${newRoomId}/guest`);
    guestRef.on('value', (snapshot: any) => {
      const guestData = snapshot.val();
      if (guestData && !peerRef.current) {
        console.log('Guest joined, creating peer connection');
        setParticipant2Name(guestData.name || 'Guest');

        // Create peer connection as host (initiator)
        const peer = new Peer({
          initiator: true,
          trickle: false,
          stream: localStream
        });

        peer.on('signal', (signal: any) => {
          console.log('📡 Sending signal:', signal);
          database.ref(`rooms/${newRoomId}/signals`).push({
            signal: JSON.stringify(signal),
            from: myPeerIdRef.current,
            timestamp: Date.now()
          });
        });

        peer.on('stream', (stream: MediaStream) => {
          setRemoteStream(stream);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
          setConnectionStatus('Connected');
        });

        peer.on('error', (error: Error) => {
          console.error('Peer error:', error);
          setConnectionStatus('Connection failed');
        });

        // Listen for guest signals
        const guestSignalsRef = database.ref(`rooms/${newRoomId}/signals`);
        guestSignalsRef.on('child_added', (snapshot: any) => {
          const signalKey = snapshot.key;
          const rawData = snapshot.val();
          
          // Skip if we've already processed this signal
          if (processedSignalsRef.current.has(signalKey)) {
            return;
          }
          
          // Mark this signal as processed immediately to prevent race conditions
          processedSignalsRef.current.add(signalKey);
          
          console.log('📡 Host received raw signal data:', rawData);
          
          // Handle Firebase push() structure - extract the actual signal data
          let signalData = rawData;
          
          // If it's a nested object with Firebase keys, extract the first value
          if (rawData && typeof rawData === 'object' && !rawData.signal) {
            const keys = Object.keys(rawData);
            if (keys.length > 0) {
              signalData = rawData[keys[0]];
              console.log('📡 Host extracted nested signal data:', signalData);
            }
          }
          
          if (signalData && signalData.from !== myPeerIdRef.current && signalData.signal) {
            try {
              const signal = typeof signalData.signal === 'string' 
                ? JSON.parse(signalData.signal) 
                : signalData.signal;
              console.log('📡 Host parsed signal:', signal);
              
              // Only process if peer exists and signal is valid
              if (peer && signal && (signal.type === 'offer' || signal.type === 'answer' || signal.sdp || signal.candidate)) {
                peer.signal(signal);
                
                // Clean up old signals (remove this signal after processing)
                setTimeout(() => {
                  database.ref(`rooms/${newRoomId}/signals/${signalKey}`).remove();
                }, 1000);
              }
            } catch (error) {
              console.error('Host error parsing signal:', error);
              console.log('📡 Host signal data that failed:', signalData);
            }
          }
        });

        peerRef.current = peer;
        setConnectionStatus('Connecting...');
      }
    });
  };

  // Render audience analytics dashboard
  if (mode === 'audience') {
    return (
      <AudienceAnalyticsDashboard
        participant1Stream={isHost ? localStream || null : remoteStream || null}
        participant2Stream={isHost ? remoteStream || null : localStream || null}
        participant1Name={isHost ? "Host" : "Guest"}
        participant2Name={isHost ? "Guest" : "Host"}
        roomId={roomRef.current || undefined}
      />
    );
  }

  // Render participant interface (clean, no analytics)
  return (
    <div className="video-chat-container">
      <div className="video-chat-header">
        <h2>Video Chat</h2>
        {roomRef.current && (
          <div className="room-info">
            <span>Room: {roomRef.current}</span>
            {connectionStatus === 'Connected' && <span className="connected-indicator">● Connected</span>}
          </div>
        )}
      </div>

      {connectionStatus !== 'Not connected' && connectionStatus !== 'Connected' && (
        <div className="error-message">
          {connectionStatus}
        </div>
      )}

      {!roomRef.current ? (
        // Room creation/joining interface
        <div className="room-setup">
          <div className="name-input">
            <input
              type="text"
              placeholder="Enter your name"
              value={currentUserName}
              onChange={(e) => setCurrentUserName(e.target.value)}
              className="user-name-input"
            />
          </div>

          <div className="room-actions">
            <div className="create-room">
              <button 
                onClick={createRoom}
                disabled={!currentUserName}
                className="create-room-btn"
              >
                Create Room
              </button>
            </div>

            <div className="join-room">
              <input
                type="text"
                placeholder="Enter room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="room-id-input"
              />
              <button 
                onClick={() => joinRoom(roomId)}
                disabled={!currentUserName || !roomId}
                className="join-room-btn"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Video chat interface
        <div className="video-chat-active">
          <div className="video-grid">
            <div className="video-container local-video">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="video-element"
              />
              <div className="video-label">
                {currentUserName} (You)
              </div>
            </div>

            <div className="video-container remote-video">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="video-element"
              />
              <div className="video-label">
                {isHost ? participant2Name : participant1Name}
              </div>
              {connectionStatus !== 'Connected' && (
                <div className="waiting-message">
                  Waiting for connection...
                </div>
              )}
            </div>
          </div>

          <div className="video-controls">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`control-btn ${isMuted ? 'muted' : ''}`}
            >
              {isMuted ? '🎤❌' : '🎤'}
            </button>
            
            <button 
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`control-btn ${isVideoOff ? 'muted' : ''}`}
            >
              {isVideoOff ? '📹❌' : '📹'}
            </button>
            
            <button 
              onClick={leaveRoom}
              className="control-btn leave-btn"
            >
              Leave
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedVideoChatWithAudience;
