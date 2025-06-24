import React, { useState, useEffect, useRef } from 'react';
import { ref, set, onValue, get } from 'firebase/database';
import { database } from '../firebaseConfig';
import { conferenceFirebaseService } from '../services/conferenceFirebaseService';
import { isRealFirebase } from '../firebaseConfig';
import Peer from 'simple-peer';
import QRCode from 'qrcode';
import { HumeVoiceServiceWrapper } from '../services/HumeVoiceServiceWrapper';
import VideoCallAnalyzer from '../services/VideoCallAnalyzer';
import {
  Eye,
  Heart,
  Users,
  Mic,
  PhoneOff,
  Camera,
  Share2,
  MessageSquare,
  Award
} from 'lucide-react';

// 🔑 Local project types
import type {
  VideoCallAnalyticsProps,
  AnalyticsSnapshot,
  EmotionScore,
  PostureScore,
  PerformanceMetrics,
  Recommendation,
  TranscriptEntry
} from '../types/VideoCallAnalyticsTypes';
import type { CallReport } from '../types/CallReport';

/* -------------------------------------------------- */
// 🎨 Emotion‑to‑color map
const EMOTION_COLORS: Record<string, string> = {
  joy: '#FFD700',
  excitement: '#FF6B6B',
  interest: '#4ECDC4',
  love: '#FF69B4',
  contentment: '#98D8C8',
  surprise: '#FFE66D',
  confusion: '#B39BC8',
  sadness: '#6C8EBF',
  fear: '#9B59B6',
  anger: '#E74C3C',
  disgust: '#95A5A6',
  contempt: '#34495E',
  neutral: '#BDC3C7'
};

