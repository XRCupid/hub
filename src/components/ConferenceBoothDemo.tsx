import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Peer from 'simple-peer';
import { mockFirebaseConference } from '../services/mockFirebaseConference';
import { conferenceFirebaseService } from '../services/conferenceFirebaseService';
import { isRealFirebase } from '../firebaseConfig';
import QRCode from 'qrcode';
import AudienceAnalyticsDashboard from './AudienceAnalyticsDashboard';
import PresenceAvatar from './PresenceAvatar';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ML5FaceMeshService } from '../services/ML5FaceMeshService';
// DISABLED: Posture tracking causing crashes
// import { PostureTrackingService } from '../services/PostureTrackingService';
import { Link } from 'react-router-dom';
import './ConferenceBoothDemo.css';

interface Props {
  initialMode?: 'participant' | 'audience';
  roomId?: string;
}

interface ParticipantData {
  name: string;
  avatarUrl: string;
  stream?: MediaStream;
  trackingData?: any;
  ml5Service?: ML5FaceMeshService;
}

const ConferenceBoothDemo: React.FC<Props> = ({ 
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
  const [participant1Data, setParticipant1Data] = useState<ParticipantData>({
    name: '',
    avatarUrl: '/avatars/coach_grace.glb',
    trackingData: null,
    ml5Service: undefined
  });
  const [participant2Data, setParticipant2Data] = useState<ParticipantData>({
    name: '',
    avatarUrl: '/avatars/coach_rizzo.glb',
    trackingData: null,
    ml5Service: undefined
  });
  const [mode, setMode] = useState<'participant' | 'audience'>(initialMode);
  const [showAvatars, setShowAvatars] = useState(true);
  const [selectedAvatar1, setSelectedAvatar1] = useState('/avatars/coach_grace.glb');
  const [selectedAvatar2, setSelectedAvatar2] = useState('/avatars/coach_rizzo.glb');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState(false);

  console.log('ConferenceBoothDemo - Current mode:', mode);
  console.log('ConferenceBoothDemo - isInRoom:', isInRoom);
  console.log('ConferenceBoothDemo - connectionStatus:', connectionStatus);

  // Tracking services
  const ml5FaceMeshServiceRef1 = useRef<ML5FaceMeshService | null>(null);
  const ml5FaceMeshServiceRef2 = useRef<ML5FaceMeshService | null>(null);
  // DISABLED: Posture tracking causing crashes
  // const postureTrackingServiceRef = useRef<PostureTrackingService | null>(null);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<any | null>(null);
  const roomRef = useRef<string | null>(null);
  const myPeerIdRef = useRef<string>(`peer_${Date.now()}`);
  const processedSignalsRef = useRef<Set<string>>(new Set());
  const ml5Initialized = useRef(false);

  // Available avatars for quick selection
  const avatarOptions = [
    { id: 'grace', url: '/avatars/coach_grace.glb', name: 'Grace' },
    { id: 'rizzo', url: '/avatars/coach_rizzo.glb', name: 'Rizzo' },
    { id: 'posie', url: '/avatars/coach_posie.glb', name: 'Posie' },
    { id: 'zara', url: '/avatars/npc_zara.glb', name: 'Zara' },
    { id: 'generic_f', url: '/avatars/xrcupid_avatar_generic_female.glb', name: 'Generic F' },
    { id: 'generic_m', url: '/avatars/xrcupid_avatar_generic_male.glb', name: 'Generic M' }
  ];

  // Use real Firebase if configured, otherwise fall back to mock
  const firebaseService = isRealFirebase() ? conferenceFirebaseService : mockFirebaseConference;
  const usingRealFirebase = isRealFirebase();

  console.log('ConferenceBoothDemo - Using real Firebase:', usingRealFirebase);
  console.log('ConferenceBoothDemo - State:', {
    roomId,
    isInRoom,
    isHost,
    currentUserName,
    localStream: !!localStream,
    remoteStream: !!remoteStream,
    connectionStatus
  });

  // Ensure clean state on component mount
  useEffect(() => {
    // Reset state on mount to ensure clean start
    console.log('[ConferenceBoothDemo] Component mounted, resetting state');
    setIsInRoom(false);
    setRoomId('');
    setConnectionStatus('');
    setIsHost(false);
    setCurrentUserName('');
    setParticipant1Data({ name: '', avatarUrl: selectedAvatar1 });
    setParticipant2Data({ name: '', avatarUrl: selectedAvatar2 });
    
    // Cleanup on unmount
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  // Auto-join room if roomId is provided via props (mobile joining)
  useEffect(() => {
    if (propRoomId && !isInRoom && initialMode === 'participant' && !currentUserName) {
      console.log('[ConferenceBoothDemo] Auto-joining room from URL:', propRoomId);
      // Set a default name for mobile participants
      const defaultName = `Mobile User ${Math.floor(Math.random() * 1000)}`;
      setCurrentUserName(defaultName);
      setParticipant2Data(prev => ({ ...prev, name: defaultName }));
    }
  }, [propRoomId, initialMode, isInRoom, currentUserName]);

  // Trigger join when both roomId and userName are set for mobile
  useEffect(() => {
    if (propRoomId && currentUserName && !isInRoom && initialMode === 'participant') {
      console.log('[ConferenceBoothDemo] Joining room with credentials:', propRoomId, currentUserName);
      joinRoom(propRoomId, currentUserName);
    }
  }, [propRoomId, currentUserName, isInRoom, initialMode]);

  // Initialize tracking for participants
  useEffect(() => {
    const initTracking = async () => {
      console.log('[ConferenceBoothDemo] Initializing tracking services...');
      
      // Check if ML5 is available
      if (typeof (window as any).ml5 === 'undefined') {
        console.error('[ConferenceBoothDemo] ML5 not loaded yet, waiting...');
        // Wait for ML5 to load
        await new Promise<void>((resolve) => {
          const checkML5 = setInterval(() => {
            if (typeof (window as any).ml5 !== 'undefined') {
              clearInterval(checkML5);
              console.log('[ConferenceBoothDemo] ML5 loaded!');
              resolve();
            }
          }, 100);
        });
      }
      
      // Initialize services once
      // DISABLED: Posture tracking causing crashes
      // if (!postureTrackingServiceRef.current) {
      //   postureTrackingServiceRef.current = new PostureTrackingService();
      //   await postureTrackingServiceRef.current.initialize();
      //   console.log('[ConferenceBoothDemo] PostureTrackingService initialized');
      // }
    };

    initTracking();
  }, []);

  useEffect(() => {
    if (localStream && showAvatars && participant1Data.name) {
      console.log('[ConferenceBoothDemo] Initializing ML5 tracking for participant 1');
      const initializeTracking = async () => {
        try {
          // Clean up any existing ML5 service first
          if (ml5FaceMeshServiceRef1.current) {
            ml5FaceMeshServiceRef1.current.stopTracking();
            ml5FaceMeshServiceRef1.current = null;
          }
          
          // Create a new ML5 service instance for this participant
          const ml5Service = new ML5FaceMeshService();
          ml5FaceMeshServiceRef1.current = ml5Service;
          await ml5Service.initialize();
          console.log('[ConferenceBoothDemo] ML5 service initialized for participant 1');
          
          // Add a small delay to ensure ML5 is fully ready
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Create a video element for ML5
          const video = document.createElement('video');
          video.srcObject = localStream;
          video.width = 640;
          video.height = 480;
          video.style.display = 'none';
          video.autoplay = true;
          video.playsInline = true;
          document.body.appendChild(video);
          
          // Wait for video to be ready
          await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => resolve();
            video.oncanplay = () => {
              video.play()
                .then(() => {
                  console.log('[ConferenceBoothDemo] video.play() called successfully for participant 1');
                })
                .catch(playError => {
                  console.error('[ConferenceBoothDemo] Error calling video.play() for participant 1:', playError);
                });
            };
            video.onerror = reject;
          });
          
          // Wait for video dimensions to be available
          await new Promise<void>((resolve) => {
            const checkDimensions = () => {
              if (video.videoWidth > 0 && video.videoHeight > 0) {
                console.log('[ConferenceBoothDemo] Video dimensions ready for participant 1:', video.videoWidth, 'x', video.videoHeight);
                resolve();
              } else {
                setTimeout(checkDimensions, 50);
              }
            };
            checkDimensions();
          });
          
          // Now start ML5 tracking
          ml5Service.startTracking(video);
          
          // DISABLED: Posture tracking causing crashes
          // Initialize posture tracking on the same video
          // if (postureTrackingServiceRef.current) {
          //   await postureTrackingServiceRef.current.startTracking(video);
          // }
          
          // Update participant data with ML5 service
          setParticipant1Data(prev => ({ ...prev, ml5Service }));
          
          // Start tracking interval
          const trackingInterval = setInterval(() => {
            if (ml5Service) {
              const facialExpressions = ml5Service.getExpressions();
              const headRotation = ml5Service.getHeadRotation();
              const landmarks = ml5Service.getLandmarks();
              
              // Debug log
              console.log('[ConferenceBoothDemo] Tracking data retrieved:', {
                hasExpressions: !!facialExpressions,
                hasHeadRotation: !!headRotation,
                headRotation,
                hasLandmarks: !!landmarks
              });
              
              // Combine tracking data
              const trackingData = {
                facialExpressions: facialExpressions || {},
                headRotation: headRotation || {},
                landmarks: landmarks || [],
                source: 'ml5'
              };
              
              if (facialExpressions || headRotation || landmarks) {
                setParticipant1Data(prev => ({ ...prev, trackingData }));
                
                // Send tracking data to other participants via Firebase
                if (roomRef.current && firebaseService && myPeerIdRef.current) {
                  firebaseService.updateParticipant(roomRef.current, myPeerIdRef.current, {
                    trackingData,
                    lastUpdate: Date.now()
                  });
                }
              }
            }
          }, 1000 / 30); // 30 FPS, same as EnhancedCoachSession
          
          return () => {
            clearInterval(trackingInterval);
            ml5Service.stopTracking();
            ml5FaceMeshServiceRef1.current = null;
            // DISABLED: Posture tracking causing crashes
            // if (postureTrackingServiceRef.current) {
            //   postureTrackingServiceRef.current.stopTracking();
            // }
            video.remove();
          };
        } catch (error) {
          console.error('[ConferenceBoothDemo] Failed to initialize ML5 tracking:', error);
        }
      };
      
      const cleanup = initializeTracking();
      return () => {
        cleanup.then(fn => fn && fn());
      };
    }
  }, [localStream, showAvatars, participant1Data.name]);

  useEffect(() => {
    if (remoteStream && showAvatars && participant2Data.name) {
      console.log('[ConferenceBoothDemo] Initializing ML5 tracking for participant 2');
      const initializeTracking = async () => {
        try {
          // Clean up any existing ML5 service first
          if (ml5FaceMeshServiceRef2.current) {
            ml5FaceMeshServiceRef2.current.stopTracking();
            ml5FaceMeshServiceRef2.current = null;
          }
          
          // Create a new ML5 service instance for this participant
          const ml5Service = new ML5FaceMeshService();
          ml5FaceMeshServiceRef2.current = ml5Service;
          await ml5Service.initialize();
          console.log('[ConferenceBoothDemo] ML5 service initialized for participant 2');
          
          // Add a small delay to ensure ML5 is fully ready
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Create a video element for ML5
          const video = document.createElement('video');
          video.srcObject = remoteStream;
          video.width = 640;
          video.height = 480;
          video.style.display = 'none';
          video.autoplay = true;
          video.playsInline = true;
          document.body.appendChild(video);
          
          // Wait for video to be ready
          await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => resolve();
            video.oncanplay = () => {
              video.play()
                .then(() => {
                  console.log('[ConferenceBoothDemo] video.play() called successfully for participant 2');
                })
                .catch(playError => {
                  console.error('[ConferenceBoothDemo] Error calling video.play() for participant 2:', playError);
                });
            };
            video.onerror = reject;
          });
          
          // Wait for video dimensions to be available
          await new Promise<void>((resolve) => {
            const checkDimensions = () => {
              if (video.videoWidth > 0 && video.videoHeight > 0) {
                console.log('[ConferenceBoothDemo] Video dimensions ready for participant 2:', video.videoWidth, 'x', video.videoHeight);
                resolve();
              } else {
                setTimeout(checkDimensions, 50);
              }
            };
            checkDimensions();
          });
          
          // Now start ML5 tracking
          ml5Service.startTracking(video);
          
          // DISABLED: Posture tracking causing crashes
          // Initialize posture tracking on the same video
          // if (postureTrackingServiceRef.current) {
          //   await postureTrackingServiceRef.current.startTracking(video);
          // }
          
          // Update participant data with ML5 service
          setParticipant2Data(prev => ({ ...prev, ml5Service }));
          
          // Start tracking interval
          const trackingInterval = setInterval(() => {
            if (ml5Service) {
              const facialExpressions = ml5Service.getExpressions();
              const headRotation = ml5Service.getHeadRotation();
              const landmarks = ml5Service.getLandmarks();
              
              // Debug log
              console.log('[ConferenceBoothDemo] Tracking data retrieved:', {
                hasExpressions: !!facialExpressions,
                hasHeadRotation: !!headRotation,
                headRotation,
                hasLandmarks: !!landmarks
              });
              
              // Combine tracking data
              const trackingData = {
                facialExpressions: facialExpressions || {},
                headRotation: headRotation || {},
                landmarks: landmarks || [],
                source: 'ml5'
              };
              
              if (facialExpressions || headRotation || landmarks) {
                setParticipant2Data(prev => ({ ...prev, trackingData }));
                
                // Send tracking data to other participants via Firebase
                if (roomRef.current && firebaseService && myPeerIdRef.current) {
                  firebaseService.updateParticipant(roomRef.current, myPeerIdRef.current, {
                    trackingData,
                    lastUpdate: Date.now()
                  });
                }
              }
            }
          }, 1000 / 30); // 30 FPS, same as EnhancedCoachSession
          
          return () => {
            clearInterval(trackingInterval);
            ml5Service.stopTracking();
            ml5FaceMeshServiceRef2.current = null;
            // DISABLED: Posture tracking causing crashes
            // if (postureTrackingServiceRef.current) {
            //   postureTrackingServiceRef.current.stopTracking();
            // }
            video.remove();
          };
        } catch (error) {
          console.error('[ConferenceBoothDemo] Failed to initialize ML5 tracking:', error);
        }
      };
      
      const cleanup = initializeTracking();
      return () => {
        cleanup.then(fn => fn && fn());
      };
    }
  }, [remoteStream, showAvatars, participant2Data.name]);

  // Initialize user media
  useEffect(() => {
    initializeMedia();
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeMedia = async () => {
    console.log('[ConferenceBoothDemo] Starting media initialization...');
    try {
      console.log('[ConferenceBoothDemo] Requesting getUserMedia...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      console.log('[ConferenceBoothDemo] getUserMedia successful, stream:', stream);
      console.log('[ConferenceBoothDemo] Stream tracks:', stream.getTracks().map(t => ({ kind: t.kind, label: t.label, enabled: t.enabled })));
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('[ConferenceBoothDemo] Set video element srcObject');
      } else {
        console.log('[ConferenceBoothDemo] Warning: localVideoRef.current is null');
      }
      // Set participant1 stream if host, participant2 if guest
      if (isHost) {
        setParticipant1Data(prev => ({ ...prev, stream }));
      } else {
        setParticipant2Data(prev => ({ ...prev, stream }));
      }
      console.log('[ConferenceBoothDemo] Local stream obtained and set');
    } catch (error) {
      console.error('[ConferenceBoothDemo] Error accessing media:', error);
      if (error instanceof DOMException) {
        console.error('[ConferenceBoothDemo] DOMException name:', error.name);
        console.error('[ConferenceBoothDemo] DOMException message:', error.message);
      }
      setConnectionStatus('Media access denied');
    }
  };

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createRoom = async (userName: string) => {
    console.log('[ConferenceBoothDemo] Creating room for user:', userName);
    console.log('[ConferenceBoothDemo] Using Firebase service:', usingRealFirebase ? 'Real' : 'Mock');
    
    const createdRoomId = await firebaseService.createRoom(userName);
    console.log('[ConferenceBoothDemo] Room created with ID:', createdRoomId);
    
    if (!createdRoomId) {
      console.error('[ConferenceBoothDemo] Failed to create room');
      return;
    }
    setRoomId(createdRoomId);
    setIsHost(true);
    setCurrentUserName(userName);
    setParticipant1Data({ name: userName, stream: localStream || undefined, avatarUrl: selectedAvatar1 });
    setIsInRoom(true); // Add this line to mark that we're in a room
    
    // Generate QR code for mobile joining
    try {
      const mobileUrl = firebaseService.getMobileJoinUrl ? 
        firebaseService.getMobileJoinUrl(createdRoomId) : 
        `${window.location.origin}/conference-mobile?room=${createdRoomId}`;
      
      console.log('[ConferenceBoothDemo] Generating QR code for URL:', mobileUrl);
      
      const qrDataUrl = await QRCode.toDataURL(mobileUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrDataUrl);
      setShowQrCode(true);
    } catch (err) {
      console.error('[ConferenceBoothDemo] Error generating QR code:', err);
    }
    
    // Listen for guest
    console.log('[ConferenceBoothDemo] Setting up guest listener...');
    const unsubscribe = usingRealFirebase ? 
      firebaseService.onRoomUpdate(createdRoomId, (roomData: any) => {
        console.log('[ConferenceBoothDemo] Room update received:', roomData);
        if (roomData.participants && roomData.participants.length > 1 && peerRef.current === null) {
          const guestName = roomData.participants.find((p: string) => p !== userName);
          if (guestName) {
            console.log('[ConferenceBoothDemo] Guest joined:', guestName);
            setParticipant2Data({ name: guestName, avatarUrl: selectedAvatar2 });
            setConnectionStatus('Guest joined, connecting...');
            setShowQrCode(false);
            createPeer(true, 'guest-peer');
          }
        }
      }) :
      firebaseService.onSnapshot(`rooms/${createdRoomId}/participants`, (participants: string[]) => {
        console.log('[ConferenceBoothDemo] Participants update:', participants);
        if (participants.length > 1 && peerRef.current === null) {
          const guestName = participants.find(p => p !== userName);
          if (guestName) {
            console.log('[ConferenceBoothDemo] Guest joined:', guestName);
            setParticipant2Data({ name: guestName, avatarUrl: selectedAvatar2 });
            setConnectionStatus('Guest joined, connecting...');
            setShowQrCode(false);
            createPeer(true, 'guest-peer');
          }
        }
      });
  };

  const joinRoom = async (roomIdToJoin: string, name: string) => {
    setRoomId(roomIdToJoin);
    roomRef.current = roomIdToJoin;
    myPeerIdRef.current = `guest-${Date.now()}`;
    setParticipant2Data({ name, stream: localStream || undefined, avatarUrl: selectedAvatar2 });
    
    // Check if room exists
    if (!firebaseService) {
      console.error('Firebase service not available');
      return;
    }
    
    const room = await firebaseService.getRoom(roomIdToJoin);
    
    if (!room) {
      alert('Room not found!');
      return;
    }
    
    setParticipant1Data({ name: room.host, avatarUrl: selectedAvatar1 });
    
    // Join room
    const joined = await firebaseService.joinRoom(roomIdToJoin, name);
    if (!joined) {
      alert('Failed to join room');
      return;
    }
    
    roomRef.current = roomIdToJoin;
    setIsInRoom(true);
    
    // Create peer connection
    createPeer(false, 'host-peer');
  };

  const createPeer = (initiator: boolean, targetPeerId: string) => {
    const peer = new Peer({
      initiator,
      trickle: false,
      stream: localStream || undefined,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', (data: any) => {
      // Send signal to the other peer
      if (roomRef.current && firebaseService) {
        firebaseService.sendSignal(roomRef.current, myPeerIdRef.current, targetPeerId, data);
      }
    });

    peer.on('connect', () => {
      setConnectionStatus('Connected');
    });

    peer.on('stream', (stream: MediaStream) => {
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      if (isHost) {
        setParticipant2Data(prev => ({ ...prev, stream }));
      } else {
        setParticipant1Data(prev => ({ ...prev, stream }));
      }
    });

    peer.on('close', () => {
      setConnectionStatus('Disconnected');
    });

    peer.on('error', (err: Error) => {
      console.error('Peer error:', err);
      setConnectionStatus('Connection error');
    });

    peerRef.current = peer;

    // Listen for signals from the other peer
    if (roomRef.current && firebaseService) {
      const unsubscribe = usingRealFirebase ?
        firebaseService.onSignal(roomRef.current, myPeerIdRef.current, (signal: any) => {
          if (signal && !processedSignalsRef.current.has(targetPeerId)) {
            processedSignalsRef.current.add(targetPeerId);
            peer.signal(signal);
          }
        }) :
        firebaseService.onSnapshot(`rooms/${roomRef.current}/signals/${targetPeerId}_to_${myPeerIdRef.current}`, (signal: any) => {
          if (signal && !processedSignalsRef.current.has(targetPeerId)) {
            processedSignalsRef.current.add(targetPeerId);
            peer.signal(signal);
          }
        });
    }
  };

  const leaveRoom = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    // Clean up room data
    roomRef.current = null;
    setRoomId('');
    setIsInRoom(false);
    setConnectionStatus('');
    setParticipant1Data({ name: '', avatarUrl: '' });
    setParticipant2Data({ name: '', avatarUrl: '' });
  };

  // Participant View
  if (mode === 'participant') {
    return (
      <div className="conference-booth-demo participant-view">
        <div className="riso-header">
          <h1 className="riso-title">
            <span className="riso-text-offset">XRCupid Dating Experience</span>
          </h1>
          {!isInRoom && (
            <p className="riso-subtitle">Connect authentically while AI coaches observe</p>
          )}
        </div>

        <div className="mode-toggle riso-card">
          <h3>Select Your Role</h3>
          <div className="toggle-buttons">
            <button onClick={() => setMode('participant')} className="riso-button primary">Participant</button>
            <button onClick={() => setMode('audience')} className="riso-button secondary">Audience</button>
          </div>

          <div className="nav-links" style={{ marginTop: '20px', textAlign: 'center' }}>
            <p style={{ color: '#888', marginBottom: '10px' }}>Or try the new setup:</p>
            <Link to="/conference" style={{ marginRight: '15px', color: '#4ECDC4' }}>
              Host Conference (Computer)
            </Link>
            <Link to="/conference-mobile" style={{ color: '#FFD700' }}>
              Join Conference (Mobile)
            </Link>
          </div>
        </div>

        {!isInRoom ? (
          <div className="riso-card setup-card">
            <h2>Join the Experience</h2>
            <input
              type="text"
              placeholder="Your name"
              value={currentUserName}
              onChange={(e) => setCurrentUserName(e.target.value)}
              className="riso-input"
            />
            
            <div className="room-controls">
              <button
                onClick={() => createRoom(currentUserName)}
                disabled={!currentUserName}
                className="riso-button primary"
              >
                Create Room
              </button>
              
              <div className="join-section">
                <input
                  type="text"
                  placeholder="Room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="riso-input"
                />
                <button
                  onClick={() => joinRoom(roomId, currentUserName)}
                  disabled={!currentUserName || !roomId}
                  className="riso-button secondary"
                >
                  Join Room
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="video-container">
            {roomId && (
              <div className="room-info riso-card">
                <span className="room-label">Room:</span>
                <span className="room-id">{roomId}</span>
                <span className="connection-status">{connectionStatus}</span>
              </div>
            )}
            
            <div className="video-grid">
              <div className="video-wrapper">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="participant-video"
                />
                <div className="video-label">{currentUserName} (You)</div>
              </div>
              
              {remoteStream && (
                <div className="video-wrapper">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="participant-video"
                  />
                  <div className="video-label">
                    {isHost ? participant2Data.name : participant1Data.name}
                  </div>
                </div>
              )}
            </div>
            
            <button onClick={leaveRoom} className="riso-button danger">
              Leave Room
            </button>
            
            <div className="room-section">
              <h3>Room Code</h3>
              <div className="room-code-display">{roomId}</div>
              {showQrCode && qrCodeUrl && (
                <div className="qr-code-section">
                  <p>Scan with mobile device to join:</p>
                  <img src={qrCodeUrl} alt="QR Code" className="qr-code" />
                  <p className="firebase-status">
                    {usingRealFirebase ? '🟢 Using Real Firebase' : '🟡 Using Mock Firebase'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Audience View
  return (
    <div className="conference-booth-demo audience-view">
      <div className="riso-header">
        <h1 className="riso-title">
          <span className="riso-text-offset">XRCupid Analytics Dashboard</span>
        </h1>
        <p className="riso-subtitle">Real-time Dating Performance Analysis</p>
      </div>

      <div className="mode-toggle riso-card">
        <h3>Select Your Role</h3>
        <div className="toggle-buttons">
          <button onClick={() => setMode('participant')} className="riso-button primary">Participant</button>
          <button onClick={() => setMode('audience')} className="riso-button secondary">Audience</button>
        </div>

        <div className="nav-links" style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ color: '#888', marginBottom: '10px' }}>Or try the new setup:</p>
          <Link to="/conference" style={{ marginRight: '15px', color: '#4ECDC4' }}>
            Host Conference (Computer)
          </Link>
          <Link to="/conference-mobile" style={{ color: '#FFD700' }}>
            Join Conference (Mobile)
          </Link>
        </div>
      </div>

      {/* Avatar/Video Toggle */}
      <div className="display-controls riso-card">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={showAvatars}
            onChange={(e) => setShowAvatars(e.target.checked)}
          />
          <span className="toggle-text">Show Presence Avatars</span>
        </label>
        
        {showAvatars && (
          <div className="avatar-selector">
            <div className="selector-group">
              <label>Participant 1 Avatar:</label>
              <select 
                value={selectedAvatar1} 
                onChange={(e) => setSelectedAvatar1(e.target.value)}
                className="riso-select"
              >
                {avatarOptions.map(opt => (
                  <option key={opt.id} value={opt.url}>{opt.name}</option>
                ))}
              </select>
            </div>
            <div className="selector-group">
              <label>Participant 2 Avatar:</label>
              <select 
                value={selectedAvatar2} 
                onChange={(e) => setSelectedAvatar2(e.target.value)}
                className="riso-select"
              >
                {avatarOptions.map(opt => (
                  <option key={opt.id} value={opt.url}>{opt.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Display Area */}
      <div className="audience-display">
        {showAvatars ? (
          <div className="avatar-display">
            <div className="avatar-stage">
              {participant1Data.name && (
                <div className="avatar-booth">
                  <Canvas 
                    camera={{ 
                      position: [0, 0, 1.5], 
                      fov: 35
                    }}
                  >
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[0, 1, 2]} intensity={1.2} />
                    <Suspense fallback={null}>
                      <PresenceAvatar
                        avatarUrl={participant1Data.avatarUrl || selectedAvatar1}
                        trackingData={participant1Data.trackingData || undefined}
                        position={[0, -1.75, 0]}
                        scale={1.2}
                      />
                    </Suspense>
                  </Canvas>
                  <div className="participant-label">{participant1Data.name}</div>
                </div>
              )}
              
              {participant2Data.name && (
                <div className="avatar-booth">
                  <Canvas 
                    camera={{ 
                      position: [0, 0, 1.5], 
                      fov: 35
                    }}
                  >
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[0, 1, 2]} intensity={1.2} />
                    <Suspense fallback={null}>
                      <PresenceAvatar
                        avatarUrl={participant2Data.avatarUrl || selectedAvatar2}
                        trackingData={participant2Data.trackingData || undefined}
                        position={[0, -1.75, 0]}
                        scale={1.2}
                      />
                    </Suspense>
                  </Canvas>
                  <div className="participant-label">{participant2Data.name}</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="video-display">
            <div className="audience-video-grid">
              <div className="audience-video-wrapper">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="audience-video"
                />
                <div className="video-label">{participant1Data.name}</div>
              </div>
              
              {remoteStream && (
                <div className="audience-video-wrapper">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="audience-video"
                  />
                  <div className="video-label">{participant2Data.name}</div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Analytics Dashboard */}
        <AudienceAnalyticsDashboard
          participant1Stream={participant1Data.stream || undefined}
          participant2Stream={participant2Data.stream || undefined}
          participant1Name={participant1Data.name}
          participant2Name={participant2Data.name}
          roomId={roomId}
        />
      </div>
    </div>
  );
};

export default ConferenceBoothDemo;
