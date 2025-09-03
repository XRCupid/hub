import React, { useState, useRef, useEffect, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import QRCode from 'react-qr-code';
import { database } from '../firebase';
import { conferenceFirebaseService } from '../services/conferenceFirebaseService';
import VideoCallAnalyzer from '../services/VideoCallAnalyzer';
import { ref, set, onValue, get } from 'firebase/database';
import { ChemistryReportModal } from './ChemistryReportModal';
import './VideoCallAnalytics.css';

// 🔑 Local project types
import type {
  VideoCallAnalyticsProps,
  AnalyticsSnapshot,
  EmotionScore,
  PostureScore,
  TranscriptEntry,
  PerformanceMetrics,
  Recommendation,
  CallReport
} from '../types/VideoCallTypes';

// Tracking state for analytics
interface TrackingData {
  eyeContact: boolean;
  pose: any;
  emotions: {
    happy: number;
    sad: number;
    angry: number;
    surprised: number;
    neutral: number;
    excited: number;
  };
  speechRate: number;
  pitch: number;
  volume: number;
}

/* -------------------------------------------------- */
// 🎨 Emotion‑to‑color map
const EMOTION_COLORS: { [key: string]: string } = {
  happy: '#ffd700',
  neutral: '#808080',
  sad: '#4169e1',
  angry: '#ff4500',
  surprised: '#ff69b4',
  fear: '#9400d3',
  disgust: '#228b22',
  focused: '#4169e1',
  excited: '#ff69b4'
};

// Icons - using emoji as fallback
const Eye = () => <span>👁️</span>;
const Users = () => <span>👥</span>;
const Mic = () => <span>🎤</span>;
const Camera = () => <span>📷</span>;
const PhoneOff = () => <span>📵</span>;
const Heart = () => <span>❤️</span>;

export const VideoCallAnalytics: React.FC<VideoCallAnalyticsProps> = ({ partnerName = 'Partner' }) => {
  /* -------------------------- STATE & REFS -------------------------- */
  const firebaseService = ConferenceFirebaseService;
  const usingRealFirebase = true;

  // Streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Room/session
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [isInRoom, setIsInRoom] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'Not connected' | 'Connecting' | 'Connected' | 'Connection error'>('Not connected');
  const [userName, setCurrentUserName] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Tracking states
  const [isTracking, setIsTracking] = useState(false);
  const [trackingData, setTrackingData] = useState({
    eyeContact: 75,
    posture: 85,
    emotion: 'neutral',
    emotionScores: {
      happy: 20,
      neutral: 60,
      focused: 15,
      excited: 5
    },
    speechRate: 120,
    pitch: 200,
    volume: 60
  });
  const [trackingHistory, setTrackingHistory] = useState<any[]>([]);

  // Analytics
  const [isCallActive, setIsCallActive] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [chemistryReport, setChemistryReport] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);

  // UI toggles
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  // Refs
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const partnerVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<any>(null);
  const analyticsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const analyzerRef = useRef<VideoCallAnalyzer | null>(null);
  const mockDataGeneratorRef = useRef<NodeJS.Timeout | null>(null);
  const voiceServiceRef = useRef<any>(null);
  const roomRef = useRef<string>('');

  /* ----------------------- INIT MEDIA -------------------------- */
  const initializeMedia = async (): Promise<boolean> => {
    console.log('📹 Initializing media devices...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: true 
      });
      
      console.log('✅ Got media stream:', stream);
      console.log('📹 Video tracks:', stream.getVideoTracks());
      console.log('🎤 Audio tracks:', stream.getAudioTracks());
      
      setLocalStream(stream);
      localStreamRef.current = stream;
      
      if (userVideoRef.current) {
        console.log('📹 Setting video srcObject...');
        userVideoRef.current.srcObject = stream;
        console.log('📹 Video element:', userVideoRef.current);
        console.log('📹 Video readyState:', userVideoRef.current.readyState);
      } else {
        console.warn('⚠️ userVideoRef.current is null');
      }
      
      // Start mock tracking
      setIsTracking(true);
      startMockTracking();
      
      return true;
    } catch (err) {
      console.error('❌ Error accessing media devices:', err);
      if (err instanceof Error) {
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
      }
      setErrorMessage('Camera access denied. Please allow camera permissions to use this feature.');
      return false;
    }
  };

  // Mock tracking data generator
  const startMockTracking = () => {
    const interval = setInterval(() => {
      const time = Date.now() / 1000;
      const emotions = ['happy', 'neutral', 'focused', 'excited'];
      const currentEmotion = emotions[Math.floor(time / 5) % emotions.length];
      
      const newData = {
        eyeContact: 70 + Math.sin(time) * 30,
        posture: 80 + Math.sin(time * 0.7) * 20,
        emotion: currentEmotion,
        emotionScores: {
          happy: currentEmotion === 'happy' ? 70 + Math.random() * 20 : Math.random() * 30,
          neutral: currentEmotion === 'neutral' ? 70 + Math.random() * 20 : Math.random() * 30,
          focused: currentEmotion === 'focused' ? 70 + Math.random() * 20 : Math.random() * 30,
          excited: currentEmotion === 'excited' ? 70 + Math.random() * 20 : Math.random() * 30
        },
        speechRate: 100 + Math.sin(time * 1.2) * 50,
        pitch: 180 + Math.sin(time * 0.8) * 40,
        volume: 50 + Math.sin(time * 1.5) * 30
      };
      
      setTrackingData(newData);
      setTrackingHistory(prev => [...prev.slice(-30), newData]);
    }, 1000);
    
    return () => clearInterval(interval);
  };

  // Initialize camera on mount
  useEffect(() => {
    console.log('🚀 Component mounted, initializing camera...');
    initializeMedia();
    
    // Force camera initialization after a short delay if it fails
    setTimeout(() => {
      if (!localStream) {
        console.log('⚠️ Camera not initialized after 3s, retrying...');
        initializeMedia();
      }
    }, 3000);
  }, []);

  // Attach stream to video element when localStream changes
  useEffect(() => {
    if (localStream && userVideoRef.current) {
      console.log('📹 Attaching local stream to video element');
      userVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  /* ----------------------- URL PARSING -------------------------- */
  useEffect(() => {
    const urlHash = window.location.hash;
    console.log('🔍 [URL] Current hash:', urlHash);
    const roomMatch = urlHash.match(/[?&]room=([^&]+)/);
    if (roomMatch) {
      const roomFromUrl = roomMatch[1];
      console.log('✅ [URL] Found room in URL:', roomFromUrl);
      setJoinRoomId(roomFromUrl);
      setCurrentUserName('Guest');
      setTimeout(() => {
        joinRoom();
      }, 1000);
    }
  }, []);

  /* --------------------------- ROOM LOGIC --------------------------- */
  const setupGuestListener = (roomId: string) => {
    // Using Firebase directly
    onValue(ref(database as any, `conference-rooms/${roomId}/guest`), (snap: any) => {
      const guest = snap.val();
      console.log('👥 [GUEST LISTENER] Guest data received:', guest);
      if (guest?.name && !peerRef.current) {
        setGuestName(guest.name);
        setConnectionStatus('Connecting');
        setShowQrCode(false);
        createPeer(true, 'host-peer');
      }
    });
  };

  const createRoom = async () => {
    const currentUserName = userName.trim() || 'User';
    if (!localStream && !(await initializeMedia())) return;

    const newRoomId = await firebaseService.createRoom(currentUserName);
    if (!newRoomId) {
      setErrorMessage('Failed to create room');
      return;
    }
    setRoomId(newRoomId);
    roomRef.current = newRoomId;
    setIsHost(true);
    setIsInRoom(true);

    // QR‑code for guest join
    const mobileUrl = `${window.location.origin}/hub/#/video-analytics?room=${newRoomId}`;
    setQrCodeUrl(mobileUrl); // react-qr-code uses the URL directly, not a data URL
    setShowQrCode(true);
    setupGuestListener(newRoomId);
  };

  const joinRoom = async () => {
    if (!joinRoomId || !userName) return;
    if (!(await initializeMedia())) return;
    
    await set(ref(database as any, `conference-rooms/${joinRoomId}/guest`), { name: userName, joinedAt: Date.now() });
    setRoomId(joinRoomId);
    roomRef.current = joinRoomId;
    setIsInRoom(true);
    setIsHost(false);
    setCurrentUserName(userName);
    setConnectionStatus('Connecting');
    createPeer(false, 'guest-peer');
  };

  /* --------------------------- WEBRTC ------------------------------- */
  const createPeer = (initiator: boolean, peerId: string) => {
    if (!localStream) return;
    
    console.log('🎯 [PEER] Creating peer:', { initiator, peerId, roomId });
    const peer = new SimplePeer({
      initiator,
      stream: localStream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on('stream', (stream: MediaStream) => {
      console.log('✅ [PEER] Received remote stream');
      setRemoteStream(stream);
      if (partnerVideoRef.current) {
        partnerVideoRef.current.srcObject = stream;
      }
      setConnectionStatus('Connected');
    });

    peer.on('signal', (data: any) => {
      console.log('📡 [PEER] Sending signal:', data);
      const signalPath = `conference-rooms/${roomId}/signals/${peerId}/${isHost ? 'host' : 'guest'}`;
      set(ref(database as any, signalPath), { signal: data, ts: Date.now() });
    });

    peer.on('error', (err: Error) => {
      console.error('❌ [PEER] Error:', err);
      setConnectionStatus('Connection error');
    });

    peer.on('connect', () => {
      console.log('✅ [PEER] Connected!');
      setConnectionStatus('Connected');
    });

    peer.on('close', () => {
      console.log('❌ [PEER] Connection closed');
      setConnectionStatus('Not connected');
    });

    // Listen for remote signals
    const setupPeerListeners = () => {
      console.log('🎧 [PEER] Setting up signal listeners');
      const signalPath = `conference-rooms/${roomId}/signals/${peerId}/${isHost ? 'guest' : 'host'}`;
      const signalRef = ref(database as any, signalPath);
      
      return onValue(signalRef, (snapshot: any) => {
        if (snapshot.exists() && peer) {
          const { signal } = snapshot.val();
          console.log('📥 [PEER] Received signal:', signal);
          try {
            peer.signal(signal);
          } catch (err: any) {
            console.error('❌ [PEER] Error signaling:', err);
          }
        }
      });
    };

    setupPeerListeners();

    if (peer._pc) {
      peer._pc.addEventListener('iceconnectionstatechange', () => {
        const state = peer._pc.iceConnectionState;
        console.log(`🧊 [ICE] Connection state: ${state}`);
        
        // Map ICE states to our connection status
        if (state === 'connected' || state === 'completed') {
          setConnectionStatus('Connected');
        } else if (state === 'failed' || state === 'disconnected') {
          setConnectionStatus('Connection error');
        } else if (state === 'checking' || state === 'new') {
          setConnectionStatus('Connecting');
        }
        
        if (state === 'failed') {
          console.error('❌ [ICE] Connection failed - likely needs TURN server');
        }
      });
      
      peer._pc.addEventListener('icegatheringstatechange', () => {
        console.log(`🧊 [ICE] Gathering state: ${peer._pc.iceGatheringState}`);
      });
      
      peer._pc.addEventListener('icecandidate', (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
          console.log('🧊 [ICE] New candidate:', event.candidate.type, event.candidate.protocol);
        } else {
          console.log('🧊 [ICE] Gathering complete');
        }
      });
    }

    peerRef.current = peer;
  };

  /* ----------------------------- CONTROLS --------------------------- */
  const toggleMute = () => {
    const track = localStream?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    }
  };

  const toggleVideo = () => {
    const track = localStream?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsVideoEnabled(track.enabled);
    }
  };

  const leaveRoom = () => {
    peerRef.current?.destroy();
    localStream?.getTracks().forEach(t => t.stop());
    setIsInRoom(false);
    setConnectionStatus('Not connected');
    setRoomId('');
    setIsHost(false);
    setGuestName('');
    setShowQrCode(false);
    roomRef.current = '';
    endCall();
  };

  /* ----------------------- ANALYTICS SNAPSHOTS ---------------------- */
  const generateMockEmotions = (): EmotionScore[] => {
    const emotions = ['joy', 'neutral', 'interest', 'excitement', 'contentment'];
    const selected = emotions[Math.floor(Math.random() * emotions.length)];
    return [{ name: selected, score: 0.5 + Math.random() * 0.5 }];
  };

  const generateMockPosture = (): PostureScore => ({
    overall: 0.6 + Math.random() * 0.4,
    openness: 0.5 + Math.random() * 0.5,
    leaning: Math.random() > 0.5 ? 'forward' : 'neutral',
    mirroring: Math.random() > 0.7
  });

  const collectAnalyticsSnapshot = useCallback(() => {
    if (!analyzerRef.current) return;

    // Generate mock analytics data for demo
    const snapshot: AnalyticsSnapshot = {
      timestamp: Date.now(),
      userEmotions: generateMockEmotions(),
      partnerEmotions: generateMockEmotions(),
      userPosture: generateMockPosture(),
      partnerPosture: generateMockPosture(),
      userEyeContact: Math.random() > 0.3,
      partnerEyeContact: Math.random() > 0.3,
      userSpeaking: Math.random() > 0.6,
      partnerSpeaking: Math.random() > 0.6,
      userVolume: Math.random(),
      partnerVolume: Math.random()
    };

    analyzerRef.current.addAnalyticsSnapshot(snapshot);
    setAnalyticsData(prev => [...prev, snapshot]);
    
    // Add mock transcript entries occasionally
    if (Math.random() > 0.95) {
      const entry: TranscriptEntry = {
        timestamp: Date.now(),
        speaker: Math.random() > 0.5 ? 'user' : 'partner',
        text: 'This is a mock transcript entry for testing.',
        emotion: generateMockEmotions()[0]
      };
      analyzerRef.current.addTranscriptEntry(entry);
    }
  }, []);

  /* ----------------------------- CALL ------------------------------- */
  const startCall = async () => {
    setIsCallActive(true);
    
    // Initialize analyzer
    analyzerRef.current = new VideoCallAnalyzer();
    analyzerRef.current.startCall();
    
    // Start collecting analytics
    analyticsIntervalRef.current = setInterval(collectAnalyticsSnapshot, 200);
    
    // Initialize voice service
    try {
      const { HumeVoiceServiceWrapper } = await import('../services/HumeVoiceServiceWrapper');
      voiceServiceRef.current = new HumeVoiceServiceWrapper();
      await voiceServiceRef.current.connect();
      
      // Set up voice service callbacks
      voiceServiceRef.current.onEmotion((emotions: any) => {
        console.log('Voice emotions:', emotions);
      });
      
      voiceServiceRef.current.onTranscript((transcript: any) => {
        console.log('Voice transcript:', transcript);
        if (analyzerRef.current && transcript.text) {
          analyzerRef.current.addTranscriptEntry({
            timestamp: Date.now(),
            speaker: transcript.role === 'user' ? 'user' : 'partner',
            text: transcript.text,
            emotion: transcript.prosody || { name: 'neutral', score: 0.5 }
          });
        }
      });
    } catch (error) {
      console.error('Failed to initialize voice service:', error);
    }
  };

  const endCall = async () => {
    setIsCallActive(false);
    
    // Stop analytics collection
    if (analyticsIntervalRef.current) {
      clearInterval(analyticsIntervalRef.current);
      analyticsIntervalRef.current = null;
    }
    
    // Stop mock data generator if running
    if (mockDataGeneratorRef.current) {
      clearInterval(mockDataGeneratorRef.current);
      mockDataGeneratorRef.current = null;
    }
    
    // Disconnect voice service
    if (voiceServiceRef.current) {
      await voiceServiceRef.current.disconnect();
      voiceServiceRef.current = null;
    }
    
    // Generate chemistry report
    if (analyzerRef.current) {
      try {
        const report = await analyzerRef.current.generateReport();
        console.log('Chemistry Report Generated:', report);
        setChemistryReport(report);
        setShowReport(true);
      } catch (error) {
        console.error('Failed to generate report:', error);
      }
    }
  };

  /* ----------------------------- RENDER ----------------------------- */
  return (
    <div className="video-call-analytics">
      <h1 style={{ textAlign: 'center', margin: '20px 0' }}>Video Call Analytics</h1>
      
      {/* DEBUG: Simple Camera Test */}
      {!isInRoom && (
        <div style={{ 
          position: 'fixed', 
          top: '10px', 
          right: '10px', 
          background: 'white', 
          padding: '10px', 
          border: '2px solid red',
          zIndex: 9999
        }}>
          <h3>Camera Test</h3>
          <video 
            ref={userVideoRef}
            autoPlay 
            playsInline 
            muted 
            style={{ 
              width: '200px', 
              height: '150px', 
              background: 'black',
              border: '1px solid blue'
            }} 
          />
          <div>
            <p>Stream exists: {localStream ? 'YES' : 'NO'}</p>
            <p>Stream active: {localStream?.active ? 'YES' : 'NO'}</p>
            <p>Tracks: {localStream?.getTracks().length || 0}</p>
            <button onClick={initializeMedia}>Init Camera</button>
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div style={{ backgroundColor: '#ffcccc', color: '#cc0000', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
          {errorMessage}
        </div>
      )}
      
      {/* Debug info */}
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
        Debug: isInRoom={isInRoom.toString()}, hasLocalStream={!!localStream}, roomId={roomId || 'none'}, 
        localStreamActive={localStream ? localStream.active : 'null'}
      </div>

      {/* Camera Preview and Tracking Visualization */}
      {!isInRoom && (
        <section style={{ marginTop: '40px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Camera Preview</h2>
          {!localStream ? (
            <div style={{ backgroundColor: '#f0f0f0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <p>Initializing camera... Please allow camera permissions when prompted.</p>
              <button 
                onClick={() => initializeMedia()}
                style={{
                  marginTop: '10px',
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Enable Camera
              </button>
              {errorMessage && (
                <p style={{ color: 'red', marginTop: '10px' }}>{errorMessage}</p>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
              {/* Camera Feed */}
              <div style={{ flex: '0 0 400px' }}>
                <video
                  ref={userVideoRef}
                  muted
                  autoPlay
                  playsInline
                  onLoadedMetadata={(e) => {
                    const video = e.target as HTMLVideoElement;
                    console.log('📹 Video metadata loaded, attempting to play...');
                    video.play().catch(err => console.error('Error playing video:', err));
                  }}
                  style={{
                    width: '100%',
                    height: '300px',
                    backgroundColor: '#000',
                    borderRadius: '8px',
                    objectFit: 'cover'
                  }}
                />
              </div>

              {/* Live Analytics Preview */}
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '20px', marginBottom: '15px' }}>Live Analytics Preview 🎯</h3>
                
                {/* Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                  {/* Eye Contact */}
                  <div style={{ backgroundColor: '#f0f8ff', padding: '15px', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>Eye Contact 👁️</h4>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: trackingData.eyeContact > 70 ? '#28a745' : '#ff9800' }}>
                      {Math.round(trackingData.eyeContact)}%
                    </div>
                    <div style={{ marginTop: '10px', height: '4px', backgroundColor: '#e0e0e0', borderRadius: '2px' }}>
                      <div style={{
                        width: `${trackingData.eyeContact}%`,
                        height: '100%',
                        backgroundColor: trackingData.eyeContact > 70 ? '#28a745' : '#ff9800',
                        borderRadius: '2px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>

                  {/* Posture */}
                  <div style={{ backgroundColor: '#f0fff0', padding: '15px', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>Posture 🧘</h4>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: trackingData.posture > 80 ? '#28a745' : '#ff9800' }}>
                      {Math.round(trackingData.posture)}%
                    </div>
                    <div style={{ marginTop: '10px', height: '4px', backgroundColor: '#e0e0e0', borderRadius: '2px' }}>
                      <div style={{
                        width: `${trackingData.posture}%`,
                        height: '100%',
                        backgroundColor: trackingData.posture > 80 ? '#28a745' : '#ff9800',
                        borderRadius: '2px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                </div>

                {/* Emotion Display */}
                <div style={{ backgroundColor: '#fff8dc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>Current Emotion 😊</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                      fontSize: '32px',
                      fontWeight: 'bold',
                      color: EMOTION_COLORS[trackingData.emotion] || '#666',
                      textTransform: 'capitalize'
                    }}>
                      {trackingData.emotion}
                    </div>
                    <div style={{ flex: 1 }}>
                      {Object.entries(trackingData.emotionScores).map(([emotion, score]) => (
                        <div key={emotion} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                          <span style={{ width: '60px', fontSize: '12px', textTransform: 'capitalize' }}>{emotion}</span>
                          <div style={{ flex: 1, height: '8px', backgroundColor: '#e0e0e0', borderRadius: '4px', marginLeft: '10px' }}>
                            <div style={{
                              width: `${score}%`,
                              height: '100%',
                              backgroundColor: EMOTION_COLORS[emotion] || '#666',
                              borderRadius: '4px',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Voice Analytics */}
                <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>Voice Analytics 🎤</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Speech Rate</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{Math.round(trackingData.speechRate)} wpm</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Pitch</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{Math.round(trackingData.pitch)} Hz</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Volume</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{Math.round(trackingData.volume)} dB</div>
                    </div>
                  </div>
                </div>

                {/* Time Series Graph */}
                {trackingHistory.length > 0 && (
                  <div style={{ marginTop: '20px', backgroundColor: '#fff', padding: '15px', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>30-Second History 📈</h4>
                    <div style={{ height: '100px', position: 'relative', backgroundColor: '#f8f8f8', borderRadius: '4px', overflow: 'hidden' }}>
                      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* Grid lines */}
                        {[0, 25, 50, 75, 100].map(y => (
                          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e0e0e0" strokeWidth="0.5" />
                        ))}
                        
                        {/* Eye Contact Line */}
                        <polyline
                          points={trackingHistory.map((d, i) => `${(i / 29) * 100},${100 - d.eyeContact}`).join(' ')}
                          fill="none"
                          stroke="#4169e1"
                          strokeWidth="2"
                        />
                        
                        {/* Posture Line */}
                        <polyline
                          points={trackingHistory.map((d, i) => `${(i / 29) * 100},${100 - d.posture}`).join(' ')}
                          fill="none"
                          stroke="#28a745"
                          strokeWidth="2"
                        />
                      </svg>
                      
                      {/* Legend */}
                      <div style={{ position: 'absolute', top: '5px', right: '5px', fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.8)', padding: '5px', borderRadius: '4px' }}>
                        <span style={{ color: '#4169e1', marginRight: '10px' }}>● Eye Contact</span>
                        <span style={{ color: '#28a745' }}>● Posture</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}
      
      {!isInRoom && (
        <section style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <input 
              placeholder="Your name" 
              value={userName} 
              onChange={e => setCurrentUserName(e.target.value)}
              style={{ padding: '8px', marginRight: '10px', fontSize: '16px' }}
            />
            <button 
              onClick={createRoom}
              disabled={!userName}
              style={{ padding: '8px 16px', fontSize: '16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Create Room
            </button>
          </div>
          
          <hr style={{ margin: '20px 0' }} />
          
          <div>
            <input 
              placeholder="Room ID to join" 
              value={joinRoomId} 
              onChange={e => setJoinRoomId(e.target.value)}
              style={{ padding: '8px', marginRight: '10px', fontSize: '16px' }}
            />
            <button 
              onClick={() => joinRoom()}
              disabled={!joinRoomId || !userName}
              style={{ padding: '8px 16px', fontSize: '16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Join Room
            </button>
          </div>
        </section>
      )}

      {isInRoom && (
        <section className="video-grid" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <h3>You ({userName})</h3>
              <video 
                ref={userVideoRef}
                muted 
                autoPlay 
                playsInline 
                onLoadedMetadata={(e) => {
                  const video = e.target as HTMLVideoElement;
                  console.log('📹 Video metadata loaded, attempting to play...');
                  video.play().catch(err => console.error('Error playing video:', err));
                }}
                style={{ width: '100%', maxWidth: '400px', backgroundColor: '#000', borderRadius: '8px' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <h3>{guestName || 'Partner'}</h3>
              <video 
                ref={partnerVideoRef} 
                autoPlay 
                playsInline 
                style={{ width: '100%', maxWidth: '400px', backgroundColor: '#000', borderRadius: '8px' }}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={toggleMute}
              style={{ 
                padding: '10px', 
                backgroundColor: isMuted ? '#dc3545' : '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '50%', 
                width: '40px', 
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Mic />
            </button>
            <button 
              onClick={toggleVideo}
              style={{ 
                padding: '10px', 
                backgroundColor: !isVideoEnabled ? '#dc3545' : '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '50%', 
                width: '40px', 
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Camera />
            </button>
            <button 
              onClick={leaveRoom}
              style={{ 
                padding: '10px', 
                backgroundColor: '#dc3545', 
                color: 'white', 
                border: 'none', 
                borderRadius: '50%', 
                width: '40px', 
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <PhoneOff />
            </button>
            <span style={{ marginLeft: '20px', fontSize: '16px', color: connectionStatus === 'Connected' ? '#28a745' : '#6c757d' }}>
              Status: {connectionStatus}
            </span>
          </div>
        </section>
      )}
        
      {showQrCode && (
        <section style={{ textAlign: 'center', marginTop: '20px' }}>
          <h3>Share this QR code for others to join:</h3>
          <QRCode value={qrCodeUrl} size={256} />
          <p>Room ID: {roomId}</p>
        </section>
      )}
        
      {errorMessage && (
        <div style={{ backgroundColor: '#ffcccc', color: '#cc0000', padding: '10px', borderRadius: '5px', marginTop: '10px' }}>
          {errorMessage}
        </div>
      )}
    </div>
  );
};

/* ---------------------- REPORT COMPONENTS ------------------------- */
const MetricsList: React.FC<{ metrics: PerformanceMetrics }> = ({ metrics }) => (
  <ul>
    <li><Eye /> {Math.round(metrics.eyeContactPercentage)}% eye contact</li>
    <li><Users /> {(metrics.postureScore * 100).toFixed(0)}% posture</li>
    <li><Mic /> {(metrics.speakingRatio * 100).toFixed(0)}% speaking</li>
    <li><Heart /> {(metrics.emotionalEngagement * 100).toFixed(0)}% engagement</li>
  </ul>
);

const RecommendationCard: React.FC<{ recommendation: Recommendation }> = ({ recommendation }) => (
  <div className="recommendation">
    <strong>{recommendation.title}</strong>
    <p>{recommendation.description}</p>
  </div>
);

export default VideoCallAnalytics;
