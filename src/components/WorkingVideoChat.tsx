import React, { useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer';

const WorkingVideoChat: React.FC = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peer, setPeer] = useState<any>(null);
  const [isInitiator, setIsInitiator] = useState<boolean>(false);
  const [signalData, setSignalData] = useState<string>('');
  const [incomingSignal, setIncomingSignal] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');

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

  const createConnection = (initiator: boolean) => {
    if (!localStream) return;

    const newPeer = new Peer({
      initiator,
      trickle: false,
      stream: localStream
    });

    newPeer.on('signal', (data: any) => {
      setSignalData(JSON.stringify(data));
    });

    newPeer.on('connect', () => {
      setIsConnected(true);
    });

    newPeer.on('stream', (stream: MediaStream) => {
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });

    newPeer.on('error', (err: Error) => {
      console.error('Peer error:', err);
    });

    setPeer(newPeer);
  };

  const startAsHost = () => {
    setIsInitiator(true);
    createConnection(true);
  };

  const startAsGuest = () => {
    setIsInitiator(false);
    createConnection(false);
  };

  const connectToPeer = () => {
    if (peer && incomingSignal) {
      try {
        peer.signal(JSON.parse(incomingSignal));
      } catch (error) {
        console.error('Error parsing signal:', error);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Working Video Chat - Manual Signaling</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Enter your name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          style={{ padding: '8px', marginRight: '10px', width: '200px' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={startAsHost}
          disabled={!localStream || !userName}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Start as Host
        </button>
        <button 
          onClick={startAsGuest}
          disabled={!localStream || !userName}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Start as Guest
        </button>
      </div>

      {peer && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Your Signal (copy and send to other person):</h3>
          <textarea
            value={signalData}
            readOnly
            rows={6}
            cols={80}
            style={{ padding: '10px', fontSize: '12px' }}
          />
          <br />
          <button 
            onClick={() => copyToClipboard(signalData)}
            style={{ marginTop: '5px', padding: '5px 10px' }}
          >
            Copy Signal
          </button>
        </div>
      )}

      {peer && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Paste Other Person's Signal Here:</h3>
          <textarea
            value={incomingSignal}
            onChange={(e) => setIncomingSignal(e.target.value)}
            rows={6}
            cols={80}
            placeholder="Paste the signal from the other person here..."
            style={{ padding: '10px', fontSize: '12px' }}
          />
          <br />
          <button 
            onClick={connectToPeer}
            disabled={!incomingSignal}
            style={{ 
              marginTop: '5px', 
              padding: '10px 20px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Connect
          </button>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <strong>Status: </strong>
        <span style={{ color: isConnected ? 'green' : 'red' }}>
          {isConnected ? 'Connected' : 'Not Connected'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div>
          <h3>Your Video ({userName || 'You'})</h3>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            style={{ width: '300px', height: '200px', border: '1px solid #ccc' }}
          />
        </div>
        
        <div>
          <h3>Remote Video</h3>
          <video
            ref={remoteVideoRef}
            autoPlay
            style={{ width: '300px', height: '200px', border: '1px solid #ccc' }}
          />
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h4>Instructions:</h4>
        <ol>
          <li><strong>Person 1:</strong> Click "Start as Host", copy the signal</li>
          <li><strong>Person 2:</strong> Click "Start as Guest", copy the signal</li>
          <li><strong>Both:</strong> Paste each other's signals and click "Connect"</li>
          <li><strong>Result:</strong> You should see both video streams and "Connected" status</li>
        </ol>
        <p><em>This bypasses all Firebase/database issues by using manual copy-paste signaling.</em></p>
      </div>
    </div>
  );
};

export default WorkingVideoChat;
