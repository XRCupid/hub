// WebSocket Tunnel for WebRTC media relay
// This implementation uses a data channel tunnel approach to bypass TURN requirements

import { database } from '../firebase';

export class WebSocketTunnel {
  private roomId: string;
  private isHost: boolean;
  private onRemoteStream: (stream: MediaStream) => void;
  private localStream: MediaStream | null = null;
  private pc: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private remoteVideoElement: HTMLVideoElement | null = null;
  private mediaSource: MediaSource | null = null;
  private sourceBuffer: SourceBuffer | null = null;
  private chunkQueue: ArrayBuffer[] = [];
  private isProcessingQueue = false;

  constructor(
    roomId: string, 
    isHost: boolean,
    onRemoteStream: (stream: MediaStream) => void
  ) {
    this.roomId = roomId;
    this.isHost = isHost;
    this.onRemoteStream = onRemoteStream;
  }

  async connect(localStream: MediaStream) {
    this.localStream = localStream;
    
    console.log(`🚇 [TUNNEL] Initializing ${this.isHost ? 'host' : 'guest'} tunnel`);
    
    // Create a basic peer connection with only STUN servers
    this.pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    
    // Set up data channel for media tunneling
    if (this.isHost) {
      // Host creates data channel
      this.dataChannel = this.pc.createDataChannel('media-tunnel', {
        ordered: true,
        maxRetransmits: 3
      });
      
      this.dataChannel.binaryType = 'arraybuffer';
      
      this.dataChannel.onopen = () => {
        console.log('🚇 [TUNNEL] Data channel opened');
        this.startMediaStream();
      };
      
      this.dataChannel.onmessage = (event) => {
        this.handleMediaData(event.data);
      };
      
      // Listen for guest signals
      const guestRef = database.ref(`conference-rooms/${this.roomId}/tunnel-guest`);
      guestRef.on('child_added', (snapshot: any) => {
        const signal = snapshot.val();
        if (signal && typeof signal === 'string') {
          try {
            this.pc?.addIceCandidate(new RTCIceCandidate(JSON.parse(signal)));
          } catch (err) {
            console.error('🚇 [TUNNEL] Error adding ICE candidate:', err);
          }
        }
      });
      
      // Create offer
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      
      // Send offer to Firebase
      await database.ref(`conference-rooms/${this.roomId}/tunnel-host-offer`).set(
        JSON.stringify(offer)
      );
      
    } else {
      // Guest waits for host offer
      const offerRef = database.ref(`conference-rooms/${this.roomId}/tunnel-host-offer`);
      
      return new Promise<any>((resolve, reject) => {
        offerRef.once('value', async (snapshot: any) => {
          const offerData = snapshot.val();
          if (!offerData) {
            reject('No host offer found');
            return;
          }
          
          try {
            const offer = JSON.parse(offerData);
            await this.pc!.setRemoteDescription(new RTCSessionDescription(offer));
            
            // Guest receives data channel
            this.pc!.ondatachannel = (event) => {
              this.dataChannel = event.channel;
              this.dataChannel.binaryType = 'arraybuffer';
              
              this.dataChannel.onopen = () => {
                console.log('🚇 [TUNNEL] Guest data channel opened');
                this.startMediaStream();
              };
              
              this.dataChannel.onmessage = (event) => {
                this.handleMediaData(event.data);
              };
            };
            
            // Create answer
            const answer = await this.pc!.createAnswer();
            await this.pc!.setLocalDescription(answer);
            
            // Send answer to Firebase
            await database.ref(`conference-rooms/${this.roomId}/tunnel-guest-answer`).set(
              JSON.stringify(answer)
            );
            
            resolve(true);
          } catch (err) {
            reject(err);
          }
        });
      });
    }
    
    // Set up ICE candidate handling
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        const ref = this.isHost ? 'tunnel-host' : 'tunnel-guest';
        database.ref(`conference-rooms/${this.roomId}/${ref}`).push(
          JSON.stringify(event.candidate)
        );
      }
    };
    
    // Host waits for guest answer
    if (this.isHost) {
      const answerRef = database.ref(`conference-rooms/${this.roomId}/tunnel-guest-answer`);
      return new Promise<any>((resolve) => {
        answerRef.once('value', async (snapshot: any) => {
          const answerData = snapshot.val();
          if (answerData) {
            try {
              const answer = JSON.parse(answerData);
              await this.pc!.setRemoteDescription(new RTCSessionDescription(answer));
              resolve(true);
            } catch (err) {
              console.error('🚇 [TUNNEL] Error setting answer:', err);
              resolve(false);
            }
          }
        });
      });
    }
    
    return true;
  }

  private startMediaStream() {
    if (!this.localStream || !this.dataChannel) return;
    
    try {
      const mimeType = 'video/webm;codecs=vp8,opus';
      
      this.mediaRecorder = new MediaRecorder(this.localStream, {
        mimeType,
        videoBitsPerSecond: 500000 // 500 kbps for data channel
      });
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0 && 
            this.dataChannel?.readyState === 'open') {
          // Convert blob to arraybuffer and send
          event.data.arrayBuffer().then(buffer => {
            try {
              // Split large chunks to avoid data channel limits
              const CHUNK_SIZE = 16384; // 16KB chunks
              for (let i = 0; i < buffer.byteLength; i += CHUNK_SIZE) {
                const chunk = buffer.slice(i, i + CHUNK_SIZE);
                this.dataChannel!.send(chunk);
              }
            } catch (err) {
              console.error('🚇 [TUNNEL] Error sending media chunk:', err);
            }
          });
        }
      };
      
      // Send chunks every 100ms
      this.mediaRecorder.start(100);
      console.log('🚇 [TUNNEL] Started streaming local media');
      
    } catch (error) {
      console.error('🚇 [TUNNEL] Failed to start media stream:', error);
    }
  }

  private handleMediaData(data: ArrayBuffer) {
    if (!this.remoteVideoElement) {
      // Create video element and MediaSource
      this.remoteVideoElement = document.createElement('video');
      this.remoteVideoElement.autoplay = true;
      this.remoteVideoElement.playsInline = true;
      this.remoteVideoElement.muted = true; // Mute to allow autoplay
      
      // Create a fake MediaStream to satisfy the interface
      const canvas = document.createElement('canvas');
      const stream = canvas.captureStream();
      this.onRemoteStream(stream);
      
      // Use MediaSource for actual playback
      if ('MediaSource' in window && MediaSource.isTypeSupported('video/webm; codecs="vp8,opus"')) {
        this.mediaSource = new MediaSource();
        this.remoteVideoElement.src = URL.createObjectURL(this.mediaSource);
        
        this.mediaSource.addEventListener('sourceopen', () => {
          try {
            this.sourceBuffer = this.mediaSource!.addSourceBuffer('video/webm; codecs="vp8,opus"');
            
            this.sourceBuffer.addEventListener('updateend', () => {
              this.processQueue();
            });
            
            // Process initial data
            this.chunkQueue.push(data);
            this.processQueue();
          } catch (err) {
            console.error('🚇 [TUNNEL] Error creating source buffer:', err);
          }
        });
      } else {
        console.error('🚇 [TUNNEL] MediaSource not supported');
      }
    } else {
      // Add to queue
      this.chunkQueue.push(data);
      this.processQueue();
    }
  }

  private processQueue() {
    if (this.isProcessingQueue || !this.sourceBuffer || this.sourceBuffer.updating) {
      return;
    }
    
    if (this.chunkQueue.length > 0) {
      this.isProcessingQueue = true;
      const chunk = this.chunkQueue.shift()!;
      
      try {
        this.sourceBuffer.appendBuffer(chunk);
      } catch (err) {
        console.error('🚇 [TUNNEL] Error appending buffer:', err);
        this.isProcessingQueue = false;
        
        // Try to recover
        if (this.sourceBuffer && !this.sourceBuffer.updating) {
          try {
            // Clear buffer and retry
            const buffered = this.sourceBuffer.buffered;
            if (buffered.length > 0) {
              this.sourceBuffer.remove(0, buffered.end(buffered.length - 1));
            }
          } catch (e) {
            console.error('🚇 [TUNNEL] Failed to clear buffer:', e);
          }
        }
      }
      
      this.isProcessingQueue = false;
    }
  }

  disconnect() {
    console.log('🚇 [TUNNEL] Disconnecting');
    
    this.mediaRecorder?.stop();
    this.dataChannel?.close();
    this.pc?.close();
    
    if (this.remoteVideoElement && this.remoteVideoElement.src) {
      URL.revokeObjectURL(this.remoteVideoElement.src);
    }
    
    this.mediaRecorder = null;
    this.dataChannel = null;
    this.pc = null;
    this.remoteVideoElement = null;
    this.mediaSource = null;
    this.sourceBuffer = null;
    this.chunkQueue = [];
  }
}
