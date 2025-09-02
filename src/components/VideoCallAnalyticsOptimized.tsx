import React, { useState, useEffect, useRef, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import { AnalyticsEngine } from '../services/AnalyticsEngine';
import { ChemistryAnalyzer } from '../services/ChemistryAnalyzer';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';
import PerformanceDashboard from './PerformanceDashboard';
import ChemistryReportModalOptimized from './ChemistryReportModalOptimized';
import './VideoCallAnalytics.css';
import { HumeVoiceServiceWrapper } from '../services/HumeVoiceServiceWrapper';
import QRCode from 'qrcode';

interface TranscriptEntry {
  timestamp: number;
  speaker: string;
  text: string;
  emotions?: any[];
}

const VideoCallAnalyticsOptimized: React.FC = () => {
  // State management
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [partnerName, setPartnerName] = useState('Guest');
  const [isHost, setIsHost] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isCallActive, setIsCallActive] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [chemistryReport, setChemistryReport] = useState<any | null>(null);
  const [currentAnalytics, setCurrentAnalytics] = useState<any | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  // Performance monitoring
  const performanceMonitor = useRef<PerformanceMonitor>(new PerformanceMonitor()).current;
  const [showPerformance, setShowPerformance] = useState(true);
  const [performanceMini, setPerformanceMini] = useState(false);
  const analyzerRef = useRef<any | null>(null);
  const voiceServiceRef = useRef<HumeVoiceServiceWrapper | null>(null);
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const partnerVideoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<string>('');
  const analyticsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const signalListenerRef = useRef<(() => void) | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced ICE configuration with TURN servers
  const ICE_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // Add TURN servers for better connectivity
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ],
    iceCandidatePoolSize: 10
  };

  // Initialize media stream
  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setLocalStream(stream);
      
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
      }

      console.log('✅ Media initialized successfully');
      return stream;
    } catch (error) {
      console.error('❌ Media initialization failed:', error);
      throw error;
    }
  };

  // Create WebRTC peer connection
  const createPeer = (initiator: boolean, stream: MediaStream, roomId: string): any => {
    console.log(`🔗 Creating peer (initiator: ${initiator})`);
    
    const peer = new SimplePeer({
      initiator,
      trickle: true,
      stream,
      config: ICE_CONFIG,
      offerOptions: {
        offerToReceiveVideo: true,
        offerToReceiveAudio: true
      }
    });

    // Set up peer event handlers
    peer.on('signal', (signal: any) => {
      console.log('📡 Sending signal:', signal.type);
      const targetPath = initiator 
        ? `rooms/${roomId}/signals/host-to-guest`
        : `rooms/${roomId}/signals/guest-to-host`;
      
      // database.ref(targetPath).push({
      //   signal,
      //   timestamp: Date.now()
      // });
    });

    peer.on('connect', () => {
      console.log('✅ Peer connected');
      setConnectionStatus('connected');
      clearTimeout(connectionTimeoutRef.current!);
      
      // Start analytics after stable connection
      setTimeout(() => {
        if (isCallActive) {
          startAnalytics();
        }
      }, 2000);
    });

    peer.on('stream', (remoteStream: MediaStream) => {
      console.log('📹 Received remote stream');
      setRemoteStream(remoteStream);
      
      if (partnerVideoRef.current) {
        partnerVideoRef.current.srcObject = remoteStream;
      }
    });

    peer.on('error', (err: Error) => {
      console.error('❌ Peer error:', err);
      setConnectionStatus('error');
    });

    peer.on('close', () => {
      console.log('🔌 Peer connection closed');
      setConnectionStatus('disconnected');
    });

    return peer;
  };

  // Create room as host
  const createRoom = async () => {
    if (!userName || !localStream) {
      alert('Please enter your name and allow camera access');
      return;
    }

    const newRoomId = Math.random().toString(36).substring(2, 9);
    setRoomId(newRoomId);
    roomRef.current = newRoomId;
    setIsHost(true);
    setConnectionStatus('waiting');

    // Store room info in Firebase
    // await database.ref(`rooms/${newRoomId}`).set({
    //   host: userName,
    //   created: Date.now(),
    //   status: 'waiting'
    // });

    // Generate QR code
    const shareUrl = `${window.location.origin}?room=${newRoomId}`;
    const qrUrl = await QRCode.toDataURL(shareUrl);
    setQrCodeUrl(qrUrl);

    // Create peer as initiator
    const peer = createPeer(true, localStream, newRoomId);
    // peerRef.current = peer;

    // Listen for guest signals
    // const signalPath = `rooms/${newRoomId}/signals/guest-to-host`;
    // const listener = database.ref(signalPath).on('child_added', (snapshot) => {
    //   const data = snapshot.val();
    //   if (data && data.signal && peer.destroyed === false) {
    //     console.log('📨 Received guest signal');
    //     peer.signal(data.signal);
    //   }
    // });

    // signalListenerRef.current = () => database.ref(signalPath).off('child_added', listener);

    console.log(`🏠 Room created: ${newRoomId}`);
  };

  // Join room as guest
  const joinRoom = async () => {
    if (!userName || !roomId || !localStream) {
      alert('Please enter your name, room ID, and allow camera access');
      return;
    }

    roomRef.current = roomId;
    setIsHost(false);
    setConnectionStatus('connecting');

    // Check if room exists
    // const roomSnapshot = await database.ref(`rooms/${roomId}`).once('value');
    // if (!roomSnapshot.exists()) {
    //   alert('Room not found');
    //   setConnectionStatus('disconnected');
    //   return;
    // }

    // const roomData = roomSnapshot.val();
    // setPartnerName(roomData.host || 'Host');

    // Update room status
    // await database.ref(`rooms/${roomId}`).update({
    //   guest: userName,
    //   status: 'connected'
    // });

    // Create peer as non-initiator
    const peer = createPeer(false, localStream, roomId);
    // peerRef.current = peer;

    // Listen for host signals
    // const signalPath = `rooms/${roomId}/signals/host-to-guest`;
    // const listener = database.ref(signalPath).on('child_added', (snapshot) => {
    //   const data = snapshot.val();
    //   if (data && data.signal && peer.destroyed === false) {
    //     console.log('📨 Received host signal');
    //     peer.signal(data.signal);
    //   }
    // });

    // signalListenerRef.current = () => database.ref(signalPath).off('child_added', listener);

    // Set connection timeout
    connectionTimeoutRef.current = setTimeout(() => {
      if (connectionStatus !== 'connected') {
        console.error('❌ Connection timeout');
        setConnectionStatus('timeout');
        cleanupConnection();
      }
    }, 30000);

    console.log(`👋 Joining room: ${roomId}`);
  };

  // Start analytics collection
  const startAnalytics = async () => {
    if (!analyzerRef.current) {
      const { default: OptimizedVideoAnalyzer } = await import('../services/OptimizedVideoAnalyzer');
      analyzerRef.current = new OptimizedVideoAnalyzer();
      await analyzerRef.current.initialize();
    }

    // Start analyzing frames at 1 FPS
    if (analyticsIntervalRef.current) {
      clearInterval(analyticsIntervalRef.current);
    }

    analyticsIntervalRef.current = setInterval(async () => {
      if (userVideoRef.current && analyzerRef.current) {
        const snapshot = await analyzerRef.current.analyzeFrame(userVideoRef.current);
        if (snapshot) {
          setCurrentAnalytics(snapshot);
        }
      }
    }, 1000);

    // Initialize voice service
    try {
      const apiKey = process.env.REACT_APP_HUME_API_KEY || process.env.REACT_APP_HUME_DEV_API_KEY;
      if (apiKey && !voiceServiceRef.current) {
        voiceServiceRef.current = new HumeVoiceServiceWrapper();
        await voiceServiceRef.current.connect();
        
        voiceServiceRef.current.onTranscript((transcript) => {
          if (transcript?.text) {
            setTranscript(prev => [...prev, {
              timestamp: Date.now(),
              speaker: userName || 'You',
              text: transcript.text,
              emotions: transcript.emotions
            }]);
          }
        });

        console.log('🎙️ Voice service connected');
      }
    } catch (error) {
      console.error('Voice service error:', error);
    }

    setIsCallActive(true);
    console.log('📊 Analytics started');
  };

  // Stop analytics
  const stopAnalytics = () => {
    if (analyticsIntervalRef.current) {
      clearInterval(analyticsIntervalRef.current);
      analyticsIntervalRef.current = null;
    }

    if (voiceServiceRef.current) {
      voiceServiceRef.current.disconnect();
      voiceServiceRef.current = null;
    }

    setIsCallActive(false);
    console.log('📊 Analytics stopped');
  };

  // End call and generate report
  const endCall = async () => {
    stopAnalytics();
    
    // Generate chemistry report
    if (analyzerRef.current) {
      const report = await analyzerRef.current.generateReport();
      setChemistryReport(report);
      setShowReport(true);
    }

    cleanupConnection();
    console.log('📞 Call ended');
  };

  // Cleanup connection
  const cleanupConnection = () => {
    // if (peerRef.current) {
    //   peerRef.current.destroy();
    //   peerRef.current = null;
    // }

    if (signalListenerRef.current) {
      // signalListenerRef.current();
      signalListenerRef.current = null;
    }

    if (roomRef.current) {
      // database.ref(`rooms/${roomRef.current}`).remove();
    }

    setRemoteStream(null);
    setConnectionStatus('disconnected');
  };

  // Toggle audio/video
  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoMuted(!isVideoMuted);
    }
  };

  // Initialize on mount
  useEffect(() => {
    initializeMedia();

    return () => {
      // Cleanup on unmount
      stopAnalytics();
      cleanupConnection();
      
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }

      if (analyzerRef.current) {
        analyzerRef.current.dispose();
      }
    };
  }, []);

  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-call-analytics">
      {/* Setup Panel */}
      {connectionStatus === 'disconnected' && (
        <div className="setup-panel">
          <h2>EasyTiger Video Call Demo</h2>
          
          <div className="setup-form">
            <input
              type="text"
              placeholder="Your Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="name-input"
            />

            <div className="room-options">
              <div className="create-room">
                <button onClick={createRoom} className="primary-btn">
                  Create New Room
                </button>
              </div>

              <div className="divider">OR</div>

              <div className="join-room">
                <input
                  type="text"
                  placeholder="Room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="room-input"
                />
                <button onClick={joinRoom} className="secondary-btn">
                  Join Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Waiting Room */}
      {connectionStatus === 'waiting' && (
        <div className="waiting-room">
          <h3>Waiting for guest to join...</h3>
          <p>Room ID: <strong>{roomId}</strong></p>
          {qrCodeUrl && (
            <div className="qr-code">
              <img src={qrCodeUrl} alt="Room QR Code" />
              <p>Scan to join</p>
            </div>
          )}
        </div>
      )}

      {/* Video Call UI */}
      {(connectionStatus === 'connected' || connectionStatus === 'connecting') && (
        <div className="video-call-container">
          <div className="videos-grid">
            <div className="video-wrapper">
              <video
                ref={userVideoRef}
                autoPlay
                playsInline
                muted
                className="video-element"
              />
              <div className="video-label">{userName} (You)</div>
            </div>

            <div className="video-wrapper">
              <video
                ref={partnerVideoRef}
                autoPlay
                playsInline
                className="video-element"
              />
              <div className="video-label">{partnerName}</div>
            </div>
          </div>

          {/* Analytics Panel */}
          {isCallActive && currentAnalytics && (
            <div className="analytics-panel">
              <h3>Live Analytics</h3>
              <div className="metrics">
                <div className="metric">
                  <span className="label">Eye Contact</span>
                  <span className="value">{currentAnalytics.eyeContact}%</span>
                </div>
                <div className="metric">
                  <span className="label">Posture</span>
                  <span className="value">{currentAnalytics.posture}/100</span>
                </div>
                <div className="metric">
                  <span className="label">Emotion</span>
                  <span className="value">{currentAnalytics.emotion}</span>
                </div>
                <div className="metric">
                  <span className="label">Engagement</span>
                  <span className="value">{currentAnalytics.engagement}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Call Controls */}
          <div className="call-controls">
            <button 
              onClick={toggleAudio}
              className={`control-btn ${isAudioMuted ? 'muted' : ''}`}
            >
              {isAudioMuted ? '🔇' : '🔊'}
            </button>
            
            <button 
              onClick={toggleVideo}
              className={`control-btn ${isVideoMuted ? 'muted' : ''}`}
            >
              {isVideoMuted ? '📵' : '📹'}
            </button>

            {!isCallActive && (
              <button onClick={startAnalytics} className="start-btn">
                Start Analytics
              </button>
            )}

            <button onClick={endCall} className="end-btn">
              End Call
            </button>
          </div>
        </div>
      )}

      {/* Chemistry Report Modal */}
      {showReport && chemistryReport && (
        <ChemistryReportModalOptimized
          report={chemistryReport}
          userName={userName}
          partnerName={partnerName}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
};

export default VideoCallAnalyticsOptimized;
