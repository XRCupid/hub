import { database } from '../firebase';
import SimplePeer from 'simple-peer';

interface SignalData {
  signal: any;
  timestamp: number;
  processed?: boolean;
}

interface RoomData {
  host: string;
  guest?: string;
  created: number;
  status: 'waiting' | 'connected' | 'ended';
}

export class WebRTCSignalingService {
  private roomId: string;
  private isHost: boolean;
  private listeners: Map<string, any> = new Map();
  private signalQueue: SignalData[] = [];
  private peer: SimplePeer.Instance | null = null;
  private processingSignals = false;
  private connectionTimeout: NodeJS.Timeout | null = null;

  constructor(roomId: string, isHost: boolean) {
    this.roomId = roomId;
    this.isHost = isHost;
  }

  async createRoom(hostName: string): Promise<void> {
    const roomData: RoomData = {
      host: hostName,
      created: Date.now(),
      status: 'waiting'
    };

    await database.ref(`rooms/${this.roomId}`).set(roomData);
    console.log(`✅ Room ${this.roomId} created`);
  }

  async joinRoom(guestName: string): Promise<RoomData | null> {
    const snapshot = await database.ref(`rooms/${this.roomId}`).once('value');
    
    if (!snapshot.exists()) {
      console.error(`❌ Room ${this.roomId} not found`);
      return null;
    }

    const roomData = snapshot.val() as RoomData;
    
    await database.ref(`rooms/${this.roomId}`).update({
      guest: guestName,
      status: 'connected'
    });

    console.log(`✅ Joined room ${this.roomId}`);
    return roomData;
  }

  setupSignaling(peer: SimplePeer.Instance): void {
    this.peer = peer;
    
    // Send signals to Firebase
    peer.on('signal', (signal) => {
      this.sendSignal(signal);
    });

    // Listen for incoming signals
    this.listenForSignals();

    // Set connection timeout
    this.connectionTimeout = setTimeout(() => {
      if (peer.connected === false) {
        console.error('❌ Connection timeout - no response from peer');
        this.cleanup();
      }
    }, 30000);

    // Clear timeout on successful connection
    peer.on('connect', () => {
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      console.log('✅ Peer connected, timeout cleared');
    });
  }

  private async sendSignal(signal: any): Promise<void> {
    const targetPath = this.isHost 
      ? `rooms/${this.roomId}/signals/host-to-guest`
      : `rooms/${this.roomId}/signals/guest-to-host`;

    try {
      await database.ref(targetPath).push({
        signal,
        timestamp: Date.now()
      });
      console.log(`📡 Signal sent (${signal.type || 'data'})`);
    } catch (error) {
      console.error('❌ Failed to send signal:', error);
    }
  }

  private listenForSignals(): void {
    const sourcePath = this.isHost
      ? `rooms/${this.roomId}/signals/guest-to-host`
      : `rooms/${this.roomId}/signals/host-to-guest`;

    // Use 'value' listener to get all signals at once, then process new ones
    const listener = database.ref(sourcePath).on('value', (snapshot) => {
      const signals = snapshot.val();
      
      if (!signals) return;

      // Convert to array and sort by timestamp
      const signalArray = Object.entries(signals)
        .map(([key, value]: [string, any]) => ({
          key,
          ...value
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

      // Process unprocessed signals
      signalArray.forEach(signalData => {
        if (!signalData.processed) {
          this.signalQueue.push(signalData);
          // Mark as processed
          database.ref(`${sourcePath}/${signalData.key}`).update({ processed: true });
        }
      });

      // Process queue
      this.processSignalQueue();
    });

    this.listeners.set(sourcePath, listener);
    console.log(`👂 Listening for signals on ${sourcePath}`);
  }

  private processSignalQueue(): void {
    if (this.processingSignals || !this.peer || this.signalQueue.length === 0) {
      return;
    }

    this.processingSignals = true;

    while (this.signalQueue.length > 0 && this.peer && !this.peer.destroyed) {
      const signalData = this.signalQueue.shift();
      
      if (signalData?.signal) {
        try {
          console.log(`📨 Processing signal (${signalData.signal.type || 'data'})`);
          this.peer.signal(signalData.signal);
        } catch (error) {
          console.error('❌ Error processing signal:', error);
        }
      }
    }

    this.processingSignals = false;
  }

  async updateRoomStatus(status: 'waiting' | 'connected' | 'ended'): Promise<void> {
    try {
      await database.ref(`rooms/${this.roomId}`).update({ status });
    } catch (error) {
      console.error('Failed to update room status:', error);
    }
  }

  cleanup(): void {
    // Stop all listeners
    this.listeners.forEach((listener, path) => {
      database.ref(path).off('value', listener);
    });
    this.listeners.clear();

    // Clear timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // Clear signal queue
    this.signalQueue = [];
    this.processingSignals = false;

    // Remove room data
    database.ref(`rooms/${this.roomId}`).remove();

    console.log('✅ Signaling service cleaned up');
  }
}
