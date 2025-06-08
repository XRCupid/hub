import React, { useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer';

const SimpleWorkingChat: React.FC = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peer1, setPeer1] = useState<any>(null);
  const [peer2, setPeer2] = useState<any>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Initialize media
  useEffect(() => {
    const initMedia = async () => {
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
      }
    };
    initMedia();
  }, []);

  const startConnection = () => {
    if (!localStream) return;

    // Create host peer (initiator)
    const hostPeer = new Peer({
      initiator: true,
      trickle: false,
      stream: localStream
    });

    // Create guest peer (non-initiator)  
    const guestPeer = new Peer({
      initiator: false,
      trickle: false,
      stream: localStream
    });

    // Host sends signal to guest
    hostPeer.on('signal', (data: any) => {
      guestPeer.signal(data);
    });

    // Guest sends signal back to host
    guestPeer.on('signal', (data: any) => {
      hostPeer.signal(data);
    });

    // When guest connects, show remote video
    guestPeer.on('stream', (stream: MediaStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      setIsConnected(true);
    });

    guestPeer.on('connect', () => {
      console.log('Connected!');
      setIsConnected(true);
    });

    hostPeer.on('error', (err: Error) => {
      console.error('Host peer error:', err);
    });

    guestPeer.on('error', (err: Error) => {
      console.error('Guest peer error:', err);
    });

    setPeer1(hostPeer);
    setPeer2(guestPeer);
  };

  const disconnect = () => {
    if (peer1) peer1.destroy();
    if (peer2) peer2.destroy();
    setPeer1(null);
    setPeer2(null);
    setIsConnected(false);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Simple Working Chat - Same Tab Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={startConnection}
          disabled={!localStream || peer1}
          style={{ 
            padding: '15px 30px', 
            marginRight: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Test WebRTC Connection
        </button>
        
        <button 
          onClick={disconnect}
          disabled={!peer1}
          style={{ 
            padding: '15px 30px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Disconnect
        </button>
      </div>

      <div style={{ marginBottom: '20px', fontSize: '18px' }}>
        <strong>Status: </strong>
        <span style={{ color: isConnected ? 'green' : 'red', fontWeight: 'bold' }}>
          {isConnected ? '✅ CONNECTED' : '❌ NOT CONNECTED'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div>
          <h3>Your Camera</h3>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            style={{ width: '350px', height: '250px', border: '2px solid #333', borderRadius: '10px' }}
          />
        </div>
        
        <div>
          <h3>Remote Video (should be same as yours)</h3>
          <video
            ref={remoteVideoRef}
            autoPlay
            style={{ width: '350px', height: '250px', border: '2px solid #333', borderRadius: '10px' }}
          />
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '5px' }}>
        <h4>How This Works:</h4>
        <p>This creates two WebRTC peers in the same tab that connect to each other. If this works:</p>
        <ul>
          <li>✅ Your WebRTC implementation is correct</li>
          <li>✅ Camera/microphone permissions work</li>
          <li>✅ The issue is only with cross-window signaling</li>
        </ul>
        <p><strong>Expected result:</strong> You should see your camera feed in both videos and "CONNECTED" status.</p>
      </div>
    </div>
  );
};

export default SimpleWorkingChat;