export const VideoCallAnalytics: React.FC<VideoCallAnalyticsProps> = ({ partnerName = 'Partner' }) => {
  /* -------------------------- STATE & REFS -------------------------- */
  const firebaseService = conferenceFirebaseService;
  const usingRealFirebase = isRealFirebase();

  // Streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Room/session
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [isInRoom, setIsInRoom] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'Not connected' | 'Connecting' | 'Connected' | 'Connection error'>('Not connected');
  const [currentUserName, setCurrentUserName] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [guestName, setGuestName] = useState('');

  // Analytics
  const [isCallActive, setIsCallActive] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSnapshot[]>([]);
  const [callReport, setCallReport] = useState<CallReport | null>(null);

  // UI toggles
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  // Refs
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const partnerVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer.Instance | null>(null);
  const voiceServiceRef = useRef<HumeVoiceServiceWrapper | null>(null);
  const analyticsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const roomRef = useRef<string>('');

  /* ----------------------- MEDIA INITIALISATION --------------------- */
  const initializeMedia = async (): Promise<MediaStream | null> => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setConnectionStatus('Connection error');
        return null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error('🎥 getUserMedia failed', err);
      setConnectionStatus('Connection error');
      return null;
    }
  };

  /* --------------------------- URL PARSING -------------------------- */
  useEffect(() => {
    const urlHash = window.location.hash;
    console.log('🔍 [URL] Current hash:', urlHash);
    const roomMatch = urlHash.match(/[?&]room=([^&]+)/);
    if (roomMatch) {
      const roomFromUrl = roomMatch[1];
      console.log('✅ [URL] Found room in URL:', roomFromUrl);
      setJoinRoomId(roomFromUrl);
      
      // Auto-join with default name if we have room parameter
      const defaultName = 'Guest';
      console.log('🔄 [URL] Auto-joining room with default name:', defaultName);
      setTimeout(() => {
        joinRoom(roomFromUrl, defaultName);
      }, 1000);
    }
  }, []);

  /* --------------------------- ROOM LOGIC --------------------------- */
  const setupGuestListener = (roomId: string) => {
    onValue(ref(database, `conference-rooms/${roomId}/guest`), snap => {
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
    if (!currentUserName) return;
    if (!localStream && !(await initializeMedia())) return;

    const newRoomId = await firebaseService.createRoom(currentUserName);
    setRoomId(newRoomId);
    roomRef.current = newRoomId;
    setIsHost(true);
    setIsInRoom(true);

    // QR‑code for guest join
    const mobileUrl = `${window.location.origin}/hub/#/video-analytics?room=${newRoomId}`;
    setQrCodeUrl(await QRCode.toDataURL(mobileUrl));
    setShowQrCode(true);
    setupGuestListener(newRoomId);
  };

  const joinRoom = async (rId: string, name: string) => {
    if (!rId || !name) return;
    if (!(await initializeMedia())) return;
    
    await set(ref(database, `conference-rooms/${rId}/guest`), { name, joinedAt: Date.now() });
    setRoomId(rId);
    roomRef.current = rId;
    setIsInRoom(true);
    setIsHost(false);
    setCurrentUserName(name);
    setConnectionStatus('Connecting');
    createPeer(false, 'guest-peer');
  };

  /* --------------------------- WEBRTC ------------------------------- */
  const createPeer = (initiator: boolean, peerId: string) => {
    if (!localStream) return;
    
    console.log('🎯 [PEER] Creating peer:', { initiator, peerId, roomId });
    const peer = new Peer({ initiator, trickle: false, stream: localStream });

    peer.on('stream', stream => {
      console.log('✅ [PEER] Received remote stream');
      setRemoteStream(stream);
      if (partnerVideoRef.current) {
        partnerVideoRef.current.srcObject = stream;
      }
      setConnectionStatus('Connected');
    });

    peer.on('signal', data => {
      console.log('📡 [PEER] Sending signal:', data);
      const signalPath = `conference-rooms/${roomId}/signals/${peerId}/${isHost ? 'host' : 'guest'}`;
      set(ref(database, signalPath), { signal: data, ts: Date.now() });
    });

    peer.on('connect', () => {
      console.log('🔗 [PEER] Connected!');
      setConnectionStatus('Connected');
    });

    peer.on('error', err => {
      console.error('❌ [PEER] Error:', err);
      setConnectionStatus('Connection error');
    });

    // Listen for remote signals
    const remotePath = `conference-rooms/${roomId}/signals/${peerId}/${isHost ? 'guest' : 'host'}`;
    onValue(ref(database, remotePath), snap => {
      const signalData = snap.val();
      if (signalData?.signal) {
        console.log('📡 [PEER] Received signal:', signalData.signal);
        peer.signal(signalData.signal);
      }
    });

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
  const collectAnalyticsSnapshot = () => {
    // Placeholder – integrate your ML hooks
    setAnalyticsData(a => [...a, { timestamp: Date.now() } as any]);
  };

  /* ----------------------------- CALL ------------------------------- */
  const startCall = async () => {
    setIsCallActive(true);
    analyticsIntervalRef.current = setInterval(collectAnalyticsSnapshot, 200);
    voiceServiceRef.current = new HumeVoiceServiceWrapper();
    await voiceServiceRef.current.connect();
  };

  const endCall = () => {
    setIsCallActive(false);
    if (analyticsIntervalRef.current) {
      clearInterval(analyticsIntervalRef.current);
    }
    voiceServiceRef.current?.disconnect();
  };

  /* ----------------------------- RENDER ----------------------------- */
  return (
    <div className="video-call-analytics" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Video Call Analytics</h1>
      
      {!isInRoom && (
        <section style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <input 
              placeholder="Your name" 
              value={currentUserName} 
              onChange={e => setCurrentUserName(e.target.value)}
              style={{ padding: '8px', marginRight: '10px', fontSize: '16px' }}
            />
            <button 
              onClick={createRoom}
              disabled={!currentUserName}
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
              onClick={() => joinRoom(joinRoomId, currentUserName)}
              disabled={!joinRoomId || !currentUserName}
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
              <h3>You ({currentUserName})</h3>
              <video 
                ref={userVideoRef} 
                muted 
                autoPlay 
                playsInline 
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
              <Mic size={18} />
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
              <Camera size={18} />
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
              <PhoneOff size={18} />
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
          <img src={qrCodeUrl} alt="Room QR Code" style={{ border: '1px solid #ccc', borderRadius: '8px' }} />
          <p>Room ID: {roomId}</p>
        </section>
      )}
    </div>
  );
};

/* ---------------------- REPORT COMPONENTS ------------------------- */
const MetricsList: React.FC<{ metrics: PerformanceMetrics }> = ({ metrics }) => (
  <ul>
    <li><Eye size={14} /> {Math.round(metrics.eyeContactPercentage)}% eye contact</li>
    <li><Users size={14} /> {(metrics.postureScore * 100).toFixed(0)}% posture</li>
    <li><Mic size={14} /> {(metrics.speakingRatio * 100).toFixed(0)}% speaking</li>
    <li><Heart size={14} /> {(metrics.emotionalEngagement * 100).toFixed(0)}% engagement</li>
  </ul>
);

const RecommendationCard: React.FC<{ recommendation: Recommendation }> = ({ recommendation }) => (
  <div className="recommendation">
    <strong>{recommendation.title}</strong>
    <p>{recommendation.description}</p>
  </div>
);

export default VideoCallAnalytics;
