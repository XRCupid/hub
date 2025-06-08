import React, { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
import { database } from '../firebase';
import './VideoChat.css';

// ICE servers for NAT traversal
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

interface PeerData {
  peerId: string;
  peer: any;
  stream: MediaStream | null;
}

const RobustVideoChat: React.FC = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<PeerData[]>([]);
  const [roomId, setRoomId] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Not connected');
  const [currentUserName, setCurrentUserName] = useState('');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<PeerData[]>([]);
  const roomRef = useRef<string | null>(null);
  const myPeerIdRef = useRef<string>('');
  const remoteStreamsRef = useRef<{[key: string]: MediaStream}>({});

  // Generate unique user ID on mount
  useEffect(() => {
    myPeerIdRef.current = generateUserId();
  }, []);

  const generateUserId = () => {
    return 'user_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

  // Get user media
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
      setErrorMessage('');
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setErrorMessage('Failed to access camera and microphone. Please check permissions.');
    }
  };

  useEffect(() => {
    initializeMedia();
    
    return () => {
      // Cleanup
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Create a new room (host)
  const createRoom = () => {
    if (!localStream) {
      setErrorMessage('Camera and microphone access is required to create a room.');
      return;
    }
    
    if (!currentUserName.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }

    setErrorMessage('');
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    roomRef.current = newRoomId;
    setIsHost(true);
    
    // Create room in Firebase
    database.ref(`rooms/${newRoomId}`).set({
      createdAt: Date.now(),
      hostId: myPeerIdRef.current,
      hostName: currentUserName,
      hostLeft: false,
      guestLeft: false
    });
    
    // Listen for peers joining the room
    database.ref(`rooms/${newRoomId}/peers`).on('child_added', (snapshot: any) => {
      try {
        const peerData = snapshot.val();
        const peerId = snapshot.key;
        
        console.log('Host received peer data:', peerData, 'for peerId:', peerId);
        
        // Don't connect to yourself and ensure peerData is valid
        if (peerId !== myPeerIdRef.current && 
            peerData && 
            typeof peerData === 'object' && 
            peerData.signal && 
            typeof peerData.signal === 'string') {
          
          console.log("New peer joined:", peerId);
          
          // Create a new peer instance as the receiver (not initiator)
          const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: localStream,
            config: iceServers
          });
          
          // Set up stream listener BEFORE signaling
          peer.on('stream', (stream: MediaStream) => {
            console.log("Host received remote stream from peer:", peerId);
            
            // Store stream in ref to ensure it persists
            remoteStreamsRef.current[peerId] = stream;
            
            // Set remote video
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream;
            }
            
            setConnectionStatus('Connected');
            
            // Update peers state with stream
            setPeers(prevPeers => {
              const updatedPeers = prevPeers.map(p => {
                if (p.peerId === peerId) {
                  return { ...p, stream };
                }
                return p;
              });
              return updatedPeers;
            });
          });
          
          // Handle connection established
          peer.on('connect', () => {
            console.log("Connection established with peer:", peerId);
          });
          
          // When we get a signal, send it back
          peer.on('signal', (data: any) => {
            console.log("Host created return signal for peer");
            database.ref(`rooms/${newRoomId}/signals/${peerId}`).set({
              signal: JSON.stringify(data),
              from: myPeerIdRef.current,
              timestamp: Date.now()
            });
          });
          
          // Handle errors
          peer.on('error', (err: Error) => {
            console.error("Peer connection error:", err);
            setConnectionStatus('Connection failed');
          });
          
          try {
            // Process the incoming signal
            const parsedSignal = JSON.parse(peerData.signal);
            console.log("Host processing signal from guest:", parsedSignal);
            peer.signal(parsedSignal);
            
            // Add peer to our list
            const peerObj = { peerId, peer, stream: null };
            peersRef.current.push(peerObj);
            setPeers(prev => [...prev, peerObj]);
            setIsInRoom(true);
          } catch (parseErr) {
            console.error("Error parsing guest signal:", parseErr);
          }
        } else {
          console.log('Host ignoring invalid peer data:', peerData, 'for peerId:', peerId);
        }
      } catch (err) {
        console.error('Error in host peer listener:', err);
      }
    });
    
    setIsInRoom(true);
    setConnectionStatus('Waiting for guest...');
  };

  // Join an existing room (guest)
  const joinRoom = () => {
    if (!localStream) {
      setErrorMessage('Camera and microphone access is required to join a room.');
      return;
    }
    
    if (!roomId.trim()) {
      setErrorMessage('Please enter a room ID.');
      return;
    }

    if (!currentUserName.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }

    // Clear any existing peers first
    peersRef.current.forEach(peerObj => {
      if (peerObj.peer) {
        peerObj.peer.destroy();
      }
    });
    peersRef.current = [];
    setPeers([]);
    
    const roomReference = database.ref(`rooms/${roomId}`);
    
    // First, check if room exists and get initial data
    roomReference.once('value', (snapshot: any) => {
      try {
        const roomData = snapshot.val();
        console.log('Initial room data check:', roomData);
        
        if (!roomData || typeof roomData !== 'object') {
          setErrorMessage('Room does not exist.');
          return;
        }

        // Check if anyone has left the room
        if (roomData.hostLeft || roomData.guestLeft) {
          setErrorMessage('The conversation has ended. This room is no longer active.');
          return;
        }
        
        roomRef.current = roomId;
        const hostId = roomData.hostId;
        setIsHost(false);
        
        // Create peer instance ONLY ONCE when joining
        const peer = new Peer({
          initiator: true,
          trickle: false,
          stream: localStream,
          config: iceServers
        });
        
        // Set up stream handler BEFORE signaling
        peer.on('stream', (stream: MediaStream) => {
          console.log("Guest received remote stream from host");
          // Store stream in ref
          remoteStreamsRef.current[hostId] = stream;
          
          // Set remote video
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
          
          setConnectionStatus('Connected');
        });
        
        // Handle connection established
        peer.on('connect', () => {
          console.log("Connection established with host");
        });
        
        // Handle errors
        peer.on('error', (err: Error) => {
          console.error("Peer connection error:", err);
          setConnectionStatus('Connection failed');
        });
        
        // When we generate a signal, send it to the host
        peer.on('signal', (data: any) => {
          console.log("Guest sending signal to host");
          database.ref(`rooms/${roomId}/peers/${myPeerIdRef.current}`).set({
            signal: JSON.stringify(data),
            userId: myPeerIdRef.current,
            guestName: currentUserName,
            timestamp: Date.now()
          });
        });
        
        // Create a peer object with empty stream initially
        const peerObj = { peerId: hostId, peer, stream: null };
        
        // Store peer reference
        peersRef.current.push(peerObj);
        setPeers([peerObj]);
        
        // Listen for signal response from host
        const signalRef = database.ref(`rooms/${roomId}/signals/${myPeerIdRef.current}`);
        signalRef.on('value', (snapshot: any) => {
          try {
            const signalData = snapshot.val();
            console.log('Guest received signal data:', signalData);
            
            // More robust null checking
            if (signalData && 
                typeof signalData === 'object' && 
                signalData.signal && 
                typeof signalData.signal === 'string') {
              try {
                // Process the host's signal
                const parsedSignal = JSON.parse(signalData.signal);
                console.log('Guest processing parsed signal:', parsedSignal);
                peer.signal(parsedSignal);
                setIsInRoom(true);
              } catch (parseErr) {
                console.error("Error parsing host signal:", parseErr);
              }
            } else {
              console.log('Guest ignoring invalid/null signal data:', signalData);
            }
          } catch (err) {
            console.error("Error in guest signal listener:", err);
          }
        });

        // NOW set up room data monitoring (separate from peer creation)
        roomReference.on('value', (snapshot: any) => {
          try {
            const updatedRoomData = snapshot.val();
            console.log('Room data update monitoring:', updatedRoomData);
            
            if (!updatedRoomData || typeof updatedRoomData !== 'object') {
              setErrorMessage('Room no longer exists.');
              return;
            }

            // Check if anyone has left the room
            if (updatedRoomData.hostLeft || updatedRoomData.guestLeft) {
              setErrorMessage('The conversation has ended. This room is no longer active.');
              // Clean up peer connections
              peersRef.current.forEach(peerObj => {
                if (peerObj.peer) {
                  peerObj.peer.destroy();
                }
              });
              peersRef.current = [];
              setPeers([]);
              return;
            }
          } catch (err) {
            console.error("Error in room data listener:", err);
          }
        });

        setConnectionStatus('Connecting...');
        
      } catch (err) {
        console.error("Error in initial room check:", err);
        setErrorMessage('Failed to join room. Please try again.');
      }
    });
  };

  // Leave room
  const leaveRoom = async () => {
    if (roomRef.current) {
      // Mark as left in Firebase
      if (isHost) {
        await database.ref(`rooms/${roomRef.current}/hostLeft`).set(true);
      } else {
        await database.ref(`rooms/${roomRef.current}/guestLeft`).set(true);
      }
      
      // Clean up peers
      peersRef.current.forEach(peerData => {
        if (peerData.peer) {
          peerData.peer.destroy();
        }
      });
      
      // Reset state
      peersRef.current = [];
      remoteStreamsRef.current = {};
      setPeers([]);
      setIsInRoom(false);
      setIsHost(false);
      setRoomId('');
      roomRef.current = null;
      setConnectionStatus('Not connected');
      
      // Clear remote video
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Robust WebRTC Video Chat</h1>
      
      {!isInRoom ? (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label>Your Name: </label>
            <input
              type="text"
              value={currentUserName}
              onChange={(e) => setCurrentUserName(e.target.value)}
              placeholder="Enter your name"
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <button
              onClick={createRoom}
              disabled={!localStream || !currentUserName.trim()}
              style={{ 
                padding: '10px 20px', 
                marginRight: '10px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Create Room
            </button>
            
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID to join"
              style={{ padding: '8px', marginRight: '10px' }}
            />
            
            <button
              onClick={joinRoom}
              disabled={!localStream || !roomId.trim() || !currentUserName.trim()}
              style={{ 
                padding: '10px 20px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Join Room
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '20px' }}>
          <p><strong>Room ID:</strong> {roomRef.current}</p>
          <p><strong>Role:</strong> {isHost ? 'Host' : 'Guest'}</p>
          <p><strong>Status:</strong> {connectionStatus}</p>
          
          <button
            onClick={leaveRoom}
            style={{ 
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Leave Room
          </button>
        </div>
      )}

      {errorMessage && (
        <div style={{ 
          color: 'red', 
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: '#ffebee',
          border: '1px solid #e57373',
          borderRadius: '4px'
        }}>
          {errorMessage}
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h3>Your Video</h3>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            style={{ 
              width: '300px', 
              height: '200px', 
              backgroundColor: '#f0f0f0',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        
        <div>
          <h3>Remote Video</h3>
          <video
            ref={remoteVideoRef}
            autoPlay
            style={{ 
              width: '300px', 
              height: '200px', 
              backgroundColor: '#f0f0f0',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default RobustVideoChat;
