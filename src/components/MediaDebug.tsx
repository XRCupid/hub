import React, { useEffect, useState } from 'react';

export const MediaDebug: React.FC = () => {
  const [mediaState, setMediaState] = useState({
    hasVideo: false,
    hasAudio: false,
    error: null as string | null,
    devices: [] as MediaDeviceInfo[]
  });

  useEffect(() => {
    const checkMedia = async () => {
      try {
        // Get available devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        const audioDevices = devices.filter(d => d.kind === 'audioinput');
        
        console.log('[MediaDebug] Available devices:', {
          video: videoDevices.length,
          audio: audioDevices.length,
          all: devices
        });
        
        // Try to get stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        setMediaState({
          hasVideo: stream.getVideoTracks().length > 0,
          hasAudio: stream.getAudioTracks().length > 0,
          error: null,
          devices
        });
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        
      } catch (error: any) {
        console.error('[MediaDebug] Error:', error);
        setMediaState(prev => ({
          ...prev,
          error: error.message
        }));
      }
    };
    
    checkMedia();
  }, []);
  
  return (
    <div style={{
      position: 'fixed',
      top: 10,
      left: 10,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 10000
    }}>
      <h4>Media Debug</h4>
      <div>Video: {mediaState.hasVideo ? '✅' : '❌'}</div>
      <div>Audio: {mediaState.hasAudio ? '✅' : '❌'}</div>
      <div>Video Devices: {mediaState.devices.filter(d => d.kind === 'videoinput').length}</div>
      <div>Audio Devices: {mediaState.devices.filter(d => d.kind === 'audioinput').length}</div>
      {mediaState.error && <div style={{color: 'red'}}>Error: {mediaState.error}</div>}
    </div>
  );
};
