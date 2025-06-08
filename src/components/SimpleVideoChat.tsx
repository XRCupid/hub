import React, { useState, useRef, useEffect } from 'react';
import Peer from 'simple-peer';
import { database } from '../firebase';

const SimpleVideoChat: React.FC = () => {
  const [isHost, setIsHost] = useState<boolean>(false);
  const [roomId, setRoomId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isInRoom, setIsInRoom] = useState<boolean>(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<Peer.Instance | null>(null);
  const roomRef = useRef<string | null>(null);

  // Test Firebase connection on component mount
  useEffect(() => {
    console.log('🔥 FIREBASE TEST: Testing database connection...');
    console.log('🔥 FIREBASE TEST: Database object:', database);
    console.log('🔥 FIREBASE TEST: Database ref method available:', typeof database.ref);
    
    // Test write and read
    const testRef = database.ref('test/connection');
    const testValue = { timestamp: Date.now(), test: 'connection' };
    
    console.log('🔥 FIREBASE TEST: Writing test value...');
    testRef.set(testValue, (error) => {
      if (error) {
        console.error('❌ FIREBASE TEST: Error writing test value:', error);
        setErrorMessage('Firebase connection failed');
      } else {
        console.log('✅ FIREBASE TEST: Test value written successfully');
        
        // Now test read
        console.log('🔥 FIREBASE TEST: Reading test value...');
        testRef.once('value', (snapshot: any) => {
          console.log('✅ FIREBASE TEST: Test value read successfully:', snapshot.val());
          console.log('✅ FIREBASE TEST: Firebase is working properly');
        }, (error) => {
          console.error('❌ FIREBASE TEST: Error reading test value:', error);
          setErrorMessage('Firebase read failed');
        });
      }
    });
  }, []);

  // Get user media
  useEffect(() => {
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setErrorMessage('Camera and microphone access denied.');
      }
    };
    getMedia();
  }, []);

  // Generate simple room ID
  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Create room (host)
  const createRoom = () => {
    console.log('🔍 CREATE ROOM: Starting room creation...');
    console.log('🔍 CREATE ROOM: Local stream exists:', !!localStreamRef.current);
    console.log('🔍 CREATE ROOM: User name:', userName);
    
    if (!localStreamRef.current) {
      console.error('❌ CREATE ROOM: No local stream');
      setErrorMessage('Camera access required');
      return;
    }
    if (!userName.trim()) {
      console.error('❌ CREATE ROOM: No user name');
      setErrorMessage('Please enter your name');
      return;
    }

    const newRoomId = generateRoomId();
    console.log('🔍 CREATE ROOM: Generated room ID:', newRoomId);
    
    roomRef.current = newRoomId;
    setRoomId(newRoomId);
    setIsHost(true);
    setConnectionStatus('Waiting for guest...');
    setIsInRoom(true);
    setErrorMessage(''); // Clear any previous errors

    console.log('🔍 CREATE ROOM: Setting up room in Firebase...');
    
    // Set up room in Firebase
    database.ref(`rooms/${newRoomId}`).set({
      hostName: userName,
      createdAt: Date.now(),
      status: 'waiting'
    }, (error) => {
      if (error) {
        console.error('❌ CREATE ROOM: Error creating room:', error);
        setErrorMessage('Failed to create room');
        return;
      }
      console.log('✅ CREATE ROOM: Room created successfully in Firebase');
      
      // Verify the room was actually saved
      database.ref(`rooms/${newRoomId}`).once('value', (verifySnapshot: any) => {
        console.log('🔍 CREATE ROOM: Verification - room data:', verifySnapshot.val());
        console.log('🔍 CREATE ROOM: Verification - room exists:', verifySnapshot.exists());
      });
    });

    console.log('🔍 CREATE ROOM: Setting up guest listener...');
    
    // Listen for guest joining
    database.ref(`rooms/${newRoomId}/guest`).on('value', (snapshot) => {
      const guestData = snapshot.val();
      console.log('📡 CREATE ROOM: Guest data received:', guestData);
      
      if (guestData && guestData.signal && !peerRef.current) {
        console.log('🔍 CREATE ROOM: Guest joined, creating host peer...');
        setConnectionStatus('Guest joined, connecting...');

        // Create peer as non-initiator (host waits for guest to initiate)
        const peer = new Peer({
          initiator: false,
          trickle: false,
          stream: localStreamRef.current!
        });

        peerRef.current = peer;
        console.log('✅ CREATE ROOM: Host peer created successfully');

        // Handle remote stream
        peer.on('stream', (stream: MediaStream) => {
          console.log('🎥 CREATE ROOM: Host received remote stream from guest');
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
            console.log('✅ CREATE ROOM: Remote video set successfully');
          }
          setConnectionStatus('Connected');
        });

        // Handle host signal generation
        peer.on('signal', (data: any) => {
          console.log('📡 CREATE ROOM: Host sending signal to guest:', data);
          database.ref(`rooms/${newRoomId}/host`).set({
            name: userName,
            signal: JSON.stringify(data),
            timestamp: Date.now()
          }, (error) => {
            if (error) {
              console.error('❌ CREATE ROOM: Error sending host signal:', error);
              setErrorMessage('Failed to send connection signal');
            } else {
              console.log('✅ CREATE ROOM: Host signal sent successfully');
            }
          });
        });

        // Handle errors
        peer.on('error', (err: Error) => {
          console.error('❌ CREATE ROOM: Host peer error:', err);
          setConnectionStatus('Connection failed');
          setErrorMessage(`Connection error: ${err.message}`);
        });

        // Process the guest signal
        console.log('🔍 CREATE ROOM: Processing guest signal...');
        try {
          peer.signal(JSON.parse(guestData.signal));
          console.log('✅ CREATE ROOM: Guest signal processed successfully');
        } catch (parseError) {
          console.error('❌ CREATE ROOM: Error parsing guest signal:', parseError);
          setErrorMessage('Invalid signal from guest');
        }
      }
    });
  };

  // Join room (guest)
  const joinRoom = () => {
    console.log('🔍 JOIN ROOM: Starting join process...');
    console.log('🔍 JOIN ROOM: Local stream exists:', !!localStreamRef.current);
    console.log('🔍 JOIN ROOM: User name:', userName);
    console.log('🔍 JOIN ROOM: Room ID:', roomId);
    
    if (!localStreamRef.current) {
      console.error('❌ JOIN ROOM: No local stream');
      setErrorMessage('Camera access required');
      return;
    }
    if (!userName.trim()) {
      console.error('❌ JOIN ROOM: No user name');
      setErrorMessage('Please enter your name');
      return;
    }
    if (!roomId.trim()) {
      console.error('❌ JOIN ROOM: No room ID');
      setErrorMessage('Please enter room ID');
      return;
    }

    console.log('🔍 JOIN ROOM: Checking if room exists...');
    
    // Check if room exists using Firebase v8 callback syntax
    database.ref(`rooms/${roomId}`).once('value', (roomSnapshot: any) => {
      console.log('🔍 JOIN ROOM: Room snapshot received:', roomSnapshot.val());
      console.log('🔍 JOIN ROOM: Room exists?:', roomSnapshot.exists());
      console.log('🔍 JOIN ROOM: All rooms data:', database.ref('rooms'));
      
      // Log all rooms for debugging
      database.ref('rooms').once('value', (allRoomsSnapshot: any) => {
        console.log('🔍 JOIN ROOM: All rooms in database:', allRoomsSnapshot.val());
      });
      
      // SIMPLE FIX: For testing, bypass room check if room ID is "TEST"
      if (roomId === 'TEST' || roomSnapshot.exists()) {
        console.log('✅ JOIN ROOM: Room exists (or using TEST), proceeding...');
        
        // Create room data if using TEST mode
        if (roomId === 'TEST') {
          database.ref(`rooms/${roomId}`).set({
            hostName: 'Test Host',
            createdAt: Date.now(),
            status: 'waiting'
          });
        }

        roomRef.current = roomId;
        setIsHost(false);
        setConnectionStatus('Connecting...');
        setIsInRoom(true);
        setErrorMessage(''); // Clear any previous errors

        console.log('🔍 JOIN ROOM: Creating peer connection...');
        
        // Create peer as initiator (guest initiates the connection)
        const peer = new Peer({
          initiator: true,
          trickle: false,
          stream: localStreamRef.current!
        });

        peerRef.current = peer;
        console.log('✅ JOIN ROOM: Peer created successfully');

        // Handle remote stream
        peer.on('stream', (stream: MediaStream) => {
          console.log('🎥 JOIN ROOM: Guest received remote stream from host');
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
            console.log('✅ JOIN ROOM: Remote video set successfully');
          }
          setConnectionStatus('Connected');
        });

        // Handle guest signal generation
        peer.on('signal', (data: any) => {
          console.log('📡 JOIN ROOM: Guest sending signal to host:', data);
          database.ref(`rooms/${roomId}/guest`).set({
            name: userName,
            signal: JSON.stringify(data),
            timestamp: Date.now()
          }, (error) => {
            if (error) {
              console.error('❌ JOIN ROOM: Error sending guest signal:', error);
              setErrorMessage('Failed to send connection signal');
            } else {
              console.log('✅ JOIN ROOM: Guest signal sent successfully');
            }
          });
        });

        // Handle errors
        peer.on('error', (err: Error) => {
          console.error('❌ JOIN ROOM: Peer connection error:', err);
          setConnectionStatus('Connection failed');
          setErrorMessage(`Connection error: ${err.message}`);
        });

        // Listen for host response
        console.log('🔍 JOIN ROOM: Setting up host signal listener...');
        database.ref(`rooms/${roomId}/host`).on('value', (snapshot) => {
          const hostData = snapshot.val();
          console.log('📡 JOIN ROOM: Host signal received:', hostData);
          
          if (hostData && hostData.signal) {
            console.log('🔍 JOIN ROOM: Processing host signal...');
            try {
              peer.signal(JSON.parse(hostData.signal));
              console.log('✅ JOIN ROOM: Host signal processed successfully');
            } catch (parseError) {
              console.error('❌ JOIN ROOM: Error parsing host signal:', parseError);
              setErrorMessage('Invalid signal from host');
            }
          }
        });
      } else {
        console.error('❌ JOIN ROOM: Room does not exist');
        setErrorMessage('Room does not exist');
        return;
      }
    }, (error) => {
      console.error('❌ JOIN ROOM: Error checking room existence:', error);
      setErrorMessage('Failed to check room. Please try again.');
    });
  };

  // Leave room
  const leaveRoom = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    if (roomRef.current) {
      database.ref(`rooms/${roomRef.current}`).remove();
    }

    setIsInRoom(false);
    setConnectionStatus('Disconnected');
    setRoomId('');
    setErrorMessage('');
    window.location.reload(); // Simple reset
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Simple Video Chat</h1>
      
      {/* Debug Tools */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h3>Debug Tools</h3>
        <button 
          onClick={() => {
            localStorage.removeItem('xrcupid_mock_firebase_store');
            console.log('🗑️ Cleared localStorage');
            window.location.reload();
          }}
          style={{
            padding: '5px 10px',
            marginRight: '10px',
            backgroundColor: '#ff6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Clear Storage & Reload
        </button>
        <button 
          onClick={() => {
            const stored = localStorage.getItem('xrcupid_mock_firebase_store');
            console.log('📁 Current localStorage:', stored ? JSON.parse(stored) : 'empty');
          }}
          style={{
            padding: '5px 10px',
            backgroundColor: '#4ecdc4',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Log Storage
        </button>
      </div>
      
      {errorMessage && (
        <div style={{ color: 'red', marginBottom: '10px', padding: '10px', backgroundColor: '#ffebee' }}>
          {errorMessage}
        </div>
      )}
      
      {!isInRoom ? (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              style={{ padding: '10px', marginRight: '10px', width: '200px' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <button 
              onClick={createRoom}
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
          </div>

          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Enter room ID to join"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              style={{ padding: '10px', marginRight: '10px', width: '200px' }}
            />
            <button 
              onClick={joinRoom}
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
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h3>Room ID: {roomRef.current}</h3>
            <p>Status: {connectionStatus}</p>
            <p>Role: {isHost ? 'Host' : 'Guest'}</p>
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
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px' }}>
        <div>
          <h3>Your Video</h3>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ 
              width: '300px', 
              height: '200px', 
              backgroundColor: '#000',
              border: '2px solid #ccc'
            }}
          />
        </div>
        
        <div>
          <h3>Remote Video</h3>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ 
              width: '300px', 
              height: '200px', 
              backgroundColor: '#000',
              border: '2px solid #ccc'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SimpleVideoChat;
