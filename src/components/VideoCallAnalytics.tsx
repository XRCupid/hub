import React, { useState, useRef, useEffect, useCallback } from 'react';
import FaceMesh from '@mediapipe/face_mesh';
import VideoCallAnalyzer from '../services/VideoCallAnalyzer';
import { HumeVoiceServiceWrapper } from '../services/HumeVoiceServiceWrapper';
import { EmotionScore, PostureScore, TranscriptEntry, AnalyticsSnapshot, VideoCallAnalyticsProps, CallReport, PerformanceMetrics, Recommendation } from '../types/VideoCallTypes';
import { Eye, Activity, TrendingUp, Heart, Users, Mic, MicOff, PhoneOff, Clock, MessageSquare, Award, Camera, Share2 } from 'lucide-react';
import Peer from 'simple-peer';
import QRCode from 'qrcode';
import { database } from '../firebaseConfig';
import { ref, push, set, onValue, get, update } from 'firebase/database';
import './VideoCallAnalytics.css';

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

export const VideoCallAnalytics: React.FC<VideoCallAnalyticsProps> = ({ onClose, partnerName = 'Partner' }) => {
  // Video call states
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [userVideo, setUserVideo] = useState<MediaStream | null>(null);
  const [partnerVideo, setPartnerVideo] = useState<MediaStream | null>(null);
  
  // Room management states
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [isInRoom, setIsInRoom] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Not connected');
  const [currentUserName, setCurrentUserName] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [guestName, setGuestName] = useState('');
  
  // WebRTC refs
  const peerRef = useRef<any>(null);
  const myPeerIdRef = useRef<string>('');
  const roomRef = useRef<string | null>(null);

  // Existing states
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSnapshot[]>([]);
  const [callReport, setCallReport] = useState<CallReport | null>(null);
  const [activeTab, setActiveTab] = useState<'emotions' | 'metrics' | 'recommendations' | 'summary'>('emotions');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const partnerVideoRef = useRef<HTMLVideoElement>(null);
  const voiceServiceRef = useRef<HumeVoiceServiceWrapper | null>(null);
  const analyticsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const webgazerRef = useRef<any>(null);
  const poseNetRef = useRef<any>(null);
  const faceMeshRef = useRef<any>(null);

  // Ensure video element gets the stream when available
  useEffect(() => {
    if (localStream && userVideoRef.current && isInRoom) {
      console.log('🔄 Applying stream to video element via useEffect');
      console.log('📺 Video element exists:', !!userVideoRef.current);
      console.log('🎬 Setting srcObject and adding event listeners');
      
      userVideoRef.current.srcObject = localStream;
      
      // Add event listeners for debugging
      userVideoRef.current.onloadedmetadata = () => {
        console.log('✅ Video metadata loaded, dimensions:', 
          userVideoRef.current?.videoWidth, 'x', userVideoRef.current?.videoHeight);
      };
      
      userVideoRef.current.oncanplay = () => {
        console.log('✅ Video can play');
      };
      
      userVideoRef.current.onplay = () => {
        console.log('✅ Video started playing');
      };
      
      userVideoRef.current.onerror = (e) => {
        console.error('❌ Video element error:', e);
      };
      
      // Force play
      userVideoRef.current.play().then(() => {
        console.log('✅ Video play() succeeded');
      }).catch(e => {
        console.log('UseEffect video play error:', e);
      });
    } else {
      console.log('🔍 Video setup conditions:', {
        hasLocalStream: !!localStream,
        hasVideoRef: !!userVideoRef.current,
        isInRoom: isInRoom
      });
    }
  }, [localStream, isInRoom]);

  // Initialize media streams
  const initializeMedia = async () => {
    try {
      console.log('🎥 Requesting camera access...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('❌ getUserMedia not supported');
        setConnectionStatus('Camera not supported');
        return null;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });
      
      console.log('✅ Camera access granted:', stream);
      console.log('📹 Video tracks:', stream.getVideoTracks());
      console.log('🎤 Audio tracks:', stream.getAudioTracks());
      console.log('🔍 Stream active:', stream.active);
      console.log('🔍 Video track enabled:', stream.getVideoTracks()[0]?.enabled);
      
      setLocalStream(stream);
      setUserVideo(stream);
      
      // FORCE VIDEO SETUP IMMEDIATELY - NO DELAYS OR CONDITIONS
      const forceVideoSetup = () => {
        console.log('🎯 FORCE: Setting up video element');
        const videoElement = document.querySelector('#user-video-element') as HTMLVideoElement;
        
        if (videoElement) {
          console.log('✅ FORCE: Video element found by ID');
          videoElement.srcObject = stream;
          videoElement.play().then(() => {
            console.log('✅ FORCE: Video playing successfully!');
          }).catch(e => {
            console.log('❌ FORCE: Video play failed:', e);
          });
        } else {
          console.log('❌ FORCE: Video element not found');
        }
      };
      
      // Try immediately
      forceVideoSetup();
      
      // Try again after 100ms
      setTimeout(forceVideoSetup, 100);
      
      // Try again after 500ms
      setTimeout(forceVideoSetup, 500);
      
      return stream;
    } catch (error: any) {
      console.error('❌ Failed to access media devices:', error);
      if (error.name === 'NotAllowedError') {
        setConnectionStatus('Camera permission denied');
      } else if (error.name === 'NotFoundError') {
        setConnectionStatus('No camera found');
      } else {
        setConnectionStatus('Camera access failed: ' + error.message);
      }
      return null;
    }
  };

  // Create a new room
  const createRoom = async () => {
    console.log('🔥 [CREATE ROOM] Button clicked!');
    console.log('🔥 [CREATE ROOM] localStream:', !!localStream);
    console.log('🔥 [CREATE ROOM] currentUserName:', currentUserName);
    console.log('🔥 [CREATE ROOM] database:', !!database);
    
    // Initialize camera if not available
    if (!localStream) {
      console.log('🎥 [CREATE ROOM] Initializing camera...');
      const stream = await initializeMedia();
      if (!stream) {
        alert('Camera access required to create a room');
        return;
      }
    }
    
    if (!currentUserName.trim()) {
      console.log('❌ [CREATE ROOM] Missing name:', currentUserName);
      alert('Please enter your name');
      return;
    }

    if (!database) {
      console.log('❌ [CREATE ROOM] Database is null');
      alert('Database connection failed. Please check your internet connection.');
      return;
    }

    console.log('Creating room...');
    try {
      const createdRoomId = (await push(ref(database, 'rooms'), {})).key;
      console.log('Room creation result:', createdRoomId);
      
      if (!createdRoomId) {
        alert('Failed to create room - no room ID returned');
        return;
      }

      // Set up room info like the working conference demo
      await set(ref(database, `rooms/${createdRoomId}/info`), {
        hostName: currentUserName,
        hostPeerId: myPeerIdRef.current,
        createdAt: Date.now(),
        isActive: true
      });

      // Clear old signals
      await set(ref(database, `rooms/${createdRoomId}/signals`), null);

      setRoomId(createdRoomId);
      roomRef.current = createdRoomId;
      setIsInRoom(true);
      setIsHost(true);
      setGuestName('');
      
      // Generate QR code
      const qrUrl = `https://xrcupid.github.io/hub#/video-analytics?room=${createdRoomId}`;
      console.log('🔗 QR URL:', qrUrl);
      try {
        const qr = await QRCode.toDataURL(qrUrl);
        setQrCodeUrl(qr);
      } catch (error) {
        console.error('QR generation failed:', error);
      }

      // Listen for guest joining (conference demo pattern)
      onValue(ref(database, `rooms/${createdRoomId}/guest`), (snapshot) => {
        const guestData = snapshot.val();
        if (guestData && !peerRef.current) {
          console.log('Guest joined, creating peer connection');
          setGuestName(guestData.name || 'Guest');
          createPeer(true, 'guest-peer');
        }
      });

      // Listen for signals from guest
      onValue(ref(database, `rooms/${createdRoomId}/signals`), (snapshot) => {
        const signals = snapshot.val();
        if (signals && signals['guest-peer'] && signals['guest-peer']['host-peer']) {
          const signal = signals['guest-peer']['host-peer'];
          if (peerRef.current && signal.timestamp > Date.now() - 30000) {
            console.log('🎯 [HOST] Received signal from guest:', signal);
            peerRef.current.signal(JSON.parse(signal.signal));
          }
        }
      });
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room. Please check your internet connection and try again.');
    }
  };

  // Join an existing room
  const joinRoom = async (roomId: string, userName: string) => {
    console.log('🔄 [JOIN] Starting room join process:', { roomId, userName });
    
    if (!roomId.trim() || !userName.trim()) {
      console.error('❌ [JOIN] Missing room ID or username');
      alert('Please enter your name and room ID');
      return;
    }

    const stream = await initializeMedia();
    if (!stream) {
      console.error('❌ [JOIN] Failed to initialize media');
      return;
    }

    console.log('✅ [JOIN] Media initialized, attempting to join room:', roomId);
    console.log('✅ [JOIN] Media initialized, attempting to join room:', roomId);
    
    // Add ourselves as guest (conference demo pattern)
    await set(ref(database, `rooms/${roomId}/guest`), {
      name: userName,
      peerId: myPeerIdRef.current,
      joinedAt: Date.now()
    });
    
    console.log('🔄 [JOIN] Successfully joined room as guest');
    
    setRoomId(roomId);
    roomRef.current = roomId;
    setIsInRoom(true);
    setIsHost(false);
    setCurrentUserName(userName);
    setConnectionStatus('Connecting to host...');

    // Get host name from room data
    const roomData = await get(ref(database, `rooms/${roomId}/info`));
    if (roomData.val()) {
      const hostName = roomData.val().hostName;
      if (hostName) {
        setGuestName(hostName);
      }
    }

    // Create peer connection
    createPeer(false, 'host-peer');

    // Listen for signals from host
    onValue(ref(database, `rooms/${roomId}/signals`), (snapshot) => {
      const signals = snapshot.val();
      if (signals && signals['host-peer'] && signals['host-peer']['guest-peer']) {
        const signal = signals['host-peer']['guest-peer'];
        if (peerRef.current && signal.timestamp > Date.now() - 30000) {
          console.log('🎯 [GUEST] Received signal from host:', signal);
          peerRef.current.signal(JSON.parse(signal.signal));
        }
      }
    });
  };

  // Create WebRTC peer connection
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
      if (roomRef.current) {
        console.log('📡 [PEER] Sending signal:', data);
        set(ref(database!, `rooms/${roomRef.current}/signals`), {
          [myPeerIdRef.current]: {
            [targetPeerId]: {
              signal: JSON.stringify(data),
              from: myPeerIdRef.current,
              timestamp: Date.now()
            }
          }
        });
      }
    });

    peer.on('connect', () => {
      setConnectionStatus('Connected');
      startCall();
    });

    peer.on('stream', (stream: MediaStream) => {
      console.log('Received remote stream');
      setRemoteStream(stream);
      setPartnerVideo(stream);
      if (partnerVideoRef.current) {
        partnerVideoRef.current.srcObject = stream;
      }
    });

    peer.on('close', () => {
      setConnectionStatus('Disconnected');
      endCall();
    });

    peer.on('error', (err: Error) => {
      console.error('Peer error:', err);
      setConnectionStatus('Connection error');
    });

    peerRef.current = peer;
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Leave room
  const leaveRoom = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    if (roomRef.current && currentUserName) {
      const participantsRef = ref(database, `rooms/${roomRef.current}/participants`);
      get(participantsRef).then((snapshot) => {
        if (snapshot.val()) {
          const updatedParticipants = snapshot.val().filter((p: string) => p !== currentUserName);
          update(participantsRef, updatedParticipants);
        }
      });
    }

    setIsInRoom(false);
    setConnectionStatus('Not connected');
    setRoomId('');
    setLocalStream(null);
    setRemoteStream(null);
    setUserVideo(null);
    setPartnerVideo(null);
    endCall();
  };

  // Check for room ID in URL on mount
  useEffect(() => {
    const urlHash = window.location.hash;
    console.log('🔍 [URL] Current hash:', urlHash);
    const roomMatch = urlHash.match(/[?&]room=([^&]+)/);
    if (roomMatch) {
      const roomFromUrl = roomMatch[1];
      console.log('✅ [URL] Found room in URL:', roomFromUrl);
      setJoinRoomId(roomFromUrl);
    }
  }, []);

  // Initialize video streams when call becomes active
  const initializeVideoStreams = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: true 
      });
      setUserVideo(stream);
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
      }
      
      // Initialize WebGazer with latest version (no conflicts!)
      if ((window as any).webgazer) {
        webgazerRef.current = (window as any).webgazer
          .setGazeListener((data: any, clock: number) => {
            // Process eye gaze data
          })
          .begin();
      }
      
      // Initialize PoseNet
      if ((window as any).ml5?.poseNet) {
        poseNetRef.current = (window as any).ml5.poseNet(userVideoRef.current, () => {
          console.log('PoseNet initialized');
        });
        poseNetRef.current.on('pose', (results: any) => {
          // Process pose data
        });
      }
      
      // Initialize FaceMesh for facial emotions
      if ((window as any).ml5?.faceMesh) {
        faceMeshRef.current = (window as any).ml5.faceMesh(userVideoRef.current, () => {
          console.log('FaceMesh initialized');
        });
        faceMeshRef.current.on('predict', (results: any) => {
          // Process facial emotion data
        });
      }
    } catch (error) {
      console.error('Failed to initialize video streams:', error);
    }
  };

  // Start the call
  const startCall = async () => {
    setIsCallActive(true);
    setCallStartTime(Date.now());
    setAnalyticsData([]);
    
    await initializeVideoStreams();
    
    // Start analytics collection
    analyticsIntervalRef.current = setInterval(() => {
      collectAnalyticsSnapshot();
    }, 100 as number); // Collect data every 100ms for smooth visualization
    
    // Initialize Hume voice service for prosody analysis
    voiceServiceRef.current = new HumeVoiceServiceWrapper();
    await voiceServiceRef.current.connect();
    
    // Set up voice event handlers using public API
    voiceServiceRef.current.onEmotion((emotions: any) => {
      // Handle real-time emotion updates
    });
    voiceServiceRef.current.onTranscript((transcript: any) => {
      // Handle transcript updates
    });
  };

  // End the call and generate report
  const endCall = async () => {
    setIsCallActive(false);
    
    // Stop analytics collection
    if (analyticsIntervalRef.current) {
      clearInterval(analyticsIntervalRef.current);
    }
    
    // Stop video streams
    if (userVideo) {
      userVideo.getTracks().forEach(track => track.stop());
    }
    
    // Stop tracking services
    if (webgazerRef.current) {
      webgazerRef.current.end();
    }
    
    // Disconnect voice service
    if (voiceServiceRef.current) {
      await voiceServiceRef.current.disconnect();
    }
    
    // Generate comprehensive report
    const report = await generateCallReport();
    setCallReport(report);
  };

  // Collect real-time analytics snapshot
  const collectAnalyticsSnapshot = () => {
    const userFaces = faceMeshRef.current?.results || [];
    const partnerFaces = faceMeshRef.current?.results || [];
    const userPose = poseNetRef.current?.results || [];
    const partnerPose = poseNetRef.current?.results || [];
    const userGaze = webgazerRef.current?.results || [];
    const partnerGaze = webgazerRef.current?.results || [];
    const userAudioData = voiceServiceRef.current?.getAudioData() || {};
    const partnerAudioData = voiceServiceRef.current?.getAudioData() || {};

    const snapshot: AnalyticsSnapshot = {
      timestamp: Date.now(),
      userEmotions: getCurrentEmotions(userFaces),
      partnerEmotions: getCurrentEmotions(partnerFaces),
      userPosture: calculatePostureScore(userPose),
      partnerPosture: calculatePostureScore(partnerPose),
      userEyeContact: isLookingAtCamera(userGaze),
      partnerEyeContact: isLookingAtCamera(partnerGaze),
      userSpeaking: isSpeaking(userAudioData),
      partnerSpeaking: isSpeaking(partnerAudioData),
      userVolume: (userAudioData && typeof userAudioData === 'object' && 'volume' in userAudioData) ? (userAudioData.volume as number) : 0,
      partnerVolume: (partnerAudioData && typeof partnerAudioData === 'object' && 'volume' in partnerAudioData) ? (partnerAudioData.volume as number) : 0,
    };
    
    setAnalyticsData(prev => [...prev, snapshot]);
  };

  // Generate comprehensive call report
  const generateCallReport = async (): Promise<CallReport> => {
    const analyzer = new VideoCallAnalyzer();
    
    // Initialize the analyzer with a call start
    analyzer.startCall();
    
    // Add all analytics data to analyzer
    analyticsData.forEach(snapshot => {
      analyzer.addAnalyticsSnapshot(snapshot);
    });
    
    // Get the full report from analyzer
    const analyzerReport = await analyzer.generateReport();
    
    // Map the analyzer report to our CallReport structure
    const report: CallReport = {
      overallScore: analyzerReport.overallChemistry,
      userMetrics: calculatePerformanceMetrics(analyticsData, 'user'),
      partnerMetrics: calculatePerformanceMetrics(analyticsData, 'partner'),
      chemistryScore: analyzerReport.overallChemistry,
      recommendations: analyzerReport.recommendations,
      aiSummary: analyzerReport.aiSummary.joint, // Use just the joint summary
      emotionTimeline: analyticsData.map(snapshot => ({
        time: snapshot.timestamp,
        engagement: 0.7, // Placeholder
        posture: (snapshot.userPosture.overall + snapshot.partnerPosture.overall) / 2,
        eyeContact: ((snapshot.userEyeContact ? 1 : 0) + (snapshot.partnerEyeContact ? 1 : 0)) / 2,
        emotions: snapshot.userEmotions
      })),
      transcript: analyzerReport.transcript
    };
    
    return report;
  };

  // Helper functions
  const getCurrentEmotions = (faces: any[]): EmotionScore[] => {
    if (!faces || faces.length === 0) return [];
    
    const face = faces[0];
    const emotions: EmotionScore[] = [];
    
    // Extract emotions from face mesh expressions
    if (face.expressions) {
      const emotionMap: Record<string, string> = {
        happy: 'joy',
        sad: 'sadness',
        angry: 'anger',
        surprised: 'surprise',
        disgusted: 'disgust',
        fearful: 'fear',
        neutral: 'neutral'
      };
      
      Object.entries(face.expressions).forEach(([emotion, score]) => {
        if (typeof score === 'number' && score > 0.1) {
          emotions.push({
            name: emotionMap[emotion] || emotion,
            score: score as number,
            color: getEmotionColor(emotionMap[emotion] || emotion)
          });
        }
      });
    }
    
    // Sort by score and return top 3
    return emotions.sort((a, b) => b.score - a.score).slice(0, 3);
  };

  const calculatePostureScore = (pose: any): PostureScore => {
    if (!pose || !pose.keypoints) {
      return { confidence: 0, alignment: 0, openness: 0, overall: 0 };
    }
    
    const keypoints = pose.keypoints;
    
    // Find key body points
    const nose = keypoints.find((kp: any) => kp.part === 'nose');
    const leftShoulder = keypoints.find((kp: any) => kp.part === 'leftShoulder');
    const rightShoulder = keypoints.find((kp: any) => kp.part === 'rightShoulder');
    const leftElbow = keypoints.find((kp: any) => kp.part === 'leftElbow');
    const rightElbow = keypoints.find((kp: any) => kp.part === 'rightElbow');
    
    // Calculate confidence based on keypoint confidence scores
    const avgConfidence = keypoints.reduce((sum: number, kp: any) => sum + kp.score, 0) / keypoints.length;
    
    // Calculate alignment (shoulders level)
    let alignment = 0;
    if (leftShoulder && rightShoulder) {
      const shoulderDiff = Math.abs(leftShoulder.position.y - rightShoulder.position.y);
      alignment = Math.max(0, 1 - shoulderDiff / 50); // Normalize difference
    }
    
    // Calculate openness (arms not crossed)
    let openness = 1; // Default to open
    if (leftElbow && rightElbow && leftShoulder && rightShoulder) {
      const shoulderWidth = Math.abs(leftShoulder.position.x - rightShoulder.position.x);
      const elbowDistance = Math.abs(leftElbow.position.x - rightElbow.position.x);
      
      // If elbows are closer than shoulders, posture is more closed
      if (elbowDistance < shoulderWidth * 0.8) {
        openness = elbowDistance / shoulderWidth;
      }
    }
    
    // Calculate overall score
    const overall = (avgConfidence * 0.3 + alignment * 0.3 + openness * 0.4);
    
    return {
      confidence: avgConfidence,
      alignment,
      openness,
      overall
    };
  };

  const isLookingAtCamera = (gazeData: any): boolean => {
    if (!gazeData || !userVideoRef.current) return false;
    
    const { x, y } = gazeData;
    const video = userVideoRef.current;
    const rect = video.getBoundingClientRect();
    
    // Check if gaze is within video bounds (with some margin)
    const margin = 50;
    return (
      x > rect.left - margin &&
      x < rect.right + margin &&
      y > rect.top - margin &&
      y < rect.bottom + margin
    );
  };

  const isSpeaking = (audioData: any): boolean => {
    if (!audioData || !audioData.volume) return false;
    
    // Simple volume threshold detection
    const SPEAKING_THRESHOLD = 0.02;
    return audioData.volume > SPEAKING_THRESHOLD;
  };

  const getAudioVolume = (audioData: any): number => {
    if (!audioData || !audioData.volume) return 0;
    return Math.min(audioData.volume, 1); // Normalize to 0-1
  };

  const getTranscript = (): TranscriptEntry[] => {
    if (!voiceServiceRef.current) return [];
    
    const messages = voiceServiceRef.current.getMessages();
    const transcript: TranscriptEntry[] = [];
    
    messages.forEach((message, index) => {
      if (message.type === 'user_message' || message.type === 'assistant_message') {
        transcript.push({
          speaker: message.type === 'user_message' ? 'user' : 'partner',
          text: message.message?.content || '',
          emotions: message.models?.prosody?.scores || [],
          timestamp: message.receivedAt || Date.now(),
          duration: 0 // Will be calculated from next message
        });
      }
    });
    
    // Calculate durations
    for (let i = 0; i < transcript.length - 1; i++) {
      transcript[i].duration = transcript[i + 1].timestamp - transcript[i].timestamp;
    }
    
    return transcript;
  };

  const getEmotionColor = (emotion: string): string => {
    const colors: Record<string, string> = {
      joy: '#FFD700',
      excitement: '#FF6B6B',
      interest: '#4ECDC4',
      surprise: '#FFE66D',
      contentment: '#98D8C8',
      love: '#FF69B4',
      sadness: '#6495ED',
      fear: '#9370DB',
      anger: '#DC143C',
      disgust: '#8B7355',
      contempt: '#696969',
      neutral: '#A0A0A0'
    };
    return colors[emotion] || '#A0A0A0';
  };

  const calculatePerformanceMetrics = (data: AnalyticsSnapshot[], participant: 'user' | 'partner'): PerformanceMetrics => {
    if (data.length === 0) {
      return {
        eyeContactPercentage: 0,
        postureScore: 0,
        speakingRatio: 0,
        responseTime: 1.5,
        emotionalEngagement: 0,
        activeListening: 0
      };
    }
    
    let eyeContactCount = 0;
    let avgPosture = 0;
    let speakingTime = 0;
    const emotionVariety = new Set<string>();
    
    data.forEach(snapshot => {
      const isUser = participant === 'user';
      
      if (isUser ? snapshot.userEyeContact : snapshot.partnerEyeContact) {
        eyeContactCount++;
      }
      
      avgPosture += isUser ? snapshot.userPosture.overall : snapshot.partnerPosture.overall;
      
      if (isUser ? snapshot.userSpeaking : snapshot.partnerSpeaking) {
        speakingTime++;
      }
      
      const emotions = isUser ? snapshot.userEmotions : snapshot.partnerEmotions;
      emotions.forEach(e => emotionVariety.add(e.name));
    });
    
    const totalFrames = data.length;
    const metrics = {
      eyeContactPercentage: (eyeContactCount / totalFrames) * 100,
      postureScore: avgPosture / totalFrames,
      speakingRatio: speakingTime / analyticsData.length,
      responseTime: 1.5, // Placeholder
      emotionalEngagement: emotionVariety.size / 10, // Normalize to 0-1
      activeListening: 0.7 // Placeholder
    };
    
    return metrics;
  };

  return (
    <div className="video-call-analytics">
      <h2>Video Call Analytics</h2>
      
      {/* SIMPLE VIDEO TEST - ALWAYS VISIBLE */}
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        zIndex: 9999,
        background: 'white',
        border: '3px solid #00ff00',
        borderRadius: '8px',
        padding: '10px'
      }}>
        <div>Camera Feed:</div>
        <video
          id="user-video-element"
          ref={userVideoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '200px',
            height: '150px',
            border: '2px solid black',
            objectFit: 'cover'
          }}
        />
        <div style={{ fontSize: '10px', marginTop: '5px' }}>
          {localStream ? 'CAMERA ACTIVE' : 'NO CAMERA'}
        </div>
      </div>

      {!isInRoom && (
        <div className="room-controls">
          <h2>Video Call Analytics Demo</h2>
          <div className="room-options">
            <div className="create-room">
              <h3>Create a Room</h3>
              <input
                type="text"
                placeholder="Your name"
                value={currentUserName}
                onChange={(e) => setCurrentUserName(e.target.value)}
              />
              <button onClick={() => createRoom()} disabled={!currentUserName}>
                Create Room
              </button>
            </div>
            
            <div className="divider">OR</div>
            
            <div className="join-room">
              <h3>Join a Room</h3>
              <input
                type="text"
                placeholder="Room ID"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
              />
              <input
                type="text"
                placeholder="Your name"
                value={currentUserName}
                onChange={(e) => setCurrentUserName(e.target.value)}
              />
              <button onClick={() => joinRoom(joinRoomId, currentUserName)} disabled={!joinRoomId || !currentUserName}>
                Join Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code display for room sharing */}
      {showQrCode && qrCodeUrl && (
        <div className="qr-code-modal">
          <div className="qr-content">
            <h3>Share Room</h3>
            <p>Room ID: {roomId}</p>
            <img src={qrCodeUrl} alt="Room QR Code" />
            <button onClick={() => setShowQrCode(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Main video call interface */}
      {isInRoom && (
        <div className="video-call-container">
          <div className="connection-status">
            <span className={`status-indicator ${connectionStatus === 'Connected' ? 'connected' : 'connecting'}`}></span>
            {connectionStatus}
          </div>

          <div className="video-grid">
            <div className="local-video-container" style={{ position: 'relative' }}>
              <video
                id="user-video-element"
                ref={userVideoRef}
                autoPlay
                muted
                playsInline
                className="local-video"
                style={{
                  width: '100%',
                  height: '300px',
                  border: '3px solid #00ff00',
                  borderRadius: '8px',
                  backgroundColor: '#000',
                  objectFit: 'cover'
                }}
              />
              <div className="video-label">You ({currentUserName})</div>
              <div className="video-debug" style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '5px',
                fontSize: '12px',
                borderRadius: '4px'
              }}>
                Stream: {localStream ? 'Active' : 'None'}<br/>
                Tracks: {localStream?.getVideoTracks().length || 0}
              </div>
              <div className="local-controls">
                <button onClick={toggleMute} className={`control-btn ${isMuted ? 'disabled' : ''}`}>
                  <Mic className={isMuted ? 'off' : ''} size={20} />
                </button>
                <button onClick={toggleVideo} className={`control-btn ${!isVideoEnabled ? 'disabled' : ''}`}>
                  <Camera className={isVideoEnabled ? '' : 'off'} size={20} />
                </button>
              </div>
            </div>

            <div className="remote-video-container">
              <video
                ref={partnerVideoRef}
                autoPlay
                playsInline
                className="remote-video"
              />
              {guestName && <div className="video-label">{guestName}</div>}
            </div>
          </div>

          {/* Call controls */}
          <div className="call-controls">
            <button className="end-call-btn" onClick={leaveRoom}>
              <PhoneOff size={24} />
              End Call
            </button>
            {isHost && (
              <button className="share-btn" onClick={() => setShowQrCode(true)}>
                <Share2 size={20} />
                Share Room
              </button>
            )}
          </div>

          {/* Analytics visualization */}
          {isCallActive && (
            <div className="analytics-panel">
              <h3>Live Analytics</h3>
              <div className="metrics-grid">
                <div className="metric">
                  <Eye size={16} />
                  <span>Eye Contact</span>
                  <div className="metric-value">
                    {analyticsData.length > 0 && analyticsData[analyticsData.length - 1].userEyeContact ? '✓' : '✗'}
                  </div>
                </div>
                <div className="metric">
                  <Users size={16} />
                  <span>Posture Score</span>
                  <div className="metric-value">
                    {analyticsData.length > 0 ? 
                      `${Math.round(analyticsData[analyticsData.length - 1].userPosture.overall * 100)}%` : 
                      '0%'
                    }
                  </div>
                </div>
                <div className="metric">
                  <Heart size={16} />
                  <span>Emotion</span>
                  <div className="metric-value">
                    {analyticsData.length > 0 && analyticsData[analyticsData.length - 1].userEmotions.length > 0 ? 
                      analyticsData[analyticsData.length - 1].userEmotions[0].name : 
                      'Neutral'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Call report display */}
      {callReport && <CallReportView report={callReport} onClose={() => setCallReport(null)} />}
    </div>
  );
};

// Separate component for the comprehensive report
const CallReportView: React.FC<{ report: CallReport; onClose: () => void }> = ({ report, onClose }) => {
  return (
    <div className="call-report">
      <div className="report-header">
        <h2>Call Analysis Report</h2>
        <button onClick={onClose} className="close-button">
          <PhoneOff size={20} />
        </button>
      </div>
      
      <div className="chemistry-score">
        <h3>Chemistry Score</h3>
        <div className="score-display">
          <div className="score-value">{Math.round(report.chemistryScore * 100)}%</div>
          <div className="score-label">Overall Chemistry</div>
        </div>
      </div>
      
      <div className="metrics-comparison">
        <div className="participant-metrics">
          <h4>Your Performance</h4>
          <MetricsList metrics={report.userMetrics} />
        </div>
        <div className="participant-metrics">
          <h4>Partner Performance</h4>
          <MetricsList metrics={report.partnerMetrics} />
        </div>
      </div>
      
      <div className="recommendations-section">
        <h3><Award className="icon" /> Recommendations</h3>
        {report.recommendations.map(rec => (
          <RecommendationCard key={rec.id} recommendation={rec} />
        ))}
      </div>
      
      <div className="ai-summary">
        <h3><MessageSquare className="icon" /> AI Summary</h3>
        <p>{report.aiSummary}</p>
      </div>
    </div>
  );
};

const MetricsList: React.FC<{ metrics: PerformanceMetrics }> = ({ metrics }) => {
  return (
    <div className="metrics-list">
      <div className="metric-item">
        <Eye className="metric-icon" />
        <span>Eye Contact: {Math.round(metrics.eyeContactPercentage)}%</span>
      </div>
      <div className="metric-item">
        <Users className="metric-icon" />
        <span>Posture Score: {(metrics.postureScore * 100).toFixed(0)}%</span>
      </div>
      <div className="metric-item">
        <Mic className="metric-icon" />
        <span>Speaking Ratio: {(metrics.speakingRatio * 100).toFixed(0)}%</span>
      </div>
      <div className="metric-item">
        <Heart className="metric-icon" />
        <span>Engagement: {(metrics.emotionalEngagement * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
};

const RecommendationCard: React.FC<{ recommendation: Recommendation }> = ({ recommendation }) => {
  const priorityColors = {
    high: '#FF6B6B',
    medium: '#FFD93D',
    low: '#4ECDC4'
  };
  
  return (
    <div className="recommendation-card">
      <div className="rec-header">
        <span className="rec-category">{recommendation.category}</span>
        <span 
          className="rec-priority" 
          style={{ backgroundColor: priorityColors[recommendation.priority] }}
        >
          {recommendation.priority}
        </span>
      </div>
      <h4>{recommendation.title}</h4>
      <p>{recommendation.description}</p>
      {recommendation.coach && (
        <div className="rec-coach">
          <span>Recommended Coach: {recommendation.coach}</span>
        </div>
      )}
    </div>
  );
};

export default VideoCallAnalytics;
