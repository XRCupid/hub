import React, { useState, useEffect, useRef } from 'react';
import AvatarView from './AvatarView';
import './CoachCallTab.css';
import { useVoice } from "@humeai/voice-react"; // Import useVoice

const CoachCallTab: React.FC = () => {
  const [isVideoVisible, setIsVideoVisible] = useState(true);
  const [userStream, setUserStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { connect, disconnect, status, messages } = useVoice(); // Initialize useVoice

  const toggleUserVideo = async () => {
    if (isVideoVisible && userStream) {
      userStream.getTracks().forEach(track => track.stop());
      setUserStream(null);
      setIsVideoVisible(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setUserStream(stream);
        setIsVideoVisible(true);
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setIsVideoVisible(false);
      }
    }
  };

  useEffect(() => {
    if (isVideoVisible && userStream && videoRef.current) {
      videoRef.current.srcObject = userStream;
    }
  }, [isVideoVisible, userStream]);

  useEffect(() => {
    let active = true;
    if (isVideoVisible) {
        const initVideo = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                if (active) {
                  setUserStream(stream);
                }
            } catch (err) {
                console.error("Error accessing webcam on initial load:", err);
                if (active) {
                  setIsVideoVisible(false);
                }
            }
        };
        initVideo();
    }
    return () => {
      active = false;
      if (userStream) {
        userStream.getTracks().forEach(track => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Log Hume EVI messages and update UI
  useEffect(() => {
    if (messages.length > 0) {
      console.log("Hume EVI Messages:", messages);
      // This effect will run when messages array updates
    }
  }, [messages]);

  const handleMicToggle = () => {
    if (status.value === 'connected') {
      disconnect();
    } else if (status.value === 'disconnected' || status.value === 'error') {
      connect().catch(e => console.error("Hume EVI Connection Error:", e));
    }
  };

  const getMicButtonText = () => {
    switch (status.value) {
      case 'disconnected':
        return 'Connect Mic';
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return 'Disconnect Mic';
      case 'error':
        return 'Mic Error (Retry)';
      default:
        return 'Mic';
    }
  };

  return (
    <div className="coach-call-container">
      <div className="main-panel">
        <div className="npc-panel">
          <h2>Coach NPC</h2>
          <div className="avatar-container">
            <AvatarView />
          </div>
        </div>
        <div className="user-panel">
          <div className="user-video-controls">
            <h3>You</h3>
            <button onClick={toggleUserVideo} type="button">
              {isVideoVisible && userStream ? 'Turn Off Video' : 'Turn On Video'}
            </button>
          </div>
          {isVideoVisible && userStream && (
            <div className="user-video-container">
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', transform: 'scaleX(-1)' }} />
            </div>
          )}
          {(!isVideoVisible || !userStream) && (
            <div className="user-video-placeholder">
              Your video is off.
            </div>
          )}
        </div>
      </div>
      <div className="communication-panel">
        <button onClick={handleMicToggle} type="button" disabled={status.value === 'connecting'}>
          {getMicButtonText()}
        </button>
        <input type="text" placeholder="Type your message (text input coming soon)..." readOnly />
        <button type="button">Send (TBD)</button>
      </div>
      <div className="chat-history-panel">
        {messages.map((msg, index) => {
          // User's finalized chat message
          if (msg.type === 'user_message' && msg.message && typeof msg.message.content === 'string') {
            return <p key={`user-${index}`}><strong>You:</strong> {msg.message.content}</p>;
          }
          // Assistant's chat message
          if (msg.type === 'assistant_message' && msg.message && typeof msg.message.content === 'string') {
            return <p key={`assistant-${index}`}><strong>NPC:</strong> {msg.message.content}</p>;
          }
          // Interim user transcript
          /*
          if (msg.type === 'transcript_chunk' && msg.message?.text) {
            // console.log('User transcript chunk:', msg.message.text); // Log if needed
            // Example: Display interim transcript if desired for live feedback:
            // return <p key={`transcript-${index}`} style={{ fontStyle: 'italic', color: 'grey' }}>{msg.message.text}</p>;
            return null; // Not displaying chunks in the main chat UI for now
          }
          */
          
          // Fallback for any other message types you might want to log or handle
          // console.log('Other EVI message type:', msg.type, msg); 
          return null; 
        })}
        {messages.length === 0 && <p>Chat history will appear here...</p>}
      </div>
    </div>
  );
};

export default CoachCallTab;
