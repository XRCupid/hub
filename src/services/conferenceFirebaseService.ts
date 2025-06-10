import { database } from '../firebaseConfig';
import { ref, set, push, onValue, off, get, DataSnapshot, Database } from 'firebase/database';

interface Room {
  host: string;
  participants: string[];
  createdAt: string;
}

class ConferenceFirebaseService {
  private db: Database | null = database;
  
  // Generate a 6-character room code
  generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Create a new room
  async createRoom(hostName: string): Promise<string | null> {
    if (!this.db) return null;
    
    try {
      const roomId = this.generateRoomCode();
      const roomRef = ref(this.db, `conference-rooms/${roomId}`);
      
      await set(roomRef, {
        host: hostName,
        participants: [hostName],
        createdAt: new Date().toISOString()
      });
      
      return roomId;
    } catch (error) {
      console.error('Error creating room:', error);
      return null;
    }
  }

  // Join an existing room
  async joinRoom(roomId: string, participantName: string): Promise<boolean> {
    if (!this.db) return false;
    
    try {
      const roomRef = ref(this.db, `conference-rooms/${roomId}`);
      const snapshot = await get(roomRef);
      
      if (!snapshot.exists()) {
        return false;
      }
      
      const roomData = snapshot.val();
      const participants = roomData.participants || [];
      
      if (!participants.includes(participantName)) {
        participants.push(participantName);
        await set(ref(this.db, `conference-rooms/${roomId}/participants`), participants);
      }
      
      return true;
    } catch (error) {
      console.error('Error joining room:', error);
      return false;
    }
  }

  // Get room data
  async getRoom(roomId: string): Promise<Room | null> {
    if (!this.db) return null;
    
    try {
      const roomRef = ref(this.db, `conference-rooms/${roomId}`);
      const snapshot = await get(roomRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      return snapshot.val();
    } catch (error) {
      console.error('Error getting room:', error);
      return null;
    }
  }

  // Listen to room updates
  onRoomUpdate(roomId: string, callback: (data: any) => void): () => void {
    if (!this.db) return () => {};
    
    const roomRef = ref(this.db, `conference-rooms/${roomId}`);
    
    const listener = (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    };
    
    onValue(roomRef, listener);
    
    // Return unsubscribe function
    return () => {
      off(roomRef, 'value', listener);
    };
  }

  // Send WebRTC signal
  async sendSignal(roomId: string, fromPeer: string, toPeer: string, signal: any): Promise<void> {
    if (!this.db) return;
    
    try {
      const signalsRef = ref(this.db, `conference-rooms/${roomId}/signals`);
      const newSignalRef = push(signalsRef);
      
      await set(newSignalRef, {
        from: fromPeer,
        to: toPeer,
        signal,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending signal:', error);
    }
  }

  // Listen for signals
  onSignal(roomId: string, myPeerId: string, callback: (data: any) => void): () => void {
    if (!this.db) return () => {};
    
    const signalsRef = ref(this.db, `conference-rooms/${roomId}/signals`);
    
    const listener = (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        const signals = snapshot.val();
        Object.values(signals).forEach((signal: any) => {
          if (signal.to === myPeerId) {
            callback({
              from: signal.from,
              signal: signal.signal
            });
          }
        });
      }
    };
    
    onValue(signalsRef, listener);
    
    // Return unsubscribe function
    return () => {
      off(signalsRef, 'value', listener);
    };
  }

  // Generic onSnapshot method for compatibility with mock service
  onSnapshot(path: string, callback: (data: any) => void): () => void {
    if (!this.db) return () => {};
    
    const dataRef = ref(this.db, path);
    
    const listener = (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    };
    
    onValue(dataRef, listener);
    
    // Return unsubscribe function
    return () => {
      off(dataRef, 'value', listener);
    };
  }

  // Clean up room
  async cleanupRoom(roomId: string): Promise<void> {
    if (!this.db) return;
    
    try {
      const roomRef = ref(this.db, `conference-rooms/${roomId}`);
      await set(roomRef, null);
    } catch (error) {
      console.error('Error cleaning up room:', error);
    }
  }

  // Get mobile join URL
  getMobileJoinUrl(roomId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/conference-mobile?room=${roomId}`;
  }
}

export const conferenceFirebaseService = new ConferenceFirebaseService();
