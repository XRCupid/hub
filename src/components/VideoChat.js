import React, { useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer';
import { database } from '../firebase';
import EmotionAnalysis from './EmotionAnalysis';
import ConversationSummary from './ConversationSummary';
import './VideoChat.css';

// ICE servers for NAT traversal
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

const VideoChat = () => {
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionStatus] = useState('');
  const [showEmotionAnalysis, setShowEmotionAnalysis] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [detectedTopics, setDetectedTopics] = useState([]);
  const [emotionKeywords, setEmotionKeywords] = useState({});
  
  const userVideoRef = useRef(null);
  const peersRef = useRef([]);
  const roomRef = useRef(null);
  const myPeerIdRef = useRef(null);
  
  // Set a unique user ID when component mounts
  useEffect(() => {
    myPeerIdRef.current = generateUserId();
  }, []);
  
  // Generate a unique user ID
  const generateUserId = () => {
    return 'user_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };
  
  // Global refs to store stream data
  const remoteStreamsRef = useRef({});
  
  // Initialize media streams
  useEffect(() => {
    let currentStream; 
    
    navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    })
      .then((stream) => {
        setLocalStream(stream);
        currentStream = stream; 
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }
      })
      .catch((error) => {
        console.error('Error accessing media devices:', error);
        setErrorMessage('Could not access camera or microphone. Please check your permissions.');
      });

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      leaveRoom(false);
    };
  }, []);

  // Toggle audio based on isMuted state
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  // Toggle video based on isVideoOff state
  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOff;
      });
    }
  }, [isVideoOff, localStream]);

  // Monitor room for other user leaving
  useEffect(() => {
    if (isInRoom && roomRef.current) {
      const roomReference = database.ref(`rooms/${roomRef.current}`);
      
      const unsubscribe = roomReference.on('value', (snapshot) => {
        if (!snapshot.exists()) {
          // Room was deleted (probably by host)
          console.log("Room no longer exists");
          
          handleRemoteUserLeft();
          return;
        }
        
        const roomData = snapshot.val();
        
        // Check if we're the host or guest
        const isHost = roomData.hostId === myPeerIdRef.current;
        
        // Check if the other user left
        if ((isHost && roomData.guestLeft) || (!isHost && roomData.hostLeft)) {
          console.log("Other user left flag detected:", isHost ? "guest left" : "host left");
          
          handleRemoteUserLeft();
        }
      });
      
      // Return cleanup function
      return () => {
        console.log("Cleaning up room monitoring");
        unsubscribe();
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInRoom]);

  // Handler for when the remote user leaves
  const handleRemoteUserLeft = () => {
    console.log("Remote user has left");
    
    // Small delay to ensure we have latest data
    setTimeout(() => {
      // Show notification to the user
      setErrorMessage('The other user has left the conversation.');
    }, 1000);
  };

  // Join an existing room
  const joinRoom = () => {
    if (!localStream) {
      setErrorMessage('Camera and microphone access is required to join a room.');
      return;
    }
    
    if (!roomId.trim()) {
      setErrorMessage('Please enter a room ID.');
      return;
    }
    
    const roomReference = database.ref(`rooms/${roomId}`);
    roomReference.once('value', (snapshot) => {
      const roomData = snapshot.val();
      if (!roomData) {
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
      
      // Create a peer instance as the initiator
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: localStream,
        config: iceServers
      });
      
      // Set up stream handler BEFORE signaling
      peer.on('stream', (stream) => {
        // Store stream in ref
        remoteStreamsRef.current[hostId] = stream;
        
        // Update peers state with stream
        setPeers(prevPeers => {
          const updatedPeers = prevPeers.map(p => {
            if (p.peerId === hostId) {
              return { ...p, stream };
            }
            return p;
          });
          return updatedPeers;
        });
      });
      
      // Handle connection established
      peer.on('connect', () => {
        console.log("Connection established with host");
      });
      
      // Handle errors
      peer.on('error', (err) => {
        console.error("Peer connection error:", err);
      });
      
      // When we generate a signal, send it to the host
      peer.on('signal', (data) => {
        database.ref(`rooms/${roomId}/peers/${myPeerIdRef.current}`).set({
          signal: JSON.stringify(data),
          userId: myPeerIdRef.current,
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
      signalRef.on('value', (snapshot) => {
        const signalData = snapshot.val();
        if (signalData && signalData.signal) {
          try {
            // Process the host's signal
            peer.signal(JSON.parse(signalData.signal));
            setIsInRoom(true);
          } catch (err) {
            console.error("Error processing host signal:", err);
          }
        }
      });
    });
  };

  // Create a new room
  const createRoom = () => {
    if (!localStream) {
      setErrorMessage('Camera and microphone access is required to create a room.');
      return;
    }
    
    setErrorMessage('');
    const newRoomId = Math.random().toString(36).substring(2, 9);
    setRoomId(newRoomId);
    roomRef.current = newRoomId;
    
    // Create room in Firebase with left flags initialized to false
    database.ref(`rooms/${newRoomId}`).set({
      createdAt: Date.now(),
      hostId: myPeerIdRef.current,
      hostLeft: false,
      guestLeft: false
    });
    
    // Listen for peers joining the room
    const peersReference = database.ref(`rooms/${newRoomId}/peers`);
    
    peersReference.on('child_added', (snapshot) => {
      const peerData = snapshot.val();
      const peerId = snapshot.key;
      
      // Don't connect to yourself
      if (peerId !== myPeerIdRef.current && peerData.signal) {
        console.log("New peer joined:", peerId);
        
        // Create a new peer instance as the receiver
        const peer = new Peer({
          initiator: false,
          trickle: false,
          stream: localStream,
          config: iceServers
        });
        
        // Set up stream listener BEFORE signaling
        peer.on('stream', (stream) => {
          console.log("Received remote stream from peer:", peerId);
          console.log("Stream has tracks:", stream.getTracks().length);
          
          // Store stream in ref to ensure it persists
          remoteStreamsRef.current[peerId] = stream;
          
          // Update peers state with the new stream
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
        peer.on('signal', (data) => {
          console.log("Host created return signal for peer");
          database.ref(`rooms/${newRoomId}/signals/${peerId}`).set({
            signal: JSON.stringify(data),
            from: myPeerIdRef.current,
            timestamp: Date.now()
          });
        });
        
        // Handle errors
        peer.on('error', (err) => {
          console.error("Peer connection error:", err);
        });
        
        try {
          // Process the incoming signal
          peer.signal(JSON.parse(peerData.signal));
          
          // Store the peer reference with stream
          const peerObj = { peerId, peer, stream: remoteStreamsRef.current[peerId] };
          peersRef.current.push(peerObj);
          
          // Update the state with the new peer
          setPeers(prevPeers => [...prevPeers, peerObj]);
        } catch (err) {
          console.error("Error processing peer signal:", err);
        }
      }
    });
    
    // Listen for peers leaving the room
    peersReference.on('child_removed', (snapshot) => {
      const peerId = snapshot.key;
      console.log("Peer left:", peerId);
      
      // Clean up the associated peer
      const peerObj = peersRef.current.find(p => p.peerId === peerId);
      if (peerObj && peerObj.peer) {
        peerObj.peer.destroy();
      }
      
      // Remove from our refs
      peersRef.current = peersRef.current.filter(p => p.peerId !== peerId);
      delete remoteStreamsRef.current[peerId];
      
      // Update state
      setPeers(prevPeers => prevPeers.filter(p => p.peerId !== peerId));
    });
    
    setIsInRoom(true);
  };

  // Copy room ID to clipboard
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Leave room and cleanup connections/data
  const leaveRoom = (showSummaryPage = true) => {
    if (roomRef.current) {
      const roomReference = database.ref(`rooms/${roomRef.current}`);
      roomReference.once('value', (snapshot) => {
        const roomData = snapshot.val();
        if (roomData) {
          if (roomData.hostId === myPeerIdRef.current) {
            // We're the host, update the hostLeft flag
            roomReference.update({
              hostLeft: true,
              leftAt: Date.now()
            }).then(() => {
              // After updating, remove the entire room after a delay
              // This delay gives the other user time to receive the notification
              setTimeout(() => {
                roomReference.remove();
              }, 10000);
            });
          } else {
            // We're a guest, update the guestLeft flag
            roomReference.update({
              guestLeft: true,
              leftAt: Date.now()
            });
            
            // Also remove our peer data
            database.ref(`rooms/${roomRef.current}/peers/${myPeerIdRef.current}`).remove();
            database.ref(`rooms/${roomRef.current}/signals/${myPeerIdRef.current}`).remove();
          }
        }
      });
      
      // Clean up all peer connections
      peersRef.current.forEach(({ peer }) => {
        if (peer) {
          peer.destroy();
        }
      });
      
      // Reset everything
      peersRef.current = [];
      remoteStreamsRef.current = {};
      setPeers([]);
      setIsInRoom(false);
      
      if (!showSummaryPage) {
        window.location.reload();
      }
    }
  };

  // Toggle mute state for audio
  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  // Toggle video state
  const toggleVideo = () => {
    setIsVideoOff(prev => !prev);
  };
  
  // Method to get a remote stream for emotion analysis
  const getRemoteStream = () => {
    // Try to find the first peer with a valid stream
    const peerWithStream = peers.find(peer => peer.stream);
    return peerWithStream ? peerWithStream.stream : null;
  };
  
  // Render the remote video component
  const RemoteVideo = ({ peer }) => {
    const videoRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const streamRef = useRef(null);
    const playAttemptRef = useRef(null);
    const mountedRef = useRef(true);
  
    // Clean up function to handle unmounting
    useEffect(() => {
      return () => {
        mountedRef.current = false;
        if (playAttemptRef.current) {
          clearTimeout(playAttemptRef.current);
        }
      };
    }, []);
  
    // Use a separate effect to track the stream
    useEffect(() => {
      // Store the stream in our ref
      streamRef.current = peer.stream;
  
      // Clean up function
      return () => {
        if (playAttemptRef.current) {
          clearTimeout(playAttemptRef.current);
        }
      };
    }, [peer.stream]);
  
    // Use a separate useEffect for video element handling to avoid race conditions
    useEffect(() => {
      const videoElement = videoRef.current;
      const stream = streamRef.current;
      
      // Only proceed if we have both video element and stream
      if (!videoElement || !stream) return;
      
      // Check if stream has changed
      if (videoElement.srcObject !== stream) {
        videoElement.srcObject = stream;
      }
      
      // Define a function to handle playback
      const attemptPlay = () => {
        if (!mountedRef.current) return;
        
        if (videoElement.paused) {
          const playPromise = videoElement.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                if (mountedRef.current) {
                  setConnected(true);
                }
              })
              .catch(err => {
                // Only retry if component is still mounted and error is AbortError
                if (mountedRef.current && err.name === 'AbortError') {
                  // Schedule retry with delay
                  playAttemptRef.current = setTimeout(attemptPlay, 1000);
                }
              });
          }
        } else {
          // Video is already playing
          if (mountedRef.current) {
            setConnected(true);
          }
        }
      };
      
      // Add event listeners to help with playback
      const handleCanPlay = () => {
        attemptPlay();
      };
      
      const handleLoadedMetadata = () => {
        attemptPlay();
      };
      
      // Add event listeners
      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      // Attempt to play right away
      attemptPlay();
      
      // Cleanup function
      return () => {
        videoElement.removeEventListener('canplay', handleCanPlay);
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        
        if (playAttemptRef.current) {
          clearTimeout(playAttemptRef.current);
        }
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  
    return (
        <div className="video-wrapper">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="video-player"
            style={{
              width: '100%',
              height: '100%'
            }}
          />
          {!connected && (
            <div className="connection-status">
              {peer.stream ? 'Connecting...' : 'Waiting for stream...'}
            </div>
          )}
        </div>
    );
  };

  const toggleEmotionAnalysis = () => {
    setShowEmotionAnalysis(prev => !prev);
  };

  return (
    <div className="video-chat-container">
      <h1>XRCupid</h1>
      
      {errorMessage && (
        <div className="error-message">{errorMessage}</div>
      )}

      <div className="video-container">
        <div className="video-box">
          <h2>You</h2>
          <video
            ref={userVideoRef}
            autoPlay
            muted
            playsInline
            className={`video-player ${isVideoOff ? 'video-off' : ''}`}
          />
          {isVideoOff && (
            <p className="text-small">Camera Off</p>
          )}
        </div>
        
        {peers.length === 0 && isInRoom && (
          <div className="video-box empty">
            <h2>Remote User</h2>
            <p className="text-small">Waiting for someone to join...</p>
          </div>
        )}
        
        {peers.map((peer) => (
          <div key={peer.peerId} className="video-box">
            <h2>Remote User</h2>
            <RemoteVideo peer={peer} />
          </div>
        ))}
      </div>

      {/* Emotion Analysis Section */}
      {showEmotionAnalysis && (
        <div className="emotion-analysis-section">
          {!process.env.REACT_APP_HUME_API_KEY ? (
            <div className="api-key-form">
              <h3>Emotion Analysis Configuration Error</h3>
              <p className="error-text">
                Emotion analysis is not available. Please contact support.
              </p>
            </div>
          ) : (
            <EmotionAnalysis
              localStream={localStream}
              remoteStream={getRemoteStream()}
              apiKey={process.env.REACT_APP_HUME_API_KEY}
              roomId={roomRef.current}
              userId={myPeerIdRef.current}
              onEmotionDataUpdate={(data) => {
                setSummaryData(data.summaryData);
                setDetectedTopics(data.summaryData.topics || []);
                setEmotionKeywords(data.summaryData.user1.keywords || {});
              }}
            />
          )}
        </div>
      )}

      <div className="controls-container">
        {!isInRoom ? (
          <div className="room-controls">
            <button onClick={createRoom} className="btn-primary">
              Create New Room
            </button>
            <div className="room-join">
              <input
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="form-control"
              />
              <button onClick={joinRoom} className="btn-primary">
                Join Room
              </button>
            </div>
          </div>
        ) : (
          <div className="connected-controls">
            {roomId && (
              <div className="room-info">
                <p>
                  Room ID: <span className="room-id-text">{roomId}</span>
                </p>
                <button onClick={copyRoomId} className="btn-secondary">
                  {isCopied ? 'Copied!' : 'Copy Room ID'}
                </button>
                <p className="info-text">
                  Share this ID with someone to join your room
                </p>
              </div>
            )}
            <div className="media-controls">
              <button
                onClick={toggleMute}
                className={`btn-secondary ${isMuted ? 'active' : ''}`}
              >
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button
                onClick={toggleVideo}
                className={`btn-secondary ${isVideoOff ? 'active' : ''}`}
              >
                {isVideoOff ? 'Turn On Camera' : 'Turn Off Camera'}
              </button>
              <button
                onClick={toggleEmotionAnalysis}
                className={`btn-secondary ${showEmotionAnalysis ? 'active' : ''}`}
              >
                {showEmotionAnalysis ? 'Hide Emotions' : 'Show Emotions'}
              </button>
              <button onClick={() => leaveRoom(true)} className="btn-primary">
                Leave Room
              </button>
            </div>
          </div>
        )}
      </div>
      {showSummary && <ConversationSummary data={summaryData} topics={detectedTopics} emotions={emotionKeywords} />}
    </div>
  );
};

export default VideoChat;